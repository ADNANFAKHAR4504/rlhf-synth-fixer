import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketAccelerateConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-accelerate-configuration';
import { S3BucketIntelligentTieringConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-intelligent-tiering-configuration';
import { S3BucketObjectLockConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-object-lock-configuration';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3DirectoryBucket } from '@cdktf/provider-aws/lib/s3-directory-bucket';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

interface ArtifactStorageStackProps {
  environmentSuffix: string;
  buildSystemRole: IamRole;
}

export class ArtifactStorageStack extends Construct {
  public readonly artifactBucket: S3Bucket;
  public readonly artifactBucketExpressOneZone: S3DirectoryBucket;

  constructor(scope: Construct, id: string, props: ArtifactStorageStackProps) {
    super(scope, id);

    const { environmentSuffix, buildSystemRole } = props;

    this.artifactBucket = new S3Bucket(this, 'artifact-bucket', {
      bucket: `cicd-artifacts-${environmentSuffix}-${Date.now()}`,
      objectLockEnabled: true,
      tags: {
        Name: `cicd-artifacts-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'CI/CD Build Artifacts',
      },
    });

    new S3BucketVersioningA(this, 'artifact-bucket-versioning', {
      bucket: this.artifactBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'artifact-bucket-encryption',
      {
        bucket: this.artifactBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    new S3BucketLifecycleConfiguration(this, 'artifact-bucket-lifecycle', {
      bucket: this.artifactBucket.id,
      rule: [
        {
          id: 'delete-old-versions',
          status: 'Enabled',
          filter: [{ prefix: '' }],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 30,
            },
          ],
        },
        {
          id: 'delete-old-artifacts',
          status: 'Enabled',
          filter: [{ prefix: '' }],
          expiration: [
            {
              days: 90,
            },
          ],
        },
        {
          id: 'intelligent-tiering',
          status: 'Enabled',
          filter: [{ prefix: '' }],
          transition: [
            {
              days: 7,
              storageClass: 'INTELLIGENT_TIERING',
            },
          ],
        },
      ],
    });

    new S3BucketAccelerateConfiguration(this, 'artifact-bucket-acceleration', {
      bucket: this.artifactBucket.id,
      status: 'Enabled',
    });

    new S3BucketIntelligentTieringConfiguration(
      this,
      'artifact-bucket-intelligent-tiering',
      {
        bucket: this.artifactBucket.id,
        name: 'archive-old-artifacts',
        tiering: [
          {
            accessTier: 'ARCHIVE_ACCESS',
            days: 90,
          },
          {
            accessTier: 'DEEP_ARCHIVE_ACCESS',
            days: 180,
          },
        ],
      }
    );

    new S3BucketObjectLockConfigurationA(this, 'artifact-bucket-object-lock', {
      bucket: this.artifactBucket.id,
      rule: {
        defaultRetention: {
          mode: 'GOVERNANCE',
          days: 90,
        },
      },
    });

    this.artifactBucketExpressOneZone = new S3DirectoryBucket(
      this,
      'artifact-bucket-express',
      {
        bucket: `cicd-artifacts-express-${environmentSuffix}-${Date.now()}--usw2-az1--x-s3`,
        location: [
          {
            name: 'usw2-az1',
            type: 'AvailabilityZone',
          },
        ],
        forceDestroy: true,
        dataRedundancy: 'SingleAvailabilityZone',
      }
    );

    const bucketPolicyDocument = new DataAwsIamPolicyDocument(
      this,
      'bucket-policy-document',
      {
        statement: [
          {
            sid: 'AllowBuildSystemAccess',
            effect: 'Allow',
            principals: [
              {
                type: 'AWS',
                identifiers: [buildSystemRole.arn],
              },
            ],
            actions: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
              's3:GetBucketVersioning',
              's3:GetObjectVersion',
            ],
            resources: [
              this.artifactBucket.arn,
              `${this.artifactBucket.arn}/*`,
            ],
          },
          {
            sid: 'DenyInsecureTransport',
            effect: 'Deny',
            principals: [
              {
                type: '*',
                identifiers: ['*'],
              },
            ],
            actions: ['s3:*'],
            resources: [
              this.artifactBucket.arn,
              `${this.artifactBucket.arn}/*`,
            ],
            condition: [
              {
                test: 'Bool',
                variable: 'aws:SecureTransport',
                values: ['false'],
              },
            ],
          },
        ],
      }
    );

    new S3BucketPolicy(this, 'artifact-bucket-policy', {
      bucket: this.artifactBucket.id,
      policy: bucketPolicyDocument.json,
    });
  }
}
