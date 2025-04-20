const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
require('dotenv').config();

async function accessSheet() {
  try {
    const serviceAccountAuth = new JWT({
      email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    const doc = new GoogleSpreadsheet(process.env.GOOGLE_SHEET_ID, serviceAccountAuth);
    await doc.loadInfo();

    // Cek apakah sheet 'lelang' ada
    let lelangSheet = doc.sheetsByTitle['lelang'];

    // Kalau gak ada, buat dengan header yang sesuai
    if (!lelangSheet) {
      console.log("Sheet 'lelang' tidak ditemukan, membuat baru...");
      lelangSheet = await doc.addSheet({
        title: 'lelang',
        headerValues: ['namaIkan', 'hargaAwal', 'kenaikan', 'status', 'penawarTertinggi', 'hargaTertinggi', 'pemenang']
      });
    } else {
      // Attempt to check headers - if this fails, we'll need to set them
      try {
        // This may fail if there are no headers
        await lelangSheet.loadHeaderRow();
      } catch (e) {
        console.log("Setting headers on existing sheet...");
        // Set headers in the first row - using raw update for more direct control
        await lelangSheet.setHeaderRow(['namaIkan', 'hargaAwal', 'kenaikan', 'status', 'penawarTertinggi', 'hargaTertinggi', 'pemenang']);
      }
    }

    // Reload the sheet info after potential changes
    await doc.loadInfo();
    return doc;
  } catch (err) {
    console.error("Error accessing sheet:", err);
    throw err;
  }
}

module.exports = { accessSheet };