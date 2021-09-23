---

<div align='center'>
  <br>
  <img src="images/natural_selection_sim_logo.png">
  <br>
  <br>
  <img src='https://img.shields.io/badge/simulator-online-brightgreen'>
</div>
<!-- use this for settings description/keep just in case -->
<!-- | Syntax      | Description |
| ----------- | ----------- |
| Header      | Title       |
| Paragraph? More like a full-on essay!  | <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-header-1.png" width="500" height="300">  | -->

---
# *** Consider putting all readme screenshots/gifs in different repo to keep small size ***
# Table of Contents (finish/add markdown links at end)
## [1. About](#about)
- ### [Project Overview](#overview)
- ### [Natural Selection and Genetic Algorithms](#ga)
## [2. Usage](#usage)
## [3. Algorithm Implementation](#algo)
## [4. Simulation](#simulation)
## (HTML Canvas/Animation section?)
## [5. Final Thoughts](#final-thoughts)
## [6. Author](#author)

<br>
<br>

<a name='about'></a>

# 1. About

<a name='overview'></a>

## Project Overview (inspiration here?)

- ### Natural Selection Simulator is a customizable implementation of a genetic algorithm based on natural selection. Users will configure their own species of organisms and watch them ...

- ### Built With:
  - Javascript
  - HTML Canvas
  - HTML/CSS

<br>

<a name='ga'></a>

## Natural Selection and Genetic Algorithms

<br>

> ### *"Natural Selection is the process whereby organisms better adapted to their environment tend to survive and produce more offspring. The theory of its action was first fully expounded by Charles Darwin and is now believed to be the main process that brings about evolution."*
>
> ### - [Oxford Languages](https://languages.oup.com/google-dictionary-en/)

<br>

### In the context of computer science, genetic algorithms (GAs) are optimization algorithms based on the process of natural selection. (In this project's implementation, our algorithm will attempt to optimize a species of organisms' ability to reach a trivial target goal.) <<< Consider if this should wait until Algorithm section)

#

### Genetic Algorithms typically have five phases:

- #### Creation of a New Generation
- #### Evaluation / Fitness Function
- #### Selection (don't forget roulette wheel!)
- #### Crossover
- #### Mutation

#

### These five phases are repeated until the algorithm no longer produces offspring that are significantly different from the previous generation. This is called [convergence](https://www.biologyonline.com/dictionary/convergence).

### (maybe include definition of GA, as well as GA/SGA vs EA)

---
<!-- finish up to here -->

<a name='usage'></a>

# 2. Usage (Maybe this should be before anything? Kind of ruins the flow)

## [Installation Instructions (needs tag)]

## [web server explanation and instructions/recommendations]

<br>

---

<a name='algo'></a>

# 3. Algorithm Implementation

- ### ! *code snippets in this section are simplified to their essentials for readability*
- (maybe mention that these snippets are meant to highlight the phases of the algorithm and not to show how the program works as a whole. To see the final product, see Simulation(linktoSimulation))
- mention how the simulation settings allow you to configure your own simulation, but this example will focus on a certain set of settings

#
<br>

## Goal: 
- ### Create a genetic algorithm that optimizes an organism's ability to reach a target goal.

#

