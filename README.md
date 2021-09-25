---

<div align='center'>
  <br>
  <img src="images/natural_selection_sim_logo.png">
  <br>
  <br>
  <h3>A customizable implementation of a genetic algorithm based on natural selection</h3>
  <br>
  <br>
  <img src='https://img.shields.io/badge/simulator-online-brightgreen'>
</div>

---

<br>
<br>

<a name='table'></a>

## [Table of Contents](#table)

### [1. Usage](#usage) 
  
  - #### [Installation Instructions](#install)
  - #### [HTTP/Web Server](#server)

### [2. About](#about)
  
  - #### [Project Overview](#overview)
  - #### [Natural Selection and Genetic Algorithms](#ga)

### [3. Algorithm Implementation](#algo)

  - #### [Creation of New Generation](#newgen)
  - #### [Evaluation](#eval)
    - ##### [Fitness Function](#fit)
  - #### [Selection](#select)
  - #### [Crossover](#cross)
  - #### [Mutation](#mutate)

### [4. Simulation](#simulation)

  - ### [Simulation Types](#types)
    - #### [Classic](#class)
    - #### [Boundary](#bound)
      - ##### [Boundary Fitness Function](#bfit)
      - ##### [Boundary Creation](#create)
      - ##### [Algorithm for Creating Boundary Checkpoints](#balgo)
        - ##### [Connect Boundary Coordinates](#coords)
        - ##### [Determine Size of Checkpoints](#size)
        - ##### [Calculate Checkpoint Data](#data)
        - ##### [Examples of Algorithmically-Created Checkpoints](#examp) 

  - ### [Simulation Settings](#setting)

  - ### [Simulation Demo](#demo)
    - #### [Demo: Classic Simulation](#democ)
    - #### [Demo: Boundary Simulation](#demob)

### [5. Final Thoughts](#final-thoughts)

  - #### [Comments](#comment)
  - #### [Inspiration](#inspire)

### [6. Author](#author)

  - #### [Contact](#contac)

<br>

---

<br>

<a name='usage'></a>

## 1. Usage

<a name='install'></a>

### Installation Instructions
 
- Open a terminal and navigate to the directory where you'll store this repository.
- Run:

      git clone https://github.com/Cudderson/natural-selection.git
      
<br>

<a name='server'></a>

### HTTP/Web Server

#### Running this project locally requires a local HTTP/Web server. 

