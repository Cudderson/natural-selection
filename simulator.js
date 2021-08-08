document.addEventListener("DOMContentLoaded", playTitleScreenAnimation);

// starting coordinates for organisms and goal
const INITIAL_X = 500; 
const INITIAL_Y = 500;
const GOAL_X_POS = 500;
const GOAL_Y_POS = 50;

// organism global default settings
var TOTAL_ORGANISMS = 100;
var GENE_COUNT = 250;
var MUTATION_RATE = 0.03;
var MIN_GENE = -5;
var MAX_GENE = 5;
var dialogue = false;

// boundary globals
var custom_boundary;

// flags
var simulation_started = false;
var simulation_succeeded = false;

// track total generations
var generation_count = 0;

// generation statistics
var average_fitness = 0.00;
var total_fitness = 0.00;

// containers holding organisms and next-generation organisms
var organisms = [];
var offspring_organisms = [];

// canvas & drawing context
var canvas = document.getElementById("main-canvas");
var ctx = canvas.getContext("2d");

// ********** name conflicts with canvas_data in hitDetectionTest, need to fix
var canvas_data_bad_practice = ctx.getImageData(0, 0, canvas.width, canvas.height);

// frame rate
const FPS = 30;

// Stores the position of the cursor
let coordinates = {'x':0 , 'y':0};

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
        // for boundary animations
        this.is_alive = true;
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
        this.ctx.font = "22px arial";
        this.ctx.fillText('Generation:', 740, 535);
        this.ctx.fillText(generation_count.toString(), 940, 535);
        this.ctx.fillText('Population Size:', 740, 560);
        this.ctx.fillText(population_size.toString(), 940, 560);
        this.ctx.fillText('Average Fitness:', 740, 585);
        this.ctx.fillText(average_fitness.toString(), 940, 585);
    }
}

class Boundary {
    constructor() {
        this.top_boundary = new Image();
        this.bottom_boundary = new Image();
        this.full_boundary = new Image();
        this.top_boundary_coords = [];
        this.bottom_boundary_coords = [];
    }

    applyBoundaryModeStyles() {
        // turn off settings, turn on canvas
        var canvas_container = document.getElementsByClassName("canvas-container")[0];
        var settings_container = document.getElementsByClassName("settings-container")[0];

        canvas_container.style.display = 'block';
        settings_container.style.display = 'none';

        drawBoundaryBoilerplate();

        // html btns
        var settings_btn = document.getElementsByClassName("settings-btn")[0];
        var start_btn = document.getElementsByClassName("start-btn")[0];
        var stop_btn = document.getElementsByClassName("stop-btn")[0];
        var save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];

        settings_btn.style.display = 'none';
        start_btn.style.display = 'none';

        // revert when leaving boundary mode
        stop_btn.style.gridColumn = "2 / 3";
        stop_btn.style.width = "100%";
        stop_btn.innerHTML = "Cancel";
        stop_btn.style.display = "block";

