import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { TapStack } from '../lib/tap-stack';
import { VpcConstruct } from '../lib/constructs/vpc-construct';
import { DatabaseConstruct } from '../lib/constructs/database-construct';
import { ComputeConstruct } from '../lib/constructs/compute-construct';
import { ServerlessConstruct } from '../lib/constructs/serverless-construct';
import { MonitoringConstruct } from '../lib/constructs/monitoring-construct';
import { IamConstruct } from '../lib/constructs/iam-construct';
import { DnsConstruct } from '../lib/constructs/dns-construct';
import { NamingUtil, TimestampUtil } from '../lib/utils/naming';
import { CidrAllocator } from '../lib/utils/cidr-allocator';
import { AppConfig } from '../lib/interfaces/config-interfaces';

const baseEnv = { env: { account: '123456789012', region: 'us-east-1' } };

const createStack = (id: string): cdk.Stack => {
  const app = new cdk.App();
  return new cdk.Stack(app, id, baseEnv);
};

const createConfig = (environment: string, overrides: Partial<AppConfig> = {}): AppConfig => ({
  environment,
  environmentSuffix: overrides.environmentSuffix ?? 'unit',
  region: overrides.region ?? 'us-east-1',
  account: overrides.account ?? '123456789012',
  timestamp: overrides.timestamp ?? '20240101-120000',
  tags: overrides.tags ?? {
    'iac-rlhf-amazon': 'true',
    Environment: environment,
    ManagedBy: 'CDK',
    Application: 'tap-unit'
  }
});

describe('Utility helpers', () => {
  const config = createConfig('staging', {
    environmentSuffix: 'stg',
    timestamp: '20240102-101112'
  });

  test('NamingUtil generates consistent naming patterns', () => {
    expect(NamingUtil.generateResourceName(config, 'alb')).toBe('staging-alb-stg-20240102-101112');
    expect(NamingUtil.generateResourceName(config, 'alb', false)).toBe('staging-alb-stg');
    expect(NamingUtil.generateBucketName(config, 'data')).toBe('staging-data-stg-20240102-101112');
    expect(NamingUtil.generateRoleName(config, 'lambda')).toBe('staging-lambda-role-stg');
    expect(NamingUtil.generateSecretName(config, 'app')).toBe('staging/app/stg');
    expect(NamingUtil.generateOutputKey(config, 'BucketName')).toBe('stgBucketName');
  });

  test('TimestampUtil formats timestamps as expected', () => {
    const full = TimestampUtil.generateTimestamp();
    expect(full).toMatch(/^\d{8}-\d{6}$/);

    const short = TimestampUtil.generateShortTimestamp();
    expect(short).toHaveLength(8);
    expect(short).toMatch(/^[a-z0-9]+$/);
  });

  test('CidrAllocator allocates deterministic CIDRs', () => {
    expect(CidrAllocator.allocateVpcCidr('prod')).toBe('10.40.0.0/16');

    const fallback = CidrAllocator.allocateVpcCidr('custom-env');
    expect(fallback).toMatch(/^10\.(\d|[1-9]\d|1\d{2}|2[0-5]\d)\.0\.0\/16$/);
    expect(CidrAllocator.allocateVpcCidr('custom-env')).toBe(fallback);

    const subnets = CidrAllocator.allocateSubnetCidrs('10.40.0.0/16');
    expect(subnets.publicCidrs).toEqual(['10.40.1.0/24', '10.40.2.0/24', '10.40.3.0/24']);
    expect(subnets.privateCidrs).toEqual(['10.40.11.0/24', '10.40.12.0/24', '10.40.13.0/24']);
    expect(subnets.databaseCidrs).toEqual(['10.40.21.0/24', '10.40.22.0/24', '10.40.23.0/24']);
  });
});

describe('VpcConstruct', () => {
  test('enables production networking features', () => {
    const stack = createStack('VpcProdStack');
    const config = createConfig('prod', { environmentSuffix: 'p01' });

    new VpcConstruct(stack, 'Subject', { config });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.40.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
      Tags: Match.arrayWith([Match.objectLike({ Key: 'Name', Value: 'prod-vpc-p01' })])
    });

    template.resourceCountIs('AWS::EC2::NatGateway', 3);
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
    template.resourceCountIs('AWS::EC2::FlowLog', 1);

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/vpc/flowlogs/prod-vpc-p01',
      RetentionInDays: 30
    });
  });

  test('optimizes non-production networking', () => {
    const stack = createStack('VpcDevStack');
    const config = createConfig('dev', { environmentSuffix: 'd01' });

    new VpcConstruct(stack, 'Subject', { config });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.10.0.0/16'
    });

    template.resourceCountIs('AWS::EC2::NatGateway', 1);
    template.resourceCountIs('AWS::EC2::VPCEndpoint', 2);

    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7
    });
  });
});

