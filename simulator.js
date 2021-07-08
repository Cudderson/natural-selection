document.addEventListener("DOMContentLoaded", setup);

var generation_count = 0;

// organism globals
const TOTAL_ORGANISMS = 30;
const GENE_COUNT = 100;
const MUTATION_RATE = 0.02;
const MIN_GENE = -7;
const MAX_GENE = 7;
// starting coordinates
const INITIAL_X = 300; 
const INITIAL_Y = 500;

// target goal coordinates
const GOAL_X_POS = 300;
const GOAL_Y_POS = 300;

// frame rate
const FPS = 30;

// containers holding organisms and next-generation organisms
var organisms = [];
var offspring_organisms = [];

// generation statistics
var total_fitness = 0;

var canvas = document.getElementById("main-canvas");
var ctx = canvas.getContext("2d");

var pause = false;

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
        this.reached_goal = false;
    }

    setRandomGenes () {
        for (var i = 0; i < GENE_COUNT; i++) {
            var random_gene = getRandomGene(MIN_GENE, MAX_GENE);
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
        var horizontal_distance_squared = (Math.abs(this.x - GOAL_X_POS)) ** 2;
        var vertical_distance_squared = (Math.abs(this.y - GOAL_Y_POS)) ** 2;

        var distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        var distance_to_goal = Math.sqrt(distance_to_goal_squared);

        this.distance_to_goal = distance_to_goal;

        return distance_to_goal;
    }

    calcFitness () {
        // height = distance between starting location(y) and goal.y
        var height = INITIAL_Y - GOAL_Y_POS;

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

    showStatistics (average_fitness) {
        average_fitness = `Average Fitness: ${average_fitness.toFixed(2)}`;
        this.ctx.font = "26px arial";
        this.ctx.fillText(average_fitness.toString(), 10, 570);
        this.ctx.fillText(`Generation: ${generation_count}`, 10, 545);
    }
}

function setup () {

    // Create organisms with random genes
    createOrganisms();
    console.log("Amount of organisms created = " + organisms.length);

    runGeneration();
}

function runGeneration() {

    // Create goal
    var goal = new Goal(GOAL_X_POS, GOAL_Y_POS, 20, ctx); 
    // initial average_fitness for Gen1 ||| not sure if this resets when i want it to..
    var average_fitness = 0;

    requestAnimationFrame(function animateFrame () {

        // base case to stop program
        if (generation_count == 50) {
            console.log("SIMULATION COMPLETE");
            return;
        }

        // clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // goal redrawn on each repaint
        goal.drawGoal();
        goal.showStatistics(average_fitness);

        // update next coordinate and move
        for (var i = 0; i < TOTAL_ORGANISMS; i++) {
            if (organisms[i].reached_goal == false) {
                organisms[i].update();
                organisms[i].move();
                hasReachedGoal(organisms[i], goal);
            }
            else {
                updateSuccessfulOrganism(organisms[i]);
            }
        }
        
        // executes when all genes accounted for
        // this could be a function 'finishGeneration()'
        if (organisms[0].index == GENE_COUNT) {

            pause = true; 

            getShortestDistanceToGoal();
            average_fitness = calcPopulationFitness(); 

            // fills a weighted array with organisms based on their fitness score
            var potential_parents = beginSelectionProcess();

            var parents = selectParentsForReproduction(potential_parents);

            // crossover and reproduce for each parent couple
            // mutation handled in crossover()
            for (var i = 0; i < TOTAL_ORGANISMS; i++) {
                crossover_genes = crossover(parents[i]);
                reproduce(crossover_genes);
            }

            // offspring_organisms now represents our new population/generation
            organisms = offspring_organisms;
            offspring_organisms = [];

            // update/reset generation statistics
            updateGenerationStatistics();

            // test call func to highlight chosen parents
            highlightChosenParents(parents);
        }

        setTimeout(function() {
            if (pause == false) {
                my_req = requestAnimationFrame(animateFrame);
            }
            else {
                cancelAnimationFrame(my_req);

                // async here rather than sleep
                // function would run its own animationLoop and await for the response here
                // once response is received, resume animation here

                //This function could be put down below
                // this function should have its own animation loop for end-of-gen statstics
                var first_function = function() {
                    return new Promise(resolve => {

                        // test animation, will eventually be real
                        var success = testAnimationLoop();

                        if (success) {
                            resolve("READY FOR NEXT GENERATION");
                        }
                        else {
                            console.log("JUPITER");
                        }
                    });
                };

                var async_function = async function() {
                    console.log('async function called');
                      
                    var tester = await first_function();
                    console.log(tester);
                    my_req = requestAnimationFrame(animateFrame);
                }
                      
                async_function();

                // end async test
                pause = false;
            }
        }, 1000 / FPS);
    })
}

function createOrganisms () {
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        var organism = new Organism(INITIAL_X, INITIAL_Y, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }
}

function getRandomGene(min, max) {
    var random_x = Math.floor(Math.random() * (MAX_GENE - MIN_GENE + 1) + MIN_GENE);
    var random_y = Math.floor(Math.random() * (MAX_GENE - MIN_GENE + 1) + MIN_GENE);
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
}

function calcPopulationFitness () {
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        organisms[i].calcFitness();
        total_fitness += organisms[i].fitness;
    }
    return total_fitness / TOTAL_ORGANISMS;
}

