// main.ts
import { App, TerraformStack, TerraformOutput, TerraformAsset } from "cdktf";
import { Construct } from "constructs";
import {
  AwsProvider,
} from "@cdktf/provider-aws/lib/provider";

// ---------- Security (KMS, IAM) ----------
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";

// ---------- Network (VPC, Subnets, RTs, NAT, SGs) ----------
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

// ---------- Data (DDB Global, S3 w/CRR) ----------
import { DynamodbTable } from "@cdktf/provider-aws/lib/dynamodb-table";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioningV2 } from "@cdktf/provider-aws/lib/s3-bucket-versioning-v2";
import { S3BucketServerSideEncryptionConfigurationV2 } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration-v2";
import { S3BucketReplicationConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-replication-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { DataAwsCallerIdentity } from "@cdktf/provider-aws/lib/data-aws-caller-identity";

// ---------- Monitoring (ALB, Health, Alarms, Logs) ----------
import { Alb } from "@cdktf/provider-aws/lib/alb";
import { AlbTargetGroup } from "@cdktf/provider-aws/lib/alb-target-group";
import { AlbListener } from "@cdktf/provider-aws/lib/alb-listener";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { Route53HealthCheck } from "@cdktf/provider-aws/lib/route53-health-check";
import { DataAwsSecurityGroup } from "@cdktf/provider-aws/lib/data-aws-security-group";

// ---------- Failover (Route53, Lambda, EventBridge) ----------
import { Route53Zone } from "@cdktf/provider-aws/lib/route53-zone";
import { Route53Record } from "@cdktf/provider-aws/lib/route53-record";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { CloudwatchEventRule } from "@cdktf/provider-aws/lib/cloudwatch-event-rule";
import { CloudwatchEventTarget } from "@cdktf/provider-aws/lib/cloudwatch-event-target";
import { LambdaPermission } from "@cdktf/provider-aws/lib/lambda-permission";

// ---------- Node stdlib for inline Lambda asset ----------
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

// =========================
// SecurityResources
// =========================
interface SecurityResourcesConfig {
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  tags: { [key: string]: string };
}
class SecurityResources extends Construct {
  public readonly primaryKmsKey: KmsKey;
  public readonly secondaryKmsKey: KmsKey;
  public readonly lambdaExecutionRole: IamRole;

  constructor(scope: Construct, id: string, config: SecurityResourcesConfig) {
    super(scope, id);

    this.primaryKmsKey = new KmsKey(this, "primary-kms-key", {
      provider: config.primaryProvider,
      description: "KMS key for financial processor - primary region",
      enableKeyRotation: true,
      tags: config.tags,
    });

    new KmsAlias(this, "primary-kms-alias", {
      provider: config.primaryProvider,
      name: "alias/financial-processor-primary",
      targetKeyId: this.primaryKmsKey.keyId,
    });

    this.secondaryKmsKey = new KmsKey(this, "secondary-kms-key", {
      provider: config.secondaryProvider,
      description: "KMS key for financial processor - secondary region",
      enableKeyRotation: true,
      tags: config.tags,
    });

    new KmsAlias(this, "secondary-kms-alias", {
      provider: config.secondaryProvider,
      name: "alias/financial-processor-secondary",
      targetKeyId: this.secondaryKmsKey.keyId,
    });

    this.lambdaExecutionRole = new IamRole(this, "lambda-execution-role", {
      name: "financial-processor-lambda-role",
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: { Service: "lambda.amazonaws.com" },
          },
        ],
      }),
      tags: config.tags,
    });

    new IamRolePolicyAttachment(this, "lambda-basic-execution", {
      role: this.lambdaExecutionRole.name,
      policyArn:
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
    });

    new IamRolePolicy(this, "lambda-monitoring-policy", {
      role: this.lambdaExecutionRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "route53:ChangeResourceRecordSets",
              "route53:GetHealthCheck",
              "route53:ListHealthChecks",
              "cloudwatch:PutMetricData",
            ],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "elasticloadbalancing:DescribeLoadBalancers",
              "elasticloadbalancing:DescribeTargetHealth",
            ],
            Resource: "*",
          },
        ],
      }),
    });
  }
}

