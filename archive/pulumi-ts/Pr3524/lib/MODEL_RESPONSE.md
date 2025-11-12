I'll create a comprehensive Pulumi TypeScript infrastructure for your software distribution platform. Here's the complete implementation:

## lib/tap-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { StorageStack } from './storage-stack';
import { DistributionStack } from './distribution-stack';
import { DatabaseStack } from './database-stack';
import { ApiStack } from './api-stack';
import { LambdaStack } from './lambda-stack';
import { MonitoringStack } from './monitoring-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create storage resources
    const storageStack = new StorageStack('storage', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create database resources
    const databaseStack = new DatabaseStack('database', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create monitoring stack
    const monitoringStack = new MonitoringStack('monitoring', {
      environmentSuffix,
      tags,
    }, { parent: this });

    // Create Lambda functions
    const lambdaStack = new LambdaStack('lambda', {
      environmentSuffix,
      licensesTableArn: databaseStack.licensesTableArn,
      analyticsTableArn: databaseStack.analyticsTableArn,
      logGroupArns: monitoringStack.logGroupArns,
      tags,
    }, { parent: this });

    // Create CloudFront distribution
    const distributionStack = new DistributionStack('distribution', {
      environmentSuffix,
      bucketId: storageStack.bucketId,
      bucketArn: storageStack.bucketArn,
      bucketDomainName: storageStack.bucketDomainName,
      edgeLambdaArn: lambdaStack.edgeLambdaQualifiedArn,
      logsBucketDomainName: storageStack.logsBucketDomainName,
      tags,
    }, { parent: this });

    // Create API Gateway
    const apiStack = new ApiStack('api', {
      environmentSuffix,
      licenseApiLambdaArn: lambdaStack.licenseApiLambdaArn,
      licenseApiLambdaName: lambdaStack.licenseApiLambdaName,
      usageTrackingLambdaArn: lambdaStack.usageTrackingLambdaArn,
      usageTrackingLambdaName: lambdaStack.usageTrackingLambdaName,
      tags,
    }, { parent: this });

    this.bucketName = storageStack.bucketName;
    this.distributionUrl = distributionStack.distributionUrl;
    this.apiUrl = apiStack.apiUrl;

    this.registerOutputs({
      bucketName: this.bucketName,
      distributionUrl: this.distributionUrl,
      apiUrl: this.apiUrl,
    });
  }
}
```

## lib/storage-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly bucketId: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketDomainName: pulumi.Output<string>;
  public readonly logsBucketDomainName: pulumi.Output<string>;

  constructor(name: string, args: StorageStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:storage:StorageStack', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create logs bucket for CloudFront
    const logsBucket = new aws.s3.Bucket(`software-dist-logs-${environmentSuffix}`, {
      acl: 'private',
      lifecycleRules: [{
        enabled: true,
        expiration: { days: 30 },
      }],
      tags,
    }, { parent: this });

    // Create main storage bucket with intelligent tiering
    const storageBucket = new aws.s3.Bucket(`software-dist-binaries-${environmentSuffix}`, {
      versioning: {
        enabled: true,
      },
      lifecycleRules: [{
        enabled: true,
        transitions: [
          {
            days: 0,
            storageClass: 'INTELLIGENT_TIERING',
          },
        ],
      }],
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags,
    }, { parent: this });

    // Configure bucket public access block
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `software-dist-pab-${environmentSuffix}`,
      {
        bucket: storageBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create Origin Access Control for CloudFront
    const oac = new aws.cloudfront.OriginAccessControl(`software-dist-oac-${environmentSuffix}`, {
      description: 'OAC for Software Distribution',
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    }, { parent: this });

    // Bucket policy to allow only CloudFront access
    const bucketPolicy = new aws.s3.BucketPolicy(
      `software-dist-policy-${environmentSuffix}`,
      {
        bucket: storageBucket.id,
        policy: pulumi.all([storageBucket.arn, oac.id]).apply(([bucketArn, oacId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AllowCloudFrontServicePrincipal',
                Effect: 'Allow',
                Principal: {
                  Service: 'cloudfront.amazonaws.com',
                },
                Action: 's3:GetObject',
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: {
                    'AWS:SourceArn': `arn:aws:cloudfront::*:distribution/*`,
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this, dependsOn: [bucketPublicAccessBlock] }
    );

    this.bucketId = storageBucket.id;
    this.bucketArn = storageBucket.arn;
    this.bucketName = storageBucket.bucket;
    this.bucketDomainName = storageBucket.bucketDomainName;
    this.logsBucketDomainName = logsBucket.bucketDomainName;

    this.registerOutputs({
      bucketId: this.bucketId,
      bucketArn: this.bucketArn,
      bucketName: this.bucketName,
    });
  }
}
```

## lib/database-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DatabaseStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DatabaseStack extends pulumi.ComponentResource {
  public readonly licensesTableArn: pulumi.Output<string>;
  public readonly analyticsTableArn: pulumi.Output<string>;

  constructor(name: string, args: DatabaseStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:database:DatabaseStack', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create DynamoDB table for license validation
    const licensesTable = new aws.dynamodb.Table(`licenses-${environmentSuffix}`, {
      attributes: [
        { name: 'licenseKey', type: 'S' },
        { name: 'customerId', type: 'S' },
      ],
      hashKey: 'licenseKey',
      rangeKey: 'customerId',
      billingMode: 'PAY_PER_REQUEST',
      pointInTimeRecovery: { enabled: true },
      serverSideEncryption: { enabled: true },
      tags,
    }, { parent: this });

    // Create DynamoDB table for download analytics
    const analyticsTable = new aws.dynamodb.Table(`download-analytics-${environmentSuffix}`, {
      attributes: [
        { name: 'downloadId', type: 'S' },
        { name: 'timestamp', type: 'N' },
        { name: 'customerId', type: 'S' },
      ],
      hashKey: 'downloadId',
      rangeKey: 'timestamp',
      billingMode: 'PAY_PER_REQUEST',
      globalSecondaryIndexes: [
        {
          name: 'CustomerIndex',
          hashKey: 'customerId',
          rangeKey: 'timestamp',
          projectionType: 'ALL',
        },
      ],
      serverSideEncryption: { enabled: true },
      tags,
    }, { parent: this });

    this.licensesTableArn = licensesTable.arn;
    this.analyticsTableArn = analyticsTable.arn;

    this.registerOutputs({
      licensesTableArn: this.licensesTableArn,
      analyticsTableArn: this.analyticsTableArn,
    });
  }
}
```

## lib/lambda-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface LambdaStackArgs {
  environmentSuffix: string;
  licensesTableArn: pulumi.Output<string>;
  analyticsTableArn: pulumi.Output<string>;
  logGroupArns: pulumi.Output<string[]>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class LambdaStack extends pulumi.ComponentResource {
  public readonly edgeLambdaQualifiedArn: pulumi.Output<string>;
  public readonly licenseApiLambdaArn: pulumi.Output<string>;
  public readonly licenseApiLambdaName: pulumi.Output<string>;
  public readonly usageTrackingLambdaArn: pulumi.Output<string>;
  public readonly usageTrackingLambdaName: pulumi.Output<string>;

  constructor(name: string, args: LambdaStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:lambda:LambdaStack', name, {}, opts);

    const { environmentSuffix, licensesTableArn, analyticsTableArn, tags } = args;

    // Create IAM role for Lambda@Edge
    const edgeLambdaRole = new aws.iam.Role(`edge-lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: {
            Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
          },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags,
    }, { parent: this });

    // Attach basic execution policy
    new aws.iam.RolePolicyAttachment(`edge-lambda-basic-${environmentSuffix}`, {
      role: edgeLambdaRole,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    // DynamoDB access policy for edge lambda
    new aws.iam.RolePolicy(`edge-lambda-dynamodb-${environmentSuffix}`, {
      role: edgeLambdaRole,
      policy: licensesTableArn.apply(arn => JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['dynamodb:GetItem', 'dynamodb:Query'],
          Resource: arn,
        }],
      })),
    }, { parent: this });

    // Create Lambda@Edge function for license verification
    const edgeLambda = new aws.lambda.Function(`license-verify-edge-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: edgeLambdaRole.arn,
      timeout: 5,
      memorySize: 128,
      publish: true,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient({ region: 'us-east-1' });

exports.handler = async (event) => {
  const request = event.Records[0].cf.request;
  const headers = request.headers;

  try {
    const licenseKey = headers['x-license-key'] ? headers['x-license-key'][0].value : null;
    const customerId = headers['x-customer-id'] ? headers['x-customer-id'][0].value : null;

    if (!licenseKey || !customerId) {
      return {
        status: '403',
        statusDescription: 'Forbidden',
        body: 'Missing authentication headers',
      };
    }

    const params = {
      TableName: 'licenses-${environmentSuffix}',
      Key: {
        licenseKey: licenseKey,
        customerId: customerId,
      },
    };

    const result = await dynamodb.get(params).promise();

    if (!result.Item || result.Item.status !== 'active') {
      return {
        status: '403',
        statusDescription: 'Forbidden',
        body: 'Invalid or expired license',
      };
    }

    return request;
  } catch (error) {
    console.error('License verification error:', error);
    return {
      status: '500',
      statusDescription: 'Internal Server Error',
      body: 'License verification failed',
    };
  }
};
        `),
      }),
      tags,
    }, { parent: this });

    // Create IAM role for regular Lambda functions
    const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags,
    }, { parent: this });

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(`lambda-basic-${environmentSuffix}`, {
      role: lambdaRole,
      policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    }, { parent: this });

    // DynamoDB access policy
    new aws.iam.RolePolicy(`lambda-dynamodb-${environmentSuffix}`, {
      role: lambdaRole,
      policy: pulumi.all([licensesTableArn, analyticsTableArn]).apply(([licenses, analytics]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:Query',
              'dynamodb:UpdateItem',
            ],
            Resource: [licenses, analytics],
          }],
        })
      ),
    }, { parent: this });

    // Create Lambda function for license API
    const licenseApiLambda = new aws.lambda.Function(`license-api-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 10,
      memorySize: 256,
      environment: {
        variables: {
          LICENSES_TABLE: `licenses-${environmentSuffix}`,
        },
      },
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
  const { httpMethod, path, body } = event;

  try {
    if (httpMethod === 'POST' && path === '/licenses/validate') {
      const { licenseKey, customerId } = JSON.parse(body || '{}');

      const params = {
        TableName: process.env.LICENSES_TABLE,
        Key: { licenseKey, customerId },
      };

      const result = await dynamodb.get(params).promise();

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valid: result.Item && result.Item.status === 'active',
          license: result.Item || null,
        }),
      };
    }

    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Not Found' }),
    };
  } catch (error) {
    console.error('API Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
        `),
      }),
      tags,
    }, { parent: this });

    // Create Lambda function for usage tracking
    const usageTrackingLambda = new aws.lambda.Function(`usage-tracking-${environmentSuffix}`, {
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 10,
      memorySize: 256,
      environment: {
        variables: {
          ANALYTICS_TABLE: `download-analytics-${environmentSuffix}`,
        },
      },
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
  const { body } = event;

  try {
    const data = JSON.parse(body || '{}');
    const { customerId, fileName, region } = data;

    const params = {
      TableName: process.env.ANALYTICS_TABLE,
      Item: {
        downloadId: uuidv4(),
        timestamp: Date.now(),
        customerId,
        fileName,
        region: region || 'us-east-1',
        userAgent: event.headers['User-Agent'] || 'unknown',
      },
    };

    await dynamodb.put(params).promise();

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Usage tracked successfully' }),
    };
  } catch (error) {
    console.error('Tracking Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to track usage' }),
    };
  }
};
        `),
      }),
      tags,
    }, { parent: this });

    this.edgeLambdaQualifiedArn = edgeLambda.qualifiedArn;
    this.licenseApiLambdaArn = licenseApiLambda.arn;
    this.licenseApiLambdaName = licenseApiLambda.name;
    this.usageTrackingLambdaArn = usageTrackingLambda.arn;
    this.usageTrackingLambdaName = usageTrackingLambda.name;

    this.registerOutputs({
      edgeLambdaQualifiedArn: this.edgeLambdaQualifiedArn,
      licenseApiLambdaArn: this.licenseApiLambdaArn,
      usageTrackingLambdaArn: this.usageTrackingLambdaArn,
    });
  }
}
```

## lib/distribution-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DistributionStackArgs {
  environmentSuffix: string;
  bucketId: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
  bucketDomainName: pulumi.Output<string>;
  edgeLambdaArn: pulumi.Output<string>;
  logsBucketDomainName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DistributionStack extends pulumi.ComponentResource {
  public readonly distributionUrl: pulumi.Output<string>;
  public readonly distributionId: pulumi.Output<string>;

  constructor(name: string, args: DistributionStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:distribution:DistributionStack', name, {}, opts);

    const {
      environmentSuffix,
      bucketId,
      bucketDomainName,
      edgeLambdaArn,
      logsBucketDomainName,
      tags,
    } = args;

    // Create CloudFront key pair for signed URLs
    const signingSecret = new aws.secretsmanager.Secret(`cf-signing-key-${environmentSuffix}`, {
      description: 'CloudFront signing key for software distribution',
      tags,
    }, { parent: this });

    // Create CloudFront public key
    const publicKey = new aws.cloudfront.PublicKey(`signing-key-${environmentSuffix}`, {
      encodedKey: pulumi.output(`-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAr5bm7rC1FDrX8G6P9yKu
3V4vFOY1zZ5R3N8Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q
2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q
2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q
2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q2Z9Y3N4Q
-----END PUBLIC KEY-----`),
      comment: `Public key for ${environmentSuffix} environment`,
    }, { parent: this });

    // Create CloudFront key group
    const keyGroup = new aws.cloudfront.KeyGroup(`signing-key-group-${environmentSuffix}`, {
      items: [publicKey.id],
      comment: `Key group for ${environmentSuffix} environment`,
    }, { parent: this });

    // Create Origin Access Control
    const oac = new aws.cloudfront.OriginAccessControl(`dist-oac-${environmentSuffix}`, {
      description: 'OAC for Software Distribution',
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    }, { parent: this });

    // Create CloudFront distribution
    const distribution = new aws.cloudfront.Distribution(`software-dist-${environmentSuffix}`, {
      enabled: true,
      isIpv6Enabled: true,
      comment: `Software distribution for ${environmentSuffix}`,
      defaultRootObject: 'index.html',

      origins: [{
        domainName: bucketDomainName,
        originId: 's3-origin',
        s3OriginConfig: {
          originAccessIdentity: '',
        },
        originAccessControlId: oac.id,
      }],

      defaultCacheBehavior: {
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        targetOriginId: 's3-origin',
        viewerProtocolPolicy: 'redirect-to-https',
        trustedKeyGroups: [keyGroup.id],

        forwardedValues: {
          queryString: false,
          cookies: { forward: 'none' },
        },

        minTtl: 0,
        defaultTtl: 86400,
        maxTtl: 31536000,
        compress: true,

        lambdaFunctionAssociations: [{
          eventType: 'viewer-request',
          lambdaArn: edgeLambdaArn,
          includeBody: false,
        }],
      },

      restrictions: {
        geoRestriction: {
          restrictionType: 'none',
        },
      },

      viewerCertificate: {
        cloudfrontDefaultCertificate: true,
      },

      loggingConfig: {
        bucket: logsBucketDomainName,
        prefix: 'cloudfront-logs/',
      },

      tags,
    }, { parent: this });

    this.distributionUrl = distribution.domainName;
    this.distributionId = distribution.id;

    this.registerOutputs({
      distributionUrl: this.distributionUrl,
      distributionId: this.distributionId,
    });
  }
}
```

## lib/api-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ApiStackArgs {
  environmentSuffix: string;
  licenseApiLambdaArn: pulumi.Output<string>;
  licenseApiLambdaName: pulumi.Output<string>;
  usageTrackingLambdaArn: pulumi.Output<string>;
  usageTrackingLambdaName: pulumi.Output<string>;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ApiStack extends pulumi.ComponentResource {
  public readonly apiUrl: pulumi.Output<string>;

  constructor(name: string, args: ApiStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:api:ApiStack', name, {}, opts);

    const {
      environmentSuffix,
      licenseApiLambdaArn,
      licenseApiLambdaName,
      usageTrackingLambdaArn,
      usageTrackingLambdaName,
      tags,
    } = args;

    // Create API Gateway REST API
    const api = new aws.apigateway.RestApi(`software-dist-api-${environmentSuffix}`, {
      description: 'API for software distribution platform',
      endpointConfiguration: {
        types: 'REGIONAL',
      },
      tags,
    }, { parent: this });

    // Create /licenses resource
    const licensesResource = new aws.apigateway.Resource(`licenses-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: 'licenses',
    }, { parent: this });

    // Create /licenses/validate resource
    const validateResource = new aws.apigateway.Resource(`validate-${environmentSuffix}`, {
      restApi: api.id,
      parentId: licensesResource.id,
      pathPart: 'validate',
    }, { parent: this });

    // Create /usage resource
    const usageResource = new aws.apigateway.Resource(`usage-${environmentSuffix}`, {
      restApi: api.id,
      parentId: api.rootResourceId,
      pathPart: 'usage',
    }, { parent: this });

    // Create /usage/track resource
    const trackResource = new aws.apigateway.Resource(`track-${environmentSuffix}`, {
      restApi: api.id,
      parentId: usageResource.id,
      pathPart: 'track',
    }, { parent: this });

    // Create Lambda permission for license API
    const licenseApiPermission = new aws.lambda.Permission(`license-api-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: licenseApiLambdaName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }, { parent: this });

    // Create Lambda permission for usage tracking
    const usageTrackingPermission = new aws.lambda.Permission(`usage-tracking-permission-${environmentSuffix}`, {
      action: 'lambda:InvokeFunction',
      function: usageTrackingLambdaName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }, { parent: this });

    // Create POST method for /licenses/validate
    const validateMethod = new aws.apigateway.Method(`validate-post-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: validateResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    }, { parent: this });

    // Create integration for license validation
    const validateIntegration = new aws.apigateway.Integration(`validate-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: validateResource.id,
      httpMethod: validateMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: licenseApiLambdaArn.apply(arn =>
        `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${arn}/invocations`
      ),
    }, { parent: this, dependsOn: [licenseApiPermission] });

    // Create POST method for /usage/track
    const trackMethod = new aws.apigateway.Method(`track-post-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: trackResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    }, { parent: this });

    // Create integration for usage tracking
    const trackIntegration = new aws.apigateway.Integration(`track-integration-${environmentSuffix}`, {
      restApi: api.id,
      resourceId: trackResource.id,
      httpMethod: trackMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: usageTrackingLambdaArn.apply(arn =>
        `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/${arn}/invocations`
      ),
    }, { parent: this, dependsOn: [usageTrackingPermission] });

    // Deploy the API
    const deployment = new aws.apigateway.Deployment(`api-deployment-${environmentSuffix}`, {
      restApi: api.id,
      triggers: {
        redeployment: pulumi.all([
          validateMethod.id,
          validateIntegration.id,
          trackMethod.id,
          trackIntegration.id,
        ]).apply(ids => JSON.stringify(ids)),
      },
    }, { parent: this, dependsOn: [validateIntegration, trackIntegration] });

    // Create stage
    const stage = new aws.apigateway.Stage(`api-stage-${environmentSuffix}`, {
      deployment: deployment.id,
      restApi: api.id,
      stageName: environmentSuffix,
      xrayTracingEnabled: true,
      tags,
    }, { parent: this });

    this.apiUrl = pulumi.interpolate`https://${api.id}.execute-api.us-east-1.amazonaws.com/${stage.stageName}`;

    this.registerOutputs({
      apiUrl: this.apiUrl,
    });
  }
}
```

## lib/monitoring-stack.ts
```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly logGroupArns: pulumi.Output<string[]>;
  public readonly dashboardName: pulumi.Output<string>;

  constructor(name: string, args: MonitoringStackArgs, opts?: pulumi.ComponentResourceOptions) {
    super('tap:monitoring:MonitoringStack', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create CloudWatch log groups
    const edgeLambdaLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/license-verify-edge-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    const licenseApiLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/license-api-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    const usageTrackingLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/lambda/usage-tracking-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    const apiGatewayLogGroup = new aws.cloudwatch.LogGroup(
      `/aws/apigateway/software-dist-${environmentSuffix}`,
      {
        retentionInDays: 7,
        tags,
      },
      { parent: this }
    );

    // Create CloudWatch dashboard
    const dashboard = new aws.cloudwatch.Dashboard(
      `software-dist-dashboard-${environmentSuffix}`,
      {
        dashboardName: `software-distribution-${environmentSuffix}`,
        dashboardBody: JSON.stringify({
          widgets: [
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/Lambda', 'Invocations', { stat: 'Sum', label: 'License Verifications' }],
                  ['.', 'Errors', { stat: 'Sum', label: 'Errors' }],
                  ['.', 'Duration', { stat: 'Average', label: 'Avg Duration' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'Lambda Performance',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/ApiGateway', '4XXError', { stat: 'Sum', label: '4XX Errors' }],
                  ['.', '5XXError', { stat: 'Sum', label: '5XX Errors' }],
                  ['.', 'Count', { stat: 'Sum', label: 'API Calls' }],
                ],
                period: 300,
                stat: 'Sum',
                region: 'us-east-1',
                title: 'API Gateway Metrics',
              },
            },
            {
              type: 'metric',
              properties: {
                metrics: [
                  ['AWS/CloudFront', 'Requests', { stat: 'Sum', label: 'Total Requests' }],
                  ['.', 'BytesDownloaded', { stat: 'Sum', label: 'Bytes Downloaded' }],
                  ['.', '4xxErrorRate', { stat: 'Average', label: '4xx Error Rate' }],
                  ['.', '5xxErrorRate', { stat: 'Average', label: '5xx Error Rate' }],
                ],
                period: 300,
                stat: 'Average',
                region: 'us-east-1',
                title: 'CloudFront Distribution',
              },
            },
            {
              type: 'log',
              properties: {
                query: `SOURCE '/aws/lambda/license-verify-edge-${environmentSuffix}'
                | fields @timestamp, @message
                | filter @message like /ERROR/
                | sort @timestamp desc
                | limit 20`,
                region: 'us-east-1',
                title: 'Recent Errors',
              },
            },
          ],
        }),
      },
      { parent: this }
    );

    // Create metric alarms
    const highErrorRateAlarm = new aws.cloudwatch.MetricAlarm(
      `high-error-rate-${environmentSuffix}`,
      {
        alarmDescription: 'Alert when Lambda error rate is high',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'Errors',
        namespace: 'AWS/Lambda',
        period: 300,
        statistic: 'Sum',
        threshold: 10,
        treatMissingData: 'notBreaching',
        tags,
      },
      { parent: this }
    );

    const apiThrottlingAlarm = new aws.cloudwatch.MetricAlarm(
      `api-throttling-${environmentSuffix}`,
      {
        alarmDescription: 'Alert when API is being throttled',
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 1,
        metricName: '4XXError',
        namespace: 'AWS/ApiGateway',
        period: 300,
        statistic: 'Sum',
        threshold: 100,
        treatMissingData: 'notBreaching',
        tags,
      },
      { parent: this }
    );

    this.logGroupArns = pulumi.all([
      edgeLambdaLogGroup.arn,
      licenseApiLogGroup.arn,
      usageTrackingLogGroup.arn,
      apiGatewayLogGroup.arn,
    ]);

    this.dashboardName = dashboard.dashboardName;

    this.registerOutputs({
      logGroupArns: this.logGroupArns,
      dashboardName: this.dashboardName,
    });
  }
}