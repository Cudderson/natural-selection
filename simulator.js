document.addEventListener("DOMContentLoaded", playTitleScreenAnimation);

import * as Drawings from "./modules/drawings.js";

Drawings.testModule('Hello everybody!');

// convert html function calls to eventlisteners in js 
// *** (place in appropriate functions!!) ***
document.getElementById("apply-form").addEventListener('submit', function submitForm(event) {
    // don't submit form
    event.preventDefault();

    validateSettingsForm();

    // destroy listener
    document.getElementById("apply-form").removeEventListener('submit', submitForm);
});

// allow run_btn to simply run the simulation
document.getElementsByClassName("run-btn")[0].addEventListener("click", runSimulation);

// maybe have this do the reload directly?
document.getElementsByClassName("stop-btn")[0].addEventListener('click', function stopSim() {
    stopSimulation();
});

// ===== vars =====

window.simGlobals = {};

// working test
simGlobals.sammy = 'sammy';
Drawings.findSammy();

console.log(window.simGlobals);
console.log(simGlobals);

// ** NOTE: We really only need to globalize vars that will be used in our modules. 
// The vars used in this file should be fine and not globalized

// *** Check box of variable when it is used by drawings.js

// starting coordinates for organisms and goal
simGlobals.INITIAL_X = 500; // [] 
simGlobals.INITIAL_Y = 500; // []
simGlobals.GOAL_X_POS = 500; // []
simGlobals.GOAL_Y_POS = 50; // []

// organism global default settings
simGlobals.TOTAL_ORGANISMS = 100; // [x]
simGlobals.GENE_COUNT = 250; // [x]
simGlobals.MUTATION_RATE = 0.03; // [x]
simGlobals.MIN_GENE = -5; // []
simGlobals.MAX_GENE = 5; // []
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
simGlobals.custom_boundary; // []
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
simGlobals.organisms = []; // []
simGlobals.offspring_organisms = []; // []

