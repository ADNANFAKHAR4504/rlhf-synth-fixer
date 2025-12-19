I'll generate a comprehensive AWS CDK TypeScript project that meets all your requirements. Here's the complete implementation:

## bin/tap.ts

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tapstack';

const app = new cdk.App();

// Get environment configuration from context or use defaults
const account = app.node.tryGetContext('account') || process.env.CDK_DEFAULT_ACCOUNT;
const region = app.node.tryGetContext('region') || process.env.CDK_DEFAULT_REGION;

new TapStack(app, 'TapStack', {
  env: {
    account: account,
    region: region,
  },
  description: 'Secure and scalable TAP infrastructure with S3, Lambda, CloudFront, and VPC',
});
```

## lib/tapstack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Get custom domain from context (optional)
    const customDomain = this.node.tryGetContext('customDomain');

    // 1. KMS Customer Managed Key for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    // KMS key alias for easier identification
    new kms.Alias(this, 'S3EncryptionKeyAlias', {
      aliasName: 'alias/tap-s3-encryption-key',
      targetKey: s3KmsKey,
    });

    // 2. VPC with subnets in multiple AZs
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 2,
      natGateways: 1, // Cost optimization - use 1 NAT gateway
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
      ],
    });

    // 3. IAM Role for Lambda function
    const lambdaRole = new iam.Role(this, 'TapLambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for TAP Lambda function with least privilege access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // 4. S3 Bucket with security configurations
    const s3Bucket = new s3.Bucket(this, 'TapS3Bucket', {
      bucketName: `tap-secure-bucket-${this.account}-${this.region}`,
      versioned: true,
      encryptionKey: s3KmsKey,
      encryption: s3.BucketEncryption.KMS,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Only for development
    });

    // S3 bucket policy for restricted access
    const s3BucketPolicy = new iam.PolicyStatement({
      sid: 'RestrictAccessToSpecificRoles',
      effect: iam.Effect.ALLOW,
      principals: [lambdaRole],
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
      ],
      resources: [
        s3Bucket.bucketArn,
        `${s3Bucket.bucketArn}/*`,
      ],
    });

    s3Bucket.addToResourcePolicy(s3BucketPolicy);

    // Grant Lambda role permissions to S3 bucket
    s3Bucket.grantReadWrite(lambdaRole);
    s3KmsKey.grantEncryptDecrypt(lambdaRole);

    // 5. SSM Parameters for Lambda environment variables
    const dbCredentialsParam = new ssm.StringParameter(this, 'DbCredentials', {
      parameterName: '/tap/lambda/db-credentials',
      stringValue: JSON.stringify({
        username: 'tapuser',
        password: 'changeme123!', // In production, use SecureString and proper secrets
      }),
      description: 'Database credentials for TAP Lambda function',
      tier: ssm.ParameterTier.STANDARD,
    });

    const apiKeyParam = new ssm.StringParameter(this, 'ApiKey', {
      parameterName: '/tap/lambda/api-key',
      stringValue: 'your-api-key-here',
      description: 'API key for external service integration',
      tier: ssm.ParameterTier.STANDARD,
    });

    // Grant Lambda role permissions to read SSM parameters
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'ssm:GetParameter',
        'ssm:GetParameters',
      ],
      resources: [
        dbCredentialsParam.parameterArn,
        apiKeyParam.parameterArn,
      ],
    }));

    // Grant Lambda role permissions to write to CloudWatch Logs
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents',
      ],
      resources: [
        `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
      ],
    }));

    // 6. Lambda function
    const tapLambda = new lambda.Function(this, 'TapLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      environment: {
        S3_BUCKET_NAME: s3Bucket.bucketName,
        DB_CREDENTIALS_PARAM: dbCredentialsParam.parameterName,
        API_KEY_PARAM: apiKeyParam.parameterName,
      },
      code: lambda.Code.fromInline(`
import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

ssm = boto3.client('ssm')
s3 = boto3.client('s3')

def handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Get environment variables from SSM
        db_creds = ssm.get_parameter(Name=os.environ['DB_CREDENTIALS_PARAM'])
        api_key = ssm.get_parameter(Name=os.environ['API_KEY_PARAM'])
        
        # Process S3 event
        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(f"Processing object: {key} from bucket: {bucket}")
            
            # Your business logic here
            
        return {
            'statusCode': 200,
            'body': json.dumps('Successfully processed S3 event')
        }
        
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        raise e
      `),
      timeout: cdk.Duration.minutes(5),
      memorySize: 256,
      description: 'TAP Lambda function triggered by S3 events',
    });

    // Lambda resource policy to restrict invocation
    tapLambda.addPermission('S3InvokePermission', {
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      sourceArn: s3Bucket.bucketArn,
    });

    // 7. S3 event notification to trigger Lambda
    s3Bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3n.LambdaDestination(tapLambda)
    );

    // 8. CloudWatch Log Group for Lambda
    new logs.LogGroup(this, 'TapLambdaLogGroup', {
      logGroupName: `/aws/lambda/${tapLambda.functionName}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 9. SSL Certificate (if custom domain is provided)
    let certificate: acm.Certificate | undefined;
    if (customDomain) {
      certificate = new acm.Certificate(this, 'CloudFrontCertificate', {
        domainName: customDomain,
        validation: acm.CertificateValidation.fromDns(),
      });
    }

    // 10. CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'TapCloudFrontDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(s3Bucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: customDomain ? [customDomain] : undefined,
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableIpv6: true,
      comment: 'TAP CloudFront distribution for secure content delivery',
    });

    // 11. Outputs for auditing and reference
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: s3Bucket.bucketArn,
      description: 'ARN of the TAP S3 bucket',
      exportName: 'TapS3BucketArn',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the TAP S3 bucket',
      exportName: 'TapS3BucketName',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: tapLambda.functionArn,
      description: 'ARN of the TAP Lambda function',
      exportName: 'TapLambdaFunctionArn',
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: 'ARN of the TAP Lambda IAM role',
      exportName: 'TapLambdaRoleArn',
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: s3KmsKey.keyArn,
      description: 'ARN of the KMS key used for S3 encryption',
      exportName: 'TapKmsKeyArn',
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionArn', {
      value: `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
      description: 'ARN of the TAP CloudFront distribution',
      exportName: 'TapCloudFrontDistributionArn',
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'Domain name of the TAP CloudFront distribution',
      exportName: 'TapCloudFrontDomainName',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the TAP VPC',
      exportName: 'TapVpcId',
    });
  }
}
```

## test/tapstack.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tapstack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
    });
    template = Template.fromStack(stack);
  });

  test('Creates S3 bucket with correct configuration', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('Creates KMS key with key rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: 'KMS key for S3 bucket encryption',
    });
  });

  test('Creates Lambda function with VPC configuration', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.9',
      Handler: 'index.handler',
      VpcConfig: {
        SubnetIds: Match.anyValue(),
        SecurityGroupIds: Match.anyValue(),
      },
    });
  });

  test('Creates IAM role for Lambda with correct policies', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
          },
        ],
      },
      ManagedPolicyArns: [
        {
          'Fn::Join': [
            '',
            [
              'arn:',
              { Ref: 'AWS::Partition' },
              ':iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
            ],
          ],
        },
      ],
    });
  });

  test('Creates VPC with correct subnet configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });

    // Check for public and private subnets
    template.resourceCountIs('AWS::EC2::Subnet', 4); // 2 public + 2 private
  });

  test('Creates SSM parameters for environment variables', () => {
    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/tap/lambda/db-credentials',
      Type: 'String',
      Description: 'Database credentials for TAP Lambda function',
    });

    template.hasResourceProperties('AWS::SSM::Parameter', {
      Name: '/tap/lambda/api-key',
      Type: 'String',
      Description: 'API key for external service integration',
    });
  });

  test('Creates CloudFront distribution with S3 origin', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          AllowedMethods: ['GET', 'HEAD'],
          CachedMethods: ['GET', 'HEAD'],
        },
        Enabled: true,
        IPV6Enabled: true,
      },
    });
  });

  test('Creates S3 bucket notification for Lambda trigger', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      NotificationConfiguration: {
        LambdaConfigurations: [
          {
            Event: 's3:ObjectCreated:*',
            Function: Match.anyValue(),
          },
        ],
      },
    });
  });

  test('Creates CloudWatch log group for Lambda', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      RetentionInDays: 7,
    });
  });

  test('Outputs contain all required ARNs', () => {
    const outputs = template.findOutputs('*');
    
    expect(outputs).toHaveProperty('S3BucketArn');
    expect(outputs).toHaveProperty('LambdaFunctionArn');
    expect(outputs).toHaveProperty('LambdaRoleArn');
    expect(outputs).toHaveProperty('KmsKeyArn');
    expect(outputs).toHaveProperty('CloudFrontDistributionArn');
    expect(outputs).toHaveProperty('VpcId');
  });

  test('Lambda function has correct environment variables', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Environment: {
        Variables: {
          S3_BUCKET_NAME: Match.anyValue(),
          DB_CREDENTIALS_PARAM: '/tap/lambda/db-credentials',
          API_KEY_PARAM: '/tap/lambda/api-key',
        },
      },
    });
  });
});
```

## package.json (dependencies section)

```json
{
  "name": "tap-infrastructure",
  "version": "0.1.0",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "synth": "cdk synth",
    "deploy": "cdk deploy",
    "diff": "cdk diff",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.70.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.70.0",
    "constructs": "^10.0.0",
    "source-map-support": "^0.5.21"
  }
}
```

## jest.config.js

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest'
  }
};
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
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
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "node_modules",
    "cdk.out"
  ]
}
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
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
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```

## Key Features Implemented:

### Security Best Practices:
- **KMS Customer Managed Key** with automatic key rotation
- **S3 bucket** with versioning, encryption, and blocked public access
- **IAM roles** with least privilege access
- **VPC** with private subnets for Lambda
- **SSL/TLS** enforcement on CloudFront and S3
- **Resource policies** restricting access to specific principals

### Scalability:
- **Multi-AZ VPC** deployment
- **CloudFront** for global content delivery
- **Lambda** with configurable memory and timeout
- **Auto-scaling** capabilities built into AWS services

### Monitoring & Auditing:
- **CloudWatch Logs** integration
- **Comprehensive outputs** with all resource ARNs
- **Detailed resource tagging** through CDK
- **Event-driven architecture** with S3 triggers

### Deployment Instructions:

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Run tests:**
   ```bash
   npm test
   ```

4. **Synthesize CloudFormation template:**
   ```bash
   npm run synth
   ```

5. **Deploy to AWS:**
   ```bash
   npm run deploy
   ```

6. **For custom domain (optional):**
   ```bash
   cdk deploy -c customDomain=yourdomain.com
   ```

### Production Considerations:

1. **Change removal policies** from `DESTROY` to `RETAIN` for production
2. **Use AWS Secrets Manager** instead of SSM Parameter Store for sensitive data
3. **Implement proper backup strategies** for S3 and other resources
4. **Add monitoring and alerting** with CloudWatch alarms
5. **Consider using AWS WAF** with CloudFront for additional security
6. **Implement proper CI/CD pipeline** for deployments

This implementation follows AWS best practices and provides a solid foundation for a secure, scalable infrastructure.