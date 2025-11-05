import { beforeEach, describe, expect, test } from "@jest/globals";
import { App } from "cdktf";
import "cdktf/lib/testing/adapters/jest";
import * as fs from 'fs';
import * as path from 'path';
import { TapStack } from "../lib/tap-stack";

// Helper to get dynamic region and account for region-agnostic tests
// Read from lib/AWS_REGION file, fallback to environment variables, then default
const getTestRegion = () => {
  try {
    const regionFile = path.join(__dirname, '..', 'lib', 'AWS_REGION');
    const fileRegion = fs.readFileSync(regionFile, 'utf-8').trim();
    return fileRegion || process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-2';
  } catch {
    return process.env.AWS_DEFAULT_REGION || process.env.AWS_REGION || 'us-east-2';
  }
};
const getTestAccountId = () => process.env.AWS_ACCOUNT_ID || '123456789012';
const TEST_REGION = getTestRegion();
const TEST_ACCOUNT_ID = getTestAccountId();
const DR_REGION = 'us-west-2'; // DR region is fixed as per stack implementation

// Mock CDKTF components
jest.mock("cdktf", () => {
  const actual = jest.requireActual("cdktf");
  return {
    ...actual,
    TerraformOutput: jest.fn(),
    S3Backend: jest.fn().mockImplementation((scope: any, config: any) => ({
      addOverride: jest.fn()
    })),
    TerraformStack: actual.TerraformStack,
  };
});

// Mock AWS Provider
jest.mock("@cdktf/provider-aws/lib/provider", () => ({
  AwsProvider: jest.fn(),
}));

// Mock AWS data sources
jest.mock("@cdktf/provider-aws/lib/data-aws-caller-identity", () => ({
  DataAwsCallerIdentity: jest.fn().mockImplementation(() => ({
    accountId: TEST_ACCOUNT_ID
  }))
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-availability-zones", () => ({
  DataAwsAvailabilityZones: jest.fn().mockImplementation(() => ({
    names: ['${data.aws_availability_zones.azs.names[0]}', '${data.aws_availability_zones.azs.names[1]}', '${data.aws_availability_zones.azs.names[2]}']
  }))
}));

jest.mock("@cdktf/provider-aws/lib/data-aws-iam-policy-document", () => ({
  DataAwsIamPolicyDocument: jest.fn().mockImplementation(() => ({
    json: '{"Version":"2012-10-17","Statement":[]}'
  }))
}));

// Mock VPC and Networking Resources
jest.mock("@cdktf/provider-aws/lib/vpc", () => ({
  Vpc: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `vpc-${id}`,
    cidrBlock: config.cidrBlock,
    enableDnsHostnames: config.enableDnsHostnames,
    enableDnsSupport: config.enableDnsSupport,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/subnet", () => ({
  Subnet: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `subnet-${id}`,
    vpcId: config.vpcId,
    cidrBlock: config.cidrBlock,
    availabilityZone: config.availabilityZone,
    mapPublicIpOnLaunch: config.mapPublicIpOnLaunch,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/internet-gateway", () => ({
  InternetGateway: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `igw-${id}`,
    vpcId: config.vpcId,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/nat-gateway", () => ({
  NatGateway: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `nat-${id}`,
    allocationId: config.allocationId,
    subnetId: config.subnetId,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/eip", () => ({
  Eip: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `eip-${id}`,
    domain: config.domain,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/route-table", () => ({
  RouteTable: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `rt-${id}`,
    vpcId: config.vpcId,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/route", () => ({
  Route: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `route-${id}`,
    routeTableId: config.routeTableId,
    destinationCidrBlock: config.destinationCidrBlock,
    gatewayId: config.gatewayId,
    natGatewayId: config.natGatewayId
  }))
}));

jest.mock("@cdktf/provider-aws/lib/route-table-association", () => ({
  RouteTableAssociation: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `rta-${id}`,
    subnetId: config.subnetId,
    routeTableId: config.routeTableId
  }))
}));

// Mock Security Groups
jest.mock("@cdktf/provider-aws/lib/security-group", () => ({
  SecurityGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `sg-${id}`,
    name: config.name,
    description: config.description,
    vpcId: config.vpcId,
    ingress: config.ingress,
    egress: config.egress,
    tags: config.tags
  }))
}));

