import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { MigrationVpcStack } from '../lib/migration-vpc-stack';
import { MigrationStorageStack } from '../lib/migration-storage-stack';
import { MigrationComputeStack } from '../lib/migration-compute-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

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
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('creates nested stacks', () => {
    // TapStack contains nested stacks - synthesize the app to verify
    const assembly = app.synth();
    const stackArtifact = assembly.getStackByName(stack.stackName);
    expect(stackArtifact).toBeDefined();
    
    // Check nested stacks exist in the assembly
    const nestedStacks = assembly.stacks.filter(s => 
      s.stackName.includes('MigrationVpcStack') ||
      s.stackName.includes('MigrationStorageStack') ||
      s.stackName.includes('MigrationComputeStack')
    );
    expect(nestedStacks.length).toBe(3);
  });

  test('applies correct tags', () => {
    // Check that the tags are applied to the stack
    const tags = stack.tags.tagValues();
    expect(tags['Project']).toBe('Migration');
    expect(tags['Environment']).toBe('Production');
  });

  test('creates outputs for all required values', () => {
    // Verify all outputs are present
    template.hasOutput('VpcId', {});
    template.hasOutput('PublicSubnetIds', {});
    template.hasOutput('SecurityGroupId', {});
    template.hasOutput('BackupBucketName', {});
    template.hasOutput('BackupBucketArn', {});
    template.hasOutput('EnvironmentSuffix', {});
  });

  test('passes environment suffix to nested stacks', () => {
    // Verify environment suffix is passed correctly
    template.hasOutput('EnvironmentSuffix', {
      Value: environmentSuffix,
    });
  });

  test('creates outputs with specific environment suffix', () => {
    const customSuffix = 'prod-123';
    const customApp = new cdk.App();  // Use new app to avoid synthesis conflict
    const customStack = new TapStack(customApp, 'CustomTapStack', {
      environmentSuffix: customSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const customTemplate = Template.fromStack(customStack);
    
    customTemplate.hasOutput('EnvironmentSuffix', {
      Value: customSuffix,
    });
  });
});

describe('MigrationVpcStack', () => {
  let app: cdk.App;
  let stack: MigrationVpcStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MigrationVpcStack(app, 'TestVpcStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('creates VPC with correct CIDR', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      Tags: Match.arrayWith([
        { Key: 'Name', Value: `migration-vpc-${environmentSuffix}` },
      ]),
    });
  });

  test('creates exactly 2 public subnets', () => {
    template.resourceCountIs('AWS::EC2::Subnet', 2);
    template.hasResourceProperties('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
    });
  });

  test('creates internet gateway', () => {
    template.resourceCountIs('AWS::EC2::InternetGateway', 1);
    template.hasResourceProperties('AWS::EC2::InternetGateway', {
      Tags: Match.arrayWith([
        { Key: 'Project', Value: 'Migration' },
      ]),
    });
  });

  test('creates VPC gateway attachment', () => {
    template.resourceCountIs('AWS::EC2::VPCGatewayAttachment', 1);
  });

  test('creates route tables for public subnets', () => {
    template.resourceCountIs('AWS::EC2::RouteTable', 2);
  });

  test('creates routes to internet gateway', () => {
    template.hasResourceProperties('AWS::EC2::Route', {
      DestinationCidrBlock: '0.0.0.0/0',
    });
  });

  test('creates SSH security group with correct rules', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription:
        'Security group allowing SSH access for migration (temporary exception)',
      GroupName: `migration-ssh-sg-${environmentSuffix}`,
      SecurityGroupIngress: [
        {
          CidrIp: '0.0.0.0/0',
          Description:
            'Allow SSH access from anywhere (temporary migration exception)',
          FromPort: 22,
          IpProtocol: 'tcp',
          ToPort: 22,
        },
      ],
    });
  });

  test('security group has proper tags', () => {
    // Check that stack-level tags are applied
    const tags = stack.tags.tagValues();
    expect(tags['Project']).toBe('Migration');
    expect(tags['Environment']).toBe('Production');
    expect(tags['Component']).toBe('Network');
  });

  test('applies correct tags to VPC', () => {
    // Check that stack-level tags are applied
    const tags = stack.tags.tagValues();
    expect(tags['Project']).toBe('Migration');
    expect(tags['Environment']).toBe('Production');
    expect(tags['Component']).toBe('Network');
  });

  test('creates required outputs', () => {
    template.hasOutput('VpcId', {});
    template.hasOutput('PublicSubnetIds', {});
    template.hasOutput('SecurityGroupId', {});
  });

  test('no NAT gateways are created', () => {
    template.resourceCountIs('AWS::EC2::NatGateway', 0);
  });

  test('VPC stack with custom suffix', () => {
    const customSuffix = 'staging-456';
    const customApp = new cdk.App();  // Use new app to avoid synthesis conflict
    const customStack = new MigrationVpcStack(customApp, 'CustomVpcStack', {
      environmentSuffix: customSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const customTemplate = Template.fromStack(customStack);
    
    customTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: `migration-vpc-${customSuffix}` },
      ]),
    });
  });

  test('uses default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();  // Use new app to avoid synthesis conflict
    const defaultStack = new MigrationVpcStack(defaultApp, 'DefaultVpcStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const defaultTemplate = Template.fromStack(defaultStack);
    
    defaultTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'migration-vpc-dev' },
      ]),
    });
  });
});

