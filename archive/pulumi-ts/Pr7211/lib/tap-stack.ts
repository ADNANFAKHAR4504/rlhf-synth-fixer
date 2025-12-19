/* eslint-disable @typescript-eslint/no-unused-vars */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  createHostedZone?: boolean;
  primaryRegion?: string;
  secondaryRegion?: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly primaryApiEndpoint: pulumi.Output<string>;
  public readonly secondaryApiEndpoint: pulumi.Output<string>;
  public readonly failoverDnsName: pulumi.Output<string>;
  public readonly primaryHealthCheckUrl: pulumi.Output<string>;
  public readonly secondaryHealthCheckUrl: pulumi.Output<string>;
  public readonly healthCheckPrimaryId: pulumi.Output<string>;
  public readonly healthCheckSecondaryId: pulumi.Output<string>;
  public readonly replicationLagAlarmArn: pulumi.Output<string>;
  public readonly dynamoDbTableName: pulumi.Output<string>;
  public readonly s3BucketPrimaryName: pulumi.Output<string>;
  public readonly s3BucketSecondaryName: pulumi.Output<string>;
  public readonly dlqPrimaryUrl: pulumi.Output<string>;
  public readonly dlqSecondaryUrl: pulumi.Output<string>;
  public readonly hostedZoneId: pulumi.Output<string>;
  public readonly hostedZoneNameServers: pulumi.Output<string[]>;

  // Legacy outputs for backward compatibility
  public readonly vpcId?: pulumi.Output<string>;
  public readonly rdsEndpoint?: pulumi.Output<string>;
  public readonly bucketName?: pulumi.Output<string>;
  public readonly lambdaArn?: pulumi.Output<string>;
  public readonly apiUrl?: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs = {}, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    // Get configuration
    const environmentSuffix = args.environmentSuffix || 'default';
    const createHostedZone = args.createHostedZone || false;
    const primaryRegion = args.primaryRegion || 'us-east-1';
    const secondaryRegion = args.secondaryRegion || 'us-east-2';

    // Create providers for multi-region resources
    const primaryProvider = new aws.Provider(
      'primary-provider',
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      'secondary-provider',
      {
        region: secondaryRegion,
      },
      { parent: this }
    );

    // ============================================================================
    // IAM Roles
    // ============================================================================

    // Lambda execution role for primary region
    const lambdaRolePrimary = new aws.iam.Role(
      `payment-lambda-role-primary-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `payment-lambda-role-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Lambda execution role for secondary region
    const lambdaRoleSecondary = new aws.iam.Role(
      `payment-lambda-role-secondary-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `payment-lambda-role-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // Attach basic Lambda execution policy to primary role
    const lambdaBasicPolicyPrimary = new aws.iam.RolePolicyAttachment(
      `lambda-basic-primary-${environmentSuffix}`,
      {
        role: lambdaRolePrimary.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { provider: primaryProvider, parent: this }
    );

    // Attach basic Lambda execution policy to secondary role
    const lambdaBasicPolicySecondary = new aws.iam.RolePolicyAttachment(
      `lambda-basic-secondary-${environmentSuffix}`,
      {
        role: lambdaRoleSecondary.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { provider: secondaryProvider, parent: this }
    );

    // ============================================================================
    // DynamoDB Global Table
    // ============================================================================

    // DynamoDB table in primary region
    const dynamoTablePrimary = new aws.dynamodb.Table(
      `payments-${environmentSuffix}`,
      {
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'paymentId',
        rangeKey: 'timestamp',
        attributes: [
          { name: 'paymentId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        pointInTimeRecovery: {
          enabled: true,
        },
        replicas: [
          {
            regionName: secondaryRegion,
            pointInTimeRecovery: true,
          },
        ],
        tags: {
          Name: `payments-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // DynamoDB access policy for Lambda (primary)
    const lambdaDynamoDbPolicyPrimary = new aws.iam.RolePolicy(
      `lambda-dynamodb-policy-primary-${environmentSuffix}`,
      {
        role: lambdaRolePrimary.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/payments-${environmentSuffix}"
        }]
    }`,
      },
      { provider: primaryProvider, parent: this }
    );

    // DynamoDB access policy for Lambda (secondary)
    const lambdaDynamoDbPolicySecondary = new aws.iam.RolePolicy(
      `lambda-dynamodb-policy-secondary-${environmentSuffix}`,
      {
        role: lambdaRoleSecondary.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "dynamodb:PutItem",
                "dynamodb:GetItem",
                "dynamodb:UpdateItem",
                "dynamodb:Query",
                "dynamodb:Scan"
            ],
            "Resource": "arn:aws:dynamodb:*:*:table/payments-${environmentSuffix}"
        }]
    }`,
      },
      { provider: secondaryProvider, parent: this }
    );

    // ============================================================================
    // SQS Dead Letter Queues
    // ============================================================================

    // DLQ in primary region
    const dlqPrimary = new aws.sqs.Queue(
      `payment-dlq-primary-${environmentSuffix}`,
      {
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          Name: `payment-dlq-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // DLQ in secondary region
    const dlqSecondary = new aws.sqs.Queue(
      `payment-dlq-secondary-${environmentSuffix}`,
      {
        messageRetentionSeconds: 1209600, // 14 days
        tags: {
          Name: `payment-dlq-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // SQS access policy for Lambda (primary)
    const lambdaSqsPolicyPrimary = new aws.iam.RolePolicy(
      `lambda-sqs-policy-primary-${environmentSuffix}`,
      {
        role: lambdaRolePrimary.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "sqs:SendMessage",
                "sqs:GetQueueUrl"
            ],
            "Resource": "arn:aws:sqs:${primaryRegion}:*:payment-dlq-primary-${environmentSuffix}"
        }]
    }`,
      },
      { provider: primaryProvider, parent: this }
    );

    // SQS access policy for Lambda (secondary)
    const lambdaSqsPolicySecondary = new aws.iam.RolePolicy(
      `lambda-sqs-policy-secondary-${environmentSuffix}`,
      {
        role: lambdaRoleSecondary.id,
        policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Action": [
                "sqs:SendMessage",
                "sqs:GetQueueUrl"
            ],
            "Resource": "arn:aws:sqs:${secondaryRegion}:*:payment-dlq-secondary-${environmentSuffix}"
        }]
    }`,
      },
      { provider: secondaryProvider, parent: this }
    );

    // ============================================================================
    // Lambda Functions
    // ============================================================================

    // Lambda function code
    const lambdaCode = `
exports.handler = async (event) => {
    console.log('Payment processing event:', JSON.stringify(event, null, 2));

    // Extract payment details from event
    const body = event.body ? JSON.parse(event.body) : event;

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Payment processed successfully',
            paymentId: body.paymentId || 'generated-id',
            status: 'completed',
            region: process.env.AWS_REGION,
            timestamp: Date.now()
        })
    };
};
`;

    // Write Lambda code to file
    if (!fs.existsSync('./lib/lambda')) {
      fs.mkdirSync('./lib/lambda', { recursive: true });
    }
    fs.writeFileSync('./lib/lambda/payment-processor.js', lambdaCode);

    // Lambda function in primary region
    const lambdaPrimary = new aws.lambda.Function(
      `payment-processor-primary-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        role: lambdaRolePrimary.arn,
        handler: 'payment-processor.handler',
        code: new pulumi.asset.FileArchive('./lib/lambda'),
        environment: {
          variables: {
            DYNAMODB_TABLE: dynamoTablePrimary.name,
            DLQ_URL: dlqPrimary.url,
            REGION: primaryRegion,
          },
        },
        timeout: 30,
        tags: {
          Name: `payment-processor-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [
          lambdaBasicPolicyPrimary,
          lambdaDynamoDbPolicyPrimary,
          lambdaSqsPolicyPrimary,
        ],
      }
    );

    // Lambda function in secondary region
    const lambdaSecondary = new aws.lambda.Function(
      `payment-processor-secondary-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        role: lambdaRoleSecondary.arn,
        handler: 'payment-processor.handler',
        code: new pulumi.asset.FileArchive('./lib/lambda'),
        environment: {
          variables: {
            DYNAMODB_TABLE: dynamoTablePrimary.name,
            DLQ_URL: dlqSecondary.url,
            REGION: secondaryRegion,
          },
        },
        timeout: 30,
        tags: {
          Name: `payment-processor-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      {
        provider: secondaryProvider,
        parent: this,
        dependsOn: [
          lambdaBasicPolicySecondary,
          lambdaDynamoDbPolicySecondary,
          lambdaSqsPolicySecondary,
        ],
      }
    );

    // ============================================================================
    // API Gateway
    // ============================================================================

    // API Gateway REST API in primary region
    const apiPrimary = new aws.apigateway.RestApi(
      `payment-api-primary-${environmentSuffix}`,
      {
        description: 'Payment Processing API - Primary Region',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          Name: `payment-api-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // API Gateway REST API in secondary region
    const apiSecondary = new aws.apigateway.RestApi(
      `payment-api-secondary-${environmentSuffix}`,
      {
        description: 'Payment Processing API - Secondary Region',
        endpointConfiguration: {
          types: 'REGIONAL',
        },
        tags: {
          Name: `payment-api-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // API Gateway resource - primary
    const isPrStack = environmentSuffix && environmentSuffix.startsWith('pr');
    const apiBasePath = isPrStack ? `payment-${environmentSuffix}` : 'payment';

    // API Gateway resource - primary
    const paymentResourcePrimary = new aws.apigateway.Resource(
      `payment-resource-primary-${environmentSuffix}`,
      {
        restApi: apiPrimary.id,
        parentId: apiPrimary.rootResourceId,
        pathPart: isPrStack ? `payment-${environmentSuffix}` : 'payment',
      },
      { provider: primaryProvider, parent: this }
    );

    // API Gateway resource - secondary
    const paymentResourceSecondary = new aws.apigateway.Resource(
      `payment-resource-secondary-${environmentSuffix}`,
      {
        restApi: apiSecondary.id,
        parentId: apiSecondary.rootResourceId,
        pathPart: isPrStack ? `payment-${environmentSuffix}` : 'payment',
      },
      { provider: secondaryProvider, parent: this }
    );

    // API Gateway method - primary
    const paymentMethodPrimary = new aws.apigateway.Method(
      `payment-method-primary-${environmentSuffix}`,
      {
        restApi: apiPrimary.id,
        resourceId: paymentResourcePrimary.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { provider: primaryProvider, parent: this }
    );

    // API Gateway method - secondary
    const paymentMethodSecondary = new aws.apigateway.Method(
      `payment-method-secondary-${environmentSuffix}`,
      {
        restApi: apiSecondary.id,
        resourceId: paymentResourceSecondary.id,
        httpMethod: 'POST',
        authorization: 'NONE',
      },
      { provider: secondaryProvider, parent: this }
    );

    // Lambda integration - primary
    const lambdaIntegrationPrimary = new aws.apigateway.Integration(
      `payment-integration-primary-${environmentSuffix}`,
      {
        restApi: apiPrimary.id,
        resourceId: paymentResourcePrimary.id,
        httpMethod: paymentMethodPrimary.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaPrimary.invokeArn,
      },
      { provider: primaryProvider, parent: this }
    );

    // Lambda integration - secondary
    const lambdaIntegrationSecondary = new aws.apigateway.Integration(
      `payment-integration-secondary-${environmentSuffix}`,
      {
        restApi: apiSecondary.id,
        resourceId: paymentResourceSecondary.id,
        httpMethod: paymentMethodSecondary.httpMethod,
        integrationHttpMethod: 'POST',
        type: 'AWS_PROXY',
        uri: lambdaSecondary.invokeArn,
      },
      { provider: secondaryProvider, parent: this }
    );

    // Lambda permission for API Gateway - primary
    const _lambdaPermissionPrimary = new aws.lambda.Permission(
      `api-lambda-permission-primary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaPrimary.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${apiPrimary.executionArn}/*/*`,
      },
      { provider: primaryProvider, parent: this }
    );

    // Lambda permission for API Gateway - secondary
    const _lambdaPermissionSecondary = new aws.lambda.Permission(
      `api-lambda-permission-secondary-${environmentSuffix}`,
      {
        action: 'lambda:InvokeFunction',
        function: lambdaSecondary.name,
        principal: 'apigateway.amazonaws.com',
        sourceArn: pulumi.interpolate`${apiSecondary.executionArn}/*/*`,
      },
      { provider: secondaryProvider, parent: this }
    );

    // API Gateway deployment - primary
    const deploymentPrimary = new aws.apigateway.Deployment(
      `payment-deployment-primary-${environmentSuffix}`,
      {
        restApi: apiPrimary.id,
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [lambdaIntegrationPrimary, paymentMethodPrimary],
      }
    );

    // API Gateway stage - primary
    const _stagePrimary = new aws.apigateway.Stage(
      `payment-stage-primary-${environmentSuffix}`,
      {
        restApi: apiPrimary.id,
        deployment: deploymentPrimary.id,
        stageName: 'prod',
      },
      { provider: primaryProvider, parent: this }
    );

    // API Gateway deployment - secondary
    const deploymentSecondary = new aws.apigateway.Deployment(
      `payment-deployment-secondary-${environmentSuffix}`,
      {
        restApi: apiSecondary.id,
      },
      {
        provider: secondaryProvider,
        parent: this,
        dependsOn: [lambdaIntegrationSecondary, paymentMethodSecondary],
      }
    );

    // API Gateway stage - secondary
    const _stageSecondary = new aws.apigateway.Stage(
      `payment-stage-secondary-${environmentSuffix}`,
      {
        restApi: apiSecondary.id,
        deployment: deploymentSecondary.id,
        stageName: 'prod',
      },
      { provider: secondaryProvider, parent: this }
    );

    // ============================================================================
    // S3 Buckets with Cross-Region Replication
    // ============================================================================

    // S3 replication role
    const s3ReplicationRole = new aws.iam.Role(
      `s3-replication-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          Name: `s3-replication-role-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 bucket in primary region
    const s3BucketPrimary = new aws.s3.Bucket(
      `transaction-logs-primary-${environmentSuffix}`,
      {
        bucket: `transaction-logs-primary-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        tags: {
          Name: `transaction-logs-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 bucket in secondary region
    const s3BucketSecondary = new aws.s3.Bucket(
      `transaction-logs-secondary-${environmentSuffix}`,
      {
        bucket: `transaction-logs-secondary-${environmentSuffix}`,
        versioning: {
          enabled: true,
        },
        tags: {
          Name: `transaction-logs-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    // S3 replication policy
    const s3ReplicationPolicy = new aws.iam.RolePolicy(
      `s3-replication-policy-${environmentSuffix}`,
      {
        role: s3ReplicationRole.id,
        policy: pulumi
          .all([s3BucketPrimary.arn, s3BucketSecondary.arn])
          .apply(([primaryArn, secondaryArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                  Resource: primaryArn,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                    's3:GetObjectVersionTagging',
                  ],
                  Resource: `${primaryArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:ReplicateObject',
                    's3:ReplicateDelete',
                    's3:ReplicateTags',
                  ],
                  Resource: `${secondaryArn}/*`,
                },
              ],
            })
          ),
      },
      { provider: primaryProvider, parent: this }
    );

    // S3 bucket replication configuration
    const _s3Replication = new aws.s3.BucketReplicationConfig(
      `s3-replication-config-${environmentSuffix}`,
      {
        bucket: s3BucketPrimary.id,
        role: s3ReplicationRole.arn,
        rules: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            priority: 1,
            deleteMarkerReplication: {
              status: 'Enabled',
            },
            filter: {},
            destination: {
              bucket: s3BucketSecondary.arn,
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
      },
      {
        provider: primaryProvider,
        parent: this,
        dependsOn: [s3ReplicationPolicy, s3BucketPrimary, s3BucketSecondary],
      }
    );

    // ============================================================================
    // CloudWatch Alarms
    // ============================================================================

    // CloudWatch alarm for DynamoDB replication lag
    const replicationLagAlarm = new aws.cloudwatch.MetricAlarm(
      `dynamodb-replication-lag-alarm-${environmentSuffix}`,
      {
        name: `dynamodb-replication-lag-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReplicationLatency',
        namespace: 'AWS/DynamoDB',
        period: 60,
        statistic: 'Average',
        threshold: 30000,
        alarmDescription:
          'Alert when DynamoDB replication lag exceeds 30 seconds',
        dimensions: {
          TableName: dynamoTablePrimary.name,
          ReceivingRegion: secondaryRegion,
        },
        tags: {
          Name: `dynamodb-replication-lag-alarm-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // ============================================================================
    // Route 53 - Health Checks and Failover
    // ============================================================================

    // Only create hosted zone if explicitly enabled
    let hostedZone: aws.route53.Zone | undefined;
    if (createHostedZone && !isPrStack) {
      hostedZone = new aws.route53.Zone(
        `payment-zone-${environmentSuffix}`,
        {
          name: `payment-${environmentSuffix}.example.com`,
          tags: {
            Name: `payment-zone-${environmentSuffix}`,
            Environment: environmentSuffix,
          },
        },
        { provider: primaryProvider, parent: this }
      );
    } else {
      hostedZone = undefined;
    }

    // Health check for primary API
    const healthCheckPrimary = new aws.route53.HealthCheck(
      `health-check-primary-${environmentSuffix}`,
      {
        type: 'HTTPS',
        resourcePath: '/prod/payment',
        fqdn: pulumi.interpolate`${apiPrimary.id}.execute-api.${primaryRegion}.amazonaws.com`,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
        tags: {
          Name: `health-check-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Health check for secondary API
    const healthCheckSecondary = new aws.route53.HealthCheck(
      `health-check-secondary-${environmentSuffix}`,
      {
        type: 'HTTPS',
        resourcePath: '/prod/payment',
        fqdn: pulumi.interpolate`${apiSecondary.id}.execute-api.${secondaryRegion}.amazonaws.com`,
        port: 443,
        requestInterval: 30,
        failureThreshold: 3,
        tags: {
          Name: `health-check-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    // Route 53 records for failover
    let _primaryRecord: aws.route53.Record | undefined;
    if (hostedZone) {
      _primaryRecord = new aws.route53.Record(
        `api-primary-record-${environmentSuffix}`,
        {
          zoneId: hostedZone.zoneId,
          name: `api.payment-${environmentSuffix}.example.com`,
          type: 'CNAME',
          ttl: 60,
          records: [
            pulumi.interpolate`${apiPrimary.id}.execute-api.${primaryRegion}.amazonaws.com`,
          ],
          setIdentifier: 'primary',
          failoverRoutingPolicies: [
            {
              type: 'PRIMARY',
            },
          ],
          healthCheckId: healthCheckPrimary.id,
        },
        { provider: primaryProvider, parent: this }
      );

      let _secondaryRecord: aws.route53.Record | undefined;
      _secondaryRecord = new aws.route53.Record(
        `api-secondary-record-${environmentSuffix}`,
        {
          zoneId: hostedZone.zoneId,
          name: `api.payment-${environmentSuffix}.example.com`,
          type: 'CNAME',
          ttl: 60,
          records: [
            pulumi.interpolate`${apiSecondary.id}.execute-api.${secondaryRegion}.amazonaws.com`,
          ],
          setIdentifier: 'secondary',
          failoverRoutingPolicies: [
            {
              type: 'SECONDARY',
            },
          ],
          healthCheckId: healthCheckSecondary.id,
        },
        { provider: primaryProvider, parent: this }
      );
    }

    // ============================================================================
    // SSM Parameters
    // ============================================================================

    const _ssmPrimaryEndpoint = new aws.ssm.Parameter(
      `ssm-primary-endpoint-${environmentSuffix}`,
      {
        name: `/payment/${environmentSuffix}/api/primary/endpoint`,
        type: 'String',
        value: pulumi.interpolate`https://${apiPrimary.id}.execute-api.${primaryRegion}.amazonaws.com/prod/${apiBasePath}`,
        description: 'Primary region API endpoint',
        tags: {
          Name: `ssm-primary-endpoint-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
        overwrite: true,
      },
      { provider: primaryProvider, parent: this }
    );

    const _ssmSecondaryEndpoint = new aws.ssm.Parameter(
      `ssm-secondary-endpoint-${environmentSuffix}`,
      {
        name: `/payment/${environmentSuffix}/api/secondary/endpoint`,
        type: 'String',
        value: pulumi.interpolate`https://${apiSecondary.id}.execute-api.${secondaryRegion}.amazonaws.com/prod/${apiBasePath}`,
        description: 'Secondary region API endpoint',
        tags: {
          Name: `ssm-secondary-endpoint-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
        overwrite: true,
      },
      { provider: secondaryProvider, parent: this }
    );

    const _ssmDynamoDbTable = new aws.ssm.Parameter(
      `ssm-dynamodb-table-${environmentSuffix}`,
      {
        name: `/payment/${environmentSuffix}/dynamodb/table-name`,
        type: 'String',
        value: dynamoTablePrimary.name,
        description: 'DynamoDB global table name',
        tags: {
          Name: `ssm-dynamodb-table-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
        overwrite: true,
      },
      { provider: primaryProvider, parent: this }
    );

    const _ssmS3Primary = new aws.ssm.Parameter(
      `ssm-s3-primary-${environmentSuffix}`,
      {
        name: `/payment/${environmentSuffix}/s3/primary/bucket`,
        type: 'String',
        value: s3BucketPrimary.bucket,
        description: 'Primary S3 bucket for transaction logs',
        tags: {
          Name: `ssm-s3-primary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
        overwrite: true,
      },
      { provider: primaryProvider, parent: this }
    );

    const _ssmS3Secondary = new aws.ssm.Parameter(
      `ssm-s3-secondary-${environmentSuffix}`,
      {
        name: `/payment/${environmentSuffix}/s3/secondary/bucket`,
        type: 'String',
        value: s3BucketSecondary.bucket,
        description: 'Secondary S3 bucket for transaction logs',
        tags: {
          Name: `ssm-s3-secondary-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
        overwrite: true,
      },
      { provider: secondaryProvider, parent: this }
    );

    // ============================================================================
    // Outputs
    // ============================================================================

    this.primaryApiEndpoint = pulumi.interpolate`https://${apiPrimary.id}.execute-api.${primaryRegion}.amazonaws.com/prod/${apiBasePath}`;
    this.secondaryApiEndpoint = pulumi.interpolate`https://${apiSecondary.id}.execute-api.${secondaryRegion}.amazonaws.com/prod/${apiBasePath}`;
    this.failoverDnsName = hostedZone
      ? pulumi.interpolate`api.payment-${environmentSuffix}.example.com`
      : pulumi.output('');
    this.primaryHealthCheckUrl = pulumi.interpolate`https://${apiPrimary.id}.execute-api.${primaryRegion}.amazonaws.com/prod/${apiBasePath}`;
    this.secondaryHealthCheckUrl = pulumi.interpolate`https://${apiSecondary.id}.execute-api.${secondaryRegion}.amazonaws.com/prod/${apiBasePath}`;
    this.healthCheckPrimaryId = healthCheckPrimary.id;
    this.healthCheckSecondaryId = healthCheckSecondary.id;
    this.replicationLagAlarmArn = replicationLagAlarm.arn;
    this.dynamoDbTableName = dynamoTablePrimary.name;
    this.s3BucketPrimaryName = s3BucketPrimary.bucket;
    this.s3BucketSecondaryName = s3BucketSecondary.bucket;
    this.dlqPrimaryUrl = dlqPrimary.url;
    this.dlqSecondaryUrl = dlqSecondary.url;
    this.hostedZoneId = hostedZone ? hostedZone.zoneId : pulumi.output('');
    this.hostedZoneNameServers = hostedZone
      ? hostedZone.nameServers
      : pulumi.output([]);

    // Legacy outputs for backward compatibility
    this.vpcId = pulumi.output('');
    this.rdsEndpoint = pulumi.output('');
    this.bucketName = s3BucketPrimary.bucket;
    this.lambdaArn = lambdaPrimary.arn;
    this.apiUrl = this.primaryApiEndpoint;

    this.registerOutputs({
      primaryApiEndpoint: this.primaryApiEndpoint,
      secondaryApiEndpoint: this.secondaryApiEndpoint,
      failoverDnsName: this.failoverDnsName,
      primaryHealthCheckUrl: this.primaryHealthCheckUrl,
      secondaryHealthCheckUrl: this.secondaryHealthCheckUrl,
      healthCheckPrimaryId: this.healthCheckPrimaryId,
      healthCheckSecondaryId: this.healthCheckSecondaryId,
      replicationLagAlarmArn: this.replicationLagAlarmArn,
      dynamoDbTableName: this.dynamoDbTableName,
      s3BucketPrimaryName: this.s3BucketPrimaryName,
      s3BucketSecondaryName: this.s3BucketSecondaryName,
      dlqPrimaryUrl: this.dlqPrimaryUrl,
      dlqSecondaryUrl: this.dlqSecondaryUrl,
      hostedZoneId: this.hostedZoneId,
      hostedZoneNameServers: this.hostedZoneNameServers,
      vpcId: this.vpcId,
      rdsEndpoint: this.rdsEndpoint,
      bucketName: this.bucketName,
      lambdaArn: this.lambdaArn,
      apiUrl: this.apiUrl,
    });
  }
}
