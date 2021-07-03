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
        this.genes = [];
    }

    setRandomGenes () {
        var min = Math.ceil(-10);
        var max = Math.floor(10);

        for (var i = 0; i < GENE_COUNT; i++) {
            var random_gene = getRandomGene(min, max);
            this.genes.push(random_gene);
        }
    }

    showGenes () {
        for (var i = 0; i < GENE_COUNT; i++) {
            console.log(this.genes[i]);
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
        // c**2 = a**2 + b**2
        var horizontal_distance_squared = (Math.abs(this.x - goal.x)) ** 2;
        var vertical_distance_squared = (Math.abs(this.y - goal.y)) ** 2;

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

function getRandomGene(min, max) {
    var random_x = Math.floor(Math.random() * (max - min + 1) + min);
    var random_y = Math.floor(Math.random() * (max - min + 1) + min);
    var random_gene = [random_x, random_y];
    return random_gene;
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