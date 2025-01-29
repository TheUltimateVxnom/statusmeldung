const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
require('dotenv').config();
const express = require('express');
const path = require('path');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const app = express();
const port = 3000;

// Bot-Status
let botStatus = 'online'; // Standardstatus
let manualOverride = false; // Steuerung, ob der Bot-Status manuell geändert wurde

// Statusmeldungen und Typen
const statusMessages = ["\ud83e\udd59Macht Döner", "\ud83c\udfaeSpielt Kebabgame"];
let currentStatusIndex = 0;

// Route für die Website
app.get('/', (req, res) => {
  const statusColor = botStatus === 'online' ? 'green' : 'red';
  const buttonText = manualOverride ? 'Automatisch steuern' : 'Manuell down  schalten';
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
            color: ${statusColor};
          }
          button {
            padding: 10px 20px;
            font-size: 1em;
            cursor: pointer;
            margin-top: 20px;
          }
          img {
            width: 100px;
            height: 100px;
          }
        </style>
    </head>
    <body>
        <h1>Discord Bot Status</h1>
        <img src="${botStatus === 'online' ? '/online-icon' : '/offline-icon'}" alt="Bot Status">
        <p class="status">Bot ist aktuell: ${botStatus.toUpperCase()}</p>
        <form method="POST" action="/toggle">
            <button type="submit">${buttonText}</button>
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
  res.sendFile(path.join(__dirname, 'online.png')); // Online-Icon
});
app.get('/offline-icon', (req, res) => {
  res.sendFile(path.join(__dirname, 'offline.png')); // Offline-Icon
});

// Funktion, um den Bot zu starten
async function loginBot() {
  try {
    await client.login(process.env.TOKEN);
    console.log('Bot erfolgreich eingeloggt.');
    botStatus = 'online';
  } catch (error) {
    console.error('Fehler beim Einloggen:', error.message);
    botStatus = 'offline';
  }
}

// Funktion, um den Status des Bots zu aktualisieren
function updateStatus() {
  if (botStatus === 'offline' || manualOverride) return;

  const currentStatus = statusMessages[currentStatusIndex];
  client.user.setPresence({
    activities: [{ name: currentStatus, type: ActivityType.Custom }],
    status: 'online',
  });
  console.log(`Status auf "${currentStatus}" geändert.`);
  currentStatusIndex = (currentStatusIndex + 1) % statusMessages.length;
}

// Funktion, um den /heartbeat Befehl korrekt auszuführen
async function sendHeartbeat() {
  if (botStatus === 'online' && client.application) {
    try {
      await client.application.commands.fetch();
      const command = client.application.commands.cache.find(cmd => cmd.name === 'heartbeat');
      if (command) {
        const guild = client.guilds.cache.first();
        if (guild) {
          const interaction = {
            guild,
            command,
            user: client.user,
            member: guild.members.me,
            client,
            reply: async (msg) => console.log('Heartbeat ausgeführt:', msg),
          };
          await command.execute(interaction);
          console.log('Heartbeat-Befehl erfolgreich ausgeführt.');
        }
      }
    } catch (error) {
      console.error('Fehler beim Ausführen von /heartbeat:', error);
    }
  }
}

// Bot-Event: Wenn der Bot bereit ist
client.once('ready', async () => {
  console.log('Bot ist online.');
  updateStatus();
  await sendHeartbeat(); // Direkt beim Start einmal ausführen
  setInterval(updateStatus, 30000); // Status alle 30 Sekunden aktualisieren
  setInterval(sendHeartbeat, 2 * 60 * 60 * 1000); // Alle 2 Stunden Heartbeat senden
});

// Express-Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

// Bot initial starten
loginBot();
