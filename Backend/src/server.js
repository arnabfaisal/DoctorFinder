const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth.routes');
const reviewRoutes = require("./routes/review.routes")
const viewdoctors  = require("./routes/viewdoctor")
const reportRoutes = require('./routes/report.routes');
const chatRoutes = require('./routes/chat.route');

const http = require('http');
const WebSocket = require('ws');
const { pool } = require('./db');
const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/auth', authRoutes);
app.use('/api/review', reviewRoutes);
app.use('/api/doctor', viewdoctors);
app.use('/api/report', reportRoutes);
app.use('/api/chat', chatRoutes);


const PORT = process.env.PORT;


const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

let clients = {};

wss.on('connection', (ws, req) => {
  console.log("new client connected to chat!!!")
  console.log(`ws : ${ws}`)
  console.log(`req : ${req}`)

  ws.on("message", async (msg) => {


    try {

      const data = JSON.parse(msg);

      if (data.type === 'auth') {
        clients[data.user_id] = ws; 
        console.log(`User ${data.user_id} authenticated on WS`);
      }

      if(data.type === "chat") {
        const { chat_id, sender_id, sender_role, recipient_id, content } = data;

        // jeno theke jay data gula
        const [result] = await pool.query(
          "INSERT INTO msg (sender_id, sender_role, content, created_at, updated_at, chat_id) VALUES (?, ?, ?, NOW(), NOW(), ?)",
          [sender_id, sender_role, content, chat_id]
        );


        await pool.query(
          "UPDATE chat SET last_message=?, updated_at=NOW() WHERE chat_id=?",
          [content, chat_id]
        );

        if (clients[recipient_id]) {
          clients[recipient_id].send(JSON.stringify({
            chat_id,
            sender_id,
            content,
            msg_id: result.insertId
          }));
        }
      }
      
    } catch (error) {
        console.error("WS error:", error);
    }
  })


  ws.on('close', () => {
    if (ws.user_id) {
      delete clients[ws.user_id];
      console.log(`User ${ws.user_id} disconnected`);
    }
  });
});

// app.listen(PORT, () => console.log(`Server started!!! http://localhost:${PORT}`));


server.listen(PORT, () => {
  console.log(`Server + WebSocket started on http://localhost:${PORT}`);
});


/*

npm start

npm run dev 

sudo /opt/lampp/lampp start

*/