describe('DatabaseConstruct', () => {
  test('creates production-grade database configuration', () => {
    const stack = createStack('DbProdStack');
    const config = createConfig('prod', { environmentSuffix: 'p01' });
    const vpcConstruct = new VpcConstruct(stack, 'ProdVpc', { config });
    new DatabaseConstruct(stack, 'Subject', { config, vpc: vpcConstruct.vpc });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SecretsManager::Secret', {
      Name: 'prod/rds-postgres/p01',
      GenerateSecretString: Match.objectLike({
        SecretStringTemplate: '{"username":"dbadmin","engine":"postgres","port":5432,"dbname":"maindb"}',
        GenerateStringKey: 'password',
        PasswordLength: 32
      })
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
      GroupDescription: 'Security group for PostgreSQL RDS instance',
      SecurityGroupEgress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '255.255.255.255/32',
          IpProtocol: 'icmp'
        })
      ])
    }));

    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      DBInstanceClass: 'db.t4g.large',
      AllocatedStorage: '100',
      MultiAZ: true,
      StorageEncrypted: true,
      EnablePerformanceInsights: true,
      BackupRetentionPeriod: 30,
      PubliclyAccessible: false,
      DeletionProtection: false,
      SourceDBInstanceIdentifier: Match.absent()
    }));

    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      DBInstanceClass: 'db.t4g.medium',
      SourceDBInstanceIdentifier: Match.anyValue()
    }));

    template.resourceCountIs('AWS::RDS::DBInstance', 2);
  });

  test('omits production-only settings outside prod', () => {
    const stack = createStack('DbDevStack');
    const config = createConfig('dev', { environmentSuffix: 'd01' });
    const vpcConstruct = new VpcConstruct(stack, 'DevVpc', { config });
    new DatabaseConstruct(stack, 'Subject', { config, vpc: vpcConstruct.vpc });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::RDS::DBInstance', 1);
    template.hasResourceProperties('AWS::RDS::DBInstance', Match.objectLike({
      DBInstanceClass: 'db.t4g.micro',
      MultiAZ: false,
      EnablePerformanceInsights: false,
      BackupRetentionPeriod: 7
    }));
  });
});

describe('ComputeConstruct', () => {
  test('configures production capacity and monitoring', () => {
    const stack = createStack('ComputeProdStack');
    const config = createConfig('prod', {
      environmentSuffix: 'p01',
      timestamp: 'tsprod01'
    });
    const vpc = new ec2.Vpc(stack, 'ComputeVpc', { maxAzs: 2 });
    const secret = new secretsmanager.Secret(stack, 'DatabaseSecret');

    new ComputeConstruct(stack, 'Subject', { config, vpc, databaseSecret: secret });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 8080,
      Protocol: 'HTTP',
      HealthCheckPath: '/api/health',
      HealthCheckIntervalSeconds: 30,
      HealthCheckTimeoutSeconds: 10
    });

    template.hasResourceProperties('AWS::EC2::LaunchTemplate', Match.objectLike({
      LaunchTemplateName: 'prod-lt-p01',
      LaunchTemplateData: Match.objectLike({
        InstanceType: 't3.medium',
        MetadataOptions: { HttpTokens: 'required' },
        Monitoring: { Enabled: true },
        BlockDeviceMappings: Match.arrayWith([
          Match.objectLike({
            DeviceName: '/dev/xvda',
            Ebs: Match.objectLike({
              Encrypted: true,
              VolumeType: 'gp3',
              VolumeSize: 30,
              DeleteOnTermination: true
            })
          })
        ])
      })
    }));

    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      DesiredCapacity: '4',
      AutoScalingGroupName: 'prod-asg-p01'
    });
  });

  test('scales down configuration for non-production', () => {
    const stack = createStack('ComputeDevStack');
    const config = createConfig('dev', {
      environmentSuffix: 'd01',
      timestamp: 'tsdev01'
    });
    const vpc = new ec2.Vpc(stack, 'ComputeDevVpc', { maxAzs: 2 });
    const secret = new secretsmanager.Secret(stack, 'DatabaseSecretDev');

    new ComputeConstruct(stack, 'Subject', { config, vpc, databaseSecret: secret });
    const template = Template.fromStack(stack);

    const launchTemplate = Object.values(template.findResources('AWS::EC2::LaunchTemplate'))[0] as any;
    expect(launchTemplate.Properties.LaunchTemplateData.InstanceType).toBe('t3.small');
    expect(launchTemplate.Properties.LaunchTemplateData.Monitoring).toEqual({ Enabled: false });

    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      DesiredCapacity: '2',
      AutoScalingGroupName: 'dev-asg-d01'
    });
  });
});