### Create A New Generation
  - #### The first step is to supply our algorithm with an initial population of organisms:
  - ```javascript
    function getRandomGene(min, max) {
        let random_x = Math.floor(Math.random() * (max - min + 1) + min);
        let random_y = Math.floor(Math.random() * (max - min + 1) + min);
        let random_gene = [random_x, random_y];
        
        return random_gene;
    }
    
    // class method of 'Organism'
    setRandomGenes() {
        for (let i = 0; i < 300; i++) {
            let random_gene = getRandomGene(-5, 5);
            this.genes.push(random_gene);
        }
    }
    
    function createOrganisms () {
        let gender;
        let initial_population = [];
        
        // create equal number of males and females
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
  - We create a population of 100 organisms with 300 random 'genes'.
  - For this project, a 'gene' is a coordinate pair that represents the next movement an organism will make on a 2D plane.
  - For example, the gene `[3, -1]` would represent an organism moving 3 units on the x-axis and -1 unit on the y-axis.
  - Note: All organisms will share the same starting location/spawn-point.

#

### Evaluation / Fitness Function
  - #### To evaluate our population, we apply each organism's genes to their current position (`this.x`, `this.y`) until all genes have been accounted for:
  -   ```javascript
      // class method of 'Organism'
      // organism.index starts at 0
      update() {
          if (this.index < 300) {
              this.x += this.genes[this.index][0];
              this.y += this.genes[this.index][1];
              this.index++;
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
  - The move() method draws an organism on the 2D plane using its `x` and `y` attributes as coordinates. We will see the visual animation in-action in the Simulation(link?) section 
 
  #

### Fitness Function
  - The goal of a fitness function is to determine how 'fit' an organism is, and assign her/him/it a fitness score. In this simulation, an organism's fitness reflects its ability to reach a target goal. The closer an organism is to reaching the goal, the higher its fitness score.
  - The fitness score of an organism determines its probability to be selected for reproduction.

  - ```javascript
    // class method of 'Organism'
    calcDistanceToGoal() {
        // c^2 = a^2 + b^2
        let horizontal_distance_squared = (this.x - GOAL_X_POS) ** 2;
        let vertical_distance_squared = (this.y - GOAL_Y_POS) ** 2;

        let distance_to_goal_squared = vertical_distance_squared + horizontal_distance_squared;
        let distance_to_goal = Math.sqrt(distance_to_goal_squared);

        this.distance_to_goal = distance_to_goal;
    }
    
    // class method of 'Organism'
    calcFitness() {
        let height = SPAWN_Y_POS - GOAL_Y_POS;

        let normalized_distance_to_goal = this.distance_to_goal / height;
        this.fitness = 1 - normalized_distance_to_goal;
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

  - To calculate an organism's fitness, we first need to calculate its distance to the goal. Since we're on a 2D plane, all we need is the Pythagorean Theorem(spell check/link?)
  - Once an organism's distance to the goal is determined, we can assign it a fitness score. These scores are normalized by dividing an organism's distance to the goal by the total distance from spawn to goal (`height`), and subtracting the quotient from 1.
  - We also calculate and store `average_fitness`, which is the average fitness score of the entire population. This will be useful in the selection phase of the algorithm.4
  - Note: This is the fitness function used in 'Classic' simulation types. 'Boundary' simulations use a ```different fitness function(ADD LINK)```. 

#

### Selection
  - In the selection phase, we'll use the fitness scores of our population to select 'parent' organisms to reproduce the next-generation of organisms. 
  - The premise here is that organisms with a high fitness score must have better genes than low fitness score organisms. Therefore, selecting the highest-fitness organisms to reproduce should yield a more-fit next-generation, compared to the current.

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

- We begin creating parent couples by first populating arrays `potential_mothers` and `potential_fathers` with female and male organisms from the population. The amount of times that an organism is added to an array is determined by their fitness score.
- In my algorithm, organisms with a fitness score less than `average_fitness` will be added to `potential_mothers/fathers` just once. 
- Alternatively, organisms with an above-average fitness score are added to the array an exponential number of times.

#

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

- Finally, we create parent couples by randomly pairing male and female organisms from `potential_parents`. My algorithm creates parent couples equal to half the population size. We'll see why in the crossover phase.
- Note: `selection_factor` is an optimization I implemented to keep array sizes smaller as `average_fitness` increases, as well as strengthen selection-bias in early generations. However, it is not necessary for the overall-functioning of the algorithm.
- consider mentioning roulette wheel selection???
  - (put in correct place if used) This implementation allows for an organism to be selected for more than one parent couple, i.e., an organism can reproduce with multiple others. Theoretically, one single female could be selected for every single parent couple, and be the mother to each offspring organism in the next-generation.) 

#

### Crossover
  - With our parent-organisms selected, we can begin the crossover phase.
  - Genes of the selected parent-couples will be combined to create new offspring organisms!
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
    
   - We call `crossover()` twice for each of our selected parent couples to simulate each couple creating the `crossover_genes` for 2 offspring organisms. (In the selection phase, we created one parent couple for every two organisms in the population.)
   - We create the `crossover_genes` for a new organism by randomly choosing either the mother or father gene at each index, until we have a full set of genes (300 in this example). The genes are assigned to new `Organism`s and stored in `offspring_organisms`. 
       - *This crossover implementation will keep the population size constant from generation to generation. In Simulation Settings(linktosection), you can optionally choose that your population sizes fluctuate(linktofluctuate?) each generation.*

#
    
### Mutation
  - Mutation refers to the altering/mutation of an offspring organism's genes.
  - The purpose of the mutation operator in a GA is to maintain genetic diversity. A mutation in an organism's genes could produce a new solution that didn't yet exist in the population! 
  - Without mutation and the persistence of diversity, populations could prematurely converge, resulting in a suboptimal solution.
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
  - We can simulate gene mutation by comparing random numbers to our desired mutation rate. In this example, we mutate a gene if the random value is less than 0.03. This will mutate approximately 3% of all genes in the offspring population.
    - the gene mutation rate of organisms is configurable in Simulation Settings (worth mentioning probably)
  
  - In the project files, the mutation phase is woven into crossover() for efficiency, but is separated in this example for readability and understanding  

#

### (word better) BOOM. We now have a new population of offspring organisms whose genes are derived from the most-fit male and female organisms from the previous generation. These organisms can now enter the Evaluation phase and continue the evolution of the species.

(maybe show what happens when an organism succeeds (ehh, save for Simulation section))

(feel free to say more here. Just stopping here for now)


---

---

---

<a name="simulation"></a>

# 4. Simulation
- ### Now that we understand the algorithm, let's see it in action.
<br>

## Simulation Types

### This project offers two simulation types: Classic and Boundary

#

<div align="center">
  <h3>Simulation Type: Classic</h3>
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-header-1.png" width="500" height="300">
  <h5>(screenshot from a Classic simulation)</h5>
</div>

- ### In *Classic* simulations, users will configure their own species of organisms and watch them attempt to reach the goal over generations of natural selection.

#

### Simulation Type: Boundary

- NO IMAGE YET (copy div from classic section)
- ### In *Boundary* simulations, users will create their own path and watch their species of organisms attempt to reach the goal over generations of natural selection. Organism's will need to avoid the boundary to survive!

#

## Simulation Settings

- ### Natural Selection Simulator allows users to adjust settings in the algorithm and configure their own simulation!

<div align="center">
  <h3>Settings</h3>
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-settings-classic.png" width="500" height="300">
  <h5>(screenshot from Settings for Classic simulations)</h5>
</div>

<br>

|  Setting      | Description |
| ----------- | ----------- |
| Initial Population Size | Amount of organisms to create for the first generation of the simulation |
| Movement Speed  | Relative-maximum distance an organism can travel in one movement |
| Mutation Rate | Target percentage of genes to be mutated in offspring organisms |
| Resilience | For *Boundary* simulation type only |
| Population Growth | 'Contant' vs 'Fluctuate' (toggle) |
| Dialogue | When checked, simulation will run will run with additional GA phase highlighting, descriptions, and animations (toggle) |

- (Population Growth) 'Constant': Parent organisms always reproduce offspring equal to the inital population size.
- (Population Growth) 'Fluctuate': Population sizes may vary from generation to generation. When fluctuate is toggled, parent couples may reproduce anywhere from zero to five offspring.
- Resilience will be explained in the *Boundary* section
    
#

# DEMO SECTION? (apologize for gif quality)
### - In this section, we'll walkthrough an examples of *Classic* and *Boundary* simulations. For readability, I'll be just focusing on the progression of the population/algorithm, specifically, the evaluation phase. (word better / I like the idea of a header for this section though)
 
## Simulation Demo (Classic) (maybe name better)

We create a *Classic* simulation with the following settings:
  - ##### Initial Population: 100
  - ##### Movement Speed: 4
  - ##### Mutation Rate: 3.8%
  - ##### Population Growth: Constant

<br>

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-gen0.gif" width="500" height="300">
  <h5>Generation 0</h5>
</div>
    
  - caption

#

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-mid-gen.gif" width="500" height="300">
  <h5>Generation 5</h5>
</div>

  - caption

#

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-gen10.gif" width="500" height="300">
  <h5>Generation 10</h5>
</div>

  - caption

#

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-classic-gen-success.gif" width="500" height="300">
  <h5>Generation 14</h5>
</div>

  - caption

  - (Describe that not all simulations will finish this quickly, and that some may not even succeed at all)

#

## Simulation Demo (Boundary) (maybe name better/put Demo after boundary creation) 

  - (show image of a boundary w/ caption)

  - (show the settings used for this simulation)

  - (introduce/describe resilience) (give resilience own link in table of contents)

### Boundary Creation

  - (don't need to show every step, just describe how it works and show what a valid boundary looks like when finished)

#

### Boundary Simulation Fitness Function(word better?)(give link in table of contents)

  - (describe that boundary uses a different fitness function and why it has to (possible image?)

  - (describe how this function will use checkpoints to determine an organism's fitness score, rather than just distance to goal)

  - *code snippets in this section are simplified to their essentials for readability*

#### Algorithm for Creating Boundary Checkpoints

(i like the idea of using a numbered list here to show the checkpoint creation steps)

##### When the user draws the walls to create their boundary, the mouse coordinates are stored. (mention when we get to it

steps:
1. Connect Boundary Coordinates

#

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-2.png" width="500" height="300">
  <h5>no caption here</h5>
</div>

  - caption
  
  - This is a bit overkill, though. Let's instead just create 10 connection lines
  
#

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-3.png" width="500" height="300">
  <h5>no caption here</h5>
</div>

  - (optional explanation, maybe just explain what the code does)

  - We also compute, store, and connect the center points of each line drawn. These points will represent the epicenters of our checkpoints.

2. Determine Size of Checkpoints
  - With the locations of our boundary's checkpoints known, we can determine the size at which they should be drawn.
  
#

<div align="center">
  <img src="https://github.com/Cudderson/nss-screenshots/blob/main/screenshots/nss-checkpoint-tutorial-4.png" width="500" height="300">
  <h5>no caption here</h5>
</div>

  - (describe how checkpoint size is determined

3. Calculate Checkpoint Data
  - With our checkpoints created, we can calculate data that will help us with our fitness function.
  - We first compute the distances from each checkpoint's epicenter to the next.
  - Using this information, we can call the 'distance to the goal' the sum of distances between checkpoint epicenters (including the spawn point and goal location)
  - Further, these checkpoint-to-checkpoint distances allow us to calculate the distance to the goal for *any* checkpoint, by summing the necessary distances.
  - elaborate more

#


  - (show the settings used for this simulation)

  - (show gen0 gif)

  - (show gen 10 gif)

  - (show successful gen gif)

  - (Describe that not all simulations will finish this quickly, and that some may not even succeed at all)



---

<a name='final-thoughts'></a>

# 5. Final/Closing Thoughts

- ### (describe how the algorithm is trivial compared to real natural selection)

- ### What can we take away from this project?

- ### etc.

<!-- credit: https://towardsdatascience.com/introduction-to-genetic-algorithms-including-example-code-e396e98d8bf3 -->
<!-- credit: luke garrigan blog -->

---

<a name='author'></a>

# 6. Author

- ### (talk about myself)
- ### (email/contact)
