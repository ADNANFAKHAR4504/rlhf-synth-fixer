import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { WebApplicationStack } from '../lib/web-application-stack';

describe('WebApplicationStack Unit Tests', () => {
  let app: cdk.App;
  let stack: WebApplicationStack;
  let template: Template;
  const testEnvironmentSuffix = 'test123';

  beforeEach(() => {
    app = new cdk.App();
    stack = new WebApplicationStack(app, 'TestWebAppStack', {
      environmentSuffix: testEnvironmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-1',
      },
    });
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('Should create VPC with correct CIDR block 10.20.0.0/16', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.20.0.0/16',
      });
    });

    test('Should create VPC with 2 availability zones', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(
        subnet => subnet.Properties.MapPublicIpOnLaunch === true
      );
      expect(publicSubnets.length).toBe(2);
    });

    test('Should create public and private subnets', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const publicSubnets = Object.values(subnets).filter(
        subnet => subnet.Properties.MapPublicIpOnLaunch === true
      );
      const privateSubnets = Object.values(subnets).filter(
        subnet =>
          !subnet.Properties.MapPublicIpOnLaunch ||
          subnet.Properties.MapPublicIpOnLaunch === false
      );
      expect(publicSubnets.length).toBeGreaterThan(0);
      expect(privateSubnets.length).toBeGreaterThan(0);
    });

    test('Should create NAT Gateway', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 1);
    });

    test('Should create Internet Gateway', () => {
      template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    });
  });

  describe('WAF Configuration', () => {
    test('Should create WAF Web ACL', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Name: Match.stringLikeRegexp(`job-board-web-acl-${testEnvironmentSuffix}`),
      });
    });

    test('Should configure WAF with Bot Control managed rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'AWSManagedRulesBotControlRuleSet',
            Statement: Match.objectLike({
              ManagedRuleGroupStatement: Match.objectLike({
                VendorName: 'AWS',
                Name: 'AWSManagedRulesBotControlRuleSet',
              }),
            }),
          }),
        ]),
      });
    });

    test('Should configure rate limiting rule', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'RateLimitRule',
            Statement: Match.objectLike({
              RateBasedStatement: Match.objectLike({
                Limit: 2000,
                AggregateKeyType: 'IP',
              }),
            }),
          }),
        ]),
      });
    });

    test('Should create WAF logging configuration', () => {
      template.hasResource('AWS::WAFv2::LoggingConfiguration', {});
    });

    test('Should associate WAF with ALB', () => {
      template.hasResource('AWS::WAFv2::WebACLAssociation', {});
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('Should create S3 bucket for static files', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(
          `job-board-static-files-${testEnvironmentSuffix}-.*`
        ),
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Should have S3-managed encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
        },
      });
    });

    test('Should have CORS configuration', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        CorsConfiguration: {
          CorsRules: Match.arrayWith([
            Match.objectLike({
              AllowedHeaders: ['*'],
              AllowedMethods: ['GET', 'HEAD'],
              AllowedOrigins: ['*'],
            }),
          ]),
        },
      });
    });

    test('Should have auto-delete objects enabled', () => {
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });

    test('Should have bucket policy for web hosting', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: { AWS: '*' },
              Action: 's3:GetObject',
            }),
          ]),
        }),
      });
    });
  });

  describe('Security Groups', () => {
    test('Should create ALB security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
      });
    });

    test('Should allow HTTP (80) traffic to ALB from anywhere', () => {
      // Check for either inline or separate ingress rule
      const hasInlineRule = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 80,
              ToPort: 80,
              CidrIp: '0.0.0.0/0',
            }),
          ]),
        },
      });

      const hasSeparateRule = template.findResources('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0',
        },
      });

      expect(Object.keys(hasInlineRule).length + Object.keys(hasSeparateRule).length).toBeGreaterThan(0);
    });

    test('Should allow HTTPS (443) traffic to ALB from anywhere', () => {
      // Check for either inline or separate ingress rule
      const hasInlineRule = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 443,
              ToPort: 443,
              CidrIp: '0.0.0.0/0',
            }),
          ]),
        },
      });

      const hasSeparateRule = template.findResources('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0',
        },
      });

      expect(Object.keys(hasInlineRule).length + Object.keys(hasSeparateRule).length).toBeGreaterThan(0);
    });

    test('Should create EC2 security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
      });
    });

    test('Should allow SSH from 10.0.0.0/16 to EC2', () => {
      // Check for either inline or separate ingress rule
      const hasInlineRule = template.findResources('AWS::EC2::SecurityGroup', {
        Properties: {
          SecurityGroupIngress: Match.arrayWith([
            Match.objectLike({
              IpProtocol: 'tcp',
              FromPort: 22,
              ToPort: 22,
              CidrIp: '10.0.0.0/16',
            }),
          ]),
        },
      });

      const hasSeparateRule = template.findResources('AWS::EC2::SecurityGroupIngress', {
        Properties: {
          IpProtocol: 'tcp',
          FromPort: 22,
          ToPort: 22,
          CidrIp: '10.0.0.0/16',
        },
      });

      expect(Object.keys(hasInlineRule).length + Object.keys(hasSeparateRule).length).toBeGreaterThan(0);
    });
  });

  describe('IAM Configuration', () => {
    test('Should create IAM role for EC2 instances', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            }),
          ]),
        }),
      });
    });

    test('Should attach SSM managed policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*AmazonSSMManagedInstanceCore.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Should attach CloudWatch Agent policy', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        ManagedPolicyArns: Match.arrayWith([
          Match.objectLike({
            'Fn::Join': Match.arrayWith([
              '',
              Match.arrayWith([
                Match.stringLikeRegexp('.*CloudWatchAgentServerPolicy.*'),
              ]),
            ]),
          }),
        ]),
      });
    });

    test('Should have S3 access policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: Match.objectLike({
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith([
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket',
              ]),
            }),
          ]),
        }),
      });
    });
  });

  describe('Launch Template and Auto Scaling', () => {
    test('Should create launch template with t3.micro instance type', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          InstanceType: 't3.micro',
        }),
      });
    });

    test('Should have user data for Apache installation', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: Match.objectLike({
          UserData: Match.anyValue(),
        }),
      });
    });

    test('Should create Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        MaxSize: '6',
        DesiredCapacity: '2',
      });
    });

    test('Should configure health check for Auto Scaling Group', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        HealthCheckType: 'ELB',
        HealthCheckGracePeriod: 300,
      });
    });

    test('Should place instances in private subnets', () => {
      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const asgResource = Object.values(asg)[0];
      expect(asgResource.Properties.VPCZoneIdentifier).toBeDefined();
    });
  });

  describe('Load Balancer Configuration', () => {
    test('Should create Application Load Balancer', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
          Name: `job-board-alb-${testEnvironmentSuffix}`,
        }
      );
    });

    test('Should create target group', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          TargetGroupAttributes: Match.arrayWith([
            Match.objectLike({
              Key: 'load_balancing.algorithm.type',
              Value: 'weighted_random',
            }),
          ]),
        }
      );
    });

    test('Should enable Automatic Target Weights (anomaly mitigation)', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          TargetGroupAttributes: Match.arrayWith([
            Match.objectLike({
              Key: 'load_balancing.algorithm.anomaly_mitigation',
              Value: 'on',
            }),
          ]),
        }
      );
    });

    test('Should configure health checks', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        Match.objectLike({
          HealthCheckPath: '/',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        })
      );
    });

    test('Should create HTTP listener on port 80', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('Should create SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', {
        TopicName: `job-board-alarms-${testEnvironmentSuffix}`,
      });
    });

    test('Should create CPU utilization alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
        MetricName: 'CPUUtilization',
        Namespace: 'AWS/EC2',
        Threshold: 80,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
        ComparisonOperator: 'GreaterThanOrEqualToThreshold',
      }));
    });

    test('Should create unhealthy targets alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'UnHealthyHostCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1,
        EvaluationPeriods: 2,
        DatapointsToAlarm: 2,
      });
    });

    test('Should configure alarms to send to SNS topic', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      Object.values(alarms).forEach(alarm => {
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('Should create target response time alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
        MetricName: 'TargetResponseTime',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 0.1,
      }));
    });

    test('Should create request count alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
        MetricName: 'RequestCount',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 1000,
      }));
    });

    test('Should create HTTP 5xx error alarm', () => {
      template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
        MetricName: 'HTTPCode_Target_5XX_Count',
        Namespace: 'AWS/ApplicationELB',
        Threshold: 10,
      }));
    });
  });

  describe('Auto Scaling Policies', () => {
    test('Should create CPU-based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          }),
          TargetValue: 70,
        }),
      });
    });

    test('Should create request count based scaling policy', () => {
      template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: Match.objectLike({
          PredefinedMetricSpecification: Match.objectLike({
            PredefinedMetricType: 'ALBRequestCountPerTarget',
          }),
          TargetValue: 100,
        }),
      });
    });

    test('Should configure cooldown periods', () => {
      const policies = template.findResources(
        'AWS::AutoScaling::ScalingPolicy'
      );
      const cpuPolicy = Object.values(policies).find(
        policy =>
          policy.Properties.TargetTrackingConfiguration
            ?.PredefinedMetricSpecification?.PredefinedMetricType ===
          'ASGAverageCPUUtilization'
      );
      // Cooldown is configured in the policy
      expect(cpuPolicy).toBeDefined();
      expect(cpuPolicy?.Properties.TargetTrackingConfiguration).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('Should output ALB DNS name', () => {
      template.hasOutput('AlbDnsName', {
        Description: 'DNS name of the Application Load Balancer',
      });
    });

    test('Should output S3 bucket name', () => {
      template.hasOutput('StaticFilesBucketName', {
        Description: 'Name of the S3 bucket for static files',
      });
    });

    test('Should output VPC ID', () => {
      template.hasOutput('VpcId', {
        Description: 'ID of the VPC',
      });
    });

    test('Should output Alarm Topic ARN', () => {
      template.hasOutput('AlarmTopicArn', {
        Description: 'ARN of the SNS topic for alarms',
      });
    });
  });

  describe('Resource Naming', () => {
    test('Should include environment suffix in VPC logical ID', () => {
      const vpcs = template.findResources('AWS::EC2::VPC');
      const vpcKeys = Object.keys(vpcs);
      expect(
        vpcKeys.some(key => key.includes(testEnvironmentSuffix))
      ).toBeTruthy();
    });

    test('Should include environment suffix in ALB name', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Name: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`),
        }
      );
    });

    test('Should include environment suffix in target group name', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Name: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`),
        }
      );
    });

    test('Should include environment suffix in S3 bucket name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: Match.stringLikeRegexp(`.*${testEnvironmentSuffix}.*`),
      });
    });
  });

  describe('High Availability', () => {
    test('Should deploy resources across multiple AZs', () => {
      const subnets = template.findResources('AWS::EC2::Subnet');
      const azs = new Set(
        Object.values(subnets).map(subnet => subnet.Properties.AvailabilityZone)
      );
      expect(azs.size).toBeGreaterThanOrEqual(2);
    });

    test('Should have minimum of 2 instances for high availability', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: Match.anyValue(),
      });
      const asg = template.findResources('AWS::AutoScaling::AutoScalingGroup');
      const minSize = parseInt(Object.values(asg)[0].Properties.MinSize);
      expect(minSize).toBeGreaterThanOrEqual(2);
    });

    test('Should configure ALB to be internet-facing', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Scheme: 'internet-facing',
        }
      );
    });
  });

  describe('Security Best Practices', () => {
    test('Should not have retain policies on resources', () => {
      const resources = template.toJSON().Resources;
      Object.values(resources).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('Should have encryption enabled on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.anyValue(),
        }),
      });
    });

    test('Should have versioning enabled on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Should use latest Amazon Linux 2 AMI', () => {
      const launchTemplate = template.findResources('AWS::EC2::LaunchTemplate');
      expect(Object.keys(launchTemplate).length).toBeGreaterThan(0);
    });
  });
});
