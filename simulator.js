document.addEventListener("DOMContentLoaded", setup);

var generation_count = 0;

// organism globals
const TOTAL_ORGANISMS = 30;
const GENE_COUNT = 100;
const MUTATION_RATE = 0.02;
const MIN_GENE = -7;
const MAX_GENE = 7;
// starting coordinates
const INITIAL_X = 500; 
const INITIAL_Y = 500;

// target goal coordinates
const GOAL_X_POS = 500;
const GOAL_Y_POS = 50;

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
    constructor (gender, x, y, ctx) {
        this.gender = gender;
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
        var average_fitness = average_fitness.toFixed(2);
        var population_size = organisms.length;
        this.ctx.font = "26px arial";
        this.ctx.fillText('Generation:', 10, 520);
        this.ctx.fillText(generation_count.toString(), 210, 520);
        this.ctx.fillText('Population Size:', 10, 550);
        this.ctx.fillText(population_size.toString(), 210, 550);
        this.ctx.fillText('Average Fitness:', 10, 580);
        this.ctx.fillText(average_fitness.toString(), 210, 580);
    }
}

async function setup () {

    // Create organisms with random genes
    /// PHASE: CREATE NEW GENERATION/POPULATION
    createOrganisms();
    console.log("Amount of organisms created = " + organisms.length);

    // runSimulation();
    const result = await runSimulationRefactored();
    console.log(result);
}

// change name later
// this will be called right after setup is complete
// maybe this should call runGeneration() exteriorly (yes yes yes)
async function runSimulationRefactored() {
    // pre-animation requirements
    var generation_finished = false;

    // var average_fitness = 0; --try placing this in resetGenStats() 

    // PHASE: EVALUATE INDIVIDUALS
    await runGeneration(); 

    const population_resolution = await evaluatePopulation();
    var closest_organism = population_resolution['closest_organism'];
    var average_fitness = population_resolution['average_fitness'];

    // PHASE: SELECT MOST-FIT INDIVIDUALS
    // this phase includes: beginSelectionProcess(), selectParentsForReproduction()
    const potential_parents = await beginSelectionProcess();

    var potential_mothers = potential_parents['potential_mothers'];
    var potential_fathers = potential_parents['potential_fathers'];

    var parents = selectParentsForReproduction(potential_mothers, potential_fathers);

    // PHASE: CROSSOVER / REPRODUCE / MUTATE
    // mutation handled in crossover()
    // this could be a higher level function?
    for (var i = 0; i < parents.length; i++) {
        var offspring_count = determineOffspringCount();

        for (var j = 0; j < offspring_count; j++) {
            var crossover_genes = crossover(parents[i]);
            reproduce(crossover_genes);
        }
    }

    // updateGenerationStatistics();
    // organisms = offspring_organisms;
    // offspring_organisms = [];

    // place side animations where theyll be executed
    // highlightClosestOrganism();
    // highlightChosenParents();

    // where will phase animation changes trigger?
    // 0. updateCanvasStats() // should be called at beginning of generation
    // 1. drawPhases() // should be called at beginning of generation
    // 2. highlightCreateNewGenerationText() // fade-in before gen starts, fade-out before main animation
    // 3. highlightEvaluateIndividualsText() // fade-in before main-animation starts, fade-out when main animation ends
    // 4. highlightSelectMostFitIndividualsText() // fade-in before highlightClosestOrganism() starts, fade-out when highlightChosenParents() ends
    // 5. highlightCrossoverText() // fade-in when highlightChosenParents() ends, <some canvas message/stats>, fade-out after a few seconds
    // 6. highlightMutateText() // fade-in after highlightCrossoverText() ends, <canvas message/stats> fade-out after a few seconds

    // I could even have a dynamic function that can highlight any text based on a parameter (same for fades)

    // maybe instead of this, I call individual functions like runSelectionAnimation(), runCrossoverAnimation(), etc.

    // called after evaluateIndividuals() main animation

        //SELECTION
        // fade-to-original PhasesText (could be done in previous animation)
        // fade-in/highlight 'Select Most-Fit Individuals'
        // highlightClosestOrganism()
        // highlightChosenParents()
        // fade-to-original PhasesText
        //END SELECTION
        // fade-in/highlight Crossover Text
        // fade-in canvas message/animation about crossover
        // fade-to-original PhasesText 
        // fade-out canvas message
        // fade-in/highlight Mutate Text
        // fade-in message/animation about mutation
        // fade-out canvas message
        // fade-to-original PhasesText

        // At this point, the function should resolve and the main animation will start over by updating canvas stats and 
        // highlighting Create New Generation Text, maybe with a canvas message

        // this function could split functionality, and await resolutions from runSelectMostFitAnimations(), runCrossoverAnimations(),
        // runMutationAnimations(), etc. (good idea)

    await runSelectionAnimations(closest_organism, parents);


    return new Promise(resolve => {
        resolve("runSimulationRefactored() complete.");
    })
}

