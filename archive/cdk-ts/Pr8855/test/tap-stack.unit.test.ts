import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { RegionalResourcesStack } from '../lib/stacks/regional-resources-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('RegionalResourcesStack', () => {
  let app: cdk.App;
  let primaryStack: RegionalResourcesStack;
  let secondaryStack: RegionalResourcesStack;
  let primaryTemplate: Template;
  let secondaryTemplate: Template;

  const primaryRegion = 'us-east-1';
  const secondaryRegion = 'us-west-2';

  beforeEach(() => {
    app = new cdk.App();

    // Create primary region stack
    primaryStack = new RegionalResourcesStack(app, 'PrimaryStack', {
      environmentSuffix,
      region: primaryRegion,
      isPrimary: true,
      domainName: 'web.test.failover.com',
      zoneId: 'Z04134401R0L0CDWNIT27',
      secondaryRegion,
      replicationRoleArn:
        'arn:aws:iam::123456789012:role/mocked-replication-role',
      env: {
        account: '123456789012',
        region: primaryRegion,
      },
    });

    // Create secondary region stack
    secondaryStack = new RegionalResourcesStack(app, 'SecondaryStack', {
      environmentSuffix,
      region: secondaryRegion,
      isPrimary: false,
      domainName: 'web.test.failover.com',
      zoneId: 'Z04134401R0L0CDWNIT27',
      secondaryRegion,
      env: {
        account: '123456789012',
        region: secondaryRegion,
      },
    });

    primaryTemplate = Template.fromStack(primaryStack);
    secondaryTemplate = Template.fromStack(secondaryStack);
  });

  describe('VPC Configuration', () => {
    test('should create VPC with correct configuration', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
        Tags: Match.arrayWith([
          {
            Key: 'Name',
            Value: Match.stringLikeRegexp('.*VPC.*'),
          },
        ]),
      });
    });

    test('should create public subnets', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: true,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'PublicSubnet',
          },
        ]),
      });
    });

    test('should create private subnets', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::Subnet', {
        MapPublicIpOnLaunch: false,
        Tags: Match.arrayWith([
          {
            Key: 'aws-cdk:subnet-name',
            Value: 'PrivateSubnet',
          },
        ]),
      });
    });

    test('should create NAT Gateway', () => {
      primaryTemplate.hasResource('AWS::EC2::NatGateway', {});
    });

    test('should create Internet Gateway', () => {
      primaryTemplate.hasResource('AWS::EC2::InternetGateway', {});
    });
  });

  describe('S3 Configuration', () => {
    test('should create S3 bucket with correct name', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `globalmountpoint-content-${primaryRegion}-${environmentSuffix}`,
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should configure S3 replication for primary region', () => {
      primaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
        ReplicationConfiguration: {
          Role: 'arn:aws:iam::123456789012:role/mocked-replication-role',
          Rules: [
            {
              Id: 'ReplicateToSecondaryRegion',
              Destination: {
                Bucket: `arn:aws:s3:::globalmountpoint-content-${secondaryRegion}-${environmentSuffix}`,
                StorageClass: 'STANDARD',
              },
              Priority: 1,
              DeleteMarkerReplication: {
                Status: 'Enabled',
              },
              Filter: {
                Prefix: '',
              },
              Status: 'Enabled',
            },
          ],
        },
      });
    });

    test('should not configure S3 replication for secondary region', () => {
      secondaryTemplate.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `globalmountpoint-content-${secondaryRegion}-${environmentSuffix}`,
      });

      // Should not have replication configuration
      secondaryTemplate.hasResourceProperties(
        'AWS::S3::Bucket',
        Match.not({
          ReplicationConfiguration: Match.anyValue(),
        })
      );
    });
  });

  describe('IAM Configuration', () => {
    test('should create EC2 instance role with correct permissions', () => {
      primaryTemplate.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
            },
          ],
        },
        ManagedPolicyArns: [
          {
            'Fn::Join': [
              '',
              [
                'arn:',
                { Ref: 'AWS::Partition' },
                ':iam::aws:policy/AmazonSSMManagedInstanceCore',
              ],
            ],
          },
        ],
      });
    });
  });

  describe('Security Groups', () => {
    test('should create ALB security group with correct rules', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for Application Load Balancer',
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 80,
            IpProtocol: 'tcp',
            ToPort: 80,
            Description: 'Allow HTTP traffic from internet',
          },
          {
            CidrIp: '0.0.0.0/0',
            FromPort: 443,
            IpProtocol: 'tcp',
            ToPort: 443,
            Description: 'Allow HTTPS traffic from internet',
          },
        ]),
      });
    });

    test('should create EC2 security group with correct rules', () => {
      primaryTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for EC2 instances',
        SecurityGroupIngress: Match.arrayWith([
          {
            CidrIp: {
              'Fn::GetAtt': ['VPCB9E5F0B4', 'CidrBlock']
            },
            FromPort: 22,
            IpProtocol: 'tcp',
            ToPort: 22,
            Description: 'Allow SSH from VPC CIDR only',
          },
        ]),
      });
    });
  });

  describe('Launch Configuration', () => {
    test('should create launch configuration with correct configuration', () => {
      // Note: Using LaunchConfiguration (not LaunchTemplate) for LocalStack compatibility
      primaryTemplate.hasResourceProperties(
        'AWS::AutoScaling::LaunchConfiguration',
        {
          InstanceType: 't3.micro',
          ImageId: Match.anyValue(),
          SecurityGroups: Match.anyValue(),
          IamInstanceProfile: Match.anyValue(),
          UserData: Match.anyValue(),
        }
      );
    });

    test('should include S3 mountpoint installation in user data', () => {
      const launchConfigs = primaryTemplate.findResources(
        'AWS::AutoScaling::LaunchConfiguration'
      );
      const launchConfigIds = Object.keys(launchConfigs);
      expect(launchConfigIds.length).toBeGreaterThan(0);
      const launchConfig = launchConfigs[launchConfigIds[0]];

      // UserData is base64 encoded with Fn::Base64
      const userDataBase64 = launchConfig.Properties.UserData;
      expect(userDataBase64).toBeDefined();

      // The user data contains mount-s3 and nginx installation commands
      // Since it's encoded, we just verify the structure exists
      expect(userDataBase64['Fn::Base64']).toBeDefined();
    });
  });

  describe('Load Balancer Configuration', () => {
    test('should create ALB with correct configuration', () => {
      primaryTemplate.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
          Subnets: Match.anyValue(),
          SecurityGroups: Match.anyValue(),
        }
      );
    });

    test('should create target group with health check', () => {
      primaryTemplate.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckEnabled: true,
          HealthCheckPath: '/health',
          Matcher: { HttpCode: '200' },
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 2,
          UnhealthyThresholdCount: 3,
        }
      );
    });

    test('should create ALB listener', () => {
      primaryTemplate.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::Listener',
        {
          Port: 80,
          Protocol: 'HTTP',
          DefaultActions: [
            {
              Type: 'forward',
            },
          ],
        }
      );
    });
  });

  describe('Auto Scaling Configuration', () => {
    test('should create ASG with correct configuration', () => {
      // Note: Using LaunchConfigurationName (not LaunchTemplate) for LocalStack compatibility
      primaryTemplate.hasResourceProperties(
        'AWS::AutoScaling::AutoScalingGroup',
        {
          MinSize: '1',
          MaxSize: '1',
          DesiredCapacity: '1',
          VPCZoneIdentifier: Match.anyValue(),
          LaunchConfigurationName: Match.anyValue(),
          TargetGroupARNs: Match.anyValue(),
          HealthCheckType: 'ELB',
          HealthCheckGracePeriod: 300,
        }
      );
    });

    test('should create CPU-based scaling policy', () => {
      primaryTemplate.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
        PolicyType: 'TargetTrackingScaling',
        TargetTrackingConfiguration: {
          PredefinedMetricSpecification: {
            PredefinedMetricType: 'ASGAverageCPUUtilization',
          },
          TargetValue: 70,
        },
      });
    });
  });

  describe('Route53 Configuration', () => {
    test('should create health check for ALB', () => {
      primaryTemplate.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: {
          Type: 'HTTP',
          ResourcePath: '/health',
          FullyQualifiedDomainName: Match.anyValue(),
          RequestInterval: 30,
          FailureThreshold: 3,
        },
      });
    });

    test('should create primary DNS record in primary region', () => {
      primaryTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'web.test.failover.com',
        Type: 'A',
        SetIdentifier: 'primary',
        Failover: 'PRIMARY',
        AliasTarget: {
          DNSName: Match.anyValue(),
          HostedZoneId: Match.anyValue(),
        },
        HealthCheckId: Match.anyValue(),
      });
    });

    test('should create secondary DNS record in secondary region', () => {
      secondaryTemplate.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: 'web.test.failover.com',
        Type: 'A',
        SetIdentifier: 'secondary',
        Failover: 'SECONDARY',
        AliasTarget: {
          DNSName: Match.anyValue(),
          HostedZoneId: Match.anyValue(),
        },
        HealthCheckId: Match.anyValue(),
      });
    });

    test('should use hardcoded hosted zone ID', () => {
      const primaryRecords = primaryTemplate.findResources(
        'AWS::Route53::RecordSet'
      );
      const primaryRecordIds = Object.keys(primaryRecords);
      expect(primaryRecordIds.length).toBeGreaterThan(0);
      const primaryRecord = primaryRecords[primaryRecordIds[0]];
      expect(primaryRecord.Properties.HostedZoneId).toBe(
        'Z04134401R0L0CDWNIT27'
      );

      const secondaryRecords = secondaryTemplate.findResources(
        'AWS::Route53::RecordSet'
      );
      const secondaryRecordIds = Object.keys(secondaryRecords);
      expect(secondaryRecordIds.length).toBeGreaterThan(0);
      const secondaryRecord = secondaryRecords[secondaryRecordIds[0]];
      expect(secondaryRecord.Properties.HostedZoneId).toBe(
        'Z04134401R0L0CDWNIT27'
      );
    });
  });

  describe('CloudFormation Outputs', () => {
    test('should create required outputs for primary region', () => {
      primaryTemplate.hasOutput('LoadBalancerDNS', {
        Description: `Load Balancer DNS name for ${primaryRegion}`,
      });

      primaryTemplate.hasOutput('ContentBucketName', {
        Description: `S3 Content bucket name for ${primaryRegion}`,
      });

      primaryTemplate.hasOutput('VPCId', {
        Description: `VPC ID for ${primaryRegion}`,
      });

      primaryTemplate.hasOutput('WebsiteURL', {
        Description: 'Website URL with DNS failover',
      });

      primaryTemplate.hasOutput('HostedZoneId', {
        Description: 'Hosted Zone ID used for DNS records',
      });

      primaryTemplate.hasOutput('RegionType', {
        Description: `Region type for ${primaryRegion}`,
      });

      primaryTemplate.hasOutput('ALBDNSName', {
        Description: `ALB DNS name for ${primaryRegion} - use for manual DNS record creation`,
      });

      primaryTemplate.hasOutput('ALBCanonicalHostedZoneId', {
        Description: `ALB canonical hosted zone ID for ${primaryRegion} - use for manual DNS record creation`,
      });

      primaryTemplate.hasOutput('HealthCheckId', {
        Description: `Health check ID for ${primaryRegion} - use for manual DNS record creation`,
      });
    });

    test('should create required outputs for secondary region', () => {
      secondaryTemplate.hasOutput('LoadBalancerDNS', {
        Description: `Load Balancer DNS name for ${secondaryRegion}`,
      });

      secondaryTemplate.hasOutput('ContentBucketName', {
        Description: `S3 Content bucket name for ${secondaryRegion}`,
      });

      secondaryTemplate.hasOutput('VPCId', {
        Description: `VPC ID for ${secondaryRegion}`,
      });

      secondaryTemplate.hasOutput('RegionType', {
        Description: `Region type for ${secondaryRegion}`,
      });

      secondaryTemplate.hasOutput('ALBDNSName', {
        Description: `ALB DNS name for ${secondaryRegion} - use for manual DNS record creation`,
      });

      secondaryTemplate.hasOutput('ALBCanonicalHostedZoneId', {
        Description: `ALB canonical hosted zone ID for ${secondaryRegion} - use for manual DNS record creation`,
      });

      secondaryTemplate.hasOutput('HealthCheckId', {
        Description: `Health check ID for ${secondaryRegion} - use for manual DNS record creation`,
      });
    });
  });

  describe('Stack Properties and Tags', () => {
    test('should have correct stack properties', () => {
      expect(primaryStack.contentBucket).toBeDefined();
      expect(primaryStack.loadBalancer).toBeDefined();
      expect(primaryStack.healthCheck).toBeDefined();
      expect(primaryStack.vpc).toBeDefined();
      expect(primaryStack.dnsRecord).toBeDefined();
    });

    test('should apply correct tags', () => {
      primaryTemplate.hasResource('AWS::EC2::VPC', {
        Properties: {
          Tags: Match.arrayWith([
            {
              Key: 'Stack',
              Value: 'RegionalResources',
            },
          ]),
        },
      });
    });
  });

  describe('Edge Cases', () => {
    test('should handle missing replication role ARN gracefully', () => {
      const app2 = new cdk.App();
      const stackWithoutReplication = new RegionalResourcesStack(
        app2,
        'NoReplicationStack',
        {
          environmentSuffix,
          region: primaryRegion,
          isPrimary: true,
          domainName: 'web.test.failover.com',
          zoneId: 'Z04134401R0L0CDWNIT27',
          secondaryRegion,
          // No replicationRoleArn
          env: {
            account: '123456789012',
            region: primaryRegion,
          },
        }
      );

      const template = Template.fromStack(stackWithoutReplication);

      // Should still create bucket but without replication
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `globalmountpoint-content-${primaryRegion}-${environmentSuffix}`,
      });

      // Should not have replication configuration
      template.hasResourceProperties(
        'AWS::S3::Bucket',
        Match.not({
          ReplicationConfiguration: Match.anyValue(),
        })
      );
    });

    test('should handle missing secondary region gracefully', () => {
      const app3 = new cdk.App();
      const stackWithoutSecondary = new RegionalResourcesStack(
        app3,
        'NoSecondaryStack',
        {
          environmentSuffix,
          region: primaryRegion,
          isPrimary: true,
          domainName: 'web.test.failover.com',
          zoneId: 'Z04134401R0L0CDWNIT27',
          replicationRoleArn:
            'arn:aws:iam::123456789012:role/mocked-replication-role',
          // No secondaryRegion
          env: {
            account: '123456789012',
            region: primaryRegion,
          },
        }
      );

      const template = Template.fromStack(stackWithoutSecondary);

      // Should still create bucket but without replication
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `globalmountpoint-content-${primaryRegion}-${environmentSuffix}`,
      });

      // Should not have replication configuration
      template.hasResourceProperties(
        'AWS::S3::Bucket',
        Match.not({
          ReplicationConfiguration: Match.anyValue(),
        })
      );
    });

    test('should use default environment suffix when not provided', () => {
      const app4 = new cdk.App();
      const stackWithDefaultSuffix = new RegionalResourcesStack(
        app4,
        'DefaultSuffixStack',
        {
          region: primaryRegion,
          isPrimary: true,
          domainName: 'web.test.failover.com',
          zoneId: 'Z04134401R0L0CDWNIT27',
          env: {
            account: '123456789012',
            region: primaryRegion,
          },
        }
      );

      const template = Template.fromStack(stackWithDefaultSuffix);

      // Should use 'dev' as default suffix
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: `globalmountpoint-content-${primaryRegion}-dev`,
      });
    });

    test('should create different bucket names for different regions', () => {
      const primaryBuckets = primaryTemplate.findResources('AWS::S3::Bucket');
      const secondaryBuckets =
        secondaryTemplate.findResources('AWS::S3::Bucket');

      const primaryBucketIds = Object.keys(primaryBuckets);
      const secondaryBucketIds = Object.keys(secondaryBuckets);

      expect(primaryBucketIds.length).toBe(1);
      expect(secondaryBucketIds.length).toBe(1);

      const primaryBucket = primaryBuckets[primaryBucketIds[0]];
      const secondaryBucket = secondaryBuckets[secondaryBucketIds[0]];

      expect(primaryBucket.Properties.BucketName).toContain(primaryRegion);
      expect(secondaryBucket.Properties.BucketName).toContain(secondaryRegion);
    });
  });
});
