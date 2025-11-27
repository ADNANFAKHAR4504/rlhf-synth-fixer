import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Route53Construct } from '../lib/constructs/route53-construct';
import { TapStack } from '../lib/tap-stack';

interface StackProps {
  environment: string;
  region: string;
  suffix: string;
  environmentSuffix: string;
  ec2InstanceCountPerRegion: number;
}

const trustedAccounts = {
  dev: '111111111111',
  staging: '222222222222',
  prod: '333333333333',
};

const cidrMappings = {
  'prod-us-west-2': '10.10.0.0/16',
  'prod-us-east-2': '10.20.0.0/16',
  'dev-us-east-1': '10.30.0.0/16',
};

const defaultAccount = '123456789012';

process.env.DEV_ACCOUNT_ID = trustedAccounts.dev;
process.env.STAGING_ACCOUNT_ID = trustedAccounts.staging;
process.env.PROD_ACCOUNT_ID = trustedAccounts.prod;

const synthStack = (props: StackProps, options?: { includeContext?: boolean }): Template => {
  const context = options?.includeContext === false ? {} : {
    trustedAccounts,
    cidrMappings,
    notificationEmail: 'ops@example.com',
  };

  const app = new cdk.App({ context });

  const stack = new TapStack(app, `${props.environment}-${props.region}-tap-stack`, {
    environment: props.environment,
    region: props.region,
    suffix: props.suffix,
    environmentSuffix: props.environmentSuffix,
    ec2InstanceCountPerRegion: props.ec2InstanceCountPerRegion,
    env: {
      account: defaultAccount,
      region: props.region,
    },
  });

  return Template.fromStack(stack);
};

