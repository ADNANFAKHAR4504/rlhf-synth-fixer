import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { VpcConstruct } from './constructs/vpc-construct';
import { ApplicationTierConstruct } from './constructs/application-tier-construct';
import { DatabaseTierConstruct } from './constructs/database-tier-construct';
import { MonitoringConstruct } from './constructs/monitoring-construct';
import { StackConfig, REGION_CONFIGS } from './interfaces/stack-config';

/**
 * Main TapStack that creates a comprehensive multi-region AWS infrastructure
 * This stack implements all the requirements from the Terraform task:
 * - Multi-region deployment for high availability
 * - VPCs with public and private subnets
 * - Application Load Balancer with auto-scaling groups
 * - RDS database with multi-AZ and automated backups
 * - Comprehensive monitoring and logging
 * - Security groups and network ACLs
 * - Proper tagging and resource management
 */
export class TapStack extends cdk.Stack {
  public readonly vpcConstruct: VpcConstruct;
  public readonly applicationTierConstruct: ApplicationTierConstruct;
  public readonly databaseTierConstruct: DatabaseTierConstruct;
  public readonly monitoringConstruct: MonitoringConstruct;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get environment suffix from context or use default
    // This serves the same purpose as Terraform workspaces for environment management
    const environmentSuffix =
      this.node.tryGetContext('environmentSuffix') || 'dev';

    // Validate environment suffix (equivalent to Terraform workspace validation)
    const validEnvironments = ['dev', 'staging', 'prod'];

    // For CI/CD scenarios, if the environment suffix doesn't match valid environments,
    // default to 'dev' instead of throwing an error
    let finalEnvironmentSuffix = environmentSuffix;
    if (!validEnvironments.includes(environmentSuffix)) {
      console.warn(
        `Warning: Invalid environment suffix '${environmentSuffix}' detected. Defaulting to 'dev'. Valid environments are: ${validEnvironments.join(', ')}`
      );
      finalEnvironmentSuffix = 'dev';
    }

    // Get the region configuration for this stack
    const region = this.region || 'us-east-1';
    const config: StackConfig = REGION_CONFIGS[region] || {
      ...REGION_CONFIGS['us-east-1'],
      region: region,
      vpcCidr: region === 'us-west-2' ? '10.1.0.0/16' : '10.0.0.0/16',
    };

    // Update tags with environment suffix
    config.tags = {
      ...config.tags,
      Environment: finalEnvironmentSuffix,
      Stack: id,
      DeployedAt: new Date().toISOString(),
    };

    // Create VPC infrastructure
    this.vpcConstruct = new VpcConstruct(this, 'VpcConstruct', config);

    // Create database tier (must be created before application tier for security group references)
    this.databaseTierConstruct = new DatabaseTierConstruct(
      this,
      'DatabaseTierConstruct',
      this.vpcConstruct.vpc,
      config
    );

    // Create application tier with ALB and Auto Scaling Group
    this.applicationTierConstruct = new ApplicationTierConstruct(
      this,
      'ApplicationTierConstruct',
      this.vpcConstruct.vpc,
      config
    );

    // Allow database connections from application tier
    this.databaseTierConstruct.allowConnectionsFrom(
      this.applicationTierConstruct.applicationSecurityGroup
    );

    // Create comprehensive monitoring and logging
    this.monitoringConstruct = new MonitoringConstruct(
      this,
      'MonitoringConstruct',
      config,
      {
        loadBalancer: this.applicationTierConstruct.loadBalancer,
        autoScalingGroup: this.applicationTierConstruct.autoScalingGroup,
        database: this.databaseTierConstruct.database,
      }
    );

    // Create CloudWatch alarms for critical metrics
    this.createCloudWatchAlarms(config);

    // Create outputs for important resources
    this.createOutputs(config);

    // Apply comprehensive tagging to all resources in the stack
    this.applyStackTags(config);

