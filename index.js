const express = require("express");
const cookieParser = require("cookie-parser");
const bcrypt = require("bcryptjs");
const Joi = require("@hapi/joi");
const jwt = require("jsonwebtoken");

const app = express();



app.use(express.json());
app.use(cookieParser());

app.use(express.static(__dirname+"/public"));

//for testing
const users = [
    {id:1, email:"mrpefr@gmail.com", password:"$2a$14$gQd4OPhHZWVUmwUu.jwLYOuAoxpN5Qkb5NyNwxG0dCdmeZqimu4A2"},
    {id:2, email:"lars@lars.se", password:"$2a$14$sAsRAOgS9JO0psUGBAv11O2Zu6K7ETzQEGV0Ba/JiZCRVblywk1dG"},
];

app.get("/", (req,res)=>{
    res.sendFile(__dirname+"/public/index.html")
})

app.get("/league", (req, res, next)=>{
    if(req.cookies.leagueIds){
        next()
    }
    else{
        res.redirect("/")
    }
},(req,res)=>{
   res.sendFile(__dirname+"/public/LeagueView/index.html")
})


app.post('/register',validateUser,function(req,res){

    let user = {...req.body};

    let userCheck = users.filter(u=>u.email == user.email);
    if(userCheck.length === 0)
    {
        user.id = Date.now();
        users.push(user); 
        res.send({mes:"User Created"});
    }
    else{
        res.send({mes: "user exists"});
    }
    

    /**
     * Registera m h a email verifikation
     * skapa tillfällig token
     * Skicka till email med länk eller kod
     * Verifiera via ny route och uppdatera user med verified:true
     */



});

app.post("/login",validateUser,(req,res)=>{

    /**
     * 1. läs in body
     * 2. validera body!!
     * 3. kolla om användare existerar
     * 4. om så, kolla lösenord
     * 5. skicka response
     * 
     */
    let user = {...req.body};

    let userCheck = users.filter(u=>u.email == user.email);

    if(userCheck.length === 1){

        bcrypt.compare(user.password,userCheck[0].password,(err,success)=>{

            if(success){


                let token = jwt.sign({email:user.email,admin:false},process.env.SEC,{
                    expiresIn:120
                });
                console.log(token);
                res.status(202).send({mes:"logged in",token});


            }
            else
            {
                res.status(400).send({mes:"bad request"});
            }

        });

    }
    else
    {res.status(400).send({mes:"No user"})}
});

async function validateUser(req,res,next){
    console.log(req.body);
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(9)
    });

    try {
        let user = await schema.validateAsync(req.body);
        next();
    } catch (error) {
        res.send({mes: "bad input"});
    }

}



const port = process.env.PORT || 3501;
app.listen(port,()=>console.log("port: "+port));