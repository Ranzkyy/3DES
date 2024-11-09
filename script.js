class FileEncryption {
    constructor() {
        this.fileInput = document.getElementById('fileInput');
        this.keyInput1 = document.getElementById('keyInput1');
        this.keyInput2 = document.getElementById('keyInput2');
        this.keyInput3 = document.getElementById('keyInput3');
        this.encryptBtn = document.getElementById('encryptBtn');
        this.decryptBtn = document.getElementById('decryptBtn');
        this.textInput = document.getElementById('textInput'); // Input teks
        this.fileInfo = document.getElementById('fileInfo');
        this.status = document.getElementById('status');
        this.progressBar = document.getElementById('progressBar');
        this.downloadLink = document.getElementById('downloadLink');

        this.initializeEventListeners();
    }

    initializeEventListeners() {
        this.fileInput.addEventListener('change', () => this.updateFileInfo());
        this.encryptBtn.addEventListener('click', () => this.handleEncryption());
        this.decryptBtn.addEventListener('click', () => this.handleDecryption());
    }

    updateFileInfo() {
        const file = this.fileInput.files[0];
        if (file) {
            this.fileInfo.textContent = `File terpilih: ${file.name} (${this.formatFileSize(file.size)})`;
        }
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async handleEncryption() {
        const file = this.fileInput.files[0];
        const key1 = this.keyInput1.value;
        const key2 = this.keyInput2.value;
        const key3 = this.keyInput3.value;
        const text = this.textInput.value;

        if (!key1 || key1.length < 6) {
            this.updateStatus('Error: Setidaknya satu kunci harus 6 karakter atau lebih!', 0);
            return;
        }

        const combinedKey = this.generateCombinedKey(key1, key2, key3);

        if (text) {
            // Encrypt text input if it is filled
            this.encryptText(text, combinedKey);
        } else if (file) {
            // Encrypt file if file is selected
            this.encryptFile(file, combinedKey);
        } else {
            this.updateStatus('Error: Masukkan teks atau pilih file untuk dienkripsi!', 0);
        }
    }

    encryptText(text, key) {
        try {
            this.updateStatus('Memulai enkripsi teks...', 0);
            const encryptedText = CryptoJS.TripleDES.encrypt(text, CryptoJS.enc.Utf8.parse(key), {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            }).toString();

            const blob = new Blob([encryptedText], { type: 'text/plain' });
            this.createDownloadLink(blob, 'encrypted_text.txt');
            this.updateStatus('Enkripsi teks selesai!', 100);
        } catch (error) {
            this.updateStatus('Error: ' + error.message, 0);
        }
    }

    async encryptFile(file, key) {
        this.updateStatus('Memulai enkripsi file...', 0);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const wordArray = CryptoJS.lib.WordArray.create(e.target.result);
                    const encrypted = CryptoJS.TripleDES.encrypt(wordArray, CryptoJS.enc.Utf8.parse(key), {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7,
                    });
                    this.createDownloadLink(encrypted.toString(), file.name + '.encrypted');
                    this.updateStatus('Enkripsi file selesai!', 100);
                    resolve(encrypted.toString());
                } catch (error) {
                    this.updateStatus('Error: ' + error.message, 0);
                    reject(error);
                }
            };
            reader.readAsArrayBuffer(file);
        });
    }

    async handleDecryption() {
        const file = this.fileInput.files[0];
        const key1 = this.keyInput1.value;
        const key2 = this.keyInput2.value;
        const key3 = this.keyInput3.value;
        const text = this.textInput.value;

        if (!key1 || key1.length < 6) {
            this.updateStatus('Error: Setidaknya satu kunci harus 6 karakter atau lebih!', 0);
            return;
        }

        const combinedKey = this.generateCombinedKey(key1, key2, key3);

        if (text) {
            // Decrypt text input if it is filled
            this.handleTextDecryption(text, combinedKey);
        } else if (file) {
            // Decrypt file if file is selected
            this.decryptFile(file, combinedKey);
        } else {
            this.updateStatus('Error: Masukkan teks atau pilih file untuk didekripsi!', 0);
        }
    }

    handleTextDecryption(encryptedText, key) {
        try {
            this.updateStatus('Memulai dekripsi teks...', 0);
            const decryptedText = CryptoJS.TripleDES.decrypt(encryptedText, CryptoJS.enc.Utf8.parse(key), {
                mode: CryptoJS.mode.ECB,
                padding: CryptoJS.pad.Pkcs7,
            });

            const resultText = decryptedText.toString(CryptoJS.enc.Utf8);
            if (!resultText) {
                this.updateStatus('Error: Dekripsi gagal. Pastikan kunci benar!', 0);
            } else {
                this.updateStatus('Dekripsi teks selesai!', 100);
                this.createDownloadLink(new Blob([resultText], { type: 'text/plain' }), 'decrypted_text.txt');
            }
        } catch (error) {
            this.updateStatus('Error: ' + error.message, 0);
        }
    }

    async decryptFile(file, key) {
        this.updateStatus('Memulai dekripsi file...', 0);
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const encryptedStr = e.target.result;
                    const decrypted = CryptoJS.TripleDES.decrypt(encryptedStr, CryptoJS.enc.Utf8.parse(key), {
                        mode: CryptoJS.mode.ECB,
                        padding: CryptoJS.pad.Pkcs7,
                    });
                    const typedArray = this.convertWordArrayToUint8Array(decrypted);
                    this.createDownloadLink(new Blob([typedArray]), file.name.replace('.encrypted', ''));
                    this.updateStatus('Dekripsi file selesai!', 100);
                    resolve();
                } catch (error) {
                    this.updateStatus('Error: ' + error.message, 0);
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    generateCombinedKey(key1, key2, key3) {
        if (key1 && !key2 && !key3) {
            return (key1 + key1 + key1).substring(0, 16);
        }
        if (key1 && key2 && !key3) {
            return (key1 + key2 + key1 + key2).substring(0, 16);
        }
        if (key1 && key2 && key3) {
            return (key1 + key2 + key3).substring(0, 16);
        }
    }

    updateStatus(message, progress) {
        this.status.textContent = message;
        this.progressBar.value = progress;
    }

    convertWordArrayToUint8Array(wordArray) {
        const len = wordArray.sigBytes;
        const u8Array = new Uint8Array(len);
        let offset = 0;
        for (let i = 0; i < len; i++) {
            const word = (wordArray.words[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff;
            u8Array[offset++] = word;
        }
        return u8Array;
    }

    createDownloadLink(content, fileName) {
        const blob = content instanceof Blob ? content : new Blob([content]);
        const url = URL.createObjectURL(blob);
        this.downloadLink.href = url;
        this.downloadLink.download = fileName;
        this.downloadLink.style.display = 'block';
        this.downloadLink.textContent = `Download ${fileName}`;
    }
}

// Inisialisasi aplikasi
document.addEventListener('DOMContentLoaded', () => {
    new FileEncryption();
});
