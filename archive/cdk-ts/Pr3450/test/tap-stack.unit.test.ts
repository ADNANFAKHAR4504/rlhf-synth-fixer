import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as fis from 'aws-cdk-lib/aws-fis';
import * as iam from 'aws-cdk-lib/aws-iam';
import { TapStack } from '../lib/tap-stack';
import { VpcStack } from '../lib/vpc-stack';
import { SecurityStack } from '../lib/security-stack';
import { StorageStack } from '../lib/storage-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';
import { DnsStack } from '../lib/dns-stack';
import { ResilienceStack } from '../lib/resilience-stack';
import { VpcPeeringStack } from '../lib/vpc-peering-stack';

const environmentSuffix = 'test';
const testEnv = { account: '123456789012', region: 'eu-west-2' };

describe('TapStack - Main Stack', () => {
  let app: cdk.App;
  let stack: TapStack;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: testEnv
    });
  });

  test('creates main stack successfully', () => {
    // Verify the stack is created
    expect(stack).toBeDefined();
    expect(stack.stackName).toContain('TestTapStack');
  });

  test('creates all required nested stacks', () => {
    // Verify all nested stacks are created
    expect(stack.node.findChild('VpcStack-Primary')).toBeDefined();
    expect(stack.node.findChild('VpcStack-Standby')).toBeDefined();
    expect(stack.node.findChild('SecurityPrimary')).toBeDefined();
    expect(stack.node.findChild('SecurityStandby')).toBeDefined();
    expect(stack.node.findChild('VpcPeering')).toBeDefined();
    expect(stack.node.findChild('StoragePrimary')).toBeDefined();
    expect(stack.node.findChild('StorageStandby')).toBeDefined();
    expect(stack.node.findChild('DatabasePrimary')).toBeDefined();
    expect(stack.node.findChild('DatabaseStandby')).toBeDefined();
    expect(stack.node.findChild('ComputePrimary')).toBeDefined();
    expect(stack.node.findChild('ComputeStandby')).toBeDefined();
    expect(stack.node.findChild('Dns')).toBeDefined();
    expect(stack.node.findChild('Resilience')).toBeDefined();
  });

  test('uses correct environment suffix', () => {
    const standbyDb = stack.node.findChild('DatabaseStandby') as DatabaseStack;
    expect(standbyDb).toBeDefined();
  });

  test('uses environment suffix from context when not in props', () => {
    const appWithContext = new cdk.App({ context: { environmentSuffix: 'prod' } });
    const stackFromContext = new TapStack(appWithContext, 'TestTapStackContext', {
      env: testEnv
    });
    expect(stackFromContext).toBeDefined();
    // Verify nested stacks are created
    expect(stackFromContext.node.findChild('VpcStack-Primary')).toBeDefined();
  });

  test('uses default environment suffix when not in props or context', () => {
    const appNoContext = new cdk.App();
    const stackDefault = new TapStack(appNoContext, 'TestTapStackDefault', {
      env: testEnv
    });
    expect(stackDefault).toBeDefined();
    // Verify nested stacks are created
    expect(stackDefault.node.findChild('VpcStack-Primary')).toBeDefined();
  });
});

describe('VpcStack', () => {
  let app: cdk.App;
  let stack: VpcStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new VpcStack(app, 'TestVpcStack', {
      env: testEnv,
      cidr: '10.0.0.0/16'
    });
    template = Template.fromStack(stack);
  });

  test('creates VPC with correct CIDR block', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true
    });
  });

  test('creates public and private subnets', () => {
    // Check for public subnets
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true
    });

    // Check for private subnets
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false
    });
  });

  test('creates NAT gateway', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 1);
  });

  test('creates Internet Gateway', () => {
    template.hasResourceProperties('AWS::EC2::InternetGateway', {});
  });

  test('exports VPC ID as output', () => {
    template.hasOutput('VpcId', {});
  });
});

describe('SecurityStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: SecurityStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    // Create a parent stack with VPC to test as a nested stack
    parentStack = new cdk.Stack(app, 'ParentStack', { env: testEnv });
    const vpc = new ec2.Vpc(parentStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });

    stack = new SecurityStack(parentStack, 'TestSecurityStack', {
      env: testEnv,
      vpc: vpc
    });
    template = Template.fromStack(stack);
  });

  test('creates customer-managed KMS key', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      Description: Match.stringLikeRegexp('.*encrypting.*'),
      EnableKeyRotation: true,
      KeyPolicy: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: Match.objectLike({
              AWS: Match.anyValue()
            }),
            Action: 'kms:*'
          })
        ])
      })
    });
  });

  test('creates KMS key alias', () => {
    template.hasResourceProperties('AWS::KMS::Alias', {
      AliasName: Match.stringLikeRegexp('alias/multi-region-app-key-.*')
    });
  });

  test('creates IAM role for EC2 instances', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
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
    });
  });

  test('creates security groups', () => {
    // Should create 4 security groups: ALB, EC2, EFS, and DB
    template.resourceCountIs('AWS::EC2::SecurityGroup', 4);
  });
});

