import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  readonly isLocalStack?: boolean;
  readonly environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id, props);

    const { isLocalStack: propsIsLocalStack, environmentSuffix } = props;

    // Detect LocalStack environment
    const isLocalStack =
      propsIsLocalStack ??
      (process.env.CDK_LOCAL === 'true' ||
        process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
        process.env.LOCALSTACK_HOSTNAME !== undefined);

    // S3 Bucket for storing application data
    const bucket = new s3.Bucket(this, 'TapBucket', {
      bucketName: isLocalStack
        ? undefined
        : `tap-bucket-${cdk.Aws.ACCOUNT_ID}-${cdk.Aws.REGION}`,
      removalPolicy: isLocalStack
        ? cdk.RemovalPolicy.DESTROY
        : cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: isLocalStack,
      versioned: !isLocalStack,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    // Lambda function for processing
    const processingFunction = new lambda.Function(this, 'ProcessingFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Processing event:', JSON.stringify(event));
          return {
            statusCode: 200,
            body: JSON.stringify({
              message: 'Processing completed successfully',
              timestamp: new Date().toISOString(),
              environmentSuffix: '${environmentSuffix || 'dev'}'
            })
          };
        };
      `),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        IS_LOCALSTACK: isLocalStack.toString(),
        ENVIRONMENT_SUFFIX: environmentSuffix || 'dev',
      },
    });

    // Grant Lambda permissions to access S3 bucket
    bucket.grantReadWrite(processingFunction);

    // IAM role for additional permissions
    const tapRole = new iam.Role(this, 'TapRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Outputs
    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName,
      description: 'Name of the S3 bucket',
    });

    new cdk.CfnOutput(this, 'FunctionArn', {
      value: processingFunction.functionArn,
      description: 'ARN of the processing Lambda function',
    });

    new cdk.CfnOutput(this, 'RoleArn', {
      value: tapRole.roleArn,
      description: 'ARN of the TAP IAM role',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix || 'dev',
      description: 'Environment suffix used for this stack',
    });
  }
}
