import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { CloudfrontOriginAccessControl } from '@cdktf/provider-aws/lib/cloudfront-origin-access-control';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { DataAwsRegion } from '@cdktf/provider-aws/lib/data-aws-region';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioning } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { AssetType, TerraformAsset } from 'cdktf';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ServerlessCmsProps {
  readonly providerAlias: string;
}

export class ServerlessCms extends Construct {
  constructor(scope: Construct, id: string, props: ServerlessCmsProps) {
    super(scope, id);

    // Get current AWS account ID and region
    const callerIdentity = new DataAwsCallerIdentity(this, 'current', {
      provider: props.providerAlias,
    });

    const currentRegion = new DataAwsRegion(this, 'current-region', {
      provider: props.providerAlias,
    });

    // Naming convention: cms-<env>-<region>
    const resourcePrefix = `cms-${props.environment}-${props.region}`;

    // Create Lambda function assets
    const lambdaAsset = new TerraformAsset(this, 'lambda-asset', {
      path: path.resolve(__dirname, 'lambda'),
      type: AssetType.ARCHIVE,
    });

    // IAM Role for Lambda functions
    const lambdaRole = new IamRole(this, 'lambda-role', {
      provider: props.providerAlias,
      name: `${resourcePrefix}-lambda-role`,
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
        Environment: props.environment,
        Region: props.region,
      },
    });

    // Attach basic Lambda execution role
    new IamRolePolicyAttachment(this, 'lambda-basic-execution', {
      provider: props.providerAlias,
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    // DynamoDB table for content metadata
    const contentTable = new DynamodbTable(this, 'content-table', {
      provider: props.providerAlias,
      name: `${resourcePrefix}-content`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'contentId',
      rangeKey: 'version',
      attribute: [
        {
          name: 'contentId',
          type: 'S',
        },
        {
          name: 'version',
          type: 'S',
        },
        {
          name: 'status',
          type: 'S',
        },
        {
          name: 'createdAt',
          type: 'S',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'status-created-index',
          hashKey: 'status',
          rangeKey: 'createdAt',
          projectionType: 'ALL',
        },
      ],
      pointInTimeRecovery: {
        enabled: true,
      },
      serverSideEncryption: {
        enabled: true,
      },
      tags: {
        Environment: props.environment,
        Region: props.region,
      },
    });

    // Auto-scaling for DynamoDB read capacity
    const readTarget = new AppautoscalingTarget(
      this,
      'content-table-read-target',
      {
        provider: props.providerAlias,
        maxCapacity: 100,
        minCapacity: 5,
        resourceId: `table/${contentTable.name}`,
        scalableDimension: 'dynamodb:table:ReadCapacityUnits',
        serviceNamespace: 'dynamodb',
      }
    );

    new AppautoscalingPolicy(this, 'content-table-read-policy', {
      provider: props.providerAlias,
      name: `${resourcePrefix}-content-read-scaling`,
      policyType: 'TargetTrackingScaling',
      resourceId: readTarget.resourceId,
      scalableDimension: readTarget.scalableDimension,
      serviceNamespace: readTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'DynamoDBReadCapacityUtilization',
        },
      },
    });

    // Auto-scaling for DynamoDB write capacity
    const writeTarget = new AppautoscalingTarget(
      this,
      'content-table-write-target',
      {
        provider: props.providerAlias,
        maxCapacity: 100,
        minCapacity: 5,
        resourceId: `table/${contentTable.name}`,
        scalableDimension: 'dynamodb:table:WriteCapacityUnits',
        serviceNamespace: 'dynamodb',
      }
    );

