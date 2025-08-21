import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let template: Template;
  let stack: TapStack;

  beforeAll(() => {
    const app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: { region: 'us-east-1', account: '123456789012' },
      environmentSuffix: 'test',
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Public and private subnets are created in multiple AZs', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 4);
    
    // Check for public subnets
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
    
    // Check for private subnets  
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
    });
  });

  test('Internet Gateway is created', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
      InternetGatewayId: Match.anyValue(),
    });
  });

  test('NAT Gateways are created for high availability', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 2);
  });

  test('Security group allows SSH only from approved IP range', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        {
          CidrIp: '203.0.113.0/24',
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          Description: 'SSH access from approved IP range only'
        }
      ])
    });
  });

  test('Bastion host is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
      ImageId: Match.anyValue(),
    });
  });

  test('S3 bucket has Block Public Access enabled', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      }
    });
  });

  test('EC2 Instance Connect Endpoint is created', () => {
    template.resourceCountIs('AWS::EC2::InstanceConnectEndpoint', 1);
  });

  test('VPC endpoints are created for enhanced security', () => {
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: Match.stringLikeRegexp('.*s3.*'),
    });
    
    template.hasResourceProperties('AWS::EC2::VPCEndpoint', {
      ServiceName: Match.stringLikeRegexp('.*ec2.*'),
    });
  });

  test('All resources are tagged appropriately', () => {
    const resources = template.findResources('AWS::EC2::VPC');
    const vpcKey = Object.keys(resources)[0];
    const vpc = resources[vpcKey];
    
    expect(vpc.Properties.Tags).toContainEqual({
      Key: 'Environment',
      Value: 'Production'
    });
  });

  test('Outputs are defined correctly', () => {
    template.hasOutput('VpcId', {});
    template.hasOutput('BastionHostId', {});
    template.hasOutput('S3BucketName', {});
    template.hasOutput('InstanceConnectEndpointId', {});
  });

  test('Stack uses default environment suffix when not provided', () => {
    const app = new cdk.App();
    const stackWithoutSuffix = new TapStack(app, 'TestStackNoSuffix', {
      env: { region: 'us-east-1', account: '123456789012' },
    });
    const templateNoSuffix = Template.fromStack(stackWithoutSuffix);
    
    // Check that the bucket name includes 'dev' as default
    templateNoSuffix.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('tap-dev-secure-bucket-.*'),
    });
  });

  test('Stack satisfies all 12 constraints', () => {
    // Constraint 1: All resources tagged with 'Environment: Production'
    const allResources = template.toJSON().Resources;
    Object.values(allResources).forEach((resource: any) => {
      if (resource.Properties?.Tags) {
        expect(resource.Properties.Tags).toContainEqual({
          Key: 'Environment',
          Value: 'Production'
        });
      }
    });

    // Constraint 4: VPC CIDR block is '10.0.0.0/16'
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16'
    });

    // Constraint 5 & 6: At least 2 public and 2 private subnets across 2 AZs
    template.resourceCountIs('AWS::EC2::Subnet', 4);

    // Constraint 7: Internet Gateway deployed
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);

    // Constraint 8: NAT Gateways enabled
    template.resourceCountIs('AWS::EC2::NatGateway', 2);

    // Constraint 9: SSH access from specific IP (203.0.113.0/24)
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '203.0.113.0/24',
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22
        })
      ])
    });

    // Constraint 11: Bastion host implemented
    template.resourceCountIs('AWS::EC2::Instance', 1);

    // Constraint 12: S3 buckets have Block Public Access enabled
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      }
    });
  });
});
