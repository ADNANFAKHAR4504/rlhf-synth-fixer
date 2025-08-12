import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mocks for nested stacks removed because files do not exist

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  const defaultEnv = { account: '123456789012', region: 'us-east-1' };
  const defaultCertArn =
    'arn:aws:acm:us-east-1:123456789012:certificate/abc123';

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: defaultEnv,
      stage: 'dev',
      certificateArn: defaultCertArn,
    });
    template = Template.fromStack(stack);
  });

  describe('Unit Tests', () => {
    const defaultEnv = { account: '123456789012', region: 'us-east-1' };
    const defaultCertArn =
      'arn:aws:acm:us-east-1:123456789012:certificate/abc123';

    it('creates all resources and tags with valid props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        env: defaultEnv,
        stage: 'test',
        certificateArn: defaultCertArn,
      });

      const template = Template.fromStack(stack);

      // VPC
      template.resourceCountIs('AWS::EC2::VPC', 1);

      // Security Groups
      template.resourceCountIs('AWS::EC2::SecurityGroup', 2);

      // Launch Template
      template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);

      // Auto Scaling Group
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);

      // ALB
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);

      // Listeners
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 2);

      // Tags: check on VPC resource (tags are propagated)
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcResources)[0];
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Stage', Value: 'test' }),
          expect.objectContaining({ Key: 'Region', Value: 'us-east-1' }),
          expect.objectContaining({
            Key: 'ProblemID',
            Value: 'Web_Application_Deployment_CDK_Typescript_04o8y7hfeks8',
          }),
        ])
      );
    });

    it('throws if certificateArn is missing', () => {
      const app = new cdk.App();
      // Omit certificateArn entirely to simulate missing required prop
      expect(
        () =>
          new TapStack(app, 'TestStackNoCert', {
            env: defaultEnv,
            stage: 'test',
            // certificateArn intentionally omitted
          } as any)
      ).toThrow(/certificateArn is required/);
    });

    it('defaults stage to dev if not provided', () => {
      const app = new cdk.App();
      // Omit stage to test defaulting logic, cast as any to bypass type check
      const stack = new TapStack(app, 'TestStackNoStage', {
        env: defaultEnv,
        certificateArn: defaultCertArn,
        // stage intentionally omitted
      } as any);
      const template = Template.fromStack(stack);
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcResources)[0];
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Stage', Value: 'dev' }),
        ])
      );
    });
  });
});
