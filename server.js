const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Statik frontend dosyalarını sun
app.use(express.static(path.join(__dirname)));

// ----------------------------------------------------
// 🎯 SLEIN (Logic & Veri Yönetimi) API Rotaları
// ----------------------------------------------------

// 1. Durum Kontrolü (200 OK)
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'online',
    message: 'API Laboratuvarı aktif çalışıyor',
    timestamp: new Date().toISOString()
  });
});

// 2. Test POST İsteği (Echo)
app.post('/api/echo', (req, res) => {
  res.status(201).json({
    message: 'Veri başarıyla alındı',
    receivedData: req.body,
    timestamp: new Date().toISOString()
  });
});

// 3. Hata Senaryosu Testi (500 Internal Server Error)
app.get('/api/error-test', (req, res) => {
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Sunucu tarafında kontrollü bir test hatası fırlatıldı'
  });
});

// 4. Paskalya Yumurtası (Sonsuz Sevgi Easter Egg)
app.get('/api/slein-heartbeat', (req, res) => {
  res.status(200).json({
    protocol: 'Sonsuz Sevgi v2.0',
    status: 'Connected',
    pair: {
      logic: 'Selin (Slein)',
      ui: 'Wesley'
    },
    message: '💖 Sonsuz Sevgi Paskalya Yumurtası Aktif! 💖'
  });
});

// Ana sayfa yönlendirmesi
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Sunucuyu dinle
app.listen(PORT, () => {
  console.log(`Web API Test Lab sunucusu http://localhost:${PORT} üzerinde çalışıyor.`);
});
