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
exports.SecureCloudTrail = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class SecureCloudTrail extends pulumi.ComponentResource {
    trail;
    logGroup;
    logStream;
    constructor(name, args, opts) {
        super('custom:security:SecureCloudTrail', name, {}, opts);
        // Create CloudWatch Log Group for CloudTrail
        this.logGroup = new aws.cloudwatch.LogGroup(`${name}-log-group`, {
            name: `/aws/cloudtrail/${args.trailName || name}`,
            retentionInDays: 365,
            kmsKeyId: args.kmsKeyId,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        // Create CloudWatch Log Stream
        this.logStream = new aws.cloudwatch.LogStream(`${name}-log-stream`, {
            name: `${args.trailName || name}-stream`,
            logGroupName: this.logGroup.name,
        }, { parent: this });
        // Create IAM role for CloudTrail to write to CloudWatch
        const cloudTrailRole = new aws.iam.Role(`${name}-cloudtrail-role`, {
            name: `${args.trailName || name}-cloudtrail-role`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudtrail.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        // Policy for CloudTrail to write to CloudWatch
        const cloudTrailPolicy = new aws.iam.RolePolicy(`${name}-cloudtrail-policy`, {
            role: cloudTrailRole.id,
            policy: pulumi.interpolate `{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "logs:PutLogEvents",
              "logs:CreateLogGroup",
              "logs:CreateLogStream"
            ],
            "Resource": "${this.logGroup.arn}:*"
          }
        ]
      }`,
        }, { parent: this });
        // Create CloudTrail
        this.trail = new aws.cloudtrail.Trail(`${name}-trail`, {
            name: args.trailName,
            s3BucketName: args.s3BucketName,
            s3KeyPrefix: 'cloudtrail-logs',
            includeGlobalServiceEvents: args.includeGlobalServiceEvents ?? true,
            isMultiRegionTrail: args.isMultiRegionTrail ?? true,
            enableLogFileValidation: args.enableLogFileValidation ?? true,
            kmsKeyId: args.kmsKeyId,
            cloudWatchLogsGroupArn: pulumi.interpolate `${this.logGroup.arn}:*`,
            cloudWatchLogsRoleArn: cloudTrailRole.arn,
            eventSelectors: [
                {
                    readWriteType: 'All',
                    includeManagementEvents: true,
                    dataResources: [
                        {
                            type: 'AWS::S3::Object',
                            values: ['arn:aws:s3:::*/*'],
                        },
                        {
                            type: 'AWS::S3::Bucket',
                            values: ['arn:aws:s3:::*'],
                        },
                    ],
                },
            ],
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this, dependsOn: [cloudTrailPolicy] });
        this.registerOutputs({
            trailArn: this.trail.arn,
            trailName: this.trail.name,
            logGroupArn: this.logGroup.arn,
        });
    }
}
exports.SecureCloudTrail = SecureCloudTrail;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSxpREFBbUM7QUFDbkMsdURBQXlDO0FBQ3pDLDRDQUErQztBQVkvQyxNQUFhLGdCQUFpQixTQUFRLE1BQU0sQ0FBQyxpQkFBaUI7SUFDNUMsS0FBSyxDQUF1QjtJQUM1QixRQUFRLENBQTBCO0lBQ2xDLFNBQVMsQ0FBMkI7SUFFcEQsWUFDRSxJQUFZLEVBQ1osSUFBb0IsRUFDcEIsSUFBc0M7UUFFdEMsS0FBSyxDQUFDLGtDQUFrQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFMUQsNkNBQTZDO1FBQzdDLElBQUksQ0FBQyxRQUFRLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FDekMsR0FBRyxJQUFJLFlBQVksRUFDbkI7WUFDRSxJQUFJLEVBQUUsbUJBQW1CLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxFQUFFO1lBQ2pELGVBQWUsRUFBRSxHQUFHO1lBQ3BCLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixJQUFJLEVBQUUsRUFBRSxHQUFHLGlCQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3RDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUMzQyxHQUFHLElBQUksYUFBYSxFQUNwQjtZQUNFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQyxTQUFTLElBQUksSUFBSSxTQUFTO1lBQ3hDLFlBQVksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUk7U0FDakMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHdEQUF3RDtRQUN4RCxNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUNyQyxHQUFHLElBQUksa0JBQWtCLEVBQ3pCO1lBQ0UsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLGtCQUFrQjtZQUNqRCxnQkFBZ0IsRUFBRSxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUMvQixPQUFPLEVBQUUsWUFBWTtnQkFDckIsU0FBUyxFQUFFO29CQUNUO3dCQUNFLE1BQU0sRUFBRSxnQkFBZ0I7d0JBQ3hCLE1BQU0sRUFBRSxPQUFPO3dCQUNmLFNBQVMsRUFBRTs0QkFDVCxPQUFPLEVBQUUsMEJBQTBCO3lCQUNwQztxQkFDRjtpQkFDRjthQUNGLENBQUM7WUFDRixJQUFJLEVBQUUsRUFBRSxHQUFHLGlCQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3RDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwrQ0FBK0M7UUFDL0MsTUFBTSxnQkFBZ0IsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsVUFBVSxDQUM3QyxHQUFHLElBQUksb0JBQW9CLEVBQzNCO1lBQ0UsSUFBSSxFQUFFLGNBQWMsQ0FBQyxFQUFFO1lBQ3ZCLE1BQU0sRUFBRSxNQUFNLENBQUMsV0FBVyxDQUFBOzs7Ozs7Ozs7OzJCQVVQLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRzs7O1FBR3BDO1NBQ0QsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLG9CQUFvQjtRQUNwQixJQUFJLENBQUMsS0FBSyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQ25DLEdBQUcsSUFBSSxRQUFRLEVBQ2Y7WUFDRSxJQUFJLEVBQUUsSUFBSSxDQUFDLFNBQVM7WUFDcEIsWUFBWSxFQUFFLElBQUksQ0FBQyxZQUFZO1lBQy9CLFdBQVcsRUFBRSxpQkFBaUI7WUFDOUIsMEJBQTBCLEVBQUUsSUFBSSxDQUFDLDBCQUEwQixJQUFJLElBQUk7WUFDbkUsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQixJQUFJLElBQUk7WUFDbkQsdUJBQXVCLEVBQUUsSUFBSSxDQUFDLHVCQUF1QixJQUFJLElBQUk7WUFDN0QsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLHNCQUFzQixFQUFFLE1BQU0sQ0FBQyxXQUFXLENBQUEsR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsSUFBSTtZQUNsRSxxQkFBcUIsRUFBRSxjQUFjLENBQUMsR0FBRztZQUN6QyxjQUFjLEVBQUU7Z0JBQ2Q7b0JBQ0UsYUFBYSxFQUFFLEtBQUs7b0JBQ3BCLHVCQUF1QixFQUFFLElBQUk7b0JBQzdCLGFBQWEsRUFBRTt3QkFDYjs0QkFDRSxJQUFJLEVBQUUsaUJBQWlCOzRCQUN2QixNQUFNLEVBQUUsQ0FBQyxrQkFBa0IsQ0FBQzt5QkFDN0I7d0JBQ0Q7NEJBQ0UsSUFBSSxFQUFFLGlCQUFpQjs0QkFDdkIsTUFBTSxFQUFFLENBQUMsZ0JBQWdCLENBQUM7eUJBQzNCO3FCQUNGO2lCQUNGO2FBQ0Y7WUFDRCxJQUFJLEVBQUUsRUFBRSxHQUFHLGlCQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3RDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxDQUFDLGdCQUFnQixDQUFDLEVBQUUsQ0FDaEQsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRztZQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1lBQzFCLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUc7U0FDL0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBdkhELDRDQXVIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZFRyYWlsQXJncyB7XG4gIHRyYWlsTmFtZT86IHN0cmluZztcbiAgczNCdWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAga21zS2V5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBpbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50cz86IGJvb2xlYW47XG4gIGlzTXVsdGlSZWdpb25UcmFpbD86IGJvb2xlYW47XG4gIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uPzogYm9vbGVhbjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBTZWN1cmVDbG91ZFRyYWlsIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHRyYWlsOiBhd3MuY2xvdWR0cmFpbC5UcmFpbDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ1N0cmVhbTogYXdzLmNsb3Vkd2F0Y2guTG9nU3RyZWFtO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBDbG91ZFRyYWlsQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOnNlY3VyaXR5OlNlY3VyZUNsb3VkVHJhaWwnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBMb2cgR3JvdXAgZm9yIENsb3VkVHJhaWxcbiAgICB0aGlzLmxvZ0dyb3VwID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ0dyb3VwKFxuICAgICAgYCR7bmFtZX0tbG9nLWdyb3VwYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYC9hd3MvY2xvdWR0cmFpbC8ke2FyZ3MudHJhaWxOYW1lIHx8IG5hbWV9YCxcbiAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiAzNjUsXG4gICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggTG9nIFN0cmVhbVxuICAgIHRoaXMubG9nU3RyZWFtID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ1N0cmVhbShcbiAgICAgIGAke25hbWV9LWxvZy1zdHJlYW1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHthcmdzLnRyYWlsTmFtZSB8fCBuYW1lfS1zdHJlYW1gLFxuICAgICAgICBsb2dHcm91cE5hbWU6IHRoaXMubG9nR3JvdXAubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgQ2xvdWRUcmFpbCB0byB3cml0ZSB0byBDbG91ZFdhdGNoXG4gICAgY29uc3QgY2xvdWRUcmFpbFJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYCR7bmFtZX0tY2xvdWR0cmFpbC1yb2xlYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX0tY2xvdWR0cmFpbC1yb2xlYCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFBvbGljeSBmb3IgQ2xvdWRUcmFpbCB0byB3cml0ZSB0byBDbG91ZFdhdGNoXG4gICAgY29uc3QgY2xvdWRUcmFpbFBvbGljeSA9IG5ldyBhd3MuaWFtLlJvbGVQb2xpY3koXG4gICAgICBgJHtuYW1lfS1jbG91ZHRyYWlsLXBvbGljeWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IGNsb3VkVHJhaWxSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaS5pbnRlcnBvbGF0ZWB7XG4gICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICAgICAgXCJsb2dzOlB1dExvZ0V2ZW50c1wiLFxuICAgICAgICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nR3JvdXBcIixcbiAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ1N0cmVhbVwiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7dGhpcy5sb2dHcm91cC5hcm59OipcIlxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfWAsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRUcmFpbFxuICAgIHRoaXMudHJhaWwgPSBuZXcgYXdzLmNsb3VkdHJhaWwuVHJhaWwoXG4gICAgICBgJHtuYW1lfS10cmFpbGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MudHJhaWxOYW1lLFxuICAgICAgICBzM0J1Y2tldE5hbWU6IGFyZ3MuczNCdWNrZXROYW1lLFxuICAgICAgICBzM0tleVByZWZpeDogJ2Nsb3VkdHJhaWwtbG9ncycsXG4gICAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiBhcmdzLmluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzID8/IHRydWUsXG4gICAgICAgIGlzTXVsdGlSZWdpb25UcmFpbDogYXJncy5pc011bHRpUmVnaW9uVHJhaWwgPz8gdHJ1ZSxcbiAgICAgICAgZW5hYmxlTG9nRmlsZVZhbGlkYXRpb246IGFyZ3MuZW5hYmxlTG9nRmlsZVZhbGlkYXRpb24gPz8gdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIGNsb3VkV2F0Y2hMb2dzR3JvdXBBcm46IHB1bHVtaS5pbnRlcnBvbGF0ZWAke3RoaXMubG9nR3JvdXAuYXJufToqYCxcbiAgICAgICAgY2xvdWRXYXRjaExvZ3NSb2xlQXJuOiBjbG91ZFRyYWlsUm9sZS5hcm4sXG4gICAgICAgIGV2ZW50U2VsZWN0b3JzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgcmVhZFdyaXRlVHlwZTogJ0FsbCcsXG4gICAgICAgICAgICBpbmNsdWRlTWFuYWdlbWVudEV2ZW50czogdHJ1ZSxcbiAgICAgICAgICAgIGRhdGFSZXNvdXJjZXM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdBV1M6OlMzOjpPYmplY3QnLFxuICAgICAgICAgICAgICAgIHZhbHVlczogWydhcm46YXdzOnMzOjo6Ki8qJ10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnQVdTOjpTMzo6QnVja2V0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZXM6IFsnYXJuOmF3czpzMzo6OionXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbY2xvdWRUcmFpbFBvbGljeV0gfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB0cmFpbEFybjogdGhpcy50cmFpbC5hcm4sXG4gICAgICB0cmFpbE5hbWU6IHRoaXMudHJhaWwubmFtZSxcbiAgICAgIGxvZ0dyb3VwQXJuOiB0aGlzLmxvZ0dyb3VwLmFybixcbiAgICB9KTtcbiAgfVxufVxuIl19