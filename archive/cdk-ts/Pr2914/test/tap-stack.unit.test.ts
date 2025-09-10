import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Components', () => {
    test('should create VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16'
      });
    });

    test('should create RDS database instance', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.37'
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create Auto Scaling Groups', () => {
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 2);
    });

    test('should create CloudWatch Dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `TAP-${environmentSuffix}-Dashboard`
      });
    });

    test('should create security groups with proper naming', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `web-us-east-1-alb-sg-${environmentSuffix}`
      });
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `app-us-east-1-ec2-sg-${environmentSuffix}`
      });
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: `db-us-east-1-rds-sg-${environmentSuffix}`
      });
    });
  });

  describe('Environment Suffix Logic', () => {
    test('should use environment suffix from props', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestPropsStack', { 
        environmentSuffix: 'staging' 
      });
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TAP-staging-Dashboard'
      });
    });

    test('should use environment suffix from context', () => {
      const testApp = new cdk.App({
        context: {
          environmentSuffix: 'prod'
        }
      });
      const testStack = new TapStack(testApp, 'TestContextStack');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TAP-prod-Dashboard'
      });
    });

    test('should default to dev environment suffix', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestDefaultStack');
      const testTemplate = Template.fromStack(testStack);
      
      testTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: 'TAP-dev-Dashboard'
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should have all required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('LoadBalancerUrl', {});
      template.hasOutput('LoadBalancerDnsName', {});
      template.hasOutput('DatabaseEndpoint', {});
      template.hasOutput('WebAutoScalingGroupName', {});
      template.hasOutput('AppAutoScalingGroupName', {});
      template.hasOutput('CloudWatchDashboardUrl', {});
    });
  });
});
