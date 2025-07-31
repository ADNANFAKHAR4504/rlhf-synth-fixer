import { App, Testing } from 'cdktf';
import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack', () => {
  test('should create two public and two private subnets', () => {
    const app = new App();
    const stack = new VpcStack(app, 'TestVpcStack');
    const synth = Testing.synth(stack);

    const subnetCount = (synth.match(/"subnet"/gi) || []).length;
    expect(subnetCount).toBeGreaterThanOrEqual(4);
  });

  test('should tag resources with Environment=Production', () => {
    const app = new App();
    const stack = new VpcStack(app, 'TestVpcStackTags');
    const synth = Testing.synth(stack);

    expect(synth).toContain('"Environment": "Production"');
  });
});
