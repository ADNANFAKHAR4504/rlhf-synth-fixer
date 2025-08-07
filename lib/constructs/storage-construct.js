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
exports.StorageConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const s3 = __importStar(require("aws-cdk-lib/aws-s3"));
const iam = __importStar(require("aws-cdk-lib/aws-iam"));
const constructs_1 = require("constructs");
class StorageConstruct extends constructs_1.Construct {
    bucket;
    constructor(scope, id, props) {
        super(scope, id);
        const { environmentSuffix, region, allowedPrincipals } = props;
        // Create S3 bucket with versioning and encryption
        this.bucket = new s3.Bucket(this, 'DevBucket', {
            bucketName: `multiregion-dev-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            enforceSSL: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow deletion for testing
            autoDeleteObjects: true, // Automatically delete objects when bucket is deleted
            lifecycleRules: [
                {
                    id: 'DeleteOldVersions',
                    expiration: cdk.Duration.days(365),
                    noncurrentVersionExpiration: cdk.Duration.days(30),
                    enabled: true,
                },
            ],
            publicReadAccess: false,
        });
        // Create bucket policy to restrict access to EC2 instances only
        const allowAccessStatement = new iam.PolicyStatement({
            sid: 'AllowEC2Access',
            effect: iam.Effect.ALLOW,
            principals: allowedPrincipals.map(arn => iam.Role.fromRoleArn(this, `Role-${arn.split('/').pop()}`, arn)),
            actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
                's3:GetObjectVersion',
            ],
            resources: [this.bucket.bucketArn, `${this.bucket.bucketArn}/*`],
        });
        this.bucket.addToResourcePolicy(allowAccessStatement);
        // Enable S3 Metadata for comprehensive object visibility
        const metadataBucket = new s3.CfnBucket(this, 'BucketMetadata', {
            bucketName: `${this.bucket.bucketName}-metadata`,
            versioningConfiguration: {
                status: 'Enabled',
            },
        });
        // Apply deletion policy
        metadataBucket.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        // Tag storage resources
        cdk.Tags.of(this.bucket).add('Name', `dev-bucket-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.bucket).add('Purpose', 'DevStorage');
        cdk.Tags.of(this.bucket).add('Environment', environmentSuffix);
        cdk.Tags.of(this.bucket).add('Region', region);
        cdk.Tags.of(this.bucket).add('Versioning', 'Enabled');
        cdk.Tags.of(this.bucket).add('Encryption', 'S3Managed');
    }
}
exports.StorageConstruct = StorageConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoic3RvcmFnZS1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzdG9yYWdlLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLHlEQUEyQztBQUMzQywyQ0FBdUM7QUFRdkMsTUFBYSxnQkFBaUIsU0FBUSxzQkFBUztJQUM3QixNQUFNLENBQVk7SUFFbEMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE0QjtRQUNwRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsaUJBQWlCLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFL0Qsa0RBQWtEO1FBQ2xELElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLElBQUksRUFBRSxXQUFXLEVBQUU7WUFDN0MsVUFBVSxFQUFFLDBCQUEwQixpQkFBaUIsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFVBQVUsRUFBRTtZQUMvRSxTQUFTLEVBQUUsSUFBSTtZQUNmLFVBQVUsRUFBRSxFQUFFLENBQUMsZ0JBQWdCLENBQUMsVUFBVTtZQUMxQyxpQkFBaUIsRUFBRSxFQUFFLENBQUMsaUJBQWlCLENBQUMsU0FBUztZQUNqRCxVQUFVLEVBQUUsSUFBSTtZQUNoQixhQUFhLEVBQUUsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLEVBQUUsNkJBQTZCO1lBQ3ZFLGlCQUFpQixFQUFFLElBQUksRUFBRSxzREFBc0Q7WUFDL0UsY0FBYyxFQUFFO2dCQUNkO29CQUNFLEVBQUUsRUFBRSxtQkFBbUI7b0JBQ3ZCLFVBQVUsRUFBRSxHQUFHLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUM7b0JBQ2xDLDJCQUEyQixFQUFFLEdBQUcsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztvQkFDbEQsT0FBTyxFQUFFLElBQUk7aUJBQ2Q7YUFDRjtZQUNELGdCQUFnQixFQUFFLEtBQUs7U0FDeEIsQ0FBQyxDQUFDO1FBRUgsZ0VBQWdFO1FBQ2hFLE1BQU0sb0JBQW9CLEdBQUcsSUFBSSxHQUFHLENBQUMsZUFBZSxDQUFDO1lBQ25ELEdBQUcsRUFBRSxnQkFBZ0I7WUFDckIsTUFBTSxFQUFFLEdBQUcsQ0FBQyxNQUFNLENBQUMsS0FBSztZQUN4QixVQUFVLEVBQUUsaUJBQWlCLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQ3RDLEdBQUcsQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxRQUFRLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FDaEU7WUFDRCxPQUFPLEVBQUU7Z0JBQ1AsY0FBYztnQkFDZCxjQUFjO2dCQUNkLGlCQUFpQjtnQkFDakIsZUFBZTtnQkFDZixxQkFBcUI7YUFDdEI7WUFDRCxTQUFTLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFNBQVMsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsU0FBUyxJQUFJLENBQUM7U0FDakUsQ0FBQyxDQUFDO1FBRUgsSUFBSSxDQUFDLE1BQU0sQ0FBQyxtQkFBbUIsQ0FBQyxvQkFBb0IsQ0FBQyxDQUFDO1FBRXRELHlEQUF5RDtRQUN6RCxNQUFNLGNBQWMsR0FBRyxJQUFJLEVBQUUsQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzlELFVBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxNQUFNLENBQUMsVUFBVSxXQUFXO1lBQ2hELHVCQUF1QixFQUFFO2dCQUN2QixNQUFNLEVBQUUsU0FBUzthQUNsQjtTQUNGLENBQUMsQ0FBQztRQUVILHdCQUF3QjtRQUN4QixjQUFjLENBQUMsa0JBQWtCLENBQUMsR0FBRyxDQUFDLGFBQWEsQ0FBQyxPQUFPLENBQUMsQ0FBQztRQUU3RCx3QkFBd0I7UUFDeEIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FDMUIsTUFBTSxFQUNOLGNBQWMsaUJBQWlCLElBQUksTUFBTSxFQUFFLENBQzVDLENBQUM7UUFDRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLFNBQVMsRUFBRSxZQUFZLENBQUMsQ0FBQztRQUN0RCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxDQUFDLGFBQWEsRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO1FBQy9ELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsUUFBUSxFQUFFLE1BQU0sQ0FBQyxDQUFDO1FBQy9DLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1FBQ3RELEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsWUFBWSxFQUFFLFdBQVcsQ0FBQyxDQUFDO0lBQzFELENBQUM7Q0FDRjtBQXJFRCw0Q0FxRUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBjZGsgZnJvbSAnYXdzLWNkay1saWInO1xuaW1wb3J0ICogYXMgczMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXMzJztcbmltcG9ydCAqIGFzIGlhbSBmcm9tICdhd3MtY2RrLWxpYi9hd3MtaWFtJztcbmltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuXG5pbnRlcmZhY2UgU3RvcmFnZUNvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgcmVnaW9uOiBzdHJpbmc7XG4gIGFsbG93ZWRQcmluY2lwYWxzOiBzdHJpbmdbXTtcbn1cblxuZXhwb3J0IGNsYXNzIFN0b3JhZ2VDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0OiBzMy5CdWNrZXQ7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IFN0b3JhZ2VDb25zdHJ1Y3RQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICBjb25zdCB7IGVudmlyb25tZW50U3VmZml4LCByZWdpb24sIGFsbG93ZWRQcmluY2lwYWxzIH0gPSBwcm9wcztcblxuICAgIC8vIENyZWF0ZSBTMyBidWNrZXQgd2l0aCB2ZXJzaW9uaW5nIGFuZCBlbmNyeXB0aW9uXG4gICAgdGhpcy5idWNrZXQgPSBuZXcgczMuQnVja2V0KHRoaXMsICdEZXZCdWNrZXQnLCB7XG4gICAgICBidWNrZXROYW1lOiBgbXVsdGlyZWdpb24tZGV2LWJ1Y2tldC0ke2Vudmlyb25tZW50U3VmZml4fS0ke2Nkay5Bd3MuQUNDT1VOVF9JRH1gLFxuICAgICAgdmVyc2lvbmVkOiB0cnVlLFxuICAgICAgZW5jcnlwdGlvbjogczMuQnVja2V0RW5jcnlwdGlvbi5TM19NQU5BR0VELFxuICAgICAgYmxvY2tQdWJsaWNBY2Nlc3M6IHMzLkJsb2NrUHVibGljQWNjZXNzLkJMT0NLX0FMTCxcbiAgICAgIGVuZm9yY2VTU0w6IHRydWUsXG4gICAgICByZW1vdmFsUG9saWN5OiBjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZLCAvLyBBbGxvdyBkZWxldGlvbiBmb3IgdGVzdGluZ1xuICAgICAgYXV0b0RlbGV0ZU9iamVjdHM6IHRydWUsIC8vIEF1dG9tYXRpY2FsbHkgZGVsZXRlIG9iamVjdHMgd2hlbiBidWNrZXQgaXMgZGVsZXRlZFxuICAgICAgbGlmZWN5Y2xlUnVsZXM6IFtcbiAgICAgICAge1xuICAgICAgICAgIGlkOiAnRGVsZXRlT2xkVmVyc2lvbnMnLFxuICAgICAgICAgIGV4cGlyYXRpb246IGNkay5EdXJhdGlvbi5kYXlzKDM2NSksXG4gICAgICAgICAgbm9uY3VycmVudFZlcnNpb25FeHBpcmF0aW9uOiBjZGsuRHVyYXRpb24uZGF5cygzMCksXG4gICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgfSxcbiAgICAgIF0sXG4gICAgICBwdWJsaWNSZWFkQWNjZXNzOiBmYWxzZSxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBidWNrZXQgcG9saWN5IHRvIHJlc3RyaWN0IGFjY2VzcyB0byBFQzIgaW5zdGFuY2VzIG9ubHlcbiAgICBjb25zdCBhbGxvd0FjY2Vzc1N0YXRlbWVudCA9IG5ldyBpYW0uUG9saWN5U3RhdGVtZW50KHtcbiAgICAgIHNpZDogJ0FsbG93RUMyQWNjZXNzJyxcbiAgICAgIGVmZmVjdDogaWFtLkVmZmVjdC5BTExPVyxcbiAgICAgIHByaW5jaXBhbHM6IGFsbG93ZWRQcmluY2lwYWxzLm1hcChhcm4gPT5cbiAgICAgICAgaWFtLlJvbGUuZnJvbVJvbGVBcm4odGhpcywgYFJvbGUtJHthcm4uc3BsaXQoJy8nKS5wb3AoKX1gLCBhcm4pXG4gICAgICApLFxuICAgICAgYWN0aW9uczogW1xuICAgICAgICAnczM6R2V0T2JqZWN0JyxcbiAgICAgICAgJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICdzMzpEZWxldGVPYmplY3QnLFxuICAgICAgICAnczM6TGlzdEJ1Y2tldCcsXG4gICAgICAgICdzMzpHZXRPYmplY3RWZXJzaW9uJyxcbiAgICAgIF0sXG4gICAgICByZXNvdXJjZXM6IFt0aGlzLmJ1Y2tldC5idWNrZXRBcm4sIGAke3RoaXMuYnVja2V0LmJ1Y2tldEFybn0vKmBdLFxuICAgIH0pO1xuXG4gICAgdGhpcy5idWNrZXQuYWRkVG9SZXNvdXJjZVBvbGljeShhbGxvd0FjY2Vzc1N0YXRlbWVudCk7XG5cbiAgICAvLyBFbmFibGUgUzMgTWV0YWRhdGEgZm9yIGNvbXByZWhlbnNpdmUgb2JqZWN0IHZpc2liaWxpdHlcbiAgICBjb25zdCBtZXRhZGF0YUJ1Y2tldCA9IG5ldyBzMy5DZm5CdWNrZXQodGhpcywgJ0J1Y2tldE1ldGFkYXRhJywge1xuICAgICAgYnVja2V0TmFtZTogYCR7dGhpcy5idWNrZXQuYnVja2V0TmFtZX0tbWV0YWRhdGFgLFxuICAgICAgdmVyc2lvbmluZ0NvbmZpZ3VyYXRpb246IHtcbiAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICB9LFxuICAgIH0pO1xuICAgIFxuICAgIC8vIEFwcGx5IGRlbGV0aW9uIHBvbGljeVxuICAgIG1ldGFkYXRhQnVja2V0LmFwcGx5UmVtb3ZhbFBvbGljeShjZGsuUmVtb3ZhbFBvbGljeS5ERVNUUk9ZKTtcblxuICAgIC8vIFRhZyBzdG9yYWdlIHJlc291cmNlc1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYnVja2V0KS5hZGQoXG4gICAgICAnTmFtZScsXG4gICAgICBgZGV2LWJ1Y2tldC0ke2Vudmlyb25tZW50U3VmZml4fS0ke3JlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmJ1Y2tldCkuYWRkKCdQdXJwb3NlJywgJ0RldlN0b3JhZ2UnKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmJ1Y2tldCkuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50U3VmZml4KTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmJ1Y2tldCkuYWRkKCdSZWdpb24nLCByZWdpb24pO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYnVja2V0KS5hZGQoJ1ZlcnNpb25pbmcnLCAnRW5hYmxlZCcpO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuYnVja2V0KS5hZGQoJ0VuY3J5cHRpb24nLCAnUzNNYW5hZ2VkJyk7XG4gIH1cbn1cbiJdfQ==