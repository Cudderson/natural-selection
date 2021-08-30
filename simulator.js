document.addEventListener("DOMContentLoaded", playTitleScreenAnimation);

import * as Drawings from "./modules/drawings.js";

// ===== vars =====

// ***** Begin Deconstructing simGlobals() *****

// - We want to have as few global variables as possible.

// - We will identify where each variable is needed, and implement it locally there
// -- one problem: drawings in module use some of these variables. This is a problem when we call paintbrush.fadeIn/Out(), where we cannot yet
//                 pass dynamic context to draw. The obvious solution seems to be to add functionality for paintbrush's fade functions to 
//                 accept additional drawing context. At first, I wanted to create a global object that held variables to draw, but this solution sounds better.
//                     - This way, variables will be more locally-scoped and trustworthy.

// ** Since almost everything is called from runSimulation/runGeneration, maybe passing the inital stats/settings variables to those functions would be enough
//    to keep track of them?

// ** Idea: maybe we package the settings vars globally, (or pass them to functions) and then reference them within runSim()/Gen() as more-local vars?

// ** Also worth noting that we might be able to grab the user-inputted settings from test.html at any time.

// [x] Give paintbrush ability to accept additional drawing context (maybe a dictionary?)
// [x] prove that content works with Drawings.drawSimulationSettings()
// - Let's test if the settings in test.html are always available
// [x] Test html settings are always available by grabbing them from html vs simGlobals in drawSimulationSettings()
// --committed--
// With sim settings available from html, we should be able to reference them at runSim()/runGen() as local variables
// [x] finish pre-sim animations with new 'content' ability

// ===== STARTING HERE =====

// rough flow:
// 1. before sim, set validated settings to global simSettings object
//      - Perhaps save additional globals such as FPS, sim_type, INITIAL_POS, etc.
// 2. if boundary, create Boundary object and store checkpoints, scale, etc
// 3. runGen()
// 4. when gen over, a resolve() happens, then runGen() is called again.
//    - What does the next runGeneration() call need?? (besides global settings)
//          - We will see.

// One thing is for sure: the next runGen() call needs the new population of organisms reproduced at the end of generation.
// Maybe runGen() could resolve with new organisms array, (average_fitness?) and possibly gen_count (if needed, could be global too)
// As long as we have our organisms array and original settings, we should be able to runGen() fully.

// settings can become 'const' after set!
// --settings module?

// ***** I forgot you can assign a subject to Paintbrush. *****

// We don't need to make organisms global.
// We will simply have our paintbrush global, and assign the paintbrush's subject as the organisms array before drawing! (yesyesyes)
// edge-case: some drawings don't use paintbrush to be drawn, but are just called directly.
//      - to combat this, we will have 2 options:
//          1. [] create basic Paintbrush draw()/paint() method that can use object's subject attribute to execute drawing function
//          2. [x] add 'content' param to drawings that don't use paintbrush that can be passed necessary vars

// does it make more sense to assign paintbrush 'subject', or to pass 'content' to the drawing functions?
// *** - It just seems less clean to pass extra params, so we should use Paintbrush.subject ***
// It may not be needed, and sometimes it might makes sense to just pass the array. We'll see.

// ===== Executing =====
// Goal: factor organisms array out of global object, and instead pass it to each runGen() call
// - We will be using the content parameter to pass necessary content to drawing functions, rather than paintbrush.subject


window.simGlobals = {};

// ** NOTE: We really only need to globalize vars that will be used in our modules. 
// The vars used in this file should be fine and not globalized

// *** Check box of variable when it is used by drawings.js

// starting coordinates for organisms and goal
simGlobals.INITIAL_X = 500; // [] 
simGlobals.INITIAL_Y = 500; // []
simGlobals.GOAL_X_POS = 500; // []
simGlobals.GOAL_Y_POS = 50; // []

// organism global default settings
simGlobals.TOTAL_ORGANISMS = 100; // [x] remember to update this var when new gen reproduced
simGlobals.GENE_COUNT = 250; // [x]
simGlobals.MUTATION_RATE = 0.03; // [x]
simGlobals.MIN_GENE = -5; // [x]
simGlobals.MAX_GENE = 5; // [x]
// for boundary sims
simGlobals.RESILIENCE = 1.00; // [x]
// starts at perfect resilience
simGlobals.dialogue = false; // [x]

// boundary simulations start organisms/goal at different location
simGlobals.INITIAL_X_BOUND = 50; // []
simGlobals.INITIAL_Y_BOUND = 550; // []
simGlobals.GOAL_X_POS_BOUNDS = 925; // []
simGlobals.GOAL_Y_POS_BOUNDS = 50; // []

// boundary globals
simGlobals.custom_boundary; // [x] (one drawing: drawBoundary())
simGlobals.scale_statistics; // [] // this is/should be only computed once (boundary doesn't change)

// flags
simGlobals.sim_type; // []
simGlobals.simulation_started = false; // []
simGlobals.simulation_succeeded = false; // []

// track total generations
simGlobals.generation_count = 0; // [x]

// generation statistics
simGlobals.average_fitness = 0.00; // [x]
// does this really need to be global?
simGlobals.total_fitness = 0.00; // []

// containers holding organisms and next-generation organisms
simGlobals.organisms = []; // [x]
simGlobals.deceased_organisms = []; // [x] make not global
simGlobals.offspring_organisms = []; // []

// canvas & drawing context
// reconsider how these are used
window.canvas = document.getElementById("main-canvas");
window.ctx = canvas.getContext("2d");

// testing background canvas for better performance
window.canvas2 = document.getElementById("background-canvas");
window.ctx2 = canvas2.getContext("2d");

// ********** name conflicts with canvas_data in updateAndMoveOrganismsBounds, need to fix
simGlobals.canvas_data_bad_practice = ctx.getImageData(0, 0, canvas.width, canvas.height); // []

// frame rate
simGlobals.FPS = 30; // []

// Stores the position of the cursor
simGlobals.coordinates = {'x':0 , 'y':0}; // []


// ===================
// ===== CLASSES =====
// ===================

class Organism {
    constructor (gender, x, y, ctx) {
        this.gender = gender;
        this.x = x;
        this.y = y;
        this.ctx = ctx; // not sure if needed (could be much faster with one ctx?)
        this.radius = 5; // always the same
        this.index = 0;
        this.genes = [];
        this.distance_to_goal; // for normal and boundary sim types
        this.distance_to_next_checkpoint; //for boundary sim type
        this.fitness;
        this.reached_goal = false;
        // for boundary animations
        this.is_alive = true;
    }

    setRandomGenes() {
        for (let i = 0; i < simGlobals.GENE_COUNT; i++) {
            var random_gene = getRandomGene(simGlobals.MIN_GENE, simGlobals.MAX_GENE);
            this.genes.push(random_gene);
        }
    }

    showGenes() {
        for (let i = 0; i < simGlobals.GENE_COUNT; i++) {
            console.log(this.genes[i]);
        }
    }

    update() {
        if (this.index < simGlobals.GENE_COUNT) {
            this.x += this.genes[this.index][0];
            this.y += this.genes[this.index][1];
            this.index++;
        }
    }

    // remove personal ctx declarations from class
    move() {
        ctx.fillStyle = 'rgba(148, 0, 211, 1)'; // darkviolet
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.fill();
    }

    calcDistanceToGoal() {
        // c**2 = a**2 + b**2
        let horizontal_distance_squared = (Math.abs(this.x - simGlobals.GOAL_X_POS)) ** 2;
        let vertical_distance_squared = (Math.abs(this.y - simGlobals.GOAL_Y_POS)) ** 2;

        let distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        let distance_to_goal = Math.sqrt(distance_to_goal_squared);

        this.distance_to_goal = distance_to_goal;

        return distance_to_goal;
    }

    calcDistanceToGoalBounds(remaining_distance) {
        this.distance_to_goal = this.distance_to_next_checkpoint + remaining_distance;
    }

    // should combine fitness functions when available
    calcFitness() {
        // height = distance between starting location(y) and goal.y
        let height = simGlobals.INITIAL_Y - simGlobals.GOAL_Y_POS;

        let normalized_distance_to_goal = this.distance_to_goal / height;
        this.fitness = 1 - normalized_distance_to_goal;
    }

    calcFitnessBounds(scale) {
        // ideally don't have to pass in scale here
        let normalized_distance_to_goal = this.distance_to_goal / scale;
        this.fitness = 1 - normalized_distance_to_goal;
    }
}

// doesn't need own ctx
class Goal {
    constructor(x, y, size, ctx) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.ctx = ctx;
    }

    // could convert final 2 class methods to new class Paintbrush ex. **
    drawGoal() {
        console.log("should only be called once (drawGoal())");
        ctx2.fillStyle = 'rgba(155, 245, 0, 1)';
        ctx2.fillRect(this.x, this.y, this.size, this.size);
    }

    // convert to drawings.js? why is the goal performing this?
    // this function is not good
    showStatistics() {
        console.log("this should only be called once (showStatistics())");
        simGlobals.average_fitness = Number(simGlobals.average_fitness).toFixed(2);
        let population_size = simGlobals.organisms.length;

        ctx2.fillStyle = 'rgba(155, 245, 0, 1)';
        ctx2.font = "22px arial";
        ctx2.fillText('Generation:', 740, 535);
        ctx2.fillText(simGlobals.generation_count.toString(), 940, 535);
        ctx2.fillText('Population Size:', 740, 560);
        ctx2.fillText(population_size.toString(), 940, 560);
        ctx2.fillText('Average Fitness:', 740, 585);
        ctx2.fillText(simGlobals.average_fitness.toString(), 940, 585);
    }
}

class Boundary {
    constructor() {
        this.top_boundary = new Image();
        this.bottom_boundary = new Image();
        this.full_boundary = new Image();
        this.top_boundary_coordinates = [];
        this.bottom_boundary_coordinates = [];
        // this.checkpoints = {'coordinates': [], 'size': null};
        this.checkpoints = []; // push dictionaries containing coordinates, halfway_point, distance_to_goal, and size
    }

    save(boundary_type) {
        
        var canvas = document.getElementById("main-canvas"); // do we need to declare these?
        var ctx = canvas.getContext('2d');

        // remove help text
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, 230, 150);
        ctx.fillRect(760, 450, 225, 200);

        if (boundary_type === 'bottom') {
            console.log("saving bottom-boundary");
            this.bottom_boundary.src = canvas.toDataURL("image/png");
        }
        else if (boundary_type === 'top') {
            console.log("saving top boundary");
            this.top_boundary.src = canvas.toDataURL("image/png");
        }
        else if (boundary_type === 'full') {
            // save full
            console.log("saving full boundary");
            Drawings.drawBoundaryBoilerplate();

            ctx.drawImage(this.top_boundary, 0, 0, canvas.width, canvas.height);

            Drawings.eraseIllegalDrawingZones();
    
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
        if (simGlobals.coordinates['x'] >= 950 && simGlobals.coordinates['y'] >= 150 && simGlobals.coordinates['y'] <= 200) {
            // valid, update boundary step
            console.log("valid boundary");

            // make connectors green (maybe draw this after returns true)
            ctx.fillStyle = 'rgb(155, 245, 0)';
            ctx.fillRect(950, 150, 50, 20);
            ctx.fillRect(150, 550, 20, 50);

            return true;
        }
        else {
            // invalid
            console.log("Invalid boundary.");

            // error message (not written yet);
            return false;
        }   
    }

