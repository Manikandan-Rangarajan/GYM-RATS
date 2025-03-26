import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt, { hash } from "bcrypt";
import { Client } from "./db.js";

const app = express();
app.use(express.json());
app.use(bodyParser.json());
const PORT = process.env.connfig || 8080;

mongoose.connect("mongodb://localhost:27017/")
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

app.post('/sign-up',async(req,res)=>{
    const {name,pwd,email} = req.body;
    
    try{
        const existingUser = await Client.findOne({email});
        if(existingUser){
            return res.status(400).json({error:"Email already exists"});
        }

        const hashedPassword = await bcrypt.hash(pwd,10);
        const newUser = new Client({name,password:hashedPassword,email})
        await newUser.save();
        res.status(200).json({message:"User registered sucessfully..."})
    }catch(error){
        console.log("Error during sign-up...",error);
        res.status(500).json({error:"Internal Server Error"});

    }
})

app.get("/home",async(req,res)=>{
    res.status(200).json({message:"Hello"});
})


app.listen(PORT,async(req,res)=>{
    console.log(`server running on port ${PORT}`);
})