import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App({
      context: {
        environmentSuffix: 'dev'
      }
    });
    stack = new TapStack(app, 'TestTapStack');
    template = Template.fromStack(stack);
  });

  describe('Stack Creation and Configuration', () => {
    test('should create stack with correct name', () => {
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should have all required constructs', () => {
      expect(stack.vpcConstruct).toBeDefined();
      expect(stack.applicationTierConstruct).toBeDefined();
      expect(stack.databaseTierConstruct).toBeDefined();
      expect(stack.monitoringConstruct).toBeDefined();
    });

    test('should handle invalid environment suffix by defaulting to dev', () => {
      const invalidApp = new cdk.App({
        context: {
          environmentSuffix: 'invalid'
        }
      });
      
      // Should not throw error, but default to 'dev'
      expect(() => {
        new TapStack(invalidApp, 'InvalidStack');
      }).not.toThrow();
      
      // Verify the stack was created successfully
      const invalidStack = new TapStack(invalidApp, 'InvalidStack2');
      expect(invalidStack).toBeDefined();
    });

    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('should handle missing region configuration gracefully', () => {
      const unknownRegionApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      
      expect(() => {
        new TapStack(unknownRegionApp, 'UnknownRegionStack', {
          env: { region: 'unknown-region' }
        });
      }).not.toThrow();
    });

    test('should handle different regions with appropriate CIDR blocks', () => {
      // Test us-east-1 configuration
      const eastApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      const eastStack = new TapStack(eastApp, 'EastStack', {
        env: { region: 'us-east-1' }
      });
      const eastTemplate = Template.fromStack(eastStack);
      
      eastTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16'
      });

      // Test us-west-2 configuration
      const westApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      const westStack = new TapStack(westApp, 'WestStack', {
        env: { region: 'us-west-2' }
      });
      const westTemplate = Template.fromStack(westStack);
      
      westTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16'
      });
    });

    test('should validate all environment suffixes correctly', () => {
      const validEnvironments = ['dev', 'staging', 'prod'];
      
      validEnvironments.forEach(env => {
        const validApp = new cdk.App({
          context: { environmentSuffix: env }
        });
        
        expect(() => {
          new TapStack(validApp, 'ValidStack');
        }).not.toThrow();
      });
    });
  });

  describe('Core Infrastructure Components', () => {
    test('should create VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('should create public and private subnets', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'SubnetType',
            Value: 'Public'
          }
        ])
      });

      template.hasResourceProperties('AWS::EC2::Subnet', {
        Tags: Match.arrayWith([
          {
            Key: 'SubnetType',
            Value: 'Private'
          }
        ])
      });
    });

    test('should create Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('should create Auto Scaling Group with correct configuration', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '10',
        DesiredCapacity: '3',
        HealthCheckType: 'ELB'
      });
    });

    test('should create RDS database instance with security features', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        EngineVersion: '8.0.37',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        MultiAZ: true,
        StorageEncrypted: true,
        DeletionProtection: true,
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: false,
        EnablePerformanceInsights: false
      });
    });

    test('should create CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {});
    });

    test('should create SNS topic for alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {});
    });
  });

  describe('Security and IAM', () => {
    test('should create security groups for different tiers', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer - allows HTTP/HTTPS from internet'
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application EC2 instances - allows traffic from ALB'
      });

      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database - allows MySQL/Aurora access from application tier'
      });
    });

    test('should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Description: 'IAM role for EC2 instances in the application tier'
      });
    });

    test('should create IAM instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {});
    });

    test('should create Network ACLs', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAcl', {});
    });

    test('should create VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 731
      });
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should create CloudWatch alarms for critical metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'HTTPCode_ELB_5XX_Count',
        Namespace: 'AWS/ApplicationELB'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/RDS'
      });

      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'FreeStorageSpace',
        Namespace: 'AWS/RDS'
      });
    });

    test('should create CloudWatch log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should create all required outputs', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name'
      });

      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint'
      });

      template.hasOutput('VPCID', {
        Description: 'VPC ID'
      });

      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL'
      });

      template.hasOutput('AlertTopicARN', {
        Description: 'SNS Topic ARN for alerts'
      });
    });
  });

  describe('Tagging and Resource Management', () => {
    test('should apply comprehensive tags to resources', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Environment',
            Value: 'dev'
          },
          {
            Key: 'Project',
            Value: 'MultiRegionApp'
          }
        ])
      });
    });

    test('should tag resources with region information', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          {
            Key: 'Region',
            Value: 'us-east-1'
          }
        ])
      });
    });
  });

  describe('Resource Dependencies and Counts', () => {
    test('should create expected number of security groups', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeGreaterThanOrEqual(3);
    });

    test('should create expected number of subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBeGreaterThanOrEqual(6);
    });

    test('should create expected number of CloudWatch alarms', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThanOrEqual(4);
    });

    test('should have proper dependencies between resources', () => {
      const vpcResources = template.findResources('AWS::EC2::VPC');
      const subnetResources = template.findResources('AWS::EC2::Subnet');
      
      expect(Object.keys(vpcResources).length).toBe(1);
      expect(Object.keys(subnetResources).length).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases and Error Handling', () => {
    test('should handle null region gracefully', () => {
      const nullRegionApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      
      expect(() => {
        new TapStack(nullRegionApp, 'NullRegionStack', {
          env: { region: undefined as any }
        });
      }).not.toThrow();
    });

    test('should handle empty context gracefully', () => {
      const emptyContextApp = new cdk.App({});
      
      expect(() => {
        new TapStack(emptyContextApp, 'EmptyContextStack');
      }).not.toThrow();
    });

    test('should handle undefined stack props', () => {
      const undefinedPropsApp = new cdk.App({
        context: { environmentSuffix: 'dev' }
      });
      
      expect(() => {
        new TapStack(undefinedPropsApp, 'UndefinedPropsStack', undefined);
      }).not.toThrow();
    });
  });
});

