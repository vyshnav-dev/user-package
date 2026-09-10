import CryptoJS from 'crypto-js';

export function encrypt(plainText, useDefaultEncryptKey = true) {
    // Ensure the encryption key matches the one used in .NET (UTF-8 encoded)
    const key = CryptoJS.enc.Utf8.parse(getEncryptionKey(useDefaultEncryptKey));
    
    // Use a 16-byte IV of all zeros, which matches the .NET code (aes.IV = new byte[16];)
    const iv = CryptoJS.enc.Utf8.parse('\0'.repeat(16));

    // Perform AES encryption with CBC mode and PKCS#7 padding (same as in .NET)
    const encrypted = CryptoJS.AES.encrypt(plainText, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert the ciphertext to a Base64 string to match .NET's Convert.ToBase64String
    return encrypted.toString();
}

export function decrypt(cipherText, useDefaultEncryptKey = true) {
    const key = CryptoJS.enc.Utf8.parse(getEncryptionKey(useDefaultEncryptKey));
    const iv = CryptoJS.enc.Utf8.parse('\0'.repeat(16));

    // Perform AES decryption
    const decrypted = CryptoJS.AES.decrypt(cipherText, key, {
        iv: iv,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
    });

    // Convert the decrypted bytes to UTF-8 string
    return decrypted.toString(CryptoJS.enc.Utf8);
}

function getEncryptionKey(useDefaultEncryptKey = true) {
    // Use the same encryption key logic as in the .NET code
    return useDefaultEncryptKey
      ? "a8h3GZ9KsNp5Rv2t"  // Example key, replace with actual key
      : "a8h3GZ9KsNp5Rv2t";
}
