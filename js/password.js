// GITInvoice — password hashing (PBKDF2-SHA256) with legacy SHA-256 migration
'use strict';

var PBKDF2_ITERATIONS = 150000;
var PBKDF2_PREFIX = 'pbkdf2';
var PBKDF2_SALT_BYTES = 16;

function bytesToHex(bytes) {
    return Array.from(bytes).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
}

function hexToBytes(hex) {
    var bytes = new Uint8Array(hex.length / 2);
    for (var i = 0; i < bytes.length; i++) {
        bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
    }
    return bytes;
}

function isPbkdf2Hash(storedHash) {
    return typeof storedHash === 'string' && storedHash.indexOf(PBKDF2_PREFIX + ':') === 0;
}

async function hashPasswordLegacySha256(password) {
    if (globalThis.crypto && globalThis.crypto.subtle && globalThis.TextEncoder) {
        var msgBuffer = new TextEncoder().encode(password);
        var hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return bytesToHex(new Uint8Array(hashBuffer));
    }
    return sha256Fallback(password);
}

async function derivePbkdf2(password, saltBytes, iterations) {
    var enc = new TextEncoder();
    var keyMaterial = await crypto.subtle.importKey(
        'raw',
        enc.encode(password),
        'PBKDF2',
        false,
        ['deriveBits']
    );
    var derived = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: saltBytes, iterations: iterations, hash: 'SHA-256' },
        keyMaterial,
        256
    );
    return bytesToHex(new Uint8Array(derived));
}

async function hashPassword(password) {
    if (!password) throw new Error('Password is required.');
    if (!globalThis.crypto || !globalThis.crypto.subtle) {
        throw new Error('Secure password hashing requires a modern browser (HTTPS or localhost).');
    }

    var salt = crypto.getRandomValues(new Uint8Array(PBKDF2_SALT_BYTES));
    var hash = await derivePbkdf2(password, salt, PBKDF2_ITERATIONS);
    return PBKDF2_PREFIX + ':' + PBKDF2_ITERATIONS + ':' + bytesToHex(salt) + ':' + hash;
}

async function verifyPassword(password, storedHash) {
    if (!password || !storedHash) return false;

    if (isPbkdf2Hash(storedHash)) {
        var parts = storedHash.split(':');
        if (parts.length !== 4) return false;
        var iterations = parseInt(parts[1], 10);
        if (!iterations || iterations < 1) return false;
        var salt = hexToBytes(parts[2]);
        var expected = parts[3];
        var actual = await derivePbkdf2(password, salt, iterations);
        return actual === expected;
    }

    var legacy = await hashPasswordLegacySha256(password);
    return legacy === storedHash;
}

function needsPasswordUpgrade(storedHash) {
    return storedHash && !isPbkdf2Hash(storedHash);
}

function sha256Fallback(input) {
    var bytes = globalThis.TextEncoder
        ? Array.from(new TextEncoder().encode(input))
        : Array.from(unescape(encodeURIComponent(input)), function (c) { return c.charCodeAt(0); });
    var words = [];
    var rightRotate = function (value, amount) { return (value >>> amount) | (value << (32 - amount)); };
    var constants = [
        0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
        0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
        0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
        0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
        0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
        0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
        0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
        0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2
    ];
    var hash = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19];

    var bitLength = bytes.length * 8;
    bytes.push(0x80);
    while ((bytes.length % 64) !== 56) bytes.push(0);
    for (var i = 7; i >= 0; i--) bytes.push((bitLength / Math.pow(2, i * 8)) & 255);

    for (var bi = 0; bi < bytes.length; bi += 64) {
        for (var j = 0; j < 16; j++) {
            words[j] = (bytes[bi + j * 4] << 24) | (bytes[bi + j * 4 + 1] << 16) | (bytes[bi + j * 4 + 2] << 8) | bytes[bi + j * 4 + 3];
        }
        for (j = 16; j < 64; j++) {
            var s0 = rightRotate(words[j - 15], 7) ^ rightRotate(words[j - 15], 18) ^ (words[j - 15] >>> 3);
            var s1 = rightRotate(words[j - 2], 17) ^ rightRotate(words[j - 2], 19) ^ (words[j - 2] >>> 10);
            words[j] = (words[j - 16] + s0 + words[j - 7] + s1) >>> 0;
        }

        var a = hash[0], b = hash[1], c = hash[2], d = hash[3], e = hash[4], f = hash[5], g = hash[6], h = hash[7];
        for (j = 0; j < 64; j++) {
            s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
            var ch = (e & f) ^ (~e & g);
            var temp1 = (h + s1 + ch + constants[j] + words[j]) >>> 0;
            s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
            var maj = (a & b) ^ (a & c) ^ (b & c);
            var temp2 = (s0 + maj) >>> 0;
            h = g; g = f; f = e; e = (d + temp1) >>> 0;
            d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
        }
        hash = [
            (hash[0] + a) >>> 0, (hash[1] + b) >>> 0, (hash[2] + c) >>> 0, (hash[3] + d) >>> 0,
            (hash[4] + e) >>> 0, (hash[5] + f) >>> 0, (hash[6] + g) >>> 0, (hash[7] + h) >>> 0
        ];
    }

    return hash.map(function (value) { return value.toString(16).padStart(8, '0'); }).join('');
}
