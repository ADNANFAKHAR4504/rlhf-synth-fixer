import { App } from 'cdktf';
import { TapStack } from './lib/tap-stack';

const app = new App();

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

new TapStack(app, `TapStack${environmentSuffix}`, {
  environmentSuffix,
});

app.synth();
