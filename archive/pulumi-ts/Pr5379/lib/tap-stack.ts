/**
 * Main stack orchestrating the payment infrastructure migration
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { KmsKey } from './kms';
import { S3Migration } from './s3';
import { DynamoMigration } from './dynamodb';
import { DynamoBackupPlan } from './dynamodb-backup';
import { LambdaRole } from './iam';
import { LambdaMigration } from './lambda';
import { WafWebAcl } from './waf';
import { ApiGatewayMigration } from './apigateway';
import { CloudWatchMonitoring } from './cloudwatch';
import { loadDevConfig } from './config';
import * as path from 'path';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly bucketArns: pulumi.Output<string>[];
  public readonly tableArns: pulumi.Output<string>[];
  public readonly lambdaArns: pulumi.Output<string>[];
  public readonly apiEndpoint: pulumi.Output<string>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'prod';
    const region = 'eu-west-1';
    const migrationDate = new Date().toISOString().split('T')[0];

    const baseTags = pulumi.output(args.tags || {}).apply(t => ({
      ...t,
      Environment: 'production',
      MigratedFrom: 'dev',
      MigrationDate: migrationDate,
    }));

    // Load dev configuration
    const configPath = path.join(__dirname, '../config/dev-config.json');
    let devConfig;
    try {
      devConfig = loadDevConfig(configPath);
      pulumi.log.info('Dev configuration loaded successfully');
    } catch (error) {
      pulumi.log.warn(
        'Dev configuration not found, using default configuration for demonstration'
      );
      devConfig = {
        s3Buckets: [
          { name: 'payment-documents' },
          { name: 'payment-receipts' },
          { name: 'lambda-code' },
        ],
        dynamoTables: [
          {
            name: 'transactions',
            hashKey: 'transactionId',
            attributes: [{ name: 'transactionId', type: 'S' }],
          },
          {
            name: 'customers',
            hashKey: 'customerId',
            attributes: [{ name: 'customerId', type: 'S' }],
          },
        ],
        lambdaFunctions: [
          {
            name: 'payment-processor',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'payment-processor.zip',
          },
          {
            name: 'payment-validator',
            handler: 'index.handler',
            runtime: 'nodejs18.x',
            codeS3Key: 'payment-validator.zip',
          },
        ],
      };
    }

    // Create KMS key for encryption
    const kms = new KmsKey(
      'payment-kms',
      {
        environmentSuffix,
        tags: baseTags,
      },
      { parent: this }
    );
    this.kmsKeyArn = kms.key.arn;

    // Migrate S3 buckets
    const s3Buckets: S3Migration[] = [];
    this.bucketArns = [];

    devConfig.s3Buckets.forEach(bucketConfig => {
      const bucket = new S3Migration(
        `s3-${bucketConfig.name}`,
        {
          bucketName: bucketConfig.name,
          kmsKeyId: kms.key.id,
          environmentSuffix,
          tags: baseTags,
        },
        { parent: this }
      );
      s3Buckets.push(bucket);
      this.bucketArns.push(bucket.bucket.arn);
    });

    // Migrate DynamoDB tables
    const dynamoTables: DynamoMigration[] = [];
    this.tableArns = [];

    devConfig.dynamoTables.forEach(tableConfig => {
      const table = new DynamoMigration(
        `dynamo-${tableConfig.name}`,
        {
          tableName: tableConfig.name,
          hashKey: tableConfig.hashKey,
          rangeKey: tableConfig.rangeKey,
          attributes: tableConfig.attributes,
          environmentSuffix,
          tags: baseTags,
        },
        { parent: this }
      );
      dynamoTables.push(table);
      this.tableArns.push(table.table.arn);
    });

    // Create backup plan for DynamoDB tables
    new DynamoBackupPlan(
      'dynamo-backup',
      {
        tableArns: this.tableArns,
        environmentSuffix,
        tags: baseTags,
      },
      { parent: this }
    );

    // Create Lambda execution role
    const lambdaRole = new LambdaRole(
      'lambda-role',
      {
        roleName: 'payment-lambda-role',
        region,
        environmentSuffix,
        tags: baseTags,
      },
      { parent: this }
    );

    // Upload Lambda code to S3
    const lambdaCodeBucket = s3Buckets.find(b =>
      b.bucket.bucket.apply(n => n.includes('lambda-code'))
    );

    if (lambdaCodeBucket) {
      devConfig.lambdaFunctions.forEach(funcConfig => {
        const codeKey = funcConfig.codeS3Key || `${funcConfig.name}.zip`;
        new aws.s3.BucketObject(
          `lambda-code-${funcConfig.name}`,
          {
            bucket: lambdaCodeBucket.bucket.id,
            key: codeKey,
            source: new pulumi.asset.FileAsset(
              path.join(__dirname, '../lambda-packages', codeKey)
            ),
          },
          { parent: this }
        );
      });
    }

    // Migrate Lambda functions
    const lambdaFunctions: LambdaMigration[] = [];
    this.lambdaArns = [];

    devConfig.lambdaFunctions.forEach(funcConfig => {
      const lambdaFunc = new LambdaMigration(
        `lambda-${funcConfig.name}`,
        {
          functionName: funcConfig.name,
          handler: funcConfig.handler,
          codeS3Bucket: lambdaCodeBucket
            ? lambdaCodeBucket.bucket.bucket
            : `lambda-code-${environmentSuffix}`,
          codeS3Key: funcConfig.codeS3Key || `${funcConfig.name}.zip`,
          roleArn: lambdaRole.role.arn,
          environment: funcConfig.environment,
          environmentSuffix,
          tags: baseTags,
        },
        { parent: this }
      );
      lambdaFunctions.push(lambdaFunc);
      this.lambdaArns.push(lambdaFunc.function.arn);
    });

    // Create WAF Web ACL
    const waf = new WafWebAcl(
      'payment-waf',
      {
        environmentSuffix,
        tags: baseTags,
      },
      { parent: this }
    );

    // Create API Gateway
    const api = new ApiGatewayMigration(
      'payment-api',
      {
        apiName: 'payment-api',
        lambdaFunction: lambdaFunctions[0].function,
        wafWebAclArn: waf.webAcl.arn,
        environmentSuffix,
        tags: baseTags,
      },
      { parent: this }
    );
    this.apiEndpoint = api.stage.invokeUrl;

    // Create CloudWatch monitoring
    const monitoring = new CloudWatchMonitoring(
      'payment-monitoring',
      {
        lambdaFunctionNames: lambdaFunctions.map(f => f.function.name),
        dynamoTableNames: dynamoTables.map(t => t.table.name),
        apiGatewayName: api.api.name,
        apiGatewayStageName: api.stage.stageName,
        environmentSuffix,
        tags: baseTags,
      },
      { parent: this }
    );
    this.dashboardName = monitoring.dashboard.dashboardName;

    // Register outputs
    this.registerOutputs({
      kmsKeyArn: this.kmsKeyArn,
      bucketArns: this.bucketArns,
      tableArns: this.tableArns,
      lambdaArns: this.lambdaArns,
      apiEndpoint: this.apiEndpoint,
      dashboardName: this.dashboardName,
      migrationSummary: pulumi.output({
        region,
        environment: 'production',
        migratedFrom: 'dev',
        migrationDate,
        resourceCounts: {
          s3Buckets: devConfig.s3Buckets.length,
          dynamoTables: devConfig.dynamoTables.length,
          lambdaFunctions: devConfig.lambdaFunctions.length,
        },
      }),
    });
  }
}
