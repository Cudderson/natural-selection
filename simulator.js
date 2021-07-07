document.addEventListener("DOMContentLoaded", setup);

const TOTAL_ORGANISMS = 20;
const GENE_COUNT = 100; // original was 10
const FPS = 30;

// organism starting coordinates
const initial_x = 300; 
const initial_y = 500;

// target goal coordinates
const goal_x_pos = 300;
const goal_y_pos = 20;

// container holding organisms
var organisms = [];

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
        this.distance_to_goal;
        this.fitness;
    }

    setRandomGenes () {
        var min = Math.ceil(-5);
        var max = Math.floor(5);

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

    calcDistanceToGoal () {
        // c**2 = a**2 + b**2
        var horizontal_distance_squared = (Math.abs(this.x - goal_x_pos)) ** 2;
        var vertical_distance_squared = (Math.abs(this.y - goal_y_pos)) ** 2;

        var distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        var distance_to_goal = Math.sqrt(distance_to_goal_squared);

        this.distance_to_goal = distance_to_goal;

        return distance_to_goal;
    }

    calcFitness () {
        // height = distance between starting location(y) and goal.y
        var height = initial_y - goal_y_pos;

        var normalized_distance_to_goal = this.distance_to_goal / height;
        this.fitness = 1 - normalized_distance_to_goal;
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

    // Create organisms with random genes
    createOrganisms();

    console.log("SETUP COMPLETE");
    console.log("Amount of organisms created = " + organisms.length);

    runGeneration();
}

function runGeneration() {

    // Create goal
    var goal = new Goal(goal_x_pos, goal_y_pos, 20, ctx); 

    requestAnimationFrame(function animateFrame () {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // goal redrawn on each repaint
        goal.drawGoal();

        // update next coordinate and move
        for (var i = 0; i < TOTAL_ORGANISMS; i++) {
            organisms[i].update();
            organisms[i].move();
        }
        
        // executes when all genes accounted for
        // this could be a function 'finishGeneration()'
        if (organisms[0].index == GENE_COUNT) {
            console.log("Generation Complete");

            getShortestDistanceToGoal();
            calcPopulationFitness(); 

            // show fitness
            for (var i = 0; i < TOTAL_ORGANISMS; i++) {
                console.log(`FITNESS FOR ORGANISM ${i}: ${organisms[i].fitness}`);
            }

            console.log("Beginning Selection Phase");
            // fills a weighted array with organisms based on their fitness score
            var potential_parents = beginSelectionProcess();

            console.log("----------");
            console.log(potential_parents);
            console.log("----------");

            var parents = selectParentsForReproduction(potential_parents);

            console.log("Parents chosen to reproduce:")
            for (parent_pair of parents) {
                console.log(parent_pair);
            }

            console.log("Program complete.")
            return;
        }

        setTimeout(function() {
            requestAnimationFrame(animateFrame);
        }, 1000 / FPS);
    })
}

function createOrganisms () {
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        var organism = new Organism(initial_x, initial_y, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }
}

function getRandomGene(min, max) {
    var random_x = Math.floor(Math.random() * (max - min + 1) + min);
    var random_y = Math.floor(Math.random() * (max - min + 1) + min);
    var random_gene = [random_x, random_y];
    return random_gene;
}

function getShortestDistanceToGoal() {

    var shortest_distance = 10000;
    var closest_organism;

    // though this loop identifies closest organism, it ALSO updates organism's distance_to_goal attribute
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        var distance_to_goal = organisms[i].calcDistanceToGoal();
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
    console.log(`ORGANISM ${closest_organism} is closest!`);
}

function calcPopulationFitness () {
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        organisms[i].calcFitness();
    }
}

function beginSelectionProcess() {
    // fill array with candidates for reproduction
    // multiply each Organism's fitness by 100, and add each organism to the array as many times
    var potential_parents = [];

    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        // Give organisms with negative fitness a chance to reproduce
        if (organisms[i].fitness < 0) {
            organisms[i].fitness = 0.01;
            console.log(`Fitness changed from negative to .01 for organism ${i}`);
        }
        // fill parents array
        for (var j = 0; j < Math.ceil(organisms[i].fitness * 100); j++) {
            potential_parents.push(organisms[i]);
        }
        console.log(`Organism ${i} was added to array ${Math.ceil(organisms[i].fitness * 100)} times.`);
    }

    return potential_parents;
}

function selectParentsForReproduction(potential_parents) {
    // parents will be an array containing a mother and father pair for each new organism
    // (length = 10, each index is a length=2 array of organisms)

    // example
    // var parents = [
    //     [mother0, father0],
    //     [mather1, father1],
    //     [mother2, father2],
    //     ... 
    //     [mother9, father9]
    // ]

    var parents = [];

    // To create a new generation of Organisms, we'll need parents
    // Create 2 parents for each new Organism
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        mother_index = Math.floor(Math.random() * potential_parents.length);
        father_index = Math.floor(Math.random() * potential_parents.length);

        // select mother and father from parent pool
        var mother = potential_parents[mother_index];
        var father = potential_parents[father_index];

        new_parents = [mother, father];

        parents.push(new_parents);
    }
    return parents;
}