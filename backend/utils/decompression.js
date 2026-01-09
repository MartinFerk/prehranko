// Uporabiti moraš ISTO Q_TABLE kot na frontendu!
const Q_TABLE = [
    [16, 11, 10, 16, 24, 40, 51, 61],
    [12, 12, 14, 19, 26, 58, 60, 55],
    [14, 13, 16, 24, 40, 57, 69, 56],
    [14, 17, 22, 29, 51, 87, 80, 62],
    [18, 22, 37, 56, 68, 109, 103, 77],
    [24, 35, 55, 64, 81, 104, 113, 92],
    [49, 64, 78, 87, 103, 121, 120, 101],
    [72, 92, 95, 98, 112, 100, 103, 99]
];

// Obratna pot ZigZag mape
const INVERSE_ZIGZAG_MAP = [
    0,  1,  8, 16,  9,  2,  3, 10,
    17, 24, 32, 25, 18, 11,  4,  5,
    12, 19, 26, 33, 40, 48, 41, 34,
    27, 20, 13,  6,  7, 14, 21, 28,
    35, 42, 49, 56, 57, 50, 43, 36,
    29, 22, 15, 23, 30, 37, 44, 51,
    58, 59, 52, 45, 38, 31, 39, 46,
    53, 60, 61, 54, 47, 55, 62, 63
];

/**
 * 1. Obratni RLE (Razširi pare [count, value] nazaj v niz)
 */
const decodeRLE = (rleData) => {
    let decoded = [];
    for (let i = 0; i < rleData.length; i += 2) {
        let count = rleData[i];
        let value = rleData[i + 1];
        for (let j = 0; j < count; j++) {
            decoded.push(value);
        }
    }
    return decoded;
};

/**
 * 2. Inverzna Kvantizacija (Pomnožimo nazaj s Q_TABLE)
 */
const dequantize = (block8x8) => {
    return block8x8.map((row, i) =>
        row.map((val, j) => val * Q_TABLE[i][j])
    );
};

/**
 * 3. IDCT (Inverzna Diskretna Kosinusna Transformacija)
 * Spremeni frekvence nazaj v piksle (0-255)
 */
const applyIDCT = (dctBlock) => {
    const N = 8;
    let block = Array.from({ length: N }, () => new Array(N).fill(0));

    for (let x = 0; x < N; x++) {
        for (let y = 0; y < N; y++) {
            let sum = 0;
            for (let u = 0; u < N; u++) {
                for (let v = 0; v < N; v++) {
                    let alphaU = (u === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
                    let alphaV = (v === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
                    sum += alphaU * alphaV * dctBlock[u][v] * Math.cos(((2 * x + 1) * u * Math.PI) / 16) * Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }
            block[x][y] = Math.max(0, Math.min(255, Math.round(sum))); // Omejimo na bajt
        }
    }
    return block;
};

/**
 * GLAVNA FUNKCIJA ZA DEKOMPRESIJO
 */
exports.decompressImage = (compressedBuffer, width, height) => {
    const flatData = decodeRLE(compressedBuffer);
    let pixels = new Uint8ClampedArray(width * height);

    let blockIdx = 0;
    for (let y = 0; y < height; y += 8) {
        for (let x = 0; x < width; x += 8) {

            // Vzamemo 64 vrednosti za en blok
            let zigzaggedBlock = flatData.slice(blockIdx, blockIdx + 64);
            blockIdx += 64;

            // 1. Inverzni ZigZag (nazaj v 8x8 matriko)
            let matrix8x8 = Array.from({ length: 8 }, () => new Array(8).fill(0));
            for(let i=0; i<64; i++) {
                matrix8x8[Math.floor(INVERSE_ZIGZAG_MAP[i]/8)][INVERSE_ZIGZAG_MAP[i]%8] = zigzaggedBlock[i];
            }

            // 2. Dekvantizacija
            let dctBlock = dequantize(matrix8x8);

            // 3. IDCT
            let reconstructedPiksli = applyIDCT(dctBlock);

            // 4. Shranimo piksle nazaj v končno matriko slike
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 8; j++) {
                    pixels[(y + i) * width + (x + j)] = reconstructedPiksli[i][j];
                }
            }
        }
    }
    return pixels;
};