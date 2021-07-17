document.addEventListener("DOMContentLoaded", runSimulation);

console.log("On branch 'colors'");

// organism globals
const TOTAL_ORGANISMS = 50;
const GENE_COUNT = 100;
const MUTATION_RATE = 0.02;
const MIN_GENE = -5;
const MAX_GENE = 5;
const INITIAL_X = 500; 
const INITIAL_Y = 500;

// starting coordinates for goal
const GOAL_X_POS = 500;
const GOAL_Y_POS = 50;

// frame rate
const FPS = 30;

// track total generations
var generation_count = 0;

// containers holding organisms and next-generation organisms
var organisms = [];
var offspring_organisms = [];

// generation statistics
var average_fitness = 0.00;
var total_fitness = 0.00;

var canvas = document.getElementById("main-canvas");
var ctx = canvas.getContext("2d");

// color theme
//rgba(148, 0, 211, 1) darkviolet
//rgba(155, 245, 0, 1) custom green
//rgba(232, 0, 118, 1) mother pink
//rgba(79, 11, 255, 1) father blue
//rgba(255, 215, 0, 1) closest organism gold

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

    showStatistics () {
        average_fitness = Number(average_fitness).toFixed(2);
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

async function runSimulation () {

    // Create organisms with random genes
    /// PHASE: CREATE NEW GENERATION/POPULATION
    createOrganisms();
    console.log("Amount of organisms created = " + organisms.length);

    // intro-animation here before sim-loop?

    do {
        const result = await runGeneration();
        console.log(result);
    } while (generation_count < 50);
}

async function runGeneration() {

    // this will clear the phase text area
    // ctx.fillStyle = 'red';
    // ctx.fillRect(10, 10, 275, 200);

    await fadeInEvaluationPhaseText();//

    // PHASE: EVALUATE INDIVIDUALS (highlightClosestOrganism() freezes animation sometimes)
    // this is where statistics are redrawn (goal.showStatistics())
    const r = await runEvaluationAnimation(); //
    console.log(r);

    const population_resolution = await evaluatePopulation(); // maybe don't await here
    var closest_organism = population_resolution['closest_organism'];
    average_fitness = population_resolution['average_fitness'];

    await fadeOutEvaluationPhaseText(); //
    // trying this to prevent text being redrawn to over-saturation
    // ctx.clearRect(10, 10, 275, 200);
    // drawPhases();

    await fadeInSelectionPhaseText(); // 

    // PHASE: SELECT MOST-FIT INDIVIDUALS
    // this phase includes: beginSelectionProcess(), selectParentsForReproduction()
    const potential_parents = await beginSelectionProcess(); // maybe don't await here

    var potential_mothers = potential_parents['potential_mothers'];
    var potential_fathers = potential_parents['potential_fathers'];

    var parents = selectParentsForReproduction(potential_mothers, potential_fathers);

    console.log("made it to here, calling runSelectionAnimations()"); // this means that fadeInSelectionPhaseText() resolves when opacity >= 1.00

    await runSelectionAnimations(closest_organism, parents); //

    await fadeOutSelectionPhaseText(); // 

    // PHASE: CROSSOVER / MUTATE / REPRODUCE
    // this function handles crossover, mutation and reproduction
    // this function pushes new gen organisms to offspring_organisms[]
    reproduceNewGeneration(parents);

    // follow same naming convention for these animations!
    await fadeInCrossoverPhaseText();
    await fadeInCrossoverDescriptionText();
    await sleepTest(2000);
    await fadeOutCrossoverDescriptionText();
    await fadeOutCrossoverPhaseText();

    await fadeInMutationPhaseText();
    await fadeInMutationDescriptionText();
    await sleepTest(2000);
    await fadeOutMutationDescriptionText();
    await fadeOutMutationPhaseText();

    await fadeInCreateNewGenPhaseText();
    await fadeInGenerationSummaryText();
    await sleepTest(2000);
    await fadeOutGenerationSummaryText();
    await fadeOutCreateNewGenPhaseText();

    return new Promise(resolve => {
        generation_count++;
        resolve(generation_count);
    })
}

async function runEvaluationAnimation() {
    // do stuff
    var goal = new Goal(GOAL_X_POS, GOAL_Y_POS, 20, ctx);

    var generation_finished = false;
    const update_and_move_result = await updateAndMoveOrganisms(goal); // ideally don't pass in goal here
    return new Promise((resolve, reject) => {
        if (update_and_move_result == 0) {
            resolve("EVALUATION ANIMATION COMPLETE");
        }
        else {
            reject("Evaluation animation failed");
        }
    })
}

async function evaluatePopulation() {
    // to do
    const shortest_distance_resolution = await getShortestDistanceToGoal();
    const average_fitness = await calcPopulationFitness();

    var population_resolution = {
        'closest_organism': shortest_distance_resolution,
        'average_fitness': average_fitness
    }

    return new Promise(resolve => {
        resolve(population_resolution);
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
        // why is this async?
        async function animateOrganisms() {
            if (!finished) {
                // animate
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                goal.drawGoal();
                goal.showStatistics();
                drawEvaluationPhaseText();

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
                sleepTest(1000 / FPS); // control drawing FPS for organisms
                frame_id = requestAnimationFrame(animateOrganisms);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve(0);
            }
        }
        start_animate_organisms = requestAnimationFrame(animateOrganisms);
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
        // reset total_fitness before calculation
        total_fitness = 0;
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

function reproduceNewGeneration(parents) {
    for (var i = 0; i < parents.length; i++) {
        var offspring_count = determineOffspringCount();

        for (var j = 0; j < offspring_count; j++) {
            var crossover_genes = crossover(parents[i]);
            reproduce(crossover_genes);
        }
    }
    // set offspring_organisms as next generation of organisms
    organisms = offspring_organisms;
    offspring_organisms = [];
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

function sleepTest(milliseconds) {
    console.log(`Sleeping for ${(milliseconds / 1000)} second(s).`);
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
    console.log('highlightClosestOrganism() called');
    await fadeInClosestOrganismText();
    const x = await fadeInClosestOrganism(closest_organism);
    console.log(x);
    await fadeClosestToOriginal(closest_organism);
    await fadeInClosestOrganism(closest_organism);
    await fadeClosestToOriginal(closest_organism);
    await fadeInClosestOrganism(closest_organism);
    await sleepTest(1000);
    await fadeToBlackTextClosestOrganism();
    await fadeClosestToOriginal(closest_organism);
    return new Promise(resolve => {
        resolve("Highlight Closest Organism Complete");
    })
}

function fadeInClosestOrganism(closest_organism) {
    console.log('fadeInClosestOrganism() called');
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInClosest() {
            if (!finished) {

                closest_organism.ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                closest_organism.ctx.beginPath();
                closest_organism.ctx.arc(closest_organism.x, closest_organism.y, closest_organism.radius, 0, Math.PI*2, false);
                closest_organism.ctx.fill();

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.04;
                    console.log(opacity);
                }
                frame_id = requestAnimationFrame(fadeInClosest);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE IN CLOSEST ORGANISM COMPLETE");
            }
        }
        start_closest_fadein = requestAnimationFrame(fadeInClosest);
    })
}

function fadeInClosestOrganismText() {
    console.log("fadeInClosestOrganismText() called");
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInClosestText() {
            console.log('animate called');
            if (!finished) {
                // prevent over-saturation
                ctx.fillStyle = 'black';
                ctx.fillRect(750, 450, 275, 20);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Most-Fit Individual", 800, 470);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(fadeInClosestText);
            }
            else {
                // resolve
                console.log('resolving');
                cancelAnimationFrame(frame_id);
                resolve("FADE IN CLOSEST ORGANISM TEXT COMPLETE");
            }
        }
        start_closest_text_fadein = requestAnimationFrame(fadeInClosestText);
    })
}

