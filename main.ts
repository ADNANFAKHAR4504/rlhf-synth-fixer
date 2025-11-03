import { App } from 'cdktf';
import { TapStack } from './lib/tap-stack';

const app = new App();

// Get environment suffix from context or environment variable
const environmentSuffix =
  app.node.tryGetContext('environmentSuffix') ||
  process.env.ENVIRONMENT_SUFFIX ||
  'dev';

// Get region from context or use default
const region =
  app.node.tryGetContext('region') ||
  process.env.AWS_REGION ||
  'ap-southeast-1';

new TapStack(app, 'TapStack', {
  environmentSuffix,
  region,
});

app.synth();