// Mock VPC Endpoints
jest.mock("@cdktf/provider-aws/lib/vpc-endpoint", () => ({
  VpcEndpoint: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `vpce-${id}`,
    vpcId: config.vpcId,
    serviceName: config.serviceName,
    vpcEndpointType: config.vpcEndpointType,
    subnetIds: config.subnetIds,
    securityGroupIds: config.securityGroupIds,
    routeTableIds: config.routeTableIds,
    tags: config.tags
  }))
}));

// Mock KMS
jest.mock("@cdktf/provider-aws/lib/kms-key", () => ({
  KmsKey: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `key-${id}`,
    arn: `arn:aws:kms:${TEST_REGION}:${TEST_ACCOUNT_ID}:key/${id}`,
    description: config.description,
    enableKeyRotation: config.enableKeyRotation,
    deletionWindowInDays: config.deletionWindowInDays,
    tags: config.tags
  }))
}));

// Mock Secrets Manager
jest.mock("@cdktf/provider-aws/lib/secretsmanager-secret", () => ({
  SecretsmanagerSecret: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `secret-${id}`,
    arn: `arn:aws:secretsmanager:${TEST_REGION}:${TEST_ACCOUNT_ID}:secret:${config.name}-abcdef`,
    name: config.name,
    description: config.description,
    kmsKeyId: config.kmsKeyId,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/secretsmanager-secret-version", () => ({
  SecretsmanagerSecretVersion: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `secret-version-${id}`,
    secretId: config.secretId,
    secretString: config.secretString
  }))
}));

// Mock RDS
jest.mock("@cdktf/provider-aws/lib/db-subnet-group", () => ({
  DbSubnetGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `db-subnet-group-${id}`,
    name: config.name,
    subnetIds: config.subnetIds,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/rds-cluster", () => ({
  RdsCluster: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `rds-cluster-${id}`,
    clusterIdentifier: config.clusterIdentifier,
    engine: config.engine,
    engineVersion: config.engineVersion,
    endpoint: `${config.clusterIdentifier}.cluster-xyz.${TEST_REGION}.rds.amazonaws.com`,
    masterUsername: config.masterUsername,
    databaseName: config.databaseName,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/rds-cluster-instance", () => ({
  RdsClusterInstance: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `rds-instance-${id}`,
    identifier: config.identifier,
    clusterIdentifier: config.clusterIdentifier,
    instanceClass: config.instanceClass,
    engine: config.engine,
    tags: config.tags
  }))
}));

// Mock S3
jest.mock("@cdktf/provider-aws/lib/s3-bucket", () => ({
  S3Bucket: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `s3-${id}`,
    bucket: config.bucket,
    bucketDomainName: `${config.bucket}.s3.amazonaws.com`,
    arn: `arn:aws:s3:::${config.bucket}`,
    forceDestroy: config.forceDestroy,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration", () => ({
  S3BucketLifecycleConfiguration: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `s3-lifecycle-${id}`,
    bucket: config.bucket,
    rule: config.rule
  }))
}));

// Mock Load Balancer
jest.mock("@cdktf/provider-aws/lib/lb", () => ({
  Lb: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `alb-${id}`,
    arn: `arn:aws:elasticloadbalancing:${TEST_REGION}:${TEST_ACCOUNT_ID}:loadbalancer/app/${config.name}/abcdef`,
    dnsName: `${config.name}-123456789.${TEST_REGION}.elb.amazonaws.com`,
    arnSuffix: `app/${config.name}/abcdef`,
    name: config.name,
    loadBalancerType: config.loadBalancerType,
    subnets: config.subnets,
    securityGroups: config.securityGroups,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/lb-target-group", () => ({
  LbTargetGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `tg-${id}`,
    arn: `arn:aws:elasticloadbalancing:${TEST_REGION}:${TEST_ACCOUNT_ID}:targetgroup/${config.name}/abcdef`,
    name: config.name,
    port: config.port,
    protocol: config.protocol,
    vpcId: config.vpcId,
    targetType: config.targetType,
    healthCheck: config.healthCheck,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/lb-listener", () => ({
  LbListener: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `listener-${id}`,
    arn: `arn:aws:elasticloadbalancing:${TEST_REGION}:${TEST_ACCOUNT_ID}:listener/app/alb-name/abcdef/12345`,
    loadBalancerArn: config.loadBalancerArn,
    port: config.port,
    protocol: config.protocol,
    defaultAction: config.defaultAction
  }))
}));

