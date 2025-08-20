import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';

export class SecurityKmsStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    // Get region from AWS_REGION environment variable set by CICD or use us-west-2 as default
    const region = process.env.AWS_REGION || 'us-west-2';
    const stackSuffix = `${environmentSuffix}-${region}`;

    // Customer-managed KMS key for data encryption
    this.encryptionKey = new kms.Key(this, `SecurityEncryptionKey${environmentSuffix}`, {
      description: 'Customer-managed key for data encryption across all security resources',
      enableKeyRotation: true,
      keyUsage: kms.KeyUsage.ENCRYPT_DECRYPT,
      keySpec: kms.KeySpec.SYMMETRIC_DEFAULT,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow use of the key for encryption/decryption',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('s3.amazonaws.com'),
              new iam.ServicePrincipal('ec2.amazonaws.com'),
              new iam.ServicePrincipal('config.amazonaws.com'),
              new iam.ServicePrincipal('cloudtrail.amazonaws.com'),
              new iam.ServicePrincipal('logs.amazonaws.com'),
            ],
            actions: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:ViaService': [
                  `s3.us-west-2.amazonaws.com`,
                  `ec2.us-west-2.amazonaws.com`,
                  `config.us-west-2.amazonaws.com`,
                  `cloudtrail.us-west-2.amazonaws.com`,
                  `logs.us-west-2.amazonaws.com`,
                ],
              },
            },
          }),
        ],
      }),
    });

    // KMS key alias for easier reference
    this.encryptionKeyAlias = new kms.Alias(this, `SecurityEncryptionKeyAlias${environmentSuffix}`, {
      aliasName: `alias/security-encryption-key-${environmentSuffix}`,
      targetKey: this.encryptionKey,
    });

    // Asymmetric key for digital signing
    this.signingKey = new kms.Key(this, `SecuritySigningKey${environmentSuffix}`, {
      description: 'Asymmetric key for digital signing and verification',
      keyUsage: kms.KeyUsage.SIGN_VERIFY,
      keySpec: kms.KeySpec.RSA_2048,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          new iam.PolicyStatement({
            sid: 'Allow signing operations',
            effect: iam.Effect.ALLOW,
            principals: [
              new iam.ServicePrincipal('lambda.amazonaws.com'),
              new iam.ServicePrincipal('apigateway.amazonaws.com'),
            ],
            actions: [
              'kms:Sign',
              'kms:Verify',
              'kms:GetPublicKey',
              'kms:DescribeKey',
            ],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Signing key alias
    this.signingKeyAlias = new kms.Alias(this, `SecuritySigningKeyAlias${environmentSuffix}`, {
      aliasName: `alias/security-signing-key-${environmentSuffix}`,
      targetKey: this.signingKey,
    });

    // Apply mandatory tags
    cdk.Tags.of(this).add('Owner', 'SecurityTeam');
    cdk.Tags.of(this).add('Purpose', 'DataEncryptionAndSigning');
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('CostCenter', 'Security');
    cdk.Tags.of(this).add('Compliance', 'Required');

    // Outputs
    new cdk.CfnOutput(this, `EncryptionKeyId${stackSuffix}`, {
      value: this.encryptionKey.keyId,
      description: 'KMS Encryption Key ID',
      exportName: `SecurityStack-EncryptionKeyId-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `EncryptionKeyArn${stackSuffix}`, {
      value: this.encryptionKey.keyArn,
      description: 'KMS Encryption Key ARN',
      exportName: `SecurityStack-EncryptionKeyArn-${stackSuffix}`,
    });

    new cdk.CfnOutput(this, `SigningKeyId${stackSuffix}`, {
      value: this.signingKey.keyId,
      description: 'KMS Signing Key ID',
      exportName: `SecurityStack-SigningKeyId-${stackSuffix}`,
    });
  }
}