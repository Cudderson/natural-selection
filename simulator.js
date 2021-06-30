document.addEventListener("DOMContentLoaded", setup);

const TOTAL_ORGANISMS = 10;
const GENE_COUNT = 10;
const FPS = 30;

// container holding organisms
organisms = [];

// test variables for animation loop
var x = 0;
var y = 1;

// testing global canvas declaration
var canvas = document.getElementById("main-canvas");
var ctx = canvas.getContext("2d");

class Organism {
    constructor (x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.index = 0;
    }

    // class method for creating random genes
    setRandomGenes () {

        this.genes = [];

        for (var i = 0; i < GENE_COUNT; i++) {
            // Create random vectors (genes)
            var x_pos = getRandomInt(-10, 10);
            var y_pos = getRandomInt(-10, 10);

            var random_vector = ([x_pos, y_pos]);
            // console.log(random_vector)

            this.genes.push(random_vector);
        }
    }

    // just for testing
    showGenes () {
        for (gene of this.genes) {
            console.log(gene);
        }
    }

    update () {
        console.log("called update");
        if (this.index < GENE_COUNT) {
            this.x = this.genes[this.index][0];
            this.y = this.genes[this.index][1];
            this.index++;
            console.log(`X: ${this.x}, Y: ${this.y}`);
        }
    }

    move () {
        console.log("called move");
        this.ctx.fillStyle = 'purple';
        this.ctx.translate(this.x, this.y);
        this.ctx.fillRect(300, 300, 10, 10);
    }
}

function setup () {

    // get canvas element
    var canvas = document.getElementById("main-canvas");
    
    // get drawing object
    var ctx = canvas.getContext("2d");

    // Create organisms
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        var organism = new Organism(300, 300, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }

    console.log("SETUP COMPLETE");
    console.log("Amount of organisms created = " + organisms.length);

    // code blocks below work, they show genes for all organisms and a single organism

    // log genes for each organism (convert to class method?)
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        console.log(`GENES FOR ORGANISM ${i}: `);
        // 'of' keyword allows us to loop through *values* of an iterable object
        for (gene of organisms[i].genes) {
            console.log(gene);
        }
    }

    // works
    // console.log("SHOWING GENES FUNCTION FOR ORGANISM 0:")
    // organisms[0].showGenes();

     // calling test function for moving organsism
    //  testMoveOrganism();
    // testMoveAllOrganisms();
    moveOrganisms();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
}

function moveOrganisms() {
    var tracker = 0;

    

    for (var j = 0; j < GENE_COUNT; j++) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < TOTAL_ORGANISMS; i++) {
            console.log(`ORGANISM #${i}`);
            organisms[i].update();
            organisms[i].move();
            console.log(organisms[i].x, organisms[i].y);

            tracker++;
        }
    }
    console.log(tracker); // 100;
    
}

// next, we want to loop through an organism's genes and animate it
// this works
// function testMoveOrganism() {

//     console.log("CALLED");
//     var test_organism = organisms[5];
//     // draw starting location
//     ctx.fillStyle = 'purple';
//     ctx.fillRect(300, 300, 10, 10);

//     requestAnimationFrame(function testLoop () {
//         // var canvas = document.getElementById("main-canvas");
//         // var ctx = canvas.getContext("2d");
//         ctx.clearRect(0, 0, canvas.width, canvas.height);

//         // get next movement
//         var x_position = test_organism.genes[x][0];
//         var y_position = test_organism.genes[x][1];

//         console.log(x_position);
//         console.log(y_position);

//         ctx.translate(x_position, y_position);
//         ctx.fillstyle = "purple";
//         ctx.fillRect(300, 300, 10, 10);

//         x = x + 1;

//         if (x === GENE_COUNT) {
//             return;
//         }

//         // (working) control animation execution speed
//         setTimeout(function() {
//             requestAnimationFrame(testLoop);
//         }, 1000 / FPS);
//     })
// }

// with animation working for the test organism, let's do it for all of our organisms
// can make class method after

// currently, this code redraws each organisms final position
// function testMoveAllOrganisms() {

//     console.log(organisms.length);

//     // track gene count
//     var q = 0;
    
//     console.log("CALLED.");
//     ctx.fillStyle = 'gold';
//     ctx.fillRect(300, 300, 10, 10);

//     for (var i = 0; i < TOTAL_ORGANISMS; i++) {
//         ctx.clearRect(0, 0, canvas.width, canvas.height);
//         for (var j = 0; j < GENE_COUNT; j++) {

//             requestAnimationFrame(function testLoopAll () {

//                 console.log(i);
//                 var x_position = organisms[i].genes[j][0];
//                 var y_position = organisms[i].genes[j][1];

//                 console.log(x_position);
//                 console.log(y_position);

//                 ctx.translate(x_position, y_position);
//                 ctx.fillStyle = 'gold';
//                 ctx.fillRect(300, 300, 10, 10);

//                 q = q + 1;

//                 if (q === GENE_COUNT) {
//                     return;
//                 }

//                 setTimeout(function() {
//                     requestAnimationFrame(testLoopAll);
//                 }, 1000 / FPS);
//             })
            
//         }
//     }
//     console.log(q); // == 100, 10 organisms x 10 genes
// }

// the problem is that we clearRect on every update, so only 1 organism shows at the end. 
// I instead need to draw 10 organisms on the same loop
// perhaps I could have a loop that first clears the canvas, and then redraws each organisms new position (yes)
