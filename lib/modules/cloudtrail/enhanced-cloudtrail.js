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
            retentionInDays: 2555, // 7 years for compliance
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
            // Comprehensive event selectors for maximum audit coverage
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtY2xvdWR0cmFpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVuaGFuY2VkLWNsb3VkdHJhaWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6Qyw0Q0FBK0M7QUFhL0MsTUFBYSxrQkFBbUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLEtBQUssQ0FBdUI7SUFDNUIsUUFBUSxDQUEwQjtJQUNsQyxTQUFTLENBQTJCO0lBQ3BDLFlBQVksQ0FBaUM7SUFDN0MsS0FBSyxDQUE2QjtJQUVsRCxZQUNFLElBQVksRUFDWixJQUE0QixFQUM1QixJQUFzQztRQUV0QyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1RCxtRUFBbUU7UUFDbkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUN6QyxHQUFHLElBQUksWUFBWSxFQUNuQjtZQUNFLElBQUksRUFBRSxtQkFBbUIsSUFBSSxFQUFFO1lBQy9CLGVBQWUsRUFBRSxJQUFJLEVBQUUseUJBQXlCO1lBQ2hELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixJQUFJLEVBQUUsRUFBRSxHQUFHLGlCQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3RDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUMzQyxHQUFHLElBQUksYUFBYSxFQUNwQjtZQUNFLElBQUksRUFBRSxHQUFHLElBQUksU0FBUztZQUN0QixZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJO1NBQ2pDLEVBQ0Qs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SUFBSTtZQUMxQixXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHO1lBQzlCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSTtZQUN4QyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1NBQzNCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZQRCxnREF1UEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRDbG91ZFRyYWlsQXJncyB7XG4gIHRyYWlsTmFtZT86IHN0cmluZztcbiAgczNCdWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAga21zS2V5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBpbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50cz86IGJvb2xlYW47XG4gIGlzTXVsdGlSZWdpb25UcmFpbD86IGJvb2xlYW47XG4gIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uPzogYm9vbGVhbjtcbiAgZW5hYmxlSW5zaWdodFNlbGVjdG9ycz86IGJvb2xlYW47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgRW5oYW5jZWRDbG91ZFRyYWlsIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHRyYWlsOiBhd3MuY2xvdWR0cmFpbC5UcmFpbDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ1N0cmVhbTogYXdzLmNsb3Vkd2F0Y2guTG9nU3RyZWFtO1xuICBwdWJsaWMgcmVhZG9ubHkgbWV0cmljRmlsdGVyOiBhd3MuY2xvdWR3YXRjaC5Mb2dNZXRyaWNGaWx0ZXI7XG4gIHB1YmxpYyByZWFkb25seSBhbGFybTogYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEVuaGFuY2VkQ2xvdWRUcmFpbEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpFbmhhbmNlZENsb3VkVHJhaWwnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBMb2cgR3JvdXAgZm9yIENsb3VkVHJhaWwgd2l0aCBsb25nZXIgcmV0ZW50aW9uXG4gICAgdGhpcy5sb2dHcm91cCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cChcbiAgICAgIGAke25hbWV9LWxvZy1ncm91cGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXdzL2Nsb3VkdHJhaWwvJHtuYW1lfWAsXG4gICAgICAgIHJldGVudGlvbkluRGF5czogMjU1NSwgLy8gNyB5ZWFycyBmb3IgY29tcGxpYW5jZVxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIExvZyBTdHJlYW1cbiAgICB0aGlzLmxvZ1N0cmVhbSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dTdHJlYW0oXG4gICAgICBgJHtuYW1lfS1sb2ctc3RyZWFtYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7bmFtZX0tc3RyZWFtYCxcbiAgICAgICAgbG9nR3JvdXBOYW1lOiB0aGlzLmxvZ0dyb3VwLm5hbWUsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgSUFNIHJvbGUgZm9yIENsb3VkVHJhaWwgdG8gd3JpdGUgdG8gQ2xvdWRXYXRjaFxuICAgIGNvbnN0IGNsb3VkVHJhaWxSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGAke25hbWV9LWNsb3VkdHJhaWwtcm9sZWAsXG4gICAgICB7XG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHtcbiAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnY2xvdWR0cmFpbC5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmhhbmNlZCBwb2xpY3kgZm9yIENsb3VkVHJhaWwgdG8gd3JpdGUgdG8gQ2xvdWRXYXRjaFxuICAgIGNvbnN0IGNsb3VkVHJhaWxQb2xpY3kgPSBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5KFxuICAgICAgYCR7bmFtZX0tY2xvdWR0cmFpbC1wb2xpY3lgLFxuICAgICAge1xuICAgICAgICByb2xlOiBjbG91ZFRyYWlsUm9sZS5pZCxcbiAgICAgICAgcG9saWN5OiBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgICAgICBcIlZlcnNpb25cIjogXCIyMDEyLTEwLTE3XCIsXG4gICAgICAgIFwiU3RhdGVtZW50XCI6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBcIkVmZmVjdFwiOiBcIkFsbG93XCIsXG4gICAgICAgICAgICBcIkFjdGlvblwiOiBbXG4gICAgICAgICAgICAgIFwibG9nczpQdXRMb2dFdmVudHNcIixcbiAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ0dyb3VwXCIsXG4gICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dTdHJlYW1cIixcbiAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nU3RyZWFtc1wiLFxuICAgICAgICAgICAgICBcImxvZ3M6RGVzY3JpYmVMb2dHcm91cHNcIlxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIke3RoaXMubG9nR3JvdXAuYXJufToqXCJcbiAgICAgICAgICB9XG4gICAgICAgIF1cbiAgICAgIH1gLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIGVuaGFuY2VkIENsb3VkVHJhaWwgd2l0aCBjb21wcmVoZW5zaXZlIGV2ZW50IHNlbGVjdG9yc1xuICAgIHRoaXMudHJhaWwgPSBuZXcgYXdzLmNsb3VkdHJhaWwuVHJhaWwoXG4gICAgICBgJHtuYW1lfS10cmFpbGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MudHJhaWxOYW1lLFxuICAgICAgICBzM0J1Y2tldE5hbWU6IGFyZ3MuczNCdWNrZXROYW1lLFxuICAgICAgICBzM0tleVByZWZpeDogJ2Nsb3VkdHJhaWwtbG9ncycsXG4gICAgICAgIGluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzOiBhcmdzLmluY2x1ZGVHbG9iYWxTZXJ2aWNlRXZlbnRzID8/IHRydWUsXG4gICAgICAgIGlzTXVsdGlSZWdpb25UcmFpbDogYXJncy5pc011bHRpUmVnaW9uVHJhaWwgPz8gdHJ1ZSxcbiAgICAgICAgZW5hYmxlTG9nRmlsZVZhbGlkYXRpb246IGFyZ3MuZW5hYmxlTG9nRmlsZVZhbGlkYXRpb24gPz8gdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIGNsb3VkV2F0Y2hMb2dzR3JvdXBBcm46IHB1bHVtaS5pbnRlcnBvbGF0ZWAke3RoaXMubG9nR3JvdXAuYXJufToqYCxcbiAgICAgICAgY2xvdWRXYXRjaExvZ3NSb2xlQXJuOiBjbG91ZFRyYWlsUm9sZS5hcm4sXG5cbiAgICAgICAgLy8gQ29tcHJlaGVuc2l2ZSBldmVudCBzZWxlY3RvcnMgZm9yIG1heGltdW0gYXVkaXQgY292ZXJhZ2VcbiAgICAgICAgZXZlbnRTZWxlY3RvcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICByZWFkV3JpdGVUeXBlOiAnQWxsJyxcbiAgICAgICAgICAgIGluY2x1ZGVNYW5hZ2VtZW50RXZlbnRzOiB0cnVlLFxuICAgICAgICAgICAgZGF0YVJlc291cmNlczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0FXUzo6UzM6Ok9iamVjdCcsXG4gICAgICAgICAgICAgICAgdmFsdWVzOiBbJ2Fybjphd3M6czM6OjoqLyonXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIHR5cGU6ICdBV1M6OlMzOjpCdWNrZXQnLFxuICAgICAgICAgICAgICAgIHZhbHVlczogWydhcm46YXdzOnMzOjo6KiddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuXG4gICAgICAgIC8vIEFkdmFuY2VkIGV2ZW50IHNlbGVjdG9ycyBmb3IgbW9yZSBncmFudWxhciBsb2dnaW5nXG4gICAgICAgIGFkdmFuY2VkRXZlbnRTZWxlY3RvcnM6IFtcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnTG9nIGFsbCBTMyBkYXRhIGV2ZW50cycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnRGF0YSddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZXNvdXJjZXMudHlwZScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbJ0FXUzo6UzM6Ok9iamVjdCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgYWxsIElBTSBtYW5hZ2VtZW50IGV2ZW50cycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnTWFuYWdlbWVudCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudE5hbWUnLFxuICAgICAgICAgICAgICAgIGVxdWFsczogW1xuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVJvbGUnLFxuICAgICAgICAgICAgICAgICAgJ0F0dGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ0RldGFjaFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ1B1dFJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVJvbGVQb2xpY3knLFxuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZVVzZXInLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVVzZXInLFxuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZUFjY2Vzc0tleScsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlQWNjZXNzS2V5JyxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgYWxsIEtNUyBrZXkgb3BlcmF0aW9ucycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnTWFuYWdlbWVudCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZXNvdXJjZXMudHlwZScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbJ0FXUzo6S01TOjpLZXknXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnTG9nIHNlY3VyaXR5IGdyb3VwIGNoYW5nZXMnLFxuICAgICAgICAgICAgZmllbGRTZWxlY3RvcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAnZXZlbnRDYXRlZ29yeScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbJ01hbmFnZW1lbnQnXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAnZXZlbnROYW1lJyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFtcbiAgICAgICAgICAgICAgICAgICdDcmVhdGVTZWN1cml0eUdyb3VwJyxcbiAgICAgICAgICAgICAgICAgICdEZWxldGVTZWN1cml0eUdyb3VwJyxcbiAgICAgICAgICAgICAgICAgICdBdXRob3JpemVTZWN1cml0eUdyb3VwSW5ncmVzcycsXG4gICAgICAgICAgICAgICAgICAnQXV0aG9yaXplU2VjdXJpdHlHcm91cEVncmVzcycsXG4gICAgICAgICAgICAgICAgICAnUmV2b2tlU2VjdXJpdHlHcm91cEluZ3Jlc3MnLFxuICAgICAgICAgICAgICAgICAgJ1Jldm9rZVNlY3VyaXR5R3JvdXBFZ3Jlc3MnLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gRW5hYmxlIGluc2lnaHRzIGZvciBhbm9tYWx5IGRldGVjdGlvblxuICAgICAgICBpbnNpZ2h0U2VsZWN0b3JzOiBhcmdzLmVuYWJsZUluc2lnaHRTZWxlY3RvcnNcbiAgICAgICAgICA/IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGluc2lnaHRUeXBlOiAnQXBpQ2FsbFJhdGVJbnNpZ2h0JyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF1cbiAgICAgICAgICA6IHVuZGVmaW5lZCxcblxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzLCBkZXBlbmRzT246IFtjbG91ZFRyYWlsUG9saWN5XSB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBtZXRyaWMgZmlsdGVyIGZvciBzZWN1cml0eSBldmVudHNcbiAgICB0aGlzLm1ldHJpY0ZpbHRlciA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dNZXRyaWNGaWx0ZXIoXG4gICAgICBgJHtuYW1lfS1zZWN1cml0eS1ldmVudHNgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHtuYW1lfS1zZWN1cml0eS1ldmVudHMtZmlsdGVyYCxcbiAgICAgICAgbG9nR3JvdXBOYW1lOiB0aGlzLmxvZ0dyb3VwLm5hbWUsXG4gICAgICAgIHBhdHRlcm46XG4gICAgICAgICAgJ1t2ZXJzaW9uLCBhY2NvdW50LCB0aW1lLCByZWdpb24sIHNvdXJjZSwgbmFtZT1cIkNvbnNvbGVMb2dpblwiIHx8IG5hbWU9XCJBc3N1bWVSb2xlXCIgfHwgbmFtZT1cIkNyZWF0ZVJvbGVcIiB8fCBuYW1lPVwiRGVsZXRlUm9sZVwiIHx8IG5hbWU9XCJBdHRhY2hSb2xlUG9saWN5XCIgfHwgbmFtZT1cIkRldGFjaFJvbGVQb2xpY3lcIl0nLFxuICAgICAgICBtZXRyaWNUcmFuc2Zvcm1hdGlvbjoge1xuICAgICAgICAgIG5hbWU6IGAke25hbWV9LVNlY3VyaXR5RXZlbnRzYCxcbiAgICAgICAgICBuYW1lc3BhY2U6ICdTZWN1cml0eS9DbG91ZFRyYWlsJyxcbiAgICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICAgIGRlZmF1bHRWYWx1ZTogJzAnLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggYWxhcm0gZm9yIHN1c3BpY2lvdXMgYWN0aXZpdHlcbiAgICB0aGlzLmFsYXJtID0gbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgYCR7bmFtZX0tc2VjdXJpdHktYWxhcm1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHtuYW1lfS1zdXNwaWNpb3VzLWFjdGl2aXR5YCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FsYXJtIGZvciBzdXNwaWNpb3VzIHNlY3VyaXR5LXJlbGF0ZWQgYWN0aXZpdGllcycsXG4gICAgICAgIG1ldHJpY05hbWU6IGAke25hbWV9LVNlY3VyaXR5RXZlbnRzYCxcbiAgICAgICAgbmFtZXNwYWNlOiAnU2VjdXJpdHkvQ2xvdWRUcmFpbCcsXG4gICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgIHBlcmlvZDogMzAwLCAvLyA1IG1pbnV0ZXNcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDEsXG4gICAgICAgIHRocmVzaG9sZDogMTAsIC8vIEFsZXJ0IGlmIG1vcmUgdGhhbiAxMCBzZWN1cml0eSBldmVudHMgaW4gNSBtaW51dGVzXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgYWxhcm1BY3Rpb25zOiBbXSwgLy8gQWRkIFNOUyB0b3BpYyBBUk4gaGVyZSBmb3Igbm90aWZpY2F0aW9uc1xuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgdHJhaWxBcm46IHRoaXMudHJhaWwuYXJuLFxuICAgICAgdHJhaWxOYW1lOiB0aGlzLnRyYWlsLm5hbWUsXG4gICAgICBsb2dHcm91cEFybjogdGhpcy5sb2dHcm91cC5hcm4sXG4gICAgICBtZXRyaWNGaWx0ZXJOYW1lOiB0aGlzLm1ldHJpY0ZpbHRlci5uYW1lLFxuICAgICAgYWxhcm1OYW1lOiB0aGlzLmFsYXJtLm5hbWUsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==