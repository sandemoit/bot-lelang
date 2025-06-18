# Bot Lelang Koi

Bot Lelang Koi adalah sebuah bot WhatsApp yang dapat membantu Anda mengadakan lelang ikan koi secara online. Bot ini menggunakan Google Sheets sebagai basis data untuk menyimpan informasi lelang yang sedang berlangsung.

## Konfigurasi Google Sheets

Untuk menggunakan Bot Lelang Koi, Anda perlu mengatur Google Sheets agar dapat diakses oleh bot. Berikut adalah langkah-langkah yang perlu diikuti:

1. Buatlah sebuah Google Sheets baru dengan nama "lelang" dan tambahkan header kolom seperti berikut:
	* namaIkan
	* hargaAwal
	* kenaikan
	* status
	* penawarTertinggi
	* hargaTertinggi
	* pemenang
2. Pergi ke Google Cloud Console dan buatlah sebuah project baru.
3. Pada menu sidebar, pilih "APIs & Services" dan kemudian pilih "Dashboard".
4. Klik tombol "Enable APIs and Services" dan cari "Google Sheets API".
5. Klik tombol "Enable" dan kemudian pilih "Create credentials" > "OAuth client ID".
6. Pilih "Other" sebagai jenis aplikasi dan masukkan nama aplikasi Anda.
7. Pada bagian "Authorized Redirect URIs", masukkan URL berikut:
	https://script.google.com/macros/d/{SCRIPT_ID}/usercallback
8. Klik tombol "Create" dan salin kode client ID dan client secret yang diberikan.
9. Pada file `.env.example`, ganti nilai `GOOGLE_SERVICE_ACCOUNT_EMAIL` dan `GOOGLE_PRIVATE_KEY` dengan kode client ID dan client secret yang diberikan.

## Penggunaan

Untuk menggunakan Bot Lelang Koi, Anda perlu mengirimkan perintah berikut ke nomor WhatsApp bot:

* `/lelang <namaIkan> <hargaAwal> <kenaikan>` untuk memulai lelang baru.
* `/bid <nominal>` untuk menawar harga ikan.
* `/status` untuk melihat status lelang yang sedang berlangsung.
* `/tutup` untuk menutup lelang yang sedang berlangsung.

## Lisensi

Bot Lelang Koi berlisensi MIT. Anda dapat menggunakan, mengubah, dan mendistribusikan bot ini secara bebas. Namun, Anda tidak boleh menghapus atau mengubah lisensi dan informasi hak cipta.
