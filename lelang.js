const { accessSheet } = require('./googleSheet');

const startLelang = async ({ namaIkan, hargaAwal, kenaikan }) => {
  try {
    const doc = await accessSheet();
    
    // Get or create the lelang sheet
    let lelangSheet = doc.sheetsByTitle['lelang'];
    
    if (!lelangSheet) {
      console.log("Creating new lelang sheet");
      lelangSheet = await doc.addSheet({
        title: 'lelang',
        headerValues: ['namaIkan', 'hargaAwal', 'kenaikan', 'status', 'penawarTertinggi', 'hargaTertinggi', 'pemenang']
      });
    }
    
    // Add data in a more direct way if needed
    await lelangSheet.loadCells();
    
    // Check if there are any rows already
    const rowCount = lelangSheet.rowCount;
    
    // If there are no header rows (just in case), add them
    if (rowCount <= 1) {
      const headers = ['namaIkan', 'hargaAwal', 'kenaikan', 'status', 'penawarTertinggi', 'hargaTertinggi', 'pemenang'];
      for (let i = 0; i < headers.length; i++) {
        const cell = lelangSheet.getCell(0, i);
        cell.value = headers[i];
      }
      await lelangSheet.saveUpdatedCells();
    }
    
    // Now add the row data
    const rowData = {
      namaIkan,
      hargaAwal,
      kenaikan,
      status: 'aktif',
      penawarTertinggi: '',
      hargaTertinggi: hargaAwal,
      pemenang: ''  // Initialize empty pemenang field
    };
    
    await lelangSheet.addRow(rowData);
    
    return { namaIkan, hargaTertinggi: hargaAwal };
  } catch (error) {
    console.error("Error in startLelang:", error);
    throw error;
  }
};

const bid = async (nama, nominal, nomorHP) => {
  try {
    const doc = await accessSheet();
    const lelangSheet = doc.sheetsByTitle['lelang'];
    
    if (!lelangSheet) {
      return { success: false, message: 'Lelang belum dimulai.' };
    }
    
    // Make sure we get the latest data
    await lelangSheet.loadCells();
    const rows = await lelangSheet.getRows();
    
    if (!rows || rows.length === 0) {
      return { success: false, message: 'Lelang belum dimulai.' };
    }

    const last = rows[rows.length - 1];
    
    // Get status and validate it
    const status = last.status || last._rawData[3] || '';
    
    if (status.toLowerCase().trim() !== 'aktif') {
      return { success: false, message: 'Lelang sudah ditutup atau belum dimulai.' };
    }

    // Get current price and minimum increment
    const currentPrice = parseInt(last.hargaTertinggi || last._rawData[5] || 0);
    const minInc = parseInt(last.kenaikan || last._rawData[2] || 0);

    if (nominal < currentPrice + minInc) {
      return { success: false, message: `Bid terlalu rendah. Minimal bid: ${currentPrice + minInc}` };
    }

    // Update values explicitly
    try {
      // Update each field directly
      last.hargaTertinggi = nominal.toString();
      last.penawarTertinggi = nama;
      last.pemenang = nomorHP;
      
      // Log what we're trying to save
      console.log("Attempting to save row with:", {
        hargaTertinggi: last.hargaTertinggi,
        penawarTertinggi: last.penawarTertinggi,
        pemenang: last.pemenang
      });
      
      // Save the changes
      await last.save();
      
      // Double-check the save was successful
      await lelangSheet.loadCells();
      const updatedRows = await lelangSheet.getRows();
      const updatedLast = updatedRows[updatedRows.length - 1];
      console.log("Row after update:", JSON.stringify(updatedLast._rawData));
      
      return { 
        success: true, 
        message: `🔥 ${nama} (${nomorHP}) menawar ${nominal}! Penawar tertinggi saat ini.`
      };
    } catch (saveError) {
      console.error("Error saving bid data:", saveError);
      
      // Alternative update approach if direct method fails
      try {
        console.log("Trying alternative update method...");
        // Try updating cell by cell
        const colIndexes = {
          penawarTertinggi: 4,
          hargaTertinggi: 5,
          pemenang: 6
        };
        
        // Update cells directly
        const rowIndex = rows.length + 1; // +1 because of header row
        lelangSheet.getCell(rowIndex, colIndexes.penawarTertinggi).value = nama;
        lelangSheet.getCell(rowIndex, colIndexes.hargaTertinggi).value = nominal.toString();
        lelangSheet.getCell(rowIndex, colIndexes.pemenang).value = nomorHP;
        
        await lelangSheet.saveUpdatedCells();
        
        return { 
          success: true, 
          message: `🔥 ${nama} (${nomorHP}) menawar ${nominal}! Penawar tertinggi saat ini.`
        };
      } catch (altError) {
        console.error("Alternative update also failed:", altError);
        throw altError;
      }
    }
  } catch (error) {
    console.error("Error in bid:", error);
    console.error(error.stack);
    return { success: false, message: 'Terjadi kesalahan saat melakukan bid.' };
  }
};

