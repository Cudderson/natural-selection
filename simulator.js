document.addEventListener("DOMContentLoaded", setup);

class Organism {
    constructor (x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
    }
}

function setup () {

    // get canvas element
    var canvas = document.getElementById("main-canvas");
    
    // get drawing object
    var ctx = canvas.getContext("2d");

    // create rect object
    ctx.fillStyle = "lightblue";
    ctx.fillRect(300, 300, 10, 10);

    setInterval(moveOrganism, 100);
    console.log("SETUP COMPLETE");
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
}

function moveOrganism () {
    // get canvas element
    var canvas = document.getElementById("main-canvas");
    
    // get drawing object
    var ctx = canvas.getContext("2d");

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    var x = getRandomInt(-10, 10);
    var y = getRandomInt(-10, 10);
    ctx.translate(x, y);
    ctx.fillRect(300, 300, 10, 10);
}