async function runGeneration() {
    // do stuff
    var goal = new Goal(GOAL_X_POS, GOAL_Y_POS, 20, ctx);

    var generation_finished = false;
    const update_and_move_result = await updateAndMoveOrganisms(goal); // ideally don't pass in goal here
    return new Promise((resolve, reject) => {
        if (update_and_move_result == 0) {
            resolve(0);
        }
        else {
            reject(1);
        }
    })
}

async function evaluatePopulation() {
    // to do
    const shortest_distance_resolution = await getShortestDistanceToGoal();
    const average_fitness = await calcPopulationFitness(); // returns average_fitness

    var population_resolution = {
        'closest_organism': shortest_distance_resolution,
        'average_fitness': average_fitness
    }

    return new Promise(resolve => {
        resolve(population_resolution);
    })
}

function runSimulation() {

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
        for (var i = 0; i < organisms.length; i++) {
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

            closest_organism = getShortestDistanceToGoal(); // need this here so that beginSelectionProcess() can use Organisms' fitness score
            average_fitness = calcPopulationFitness(); 

            // fills a weighted array with organisms based on their fitness score
            var potential_parents = beginSelectionProcess();
            
            var potential_mothers = potential_parents[0];
            var potential_fathers = potential_parents[1];
            console.log(potential_mothers);
            console.log(potential_fathers);

            // var parents = selectParentsForReproduction(potential_parents);
            var parents = selectParentsForReproduction(potential_mothers, potential_fathers);
            console.log("------------");
            console.log(parents);

            // crossover and reproduce for each parent couple
            // mutation handled in crossover()
            all_indicies = [];
            all_offspring_counts = [];

            for (var i = 0; i < parents.length; i++) {
                // 2 offspring on average
                possible_offspring_counts = [0, 0, 1, 1, 2, 2, 2, 3, 4, 5]; // sum = 20, 20/10items = 2avg
                var offspring_count_index = Math.floor(Math.random() * possible_offspring_counts.length);
                all_indicies.push(offspring_count_index);
                var offspring_count = possible_offspring_counts[offspring_count_index];
                all_offspring_counts.push(offspring_count);

                for (var j = 0; j < offspring_count; j++) {
                    crossover_genes = crossover(parents[i]);
                    reproduce(crossover_genes);
                }
            }
            console.log(all_indicies);
            console.log(all_offspring_counts);
            console.log("^^^^^^^^^^^^^^");

            // this code was moved after highlightChosenParents to access fadeToBlack properly (keep here for now just in case)
            // organisms = offspring_organisms;
            // offspring_organisms = [];

            console.log("!!!!!!!!!!!!!!!!!!!!");
            console.log(organisms.length);
            console.log("!!!!!!!!!!!!!!!!!!!!");

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

                    console.log("SLEEPING FOR 2 SECONDS, THEN CALLING highlightChosenParents()");
                    const result = await sleepTest(2000);


                    // all side animations start here (show phase)
                    // basic flow:
                    // - draw on screen: goal, bottom-left stats, current phase (CREATE NEW GENERATION)
                    // - animate organisms
                    // --end of movement--
                    // highlight/aniamte most-fit, females, males, not chosen with text (EVALUATE INDIVIDUALS)
                    // (SELECT MOST-FIT ORGANISMS)
                    // --highlighting ends--
                    // (CROSSOVER / MUTATE)
                    // (REPRODUCE)
                    // --end of generation--

                    // I'll start by simply drawing the phases on the top left of canvas at the beginning of each generation
                    // to-do

                    // this is not where this should be, but this async function allows me to run animation asynchronously
                    const phase_message = await drawPhases();

                    const highlight_closest_result = await highlightClosestOrganism(closest_organism);
                    const highlight_parents_result = await highlightChosenParents(parents);

                    // checking if this is okay here
                    organisms = offspring_organisms;
                    offspring_organisms = [];


                    console.log("ALL COMPLETE, sleeping for 3 seconds to show results");
                    const time_blah = await sleepTest(3000);
                    console.log("STARTING MAIN ANIMATION AGAIN");

                    // restart main animation
                    pause = false;
                    my_req = requestAnimationFrame(animateFrame);
                }
                runSideAnimations();
            }
        }, 1000 / FPS);
    })
}

