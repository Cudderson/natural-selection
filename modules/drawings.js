function testModule(message) {
    console.log(message);
}

var yoo = 777;

// doesn't work (can't access vars)
function drawSimulationSettings(opacity) {

    console.log('caaled drawSimulationSettings()');

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
}

export { testModule, yoo, drawSimulationSettings }