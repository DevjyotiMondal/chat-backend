import { Server } from "socket.io";
import http from "http";
import express from "express";

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO server with CORS settings
const io = new Server(server, {
	cors: {
		origin: ["https://main--chat-app1245.netlify.app"], // Allow requests from the frontend
		methods: ["GET", "POST"],
		credentials: true, // Allow credentials like cookies
	},
});

// Store userId to socketId mapping
const userSocketMap = {}; // { userId: socketId }

// Get socketId for a given userId
export const getReceiverSocketId = (receiverId) => {
	return userSocketMap[receiverId];
};

io.on("connection", (socket) => {
	console.log("A user connected", socket.id);

	// Retrieve userId from the handshake query
	const userId = socket.handshake.query.userId;
	if (userId !== "undefined") {
		userSocketMap[userId] = socket.id;
	}

	// Notify all clients about the online users
	io.emit("getOnlineUsers", Object.keys(userSocketMap));

	// Listen for the disconnection event
	socket.on("disconnect", () => {
		console.log("User disconnected", socket.id);
		delete userSocketMap[userId]; // Remove user from online users
		io.emit("getOnlineUsers", Object.keys(userSocketMap));
	});

	// Example: Listen for a custom event like "sendMessage"
	socket.on("sendMessage", (message) => {
		const { receiverId, content } = message;
		const receiverSocketId = getReceiverSocketId(receiverId);

		if (receiverSocketId) {
			// Send message to specific user
			io.to(receiverSocketId).emit("receiveMessage", {
				senderId: userId,
				content,
			});
		}
	});

	// Add more custom event listeners as needed
});

export { app, io, server };
