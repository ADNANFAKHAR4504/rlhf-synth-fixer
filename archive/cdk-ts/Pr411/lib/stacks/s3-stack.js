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
exports.S3Stack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const constructs_1 = require("constructs");
class S3Stack extends constructs_1.Construct {
    dataIngestionBucket;
    bucketName;
    constructor(scope, id, props) {
        super(scope, id);
        const { environment, isPrimary } = props;
        const region = cdk.Stack.of(this).region;
        // Create S3 bucket for data ingestion
        this.bucketName = `serverless-data-ingestion-${environment}`;
        this.dataIngestionBucket = new s3.Bucket(this, 'DataIngestionBucket', {
            bucketName: this.bucketName,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            lifecycleRules: [
                {
                    id: 'DataLifecycleRule',
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
                        {
                            storageClass: s3.StorageClass.DEEP_ARCHIVE,
                            transitionAfter: cdk.Duration.days(365),
                        },
                    ],
                    expiration: cdk.Duration.days(2555), // 7 years
                },
            ],
            cors: [
                {
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                    ],
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                    maxAge: 3000,
                },
            ],
        });
        // Add tags for cost allocation and governance
        cdk.Tags.of(this.dataIngestionBucket).add('Environment', environment);
        cdk.Tags.of(this.dataIngestionBucket).add('Service', 'DataIngestion');
        cdk.Tags.of(this.dataIngestionBucket).add('Region', region);
        cdk.Tags.of(this.dataIngestionBucket).add('IsPrimary', isPrimary.toString());
        // Create bucket policy for additional security
        const bucketPolicy = new s3.BucketPolicy(this, 'DataIngestionBucketPolicy', {
            bucket: this.dataIngestionBucket,
        });
        bucketPolicy.document.addStatements(new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['s3:*'],
            resources: [
                this.dataIngestionBucket.bucketArn,
                `${this.dataIngestionBucket.bucketArn}/*`,
            ],
            conditions: {
                Bool: {
                    'aws:SecureTransport': 'false',
                },
            },
        }), new iam.PolicyStatement({
            effect: iam.Effect.DENY,
            principals: [new iam.AnyPrincipal()],
            actions: ['s3:PutObject'],
            resources: [`${this.dataIngestionBucket.bucketArn}/*`],
            conditions: {
                StringNotEquals: {
                    's3:x-amz-server-side-encryption': 'AES256',
                },
            },
        }));
        // Output the bucket name and ARN
        new cdk.CfnOutput(this, 'DataIngestionBucketName', {
            value: this.dataIngestionBucket.bucketName,
            description: 'Name of the data ingestion S3 bucket',
            exportName: `serverless-data-ingestion-bucket-name-${region}`,
        });
        new cdk.CfnOutput(this, 'DataIngestionBucketArn', {
            value: this.dataIngestionBucket.bucketArn,
            description: 'ARN of the data ingestion S3 bucket',
            exportName: `serverless-data-ingestion-bucket-arn-${region}`,
        });
    }
}
exports.S3Stack = S3Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzMy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMseURBQTJDO0FBQzNDLHVEQUF5QztBQUN6QywyQ0FBdUM7QUFPdkMsTUFBYSxPQUFRLFNBQVEsc0JBQVM7SUFDcEIsbUJBQW1CLENBQVk7SUFDL0IsVUFBVSxDQUFTO0lBRW5DLFlBQVksS0FBZ0IsRUFBRSxFQUFVLEVBQUUsS0FBbUI7UUFDM0QsS0FBSyxDQUFDLEtBQUssRUFBRSxFQUFFLENBQUMsQ0FBQztRQUVqQixNQUFNLEVBQUUsV0FBVyxFQUFFLFNBQVMsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUN6QyxNQUFNLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFFekMsc0NBQXNDO1FBQ3RDLElBQUksQ0FBQyxVQUFVLEdBQUcsNkJBQTZCLFdBQVcsRUFBRSxDQUFDO1FBRTdELElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3BFLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxNQUFNO1lBQ3ZDLGNBQWMsRUFBRTtnQkFDZDtvQkFDRSxFQUFFLEVBQUUsbUJBQW1CO29CQUN2QixPQUFPLEVBQUUsSUFBSTtvQkFDYixXQUFXLEVBQUU7d0JBQ1g7NEJBQ0UsWUFBWSxFQUFFLEVBQUUsQ0FBQyxZQUFZLENBQUMsaUJBQWlC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UTtpQkFDNUM7YUFDRjtTQUNGLENBQUMsQ0FDSCxDQUFDO1FBRUYsaUNBQWlDO1FBQ2pDLElBQUksR0FBRyxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUseUJBQXlCLEVBQUU7WUFDakQsS0FBSyxFQUFFLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxVQUFVO1lBQzFDLFdBQVcsRUFBRSxzQ0FBc0M7WUFDbkQsVUFBVSxFQUFFLHlDQUF5QyxNQUFNLEVBQUU7U0FDOUQsQ0FBQyxDQUFDO1FBRUgsSUFBSSxHQUFHLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSx3QkFBd0IsRUFBRTtZQUNoRCxLQUFLLEVBQUUsSUFBSSxDQUFDLG1CQUFtQixDQUFDLFNBQVM7WUFDekMsV0FBVyxFQUFFLHFDQUFxQztZQUNsRCxVQUFVLEVBQUUsd0NBQXdDLE1BQU0sRUFBRTtTQUM3RCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUFqSEQsMEJBaUhDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCAqIGFzIHMzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMyc7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuaW50ZXJmYWNlIFMzU3RhY2tQcm9wcyB7XG4gIGVudmlyb25tZW50OiBzdHJpbmc7XG4gIGlzUHJpbWFyeTogYm9vbGVhbjtcbn1cblxuZXhwb3J0IGNsYXNzIFMzU3RhY2sgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YUluZ2VzdGlvbkJ1Y2tldDogczMuQnVja2V0O1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0TmFtZTogc3RyaW5nO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTM1N0YWNrUHJvcHMpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudCwgaXNQcmltYXJ5IH0gPSBwcm9wcztcbiAgICBjb25zdCByZWdpb24gPSBjZGsuU3RhY2sub2YodGhpcykucmVnaW9uO1xuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldCBmb3IgZGF0YSBpbmdlc3Rpb25cbiAgICB0aGlzLmJ1Y2tldE5hbWUgPSBgc2VydmVybGVzcy1kYXRhLWluZ2VzdGlvbi0ke2Vudmlyb25tZW50fWA7XG5cbiAgICB0aGlzLmRhdGFJbmdlc3Rpb25CdWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdEYXRhSW5nZXN0aW9uQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogdGhpcy5idWNrZXROYW1lLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIHJlbW92YWxQb2xpY3k6IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTixcbiAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBpZDogJ0RhdGFMaWZlY3ljbGVSdWxlJyxcbiAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgIHRyYW5zaXRpb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklORlJFUVVFTlRfQUNDRVNTLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLkdMQUNJRVIsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoOTApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgc3RvcmFnZUNsYXNzOiBzMy5TdG9yYWdlQ2xhc3MuREVFUF9BUkNISVZFLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgICAgZXhwaXJhdGlvbjogY2RrLkR1cmF0aW9uLmRheXMoMjU1NSksIC8vIDcgeWVhcnNcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBjb3JzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICBhbGxvd2VkTWV0aG9kczogW1xuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuR0VULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuUFVULFxuICAgICAgICAgICAgczMuSHR0cE1ldGhvZHMuUE9TVCxcbiAgICAgICAgICBdLFxuICAgICAgICAgIGFsbG93ZWRPcmlnaW5zOiBbJyonXSxcbiAgICAgICAgICBhbGxvd2VkSGVhZGVyczogWycqJ10sXG4gICAgICAgICAgbWF4QWdlOiAzMDAwLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICB9KTtcblxuICAgIC8vIEFkZCB0YWdzIGZvciBjb3N0IGFsbG9jYXRpb24gYW5kIGdvdmVybmFuY2VcbiAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFJbmdlc3Rpb25CdWNrZXQpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhSW5nZXN0aW9uQnVja2V0KS5hZGQoJ1NlcnZpY2UnLCAnRGF0YUluZ2VzdGlvbicpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZGF0YUluZ2VzdGlvbkJ1Y2tldCkuYWRkKCdSZWdpb24nLCByZWdpb24pO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZGF0YUluZ2VzdGlvbkJ1Y2tldCkuYWRkKFxuICAgICAgJ0lzUHJpbWFyeScsXG4gICAgICBpc1ByaW1hcnkudG9TdHJpbmcoKVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYnVja2V0IHBvbGljeSBmb3IgYWRkaXRpb25hbCBzZWN1cml0eVxuICAgIGNvbnN0IGJ1Y2tldFBvbGljeSA9IG5ldyBzMy5CdWNrZXRQb2xpY3koXG4gICAgICB0aGlzLFxuICAgICAgJ0RhdGFJbmdlc3Rpb25CdWNrZXRQb2xpY3knLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IHRoaXMuZGF0YUluZ2VzdGlvbkJ1Y2tldCxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgYnVja2V0UG9saWN5LmRvY3VtZW50LmFkZFN0YXRlbWVudHMoXG4gICAgICBuZXcgaWFtLlBvbGljeVN0YXRlbWVudCh7XG4gICAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5ERU5ZLFxuICAgICAgICBwcmluY2lwYWxzOiBbbmV3IGlhbS5BbnlQcmluY2lwYWwoKV0sXG4gICAgICAgIGFjdGlvbnM6IFsnczM6KiddLFxuICAgICAgICByZXNvdXJjZXM6IFtcbiAgICAgICAgICB0aGlzLmRhdGFJbmdlc3Rpb25CdWNrZXQuYnVja2V0QXJuLFxuICAgICAgICAgIGAke3RoaXMuZGF0YUluZ2VzdGlvbkJ1Y2tldC5idWNrZXRBcm59LypgLFxuICAgICAgICBdLFxuICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgQm9vbDoge1xuICAgICAgICAgICAgJ2F3czpTZWN1cmVUcmFuc3BvcnQnOiAnZmFsc2UnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KSxcbiAgICAgIG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgICAgZWZmZWN0OiBpYW0uRWZmZWN0LkRFTlksXG4gICAgICAgIHByaW5jaXBhbHM6IFtuZXcgaWFtLkFueVByaW5jaXBhbCgpXSxcbiAgICAgICAgYWN0aW9uczogWydzMzpQdXRPYmplY3QnXSxcbiAgICAgICAgcmVzb3VyY2VzOiBbYCR7dGhpcy5kYXRhSW5nZXN0aW9uQnVja2V0LmJ1Y2tldEFybn0vKmBdLFxuICAgICAgICBjb25kaXRpb25zOiB7XG4gICAgICAgICAgU3RyaW5nTm90RXF1YWxzOiB7XG4gICAgICAgICAgICAnczM6eC1hbXotc2VydmVyLXNpZGUtZW5jcnlwdGlvbic6ICdBRVMyNTYnLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBPdXRwdXQgdGhlIGJ1Y2tldCBuYW1lIGFuZCBBUk5cbiAgICBuZXcgY2RrLkNmbk91dHB1dCh0aGlzLCAnRGF0YUluZ2VzdGlvbkJ1Y2tldE5hbWUnLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kYXRhSW5nZXN0aW9uQnVja2V0LmJ1Y2tldE5hbWUsXG4gICAgICBkZXNjcmlwdGlvbjogJ05hbWUgb2YgdGhlIGRhdGEgaW5nZXN0aW9uIFMzIGJ1Y2tldCcsXG4gICAgICBleHBvcnROYW1lOiBgc2VydmVybGVzcy1kYXRhLWluZ2VzdGlvbi1idWNrZXQtbmFtZS0ke3JlZ2lvbn1gLFxuICAgIH0pO1xuXG4gICAgbmV3IGNkay5DZm5PdXRwdXQodGhpcywgJ0RhdGFJbmdlc3Rpb25CdWNrZXRBcm4nLCB7XG4gICAgICB2YWx1ZTogdGhpcy5kYXRhSW5nZXN0aW9uQnVja2V0LmJ1Y2tldEFybixcbiAgICAgIGRlc2NyaXB0aW9uOiAnQVJOIG9mIHRoZSBkYXRhIGluZ2VzdGlvbiBTMyBidWNrZXQnLFxuICAgICAgZXhwb3J0TmFtZTogYHNlcnZlcmxlc3MtZGF0YS1pbmdlc3Rpb24tYnVja2V0LWFybi0ke3JlZ2lvbn1gLFxuICAgIH0pO1xuICB9XG59XG4iXX0=