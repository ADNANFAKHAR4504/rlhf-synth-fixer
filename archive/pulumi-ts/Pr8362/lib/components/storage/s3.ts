import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3BucketArgs {
  bucketName?: string;
  acl?: string;
  forceDestroy?: boolean;
  tags?: Record<string, string>;
  versioning?: {
    enabled: boolean;
    mfaDelete?: boolean;
  };
  serverSideEncryption?: {
    algorithm: string;
    kmsKeyId?: pulumi.Input<string>;
    bucketKeyEnabled?: boolean;
  };
  publicAccessBlock?: {
    blockPublicAcls?: boolean;
    blockPublicPolicy?: boolean;
    ignorePublicAcls?: boolean;
    restrictPublicBuckets?: boolean;
  };
  lifecycleRules?: Array<{
    id: string;
    status: 'Enabled' | 'Disabled';
    filter?: {
      prefix?: string;
      tags?: Record<string, string>;
    };
    expiration?: {
      days?: number;
      expiredObjectDeleteMarker?: boolean;
    };
    noncurrentVersionExpiration?: {
      noncurrentDays?: number;
    };
    transitions?: Array<{
      days: number;
      storageClass: string;
    }>;
  }>;
  corsRules?: Array<{
    allowedHeaders?: string[];
    allowedMethods: string[];
    allowedOrigins: string[];
    exposeHeaders?: string[];
    maxAgeSeconds?: number;
  }>;
}

export interface S3BucketResult {
  bucket: aws.s3.Bucket;
  bucketId: pulumi.Output<string>;
  bucketArn: pulumi.Output<string>;
  bucketDomainName: pulumi.Output<string>;
  versioning?: aws.s3.BucketVersioning;
  serverSideEncryption?: aws.s3.BucketServerSideEncryptionConfiguration;
  publicAccessBlock?: aws.s3.BucketPublicAccessBlock;
  lifecycleConfiguration?: aws.s3.BucketLifecycleConfiguration;
  corsConfiguration?: aws.s3.BucketCorsConfiguration; // ← FIXED: Removed V2
  bucketPolicy?: aws.s3.BucketPolicy;
}

export interface S3BucketPolicyArgs {
  bucket: pulumi.Input<string>;
  policy: pulumi.Input<string>;
}

export interface SecureS3BucketArgs {
  name: string;
  bucketName?: string;
  kmsKeyId?: pulumi.Input<string>;
  enableVersioning?: boolean;
  enableLifecycle?: boolean;
  tags?: Record<string, string>;
  allowedPrincipals?: string[];
  allowedActions?: string[];
}

// Define interface for lifecycle rule configuration
interface LifecycleRuleConfig {
  id: string;
  status: string;
  filter?: {
    prefix?: string;
    tags?: Record<string, string>;
  };
  expiration?: {
    days?: number;
    expiredObjectDeleteMarker?: boolean;
  };
  noncurrentVersionExpiration?: {
    noncurrentDays: number;
  };
  transitions?: Array<{
    days: number;
    storageClass: string;
  }>;
}

