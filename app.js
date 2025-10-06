// Simple Express + Socket.io server with Firebase token verification.
// BEFORE RUNNING: place your Firebase service account JSON at server/serviceAccountKey.json
const path = require('path');
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const admin = require('firebase-admin');
const fs = require('fs');

const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
if (fs.existsSync(serviceAccountPath)) {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase admin initialized.');
} else {
  console.warn('No serviceAccountKey.json found in server/. Firebase admin not initialized.');
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] }
});

app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (req, res) => res.json({ ok: true }));

async function verifyToken(token) {
  if (!admin.apps.length) {
    return { uid: 'dev-' + (token || 'anonymous') };
  }
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    return decoded;
  } catch (e) {
    console.error('Token verify failed', e);
    throw e;
  }
}

io.use(async (socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  try {
    const decoded = await verifyToken(token);
    socket.user = decoded;
    return next();
  } catch (err) {
    return next(new Error('Authentication error'));
  }
});

io.on('connection', (socket) => {
  console.log('socket connected', socket.id, 'user=', socket.user && socket.user.uid);

  socket.on('presence', (data) => {
    socket.role = data && data.role;
    socket.vehicleId = data && data.vehicleId;
    if (socket.user && socket.user.uid) socket.join('uid:' + socket.user.uid);
    if (socket.role === 'driver' && socket.vehicleId) socket.join('vehicle:' + socket.vehicleId);
    io.emit('presence:update', { uid: socket.user && socket.user.uid, role: socket.role, vehicleId: socket.vehicleId });
  });

  socket.on('driver:location', (payload) => {
    const room = payload && payload.vehicleId ? 'vehicle:' + payload.vehicleId : null;
    if (room) {
      io.to(room).emit('vehicle:location', { vehicleId: payload.vehicleId, lat: payload.lat, lng: payload.lng, ts: Date.now() });
    }
    io.emit('vehicle:location:all', { vehicleId: payload.vehicleId, lat: payload.lat, lng: payload.lng, ts: Date.now() });
  });

  socket.on('track:vehicle', (vehicleId) => {
    if (!vehicleId) return;
    socket.join('vehicle:' + vehicleId);
    socket.emit('track:ack', { vehicleId });
  });

  socket.on('disconnect', (reason) => {
    console.log('socket disconnect', socket.id, reason);
    io.emit('presence:update', { uid: socket.user && socket.user.uid, role: socket.role, disconnected: true });
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log('Server running on port', PORT));
