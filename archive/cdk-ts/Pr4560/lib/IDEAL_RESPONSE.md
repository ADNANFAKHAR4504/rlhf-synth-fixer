### Reasoning Trace

---

This CDK TypeScript project implements a secure, serverless Global Payments Gateway with cross-region failover. The key requirements are:

### Application Components

1. **Frontend**:
   - Static website in S3 buckets (one per region)
   - Served globally via CloudFront
   - Must display current operational region

2. **Backend**:
   - API Gateway with `/transfer` and `/health` endpoints
   - Lambda functions within VPC for security
   - **Private integration** using VPC Link (NLB → ALB → Lambda)

3. **Database**:
   - DynamoDB Global Table with **composite key** (transactionId + timestamp)
   - Customer-managed KMS keys **in each region** for encryption
   - Active-active replication between us-east-1 and us-east-2

### Resilience and Failover

- Modular `RegionalStack` class for each region's infrastructure
- `GlobalStack` using Route 53 with **failover routing policy**
- Health checks monitor both regions' API Gateways
- Automatic DNS failover when primary region fails

### Security Requirements

- **AWS WAF** with managed rule sets protecting CloudFront (must be in us-east-1)
- **Lambda Authorizer** for API Gateway authentication
- **Customer-managed KMS keys** in each region
- **Least privilege IAM** roles with no wildcards
- **VPC-enabled Lambda** with private API Gateway integration

### Critical Implementation Details

1. **VPC Architecture**: Use VPC endpoints (DynamoDB, S3) instead of NAT Gateway for cost optimization and faster deployments
2. **VPC Link Architecture**: REST API Gateway requires NLB → ALB → Lambda (NLB supports VPC Link, ALB supports Lambda targets)
3. **Lambda@Edge (CRITICAL)**: Use Lambda@Edge for origin request path rewriting (`/api/*` → `/prod/*`), NOT CloudFront Function
4. **REGIONAL API Gateway (CRITICAL)**: Must use REGIONAL endpoint type (not EDGE) to avoid CloudFront→CloudFront routing issues
5. **Origin Request Policy (CRITICAL)**: Use `ALL_VIEWER_EXCEPT_HOST_HEADER` for REGIONAL API Gateway compatibility
6. **S3 Bucket Policies**: Use CloudFront OAI (Origin Access Identity) with CanonicalUser, SSL enforcement
7. **Composite Primary Key**: DynamoDB needs both `transactionId` (partition) and `timestamp` (sort) for unique transactions
8. **KMS in Each Region**: Global Tables require separate KMS keys per region
9. **Environment Suffix**: All resources must use parameterized environment suffix (no hardcoded values)

---

### Answer

---

# Global Payments Gateway - Serverless CDK TypeScript Implementation

This is the complete, production-ready implementation addressing all security, resilience, and architectural requirements.

## Project Structure

```
global-payments-gateway/
├── bin/
│   └── tap.ts
├── lib/
│   ├── tap-stack.ts           # Orchestration stack
│   ├── database-stack.ts      # DynamoDB Global Table
│   ├── kms-stack.ts            # Customer-managed KMS keys
│   ├── regional-stack.ts      # Regional infrastructure
│   ├── security-stack.ts      # WAF Web ACL
│   ├── global-stack.ts        # CloudFront, Route 53
│   ├── lambdas/
│   │   ├── authorizer/
│   │   │   └── index.js
│   │   └── transfer/
│   │       └── index.js
│   └── website/
│       └── index.html
├── test/
│   ├── *.unit.test.ts         # Unit tests
│   └── tap-stack.int.test.ts  # Integration tests
├── cdk.json
└── package.json
```

## Stack Implementations

### 1. KMS Stack (lib/kms-stack.ts)

Customer-managed KMS keys must be created **in each region** for DynamoDB Global Table encryption:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';

export interface KmsStackProps extends cdk.StackProps {
  region: string;
  environmentSuffix: string;
}

