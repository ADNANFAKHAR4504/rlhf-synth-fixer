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
exports.EnhancedCloudTrail = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
const tags_1 = require("../../config/tags");
class EnhancedCloudTrail extends pulumi.ComponentResource {
    trail;
    logGroup;
    logStream;
    metricFilter;
    alarm;
    constructor(name, args, opts) {
        super('custom:security:EnhancedCloudTrail', name, {}, opts);
        // Create CloudWatch Log Group for CloudTrail with longer retention
        this.logGroup = new aws.cloudwatch.LogGroup(`${name}-log-group`, {
            name: `/aws/cloudtrail/${name}`,
            retentionInDays: 2557, // 7 years for compliance (valid value)
            kmsKeyId: args.kmsKeyId,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        // Create CloudWatch Log Stream
        this.logStream = new aws.cloudwatch.LogStream(`${name}-log-stream`, {
            name: `${name}-stream`,
            logGroupName: this.logGroup.name,
        }, { parent: this });
        // Create IAM role for CloudTrail to write to CloudWatch
        const cloudTrailRole = new aws.iam.Role(`${name}-cloudtrail-role`, {
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
        // Enhanced policy for CloudTrail to write to CloudWatch
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
              "logs:CreateLogStream",
              "logs:DescribeLogStreams",
              "logs:DescribeLogGroups"
            ],
            "Resource": "${this.logGroup.arn}:*"
          }
        ]
      }`,
        }, { parent: this });
        // Create enhanced CloudTrail with comprehensive event selectors
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
            // Advanced event selectors for more granular logging
            advancedEventSelectors: [
                {
                    name: 'Log all S3 data events',
                    fieldSelectors: [
                        {
                            field: 'eventCategory',
                            equals: ['Data'],
                        },
                        {
                            field: 'resources.type',
                            equals: ['AWS::S3::Object'],
                        },
                    ],
                },
                {
                    name: 'Log all IAM management events',
                    fieldSelectors: [
                        {
                            field: 'eventCategory',
                            equals: ['Management'],
                        },
                        {
                            field: 'eventName',
                            equals: [
                                'CreateRole',
                                'DeleteRole',
                                'AttachRolePolicy',
                                'DetachRolePolicy',
                                'PutRolePolicy',
                                'DeleteRolePolicy',
                                'CreateUser',
                                'DeleteUser',
                                'CreateAccessKey',
                                'DeleteAccessKey',
                            ],
                        },
                    ],
                },
                {
                    name: 'Log all KMS key operations',
                    fieldSelectors: [
                        {
                            field: 'eventCategory',
                            equals: ['Management'],
                        },
                        {
                            field: 'resources.type',
                            equals: ['AWS::KMS::Key'],
                        },
                    ],
                },
                {
                    name: 'Log security group changes',
                    fieldSelectors: [
                        {
                            field: 'eventCategory',
                            equals: ['Management'],
                        },
                        {
                            field: 'eventName',
                            equals: [
                                'CreateSecurityGroup',
                                'DeleteSecurityGroup',
                                'AuthorizeSecurityGroupIngress',
                                'AuthorizeSecurityGroupEgress',
                                'RevokeSecurityGroupIngress',
                                'RevokeSecurityGroupEgress',
                            ],
                        },
                    ],
                },
            ],
            // Enable insights for anomaly detection
            insightSelectors: args.enableInsightSelectors
                ? [
                    {
                        insightType: 'ApiCallRateInsight',
                    },
                ]
                : undefined,
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this, dependsOn: [cloudTrailPolicy] });
        // Create metric filter for security events
        this.metricFilter = new aws.cloudwatch.LogMetricFilter(`${name}-security-events`, {
            name: `${name}-security-events-filter`,
            logGroupName: this.logGroup.name,
            pattern: '[version, account, time, region, source, name="ConsoleLogin" || name="AssumeRole" || name="CreateRole" || name="DeleteRole" || name="AttachRolePolicy" || name="DetachRolePolicy"]',
            metricTransformation: {
                name: `${name}-SecurityEvents`,
                namespace: 'Security/CloudTrail',
                value: '1',
                defaultValue: '0',
            },
        }, { parent: this });
        // Create CloudWatch alarm for suspicious activity
        this.alarm = new aws.cloudwatch.MetricAlarm(`${name}-security-alarm`, {
            name: `${name}-suspicious-activity`,
            alarmDescription: 'Alarm for suspicious security-related activities',
            metricName: `${name}-SecurityEvents`,
            namespace: 'Security/CloudTrail',
            statistic: 'Sum',
            period: 300, // 5 minutes
            evaluationPeriods: 1,
            threshold: 10, // Alert if more than 10 security events in 5 minutes
            comparisonOperator: 'GreaterThanThreshold',
            alarmActions: [], // Add SNS topic ARN here for notifications
            tags: { ...tags_1.commonTags, ...args.tags },
        }, { parent: this });
        this.registerOutputs({
            trailArn: this.trail.arn,
            trailName: this.trail.name,
            logGroupArn: this.logGroup.arn,
            metricFilterName: this.metricFilter.name,
            alarmName: this.alarm.name,
        });
    }
}
exports.EnhancedCloudTrail = EnhancedCloudTrail;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtY2xvdWR0cmFpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVuaGFuY2VkLWNsb3VkdHJhaWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6Qyw0Q0FBK0M7QUFhL0MsTUFBYSxrQkFBbUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLEtBQUssQ0FBdUI7SUFDNUIsUUFBUSxDQUEwQjtJQUNsQyxTQUFTLENBQTJCO0lBQ3BDLFlBQVksQ0FBaUM7SUFDN0MsS0FBSyxDQUE2QjtJQUVsRCxZQUNFLElBQVksRUFDWixJQUE0QixFQUM1QixJQUFzQztRQUV0QyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1RCxtRUFBbUU7UUFDbkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUN6QyxHQUFHLElBQUksWUFBWSxFQUNuQjtZQUNFLElBQUksRUFBRSxtQkFBbUIsSUFBSSxFQUFFO1lBQy9CLGVBQWUsRUFBRSxJQUFJLEVBQUUsdUNBQXVDO1lBQzlELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixJQUFJLEVBQUUsRUFBRSxHQUFHLGlCQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3RDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUMzQyxHQUFHLElBQUksYUFBYSxFQUNwQjtZQUNFLElBQUksRUFBRSxHQUFHLElBQUksU0FBUztZQUN0QixZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJO1NBQ2pDLEVBQ0Qs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QUUsR0FBRzthQUNsQjtTQUNGLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixrREFBa0Q7UUFDbEQsSUFBSSxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsV0FBVyxDQUN6QyxHQUFHLElBQUksaUJBQWlCLEVBQ3hCO1lBQ0UsSUFBSSxFQUFFLEdBQUcsSUFBSSxzQkFBc0I7WUFDbkMsZ0JBQWdCLEVBQUUsa0RBQWtEO1lBQ3BFLFVBQVUsRUFBRSxHQUFHLElBQUksaUJBQWlCO1lBQ3BDLFNBQVMsRUFBRSxxQkFBcUI7WUFDaEMsU0FBUyxFQUFFLEtBQUs7WUFDaEIsTUFBTSxFQUFFLEdBQUcsRUFBRSxZQUFZO1lBQ3pCLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsU0FBUyxFQUFFLEVBQUUsRUFBRSxxREFBcUQ7WUFDcEUsa0JBQWtCLEVBQUUsc0JBQXNCO1lBQzFDLFlBQVksRUFBRSxFQUFFLEVBQUUsMkNBQTJDO1lBQzdELElBQUksRUFBRSxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7U0FDdEMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRztZQUN4QixTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1lBQzFCLFdBQVcsRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUc7WUFDOUIsZ0JBQWdCLEVBQUUsSUFBSSxDQUFDLFlBQVksQ0FBQyxJQUFJO1lBQ3hDLFNBQVMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUk7U0FDM0IsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBck9ELGdEQXFPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgY29tbW9uVGFncyB9IGZyb20gJy4uLy4uL2NvbmZpZy90YWdzJztcblxuZXhwb3J0IGludGVyZmFjZSBFbmhhbmNlZENsb3VkVHJhaWxBcmdzIHtcbiAgdHJhaWxOYW1lPzogc3RyaW5nO1xuICBzM0J1Y2tldE5hbWU6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBrbXNLZXlJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzPzogYm9vbGVhbjtcbiAgaXNNdWx0aVJlZ2lvblRyYWlsPzogYm9vbGVhbjtcbiAgZW5hYmxlTG9nRmlsZVZhbGlkYXRpb24/OiBib29sZWFuO1xuICBlbmFibGVJbnNpZ2h0U2VsZWN0b3JzPzogYm9vbGVhbjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBjbGFzcyBFbmhhbmNlZENsb3VkVHJhaWwgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgdHJhaWw6IGF3cy5jbG91ZHRyYWlsLlRyYWlsO1xuICBwdWJsaWMgcmVhZG9ubHkgbG9nR3JvdXA6IGF3cy5jbG91ZHdhdGNoLkxvZ0dyb3VwO1xuICBwdWJsaWMgcmVhZG9ubHkgbG9nU3RyZWFtOiBhd3MuY2xvdWR3YXRjaC5Mb2dTdHJlYW07XG4gIHB1YmxpYyByZWFkb25seSBtZXRyaWNGaWx0ZXI6IGF3cy5jbG91ZHdhdGNoLkxvZ01ldHJpY0ZpbHRlcjtcbiAgcHVibGljIHJlYWRvbmx5IGFsYXJtOiBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybTtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogRW5oYW5jZWRDbG91ZFRyYWlsQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignY3VzdG9tOnNlY3VyaXR5OkVuaGFuY2VkQ2xvdWRUcmFpbCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIExvZyBHcm91cCBmb3IgQ2xvdWRUcmFpbCB3aXRoIGxvbmdlciByZXRlbnRpb25cbiAgICB0aGlzLmxvZ0dyb3VwID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ0dyb3VwKFxuICAgICAgYCR7bmFtZX0tbG9nLWdyb3VwYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYC9hd3MvY2xvdWR0cmFpbC8ke25hbWV9YCxcbiAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiAyNTU3LCAvLyA3IHllYXJzIGZvciBjb21wbGlhbmNlICh2YWxpZCB2YWx1ZSlcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBMb2cgU3RyZWFtXG4gICAgdGhpcy5sb2dTdHJlYW0gPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTG9nU3RyZWFtKFxuICAgICAgYCR7bmFtZX0tbG9nLXN0cmVhbWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke25hbWV9LXN0cmVhbWAsXG4gICAgICAgIGxvZ0dyb3VwTmFtZTogdGhpcy5sb2dHcm91cC5uYW1lLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIElBTSByb2xlIGZvciBDbG91ZFRyYWlsIHRvIHdyaXRlIHRvIENsb3VkV2F0Y2hcbiAgICBjb25zdCBjbG91ZFRyYWlsUm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICBgJHtuYW1lfS1jbG91ZHRyYWlsLXJvbGVgLFxuICAgICAge1xuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgU2VydmljZTogJ2Nsb3VkdHJhaWwuYW1hem9uYXdzLmNvbScsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5oYW5jZWQgcG9saWN5IGZvciBDbG91ZFRyYWlsIHRvIHdyaXRlIHRvIENsb3VkV2F0Y2hcbiAgICBjb25zdCBjbG91ZFRyYWlsUG9saWN5ID0gbmV3IGF3cy5pYW0uUm9sZVBvbGljeShcbiAgICAgIGAke25hbWV9LWNsb3VkdHJhaWwtcG9saWN5YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogY2xvdWRUcmFpbFJvbGUuaWQsXG4gICAgICAgIHBvbGljeTogcHVsdW1pLmludGVycG9sYXRlYHtcbiAgICAgICAgXCJWZXJzaW9uXCI6IFwiMjAxMi0xMC0xN1wiLFxuICAgICAgICBcIlN0YXRlbWVudFwiOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgXCJFZmZlY3RcIjogXCJBbGxvd1wiLFxuICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgICAgICBcImxvZ3M6UHV0TG9nRXZlbnRzXCIsXG4gICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dHcm91cFwiLFxuICAgICAgICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nU3RyZWFtXCIsXG4gICAgICAgICAgICAgIFwibG9nczpEZXNjcmliZUxvZ1N0cmVhbXNcIixcbiAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nR3JvdXBzXCJcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICBcIlJlc291cmNlXCI6IFwiJHt0aGlzLmxvZ0dyb3VwLmFybn06KlwiXG4gICAgICAgICAgfVxuICAgICAgICBdXG4gICAgICB9YCxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBlbmhhbmNlZCBDbG91ZFRyYWlsIHdpdGggY29tcHJlaGVuc2l2ZSBldmVudCBzZWxlY3RvcnNcbiAgICB0aGlzLnRyYWlsID0gbmV3IGF3cy5jbG91ZHRyYWlsLlRyYWlsKFxuICAgICAgYCR7bmFtZX0tdHJhaWxgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBhcmdzLnRyYWlsTmFtZSxcbiAgICAgICAgczNCdWNrZXROYW1lOiBhcmdzLnMzQnVja2V0TmFtZSxcbiAgICAgICAgczNLZXlQcmVmaXg6ICdjbG91ZHRyYWlsLWxvZ3MnLFxuICAgICAgICBpbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50czogYXJncy5pbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50cyA/PyB0cnVlLFxuICAgICAgICBpc011bHRpUmVnaW9uVHJhaWw6IGFyZ3MuaXNNdWx0aVJlZ2lvblRyYWlsID8/IHRydWUsXG4gICAgICAgIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uOiBhcmdzLmVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uID8/IHRydWUsXG4gICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICBjbG91ZFdhdGNoTG9nc0dyb3VwQXJuOiBwdWx1bWkuaW50ZXJwb2xhdGVgJHt0aGlzLmxvZ0dyb3VwLmFybn06KmAsXG4gICAgICAgIGNsb3VkV2F0Y2hMb2dzUm9sZUFybjogY2xvdWRUcmFpbFJvbGUuYXJuLFxuXG4gICAgICAgIC8vIEFkdmFuY2VkIGV2ZW50IHNlbGVjdG9ycyBmb3IgbW9yZSBncmFudWxhciBsb2dnaW5nXG4gICAgICAgIGFkdmFuY2VkRXZlbnRTZWxlY3RvcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnTG9nIGFsbCBTMyBkYXRhIGV2ZW50cycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnRGF0YSddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZXNvdXJjZXMudHlwZScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbJ0FXUzo6UzM6Ok9iamVjdCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgYWxsIElBTSBtYW5hZ2VtZW50IGV2ZW50cycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnTWFuYWdlbWVudCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudE5hbWUnLFxuICAgICAgICAgICAgICAgIGVxdWFsczogW1xuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICAgJ0F0dGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ0RldGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ1B1dFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZVVzZXInLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVVzZXInLFxuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZUFjY2Vzc0tleScsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlQWNjZXNzS2V5JyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgYWxsIEtNUyBrZXkgb3BlcmF0aW9ucycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnTWFuYWdlbWVudCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZXNvdXJjZXMudHlwZScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbJ0FXUzo6S01TOjpLZXknXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnTG9nIHNlY3VyaXR5IGdyb3VwIGNoYW5nZXMnLFxuICAgICAgICAgICAgZmllbGRTZWxlY3RvcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAnZXZlbnRDYXRlZ29yeScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbJ01hbmFnZW1lbnQnXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAnZXZlbnROYW1lJyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFtcbiAgICAgICAgICAgICAgICAgICdDcmVhdGVTZWN1cml0eUdyb3VwJyxcbiAgICAgICAgICAgICAgICAgICdEZWxldGVTZWN1cml0eUdyb3VwJyxcbiAgICAgICAgICAgICAgICAgICdBdXRob3JpemVTZWN1cml0eUdyb3VwSW5ncmVzcycsXG4gICAgICAgICAgICAgICAgICAnQXV0aG9yaXplU2VjdXJpdHlHcm91cEVncmVzcycsXG4gICAgICAgICAgICAgICAgICAnUmV2b2tlU2VjdXJpdHlHcm91cEluZ3Jlc3MnLFxuICAgICAgICAgICAgICAgICAgJ1Jldm9rZVNlY3VyaXR5R3JvdXBFZ3Jlc3MnLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gRW5hYmxlIGluc2lnaHRzIGZvciBhbm9tYWx5IGRldGVjdGlvblxuICAgICAgICBpbnNpZ2h0U2VsZWN0b3JzOiBhcmdzLmVuYWJsZUluc2lnaHRTZWxlY3RvcnNcbiAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGluc2lnaHRUeXBlOiAnQXBpQ2FsbFJhdGVJbnNpZ2h0JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICA6IHVuZGVmaW5lZCxcblxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFtjbG91ZFRyYWlsUG9saWN5XSB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBtZXRyaWMgZmlsdGVyIGZvciBzZWN1cml0eSBldmVudHNcbiAgICB0aGlzLm1ldHJpY0ZpbHRlciA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dNZXRyaWNGaWx0ZXIoXG4gICAgICBgJHtuYW1lfS1zZWN1cml0eS1ldmVudHNgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHtuYW1lfS1zZWN1cml0eS1ldmVudHMtZmlsdGVyYCxcbiAgICAgICAgbG9nR3JvdXBOYW1lOiB0aGlzLmxvZ0dyb3VwLm5hbWUsXG4gICAgICAgIHBhdHRlcm46XG4gICAgICAgICAgJ1t2ZXJzaW9uLCBhY2NvdW50LCB0aW1lLCByZWdpb24sIHNvdXJjZSwgbmFtZT1cIkNvbnNvbGVMb2dpblwiIHx8IG5hbWU9XCJBc3N1bWVSb2xlXCIgfHwgbmFtZT1cIkNyZWF0ZVJvbGVcIiB8fCBuYW1lPVwiRGVsZXRlUm9sZVwiIHx8IG5hbWU9XCJBdHRhY2hSb2xlUG9saWN5XCIgfHwgbmFtZT1cIkRldGFjaFJvbGVQb2xpY3lcIl0nLFxuICAgICAgICBtZXRyaWNUcmFuc2Zvcm1hdGlvbjoge1xuICAgICAgICAgIG5hbWU6IGAke25hbWV9LVNlY3VyaXR5RXZlbnRzYCxcbiAgICAgICAgICBuYW1lc3BhY2U6ICdTZWN1cml0eS9DbG91ZFRyYWlsJyxcbiAgICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICAgIGRlZmF1bHRWYWx1ZTogJzAnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggYWxhcm0gZm9yIHN1c3BpY2lvdXMgYWN0aXZpdHlcbiAgICB0aGlzLmFsYXJtID0gbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgYCR7bmFtZX0tc2VjdXJpdHktYWxhcm1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHtuYW1lfS1zdXNwaWNpb3VzLWFjdGl2aXR5YCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FsYXJtIGZvciBzdXNwaWNpb3VzIHNlY3VyaXR5LXJlbGF0ZWQgYWN0aXZpdGllcycsXG4gICAgICAgIG1ldHJpY05hbWU6IGAke25hbWV9LVNlY3VyaXR5RXZlbnRzYCxcbiAgICAgICAgbmFtZXNwYWNlOiAnU2VjdXJpdHkvQ2xvdWRUcmFpbCcsXG4gICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgIHBlcmlvZDogMzAwLCAvLyA1IG1pbnV0ZXNcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgIHRocmVzaG9sZDogMTAsIC8vIEFsZXJ0IGlmIG1vcmUgdGhhbiAxMCBzZWN1cml0eSBldmVudHMgaW4gNSBtaW51dGVzXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgYWxhcm1BY3Rpb25zOiBbXSwgLy8gQWRkIFNOUyB0b3BpYyBBUk4gaGVyZSBmb3Igbm90aWZpY2F0aW9uc1xuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgdHJhaWxBcm46IHRoaXMudHJhaWwuYXJuLFxuICAgICAgdHJhaWxOYW1lOiB0aGlzLnRyYWlsLm5hbWUsXG4gICAgICBsb2dHcm91cEFybjogdGhpcy5sb2dHcm91cC5hcm4sXG4gICAgICBtZXRyaWNGaWx0ZXJOYW1lOiB0aGlzLm1ldHJpY0ZpbHRlci5uYW1lLFxuICAgICAgYWxhcm1OYW1lOiB0aGlzLmFsYXJtLm5hbWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==