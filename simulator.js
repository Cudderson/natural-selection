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

// boundary simulations start organisms/goal at different location
const INITIAL_X_BOUND = 50;
const INITIAL_Y_BOUND = 550;
const GOAL_X_POS_BOUNDS = 925;
const GOAL_Y_POS_BOUNDS = 50;

// boundary globals
var custom_boundary;
var scale_statistics;

// flags
var sim_type;
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

// ********** name conflicts with canvas_data in updateAndMoveOrganismsBounds, need to fix
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
        this.distance_to_goal; // for normal and boundary sim types
        this.distance_to_next_checkpoint; //for boundary sim type
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

    calcDistanceToGoalBounds(remaining_distance) {
        this.distance_to_goal = this.distance_to_next_checkpoint + remaining_distance;
    }

    // should combine fitness functions when available
    calcFitness() {
        // height = distance between starting location(y) and goal.y
        var height = INITIAL_Y - GOAL_Y_POS;

        var normalized_distance_to_goal = this.distance_to_goal / height;
        this.fitness = 1 - normalized_distance_to_goal;
    }

    calcFitnessBounds(scale) {
        // ideally don't have to pass in scale here
        var normalized_distance_to_goal = this.distance_to_goal / scale;
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
        var line_counter=  0;

        for (let i = 0; i < this.top_boundary_coordinates.length; i++) {
            // step 2: draw a line from top[coordinate] to bottom[coordinate]
            // let's say, for now, that we want just 10 lines drawn
            // we could divide the total by 10, 243 / 10 = 24.3
            // if i % Math.ceil(24.3) === 0: draw line
            if (i % step === 0) {
                ctx.beginPath();
                ctx.moveTo(this.top_boundary_coordinates[i][0], this.top_boundary_coordinates[i][1])
                ctx.lineTo(this.bottom_boundary_coordinates[i][0], this.bottom_boundary_coordinates[i][1]);
                ctx.stroke();
                ctx.closePath();
                line_counter++;

                // draw dot on middle of each line (distance between x's - distance between y's)
                let mid_x = Math.floor((this.top_boundary_coordinates[i][0] + this.bottom_boundary_coordinates[i][0]) / 2); 
                let mid_y = Math.floor((this.top_boundary_coordinates[i][1] + this.bottom_boundary_coordinates[i][1]) / 2);
                ctx.beginPath();
                ctx.arc(mid_x, mid_y, 2, 0, Math.PI*2, false);
                ctx.fill();

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
            ctx.beginPath();
            ctx.moveTo(this.checkpoints[j].coordinates[0], this.checkpoints[j].coordinates[1]);
            ctx.lineTo(this.checkpoints[j+1].coordinates[0], this.checkpoints[j+1].coordinates[1]);
            ctx.stroke();
            ctx.closePath();

            // let's now mark the halfway point between each line drawn
            let path_mid_x = Math.floor((this.checkpoints[j].coordinates[0] + this.checkpoints[j+1].coordinates[0]) / 2);
            let path_mid_y = Math.floor((this.checkpoints[j].coordinates[1] + this.checkpoints[j+1].coordinates[1]) / 2);
            ctx.fillStyle = 'orange';
            ctx.beginPath();
            ctx.arc(path_mid_x, path_mid_y, 5, 0, Math.PI*2, false);
            ctx.fill();
            ctx.closePath();

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

// class Paintbrush() {}

// Main Drivers
async function runPreSimAnimations() {

    // *** pre-sim animations will vary slightly (death, boundary), depending on sim type ***

    // (only with dialogue on!)
    await fadeInSimulationSettings();
    await sleep(2000);
    await fadeOutSimulationSettings();
    await fadeInSimulationIntro();
    await sleep(2000);
    await fadeInFakeGoal(); // *** this will need to be changed for boundary sims
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

// this function will be deleted after integration, can just call runSimulation() directly
function checkSimType() {
    // eventually, both sims will be the same, this is for testing
    if (custom_boundary) {
        // testing new boundary fitness function
        // testBoundarySim();

        // integration testing
        runSimulation();
    }
    else {
        console.log("nope");
        runSimulation();
    }
}

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

    for (let i = 1; i < custom_boundary.checkpoints.length; i++) {
        // compute distance from last checkpoint to current
        let horizontal_distance_squared = (
            custom_boundary.checkpoints[i].coordinates[0] - 
            custom_boundary.checkpoints[i-1].coordinates[0]) ** 2;
        
        let vertical_distance_squared = (
            custom_boundary.checkpoints[i].coordinates[1] - 
            custom_boundary.checkpoints[i-1].coordinates[1]) ** 2;
        
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
    let horizontal_distance_squared = (INITIAL_X_BOUND - custom_boundary.checkpoints[0].coordinates[0]) ** 2;
    let vertical_distance_squared = (INITIAL_Y_BOUND - custom_boundary.checkpoints[0].coordinates[1]) ** 2;
    let distance_squared = horizontal_distance_squared + vertical_distance_squared;
    let distance_from_spawn_to_first_checkpoint = Math.sqrt(distance_squared);

    // update scale
    scale += distance_from_spawn_to_first_checkpoint;

    // add distance from final checkpoint to goal to scale
    let final_to_goal_horizontal_distance_squared = (
        custom_boundary.checkpoints[custom_boundary.checkpoints.length - 1].coordinates[0] - GOAL_X_POS_BOUNDS) ** 2;
    let final_to_goal_vertical_distance_squared = (
        custom_boundary.checkpoints[custom_boundary.checkpoints.length - 1].coordinates[1] - GOAL_Y_POS_BOUNDS) ** 2;

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
    var index = y * canvas_data.width + x; // *** not sure how this works but it does ***

    // return index;
    return getPixel(canvas_data, index);
}

function calcDistanceToGoalCheckpoints() {
    var scale = scale_statistics['scale'];
    var checkpoint_to_checkpoint_lengths = scale_statistics['checkpoint_lengths'];
    var spawn_to_checkpoint_0_length = scale_statistics['spawn_to_checkpoint_0_length'];
    var last_checkpoint_to_goal_length = scale_statistics['last_checkpoint_to_goal_length']; // keep for comparison

    var adjusted_scale;

    // checkpoint_to_checkpoint_lengths[0] = checkpoints[0] distance to next checkpoint
    for (let i = 0; i < custom_boundary.checkpoints.length; i++) {
        if (i === 0) {
            // distance to goal for first checkpoint = scale - distance_from_spawn_to_first_checkpoint
            adjusted_scale = scale - spawn_to_checkpoint_0_length;
            custom_boundary.checkpoints[i].distance_to_goal = adjusted_scale;
        }
        else {
            // i-1 will give us the length of the previous checkpoint to the current
            adjusted_scale -= checkpoint_to_checkpoint_lengths[i-1];
            custom_boundary.checkpoints[i].distance_to_goal = adjusted_scale;
        }
    }
}

// needs to be updated for new class Boundary() (make class method?)
function updateAndMoveOrganismsBounds() {
    // 'organisms' was a param but I don't think we need to pass it because it's global
    // updateAndMoveOrganisms() returns a success flag

    return new Promise(resolve => {
        // clear and draw boundary
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(custom_boundary.full_boundary, 0, 0, canvas.width, canvas.height);

        var canvas_data = ctx.getImageData(0, 0, canvas.width, canvas.height); // capture canvas for collision testing
        var finished = false;
        var position_rgba;
        var total_moves = 0;

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

                    // (FOR TESTING) draw checkpoints
                    // ctx.fillStyle = 'white';
                    // for (let i = 0; i < custom_boundary.checkpoints.length; i++) {
                    //     ctx.beginPath();
                    //     ctx.arc(custom_boundary.checkpoints[i][0], custom_boundary.checkpoints[i][1], 10, 0, Math.PI*2, false);
                    //     ctx.fill();
                    //     ctx.closePath();
                    // }

                    // do it with 10 organisms
                    for (var j = 0; j < organisms.length; j++) {

                        // update index
                        if (organisms[j].is_alive) {
                            organisms[j].update();
                        }

                        position_rgba = getPixelXY(canvas_data, organisms[j].x, organisms[j].y);
                        
                        // console.log(`Current Position Pixel for Organism ${j}: ` + position_rgba);

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
                // ======! resolving 'false' until success logic implemented !======
                resolve(false);
            }
        }
        start_test_guy_animation = requestAnimationFrame(animateOrganisms);
    })
}

// moved here for integration from evaluation phase section
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

function getFarthestCheckpointReached() {
    // **NOTE: this function doesn't handle when 0 checkpoints are reached yet !!**

    // we should loop over checkpoints, check all organisms, rather than loop over all organisms, check every checkpoint
    // this will allow us to stop once an organism is found (backwards loop)

    var previous_checkpoint;
    var current_checkpoint;
    var next_checkpoint;
    var reached_checkpoint = false;

    for (let k = custom_boundary.checkpoints.length - 1; k >= 0; k--) {
        console.log("k-loop iteration started");
        if (reached_checkpoint) {
            console.log("breaking out of k-loop, checkpoint was reached");
            break;
        }
        for (let j = 0; j < organisms.length; j++) {
            console.log("j-loop iteration started");
            // determine if organism is within the perimeter of the current checkpoint being checked
            let x_lower_bound = (custom_boundary.checkpoints[k].coordinates[0]) - custom_boundary.checkpoints[k].size;
            let x_upper_bound = (custom_boundary.checkpoints[k].coordinates[0]) + custom_boundary.checkpoints[k].size;
            let y_lower_bound = (custom_boundary.checkpoints[k].coordinates[1]) - custom_boundary.checkpoints[k].size;
            let y_upper_bound = (custom_boundary.checkpoints[k].coordinates[1]) + custom_boundary.checkpoints[k].size;

            // can replace vars with definitions once confident working
            // check if organism within x && y bounds of checkpoint we're checking
            if (organisms[j].x > x_lower_bound && organisms[j].x < x_upper_bound) {
                if (organisms[j].y > y_lower_bound && organisms[j].y < y_upper_bound) {

                    console.log("We have reached a checkpoint.");

                    reached_checkpoint = true;
                    current_checkpoint = k;

                    if (k === custom_boundary.checkpoints.length - 1) {
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
    console.log("break successful. returning previous, current, and next checkpoints");
    console.log('checkpoint data (previous, current, next) :');
    console.log(previous_checkpoint);
    console.log(current_checkpoint);
    console.log(next_checkpoint);

    if (reached_checkpoint) {
        return {
            'previous': previous_checkpoint,
            'current': current_checkpoint,
            'next': next_checkpoint
        }
    }
    else {
        print("shoot. no one reached a checkpoint. returning this string.");
        return "shoot. no one reached a checkpoint. returning this string.";
    }
}

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

    console.log("testBoundarySim() Complete.");

    // we now have a fitness score for each organism. This will allow us to move into the selection phase
    // ===== code integrated up to here =====
}
// END CUSTOM BOUNDARY SIM TEST

async function runSimulation () {

    // ===== integrating boundary code into core simulation =====

    // ** for now, our flag will be the existence of a created boundary **
    // this flag will be global to start. if we want to make it more local, we'll need to pass sim_type to functions. undecided.
    if (custom_boundary) {
        sim_type = 'boundary';
    }
    else {
        sim_type = 'classic';
    }

    simulation_started = true;

    console.log("Running Simulation with these settings:");
    console.log(`Total Organisms: ${TOTAL_ORGANISMS}`);
    console.log(`Gene Count: ${GENE_COUNT}`);
    console.log(`Mutation Rate: ${MUTATION_RATE}`);
    console.log(`Min/Max Gene: [${MIN_GENE}, ${MAX_GENE}]`);
    console.log(`Dialogue: ${dialogue}`);

    // make start/settings buttons disappear, display stop simulation button
    var start_btn = document.getElementsByClassName("run-btn")[0];
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

    if (sim_type === 'classic') {
        const population_resolution = await evaluatePopulation(); // maybe don't await here
        var closest_organism = population_resolution['closest_organism'];
        average_fitness = population_resolution['average_fitness'];
    }
    else if (sim_type === 'boundary') {
        // we will follow the logic of the 'classic' sim type 

        // draw checkpoints for reference
        custom_boundary.drawCheckpoints();

        // here, we set checkpoints[i].distance_to_goal 
        calcDistanceToGoalCheckpoints();

        // get previous, current, and next checkpoints for current generation
        var checkpoint_data = getFarthestCheckpointReached();

        // this will set each organism's distance_to_next_checkpoint attribute
        // !!! this crashes sometimes because we don't have logic to handle when 0 checkpoints are reached (getFarthestCheckpointReached() returns undefined)
        var closest_organism = getShortestDistanceToNextCheckpoint(checkpoint_data['next']);

        // distance_to_goal = distance_to_next_checkpoint + next_checkpoint.distance_to_goal
        // 'next' will give us the index in the checkpoints array of the checkpoint we want to measure from
        var remaining_distance = custom_boundary.checkpoints[checkpoint_data['next']].distance_to_goal;

        // this function also will set each organism's distance_to_goal and fitness attributes
        average_fitness = calcPopulationFitnessBounds(remaining_distance);

        console.log(`Average Fitness: ${average_fitness}`);
    }

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
        sim_type = highlightClassicSimType();
    }
    else if (event.target.className === 'sim-type-boundary') {
        sim_type = highlightBoundarySimType();
    }
}

function handleSimTypeBtnClick() {
    if (sim_type != null) {
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
    if (sim_type != null) {
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

// currently, both buttons and 'enter' will call displaySettingsForm()
function handleSimTypeSelectionKeyPress(event) {
    switch(event.key) {
        case "ArrowLeft":
            // the solution is to sync this variable with the sim_type var that runSimulation()/checkSimType() checks
            // i'll do that now. set sim_type here
            sim_type = highlightClassicSimType();
            break;

        case "ArrowRight":
            sim_type = highlightBoundarySimType();
            break;
        
        case "Enter":
            if (sim_type != null) {
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

function applySimType() {

    // turn off listeners and hide buttons
    turnOffSimTypeSelectionEventListeners();

    document.getElementsByClassName("sim-type-classic")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-boundary")[0].style.display = 'none';

    if (sim_type === 'classic') {
        displaySettingsForm();
    }
    else if (sim_type === 'boundary') {
        // user must create boundary before settings configuration
        displayBoundaryCreationIntroductionOne();
    }
}

// 1. Create Initial Population
function createOrganisms () {
    let gender;
    let male_count = 0;
    let female_count = 0;
    let spawn_x = INITIAL_X;
    let spawn_y = INITIAL_Y;

    // update spawn point if boundary simulation
    if (sim_type === 'boundary') {
        spawn_x = INITIAL_X_BOUND;
        spawn_y = INITIAL_Y_BOUND;
    }

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
        var organism = new Organism(gender, spawn_x, spawn_y, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }
    console.log(`FEMALES CREATED: ${female_count}, MALES CREATED: ${male_count}`);

    // consider not making organisms global, but pass it to runGeneration()/runSimulation() from here
}

function getRandomGene(min, max) {
    var random_x = Math.floor(Math.random() * (max - min + 1) + min);
    var random_y = Math.floor(Math.random() * (max - min + 1) + min);
    var random_gene = [random_x, random_y];
    return random_gene;
}

// 2. Evaluate

// updateAndMoveOrganisms() was here, moved for integration

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

    return closest_organism;
}

function getShortestDistanceToNextCheckpoint(next_checkpoint) {
    var shortest_distance_to_checkpoint = 10000;
    var closest_organism;

    // calculate distance to closest checkpoint not yet reached
    for (let n = 0; n < organisms.length; n++) {
        // in future, make sure organism is alive before calculating its distance
        // distance^2 = a^2 + b^2
        let horizontal_distance_squared = (organisms[n].x - custom_boundary.checkpoints[next_checkpoint].coordinates[0]) ** 2;
        let vertical_distance_squared = (organisms[n].y - custom_boundary.checkpoints[next_checkpoint].coordinates[1]) ** 2;
        let distance_to_checkpoint_squared = horizontal_distance_squared + vertical_distance_squared;

        organisms[n].distance_to_next_checkpoint = Math.sqrt(distance_to_checkpoint_squared);
        console.log("Distance to next-closest checkpoint for organism " + n + ":");
        console.log(organisms[n].distance_to_next_checkpoint);

        if (organisms[n].distance_to_next_checkpoint < shortest_distance_to_checkpoint) {
            shortest_distance_to_checkpoint = organisms[n].distance_to_next_checkpoint;
            closest_organism = organisms[n]; // return only index if works better
        }
    }
    // we should have each organism's distance the closest checkpoint not yet reached.
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

function calcPopulationFitnessBounds(remaining_distance) {
    // scale = length of lines connecting epicenters from spawn>checkpoints>goal
    var scale = scale_statistics['scale'];

    // calc/set distance_to_goal && fitness
    total_fitness = 0.00;
    for (let i = 0; i < organisms.length; i++) {

        // this also sets each organism's distance_to_goal attribute
        organisms[i].calcDistanceToGoalBounds(remaining_distance);

        // this also sets each organism's fitness attribute
        organisms[i].calcFitnessBounds(scale);

        total_fitness += organisms[i].fitness;
    }

    // set average fitness
    average_fitness = total_fitness / organisms.length;

    return average_fitness;
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
    let spawn_x = INITIAL_X;
    let spawn_y = INITIAL_Y;

    // update spawn point if boundary simulation
    if (sim_type === 'boundary') {
        spawn_x = INITIAL_X_BOUND;
        spawn_y = INITIAL_Y_BOUND;
    }

    offspring_gender = getGender();
    offspring = new Organism(offspring_gender, spawn_x, spawn_y, ctx);
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
    var opacity_tracker = 0.00;
    var finished = false;
    var cycles = 0;
    var start_button_pressed = false; // flag to resolve animation

    var logo = document.getElementById("logo");
    var press_start_text = document.getElementById("press-start");
    // var settings_btn = document.getElementsByClassName("settings-btn")[0];
    var start_btn = document.getElementsByClassName("start-btn")[0];

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
            if (!finished && !simulation_started) {

                // if settings clicked, resolve animation (fix so we dont declare so many eventListeners)
                // settings_btn.addEventListener("click", function() {
                //     cancelAnimationFrame(frame_id);
                //     resolve("Display Settings");
                // });

                // respond to event listener flag
                if (start_button_pressed) {
                    // cancel and resolve
                    cancelAnimationFrame(frame_id);
                    return resolve("Display Sim Types");
                }

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

    // need to draw goal at location depending on sim type
    if (sim_type === 'classic') {
        var goal = new Goal(GOAL_X_POS, GOAL_Y_POS, 20, ctx);
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

    var start_btn = document.getElementsByClassName("run-btn")[0];
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
    // clear canvas
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw start/end points of boundary
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

    // draw instructions zones (no-draw zones)
    ctx.lineWidth = 4;
    ctx.strokeWidth = 4;
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.strokeRect(736, 445, 272, 200);
    ctx.strokeRect(-4, -4, 252, 157);
}

// would belong to class Paintbrush, not Boundary
function updateMousePosition(event) {
    let rect = canvas.getBoundingClientRect(); // do i want to call this every time? ||| do I need to pass canvas here?

    // store current mouse position
    coordinates['x'] = event.clientX - rect.left;
    coordinates['y'] = event.clientY - rect.top;

    // console.log(coordinates);
}

// called before enterBoundaryCreationMode()
function displayBoundaryCreationIntroductionOne() {
    // could maybe be an animation, but not now
    console.log("boundary creation introduction called");

    drawBoundaryBoilerplate();

    // erase boxes
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillRect(720, 420, 300, 200);

    // introduction
    ctx.font = '40px arial';
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Create Your Boundary", 330, 280);

    ctx.font = '28px arial';
    ctx.fillText("Press 'Enter' or click 'Continue'", 300, 360);

    // hardcode as html element if needed
    let next_btn = document.getElementsByClassName("next-btn")[0];
    next_btn.style.display = 'block';

    next_btn.addEventListener('click', function continueIntroduction() {
        // remove listener
        next_btn.removeEventListener('click', continueIntroduction);

        // go to next screen
        displayBoundaryCreationIntroductionTwo();
    })

    document.addEventListener('keydown', function checkKeystroke(event) {
        if (event.key === 'Enter') {
            // destroy listeners
            document.removeEventListener('keydown', checkKeystroke);

            // go to next screen
            displayBoundaryCreationIntroductionTwo();
        }
    })
} 

function displayBoundaryCreationIntroductionTwo() {

    drawBoundaryBoilerplate();

    ctx.font = '28px arial';
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("These areas will be used for dialogue throughout the simulation.", 100, 270);
    ctx.fillText("For best results, avoid drawing over them.", 200, 330);  
    ctx.font = '24px arial'; 
    ctx.fillText("Press 'Enter' or click 'Continue'", 300, 420);

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

function applyBoundaryModeStyles() {
    // turn off settings, turn on canvas
    var canvas_container = document.getElementsByClassName("canvas-container")[0];
    var settings_container = document.getElementsByClassName("settings-container")[0];

    canvas_container.style.display = 'block';
    settings_container.style.display = 'none';

    drawBoundaryBoilerplate();

    // hide buttons
    document.getElementsByClassName("settings-btn")[0].style.display = 'none';
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-classic")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-boundary")[0].style.display = 'none';

    let stop_btn = document.getElementsByClassName("stop-btn")[0];
    let save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];

    // revert when leaving boundary mode
    save_bounds_btn.style.display = "block";

    stop_btn.style.gridColumn = "1 / 2";
    stop_btn.style.width = "75%";
    stop_btn.innerHTML = "Back";
    stop_btn.style.display = "block";
}

// this could do text & styles
function drawBoundaryDrawingHelpText(step) {

    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font= "24px arial";
    ctx.fillText(step, 80, 40);

    ctx.font = '18px arial';
    ctx.fillText("Draw a line connecting", 25, 75)
    ctx.fillText("the red endpoints from", 25, 95);
    ctx.fillText("bottom to top", 25, 115);

    ctx.font = '20px arial';
    ctx.fillText("For best results, draw", 770, 505);
    ctx.fillText("a slow, continuous,", 770, 530);
    ctx.fillText("non-overlapping line", 770, 555);
}

function drawBoundaryValidationHelpText() {
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font= "24px arial";
    ctx.fillText("Validation", 70, 40);

    ctx.font = '18px arial';
    ctx.fillText("To verify that the goal", 25, 70)
    ctx.fillText("is reachable, draw a line", 25, 90);
    ctx.fillText("connecting the white dot", 25, 110);
    ctx.fillText("to the goal", 25, 130);

    // no bottom black square on this one
    ctx.fillStyle = 'black';
    ctx.fillRect(730, 440, 280, 220);

    // not using, keep just in case
    // ctx.font = '20px arial';
    // ctx.fillText("For best results, draw", 770, 505);
    // ctx.fillText("a slow, continuous,", 770, 530);
    // ctx.fillText("non-overlapping line", 770, 555);
}

// this function will be refactored/cleaned
function enterBoundaryCreationMode() {

    // drawing flag and step tracker
    var allowed_to_draw = false; // could be method of Paintbrush
    var boundary_step = "bottom-boundary"; // could be attribute of Boundary? idk..

    // create new boundary
    var new_boundary = new Boundary();

    // this function name doesn't fit well anymore, rename
    applyBoundaryModeStyles();

    // write here until compound function made
    drawBoundaryDrawingHelpText("Step 1");
    
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
                new_boundary.bottom_boundary_coordinates.push([coordinates['x'], coordinates['y']]);
            }
            else {
                // save to top coords
                new_boundary.top_boundary_coordinates.push([coordinates['x'], coordinates['y']]);
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
                    drawBoundaryDrawingHelpText("Step 2");
                }
                else {
                    // erase bottom-boundary coords when illegal line drawn
                    new_boundary.bottom_boundary_coordinates = [];

                    // redraw boilerplate
                    drawBoundaryBoilerplate();

                    // redraw bottom-step help text
                    drawBoundaryDrawingHelpText("Step 1");

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
                    drawBoundaryValidationHelpText();
                }
                else {
                    // reset top boundary coords when illegal line drawn
                    new_boundary.top_boundary_coordinates = [];

                    // redraw boilerplate and help text
                    drawBoundaryBoilerplate();

                    // draw valid bottom-boundary
                    ctx.drawImage(new_boundary.bottom_boundary, 0, 0, canvas.width, canvas.height);

                    drawBoundaryDrawingHelpText("Step 2");

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

                    // should display help text on bottom-left area
                    // drawBoundaryCompletionText();
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
        custom_boundary = new_boundary;

        // update global scale_statistics
        scale_statistics = setScale();

        // return to settings
        displaySettingsForm(); //turned off while testing checkpoints
    });
}

// =================================================================================