document.addEventListener("DOMContentLoaded", setup);

const TOTAL_ORGANISMS = 10;
const GENE_COUNT = 10;

// container holding organisms
organisms = [];

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

            this.genes.push([random_vector]);
        }
    }

    // just for testing
    showGenes () {
        console.log(this.genes);
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

    // log genes for each organism (convert to class method?)
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        console.log(`GENES FOR ORGANISM ${i}: `);
        // 'of' keyword allows us to loop through *values* of an iterable object
        for (gene of organisms[i].genes) {
            console.log(gene);
        }
    }
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
}

// function moveOrganism () {
//     // get canvas element
//     var canvas = document.getElementById("main-canvas");
    
//     // get drawing object
//     var ctx = canvas.getContext("2d");

//     ctx.clearRect(0, 0, canvas.width, canvas.height);
//     var x = getRandomInt(-10, 10);
//     var y = getRandomInt(-10, 10);
//     ctx.translate(x, y);
//     ctx.fillRect(300, 300, 10, 10);
// }