function fadeClosestToOriginal(closest_organism) {
    console.log("fadeClosestToOriginal() called");
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeToOriginalClosest() {
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
                    opacity += 0.04;
                }
                frame_id = requestAnimationFrame(fadeToOriginalClosest);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE CLOSEST TO ORIGINAL COMPLETE");
            }
        }
        start_closest_fade_to_original = requestAnimationFrame(fadeToOriginalClosest);
    })
}

async function highlightChosenParents(parents) {

    // highlight mothers
    await fadeInMothersText();
    await fadeInMothers(parents);
    await fadeToOriginal(parents, 'female');
    await fadeInMothers(parents);
    await fadeToOriginal(parents, 'female');
    await fadeInMothers(parents);
    await fadeToOriginal(parents, 'female');

    // highlight fathers
    await fadeInFathersText();
    await fadeInFathers(parents);
    await fadeToOriginal(parents, 'male');
    await fadeInFathers(parents);
    await fadeToOriginal(parents, 'male');
    await fadeInFathers(parents);
    await fadeToOriginal(parents, 'male');
    await sleepTest(1000);

    // highlight all
    await fadeInMothers(parents);
    await fadeInFathers(parents);
    await fadeInNotChosen();
    await sleepTest(1000); 

    // fade out all
    await fadeToBlackText();
    await fadeToOriginal(parents, 'both');
    await fadeToBlack(organisms);
    await sleepTest(1000);

    return new Promise(resolve => {
        resolve("Highlight Chosen Parents Animation Complete");
    })
}