        save_bounds_btn.style.display = "block";
    }

    save(boundary_type) {
        
        var canvas = document.getElementById("main-canvas"); // do we need to declare these?
        var ctx = canvas.getContext('2d');

        var boundary_to_save = canvas.toDataURL("image/png");

        if (boundary_type === 'bottom') {
            console.log("saving bottom-boundary");
            this.bottom_boundary.src = boundary_to_save;
        }
        else if (boundary_type === 'top') {
            console.log("saving top boundary");
            this.top_boundary.src = boundary_to_save;
        }
        else if (boundary_type === 'full') {
            // save full
            console.log("saving full boundary");
            drawBoundaryBoilerplate();

            ctx.drawImage(this.top_boundary, 0, 0, canvas.width, canvas.height);
    
            // remove white dot and revert goal color
            ctx.fillStyle = 'rgb(155, 245, 0)';
            ctx.fillRect(925, 50, 20, 20);
    
            ctx.fillStyle = 'black';
            ctx.beginPath();
            ctx.arc(80, 510, 12, 0, Math.PI*2, false);
            ctx.fill();

            // save image as full-boundary
            this.full_boundary.src = canvas.toDataURL("image/png");
        }
    }

    validateBottom(event) {
        console.log("validating bottom boundary...");

        updateMousePosition(event);

        // check if boundary ended on endpoint
        // endpoint: ctx.fillRect(950, 150, 50, 20);
        if (coordinates['x'] >= 950 && coordinates['y'] >= 150 && coordinates['y'] <= 200) {
            // valid, update boundary step
            console.log("valid boundary");

            // make connectors green
            ctx.fillStyle = 'rgb(155, 245, 0)';
            ctx.fillRect(950, 150, 50, 20);
            ctx.fillRect(150, 550, 20, 50);

            return true;
        }
        else {
            // invalid
            console.log("Invalid boundary.");
            // redraw boilerplate
            drawBoundaryBoilerplate();
            // error message (not written yet);
            return false;
        }   
    }

    validateTop(event) {
        console.log("validating top-boundary...");

        updateMousePosition(event);

        // check if boundary on endpoint
        // endpoint: (ctx.fillRect(830, 0, 20, 50))
        if (coordinates['x'] >= 830 && coordinates['x'] <= 850 && coordinates['y'] <= 50) {
            // valid, update boundary step
            console.log("valid boundary");

            // make top-boundary connectors green
            ctx.fillStyle = 'rgb(155, 245, 0)';
            ctx.fillRect(830, 0, 20, 50);
            ctx.fillRect(0, 430, 50, 20);

            // draw white dot for next step
            ctx.fillStyle = 'white';
            ctx.beginPath();
            ctx.arc(80, 510, 10, 0, Math.PI*2, false);
            ctx.fill();

            // make goal new color (can be a flag in drawBoundaryBoilerplate())
            ctx.fillStyle = 'rgb(232, 0, 118)';
            ctx.fillRect(925, 50, 20, 20);

            // update canvas data
            canvas = document.getElementById("main-canvas");
            ctx = canvas.getContext("2d");
            canvas_data_bad_practice = ctx.getImageData(0, 0, canvas.width, canvas.height);

            return true;
        }
        else {
            // invalid
            console.log("Invalid boundary.");
            // redraw boilerplate
            drawBoundaryBoilerplate();

            // draw valid bottom-boundary
            ctx.drawImage(this.bottom_boundary, 0, 0, canvas.width, canvas.height);

            // error message (not written yet)

            return false;
        }
    }

    validateFull() {
        // check if user ended line on goal
        // Goal(925, 50, 20, ctx);
        if (coordinates['x'] >= 925 && coordinates['x'] <= 945 &&
            coordinates['y'] >= 50 && coordinates['y'] <= 70) {

            return true;
        }
        else {
            return false;
        }
    }

    createCheckpoints() {
        // this should be visual at first so I can see what it's doing.
        // for that, I'll need to draw the boundary over the canvas, then animate(optional) my algorithm.
        console.log("createCheckpoints() called");

        console.log(`Coordinates for Bottom Boundary: `);

        // this allows us to view coords as 2d arrays
        for (let k = 0; k < this.bottom_boundary_coords.length; k++) {
            console.log(this.bottom_boundary_coords[k]);
        }

        console.log("Lengths:");
        console.log(`bottom: ${this.bottom_boundary_coords.length}, top: ${this.top_boundary_coords.length}`);

        // determine which boundary has more coordinates
        var longest_boundary_coords;
        var target_length;
        var removal_factor;

        if (this.top_boundary_coords.length > this.bottom_boundary_coords.length) {
            // top longer
            longest_boundary_coords = this.top_boundary_coords;
            target_length = this.bottom_boundary_coords.length;
            removal_factor = Math.ceil(this.top_boundary_coords.length / this.bottom_boundary_coords.length);
        }
        else if (this.bottom_boundary_coords.length > this.top_boundary_coords.length) {
            // bottom longer
            longest_boundary_coords = this.bottom_boundary_coords;
            target_length = this.top_boundary_coords.length;
            removal_factor = Math.ceil(this.bottom_boundary_coords.length / this.top_boundary_coords.length);
        }
        else {
            // equal
            // don't know how to handle yet
        }

        console.log(target_length);
        console.log(removal_factor);

        var num_coords_to_remove = longest_boundary_coords.length - target_length;
        var percent_to_remove = num_coords_to_remove / longest_boundary_coords.length;
        var random_percentage;
        var removed = 0;
        var kept = 0;

        console.log(`# to remove: ${num_coords_to_remove}`);
        console.log(`% to remove: ${percent_to_remove}`);

        console.log(`Starting loop. Longest length = ${longest_boundary_coords.length}`)

        var preserved_longest_length = longest_boundary_coords.length; // so that splicing doesn't affect array size

        for (let i = 0; i < preserved_longest_length; i++) {
            random_percentage = Math.random();

            if (random_percentage < percent_to_remove) {
                // remove
                console.log(`Removed coord ${i}: ${random_percentage}`);

                // need to remember the amount removed so that we remove the correct coord from the changing array
                longest_boundary_coords.splice((i - removed), 1);
                removed++;
            }
            else {
                console.log(`Kept coord ${i}: ${random_percentage}`);
                kept++;
            }

            if (longest_boundary_coords.length === target_length) {
                console.log("BREAKING");
                break;
            }
        }

        console.log(`Loop finished. Longest new size: ${longest_boundary_coords.length}`);

        console.log("Total Removed: " + removed);
        console.log(`Total Kept: ${kept}`);
        console.log(`% removed (desired): ${percent_to_remove}`);
        console.log(`% removed (actual): ${removed / preserved_longest_length}`)

        // now we should have an array that's 'close' to the length of the target
        console.log(`New Length of longest array: ${longest_boundary_coords.length}`);
        console.log(`Target Length: ${target_length}`);

        // at this point, the longest_coordinate set is either the same size as the shortest, or slightly larger
        // let's trim off the extra if there is any

        if (longest_boundary_coords.length !== target_length) {
            do {
                // remove a random coordinate
                var coordinate_to_remove = Math.floor(Math.random() * longest_boundary_coords.length);
                longest_boundary_coords.splice(coordinate_to_remove, 1);
            }
            while (longest_boundary_coords.length !== target_length);
        }

        console.log("We should now have to coordinate sets of the same length");
        console.log(`Longest: ${longest_boundary_coords.length}`);
        console.log(target_length);

        // works up to here!
        // I think we still need to assign the modified coordinate_array to the class attribute
    }
}

// class Paintbrush() {}

// Main Drivers
async function runPreSimAnimations() {

    // (only with dialogue on!)
    await fadeInSimulationSettings();
    await sleep(2000);
    await fadeOutSimulationSettings();
    await fadeInSimulationIntro();
    await sleep(2000);
    await fadeInFakeGoal();
    await fadeOutSimulationIntro();
    await fadeInSimulationExplanation();
    await sleep(4000);
    await fadeOutExplanationAndGoal();
    await sleep(1000);
    await fadeInStats(); 
    await sleep(1000);

    return new Promise(resolve => {
        resolve("pre sim complete!");
    })
}

// function for testing custom boundary
function checkSimType() {
    // eventually, both sims will be the same, this is for testing
    if (custom_boundary) {
        testBoundarySim();
    }
    else {
        console.log("nope");
        runSimulation();
    }
}

