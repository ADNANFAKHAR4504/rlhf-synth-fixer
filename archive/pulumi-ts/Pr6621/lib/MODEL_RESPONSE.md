# Multi-Region Disaster Recovery Infrastructure - MODEL RESPONSE

This implementation creates a complete multi-region disaster recovery infrastructure for a payment processing system using Pulumi with TypeScript.

## Architecture Overview

- Primary Region: us-east-1
- Secondary Region: us-east-2
- DynamoDB Global Tables with Point-in-Time Recovery
- Lambda functions deployed in both regions
- S3 buckets with Cross-Region Replication (RTC enabled)
- API Gateway REST APIs in both regions
- Route53 health checks and failover routing
- CloudWatch alarms and SNS notifications
- Centralized logging with CloudWatch

## File: lib/tap-stack.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ComponentResource, ComponentResourceOptions } from '@pulumi/pulumi';

interface TapStackProps {
  tags?: Record<string, string>;
}

export class TapStack extends ComponentResource {
  public readonly primaryApiEndpoint: pulumi.Output<string>;
  public readonly secondaryApiEndpoint: pulumi.Output<string>;
  public readonly failoverDnsName: pulumi.Output<string>;
  public readonly healthCheckId: pulumi.Output<string>;
  public readonly alarmArns: pulumi.Output<string[]>;

  constructor(name: string, props: TapStackProps, opts?: ComponentResourceOptions) {
    super('custom:infrastructure:TapStack', name, {}, opts);

    const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-east-2';

    // Create AWS providers for both regions
    const primaryProvider = new aws.Provider('primary-provider', {
      region: primaryRegion,
      defaultTags: {
        tags: {
          ...props.tags,
          Environment: environmentSuffix,
          Region: primaryRegion,
          'DR-Role': 'primary',
        },
      },
    }, { parent: this });

    const secondaryProvider = new aws.Provider('secondary-provider', {
      region: secondaryRegion,
      defaultTags: {
        tags: {
          ...props.tags,
          Environment: environmentSuffix,
          Region: secondaryRegion,
          'DR-Role': 'secondary',
        },
      },
    }, { parent: this });

    // IAM Role for Lambda execution
    const lambdaRole = new aws.iam.Role('payment-lambda-role', {
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
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      ],
    }, { parent: this, provider: primaryProvider });

