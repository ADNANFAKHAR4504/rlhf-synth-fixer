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
exports.S3Construct = void 0;
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const cdk = __importStar(require("aws-cdk-lib"));
const constructs_1 = require("constructs");
class S3Construct extends constructs_1.Construct {
    primaryBucket;
    replicationBucket;
    expressBucket;
    constructor(scope, id, props) {
        super(scope, id);
        // Create replication destination bucket first (in different region)
        this.replicationBucket = new s3.Bucket(this, 'ReplicationBucket', {
            bucketName: `tap-replica-${props.environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    id: 'DeleteOldVersions',
                    enabled: true,
                    noncurrentVersionExpiration: cdk.Duration.days(props.environmentSuffix === 'prod' ? 90 : 30),
                },
            ],
        });
        // Create primary bucket with cross-region replication
        this.primaryBucket = new s3.Bucket(this, 'PrimaryBucket', {
            bucketName: `tap-primary-${props.environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            lifecycleRules: [
                {
                    id: 'TransitionToIA',
                    enabled: true,
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(30),
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(90),
                        },
                    ],
                },
                {
                    id: 'DeleteOldVersions',
                    enabled: true,
                    noncurrentVersionExpiration: cdk.Duration.days(props.environmentSuffix === 'prod' ? 90 : 30),
                },
            ],
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.PUT,
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                },
            ],
        });
        // Configure cross-region replication
        const replicationConfiguration = {
            role: props.replicationRole.roleArn,
            rules: [
                {
                    id: `replication-rule-${props.environmentSuffix}`,
                    status: 'Enabled',
                    prefix: '',
                    destination: {
                        bucket: this.replicationBucket.bucketArn,
                        storageClass: 'STANDARD_IA',
                    },
                },
            ],
        };
        // Add replication configuration to primary bucket
        const cfnPrimaryBucket = this.primaryBucket.node
            .defaultChild;
        cfnPrimaryBucket.replicationConfiguration = replicationConfiguration;
        // Create S3 Express One Zone bucket for high-performance workloads (prod only)
        if (props.enableS3Express) {
            // Note: S3 Express One Zone uses directory buckets with different naming
            this.expressBucket = new s3.Bucket(this, 'ExpressBucket', {
                bucketName: `tap-express-${props.environmentSuffix}--use1-az1--x-s3`,
                versioned: false, // Express One Zone doesn't support versioning
                encryption: s3.BucketEncryption.S3_MANAGED,
                blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            });
            // Configure Express bucket for high performance
            const cfnExpressBucket = this.expressBucket.node
                .defaultChild;
            cfnExpressBucket.addPropertyOverride('BucketConfiguration.Type', 'Directory');
            cfnExpressBucket.addPropertyOverride('BucketConfiguration.Location.Type', 'AvailabilityZone');
            cfnExpressBucket.addPropertyOverride('BucketConfiguration.Location.Name', 'use1-az1');
        }
        // Grant replication permissions
        this.replicationBucket.grantReadWrite(props.replicationRole);
        this.primaryBucket.grantReadWrite(props.replicationRole);
        // Add tags
        const buckets = [this.primaryBucket, this.replicationBucket];
        if (this.expressBucket)
            buckets.push(this.expressBucket);
        buckets.forEach(bucket => {
            bucket.node.addMetadata('Environment', props.environmentSuffix);
            bucket.node.addMetadata('Component', 'S3');
        });
    }
}
exports.S3Construct = S3Construct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtY29uc3RydWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiczMtY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLHVEQUF5QztBQUV6QyxpREFBbUM7QUFDbkMsMkNBQXVDO0FBVXZDLE1BQWEsV0FBWSxTQUFRLHNCQUFTO0lBQ3hCLGFBQWEsQ0FBWTtJQUN6QixpQkFBaUIsQ0FBWTtJQUM3QixhQUFhLENBQWE7SUFFMUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUF1QjtRQUMvRCxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLG9FQUFvRTtRQUNwRSxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUNoRSxVQUFVLEVBQUUsZUFBZSxLQUFLLENBQUMsaUJBQWlCLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxVQUFVLEVBQUU7WUFDMUUsU0FBUyxFQUFFLElBQUk7WUFDZixVQUFVLEVBQUUsRUFBRSxDQUFDLGdCQUFnQixDQUFDLFVBQVU7WUFDMUMsaUJBQWlCLEVBQUUsRUFBRSxDQUFDLGlCQUFpQixDQUFDLFNBQVM7WUFDakQsY0FBYyxFQUFFO2dCQUNkO29CQUNFLEVBQUUsRUFBRSxtQkFBbUI7b0JBQ3ZCLE9BQU8sRUFBRSxJQUFJO29CQUNiLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUM1QyxLQUFLLENBQUMsaUJBQWlCLEtBQUssTUFBTSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FDN0M7aUJBQ0Y7YUFDRjtTQUNGLENBQUMsQ0FBQztRQUVILHNEQUFzRDtRQUN0RCxJQUFJLENBQUMsYUFBYSxHQUFHLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQyxJQUFJLEVBQUUsZUFBZSxF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Q0FBQyxtQkFBbUIsQ0FDbEMsbUNBQW1DLEVBQ25DLGtCQUFrQixDQUNuQixDQUFDO1lBQ0YsZ0JBQWdCLENBQUMsbUJBQW1CLENBQ2xDLG1DQUFtQyxFQUNuQyxVQUFVLENBQ1gsQ0FBQztRQUNKLENBQUM7UUFFRCxnQ0FBZ0M7UUFDaEMsSUFBSSxDQUFDLGlCQUFpQixDQUFDLGNBQWMsQ0FBQyxLQUFLLENBQUMsZUFBZSxDQUFDLENBQUM7UUFDN0QsSUFBSSxDQUFDLGFBQWEsQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLGVBQWUsQ0FBQyxDQUFDO1FBRXpELFdBQVc7UUFDWCxNQUFNLE9BQU8sR0FBRyxDQUFDLElBQUksQ0FBQyxhQUFhLEVBQUUsSUFBSSxDQUFDLGlCQUFpQixDQUFDLENBQUM7UUFDN0QsSUFBSSxJQUFJLENBQUMsYUFBYTtZQUFFLE9BQU8sQ0FBQyxJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxDQUFDO1FBRXpELE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTSxDQUFDLEVBQUU7WUFDdkIsTUFBTSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsYUFBYSxFQUFFLEtBQUssQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO1lBQ2hFLE1BQU0sQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLFdBQVcsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUM3QyxDQUFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQWhJRCxrQ0FnSUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBzMyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtczMnO1xuaW1wb3J0ICogYXMgaWFtIGZyb20gJ2F3cy1jZGstbGliL2F3cy1pYW0nO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFMzQ29uc3RydWN0UHJvcHMge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICBwcmltYXJ5UmVnaW9uOiBzdHJpbmc7XG4gIHJlcGxpY2F0aW9uUmVnaW9uOiBzdHJpbmc7XG4gIGVuYWJsZVMzRXhwcmVzczogYm9vbGVhbjtcbiAgcmVwbGljYXRpb25Sb2xlOiBpYW0uUm9sZTtcbn1cblxuZXhwb3J0IGNsYXNzIFMzQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IHByaW1hcnlCdWNrZXQ6IHMzLkJ1Y2tldDtcbiAgcHVibGljIHJlYWRvbmx5IHJlcGxpY2F0aW9uQnVja2V0OiBzMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBleHByZXNzQnVja2V0PzogczMuQnVja2V0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTM0NvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSByZXBsaWNhdGlvbiBkZXN0aW5hdGlvbiBidWNrZXQgZmlyc3QgKGluIGRpZmZlcmVudCByZWdpb24pXG4gICAgdGhpcy5yZXBsaWNhdGlvbkJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ1JlcGxpY2F0aW9uQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYHRhcC1yZXBsaWNhLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9LSR7Y2RrLkF3cy5BQ0NPVU5UX0lEfWAsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnRGVsZXRlT2xkVmVyc2lvbnMnLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cyhcbiAgICAgICAgICAgIHByb3BzLmVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCcgPyA5MCA6IDMwXG4gICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgcHJpbWFyeSBidWNrZXQgd2l0aCBjcm9zcy1yZWdpb24gcmVwbGljYXRpb25cbiAgICB0aGlzLnByaW1hcnlCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdQcmltYXJ5QnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYHRhcC1wcmltYXJ5LSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9LSR7Y2RrLkF3cy5BQ0NPVU5UX0lEfWAsXG4gICAgICB2ZXJzaW9uZWQ6IHRydWUsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnVHJhbnNpdGlvblRvSUEnLFxuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuSU5GUkVRVUVOVF9BQ0NFU1MsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoMzApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuR0xBQ0lFUixcbiAgICAgICAgICAgICAgdHJhbnNpdGlvbkFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cyg5MCksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ0RlbGV0ZU9sZFZlcnNpb25zJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoXG4gICAgICAgICAgICBwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnID8gOTAgOiAzMFxuICAgICAgICAgICksXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgICAgY29yczogW1xuICAgICAgICB7XG4gICAgICAgICAgYWxsb3dlZE1ldGhvZHM6IFtcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLkdFVCxcbiAgICAgICAgICAgIHMzLkh0dHBNZXRob2RzLlBPU1QsXG4gICAgICAgICAgICBzMy5IdHRwTWV0aG9kcy5QVVQsXG4gICAgICAgICAgXSxcbiAgICAgICAgICBhbGxvd2VkT3JpZ2luczogWycqJ10sXG4gICAgICAgICAgYWxsb3dlZEhlYWRlcnM6IFsnKiddLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIENvbmZpZ3VyZSBjcm9zcy1yZWdpb24gcmVwbGljYXRpb25cbiAgICBjb25zdCByZXBsaWNhdGlvbkNvbmZpZ3VyYXRpb24gPSB7XG4gICAgICByb2xlOiBwcm9wcy5yZXBsaWNhdGlvblJvbGUucm9sZUFybixcbiAgICAgIHJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogYHJlcGxpY2F0aW9uLXJ1bGUtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgIHByZWZpeDogJycsXG4gICAgICAgICAgZGVzdGluYXRpb246IHtcbiAgICAgICAgICAgIGJ1Y2tldDogdGhpcy5yZXBsaWNhdGlvbkJ1Y2tldC5idWNrZXRBcm4sXG4gICAgICAgICAgICBzdG9yYWdlQ2xhc3M6ICdTVEFOREFSRF9JQScsXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgfTtcblxuICAgIC8vIEFkZCByZXBsaWNhdGlvbiBjb25maWd1cmF0aW9uIHRvIHByaW1hcnkgYnVja2V0XG4gICAgY29uc3QgY2ZuUHJpbWFyeUJ1Y2tldCA9IHRoaXMucHJpbWFyeUJ1Y2tldC5ub2RlXG4gICAgICAuZGVmYXVsdENoaWxkIGFzIHMzLkNmbkJ1Y2tldDtcbiAgICBjZm5QcmltYXJ5QnVja2V0LnJlcGxpY2F0aW9uQ29uZmlndXJhdGlvbiA9IHJlcGxpY2F0aW9uQ29uZmlndXJhdGlvbjtcblxuICAgIC8vIENyZWF0ZSBTMyBFeHByZXNzIE9uZSBab25lIGJ1Y2tldCBmb3IgaGlnaC1wZXJmb3JtYW5jZSB3b3JrbG9hZHMgKHByb2Qgb25seSlcbiAgICBpZiAocHJvcHMuZW5hYmxlUzNFeHByZXNzKSB7XG4gICAgICAvLyBOb3RlOiBTMyBFeHByZXNzIE9uZSBab25lIHVzZXMgZGlyZWN0b3J5IGJ1Y2tldHMgd2l0aCBkaWZmZXJlbnQgbmFtaW5nXG4gICAgICB0aGlzLmV4cHJlc3NCdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdFeHByZXNzQnVja2V0Jywge1xuICAgICAgICBidWNrZXROYW1lOiBgdGFwLWV4cHJlc3MtJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH0tLXVzZTEtYXoxLS14LXMzYCxcbiAgICAgICAgdmVyc2lvbmVkOiBmYWxzZSwgLy8gRXhwcmVzcyBPbmUgWm9uZSBkb2Vzbid0IHN1cHBvcnQgdmVyc2lvbmluZ1xuICAgICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICAgIGJsb2NrUHVibGljQWNjZXNzOiBzMy5CbG9ja1B1YmxpY0FjY2Vzcy5CTE9DS19BTEwsXG4gICAgICB9KTtcblxuICAgICAgLy8gQ29uZmlndXJlIEV4cHJlc3MgYnVja2V0IGZvciBoaWdoIHBlcmZvcm1hbmNlXG4gICAgICBjb25zdCBjZm5FeHByZXNzQnVja2V0ID0gdGhpcy5leHByZXNzQnVja2V0Lm5vZGVcbiAgICAgICAgLmRlZmF1bHRDaGlsZCBhcyBzMy5DZm5CdWNrZXQ7XG4gICAgICBjZm5FeHByZXNzQnVja2V0LmFkZFByb3BlcnR5T3ZlcnJpZGUoXG4gICAgICAgICdCdWNrZXRDb25maWd1cmF0aW9uLlR5cGUnLFxuICAgICAgICAnRGlyZWN0b3J5J1xuICAgICAgKTtcbiAgICAgIGNmbkV4cHJlc3NCdWNrZXQuYWRkUHJvcGVydHlPdmVycmlkZShcbiAgICAgICAgJ0J1Y2tldENvbmZpZ3VyYXRpb24uTG9jYXRpb24uVHlwZScsXG4gICAgICAgICdBdmFpbGFiaWxpdHlab25lJ1xuICAgICAgKTtcbiAgICAgIGNmbkV4cHJlc3NCdWNrZXQuYWRkUHJvcGVydHlPdmVycmlkZShcbiAgICAgICAgJ0J1Y2tldENvbmZpZ3VyYXRpb24uTG9jYXRpb24uTmFtZScsXG4gICAgICAgICd1c2UxLWF6MSdcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gR3JhbnQgcmVwbGljYXRpb24gcGVybWlzc2lvbnNcbiAgICB0aGlzLnJlcGxpY2F0aW9uQnVja2V0LmdyYW50UmVhZFdyaXRlKHByb3BzLnJlcGxpY2F0aW9uUm9sZSk7XG4gICAgdGhpcy5wcmltYXJ5QnVja2V0LmdyYW50UmVhZFdyaXRlKHByb3BzLnJlcGxpY2F0aW9uUm9sZSk7XG5cbiAgICAvLyBBZGQgdGFnc1xuICAgIGNvbnN0IGJ1Y2tldHMgPSBbdGhpcy5wcmltYXJ5QnVja2V0LCB0aGlzLnJlcGxpY2F0aW9uQnVja2V0XTtcbiAgICBpZiAodGhpcy5leHByZXNzQnVja2V0KSBidWNrZXRzLnB1c2godGhpcy5leHByZXNzQnVja2V0KTtcblxuICAgIGJ1Y2tldHMuZm9yRWFjaChidWNrZXQgPT4ge1xuICAgICAgYnVja2V0Lm5vZGUuYWRkTWV0YWRhdGEoJ0Vudmlyb25tZW50JywgcHJvcHMuZW52aXJvbm1lbnRTdWZmaXgpO1xuICAgICAgYnVja2V0Lm5vZGUuYWRkTWV0YWRhdGEoJ0NvbXBvbmVudCcsICdTMycpO1xuICAgIH0pO1xuICB9XG59XG4iXX0=