    validateTop(event) {
        console.log("validating top-boundary...");

        updateMousePosition(event);

        // check if boundary on endpoint
        // endpoint: (ctx.fillRect(830, 0, 20, 50))
        if (simGlobals.coordinates['x'] >= 830 && simGlobals.coordinates['x'] <= 850 && simGlobals.coordinates['y'] <= 50) {
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

            // update canvas data (not sure if I need to do this)
            canvas = document.getElementById("main-canvas");
            ctx = canvas.getContext("2d");
            simGlobals.canvas_data_bad_practice = ctx.getImageData(0, 0, canvas.width, canvas.height);

            return true;
        }
        else {
            // invalid
            console.log("Invalid boundary.");

            // error message (not written yet)
            return false;
        }
    }

    validateFull() {
        // check if user ended line on goal
        // Goal(925, 50, 20, ctx);
        if (simGlobals.coordinates['x'] >= 925 && simGlobals.coordinates['x'] <= 945 &&
            simGlobals.coordinates['y'] >= 50 && simGlobals.coordinates['y'] <= 70) {

            return true;
        }
        else {
            return false;
        }
    }

    determineLongestBoundary() {
        // determine which boundary has more coordinates
        let longest_text;
        let longest_boundary;
        let target_length;

        if (this.top_boundary_coordinates.length > this.bottom_boundary_coordinates.length) {
            // top longer
            longest_text = 'top';
            longest_boundary = this.top_boundary_coordinates;
            target_length = this.bottom_boundary_coordinates.length;
        }
        else if (this.bottom_boundary_coordinates.length > this.top_boundary_coordinates.length) {
            // bottom longer
            longest_text = 'bottom';
            longest_boundary = this.bottom_boundary_coordinates;
            target_length = this.top_boundary_coordinates.length;
        }
        else {
            longest_text = 'neither';
        }

        return [longest_text, longest_boundary, target_length];
    }

    trimLongestBoundaryCoordinates(longest_boundary_coordinates, target_length) {
        let num_coords_to_remove = longest_boundary_coordinates.length - target_length;
        let percent_of_coords_to_remove = num_coords_to_remove / longest_boundary_coordinates.length;
        let coords_removed = 0;
        let coords_kept = 0;
        let random_percentage;

        console.log(`# of coordinates we need to remove: ${num_coords_to_remove}`);
        console.log(`which is ${percent_of_coords_to_remove}% of ${longest_boundary_coordinates.length}`);

        console.log(`Starting loop`);

        // since splicing changes array size, preserve the length here so that we can evaluate all coordinates
        let preserved_longest_length = longest_boundary_coordinates.length;

        for (let i = 0; i < preserved_longest_length; i++) {
            random_percentage = Math.random();

            if (random_percentage < percent_of_coords_to_remove) {
                // remove
                console.log(`removed coordinate ${i}: ${random_percentage}`);

                // need to remember the amount coords_removed so that we remove the correct coord from the changing array
                longest_boundary_coordinates.splice((i - coords_removed), 1);
                coords_removed++;
            }
            else {
                console.log(`kept coordinate ${i}: ${random_percentage}`);
                coords_kept++;
            }

            if (longest_boundary_coordinates.length === target_length) {
                console.log("BREAKING");
                break;
            }
        }

        console.log("Loop finished.");
        console.log("Total coordinates removed: " + coords_removed);
        console.log(`Total coordinates kept: ${coords_kept}`);

        console.log(`% coordinates removed (desired): ${percent_of_coords_to_remove}`);
        console.log(`% coordinates removed (actual): ${coords_removed / preserved_longest_length}`);

        console.log(`Longest boundary new size: ${longest_boundary_coordinates.length}`);
        console.log(`Target Length (length of shortest boundary): ${target_length}`);

        // at this point, the longest_coordinate set is either the same size as the shortest, or slightly larger
        // let's trim off the extra if there is any
        if (longest_boundary_coordinates.length !== target_length) {
            console.log("Trimming extra coordinates")
            do {
                // remove a random coordinate
                let coordinate_to_remove = Math.floor(Math.random() * longest_boundary_coordinates.length);
                longest_boundary_coordinates.splice(coordinate_to_remove, 1);
            }
            while (longest_boundary_coordinates.length !== target_length);
        }

        console.log("We should now have to coordinate sets of the same length");
        console.log(`Longest Boundary Length: ${longest_boundary_coordinates.length}`);
        console.log(`Shortest Boundary Length: ${target_length}`);

        return longest_boundary_coordinates;
    }

    prepareBoundaryForCheckpoints() {
        console.log("preparing boundary for checkpoints...");

        // console.log(`Coordinates for Bottom Boundary: `);
        // // this allows us to view coords as 2d arrays
        // for (let k = 0; k < this.bottom_boundary_coordinates.length; k++) {
        //     console.log(this.bottom_boundary_coordinates[k]);
        // }

        console.log("Initial Boundary Lengths:");
        console.log(`bottom: ${this.bottom_boundary_coordinates.length}, top: ${this.top_boundary_coordinates.length}`);

        // Identify longest boundary for trimming (target_length = length of shortest boundary)
        let longest_boundary_and_target = this.determineLongestBoundary();

        let longest_text = longest_boundary_and_target[0];
        let longest_boundary_coordinates = longest_boundary_and_target[1];
        let target_length = longest_boundary_and_target[2];

        // execute if boundary coordinate array lengths are not same size
        if (longest_text !== 'neither') {

            // trim longest boundary coordiantes to length of shortest boundary coordinates
            let trimmed_coordinates = this.trimLongestBoundaryCoordinates(longest_boundary_coordinates, target_length);

            // save trimmed coordinates to boundary
            if (longest_text === 'top') {
                //save top
                this.top_boundary_coordinates = trimmed_coordinates;
            }
            else if (longest_text === 'bottom') {
                //save bottom
                this.bottom_boundary_coordinates = trimmed_coordinates;
            }
        }
    }

    // too long, needs refactoring once all put together
    createCheckpoints() {
        // step 1: loop over all coordinates in both arrays
        ctx.fillStyle = 'white';
        ctx.strokeWidth = 1;
        ctx.lineCap = 'round';
        let step = Math.ceil(this.top_boundary_coordinates.length / 10);
        let line_counter = 0;

        for (let i = 0; i < this.top_boundary_coordinates.length; i++) {
            // step 2: draw a line from top[coordinate] to bottom[coordinate]
            // let's say, for now, that we want just 10 lines drawn
            // we could divide the total by 10, 243 / 10 = 24.3
            // if i % Math.ceil(24.3) === 0: draw line
            if (i % step === 0) {
                // * keep drawings just in case *
                // ctx.beginPath();
                // ctx.moveTo(this.top_boundary_coordinates[i][0], this.top_boundary_coordinates[i][1])
                // ctx.lineTo(this.bottom_boundary_coordinates[i][0], this.bottom_boundary_coordinates[i][1]);
                // ctx.stroke();
                // ctx.closePath();
                line_counter++;

                // draw dot on middle of each line (distance between x's - distance between y's)
                let mid_x = Math.floor((this.top_boundary_coordinates[i][0] + this.bottom_boundary_coordinates[i][0]) / 2); 
                let mid_y = Math.floor((this.top_boundary_coordinates[i][1] + this.bottom_boundary_coordinates[i][1]) / 2);

                // * keep drawings just in case *
                // ctx.beginPath();
                // ctx.arc(mid_x, mid_y, 2, 0, Math.PI*2, false);
                // ctx.fill();

                // store checkpoint coordinates
                this.checkpoints.push({'coordinates': [mid_x, mid_y]});
            }
        }

        // console.log("Line drawing complete");
        // console.log(`Should be 10 lines: ${line_counter}`);


        // *** improving checkpoints ***
        // we also want to store some information about a checkpoint's size, so drawing will require no extra calculations
        // Ultimately, we just want a checkpoint to cover the largest calulable area on the path without overlapping another.

        // step 1: draw line connecting each checkpoint (we can maybe do in within loop after working)
        for (let i = 0; i < this.checkpoints.length - 1; i++) {
            // * keep drawings just in case *
            // ctx.beginPath();
            // ctx.moveTo(this.checkpoints[j].coordinates[0], this.checkpoints[j].coordinates[1]);
            // ctx.lineTo(this.checkpoints[j+1].coordinates[0], this.checkpoints[j+1].coordinates[1]);
            // ctx.stroke();
            // ctx.closePath();

            // let's now mark the halfway point between each line drawn
            let path_mid_x = Math.floor((this.checkpoints[i].coordinates[0] + this.checkpoints[i+1].coordinates[0]) / 2);
            let path_mid_y = Math.floor((this.checkpoints[i].coordinates[1] + this.checkpoints[i+1].coordinates[1]) / 2);

            // * keep drawings just in case *
            // ctx.fillStyle = 'orange';
            // ctx.beginPath();
            // ctx.arc(path_mid_x, path_mid_y, 5, 0, Math.PI*2, false);
            // ctx.fill();
            // ctx.closePath();

            // store checkpoint's halfway point to the next checkpoint as 'halfway_point': [x, y]
            this.checkpoints[i].halfway_point = [path_mid_x, path_mid_y];
        }

        // determine size using halfway points (loop from 1 to 8 (skips first and last checkpoint))
        for (let i = 1; i < this.checkpoints.length - 1; i++) {
            // determine length from checkpoint to previous checkpoints halfway point
            let current_location = this.checkpoints[i].coordinates;
            let previous_halfway_point = this.checkpoints[i-1].halfway_point;

            // c^2 = a^2 + b^2
            let distance_to_previous_halfway_point_squared = (
                (current_location[0] - previous_halfway_point[0]) ** 2) + ((current_location[1] - previous_halfway_point[1]) ** 2
            );
            let distance_to_previous_halfway_point = Math.sqrt(distance_to_previous_halfway_point_squared);


            // now determine distance to OWN halfway point
            let own_halfway_point = this.checkpoints[i].halfway_point;

            // c^2 = a^2 + b^2
            let distance_to_own_halfway_point_squared = (
                (current_location[0] - own_halfway_point[0]) ** 2) + ((current_location[1] - own_halfway_point[1]) ** 2
            );
            let distance_to_own_halfway_point = Math.sqrt(distance_to_own_halfway_point_squared);

            // determine shortest distance and store as size
            if (distance_to_previous_halfway_point < distance_to_own_halfway_point) {
                console.log(`For checkpoint ${i}, the distance to PREVIOUS halfway point is shortest.`);
                console.log(`previous: ${distance_to_previous_halfway_point}`);
                console.log(`own: ${distance_to_own_halfway_point}`);

                this.checkpoints[i].size = Math.floor(distance_to_previous_halfway_point);
            }
            else {
                console.log(`For checkpoint ${i}, the distance to OWN halfway point is shortest.`);
                console.log(`previous: ${distance_to_previous_halfway_point}`);
                console.log(`own: ${distance_to_own_halfway_point}`);

                this.checkpoints[i].size = Math.floor(distance_to_own_halfway_point);
            }

            // this is all working. checkpoint[0] doesn't check for previous halfway point, and checkpoint[9] doesn't check for own!
        }

        // console.log('num of checkpoints: (if 10, code should work)');
        // console.log(this.checkpoints.length);

        // maybe we remove first/last checkpoints at this stage??
        // for now, let's just assign them arbitrary sizes
        this.checkpoints[0].size = 20;
        this.checkpoints[this.checkpoints.length - 1].size = 20;

        // to confirm, display sizes for each checkpoint
        for (let i = 0; i < this.checkpoints.length; i++) {
            console.log(`Size of checkpoint ${i}: ${this.checkpoints[i].size}`);
            console.log(`coords of checkpoint: ${this.checkpoints[i].coordinates}`);
        }

        // complete! checkpoints can be drawn with appropriate sizes now.
    }

