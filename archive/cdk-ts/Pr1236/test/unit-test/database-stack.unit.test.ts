import { App } from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { DatabaseStack } from '../../lib/stacks/database-stack';
describe('DatabaseStack', () => {
  let app: App;
  let testStack: import('aws-cdk-lib').Stack;
  let vpc: ec2.Vpc;
  let dataKey: kms.Key;
  let appSecurityGroup: ec2.SecurityGroup;
  let appInstanceRole: iam.Role;
  beforeEach(() => {
    app = new App();
    testStack = new (require('aws-cdk-lib').Stack)(app, 'TestStack');
    vpc = new ec2.Vpc(testStack, 'TestVpc');
    dataKey = new kms.Key(testStack, 'TestKey');
    appSecurityGroup = new ec2.SecurityGroup(testStack, 'AppSg', { vpc });
    appInstanceRole = new iam.Role(testStack, 'AppRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
  });
  it('should create dbInstance and output endpoint', () => {
    const stack = new DatabaseStack(testStack, 'DatabaseStack', {
      vpc,
      dataKey,
      appSecurityGroup,
      appInstanceRole,
    });
    expect(stack.dbInstance).toBeDefined();
  });
  it('should throw if required props are missing', () => {
    // @ts-expect-error
    expect(() => new DatabaseStack(testStack, 'BadStack', {})).toThrow();
  });
});