// =========================
// NetworkResources
// =========================
interface NetworkResourcesConfig {
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  tags: { [key: string]: string };
  appName: string;
}
class NetworkResources extends Construct {
  public readonly primaryVpc: Vpc;
  public readonly secondaryVpc: Vpc;
  public readonly primaryPrivateSubnetIds: string[] = [];
  public readonly secondaryPrivateSubnetIds: string[] = [];
  public readonly primaryPublicSubnetIds: string[] = [];
  public readonly secondaryPublicSubnetIds: string[] = [];

  constructor(scope: Construct, id: string, config: NetworkResourcesConfig) {
    super(scope, id);

    this.primaryVpc = this.createVpcResources(
      "primary",
      config.primaryProvider,
      "10.0.0.0/16",
      config.tags
    );

    this.secondaryVpc = this.createVpcResources(
      "secondary",
      config.secondaryProvider,
      "10.1.0.0/16",
      config.tags
    );
  }

  private createVpcResources(
    region: string,
    provider: AwsProvider,
    cidrBlock: string,
    tags: { [key: string]: string }
  ): Vpc {
    const azs = new DataAwsAvailabilityZones(this, `${region}-azs`, {
      provider,
      state: "available",
    });

    const vpc = new Vpc(this, `${region}-vpc`, {
      provider,
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: { ...tags, Name: `financial-processor-${region}` },
    });

    const igw = new InternetGateway(this, `${region}-igw`, {
      provider,
      vpcId: vpc.id,
      tags: { ...tags, Name: `financial-processor-${region}-igw` },
    });

    const publicSubnets: Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `${region}-public-subnet-${i}`, {
        provider,
        vpcId: vpc.id,
        cidrBlock: `${cidrBlock.split(".").slice(0, 2).join(".")}.${i}.0/24`,
        availabilityZone: `\${${azs.names.fqn}[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          ...tags,
          Name: `financial-processor-${region}-public-${i}`,
          Type: "public",
        },
      });
      publicSubnets.push(subnet);

      if (region === "primary") {
        this.primaryPublicSubnetIds.push(subnet.id);
      } else {
        this.secondaryPublicSubnetIds.push(subnet.id);
      }
    }

    const natGateways: NatGateway[] = [];
    publicSubnets.forEach((subnet, i) => {
      const eip = new Eip(this, `${region}-nat-eip-${i}`, {
        provider,
        domain: "vpc",
        tags: { ...tags, Name: `financial-processor-${region}-nat-eip-${i}` },
      });

      const nat = new NatGateway(this, `${region}-nat-${i}`, {
        provider,
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: { ...tags, Name: `financial-processor-${region}-nat-${i}` },
      });
      natGateways.push(nat);
    });

    const privateSubnets: Subnet[] = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `${region}-private-subnet-${i}`, {
        provider,
        vpcId: vpc.id,
        cidrBlock: `${cidrBlock.split(".").slice(0, 2).join(".")}.${
          i + 10
        }.0/24`,
        availabilityZone: `\${${azs.names.fqn}[${i}]}`,
        tags: {
          ...tags,
          Name: `financial-processor-${region}-private-${i}`,
          Type: "private",
        },
      });
      privateSubnets.push(subnet);

      if (region === "primary") {
        this.primaryPrivateSubnetIds.push(subnet.id);
      } else {
        this.secondaryPrivateSubnetIds.push(subnet.id);
      }
    }

    const publicRouteTable = new RouteTable(this, `${region}-public-rt`, {
      provider,
      vpcId: vpc.id,
      tags: { ...tags, Name: `financial-processor-${region}-public-rt` },
    });

    new Route(this, `${region}-public-route`, {
      provider,
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    publicSubnets.forEach((subnet, i) => {
      new RouteTableAssociation(this, `${region}-public-rta-${i}`, {
        provider,
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    privateSubnets.forEach((subnet, i) => {
      const privateRouteTable = new RouteTable(this, `${region}-private-rt-${i}`, {
        provider,
        vpcId: vpc.id,
        tags: { ...tags, Name: `financial-processor-${region}-private-rt-${i}` },
      });

      new Route(this, `${region}-private-route-${i}`, {
        provider,
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: natGateways[i].id,
      });

      new RouteTableAssociation(this, `${region}-private-rta-${i}`, {
        provider,
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    new SecurityGroup(this, `${region}-alb-sg`, {
      provider,
      name: `financial-processor-${region}-alb`,
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS from anywhere",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "Allow all outbound",
        },
      ],
      tags: { ...tags, Name: `financial-processor-${region}-alb-sg` },
    });

    return vpc;
  }
}

// =========================
// DataResources
// =========================
interface DataResourcesConfig {
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  globalProvider: AwsProvider;
  primaryKmsKeyId: string;
  secondaryKmsKeyId: string;
  tags: { [key: string]: string };
  appName: string;
}
class DataResources extends Construct {
  constructor(scope: Construct, id: string, config: DataResourcesConfig) {
    super(scope, id);

    const callerIdentity = new DataAwsCallerIdentity(this, "caller-identity", {
      provider: config.primaryProvider,
    });

    new DynamodbTable(this, "global-transactions-table", {
      provider: config.globalProvider,
      name: "financial-processor-transactions",
      billingMode: "PAY_PER_REQUEST",
      hashKey: "transactionId",
      rangeKey: "timestamp",
      streamEnabled: true,
      streamViewType: "NEW_AND_OLD_IMAGES",
      attribute: [
        { name: "transactionId", type: "S" },
        { name: "timestamp", type: "N" },
      ],
      serverSideEncryption: {
        enabled: true,
        kmsKeyArn: `arn:aws:kms:${config.primaryProvider.region}:${callerIdentity.accountId}:alias/financial-processor-primary`,
      },
      replica: [
        {
          regionName: config.secondaryProvider.region!,
          kmsKeyArn: `arn:aws:kms:${config.secondaryProvider.region}:${callerIdentity.accountId}:alias/financial-processor-secondary`,
        },
      ],
      tags: config.tags,
    });

    const primaryBucket = new S3Bucket(this, "primary-bucket", {
      provider: config.primaryProvider,
      bucket: `${config.appName}-primary-${callerIdentity.accountId}`,
      tags: config.tags,
    });

    const secondaryBucket = new S3Bucket(this, "secondary-bucket", {
      provider: config.secondaryProvider,
      bucket: `${config.appName}-secondary-${callerIdentity.accountId}`,
      tags: config.tags,
    });

    new S3BucketVersioningV2(this, "primary-versioning", {
      provider: config.primaryProvider,
      bucket: primaryBucket.id,
      versioningConfiguration: { status: "Enabled" },
    });

    new S3BucketVersioningV2(this, "secondary-versioning", {
      provider: config.secondaryProvider,
      bucket: secondaryBucket.id,
      versioningConfiguration: { status: "Enabled" },
    });

    new S3BucketServerSideEncryptionConfigurationV2(this, "primary-encryption", {
      provider: config.primaryProvider,
      bucket: primaryBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: config.primaryKmsKeyId,
          },
        },
      ],
    });

    new S3BucketServerSideEncryptionConfigurationV2(this, "secondary-encryption", {
      provider: config.secondaryProvider,
      bucket: secondaryBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: config.secondaryKmsKeyId,
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, "primary-pab", {
      provider: config.primaryProvider,
      bucket: primaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketPublicAccessBlock(this, "secondary-pab", {
      provider: config.secondaryProvider,
      bucket: secondaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const replicationRole = new IamRole(this, "replication-role", {
      provider: config.primaryProvider,
      name: `${config.appName}-s3-replication-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: { Service: "s3.amazonaws.com" },
            Action: "sts:AssumeRole",
          },
        ],
      }),
      tags: config.tags,
    });

    new IamRolePolicy(this, "replication-policy", {
      provider: config.primaryProvider,
      role: replicationRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: ["s3:GetReplicationConfiguration", "s3:ListBucket"],
            Resource: primaryBucket.arn,
          },
          {
            Effect: "Allow",
            Action: [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl",
              "s3:GetObjectVersionTagging",
            ],
            Resource: `${primaryBucket.arn}/*`,
          },
          {
            Effect: "Allow",
            Action: ["s3:ReplicateObject", "s3:ReplicateDelete", "s3:ReplicateTags"],
            Resource: `${secondaryBucket.arn}/*`,
          },
          {
            Effect: "Allow",
            Action: ["kms:Decrypt", "kms:DescribeKey"],
            Resource: [
              `arn:aws:kms:${config.primaryProvider.region}:${callerIdentity.accountId}:key/*`,
            ],
          },
          {
            Effect: "Allow",
            Action: ["kms:Encrypt", "kms:GenerateDataKey"],
            Resource: [
              `arn:aws:kms:${config.secondaryProvider.region}:${callerIdentity.accountId}:key/*`,
            ],
          },
        ],
      }),
    });

    new S3BucketReplicationConfiguration(this, "replication-config", {
      provider: config.primaryProvider,
      bucket: primaryBucket.id,
      role: replicationRole.arn,
      rule: [
        {
          id: "replicate-all",
          status: "Enabled",
          priority: 1,
          deleteMarkerReplication: { status: "Enabled" },
          filter: {},
          destination: {
            bucket: secondaryBucket.arn,
            storageClass: "STANDARD_IA",
            encryptionConfiguration: {
              replicaKmsKeyId: `arn:aws:kms:${config.secondaryProvider.region}:${callerIdentity.accountId}:alias/financial-processor-secondary`,
            },
          },
        },
      ],
      dependsOn: [replicationRole],
    });
  }
}

