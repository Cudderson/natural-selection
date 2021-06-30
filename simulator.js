document.addEventListener("DOMContentLoaded", setup);

const TOTAL_ORGANISMS = 10;
const GENE_COUNT = 10;

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
}

function setup () {

    // get canvas element
    var canvas = document.getElementById("main-canvas");
    
    // get drawing object
    var ctx = canvas.getContext("2d");

    // Create organisms
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        var organism = new Organism(300, 300, 10, 10);
        organism.setRandomGenes();
        organisms.push(organism);
    }

    console.log("SETUP COMPLETE");
    console.log("Amount of organisms created = " + organisms.length);

    // code blocks below work, they show genes for all organisms and a single organism

    // log genes for each organism (convert to class method?)
    // for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        // console.log(`GENES FOR ORGANISM ${i}: `);
        // 'of' keyword allows us to loop through *values* of an iterable object
        // for (gene of organisms[i].genes) {
            // console.log(gene);
        // }
    // }

    // works
    // console.log("SHOWING GENES FUNCTION FOR ORGANISM 0:")
    // organisms[0].showGenes();

     // calling test function for moving organsism
     testMoveOrganism();
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
}

// next, we want to loop through an organism's genes and animate it
// this works
function testMoveOrganism() {

    console.log("CALLED");
    var test_organism = organisms[5];
    // draw starting location
    ctx.fillStyle = 'purple';
    ctx.fillRect(300, 300, 10, 10);

    requestAnimationFrame(function testLoop () {
        // var canvas = document.getElementById("main-canvas");
        // var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // get next movement
        var x_position = test_organism.genes[x][0];
        var y_position = test_organism.genes[x][1];

        console.log(x_position);
        console.log(y_position);

        ctx.translate(x_position, y_position);
        ctx.fillstyle = "purple";
        ctx.fillRect(300, 300, 10, 10);

        x = x + 1;

        if (x === 11) {
            return;
        }

        requestAnimationFrame(testLoop);
    })
}