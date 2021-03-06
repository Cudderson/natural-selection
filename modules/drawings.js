// === SIM TYPE SELECTION ===

function highlightClassicSimType() {
    // console.log("left arrow pressed");

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
    ctx.fillRect(70, 120, 875, 450);

    // redraw 'classic' border highlighted
    ctx.strokeStyle = 'rgb(155, 245, 0)';
    ctx.shadowColor = 'rgb(155, 245, 0)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(135, 150, 225, 225);

    // redraw 'classic' text highlighted
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font = '36px Cairo';
    ctx.fillText("Classic", 190, 430);

    // redraw 'boundary' border normal
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.shadowColor = 'rgb(148, 0, 211)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(635, 150, 225, 225);

    // redraw boundary text normal
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Boundary", 680, 430);

    // redraw classic description highlighted
    ctx.font = "20px Roboto";
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Configure your own species of organisms", 70, 480);
    ctx.fillText("and watch them attempt to reach the goal", 70, 505);
    ctx.fillText("over generations of natural selection", 85, 530);

    // redraw boundary description normal
    ctx.fillStyle = "#333";
    ctx.fillText("Create your own path and watch your species", 550, 480);
    ctx.fillText("of organisms attempt to reach the goal and", 550, 505);
    ctx.fillText("survive while avoiding your boundary", 590, 530);

    // redraw example images scaled to 300x300
    let classic_example = document.getElementById("classic-example");
    let boundary_example = document.getElementById("boundary-example");
    ctx.drawImage(classic_example, 135, 150, 225, 225);
    ctx.drawImage(boundary_example, 635, 150, 225, 225);  
}

function highlightBoundarySimType() {
    // console.log("right arrow pressed");

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
    ctx.fillRect(70, 120, 875, 450);

    // redraw 'boundary' border highlighted
    ctx.strokeStyle = 'rgb(155, 245, 0)';
    ctx.shadowColor = 'rgb(155, 245, 0)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(635, 150, 225, 225);

    // redraw 'boundary' text highlighted
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font = '36px Cairo';
    ctx.fillText("Boundary", 680, 430);

    // redraw 'classic' border normal
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.shadowColor = 'rgb(148, 0, 211)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(135, 150, 225, 225);

    // redraw 'classic' text normal
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Classic", 190, 430);

    // redraw example images scaled to 300x300
    let classic_example = document.getElementById("classic-example");
    let boundary_example = document.getElementById("boundary-example");
    ctx.drawImage(classic_example, 135, 150, 225, 225);
    ctx.drawImage(boundary_example, 635, 150, 225, 225); 

    // redraw boundary description highlighted
    ctx.font = "20px Roboto";
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Create your own path and watch your species", 550, 480);
    ctx.fillText("of organisms attempt to reach the goal and", 550, 505);
    ctx.fillText("survive while avoiding your boundary", 590, 530);

    // redraw classic description normal
    ctx.fillStyle = "#333";
    ctx.fillText("Configure your own species of organisms", 70, 480);
    ctx.fillText("and watch them attempt to reach the goal", 70, 505);
    ctx.fillText("over generations of natural selection", 85, 530);
}

function drawInitialSimSelectionScreen() {
    let classic_example = document.getElementById("classic-example");
    let boundary_example = document.getElementById("boundary-example");

    // hide start button and clear canvas
    let start_btn = document.getElementsByClassName("start-btn")[0];
    start_btn.style.display = 'none';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // show sim-type buttons 
    document.getElementsByClassName("sim-type-classic")[0].style.display = "block";
    document.getElementsByClassName("sim-type-boundary")[0].style.display = "block";

    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.font = '50px Cairo';
    ctx.fillText("Select Simulation Type", 255, 80);

    ctx.font = '20px Roboto';
    ctx.fillText("(use mouse or arrow keys + enter to select)", 305, 110);

    ctx.font = '36px Cairo';
    ctx.fillText("Classic", 190, 430);
    ctx.fillText("Boundary", 680, 430);

    // descriptions
    ctx.font = "20px Roboto";
    ctx.fillStyle = "#333";

    // Classic
    ctx.fillText("Configure your own species of organisms", 70, 480);
    ctx.fillText("and watch them attempt to reach the goal", 70, 505);
    ctx.fillText("over generations of natural selection", 85, 530);

    // Boundary
    ctx.fillText("Create your own path and watch your species", 550, 480);
    ctx.fillText("of organisms attempt to reach the goal and", 550, 505);
    ctx.fillText("survive while avoiding your boundary", 590, 530);

    // glow effect behind images
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.lineWidth = 4;
    ctx.shadowColor = 'rgb(148, 0, 211)';
    ctx.shadowBlur = 10;
    ctx.strokeRect(135, 150, 225, 225);
    ctx.strokeRect(635, 150, 225, 225);

    ctx.drawImage(classic_example, 135, 150, 225, 225);
    ctx.drawImage(boundary_example, 635, 150, 225, 225);
}

