/**
 * S3Stack - manages S3 bucket for serverless storage
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class S3Stack extends pulumi.ComponentResource {
    constructor(name, args = {}, opts) {
        super('tap:s3:S3Stack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};

        // Create S3 bucket for serverless application
        this.bucket = new aws.s3.Bucket(`tap-serverless-bucket-${environmentSuffix}`, {
            versioning: {
                enabled: true
            },
            lifecycleRules: [{
                enabled: true,
                transitions: [{
                    days: 30,
                    storageClass: 'STANDARD_IA'
                }, {
                    days: 90,
                    storageClass: 'GLACIER'
                }]
            }],
            tags: {
                ...tags,
                Purpose: 'ServerlessStorage'
            }
        }, { parent: this });

        // Block public access for security
        const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-bucket-pab-${environmentSuffix}`, {
            bucket: this.bucket.bucket,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true
        }, { parent: this });

        this.registerOutputs({
            bucketName: this.bucket.bucket,
            bucketArn: this.bucket.arn
        });
    }
}