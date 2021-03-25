const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const saltRounds = 10;


const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    database: "test"
})

router.get("/", (req,res)=>{
    res.send("Funcionando el routeo");
})

function verifyToken (req,res,next){
    const bearerHeader = req.headers["authorization"]
    if(typeof bearerHeader !== "undefined"){
        const bearerToken = bearerHeader.split(" ")[1]
        req.token = bearerToken
        next()
    }else{
        res.sendStatus(403)
    }
}

router.post("/login", (req,res)=>{
    var email = req.body.email;
    var password = req.body.password;

    pool.query("SELECT id_user, user_email, user_password FROM users WHERE user_email='"+email+"'", (err, rows)=>{
        if(err){
            res.send(err)
        }
        if(rows[0]==null){
            res.send("Email Inexistente")
        }
        bcrypt.compare(password, rows[0].user_password, function(err, hashResult){
            if(hashResult){
                const user={
                    id_user:rows[0].id_user,
                    mail:rows[0].user_email,
                    pw:rows[0].user_password
                }
                const tokenA = jwt.sign({user}, "secretKey", {expiresIn: "1m"})
                const tokenR = jwt.sign({user}, "secretKeyRefresh")
                res.json({tokenA, tokenR})
                //res.send("Usuario Logeado")
            }else{
                res.send("Contraseña erronea")
            }
        })
    })

})

router.post("/add-post", verifyToken, (req,res)=>{
    jwt.verify(req.token, "secretKey", (err, data)=>{
         if(err){
            res.send(err)
        }else{
            pool.query("INSERT INTO posts VALUES (null, '"+data.id_user+"','"+req.body.post+"')", (err, rows)=>{
                if(err){
                    res.send("No se pudo guardar el post")
                }else{
                    res.send("Post guardado exitosamente")
                }
            })
        }
    })
})


module.exports = router;



