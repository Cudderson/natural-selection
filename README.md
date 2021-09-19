---

<div align='center'>
  <br>
  <img src="images/natural_selection_sim_logo.png">
  <br>
  <br>
  <img src='https://img.shields.io/badge/simulator-online-brightgreen'>
</div>

---
# *** Consider putting all readme screenshots/gifs in different repo to keep small size ***
# Table of Contents (finish/add markdown links at end)
## [1. About](#about)
- ### [Project Overview](#overview)
- ### [Natural Selection and Genetic Algorithms](#ga)
## [2. Usage](#usage)
## [3. Algorithm Implementation](#algo)
## [4. Simulation](#simulation)
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

- ### ! *code snippets are stripped down to their essentials for readability*

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

      // fill arrays with candidates for reproduction
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

      // create parent couples
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

#

# STOPPED HERE

### Crossover
  - With our parent-organisms selected, we can begin the crossover phase.
  - Genes of the selected parent-couples will be combined to create new offspring organisms!
  - [code snippet]

### Mutation
  - Mutation refers to the altering/mutation of an offspring organism's genes.
  - "Mutation" sounds negative and alarming, but it's a necessary step in genetic algorithms.
  - [code snippet]
  - explanation

---

<a name="simulation"></a>

# 4 Simulation
- ### Now that we understand the algorithm, let's see it in action.
<br>

## Simulation Types

### This project offers two simulation types: Classic and Boundary

#### Simulation Type: Classic

- image
- ##### describe classic sim type

#### Simulation Type: Boundary

- image
- ##### describe boundary sim type

#

## Classic Simulation

- #### (settings with screenshot)

- #### (go through the 5 phases in classic simulations)

## Boundary Simulation

- #### (settings with screenshot)

- #### (go through the 5 phases in boundary simluations)

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
