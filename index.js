const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve the public folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve user.html by default for the root URL
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'user.html'));
});
  

let suggestions = [];

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Send existing suggestions to the presenter
  ws.send(JSON.stringify(suggestions));

  // Handle messages from clients
  ws.on('message', (message) => {
    const parsedMessage = JSON.parse(message);
    
    if (typeof parsedMessage === 'string') {
      // Handle new suggestions
      suggestions.push(parsedMessage);
    } else if (parsedMessage.type === 'delete') {
      // Handle deletion of a suggestion
      suggestions.splice(parsedMessage.index, 1);
    }

    // Broadcast updated suggestions to all clients (including the presenter)
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(suggestions));
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
