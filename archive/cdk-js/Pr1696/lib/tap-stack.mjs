import * as cdk from 'aws-cdk-lib';
// Import s3
import * as s3 from 'aws-cdk-lib/aws-s3';
// ? Import your stacks here
// const { MyStack } = require('./my-stack');

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
    // Example: Create an S3 bucket
    new s3.Bucket(this, `MyBucket-${environmentSuffix}`, {
      bucketName: `my-bucket-${environmentSuffix}`,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use DESTROY for dev environments
      autoDeleteObjects: true, // Automatically delete objects when the bucket is destroyed
    });

    // Output the bucket name
    new cdk.CfnOutput(this, 'MyBucketName', {
      value: `my-bucket-${environmentSuffix}`,
      exportName: `MyBucketName-${environmentSuffix}`,
    });
  }
}

export { TapStack };
