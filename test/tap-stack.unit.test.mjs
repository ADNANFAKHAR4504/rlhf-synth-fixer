import { App } from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new App();
    stack = new TapStack(app, `TapStack${environmentSuffix}`, {
      environmentSuffix: environmentSuffix
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates 3 different subnet types across multiple AZs', () => {
      // Check total subnet count (should be at least 3 subnets for different types)
      const allSubnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(allSubnets).length).toBeGreaterThanOrEqual(3);
      
      // Check for public subnets (with MapPublicIpOnLaunch)
      const publicSubnets = Object.values(allSubnets).filter(subnet => 
        subnet.Properties?.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBeGreaterThanOrEqual(1);
      
      // Check that we have subnets across multiple AZs
      const azs = new Set();
      Object.values(allSubnets).forEach(subnet => {
        if (subnet.Properties?.AvailabilityZone) {
          azs.add(subnet.Properties.AvailabilityZone);
        }
      });
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('creates NAT gateways for private subnets', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });

    test('creates Internet Gateway', () => {
      template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('creates Auto Scaling Group with minimum 2 instances', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2'
      });
    });

    test('configures health check for ASG', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckGracePeriod: Match.anyValue(),
        HealthCheckType: 'ELB'
      });
    });

    test('creates launch template for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          InstanceType: 't3.micro',
          Monitoring: {
            Enabled: true
          }
        }
      });
    });

    test('creates scaling policies', () => {
      template.resourceCountIs('AWS::AutoScaling::ScalingPolicy', 2);
    });
  });

  describe('Load Balancer Configuration', () => {
    test('creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing'
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        HealthCheckIntervalSeconds: 30,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 3,
        HealthCheckPath: '/'
      });
    });

    test('creates ALB listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP'
      });
    });
  });

  describe('RDS Database Configuration', () => {
    test('creates RDS MySQL instance with Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        MultiAZ: true,
        DBInstanceClass: 'db.t3.micro'
      });
    });

    test('creates database subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.anyValue()
      });
    });

    test('enables backup retention', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7
      });
    });

    test('disables deletion protection for cleanup', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false
      });
    });

    test('creates database credentials in Secrets Manager', () => {
      template.hasResourceProperties('AWS::SecretsManager::Secret', {
        GenerateSecretString: {
          SecretStringTemplate: '{"username":"admin"}',
          GenerateStringKey: 'password'
        }
      });
    });
  });

  describe('IAM Configuration', () => {
    test('creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [{
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            },
            Action: 'sts:AssumeRole'
          }]
        }
      });
    });

    test('grants S3 read access to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetObject*']),
              Resource: Match.anyValue()
            })
          ])
        }
      });
    });

    test('attaches CloudWatch agent policy', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(role => 
        role.Properties?.AssumeRolePolicyDocument?.Statement?.[0]?.Principal?.Service === 'ec2.amazonaws.com'
      );
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role.Properties.ManagedPolicyArns).toBeDefined();
      
      // Check if CloudWatch policy is attached
      const hasCloudWatchPolicy = ec2Role.Properties.ManagedPolicyArns.some(arn => {
        if (typeof arn === 'string') {
          return arn.includes('CloudWatchAgentServerPolicy');
        } else if (arn['Fn::Join']) {
          const joinParts = arn['Fn::Join'][1];
          return joinParts.some(part => 
            typeof part === 'string' && part.includes('CloudWatchAgentServerPolicy')
          );
        }
        return false;
      });
      
      expect(hasCloudWatchPolicy).toBe(true);
    });
  });

  describe('S3 Configuration', () => {
    test('creates S3 bucket for static content', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('enables auto-deletion for S3 bucket', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('Security Groups', () => {
    test('creates security group for ALB', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(sgResources).find(sg => 
        sg.Properties?.GroupDescription?.includes('Application Load Balancer')
      );
      expect(albSg).toBeDefined();
    });

    test('creates security group for EC2 instances', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const ec2Sg = Object.values(sgResources).find(sg => 
        sg.Properties?.GroupDescription?.includes('EC2 instances')
      );
      expect(ec2Sg).toBeDefined();
    });

    test('creates security group for RDS', () => {
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const rdsSg = Object.values(sgResources).find(sg => 
        sg.Properties?.GroupDescription?.includes('RDS MySQL')
      );
      expect(rdsSg).toBeDefined();
    });

    test('ALB security group allows HTTP and HTTPS', () => {
      // Check that ALB security group exists with proper ingress rules
      const sgResources = template.findResources('AWS::EC2::SecurityGroup');
      const albSg = Object.values(sgResources).find(sg => 
        sg.Properties?.GroupDescription?.includes('Application Load Balancer')
      );
      
      expect(albSg).toBeDefined();
      expect(albSg.Properties.SecurityGroupIngress).toBeDefined();
      expect(albSg.Properties.SecurityGroupIngress.length).toBeGreaterThanOrEqual(2);
      
      // Check for HTTP rule
      const httpRule = albSg.Properties.SecurityGroupIngress.find(rule => 
        rule.IpProtocol === 'tcp' && rule.FromPort === 80
      );
      expect(httpRule).toBeDefined();
      expect(httpRule.CidrIp).toBe('0.0.0.0/0');
      
      // Check for HTTPS rule
      const httpsRule = albSg.Properties.SecurityGroupIngress.find(rule => 
        rule.IpProtocol === 'tcp' && rule.FromPort === 443
      );
      expect(httpsRule).toBeDefined();
      expect(httpsRule.CidrIp).toBe('0.0.0.0/0');
    });
  });

  describe('Monitoring and Logging', () => {
    test('creates CloudWatch log group', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        RetentionInDays: 7
      });
    });

    test('creates CloudWatch dashboard', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: Match.stringLikeRegexp('tap-.*-webapp-dashboard')
      });
    });

    test('creates CPU alarms for Auto Scaling Group', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const asgCpuAlarm = Object.values(alarms).find(alarm => 
        alarm.Properties?.Threshold === 75 &&
        alarm.Properties?.AlarmDescription?.includes('Auto Scaling Group')
      );
      expect(asgCpuAlarm).toBeDefined();
    });

    test('creates CPU alarm for RDS', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const rdsCpuAlarm = Object.values(alarms).find(alarm => 
        alarm.Properties?.Threshold === 80 &&
        alarm.Properties?.AlarmDescription?.includes('RDS')
      );
      expect(rdsCpuAlarm).toBeDefined();
    });

    test('enables CloudWatch logs for RDS', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        EnableCloudwatchLogsExports: Match.arrayWith(['error', 'general'])
      });
    });
  });

  describe('Tagging', () => {
    test('applies Environment tag to resources', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production'
          })
        ])
      });
    });

    test('applies EnvironmentSuffix tag to resources', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'EnvironmentSuffix',
            Value: environmentSuffix
          })
        ])
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports Load Balancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'DNS name of the Application Load Balancer',
        Export: {
          Name: `LoadBalancerDNS-${environmentSuffix}`
        }
      });
    });

    test('exports Database endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS MySQL database endpoint',
        Export: {
          Name: `DatabaseEndpoint-${environmentSuffix}`
        }
      });
    });

    test('exports S3 bucket name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 bucket for static content',
        Export: {
          Name: `S3BucketName-${environmentSuffix}`
        }
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        Export: {
          Name: `VpcId-${environmentSuffix}`
        }
      });
    });

    test('exports Dashboard URL', () => {
      template.hasOutput('DashboardURL', {
        Description: 'CloudWatch Dashboard URL',
        Export: {
          Name: `DashboardURL-${environmentSuffix}`
        }
      });
    });
  });
});