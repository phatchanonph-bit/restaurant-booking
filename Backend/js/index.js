const express = require("express")
const cors = require("cors")
const mysql = require("mysql2")

const app = express()

app.use(cors())
app.use(express.json())

const db = mysql.createConnection({
  host: "localhost",   // ถ้าไม่ได้ใช้ docker
  user: "root",
  password: "1234",
  database: "restaurant"
})

db.connect(err => {
  if (err) {
    console.log("DB Error", err)
  } else {
    console.log("MySQL Connected")
  }
})

app.get("/", (req,res)=>{
  res.send("Restaurant Booking API")
})

app.post("/book",(req,res)=>{

  const {name,phone,people,date,time} = req.body

  const sql = `
  INSERT INTO bookings
  (name,phone,people,date,time)
  VALUES (?,?,?,?,?)
  `

  db.query(sql,[name,phone,people,date,time],(err,result)=>{
    if(err){
      res.json(err)
    }else{
      res.json({message:"Booking success"})
    }
  })

})

app.listen(3000,()=>{
  console.log("Server running on port 3000")
})