async function testBoundarySim() {
    // update flag to resolve playTitleScreenAnimation()
    simulation_started = true;

    // clear
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 10 organisms this time
    for (var i = 0; i < 10; i++) {
        organism = new Organism('male', INITIAL_X, INITIAL_Y, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }

    await hitDetectionTest(organisms);

    console.log("Hit Detection Test Complete.");
}

function getPixel(canvas_data, index) {
    var i = index * 4;
    var data = canvas_data.data;

    return [data[i], data[i+1], data[i+2], data[i+3]];
}

function getPixelXY(canvas_data, x, y) {
    var index = y * canvas_data.width + x; // *** not sure how this works but it does ***

    // return index;
    return getPixel(canvas_data, index);
}

// needs to be updated for new class Boundary() (make class method?)
function hitDetectionTest(organisms) {

    return new Promise(resolve => {
        var finished = false;
        var position_rgba;
        var total_moves = 0;
        var canvas_data;

        function animateOrganisms() {

            if (!finished) {
                // this condition will change when more organisms added
                if (total_moves >= GENE_COUNT * organisms.length) {
                    finished = true;
                }
                else {
                    // clear
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // draw boundary
                    ctx.drawImage(custom_boundary.full_boundary, 0, 0, canvas.width, canvas.height);

                    // *** maybe global would be better for this. Because the image data with boundaries is all I care about
                    canvas_data = ctx.getImageData(0, 0, canvas.width, canvas.height); // keeping this outside greatly improves speed
                    
                    // do it with 10 organisms (seems to already be pretty slow)
                    for (var j = 0; j < organisms.length; j++) {

                        // update index
                        if (organisms[j].is_alive) {
                            organisms[j].update();
                        }

                        position_rgba = getPixelXY(canvas_data, organisms[j].x, organisms[j].y);
                        
                        console.log("Current Position Pixel for Organism: " + position_rgba);

                        // --custom-green: rgba(155, 245, 0, 1);
                        // highlight organism red if he leaves safe area (dies)
                        if (position_rgba[0] === 155 && position_rgba[1] === 245 || organisms[j].is_alive === 'false') {
                            organisms[j].is_alive = false;
                            organisms[j].ctx.fillStyle = 'red';
                            organisms[j].ctx.beginPath();
                            organisms[j].ctx.arc(organisms[j].x, organisms[j].y, organisms[j].radius, 0, Math.PI*2, false);
                            organisms[j].ctx.fill();
                        }
                        else {
                            organisms[j].move();
                        }
                        total_moves++;
                    }
                }
                sleep(1000 / FPS); // looks smoother without fps
                frame_id = requestAnimationFrame(animateOrganisms);
            }

            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_test_guy_animation = requestAnimationFrame(animateOrganisms);
    })
}

// END CUSTOM BOUNDARY SIM TEST

async function runSimulation () {

    simulation_started = true;

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

    // pre-sim animations *****
    await runPreSimAnimations();

    /// PHASE: CREATE NEW GENERATION/POPULATION
    createOrganisms();
    console.log("Amount of organisms created = " + organisms.length);

    do {
        const result = await runGeneration();
        console.log(result);
    } while (generation_count < 1000);
}

async function runGeneration() {

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
            await sleep(1500);
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
                await sleep(500);
            }
            else if (key_pressed === 'q') {
                console.log("Quitting Simulation.");
                await fadeToBlack(organisms);
                // possibly fade stats to black here too?
                stopSimulation();
            }
        }
    }

    if (dialogue) {
        await fadeOutEvaluationPhaseText();
        await fadeOutStats(); // put here to fade out stats before average fitness updated
        await sleep(1000);
    }

    const population_resolution = await evaluatePopulation(); // maybe don't await here
    var closest_organism = population_resolution['closest_organism'];
    average_fitness = population_resolution['average_fitness'];

    // PHASE: SELECT MOST-FIT INDIVIDUALS
    if (dialogue) {
        await fadeInSelectionPhaseText();
    }

    // this phase includes: beginSelectionProcess(), selectParentsForReproduction()
    const potential_parents = await beginSelectionProcess(); // maybe don't await here

    var potential_mothers = potential_parents['potential_mothers'];
    var potential_fathers = potential_parents['potential_fathers'];

    // we shouldn't enter the selection phase if there aren't enough organisms to reproduce
    // this could happen if a population produced all males, then potential_mothers would never get filled, and program fails
    // check extinction
    if (potential_mothers.length === 0 || potential_fathers.length === 0) {
        await fadeInExtinctionMessage();
        await sleep(2000);
        do {
            var exit_key = await getUserDecision();
            console.log(exit_key);
        }
        while (exit_key != "q");

        stopSimulation();
    }

    var parents = selectParentsForReproduction(potential_mothers, potential_fathers);
    
    if (dialogue) {
        await sleep(1000);
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
        await sleep(2000);
        await fadeOutCrossoverDescriptionText();
        await fadeOutCrossoverPhaseText();
    
        await fadeInMutationPhaseText();
        await fadeInMutationDescriptionText();
        await sleep(2000);
        await fadeOutMutationDescriptionText();
        await fadeOutMutationPhaseText();
    
        await fadeInCreateNewGenPhaseText();
        await fadeInGenerationSummaryText();
        await sleep(2000);
        await fadeOutGenerationSummaryText();
        await fadeOutCreateNewGenPhaseText();
    }
    else {
        // without dialogue, we need to fade the organisms to black before reproduceNewGeneration() forgets old population
        await sleep(1000);
        await fadeToBlack(organisms);
        await sleep(1000);
        reproduceNewGeneration(parents);
    }

    return new Promise(resolve => {
        generation_count++;
        resolve(generation_count);
    })
}

function stopSimulation() {
    // reloads the page
    document.location.reload();
}

// 1. Create Initial Population
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
    var random_x = Math.floor(Math.random() * (max - min + 1) + min);
    var random_y = Math.floor(Math.random() * (max - min + 1) + min);
    var random_gene = [random_x, random_y];
    return random_gene;
}

// 2. Evaluate
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

                sleep(1000 / FPS); // control drawing FPS for organisms
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

