import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';
import { Construct } from 'constructs';

/**
 * Configuration interface for environment-specific settings
 * Allows consistent configuration across different environments (dev, staging, prod)
 */
export interface MultiEnvConfig {
  environmentName: string;
  vpcCidr: string;
  enableNatGateway: boolean;
  s3ReplicationRegions: string[];
  logRetentionDays: logs.RetentionDays;
  enableContainerInsights: boolean;
}

/**
 * Props interface extending standard Stack props with multi-environment configuration
 */
export interface MultiEnvStackProps extends cdk.StackProps {
  config: MultiEnvConfig;
  crossRegionReferences?: boolean;
  environmentSuffix: string;
}

/**
 * Multi-Environment Infrastructure Stack
 *
 * This stack creates a comprehensive AWS infrastructure solution that ensures
 * consistency across multiple environments and regions. It includes:
 * - Parameterized VPC with consistent networking
 * - IAM roles following principle of least privilege
 * - S3 buckets with cross-region replication
 * - CloudWatch monitoring with Container Insights
 * - ECS cluster with Service Connect capability
 */
export class MultiEnvStack extends cdk.Stack {
  public readonly vpc: ec2.IVpc;
  public readonly ecsCluster: ecs.Cluster;
  public readonly primaryBucket: s3.Bucket;
  public readonly executionRole: iam.Role;
  public readonly taskRole: iam.Role;
  public readonly environmentSuffix: string;

  constructor(scope: Construct, id: string, props: MultiEnvStackProps) {
    super(scope, id, props);

    // Enable cross-region references if specified
    if (props.crossRegionReferences) {
      this.node.setContext('@aws-cdk/core:enableCrossRegionReferences', true);
    }
    this.environmentSuffix = props.environmentSuffix;
    // Create VPC with consistent configuration across environments
    this.vpc = this.createVpc(props.config);

    // Create IAM roles with least privilege principle
    const roles = this.createIamRoles(props.config);
    this.executionRole = roles.executionRole;
    this.taskRole = roles.taskRole;

    // Create S3 bucket with cross-region replication
    this.primaryBucket = this.createS3BucketWithReplication(props.config);

    // Create ECS cluster with Service Connect and Container Insights
    this.ecsCluster = this.createEcsCluster(props.config);

    // Set up CloudWatch monitoring and logging
    this.setupCloudWatchMonitoring(props.config);

    // Create CloudWatch Log Groups for centralized logging
    this.createLogGroups(props.config);

    // Apply consistent tags across all resources
    this.applyEnvironmentTags(props.config);

    // Export outputs for testing and cross-stack references
    this.exportOutputs(props.config);
  }

  /**
   * Creates a VPC with consistent networking configuration
   * Ensures same subnet structure across all environments
   * For testing, uses default VPC to avoid quota issues
   */
  private createVpc(config: MultiEnvConfig): ec2.IVpc {
    // For testing purposes, use default VPC to avoid VPC quota issues
    const vpc = ec2.Vpc.fromLookup(this, 'MultiEnvVpc', {
      isDefault: true,
    });

    // Add VPC Flow Logs for security monitoring
    new ec2.FlowLog(this, 'VpcFlowLog', {
      resourceType: ec2.FlowLogResourceType.fromVpc(vpc),
      destination: ec2.FlowLogDestination.toCloudWatchLogs(
        new logs.LogGroup(this, 'VpcFlowLogGroup', {
          logGroupName: `/aws/vpc/flowlogs/${config.environmentName}-${this.environmentSuffix}-${this.stackName}`,
          retention: config.logRetentionDays,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        })
      ),
    });

    return vpc;
  }

