import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { VpcStack } from '../lib/stacks/vpc-stack';

describe('VpcStack', () => {
  it('creates a VPC with correct name and outputs', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'VpcStack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::EC2::VPC', 1);
    const vpcs = template.findResources('AWS::EC2::VPC');
    const vpcProps = Object.values(vpcs)[0].Properties;
    const nameTag = vpcProps.Tags.find((tag: any) => tag.Key === 'Name');
    expect(nameTag).toBeDefined();
    expect(nameTag.Value).toBe('eng-dev-test-vpc');
  });

  it('throws if required props are missing', () => {
    const app = new cdk.App();
    expect(() => {
      // @ts-expect-error
      new VpcStack(app, 'VpcStack', {});
    }).toThrow();
  });

  it('creates VPC with alternate tag value', () => {
    const app = new cdk.App();
    const stack = new VpcStack(app, 'VpcStack', {
      dept: 'ops',
      envName: 'prod',
      purpose: 'data',
    });
    const template = Template.fromStack(stack);
    const vpcs = template.findResources('AWS::EC2::VPC');
    const vpcProps = Object.values(vpcs)[0].Properties;
    const nameTag = vpcProps.Tags.find((tag: any) => tag.Key === 'Name');
    expect(nameTag.Value).toBe('ops-prod-data-vpc');
  });
});