// === PRE SIM ===

function drawSimReadyScreen() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    document.getElementsByClassName("setting-submit")[0].style.display = 'none';

    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font = '55px Cairo';
    ctx.fillText("Simulation Ready", 300, 300);

    ctx.font = '28px Cairo'
    ctx.fillText("Press 'Run Simulation'", 365, 360);

    // thin line between text
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillRect(250, 320, 500, 3);
}

function drawSimulationSettings(opacity) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = "30px Cairo";
    ctx.fillText("Simulation Settings", 300, 195);
    ctx.fillRect(300, 197, 245, 1);

    ctx.font = "24px Cairo";
    ctx.fillText(`Initial Population:`, 300, 250);
    ctx.fillText(`Movement Speed:`, 300, 290);
    ctx.fillText(`Mutation Rate:`, 300, 330);
    ctx.fillText("Resilience", 300, 370);
    ctx.fillText(`Dialogue:`, 300, 410);
    
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(`${simSettings.TOTAL_ORGANISMS}`, 600, 250);
    ctx.fillText(`${simSettings.MAX_GENE}`, 600, 290);
    ctx.fillText(`${simSettings.MUTATION_RATE}`, 600, 330);
    ctx.fillText(`${simSettings.RESILIENCE}`, 600, 370);

    if (simSettings.dialogue === false) {
        ctx.fillText(`Disabled`, 600, 410);
    }
    else {
        ctx.fillText(`Enabled`, 600, 410);
    }
}

function drawSimulationIntro(opacity) {
    ctx.clearRect(0, 75, canvas.width, 500);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '28px Roboto';
    ctx.fillText(`${simSettings.TOTAL_ORGANISMS} organisms were created with completely random genes.`, 125, 290);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '22px Roboto';
    ctx.fillText("This species of organisms needs to reach the goal if it wants to survive.", 150, 330);
}

function drawFakeGoal(opacity) {
    if (simSettings.sim_type === 'classic') {
        ctx.clearRect(500, 50, 20, 20);
    
        ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
        ctx.fillRect(500, 50, 20, 20);
    }
    else {
        ctx.clearRect(925, 50, 20, 20);

        ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
        ctx.fillRect(925, 50, 20, 20);
    }
}

function drawSimulationExplanation(opacity) {
    ctx.clearRect(0, 100, canvas.width, canvas.height);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.font = '22px Roboto';
    ctx.fillText("Using a genetic algorithm based on natural selection, these organisms will undergo", 125, 290);
    ctx.fillText("generations of reproduction, evaluation, selection, gene crossover and mutation,", 125, 320);
    ctx.fillText("until they succeed or fail to survive.", 350, 350);
}

function drawExplanationAndGoal(opacity) {
    drawSimulationExplanation(opacity);
    drawFakeGoal(opacity);
}

// draws goal on canvas2 with full-opacity
function drawGoal() {
    if (simSettings.sim_type === 'classic') {
        ctx2.clearRect(500, 50, 20, 20);
    
        ctx2.fillStyle = `rgba(155, 245, 0, 1)`;
        ctx2.fillRect(500, 50, 20, 20);
    }
    else {
        ctx2.clearRect(925, 50, 20, 20);

        ctx2.fillStyle = `rgba(155, 245, 0, 1)`;
        ctx2.fillRect(925, 50, 20, 20);
    }
}

// === STATS ===

function drawStats(opacity, stats) {
    ctx2.clearRect(740, 510, 350, 120);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.font = "22px Cairo";
    ctx2.fillText('Generation:', 740, 535);
    ctx2.fillText(stats.generation_count.toString(), 930, 535);
    ctx2.fillText('Population Size:', 740, 560);
    ctx2.fillText(stats.organism_count.toString(), 930, 560);
    ctx2.fillText('Average Fitness:', 740, 585);
    ctx2.fillText(stats.average_fitness.toString(), 930, 585);
}

// for preserving drawing on canvas during animations
function drawStatsStatic(context, stats) {
    context.clearRect(740, 510, 350, 120);

    context.fillStyle = `rgba(155, 245, 0, 1)`;
    context.font = "22px Cairo";
    context.fillText('Generation:', 740, 535);
    context.fillText(stats.generation_count.toString(), 930, 535);
    context.fillText('Population Size:', 740, 560);
    context.fillText(stats.organism_count.toString(), 930, 560);
    context.fillText('Average Fitness:', 740, 585);
    context.fillText(stats.average_fitness.toString(), 930, 585);
}

