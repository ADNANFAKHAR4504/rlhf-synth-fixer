#!/usr/bin/env node
import { App } from 'cdktf';
import { TradingPlatformStack } from '../lib/index';

const app = new App();
new TradingPlatformStack(app, 'trading-platform-dr');
app.synth();