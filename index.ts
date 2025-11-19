/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const notificationEmail =
  config.get('notificationEmail') || 'admin@example.com';
const hostedZoneDomain =
  config.get('hostedZoneDomain') ||
  `payment-api-${environmentSuffix}.example.com`;

// Define regions
const primaryRegion = 'us-east-1';
const secondaryRegion = 'us-east-2';

// Create AWS providers for both regions
const primaryProvider = new aws.Provider('primary-provider', {
  region: primaryRegion,
});

const secondaryProvider = new aws.Provider('secondary-provider', {
  region: secondaryRegion,
});

// ========================================
// VPC Infrastructure - Primary Region
// ========================================

const primaryVpc = new aws.ec2.Vpc(
  `payment-vpc-primary-${environmentSuffix}`,
  {
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: `payment-vpc-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const primaryPrivateSubnet1 = new aws.ec2.Subnet(
  `payment-private-subnet-1a-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: 'us-east-1a',
    tags: {
      Name: `payment-private-subnet-1a-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const primaryPrivateSubnet2 = new aws.ec2.Subnet(
  `payment-private-subnet-1b-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: 'us-east-1b',
    tags: {
      Name: `payment-private-subnet-1b-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

// Create route table for private subnets
const primaryPrivateRt = new aws.ec2.RouteTable(
  `private-rt-primary-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    tags: {
      Name: `private-rt-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

// Associate route table with subnets
new aws.ec2.RouteTableAssociation(
  `rta-private-1a-${environmentSuffix}`,
  {
    subnetId: primaryPrivateSubnet1.id,
    routeTableId: primaryPrivateRt.id,
  },
  { provider: primaryProvider }
);

new aws.ec2.RouteTableAssociation(
  `rta-private-1b-${environmentSuffix}`,
  {
    subnetId: primaryPrivateSubnet2.id,
    routeTableId: primaryPrivateRt.id,
  },
  { provider: primaryProvider }
);

// Create security group for Lambda
const primaryLambdaSg = new aws.ec2.SecurityGroup(
  `payment-lambda-sg-primary-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    description: 'Security group for payment Lambda functions',
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `payment-lambda-sg-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

// VPC Endpoints for Lambda connectivity - Primary Region
const primaryDynamodbEndpoint = new aws.ec2.VpcEndpoint(
  `dynamodb-endpoint-primary-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    serviceName: `com.amazonaws.${primaryRegion}.dynamodb`,
    vpcEndpointType: 'Gateway',
    routeTableIds: [primaryPrivateRt.id],
    tags: {
      Name: `dynamodb-endpoint-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const primarySecretsEndpoint = new aws.ec2.VpcEndpoint(
  `secrets-endpoint-primary-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    serviceName: `com.amazonaws.${primaryRegion}.secretsmanager`,
    vpcEndpointType: 'Interface',
    subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
    securityGroupIds: [primaryLambdaSg.id],
    privateDnsEnabled: true,
    tags: {
      Name: `secrets-endpoint-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const primaryLogsEndpoint = new aws.ec2.VpcEndpoint(
  `logs-endpoint-primary-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    serviceName: `com.amazonaws.${primaryRegion}.logs`,
    vpcEndpointType: 'Interface',
    subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
    securityGroupIds: [primaryLambdaSg.id],
    privateDnsEnabled: true,
    tags: {
      Name: `logs-endpoint-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

// ========================================
// VPC Infrastructure - Secondary Region
// ========================================

const secondaryVpc = new aws.ec2.Vpc(
  `payment-vpc-secondary-${environmentSuffix}`,
  {
    cidrBlock: '10.1.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: `payment-vpc-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondaryPrivateSubnet1 = new aws.ec2.Subnet(
  `payment-private-subnet-2a-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.1.0/24',
    availabilityZone: 'us-east-2a',
    tags: {
      Name: `payment-private-subnet-2a-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondaryPrivateSubnet2 = new aws.ec2.Subnet(
  `payment-private-subnet-2b-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.2.0/24',
    availabilityZone: 'us-east-2b',
    tags: {
      Name: `payment-private-subnet-2b-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondaryPrivateRt = new aws.ec2.RouteTable(
  `private-rt-secondary-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    tags: {
      Name: `private-rt-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

new aws.ec2.RouteTableAssociation(
  `rta-private-2a-${environmentSuffix}`,
  {
    subnetId: secondaryPrivateSubnet1.id,
    routeTableId: secondaryPrivateRt.id,
  },
  { provider: secondaryProvider }
);

new aws.ec2.RouteTableAssociation(
  `rta-private-2b-${environmentSuffix}`,
  {
    subnetId: secondaryPrivateSubnet2.id,
    routeTableId: secondaryPrivateRt.id,
  },
  { provider: secondaryProvider }
);

const secondaryLambdaSg = new aws.ec2.SecurityGroup(
  `payment-lambda-sg-secondary-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    description: 'Security group for payment Lambda functions',
    egress: [
      {
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      Name: `payment-lambda-sg-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

// VPC Endpoints - Secondary Region
const secondaryDynamodbEndpoint = new aws.ec2.VpcEndpoint(
  `dynamodb-endpoint-secondary-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    serviceName: `com.amazonaws.${secondaryRegion}.dynamodb`,
    vpcEndpointType: 'Gateway',
    routeTableIds: [secondaryPrivateRt.id],
    tags: {
      Name: `dynamodb-endpoint-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondarySecretsEndpoint = new aws.ec2.VpcEndpoint(
  `secrets-endpoint-secondary-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    serviceName: `com.amazonaws.${secondaryRegion}.secretsmanager`,
    vpcEndpointType: 'Interface',
    subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
    securityGroupIds: [secondaryLambdaSg.id],
    privateDnsEnabled: true,
    tags: {
      Name: `secrets-endpoint-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondaryLogsEndpoint = new aws.ec2.VpcEndpoint(
  `logs-endpoint-secondary-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    serviceName: `com.amazonaws.${secondaryRegion}.logs`,
    vpcEndpointType: 'Interface',
    subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
    securityGroupIds: [secondaryLambdaSg.id],
    privateDnsEnabled: true,
    tags: {
      Name: `logs-endpoint-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

// ========================================
// DynamoDB Global Table
// ========================================

const transactionTable = new aws.dynamodb.Table(
  `payment-transactions-${environmentSuffix}`,
  {
    name: `payment-transactions-${environmentSuffix}`,
    billingMode: 'PAY_PER_REQUEST',
    hashKey: 'transactionId',
    rangeKey: 'timestamp',
    attributes: [
      { name: 'transactionId', type: 'S' },
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
      Name: `payment-transactions-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

// ========================================
// S3 Buckets with Cross-Region Replication
// ========================================

const primaryAuditBucket = new aws.s3.Bucket(
  `payment-audit-logs-primary-${environmentSuffix}`,
  {
    bucket: `payment-audit-logs-primary-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    lifecycleRules: [
      {
        enabled: true,
        transitions: [
          {
            days: 30,
            storageClass: 'STANDARD_IA',
          },
          {
            days: 90,
            storageClass: 'GLACIER',
          },
        ],
      },
    ],
    tags: {
      Name: `payment-audit-logs-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const _primaryAuditBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `primary-audit-public-access-block-${environmentSuffix}`,
  {
    bucket: primaryAuditBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
  { provider: primaryProvider }
);

const secondaryAuditBucket = new aws.s3.Bucket(
  `payment-audit-logs-secondary-${environmentSuffix}`,
  {
    bucket: `payment-audit-logs-secondary-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    tags: {
      Name: `payment-audit-logs-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const _secondaryAuditBucketPublicAccessBlock =
  new aws.s3.BucketPublicAccessBlock(
    `secondary-audit-public-access-block-${environmentSuffix}`,
    {
      bucket: secondaryAuditBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider: secondaryProvider }
  );

// IAM role for S3 replication
const _s3ReplicationRole = new aws.iam.Role(
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
    tags: {
      Name: `s3-replication-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const _s3ReplicationPolicy = new aws.iam.RolePolicy(
  `s3-replication-policy-${environmentSuffix}`,
  {
    role: _s3ReplicationRole.id,
    policy: pulumi
      .all([primaryAuditBucket.arn, secondaryAuditBucket.arn])
      .apply(([sourceArn, destArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
              Resource: sourceArn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
              ],
              Resource: `${sourceArn}/*`,
            },
            {
              Effect: 'Allow',
              Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
              Resource: `${destArn}/*`,
            },
          ],
        })
      ),
  }
);

const _s3Replication = new aws.s3.BucketReplicationConfig(
  `s3-replication-${environmentSuffix}`,
  {
    bucket: primaryAuditBucket.id,
    role: _s3ReplicationRole.arn,
    rules: [
      {
        id: 'replicate-all',
        status: 'Enabled',
        destination: {
          bucket: secondaryAuditBucket.arn,
          storageClass: 'STANDARD',
        },
      },
    ],
  },
  { provider: primaryProvider, dependsOn: [_s3ReplicationPolicy] }
);

// ========================================
// Secrets Manager with Replication
// ========================================

const apiSecret = new aws.secretsmanager.Secret(
  `payment-api-secret-${environmentSuffix}`,
  {
    name: `payment-api-secret-${environmentSuffix}`,
    description: 'API keys and database credentials for payment processing',
    replicas: [
      {
        region: secondaryRegion,
      },
    ],
    tags: {
      Name: `payment-api-secret-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const _apiSecretVersion = new aws.secretsmanager.SecretVersion(
  `payment-api-secret-version-${environmentSuffix}`,
  {
    secretId: apiSecret.id,
    secretString: JSON.stringify({
      apiKey: pulumi.secret('default-api-key-change-after-deployment'),
      dbPassword: pulumi.secret('default-password-change-after-deployment'),
    }),
  },
  { provider: primaryProvider }
);

// ========================================
// Systems Manager Parameter Store
// ========================================

const _configParam = new aws.ssm.Parameter(
  `payment-config-${environmentSuffix}`,
  {
    name: `/payment-processing/${environmentSuffix}/config`,
    type: 'String',
    value: JSON.stringify({
      maxRetries: 3,
      timeout: 10000,
      region: primaryRegion,
    }),
    description: 'Payment processing configuration',
    tags: {
      Name: `payment-config-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const _configParamSecondary = new aws.ssm.Parameter(
  `payment-config-secondary-${environmentSuffix}`,
  {
    name: `/payment-processing/${environmentSuffix}/config`,
    type: 'String',
    value: JSON.stringify({
      maxRetries: 3,
      timeout: 10000,
      region: secondaryRegion,
    }),
    description: 'Payment processing configuration',
    tags: {
      Name: `payment-config-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

// ========================================
// IAM Roles for Lambda (No provider - global)
// ========================================

const lambdaRole = new aws.iam.Role(
  `payment-lambda-role-${environmentSuffix}`,
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
    tags: {
      Name: `payment-lambda-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const lambdaVpcPolicy = new aws.iam.RolePolicyAttachment(
  `lambda-vpc-policy-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
  }
);

const lambdaBasicPolicy = new aws.iam.RolePolicyAttachment(
  `lambda-basic-policy-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

const lambdaDynamoPolicy = new aws.iam.RolePolicy(
  `lambda-dynamodb-policy-${environmentSuffix}`,
  {
    role: lambdaRole.id,
    policy: transactionTable.arn.apply(tableArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:PutItem',
              'dynamodb:GetItem',
              'dynamodb:UpdateItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [tableArn, `${tableArn}/*`],
          },
        ],
      })
    ),
  }
);

const lambdaSecretsPolicy = new aws.iam.RolePolicy(
  `lambda-secrets-policy-${environmentSuffix}`,
  {
    role: lambdaRole.id,
    policy: apiSecret.arn.apply(secretArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: [secretArn, `${secretArn}-*`],
          },
        ],
      })
    ),
  }
);

const lambdaSsmPolicy = new aws.iam.RolePolicy(
  `lambda-ssm-policy-${environmentSuffix}`,
  {
    role: lambdaRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['ssm:GetParameter', 'ssm:GetParameters'],
          Resource: `arn:aws:ssm:*:*:parameter/payment-processing/${environmentSuffix}/*`,
        },
      ],
    }),
  }
);

// CloudWatch Log Groups for Lambda functions
const primaryPaymentLogGroup = new aws.cloudwatch.LogGroup(
  `payment-processor-primary-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/payment-processor-primary-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `payment-processor-primary-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const primaryHealthLogGroup = new aws.cloudwatch.LogGroup(
  `health-check-primary-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/health-check-primary-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `health-check-primary-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const secondaryPaymentLogGroup = new aws.cloudwatch.LogGroup(
  `payment-processor-secondary-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/payment-processor-secondary-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `payment-processor-secondary-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondaryHealthLogGroup = new aws.cloudwatch.LogGroup(
  `health-check-secondary-logs-${environmentSuffix}`,
  {
    name: `/aws/lambda/health-check-secondary-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `health-check-secondary-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

// ========================================
// Lambda Functions - Primary Region
// ========================================

const primaryPaymentLambda = new aws.lambda.Function(
  `payment-processor-primary-${environmentSuffix}`,
  {
    name: `payment-processor-primary-${environmentSuffix}`,
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 10,
    memorySize: 256,
    environment: {
      variables: {
        TABLE_NAME: transactionTable.name,
        SECRET_ARN: apiSecret.arn,
        REGION: primaryRegion,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
    },
    vpcConfig: {
      subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
      securityGroupIds: [primaryLambdaSg.id],
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });

exports.handler = async (event) => {
    console.log('Processing payment request:', JSON.stringify(event));

    try {
        // Parse request body
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { amount, currency, customerId } = body;

        // Validate request
        if (!amount || !currency) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: amount, currency' })
            };
        }

        // Retrieve credentials from Secrets Manager
        const secretResponse = await secretsClient.send(new GetSecretValueCommand({
            SecretId: process.env.SECRET_ARN
        }));
        const secrets = JSON.parse(secretResponse.SecretString);

        // Process payment (simulated)
        const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
        const timestamp = Date.now();

        // Store transaction in DynamoDB
        await dynamoClient.send(new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                transactionId: { S: transactionId },
                timestamp: { N: timestamp.toString() },
                amount: { N: amount.toString() },
                currency: { S: currency },
                customerId: { S: customerId || 'anonymous' },
                status: { S: 'completed' },
                region: { S: process.env.REGION },
                processedAt: { S: new Date().toISOString() }
            }
        }));

        console.log(\`Payment processed successfully: \${transactionId}\`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: 'success',
                transactionId: transactionId,
                amount: amount,
                currency: currency,
                region: process.env.REGION,
                timestamp: timestamp
            })
        };
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Payment processing failed',
                message: error.message
            })
        };
    }
};
        `),
    }),
    tags: {
      Name: `payment-processor-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    provider: primaryProvider,
    dependsOn: [
      lambdaVpcPolicy,
      lambdaBasicPolicy,
      lambdaDynamoPolicy,
      lambdaSecretsPolicy,
      lambdaSsmPolicy,
      primaryPaymentLogGroup,
      primaryDynamodbEndpoint,
      primarySecretsEndpoint,
      primaryLogsEndpoint,
    ],
  }
);

const primaryHealthLambda = new aws.lambda.Function(
  `health-check-primary-${environmentSuffix}`,
  {
    name: `health-check-primary-${environmentSuffix}`,
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 1,
    memorySize: 128,
    environment: {
      variables: {
        REGION: primaryRegion,
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const healthStatus = {
        status: 'healthy',
        region: process.env.REGION,
        timestamp: Date.now(),
        service: 'payment-api'
    };

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(healthStatus)
    };
};
        `),
    }),
    tags: {
      Name: `health-check-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    provider: primaryProvider,
    dependsOn: [lambdaBasicPolicy, primaryHealthLogGroup],
  }
);

// ========================================
// Lambda Functions - Secondary Region
// ========================================

const secondaryPaymentLambda = new aws.lambda.Function(
  `payment-processor-secondary-${environmentSuffix}`,
  {
    name: `payment-processor-secondary-${environmentSuffix}`,
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 10,
    memorySize: 256,
    environment: {
      variables: {
        TABLE_NAME: transactionTable.name,
        SECRET_ARN: apiSecret.arn,
        REGION: secondaryRegion,
        ENVIRONMENT_SUFFIX: environmentSuffix,
      },
    },
    vpcConfig: {
      subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
      securityGroupIds: [secondaryLambdaSg.id],
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
const { DynamoDBClient, PutItemCommand } = require('@aws-sdk/client-dynamodb');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

const dynamoClient = new DynamoDBClient({ region: process.env.REGION });
const secretsClient = new SecretsManagerClient({ region: process.env.REGION });

exports.handler = async (event) => {
    console.log('Processing payment request:', JSON.stringify(event));

    try {
        const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
        const { amount, currency, customerId } = body;

        if (!amount || !currency) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Missing required fields: amount, currency' })
            };
        }

        const secretResponse = await secretsClient.send(new GetSecretValueCommand({
            SecretId: process.env.SECRET_ARN
        }));
        const secrets = JSON.parse(secretResponse.SecretString);

        const transactionId = \`txn-\${Date.now()}-\${Math.random().toString(36).substr(2, 9)}\`;
        const timestamp = Date.now();

        await dynamoClient.send(new PutItemCommand({
            TableName: process.env.TABLE_NAME,
            Item: {
                transactionId: { S: transactionId },
                timestamp: { N: timestamp.toString() },
                amount: { N: amount.toString() },
                currency: { S: currency },
                customerId: { S: customerId || 'anonymous' },
                status: { S: 'completed' },
                region: { S: process.env.REGION },
                processedAt: { S: new Date().toISOString() }
            }
        }));

        console.log(\`Payment processed successfully: \${transactionId}\`);

        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                status: 'success',
                transactionId: transactionId,
                amount: amount,
                currency: currency,
                region: process.env.REGION,
                timestamp: timestamp
            })
        };
    } catch (error) {
        console.error('Payment processing error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                error: 'Payment processing failed',
                message: error.message
            })
        };
    }
};
        `),
    }),
    tags: {
      Name: `payment-processor-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    provider: secondaryProvider,
    dependsOn: [
      lambdaVpcPolicy,
      lambdaBasicPolicy,
      lambdaDynamoPolicy,
      lambdaSecretsPolicy,
      lambdaSsmPolicy,
      secondaryPaymentLogGroup,
      secondaryDynamodbEndpoint,
      secondarySecretsEndpoint,
      secondaryLogsEndpoint,
    ],
  }
);

const secondaryHealthLambda = new aws.lambda.Function(
  `health-check-secondary-${environmentSuffix}`,
  {
    name: `health-check-secondary-${environmentSuffix}`,
    runtime: 'nodejs20.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 1,
    memorySize: 128,
    environment: {
      variables: {
        REGION: secondaryRegion,
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    const healthStatus = {
        status: 'healthy',
        region: process.env.REGION,
        timestamp: Date.now(),
        service: 'payment-api'
    };

    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify(healthStatus)
    };
};
        `),
    }),
    tags: {
      Name: `health-check-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    provider: secondaryProvider,
    dependsOn: [lambdaBasicPolicy, secondaryHealthLogGroup],
  }
);

// ========================================
// API Gateway - Primary Region
// ========================================

const primaryApi = new aws.apigateway.RestApi(
  `payment-api-primary-${environmentSuffix}`,
  {
    name: `payment-api-primary-${environmentSuffix}`,
    description: 'Payment processing API - Primary Region',
    tags: {
      Name: `payment-api-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const primaryPaymentResource = new aws.apigateway.Resource(
  `payment-resource-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    parentId: primaryApi.rootResourceId,
    pathPart: 'payment',
  },
  { provider: primaryProvider }
);

const primaryPaymentMethod = new aws.apigateway.Method(
  `payment-method-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    resourceId: primaryPaymentResource.id,
    httpMethod: 'POST',
    authorization: 'NONE',
  },
  { provider: primaryProvider }
);

const primaryPaymentIntegration = new aws.apigateway.Integration(
  `payment-integration-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    resourceId: primaryPaymentResource.id,
    httpMethod: primaryPaymentMethod.httpMethod,
    type: 'AWS_PROXY',
    integrationHttpMethod: 'POST',
    uri: primaryPaymentLambda.invokeArn,
  },
  { provider: primaryProvider }
);

const primaryHealthResource = new aws.apigateway.Resource(
  `health-resource-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    parentId: primaryApi.rootResourceId,
    pathPart: 'health',
  },
  { provider: primaryProvider }
);

const primaryHealthMethod = new aws.apigateway.Method(
  `health-method-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    resourceId: primaryHealthResource.id,
    httpMethod: 'GET',
    authorization: 'NONE',
  },
  { provider: primaryProvider }
);

const primaryHealthIntegration = new aws.apigateway.Integration(
  `health-integration-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    resourceId: primaryHealthResource.id,
    httpMethod: primaryHealthMethod.httpMethod,
    type: 'AWS_PROXY',
    integrationHttpMethod: 'POST',
    uri: primaryHealthLambda.invokeArn,
  },
  { provider: primaryProvider }
);

const primaryDeployment = new aws.apigateway.Deployment(
  `api-deployment-primary-${environmentSuffix}`,
  {
    restApi: primaryApi.id,
    triggers: {
      redeployment: pulumi
        .all([primaryPaymentIntegration.id, primaryHealthIntegration.id])
        .apply(([p, h]) => JSON.stringify({ payment: p, health: h })),
    },
  },
  {
    provider: primaryProvider,
    dependsOn: [primaryPaymentIntegration, primaryHealthIntegration],
  }
);

const primaryApiLogGroup = new aws.cloudwatch.LogGroup(
  `api-gateway-primary-logs-${environmentSuffix}`,
  {
    name: `/aws/apigateway/payment-api-primary-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `api-gateway-primary-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const primaryStage = new aws.apigateway.Stage(
  `api-stage-primary-${environmentSuffix}`,
  {
    deployment: primaryDeployment.id,
    restApi: primaryApi.id,
    stageName: 'prod',
    xrayTracingEnabled: true,
    tags: {
      Name: `api-stage-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider, dependsOn: [primaryApiLogGroup] }
);

const _primaryPaymentPermission = new aws.lambda.Permission(
  `payment-lambda-permission-primary-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: primaryPaymentLambda.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${primaryApi.executionArn}/*/*`,
  },
  { provider: primaryProvider }
);

const _primaryHealthPermission = new aws.lambda.Permission(
  `health-lambda-permission-primary-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: primaryHealthLambda.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${primaryApi.executionArn}/*/*`,
  },
  { provider: primaryProvider }
);

// ========================================
// API Gateway - Secondary Region
// ========================================

const secondaryApi = new aws.apigateway.RestApi(
  `payment-api-secondary-${environmentSuffix}`,
  {
    name: `payment-api-secondary-${environmentSuffix}`,
    description: 'Payment processing API - Secondary Region',
    tags: {
      Name: `payment-api-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondaryPaymentResource = new aws.apigateway.Resource(
  `payment-resource-secondary-${environmentSuffix}`,
  {
    restApi: secondaryApi.id,
    parentId: secondaryApi.rootResourceId,
    pathPart: 'payment',
  },
  { provider: secondaryProvider }
);

const secondaryPaymentMethod = new aws.apigateway.Method(
  `payment-method-secondary-${environmentSuffix}`,
  {
    restApi: secondaryApi.id,
    resourceId: secondaryPaymentResource.id,
    httpMethod: 'POST',
    authorization: 'NONE',
  },
  { provider: secondaryProvider }
);

const secondaryPaymentIntegration = new aws.apigateway.Integration(
  `payment-integration-secondary-${environmentSuffix}`,
  {
    restApi: secondaryApi.id,
    resourceId: secondaryPaymentResource.id,
    httpMethod: secondaryPaymentMethod.httpMethod,
    type: 'AWS_PROXY',
    integrationHttpMethod: 'POST',
    uri: secondaryPaymentLambda.invokeArn,
  },
  { provider: secondaryProvider }
);

const secondaryHealthResource = new aws.apigateway.Resource(
  `health-resource-secondary-${environmentSuffix}`,
  {
    restApi: secondaryApi.id,
    parentId: secondaryApi.rootResourceId,
    pathPart: 'health',
  },
  { provider: secondaryProvider }
);

const secondaryHealthMethod = new aws.apigateway.Method(
  `health-method-secondary-${environmentSuffix}`,
  {
    restApi: secondaryApi.id,
    resourceId: secondaryHealthResource.id,
    httpMethod: 'GET',
    authorization: 'NONE',
  },
  { provider: secondaryProvider }
);

const secondaryHealthIntegration = new aws.apigateway.Integration(
  `health-integration-secondary-${environmentSuffix}`,
  {
    restApi: secondaryApi.id,
    resourceId: secondaryHealthResource.id,
    httpMethod: secondaryHealthMethod.httpMethod,
    type: 'AWS_PROXY',
    integrationHttpMethod: 'POST',
    uri: secondaryHealthLambda.invokeArn,
  },
  { provider: secondaryProvider }
);

const secondaryDeployment = new aws.apigateway.Deployment(
  `api-deployment-secondary-${environmentSuffix}`,
  {
    restApi: secondaryApi.id,
    triggers: {
      redeployment: pulumi
        .all([secondaryPaymentIntegration.id, secondaryHealthIntegration.id])
        .apply(([p, h]) => JSON.stringify({ payment: p, health: h })),
    },
  },
  {
    provider: secondaryProvider,
    dependsOn: [secondaryPaymentIntegration, secondaryHealthIntegration],
  }
);

const secondaryApiLogGroup = new aws.cloudwatch.LogGroup(
  `api-gateway-secondary-logs-${environmentSuffix}`,
  {
    name: `/aws/apigateway/payment-api-secondary-${environmentSuffix}`,
    retentionInDays: 7,
    tags: {
      Name: `api-gateway-secondary-logs-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const secondaryStage = new aws.apigateway.Stage(
  `api-stage-secondary-${environmentSuffix}`,
  {
    deployment: secondaryDeployment.id,
    restApi: secondaryApi.id,
    stageName: 'prod',
    xrayTracingEnabled: true,
    tags: {
      Name: `api-stage-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider, dependsOn: [secondaryApiLogGroup] }
);

const _secondaryPaymentPermission = new aws.lambda.Permission(
  `payment-lambda-permission-secondary-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: secondaryPaymentLambda.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${secondaryApi.executionArn}/*/*`,
  },
  { provider: secondaryProvider }
);

const _secondaryHealthPermission = new aws.lambda.Permission(
  `health-lambda-permission-secondary-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: secondaryHealthLambda.name,
    principal: 'apigateway.amazonaws.com',
    sourceArn: pulumi.interpolate`${secondaryApi.executionArn}/*/*`,
  },
  { provider: secondaryProvider }
);

// ========================================
// SNS Topics and Subscriptions
// ========================================

const primarySnsTopic = new aws.sns.Topic(
  `payment-failover-topic-primary-${environmentSuffix}`,
  {
    name: `payment-failover-topic-primary-${environmentSuffix}`,
    displayName: 'Payment API Failover Notifications - Primary',
    tags: {
      Name: `payment-failover-topic-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const _primarySnsSubscription = new aws.sns.TopicSubscription(
  `payment-sns-subscription-primary-${environmentSuffix}`,
  {
    topic: primarySnsTopic.arn,
    protocol: 'email',
    endpoint: notificationEmail,
  },
  { provider: primaryProvider }
);

const secondarySnsTopic = new aws.sns.Topic(
  `payment-failover-topic-secondary-${environmentSuffix}`,
  {
    name: `payment-failover-topic-secondary-${environmentSuffix}`,
    displayName: 'Payment API Failover Notifications - Secondary',
    tags: {
      Name: `payment-failover-topic-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const _secondarySnsSubscription = new aws.sns.TopicSubscription(
  `payment-sns-subscription-secondary-${environmentSuffix}`,
  {
    topic: secondarySnsTopic.arn,
    protocol: 'email',
    endpoint: notificationEmail,
  },
  { provider: secondaryProvider }
);

// ========================================
// Route53 Health Checks and Failover DNS
// ========================================

const primaryHealthCheck = new aws.route53.HealthCheck(
  `payment-health-check-primary-${environmentSuffix}`,
  {
    type: 'HTTPS',
    resourcePath: '/prod/health',
    fqdn: pulumi.interpolate`${primaryApi.id}.execute-api.${primaryRegion}.amazonaws.com`,
    port: 443,
    requestInterval: 30,
    failureThreshold: 3,
    measureLatency: true,
    tags: {
      Name: `payment-health-check-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const secondaryHealthCheck = new aws.route53.HealthCheck(
  `payment-health-check-secondary-${environmentSuffix}`,
  {
    type: 'HTTPS',
    resourcePath: '/prod/health',
    fqdn: pulumi.interpolate`${secondaryApi.id}.execute-api.${secondaryRegion}.amazonaws.com`,
    port: 443,
    requestInterval: 30,
    failureThreshold: 3,
    measureLatency: true,
    tags: {
      Name: `payment-health-check-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Create Route53 Hosted Zone
const hostedZone = new aws.route53.Zone(
  `payment-api-zone-${environmentSuffix}`,
  {
    name: hostedZoneDomain,
    comment: `Hosted zone for payment API failover - ${environmentSuffix}`,
    tags: {
      Name: `payment-api-zone-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

// Primary failover DNS record
const _primaryFailoverRecord = new aws.route53.Record(
  `payment-api-primary-record-${environmentSuffix}`,
  {
    zoneId: hostedZone.zoneId,
    name: hostedZoneDomain,
    type: 'CNAME',
    ttl: 60,
    setIdentifier: 'primary',
    failoverRoutingPolicies: [
      {
        type: 'PRIMARY',
      },
    ],
    healthCheckId: primaryHealthCheck.id,
    records: [
      pulumi.interpolate`${primaryApi.id}.execute-api.${primaryRegion}.amazonaws.com`,
    ],
  }
);

// Secondary failover DNS record
const _secondaryFailoverRecord = new aws.route53.Record(
  `payment-api-secondary-record-${environmentSuffix}`,
  {
    zoneId: hostedZone.zoneId,
    name: hostedZoneDomain,
    type: 'CNAME',
    ttl: 60,
    setIdentifier: 'secondary',
    failoverRoutingPolicies: [
      {
        type: 'SECONDARY',
      },
    ],
    healthCheckId: secondaryHealthCheck.id,
    records: [
      pulumi.interpolate`${secondaryApi.id}.execute-api.${secondaryRegion}.amazonaws.com`,
    ],
  }
);

// ========================================
// CloudWatch Alarms
// ========================================

const _primaryHealthAlarm = new aws.cloudwatch.MetricAlarm(
  `payment-health-alarm-primary-${environmentSuffix}`,
  {
    name: `payment-health-alarm-primary-${environmentSuffix}`,
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: 2,
    metricName: 'HealthCheckStatus',
    namespace: 'AWS/Route53',
    period: 60,
    statistic: 'Minimum',
    threshold: 1,
    alarmDescription: 'Alert when primary API health check fails',
    alarmActions: [primarySnsTopic.arn],
    dimensions: {
      HealthCheckId: primaryHealthCheck.id,
    },
    tags: {
      Name: `payment-health-alarm-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const _secondaryHealthAlarm = new aws.cloudwatch.MetricAlarm(
  `payment-health-alarm-secondary-${environmentSuffix}`,
  {
    name: `payment-health-alarm-secondary-${environmentSuffix}`,
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: 2,
    metricName: 'HealthCheckStatus',
    namespace: 'AWS/Route53',
    period: 60,
    statistic: 'Minimum',
    threshold: 1,
    alarmDescription: 'Alert when secondary API health check fails',
    alarmActions: [secondarySnsTopic.arn],
    dimensions: {
      HealthCheckId: secondaryHealthCheck.id,
    },
    tags: {
      Name: `payment-health-alarm-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const _primaryLatencyAlarm = new aws.cloudwatch.MetricAlarm(
  `payment-latency-alarm-primary-${environmentSuffix}`,
  {
    name: `payment-latency-alarm-primary-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Latency',
    namespace: 'AWS/ApiGateway',
    period: 300,
    statistic: 'Average',
    threshold: 500,
    alarmDescription: 'Alert when API latency exceeds 500ms',
    alarmActions: [primarySnsTopic.arn],
    dimensions: {
      ApiId: primaryApi.id,
      Stage: 'prod',
    },
    tags: {
      Name: `payment-latency-alarm-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider, dependsOn: [primaryStage] }
);

const _secondaryLatencyAlarm = new aws.cloudwatch.MetricAlarm(
  `payment-latency-alarm-secondary-${environmentSuffix}`,
  {
    name: `payment-latency-alarm-secondary-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'Latency',
    namespace: 'AWS/ApiGateway',
    period: 300,
    statistic: 'Average',
    threshold: 500,
    alarmDescription: 'Alert when API latency exceeds 500ms',
    alarmActions: [secondarySnsTopic.arn],
    dimensions: {
      ApiId: secondaryApi.id,
      Stage: 'prod',
    },
    tags: {
      Name: `payment-latency-alarm-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider, dependsOn: [secondaryStage] }
);

const _primaryErrorAlarm = new aws.cloudwatch.MetricAlarm(
  `payment-error-alarm-primary-${environmentSuffix}`,
  {
    name: `payment-error-alarm-primary-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: '5XXError',
    namespace: 'AWS/ApiGateway',
    period: 300,
    statistic: 'Sum',
    threshold: 10,
    alarmDescription: 'Alert when API error count exceeds threshold',
    alarmActions: [primarySnsTopic.arn],
    dimensions: {
      ApiId: primaryApi.id,
      Stage: 'prod',
    },
    tags: {
      Name: `payment-error-alarm-primary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider, dependsOn: [primaryStage] }
);

const _secondaryErrorAlarm = new aws.cloudwatch.MetricAlarm(
  `payment-error-alarm-secondary-${environmentSuffix}`,
  {
    name: `payment-error-alarm-secondary-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: '5XXError',
    namespace: 'AWS/ApiGateway',
    period: 300,
    statistic: 'Sum',
    threshold: 10,
    alarmDescription: 'Alert when API error count exceeds threshold',
    alarmActions: [secondarySnsTopic.arn],
    dimensions: {
      ApiId: secondaryApi.id,
      Stage: 'prod',
    },
    tags: {
      Name: `payment-error-alarm-secondary-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider, dependsOn: [secondaryStage] }
);

// ========================================
// CloudWatch Synthetics Canaries
// ========================================

const syntheticsRole = new aws.iam.Role(
  `synthetics-role-${environmentSuffix}`,
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
    tags: {
      Name: `synthetics-role-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  }
);

const primarySyntheticsBucket = new aws.s3.Bucket(
  `payment-synthetics-pri-${environmentSuffix}`,
  {
    bucket: `payment-synthetics-pri-${environmentSuffix}`,
    tags: {
      Name: `payment-synthetics-pri-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: primaryProvider }
);

const _primarySyntheticsBucketPublicAccessBlock =
  new aws.s3.BucketPublicAccessBlock(
    `primary-synthetics-public-access-block-${environmentSuffix}`,
    {
      bucket: primarySyntheticsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider: primaryProvider }
  );

const secondarySyntheticsBucket = new aws.s3.Bucket(
  `payment-synthetics-sec-${environmentSuffix}`,
  {
    bucket: `payment-synthetics-sec-${environmentSuffix}`,
    tags: {
      Name: `payment-synthetics-sec-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  { provider: secondaryProvider }
);

const _secondarySyntheticsBucketPublicAccessBlock =
  new aws.s3.BucketPublicAccessBlock(
    `secondary-synthetics-public-access-block-${environmentSuffix}`,
    {
      bucket: secondarySyntheticsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    },
    { provider: secondaryProvider }
  );

const syntheticsPolicy = new aws.iam.RolePolicy(
  `synthetics-policy-${environmentSuffix}`,
  {
    role: syntheticsRole.id,
    policy: pulumi
      .all([primarySyntheticsBucket.arn, secondarySyntheticsBucket.arn])
      .apply(([primaryArn, secondaryArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:GetBucketLocation'],
              Resource: [`${primaryArn}/*`, `${secondaryArn}/*`],
            },
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:CreateLogGroup',
              ],
              Resource: 'arn:aws:logs:*:*:log-group:/aws/lambda/cwsyn-*',
            },
            {
              Effect: 'Allow',
              Action: ['s3:ListAllMyBuckets', 'xray:PutTraceSegments'],
              Resource: '*',
            },
            {
              Effect: 'Allow',
              Action: ['cloudwatch:PutMetricData'],
              Resource: '*',
              Condition: {
                StringEquals: {
                  'cloudwatch:namespace': 'CloudWatchSynthetics',
                },
              },
            },
          ],
        })
      ),
  }
);

// Primary region canary
const _primaryCanary = new aws.synthetics.Canary(
  `pay-canary-pri-${environmentSuffix}`,
  {
    name: `pay-canary-pri-${environmentSuffix}`
      .substring(0, 21)
      .replace(/_/g, '-'),
    artifactS3Location: pulumi.interpolate`s3://${primarySyntheticsBucket.bucket}/`,
    executionRoleArn: syntheticsRole.arn,
    handler: 'apiCanary.handler',
    runtimeVersion: 'syn-nodejs-puppeteer-6.0',
    schedule: {
      expression: 'rate(5 minutes)',
    },
    runConfig: {
      timeoutInSeconds: 60,
      memoryInMb: 960,
      activeTracing: true,
    },
    startCanary: true,
    tags: {
      Name: `pay-canary-pri-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    provider: primaryProvider,
    dependsOn: [syntheticsPolicy, primaryStage],
  }
);

// Secondary region canary
const _secondaryCanary = new aws.synthetics.Canary(
  `pay-canary-sec-${environmentSuffix}`,
  {
    name: `pay-canary-sec-${environmentSuffix}`
      .substring(0, 21)
      .replace(/_/g, '-'),
    artifactS3Location: pulumi.interpolate`s3://${secondarySyntheticsBucket.bucket}/`,
    executionRoleArn: syntheticsRole.arn,
    handler: 'apiCanary.handler',
    runtimeVersion: 'syn-nodejs-puppeteer-6.0',
    schedule: {
      expression: 'rate(5 minutes)',
    },
    runConfig: {
      timeoutInSeconds: 60,
      memoryInMb: 960,
      activeTracing: true,
    },
    startCanary: true,
    tags: {
      Name: `pay-canary-sec-${environmentSuffix}`,
      Environment: environmentSuffix,
    },
  },
  {
    provider: secondaryProvider,
    dependsOn: [syntheticsPolicy, secondaryStage],
  }
);

// ========================================
// Exports
// ========================================

export const primaryApiUrl = pulumi.interpolate`https://${primaryApi.id}.execute-api.${primaryRegion}.amazonaws.com/prod`;
export const secondaryApiUrl = pulumi.interpolate`https://${secondaryApi.id}.execute-api.${secondaryRegion}.amazonaws.com/prod`;
export const failoverDomain = hostedZoneDomain;
export const hostedZoneId = hostedZone.zoneId;
export const hostedZoneNameServers = hostedZone.nameServers;
export const transactionTableName = transactionTable.name;
export const primaryAuditBucketName = primaryAuditBucket.bucket;
export const secondaryAuditBucketName = secondaryAuditBucket.bucket;
export const secretArn = apiSecret.arn;
export const primaryHealthCheckId = primaryHealthCheck.id;
export const secondaryHealthCheckId = secondaryHealthCheck.id;
export const primarySnsTopicArn = primarySnsTopic.arn;
export const secondarySnsTopicArn = secondarySnsTopic.arn;
