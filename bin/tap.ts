#!/usr/bin/env node
import { App } from 'cdktf';
import { TradingPlatformStack } from '../lib/tap-stack';

// Set environment variables if not already set
if (!process.env.CDK_DEFAULT_ACCOUNT) {
  console.warn(
    'Warning: CDK_DEFAULT_ACCOUNT not set. Using placeholder account ID.'
  );
  process.env.CDK_DEFAULT_ACCOUNT = '123456789012';
}

// Create CDKTF app
const app = new App();

// Create stack instance
new TradingPlatformStack(app, 'trading-platform', {
  isPrimary: true,
  primaryRegion: 'us-east-1',
  secondaryRegion: 'us-west-2',
  domainName: 'trading.example.com',
});

// Synthesize the app
app.synth();
