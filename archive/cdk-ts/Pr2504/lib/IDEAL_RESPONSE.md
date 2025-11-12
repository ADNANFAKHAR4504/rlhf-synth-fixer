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
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
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
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
          's3:GetObjectVersion',
          's3:DeleteObjectVersion',
        ],
        resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
      })
    );

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
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['ssm:GetParameter', 'ssm:GetParameters'],
        resources: [dbCredentialsParam.parameterArn, apiKeyParam.parameterArn],
      })
    );

    // Grant Lambda role permissions to write to CloudWatch Logs
    lambdaRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/lambda/*`,
        ],
      })
    );

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

    // 9. CloudFront Origin Access Control (OAC) for secure S3 access
    const originAccessControl = new cloudfront.S3OriginAccessControl(
      this,
      'TapOAC',
      {
        description: `Origin Access Control for TAP S3 bucket - ${environmentSuffix}`,
      }
    );

    // 10. SSL Certificate (if custom domain is provided)
    let certificate: acm.Certificate | undefined;
    if (customDomain) {
      certificate = new acm.Certificate(this, 'CloudFrontCertificate', {
        domainName: customDomain,
        validation: acm.CertificateValidation.fromDns(),
      });
    }

    // 11. CloudFront Distribution with OAC
    const distribution = new cloudfront.Distribution(
      this,
      'TapCloudFrontDistribution',
      {
        defaultBehavior: {
          origin: origins.S3BucketOrigin.withOriginAccessControl(s3Bucket, {
            originAccessControl: originAccessControl,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
          cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        domainNames: customDomain ? [customDomain] : undefined,
        certificate: certificate,
        minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        enableIpv6: true,
        comment: `TAP CloudFront distribution for secure content delivery - ${environmentSuffix}`,
      }
    );

    // Grant CloudFront OAC access to S3 bucket (this is the correct way to allow CloudFront access)
    s3Bucket.addToResourcePolicy(
      new iam.PolicyStatement({
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
      })
    );

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