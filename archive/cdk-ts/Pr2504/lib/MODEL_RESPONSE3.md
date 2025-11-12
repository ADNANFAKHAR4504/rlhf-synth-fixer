

## Updated lib/tapstack.ts

Here's the corrected version that removes the conflicting bucket policy:

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

// Custom props interface that extends StackProps
export interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props or default to 'dev'
    const environmentSuffix = props?.environmentSuffix || 'dev';
    
    // Get custom domain from context (optional)
    const customDomain = this.node.tryGetContext('customDomain');

    // 1. KMS Customer Managed Key for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3EncryptionKey', {
      description: `KMS key for S3 bucket encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
    });

    // KMS key alias for easier identification
    new kms.Alias(this, 'S3EncryptionKeyAlias', {
      aliasName: `alias/tap-s3-encryption-key-${environmentSuffix}`,
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
      description: `IAM role for TAP Lambda function with least privilege access - ${environmentSuffix}`,
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // 4. S3 Bucket with security configurations (FIXED: Removed conflicting bucket policy)
    const s3Bucket = new s3.Bucket(this, 'TapS3Bucket', {
      bucketName: `tap-secure-bucket-${environmentSuffix}-${this.account}-${this.region}`,
      versioned: true,
      encryptionKey: s3KmsKey,
      encryption: s3.BucketEncryption.KMS,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL, // Keep secure - blocks all public access
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Change to RETAIN for production
      autoDeleteObjects: true, // Only for development
    });

    // REMOVED: The problematic bucket policy that was causing the deployment failure
    // Instead, we'll use IAM role permissions which are more secure and don't conflict with BlockPublicAccess

    // Grant Lambda role permissions to S3 bucket using IAM (not bucket policy)
    s3Bucket.grantReadWrite(lambdaRole);
    s3KmsKey.grantEncryptDecrypt(lambdaRole);

    // Additional explicit IAM policy for Lambda role (optional, for fine-grained control)
    lambdaRole.addToPolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
        's3:ListBucket',
        's3:GetObjectVersion',
        's3:DeleteObjectVersion',
      ],
      resources: [
        s3Bucket.bucketArn,
        `${s3Bucket.bucketArn}/*`,
      ],
    }));

    // 5. SSM Parameters for Lambda environment variables
    const dbCredentialsParam = new ssm.StringParameter(this, 'DbCredentials', {
      parameterName: `/tap/${environmentSuffix}/lambda/db-credentials`,
      stringValue: JSON.stringify({
        username: 'tapuser',
        password: 'changeme123!', // In production, use SecureString and proper secrets
      }),
      description: `Database credentials for TAP Lambda function - ${environmentSuffix}`,
      tier: ssm.ParameterTier.STANDARD,
    });

    const apiKeyParam = new ssm.StringParameter(this, 'ApiKey', {
      parameterName: `/tap/${environmentSuffix}/lambda/api-key`,
      stringValue: 'your-api-key-here',
      description: `API key for external service integration - ${environmentSuffix}`,
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
        ENVIRONMENT_SUFFIX: environmentSuffix,
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
    logger.info(f"Environment: {os.environ.get('ENVIRONMENT_SUFFIX', 'unknown')}")
    
    try:
        # Get environment variables from SSM
        db_creds = ssm.get_parameter(Name=os.environ['DB_CREDENTIALS_PARAM'])
        api_key = ssm.get_parameter(Name=os.environ['API_KEY_PARAM'])
        
        # Process S3 event
        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(f"Processing object: {key} from bucket: {bucket}")
            
            # Example: Read the uploaded object
            try:
                response = s3.get_object(Bucket=bucket, Key=key)
                content = response['Body'].read()
                logger.info(f"Successfully read object {key}, size: {len(content)} bytes")
                
                # Example: Create a processed version
                processed_key = f"processed/{key}"
                s3.put_object(
                    Bucket=bucket,
                    Key=processed_key,
                    Body=f"Processed: {content.decode('utf-8') if len(content) < 1000 else 'Large file processed'}",
                    ContentType='text/plain'
                )
                logger.info(f"Created processed version: {processed_key}")
                
            except Exception as s3_error:
                logger.error(f"Error processing S3 object {key}: {str(s3_error)}")
            
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
      description: `TAP Lambda function triggered by S3 events - ${environmentSuffix}`,
    });

    // Lambda resource policy to restrict invocation to S3 service
    tapLambda.addPermission('S3InvokePermission', {
      principal: new iam.ServicePrincipal('s3.amazonaws.com'),
      sourceArn: s3Bucket.bucketArn,
      action: 'lambda:InvokeFunction',
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

    // 9. CloudFront Origin Access Control (OAC) for secure S3 access
    const originAccessControl = new cloudfront.S3OriginAccessControl(this, 'TapOAC', {
      description: `Origin Access Control for TAP S3 bucket - ${environmentSuffix}`,
    });

    // 10. SSL Certificate (if custom domain is provided)
    let certificate: acm.Certificate | undefined;
    if (customDomain) {
      certificate = new acm.Certificate(this, 'CloudFrontCertificate', {
        domainName: customDomain,
        validation: acm.CertificateValidation.fromDns(),
      });
    }

    // 11. CloudFront Distribution with OAC
    const distribution = new cloudfront.Distribution(this, 'TapCloudFrontDistribution', {
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(s3Bucket, {
          originAccessControl: originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: customDomain ? [customDomain] : undefined,
      certificate: certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      enableIpv6: true,
      comment: `TAP CloudFront distribution for secure content delivery - ${environmentSuffix}`,
    });

    // Grant CloudFront OAC access to S3 bucket (this is the correct way to allow CloudFront access)
    s3Bucket.addToResourcePolicy(new iam.PolicyStatement({
      sid: 'AllowCloudFrontServicePrincipal',
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
      actions: ['s3:GetObject'],
      resources: [`${s3Bucket.bucketArn}/*`],
      conditions: {
        StringEquals: {
          'AWS:SourceArn': `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
        },
      },
    }));

    // 12. Outputs for auditing and reference
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: s3Bucket.bucketArn,
      description: `ARN of the TAP S3 bucket - ${environmentSuffix}`,
      exportName: `TapS3BucketArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: `Name of the TAP S3 bucket - ${environmentSuffix}`,
      exportName: `TapS3BucketName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: tapLambda.functionArn,
      description: `ARN of the TAP Lambda function - ${environmentSuffix}`,
      exportName: `TapLambdaFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LambdaRoleArn', {
      value: lambdaRole.roleArn,
      description: `ARN of the TAP Lambda IAM role - ${environmentSuffix}`,
      exportName: `TapLambdaRoleArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: s3KmsKey.keyArn,
      description: `ARN of the KMS key used for S3 encryption - ${environmentSuffix}`,
      exportName: `TapKmsKeyArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionArn', {
      value: `arn:aws:cloudfront::${this.account}:distribution/${distribution.distributionId}`,
      description: `ARN of the TAP CloudFront distribution - ${environmentSuffix}`,
      exportName: `TapCloudFrontDistributionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: `Domain name of the TAP CloudFront distribution - ${environmentSuffix}`,
      exportName: `TapCloudFrontDomainName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: `ID of the TAP VPC - ${environmentSuffix}`,
      exportName: `TapVpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
      exportName: `TapEnvironmentSuffix-${environmentSuffix}`,
    });
  }
}
```

## Updated test/tap-stack.unit.test.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack, TapStackProps } from '../lib/tapstack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    
    // Use TapStackProps interface with environmentSuffix
    const stackProps: TapStackProps = {
      env: {
        account: '123456789012',
        region: 'us-east-1',
      },
      environmentSuffix: 'test',
    };

    stack = new TapStack(app, 'TestTapStack', stackProps);
    template = Template.fromStack(stack);
  });

  test('Creates S3 bucket with correct configuration and environment suffix', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'tap-secure-bucket-test-123456789012-us-east-1',
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

  test('Does not create problematic bucket policy that conflicts with BlockPublicAccess', () => {
    // Ensure no bucket policy is created that would conflict with BlockPublicAccess
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
    
    // If bucket policies exist, they should only be for CloudFront OAC access
    Object.values(bucketPolicies).forEach((policy: any) => {
      const policyDocument = policy.Properties.PolicyDocument;
      const statements = policyDocument.Statement;
      
      statements.forEach((statement: any) => {
        // Ensure no wildcard principals that could be considered public
        if (statement.Principal === '*') {
          throw new Error('Found wildcard principal in bucket policy - this conflicts with BlockPublicAccess');
        }
        
        // If CloudFront service principal exists, ensure it has proper conditions
        if (statement.Principal?.Service === 'cloudfront.amazonaws.com') {
          expect(statement.Condition).toBeDefined();
          expect(statement.Condition.StringEquals).toBeDefined();
          expect(statement.Condition.StringEquals['AWS:SourceArn']).toBeDefined();
        }
      });
    });
  });

  test('Creates KMS key with key rotation enabled and environment suffix in description', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
      Description: 'KMS key for S3 bucket encryption - test',
    });
  });

  test('Creates Lambda function with proper IAM permissions instead of bucket policy', () => {
    template.hasResourceProperties('AWS::Lambda::Function', {
      Runtime: 'python3.9',
      Handler: 'index.handler',
      Description: 'TAP Lambda function triggered by S3 events - test',
      VpcConfig: {
        SubnetIds: Match.anyValue(),
        SecurityGroupIds: Match.anyValue(),
      },
    });

    // Check that Lambda role has proper S3 permissions via IAM policy, not bucket policy
    template.hasResourceProperties('AWS::IAM::Policy', {
      PolicyDocument: {
        Statement: Match.arrayWith([
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
              's3:GetObjectVersion',
              's3:DeleteObjectVersion',
            ],
            Resource: Match.anyValue(),
          },
        ]),
      },
    });
  });

  test('Creates CloudFront distribution with Origin Access Control', () => {
    template.hasResourceProperties('AWS::CloudFront::Distribution', {
      DistributionConfig: {
        Comment: 'TAP CloudFront distribution for secure content delivery - test',
        DefaultCacheBehavior: {
          ViewerProtocolPolicy: 'redirect-to-https',
          AllowedMethods: ['GET', 'HEAD'],
          CachedMethods: ['GET', 'HEAD'],
        },
        Enabled: true,
        IPV6Enabled: true,
      },
    });

    // Check for Origin Access Control
    template.hasResourceProperties('AWS::CloudFront::OriginAccessControl', {
      OriginAccessControlConfig: {
        Description: 'Origin Access Control for TAP S3 bucket - test',
      },
    });
  });

  test('Lambda has permission to be invoked by S3', () => {
    template.hasResourceProperties('AWS::Lambda::Permission', {
      Action: 'lambda:InvokeFunction',
      Principal: 's3.amazonaws.com',
    });
  });

  test('S3 bucket notification is configured correctly', () => {
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

  test('IAM role has necessary permissions for Lambda execution', () => {
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

  test('All outputs are present with correct environment suffix', () => {
    const outputs = template.findOutputs('*');
    
    expect(outputs).toHaveProperty('S3BucketArn');
    expect(outputs).toHaveProperty('LambdaFunctionArn');
    expect(outputs).toHaveProperty('LambdaRoleArn');
    expect(outputs).toHaveProperty('KmsKeyArn');
    expect(outputs).toHaveProperty('CloudFrontDistributionArn');
    expect(outputs).toHaveProperty('VpcId');
    expect(outputs).toHaveProperty('EnvironmentSuffix');

    // Check export names include environment suffix
    expect(outputs['S3BucketArn'].Export?.Name).toBe('TapS3BucketArn-test');
    expect(outputs['EnvironmentSuffix'].Export?.Name).toBe('TapEnvironmentSuffix-test');
  });
});
```

## Key Changes Made:

### 🔧 **Fixed the S3 Bucket Policy Issue:**

1. **Removed the problematic bucket policy** that was trying to grant access to the Lambda role via bucket policy
2. **Used IAM role permissions instead** - this is more secure and doesn't conflict with `BlockPublicAccess`
3. **Kept `BlockPublicAccess.BLOCK_ALL`** for maximum security

### 🔒 **Improved Security:**

1. **IAM-based permissions** instead of bucket policies for Lambda access
2. **Origin Access Control (OAC)** for CloudFront instead of legacy OAI
3. **Proper service principal conditions** for CloudFront access

### ✅ **Enhanced Lambda Function:**

1. **Added actual S3 processing logic** in the Lambda code
2. **Better error handling** for S3 operations
3. **More realistic example** of reading and processing S3 objects

### 🧪 **Updated Tests:**

1. **Added test to verify no problematic bucket policies** are created
2. **Verified IAM permissions** are properly configured
3. **Checked Origin Access Control** is created correctly

## Deployment Instructions:

```bash
# Clean build
npm run build

# Run tests to ensure everything is working
npm test

# Synthesize to check CloudFormation template
npm run synth

# Deploy the stack
npm run deploy
```

This fix ensures that:
- ✅ S3 bucket remains private and secure with `BlockPublicAccess.BLOCK_ALL`
- ✅ Lambda function gets S3 access through IAM role permissions (not bucket policy)
- ✅ CloudFront gets S3 access through Origin Access Control with proper conditions
- ✅ No conflicts with AWS account-level Block Public Access policies
- ✅ Follows AWS security best practices

The deployment should now succeed without the `s3:PutBucketPolicy` error! 🎉