function drawBoundaryBoilerplate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // draw start/end points of boundary
    ctx.fillStyle = '#333';

    // top
    ctx.fillRect(820, 0, 20, 50);
    ctx.fillRect(950, 160, 50, 20);
    // bottom
    ctx.fillRect(0, 420, 50, 20);
    ctx.fillRect(160, 550, 20, 50);

    // draw tips of endpoints/connectors
    // top tips
    ctx.beginPath();
    ctx.arc(830, 50, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(50, 430, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();

    // bottom tips
    ctx.beginPath();
    ctx.arc(170, 550, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();
    ctx.beginPath();
    ctx.arc(950, 170, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();

    // placeholder goal
    ctx.fillStyle = `rgb(155, 245, 0)`;
    ctx.fillRect(925, 50, 20, 20);

    // draw instructions zones (no-draw zones)
    ctx.lineWidth = 4;
    ctx.strokeWidth = 4;
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.strokeRect(736, 445, 272, 200);
    ctx.strokeRect(-4, -4, 252, 157);
}

function drawBottomBoundaryEndpointsRed() {
    ctx.fillStyle = 'rgb(200, 0, 0)';

    ctx.beginPath();
    ctx.arc(170, 550, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(950, 170, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();
}

function drawTopBoundaryEndpointsRed() {
    ctx.fillStyle = 'rgb(200, 0, 0)';

    ctx.beginPath();
    ctx.arc(830, 50, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(50, 430, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();
}

function drawBottomBoundaryGatesAndConnectorsGreen() {
    ctx.fillStyle = 'rgb(155, 245, 0)';

    // gates
    ctx.fillRect(160, 550, 20, 50);
    ctx.fillRect(950, 160, 50, 20);

    // connectors
    ctx.beginPath();
    ctx.arc(170, 550, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(950, 170, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();
}

function drawTopBoundaryGatesAndConnectorsGreen() {
    ctx.fillStyle = 'rgb(155, 245, 0)';

    // gates
    ctx.fillRect(820, 0, 20, 50);
    ctx.fillRect(0, 420, 50, 20);

    // connectors
    ctx.beginPath();
    ctx.arc(830, 50, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();

    ctx.beginPath();
    ctx.arc(50, 430, 10, 0, Math.PI*2, false);
    ctx.fill();
    ctx.closePath();
}

function drawBoundaryCreationIntroductionOne() {
    drawBoundaryBoilerplate();

    // erase boxes
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, 300, 200);
    ctx.fillRect(720, 420, 300, 200);

    ctx.font = '50px Cairo';
    ctx.fillStyle = "rgb(155, 245, 0)";
    ctx.fillText("Create Your Boundary", 270, 180);

    ctx.font = '26px Roboto';
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("Using your mouse or touchpad, you will draw walls to create your", 130, 290);
    ctx.fillText("own path to the goal for your species of organisms to travel", 158, 325);

    ctx.font = '20px Roboto';
    ctx.fillStyle = 'rgb(232, 0, 118, 1)';
    ctx.fillText("(Be cautious, organisms that touch your boundary may not survive!)", 210, 370);

    ctx.font = '26px Cairo';
    ctx.fillStyle = "rgb(155, 245, 0)";
    ctx.fillText("Press 'Enter' or click 'Continue'", 335, 460);

    // show user where organisms spawn
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.font = "18px Cairo";
    ctx.fillText("Spawn", 54, 537);
} 

function drawBoundaryCreationIntroductionTwo() {
    drawBoundaryBoilerplate();

    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.font = "18px Cairo";
    ctx.fillText("Spawn", 54, 537);

    ctx.font = '28px Cairo';
    ctx.fillStyle = 'rgb(148, 0, 211)';
    ctx.fillText("These areas will be used for dialogue throughout the simulation.", 115, 290);
    ctx.fillText("For best results, avoid drawing over them.", 250, 350);  

    ctx.font = '26px Cairo';
    ctx.fillStyle = "rgb(155, 245, 0)";
    ctx.fillText("Press 'Enter' or click 'Continue'", 335, 460);
}

function drawBoundaryDrawingHelpText(step) {
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font = "24px Cairo";
    ctx.fillText(step, 80, 40);

    ctx.font = '18px Cairo';
    ctx.fillText("Draw a line connecting", 25, 75)
    ctx.fillText("the red endpoints from", 25, 95);
    ctx.fillText("bottom to top", 25, 115);

    ctx.font = '20px Cairo';
    ctx.fillText("For best results, draw", 770, 505);
    ctx.fillText("a slow, continuous,", 770, 530);
    ctx.fillText("non-overlapping line", 770, 555);
}

function drawBoundaryValidationHelpText() {
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.font= "24px Cairo";
    ctx.fillText("Validation", 70, 40);

    ctx.font = '18px Cairo';
    ctx.fillText("To verify that the goal", 25, 70)
    ctx.fillText("is reachable, draw a line", 25, 90);
    ctx.fillText("connecting the white dot", 25, 110);
    ctx.fillText("to the goal", 25, 130);

    // no bottom black square on this one
    ctx.fillStyle = 'black';
    ctx.fillRect(730, 440, 280, 220);
}

function drawBoundaryValidationScreen(boundary) {
    drawBoundaryBoilerplate();
    ctx.drawImage(boundary, 0, 0, canvas.width, canvas.height);
    drawBoundaryValidationHelpText();
}

function drawBoundaryCompletionHelpText() {
    ctx.clearRect(0, 0, 251, 156);

    // redraw bottom-left text area
    ctx.lineWidth = 4;
    ctx.strokeWidth = 4;
    ctx.strokeStyle = 'rgb(148, 0, 211)';
    ctx.strokeRect(736, 445, 272, 200);

    ctx.font = '24px Cairo';
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.fillText("Complete!", 805, 490);

    ctx.font = '18px Roboto';
    ctx.fillText("Press 'Confirm' to save", 770, 530);
    ctx.fillText("boundary and proceed", 770, 550);
    ctx.fillText("to simulation settings", 770, 570);
}

function drawBoundary(opacity) {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    ctx2.globalAlpha = opacity;
    ctx2.drawImage(simSettings.custom_boundary.full_boundary, 0, 0, canvas2.width, canvas2.height);
}

function drawFinalBoundary(final_boundary) {
    drawBoundaryBoilerplate();

    ctx.drawImage(final_boundary, 0, 0, canvas.width, canvas.height);

    eraseIllegalDrawingZones();

    // remove white dot and revert goal color
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.fillRect(925, 50, 20, 20);

    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(80, 510, 12, 0, Math.PI*2, false);
    ctx.fill();

    // draw hidden boundary to prevent organisms escaping canvas
    drawHiddenBoundary();
}

function eraseIllegalDrawingZones() {
    ctx.fillStyle = 'black';
    ctx.fillRect(732, 442, 272, 200);
    ctx.fillRect(0, 0, 252, 157);
}

function drawHiddenBoundary() {
    // hidden box to contain organisms going-off canvas
    ctx.fillStyle = 'rgb(155, 245, 0)';
    ctx.fillRect(-12, 420, 20, 200);
    ctx.fillRect(-20, 592, 200, 20);
}

function drawCheckpoints() {
    for (let i = 0; i < simSettings.custom_boundary.checkpoints.length; i++) {
        ctx.beginPath();
        ctx.arc(
            simSettings.custom_boundary.checkpoints[i].coordinates[0],
            simSettings.custom_boundary.checkpoints[i].coordinates[1],
            simSettings.custom_boundary.checkpoints[i].size, 0, Math.PI*2, false
        );
        ctx.stroke();
        ctx.closePath();
    }
}

export {
    drawBoundaryBoilerplate, drawBottomBoundaryEndpointsRed,
    drawTopBoundaryEndpointsRed, drawBottomBoundaryGatesAndConnectorsGreen,
    drawTopBoundaryGatesAndConnectorsGreen, drawBoundaryCreationIntroductionOne,
    drawBoundaryCreationIntroductionTwo, drawBoundaryDrawingHelpText,
    drawBoundaryValidationHelpText, drawBoundaryValidationScreen,
    drawBoundaryCompletionHelpText, drawBoundary,
    drawFinalBoundary, drawCheckpoints
}