const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const cron = require("node-cron");
const pino = require("pino");
const fs = require("fs");

// Load jadwal
const jadwal = JSON.parse(fs.readFileSync("./jadwal.json", "utf8"));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state
  });

  sock.ev.on("creds.update", saveCreds);

  // === Fungsi Format Jadwal ===
  function formatJadwal(hariKey) {
    const items = jadwal[hariKey];
    if (!items) return "🎯 Tidak ada jadwal untuk hari ini.";

    let teks = `📅 *JADWAL PELAJARAN ${hariKey.toUpperCase()}*\n\n`;
    items.forEach(item => {
      teks += `🕒 Jam ke ${item.jam_ke} (${item.waktu})\n`;
      teks += `📘 ${item.mapel}\n`;
      teks += `👨‍🏫 ${item.guru}\n`;
      teks += `🏫 Ruang: ${item.ruang}\n\n`;
    });
    return teks;
  }

  // === Ambil event chat ===
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message) return;

    const from = msg.key.remoteJid;
    const text = msg.message.conversation || msg.message.extendedTextMessage?.text;

    // Jika user kirim !id → bot akan balas ID grup
    if (text === "!id") {
      await sock.sendMessage(from, { text: `ID Grup ini:\n\n*${from}*` });
    }
  });

  // === Masukkan ID Grup di sini ===
  const groupID = "xxxxxxxxxxxx-xxxx@g.us";  // ← ganti nanti setelah dapat dari !id

  // === Cron Kirim Otomatis (05:30 Senin–Jumat) ===
  cron.schedule("30 5 * * 1-5", async () => {
    const hariIndex = new Date().getDay();
    const namaHari = ["", "senin", "selasa", "rabu", "kamis", "jumat"];
    const hariKey = namaHari[hariIndex] || "senin";

    const pesan = formatJadwal(hariKey);

    await sock.sendMessage(groupID, { text: pesan });

    console.log(`Jadwal ${hariKey} dikirim ke grup.`);
  });

  console.log("Bot siap dipakai... Scan QR di terminal.");
}

startBot();