// === PHASES ===

function drawPhases(opacity) {
    ctx2.clearRect(0, 0, 245, 150);

    ctx2.font = "20px Cairo";

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

function drawEvaluationPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 40, 180, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);
}

function drawEvaluationPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 40, 180, 20);

    ctx2.font = "20px Cairo";
    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Evaluate Individuals", 10, 60);
}

function drawStaticEvaluationPhaseText(context) {
    context.clearRect(0, 0, 245, 150);

    context.font = "20px Cairo";

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Create New Generation", 10, 30);

    context.fillStyle = `rgba(155, 245, 0, 1)`;
    context.fillText("Evaluate Individuals", 10, 60);

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Select Most-Fit Individuals", 10, 90);

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Crossover", 10, 120);

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Mutate", 10, 150);
}

function drawStaticSelectionPhaseText(context) {
    context.clearRect(0, 0, 245, 150);

    context.font = "20px Cairo";

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Create New Generation", 10, 30);

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Evaluate Individuals", 10, 60);

    context.fillStyle = `rgba(155, 245, 0, 1)`;
    context.fillText("Select Most-Fit Individuals", 10, 90);

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Crossover", 10, 120);

    context.fillStyle = `rgba(100, 100, 100, 1)`;
    context.fillText("Mutate", 10, 150);
}

function drawSelectionPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 70, 245, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);
}

function drawClosestOrganismText(opacity) {
    ctx.clearRect(750, 450, 275, 30);

    ctx.font = "20px Cairo";
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
    
    ctx.font = "20px Cairo";
    ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
    ctx.fillText("Females Selected", 800, 500);
}

function drawFathersText(opacity) {
    ctx.clearRect(750, 510, 275, 20);

    ctx.font = "20px Cairo";
    ctx.fillStyle = `rgba(0, 146, 255, ${opacity})`;
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
    for (let i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][0].x, paintbrush.subject[i][0].y, paintbrush.subject[i][0].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawFathersHighlighted(opacity) {
    for (let i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(0, 146, 255, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][1].x, paintbrush.subject[i][1].y, paintbrush.subject[i][1].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawFathersNatural(opacity) {
    for (let i = 0; i < paintbrush.subject.length; i++) {
        ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
        ctx.beginPath();
        ctx.arc(paintbrush.subject[i][1].x, paintbrush.subject[i][1].y, paintbrush.subject[i][1].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawNotChosenText(opacity) {
    ctx.clearRect(750, 540, 275, 20);

    ctx.font = "20px Cairo";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText("Not Selected", 800, 560);
}

function drawAllSelectedOrganismsText(opacity) {
    ctx.clearRect(750, 480, 275, 100);

    ctx.font = "20px Cairo";
    ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
    ctx.fillText("Females Selected", 800, 500);

    ctx.fillStyle = `rgba(0, 146, 255, ${opacity})`;
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

function drawOrganisms(opacity, organisms) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < organisms.length; i++) {
        ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
        ctx.beginPath();
        ctx.arc(organisms[i].x, organisms[i].y, organisms[i].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawDeceasedOrganisms(opacity, deceased_organisms) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < deceased_organisms.length; i++) {
        ctx.fillStyle = `rgba(128, 0, 128, ${opacity})`;
        ctx.beginPath();
        ctx.arc(deceased_organisms[i].x, deceased_organisms[i].y, deceased_organisms[i].radius, 0, Math.PI*2, false);
        ctx.fill();
    }
}

function drawSelectionPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 70, 245, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Select Most-Fit Individuals", 10, 90);
}

function drawCrossoverPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 100, 200, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Crossover", 10, 120);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Crossover", 10, 120);
}

function drawCrossoverDescriptionText(opacity) {
    ctx.clearRect(75, 275, 950, 150);

    let description = "Genes of the selected parent couples are combined to create new offspring.";

    ctx.font = "26px Cairo";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(description, 100, 325);
}

function drawCrossoverPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 100, 100, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Crossover", 10, 120);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Crossover", 10, 120); 
}

function drawMutationPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 130, 200, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Mutate", 10, 150);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Mutate", 10, 150);
}

function drawMutationDescriptionText(opacity) {
    ctx.clearRect(100, 275, 800, 150);

    var description = "To maintain genetic diversity, a small percentage of random genes are mutated";
    var mutation_rate_text = `Mutation Rate: ${(simSettings.MUTATION_RATE * 100).toFixed(2)}%`.toString();

    ctx.font = "24px Cairo";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(description, 100, 300);

    ctx.font = "24px Cairo";
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(mutation_rate_text, 410, 350);
}

function drawMutationPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 130, 100, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Mutate", 10, 150);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Mutate", 10, 150);
}

