const sharp = require('sharp');

// Vnaprej izračunana tabela kosinusov za IDCT (pohitritev)
const COS_TABLE = Array.from({ length: 8 }, (_, u) =>
    Array.from({ length: 8 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 16))
);

// ZigZag mapa mora biti ISTA kot na Pythonu/Frontendu
const ZIGZAG_INDICES = [
    [0,0],[0,1],[1,0],[2,0],[1,1],[0,2],[0,3],[1,2],
    [2,1],[3,0],[4,0],[3,1],[2,2],[1,3],[0,4],[0,5],
    [1,4],[2,3],[3,2],[4,1],[5,0],[6,0],[5,1],[4,2],
    [3,3],[2,4],[1,5],[0,6],[0,7],[1,6],[2,5],[3,4],
    [4,3],[5,2],[6,1],[7,0],[7,1],[6,2],[5,3],[4,4],
    [3,5],[2,6],[1,7],[2,7],[3,6],[4,5],[5,4],[6,3],
    [7,2],[7,3],[6,4],[5,5],[4,6],[3,7],[4,7],[5,6],
    [6,5],[7,4],[7,5],[6,6],[5,7],[6,7],[7,6],[7,7]
];

/**
 * IDCT 8x8 transformacija
 */
function idct8x8(F) {
    let block = new Float32Array(64);
    for (let x = 0; x < 8; x++) {
        for (let y = 0; y < 8; y++) {
            let sum = 0;
            for (let u = 0; u < 8; u++) {
                for (let v = 0; v < 8; v++) {
                    let cu = (u === 0) ? 1 / Math.sqrt(2) : 1;
                    let cv = (v === 0) ? 1 / Math.sqrt(2) : 1;
                    sum += cu * cv * F[u * 8 + v] * COS_TABLE[u][x] * COS_TABLE[v][y];
                }
            }
            block[x * 8 + y] = 0.25 * sum;
        }
    }
    return block;
}

/**
 * Glavna funkcija, ki jo kličeš v routerju
 */
async function getJpegBase64(binaryBuffer, width, height) {
    let i = 0;
    const channels = {};
    const channelNames = ["B", "G", "R"]; // Vrstni red iz Pythona

    // 1. Dekodiranje binarnega RLE formata
    try {
        while (i < binaryBuffer.length) {
            let channelName = binaryBuffer.slice(i, i + 1).toString('ascii');
            i += 1;
            let blockCount = binaryBuffer.readUInt32LE(i);
            i += 4;

            let blocks = [];
            for (let b = 0; b < blockCount; b++) {
                if (binaryBuffer.slice(i, i + 1).toString('ascii') !== 'B') break;
                i += 1;
                let blockLen = binaryBuffer.readUInt32LE(i);
                i += 4;

                let blockData = binaryBuffer.slice(i, i + blockLen);
                i += blockLen;

                // Branje RLE znotraj bloka
                let j = 0;
                let dc = blockData.readFloatLE(j);
                j += 4;
                let data = [dc];

                while (j < blockData.length) {
                    let rule = blockData.readInt8(j);
                    j += 1;

                    if (rule === 0) { // Rule 0: Run-length of zeros
                        let run = blockData.readUInt8(j);
                        j += 1;
                        for (let r = 0; r < run; r++) data.push(0);

                        if (j + 5 <= blockData.length) {
                            j += 1; // preskoči bitLen byte
                            data.push(blockData.readFloatLE(j));
                            j += 4;
                        }
                    } else if (rule === 1) { // Rule 1: Next value is float
                        j += 1; // preskoči bitLen byte
                        data.push(blockData.readFloatLE(j));
                        j += 4;
                    }
                }
                while (data.length < 64) data.push(0);
                blocks.push(data.slice(0, 64));
            }
            channels[channelName] = blocks;
        }
    } catch (e) {
        console.error("Napaka pri razčlenjevanju binarnega bufferja:", e);
    }

    // 2. Rekonstrukcija pikslov (Inverzni ZigZag + IDCT + Color Merge)
    const outBuffer = Buffer.alloc(width * height * 3); // RGB buffer

    channelNames.forEach((name, cIdx) => {
        const blocks = channels[name];
        if (!blocks) return;

        let bIdx = 0;
        for (let r = 0; r < height; r += 8) {
            for (let c = 0; c < width; c += 8) {
                if (bIdx >= blocks.length) break;

                let zz = blocks[bIdx++];
                let F = new Float32Array(64);

                // Inverzni ZigZag
                for (let k = 0; k < 64; k++) {
                    let [u, v] = ZIGZAG_INDICES[k];
                    F[u * 8 + v] = zz[k];
                }

                // IDCT + Restoration (+128)
                let restored = idct8x8(F);

                for (let x = 0; x < 8; x++) {
                    for (let y = 0; y < 8; y++) {
                        let val = Math.round(restored[x * 8 + y] + 128);
                        val = Math.max(0, Math.min(255, val));

                        // Izračun pozicije v končnem RGB bufferju
                        // Python kanal B -> RGB[2], G -> RGB[1], R -> RGB[0]
                        let pixelPos = ((r + x) * width + (c + y)) * 3 + (2 - cIdx);
                        if (pixelPos < outBuffer.length) {
                            outBuffer[pixelPos] = val;
                        }
                    }
                }
            }
        }
    });

    // 3. Pretvorba v JPEG Base64 s Sharp
    const jpegBuffer = await sharp(outBuffer, {
        raw: { width, height, channels: 3 }
    })
        .jpeg()
        .toBuffer();

    return jpegBuffer.toString('base64');
}

module.exports = { getJpegBase64 };