import { App } from 'cdktf';
import { TapStack } from './tap-stack';

const app = new App();

// Get environment suffix from environment variable or use default
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth63419782';

new TapStack(app, 'tap-stack', {
  environmentSuffix,
  awsRegion: 'us-east-2',
  stateBucket: process.env.STATE_BUCKET || 'iac-rlhf-tf-states',
  stateBucketRegion: process.env.STATE_BUCKET_REGION || 'us-east-1',
});

app.synth();