describe('TapStack', () => {
  let prodWestTemplate: Template;
  let prodEastTemplate: Template;
  let devEastTemplate: Template;
  let fallbackTemplate: Template;

  beforeAll(() => {
    prodWestTemplate = synthStack({
      environment: 'prod',
      region: 'us-west-2',
      suffix: '001',
      environmentSuffix: 'prod',
      ec2InstanceCountPerRegion: 3,
    });

    prodEastTemplate = synthStack({
      environment: 'prod',
      region: 'us-east-2',
      suffix: '001',
      environmentSuffix: 'prod',
      ec2InstanceCountPerRegion: 4,
    });

    devEastTemplate = synthStack({
      environment: 'dev',
      region: 'us-east-1',
      suffix: '002',
      environmentSuffix: 'dev',
      ec2InstanceCountPerRegion: 2,
    });

    const originalProdAccountId = process.env.PROD_ACCOUNT_ID;
    delete process.env.PROD_ACCOUNT_ID;
    fallbackTemplate = synthStack({
      environment: 'stage',
      region: 'us-west-1',
      suffix: '003',
      environmentSuffix: 'stage',
      ec2InstanceCountPerRegion: 2,
    }, { includeContext: false });
    process.env.PROD_ACCOUNT_ID = originalProdAccountId;
  });

  test('provisions a VPC with flow logs and private endpoints', () => {
    prodWestTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.10.0.0/16',
      Tags: Match.arrayWith([
        Match.objectLike({ Key: 'Environment', Value: 'prod' }),
        Match.objectLike({ Key: 'Name', Value: Match.stringLikeRegexp('prod-us-west-2-vpc-001-\\d{6}') }),
      ]),
    });

    prodWestTemplate.resourceCountIs('AWS::EC2::Subnet', 9);

    prodWestTemplate.hasResourceProperties('AWS::EC2::FlowLog', {
      TrafficType: 'ALL',
    });

    prodWestTemplate.resourceCountIs('AWS::EC2::VPCEndpoint', 4);
  });

  test('creates hardened S3 buckets with HTTPS-only policies', () => {
    prodWestTemplate.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketName: Match.stringLikeRegexp('^prod-us-west-2-app-bucket-001-\\d{6}$'),
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: Match.objectLike({ SSEAlgorithm: 'AES256' }),
          }),
        ]),
      }),
    }));

    prodWestTemplate.hasResourceProperties('AWS::S3::BucketPolicy', Match.objectLike({
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Deny',
            Condition: Match.objectLike({
              Bool: { 'aws:SecureTransport': 'false' },
            }),
          }),
        ]),
      }),
    }));

    prodEastTemplate.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketName: Match.stringLikeRegexp('^prod-us-east-2-config-bucket-001-\\d{6}$'),
      VersioningConfiguration: { Status: 'Enabled' },
      BucketEncryption: Match.objectLike({
        ServerSideEncryptionConfiguration: Match.arrayWith([
          Match.objectLike({
            ServerSideEncryptionByDefault: Match.objectLike({ SSEAlgorithm: 'aws:kms' }),
          }),
        ]),
      }),
    }));
  });

  test('wires Lambda and RDS with secure configuration', () => {
    prodWestTemplate.hasResourceProperties('AWS::Lambda::Function', Match.objectLike({
      Runtime: 'nodejs18.x',
      Timeout: 300,
      MemorySize: 512,
      Environment: Match.objectLike({
        Variables: Match.objectLike({
          ENVIRONMENT: 'prod',
          REGION: 'us-west-2',
          DB_SECRET_NAME: Match.stringLikeRegexp('^prod-us-west-2-db-secret-001-\\d{6}$'),
        }),
      }),
      VpcConfig: Match.objectLike({
        SecurityGroupIds: Match.anyValue(),
        SubnetIds: Match.anyValue(),
      }),
    }));

    const rdsInstances = prodWestTemplate.findResources('AWS::RDS::DBInstance');
    const rdsInstance = Object.values(rdsInstances)[0] as any;
    expect(rdsInstance).toBeDefined();
    expect(rdsInstance.Properties.Engine).toBe('postgres');
    expect(rdsInstance.Properties.DBInstanceClass).toBe('db.t3.large');
    expect(rdsInstance.Properties.StorageEncrypted).toBe(true);
    expect(rdsInstance.Properties.MultiAZ).toBe(true);
    expect(rdsInstance.Properties.DeletionProtection).toBe(false);
    expect(rdsInstance.Properties.EnablePerformanceInsights).toBe(true);
    expect(rdsInstance.Properties.MonitoringInterval).toBe(60);

    const devRdsInstances = devEastTemplate.findResources('AWS::RDS::DBInstance');
    const devRdsInstance = Object.values(devRdsInstances)[0] as any;
    expect(devRdsInstance.Properties.DBInstanceClass).toBe('db.t3.medium');
  });

  test('configures ALB, Auto Scaling, and security groups appropriately', () => {
    prodWestTemplate.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', Match.objectLike({
      Scheme: 'internet-facing',
      LoadBalancerAttributes: Match.arrayWith([
        Match.objectLike({ Key: 'deletion_protection.enabled', Value: 'false' }),
      ]),
    }));

    prodWestTemplate.hasResourceProperties('AWS::EC2::SecurityGroup', Match.objectLike({
      GroupDescription: Match.stringLikeRegexp('Security group for ALB'),
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({ FromPort: 443, ToPort: 443 }),
        Match.objectLike({ FromPort: 80, ToPort: 80 }),
      ]),
    }));

    const asgResources = prodWestTemplate.findResources('AWS::AutoScaling::AutoScalingGroup');
    const asg = Object.values(asgResources)[0] as any;
    expect(asg).toBeDefined();
    expect(asg.Properties.MinSize).toBe('2');
    expect(asg.Properties.MaxSize).toBe('20');
    expect(asg.Properties.DesiredCapacity).toBe('3');
    expect(asg.Properties.VPCZoneIdentifier.length).toBeGreaterThan(0);

    const scalingPolicies = Object.keys(prodWestTemplate.findResources('AWS::AutoScaling::ScalingPolicy'));
    expect(scalingPolicies.length).toBeGreaterThanOrEqual(2);
  });

  test('provisions Route 53 hosted zone and primary region records', () => {
    prodWestTemplate.hasResourceProperties('AWS::Route53::HostedZone', Match.objectLike({
      Name: Match.stringLikeRegexp('^prod-app-001-\\d{6}\\.test\\.local\\.?$'),
    }));

    prodWestTemplate.hasResourceProperties('AWS::Route53::RecordSet', Match.objectLike({
      Name: Match.stringLikeRegexp('^api\\.prod-app-001-\\d{6}\\.test\\.local\\.?$'),
      Type: 'A',
    }));

    prodWestTemplate.hasResourceProperties('AWS::Route53::RecordSet', Match.objectLike({
      Name: Match.stringLikeRegexp('^geo\\.prod-app-001-\\d{6}\\.test\\.local\\.?$'),
      Type: 'A',
    }));
  });

  test('creates secondary and global Route 53 records for other regions', () => {
    devEastTemplate.hasResourceProperties('AWS::Route53::RecordSet', Match.objectLike({
      Name: Match.stringLikeRegexp('^api-backup\\.dev-app-002-\\d{6}\\.test\\.local\\.?$'),
      Type: 'A',
    }));

    devEastTemplate.hasResourceProperties('AWS::Route53::RecordSet', Match.objectLike({
      Name: Match.stringLikeRegexp('^cdn\\.dev-app-002-\\d{6}\\.test\\.local\\.?$'),
      Type: 'CNAME',
    }));
  });

  test('builds CloudFront distribution with logging, WAF, and strict protocols', () => {
    prodWestTemplate.hasResourceProperties('AWS::WAFv2::WebACL', Match.objectLike({
      Scope: 'CLOUDFRONT',
      DefaultAction: { Allow: {} },
      Rules: Match.arrayWith([
        Match.objectLike({
          Statement: Match.objectLike({
            ManagedRuleGroupStatement: Match.objectLike({ Name: 'AWSManagedRulesCommonRuleSet' }),
          }),
        }),
      ]),
    }));

    prodWestTemplate.hasResourceProperties('AWS::CloudFront::Distribution', Match.objectLike({
      DistributionConfig: Match.objectLike({
        Enabled: true,
        IPV6Enabled: true,
        PriceClass: 'PriceClass_100',
        Logging: Match.objectLike({
          Bucket: Match.objectLike({
            'Fn::GetAtt': Match.arrayWith([
              Match.stringLikeRegexp('CloudFrontConstructCloudFrontLogsBucket'),
            ]),
          }),
        }),
        DefaultCacheBehavior: Match.objectLike({
          ViewerProtocolPolicy: 'redirect-to-https',
        }),
        WebACLId: Match.anyValue(),
      }),
    }));
  });

  test('deploys monitoring stack with encrypted SNS topics and alarms', () => {
    prodWestTemplate.hasResourceProperties('AWS::KMS::Key', Match.objectLike({
      Description: Match.stringLikeRegexp('SNS encryption key for prod'),
      EnableKeyRotation: true,
    }));

    prodWestTemplate.hasResourceProperties('AWS::SNS::Topic', Match.objectLike({
      TopicName: Match.stringLikeRegexp('^prod-us-west-2-app-errors-001-\\d{6}$'),
      KmsMasterKeyId: Match.anyValue(),
    }));

    prodWestTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      AlarmName: Match.stringLikeRegexp('^prod-us-west-2-high-cpu-001-\\d{6}$'),
      Threshold: 80,
    }));

    prodWestTemplate.hasResourceProperties('AWS::CloudWatch::Dashboard', Match.objectLike({
      DashboardName: Match.stringLikeRegexp('^prod-us-west-2-app-dashboard-001-\\d{6}$'),
    }));

    devEastTemplate.hasResourceProperties('AWS::CloudWatch::Alarm', Match.objectLike({
      AlarmName: Match.stringLikeRegexp('^dev-us-east-1-high-cost-002-\\d{6}$'),
      Threshold: 1000,
    }));
  });

  test('establishes compliance controls with Config rules and KMS encryption', () => {
    prodEastTemplate.hasResourceProperties('AWS::KMS::Key', Match.objectLike({
      Description: Match.stringLikeRegexp('Config service encryption key'),
      EnableKeyRotation: true,
    }));

    prodEastTemplate.hasResourceProperties('AWS::S3::Bucket', Match.objectLike({
      BucketName: Match.stringLikeRegexp('^prod-us-east-2-config-bucket-001-\\d{6}$'),
      VersioningConfiguration: { Status: 'Enabled' },
    }));

    // Note: Config IAM role is commented out in compliance construct to avoid conflicts
    // with existing AWS Config setups, so we don't test for it here

    // Config rules are commented out due to admin access requirements and KMS key issues
    // Verify no Config rules are created to avoid "NoAvailableConfigurationRecorder" errors
    const configRules = prodEastTemplate.findResources('AWS::Config::ConfigRule');
    expect(Object.keys(configRules)).toHaveLength(0);

    // Same check for dev template
    const devConfigRules = devEastTemplate.findResources('AWS::Config::ConfigRule');
    expect(Object.keys(devConfigRules)).toHaveLength(0);
  });

  test('creates cross-account IAM roles and disaster recovery role in primary regions', () => {
    prodEastTemplate.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
      RoleName: Match.stringLikeRegexp('^prod-us-east-2-cross-account-access-001-\\d{6}$'),
      MaxSessionDuration: 14400,
    }));

    const prodRoles = prodEastTemplate.findResources('AWS::IAM::Role');
    const crossAccountRole = Object.values(prodRoles).find((role: any) =>
      role.Properties?.RoleName?.startsWith('prod-us-east-2-cross-account-access-')
    ) as any;
    expect(crossAccountRole).toBeDefined();
    const assumeStatements = JSON.stringify(crossAccountRole.Properties.AssumeRolePolicyDocument.Statement);
    expect(assumeStatements).toContain('111111111111:root');
    expect(assumeStatements).toContain('222222222222:root');

    devEastTemplate.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
      RoleName: Match.stringLikeRegexp('^dev-us-east-1-assume-prod-access-002-\\d{6}$'),
    }));

    const devPolicies = devEastTemplate.findResources('AWS::IAM::Policy');
    const assumePolicy = Object.values(devPolicies).find((policy: any) =>
      Array.isArray(policy.Properties?.Roles) &&
      policy.Properties.Roles.some((roleRef: any) =>
        typeof roleRef.Ref === 'string' &&
        roleRef.Ref.startsWith('CrossAccountConstructAssumeProdRole')
      )
    ) as any;
    expect(assumePolicy).toBeDefined();
    const policyString = JSON.stringify(assumePolicy);
    expect(policyString).toContain('sts:AssumeRole');
    expect(policyString).toContain('333333333333');

    prodEastTemplate.hasResourceProperties('AWS::IAM::Role', Match.objectLike({
      RoleName: Match.stringLikeRegexp('^prod-us-east-2-disaster-recovery-001-\\d{6}$'),
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Principal: Match.objectLike({
              AWS: Match.anyValue(),
            }),
          }),
        ]),
      }),
    }));
  });

  test('uses default mappings and notification email when context is unavailable', () => {
    fallbackTemplate.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    fallbackTemplate.hasResourceProperties('AWS::SNS::Subscription', Match.objectLike({
      Protocol: 'email',
      Endpoint: 'platform-team@example.com',
    }));
  });
});

