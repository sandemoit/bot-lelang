const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const { startLelang, bid, getAuctionStatus, closeLelang } = require('./lelang');

const client = new Client({ authStrategy: new LocalAuth() });
const ADMIN_ID = '628xxxxxxx@c.us'; // admin WhatsApp number

client.on('qr', (qr) => {
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('✅ Bot lelang koi siap di grup!');
});

client.on('message', async (msg) => {
  const isGroup = msg.from.endsWith('@g.us');
  const senderId = isGroup ? msg.author : msg.from;
  const senderName = msg._data.notifyName || 'Peserta';
  const phoneNumber = senderId.split('@')[0]; // Extract phone number from sender ID
  console.log("Received message from:", senderName, "phone:", phoneNumber);

  const text = msg.body;

  // Start auction (admin only)
  if (text.startsWith('/lelang')) {
    if (!isGroup) return msg.reply('Command hanya bisa dari grup!');

    if (senderId !== ADMIN_ID) {
        return msg.reply('⛔ Maaf, hanya admin yang bisa memulai lelang.');
    }

    const [_, namaIkan, hargaAwal, kenaikan] = text.split('|');
    if (!namaIkan || !hargaAwal || !kenaikan) {
        return msg.reply('Format salah. Gunakan: /lelang|Nama Ikan|Harga Awal|Kenaikan');
    }

    try {
      const result = await startLelang({
          namaIkan: namaIkan.trim(),
          hargaAwal: parseInt(hargaAwal),
          kenaikan: parseInt(kenaikan)
      });

      client.sendMessage(
          msg.from,
          `🎉 Lelang dimulai!\nIkan: *${result.namaIkan}*\nHarga awal: Rp${parseInt(result.hargaTertinggi).toLocaleString('id-ID')}\nGunakan /bid [nominal] untuk menawar.`
      );
    } catch (error) {
      console.error("Error starting auction:", error);
      msg.reply('Terjadi kesalahan saat memulai lelang. Silakan coba lagi.');
    }
  }

  // Bid from participants
  else if (text.startsWith('/bid')) {
    if (!isGroup) return msg.reply('Bid hanya bisa dari grup.');

    const [_, nominalStr] = text.split(' ');
    const nominal = parseInt(nominalStr);

    if (isNaN(nominal)) {
      return msg.reply('Format salah. Gunakan: /bid [angka]');
    }

    try {
      const result = await bid(senderName, nominal, phoneNumber);
      client.sendMessage(msg.from, result.message);
    } catch (error) {
      console.error("Error processing bid:", error);
      msg.reply('Terjadi kesalahan saat memproses bid. Silakan coba lagi.');
    }
  }

  // Get auction status
  else if (text === '/status') {
    try {
      const result = await getAuctionStatus();
      client.sendMessage(msg.from, result.message);
    } catch (error) {
      console.error("Error getting status:", error);
      msg.reply('Terjadi kesalahan saat mengambil status lelang.');
    }
  }

  // Close auction (admin only)
  else if (text === '/tutup') {
    if (!isGroup) return msg.reply('Command hanya bisa dari grup!');

    if (senderId !== ADMIN_ID) {
      return msg.reply('⛔ Maaf, hanya admin yang bisa menutup lelang.');
    }

    try {
      const result = await closeLelang();
      client.sendMessage(msg.from, result.message);
    } catch (error) {
      console.error("Error closing auction:", error);
      msg.reply('Terjadi kesalahan saat menutup lelang.');
    }
  }

  // Help command
  else if (text === '/help') {
    const helpText = `*🐟 Bot Lelang Koi - Perintah*\n\n` +
      `Admin:\n` +
      `- /lelang|Nama Ikan|Harga Awal|Kenaikan - Memulai lelang baru\n` +
      `- /tutup - Menutup lelang yang sedang berjalan\n\n` +
      `Semua Peserta:\n` +
      `- /bid [nominal] - Melakukan penawaran\n` +
      `- /status - Melihat status lelang saat ini\n` +
      `- /help - Menampilkan bantuan ini`;
    
    client.sendMessage(msg.from, helpText);
  }
});

client.initialize();