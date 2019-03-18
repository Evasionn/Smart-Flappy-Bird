import Bird from './models/bird';
import Pipe from './models/pipe';
import {
  INITIAL_PIPE_SPACE, FPS, SPEED_MODE_FPS, WIDTH, HEIGHT, TOTAL_BIRDS,
} from './constants';

export default class Game {
  constructor(ctx, speedMode) {
    this.ctx = ctx;
    this.frameCount = 0;
    this.generationCount = 0;
    this.highscore = 0;
    this.space = INITIAL_PIPE_SPACE;
    this.gameSpeed = speedMode ? SPEED_MODE_FPS : FPS;

    this.pipes = [];
    this.birds = [];
    this.deadBirds = [];
  }

  // kill game loop
  kill = () => {
    clearInterval(this.loop);
  };

  // start new game
  startGame = () => {
    this.generationCount += 1;
    this.highscore = Math.max(this.highscore, this.gameStart ? Date.now() - this.gameStart : 0);
    this.gameStart = Date.now();
    this.frameCount = 0;
    clearInterval(this.loop);
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);

    this.pipes = this.generatePipes();
    this.birds = this.generateBirds();
    this.deadBirds = [];
    this.loop = setInterval(this.gameLoop, 1000 / this.gameSpeed);
  }

  // generates two pipes
  generatePipes = () => {
    const firstPipe = new Pipe(this.ctx, null, this.space);
    const secondPipeHeight = HEIGHT - firstPipe.height - this.space;
    const secondPipe = new Pipe(this.ctx, secondPipeHeight, 80);
    return [firstPipe, secondPipe];
  }

  // generates bird according to the TOTAL_BIRDS number
  // pick some dead birds brain and uses for the next generations
  // after the first generation
  generateBirds = () => {
    const birds = [];
    for (let i = 0; i < TOTAL_BIRDS; i += 1) {
      const brain = this.deadBirds.length && this.pickOne().brain;
      const newBird = new Bird(this.ctx, brain);
      birds.push(newBird);
    }
    return birds;
  };

  // main game loop
  gameLoop = () => {
    this.update();
    this.draw();
  }

  update = () => {
    this.frameCount = this.frameCount + 1;
    // generating pipes
    if (this.frameCount % 300 === 0) {
      const pipes = this.generatePipes();
      this.pipes.push(...pipes);
    }

    // update pipes
    this.pipes.forEach(pipe => pipe.update());

    // update birds
    this.birds.forEach((bird) => {
      const nextPipe = this.getNextPipe(bird);
      const spaceStartY = nextPipe.y + nextPipe.height;
      bird.update(nextPipe.x, spaceStartY, spaceStartY + this.space);
    });

    // delete off-screen pipes
    this.pipes = this.pipes.filter(pipe => !pipe.isDead);

    // delete dead birds from the screen
    this.updateBirdDeadState();
    this.deadBirds.push(...this.birds.filter(bird => bird.isDead));
    this.birds = this.birds.filter(bird => !bird.isDead);

    // if all birds are died, start new game
    if (this.birds.length === 0) {
      let totalAge = 0;
      // calculation of total age of the birds
      this.deadBirds.forEach((deadBird) => { totalAge += deadBird.age; });

      // calculate and set finess value of the birds
      this.deadBirds.forEach((deadBird) => { deadBird.setFitness(deadBird.age / totalAge); });
      this.startGame();
    }
  }

  // pick one bird in the deadBirds array
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

  // getting the next closest pipe
  getNextPipe = (bird) => {
    for (let i = 0; i < this.pipes.length; i += 1) {
      if (this.pipes[i].x > bird.x) {
        return this.pipes[i];
      }
    }
    return this.pipes[0];
  }

  // change the dead status of the bird
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

  // draw everything
  draw() {
    this.ctx.clearRect(0, 0, WIDTH, HEIGHT);
    this.pipes.forEach(pipe => pipe.draw());
    this.birds.forEach(bird => bird.draw());

    // printing game status
    this.ctx.font = '12px serif';
    this.ctx.fillStyle = 'black';
    this.ctx.fillText(`Generation: ${this.generationCount}`, 10, 15);
    this.ctx.fillText(`Bird count: ${this.birds.length}`, 10, 30);
    this.ctx.fillText(`Best score: ${(this.highscore / 1000).toFixed(1)} sn`, 10, 45);
  }
}
