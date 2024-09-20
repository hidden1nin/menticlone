const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve the public folder
app.use(express.static(path.join(__dirname, 'public')));


class Room {
  constructor(code) {
    this.code = code;
    this.authCode = null;
    this.presenter = null;
    this.clients = new Set();
    this.suggestions = [];
    //Voting options
    this.topic = null;
    this.focus = null;
    this.voteoptions = [];
    this.votes = [];
    //Remove after 5 hours
    this.established = Date.now();
  }

  //Add presenter if they join or students when they join.
  addClient(ws, auth) {
    ws.code = this.code;
    //If presenter move to that role
    if (auth == this.authCode || (this.authCode==null && auth !=null) ) {
      this.authCode = auth;
      this.presenter = ws;
      ws.send(JSON.stringify(this.suggestions));
      ws.send(JSON.stringify({type:"topic_rec",topic:this.topic}));
      ws.send(JSON.stringify({type:"question_rec",voteoptions:this.voteoptions}));
      ws.send(JSON.stringify({type:"count",count:this.clients.size}));
      ws.send(JSON.stringify({type:"vote_count",votecount:this.votes}));
      return;
    } else {
      //Add students to list
      
      this.clients.add(ws);
    }
    //If bad auth token ( Create new class.)
    if(auth !=null){
      ws.send(JSON.stringify({type:"exit"}));
    }

    this.broadcastSuggestions();
  }

  removeClient(ws) {
    this.clients.delete(ws);
    this.broadcastSuggestions();
  }

  broadcastSuggestions() {
    if(this.presenter==undefined||this.presenter==null)return;
    const suggestionsMessage = JSON.stringify(this.suggestions);
    this.presenter.send(suggestionsMessage)
    
    //Also send the count of users
    this.presenter.send(JSON.stringify({type:"count",count:this.clients.size}));
    this.presenter.send(JSON.stringify({type:"vote_count",votecount:this.votes}));

    //Send out vote information to all people
    this.clients.forEach(ws =>{
      ws.send(JSON.stringify({type:"focus",focus:this.focus}));
      ws.send(JSON.stringify({type:"topic",topic:this.topic}));
      ws.send(JSON.stringify({type:"vote_options", voteoptions:this.voteoptions}))
    });
  }
}

var rooms = new Map();

const FIVE_HOURS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

setInterval(() => {
  const now = Date.now();
  
  rooms.forEach((room, code) => {
    // Check if the room is older than 5 hours
    if (now - room.established > FIVE_HOURS) {
      rooms.delete(code);
      room.clients.forEach((clientWs) => {
        clientWs.send(JSON.stringify({type:"exit"}));
        clientWs.close();
      });
      room.presenter.send(JSON.stringify({type:"exit"}));
      room.presenter.close();
      console.log(`Room with code ${code} has been deleted due to age.`);
    }
  });
}, 10 * 1000); // Check every 10 seconds for dangling rooms.


// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New client connected');

  // Handle messages from clients
  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);
      
      //Connect to room.

      if (parsedMessage.type === 'connect') {
        const { code, auth } = parsedMessage;

        // Create or retrieve room
        if (!rooms.has(code)) {
          // Assuming you have a predefined auth code, replace 'YOUR_AUTH_CODE' with your logic
          rooms.set(code, new Room(code));
        }
        const room = rooms.get(code);
        room.addClient(ws, auth);
        return;
      }

      //Block further code if not in room.

      if(rooms.get(ws.code)==undefined) return;


      if (typeof parsedMessage === 'string') {
        // Handle new suggestions
        var suggestions = rooms.get(ws.code).suggestions;
        if(suggestions.indexOf(parsedMessage)==-1) suggestions.push(parsedMessage);
      } else if (parsedMessage.type === 'delete') {
        // Handle deletion of a suggestion
        if(ws == rooms.get(ws.code).presenter) rooms.get(ws.code).suggestions.splice(parsedMessage.index, 1);
      } else if (parsedMessage.type === 'focus') {
        // Handle focusing on an element css.
        if(ws == rooms.get(ws.code).presenter) rooms.get(ws.code).focus = parsedMessage.focus;
      } else if (parsedMessage.type === 'vote_options') {
        // Update vote options
        if(ws == rooms.get(ws.code).presenter) {
          rooms.get(ws.code).voteoptions = parsedMessage.vote_options;
          rooms.get(ws.code).votes  = [];
        }
      } else if (parsedMessage.type === 'topic') {
        // Set topic to show on screens
        if(ws == rooms.get(ws.code).presenter) {
          rooms.get(ws.code).topic = parsedMessage.topic;
        }
      } else if (parsedMessage.type === 'vote' &&parsedMessage.vote !=undefined) {
        // Add vote from a client
        rooms.get(ws.code).votes.push(parsedMessage.vote);
      }

      // Broadcast updated suggestions to the presenter
      rooms.get(ws.code).broadcastSuggestions();
    }  catch (error) {
      //Probably invalid JSON, log the error and keep truckin :p
      console.error(`Error: ${error}`);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    if(rooms.get(ws.code)==undefined) return;
    rooms.get(ws.code).removeClient(ws)
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
