/* eslint-disable @typescript-eslint/no-unused-vars */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
// Optional config to control creation of public DNS hosted zone (default: false)
// For CI/PR runs we skip creating public hosted zones by default to avoid reserved
// domain names (eg: example.com) and accidental global DNS changes.
const createHostedZone = config.getBoolean('createHostedZone') || false;

// Define regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-east-2';

// Create providers for multi-region resources
const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
);

// Attach basic Lambda execution policy to primary role
const lambdaBasicPolicyPrimary = new aws.iam.RolePolicyAttachment(
  `lambda-basic-primary-${environmentSuffix}`,
  {
    role: lambdaRolePrimary.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  },
  { provider: primaryProvider }
);

// Attach basic Lambda execution policy to secondary role
const lambdaBasicPolicySecondary = new aws.iam.RolePolicyAttachment(
  `lambda-basic-secondary-${environmentSuffix}`,
  {
    role: lambdaRoleSecondary.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  },
  { provider: secondaryProvider }
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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
);

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
  { provider: primaryProvider }
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
  { provider: primaryProvider }
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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
);

// API Gateway resource - primary
const isPrStack = environmentSuffix && environmentSuffix.startsWith('pr');
const apiBasePath = isPrStack ? `payment-${environmentSuffix}` : 'payment';

// API Gateway resource - primary
// Use a PR-safe pathPart when running in PR stacks to avoid conflicts with existing
// API resources in shared AWS accounts.
const paymentResourcePrimary = new aws.apigateway.Resource(
  `payment-resource-primary-${environmentSuffix}`,
  {
    restApi: apiPrimary.id,
    parentId: apiPrimary.rootResourceId,
    pathPart: isPrStack ? `payment-${environmentSuffix}` : 'payment',
  },
  { provider: primaryProvider }
);

// API Gateway resource - secondary
const paymentResourceSecondary = new aws.apigateway.Resource(
  `payment-resource-secondary-${environmentSuffix}`,
  {
    restApi: apiSecondary.id,
    parentId: apiSecondary.rootResourceId,
    pathPart: isPrStack ? `payment-${environmentSuffix}` : 'payment',
  },
  { provider: secondaryProvider }
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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
);

// API Gateway deployment - primary
const deploymentPrimary = new aws.apigateway.Deployment(
  `payment-deployment-primary-${environmentSuffix}`,
  {
    restApi: apiPrimary.id,
  },
  {
    provider: primaryProvider,
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
  { provider: primaryProvider }
);

// API Gateway deployment - secondary
const deploymentSecondary = new aws.apigateway.Deployment(
  `payment-deployment-secondary-${environmentSuffix}`,
  {
    restApi: apiSecondary.id,
  },
  {
    provider: secondaryProvider,
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
  { provider: secondaryProvider }
);

// ============================================================================
// S3 Buckets with Cross-Region Replication
// ============================================================================

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
  { provider: primaryProvider }
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
  { provider: secondaryProvider }
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
  { provider: primaryProvider }
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
    threshold: 30000, // 30 seconds in milliseconds
    alarmDescription: 'Alert when DynamoDB replication lag exceeds 30 seconds',
    dimensions: {
      TableName: dynamoTablePrimary.name,
      ReceivingRegion: secondaryRegion,
    },
    tags: {
      Name: `dynamodb-replication-lag-alarm-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

// ============================================================================
// Route 53 - Health Checks and Failover
// ============================================================================

// Only create a public hosted zone if explicitly enabled via config. This avoids
// creating reserved/owned DNS zones during PR/CI preview runs (eg. example.com).
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
    { provider: primaryProvider }
  );
} else {
  // hostedZone remains undefined in PRs / CI unless createHostedZone=true
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
  { provider: primaryProvider }
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
  { provider: primaryProvider }
);

// Route 53 record for primary API (failover primary)
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
    { provider: primaryProvider }
  );

  // Route 53 record for secondary API (failover secondary)
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
    { provider: primaryProvider }
  );
}
// ============================================================================
// SSM Parameters
// ============================================================================

// SSM parameter for primary API endpoint
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
  { provider: primaryProvider }
);

// SSM parameter for secondary API endpoint
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
  { provider: secondaryProvider }
);

// SSM parameter for DynamoDB table
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
  { provider: primaryProvider }
);

// SSM parameter for primary S3 bucket
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
  { provider: primaryProvider }
);

// SSM parameter for secondary S3 bucket
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
  { provider: secondaryProvider }
);

// ============================================================================
// Outputs
// ============================================================================

export const primaryApiEndpoint = pulumi.interpolate`https://${apiPrimary.id}.execute-api.${primaryRegion}.amazonaws.com/prod/${apiBasePath}`;
export const secondaryApiEndpoint = pulumi.interpolate`https://${apiSecondary.id}.execute-api.${secondaryRegion}.amazonaws.com/prod/${apiBasePath}`;
export const failoverDnsName = hostedZone
  ? pulumi.interpolate`api.payment-${environmentSuffix}.example.com`
  : pulumi.output('');
export const primaryHealthCheckUrl = pulumi.interpolate`https://${apiPrimary.id}.execute-api.${primaryRegion}.amazonaws.com/prod/${apiBasePath}`;
export const secondaryHealthCheckUrl = pulumi.interpolate`https://${apiSecondary.id}.execute-api.${secondaryRegion}.amazonaws.com/prod/${apiBasePath}`;
export const healthCheckPrimaryId = healthCheckPrimary.id;
export const healthCheckSecondaryId = healthCheckSecondary.id;
export const replicationLagAlarmArn = replicationLagAlarm.arn;
export const dynamoDbTableName = dynamoTablePrimary.name;
export const s3BucketPrimaryName = s3BucketPrimary.bucket;
export const s3BucketSecondaryName = s3BucketSecondary.bucket;
export const dlqPrimaryUrl = dlqPrimary.url;
export const dlqSecondaryUrl = dlqSecondary.url;
export const hostedZoneId = hostedZone ? hostedZone.zoneId : pulumi.output('');
export const hostedZoneNameServers = hostedZone
  ? hostedZone.nameServers
  : pulumi.output([]);
