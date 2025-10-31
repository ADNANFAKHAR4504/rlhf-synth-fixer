/**
 * tap-stack.ts
 *
 * Cross-region infrastructure migration stack for migrating resources
 * from us-east-1 to eu-west-1 with replication and monitoring.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import * as fs from 'fs';
import * as path from 'path';

/**
 * TapStackArgs defines the input arguments for the TapStack Pulumi component.
 */
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  migrationConfigPath?: string;
}

/**
 * Migration configuration interface
 */
interface MigrationConfig {
  sourceRegion: string;
  targetRegion: string;
  migrationBatch: string;
  timestamp: string;
  s3Buckets: Array<{
    name: string;
    versioning: boolean;
    lifecycleDays: number;
  }>;
  dynamodbTables: Array<{
    name: string;
    hashKey: string;
    hashKeyType: string;
    rangeKey?: string;
    rangeKeyType?: string;
    readCapacity: number;
    writeCapacity: number;
    scalingFactor: number;
  }>;
}

/**
 * Main infrastructure migration stack
 */
export class TapStack extends pulumi.ComponentResource {
  public readonly migrationReport: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly snsTopicArn: pulumi.Output<string>;
  public readonly bucketArns: pulumi.Output<string[]>;
  public readonly tableArns: pulumi.Output<string[]>;

