document.addEventListener("DOMContentLoaded", playTitleScreenAnimation, {once: true});

import * as Drawings from "./modules/drawings.js";
import * as BoundaryDrawings from "./modules/boundary_drawings.js"
import * as BoundaryUtils from "./modules/boundary_utils.js";
import * as SettingsUtils from "./modules/settings_utils.js";

window.simSettings = {
    // spawn/goal coordinates for both sim types
    INITIAL_X: 500,
    INITIAL_Y: 500,
    INITIAL_X_BOUND: 50,
    INITIAL_Y_BOUND: 550,
    GOAL_X_POS: 500,
    GOAL_Y_POS: 50,
    GOAL_X_POS_BOUNDS: 925,
    GOAL_Y_POS_BOUNDS: 50,

    // population/species defaults (consider leaving blank until user chooses)
    TOTAL_ORGANISMS: 100,
    GENE_COUNT: 250,
    MUTATION_RATE: 0.03,
    MIN_GENE: -5,
    MAX_GENE: 5,
    RESILIENCE: 1.00,
    POP_GROWTH: 'constant', // testing new setting (other value: 'fluctuate')
    
    dialogue: false,

    // frame rate
    FPS: 30,

    // sim type
    sim_type: null,
};

// boundary globals (maybe make window object?)
simSettings.custom_boundary; // [] (one drawing: drawBoundary())

// attach canvas & drawing context to window
window.canvas = document.getElementById("main-canvas");
window.ctx = canvas.getContext("2d");
window.canvas2 = document.getElementById("background-canvas");
window.ctx2 = canvas2.getContext("2d");

// ===================
// ===== CLASSES =====
// ===================

class Organism {
    constructor (gender, x, y) {
        this.gender = gender;
        this.x = x;
        this.y = y;
        this.radius = 5;
        this.index = 0;
        this.genes = [];
        this.distance_to_goal; // for normal and boundary sim types
        this.distance_to_next_checkpoint; //for boundary sim type only
        this.fitness;
        this.reached_goal = false;
        this.is_alive = true;
    }

    setRandomGenes() {
        for (let i = 0; i < simSettings.GENE_COUNT; i++) {
            var random_gene = getRandomGene(simSettings.MIN_GENE, simSettings.MAX_GENE);
            this.genes.push(random_gene);
        }
    }

    showGenes() {
        for (let i = 0; i < simSettings.GENE_COUNT; i++) {
            console.log(this.genes[i]);
        }
    }

    update() {
        if (this.index < simSettings.GENE_COUNT) {
            this.x += this.genes[this.index][0];
            this.y += this.genes[this.index][1];
            this.index++;
        }
    }

    move() {
        ctx.fillStyle = 'rgba(148, 0, 211, 1)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        ctx.fill();
    }

    calcDistanceToGoal() {
        // c^2 = a^2 + b^2
        let horizontal_distance_squared = (Math.abs(this.x - simSettings.GOAL_X_POS)) ** 2;
        let vertical_distance_squared = (Math.abs(this.y - simSettings.GOAL_Y_POS)) ** 2;

        let distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        let distance_to_goal = Math.sqrt(distance_to_goal_squared);

        this.distance_to_goal = distance_to_goal;

        return distance_to_goal;
    }

    calcDistanceToGoalBounds(remaining_distance) {
        this.distance_to_goal = this.distance_to_next_checkpoint + remaining_distance;
    }

    calcFitness() {
        // height = distance between starting location(y) and goal.y
        let height = simSettings.INITIAL_Y - simSettings.GOAL_Y_POS;

        let normalized_distance_to_goal = this.distance_to_goal / height;
        this.fitness = 1 - normalized_distance_to_goal;
    }

    calcFitnessBounds(scale) {
        let normalized_distance_to_goal = this.distance_to_goal / scale;
        this.fitness = 1 - normalized_distance_to_goal;
    }

    hasReachedGoal() {
        // check if within y-range 
        if ((this.y - (this.radius / 2)) >= simSettings.GOAL_Y_POS && (this.y - (this.radius / 2)) <= (simSettings.GOAL_Y_POS + 20)) {
            // check if within x-range
            if ((this.x - (this.radius / 2)) >= simSettings.GOAL_X_POS && (this.x - (this.radius / 2)) <= (simSettings.GOAL_X_POS + 20)) {

                this.reached_goal = true;
            }
        }
    }
    
    hasReachedGoalBounds() {
        // check if within y-range 
        if ((this.y - (this.radius / 2)) >= simSettings.GOAL_Y_POS_BOUNDS && (this.y - (this.radius / 2)) <= (simSettings.GOAL_Y_POS_BOUNDS + 20)) {
            // check if within x-range
            if ((this.x - (this.radius / 2)) >= simSettings.GOAL_X_POS_BOUNDS && (this.x - (this.radius / 2)) <= (simSettings.GOAL_X_POS_BOUNDS + 20)) {

                this.reached_goal = true;
                return true;
            }
        }
        return false;
    }
}

class Paintbrush {
    constructor() {
        this.subject = null; 
    }

    fadeIn(drawing_function, step, content=null) {
        return new Promise(resolve => {
            let finished = false;
            let opacity = 0.00;
            let frame_id;

            function drawFrame() {
                if (!finished) {
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
                    cancelAnimationFrame(frame_id);
                    resolve();
                }
            }
            requestAnimationFrame(drawFrame);
        }) 
    }
}

// ====================
// ===== BOUNDARY =====
// ====================

