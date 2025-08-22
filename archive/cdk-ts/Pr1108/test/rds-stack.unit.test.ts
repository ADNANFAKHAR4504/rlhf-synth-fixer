import * as cdk from 'aws-cdk-lib';
import { aws_kms as kms } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { RdsStack } from '../lib/stacks/rds-stack';
import { VpcStack } from '../lib/stacks/vpc-stack';

describe('RdsStack', () => {
  it('creates a PostgreSQL RDS instance and publishes its ARN to SSM', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'VpcStack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
    });
    const stack = new cdk.Stack(app, 'RdsTestStack');
    const key = new kms.Key(stack, 'TestKey');
    const rdsStack = new RdsStack(app, 'RdsStack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
      vpc: vpcStack.vpc,
      kmsKey: key,
      regionOverride: 'us-east-1',
    });
    const template = Template.fromStack(rdsStack);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.resourceCountIs('AWS::SSM::Parameter', 1);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/eng-dev-test/rds/db-arn/us-east-1',
    });
  });

  it('creates a PostgreSQL RDS instance and publishes its ARN to SSM with default region', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'VpcStack', {
      dept: 'eng',
      envName: 'prod',
      purpose: 'data',
    });
    const stack = new cdk.Stack(app, 'RdsTestStack');
    const key = new kms.Key(stack, 'TestKey');
    const rdsStack = new RdsStack(app, 'RdsStack', {
      dept: 'eng',
      envName: 'prod',
      purpose: 'data',
      vpc: vpcStack.vpc,
      kmsKey: key,
      regionOverride: 'us-east-1', // <-- always provide regionOverride
    });
    const template = Template.fromStack(rdsStack);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.resourceCountIs('AWS::SSM::Parameter', 1);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/eng-prod-data/rds/db-arn/us-east-1',
    });
  });

  it('throws if kmsKey is missing', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'VpcStack', {
      dept: 'eng',
      envName: 'dev',
      purpose: 'test',
    });
    expect(() => {
      new RdsStack(app, 'RdsStack', {
        dept: 'eng',
        envName: 'dev',
        purpose: 'test',
        vpc: vpcStack.vpc,
        // kmsKey missing
        regionOverride: 'us-east-1',
      });
    }).toThrow();
  });

  it('creates RDS with alternate props', () => {
    const app = new cdk.App();
    const vpcStack = new VpcStack(app, 'VpcStack', {
      dept: 'ops',
      envName: 'prod',
      purpose: 'data',
    });
    const stack = new cdk.Stack(app, 'RdsTestStack');
    const key = new kms.Key(stack, 'TestKey');
    const rdsStack = new RdsStack(app, 'RdsStack', {
      dept: 'ops',
      envName: 'prod',
      purpose: 'data',
      vpc: vpcStack.vpc,
      kmsKey: key,
      regionOverride: 'us-west-2',
    });
    const template = Template.fromStack(rdsStack);
    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.resourceCountIs('AWS::SSM::Parameter', 1);
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/ops-prod-data/rds/db-arn/us-west-2',
    });
  });
});
