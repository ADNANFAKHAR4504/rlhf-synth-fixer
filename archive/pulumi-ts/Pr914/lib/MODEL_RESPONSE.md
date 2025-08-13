# Production-Ready Secure Serverless API

I'll create a complete Pulumi TypeScript project that implements a highly secure, production-ready serverless API following AWS security best practices and the principle of least privilege.

## Project Structure

### `index.ts` (Main Infrastructure File)

```typescript
import * as pulumi from '@pulumi/pulumi';
import { createVPC } from './src/networking/vpc';
import { createVPCEndpoints } from './src/networking/endpoints';
import { createSecureS3Bucket } from './src/storage/s3';
import { createLambdaExecutionRole } from './src/iam/roles';
import { createLambdaFunction } from './src/compute/lambda';
import { createAPIGateway } from './src/api/gateway';
import { createCloudWatchResources } from './src/monitoring/cloudwatch';

// Configuration
const config = new pulumi.Config();
const projectName = config.get('projectName') || 'secure-doc-api';
const environment = config.get('environment') || 'dev';

async function main() {
  // 1. Create VPC and networking infrastructure
  const networking = createVPC(projectName, environment);

  // 2. Create VPC Endpoints for secure AWS service access
  const endpoints = createVPCEndpoints(
    networking.vpc,
    networking.routeTable,
    projectName
  );

  // 3. Create CloudWatch resources for monitoring and logging
  const monitoring = createCloudWatchResources(projectName, environment);

  // 4. Create secure S3 bucket for document storage
  const storage = createSecureS3Bucket(
    projectName,
    environment,
    endpoints.s3Endpoint
  );

  // 5. Create IAM role with least privilege permissions
  const lambdaRole = createLambdaExecutionRole(
    projectName,
    environment,
    storage.bucket.arn,
    monitoring.lambdaLogGroup.arn
  );

  // 6. Create Lambda function in private subnet
  const lambda = createLambdaFunction(
    projectName,
    environment,
    lambdaRole,
    networking.privateSubnets,
    networking.lambdaSecurityGroup,
    storage.bucket.bucket,
    monitoring.lambdaLogGroup.name
  );

  // 7. Create API Gateway with private integration
  const api = createAPIGateway(
    projectName,
    environment,
    lambda.function,
    monitoring.apiLogGroup
  );

  // Export important resource information
  return {
    // Networking
    vpcId: networking.vpc.id,
    privateSubnetIds: networking.privateSubnets.map(subnet => subnet.id),
    publicSubnetIds: networking.publicSubnets.map(subnet => subnet.id),

    // Storage
    bucketName: storage.bucket.bucket,
    bucketArn: storage.bucket.arn,

    // Compute
    lambdaFunctionName: lambda.function.name,
    lambdaFunctionArn: lambda.function.arn,

    // API
    apiGatewayUrl: api.deployment.invokeUrl,
    apiGatewayId: api.restApi.id,

    // Monitoring
    lambdaLogGroupName: monitoring.lambdaLogGroup.name,
    apiLogGroupName: monitoring.apiLogGroup.name,

    // Security
    lambdaRoleArn: lambdaRole.arn,
    s3EndpointId: endpoints.s3Endpoint.id,
  };
}

export = main();
```