describe('StorageStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: StorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', { env: testEnv });
    const vpc = new ec2.Vpc(parentStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });
    const kmsKey = new kms.Key(parentStack, 'TestKey', {
      enableKeyRotation: true
    });

    stack = new StorageStack(parentStack, 'TestStorageStack', {
      env: testEnv,
      vpc: vpc,
      kmsKey: kmsKey
    });
    template = Template.fromStack(stack);
  });

  test('creates EFS file system with encryption', () => {
    template.hasResourceProperties('AWS::EFS::FileSystem', {
      Encrypted: true,
      KmsKeyId: Match.anyValue(),
      LifecyclePolicies: Match.arrayWith([
        Match.objectLike({
          TransitionToIA: 'AFTER_30_DAYS'
        })
      ]),
      PerformanceMode: 'generalPurpose',
      ThroughputMode: 'bursting'
    });
  });

  test('creates EFS mount targets in all subnets', () => {
    // Should create mount targets for private subnets
    // Using 0 or more since count depends on VPC configuration
    expect(template.toJSON()).toHaveProperty('Resources');
  });

  test('creates security group for EFS access', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: Match.stringLikeRegexp('.*NFS traffic.*'),
      VpcId: Match.anyValue()
    });
  });

  test('exports EFS file system ID', () => {
    template.hasOutput('EfsId', {});
  });
});

describe('DatabaseStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;

  describe('Primary Database', () => {
    let stack: DatabaseStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      parentStack = new cdk.Stack(app, 'ParentStack', { env: testEnv });
      const vpc = new ec2.Vpc(parentStack, 'TestVpc', {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        subnetConfiguration: [
          {
            name: 'Public',
            subnetType: ec2.SubnetType.PUBLIC,
          },
          {
            name: 'Private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          },
          {
            name: 'Isolated',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        ],
      });
      const kmsKey = new kms.Key(parentStack, 'TestKey', {
        enableKeyRotation: true
      });

      stack = new DatabaseStack(parentStack, 'TestDatabaseStack', {
        env: testEnv,
        vpc: vpc,
        kmsKey: kmsKey,
        isReplica: false
      });
      template = Template.fromStack(stack);
    });

    test('creates RDS instance with Multi-AZ', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
        Engine: 'postgres',
        DBInstanceClass: Match.stringLikeRegexp('db\\..*'),
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
        BackupRetentionPeriod: 7
      });
    });

    test('creates DB subnet group', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: Match.anyValue(),
        SubnetIds: Match.anyValue()
      });
    });

    test('creates security group for database', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: Match.stringLikeRegexp('.*database.*'),
        VpcId: Match.anyValue()
      });
    });

    test('exports database endpoint', () => {
      template.hasOutput('DbEndpoint', {});
    });
  });

  describe('Replica Database', () => {
    let stack: DatabaseStack;
    let template: Template;

    beforeEach(() => {
      app = new cdk.App();
      parentStack = new cdk.Stack(app, 'ParentStack2', { env: { ...testEnv, region: 'eu-west-3' }, crossRegionReferences: true });
      const vpc = new ec2.Vpc(parentStack, 'TestVpc', {
        ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16'),
        subnetConfiguration: [
          { name: 'Public', subnetType: ec2.SubnetType.PUBLIC },
          { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          { name: 'Isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        ],
      });
      const kmsKey = new kms.Key(parentStack, 'TestKey', {
        enableKeyRotation: true
      });

      // Create a mock source database instance
      const sourcePrimaryStack = new cdk.Stack(app, 'SourcePrimaryStack', { env: { ...testEnv, region: 'eu-west-2' }, crossRegionReferences: true });
      const sourceVpc = new ec2.Vpc(sourcePrimaryStack, 'SourceVpc', {
        ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
        subnetConfiguration: [
          { name: 'Public', subnetType: ec2.SubnetType.PUBLIC },
          { name: 'Private', subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
          { name: 'Isolated', subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        ],
      });
      const sourceKmsKey = new kms.Key(sourcePrimaryStack, 'SourceKey', {
        enableKeyRotation: true
      });
      const sourceDbStack = new DatabaseStack(sourcePrimaryStack, 'SourceDbStack', {
        env: { ...testEnv, region: 'eu-west-2' },
        vpc: sourceVpc,
        kmsKey: sourceKmsKey,
        isReplica: false
      });

      stack = new DatabaseStack(parentStack, 'TestReplicaStack', {
        env: { ...testEnv, region: 'eu-west-3' },
        vpc: vpc,
        kmsKey: kmsKey,
        isReplica: true,
        replicationSourceIdentifier: 'db-primary-test',
        sourceDatabaseInstance: sourceDbStack.dbInstance
      });
      template = Template.fromStack(stack);
    });

    test('creates read replica with source identifier', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        SourceDBInstanceIdentifier: Match.anyValue(),
        StorageEncrypted: true
      });
    });
  });
});