// 3. Selection
async function runSelectionAnimations(closest_organism, parents) {
    console.log("Called runSelectionAnimations()");
    // maybe model other phases after this one
    await highlightClosestOrganism(closest_organism);
    await highlightChosenParents(parents);

    return new Promise(resolve => {
        resolve("Run Selection Animations Complete");
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

// 4 & 5. Crossover & Mutate (Mutation handled on gene inheritance)
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

function getGender() {
    var gender_indicator = Math.random();
    var gender;
    if (gender_indicator < 0.5) {
        gender = 'female';
    }
    else {
        gender = 'male';
    }
    return gender;
}

function reproduce(crossover_genes) {
    offspring_gender = getGender();
    offspring = new Organism(offspring_gender, INITIAL_X, INITIAL_Y, ctx);
    offspring.genes = crossover_genes;
    // push offspring to new population
    offspring_organisms.push(offspring);
}

// *** Animations ***
// Title Screen
async function playTitleScreenAnimation() {
    console.log("Simulation Ready!");

    var title_organisms = createTitleScreenOrganisms();
    
    do {
        console.log("Starting Title Animation");

        var status = await fadeInTitleAnimation(title_organisms);

        if (status === "Display Settings") {
            console.log("Displaying Settings");
            displaySettingsForm();
        }
        else if (status === "TEST BOUNDARY MODE") {
            console.log("Entering Boundary Mode");
            enterBoundaryCreationMode();
        }
    }
    while (simulation_started === false && status === "Keep Playing");
}

function createTitleScreenOrganisms() {
    var title_organisms = [];
    for (var i = 0; i < 100; i++) {
        // we need a random x&y value to start the organism at 
        var random_x = Math.floor(Math.random() * canvas.width);
        var random_y = Math.floor(Math.random() * canvas.height);

        var new_organism = new Organism('female', random_x, random_y, ctx);

        // ** NEED TO ALTER fadeInTitleAnimation() IF ANYTHING HERE CHANGES
        for (var j = 0; j < 250; j++) {
            var random_gene = getRandomGene(-5, 5);
            new_organism.genes.push(random_gene);
        }

        title_organisms.push(new_organism);
    }
    return title_organisms;
}

function fadeInTitleAnimation(title_organisms) {
    var opacity = 0.00;
    var finished = false;
    var cycles = 0;

    var logo = document.getElementById("logo");

    var settings_btn = document.getElementsByClassName("settings-btn")[0];

    return new Promise(resolve => {
        function animateTitle() {
            if (!finished && !simulation_started) {

                // if settings clicked, resolve animation
                settings_btn.addEventListener("click", function() {
                    cancelAnimationFrame(frame_id);
                    resolve("Display Settings");
                });

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            
                // move organisms forever (works)
                for (var i = 0; i < 100; i++) {
                    if (title_organisms[0].index < 250) {
                        // update and move
                        if (title_organisms[i].index < 250) {
                            title_organisms[i].x += title_organisms[i].genes[title_organisms[i].index][0];
                            title_organisms[i].y += title_organisms[i].genes[title_organisms[i].index][1];
                            title_organisms[i].index++;
                        }
                        title_organisms[i].move();
                    }
                    else {
                        cycles++;
                        console.log("Resetting Gene Index");

                        for (var j = 0; j < 100; j++) {
                            title_organisms[j].index = 0;
                        }

                        if (cycles >= 5) {
                            finished = true;
                        }
                    }
                }

                // draw image instead
                // use globalAlpha, then reset
                // could make this class Paintbrush in the future for this and goal class methods
                ctx.globalAlpha = opacity;
                ctx.drawImage(logo, 105, 275);
                ctx.globalAlpha = 1;

                if (opacity < 1.00) {
                    opacity += 0.005;
                }

                sleep(750 / FPS); // control drawing FPS for organisms
                frame_id = requestAnimationFrame(animateTitle);
            }
            else {
                // resolves every n cycles to prevent overflow
                cancelAnimationFrame(frame_id);
                resolve("Keep Playing");
            }
        }
        start_title_fadein = requestAnimationFrame(animateTitle);
    })

}

// Simulation Introduction
function fadeInSimulationSettings() {
    // this will be called by runPreSimAnimations(), and run before the first generation
    var opacity = 0.00;
    var finished = false;
    return new Promise(resolve => {
        function simSettingsFadeIn() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = "30px arial";
                ctx.fillText("Simulation Settings", 300, 195);
                ctx.fillRect(300, 197, 260, 1);

                ctx.font = "24px arial";
                ctx.fillText(`Initial Population:`, 300, 250);
                ctx.fillText(`Gene Count:`, 300, 290);
                ctx.fillText(`Movement Speed:`, 300, 330);
                ctx.fillText(`Mutation Rate:`, 300, 370);
                ctx.fillText(`Dialogue:`, 300, 410);
                
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText(`${TOTAL_ORGANISMS}`, 600, 250);
                ctx.fillText(`${GENE_COUNT}`, 600, 290);
                ctx.fillText(`${MAX_GENE}`, 600, 330);
                ctx.fillText(`${MUTATION_RATE}`, 600, 370);
                if (dialogue === false) {
                    ctx.fillText(`Disabled`, 600, 410);
                }
                else {
                    ctx.fillText(`Enabled`, 600, 410);
                }
                
                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.01;
                }
                frame_id = requestAnimationFrame(simSettingsFadeIn);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_settings_fadein = requestAnimationFrame(simSettingsFadeIn);
    })
}

function fadeOutSimulationSettings() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function simSettingsFadeOut() {
            if (!finished) {
                //animate
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = "30px arial";
                ctx.fillText("Simulation Settings", 300, 195);
                ctx.fillRect(300, 197, 260, 1);

                ctx.font = "24px arial";
                ctx.fillText(`Initial Population:`, 300, 250);
                ctx.fillText(`Gene Count:`, 300, 290);
                ctx.fillText(`Movement Speed:`, 300, 330);
                ctx.fillText(`Mutation Rate:`, 300, 370);
                ctx.fillText(`Dialogue:`, 300, 410);
                
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillText(`${TOTAL_ORGANISMS}`, 600, 250);
                ctx.fillText(`${GENE_COUNT}`, 600, 290);
                ctx.fillText(`${MAX_GENE}`, 600, 330);
                ctx.fillText(`${MUTATION_RATE}`, 600, 370);

                if (dialogue === false) {
                    ctx.fillText(`Disabled`, 600, 410);
                }
                else {
                    ctx.fillText(`Enabled`, 600, 410);
                }


                if (opacity <= 0.00) {
                    finished = true;
                }
                else {
                    opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(simSettingsFadeOut);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_sim_settings_fadeout = requestAnimationFrame(simSettingsFadeOut);
    })
}

function fadeInSimulationIntro() {
    var opacity = 0.00;
    var finished = false;
    return new Promise(resolve => {
        function simIntroFadeIn() {
            if (!finished) {
                // "100" organisms were created with completely random genes.
                // This society of organisms needs to reach the goal if it wants to survive. (draw goal?)

                // animation
                // clear rect []
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = '28px arial';
                ctx.fillText(`${TOTAL_ORGANISMS} organisms were created with completely random genes.`, 125, 290);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = '22px arial';
                ctx.fillText("This society of organisms needs to reach the goal if it wants to survive.", 150, 330);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.01;
                }
                frame_id = requestAnimationFrame(simIntroFadeIn);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_sim_intro_fadein = requestAnimationFrame(simIntroFadeIn);
    })
}

function fadeInFakeGoal() {
    // used in intro animation
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function fakeGoalFadeIn() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(500, 50, 20, 20);
                
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillRect(500, 50, 20, 20);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.01;
                }
                frame_id = requestAnimationFrame(fakeGoalFadeIn);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_fake_goal_fadein = requestAnimationFrame(fakeGoalFadeIn);
    })
}

