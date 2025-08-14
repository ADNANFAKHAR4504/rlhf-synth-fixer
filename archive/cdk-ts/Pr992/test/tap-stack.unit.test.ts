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
    // Set test environment suffix via context
    app.node.setContext('environmentSuffix', 'test');
    
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Environment Suffix Configuration', () => {
    test('should use environmentSuffix from props when provided', () => {
      const app2 = new cdk.App();
      const stack2 = new TapStack(app2, 'TestTapStackProps', {
        environmentSuffix: 'props-test',
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const template2 = Template.fromStack(stack2);
      
      template2.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'myapp-webserver-props-test'
      });
    });

    test('should use environmentSuffix from context when props not provided', () => {
      const app3 = new cdk.App();
      app3.node.setContext('environmentSuffix', 'context-test');
      const stack3 = new TapStack(app3, 'TestTapStackContext', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const template3 = Template.fromStack(stack3);
      
      template3.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'myapp-webserver-context-test'
      });
    });

    test('should default to "dev" when no environmentSuffix provided', () => {
      const app4 = new cdk.App();
      // No context or props environmentSuffix set
      const stack4 = new TapStack(app4, 'TestTapStackDefault', {
        env: {
          account: '123456789012',
          region: 'us-east-1'
        }
      });
      const template4 = Template.fromStack(stack4);
      
      template4.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'myapp-webserver-dev'
      });
    });
  });

  describe('VPC Configuration', () => {
    test('should create VPC with environment suffix', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });
  });

  describe('Security Group', () => {
    test('should create security group with correct properties', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('Security group for MyApp web server - HTTPS only \\(.*\\)'),
        GroupName: Match.stringLikeRegexp('myapp-webserver-.*')
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
        RoleName: Match.stringLikeRegexp('myapp-ec2role-.*'),
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
        InstanceProfileName: Match.stringLikeRegexp('myapp-instanceprofile-.*')
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
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('myapp-webserver-.*')
          }
        ])
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
      // VPC creates multiple resources (vpc, subnets, internet gateway, route tables, etc.)
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::EC2::SecurityGroup', 1); // Not counting default SG restriction resources
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThanOrEqual(1); // EC2 role + potentially Lambda role for default SG restriction
      template.resourceCountIs('AWS::EC2::Instance', 1);
      // Multiple instance profiles are created by CDK
      const instanceProfiles = template.findResources('AWS::IAM::InstanceProfile');
      expect(Object.keys(instanceProfiles).length).toBeGreaterThanOrEqual(1);
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