describe('ServerlessConstruct', () => {
  test('enforces strict storage controls in production', () => {
    const stack = createStack('ServerlessProdStack');
    const config = createConfig('prod', {
      environmentSuffix: 'p01',
      timestamp: 'tsprod01'
    });
    const vpc = new ec2.Vpc(stack, 'ServerlessVpc', { maxAzs: 2 });

    new ServerlessConstruct(stack, 'Subject', { config, vpc });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({ ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } })
        ])
      }),
      VersioningConfiguration: { Status: 'Enabled' },
      BucketName: 'prod-data-p01-tsprod01',
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true
      },
      LifecycleConfiguration: Match.objectLike({
        Rules: Match.arrayWith([
          Match.objectLike({
            Transitions: Match.arrayWith([
              Match.objectLike({ StorageClass: 'STANDARD_IA', TransitionInDays: 30 }),
              Match.objectLike({ StorageClass: 'GLACIER', TransitionInDays: 90 })
            ])
          })
        ])
      })
    }));

    template.hasResourceProperties('AWS::DynamoDB::Table', {
      BillingMode: 'PAY_PER_REQUEST',
      TableName: 'prod-processing-results-p01',
      PointInTimeRecoverySpecification: { PointInTimeRecoveryEnabled: true }
    });

    template.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      FunctionName: 'prod-log-analyzer-p01',
      MemorySize: 512,
      Timeout: 300,
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          ERROR_TOPIC_ARN: Match.anyValue(),
          PROCESSING_TABLE_NAME: { Ref: Match.anyValue() },
          ENVIRONMENT: 'prod',
          REGION: 'us-east-1'
        })
      })
    }));
  });

  test('uses cost-aware defaults outside production', () => {
    const stack = createStack('ServerlessDevStack');
    const config = createConfig('dev', {
      environmentSuffix: 'd01',
      timestamp: 'tsdev01'
    });
    const vpc = new ec2.Vpc(stack, 'ServerlessDevVpc', { maxAzs: 2 });

    new ServerlessConstruct(stack, 'Subject', { config, vpc });
    const template = Template.fromStack(stack);

    const table = Object.values(template.findResources('AWS::DynamoDB::Table'))[0] as any;
    expect(table.Properties.TableName).toBe('dev-processing-results-d01');
    expect(table.Properties.PointInTimeRecoverySpecification).toEqual({
      PointInTimeRecoveryEnabled: false
    });
  });
});

describe('IamConstruct', () => {
  test('creates deployment role with broad automation permissions', () => {
    const stack = createStack('IamStack');
    const config = createConfig('staging', { environmentSuffix: 's01' });

    new IamConstruct(stack, 'Subject', { config });
    const template = Template.fromStack(stack);

    const roleResource = Object.values(template.findResources('AWS::IAM::Role'))[0] as any;
    expect(roleResource.Properties.RoleName).toBe('staging-deployment-role-s01');

    const principals = roleResource.Properties.AssumeRolePolicyDocument.Statement.map((stmt: any) => stmt.Principal);
    expect(principals.some((principal: any) => principal.Service === 'codebuild.amazonaws.com')).toBe(true);
    expect(principals.some((principal: any) => principal.Service === 'codepipeline.amazonaws.com')).toBe(true);
    expect(principals.some((principal: any) => principal.AWS && principal.AWS['Fn::Join'])).toBe(true);

    const tags = roleResource.Properties.Tags.reduce((acc: Record<string, string>, tag: any) => {
      acc[tag.Key] = tag.Value;
      return acc;
    }, {});
    expect(tags['iac-rlhf-amazon']).toBe('yes');
    expect(tags.Environment).toBe('staging');
    expect(tags.ManagedBy).toBe('CDK');

    const policies = Object.values(template.findResources('AWS::IAM::Policy')) as any[];
    expect(policies.length).toBeGreaterThan(0);
    const actions = policies.flatMap((policy: any) =>
      policy.Properties.PolicyDocument.Statement.flatMap((stmt: any) =>
        Array.isArray(stmt.Action) ? stmt.Action : [stmt.Action]
      )
    );
    expect(actions).toEqual(expect.arrayContaining([
      'cloudformation:*',
      'iam:*',
      's3:*',
      'lambda:*'
    ]));
  });
});

