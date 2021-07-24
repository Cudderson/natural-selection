document.addEventListener("DOMContentLoaded", readyForSim);

// organism global defaults
var TOTAL_ORGANISMS = 100;
var GENE_COUNT = 250;
var MUTATION_RATE = 0.03;
var MIN_GENE = -5;
var MAX_GENE = 5;
// optional dialogue
var dialogue = false;

// starting coordinates for organisms and goal
const INITIAL_X = 500; 
const INITIAL_Y = 500;
const GOAL_X_POS = 500;
const GOAL_Y_POS = 200;

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

// flag for post-success animations
var simulation_succeeded = false;

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

    setRandomGenes() {
        for (var i = 0; i < GENE_COUNT; i++) {
            var random_gene = getRandomGene(MIN_GENE, MAX_GENE);
            this.genes.push(random_gene);
        }
    }

    showGenes() {
        for (var i = 0; i < GENE_COUNT; i++) {
            console.log(this.genes[i]);
        }
    }

    update() {
        if (this.index < GENE_COUNT) {
            this.x += this.genes[this.index][0];
            this.y += this.genes[this.index][1];
            this.index++;
        }
    }

    move() {
        this.ctx.fillStyle = 'rgba(148, 0, 211, 1)'; // darkviolet
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.ctx.fill();
    }

    calcDistanceToGoal() {
        // c**2 = a**2 + b**2
        var horizontal_distance_squared = (Math.abs(this.x - GOAL_X_POS)) ** 2;
        var vertical_distance_squared = (Math.abs(this.y - GOAL_Y_POS)) ** 2;

        var distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        var distance_to_goal = Math.sqrt(distance_to_goal_squared);

        this.distance_to_goal = distance_to_goal;

        return distance_to_goal;
    }

    calcFitness() {
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

    // could convert final 2 class methods to new class Paintbrush ex. **
    drawGoal() {
        this.ctx.fillStyle = 'rgba(155, 245, 0, 1)';
        this.ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    showStatistics() {
        average_fitness = Number(average_fitness).toFixed(2);
        var population_size = organisms.length;
        this.ctx.fillStyle = 'rgba(155, 245, 0, 1)';
        this.ctx.font = "26px arial";
        this.ctx.fillText('Generation:', 10, 520);
        this.ctx.fillText(generation_count.toString(), 210, 520);
        this.ctx.fillText('Population Size:', 10, 550);
        this.ctx.fillText(population_size.toString(), 210, 550);
        this.ctx.fillText('Average Fitness:', 10, 580);
        this.ctx.fillText(average_fitness.toString(), 210, 580);
    }
}

function readyForSim() {
    console.log("Simulation Ready!");
}

function displaySettingsForm() {
    var start_btn = document.getElementsByClassName("start-btn")[0];
    start_btn.style.display = 'none';

    var canvas_container = document.getElementsByClassName("canvas-container")[0];
    var settings_container = document.getElementsByClassName("settings-container")[0];

    canvas_container.style.display = 'none';
    settings_container.style.display = 'block';

    var movement_speed_setting = document.getElementById("move-speed");
    movement_speed_setting.addEventListener('keydown', function(event) {
        // function blocks keystrokes not within the acceptable range for movement speed
        var keystroke = preValidateMovementSetting(event);
        if (keystroke === 1) {
            event.preventDefault();
        }
    });

}

function preValidateMovementSetting(event) {

    // prevent keystrokes that aren't === 1-7 || Backspace, <, > 
    var movement_key = event.key;
    if (movement_key > "0" && movement_key <= "7") {
        return 0;
    }
    else if (movement_key === "Backspace" || movement_key === "ArrowLeft" || movement_key === "ArrowRight") {
        return 0;
    }
    else {
        return 1;
    }
}

function validateSettingsForm() {
    // get form input
    var total_organisms_setting = document.getElementById("total-organisms");
    var movement_speed_setting = document.getElementById("move-speed");
    var gene_count_setting = document.getElementById("gene-count");
    var mutation_rate_setting = document.getElementById("mutation-rate");
    var dialogue_setting = document.getElementById("dialogue-checkbox");
    // get error message
    var error_message = document.getElementsByClassName("error-message")[0];

    // clear error message
    error_message.innerHTML = "";

    // turn into functionslater : validateTotalOrganismsSetting(), or validateSettings()
    // set varaibles
    if (typeof parseInt(total_organisms_setting.value) === 'number' && parseInt(total_organisms_setting.value) > 0) {
        if (parseInt(total_organisms_setting.value > 9999)) {
            TOTAL_ORGANISMS = 9999;
        }
        else {
            TOTAL_ORGANISMS = Math.abs(parseInt(total_organisms_setting.value));
        }
        total_organisms_setting.style.borderBottom = '2px solid var(--custom-green)';
    }
    else {
        total_organisms_setting.style.borderBottom = '2px solid red';
        error_message.innerHTML = "* Invalid number of organisms. Please input a positive number.";
        return false;
    }

    if (typeof parseInt(gene_count_setting.value) === 'number' && parseInt(gene_count_setting.value) > 0) {
        if (parseInt(gene_count_setting.value) > 1000) {
            GENE_COUNT = 1000;
        }
        else {
            GENE_COUNT = Math.abs(parseInt(gene_count_setting.value));
        }
        gene_count_setting.style.borderBottom = '2px solid var(--custom-green)';
    }
    else {
        gene_count_setting.style.borderBottom = '2px solid red';
        error_message.innerHTML = "* Invalid gene count. Please input a positive number.";
        return false;
    }

    // consider allowing float here
    if (typeof parseInt(mutation_rate_setting.value) === 'number' && parseInt(mutation_rate_setting.value) > 0) {
        if (parseInt(mutation_rate_setting.value) > 100) {
            MUTATION_RATE = 1;
        }
        else {
            MUTATION_RATE = parseInt(mutation_rate_setting.value) / 100;
        }
        mutation_rate_setting.style.borderBottom = '2px solid var(--custom-green)';
    }
    else {
        mutation_rate_setting.style.borderBottom = '2px solid red';
        error_message.innerHTML = "Invalid mutation rate. Please input a positive percentage value. (3 = 3%)";
        return false;
    }

    // create max and min genes from movement speed
    // no error message yet. Might convert to select-box
    // check for duplicate logic in displaySettingsForm() / preValidateMovementSetting()
    if (typeof parseInt(movement_speed_setting.value) === 'number') {
        if (parseInt(movement_speed_setting.value) > 0 && parseInt(movement_speed_setting.value) <= 7) {
            MIN_GENE = parseInt(movement_speed_setting.value) * -1;
            MAX_GENE = parseInt(movement_speed_setting.value);
        } 
        else {
            movement_speed_setting.style.borderBottom = '2px solid red';
            return false;
        }   
    }
    else {
        movement_speed_setting.style.borderBottom = '2px solid red';
        return false;
    }

    if (dialogue_setting.checked) {
        dialogue = true;
    }
    else {
        dialogue = false;
    }

    //return to original view (could be returnToTitleScreen() function?)

    finishApplyingSettings();

    // html/css changes made && vars updated
    // don't submit the form
    return false;
}

function finishApplyingSettings() {
    // make html changes before function returns
    var canvas_container = document.getElementsByClassName("canvas-container")[0];
    var settings_container = document.getElementsByClassName("settings-container")[0];

    canvas_container.style.display = 'block';
    settings_container.style.display = 'none';

    var start_btn = document.getElementsByClassName("start-btn")[0];
    start_btn.style.display = 'block';

    return 0;
}

function stopSimulation() {
    // reloads the page
    document.location.reload();
}

async function runSimulation () {
    console.log("Running Simulation with these settings:");
    console.log(`Total Organisms: ${TOTAL_ORGANISMS}`);
    console.log(`Gene Count: ${GENE_COUNT}`);
    console.log(`Mutation Rate: ${MUTATION_RATE}`);
    console.log(`Min/Max Gene: [${MIN_GENE}, ${MAX_GENE}]`);
    console.log(`Dialogue: ${dialogue}`);

    // make start/settings buttons disappear, display stop simulation button
    var start_btn = document.getElementsByClassName("start-btn")[0];
    var stop_btn = document.getElementsByClassName("stop-btn")[0];
    var settings_btn = document.getElementsByClassName("settings-btn")[0];
    start_btn.style.display = 'none';
    settings_btn.style.display = 'none';
    stop_btn.style.display = 'block';

    // Create organisms with random genes
    /// PHASE: CREATE NEW GENERATION/POPULATION
    createOrganisms();
    console.log("Amount of organisms created = " + organisms.length);

    // intro-animation here before sim-loop?

    do {
        const result = await runGeneration();
        console.log(result);
    } while (generation_count < 1000);
}

async function runGeneration() {

    // this will clear the phase text area
    // can use this for fading stats to black
    // ctx.fillStyle = 'red';
    // ctx.fillRect(10, 10, 275, 200);

    if (dialogue) {
        await fadeInEvaluationPhaseText();
    }
    
    // Phase: Evaluate Individuals
    // this is where statistics are redrawn (goal.showStatistics())
    if (simulation_succeeded) {
        await runEvaluationAnimation();
    }
    else {
        // check if simulation succeeded 
        var success_flag = await runEvaluationAnimation();
        console.log(`Success Flag: ${success_flag}`);

        // here, if success flag is true, we can await the success animation
        if (success_flag) {
            // update flag
            simulation_succeeded = true;

            // give user time to see their win
            await sleepTest(1500);
            await fadeInSuccessMessage();

            do {
                var key_pressed = await getUserDecision();
                console.log(key_pressed);
            }
            while (key_pressed != "Enter" && key_pressed != "q");

            console.log("Key Accepted: " + key_pressed);

            await fadeOutSuccessMessage();

            if (key_pressed === 'Enter') {
                console.log("Continuing Simulation.");
                await sleepTest(500);
            }
            else if (key_pressed === 'q') {
                console.log("Quitting Simulation.");
                await fadeToBlack(organisms);
                // possibly fade stats to black here too?
                stopSimulation();
            }
        }
    }
    

    const population_resolution = await evaluatePopulation(); // maybe don't await here
    var closest_organism = population_resolution['closest_organism'];
    average_fitness = population_resolution['average_fitness'];

    if (dialogue) {
        await fadeOutEvaluationPhaseText();
    }

    // trying this to prevent text being redrawn to over-saturation
    // ctx.clearRect(10, 10, 275, 200);
    // drawPhases();

    if (dialogue) {
        await fadeInSelectionPhaseText();
    }

    // PHASE: SELECT MOST-FIT INDIVIDUALS
    // this phase includes: beginSelectionProcess(), selectParentsForReproduction()
    const potential_parents = await beginSelectionProcess(); // maybe don't await here

    var potential_mothers = potential_parents['potential_mothers'];
    var potential_fathers = potential_parents['potential_fathers'];

    var parents = selectParentsForReproduction(potential_mothers, potential_fathers);

    console.log("made it to here, calling runSelectionAnimations()"); // this means that fadeInSelectionPhaseText() resolves when opacity >= 1.00

    if (dialogue) {
        await runSelectionAnimations(closest_organism, parents);
        await fadeOutSelectionPhaseText(); 
    }

    // PHASE: CROSSOVER / MUTATE / REPRODUCE

    // follow same naming convention for these animations!
    if (dialogue) {
        // this function handles crossover, mutation and reproduction
        // this function pushes new gen organisms to offspring_organisms[]
        reproduceNewGeneration(parents);

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
    }
    else {
        // without dialogue, we need to fade the organisms to black before reproduceNewGeneration() forgets old population
        await sleepTest(1000);
        await fadeToBlack(organisms);
        await sleepTest(1000);
        reproduceNewGeneration(parents);
    }

    return new Promise(resolve => {
        generation_count++;
        resolve(generation_count);
    })
}

async function runEvaluationAnimation() {
    // do stuff
    var goal = new Goal(GOAL_X_POS, GOAL_Y_POS, 20, ctx);

    var success_flag = await updateAndMoveOrganisms(goal); // ideally don't pass in goal here
    return new Promise((resolve, reject) => {
        if (success_flag) {
            resolve(true);
        }
        else {
            resolve(false);
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
        var total_moves = 0;
        var finished = false;
        var success_flag = false;
        // why is this async?
        async function animateOrganisms() {
            if (!finished) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                goal.drawGoal();
                goal.showStatistics();

                if (dialogue) {
                    drawEvaluationPhaseText();
                }

                for (var i = 0; i < organisms.length; i++) {
                    if (organisms[i].reached_goal == false) {
                        organisms[i].update();
                        organisms[i].move();
                        hasReachedGoal(organisms[i], goal);
                    }
                    else {
                        updateSuccessfulOrganism(organisms[i]);
                        success_flag = true;
                    }
                    total_moves++;
                }
                if (total_moves == (organisms.length * GENE_COUNT)) {
                    finished = true;
                }

                sleepTest(1000 / FPS); // control drawing FPS for organisms
                frame_id = requestAnimationFrame(animateOrganisms);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve(success_flag);
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
    var potential_mothers = [];
    var potential_fathers = [];

    for (var i = 0; i < organisms.length; i++) {
        // Give organisms with negative fitness a chance to reproduce
        if (organisms[i].fitness < 0) {
            organisms[i].fitness = 0.01;
        }

        // I'm going to try this implementation >> (organism.fitness * 100) ** 1.25
        console.log(`Fitness for Organism ${i}: ${organisms[i].fitness}`);
        console.log(`Organism ${i} was added to array ${Math.ceil((organisms[i].fitness * 100) ** 2)} times.`);

        for (var j = 0; j < Math.ceil((organisms[i].fitness * 100) ** 2); j++) {
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
    if ((organism.y - (organism.radius / 2)) >= goal.y && (organism.y - (organism.radius / 2)) <= (goal.y + goal.size)) {
        // check if within x-range
        if ((organism.x - (organism.radius / 2)) >= goal.x && (organism.x - (organism.radius / 2)) <= (goal.x + goal.size)) {
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
                closest_organism.ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
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

                for (var i = 0; i < parents.length; i++) {
                    parents[i][0].ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
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
                ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
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
                    parents[i][1].ctx.fillStyle = `rgba(36, 0, 129, ${opacity})`;
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
                ctx.fillStyle = `rgba(36, 0, 129, ${opacity})`;
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
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
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
                        parents[i][0].ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                        parents[i][0].ctx.beginPath();
                        parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
                        parents[i][0].ctx.fill();
                    }
                }
                else if (gender === 'male') {
                    for (var i = 0; i < parents.length; i++) {
                        parents[i][1].ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                        parents[i][1].ctx.beginPath();
                        parents[i][1].ctx.arc(parents[i][1].x, parents[i][1].y, parents[i][1].radius, 0, Math.PI*2, false);
                        parents[i][1].ctx.fill();
                    }
                }
                else if (gender === 'both') {
                    for (var i = 0; i < parents.length; i++) {
                        parents[i][0].ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                        parents[i][0].ctx.beginPath();
                        parents[i][0].ctx.arc(parents[i][0].x, parents[i][0].y, parents[i][0].radius, 0, Math.PI*2, false);
                        parents[i][0].ctx.fill();

                        parents[i][1].ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
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
    console.log("fadeToBlack(organisms) called!");
    var finished = false;
    var opacity = 1.00;
    var executions = 0;
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
                    executions++;
                }

                if (opacity <= 0.01) {
                    finished = true;
                }
                else {
                    console.log(opacity);
                    opacity -= 0.05;
                }
                frame_id = requestAnimationFrame(fadeToBlackOrganisms);
            }
            else {
                // resolve
                console.log(`Expected Executions: ${organisms.length * 21}`);
                console.log(`Executions: ${executions}`);
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
                ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
                ctx.fillText("Females Selected", 800, 500);

                ctx.fillStyle = `rgba(36, 0, 129, ${opacity})`;
                ctx.fillText("Males Selected", 800, 530);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
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
// I don't think this function is called anywhere (keep just in case, be remember rAF rules)
function fadeInPhases() {
    var finished = false;
    var opacity = 0.01;

    return new Promise(resolve => {
        function animate() {
            if (!finished) {

                // needs black box to prevent over-saturation
            
                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Create New Generation", 10, 60);

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Evaluate Individuals", 10, 90);

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 120);

                ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
                ctx.fillText("Crossover", 10, 150);

                ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
                ctx.fillText("Mutate", 10, 180);
                
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
    var old_opacity = 1.00
    return new Promise(resolve => {
        function fadeInEvalText() {
            if (!finished) {
                ctx.clearRect(10, 10, 275, 200);

                ctx.font = "20px arial";

                ctx.fillStyle = 'rgba(100, 100, 100, 1)';
                ctx.fillText("Create New Generation", 10, 30);

                ctx.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
                ctx.fillText("Evaluate Individuals", 10, 60);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
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
                    old_opacity -= 0.02;
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

    ctx.fillStyle = 'rgba(155, 245, 0, 1)';
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
                ctx.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
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
    var finished = false;
    var opacity = 0.00;
    var old_opacity = 1.00;
    return new Promise(resolve => {
        function fadeInSelectionText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 70, 250, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 90);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText("Select Most-Fit Individuals", 10, 90);

                if (opacity >= 0.99) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
                }
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

                ctx.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
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
    var old_opacity = 1.00;
    return new Promise(resolve => {
        function fadeInCrossoverText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 100, 200, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
                ctx.fillText("Crossover", 10, 120);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText("Crossover", 10, 120);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
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
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
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
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
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

                ctx.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
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
    var old_opacity = 1.00;
    return new Promise(resolve => {
        function fadeInMutationText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 130, 200, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
                ctx.fillText("Mutate", 10, 150);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText("Mutate", 10, 150);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
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
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(description, 190, 300);

                ctx.font = "22px arial";
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
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
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(description, 190, 300);

                ctx.font = "22px arial";
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
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

                ctx.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
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
    var old_opacity = 1.00;
    return new Promise(resolve => {
        function fadeInNewGenText() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(10, 10, 250, 20);

                ctx.font = "20px arial";

                ctx.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
                ctx.fillText("Create New Generation", 10, 30);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText("Create New Generation", 10, 30);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                    old_opacity -= 0.02;
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
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(generation_summary_text, 380, 280);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(generation_average_fitness_preface, 380, 330);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText(average_fitness.toFixed(2).toString(), 600, 330);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(generation_offspring_reproduced_preface, 380, 355);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
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
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(generation_summary_text, 380, 280);

                ctx.font = "20px arial";
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(generation_average_fitness_preface, 380, 330);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText(average_fitness.toFixed(2).toString(), 600, 330);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText(generation_offspring_reproduced_preface, 380, 355);

                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
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

                ctx.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
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

function fadeInSuccessMessage() {
    var opacity = 0.00;
    var finished = false;
    return new Promise(resolve => {
        function successFadeIn() {
            if (!finished) {
                ctx.font = '44px arial';
                ctx.fillStyle = 'black';
                ctx.fillText("Your Simulation Succeeded!", 235, 275);
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText("Your Simulation Succeeded!", 235, 275);

                ctx.font = '30px arial';
                ctx.fillStyle = 'black';
                ctx.fillText(`Generations: ${generation_count}`, 420, 340);
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText(`Generations: ${generation_count}`, 420, 340);

                ctx.font = '26px arial';
                ctx.fillStyle = 'black';
                ctx.fillText("Press 'ENTER' to Resume Simulation", 300, 410);
                ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
                ctx.fillText("Press 'ENTER' to Resume Simulation", 300, 410);

                ctx.font = '26px arial';
                ctx.fillStyle = 'black';
                ctx.fillText("Press 'Q' to Quit", 420, 450);
                ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
                ctx.fillText("Press 'Q' to Quit", 420, 450);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.05;
                }
                frame_id_success_in = requestAnimationFrame(successFadeIn);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id_success_in);
                resolve();
            }
        }
        start_success_fadein = requestAnimationFrame(successFadeIn);
    })
}

function fadeOutSuccessMessage() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function successFadeOut() {
            if (!finished) {
                ctx.font = '44px arial';
                ctx.fillStyle = 'black';
                ctx.fillText("Your Simulation Succeeded!", 235, 275);
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText("Your Simulation Succeeded!", 235, 275);

                ctx.font = '30px arial';
                ctx.fillStyle = 'black';
                ctx.fillText(`Generations: ${generation_count}`, 420, 340);
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText(`Generations: ${generation_count}`, 420, 340);

                ctx.font = '26px arial';
                ctx.fillStyle = 'black';
                ctx.fillText("Press 'ENTER' to Resume Simulation", 300, 410);
                ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
                ctx.fillText("Press 'ENTER' to Resume Simulation", 300, 410);

                ctx.font = '26px arial';
                ctx.fillStyle = 'black';
                ctx.fillText("Press 'Q' to Quit", 420, 450);
                ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
                ctx.fillText("Press 'Q' to Quit", 420, 450);

                if (opacity <= 0.00) {
                    finished = true;
                    // draw black box over text
                    ctx.fillStyle = 'black';
                    ctx.fillRect(235, 231, 550, 235);

                    // redraw organisms
                    for (var i = 0; i < organisms.length; i++) {
                        organisms[i].move();
                    }
                }
                else {
                    opacity -= 0.05;
                    console.log(opacity);
                }
                frame_id_success_out = requestAnimationFrame(successFadeOut);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id_success_out);
                resolve();
            }
        }
        start_success_fadeout = requestAnimationFrame(successFadeOut);
    })
}

function getUserDecision() {
    console.log("Waiting for key press...");
    return new Promise(resolve => {
        document.addEventListener('keydown', function(event) {
            var key = event.key;
            resolve(key);
        });
    })
}