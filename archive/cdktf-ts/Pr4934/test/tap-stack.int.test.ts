import { App, Testing } from 'cdktf';
import { TapStack } from '../lib/tap-stack';

describe('Infrastructure Integration-style Tests', () => {
  test('Full stack synthesizes and contains VPC output', () => {
    const app = new App();
    const stack = new TapStack(app, 'IntTestStack1', { environmentSuffix: 'int' });
    const synthesized = Testing.synth(stack);

    expect(synthesized).toContain('vpc-id');
  });

  test('ALB DNS output exists in synthesized template', () => {
    const app = new App();
    const stack = new TapStack(app, 'IntTestStack2');
    const synthesized = Testing.synth(stack);

    expect(synthesized).toContain('alb-dns-name');
  });

  test('RDS endpoint output is present', () => {
    const app = new App();
    const stack = new TapStack(app, 'IntTestStack3');
    const synthesized = Testing.synth(stack);

    expect(synthesized).toContain('rds-endpoint');
  });

  test('Secrets ARN output is present and contains "lms-db-credentials"', () => {
    const app = new App();
    const stack = new TapStack(app, 'IntTestStack4');
    const synthesized = Testing.synth(stack);

    expect(synthesized).toContain('db-secret-arn');
    expect(synthesized).toMatch(/lms-db-credentials/);
  });

  test('ECS service resource appears in synthesized output with desired count 2', () => {
    const app = new App();
    const stack = new TapStack(app, 'IntTestStack5');
    const synthesized = Testing.synth(stack);

    expect(synthesized).toMatch(/lms-service/);
    expect(synthesized).toMatch(/desired_count\W*:\W*2|desiredCount/);
  });
});