describe('MonitoringConstruct', () => {
  test('enables production alerting and subscriptions', () => {
    const stack = createStack('MonitoringProdStack');
    const config = createConfig('prod', { environmentSuffix: 'p01' });

    new MonitoringConstruct(stack, 'Subject', {
      config,
      asgName: 'prod-asg-p01',
      albArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/prod-alb/1234567890abcdef'
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::SNS::Topic', {
      TopicName: 'prod-alarms-p01'
    });

    template.resourceCountIs('AWS::SNS::Subscription', 1);

    template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      AlarmName: 'prod-high-cpu-p01',
      AlarmDescription: Match.stringLikeRegexp('High CPU'),
      MetricName: 'CPUUtilization',
      Namespace: 'AWS/EC2',
      Threshold: 80
    }));

    const bucketResource = Object.values(template.findResources('AWS::S3::Bucket'))[0] as any;
    expect(bucketResource.Properties.BucketName).toBe(NamingUtil.generateBucketName(config, 'aws-config'));
  });

  test('skips email subscription outside production', () => {
    const stack = createStack('MonitoringDevStack');
    const config = createConfig('dev', { environmentSuffix: 'd01' });

    new MonitoringConstruct(stack, 'Subject', {
      config,
      asgName: 'dev-asg-d01',
      albArn: 'arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/dev-alb/abcdef1234567890'
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::SNS::Subscription', 0);

    template.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      AlarmName: 'dev-unhealthy-targets-d01',
      TreatMissingData: 'notBreaching'
    }));
  });
});

describe('DnsConstruct', () => {
  test('creates CloudFront distribution and private hosted zone', () => {
    const stack = createStack('DnsStack');
    const config = createConfig('prod', { environmentSuffix: 'p01' });
    const vpc = new ec2.Vpc(stack, 'DnsVpc', { maxAzs: 2 });

    new DnsConstruct(stack, 'Subject', {
      config,
      albDnsName: 'internal-alb.aws',
      vpc
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::Route53::HostedZone', Match.objectLike({
      Name: 'prod.internal.',
      VPCs: Match.arrayWith([
        Match.objectLike({
          VPCRegion: 'us-east-1'
        })
      ])
    }));

    const distribution = Object.values(template.findResources('AWS::CloudFront::Distribution'))[0] as any;
    const configBlock = distribution.Properties.DistributionConfig;
    expect(configBlock.Comment).toBe('CloudFront distribution for prod environment');
    expect(configBlock.DefaultCacheBehavior.ViewerProtocolPolicy).toBe('redirect-to-https');
    expect(configBlock.PriceClass).toBe('PriceClass_100');
    const cacheBehaviors = configBlock.CacheBehaviors ?? [];
    expect(cacheBehaviors).toEqual(expect.arrayContaining([
      expect.objectContaining({
        PathPattern: '/api/*',
        ViewerProtocolPolicy: 'redirect-to-https'
      })
    ]));
    expect(configBlock.DefaultCacheBehavior.CachePolicyId).toBeDefined();
  });
});

describe('TapStack', () => {
  beforeAll(() => {
    jest.spyOn(TimestampUtil, 'generateShortTimestamp').mockReturnValue('stubtime');
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  test('wires together constructs and exports key resources', () => {
    const app = new cdk.App();
    const stack = new TapStack(app, 'TapStackUnderTest', {
      ...baseEnv,
      environment: 'prod',
      environmentSuffix: 'stack'
    });
    const template = Template.fromStack(stack);

    template.resourceCountIs('AWS::EC2::VPC', 1);
    template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
    template.resourceCountIs('AWS::RDS::DBInstance', 2);
    template.resourceCountIs('AWS::CloudFront::Distribution', 1);
    const lambdaFunctions = Object.values(template.findResources('AWS::Lambda::Function')) as any[];
    expect(lambdaFunctions.length).toBeGreaterThanOrEqual(1);
    expect(lambdaFunctions.some((fn) => fn.Properties.FunctionName === 'prod-log-analyzer-stack')).toBe(true);

    template.hasOutput('stackVpcId', {
      Value: Match.anyValue(),
      Export: { Name: 'stack-vpc-id' },
      Description: 'VPC ID'
    });
    template.hasOutput('stackAlbDnsName', {
      Export: { Name: 'stack-alb-dns-name' }
    });
    template.hasOutput('stackCloudFrontDomain', {
      Export: { Name: 'stack-cloudfront-domain' }
    });
  });
});
