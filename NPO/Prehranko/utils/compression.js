import { Buffer } from 'buffer';

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

const fdct8x8 = (block) => {
    let F = new Float64Array(64);
    for (let u = 0; u < 8; u++) {
        for (let v = 0; v < 8; v++) {
            let cu = (u === 0) ? 1 / Math.sqrt(2) : 1;
            let cv = (v === 0) ? 1 / Math.sqrt(2) : 1;
            let sum = 0;
            for (let x = 0; x < 8; x++) {
                for (let y = 0; y < 8; y++) {
                    sum += block[x * 8 + y] * COS_TABLE[u][x] * COS_TABLE[v][y];
                }
            }
            F[u * 8 + v] = 0.25 * cu * cv * sum;
        }
    }
    return F;
};

export const compressImageDCT = async (pixelData, width, height, factor = 20) => {
    // RGB vrstni red je standard za dekompresijo na backendu
    const channelNames = ["R", "G", "B"];
    let finalBuffers = [];

    if (!pixelData || pixelData.length === 0) {
        throw new Error("Pixel data je prazen.");
    }

    for (let c = 0; c < 3; c++) {
        let channelBlocks = [];
        for (let i = 0; i < height; i += 8) {
            for (let j = 0; j < width; j += 8) {
                let block = new Float64Array(64);
                for (let x = 0; x < 8; x++) {
                    for (let y = 0; y < 8; y++) {
                        let pixelIdx = ((i + x) * width + (j + y)) * 4;
                        // c=0 -> R, c=1 -> G, c=2 -> B
                        block[x * 8 + y] = pixelData[pixelIdx + c] - 128;
                    }
                }

                let F = fdct8x8(block);
                let zigzagged = new Float64Array(64);
                let limit = 63 - factor;
                for (let k = 0; k < 64; k++) {
                    let [u, v] = ZIGZAG_INDICES[k];
                    zigzagged[k] = (k > limit) ? 0 : F[u * 8 + v];
                }
                channelBlocks.push(zigzagged);
            }
        }

        let channelHeader = Buffer.alloc(5);
        channelHeader.write(channelNames[c], 0, 'ascii');
        channelHeader.writeUInt32LE(channelBlocks.length, 1);
        finalBuffers.push(channelHeader);

        for (let zz of channelBlocks) {
            let blockDataParts = [];
            let dcBuf = Buffer.alloc(4);
            dcBuf.writeFloatLE(zz[0]);
            blockDataParts.push(dcBuf);

            let runLength = 0;
            for (let k = 1; k < 64; k++) {
                let val = zz[k];
                if (val === 0) {
                    runLength++;
                } else {
                    // Rule 0: Zapis zaporedja ničel + naslednja vrednost
                    let ruleBuf = Buffer.alloc(3);
                    ruleBuf.writeInt8(0, 0);
                    ruleBuf.writeUInt8(runLength, 1);
                    ruleBuf.writeUInt8(0, 2);
                    blockDataParts.push(ruleBuf);

                    let valBuf = Buffer.alloc(4);
                    valBuf.writeFloatLE(val);
                    blockDataParts.push(valBuf);
                    runLength = 0;
                }
            }

            // Če so na koncu bloka same ničle, zapišemo Rule 0 z runLength,
            // ampak backendu moramo "obljubiti", da ni več floatov
            if (runLength > 0) {
                let endBuf = Buffer.alloc(3);
                endBuf.writeInt8(0, 0);
                endBuf.writeUInt8(runLength, 1);
                endBuf.writeUInt8(0, 2);
                blockDataParts.push(endBuf);
            }

            let combinedBlock = Buffer.concat(blockDataParts);
            let blockHeader = Buffer.alloc(5);
            blockHeader.write('B', 0, 'ascii');
            blockHeader.writeUInt32LE(combinedBlock.length, 1);
            finalBuffers.push(blockHeader, combinedBlock);
        }
    }
    return Buffer.concat(finalBuffers);
};