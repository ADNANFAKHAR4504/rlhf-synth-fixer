import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface KmsStackProps {
  environmentSuffix: string;
}

export class KmsStack extends Construct {
  public readonly rdsKey: kms.Key;
  public readonly elasticacheKey: kms.Key;
  public readonly efsKey: kms.Key;
  public readonly secretsKey: kms.Key;
  public readonly kinesisKey: kms.Key;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id);

    // KMS key for RDS encryption
    this.rdsKey = new kms.Key(this, 'RdsKey', {
      enableKeyRotation: true,
      description: 'KMS key for RDS encryption',
      alias: `payment-rds-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for ElastiCache encryption
    this.elasticacheKey = new kms.Key(this, 'ElastiCacheKey', {
      enableKeyRotation: true,
      description: 'KMS key for ElastiCache encryption',
      alias: `payment-elasticache-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for EFS encryption
    this.efsKey = new kms.Key(this, 'EfsKey', {
      enableKeyRotation: true,
      description: 'KMS key for EFS encryption',
      alias: `payment-efs-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for Secrets Manager encryption
    this.secretsKey = new kms.Key(this, 'SecretsKey', {
      enableKeyRotation: true,
      description: 'KMS key for Secrets Manager encryption',
      alias: `payment-secrets-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // KMS key for Kinesis encryption
    this.kinesisKey = new kms.Key(this, 'KinesisKey', {
      enableKeyRotation: true,
      description: 'KMS key for Kinesis encryption',
      alias: `payment-kinesis-${props.environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }
}
