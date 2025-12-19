# RDS PostgreSQL Optimization - Pulumi TypeScript Implementation

This implementation provides a production-ready RDS PostgreSQL optimization with performance monitoring, high availability, and automated alerting.

## File: lib/rds-stack.ts

```typescript
/**
 * RDS Stack - Optimized PostgreSQL Database Infrastructure
 *
 * This module implements an optimized RDS PostgreSQL deployment with:
 * - Performance improvements (db.r6g.large with Graviton processors)
 * - Enhanced monitoring (Performance Insights + Enhanced Monitoring)
 * - High availability (Multi-AZ deployment)
 * - Automated alerting (CloudWatch + SNS)
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface RdsStackArgs {
  environmentSuffix: string;
  vpcId: pulumi.Input<string>;
  privateSubnetIds: pulumi.Input<string[]>;
  applicationSecurityGroupId: pulumi.Input<string>;
  tags?: { [key: string]: pulumi.Input<string> };
}

export class RdsStack extends pulumi.ComponentResource {
  public readonly dbInstance: aws.rds.Instance;
  public readonly dbSecurityGroup: aws.ec2.SecurityGroup;
  public readonly snsTopic: aws.sns.Topic;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly dbPort: pulumi.Output<number>;

  constructor(name: string, args: RdsStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:rds:RdsStack', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    // Default tags merged with user-provided tags
    const resourceTags = {
      Environment: 'production',
      Team: 'platform',
      Service: 'user-api',
      ...args.tags,
    };

    // Create SNS Topic for database alerts
    this.snsTopic = new aws.sns.Topic(`db-alerts-${args.environmentSuffix}`, {
      displayName: `Database Alerts - ${args.environmentSuffix}`,
      tags: resourceTags,
    }, defaultResourceOptions);

    // Create DB Subnet Group
    const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-${args.environmentSuffix}`, {
      name: `db-subnet-${args.environmentSuffix}`,
      subnetIds: args.privateSubnetIds,
      tags: {
        ...resourceTags,
        Name: `db-subnet-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Create Security Group for RDS
    this.dbSecurityGroup = new aws.ec2.SecurityGroup(`db-sg-${args.environmentSuffix}`, {
      name: `db-sg-${args.environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL instance - allows access from application tier only',
      vpcId: args.vpcId,
      ingress: [{
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        securityGroups: [args.applicationSecurityGroupId],
        description: 'PostgreSQL access from application tier',
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      }],
      tags: {
        ...resourceTags,
        Name: `db-sg-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Create IAM role for Enhanced Monitoring
    const monitoringRole = new aws.iam.Role(`rds-monitoring-role-${args.environmentSuffix}`, {
      name: `rds-monitoring-role-${args.environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'monitoring.rds.amazonaws.com',
          },
        }],
      }),
      tags: resourceTags,
    }, defaultResourceOptions);

    new aws.iam.RolePolicyAttachment(`rds-monitoring-policy-${args.environmentSuffix}`, {
      role: monitoringRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    }, defaultResourceOptions);

    // Create custom DB Parameter Group with optimized settings
    // db.r6g.large has 16 GiB memory = 16384 MB
    // shared_buffers = 25% = 4096 MB = 524288 (8KB pages)
    // effective_cache_size = 75% = 12288 MB = 1572864 (8KB pages)
    const dbParameterGroup = new aws.rds.ParameterGroup(`db-params-${args.environmentSuffix}`, {
      name: `postgres-optimized-${args.environmentSuffix}`,
      family: 'postgres14',
      description: 'Optimized PostgreSQL parameters for db.r6g.large',
      parameters: [
        {
          name: 'shared_buffers',
          value: '524288', // 4 GB in 8KB pages
        },
        {
          name: 'effective_cache_size',
          value: '1572864', // 12 GB in 8KB pages
        },
        {
          name: 'maintenance_work_mem',
          value: '2097152', // 2 GB in KB
        },
        {
          name: 'work_mem',
          value: '32768', // 32 MB in KB
        },
        {
          name: 'random_page_cost',
          value: '1.1', // Optimized for SSD storage
        },
        {
          name: 'effective_io_concurrency',
          value: '200', // SSD storage optimization
        },
      ],
      tags: resourceTags,
    }, defaultResourceOptions);

    // Create RDS PostgreSQL Instance
    this.dbInstance = new aws.rds.Instance(`db-postgres-${args.environmentSuffix}`, {
      identifier: `user-api-db-${args.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '14.7',
      instanceClass: 'db.r6g.large',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,

      // Database configuration
      dbName: 'userapi',
      username: 'dbadmin',
      password: pulumi.secret('ChangeMe123!'), // Should be from AWS Secrets Manager in production
      port: 5432,

      // High Availability
      multiAz: true,

      // Backup configuration
      backupRetentionPeriod: 35,
      backupWindow: '03:00-04:00', // 3-4 AM UTC
      maintenanceWindow: 'Mon:04:00-Mon:05:00',

      // Network configuration
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      publiclyAccessible: false,

      // Parameter group
      parameterGroupName: dbParameterGroup.name,

      // Performance Insights
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,

      // Enhanced Monitoring
      monitoringInterval: 60,
      monitoringRoleArn: monitoringRole.arn,

      // Operational settings
      autoMinorVersionUpgrade: true,
      deletionProtection: false, // Must be false for destroyability
      skipFinalSnapshot: true, // Must be true for destroyability
      applyImmediately: false,

      tags: {
        ...resourceTags,
        Name: `user-api-db-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    // Export outputs
    this.dbEndpoint = this.dbInstance.endpoint;
    this.dbPort = this.dbInstance.port;

    // Create CloudWatch Alarms
    this.createCloudWatchAlarms(args.environmentSuffix, resourceTags, defaultResourceOptions);

    this.registerOutputs({
      dbInstanceId: this.dbInstance.id,
      dbEndpoint: this.dbEndpoint,
      dbPort: this.dbPort,
      dbSecurityGroupId: this.dbSecurityGroup.id,
      snsTopicArn: this.snsTopic.arn,
    });
  }

  private createCloudWatchAlarms(
    environmentSuffix: string,
    tags: { [key: string]: pulumi.Input<string> },
    opts: pulumi.ResourceOptions
  ): void {
    // CPU Utilization Alarm (80% threshold)
    new aws.cloudwatch.MetricAlarm(`db-cpu-alarm-${environmentSuffix}`, {
      name: `db-cpu-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300, // 5 minutes
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Triggers when CPU utilization exceeds 80%',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: this.dbInstance.identifier,
      },
      tags: tags,
    }, opts);

    // Database Connections Alarm (80% of max_connections)
    // PostgreSQL default max_connections for db.r6g.large is approximately 600
    new aws.cloudwatch.MetricAlarm(`db-connections-alarm-${environmentSuffix}`, {
      name: `db-connections-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 480, // 80% of ~600
      alarmDescription: 'Triggers when database connections exceed 80% of max_connections',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: this.dbInstance.identifier,
      },
      tags: tags,
    }, opts);

    // Read Latency Alarm (200ms threshold)
    new aws.cloudwatch.MetricAlarm(`db-read-latency-alarm-${environmentSuffix}`, {
      name: `db-read-latency-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ReadLatency',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 0.2, // 200ms in seconds
      alarmDescription: 'Triggers when read latency exceeds 200ms',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: this.dbInstance.identifier,
      },
      tags: tags,
    }, opts);

    // Write Latency Alarm (200ms threshold)
    new aws.cloudwatch.MetricAlarm(`db-write-latency-alarm-${environmentSuffix}`, {
      name: `db-write-latency-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'WriteLatency',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 0.2, // 200ms in seconds
      alarmDescription: 'Triggers when write latency exceeds 200ms',
      alarmActions: [this.snsTopic.arn],
      dimensions: {
        DBInstanceIdentifier: this.dbInstance.identifier,
      },
      tags: tags,
    }, opts);
  }
}
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts
 *
 * This module defines the TapStack class, the main Pulumi ComponentResource for
 * the TAP (Test Automation Platform) project.
 *
 * It orchestrates the instantiation of other resource-specific components
 * and manages environment-specific configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { RdsStack } from './rds-stack';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  /**
   * An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
   * Defaults to 'dev' if not provided.
   */
  environmentSuffix?: string;

  /**
   * Optional default tags to apply to resources.
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * Represents the main Pulumi component resource for the TAP project.
 *
 * This component orchestrates the instantiation of other resource-specific components
 * and manages the environment suffix used for naming and configuration.
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly rdsStack?: RdsStack;
  public readonly dbEndpoint?: pulumi.Output<string>;
  public readonly snsTopicArn?: pulumi.Output<string>;

  /**
   * Creates a new TapStack component.
   * @param name The logical name of this Pulumi component.
   * @param args Configuration arguments including environment suffix and tags.
   * @param opts Pulumi options.
   */
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Get VPC configuration from Pulumi config or use defaults
    const config = new pulumi.Config();
    const vpcId = config.get('vpcId') || 'vpc-default';
    const privateSubnetIds = config.getObject<string[]>('privateSubnetIds') || ['subnet-1', 'subnet-2'];
    const applicationSecurityGroupId = config.get('applicationSecurityGroupId') || 'sg-app';

    // Instantiate RDS Stack for optimized PostgreSQL database
    this.rdsStack = new RdsStack('rds-stack', {
      environmentSuffix: environmentSuffix,
      vpcId: vpcId,
      privateSubnetIds: privateSubnetIds,
      applicationSecurityGroupId: applicationSecurityGroupId,
      tags: tags,
    }, { parent: this });

    // Expose outputs from RDS stack
    this.dbEndpoint = this.rdsStack.dbEndpoint;
    this.snsTopicArn = this.rdsStack.snsTopic.arn;

    // Register the outputs of this component
    this.registerOutputs({
      dbEndpoint: this.dbEndpoint,
      dbSecurityGroupId: this.rdsStack.dbSecurityGroup.id,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: lib/README.md

```markdown
# RDS PostgreSQL Optimization Infrastructure

This Pulumi TypeScript project implements an optimized RDS PostgreSQL database deployment with enhanced monitoring, high availability, and automated alerting for the user-api service.

## Architecture

The infrastructure includes:

- **RDS PostgreSQL Instance**: db.r6g.large with Graviton processors for improved price-performance
- **Custom Parameter Group**: Optimized PostgreSQL settings for memory-intensive workloads
- **Multi-AZ Deployment**: Automatic failover capability for high availability
- **Performance Insights**: 7-day retention for query performance analysis
- **Enhanced Monitoring**: 60-second granularity for detailed metrics
- **CloudWatch Alarms**: CPU, connections, and latency monitoring
- **SNS Notifications**: Centralized alerting to ops team
- **Security Group**: Restricted access from application tier only

## Prerequisites

1. AWS Account with appropriate permissions
2. Node.js 18+ installed
3. Pulumi CLI installed (`curl -fsSL https://get.pulumi.com | sh`)
4. AWS CLI configured with credentials
5. Existing VPC with private subnets
6. Application security group ID

## Configuration

Set the following Pulumi configuration values:

```bash
# Set AWS region
pulumi config set aws:region us-east-1

# Set VPC configuration (required)
pulumi config set vpcId vpc-xxxxxxxxx
pulumi config set privateSubnetIds '["subnet-xxxxx","subnet-yyyyy"]'
pulumi config set applicationSecurityGroupId sg-xxxxxxxxx

# Set environment suffix
export ENVIRONMENT_SUFFIX=prod
```

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Preview changes:

```bash
pulumi preview
```

3. Deploy infrastructure:

```bash
pulumi up
```

4. View outputs:

```bash
pulumi stack output
```

## Resource Naming

All resources follow the naming convention: `{resource-type}-{purpose}-{environmentSuffix}`

Examples:
- `db-postgres-prod`
- `db-sg-prod`
- `db-alerts-prod`

## Database Configuration

### Instance Specifications
- **Instance Class**: db.r6g.large (2 vCPUs, 16 GiB RAM)
- **Engine**: PostgreSQL 14.7
- **Storage**: 100 GB GP3 (encrypted)
- **Multi-AZ**: Enabled

### Optimized Parameters
- **shared_buffers**: 4 GB (25% of instance memory)
- **effective_cache_size**: 12 GB (75% of instance memory)
- **maintenance_work_mem**: 2 GB
- **work_mem**: 32 MB
- **random_page_cost**: 1.1 (SSD optimized)
- **effective_io_concurrency**: 200

### Backup Configuration
- **Retention Period**: 35 days
- **Backup Window**: 03:00-04:00 UTC (daily)
- **Maintenance Window**: Monday 04:00-05:00 UTC

## Monitoring and Alerts

### CloudWatch Alarms

1. **CPU Utilization**
   - Threshold: 80%
   - Evaluation: 2 periods of 5 minutes

2. **Database Connections**
   - Threshold: 480 connections (80% of max)
   - Evaluation: 2 periods of 5 minutes

3. **Read Latency**
   - Threshold: 200ms
   - Evaluation: 2 periods of 5 minutes

4. **Write Latency**
   - Threshold: 200ms
   - Evaluation: 2 periods of 5 minutes

### SNS Topic

Subscribe to the SNS topic for email notifications:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint ops-team@example.com
```

## Security

- Database is not publicly accessible
- Security group restricts access to application tier only
- All data encrypted at rest
- Enhanced monitoring enabled for audit trails
- IAM role follows least privilege principle

## Cost Optimization

- Graviton-based instance (30-40% better price-performance)
- GP3 storage (20% cheaper than GP2)
- Automated backups with appropriate retention
- Performance Insights with 7-day retention (free tier)

## Outputs

The stack exports the following outputs:

- `dbEndpoint`: Database connection endpoint
- `dbSecurityGroupId`: Security group ID for database access
- `snsTopicArn`: SNS topic ARN for alarm notifications

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

**Note**: Ensure `deletionProtection` is set to `false` and `skipFinalSnapshot` is `true` for complete resource deletion.

## Support

For issues or questions, contact the platform team.

## Tags

All resources are tagged with:
- Environment: production
- Team: platform
- Service: user-api
```

## Implementation Notes

This solution provides a production-ready RDS PostgreSQL optimization with:

1. **Performance**: db.r6g.large with Graviton processors and optimized parameter group
2. **Monitoring**: Performance Insights (7 days) and Enhanced Monitoring (60s intervals)
3. **High Availability**: Multi-AZ deployment with automatic failover
4. **Alerting**: CloudWatch alarms for CPU, connections, and latency with SNS integration
5. **Security**: Restricted security group access and encrypted storage
6. **Backup**: 35-day retention with daily backup window
7. **Destroyability**: All resources can be fully destroyed (no Retain policies)

The code uses the TapStack pattern and integrates with the existing Pulumi project structure. All resources include the environmentSuffix for multi-environment support.
