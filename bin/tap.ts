#!/usr/bin/env node
import { TradingPlatformApp } from '../lib/tap-stack';

// Set environment variables if not already set
if (!process.env.CDK_DEFAULT_ACCOUNT) {
  console.warn(
    'Warning: CDK_DEFAULT_ACCOUNT not set. Using placeholder account ID.'
  );
  process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
}

// Create and synthesize the trading platform app
const app = new TradingPlatformApp();
app.synth();