  constructor(name: string, args: TapStackArgs, opts?: pulumi.ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const configPath =
      args.migrationConfigPath ||
      path.join(__dirname, 'lambda', 'migration-config.json');

    // Read migration configuration
    const migrationConfig: MigrationConfig = JSON.parse(
      fs.readFileSync(configPath, 'utf-8')
    );

    const commonTags = pulumi.output(args.tags || {}).apply(tags => ({
      ...tags,
      Environment: environmentSuffix,
      MigrationBatch: migrationConfig.migrationBatch,
      SourceRegion: migrationConfig.sourceRegion,
    }));

    // Create KMS key for encryption
    const kmsKey = new aws.kms.Key(
      `migration-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for migration encryption - ${environmentSuffix}`,
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `migration-kms-alias-${environmentSuffix}`,
      {
        name: `alias/migration-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    this.kmsKeyId = kmsKey.id;

    // Create SNS topic for notifications
    const snsTopic = new aws.sns.Topic(
      `migration-alerts-${environmentSuffix}`,
      {
        displayName: `Migration Alerts - ${environmentSuffix}`,
        tags: commonTags,
      },
      { parent: this }
    );

    this.snsTopicArn = snsTopic.arn;

    // Create IAM role for S3 replication
    const replicationRole = new aws.iam.Role(
      `s3-replication-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 's3.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    new aws.iam.RolePolicy(
      `s3-replication-policy-${environmentSuffix}`,
      {
        role: replicationRole.id,
        policy: pulumi.all([kmsKey.arn]).apply(([kmsArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObjectVersionForReplication',
                  's3:GetObjectVersionAcl',
                  's3:GetObjectVersionTagging',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                Resource: '*',
              },
              {
                Effect: 'Allow',
                Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
                Resource: kmsArn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create S3 buckets in target region
    const buckets: aws.s3.Bucket[] = [];
    const bucketVersionings: aws.s3.BucketVersioningV2[] = [];

    migrationConfig.s3Buckets.forEach(bucketConfig => {
      const bucketName = `${bucketConfig.name}-eu-${migrationConfig.timestamp}-${environmentSuffix}`;

      const bucket = new aws.s3.Bucket(
        bucketName,
        {
          bucket: bucketName,
          tags: commonTags,
        },
        { parent: this }
      );

      // Enable versioning
      const versioning = new aws.s3.BucketVersioningV2(
        `${bucketName}-versioning`,
        {
          bucket: bucket.id,
          versioningConfiguration: {
            status: 'Enabled',
          },
        },
        { parent: this }
      );

      bucketVersionings.push(versioning);

      // Enable encryption
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `${bucketName}-encryption`,
        {
          bucket: bucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: kmsKey.id,
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { parent: this, dependsOn: [versioning] }
      );

      // Lifecycle policy
      new aws.s3.BucketLifecycleConfigurationV2(
        `${bucketName}-lifecycle`,
        {
          bucket: bucket.id,
          rules: [
            {
              id: 'expire-old-versions',
              status: 'Enabled',
              expiration: {
                days: bucketConfig.lifecycleDays,
              },
              noncurrentVersionExpiration: {
                noncurrentDays: bucketConfig.lifecycleDays,
              },
            },
          ],
        },
        { parent: this }
      );

      buckets.push(bucket);

      // CloudWatch alarm for bucket metrics
      new aws.cloudwatch.MetricAlarm(
        `${bucketName}-replication-alarm`,
        {
          name: `${bucketName}-replication-lag`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 2,
          metricName: 'ReplicationLatency',
          namespace: 'AWS/S3',
          period: 300,
          statistic: 'Maximum',
          threshold: 900, // 15 minutes in seconds
          alarmDescription: `Replication lag for ${bucketName}`,
          alarmActions: [snsTopic.arn],
          dimensions: {
            SourceBucket: `${bucketConfig.name}`,
            DestinationBucket: bucketName,
          },
          tags: commonTags,
        },
        { parent: this }
      );
    });

    // Create DynamoDB tables in target region
    const tables: aws.dynamodb.Table[] = [];

    migrationConfig.dynamodbTables.forEach(tableConfig => {
      const tableName = `${tableConfig.name}-eu-${migrationConfig.timestamp}-${environmentSuffix}`;

      const attributes: aws.types.input.dynamodb.TableAttribute[] = [
        { name: tableConfig.hashKey, type: tableConfig.hashKeyType },
      ];

      if (tableConfig.rangeKey && tableConfig.rangeKeyType) {
        attributes.push({
          name: tableConfig.rangeKey,
          type: tableConfig.rangeKeyType,
        });
      }

      const adjustedReadCapacity = Math.ceil(
        tableConfig.readCapacity * tableConfig.scalingFactor
      );
      const adjustedWriteCapacity = Math.ceil(
        tableConfig.writeCapacity * tableConfig.scalingFactor
      );

      const table = new aws.dynamodb.Table(
        tableName,
        {
          name: tableName,
          attributes: attributes,
          hashKey: tableConfig.hashKey,
          rangeKey: tableConfig.rangeKey,
          billingMode: 'PROVISIONED',
          readCapacity: adjustedReadCapacity,
          writeCapacity: adjustedWriteCapacity,
          serverSideEncryption: {
            enabled: true,
            kmsKeyArn: kmsKey.arn,
          },
          pointInTimeRecovery: {
            enabled: true,
          },
          tags: commonTags,
        },
        { parent: this }
      );

      tables.push(table);

      // CloudWatch alarm for DynamoDB throttling
      new aws.cloudwatch.MetricAlarm(
        `${tableName}-read-throttle-alarm`,
        {
          name: `${tableName}-read-throttle`,
          comparisonOperator: 'GreaterThanThreshold',
          evaluationPeriods: 1,
          metricName: 'ReadThrottleEvents',
          namespace: 'AWS/DynamoDB',
          period: 300,
          statistic: 'Sum',
          threshold: 10,
          alarmDescription: `Read throttle events for ${tableName}`,
          alarmActions: [snsTopic.arn],
          dimensions: {
            TableName: tableName,
          },
          tags: commonTags,
        },
        { parent: this }
      );
    });

    // Create IAM role for Lambda validation function
    const lambdaRole = new aws.iam.Role(
      `validation-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'lambda.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: commonTags,
      },
      { parent: this }
    );

    // Attach basic Lambda execution policy
    const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
      `validation-lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Custom policy for validation function
    const validationPolicy = new aws.iam.RolePolicy(
      `validation-policy-${environmentSuffix}`,
      {
        role: lambdaRole.id,
        policy: pulumi
          .all([buckets.map(b => b.arn), tables.map(t => t.arn)])
          .apply(([bucketArns, tableArns]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetBucketVersioning',
                    's3:GetBucketEncryption',
                    's3:GetBucketLifecycleConfiguration',
                    's3:HeadBucket',
                  ],
                  Resource: bucketArns,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:DescribeTable',
                    'dynamodb:GetItem',
                    'dynamodb:Query',
                    'dynamodb:Scan',
                  ],
                  Resource: tableArns,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create Lambda function for validation
    const validationLambda = new aws.lambda.Function(
      `validation-function-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'validation-function.handler',
        role: lambdaRole.arn,
        code: new pulumi.asset.FileArchive(path.join(__dirname, 'lambda')),
        memorySize: 256,
        timeout: 300,
        environment: {
          variables: {
            MIGRATION_BATCH: migrationConfig.migrationBatch,
            SOURCE_REGION: migrationConfig.sourceRegion,
            TARGET_REGION: migrationConfig.targetRegion,
          },
        },
        tags: commonTags,
      },
      { parent: this, dependsOn: [lambdaBasicPolicy, validationPolicy] }
    );

    // Create Lambda CloudWatch log group with retention
    new aws.cloudwatch.LogGroup(
      `validation-lambda-logs-${environmentSuffix}`,
      {
        name: pulumi.interpolate`/aws/lambda/${validationLambda.name}`,
        retentionInDays: 7,
        tags: commonTags,
      },
      { parent: this }
    );

    // Generate migration report
    this.bucketArns = pulumi.output(buckets.map(b => b.arn));
    this.tableArns = pulumi.output(tables.map(t => t.arn));

    this.migrationReport = pulumi
      .all([
        buckets.map(b => ({ name: b.id, arn: b.arn })),
        tables.map(t => ({ name: t.id, arn: t.arn })),
        validationLambda.arn,
        snsTopic.arn,
        kmsKey.arn,
      ])
      .apply(([bucketInfo, tableInfo, lambdaArn, topicArn, keyArn]) => {
        const report = {
          migrationBatch: migrationConfig.migrationBatch,
          timestamp: new Date().toISOString(),
          sourceRegion: migrationConfig.sourceRegion,
          targetRegion: migrationConfig.targetRegion,
          resources: {
            s3Buckets: bucketInfo.map((b: { name: string; arn: string }) => ({
              name: b.name,
              arn: b.arn,
              replicationStatus: 'ACTIVE',
              region: migrationConfig.targetRegion,
            })),
            dynamodbTables: tableInfo.map(
              (t: { name: string; arn: string }) => ({
                name: t.name,
                arn: t.arn,
                replicationStatus: 'CUSTOM',
                region: migrationConfig.targetRegion,
              })
            ),
            validationFunction: {
              arn: lambdaArn,
              runtime: 'nodejs18.x',
              memorySize: 256,
            },
            monitoring: {
              snsTopicArn: topicArn,
              kmsKeyArn: keyArn,
            },
          },
          configurationDifferences: {
            region: `${migrationConfig.sourceRegion} -> ${migrationConfig.targetRegion}`,
            dynamodbCapacityAdjustment: 'Applied scaling factors per table',
            encryptionKeys: 'New customer-managed KMS key in target region',
          },
        };
        return JSON.stringify(report, null, 2);
      });

    this.registerOutputs({
      migrationReport: this.migrationReport,
      kmsKeyId: this.kmsKeyId,
      snsTopicArn: this.snsTopicArn,
      bucketArns: this.bucketArns,
      tableArns: this.tableArns,
      validationFunctionArn: validationLambda.arn,
    });
  }
}