function applyInitialBoundaryDrawingStyles() {
    // hide settings container and buttons
    document.getElementsByClassName("settings-container")[0].style.display = 'none';
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-classic")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-boundary")[0].style.display = 'none';

    // show canvas and draw boundary boilerplate
    document.getElementsByClassName("canvas-container")[0].style.display = 'block';
    BoundaryDrawings.drawBoundaryBoilerplate();

    // draw initial boundary drawing screen
    BoundaryDrawings.drawBoundaryDrawingHelpText("Step 1");
    BoundaryDrawings.drawBottomBoundaryEndpointsRed();

    // create button listener to reset boundary creation
    let stop_btn = document.getElementsByClassName("stop-btn")[0];
    stop_btn.style.gridColumn = "1 / 2";
    stop_btn.style.width = "75%";
    stop_btn.innerHTML = "Reset";
    stop_btn.style.display = "block";

    stop_btn.addEventListener("click", function() {
        createNewBoundary();
    }, {once: true});
}

function createNewBoundary() {

    // instantiate Boundary (test 'let' if can't get working)
    let new_boundary = new BoundaryUtils.Boundary();

    // drawing flags, and step tracker
    let allowed_to_draw = false;
    let boundary_touched = false;
    let boundary_step = "bottom-boundary";

    // stores the position of the cursor
    simSettings.coordinates = {'x':0 , 'y':0};

    applyInitialBoundaryDrawingStyles();

    function draw(event) {
        if (event.buttons !== 1 || !allowed_to_draw) {
            // return if left-mouse button not pressed or if user not allowed to draw
            return;
        }

        ctx.beginPath();
        ctx.moveTo(simSettings.coordinates['x'], simSettings.coordinates['y']);
        BoundaryUtils.updateMousePosition(event);

        if (boundary_step === 'full-boundary') {

            let canvas_data = ctx.getImageData(0, 0, canvas.width, canvas.height)

            let pixel_data = getPixelXY(canvas_data, simSettings.coordinates['x'], simSettings.coordinates['y']);

            if (pixel_data[0] == 155) {
                // green touched, set flag for validateBoundaryConnection()
                boundary_touched = true;
            }
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 1;
        }
        else {
            ctx.strokeStyle = 'rgb(155, 245, 0)';
            ctx.lineWidth = 20;

            if (boundary_step === 'bottom-boundary') {
                // save to bottom coords
                new_boundary.bottom_boundary_coordinates.push([simSettings.coordinates['x'], simSettings.coordinates['y']]);
            }
            else {
                // save to top coords
                new_boundary.top_boundary_coordinates.push([simSettings.coordinates['x'], simSettings.coordinates['y']]);
            }
        }

        ctx.lineCap = 'round';
        ctx.lineTo(simSettings.coordinates['x'], simSettings.coordinates['y']);
        ctx.stroke();
        ctx.closePath();
    }

    function requestDrawingPermission(event) {

        BoundaryUtils.updateMousePosition(event);

        if (boundary_step === 'bottom-boundary') {
            // check that user is trying to draw from first connector
            if (simSettings.coordinates['x'] >= 160 && simSettings.coordinates['x'] <= 180 && 
                simSettings.coordinates['y'] >= 540 && simSettings.coordinates['y'] <= 560) {

                allowed_to_draw = true;
            }
            else {
                allowed_to_draw = false;
            }
        }
        else if (boundary_step === 'top-boundary') {
            // check that user is trying to draw from the first connector
            if (simSettings.coordinates['x'] >= 40 && simSettings.coordinates['x'] <= 60 &&
                simSettings.coordinates['y'] >= 420 && simSettings.coordinates['y'] <= 440) {

                allowed_to_draw = true;
            }
            else {
                allowed_to_draw = false;
            }
        }
        else if (boundary_step === 'full-boundary') {
            // check that user is trying to draw from the white dot
            if (simSettings.coordinates['x'] >= 70 && simSettings.coordinates['x'] <= 90 && 
                simSettings.coordinates['y'] >= 500 && simSettings.coordinates['y'] <= 520 ) {

                allowed_to_draw = true;
            }
            else {
                allowed_to_draw = false;
            } 
        }
        else if (boundary_step === 'confirmation') {
            // don't allow user to draw in confirmation phase
            allowed_to_draw = false;
        }
    }

    function validateBoundaryConnection(event) {
        if (allowed_to_draw) {
            if (boundary_step === 'bottom-boundary') {
                let bottom_boundary_is_valid = new_boundary.validateBottom(event);

                if (bottom_boundary_is_valid) {

                    BoundaryDrawings.drawBottomBoundaryGatesAndConnectorsGreen();

                    // update step and store boundary
                    new_boundary.save('bottom');
                    boundary_step = "top-boundary";
                    BoundaryDrawings.drawBoundaryDrawingHelpText("Step 2");
                    BoundaryDrawings.drawTopBoundaryEndpointsRed();
                }
                else {
                    // erase bottom-boundary coords when illegal line drawn
                    new_boundary.bottom_boundary_coordinates = [];

                    // redraw boilerplate & help text
                    BoundaryDrawings.drawBoundaryBoilerplate();
                    BoundaryDrawings.drawBoundaryDrawingHelpText("Step 1");
                    BoundaryDrawings.drawBottomBoundaryEndpointsRed();
                }
            }
            else if (boundary_step === "top-boundary") {
                let top_boundary_is_valid = new_boundary.validateTop(event);

                if (top_boundary_is_valid) {

                    BoundaryDrawings.drawTopBoundaryGatesAndConnectorsGreen();

                    // draw white dot for next step
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(80, 510, 10, 0, Math.PI*2, false);
                    ctx.fill();

                    // make goal new color
                    ctx.fillStyle = 'rgb(232, 0, 118)';
                    ctx.fillRect(925, 50, 20, 20);

                    // update step and store boundary
                    new_boundary.save('top');
                    boundary_step = 'full-boundary';

                    // draw next-step text 
                    BoundaryDrawings.drawBoundaryValidationHelpText();
                }
                else {
                    // reset top boundary coords when illegal line drawn
                    new_boundary.top_boundary_coordinates = [];

                    // redraw boilerplate and help text (erases illegal user-drawn line)
                    BoundaryDrawings.drawBoundaryBoilerplate();

                    // draw valid bottom-boundary
                    ctx.drawImage(new_boundary.bottom_boundary, 0, 0, canvas.width, canvas.height);

                    BoundaryDrawings.drawBoundaryDrawingHelpText("Step 2");
                    BoundaryDrawings.drawTopBoundaryEndpointsRed();
                }
            }
            else if (boundary_step === 'full-boundary') {
                // validate full boundary if boundary was not touched during validation drawing
                if (!boundary_touched) {
                    let full_boundary_is_valid = new_boundary.validateFull();

                    if (full_boundary_is_valid) {
                        // update step
                        boundary_step = 'confirmation';
                        allowed_to_draw = false;
                        
                        // make goal white to show success
                        ctx.fillStyle = 'white';
                        ctx.fillRect(925, 50, 20, 20);
    
                        BoundaryDrawings.drawBoundaryCompletionHelpText();
    
                        // display button to proceed, hide 'back' btn
                        document.getElementsByClassName("save-boundaries-btn")[0].style.display = 'block';
                        document.getElementsByClassName("stop-btn")[0].style.display = 'none';
                    }
                    else {
                        BoundaryDrawings.drawBoundaryValidationScreen(new_boundary.top_boundary);
                    }
                }
                else {
                    alert("Invalid:\nLine cannot touch boundary!");
                    BoundaryDrawings.drawBoundaryValidationScreen(new_boundary.top_boundary);
                    boundary_touched  = false;
                }
            }
        }
    }
    
    // respond to each event individually (pass event for mouse position)
    canvas.addEventListener('mouseenter', BoundaryUtils.updateMousePosition);
    canvas.addEventListener('mousedown', requestDrawingPermission);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', validateBoundaryConnection);

    let save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];

    save_bounds_btn.addEventListener("click", function() {
        console.log("Saving Custom Boundaries");

        // draw Boundary as it will appear in simulation
        BoundaryDrawings.drawFinalBoundary(new_boundary.top_boundary);

        // save full boundary
        new_boundary.save('full');

        // creates checkpoints, sets scale attribute
        new_boundary.prepareBoundaryForSimulation();

        // add boundary to sim settings 
        simSettings.custom_boundary = new_boundary;

        // turn off listeners
        canvas.removeEventListener('mouseenter', BoundaryUtils.updateMousePosition);
        canvas.removeEventListener('mousedown', requestDrawingPermission);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', validateBoundaryConnection);

        // initiate settings configuration
        SettingsUtils.configureSettings();

        // testing checkpoints (save for debugging)
        // BoundaryDrawings.drawCheckpoints();

    }, {once: true});
}