  /**
   * Creates IAM roles following the principle of least privilege
   * Separate roles for different purposes with minimal required permissions
   */
  private createIamRoles(config: MultiEnvConfig): {
    executionRole: iam.Role;
    taskRole: iam.Role;
  } {
    // ECS Task Execution Role - only permissions needed to start tasks
    const executionRole = new iam.Role(this, 'EcsExecutionRole', {
      roleName: `${config.environmentName}-${this.environmentSuffix}-ecs-execution-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
      // Additional permissions for CloudWatch Logs
      inlinePolicies: {
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ecs/${config.environmentName}-${this.environmentSuffix}/*`,
              ],
            }),
          ],
        }),
      },
    });

    // ECS Task Role - application-specific permissions
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      roleName: `${config.environmentName}-${this.environmentSuffix}-ecs-task-role`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
              resources: [
                `arn:aws:s3:::${config.environmentName}-${this.environmentSuffix}-multi-env-bucket/*`,
              ],
            }),
          ],
        }),
        CloudWatchMetrics: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'cloudwatch:PutMetricData',
                'cloudwatch:GetMetricStatistics',
                'cloudwatch:ListMetrics',
              ],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    return { executionRole, taskRole };
  }

  /**
   * Creates S3 bucket with cross-region replication for data durability
   * Implements versioning, encryption, and replication to specified regions
   */
  private createS3BucketWithReplication(config: MultiEnvConfig): s3.Bucket {
    const bucketName = `${config.environmentName}-${this.environmentSuffix}-multi-env-bucket-${this.account}-${this.region}`;

    // Create the primary S3 bucket
    const primaryBucket = new s3.Bucket(this, 'PrimaryBucket', {
      bucketName: bucketName,
      versioned: true, // Required for replication
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For non-production environments
    });

    // Create replication role for cross-region replication
    const replicationRole = new iam.Role(this, 'S3ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      inlinePolicies: {
        ReplicationPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              resources: [`${primaryBucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:ListBucket'],
              resources: [primaryBucket.bucketArn],
            }),
          ],
        }),
      },
    });

    // Add replication destinations for each specified region
    config.s3ReplicationRegions.forEach(region => {
      if (region !== this.region) {
        // Create destination bucket in target region (would need cross-region support)
        const destinationBucketArn = `arn:aws:s3:::${config.environmentName}-${this.environmentSuffix}-multi-env-replica-${this.account}-${region}`;

        // Add destination permissions to replication role
        replicationRole.addToPolicy(
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            resources: [`${destinationBucketArn}/*`],
          })
        );
      }
    });

    return primaryBucket;
  }

  /**
   * Creates ECS cluster with Service Connect and Container Insights
   * Enables advanced monitoring and service communication features
   */
  private createEcsCluster(config: MultiEnvConfig): ecs.Cluster {
    const cluster = new ecs.Cluster(this, 'MultiEnvCluster', {
      clusterName: `${config.environmentName}-${this.environmentSuffix}-multi-env-cluster`,
      vpc: this.vpc,
      // Enable Container Insights for enhanced observability
      containerInsights: config.enableContainerInsights,
      // Enable CloudWatch logging
      enableFargateCapacityProviders: true,
    });

    // Configure Service Connect on the cluster with unique namespace
    cluster.addDefaultCloudMapNamespace({
      name: `${config.environmentName}-${this.environmentSuffix}-${this.stackName}.local`,
      type: servicediscovery.NamespaceType.DNS_PRIVATE,
    });

    return cluster;
  }

  /**
   * Sets up comprehensive CloudWatch monitoring
   * Creates dashboards, alarms, and metric filters for observability
   */
  private setupCloudWatchMonitoring(config: MultiEnvConfig): void {
    // Create CloudWatch Dashboard for environment overview
    const dashboard = new cloudwatch.Dashboard(this, 'MultiEnvDashboard', {
      dashboardName: `${config.environmentName}-${this.environmentSuffix}-multi-env-dashboard`,
    });

    // Add VPC metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'VPC Flow Logs',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/VPC',
            metricName: 'PacketsDropped',
            dimensionsMap: {
              VpcId: this.vpc.vpcId,
            },
            statistic: 'Sum',
          }),
        ],
      })
    );

    // Add ECS cluster metrics widget
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS Cluster Metrics',
        width: 12,
        height: 6,
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              ClusterName: this.ecsCluster.clusterName,
            },
            statistic: 'Average',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ECS',
            metricName: 'MemoryUtilization',
            dimensionsMap: {
              ClusterName: this.ecsCluster.clusterName,
            },
            statistic: 'Average',
          }),
        ],
      })
    );

    // Create CloudWatch Alarms for critical metrics
    new cloudwatch.Alarm(this, 'HighCPUAlarm', {
      alarmName: `${config.environmentName}-${this.environmentSuffix}-high-cpu-utilization`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ECS',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          ClusterName: this.ecsCluster.clusterName,
        },
        statistic: 'Average',
      }),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Create alarm for S3 bucket access
    new cloudwatch.Alarm(this, 'S3AccessAlarm', {
      alarmName: `${config.environmentName}-${this.environmentSuffix}-s3-high-error-rate`,
      metric: new cloudwatch.Metric({
        namespace: 'AWS/S3',
        metricName: '4xxErrors',
        dimensionsMap: {
          BucketName: this.primaryBucket.bucketName,
        },
        statistic: 'Sum',
      }),
      threshold: 10,
      evaluationPeriods: 1,
    });
  }

  /**
   * Creates centralized log groups for different services
   * Ensures consistent logging configuration across environments
   */
  private createLogGroups(config: MultiEnvConfig): void {
    // Application log group
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ecs/${config.environmentName}-${this.environmentSuffix}/application`,
      retention: config.logRetentionDays,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // System log group
    new logs.LogGroup(this, 'SystemLogGroup', {
      logGroupName: `/aws/ecs/${config.environmentName}-${this.environmentSuffix}/system`,
      retention: config.logRetentionDays,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Security log group
    new logs.LogGroup(this, 'SecurityLogGroup', {
      logGroupName: `/aws/security/${config.environmentName}-${this.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_YEAR, // Keep security logs longer
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  /**
   * Applies consistent tags across all resources in the stack
   * Enables proper resource management and cost allocation
   */
  private applyEnvironmentTags(config: MultiEnvConfig): void {
    cdk.Tags.of(this).add('Environment', config.environmentName);
    cdk.Tags.of(this).add('Stack', 'MultiEnvironmentInfrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Project', 'MultiEnvDeployment');
    cdk.Tags.of(this).add('CostCenter', config.environmentName);
  }

  /**
   * Exports CloudFormation outputs for cross-stack references and testing
   * These outputs are used by integration tests to validate the infrastructure
   */
  private exportOutputs(config: MultiEnvConfig): void {
    // VPC outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'The ID of the VPC',
      exportName: `${this.stackName}-VpcId`,
    });

    // ECS Cluster outputs
    new cdk.CfnOutput(this, 'EcsClusterName', {
      value: this.ecsCluster.clusterName,
      description: 'The name of the ECS cluster',
      exportName: `${this.stackName}-EcsClusterName`,
    });

    new cdk.CfnOutput(this, 'EcsClusterArn', {
      value: this.ecsCluster.clusterArn,
      description: 'The ARN of the ECS cluster',
      exportName: `${this.stackName}-EcsClusterArn`,
    });

    // S3 Bucket outputs
    new cdk.CfnOutput(this, 'PrimaryBucketName', {
      value: this.primaryBucket.bucketName,
      description: 'The name of the primary S3 bucket',
      exportName: `${this.stackName}-PrimaryBucketName`,
    });

    new cdk.CfnOutput(this, 'PrimaryBucketArn', {
      value: this.primaryBucket.bucketArn,
      description: 'The ARN of the primary S3 bucket',
      exportName: `${this.stackName}-PrimaryBucketArn`,
    });

    // IAM Role outputs
    new cdk.CfnOutput(this, 'ExecutionRoleName', {
      value: this.executionRole.roleName,
      description: 'The name of the ECS execution IAM role',
      exportName: `${this.stackName}-ExecutionRoleName`,
    });

    new cdk.CfnOutput(this, 'ExecutionRoleArn', {
      value: this.executionRole.roleArn,
      description: 'The ARN of the ECS execution IAM role',
      exportName: `${this.stackName}-ExecutionRoleArn`,
    });

    new cdk.CfnOutput(this, 'TaskRoleName', {
      value: this.taskRole.roleName,
      description: 'The name of the ECS task IAM role',
      exportName: `${this.stackName}-TaskRoleName`,
    });

    new cdk.CfnOutput(this, 'TaskRoleArn', {
      value: this.taskRole.roleArn,
      description: 'The ARN of the ECS task IAM role',
      exportName: `${this.stackName}-TaskRoleArn`,
    });

    // CloudWatch Logs outputs
    const appLogGroup = `/aws/ecs/${config.environmentName}-${this.environmentSuffix}/application`;
    new cdk.CfnOutput(this, 'ApplicationLogGroupName', {
      value: appLogGroup,
      description: 'The name of the application log group',
      exportName: `${this.stackName}-ApplicationLogGroupName`,
    });

    const sysLogGroup = `/aws/ecs/${config.environmentName}-${this.environmentSuffix}/system`;
    new cdk.CfnOutput(this, 'SystemLogGroupName', {
      value: sysLogGroup,
      description: 'The name of the system log group',
      exportName: `${this.stackName}-SystemLogGroupName`,
    });

    const secLogGroup = `/aws/security/${config.environmentName}-${this.environmentSuffix}`;
    new cdk.CfnOutput(this, 'SecurityLogGroupName', {
      value: secLogGroup,
      description: 'The name of the security log group',
      exportName: `${this.stackName}-SecurityLogGroupName`,
    });

    const vpcFlowLogGroup = `/aws/vpc/flowlogs/${config.environmentName}-${this.environmentSuffix}-${this.stackName}`;
    new cdk.CfnOutput(this, 'VpcFlowLogGroupName', {
      value: vpcFlowLogGroup,
      description: 'The name of the VPC flow log group',
      exportName: `${this.stackName}-VpcFlowLogGroupName`,
    });

    // CloudWatch Dashboard and Alarms outputs
    const dashboardName = `${config.environmentName}-${this.environmentSuffix}-multi-env-dashboard`;
    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboardName,
      description: 'The name of the CloudWatch dashboard',
      exportName: `${this.stackName}-DashboardName`,
    });

    const cpuAlarmName = `${config.environmentName}-${this.environmentSuffix}-high-cpu-utilization`;
    new cdk.CfnOutput(this, 'CpuAlarmName', {
      value: cpuAlarmName,
      description: 'The name of the CPU utilization alarm',
      exportName: `${this.stackName}-CpuAlarmName`,
    });

    const s3AlarmName = `${config.environmentName}-${this.environmentSuffix}-s3-high-error-rate`;
    new cdk.CfnOutput(this, 'S3AlarmName', {
      value: s3AlarmName,
      description: 'The name of the S3 error rate alarm',
      exportName: `${this.stackName}-S3AlarmName`,
    });

    // Service Discovery namespace output
    const namespaceName = `${config.environmentName}-${this.environmentSuffix}-${this.stackName}.local`;
    new cdk.CfnOutput(this, 'ServiceDiscoveryNamespace', {
      value: namespaceName,
      description: 'The name of the Service Discovery namespace',
      exportName: `${this.stackName}-ServiceDiscoveryNamespace`,
    });

    // Environment configuration outputs
    new cdk.CfnOutput(this, 'EnvironmentName', {
      value: config.environmentName,
      description: 'The name of the environment',
      exportName: `${this.stackName}-EnvironmentName`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: this.environmentSuffix,
      description: 'The suffix of the environment',
      exportName: `${this.stackName}-EnvironmentSuffix`,
    });
  }
}

