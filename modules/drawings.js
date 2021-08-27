// tests
function testModule(message) {
    console.log(message);
}

function findSammy() {
    console.log(simGlobals.sammy);
}

// ===== drawings for simulator.js =====
function drawSimulationSettings(opacity) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

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
    ctx.fillText(`${simGlobals.TOTAL_ORGANISMS}`, 600, 250);
    ctx.fillText(`${simGlobals.GENE_COUNT}`, 600, 290);
    ctx.fillText(`${simGlobals.MAX_GENE}`, 600, 330);
    ctx.fillText(`${simGlobals.MUTATION_RATE}`, 600, 370);

    if (simGlobals.dialogue === false) {
        ctx.fillText(`Disabled`, 600, 410);
    }
    else {
        ctx.fillText(`Enabled`, 600, 410);
    }
}

function drawSimulationIntro(opacity) {
    ctx.clearRect(0, 75, canvas.width, 500);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '28px arial';
    ctx.fillText(`${simGlobals.TOTAL_ORGANISMS} organisms were created with completely random genes.`, 125, 290);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '22px arial';
    ctx.fillText("This society of organisms needs to reach the goal if it wants to survive.", 150, 330);
}

function drawFakeGoal(opacity) {
    ctx.clearRect(500, 50, 20, 20);
    
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillRect(500, 50, 20, 20);
}

function drawSimulationExplanation(opacity) {
    ctx.clearRect(0, 100, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '22px arial';
    ctx.fillText("Using a genetic algorithm based on natural selection, these organisms will undergo", 125, 290);
    ctx.fillText("generations of reproduction, evaluation, selection, gene crossover and mutation,", 125, 320);
    ctx.fillText("until they succeed or fail to survive.", 350, 350);
}

function drawExplanationAndGoal(opacity) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '22px arial';
    ctx.fillText("Using a genetic algorithm based on natural selection, these organisms will undergo", 125, 290);
    ctx.fillText("generations of reproduction, evaluation, selection, gene crossover and mutation,", 125, 320);
    ctx.fillText("until they succeed or fail to survive.", 350, 350);

    // fake goal
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillRect(500, 50, 20, 20);
}

// may need to be updated for resilience
function drawStats(opacity) {
    ctx2.clearRect(700, 510, 350, 120);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.font = "22px arial";
    ctx2.fillText('Generation:', 740, 535);
    ctx2.fillText(simGlobals.generation_count.toString(), 940, 535);
    ctx2.fillText('Population Size:', 740, 560);
    ctx2.fillText(simGlobals.TOTAL_ORGANISMS.toString(), 940, 560);
    ctx2.fillText('Average Fitness:', 740, 585);
    ctx2.fillText(simGlobals.average_fitness.toString(), 940, 585);
}

// phase module
function drawPhases(opacity) {
    ctx2.clearRect(0, 0, 245, 150);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Crossover", 10, 120);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Mutate", 10, 150);
}

// phase module
function drawEvaluationPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 40, 180, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);
}

// phase module
function drawEvaluationPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 40, 180, 20);

    ctx2.font = "20px arial";
    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);
}

// phase module
function drawSelectionPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 70, 245, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);
}

function drawClosestOrganismText(opacity) {
    ctx.clearRect(750, 450, 275, 20);

    ctx.font = "20px arial";
    ctx.fillStyle = `rgb(255, 215, 0, ${opacity})`;
    ctx.fillText("Most-Fit Individual", 800, 470);   
}

function drawClosestOrganismHighlighted(opacity) {
    ctx.fillStyle = `rgba(255, 215, 0, ${opacity})`;
    ctx.beginPath();
    ctx.arc(paintbrush.subject.x, paintbrush.subject.y, paintbrush.subject.radius, 0, Math.PI*2, false);
    ctx.fill();
}

function drawClosestOrganismNatural(opacity) {
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.beginPath();
    ctx.arc(paintbrush.subject.x, paintbrush.subject.y, paintbrush.subject.radius, 0, Math.PI*2, false);
    ctx.fill();
}

function drawMothersText(opacity) {
    ctx.clearRect(750, 480, 275, 20);
    
    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
    ctx.fillText("Females Selected", 800, 500);
}