function createOrganisms () {
    var gender;
    var male_count = 0;
    var female_count = 0;
    // create equal number of males and females
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        if (i % 2) {
            gender = 'male';
            male_count++;
        }
        else {
            gender = 'female';
            female_count++;
        }
        var organism = new Organism(gender, INITIAL_X, INITIAL_Y, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }
    console.log(`FEMALES CREATED: ${female_count}, MALES CREATED: ${male_count}`);
}

function getRandomGene(min, max) {
    var random_x = Math.floor(Math.random() * (MAX_GENE - MIN_GENE + 1) + MIN_GENE);
    var random_y = Math.floor(Math.random() * (MAX_GENE - MIN_GENE + 1) + MIN_GENE);
    var random_gene = [random_x, random_y];
    return random_gene;
}

function updateAndMoveOrganisms(goal) {
    return new Promise(resolve => {
        var finished = false;
        async function animate() {
            if (!finished) {
                // animate
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                goal.drawGoal();
                // will need to redraw statistics here too if kept
                for (var i = 0; i < organisms.length; i++) {
                    if (organisms[i].reached_goal == false) {
                        organisms[i].update();
                        organisms[i].move();
                        hasReachedGoal(organisms[i], goal); // maybe await
                    }
                    else {
                        updateSuccessfulOrganism(organisms[i]); // maybe await
                    }
                }
                if (organisms[0].index == GENE_COUNT) {
                    finished = true;
                }
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve(0);
            }
            setTimeout(function() {
                req = requestAnimationFrame(animate);
            }, 1000 / FPS);
        }
        req = requestAnimationFrame(animate);
    })
}

function getShortestDistanceToGoal() {

    var shortest_distance = 10000;
    var closest_organism_index;

    // though this loop identifies closest organism, it ALSO updates organism's distance_to_goal attribute
    for (var i = 0; i < organisms.length; i++) {
        var distance_to_goal = organisms[i].calcDistanceToGoal();
        if (distance_to_goal < shortest_distance) {
            shortest_distance = distance_to_goal;
            closest_organism_index = i;
        }
    }

    var closest_organism = organisms[closest_organism_index];

    // highlightClosestOrganism(closest_organism);
    return closest_organism;
}

function calcPopulationFitness () {
    return new Promise(resolve => {
        for (var i = 0; i < organisms.length; i++) {
            organisms[i].calcFitness();
            total_fitness += organisms[i].fitness;
        }

        var average_fitness = total_fitness / organisms.length;
        resolve(average_fitness);
    })
}

function beginSelectionProcess() {
    // fill array with candidates for reproduction
    // multiply each Organism's fitness by 100, and add each organism to the array as many times
    var potential_mothers = [];
    var potential_fathers = [];

    for (var i = 0; i < organisms.length; i++) {
        // Give organisms with negative fitness a chance to reproduce
        if (organisms[i].fitness < 0) {
            organisms[i].fitness = 0.01;
        }
        // fill parents array
        for (var j = 0; j < Math.ceil(organisms[i].fitness * 100); j++) {
            // potential_parents.push(organisms[i]);
            if (organisms[i].gender === 'female') {
                potential_mothers.push(organisms[i]);
            }
            else if (organisms[i].gender === 'male') {
                potential_fathers.push(organisms[i]);
            }
        }
    }

    var potential_parents = {
        'potential_mothers': potential_mothers,
        'potential_fathers': potential_fathers
    }

    return new Promise(resolve => {
        resolve(potential_parents);
    })
}

function selectParentsForReproduction(potential_mothers, potential_fathers) {

    // example
    // var parents = [
    //     [mother0, father0],
    //     [mother1, father1],
    //     ... 
    //     [mother9, father9]
    // ]

    var parents = [];
    // goal: pair together males and females 
    // create parents == TOTAL_ORGANISMS / 2 (each couple reproduces roughly 2 offspring)
    // change to TOTAL_ORGANISMS / 4 if makes sense
    for (var i = 0; i < (organisms.length / 2); i++) {
        mother_index = Math.floor(Math.random() * potential_mothers.length);
        father_index = Math.floor(Math.random() * potential_fathers.length);

        var mother = potential_mothers[mother_index];
        var father = potential_fathers[father_index];

        new_parents = [mother, father];

        parents.push(new_parents);
    }
    return parents;
}

