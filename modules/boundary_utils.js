// This module will hold all things boundary-related (besides drawing functions)

// import { drawSimulationSettings } from "./drawings";

class Boundary {
    constructor() {
        this.top_boundary = new Image();
        this.bottom_boundary = new Image();
        this.full_boundary = new Image();
        this.top_boundary_coordinates = [];
        this.bottom_boundary_coordinates = [];
        // this.checkpoints = {'coordinates': [], 'size': null};
        this.checkpoints = []; // push dictionaries containing coordinates, halfway_point, distance_to_goal, and size
        this.scale_statistics = null; 
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

            // save image as full-boundary
            this.full_boundary.src = canvas.toDataURL("image/png");
        }
    }

    validateBottom(event) {
        console.log("validating bottom boundary...");

        updateMousePosition(event);

        // check if boundary ended on endpoint     ctx.arc(950, 170, 10, 0, Math.PI*2, false);
        
        if (simGlobals.coordinates['x'] >= 940 && simGlobals.coordinates['x'] <= 960 &&
            simGlobals.coordinates['y'] >= 160 && simGlobals.coordinates['y'] <= 180) {

            console.log("valid boundary");

            return true;
        }
        else {
            // invalid
            console.log("Invalid boundary.");
            return false;
        }   
    }

    validateTop(event) {
        console.log("validating top-boundary...");

        updateMousePosition(event);

        // check if boundary on endpoint
        // endpoint:     ctx.arc(830, 50, 10, 0, Math.PI*2, false)
        if (simGlobals.coordinates['x'] >= 820 && simGlobals.coordinates['x'] <= 840 &&
            simGlobals.coordinates['y'] >= 40 && simGlobals.coordinates['y'] <= 60) {
            // valid, update boundary step
            console.log("valid boundary");

            // update canvas data (not sure if I need to do this)
            canvas = document.getElementById("main-canvas");
            ctx = canvas.getContext("2d");
            // simGlobals.canvas_data_bad_practice = ctx.getImageData(0, 0, canvas.width, canvas.height);

            return true;
        }
        else {
            // invalid
            console.log("Invalid boundary.");
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

    // boundary method?
    calcDistanceToGoalCheckpoints() {
        let scale = this.scale_statistics['scale'];
        let checkpoint_to_checkpoint_lengths = this.scale_statistics['checkpoint_lengths'];
        let spawn_to_checkpoint_0_length = this.scale_statistics['spawn_to_checkpoint_0_length'];
        let last_checkpoint_to_goal_length = this.scale_statistics['last_checkpoint_to_goal_length']; // keep for comparison

        let adjusted_scale;

        // checkpoint_to_checkpoint_lengths[0] = checkpoints[0] distance to next checkpoint
        for (let i = 0; i < this.checkpoints.length; i++) {
            if (i === 0) {
                // distance to goal for first checkpoint = scale - distance_from_spawn_to_first_checkpoint
                adjusted_scale = scale - spawn_to_checkpoint_0_length;
                this.checkpoints[i].distance_to_goal = adjusted_scale;
            }
            else {
                // i-1 will give us the length of the previous checkpoint to the current
                adjusted_scale -= checkpoint_to_checkpoint_lengths[i-1];
                this.checkpoints[i].distance_to_goal = adjusted_scale;
            }
        }
    }

    // should be moved to drawings.js
    drawCheckpoints() {
        // === Draw Checkpoints ===
        for (let i = 0; i < this.checkpoints.length; i++) {
            ctx.beginPath();
            ctx.arc(this.checkpoints[i].coordinates[0], this.checkpoints[i].coordinates[1], this.checkpoints[i].size, 0, Math.PI*2, false);
            ctx.stroke();
            ctx.closePath();
        }
    }

    testClassMethod() {
        // works
        console.log("Hey man what's up?");
    }

    setScale() {
        // compute the lengths of lines connecting epicenters from spawn to checkpoints to goal
        // store the individual line lengths in data structure for future reference
        // consider recursion here? base case = i === 0
    
        let scale = 0.00;
    
        // will store length of checkpoint to the next checkpoint
        let checkpoint_to_checkpoint_lengths = [];
    
        for (let i = 1; i < this.checkpoints.length; i++) {
            // compute distance from last checkpoint to current
            let horizontal_distance_squared = (
                this.checkpoints[i].coordinates[0] - 
                this.checkpoints[i-1].coordinates[0]) ** 2;
            
            let vertical_distance_squared = (
                this.checkpoints[i].coordinates[1] - 
                this.checkpoints[i-1].coordinates[1]) ** 2;
            
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
        let horizontal_distance_squared = (simGlobals.INITIAL_X_BOUND - this.checkpoints[0].coordinates[0]) ** 2;
        let vertical_distance_squared = (simGlobals.INITIAL_Y_BOUND - this.checkpoints[0].coordinates[1]) ** 2;
        let distance_squared = horizontal_distance_squared + vertical_distance_squared;
        let distance_from_spawn_to_first_checkpoint = Math.sqrt(distance_squared);
    
        // update scale
        scale += distance_from_spawn_to_first_checkpoint;
    
        // add distance from final checkpoint to goal to scale
        let final_to_goal_horizontal_distance_squared = (this.checkpoints[this.checkpoints.length - 1].coordinates[0] - simGlobals.GOAL_X_POS_BOUNDS) ** 2;
        let final_to_goal_vertical_distance_squared = (this.checkpoints[this.checkpoints.length - 1].coordinates[1] - simGlobals.GOAL_Y_POS_BOUNDS) ** 2;
    
        let distance_squared_to_goal = final_to_goal_horizontal_distance_squared + final_to_goal_vertical_distance_squared;
    
        let distance_from_final_checkpoint_to_goal = Math.sqrt(distance_squared_to_goal);
    
        scale += distance_from_final_checkpoint_to_goal;
    
        console.log(`final scale: ${scale}`);
    
        this.scale_statistics = {
            'scale': scale,
            'checkpoint_lengths': checkpoint_to_checkpoint_lengths,
            'spawn_to_checkpoint_0_length': distance_from_spawn_to_first_checkpoint,
            'last_checkpoint_to_goal_length': distance_from_final_checkpoint_to_goal
        }
    }

    prepareBoundaryForSimulation() {
        // normalize boundary coordinate array sizes
        this.prepareBoundaryForCheckpoints();

        // next, we'll create the checkpoints to be used by our fitness function
        this.createCheckpoints();

        // sets instance scale_statistics attribute
        this.setScale();

        // with scale stats set, we can set each checkpoint's distance_to_goal attribute
        this.calcDistanceToGoalCheckpoints();
    }

    // maybe this shouldn't be a class method of boundary...
    getFarthestCheckpointReached(organisms) {
        // !!!!! consider passing the previous gen's farthest checkpoint reached as a minimum-value !!!!!
    
        // **NOTE: this function doesn't handle when 0 checkpoints are reached yet !!** (it might now..)
    
        // we should loop over checkpoints, check all organisms, rather than loop over all organisms, check every checkpoint
        // this will allow us to stop once an organism is found (backwards loop)
    
        let previous_checkpoint;
        let current_checkpoint;
        let next_checkpoint;
        let reached_checkpoint = false;
    
        for (let k = this.checkpoints.length - 1; k >= 0; k--) {
            console.log("k-loop iteration started");
            if (reached_checkpoint) {
                console.log("breaking out of k-loop, checkpoint was reached");
                break;
            }
            for (let j = 0; j < organisms.length; j++) {
                console.log("j-loop iteration started");
                // determine if organism is within the perimeter of the current checkpoint being checked
                // !!! [] don't define these every iteration, define it in outer-loop (checkpoint loop)
                let x_lower_bound = (this.checkpoints[k].coordinates[0]) - this.checkpoints[k].size;
                let x_upper_bound = (this.checkpoints[k].coordinates[0]) + this.checkpoints[k].size;
                let y_lower_bound = (this.checkpoints[k].coordinates[1]) - this.checkpoints[k].size;
                let y_upper_bound = (this.checkpoints[k].coordinates[1]) + this.checkpoints[k].size;
    
                // can replace vars with definitions once confident working
                // check if organism within x && y bounds of checkpoint we're checking
                if (organisms[j].x > x_lower_bound && organisms[j].x < x_upper_bound) {
                    if (organisms[j].y > y_lower_bound && organisms[j].y < y_upper_bound) {
    
                        console.log("We have reached a checkpoint.");
    
                        reached_checkpoint = true;
                        current_checkpoint = k;
    
                        if (k === this.checkpoints.length - 1) {
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

    // maybe this shouldn't be a class method either
    checkPulse(organisms) {

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
}

// also rethink rect variable here
// ** Had to move this function here so that Boundary can call it (this function is only used by Boundary) 
// (Could become a BoundaryPencil() method or something with draw() and requestDrawingPermission())
function updateMousePosition(event) {
    let rect = canvas.getBoundingClientRect(); // do i want to call this every time? ||| do I need to pass canvas here?

    // store current mouse position
    simGlobals.coordinates['x'] = Math.floor(event.clientX - rect.left);
    simGlobals.coordinates['y'] = Math.floor(event.clientY - rect.top);
}

// this trio of drawings isn't used, but is useful for debugging. Keep til the end
// *DRAWING* 1
function drawCurrentCheckpoint(index) {
    // draw farthest checkpoint reached
    ctx.strokeStyle = 'white';
    ctx.strokeWidth = 1;
    ctx.beginPath();
    ctx.arc(
        simGlobals.custom_boundary.checkpoints[index].coordinates[0], 
        simGlobals.custom_boundary.checkpoints[index].coordinates[1],
        simGlobals.custom_boundary.checkpoints[index].size, 0, Math.PI*2, false
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
            simGlobals.custom_boundary.checkpoints[index].coordinates[0],
            simGlobals.custom_boundary.checkpoints[index].coordinates[1],
            simGlobals.custom_boundary.checkpoints[index].size, 0, Math.PI*2, false
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
            simGlobals.custom_boundary.checkpoints[index].coordinates[0],
            simGlobals.custom_boundary.checkpoints[index].coordinates[1],
            simGlobals.custom_boundary.checkpoints[index].size, 0, Math.PI*2, false 
        );
        ctx.stroke();
        ctx.closePath;
    }
}

export { Boundary, updateMousePosition }