import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

interface KmsStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class KmsStack extends cdk.Stack {
  public readonly key: kms.Key;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id, props);

    this.key = new kms.Key(this, `Key-${props.environmentSuffix}`, {
      alias: `alias/dr-${props.environmentSuffix}-${this.region}`,
      description: `DR encryption key for ${props.environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Export KMS key ARN via SSM for cross-region reference
    new ssm.StringParameter(
      this,
      `KmsArnParameter-${props.environmentSuffix}`,
      {
        parameterName: `/dr/${props.environmentSuffix}/kms-key-arn/${this.region}`,
        stringValue: this.key.keyArn,
        description: `KMS Key ARN for DR in ${this.region}`,
      }
    );

    cdk.Tags.of(this.key).add('Environment', props.environmentSuffix);
  }
}