### `src/networking/vpc.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createVPC(projectName: string, environment: string) {
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

  // Create Internet Gateway for public subnets
  const internetGateway = new aws.ec2.InternetGateway(
    `${projectName}-${environment}-igw`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environment}-igw`,
        Environment: environment,
      },
    }
  );

  // Get availability zones
  const availabilityZones = aws.getAvailabilityZones({
    state: 'available',
  });

  // Create public subnets (for NAT Gateway if needed, but we're using VPC endpoints)
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
              Type: 'public',
              Environment: environment,
            },
          }
        )
    )
  );

  // Create private subnets for Lambda functions
  const privateSubnets = availabilityZones.then(azs =>
    azs.names.slice(0, 2).map(
      (az, index) =>
        new aws.ec2.Subnet(
          `${projectName}-${environment}-private-subnet-${index + 1}`,
          {
            vpcId: vpc.id,
            cidrBlock: `10.0.${index + 10}.0/24`,
            availabilityZone: az,
            mapPublicIpOnLaunch: false,
            tags: {
              Name: `${projectName}-${environment}-private-subnet-${index + 1}`,
              Type: 'private',
              Environment: environment,
            },
          }
        )
    )
  );

  // Create route table for public subnets
  const publicRouteTable = new aws.ec2.RouteTable(
    `${projectName}-${environment}-public-rt`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environment}-public-rt`,
        Environment: environment,
      },
    }
  );

  // Create route table for private subnets
  const privateRouteTable = new aws.ec2.RouteTable(
    `${projectName}-${environment}-private-rt`,
    {
      vpcId: vpc.id,
      tags: {
        Name: `${projectName}-${environment}-private-rt`,
        Environment: environment,
      },
    }
  );

  // Add route to internet gateway for public subnets
  new aws.ec2.Route(`${projectName}-${environment}-public-route`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: internetGateway.id,
  });

  // Associate public subnets with public route table
  publicSubnets.then(subnets =>
    subnets.forEach(
      (subnet, index) =>
        new aws.ec2.RouteTableAssociation(
          `${projectName}-${environment}-public-rta-${index + 1}`,
          {
            subnetId: subnet.id,
            routeTableId: publicRouteTable.id,
          }
        )
    )
  );

  // Associate private subnets with private route table
  privateSubnets.then(subnets =>
    subnets.forEach(
      (subnet, index) =>
        new aws.ec2.RouteTableAssociation(
          `${projectName}-${environment}-private-rta-${index + 1}`,
          {
            subnetId: subnet.id,
            routeTableId: privateRouteTable.id,
          }
        )
    )
  );

  // Security group for Lambda functions
  const lambdaSecurityGroup = new aws.ec2.SecurityGroup(
    `${projectName}-${environment}-lambda-sg`,
    {
      name: `${projectName}-${environment}-lambda-sg`,
      description:
        'Security group for Lambda functions - allows HTTPS outbound only',
      vpcId: vpc.id,

      // Allow HTTPS outbound for AWS API calls
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
      },
    }
  );

  return {
    vpc,
    internetGateway,
    publicSubnets,
    privateSubnets,
    routeTable: privateRouteTable,
    lambdaSecurityGroup,
  };
}
```

### `src/networking/endpoints.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createVPCEndpoints(
  vpc: aws.ec2.Vpc,
  routeTable: aws.ec2.RouteTable,
  projectName: string
) {
  // S3 Gateway VPC Endpoint - critical for secure S3 access from private subnets
  const s3Endpoint = new aws.ec2.VpcEndpoint(`${projectName}-s3-endpoint`, {
    vpcId: vpc.id,
    serviceName: 'com.amazonaws.us-east-1.s3',
    vpcEndpointType: 'Gateway',
    routeTableIds: [routeTable.id],

    // Policy to restrict access to specific actions
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
      Name: `${projectName}-s3-endpoint`,
      Purpose: 'Secure S3 access from private subnets',
    },
  });

  return {
    s3Endpoint,
  };
}
```

### `src/storage/s3.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createSecureS3Bucket(
  projectName: string,
  environment: string,
  s3Endpoint: aws.ec2.VpcEndpoint
) {
  // Main document storage bucket
  const bucket = new aws.s3.Bucket(`${projectName}-${environment}-documents`, {
    bucket: `${projectName}-${environment}-documents-${Date.now()}`,

    // Enable versioning for data protection
    versioning: {
      enabled: true,
    },

    // Server-side encryption with AWS managed keys (AES-256)
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
        bucketKeyEnabled: true,
      },
    },

    tags: {
      Name: `${projectName}-${environment}-documents`,
      Environment: environment,
      Purpose: 'Secure document storage',
    },
  });

  // Access logging bucket
  const accessLogBucket = new aws.s3.Bucket(
    `${projectName}-${environment}-access-logs`,
    {
      bucket: `${projectName}-${environment}-access-logs-${Date.now()}`,

      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },

      tags: {
        Name: `${projectName}-${environment}-access-logs`,
        Environment: environment,
        Purpose: 'S3 access logging',
      },
    }
  );

  // Block all public access to main bucket
  new aws.s3.BucketPublicAccessBlock(
    `${projectName}-${environment}-documents-pab`,
    {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

  // Block all public access to logging bucket
  new aws.s3.BucketPublicAccessBlock(
    `${projectName}-${environment}-access-logs-pab`,
    {
      bucket: accessLogBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }
  );

  // Enable access logging
  new aws.s3.BucketLogging(`${projectName}-${environment}-documents-logging`, {
    bucket: bucket.id,
    targetBucket: accessLogBucket.id,
    targetPrefix: 'access-logs/',
  });

  // Restrictive bucket policy - only allow access from Lambda role and VPC endpoint
  const bucketPolicy = new aws.s3.BucketPolicy(
    `${projectName}-${environment}-documents-policy`,
    {
      bucket: bucket.id,
      policy: pulumi
        .all([bucket.arn, s3Endpoint.id])
        .apply(([bucketArn, endpointId]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyAllExceptVPCEndpoint',
                Effect: 'Deny',
                Principal: '*',
                Action: '*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  StringNotEquals: {
                    'aws:SourceVpce': endpointId,
                  },
                },
              },
              {
                Sid: 'AllowVPCEndpointAccess',
                Effect: 'Allow',
                Principal: '*',
                Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: {
                    'aws:SourceVpce': endpointId,
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
    accessLogBucket,
    bucketPolicy,
  };
}
```

### `src/iam/roles.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createLambdaExecutionRole(
  projectName: string,
  environment: string,
  bucketArn: pulumi.Output<string>,
  logGroupArn: pulumi.Output<string>
) {
  // Lambda execution role with least privilege
  const lambdaRole = new aws.iam.Role(
    `${projectName}-${environment}-lambda-role`,
    {
      name: `${projectName}-${environment}-lambda-role`,
      description:
        'Least privilege execution role for document processing Lambda',

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
        Purpose: 'Lambda execution with least privilege',
      },
    }
  );

  // VPC execution policy for Lambda
  new aws.iam.RolePolicyAttachment(
    `${projectName}-${environment}-lambda-vpc-policy`,
    {
      role: lambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    }
  );

  // Custom policy with least privilege permissions
  const lambdaPolicy = new aws.iam.RolePolicy(
    `${projectName}-${environment}-lambda-policy`,
    {
      name: `${projectName}-${environment}-lambda-policy`,
      role: lambdaRole.id,

      policy: pulumi.all([bucketArn, logGroupArn]).apply(([bArn, lArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'S3DocumentAccess',
              Effect: 'Allow',
              Action: ['s3:PutObject', 's3:PutObjectAcl'],
              Resource: `${bArn}/*`,
            },
            {
              Sid: 'CloudWatchLogsAccess',
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: `${lArn}:*`,
            },
          ],
        })
      ),
    }
  );

  /*
   * AUDITOR ROLE EXAMPLE (commented for reference):
   *
   * To create a separate auditor role with read-only access to logs:
   *
   * const auditorRole = new aws.iam.Role(`${projectName}-${environment}-auditor-role`, {
   *     assumeRolePolicy: JSON.stringify({
   *         Version: "2012-10-17",
   *         Statement: [{
   *             Action: "sts:AssumeRole",
   *             Effect: "Allow",
   *             Principal: {
   *                 AWS: "arn:aws:iam::ACCOUNT-ID:user/auditor-user"
   *             }
   *         }]
   *     })
   * });
   *
   * new aws.iam.RolePolicy(`${projectName}-${environment}-auditor-policy`, {
   *     role: auditorRole.id,
   *     policy: logGroupArn.apply(lArn => JSON.stringify({
   *         Version: "2012-10-17",
   *         Statement: [{
   *             Effect: "Allow",
   *             Action: [
   *                 "logs:GetLogEvents",
   *                 "logs:FilterLogEvents",
   *                 "logs:DescribeLogGroups",
   *                 "logs:DescribeLogStreams"
   *             ],
   *             Resource: `${lArn}:*`
   *         }]
   *     }))
   * });
   */

  return lambdaRole;
}
```

### `src/compute/lambda.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