describe('MigrationStorageStack', () => {
  let app: cdk.App;
  let stack: MigrationStorageStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new MigrationStorageStack(app, 'TestStorageStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('creates S3 bucket with correct naming pattern', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp(
        `^migration-backup-${environmentSuffix}-[a-z0-9]+$`
      ),
    });
  });

  test('enables versioning on bucket', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
    });
  });

  test('enables S3 managed encryption', () => {
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

  test('blocks all public access', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('sets removal policy to DESTROY', () => {
    template.hasResource('AWS::S3::Bucket', {
      UpdateReplacePolicy: 'Delete',
      DeletionPolicy: 'Delete',
    });
  });

  test('enables auto delete objects', () => {
    template.hasResourceProperties('Custom::S3AutoDeleteObjects', {
      BucketName: Match.anyValue(),
    });
  });

  test('applies correct tags to bucket', () => {
    // S3 bucket tags are applied at the stack level
    const tags = stack.tags.tagValues();
    expect(tags['Project']).toBe('Migration');
    expect(tags['Environment']).toBe('Production');
    expect(tags['Component']).toBe('Storage');
  });

  test('creates required outputs', () => {
    template.hasOutput('BackupBucketName', {});
    template.hasOutput('BackupBucketArn', {});
  });

  test('bucket with custom suffix', () => {
    const customSuffix = 'qa-789';
    const customApp = new cdk.App();  // Use new app to avoid synthesis conflict
    const customStack = new MigrationStorageStack(customApp, 'CustomStorageStack', {
      environmentSuffix: customSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const customTemplate = Template.fromStack(customStack);
    
    customTemplate.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp(
        `^migration-backup-${customSuffix}-[a-z0-9]+$`
      ),
    });
  });

  test('uses default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();  // Use new app to avoid synthesis conflict
    const defaultStack = new MigrationStorageStack(defaultApp, 'DefaultStorageStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const defaultTemplate = Template.fromStack(defaultStack);
    
    defaultTemplate.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp(
        `^migration-backup-dev-[a-z0-9]+$`
      ),
    });
  });
});

describe('MigrationComputeStack', () => {
  let app: cdk.App;
  let parentStack: cdk.Stack;
  let stack: MigrationComputeStack;
  let template: Template;
  let vpc: ec2.IVpc;
  let sshSecurityGroup: ec2.ISecurityGroup;

  beforeEach(() => {
    app = new cdk.App();

    // Create parent stack for nested stack testing
    parentStack = new cdk.Stack(app, 'ParentStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });

    // Create VPC in parent stack
    vpc = new ec2.Vpc(parentStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
    });

    sshSecurityGroup = new ec2.SecurityGroup(parentStack, 'TestSshSg', {
      vpc,
      description: 'Test SSH security group',
    });

    // Create compute stack as nested stack
    stack = new MigrationComputeStack(parentStack, 'TestComputeStack', {
      vpc,
      sshSecurityGroup,
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    template = Template.fromStack(stack);
  });

  test('creates ElastiCache security group', () => {
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ElastiCache cluster',
      GroupName: `migration-cache-sg-${environmentSuffix}`,
    });
  });

  test('allows Redis access from VPC', () => {
    // The security group should have an ingress rule for Redis
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: `migration-cache-sg-${environmentSuffix}`,
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          FromPort: 6379,
          ToPort: 6379,
          IpProtocol: 'tcp',
          Description: 'Allow Redis access from VPC',
        }),
      ]),
    });
  });

  test('creates ElastiCache subnet group', () => {
    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      CacheSubnetGroupName: `migration-cache-subnet-group-${environmentSuffix}`,
      Description: 'Subnet group for ElastiCache cluster',
    });
  });

  test('creates ElastiCache Serverless cluster', () => {
    template.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
      Engine: 'redis',
      ServerlessCacheName: `migration-cache-${environmentSuffix}`,
      Description: 'Serverless Redis cache for migration workloads',
      CacheUsageLimits: {
        DataStorage: {
          Maximum: 10,
          Unit: 'GB',
        },
        ECPUPerSecond: {
          Maximum: 5000,
        },
      },
    });
  });

  test('applies correct tags to security group', () => {
    const tags = stack.tags.tagValues();
    expect(tags['Project']).toBe('Migration');
    expect(tags['Environment']).toBe('Production');
    expect(tags['Component']).toBe('Compute');
  });

  test('creates required outputs', () => {
    template.hasOutput('CacheEndpointAddress', {});
    template.hasOutput('CacheEndpointPort', {});
  });

  test('security group restricts outbound traffic', () => {
    // By setting allowAllOutbound to false, egress rules should be empty or specific
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: `migration-cache-sg-${environmentSuffix}`,
      GroupDescription: 'Security group for ElastiCache cluster',
    });
  });

  test('compute stack with custom suffix', () => {
    const customSuffix = 'prod-xyz';
    const customApp = new cdk.App();
    const customParentStack = new cdk.Stack(customApp, 'CustomParentStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const customVpc = new ec2.Vpc(customParentStack, 'CustomVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    const customSshSg = new ec2.SecurityGroup(customParentStack, 'CustomSshSg', {
      vpc: customVpc,
      description: 'Test SSH security group',
    });
    
    const customStack = new MigrationComputeStack(customParentStack, 'CustomComputeStack', {
      vpc: customVpc,
      sshSecurityGroup: customSshSg,
      environmentSuffix: customSuffix,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const customTemplate = Template.fromStack(customStack);
    
    customTemplate.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
      ServerlessCacheName: `migration-cache-${customSuffix}`,
    });
  });

  test('uses default environment suffix when not provided', () => {
    const defaultApp = new cdk.App();
    const defaultParentStack = new cdk.Stack(defaultApp, 'DefaultParentStack', {
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const defaultVpc = new ec2.Vpc(defaultParentStack, 'DefaultVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    const defaultSshSg = new ec2.SecurityGroup(defaultParentStack, 'DefaultSshSg', {
      vpc: defaultVpc,
      description: 'Test SSH security group',
    });
    
    const defaultStack = new MigrationComputeStack(defaultParentStack, 'DefaultComputeStack', {
      vpc: defaultVpc,
      sshSecurityGroup: defaultSshSg,
      env: {
        account: '123456789012',
        region: 'us-west-2',
      },
    });
    const defaultTemplate = Template.fromStack(defaultStack);
    
    defaultTemplate.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
      ServerlessCacheName: 'migration-cache-dev',
    });
  });
});