function fadeInMothers(parents) {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;

        function motherFadeIn() {
            if (!finished) {

                // ctx.font = "18px arial";
                // ctx.fillStyle = `rgba(219, 10, 91, ${opacity})`;
                // ctx.fillText("Females chosen to reproduce", 750, 520);

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
                    opacity += 0.03;
                }
                frame_id = requestAnimationFrame(motherFadeIn);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE IN MOTHERS COMPLETE");
            }
        }
        start_mother_fade_in = requestAnimationFrame(motherFadeIn);
    })
}

function fadeInMothersText() {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;

        function fadeInTextMother() {
            if (!finished) {

                ctx.fillStyle = 'black';
                ctx.fillRect(750, 480, 275, 20);
                
                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(219, 10, 91, ${opacity})`;
                ctx.fillText("Females Selected", 800, 500);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(fadeInTextMother);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE IN MOTHERS TEXT COMPLETE");
            }
        }
        start_mother_text_fadein = requestAnimationFrame(fadeInTextMother);
    })
}

function fadeInFathers(parents) {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;
        function fatherFadeIn() {
            if (!finished) {
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
                    opacity += 0.03;
                }
                frame_id = requestAnimationFrame(fatherFadeIn);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FATHERS FADE-IN COMPLETE");
            }
        }
        start_father_fadein = requestAnimationFrame(fatherFadeIn);
    })
}

function fadeInFathersText() {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;
        function fadeInTextFather() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(750, 510, 275, 20);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(0, 191, 255, ${opacity})`;
                ctx.fillText("Males Selected", 800, 530);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(fadeInTextFather);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FATHERS TEXT FADE-IN COMPLETE");
            }
        }
        start_father_text_fadein = requestAnimationFrame(fadeInTextFather);
    })
}

function fadeInNotChosen() {
    return new Promise(resolve => {
        var opacity = 0.00;
        var finished = false;
        function notChosenFadeIn() {
            if (!finished) {
                // animate
                ctx.fillStyle = 'black';
                ctx.fillRect(750, 540, 275, 20);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                ctx.fillText("Not Selected", 800, 560);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(notChosenFadeIn);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("NOT CHOSEN TEXT ANIMATION COMPLETE");
            }
        }
        start_not_chosen_fadein = requestAnimationFrame(notChosenFadeIn);
    })
}

function fadeToOriginal(parents, gender) {
    // use opacity to redraw original color over highlighted color for mothers and fathers
    var opacity = 0.00;
    var finished = false;

    return new Promise(resolve => {
        function fadeParentsToOriginal() {
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
                    opacity += 0.03;
                }
                frame_id = requestAnimationFrame(fadeParentsToOriginal);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE TO ORIGINAL COMPLETE");
            }
        }
        start_parents_fade_to_original = requestAnimationFrame(fadeParentsToOriginal);
    })
}

function fadeToBlack(organisms) {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function fadeToBlackOrganisms() {
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
                    console.log("this should print roughly 30 times"); // but it actually prints 300+
                }

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.05;
                }
                frame_id = requestAnimationFrame(fadeToBlackOrganisms);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE TO BLACK COMPLETE");
            }
        }
        start_organism_fade_to_black = requestAnimationFrame(fadeToBlackOrganisms);
    })
}

