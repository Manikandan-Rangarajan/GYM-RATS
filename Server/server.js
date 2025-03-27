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
const privatekey = "Gyatt";

mongoose.connect("mongodb://localhost:27017/")
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const verifyToken = async(req,res,next)=>{
    const token = req.headers.authorization;
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
        const newUser = new Client({name,password:hashedPassword,email})
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
        res.status(500).json({message:"Internal server error"},error);
    }
})

app.get("/home",async(req,res)=>{
    res.status(200).json({message:"Hello"});
})


app.listen(PORT,async(req,res)=>{
    console.log(`server running on port ${PORT}`);
})