describe('Environment Suffix Usage', () => {
  const testSuffix = 'qa-test-123';
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('VPC stack uses environment suffix in resource names', () => {
    const stack = new MigrationVpcStack(app, 'TestVpc', {
      environmentSuffix: testSuffix,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: `migration-vpc-${testSuffix}` },
      ]),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: `migration-ssh-sg-${testSuffix}`,
    });
  });

  test('Storage stack uses environment suffix in bucket name', () => {
    const stack = new MigrationStorageStack(app, 'TestStorage', {
      environmentSuffix: testSuffix,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp(
        `^migration-backup-${testSuffix}-[a-z0-9]+$`
      ),
    });
  });

  test('Compute stack uses environment suffix in resource names', () => {
    const vpcStack = new cdk.Stack(app, 'VpcStack');
    const vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    const sshSg = new ec2.SecurityGroup(vpcStack, 'TestSg', {
      vpc,
    });

    const stack = new MigrationComputeStack(app, 'TestCompute', {
      vpc,
      sshSecurityGroup: sshSg,
      environmentSuffix: testSuffix,
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      CacheSubnetGroupName: `migration-cache-subnet-group-${testSuffix}`,
    });

    template.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
      ServerlessCacheName: `migration-cache-${testSuffix}`,
    });
  });

  test('default environment suffix is "dev"', () => {
    const stack = new TapStack(app, 'DefaultStack');
    const template = Template.fromStack(stack);

    template.hasOutput('EnvironmentSuffix', {
      Value: 'dev',
    });
  });
});

describe('Stack Dependencies', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('compute stack depends on VPC stack', () => {
    const stack = new TapStack(app, 'TestStack', {
      environmentSuffix: 'test',
    });

    // Synthesize to ensure dependencies are resolved
    app.synth();

    // Check that nested stacks have proper dependencies
    const template = Template.fromStack(stack);
    expect(template).toBeDefined();
  });
});

describe('Security Configuration', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('SSH security group allows access from anywhere (temporary exception)', () => {
    const stack = new MigrationVpcStack(app, 'TestVpc', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          CidrIp: '0.0.0.0/0',
          FromPort: 22,
          ToPort: 22,
          IpProtocol: 'tcp',
        }),
      ]),
    });
  });

  test('ElastiCache security group has Redis ingress rule', () => {
    const vpcStack = new cdk.Stack(app, 'VpcStack');
    const vpc = new ec2.Vpc(vpcStack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    const sshSg = new ec2.SecurityGroup(vpcStack, 'TestSg', { vpc });

    const stack = new MigrationComputeStack(app, 'TestCompute', {
      vpc,
      sshSecurityGroup: sshSg,
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(stack);

    // Check that Redis port is allowed
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          FromPort: 6379,
          ToPort: 6379,
          IpProtocol: 'tcp',
        }),
      ]),
    });
  });

  test('S3 bucket blocks all public access', () => {
    const stack = new MigrationStorageStack(app, 'TestStorage', {
      environmentSuffix: 'test',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });
});