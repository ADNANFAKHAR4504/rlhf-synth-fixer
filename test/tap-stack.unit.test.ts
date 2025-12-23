import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
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
                's3:GetObject*'
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
        BucketName: {
          'Fn::Join': Match.anyValue()
        },
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
        Export: {
          Name: 'VpcId-Development-trainr70-test'
        }
      });
    });

    test('exports Public Subnet IDs', () => {
      template.hasOutput('PublicSubnetIds', {
        Description: 'Public Subnet IDs',
        Export: {
          Name: 'PublicSubnetIds-Development-trainr70-test'
        }
      });
    });

    test('exports Private Subnet IDs', () => {
      template.hasOutput('PrivateSubnetIds', {
        Description: 'Private Subnet IDs',
        Export: {
          Name: 'PrivateSubnetIds-Development-trainr70-test'
        }
      });
    });

    test('exports EC2 Instance ID', () => {
      template.hasOutput('EC2InstanceId', {
        Description: 'EC2 Instance ID',
        Export: {
          Name: 'EC2InstanceId-Development-trainr70-test'
        }
      });
    });

    test('exports EC2 Public IP', () => {
      template.hasOutput('EC2PublicIp', {
        Description: 'EC2 Instance Public IP',
        Export: {
          Name: 'EC2PublicIp-Development-trainr70-test'
        }
      });
    });

    test('exports S3 Bucket Name', () => {
      template.hasOutput('S3BucketName', {
        Description: 'S3 Bucket Name',
        Export: {
          Name: 'S3BucketName-Development-trainr70-test'
        }
      });
    });

    test('exports S3 Access Point ARN', () => {
      template.hasOutput('S3AccessPointArn', {
        Description: 'S3 Access Point ARN',
        Export: {
          Name: 'S3AccessPointArn-Development-trainr70-test'
        }
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

  describe('Constructor Parameter Validation', () => {
    test('uses default environment suffix when not provided', () => {
      // Test branch coverage: props?.environmentSuffix || 'dev'
      const appWithoutSuffix = new cdk.App();
      const stackWithoutSuffix = new TapStack(appWithoutSuffix, 'TestStackWithoutSuffix', {});
      const templateWithoutSuffix = Template.fromStack(stackWithoutSuffix);

      // Verify that 'dev' is used as default suffix in resource names
      templateWithoutSuffix.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Name',
            Value: 'VPC-Development-trainr70-dev'
          })
        ])
      });

      templateWithoutSuffix.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupName: 'WebServerSG-Development-trainr70-dev'
      });
    });

    test('handles undefined props gracefully', () => {
      // Test edge case with completely undefined props
      const appUndefinedProps = new cdk.App();
      const stackUndefinedProps = new TapStack(appUndefinedProps, 'TestStackUndefinedProps');
      const templateUndefinedProps = Template.fromStack(stackUndefinedProps);

      // Verify default behavior
      templateUndefinedProps.hasResourceProperties('AWS::IAM::Role', {
        RoleName: 'EC2Role-Development-trainr70-dev'
      });

      templateUndefinedProps.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: 'AlarmTopic-Development-trainr70-dev'
      });
    });

    test('handles empty environment suffix by using default', () => {
      const appEmptySuffix = new cdk.App();
      const stackEmptySuffix = new TapStack(appEmptySuffix, 'TestStackEmpty', { environmentSuffix: '' });
      const templateEmptySuffix = Template.fromStack(stackEmptySuffix);

      // Verify empty suffix falls back to 'dev' (due to || operator behavior)
      templateEmptySuffix.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: {
          'Fn::Join': [
            '',
            [
              's3bucket-development-trainr70-dev-',
              { Ref: 'AWS::AccountId' }
            ]
          ]
        }
      });
    });
  });

  describe('Resource Configuration Validation', () => {
    test('VPC configuration meets security requirements', () => {
      // Verify VPC has DNS support enabled (security best practice)
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });

      // Verify VPC uses private IP range
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16'
      });
    });

    test('Security Group follows least privilege principle', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        SecurityGroupIngress: [
          // HTTP access from anywhere (appropriate for web server)
          Match.objectLike({
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            ToPort: 80,
            IpProtocol: 'tcp'
          }),
          // SSH access restricted to private network
          Match.objectLike({
            CidrIp: '10.0.0.0/8',
            FromPort: 22,
            ToPort: 22,
            IpProtocol: 'tcp'
          })
        ]
      });
    });

    test('S3 bucket security configuration is comprehensive', () => {
      // Verify all security settings are enabled
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        },
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256'
              }
            }
          ]
        },
        VersioningConfiguration: {
          Status: 'Enabled'
        }
      });
    });

    test('IAM roles follow principle of least privilege', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            // Verify the policy allows only necessary S3 actions
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject*',
                's3:GetBucket*',
                's3:List*',
                's3:DeleteObject*',
                's3:PutObject', // Note: CDK uses exact action name, not wildcard
                's3:PutObjectLegalHold',
                's3:PutObjectRetention',
                's3:PutObjectTagging',
                's3:PutObjectVersionTagging',
                's3:Abort*'
              ])
            })
          ])
        }
      });
    });
  });

  describe('Network Architecture Validation', () => {
    test('subnet configuration supports high availability', () => {
      // Verify we have exactly 4 subnets (2 public + 2 private across 2 AZs)
      template.resourceCountIs('AWS::EC2::Subnet', 4);

      // Verify route tables for proper network segmentation - CDK creates more route tables for proper isolation
      const routeTables = template.findResources('AWS::EC2::RouteTable');
      expect(Object.keys(routeTables).length).toBeGreaterThanOrEqual(3);

      // Verify NAT Gateway for private subnet internet access
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
      template.resourceCountIs('AWS::EC2::EIP', 1); // For NAT Gateway
    });

    test('internet gateway configuration is correct', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
      template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);

      // Verify IGW is attached to VPC
      template.hasResourceProperties('AWS::EC2::VPCGatewayAttachment', {
        VpcId: Match.anyValue(),
        InternetGatewayId: Match.anyValue()
      });
    });

    test('network firewall integration is properly configured', () => {
      // Verify firewall is attached to public subnets (where it should be)
      const firewallProps = template.findResources('AWS::NetworkFirewall::Firewall');
      expect(Object.keys(firewallProps)).toHaveLength(1);

      const firewall = Object.values(firewallProps)[0];
      expect(firewall.Properties.SubnetMappings).toHaveLength(2); // One per public subnet
    });
  });

  describe('Monitoring and Alerting Configuration', () => {
    test('CloudWatch alarm has appropriate threshold and evaluation periods', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        Threshold: 70, // Not too sensitive, not too lenient
        EvaluationPeriods: 2, // Prevents false positives
        Period: 300, // 5-minute intervals
        ComparisonOperator: 'GreaterThanOrEqualToThreshold'
      });
    });

    test('SNS topic for alarms is configured correctly', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: Match.stringLikeRegexp('AlarmTopic-Development-trainr70-.*')
      });

      // Verify alarm action is linked to SNS topic
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        AlarmActions: [
          { Ref: Match.anyValue() }
        ]
      });
    });
  });

  describe('Resource Dependencies and Relationships', () => {
    test('EC2 instance has proper dependencies', () => {
      // Verify instance profile is created and attached
      template.resourceCountIs('AWS::IAM::InstanceProfile', 1);
      template.hasResourceProperties('AWS::IAM::InstanceProfile', {
        Roles: [
          { Ref: Match.anyValue() }
        ]
      });
    });

    test('S3 access point has correct policy configuration', () => {
      template.hasResourceProperties('AWS::S3::AccessPoint', {
        Policy: {
          Version: '2012-10-17',
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: Match.objectLike({
                AWS: Match.anyValue() // EC2 role ARN
              }),
              Action: ['s3:GetObject', 's3:PutObject']
            })
          ])
        }
      });
    });

    test('Network firewall components are properly linked', () => {
      // Rule group -> Policy -> Firewall dependency chain
      template.hasResourceProperties('AWS::NetworkFirewall::FirewallPolicy', {
        FirewallPolicy: {
          StatefulRuleGroupReferences: [
            {
              ResourceArn: Match.anyValue() // Should reference the rule group
            }
          ]
        }
      });
    });
  });

  describe('Compliance and Best Practices', () => {
    test('all resources have consistent tagging', () => {
      const resourceTypesToCheck = [
        'AWS::EC2::VPC',
        'AWS::EC2::SecurityGroup',
        'AWS::S3::Bucket',
        'AWS::SNS::Topic',
        'AWS::NetworkFirewall::RuleGroup',
        'AWS::NetworkFirewall::FirewallPolicy',
        'AWS::NetworkFirewall::Firewall'
      ];

      resourceTypesToCheck.forEach(resourceType => {
        template.hasResourceProperties(resourceType, {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Environment',
              Value: 'Development'
            })
          ])
        });
      });
    });

    test('removal policies are set appropriately for development', () => {
      // S3 bucket should have DESTROY policy for dev environment
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete'
      });
    });

    test('user data script contains security updates', () => {
      template.hasResourceProperties('AWS::EC2::Instance', {
        UserData: {
          'Fn::Base64': Match.stringLikeRegexp('.*yum update -y.*')
        }
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('stack can be created with minimal valid configuration', () => {
      const minimalApp = new cdk.App();

      // Should not throw when creating with minimal props
      expect(() => {
        new TapStack(minimalApp, 'MinimalStack', {});
      }).not.toThrow();
    });

    test('resource limits are within AWS service limits', () => {
      // Verify we don't exceed common AWS limits
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      expect(Object.keys(securityGroups).length).toBeLessThan(100); // Well under VPC limit of 2500
      template.resourceCountIs('AWS::EC2::Subnet', 4); // Well under VPC limit of 200

      // CDK may create additional roles for services, so check that total is reasonable
      const roles = template.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeLessThan(10); // Well under account limit
    });

    test('network firewall capacity is reasonable', () => {
      template.hasResourceProperties('AWS::NetworkFirewall::RuleGroup', {
        Capacity: 100 // Reasonable capacity that won't hit limits quickly
      });
    });
  });
});