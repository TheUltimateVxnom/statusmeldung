const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();
const express = require('express');

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

const app = express();
const port = 3000;

let botStatus = 'online'; // Standardstatus
let manualOverride = false; // Steuerung, ob der Bot-Status manuell geändert wurde

// Middleware für POST-Anfragen
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
        <link rel="icon" href="data:image/svg+xml,${encodeURIComponent(
          botStatus === 'online'
            ? '<svg xmlns="http://www.w3.org/2000/svg" fill="green" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM6.707 10.293 4.414 8l2.293-2.293a1 1 0 0 0-1.414-1.414L3 7.293l-2.293-2.293a1 1 0 0 0-1.414 1.414L1.586 8 .293 9.707a1 1 0 1 0 1.414 1.414L3 8.707l2.293 2.293a1 1 0 0 0 1.414-1.414z"/></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" fill="red" viewBox="0 0 16 16"><path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zm3.646 4.646a.5.5 0 0 0-.707 0L8 7.586 5.061 4.646a.5.5 0 1 0-.707.707L7.293 8l-2.939 2.646a.5.5 0 1 0 .707.707L8 8.414l2.939 2.939a.5.5 0 1 0 .707-.707L8.707 8l2.939-2.939a.5.5 0 0 0 0-.707z"/></svg>'
        )}">
    </head>
    <body>
        <h1>Discord Bot Status</h1>
        <p class="status">Bot ist aktuell: ${botStatus.toUpperCase()}</p>
        <form method="POST" action="/toggle">
            <button type="submit">${manualOverride ? 'Automatisch steuern' : 'Manuell offline schalten'}</button>
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
    console.log('Bot wurde manuell offline geschaltet.');
  } else {
    botStatus = 'online';
    loginBot(); // Bot wieder starten
    console.log('Bot wurde manuell online geschaltet.');
  }
  res.redirect('/');
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
});

// Express-Server starten
app.listen(port, () => {
  console.log(`Server läuft auf http://localhost:${port}`);
});

// Bot initial starten
loginBot();
