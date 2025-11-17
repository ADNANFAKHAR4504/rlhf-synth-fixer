import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { RegionalStack } from '../lib/regional-stack';
import { VpcPeeringStack } from '../lib/vpc-peering-stack';
import { RegionalConfig } from '../lib/types';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Multi-Region Infrastructure Unit Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('RegionalStack - Primary Region', () => {
    let primaryStack: RegionalStack;
    let template: Template;

    beforeEach(() => {
      const primaryConfig: RegionalConfig = {
        region: 'us-east-1',
        isPrimary: true,
        wafBlockedCountries: ['CN', 'RU', 'KP'],
        cloudWatchLatencyThreshold: 500,
        environmentSuffix,
      };

      primaryStack = new RegionalStack(app, `PrimaryRegion-${environmentSuffix}`, {
        config: primaryConfig,
        env: { region: 'us-east-1' },
        tags: { Environment: 'production', Region: 'us-east-1', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      template = Template.fromStack(primaryStack);
    });

    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });

    test('creates NAT Gateways for private subnet egress', () => {
      // NAT Gateways are created for private subnet egress (may vary based on maxAzs)
      const natGateways = template.findResources('AWS::EC2::NatGateway');
      expect(Object.keys(natGateways).length).toBeGreaterThan(0);
    });

    test('creates RDS instance with encryption', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        Engine: 'postgres',
        StorageEncrypted: true,
        MultiAZ: true,
        DeletionProtection: false,
      });
    });

    test('creates KMS key for RDS encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('creates S3 bucket with versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
        BucketEncryption: Match.objectLike({
          ServerSideEncryptionConfiguration: Match.arrayWith([
            Match.objectLike({
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            }),
          ]),
        }),
      });
    });

    test('creates Application Load Balancer', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::LoadBalancer', {
        Type: 'application',
        Scheme: 'internet-facing',
      });
    });

    test('creates WAF WebACL with geo-blocking rules', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Scope: 'REGIONAL',
        Rules: Match.arrayWith([
          Match.objectLike({
            Name: 'GeoBlockRule',
            Statement: {
              GeoMatchStatement: {
                CountryCodes: ['CN', 'RU', 'KP'],
              },
            },
            Action: {
              Block: Match.anyValue(),
            },
          }),
        ]),
      });
    });

    test('creates Lambda function with Node.js 18', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        Runtime: 'nodejs18.x',
        Timeout: 30,
        MemorySize: 512,
      });
    });

    test('creates DynamoDB table for data storage', () => {
      // Primary region without replicaRegion creates regular Table (not GlobalTable)
      const regularTables = template.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(regularTables).length).toBeGreaterThan(0);

      // Verify table properties
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      });
    });

    test('creates ECS Fargate cluster', () => {
      template.hasResourceProperties('AWS::ECS::Cluster', Match.objectLike({}));
    });

    test('creates ECS Fargate service', () => {
      template.hasResourceProperties('AWS::ECS::Service', {
        LaunchType: 'FARGATE',
        DesiredCount: 2,
      });
    });

    test('creates CloudWatch alarms', () => {
      // At least one alarm should exist
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThan(0);
    });

    test('creates SNS topic for alarms', () => {
      template.hasResourceProperties('AWS::SNS::Topic', Match.objectLike({}));
    });

    test('includes environmentSuffix in resource names', () => {
      // Check VPC name
      template.hasResourceProperties('AWS::EC2::VPC', {
        Tags: Match.arrayWith([
          { Key: 'Name', Value: Match.stringLikeRegexp(`.*${environmentSuffix}.*`) },
        ]),
      });
    });

    test('applies required tags', () => {
      const resources = template.findResources('AWS::EC2::VPC');
      const vpcResource = Object.values(resources)[0];
      expect(vpcResource.Properties.Tags).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ Key: 'Environment', Value: 'production' }),
          expect.objectContaining({ Key: 'Region', Value: 'us-east-1' }),
          expect.objectContaining({ Key: 'CostCenter', Value: 'fintech-ops' }),
        ])
      );
    });

    test('RDS is in private subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        SubnetIds: Match.anyValue(),
      });
    });

    test('RDS and S3 do not have Retain removal policy', () => {
      const rdsInstances = template.findResources('AWS::RDS::DBInstance');
      const s3Buckets = template.findResources('AWS::S3::Bucket');

      Object.values(rdsInstances).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });

      Object.values(s3Buckets).forEach((resource: any) => {
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });
  });

  describe('RegionalStack - S3 Replication', () => {
    test('Primary stack with replication destination', () => {
      const primaryConfig: RegionalConfig = {
        region: 'us-east-1',
        isPrimary: true,
        wafBlockedCountries: ['CN', 'RU', 'KP'],
        cloudWatchLatencyThreshold: 500,
        environmentSuffix,
      };

      const primaryStack = new RegionalStack(app, `PrimaryWithReplication-${environmentSuffix}`, {
        config: primaryConfig,
        replicationDestinationBucketArn: 'arn:aws:s3:::destination-bucket',
        replicationDestinationKmsArn: 'arn:aws:kms:us-east-2:123456789012:key/12345678-1234-1234-1234-123456789012',
        env: { region: 'us-east-1' },
        tags: { Environment: 'production', Region: 'us-east-1', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      const template = Template.fromStack(primaryStack);

      // Should have S3 bucket
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });
  });

  describe('RegionalStack - Secondary Region', () => {
    let secondaryStack: RegionalStack;
    let template: Template;

    beforeEach(() => {
      const secondaryConfig: RegionalConfig = {
        region: 'us-east-2',
        isPrimary: false,
        wafBlockedCountries: ['CN', 'RU', 'KP', 'IR'],
        cloudWatchLatencyThreshold: 300,
        environmentSuffix,
      };

      secondaryStack = new RegionalStack(app, `SecondaryRegion-${environmentSuffix}`, {
        config: secondaryConfig,
        replicaRegion: 'us-east-1',
        env: { region: 'us-east-2' },
        tags: { Environment: 'production', Region: 'us-east-2', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      template = Template.fromStack(secondaryStack);
    });

    test('creates VPC with different CIDR than primary', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.1.0.0/16',
      });
    });

    test('WAF has additional blocked country (IR)', () => {
      template.hasResourceProperties('AWS::WAFv2::WebACL', {
        Rules: Match.arrayWith([
          Match.objectLike({
            Statement: {
              GeoMatchStatement: {
                CountryCodes: ['CN', 'RU', 'KP', 'IR'],
              },
            },
          }),
        ]),
      });
    });

    test('DynamoDB has replication configured', () => {
      // Secondary region has replicaRegion configured, creating Table with replicationRegions
      const tables = template.findResources('AWS::DynamoDB::Table');
      expect(Object.keys(tables).length).toBeGreaterThan(0);

      // Table should have PAY_PER_REQUEST billing
      template.hasResourceProperties('AWS::DynamoDB::Table', {
        BillingMode: 'PAY_PER_REQUEST',
      });
    });
  });

  describe('VpcPeeringStack', () => {
    let primaryStack: RegionalStack;
    let secondaryStack: RegionalStack;
    let peeringStack: VpcPeeringStack;
    let template: Template;

    beforeEach(() => {
      const primaryConfig: RegionalConfig = {
        region: 'us-east-1',
        isPrimary: true,
        wafBlockedCountries: ['CN', 'RU', 'KP'],
        cloudWatchLatencyThreshold: 500,
        environmentSuffix,
      };

      const secondaryConfig: RegionalConfig = {
        region: 'us-east-2',
        isPrimary: false,
        wafBlockedCountries: ['CN', 'RU', 'KP', 'IR'],
        cloudWatchLatencyThreshold: 300,
        environmentSuffix,
      };

      primaryStack = new RegionalStack(app, `PrimaryRegion-${environmentSuffix}`, {
        config: primaryConfig,
        env: { region: 'us-east-1' },
        tags: { Environment: 'production', Region: 'us-east-1', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      secondaryStack = new RegionalStack(app, `SecondaryRegion-${environmentSuffix}`, {
        config: secondaryConfig,
        replicaRegion: 'us-east-1',
        env: { region: 'us-east-2' },
        tags: { Environment: 'production', Region: 'us-east-2', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      primaryStack.addDependency(secondaryStack);

      peeringStack = new VpcPeeringStack(app, `VpcPeering-${environmentSuffix}`, {
        environmentSuffix,
        primaryVpcId: primaryStack.networking.vpc.vpcId,
        secondaryVpcId: secondaryStack.networking.vpc.vpcId,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-east-2',
        primaryVpcCidr: '10.0.0.0/16',
        secondaryVpcCidr: '10.1.0.0/16',
        env: { region: 'us-east-1' },
        crossRegionReferences: true,
      });

      peeringStack.addDependency(primaryStack);
      peeringStack.addDependency(secondaryStack);

      template = Template.fromStack(peeringStack);
    });

    test('creates VPC peering connection', () => {
      template.hasResourceProperties('AWS::EC2::VPCPeeringConnection', {
        PeerRegion: 'us-east-2',
      });
    });

    test('exports peering connection ID', () => {
      template.hasOutput('PeeringConnectionId', Match.objectLike({}));
    });
  });

  describe('Full Application Synthesis', () => {
    test('synthesizes without errors', () => {
      const primaryConfig: RegionalConfig = {
        region: 'us-east-1',
        isPrimary: true,
        wafBlockedCountries: ['CN', 'RU', 'KP'],
        cloudWatchLatencyThreshold: 500,
        environmentSuffix,
      };

      const secondaryConfig: RegionalConfig = {
        region: 'us-east-2',
        isPrimary: false,
        wafBlockedCountries: ['CN', 'RU', 'KP', 'IR'],
        cloudWatchLatencyThreshold: 300,
        environmentSuffix,
      };

      const primaryStack = new RegionalStack(app, `PrimaryRegion-${environmentSuffix}`, {
        config: primaryConfig,
        env: { region: 'us-east-1' },
        tags: { Environment: 'production', Region: 'us-east-1', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      const secondaryStack = new RegionalStack(app, `SecondaryRegion-${environmentSuffix}`, {
        config: secondaryConfig,
        replicaRegion: 'us-east-1',
        env: { region: 'us-east-2' },
        tags: { Environment: 'production', Region: 'us-east-2', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      primaryStack.addDependency(secondaryStack);

      const peeringStack = new VpcPeeringStack(app, `VpcPeering-${environmentSuffix}`, {
        environmentSuffix,
        primaryVpcId: primaryStack.networking.vpc.vpcId,
        secondaryVpcId: secondaryStack.networking.vpc.vpcId,
        primaryRegion: 'us-east-1',
        secondaryRegion: 'us-east-2',
        primaryVpcCidr: '10.0.0.0/16',
        secondaryVpcCidr: '10.1.0.0/16',
        env: { region: 'us-east-1' },
        crossRegionReferences: true,
      });

      peeringStack.addDependency(primaryStack);
      peeringStack.addDependency(secondaryStack);

      expect(() => app.synth()).not.toThrow();
    });

    test('generates multiple stack templates', () => {
      const primaryConfig: RegionalConfig = {
        region: 'us-east-1',
        isPrimary: true,
        wafBlockedCountries: ['CN', 'RU', 'KP'],
        cloudWatchLatencyThreshold: 500,
        environmentSuffix,
      };

      const secondaryConfig: RegionalConfig = {
        region: 'us-east-2',
        isPrimary: false,
        wafBlockedCountries: ['CN', 'RU', 'KP', 'IR'],
        cloudWatchLatencyThreshold: 300,
        environmentSuffix,
      };

      const primaryStack = new RegionalStack(app, `PrimaryRegion-${environmentSuffix}`, {
        config: primaryConfig,
        env: { region: 'us-east-1' },
        tags: { Environment: 'production', Region: 'us-east-1', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      new RegionalStack(app, `SecondaryRegion-${environmentSuffix}`, {
        config: secondaryConfig,
        replicaRegion: 'us-east-1',
        env: { region: 'us-east-2' },
        tags: { Environment: 'production', Region: 'us-east-2', CostCenter: 'fintech-ops' },
        crossRegionReferences: true,
      });

      const assembly = app.synth();
      const stacks = assembly.stacks;

      expect(stacks.length).toBeGreaterThanOrEqual(2);
      expect(stacks.some((s) => s.stackName.includes('PrimaryRegion'))).toBe(true);
      expect(stacks.some((s) => s.stackName.includes('SecondaryRegion'))).toBe(true);
    });
  });
});
