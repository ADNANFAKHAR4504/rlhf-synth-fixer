import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack CDKTF Tests', () => {
  test('Stack synthesis works', () => {
    const app = new App();
    const stack = new TapStack(app, 'TestStack', {
      env: { region: 'ca-central-1' }
    });

    const synthesized = JSON.parse(Testing.synth(stack));

    expect(synthesized).toBeDefined();
    expect(synthesized.resource).toBeDefined();
    expect(synthesized.resource.aws_vpc).toBeDefined();
  });
});
