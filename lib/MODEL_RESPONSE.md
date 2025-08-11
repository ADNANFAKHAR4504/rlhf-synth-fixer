I'll create a complete, production-ready secure serverless API infrastructure using Pulumi TypeScript. This solution implements all the security best practices you've outlined with a focus on least privilege and private networking.

```typescript
import * as pulumi from '@pulumi/pulumi';
import { createVpcInfrastructure } from './src/networking/vpc';
import { createVpcEndpoints } from './src/networking/endpoints';
import { createSecureS3Bucket } from './src/storage/s3';
import { createLambdaRole } from './src/iam/roles';
import { createLambdaFunction } from './src/compute/lambda';
import { createApiGateway } from './src/api/gateway';
import { createCloudWatchResources } from './src/monitoring/cloudwatch';

const config = new pulumi.Config();
const projectName = config.require('projectName');
const environment = config.get('environment') || 'dev';

// Create VPC and networking infrastructure
const vpcInfra = createVpcInfrastructure(projectName, environment);

// Create VPC Endpoints for secure AWS service access
const vpcEndpoints = createVpcEndpoints(
  vpcInfra.vpc,
  vpcInfra.routeTable,
  projectName,
  environment
);

// Create CloudWatch resources for logging
const cloudWatchResources = createCloudWatchResources(projectName, environment);

// Create secure S3 bucket
const s3Bucket = createSecureS3Bucket(
  vpcEndpoints.s3Endpoint,
  projectName,
  environment
);

// Create IAM role for Lambda with least privilege
const lambdaRole = createLambdaRole(
  s3Bucket.bucket,
  cloudWatchResources.logGroup,
  projectName,
  environment
);

// Create Lambda function in private subnet
const lambdaFunction = createLambdaFunction(
  lambdaRole,
  vpcInfra.privateSubnets,
  vpcInfra.lambdaSecurityGroup,
  s3Bucket.bucket,
  cloudWatchResources.logGroup,
  projectName,
  environment
);

// Create API Gateway
const apiGateway = createApiGateway(
  lambdaFunction,
  cloudWatchResources.apiLogGroup,
  projectName,
  environment
);

// Export important values
export const vpcId = vpcInfra.vpc.id;
export const s3BucketName = s3Bucket.bucket.bucket;
export const lambdaFunctionName = lambdaFunction.name;
export const apiGatewayUrl = apiGateway.url;
export const logGroupName = cloudWatchResources.logGroup.name;
```

### `src/networking/vpc.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface VpcInfrastructure {
  vpc: aws.ec2.Vpc;
  internetGateway: aws.ec2.InternetGateway;
  publicSubnets: aws.ec2.Subnet[];
  privateSubnets: aws.ec2.Subnet[];
  routeTable: aws.ec2.RouteTable;
  lambdaSecurityGroup: aws.ec2.SecurityGroup;
}

export function createVpcInfrastructure(
  projectName: string,
  environment: string
): VpcInfrastructure {
  // Create VPC
  const vpc = new aws.ec2.Vpc(`${projectName}-${environment}-vpc`, {
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      Name: `${projectName}-${environment}-vpc`,
      Environment: environment,
      Project: projectName,
    },
  });

  // Create Internet Gateway
  const internetGateway = new aws.ec2.InternetGateway(
    `${projectName}-${environment}-igw`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environment}-igw`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  // Get availability zones
  const availabilityZones = aws.getAvailabilityZones({
    state: 'available',
  });

  // Create public subnets (for NAT Gateway if needed in future)
  const publicSubnets = availabilityZones.then(azs =>
    azs.names.slice(0, 2).map(
      (az, index) =>
        new aws.ec2.Subnet(
          `${projectName}-${environment}-public-subnet-${index + 1}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${index + 1}.0/24`,
            availabilityZone: az,
            mapPublicIpOnLaunch: true,
            tags: {
              Name: `${projectName}-${environment}-public-subnet-${index + 1}`,
              Type: 'Public',
              Environment: environment,
              Project: projectName,
            },
          }
        )
    )
  );

  // Create private subnets for Lambda
  const privateSubnets = availabilityZones.then(azs =>
    azs.names.slice(0, 2).map(
      (az, index) =>
        new aws.ec2.Subnet(
          `${projectName}-${environment}-private-subnet-${index + 1}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${index + 10}.0/24`,
            availabilityZone: az,
            tags: {
              Name: `${projectName}-${environment}-private-subnet-${index + 1}`,
              Type: 'Private',
              Environment: environment,
              Project: projectName,
            },
          }
        )
    )
  );

  // Create route table for private subnets
  const routeTable = new aws.ec2.RouteTable(
    `${projectName}-${environment}-private-rt`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environment}-private-rt`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  // Associate private subnets with route table
  privateSubnets.then(subnets => {
    subnets.forEach((subnet, index) => {
      new aws.ec2.RouteTableAssociation(
        `${projectName}-${environment}-private-rta-${index + 1}`,
        {
          subnetId: subnet.id,
          routeTableId: routeTable.id,
        }
      );
    });
  });

  // Create security group for Lambda
  const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
    `${projectName}-${environment}-lambda-sg`,
    {
      vpcId: vpc.id,
      description:
        'Security group for Lambda function - allows HTTPS outbound only',
      egress: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTPS outbound for AWS API calls',
        },
      ],
      tags: {
        Name: `${projectName}-${environment}-lambda-sg`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  return {
    vpc,
    internetGateway,
    publicSubnets: publicSubnets.then(subnets => subnets),
    privateSubnets: privateSubnets.then(subnets => subnets),
    routeTable,
    lambdaSecurityGroup,
  };
}
```

### `src/networking/endpoints.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface VpcEndpoints {
  s3Endpoint: aws.ec2.VpcEndpoint;
}