function beginSelectionProcess() {
    // fill array with candidates for reproduction
    // multiply each Organism's fitness by 100, and add each organism to the array as many times
    var potential_parents = [];

    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        // Give organisms with negative fitness a chance to reproduce
        if (organisms[i].fitness < 0) {
            organisms[i].fitness = 0.01;
        }
        // fill parents array
        for (var j = 0; j < Math.ceil(organisms[i].fitness * 100); j++) {
            potential_parents.push(organisms[i]);
        }
    }

    return potential_parents;
}

function selectParentsForReproduction(potential_parents) {
    // parents will be an array containing a mother and father pair for each new organism
    // (length = 10, each index is a length=2 array of organisms)

    // example
    // var parents = [
    //     [mother0, father0],
    //     [mother1, father1],
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

function crossover(parents_to_crossover) {

    var mother = parents_to_crossover[0];
    var father = parents_to_crossover[1];

    // create offspring's genes
    var mother_gene_counter = 0;
    var father_gene_counter = 0;
    var mutated_gene_counter = 0;
    var crossover_genes = [];

    for (var j = 0; j < GENE_COUNT; j++) {
        // select if mother or father gene will be used (50% probability)
        var random_bool = Math.random();

        // apply mutation for variance
        // set upper and lower bound for gene mutation using MUTATION_RATE / 2
        // this way, mother and father genes retain an equal chance of being chosen
        if (random_bool < (MUTATION_RATE / 2) || random_bool > 1 - (MUTATION_RATE / 2)) {
            mutated_gene = getRandomGene(MIN_GENE, MAX_GENE);
            crossover_genes.push(mutated_gene);
            mutated_gene_counter++;
        }
        // mother gene chosen
        else if (random_bool < 0.5) {
            mother_gene = mother.genes[j];
            crossover_genes.push(mother_gene);
            mother_gene_counter++;
        }
        // father gene chosen
        else {
            father_gene = father.genes[j];
            crossover_genes.push(father_gene);
            father_gene_counter++;
        }
    }
    return crossover_genes;
}

function reproduce(crossover_genes) {
    offspring = new Organism(INITIAL_X, INITIAL_Y, ctx);
    offspring.genes = crossover_genes;
    // push offspring to new population
    offspring_organisms.push(offspring);
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } 
    while (currentDate - date < milliseconds);
}

function highlightChosenParents (parents) {

    ctx.font = "18px arial";

    ctx.fillStyle = 'pink';
    ctx.fillText("Females chosen to reproduce", 350, 520);

    ctx.fillStyle = 'lightblue';
    ctx.fillText("Males chosen to reproduce", 350, 545);

    ctx.fillStyle = 'purple';
    ctx.fillText("Not chosen to reproduce", 350, 570);

    for (var i = 0; i < parents.length; i++) {
        // mothers
        parents[i][0].ctx.fillStyle = 'pink';
        parents[i][0].ctx.beginPath();
        parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
        parents[i][0].ctx.fill();

        // fathers
        parents[i][1].ctx.fillStyle = 'lightblue';
        parents[i][1].ctx.beginPath();
        parents[i][1].ctx.arc(parents[i][1].x, parents[i][1].y, parents[i][1].radius, 0, Math.PI*2, false);
        parents[i][1].ctx.fill();
    }
}

function hasReachedGoal(organism, goal) {
    // check if within y-range 
    if (organism.y >= goal.y && organism.y <= (goal.y + goal.size)) {
        // check if within x-range
        if (organism.x >= goal.x && organism.x <= (goal.x + goal.size)) {
            // organism reached goal
            organism.reached_goal = true;
        }
    }
}

function updateSuccessfulOrganism(organism) {
    organism.ctx.fillStyle = 'red';
    organism.ctx.beginPath();
    organism.ctx.arc(organism.x, organism.y, organism.radius, 0, Math.PI*2, false);
    organism.ctx.fill();
}

function updateGenerationStatistics () {
    generation_count++;
    average_fitness = 0;
    total_fitness = 0;
}

function testAnimationLoop() {
    // let's run a decently long animation to prove its all working
    var test_guy = new Organism(300, 300, ctx);
    test_guy.setRandomGenes();
    var done = false;

    function test () {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        test_guy.update();
        test_guy.move();
        console.log("HIT");

        if (test_guy.index == GENE_COUNT) {
            console.log("HI EARTH");
            cancelAnimationFrame(req);
            done = true;
            return;
        }
        setTimeout(function () {
            // if (test_guy.index == GENE_COUNT) {
            //     return true;
            // }
            req = requestAnimationFrame(test);
        }, 1000 / FPS);
    }
    req = requestAnimationFrame(test);
    if (done) {
        console.log("DONE");
        return done;
    }
    else {
        console.log("NOT DONE");
    }
}