export class S3BucketComponent extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketId: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly bucketDomainName: pulumi.Output<string>;
  public readonly versioning?: aws.s3.BucketVersioning;
  public readonly serverSideEncryption?: aws.s3.BucketServerSideEncryptionConfiguration;
  public readonly publicAccessBlock?: aws.s3.BucketPublicAccessBlock;
  public readonly lifecycleConfiguration?: aws.s3.BucketLifecycleConfiguration;
  public readonly corsConfiguration?: aws.s3.BucketCorsConfiguration; // ← FIXED: Removed V2
  public readonly bucketPolicy?: aws.s3.BucketPolicy;

  constructor(
    name: string,
    args: S3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:s3:S3BucketComponent', name, {}, opts);

    const defaultTags = {
      Name: args.bucketName || name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    //  Create S3 bucket without deprecated ACL
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: args.bucketName,
        // Removed ACL - will use aws.s3.BucketAcl resource instead
        forceDestroy: args.forceDestroy ?? false,
        tags: defaultTags,
      },
      { parent: this, provider: opts?.provider }
    );

    //  Create separate ACL
    if (args.acl && args.acl !== 'private') {
      new aws.s3.BucketAcl(
        `${name}-acl`,
        {
          bucket: this.bucket.id,
          acl: args.acl,
        },
        { parent: this, provider: opts?.provider }
      );
    }

    this.bucketId = this.bucket.id;
    this.bucketArn = this.bucket.arn;
    this.bucketDomainName = this.bucket.bucketDomainName;

    // Configure versioning
    if (args.versioning) {
      this.versioning = new aws.s3.BucketVersioning(
        `${name}-versioning`,
        {
          bucket: this.bucket.id,
          versioningConfiguration: {
            status: args.versioning.enabled ? 'Enabled' : 'Suspended',
            mfaDelete: args.versioning.mfaDelete ? 'Enabled' : 'Disabled',
          },
        },
        { parent: this, provider: opts?.provider }
      );
    }

    // Configure server-side encryption if specified
    if (args.serverSideEncryption) {
      this.serverSideEncryption =
        new aws.s3.BucketServerSideEncryptionConfiguration(
          `${name}-encryption`,
          {
            bucket: this.bucket.id,
            rules: [
              {
                applyServerSideEncryptionByDefault: {
                  sseAlgorithm: args.serverSideEncryption.algorithm,
                  kmsMasterKeyId: args.serverSideEncryption.kmsKeyId,
                },
                bucketKeyEnabled:
                  args.serverSideEncryption.bucketKeyEnabled ?? true,
              },
            ],
          },
          { parent: this, provider: opts?.provider }
        );
    }

    // Configure public access block (defaults to blocking all public access)
    const publicAccessBlockConfig = args.publicAccessBlock || {
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    };

    this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${name}-public-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: publicAccessBlockConfig.blockPublicAcls ?? true,
        blockPublicPolicy: publicAccessBlockConfig.blockPublicPolicy ?? true,
        ignorePublicAcls: publicAccessBlockConfig.ignorePublicAcls ?? true,
        restrictPublicBuckets:
          publicAccessBlockConfig.restrictPublicBuckets ?? true,
      },
      { parent: this, provider: opts?.provider }
    );

    // Configure lifecycle rules if specified
    if (args.lifecycleRules && args.lifecycleRules.length > 0) {
      this.lifecycleConfiguration = new aws.s3.BucketLifecycleConfiguration(
        `${name}-lifecycle`,
        {
          bucket: this.bucket.id,
          rules: args.lifecycleRules.map(rule => {
            const lifecycleRule: LifecycleRuleConfig = {
              id: rule.id,
              status: rule.status,
            };

            if (rule.filter) {
              lifecycleRule.filter = {
                prefix: rule.filter.prefix,
                tags: rule.filter.tags,
              };
            }

            if (rule.expiration) {
              lifecycleRule.expiration = {
                days: rule.expiration.days,
                expiredObjectDeleteMarker:
                  rule.expiration.expiredObjectDeleteMarker,
              };
            }

            if (
              rule.noncurrentVersionExpiration &&
              rule.noncurrentVersionExpiration.noncurrentDays !== undefined
            ) {
              lifecycleRule.noncurrentVersionExpiration = {
                noncurrentDays: rule.noncurrentVersionExpiration.noncurrentDays,
              };
            }

            if (rule.transitions) {
              lifecycleRule.transitions = rule.transitions.map(transition => ({
                days: transition.days,
                storageClass: transition.storageClass,
              }));
            }

            return lifecycleRule;
          }),
        },
        { parent: this, provider: opts?.provider }
      );
    }

    //  Configure CORS with non-deprecated resource
    if (args.corsRules && args.corsRules.length > 0) {
      this.corsConfiguration = new aws.s3.BucketCorsConfiguration( // ← FIXED: Removed V2
        `${name}-cors`,
        {
          bucket: this.bucket.id,
          corsRules: args.corsRules,
        },
        { parent: this, provider: opts?.provider }
      );
    }

    this.registerOutputs({
      bucket: this.bucket,
      bucketId: this.bucketId,
      bucketArn: this.bucketArn,
      bucketDomainName: this.bucketDomainName,
      versioning: this.versioning,
      serverSideEncryption: this.serverSideEncryption,
      publicAccessBlock: this.publicAccessBlock,
      lifecycleConfiguration: this.lifecycleConfiguration,
      corsConfiguration: this.corsConfiguration,
    });
  }
}

export class S3BucketPolicyComponent extends pulumi.ComponentResource {
  public readonly bucketPolicy: aws.s3.BucketPolicy;

  constructor(
    name: string,
    args: S3BucketPolicyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:s3:S3BucketPolicyComponent', name, {}, opts);

    this.bucketPolicy = new aws.s3.BucketPolicy(
      `${name}-policy`,
      {
        bucket: args.bucket,
        policy: args.policy,
      },
      { parent: this, provider: opts?.provider }
    );

    this.registerOutputs({
      bucketPolicy: this.bucketPolicy,
    });
  }
}

