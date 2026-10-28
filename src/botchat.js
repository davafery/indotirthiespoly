/**
 * Konohapoly - Humanized Bot Chat Engine
 */

const BOT_PERSONAS = {
  'Pak RT': {
    buy: ['mantap, buat pos ronda baru wkwk', 'lumayan aset rt nambah'],
    rent: ['minta iuran kebersihan ya pak', 'uang kas rt aman dulu'],
    jail: ['waduh saya diciduk pas lg ronda', 'surat pengantar rt ga laku di rutan'],
    bankrupt: [' pamit dulu warga, mau urus bansos', 'kas rt habis gaes']
  },
  'Bu Lurah': {
    buy: ['berkas aman, tanah resmi saya ambil', 'buat perumahan dinas baru'],
    rent: ['mohon bayar sewa sesuai peraturan lurah', 'potongan administrasi cair'],
    jail: ['berkas kurang satu kok malah ditahan', 'panggil sekretaris saya!'],
    bankrupt: ['kelurahan resmi pailit wkwk', 'ampun pak presiden']
  },
  'Mas Ordal': {
    buy: ['jalur ordal emang ga pernah gagal', 'properti prospek nih'],
    rent: ['transfer aja bro, via ordal', 'pajak mah via ordal aman'],
    jail: ['tenang, ordal saya di kepolisian banyak', 'sebentar lg jg bebas ini'],
    bankrupt: ['ordal saya lepas tangan waduh', 'saham anjlok parah']
  },
  'Bang Buzzer': {
    buy: ['trending topic nih tanah baru!', 'gasss trendingkan #PropertiCuan'],
    rent: ['fee endorse cair guys', 'tagihan masuk, bayar woy'],
    jail: ['tagar #BebaskanBuzzer trendingkan!', 'kena hoax sendiri deh'],
    bankrupt: ['saham buzzer hancur', 'pensiun dari medsos dulu']
  }
};

export function getBotChat(botName, eventType) {
  const persona = BOT_PERSONAS[botName] || BOT_PERSONAS['Pak RT'];
  const list = persona[eventType] || ['wkwk', 'siap pak', 'lanjut'];
  const text = list[Math.floor(Math.random() * list.length)];
  
  // Humanize (Delay & Huruf Kecil)
  return {
    sender: botName,
    text: text.toLowerCase(),
    delay: Math.floor(Math.random() * 2000) + 1000
  };
}
