import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

export interface StorageStackProps {
  bucketSuffixOverride?: string;
}

export class StorageStack extends Construct {
  constructor(scope: Construct, id: string, props?: StorageStackProps) {
    super(scope, id);

    const environment = 'dev';
    const projectName = 'myproject';

    const suffix =
      props?.bucketSuffixOverride ??
      Math.floor(Math.random() * 10000).toString();
    const bucketName = `${projectName}-${environment}-assets-${suffix}`;

    const commonTags = {
      Environment: environment,
      Project: projectName,
      ManagedBy: 'Terraform',
    };

    // === S3 Bucket
    const bucket = new S3Bucket(this, 'MainBucket', {
      bucket: bucketName,
      tags: {
        ...commonTags,
        Name: bucketName,
      },
    });

    // === Versioning
    new S3BucketVersioningA(this, 'BucketVersioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // === Encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: false,
        },
      ],
    });

    // === Block Public Access
    new S3BucketPublicAccessBlock(this, 'BlockPublicAccess', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // === Outputs
    new TerraformOutput(this, 'bucket_id', {
      value: bucket.id,
    });

    new TerraformOutput(this, 'bucket_arn', {
      value: bucket.arn,
    });

    new TerraformOutput(this, 'bucket_domain_name', {
      value: bucket.bucketDomainName,
    });

    new TerraformOutput(this, 'bucket_regional_domain_name', {
      value: bucket.bucketRegionalDomainName,
    });
  }
}
