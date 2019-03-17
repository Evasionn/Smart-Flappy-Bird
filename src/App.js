import React, { Component } from 'react';
import { NeuralNetwork } from './lib/nn';
import './App.css';

const HEIGHT = 250;
const WIDTH = 500;
const PIPE_WIDTH = 40;
const INITIAL_PIPE_SPACE = 80;
const MIN_PIPE_HEIGHT = 20;
const FPS = 120;
const TOTAL_BIRDS = 250;
const BIRD_START_X = 150;

class Bird {
  constructor(ctx, brain) {
    this.ctx = ctx;
    this.x = BIRD_START_X;
    this.y = 150;
    this.age = 0;
    this.fitness = 0;
    this.gravity = 0;
    this.velocity = 0.1;
    this.isDead = false;

    if (brain) {
      this.brain = brain.copy();
      this.mutate();
    } else {
      this.brain = new NeuralNetwork(5, 5, 2);
    }
  }

  draw() {
    this.ctx.fillStyle = '#D84315';
    this.ctx.beginPath();
    this.ctx.arc(this.x, this.y, 6, 0, 2 * Math.PI);
    this.ctx.fill();
  }

  update = (pipeX, spaceStartY, spaceEndY) => {
    this.age += 1;
    this.gravity += this.velocity;
    this.gravity = Math.min(4, this.gravity);
    this.y += this.gravity;

    this.think(pipeX, spaceStartY, spaceEndY);
  }

  think = (pipeX, spaceStartY, spaceEndY) => {
    const inputs = [
      ((pipeX - BIRD_START_X) / (WIDTH - BIRD_START_X)).toFixed(2),
      (spaceStartY / HEIGHT).toFixed(2),
      (spaceEndY / HEIGHT).toFixed(2),
      (this.y / HEIGHT).toFixed(2),
      (this.gravity / 3).toFixed(2),
    ];
    const output = this.brain.predict(inputs);
    if (output[0] < output[1]) {
      this.jump();
    }
  }

  mutate = () => {
    this.brain.mutate((x) => {
      if (Math.random() < 0.1) {
        const offset = Math.random();
        return x + offset;
      }
      return x;
    });
  }

  jump = () => {
    this.gravity = -3;
  }

  setIsDead(param) {
    this.isDead = param;
  }

  setFitness(param) {
    this.fitness = param;
  }
}

class Pipe {
  constructor(ctx, height, space) {
    this.ctx = ctx;
    this.isDead = false;

    this.x = WIDTH;
    this.y = height ? HEIGHT - height : 0;
    this.width = PIPE_WIDTH;
    this.height = height || MIN_PIPE_HEIGHT
    + Math.random() * (HEIGHT - space - MIN_PIPE_HEIGHT * 2);
  }

  draw() {
    this.ctx.fillStyle = '#00796B';
    this.ctx.fillRect(this.x, this.y, this.width, this.height);
  }

  update() {
    this.x -= 1;
    if ((this.x + WIDTH) < 0) {
      this.isDead = true;
    }
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.frameCount = 0;
    this.space = INITIAL_PIPE_SPACE;
    this.pipes = [];
    this.birds = [];
    this.deadBirds = [];
    this.generationCount = 0;
  }

  componentDidMount() {
    // document.addEventListener('keydown', this.onKeyDown);
    this.startGame();
  }


  // USER ONLY MODE
  // onKeyDown = (e) => {
  //   if (e.code === 'Space') {
  //     this.birds[0].jump();
  //   }
  // }

  getContext = () => this.canvasRef.current.getContext('2d');

  generatePipes = () => {
    const ctx = this.getContext();
    const firstPipe = new Pipe(ctx, null, this.space);
    const secondPipeHeight = HEIGHT - firstPipe.height - this.space;
    const secondPipe = new Pipe(ctx, secondPipeHeight, this.space);
    return [firstPipe, secondPipe];
  }

  generateBirds = () => {
    const ctx = this.getContext();
    const birds = [];
    for (let i = 0; i < TOTAL_BIRDS; i += 1) {
      const brain = this.deadBirds.length && this.pickOne().brain;
      const newBird = new Bird(ctx, brain);
      birds.push(newBird);
    }
    return birds;
  }

  gameLoop = () => {
    this.update();
    this.draw();
  }

  update = () => {
    this.frameCount += 1;
    if (this.frameCount % 300 === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }

    // update pipe positions
    this.pipes.forEach(pipe => pipe.update());

    // delete off-screen pipes
    this.pipes = this.pipes.filter(pipe => !pipe.isDead);

    // update bird positions
    this.birds.forEach((bird) => {
      const nextPipe = this.getNextPipe(bird);
      const spaceStartY = nextPipe.y + nextPipe.height;
      bird.update(nextPipe.x, spaceStartY, spaceStartY + this.space);
    });

    // delete dead birds
    this.updateBirdDeadState();
    this.deadBirds.push(...this.birds.filter(bird => bird.isDead));
    this.birds = this.birds.filter(bird => !bird.isDead);

    if (this.birds.length === 0) {
      let totalAge = 0;
      this.deadBirds.forEach((deadBird) => { totalAge += deadBird.age; });
      this.deadBirds.forEach((deadBird) => { deadBird.setFitness(deadBird.age / totalAge); });
      this.startGame();
    }

    // if (this.isGameOver()) {
    //   clearInterval(this.loop);
    // }
  }

  pickOne = () => {
    let index = 0;
    let r = Math.random();
    while (r > 0) {
      r -= this.deadBirds[index].fitness;
      index += 1;
    }
    index -= 1;
    return this.deadBirds[index];
  }

  getNextPipe = (bird) => {
    for (let i = 0; i < this.pipes.length; i += 1) {
      if (this.pipes[i].x > bird.x) {
        return this.pipes[i];
      }
    }
    return false;
  }

  updateBirdDeadState = () => {
    // detect collisions
    this.birds.forEach((bird) => {
      this.pipes.forEach((pipe) => {
        if (
          bird.y <= 0 || bird.y >= HEIGHT || (
            bird.x >= pipe.x && bird.x <= pipe.x + pipe.width
            && bird.y >= pipe.y && bird.y <= pipe.y + pipe.height)
        ) {
          bird.setIsDead(true);
        }
      });
    });
  }

  draw() {
    const ctx = this.canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.pipes.forEach(pipe => pipe.draw());
    this.birds.forEach(bird => bird.draw());
  }

  startGame() {
    this.generationCount += 1;
    this.frameCount = 0;
    clearInterval(this.loop);
    const ctx = this.getContext();
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    this.pipes = this.generatePipes();
    this.birds = this.generateBirds();
    this.deadBirds = [];
    this.loop = setInterval(this.gameLoop, 1000 / FPS);
  }

  render() {
    return (
      <div className="App">
        <canvas
          ref={this.canvasRef}
          width={WIDTH}
          height={HEIGHT}
          style={{ marginTop: '24px', border: '1px solid #c3c3c3' }}
        >
          Your browser does not support the canvas element
        </canvas>
      </div>
    );
  }
}

export default App;
