// This module will hold all things boundary-related (besides drawing functions)

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
            // simGlobals.canvas_data_bad_practice = ctx.getImageData(0, 0, canvas.width, canvas.height);

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
}

export { Boundary }