export function createVpcEndpoints(
  vpc: aws.ec2.Vpc,
  routeTable: aws.ec2.RouteTable,
  projectName: string,
  environment: string
): VpcEndpoints {
  // Create S3 Gateway VPC Endpoint for secure S3 access
  const s3Endpoint = new aws.ec2.VpcEndpoint(
    `${projectName}-${environment}-s3-endpoint`,
    {
      vpcId: vpc.id,
      serviceName: 'com.amazonaws.us-west-2.s3',
      vpcEndpointType: 'Gateway',
      routeTableIds: [routeTable.id],
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${projectName}-${environment}-s3-endpoint`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  return {
    s3Endpoint,
  };
}
```

### `src/storage/s3.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface S3Resources {
  bucket: aws.s3.BucketV2;
  accessLogsBucket: aws.s3.BucketV2;
}

export function createSecureS3Bucket(
  s3Endpoint: aws.ec2.VpcEndpoint,
  projectName: string,
  environment: string
): S3Resources {
  // Create access logs bucket
  const accessLogsBucket = new aws.s3.BucketV2(
    `${projectName}-${environment}-access-logs`,
    {
      bucket: `${projectName}-${environment}-access-logs-${Date.now()}`,
      tags: {
        Name: `${projectName}-${environment}-access-logs`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  // Block public access for access logs bucket
  new aws.s3.BucketPublicAccessBlock(
    `${projectName}-${environment}-access-logs-pab`,
    {
      bucket: accessLogsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

  // Create main S3 bucket
  const bucket = new aws.s3.BucketV2(
    `${projectName}-${environment}-documents`,
    {
      bucket: `${projectName}-${environment}-documents-${Date.now()}`,
      tags: {
        Name: `${projectName}-${environment}-documents`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  // Enable versioning
  new aws.s3.BucketVersioningV2(`${projectName}-${environment}-versioning`, {
    bucket: bucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  });

  // Configure server-side encryption with AWS managed keys (AES-256)
  new aws.s3.BucketServerSideEncryptionConfigurationV2(
    `${projectName}-${environment}-encryption`,
    {
      bucket: bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    }
  );

  // Block all public access
  new aws.s3.BucketPublicAccessBlock(`${projectName}-${environment}-pab`, {
    bucket: bucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  });

  // Enable access logging
  new aws.s3.BucketLoggingV2(`${projectName}-${environment}-logging`, {
    bucket: bucket.id,
    targetBucket: accessLogsBucket.id,
    targetPrefix: 'access-logs/',
  });

  // Create restrictive bucket policy
  const bucketPolicy = new aws.s3.BucketPolicy(
    `${projectName}-${environment}-policy`,
    {
      bucket: bucket.id,
      policy: pulumi
        .all([bucket.arn, s3Endpoint.id])
        .apply(([bucketArn, endpointId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyAllExceptVpcEndpointAndLambdaRole',
                Effect: 'Deny',
                Principal: '*',
                Action: '*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  StringNotEquals: {
                    'aws:sourceVpce': endpointId,
                  },
                },
              },
              {
                Sid: 'AllowVpcEndpointAccess',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: {
                    'aws:sourceVpce': endpointId,
                  },
                },
              },
            ],
          })
        ),
    }
  );

  return {
    bucket,
    accessLogsBucket,
  };
}
```

### `src/iam/roles.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createLambdaRole(
  s3Bucket: aws.s3.BucketV2,
  logGroup: aws.cloudwatch.LogGroup,
  projectName: string,
  environment: string
): aws.iam.Role {
  // Create Lambda execution role with least privilege
  const lambdaRole = new aws.iam.Role(
    `${projectName}-${environment}-lambda-role`,
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
        Name: `${projectName}-${environment}-lambda-role`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  // Create custom policy with least privilege permissions
  const lambdaPolicy = new aws.iam.Policy(
    `${projectName}-${environment}-lambda-policy`,
    {
      description: 'Least privilege policy for document processing Lambda',
      policy: pulumi
        .all([s3Bucket.arn, logGroup.arn])
        .apply(([bucketArn, logGroupArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: ['s3:PutObject'],
                Resource: `${bucketArn}/*`,
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
              {
                Effect: 'Allow',
                Action: [
                  'ec2:CreateNetworkInterface',
                  'ec2:DescribeNetworkInterfaces',
                  'ec2:DeleteNetworkInterface',
                ],
                Resource: '*',
              },
            ],
          })
        ),
      tags: {
        Name: `${projectName}-${environment}-lambda-policy`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  // Attach the custom policy to the role
  new aws.iam.RolePolicyAttachment(
    `${projectName}-${environment}-lambda-policy-attachment`,
    {
      role: lambdaRole.name,
      policyArn: lambdaPolicy.arn,
    }
  );

  return lambdaRole;
}

/*
 * AUDITOR ROLE EXAMPLE (commented for reference):
 *
 * To create a separate IAM role for an "Auditor" with least privilege access to logs:
 *
 * export function createAuditorRole(logGroup: aws.cloudwatch.LogGroup, projectName: string, environment: string): aws.iam.Role {
 *   const auditorRole = new aws.iam.Role(`${projectName}-${environment}-auditor-role`, {
 *     assumeRolePolicy: JSON.stringify({
 *       Version: "2012-10-17",
 *       Statement: [
 *         {
 *           Action: "sts:AssumeRole",
 *           Effect: "Allow",
 *           Principal: {
 *             AWS: "arn:aws:iam::ACCOUNT-ID:root", // Replace with specific user/role ARN
 *           },
 *           Condition: {
 *             StringEquals: {
 *               "sts:ExternalId": "unique-external-id"
 *             }
 *           }
 *         },
 *       ],
 *     }),
 *   });
 *
 *   const auditorPolicy = new aws.iam.Policy(`${projectName}-${environment}-auditor-policy`, {
 *     policy: logGroup.arn.apply(logGroupArn =>
 *       JSON.stringify({
 *         Version: "2012-10-17",
 *         Statement: [
 *           {
 *             Effect: "Allow",
 *             Action: [
 *               "logs:GetLogEvents",
 *               "logs:FilterLogEvents",
 *               "logs:DescribeLogStreams",
 *             ],
 *             Resource: `${logGroupArn}:*`,
 *           },
 *         ],
 *       })
 *     ),
 *   });
 *
 *   new aws.iam.RolePolicyAttachment(`${projectName}-${environment}-auditor-policy-attachment`, {
 *     role: auditorRole.name,
 *     policyArn: auditorPolicy.arn,
 *   });
 *
 *   return auditorRole;
 * }
 */
```

### `src/compute/lambda.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createLambdaFunction(
  lambdaRole: aws.iam.Role,
  privateSubnets: pulumi.Output<aws.ec2.Subnet[]>,
  securityGroup: aws.ec2.SecurityGroup,
  s3Bucket: aws.s3.BucketV2,
  logGroup: aws.cloudwatch.LogGroup,
  projectName: string,
  environment: string
): aws.lambda.Function {
  // Lambda function code
  const lambdaCode = `
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract document data from the event
        const documentData = event.body ? JSON.parse(event.body) : event;
        const documentId = documentData.documentId || 'doc-' + Date.now();
        const content = documentData.content || 'Default document content';
        
        // Process the document (placeholder logic)
        const processedDocument = {
            id: documentId,
            content: content,
            processedAt: new Date().toISOString(),
            status: 'processed'
        };
        
        // Store in S3
        const s3Params = {
            Bucket: process.env.S3_BUCKET_NAME,
            Key: \`documents/\${documentId}.json\`,
            Body: JSON.stringify(processedDocument, null, 2),
            ContentType: 'application/json',
            ServerSideEncryption: 'AES256'
        };
        
        const result = await s3.putObject(s3Params).promise();
        console.log('Document stored successfully:', result);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Document processed and stored successfully',
                documentId: documentId,
                etag: result.ETag
            })
        };
        
    } catch (error) {
        console.error('Error processing document:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Error processing document',
                error: error.message
            })
        };
    }
};
`;

  // Create Lambda function
  const lambdaFunction = new aws.lambda.Function(
    `${projectName}-${environment}-processor`,
    {
      runtime: aws.lambda.Runtime.NodeJS18dX,
      code: new pulumi.asset.AssetArchive({
        'index.js': new pulumi.asset.StringAsset(lambdaCode),
      }),
      handler: 'index.handler',
      role: lambdaRole.arn,
      timeout: 30,
      memorySize: 256,
      environment: {
        variables: {
          S3_BUCKET_NAME: s3Bucket.bucket,
          LOG_GROUP_NAME: logGroup.name,
          ENVIRONMENT: environment,
        },
      },
      vpcConfig: {
        subnetIds: privateSubnets.apply(subnets =>
          subnets.map(subnet => subnet.id)
        ),
        securityGroupIds: [securityGroup.id],
      },
      dependsOn: [logGroup],
      tags: {
        Name: `${projectName}-${environment}-processor`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  return lambdaFunction;
}
```

### `src/api/gateway.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface ApiGatewayResources {
  api: aws.apigatewayv2.Api;
  stage: aws.apigatewayv2.Stage;
  integration: aws.apigatewayv2.Integration;
  route: aws.apigatewayv2.Route;
  url: pulumi.Output<string>;
}

export function createApiGateway(
  lambdaFunction: aws.lambda.Function,
  logGroup: aws.cloudwatch.LogGroup,
  projectName: string,
  environment: string
): ApiGatewayResources {
  // Create HTTP API Gateway
  const api = new aws.apigatewayv2.Api(`${projectName}-${environment}-api`, {
    protocolType: 'HTTP',
    description: `Secure document processing API for ${projectName}`,
    corsConfiguration: {
      allowCredentials: false,
      allowMethods: ['POST', 'OPTIONS'],
      allowOrigins: ['*'], // Restrict this in production
      allowHeaders: ['content-type', 'x-amz-date', 'authorization'],
    },
    tags: {
      Name: `${projectName}-${environment}-api`,
      Environment: environment,
      Project: projectName,
    },
  });

  // Create Lambda permission for API Gateway
  new aws.lambda.Permission(
    `${projectName}-${environment}-api-lambda-permission`,
    {
      action: 'lambda:InvokeFunction',
      function: lambdaFunction.name,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${api.executionArn}/*/*`,
    }
  );

  // Create integration with Lambda
  const integration = new aws.apigatewayv2.Integration(
    `${projectName}-${environment}-integration`,
    {
      apiId: api.id,
      integrationType: 'AWS_PROXY',
      integrationUri: lambdaFunction.arn,
      integrationMethod: 'POST',
      payloadFormatVersion: '2.0',
    }
  );

  // Create route
  const route = new aws.apigatewayv2.Route(
    `${projectName}-${environment}-route`,
    {
      apiId: api.id,
      routeKey: 'POST /process-document',
      target: pulumi.interpolate`integrations/${integration.id}`,
    }
  );

  // Create stage with logging
  const stage = new aws.apigatewayv2.Stage(
    `${projectName}-${environment}-stage`,
    {
      apiId: api.id,
      name: environment,
      autoDeploy: true,
      accessLogSettings: {
        destinationArn: logGroup.arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      },
      tags: {
        Name: `${projectName}-${environment}-stage`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  const url = pulumi.interpolate`${api.apiEndpoint}/${stage.name}`;

  return {
    api,
    stage,
    integration,
    route,
    url,
  };
}
```

### `src/monitoring/cloudwatch.ts`

```typescript
import * as aws from '@pulumi/aws';

export interface CloudWatchResources {
  logGroup: aws.cloudwatch.LogGroup;
  apiLogGroup: aws.cloudwatch.LogGroup;
}

export function createCloudWatchResources(
  projectName: string,
  environment: string
): CloudWatchResources {
  // Create CloudWatch Log Group for Lambda
  const logGroup = new aws.cloudwatch.LogGroup(
    `${projectName}-${environment}-lambda-logs`,
    {
      name: `/aws/lambda/${projectName}-${environment}-processor`,
      retentionInDays: 90,
      tags: {
        Name: `${projectName}-${environment}-lambda-logs`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  // Create CloudWatch Log Group for API Gateway
  const apiLogGroup = new aws.cloudwatch.LogGroup(
    `${projectName}-${environment}-api-logs`,
    {
      name: `/aws/apigateway/${projectName}-${environment}-api`,
      retentionInDays: 90,
      tags: {
        Name: `${projectName}-${environment}-api-logs`,
        Environment: environment,
        Project: projectName,
      },
    }
  );

  return {
    logGroup,
    apiLogGroup,
  };
}
```

### `README.md`

````markdown
# Secure Serverless API - Production-Ready Infrastructure

This project deploys a highly secure, production-ready serverless API infrastructure on AWS using Pulumi TypeScript. The architecture implements security best practices with a focus on least privilege access and private networking.

## Architecture Overview

The infrastructure creates a secure document processing API with the following components:

- **VPC with Private Networking**: Lambda functions run in private subnets with no internet access
- **S3 Gateway VPC Endpoint**: Secure communication to S3 without internet traversal
- **Encrypted S3 Storage**: Documents stored with AWS managed encryption (AES-256)
- **Least Privilege IAM**: Lambda role with minimal required permissions
- **API Gateway**: Secure HTTP API with CloudWatch logging
- **Comprehensive Monitoring**: CloudWatch logs with 90-day retention

## Security Features

### 🔒 Network Security

- Lambda functions deployed in private subnets
- No NAT Gateway - all AWS service communication via VPC Endpoints
- Security groups with minimal egress rules (HTTPS only)
- S3 bucket policy restricts access to VPC Endpoint only

### 🔑 IAM Security (Least Privilege)

- Lambda execution role with only required permissions:
  - `s3:PutObject` on specific bucket ARN only
  - CloudWatch logs permissions on specific log group only
  - VPC networking permissions for ENI management

### 🛡️ Data Security

- S3 bucket encryption at rest using AWS managed keys (AES-256)
- All public access blocked on S3 buckets
- S3 versioning enabled for data protection
- Access logging enabled for audit trails

### 📊 Monitoring & Auditing

- CloudWatch logs for Lambda and API Gateway
- 90-day log retention policy
- Structured logging for security analysis

## Prerequisites

1. **AWS CLI configured** with appropriate permissions
2. **Pulumi CLI installed** (`curl -fsSL https://get.pulumi.com | sh`)
3. **Node.js 18+** and npm installed
4. **AWS Account** with permissions to create VPC, Lambda, S3, IAM, and API Gateway resources

## Deployment Instructions

### 1. Initialize the Project

```bash
# Clone or create the project directory
mkdir secure-serverless-api && cd secure-serverless-api

# Install dependencies
npm install

# Initialize Pulumi stack
pulumi stack init dev
pulumi config set aws:region us-west-2
pulumi config set secure-serverless-api:environment dev
pulumi config set secure-serverless-api:projectName secure-doc-api
```
````

### 2. Deploy Infrastructure

```bash
# Preview the deployment
pulumi preview

# Deploy the infrastructure
pulumi up
```

The deployment will create all resources and output the API Gateway URL.

### 3. Verify Deployment

After deployment, note the following outputs:

- `apiGatewayUrl`: The API endpoint URL
- `s3BucketName`: The created S3 bucket name
- `lambdaFunctionName`: The Lambda function name
- `logGroupName`: CloudWatch log group name

## Testing the End-to-End Flow

### 1. Test the API Endpoint

Use curl to test the document processing API:

```bash
# Get the API Gateway URL from Pulumi outputs
API_URL=$(pulumi
```
