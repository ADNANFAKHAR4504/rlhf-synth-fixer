/**
 * tap-stack.mjs
 *
 * HIPAA-Compliant Healthcare Data Pipeline
 *
 * This stack creates a secure, compliant infrastructure for processing
 * real-time patient monitoring data with RDS and Kinesis.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - Environment identifier (e.g., 'dev', 'prod')
 * @property {Object<string, string>} [tags] - Default tags to apply to resources
 */

/**
 * HIPAA-compliant healthcare data pipeline stack
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // HIPAA compliance tags
    const complianceTags = {
      ...tags,
      Compliance: 'HIPAA',
      DataClassification: 'PHI',
      Environment: environmentSuffix,
    };

    // 1. Get current AWS account ID and region for KMS policy
    const current = aws.getCallerIdentity({});
    const currentRegion = aws.getRegion({});

    // 2. KMS Key for encryption (HIPAA requirement)
    const kmsKey = new aws.kms.Key(`healthcare-kms-${environmentSuffix}`, {
      description: `KMS key for HIPAA-compliant healthcare data encryption - ${environmentSuffix}`,
      deletionWindowInDays: 10,
      enableKeyRotation: true,
      policy: pulumi.all([current, currentRegion]).apply(([caller, region]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'Enable IAM User Permissions',
              Effect: 'Allow',
              Principal: {
                AWS: `arn:aws:iam::${caller.accountId}:root`,
              },
              Action: 'kms:*',
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${region.name}.amazonaws.com`,
              },
              Action: [
                'kms:Encrypt',
                'kms:Decrypt',
                'kms:ReEncrypt*',
                'kms:GenerateDataKey*',
                'kms:CreateGrant',
                'kms:DescribeKey',
              ],
              Resource: '*',
              Condition: {
                ArnLike: {
                  'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region.name}:${caller.accountId}:log-group:*`,
                },
              },
            },
          ],
        })
      ),
      tags: complianceTags,
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`healthcare-kms-alias-${environmentSuffix}`, {
      name: `alias/healthcare-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    }, { parent: this });

    // 3. CloudWatch Log Group for audit logging
    const auditLogGroup = new aws.cloudwatch.LogGroup(`healthcare-audit-logs-${environmentSuffix}`, {
      name: `/aws/healthcare/audit-${environmentSuffix}`,
      retentionInDays: 90, // HIPAA requires 90 days minimum
      kmsKeyId: kmsKey.arn,
      tags: complianceTags,
    }, { parent: this, dependsOn: [kmsKey] });

    // 4. VPC for network isolation
    const vpc = new aws.ec2.Vpc(`healthcare-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...complianceTags,
        Name: `healthcare-vpc-${environmentSuffix}`,
      },
    }, { parent: this });

    // 5. Private subnets for RDS (multi-AZ for HIPAA availability)
    const privateSubnet1 = new aws.ec2.Subnet(`healthcare-private-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      tags: {
        ...complianceTags,
        Name: `healthcare-private-1-${environmentSuffix}`,
      },
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`healthcare-private-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-east-1b',
      tags: {
        ...complianceTags,
        Name: `healthcare-private-2-${environmentSuffix}`,
      },
    }, { parent: this });

    // 6. DB Subnet Group for RDS
    const dbSubnetGroup = new aws.rds.SubnetGroup(`healthcare-db-subnet-${environmentSuffix}`, {
      name: `healthcare-db-subnet-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: complianceTags,
    }, { parent: this });

    // 7. Security Group for RDS (restrictive access)
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`healthcare-rds-sg-${environmentSuffix}`, {
      name: `healthcare-rds-sg-${environmentSuffix}`,
      description: 'Security group for HIPAA-compliant RDS instance',
      vpcId: vpc.id,
      ingress: [{
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        cidrBlocks: ['10.0.0.0/16'], // Only allow VPC internal access
        description: 'PostgreSQL access from VPC',
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      }],
      tags: complianceTags,
    }, { parent: this });

    // 8. RDS Parameter Group with SSL enforcement
    const rdsParameterGroup = new aws.rds.ParameterGroup(`healthcare-pg-params-${environmentSuffix}`, {
      name: `healthcare-pg-params-${environmentSuffix}`,
      family: 'postgres15',
      description: 'PostgreSQL parameter group with HIPAA compliance settings',
      parameters: [
        {
          name: 'rds.force_ssl',
          value: '1', // Enforce SSL/TLS for all connections (HIPAA requirement)
        },
        {
          name: 'log_connections',
          value: '1', // Log all connection attempts for audit trail
        },
        {
          name: 'log_disconnections',
          value: '1', // Log disconnections for audit trail
        },
      ],
      tags: complianceTags,
    }, { parent: this });

    // 9. RDS PostgreSQL Instance (HIPAA-compliant)
    const rdsInstance = new aws.rds.Instance(`healthcare-rds-${environmentSuffix}`, {
      identifier: `healthcare-rds-${environmentSuffix}`,
      engine: 'postgres',
      engineVersion: '15.8',
      instanceClass: 'db.t3.small', // Cost-effective for synthetic tasks
      allocatedStorage: 20,
      storageType: 'gp3',
      storageEncrypted: true, // HIPAA requirement: encryption at rest
      kmsKeyId: kmsKey.arn,
      dbName: 'patientdata',
      username: 'hipaaadmin',
      password: pulumi.secret('TempPassword123!Change'), // Should be rotated immediately
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      parameterGroupName: rdsParameterGroup.name,
      multiAz: false, // Set to false for faster deployment in synthetic tasks
      publiclyAccessible: false, // HIPAA requirement: no public access
      skipFinalSnapshot: true, // Required for destroyability
      backupRetentionPeriod: 7, // HIPAA requires backup retention
      enabledCloudwatchLogsExports: ['postgresql'], // Enable audit logging
      deletionProtection: false, // Set to false for destroyability
      tags: complianceTags,
    }, { parent: this });

    // 10. Kinesis Data Stream for real-time patient data ingestion
    const kinesisStream = new aws.kinesis.Stream(`healthcare-stream-${environmentSuffix}`, {
      name: `healthcare-stream-${environmentSuffix}`,
      shardCount: 1, // Single shard for synthetic task
      retentionPeriod: 168, // 7 days retention (HIPAA requirement)
      encryptionType: 'KMS', // HIPAA requirement: encryption at rest
      kmsKeyId: kmsKey.id,
      streamModeDetails: {
        streamMode: 'PROVISIONED',
      },
      tags: complianceTags,
    }, { parent: this });

    // 11. IAM Role for Kinesis Data Stream processing
    const kinesisRole = new aws.iam.Role(`healthcare-kinesis-role-${environmentSuffix}`, {
      name: `healthcare-kinesis-role-${environmentSuffix}`,
      description: 'IAM role for Kinesis stream processing with least privilege',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: 'lambda.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags: complianceTags,
    }, { parent: this });

    // 12. IAM Policy for Kinesis access (least privilege)
    const kinesisPolicy = new aws.iam.RolePolicy(`healthcare-kinesis-policy-${environmentSuffix}`, {
      name: `healthcare-kinesis-policy-${environmentSuffix}`,
      role: kinesisRole.id,
      policy: pulumi.all([kinesisStream.arn, kmsKey.arn, auditLogGroup.arn]).apply(
        ([streamArn, kmsArn, logGroupArn]) => JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'kinesis:GetRecords',
                'kinesis:GetShardIterator',
                'kinesis:DescribeStream',
                'kinesis:ListStreams',
                'kinesis:PutRecord',
                'kinesis:PutRecords',
              ],
              Resource: streamArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'kms:Decrypt',
                'kms:GenerateDataKey',
              ],
              Resource: kmsArn,
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: `${logGroupArn}:*`,
            },
          ],
        })
      ),
    }, { parent: this });

    // 13. CloudWatch Alarms for monitoring (HIPAA requirement)
    const kinesisIteratorAlarm = new aws.cloudwatch.MetricAlarm(`kinesis-iterator-alarm-${environmentSuffix}`, {
      name: `kinesis-iterator-age-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'GetRecords.IteratorAgeMilliseconds',
      namespace: 'AWS/Kinesis',
      period: 300,
      statistic: 'Average',
      threshold: 60000, // Alert if iterator age exceeds 60 seconds
      alarmDescription: 'Alert when Kinesis iterator age is high',
      dimensions: {
        StreamName: kinesisStream.name,
      },
      tags: complianceTags,
    }, { parent: this });

    const rdsCpuAlarm = new aws.cloudwatch.MetricAlarm(`rds-cpu-alarm-${environmentSuffix}`, {
      name: `rds-cpu-utilization-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      alarmDescription: 'Alert when RDS CPU utilization exceeds 80%',
      dimensions: {
        DBInstanceIdentifier: rdsInstance.identifier,
      },
      tags: complianceTags,
    }, { parent: this });

    // Register outputs
    this.registerOutputs({
      vpcId: vpc.id,
      kmsKeyId: kmsKey.id,
      kinesisStreamName: kinesisStream.name,
      kinesisStreamArn: kinesisStream.arn,
      rdsEndpoint: rdsInstance.endpoint,
      rdsInstanceId: rdsInstance.id,
      auditLogGroupName: auditLogGroup.name,
      kinesisRoleArn: kinesisRole.arn,
    });

    // Export important outputs
    this.vpcId = vpc.id;
    this.kmsKeyId = kmsKey.id;
    this.kinesisStreamName = kinesisStream.name;
    this.kinesisStreamArn = kinesisStream.arn;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.rdsInstanceId = rdsInstance.id;
    this.auditLogGroupName = auditLogGroup.name;
    this.bucketName = pulumi.interpolate`healthcare-data-${environmentSuffix}`; // For compatibility with entry point
  }
}
