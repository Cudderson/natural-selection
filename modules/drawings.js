// tests
function testModule(message) {
    console.log(message);
}

function findSammy() {
    console.log(simGlobals.sammy);
}

// ===== drawings for simulator.js =====
function drawSimulationSettings(opacity) {

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
    ctx.fillStyle = 'black';
    ctx.clearRect(0, 75, canvas.width, 500);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '28px arial';
    ctx.fillText(`${simGlobals.TOTAL_ORGANISMS} organisms were created with completely random genes.`, 125, 290);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '22px arial';
    ctx.fillText("This society of organisms needs to reach the goal if it wants to survive.", 150, 330);
}

function drawFakeGoal(opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(500, 50, 20, 20);
    
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillRect(500, 50, 20, 20);
}

function drawSimulationExplanation(opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 100, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '22px arial';
    ctx.fillText("Using a genetic algorithm based on natural selection, these organisms will undergo", 125, 290);
    ctx.fillText("generations of reproduction, evaluation, selection, gene crossover and mutation,", 125, 320);
    ctx.fillText("until they succeed or fail to survive.", 350, 350);
}

function drawExplanationAndGoal(opacity) {
    ctx.fillStyle = 'black';
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
    ctx.fillStyle = 'black';
    ctx.fillRect(738, 510, 250, 90);

    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.font = "22px arial";
    ctx.fillText('Generation:', 740, 535);
    ctx.fillText(simGlobals.generation_count.toString(), 940, 535);
    ctx.fillText('Population Size:', 740, 560);
    ctx.fillText(simGlobals.TOTAL_ORGANISMS.toString(), 940, 560);
    ctx.fillText('Average Fitness:', 740, 585);
    ctx.fillText(simGlobals.average_fitness.toString(), 940, 585);
}

function drawEvaluationPhaseEntryText(opacity, old_opacity) {
    // would be better to only clear evaluate-phase area
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
}

function drawEvaluationPhaseExitText(opacity, old_opacity) {
    // each frame, draw the same text with less gold and then more gray
    ctx.fillStyle = 'black';
    ctx.fillRect(10, 40, 180, 20);

    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx.fillText("Evaluate Individuals", 10, 60);

    ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx.fillText("Evaluate Individuals", 10, 60);

    // I don't think I need this?
    // if (opacity >= 0.99) {
    //     ctx.fillStyle = 'black';
    //     ctx.fillRect(10, 10, 275, 200);
    //     drawPhases();
    // }
}

function drawSelectionPhaseEntryText(opacity, old_opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(10, 70, 250, 20);

    ctx.font = "20px arial";

    ctx.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx.fillText("Select Most-Fit Individuals", 10, 90);

    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText("Select Most-Fit Individuals", 10, 90);
}

function drawClosestOrganismText(opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(750, 450, 275, 20);

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
    ctx.fillStyle = 'black';
    ctx.fillRect(750, 480, 275, 20);
    
    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
    ctx.fillText("Females Selected", 800, 500);
}

function drawFathersText(opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(750, 510, 275, 20);

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
    ctx.fillStyle = 'black';
    ctx.fillRect(750, 540, 275, 20);
    ctx.font = "20px arial";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText("Not Selected", 800, 560);
}

function drawAllSelectedOrganismsText(opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(750, 480, 275, 100);

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

function drawSelectionPhaseExitText(opacity, old_opacity) {
    ctx.fillStyle = 'black';
    ctx.fillRect(10, 70, 240, 20);

    ctx.font = "20px arial";

    ctx.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx.fillText("Select Most-Fit Individuals", 10, 90);

    ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx.fillText("Select Most-Fit Individuals", 10, 90);

    // is this necessary? save just in case
    // if (opacity >= 1.00) {
    //     ctx.fillStyle = 'black';
    //     ctx.fillRect(10, 10, 275, 200);
    //     drawPhases();
    // }
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
    drawSelectionPhaseExitText,
}