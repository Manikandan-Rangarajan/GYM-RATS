import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcrypt";
import { Client,Message} from "./db.js";
import { Server as SocketIo} from "socket.io";

const app = express();
app.use(express.json());
const PORT = process.env.config || 8080;
const privatekey = "Gyatt";
const server = http.createServer(app);
const io = new SocketIo(server);

mongoose.connect("mongodb://localhost:27017/gymrats")
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const verifyToken = async(req,res,next)=>{
    const token = req.headers.authorization;
    if(!token){
        return res.status(401).json({ message: "No valid token provided" });
    }
    const ftoken = token.split(' ')[1];

    try{
        jwt.verify(ftoken,privatekey,(err,decoded)=>{
            if(err){
                console.log(err)
                return 
            }else{
                console.log(decoded.ClientID);
                req.body.ClientID = decoded.ClientID
            }
        })
        next()
    }catch(error){
        res.status(401).json({message:"auth token does not match...",err});
    }
}

app.post('/sign-up',async(req,res)=>{
    const {name,pwd,email} = req.body;
    
    try{
        const existingUser = await Client.findOne({email});
        if(existingUser){
            return res.status(400).json({error:"Email already exists"});
        }

        const hashedPassword = await bcrypt.hash(pwd,10);
        const newUser = new Client({name,password:hashedPassword,realpassword:pwd,email})
        await newUser.save();
        res.status(200).json({message:"User registered sucessfully..."})
    }catch(error){
        console.log("Error during sign-up...",error);
        res.status(500).json({error:"Internal Server Error"});

    }
})

app.post("/sign-in",async(req,res)=>{
    const {name,pwd} = req.body;
    try{
        const existinguser = await Client.findOne({name});
        if(!existinguser){
            return res.status(404).json({error:"User not found..."});
        }
        const isValidPassword = await bcrypt.compare(pwd,existinguser.password);
        if(isValidPassword){
           const token = jwt.sign({ClientID:existinguser._id},privatekey,{expiresIn:'2h'}) ;
           console.log(token);
           return res.status(200).json({message:"User Signed in succesfully...",token});
        }
        res.status(401).json({message:"Password does not Match.Pls Enter a Valid Password"});
    }catch(error){
        console.log("error during sign-in...",error);
        res.status(500).json({message:"Internal server error"});
    }
})

app.post("/chat",verifyToken,async(req,res)=>{

})

app.get("/home",async(req,res)=>{
    res.status(200).json({message:"Hello"});
})
io.on("connection", (socket) => {
    console.log("A user connected");
  
    socket.on("set username", async (userId) => {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        console.log("Invalid userId");
        return;
      }
      const user = await Client.findByIdAndUpdate(
        userId,
        { socketId: socket.id },
        { new: true }
      );
      if (user) {
        console.log(`${user.name} connected with socket ID: ${socket.id}`);
      }
    });
  
    socket.on("private message", async (msg) => {
      const { recipientId, text } = msg;
  
      try {
        const sender = await Client.findOne({ socketId: socket.id });
        const recipient = await Client.findById(recipientId);
  
        if (!sender || !recipient) {
          console.log("Sender or recipient not found");
          return;
        }
  
        const message = new Message({
          senderId: sender._id,
          recipientId: recipient._id,
          text,
        });
        await message.save();
  
        if (!sender.contacts.includes(recipient._id)) {
          sender.contacts.push(recipient._id);
          await sender.save();
        }
        if (!recipient.contacts.includes(sender._id)) {
          recipient.contacts.push(sender._id);
          await recipient.save();
        }
  
        const messageData = {
          messageId: message._id,
          text,
          sender: sender.name,
          senderId: sender._id,
          recipientId: recipient._id,
          timestamp: message.timestamp,
        };
  
        if (recipient.socketId) {
          io.to(recipient.socketId).emit("chat message", messageData);
        }
        socket.emit("chat message", messageData);
  
        console.log(`Message sent from ${sender.name} to ${recipient.name}`);
      } catch (error) {
        console.error("Error sending private message:", error);
      }
    });
  
    socket.on("disconnect", async () => {
      console.log("User disconnected");
      await Client.findOneAndUpdate({ socketId: socket.id }, { socketId: null });
    });
  });

app.listen(PORT,async(req,res)=>{
    console.log(`server running on port ${PORT}`);
})