import { aws_kms as kms, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface DataKmsKeyProps {
  alias?: string;
  description?: string;
  removalPolicy?: RemovalPolicy;
}

export class DataKmsKey extends Construct {
  public readonly key: kms.Key;
  public readonly description: string;
  public readonly alias?: string;
  public readonly removalPolicy: RemovalPolicy;
  public readonly enableKeyRotation: boolean = true;

  constructor(scope: Construct, id: string, props: DataKmsKeyProps = {}) {
    super(scope, id);

    this.description =
      props.description ?? 'CMK for encrypting S3 objects and data keys';
    this.alias = props.alias;
    this.removalPolicy = props.removalPolicy ?? RemovalPolicy.RETAIN;

    this.key = new kms.Key(this, 'Key', {
      enableKeyRotation: this.enableKeyRotation,
      alias: this.alias,
      description: this.description,
      removalPolicy: this.removalPolicy,
    });
  }
}