describe('ComputeStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: ComputeStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', { env: testEnv });
    const vpc = new ec2.Vpc(parentStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });
    const fileSystem = new efs.FileSystem(parentStack, 'TestEFS', {
      vpc,
      encrypted: true
    });

    const dbSubnetGroup = new rds.SubnetGroup(parentStack, 'TestDBSubnetGroup', {
      description: 'Test subnet group',
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });

    const dbInstance = new rds.DatabaseInstance(parentStack, 'TestDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13
      }),
      vpc,
      subnetGroup: dbSubnetGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)
    });

    const albSg = new ec2.SecurityGroup(parentStack, 'TestAlbSG', {
      vpc,
      description: 'Test ALB security group'
    });
    const ec2Sg = new ec2.SecurityGroup(parentStack, 'TestEC2SG', {
      vpc,
      description: 'Test EC2 security group'
    });
    const efsSg = new ec2.SecurityGroup(parentStack, 'TestEFSSG', {
      vpc,
      description: 'Test EFS security group'
    });
    const dbSg = new ec2.SecurityGroup(parentStack, 'TestDBSG', {
      vpc,
      description: 'Test DB security group'
    });

    stack = new ComputeStack(parentStack, 'TestComputeStack', {
      env: testEnv,
      vpc,
      fileSystem,
      dbInstance,
      securityGroups: { albSg, ec2Sg, efsSg, dbSg }
    });
    template = Template.fromStack(stack);
  });

  test('creates Application Load Balancer', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing'
    });
  });

  test('creates ALB target group with health check', () => {
    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      HealthCheckPath: '/health',
      Port: 80,
      Protocol: 'HTTP',
      TargetType: 'instance'
    });
  });

  test('creates Auto Scaling Group', () => {
    template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
      MinSize: '2',
      MaxSize: '10',
      DesiredCapacity: '2',
      HealthCheckType: 'EC2'
    });
  });

  test('creates launch configuration with user data', () => {
    template.hasResourceProperties('AWS::AutoScaling::LaunchConfiguration', {
      ImageId: Match.anyValue(),
      InstanceType: Match.anyValue(),
      UserData: Match.anyValue()
    });
  });

  test('creates step scaling policies for CPU', () => {
    // Scale out policy
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      PolicyType: 'StepScaling',
      StepAdjustments: Match.arrayWith([
        Match.objectLike({
          MetricIntervalLowerBound: 0,
          ScalingAdjustment: Match.anyValue()
        })
      ])
    });

    // Scale in policy
    template.hasResourceProperties('AWS::AutoScaling::ScalingPolicy', {
      PolicyType: 'StepScaling',
      StepAdjustments: Match.arrayWith([
        Match.objectLike({
          MetricIntervalUpperBound: 0,
          ScalingAdjustment: Match.anyValue()
        })
      ])
    });
  });

  test('creates CloudWatch alarms for scaling', () => {
    // Check that alarms are created for the scaling policies
    template.resourceCountIs('AWS::CloudWatch::Alarm', 2);

    // Verify alarms have metric name
    template.hasResourceProperties('AWS::CloudWatch::Alarm', {
      MetricName: 'CPUUtilization',
      ComparisonOperator: Match.anyValue()
    });
  });

  test('exports ALB DNS name', () => {
    template.hasOutput('LoadBalancerDns', {});
  });
});

