import { Testing } from 'cdktf';
import { TapStack } from './lib/tap-stack';
const app = Testing.app();
const stack = new TapStack(app, 'test');
const synth = Testing.synth(stack);
console.log(Object.keys(synth));
