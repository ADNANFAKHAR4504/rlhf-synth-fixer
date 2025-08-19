import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';

export class KmsStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Customer-managed KMS Key for encryption
    this.kmsKey = new kms.Key(this, `WebAppKMSKey${environmentSuffix}`, {
      description: `KMS Key for encrypting web application data at rest - ${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes - use RETAIN in production
      alias: `webapp-encryption-key-${environmentSuffix}`,
    });

    // Apply environment suffix tag
    cdk.Tags.of(this.kmsKey).add('Environment', environmentSuffix);
    cdk.Tags.of(this.kmsKey).add('Purpose', 'WebAppEncryption');

    // Output for other stacks to reference
    new cdk.CfnOutput(this, `KmsKeyId${environmentSuffix}`, {
      value: this.kmsKey.keyId,
      exportName: `WebAppKmsKeyId${environmentSuffix}`,
      description: 'KMS Key ID for web application encryption',
    });

    new cdk.CfnOutput(this, `KmsKeyArn${environmentSuffix}`, {
      value: this.kmsKey.keyArn,
      exportName: `WebAppKmsKeyArn${environmentSuffix}`,
      description: 'KMS Key ARN for web application encryption',
    });
  }
}