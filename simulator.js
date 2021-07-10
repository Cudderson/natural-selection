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
        }

        setTimeout(function() {
            if (pause == false) {
                my_req = requestAnimationFrame(animateFrame);
            }
            else {
                cancelAnimationFrame(my_req);

                async function runSideAnimations() {
                    console.log("Side Animation Called");
                    // console.log("Calling sleep for 2 seconds");
                    // const sleep_result = await sleepTest(2000);
                    // console.log("Sleep Test Complete. Starting Side Animation.");

                    // var test_guy = new Organism(300, 300, ctx);
                    // test_guy.setRandomGenes();
                    // const test_result = await testAnimationLoop2(test_guy);

                    // console.log(test_result);
                    // console.log("Test Animation Complete.");

                    console.log("SLEEPING FOR 2 SECONDS, THEN CALLING highlightChosenParents()");
                    const result = await sleepTest(2000);

                    const highlight_result = await highlightChosenParents(parents);
                    console.log("ALL COMPLETE, sleeping for 3 seconds to show results");
                    const time_blah = await sleepTest(3000);
                    console.log("STARTING MAIN ANIMATION AGAIN");
                    pause = false;
                    my_req = requestAnimationFrame(animateFrame);
                }
                runSideAnimations();
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

// just for testing, not used anymore (make sure)
async function testAnimationLoop2 (test_guy) {

    var finished = false;

    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                test_guy.update();
                test_guy.move();

                if (test_guy.index == GENE_COUNT) {
                    console.log("All genes accounted for. Cancelling this animation");
                    finished = true;
                }

                setTimeout(function () {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
                
            }
            else {
                cancelAnimationFrame(req);
                resolve("ANIMATION COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function sleepTest(milliseconds) {
    console.log("Processing Response");
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } 
    while (currentDate - date < milliseconds);
    return new Promise((resolve, reject) => {
        resolve("Response Processed.")
    })
}

async function highlightChosenParents(parents) {
    // rgb(148,0,211) darkviolet
    // rgb(0,191,255) deep sky blue

    // goal: make animation look good by fading in/out twice for each category
    // 1. animation starts
    // 2. show females selected
    //      - fade in to opacity=1
    //      - fade out to opacity=0
    //      - fade in to opacity=1
    //      - fade out to opacity=0
    //      - fade in to opacity=1
    //      - hold frame for 1-2s, then fade-out
    // 3. repeat same for males and not chosen
    // 4. fade in all at same time, hold for 1-2s, fade out to opacity=0
    // 5. animation ends

    // use a variable to keep track of the current state of animation
    // for each category: fade: in-out-in-out-in(hold)-out-end
    // each time opacity>=1, we could update a variable that let's us know where we are in the animation
    // will need different opacity vars, as we want to be able to only adjust certain organisms at a time (mother_opacity, father_opacity, etc)

    var finished = false;

    var mother_cycle_finished = false;

    var mother_opacity = 0.00;
    var father_opacity = 0.00;
    var not_chosen_opacity = 0.00; // don't have a way to track these organisms yet

    ctx.font = "18px arial";

    // ctx.fillStyle = 'rgba(219, 10, 91, ' + opacity + ')';
    ctx.fillStyle = 'rgba(219, 10, 91, 1)';
    ctx.fillText("Females chosen to reproduce", 350, 520);

    ctx.fillStyle = 'rgba(0, 191, 255, 1)';
    ctx.fillText("Males chosen to reproduce", 350, 545);

    ctx.fillStyle = 'purple';
    ctx.fillText("Not chosen to reproduce", 350, 570);

    // complete steps from above
    // 1. animation starts
    // 2. fade in/out mothers
    //    - fade in to opacity=1
    //    - fade out to opacity=0
    //    - fade in to opacity=1
    //    - fade out to opacity=0
    //    - fade in and hold

    // should probably make these animations return a promise, just to ensure everything works in order
    // use await here

    // finish mothers fade in/out animations
    console.log("STARTING MOTHER ANIMATION IN 2 SECONDS");
    await sleepTest(2000);
    await fadeInMothers(parents);
    await fadeOutMothers(parents);
    await fadeInMothers(parents);
    await fadeOutMothers(parents);
    await fadeInMothers(parents);
    // should return to purple here
    console.log("STARTING FATHER ANIMATION IN 2 SECONDS");
    await sleepTest(2000);
    // make father animations return promise
    await fadeInFathers(parents);
    await fadeOutFathers(parents);
    await fadeInFathers(parents);
    await fadeOutFathers(parents);
    await fadeInFathers(parents);
    console.log("waiting 10s...");
    await sleepTest(10000); 
}

function fadeInMothers(parents) {
    return new Promise(resolve => {
        console.log("FADE IN MOTHERS CALLED");
        var opacity = 0.00;
        var finished = false;
        function animate() {
            if (!finished) {
                // do stuff
                for (var i = 0; i < parents.length; i++) {
                    parents[i][0].ctx.fillStyle = `rgba(219, 10, 91, ${opacity})`;
                    parents[i][0].ctx.beginPath();
                    parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
                    parents[i][0].ctx.fill();
                }
                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.05;
                }
                setTimeout(function() {
                    req = requestAnimationFrame(animate);
                }, 1000 /FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FADE IN MOTHERS COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeOutMothers(parents) {
    return new Promise(resolve => {
        console.log("FADE OUT MOTHERS CALLED");
        var opacity = 1.00;
        var finished = false;
        function animate () {
            if (!finished) {
                for (var i = 0; i < parents.length; i++) {
                    // 'clear' organism
                    parents[i][0].ctx.fillStyle = 'black';
                    parents[i][0].ctx.beginPath();
                    parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
                    parents[i][0].ctx.fill();

                    // redraw with less-opacity
                    parents[i][0].ctx.fillStyle = `rgba(219, 10, 91, ${opacity})`;
                    parents[i][0].ctx.beginPath();
                    parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
                    parents[i][0].ctx.fill();
                }
                if (opacity <= 0.01) {
                    console.log("truuuu");
                    finished = true;
                }
                else {
                    console.log("not truuuu");
                    opacity -= 0.10;
                }
                setTimeout(function () {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FADE OUT MOTHERS COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeInFathers(parents) {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;
        function animate() {
            if (!finished) {
                // animate frame
                for (var i = 0; i < parents.length; i++) {
                    parents[i][1].ctx.fillStyle = `rgba(0, 191, 255, ${opacity})`;
                    parents[i][1].ctx.beginPath();
                    parents[i][1].ctx.arc(parents[i][1].x, parents[i][1].y, parents[i][1].radius, 0, Math.PI*2, false);
                    parents[i][1].ctx.fill();
                }
                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.05;
                }
                setTimeout(function () {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FATHERS FADE-IN COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeOutFathers(parents) {
    return new Promise(resolve => {
        var opacity = 1.00;
        var finished = false;
        function animate() {
            if (!finished) {
                // animate frame
                for (var i = 0; i < parents.length; i++) {
                    // redraw black so opacity changes will show
                    parents[i][1].ctx.fillStyle = 'black';
                    parents[i][1].ctx.beginPath();
                    parents[i][1].ctx.arc(parents[i][1].x, parents[i][1].y, parents[i][1].radius, 0, Math.PI*2, false);
                    parents[i][1].ctx.fill();

                    // redraw organism
                    parents[i][1].ctx.fillStyle = `rgba(0, 191, 255, ${opacity})`;
                    parents[i][1].ctx.beginPath();
                    parents[i][1].ctx.arc(parents[i][1].x, parents[i][1].y, parents[i][1].radius, 0, Math.PI*2, false);
                    parents[i][1].ctx.fill();
                }
                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.10;
                }
                setTimeout(function() {
                    req = requestAnimationFrame(animate);
                })
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FATHER FADE OUT COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}