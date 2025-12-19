import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MultiRegionVpcStack } from '../lib/multi-region-vpc';
import { IamRolesStack } from '../lib/iam-roles';

describe('Multi-Region Infrastructure Unit Tests', () => {
  let app: cdk.App;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('MultiRegionVpcStack', () => {
    test('creates VPC with correct CIDR block', () => {
      // Arrange & Act
      const stack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region: 'us-east-1',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Name', Value: `vpc-${environmentSuffix}-us-east-1` }),
        ]),
      });
    });

    test('creates public and private subnets', () => {
      // Arrange & Act
      const stack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region: 'us-west-2',
      });
      const template = Template.fromStack(stack);

      // Assert - Check for public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Public' }),
        ]),
      });

      // Assert - Check for private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'aws-cdk:subnet-type', Value: 'Private' }),
        ]),
      });
    });

    test('creates NAT Gateway for private subnet internet access', () => {
      // Arrange & Act
      const stack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region: 'us-east-1',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::EC2::NatGateway', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix }),
        ]),
      });
    });

    test('creates Internet Gateway for public subnet', () => {
      // Arrange & Act
      const stack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region: 'us-west-2',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResource('AWS::EC2::InternetGateway', {});
      template.hasResource('AWS::EC2::VPCGatewayAttachment', {});
    });

    test('exports VPC and subnet IDs for cross-stack references', () => {
      // Arrange & Act
      const stack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region: 'us-east-1',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasOutput('VpcId', {
        Export: {
          Name: `VpcId-${environmentSuffix}-us-east-1`,
        },
      });
    });

    test('applies correct tags to VPC resources', () => {
      // Arrange & Act
      const region = 'us-west-2';
      const stack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region,
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix }),
          Match.objectLike({ Key: 'Region', Value: region }),
        ]),
      });
    });

    test('creates route tables for public and private subnets', () => {
      // Arrange & Act
      const stack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region: 'us-east-1',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.resourceCountIs('AWS::EC2::RouteTable', 4); // 2 public + 2 private
      template.hasResource('AWS::EC2::Route', {
        Properties: {
          DestinationCidrBlock: '0.0.0.0/0',
        },
      });
    });
  });

  describe('IamRolesStack', () => {
    test('creates EC2 role with least privilege', () => {
      // Arrange & Act
      const stack = new IamRolesStack(app, 'TestIamStack', {
        environmentSuffix,
        region: 'us-east-1',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
        RoleName: `ec2-role-${environmentSuffix}-useast1`,
      });

      // Check for managed policy separately
      const resources = template.toJSON().Resources;
      const roleResource = Object.values(resources).find(
        (r: any) => r.Type === 'AWS::IAM::Role' && r.Properties.RoleName === `ec2-role-${environmentSuffix}-useast1`
      ) as any;
      
      expect(roleResource).toBeDefined();
      expect(roleResource.Properties.ManagedPolicyArns).toBeDefined();
      expect(roleResource.Properties.ManagedPolicyArns.length).toBeGreaterThan(0);
      
      // Check that CloudWatchAgentServerPolicy is attached
      const hasCWPolicy = roleResource.Properties.ManagedPolicyArns.some((policy: any) => {
        if (typeof policy === 'string') {
          return policy.includes('CloudWatchAgentServerPolicy');
        } else if (policy['Fn::Join']) {
          const joinParts = policy['Fn::Join'][1];
          return joinParts.some((part: any) => 
            typeof part === 'string' && part.includes('CloudWatchAgentServerPolicy')
          );
        }
        return false;
      });
      expect(hasCWPolicy).toBe(true);
    });

    test('creates cross-region replication role', () => {
      // Arrange & Act
      const stack = new IamRolesStack(app, 'TestIamStack', {
        environmentSuffix,
        region: 'us-west-2',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            }),
          ]),
        },
        RoleName: `cross-region-role-${environmentSuffix}-uswest2`,
      });
    });

    test('adds CloudWatch logs permissions to EC2 role', () => {
      // Arrange & Act
      const stack = new IamRolesStack(app, 'TestIamStack', {
        environmentSuffix,
        region: 'us-east-1',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ]),
              Resource: `arn:aws:logs:us-east-1:*:log-group:/aws/ec2/*`,
            }),
          ]),
        },
      });
    });

    test('adds S3 permissions to cross-region role', () => {
      // Arrange & Act
      const stack = new IamRolesStack(app, 'TestIamStack', {
        environmentSuffix,
        region: 'us-west-2',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObjectVersion',
                's3:GetObjectVersionAcl',
                's3:ListBucket',
              ]),
              Condition: {
                StringEquals: {
                  's3:x-amz-server-side-encryption': 'AES256',
                },
              },
            }),
          ]),
        },
      });
    });

    test('exports role ARNs for cross-stack references', () => {
      // Arrange & Act
      const stack = new IamRolesStack(app, 'TestIamStack', {
        environmentSuffix,
        region: 'us-east-1',
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasOutput('EC2RoleArn', {
        Export: {
          Name: `EC2RoleArn-${environmentSuffix}-us-east-1`,
        },
      });

      template.hasOutput('CrossRegionRoleArn', {
        Export: {
          Name: `CrossRegionRoleArn-${environmentSuffix}-us-east-1`,
        },
      });
    });

    test('applies correct tags to IAM roles', () => {
      // Arrange & Act
      const region = 'us-west-2';
      const stack = new IamRolesStack(app, 'TestIamStack', {
        environmentSuffix,
        region,
      });
      const template = Template.fromStack(stack);

      // Assert
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `ec2-role-${environmentSuffix}-uswest2`,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: environmentSuffix }),
          Match.objectLike({ Key: 'Region', Value: region }),
        ]),
      });
    });
  });

  describe('Multi-Region Deployment', () => {
    test('stacks can be created for multiple regions', () => {
      // Arrange
      const regions = ['us-east-1', 'us-west-2'];

      // Act & Assert
      regions.forEach((region) => {
        const vpcStack = new MultiRegionVpcStack(app, `VpcStack-${region}`, {
          environmentSuffix,
          region,
          env: { region },
        });

        const iamStack = new IamRolesStack(app, `IamStack-${region}`, {
          environmentSuffix,
          region,
          env: { region },
        });

        expect(vpcStack.region).toBe(region);
        expect(iamStack.region).toBe(region);
      });
    });

    test('VPC stack provides proper exports for dependent stacks', () => {
      // Arrange & Act
      const vpcStack = new MultiRegionVpcStack(app, 'TestVpcStack', {
        environmentSuffix,
        region: 'us-east-1',
      });

      // Assert
      expect(vpcStack.vpc).toBeDefined();
      expect(vpcStack.publicSubnets).toBeDefined();
      expect(vpcStack.privateSubnets).toBeDefined();
      expect(vpcStack.publicSubnets.length).toBeGreaterThan(0);
      expect(vpcStack.privateSubnets.length).toBeGreaterThan(0);
    });

    test('IAM stack provides role references for other resources', () => {
      // Arrange & Act
      const iamStack = new IamRolesStack(app, 'TestIamStack', {
        environmentSuffix,
        region: 'us-west-2',
      });

      // Assert
      expect(iamStack.ec2Role).toBeDefined();
      expect(iamStack.crossRegionReplicationRole).toBeDefined();
    });
  });
});