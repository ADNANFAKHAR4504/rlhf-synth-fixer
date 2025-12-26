import { App, Testing } from 'cdktf';
import { TapStack, EnvironmentConfig } from '../lib/tap-stack';

describe('Unified WebApp Stack Unit Tests', () => {
  let app: App;
  let stack: TapStack;
  let synthesized: any;

  beforeAll(() => {
    app = new App();
    const testEnvironments: EnvironmentConfig[] = [
      {
        envName: 'dev',
        awsRegion: 'us-east-1',
        instanceType: 't3.micro',
        vpcCidr: '10.100.0.0/16',
        tags: { Environment: 'Development' },
      },
      {
        envName: 'prod',
        awsRegion: 'us-east-1',
        instanceType: 't3.medium',
        vpcCidr: '10.200.0.0/16',
        tags: { Environment: 'Production' },
      },
    ];

    stack = new TapStack(app, 'TestUnifiedStack', {
      environments: testEnvironments,
    });
    synthesized = JSON.parse(Testing.synth(stack));
  });

  test('should create resources for all defined environments', () => {
    // Check that VPCs for both dev and prod are defined
    expect(synthesized.resource.aws_vpc['Vpc-dev']).toBeDefined();
    expect(synthesized.resource.aws_vpc['Vpc-prod']).toBeDefined();
  });

  test('should apply environment-specific configurations', () => {
    const devInstance = synthesized.resource.aws_instance['Instance-dev'];
    const prodInstance = synthesized.resource.aws_instance['Instance-prod'];

    expect(devInstance.instance_type).toBe('t3.micro');
    expect(prodInstance.instance_type).toBe('t3.medium');
  });

  test('should apply correct environment tags', () => {
    const devSg = synthesized.resource.aws_security_group['Sg-dev'];
    const prodSg = synthesized.resource.aws_security_group['Sg-prod'];

    expect(devSg.tags.Environment).toBe('Development');
    expect(prodSg.tags.Environment).toBe('Production');
  });

  test('should generate unique names for resources in each environment', () => {
    const devRoleName = synthesized.resource.aws_iam_role['Role-dev'].name;
    const prodRoleName = synthesized.resource.aws_iam_role['Role-prod'].name;

    expect(devRoleName).not.toEqual(prodRoleName);
    expect(devRoleName).toMatch(/^webapp-dev-/);
    expect(prodRoleName).toMatch(/^webapp-prod-/);
  });
});