// ======================
// ===== PRE-SIM =====
// ======================

function createPaintbrush() {
    window.paintbrush = new Paintbrush();
}

async function runPreSimAnimations() {

    // show skip-btn and add listener
    let skip = false;
    let skip_btn = document.getElementsByClassName("skip-btn")[0];

    skip_btn.style.display = 'block';

    skip_btn.addEventListener("click", function() {
        skip = true;
        skip_btn.innerHTML = 'Skipping...';
    }, {once: true});

    if (!skip) {
        await paintbrush.fadeIn(Drawings.drawSimulationSettings, .01);
        await sleep(2000);
        await paintbrush.fadeOut(Drawings.drawSimulationSettings, .02);
    }

    if (!skip) {
        await paintbrush.fadeIn(Drawings.drawSimulationIntro, .01);
        await sleep(2000);

        await paintbrush.fadeIn(Drawings.drawFakeGoal, .01);
        await paintbrush.fadeOut(Drawings.drawSimulationIntro, .02);
    }

    if (!skip) {
        await paintbrush.fadeIn(Drawings.drawSimulationExplanation, .01);
        await sleep(4000);
        await paintbrush.fadeOut(Drawings.drawExplanationAndGoal, .02);
        await sleep(1000);
    }

    skip_btn.style.display = 'none';

    // add content for drawStats()
    let pre_sim_stats = {};
    pre_sim_stats.generation_count = 0;
    pre_sim_stats.average_fitness = '0.00';
    pre_sim_stats.organism_count = document.getElementById("total-organisms").value;

    await paintbrush.fadeIn(Drawings.drawStats, .02, pre_sim_stats);
    await sleep(500);

    if (simSettings.dialogue) {
        await paintbrush.fadeIn(Drawings.drawPhases, .02);
        await sleep(500);
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseEntryText, .02);
    }

    await paintbrush.fadeIn(Drawings.drawFakeGoal, .02);

    return new Promise(resolve => {
        resolve("pre-sim animations complete");
    });
}

function selectSimulationType() {
    Drawings.drawInitialSimSelectionScreen();
    turnOnSimTypeSelectionListeners();
}

function handleSimTypeBtnMouseover(event) {
    console.log(event.target.className);
    if (event.target.className === 'sim-type-classic') {
        simSettings.sim_type = 'classic';
        Drawings.highlightClassicSimType();
    }
    else if (event.target.className === 'sim-type-boundary') {
        simSettings.sim_type = 'boundary';
        Drawings.highlightBoundarySimType();
    }
}

