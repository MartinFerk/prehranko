import { Buffer } from 'buffer';

// 1. Vnaprej izračunana tabela kosinusov za FDCT (hitrejše procesiranje)
const COS_TABLE = Array.from({ length: 8 }, (_, u) =>
    Array.from({ length: 8 }, (_, x) => Math.cos(((2 * x + 1) * u * Math.PI) / 16))
);

// 2. ZigZag mapa (indeksi u, v v 8x8 matriki) - ISTA KOT NA BACKENDU
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
 * POMOŽNA: FDCT 8x8 na enem kanalu
 */
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

/**
 * GLAVNA FUNKCIJA: compressImageDCT
 * @param {Uint8ClampedArray} pixelData - Surovi RGBA piksli iz Canvasa
 * @param {number} width - Širina slike (priporočeno 512)
 * @param {number} height - Višina slike (priporočeno 512)
 * @param {number} factor - Koliko koeficientov odrežemo (0-63). Večja vrednost = večja kompresija.
 */
export const compressImageDCT = async (pixelData, width, height, factor = 20) => {
    const channelNames = ["B", "G", "R"]; // BGR vrstni red za skladnost z OpenCV/Python
    let finalBuffers = [];

    // Preverjanje, če smo dobili podatke
    if (!pixelData || pixelData.length === 0) {
        throw new Error("Pixel data je prazen. Preveri zajem iz Canvasa.");
    }

    // Procesiramo vsak kanal posebej (Modra, Zelena, Rdeča)
    for (let c = 0; c < 3; c++) {
        let channelBlocks = [];

        for (let i = 0; i < height; i += 8) {
            for (let j = 0; j < width; j += 8) {
                let block = new Float64Array(64);

                // 1. Priprava 8x8 bloka (-128 centriranje za DCT)
                for (let x = 0; x < 8; x++) {
                    for (let y = 0; y < 8; y++) {
                        // pixelData je ploščat [R, G, B, A, R, G, B, A...]
                        // Izberemo ustrezen kanal (2-c) za BGR vrstni red
                        let pixelIdx = ((i + x) * width + (j + y)) * 4;
                        block[x * 8 + y] = pixelData[pixelIdx + (2 - c)] - 128;
                    }
                }

                // 2. Izračun DCT transformacije
                let F = fdct8x8(block);

                // 3. ZigZag skeniranje in uporaba faktorja kompresije
                let zigzagged = new Float64Array(64);
                let limit = 63 - factor; // Koliko koeficientov obdržimo
                for (let k = 0; k < 64; k++) {
                    if (k > limit) {
                        zigzagged[k] = 0;
                    } else {
                        let [u, v] = ZIGZAG_INDICES[k];
                        zigzagged[k] = F[u * 8 + v];
                    }
                }
                channelBlocks.push(zigzagged);
            }
        }

        // 4. Binarno pakiranje v tvoj specifičen RLE protokol
        // Glava kanala: Ime (1 byte) + Število blokov (4 bytes)
        let channelHeader = Buffer.alloc(5);
        channelHeader.write(channelNames[c], 0, 'ascii');
        channelHeader.writeUInt32LE(channelBlocks.length, 1);
        finalBuffers.push(channelHeader);

        for (let zz of channelBlocks) {
            let blockDataParts = [];

            // DC koeficient (prva vrednost) se zapiše kot Float (4 bytes)
            let dcBuf = Buffer.alloc(4);
            dcBuf.writeFloatLE(zz[0]);
            blockDataParts.push(dcBuf);

            let runLength = 0;
            for (let k = 1; k < 64; k++) {
                let val = zz[k];
                if (val === 0) {
                    runLength++;
                } else {
                    if (runLength > 0) {
                        // Rule 0: Zapis zaporedja ničel
                        let ruleBuf = Buffer.alloc(3);
                        ruleBuf.writeInt8(0, 0);       // Rule ID
                        ruleBuf.writeUInt8(runLength, 1); // Koliko ničel
                        ruleBuf.writeUInt8(0, 2);      // bitLen (neuporabljeno)
                        blockDataParts.push(ruleBuf);

                        let valBuf = Buffer.alloc(4);
                        valBuf.writeFloatLE(val);
                        blockDataParts.push(valBuf);
                        runLength = 0;
                    } else {
                        // Rule 1: Takojšen zapis vrednosti (brez predhodnih ničel)
                        let ruleBuf = Buffer.alloc(2);
                        ruleBuf.writeInt8(1, 0);       // Rule ID
                        ruleBuf.writeUInt8(0, 1);      // bitLen (neuporabljeno)
                        blockDataParts.push(ruleBuf);

                        let valBuf = Buffer.alloc(4);
                        valBuf.writeFloatLE(val);
                        blockDataParts.push(valBuf);
                    }
                }
            }

            // Zapis preostalih ničel na koncu bloka
            if (runLength > 0) {
                let endBuf = Buffer.alloc(3); // 3 namesto 2
                endBuf.writeInt8(0, 0);
                endBuf.writeUInt8(runLength, 1);
                endBuf.writeUInt8(0, 2);
                blockDataParts.push(endBuf);
            }

            // Sestavimo blok in dodamo glavo bloka ('B' + dolžina)
            let combinedBlock = Buffer.concat(blockDataParts);
            let blockHeader = Buffer.alloc(5);
            blockHeader.write('B', 0, 'ascii');
            blockHeader.writeUInt32LE(combinedBlock.length, 1);

            finalBuffers.push(blockHeader, combinedBlock);
        }
    }

    // Vrnemo celoten binarni paket
    return Buffer.concat(finalBuffers);
};