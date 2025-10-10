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
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class S3Stack extends pulumi.ComponentResource {
    bucketName;
    bucketArn;
    constructor(name, args, opts) {
        super('tap:s3:S3Stack', name, args, opts);
        // Create S3 bucket for static assets
        const staticBucket = new aws.s3.Bucket(`${name}-static-${args.environmentSuffix}`, {
            acl: 'private',
            versioning: {
                enabled: true,
            },
            lifecycleRules: [
                {
                    enabled: true,
                    noncurrentVersionExpiration: {
                        days: 90,
                    },
                },
                {
                    enabled: true,
                    transitions: [
                        {
                            days: 30,
                            storageClass: 'STANDARD_IA',
                        },
                    ],
                },
            ],
            serverSideEncryptionConfiguration: {
                rule: {
                    applyServerSideEncryptionByDefault: {
                        sseAlgorithm: 'AES256',
                    },
                },
            },
            tags: {
                Name: `${name}-static-${args.environmentSuffix}`,
                Purpose: 'Static Assets',
                ...args.tags,
            },
        }, { parent: this });
        // Block public access
        new aws.s3.BucketPublicAccessBlock(`${name}-static-pab-${args.environmentSuffix}`, {
            bucket: staticBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
        }, { parent: this });
        // Create bucket policy for ALB/CloudFront access
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _bucketPolicy = new aws.s3.BucketPolicy(`${name}-static-policy-${args.environmentSuffix}`, {
            bucket: staticBucket.id,
            policy: pulumi
                .all([staticBucket.arn, aws.getCallerIdentity()])
                .apply(([bucketArn, identity]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'AllowCloudFrontOAI',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudfront.amazonaws.com',
                        },
                        Action: 's3:GetObject',
                        Resource: `${bucketArn}/*`,
                        Condition: {
                            StringEquals: {
                                'AWS:SourceAccount': identity.accountId,
                            },
                        },
                    },
                    {
                        Sid: 'AllowALBAccess',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'elasticloadbalancing.amazonaws.com',
                        },
                        Action: 's3:GetObject',
                        Resource: `${bucketArn}/*`,
                    },
                ],
            })),
        }, { parent: this });
        this.bucketName = staticBucket.bucket;
        this.bucketArn = staticBucket.arn;
        this.registerOutputs({
            bucketName: this.bucketName,
            bucketArn: this.bucketArn,
        });
    }
}
exports.S3Stack = S3Stack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiczMtc3RhY2suanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9saWIvczMtc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsdURBQXlDO0FBQ3pDLGlEQUFtQztBQVFuQyxNQUFhLE9BQVEsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ25DLFVBQVUsQ0FBd0I7SUFDbEMsU0FBUyxDQUF3QjtJQUVqRCxZQUFZLElBQVksRUFBRSxJQUFpQixFQUFFLElBQXNCO1FBQ2pFLEtBQUssQ0FBQyxnQkFBZ0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTFDLHFDQUFxQztRQUNyQyxNQUFNLFlBQVksR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsTUFBTSxDQUNwQyxHQUFHLElBQUksV0FBVyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDMUM7WUFDRSxHQUFHLEVBQUUsU0FBUztZQUNkLFVBQVUsRUFBRTtnQkFDVixPQUFPLEVBQUUsSUFBSTthQUNkO1lBQ0QsY0FBYyxFQUFFO2dCQUNkO29CQUNFLE9BQU8sRUFBRSxJQUFJO29CQUNiLDJCQUEyQixFQUFFO3dCQUMzQixJQUFJLEVBQUUsRUFBRTtxQkFDVDtpQkFDRjtnQkFDRDtvQkFDRSxPQUFPLEVBQUUsSUFBSTtvQkFDYixXQUFXLEVBQUU7d0JBQ1g7NEJBQ0UsSUFBSSxFQUFFLEVBQUU7NEJBQ1IsWUFBWSxFQUFFLGFBQWE7eUJBQzVCO3FCQUNGO2lCQUNGO2FBQ0Y7WUFDRCxpQ0FBaUMsRUFBRTtnQkFDakMsSUFBSSxFQUFFO29CQUNKLGtDQUFrQyxFQUFFO3dCQUNsQyxZQUFZLEVBQUUsUUFBUTtxQkFDdkI7aUJBQ0Y7YUFDRjtZQUNELElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUsR0FBRyxJQUFJLFdBQVcsSUFBSSxDQUFDLGlCQUFpQixFQUFFO2dCQUNoRCxPQUFPLEVBQUUsZUFBZTtnQkFDeEIsR0FBRyxJQUFJLENBQUMsSUFBSTthQUNiO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHNCQUFzQjtRQUN0QixJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsdUJBQXVCLENBQ2hDLEdBQUcsSUFBSSxlQUFlLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUM5QztZQUNFLE1BQU0sRUFBRSxZQUFZLENBQUMsRUFBRTtZQUN2QixlQUFlLEVBQUUsSUFBSTtZQUNyQixpQkFBaUIsRUFBRSxJQUFJO1lBQ3ZCLGdCQUFnQixFQUFFLElBQUk7WUFDdEIscUJBQXFCLEVBQUUsSUFBSTtTQUM1QixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsaURBQWlEO1FBQ2pELDZEQUE2RDtRQUM3RCxNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxFQUFFLENBQUMsWUFBWSxDQUMzQyxHQUFHLElBQUksa0JBQWtCLElBQUksQ0FBQyxpQkFBaUIsRUFBRSxFQUNqRDtZQUNFLE1BQU0sRUFBRSxZQUFZLENBQUMsRUFBRTtZQUN2QixNQUFNLEVBQUUsTUFBTTtpQkFDWCxHQUFHLENBQUMsQ0FBQyxZQUFZLENBQUMsR0FBRyxFQUFFLEdBQUcsQ0FBQyxpQkFBaUIsRUFBRSxDQUFDLENBQUM7aUJBQ2hELEtBQUssQ0FBQyxDQUFDLENBQUMsU0FBUyxFQUFFLFFBQVEsQ0FBQyxFQUFFLEVBQUUsQ0FDL0IsSUFBSSxDQUFDLFNBQVMsQ0FBQztnQkFDYixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLEdBQUcsRUFBRSxvQkFBb0I7d0JBQ3pCLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFNBQVMsRUFBRTs0QkFDVCxPQUFPLEVBQUUsMEJBQTBCO3lCQUNwQzt3QkFDRCxNQUFNLEVBQUUsY0FBYzt3QkFDdEIsUUFBUSxFQUFFLEdBQUcsU0FBUyxJQUFJO3dCQUMxQixTQUFTLEVBQUU7NEJBQ1QsWUFBWSxFQUFFO2dDQUNaLG1CQUFtQixFQUFFLFFBQVEsQ0FBQyxTQUFTOzZCQUN4Qzt5QkFDRjtxQkFDRjtvQkFDRDt3QkFDRSxHQUFHLEVBQUUsZ0JBQWdCO3dCQUNyQixNQUFNLEVBQUUsT0FBTzt3QkFDZixTQUFTLEVBQUU7NEJBQ1QsT0FBTyxFQUFFLG9DQUFvQzt5QkFDOUM7d0JBQ0QsTUFBTSxFQUFFLGNBQWM7d0JBQ3RCLFFBQVEsRUFBRSxHQUFHLFNBQVMsSUFBSTtxQkFDM0I7aUJBQ0Y7YUFDRixDQUFDLENBQ0g7U0FDSixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLFVBQVUsR0FBRyxZQUFZLENBQUMsTUFBTSxDQUFDO1FBQ3RDLElBQUksQ0FBQyxTQUFTLEdBQUcsWUFBWSxDQUFDLEdBQUcsQ0FBQztRQUVsQyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFVBQVUsRUFBRSxJQUFJLENBQUMsVUFBVTtZQUMzQixTQUFTLEVBQUUsSUFBSSxDQUFDLFNBQVM7U0FDMUIsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL0dELDBCQStHQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFMzU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIFMzU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0TmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYnVja2V0QXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBTM1N0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6czM6UzNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIFMzIGJ1Y2tldCBmb3Igc3RhdGljIGFzc2V0c1xuICAgIGNvbnN0IHN0YXRpY0J1Y2tldCA9IG5ldyBhd3MuczMuQnVja2V0KFxuICAgICAgYCR7bmFtZX0tc3RhdGljLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBhY2w6ICdwcml2YXRlJyxcbiAgICAgICAgdmVyc2lvbmluZzoge1xuICAgICAgICAgIGVuYWJsZWQ6IHRydWUsXG4gICAgICAgIH0sXG4gICAgICAgIGxpZmVjeWNsZVJ1bGVzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgZW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIG5vbmN1cnJlbnRWZXJzaW9uRXhwaXJhdGlvbjoge1xuICAgICAgICAgICAgICBkYXlzOiA5MCxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBlbmFibGVkOiB0cnVlLFxuICAgICAgICAgICAgdHJhbnNpdGlvbnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGRheXM6IDMwLFxuICAgICAgICAgICAgICAgIHN0b3JhZ2VDbGFzczogJ1NUQU5EQVJEX0lBJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgc2VydmVyU2lkZUVuY3J5cHRpb25Db25maWd1cmF0aW9uOiB7XG4gICAgICAgICAgcnVsZToge1xuICAgICAgICAgICAgYXBwbHlTZXJ2ZXJTaWRlRW5jcnlwdGlvbkJ5RGVmYXVsdDoge1xuICAgICAgICAgICAgICBzc2VBbGdvcml0aG06ICdBRVMyNTYnLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYCR7bmFtZX0tc3RhdGljLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdTdGF0aWMgQXNzZXRzJyxcbiAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBCbG9jayBwdWJsaWMgYWNjZXNzXG4gICAgbmV3IGF3cy5zMy5CdWNrZXRQdWJsaWNBY2Nlc3NCbG9jayhcbiAgICAgIGAke25hbWV9LXN0YXRpYy1wYWItJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogc3RhdGljQnVja2V0LmlkLFxuICAgICAgICBibG9ja1B1YmxpY0FjbHM6IHRydWUsXG4gICAgICAgIGJsb2NrUHVibGljUG9saWN5OiB0cnVlLFxuICAgICAgICBpZ25vcmVQdWJsaWNBY2xzOiB0cnVlLFxuICAgICAgICByZXN0cmljdFB1YmxpY0J1Y2tldHM6IHRydWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgYnVja2V0IHBvbGljeSBmb3IgQUxCL0Nsb3VkRnJvbnQgYWNjZXNzXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IF9idWNrZXRQb2xpY3kgPSBuZXcgYXdzLnMzLkJ1Y2tldFBvbGljeShcbiAgICAgIGAke25hbWV9LXN0YXRpYy1wb2xpY3ktJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGJ1Y2tldDogc3RhdGljQnVja2V0LmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaVxuICAgICAgICAgIC5hbGwoW3N0YXRpY0J1Y2tldC5hcm4sIGF3cy5nZXRDYWxsZXJJZGVudGl0eSgpXSlcbiAgICAgICAgICAuYXBwbHkoKFtidWNrZXRBcm4sIGlkZW50aXR5XSkgPT5cbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBTaWQ6ICdBbGxvd0Nsb3VkRnJvbnRPQUknLFxuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZGZyb250LmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ3MzOkdldE9iamVjdCcsXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZTogYCR7YnVja2V0QXJufS8qYCxcbiAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnQVdTOlNvdXJjZUFjY291bnQnOiBpZGVudGl0eS5hY2NvdW50SWQsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgU2lkOiAnQWxsb3dBTEJBY2Nlc3MnLFxuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdlbGFzdGljbG9hZGJhbGFuY2luZy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBBY3Rpb246ICdzMzpHZXRPYmplY3QnLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGAke2J1Y2tldEFybn0vKmAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgKSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuYnVja2V0TmFtZSA9IHN0YXRpY0J1Y2tldC5idWNrZXQ7XG4gICAgdGhpcy5idWNrZXRBcm4gPSBzdGF0aWNCdWNrZXQuYXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYnVja2V0TmFtZTogdGhpcy5idWNrZXROYW1lLFxuICAgICAgYnVja2V0QXJuOiB0aGlzLmJ1Y2tldEFybixcbiAgICB9KTtcbiAgfVxufVxuIl19