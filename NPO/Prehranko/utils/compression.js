// 1. Standardna JPEG tabela za kvantizacijo (Mora biti ista kot na backendu!)
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

const ZIGZAG_MAP = [
    0,  1,  5,  6, 14, 15, 27, 28,
    2,  4,  7, 13, 16, 26, 29, 42,
    3,  8, 12, 17, 25, 30, 41, 43,
    9, 11, 18, 24, 31, 40, 44, 53,
    10, 19, 23, 32, 39, 45, 52, 54,
    20, 22, 33, 38, 46, 51, 55, 60,
    21, 34, 37, 47, 50, 56, 59, 61,
    35, 36, 48, 49, 57, 58, 62, 63
];

/**
 * POMOŽNA: Pridobi 8x8 blok iz surovih pikslov
 */
const getBlock8x8 = (pixels, startX, startY, width) => {
    let block = Array.from({ length: 8 }, () => new Array(8));
    for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
            // Predpostavljamo, da so pixels že grayscale (en bajt na piksel)
            block[i][j] = pixels[(startY + i) * width + (startX + j)];
        }
    }
    return block;
};

/**
 * POMOŽNA: Diskretna kosinusna transformacija (DCT)
 * Formula: $G_{u,v} = \frac{1}{4} \alpha(u) \alpha(v) \sum_{x=0}^7 \sum_{y=0}^7 g_{x,y} \cos[\frac{(2x+1)u\pi}{16}] \cos[\frac{(2y+1)v\pi}{16}]$
 */
const applyDCT = (block) => {
    const N = 8;
    let dctBlock = Array.from({ length: N }, () => new Array(N).fill(0));

    for (let u = 0; u < N; u++) {
        for (let v = 0; v < N; v++) {
            let sum = 0;
            let alphaU = (u === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);
            let alphaV = (v === 0) ? Math.sqrt(1 / N) : Math.sqrt(2 / N);

            for (let x = 0; x < N; x++) {
                for (let y = 0; y < N; y++) {
                    sum += block[x][y] * Math.cos(((2 * x + 1) * u * Math.PI) / 16) * Math.cos(((2 * y + 1) * v * Math.PI) / 16);
                }
            }
            dctBlock[u][v] = Math.round(alphaU * alphaV * sum);
        }
    }
    return dctBlock;
};

/**
 * POMOŽNA: Kvantizacija (zmanjšanje natančnosti s tabelo Q_TABLE)
 */
const quantize = (dctBlock) => {
    return dctBlock.map((row, i) =>
        row.map((val, j) => Math.round(val / Q_TABLE[i][j]))
    );
};

const zigzagOrder = (quantizedBlock) => {
    const flat = quantizedBlock.flat();
    const zigzagged = new Array(64);
    for (let i = 0; i < 64; i++) {
        zigzagged[i] = flat[ZIGZAG_MAP[i]];
    }
    return zigzagged;
};

export const applyRLE = (data) => {
    let rle = [];
    let count = 1;
    for (let i = 0; i < data.length; i++) {
        if (i < data.length - 1 && data[i] === data[i + 1] && count < 255) {
            count++;
        } else {
            rle.push(count);
            rle.push(data[i]);
            count = 1;
        }
    }
    return new Uint8Array(rle);
};

/**
 * GLAVNA FUNKCIJA: compressImageDCT
 * pixelData: Uint8Array grayscale pikslov (0-255)
 */
export const compressImageDCT = async (pixelData, width, height) => {
    let allCompressedBlocks = [];

    for (let y = 0; y < height; y += 8) {
        for (let x = 0; x < width; x += 8) {
            let block = getBlock8x8(pixelData, x, y, width);
            let dct = applyDCT(block);
            let quantized = quantize(dct);
            let zigzagged = zigzagOrder(quantized);
            allCompressedBlocks.push(...zigzagged);
        }
    }

    return applyRLE(allCompressedBlocks);
};