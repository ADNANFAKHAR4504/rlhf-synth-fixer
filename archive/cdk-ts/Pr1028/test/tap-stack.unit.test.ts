import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { SecurityMonitoringStack } from '../lib/security-monitoring-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct configuration', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true
      });
    });

    test('creates subnets across multiple availability zones', () => {
      // The VPC creates 9 subnets total (3 public, 3 private with egress, 3 isolated)
      const subnets = template.findResources('AWS::EC2::Subnet');
      expect(Object.keys(subnets).length).toBe(9);
      
      // Check for public subnets (they should have RouteTable with InternetGateway route)
      const publicSubnets = Object.keys(subnets).filter(key => key.includes('PublicSubnet'));
      expect(publicSubnets.length).toBeGreaterThan(0);
      
      // Check for private subnets (they should not have direct IGW route)
      const privateSubnets = Object.keys(subnets).filter(key => key.includes('PrivateSubnet'));
      expect(privateSubnets.length).toBeGreaterThan(0);
      
      // Check for isolated subnets
      const isolatedSubnets = Object.keys(subnets).filter(key => key.includes('IsolatedSubnet'));
      expect(isolatedSubnets.length).toBeGreaterThan(0);
    });

    test('enables VPC Block Public Access exclusion', () => {
      template.hasResourceProperties('AWS::EC2::VPCBlockPublicAccessExclusion', {
        InternetGatewayExclusionMode: 'allow-egress'
      });
    });
  });

  describe('VPC Flow Logs', () => {
    test('creates S3 bucket for flow logs with proper configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`tap-${environmentSuffix}-vpc-flow-logs-.*`),
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
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true
        }
      });
    });

    test('creates S3 bucket lifecycle rules for retention', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: Match.arrayWith([
            Match.objectLike({
              Id: 'FlowLogsRetention',
              Status: 'Enabled',
              Transitions: Match.arrayWith([
                Match.objectLike({
                  StorageClass: 'STANDARD_IA',
                  TransitionInDays: 30
                }),
                Match.objectLike({
                  StorageClass: 'GLACIER',
                  TransitionInDays: 90
                })
              ]),
              ExpirationInDays: 2555 // 7 years
            })
          ])
        }
      });
    });

    test('creates CloudWatch log group for flow logs', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: `/aws/vpc/flowlogs/${environmentSuffix}`,
        RetentionInDays: 365
      });
    });

    test('creates IAM role for VPC Flow Logs', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'vpc-flow-logs.amazonaws.com'
              },
              Action: 'sts:AssumeRole'
            })
          ])
        })
      });
    });

    test('creates VPC Flow Logs to S3', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestination: Match.anyValue(),
        MaxAggregationInterval: 600
      });
    });

    test('creates VPC Flow Logs to CloudWatch', () => {
      template.hasResourceProperties('AWS::EC2::FlowLog', {
        ResourceType: 'VPC',
        TrafficType: 'ALL',
        LogDestinationType: 'cloud-watch-logs',
        MaxAggregationInterval: 600
      });
    });
  });

  describe('Security Groups', () => {
    test('creates web tier security group with HTTPS access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web tier',
        SecurityGroupIngress: Match.arrayWith([
          Match.objectLike({
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0'
          })
        ])
      });
    });

    test('creates app tier security group with restricted access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for application tier'
      });
      
      // Check that ingress rule is added between security groups
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 8080,
        ToPort: 8080,
        Description: 'Allow traffic from web tier'
      });
    });

    test('creates database tier security group with MySQL access', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for database tier'
      });
      
      // Check that ingress rule is added between security groups
      template.hasResourceProperties('AWS::EC2::SecurityGroupIngress', {
        IpProtocol: 'tcp',
        FromPort: 3306,
        ToPort: 3306,
        Description: 'Allow MySQL from app tier'
      });
    });
  });

  describe('GuardDuty', () => {
    test('uses existing GuardDuty detector', () => {
      // GuardDuty detector already exists in account
      // Stack uses existing detector ID instead of creating new one
      const outputs = template.findOutputs('*');
      expect(outputs.GuardDutyDetectorId).toBeDefined();
      expect(outputs.GuardDutyDetectorId.Value).toBe('4dc074dbceb04fc1a1da094d3f38f35c');
    });

    test('exports existing GuardDuty detector ID in outputs', () => {
      template.hasOutput('GuardDutyDetectorId', {
        Value: '4dc074dbceb04fc1a1da094d3f38f35c',
        Description: 'GuardDuty Detector ID (existing)'
      });
    });
  });

  describe('Outputs', () => {
    test('exports VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'VPC ID'
      });
    });

    test('exports Flow Logs S3 bucket name', () => {
      template.hasOutput('FlowLogsBucketName', {
        Description: 'VPC Flow Logs S3 Bucket Name'
      });
    });

    test('exports GuardDuty detector ID', () => {
      template.hasOutput('GuardDutyDetectorId', {
        Description: 'GuardDuty Detector ID (existing)'
      });
    });
  });

  describe('Tags', () => {
    test('applies security compliance tags to resources', () => {
      const synthesized = app.synth();
      const stackArtifact = synthesized.getStackByName(stack.stackName);
      const tags = stackArtifact.tags;
      
      expect(tags).toMatchObject({
        'SecurityLevel': 'High',
        'Compliance': 'Enterprise',
        'DataClassification': 'Confidential'
      });
    });
  });
});

describe('SecurityMonitoringStack', () => {
  let app: cdk.App;
  let stack: SecurityMonitoringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecurityMonitoringStack(app, 'TestSecurityMonitoringStack', { 
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1'
      }
    });
    template = Template.fromStack(stack);
  });

  describe('SNS Topic', () => {
    test('creates SNS topic for security alerts', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        DisplayName: `Security Alerts - ${environmentSuffix}`
      });
    });

    test('enforces SSL on SNS topic', () => {
      template.hasResourceProperties('AWS::SNS::TopicPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: '*',
              Action: 'sns:Publish',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false'
                }
              }
            })
          ])
        })
      });
    });
  });

  describe('CloudWatch Alarms', () => {
    test('creates alarm for rejected connections', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'PacketDropCount',
        Namespace: 'AWS/VPC',
        Statistic: 'Sum',
        Threshold: 100,
        EvaluationPeriods: 2,
        TreatMissingData: 'notBreaching'
      });
    });
  });

  describe('EventBridge Rules', () => {
    test('creates EventBridge rule for GuardDuty high severity findings', () => {
      template.hasResourceProperties('AWS::Events::Rule', {
        EventPattern: {
          source: ['aws.guardduty'],
          'detail-type': ['GuardDuty Finding'],
          detail: {
            severity: [7.0, 8.9]
          }
        }
      });
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('creates security dashboard with metrics', () => {
      template.hasResourceProperties('AWS::CloudWatch::Dashboard', {
        DashboardName: `SecurityMetrics-${environmentSuffix}`
      });
    });
  });

  describe('Outputs', () => {
    test('exports SNS topic ARN', () => {
      template.hasOutput('SecurityAlertsTopicArn', {
        Description: 'Security Alerts SNS Topic ARN'
      });
    });

    test('exports CloudWatch dashboard URL', () => {
      template.hasOutput('SecurityDashboardUrl', {
        Description: 'Security Dashboard URL'
      });
    });
  });
});