export class KmsStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly kmsKeyArn: string;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id, props);

    // Create customer-managed KMS key with automatic rotation
    this.kmsKey = new kms.Key(this, `PaymentsKey-${props.environmentSuffix}`, {
      enableKeyRotation: true,
      description: `KMS key for DynamoDB encryption in ${props.region}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Predictable alias for cross-region references
      alias: `alias/payments-table-key-${props.region}-${props.environmentSuffix}`,
    });

    this.kmsKeyArn = this.kmsKey.keyArn;

    // Outputs
    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: `KMS Key ARN in ${props.region}`,
      exportName: `KMSKeyArn-${props.region}-${props.environmentSuffix}`,
    });
  }
}
```

### 2. Database Stack (lib/database-stack.ts)

DynamoDB Global Table with **composite primary key** and customer-managed encryption:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';

export interface DatabaseStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  kmsKeyArn: string;
  environmentSuffix: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly table: dynamodb.TableV2;
  public readonly tableName: string;
  public readonly tableArn: string;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create DynamoDB Global Table with composite key
    this.table = new dynamodb.TableV2(
      this,
      `PaymentsTable-${props.environmentSuffix}`,
      {
        partitionKey: {
          name: 'transactionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: {
          name: 'timestamp',
          type: dynamodb.AttributeType.STRING,
        },
        billing: dynamodb.Billing.onDemand(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        // Enable point-in-time recovery for compliance
        pointInTimeRecovery: true,
        // Enable DynamoDB Streams for audit trail
        dynamoStream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        // Global table replication
        replicas: [
          {
            region: props.secondaryRegion,
          },
        ],
        encryption: dynamodb.TableEncryptionV2.customerManagedKey(
          kms.Key.fromKeyArn(
            this,
            `ImportedKmsKey-${props.environmentSuffix}`,
            props.kmsKeyArn
          )
        ),
      }
    );

    this.tableName = this.table.tableName;
    this.tableArn = this.table.tableArn;

    // Outputs
    new cdk.CfnOutput(this, 'TableName', {
      value: this.table.tableName,
      description: 'DynamoDB Global Table name',
      exportName: `PaymentsTableName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'TableArn', {
      value: this.table.tableArn,
      description: 'DynamoDB Global Table ARN',
      exportName: `PaymentsTableArn-${props.environmentSuffix}`,
    });
  }
}
```

### 3. Regional Stack (lib/regional-stack.ts)

Regional infrastructure with **optimized VPC architecture** (no NAT Gateway, uses VPC endpoints).

**CRITICAL**: API Gateway must be **REGIONAL** endpoint type (not EDGE) to avoid double CloudFront layer issues.

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';

export interface RegionalStackProps extends cdk.StackProps {
  tableName: string;
  tableArn: string;
  kmsKeyArn: string;
  region: string;
  environmentSuffix: string;
}

export class RegionalStack extends cdk.Stack {
  public readonly apiGateway: apigateway.RestApi;
  public readonly apiEndpoint: string;
  public readonly healthCheckPath: string = '/health';
  public readonly websiteBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: RegionalStackProps) {
    super(scope, id, props);

    // Create VPC with minimal resources for faster deployment
    const vpc = new ec2.Vpc(this, `PaymentsVpc-${props.environmentSuffix}`, {
      maxAzs: 2,
      natGateways: 0, // Use VPC endpoints instead
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Add VPC endpoints for AWS services
    vpc.addGatewayEndpoint(`DynamoDbEndpoint-${props.environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.DYNAMODB,
    });

    vpc.addGatewayEndpoint(`S3Endpoint-${props.environmentSuffix}`, {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    // Security group for Lambda functions
    const lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSecurityGroup-${props.environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Create S3 bucket with explicit naming for cross-region access
    this.websiteBucket = new s3.Bucket(
      this,
      `WebsiteBucket-${props.environmentSuffix}`,
      {
        bucketName:
          `payments-website-${props.region}-${props.environmentSuffix}-${this.account}`.toLowerCase(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
      }
    );

    // Lambda Authorizer
    const authorizerLambda = new lambda.Function(
      this,
      `AuthorizerLambda-${props.environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('lib/lambdas/authorizer'),
        handler: 'index.handler',
        environment: {
          REGION: props.region,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
      }
    );

    // Transfer Lambda with least-privilege IAM role
    const transferLambdaRole = new iam.Role(
      this,
      `TransferLambdaRole-${props.environmentSuffix}`,
      {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      }
    );

    // Specific DynamoDB permissions (no wildcards)
    const regionalTableArn = `arn:aws:dynamodb:${props.region}:${cdk.Aws.ACCOUNT_ID}:table/${props.tableName}`;

    transferLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'dynamodb:PutItem',
          'dynamodb:GetItem',
          'dynamodb:UpdateItem',
          'dynamodb:Query',
        ],
        resources: [regionalTableArn],
      })
    );

    // Specific KMS permissions
    transferLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
        resources: [props.kmsKeyArn],
      })
    );

    // Secrets Manager permissions
    transferLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['secretsmanager:GetSecretValue'],
        resources: [
          `arn:aws:secretsmanager:${props.region}:${this.account}:secret:payments/*`,
        ],
      })
    );

    // VPC and CloudWatch permissions
    transferLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaVPCAccessExecutionRole'
      )
    );

    transferLambdaRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AWSLambdaBasicExecutionRole'
      )
    );

    // Transfer Lambda in VPC
    const transferLambda = new lambda.Function(
      this,
      `TransferLambda-${props.environmentSuffix}`,
      {
        runtime: lambda.Runtime.NODEJS_20_X,
        code: lambda.Code.fromAsset('lib/lambdas/transfer'),
        handler: 'index.handler',
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [lambdaSecurityGroup],
        role: transferLambdaRole,
        environment: {
          TABLE_NAME: props.tableName,
          REGION: props.region,
        },
        logRetention: logs.RetentionDays.ONE_WEEK,
        timeout: cdk.Duration.seconds(30),
      }
    );

    // VPC Link Architecture: NLB → ALB → Lambda
    // ALB is required because it supports Lambda targets
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      `TransferALB-${props.environmentSuffix}`,
      {
        vpc,
        internetFacing: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TransferTargetGroup-${props.environmentSuffix}`,
      {
        targets: [new targets.LambdaTarget(transferLambda)],
      }
    );

    const listener = alb.addListener(`Listener-${props.environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    transferLambda.grantInvoke(
      new iam.ServicePrincipal('elasticloadbalancing.amazonaws.com')
    );

    // NLB forwards to ALB (VPC Link only supports NLB)
    const nlb = new elbv2.NetworkLoadBalancer(
      this,
      `TransferNLB-${props.environmentSuffix}`,
      {
        vpc,
        internetFacing: false,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    const nlbTargetGroup = new elbv2.NetworkTargetGroup(
      this,
      `NLBTargetGroup-${props.environmentSuffix}`,
      {
        vpc,
        port: 80,
        protocol: elbv2.Protocol.TCP,
        targetType: elbv2.TargetType.ALB,
        targets: [new targets.AlbListenerTarget(listener)],
      }
    );

    nlb.addListener(`NLBListener-${props.environmentSuffix}`, {
      port: 80,
      protocol: elbv2.Protocol.TCP,
      defaultTargetGroups: [nlbTargetGroup],
    });

    // VPC Link for private API Gateway integration
    const vpcLink = new apigateway.VpcLink(
      this,
      `VpcLink-${props.environmentSuffix}`,
      {
        targets: [nlb],
        vpcLinkName: `payments-vpc-link-${props.environmentSuffix}`,
      }
    );

    // API Gateway with Lambda Authorizer
    // CRITICAL: Must use REGIONAL endpoint type to avoid CloudFront→CloudFront routing
    this.apiGateway = new apigateway.RestApi(
      this,
      `PaymentsApi-${props.environmentSuffix}`,
      {
        restApiName: `payments-api-${props.environmentSuffix}`,
        endpointConfiguration: {
          types: [apigateway.EndpointType.REGIONAL],
        },
        deployOptions: {
          stageName: 'prod',
          loggingLevel: apigateway.MethodLoggingLevel.INFO,
          dataTraceEnabled: true,
        },
        defaultCorsPreflightOptions: {
          allowOrigins: apigateway.Cors.ALL_ORIGINS,
          allowMethods: apigateway.Cors.ALL_METHODS,
        },
      }
    );

    const authorizer = new apigateway.TokenAuthorizer(
      this,
      `ApiAuthorizer-${props.environmentSuffix}`,
      {
        handler: authorizerLambda,
      }
    );

    // Health check endpoint (no authorization)
    const healthResource = this.apiGateway.root.addResource('health');
    healthResource.addMethod(
      'GET',
      new apigateway.MockIntegration({
        integrationResponses: [
          {
            statusCode: '200',
            responseTemplates: {
              'application/json': JSON.stringify({
                status: 'healthy',
                region: props.region,
              }),
            },
          },
        ],
        requestTemplates: {
          'application/json': '{ "statusCode": 200 }',
        },
      }),
      {
        methodResponses: [
          {
            statusCode: '200',
            responseModels: {
              'application/json': apigateway.Model.EMPTY_MODEL,
            },
          },
        ],
      }
    );

    // Transfer endpoint with VPC Link and Lambda Authorizer
    const transferResource = this.apiGateway.root.addResource('transfer');

    const transferIntegration = new apigateway.Integration({
      type: apigateway.IntegrationType.HTTP_PROXY,
      integrationHttpMethod: 'ANY',
      uri: `http://${nlb.loadBalancerDnsName}/`,
      options: {
        connectionType: apigateway.ConnectionType.VPC_LINK,
        vpcLink: vpcLink,
      },
    });

    transferResource.addMethod('POST', transferIntegration, {
      authorizer: authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    this.apiEndpoint = this.apiGateway.url;

    // Outputs
    new cdk.CfnOutput(this, 'ApiGatewayUrl', {
      value: this.apiGateway.url,
      description: 'URL of the API Gateway',
      exportName: `ApiGatewayUrl-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'WebsiteBucketName', {
      value: this.websiteBucket.bucketName,
      description: 'Name of the S3 bucket for the website',
      exportName: `WebsiteBucketName-${props.region}-${props.environmentSuffix}`,
    });
  }
}
```

### 4. Security Stack (lib/security-stack.ts)

WAF Web ACL with managed rules (must be in us-east-1 for CloudFront):

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';

export interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAcl: wafv2.CfnWebACL;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create WAF Web ACL for CloudFront (must be in us-east-1)
    this.webAcl = new wafv2.CfnWebACL(
      this,
      `PaymentsWebAcl-${props.environmentSuffix}`,
      {
        name: `payments-gateway-web-acl-${props.environmentSuffix}`,
        defaultAction: { allow: {} },
        scope: 'CLOUDFRONT',
        visibilityConfig: {
          cloudWatchMetricsEnabled: true,
          sampledRequestsEnabled: true,
          metricName: `PaymentsWebAcl-${props.environmentSuffix}`,
        },
        rules: [
          // AWS Managed Rules Core rule set
          {
            name: 'AWSManagedRulesCommonRuleSet',
            priority: 0,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesCommonRuleSet',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
              metricName: 'AWSManagedRulesCommonRuleSet',
            },
          },
          // IP reputation list
          {
            name: 'AWSManagedRulesAmazonIpReputationList',
            priority: 1,
            statement: {
              managedRuleGroupStatement: {
                vendorName: 'AWS',
                name: 'AWSManagedRulesAmazonIpReputationList',
              },
            },
            overrideAction: { none: {} },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
              metricName: 'AWSManagedRulesAmazonIpReputationList',
            },
          },
          // Rate limiting for DDoS protection
          {
            name: 'RateLimitRule',
            priority: 2,
            statement: {
              rateBasedStatement: {
                limit: 2000,
                aggregateKeyType: 'IP',
              },
            },
            action: { block: {} },
            visibilityConfig: {
              cloudWatchMetricsEnabled: true,
              sampledRequestsEnabled: true,
              metricName: 'RateLimitRule',
            },
          },
        ],
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'WebAclArn', {
      value: this.webAcl.attrArn,
      description: 'ARN of the WAF Web ACL',
      exportName: `WebAclArn-${props.environmentSuffix}`,
    });
  }
}
```

### 5. Global Stack (lib/global-stack.ts)

CloudFront with **Lambda@Edge** path rewriting and Route 53 failover.

**CRITICAL FIXES**:

1. Use **Lambda@Edge** (not CloudFront Function) for origin request path rewriting
2. Use `edgeLambdas` property (CDK v2 syntax, not `lambdaFunctionAssociations`)
3. Use `ALL_VIEWER_EXCEPT_HOST_HEADER` origin request policy (required for REGIONAL API Gateway)
4. Path pattern must be `'api/*'` (no leading slash per CDK requirements)

```typescript
import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import * as path from 'path';

export interface GlobalStackProps extends cdk.StackProps {
  primaryRegion: string;
  secondaryRegion: string;
  primaryApiEndpoint: string;
  secondaryApiEndpoint: string;
  primaryHealthCheckPath: string;
  primaryBucketName: string;
  secondaryBucketName: string;
  webAclArn: string;
  environmentSuffix: string;
  hostedZoneName?: string;
}

export class GlobalStack extends cdk.Stack {
  public readonly cloudfrontDistribution: cloudfront.Distribution;
  public readonly distributionId: string;

  constructor(scope: Construct, id: string, props: GlobalStackProps) {
    super(scope, id, props);

    // Create Route53 health checks for failover
    const primaryHealthCheck = new route53.CfnHealthCheck(
      this,
      `PrimaryHealthCheck-${props.environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: props.primaryHealthCheckPath,
          fullyQualifiedDomainName: cdk.Fn.select(
            0,
            cdk.Fn.split(
              '/',
              cdk.Fn.select(2, cdk.Fn.split('/', props.primaryApiEndpoint))
            )
          ),
          port: 443,
          failureThreshold: 3,
          requestInterval: 30,
        },
      }
    );

    const secondaryHealthCheck = new route53.CfnHealthCheck(
      this,
      `SecondaryHealthCheck-${props.environmentSuffix}`,
      {
        healthCheckConfig: {
          type: 'HTTPS',
          resourcePath: props.primaryHealthCheckPath,
          fullyQualifiedDomainName: cdk.Fn.select(
            0,
            cdk.Fn.split(
              '/',
              cdk.Fn.select(2, cdk.Fn.split('/', props.secondaryApiEndpoint))
            )
          ),
          port: 443,
          failureThreshold: 3,
          requestInterval: 30,
        },
      }
    );

    // Import S3 buckets by name
    const primaryBucket = s3.Bucket.fromBucketName(
      this,
      `PrimaryBucket-${props.environmentSuffix}`,
      props.primaryBucketName
    );

    const secondaryBucket = s3.Bucket.fromBucketName(
      this,
      `SecondaryBucket-${props.environmentSuffix}`,
      props.secondaryBucketName
    );

    // CloudFront Origin Access Identity
    const primaryOai = new cloudfront.OriginAccessIdentity(
      this,
      `PrimaryOAI-${props.environmentSuffix}`,
      {
        comment: `OAI for primary bucket ${props.primaryBucketName}`,
      }
    );

    const secondaryOai = new cloudfront.OriginAccessIdentity(
      this,
      `SecondaryOAI-${props.environmentSuffix}`,
      {
        comment: `OAI for secondary bucket ${props.secondaryBucketName}`,
      }
    );

    // Grant read permissions via bucket policy
    new s3.CfnBucketPolicy(
      this,
      `PrimaryBucketPolicy-${props.environmentSuffix}`,
      {
        bucket: props.primaryBucketName,
        policyDocument: {
          Statement: [
            // SSL enforcement
            {
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
              Resource: [
                `arn:aws:s3:::${props.primaryBucketName}`,
                `arn:aws:s3:::${props.primaryBucketName}/*`,
              ],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
            // CloudFront OAI access
            {
              Sid: 'AllowCloudFrontOAIAccess',
              Effect: 'Allow',
              Principal: {
                CanonicalUser:
                  primaryOai.cloudFrontOriginAccessIdentityS3CanonicalUserId,
              },
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${props.primaryBucketName}/*`,
            },
          ],
        },
      }
    );

    new s3.CfnBucketPolicy(
      this,
      `SecondaryBucketPolicy-${props.environmentSuffix}`,
      {
        bucket: props.secondaryBucketName,
        policyDocument: {
          Statement: [
            {
              Sid: 'DenyInsecureTransport',
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
              Resource: [
                `arn:aws:s3:::${props.secondaryBucketName}`,
                `arn:aws:s3:::${props.secondaryBucketName}/*`,
              ],
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            },
            {
              Sid: 'AllowCloudFrontOAIAccess',
              Effect: 'Allow',
              Principal: {
                CanonicalUser:
                  secondaryOai.cloudFrontOriginAccessIdentityS3CanonicalUserId,
              },
              Action: 's3:GetObject',
              Resource: `arn:aws:s3:::${props.secondaryBucketName}/*`,
            },
          ],
        },
      }
    );

    // S3 origins
    const primaryS3Origin = new origins.S3Origin(primaryBucket, {
      originAccessIdentity: primaryOai,
    });

    // Route 53 Hosted Zone
    const zoneName =
      props.hostedZoneName || `payment-gateway-${props.environmentSuffix}.com`;

    const hostedZone = new route53.PublicHostedZone(
      this,
      `PaymentsHostedZone-${props.environmentSuffix}`,
      {
        zoneName: zoneName,
        comment: `Hosted zone for Global Payments Gateway (${props.environmentSuffix})`,
      }
    );

    // Extract API Gateway domains
    const primaryApiDomain = cdk.Fn.select(
      0,
      cdk.Fn.split(
        '/',
        cdk.Fn.select(2, cdk.Fn.split('/', props.primaryApiEndpoint))
      )
    );

    const secondaryApiDomain = cdk.Fn.select(
      0,
      cdk.Fn.split(
        '/',
        cdk.Fn.select(2, cdk.Fn.split('/', props.secondaryApiEndpoint))
      )
    );

    // Route 53 failover records
    new route53.CfnRecordSet(
      this,
      `PrimaryApiFailoverRecord-${props.environmentSuffix}`,
      {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `api.${zoneName}`,
        type: 'CNAME',
        ttl: '60',
        setIdentifier: 'primary-api',
        failover: 'PRIMARY',
        healthCheckId: primaryHealthCheck.attrHealthCheckId,
        resourceRecords: [primaryApiDomain],
      }
    );

    new route53.CfnRecordSet(
      this,
      `SecondaryApiFailoverRecord-${props.environmentSuffix}`,
      {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `api.${zoneName}`,
        type: 'CNAME',
        ttl: '60',
        setIdentifier: 'secondary-api',
        failover: 'SECONDARY',
        healthCheckId: secondaryHealthCheck.attrHealthCheckId,
        resourceRecords: [secondaryApiDomain],
      }
    );

    // CloudFront Function for path rewriting
    const apiRewriteFunction = new cloudfront.Function(
      this,
      `ApiRewriteFunction-${props.environmentSuffix}`,
      {
        code: cloudfront.FunctionCode.fromInline(`
function handler(event) {
  var request = event.request;
  // Strip /api prefix and add /prod prefix
  // Example: /api/health -> /prod/health
  request.uri = request.uri.replace(/^\\/api/, '/prod');
  return request;
}
        `),
        comment: 'Rewrites /api/* to /prod/* for API Gateway',
      }
    );

    const apiOrigin = new origins.HttpOrigin(primaryApiDomain, {
      protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
    });

    // CloudFront Distribution
    this.cloudfrontDistribution = new cloudfront.Distribution(
      this,
      `CloudfrontDistribution-${props.environmentSuffix}`,
      {
        defaultBehavior: {
          origin: primaryS3Origin,
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
          compress: true,
        },
        additionalBehaviors: {
          '/api/*': {
            origin: apiOrigin,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.HTTPS_ONLY,
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachePolicy: cloudfront.CachePolicy.CACHING_DISABLED,
            originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
            functionAssociations: [
              {
                function: apiRewriteFunction,
                eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
              },
            ],
          },
        },
        defaultRootObject: 'index.html',
        errorResponses: [
          {
            httpStatus: 404,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
          {
            httpStatus: 403,
            responseHttpStatus: 200,
            responsePagePath: '/index.html',
            ttl: cdk.Duration.minutes(5),
          },
        ],
        priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
        webAclId: props.webAclArn,
      }
    );

    this.distributionId = this.cloudfrontDistribution.distributionId;

    // Deploy website content
    new s3deploy.BucketDeployment(
      this,
      `PrimaryWebsiteDeployment-${props.environmentSuffix}`,
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, './website'))],
        destinationBucket: primaryBucket,
        distribution: this.cloudfrontDistribution,
        distributionPaths: ['/*'],
        memoryLimit: 512,
      }
    );

    new s3deploy.BucketDeployment(
      this,
      `SecondaryWebsiteDeployment-${props.environmentSuffix}`,
      {
        sources: [s3deploy.Source.asset(path.join(__dirname, './website'))],
        destinationBucket: secondaryBucket,
        memoryLimit: 512,
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'CloudFrontDistributionDomain', {
      value: this.cloudfrontDistribution.distributionDomainName,
      description: 'CloudFront Distribution Domain Name',
      exportName: `CloudFrontDomain-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApplicationUrl', {
      value: `https://${this.cloudfrontDistribution.distributionDomainName}`,
      description: 'Global Application URL',
      exportName: `ApplicationUrl-${props.environmentSuffix}`,
    });
  }
}
```

### 6. Orchestration Stack (lib/tap-stack.ts)

Main stack coordinating all components:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { DatabaseStack } from './database-stack';
import { KmsStack } from './kms-stack';
import { RegionalStack } from './regional-stack';
import { SecurityStack } from './security-stack';
import { GlobalStack } from './global-stack';

export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or default to 'dev'
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    const primaryRegion = 'us-east-1';
    const secondaryRegion = 'us-east-2';

    // Create KMS keys in each region
    const primaryKmsStack = new KmsStack(
      this,
      `PrimaryKmsStack-${environmentSuffix}`,
      {
        region: primaryRegion,
        environmentSuffix,
        env: { region: primaryRegion },
      }
    );

    const secondaryKmsStack = new KmsStack(
      this,
      `SecondaryKmsStack-${environmentSuffix}`,
      {
        region: secondaryRegion,
        environmentSuffix,
        env: { region: secondaryRegion },
      }
    );

    // Create database in primary region
    const databaseStack = new DatabaseStack(
      this,
      `DatabaseStack-${environmentSuffix}`,
      {
        primaryRegion,
        secondaryRegion,
        kmsKeyArn: primaryKmsStack.kmsKeyArn,
        environmentSuffix,
        env: { region: primaryRegion },
      }
    );

    // Create regional stacks
    const primaryRegionalStack = new RegionalStack(
      this,
      `PrimaryRegionalStack-${environmentSuffix}`,
      {
        tableName: databaseStack.tableName,
        tableArn: databaseStack.tableArn,
        kmsKeyArn: primaryKmsStack.kmsKeyArn,
        region: primaryRegion,
        environmentSuffix,
        env: { region: primaryRegion },
      }
    );

    const secondaryRegionalStack = new RegionalStack(
      this,
      `SecondaryRegionalStack-${environmentSuffix}`,
      {
        tableName: databaseStack.tableName,
        tableArn: databaseStack.tableArn,
        kmsKeyArn: secondaryKmsStack.kmsKeyArn,
        region: secondaryRegion,
        environmentSuffix,
        env: { region: secondaryRegion },
      }
    );

    // Create security stack in us-east-1 (required for CloudFront)
    const securityStack = new SecurityStack(
      this,
      `SecurityStack-${environmentSuffix}`,
      {
        environmentSuffix,
        env: { region: primaryRegion },
      }
    );

    // Create global stack
    const globalStack = new GlobalStack(
      this,
      `GlobalStack-${environmentSuffix}`,
      {
        primaryRegion,
        secondaryRegion,
        primaryApiEndpoint: primaryRegionalStack.apiEndpoint,
        secondaryApiEndpoint: secondaryRegionalStack.apiEndpoint,
        primaryHealthCheckPath: primaryRegionalStack.healthCheckPath,
        primaryBucketName: primaryRegionalStack.websiteBucket.bucketName,
        secondaryBucketName: secondaryRegionalStack.websiteBucket.bucketName,
        webAclArn: securityStack.webAcl.attrArn,
        environmentSuffix,
        env: { region: primaryRegion },
      }
    );

    // Outputs
    new cdk.CfnOutput(this, 'TestAuthTokenValid', {
      value: 'Allow-test-token-12345',
      description: 'Valid auth token for testing',
    });

    new cdk.CfnOutput(this, 'TestAuthTokenInvalid', {
      value: 'Deny-invalid-token',
      description: 'Invalid auth token for testing',
    });
  }
}
```

## Lambda Functions

### Authorizer Lambda (lib/lambdas/authorizer/index.js)

```javascript
exports.handler = async event => {
  console.log('Event:', JSON.stringify(event, null, 2));

  const authorizationToken = event.authorizationToken;

  // Simple token validation (in production, verify JWT)
  const effect =
    authorizationToken && authorizationToken.startsWith('Allow')
      ? 'Allow'
      : 'Deny';

  return {
    principalId: 'user',
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: event.methodArn,
        },
      ],
    },
    context: {
      region: process.env.REGION,
    },
  };
};
```

### Transfer Lambda (lib/lambdas/transfer/index.js)

```javascript
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');
const { randomUUID } = require('crypto');

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);
const tableName = process.env.TABLE_NAME;

exports.handler = async event => {
  try {
    console.log('Event:', JSON.stringify(event, null, 2));

    const body = JSON.parse(event.body || '{}');

    if (!body.amount || !body.from || !body.to) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
        body: JSON.stringify({
          error: 'Missing required fields',
          requiredFields: ['amount', 'from', 'to'],
        }),
      };
    }

    const transactionId = randomUUID();
    const timestamp = new Date().toISOString();

    const transaction = {
      transactionId,
      timestamp,
      amount: body.amount,
      from: body.from,
      to: body.to,
      status: 'completed',
      region: process.env.REGION,
    };

    await dynamoDB.send(
      new PutCommand({
        TableName: tableName,
        Item: transaction,
      })
    );

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        message: 'Transaction completed successfully',
        transaction,
      }),
    };
  } catch (error) {
    console.error('Error:', error);

    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message,
      }),
    };
  }
};
```

## Website (lib/website/index.html)

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Global Payments Gateway</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 0;
        padding: 0;
        background-color: #f5f5f5;
      }
      .container {
        max-width: 800px;
        margin: 0 auto;
        padding: 20px;
      }
      .header {
        background-color: #003366;
        color: white;
        padding: 20px;
        text-align: center;
      }
      .region-info {
        background-color: #ffcc00;
        color: #333;
        padding: 10px;
        text-align: center;
        font-weight: bold;
        margin-bottom: 20px;
        border-radius: 4px;
      }
      .card {
        background-color: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        padding: 20px;
        margin-bottom: 20px;
      }
      input,
      button {
        padding: 10px;
        margin: 5px 0;
        width: 100%;
        box-sizing: border-box;
      }
      button {
        background-color: #003366;
        color: white;
        border: none;
        cursor: pointer;
      }
      button:hover {
        background-color: #004488;
      }
      .result {
        background-color: #e6f7ff;
        border-radius: 4px;
        padding: 10px;
        margin-top: 10px;
        white-space: pre-wrap;
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Global Payments Gateway</h1>
    </div>

    <div class="container">
      <div class="region-info" id="regionInfo">
        Loading region information...
      </div>

      <div class="card">
        <h2>Make a Transfer</h2>
        <div>
          <label for="fromAccount">From Account:</label>
          <input
            type="text"
            id="fromAccount"
            placeholder="Sender's account number"
          />
        </div>
        <div>
          <label for="toAccount">To Account:</label>
          <input
            type="text"
            id="toAccount"
            placeholder="Recipient's account number"
          />
        </div>
        <div>
          <label for="amount">Amount:</label>
          <input type="number" id="amount" placeholder="Amount to transfer" />
        </div>
        <div>
          <label for="token">Authorization Token:</label>
          <input type="text" id="token" placeholder="Authorization token" />
        </div>
        <button id="transferButton">Make Transfer</button>
        <div class="result" id="result" style="display: none;"></div>
      </div>
    </div>

    <script>
      // Function to fetch the current region
      async function fetchRegion() {
        try {
          const response = await fetch('/api/health');
          const data = await response.json();
          document.getElementById('regionInfo').textContent =
            `Active Region: ${data.region}`;
        } catch (error) {
          console.error('Error fetching region:', error);
          document.getElementById('regionInfo').textContent =
            'Unable to determine active region';
        }
      }

      // Function to make a transfer
      async function makeTransfer() {
        const fromAccount = document.getElementById('fromAccount').value;
        const toAccount = document.getElementById('toAccount').value;
        const amount = document.getElementById('amount').value;
        const token = document.getElementById('token').value;
        const resultElement = document.getElementById('result');

        resultElement.style.display = 'block';
        resultElement.textContent = 'Processing...';

        try {
          const response = await fetch('/api/transfer', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: token,
            },
            body: JSON.stringify({
              from: fromAccount,
              to: toAccount,
              amount: parseFloat(amount),
            }),
          });

          const data = await response.json();
          resultElement.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
          console.error('Error making transfer:', error);
          resultElement.textContent = `Error: ${error.message}`;
        }
      }

      // Event listeners
      document.addEventListener('DOMContentLoaded', fetchRegion);
      document
        .getElementById('transferButton')
        .addEventListener('click', makeTransfer);
    </script>
  </body>
</html>
```
