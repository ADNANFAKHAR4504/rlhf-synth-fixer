import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';

export interface KmsStackProps extends cdk.StackProps {
  region: string;
  environmentSuffix: string;
}

export class KmsStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id, props);

    // Create customer managed KMS key for DynamoDB encryption
    // Using a predictable alias pattern to avoid cross-region references
    this.kmsKey = new kms.Key(
      this,
      `PaymentsTableKey-${props.environmentSuffix}`,
      {
        enableKeyRotation: true,
        description: `KMS key for encrypting the payments DynamoDB table in ${props.region}`,
        alias: `alias/payments-table-key-${props.region}-${props.environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Output values for integration testing
    new cdk.CfnOutput(this, 'KmsKeyArn', {
      value: this.kmsKey.keyArn,
      description: 'KMS Key ARN for DynamoDB encryption',
      exportName: `PaymentsKmsKeyArn-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID for DynamoDB encryption',
      exportName: `PaymentsKmsKeyId-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsKeyAlias', {
      value: `alias/payments-table-key-${props.region}-${props.environmentSuffix}`,
      description: 'KMS Key alias used for predictable ARN construction',
      exportName: `PaymentsKmsKeyAlias-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KeyRotationEnabled', {
      value: 'true',
      description: 'KMS Key rotation status',
      exportName: `KmsKeyRotation-${props.region}-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'KmsRegion', {
      value: props.region,
      description: 'Region where KMS key is deployed',
      exportName: `KmsRegion-${props.region}-${props.environmentSuffix}`,
    });
  }
}
