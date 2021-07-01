document.addEventListener("DOMContentLoaded", setup);

const TOTAL_ORGANISMS = 10;
const GENE_COUNT = 10;
const FPS = 30;

// container holding organisms
organisms = [];

// test variables for animation loop
var x = 0;
var y = 1;

// testing global canvas declaration (comment out if code breaks)
var canvas = document.getElementById("main-canvas");
var ctx = canvas.getContext("2d");

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

            var random_vector = [x_pos, y_pos];

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
        if (this.index < GENE_COUNT) {
            this.x += this.genes[this.index][0];
            this.y += this.genes[this.index][1];
            this.index++;
            console.log(`X: ${this.x}, Y: ${this.y}`);
        }
    }

    move () {
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
        var organism = new Organism(300, 500, ctx);
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

    requestAnimationFrame(function test () {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // goal redrawn on each repaint
        drawGoal(ctx);

        for (var i = 0; i < TOTAL_ORGANISMS; i++) {
            organisms[i].update();
            organisms[i].move();
        }
        

        if (organisms[0].index == GENE_COUNT) {
            console.log("Generation Complete");
            console.log("Now calling new goal function");
            getDistanceToGoal();
            console.log("All complete.");
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

function drawGoal(ctx) {
    ctx.fillStyle = 'lightgreen';
    p = ctx.fillRect(300, 20, 20, 20);
    console.log(p);
}

// the next step is the evaluation stage
// we want to determine an organisms distance to the goal
// distance_to_goal = sqrt(horizontal distance to center) + sqrt(vertical distance to horizonatal line @ target start)

// the first step is to define where the goal is
// goal_x = 300
// goal_y = 20

// I know that, but can I get an object's coordinates programatically?
// looks to not be possible, at least not easily
// we'll have to update the evaluation step if we ever move the goal

// we'll use the center position of the goal to start
function getDistanceToGoal() {
    console.log(`${organisms[0]} <<<`);
    // let's just print out an organism's x and y position
    console.log("Position of organism[0]:");
    console.log(organisms[0].x, organisms[0].y);
    organisms[0].ctx.fillStyle = 'gold';
    organisms[0].ctx.beginPath();
    organisms[0].ctx.arc(organisms[0].x, organisms[0].y, organisms[0].radius, 0, Math.PI*2, false);
    organisms[0].ctx.fill();

    console.log(canvas.width);
}