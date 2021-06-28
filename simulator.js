document.addEventListener("DOMContentLoaded", setup);

function setup () {

    function getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
    }

    // get canvas element
    var canvas = document.getElementById("main-canvas");
    
    // get drawing object
    var ctx = canvas.getContext("2d");

    // create rect object
    ctx.fillStyle = "lightblue";
    ctx.fillRect(300, 300, 10, 10);

    console.log("Javascript working.");

    setInterval(moveSquare, 100);

    function moveSquare () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        var x = getRandomInt(-10, 10);
        var y = getRandomInt(-10, 10);
        ctx.translate(x, y);
        ctx.fillRect(300, 300, 10, 10);
    } 
}
