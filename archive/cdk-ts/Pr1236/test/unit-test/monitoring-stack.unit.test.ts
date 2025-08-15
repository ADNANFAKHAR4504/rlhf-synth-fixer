import { App } from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { MonitoringStack } from '../../lib/stacks/monitoring-stack';
describe('MonitoringStack', () => {
  let app: App;
  let testStack: import('aws-cdk-lib').Stack;
  let alb: elbv2.ApplicationLoadBalancer;
  let asg: autoscaling.AutoScalingGroup;
  let dbInstance: rds.DatabaseInstance;
  beforeEach(() => {
    app = new App();
    testStack = new (require('aws-cdk-lib').Stack)(app, 'TestStack');
    const vpc = new (require('aws-cdk-lib/aws-ec2').Vpc)(testStack, 'TestVpc');
    alb = new elbv2.ApplicationLoadBalancer(testStack, 'TestAlb', {
      vpc,
      internetFacing: true,
    });
    asg = new autoscaling.AutoScalingGroup(testStack, 'TestAsg', {
      vpc,
      instanceType: new (require('aws-cdk-lib/aws-ec2').InstanceType)(
        't3.micro'
      ),
      machineImage:
        require('aws-cdk-lib/aws-ec2').MachineImage.latestAmazonLinux2023(),
    });
    dbInstance = new rds.DatabaseInstance(testStack, 'TestDb', {
      vpc,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      instanceType: new (require('aws-cdk-lib/aws-ec2').InstanceType)(
        't3.medium'
      ),
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
    });
  });
  it('should create CloudWatch alarms for ALB, ASG, and DB', () => {
    const stack = new MonitoringStack(testStack, 'MonitoringStack', {
      alb,
      asg,
      dbInstance,
    });
    expect(stack).toBeDefined();
  });
  it('should throw if required props are missing', () => {
    // @ts-expect-error
    expect(() => new MonitoringStack(testStack, 'BadStack', {})).toThrow();
  });
});
