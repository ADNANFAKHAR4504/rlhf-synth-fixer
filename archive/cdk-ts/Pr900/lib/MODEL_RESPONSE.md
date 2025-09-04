# Secure AWS Infrastructure with CDK and TypeScript

I'll create a comprehensive CDK TypeScript solution that implements secure, multi-region AWS infrastructure with encryption at rest and in transit, following IAM best practices.

## Project Structure

```
secure-aws-infrastructure/
├── bin/
│   └── app.ts
├── lib/
│   ├── secure-infrastructure-stack.ts
│   └── constructs/
│       ├── secure-s3-bucket.ts
│       └── secure-api-gateway.ts
├── test/
│   ├── secure-infrastructure.test.ts
│   ├── secure-s3-bucket.test.ts
│   └── secure-api-gateway.test.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── jest.config.js
```

## 1. Package Configuration

### package.json

```json
{
  "name": "secure-aws-infrastructure",
  "version": "0.1.0",
  "bin": {
    "secure-aws-infrastructure": "bin/app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:watch": "jest --watch",
    "cdk": "cdk",
    "deploy": "cdk deploy --all",
    "destroy": "cdk destroy --all"
  },
  "devDependencies": {
    "@types/jest": "^29.5.5",
    "@types/node": "20.6.0",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "typescript": "~5.2.2"
  },
  "dependencies": {
    "aws-cdk-lib": "2.100.0",
    "constructs": "^10.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["cdk.out"]
}
```

### cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

### jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
```

## 2. Main Application Entry Point

### bin/app.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureInfrastructureStack } from '../lib/secure-infrastructure-stack';

const app = new cdk.App();

// Deploy to us-west-2
new SecureInfrastructureStack(app, 'SecureInfrastructureStack-USWest2', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description:
    'Secure infrastructure stack deployed in us-west-2 with encryption and least privilege IAM',
  tags: {
    Environment: 'production',
    Project: 'secure-infrastructure',
    Region: 'us-west-2',
  },
});

// Deploy to eu-central-1
new SecureInfrastructureStack(app, 'SecureInfrastructureStack-EUCentral1', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'eu-central-1',
  },
  description:
    'Secure infrastructure stack deployed in eu-central-1 with encryption and least privilege IAM',
  tags: {
    Environment: 'production',
    Project: 'secure-infrastructure',
    Region: 'eu-central-1',
  },
});
```

## 3. Secure S3 Bucket Construct

### lib/constructs/secure-s3-bucket.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SecureS3BucketProps {
  /**
   * The name prefix for the S3 bucket
   */
  bucketNamePrefix: string;

  /**
   * Optional KMS key for encryption. If not provided, a new key will be created
   */
  encryptionKey?: kms.IKey;

  /**
   * Whether to enable versioning on the bucket
   * @default true
   */
  versioned?: boolean;

  /**
   * Whether to enable access logging
   * @default true
   */
  accessLogging?: boolean;
}

/**
 * A secure S3 bucket construct that implements:
 * - KMS encryption at rest
 * - Versioning enabled
 * - Public access blocked
 * - SSL/TLS enforcement
 * - Access logging
 */
