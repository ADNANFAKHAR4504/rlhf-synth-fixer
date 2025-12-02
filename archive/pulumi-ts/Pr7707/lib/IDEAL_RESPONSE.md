# RDS PostgreSQL Optimization - Pulumi TypeScript Implementation

This implementation provides a production-ready RDS PostgreSQL optimization with performance monitoring, high availability, and automated alerting.

## File: lib/vpc-stack.ts

```typescript
/**
 * VPC Stack - Network Infrastructure for RDS
 *
 * This module creates the necessary networking infrastructure to support
 * the RDS PostgreSQL deployment, including VPC, subnets, and security groups.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface VpcStackArgs {
  environmentSuffix: string;
  tags?: { [key: string]: pulumi.Input<string> };
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly privateSubnet1: aws.ec2.Subnet;
  public readonly privateSubnet2: aws.ec2.Subnet;
  public readonly applicationSecurityGroup: aws.ec2.SecurityGroup;

  constructor(
    name: string,
    args: VpcStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:vpc:VpcStack', name, {}, opts);

    const defaultResourceOptions: pulumi.ResourceOptions = { parent: this };

    const resourceTags = {
      Environment: 'production',
      Team: 'platform',
      Service: 'user-api',
      ...args.tags,
    };

    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `vpc-${args.environmentSuffix}`,
      {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...resourceTags,
          Name: `vpc-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    // Get available AZs
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create Private Subnet 1
    this.privateSubnet1 = new aws.ec2.Subnet(
      `private-subnet-1-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.1.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...resourceTags,
          Name: `private-subnet-1-${args.environmentSuffix}`,
          Tier: 'private',
        },
      },
      defaultResourceOptions
    );

    // Create Private Subnet 2
    this.privateSubnet2 = new aws.ec2.Subnet(
      `private-subnet-2-${args.environmentSuffix}`,
      {
        vpcId: this.vpc.id,
        cidrBlock: '10.0.2.0/24',
        availabilityZone: availabilityZones.then(azs => azs.names[1]),
        mapPublicIpOnLaunch: false,
        tags: {
          ...resourceTags,
          Name: `private-subnet-2-${args.environmentSuffix}`,
          Tier: 'private',
        },
      },
      defaultResourceOptions
    );

    // Create Application Security Group
    this.applicationSecurityGroup = new aws.ec2.SecurityGroup(
      `app-sg-${args.environmentSuffix}`,
      {
        name: `app-sg-${args.environmentSuffix}`,
        description: 'Security group for application tier',
        vpcId: this.vpc.id,
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
        tags: {
          ...resourceTags,
          Name: `app-sg-${args.environmentSuffix}`,
        },
      },
      defaultResourceOptions
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      privateSubnet1Id: this.privateSubnet1.id,
      privateSubnet2Id: this.privateSubnet2.id,
      applicationSecurityGroupId: this.applicationSecurityGroup.id,
    });
  }
}
```

## File: lib/rds-stack.ts

```typescript
/**
 * RDS Stack - Optimized PostgreSQL Database Infrastructure
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

    const resourceTags = {
      Environment: 'production',
      Team: 'platform',
      Service: 'user-api',
      ...args.tags,
    };

    // Create SNS Topic
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

    // Create Security Group
    this.dbSecurityGroup = new aws.ec2.SecurityGroup(`db-sg-${args.environmentSuffix}`, {
      name: `db-sg-${args.environmentSuffix}`,
      description: 'Security group for RDS PostgreSQL instance',
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
          Principal: { Service: 'monitoring.rds.amazonaws.com' },
        }],
      }),
      tags: resourceTags,
    }, defaultResourceOptions);

    new aws.iam.RolePolicyAttachment(`rds-monitoring-policy-${args.environmentSuffix}`, {
      role: monitoringRole.name,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
    }, defaultResourceOptions);

    // Create custom DB Parameter Group with optimized settings
    const dbParameterGroup = new aws.rds.ParameterGroup(`db-params-${args.environmentSuffix}`, {
      name: `postgres-optimized-${args.environmentSuffix}`,
      family: 'postgres14',
      description: 'Optimized PostgreSQL parameters for db.r6g.large',
      parameters: [
        {
          name: 'shared_buffers',
          value: '524288',
          applyMethod: 'pending-reboot',
        },
        {
          name: 'effective_cache_size',
          value: '1572864',
          applyMethod: 'pending-reboot',
        },
        {
          name: 'maintenance_work_mem',
          value: '2097152',
          applyMethod: 'pending-reboot',
        },
        {
          name: 'work_mem',
          value: '32768',
          applyMethod: 'immediate',
        },
        {
          name: 'random_page_cost',
          value: '1.1',
          applyMethod: 'immediate',
        },
        {
          name: 'effective_io_concurrency',
          value: '200',
          applyMethod: 'immediate',
        },
      ],
      tags: resourceTags,
    }, defaultResourceOptions);

    // Create RDS PostgreSQL Instance
    this.dbInstance = new aws.rds.Instance(`db-postgres-${args.environmentSuffix}`, {
      identifier: `user-api-db-${args.environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '14.20',
      instanceClass: 'db.r6g.large',
      allocatedStorage: 100,
      storageType: 'gp3',
      storageEncrypted: true,
      dbName: 'userapi',
      username: 'dbadmin',
      password: pulumi.secret('ChangeMe123!'),
      port: 5432,
      multiAz: true,
      backupRetentionPeriod: 35,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'Mon:04:00-Mon:05:00',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      publiclyAccessible: false,
      parameterGroupName: dbParameterGroup.name,
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60,
      monitoringRoleArn: monitoringRole.arn,
      autoMinorVersionUpgrade: true,
      deletionProtection: false,
      skipFinalSnapshot: true,
      applyImmediately: false,
      tags: {
        ...resourceTags,
        Name: `user-api-db-${args.environmentSuffix}`,
      },
    }, defaultResourceOptions);

    this.dbEndpoint = this.dbInstance.endpoint;
    this.dbPort = this.dbInstance.port;

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
    new aws.cloudwatch.MetricAlarm(`db-cpu-alarm-${environmentSuffix}`, {
      name: `db-cpu-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Triggers when CPU utilization exceeds 80%',
      alarmActions: [this.snsTopic.arn],
      dimensions: { DBInstanceIdentifier: this.dbInstance.identifier },
      tags: tags,
    }, opts);

    new aws.cloudwatch.MetricAlarm(`db-connections-alarm-${environmentSuffix}`, {
      name: `db-connections-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'DatabaseConnections',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 480,
      alarmDescription: 'Triggers when database connections exceed 80%',
      alarmActions: [this.snsTopic.arn],
      dimensions: { DBInstanceIdentifier: this.dbInstance.identifier },
      tags: tags,
    }, opts);

    new aws.cloudwatch.MetricAlarm(`db-read-latency-alarm-${environmentSuffix}`, {
      name: `db-read-latency-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ReadLatency',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 0.2,
      alarmDescription: 'Triggers when read latency exceeds 200ms',
      alarmActions: [this.snsTopic.arn],
      dimensions: { DBInstanceIdentifier: this.dbInstance.identifier },
      tags: tags,
    }, opts);

    new aws.cloudwatch.MetricAlarm(`db-write-latency-alarm-${environmentSuffix}`, {
      name: `db-write-latency-high-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'WriteLatency',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 0.2,
      alarmDescription: 'Triggers when write latency exceeds 200ms',
      alarmActions: [this.snsTopic.arn],
      dimensions: { DBInstanceIdentifier: this.dbInstance.identifier },
      tags: tags,
    }, opts);
  }
}
```

## File: lib/tap-stack.ts

```typescript
/**
 * tap-stack.ts - Main Pulumi ComponentResource for TAP
 */
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { VpcStack } from './vpc-stack';
import { RdsStack } from './rds-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: { [key: string]: pulumi.Input<string> };
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpcStack: VpcStack;
  public readonly rdsStack: RdsStack;
  public readonly dbEndpoint: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create VPC infrastructure
    this.vpcStack = new VpcStack('vpc-stack', {
      environmentSuffix: environmentSuffix,
      tags: tags,
    }, { parent: this });

    // Create RDS Stack
    this.rdsStack = new RdsStack('rds-stack', {
      environmentSuffix: environmentSuffix,
      vpcId: this.vpcStack.vpc.id,
      privateSubnetIds: pulumi.all([
        this.vpcStack.privateSubnet1.id,
        this.vpcStack.privateSubnet2.id,
      ]),
      applicationSecurityGroupId: this.vpcStack.applicationSecurityGroup.id,
      tags: tags,
    }, { parent: this });

    this.dbEndpoint = this.rdsStack.dbEndpoint;
    this.snsTopicArn = this.rdsStack.snsTopic.arn;

    this.registerOutputs({
      vpcId: this.vpcStack.vpc.id,
      dbEndpoint: this.dbEndpoint,
      dbSecurityGroupId: this.rdsStack.dbSecurityGroup.id,
      snsTopicArn: this.snsTopicArn,
    });
  }
}
```

## File: bin/tap.ts

```typescript
/**
 * Pulumi application entry point for TAP infrastructure
 */
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

const repository = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  PRNumber: prNumber,
  Team: team,
  CreatedAt: createdAt,
};

const provider = new aws.Provider('aws', {
  region: process.env.AWS_REGION || 'us-east-1',
  defaultTags: {
    tags: defaultTags,
  },
});

new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
}, { provider });
```

## Summary

This corrected implementation fixes all critical issues from MODEL_RESPONSE:

1. Added complete VPC infrastructure (VpcStack)
2. Fixed environmentSuffix parameter passing to TapStack
3. Corrected RDS parameter group with applyMethod properties
4. Updated PostgreSQL version to 14.20 (valid version)
5. Fixed TypeScript type definitions for tags