// =========================
// MonitoringResources
// =========================
interface MonitoringResourcesConfig {
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryVpcId: string;
  secondaryVpcId: string;
  primarySubnetIds: string[];
  secondarySubnetIds: string[];
  lambdaRole: IamRole;
  tags: { [key: string]: string };
  appName: string;
}
class MonitoringResources extends Construct {
  public readonly primaryAlbDnsName: string;
  public readonly secondaryAlbDnsName: string;
  public readonly primaryHealthCheckId: string;
  public readonly secondaryHealthCheckId: string;

  constructor(scope: Construct, id: string, config: MonitoringResourcesConfig) {
    super(scope, id);

    new CloudwatchLogGroup(this, "central-logs", {
      provider: config.primaryProvider,
      name: `/aws/financial-processor/audit`,
      retentionInDays: 90,
      kmsKeyId: "alias/financial-processor-primary",
      tags: config.tags,
    });

    const primaryAlbSg = new DataAwsSecurityGroup(this, "primary-alb-sg", {
      provider: config.primaryProvider,
      filter: [
        { name: "group-name", values: ["financial-processor-primary-alb"] },
        { name: "vpc-id", values: [config.primaryVpcId] },
      ],
    });

    const primaryAlb = new Alb(this, "primary-alb", {
      provider: config.primaryProvider,
      name: "financial-processor-primary",
      loadBalancerType: "application",
      subnets: config.primarySubnetIds,
      securityGroups: [primaryAlbSg.id],
      enableDeletionProtection: true,
      enableHttp2: true,
      tags: config.tags,
    });

    const primaryTargetGroup = new AlbTargetGroup(this, "primary-tg", {
      provider: config.primaryProvider,
      name: "financial-processor-primary",
      port: 443,
      protocol: "HTTPS",
      vpcId: config.primaryVpcId,
      targetType: "instance",
      healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTPS",
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
      },
      tags: config.tags,
    });