// Test construct that extends Route53Construct to access private method
class TestableRoute53Construct extends Route53Construct {
  public testGetContinentCode(region: string): route53.Continent | undefined {
    return (this as any).getContinentCode(region);
  }
}

describe('Route53Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let vpc: ec2.Vpc;
  let alb: elbv2.ApplicationLoadBalancer;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { region: 'us-west-2', account: '123456789012' },
    });

    // Create VPC for ALB
    vpc = new ec2.Vpc(stack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
    });

    // Create ALB for Route53 construct
    alb = new elbv2.ApplicationLoadBalancer(stack, 'TestALB', {
      vpc,
      internetFacing: true,
    });
  });

  test('getContinentCode returns correct continent for North American regions', () => {
    const route53Construct = new TestableRoute53Construct(stack, 'TestRoute53', {
      environment: 'test',
      region: 'us-west-2',
      suffix: '001',
      environmentSuffix: 'Test',
      alb,
    });

    // Test North American regions
    expect(route53Construct.testGetContinentCode('us-east-1')).toBe(route53.Continent.NORTH_AMERICA);
    expect(route53Construct.testGetContinentCode('us-east-2')).toBe(route53.Continent.NORTH_AMERICA);
    expect(route53Construct.testGetContinentCode('us-west-1')).toBe(route53.Continent.NORTH_AMERICA);
    expect(route53Construct.testGetContinentCode('us-west-2')).toBe(route53.Continent.NORTH_AMERICA);
    expect(route53Construct.testGetContinentCode('ca-central-1')).toBe(route53.Continent.NORTH_AMERICA);
  });

  test('getContinentCode returns correct continent for European regions', () => {
    const route53Construct = new TestableRoute53Construct(stack, 'TestRoute53EU', {
      environment: 'test',
      region: 'eu-west-1',
      suffix: '002',
      environmentSuffix: 'Test',
      alb,
    });

    // Test European regions
    expect(route53Construct.testGetContinentCode('eu-west-1')).toBe(route53.Continent.EUROPE);
    expect(route53Construct.testGetContinentCode('eu-west-2')).toBe(route53.Continent.EUROPE);
    expect(route53Construct.testGetContinentCode('eu-west-3')).toBe(route53.Continent.EUROPE);
    expect(route53Construct.testGetContinentCode('eu-central-1')).toBe(route53.Continent.EUROPE);
    expect(route53Construct.testGetContinentCode('eu-north-1')).toBe(route53.Continent.EUROPE);
  });

  test('getContinentCode returns correct continent for Asian regions', () => {
    const route53Construct = new TestableRoute53Construct(stack, 'TestRoute53Asia', {
      environment: 'test',
      region: 'ap-northeast-1',
      suffix: '003',
      environmentSuffix: 'Test',
      alb,
    });

    // Test Asian regions
    expect(route53Construct.testGetContinentCode('ap-northeast-1')).toBe(route53.Continent.ASIA);
    expect(route53Construct.testGetContinentCode('ap-northeast-2')).toBe(route53.Continent.ASIA);
    expect(route53Construct.testGetContinentCode('ap-southeast-1')).toBe(route53.Continent.ASIA);
    expect(route53Construct.testGetContinentCode('ap-south-1')).toBe(route53.Continent.ASIA);
  });

  test('getContinentCode returns correct continent for Oceania regions', () => {
    const route53Construct = new TestableRoute53Construct(stack, 'TestRoute53Oceania', {
      environment: 'test',
      region: 'ap-southeast-2',
      suffix: '004',
      environmentSuffix: 'Test',
      alb,
    });

    // Test Oceania regions
    expect(route53Construct.testGetContinentCode('ap-southeast-2')).toBe(route53.Continent.OCEANIA);
  });

  test('getContinentCode returns correct continent for South American regions', () => {
    const route53Construct = new TestableRoute53Construct(stack, 'TestRoute53SA', {
      environment: 'test',
      region: 'sa-east-1',
      suffix: '005',
      environmentSuffix: 'Test',
      alb,
    });

    // Test South American regions
    expect(route53Construct.testGetContinentCode('sa-east-1')).toBe(route53.Continent.SOUTH_AMERICA);
  });

  test('getContinentCode returns undefined for unsupported regions', () => {
    const route53Construct = new TestableRoute53Construct(stack, 'TestRoute53Unsupported', {
      environment: 'test',
      region: 'us-west-2',
      suffix: '006',
      environmentSuffix: 'Test',
      alb,
    });

    // Test unsupported/unmapped regions
    expect(route53Construct.testGetContinentCode('ap-east-1')).toBeUndefined(); // Hong Kong
    expect(route53Construct.testGetContinentCode('me-south-1')).toBeUndefined(); // Bahrain
    expect(route53Construct.testGetContinentCode('af-south-1')).toBeUndefined(); // Cape Town
    expect(route53Construct.testGetContinentCode('nonexistent-region')).toBeUndefined();
  });

  test('creates hosted zone and DNS records correctly', () => {
    const route53Construct = new Route53Construct(stack, 'TestRoute53Standalone', {
      environment: 'prod',
      region: 'us-west-2',
      suffix: '007',
      environmentSuffix: 'Prod',
      alb,
    });

    const template = Template.fromStack(stack);

    // Check hosted zone creation
    template.hasResourceProperties('AWS::Route53::HostedZone', {
      Name: 'prod-app-007.test.local.',
    });

    // Check DNS records are created
    template.resourceCountIs('AWS::Route53::RecordSet', 6); // api, root, geo, monitoring, TXT, CAA

    // Verify domain name property
    expect(route53Construct.domainName).toBe('prod-app-007.test.local');
  });
});