function drawFathersText(opacity) {
    ctx.clearRect(750, 510, 275, 20);

    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(36, 0, 129, ${opacity})`;
    ctx.fillText("Males Selected", 800, 530);
}

function drawMothersHighlighted(opacity) {
    for (let i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][0].x, paintbrush.subject[i][0].y, paintbrush.subject[i][0].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawMothersNatural(opacity) {
    for (var i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][0].x, paintbrush.subject[i][0].y, paintbrush.subject[i][0].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawFathersHighlighted(opacity) {
    for (var i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(36, 0, 129, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][1].x, paintbrush.subject[i][1].y, paintbrush.subject[i][1].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawFathersNatural(opacity) {
    for (var i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][1].x, paintbrush.subject[i][1].y, paintbrush.subject[i][1].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawNotChosenText(opacity) {
    ctx.clearRect(750, 540, 275, 20);

    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText("Not Selected", 800, 560);
}

function drawAllSelectedOrganismsText(opacity) {
    ctx.clearRect(750, 480, 275, 100);

    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
    ctx.fillText("Females Selected", 800, 500);

    ctx.fillStyle = `rgba(36, 0, 129, ${opacity})`;
    ctx.fillText("Males Selected", 800, 530);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText("Not Selected", 800, 560);
}

function drawBothParentTypesNatural(opacity) {
    for (let i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][0].x, paintbrush.subject[i][0].y, paintbrush.subject[i][0].radius, 0, Math.PI*2, false);
        ctx.fill();

        ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][1].x, paintbrush.subject[i][1].y, paintbrush.subject[i][1].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

// similar to redrawOrganisms(), but this function accepts an opacity value to allow fading
// used in multiple places
function drawOrganisms(opacity) {
    for (let i = 0; i < simGlobals.organisms.length; i++) {
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(simGlobals.organisms[i].x, simGlobals.organisms[i].y, simGlobals.organisms[i].radius, 0, Math.PI*2, false);
        ctx.fill();

        ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
        ctx.beginPath();
        ctx.arc(simGlobals.organisms[i].x, simGlobals.organisms[i].y, simGlobals.organisms[i].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

// phase module
function drawSelectionPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 70, 245, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);
}

// phase module
function drawCrossoverPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 100, 200, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Crossover", 10, 120);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Crossover", 10, 120);
}

function drawCrossoverDescriptionText(opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(75, 275, 950, 150);

    var description = "Genes of the selected parent couples are combined to create new offspring.";

    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(description, 200, 300);
}

// phase module
function drawCrossoverPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 100, 100, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Crossover", 10, 120);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Crossover", 10, 120); 
}

// phase module
function drawMutationPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 130, 200, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Mutate", 10, 150);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Mutate", 10, 150);
}

function drawMutationDescriptionText(opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(100, 275, 800, 150);

    var description = "To maintain genetic diversity, a small percentage of random genes are mutated";
    var mutation_rate_text = `Mutation Rate: ${(simGlobals.MUTATION_RATE * 100).toFixed(2)}%`.toString();

    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(description, 190, 300);

    ctx.font = "22px arial";
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(mutation_rate_text, 420, 350);
}

// phase module
function drawMutationPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 130, 100, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Mutate", 10, 150);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Mutate", 10, 150);
}

// phase module
function drawCreateNewGenPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 10, 250, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);
} 

function drawGenerationSummaryText(opacity) {
    let generation_summary_text = `Generation ${simGlobals.generation_count} Summary:`;
    let generation_average_fitness_preface = 'Average Fitness:';
    let generation_offspring_reproduced_preface = 'Offspring Reproduced:';

    ctx.fillStyle = 'black';
    ctx.fillRect(100, 250, 800, 200);

    ctx.font = "22px arial";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(generation_summary_text, 380, 280);

    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(generation_average_fitness_preface, 380, 330);

    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(simGlobals.average_fitness.toFixed(2).toString(), 600, 330);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(generation_offspring_reproduced_preface, 380, 355);

    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(simGlobals.organisms.length.toString(), 600, 355);
}

// phase module
function drawCreateNewGenPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 10, 215, 20);

    ctx2.font = "20px arial";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);
}

// =====
// below are boundary drawings (mostly) just in case want to make another module
// =====

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
    // * If this doesn't work, consider calling drawFakeGoal() instead *
    // var placeholder_goal = new Goal(925, 50, 20, ctx);
    // placeholder_goal.drawGoal();
    drawFakeGoal();

    // draw instructions zones (no-draw zones)
    ctx.lineWidth = 4;
    ctx.strokeWidth = 4;
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.strokeRect(736, 445, 272, 200);
    ctx.strokeRect(-4, -4, 252, 157);
}

function drawBoundaryCreationIntroductionOne() {
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
} 

function drawBoundaryCreationIntroductionTwo() {

    drawBoundaryBoilerplate();

    ctx.font = '28px arial';
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("These areas will be used for dialogue throughout the simulation.", 100, 270);
    ctx.fillText("For best results, avoid drawing over them.", 200, 330);  
    ctx.font = '24px arial'; 
    ctx.fillText("Press 'Enter' or click 'Continue'", 300, 420);
}

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

function drawBoundaryCompletionHelpText() {
    // remove upper-left text area
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 300, 200);

    // redraw bottom-left text area
    ctx.lineWidth = 4;
    ctx.strokeWidth = 4;
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.strokeRect(736, 445, 272, 200);

    ctx.font = '24px arial';
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.fillText("Complete!", 805, 490);
    // still determining what to say at this point

    // ctx.fillText("For best results, draw", 770, 505);
    ctx.font = '20px arial';
    ctx.fillText("[ need text here ]", 770, 530);
    // ctx.fillText("non-overlapping line", 770, 555);
}

function eraseIllegalDrawingZones() {
    ctx.fillStyle = 'black';
    ctx.fillRect(732, 442, 272, 200);
    ctx.fillRect(0, 0, 252, 157);
}

// win/lose scenarios

function drawSuccessMessage(opacity) {

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

function redrawOrganisms() {
    ctx.fillStyle = 'black';
    ctx.clearRect(235, 231, 550, 235);

    // redraw organisms
    for (var i = 0; i < organisms.length; i++) {
        organisms[i].move();
    }
}

// untested
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

function updateSuccessfulOrganism(organism) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(organism.x, organism.y, organism.radius, 0, Math.PI*2, false);
    ctx.fill();
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

// example images not final. consider more zoomed-in images
function drawInitialSimSelectionScreen() {
    // let's get the dimensions of my screenshots (300x300 needed)
    let classic_example = document.getElementById("classic-example");
    let boundary_example = document.getElementById("boundary-example");

    // hide start button and clear canvas
    let start_btn = document.getElementsByClassName("start-btn")[0];
    start_btn.style.display = 'none';

    // ctx.fillStyle = 'black';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

export {
    testModule, findSammy,
    drawSimulationSettings, drawSimulationIntro,
    drawFakeGoal, drawSimulationExplanation,
    drawExplanationAndGoal, drawStats,
    drawEvaluationPhaseEntryText, drawEvaluationPhaseExitText,
    drawSelectionPhaseEntryText, drawClosestOrganismText,
    drawClosestOrganismHighlighted, drawClosestOrganismNatural,
    drawMothersText, drawFathersText,
    drawMothersHighlighted, drawMothersNatural,
    drawFathersHighlighted, drawFathersNatural,
    drawNotChosenText, drawAllSelectedOrganismsText,
    drawBothParentTypesNatural, drawOrganisms,
    drawSelectionPhaseExitText, drawCrossoverPhaseEntryText,
    drawCrossoverDescriptionText, drawCrossoverPhaseExitText,
    drawMutationPhaseEntryText, drawMutationDescriptionText,
    drawMutationPhaseExitText, drawCreateNewGenPhaseEntryText,
    drawGenerationSummaryText, drawCreateNewGenPhaseExitText,
    drawBoundaryBoilerplate, drawBoundaryCreationIntroductionOne,
    drawBoundaryCreationIntroductionTwo, drawBoundaryDrawingHelpText,
    drawBoundaryValidationHelpText, drawBoundaryCompletionHelpText,
    drawSuccessMessage, drawExtinctionMessage,
    redrawOrganisms,
    updateSuccessfulOrganism, highlightClassicSimType,
    highlightBoundarySimType, drawInitialSimSelectionScreen,
    prepareToRunSimulation, eraseIllegalDrawingZones,
    drawPhases,
}