function determineOffspringCount() {
    possible_offspring_counts = [0, 0, 1, 1, 2, 2, 2, 3, 4, 5]; // sum = 20, 20/10items = 2avg
    var offspring_count_index = Math.floor(Math.random() * possible_offspring_counts.length);
    // all_indicies.push(offspring_count_index);
    var offspring_count = possible_offspring_counts[offspring_count_index];
    // all_offspring_counts.push(offspring_count);
    return offspring_count;
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
    offspring_gender = getGender();
    offspring = new Organism(offspring_gender, INITIAL_X, INITIAL_Y, ctx);
    offspring.genes = crossover_genes;
    // push offspring to new population
    offspring_organisms.push(offspring);
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

async function highlightClosestOrganism (closest_organism) {
    await fadeInClosestOrganism(closest_organism);
    await fadeClosestToOriginal(closest_organism);
    await fadeInClosestOrganism(closest_organism);
    await fadeClosestToOriginal(closest_organism);
    await fadeInClosestOrganism(closest_organism);
    await sleepTest(1000);
    await fadeToBlackTextClosestOrganism();
    await fadeClosestToOriginal(closest_organism);
}

function fadeInClosestOrganism(closest_organism) {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                //animate
                ctx.font = "18px arial";
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Most-Fit Individual", 750, 500);

                closest_organism.ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                closest_organism.ctx.beginPath();
                closest_organism.ctx.arc(closest_organism.x, closest_organism.y, closest_organism.radius, 0, Math.PI*2, false);
                closest_organism.ctx.fill();

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.10;
                }
                setTimeout(function() {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FADE IN CLOSEST ORGANISM COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeClosestToOriginal(closest_organism) {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                //animate
                // need to redraw black dot to make opacity decrease work
                closest_organism.ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                closest_organism.ctx.beginPath();
                closest_organism.ctx.arc(closest_organism.x, closest_organism.y, closest_organism.radius, 0, Math.PI*2, false);
                closest_organism.ctx.fill();

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.10;
                }
                setTimeout(function() {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                //resolve
                cancelAnimationFrame(req);
                resolve("FADE CLOSEST TO ORIGINAL COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

async function highlightChosenParents(parents) {

    // highlight mothers
    await fadeInMothers(parents);
    await fadeToOriginal(parents, 'female');
    await fadeInMothers(parents);
    await fadeToOriginal(parents, 'female');
    await fadeInMothers(parents);
    await fadeToOriginal(parents, 'female');

    // highlight fathers
    await fadeInFathers(parents);
    await fadeToOriginal(parents, 'male');
    await fadeInFathers(parents);
    await fadeToOriginal(parents, 'male');
    await fadeInFathers(parents);
    await fadeToOriginal(parents, 'male');

    console.log("waiting 1s...");
    await sleepTest(1000);

    // highlight all
    await fadeInMothers(parents);
    await fadeInFathers(parents);
    await fadeInNotChosen();

    console.log("waiting 1s...");
    await sleepTest(1000); 

    // fade out all
    await fadeToBlackText();
    await fadeToOriginal(parents, 'both');
    await fadeToBlack(organisms);
    await sleepTest(1000);
}

function fadeInMothers(parents) {
    return new Promise(resolve => {
        console.log("FADE IN MOTHERS CALLED");
        var opacity = 0.00;
        var finished = false;

        function animate() {
            if (!finished) {
                // do stuff
                ctx.font = "18px arial";
                ctx.fillStyle = `rgba(219, 10, 91, ${opacity})`;
                ctx.fillText("Females chosen to reproduce", 750, 520);

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
                    opacity += 0.10;
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

function fadeInFathers(parents) {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;
        function animate() {
            if (!finished) {
                // animate frame
                ctx.font = "18px arial";
                ctx.fillStyle = `rgba(0, 191, 255, ${opacity})`;
                ctx.fillText("Males chosen to reproduce", 750, 545);
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
                    opacity += 0.10;
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

function fadeInNotChosen() {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;
        function animate() {
            if (!finished) {
                // animate
                ctx.font = "18px arial";
                ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                ctx.fillText("Not chosen to reproduce", 750, 570);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.04;
                }
                setTimeout(function () {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("NOT CHOSEN TEXT ANIMATION COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeToOriginal(parents, gender) {
    // use opacity to redraw original color over highlighted color for mothers and fathers
    var opacity = 0.00;
    var finished = false;

    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                // animate
                if (gender === 'female') {
                    for (var i = 0; i < parents.length; i++) {
                        parents[i][0].ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                        parents[i][0].ctx.beginPath();
                        parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
                        parents[i][0].ctx.fill();
                    }
                }
                else if (gender === 'male') {
                    for (var i = 0; i < parents.length; i++) {
                        parents[i][1].ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                        parents[i][1].ctx.beginPath();
                        parents[i][1].ctx.arc(parents[i][1].x, parents[i][1].y, parents[i][1].radius, 0, Math.PI*2, false);
                        parents[i][1].ctx.fill();
                    }
                }
                else if (gender === 'both') {
                    for (var i = 0; i < parents.length; i++) {
                        parents[i][0].ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                        parents[i][0].ctx.beginPath();
                        parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
                        parents[i][0].ctx.fill();

                        parents[i][1].ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                        parents[i][1].ctx.beginPath();
                        parents[i][1].ctx.arc(parents[i][1].x, parents[i][1].y, parents[i][1].radius, 0, Math.PI*2, false);
                        parents[i][1].ctx.fill();
                    }
                }
                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.10;
                }
                setTimeout(function() {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(animate);
                resolve("FADE TO ORIGINAL COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeToBlack(organisms) {
    var finished = false;
    var opacity = 1.00;
    console.log("*&^*&^*&^*");
    console.log(organisms);
    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                // animate
                for (var i = 0; i < organisms.length; i++) {
                    // 'clear' organism from canvas
                    organisms[i].ctx.fillStyle = 'black';
                    organisms[i].ctx.beginPath();
                    organisms[i].ctx.arc(organisms[i].x, organisms[i].y, organisms[i].radius, 0, Math.PI*2, false);
                    organisms[i].ctx.fill();

                    organisms[i].ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                    organisms[i].ctx.beginPath();
                    organisms[i].ctx.arc(organisms[i].x, organisms[i].y, organisms[i].radius, 0, Math.PI*2, false);
                    organisms[i].ctx.fill();
                    console.log("this should print roughly 30 times");
                }

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.10;
                }

                setTimeout(function() {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FADE TO BLACK COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeToBlackText() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                // animate
                // 'clear' text
                // clearRect() method will work great when there's no organisms in the way of the cleared area
                ctx.clearRect(750, 400, 250, 250);

                ctx.font = "18px arial";
                ctx.fillStyle = `rgba(219, 10, 91, ${opacity})`;
                ctx.fillText("Females chosen to reproduce", 750, 520);

                ctx.fillStyle = `rgba(0, 191, 255, ${opacity})`;
                ctx.fillText("Males chosen to reproduce", 750, 545);

                ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                ctx.fillText("Not chosen to reproduce", 750, 570);

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.05;
                }
                setTimeout(function() {
                    req =  requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FADE TO BLACK TEXT COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function fadeToBlackTextClosestOrganism() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                // animate
                // 'clear' text
                // clearRect() method will work great when there's no organisms in the way of the cleared area
                ctx.clearRect(750, 400, 250, 250);

                ctx.font = "18px arial";
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Most-Fit Individual", 750, 500);

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.05;
                }
                setTimeout(function() {
                    req =  requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("FADE TO BLACK TEXT COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

function getGender() {
    var gender_indicator = Math.random();
    var gender;
    if (gender_indicator < 0.5) {
        gender = 'female';
    }
    else {
        gender = 'male';
    }
    return gender
}

// phase animations
function drawPhases() {
    var finished = false;
    var opacity = 0.01;

    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                //animate
                
                // will outline where I want these phases to highlight
                ctx.font = "18px arial";

                // before animation run
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Create New Generation", 10, 60);

                // while main-animation running
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Evaluate Individuals", 10, 90);

                // while highlighting animation running
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 120);

                // after highlighting over / may need own animation / help text on top right?
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Crossover / Mutate", 10, 150);

                // may need own animation / when generation stats are updated
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Reproduce", 10, 180);
                
                // draw at low-opacity
                if (opacity >= 0.10) {
                    finished = true;
                }
                else {
                    opacity += 0.01;
                }
                setTimeout(function() {
                    req = requestAnimationFrame(animate);
                }, 1000 / FPS);
            }
            else {
                // resolve
                cancelAnimationFrame(req);
                resolve("DRAW PHASES COMPLETE");
            }
        }
        req = requestAnimationFrame(animate);
    })
}

async function runSelectionAnimations(closest_organism, parents) {
    // 1. fade-to-original PhasesText (could be done in previous animation)
    // 2. fade-in/highlight 'Select Most-Fit Individuals'
    // 3. highlightClosestOrganism()
    // 4. highlightChosenParents()
    // 5. fade-to-original PhasesText

    // 1. (not ready)
    // 2. (not ready)
    // 3.
    await highlightClosestOrganism(closest_organism);
    // 4.
    await highlightChosenParents(parents);
    // 5. (not ready)

    return new Promise(resolve => {
        resolve();
    })
}