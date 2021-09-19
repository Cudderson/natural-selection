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

## The Algorithm (include goal of this specific algorithm somewhere) (format text sizes at end)

### Create A New Generation
  - The first step is to supply our algorithm with an initial population (of organisms).
  - [code snippet]
  - We create a population of [x] organisms with random 'genes'.
  - For this project, a 'gene' is a coordinate pair that represents the next movement an organism will make on a 2D plane. (ex. [3, -1])
  - Note: All organisms will share the same starting location/spawn-point.

### Evaluation / Fitness Function
  - [code snippet / updateAndMove() gif]
  - To evaluate our population, we apply each organism's genes to their current position until all genes have been evaluated for.

  - Next is possibly the most-crucial piece of any genetic algorithm: the **fitness function**.
  - The goal of a fitness function is to determine how 'fit' an organism is, and assign her/him/it a fitness score. In this project, an organism's fitness reflects its ability to reach a target goal. The closer an organism is to reaching the goal, the higher its fitness score.
  - The fitness score of an organism determines its probability to be selected for reproduction.

### Selection
  - In the selection phase, we'll use the fitness scores of our population to select 'parent' organisms to reproduce the next-generation of organisms. 
  - The premise here is that organisms with a high fitness score must have better genes than low fitness score organisms. Therefore, selecting the highest-fitness organisms to reproduce should yield a more-fit next-generation, compared to the current.
  - [code snippet] / explanation (we create parent couples by...)

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
