const express = require("express");
const app = express();
const jwt = require("jsonwebtoken");
const mysql = require("mysql2");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const Users = require("./users");

app.use(express.json());
app.use("/users", Users);

const pool = mysql.createPool({
    host: "localhost",
    user: "root",
    database: "test"
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

function generateAccessToken(user){
    return jwt.sign(user, "secretKey", {expiresIn:"30s"})
}

app.post("/token", (req,res)=>{
    const refreshToken=req.body.token;
    
    if(refreshToken=="undefined"){
        res.sendStatus(401)
    }
    jwt.verify(refreshToken, "secretKeyRefresh", (err, user)=>{
        if(err){
            res.json(err)
        }else{
            
            const accessToken=generateAccessToken(user.user)
            res.json({tokenA: accessToken})
        }
    })
})


app.post("/jwt-ejemplo", verifyToken, (req,res)=>{
    jwt.verify(req.token, "secretKey", (err, data)=>{
        if(err){
            res.send(err)
        }else{
            res.send(data)
        }
    })

})



app.get("/", (req,res) => {
    pool.query("SELECT * FROM users", (err, rows, fields)=>{
        res.json(rows);
    })
});


/*app.post("/login", (req,res)=>{
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

})*/

/*app.post("/add-post", verifyToken, (req,res)=>{
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
})*/


app.post("/sign-in", async (req,res)=>{
    var name = req.body.name;
    var email = req.body.email;
    var password = await bcrypt.hash(req.body.password, saltRounds);

    pool.query("SELECT * FROM users WHERE user_email='"+email+"'", (err, rows)=>{
        if(err){
            res.send(err)
        }
        if(rows[0]!=null){
            res.send("Email ya utilizado, probá con otro.")
        }
        else{
            pool.query("INSERT INTO users VALUES (null, '"+name+"','"+email+"','"+password+"')", (err)=>{
                if(err){
                    console.log(err)
                }
                res.send("Usuario agregado con éxito.");
            })
        }
    })

    
});

app.put("/update-user", (req,res)=>{
    var password = req.body.password;
    pool.query('UPDATE users SET `user_password` ="'+password+'" WHERE `id_user` = 9', (err)=>{
        if(err){
            console.log(err)
        }
        res.send("Usuario modificado con éxito");
    })
})


app.delete("/delete-user/:id", (req,res)=>{
    const id=req.params.id;
    pool.query("DELETE FROM users WHERE id_user ='"+id+"'", (err)=>{
        if(err){
            console.log(err)
        }
        res.send("Usuario eliminado con éxito")
    })
});

app.listen("8080", ()=>{
    console.log("Corriendo en el puerto 8080");
});



