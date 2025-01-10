const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();
const express = require('express');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const app = express();
const port = 3000;

let botStatus = 'online'; // Standardstatus
let manualOverride = false; // Steuerung, ob der Bot-Status manuell geändert wurde

// Route für die Website
app.get('/', (req, res) => {
  const page = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bot Status</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            text-align: center;
            padding: 20px;
          }
          .status {
            font-size: 1.5em;
            color: ${botStatus === 'online' ? 'green' : 'red'};
          }
          button {
            padding: 10px 20px;
            font-size: 1em;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
        <link rel="icon" href="${botStatus === 'online' ? '/online-icon' : '/offline-icon'}">
    </head>
    <body>
        <h1>Discord Bot Status</h1>
        <p class="status">Bot ist aktuell: ${botStatus.toUpperCase()}</p>
        <form method="POST" action="/toggle">
            <button type="submit">${manualOverride ? 'Automatisch steuern' : 'Manuell down schalten'}</button>
        </form>
    </body>
    </html>
  `;
  res.send(page);
});

// Route für das Umschalten des Bot-Status
app.post('/toggle', (req, res) => {
  manualOverride = !manualOverride;
  if (manualOverride) {
    botStatus = 'offline';
    client.destroy(); // Bot herunterfahren
  } else {
    botStatus = 'online';
    loginBot(); // Bot wieder starten
  }
  res.redirect('/');
});

// Route für Icons
app.get('/online-icon', (req, res) => {
  res.sendFile(path.join(__dirname, 'online.png')); // Hier kannst du ein Online-Icon hinzufügen
});
app.get('/offline-icon', (req, res) => {
  res.sendFile(path.join(__dirname, 'offline.png')); // Hier kannst du ein Offline-Icon hinzufügen
});

// Funktion, um den Bot zu starten
async function loginBot() {
  try {
    await client.login(process.env.TOKEN);
    console.log('Bot erfolgreich eingeloggt.');
  } catch (error) {
    console.error('Fehler beim Einloggen:', error.message);
  }
}

// Bot-Event: Wenn der Bot bereit ist
client.once('ready', () => {
  console.log('Bot ist online.');
  setInterval(() => {
    console.log('Bot-Heartbeat: Der Bot läuft noch.');
  }, 30000);
});

// Express-Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

// Bot initial starten
loginBot();