    drawCheckpoints() {
        // === Draw Checkpoints ===
        for (let i = 0; i < this.checkpoints.length; i++) {
            ctx.beginPath();
            ctx.arc(this.checkpoints[i].coordinates[0], this.checkpoints[i].coordinates[1], this.checkpoints[i].size, 0, Math.PI*2, false);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

// rename to FadingTool ?
// accepts drawing functions and uses opacity to create fade effects
class Paintbrush {
    constructor(canvas, ctx) {
        // even these may not be needed
        this.canvas = canvas;
        this.ctx = ctx;
        // subject or context for the paintbrush to draw (can basically be anything)
        this.subject = null; 
    }

    fadeIn(drawing_function, step, content=null) {
        return new Promise(resolve => {
            let finished = false;
            let opacity = 0.00;
            let frame_id;
            function drawFrame() {
                if (!finished) {
                    // animate

                    // think of better name than drawing_function
                    drawing_function(opacity, content);
                    
                    if (opacity >= 1.00) {
                        finished = true;
                    }
                    else {
                        opacity += step;
                    }

                    frame_id = requestAnimationFrame(drawFrame);
                }
                else {
                    // resolve
                    cancelAnimationFrame(frame_id);
                    resolve();
                }
            }
            requestAnimationFrame(drawFrame);
        }) 
    }

    fadeOut(drawing_function, step, content=null) {
        return new Promise(resolve => {
            let finished = false;
            let opacity = 1.00;
            let frame_id;
            function drawFrame() {
                if (!finished) {
                    // animate

                    // think of better name than drawing_function
                    drawing_function(opacity, content);
                    
                    if (opacity <= 0.00) {
                        finished = true;
                    }
                    else {
                        opacity -= step;
                    }
                    frame_id = requestAnimationFrame(drawFrame);
                }
                else {
                    // resolve
                    cancelAnimationFrame(frame_id);
                    resolve();
                }
            }
            requestAnimationFrame(drawFrame);
        })
    }

    // not adding 'content' here yet until necessary
    // accepts a drawing_function with 2 opacities (old color & new color)
    fadeToNewColor(drawing_function, step) {
        return new Promise(resolve => {
            let finished = false;
            let opacity = 0.00;
            let old_opacity = 1.00;
            let frame_id;

            function drawFrame() {
                if (!finished) {
                    // animate

                    // think of better name than drawing_function
                    drawing_function(opacity, old_opacity);
                    
                    if (opacity >= 1.00) {
                        finished = true;
                    }
                    else {
                        opacity += step;
                        old_opacity -= step;
                    }

                    frame_id = requestAnimationFrame(drawFrame);
                }
                else {
                    // resolve
                    cancelAnimationFrame(frame_id);
                    resolve();
                }
            }
            requestAnimationFrame(drawFrame);
        }) 
    }
}

// =======================
// ===== SETTINGS =====
// =======================

function displaySettingsForm() {

    // ensure only settings button showing
    document.getElementsByClassName("settings-btn")[0].style.display = 'block';
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("stop-btn")[0].style.display = 'none';
    document.getElementsByClassName("save-boundaries-btn")[0].style.display = 'none';

    // turn off canvas, turn on settings
    document.getElementsByClassName("canvas-container")[0].style.display = 'none';
    document.getElementsByClassName("settings-container")[0].style.display = 'block';

    if (simGlobals.sim_type === 'classic') {
        // display classic settings (no death/resilience)
        document.getElementsByClassName("resilience-setting-label")[0].style.display = 'none';
        document.getElementsByClassName("resilience-input")[0].style.display = 'none';
    }

    // movement setting helper (move/abstract)
    let movement_speed_setting = document.getElementById("move-speed");
    let error_message = document.getElementsByClassName("error-message")[0];

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
        let keystroke = preValidateMovementSetting(event);
        if (keystroke === 1) {
            event.preventDefault();
        }
    });

    // turn on listener for apply button
    document.getElementById("apply-form").addEventListener('submit', function submitForm(event) {
        // don't submit form
        event.preventDefault();
    
        validateSettingsForm();
    });

}

// [] should stop title screen animation when settings is called
function validateSettingsForm() {

    let error_message = document.getElementsByClassName("error-message")[0];

    // clear error message on call
    error_message.style.color = "var(--mother-pink)";
    error_message.innerHTML = "";

    let settings_manager = {};

    // returns error message or "valid"
    settings_manager['organisms_setting'] = validateTotalOrganismsSetting();
    settings_manager['movement_setting'] = validateMovementSetting();
    settings_manager['gene_setting'] = validateGeneCountSetting();
    settings_manager['mutation_setting'] = validateMutationRateSetting();
    settings_manager['resilience_setting'] = validateResilienceSetting();

    // should make value red too, and change to green on keystroke
    for (let message in settings_manager) {
        if (settings_manager[message] != "valid") {
            error_message.innerHTML = settings_manager[message];
            return false;
        }
    }

    // dialogue
    let dialogue_setting = document.getElementById("dialogue-checkbox");
    if (dialogue_setting.checked) {
        simGlobals.dialogue = true;
    }
    else {
        simGlobals.dialogue = false;
    }

    // turns off settings form, turns on canvas and run-btn + listener
    finishApplyingSettings();

    // restart animation ===
    // here, we should instead bring user to a screen that tells them their simulation is
    // ready to run, and present a button/cue to begin simulation

    // playTitleScreenAnimation();
    Drawings.prepareToRunSimulation();

    // don't submit the form
    return false;
}

function validateTotalOrganismsSetting() {
    let total_organisms_setting = document.getElementById("total-organisms");

    if (typeof parseInt(total_organisms_setting.value) === 'number' && parseInt(total_organisms_setting.value) > 0) {
        if (parseInt(total_organisms_setting.value > 9999)) {
            simGlobals.TOTAL_ORGANISMS = 9999;
        }
        else {
            simGlobals.TOTAL_ORGANISMS = Math.abs(parseInt(total_organisms_setting.value));
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
    let gene_count_setting = document.getElementById("gene-count");

    if (typeof parseInt(gene_count_setting.value) === 'number' && parseInt(gene_count_setting.value) > 0) {
        if (parseInt(gene_count_setting.value) > 1000) {
            simGlobals.GENE_COUNT = 1000;
        }
        else {
            simGlobals.GENE_COUNT = Math.abs(parseInt(gene_count_setting.value));
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
    let mutation_rate_setting = document.getElementById("mutation-rate");

    // consider allowing float here
    if (typeof parseInt(mutation_rate_setting.value) === 'number' && parseInt(mutation_rate_setting.value) > 0) {
        if (parseInt(mutation_rate_setting.value) > 100) {
            simGlobals.MUTATION_RATE = 1;
        }
        else {
            simGlobals.MUTATION_RATE = parseInt(mutation_rate_setting.value) / 100;
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
    let movement_key = event.key;
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
    let movement_speed_setting = document.getElementById("move-speed");

    // create max and min genes from movement speed
    // pre-validated in preValidateMovementSetting();
    if (parseInt(movement_speed_setting.value) > 0 && parseInt(movement_speed_setting.value) <= 7) {
        simGlobals.MIN_GENE = parseInt(movement_speed_setting.value) * -1;
        simGlobals.MAX_GENE = parseInt(movement_speed_setting.value);
        movement_speed_setting.style.borderBottom = "2px solid var(--custom-green)";
        return "valid";
    } 
    else {
        movement_speed_setting.style.borderBottom = '2px solid var(--mother-pink)';
        return "Invalid movement speed. Please input a positive number between 1 - 7.";
    }   
}

function validateResilienceSetting() {
    // we want to only allow numbers from 0 - 100 inclusive

    let resilience_setting = document.getElementById("resilience");

    if (parseInt(resilience_setting.value) >= 0 && parseInt(resilience_setting.value) <= 100 && typeof parseInt(resilience_setting.value) === 'number') {
        simGlobals.RESILIENCE = parseInt(resilience_setting.value) / 100;
        resilience_setting.style.borderBottom = "2px solid var(--custom-green)";
        return "valid";
    } 
    else {
        resilience_setting.style.borderBottom = '2px solid var(--mother-pink)';
        return "Invalid resilience value. Please input a positive number between 0 - 100";
    } 
}

// needs better name
function finishApplyingSettings() {
    // make html changes before function returns
    document.getElementsByClassName("canvas-container")[0].style.display = 'block';
    document.getElementsByClassName("settings-container")[0].style.display = 'none';

    let start_btn = document.getElementsByClassName("run-btn")[0];
    start_btn.style.display = 'block';

    // allow btn-click to runSimulation()
    start_btn.addEventListener("click", runSimulation);

    return 0;
}

// ====================
// ===== BOUNDARY =====
// ====================

function applyBoundaryModeStyles() {
    // turn off settings, turn on canvas
    document.getElementsByClassName("canvas-container")[0].style.display = 'block';
    document.getElementsByClassName("settings-container")[0].style.display = 'none';

    Drawings.drawBoundaryBoilerplate();

    // hide buttons
    document.getElementsByClassName("settings-btn")[0].style.display = 'none';
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-classic")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-boundary")[0].style.display = 'none';

    let stop_btn = document.getElementsByClassName("stop-btn")[0];

    stop_btn.style.gridColumn = "1 / 2";
    stop_btn.style.width = "75%";
    stop_btn.innerHTML = "Back";
    stop_btn.style.display = "block";
}

// this function must remain outside closure, as Boundary calls it (unless boundary creation mode becomes a class method?)
// also rethink rect variable here
function updateMousePosition(event) {
    let rect = canvas.getBoundingClientRect(); // do i want to call this every time? ||| do I need to pass canvas here?

    // store current mouse position
    simGlobals.coordinates['x'] = Math.floor(event.clientX - rect.left);
    simGlobals.coordinates['y'] = Math.floor(event.clientY - rect.top);
}

// this function will be refactored/cleaned
// it's not super bad, just need to decide how functions will be handled
// not converting var >> let here yet
function enterBoundaryCreationMode() {

    // drawing flag and step tracker
    var allowed_to_draw = false; // could be method of Paintbrush
    var boundary_step = "bottom-boundary"; // could be attribute of Boundary? idk..

    // create new boundary
    var new_boundary = new Boundary();

    // this function name doesn't fit well anymore, rename
    applyBoundaryModeStyles();

    Drawings.drawBoundaryDrawingHelpText("Step 1");

    function draw(event) {
        if (event.buttons !== 1 || !allowed_to_draw) {
            // return if left-mouse button not pressed or if user not allowed to draw
            return;
        }

        ctx.beginPath();
        ctx.moveTo(simGlobals.coordinates['x'], simGlobals.coordinates['y']);
        updateMousePosition(event);

        // draw different line depending on boundary_step
        if (boundary_step === 'full-boundary') {

            // get pixel color before drawing, reject if green
            let pixel_data = getPixelXY(simGlobals.canvas_data_bad_practice, simGlobals.coordinates['x'], simGlobals.coordinates['y']);

            if (pixel_data[0] == 155) {
                // green touched, reject
                allowed_to_draw = false;
                
                // reset step
                Drawings.drawBoundaryValidationScreen(new_boundary.top_boundary);
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
                new_boundary.bottom_boundary_coordinates.push([simGlobals.coordinates['x'], simGlobals.coordinates['y']]);
            }
            else {
                // save to top coords
                new_boundary.top_boundary_coordinates.push([simGlobals.coordinates['x'], simGlobals.coordinates['y']]);
            }

        }

        ctx.lineCap = 'round';
        ctx.lineTo(simGlobals.coordinates['x'], simGlobals.coordinates['y']);
        ctx.stroke();
        ctx.closePath();
    }

    function requestDrawingPermission(event) {
        // this function is called on mousedown and will update the drawing flag that gives
        // users ability to draw if legal
        console.log("User would like to draw.");
        
        updateMousePosition(event);

        if (boundary_step === 'bottom-boundary') {
            // check that user is trying to draw from first connector (ctx.fillRect(150, 550, 20, 50))
            // make helper function eventually
            if (simGlobals.coordinates['x'] >= 150 && simGlobals.coordinates['x'] <= 170 && simGlobals.coordinates['y'] >= 550) {
                console.log("You clicked on the connector!");
                allowed_to_draw = true;
            }
            else {
                console.log("Not allowed to draw, mouse not on connector:");
                console.log(simGlobals.coordinates);
                allowed_to_draw = false;
            }
        }
        else if (boundary_step === 'top-boundary') {
            // check that user is trying to draw from the first connector (ctx.fillRect(0, 430, 50, 20))
            if (simGlobals.coordinates['x'] >= 0 && simGlobals.coordinates['x'] <= 50 && simGlobals.coordinates['y'] >= 430 && simGlobals.coordinates['y'] <= 450) {
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
            if (simGlobals.coordinates['x'] >= 70 && simGlobals.coordinates['x'] <= 90 && 
                simGlobals.coordinates['y'] >= 500 && simGlobals.coordinates['y'] <= 520 ) {

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
            if (boundary_step === 'bottom-boundary') {
                let bottom_boundary_is_valid = new_boundary.validateBottom(event);

                // could make own function for this condition
                if (bottom_boundary_is_valid) {
                    // update step and store boundary
                    new_boundary.save('bottom');
                    boundary_step = "top-boundary";
                    Drawings.drawBoundaryDrawingHelpText("Step 2");
                }
                else {
                    // erase bottom-boundary coords when illegal line drawn
                    new_boundary.bottom_boundary_coordinates = [];

                    // redraw boilerplate & help text
                    Drawings.drawBoundaryBoilerplate();
                    Drawings.drawBoundaryDrawingHelpText("Step 1");
                }
            }
            else if (boundary_step === "top-boundary") {
                let top_boundary_is_valid = new_boundary.validateTop(event);

                // could make own function for this condition
                if (top_boundary_is_valid) {
                    // update step and store boundary
                    // store top-boundary
                    new_boundary.save('top');
                    boundary_step = 'full-boundary';

                    // draw next-step text 
                    Drawings.drawBoundaryValidationHelpText();
                }
                else {
                    // reset top boundary coords when illegal line drawn
                    new_boundary.top_boundary_coordinates = [];

                    // redraw boilerplate and help text (erases illegal user-drawn line)
                    Drawings.drawBoundaryBoilerplate();

                    // draw valid bottom-boundary
                    ctx.drawImage(new_boundary.bottom_boundary, 0, 0, canvas.width, canvas.height);

                    Drawings.drawBoundaryDrawingHelpText("Step 2");
                }
            }
            else if (boundary_step === 'full-boundary') {
                let full_boundary_is_valid = new_boundary.validateFull();

                // could make own function for this condition
                if (full_boundary_is_valid) {
                    // update step
                    boundary_step = 'confirmation';
                    allowed_to_draw = false;
                    
                    // make goal white to show success
                    ctx.fillStyle = 'white';
                    ctx.fillRect(925, 50, 20, 20);

                    // should display help text on bottom-left area
                    Drawings.drawBoundaryCompletionHelpText();

                    // display button to proceed, hide 'back' btn
                    document.getElementsByClassName("save-boundaries-btn")[0].style.display = 'block';
                    document.getElementsByClassName("stop-btn")[0].style.display = 'none';
                }
                else {
                    Drawings.drawBoundaryValidationScreen(new_boundary.top_boundary);
                }
            }
        }
    }
    
    // respond to each event individually (pass event for mouse position)
    canvas.addEventListener('mouseenter', updateMousePosition);
    canvas.addEventListener('mousedown', requestDrawingPermission);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', validateBoundaryConnection);

    // make class method?
    let save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];

    save_bounds_btn.addEventListener("click", function() {
        console.log("Saving Custom Boundaries");

        // save full boundary
        new_boundary.save('full');

        // ** This whole execution flow could be own function such as: 'prepareBoundaryForSimulation()'

        // normalize boundary coordinate array sizes
        new_boundary.prepareBoundaryForCheckpoints();

        // let's make sure the boundaries are same length and not the same values
        // console.log(custom_boundary.top_boundary_coordinates.length, custom_boundary.bottom_boundary_coordinates.length);
        // console.log(custom_boundary.top_boundary_coordinates, custom_boundary.bottom_boundary_coordinates);

        // ===== here =====
        // next, we'll create the checkpoints to be used by our fitness function
        new_boundary.createCheckpoints();

        // still using custom_boundary global, I don't like it ==!CHANGE!==
        simGlobals.custom_boundary = new_boundary;

        // update global scale_statistics
        // should only need to be called once here, right?
        simGlobals.scale_statistics = setScale();

        // return to settings

        // should we turn off all listeners here???
        // - not yet. user could choose to redraw boundary?

        // ===== this should display boundary version of settings form =====
        displaySettingsForm();
    });
}

// ======================
// ===== PRE-SIM =====
// ======================

function createPaintbrush() {
    window.paintbrush = new Paintbrush();
}

async function runPreSimAnimations() {

    // *** pre-sim animations will vary slightly (death, boundary), depending on sim type ***

    // (only with dialogue on!)

    let pre_sim_content = {};

    pre_sim_content.total_organisms = document.getElementById("total-organisms").value;
    pre_sim_content.gene_count = document.getElementById("gene-count").value;
    pre_sim_content.movement_speed = document.getElementById("move-speed").value;
    pre_sim_content.mutation_rate = document.getElementById("mutation-rate").value;
    pre_sim_content.dialogue = document.getElementById("dialogue-checkbox").checked;

    await paintbrush.fadeIn(Drawings.drawSimulationSettings, .01, pre_sim_content);

    await sleep(2000);
    await paintbrush.fadeOut(Drawings.drawSimulationSettings, .02, pre_sim_content);

    await paintbrush.fadeIn(Drawings.drawSimulationIntro, .01);
    await sleep(2000);

    await paintbrush.fadeIn(Drawings.drawFakeGoal, .01); // *** this will need to be changed for boundary sims
    await paintbrush.fadeOut(Drawings.drawSimulationIntro, .02);
    await paintbrush.fadeIn(Drawings.drawSimulationExplanation, .01);
    await sleep(4000);

    await paintbrush.fadeOut(Drawings.drawExplanationAndGoal, .02);
    await sleep(1000);

    // add content for drawStats()
    pre_sim_content.generation_count = 0;
    pre_sim_content.average_fitness = '0.00';

    await paintbrush.fadeIn(Drawings.drawStats, .02, pre_sim_content);
    await sleep(500);

    if (simGlobals.dialogue) {
        await paintbrush.fadeIn(Drawings.drawPhases, .02);
        await sleep(500);
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseEntryText, .02);
    }

    return new Promise(resolve => {
        // clear content to ensure no variable cross-up
        console.log("making null");
        pre_sim_content = null;
        resolve("pre-sim animations complete!");
    })
}

function selectSimulationType() {
    Drawings.drawInitialSimSelectionScreen();
    turnOnSimTypeSelectionListeners();
}

function handleSimTypeBtnMouseover(event) {
    console.log(event.target.className);
    if (event.target.className === 'sim-type-classic') {
        simGlobals.sim_type = Drawings.highlightClassicSimType();
    }
    else if (event.target.className === 'sim-type-boundary') {
        simGlobals.sim_type = Drawings.highlightBoundarySimType();
    }
}

function handleSimTypeBtnClick() {
    if (simGlobals.sim_type != null) {
        applySimType();
    }
}

function turnOnSimTypeSelectionListeners() {
    // allow arrow keys to highlight sim types, 'enter' to confirm
    document.addEventListener('keydown', handleSimTypeSelectionKeyPress);

    let sim_type_btn_classic = document.getElementsByClassName("sim-type-classic")[0];
    let sim_type_btn_boundary = document.getElementsByClassName("sim-type-boundary")[0];

    // add event listeners to buttons (move to better place if needed)
    sim_type_btn_classic.addEventListener('mouseover', handleSimTypeBtnMouseover);
    sim_type_btn_boundary.addEventListener('mouseover', handleSimTypeBtnMouseover);

    // when button is clicked, sim_type will be set
    sim_type_btn_classic.addEventListener('click', handleSimTypeBtnClick);
    sim_type_btn_boundary.addEventListener('click', handleSimTypeBtnClick);
}

function turnOffSimTypeSelectionEventListeners() {
    if (simGlobals.sim_type != null) {
        // turn off event listeners before displaying next canvas
        let sim_type_btn_classic = document.getElementsByClassName("sim-type-classic")[0];
        let sim_type_btn_boundary = document.getElementsByClassName("sim-type-boundary")[0];
    
        sim_type_btn_classic.removeEventListener('mouseover', handleSimTypeBtnMouseover);
        sim_type_btn_classic.removeEventListener('click', handleSimTypeBtnClick);
        sim_type_btn_boundary.removeEventListener('mouseover', handleSimTypeBtnMouseover);
        sim_type_btn_boundary.removeEventListener('click', handleSimTypeBtnClick);
        document.removeEventListener('keydown', handleSimTypeSelectionKeyPress);
    }
}

function handleSimTypeSelectionKeyPress(event) {
    switch(event.key) {
        case "ArrowLeft":
            // the solution is to sync this variable with the sim_type var that runSimulation()/checkSimType() checks
            // i'll do that now. set sim_type here
            simGlobals.sim_type = Drawings.highlightClassicSimType();
            break;

        case "ArrowRight":
            simGlobals.sim_type = Drawings.highlightBoundarySimType();
            break;
        
        case "Enter":
            if (simGlobals.sim_type != null) {
                applySimType();
            }
            else {
                console.log("sim type not selected.");
            }
            break;
    }  
}

function turnOnBoundaryIntroductionOneListeners() {
    let next_btn = document.getElementsByClassName("next-btn")[0];
    next_btn.style.display = 'block';

    next_btn.addEventListener('click', function continueIntroduction() {
        // remove listener
        next_btn.removeEventListener('click', continueIntroduction);

        // go to next screen
        Drawings.drawBoundaryCreationIntroductionTwo();
        turnOnBoundaryIntroductionTwoListeners();
    })

    document.addEventListener('keydown', function checkKeystroke(event) {
        if (event.key === 'Enter') {
            // destroy listeners
            document.removeEventListener('keydown', checkKeystroke);

            // go to next screen
            Drawings.drawBoundaryCreationIntroductionTwo();
            turnOnBoundaryIntroductionTwoListeners();
        }
    })
}

function turnOnBoundaryIntroductionTwoListeners() {
    
    // change text
    let next_btn = document.getElementsByClassName("next-btn")[0];
    next_btn.innerHTML = 'Okay';

    next_btn.addEventListener('click', function finishBoundaryIntroduction() {
        // remove listener
        next_btn.removeEventListener('click', finishBoundaryIntroduction);

        next_btn.style.display = 'none';

        // go to next screen
        enterBoundaryCreationMode();
    })    

    document.addEventListener('keydown', function checkKeystroke(event) {
        if (event.key === 'Enter') {
            // remove listener
            document.removeEventListener('keydown', checkKeystroke);

            // hide next_btn
            next_btn.style.display = 'none';

            // go to next screen
            // just a placeholder test
            enterBoundaryCreationMode();
        }
    })
}

function applySimType() {

    // turn off listeners and hide buttons
    turnOffSimTypeSelectionEventListeners();

    document.getElementsByClassName("sim-type-classic")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-boundary")[0].style.display = 'none';

    if (simGlobals.sim_type === 'classic') {
        displaySettingsForm();
    }
    else if (simGlobals.sim_type === 'boundary') {
        // user must create boundary before settings configuration
        Drawings.drawBoundaryCreationIntroductionOne();
        turnOnBoundaryIntroductionOneListeners();
    }
}

function createOrganisms () {
    let gender;
    let male_count = 0;
    let female_count = 0;
    let spawn_x = simGlobals.INITIAL_X;
    let spawn_y = simGlobals.INITIAL_Y;

    let initial_population = [];

    // update spawn point if boundary simulation
    if (simGlobals.sim_type === 'boundary') {
        spawn_x = simGlobals.INITIAL_X_BOUND;
        spawn_y = simGlobals.INITIAL_Y_BOUND;
    }

    // create equal number of males and females
    for (let i = 0; i < simGlobals.TOTAL_ORGANISMS; i++) {
        if (i % 2) {
            gender = 'male';
            male_count++;
        }
        else {
            gender = 'female';
            female_count++;
        }

        let organism = new Organism(gender, spawn_x, spawn_y, ctx);

        organism.setRandomGenes();
        initial_population.push(organism);
    }
    console.log(`FEMALES CREATED: ${female_count}, MALES CREATED: ${male_count}`);

    return initial_population;
}

// ======================
// ===== EVALUATION =====
// ======================

// updateAndMove() functions will not be converted to module (complex animations)
// updateAndMove() not converted var >> let yet

function updateAndMoveOrganismsBounds(organisms) {
    return new Promise(resolve => {

        var canvas2_data = ctx2.getImageData(0, 0, canvas.width, canvas.height);

        var finished = false;
        var position_rgba;
        var total_moves = 0;
        let frame_id;

        function animateOrganisms() {

            if (!finished) {
                if (total_moves >= simGlobals.GENE_COUNT * organisms.length) {
                    finished = true;
                }
                else {
                    ctx.clearRect(0, 0, canvas.width, canvas.height);

                    // (FOR TESTING) draw checkpoints
                    // drawCheckpoints();

                    for (let i = 0; i < organisms.length; i++) {
                        if (organisms[i].is_alive) {

                            position_rgba = getPixelXY(canvas2_data, organisms[i].x, organisms[i].y);

                            if (position_rgba[0] === 155 && position_rgba[1] === 245) { // consider only checking one value for performance

                                let survived = Math.random() < simGlobals.RESILIENCE;

                                if (survived) {
                                    // instead of update and move, move organism to inverse of last movement, update index

                                    // get inverse of last gene
                                    let inverse_x_gene = (organisms[i].genes[organisms[i].index - 1][0]) * -1;
                                    let inverse_y_gene = (organisms[i].genes[organisms[i].index - 1][1]) * -1;

                                    // update
                                    organisms[i].x += inverse_x_gene;
                                    organisms[i].y += inverse_y_gene;

                                    // increase index
                                    organisms[i].index++;

                                    // move
                                    organisms[i].move();
                                }
                                else {
                                    organisms[i].is_alive = false;
                                    ctx.fillStyle = 'red';
                                    ctx.beginPath();
                                    ctx.arc(organisms[i].x, organisms[i].y, organisms[i].radius, 0, Math.PI*2, false);
                                    ctx.fill();
                                }
                            }
                            else {
                                organisms[i].update();
                                organisms[i].move();
                            }
                        }
                        else {
                            // draw deceased organism
                            ctx.fillStyle = 'red';
                            ctx.beginPath();
                            ctx.arc(organisms[i].x, organisms[i].y, organisms[i].radius, 0, Math.PI*2, false);
                            ctx.fill();
                        }
                        total_moves++;
                    }

                }
                sleep(1000 / simGlobals.FPS); // looks smoother without fps
                frame_id = requestAnimationFrame(animateOrganisms);
            }

            else {
                //resolve
                cancelAnimationFrame(frame_id);
                // ======! resolving 'false' until success logic implemented !======
                resolve(false);
            }
        }
        requestAnimationFrame(animateOrganisms);
    })
}

function updateAndMoveOrganisms(goal, organisms) {
    return new Promise(resolve => {
        let total_moves = 0;
        let finished = false;
        let success_flag = false;
        let frame_id;

        // [x] we should draw goal on canvas2 
        goal.drawGoal();

        // why is this async?
        async function animateOrganisms() {
            if (!finished) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                for (let i = 0; i < organisms.length; i++) {
                    if (organisms[i].reached_goal == false) {
                        organisms[i].update();
                        organisms[i].move();
                        hasReachedGoal(organisms[i], goal);
                    }
                    else {
                        Drawings.updateSuccessfulOrganism(organisms[i]);
                        success_flag = true;
                    }
                    total_moves++;
                }
                if (total_moves == (organisms.length * simGlobals.GENE_COUNT)) {
                    finished = true;
                }

                sleep(1000 / simGlobals.FPS); // control drawing FPS for organisms
                frame_id = requestAnimationFrame(animateOrganisms);
            }
            else {
                // resolve
                cancelAnimationFrame(frame_id);
                resolve(success_flag);
            }
        }
        requestAnimationFrame(animateOrganisms);
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

// not converted var >> let yet
async function runEvaluationAnimation(organisms) {

    // need to draw goal at location depending on sim type
    if (simGlobals.sim_type === 'classic') {
        var goal = new Goal(simGlobals.GOAL_X_POS, simGlobals.GOAL_Y_POS, 20, ctx);
        var success_flag = await updateAndMoveOrganisms(goal, organisms); // ideally don't pass in goal here
    }
    else if (simGlobals.sim_type === 'boundary') {
        // *** this is super messy ***

        if (simGlobals.dialogue) {
            // draw eval text and stats on canvas1
            ctx2.clearRect(0, 0, 245, 150);
            Drawings.drawStaticEvaluationPhaseText(ctx);
        }

        ctx2.clearRect(700, 510, 350, 120);
        Drawings.drawStatsStatic(ctx);

        if (simGlobals.generation_count === 0 && !simGlobals.dialogue) {
            await paintbrush.fadeIn(Drawings.drawBoundary, .01);
            ctx2.globalAlpha = 1;
        }

        if (simGlobals.dialogue) {
            await paintbrush.fadeIn(Drawings.drawBoundary, .01);
            ctx2.globalAlpha = 1;

            // clear canvas1 and redraw eval text and stats on canvas2
            ctx.clearRect(0, 0, 245, 150);
            Drawings.drawStaticEvaluationPhaseText(ctx2);
        }

        ctx.clearRect(700, 510, 350, 120);
        Drawings.drawStatsStatic(ctx2);

        // var goal = new Goal(GOAL_X_POS_BOUNDS, GOAL_Y_POS_BOUNDS, 20, ctx); not sure if needed (goal saved in boundary drawing)
        var success_flag = await updateAndMoveOrganismsBounds(organisms);
    }

    return new Promise((resolve, reject) => {
        if (success_flag) {
            resolve(true);
        }
        else {
            resolve(false);
        }
    })
}

function getShortestDistanceToGoal(organisms) {

    let shortest_distance = 10000;
    let closest_organism_index;

    // though this loop identifies closest organism, it ALSO updates organism's distance_to_goal attribute
    for (let i = 0; i < organisms.length; i++) {
        let distance_to_goal = organisms[i].calcDistanceToGoal();
        if (distance_to_goal < shortest_distance) {
            shortest_distance = distance_to_goal;
            closest_organism_index = i;
        }
    }

    let closest_organism = organisms[closest_organism_index];

    return closest_organism;
}

function getShortestDistanceToNextCheckpoint(next_checkpoint, organisms) {
    let shortest_distance_to_checkpoint = 10000;
    let closest_organism;

    // calculate distance to closest checkpoint not yet reached
    for (let i = 0; i < organisms.length; i++) {
        // in future, make sure organism is alive before calculating its distance !!!!!!! (or remove deceased organisms from array)
        // distance^2 = a^2 + b^2
        let horizontal_distance_squared = (organisms[i].x - simGlobals.custom_boundary.checkpoints[next_checkpoint].coordinates[0]) ** 2;
        let vertical_distance_squared = (organisms[i].y - simGlobals.custom_boundary.checkpoints[next_checkpoint].coordinates[1]) ** 2;
        let distance_to_checkpoint_squared = horizontal_distance_squared + vertical_distance_squared;

        organisms[i].distance_to_next_checkpoint = Math.sqrt(distance_to_checkpoint_squared);
        console.log("Distance to next-closest checkpoint for organism " + i + ":");
        console.log(organisms[i].distance_to_next_checkpoint);

        if (organisms[i].distance_to_next_checkpoint < shortest_distance_to_checkpoint) {
            shortest_distance_to_checkpoint = organisms[i].distance_to_next_checkpoint;
            closest_organism = organisms[i]; // return only index if works better
        }
    }
    // we should have each organism's distance the closest checkpoint not yet reached.
    return closest_organism;
}

function calcPopulationFitness (organisms) {
    // does this really need to be a promise?
    return new Promise(resolve => {
        // reset total_fitness before calculation
        simGlobals.total_fitness = 0;

        for (let i = 0; i < organisms.length; i++) {
            organisms[i].calcFitness();
            simGlobals.total_fitness += organisms[i].fitness;
        }

        // redundant, fix
        simGlobals.average_fitness = simGlobals.total_fitness / organisms.length;
        resolve(simGlobals.average_fitness);
    })
}

function calcPopulationFitnessBounds(remaining_distance, organisms) {
    // scale = length of lines connecting epicenters from spawn>checkpoints>goal
    let scale = simGlobals.scale_statistics['scale'];

    // calc/set distance_to_goal && fitness
    simGlobals.total_fitness = 0.00;

    console.log(organisms);

    for (let i = 0; i < organisms.length; i++) {

        // this also sets each organism's distance_to_goal attribute
        organisms[i].calcDistanceToGoalBounds(remaining_distance);

        // this also sets each organism's fitness attribute
        organisms[i].calcFitnessBounds(scale);

        simGlobals.total_fitness += organisms[i].fitness;
    }

    // set average fitness
    simGlobals.average_fitness = simGlobals.total_fitness / organisms.length;

    console.log(simGlobals.average_fitness, simGlobals.total_fitness, organisms.length);
    return;
}

// not converted var >> let yet
async function evaluatePopulation(organisms) {
    // to do
    let shortest_distance_resolution = await getShortestDistanceToGoal(organisms);
    simGlobals.average_fitness = await calcPopulationFitness(organisms);

    // also redundant, fix
    var population_resolution = {
        'closest_organism': shortest_distance_resolution,
        'average_fitness': simGlobals.average_fitness
    }

    return new Promise(resolve => {
        resolve(population_resolution);
    })
}

// =====================
// ===== SELECTION =====
// =====================

function beginSelectionProcess() {
    // fill array with candidates for reproduction
    let potential_mothers = [];
    let potential_fathers = [];

    for (let i = 0; i < simGlobals.organisms.length; i++) {
        // Give organisms with negative fitness a chance to reproduce
        if (simGlobals.organisms[i].fitness < 0) {
            simGlobals.organisms[i].fitness = 0.01;
        }

        // I'm going to try this implementation >> (organism.fitness * 100) ** 1.25
        for (let j = 0; j < Math.ceil((simGlobals.organisms[i].fitness * 100) ** 2); j++) {
            if (simGlobals.organisms[i].gender === 'female') {
                potential_mothers.push(simGlobals.organisms[i]);
            }
            else if (simGlobals.organisms[i].gender === 'male') {
                potential_fathers.push(simGlobals.organisms[i]);
            }
        }
        // console.log(`Fitness for Organism ${i}: ${simGlobals.organisms[i].fitness}`);
        // console.log(`Organism ${i} was added to array ${Math.ceil((simGlobals.organisms[i].fitness * 100) ** 2)} times.`);
    }

    var potential_parents = {
        'potential_mothers': potential_mothers,
        'potential_fathers': potential_fathers
    }

    return new Promise(resolve => {
        resolve(potential_parents);
    })
}

function selectParentsForReproduction(potential_mothers, potential_fathers, next_gen_target_length) {

    // example
    // var parents = [
    //     [mother0, father0],
    //     [mother1, father1],
    //     ... 
    //     [mother9, father9]
    // ]

    // console.log(`organisms.length: ${simGlobals.organisms.length}`);
    // console.log(`target length: ${next_gen_target_length}`);

    let parents = [];
    // goal: pair together males and females 
    // create parents == TOTAL_ORGANISMS / 2 (each couple reproduces roughly 2 offspring)

    // classic target length = organisms.length
    // boundary target length = organisms.length + num_of_deceased_organisms
    // this way, our species will try to reproduce the same amount of organisms it started the generation with, rather than
    // organisms.length, which would always decline as organisms die
    for (let i = 0; i < (next_gen_target_length / 2); i++) {
        let mother_index = Math.floor(Math.random() * potential_mothers.length);
        let father_index = Math.floor(Math.random() * potential_fathers.length);

        let mother = potential_mothers[mother_index];
        let father = potential_fathers[father_index];

        let new_parents = [mother, father];

        parents.push(new_parents);
    }
    return parents;
}

async function runClosestOrganismAnimations (closest_organism) {

    await paintbrush.fadeIn(Drawings.drawClosestOrganismText, .02);

    // give paintbrush a subject to draw
    paintbrush.subject = closest_organism;

    // highlight most-fit organism 
    for (let i = 0; i <= 2; i++) {
        await paintbrush.fadeIn(Drawings.drawClosestOrganismNatural, .04);
        await paintbrush.fadeIn(Drawings.drawClosestOrganismHighlighted, .04);
    }
    await sleep(1000);

    // fade out text, return organism to natural color
    await paintbrush.fadeOut(Drawings.drawClosestOrganismText, .02);
    await paintbrush.fadeIn(Drawings.drawClosestOrganismNatural, .04);

    // done drawing closet organism
    paintbrush.subject = null;

    return new Promise(resolve => {
        resolve();
    })
}

async function runChosenParentsAnimations(parents) {

    // set subject for paintbrush
    paintbrush.subject = parents;

    // highlight mothers
    await paintbrush.fadeIn(Drawings.drawMothersText, .02);

    for (let i = 0; i <= 2; i++) {
        await paintbrush.fadeIn(Drawings.drawMothersHighlighted, .03);
        await paintbrush.fadeIn(Drawings.drawMothersNatural, .03);
    }

    // highlight fathers
    // !!! change fathers color to a lighter blue
    await paintbrush.fadeIn(Drawings.drawFathersText, .02);

    for (let i = 0; i <= 2; i++) {
        await paintbrush.fadeIn(Drawings.drawFathersHighlighted, .03);
        await paintbrush.fadeIn(Drawings.drawFathersNatural, .03);
    }
    await sleep(1000);

    // highlight all
    await paintbrush.fadeIn(Drawings.drawMothersHighlighted, .03);
    await paintbrush.fadeIn(Drawings.drawFathersHighlighted, .03);
    await paintbrush.fadeIn(Drawings.drawNotChosenText, .02);
    await sleep(1000); 

    // fade out all
    await paintbrush.fadeOut(Drawings.drawAllSelectedOrganismsText, .02);
    await paintbrush.fadeIn(Drawings.drawBothParentTypesNatural, .02);
    await paintbrush.fadeOut(Drawings.drawOrganisms, .02);
    await sleep(1000);

    // done with parents
    paintbrush.subject = null;

    return new Promise(resolve => {
        resolve("Highlight Chosen Parents Animation Complete");
    })
}

async function runSelectionAnimations(closest_organism, parents) {
    console.log("Called runSelectionAnimations()");
    // maybe model other phases after this one
    await runClosestOrganismAnimations(closest_organism); // finished
    await runChosenParentsAnimations(parents);
    
    // make own function
    if (simGlobals.sim_type === 'boundary') {
        await paintbrush.fadeOut(Drawings.drawDeceasedOrganisms, .02);

        // fade out boundary
        // we should draw a static selection phase on canvas1, and erase that area on canvas2
        ctx2.clearRect(0, 0, 245, 150);
        Drawings.drawStaticSelectionPhaseText(ctx);

        // fade out boundary and reset globalAlpha
        await paintbrush.fadeOut(Drawings.drawBoundary, .01);
        ctx2.globalAlpha = 1;

        // next, we should erase the drawing on canvas1 and redraw on canvas2 (all working)
        ctx.clearRect(0, 0, 245, 150);
        Drawings.drawStaticSelectionPhaseText(ctx2);
    }

    return new Promise(resolve => {
        resolve("Run Selection Animations Complete");
    })
}

// ================================
// ===== CROSSOVER & MUTATION =====
// ================================

// (Mutation handled on gene inheritance currently)
function crossover(parents_to_crossover) {

    let mother = parents_to_crossover[0];
    let father = parents_to_crossover[1];

    // create offspring's genes
    let crossover_genes = [];

    for (let j = 0; j < simGlobals.GENE_COUNT; j++) {
        // select if mother or father gene will be used (50% probability)
        let random_bool = Math.random();

        // apply mutation for variance
        // set upper and lower bound for gene mutation using MUTATION_RATE / 2
        // this way, mother and father genes retain an equal chance of being chosen
        if (random_bool < (simGlobals.MUTATION_RATE / 2) || random_bool > 1 - (simGlobals.MUTATION_RATE / 2)) {
            let mutated_gene = getRandomGene(simGlobals.MIN_GENE, simGlobals.MAX_GENE);
            crossover_genes.push(mutated_gene);
        }
        // mother gene chosen
        else if (random_bool < 0.5) {
            let mother_gene = mother.genes[j];
            crossover_genes.push(mother_gene);
        }
        // father gene chosen
        else {
            let father_gene = father.genes[j];
            crossover_genes.push(father_gene);
        }
    }

    return crossover_genes;
}

// [] works
async function runCrossoverAnimations() {
    await paintbrush.fadeToNewColor(Drawings.drawCrossoverPhaseEntryText, .02);
    await paintbrush.fadeIn(Drawings.drawCrossoverDescriptionText, .025);
    await sleep(2000);
    await paintbrush.fadeOut(Drawings.drawCrossoverDescriptionText, .025);
    await paintbrush.fadeToNewColor(Drawings.drawCrossoverPhaseExitText, .02);
}

async function runMutationAnimations() {
    await paintbrush.fadeToNewColor(Drawings.drawMutationPhaseEntryText, .02);
    await paintbrush.fadeIn(Drawings.drawMutationDescriptionText, .025);
    await sleep(2000);
    await paintbrush.fadeOut(Drawings.drawMutationDescriptionText, .025);
    await paintbrush.fadeToNewColor(Drawings.drawMutationPhaseExitText, .02);
}

// =================================
// ===== CREATE NEW GENERATION =====
// =================================

function determineOffspringCount() {
    // this shouldn't be declared every call.. (fix)
    let possible_offspring_counts = [0, 0, 1, 1, 2, 2, 2, 3, 4, 5]; // sum = 20, 20/10items = 2avg

    let offspring_count_index = Math.floor(Math.random() * possible_offspring_counts.length);
    let offspring_count = possible_offspring_counts[offspring_count_index];
    return offspring_count;
}

function getGender() {
    let gender_indicator = Math.random();
    let gender;

    if (gender_indicator < 0.5) {
        gender = 'female';
    }
    else {
        gender = 'male';
    }
    return gender;
}

function reproduce(crossover_genes) {
    let spawn_x = simGlobals.INITIAL_X;
    let spawn_y = simGlobals.INITIAL_Y;

    // update spawn point if boundary simulation
    if (simGlobals.sim_type === 'boundary') {
        spawn_x = simGlobals.INITIAL_X_BOUND;
        spawn_y = simGlobals.INITIAL_Y_BOUND;
    }

    let offspring_gender = getGender();
    let offspring = new Organism(offspring_gender, spawn_x, spawn_y, ctx);
    offspring.genes = crossover_genes;

    // push offspring to new population
    simGlobals.offspring_organisms.push(offspring);
}

function reproduceNewGeneration(parents) {
    for (let i = 0; i < parents.length; i++) {
        let offspring_count = determineOffspringCount();

        for (let j = 0; j < offspring_count; j++) {
            let crossover_genes = crossover(parents[i]); // returns dict
            reproduce(crossover_genes);
        }
    }
    // set offspring_organisms as next generation of organisms
    simGlobals.organisms = simGlobals.offspring_organisms;
    simGlobals.offspring_organisms = [];
}

// ====================
// ===== WIN/LOSE =====
// ====================

// * all win/lose drawings converted to module *
// * keeping in case function is created to play those animations *

// untested
async function handleSuccessfulSimDecision() {
    let key_pressed;

    do {
        key_pressed = await getUserDecision();
        console.log(key_pressed);
    }
    while (key_pressed != "Enter" && key_pressed != "q");

    console.log("Key Accepted: " + key_pressed);

    await paintbrush.fadeOut(Drawings.drawSuccessMessage, .05);
    Drawings.redrawOrganisms(); // not tested yet (could try using rAF for one frame to ensure user sees?)

    if (key_pressed === 'Enter') {
        console.log("Continuing Simulation.");
        await sleep(500);
    }
    else if (key_pressed === 'q') {
        console.log("Quitting Simulation.");

        await paintbrush.fadeOut(Drawings.drawOrganisms, .05);

        // possibly fade stats to black here too?
        stopSimulation();
    }
}

async function runNewGenAnimations() {
    await paintbrush.fadeToNewColor(Drawings.drawCreateNewGenPhaseEntryText, .02);
    await paintbrush.fadeIn(Drawings.drawGenerationSummaryText, .025);
    await sleep(2000);
    await paintbrush.fadeOut(Drawings.drawGenerationSummaryText, .025);
    await paintbrush.fadeToNewColor(Drawings.drawCreateNewGenPhaseExitText, .02);
}

// ========================
// ===== TITLE SCREEN =====
// ========================

function createTitleScreenOrganisms() {
    let title_organisms = [];

    for (let i = 0; i < 100; i++) {
        // we need a random x&y value to start the organism at 
        let random_x = Math.floor(Math.random() * canvas.width);
        let random_y = Math.floor(Math.random() * canvas.height);

        let new_organism = new Organism('female', random_x, random_y, ctx);

        // ** NEED TO ALTER fadeInTitleAnimation() IF ANYTHING HERE CHANGES
        for (let j = 0; j < 250; j++) {
            let random_gene = getRandomGene(-5, 5);
            new_organism.genes.push(random_gene);
        }

        title_organisms.push(new_organism);
    }
    return title_organisms;
}

// make sure function up to date
function fadeInTitleAnimation(title_organisms) {
    let opacity = 0.00;
    let opacity_tracker = 0.00;
    let finished = false;
    let cycles = 0;
    let start_button_pressed = false; // flag to resolve animation

    let logo = document.getElementById("logo");
    let press_start_text = document.getElementById("press-start");
    let start_btn = document.getElementsByClassName("start-btn")[0];

    start_btn.addEventListener("click", function updateStartBtnFlagOnClick() {
        console.log("Start Button Clicked");
        start_button_pressed = true;

        // remove eventListener after flag set
        start_btn.removeEventListener("click", updateStartBtnFlagOnClick);
    });

    document.addEventListener('keydown', function updateStartBtnFlagOnEnter(event) {
        if (event.key === "Enter") {
            console.log("Start Button Pressed");
            start_button_pressed = true;

            // remove eventListener after flag set
            document.removeEventListener('keydown', updateStartBtnFlagOnEnter);
        }
    });

    return new Promise(resolve => {
        function animateTitle() {
            if (!finished && !simGlobals.simulation_started) {

                // respond to event listener flag
                if (start_button_pressed) {
                    // cancel and resolve
                    cancelAnimationFrame(frame_id);
                    return resolve("Display Sim Types");
                }

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            
                // move organisms forever (works)
                for (let i = 0; i < 100; i++) {
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

                        for (let j = 0; j < 100; j++) {
                            title_organisms[j].index = 0;
                        }

                        if (cycles >= 5) {
                            finished = true;
                        }
                    }
                }

                // use globalAlpha, then reset
                // could make this class Paintbrush in the future for this and goal class methods
                ctx.globalAlpha = opacity;
                ctx.drawImage(logo, 105, 275);

                ctx.globalAlpha = 0.8;
                // blink start text 
                if (opacity_tracker >= 0.12 && opacity_tracker <= 0.24) {
                    // only draw image half of the time
                    ctx.drawImage(press_start_text, 300, 400, 400, 40);
                }
                else if (opacity_tracker > 0.24) {
                    // reset tracker
                    opacity_tracker = 0.00;
                }
                opacity_tracker += 0.005;

                if (opacity < 1.00) {
                    opacity += 0.005;
                }

                // return to 1 for organisms
                ctx.globalAlpha = 1;

                // FPS is an example of a variable that doesn't need to be global ( in window )
                sleep(750 / simGlobals.FPS); // control drawing FPS for organisms
                // var????? why
                var frame_id = requestAnimationFrame(animateTitle);
            }
            else {
                // resolves every n cycles to prevent overflow
                cancelAnimationFrame(frame_id);
                resolve("Keep Playing");
            }
        }
        requestAnimationFrame(animateTitle);
    })

}

async function playTitleScreenAnimation() {
    console.log("Simulation Ready!");

    let title_organisms = createTitleScreenOrganisms();

    // create paintbrush as window object
    createPaintbrush();
    
    do {
        console.log("Starting Title Animation");

        let status = await fadeInTitleAnimation(title_organisms);

        if (status === "Display Sim Types") {
            console.log("start button pressed. displaying sim types");
            // call here!
            selectSimulationType();
        }
        else if (status === "TEST BOUNDARY MODE") {
            console.log("Entering Boundary Mode");
            enterBoundaryCreationMode();
        }
        
    }
    while (simGlobals.simulation_started === false && status === "Keep Playing");
}

// ================
// ===== MAIN =====
// ================

// maybe async ruins this functions performance?
// not converted var >> let yet (both runGeneration() and runSimulation())
async function runGeneration(new_generation) {

    console.log("runGeneration() called");
    console.log(new_generation.new_population);

    // start with let, upgrade to var if needed
    let organisms = new_generation.new_population;

    if (simGlobals.generation_count != 0) {
        if (simGlobals.dialogue) {
            await paintbrush.fadeIn(Drawings.drawStats, .02);
            await sleep(500);
            await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseEntryText, .02);
        }
        else {
            Drawings.drawStats();
        }
    }

    // Phase: Evaluate Individuals

    if (simGlobals.simulation_succeeded) {

        await runEvaluationAnimation(organisms);
    }
    else {
        // check if simulation succeeded 
        let success_flag = await runEvaluationAnimation(organisms);
        console.log(`Success Flag: ${success_flag}`);

        // here, if success flag is true, we can await the success animation
        // untested
        if (success_flag) {
            // update flag
            simulation_succeeded = true;

            // give user time to see their win
            await sleep(1500);
            await paintbrush.fadeIn(Drawings.drawSuccessMessage, .02); // untested

            // untested
            handleSuccessfulSimDecision();            
        }
    }

    if (simGlobals.dialogue) {
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseExitText, .02);

        // ** placeholder to test **
        // ignore this while integrating organisms array
        let content = {};
        content.generation_count = 0;
        content.total_organisms = 777;
        content.average_fitness = 7.77;

        await paintbrush.fadeOut(Drawings.drawStats, .015, content); // put here to fade out stats before average fitness updated
        await sleep(1000);
    }

    // store length of organisms array before deceased organisms filtered out for reproduction (boundary sims)
    let next_gen_target_length = organisms.length;
    let closest_organism;

    if (simGlobals.sim_type === 'classic') {
        let population_resolution = await evaluatePopulation(organisms); // maybe don't await here
        closest_organism = population_resolution['closest_organism'];
        simGlobals.average_fitness = population_resolution['average_fitness'];
    }
    else if (simGlobals.sim_type === 'boundary') {

        // keeping in case I was wrong, and the new way doesn't work
        // reassign (.filter() does not change array)
        // simGlobals.organisms = simGlobals.organisms.filter(checkPulse);

        // remove deceased organisms from array (organisms array is evaluated multiple times and deceased organisms aren't used)
        console.log(`before checkPulse(): ${organisms.length}`);

        // returns array of living and deceased organisms
        let organized_organisms = checkPulse(organisms);

        // re-assign array to be only the living organisms
        organisms = organized_organisms['living_organisms'];
        simGlobals.deceased_organisms = organized_organisms['deceased_organisms'];

        console.log(`after checkPulse(): ${organisms.length}`);

        // draw checkpoints for reference
        // simGlobals.custom_boundary.drawCheckpoints();

        // here, we set checkpoints[i].distance_to_goal 
        // should this only be done on iteration #1???
        calcDistanceToGoalCheckpoints();

        // get previous, current, and next checkpoints for current generation
        var checkpoint_data = getFarthestCheckpointReached(organisms);

        // this will set each organism's distance_to_next_checkpoint attribute
        // *** i think the problem lies here
        closest_organism = getShortestDistanceToNextCheckpoint(checkpoint_data['next'], organisms);

        // distance_to_goal = distance_to_next_checkpoint + next_checkpoint.distance_to_goal
        // 'next' will give us the index in the checkpoints array of the checkpoint we want to measure from
        var remaining_distance = simGlobals.custom_boundary.checkpoints[checkpoint_data['next']].distance_to_goal;

        console.log(remaining_distance);

        // this function will set each organism's distance_to_goal and fitness attributes
        // it also updates simGlobals.average_fitness
        calcPopulationFitnessBounds(remaining_distance, organisms);

        console.log(`Average Fitness: ${simGlobals.average_fitness}`);
    }

    // [x] check when organisms array integrated up to here

    // PHASE: SELECT MOST-FIT INDIVIDUALS
    if (simGlobals.dialogue) {
        await paintbrush.fadeToNewColor(Drawings.drawSelectionPhaseEntryText, .02);
    }

    // this phase includes: beginSelectionProcess(), selectParentsForReproduction()
    const potential_parents = await beginSelectionProcess(); // maybe don't await here

    var potential_mothers = potential_parents['potential_mothers'];
    var potential_fathers = potential_parents['potential_fathers'];

    // we shouldn't enter the selection phase if there aren't enough organisms to reproduce
    // this could happen if a population produced all males, then potential_mothers would never get filled, and program fails
    // check extinction
    if (potential_mothers.length === 0 || potential_fathers.length === 0) {

        // not converting to module yet
        // await fadeInExtinctionMessage();
        await paintbrush.fadeIn(drawExtinctionMessage, .05); // untested

        await sleep(2000);
        do {
            var exit_key = await getUserDecision();
            console.log(exit_key);
        }
        while (exit_key != "q");

        stopSimulation();
    }

    var parents = selectParentsForReproduction(potential_mothers, potential_fathers, next_gen_target_length);
    
    if (simGlobals.dialogue) {
        await runSelectionAnimations(closest_organism, parents);

        await paintbrush.fadeToNewColor(Drawings.drawSelectionPhaseExitText, .01);
    }
    else {
        await paintbrush.fadeOut(Drawings.drawOrganisms, .02);

        if (simGlobals.sim_type === 'boundary') {
            await paintbrush.fadeOut(Drawings.drawDeceasedOrganisms, .02);            
        }
    }

    // this function handles crossover, mutation and reproduction
    // this function pushes new gen organisms to offspring_organisms[]
    reproduceNewGeneration(parents);

    // PHASE: CROSSOVER / MUTATE / REPRODUCE
    // [] still need to fadeout boundary before these animations
    if (simGlobals.dialogue) {

        await runCrossoverAnimations();

        await runMutationAnimations();

        await runNewGenAnimations();
    }

    return new Promise(resolve => {
        simGlobals.generation_count++;
        resolve(simGlobals.generation_count);
    })
}

async function runSimulation () {

    // remove run-btn listener
    document.getElementsByClassName("run-btn")[0].removeEventListener('click', runSimulation);

    // hide start/settings buttons
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("settings-btn")[0].style.display = 'none';

    // display stop simulation button & add its listener
    let stop_sim_btn = document.getElementsByClassName("stop-btn")[0];
    stop_sim_btn.style.display = 'block';

    stop_sim_btn.addEventListener('click', function stopSim() {
        stopSimulation();
    });

    simGlobals.simulation_started = true;

    console.log("Running Simulation with these settings:");
    console.log(`Total Organisms: ${simGlobals.TOTAL_ORGANISMS}`);
    console.log(`Gene Count: ${simGlobals.GENE_COUNT}`);
    console.log(`Resilience: ${simGlobals.RESILIENCE}`);
    console.log(`Mutation Rate: ${simGlobals.MUTATION_RATE}`);
    console.log(`Min/Max Gene: [${simGlobals.MIN_GENE}, ${simGlobals.MAX_GENE}]`);
    console.log(`Dialogue: ${simGlobals.dialogue}`);

    // pre-sim animations *****
    await runPreSimAnimations();

    /// PHASE: CREATE NEW GENERATION/POPULATION
    let initial_population = createOrganisms();
    console.log("Amount of organisms created = " + initial_population.length);

    // could save to global, but I'll try it passing it the same way future gens will first
    let new_generation = {};
    new_generation.new_population = initial_population;

    do {
        new_generation = await runGeneration(new_generation);
        // console.log(result);
    } while (simGlobals.generation_count < 1000);
}

function stopSimulation() {
    // reloads the page
    document.location.reload();
}

// ============================
// ===== EXTRAS / UNKNOWN =====
// ============================

// this trio of drawings isn't used, but is useful for debugging. Keep til the end

// *DRAWING* 1
function drawCurrentCheckpoint(index) {
    // draw farthest checkpoint reached
    ctx.strokeStyle = 'white';
    ctx.strokeWidth = 1;
    ctx.beginPath();
    ctx.arc(
        custom_boundary.checkpoints[index].coordinates[0], 
        custom_boundary.checkpoints[index].coordinates[1],
        custom_boundary.checkpoints[index].size, 0, Math.PI*2, false
    );
    ctx.stroke();
    ctx.closePath();
}

// *DRAWING* 2
function drawPreviousCheckpoint(index) {
    // draw checkpoint_reached - 1 or spawn point
    if (index === 'spawn') {
        // highlight spawn point
        console.log("highlighting spawn point green");
        ctx.strokeStyle = 'rgb(155, 245, 0)';
        ctx.strokeWidth = 3;
        ctx.beginPath();
        ctx.arc(INITIAL_X_BOUND, INITIAL_Y_BOUND, 10, 0, Math.PI*2, false);
        ctx.stroke();
        ctx.closePath();
    }
    else {
        // highlight k-1
        console.log("highlighting k-1 checkpoint green");
        ctx.strokeStyle = 'rgb(155, 245, 0)';
        ctx.beginPath();
        ctx.arc(
            custom_boundary.checkpoints[index].coordinates[0],
            custom_boundary.checkpoints[index].coordinates[1],
            custom_boundary.checkpoints[index].size, 0, Math.PI*2, false
        );
        ctx.stroke();
        ctx.closePath();
    }
}

// *DRAWING* 3
function drawNextCheckpoint(index) {
    // draw next checkpoint not yet reached
    if (index === 'goal') {
        // goal is the checkpoint, should circle goal
        console.log("k = custom_boundary.checkpoints.length - 1, no checkpoint set!!!!!! (need to finish)");
    }
    else {
        ctx.strokeStyle = 'darkred';
        ctx.beginPath();
        ctx.arc(
            custom_boundary.checkpoints[index].coordinates[0],
            custom_boundary.checkpoints[index].coordinates[1],
            custom_boundary.checkpoints[index].size, 0, Math.PI*2, false 
        );
        ctx.stroke();
        ctx.closePath;
    }
}

function setScale() {
    // compute the lengths of lines connecting epicenters from spawn to checkpoints to goal
    // store the individual line lengths in data structure for future reference
    // consider recursion here? base case = i === 0

    let scale = 0.00;

    // will store length of checkpoint to the next checkpoint
    let checkpoint_to_checkpoint_lengths = [];

    for (let i = 1; i < simGlobals.custom_boundary.checkpoints.length; i++) {
        // compute distance from last checkpoint to current
        let horizontal_distance_squared = (
            simGlobals.custom_boundary.checkpoints[i].coordinates[0] - 
            simGlobals.custom_boundary.checkpoints[i-1].coordinates[0]) ** 2;
        
        let vertical_distance_squared = (
            simGlobals.custom_boundary.checkpoints[i].coordinates[1] - 
            simGlobals.custom_boundary.checkpoints[i-1].coordinates[1]) ** 2;
        
        let distance_squared = horizontal_distance_squared + vertical_distance_squared;
        let distance_from_previous_checkpoint_to_current = Math.sqrt(distance_squared);

        // store length 
        // when storing value as i-1, value represents distance from checkpoint to next
        // checkpoint_to_checkpoint_lengths[0] = distance from boundary.checkpoints[0] to boundary.checkpoints[1]
        checkpoint_to_checkpoint_lengths[i-1] = distance_from_previous_checkpoint_to_current;

        // update scale
        scale += distance_from_previous_checkpoint_to_current;
    }

    // add distance from spawn to checkpoint[0] to scale
    let horizontal_distance_squared = (simGlobals.INITIAL_X_BOUND - simGlobals.custom_boundary.checkpoints[0].coordinates[0]) ** 2;
    let vertical_distance_squared = (simGlobals.INITIAL_Y_BOUND - simGlobals.custom_boundary.checkpoints[0].coordinates[1]) ** 2;
    let distance_squared = horizontal_distance_squared + vertical_distance_squared;
    let distance_from_spawn_to_first_checkpoint = Math.sqrt(distance_squared);

    // update scale
    scale += distance_from_spawn_to_first_checkpoint;

    // add distance from final checkpoint to goal to scale
    let final_to_goal_horizontal_distance_squared = (
        simGlobals.custom_boundary.checkpoints[simGlobals.custom_boundary.checkpoints.length - 1].coordinates[0] - simGlobals.GOAL_X_POS_BOUNDS) ** 2;
    let final_to_goal_vertical_distance_squared = (
        simGlobals.custom_boundary.checkpoints[simGlobals.custom_boundary.checkpoints.length - 1].coordinates[1] - simGlobals.GOAL_Y_POS_BOUNDS) ** 2;

    let distance_squared_to_goal = final_to_goal_horizontal_distance_squared + final_to_goal_vertical_distance_squared;

    let distance_from_final_checkpoint_to_goal = Math.sqrt(distance_squared_to_goal);

    scale += distance_from_final_checkpoint_to_goal;

    console.log(`final scale: ${scale}`);

    return {
        'scale': scale,
        'checkpoint_lengths': checkpoint_to_checkpoint_lengths,
        'spawn_to_checkpoint_0_length': distance_from_spawn_to_first_checkpoint,
        'last_checkpoint_to_goal_length': distance_from_final_checkpoint_to_goal
    }
}

function getPixel(canvas_data, index) {
    let i = index * 4;
    let data = canvas_data.data;

    return [data[i], data[i+1], data[i+2], data[i+3]];
}

function getPixelXY(canvas_data, x, y) {
    let index = y * canvas_data.width + x;

    // how it works?
    // say we're at position (2, 2) on canvas, and canvas is 1000px wide
    // index = (2 * 1000) + 2 = 2002
    // reading left to right, pixel at (2, 2) is pixel #2002 ?

    return getPixel(canvas_data, index);
}

// boundary method?
function calcDistanceToGoalCheckpoints() {
    let scale = simGlobals.scale_statistics['scale'];
    let checkpoint_to_checkpoint_lengths = simGlobals.scale_statistics['checkpoint_lengths'];
    let spawn_to_checkpoint_0_length = simGlobals.scale_statistics['spawn_to_checkpoint_0_length'];
    let last_checkpoint_to_goal_length = simGlobals.scale_statistics['last_checkpoint_to_goal_length']; // keep for comparison

    let adjusted_scale;

    // checkpoint_to_checkpoint_lengths[0] = checkpoints[0] distance to next checkpoint
    for (let i = 0; i < simGlobals.custom_boundary.checkpoints.length; i++) {
        if (i === 0) {
            // distance to goal for first checkpoint = scale - distance_from_spawn_to_first_checkpoint
            adjusted_scale = scale - spawn_to_checkpoint_0_length;
            simGlobals.custom_boundary.checkpoints[i].distance_to_goal = adjusted_scale;
        }
        else {
            // i-1 will give us the length of the previous checkpoint to the current
            adjusted_scale -= checkpoint_to_checkpoint_lengths[i-1];
            simGlobals.custom_boundary.checkpoints[i].distance_to_goal = adjusted_scale;
        }
    }
}

// boundary method?
function getFarthestCheckpointReached(organisms) {
    // !!!!! consider passing the previous gen's farthest checkpoint reached as a minimum-value !!!!!

    // **NOTE: this function doesn't handle when 0 checkpoints are reached yet !!** (it might now..)

    // we should loop over checkpoints, check all organisms, rather than loop over all organisms, check every checkpoint
    // this will allow us to stop once an organism is found (backwards loop)

    let previous_checkpoint;
    let current_checkpoint;
    let next_checkpoint;
    let reached_checkpoint = false;

    for (let k = simGlobals.custom_boundary.checkpoints.length - 1; k >= 0; k--) {
        console.log("k-loop iteration started");
        if (reached_checkpoint) {
            console.log("breaking out of k-loop, checkpoint was reached");
            break;
        }
        for (let j = 0; j < organisms.length; j++) {
            console.log("j-loop iteration started");
            // determine if organism is within the perimeter of the current checkpoint being checked
            // !!! [] don't define these every iteration, define it in outer-loop (checkpoint loop)
            let x_lower_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[0]) - simGlobals.custom_boundary.checkpoints[k].size;
            let x_upper_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[0]) + simGlobals.custom_boundary.checkpoints[k].size;
            let y_lower_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[1]) - simGlobals.custom_boundary.checkpoints[k].size;
            let y_upper_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[1]) + simGlobals.custom_boundary.checkpoints[k].size;

            // can replace vars with definitions once confident working
            // check if organism within x && y bounds of checkpoint we're checking
            if (organisms[j].x > x_lower_bound && organisms[j].x < x_upper_bound) {
                if (organisms[j].y > y_lower_bound && organisms[j].y < y_upper_bound) {

                    console.log("We have reached a checkpoint.");

                    reached_checkpoint = true;
                    current_checkpoint = k;

                    if (k === simGlobals.custom_boundary.checkpoints.length - 1) {
                        // final checkpoint was reached:
                        // previous = k-1, next = goal
                        previous_checkpoint = k - 1;
                        next_checkpoint = 'goal';
                    } 
                    else if (k >= 1) {
                        // at least second checkpoint was reached:
                        // previous = k-1, next = k+1
                        previous_checkpoint = k - 1;
                        next_checkpoint = k + 1;
                    }
                    else {
                        // k = 0, first checkpoint reached:
                        // previous: spawn point, next: k+1
                        previous_checkpoint = 'spawn';
                        next_checkpoint = k + 1;
                    }

                    console.log("breaking");
                    break;
                }
            }
        }
    }

    if (!reached_checkpoint) {
        // set first checkpoint as next checkpoint if none reached
        previous_checkpoint = null;
        current_checkpoint = 'spawn';
        next_checkpoint = 0;
    }

    console.log("break successful. returning previous, current, and next checkpoints");
    console.log('checkpoint data (previous, current, next) :');
    console.log(previous_checkpoint);
    console.log(current_checkpoint);
    console.log(next_checkpoint);

    return {
        'previous': previous_checkpoint,
        'current': current_checkpoint,
        'next': next_checkpoint
    }
}

function checkPulse(organisms) {

    let deceased_organisms = [];

    for (let i = 0; i < organisms.length; i++) {
        if (!organisms[i].is_alive) {
            // make sure this is correct
            deceased_organisms.push(organisms[i]);
            organisms.splice(i, 1);
        }
    }

    return {
        'living_organisms': organisms,
        'deceased_organisms': deceased_organisms
    }
}

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
            let key = event.key;
            resolve(key);
        });
    })
}

function getRandomGene(min, max) {
    let random_x = Math.floor(Math.random() * (max - min + 1) + min);
    let random_y = Math.floor(Math.random() * (max - min + 1) + min);
    let random_gene = [random_x, random_y];
    return random_gene;
}