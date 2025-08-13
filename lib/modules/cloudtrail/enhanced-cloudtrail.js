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
            name: `/aws/cloudtrail/${args.trailName || name}`,
            retentionInDays: 2557, // 7 years for compliance (valid value)
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
            name: `${args.trailName || name}-security-events-filter`,
            logGroupName: this.logGroup.name,
            pattern: '[version, account, time, region, source, name="ConsoleLogin" || name="AssumeRole" || name="CreateRole" || name="DeleteRole" || name="AttachRolePolicy" || name="DetachRolePolicy"]',
            metricTransformation: {
                name: `${args.trailName || name}-SecurityEvents`,
                namespace: 'Security/CloudTrail',
                value: '1',
                defaultValue: '0',
            },
        }, { parent: this });
        // Create CloudWatch alarm for suspicious activity
        this.alarm = new aws.cloudwatch.MetricAlarm(`${name}-security-alarm`, {
            name: `${args.trailName || name}-suspicious-activity`,
            alarmDescription: 'Alarm for suspicious security-related activities',
            metricName: `${args.trailName || name}-SecurityEvents`,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtY2xvdWR0cmFpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVuaGFuY2VkLWNsb3VkdHJhaWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6Qyw0Q0FBK0M7QUFhL0MsTUFBYSxrQkFBbUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLEtBQUssQ0FBdUI7SUFDNUIsUUFBUSxDQUEwQjtJQUNsQyxTQUFTLENBQTJCO0lBQ3BDLFlBQVksQ0FBaUM7SUFDN0MsS0FBSyxDQUE2QjtJQUVsRCxZQUNFLElBQVksRUFDWixJQUE0QixFQUM1QixJQUFzQztRQUV0QyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1RCxtRUFBbUU7UUFDbkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUN6QyxHQUFHLElBQUksWUFBWSxFQUNuQjtZQUNFLElBQUksRUFBRSxtQkFBbUIsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFDakQsZUFBZSxFQUFFLElBQUksRUFBRSx1Q0FBdUM7WUFDOUQsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLElBQUksRUFBRSxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7U0FDdEMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLCtCQUErQjtRQUMvQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQzNDLEdBQUcsSUFBSSxhQUFhLEVBQ3BCO1lBQ0UsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLFNBQVM7WUFDeEMsWUFBWSxF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QUFDLElBQUk7WUFDeEMsU0FBUyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSTtTQUMzQixDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF0T0QsZ0RBc09DIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBjb21tb25UYWdzIH0gZnJvbSAnLi4vLi4vY29uZmlnL3RhZ3MnO1xuXG5leHBvcnQgaW50ZXJmYWNlIEVuaGFuY2VkQ2xvdWRUcmFpbEFyZ3Mge1xuICB0cmFpbE5hbWU/OiBzdHJpbmc7XG4gIHMzQnVja2V0TmFtZTogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGttc0tleUlkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM/OiBib29sZWFuO1xuICBpc011bHRpUmVnaW9uVHJhaWw/OiBib29sZWFuO1xuICBlbmFibGVMb2dGaWxlVmFsaWRhdGlvbj86IGJvb2xlYW47XG4gIGVuYWJsZUluc2lnaHRTZWxlY3RvcnM/OiBib29sZWFuO1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIEVuaGFuY2VkQ2xvdWRUcmFpbCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB0cmFpbDogYXdzLmNsb3VkdHJhaWwuVHJhaWw7XG4gIHB1YmxpYyByZWFkb25seSBsb2dHcm91cDogYXdzLmNsb3Vkd2F0Y2guTG9nR3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBsb2dTdHJlYW06IGF3cy5jbG91ZHdhdGNoLkxvZ1N0cmVhbTtcbiAgcHVibGljIHJlYWRvbmx5IG1ldHJpY0ZpbHRlcjogYXdzLmNsb3Vkd2F0Y2guTG9nTWV0cmljRmlsdGVyO1xuICBwdWJsaWMgcmVhZG9ubHkgYWxhcm06IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtO1xuXG4gIGNvbnN0cnVjdG9yKFxuICAgIG5hbWU6IHN0cmluZyxcbiAgICBhcmdzOiBFbmhhbmNlZENsb3VkVHJhaWxBcmdzLFxuICAgIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdjdXN0b206c2VjdXJpdHk6RW5oYW5jZWRDbG91ZFRyYWlsJywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggTG9nIEdyb3VwIGZvciBDbG91ZFRyYWlsIHdpdGggbG9uZ2VyIHJldGVudGlvblxuICAgIHRoaXMubG9nR3JvdXAgPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTG9nR3JvdXAoXG4gICAgICBgJHtuYW1lfS1sb2ctZ3JvdXBgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgL2F3cy9jbG91ZHRyYWlsLyR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX1gLFxuICAgICAgICByZXRlbnRpb25JbkRheXM6IDI1NTcsIC8vIDcgeWVhcnMgZm9yIGNvbXBsaWFuY2UgKHZhbGlkIHZhbHVlKVxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIExvZyBTdHJlYW1cbiAgICB0aGlzLmxvZ1N0cmVhbSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dTdHJlYW0oXG4gICAgICBgJHtuYW1lfS1sb2ctc3RyZWFtYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX0tc3RyZWFtYCxcbiAgICAgICAgbG9nR3JvdXBOYW1lOiB0aGlzLmxvZ0dyb3VwLm5hbWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIENsb3VkVHJhaWwgdG8gd3JpdGUgdG8gQ2xvdWRXYXRjaFxuICAgIGNvbnN0IGNsb3VkVHJhaWxSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGAke25hbWV9LWNsb3VkdHJhaWwtcm9sZWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke2FyZ3MudHJhaWxOYW1lIHx8IG5hbWV9LWNsb3VkdHJhaWwtcm9sZWAsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnY2xvdWR0cmFpbC5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmhhbmNlZCBwb2xpY3kgZm9yIENsb3VkVHJhaWwgdG8gd3JpdGUgdG8gQ2xvdWRXYXRjaFxuICAgIGNvbnN0IGNsb3VkVHJhaWxQb2xpY3kgPSBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgYCR7bmFtZX0tY2xvdWR0cmFpbC1wb2xpY3lgLFxuICAgICAge1xuICAgICAgICByb2xlOiBjbG91ZFRyYWlsUm9sZS5pZCxcbiAgICAgICAgcG9saWN5OiBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgICAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgIFwiU3RhdGVtZW50XCI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgICAgIFwibG9nczpQdXRMb2dFdmVudHNcIixcbiAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ0dyb3VwXCIsXG4gICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dTdHJlYW1cIixcbiAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nU3RyZWFtc1wiLFxuICAgICAgICAgICAgICBcImxvZ3M6RGVzY3JpYmVMb2dHcm91cHNcIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIke3RoaXMubG9nR3JvdXAuYXJufToqXCJcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1gLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIENsb3VkVHJhaWwgd2l0aCBjb21wcmVoZW5zaXZlIGV2ZW50IHNlbGVjdG9yc1xuICAgIHRoaXMudHJhaWwgPSBuZXcgYXdzLmNsb3VkdHJhaWwuVHJhaWwoXG4gICAgICBgJHtuYW1lfS10cmFpbGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MudHJhaWxOYW1lLFxuICAgICAgICBzM0J1Y2tldE5hbWU6IGFyZ3MuczNCdWNrZXROYW1lLFxuICAgICAgICBzM0tleVByZWZpeDogJ2Nsb3VkdHJhaWwtbG9ncycsXG4gICAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiBhcmdzLmluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzID8/IHRydWUsXG4gICAgICAgIGlzTXVsdGlSZWdpb25UcmFpbDogYXJncy5pc011bHRpUmVnaW9uVHJhaWwgPz8gdHJ1ZSxcbiAgICAgICAgZW5hYmxlTG9nRmlsZVZhbGlkYXRpb246IGFyZ3MuZW5hYmxlTG9nRmlsZVZhbGlkYXRpb24gPz8gdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIGNsb3VkV2F0Y2hMb2dzR3JvdXBBcm46IHB1bHVtaS5pbnRlcnBvbGF0ZWAke3RoaXMubG9nR3JvdXAuYXJufToqYCxcbiAgICAgICAgY2xvdWRXYXRjaExvZ3NSb2xlQXJuOiBjbG91ZFRyYWlsUm9sZS5hcm4sXG5cbiAgICAgICAgLy8gQWR2YW5jZWQgZXZlbnQgc2VsZWN0b3JzIGZvciBtb3JlIGdyYW51bGFyIGxvZ2dpbmdcbiAgICAgICAgYWR2YW5jZWRFdmVudFNlbGVjdG9yczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgYWxsIFMzIGRhdGEgZXZlbnRzJyxcbiAgICAgICAgICAgIGZpZWxkU2VsZWN0b3JzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50Q2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGVxdWFsczogWydEYXRhJ10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3Jlc291cmNlcy50eXBlJyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnQVdTOjpTMzo6T2JqZWN0J10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0xvZyBhbGwgSUFNIG1hbmFnZW1lbnQgZXZlbnRzJyxcbiAgICAgICAgICAgIGZpZWxkU2VsZWN0b3JzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50Q2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGVxdWFsczogWydNYW5hZ2VtZW50J10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50TmFtZScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbXG4gICAgICAgICAgICAgICAgICAnQ3JlYXRlUm9sZScsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlUm9sZScsXG4gICAgICAgICAgICAgICAgICAnQXR0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnRGV0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnUHV0Um9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnQ3JlYXRlVXNlcicsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlVXNlcicsXG4gICAgICAgICAgICAgICAgICAnQ3JlYXRlQWNjZXNzS2V5JyxcbiAgICAgICAgICAgICAgICAgICdEZWxldGVBY2Nlc3NLZXknLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0xvZyBhbGwgS01TIGtleSBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgIGZpZWxkU2VsZWN0b3JzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50Q2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGVxdWFsczogWydNYW5hZ2VtZW50J10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3Jlc291cmNlcy50eXBlJyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnQVdTOjpLTVM6OktleSddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgc2VjdXJpdHkgZ3JvdXAgY2hhbmdlcycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnTWFuYWdlbWVudCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudE5hbWUnLFxuICAgICAgICAgICAgICAgIGVxdWFsczogW1xuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZVNlY3VyaXR5R3JvdXAnLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVNlY3VyaXR5R3JvdXAnLFxuICAgICAgICAgICAgICAgICAgJ0F1dGhvcml6ZVNlY3VyaXR5R3JvdXBJbmdyZXNzJyxcbiAgICAgICAgICAgICAgICAgICdBdXRob3JpemVTZWN1cml0eUdyb3VwRWdyZXNzJyxcbiAgICAgICAgICAgICAgICAgICdSZXZva2VTZWN1cml0eUdyb3VwSW5ncmVzcycsXG4gICAgICAgICAgICAgICAgICAnUmV2b2tlU2VjdXJpdHlHcm91cEVncmVzcycsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICAvLyBFbmFibGUgaW5zaWdodHMgZm9yIGFub21hbHkgZGV0ZWN0aW9uXG4gICAgICAgIGluc2lnaHRTZWxlY3RvcnM6IGFyZ3MuZW5hYmxlSW5zaWdodFNlbGVjdG9yc1xuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW5zaWdodFR5cGU6ICdBcGlDYWxsUmF0ZUluc2lnaHQnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIGRlcGVuZHNPbjogW2Nsb3VkVHJhaWxQb2xpY3ldIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIG1ldHJpYyBmaWx0ZXIgZm9yIHNlY3VyaXR5IGV2ZW50c1xuICAgIHRoaXMubWV0cmljRmlsdGVyID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ01ldHJpY0ZpbHRlcihcbiAgICAgIGAke25hbWV9LXNlY3VyaXR5LWV2ZW50c2AsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke2FyZ3MudHJhaWxOYW1lIHx8IG5hbWV9LXNlY3VyaXR5LWV2ZW50cy1maWx0ZXJgLFxuICAgICAgICBsb2dHcm91cE5hbWU6IHRoaXMubG9nR3JvdXAubmFtZSxcbiAgICAgICAgcGF0dGVybjpcbiAgICAgICAgICAnW3ZlcnNpb24sIGFjY291bnQsIHRpbWUsIHJlZ2lvbiwgc291cmNlLCBuYW1lPVwiQ29uc29sZUxvZ2luXCIgfHwgbmFtZT1cIkFzc3VtZVJvbGVcIiB8fCBuYW1lPVwiQ3JlYXRlUm9sZVwiIHx8IG5hbWU9XCJEZWxldGVSb2xlXCIgfHwgbmFtZT1cIkF0dGFjaFJvbGVQb2xpY3lcIiB8fCBuYW1lPVwiRGV0YWNoUm9sZVBvbGljeVwiXScsXG4gICAgICAgIG1ldHJpY1RyYW5zZm9ybWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogYCR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX0tU2VjdXJpdHlFdmVudHNgLFxuICAgICAgICAgIG5hbWVzcGFjZTogJ1NlY3VyaXR5L0Nsb3VkVHJhaWwnLFxuICAgICAgICAgIHZhbHVlOiAnMScsXG4gICAgICAgICAgZGVmYXVsdFZhbHVlOiAnMCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBhbGFybSBmb3Igc3VzcGljaW91cyBhY3Rpdml0eVxuICAgIHRoaXMuYWxhcm0gPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgJHtuYW1lfS1zZWN1cml0eS1hbGFybWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke2FyZ3MudHJhaWxOYW1lIHx8IG5hbWV9LXN1c3BpY2lvdXMtYWN0aXZpdHlgLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnQWxhcm0gZm9yIHN1c3BpY2lvdXMgc2VjdXJpdHktcmVsYXRlZCBhY3Rpdml0aWVzJyxcbiAgICAgICAgbWV0cmljTmFtZTogYCR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX0tU2VjdXJpdHlFdmVudHNgLFxuICAgICAgICBuYW1lc3BhY2U6ICdTZWN1cml0eS9DbG91ZFRyYWlsJyxcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgcGVyaW9kOiAzMDAsIC8vIDUgbWludXRlc1xuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgdGhyZXNob2xkOiAxMCwgLy8gQWxlcnQgaWYgbW9yZSB0aGFuIDEwIHNlY3VyaXR5IGV2ZW50cyBpbiA1IG1pbnV0ZXNcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBhbGFybUFjdGlvbnM6IFtdLCAvLyBBZGQgU05TIHRvcGljIEFSTiBoZXJlIGZvciBub3RpZmljYXRpb25zXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB0cmFpbEFybjogdGhpcy50cmFpbC5hcm4sXG4gICAgICB0cmFpbE5hbWU6IHRoaXMudHJhaWwubmFtZSxcbiAgICAgIGxvZ0dyb3VwQXJuOiB0aGlzLmxvZ0dyb3VwLmFybixcbiAgICAgIG1ldHJpY0ZpbHRlck5hbWU6IHRoaXMubWV0cmljRmlsdGVyLm5hbWUsXG4gICAgICBhbGFybU5hbWU6IHRoaXMuYWxhcm0ubmFtZSxcbiAgICB9KTtcbiAgfVxufVxuIl19