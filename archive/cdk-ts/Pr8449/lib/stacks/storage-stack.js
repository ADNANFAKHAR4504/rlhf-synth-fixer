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
exports.StorageStack = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const dynamodb = __importStar(require("aws-cdk-lib/aws-dynamodb"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const s3deploy = __importStar(require("aws-cdk-lib/aws-s3-deployment"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
class StorageStack extends cdk.NestedStack {
    imageBucket;
    detectionTable;
    notificationTopic;
    constructor(scope, id, props) {
        super(scope, id, props);
        const { environmentSuffix } = props;
        // S3 Bucket for image storage with security and lifecycle configurations
        this.imageBucket = new s3.Bucket(this, 'ImageBucket', {
            bucketName: `serverlessapp-pet-detector-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            versioned: true,
            enforceSSL: true,
            publicReadAccess: false,
            lifecycleRules: [
                {
                    id: 'DeleteIncompleteMultipartUploads',
                    abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
                },
                {
                    id: 'TransitionToIA',
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
            ],
            removalPolicy: environmentSuffix === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: environmentSuffix !== 'prod',
        });
        // Create folder structure with placeholder objects
        new s3deploy.BucketDeployment(this, 'BucketStructure', {
            sources: [
                s3deploy.Source.data('input/.keep', ''),
                s3deploy.Source.data('cats/.keep', ''),
                s3deploy.Source.data('dogs/.keep', ''),
                s3deploy.Source.data('others/.keep', ''),
            ],
            destinationBucket: this.imageBucket,
            retainOnDelete: environmentSuffix === 'prod',
        });
        // DynamoDB table for detection logs with performance and backup configurations
        this.detectionTable = new dynamodb.Table(this, 'DetectionTable', {
            tableName: `serverlessapp-detection-logs-${environmentSuffix}`,
            partitionKey: {
                name: 'ImageID',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'Timestamp',
                type: dynamodb.AttributeType.STRING,
            },
            billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption: dynamodb.TableEncryption.AWS_MANAGED,
            pointInTimeRecoverySpecification: {
                pointInTimeRecoveryEnabled: environmentSuffix === 'prod',
            },
            stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            timeToLiveAttribute: 'TTL',
            deletionProtection: environmentSuffix === 'prod',
            removalPolicy: environmentSuffix === 'prod'
                ? cdk.RemovalPolicy.RETAIN
                : cdk.RemovalPolicy.DESTROY,
        });
        // Global Secondary Index for querying by detection status
        this.detectionTable.addGlobalSecondaryIndex({
            indexName: 'ProcessingStatusIndex',
            partitionKey: {
                name: 'ProcessingStatus',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'Timestamp',
                type: dynamodb.AttributeType.STRING,
            },
        });
        // GSI for querying by detected animal type
        this.detectionTable.addGlobalSecondaryIndex({
            indexName: 'DetectedAnimalIndex',
            partitionKey: {
                name: 'DetectedAnimal',
                type: dynamodb.AttributeType.STRING,
            },
            sortKey: {
                name: 'ConfidenceScore',
                type: dynamodb.AttributeType.NUMBER,
            },
        });
        // SNS Topic for notifications with encryption
        this.notificationTopic = new sns.Topic(this, 'NotificationTopic', {
            topicName: `serverlessapp-notifications-${environmentSuffix}`,
            displayName: 'Image Detection Notifications',
            masterKey: undefined, // Use default AWS managed key
        });
        // Add resource tags for better organization and cost tracking
        cdk.Tags.of(this).add('Component', 'Storage');
        cdk.Tags.of(this).add('Environment', environmentSuffix);
        cdk.Tags.of(this).add('ManagedBy', 'CDK');
    }
}
exports.StorageStack = StorageStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInN0b3JhZ2Utc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLG1FQUFxRDtBQUNyRCx1REFBeUM7QUFDekMsd0VBQTBEO0FBQzFELHlEQUEyQztBQU8zQyxNQUFhLFlBQWEsU0FBUSxHQUFHLENBQUMsV0FBVztJQUMvQixXQUFXLENBQVk7SUFDdkIsY0FBYyxDQUFpQjtJQUMvQixpQkFBaUIsQ0FBWTtJQUU3QyxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQXdCO1FBQ2hFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxFQUFFLEtBQUssQ0FBQyxDQUFDO1FBRXhCLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUVwQyx5RUFBeUU7UUFDekUsSUFBSSxDQUFDLFdBQVcsR0FBRyxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGFBQWEsRUFBRTtZQUNwRCxVQUFVLEVBQUUsOEJBQThCLGlCQUFpQixJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxFQUFFO1lBQ25GLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxJQUFJO1lBQ2hCLGdCQUFnQixFQUFFLEtBQUs7WUFDdkIsY0FBYyxFQUFFO2dCQUNkO29CQUNFLEVBQUUsRUFBRSxrQ0FBa0M7b0JBQ3RDLG1DQUFtQyxFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQztpQkFDMUQ7Z0JBQ0Q7b0JBQ0UsRUFBRSxFQUFFLGdCQUFnQjtvQkFDcEIsV0FBVyxFQUFFO3dCQUNYOzRCQUNFLFlB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O2dCQUNaLElBQUksRUFBRSxnQkFBZ0I7Z0JBQ3RCLElBQUksRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLE1BQU07YUFDcEM7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLGlCQUFpQjtnQkFDdkIsSUFBSSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsTUFBTTthQUNwQztTQUNGLENBQUMsQ0FBQztRQUVILDhDQUE4QztRQUM5QyxJQUFJLENBQUMsaUJBQWlCLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxtQkFBbUIsRUFBRTtZQUNoRSxTQUFTLEVBQUUsK0JBQStCLGlCQUFpQixFQUFFO1lBQzdELFdBQVcsRUFBRSwrQkFBK0I7WUFDNUMsU0FBUyxFQUFFLFNBQVMsRUFBRSw4QkFBOEI7U0FDckQsQ0FBQyxDQUFDO1FBRUgsOERBQThEO1FBQzlELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDLENBQUM7UUFDOUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQ3hELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEVBQUUsS0FBSyxDQUFDLENBQUM7SUFDNUMsQ0FBQztDQUNGO0FBdkhELG9DQXVIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgKiBhcyBkeW5hbW9kYiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZHluYW1vZGInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIHMzZGVwbG95IGZyb20gJ2F3cy1jZGstbGliL2F3cy1zMy1kZXBsb3ltZW50JztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5leHBvcnQgaW50ZXJmYWNlIFN0b3JhZ2VTdGFja1Byb3BzIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrUHJvcHMge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgU3RvcmFnZVN0YWNrIGV4dGVuZHMgY2RrLk5lc3RlZFN0YWNrIHtcbiAgcHVibGljIHJlYWRvbmx5IGltYWdlQnVja2V0OiBzMy5CdWNrZXQ7XG4gIHB1YmxpYyByZWFkb25seSBkZXRlY3Rpb25UYWJsZTogZHluYW1vZGIuVGFibGU7XG4gIHB1YmxpYyByZWFkb25seSBub3RpZmljYXRpb25Ub3BpYzogc25zLlRvcGljO1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBTdG9yYWdlU3RhY2tQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCwgcHJvcHMpO1xuXG4gICAgY29uc3QgeyBlbnZpcm9ubWVudFN1ZmZpeCB9ID0gcHJvcHM7XG5cbiAgICAvLyBTMyBCdWNrZXQgZm9yIGltYWdlIHN0b3JhZ2Ugd2l0aCBzZWN1cml0eSBhbmQgbGlmZWN5Y2xlIGNvbmZpZ3VyYXRpb25zXG4gICAgdGhpcy5pbWFnZUJ1Y2tldCA9IG5ldyBzMy5CdWNrZXQodGhpcywgJ0ltYWdlQnVja2V0Jywge1xuICAgICAgYnVja2V0TmFtZTogYHNlcnZlcmxlc3NhcHAtcGV0LWRldGVjdG9yLSR7ZW52aXJvbm1lbnRTdWZmaXh9LSR7Y2RrLkF3cy5BQ0NPVU5UX0lEfWAsXG4gICAgICBlbmNyeXB0aW9uOiBzMy5CdWNrZXRFbmNyeXB0aW9uLlMzX01BTkFHRUQsXG4gICAgICBibG9ja1B1YmxpY0FjY2VzczogczMuQmxvY2tQdWJsaWNBY2Nlc3MuQkxPQ0tfQUxMLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgZW5mb3JjZVNTTDogdHJ1ZSxcbiAgICAgIHB1YmxpY1JlYWRBY2Nlc3M6IGZhbHNlLFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnRGVsZXRlSW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZHMnLFxuICAgICAgICAgIGFib3J0SW5jb21wbGV0ZU11bHRpcGFydFVwbG9hZEFmdGVyOiBjZGsuRHVyYXRpb24uZGF5cygxKSxcbiAgICAgICAgfSxcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnVHJhbnNpdGlvblRvSUEnLFxuICAgICAgICAgIHRyYW5zaXRpb25zOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLklORlJFUVVFTlRfQUNDRVNTLFxuICAgICAgICAgICAgICB0cmFuc2l0aW9uQWZ0ZXI6IGNkay5EdXJhdGlvbi5kYXlzKDMwKSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogczMuU3RvcmFnZUNsYXNzLkdMQUNJRVIsXG4gICAgICAgICAgICAgIHRyYW5zaXRpb25BZnRlcjogY2RrLkR1cmF0aW9uLmRheXMoOTApLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgICAgXSxcbiAgICAgIHJlbW92YWxQb2xpY3k6XG4gICAgICAgIGVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCdcbiAgICAgICAgICA/IGNkay5SZW1vdmFsUG9saWN5LlJFVEFJTlxuICAgICAgICAgIDogY2RrLlJlbW92YWxQb2xpY3kuREVTVFJPWSxcbiAgICAgIGF1dG9EZWxldGVPYmplY3RzOiBlbnZpcm9ubWVudFN1ZmZpeCAhPT0gJ3Byb2QnLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGZvbGRlciBzdHJ1Y3R1cmUgd2l0aCBwbGFjZWhvbGRlciBvYmplY3RzXG4gICAgbmV3IHMzZGVwbG95LkJ1Y2tldERlcGxveW1lbnQodGhpcywgJ0J1Y2tldFN0cnVjdHVyZScsIHtcbiAgICAgIHNvdXJjZXM6IFtcbiAgICAgICAgczNkZXBsb3kuU291cmNlLmRhdGEoJ2lucHV0Ly5rZWVwJywgJycpLFxuICAgICAgICBzM2RlcGxveS5Tb3VyY2UuZGF0YSgnY2F0cy8ua2VlcCcsICcnKSxcbiAgICAgICAgczNkZXBsb3kuU291cmNlLmRhdGEoJ2RvZ3MvLmtlZXAnLCAnJyksXG4gICAgICAgIHMzZGVwbG95LlNvdXJjZS5kYXRhKCdvdGhlcnMvLmtlZXAnLCAnJyksXG4gICAgICBdLFxuICAgICAgZGVzdGluYXRpb25CdWNrZXQ6IHRoaXMuaW1hZ2VCdWNrZXQsXG4gICAgICByZXRhaW5PbkRlbGV0ZTogZW52aXJvbm1lbnRTdWZmaXggPT09ICdwcm9kJyxcbiAgICB9KTtcblxuICAgIC8vIER5bmFtb0RCIHRhYmxlIGZvciBkZXRlY3Rpb24gbG9ncyB3aXRoIHBlcmZvcm1hbmNlIGFuZCBiYWNrdXAgY29uZmlndXJhdGlvbnNcbiAgICB0aGlzLmRldGVjdGlvblRhYmxlID0gbmV3IGR5bmFtb2RiLlRhYmxlKHRoaXMsICdEZXRlY3Rpb25UYWJsZScsIHtcbiAgICAgIHRhYmxlTmFtZTogYHNlcnZlcmxlc3NhcHAtZGV0ZWN0aW9uLWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdJbWFnZUlEJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAnVGltZXN0YW1wJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgYmlsbGluZ01vZGU6IGR5bmFtb2RiLkJpbGxpbmdNb2RlLlBBWV9QRVJfUkVRVUVTVCxcbiAgICAgIGVuY3J5cHRpb246IGR5bmFtb2RiLlRhYmxlRW5jcnlwdGlvbi5BV1NfTUFOQUdFRCxcbiAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlTcGVjaWZpY2F0aW9uOiB7XG4gICAgICAgIHBvaW50SW5UaW1lUmVjb3ZlcnlFbmFibGVkOiBlbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnLFxuICAgICAgfSxcbiAgICAgIHN0cmVhbTogZHluYW1vZGIuU3RyZWFtVmlld1R5cGUuTkVXX0FORF9PTERfSU1BR0VTLFxuICAgICAgdGltZVRvTGl2ZUF0dHJpYnV0ZTogJ1RUTCcsXG4gICAgICBkZWxldGlvblByb3RlY3Rpb246IGVudmlyb25tZW50U3VmZml4ID09PSAncHJvZCcsXG4gICAgICByZW1vdmFsUG9saWN5OlxuICAgICAgICBlbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnXG4gICAgICAgICAgPyBjZGsuUmVtb3ZhbFBvbGljeS5SRVRBSU5cbiAgICAgICAgICA6IGNkay5SZW1vdmFsUG9saWN5LkRFU1RST1ksXG4gICAgfSk7XG5cbiAgICAvLyBHbG9iYWwgU2Vjb25kYXJ5IEluZGV4IGZvciBxdWVyeWluZyBieSBkZXRlY3Rpb24gc3RhdHVzXG4gICAgdGhpcy5kZXRlY3Rpb25UYWJsZS5hZGRHbG9iYWxTZWNvbmRhcnlJbmRleCh7XG4gICAgICBpbmRleE5hbWU6ICdQcm9jZXNzaW5nU3RhdHVzSW5kZXgnLFxuICAgICAgcGFydGl0aW9uS2V5OiB7XG4gICAgICAgIG5hbWU6ICdQcm9jZXNzaW5nU3RhdHVzJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAnVGltZXN0YW1wJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gR1NJIGZvciBxdWVyeWluZyBieSBkZXRlY3RlZCBhbmltYWwgdHlwZVxuICAgIHRoaXMuZGV0ZWN0aW9uVGFibGUuYWRkR2xvYmFsU2Vjb25kYXJ5SW5kZXgoe1xuICAgICAgaW5kZXhOYW1lOiAnRGV0ZWN0ZWRBbmltYWxJbmRleCcsXG4gICAgICBwYXJ0aXRpb25LZXk6IHtcbiAgICAgICAgbmFtZTogJ0RldGVjdGVkQW5pbWFsJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5TVFJJTkcsXG4gICAgICB9LFxuICAgICAgc29ydEtleToge1xuICAgICAgICBuYW1lOiAnQ29uZmlkZW5jZVNjb3JlJyxcbiAgICAgICAgdHlwZTogZHluYW1vZGIuQXR0cmlidXRlVHlwZS5OVU1CRVIsXG4gICAgICB9LFxuICAgIH0pO1xuXG4gICAgLy8gU05TIFRvcGljIGZvciBub3RpZmljYXRpb25zIHdpdGggZW5jcnlwdGlvblxuICAgIHRoaXMubm90aWZpY2F0aW9uVG9waWMgPSBuZXcgc25zLlRvcGljKHRoaXMsICdOb3RpZmljYXRpb25Ub3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogYHNlcnZlcmxlc3NhcHAtbm90aWZpY2F0aW9ucy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBkaXNwbGF5TmFtZTogJ0ltYWdlIERldGVjdGlvbiBOb3RpZmljYXRpb25zJyxcbiAgICAgIG1hc3RlcktleTogdW5kZWZpbmVkLCAvLyBVc2UgZGVmYXVsdCBBV1MgbWFuYWdlZCBrZXlcbiAgICB9KTtcblxuICAgIC8vIEFkZCByZXNvdXJjZSB0YWdzIGZvciBiZXR0ZXIgb3JnYW5pemF0aW9uIGFuZCBjb3N0IHRyYWNraW5nXG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdDb21wb25lbnQnLCAnU3RvcmFnZScpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMpLmFkZCgnRW52aXJvbm1lbnQnLCBlbnZpcm9ubWVudFN1ZmZpeCk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcykuYWRkKCdNYW5hZ2VkQnknLCAnQ0RLJyk7XG4gIH1cbn1cbiJdfQ==