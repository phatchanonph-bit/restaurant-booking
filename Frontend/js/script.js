document.querySelector("form").addEventListener("submit", function(e){
    e.preventDefault()

    const data = {
        name: document.querySelector("input[type=text]").value,
        phone: document.querySelector("input[type=tel]").value,
        people: document.querySelector("input[type=number]").value,
        date: document.querySelector("input[type=date]").value,
        time: document.querySelector("input[type=time]").value
    }

    fetch("http://localhost:3000/book",{
        method:"POST",
        headers:{
            "Content-Type":"application/json"
        },
        body:JSON.stringify(data)
    })
    .then(res=>res.json())
    .then(data=>{
        alert("จองสำเร็จ")
        console.log(data)
    })
})