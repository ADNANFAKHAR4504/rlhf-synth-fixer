import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class S3Stack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:stack:S3Stack', name, args, opts);

        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};

        // Create S3 bucket with versioning
        this.bucket = new aws.s3.Bucket(`tap-app-bucket-${environmentSuffix}`, {
            versioning: {
                enabled: true,
            },
            tags: {
                ...tags,
                Name: `tap-app-bucket-${environmentSuffix}`,
            },
        }, { parent: this });

        // Note: Bucket access is controlled via IAM policies
        // ACLs are not supported with S3 Object Ownership set to BucketOwnerEnforced

        // Upload Lambda function code to S3
        const lambdaCode = new aws.s3.BucketObject(`lambda-code-${environmentSuffix}`, {
            bucket: this.bucket.id,
            key: "lambda-function.zip",
            source: new pulumi.asset.AssetArchive({
                "index.js": new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Lambda function triggered:', JSON.stringify(event, null, 2));
    
    // Example database connection logic would go here
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Lambda function executed successfully',
            timestamp: new Date().toISOString(),
        }),
    };
};
                `.trim()),
            }),
            tags: tags,
        }, { parent: this });

        this.bucketName = this.bucket.bucket;
        this.codeKey = lambdaCode.key;

        this.registerOutputs({
            bucketName: this.bucketName,
            bucketArn: this.bucket.arn,
            codeKey: this.codeKey,
        });
    }
}