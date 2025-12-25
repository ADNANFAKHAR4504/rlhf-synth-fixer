import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';

// ? Import your stacks here
// import { MyStack } from './my-stack';
import { SecureApiGateway } from './constructs/api-gateway';
import { ApiLambda } from './constructs/api-lambda';
import { ApiLambdaRole } from './constructs/iam-role';
import { DataKmsKey } from './constructs/kms-key';
import { SecureBucket } from './constructs/s3-bucket';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  customDomainName?: string;
  certificateArn?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.

    // KMS
    const key = new DataKmsKey(this, 'DataKmsKey', {
      alias: `alias/data-kms-key-${this.region}`,
      removalPolicy:
        this.node.tryGetContext('removalPolicy') === 'destroy'
          ? cdk.RemovalPolicy.DESTROY
          : cdk.RemovalPolicy.RETAIN,
    }).key;

    // S3
    const bucket = new SecureBucket(this, 'DataBucket', { encryptionKey: key })
      .bucket;

    // IAM Role
    const role = new ApiLambdaRole(this, 'ApiLambdaRole', {
      bucketArnForObjects: bucket.arnForObjects('*'),
      kmsKeyArn: key.keyArn,
    }).role;

    // Lambda
    const lambda = new ApiLambda(this, 'ApiLambda', {
      role,
      bucketName: bucket.bucketName,
    }).func;

    // API Gateway
    new SecureApiGateway(this, 'SecureApi', {
      restApiName: `secure-api-${this.region}`,
      handler: lambda,
      customDomainName: props?.customDomainName,
      certificateArn: props?.certificateArn,
    });
  }
}
