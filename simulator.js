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

    setInterval(moveSquare, 10);

    function moveSquare () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.translate(1, 0);
        ctx.fillRect(25, 250, 25, 25);
    }
}
