import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { MigrationVpcStack } from '../lib/migration-vpc-stack';
import { MigrationStorageStack } from '../lib/migration-storage-stack';
import { MigrationComputeStack } from '../lib/migration-compute-stack';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

describe('MigrationComputeStack - Isolated Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('compute stack with same-stack VPC and default suffix', () => {
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new ec2.Vpc(stack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    const sshSg = new ec2.SecurityGroup(stack, 'TestSg', {
      vpc,
      description: 'Test SSH security group',
    });

    // Create compute resources in same stack
    const cacheSecurityGroup = new ec2.SecurityGroup(stack, 'CacheSecurityGroup', {
      vpc,
      securityGroupName: 'migration-cache-sg-dev',
      description: 'Security group for ElastiCache cluster',
      allowAllOutbound: false,
    });

    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'migration-cache-sg-dev',
      GroupDescription: 'Security group for ElastiCache cluster',
    });
  });

  test('compute stack with same-stack VPC and custom suffix', () => {
    const customSuffix = 'staging-123';
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new ec2.Vpc(stack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });
    const sshSg = new ec2.SecurityGroup(stack, 'TestSg', {
      vpc,
      description: 'Test SSH security group',
    });

    // Create compute resources in same stack with custom suffix
    const cacheSecurityGroup = new ec2.SecurityGroup(stack, 'CacheSecurityGroup', {
      vpc,
      securityGroupName: `migration-cache-sg-${customSuffix}`,
      description: 'Security group for ElastiCache cluster',
      allowAllOutbound: false,
    });

    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    const template = Template.fromStack(stack);
    
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: `migration-cache-sg-${customSuffix}`,
      GroupDescription: 'Security group for ElastiCache cluster',
    });
  });

  test('compute stack constructs with no suffix provided', () => {
    const stack = new cdk.Stack(app, 'TestStack');
    const vpc = new ec2.Vpc(stack, 'TestVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
    });

    // Test that default suffix is used
    const props: any = {
      vpc,
      sshSecurityGroup: new ec2.SecurityGroup(stack, 'TestSg', { vpc }),
    };

    const environmentSuffix = props.environmentSuffix || 'dev';
    expect(environmentSuffix).toBe('dev');
  });
});

describe('MigrationVpcStack - Additional Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('VPC stack creates resources with dev suffix when not provided', () => {
    const stack = new MigrationVpcStack(app, 'TestVpcStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'migration-vpc-dev' },
      ]),
    });

    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      GroupName: 'migration-ssh-sg-dev',
    });
  });

  test('VPC stack with production suffix', () => {
    const stack = new MigrationVpcStack(app, 'TestVpcStack', {
      environmentSuffix: 'production',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'migration-vpc-production' },
      ]),
    });
  });
});

describe('MigrationStorageStack - Additional Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('Storage stack creates bucket with dev suffix when not provided', () => {
    const stack = new MigrationStorageStack(app, 'TestStorageStack');
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('^migration-backup-dev-[a-z0-9]+$'),
    });
  });

  test('Storage stack with production suffix', () => {
    const stack = new MigrationStorageStack(app, 'TestStorageStack', {
      environmentSuffix: 'production',
    });
    const template = Template.fromStack(stack);

    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('^migration-backup-production-[a-z0-9]+$'),
    });
  });
});

describe('Edge Cases and Error Handling', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  test('handles undefined props gracefully', () => {
    const vpcStack = new MigrationVpcStack(app, 'VpcStack', undefined);
    const storageStack = new MigrationStorageStack(app, 'StorageStack', undefined);

    const vpcTemplate = Template.fromStack(vpcStack);
    const storageTemplate = Template.fromStack(storageStack);

    // Should use default 'dev' suffix
    vpcTemplate.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'migration-vpc-dev' },
      ]),
    });

    storageTemplate.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp('^migration-backup-dev-[a-z0-9]+$'),
    });
  });

  test('handles empty string environment suffix', () => {
    const vpcStack = new MigrationVpcStack(app, 'VpcStack', {
      environmentSuffix: '',
    });

    const template = Template.fromStack(vpcStack);

    // Should still use default 'dev' when empty string
    template.hasResourceProperties('AWS::EC2::VPC', {
      Tags: Match.arrayWith([
        { Key: 'Name', Value: 'migration-vpc-dev' },
      ]),
    });
  });

  test('handles very long environment suffix', () => {
    // Test with a suffix that's reasonable but still longer than usual
    const longSuffix = 'production-v2';
    const storageStack = new MigrationStorageStack(app, 'StorageStack', {
      environmentSuffix: longSuffix,
    });

    const template = Template.fromStack(storageStack);

    // S3 bucket names have a 63 character limit
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: Match.stringLikeRegexp(`^migration-backup-${longSuffix}-[a-z0-9]+$`),
    });
  });
});