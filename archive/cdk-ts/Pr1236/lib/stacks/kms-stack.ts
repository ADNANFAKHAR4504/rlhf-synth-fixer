import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class KmsStack extends cdk.Stack {
  /** KMS key for data-at-rest (S3, EBS, RDS, PI). */
  public readonly dataKey: kms.Key;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.dataKey = new kms.Key(this, 'DataKmsKey', {
      alias: 'alias/secure-data',
      enableKeyRotation: true,
      description: 'KMS key for encrypting application data at rest.',
    });
  }
}
