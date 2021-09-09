document.addEventListener("DOMContentLoaded", playTitleScreenAnimation, {once: true});

import * as Drawings from "./modules/drawings.js";
import * as BoundaryUtils from "./modules/boundary_utils.js";
import * as SettingsUtils from "./modules/settings_utils.js";

// ===== vars =====

window.simGlobals = {
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
simGlobals.custom_boundary; // [] (one drawing: drawBoundary())

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

class Goal {
    constructor(x, y, size) {
        this.x = x;
        this.y = y;
        this.size = size;
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

// ====================
// ===== BOUNDARY =====
// ====================

function applyInitialBoundaryStyles() {
    // turn off settings, turn on canvas
    document.getElementsByClassName("canvas-container")[0].style.display = 'block';
    document.getElementsByClassName("settings-container")[0].style.display = 'none';

    Drawings.drawBoundaryBoilerplate();

    // hide buttons
    // document.getElementsByClassName("setting-submit")[0].style.display = 'none'; I believe setting-submit already display=none
    document.getElementsByClassName("run-btn")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-classic")[0].style.display = 'none';
    document.getElementsByClassName("sim-type-boundary")[0].style.display = 'none';

    let stop_btn = document.getElementsByClassName("stop-btn")[0];

    stop_btn.style.gridColumn = "1 / 2";
    stop_btn.style.width = "75%";
    stop_btn.innerHTML = "Reset";
    stop_btn.style.display = "block";

    // restart boundary drawing if user desires
    stop_btn.addEventListener("click", function() {
        createNewBoundary();
    }, {once: true});
}

// this function will be refactored/cleaned
function createNewBoundary() {

    // =============================================================================================
    // === this is the first appearance of Boundary, and where the module will be first required ===
    // =============================================================================================

    // instantiate class Boundary instance
    var new_boundary = new BoundaryUtils.Boundary();

    new_boundary.testClassMethod(); // works

    // drawing flag and step tracker
    var allowed_to_draw = false; // could be method of Paintbrush
    var boundary_step = "bottom-boundary"; // could be attribute of Boundary? idk..

    // Stores the position of the cursor
    simGlobals.coordinates = {'x':0 , 'y':0}; // []

    applyInitialBoundaryStyles();

    Drawings.drawBoundaryDrawingHelpText("Step 1");

    // draw bottom-boundary connectors red
    Drawings.drawBottomBoundaryEndpointsRed();

    function draw(event) {
        if (event.buttons !== 1 || !allowed_to_draw) {
            // return if left-mouse button not pressed or if user not allowed to draw
            return;
        }

        ctx.beginPath();
        ctx.moveTo(simGlobals.coordinates['x'], simGlobals.coordinates['y']);
        BoundaryUtils.updateMousePosition(event);

        // draw different line depending on boundary_step
        if (boundary_step === 'full-boundary') {

            let canvas_data = ctx.getImageData(0, 0, canvas.width, canvas.height)

            // get pixel color before drawing, reject if green
            let pixel_data = getPixelXY(canvas_data, simGlobals.coordinates['x'], simGlobals.coordinates['y']);

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
        
        BoundaryUtils.updateMousePosition(event);

        if (boundary_step === 'bottom-boundary') {
            // check that user is trying to draw from first connector (ctx.fillRect(150, 550, 20, 50))
            // make helper function eventually
            if (simGlobals.coordinates['x'] >= 160 && simGlobals.coordinates['x'] <= 180 && 
                simGlobals.coordinates['y'] >= 540 && simGlobals.coordinates['y'] <= 560) {
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
            // check that user is trying to draw from the first connector     ctx.arc(50, 430, 10, 0, Math.PI*2, false);
            if (simGlobals.coordinates['x'] >= 40 && simGlobals.coordinates['x'] <= 60 &&
                simGlobals.coordinates['y'] >= 420 && simGlobals.coordinates['y'] <= 440) {
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

                    Drawings.drawBottomBoundaryGatesAndConnectorsGreen();

                    // update step and store boundary
                    new_boundary.save('bottom');
                    boundary_step = "top-boundary";
                    Drawings.drawBoundaryDrawingHelpText("Step 2");
                    Drawings.drawTopBoundaryEndpointsRed();
                }
                else {
                    // erase bottom-boundary coords when illegal line drawn
                    new_boundary.bottom_boundary_coordinates = [];

                    // redraw boilerplate & help text
                    Drawings.drawBoundaryBoilerplate();
                    Drawings.drawBoundaryDrawingHelpText("Step 1");
                    Drawings.drawBottomBoundaryEndpointsRed();
                }
            }
            else if (boundary_step === "top-boundary") {
                let top_boundary_is_valid = new_boundary.validateTop(event);

                // could make own function for this condition
                if (top_boundary_is_valid) {

                    Drawings.drawTopBoundaryGatesAndConnectorsGreen();

                    // draw white dot for next step
                    ctx.fillStyle = 'white';
                    ctx.beginPath();
                    ctx.arc(80, 510, 10, 0, Math.PI*2, false);
                    ctx.fill();

                    // make goal new color (can be a flag in drawBoundaryBoilerplate())
                    ctx.fillStyle = 'rgb(232, 0, 118)';
                    ctx.fillRect(925, 50, 20, 20);

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
                    Drawings.drawTopBoundaryEndpointsRed();
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
    canvas.addEventListener('mouseenter', BoundaryUtils.updateMousePosition);
    canvas.addEventListener('mousedown', requestDrawingPermission);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', validateBoundaryConnection);

    // make class method?
    let save_bounds_btn = document.getElementsByClassName("save-boundaries-btn")[0];

    save_bounds_btn.addEventListener("click", function() {
        console.log("Saving Custom Boundaries");

        // draw Boundary as it will appear in simulation
        Drawings.drawFinalBoundary(new_boundary.top_boundary);

        // save full boundary
        new_boundary.save('full');

        // creates checkpoints, sets scale attribute
        new_boundary.prepareBoundaryForSimulation();

        // make boundary global
        simGlobals.custom_boundary = new_boundary;

        // turn off listeners
        canvas.removeEventListener('mouseenter', BoundaryUtils.updateMousePosition);
        canvas.removeEventListener('mousedown', requestDrawingPermission);
        canvas.removeEventListener('mousemove', draw);
        canvas.removeEventListener('mouseup', validateBoundaryConnection);

        // set global sim settings
        SettingsUtils.configureSettings();
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

    // code below this will be executed even if skip === true
    skip_btn.style.display = 'none';

    // add content for drawStats()
    let pre_sim_stats = {};
    pre_sim_stats.generation_count = 0;
    pre_sim_stats.average_fitness = '0.00';
    pre_sim_stats.organism_count = document.getElementById("total-organisms").value;

    await paintbrush.fadeIn(Drawings.drawStats, .02, pre_sim_stats);
    await sleep(500);

    if (simGlobals.dialogue) {
        await paintbrush.fadeIn(Drawings.drawPhases, .02);
        await sleep(500);
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseEntryText, .02);
        await paintbrush.fadeIn(Drawings.drawFakeGoal, .02);
    }

    return new Promise(resolve => {
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
        simGlobals.sim_type = 'classic';
        Drawings.highlightClassicSimType();
    }
    else if (event.target.className === 'sim-type-boundary') {
        simGlobals.sim_type = 'boundary';
        Drawings.highlightBoundarySimType();
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
            simGlobals.sim_type = 'classic';
            Drawings.highlightClassicSimType();
            break;

        case "ArrowRight":
            simGlobals.sim_type = 'boundary';
            Drawings.highlightBoundarySimType();
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

// boundary class methods? (could import boundary drawings required to boundary_utils.js)
function turnOnBoundaryIntroductionOneListeners() {
    let next_btn = document.getElementsByClassName("next-btn")[0];
    next_btn.style.display = 'block';

    next_btn.addEventListener('click', function continueIntroduction() {

        // go to next screen
        Drawings.drawBoundaryCreationIntroductionTwo();
        turnOnBoundaryIntroductionTwoListeners();

    }, {once: true});

    document.addEventListener('keydown', function checkKeystroke(event) {
        if (event.key === 'Enter') {

            // go to next screen
            Drawings.drawBoundaryCreationIntroductionTwo();
            turnOnBoundaryIntroductionTwoListeners();
        
        }
    }, {once: true});
}

function turnOnBoundaryIntroductionTwoListeners() {
    
    // change text
    let next_btn = document.getElementsByClassName("next-btn")[0];
    next_btn.innerHTML = 'Continue';

    next_btn.addEventListener('click', function finishBoundaryIntroduction() {

        next_btn.style.display = 'none';

        // go to next screen
        createNewBoundary();

    }, {once: true});    

    document.addEventListener('keydown', function checkKeystroke(event) {
        if (event.key === 'Enter') {
            // remove listener
            document.removeEventListener('keydown', checkKeystroke);

            // hide next_btn
            next_btn.style.display = 'none';

            // go to next screen
            // just a placeholder test
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

    if (simGlobals.sim_type === 'classic') {
        // set global sim settings
        SettingsUtils.configureSettings();
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

        let organism = new Organism(gender, spawn_x, spawn_y);

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
                                    // ctx.fillStyle = 'red';
                                    // changing deceased color to gray (mother pink is too close)
                                    ctx.fillStyle = '#333';
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
                            ctx.fillStyle = '#333';
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

function updateAndMoveOrganisms(organisms, goal) {
    return new Promise(resolve => {
        let total_moves = 0;
        let finished = false;
        let success_flag = false;
        let frame_id;

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

async function runEvaluationAnimation(organisms, stats) {

    // need to draw goal at location depending on sim type
    if (simGlobals.sim_type === 'classic') {
        let goal = new Goal(simGlobals.GOAL_X_POS, simGlobals.GOAL_Y_POS, 20);
        // draw goal on canvas2 (consider fade-in goal on dialogue sims?)
        Drawings.drawGoal(goal);
        var success_flag = await updateAndMoveOrganisms(organisms, goal); // still pass in goal for .hasReachedGoal()
    }
    else if (simGlobals.sim_type === 'boundary') {
        // *** this is super messy ***

        if (simGlobals.dialogue) {
            // draw eval text and stats on canvas1
            ctx2.clearRect(0, 0, 245, 150);
            Drawings.drawStaticEvaluationPhaseText(ctx);
        }

        ctx2.clearRect(700, 510, 350, 120);
        Drawings.drawStatsStatic(ctx, stats);

        if (stats.generation_count === 0 && !simGlobals.dialogue) {
            await paintbrush.fadeIn(Drawings.drawBoundary, .015);
            ctx2.globalAlpha = 1;
        }

        if (simGlobals.dialogue) {
            await paintbrush.fadeIn(Drawings.drawBoundary, .015);
            ctx2.globalAlpha = 1;

            // clear canvas1 and redraw eval text and stats on canvas2
            ctx.clearRect(0, 0, 245, 150);
            Drawings.drawStaticEvaluationPhaseText(ctx2);
        }

        ctx.clearRect(700, 510, 350, 120);
        Drawings.drawStatsStatic(ctx2, stats);

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
        let total_fitness = 0.00;

        for (let i = 0; i < organisms.length; i++) {
            organisms[i].calcFitness();
            total_fitness += organisms[i].fitness;
        }

        let average_fitness = total_fitness / organisms.length;
        resolve(average_fitness);
    })
}

function calcPopulationFitnessBounds(remaining_distance, organisms, scale) {

    // calc/set distance_to_goal && fitness
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

    console.log(average_fitness, total_fitness, organisms.length);

    return average_fitness;
}

// not converted var >> let yet
async function evaluatePopulation(organisms) {
    let closest_organism = await getShortestDistanceToGoal(organisms);
    let average_fitness = await calcPopulationFitness(organisms);

    // also redundant, fix
    let population_resolution = {
        'closest_organism': closest_organism,
        'average_fitness': average_fitness
    }

    return new Promise(resolve => {
        resolve(population_resolution);
    })
}

// =====================
// ===== SELECTION =====
// =====================

function beginSelectionProcess(organisms) {
    // fill array with candidates for reproduction
    let potential_mothers = [];
    let potential_fathers = [];

    for (let i = 0; i < organisms.length; i++) {
        // Give organisms with negative fitness a chance to reproduce
        if (organisms[i].fitness < 0) {
            organisms[i].fitness = 0.01;
        }

        // I'm going to try this implementation >> (organism.fitness * 100) ** 1.25
        for (let j = 0; j < Math.ceil((organisms[i].fitness * 100) ** 2); j++) {
            if (organisms[i].gender === 'female') {
                potential_mothers.push(organisms[i]);
            }
            else if (organisms[i].gender === 'male') {
                potential_fathers.push(organisms[i]);
            }
        }
        // console.log(`Fitness for Organism ${i}: ${organisms[i].fitness}`);
        // console.log(`Organism ${i} was added to array ${Math.ceil((organisms[i].fitness * 100) ** 2)} times.`);
    }

    let potential_parents = {
        'potential_mothers': potential_mothers,
        'potential_fathers': potential_fathers
    }

    return new Promise(resolve => {
        resolve(potential_parents);
    })
}

function selectParentsForReproduction(potential_mothers, potential_fathers, next_gen_target_length) {

    // this function creates parent couples === length of organisms / 2

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
    console.log("Called runSelectionAnimations()");
    // maybe model other phases after this one
    await runClosestOrganismAnimations(closest_organism); // finished
    await runChosenParentsAnimations(parents, organisms);
    
    // make own function
    if (simGlobals.sim_type === 'boundary') {

        // fade out boundary
        // we should draw a static selection phase on canvas1, and erase that area on canvas2
        ctx2.clearRect(0, 0, 245, 150);
        Drawings.drawStaticSelectionPhaseText(ctx);

        // fade out boundary and reset globalAlpha
        await paintbrush.fadeOut(Drawings.drawBoundary, .02);
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

    let offspring_count;

    if (simGlobals.POP_GROWTH === 'fluctuate') {
        // this shouldn't be declared every call.. (fix)
        let possible_offspring_counts = [0, 0, 1, 1, 2, 2, 2, 3, 4, 5]; // sum = 20, 20/10 items = 2avg

        let offspring_count_index = Math.floor(Math.random() * possible_offspring_counts.length);
        offspring_count = possible_offspring_counts[offspring_count_index];
    }
    else if (simGlobals.POP_GROWTH === 'constant') {
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
    let spawn_x = simGlobals.INITIAL_X;
    let spawn_y = simGlobals.INITIAL_Y;

    // update spawn point if boundary simulation
    if (simGlobals.sim_type === 'boundary') {
        spawn_x = simGlobals.INITIAL_X_BOUND;
        spawn_y = simGlobals.INITIAL_Y_BOUND;
    }

    let offspring_gender = getGender();
    let offspring = new Organism(offspring_gender, spawn_x, spawn_y);
    offspring.genes = crossover_genes;

    // push offspring to new population
    // simGlobals.offspring_organisms.push(offspring);
    return offspring;
}

function reproduceNewGeneration(parents) {
    // holds our new generation of organisms
    let offspring_organisms = [];

    for (let i = 0; i < parents.length; i++) {
        let offspring_count = determineOffspringCount();

        for (let j = 0; j < offspring_count; j++) {
            let crossover_genes = crossover(parents[i]); // returns dict
            let offspring = reproduce(crossover_genes);
            offspring_organisms.push(offspring);
        }
    }

    return offspring_organisms;
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
        // we need a random x&y value to start the organism at 
        let random_x = Math.floor(Math.random() * canvas.width);
        let random_y = Math.floor(Math.random() * canvas.height);

        let new_organism = new Organism('female', random_x, random_y);

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

                // respond to event listener flag
                if (start_button_pressed) {
                    // cancel and resolve
                    cancelAnimationFrame(frame_id);
                    return resolve("Select Sim Type");
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
                frame_id = requestAnimationFrame(animateTitle);
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

// not converted var >> let yet
async function runGeneration(new_generation) {

    console.log("runGeneration() called");
    console.log(new_generation.new_population);

    // start with let, upgrade to var if needed
    let organisms = new_generation.new_population;

    // for drawStats()
    let stats = {
        'organism_count': organisms.length,
        'average_fitness': new_generation.average_fitness.toFixed(2),
        'generation_count': new_generation.generation_count,
    }

    // intentional var to increase scope access
    // once turned on, this is never turned off
    var simulation_succeeded = new_generation.simulation_succeeded;

    if (stats.generation_count != 0) {
        if (simGlobals.dialogue) {
            await paintbrush.fadeIn(Drawings.drawStats, .04, stats);
            await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseEntryText, .04);
            await sleep(500);
        }
        else {
            // untested
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
        await paintbrush.fadeToNewColor(Drawings.drawEvaluationPhaseExitText, .01);

        await paintbrush.fadeOut(Drawings.drawStats, .02, stats); // put here to fade out stats before average fitness updated
        // await sleep(1000);
    }

    // store length of organisms array before deceased organisms filtered out for reproduction (boundary sims)
    let next_gen_target_length = organisms.length; 
    let closest_organism;

    // factoring out of global
    let average_fitness;

    // for boundary sims
    let deceased_organisms = [];

    if (simGlobals.sim_type === 'classic') {
        let population_resolution = await evaluatePopulation(organisms); // maybe don't await here
        closest_organism = population_resolution['closest_organism'];
        average_fitness = population_resolution['average_fitness'];
    }
    else if (simGlobals.sim_type === 'boundary') {

        // remove deceased organisms from array (organisms array is evaluated multiple times and deceased organisms aren't used)
        console.log(`before checkPulse(): ${organisms.length}`);

        // returns array of living and deceased organisms
        let organized_organisms = simGlobals.custom_boundary.checkPulse(organisms);

        // re-assign array to be only the living organisms
        organisms = organized_organisms['living_organisms'];
        deceased_organisms = organized_organisms['deceased_organisms'];

        console.log(`after checkPulse(): ${organisms.length}`);

        // draw checkpoints for reference
        // simGlobals.custom_boundary.drawCheckpoints();

        // here, we set checkpoints[i].distance_to_goal 
        // should this only be done on iteration #1???
        // calcDistanceToGoalCheckpoints(); turning off to make sure sure initially

        // get previous, current, and next checkpoints for current generation
        let checkpoint_data = simGlobals.custom_boundary.getFarthestCheckpointReached(organisms);

        // this will set each organism's distance_to_next_checkpoint attribute
        // *** i think the problem lies here
        closest_organism = getShortestDistanceToNextCheckpoint(checkpoint_data['next'], organisms);

        // distance_to_goal = distance_to_next_checkpoint + next_checkpoint.distance_to_goal
        // 'next' will give us the index in the checkpoints array of the checkpoint we want to measure from
        let remaining_distance = simGlobals.custom_boundary.checkpoints[checkpoint_data['next']].distance_to_goal;

        console.log(remaining_distance);

        // this function will set each organism's distance_to_goal and fitness attributes
        // it also updates average_fitness
        average_fitness = calcPopulationFitnessBounds(remaining_distance, organisms, simGlobals.custom_boundary.scale_statistics.scale);

        console.log(`Average Fitness: ${average_fitness}`);
    }

    // average_fitness should be integrated up to here. I think the only think left to do is assign it to new_generation for the next-gen stats

    // PHASE: SELECT MOST-FIT INDIVIDUALS
    if (simGlobals.dialogue) {
        await paintbrush.fadeToNewColor(Drawings.drawSelectionPhaseEntryText, .03);
    }

    // this phase includes: beginSelectionProcess(), selectParentsForReproduction()
    let potential_parents = await beginSelectionProcess(organisms); // maybe don't await here

    let potential_mothers = potential_parents['potential_mothers'];
    let potential_fathers = potential_parents['potential_fathers'];

    // we shouldn't enter the selection phase if there aren't enough organisms to reproduce
    // this could happen if a population produced all males, then potential_mothers would never get filled, and program fails
    // check extinction
    if (potential_mothers.length === 0 || potential_fathers.length === 0) {

        // not converting to module yet
        // await fadeInExtinctionMessage();
        await paintbrush.fadeIn(drawExtinctionMessage, .05); // untested

        await sleep(2000);
        do {
            let exit_key = await getUserDecision();
            console.log(exit_key);
        }
        while (exit_key != "q");

        stopSimulation();
    }

    let parents = selectParentsForReproduction(potential_mothers, potential_fathers, next_gen_target_length);

    // we need to combine organisms + deceased organisms for organism fade out (boundary only)

    // at this point, 'parents' is the only array of organisms we still need
    // combine both organisms arrays for organisms fade-out animation
    if (simGlobals.sim_type === 'boundary') {
        organisms = organisms.concat(deceased_organisms);
    }
    
    if (simGlobals.dialogue) { // here
        await runSelectionAnimations(closest_organism, parents, organisms);

        await paintbrush.fadeToNewColor(Drawings.drawSelectionPhaseExitText, .02);
    }
    else {
        console.log(organisms);
        await paintbrush.fadeOut(Drawings.drawOrganisms, .02, organisms);
    }

    // this function handles crossover, mutation and reproduction
    // this function pushes new gen organisms to offspring_organisms[]
    // get next generation of organisms
    let offspring_organisms = reproduceNewGeneration(parents);

    // trim-off 1 organism to keep pop. size constant for odd number of organisms (reproduceNewGeneration() can only produce even number of organisms (constant-sims only))
    if (simGlobals.POP_GROWTH === 'constant') {
        if (offspring_organisms.length === organisms.length + 1) {
            offspring_organisms.pop();
        }
    }

    // we are done with organisms
    organisms = [];
    deceased_organisms = [];

    // PHASE: CROSSOVER / MUTATE / REPRODUCE
    if (simGlobals.dialogue) {

        await runCrossoverAnimations();

        await runMutationAnimations();

        // maybe add generation_count here
        let gen_summary_stats = {
            'offspring_organisms': offspring_organisms,
            'average_fitness': average_fitness,
            'generation_count': new_generation.generation_count,
        }

        await runNewGenAnimations(gen_summary_stats);
    }

    // prepare for next generation with necessary data
    // increment generation_count before resetting object
    let next_generation_count = new_generation.generation_count += 1;

    // maybe this should be called 'next_generation'?
    new_generation = {};
    new_generation.generation_count = next_generation_count;
    new_generation.new_population = offspring_organisms;
    new_generation.average_fitness = average_fitness; // this actually represents the previous generation's average fitness, keep in mind.
    new_generation.simulation_succeeded = simulation_succeeded;

    return new Promise(resolve => {
        resolve(new_generation);
    })
}

async function runSimulation () {

    // remove run-btn listener
    document.getElementsByClassName("run-btn")[0].removeEventListener('click', runSimulation);

    // hide start/settings buttons
    document.getElementsByClassName("run-btn")[0].style.display = 'none';

    // display stop simulation button & add its listener
    let stop_sim_btn = document.getElementsByClassName("stop-btn")[0];
    stop_sim_btn.style.display = 'block';
    stop_sim_btn.innerHTML = 'Quit';

    stop_sim_btn.addEventListener('click', function stopSim() {
        stopSimulation();
    }, {once: true});

    console.log("Running Simulation with these settings:");
    console.log(simGlobals);

    // pre-sim animations
    await runPreSimAnimations();

    /// PHASE: CREATE NEW GENERATION/POPULATION
    let initial_population = createOrganisms();
    console.log("Amount of organisms created = " + initial_population.length);

    // could save to global, but I'll try it passing it the same way future gens will first
    let new_generation = {};
    new_generation.new_population = initial_population;
    new_generation.average_fitness = 0.00;
    new_generation.simulation_succeeded = false;
    new_generation.generation_count = 0;

    do {
        new_generation = await runGeneration(new_generation);
        console.log(new_generation.generation_count);
    } while (new_generation.generation_count < 1000);
}

function stopSimulation() {
    // reloads the page
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

    // how it works?
    // say we're at position (2, 2) on canvas, and canvas is 1000px wide
    // index = (2 * 1000) + 2 = 2002
    // reading left to right, pixel at (2, 2) is pixel #2002 ?

    return getPixel(canvas_data, index);
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
        }, {once: true});
    })
}

function getRandomGene(min, max) {
    let random_x = Math.floor(Math.random() * (max - min + 1) + min);
    let random_y = Math.floor(Math.random() * (max - min + 1) + min);
    let random_gene = [random_x, random_y];
    return random_gene;
}