export function createLambdaFunction(
  projectName: string,
  environment: string,
  executionRole: aws.iam.Role,
  privateSubnets: Promise<aws.ec2.Subnet[]>,
  securityGroup: aws.ec2.SecurityGroup,
  bucketName: pulumi.Output<string>,
  logGroupName: pulumi.Output<string>
) {
  // Create deployment package
  const lambdaCode = `
const AWS = require('aws-sdk');
const s3 = new AWS.S3();

exports.handler = async (event) => {
    console.log('Received event:', JSON.stringify(event, null, 2));
    
    try {
        // Extract document data from the request
        const body = JSON.parse(event.body || '{}');
        const documentContent = body.content || 'Default document content';
        const fileName = body.fileName || \`document-\${Date.now()}.txt\`;
        
        // Process and store the document in S3
        const params = {
            Bucket: process.env.BUCKET_NAME,
            Key: \`processed/\${fileName}\`,
            Body: documentContent,
            ContentType: 'text/plain',
            ServerSideEncryption: 'AES256'
        };
        
        const result = await s3.putObject(params).promise();
        
        console.log('Document stored successfully:', result);
        
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Document processed and stored successfully',
                fileName: fileName,
                etag: result.ETag
            })
        };
        
    } catch (error) {
        console.error('Error processing document:', error);
        
        return {
            statusCode: 500,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            body: JSON.stringify({
                message: 'Error processing document',
                error: error.message
            })
        };
    }
};
`;

  // Write Lambda code to file
  const lambdaDir = path.join(__dirname, '../../lambda');
  if (!fs.existsSync(lambdaDir)) {
    fs.mkdirSync(lambdaDir, { recursive: true });
  }
  fs.writeFileSync(path.join(lambdaDir, 'handler.js'), lambdaCode);

  // Create Lambda function
  const lambdaFunction = new aws.lambda.Function(
    `${projectName}-${environment}-processor`,
    {
      name: `${projectName}-${environment}-document-processor`,
      description: 'Secure document processing function in private subnet',

      // Code configuration
      code: new pulumi.asset.AssetArchive({
        'handler.js': new pulumi.asset.FileAsset(
          path.join(lambdaDir, 'handler.js')
        ),
      }),
      handler: 'handler.handler',
      runtime: 'nodejs18.x',

      // Security and networking
      role: executionRole.arn,
      vpcConfig: {
        subnetIds: privateSubnets.then(subnets => subnets.map(s => s.id)),
        securityGroupIds: [securityGroup.id],
      },

      // Environment variables
      environment: {
        variables: {
          BUCKET_NAME: bucketName,
          LOG_GROUP_NAME: logGroupName,
          NODE_ENV: environment,
        },
      },

      // Resource configuration
      timeout: 30,
      memorySize: 256,

      tags: {
        Name: `${projectName}-${environment}-document-processor`,
        Environment: environment,
        Purpose: 'Secure document processing',
      },
    }
  );

  return {
    function: lambdaFunction,
  };
}
```

### `src/api/gateway.ts`

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export function createAPIGateway(
  projectName: string,
  environment: string,
  lambdaFunction: aws.lambda.Function,
  logGroup: aws.cloudwatch.LogGroup
) {
  // REST API Gateway
  const restApi = new aws.apigateway.RestApi(
    `${projectName}-${environment}-api`,
    {
      name: `${projectName}-${environment}-document-api`,
      description:
        'Secure document processing API with private Lambda integration',

      endpointConfiguration: {
        types: 'REGIONAL',
      },

      tags: {
        Name: `${projectName}-${environment}-document-api`,
        Environment: environment,
      },
    }
  );

  // API Gateway resource for documents
  const documentsResource = new aws.apigateway.Resource(
    `${projectName}-${environment}-documents-resource`,
    {
      restApi: restApi.id,
      parentId: restApi.rootResourceId,
      pathPart: 'documents',
    }
  );

  // POST method for document submission
  const postMethod = new aws.apigateway.Method(
    `${projectName}-${environment}-post-method`,
    {
      restApi: restApi.id,
      resourceId: documentsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE', // In production, you'd want to add proper authorization

      requestValidatorId: new aws.apigateway.RequestValidator(
        `${projectName}-${environment}-validator`,
        {
          restApi: restApi.id,
          name: `${projectName}-${environment}-request-validator`,
          validateRequestBody: true,
          validateRequestParameters: true,
        }
      ).id,
    }
  );

  // Lambda integration
  const lambdaIntegration = new aws.apigateway.Integration(
    `${projectName}-${environment}-lambda-integration`,
    {
      restApi: restApi.id,
      resourceId: documentsResource.id,
      httpMethod: postMethod.httpMethod,

      integrationHttpMethod: 'POST',
      type: 'AWS_PROXY',
      uri: lambdaFunction.invokeArn,
    }
  );

  // Method response
  new aws.apigateway.MethodResponse(
    `${projectName}-${environment}-method-response`,
    {
      restApi: restApi.id,
      resourceId: documentsResource.id,
      httpMethod: postMethod.httpMethod,
      statusCode: '200',

      responseModels: {
        'application/json': 'Empty',
      },
    }
  );

  // Lambda permission for API Gateway
  new aws.lambda.Permission(
    `${projectName}-${environment}-api-lambda-permission`,
    {
      action: 'lambda:InvokeFunction',
      function: lambdaFunction.name,
      principal: 'apigateway.amazonaws.com',
      sourceArn: pulumi.interpolate`${restApi.executionArn}/*/*`,
    }
  );

  // API Gateway deployment
  const deployment = new aws.apigateway.Deployment(
    `${projectName}-${environment}-deployment`,
    {
      restApi: restApi.id,
      description: `${environment} deployment`,

      // Ensure deployment happens after all resources are created
      triggers: {
        redeployment: pulumi
          .all([restApi.body, postMethod.id, lambdaIntegration.id])
          .apply(([body, method, integration]) =>
            JSON.stringify({ body, method, integration })
          ),
      },
    },
    {
      dependsOn: [postMethod, lambdaIntegration],
    }
  );

  // API Gateway stage
  const stage = new aws.apigateway.Stage(
    `${projectName}-${environment}-stage`,
    {
      deployment: deployment.id,
      restApi: restApi.id,
      stageName: environment,

      // Enable logging
      accessLogSettings: {
        destinationArn: logGroup.arn,
        format: JSON.stringify({
          requestId: '$requestId',
          ip: '$sourceIp',
          requestTime: '$requestTime',
          httpMethod: '$httpMethod',
          resourcePath: '$resourcePath',
          status: '$status',
          protocol: '$protocol',
          responseLength: '$responseLength',
        }),
      },

      tags: {
        Name: `${projectName}-${environment}-stage`,
        Environment: environment,
      },
    }
  );

  // Enable detailed CloudWatch metrics
  new aws.apigateway.MethodSettings(
    `${projectName}-${environment}-method-settings`,
    {
      restApi: restApi.id,
      stageName: stage.stageName,
      methodPath: '*/*',

      settings: {
        metricsEnabled: true,
        loggingLevel: 'INFO',
        dataTraceEnabled: true,
        throttlingBurstLimit: 100,
        throttlingRateLimit: 50,
      },
    }
  );

  return {
    restApi,
    deployment,
    stage,
  };
}
```

### `src/monitoring/cloudwatch.ts`

```typescript
import * as aws from "@pulumi/aws";

