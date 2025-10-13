import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

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
  public readonly signedUrlLambdaArn: pulumi.Output<string>;
  public readonly signedUrlLambdaName: pulumi.Output<string>;

  constructor(
    name: string,
    args: LambdaStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:lambda:LambdaStack', name, {}, opts);

    const { environmentSuffix, licensesTableArn, analyticsTableArn, tags } =
      args;

    // Create IAM role for Lambda@Edge
    const edgeLambdaRole = new aws.iam.Role(
      `edge-lambda-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: ['lambda.amazonaws.com', 'edgelambda.amazonaws.com'],
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags,
      },
      { parent: this }
    );

    // Attach basic execution policy
    new aws.iam.RolePolicyAttachment(
      `edge-lambda-basic-${environmentSuffix}`,
      {
        role: edgeLambdaRole,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // DynamoDB access policy for edge lambda
    new aws.iam.RolePolicy(
      `edge-lambda-dynamodb-${environmentSuffix}`,
      {
        role: edgeLambdaRole,
        policy: licensesTableArn.apply(arn =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['dynamodb:GetItem', 'dynamodb:Query'],
                Resource: arn,
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create Lambda@Edge function for license verification
    const edgeLambda = new aws.lambda.Function(
      `license-verify-edge-fixed-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: edgeLambdaRole.arn,
        timeout: 5,
        memorySize: 128,
        publish: true,
        skipDestroy: true, // Skip deletion for Lambda@Edge functions to avoid replication issues
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
      },
      {
        parent: this,
        ignoreChanges: [
          'arn',
          'lastModified',
          'version',
          'qualifiedArn',
          'invokeArn',
          'codeSigningConfigArn',
          'imageUri',
          'signingJobArn',
          'signingProfileVersionArn',
          'sourceCodeHash',
          'sourceCodeSize',
          'environment',
          'vpcConfig',
          'layers',
          'kmsKeyArn',
          'architectures',
          'code',
          'handler',
          'runtime',
          'publish',
          'timeout',
          'memorySize',
        ],
        retainOnDelete: true,
        replaceOnChanges: [],
        deleteBeforeReplace: false,
      }
    );

    // Create IAM role for regular Lambda functions
    const lambdaRole = new aws.iam.Role(
      `lambda-role-${environmentSuffix}`,
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
        tags,
      },
      { parent: this }
    );

    // Attach policies to Lambda role
    new aws.iam.RolePolicyAttachment(
      `lambda-basic-${environmentSuffix}`,
      {
        role: lambdaRole,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // DynamoDB access policy
    new aws.iam.RolePolicy(
      `lambda-dynamodb-${environmentSuffix}`,
      {
        role: lambdaRole,
        policy: pulumi
          .all([licensesTableArn, analyticsTableArn])
          .apply(([licenses, analytics]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'dynamodb:GetItem',
                    'dynamodb:PutItem',
                    'dynamodb:Query',
                    'dynamodb:UpdateItem',
                  ],
                  Resource: [licenses, analytics],
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Create Lambda function for license API
    const licenseApiLambda = new aws.lambda.Function(
      `license-api-${environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // Create Lambda function for usage tracking
    const usageTrackingLambda = new aws.lambda.Function(
      `usage-tracking-${environmentSuffix}`,
      {
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
      },
      { parent: this }
    );

    // Create Lambda function for signed URL generation
    const signedUrlLambda = new aws.lambda.Function(
      `signed-url-generator-${environmentSuffix}`,
      {
        runtime: 'nodejs18.x',
        handler: 'index.handler',
        role: lambdaRole.arn,
        timeout: 30,
        memorySize: 512,
        environment: {
          variables: {
            DISTRIBUTION_DOMAIN: 'REPLACE_WITH_DISTRIBUTION_DOMAIN',
            CLOUDFRONT_KEY_PAIR_ID: 'REPLACE_WITH_KEY_PAIR_ID',
            SIGNING_KEY_SECRET_ARN: 'REPLACE_WITH_SIGNING_KEY_SECRET_ARN',
          },
        },
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
const AWS = require('aws-sdk');
const crypto = require('crypto');

const secretsManager = new AWS.SecretsManager();

exports.handler = async (event) => {
  try {
    const { filePath, expirationMinutes = 15 } = JSON.parse(event.body || '{}');
    
    if (!filePath) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File path is required' }),
      };
    }

    // Calculate expiration time (default 15 minutes from now)
    const expiration = Math.floor(Date.now() / 1000) + (expirationMinutes * 60);
    
    // Get configuration from environment
    const distributionDomain = process.env.DISTRIBUTION_DOMAIN;
    const keyPairId = process.env.CLOUDFRONT_KEY_PAIR_ID;
    const signingKeySecretArn = process.env.SIGNING_KEY_SECRET_ARN;

    if (!distributionDomain || !keyPairId || !signingKeySecretArn) {
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'CloudFront configuration incomplete' }),
      };
    }

    // Construct the resource URL
    const resourceUrl = \`https://\${distributionDomain}/\${filePath.replace(/^\\//, '')}\`;

    // Create the policy for the signed URL
    const policy = {
      Statement: [
        {
          Resource: resourceUrl,
          Condition: {
            DateLessThan: {
              'AWS:EpochTime': expiration,
            },
          },
        },
      ],
    };

    const policyString = JSON.stringify(policy).replace(/\\s/g, '');
    const base64Policy = Buffer.from(policyString).toString('base64')
      .replace(/\\+/g, '-')
      .replace(/\\//g, '_')
      .replace(/=/g, '');

    // In production, retrieve private key from Secrets Manager and create signature
    // For now, return a URL structure that would work with proper signing
    const signedUrl = \`\${resourceUrl}?Expires=\${expiration}&Policy=\${base64Policy}&Key-Pair-Id=\${keyPairId}&Signature=SIGNATURE_PLACEHOLDER\`;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        signedUrl,
        expiresAt: new Date(expiration * 1000).toISOString(),
        resourceUrl,
        policy: policyString,
        message: 'Note: This is a template. In production, implement proper RSA signing with private key from Secrets Manager.'
      }),
    };
  } catch (error) {
    console.error('Signed URL Generation Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Failed to generate signed URL', details: error.message }),
    };
  }
};
        `),
        }),
        tags,
      },
      { parent: this }
    );

    this.edgeLambdaQualifiedArn = edgeLambda.qualifiedArn;
    this.licenseApiLambdaArn = licenseApiLambda.arn;
    this.licenseApiLambdaName = licenseApiLambda.name;
    this.usageTrackingLambdaArn = usageTrackingLambda.arn;
    this.usageTrackingLambdaName = usageTrackingLambda.name;
    this.signedUrlLambdaArn = signedUrlLambda.arn;
    this.signedUrlLambdaName = signedUrlLambda.name;

    this.registerOutputs({
      edgeLambdaQualifiedArn: this.edgeLambdaQualifiedArn,
      licenseApiLambdaArn: this.licenseApiLambdaArn,
      usageTrackingLambdaArn: this.usageTrackingLambdaArn,
      signedUrlLambdaArn: this.signedUrlLambdaArn,
    });
  }
}