// Add a new function to get current auction status
const getAuctionStatus = async () => {
  try {
    const doc = await accessSheet();
    const lelangSheet = doc.sheetsByTitle['lelang'];
    
    if (!lelangSheet) {
      return { success: false, message: 'Tidak ada lelang yang aktif.' };
    }
    
    await lelangSheet.loadCells();
    const rows = await lelangSheet.getRows();
    
    if (!rows || rows.length === 0) {
      return { success: false, message: 'Tidak ada lelang yang aktif.' };
    }

    const last = rows[rows.length - 1];
    
    // Debug what we're working with
    console.log("Getting status from row:", JSON.stringify(last._rawData));
    
    const status = last.status || last._rawData[3] || '';
    
    if (status.toLowerCase().trim() !== 'aktif') {
      return { success: false, message: 'Tidak ada lelang yang aktif saat ini.' };
    }
    
    // Get auction details
    const namaIkan = last.namaIkan || last._rawData[0] || 'Unknown';
    const hargaTertinggi = last.hargaTertinggi || last._rawData[5] || '0';
    const penawarTertinggi = last.penawarTertinggi || last._rawData[4] || 'Belum ada';
    const pemenang = last.pemenang || last._rawData[6] || 'Belum ada';
    
    return {
      success: true,
      data: {
        namaIkan,
        status,
        hargaTertinggi,
        penawarTertinggi,
        pemenang
      },
      message: `📊 Status Lelang ${namaIkan}:\n• Harga Tertinggi: ${hargaTertinggi}\n• Penawar: ${penawarTertinggi}\n• No HP Pemenang: ${pemenang}`
    };
  } catch (error) {
    console.error("Error in getAuctionStatus:", error);
    return { success: false, message: 'Terjadi kesalahan saat mengambil status lelang.' };
  }
};

// Add a function to close the auction
const closeLelang = async () => {
  try {
    const doc = await accessSheet();
    const lelangSheet = doc.sheetsByTitle['lelang'];
    
    if (!lelangSheet) {
      return { success: false, message: 'Tidak ada lelang yang aktif.' };
    }
    
    await lelangSheet.loadCells();
    const rows = await lelangSheet.getRows();
    
    if (!rows || rows.length === 0) {
      return { success: false, message: 'Tidak ada lelang yang aktif.' };
    }

    const last = rows[rows.length - 1];
    
    // Debug what we're working with
    console.log("Closing lelang with row:", JSON.stringify(last._rawData));
    
    const status = last.status || last._rawData[3] || '';
    
    if (status.toLowerCase().trim() !== 'aktif') {
      return { success: false, message: 'Tidak ada lelang yang aktif saat ini.' };
    }
    
    // Update status to closed
    try {
      last.status = 'selesai';
      await last.save();
    } catch (saveError) {
      console.error("Error saving status update:", saveError);
      
      // Try alternative update method
      try {
        console.log("Trying alternative status update...");
        const statusColumnIndex = 3;
        const rowIndex = rows.length + 1; // +1 for header row
        lelangSheet.getCell(rowIndex, statusColumnIndex).value = 'selesai';
        await lelangSheet.saveUpdatedCells();
      } catch (altError) {
        console.error("Alternative status update failed:", altError);
        throw altError;
      }
    }
    
    // Get final winner details
    const namaIkan = last.namaIkan || last._rawData[0] || 'Unknown';
    const hargaTertinggi = last.hargaTertinggi || last._rawData[5] || '0';
    const penawarTertinggi = last.penawarTertinggi || last._rawData[4] || 'Tidak ada penawar';
    const pemenang = last.pemenang || last._rawData[6] || 'Tidak ada pemenang';
    
    return {
      success: true,
      data: {
        namaIkan,
        hargaTertinggi,
        penawarTertinggi,
        pemenang
      },
      message: `🏆 Lelang ${namaIkan} telah selesai!\n• Pemenang: ${penawarTertinggi}\n• Harga: ${hargaTertinggi}\n• No HP: ${pemenang || 'Tidak ada pemenang'}`
    };
  } catch (error) {
    console.error("Error in closeLelang:", error);
    return { success: false, message: 'Terjadi kesalahan saat menutup lelang.' };
  }
};

module.exports = { startLelang, bid, getAuctionStatus, closeLelang };