// Mock ECS
jest.mock("@cdktf/provider-aws/lib/ecs-cluster", () => ({
  EcsCluster: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `ecs-cluster-${id}`,
    name: config.name,
    arn: `arn:aws:ecs:${TEST_REGION}:${TEST_ACCOUNT_ID}:cluster/${config.name}`,
    setting: config.setting,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/ecs-task-definition", () => ({
  EcsTaskDefinition: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `ecs-task-${id}`,
    arn: `arn:aws:ecs:${TEST_REGION}:${TEST_ACCOUNT_ID}:task-definition/${config.family}:1`,
    family: config.family,
    networkMode: config.networkMode,
    requiresCompatibilities: config.requiresCompatibilities,
    cpu: config.cpu,
    memory: config.memory,
    executionRoleArn: config.executionRoleArn,
    taskRoleArn: config.taskRoleArn,
    containerDefinitions: config.containerDefinitions,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/ecs-service", () => ({
  EcsService: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `ecs-service-${id}`,
    name: config.name,
    cluster: config.cluster,
    taskDefinition: config.taskDefinition,
    desiredCount: config.desiredCount,
    launchType: config.launchType,
    networkConfiguration: config.networkConfiguration,
    loadBalancer: config.loadBalancer,
    tags: config.tags
  }))
}));

// Mock CloudFront
jest.mock("@cdktf/provider-aws/lib/cloudfront-distribution", () => ({
  CloudfrontDistribution: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `cf-${id}`,
    domainName: `d123456789abcdef.cloudfront.net`,
    enabled: config.enabled,
    isIpv6Enabled: config.isIpv6Enabled,
    comment: config.comment,
    defaultRootObject: config.defaultRootObject,
    origin: config.origin,
    defaultCacheBehavior: config.defaultCacheBehavior,
    orderedCacheBehavior: config.orderedCacheBehavior,
    restrictions: config.restrictions,
    viewerCertificate: config.viewerCertificate,
    tags: config.tags
  }))
}));

// Mock WAF
jest.mock("@cdktf/provider-aws/lib/wafv2-web-acl", () => ({
  Wafv2WebAcl: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `waf-${id}`,
    arn: `arn:aws:wafv2:${TEST_REGION}:${TEST_ACCOUNT_ID}:global/webacl/${config.name}/abcdef`,
    name: config.name,
    description: config.description,
    scope: config.scope,
    defaultAction: config.defaultAction,
    rule: config.rule,
    visibilityConfig: config.visibilityConfig,
    tags: config.tags
  }))
}));

// Mock IAM
jest.mock("@cdktf/provider-aws/lib/iam-role", () => ({
  IamRole: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `role-${id}`,
    arn: `arn:aws:iam::${TEST_ACCOUNT_ID}:role/${config.name}`,
    name: config.name,
    assumeRolePolicy: config.assumeRolePolicy,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/iam-policy", () => ({
  IamPolicy: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `policy-${id}`,
    arn: `arn:aws:iam::${TEST_ACCOUNT_ID}:policy/${config.name}`,
    name: config.name,
    policy: config.policy
  }))
}));

jest.mock("@cdktf/provider-aws/lib/iam-role-policy-attachment", () => ({
  IamRolePolicyAttachment: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `attachment-${id}`,
    role: config.role,
    policyArn: config.policyArn
  }))
}));

// Mock CloudWatch
jest.mock("@cdktf/provider-aws/lib/cloudwatch-log-group", () => ({
  CloudwatchLogGroup: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `log-group-${id}`,
    name: config.name,
    arn: `arn:aws:logs:${TEST_REGION}:${TEST_ACCOUNT_ID}:log-group:${config.name}:*`,
    retentionInDays: config.retentionInDays,
    kmsKeyId: config.kmsKeyId,
    tags: config.tags
  }))
}));

jest.mock("@cdktf/provider-aws/lib/cloudwatch-dashboard", () => ({
  CloudwatchDashboard: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `dashboard-${id}`,
    dashboardName: config.dashboardName,
    dashboardBody: config.dashboardBody
  }))
}));