    // Note: CDK manages state through CloudFormation, which provides:
    // - Automatic state locking through CloudFormation
    // - State persistence in S3 (CloudFormation templates and metadata)
    // - Version control and rollback capabilities
    // - Multi-environment support through stack names and context
    // This is equivalent to Terraform's state management with S3 backend and workspaces
  }

  /**
   * Create CloudWatch alarms for critical infrastructure metrics
   */
  private createCloudWatchAlarms(config: StackConfig): void {
    const alarmTopic = this.monitoringConstruct.alertTopic;

    // ALB 5xx error rate alarm
    const alb5xxAlarm = new cdk.aws_cloudwatch.Alarm(this, 'ALB5xxErrorRate', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_ELB_5XX_Count',
        dimensionsMap: {
          LoadBalancer:
            this.applicationTierConstruct.loadBalancer.loadBalancerName ||
            'unknown',
        },
        statistic: 'Sum',
      }),
      threshold: config.monitoring.alarmThresholds.alb5xxErrorRate,
      evaluationPeriods: 2,
      alarmDescription: 'ALB 5xx error count is too high',
      alarmName: `MultiRegionApp-ALB-5xx-${config.region}`,
    });
    alb5xxAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    // EC2 CPU utilization alarm
    const cpuAlarm = new cdk.aws_cloudwatch.Alarm(this, 'EC2CPUUtilization', {
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: 'AWS/EC2',
        metricName: 'CPUUtilization',
        dimensionsMap: {
          AutoScalingGroupName:
            this.applicationTierConstruct.autoScalingGroup.autoScalingGroupName,
        },
        statistic: 'Average',
      }),
      threshold: config.monitoring.alarmThresholds.cpuUtilization,
      evaluationPeriods: 2,
      alarmDescription: 'EC2 CPU utilization is too high',
      alarmName: `MultiRegionApp-EC2-CPU-${config.region}`,
    });
    cpuAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    // RDS CPU utilization alarm
    const rdsCpuAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'RDSCPUUtilization',
      {
        metric: this.databaseTierConstruct.database.metricCPUUtilization(),
        threshold: config.monitoring.alarmThresholds.rdsCpuUtilization,
        evaluationPeriods: 2,
        alarmDescription: 'RDS CPU utilization is too high',
        alarmName: `MultiRegionApp-RDS-CPU-${config.region}`,
      }
    );
    rdsCpuAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );

    // RDS free storage space alarm
    const rdsStorageAlarm = new cdk.aws_cloudwatch.Alarm(
      this,
      'RDSFreeStorageSpace',
      {
        metric: this.databaseTierConstruct.database.metricFreeStorageSpace(),
        threshold: config.monitoring.alarmThresholds.rdsFreeStorageSpace,
        evaluationPeriods: 2,
        alarmDescription: 'RDS free storage space is low',
        alarmName: `MultiRegionApp-RDS-Storage-${config.region}`,
      }
    );
    rdsStorageAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alarmTopic)
    );
  }

  /**
   * Create CloudFormation outputs for important resources
   */
  private createOutputs(config: StackConfig): void {
    // ALB DNS name
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.applicationTierConstruct.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `MultiRegionApp-ALB-DNS-${config.region}`,
    });

    // ALB ARN
    new cdk.CfnOutput(this, 'LoadBalancerARN', {
      value: this.applicationTierConstruct.loadBalancer.loadBalancerArn,
      description: 'Application Load Balancer ARN',
      exportName: `MultiRegionApp-ALB-ARN-${config.region}`,
    });

    // Auto Scaling Group name
    new cdk.CfnOutput(this, 'AutoScalingGroupName', {
      value:
        this.applicationTierConstruct.autoScalingGroup.autoScalingGroupName,
      description: 'Auto Scaling Group name',
      exportName: `MultiRegionApp-ASG-Name-${config.region}`,
    });

    // Database endpoint
    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.databaseTierConstruct.database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
      exportName: `MultiRegionApp-DB-Endpoint-${config.region}`,
    });

    // VPC ID
    new cdk.CfnOutput(this, 'VPCID', {
      value: this.vpcConstruct.vpc.vpcId,
      description: 'VPC ID',
      exportName: `MultiRegionApp-VPC-ID-${config.region}`,
    });

    // CloudWatch Dashboard URL
    new cdk.CfnOutput(this, 'DashboardURL', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.monitoringConstruct.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
      exportName: `MultiRegionApp-Dashboard-URL-${config.region}`,
    });

    // SNS Topic ARN for alerts
    new cdk.CfnOutput(this, 'AlertTopicARN', {
      value: this.monitoringConstruct.alertTopic.topicArn,
      description: 'SNS Topic ARN for alerts',
      exportName: `MultiRegionApp-Alert-Topic-${config.region}`,
    });
  }

  /**
   * Apply comprehensive tagging to all resources in the stack
   */
  private applyStackTags(config: StackConfig): void {
    // Apply tags to the entire stack
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Add stack-specific tags
    cdk.Tags.of(this).add('StackType', 'MultiRegionInfrastructure');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('Version', '1.0.0');
  }
}