// canvas & drawing context
// reconsider how these are used
window.canvas = document.getElementById("main-canvas");
window.ctx = canvas.getContext("2d");

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
        for (var i = 0; i < simGlobals.GENE_COUNT; i++) {
            var random_gene = getRandomGene(simGlobals.MIN_GENE, simGlobals.MAX_GENE);
            this.genes.push(random_gene);
        }
    }

    showGenes() {
        for (var i = 0; i < simGlobals.GENE_COUNT; i++) {
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
        this.ctx.fillStyle = 'rgba(148, 0, 211, 1)'; // darkviolet
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.ctx.fill();
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
        this.ctx.fillStyle = 'rgba(155, 245, 0, 1)';
        this.ctx.fillRect(this.x, this.y, this.size, this.size);
    }

    // convert to drawings.js? why is the goal performing this?
    // this function is not good
    showStatistics() {
        simGlobals.average_fitness = Number(simGlobals.average_fitness).toFixed(2);
        var population_size = simGlobals.organisms.length;
        this.ctx.fillStyle = 'rgba(155, 245, 0, 1)';
        this.ctx.font = "22px arial";
        this.ctx.fillText('Generation:', 740, 535);
        this.ctx.fillText(simGlobals.generation_count.toString(), 940, 535);
        this.ctx.fillText('Population Size:', 740, 560);
        this.ctx.fillText(population_size.toString(), 940, 560);
        this.ctx.fillText('Average Fitness:', 740, 585);
        this.ctx.fillText(simGlobals.average_fitness.toString(), 940, 585);
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
            Drawings.drawBoundaryBoilerplate();

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

            // update canvas data
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
        var num_coords_to_remove = longest_boundary_coordinates.length - target_length;
        var percent_of_coords_to_remove = num_coords_to_remove / longest_boundary_coordinates.length;
        var coords_removed = 0;
        var coords_kept = 0;
        var random_percentage;

        console.log(`# of coordinates we need to remove: ${num_coords_to_remove}`);
        console.log(`which is ${percent_of_coords_to_remove}% of ${longest_boundary_coordinates.length}`);

        console.log(`Starting loop`);

        // since splicing changes array size, preserve the length here so that we can evaluate all coordinates
        var preserved_longest_length = longest_boundary_coordinates.length;

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
                var coordinate_to_remove = Math.floor(Math.random() * longest_boundary_coordinates.length);
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
        var longest_boundary_and_target = this.determineLongestBoundary();

        var longest_text = longest_boundary_and_target[0];
        var longest_boundary_coordinates = longest_boundary_and_target[1];
        var target_length = longest_boundary_and_target[2];

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
        var step = Math.ceil(this.top_boundary_coordinates.length / 10);
        var line_counter = 0;

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
        for (let j = 0; j < this.checkpoints.length - 1; j++) {
            // * keep drawings just in case *
            // ctx.beginPath();
            // ctx.moveTo(this.checkpoints[j].coordinates[0], this.checkpoints[j].coordinates[1]);
            // ctx.lineTo(this.checkpoints[j+1].coordinates[0], this.checkpoints[j+1].coordinates[1]);
            // ctx.stroke();
            // ctx.closePath();

            // let's now mark the halfway point between each line drawn
            let path_mid_x = Math.floor((this.checkpoints[j].coordinates[0] + this.checkpoints[j+1].coordinates[0]) / 2);
            let path_mid_y = Math.floor((this.checkpoints[j].coordinates[1] + this.checkpoints[j+1].coordinates[1]) / 2);

            // * keep drawings just in case *
            // ctx.fillStyle = 'orange';
            // ctx.beginPath();
            // ctx.arc(path_mid_x, path_mid_y, 5, 0, Math.PI*2, false);
            // ctx.fill();
            // ctx.closePath();

            // store checkpoint's halfway point to the next checkpoint as 'halfway_point': [x, y]
            this.checkpoints[j].halfway_point = [path_mid_x, path_mid_y];
        }

        // determine size using halfway points (loop from 1 to 8 (skips first and last checkpoint))
        for (let k = 1; k < this.checkpoints.length - 1; k++) {
            // determine length from checkpoint to previous checkpoints halfway point
            let current_location = this.checkpoints[k].coordinates;
            let previous_halfway_point = this.checkpoints[k-1].halfway_point;

            // c^2 = a^2 + b^2
            let distance_to_previous_halfway_point_squared = (
                (current_location[0] - previous_halfway_point[0]) ** 2) + ((current_location[1] - previous_halfway_point[1]) ** 2
            );
            let distance_to_previous_halfway_point = Math.sqrt(distance_to_previous_halfway_point_squared);


            // now determine distance to OWN halfway point
            let own_halfway_point = this.checkpoints[k].halfway_point;

            // c^2 = a^2 + b^2
            let distance_to_own_halfway_point_squared = (
                (current_location[0] - own_halfway_point[0]) ** 2) + ((current_location[1] - own_halfway_point[1]) ** 2
            );
            let distance_to_own_halfway_point = Math.sqrt(distance_to_own_halfway_point_squared);

            // determine shortest distance and store as size
            if (distance_to_previous_halfway_point < distance_to_own_halfway_point) {
                console.log(`For checkpoint ${k}, the distance to PREVIOUS halfway point is shortest.`);
                console.log(`previous: ${distance_to_previous_halfway_point}`);
                console.log(`own: ${distance_to_own_halfway_point}`);

                this.checkpoints[k].size = Math.floor(distance_to_previous_halfway_point);
            }
            else {
                console.log(`For checkpoint ${k}, the distance to OWN halfway point is shortest.`);
                console.log(`previous: ${distance_to_previous_halfway_point}`);
                console.log(`own: ${distance_to_own_halfway_point}`);

                this.checkpoints[k].size = Math.floor(distance_to_own_halfway_point);
            }

            // this is all working. checkpoint[0] doesn't check for previous halfway point, and checkpoint[9] doesn't check for own!
        }

        console.log('num of checkpoints: (if 10, code should work)');
        console.log(this.checkpoints.length);

        // maybe we remove first/last checkpoints at this stage?? <<<<<< not a bad idea
        // for now, let's just assign them arbitrary sizes
        // CODE SOMETIMES BREAKS HERE, probably not enough checkpoints created?
        this.checkpoints[0].size = 20;
        // this.checkpoints[9].size = 20;
        this.checkpoints[this.checkpoints.length - 1].size = 20; // testing if this is a legitimate fix (all code must be dynamic)

        // to confirm, display sizes for each checkpoint
        for (let m = 0; m < this.checkpoints.length; m++) {
            console.log(`Size of checkpoint ${m}: ${this.checkpoints[m].size}`);
        }

        // complete! checkpoints can be drawn with appropriate sizes now.
    }

    drawCheckpoints() {
        // === Draw Checkpoints ===
        for (let p = 0; p < this.checkpoints.length; p++) {
            ctx.beginPath();
            ctx.arc(this.checkpoints[p].coordinates[0], this.checkpoints[p].coordinates[1], this.checkpoints[p].size, 0, Math.PI*2, false);
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

    fadeIn(drawing_function, step) {
        return new Promise(resolve => {
            let finished = false;
            let opacity = 0.00;
            let frame_id;
            function drawFrame() {
                if (!finished) {
                    // animate

                    // think of better name than drawing_function
                    drawing_function(opacity);
                    
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

    fadeOut(drawing_function, step) {
        return new Promise(resolve => {
            let finished = false;
            let opacity = 1.00;
            let frame_id;
            function drawFrame() {
                if (!finished) {
                    // animate

                    // think of better name than drawing_function
                    drawing_function(opacity);
                    
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
    var settings_btn = document.getElementsByClassName("settings-btn")[0];
    var start_btn = document.getElementsByClassName("run-btn")[0];
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

    if (simGlobals.sim_type === 'classic') {
        // display classic settings (no death/resilience)
        document.getElementsByClassName("resilience-setting-label")[0].style.display = 'none';
        document.getElementsByClassName("resilience-input")[0].style.display = 'none';
    }

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

// [] should stop title screen animation when settings is called
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
    settings_manager['resilience_setting'] = validateResilienceSetting();

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
        simGlobals.dialogue = true;
    }
    else {
        simGlobals.dialogue = false;
    }

    // returns to title screen
    finishApplyingSettings();

    // restart animation ===
    // here, we should instead bring user to a screen that tells them their simulation is
    // ready to run, and present a button/cue to begin simulation

    // playTitleScreenAnimation();
    prepareToRunSimulation();

    // don't submit the form
    return false;
}

function validateTotalOrganismsSetting() {
    var total_organisms_setting = document.getElementById("total-organisms");

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
    var gene_count_setting = document.getElementById("gene-count");

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
    var mutation_rate_setting = document.getElementById("mutation-rate");

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

function finishApplyingSettings() {
    // make html changes before function returns
    var canvas_container = document.getElementsByClassName("canvas-container")[0];
    var settings_container = document.getElementsByClassName("settings-container")[0];

    canvas_container.style.display = 'block';
    settings_container.style.display = 'none';

    var start_btn = document.getElementsByClassName("run-btn")[0];
    start_btn.style.display = 'block';

    return 0;
}

// ====================
// ===== BOUNDARY =====
// ====================

function applyBoundaryModeStyles() {
    // turn off settings, turn on canvas
    var canvas_container = document.getElementsByClassName("canvas-container")[0];
    var settings_container = document.getElementsByClassName("settings-container")[0];

    canvas_container.style.display = 'block';
    settings_container.style.display = 'none';

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

function updateMousePosition(event) {
    let rect = canvas.getBoundingClientRect(); // do i want to call this every time? ||| do I need to pass canvas here?

    // store current mouse position
    simGlobals.coordinates['x'] = event.clientX - rect.left;
    simGlobals.coordinates['y'] = event.clientY - rect.top;

    // console.log(coordinates);
}

// this function will be refactored/cleaned
// all drawings in this function converted to module, all working
function enterBoundaryCreationMode() {

    // drawing flag and step tracker
    var allowed_to_draw = false; // could be method of Paintbrush
    var boundary_step = "bottom-boundary"; // could be attribute of Boundary? idk..

    // create new boundary
    var new_boundary = new Boundary();

    // this function name doesn't fit well anymore, rename
    applyBoundaryModeStyles();

    // ======================
    // ===== START HERE =====
    // ======================

    Drawings.drawBoundaryDrawingHelpText("Step 1");
    

    // * Skipping the functions for now, focusing on drawing conversion *


    // belongs to class Painbrush, not Boundary
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
                console.log("illegal white line. returning.");
                allowed_to_draw = false;

                // should erase white line (redraw everything except the white line)
                // this should be it's own function too (this same code is repeated in validateBoundaryConnection())
                // draw boilerplate and top&bottom boundaries
                Drawings.drawBoundaryBoilerplate();
                ctx.drawImage(new_boundary.bottom_boundary, 0, 0, canvas.width, canvas.height);
                ctx.drawImage(new_boundary.top_boundary, 0, 0, canvas.width, canvas.height);
                Drawings.drawBoundaryValidationHelpText();

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
            // check boundary step
            if (boundary_step === 'bottom-boundary') {
                let bottom_boundary_is_valid = new_boundary.validateBottom(event);

                if (bottom_boundary_is_valid) {
                    // update step and store boundary
                    new_boundary.save('bottom');
                    boundary_step = "top-boundary";
                    Drawings.drawBoundaryDrawingHelpText("Step 2");
                }
                else {
                    // erase bottom-boundary coords when illegal line drawn
                    new_boundary.bottom_boundary_coordinates = [];

                    // redraw boilerplate
                    Drawings.drawBoundaryBoilerplate();

                    // redraw bottom-step help text
                    Drawings.drawBoundaryDrawingHelpText("Step 1");

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

                    // draw next-step text 
                    Drawings.drawBoundaryValidationHelpText();
                }
                else {
                    // reset top boundary coords when illegal line drawn
                    new_boundary.top_boundary_coordinates = [];

                    // redraw boilerplate and help text
                    Drawings.drawBoundaryBoilerplate();

                    // draw valid bottom-boundary
                    ctx.drawImage(new_boundary.bottom_boundary, 0, 0, canvas.width, canvas.height);

                    Drawings.drawBoundaryDrawingHelpText("Step 2");

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

                    // should display help text on bottom-left area
                    Drawings.drawBoundaryCompletionHelpText();

                    // display button to proceed, hide 'back' btn
                    document.getElementsByClassName("save-boundaries-btn")[0].style.display = 'block';
                    document.getElementsByClassName("stop-btn")[0].style.display = 'none';
                }
                else {
                    // error message

                    // erase line and return to last step
                    // draw boilerplate and top&bottom boundaries
                    Drawings.drawBoundaryBoilerplate();
                    ctx.drawImage(new_boundary.top_boundary, 0, 0, canvas.width, canvas.height);
                    Drawings.drawBoundaryValidationHelpText();
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

    // make class method?
    let save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];

    save_bounds_btn.addEventListener("click", function() {
        console.log("Saving Custom Boundaries");

        // save full boundary
        new_boundary.save('full');

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

// this is a drawing
function prepareToRunSimulation() {
    // clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementsByClassName("settings-btn")[0].style.display = 'none';

    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font = '50px arial';
    ctx.fillText("Simulation Ready", 300, 270);
    ctx.font = '28px arial'
    ctx.fillText("Press 'Run Simulation'", 350, 400);
}

// all drawings for this function moved to drawings.js
async function runPreSimAnimations() {

    // *** pre-sim animations will vary slightly (death, boundary), depending on sim type ***

    // (only with dialogue on!)
    await paintbrush.fadeIn(Drawings.drawSimulationSettings, .01);
    await sleep(2000);
    await paintbrush.fadeOut(Drawings.drawSimulationSettings, .02);

    await paintbrush.fadeIn(Drawings.drawSimulationIntro, .01);
    await sleep(2000);

    await paintbrush.fadeIn(Drawings.drawFakeGoal, .01); // *** this will need to be changed for boundary sims
    await paintbrush.fadeOut(Drawings.drawSimulationIntro, .02);
    await paintbrush.fadeIn(Drawings.drawSimulationExplanation, .01);
    await sleep(4000);

    await paintbrush.fadeOut(Drawings.drawExplanationAndGoal, .02);
    await sleep(1000);

    await paintbrush.fadeIn(Drawings.drawStats, .01);
    await sleep(200);

    return new Promise(resolve => {
        resolve("pre-sim animations complete!");
    })
}

function selectSimulationType() {
    drawInitialSimSelectionScreen();
    turnOnSimTypeSelectionListeners();
}

// example images not final. consider more zoomed-in images
function drawInitialSimSelectionScreen() {
    // let's get the dimensions of my screenshots (300x300 needed)
    let classic_example = document.getElementById("classic-example");
    let boundary_example = document.getElementById("boundary-example");

    // hide start button and clear canvas
    let start_btn = document.getElementsByClassName("start-btn")[0];
    start_btn.style.display = 'none';

    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // show sim-type buttons 
    document.getElementsByClassName("sim-type-classic")[0].style.display = "block";
    document.getElementsByClassName("sim-type-boundary")[0].style.display = "block";

    // could turn this initial drawing into a function too
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.font = '50px arial';
    ctx.fillText("Select Simulation Type", 240, 80);
    ctx.font = '30px arial';
    ctx.fillText("Classic", 190, 500);
    ctx.fillText("Boundary", 690, 500);

    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgb(148, 0, 211)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(100, 150, 300, 300);
    ctx.strokeRect(600, 150, 300, 300);

    // draw images scaled to 300x300
    ctx.drawImage(classic_example, 100, 150, 300, 300);
    ctx.drawImage(boundary_example, 600, 150, 300, 300);   
}

function handleSimTypeBtnMouseover(event) {
    console.log(event.target.className);
    if (event.target.className === 'sim-type-classic') {
        simGlobals.sim_type = highlightClassicSimType();
    }
    else if (event.target.className === 'sim-type-boundary') {
        simGlobals.sim_type = highlightBoundarySimType();
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
            simGlobals.sim_type = highlightClassicSimType();
            break;

        case "ArrowRight":
            simGlobals.sim_type = highlightBoundarySimType();
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

function highlightClassicSimType() {
    console.log("left arrow pressed");

    // highlight classic btn, return boundary btn to normal
    let sim_type_btn_classic = document.getElementsByClassName("sim-type-classic")[0];
    sim_type_btn_classic.style.backgroundColor = 'rgb(155, 245, 0)';
    sim_type_btn_classic.style.color = 'black';

    let sim_type_btn_boundary = document.getElementsByClassName("sim-type-boundary")[0];
    sim_type_btn_boundary.style.backgroundColor = 'rgb(148, 0, 211)';
    sim_type_btn_boundary.style.color = 'rgb(155, 245, 0)';

    // clear rects
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'black';
    ctx.fillRect(70, 120, 870, 450);

    // redraw 'classic' border highlighted
    ctx.strokeStyle = 'rgb(155, 245, 0)';
    ctx.shadowColor = 'rgb(155, 245, 0)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(100, 150, 300, 300);

    // redraw 'classic' text highlighted
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font = '30px arial';
    ctx.fillText("Classic", 190, 500);

    // redraw 'boundary' border normal
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.shadowColor = 'rgb(148, 0, 211)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(600, 150, 300, 300);

    // redraw boundary text normal
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Boundary", 690, 500);

    // redraw example images scaled to 300x300
    let classic_example = document.getElementById("classic-example");
    let boundary_example = document.getElementById("boundary-example");
    ctx.drawImage(classic_example, 100, 150, 300, 300);
    ctx.drawImage(boundary_example, 600, 150, 300, 300);  

    return 'classic';
}

function highlightBoundarySimType() {
    console.log("right arrow pressed");

    // highlight boundary button, return classic button to normal
    let sim_type_btn_boundary = document.getElementsByClassName("sim-type-boundary")[0];
    sim_type_btn_boundary.style.backgroundColor = 'rgb(155, 245, 0)';
    sim_type_btn_boundary.style.color = 'black';

    let sim_type_btn_classic = document.getElementsByClassName("sim-type-classic")[0];
    sim_type_btn_classic.style.backgroundColor = 'rgb(148, 0, 211)';
    sim_type_btn_classic.style.color = 'rgb(155, 245, 0)';

    // clear rects
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'black';
    ctx.fillRect(70, 120, 870, 450);

    // redraw 'boundary' border highlighted
    ctx.strokeStyle = 'rgb(155, 245, 0)';
    ctx.shadowColor = 'rgb(155, 245, 0)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(600, 150, 300, 300);

    // redraw 'boundary' text highlighted
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font = '30px arial';
    ctx.fillText("Boundary", 690, 500);

    // redraw 'classic' border normal
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.shadowColor = 'rgb(148, 0, 211)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(100, 150, 300, 300);

    // redraw 'classic' text normal
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Classic", 190, 500);

    // redraw example images scaled to 300x300
    let classic_example = document.getElementById("classic-example");
    let boundary_example = document.getElementById("boundary-example");
    ctx.drawImage(classic_example, 100, 150, 300, 300);
    ctx.drawImage(boundary_example, 600, 150, 300, 300); 

    return 'boundary';
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

    // update spawn point if boundary simulation
    if (simGlobals.sim_type === 'boundary') {
        spawn_x = simGlobals.INITIAL_X_BOUND;
        spawn_y = simGlobals.INITIAL_Y_BOUND;
    }

    // create equal number of males and females
    for (var i = 0; i < simGlobals.TOTAL_ORGANISMS; i++) {
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
        simGlobals.organisms.push(organism);
    }
    console.log(`FEMALES CREATED: ${female_count}, MALES CREATED: ${male_count}`);

    // consider not making organisms global, but pass it to runGeneration()/runSimulation() from here
}

// ======================
// ===== EVALUATION =====
// ======================

// convert to use animation style that paintbrush uses (frame_id)
function updateAndMoveOrganismsBounds() {
    // 'organisms' was a param but I don't think we need to pass it because it's global
    // updateAndMoveOrganisms() returns a success flag

    return new Promise(resolve => {
        // clear and draw boundary
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(simGlobals.custom_boundary.full_boundary, 0, 0, canvas.width, canvas.height);

        var canvas_data = ctx.getImageData(0, 0, canvas.width, canvas.height); // capture canvas for collision testing
        var finished = false;
        var position_rgba;
        var total_moves = 0;
        let frame_id;

        function animateOrganisms() {

            if (!finished) {
                if (total_moves >= simGlobals.GENE_COUNT * simGlobals.organisms.length) {
                    finished = true;
                }
                else {
                    // clear
                    ctx.fillStyle = 'black';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);

                    // draw boundary
                    ctx.drawImage(simGlobals.custom_boundary.full_boundary, 0, 0, canvas.width, canvas.height);

                    // (FOR TESTING) draw checkpoints
                    // ctx.fillStyle = 'white';
                    // for (let i = 0; i < custom_boundary.checkpoints.length; i++) {
                    //     ctx.beginPath();
                    //     ctx.arc(custom_boundary.checkpoints[i][0], custom_boundary.checkpoints[i][1], 10, 0, Math.PI*2, false);
                    //     ctx.fill();
                    //     ctx.closePath();
                    // }

                    for (let i = 0; i < simGlobals.organisms.length; i++) {
                        if (simGlobals.organisms[i].is_alive) {

                            position_rgba = getPixelXY(canvas_data, simGlobals.organisms[i].x, simGlobals.organisms[i].y);

                            if (position_rgba[0] === 155 && position_rgba[1] === 245) { // consider only checking one value for performance

                                let survived = Math.random() < simGlobals.RESILIENCE;

                                if (survived) {
                                    // instead of update and move, move organism to inverse of last movement, update index

                                    // get inverse of last gene
                                    let inverse_x_gene = (simGlobals.organisms[i].genes[simGlobals.organisms[i].index - 1][0]) * -1;
                                    let inverse_y_gene = (simGlobals.organisms[i].genes[simGlobals.organisms[i].index - 1][1]) * -1;

                                    // update
                                    simGlobals.organisms[i].x += inverse_x_gene;
                                    simGlobals.organisms[i].y += inverse_y_gene;

                                    // increase index
                                    simGlobals.organisms[i].index++;

                                    // move
                                    simGlobals.organisms[i].move();
                                }
                                else {
                                    simGlobals.organisms[i].is_alive = false;
                                    ctx.fillStyle = 'red';
                                    ctx.beginPath();
                                    ctx.arc(
                                        simGlobals.organisms[i].x, simGlobals.organisms[i].y,
                                        simGlobals.organisms[i].radius, 0, Math.PI*2, false
                                    );
                                    ctx.fill();
                                }
                            }
                            else {
                                simGlobals.organisms[i].update();
                                simGlobals.organisms[i].move();
                            }
                        }
                        else {
                            // draw deceased organism
                            ctx.fillStyle = 'red';
                            ctx.beginPath();
                            ctx.arc(simGlobals.organisms[i].x, simGlobals.organisms[i].y, simGlobals.organisms[i].radius, 0, Math.PI*2, false);
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

function updateAndMoveOrganisms(goal) {
    return new Promise(resolve => {
        let total_moves = 0;
        let finished = false;
        let success_flag = false;
        let frame_id;

        // why is this async?
        async function animateOrganisms() {
            if (!finished) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                goal.drawGoal();
                goal.showStatistics();

                if (simGlobals.dialogue) {
                    drawStaticEvaluationPhaseText();
                }

                for (var i = 0; i < simGlobals.organisms.length; i++) {
                    if (simGlobals.organisms[i].reached_goal == false) {
                        simGlobals.organisms[i].update();
                        simGlobals.organisms[i].move();
                        hasReachedGoal(simGlobals.organisms[i], goal);
                    }
                    else {
                        updateSuccessfulOrganism(simGlobals.organisms[i]);
                        success_flag = true;
                    }
                    total_moves++;
                }
                if (total_moves == (simGlobals.organisms.length * simGlobals.GENE_COUNT)) {
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

// not ready to convert yet **
async function runEvaluationAnimation() {

    // ** not doing updateAndMove(), only fades for now

    // need to draw goal at location depending on sim type
    if (simGlobals.sim_type === 'classic') {
        var goal = new Goal(simGlobals.GOAL_X_POS, simGlobals.GOAL_Y_POS, 20, ctx);
        var success_flag = await updateAndMoveOrganisms(goal); // ideally don't pass in goal here
    }
    else {
        // var goal = new Goal(GOAL_X_POS_BOUNDS, GOAL_Y_POS_BOUNDS, 20, ctx); not sure if needed (goal saved in boundary drawing)
        var success_flag = await updateAndMoveOrganismsBounds();
    }

    // updateAndMoveOrganisms() is the classic version of boundary sim's updateAndMoveOrganismsBounds()
    // we can combine them (standalone for now)

    return new Promise((resolve, reject) => {
        if (success_flag) {
            resolve(true);
        }
        else {
            resolve(false);
        }
    })
}

function getShortestDistanceToGoal() {

    var shortest_distance = 10000;
    var closest_organism_index;

    // though this loop identifies closest organism, it ALSO updates organism's distance_to_goal attribute
    for (var i = 0; i < simGlobals.organisms.length; i++) {
        var distance_to_goal = simGlobals.organisms[i].calcDistanceToGoal();
        if (distance_to_goal < shortest_distance) {
            shortest_distance = distance_to_goal;
            closest_organism_index = i;
        }
    }

    var closest_organism = simGlobals.organisms[closest_organism_index];

    return closest_organism;
}

function getShortestDistanceToNextCheckpoint(next_checkpoint) {
    var shortest_distance_to_checkpoint = 10000;
    var closest_organism;

    // calculate distance to closest checkpoint not yet reached
    for (let n = 0; n < simGlobals.organisms.length; n++) {
        // in future, make sure organism is alive before calculating its distance !!!!!!! (or remove deceased organisms from array)
        // distance^2 = a^2 + b^2
        let horizontal_distance_squared = (simGlobals.organisms[n].x - simGlobals.custom_boundary.checkpoints[next_checkpoint].coordinates[0]) ** 2;
        let vertical_distance_squared = (simGlobals.organisms[n].y - simGlobals.custom_boundary.checkpoints[next_checkpoint].coordinates[1]) ** 2;
        let distance_to_checkpoint_squared = horizontal_distance_squared + vertical_distance_squared;

        simGlobals.organisms[n].distance_to_next_checkpoint = Math.sqrt(distance_to_checkpoint_squared);
        console.log("Distance to next-closest checkpoint for organism " + n + ":");
        console.log(simGlobals.organisms[n].distance_to_next_checkpoint);

        if (simGlobals.organisms[n].distance_to_next_checkpoint < shortest_distance_to_checkpoint) {
            shortest_distance_to_checkpoint = simGlobals.organisms[n].distance_to_next_checkpoint;
            closest_organism = simGlobals.organisms[n]; // return only index if works better
        }
    }
    // we should have each organism's distance the closest checkpoint not yet reached.
    return closest_organism;
}

function calcPopulationFitness () {
    return new Promise(resolve => {
        // reset total_fitness before calculation
        simGlobals.total_fitness = 0;
        for (var i = 0; i < simGlobals.organisms.length; i++) {
            simGlobals.organisms[i].calcFitness();
            simGlobals.total_fitness += simGlobals.organisms[i].fitness;
        }

        // redundant, fix
        simGlobals.average_fitness = simGlobals.total_fitness / simGlobals.organisms.length;
        resolve(simGlobals.average_fitness);
    })
}

function calcPopulationFitnessBounds(remaining_distance) {
    // scale = length of lines connecting epicenters from spawn>checkpoints>goal
    let scale = simGlobals.scale_statistics['scale'];

    // calc/set distance_to_goal && fitness
    simGlobals.total_fitness = 0.00;
    for (let i = 0; i < simGlobals.organisms.length; i++) {

        // this also sets each organism's distance_to_goal attribute
        simGlobals.organisms[i].calcDistanceToGoalBounds(remaining_distance);

        // this also sets each organism's fitness attribute
        simGlobals.organisms[i].calcFitnessBounds(scale);

        simGlobals.total_fitness += simGlobals.organisms[i].fitness;
    }

    // set average fitness
    simGlobals.average_fitness = simGlobals.total_fitness / simGlobals.organisms.length;

    return simGlobals.average_fitness;
}

async function evaluatePopulation() {
    // to do
    const shortest_distance_resolution = await getShortestDistanceToGoal();
    simGlobals.average_fitness = await calcPopulationFitness();

    // also redundant, fix
    var population_resolution = {
        'closest_organism': shortest_distance_resolution,
        'average_fitness': simGlobals.average_fitness
    }

    return new Promise(resolve => {
        resolve(population_resolution);
    })
}

// *DRAWING*
function drawStaticEvaluationPhaseText() {
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

// *DRAWING*
function updateSuccessfulOrganism(organism) {
    organism.ctx.fillStyle = 'red';
    organism.ctx.beginPath();
    organism.ctx.arc(organism.x, organism.y, organism.radius, 0, Math.PI*2, false);
    organism.ctx.fill();
}

// =====================
// ===== SELECTION =====
// =====================

function beginSelectionProcess() {
    // fill array with candidates for reproduction
    var potential_mothers = [];
    var potential_fathers = [];

    for (var i = 0; i < simGlobals.organisms.length; i++) {
        // Give organisms with negative fitness a chance to reproduce
        if (simGlobals.organisms[i].fitness < 0) {
            simGlobals.organisms[i].fitness = 0.01;
        }

        // I'm going to try this implementation >> (organism.fitness * 100) ** 1.25
        for (var j = 0; j < Math.ceil((simGlobals.organisms[i].fitness * 100) ** 2); j++) {
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

    var parents = [];
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
    await paintbrush.fadeOut(Drawings.drawOrganisms, .05);
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

    for (var j = 0; j < simGlobals.GENE_COUNT; j++) {
        // select if mother or father gene will be used (50% probability)
        var random_bool = Math.random();

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
    for (var i = 0; i < parents.length; i++) {
        var offspring_count = determineOffspringCount();

        for (var j = 0; j < offspring_count; j++) {
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

// *DRAWING*
function drawSuccessMessage(opacity) {
    // if this looks bad, it's because it doesn't have a clearRect()

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

}

// clears text area and redraws organisms where they were
function redrawOrganisms() {
    ctx.fillStyle = 'black';
    ctx.clearRect(235, 231, 550, 235);

    // redraw organisms
    for (var i = 0; i < organisms.length; i++) {
        organisms[i].move();
    }
}

// untested
// *DRAWING*
function drawExtinctionMessage() {
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

    var title_organisms = createTitleScreenOrganisms();

    // create paintbrush as window object
    createPaintbrush();
    
    do {
        console.log("Starting Title Animation");

        var status = await fadeInTitleAnimation(title_organisms);

        // if (status === "Display Settings") {
        //     console.log("Displaying Settings");
        //     displaySettingsForm();
        // }
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
async function runGeneration() {

    if (simGlobals.dialogue) {
        // looks weird for now (opacity doesn't start at 0) (fix when polishing)
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseEntryText, .02);
    }

    // Phase: Evaluate Individuals
    // this is where statistics are redrawn (goal.showStatistics())
    if (simGlobals.simulation_succeeded) {


        // skipping this (updateAndMove() not converted yet)
        await runEvaluationAnimation();


    }
    else {
        // check if simulation succeeded 
        let success_flag = await runEvaluationAnimation();
        console.log(`Success Flag: ${success_flag}`);

        // here, if success flag is true, we can await the success animation
        // ***** skipping for now (want to get core animation converted before win scenario) *****
        if (success_flag) {
            // update flag
            simulation_succeeded = true;

            // give user time to see their win
            await sleep(1500);
            await paintbrush.fadeIn(drawSuccessMessage, .02); // untested

            do {
                var key_pressed = await getUserDecision();
                console.log(key_pressed);
            }
            while (key_pressed != "Enter" && key_pressed != "q");

            console.log("Key Accepted: " + key_pressed);

            await paintbrush.fadeOut(drawSuccessMessage, .05);
            redrawOrganisms(); // not tested yet (could try using rAF for one frame to ensure user sees?)

            if (key_pressed === 'Enter') {
                console.log("Continuing Simulation.");
                await sleep(500);
            }
            else if (key_pressed === 'q') {
                console.log("Quitting Simulation.");

                await paintbrush.fadeOut(drawOrganisms, .05);

                // possibly fade stats to black here too?
                stopSimulation();
            }
        }
    }

    if (simGlobals.dialogue) {
        // await paintbrush.fadeToNewColor(drawEvaluationPhaseExitText, .02);
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseExitText, .02);

        // await paintbrush.fadeOut(drawStats, .02); // put here to fade out stats before average fitness updated
        await paintbrush.fadeOut(Drawings.drawStats, .02); // put here to fade out stats before average fitness updated

        await sleep(1000);
    }

    // store length of organisms array before deceased organisms filtered out for reproduction (boundary sims)
    var next_gen_target_length = simGlobals.organisms.length;

    if (simGlobals.sim_type === 'classic') {
        const population_resolution = await evaluatePopulation(); // maybe don't await here
        var closest_organism = population_resolution['closest_organism'];
        simGlobals.average_fitness = population_resolution['average_fitness'];
    }
    else if (simGlobals.sim_type === 'boundary') {
        // we will follow the logic of the 'classic' sim type 

        // remove deceased organisms from array (organisms array is evaluated multiple times and deceased organisms aren't used)
        console.log(`before checkPulse(): ${simGlobals.organisms.length}`);

        // reassign (.filter() does not change array)
        simGlobals.organisms = simGlobals.organisms.filter(checkPulse);
        console.log(`after checkPulse(): ${simGlobals.organisms.length}`);

        // draw checkpoints for reference
        simGlobals.custom_boundary.drawCheckpoints();

        // here, we set checkpoints[i].distance_to_goal 
        // should this only be done on iteration #1???
        calcDistanceToGoalCheckpoints();

        // get previous, current, and next checkpoints for current generation
        var checkpoint_data = getFarthestCheckpointReached();

        // this will set each organism's distance_to_next_checkpoint attribute
        var closest_organism = getShortestDistanceToNextCheckpoint(checkpoint_data['next']);

        // distance_to_goal = distance_to_next_checkpoint + next_checkpoint.distance_to_goal
        // 'next' will give us the index in the checkpoints array of the checkpoint we want to measure from
        var remaining_distance = simGlobals.custom_boundary.checkpoints[checkpoint_data['next']].distance_to_goal;

        // this function also will set each organism's distance_to_goal and fitness attributes
        // [] make sure this doesn't include deceased organisms (unless on purpose)
        simGlobals.average_fitness = calcPopulationFitnessBounds(remaining_distance);

        console.log(`Average Fitness: ${simGlobals.average_fitness}`);
    }

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
        await sleep(1000);

        await runSelectionAnimations(closest_organism, parents);

        await paintbrush.fadeToNewColor(Drawings.drawSelectionPhaseExitText, .02);
    }

    // PHASE: CROSSOVER / MUTATE / REPRODUCE

    // follow same naming convention for these animations!
    if (simGlobals.dialogue) {
        // this function handles crossover, mutation and reproduction
        // this function pushes new gen organisms to offspring_organisms[]
        // consider combing to make function
        reproduceNewGeneration(parents);

        await paintbrush.fadeToNewColor(Drawings.drawCrossoverPhaseEntryText, .02);
        await paintbrush.fadeIn(Drawings.drawCrossoverDescriptionText, .025);
        await sleep(2000);
        await paintbrush.fadeOut(Drawings.drawCrossoverDescriptionText, .025);
        await paintbrush.fadeToNewColor(Drawings.drawCrossoverPhaseExitText, .02);

        await paintbrush.fadeToNewColor(Drawings.drawMutationPhaseEntryText, .02);
        await paintbrush.fadeIn(Drawings.drawMutationDescriptionText, .025);
        await sleep(2000);
        await paintbrush.fadeOut(Drawings.drawMutationDescriptionText, .025);
        await paintbrush.fadeToNewColor(Drawings.drawMutationPhaseExitText, .02);

        await paintbrush.fadeToNewColor(Drawings.drawCreateNewGenPhaseEntryText, .02);
        await paintbrush.fadeIn(Drawings.drawGenerationSummaryText, .025);
        await sleep(2000);
        await paintbrush.fadeOut(Drawings.drawGenerationSummaryText, .025);
        await paintbrush.fadeToNewColor(Drawings.drawCreateNewGenPhaseExitText, .02);
    }
    else {
        // without dialogue, we need to fade the organisms to black before reproduceNewGeneration() forgets old population
        await sleep(1000);
        // await fadeToBlack(organisms); // keep just in case
        await paintbrush.fadeOut(Drawings.drawOrganisms, .05); // untested
        await sleep(1000);
        reproduceNewGeneration(parents);
    }

    return new Promise(resolve => {
        simGlobals.generation_count++;
        console.log("MADE IT HERE");
        resolve(simGlobals.generation_count);
    })
}

async function runSimulation () {

    // remove run-btn listener
    document.getElementsByClassName("run-btn")[0].removeEventListener('click', runSimulation);

    simGlobals.simulation_started = true;

    console.log("Running Simulation with these settings:");
    console.log(`Total Organisms: ${simGlobals.TOTAL_ORGANISMS}`);
    console.log(`Gene Count: ${simGlobals.GENE_COUNT}`);
    console.log(`Resilience: ${simGlobals.RESILIENCE}`);
    console.log(`Mutation Rate: ${simGlobals.MUTATION_RATE}`);
    console.log(`Min/Max Gene: [${simGlobals.MIN_GENE}, ${simGlobals.MAX_GENE}]`);
    console.log(`Dialogue: ${simGlobals.dialogue}`);

    // make start/settings buttons disappear, display stop simulation button
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("settings-btn")[0].style.display = 'none';
    document.getElementsByClassName("stop-btn")[0].style.display = 'block';

    // pre-sim animations *****
    await runPreSimAnimations();

    /// PHASE: CREATE NEW GENERATION/POPULATION
    createOrganisms();
    console.log("Amount of organisms created = " + simGlobals.organisms.length);

    do {
        const result = await runGeneration();
        console.log(result);
    } while (simGlobals.generation_count < 1000);
}

function stopSimulation() {
    // reloads the page
    document.location.reload();
}

// ============================
// ===== EXTRAS / UNKNOWN =====
// ============================

// keep just in case
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

// *DRAWING*
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

// *DRAWING*
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

// *DRAWING*
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

    var scale = 0.00;

    // will store length of checkpoint to the next checkpoint
    var checkpoint_to_checkpoint_lengths = [];

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

    var distance_from_final_checkpoint_to_goal = Math.sqrt(distance_squared_to_goal);

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
    var i = index * 4;
    var data = canvas_data.data;

    return [data[i], data[i+1], data[i+2], data[i+3]];
}

function getPixelXY(canvas_data, x, y) {
    var index = y * canvas_data.width + x;

    // how it works?
    // say we're at position (2, 2) on canvas, and canvas is 1000px wide
    // index = (2 * 1000) + 2 = 2002
    // reading left to right, pixel at (2, 2) is pixel #2002 ?

    return getPixel(canvas_data, index);
}

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

function getFarthestCheckpointReached() {
    // !!!!! consider passing the previous gen's farthest checkpoint reached as a minimum-value !!!!!

    // **NOTE: this function doesn't handle when 0 checkpoints are reached yet !!**

    // we should loop over checkpoints, check all organisms, rather than loop over all organisms, check every checkpoint
    // this will allow us to stop once an organism is found (backwards loop)

    var previous_checkpoint;
    var current_checkpoint;
    var next_checkpoint;
    var reached_checkpoint = false;

    for (let k = simGlobals.custom_boundary.checkpoints.length - 1; k >= 0; k--) {
        console.log("k-loop iteration started");
        if (reached_checkpoint) {
            console.log("breaking out of k-loop, checkpoint was reached");
            break;
        }
        for (let j = 0; j < simGlobals.organisms.length; j++) {
            console.log("j-loop iteration started");
            // determine if organism is within the perimeter of the current checkpoint being checked
            let x_lower_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[0]) - simGlobals.custom_boundary.checkpoints[k].size;
            let x_upper_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[0]) + simGlobals.custom_boundary.checkpoints[k].size;
            let y_lower_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[1]) - simGlobals.custom_boundary.checkpoints[k].size;
            let y_upper_bound = (simGlobals.custom_boundary.checkpoints[k].coordinates[1]) + simGlobals.custom_boundary.checkpoints[k].size;

            // can replace vars with definitions once confident working
            // check if organism within x && y bounds of checkpoint we're checking
            if (simGlobals.organisms[j].x > x_lower_bound && simGlobals.organisms[j].x < x_upper_bound) {
                if (simGlobals.organisms[j].y > y_lower_bound && simGlobals.organisms[j].y < y_upper_bound) {

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

// deprecated || make sure no code in here needs to be used before deletion
async function testBoundarySim() {
    // update flag to resolve playTitleScreenAnimation()
    simulation_started = true;

    // clear
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 10 organisms this time
    for (var i = 0; i < 220; i++) {
        organism = new Organism('male', INITIAL_X_BOUND, INITIAL_Y_BOUND, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }

    await updateAndMoveOrganismsBounds(organisms);
    console.log("Hit Detection Test Complete.");

    // at last, we finally have checkpoints that are dynamically sized.

    // code here was moved to getFarthestCheckpointReached();
    var checkpoint_data = getFarthestCheckpointReached();

    console.log("Loops over, drawing checkpoints");

    // draw the checkpoint that was reached
    drawCurrentCheckpoint(checkpoint_data["current"]);

    // draw the previous checkpoint (the checkpoint fitness is measured from)
    drawPreviousCheckpoint(checkpoint_data["previous"]);

    // draw the next checkpoint not reached (the checkpoint fitness measured to)
    drawNextCheckpoint(checkpoint_data["next"]);

    console.log("done drawing checkpoints");

    // with the next checkpoint not yet reached, we can determine fitness!

    // =====FITNESS FUNCTION FOR BOUNDARY SIMULATIONS=====
    // we can now do this very similarly to the OG simulation fitness function
    // as always, this will become class methods when integrated into full program

    // before fitness, we must calculate each organism's distance to the closest checkpoint not yet reached

    // var closest_organism = getShortestDistanceToNextCheckpoint(checkpoint_data['next']);

    // let's imagine some scenarios and what should happen in them:
    // * no checkpoint reached
    // - fitness based on distance from spawn point to checkpoint #2

    // * checkpoint #1 reached [0]
    // - fitness based on distance from spawn to checkpoint #2 [1] (same as scenario 1)

    // * checkpoint #2 reached [1]
    // - fitness based on distance from checkpoint #1 [0] to checkpoint #3 [2]

    // * checkpoint #3 reached [2]
    // - fitness based on distance from checkpoint #2 [1] to checkpoint #4 [3]

    // ** general rule: fitness based on distance from checkpoint_reached - 1 to checkpoint reached + 1
    // - negative-fitness organisms will be given a small chance to be selected

    // * final checkpoint reached [9]
    // - fitness based on distance from checkpoint #8 to goal

    // when a checkpoint is reached, ex. checkpoint #4, future generations will automatically receive 'credit' for reaching checkpoint#4
    // (checkpoint reached cannot descend)

    // to calculate fitness, we need:
    // 1. the point we're measuring from (spawn point or checkpoint) (previous_checkpoint)
    // 2. the point we're measuring to (closest checkpoint not yet reached) (next_checkpoint)
    // 3. organisms' distance to closest checkpoint not yet reached (organism.distance_to_next_checkpoint)

    // we will measure k-1 >> k+1 as a straight line, as an organism's distance to k+1 is a straight line

    // ============= now, we determine fitness ========================
    // here is the original fitness function for normal sims:

    // -
    // height = distance between starting location(y) and goal.y
    // var height = INITIAL_Y - GOAL_Y_POS;

    // var normalized_distance_to_goal = this.distance_to_goal / height;
    // this.fitness = 1 - normalized_distance_to_goal;
    // -

    // this works because distance_to_goal will never be greater than 'height' (the max distance to goal) unless organism goes backwards

    // we'll refer to 'height' as 'scale' for this fitness function
    // (try to combine fitness functions together for both sims?)

    console.log("caclulating fitness for each organism...");

    // var scale = setScaleOld(previous_checkpoint, next_checkpoint);
    // console.log(`Scale: ${scale}`);

    // // with our scale, we can now create a fitness score for each organism using scale and an organism's distance to next checkpoint
    // // make function

    // calcPopulationFitnessBounds(scale);

    // testing new boundary fitness =====================================
    // this will require an adjustment to setScaleOld() too.
    // do it in here, make functions when working.
    // **changed checkSimType() to call testBoundarySim() while testing**

    // set new scale as the distance from spawn to goal, using the sum of distances between checkpoints 
    // (include spawn>>>checkpoint[0] and checkpoint[last]>>>goal in distance calc)
    // consider recursion here? base case = i === 0

    var scale = 0.00;
    // iterative approach
    for (let i = 0; i < custom_boundary.checkpoints.length; i++) {
        // add distance from spawn to checkpoint[0] on first iteration
        if (i === 0) {
            // c*2 = a*2 + b^2
            let horizontal_distance_squared = (INITIAL_X_BOUND - custom_boundary.checkpoints[i].coordinates[0]) ** 2;
            let vertical_distance_squared = (INITIAL_Y_BOUND - custom_boundary.checkpoints[i].coordinates[1]) ** 2;
            let distance_squared = horizontal_distance_squared + vertical_distance_squared;
            let distance_from_spawn_to_first_checkpoint = Math.sqrt(distance_squared);
            scale += distance_from_spawn_to_first_checkpoint;
        }
        else {
            // get horizontal distance from last checkpoint to current
            let horizontal_distance_squared = (
                custom_boundary.checkpoints[i].coordinates[0] - 
                custom_boundary.checkpoints[i-1].coordinates[0]) ** 2;
            
            let vertical_distance_squared = (
                custom_boundary.checkpoints[i].coordinates[1] - 
                custom_boundary.checkpoints[i-1].coordinates[1]) ** 2;
            
            let distance_squared = horizontal_distance_squared + vertical_distance_squared;
            let distance_from_previous_checkpoint_to_current = Math.sqrt(distance_squared);

            // update scale
            scale += distance_from_previous_checkpoint_to_current;
        }
    }

    // add distance from final checkpoint to goal to scale
    let final_to_goal_horizontal_distance_squared = (
        custom_boundary.checkpoints[custom_boundary.checkpoints.length - 1].coordinates[0] - GOAL_X_POS_BOUNDS) ** 2;
    let final_to_goal_vertical_distance_squared = (
        custom_boundary.checkpoints[custom_boundary.checkpoints.length - 1].coordinates[1] - GOAL_Y_POS_BOUNDS) ** 2;
    let distance_squared = final_to_goal_horizontal_distance_squared + final_to_goal_vertical_distance_squared;

    var distance_from_final_checkpoint_to_goal = Math.sqrt(distance_squared);

    scale += distance_from_final_checkpoint_to_goal;

    console.log(`final scale: ${scale}`);

    // to test this, draw a boundary straight to the goal and compute its distance.
    // if our new scale is correct, it should be very similar (again, assuming straight line to goal)

    // let's calc the distance of a straight line from spawn to goal
    let a_squared = (INITIAL_X_BOUND - GOAL_X_POS_BOUNDS) ** 2;
    let b_squared = (INITIAL_Y_BOUND - GOAL_Y_POS_BOUNDS) ** 2;
    let c_squared = a_squared + b_squared;
    let distance_straight_line_spawn_to_goal = Math.sqrt(c_squared);

    // compare, and let's see if they are close
    // this is only useful on straight-line boundary to goal
    console.log(`scale and straight line distance from spawn to goal computed.`);
    console.log(`Scale: ${scale}`);
    console.log(`Straight-line spawn to goal: ${distance_straight_line_spawn_to_goal}`);

    // they came out the same! new scale function is complete (could separate spawn>>first_checkpoint distance to own function on integration)

    // === stopped here ===
    // new fitness function

    // here is the original fitness function for normal sims for reference:

    // -
    // height = distance between starting location(y) and goal.y
    // var height = INITIAL_Y - GOAL_Y_POS;

    // var normalized_distance_to_goal = this.distance_to_goal / height;
    // this.fitness = 1 - normalized_distance_to_goal;
    // -

    // === pseudo ===
    // we already have scale
    // var normalized_distance_to_goal = organisms_distance_to goal / scale
    // - organisms_distance_to_goal is its distance to next_checkpoint + distance of next_checkpoint to goal (already have this)
    
    // calculate organisms distance to next_checkpoint
    // this also updates each organism's distance_to_next_checkpoint attribute
    var closest_organism = getShortestDistanceToNextCheckpoint(checkpoint_data["next"]);

    // calculate distance of next_checkpoint_to_goal
    var cumulative_distance = 0.00;
    for (let index = checkpoint_data['next'] + 1; index < custom_boundary.checkpoints.length; index++) {
        let horizontal_squared = (
            custom_boundary.checkpoints[index].coordinates[0] - 
            custom_boundary.checkpoints[index-1].coordinates[0]) ** 2;

        let vertical_squared = (
            custom_boundary.checkpoints[index].coordinates[1] -
            custom_boundary.checkpoints[index-1].coordinates[1]) ** 2;

        let distance_squared = horizontal_squared + vertical_squared;

        cumulative_distance += Math.sqrt(distance_squared);
    }

    var distance_from_next_checkpoint_to_goal = cumulative_distance;
    console.log(`distance from next checkpoint to goal = ${distance_from_next_checkpoint_to_goal}`);

    // == new fitness function ==
    var normalized_distance_to_goal;
    var boundary_total_fitness = 0.00;
    for (let i = 0; i < organisms.length; i++) {
        normalized_distance_to_goal = (organisms[i].distance_to_next_checkpoint + distance_from_next_checkpoint_to_goal) / scale;
        organisms[i].fitness = 1 - normalized_distance_to_goal;
        console.log(`fitness for organism ${i}: ${organisms[i].fitness}`);
        boundary_total_fitness += organisms[i].fitness;
    }
    var boundary_average_fitness = boundary_total_fitness / organisms.length;
    console.log(`avg fitness: ${boundary_average_fitness}`);
}

function checkPulse(organism) {
    console.log(`alive?: ${organism.is_alive}`);
    return organism.is_alive;
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
            var key = event.key;
            resolve(key);
        });
    })
}

function getRandomGene(min, max) {
    var random_x = Math.floor(Math.random() * (max - min + 1) + min);
    var random_y = Math.floor(Math.random() * (max - min + 1) + min);
    var random_gene = [random_x, random_y];
    return random_gene;
}