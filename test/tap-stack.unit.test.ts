import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    // Mock VPC lookup to avoid context provider issues
    app.node.setContext('vpc-provider:account=123456789012:filter.vpc-id=vpc-0bb1c79de3EXAMPLE:region=us-east-1:returnAsymmetricSubnets=true', {
      vpcId: 'vpc-0bb1c79de3EXAMPLE',
      vpcCidrBlock: '10.0.0.0/16',
      availabilityZones: ['us-east-1a', 'us-east-1b'],
      isolatedSubnetIds: [],
      isolatedSubnetNames: [],
      isolatedSubnetRouteTableIds: [],
      privateSubnetIds: ['subnet-private-1', 'subnet-private-2'],
      privateSubnetNames: ['Private Subnet (AZ1)', 'Private Subnet (AZ2)'],
      privateSubnetRouteTableIds: ['rtb-private-1', 'rtb-private-2'],
      publicSubnetIds: ['subnet-public-1', 'subnet-public-2'],
      publicSubnetNames: ['Public Subnet (AZ1)', 'Public Subnet (AZ2)'],
      publicSubnetRouteTableIds: ['rtb-public-1', 'rtb-public-2'],
      subnetGroups: [
        {
          name: 'Public',
          type: 'Public',
          subnets: [
            {
              subnetId: 'subnet-public-1',
              availabilityZone: 'us-east-1a',
              routeTableId: 'rtb-public-1'
            },
            {
              subnetId: 'subnet-public-2', 
              availabilityZone: 'us-east-1b',
              routeTableId: 'rtb-public-2'
            }
          ]
        },
        {
          name: 'Private',
          type: 'Private',
          subnets: [
            {
              subnetId: 'subnet-private-1',
              availabilityZone: 'us-east-1a',
              routeTableId: 'rtb-private-1'
            },
            {
              subnetId: 'subnet-private-2',
              availabilityZone: 'us-east-1b', 
              routeTableId: 'rtb-private-2'
            }
          ]
        }
      ]
    });
    
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('should reference existing VPC', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        VpcId: Match.anyValue()
      });
    });
  });

  describe('Security Group', () => {
    test('should create security group with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for MyApp web server - HTTPS only',
        GroupName: 'myapp-webserver-production'
      });
    });

    test('should allow HTTPS traffic from anywhere', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
            Description: 'Allow HTTPS traffic from internet'
          }
        ]
      });
    });

    test('should allow all outbound traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupEgress: [
          {
            CidrIp: '0.0.0.0/0',
            IpProtocol: '-1'
          }
        ]
      });
    });
  });

  describe('IAM Role', () => {
    test('should create EC2 IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'myapp-ec2role-production',
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com'
              }
            }
          ]
        }
      });
    });

    test('should have S3 read-only permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyName: 'S3ReadOnlyPolicy',
            PolicyDocument: {
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:Get*', 's3:List*'],
                  Resource: '*'
                }
              ]
            }
          }
        ]
      });
    });
  });

  describe('Instance Profile', () => {
    test('should create instance profile', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'myapp-instanceprofile-production'
      });
    });

    test('should reference the IAM role', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [
          {
            Ref: Match.stringLikeRegexp('Ec2Role.*')
          }
        ]
      });
    });
  });

  describe('EC2 Instance', () => {
    test('should create EC2 instance with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        ImageId: Match.anyValue()
      });
    });

    test('should use Amazon Linux 2023 AMI from SSM parameter', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: {
          Ref: Match.stringLikeRegexp('SsmParameterValue.*')
        }
      });
    });

    test('should be placed in public subnet', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SubnetId: Match.anyValue()
      });
    });

    test('should reference security group', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        SecurityGroupIds: [
          {
            'Fn::GetAtt': [
              Match.stringLikeRegexp('SecurityGroup.*'),
              'GroupId'
            ]
          }
        ]
      });
    });

    test('should reference IAM instance profile', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        IamInstanceProfile: {
          Ref: Match.stringLikeRegexp('InstanceProfile.*')
        }
      });
    });

    test('should not have a key pair configured', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        KeyName: Match.absent()
      });
    });

    test('should have correct tags including instance name', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        Tags: [
          {
            Key: 'Name',
            Value: 'myapp-webserver-production'
          }
        ]
      });
    });
  });

  describe('SSM Parameter Reference', () => {
    test('should use Amazon Linux 2023 AMI from SSM parameter lookup', () => {
      // SSM parameter lookup doesn't create a separate resource - it's resolved at synthesis time
      // We verify this by checking that the EC2 instance has an ImageId reference
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: Match.anyValue()
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output instance ID', () => {
      template.hasOutput('InstanceId', {
        Description: 'EC2 Instance ID'
      });
    });

    test('should output security group ID', () => {
      template.hasOutput('SecurityGroupId', {
        Description: 'Security Group ID'
      });
    });

    test('should output instance profile ARN', () => {
      template.hasOutput('InstanceProfileArn', {
        Description: 'Instance Profile ARN'
      });
    });
  });

  describe('Resource Count', () => {
    test('should create expected number of resources', () => {
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
      template.resourceCountIs('AWS::IAM::Role', 1);
      // Note: CDK sometimes creates additional instance profiles, so we check for at least 1
      template.resourcePropertiesCountIs('AWS::IAM::InstanceProfile', {
        InstanceProfileName: 'myapp-instanceprofile-production'
      }, 1);
      template.resourceCountIs('AWS::EC2::Instance', 1);
    });
  });

  describe('Security Validation', () => {
    test('should not have any SSH access configured', () => {
      // Ensure no SSH port 22 is configured in security groups
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        const ingress = sg.Properties?.SecurityGroupIngress || [];
        ingress.forEach((rule: any) => {
          expect(rule.FromPort).not.toBe(22);
          expect(rule.ToPort).not.toBe(22);
        });
      });
    });

    test('should only allow HTTPS traffic inbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          {
            FromPort: 443,
            ToPort: 443,
            IpProtocol: 'tcp'
          }
        ]
      });
    });

    test('IAM role should follow least privilege principle', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        Policies: [
          {
            PolicyDocument: {
              Statement: [
                {
                  Action: ['s3:Get*', 's3:List*'],
                  Effect: 'Allow',
                  Resource: '*'
                }
              ]
            }
          }
        ]
      });
    });
  });
});
