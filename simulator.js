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
// var canvas = document.getElementById("main-canvas");
// var ctx = canvas.getContext("2d");

class Organism {
    constructor (x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.radius = 5;
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
            this.x += this.genes[this.index][0];
            this.y += this.genes[this.index][1];
            this.index++;
            console.log(`X: ${this.x}, Y: ${this.y}`);
        }
    }

    move () {
        console.log("called move");
        this.ctx.fillStyle = 'purple';
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.ctx.fill();
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

    // code block below works, it shows genes for all organisms

    // log genes for each organism (convert to class method?)
    // for (var i = 0; i < TOTAL_ORGANISMS; i++) {
    //     console.log(`GENES FOR ORGANISM ${i}: `);
    //     // 'of' keyword allows us to loop through *values* of an iterable object
    //     for (gene of organisms[i].genes) {
    //         console.log(gene);
    //     }
    // }

    testMoveOneOrganism();
}

function testMoveOneOrganism() {
    var canvas = document.getElementById("main-canvas");
    var ctx = canvas.getContext("2d");
    test_organism = organisms[3];

    
    requestAnimationFrame(function test () {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        console.log("HI");
        test_organism.update();
        test_organism.move();

        if (test_organism.index == GENE_COUNT) {
            console.log("DONE");
            return;
        }

        setTimeout(function() {
            requestAnimationFrame(test);
        }, 1000 / FPS);
    })
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
}