function handleSimTypeBtnClick() {
    if (simSettings.sim_type != null) {
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
    if (simSettings.sim_type != null) {
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
            simSettings.sim_type = 'classic';
            Drawings.highlightClassicSimType();
            break;

        case "ArrowRight":
            simSettings.sim_type = 'boundary';
            Drawings.highlightBoundarySimType();
            break;
        
        case "Enter":
            if (simSettings.sim_type != null) {
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
        // go to next screen
        BoundaryDrawings.drawBoundaryCreationIntroductionTwo();
        turnOnBoundaryIntroductionTwoListeners();
    }, {once: true});

    document.addEventListener('keydown', function checkKeystroke(event) {
        if (event.key === 'Enter') {
            // go to next screen
            BoundaryDrawings.drawBoundaryCreationIntroductionTwo();
            turnOnBoundaryIntroductionTwoListeners();
        }
    }, {once: true});
}

function turnOnBoundaryIntroductionTwoListeners() {
    let next_btn = document.getElementsByClassName("next-btn")[0];
    next_btn.innerHTML = 'Continue';

    next_btn.addEventListener('click', function finishBoundaryIntroduction() {

        next_btn.style.display = 'none';

        // go to next screen
        createNewBoundary();

    }, {once: true});    

    document.addEventListener('keydown', function checkKeystroke(event) {
        if (event.key === 'Enter') {
            document.removeEventListener('keydown', checkKeystroke);

            next_btn.style.display = 'none';

            // go to next screen, begin boundary creation
            createNewBoundary();
        }
    })
}

async function applySimType() {
    // turn off listeners and hide buttons
    turnOffSimTypeSelectionEventListeners();

    document.getElementsByClassName("sim-type-classic")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-boundary")[0].style.display = 'none';

    // allow btn-click to runSimulation() (still hidden)
    document.getElementsByClassName("run-btn")[0].addEventListener("click", runSimulation, {once: true});

    if (simSettings.sim_type === 'classic') {
        // configure simSettings
        SettingsUtils.configureSettings();
    }
    else if (simSettings.sim_type === 'boundary') {
        // user must create boundary before settings configuration
        BoundaryDrawings.drawBoundaryCreationIntroductionOne();
        turnOnBoundaryIntroductionOneListeners();
    }
}

function createOrganisms () {
    let gender;
    let male_count = 0;
    let female_count = 0;
    let spawn_x = simSettings.INITIAL_X;
    let spawn_y = simSettings.INITIAL_Y;

    let initial_population = [];

    // update spawn point if boundary simulation
    if (simSettings.sim_type === 'boundary') {
        spawn_x = simSettings.INITIAL_X_BOUND;
        spawn_y = simSettings.INITIAL_Y_BOUND;
    }

    // create equal number of males and females
    for (let i = 0; i < simSettings.TOTAL_ORGANISMS; i++) {
        if (i % 2) {
            gender = 'male';
            male_count++;
        }
        else {
            gender = 'female';
            female_count++;
        }

        let organism = new Organism(gender, spawn_x, spawn_y);

        organism.setRandomGenes();
        initial_population.push(organism);
    }

    return initial_population;
}

// ======================
// ===== EVALUATION =====
// ======================

function updateAndMoveOrganismsBounds(organisms) {
    return new Promise(resolve => {
        var canvas2_data = ctx2.getImageData(0, 0, canvas.width, canvas.height);
        let finished = false;
        let position_rgba;
        let total_moves = 0;
        let frame_id;

        let success_flag = false;

        function animateOrganisms() {
            if (!finished) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                for (let i = 0; i < organisms.length; i++) {
                    if (organisms[i].is_alive) {
                        if (organisms[i].reached_goal === false) {

                            // get pixel data
                            position_rgba = getPixelXY(canvas2_data, organisms[i].x, organisms[i].y);

                            // check if touching green pixel
                            if (position_rgba[0] === 155) {

                                // if organism hasn't reached goal, execute survival logic
                                if (!organisms[i].hasReachedGoalBounds()) {
                                    let survived = Math.random() < simSettings.RESILIENCE;

                                    if (survived) {
                                        // move organism to inverse of last movement, update index

                                        // get inverse of last gene
                                        let inverse_x_gene = (organisms[i].genes[organisms[i].index - 1][0]) * -1;
                                        let inverse_y_gene = (organisms[i].genes[organisms[i].index - 1][1]) * -1;

                                        // update
                                        organisms[i].x += inverse_x_gene;
                                        organisms[i].y += inverse_y_gene;
                                        organisms[i].index++;

                                        // move
                                        organisms[i].move();
                                    }
                                    else {
                                        // draw organism deceased
                                        organisms[i].is_alive = false;
                                        ctx.fillStyle = '#444';
                                        ctx.beginPath();
                                        ctx.arc(organisms[i].x, organisms[i].y, organisms[i].radius, 0, Math.PI*2, false);
                                        ctx.fill();
                                    }
                                }
                            }
                            else {
                                organisms[i].update();
                                organisms[i].move();
                            }
                        }
                        else {
                            // update successful organism
                            // set success flag to true 
                            Drawings.updateSuccessfulOrganism(organisms[i]);
                            success_flag = true;
                        }
                    }
                    else {
                        // draw deceased organism
                        organisms[i].is_alive = false;
                        ctx.fillStyle = '#444';
                        ctx.beginPath();
                        ctx.arc(organisms[i].x, organisms[i].y, organisms[i].radius, 0, Math.PI*2, false);
                        ctx.fill();
                    }
                    total_moves++;
                }

                if (total_moves >= simSettings.GENE_COUNT * organisms.length) {
                    finished = true;
                }

                sleep(1000 / simSettings.FPS); // looks smoother without fps (but FPS keeps animation consistent)
                frame_id = requestAnimationFrame(animateOrganisms);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve(success_flag);
            }
        }
        requestAnimationFrame(animateOrganisms);
    })
}

