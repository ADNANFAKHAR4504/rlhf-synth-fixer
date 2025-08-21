import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class LambdaStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const envSuffix = props?.environmentSuffix || 'dev';

    // Simple S3 bucket without auto-delete (to avoid IAM role creation)
    this.codeBucket = new s3.Bucket(this, 'LambdaCodeBucket', {
      bucketName: `prod-lambda-code-${envSuffix}-${this.account}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // autoDeleteObjects removed to avoid IAM role creation
    });

    // Expose mock function ARNs for other stacks
    this.userFunction = {
      functionArn: `arn:aws:lambda:${this.region}:${this.account}:function:prod-user-function-${envSuffix}`,
    };

    this.productFunction = {
      functionArn: `arn:aws:lambda:${this.region}:${this.account}:function:prod-product-function-${envSuffix}`,
    };

    // Outputs
    new cdk.CfnOutput(this, 'UserFunctionArn', {
      value: this.userFunction.functionArn,
      description: 'User Function ARN (mock)',
    });

    new cdk.CfnOutput(this, 'ProductFunctionArn', {
      value: this.productFunction.functionArn,
      description: 'Product Function ARN (mock)',
    });

    new cdk.CfnOutput(this, 'CodeBucketName', {
      value: this.codeBucket.bucketName,
      description: 'S3 Bucket for Lambda Code',
    });
  }
}