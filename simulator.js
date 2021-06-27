document.addEventListener("DOMContentLoaded", setup);

function setup () {

    // get canvas element
    var canvas = document.getElementById("main-canvas");
    
    // get drawing object
    var ctx = canvas.getContext("2d");

    // create rect object
    ctx.fillStyle = "lightblue";
    ctx.fillRect(25, 250, 25, 25);

    console.log("Javascript working.");

    var btn = document.getElementById("btn");
    console.log(btn.innerHTML);

    btn.addEventListener('click', function () {
        ctx.clearRect(25, 250, 25, 25);
        ctx.translate(50, 50);
        ctx.fillRect(25, 250, 25, 25);
    });
}
