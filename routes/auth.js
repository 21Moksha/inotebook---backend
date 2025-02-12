const express = require('express');
const { models } = require('mongoose');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const User=require('../models/User');
const bcrypt=require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET="iamjwtsecreatstring"
var fetchuser = require('../middleware/fetchuser');

//End point to create a user
router.post('/createUser',[
    body('name').isLength({min:3}),
    body('email').isEmail(),
] ,async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors: errors.array() });
    }
    const user=await User.findOne({email:req.body.email});
    //If user does not exists
    if(!user)
    {
        const salt=await bcrypt.genSalt(10);
        const securePassword=await bcrypt.hash(req.body.password, salt);
        usercreate = await User.create({
                name:req.body.name,
                email:req.body.email,
                password:securePassword
        });

        const data={
            usercreate:{
                id:usercreate.id
            }
        }
        const authToken=jwt.sign(data, JWT_SECRET);
        // console.log(authToken);
        res.json({authToken})
    }
    //If user exists
    else
    {
        res.status(500).send("user already exists with the email");
    }
})


//End point to login using credentials
router.post('/loginUser',[
    body('email').isEmail(),
] ,async (req,res)=>{
    const errors = validationResult(req);
    if(!errors.isEmpty())
    {
        return res.status(400).json({errors: errors.array() });
    }
    const {email,password}=req.body;
    try 
    {
        let user=await User.findOne({email});
        if(!user)
        {
            return res.status(400).json({error:"Please try to login with correct credentials"});
        }    
        const passwordCompare =await bcrypt.compare(password,user.password);
        if(!passwordCompare)
        {
            return res.status(400).json({error:"Please try to login with correct credentials"});
        }
        const data={
            user:{
                id:user.id
            }
        }
        const authToken=jwt.sign(data, JWT_SECRET);
        // console.log(authToken);
        res.json({authToken})
    } catch (error) {
        console.error(error.message);
        res.status(500).send("Internal Server Error");
    }

})

//GEt logged in user details 
router.post('/getuser',fetchuser,async (req,res)=>
{
    try 
    {
        const userId=req.user.id;
        const user = await User.findById(userId).select("-password");
        res.send(user);  
    } catch (error) 
    { 
        console.error(error.message);
        res.status(500).send("Internal Server Error");    
    }
});

module.exports = router