function fadeToBlackText() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function textFadeToBlack() {
            if (!finished) {
                // animate
                // 'clear' text
                ctx.fillStyle = 'black';
                ctx.fillRect(750, 480, 275, 100);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(219, 10, 91, ${opacity})`;
                ctx.fillText("Females Selected", 800, 500);

                ctx.fillStyle = `rgba(0, 191, 255, ${opacity})`;
                ctx.fillText("Males Selected", 800, 530);

                ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
                ctx.fillText("Not Selected", 800, 560);

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.02;
                }
                frame_id =  requestAnimationFrame(textFadeToBlack);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE TO BLACK TEXT COMPLETE");
            }
        }
        start_text_fade_to_black = requestAnimationFrame(textFadeToBlack);
    })
}

function fadeToBlackTextClosestOrganism() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function fadeBlackClosest() {
            if (!finished) {
                // animate
                // 'clear' text
                ctx.fillStyle = 'black';
                ctx.fillRect(750, 450, 275, 20);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Most-Fit Individual", 800, 470);

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.02;
                }
                frame_id =  requestAnimationFrame(fadeBlackClosest);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE TO BLACK TEXT COMPLETE");
            }
        }
        start_fade_black_closest = requestAnimationFrame(fadeBlackClosest);
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

// this function needs work
function fadeInPhases() {
    var finished = false;
    var opacity = 0.01;

    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                //animate
                
                // will outline where I want these phases to highlight
                ctx.font = "20px arial";

                // before animation run
                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Create New Generation", 10, 60);

                // while main-animation running
                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Evaluate Individuals", 10, 90);

                // while highlighting animation running
                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 120);

                // after highlighting over / may need own animation / help text on top right?
                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Crossover", 10, 150);

                // may need own animation / when generation stats are updated
                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Mutate", 10, 180);
                
                // draw at low-opacity
                if (opacity >= 0.10) {
                    finished = true;
                }
                else {
                    opacity += 0.01;
                }
                frame_id = requestAnimationFrame(animate);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve("DRAW PHASES COMPLETE");
            }
        }
        start_phase_fadein = requestAnimationFrame(animate);
    })
}

function drawPhases() {
    ctx.font = "20px arial";

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Create New Generation", 10, 30);

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Evaluate Individuals", 10, 60);

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Select Most-Fit Individuals", 10, 90);

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Crossover", 10, 120);

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Mutate", 10, 150);
}

function fadeInEvaluationPhaseText() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInEvalText() {
            if (!finished) {
                // clearRect to avoid over-saturated text
                ctx.clearRect(10, 10, 275, 200);

                ctx.font = "20px arial";

                ctx.fillStyle = 'rgba(100, 100, 100, 1)';
                ctx.fillText("Create New Generation", 10, 30);

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Evaluate Individuals", 10, 60);

                ctx.fillStyle = 'rgba(100, 100, 100, 1)';
                ctx.fillText("Select Most-Fit Individuals", 10, 90);

                ctx.fillStyle = 'rgba(100, 100, 100, 1)';
                ctx.fillText("Crossover", 10, 120);

                ctx.fillStyle = 'rgba(100, 100, 100, 1)';
                ctx.fillText("Mutate", 10, 150);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    // testing decreasing opacity difference to increase animation duration
                    opacity += 0.02;
                }
                var frame_id = requestAnimationFrame(fadeInEvalText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Highlight Evaluation Text Complete.");
            }
        }
        start_eval_fade_in = requestAnimationFrame(fadeInEvalText);
    })
}

function drawEvaluationPhaseText() {
    ctx.font = "20px arial";

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Create New Generation", 10, 30);

    ctx.fillStyle = 'rgba(255, 215, 0, 1)';
    ctx.fillText("Evaluate Individuals", 10, 60);

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Select Most-Fit Individuals", 10, 90);

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Crossover", 10, 120);

    ctx.fillStyle = 'rgba(100, 100, 100, 1)';
    ctx.fillText("Mutate", 10, 150);
}

function fadeOutEvaluationPhaseText() {
    console.log("called");
    return new Promise(resolve => {
        var finished = false;
        var opacity = 0.00;
        var old_opacity = 1.00;

        function fadeOutEvalText() {
            if (!finished) {
                // solution to over-saturation:
                // each frame, draw the same text with less gold and then more gray
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 40, 180, 20);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(255, 215, 0, ${old_opacity})`;
                ctx.fillText("Evaluate Individuals", 10, 60);

                ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
                ctx.fillText("Evaluate Individuals", 10, 60);

                if (opacity >= 0.99) {
                    finished = true;
                    ctx.fillStyle = 'black';
                    ctx.fillRect(10, 10, 275, 200);
                    drawPhases();
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
                }
                console.log("requesting another frame ok");
                // for some reason changing the var name makes animation work
                frame_id_eval_fadeout = requestAnimationFrame(fadeOutEvalText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE OUT EVALUATE INDIVIDUALS DONE");
            }
        }
        console.log("starting!");
        start_eval_text_fadeout = requestAnimationFrame(fadeOutEvalText);
    })
}