    new AlbListener(this, "primary-listener", {
      provider: config.primaryProvider,
      loadBalancerArn: primaryAlb.arn,
      port: 443,
      protocol: "HTTPS",
      certificateArn:
        "arn:aws:acm:us-east-1:123456789012:certificate/placeholder", // Replace
      defaultAction: [{ type: "forward", targetGroupArn: primaryTargetGroup.arn }],
    });

    const secondaryAlbSg = new DataAwsSecurityGroup(this, "secondary-alb-sg", {
      provider: config.secondaryProvider,
      filter: [
        { name: "group-name", values: ["financial-processor-secondary-alb"] },
        { name: "vpc-id", values: [config.secondaryVpcId] },
      ],
    });

    const secondaryAlb = new Alb(this, "secondary-alb", {
      provider: config.secondaryProvider,
      name: "financial-processor-secondary",
      loadBalancerType: "application",
      subnets: config.secondarySubnetIds,
      securityGroups: [secondaryAlbSg.id],
      enableDeletionProtection: true,
      enableHttp2: true,
      tags: config.tags,
    });

    const secondaryTargetGroup = new AlbTargetGroup(this, "secondary-tg", {
      provider: config.secondaryProvider,
      name: "financial-processor-secondary",
      port: 443,
      protocol: "HTTPS",
      vpcId: config.secondaryVpcId,
      targetType: "instance",
      healthCheck: {
        enabled: true,
        path: "/health",
        protocol: "HTTPS",
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
      },
      tags: config.tags,
    });

