import * as cdk from 'aws-cdk-lib';
import * as kinesis from 'aws-cdk-lib/aws-kinesis';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface StreamingStackProps {
  environmentSuffix: string;
  kmsKey: kms.Key;
}

export class StreamingStack extends Construct {
  public readonly transactionStream: kinesis.Stream;

  constructor(scope: Construct, id: string, props: StreamingStackProps) {
    super(scope, id);

    // Create Kinesis Data Stream
    this.transactionStream = new kinesis.Stream(this, 'TransactionStream', {
      streamName: `payment-transactions-${props.environmentSuffix}`,
      shardCount: 3,
      retentionPeriod: cdk.Duration.hours(24),
      encryption: kinesis.StreamEncryption.KMS,
      encryptionKey: props.kmsKey,
      streamMode: kinesis.StreamMode.PROVISIONED,
    });

    // Tags for compliance
    cdk.Tags.of(this.transactionStream).add('PCICompliant', 'true');
    cdk.Tags.of(this.transactionStream).add('DataClassification', 'Sensitive');
    cdk.Tags.of(this.transactionStream).add(
      'Environment',
      props.environmentSuffix
    );
  }
}
