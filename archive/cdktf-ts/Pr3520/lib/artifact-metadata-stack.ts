import { Construct } from 'constructs';
import { DynamodbTable } from '@cdktf/provider-aws/lib/dynamodb-table';

interface ArtifactMetadataStackProps {
  environmentSuffix: string;
}

export class ArtifactMetadataStack extends Construct {
  public readonly metadataTable: DynamodbTable;

  constructor(scope: Construct, id: string, props: ArtifactMetadataStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    this.metadataTable = new DynamodbTable(this, 'artifact-metadata-table', {
      name: `artifact-metadata-${environmentSuffix}`,
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'artifact_id',
      rangeKey: 'build_number',
      pointInTimeRecovery: {
        enabled: true,
      },
      attribute: [
        {
          name: 'artifact_id',
          type: 'S',
        },
        {
          name: 'build_number',
          type: 'N',
        },
        {
          name: 'timestamp',
          type: 'N',
        },
      ],
      globalSecondaryIndex: [
        {
          name: 'timestamp-index',
          hashKey: 'timestamp',
          projectionType: 'ALL',
        },
      ],
      tags: {
        Name: `artifact-metadata-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Artifact Metadata Storage',
      },
    });
  }
}