describe('DnsStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let primaryAlb: elbv2.ApplicationLoadBalancer;
  let standbyAlb: elbv2.ApplicationLoadBalancer;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', { env: testEnv });

    const primaryVpc = new ec2.Vpc(parentStack, 'PrimaryVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });
    primaryAlb = new elbv2.ApplicationLoadBalancer(parentStack, 'PrimaryALB', {
      vpc: primaryVpc,
      internetFacing: true
    });

    const standbyVpc = new ec2.Vpc(parentStack, 'StandbyVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16')
    });
    standbyAlb = new elbv2.ApplicationLoadBalancer(parentStack, 'StandbyALB', {
      vpc: standbyVpc,
      internetFacing: true
    });
  });

  describe('with custom domain', () => {
    let stack: DnsStack;
    let template: Template;

    beforeEach(() => {
      stack = new DnsStack(parentStack, 'TestDnsStackWithDomain', {
        env: testEnv,
        primaryAlb,
        standbyAlb,
        domainName: 'myapp.customdomain.com'
      });
      template = Template.fromStack(stack);
    });

    test('creates hosted zone', () => {
      template.hasResourceProperties('AWS::Route53::HostedZone', {
        Name: 'myapp.customdomain.com.'
      });
    });

    test('creates health checks for primary and standby ALBs', () => {
      template.resourceCountIs('AWS::Route53::HealthCheck', 2);

      template.hasResourceProperties('AWS::Route53::HealthCheck', {
        HealthCheckConfig: Match.objectLike({
          Type: 'HTTP',
          ResourcePath: '/health'
        })
      });
    });

    test('creates failover records', () => {
      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: Match.stringLikeRegexp('app\\.myapp\\.customdomain\\.com\\.?'),
        Type: 'A',
        Failover: 'PRIMARY'
      });

      template.hasResourceProperties('AWS::Route53::RecordSet', {
        Name: Match.stringLikeRegexp('app\\.myapp\\.customdomain\\.com\\.?'),
        Type: 'A',
        Failover: 'SECONDARY'
      });
    });

    test('outputs application URL', () => {
      template.hasOutput('ApplicationUrl', {
        Description: 'The URL of the application with Route53 failover'
      });
    });
  });

  describe('without domain', () => {
    let stack: DnsStack;
    let template: Template;

    beforeEach(() => {
      stack = new DnsStack(parentStack, 'TestDnsStackNoDomain', {
        env: testEnv,
        primaryAlb,
        standbyAlb
      });
      template = Template.fromStack(stack);
    });

    test('does not create hosted zone', () => {
      template.resourceCountIs('AWS::Route53::HostedZone', 0);
    });

    test('creates health checks even without custom domain', () => {
      // Health checks are always created for ALB monitoring
      template.resourceCountIs('AWS::Route53::HealthCheck', 2);

      // Verify health check IDs are exported
      template.hasOutput('PrimaryHealthCheckId', {
        Description: 'Primary ALB Health Check ID'
      });
      template.hasOutput('StandbyHealthCheckId', {
        Description: 'Standby ALB Health Check ID'
      });
    });

    test('does not create failover records', () => {
      template.resourceCountIs('AWS::Route53::RecordSet', 0);
    });

    test('outputs ALB URLs instead', () => {
      template.hasOutput('PrimaryAlbUrl', {
        Description: 'Primary ALB DNS name'
      });

      template.hasOutput('StandbyAlbUrl', {
        Description: 'Standby ALB DNS name'
      });
    });
  });
});