    new AlbListener(this, "secondary-listener", {
      provider: config.secondaryProvider,
      loadBalancerArn: secondaryAlb.arn,
      port: 443,
      protocol: "HTTPS",
      certificateArn:
        "arn:aws:acm:us-west-2:123456789012:certificate/placeholder", // Replace
      defaultAction: [
        { type: "forward", targetGroupArn: secondaryTargetGroup.arn },
      ],
    });

    this.primaryAlbDnsName = primaryAlb.dnsName;
    this.secondaryAlbDnsName = secondaryAlb.dnsName;

    const primaryHealthCheck = new Route53HealthCheck(
      this,
      "primary-health-check",
      {
        fqdn: primaryAlb.dnsName,
        port: 443,
        type: "HTTPS",
        resourcePath: "/health",
        failureThreshold: 2,
        requestInterval: 30,
        measureLatency: true,
        tags: { ...config.tags, Name: "financial-processor-primary-health" },
      }
    );

    const secondaryHealthCheck = new Route53HealthCheck(
      this,
      "secondary-health-check",
      {
        fqdn: secondaryAlb.dnsName,
        port: 443,
        type: "HTTPS",
        resourcePath: "/health",
        failureThreshold: 2,
        requestInterval: 30,
        measureLatency: true,
        tags: { ...config.tags, Name: "financial-processor-secondary-health" },
      }
    );

    this.primaryHealthCheckId = primaryHealthCheck.id;
    this.secondaryHealthCheckId = secondaryHealthCheck.id;

    new CloudwatchMetricAlarm(this, "primary-health-alarm", {
      provider: config.primaryProvider,
      alarmName: "financial-processor-primary-unhealthy",
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 2,
      metricName: "HealthCheckStatus",
      namespace: "AWS/Route53",
      period: 60,
      statistic: "Minimum",
      threshold: 1,
      alarmDescription: "Primary region health check failing",
      dimensions: { HealthCheckId: primaryHealthCheck.id },
      tags: config.tags,
    });

    new CloudwatchMetricAlarm(this, "secondary-health-alarm", {
      provider: config.secondaryProvider,
      alarmName: "financial-processor-secondary-unhealthy",
      comparisonOperator: "LessThanThreshold",
      evaluationPeriods: 2,
      metricName: "HealthCheckStatus",
      namespace: "AWS/Route53",
      period: 60,
      statistic: "Minimum",
      threshold: 1,
      alarmDescription: "Secondary region health check failing",
      dimensions: { HealthCheckId: secondaryHealthCheck.id },
      tags: config.tags,
    });
  }
}

// =========================
// FailoverResources
// =========================
interface FailoverResourcesConfig {
  globalProvider: AwsProvider;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
  primaryAlbDnsName: string;
  secondaryAlbDnsName: string;
  primaryHealthCheckId: string;
  secondaryHealthCheckId: string;
  lambdaRole: IamRole;
  tags: { [key: string]: string };
  appName: string;
}
class FailoverResources extends Construct {
  public readonly primaryEndpoint: string;
  public readonly secondaryEndpoint: string;
  public readonly failoverDomain: string;