function fadeOutSimulationIntro() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function simIntroFadeOut() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 200, canvas.width, canvas.height);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = '28px arial';
                ctx.fillText(`${TOTAL_ORGANISMS} organisms were created with completely random genes.`, 125, 290);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = '22px arial';
                ctx.fillText("This society of organisms needs to reach the goal if it wants to survive.", 150, 330);

                if (opacity <= 0.00) {
                    finished = true;
                }
                else {
                    opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(simIntroFadeOut);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_sim_intro_fadeout = requestAnimationFrame(simIntroFadeOut);
    })
}

function fadeInSimulationExplanation() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function simExplanationFadeIn() {
            if (!finished) {
                // Using a genetic algorithm based on natural selection, these organisms will undergo generations of
                // reproduction, evaluation, selection, gene crossover and mutation, until they either succeed or fail to survive.

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 100, canvas.width, canvas.height);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = '22px arial';
                ctx.fillText("Using a genetic algorithm based on natural selection, these organisms will undergo", 125, 290);
                ctx.fillText("generations of reproduction, evaluation, selection, gene crossover and mutation,", 125, 320);
                ctx.fillText("until they succeed or fail to survive.", 350, 350);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.01;
                }
                frame_id = requestAnimationFrame(simExplanationFadeIn);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_sim_explanation_fadein = requestAnimationFrame(simExplanationFadeIn);
    })
}

function fadeOutExplanationAndGoal() {
    var finished = false;
    var opacity = 1.00;
    return new Promise(resolve => {
        function explanationAndGoalFadeOut() {
            if (!finished) {
                //animate
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.font = '22px arial';
                ctx.fillText("Using a genetic algorithm based on natural selection, these organisms will undergo", 125, 290);
                ctx.fillText("generations of reproduction, evaluation, selection, gene crossover and mutation,", 125, 320);
                ctx.fillText("until they succeed or fail to survive.", 350, 350);

                // fake goal
                ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                ctx.fillRect(500, 50, 20, 20);

                if (opacity <= 0.00) {
                    finished = true;
                }
                else {
                    opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(explanationAndGoalFadeOut);
            }
            else {
                //resolve
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_explanation_fadeout = requestAnimationFrame(explanationAndGoalFadeOut);
    })
}

function fadeInStats() {
    var finished = false;
    var opacity = 0.00;
    average_fitness = Math.abs(Number(average_fitness)).toFixed(2);
    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(738, 510, 250, 90);
            
                this.ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                this.ctx.font = "22px arial";
                this.ctx.fillText('Generation:', 740, 535);
                this.ctx.fillText(generation_count.toString(), 940, 535);
                this.ctx.fillText('Population Size:', 740, 560);
                this.ctx.fillText(TOTAL_ORGANISMS.toString(), 940, 560);
                this.ctx.fillText('Average Fitness:', 740, 585);
                this.ctx.fillText(average_fitness.toString(), 940, 585);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.02;
                }
                frame_id = requestAnimationFrame(animate);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_stats_fadein = requestAnimationFrame(animate);
    })
}

