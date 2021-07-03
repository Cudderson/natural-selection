document.addEventListener("DOMContentLoaded", setup);

const TOTAL_ORGANISMS = 10;
const GENE_COUNT = 10;
const FPS = 30;

// container holding organisms
organisms = [];

// testing global canvas declaration (comment out if code breaks)
var canvas = document.getElementById("main-canvas");
var ctx = canvas.getContext("2d");

class Organism {
    constructor (x, y, ctx) {
        this.x = x;
        this.y = y;
        this.ctx = ctx;
        this.radius = 5;
        this.index = 0;
    }

    // class method for creating random genes
    setRandomGenes () {

        this.genes = [];

        for (var i = 0; i < GENE_COUNT; i++) {
            // Create random vectors (genes)
            var x_pos = getRandomInt(-10, 10);
            var y_pos = getRandomInt(-10, 10);

            var random_vector = [x_pos, y_pos];

            this.genes.push(random_vector);
        }
    }

    // just for testing
    showGenes () {
        for (gene of this.genes) {
            console.log(gene);
        }
    }

    update () {
        if (this.index < GENE_COUNT) {
            this.x += this.genes[this.index][0];
            this.y += this.genes[this.index][1];
            this.index++;
            console.log(`X: ${this.x}, Y: ${this.y}`);
        }
    }

    move () {
        this.ctx.fillStyle = 'purple';
        this.ctx.beginPath();
        this.ctx.arc(this.x, this.y, this.radius, 0, Math.PI*2, false);
        this.ctx.fill();
    }

    calcDistanceToGoal (goal) {
        // can shorten after working
        var horizontal_distance = Math.abs(this.x - goal.x);
        var vertical_distance = Math.abs(this.y - goal.y);
        var horizontal_distance_squared = horizontal_distance ** 2;
        var vertical_distance_squared = vertical_distance ** 2;
        var distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        var distance_to_goal = Math.sqrt(distance_to_goal_squared);

        return distance_to_goal;
    }
}

class Goal {
    constructor(x, y, size, ctx) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.ctx = ctx;
    }

    drawGoal () {
        this.ctx.fillStyle = 'lightgreen';
        this.ctx.fillRect(this.x, this.y, this.size, this.size);
    }
}

function setup () {

    // get canvas element
    var canvas = document.getElementById("main-canvas");
    
    // get drawing object
    var ctx = canvas.getContext("2d");

    // Create organisms
    for (var i = 0; i < TOTAL_ORGANISMS; i++) {
        var organism = new Organism(300, 500, ctx);
        organism.setRandomGenes();
        organisms.push(organism);
    }

    console.log("SETUP COMPLETE");
    console.log("Amount of organisms created = " + organisms.length);

    // code block below works, it shows genes for all organisms

    // log genes for each organism (convert to class method?)
    // for (var i = 0; i < TOTAL_ORGANISMS; i++) {
    //     console.log(`GENES FOR ORGANISM ${i}: `);
    //     // 'of' keyword allows us to loop through *values* of an iterable object
    //     for (gene of organisms[i].genes) {
    //         console.log(gene);
    //     }
    // }

    testMoveOneOrganism();
}

function testMoveOneOrganism() {
    var canvas = document.getElementById("main-canvas");
    var ctx = canvas.getContext("2d");

    // Create goal
    var goal = new Goal(300, 20, 20, ctx); 

    requestAnimationFrame(function test () {

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // goal redrawn on each repaint
        goal.drawGoal();

        for (var i = 0; i < TOTAL_ORGANISMS; i++) {
            organisms[i].update();
            organisms[i].move();
        }
        
        if (organisms[0].index == GENE_COUNT) {
            console.log("Generation Complete");
            console.log("Now calling new goal function");
            getDistanceToGoal(goal);
            console.log("All complete.");
            return;
        }

        setTimeout(function() {
            requestAnimationFrame(test);
        }, 1000 / FPS);
    })
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min); // min and max inclusive
}

// the next step is the evaluation stage
// we want to determine an organisms distance to the goal
// distance_to_goal = sqrt(horizontal distance to center) + sqrt(vertical distance to horizonatal line @ target start)

// the first step is to define where the goal is
// goal_x = 300
// goal_y = 20

// I know that, but can I get an object's coordinates programatically?
// looks to not be possible, at least not easily
// we'll have to update the evaluation step if we ever move the goal

// we'll use the center position of the goal to start
function getDistanceToGoal(goal) {
    // console.log(`${organisms[0]} <<<`);
    // // let's just print out an organism's x and y position
    // console.log("Position of organism[0]:");
    // console.log(organisms[0].x, organisms[0].y);
    // organisms[0].ctx.fillStyle = 'gold';
    // organisms[0].ctx.beginPath();
    // organisms[0].ctx.arc(organisms[0].x, organisms[0].y, organisms[0].radius, 0, Math.PI*2, false);
    // organisms[0].ctx.fill();

    // console.log(canvas.width);


    // Let's calculate the distance to goal for organism[0]
    // a^2 + b^2 = c^2 
    // distance_to_goal = sqrt(distance_to_vertical_center_line) + sqrt(distance to horizontal line at goal position)
    // the distance to the vertical center line = abs(organism[0].x - goal.x)
    // the distance to the horizontal line at goal position = abs(organism[0].y - goal.y)
    

    // need to pass goal to this function
    // var a = Math.abs(organisms[0].x - goal.x);
    // var b = Math.abs(organisms[0].y - goal.y);
    // console.log("ABS DISTANCE TO GOAL (X, Y): ");
    // console.log(a, b);
    // a = a ** 2;
    // b = b ** 2;
    // console.log("SQUARED: ")
    // console.log(a, b);
    // console.log("SUM OF SQUARES AKA C^2: ");
    // var c = a + b;
    // console.log(c);

    // console.log("DISTANCE TO GOAL == SQUARE ROOT OF C^2 == SQUARE ROOT OF A^2 + B^2: ");
    // console.log(Math.sqrt(c));

    // the best way to see if this works is to calculate each organisms distance to goal using my current method, and
    // then highlight in gold the organism with the shortest distance to goal.

    // this function is called at the end of each generation
    // loop through organisms and calculate their distance to goal
    // make class method after working

    // for (var i = 0; i < TOTAL_ORGANISMS; i++) {
    //     organisms[i].calcDistanceToGoal(goal);
    // }

    for (organism of organisms) {
        d = organism.calcDistanceToGoal(goal);
        console.log(`D: ${d}`);
    }
}