function drawCreateNewGenPhaseEntryText(opacity, old_opacity) {
    ctx2.clearRect(10, 10, 250, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(100, 100, 100, ${old_opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);

    ctx2.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);
} 

function drawGenerationSummaryText(opacity, gen_summary_stats) {
    let generation_summary_text = `Generation ${gen_summary_stats.generation_count} Summary:`;
    let generation_average_fitness_preface = 'Average Fitness:';
    let generation_offspring_reproduced_preface = 'Offspring Reproduced:';

    ctx.clearRect(100, 250, 800, 200);

    ctx.font = "22px Cairo";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(generation_summary_text, 380, 280);

    ctx.font = "20px Cairo";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(generation_average_fitness_preface, 380, 330);

    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(gen_summary_stats.average_fitness.toFixed(2).toString(), 600, 330);

    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText(generation_offspring_reproduced_preface, 380, 355);

    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(gen_summary_stats.offspring_organisms.length.toString(), 600, 355);
}

function drawCreateNewGenPhaseExitText(opacity, old_opacity) {
    ctx2.clearRect(10, 10, 215, 20);

    ctx2.font = "20px Cairo";

    ctx2.fillStyle = `rgba(155, 245, 0, ${old_opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);

    ctx2.fillStyle = `rgba(100, 100, 100, ${opacity})`;
    ctx2.fillText("Create New Generation", 10, 30);
}

// === WIN/LOSE ===

function drawSuccessMessage(opacity, generation_count) {
    ctx.clearRect(270, 240, 430, 300);

    // backdrop
    ctx.fillStyle = `rgba(10, 10, 10, .75)`;
    ctx.fillRect(270, 240, 430, 300);

    ctx.font = '44px Cairo';
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText("Simulation Success!", 315, 275);

    ctx.font = '30px Cairo';
    ctx.fillStyle = `rgba(155, 245, 0, ${opacity})`;
    ctx.fillText(`Generations: ${generation_count}`, 370, 340);

    ctx.font = '26px Cairo';
    ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
    ctx.fillText("Press 'Enter' to Resume Simulation", 300, 440);
    ctx.fillText("Press 'Q' to Quit", 410, 480);

    // line divider
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillRect(275, 295, 440, 3);
}

function drawExtinctionMessage(opacity) {
    ctx.clearRect(200, 180, 565, 300);

    // backdrop
    ctx.fillStyle = `rgba(10, 10, 10, .75)`;
    ctx.fillRect(160, 150, 660, 340);

    ctx.font = '50px Cairo';
    ctx.fillStyle = `rgba(232, 0, 118, ${opacity})`;
    ctx.fillText("Simulation Failed", 310, 230);

    // red divider lines
    ctx.fillRect(250, 250, 480, 3);
    ctx.fillRect(250, 385, 480, 3);

    ctx.font = "24px Cairo";
    ctx.fillText("Press 'Q' to exit the simulation.", 340, 440);

    ctx.font = "30px Cairo";
    ctx.fillStyle = `rgba(148, 0, 211, ${opacity})`;
    ctx.fillText("Your species of organisms has gone extinct.", 220, 325);
}

function updateSuccessfulOrganism(organism) {
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.arc(organism.x, organism.y, organism.radius, 0, Math.PI*2, false);
    ctx.fill();
}

export {
    drawSimulationSettings, drawSimulationIntro, drawFakeGoal,
    drawSimulationExplanation, drawExplanationAndGoal, drawStats,
    drawEvaluationPhaseEntryText, drawEvaluationPhaseExitText, drawSelectionPhaseEntryText,
    drawClosestOrganismText,drawClosestOrganismHighlighted, drawClosestOrganismNatural,
    drawMothersText, drawFathersText, drawMothersHighlighted,
    drawMothersNatural, drawFathersHighlighted, drawFathersNatural,
    drawNotChosenText, drawAllSelectedOrganismsText, drawBothParentTypesNatural,
    drawOrganisms, drawSelectionPhaseExitText, drawCrossoverPhaseEntryText,
    drawCrossoverDescriptionText, drawCrossoverPhaseExitText, drawMutationPhaseEntryText,
    drawMutationDescriptionText, drawMutationPhaseExitText, drawCreateNewGenPhaseEntryText,
    drawGenerationSummaryText, drawCreateNewGenPhaseExitText, drawSuccessMessage,
    drawExtinctionMessage, drawStaticEvaluationPhaseText, updateSuccessfulOrganism,
    highlightClassicSimType, highlightBoundarySimType, drawInitialSimSelectionScreen,
    drawSimReadyScreen, drawPhases, drawDeceasedOrganisms,
    drawStaticSelectionPhaseText, drawStatsStatic, drawGoal,
}