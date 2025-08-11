import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Development' }),
          Match.objectLike({ Key: 'Name', Value: 'VPC-Development-trainr70-test' })
        ])
      });
    });

    test('creates public subnets across 2 availability zones', () => {
      template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
      
      // Check public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          Match.objectLike({ 
            Key: 'aws-cdk:subnet-name', 
            Value: 'PublicSubnet-Development-trainr70-test' 
          })
        ])
      });
    });

    test('creates private subnets with NAT gateway', () => {
      template.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          Match.objectLike({ 
            Key: 'aws-cdk:subnet-name', 
            Value: 'PrivateSubnet-Development-trainr70-test' 
          })
        ])
      });
      
      // Check NAT Gateway exists
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('creates Internet Gateway and attaches to VPC', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
    });
  });

  describe('Security Groups', () => {
    test('creates security group with correct ingress rules', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web server',
        GroupName: 'WebServerSG-Development-trainr70-test',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp',
            Description: 'Allow HTTP traffic'
          }),
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp',
            Description: 'Allow SSH traffic from specific IP range'
          })
        ])
      });
    });

    test('security group has correct tags', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Development' })
        ])
      });
    });
  });

  describe('IAM Roles and Policies', () => {
    test('creates EC2 role with correct name and policies', () => {
      const resources = template.findResources('AWS::IAM::Role');
      const ec2RoleResource = Object.values(resources).find((resource: any) => 
        resource.Properties?.RoleName === 'EC2Role-Development-trainr70-test'
      );
      
      expect(ec2RoleResource).toBeDefined();
      expect(ec2RoleResource?.Properties?.AssumeRolePolicyDocument?.Statement).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            }
          })
        ])
      );
    });

    test('EC2 role has S3 bucket access policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:PutObject*'
              ])
            })
          ])
        }
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('creates S3 bucket with versioning and encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `s3bucket-development-trainr70-test-${stack.account}`,
        VersioningConfiguration: {
          Status: 'Enabled'
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            })
          ])
        }
      });
    });

    test('S3 bucket has public access blocked', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('S3 bucket has proper deletion policy', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
        Properties: Match.objectLike({
          Tags: Match.arrayWith([
            Match.objectLike({ 
              Key: 'aws-cdk:auto-delete-objects', 
              Value: 'true' 
            })
          ])
        })
      });
    });

    test('creates S3 Access Point with ABAC support', () => {
      template.hasResourceProperties('AWS::S3::AccessPoint', {
        Name: 's3ap-development-trainr70-test',
        Policy: {
          Version: '2012-10-17',
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject'
              ])
            })
          ])
        }
      });
    });
  });

  describe('EC2 Instance', () => {
    test('creates EC2 instance with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        InstanceType: 't3.micro',
        Tags: Match.arrayWith([
          Match.objectLike({ 
            Key: 'Name', 
            Value: 'EC2Instance-Development-trainr70-test' 
          }),
          Match.objectLike({ 
            Key: 'Environment', 
            Value: 'Development' 
          })
        ])
      });
    });

    test('EC2 instance has user data for web server', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: Match.objectLike({
          'Fn::Base64': Match.stringLikeRegexp('.*httpd.*')
        })
      });
    });

    test('EC2 instance uses Amazon Linux 2 AMI', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        ImageId: {
          Ref: Match.stringLikeRegexp('.*SsmParameterValue.*')
        }
      });
    });

    test('EC2 instance has instance profile attached', () => {
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: Match.arrayWith([
          { Ref: Match.anyValue() }
        ])
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('creates SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'AlarmTopic-Development-trainr70-test',
        Tags: Match.arrayWith([
          Match.objectLike({ Key: 'Environment', Value: 'Development' })
        ])
      });
    });

    test('creates CPU utilization alarm with correct threshold', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmName: 'CPUAlarm-Development-trainr70-test',
        AlarmDescription: 'Alarm when server CPU exceeds 70%',
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 70,
        EvaluationPeriods: 2,
        Period: 300,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
        Statistic: 'Average'
      });
    });

    test('alarm has SNS action configured', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: Match.arrayWith([
          { Ref: Match.anyValue() }
        ])
      });
    });
  });

  describe('Network Firewall', () => {
    test('creates Network Firewall rule group', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
        RuleGroupName: 'NFWRuleGroup-Development-trainr70-test',
        Type: 'STATEFUL',
        Capacity: 100,
        RuleGroup: {
          RulesSource: {
            StatefulRules: Match.arrayWith([
              Match.objectLike({
                Action: 'ALERT',
                Header: Match.objectLike({
                  Protocol: 'HTTP',
                  DestinationPort: '80'
                })
              })
            ])
          }
        }
      });
    });

    test('Network Firewall rule has SID configured', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
        RuleGroup: {
          RulesSource: {
            StatefulRules: Match.arrayWith([
              Match.objectLike({
                RuleOptions: Match.arrayWith([
                  Match.objectLike({
                    Keyword: 'sid',
                    Settings: ['100001']
                  })
                ])
              })
            ])
          }
        }
      });
    });

    test('creates Network Firewall policy', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::FirewallPolicy', {
        FirewallPolicyName: 'NFWPolicy-Development-trainr70-test',
        FirewallPolicy: {
          StatelessDefaultActions: ['aws:forward_to_sfe'],
          StatelessFragmentDefaultActions: ['aws:forward_to_sfe'],
          StatefulRuleGroupReferences: Match.arrayWith([
            Match.objectLike({
              ResourceArn: Match.anyValue()
            })
          ])
        }
      });
    });

    test('creates Network Firewall', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::Firewall', {
        FirewallName: 'NFW-Development-trainr70-test',
        SubnetMappings: Match.arrayWith([
          Match.objectLike({
            SubnetId: Match.anyValue()
          })
        ])
      });
    });
  });

  describe('Stack Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID',
        ExportName: 'VpcId-Development-trainr70-test'
      });
    });

    test('exports Public Subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        ExportName: 'PublicSubnetIds-Development-trainr70-test'
      });
    });

    test('exports Private Subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        ExportName: 'PrivateSubnetIds-Development-trainr70-test'
      });
    });

    test('exports EC2 Instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID',
        ExportName: 'EC2InstanceId-Development-trainr70-test'
      });
    });

    test('exports EC2 Public IP', () => {
      template.hasOutput('EC2PublicIp', {
        Description: 'EC2 Instance Public IP',
        ExportName: 'EC2PublicIp-Development-trainr70-test'
      });
    });

    test('exports S3 Bucket Name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
        ExportName: 'S3BucketName-Development-trainr70-test'
      });
    });

    test('exports S3 Access Point ARN', () => {
      template.hasOutput('S3AccessPointArn', {
        Description: 'S3 Access Point ARN',
        ExportName: 'S3AccessPointArn-Development-trainr70-test'
      });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources have Environment tag', () => {
      // Check that major resources have the Environment tag
      const resourceTypes = [
        'AWS::EC2::VPC',
        'AWS::EC2::SecurityGroup',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::NetworkFirewall::RuleGroup'
      ];

      resourceTypes.forEach(resourceType => {
        const resources = template.findResources(resourceType);
        Object.values(resources).forEach(resource => {
          expect(resource.Properties?.Tags).toEqual(
            expect.arrayContaining([
              expect.objectContaining({ 
                Key: 'Environment', 
                Value: 'Development' 
              })
            ])
          );
        });
      });
    });
  });

  describe('Naming Convention', () => {
    test('resources follow naming convention pattern', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({ 
            Key: 'Name', 
            Value: Match.stringLikeRegexp('VPC-Development-trainr70-.*')
          })
        ])
      });

      // Check Security Group name
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: Match.stringLikeRegexp('WebServerSG-Development-trainr70-.*')
      });

      // Check IAM Role name
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: Match.stringLikeRegexp('EC2Role-Development-trainr70-.*')
      });
    });
  });
});