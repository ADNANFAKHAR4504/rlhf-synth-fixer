import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;
  const environmentSuffix = 'testenv';

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });
  
  describe('Stack Initialization', () => {
    test('creates stack without environment suffix', () => {
      const appNoSuffix = new cdk.App();
      const stackNoSuffix = new TapStack(appNoSuffix, 'TestTapStackNoSuffix', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const templateNoSuffix = Template.fromStack(stackNoSuffix);
      
      // Should use default 'dev' suffix
      templateNoSuffix.hasOutput('EnvironmentSuffix', {
        Value: 'dev',
      });
    });
    
    test('creates stack with context environment suffix', () => {
      const appWithContext = new cdk.App({
        context: {
          environmentSuffix: 'contextenv',
        },
      });
      const stackWithContext = new TapStack(appWithContext, 'TestTapStackContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      const templateWithContext = Template.fromStack(stackWithContext);
      
      // Should use context suffix
      templateWithContext.hasOutput('EnvironmentSuffix', {
        Value: 'contextenv',
      });
    });
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates public and private subnets across 2 AZs', () => {
      // Check for 2 public subnets
      template.resourceCountIs('AWS::EC2::Subnet', 6); // 2 public, 2 private, 2 database
      
      // Verify public subnets exist
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(
        (subnet: any) => subnet.Properties?.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBe(2);
      
      // Verify private subnets exist
      const privateSubnets = Object.values(subnets).filter(
        (subnet: any) => subnet.Properties?.MapPublicIpOnLaunch === false
      );
      expect(privateSubnets.length).toBe(4); // 2 private + 2 database
    });

    test('creates NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
      template.resourceCountIs('AWS::EC2::EIP', 2);
    });

    test('creates Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates security group for ALB', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          }),
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          }),
        ]),
      });
    });

    test('creates security group for EC2 instances', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('creates security group for RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
      });
    });

    test('allows MySQL traffic from EC2 to RDS', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'Allow MySQL from EC2 instances',
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates internet-facing ALB', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('creates ALB listener for HTTP', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });

    test('creates target group with health checks', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
        Port: 80,
        Protocol: 'HTTP',
        TargetType: 'instance',
        HealthCheckPath: '/',
        HealthCheckIntervalSeconds: 30,
        HealthyThresholdCount: 2,
        UnhealthyThresholdCount: 5,
      });
    });
  });

  describe('Auto Scaling', () => {
    test('creates launch template with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
          UserData: Match.anyValue(),
        }),
      });
    });

    test('creates Auto Scaling Group with correct capacity', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('creates CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          TargetValue: 70,
        }),
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance with correct configuration', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'mysql',
        DBInstanceClass: 'db.t3.micro',
        AllocatedStorage: '20',
        MaxAllocatedStorage: 100,
      });
      // Note: MultiAZ is conditional based on environment (disabled for LocalStack)
    });

    test('enables automated backups', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        BackupRetentionPeriod: 7,
        DeleteAutomatedBackups: true,
      });
    });

    test('does not have deletion protection for destroyability', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        DeletionProtection: false,
      });
    });

    test('creates RDS subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });
  });

  describe('IAM Roles', () => {
    test('creates IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                Service: 'ec2.amazonaws.com',
              }),
              Action: 'sts:AssumeRole',
            }),
          ]),
        }),
      });
    });

    test('attaches CloudWatch and S3 policies', () => {
      const roles = template.findResources('AWS::IAM::Role');
      const ec2Role = Object.values(roles).find(
        (role: any) => role.Properties?.AssumeRolePolicyDocument?.Statement?.some(
          (stmt: any) => stmt.Principal?.Service === 'ec2.amazonaws.com'
        )
      );
      
      expect(ec2Role).toBeDefined();
      expect(ec2Role?.Properties?.ManagedPolicyArns).toBeDefined();
      expect(ec2Role?.Properties?.ManagedPolicyArns.length).toBe(2);
      
      // Check that policies are referenced (as Fn::Join objects)
      const policies = ec2Role?.Properties?.ManagedPolicyArns;
      const policiesAsString = JSON.stringify(policies);
      expect(policiesAsString).toContain('CloudWatchAgentServerPolicy');
      expect(policiesAsString).toContain('AmazonS3ReadOnlyAccess');
    });

    test('creates instance profile', () => {
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
    });
  });

  describe('Resource Naming', () => {
    test('uses environment suffix in resource names', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
          }),
        ]),
      });
    });

    test('security groups have environment suffix', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp(`.*${environmentSuffix}.*`),
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports LoadBalancer DNS', () => {
      template.hasOutput('LoadBalancerDNS', {
        Description: 'Application Load Balancer DNS name',
      });
    });

    test('exports Database Endpoint', () => {
      template.hasOutput('DatabaseEndpoint', {
        Description: 'RDS database endpoint',
      });
    });

    test('exports VPC ID', () => {
      template.hasOutput('VPCId', {
        Description: 'VPC ID',
      });
    });

    test('exports Auto Scaling Group name', () => {
      template.hasOutput('AutoScalingGroupName', {
        Description: 'Auto Scaling Group name',
      });
    });

    test('exports Environment Suffix', () => {
      template.hasOutput('EnvironmentSuffix', {
        Description: 'Environment suffix used for resource naming',
      });
    });
  });

  describe('High Availability', () => {
    test('resources span multiple availability zones', () => {
      // Check subnets in different AZs
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set();
      
      Object.values(subnets).forEach(subnet => {
        if (subnet.Properties?.AvailabilityZone) {
          azs.add(subnet.Properties.AvailabilityZone);
        }
      });
      
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('NAT gateways provide redundancy', () => {
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBe(2);
    });
  });
});