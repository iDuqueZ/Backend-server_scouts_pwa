const {response} = require("express");
const { generateJWT } = require("../Helpers/jwt")
const {generateRandomPass} = require("../Helpers/randomPassowrd");
const bcrypt = require('bcryptjs');
const { mailOptions_, transporter } = require("../Helpers/EmailConfig");
const{RESPONSE_MESSAGES}=require('../Helpers/ResponseMessages');
const Acudiente = require('../Model/Acudiente');

const createAcudiente= async(req,res=response)=>{
    let { email } = req.body;
    try {  
        let password = generateRandomPass(10);
        let acudiente_ = await Acudiente.findOne({ email })
        if( acudiente_ ){return res.status(400).json({ok: false,msg:RESPONSE_MESSAGES.ERR_ALREADY_EXISTS})}
        acudiente_ = new Acudiente( req.body );
        acudiente_.password = bcrypt.hashSync( password, bcrypt.genSaltSync() );
        await acudiente_.save();
        transporter.sendMail(mailOptions_(email,password,1,acudiente_.nombre),(err)=>{
            if(err){console.log(err);}
        });
        return res.status(201).json({ok:true,uid: acudiente_.id,name: acudiente_.name});
    } catch (error) {
        console.log(error);
        return res.status(500).json({ok:false,msg: RESPONSE_MESSAGES.ERR_500});}
}
const revalidateToken= async(req,res) => {
    let {id,nombre,email}=req;
    const token= await generateJWT(id,nombre,email);
    res.status(200).json({ok:true,token});
}
const readAcudiente= async(req,res=response)=>{
    let id=req.params.id;
    try{
        let acudiente_ = await Acudiente.findById(id);
        if(acudiente_){return res.status(200).json({ok:true,acudiente_ });}
        return res.status(404).json({ok:false,msg:RESPONSE_MESSAGES.ERR_ALREADY_EXISTS});
    }catch(e){
        console.log(e);
        return res.status(500).json({ok:false,msg:RESPONSE_MESSAGES.ERR_500});
    }
}
const readAcudientes= async(req,res=response)=>{
    try{
    let {email} = req.body;
    let acudiente_ = await Acudiente.find({email}).limit(10);
    if(acudiente_){res.status(200).json({ok:true,acudiente_});}
    return res.status(404).json({ok:false,msg:RESPONSE_MESSAGES.ERR_NOT_FOUND});
    }catch(e)
    {
        console.log(e);
        return res.status(500).json({ok:false,msg:RESPONSE_MESSAGES.ERR_500});
    }
}
const loginAcudiente= async(req,res=response) => {
    let {email,password}=req.body;
    try {
     let acudiente_=await Acudiente.findOne({email});
     if(!acudiente_){return res.status(404).json({ok:false,msg:RESPONSE_MESSAGES.ERR_EMAIL_NOT_FOUND})}
     let validPassword=bcrypt.compareSync(password,acudiente_.password);
     if(!validPassword){return res.status(400).json({ok:false,msg:RESPONSE_MESSAGES.ERR_INVALID_PASSWORD})}
     const token= await generateJWT(acudiente_.id,acudiente_.nombre,acudiente_.email);
     return res.status(200).json({ok:true,_id:acudiente_.id,name:acudiente_.nombre,email,token})
    } catch (error) {
        console.log(error);
        return res.status(500).json({ok:false,msg:RESPONSE_MESSAGES.ERR_500})
    }
}
const deleteAcudiente = async (req,res=response) =>{
    try{
        let id = req.params.id;
        const acudiente_ = Acudiente.findById(id);
        
        if(!acudiente_){return res.status(404).json({ok:false,msg:RESPONSE_MESSAGES.ERR_NOT_FOUND});}
        await Acudiente.findByIdAndDelete(id);
        res.status(200).json({ok:true,msg:RESPONSE_MESSAGES.SUCCESS_2XX});
    }catch(e){
        console.log(e);
        return res.status(500).json({ok:false,msg:RESPONSE_MESSAGES.ERR_500})
    }
}
const changePassword = async (req, res)=>{
    try{
        let {newPassword,email} = req.body;
        const acudiente_ = await Acudiente.findOne({email:email});
        if(!acudiente_){return res.status(404).json({ok:false,msg:RESPONSE_MESSAGES.ERR_EMAIL_NOT_FOUND});}
        let password =bcrypt.hashSync(newPassword,bcrypt.genSaltSync());
        acudiente_.password = password;
        await acudiente_.save();
        transporter.sendMail(mailOptions_(acudiente_.email,newPassword,2,acudiente_.nombre),(err)=>{
            if(err){console.log(err);}
        });
        return res.status(200).json({ok:true,msg:RESPONSE_MESSAGES.SUCCESS_2XX});
}catch(e){
    console.log(e);
    return res.status(404).json({ok:false,msg:RESPONSE_MESSAGES.ERR_500});}
}

module.exports={
    createAcudiente,
    readAcudientes,
    readAcudiente,
    deleteAcudiente,
    loginAcudiente,
    changePassword,
    revalidateToken
}