function updateAndMoveOrganisms(organisms) {
    return new Promise(resolve => {
        let total_moves = 0;
        let finished = false;
        let success_flag = false;
        let frame_id;

        function animateOrganisms() {
            if (!finished) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                for (let i = 0; i < organisms.length; i++) {
                    if (!organisms[i].reached_goal) {
                        organisms[i].update();
                        organisms[i].move();

                        // only check if organism has reached goal if his/her y position is approaching the goal 
                        if (organisms[i].y < (simSettings.GOAL_Y_POS + 30)) {
                            organisms[i].hasReachedGoal();
                        }
                    }
                    else {
                        Drawings.updateSuccessfulOrganism(organisms[i]);
                        success_flag = true;
                    }
                    total_moves++;
                }
                if (total_moves == (organisms.length * simSettings.GENE_COUNT)) {
                    finished = true;
                }

                sleep(1000 / simSettings.FPS); // control drawing FPS for organisms
                frame_id = requestAnimationFrame(animateOrganisms);
            }
            else {
                cancelAnimationFrame(frame_id);
                resolve(success_flag);
            }
        }
        requestAnimationFrame(animateOrganisms);
    })
}

async function runEvaluationAnimation(organisms, stats) {

    if (simSettings.sim_type === 'classic') {
        // draw goal on canvas2
        Drawings.drawGoal();

        var success_flag = await updateAndMoveOrganisms(organisms);
    }
    else if (simSettings.sim_type === 'boundary') {

        if (simSettings.dialogue) {
            // draw eval text and stats on canvas1
            ctx2.clearRect(0, 0, 245, 150);
            Drawings.drawStaticEvaluationPhaseText(ctx);
        }

        ctx2.clearRect(700, 510, 350, 120);
        Drawings.drawStatsStatic(ctx, stats);

        if (stats.generation_count === 0 && !simSettings.dialogue) {
            await paintbrush.fadeIn(BoundaryDrawings.drawBoundary, .015);
            ctx2.globalAlpha = 1;
        }

        if (simSettings.dialogue) {
            await paintbrush.fadeIn(BoundaryDrawings.drawBoundary, .015);
            ctx2.globalAlpha = 1;

            // clear canvas1 and redraw eval text and stats on canvas2
            ctx.clearRect(0, 0, 245, 150);
            Drawings.drawStaticEvaluationPhaseText(ctx2);
        }

        ctx.clearRect(700, 510, 350, 120);
        Drawings.drawStatsStatic(ctx2, stats);

        var success_flag = await updateAndMoveOrganismsBounds(organisms);
    }

    return new Promise((resolve, reject) => {
        resolve(success_flag);
    })
}

function getShortestDistanceToGoal(organisms) {

    let shortest_distance = 10000;
    let closest_organism_index;

    // though this loop identifies closest organism, it also updates organism's distance_to_goal attribute
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
    let next_checkpoint_x;
    let next_checkpoint_y;

    if (next_checkpoint === 'goal') {
        next_checkpoint_x = simSettings.GOAL_X_POS_BOUNDS;
        next_checkpoint_y = simSettings.GOAL_Y_POS_BOUNDS;
    }
    else {
        next_checkpoint_x = simSettings.custom_boundary.checkpoints[next_checkpoint].coordinates[0];
        next_checkpoint_y = simSettings.custom_boundary.checkpoints[next_checkpoint].coordinates[1];
    }

    // calculate distance to closest checkpoint not yet reached
    for (let i = 0; i < organisms.length; i++) {

        // distance^2 = a^2 + b^2
        let horizontal_distance_squared = (organisms[i].x - next_checkpoint_x) ** 2;
        let vertical_distance_squared = (organisms[i].y - next_checkpoint_y) ** 2;
        let distance_to_checkpoint_squared = horizontal_distance_squared + vertical_distance_squared;

        organisms[i].distance_to_next_checkpoint = Math.sqrt(distance_to_checkpoint_squared);

        if (organisms[i].distance_to_next_checkpoint < shortest_distance_to_checkpoint) {
            shortest_distance_to_checkpoint = organisms[i].distance_to_next_checkpoint;
            closest_organism = organisms[i];
        }
    }

    return closest_organism;
}

function calcPopulationFitness (organisms) {
    let total_fitness = 0.00;

    for (let i = 0; i < organisms.length; i++) {
        organisms[i].calcFitness();
        total_fitness += organisms[i].fitness;
    }

    let average_fitness = total_fitness / organisms.length;
    return average_fitness;
}

function calcPopulationFitnessBounds(remaining_distance, organisms, scale) {

    let total_fitness = 0.00;

    for (let i = 0; i < organisms.length; i++) {

        // this also sets each organism's distance_to_goal attribute
        organisms[i].calcDistanceToGoalBounds(remaining_distance);

        // this also sets each organism's fitness attribute
        organisms[i].calcFitnessBounds(scale);

        total_fitness += organisms[i].fitness;
    }

    // set average fitness
    let average_fitness = total_fitness / organisms.length;

    return average_fitness;
}

function evaluatePopulation(organisms) {

    let population_resolution = {
        'closest_organism':  getShortestDistanceToGoal(organisms),
        'average_fitness':  calcPopulationFitness(organisms),
    }

    return population_resolution;
}

// =====================
// ===== SELECTION =====
// =====================

function beginSelectionProcess(organisms, average_fitness) {

    let selection_factor;

    if (average_fitness < .1) {
        selection_factor = 100;
    }
    else {
        selection_factor = 10;
    }

    // fill array with candidates for reproduction
    let potential_mothers = [];
    let potential_fathers = [];

    for (let i = 0; i < organisms.length; i++) {

        // - give organisms with below-average fitness only 1 array spot
        // - organisms with fitness greater than average will be given proper selection bias
        if (organisms[i].fitness < average_fitness) {
            if (organisms[i].gender === 'female') {
                potential_mothers.push(organisms[i]);
            }
            else if (organisms[i].gender === 'male') {
                potential_fathers.push(organisms[i]);
            }
        }
        else {
            for (let j = 0; j < Math.ceil((organisms[i].fitness * selection_factor) ** 2); j++) {
                if (organisms[i].gender === 'female') {
                    potential_mothers.push(organisms[i]);
                }
                else if (organisms[i].gender === 'male') {
                    potential_fathers.push(organisms[i]);
                }
            }
        }
    }

    let potential_parents = {
        'potential_mothers': potential_mothers,
        'potential_fathers': potential_fathers
    }

    return potential_parents;
}

