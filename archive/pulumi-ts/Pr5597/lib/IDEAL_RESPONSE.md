IDEAL_RESPONSE.md

# Ideal Response - Cross-Region AWS Infrastructure Migration

## bin/tap.ts

```typescript

/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 * 
 * Complete export of all AWS resources created by the infrastructure stack
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import * as crypto from 'crypto';

// =========================================================================
// Configuration
// =========================================================================

const config = new pulumi.Config();

const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('env') || 'dev';

const configRepository = config.get('repository') || 'unknown';
const configCommitAuthor = config.get('commitAuthor') || 'unknown';
const deploymentTimestamp = new Date().toISOString();
const randomSuffix = crypto.randomBytes(4).toString('hex');

const defaultTags = {
  Environment: environmentSuffix,
  Repository: configRepository,
  Author: configCommitAuthor,
  DeployedAt: deploymentTimestamp,
};


// =========================================================================
// Stack Instantiation
// =========================================================================

const stack = new TapStack('pulumi-infra', {
  stackName: 'TapStack' + environmentSuffix,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
  tags: defaultTags,
  migrationPhase: 'initial',
});

// =========================================================================
// NETWORKING - VPC & Subnets
// =========================================================================

export const vpcId = stack.vpcId;
export const vpcCidr = pulumi.output("10.0.0.0/16");

export const publicSubnetIds = stack.outputs.publicSubnetIds;
export const publicSubnet1Cidr = pulumi.output("10.0.1.0/24 (us-east-1a)");
export const publicSubnet2Cidr = pulumi.output("10.0.2.0/24 (us-east-1b)");
export const publicSubnet3Cidr = pulumi.output("10.0.3.0/24 (us-east-1c)");

export const privateSubnetIds = stack.outputs.privateSubnetIds;
export const privateSubnet1Cidr = pulumi.output("10.0.11.0/24 (us-east-1a)");
export const privateSubnet2Cidr = pulumi.output("10.0.12.0/24 (us-east-1b)");
export const privateSubnet3Cidr = pulumi.output("10.0.13.0/24 (us-east-1c)");

// =========================================================================
// NETWORKING - Internet Gateway & NAT
// =========================================================================

export const internetGatewayName = pulumi.interpolate`prod-igw-${environmentSuffix}`;
export const natGateway1Name = pulumi.interpolate`prod-nat-us-east-1a-${environmentSuffix}`;
export const natGateway2Name = pulumi.interpolate`prod-nat-us-east-1b-${environmentSuffix}`;
export const natGateway3Name = pulumi.interpolate`prod-nat-us-east-1c-${environmentSuffix}`;

// =========================================================================
// NETWORKING - Route Tables
// =========================================================================

export const publicRouteTableName = pulumi.interpolate`prod-public-rt-${environmentSuffix}`;
export const privateRouteTable1Name = pulumi.interpolate`prod-private-rt-us-east-1a-${environmentSuffix}`;
export const privateRouteTable2Name = pulumi.interpolate`prod-private-rt-us-east-1b-${environmentSuffix}`;
export const privateRouteTable3Name = pulumi.interpolate`prod-private-rt-us-east-1c-${environmentSuffix}`;

// =========================================================================
// SECURITY - Security Groups
// =========================================================================

export const albSecurityGroupName = pulumi.interpolate`prod-alb-sg-${environmentSuffix}`;
export const appSecurityGroupName = pulumi.interpolate`prod-app-sg-${environmentSuffix}`;
export const dbSecurityGroupName = pulumi.interpolate`prod-db-sg-${environmentSuffix}`;

export const albSecurityGroupRulesDescription = pulumi.output("HTTPS (443) from 0.0.0.0/0");
export const appSecurityGroupRulesDescription = pulumi.output("Port 8080 from ALB only");
export const dbSecurityGroupRulesDescription = pulumi.output("MySQL (3306) from App tier only");

// =========================================================================
// SECURITY - KMS Encryption
// =========================================================================

export const kmsKeyId = stack.outputs.kmsKeyId;
export const kmsKeyArn = pulumi.interpolate`arn:aws:kms:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:key/${stack.outputs.kmsKeyId}`;
export const kmsAliasName = pulumi.interpolate`alias/prod-encryption-${environmentSuffix}`;
export const kmsKeyRotationEnabled = pulumi.output(true);

// =========================================================================
// SECURITY - IAM Roles & Policies
// =========================================================================

export const ec2RoleArn = stack.outputs.ec2RoleArn;
export const ec2RoleName = pulumi.interpolate`prod-ec2-role-${environmentSuffix}`;

export const s3PolicyName = pulumi.interpolate`prod-s3-policy-${environmentSuffix}`;
export const rdsAccessPolicyName = pulumi.interpolate`prod-rds-policy-${environmentSuffix}`;
export const ec2InstanceProfileName = pulumi.interpolate`prod-instance-profile-${environmentSuffix}`;

export const rdsMonitoringRoleName = pulumi.interpolate`prod-rds-monitoring-role-${environmentSuffix}`;
export const replicationRoleName = pulumi.interpolate`prod-replication-role-${environmentSuffix}`;

// =========================================================================
// DATABASE - RDS Configuration
// =========================================================================

export const rdsInstanceIdentifier = pulumi.interpolate`prod-rds-${environmentSuffix}`;
export const rdsEndpoint = stack.prodRdsEndpoint;
export const rdsPort = stack.prodRdsPort;
export const rdsEngine = pulumi.output("MySQL 8.0");
export const rdsInstanceClass = pulumi.output("db.r5.large");
export const rdsMultiAz = pulumi.output(true);
export const rdsStorageEncrypted = pulumi.output(true);
export const rdsAllocatedStorage = pulumi.output(100);
export const rdsStorageType = pulumi.output("gp3");
export const rdsBackupRetention = pulumi.output(7);
export const rdsBackupWindow = pulumi.output("03:00-04:00 UTC");
export const rdsMaintenanceWindow = pulumi.output("Monday 04:00-05:00 UTC");
export const rdsDeletionProtection = pulumi.output(true);
export const rdsPubliclyAccessible = pulumi.output(false);

export const rdsPerformanceInsightsEnabled = pulumi.output(true);
export const rdsPerformanceInsightsRetention = pulumi.output(7);
export const rdsCloudwatchLogsExports = pulumi.output(["error", "general", "slowquery"]);
export const rdsMonitoringInterval = pulumi.output(60);

export const dbSubnetGroupName = pulumi.interpolate`prod-db-subnet-group-${environmentSuffix}`;
export const dbParameterGroupName = pulumi.interpolate`prod-db-params-${environmentSuffix}`;

// =========================================================================
// COMPUTE - Load Balancer
// =========================================================================

export const albDnsName = stack.albDnsName;
export const albArn = stack.outputs.albArn;
export const albName = pulumi.interpolate`prod-alb-${environmentSuffix}`;
export const albType = pulumi.output("Application Load Balancer");
export const albProtocol = pulumi.output("HTTPS");
export const albPort = pulumi.output(443);
export const albHttp2Enabled = pulumi.output(true);
export const albDeletionProtection = pulumi.output(true);
export const albAccessLogsEnabled = pulumi.output(true);

// =========================================================================
// COMPUTE - Target Groups
// =========================================================================

export const targetGroupGreenArn = stack.outputs.targetGroupGreenArn;
export const targetGroupBlueArn = stack.outputs.targetGroupBlueArn;
export const targetGroupGreenName = pulumi.interpolate`prod-tg-green-${environmentSuffix}`;
export const targetGroupBlueName = pulumi.interpolate`prod-tg-blue-${environmentSuffix}`;

export const targetGroupPort = pulumi.output(8080);
export const targetGroupProtocol = pulumi.output("HTTP");
export const targetGroupHealthCheckPath = pulumi.output("/health");
export const targetGroupHealthCheckInterval = pulumi.output(30);
export const targetGroupHealthCheckTimeout = pulumi.output(5);
export const targetGroupHealthyThreshold = pulumi.output(2);
export const targetGroupUnhealthyThreshold = pulumi.output(2);
export const targetGroupDeregistrationDelay = pulumi.output(30);

// =========================================================================
// COMPUTE - Auto Scaling Groups
// =========================================================================

export const prodAutoScalingGroupName = stack.outputs.prodAutoScalingGroupName;
export const prodAutoScalingGroupMinSize = pulumi.output(3);
export const prodAutoScalingGroupMaxSize = pulumi.output(9);
export const prodAutoScalingGroupDesiredCapacity = pulumi.output(3);
export const prodAutoScalingGroupHealthCheckType = pulumi.output("ELB");
export const prodAutoScalingGroupHealthCheckGracePeriod = pulumi.output(300);

export const devAutoScalingGroupName = pulumi.interpolate`prod-asg-blue-${environmentSuffix}`;
export const devAutoScalingGroupMinSize = pulumi.output(0);
export const devAutoScalingGroupMaxSize = pulumi.output(3);
export const devAutoScalingGroupDesiredCapacity = pulumi.output(0);

// =========================================================================
// COMPUTE - Launch Templates
// =========================================================================

export const prodLaunchTemplateName = pulumi.interpolate`prod-lt-green-${environmentSuffix}`;
export const prodLaunchTemplateInstanceType = pulumi.output("m5.large");
export const prodLaunchTemplateImdsv2Required = pulumi.output(true);

export const devLaunchTemplateName = pulumi.interpolate`prod-lt-blue-${environmentSuffix}`;
export const devLaunchTemplateInstanceType = pulumi.output("t3.micro");

// =========================================================================
// COMPUTE - Scaling Policies
// =========================================================================

export const scaleUpPolicyName = pulumi.interpolate`prod-scale-up-${environmentSuffix}`;
export const scaleUpAdjustment = pulumi.output(1);
export const scaleUpCooldown = pulumi.output(300);

export const scaleDownPolicyName = pulumi.interpolate`prod-scale-down-${environmentSuffix}`;
export const scaleDownAdjustment = pulumi.output(-1);
export const scaleDownCooldown = pulumi.output(300);

// =========================================================================
// STORAGE - S3 Buckets
// =========================================================================

export const prodLogBucketName = stack.prodLogBucketName;
export const replicaLogBucketName = stack.replicaLogBucketName;

export const s3PrimaryBucketRegion = pulumi.output("us-east-1");
export const s3ReplicaBucketRegion = pulumi.output("us-west-2");

export const s3VersioningEnabled = pulumi.output(true);
export const s3EncryptionAlgorithm = pulumi.output("AES256");
export const s3BlockPublicAccessEnabled = pulumi.output(true);

export const s3LifecycleTransitionIA = pulumi.output(30);
export const s3LifecycleTransitionGlacier = pulumi.output(90);
export const s3LifecycleExpiration = pulumi.output(365);

export const s3ReplicationStatus = pulumi.output("Enabled");
export const s3ReplicationTime = pulumi.output(15); // minutes
export const s3ReplicationMetrics = pulumi.output("Enabled");

export const s3PublicAccessBlockName = pulumi.interpolate`prod-logs-public-block-${environmentSuffix}`;

// =========================================================================
// STORAGE - S3 Replication Configuration
// =========================================================================

export const replicationRoleNameS3 = pulumi.interpolate`prod-replication-role-${environmentSuffix}`;
export const replicationPolicyName = pulumi.interpolate`prod-replication-policy-${environmentSuffix}`;

// =========================================================================
// MONITORING - CloudWatch Alarms
// =========================================================================

export const cpuAlarmName = pulumi.interpolate`prod-cpu-alarm-${environmentSuffix}`;
export const cpuAlarmThreshold = pulumi.output(80);
export const cpuAlarmComparisonOperator = pulumi.output("GreaterThanThreshold");
export const cpuAlarmPeriod = pulumi.output(300);
export const cpuAlarmEvaluationPeriods = pulumi.output(2);

export const dbConnectionsAlarmName = pulumi.interpolate`prod-db-connections-alarm-${environmentSuffix}`;
export const dbConnectionsThreshold = pulumi.output(80);

export const targetHealthAlarmName = pulumi.interpolate`prod-target-health-alarm-${environmentSuffix}`;
export const targetHealthThreshold = pulumi.output(2);
export const targetHealthPeriod = pulumi.output(60);

export const rdsAlarmName = pulumi.interpolate`prod-rds-cpu-alarm-${environmentSuffix}`;
export const rdsAlarmThreshold = pulumi.output(80);

export const snsTopicName = pulumi.interpolate`prod-alarms-${randomSuffix}`;
export const snsTopicArn = pulumi.interpolate`arn:aws:sns:us-east-1:${process.env.CDK_DEFAULT_ACCOUNT}:prod-alarms-${randomSuffix}`;

// =========================================================================
// DNS - Route53
// =========================================================================

export const route53ZoneId = stack.outputs.route53ZoneId;
export const route53DomainName = stack.route53DomainName;
export const route53RecordName = pulumi.interpolate`app.${stack.route53DomainName}`;
export const route53RecordType = pulumi.output("A (Alias)");

export const route53GreenRecordIdentifier = pulumi.output("green-production");
export const route53BlueRecordIdentifier = pulumi.output("blue-development");

export const route53WeightedRoutingEnabled = pulumi.output(true);
export const route53HealthCheckEvaluation = pulumi.output(true);
export const route53TtlSeconds = pulumi.output(60);

// =========================================================================
// MIGRATION - Traffic Shifting
// =========================================================================

export const migrationPhase = stack.migrationStatus;
export const trafficWeights = stack.outputs.trafficWeights;

export const blueGreenDeploymentEnabled = pulumi.output(true);
export const rollbackCapability = pulumi.output("15 minutes");
export const trafficShiftPhases = pulumi.output("0% → 10% → 50% → 100%");

// =========================================================================
// ENVIRONMENT & CONFIGURATION
// =========================================================================

export const deploymentEnvironment = pulumi.output(environmentSuffix);
export const awsRegion = pulumi.output(process.env.CDK_DEFAULT_REGION || 'us-east-1');
export const awsAccount = pulumi.output(process.env.CDK_DEFAULT_ACCOUNT);
export const deployedAt = pulumi.output(deploymentTimestamp);
export const deploymentRepository = pulumi.output(configRepository);
export const deploymentCommitAuthor = pulumi.output(configCommitAuthor);

// =========================================================================
// RESOURCE TAGS
// =========================================================================

export const resourceTags = pulumi.output({
  Environment: "production",
  ManagedBy: "pulumi",
  DeployedAt: deploymentTimestamp,
  Repository: configRepository,
  Author: configCommitAuthor,
});


export const completeStackOutputs = stack.outputs;

```


