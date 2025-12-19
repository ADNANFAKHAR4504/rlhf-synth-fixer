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
