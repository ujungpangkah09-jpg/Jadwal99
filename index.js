const makeWASocket = require("@whiskeysockets/baileys").default;
const { useMultiFileAuthState } = require("@whiskeysockets/baileys");
const cron = require("node-cron");
const pino = require("pino");
const fs = require("fs");

// --- Load data jadwal ---
const jadwal = JSON.parse(fs.readFileSync("./jadwal.json", "utf8"));

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState("./auth");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: true,
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  // Format jadwal menjadi teks siap kirim
  function formatJadwal(hari) {
    const data = jadwal[hari.toLowerCase()];
    if (!data) return "Tidak ada jadwal untuk hari ini.";

    let teks = `📅 *Jadwal Pelajaran ${hari.toUpperCase()}*\n\n`;

    data.forEach(item => {
      teks += `🕒 *Jam ke ${item.jam_ke}* (${item.waktu})\n`;
      teks += `📘 ${item.mapel}\n`;
      teks += `👨‍🏫 ${item.guru}\n`;
      teks += `🏫 Ruang: ${item.ruang}\n\n`;
    });

    return teks;
  }

  // --- Daftar nomor penerima ---
  const nomorTujuan = [
    "628xxxxxxx"
  ];

  // --- Kirim jadwal setiap hari jam 05:30 ---
  cron.schedule("30 5 * * 1-5", async () => {  // Senin–Jumat
    const now = new Date();
    const hariIndex = now.getDay(); // 1 = Senin ... 5 = Jumat

    const namaHari = ["", "senin", "selasa", "rabu", "kamis", "jumat"][hariIndex];
    const pesan = formatJadwal(namaHari);

    for (const nomor of nomorTujuan) {
      await sock.sendMessage(nomor + "@s.whatsapp.net", { text: pesan });
    }

    console.log(`Jadwal ${namaHari} dikirim.`);
  });

  console.log("BOT AKTIF...");
}

startBot();