// Mock Auto Scaling
jest.mock("@cdktf/provider-aws/lib/appautoscaling-target", () => ({
  AppautoscalingTarget: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `target-${id}`,
    maxCapacity: config.maxCapacity,
    minCapacity: config.minCapacity,
    resourceId: config.resourceId,
    scalableDimension: config.scalableDimension,
    serviceNamespace: config.serviceNamespace
  }))
}));

jest.mock("@cdktf/provider-aws/lib/appautoscaling-policy", () => ({
  AppautoscalingPolicy: jest.fn().mockImplementation((scope: any, id: string, config: any) => ({
    id: `policy-${id}`,
    name: config.name,
    policyType: config.policyType,
    resourceId: config.resourceId,
    scalableDimension: config.scalableDimension,
    serviceNamespace: config.serviceNamespace,
    targetTrackingScalingPolicyConfiguration: config.targetTrackingScalingPolicyConfiguration
  }))
}));

describe("TapStack Unit Tests", () => {
  const { TerraformOutput, S3Backend } = require("cdktf");
  const { AwsProvider } = require("@cdktf/provider-aws/lib/provider");
  const { DataAwsCallerIdentity } = require("@cdktf/provider-aws/lib/data-aws-caller-identity");
  const { DataAwsAvailabilityZones } = require("@cdktf/provider-aws/lib/data-aws-availability-zones");
  const { Vpc } = require("@cdktf/provider-aws/lib/vpc");
  const { Subnet } = require("@cdktf/provider-aws/lib/subnet");
  const { InternetGateway } = require("@cdktf/provider-aws/lib/internet-gateway");
  const { SecurityGroup } = require("@cdktf/provider-aws/lib/security-group");
  const { KmsKey } = require("@cdktf/provider-aws/lib/kms-key");
  const { RdsCluster } = require("@cdktf/provider-aws/lib/rds-cluster");
  const { EcsCluster } = require("@cdktf/provider-aws/lib/ecs-cluster");

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Stack Creation and Configuration", () => {
    test("should create TapStack with default configuration", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack");

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);

      // Verify AWS Provider is configured with default region
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: TEST_REGION,
          defaultTags: []
        })
      );

      // Verify secondary AWS Provider for DR
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws-dr',
        expect.objectContaining({
          alias: 'dr',
          region: 'us-west-2'
        })
      );
    });

    test("should create TapStack with custom AWS region", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: 'eu-west-1'
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: 'eu-west-1'
        })
      );

      // DR region should remain us-west-2
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws-dr',
        expect.objectContaining({
          alias: 'dr',
          region: 'us-west-2'
        })
      );
    });

    test("should create TapStack with custom environment suffix", () => {
      const app = new App();
      const stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      expect(stack).toBeDefined();

      // Verify S3Backend uses custom environment suffix
      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          key: 'production/TestStack.tfstate'
        })
      );
    });

    test("should create TapStack with custom default tags", () => {
      const app = new App();
      const customTags = {
        tags: {
          Team: 'Platform',
          CostCenter: 'Engineering'
        }
      };

      new TapStack(app, "TestStack", {
        defaultTags: customTags
      });

      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          defaultTags: [customTags]
        })
      );
    });

    test("should get account ID and availability zones", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(DataAwsCallerIdentity).toHaveBeenCalledWith(
        expect.anything(),
        'caller-identity'
      );

      expect(DataAwsAvailabilityZones).toHaveBeenCalledWith(
        expect.anything(),
        'azs',
        expect.objectContaining({
          state: 'available'
        })
      );
    });
  });

  describe("S3 Backend Configuration", () => {
    test("should configure S3 backend with default settings", () => {
      const app = new App();
      const mockAddOverride = jest.fn();
      const originalPrototype = TapStack.prototype.addOverride;
      TapStack.prototype.addOverride = mockAddOverride;

      new TapStack(app, "TestStack");

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'iac-rlhf-tf-states',
          key: 'dev/TestStack.tfstate',
          region: TEST_REGION,
          encrypt: true
        })
      );

      expect(mockAddOverride).toHaveBeenCalledWith(
        'terraform.backend.s3.use_lockfile',
        true
      );

      TapStack.prototype.addOverride = originalPrototype;
    });

    test("should configure S3 backend with custom settings", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        stateBucket: 'custom-state-bucket',
        stateBucketRegion: 'eu-central-1',
        environmentSuffix: 'production'
      });

      expect(S3Backend).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          bucket: 'custom-state-bucket',
          key: 'production/TestStack.tfstate',
          region: 'eu-central-1',
          encrypt: true
        })
      );
    });
  });

  describe("Infrastructure Components", () => {
    let app: App;
    let stack: TapStack;

    beforeEach(() => {
      app = new App();
      stack = new TapStack(app, "TestStack", {
        environmentSuffix: 'test',
        awsRegion: TEST_REGION
      });
    });

    test("should create KMS key with proper configuration", () => {
      expect(KmsKey).toHaveBeenCalledWith(
        expect.anything(),
        'kms-key',
        expect.objectContaining({
          description: 'Fintech Application KMS Key - test',
          enableKeyRotation: true,
          deletionWindowInDays: 7,
          tags: expect.objectContaining({
            Name: 'fintech-kms-key-test',
            Environment: 'test'
          })
        })
      );
    });

    test("should create VPC with correct configuration", () => {
      expect(Vpc).toHaveBeenCalledWith(
        expect.anything(),
        'vpc',
        expect.objectContaining({
          cidrBlock: '10.0.0.0/16',
          enableDnsHostnames: true,
          enableDnsSupport: true,
          tags: expect.objectContaining({
            Name: 'fintech-vpc-test',
            Environment: 'test'
          })
        })
      );
    });

    test("should create internet gateway", () => {
      expect(InternetGateway).toHaveBeenCalledWith(
        expect.anything(),
        'igw',
        expect.objectContaining({
          tags: expect.objectContaining({
            Name: 'fintech-igw-test',
            Environment: 'test'
          })
        })
      );
    });

    test("should create public and private subnets", () => {
      // Check for public subnets
      expect(Subnet).toHaveBeenCalledWith(
        expect.anything(),
        'public-subnet-0',
        expect.objectContaining({
          cidrBlock: '10.0.1.0/24',
          mapPublicIpOnLaunch: true,
          tags: expect.objectContaining({
            Name: 'fintech-public-subnet-1-test',
            Environment: 'test',
            Type: 'public'
          })
        })
      );

      // Check for private subnets
      expect(Subnet).toHaveBeenCalledWith(
        expect.anything(),
        'private-subnet-0',
        expect.objectContaining({
          cidrBlock: '10.0.10.0/24',
          tags: expect.objectContaining({
            Name: 'fintech-private-subnet-1-test',
            Environment: 'test',
            Type: 'private'
          })
        })
      );
    });

    test("should create security groups for ALB, ECS, and RDS", () => {
      // ALB Security Group
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'alb-sg',
        expect.objectContaining({
          name: 'fintech-alb-sg-test',
          description: 'Security group for Application Load Balancer',
          ingress: expect.arrayContaining([
            expect.objectContaining({
              fromPort: 80,
              toPort: 80,
              protocol: 'tcp',
              cidrBlocks: ['0.0.0.0/0'],
              description: 'HTTP'
            })
          ])
        })
      );

      // ECS Security Group
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'ecs-sg',
        expect.objectContaining({
          name: 'fintech-ecs-sg-test',
          description: 'Security group for ECS tasks'
        })
      );

      // RDS Security Group
      expect(SecurityGroup).toHaveBeenCalledWith(
        expect.anything(),
        'rds-sg',
        expect.objectContaining({
          name: 'fintech-rds-sg-test',
          description: 'Security group for RDS Aurora cluster'
        })
      );
    });

    test("should create RDS Aurora PostgreSQL cluster", () => {
      expect(RdsCluster).toHaveBeenCalledWith(
        expect.anything(),
        'rds-cluster',
        expect.objectContaining({
          clusterIdentifier: 'fintech-aurora-cluster-test',
          engine: 'aurora-postgresql',
          engineVersion: '15.6',
          masterUsername: 'postgres',
          databaseName: 'fintech',
          storageEncrypted: true,
          backupRetentionPeriod: 7,
          skipFinalSnapshot: true,
          deletionProtection: false,
          manageMasterUserPassword: true,
          preferredBackupWindow: '03:00-04:00',
          preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
          tags: expect.objectContaining({
            Name: 'fintech-aurora-cluster-test',
            Environment: 'test'
          })
        })
      );
    });

    test("should create ECS cluster", () => {
      expect(EcsCluster).toHaveBeenCalledWith(
        expect.anything(),
        'ecs-cluster',
        expect.objectContaining({
          name: 'fintech-cluster-test',
          setting: [
            {
              name: 'containerInsights',
              value: 'enabled'
            }
          ],
          tags: expect.objectContaining({
            Name: 'fintech-cluster-test',
            Environment: 'test'
          })
        })
      );
    });

    test("should create terraform outputs", () => {
      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'vpc-id',
        expect.objectContaining({
          description: 'VPC ID'
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'load-balancer-dns',
        expect.objectContaining({
          description: 'Load Balancer DNS Name'
        })
      );

      expect(TerraformOutput).toHaveBeenCalledWith(
        expect.anything(),
        'cloudfront-domain',
        expect.objectContaining({
          description: 'CloudFront Distribution Domain Name'
        })
      );
    });
  });

  describe("Resource Naming and Tagging", () => {
    test("should use consistent naming convention across environments", () => {
      const environments = ['dev', 'staging', 'prod'];

      environments.forEach(env => {
        jest.clearAllMocks();
        const app = new App();
        new TapStack(app, `TestStack${env}`, {
          environmentSuffix: env
        });

        // Verify VPC naming
        expect(Vpc).toHaveBeenCalledWith(
          expect.anything(),
          'vpc',
          expect.objectContaining({
            tags: expect.objectContaining({
              Name: `fintech-vpc-${env}`,
              Environment: env
            })
          })
        );

        // Verify ECS cluster naming
        expect(EcsCluster).toHaveBeenCalledWith(
          expect.anything(),
          'ecs-cluster',
          expect.objectContaining({
            name: `fintech-cluster-${env}`,
            tags: expect.objectContaining({
              Name: `fintech-cluster-${env}`,
              Environment: env
            })
          })
        );
      });
    });

    test("should apply environment tags consistently", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        environmentSuffix: 'production'
      });

      // Check that all resources have Environment tag
      expect(Vpc).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'production'
          })
        })
      );

      expect(RdsCluster).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({
          tags: expect.objectContaining({
            Environment: 'production'
          })
        })
      );
    });
  });

  describe("Security Configuration", () => {
    test("should enable encryption for RDS cluster", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(RdsCluster).toHaveBeenCalledWith(
        expect.anything(),
        'rds-cluster',
        expect.objectContaining({
          storageEncrypted: true
        })
      );
    });

    test("should configure KMS key rotation", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(KmsKey).toHaveBeenCalledWith(
        expect.anything(),
        'kms-key',
        expect.objectContaining({
          enableKeyRotation: true
        })
      );
    });

    test("should disable delete protection for cost savings", () => {
      const app = new App();
      new TapStack(app, "TestStack");

      expect(RdsCluster).toHaveBeenCalledWith(
        expect.anything(),
        'rds-cluster',
        expect.objectContaining({
          deletionProtection: false,
          skipFinalSnapshot: true
        })
      );

      expect(KmsKey).toHaveBeenCalledWith(
        expect.anything(),
        'kms-key',
        expect.objectContaining({
          deletionWindowInDays: 7
        })
      );
    });
  });

  describe("Multi-Region Configuration", () => {
    test("should create resources in multiple regions", () => {
      const app = new App();
      new TapStack(app, "TestStack", {
        awsRegion: TEST_REGION
      });

      // Primary region provider
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: TEST_REGION
        })
      );

      // DR region provider
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws-dr',
        expect.objectContaining({
          alias: 'dr',
          region: 'us-west-2'
        })
      );
    });
  });

  describe("Error Handling", () => {
    test("should handle missing props gracefully", () => {
      const app = new App();

      expect(() => {
        new TapStack(app, "TestStack");
      }).not.toThrow();

      // Should use default values
      expect(AwsProvider).toHaveBeenCalledWith(
        expect.anything(),
        'aws',
        expect.objectContaining({
          region: TEST_REGION,
          defaultTags: []
        })
      );
    });

    test("should handle undefined optional properties", () => {
      const app = new App();

      expect(() => {
        new TapStack(app, "TestStack", {
          environmentSuffix: undefined,
          awsRegion: undefined
        });
      }).not.toThrow();
    });
  });
});