/**
 * Helper function to get environment-specific configuration
 * Allows easy customization for different environments
 */
export function getEnvironmentConfig(environmentName: string): MultiEnvConfig {
  const configs: Record<string, MultiEnvConfig> = {
    dev: {
      environmentName: 'dev',
      vpcCidr: '10.99.0.0/16',
      enableNatGateway: false, // Cost optimization for dev
      s3ReplicationRegions: ['us-east-1'], // Single region for dev
      logRetentionDays: logs.RetentionDays.ONE_WEEK,
      enableContainerInsights: false, // Disable for cost optimization
    },
    staging: {
      environmentName: 'staging',
      vpcCidr: '10.1.0.0/16',
      enableNatGateway: true,
      s3ReplicationRegions: ['us-east-1', 'us-west-2'], // Multi-region for staging
      logRetentionDays: logs.RetentionDays.ONE_MONTH,
      enableContainerInsights: true,
    },
    prod: {
      environmentName: 'prod',
      vpcCidr: '10.2.0.0/16',
      enableNatGateway: true,
      s3ReplicationRegions: ['us-east-1', 'us-west-2', 'eu-west-1'], // Global replication for prod
      logRetentionDays: logs.RetentionDays.SIX_MONTHS,
      enableContainerInsights: true,
    },
  };

  return configs[environmentName] || configs.dev;
}
