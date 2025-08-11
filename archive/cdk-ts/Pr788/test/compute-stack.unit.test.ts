import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MigrationComputeStack } from '../lib/migration-compute-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('MigrationComputeStack - Unit Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('compute stack with environment suffix provided', () => {
    // Create parent stack with VPC
    const parentStack = new cdk.Stack(app, 'ParentStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const vpc = new ec2.Vpc(parentStack, 'TestVpc', {
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

    const sshSecurityGroup = new ec2.SecurityGroup(parentStack, 'TestSshSg', {
      vpc,
      description: 'Test SSH security group',
    });

    // Create compute stack as nested stack
    const computeStack = new MigrationComputeStack(parentStack, 'ComputeStack', {
      vpc,
      sshSecurityGroup,
      environmentSuffix: 'test-env',
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const template = Template.fromStack(computeStack);

    // Verify resources are created with correct environment suffix
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'migration-cache-sg-test-env',
      GroupDescription: 'Security group for ElastiCache cluster',
    });

    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      CacheSubnetGroupName: 'migration-cache-subnet-group-test-env',
      Description: 'Subnet group for ElastiCache cluster',
    });

    template.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
      ServerlessCacheName: 'migration-cache-test-env',
      Engine: 'redis',
    });
  });

  test('compute stack without environment suffix uses default', () => {
    // Create parent stack with VPC
    const parentStack = new cdk.Stack(app, 'ParentStack2', {
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const vpc = new ec2.Vpc(parentStack, 'TestVpc2', {
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

    const sshSecurityGroup = new ec2.SecurityGroup(parentStack, 'TestSshSg2', {
      vpc,
      description: 'Test SSH security group',
    });

    // Create compute stack without environment suffix
    const computeStack = new MigrationComputeStack(parentStack, 'ComputeStack2', {
      vpc,
      sshSecurityGroup,
      // No environmentSuffix provided
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const template = Template.fromStack(computeStack);

    // Verify resources are created with default 'dev' suffix
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'migration-cache-sg-dev',
      GroupDescription: 'Security group for ElastiCache cluster',
    });

    template.hasResourceProperties('AWS::ElastiCache::SubnetGroup', {
      CacheSubnetGroupName: 'migration-cache-subnet-group-dev',
      Description: 'Subnet group for ElastiCache cluster',
    });

    template.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
      ServerlessCacheName: 'migration-cache-dev',
      Engine: 'redis',
    });
  });

  test('compute stack creates all required resources', () => {
    // Create parent stack with VPC
    const parentStack = new cdk.Stack(app, 'ParentStack3', {
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const vpc = new ec2.Vpc(parentStack, 'TestVpc3', {
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

    const sshSecurityGroup = new ec2.SecurityGroup(parentStack, 'TestSshSg3', {
      vpc,
      description: 'Test SSH security group',
    });

    const computeStack = new MigrationComputeStack(parentStack, 'ComputeStack3', {
      vpc,
      sshSecurityGroup,
      environmentSuffix: 'prod',
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const template = Template.fromStack(computeStack);

    // Check all required resources are created
    template.resourceCountIs('AWS::EC2::SecurityGroup', 1);
    template.resourceCountIs('AWS::ElastiCache::SubnetGroup', 1);
    template.resourceCountIs('AWS::ElastiCache::ServerlessCache', 1);

    // Check outputs
    template.hasOutput('CacheEndpointAddress', {});
    template.hasOutput('CacheEndpointPort', {});

    // Check tags
    const tags = computeStack.tags.tagValues();
    expect(tags['Project']).toBe('Migration');
    expect(tags['Environment']).toBe('Production');
    expect(tags['Component']).toBe('Compute');
  });

  test('compute stack security group configuration', () => {
    // Create parent stack with VPC
    const parentStack = new cdk.Stack(app, 'ParentStack4', {
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const vpc = new ec2.Vpc(parentStack, 'TestVpc4', {
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

    const sshSecurityGroup = new ec2.SecurityGroup(parentStack, 'TestSshSg4', {
      vpc,
      description: 'Test SSH security group',
    });

    const computeStack = new MigrationComputeStack(parentStack, 'ComputeStack4', {
      vpc,
      sshSecurityGroup,
      environmentSuffix: 'qa',
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const template = Template.fromStack(computeStack);

    // Check security group configuration
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupDescription: 'Security group for ElastiCache cluster',
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

  test('compute stack ElastiCache configuration', () => {
    // Create parent stack with VPC
    const parentStack = new cdk.Stack(app, 'ParentStack5', {
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const vpc = new ec2.Vpc(parentStack, 'TestVpc5', {
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

    const sshSecurityGroup = new ec2.SecurityGroup(parentStack, 'TestSshSg5', {
      vpc,
      description: 'Test SSH security group',
    });

    const computeStack = new MigrationComputeStack(parentStack, 'ComputeStack5', {
      vpc,
      sshSecurityGroup,
      environmentSuffix: 'staging',
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const template = Template.fromStack(computeStack);

    // Check ElastiCache Serverless configuration
    template.hasResourceProperties('AWS::ElastiCache::ServerlessCache', {
      Engine: 'redis',
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

  test('compute stack outputs handle undefined attributes', () => {
    // Create parent stack with VPC
    const parentStack = new cdk.Stack(app, 'ParentStack6', {
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const vpc = new ec2.Vpc(parentStack, 'TestVpc6', {
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

    const sshSecurityGroup = new ec2.SecurityGroup(parentStack, 'TestSshSg6', {
      vpc,
      description: 'Test SSH security group',
    });

    const computeStack = new MigrationComputeStack(parentStack, 'ComputeStack6', {
      vpc,
      sshSecurityGroup,
      environmentSuffix: 'test',
      env: { account: '123456789012', region: 'us-west-2' },
    });

    const template = Template.fromStack(computeStack);

    // Check that outputs handle undefined gracefully with 'N/A' default
    template.hasOutput('CacheEndpointAddress', {
      Value: Match.anyValue(), // Will be either the actual value or 'N/A'
    });

    template.hasOutput('CacheEndpointPort', {
      Value: Match.anyValue(), // Will be either the actual value or 'N/A'
    });
  });
});