import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface BucketPoliciesArgs {
  environmentSuffix: string;
  publicBucket: aws.s3.BucketV2;
  internalBucket: aws.s3.BucketV2;
  confidentialBucket: aws.s3.BucketV2;
}

export class BucketPolicies extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: BucketPoliciesArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:BucketPolicies', name, {}, opts);

    const {
      environmentSuffix,
      publicBucket,
      internalBucket,
      confidentialBucket,
    } = args;

    // Public bucket policy - enforce HTTPS
    const publicBucketPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
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
            publicBucket.arn,
            pulumi.interpolate`${publicBucket.arn}/*`,
          ],
          conditions: [
            {
              test: 'Bool',
              variable: 'aws:SecureTransport',
              values: ['false'],
            },
          ],
        },
      ],
    });

    new aws.s3.BucketPolicy(
      `public-bucket-policy-${environmentSuffix}`,
      {
        bucket: publicBucket.id,
        policy: publicBucketPolicyDoc.json,
      },
      { parent: this }
    );

    // Internal bucket policy - enforce HTTPS
    const internalBucketPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
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
            internalBucket.arn,
            pulumi.interpolate`${internalBucket.arn}/*`,
          ],
          conditions: [
            {
              test: 'Bool',
              variable: 'aws:SecureTransport',
              values: ['false'],
            },
          ],
        },
      ],
    });

    new aws.s3.BucketPolicy(
      `internal-bucket-policy-${environmentSuffix}`,
      {
        bucket: internalBucket.id,
        policy: internalBucketPolicyDoc.json,
      },
      { parent: this }
    );

    // Confidential bucket policy - enforce HTTPS
    // Note: Cross-account access removed as external account doesn't exist in test environment
    const confidentialBucketPolicyDoc = aws.iam.getPolicyDocumentOutput({
      statements: [
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
            confidentialBucket.arn,
            pulumi.interpolate`${confidentialBucket.arn}/*`,
          ],
          conditions: [
            {
              test: 'Bool',
              variable: 'aws:SecureTransport',
              values: ['false'],
            },
          ],
        },
      ],
    });

    new aws.s3.BucketPolicy(
      `confidential-bucket-policy-${environmentSuffix}`,
      {
        bucket: confidentialBucket.id,
        policy: confidentialBucketPolicyDoc.json,
      },
      { parent: this }
    );

    this.registerOutputs({});
  }
}
