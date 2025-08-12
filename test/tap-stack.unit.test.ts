import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mocks for nested stacks removed because files do not exist

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  // Remove unused variables to fix errors

  const defaultEnv = { account: '123456789012', region: 'us-east-1' };
  const defaultCertArn =
    'arn:aws:acm:us-east-1:123456789012:certificate/abc123';

  // Remove beforeEach block as it is not needed for these tests

  describe('Unit Tests', () => {
    const defaultEnv = { account: '123456789012', region: 'us-east-1' };
    const defaultCertArn =
      'arn:aws:acm:us-east-1:123456789012:certificate/abc123';

    it('creates all resources and tags with valid props', () => {
      // Test with certificateArn (HTTPS + HTTP)
      {
        const app = new cdk.App();
        const stackWithCert = new TapStack(app, 'TestStackWithCert', {
          env: defaultEnv,
          stage: 'test',
          appName: 'webapp',
          certificateArn: defaultCertArn,
        });
        const templateWithCert = Template.fromStack(stackWithCert);
        templateWithCert.resourceCountIs('AWS::EC2::VPC', 1);
        templateWithCert.resourceCountIs('AWS::EC2::SecurityGroup', 2);
        templateWithCert.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
        templateWithCert.resourceCountIs(
          'AWS::AutoScaling::AutoScalingGroup',
          1
        );
        templateWithCert.resourceCountIs(
          'AWS::ElasticLoadBalancingV2::LoadBalancer',
          1
        );
        templateWithCert.resourceCountIs(
          'AWS::ElasticLoadBalancingV2::Listener',
          2
        );
        // Tags: check on VPC resource (tags are propagated)
        const vpcResourcesWithCert =
          templateWithCert.findResources('AWS::EC2::VPC');
        const vpcWithCert = Object.values(vpcResourcesWithCert)[0];
        expect(vpcWithCert.Properties.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Stage', Value: 'test' }),
            expect.objectContaining({ Key: 'Region', Value: 'us-east-1' }),
            expect.objectContaining({
              Key: 'ProblemID',
              Value: 'Web_Application_Deployment_CDK_Typescript_04o8y7hfeks8',
            }),
          ])
        );
      }

      // Test without certificateArn (should throw)
      {
        const app = new cdk.App();
        expect(() => {
          new TapStack(app, 'TestStackNoCert', {
            env: defaultEnv,
            stage: 'test',
            appName: 'webapp',
            // certificateArn omitted
          });
        }).toThrow(/certificateArn is required/);
      }
    });

    it('defaults stage to dev if not provided', () => {
      const app = new cdk.App();
      // Omit stage to test defaulting logic, but provide required certificateArn
      const stack = new TapStack(app, 'TestStackNoStage', {
        env: defaultEnv,
        appName: 'webapp',
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

    it('defaults appName to webapp if not provided', () => {
      const app = new cdk.App();
      // Omit appName to test defaulting logic, but provide required certificateArn
      const stack = new TapStack(app, 'TestStackNoAppName', {
        env: defaultEnv,
        stage: 'test',
        certificateArn: defaultCertArn,
        // appName intentionally omitted
      } as any);
      const template = Template.fromStack(stack);
      // Check that the App tag is set to 'webapp' by default
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const vpc = Object.values(vpcResources)[0];
      expect(vpc.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'App', Value: 'webapp' }),
        ])
      );
    });
  });
});
