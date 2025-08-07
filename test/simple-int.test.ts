import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: App;

  beforeEach(() => {
    app = new App();
  });

  test('Stack synthesizes without errors', () => {
    const stack = new TapStack(app, 'TestStack');

    expect(() => {
      const synthesized = JSON.parse(Testing.synth(stack));
    }).not.toThrow();
  });
});