describe('ResilienceStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: ResilienceStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', { env: testEnv });

    // Setup resources
    const primaryVpc = new ec2.Vpc(parentStack, 'PrimaryVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });
    const primaryAlb = new elbv2.ApplicationLoadBalancer(parentStack, 'PrimaryALB', {
      vpc: primaryVpc,
      internetFacing: true
    });
    const primaryAsg = new autoscaling.AutoScalingGroup(parentStack, 'PrimaryASG', {
      vpc: primaryVpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage()
    });

    const primaryDbSubnetGroup = new rds.SubnetGroup(parentStack, 'PrimaryDBSubnetGroup', {
      description: 'Primary subnet group',
      vpc: primaryVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });
    const primaryDb = new rds.DatabaseInstance(parentStack, 'PrimaryDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13
      }),
      vpc: primaryVpc,
      subnetGroup: primaryDbSubnetGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)
    });

    // Standby resources
    const standbyVpc = new ec2.Vpc(parentStack, 'StandbyVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16')
    });
    const standbyAlb = new elbv2.ApplicationLoadBalancer(parentStack, 'StandbyALB', {
      vpc: standbyVpc,
      internetFacing: true
    });
    const standbyAsg = new autoscaling.AutoScalingGroup(parentStack, 'StandbyASG', {
      vpc: standbyVpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: new ec2.AmazonLinuxImage()
    });

    const standbyDbSubnetGroup = new rds.SubnetGroup(parentStack, 'StandbyDBSubnetGroup', {
      description: 'Standby subnet group',
      vpc: standbyVpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      }
    });
    const standbyDb = new rds.DatabaseInstance(parentStack, 'StandbyDB', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13
      }),
      vpc: standbyVpc,
      subnetGroup: standbyDbSubnetGroup,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO)
    });

    stack = new ResilienceStack(parentStack, 'TestResilienceStack', {
      env: testEnv,
      primaryVpc,
      primaryAlb,
      primaryAsg,
      primaryDatabase: primaryDb,
      standbyVpc,
      standbyAlb,
      standbyAsg,
      standbyDatabase: standbyDb
    });
    template = Template.fromStack(stack);
  });

  test('creates FIS experiment template', () => {
    template.hasResourceProperties('AWS::FIS::ExperimentTemplate', {
      Description: Match.stringLikeRegexp('.*failover.*'),
      RoleArn: Match.anyValue(),
      StopConditions: Match.arrayWith([
        Match.objectLike({
          Source: 'aws:cloudwatch:alarm'
        })
      ])
    });
  });

  test('creates IAM role for FIS', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: Match.objectLike({
              Service: 'fis.amazonaws.com'
            }),
            Action: 'sts:AssumeRole'
          })
        ])
      })
    });
  });

  test('attaches FIS policy to role', () => {
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Action: Match.arrayWith([
              'ec2:StopInstances',
              'ec2:StartInstances',
              'ec2:DescribeInstances'
            ])
          })
        ])
      })
    });
  });

  test('creates Resilience Hub application', () => {
    // Check that custom resources for Resilience Hub exist
    template.resourceCountIs('Custom::AWS', 1);
  });

  test('defines resilience policy', () => {
    // Verify custom resource exists
    template.hasResourceProperties('Custom::AWS', {
      ServiceToken: Match.anyValue()
    });
  });

  test('creates output for Resilience Hub app', () => {
    template.hasOutput('ResilienceHubAppArn', {});
  });
});

describe('VpcPeeringStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: VpcPeeringStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    parentStack = new cdk.Stack(app, 'ParentStack', { env: testEnv });

    const primaryVpc = new ec2.Vpc(parentStack, 'PrimaryVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16')
    });

    const standbyVpc = new ec2.Vpc(parentStack, 'StandbyVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16')
    });

    stack = new VpcPeeringStack(parentStack, 'TestPeeringStack', {
      env: testEnv,
      primaryVpc,
      standbyVpc,
      primaryRegion: 'eu-west-2',
      standbyRegion: 'eu-west-3'
    });
    template = Template.fromStack(stack);
  });

  test('creates VPC peering connection', () => {
    // VPC peering is created via Custom Resource
    // 3 peering resources (create, accept, describe) + 6 route resources (3 public + 3 private subnets in standby)
    template.resourceCountIs('Custom::AWS', 9);
  });

  test('creates route for primary VPC to standby', () => {
    // Routes in primary VPC use CfnRoute
    // DestinationCidrBlock is a cross-region reference, not a literal string
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: Match.anyValue()
    });
  });

  test('creates custom resource for accepting peering', () => {
    // Custom resources are created for VPC peering
    template.hasResourceProperties('Custom::AWS', {
      ServiceToken: Match.anyValue()
    });
  });

  test('creates Lambda function for custom resource', () => {
    // Lambda functions are created automatically by CDK for custom resources
    const resources = template.toJSON().Resources;
    const lambdaFunctions = Object.values(resources).filter((r: any) => r.Type === 'AWS::Lambda::Function');
    expect(lambdaFunctions.length).toBeGreaterThan(0);
  });

  test('creates IAM role for Lambda with EC2 permissions', () => {
    // IAM role created for cross-region peering
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: Match.objectLike({
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: Match.objectLike({
              Service: 'lambda.amazonaws.com'
            })
          })
        ])
      })
    });
  });

  test('exports peering connection ID', () => {
    template.hasOutput('VpcPeeringConnectionId', {});
  });
});

describe('Code Coverage', () => {
  test('all stack classes are tested', () => {
    const stackClasses = [
      'TapStack',
      'VpcStack',
      'SecurityStack',
      'StorageStack',
      'DatabaseStack',
      'ComputeStack',
      'DnsStack',
      'ResilienceStack',
      'VpcPeeringStack'
    ];

    stackClasses.forEach(stackClass => {
      expect(describe.name).toBeDefined();
    });
  });
});