function selectParentsForReproduction(potential_mothers, potential_fathers, next_gen_target_length) {

    let parents = [];

    // create parent couples (if each couple reproduces 2 offspring, population size remains constant)
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
    await paintbrush.fadeIn(Drawings.drawClosestOrganismHighlighted, .03);
    await paintbrush.fadeIn(Drawings.drawClosestOrganismNatural, .03);
    await paintbrush.fadeIn(Drawings.drawClosestOrganismHighlighted, .03);
    await sleep(200);

    // fade out text, return organism to natural color
    await paintbrush.fadeIn(Drawings.drawClosestOrganismNatural, .02);
    await paintbrush.fadeOut(Drawings.drawClosestOrganismText, .04);

    // done drawing closet organism
    paintbrush.subject = null;

    return new Promise(resolve => {
        resolve();
    })
}

async function runChosenParentsAnimations(parents, organisms) {

    // set subject for paintbrush
    paintbrush.subject = parents;

    // highlight mothers
    await paintbrush.fadeIn(Drawings.drawMothersText, .04);
    await sleep(500);

    await paintbrush.fadeIn(Drawings.drawMothersHighlighted, .03);
    await paintbrush.fadeIn(Drawings.drawMothersNatural, .03);
    await paintbrush.fadeIn(Drawings.drawMothersHighlighted, .03);
    await sleep(500);

    // highlight fathers
    await paintbrush.fadeIn(Drawings.drawFathersText, .04);
    await sleep(500);

    await paintbrush.fadeIn(Drawings.drawFathersHighlighted, .03);
    await paintbrush.fadeIn(Drawings.drawFathersNatural, .03);
    await paintbrush.fadeIn(Drawings.drawFathersHighlighted, .03);
    await sleep(500);

    // highlight all
    await paintbrush.fadeIn(Drawings.drawNotChosenText, .03);
    await sleep(1000); 

    // fade out all
    await paintbrush.fadeOut(Drawings.drawAllSelectedOrganismsText, .04);
    await paintbrush.fadeIn(Drawings.drawBothParentTypesNatural, .04);
    await paintbrush.fadeOut(Drawings.drawOrganisms, .02, organisms);
    await sleep(200);

    // done with parents
    paintbrush.subject = null;

    return new Promise(resolve => {
        resolve("Highlight Chosen Parents Animation Complete");
    })
}