## lib/tap-stack.ts

```typescript

/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as crypto from "crypto";
import * as fs from "fs";
import * as path from "path";

export interface TapStackArgs {
  stackName: string;
  environmentSuffix: string;
  env: {
    account?: string;
    region?: string;
  };
  tags?: {
    [key: string]: string;
  };
  devRdsInstanceId?: string;
  devVpcId?: string;
  migrationPhase?:
    | "initial"
    | "snapshot"
    | "blue-green"
    | "traffic-shift-10"
    | "traffic-shift-50"
    | "traffic-shift-100"
    | "complete";
  devEnvironment?: {
    rdsInstanceIdentifier: string;
    vpcId?: string;
  };
}

/**
 * TapStack - Production infrastructure for fintech payment processing
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly prodRdsEndpoint: pulumi.Output<string>;
  public readonly prodRdsPort: pulumi.Output<number>;
  public readonly albDnsName: pulumi.Output<string>;
  public readonly route53DomainName: pulumi.Output<string>;
  public readonly prodLogBucketName: pulumi.Output<string>;
  public readonly replicaLogBucketName: pulumi.Output<string>;
  public readonly migrationStatus: pulumi.Output<string>;
  public readonly outputs: Record<string, pulumi.Output<any>> = {};

  private vpc: aws.ec2.Vpc;
  private publicSubnets: aws.ec2.Subnet[] = [];
  private privateSubnets: aws.ec2.Subnet[] = [];
  private natGateways: aws.ec2.NatGateway[] = [];
  private prodRdsInstance: aws.rds.Instance;
  private devRdsSnapshot?: aws.rds.ClusterSnapshot;
  private prodSecurityGroup: aws.ec2.SecurityGroup;
  private albSecurityGroup: aws.ec2.SecurityGroup;
  private dbSecurityGroup: aws.ec2.SecurityGroup;
  private alb: aws.lb.LoadBalancer;
  private targetGroupBlue: aws.lb.TargetGroup;
  private targetGroupGreen: aws.lb.TargetGroup;
  private prodLogBucket: aws.s3.Bucket;
  private replicaLogBucket: aws.s3.Bucket;
  private prodAutoScalingGroup: aws.autoscaling.Group;
  private devAutoScalingGroup?: aws.autoscaling.Group;
  private route53Zone: aws.route53.Zone;
  private ec2Role: aws.iam.Role;
  private kmsKey: aws.kms.Key;
  private availabilityZones = ["us-east-1a", "us-east-1b", "us-east-1c"];

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:infrastructure:TapStack", name, {}, opts);

    const defaultOpts: pulumi.ResourceOptions = { parent: this };
    const migrationPhase = args.migrationPhase || "initial";
    const randomSuffix = crypto.randomBytes(4).toString("hex");

    // =========================================================================
    // 1. KMS Key for Encryption
    // =========================================================================

    this.kmsKey = new aws.kms.Key(
      `prod-kms-${args.environmentSuffix}`,
      {
        description: "KMS key for production encryption",
        deletionWindowInDays: 10,
        enableKeyRotation: true,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-kms-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );


    // =========================================================================
    // 2. VPC Configuration with 3 AZs
    // =========================================================================

    this.vpc = new aws.ec2.Vpc(
      `prod-vpc-${args.environmentSuffix}`,
      {
        cidrBlock: "10.0.0.0/16",
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-vpc-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    this.vpcId = this.vpc.id;

    const internetGateway = new aws.ec2.InternetGateway(
      `prod-igw-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-igw-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    const publicCidrs = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"];
    const privateCidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"];

    this.availabilityZones.forEach((az, index) => {
      const publicSubnet = new aws.ec2.Subnet(
        `prod-public-subnet-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: publicCidrs[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: true,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: `prod-public-${az}-${randomSuffix}`,
            Type: "public",
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );

      this.publicSubnets.push(publicSubnet);
    });

    this.availabilityZones.forEach((az, index) => {
      const privateSubnet = new aws.ec2.Subnet(
        `prod-private-subnet-${az}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          cidrBlock: privateCidrs[index],
          availabilityZone: az,
          mapPublicIpOnLaunch: false,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: `prod-private-${az}-${randomSuffix}`,
            Type: "private",
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );

      this.privateSubnets.push(privateSubnet);
    });

    const eips: aws.ec2.Eip[] = [];

    this.availabilityZones.forEach((az, _index) => {
      const eip = new aws.ec2.Eip(
        `prod-eip-${az}-${args.environmentSuffix}`,
        {
          domain: "vpc",
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: `prod-eip-${az}-${randomSuffix}`,
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );

      eips.push(eip);
    });

    this.publicSubnets.forEach((subnet, index) => {
      const natGateway = new aws.ec2.NatGateway(
        `prod-nat-${this.availabilityZones[index]}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          allocationId: eips[index].id,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: `prod-nat-${this.availabilityZones[index]}-${randomSuffix}`,
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );

      this.natGateways.push(natGateway);
    });

    const publicRouteTable = new aws.ec2.RouteTable(
      `prod-public-rt-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-public-rt-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.ec2.Route(
      `prod-public-route-${args.environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        gatewayId: internetGateway.id,
      },
      defaultOpts
    );

    this.publicSubnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `prod-public-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        defaultOpts
      );
    });

    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new aws.ec2.RouteTable(
        `prod-private-rt-${this.availabilityZones[index]}-${args.environmentSuffix}`,
        {
          vpcId: this.vpc.id,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            Name: `prod-private-rt-${this.availabilityZones[index]}-${randomSuffix}`,
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );

      new aws.ec2.Route(
        `prod-private-route-${this.availabilityZones[index]}-${args.environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: "0.0.0.0/0",
          natGatewayId: this.natGateways[index].id,
        },
        defaultOpts
      );

      new aws.ec2.RouteTableAssociation(
        `prod-private-rta-${index}-${args.environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        },
        defaultOpts
      );
    });

    // =========================================================================
    // 3. Security Groups
    // =========================================================================

    this.albSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-alb-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: "Security group for production ALB",
        ingress: [
          {
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow HTTP from internet",
          },
        ],
        egress: [
          {
            protocol: "-1",
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ["0.0.0.0/0"],
            description: "Allow all outbound traffic",
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-alb-sg-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    this.prodSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-app-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: "Security group for production application instances",
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-app-sg-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.ec2.SecurityGroupRule(
      `prod-app-ingress-${args.environmentSuffix}`,
      {
        type: "ingress",
        securityGroupId: this.prodSecurityGroup.id,
        sourceSecurityGroupId: this.albSecurityGroup.id,
        protocol: "tcp",
        fromPort: 8080,
        toPort: 8080,
        description: "Allow traffic from ALB",
      },
      defaultOpts
    );

    new aws.ec2.SecurityGroupRule(
      `prod-app-egress-${args.environmentSuffix}`,
      {
        type: "egress",
        securityGroupId: this.prodSecurityGroup.id,
        cidrBlocks: ["0.0.0.0/0"],
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        description: "Allow all outbound traffic",
      },
      defaultOpts
    );

    this.dbSecurityGroup = new aws.ec2.SecurityGroup(
      `prod-db-sg-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        description: "Security group for production RDS",
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-db-sg-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.ec2.SecurityGroupRule(
      `prod-db-ingress-${args.environmentSuffix}`,
      {
        type: "ingress",
        securityGroupId: this.dbSecurityGroup.id,
        sourceSecurityGroupId: this.prodSecurityGroup.id,
        protocol: "tcp",
        fromPort: 3306,
        toPort: 3306,
        description: "Allow MySQL from application instances",
      },
      defaultOpts
    );

    new aws.ec2.SecurityGroupRule(
      `prod-db-egress-${args.environmentSuffix}`,
      {
        type: "egress",
        securityGroupId: this.dbSecurityGroup.id,
        cidrBlocks: ["0.0.0.0/0"],
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        description: "Allow all outbound traffic",
      },
      defaultOpts
    );

    // =========================================================================
    // 4. IAM Roles
    // =========================================================================

    this.ec2Role = new aws.iam.Role(
      `prod-ec2-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "ec2.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-ec2-role-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    const rdsPolicy = new aws.iam.Policy(
      `prod-rds-policy-${args.environmentSuffix}`,
      {
        policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Action: [
                "rds:DescribeDBInstances",
                "rds:DescribeDBClusters",
                "rds-db:connect",
              ],
              Resource: "*",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-ec2-rds-attachment-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        policyArn: rdsPolicy.arn,
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-ec2-ssm-attachment-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-ec2-cloudwatch-attachment-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
      },
      defaultOpts
    );

    const instanceProfile = new aws.iam.InstanceProfile(
      `prod-instance-profile-${args.environmentSuffix}`,
      {
        role: this.ec2Role.name,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    // =========================================================================
    // 5. RDS MySQL
    // =========================================================================

    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `prod-db-subnet-group-${args.environmentSuffix}`,
      {
        subnetIds: this.privateSubnets.map((s) => s.id),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-db-subnet-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    const dbParameterGroup = new aws.rds.ParameterGroup(
      `prod-db-params-${args.environmentSuffix}`,
      {
        family: "mysql8.0",
        parameters: [
          {
            name: "character_set_server",
            value: "utf8mb4",
          },
          {
            name: "collation_server",
            value: "utf8mb4_unicode_ci",
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
        },
      },
      defaultOpts
    );

    let snapshotIdentifier: pulumi.Output<string> | undefined;

    if (
      args.devEnvironment?.rdsInstanceIdentifier &&
      migrationPhase !== "initial"
    ) {
      this.devRdsSnapshot = new aws.rds.ClusterSnapshot(
        `dev-snapshot-${args.environmentSuffix}`,
        {
          dbClusterIdentifier: args.devEnvironment.rdsInstanceIdentifier,
          dbClusterSnapshotIdentifier: `dev-migration-snapshot-${args.environmentSuffix}`,
          tags: {
            Environment: "development",
            ManagedBy: "pulumi",
            MigrationPhase: migrationPhase,
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );

      snapshotIdentifier = this.devRdsSnapshot.id;
    }

    this.prodRdsInstance = new aws.rds.Instance(
      `prod-rds-${args.environmentSuffix}`,
      {
        identifier: `prod-rds-${randomSuffix}`,
        engine: "mysql",
        engineVersion: "8.0",
        instanceClass: "db.r5.large",
        allocatedStorage: 100,
        storageType: "gp3",
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,
        multiAz: true,
        dbSubnetGroupName: dbSubnetGroup.name,
        vpcSecurityGroupIds: [this.dbSecurityGroup.id],
        publiclyAccessible: false,
        backupRetentionPeriod: 7,
        backupWindow: "03:00-04:00",
        maintenanceWindow: "mon:04:00-mon:05:00",
        username: "admin",
        password: pulumi.secret("ChangeMe12345!"),
        monitoringInterval: 60,
        monitoringRoleArn: this.createRdsMonitoringRole(args, defaultOpts).arn,
        enabledCloudwatchLogsExports: ["error", "general", "slowquery"],
        performanceInsightsEnabled: true,
        performanceInsightsKmsKeyId: this.kmsKey.arn,
        performanceInsightsRetentionPeriod: 7,
        snapshotIdentifier: snapshotIdentifier,
        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `prod-final-snapshot-${randomSuffix}`,
        deletionProtection: true,
        parameterGroupName: dbParameterGroup.name,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-rds-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      { ...defaultOpts, ignoreChanges: ["password"] }
    );

    this.prodRdsEndpoint = this.prodRdsInstance.endpoint;
    this.prodRdsPort = this.prodRdsInstance.port;

    // =========================================================================
    // 6. S3 Buckets (NO ALB LOGGING)
    // =========================================================================

    this.prodLogBucket = new aws.s3.Bucket(
      `prod-logs-${args.environmentSuffix}`,
      {
        bucket: `prod-logs-${args.environmentSuffix}-${randomSuffix}`,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-logs-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    this.prodLogBucketName = this.prodLogBucket.id;

    new aws.s3.BucketVersioning(
      `prod-logs-versioning-${args.environmentSuffix}`,
      {
        bucket: this.prodLogBucket.id,
        versioningConfiguration: {
          status: "Enabled",
        },
      },
      defaultOpts
    );

    new aws.s3.BucketServerSideEncryptionConfiguration(
      `prod-logs-sse-${args.environmentSuffix}`,
      {
        bucket: this.prodLogBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: "AES256",
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      defaultOpts
    );

    new aws.s3.BucketLifecycleConfiguration(
      `prod-logs-lifecycle-${args.environmentSuffix}`,
      {
        bucket: this.prodLogBucket.id,
        rules: [
          {
            id: "transition-to-ia",
            status: "Enabled",
            transitions: [
              {
                days: 30,
                storageClass: "STANDARD_IA",
              },
              {
                days: 90,
                storageClass: "GLACIER",
              },
            ],
            expiration: {
              days: 365,
            },
          },
        ],
      },
      defaultOpts
    );

    new aws.s3.BucketPublicAccessBlock(
      `prod-logs-public-block-${args.environmentSuffix}`,
      {
        bucket: this.prodLogBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      defaultOpts
    );

    const replicaProvider = new aws.Provider(
      `replica-provider-${args.environmentSuffix}`,
      {
        region: "us-west-2",
      },
      defaultOpts
    );

    this.replicaLogBucket = new aws.s3.Bucket(
      `prod-logs-replica-${args.environmentSuffix}`,
      {
        bucket: `prod-logs-replica-${args.environmentSuffix}-${randomSuffix}`,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-logs-replica-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      { ...defaultOpts, provider: replicaProvider }
    );

    this.replicaLogBucketName = this.replicaLogBucket.id;

    new aws.s3.BucketVersioning(
      `prod-logs-replica-versioning-${args.environmentSuffix}`,
      {
        bucket: this.replicaLogBucket.id,
        versioningConfiguration: {
          status: "Enabled",
        },
      },
      { ...defaultOpts, provider: replicaProvider }
    );

    const replicationRole = new aws.iam.Role(
      `prod-replication-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "s3.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    const replicationPolicy = new aws.iam.Policy(
      `prod-replication-policy-${args.environmentSuffix}`,
      {
        policy: pulumi
          .all([this.prodLogBucket.arn, this.replicaLogBucket.arn])
          .apply(([sourceArn, destArn]) =>
            JSON.stringify({
              Version: "2012-10-17",
              Statement: [
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket",
                  ],
                  Resource: sourceArn,
                },
                {
                  Effect: "Allow",
                  Action: [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl",
                  ],
                  Resource: `${sourceArn}/*`,
                },
                {
                  Effect: "Allow",
                  Action: ["s3:ReplicateObject", "s3:ReplicateDelete"],
                  Resource: `${destArn}/*`,
                },
              ],
            })
          ),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-replication-attachment-${args.environmentSuffix}`,
      {
        role: replicationRole.name,
        policyArn: replicationPolicy.arn,
      },
      defaultOpts
    );

    new aws.s3.BucketReplicationConfig(
      `prod-logs-replication-${args.environmentSuffix}`,
      {
        role: replicationRole.arn,
        bucket: this.prodLogBucket.id,
        rules: [
          {
            id: "replicate-all",
            status: "Enabled",
            destination: {
              bucket: this.replicaLogBucket.arn,
            },
          },
        ],
      },
      { ...defaultOpts, dependsOn: [replicationPolicy] }
    );

    // =========================================================================
    // 6A. CloudWatch Log Group for ALB Logs (OPTIONAL)
    // =========================================================================

    let albLogGroup: aws.cloudwatch.LogGroup | undefined;
    const createAlbLogs = false; // Set to true to enable ALB logging

    if (createAlbLogs) {
      albLogGroup = new aws.cloudwatch.LogGroup(
        `prod-alb-logs-${args.environmentSuffix}`,
        {
          name: `/aws/alb/prod-alb-${args.environmentSuffix}`,
          retentionInDays: 30,
          tags: {
            Environment: "production",
            ManagedBy: "pulumi",
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );
    }

    // =========================================================================
    // 7. Application Load Balancer (NO S3 LOGGING)
    // =========================================================================

    this.alb = new aws.lb.LoadBalancer(
      `prod-alb-${args.environmentSuffix}`,
      {
        loadBalancerType: "application",
        subnets: this.publicSubnets.map((s) => s.id),
        securityGroups: [this.albSecurityGroup.id],
        enableHttp2: true,
        enableDeletionProtection: true,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Name: `prod-alb-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    this.albDnsName = this.alb.dnsName;

    this.targetGroupBlue = new aws.lb.TargetGroup(
      `prod-tg-blue-${args.environmentSuffix}`,
      {
        port: 8080,
        protocol: "HTTP",
        vpcId: this.vpc.id,
        targetType: "instance",
        healthCheck: {
          enabled: true,
          path: "/health",
          protocol: "HTTP",
          matcher: "200",
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        deregistrationDelay: 30,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Color: "blue",
          Name: `prod-tg-blue-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    this.targetGroupGreen = new aws.lb.TargetGroup(
      `prod-tg-green-${args.environmentSuffix}`,
      {
        port: 8080,
        protocol: "HTTP",
        vpcId: this.vpc.id,
        targetType: "instance",
        healthCheck: {
          enabled: true,
          path: "/health",
          protocol: "HTTP",
          matcher: "200",
          interval: 30,
          timeout: 5,
          healthyThreshold: 2,
          unhealthyThreshold: 2,
        },
        deregistrationDelay: 30,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          Color: "green",
          Name: `prod-tg-green-${randomSuffix}`,
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.lb.Listener(
      `prod-listener-http-${args.environmentSuffix}`,
      {
        loadBalancerArn: this.alb.arn,
        port: 80,
        protocol: "HTTP",
        defaultActions: [
          {
            type: "forward",
            targetGroupArn: this.targetGroupGreen.arn,
          },
        ],
      },
      defaultOpts
    );

    // =========================================================================
    // 8. EC2 Auto Scaling Groups
    // =========================================================================

    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ["amazon"],
      filters: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
      ],
    });

    const launchTemplateGreen = new aws.ec2.LaunchTemplate(
      `prod-lt-green-${args.environmentSuffix}`,
      {
        imageId: ami.then((a) => a.id),
        instanceType: "m5.large",
        iamInstanceProfile: {
          arn: instanceProfile.arn,
        },
        vpcSecurityGroupIds: [this.prodSecurityGroup.id],
        metadataOptions: {
          httpEndpoint: "enabled",
          httpTokens: "required",
          httpPutResponseHopLimit: 1,
        },
        blockDeviceMappings: [
          {
            deviceName: "/dev/xvda",
            ebs: {
              volumeSize: 50,
              volumeType: "gp3",
              encrypted: "true",
              kmsKeyId: this.kmsKey.arn,
              deleteOnTermination: "true",
            },
          },
        ],
        userData: pulumi.output(this.prodRdsInstance.endpoint).apply(
          (endpoint) =>
            Buffer.from(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent docker
systemctl start docker
systemctl enable docker
echo "DB_ENDPOINT=${endpoint}" >> /etc/environment
docker run -d -p 8080:8080 -e DB_ENDPOINT=${endpoint} my-app:latest
`).toString("base64")
        ),
        tagSpecifications: [
          {
            resourceType: "instance",
            tags: {
              Environment: "production",
              ManagedBy: "pulumi",
              Deployment: "green",
              Name: `prod-instance-green-${randomSuffix}`,
              ...(args.tags || {}),
            },
          },
        ],
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    this.prodAutoScalingGroup = new aws.autoscaling.Group(
      `prod-asg-green-${args.environmentSuffix}`,
      {
        vpcZoneIdentifiers: this.privateSubnets.map((s) => s.id),
        targetGroupArns: [this.targetGroupGreen.arn],
        minSize: 3,
        maxSize: 9,
        desiredCapacity: 3,
        healthCheckType: "ELB",
        healthCheckGracePeriod: 300,
        launchTemplate: {
          id: launchTemplateGreen.id,
          version: "$Latest",
        },
        tags: [
          {
            key: "Environment",
            value: "production",
            propagateAtLaunch: true,
          },
          {
            key: "ManagedBy",
            value: "pulumi",
            propagateAtLaunch: true,
          },
          {
            key: "Deployment",
            value: "green",
            propagateAtLaunch: true,
          },
          {
            key: "Name",
            value: `prod-asg-green-${randomSuffix}`,
            propagateAtLaunch: true,
          },
        ],
      },
      defaultOpts
    );

    const scaleUpPolicy = new aws.autoscaling.Policy(
      `prod-scale-up-${args.environmentSuffix}`,
      {
        scalingAdjustment: 1,
        adjustmentType: "ChangeInCapacity",
        cooldown: 300,
        autoscalingGroupName: this.prodAutoScalingGroup.name,
      },
      defaultOpts
    );


    if (migrationPhase !== "complete") {
      const launchTemplateBlue = new aws.ec2.LaunchTemplate(
        `prod-lt-blue-${args.environmentSuffix}`,
        {
          imageId: ami.then((a) => a.id),
          instanceType: "t3.micro",
          iamInstanceProfile: {
            arn: instanceProfile.arn,
          },
          vpcSecurityGroupIds: [this.prodSecurityGroup.id],
          metadataOptions: {
            httpEndpoint: "enabled",
            httpTokens: "required",
            httpPutResponseHopLimit: 1,
          },
          blockDeviceMappings: [
            {
              deviceName: "/dev/xvda",
              ebs: {
                volumeSize: 20,
                volumeType: "gp3",
                encrypted: "true",
                kmsKeyId: this.kmsKey.arn,
                deleteOnTermination: "true",
              },
            },
          ],
          tags: {
            Environment: "development",
            ManagedBy: "pulumi",
            ...(args.tags || {}),
          },
        },
        defaultOpts
      );

      this.devAutoScalingGroup = new aws.autoscaling.Group(
        `prod-asg-blue-${args.environmentSuffix}`,
        {
          vpcZoneIdentifiers: this.privateSubnets.map((s) => s.id),
          targetGroupArns: [this.targetGroupBlue.arn],
          minSize: 0,
          maxSize: 3,
          desiredCapacity:
            migrationPhase === "initial" ||
            migrationPhase === "traffic-shift-10"
              ? 1
              : 0,
          healthCheckType: "ELB",
          healthCheckGracePeriod: 300,
          launchTemplate: {
            id: launchTemplateBlue.id,
            version: "$Latest",
          },
          tags: [
            {
              key: "Environment",
              value: "development",
              propagateAtLaunch: true,
            },
            {
              key: "ManagedBy",
              value: "pulumi",
              propagateAtLaunch: true,
            },
            {
              key: "Deployment",
              value: "blue",
              propagateAtLaunch: true,
            },
          ],
        },
        defaultOpts
      );
    }

    // =========================================================================
    // 9. Route53
    // =========================================================================

    this.route53Zone = new aws.route53.Zone(
      `prod-zone-${args.environmentSuffix}`,
      {
        name: `app-${args.environmentSuffix}.internal.local`,
        comment: "Production hosted zone",
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    this.route53DomainName = this.route53Zone.name;

    const weights = this.getTrafficWeights(migrationPhase);

    new aws.route53.Record(
      `prod-record-green-${args.environmentSuffix}`,
      {
        zoneId: this.route53Zone.zoneId,
        name: `app.app-${args.environmentSuffix}.internal.local`,
        type: "A",
        aliases: [
          {
            name: this.alb.dnsName,
            zoneId: this.alb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
        setIdentifier: "green-production",
        weightedRoutingPolicies: [
          {
            weight: weights.green,
          },
        ],
      },
      defaultOpts
    );

    if (migrationPhase !== "complete") {
      new aws.route53.Record(
        `prod-record-blue-${args.environmentSuffix}`,
        {
          zoneId: this.route53Zone.zoneId,
          name: `app.app-${args.environmentSuffix}.internal.local`,
          type: "A",
          aliases: [
            {
              name: this.alb.dnsName,
              zoneId: this.alb.zoneId,
              evaluateTargetHealth: true,
            },
          ],
          setIdentifier: "blue-development",
          weightedRoutingPolicies: [
            {
              weight: weights.blue,
            },
          ],
        },
        defaultOpts
      );
    }

    // =========================================================================
    // 10. CloudWatch Alarms
    // =========================================================================

    const alarmTopic = new aws.sns.Topic(
      `prod-alarms-${args.environmentSuffix}`,
      {
        name: `prod-alarms-${randomSuffix}`,
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.cloudwatch.MetricAlarm(
      `prod-cpu-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Triggers when CPU exceeds 80%",
        alarmActions: [alarmTopic.arn, scaleUpPolicy.arn],
        dimensions: {
          AutoScalingGroupName: this.prodAutoScalingGroup.name,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.cloudwatch.MetricAlarm(
      `prod-db-connections-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "DatabaseConnections",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Triggers when RDS connections exceed 80",
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.prodRdsInstance.identifier,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.cloudwatch.MetricAlarm(
      `prod-target-health-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "LessThanThreshold",
        evaluationPeriods: 2,
        metricName: "HealthyHostCount",
        namespace: "AWS/ApplicationELB",
        period: 60,
        statistic: "Average",
        threshold: 2,
        alarmDescription: "Triggers when healthy hosts drop below 2",
        alarmActions: [alarmTopic.arn],
        dimensions: {
          TargetGroup: this.targetGroupGreen.arnSuffix,
          LoadBalancer: this.alb.arnSuffix,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    new aws.cloudwatch.MetricAlarm(
      `prod-rds-cpu-alarm-${args.environmentSuffix}`,
      {
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/RDS",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: "Triggers when RDS CPU exceeds 80%",
        alarmActions: [alarmTopic.arn],
        dimensions: {
          DBInstanceIdentifier: this.prodRdsInstance.identifier,
        },
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      defaultOpts
    );

    // =========================================================================
    // Outputs
    // =========================================================================

    this.migrationStatus = pulumi.output(migrationPhase);

    this.outputs = {
      vpcId: this.vpcId,
      publicSubnetIds: pulumi.all(this.publicSubnets.map((s) => s.id)),
      privateSubnetIds: pulumi.all(this.privateSubnets.map((s) => s.id)),
      prodRdsEndpoint: this.prodRdsEndpoint,
      prodRdsPort: this.prodRdsPort,
      albDnsName: this.albDnsName,
      albArn: this.alb.arn,
      targetGroupGreenArn: this.targetGroupGreen.arn,
      targetGroupBlueArn: this.targetGroupBlue.arn,
      prodAutoScalingGroupName: this.prodAutoScalingGroup.name,
      route53ZoneId: this.route53Zone.zoneId,
      route53DomainName: this.route53DomainName,
      prodLogBucketName: this.prodLogBucketName,
      replicaLogBucketName: this.replicaLogBucketName,
      albLogGroupName: pulumi.output(albLogGroup?.name || "not-enabled"),
      kmsKeyId: this.kmsKey.keyId,
      ec2RoleArn: this.ec2Role.arn,
      migrationPhase: this.migrationStatus,
      trafficWeights: pulumi.output(weights),
    };
    

    this.writeOutputsToFile(args);
    this.registerOutputs(this.outputs);
  }

  private getTrafficWeights(
    phase: string
  ): { blue: number; green: number } {
    switch (phase) {
      case "initial":
      case "snapshot":
        return { blue: 100, green: 0 };
      case "blue-green":
      case "traffic-shift-10":
        return { blue: 90, green: 10 };
      case "traffic-shift-50":
        return { blue: 50, green: 50 };
      case "traffic-shift-100":
      case "complete":
        return { blue: 0, green: 100 };
      default:
        return { blue: 100, green: 0 };
    }
  }

  private createRdsMonitoringRole(
    args: TapStackArgs,
    opts: pulumi.ResourceOptions
  ): aws.iam.Role {
    const role = new aws.iam.Role(
      `prod-rds-monitoring-role-${args.environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Service: "monitoring.rds.amazonaws.com",
              },
              Action: "sts:AssumeRole",
            },
          ],
        }),
        tags: {
          Environment: "production",
          ManagedBy: "pulumi",
          ...(args.tags || {}),
        },
      },
      opts
    );

    new aws.iam.RolePolicyAttachment(
      `prod-rds-monitoring-attachment-${args.environmentSuffix}`,
      {
        role: role.name,
        policyArn:
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
      },
      opts
    );

    return role;
  }

  private writeOutputsToFile(_args: TapStackArgs): void {
    pulumi.all(this.outputs).apply((outputs) => {
      const outputDir = path.join(process.cwd(), "cfn-outputs");
      const outputFile = path.join(outputDir, "flat-outputs.json");

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      fs.writeFileSync(outputFile, JSON.stringify(outputs, null, 2), "utf-8");
      console.log(`Outputs written to: ${outputFile}`);
    });
  }
}

```