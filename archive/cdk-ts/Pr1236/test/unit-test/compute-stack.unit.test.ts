import { App } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { ComputeStack } from '../../lib/stacks/compute-stack';
describe('ComputeStack', () => {
  let app: App;
  let testStack: import('aws-cdk-lib').Stack;
  let vpc: ec2.Vpc;
  let dataKey: kms.Key;
  let appBucket: s3.Bucket;
  beforeEach(() => {
    app = new App();
    testStack = new (require('aws-cdk-lib').Stack)(app, 'TestStack');
    vpc = new ec2.Vpc(testStack, 'TestVpc');
    dataKey = new kms.Key(testStack, 'TestKey');
    appBucket = new s3.Bucket(testStack, 'TestBucket');
  });
  it('should create ALB, ASG, instanceRole, and appSecurityGroup', () => {
    const stack = new ComputeStack(testStack, 'ComputeStack', {
      vpc,
      dataKey,
      appBucket,
    });
    expect(stack.alb).toBeDefined();
    expect(stack.asg).toBeDefined();
    expect(stack.instanceRole).toBeDefined();
    expect(stack.appSecurityGroup).toBeDefined();
  });
  it('should throw if required props are missing', () => {
    // @ts-expect-error
    expect(() => new ComputeStack(testStack, 'BadStack', {})).toThrow();
  });
});
