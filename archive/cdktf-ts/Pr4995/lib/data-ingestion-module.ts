import { Construct } from 'constructs';
import { KinesisStream } from '@cdktf/provider-aws/lib/kinesis-stream';
import { TerraformOutput } from 'cdktf';

interface DataIngestionModuleProps {
  environmentSuffix: string;
  kmsKeyId: string;
}

export class DataIngestionModule extends Construct {
  public readonly kinesisStreamArn: string;
  public readonly kinesisStreamName: string;

  constructor(scope: Construct, id: string, props: DataIngestionModuleProps) {
    super(scope, id);

    const { environmentSuffix, kmsKeyId } = props;

    // Create Kinesis Data Stream with on-demand mode
    const kinesisStream = new KinesisStream(this, 'kinesis-stream', {
      name: `manufacturing-sensor-data-${environmentSuffix}`,
      streamModeDetails: {
        streamMode: 'ON_DEMAND',
      },
      retentionPeriod: 168, // 7 days retention
      encryptionType: 'KMS',
      kmsKeyId: kmsKeyId,
      tags: {
        Name: `manufacturing-kinesis-${environmentSuffix}`,
      },
    });

    this.kinesisStreamArn = kinesisStream.arn;
    this.kinesisStreamName = kinesisStream.name;

    new TerraformOutput(this, 'kinesis-stream-name', {
      value: kinesisStream.name,
      description: 'Name of the Kinesis Data Stream',
    });

    new TerraformOutput(this, 'kinesis-stream-arn', {
      value: kinesisStream.arn,
      description: 'ARN of the Kinesis Data Stream',
    });
  }
}