    // IAM Policy for DynamoDB and S3 access
    const lambdaPolicy = new aws.iam.RolePolicy('payment-lambda-policy', {
      role: lambdaRole.id,
      policy: pulumi.all([]).apply(() => JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogGroup',
              'logs:CreateLogStream',
              'logs:PutLogEvents',
            ],
            Resource: '*',
          },
        ],
      })),
    }, { parent: this, provider: primaryProvider });

    // DynamoDB Global Table
    const dynamoTable = new aws.dynamodb.Table(`payments-table-${environmentSuffix}`, {
      name: `payments-table-${primaryRegion}-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'paymentId',
      attributes: [
        { name: 'paymentId', type: 'S' },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      streamEnabled: true,
      streamViewType: 'NEW_AND_OLD_IMAGES',
      replicas: [
        {
          regionName: secondaryRegion,
          pointInTimeRecovery: true,
        },
      ],
      tags: {
        ...props.tags,
        Name: `payments-table-${primaryRegion}-${environmentSuffix}`,
      },
    }, { parent: this, provider: primaryProvider });

    // S3 Buckets for both regions
    const primaryBucket = new aws.s3.BucketV2(`payment-docs-${primaryRegion}-${environmentSuffix}`, {
      bucket: `payment-docs-${primaryRegion}-${environmentSuffix}`,
      tags: {
        ...props.tags,
        Region: primaryRegion,
        'DR-Role': 'primary',
      },
    }, { parent: this, provider: primaryProvider });

    const secondaryBucket = new aws.s3.BucketV2(`payment-docs-${secondaryRegion}-${environmentSuffix}`, {
      bucket: `payment-docs-${secondaryRegion}-${environmentSuffix}`,
      tags: {
        ...props.tags,
        Region: secondaryRegion,
        'DR-Role': 'secondary',
      },
    }, { parent: this, provider: secondaryProvider });

    // Enable versioning on primary bucket
    const primaryBucketVersioning = new aws.s3.BucketVersioningV2('primary-bucket-versioning', {
      bucket: primaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this, provider: primaryProvider });

    // Enable versioning on secondary bucket
    const secondaryBucketVersioning = new aws.s3.BucketVersioningV2('secondary-bucket-versioning', {
      bucket: secondaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    }, { parent: this, provider: secondaryProvider });

    // IAM Role for S3 Replication
    const replicationRole = new aws.iam.Role('s3-replication-role', {
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
    }, { parent: this, provider: primaryProvider });

    const replicationPolicy = new aws.iam.RolePolicy('s3-replication-policy', {
      role: replicationRole.id,
      policy: pulumi.all([primaryBucket.arn, secondaryBucket.arn]).apply(([srcArn, destArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                's3:GetReplicationConfiguration',
                's3:ListBucket',
              ],
              Resource: srcArn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
              ],
              Resource: `${srcArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
              ],
              Resource: `${destArn}/*`,
            },
          ],
        })
      ),
    }, { parent: this, provider: primaryProvider });

    // S3 Replication Configuration with RTC
    const replicationConfig = new aws.s3.BucketReplicationConfig('bucket-replication', {
      bucket: primaryBucket.id,
      role: replicationRole.arn,
      rules: [
        {
          id: 'payment-docs-replication',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          filter: {},
          destination: {
            bucket: secondaryBucket.arn,
            replicationTime: {
              status: 'Enabled',
              time: {
                minutes: 15,
              },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: {
                minutes: 15,
              },
            },
          },
        },
      ],
    }, {
      parent: this,
      provider: primaryProvider,
      dependsOn: [primaryBucketVersioning, secondaryBucketVersioning, replicationPolicy],
    });

    // SNS Topics for alerting
    const primarySnsTopic = new aws.sns.Topic(`failover-alerts-${primaryRegion}-${environmentSuffix}`, {
      name: `failover-alerts-${primaryRegion}-${environmentSuffix}`,
      tags: {
        ...props.tags,
        Region: primaryRegion,
      },
    }, { parent: this, provider: primaryProvider });

    const secondarySnsTopic = new aws.sns.Topic(`failover-alerts-${secondaryRegion}-${environmentSuffix}`, {
      name: `failover-alerts-${secondaryRegion}-${environmentSuffix}`,
      tags: {
        ...props.tags,
        Region: secondaryRegion,
      },
    }, { parent: this, provider: secondaryProvider });

    // Lambda Function Code
    const lambdaCode = `
const { DynamoDBClient, PutItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
const s3 = new S3Client({ region: process.env.AWS_REGION });

exports.handler = async (event) => {
  console.log('Processing payment request:', JSON.stringify(event, null, 2));

  const paymentId = event.paymentId || \`payment-\${Date.now()}\`;
  const amount = event.amount || 0;
  const region = process.env.AWS_REGION;
  const tableName = process.env.DYNAMODB_TABLE;
  const bucketName = process.env.S3_BUCKET;

  try {
    // Store payment in DynamoDB
    await dynamodb.send(new PutItemCommand({
      TableName: tableName,
      Item: {
        paymentId: { S: paymentId },
        amount: { N: amount.toString() },
        timestamp: { S: new Date().toISOString() },
        region: { S: region },
        status: { S: 'processed' },
      },
    }));

    // Store payment receipt in S3
    await s3.send(new PutObjectCommand({
      Bucket: bucketName,
      Key: \`receipts/\${paymentId}.json\`,
      Body: JSON.stringify({
        paymentId,
        amount,
        timestamp: new Date().toISOString(),
        region,
        status: 'processed',
      }),
      ContentType: 'application/json',
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Payment processed successfully',
        paymentId,
        amount,
        region,
      }),
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Error processing payment',
        error: error.message,
        region,
      }),
    };
  }
};
`;

    // Lambda Functions in Primary Region
    const primaryLambda = new aws.lambda.Function(`payment-processor-${primaryRegion}-${environmentSuffix}`, {
      name: `payment-processor-${primaryRegion}-${environmentSuffix}`,
      runtime: 'nodejs20.x',
      role: lambdaRole.arn,
      handler: 'index.handler',
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(lambdaCode),
      }),
      environment: {
        variables: {
          DYNAMODB_TABLE: dynamoTable.name,
          S3_BUCKET: primaryBucket.id,
          AWS_REGION: primaryRegion,
        },
      },
      timeout: 30,
      memorySize: 512,
      tags: {
        ...props.tags,
        Region: primaryRegion,
        'DR-Role': 'primary',
      },
    }, { parent: this, provider: primaryProvider, dependsOn: [dynamoTable, primaryBucket] });

    // Lambda Functions in Secondary Region
    const secondaryLambda = new aws.lambda.Function(`payment-processor-${secondaryRegion}-${environmentSuffix}`, {
      name: `payment-processor-${secondaryRegion}-${environmentSuffix}`,
      runtime: 'nodejs20.x',
      role: lambdaRole.arn,
      handler: 'index.handler',
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(lambdaCode),
      }),
      environment: {
        variables: {
          DYNAMODB_TABLE: dynamoTable.name,
          S3_BUCKET: secondaryBucket.id,
          AWS_REGION: secondaryRegion,
        },
      },
      timeout: 30,
      memorySize: 512,
      tags: {
        ...props.tags,
        Region: secondaryRegion,
        'DR-Role': 'secondary',
      },
    }, { parent: this, provider: secondaryProvider, dependsOn: [dynamoTable, secondaryBucket] });

    // CloudWatch Log Groups
    const primaryLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/payment-processor-${primaryRegion}-${environmentSuffix}`, {
      name: `/aws/lambda/payment-processor-${primaryRegion}-${environmentSuffix}`,
      retentionInDays: 7,
    }, { parent: this, provider: primaryProvider });

    const secondaryLogGroup = new aws.cloudwatch.LogGroup(`/aws/lambda/payment-processor-${secondaryRegion}-${environmentSuffix}`, {
      name: `/aws/lambda/payment-processor-${secondaryRegion}-${environmentSuffix}`,
      retentionInDays: 7,
    }, { parent: this, provider: secondaryProvider });

    // API Gateway in Primary Region
    const primaryApi = new aws.apigateway.RestApi(`payment-api-${primaryRegion}-${environmentSuffix}`, {
      name: `payment-api-${primaryRegion}-${environmentSuffix}`,
      description: 'Payment Processing API - Primary Region',
      endpointConfiguration: {
        types: 'REGIONAL',
      },
      tags: {
        ...props.tags,
        Region: primaryRegion,
        'DR-Role': 'primary',
      },
    }, { parent: this, provider: primaryProvider });

    const primaryApiResource = new aws.apigateway.Resource('primary-payment-resource', {
      restApi: primaryApi.id,
      parentId: primaryApi.rootResourceId,
      pathPart: 'payment',
    }, { parent: this, provider: primaryProvider });

    const primaryApiMethod = new aws.apigateway.Method('primary-payment-method', {
      restApi: primaryApi.id,
      resourceId: primaryApiResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    }, { parent: this, provider: primaryProvider });

    const primaryApiIntegration = new aws.apigateway.Integration('primary-payment-integration', {
      restApi: primaryApi.id,
      resourceId: primaryApiResource.id,
      httpMethod: primaryApiMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: primaryLambda.invokeArn,
    }, { parent: this, provider: primaryProvider });

    const primaryLambdaPermission = new aws.lambda.Permission('primary-api-lambda-permission', {
      action: 'lambda:InvokeFunction',
      function: primaryLambda.name,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${primaryApi.executionArn}/*/*`,
    }, { parent: this, provider: primaryProvider });

    const primaryApiDeployment = new aws.apigateway.Deployment('primary-api-deployment', {
      restApi: primaryApi.id,
      stageName: 'prod',
    }, {
      parent: this,
      provider: primaryProvider,
      dependsOn: [primaryApiIntegration],
    });

    // API Gateway in Secondary Region
    const secondaryApi = new aws.apigateway.RestApi(`payment-api-${secondaryRegion}-${environmentSuffix}`, {
      name: `payment-api-${secondaryRegion}-${environmentSuffix}`,
      description: 'Payment Processing API - Secondary Region',
      endpointConfiguration: {
        types: 'REGIONAL',
      },
      tags: {
        ...props.tags,
        Region: secondaryRegion,
        'DR-Role': 'secondary',
      },
    }, { parent: this, provider: secondaryProvider });

    const secondaryApiResource = new aws.apigateway.Resource('secondary-payment-resource', {
      restApi: secondaryApi.id,
      parentId: secondaryApi.rootResourceId,
      pathPart: 'payment',
    }, { parent: this, provider: secondaryProvider });

    const secondaryApiMethod = new aws.apigateway.Method('secondary-payment-method', {
      restApi: secondaryApi.id,
      resourceId: secondaryApiResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    }, { parent: this, provider: secondaryProvider });

    const secondaryApiIntegration = new aws.apigateway.Integration('secondary-payment-integration', {
      restApi: secondaryApi.id,
      resourceId: secondaryApiResource.id,
      httpMethod: secondaryApiMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: secondaryLambda.invokeArn,
    }, { parent: this, provider: secondaryProvider });

    const secondaryLambdaPermission = new aws.lambda.Permission('secondary-api-lambda-permission', {
      action: 'lambda:InvokeFunction',
      function: secondaryLambda.name,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${secondaryApi.executionArn}/*/*`,
    }, { parent: this, provider: secondaryProvider });

    const secondaryApiDeployment = new aws.apigateway.Deployment('secondary-api-deployment', {
      restApi: secondaryApi.id,
      stageName: 'prod',
    }, {
      parent: this,
      provider: secondaryProvider,
      dependsOn: [secondaryApiIntegration],
    });

    // Route53 Health Check for Primary API
    const healthCheck = new aws.route53.HealthCheck('primary-api-health-check', {
      type: 'HTTPS',
      resourcePath: '/prod/payment',
      fqdn: pulumi.interpolate`${primaryApi.id}.execute-api.${primaryRegion}.amazonaws.com`,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
      measureLatency: true,
      tags: {
        ...props.tags,
        Name: `primary-api-health-check-${environmentSuffix}`,
      },
    }, { parent: this });

    // Route53 Hosted Zone (using existing or creating new)
    const hostedZone = new aws.route53.Zone('payment-zone', {
      name: `payment-${environmentSuffix}.example.com`,
      tags: props.tags,
    }, { parent: this });

    // Route53 Failover Records
    const primaryRecord = new aws.route53.Record('primary-failover-record', {
      zoneId: hostedZone.zoneId,
      name: `api.payment-${environmentSuffix}.example.com`,
      type: 'CNAME',
      ttl: 60,
      records: [pulumi.interpolate`${primaryApi.id}.execute-api.${primaryRegion}.amazonaws.com`],
      setIdentifier: 'primary',
      failoverRoutingPolicies: [{
        type: 'PRIMARY',
      }],
      healthCheckId: healthCheck.id,
    }, { parent: this });

    const secondaryRecord = new aws.route53.Record('secondary-failover-record', {
      zoneId: hostedZone.zoneId,
      name: `api.payment-${environmentSuffix}.example.com`,
      type: 'CNAME',
      ttl: 60,
      records: [pulumi.interpolate`${secondaryApi.id}.execute-api.${secondaryRegion}.amazonaws.com`],
      setIdentifier: 'secondary',
      failoverRoutingPolicies: [{
        type: 'SECONDARY',
      }],
    }, { parent: this });

    // CloudWatch Alarms - DynamoDB
    const dynamoAlarm = new aws.cloudwatch.MetricAlarm(`dynamo-health-alarm-${environmentSuffix}`, {
      name: `dynamo-health-alarm-${primaryRegion}-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'UserErrors',
      namespace: 'AWS/DynamoDB',
      period: 300,
      statistic: 'Sum',
      threshold: 10,
      alarmDescription: 'Alarm when DynamoDB has too many user errors',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        TableName: dynamoTable.name,
      },
      tags: {
        ...props.tags,
        Region: primaryRegion,
      },
    }, { parent: this, provider: primaryProvider });

    // CloudWatch Alarms - Lambda Errors (Primary)
    const primaryLambdaAlarm = new aws.cloudwatch.MetricAlarm(`lambda-errors-primary-${environmentSuffix}`, {
      name: `lambda-errors-${primaryRegion}-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 5,
      alarmDescription: 'Alarm when Lambda has too many errors',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        FunctionName: primaryLambda.name,
      },
      tags: {
        ...props.tags,
        Region: primaryRegion,
      },
    }, { parent: this, provider: primaryProvider });

    // CloudWatch Alarms - Lambda Errors (Secondary)
    const secondaryLambdaAlarm = new aws.cloudwatch.MetricAlarm(`lambda-errors-secondary-${environmentSuffix}`, {
      name: `lambda-errors-${secondaryRegion}-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'Errors',
      namespace: 'AWS/Lambda',
      period: 300,
      statistic: 'Sum',
      threshold: 5,
      alarmDescription: 'Alarm when Lambda has too many errors',
      alarmActions: [secondarySnsTopic.arn],
      dimensions: {
        FunctionName: secondaryLambda.name,
      },
      tags: {
        ...props.tags,
        Region: secondaryRegion,
      },
    }, { parent: this, provider: secondaryProvider });

    // CloudWatch Alarms - S3 Replication
    const replicationAlarm = new aws.cloudwatch.MetricAlarm(`s3-replication-lag-${environmentSuffix}`, {
      name: `s3-replication-lag-${primaryRegion}-${environmentSuffix}`,
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'ReplicationLatency',
      namespace: 'AWS/S3',
      period: 300,
      statistic: 'Maximum',
      threshold: 900, // 15 minutes in seconds
      alarmDescription: 'Alarm when S3 replication latency exceeds threshold',
      alarmActions: [primarySnsTopic.arn],
      dimensions: {
        SourceBucket: primaryBucket.id,
        DestinationBucket: secondaryBucket.id,
        RuleId: 'payment-docs-replication',
      },
      tags: {
        ...props.tags,
        Region: primaryRegion,
      },
    }, { parent: this, provider: primaryProvider });

    // Cross-region IAM Role for DR operations
    const drRole = new aws.iam.Role('dr-operations-role', {
      name: `dr-operations-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              AWS: [
                pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`,
              ],
            },
            Action: 'sts:AssumeRole',
            Condition: {
              StringEquals: {
                'sts:ExternalId': `dr-${environmentSuffix}`,
              },
            },
          },
        ],
      }),
    }, { parent: this, provider: primaryProvider });

    const drPolicy = new aws.iam.RolePolicy('dr-operations-policy', {
      role: drRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'lambda:InvokeFunction',
              'dynamodb:*',
              's3:*',
              'apigateway:*',
              'route53:*',
              'cloudwatch:*',
              'sns:*',
              'logs:*',
            ],
            Resource: '*',
          },
        ],
      }),
    }, { parent: this, provider: primaryProvider });

    // Outputs
    this.primaryApiEndpoint = pulumi.interpolate`https://${primaryApi.id}.execute-api.${primaryRegion}.amazonaws.com/prod`;
    this.secondaryApiEndpoint = pulumi.interpolate`https://${secondaryApi.id}.execute-api.${secondaryRegion}.amazonaws.com/prod`;
    this.failoverDnsName = pulumi.interpolate`api.payment-${environmentSuffix}.example.com`;
    this.healthCheckId = healthCheck.id;
    this.alarmArns = pulumi.all([
      dynamoAlarm.arn,
      primaryLambdaAlarm.arn,
      secondaryLambdaAlarm.arn,
      replicationAlarm.arn,
    ]).apply(arns => arns);

    this.registerOutputs({
      primaryApiEndpoint: this.primaryApiEndpoint,
      secondaryApiEndpoint: this.secondaryApiEndpoint,
      failoverDnsName: this.failoverDnsName,
      healthCheckId: this.healthCheckId,
      alarmArns: this.alarmArns,
    });
  }
}
```

## Implementation Details

### Key Features Implemented

1. **DynamoDB Global Tables**: Configured with point-in-time recovery and automatic replication between us-east-1 and us-east-2
2. **Lambda Functions**: Identical payment processing functions deployed in both regions with region-specific environment variables
3. **S3 Cross-Region Replication**: Enabled with RTC for sub-minute replication (15-minute RTC threshold)
4. **API Gateway**: REST APIs deployed in both regions with Lambda proxy integration
5. **Route53 Health Checks**: Monitoring primary region API Gateway endpoint
6. **Route53 Failover Routing**: PRIMARY and SECONDARY records for automatic DNS failover
7. **CloudWatch Alarms**: Monitoring DynamoDB health, Lambda errors, and S3 replication lag
8. **SNS Topics**: Configured in both regions for failover alerting
9. **IAM Roles**: Cross-region assume role policies for DR operations
10. **CloudWatch Logs**: Log groups created for both Lambda functions
11. **Resource Naming**: Consistent naming convention using {service}-{region}-{environment}
12. **Tagging**: All resources tagged with Environment, Region, and DR-Role

### Resource Naming Convention

All resources follow the pattern: `{service}-{region}-{environmentSuffix}`

Examples:
- `payment-processor-us-east-1-dev`
- `payment-docs-us-east-2-dev`
- `failover-alerts-us-east-1-dev`

### DR Characteristics

- **RPO**: Under 1 minute (DynamoDB global tables provide near-real-time replication)
- **RTO**: Under 5 minutes (Route53 health check interval 30s, failure threshold 3, DNS TTL 60s)
- **Automatic Failover**: Route53 health checks trigger DNS failover automatically
- **Data Integrity**: DynamoDB global tables and S3 cross-region replication ensure data consistency

### Outputs

The stack exports the following outputs:
- `primaryApiEndpoint`: Primary region API Gateway endpoint
- `secondaryApiEndpoint`: Secondary region API Gateway endpoint
- `failoverDnsName`: Route53 failover DNS name
- `healthCheckId`: Route53 health check ID
- `alarmArns`: Array of CloudWatch alarm ARNs

## Deployment Instructions

1. Set environment variables:
   ```bash
   export ENVIRONMENT_SUFFIX=dev
   export AWS_REGION=us-east-1
   ```

2. Deploy the stack:
   ```bash
   pulumi up --yes
   ```

3. Test the primary endpoint:
   ```bash
   curl -X POST https://<primary-api-id>.execute-api.us-east-1.amazonaws.com/prod/payment \
     -H "Content-Type: application/json" \
     -d '{"paymentId":"test-123","amount":100}'
   ```

4. Monitor health checks and alarms in CloudWatch console

## Cleanup

To destroy all resources:
```bash
pulumi destroy --yes
```