export class SecureS3BucketComponent extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketId: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;
  public readonly bucketDomainName: pulumi.Output<string>;
  public readonly versioning?: aws.s3.BucketVersioning;
  public readonly serverSideEncryption?: aws.s3.BucketServerSideEncryptionConfiguration;
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly lifecycleConfiguration?: aws.s3.BucketLifecycleConfiguration;
  public readonly bucketPolicy?: aws.s3.BucketPolicy;

  constructor(
    name: string,
    args: SecureS3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:s3:SecureS3BucketComponent', name, {}, opts);

    // Default secure lifecycle rules - ensure all values are defined
    const defaultLifecycleRules = args.enableLifecycle
      ? [
          {
            id: 'transition-to-ia',
            status: 'Enabled' as const,
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
          {
            id: 'delete-old-versions',
            status: 'Enabled' as const,
            noncurrentVersionExpiration: {
              noncurrentDays: 90,
            },
          },
          {
            id: 'cleanup-incomplete-uploads',
            status: 'Enabled' as const,
            expiration: {
              expiredObjectDeleteMarker: true,
            },
          },
        ]
      : undefined;

    // Create secure S3 bucket
    const s3BucketComponent = new S3BucketComponent(
      name,
      {
        bucketName: args.bucketName,
        // Removed ACL parameter - defaults to private
        forceDestroy: false,
        tags: args.tags,
        versioning: {
          enabled: args.enableVersioning ?? true,
          mfaDelete: false,
        },
        serverSideEncryption: {
          algorithm: 'aws:kms',
          kmsKeyId: args.kmsKeyId,
          bucketKeyEnabled: true,
        },
        publicAccessBlock: {
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        },
        lifecycleRules: defaultLifecycleRules,
      },
      { parent: this, provider: opts?.provider }
    );

    this.bucket = s3BucketComponent.bucket;
    this.bucketId = s3BucketComponent.bucketId;
    this.bucketArn = s3BucketComponent.bucketArn;
    this.bucketDomainName = s3BucketComponent.bucketDomainName;
    this.versioning = s3BucketComponent.versioning;
    this.serverSideEncryption = s3BucketComponent.serverSideEncryption;
    this.publicAccessBlock = s3BucketComponent.publicAccessBlock!;
    this.lifecycleConfiguration = s3BucketComponent.lifecycleConfiguration;

    // Create secure bucket policy
    if (args.allowedPrincipals && args.allowedActions) {
      const bucketPolicy = pulumi
        .all([this.bucketArn, pulumi.output(aws.getCallerIdentity())])
        .apply(([bucketArn, _identity]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyInsecureConnections',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
              {
                Sid: 'AllowSpecificPrincipals',
                Effect: 'Allow',
                Principal: {
                  AWS: args.allowedPrincipals,
                },
                Action: args.allowedActions,
                Resource: [bucketArn, `${bucketArn}/*`],
              },
              {
                Sid: 'DenyUnencryptedUploads',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:PutObject',
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringNotEquals: {
                    's3:x-amz-server-side-encryption': 'aws:kms',
                  },
                },
              },
            ],
          })
        );

      const bucketPolicyComponent = new S3BucketPolicyComponent(
        `${name}-policy`,
        {
          bucket: this.bucketId,
          policy: bucketPolicy,
        },
        { parent: this, provider: opts?.provider }
      );

      this.bucketPolicy = bucketPolicyComponent.bucketPolicy;
    }

    this.registerOutputs({
      bucket: this.bucket,
      bucketId: this.bucketId,
      bucketArn: this.bucketArn,
      bucketDomainName: this.bucketDomainName,
      versioning: this.versioning,
      serverSideEncryption: this.serverSideEncryption,
      publicAccessBlock: this.publicAccessBlock,
      lifecycleConfiguration: this.lifecycleConfiguration,
      bucketPolicy: this.bucketPolicy,
    });
  }
}

export function createS3Bucket(
  name: string,
  args: S3BucketArgs,
  opts?: pulumi.ComponentResourceOptions
): S3BucketResult {
  const s3BucketComponent = new S3BucketComponent(name, args, opts);
  return {
    bucket: s3BucketComponent.bucket,
    bucketId: s3BucketComponent.bucketId,
    bucketArn: s3BucketComponent.bucketArn,
    bucketDomainName: s3BucketComponent.bucketDomainName,
    versioning: s3BucketComponent.versioning,
    serverSideEncryption: s3BucketComponent.serverSideEncryption,
    publicAccessBlock: s3BucketComponent.publicAccessBlock,
    lifecycleConfiguration: s3BucketComponent.lifecycleConfiguration,
    corsConfiguration: s3BucketComponent.corsConfiguration,
    bucketPolicy: s3BucketComponent.bucketPolicy,
  };
}

export function createS3BucketPolicy(
  name: string,
  args: S3BucketPolicyArgs,
  opts?: pulumi.ComponentResourceOptions
): aws.s3.BucketPolicy {
  const bucketPolicyComponent = new S3BucketPolicyComponent(name, args, opts);
  return bucketPolicyComponent.bucketPolicy;
}

export function createSecureS3Bucket(
  name: string,
  args: SecureS3BucketArgs,
  opts?: pulumi.ComponentResourceOptions
): S3BucketResult {
  const secureS3BucketComponent = new SecureS3BucketComponent(name, args, opts);
  return {
    bucket: secureS3BucketComponent.bucket,
    bucketId: secureS3BucketComponent.bucketId,
    bucketArn: secureS3BucketComponent.bucketArn,
    bucketDomainName: secureS3BucketComponent.bucketDomainName,
    versioning: secureS3BucketComponent.versioning,
    serverSideEncryption: secureS3BucketComponent.serverSideEncryption,
    publicAccessBlock: secureS3BucketComponent.publicAccessBlock,
    lifecycleConfiguration: secureS3BucketComponent.lifecycleConfiguration,
    corsConfiguration: undefined,
    bucketPolicy: secureS3BucketComponent.bucketPolicy,
  };
}
