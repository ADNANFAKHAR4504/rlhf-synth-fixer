import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecurityConstruct } from '../lib/security-stack';

describe('SecurityConstruct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let securityConstruct: SecurityConstruct;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack');

    // Create a mock VPC for testing
    vpc = new ec2.Vpc(stack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2
    });

    securityConstruct = new SecurityConstruct(stack, 'Security', {
      environmentSuffix: 'test',
      commonTags: {
        Environment: 'test',
        ProjectName: 'test-project',
        CostCenter: 'test-center'
      },
      vpc
    });

    template = Template.fromStack(stack);
  });

  describe('Security Groups', () => {
    test('creates web tier security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for web tier'
        })
      );
    });

    test('web security group allows HTTPS inbound', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for web tier',
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0'
            })
          ])
        })
      );
    });

    test('web security group allows HTTP inbound for redirect', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for web tier',
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              CidrIp: '0.0.0.0/0'
            })
          ])
        })
      );
    });

    test('creates application tier security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for application tier'
        })
      );
    });

    test('app security group allows traffic from web tier', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', 
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 8080,
          ToPort: 8080,
          SourceSecurityGroupId: Match.anyValue()
        })
      );
    });

    test('creates database tier security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', 
        Match.objectLike({
          GroupDescription: 'Security group for database tier'
        })
      );
    });

    test('db security group allows PostgreSQL from app tier', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', 
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 5432,
          ToPort: 5432,
          SourceSecurityGroupId: Match.anyValue()
        })
      );
    });

    test('security groups have restricted outbound rules', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        expect(sg.Properties?.SecurityGroupEgress).toBeDefined();
      });
    });
  });

  describe('Network ACLs', () => {
    test('creates network ACL for private subnets', () => {
      template.hasResource('AWS::EC2::NetworkAcl', {});
    });

    test('allows inbound app traffic in private NACL', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', 
        Match.objectLike({
          Protocol: 6, // TCP
          PortRange: Match.objectLike({
            From: 8080,
            To: 8080
          }),
          RuleAction: 'allow',
          Egress: false
        })
      );
    });

    test('allows outbound HTTPS in private NACL', () => {
      template.hasResourceProperties('AWS::EC2::NetworkAclEntry', 
        Match.objectLike({
          Protocol: 6, // TCP
          PortRange: Match.objectLike({
            From: 443,
            To: 443
          }),
          RuleAction: 'allow',
          Egress: true
        })
      );
    });
  });

  describe('IAM Roles', () => {
    test('creates EC2 IAM role', () => {
      template.hasResourceProperties('AWS::IAM::Role', 
        Match.objectLike({
          AssumeRolePolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Principal: Match.objectLike({
                  Service: 'ec2.amazonaws.com'
                }),
                Action: 'sts:AssumeRole'
              })
            ])
          })
        })
      );
    });

    test('attaches CloudWatch agent policy to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Role', 
        Match.objectLike({
          ManagedPolicyArns: Match.arrayWith([
            Match.objectLike({
              'Fn::Join': Match.arrayWith([
                '',
                Match.arrayWith([
                  Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy.*')
                ])
              ])
            })
          ])
        })
      );
    });

    test('adds S3 access policy to EC2 role', () => {
      template.hasResourceProperties('AWS::IAM::Policy', 
        Match.objectLike({
          PolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Allow',
                Action: Match.arrayWith([
                  's3:GetObject',
                  's3:PutObject'
                ])
              })
            ])
          })
        })
      );
    });
  });

  describe('GuardDuty', () => {
    test('enables GuardDuty detector', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', {
        Enable: true
      });
    });

    test('enables S3 data events in GuardDuty', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', 
        Match.objectLike({
          Features: Match.arrayWith([
            Match.objectLike({
              Name: 'S3_DATA_EVENTS',
              Status: 'ENABLED'
            })
          ])
        })
      );
    });

    test('enables EKS audit logs in GuardDuty', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', 
        Match.objectLike({
          Features: Match.arrayWith([
            Match.objectLike({
              Name: 'EKS_AUDIT_LOGS',
              Status: 'ENABLED'
            })
          ])
        })
      );
    });

    test('enables RDS login events in GuardDuty', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', 
        Match.objectLike({
          Features: Match.arrayWith([
            Match.objectLike({
              Name: 'RDS_LOGIN_EVENTS',
              Status: 'ENABLED'
            })
          ])
        })
      );
    });

    test('enables EBS malware protection in GuardDuty', () => {
      template.hasResourceProperties('AWS::GuardDuty::Detector', 
        Match.objectLike({
          Features: Match.arrayWith([
            Match.objectLike({
              Name: 'EBS_MALWARE_PROTECTION',
              Status: 'ENABLED'
            })
          ])
        })
      );
    });
  });

  describe('Tags', () => {
    test('applies tags to security groups', () => {
      const securityGroups = template.findResources('AWS::EC2::SecurityGroup');
      Object.values(securityGroups).forEach((sg: any) => {
        expect(sg.Properties?.Tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Environment', Value: 'test' }),
            expect.objectContaining({ Key: 'ProjectName', Value: 'test-project' }),
            expect.objectContaining({ Key: 'CostCenter', Value: 'test-center' })
          ])
        );
      });
    });
  });
});