  constructor(scope: Construct, id: string, config: FailoverResourcesConfig) {
    super(scope, id);

    const hostedZone = new Route53Zone(this, "hosted-zone", {
      provider: config.globalProvider,
      name: "financial-processor.example.com", // Replace with your domain
      tags: config.tags,
    });

    this.failoverDomain = hostedZone.name;

    const primaryRecord = new Route53Record(this, "primary-record", {
      provider: config.globalProvider,
      zoneId: hostedZone.zoneId,
      name: "api",
      type: "A",
      setIdentifier: "primary",
      healthCheckId: config.primaryHealthCheckId,
      alias: {
        name: config.primaryAlbDnsName,
        zoneId: "Z35SXDOTRQ7X7K", // ALB zone id for us-east-1 (validate for your region)
        evaluateTargetHealth: false,
      },
      failoverRoutingPolicy: { type: "PRIMARY" },
    });

    const secondaryRecord = new Route53Record(this, "secondary-record", {
      provider: config.globalProvider,
      zoneId: hostedZone.zoneId,
      name: "api",
      type: "A",
      setIdentifier: "secondary",
      healthCheckId: config.secondaryHealthCheckId,
      alias: {
        name: config.secondaryAlbDnsName,
        zoneId: "Z1BKCTXD74EZPE", // ALB zone id for us-west-2 (validate for your region)
        evaluateTargetHealth: false,
      },
      failoverRoutingPolicy: { type: "SECONDARY" },
    });

    this.primaryEndpoint = `https://${primaryRecord.name}.${hostedZone.name}`;
    this.secondaryEndpoint = `https://${secondaryRecord.name}.${hostedZone.name}`;

    // ---- Inline Lambda (zip generated at synth time) ----
    const failoverCode = `
const AWS = require('aws-sdk');
const route53 = new AWS.Route53();
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  console.log('Failover event:', JSON.stringify(event));
  try {
    const alarm = event.detail || event.alarmData || {};
    const name = alarm.alarmName || JSON.stringify(alarm);
    const isPrimary = String(name).includes('primary');
    await cloudwatch.putMetricData({
      Namespace: 'FinancialProcessor',
      MetricData: [{
        MetricName: 'FailoverTriggered',
        Value: 1,
        Unit: 'Count',
        Dimensions: [{ Name: 'Region', Value: isPrimary ? 'primary' : 'secondary' }]
      }]
    }).promise();
    console.log('Failover metrics published');
    return { statusCode: 200, body: 'Failover processed' };
  } catch (error) {
    console.error('Failover error:', error);
    throw error;
  }
};`;

    // Write temp folder with index.js and package as asset
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "failover-lambda-"));
    fs.writeFileSync(path.join(tmpDir, "index.js"), failoverCode, "utf-8");

    const lambdaAsset = new TerraformAsset(this, "failover-lambda-asset", {
      path: tmpDir,
      type: "archive",
    });

    const failoverLambda = new LambdaFunction(this, "failover-lambda", {
      provider: config.primaryProvider,
      functionName: "financial-processor-failover",
      runtime: "nodejs18.x",
      handler: "index.handler",
      role: config.lambdaRole.arn,
      filename: lambdaAsset.path,
      sourceCodeHash: lambdaAsset.assetHash,
      timeout: 60,
      memorySize: 256,
      environment: {
        variables: {
          HOSTED_ZONE_ID: hostedZone.zoneId,
          PRIMARY_HEALTH_CHECK_ID: config.primaryHealthCheckId,
          SECONDARY_HEALTH_CHECK_ID: config.secondaryHealthCheckId,
        },
      },
      tags: config.tags,
    });

    const failoverRule = new CloudwatchEventRule(this, "failover-rule", {
      provider: config.primaryProvider,
      name: "financial-processor-health-check-failure",
      description: "Trigger failover on health check failure",
      eventPattern: JSON.stringify({
        source: ["aws.cloudwatch"],
        "detail-type": ["CloudWatch Alarm State Change"],
        detail: {
          state: { value: ["ALARM"] },
        },
      }),
      tags: config.tags,
    });

    new LambdaPermission(this, "failover-lambda-permission", {
      provider: config.primaryProvider,
      statementId: "AllowExecutionFromEventBridge",
      action: "lambda:InvokeFunction",
      functionName: failoverLambda.functionName,
      principal: "events.amazonaws.com",
      sourceArn: failoverRule.arn,
    });

    new CloudwatchEventTarget(this, "failover-target", {
      provider: config.primaryProvider,
      rule: failoverRule.name,
      targetId: "failover-target-1",
      arn: failoverLambda.arn,
    });
  }
}