function fadeInSelectionPhaseText() {
    console.log("am calllled");
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInSelectionText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 70, 250, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 90);

                if (opacity >= 0.99) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                    console.log(opacity);
                }
                console.log('requesting another framey');
                frame_id = requestAnimationFrame(fadeInSelectionText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Highlight Evaluation Text Complete.");
            }
        }
        console.log('startingg');
        start_selection_text_fadein = requestAnimationFrame(fadeInSelectionText);
    })
}

function fadeOutSelectionPhaseText() {
    // could improve by only clearing area where Evaluate Individuals text is
    var finished = false;
    var opacity = 0.00;
    var old_opacity = 1.00
    return new Promise(resolve => {
        function selectionTextFadeOut() {
            if (!finished) {
                //animate
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 70, 240, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${old_opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 90);

                ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 90);

                if (opacity >= 1.00) {
                    finished = true;
                    ctx.fillStyle = 'black';
                    ctx.fillRect(10, 10, 275, 200);
                    drawPhases();
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(selectionTextFadeOut);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE OUT SELECTION PHASE TEXT DONE");
            }
        }
        start_selection_text_fadeout = requestAnimationFrame(selectionTextFadeOut);
    })
}

function fadeInCrossoverPhaseText() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInCrossoverText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 100, 200, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Crossover", 10, 120);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(fadeInCrossoverText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Highlight Crossover Text Complete.");
            }
        }
        start_crossover_text_fadein = requestAnimationFrame(fadeInCrossoverText);
    })
}

function fadeInCrossoverDescriptionText() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInCrossoverDescription() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(75, 275, 950, 150);

                var description = "Genes of the selected parent couples are combined to create new offspring.";

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                ctx.fillText(description, 200, 300);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.025;
                }
                frame_id = requestAnimationFrame(fadeInCrossoverDescription);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Fade In Crossover Description Complete.");
            }
        }
        start_crossover_description_fadein = requestAnimationFrame(fadeInCrossoverDescription);
    })
}

function fadeOutCrossoverDescriptionText() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function fadeOutCrossoverDescription() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(75, 275, 950, 150);

                var description = "Genes of the selected parent couples are combined to create new offspring.";

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                ctx.fillText(description, 200, 300);

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.025;
                }
                frame_id = requestAnimationFrame(fadeOutCrossoverDescription);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_crossover_description_fadeout = requestAnimationFrame(fadeOutCrossoverDescription);
    })
}

function fadeOutCrossoverPhaseText() {
    var finished = false;
    var opacity = 0.00;
    var old_opacity = 1.00;
    return new Promise(resolve => {
        function fadeOutCrossoverText() {
            if (!finished) {
                //animate
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 100, 100, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${old_opacity})`;
                ctx.fillText("Crossover", 10, 120);

                ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
                ctx.fillText("Crossover", 10, 120);

                if (opacity >= 1.00) {
                    finished = true;
                    ctx.fillStyle = 'black';
                    ctx.fillRect(10, 10, 275, 200);
                    drawPhases();
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(fadeOutCrossoverText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE OUT CROSSOVER PHASE TEXT DONE");
            }
        }
        start_crossover_text_fadeout = requestAnimationFrame(fadeOutCrossoverText);
    })
}

function fadeInMutationPhaseText() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInMutationText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 130, 200, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Mutate", 10, 150);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(fadeInMutationText);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve("Highlight Mutation Phase Text Complete.");
            }
        }
        start_mutation_text_fadein = requestAnimationFrame(fadeInMutationText);
    })
}

function fadeInMutationDescriptionText() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInMutationDescription() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(100, 275, 800, 150);

                var description = "To maintain genetic diversity, a small percentage of random genes are mutated";
                var mutation_rate_text = `Mutation Rate: ${(MUTATION_RATE * 100)}%`.toString();

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                ctx.fillText(description, 190, 300);

                ctx.font = "22px arial";
                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(mutation_rate_text, 420, 350);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.025;
                }
                frame_id = requestAnimationFrame(fadeInMutationDescription);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Fade In Mutation Description Complete.");
            }
        }
        start_mutation_description_fadein = requestAnimationFrame(fadeInMutationDescription);
    })
}

function fadeOutMutationDescriptionText() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function fadeOutMutationDescription() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(100, 275, 800, 150);

                var description = "To maintain genetic diversity, a small percentage of random genes are mutated";
                var mutation_rate_text = `Mutation Rate: ${(MUTATION_RATE * 100)}%`.toString();

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                ctx.fillText(description, 190, 300);

                ctx.font = "22px arial";
                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(mutation_rate_text, 420, 350);

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.025;
                }
                frame_id = requestAnimationFrame(fadeOutMutationDescription);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_mutation_description_fadeout = requestAnimationFrame(fadeOutMutationDescription);
    })
}

function fadeOutMutationPhaseText() {
    var finished = false;
    var opacity = 0.00;
    var old_opacity = 1.00;
    return new Promise(resolve => {
        function fadeOutMutationText() {
            if (!finished) {
                //animate
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 130, 100, 20);
                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${old_opacity})`;
                ctx.fillText("Mutate", 10, 150);

                ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
                ctx.fillText("Mutate", 10, 150);

                if (opacity >= 1.00) {
                    finished = true;
                    ctx.fillStyle = 'black';
                    ctx.fillRect(10, 10, 275, 200);
                    drawPhases();
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(fadeOutMutationText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE OUT MUTATION PHASE TEXT DONE");
            }
        }
        start_mutation_text_fadeout = requestAnimationFrame(fadeOutMutationText);
    })
}

function fadeInCreateNewGenPhaseText() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInNewGenText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 10, 250, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Create New Generation", 10, 30);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(fadeInNewGenText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Highlight New Gen Phase Text Complete.");
            }
        }
        start_new_gen_text_fadein = requestAnimationFrame(fadeInNewGenText);
    })
}