async function runSelectionAnimations(closest_organism, parents, organisms) {
    await runClosestOrganismAnimations(closest_organism);
    await runChosenParentsAnimations(parents, organisms);
    
    if (simSettings.sim_type === 'boundary') {
        // we should draw static selection phase on canvas1, and erase that area on canvas2
        ctx2.clearRect(0, 0, 245, 150);
        Drawings.drawStaticSelectionPhaseText(ctx);

        // fade out boundary and reset globalAlpha
        await paintbrush.fadeOut(BoundaryDrawings.drawBoundary, .02);
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

function crossover(parents_to_crossover) {

    let mother = parents_to_crossover[0];
    let father = parents_to_crossover[1];

    // create offspring's genes
    let crossover_genes = [];

    for (let j = 0; j < simSettings.GENE_COUNT; j++) {
        // select if mother or father gene will be used (50% probability)
        let random_bool = Math.random();

        // apply mutation for variance
        // set upper and lower bound for gene mutation using MUTATION_RATE / 2 (male and female genes have equal chance of mutation)
        if (random_bool < (simSettings.MUTATION_RATE / 2) || random_bool > 1 - (simSettings.MUTATION_RATE / 2)) {
            let mutated_gene = getRandomGene(simSettings.MIN_GENE, simSettings.MAX_GENE);
            crossover_genes.push(mutated_gene);
        }
        else if (random_bool < 0.5) {
            let mother_gene = mother.genes[j];
            crossover_genes.push(mother_gene);
        }
        else {
            let father_gene = father.genes[j];
            crossover_genes.push(father_gene);
        }
    }

    return crossover_genes;
}

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

function determineOffspringCount(possible_offspring_counts) {

    let offspring_count;

    if (simSettings.POP_GROWTH === 'fluctuate') {
        let offspring_count_index = Math.floor(Math.random() * possible_offspring_counts.length);
        offspring_count = possible_offspring_counts[offspring_count_index];
    }
    else if (simSettings.POP_GROWTH === 'constant') {
        // each couple will produce 2 offspring
        offspring_count = 2; 
    }

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
    let spawn_x = simSettings.INITIAL_X;
    let spawn_y = simSettings.INITIAL_Y;

    // update spawn point if boundary simulation
    if (simSettings.sim_type === 'boundary') {
        spawn_x = simSettings.INITIAL_X_BOUND;
        spawn_y = simSettings.INITIAL_Y_BOUND;
    }

    let offspring_gender = getGender();
    let offspring = new Organism(offspring_gender, spawn_x, spawn_y);
    offspring.genes = crossover_genes;

    return offspring;
}

function reproduceNewGeneration(parents) {
    let possible_offspring_counts = [0, 0, 1, 1, 2, 2, 2, 3, 4, 5]; // sum = 20, 20/10 items = 2 average

    let offspring_organisms = [];

    for (let i = 0; i < parents.length; i++) {
        let offspring_count = determineOffspringCount(possible_offspring_counts);

        for (let j = 0; j < offspring_count; j++) {
            let crossover_genes = crossover(parents[i]);
            let offspring = reproduce(crossover_genes);
            offspring_organisms.push(offspring);
        }
    }

    return offspring_organisms;
}

async function runNewGenAnimations(gen_summary_stats) {
    await paintbrush.fadeToNewColor(Drawings.drawCreateNewGenPhaseEntryText, .02);
    await paintbrush.fadeIn(Drawings.drawGenerationSummaryText, .025, gen_summary_stats);
    await sleep(2000);
    await paintbrush.fadeOut(Drawings.drawGenerationSummaryText, .025, gen_summary_stats);
    await paintbrush.fadeToNewColor(Drawings.drawCreateNewGenPhaseExitText, .02);
}

// ========================
// ===== TITLE SCREEN =====
// ========================

function createTitleScreenOrganisms() {
    let title_organisms = [];

    for (let i = 0; i < 100; i++) {
        // we need a random x&y value for organism spawn
        let random_x = Math.floor(Math.random() * canvas.width);
        let random_y = Math.floor(Math.random() * canvas.height);

        let new_organism = new Organism('female', random_x, random_y);

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
    let start_button_pressed = false;

    let logo = document.getElementById("logo");
    let press_start_text = document.getElementById("press-start");
    let start_btn = document.getElementsByClassName("start-btn")[0];

    let frame_id;

    start_btn.addEventListener("click", function updateStartBtnFlagOnClick() {
        console.log("Start Button Clicked");
        start_button_pressed = true;
    }, {once: true});

    document.addEventListener('keydown', function updateStartBtnFlagOnEnter(event) {
        if (event.key === "Enter") {
            console.log("Enter Pressed");
            start_button_pressed = true;

            // remove eventListener after flag set
            document.removeEventListener('keydown', updateStartBtnFlagOnEnter);
        }
    });

    return new Promise(resolve => {
        function animateTitle() {
            if (!finished) {

                if (start_button_pressed) {
                    cancelAnimationFrame(frame_id);
                    return resolve("Select Sim Type");
                }

                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            
                // move organisms forever
                for (let i = 0; i < 100; i++) {
                    if (title_organisms[0].index < 250) {
                        if (title_organisms[i].index < 250) {
                            title_organisms[i].x += title_organisms[i].genes[title_organisms[i].index][0];
                            title_organisms[i].y += title_organisms[i].genes[title_organisms[i].index][1];
                            title_organisms[i].index++;
                        }
                        title_organisms[i].move();
                    }
                    else {
                        cycles++;

                        for (let j = 0; j < 100; j++) {
                            title_organisms[j].index = 0;
                        }

                        if (cycles >= 5) {
                            finished = true;
                        }
                    }
                }

                // use globalAlpha for opacity, then reset
                ctx.globalAlpha = opacity;
                ctx.drawImage(logo, 105, 275);

                ctx.globalAlpha = 0.8;

                // blink start text 
                if (opacity_tracker >= 0.12 && opacity_tracker <= 0.24) {

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

                sleep(1000 / simSettings.FPS);
                frame_id = requestAnimationFrame(animateTitle);
            }
            else {
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

        var status = await fadeInTitleAnimation(title_organisms);

        if (status === 'Select Sim Type') {
            selectSimulationType();
        }
    }
    while (status === "Keep Playing");
}

// ================
// ===== MAIN =====
// ================

async function runGeneration(new_generation) {

    let organisms = new_generation.new_population;

    // for drawStats()
    let stats = {
        'organism_count': organisms.length,
        'average_fitness': new_generation.average_fitness.toFixed(2),
        'generation_count': new_generation.generation_count,
    }

    // once turned on, this can't be turned off
    var simulation_succeeded = new_generation.simulation_succeeded;

    if (stats.generation_count != 0) {

        if (simSettings.dialogue) {
            await paintbrush.fadeIn(Drawings.drawStats, .04, stats);
            await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseEntryText, .04);
            await sleep(500);
        }
        else {
            Drawings.drawStatsStatic(ctx2, stats);
        }
    }

    // Phase: Evaluate Individuals

    if (simulation_succeeded) {

        await runEvaluationAnimation(organisms, stats);
    }
    else {
        // check if simulation succeeded 
        let success_flag = await runEvaluationAnimation(organisms, stats);

        if (success_flag) {
            // update flag
            simulation_succeeded = true;

            // give user time to see their win
            await sleep(1500);
            await paintbrush.fadeIn(Drawings.drawSuccessMessage, .02, new_generation.generation_count);

            // [] i'll need to pass organisms here or something, check in testing
            await handleSuccessfulSimDecision(new_generation.generation_count, organisms);            
        }
    }

    if (simSettings.dialogue) {
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseExitText, .01);

        await paintbrush.fadeOut(Drawings.drawStats, .02, stats); // fade out stats before average fitness updated
    }

    // store length of organisms array before deceased organisms filtered out for reproduction (boundary sims)
    let next_gen_target_length = organisms.length;

    let closest_organism;

    let average_fitness;

    // for boundary sims
    let deceased_organisms = [];

    if (simSettings.sim_type === 'classic') {

        let population_resolution = evaluatePopulation(organisms);

        closest_organism = population_resolution['closest_organism'];
        average_fitness = population_resolution['average_fitness'];
    }
    else if (simSettings.sim_type === 'boundary') {

        // remove deceased organisms from array (organisms array is evaluated multiple times and deceased organisms aren't used)
        let organized_organisms = simSettings.custom_boundary.checkPulse(organisms);

        // re-assign organisms array to be only the living organisms
        organisms = organized_organisms['living_organisms'];
        deceased_organisms = organized_organisms['deceased_organisms'];

        // get previous, current, and next checkpoints for current generation
        let checkpoint_data = simSettings.custom_boundary.getFarthestCheckpointReached(organisms);

        // set each organism's distance_to_next_checkpoint attribute
        closest_organism = getShortestDistanceToNextCheckpoint(checkpoint_data['next'], organisms);

        // get remaining distance to goal from checkpoint
        let remaining_distance; 

        if (checkpoint_data['next'] === 'goal') {
            remaining_distance = 0;
        }
        else {
            remaining_distance = simSettings.custom_boundary.checkpoints[checkpoint_data['next']].distance_to_goal;
        }

        // set each organism's distance_to_goal and fitness attributes
        // update average_fitness
        average_fitness = calcPopulationFitnessBounds(remaining_distance, organisms, simSettings.custom_boundary.scale_statistics.scale);
    }

    // Phase: Select Most-Fit Individuals

    if (simSettings.dialogue) {
        await paintbrush.fadeToNewColor(Drawings.drawSelectionPhaseEntryText, .03);
    }

    let potential_parents = beginSelectionProcess(organisms, average_fitness);

    let potential_mothers = potential_parents['potential_mothers'];
    let potential_fathers = potential_parents['potential_fathers'];

    // trigger extinction if not enough mothers and fathers to reproduce a new generation
    if (potential_mothers.length === 0 || potential_fathers.length === 0) {

        await paintbrush.fadeIn(drawExtinctionMessage, .05);

        await sleep(2000);
        do {
            let exit_key = await getUserDecision();
            console.log(exit_key);
        }
        while (exit_key != "q");

        stopSimulation();
    }

    let parents = selectParentsForReproduction(potential_mothers, potential_fathers, next_gen_target_length);

    if (simSettings.sim_type === 'boundary') {
        // combine both organisms arrays for organisms fade-out animation
        organisms = organisms.concat(deceased_organisms);
    }
    
    if (simSettings.dialogue) {
        await runSelectionAnimations(closest_organism, parents, organisms);
        await paintbrush.fadeToNewColor(Drawings.drawSelectionPhaseExitText, .02);
    }
    else {
        await paintbrush.fadeOut(Drawings.drawOrganisms, .02, organisms);
    }

    // Phase: Crossover / Mutation / Reproduce New Generation

    // this function handles crossover, mutation and reproduction
    // get/create next generation of organisms
    let offspring_organisms = reproduceNewGeneration(parents);

    if (simSettings.POP_GROWTH === 'constant') {
        if (offspring_organisms.length === organisms.length + 1) {

            // trim-off 1 organism to keep pop. size constant for odd number of organisms
            offspring_organisms.pop();
        }
    }

    // done with organisms arrays
    organisms = [];
    deceased_organisms = [];

    if (simSettings.dialogue) {

        await runCrossoverAnimations();

        await runMutationAnimations();

        let gen_summary_stats = {
            'offspring_organisms': offspring_organisms,
            'average_fitness': average_fitness,
            'generation_count': new_generation.generation_count,
        }

        await runNewGenAnimations(gen_summary_stats);
    }

    // increment generation_count before resetting object
    let next_generation_count = new_generation.generation_count += 1;

    // prepare for next generation with necessary data 
    new_generation = {};
    new_generation.generation_count = next_generation_count;
    new_generation.new_population = offspring_organisms;
    new_generation.average_fitness = average_fitness;
    new_generation.simulation_succeeded = simulation_succeeded;

    return new Promise(resolve => {
        resolve(new_generation);
    })
}

async function runSimulation () {

    // remove run-btn listener and hide
    document.getElementsByClassName("run-btn")[0].removeEventListener('click', runSimulation);
    document.getElementsByClassName("run-btn")[0].style.display = 'none';

    // display stop simulation button & add its listener
    let stop_sim_btn = document.getElementsByClassName("stop-btn")[0];
    stop_sim_btn.style.display = 'block';
    stop_sim_btn.innerHTML = 'Quit';

    stop_sim_btn.addEventListener('click', function stopSim() {
        stopSimulation();
    }, {once: true});

    console.log("Running simulation with these settings:");
    console.log(simSettings);

    // pre-sim animations
    await runPreSimAnimations();

    let initial_population = createOrganisms();

    // create initial generation and stats
    let new_generation = {};
    new_generation.new_population = initial_population;
    new_generation.average_fitness = 0.00;
    new_generation.simulation_succeeded = false;
    new_generation.generation_count = 0;

    do {
        new_generation = await runGeneration(new_generation);
    } while (new_generation.generation_count < 1000);
}

function stopSimulation() {
    // reload page
    document.location.reload();
}

// ============================
// ===== EXTRAS / UNKNOWN =====
// ============================

// getPixel() functions only used by createNewBoundary.draw() and UpdateAndMoveOrganismsBounds()
function getPixel(canvas_data, index) {
    let i = index * 4;
    let data = canvas_data.data;

    return [data[i], data[i+1], data[i+2], data[i+3]];
}

function getPixelXY(canvas_data, x, y) {
    let index = y * canvas_data.width + x;

    return getPixel(canvas_data, index);
}

function sleep(milliseconds) {
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
        }, {once: true});
    })
}

async function handleSuccessfulSimDecision(generation_count, organisms) {
    let key_pressed;

    do {
        key_pressed = await getUserDecision();
        console.log(key_pressed);
    }
    while (key_pressed != "Enter" && key_pressed != "q");

    await paintbrush.fadeOut(Drawings.drawSuccessMessage, .05, generation_count);
    
    Drawings.drawOrganisms(1, organisms);

    if (key_pressed === 'Enter') {
        console.log("Continuing Simulation.");
        await sleep(500);
    }
    else if (key_pressed === 'q') {
        console.log("Quitting Simulation.");

        await paintbrush.fadeOut(Drawings.drawOrganisms, .05, organisms);

        stopSimulation();
    }
}

function getRandomGene(min, max) {
    let random_x = Math.floor(Math.random() * (max - min + 1) + min);
    let random_y = Math.floor(Math.random() * (max - min + 1) + min);
    let random_gene = [random_x, random_y];
    return random_gene;
}