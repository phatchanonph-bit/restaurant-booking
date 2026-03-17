document.querySelector("form").addEventListener("submit", function(e) {
    e.preventDefault();

    // 1. ดึงข้อมูลจากช่องกรอกต่างๆ
    const name = document.querySelector("input[type=text]").value;
    const phone = document.querySelector("input[type=tel]").value;
    // ใช้ parseInt เพื่อให้แน่ใจว่าเป็นตัวเลขเพียวๆ ส่งไปให้คอลัมน์ int ใน DB
    const people = parseInt(document.querySelector("input[type=number]").value);
    const date = document.querySelector("input[type=date]").value;
    const time = document.querySelector("input[type=time]").value;

    // 2. ดึงเลขโต๊ะจาก localStorage 
    // ตรวจสอบให้แน่ใจว่าชื่อ Key ตรงกับที่หน้าเลือกโต๊ะบันทึกไว้ (ในที่นี้ใช้ bookTable ตามหน้า success)
    const table = localStorage.getItem("bookTable"); 

    // 3. เก็บลง localStorage อีกครั้งเพื่อให้หน้า success.html ดึงไปโชว์ได้ถูกต้อง
    localStorage.setItem("bookName", name);
    localStorage.setItem("bookPhone", phone);
    localStorage.setItem("bookPax", people + " ท่าน"); // ใส่คำว่า "ท่าน" เฉพาะตอนโชว์ที่หน้าเว็บ
    localStorage.setItem("bookDate", date);
    localStorage.setItem("bookTime", time);

    // 4. เตรียมข้อมูลส่งไปที่ Backend (คีย์ต้องตรงกับที่ server.js รอรับ)
    const data = {
        name: name,
        phone: phone,
        people: people, // ส่งเฉพาะตัวเลขเข้า Database เพื่อไม่ให้เกิด Error
        date: date,
        time: time,
        table_number: table 
    };

    // 5. ส่งข้อมูลไปที่ Server
    fetch("http://localhost:3000/book", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    })
    .then(res => res.json())
    .then(result => {
        if (result.message === "Booking successful!") {
            alert("จองสำเร็จ!");
            window.location.href = "success.html"; 
        } else {
            alert("เกิดข้อผิดพลาด: " + result.error);
        }
    })
    .catch(error => {
        console.error("Error:", error);
        alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    });
});