    new AppautoscalingPolicy(this, 'content-table-write-policy', {
      provider: props.providerAlias,
      name: `${resourcePrefix}-content-write-scaling`,
      policyType: 'TargetTrackingScaling',
      resourceId: writeTarget.resourceId,
      scalableDimension: writeTarget.scalableDimension,
      serviceNamespace: writeTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 70.0,
        predefinedMetricSpecification: {
          predefinedMetricType: 'DynamoDBWriteCapacityUtilization',
        },
      },
    });

    // S3 bucket for content files
    const contentBucket = new S3Bucket(this, 'content-bucket', {
      provider: props.providerAlias,
      bucket: `${resourcePrefix}-content-files`,
      tags: {
        Environment: props.environment,
        Region: props.region,
      },
    });

    // Enable versioning on S3 bucket
    new S3BucketVersioning(this, 'content-bucket-versioning', {
      provider: props.providerAlias,
      bucket: contentBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, 'content-bucket-pab', {
      provider: props.providerAlias,
      bucket: contentBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfiguration(
      this,
      'content-bucket-encryption',
      {
        provider: props.providerAlias,
        bucket: contentBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // IAM policy for Lambda to access DynamoDB and S3
    const lambdaPolicy = new IamPolicy(this, 'lambda-policy', {
      provider: props.providerAlias,
      name: `${resourcePrefix}-lambda-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'dynamodb:GetItem',
              'dynamodb:PutItem',
              'dynamodb:UpdateItem',
              'dynamodb:DeleteItem',
              'dynamodb:Query',
              'dynamodb:Scan',
            ],
            Resource: [contentTable.arn, `${contentTable.arn}/index/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [contentBucket.arn, `${contentBucket.arn}/*`],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'lambda-policy-attachment', {
      provider: props.providerAlias,
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    });

    // Lambda function for content management
    const contentLambda = new LambdaFunction(this, 'content-lambda', {
      provider: props.providerAlias,
      functionName: `${resourcePrefix}-content-handler`,
      filename: lambdaAsset.path,
      handler: 'content_handler.lambda_handler',
      runtime: 'python3.9',
      role: lambdaRole.arn,
      timeout: 30,
      environment: {
        variables: {
          CONTENT_TABLE: contentTable.name,
          CONTENT_BUCKET: contentBucket.bucket,
          REGION: props.region,
        },
      },
      tags: {
        Environment: props.environment,
        Region: props.region,
      },
    });

    // API Gateway REST API
    const api = new ApiGatewayRestApi(this, 'cms-api', {
      provider: props.providerAlias,
      name: `${resourcePrefix}-api`,
      description: 'CMS API for content management',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Environment: props.environment,
        Region: props.region,
      },
    });

    // API Gateway resource for content endpoints
    const contentResource = new ApiGatewayResource(this, 'content-resource', {
      provider: props.providerAlias,
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'content',
    });

    const contentIdResource = new ApiGatewayResource(
      this,
      'content-id-resource',
      {
        provider: props.providerAlias,
        restApiId: api.id,
        parentId: contentResource.id,
        pathPart: '{contentId}',
      }
    );

    // API Gateway methods
    const getMethods = ['GET', 'POST', 'PUT', 'DELETE'];
    getMethods.forEach(method => {
      const apiMethod = new ApiGatewayMethod(
        this,
        `content-${method.toLowerCase()}-method`,
        {
          provider: props.providerAlias,
          restApiId: api.id,
          resourceId:
            method === 'POST' ? contentResource.id : contentIdResource.id,
          httpMethod: method,
          authorization: 'NONE',
        }
      );

      new ApiGatewayIntegration(
        this,
        `content-${method.toLowerCase()}-integration`,
        {
          provider: props.providerAlias,
          restApiId: api.id,
          resourceId: apiMethod.resourceId,
          httpMethod: apiMethod.httpMethod,
          integrationHttpMethod: 'POST',
          type: 'AWS_PROXY',
          uri: contentLambda.invokeArn,
        }
      );
    });

    // Lambda permission for API Gateway
    new LambdaPermission(this, 'lambda-api-permission', {
      provider: props.providerAlias,
      statementId: 'AllowExecutionFromAPIGateway',
      action: 'lambda:InvokeFunction',
      functionName: contentLambda.functionName,
      principal: 'apigateway.amazonaws.com',
      sourceArn: `${api.executionArn}/*/*`,
    });

    // API Gateway deployment
    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      provider: props.providerAlias,
      restApiId: api.id,
      dependsOn: [
        `content-get-method`,
        `content-post-method`,
        `content-put-method`,
        `content-delete-method`,
      ],
    });

    // API Gateway stage
    new ApiGatewayStage(this, 'api-stage', {
      provider: props.providerAlias,
      deploymentId: deployment.id,
      restApiId: api.id,
      stageName: props.environment,
      tags: {
        Environment: props.environment,
        Region: props.region,
      },
    });

    // CloudFront Origin Access Control
    const oac = new CloudfrontOriginAccessControl(this, 'content-oac', {
      provider: props.providerAlias,
      name: `${resourcePrefix}-oac`,
      description: 'OAC for CMS content bucket',
      originAccessControlOriginType: 's3',
      signingBehavior: 'always',
      signingProtocol: 'sigv4',
    });

    // CloudFront distribution
    const distribution = new CloudfrontDistribution(
      this,
      'content-distribution',
      {
        provider: props.providerAlias,
        comment: `${resourcePrefix} CloudFront distribution`,
        defaultRootObject: 'index.html',
        enabled: true,
        isIpv6Enabled: true,
        priceClass: 'PriceClass_All',

        origin: [
          {
            domainName: contentBucket.bucketDomainName,
            originId: 'S3-content',
            originAccessControlId: oac.id,
          },
          {
            domainName: `${api.id}.execute-api.${currentRegion.name}.amazonaws.com`,
            originId: 'API-Gateway',
            originPath: `/${props.environment}`,
            customOriginConfig: {
              httpPort: 443,
              httpsPort: 443,
              originProtocolPolicy: 'https-only',
              originSslProtocols: ['TLSv1.2'],
            },
          },
        ],

        defaultCacheBehavior: {
          targetOriginId: 'S3-content',
          viewerProtocolPolicy: 'redirect-to-https',
          allowedMethods: [
            'DELETE',
            'GET',
            'HEAD',
            'OPTIONS',
            'PATCH',
            'POST',
            'PUT',
          ],
          cachedMethods: ['GET', 'HEAD'],
          compress: true,
          forwardedValues: {
            queryString: false,
            cookies: {
              forward: 'none',
            },
          },
          minTtl: 0,
          defaultTtl: 3600,
          maxTtl: 86400,
        },

        orderedCacheBehavior: [
          {
            pathPattern: '/api/*',
            targetOriginId: 'API-Gateway',
            viewerProtocolPolicy: 'https-only',
            allowedMethods: [
              'DELETE',
              'GET',
              'HEAD',
              'OPTIONS',
              'PATCH',
              'POST',
              'PUT',
            ],
            cachedMethods: ['GET', 'HEAD'],
            compress: true,
            forwardedValues: {
              queryString: true,
              headers: ['Authorization', 'Content-Type'],
              cookies: {
                forward: 'none',
              },
            },
            minTtl: 0,
            defaultTtl: 0,
            maxTtl: 0,
          },
        ],

        restrictions: {
          geoRestriction: {
            restrictionType: 'none',
          },
        },

        viewerCertificate: {
          cloudfrontDefaultCertificate: true,
        },

        tags: {
          Environment: props.environment,
          Region: props.region,
        },
      }
    );

    // S3 bucket policy to allow CloudFront access
    new S3BucketPolicy(this, 'content-bucket-policy', {
      provider: props.providerAlias,
      bucket: contentBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AllowCloudFrontServicePrincipal',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudfront.amazonaws.com',
            },
            Action: 's3:GetObject',
            Resource: `${contentBucket.arn}/*`,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': distribution.arn,
              },
            },
          },
        ],
      }),
    });
  }
}
