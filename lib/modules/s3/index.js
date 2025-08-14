"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecureS3Bucket = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class SecureS3Bucket extends pulumi.ComponentResource {
    bucket;
    bucketPolicy;
    publicAccessBlock;
    constructor(name, args, opts) {
        super('custom:security:SecureS3Bucket', name, {}, opts);
        // Create S3 bucket
        this.bucket = new aws.s3.Bucket(`${name}-bucket`, {
            bucket: args.bucketName,
            forceDestroy: false,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        // Enable versioning
        new aws.s3.BucketVersioning(`${name}-versioning`, {
            bucket: this.bucket.id,
            versioningConfiguration: {
                status: 'Enabled',
                mfaDelete: 'Disabled', // Can be enabled if MFA delete is required
            },
        }, { parent: this });
        // Configure server-side encryption
        new aws.s3.BucketServerSideEncryptionConfiguration(`${name}-encryption`, {
            bucket: this.bucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'aws:kms',
                        kmsMasterKeyId: args.kmsKeyId,
                    },
                    bucketKeyEnabled: true,
                },
            ],
        }, { parent: this });
        // Block all public access
        this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(`${name}-public-access-block`, {
            bucket: this.bucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Secure bucket policy (optional)
        if (args.enableBucketPolicy !== false) {
            const bucketPolicyDocument = pulumi
                .all([
                this.bucket.arn,
                aws.getCallerIdentity().then(id => id.accountId),
            ])
                .apply(([bucketArn, accountId]) => ({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'AllowRootAccountFullAccess',
                        Effect: 'Allow',
                        Principal: {
                            AWS: `arn:aws:iam::${accountId}:root`,
                        },
                        Action: 's3:*',
                        Resource: [bucketArn, `${bucketArn}/*`],
                    },
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
                        Sid: 'DenyUnencryptedObjectUploads',
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
            }));
            this.bucketPolicy = new aws.s3.BucketPolicy(`${name}-policy`, {
                bucket: this.bucket.id,
                policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy)),
            }, { parent: this, dependsOn: [this.publicAccessBlock] });
        }
        // Configure lifecycle rules if provided
        if (args.lifecycleRules) {
            new aws.s3.BucketLifecycleConfiguration(`${name}-lifecycle`, {
                bucket: this.bucket.id,
                rules: args.lifecycleRules,
            }, { parent: this });
        }
        // Enable logging (simplified for bucket owner enforced buckets)
        new aws.s3.BucketLogging(`${name}-logging`, {
            bucket: this.bucket.id,
            targetBucket: this.bucket.id,
            targetPrefix: 'access-logs/',
        }, { parent: this });
        this.registerOutputs({
            bucketName: this.bucket.id,
            bucketArn: this.bucket.arn,
            bucketDomainName: this.bucket.bucketDomainName,
        });
    }
}
exports.SecureS3Bucket = SecureS3Bucket;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQVUvQyxNQUFhLGNBQWUsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzFDLE1BQU0sQ0FBZ0I7SUFDdEIsWUFBWSxDQUFzQjtJQUNsQyxpQkFBaUIsQ0FBaUM7SUFFbEUsWUFDRSxJQUFZLEVBQ1osSUFBd0IsRUFDeEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFeEQsbUJBQW1CO1FBQ25CLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLE1BQU0sQ0FDN0IsR0FBRyxJQUFJLFNBQVMsRUFDaEI7WUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLFVBQVU7WUFDdkIsWUFBWSxFQUFFLEtBQUs7WUFDbkIsSUFBSSxFQUFFLEVBQUUsR0FBRyxpQkFBVSxFQUFFLEdBQUcsSUFBSSxDQUFDLElBQUksRUFBRTtTQUN0QyxFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsb0JBQW9CO1FBQ3BCLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FBQyxnQkFBZ0IsQ0FDekIsR0FBRyxJQUFJLGFBQWEsRUFDcEI7WUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RCLHVCQUF1QixFQUFFO2dCQUN2QixNQUFNLEVBQUUsU0FBUztnQkFDakIsU0FBUyxFQUFFLFVBQVUsRUFBRSwyQ0FBMkM7YUFDbkU7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsbUNBQW1DO1FBQ25DLElBQUksR0FBRyxDQUFDLEVBQUUsQ0FB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dEQsQ0FBQztRQUNKLENBQUM7UUFFRCx3Q0FBd0M7UUFDeEMsSUFBSSxJQUFJLENBQUMsY0FBYyxFQUFFLENBQUM7WUFDeEIsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLDRCQUE0QixDQUNyQyxHQUFHLElBQUksWUFBWSxFQUNuQjtnQkFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO2dCQUN0QixLQUFLLEVBQUUsSUFBSSxDQUFDLGNBQWM7YUFDM0IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUNKLENBQUM7UUFFRCxnRUFBZ0U7UUFDaEUsSUFBSSxHQUFHLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FDdEIsR0FBRyxJQUFJLFVBQVUsRUFDakI7WUFDRSxNQUFNLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxFQUFFO1lBQ3RCLFlBQVksRUFBRSxJQUFJLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDNUIsWUFBWSxFQUFFLGNBQWM7U0FDN0IsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsVUFBVSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsRUFBRTtZQUMxQixTQUFTLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxHQUFHO1lBQzFCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsZ0JBQWdCO1NBQy9DLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhKRCx3Q0F3SkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgU2VjdXJlUzNCdWNrZXRBcmdzIHtcbiAgYnVja2V0TmFtZT86IHN0cmluZztcbiAga21zS2V5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbiAgbGlmZWN5Y2xlUnVsZXM/OiBhbnlbXTtcbiAgZW5hYmxlQnVja2V0UG9saWN5PzogYm9vbGVhbjsgLy8gT3B0aW9uYWwgZmxhZyB0byBlbmFibGUvZGlzYWJsZSBidWNrZXQgcG9saWN5XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cmVTM0J1Y2tldCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXQ6IGF3cy5zMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBidWNrZXRQb2xpY3k6IGF3cy5zMy5CdWNrZXRQb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSBwdWJsaWNBY2Nlc3NCbG9jazogYXdzLnMzLkJ1Y2tldFB1YmxpY0FjY2Vzc0Jsb2NrO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBTZWN1cmVTM0J1Y2tldEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpTZWN1cmVTM0J1Y2tldCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXRcbiAgICB0aGlzLmJ1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYCR7bmFtZX0tYnVja2V0YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBhcmdzLmJ1Y2tldE5hbWUsXG4gICAgICAgIGZvcmNlRGVzdHJveTogZmFsc2UsXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmFibGUgdmVyc2lvbmluZ1xuICAgIG5ldyBhd3MuczMuQnVja2V0VmVyc2lvbmluZyhcbiAgICAgIGAke25hbWV9LXZlcnNpb25pbmdgLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgIG1mYURlbGV0ZTogJ0Rpc2FibGVkJywgLy8gQ2FuIGJlIGVuYWJsZWQgaWYgTUZBIGRlbGV0ZSBpcyByZXF1aXJlZFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ29uZmlndXJlIHNlcnZlci1zaWRlIGVuY3J5cHRpb25cbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihcbiAgICAgIGAke25hbWV9LWVuY3J5cHRpb25gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICBydWxlczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIGFwcGx5U2VydmVyU2lkZUVuY3J5cHRpb25CeURlZmF1bHQ6IHtcbiAgICAgICAgICAgICAgc3NlQWxnb3JpdGhtOiAnYXdzOmttcycsXG4gICAgICAgICAgICAgIGttc01hc3RlcktleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEJsb2NrIGFsbCBwdWJsaWMgYWNjZXNzXG4gICAgdGhpcy5wdWJsaWNBY2Nlc3NCbG9jayA9IG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICBgJHtuYW1lfS1wdWJsaWMtYWNjZXNzLWJsb2NrYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gU2VjdXJlIGJ1Y2tldCBwb2xpY3kgKG9wdGlvbmFsKVxuICAgIGlmIChhcmdzLmVuYWJsZUJ1Y2tldFBvbGljeSAhPT0gZmFsc2UpIHtcbiAgICAgIGNvbnN0IGJ1Y2tldFBvbGljeURvY3VtZW50ID0gcHVsdW1pXG4gICAgICAgIC5hbGwoW1xuICAgICAgICAgIHRoaXMuYnVja2V0LmFybixcbiAgICAgICAgICBhd3MuZ2V0Q2FsbGVySWRlbnRpdHkoKS50aGVuKGlkID0+IGlkLmFjY291bnRJZCksXG4gICAgICAgIF0pXG4gICAgICAgIC5hcHBseSgoW2J1Y2tldEFybiwgYWNjb3VudElkXSkgPT4gKHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFNpZDogJ0FsbG93Um9vdEFjY291bnRGdWxsQWNjZXNzJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBBV1M6IGBhcm46YXdzOmlhbTo6JHthY2NvdW50SWR9OnJvb3RgLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzMzoqJyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IFtidWNrZXRBcm4sIGAke2J1Y2tldEFybn0vKmBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueUluc2VjdXJlQ29ubmVjdGlvbnMnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdEZW55JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiAnKicsXG4gICAgICAgICAgICAgIEFjdGlvbjogJ3MzOionLFxuICAgICAgICAgICAgICBSZXNvdXJjZTogW2J1Y2tldEFybiwgYCR7YnVja2V0QXJufS8qYF0sXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIEJvb2w6IHtcbiAgICAgICAgICAgICAgICAgICdhd3M6U2VjdXJlVHJhbnNwb3J0JzogJ2ZhbHNlJyxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgU2lkOiAnRGVueVVuZW5jcnlwdGVkT2JqZWN0VXBsb2FkcycsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0RlbnknLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6ICcqJyxcbiAgICAgICAgICAgICAgQWN0aW9uOiAnczM6UHV0T2JqZWN0JyxcbiAgICAgICAgICAgICAgUmVzb3VyY2U6IGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgIFN0cmluZ05vdEVxdWFsczoge1xuICAgICAgICAgICAgICAgICAgJ3MzOngtYW16LXNlcnZlci1zaWRlLWVuY3J5cHRpb24nOiAnYXdzOmttcycsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSkpO1xuXG4gICAgICB0aGlzLmJ1Y2tldFBvbGljeSA9IG5ldyBhd3MuczMuQnVja2V0UG9saWN5KFxuICAgICAgICBgJHtuYW1lfS1wb2xpY3lgLFxuICAgICAgICB7XG4gICAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgICBwb2xpY3k6IGJ1Y2tldFBvbGljeURvY3VtZW50LmFwcGx5KHBvbGljeSA9PiBKU09OLnN0cmluZ2lmeShwb2xpY3kpKSxcbiAgICAgICAgfSxcbiAgICAgICAgeyBwYXJlbnQ6IHRoaXMsIGRlcGVuZHNPbjogW3RoaXMucHVibGljQWNjZXNzQmxvY2tdIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ29uZmlndXJlIGxpZmVjeWNsZSBydWxlcyBpZiBwcm92aWRlZFxuICAgIGlmIChhcmdzLmxpZmVjeWNsZVJ1bGVzKSB7XG4gICAgICBuZXcgYXdzLnMzLkJ1Y2tldExpZmVjeWNsZUNvbmZpZ3VyYXRpb24oXG4gICAgICAgIGAke25hbWV9LWxpZmVjeWNsZWAsXG4gICAgICAgIHtcbiAgICAgICAgICBidWNrZXQ6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgICAgIHJ1bGVzOiBhcmdzLmxpZmVjeWNsZVJ1bGVzLFxuICAgICAgICB9LFxuICAgICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIEVuYWJsZSBsb2dnaW5nIChzaW1wbGlmaWVkIGZvciBidWNrZXQgb3duZXIgZW5mb3JjZWQgYnVja2V0cylcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldExvZ2dpbmcoXG4gICAgICBgJHtuYW1lfS1sb2dnaW5nYCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgdGFyZ2V0QnVja2V0OiB0aGlzLmJ1Y2tldC5pZCxcbiAgICAgICAgdGFyZ2V0UHJlZml4OiAnYWNjZXNzLWxvZ3MvJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGJ1Y2tldE5hbWU6IHRoaXMuYnVja2V0LmlkLFxuICAgICAgYnVja2V0QXJuOiB0aGlzLmJ1Y2tldC5hcm4sXG4gICAgICBidWNrZXREb21haW5OYW1lOiB0aGlzLmJ1Y2tldC5idWNrZXREb21haW5OYW1lLFxuICAgIH0pO1xuICB9XG59XG4iXX0=