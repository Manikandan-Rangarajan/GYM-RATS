import mongoose from "mongoose";

// Client Schema
const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  realpassword: { 
    type: String 
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  socketId: { 
    type: String 
  },
  contacts: [{
     type: mongoose.Schema.Types.ObjectId, 
     ref: "Client" 
    }],
});

//message schema
const messageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const Client = mongoose.model('Client', UserSchema);
const Message = mongoose.model('Message', messageSchema);

export { Client,Message};