// stats won't fade out on non-dialogue sims (reminder)
function fadeOutStats() {
    var finished = false;
    var opacity = 1.00;
    average_fitness = Math.abs(Number(average_fitness)).toFixed(2);
    return new Promise(resolve => {
        function animate() {
            if (!finished) {
                ctx.fillStyle = 'black';
                ctx.fillRect(738, 510, 250, 90);
            
                this.ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
                this.ctx.font = "22px arial";
                this.ctx.fillText('Generation:', 740, 535);
                this.ctx.fillText(generation_count.toString(), 940, 535);
                this.ctx.fillText('Population Size:', 740, 560);
                this.ctx.fillText(TOTAL_ORGANISMS.toString(), 940, 560);
                this.ctx.fillText('Average Fitness:', 740, 585);
                this.ctx.fillText(average_fitness.toString(), 940, 585);

                if (opacity <= 0.00) {
                    finished = true;
                }
                else {
                    opacity -= 0.02;
                }
                frame_id = requestAnimationFrame(animate);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_stats_fadeout = requestAnimationFrame(animate);
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

// Evaluation Phase
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

function updateSuccessfulOrganism(organism) {
    organism.ctx.fillStyle = 'red';
    organism.ctx.beginPath();
    organism.ctx.arc(organism.x, organism.y, organism.radius, 0, Math.PI*2, false);
    organism.ctx.fill();
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

// Selection Phase
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

async function highlightClosestOrganism (closest_organism) {
    console.log('highlightClosestOrganism() called');
    await fadeInClosestOrganismText();
    const x = await fadeInClosestOrganism(closest_organism);
    console.log(x);
    await fadeClosestToOriginal(closest_organism);
    await fadeInClosestOrganism(closest_organism);
    await fadeClosestToOriginal(closest_organism);
    await fadeInClosestOrganism(closest_organism);
    await sleep(1000);
    await fadeToBlackTextClosestOrganism();
    await fadeClosestToOriginal(closest_organism);
    return new Promise(resolve => {
        resolve("Highlight Closest Organism Complete");
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
    await sleep(1000);

    // highlight all
    await fadeInMothers(parents);
    await fadeInFathers(parents);
    await fadeInNotChosen();
    await sleep(1000); 

    // fade out all
    await fadeToBlackText();
    await fadeToOriginal(parents, 'both');
    await fadeToBlack(organisms);
    await sleep(1000);

    return new Promise(resolve => {
        resolve("Highlight Chosen Parents Animation Complete");
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

// Crossover Phase
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

// Mutation Phase
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
                var mutation_rate_text = `Mutation Rate: ${(MUTATION_RATE * 100).toFixed(2)}%`.toString();

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
                var mutation_rate_text = `Mutation Rate: ${(MUTATION_RATE * 100).toFixed(2)}%`.toString();

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

// Generation Summary & Create New Generation
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

// Success/Fail
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

function fadeInExtinctionMessage() {
    var finished = false;
    var opacity = 0.00;
    return new Promise(resolve => {
        function extinctMessageFadeIn() {
            if (!finished) {
                // clears
                ctx.fillStyle = 'black';

                ctx.font = '50px arial';
                ctx.fillText("Simulation Failed", 310, 250);

                ctx.font = "30px arial";
                ctx.fillText("Your species of organisms has gone extinct.", 225, 350);

                ctx.font = '22px arial';
                ctx.fillText("Press 'Q' to exit the simulation.", 350, 425);

                // animations
                ctx.font = '50px arial';
                ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
                ctx.fillText("Simulation Failed", 310, 250);

                ctx.font = "22px arial";
                ctx.fillText("Press 'Q' to exit the simulation.", 350, 425);

                ctx.font = "30px arial";
                ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
                ctx.fillText("Your species of organisms has gone extinct.", 225, 350);

                if (opacity >= 1.00) {
                    finished = true;
                }
                else {
                    opacity += 0.05;
                }
                frame_id = requestAnimationFrame(extinctMessageFadeIn);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve();
            }
        }
        start_extinction_fadein = requestAnimationFrame(extinctMessageFadeIn);
    })
}

// *** Settings ***
function displaySettingsForm() {
    // ensure only settings button showing
    var settings_btn = document.getElementsByClassName("settings-btn")[0];
    var start_btn = document.getElementsByClassName("start-btn")[0];
    var stop_btn = document.getElementsByClassName("stop-btn")[0];
    var save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];

    settings_btn.style.display = 'block';
    start_btn.style.display = 'none';
    stop_btn.style.display = 'none';
    save_bounds_btn.style.display = 'none';

    // turn off canvas, turn on settings
    var canvas_container = document.getElementsByClassName("canvas-container")[0];
    var settings_container = document.getElementsByClassName("settings-container")[0];

    canvas_container.style.display = 'none';
    settings_container.style.display = 'block';

    // boundaries
    // listen for boundary checkbox to trigger enterBoundaryCreationMode()
    var boundary_setting = document.getElementById("boundary-checkbox");
    boundary_setting.addEventListener("change", function() {
        if (this.checked) {
            enterBoundaryCreationMode();
        }
        else {
            console.log("Checkbox: unchecked");

            // should remove custom_boundary so sim doesn't think there is one
            custom_boundary = null;
        }
    });

    // movement setting helper (move/abstract)
    var movement_speed_setting = document.getElementById("move-speed");
    var error_message = document.getElementsByClassName("error-message")[0];

    movement_speed_setting.addEventListener('focusin', function() {
        error_message.style.color = "var(--closest_organism_gold)";
        error_message.innerHTML = "Movement Speed Range: 1 - 7";
        movement_speed_setting.addEventListener('focusout', function() {
            error_message.style.color = 'var(--mother-pink)';
            error_message.innerHTML = "";
        })
    })

    movement_speed_setting.addEventListener('keydown', function(event) {
        // function blocks keystrokes not within the acceptable range for movement speed
        var keystroke = preValidateMovementSetting(event);
        if (keystroke === 1) {
            event.preventDefault();
        }
    });

}

// should stop title screen animation when settings is called
function validateSettingsForm() {

    var error_message = document.getElementsByClassName("error-message")[0];

    // clear error message on call
    error_message.style.color = "var(--mother-pink)";
    error_message.innerHTML = "";

    var settings_manager = {};

    // returns error message or "valid"
    settings_manager['organisms_setting'] = validateTotalOrganismsSetting();
    settings_manager['movement_setting'] = validateMovementSetting();
    settings_manager['gene_setting'] = validateGeneCountSetting();
    settings_manager['mutation_setting'] = validateMutationRateSetting();

    // should make value red too, and change to green on keystroke
    for (let message in settings_manager) {
        if (settings_manager[message] != "valid") {
            error_message.innerHTML = settings_manager[message];
            return false;
        }
    }

    // dialogue
    var dialogue_setting = document.getElementById("dialogue-checkbox");
    if (dialogue_setting.checked) {
        dialogue = true;
    }
    else {
        dialogue = false;
    }

    // returns to title screen
    finishApplyingSettings();

    // restart animation
    playTitleScreenAnimation();

    // don't submit the form
    return false;
}

function validateTotalOrganismsSetting() {
    var total_organisms_setting = document.getElementById("total-organisms");

    if (typeof parseInt(total_organisms_setting.value) === 'number' && parseInt(total_organisms_setting.value) > 0) {
        if (parseInt(total_organisms_setting.value > 9999)) {
            TOTAL_ORGANISMS = 9999;
        }
        else {
            TOTAL_ORGANISMS = Math.abs(parseInt(total_organisms_setting.value));
        }
        total_organisms_setting.style.borderBottom = '2px solid var(--custom-green)';
        return 'valid';
    }
    else {
        total_organisms_setting.style.borderBottom = '2px solid var(--mother-pink)';
        return '* Invalid number of organisms. Please input a positive number.';
    }
}

function validateGeneCountSetting() {
    var gene_count_setting = document.getElementById("gene-count");

    if (typeof parseInt(gene_count_setting.value) === 'number' && parseInt(gene_count_setting.value) > 0) {
        if (parseInt(gene_count_setting.value) > 1000) {
            GENE_COUNT = 1000;
        }
        else {
            GENE_COUNT = Math.abs(parseInt(gene_count_setting.value));
        }
        gene_count_setting.style.borderBottom = '2px solid var(--custom-green)';
        return "valid";
    }
    else {
        gene_count_setting.style.borderBottom = '2px solid var(--mother-pink)';
        return "* Invalid gene count. Please input a positive number.";
    }
}

function validateMutationRateSetting() {
    var mutation_rate_setting = document.getElementById("mutation-rate");

    // consider allowing float here
    if (typeof parseInt(mutation_rate_setting.value) === 'number' && parseInt(mutation_rate_setting.value) > 0) {
        if (parseInt(mutation_rate_setting.value) > 100) {
            MUTATION_RATE = 1;
        }
        else {
            MUTATION_RATE = parseInt(mutation_rate_setting.value) / 100;
            console.log("MUT RATE: " + MUTATION_RATE);
        }
        mutation_rate_setting.style.borderBottom = '2px solid var(--custom-green)';
        return "valid";
    }
    else {
        mutation_rate_setting.style.borderBottom = '2px solid var(--mother-pink)';
        return "Invalid mutation rate. Please input a positive percentage value. (3 = 3%)";
    }
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

function validateMovementSetting() {
    var movement_speed_setting = document.getElementById("move-speed");

    // create max and min genes from movement speed
    // pre-validated in preValidateMovementSetting();
    if (parseInt(movement_speed_setting.value) > 0 && parseInt(movement_speed_setting.value) <= 7) {
        MIN_GENE = parseInt(movement_speed_setting.value) * -1;
        MAX_GENE = parseInt(movement_speed_setting.value);
        movement_speed_setting.style.borderBottom = "2px solid var(--custom-green)";
        return "valid";
    } 
    else {
        movement_speed_setting.style.borderBottom = '2px solid var(--mother-pink)';
        return "Invalid movement speed. Please input a positive number between 1 - 7.";
    }   
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

// Utilities
function sleep(milliseconds) {
    console.log(`Sleeping for ${(milliseconds / 1000)} second(s).`);
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } 
    while (currentDate - date < milliseconds);
    return new Promise((resolve, reject) => {
        resolve();
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

// TESTING BOUNDARIES ==============================================================

// could make class method
function drawBoundaryBoilerplate() {
    // ** DRAW BOUNDARY BOILERPLATE

    // clear canvas
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw start/end points of boundary (make helper function later (drawBoundaryBoilerplate()))
    // top
    ctx.fillStyle = 'red';
    ctx.fillRect(830, 0, 20, 50);
    ctx.fillRect(950, 150, 50, 20);
    // bottom
    ctx.fillStyle = 'red';
    ctx.fillRect(0, 430, 50, 20);
    ctx.fillRect(150, 550, 20, 50);
    // placeholder goal
    var placeholder_goal = new Goal(925, 50, 20, ctx);
    placeholder_goal.drawGoal();

    // we should also highlight the areas that users cannot draw in (2 rects to create border effect)
    ctx.fillStyle = 'rgb(148, 0, 211)';
    // stats border rect
    ctx.fillRect(736, 508, 272, 92);
    // phase border rect
    ctx.fillRect(0, 0, 252, 157);

    ctx.fillStyle = 'black';
    // stats area (will need to erase when sim starts)
    ctx.fillRect(740, 512, 270, 90);
    // phase area
    ctx.fillRect(0, 0, 248, 153);
    // ** END BOUNDARY BOILERPLATE **
}

// would belong to class Paintbrush, not Boundary
function updateMousePosition(event) {
    let rect = canvas.getBoundingClientRect(); // do i want to call this every time? ||| do I need to pass canvas here?

    // store current mouse position
    coordinates['x'] = event.clientX - rect.left;
    coordinates['y'] = event.clientY - rect.top;

    // console.log(coordinates);
}

// this function will be refactored/cleaned once proven working
// this code should either simply prepare the user for boundary mode, or perform all boundary drawing/validation
// think how this will be worked into the main flow
// could be:
// enterBoundaryCreationMode >>> applyBoundaryModeStyles >>> createBoundaries, but it's good enough for now
function enterBoundaryCreationMode() {


    // drawing flag and step tracker
    var allowed_to_draw = false; // could be method of Paintbrush
    var boundary_step = "bottom-boundary"; // could be attribute of Boundary? idk..

    // create new boundary
    var new_boundary = new Boundary();

    new_boundary.applyBoundaryModeStyles();

    // here and down would be in createBoundaries() (we would define boundary_step in createBoundaries()) ************************

    // belongs to class Painbrush, not Boundary
    function draw(event) {
        if (event.buttons !== 1 || !allowed_to_draw) {
            // return if left-mouse button not pressed or if user not allowed to draw
            return;
        }

        ctx.beginPath();
        ctx.moveTo(coordinates['x'], coordinates['y']);
        updateMousePosition(event);

        // draw different line depending on boundary_step
        if (boundary_step === 'full-boundary') {

            // get pixel color before drawing, reject if green
            pixel_data = getPixelXY(canvas_data_bad_practice, coordinates['x'], coordinates['y']);

            if (pixel_data[0] == 155) {
                // green touched, reject
                console.log("illegal white line. returning.");
                allowed_to_draw = false;

                // should erase white line (redraw everything except the white line)
                // this should be it's own function too (this same code is repeated in validateBoundaryConnection())
                // draw boilerplate and top&bottom boundaries
                drawBoundaryBoilerplate();
                ctx.drawImage(new_boundary.bottom_boundary, 0, 0, canvas.width, canvas.height);
                ctx.drawImage(new_boundary.top_boundary, 0, 0, canvas.width, canvas.height);

                // draw white dot
                ctx.fillStyle = 'white';
                ctx.beginPath();
                ctx.arc(80, 510, 10, 0, Math.PI*2, false);
                ctx.fill();

                // make goal new color (can be a flag in drawBoundaryBoilerplate())
                ctx.fillStyle = 'rgb(232, 0, 118)';
                ctx.fillRect(925, 50, 20, 20);
                
                return;
            }
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
        }
        else {
            ctx.strokeStyle = 'rgb(155, 245, 0)'; //green 
            ctx.lineWidth = 20;

            // store coordinates here while drawing boundaries
            if (boundary_step === 'bottom-boundary') {
                // save to bottom coords
                new_boundary.bottom_boundary_coords.push([coordinates['x'], coordinates['y']]);
            }
            else {
                // save to top coords
                new_boundary.top_boundary_coords.push([coordinates['x'], coordinates['y']]);
            }

        }

        ctx.lineCap = 'round';
        ctx.lineTo(coordinates['x'], coordinates['y']);
        ctx.stroke();
        ctx.closePath();
    }

    // will belong to class Paintbrush, not Boundary
    function requestDrawingPermission(event) {
        // this function is called on mousedown and will update the drawing flag that gives
        // users ability to draw if legal
        console.log("User would like to draw.");
        
        // need to grab coords since updateMousePosition() can't update function var anymore.
        // possible solution: global coordinates variable
        // trying that now.
        updateMousePosition(event);

        if (boundary_step === 'bottom-boundary') {
            // check that user is trying to draw from first connector (ctx.fillRect(150, 550, 20, 50))
            // make helper function eventually
            if (coordinates['x'] >= 150 && coordinates['x'] <= 170 && coordinates['y'] >= 550) {
                console.log("You clicked on the connector!");
                allowed_to_draw = true;
            }
            else {
                console.log("Not allowed to draw, mouse not on connector:");
                console.log(coordinates);
                allowed_to_draw = false;
            }
        }
        else if (boundary_step === 'top-boundary') {
            // check that user is trying to draw from the first connector (ctx.fillRect(0, 430, 50, 20))
            if (coordinates['x'] >= 0 && coordinates['x'] <= 50 && coordinates['y'] >= 430 && coordinates['y'] <= 450) {
                allowed_to_draw = true;
            }
            else {
                console.log("Not allowed to draw, mouse not on connector.");
                allowed_to_draw = false;
            }
        }
        // final step: draw line from spawn to goal
        else if (boundary_step === 'full-boundary') {
            // check that user is trying to draw from the white dot (ctx.arc(80, 510, 10, 0, Math.PI*2, false))
            if (coordinates['x'] >= 70 && coordinates['x'] <= 90 && 
                coordinates['y'] >= 500 && coordinates['y'] <= 520 ) {

                allowed_to_draw = true;
            }
            else {
                console.log("You missed the white dot...");
                allowed_to_draw = false;
            } 

        }
        else if (boundary_step === 'confirmation') {
            // don't allow user to draw in confirmation phase
            allowed_to_draw = false;
        }
    }

    // break this down into smaller function when all working
    // should this whole thing be a class method?
    function validateBoundaryConnection(event) {
        console.log("mouseup heard");
        // should make sure that the user was allowed to draw, otherwise return
        if (allowed_to_draw) {
            // check boundary step
            if (boundary_step === 'bottom-boundary') {
                let bottom_boundary_is_valid = new_boundary.validateBottom(event);

                if (bottom_boundary_is_valid) {
                    // update step and store boundary
                    new_boundary.save('bottom');
                    boundary_step = "top-boundary";
                }
                else {
                    // erase bottom-boundary coords when illegal line drawn
                    new_boundary.bottom_boundary_coords = [];

                    console.log("invalid");
                    // error message 
                }
            }
            else if (boundary_step === "top-boundary") {
                let top_boundary_is_valid = new_boundary.validateTop(event);

                if (top_boundary_is_valid) {
                    // update step and store boundary
                    // store top-boundary
                    new_boundary.save('top');
                    boundary_step = 'full-boundary';
                }
                else {
                    // reset top boundary coords when illegal line drawn
                    new_boundary.top_boundary_coords = [];

                    // error message
                }
            }
            else if (boundary_step === 'full-boundary') {
                // hereeeee
                let full_boundary_is_valid = new_boundary.validateFull();

                if (full_boundary_is_valid) {
                    // update step
                    boundary_step = 'confirmation';
                    allowed_to_draw = false;
                    
                    // make goal white to show success
                    ctx.fillStyle = 'white';
                    ctx.fillRect(925, 50, 20, 20);

                    // this is where the Apply/Save/Confirm button should become available
                    save_bounds_btn.style.backgroundColor = "var(--custom-green)";
                    save_bounds_btn.style.pointerEvents = 'auto';
                }
                else {
                    // error message

                    // erase line and return to last step
                    // draw boilerplate and top&bottom boundaries
                    drawBoundaryBoilerplate();
                    ctx.drawImage(new_boundary.top_boundary, 0, 0, canvas.width, canvas.height);
                }
            }
        }
        else {
            return;
        }
    }
    
    // respond to each event individually (pass event for mouse position)
    canvas.addEventListener('mouseenter', updateMousePosition);
    canvas.addEventListener('mousedown', requestDrawingPermission);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', validateBoundaryConnection);

    // make class method
    let save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];
    save_bounds_btn.addEventListener("click", function() {
        console.log("Saving Custom Boundaries");


        // ******
        // At this point, both top and bottom boundaries are drawn and connected
        // user has been given the option to Apply/Save their boundary and they clicked this button
        // When they click this, we should perform our full-boundary validation, then save

        // to validate, we should just make sure that our createCheckpoints() function worked, but we don't have that yet.


        // ============== makes sense to call new_boundary.createCheckpoints() here =====================
        // we will call it after saving for now, to see visuals better

        // save full boundary
        new_boundary.save('full');

        // still using custom_boundary global, I don't like it
        custom_boundary = new_boundary;

        // ===== this should be called before save method when complete =====
        new_boundary.createCheckpoints();

        // return to settings
        // displaySettingsForm(); turned off while testing checkpoints
    });
}

// =================================================================================