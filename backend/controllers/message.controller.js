import Conversation from "../models/conversation.model.js";
import Message from "../models/message.model.js";
import User from "../models/user.model.js";
import { getReceiverSocketId, io } from "../socket/socket.js";
import OpenAI from "openai";
//import openai from "../config/open-ai.js";

export const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, receiverId],
      });
    }
    const receiverArr = new Array();
    receiverArr.push(receiverId);

    const newMessage = new Message({
      senderId,
      receiverArr,
      message,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    // this will run parallel
    await Promise.all([newMessage.save(), conversation.save()]);

    // SOCKET IO FUNCTIONALITY WILL GO HERE
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // io.to(<socket_id>).emit() used to send events to specific client
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, userToChatId] },
    }).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

const getAssistant = async (msg) => {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const completion = await openai.chat.completions.create({
    messages: [
      { role: "user", content: msg || "You are a helpful assistant." },
    ],
    model: "gpt-3.5-turbo",
  });
  console.log("answear");
  return completion.data.choices[0].message.content;
};

//// to all room

export const sendMessageToAll = async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderId] },
    });
    const otherUsers = await User.find({ _id: { $ne: senderId } }).select(
      "_id"
    );
    console.log(otherUsers[0]);

    if (!conversation) {
      conversation = new Conversation({
        participants: [senderId, ...otherUsers],
      });
    }

    const newMessage = new Message({
      senderId,
      ...otherUsers,
      message,
    });
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    // this will run parallel
    await Promise.all([newMessage.save(), conversation.save()]);

    // SOCKET IO FUNCTIONALITY WILL GO HERE
    otherUsers.map((receiverId) => {
      let receiverSocketId = getReceiverSocketId(receiverId._id);
      if (receiverSocketId) {
        // io.to(<socket_id>).emit() used to send events to specific client
        io.to(receiverSocketId).emit("newMessage", newMessage);
      }
    });

    res.status(201).json(newMessage);
  } catch (error) {
    console.log("Error in sendMessage controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getRoomMessages = async (req, res) => {
  try {
    const senderId = req.user._id;

    const conversation = await Conversation.findOne({
      participants: { $all: [senderId] },
    }).populate("messages"); // NOT REFERENCE BUT ACTUAL MESSAGES

    if (!conversation) return res.status(200).json([]);

    const messages = conversation.messages;

    res.status(200).json(messages);
  } catch (error) {
    console.log("Error in getMessages controller: ", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
};
