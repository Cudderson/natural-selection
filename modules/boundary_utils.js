class Boundary {
    constructor() {
        this.top_boundary = new Image();
        this.bottom_boundary = new Image();
        this.full_boundary = new Image();
        this.top_boundary_coordinates = [];
        this.bottom_boundary_coordinates = [];
        this.checkpoints = []; // push dictionaries containing coordinates, halfway_point, distance_to_goal, and size
        this.scale_statistics = null; 
    }

    save(boundary_type) {

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

            console.log("saving full boundary");
            this.full_boundary.src = canvas.toDataURL("image/png");
        }
    }

    validateBottom(event) {
        console.log("validating bottom boundary...");

        updateMousePosition(event);

        // check if boundary drawing ended on endpoint
        if (simGlobals.coordinates['x'] >= 940 && simGlobals.coordinates['x'] <= 960 &&
            simGlobals.coordinates['y'] >= 160 && simGlobals.coordinates['y'] <= 180) {

            console.log("valid boundary");
            return true;
        }
        else {
            console.log("Invalid boundary.");
            return false;
        }   
    }

    validateTop(event) {
        console.log("validating top-boundary...");

        updateMousePosition(event);

        // check if boundary drawing ended on endpoint
        if (simGlobals.coordinates['x'] >= 820 && simGlobals.coordinates['x'] <= 840 &&
            simGlobals.coordinates['y'] >= 40 && simGlobals.coordinates['y'] <= 60) {

            console.log("valid boundary");
            return true;
        }
        else {
            console.log("Invalid boundary.");
            return false;
        }
    }

    validateFull() {
        // check if user-drawn line ended on goal
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

        // since splicing changes array size, preserve the length here so that we can evaluate all coordinates
        let preserved_longest_length = longest_boundary_coordinates.length;

        for (let i = 0; i < preserved_longest_length; i++) {
            random_percentage = Math.random();

            if (random_percentage < percent_of_coords_to_remove) {
                // need to remember the amount coords_removed so that we remove the correct coord from the changing array
                longest_boundary_coordinates.splice((i - coords_removed), 1);
                coords_removed++;
            }
            else {
                coords_kept++;
            }

            if (longest_boundary_coordinates.length === target_length) {
                // break if coordinate array lengths become equal length
                break;
            }
        }

        console.log("Loop finished.");
        console.log(`Longest boundary new size: ${longest_boundary_coordinates.length}`);
        console.log(`Target Length (length of shortest boundary): ${target_length}`);

        // at this point, the longest_coordinate set is either the same size as the shortest, or slightly larger
        // trim off the extra if there is any
        if (longest_boundary_coordinates.length !== target_length) {
            console.log("Trimming extra coordinates...");
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
                this.top_boundary_coordinates = trimmed_coordinates;
            }
            else if (longest_text === 'bottom') {
                this.bottom_boundary_coordinates = trimmed_coordinates;
            }
        }
    }

    createCheckpoints() {

        ctx.fillStyle = 'white';
        ctx.strokeWidth = 1;
        ctx.lineCap = 'round';
        let step = Math.ceil(this.top_boundary_coordinates.length / 10);
        let line_counter = 0;
    
        // loop over all coordinates in both arrays
        for (let i = 0; i < this.top_boundary_coordinates.length; i++) {
            // draw a line from top[coordinate] to bottom[coordinate]
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

                // identify mid-point of each line connecting top & bottom boundaries
                let mid_x = Math.floor((this.top_boundary_coordinates[i][0] + this.bottom_boundary_coordinates[i][0]) / 2); 
                let mid_y = Math.floor((this.top_boundary_coordinates[i][1] + this.bottom_boundary_coordinates[i][1]) / 2);

                // draw dot on middle of each line (distance between x's - distance between y's)
                // ctx.beginPath();
                // ctx.arc(mid_x, mid_y, 2, 0, Math.PI*2, false);
                // ctx.fill();

                // store checkpoint coordinates
                this.checkpoints.push({'coordinates': [mid_x, mid_y]});
            }
        }

        // console.log("Line drawing complete");
        // console.log(`Should be 10 lines: ${line_counter}`);

        // == Draw line connecting each checkpoint ==
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

        // determine checkpoint size using halfway points (loop from 1 to length-1 (skips first and last checkpoint))
        for (let i = 1; i < this.checkpoints.length - 1; i++) {

            // determine length from checkpoint to previous checkpoints halfway point
            let current_location = this.checkpoints[i].coordinates;
            let previous_halfway_point = this.checkpoints[i-1].halfway_point;

            // c^2 = a^2 + b^2
            let distance_to_previous_halfway_point_squared = (
                (current_location[0] - previous_halfway_point[0]) ** 2) + ((current_location[1] - previous_halfway_point[1]) ** 2
            );

            let distance_to_previous_halfway_point = Math.sqrt(distance_to_previous_halfway_point_squared);

            // determine distance to OWN halfway point
            let own_halfway_point = this.checkpoints[i].halfway_point;

            // c^2 = a^2 + b^2
            let distance_to_own_halfway_point_squared = (
                (current_location[0] - own_halfway_point[0]) ** 2) + ((current_location[1] - own_halfway_point[1]) ** 2
            );

            let distance_to_own_halfway_point = Math.sqrt(distance_to_own_halfway_point_squared);

            // determine shortest distance and store as size
            if (distance_to_previous_halfway_point < distance_to_own_halfway_point) {

                // set minimum checkpoint size to 40
                if (distance_to_previous_halfway_point < 40) {
                    this.checkpoints[i].size = 40;
                }
                else {
                    this.checkpoints[i].size = Math.floor(distance_to_previous_halfway_point);
                }
            }
            else {

                // set minimum checkpoint size to 40
                if (distance_to_own_halfway_point < 40) {
                    this.checkpoints[i].size = 40;
                }
                else {
                    this.checkpoints[i].size = Math.floor(distance_to_own_halfway_point);
                }
            }

            // checkpoint[0] doesn't check for previous halfway point, and checkpoint[length-1] doesn't check for own!
        }

        // give first and last checkpoints sizes
        this.checkpoints[0].size = 40;
        this.checkpoints[this.checkpoints.length - 1].size = 40;

        // to confirm, display sizes for each checkpoint
        for (let i = 0; i < this.checkpoints.length; i++) {
            console.log(`Size of checkpoint ${i}: ${this.checkpoints[i].size}`);
            console.log(`coords of checkpoint: ${this.checkpoints[i].coordinates}`);
        }
    }

    calcDistanceToGoalCheckpoints() {
        let scale = this.scale_statistics['scale'];
        let checkpoint_to_checkpoint_lengths = this.scale_statistics['checkpoint_lengths'];
        let spawn_to_checkpoint_0_length = this.scale_statistics['spawn_to_checkpoint_0_length'];

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

    setScale() {
        // compute the lengths of lines connecting epicenters from spawn to checkpoints to goal
    
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

        // create the checkpoints to be used by our fitness function
        this.createCheckpoints();

        // sets instance scale_statistics attribute
        this.setScale();

        // with scale stats set, we can set each checkpoint's distance_to_goal attribute
        this.calcDistanceToGoalCheckpoints();
    }

    getFarthestCheckpointReached(organisms) {
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

            // define perimeter area of checkpoints
            let x_lower_bound = (this.checkpoints[k].coordinates[0]) - this.checkpoints[k].size;
            let x_upper_bound = (this.checkpoints[k].coordinates[0]) + this.checkpoints[k].size;
            let y_lower_bound = (this.checkpoints[k].coordinates[1]) - this.checkpoints[k].size;
            let y_upper_bound = (this.checkpoints[k].coordinates[1]) + this.checkpoints[k].size;

            for (let j = 0; j < organisms.length; j++) {
                console.log("j-loop iteration started");

                // check if organism within x && y bounds of checkpoint we're checking
                if (organisms[j].x > x_lower_bound && organisms[j].x < x_upper_bound) {
                    if (organisms[j].y > y_lower_bound && organisms[j].y < y_upper_bound) {
    
                        console.log("We have reached a checkpoint.");
    
                        reached_checkpoint = true;
                        current_checkpoint = k;
    
                        if (k === this.checkpoints.length - 1) {
                            // previous = k-1, next = goal
                            previous_checkpoint = k - 1;
                            next_checkpoint = 'goal';
                        } 
                        else if (k >= 1) {
                            // previous = k-1, next = k+1
                            previous_checkpoint = k - 1;
                            next_checkpoint = k + 1;
                        }
                        else {
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
    
        return {
            'previous': previous_checkpoint,
            'current': current_checkpoint,
            'next': next_checkpoint
        }
    }

    checkPulse(organisms) {

        let deceased_organisms = [];
    
        for (let i = 0; i < organisms.length; i++) {
            if (!organisms[i].is_alive) {
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

function updateMousePosition(event) {
    let rect = canvas.getBoundingClientRect();

    // store current mouse position
    simGlobals.coordinates['x'] = Math.floor(event.clientX - rect.left);
    simGlobals.coordinates['y'] = Math.floor(event.clientY - rect.top);
}

export { Boundary, updateMousePosition }