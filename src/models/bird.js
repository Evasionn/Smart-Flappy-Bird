import { NeuralNetwork } from '../lib/nn';
import { WIDTH, HEIGHT } from '../constants';

const BIRD_START_X = 150;

export default class Bird {
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
