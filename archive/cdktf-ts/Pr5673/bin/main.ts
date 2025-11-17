import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

// Get environment from context or use 'dev' as default
const environment = app.node.tryGetContext('environment') || 'dev';
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') || `${environment}-${Date.now()}`;
const region = app.node.tryGetContext('region') || 'ap-southeast-1';
const project = app.node.tryGetContext('project') || 'fintech-api';

new TapStack(app, `${project}-api-${environment}`, {
  environmentSuffix,
  environment,
  region,
  project,
});

app.synth();
