#!/usr/bin/env node
import { App } from 'cdktf';
import { WordpressStack } from '../lib/tap-stack';

const app = new App();

new WordpressStack(app, 'WordpressStack');

app.synth();
