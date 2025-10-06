import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ArtifactStorageStack } from './artifact-storage-stack';
import { ArtifactMetadataStack } from './artifact-metadata-stack';
import { ArtifactCleanupStack } from './artifact-cleanup-stack';
import { PackageManagementStack } from './package-management-stack';
import { MonitoringStack } from './monitoring-stack';
import { AccessControlStack } from './access-control-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = 'us-west-2';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE;
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    const accessControlStack = new AccessControlStack(this, 'access-control', {
      environmentSuffix,
    });

    const artifactStorageStack = new ArtifactStorageStack(
      this,
      'artifact-storage',
      {
        environmentSuffix,
        buildSystemRole: accessControlStack.buildSystemRole,
      }
    );

    const artifactMetadataStack = new ArtifactMetadataStack(
      this,
      'artifact-metadata',
      {
        environmentSuffix,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const packageManagementStack = new PackageManagementStack(
      this,
      'package-management',
      {
        environmentSuffix,
        buildSystemRole: accessControlStack.buildSystemRole,
      }
    );

    const artifactCleanupStack = new ArtifactCleanupStack(
      this,
      'artifact-cleanup',
      {
        environmentSuffix,
        artifactBucket: artifactStorageStack.artifactBucket,
        artifactBucketExpressOneZone:
          artifactStorageStack.artifactBucketExpressOneZone,
        metadataTable: artifactMetadataStack.metadataTable,
      }
    );

    new MonitoringStack(this, 'monitoring', {
      environmentSuffix,
      artifactBucket: artifactStorageStack.artifactBucket,
      cleanupFunction: artifactCleanupStack.cleanupFunction,
      metadataTable: artifactMetadataStack.metadataTable,
    });
  }
}