function fadeInGenerationSummaryText() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fadeInGenSummary() {
            if (!finished) {
                var generation_summary_text = `Generation ${generation_count} Summary:`;
                var generation_average_fitness_preface = 'Average Fitness:';
                var generation_offspring_reproduced_preface = 'Offspring Reproduced:';

                ctx.fillStyle = 'black';
                ctx.fillRect(100, 250, 800, 200);

                ctx.font = "22px arial";
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                ctx.fillText(generation_summary_text, 380, 280);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(generation_average_fitness_preface, 390, 330);

                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(average_fitness.toFixed(2).toString(), 600, 330);

                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(generation_offspring_reproduced_preface, 390, 355);

                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(organisms.length.toString(), 600, 355);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.025;
                }
                frame_id = requestAnimationFrame(fadeInGenSummary);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Fade In Summary Complete.");
            }
        }
        start_gen_summary_fadein = requestAnimationFrame(fadeInGenSummary);
    })
}

function fadeOutGenerationSummaryText() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function fadeOutGenSummary() {
            if (!finished) {
                var generation_summary_text = `Generation ${generation_count} Summary:`;
                var generation_average_fitness_preface = 'Average Fitness:';
                var generation_offspring_reproduced_preface = 'Offspring Reproduced:';

                ctx.fillStyle = 'black';
                ctx.fillRect(100, 250, 800, 200);

                ctx.font = "22px arial";
                ctx.fillStyle = `rgba(255, 0, 0, ${opacity})`;
                ctx.fillText(generation_summary_text, 380, 280);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(generation_average_fitness_preface, 390, 330);

                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(average_fitness.toFixed(2).toString(), 600, 330);

                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(generation_offspring_reproduced_preface, 390, 355);

                ctx.fillStyle = `rgba(50, 250, 17, ${opacity})`;
                ctx.fillText(organisms.length.toString(), 600, 355);

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    opacity -= 0.025;
                }
                frame_id = requestAnimationFrame(fadeOutGenSummary);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("Fade Out Summary Complete.");
            }
        }
        start_gen_summary_fadeout = requestAnimationFrame(fadeOutGenSummary);
    })
}

function fadeOutCreateNewGenPhaseText() {
    var finished = false;
    var opacity = 0.00;
    var old_opacity = 1.00;
    return new Promise(resolve => {
        function fadeOutNewGenText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 10, 215, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${old_opacity})`;
                ctx.fillText("Create New Generation", 10, 30);

                ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
                ctx.fillText("Create New Generation", 10, 30);

                if (opacity >= 1.00) {
                    finished = true;
                    ctx.fillStyle = 'black';
                    ctx.fillRect(10, 10, 275, 200);
                    drawPhases();
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(fadeOutNewGenText);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve("FADE OUT CREATE NEW GEN PHASE TEXT DONE");
            }
        }
        start_new_gen_text_fadeout = requestAnimationFrame(fadeOutNewGenText);
    })
}

async function runSelectionAnimations(closest_organism, parents) {
    console.log("Called runSelectionAnimations()");
    // maybe model other phases after this one
    await highlightClosestOrganism(closest_organism);
    await highlightChosenParents(parents);

    return new Promise(resolve => {
        resolve("Run Selection Animations Complete");
    })
}