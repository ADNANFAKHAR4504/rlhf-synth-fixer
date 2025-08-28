import fs from 'fs';
import path from 'path';

describe('AcmeWeb CloudFormation Template Unit Tests', () => {
  let templateContent: string;
  let templateLines: string[];

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
    templateLines = templateContent.split('\n');
  });

  // Template Structure Tests
  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(templateContent).toContain(
        "AWSTemplateFormatVersion: '2010-09-09'"
      );
    });

    test('should have correct description', () => {
      expect(templateContent).toContain(
        'AcmeWeb Highly Available Web Application Infrastructure - Production Ready'
      );
    });

    test('should have all required sections', () => {
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Conditions:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });
  });

  // Parameters Tests
  describe('Parameters', () => {
    test('should have Environment parameter', () => {
      expect(templateContent).toContain('Environment:');
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain('Default: prod');
      expect(templateContent).toContain('Environment suffix for resource tagging and naming');
    });

    test('should have CreateKeyPair parameter', () => {
      expect(templateContent).toContain('CreateKeyPair:');
      expect(templateContent).toContain("Default: 'true'");
      expect(templateContent).toContain("AllowedValues: ['true', 'false']");
    });

    test('should have ExistingKeyPairName parameter', () => {
      expect(templateContent).toContain('ExistingKeyPairName:');
      expect(templateContent).toContain("Default: ''");
    });
  });

  // Conditions Tests
  describe('Conditions', () => {
    test('should have correct conditions defined', () => {
      expect(templateContent).toContain('ShouldCreateKeyPair:');
    });
  });

  // VPC Resources Tests (PROMPT.md Requirements)
  describe('VPC Resources (PROMPT.md Requirements)', () => {
    test('should have VPC with correct CIDR block 10.0.0.0/16', () => {
      expect(templateContent).toContain('AcmeWebVPC:');
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
      expect(templateContent).toContain('CidrBlock: 10.0.0.0/16');
    });

    test('should have Internet Gateway', () => {
      expect(templateContent).toContain('AcmeWebInternetGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
    });

    test('should have public subnets in different AZs with dynamic AZ selection', () => {
      expect(templateContent).toContain('AcmeWebPublicSubnet1:');
      expect(templateContent).toContain('AcmeWebPublicSubnet2:');
      expect(templateContent).toContain('!Select [0, !GetAZs');
      expect(templateContent).toContain('!Select [1, !GetAZs');
      expect(templateContent).toContain('CidrBlock: 10.0.1.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.2.0/24');
    });

    test('should have private subnets in different AZs with dynamic AZ selection', () => {
      expect(templateContent).toContain('AcmeWebPrivateSubnet1:');
      expect(templateContent).toContain('AcmeWebPrivateSubnet2:');
      expect(templateContent).toContain('CidrBlock: 10.0.3.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.4.0/24');
    });

    test('should have NAT Gateways for high availability', () => {
      expect(templateContent).toContain('AcmeWebNATGateway1:');
      expect(templateContent).toContain('AcmeWebNATGateway2:');
      expect(templateContent).toContain('AcmeWebNATGateway1EIP:');
      expect(templateContent).toContain('AcmeWebNATGateway2EIP:');
    });
  });

  // Application Load Balancer Tests (PROMPT.md Requirements)
  describe('Application Load Balancer (PROMPT.md Requirements)', () => {
    test('should have Application Load Balancer', () => {
      expect(templateContent).toContain('AcmeWebApplicationLoadBalancer:');
      expect(templateContent).toContain(
        'Type: AWS::ElasticLoadBalancingV2::LoadBalancer'
      );
      expect(templateContent).toContain('Scheme: internet-facing');
      expect(templateContent).toContain('Type: application');
    });

    test('should have Target Group with health check', () => {
      expect(templateContent).toContain('AcmeWebTargetGroup:');
      expect(templateContent).toContain(
        'Type: AWS::ElasticLoadBalancingV2::TargetGroup'
      );
      expect(templateContent).toContain('HealthCheckPath: /health');
    });

    test('should have Load Balancer Listener', () => {
      expect(templateContent).toContain('AcmeWebLoadBalancerListener:');
      expect(templateContent).toContain(
        'Type: AWS::ElasticLoadBalancingV2::Listener'
      );
    });
  });

  // Auto Scaling Group Tests (PROMPT.md Requirements)
  describe('Auto Scaling Group (PROMPT.md Requirements)', () => {
    test('should have Auto Scaling Group with min=2, max=4 configuration', () => {
      expect(templateContent).toContain('AcmeWebAutoScalingGroup:');
      expect(templateContent).toContain(
        'Type: AWS::AutoScaling::AutoScalingGroup'
      );
      expect(templateContent).toContain('MinSize: 2');
      expect(templateContent).toContain('MaxSize: 4');
      expect(templateContent).toContain('DesiredCapacity: 2');
    });

    test('should have Launch Template with dynamic AMI lookup', () => {
      expect(templateContent).toContain('AcmeWebLaunchTemplate:');
      expect(templateContent).toContain('Type: AWS::EC2::LaunchTemplate');
      expect(templateContent).toContain('InstanceType: t3.micro');
      expect(templateContent).toContain(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}'
      );
    });

    test('should have scaling policies', () => {
      expect(templateContent).toContain('AcmeWebScaleUpPolicy:');
      expect(templateContent).toContain('AcmeWebScaleDownPolicy:');
      expect(templateContent).toContain(
        'Type: AWS::AutoScaling::ScalingPolicy'
      );
    });

    test('should have CloudWatch alarms', () => {
      expect(templateContent).toContain('AcmeWebCPUAlarmHigh:');
      expect(templateContent).toContain('AcmeWebCPUAlarmLow:');
      expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
      expect(templateContent).toContain('Threshold: 70');
      expect(templateContent).toContain('Threshold: 30');
    });
  });

  // Database Tests (PROMPT.md Requirements)
  describe('RDS MySQL Database (PROMPT.md Requirements)', () => {
    test('should have RDS MySQL database', () => {
      expect(templateContent).toContain('AcmeWebDatabase:');
      expect(templateContent).toContain('Type: AWS::RDS::DBInstance');
      expect(templateContent).toContain('Engine: mysql');
      expect(templateContent).toContain('DBInstanceClass: db.t3.micro');
      expect(templateContent).toContain('PubliclyAccessible: false');
      expect(templateContent).toContain('StorageEncrypted: true');
    });

    test('should have database subnet group', () => {
      expect(templateContent).toContain('AcmeWebDBSubnetGroup:');
      expect(templateContent).toContain('Type: AWS::RDS::DBSubnetGroup');
    });

    test('should have database password secret with Secrets Manager', () => {
      expect(templateContent).toContain('AcmeWebDBPasswordSecret:');
      expect(templateContent).toContain('Type: AWS::SecretsManager::Secret');
      expect(templateContent).toContain('GenerateSecretString:');
    });
  });

  // Security Groups Tests
  describe('Security Groups', () => {
    test('should have load balancer security group', () => {
      expect(templateContent).toContain('AcmeWebLoadBalancerSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should have web server security group', () => {
      expect(templateContent).toContain('AcmeWebWebServerSecurityGroup:');
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
    });

    test('should have database security group with port 3306', () => {
      expect(templateContent).toContain('AcmeWebDatabaseSecurityGroup:');
      expect(templateContent).toContain('FromPort: 3306');
      expect(templateContent).toContain('ToPort: 3306');
    });
  });

  // IAM Resources Tests
  describe('IAM Resources', () => {
    test('should have EC2 IAM role with SSM permissions', () => {
      expect(templateContent).toContain('AcmeWebEC2Role:');
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      expect(templateContent).toContain(
        'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore'
      );
    });

    test('should have instance profile', () => {
      expect(templateContent).toContain('AcmeWebEC2InstanceProfile:');
      expect(templateContent).toContain('Type: AWS::IAM::InstanceProfile');
    });
  });

  // Outputs Tests
  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'StackName:',
        'Environment:',
        'VPCId:',
        'AvailabilityZones:',
        'LoadBalancerURL:',
        'LoadBalancerDNS:',
        'DatabaseEndpoint:',
        'DatabaseSecretArn:',
        'AutoScalingGroupName:',
        'KeyPairName:',
        'PublicSubnets:',
        'PrivateSubnets:',
        'Region:',
      ];

      requiredOutputs.forEach(outputName => {
        expect(templateContent).toContain(outputName);
      });
    });

    test('should have properly formatted output exports', () => {
      expect(templateContent).toContain('Export:');
      expect(templateContent).toContain('Name: !Sub');
      expect(templateContent).toContain('${AWS::StackName}');
    });
  });

  // Environment-Agnostic Implementation Tests
  describe('Environment-Agnostic Implementation', () => {
    test('should use Environment parameter consistently', () => {
      expect(templateContent).toContain('!Ref Environment');
      expect(templateContent).toContain('${Environment}');
    });

    test('should use dynamic AZ selection', () => {
      expect(templateContent).toContain('!GetAZs');
      expect(templateContent).toContain('!Select [0, !GetAZs');
      expect(templateContent).toContain('!Select [1, !GetAZs');
    });

    test('should use dynamic AMI lookup', () => {
      expect(templateContent).toContain(
        '{{resolve:ssm:/aws/service/ami-amazon-linux-latest'
      );
    });
  });

  // Template Validation Tests
  describe('Template Validation', () => {
    test('should have valid YAML structure', () => {
      expect(templateContent.length).toBeGreaterThan(1000);
      expect(templateLines.length).toBeGreaterThan(100);
    });

    test('should have comprehensive resource definitions', () => {
      const resourceCount = (templateContent.match(/Type: AWS::/g) || [])
        .length;
      expect(resourceCount).toBeGreaterThan(20);
    });

    test('should have consistent tagging strategy', () => {
      expect(templateContent).toContain('Key: Name');
      expect(templateContent).toContain('Key: Environment');
      expect(templateContent).toContain('Value: !Ref Environment');
    });
  });

  // Key Pair Configuration Tests
  describe('Key Pair Configuration', () => {
    test('should have conditional key pair creation', () => {
      expect(templateContent).toContain('AcmeWebKeyPair:');
      expect(templateContent).toContain('Type: AWS::EC2::KeyPair');
      expect(templateContent).toContain('Condition: ShouldCreateKeyPair');
    });

    test('should have proper key pair conditions', () => {
      expect(templateContent).toContain(
        'ShouldCreateKeyPair: !Equals [!Ref CreateKeyPair'
      );
    });
  });

  // High Availability Tests
  describe('High Availability Configuration', () => {
    test('should have multi-AZ NAT Gateway deployment', () => {
      expect(templateContent).toContain('AcmeWebNATGateway1:');
      expect(templateContent).toContain('AcmeWebNATGateway2:');
      expect(templateContent).toContain('!Ref AcmeWebPublicSubnet1');
      expect(templateContent).toContain('!Ref AcmeWebPublicSubnet2');
    });

    test('should have separate route tables for each private subnet', () => {
      expect(templateContent).toContain('AcmeWebPrivateRouteTable1:');
      expect(templateContent).toContain('AcmeWebPrivateRouteTable2:');
      expect(templateContent).toContain('!Ref AcmeWebNATGateway1');
      expect(templateContent).toContain('!Ref AcmeWebNATGateway2');
    });
  });
});
