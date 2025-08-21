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
/**
 * s3-stack.ts
 *
 * This module defines the S3 stack for creating secure S3 buckets
 * with encryption, versioning, and lifecycle policies.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class S3Stack extends pulumi.ComponentResource {
    dataBucketName;
    dataBucketArn;
    logsBucketName;
    logsBucketArn;
    constructor(name, args, opts) {
        super('tap:s3:S3Stack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // Data bucket
        const dataBucket = new aws.s3.Bucket(`tap-data-bucket-${environmentSuffix}`, {
            tags: {
                Name: `tap-data-bucket-${environmentSuffix}`,
                Purpose: 'DataStorage',
                ...tags,
            },
        }, { parent: this });
        // Block all public access for data bucket
        new aws.s3.BucketPublicAccessBlock(`tap-data-bucket-pab-${environmentSuffix}`, {
            bucket: dataBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Server-side encryption for data bucket
        new aws.s3.BucketServerSideEncryptionConfiguration(`tap-data-bucket-encryption-${environmentSuffix}`, {
            bucket: dataBucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'aws:kms',
                        kmsMasterKeyId: args.mainKmsKeyArn,
                    },
                    bucketKeyEnabled: true,
                },
            ],
        }, { parent: this });
        // Versioning for data bucket
        new aws.s3.BucketVersioning(`tap-data-bucket-versioning-${environmentSuffix}`, {
            bucket: dataBucket.id,
            versioningConfiguration: {
                status: 'Enabled',
            },
        }, { parent: this });
        // Lifecycle configuration for data bucket
        new aws.s3.BucketLifecycleConfiguration(`tap-data-bucket-lifecycle-${environmentSuffix}`, {
            bucket: dataBucket.id,
            rules: [
                {
                    id: 'transition-to-ia',
                    status: 'Enabled',
                    transitions: [
                        {
                            days: 30,
                            storageClass: 'STANDARD_IA',
                        },
                    ],
                },
            ],
        }, { parent: this });
        // Logs bucket
        const logsBucket = new aws.s3.Bucket(`tap-logs-bucket-${environmentSuffix}`, {
            tags: {
                Name: `tap-logs-bucket-${environmentSuffix}`,
                Purpose: 'LogStorage',
                ...tags,
            },
        }, { parent: this });
        // Block all public access for logs bucket
        new aws.s3.BucketPublicAccessBlock(`tap-logs-bucket-pab-${environmentSuffix}`, {
            bucket: logsBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Server-side encryption for logs bucket
        new aws.s3.BucketServerSideEncryptionConfiguration(`tap-logs-bucket-encryption-${environmentSuffix}`, {
            bucket: logsBucket.id,
            rules: [
                {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'aws:kms',
                        kmsMasterKeyId: args.mainKmsKeyArn,
                    },
                    bucketKeyEnabled: true,
                },
            ],
        }, { parent: this });
        // Versioning for logs bucket
        new aws.s3.BucketVersioning(`tap-logs-bucket-versioning-${environmentSuffix}`, {
            bucket: logsBucket.id,
            versioningConfiguration: {
                status: 'Enabled',
            },
        }, { parent: this });
        // Lifecycle configuration for logs bucket
        new aws.s3.BucketLifecycleConfiguration(`tap-logs-bucket-lifecycle-${environmentSuffix}`, {
            bucket: logsBucket.id,
            rules: [
                {
                    id: 'delete-old-logs',
                    status: 'Enabled',
                    expiration: {
                        days: 90,
                    },
                },
            ],
        }, { parent: this });
        // Logging configuration for data bucket (logs go to logs bucket)
        new aws.s3.BucketLogging(`tap-data-bucket-logging-${environmentSuffix}`, {
            bucket: dataBucket.id,
            targetBucket: logsBucket.id,
            targetPrefix: 'data-bucket-access-logs/',
        }, { parent: this });
        this.dataBucketName = dataBucket.id;
        this.dataBucketArn = dataBucket.arn;
        this.logsBucketName = logsBucket.id;
        this.logsBucketArn = logsBucket.arn;
        this.registerOutputs({
            dataBucketName: this.dataBucketName,
            dataBucketArn: this.dataBucketArn,
            logsBucketName: this.logsBucketName,
            logsBucketArn: this.logsBucketArn,
        });
    }
}
exports.S3Stack = S3Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJzMy1zdGFjay50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQTs7Ozs7R0FLRztBQUNILGlEQUFtQztBQUNuQyx1REFBeUM7QUFTekMsTUFBYSxPQUFRLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNuQyxjQUFjLENBQXdCO0lBQ3RDLGFBQWEsQ0FBd0I7SUFDckMsY0FBYyxDQUF3QjtJQUN0QyxhQUFhLENBQXdCO0lBRXJELFlBQVksSUFBWSxFQUFFLElBQWlCLEVBQUUsSUFBc0I7UUFDakUsS0FBSyxDQUFDLGdCQUFnQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFMUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLGNBQWM7UUFDZCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUNsQyxtQkFBbUIsaUJBQWlCLEVBQUUsRUFDdEM7WUFDRSxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLG1CQUFtQixpQkFBaUIsRUFBRTtnQkFDNUMsT0FBTyxFQUFFLGFBQWE7Z0JBQ3RCLEdBQUcsSUFBSTthQUNSO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDBDQUEwQztRQUMxQyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQ2hDLHVCQUF1QixpQkFBaUIsRUFBRSxFQUMxQztZQUNFLE1BQU0sRUFBRSxVQUFVLENBQUMsRUFBRTtZQUNyQixlQUFlLEVBQUUsSUFBSTtZQUNyQixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGdCQUFnQixFQUFFLElBQUk7WUFD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QUNGO0FBMUxELDBCQTBMQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogczMtc3RhY2sudHNcbiAqXG4gKiBUaGlzIG1vZHVsZSBkZWZpbmVzIHRoZSBTMyBzdGFjayBmb3IgY3JlYXRpbmcgc2VjdXJlIFMzIGJ1Y2tldHNcbiAqIHdpdGggZW5jcnlwdGlvbiwgdmVyc2lvbmluZywgYW5kIGxpZmVjeWNsZSBwb2xpY2llcy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUzNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAgbWFpbkttc0tleUFybjogcHVsdW1pLklucHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBTM1N0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFCdWNrZXROYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYXRhQnVja2V0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBsb2dzQnVja2V0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbG9nc0J1Y2tldEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogUzNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnMzOlMzU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gRGF0YSBidWNrZXRcbiAgICBjb25zdCBkYXRhQnVja2V0ID0gbmV3IGF3cy5zMy5CdWNrZXQoXG4gICAgICBgdGFwLWRhdGEtYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGF0YS1idWNrZXQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdEYXRhU3RvcmFnZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEJsb2NrIGFsbCBwdWJsaWMgYWNjZXNzIGZvciBkYXRhIGJ1Y2tldFxuICAgIG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICBgdGFwLWRhdGEtYnVja2V0LXBhYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogZGF0YUJ1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gU2VydmVyLXNpZGUgZW5jcnlwdGlvbiBmb3IgZGF0YSBidWNrZXRcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihcbiAgICAgIGB0YXAtZGF0YS1idWNrZXQtZW5jcnlwdGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogZGF0YUJ1Y2tldC5pZCxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ2F3czprbXMnLFxuICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogYXJncy5tYWluS21zS2V5QXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFZlcnNpb25pbmcgZm9yIGRhdGEgYnVja2V0XG4gICAgbmV3IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nKFxuICAgICAgYHRhcC1kYXRhLWJ1Y2tldC12ZXJzaW9uaW5nLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBkYXRhQnVja2V0LmlkLFxuICAgICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTGlmZWN5Y2xlIGNvbmZpZ3VyYXRpb24gZm9yIGRhdGEgYnVja2V0XG4gICAgbmV3IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKFxuICAgICAgYHRhcC1kYXRhLWJ1Y2tldC1saWZlY3ljbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGRhdGFCdWNrZXQuaWQsXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICd0cmFuc2l0aW9uLXRvLWlhJyxcbiAgICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ1NUQU5EQVJEX0lBJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIExvZ3MgYnVja2V0XG4gICAgY29uc3QgbG9nc0J1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYHRhcC1sb2dzLWJ1Y2tldC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWxvZ3MtYnVja2V0LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnTG9nU3RvcmFnZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEJsb2NrIGFsbCBwdWJsaWMgYWNjZXNzIGZvciBsb2dzIGJ1Y2tldFxuICAgIG5ldyBhd3MuczMuQnVja2V0UHVibGljQWNjZXNzQmxvY2soXG4gICAgICBgdGFwLWxvZ3MtYnVja2V0LXBhYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcbiAgICAgICAgYmxvY2tQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICBibG9ja1B1YmxpY1BvbGljeTogdHJ1ZSxcbiAgICAgICAgaWdub3JlUHVibGljQWNsczogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RQdWJsaWNCdWNrZXRzOiB0cnVlLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gU2VydmVyLXNpZGUgZW5jcnlwdGlvbiBmb3IgbG9ncyBidWNrZXRcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldFNlcnZlclNpZGVFbmNyeXB0aW9uQ29uZmlndXJhdGlvbihcbiAgICAgIGB0YXAtbG9ncy1idWNrZXQtZW5jcnlwdGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcbiAgICAgICAgcnVsZXM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBhcHBseVNlcnZlclNpZGVFbmNyeXB0aW9uQnlEZWZhdWx0OiB7XG4gICAgICAgICAgICAgIHNzZUFsZ29yaXRobTogJ2F3czprbXMnLFxuICAgICAgICAgICAgICBrbXNNYXN0ZXJLZXlJZDogYXJncy5tYWluS21zS2V5QXJuLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGJ1Y2tldEtleUVuYWJsZWQ6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFZlcnNpb25pbmcgZm9yIGxvZ3MgYnVja2V0XG4gICAgbmV3IGF3cy5zMy5CdWNrZXRWZXJzaW9uaW5nKFxuICAgICAgYHRhcC1sb2dzLWJ1Y2tldC12ZXJzaW9uaW5nLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYnVja2V0OiBsb2dzQnVja2V0LmlkLFxuICAgICAgICB2ZXJzaW9uaW5nQ29uZmlndXJhdGlvbjoge1xuICAgICAgICAgIHN0YXR1czogJ0VuYWJsZWQnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTGlmZWN5Y2xlIGNvbmZpZ3VyYXRpb24gZm9yIGxvZ3MgYnVja2V0XG4gICAgbmV3IGF3cy5zMy5CdWNrZXRMaWZlY3ljbGVDb25maWd1cmF0aW9uKFxuICAgICAgYHRhcC1sb2dzLWJ1Y2tldC1saWZlY3ljbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGxvZ3NCdWNrZXQuaWQsXG4gICAgICAgIHJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgaWQ6ICdkZWxldGUtb2xkLWxvZ3MnLFxuICAgICAgICAgICAgc3RhdHVzOiAnRW5hYmxlZCcsXG4gICAgICAgICAgICBleHBpcmF0aW9uOiB7XG4gICAgICAgICAgICAgIGRheXM6IDkwLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gTG9nZ2luZyBjb25maWd1cmF0aW9uIGZvciBkYXRhIGJ1Y2tldCAobG9ncyBnbyB0byBsb2dzIGJ1Y2tldClcbiAgICBuZXcgYXdzLnMzLkJ1Y2tldExvZ2dpbmcoXG4gICAgICBgdGFwLWRhdGEtYnVja2V0LWxvZ2dpbmctJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGRhdGFCdWNrZXQuaWQsXG4gICAgICAgIHRhcmdldEJ1Y2tldDogbG9nc0J1Y2tldC5pZCxcbiAgICAgICAgdGFyZ2V0UHJlZml4OiAnZGF0YS1idWNrZXQtYWNjZXNzLWxvZ3MvJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuZGF0YUJ1Y2tldE5hbWUgPSBkYXRhQnVja2V0LmlkO1xuICAgIHRoaXMuZGF0YUJ1Y2tldEFybiA9IGRhdGFCdWNrZXQuYXJuO1xuICAgIHRoaXMubG9nc0J1Y2tldE5hbWUgPSBsb2dzQnVja2V0LmlkO1xuICAgIHRoaXMubG9nc0J1Y2tldEFybiA9IGxvZ3NCdWNrZXQuYXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZGF0YUJ1Y2tldE5hbWU6IHRoaXMuZGF0YUJ1Y2tldE5hbWUsXG4gICAgICBkYXRhQnVja2V0QXJuOiB0aGlzLmRhdGFCdWNrZXRBcm4sXG4gICAgICBsb2dzQnVja2V0TmFtZTogdGhpcy5sb2dzQnVja2V0TmFtZSxcbiAgICAgIGxvZ3NCdWNrZXRBcm46IHRoaXMubG9nc0J1Y2tldEFybixcbiAgICB9KTtcbiAgfVxufVxuIl19