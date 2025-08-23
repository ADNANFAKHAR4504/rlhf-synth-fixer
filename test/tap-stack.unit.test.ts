import fs from 'fs';
import path from 'path';
import { CloudFormation } from '@aws-sdk/client-cloudformation';

// Mock AWS SDK
jest.mock('@aws-sdk/client-cloudformation');

describe('TapStack Unit Tests', () => {
  let templateContent: string;
  let templatePath: string;

  beforeAll(() => {
    templatePath = path.join(__dirname, '../lib/TapStack.yml');
    templateContent = fs.readFileSync(templatePath, 'utf8');
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation template format', () => {
      expect(templateContent).toBeDefined();
      expect(templateContent).toContain('AWSTemplateFormatVersion: \'2010-09-09\'');
      expect(templateContent).toContain('Description:');
      expect(templateContent).toContain('Parameters:');
      expect(templateContent).toContain('Resources:');
      expect(templateContent).toContain('Outputs:');
    });

    test('should have required parameters', () => {
      expect(templateContent).toContain('SSHAllowedCIDR:');
      expect(templateContent).toContain('InstanceType:');
      expect(templateContent).toContain('Type: String');
      expect(templateContent).toContain('Default: \'0.0.0.0/0\'');
      expect(templateContent).toContain('Default: \'t3.micro\'');
      expect(templateContent).toContain('AllowedPattern:');
      expect(templateContent).toContain('AllowedValues:');
    });
  });

  describe('VPC and Networking Resources', () => {
    test('should have VPC with correct configuration', () => {
      expect(templateContent).toContain('VPC:');
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
      expect(templateContent).toContain('CidrBlock: 10.0.0.0/16');
      expect(templateContent).toContain('EnableDnsHostnames: true');
      expect(templateContent).toContain('EnableDnsSupport: true');
      expect(templateContent).toContain('Value: WebApp-VPC');
      expect(templateContent).toContain('Value: WebApp');
    });

    test('should have Internet Gateway', () => {
      expect(templateContent).toContain('InternetGateway:');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
      expect(templateContent).toContain('Value: WebApp-IGW');
    });

    test('should have public subnets in different AZs', () => {
      expect(templateContent).toContain('PublicSubnet1:');
      expect(templateContent).toContain('PublicSubnet2:');
      expect(templateContent).toContain('Type: AWS::EC2::Subnet');
      expect(templateContent).toContain('CidrBlock: 10.0.1.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.2.0/24');
      expect(templateContent).toContain('MapPublicIpOnLaunch: true');
      expect(templateContent).toContain('!Select [0, !GetAZs');
      expect(templateContent).toContain('!Select [1, !GetAZs');
    });

    test('should have private subnets in different AZs', () => {
      expect(templateContent).toContain('PrivateSubnet1:');
      expect(templateContent).toContain('PrivateSubnet2:');
      expect(templateContent).toContain('CidrBlock: 10.0.11.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.12.0/24');
      expect(templateContent).toContain('Value: WebApp-Private-Subnet-AZ1');
      expect(templateContent).toContain('Value: WebApp-Private-Subnet-AZ2');
    });

    test('should have NAT Gateway in public subnet', () => {
      expect(templateContent).toContain('NatGateway1:');
      expect(templateContent).toContain('Type: AWS::EC2::NatGateway');
      expect(templateContent).toContain('SubnetId: !Ref PublicSubnet1');
      expect(templateContent).toContain('AllocationId: !GetAtt NatGateway1EIP.AllocationId');
    });
  });

  describe('Template Content Validation', () => {
    test('should contain all required AWS resources', () => {
      // VPC and Networking
      expect(templateContent).toContain('Type: AWS::EC2::VPC');
      expect(templateContent).toContain('Type: AWS::EC2::InternetGateway');
      expect(templateContent).toContain('Type: AWS::EC2::Subnet');
      expect(templateContent).toContain('Type: AWS::EC2::NatGateway');
      
      // Security Groups
      expect(templateContent).toContain('Type: AWS::EC2::SecurityGroup');
      expect(templateContent).toContain('ALBSecurityGroup:');
      expect(templateContent).toContain('WebServerSecurityGroup:');
      
      // Load Balancer
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::LoadBalancer');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::TargetGroup');
      expect(templateContent).toContain('Type: AWS::ElasticLoadBalancingV2::Listener');
      
      // Auto Scaling
      expect(templateContent).toContain('Type: AWS::AutoScaling::AutoScalingGroup');
      expect(templateContent).toContain('Type: AWS::AutoScaling::ScalingPolicy');
      expect(templateContent).toContain('Type: AWS::EC2::LaunchTemplate');
      
      // CloudWatch
      expect(templateContent).toContain('Type: AWS::CloudWatch::Alarm');
      
      // IAM
      expect(templateContent).toContain('Type: AWS::IAM::Role');
      expect(templateContent).toContain('Type: AWS::IAM::InstanceProfile');
    });

    test('should have correct configuration values', () => {
      // VPC CIDR
      expect(templateContent).toContain('CidrBlock: 10.0.0.0/16');
      
      // Subnet CIDRs
      expect(templateContent).toContain('CidrBlock: 10.0.1.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.2.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.11.0/24');
      expect(templateContent).toContain('CidrBlock: 10.0.12.0/24');
      
      // Auto Scaling Group settings
      expect(templateContent).toContain('MinSize: 2');
      expect(templateContent).toContain('MaxSize: 6');
      expect(templateContent).toContain('DesiredCapacity: 2');
      
      // Security Group ports
      expect(templateContent).toContain('FromPort: 80');
      expect(templateContent).toContain('ToPort: 80');
      expect(templateContent).toContain('FromPort: 22');
      expect(templateContent).toContain('ToPort: 22');
    });

    test('should have consistent tagging', () => {
      expect(templateContent).toContain('Key: Project');
      expect(templateContent).toContain('Value: WebApp');
      expect(templateContent).toContain('Key: Name');
    });

    test('should have proper outputs', () => {
      expect(templateContent).toContain('Outputs:');
      expect(templateContent).toContain('VPCId:');
      expect(templateContent).toContain('LoadBalancerURL:');
      expect(templateContent).toContain('LoadBalancerDNS:');
      expect(templateContent).toContain('Description: ID of the VPC');
      expect(templateContent).toContain('Description: URL of the Application Load Balancer');
      expect(templateContent).toContain('Description: DNS name of the Application Load Balancer');
    });

    test('should have valid YAML structure', () => {
      // Basic YAML structure validation - should be a substantial template
      expect(templateContent.split('\n').length).toBeGreaterThan(400);
      
      // Check for proper indentation (no tabs)
      expect(templateContent).not.toContain('\t');
      
      // Check for CloudFormation intrinsic functions
      expect(templateContent).toContain('!Ref');
      expect(templateContent).toContain('!GetAtt');
      expect(templateContent).toContain('!Sub');
      
      // Check for CloudFormation dynamic references (valid syntax)
      expect(templateContent).toContain('{{resolve:ssm:');
    });
  });
});
