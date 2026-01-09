const sharp = require('sharp');

// Vnaprej izračunana tabela kosinusov za IDCT
const COS_TABLE = Array.from({ length: 8 }, (_, u) =>
    Array.from({ length: 8 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 16))
);

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
 * @param {Buffer} binaryBuffer
 */
async function getJpegBase64(binaryBuffer, width, height) {
    let i = 0;
    const channels = {};
    const channelNames = ["B", "G", "R"];

    try {
        while (i < binaryBuffer.length) {
            let channelName = binaryBuffer.slice(i, i + 1).toString('ascii');
            i += 1;
            let blockCount = binaryBuffer.readUInt32LE(i);
            i += 4;

            let blocks = [];
            for (let b = 0; b < blockCount; b++) {
                if (i >= binaryBuffer.length) break;

                let bTag = binaryBuffer.slice(i, i + 1).toString('ascii');
                i += 1;
                let blockLen = binaryBuffer.readUInt32LE(i);
                i += 4;

                let blockData = binaryBuffer.slice(i, i + blockLen);
                i += blockLen;

                // --- RLE DEKODIRANJE BLOKA ---
                let j = 0;
                let dc = blockData.readFloatLE(j);
                j += 4;
                let data = [dc];

                while (j < blockData.length) {
                    let rule = blockData.readInt8(j);
                    j += 1;

                    if (rule === 0) { // Rule 0: [rule, runLength, bitLen] + (opcijsko Float)
                        let run = blockData.readUInt8(j);
                        j += 1;
                        j += 1; // Preskočimo bitLen (tisti ruleBuf.writeUInt8(0, 2))

                        for (let r = 0; r < run; r++) data.push(0);

                        // Če po ničlah sledi vrednost (ni konec bloka)
                        if (j + 4 <= blockData.length) {
                            data.push(blockData.readFloatLE(j));
                            j += 4;
                        }
                    } else if (rule === 1) { // Rule 1: [rule, bitLen] + Float
                        j += 1; // Preskočimo bitLen
                        if (j + 4 <= blockData.length) {
                            data.push(blockData.readFloatLE(j));
                            j += 4;
                        }
                    }
                }
                while (data.length < 64) data.push(0);
                blocks.push(data.slice(0, 64));
            }
            channels[channelName] = blocks;
        }
    } catch (e) {
        console.error("Kritična napaka pri dekompresiji:", e);
    }

    // 2. REKONSTRUKCIJA SLIKE
    const outBuffer = Buffer.alloc(width * height * 3);

    channelNames.forEach((name, cIdx) => {
        const blocks = channels[name];
        if (!blocks) return;

        let bIdx = 0;
        for (let r = 0; r < height; r += 8) {
            for (let c = 0; c < width; c += 8) {
                if (bIdx >= blocks.length) break;

                let zz = blocks[bIdx++];
                let F = new Float32Array(64);

                for (let k = 0; k < 64; k++) {
                    let [u, v] = ZIGZAG_INDICES[k];
                    F[u * 8 + v] = zz[k];
                }

                let restored = idct8x8(F);

                for (let x = 0; x < 8; x++) {
                    for (let y = 0; y < 8; y++) {
                        let val = Math.round(restored[x * 8 + y] + 128);
                        val = Math.max(0, Math.min(255, val));

                        // FRONTEND: BGR vrstni red
                        // Python kanal B (cIdx 0) -> SHARP kanal 2 (Blue)
                        // Python kanal G (cIdx 1) -> SHARP kanal 1 (Green)
                        // Python kanal R (cIdx 2) -> SHARP kanal 0 (Red)
                        let targetChannel = 2 - cIdx;
                        let pixelPos = ((r + x) * width + (c + y)) * 3 + targetChannel;

                        if (pixelPos < outBuffer.length) {
                            outBuffer[pixelPos] = val;
                        }
                    }
                }
            }
        }
    });

    return await sharp(outBuffer, { raw: { width, height, channels: 3 } })
        .jpeg()
        .toBuffer()
        .then(buf => buf.toString('base64'));
}

module.exports = { getJpegBase64 };