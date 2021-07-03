document.addEventListener("DOMContentLoaded", setup);

const TOTAL_ORGANISMS = 10;
const GENE_COUNT = 10; // original was 10
const FPS = 30;

// container holding organisms
organisms = [];

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
        }
    }

    move () {
        this.ctx.fillStyle = 'purple';
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.ctx.fill();
    }

    calcDistanceToGoal (goal) {
        // can shorten after working
        var horizontal_distance = Math.abs(this.x - goal.x);
        var vertical_distance = Math.abs(this.y - goal.y);

        var horizontal_distance_squared = horizontal_distance ** 2;
        var vertical_distance_squared = vertical_distance ** 2;

        var distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        var distance_to_goal = Math.sqrt(distance_to_goal_squared);

        return distance_to_goal;
    }
}

class Goal {
    constructor(x, y, size, ctx) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.ctx = ctx;
    }

    drawGoal () {
        this.ctx.fillStyle = 'lightgreen';
        this.ctx.fillRect(this.x, this.y, this.size, this.size);
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

    runGeneration();
}

function runGeneration() {
    var canvas = document.getElementById("main-canvas");
    var ctx = canvas.getContext("2d");

    // Create goal
    var goal = new Goal(300, 20, 20, ctx); 

    requestAnimationFrame(function animateFrame () {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // goal redrawn on each repaint
        goal.drawGoal();

        for (var i = 0; i < TOTAL_ORGANISMS; i++) {
            organisms[i].update();
            organisms[i].move();
        }
        
        if (organisms[0].index == GENE_COUNT) {
            console.log("Generation Complete");

            getDistanceToGoal(goal);

            console.log("All complete.");
            return;
        }

        setTimeout(function() {
            requestAnimationFrame(animateFrame);
        }, 1000 / FPS);
    })
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
}

function getDistanceToGoal(goal) {

    var shortest_distance = 10000;
    var closest_organism;

    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        var distance_to_goal = organisms[i].calcDistanceToGoal(goal);
        if (distance_to_goal < shortest_distance) {
            shortest_distance = distance_to_goal;
            closest_organism = i;
        }
    }

    highlightClosestOrganism(closest_organism);
}

function highlightClosestOrganism (closest_organism) {
    organisms[closest_organism].ctx.fillStyle = 'gold';
    organisms[closest_organism].ctx.beginPath();
    organisms[closest_organism].ctx.arc(organisms[closest_organism].x, organisms[closest_organism].y, organisms[closest_organism].radius, 0, Math.PI*2, false);
    organisms[closest_organism].ctx.fill();
}