import { App } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

const app = new App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'synth28549637';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
  awsRegion: 'us-west-2',
  stateBucket: 'iac-rlhf-tf-states',
  stateBucketRegion: 'us-east-1',
});

app.synth();