// =========================
// Stack
// =========================
interface FinancialProcessorStackConfig {
  primaryRegion: string;
  secondaryRegion: string;
  environment: string;
  appName: string;
  costCenter: string;
}
class FinancialProcessorStack extends TerraformStack {
  constructor(scope: Construct, id: string, config: FinancialProcessorStackConfig) {
    super(scope, id);

    const primaryProvider = new AwsProvider(this, "aws-primary", {
      region: config.primaryRegion,
      alias: "primary",
    });

    const secondaryProvider = new AwsProvider(this, "aws-secondary", {
      region: config.secondaryRegion,
      alias: "secondary",
    });

    const globalProvider = new AwsProvider(this, "aws-global", {
      region: "us-east-1",
      alias: "global",
    });

    const commonTags = {
      Environment: config.environment,
      App: config.appName,
      ManagedBy: "CDKTF",
      CostCenter: config.costCenter,
    };

    const security = new SecurityResources(this, "security", {
      primaryProvider,
      secondaryProvider,
      tags: commonTags,
    });

    const network = new NetworkResources(this, "network", {
      primaryProvider,
      secondaryProvider,
      tags: commonTags,
      appName: config.appName,
    });

    new DataResources(this, "data", {
      primaryProvider,
      secondaryProvider,
      globalProvider,
      primaryKmsKeyId: security.primaryKmsKey.id,
      secondaryKmsKeyId: security.secondaryKmsKey.id,
      tags: commonTags,
      appName: config.appName,
    });

    const monitoring = new MonitoringResources(this, "monitoring", {
      primaryProvider,
      secondaryProvider,
      primaryVpcId: network.primaryVpc.id,
      secondaryVpcId: network.secondaryVpc.id,
      primarySubnetIds: network.primaryPrivateSubnetIds,
      secondarySubnetIds: network.secondaryPrivateSubnetIds,
      lambdaRole: security.lambdaExecutionRole,
      tags: commonTags,
      appName: config.appName,
    });

    const failover = new FailoverResources(this, "failover", {
      globalProvider,
      primaryProvider,
      secondaryProvider,
      primaryAlbDnsName: monitoring.primaryAlbDnsName,
      secondaryAlbDnsName: monitoring.secondaryAlbDnsName,
      primaryHealthCheckId: monitoring.primaryHealthCheckId,
      secondaryHealthCheckId: monitoring.secondaryHealthCheckId,
      lambdaRole: security.lambdaExecutionRole,
      tags: commonTags,
      appName: config.appName,
    });

    new TerraformOutput(this, "primary-endpoint", {
      value: failover.primaryEndpoint,
      description: "Primary region endpoint",
    });

    new TerraformOutput(this, "secondary-endpoint", {
      value: failover.secondaryEndpoint,
      description: "Secondary region endpoint",
    });

    new TerraformOutput(this, "failover-domain", {
      value: failover.failoverDomain,
      description: "Route53 failover domain",
    });
  }
}

// =========================
// App Entrypoint
// =========================
const app = new App();
new FinancialProcessorStack(app, "financial-processor-production", {
  primaryRegion: "us-east-1",
  secondaryRegion: "us-west-2",
  environment: "production",
  appName: "financial-processor",
  costCenter: process.env.COST_CENTER || "finance-dept",
});
app.synth();