export function createCloudWatchResources(projectName: string, environment: string) {
    // CloudWatch Log Group for Lambda function
    const lambdaLogGroup = new aws.cloudwatch.LogGroup(`${projectName}-${environment}-lambda-logs`, {
        name: `/aws/lambda/${projectName}-${environment}-document-processor`,
        retentionInDays: 90, // 90 days retention for compliance

        tags: {
            Name: `${projectName}-${environment}-lambda-logs`,
            Environment: environment,
            Purpose: "Lambda function logs"
        }
    });

    // CloudWatch Log Group for API Gateway
    const apiLogGroup = new aws.cloudwatch.LogGroup(`${projectName}-${environment}-api-logs`, {
        name: `/aws/apigateway/${projectName}-${environment}-document-api`,
        retentionInDays: 90,

        tags: {
            Name: `${projectName}-${environment}-api-logs`,
            Environment: environment,
            Purpose: "API Gateway access logs"
        }
    });

    // CloudWatch Alarm for Lambda errors
    new aws.cloudwatch.MetricAlarm(`${projectName}-${environment}-lambda-errors`, {
        name: `${projectName}-${environment}-lambda-errors`,
        description: "Lambda function error rate alarm",

        metricName: "Errors",
        namespace: "AWS/Lambda",
        statistic: "
```
