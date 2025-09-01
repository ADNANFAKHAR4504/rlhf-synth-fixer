// test/secure-vpc-stack.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as AWS from 'aws-sdk';
import { SecureVpcStack } from '../lib/secure-vpc-stack';

describe('SecureVpcStack', () => {
  let template: Template;
  let stack: SecureVpcStack;

  beforeAll(() => {
    const app = new cdk.App();
    stack = new SecureVpcStack(app, 'TestStack', {
      env: { region: 'us-west-2' },
      vpcCidr: '10.0.0.0/16',
      allowedSshCidr: '203.0.113.0/24',
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Public and Private subnets are created', () => {
    // Check for public subnets
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
    
    // Verify public subnets have MapPublicIpOnLaunch
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('Internet Gateway is created and attached', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {});
    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
      VpcId: Match.anyValue(),
      InternetGatewayId: Match.anyValue(),
    });
  });

  test('NAT Gateway is created', () => {
    template.hasResourceProperties('AWS::EC2::NatGateway', {
      AllocationId: Match.anyValue(),
      SubnetId: Match.anyValue(),
    });
  });

  test('Route tables are configured correctly', () => {
    // Public route table with IGW route
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      GatewayId: Match.anyValue(),
    });

    // Private route table with NAT Gateway route
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
      NatGatewayId: Match.anyValue(),
    });
  });

  test('EC2 instances are created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
      IamInstanceProfile: Match.anyValue(),
      SecurityGroupIds: Match.anyValue(),
      Monitoring: true, // Detailed monitoring enabled
    });
  });

  test('Security Group has correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: [
        {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '203.0.113.0/24',
        },
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0',
        },
      ],
    });
  });

  test('IAM Role has correct policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
    });

    // Check for S3 access policy
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });

  test('CloudWatch Alarms are created', () => {
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/EC2',
      Statistic: 'Average',
      Threshold: 70,
      ComparisonOperator: 'GreaterThanThreshold',
    });
  });

  test('SNS Topic is created for alerts', () => {
    template.hasResourceProperties('AWS::SNS::Topic', {
      DisplayName: 'CPU Usage Alerts',
    });
  });

  test('CloudWatch Log Group has correct retention', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/ec2/secure-vpc',
      RetentionInDays: 30,
    });
  });

  test('Elastic IPs are created', () => {
    template.hasResourceProperties('AWS::EC2::EIP', {
      Domain: 'vpc',
    });
  });

  test('SSM Parameter is created', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/secure-vpc/vpc-id',
      Type: 'String',
    });
  });

  test('Stack outputs are defined', () => {
    const outputs = template.findOutputs('*');
    expect(outputs).toHaveProperty('VPCId');
    expect(outputs).toHaveProperty('PublicSubnetIds');
    expect(outputs).toHaveProperty('PrivateSubnetIds');
    expect(outputs).toHaveProperty('NATGatewayId');
  });

  test('All resources have required tags', () => {
    const resources = template.findResources('AWS::EC2::VPC');
    Object.values(resources).forEach((resource: any) => {
      expect(resource.Properties?.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'Production' }),
          expect.objectContaining({ Key: 'Project', Value: 'SecureVPC' }),
        ])
      );
    });
  });
});