#### Any server should work, but here are a few tested options for Node and Python users:
  - #### Node:
      - #### The [http-server](https://www.npmjs.com/package/http-server) package makes it very easy to run a quick local server
      
      - The link provided details multiple installation options, but I'll provide a global installation:
      
          - (in terminal) ```npm install --global http-server```
          
          - *This will install http-server globally so that it may be run from the command line anywhere*
          
      - Once installed, navigate to the directory where you cloned this repository and run:
      
          - ```http-server```
         
      - You should see:
      
          - ```Starting up http-server, serving ./```
          
      - followed by two local URLs (*http://127.0.0.1:8080, for example*)
      
      - Enter either URL into your web browser to launch the project

<br>

  - #### Python:
      - ##### Python 3 comes with a simple HTTP server included in the standard library.
      - ##### To use:
        - Navigate to the root of the directory where you cloned this repository
        
        - Run either (depending on your python version):
        
          - ```python -m http.server 8000```
          - ```python3 -m http.server 8000```
        
        - Server is now running on port 8000 
        - Enter ```http://localhost:8000/``` into a web browser to launch the project (*You can choose a port other than 8000 if required*)

<br>

---

<br>

<a name='about'></a>

# 2. About

<a name='overview'></a>

## Project Overview

- ### Natural Selection Simulator is a customizable implementation of a genetic algorithm based on natural selection. Users can configure their own species of organisms and watch them attempt to reach a target goal over generations of adaptation/evolution.

<br>

- ### Features:
  - A customizable genetic algorithm for unique simulations
  - A sibling animation that runs alongside the genetic algorithm for an entertaining user-experience
  - Two simulation types, one including a user-drawn path to the target goal!

<br>

- ### Built With:
  - Javascript
  - HTML Canvas
  - HTML/CSS

<br>

#

<a name='ga'></a>

## Natural Selection and Genetic Algorithms

<br>

> ### *"Natural Selection is the process whereby organisms better adapted to their environment tend to survive and produce more offspring. The theory of its action was first fully expounded by Charles Darwin and is now believed to be the main process that brings about evolution."*
>
> ### - [Oxford Languages](https://languages.oup.com/google-dictionary-en/)

<br>

### In the context of computer science, genetic algorithms (GAs) are optimization algorithms based on the process of natural selection. 
  - #### *In this project's implementation, our algorithm will attempt to optimize a species of organisms' ability to reach a target goal*

<br>

#

### Genetic Algorithms typically have five phases:

- #### Creation of a New Generation
- #### Evaluation / Fitness Function
- #### Selection (don't forget roulette wheel!)
- #### Crossover
- #### Mutation

<br>

### These five phases are repeated until the algorithm no longer produces offspring that are significantly different from the previous generation. This is called [convergence](https://www.biologyonline.com/dictionary/convergence).

<br>

---

<br>

<a name='algo'></a>

# 3. Algorithm Implementation
 
- ### In [Simulation Settings](#setting), users are able to input their own settings and customize the algorithm. In this section, however, we'll use hard-coded settings for easier understanding.
- ### ! *code snippets in this section are simplified to their essentials for readability*

#
<br>

## Goal: 
- ### Create a genetic algorithm that optimizes an organism's ability to reach a target goal.

#

<a name='newgen'></a>

### Create New Generation
  - #### The first step is to supply our algorithm with an initial population of organisms:
  - ```javascript
    class Organism {
        constructor (gender) {
            this.gender = gender;
            this.genes = [];
            ...
        }

        setRandomGenes() {
            for (let i = 0; i < 300; i++) {
                // returns random coordinate pair from [-5, -5] to [5, 5]
                let random_gene = getRandomGene(-5, 5);
                
                this.genes.push(random_gene);
            }
        }
    }
    
    function createOrganisms () {
        let gender;
        let initial_population = [];
        
        // create an equal number of males and females
        for (let i = 0; i < 100; i++) {
            if (i % 2) {
                gender = 'male';
            }
            else {
                gender = 'female';
            }

            let organism = new Organism(gender);

            organism.setRandomGenes();
            initial_population.push(organism);
        }

        return initial_population;
    }
    
    let initial_population = createOrganisms();
    ```
  - #### We create an initial population of 100 male and female organisms with 300 random 'genes'.
  - #### For this project, a 'gene' is a coordinate pair that represents the next movement an organism will make on a 2D plane.
  - #### For example, the gene `[3, -1]` would represent an organism moving 3 units on the x-axis and -1 unit on the y-axis.
  - #### Note: All organisms share the same starting location/spawn-point.

#

<br>

<a name='eval'></a>

### Evaluation / Fitness Function
  - #### With the genes set for our organisms, we can begin the evaluation phase. The purpose of this phase is to obtain data about the organisms in the population to help us select the organisms that should reproduce the next-generation of offspring organisms.
  
  -   ```javascript
      class Organism {
          constructor (gender) {
              this.gender = gender;
              this.genes = [];
              this.x = 0;
              this.y = 0;
              this.index = 0;
              ...
          }
      
          update() {
              if (this.index < 300) {
                  this.x += this.genes[this.index][0];
                  this.y += this.genes[this.index][1];
                  this.index++;
              }
          }
      }

      function updateAndMoveOrganisms(organisms) {
          for (let i = 0; i < 300; i++) {
              for (let j = 0; j < organisms.length; j++) {
                  organisms[j].update();
                  organisms[j].move();
              }
          }
      }
      
      updateAndMoveOrganisms(organisms);
      ```
      
  - #### To begin evaluating our population, we apply each organism's genes to their current position (`this.x`, `this.y`) until all genes have been accounted for.
   
  - #### The move() method draws an organism on the 2D plane using its `x` and `y` attributes as coordinates. We'll see the visual animation for a simulation in the [Simulation Demo](#demo) section.
 
#

<br>

<a name='fit'></a>

### Fitness Function
  - #### The goal of a fitness function is to determine how 'fit' an organism is, and assign her/him/it a fitness score. In this algorithm, an organism's fitness reflects its ability to reach a target goal. The closer an organism is to reaching the goal, the higher its fitness score.
  
  - #### The fitness score of an organism determines its probability to be selected for reproduction.

  - ```javascript
    class Organism {
        constructor (gender, x, y) {
            this.gender = gender;
            this.genes = [];
            this.x = x;
            this.y = y;
            this.index = 0;
            this.distance_to_goal;
            this.fitness;
            ...
        }
    
        calcDistanceToGoal() {
            // c^2 = a^2 + b^2
            let horizontal_distance_squared = (this.x - GOAL_X_POS) ** 2;
            let vertical_distance_squared = (this.y - GOAL_Y_POS) ** 2;

            let distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
            let distance_to_goal = Math.sqrt(distance_to_goal_squared);

            this.distance_to_goal = distance_to_goal;
        }

        calcFitness() {
            let height = SPAWN_Y_POS - GOAL_Y_POS;

            let normalized_distance_to_goal = this.distance_to_goal / height;
            this.fitness = 1 - normalized_distance_to_goal;
        }
    }
    
    function calcPopulationFitness (organisms) {
        let total_fitness = 0.00;

        for (let i = 0; i < organisms.length; i++) {
            organisms[i].calcDistanceToGoal();
            organisms[i].calcFitness();
            total_fitness += organisms[i].fitness;
        }

        let average_fitness = total_fitness / organisms.length;
        return average_fitness;
    }
    
    let average_fitness = calcPopulationFitness(organisms);
    ```

  - #### To calculate an organism's fitness, we first need to calculate its distance to the goal. Since we're on a 2D plane, all we'll need is the [Pythagorean theorem](https://en.wikipedia.org/wiki/Pythagorean_theorem)  *(a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>)*
  
  - #### Once an organism's distance to the goal is determined, we can assign it a fitness score. These scores are normalized by dividing an organism's distance to the goal by the total distance from spawn to goal (`height`), and subtracting the quotient from 1.
  
  - #### We also calculate and store `average_fitness`, which is the average fitness score of the entire population. This will be useful in the selection phase of the algorithm.
  
  - *Note: This is the fitness function used in [*Classic*](#class) simulations. Later, we'll see that [*Boundary*](#bound) simulations use a different fitness function.*

#

<a name='select'></a>

<br>

### Selection
  - #### In the selection phase, we'll use the fitness scores of our population to select 'parent' organisms to reproduce the next-generation of organisms. 
  
  - #### The premise here is that organisms with a high fitness score must have better genes than low fitness score organisms. Therefore, selecting the highest-fitness organisms to reproduce should yield a more-fit next-generation, compared to the current.

- ```javascript
  function beginSelectionProcess(organisms, average_fitness) {
  
      let selection_factor;

      if (average_fitness < .1) {
          selection_factor = 100;
      }
      else {
          selection_factor = 10;
      }

      let potential_mothers = [];
      let potential_fathers = [];

      for (let i = 0; i < organisms.length; i++) {
      
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
  
  let potential_parents = beginSelectionProcess(organisms, average_fitness);
  ```  

- #### We begin creating parent couples by first populating arrays `potential_mothers` and `potential_fathers` with female and male organisms from the population. The amount of times that an organism is added to an array is determined by their fitness score.

- #### In my algorithm, organisms with an above-average fitness score are added to the array an exponential number of times based on their fitness.

- #### Alternatively, organisms with a fitness score less than `average_fitness` will be added to `potential_mothers/fathers` just once. This way, we give low-fitness organisms a small-chance of reproducing as a way of introducing diversity.

- *Note: `selection_factor` is an optimization I implemented to keep array sizes smaller as `average_fitness` increases, as well as strengthen selection-bias in early generations. However, it is not necessary for the overall-functioning of the algorithm.*

#

- #### Next, we'll create parent couples by randomly pairing male and female organisms from `potential_parents`.

- ```javascript
  function selectParentsForReproduction(potential_parents, population_size) {
  
      let potential_mothers = potential_parents['potential_mothers'];
      let potential_fathers = potential_parents['potential_fathers'];

      let parents = [];

      for (let i = 0; i < (population_size / 2); i++) {
          let mother_index = Math.floor(Math.random() * potential_mothers.length);
          let father_index = Math.floor(Math.random() * potential_fathers.length);

          let mother = potential_mothers[mother_index];
          let father = potential_fathers[father_index];

          let new_parents = [mother, father];

          parents.push(new_parents);
      }
      return parents;
  }
  
  let parents = selectParentsForReproduction(potential_parents, organisms.length);
  ```

- #### For this algorithm, I chose to create a number parent couples equal to half the population size. We'll see why in the crossover phase.

- #### This implementation allows for an organism to be selected for more than one parent couple, i.e., an organism can reproduce with multiple others. (Theoretically, one single female could be selected for every single parent couple, and be the mother to each offspring organism in the next-generation.) 

- *Technical: This particular method of selection would be considered [fitness proportionate selection](https://en.wikipedia.org/wiki/Fitness_proportionate_selection), or 'roulette wheel selection', where all organisms are given a chance of being selected proportionate to their fitness score. It's not guaranteed that the highest-fitness organisms will be selected, nor that the lowest-fitness organisms won't be.*

#

<br>

<a name='cross'></a>

### Crossover

  - #### With our parent-organisms selected, we can begin the crossover phase.
  
  - #### Genes of the selected parent-couples will be combined to create new offspring organisms!
  
  - ```javascript
    function crossover(parents_to_crossover) {

        let mother = parents_to_crossover[0];
        let father = parents_to_crossover[1];

        let crossover_genes = [];

        for (let j = 0; j < 300; j++) {
        
            // returns value between 0-1
            let random_val = Math.random();

            if (random_val < 0.5) {
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
    
    
    let offspring_organisms = [];

    for (let i = 0; i < parents.length; i++) {
        for (let j = 0; j < 2; j++) {
            let crossover_genes = crossover(parents[i]);
            
            let offspring = new Organism();
            offspring.genes = crossover_genes;
            
            offspring_organisms.push(offspring);
        }
    }
    ```
    
   - #### We call `crossover()` twice for each of our selected parent couples to simulate each couple creating the `crossover_genes` for 2 offspring organisms. *(In the selection phase, we created one parent couple for every two organisms in the population.)*
   
   - #### We create the `crossover_genes` for a new organism by randomly choosing either the mother or father gene at each index, until we have a full set of genes *(300 in this example)*. The genes are assigned to new `Organism`s and stored in `offspring_organisms`. 
   
   - *Note: This crossover implementation will keep the population size constant from generation to generation. In [Simulation Settings](#setting), you can optionally choose that your population sizes 'fluctuate' each generation.*

#

<br>

<a name='mutate'></a>
    
### Mutation
  - #### Mutation refers to the alteration of an offspring organism's genes.
 
  - #### The purpose of the mutation operator in a GA is to maintain genetic diversity. A mutation in an organism's genes could produce a new solution that didn't yet exist in the population! 
  
  - #### Without mutation and the persistence of diversity, populations could prematurely converge, resulting in a suboptimal solution.
  
  - ```javascript
    function mutate(offspring_organisms) {
        const MUTATION_RATE = 0.03;

        for (let i = 0; i < offspring_organisms.length; i++) {
            for (let j = 0; j < 300; j++) {
            
                // returns float between 0-1
                let random_val = Math.random();

                // apply mutation for variance
                if (random_bool < MUTATION_RATE) {
                    let mutated_gene = getRandomGene(-5, 5);
                    offspring_organisms[i].genes[j] = mutated_gene; 
                }
            }
        }
    }
    
    offspring_organisms = mutate(offspring_organisms);
    ```
  
  - #### We can simulate gene mutation by comparing random numbers to our desired mutation rate. In this example, we mutate a gene if the random value is less than 0.03. This will mutate approximately 3% of all genes in the offspring population.
    - #### the gene mutation rate of organisms is configurable in [Simulation Settings](#setting) for your own simulations
  
  - *Note: In the project files, the mutation phase is woven into crossover() for efficiency, but is separated in this example for readability and understanding.* 

- #### At this point, we have a new population of offspring organisms whose genes are derived from the most-fit male and female organisms from the previous generation. These organisms can now enter the Evaluation phase and continue the evolution of the species.

#

<br>

### This is the end of the first generation. In future generations, the same process of evaluating and assigning fitness scores to organisms, selecting parents to reproduce, and crossing-over and mutating parent genes for the next-generation will resume. These steps will be repeated until either an organism from the population reaches the goal, or the algorithm prematurely converges to a suboptimal solution *(simulation fails)*.

<br>

  - *Note: You can choose to continue running your simulations, even after your population succeed in reaching the goal, if you wish to see the algorithm optimize your population further*

<br>

---

<br>

<a name="simulation"></a>

# 4. Simulation
- ### With our genetic algorithm in-place, we can now run our own simulations.
- *Note: Simulations are made using Javascript to manipulate an HTML Canvas to create an animation that follows the algorithm.*

<br>

<a name='types'></a>

## Simulation Types

### This project offers two simulation types: Classic and Boundary

#

<br>

<a name='class'></a>

<div align="center">
  <h3>Simulation Type: Classic</h3>
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-header-1.png" width="500" height="300">
  <h5>(screenshot from a Classic simulation)</h5>
</div>

<br>

- ### In *Classic* simulations, users will configure their own species of organisms and watch them attempt to reach the goal over generations of natural selection.

#

<br>

<a name='bound'></a>

<div align="center">
  <h3>Simulation Type: Boundary</h3>
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-1.png" width="500" height="300">
  <h5>(screenshot from boundary creation for a Boundary Simulation)</h5>
</div>

<br>

- ### In *Boundary* simulations, users will create their own path and watch their species of organisms attempt to reach the goal over generations of natural selection. Organism's will need to avoid the boundary to survive!

#

<br>

<a name='bfit'></a>

### Boundary Simulation Fitness Function

  - #### In *Classic* simulations, we determine how *fit* an organism is by calculating its straight-line distance to the goal. The closer an organism is to the goal, the higher its fitness. However, this approach isn't sufficient for *Boundary* simulations, as most boundary paths are not straight-lines to the goal. Instead, it would be better to measure an organism's fitness based on its ability to progress through the boundary path, as the boundary path is the only way to reach the goal.

  - #### To measure an organism's fitness in *Boundary* simulations, we'll create checkpoints along the boundary path, and assign fitness scores to organisms based on the checkpoints that they're able to reach. The more checkpoints an organism reaches, the higher its fitness.

#

<br>

<a name='create'></a>

### Boundary Creation

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-1.png" width="500" height="300">
  <h5>example of a user-drawn boundary</h5>
</div>

<br>

  - #### Upon selecting *Boundary* as their simulation type, users will be prompted to create a boundary by drawing walls with their mouse/touchpad.

  - #### For the simulation to work properly, we need to create checkpoints along the boundary path. These checkpoints will represent progress-markers for our population and allow us to assign a proper fitness score to each organism.

#

<br>

<a name='balgo'></a>

### Algorithm for Creating Boundary Checkpoints

- #### We'll use the boundary in the image above for this example

#

<a name='coords'></a>

### 1. Connect Boundary Coordinates

<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-2.png" width="500" height="300">
</div>

<br>

  - #### As the user draws the top and bottom walls for their boundary, their mouse/cursor coordinates are stored. We can connect these coordinates with a line. These lines are the beginning of our checkpoints.
  
  - #### This is a bit overkill. Let's instead just create 10 connection lines. (It does look pretty cool, though)

<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-3.png" width="500" height="300">
</div>

<br>

  - #### This is better. We loop over the top/bottom boundary wall coordiantes and draw a line every *x* iterations until we have 10 lines.
    - #### *x = coordinates.length / 10*

  - #### We also compute, store, and connect the center points of each line drawn. These points will represent the epicenters of our checkpoints.

<br>

#

<a name='size'></a>

### 2. Determine Size of Checkpoints
  - #### With the locations of our boundary's checkpoints known, we can determine the size at which they should be drawn.
  
<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-4.png" width="500" height="300">
</div>

<br>

  - #### I won't show the process here, but the size of a checkpoint is determined using its distance to the checkpoints before and after it. Checkpoints are given a minimum size to ensure that they will be reachable by organisms in the population. 

#

<br>

<a name='data'></a>

### 3. Calculate Checkpoint Data

<br>

  - #### With our checkpoints created, we can calculate data that will help us with our fitness function and selecting the most-fit organisms to reproduce.
  
  - #### In the last step, we computed the distances from each checkpoint's epicenter to the next.
  
  - #### Using this information, we can call the 'distance to the goal' the sum of distances between adjacent checkpoint epicenters *(including the spawn point and goal location distances to their nearest-checkpoint)*
  
  - #### Further, these checkpoint-to-checkpoint distances allow us to calculate the distance to the goal for *any* checkpoint, by summing the necessary distances.
  
  - #### Putting it all together, we can call an organism's 'distance to the goal' the distance from the organism to its nearest-checkpoint + the distance from that checkpoint to the goal, which is the sum of the distances connecting each subsequent checkpoint and the goal.

  - #### With a proper 'distance to the goal' calculation, we can determine an organism's fitness score the same way we do for *Classic* simulations. (See [Algorithm Implementation](#algo))

<br>

#

<br>

<a name='examp'></a>

### Examples of Algorithmically-Created Checkpoints

  - #### Here are some examples of checkpoints created for other boundaries:

<br>
<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-example-1.png" width="500" height="300">
</div>

<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-example-2.png" width="500" height="300">
</div>

<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-example-3.png" width="500" height="300">
</div>

<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-example-4.png" width="500" height="300">
</div>

<br>
<br>

### This algorithm isn't perfect and doesn't always produce the best-checkpoints. However, it's consistent-enough to yield appropriate checkpoints for most user-drawn boundaries.

#

<br>
<br>

<a name='setting'></a>

# Simulation Settings
- ### Natural Selection Simulator allows users to adjust settings in the algorithm and configure their own simulation!

<br>

<div align="center">
  <h3>Settings</h3>
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-settings-boundary.png" width="500" height="300">
  <h5>(screenshot from Simulation Settings for Boundary simulations)</h5>
</div>

<br>
<br>

|  Setting      | Description |
| ----------- | ----------- |
| Initial Population Size | Amount of organisms to create for the first generation of the simulation |
| Movement Speed  | Relative-maximum distance an organism can travel in one movement |
| Mutation Rate | Target percentage of genes to be mutated in offspring organisms |
| Resilience | Percent chance an organism will survive if it touches the boundary *(Boundary simulation type only)* |
| Population Growth | 'Contant' vs 'Fluctuate' (toggle) |
| Dialogue | When checked, simulation will run will run with additional GA phase highlighting, descriptions, and animations (toggle) |

- #### (Population Growth) 'Constant': Parent organisms always reproduce offspring equal to the inital population size.
- #### (Population Growth) 'Fluctuate': Population sizes may vary from generation to generation. When fluctuate is toggled, parent couples may reproduce anywhere from zero to five offspring.

<br>
    
#

<br>

<a name='demo'></a>

# Simulation Demo
### In this section, we'll walkthrough demonstrations of *Classic* and *Boundary* simulations. For readability, I'll be just focusing on the progression of the population/algorithm, specifically, the evaluation phase.
### *(My apologies for the low GIF quality, simulations will run smoothly in practice)*

<br>

<a name='democ'><a/>
 
## Simulation Demo: Classic

#### We create a *Classic* simulation with the following settings:
  - ##### Initial Population: 100
  - ##### Movement Speed: 4
  - ##### Mutation Rate: 3.8%
  - ##### Population Growth: Constant
  - ##### Dialogue: Enabled

<br>
<br>  

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-gen0.gif" width="500" height="300">
  <h5>Generation 0</h5>
</div>
  
<br>
    
  - #### The first generation is essentially a [random walk](https://en.wikipedia.org/wiki/Random_walk), as an organism's genes are ompletely random. Any progress here is due completely to chance.
  
<br>

#
  
<br>  

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-mid-gen.gif" width="500" height="300">
  <h5>Generation 5</h5>
</div>
  
<br>  

  - #### Only 5 generations in, and the population has already made considerable progress!

#
  
<br>  

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-gen10.gif" width="500" height="300">
  <h5>Generation 10</h5>
</div>
  
<br>  

  - #### By generation 10, we can say that the algorithm is definitely functioning properly, as some organisms nearly reached the goal!

#
  
<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-gen-success.gif" width="500" height="300">
  <h5>Generation 14</h5>
</div>
  
<br>

  - #### Success! After only 14 generations, the genetic algorithm has optimized our species of organisms ability to reach the goal!

    - *Note: Though this simulation succeeded in just 14 generations, it's worth mentioning that all simulations will be different, as different settings and randomness will result in different outcomes. Some may succeed sooner, some longer, and some may prematurely converge and never reach the goal.*
  
<br>  
  
#

<br>  
  
<a name='demob'><a/>

## Simulation Demo: Boundary

### We create a *Boundary* simulation with the following settings:
  - ##### Initial Population: 500
  - ##### Movement Speed: 5
  - ##### Mutation Rate: 2.75%
  - ##### Resilience: 98%
  - ##### Population Growth: Constant4
  - ##### Dialogue: Disabled

  - #### In *Boundary* simulations, you can configure the *resilience* of your organisms, which represents the chance that they'll survive if they collide with the boundary. In this simulation, organism's will have a resilience of 98%. 
  
<br>

#
  
<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-boundary-gen0.gif" width="500" height="300">
  <h5>Generation 0</h5>
</div>
  
<br>  

  - #### The first generation is essentially a [random walk](https://en.wikipedia.org/wiki/Random_walk), as an organism's genes are completely random. Any progress here is due completely to chance. We can see many of the organisms turn gray and 'die' in the spawn location. 

#
  
<br>  

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-boundary-gen10.gif" width="500" height="300">
  <h5>Generation 10</h5>
</div>
  
<br>  

  - #### Though there are clearly many wasted movements, the population has correctly decided which direction they'll take to the goal.

#
  
<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-boundary-gen25.gif" width="500" height="300">
  <h5>Generation 25</h5>
</div>
  
<br>  

  - #### By optimizing their movements/genes, organisms are able to traverse further down the boundary path with the same amount of genes.

#
  
<br>  

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-boundary-gen50.gif" width="500" height="300">
  <h5>Generation 50</h5>
</div>
  
<br>  

  - #### At generation 50, the algorithm is looking promising. Organisms continue to optimize their genes as the average fitness of the population continues to rise.

#
  
<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-boundary-gen71.png" width="500" height="300">
  <h5>Generation 71</h5>
</div>
  
  - #### Success! The algorithm correctly optimized our population's ability to reach the goal after 71 generations.
  
<br>  

#
  
<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-boundary-gen-success.gif" width="500" height="300">
  <h5>Generation 73</h5>
</div>
  
<br>  

  - #### Allowing the simulation to continue will result in your population to be further optimized, and more organisms should begin to reach the goal.
  
      - *Note: Though it took this simulation 71 generations to succeed, it's worth mentioning that all simulations will be different, as different settings, boundaries and randomness will result in different outcomes. Some may succeed sooner, some longer, and some may prematurely converge and never reach the goal.*

<br>  
  
  - #### Look at this simulation (below), for example. The algorithm prematurely converged around the 0.45 - 0.50 average fitness level. This could be due to settings that did not benefit the evolution of the population (mutation rate too high, etc.), inefficiency in the genetic algorithm, an error in the boundary checkpoint-creation algorithm, or simply random chance:
  
<br>  

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-boundary-gen250.gif" width="500" height="300">
  <h5>Generation 250</h5>
</div>
  
<br>

  - #### Even after 250 generations of natural selection, organisms fail to evolve past an average fitness level of 0.50
  
<br>  

---
  
<br>

<a name='final-thoughts'></a>

# 5. Final Thoughts
  
  <a name='comment'></a>  
  
  - ## Comments
    - #### Looking at the bigger picture, this simple genetic algorithm is incredibly-abstract compared to real-life biology and the probably trillions of parameters that      influence natural selection in our world. However trivial it may seem, though, I still find it magical that we're able to esssentially *teach* some dots on a computer screen how to reach a target goal, starting with nothing but random genes.

<br>
  
<a name='inspire'><a>

- ## Inspiration
  - #### The idea and inspiration for this project initially originates from [this awesome blog post](https://dev.to/lukegarrigan/genetic-algorithms-in-javascript-mc3) from Luke Garrigan. In his post, he details the ideas of natural selection and creates a genetic algorithm that teaches cars to drive around a track! Check him out!
  - #### Additionally, [this](https://towardsdatascience.com/introduction-to-genetic-algorithms-including-example-code-e396e98d8bf3) introduction to genetic algorithms from https://towardsdatascience.com was a big help for getting started, thanks!
  
<br>

---
  
<br>

<a name='author'></a>

# 6. Author

- ### Cody / Myself
  
- ### Thanks for taking the time to check out the project! I had a ton of fun making it and learning about biology along the way.
  
- #### I'm a software developer from the US looking for a professional opportunity! If you'd like to contact me for hiring, questions, or anything related to this project, send me an email! (Link below)
  
<a name='contac'></a>  
  
## Contact
  - ### Email: codered1227@gmail.com
