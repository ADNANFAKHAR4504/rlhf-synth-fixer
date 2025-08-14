import { aws_kms as kms, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DataKmsKeyProps {
  alias: string;
  description?: string;
  removalPolicy?: RemovalPolicy;
}

export class DataKmsKey extends Construct {
  public readonly key: kms.Key;
  constructor(scope: Construct, id: string, props: DataKmsKeyProps) {
    super(scope, id);
    if (!props.alias) {
      throw new Error('alias is required for DataKmsKey');
    }
    this.key = new kms.Key(this, 'Key', {
      alias: props.alias,
      description: props.description ?? 'CMK for data-at-rest encryption',
      enableKeyRotation: true,
      removalPolicy: props.removalPolicy ?? RemovalPolicy.RETAIN,
    });
  }
}
