// Configuration for integration tests (outputs loading disabled for local/dev)
// const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration', () => {
  const defaultEnv = { account: '123456789012', region: 'us-east-1' };
  const defaultCertArn =
    'arn:aws:acm:us-east-1:123456789012:certificate/abc123';

  it('synthesizes all major resources and propagates tags', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackInt', {
      env: defaultEnv,
      stage: 'integration',
      appName: 'webapp',
    });
    const template = Template.fromStack(stack);
    // Major resources
    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::EC2::SecurityGroup', 2);
    template.resourceCountIs('AWS::EC2::LaunchTemplate', 1);
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
    template.resourceCountIs('AWS::ElasticLoadBalancingV2::Listener', 1);
    // Tag propagation (check on VPC)
    const vpcResources = template.findResources('AWS::EC2::VPC');
    const vpc = Object.values(vpcResources)[0];
    expect(vpc.Properties.Tags).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ Key: 'Stage', Value: 'integration' }),
        expect.objectContaining({ Key: 'Region', Value: 'us-east-1' }),
        expect.objectContaining({
          Key: 'ProblemID',
          Value: 'Web_Application_Deployment_CDK_Typescript_04o8y7hfeks8',
        }),
      ])
    );
    // Listener ports check
    const listeners = template.findResources(
      'AWS::ElasticLoadBalancingV2::Listener'
    );
    const ports = Object.values(listeners).map((l: any) => l.Properties.Port);
    expect(ports).toEqual(expect.arrayContaining([80]));
  });
  it('defaults stage to dev if not provided (integration)', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackNoStageInt', {
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