export class SecureS3Bucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly encryptionKey: kms.IKey;
  public readonly accessRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecureS3BucketProps) {
    super(scope, id);

    // Create KMS key for S3 encryption if not provided
    this.encryptionKey =
      props.encryptionKey ??
      new kms.Key(this, 'S3EncryptionKey', {
        description: `KMS key for S3 bucket ${props.bucketNamePrefix} encryption`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
        keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
        keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      });

    // Add key alias for easier identification
    new kms.Alias(this, 'S3EncryptionKeyAlias', {
      aliasName: `alias/${props.bucketNamePrefix}-s3-encryption-key`,
      targetKey: this.encryptionKey,
    });

    // Create access logging bucket if enabled
    let accessLogsBucket: s3.Bucket | undefined;
    if (props.accessLogging !== false) {
      accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
        bucketName: `${props.bucketNamePrefix}-access-logs-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: false,
        lifecycleRules: [
          {
            id: 'DeleteOldAccessLogs',
            expiration: cdk.Duration.days(90),
            enabled: true,
          },
        ],
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      });
    }

    // Create the main S3 bucket with security best practices
    this.bucket = new s3.Bucket(this, 'SecureBucket', {
      bucketName: `${props.bucketNamePrefix}-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,

      // Encryption configuration
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.encryptionKey,
      bucketKeyEnabled: true, // Reduces KMS costs

      // Security configurations
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: props.versioned !== false,

      // Access logging
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'access-logs/',

      // Lifecycle management
      lifecycleRules: [
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
          enabled: true,
        },
      ],

      // Cleanup policy
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // Enforce SSL/TLS for all requests to the bucket
    this.bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyInsecureConnections',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:*'],
        resources: [this.bucket.bucketArn, this.bucket.arnForObjects('*')],
        conditions: {
          Bool: {
            'aws:SecureTransport': 'false',
          },
        },
      })
    );

    // Create IAM role with least privilege access to the bucket
    this.accessRole = new iam.Role(this, 'S3AccessRole', {
      roleName: `${props.bucketNamePrefix}-s3-access-role-${cdk.Aws.REGION}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'Role with least privilege access to secure S3 bucket',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Grant minimal required permissions to the role
    this.bucket.grantRead(this.accessRole);
    this.bucket.grantWrite(this.accessRole);

    // Allow the role to use the KMS key
    this.encryptionKey.grantEncryptDecrypt(this.accessRole);

    // Add explicit policy for the role with least privilege
    this.accessRole.addToPolicy(
      new iam.PolicyStatement({
        sid: 'S3BucketAccess',
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [this.bucket.bucketArn, this.bucket.arnForObjects('*')],
      })
    );

    // Output important information
    new cdk.CfnOutput(this, 'BucketName', {
      value: this.bucket.bucketName,
      description: 'Name of the secure S3 bucket',
    });

    new cdk.CfnOutput(this, 'BucketArn', {
      value: this.bucket.bucketArn,
      description: 'ARN of the secure S3 bucket',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.encryptionKey.keyId,
      description: 'ID of the KMS key used for S3 encryption',
    });

    new cdk.CfnOutput(this, 'AccessRoleArn', {
      value: this.accessRole.roleArn,
      description: 'ARN of the IAM role with access to the S3 bucket',
    });
  }
}
```

## 4. Secure API Gateway Construct

### lib/constructs/secure-api-gateway.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import { Construct } from 'constructs';

export interface SecureApiGatewayProps {
  /**
   * The S3 bucket that the API will interact with
   */
  bucket: s3.IBucket;

  /**
   * The IAM role that Lambda functions will assume
   */
  lambdaExecutionRole: iam.IRole;

  /**
   * Domain name for the API (optional)
   */
  domainName?: string;

  /**
   * Hosted zone for the domain (required if domainName is provided)
   */
  hostedZone?: route53.IHostedZone;

  /**
   * API name prefix
   */
  apiNamePrefix: string;
}

/**
 * A secure API Gateway construct that implements:
 * - SSL/TLS encryption in transit
 * - Custom domain with SSL certificate
 * - Lambda integration with least privilege IAM
 * - Request/response logging
 * - Throttling and rate limiting
 */
export class SecureApiGateway extends Construct {
  public readonly api: apigateway.RestApi;
  public readonly certificate?: certificatemanager.ICertificate;
  public readonly lambdaFunction: lambda.Function;

  constructor(scope: Construct, id: string, props: SecureApiGatewayProps) {
    super(scope, id);

    // Create Lambda function that interacts with S3
    this.lambdaFunction = new lambda.Function(this, 'ApiLambdaFunction', {
      functionName: `${props.apiNamePrefix}-handler-${cdk.Aws.REGION}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      role: props.lambdaExecutionRole,
      environment: {
        BUCKET_NAME: props.bucket.bucketName,
        REGION: cdk.Aws.REGION,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const s3 = new AWS.S3();
        
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          
          try {
            const method = event.httpMethod;
            const path = event.path;
            
            if (method === 'GET' && path === '/data') {
              // List objects in the bucket
              const params = {
                Bucket: process.env.BUCKET_NAME,
                MaxKeys: 10
              };
              
              const result = await s3.listObjectsV2(params).promise();
              
              return {
                statusCode: 200,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Content-Type',
                  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                  message: 'Data retrieved successfully',
                  objects: result.Contents || []
                })
              };
            }
            
            if (method === 'POST' && path === '/data') {
              // Upload data to the bucket
              const body = JSON.parse(event.body || '{}');
              const key = body.key || 'default-key';
              const data = body.data || 'default-data';
              
              const params = {
                Bucket: process.env.BUCKET_NAME,
                Key: key,
                Body: data,
                ServerSideEncryption: 'aws:kms'
              };
              
              await s3.putObject(params).promise();
              
              return {
                statusCode: 201,
                headers: {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Headers': 'Content-Type',
                  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
                },
                body: JSON.stringify({
                  message: 'Data uploaded successfully',
                  key: key
                })
              };
            }
            
            return {
              statusCode: 404,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'Not found'
              })
            };
            
          } catch (error) {
            console.error('Error:', error);
            return {
              statusCode: 500,
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                message: 'Internal server error',
                error: error.message
              })
            };
          }
        };
      `),
    });

    // Create SSL certificate if domain name is provided
    if (props.domainName && props.hostedZone) {
      this.certificate = new certificatemanager.Certificate(
        this,
        'ApiCertificate',
        {
          domainName: props.domainName,
          validation: certificatemanager.CertificateValidation.fromDns(
            props.hostedZone
          ),
        }
      );
    }

    // Create API Gateway with security configurations
    this.api = new apigateway.RestApi(this, 'SecureApi', {
      restApiName: `${props.apiNamePrefix}-api`,
      description:
        'Secure API Gateway with SSL/TLS encryption and least privilege access',

      // Security configurations
      endpointConfiguration: {
        types: [apigateway.EndpointType.REGIONAL],
      },

      // Enable CloudWatch logging
      deployOptions: {
        stageName: 'prod',
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        dataTraceEnabled: true,
        metricsEnabled: true,

        // Throttling configuration
        throttleSettings: {
          rateLimit: 1000,
          burstLimit: 2000,
        },

        // Method throttling for specific endpoints
        methodOptions: {
          '/*/*': {
            throttlingRateLimit: 100,
            throttlingBurstLimit: 200,
          },
        },
      },

      // CORS configuration
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'X-Amz-Date',
          'Authorization',
          'X-Api-Key',
        ],
      },

      // Custom domain configuration
      domainName:
        props.domainName && this.certificate
          ? {
              domainName: props.domainName,
              certificate: this.certificate,
              endpointType: apigateway.EndpointType.REGIONAL,
              securityPolicy: apigateway.SecurityPolicy.TLS_1_2,
            }
          : undefined,
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(
      this.lambdaFunction,
      {
        requestTemplates: {
          'application/json': '{ "statusCode": "200" }',
        },
        proxy: true,
      }
    );

    // Add API resources and methods
    const dataResource = this.api.root.addResource('data');

    // GET /data - retrieve data from S3
    dataResource.addMethod('GET', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
      apiKeyRequired: false,
      methodResponses: [
        {
          statusCode: '200',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // POST /data - upload data to S3
    dataResource.addMethod('POST', lambdaIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
      apiKeyRequired: false,
      methodResponses: [
        {
          statusCode: '201',
          responseModels: {
            'application/json': apigateway.Model.EMPTY_MODEL,
          },
        },
      ],
    });

    // Add custom domain DNS record if configured
    if (props.domainName && props.hostedZone && this.api.domainName) {
      new route53.ARecord(this, 'ApiAliasRecord', {
        zone: props.hostedZone,
        recordName: props.domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.ApiGatewayDomain(this.api.domainName)
        ),
      });
    }

    // Create API usage plan for rate limiting
    const usagePlan = this.api.addUsagePlan('ApiUsagePlan', {
      name: `${props.apiNamePrefix}-usage-plan`,
      description: 'Usage plan for secure API with rate limiting',
      throttle: {
        rateLimit: 1000,
        burstLimit: 2000,
      },
      quota: {
        limit: 10000,
        period: apigateway.Period.DAY,
      },
    });

    // Associate the usage plan with the API stage
    usagePlan.addApiStage({
      stage: this.api.deploymentStage,
    });

    // Output important information
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: this.api.url,
      description: 'URL of the secure API Gateway',
    });

    new cdk.CfnOutput(this, 'ApiId', {
      value: this.api.restApiId,
      description: 'ID of the API Gateway',
    });

    if (props.domainName) {
      new cdk.CfnOutput(this, 'CustomDomainUrl', {
        value: `https://${props.domainName}`,
        description: 'Custom domain URL for the API',
      });
    }

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: this.lambdaFunction.functionArn,
      description: 'ARN of the Lambda function',
    });
  }
}
```

## 5. Main Infrastructure Stack

### lib/secure-infrastructure-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { SecureS3Bucket } from './constructs/secure-s3-bucket';
import { SecureApiGateway } from './constructs/secure-api-gateway';

/**
 * Main stack that orchestrates the secure infrastructure components
 */
export class SecureInfrastructureStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly s3Bucket: SecureS3Bucket;
  public readonly apiGateway: SecureApiGateway;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const region = props?.env?.region || 'us-west-2';
    const stackPrefix = `secure-infra-${region}`;

    // Create VPC with security best practices
    this.vpc = new ec2.Vpc(this, 'SecureVpc', {
      vpcName: `${stackPrefix}-vpc`,
      maxAzs: 3,
      natGateways: 2, // For high availability

      // Define subnet configuration
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],

      // Enable DNS
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // Add VPC Flow Logs for security monitoring
    this.vpc.addFlowLog('VpcFlowLog', {
      trafficType: ec2.FlowLogTrafficType.ALL,
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
    });

    // Create secure S3 bucket
    this.s3Bucket = new SecureS3Bucket(this, 'SecureS3Bucket', {
      bucketNamePrefix: stackPrefix,
      versioned: true,
      accessLogging: true,
    });

    // Create secure API Gateway
    this.apiGateway = new SecureApiGateway(this, 'SecureApiGateway', {
      bucket: this.s3Bucket.bucket,
      lambdaExecutionRole: this.s3Bucket.accessRole,
      apiNamePrefix: stackPrefix,
    });

    // Create EC2 instances with security configurations
    this.createSecureEc2Instances(stackPrefix);

    // Add stack-level tags
    cdk.Tags.of(this).add('Stack', id);
    cdk.Tags.of(this).add('Environment', 'production');
    cdk.Tags.of(this).add('Security', 'high');
    cdk.Tags.of(this).add('Compliance', 'required');
  }

  private createSecureEc2Instances(stackPrefix: string): void {
    // Create security group for EC2 instances
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc: this.vpc,
      securityGroupName: `${stackPrefix}-ec2-sg`,
      description: 'Security group for EC2 instances with minimal required access',
      allowAllOutbound: false, // Explicit outbound rules
    });

    // Allow HTTPS outbound for package updates and AWS API calls
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound for AWS APIs and package updates'
    );

    // Allow HTTP outbound for package repositories (consider restricting to specific IPs)
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound for package repositories'
    );

    // Create IAM role for EC2 instances with minimal permissions
    const ec2Role = new cdk.aws_iam.Role(this, 'Ec2Role', {
      roleName: `${stackPrefix}-ec2-role`,
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege access',
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Grant minimal S3 access to EC2 role
    this.s3Bucket.bucket.grantRead(ec2Role);
    this.s3Bucket.encryptionKey.grantDecrypt(ec2Role);

    // Create instance profile
    const instanceProfile = new cdk.aws_iam.CfnInstanceProfile(this, 'Ec2InstanceProfile', {
      instanceProfileName: `${stackPrefix}-ec2-instance-profile`,
      roles: [ec2Role.roleName],
    });

    // Create EC2 instances in private subnets
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-ssm-agent',
      'systemctl enable amazon-ssm-agent',
      'systemctl start amazon-ssm-agent',

      // Install CloudWatch agent
      'wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm',
      'rpm -U ./amazon-cloudwatch-agent.rpm',

      // Configure CloudWatch agent
      'cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF',
      JSON.stringify({
        metrics: {
          namespace: 'AWS/EC2/Custom',
          metrics_collected: {
            cpu: {
              measurement: ['cpu_usage_idle', 'cpu_usage_iowait', 'cpu_usage_user', 'cpu_usage_system'],
              metrics_collection_interval: 60,
            },
            disk: {
              measurement: ['used_percent'],
              metrics_collection_interval: 60,
              resources: ['*'],
            },
            mem: {
              measurement: ['mem_used_percent'],
              metrics_collection_interval: 60,
            },
          },
        },
        logs: {
          logs_collected: {
            files: {
              collect_list: [
                {
                  file_path: '/var/log/messages',
                  log_group_name: `/aws/ec2/${stackPrefix}`,
                  log_stream_name: '{instance_id}/messages',
                },
              ],
            },
          },
        },
      }),
      'EOF',

      // Start CloudWatch agent
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Launch template for consistent configuration
    const launchTemplate = new ec2.LaunchTemplate(this, 'Ec2LaunchTemplate', {
      launchTemplateName: `${stackPrefix}-launch-template`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3
```
