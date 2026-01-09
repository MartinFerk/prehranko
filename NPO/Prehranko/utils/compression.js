// Zig-zag indeksi za 8x8 matriko
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
 * 1. Pretvori 8x8 matriko v 1D niz po cik-cak vzorcu
 */
const zigzagOrder = (quantizedBlock) => {
    const flat = quantizedBlock.flat(); // Najprej naredimo navaden seznam 64 elementov
    const zigzagged = new Array(64);

    for (let i = 0; i < 64; i++) {
        zigzagged[i] = flat[ZIGZAG_MAP[i]];
    }
    return zigzagged;
};

/**
 * 2. Posodobljena RLE funkcija
 * Shranjuje pare: [ponovitve, vrednost]
 */
export const applyRLE = (data) => {
    let rle = [];
    let count = 1;

    for (let i = 0; i < data.length; i++) {
        // Če je naslednji element enak in nismo presegli bajta (255)
        if (i < data.length - 1 && data[i] === data[i + 1] && count < 255) {
            count++;
        } else {
            rle.push(count); // Kolikokrat
            rle.push(data[i]); // Katera vrednost
            count = 1;
        }
    }
    return new Uint8Array(rle);
};



/**
 * 3. Glavna funkcija za obdelavo cele slike
 */
export const compressImageDCT = async (pixels, width, height) => {
    let allCompressedBlocks = [];

    // Sliko razbijemo na 8x8 bloke
    for (let y = 0; y < height; y += 8) {
        for (let x = 0; x < width; x += 8) {

            // 1. Pridobi 8x8 blok (funkcijo morata še napisat)
            let block = getBlock8x8(pixels, x, y, width);

            // 2. DCT transformacija
            let dct = applyDCT(block);

            // 3. Kvantizacija
            let quantized = quantize(dct);

            // 4. Zig-Zag
            let zigzagged = zigzagOrder(quantized);

            // Dodamo v končni seznam pred RLE
            allCompressedBlocks.push(...zigzagged);
        }
    }

    // 5. Končni RLE na celotni sliki
    return applyRLE(allCompressedBlocks);
};