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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtY2xvdWR0cmFpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVuaGFuY2VkLWNsb3VkdHJhaWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6Qyw0Q0FBK0M7QUFhL0MsTUFBYSxrQkFBbUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLEtBQUssQ0FBdUI7SUFDNUIsUUFBUSxDQUEwQjtJQUNsQyxTQUFTLENBQTJCO0lBQ3BDLFlBQVksQ0FBaUM7SUFDN0MsS0FBSyxDQUE2QjtJQUVsRCxZQUNFLElBQVksRUFDWixJQUE0QixFQUM1QixJQUFzQztRQUV0QyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1RCxtRUFBbUU7UUFDbkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUN6QyxHQUFHLElBQUksWUFBWSxFQUNuQjtZQUNFLElBQUksRUFBRSxtQkFBbUIsSUFBSSxFQUFFO1lBQy9CLGVBQWUsRUFBRSxJQUFJLEVBQUUsdUNBQXVDO1lBQzlELFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixJQUFJLEVBQUUsRUFBRSxHQUFHLGlCQUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3RDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRiwrQkFBK0I7UUFDL0IsSUFBSSxDQUFDLFNBQVMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsU0FBUyxDQUMzQyxHQUFHLElBQUksYUFBYSxFQUNwQjtZQUNFLElBQUksRUFBRSxHQUFHLElBQUksU0FBUztZQUN0QixZQUFZLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxJQUFJO1NBQ2pDLEVBQ0Qs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SUFBSTtZQUMxQixXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHO1lBQzlCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSTtZQUN4QyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1NBQzNCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZQRCxnREF1UEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRDbG91ZFRyYWlsQXJncyB7XG4gIHRyYWlsTmFtZT86IHN0cmluZztcbiAgczNCdWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAga21zS2V5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBpbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50cz86IGJvb2xlYW47XG4gIGlzTXVsdGlSZWdpb25UcmFpbD86IGJvb2xlYW47XG4gIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uPzogYm9vbGVhbjtcbiAgZW5hYmxlSW5zaWdodFNlbGVjdG9ycz86IGJvb2xlYW47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgRW5oYW5jZWRDbG91ZFRyYWlsIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHRyYWlsOiBhd3MuY2xvdWR0cmFpbC5UcmFpbDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ1N0cmVhbTogYXdzLmNsb3Vkd2F0Y2guTG9nU3RyZWFtO1xuICBwdWJsaWMgcmVhZG9ubHkgbWV0cmljRmlsdGVyOiBhd3MuY2xvdWR3YXRjaC5Mb2dNZXRyaWNGaWx0ZXI7XG4gIHB1YmxpYyByZWFkb25seSBhbGFybTogYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEVuaGFuY2VkQ2xvdWRUcmFpbEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpFbmhhbmNlZENsb3VkVHJhaWwnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBMb2cgR3JvdXAgZm9yIENsb3VkVHJhaWwgd2l0aCBsb25nZXIgcmV0ZW50aW9uXG4gICAgdGhpcy5sb2dHcm91cCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cChcbiAgICAgIGAke25hbWV9LWxvZy1ncm91cGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXdzL2Nsb3VkdHJhaWwvJHtuYW1lfWAsXG4gICAgICAgIHJldGVudGlvbkluRGF5czogMjU1NywgLy8gNyB5ZWFycyBmb3IgY29tcGxpYW5jZSAodmFsaWQgdmFsdWUpXG4gICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggTG9nIFN0cmVhbVxuICAgIHRoaXMubG9nU3RyZWFtID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ1N0cmVhbShcbiAgICAgIGAke25hbWV9LWxvZy1zdHJlYW1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHtuYW1lfS1zdHJlYW1gLFxuICAgICAgICBsb2dHcm91cE5hbWU6IHRoaXMubG9nR3JvdXAubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgQ2xvdWRUcmFpbCB0byB3cml0ZSB0byBDbG91ZFdhdGNoXG4gICAgY29uc3QgY2xvdWRUcmFpbFJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYCR7bmFtZX0tY2xvdWR0cmFpbC1yb2xlYCxcbiAgICAgIHtcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuaGFuY2VkIHBvbGljeSBmb3IgQ2xvdWRUcmFpbCB0byB3cml0ZSB0byBDbG91ZFdhdGNoXG4gICAgY29uc3QgY2xvdWRUcmFpbFBvbGljeSA9IG5ldyBhd3MuaWFtLlJvbGVQb2xpY3koXG4gICAgICBgJHtuYW1lfS1jbG91ZHRyYWlsLXBvbGljeWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IGNsb3VkVHJhaWxSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaS5pbnRlcnBvbGF0ZWB7XG4gICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICAgICAgXCJsb2dzOlB1dExvZ0V2ZW50c1wiLFxuICAgICAgICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nR3JvdXBcIixcbiAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ1N0cmVhbVwiLFxuICAgICAgICAgICAgICBcImxvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zXCIsXG4gICAgICAgICAgICAgIFwibG9nczpEZXNjcmliZUxvZ0dyb3Vwc1wiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7dGhpcy5sb2dHcm91cC5hcm59OipcIlxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfWAsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgQ2xvdWRUcmFpbCB3aXRoIGNvbXByZWhlbnNpdmUgZXZlbnQgc2VsZWN0b3JzXG4gICAgdGhpcy50cmFpbCA9IG5ldyBhd3MuY2xvdWR0cmFpbC5UcmFpbChcbiAgICAgIGAke25hbWV9LXRyYWlsYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy50cmFpbE5hbWUsXG4gICAgICAgIHMzQnVja2V0TmFtZTogYXJncy5zM0J1Y2tldE5hbWUsXG4gICAgICAgIHMzS2V5UHJlZml4OiAnY2xvdWR0cmFpbC1sb2dzJyxcbiAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IGFyZ3MuaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHMgPz8gdHJ1ZSxcbiAgICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiBhcmdzLmlzTXVsdGlSZWdpb25UcmFpbCA/PyB0cnVlLFxuICAgICAgICBlbmFibGVMb2dGaWxlVmFsaWRhdGlvbjogYXJncy5lbmFibGVMb2dGaWxlVmFsaWRhdGlvbiA/PyB0cnVlLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgY2xvdWRXYXRjaExvZ3NHcm91cEFybjogcHVsdW1pLmludGVycG9sYXRlYCR7dGhpcy5sb2dHcm91cC5hcm59OipgLFxuICAgICAgICBjbG91ZFdhdGNoTG9nc1JvbGVBcm46IGNsb3VkVHJhaWxSb2xlLmFybixcblxuICAgICAgICAvLyBDb21wcmVoZW5zaXZlIGV2ZW50IHNlbGVjdG9ycyBmb3IgbWF4aW11bSBhdWRpdCBjb3ZlcmFnZVxuICAgICAgICBldmVudFNlbGVjdG9yczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlYWRXcml0ZVR5cGU6ICdBbGwnLFxuICAgICAgICAgICAgaW5jbHVkZU1hbmFnZW1lbnRFdmVudHM6IHRydWUsXG4gICAgICAgICAgICBkYXRhUmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnQVdTOjpTMzo6T2JqZWN0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZXM6IFsnYXJuOmF3czpzMzo6OiovKiddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgdHlwZTogJ0FXUzo6UzM6OkJ1Y2tldCcsXG4gICAgICAgICAgICAgICAgdmFsdWVzOiBbJ2Fybjphd3M6czM6OjoqJ10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgIF0sXG5cbiAgICAgICAgLy8gQWR2YW5jZWQgZXZlbnQgc2VsZWN0b3JzIGZvciBtb3JlIGdyYW51bGFyIGxvZ2dpbmdcbiAgICAgICAgYWR2YW5jZWRFdmVudFNlbGVjdG9yczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgYWxsIFMzIGRhdGEgZXZlbnRzJyxcbiAgICAgICAgICAgIGZpZWxkU2VsZWN0b3JzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50Q2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGVxdWFsczogWydEYXRhJ10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3Jlc291cmNlcy50eXBlJyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnQVdTOjpTMzo6T2JqZWN0J10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0xvZyBhbGwgSUFNIG1hbmFnZW1lbnQgZXZlbnRzJyxcbiAgICAgICAgICAgIGZpZWxkU2VsZWN0b3JzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50Q2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGVxdWFsczogWydNYW5hZ2VtZW50J10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50TmFtZScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbXG4gICAgICAgICAgICAgICAgICAnQ3JlYXRlUm9sZScsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlUm9sZScsXG4gICAgICAgICAgICAgICAgICAnQXR0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnRGV0YWNoUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnUHV0Um9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlUm9sZVBvbGljeScsXG4gICAgICAgICAgICAgICAgICAnQ3JlYXRlVXNlcicsXG4gICAgICAgICAgICAgICAgICAnRGVsZXRlVXNlcicsXG4gICAgICAgICAgICAgICAgICAnQ3JlYXRlQWNjZXNzS2V5JyxcbiAgICAgICAgICAgICAgICAgICdEZWxldGVBY2Nlc3NLZXknLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgIH0sXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0xvZyBhbGwgS01TIGtleSBvcGVyYXRpb25zJyxcbiAgICAgICAgICAgIGZpZWxkU2VsZWN0b3JzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2V2ZW50Q2F0ZWdvcnknLFxuICAgICAgICAgICAgICAgIGVxdWFsczogWydNYW5hZ2VtZW50J10sXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3Jlc291cmNlcy50eXBlJyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnQVdTOjpLTVM6OktleSddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIG5hbWU6ICdMb2cgc2VjdXJpdHkgZ3JvdXAgY2hhbmdlcycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnTWFuYWdlbWVudCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudE5hbWUnLFxuICAgICAgICAgICAgICAgIGVxdWFsczogW1xuICAgICAgICAgICAgICAgICAgJ0NyZWF0ZVNlY3VyaXR5R3JvdXAnLFxuICAgICAgICAgICAgICAgICAgJ0RlbGV0ZVNlY3VyaXR5R3JvdXAnLFxuICAgICAgICAgICAgICAgICAgJ0F1dGhvcml6ZVNlY3VyaXR5R3JvdXBJbmdyZXNzJyxcbiAgICAgICAgICAgICAgICAgICdBdXRob3JpemVTZWN1cml0eUdyb3VwRWdyZXNzJyxcbiAgICAgICAgICAgICAgICAgICdSZXZva2VTZWN1cml0eUdyb3VwSW5ncmVzcycsXG4gICAgICAgICAgICAgICAgICAnUmV2b2tlU2VjdXJpdHlHcm91cEVncmVzcycsXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgXSxcblxuICAgICAgICAvLyBFbmFibGUgaW5zaWdodHMgZm9yIGFub21hbHkgZGV0ZWN0aW9uXG4gICAgICAgIGluc2lnaHRTZWxlY3RvcnM6IGFyZ3MuZW5hYmxlSW5zaWdodFNlbGVjdG9yc1xuICAgICAgICAgID8gW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaW5zaWdodFR5cGU6ICdBcGlDYWxsUmF0ZUluc2lnaHQnLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXVxuICAgICAgICAgIDogdW5kZWZpbmVkLFxuXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMsIGRlcGVuZHNPbjogW2Nsb3VkVHJhaWxQb2xpY3ldIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIG1ldHJpYyBmaWx0ZXIgZm9yIHNlY3VyaXR5IGV2ZW50c1xuICAgIHRoaXMubWV0cmljRmlsdGVyID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ01ldHJpY0ZpbHRlcihcbiAgICAgIGAke25hbWV9LXNlY3VyaXR5LWV2ZW50c2AsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke25hbWV9LXNlY3VyaXR5LWV2ZW50cy1maWx0ZXJgLFxuICAgICAgICBsb2dHcm91cE5hbWU6IHRoaXMubG9nR3JvdXAubmFtZSxcbiAgICAgICAgcGF0dGVybjpcbiAgICAgICAgICAnW3ZlcnNpb24sIGFjY291bnQsIHRpbWUsIHJlZ2lvbiwgc291cmNlLCBuYW1lPVwiQ29uc29sZUxvZ2luXCIgfHwgbmFtZT1cIkFzc3VtZVJvbGVcIiB8fCBuYW1lPVwiQ3JlYXRlUm9sZVwiIHx8IG5hbWU9XCJEZWxldGVSb2xlXCIgfHwgbmFtZT1cIkF0dGFjaFJvbGVQb2xpY3lcIiB8fCBuYW1lPVwiRGV0YWNoUm9sZVBvbGljeVwiXScsXG4gICAgICAgIG1ldHJpY1RyYW5zZm9ybWF0aW9uOiB7XG4gICAgICAgICAgbmFtZTogYCR7bmFtZX0tU2VjdXJpdHlFdmVudHNgLFxuICAgICAgICAgIG5hbWVzcGFjZTogJ1NlY3VyaXR5L0Nsb3VkVHJhaWwnLFxuICAgICAgICAgIHZhbHVlOiAnMScsXG4gICAgICAgICAgZGVmYXVsdFZhbHVlOiAnMCcsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBhbGFybSBmb3Igc3VzcGljaW91cyBhY3Rpdml0eVxuICAgIHRoaXMuYWxhcm0gPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgJHtuYW1lfS1zZWN1cml0eS1hbGFybWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAke25hbWV9LXN1c3BpY2lvdXMtYWN0aXZpdHlgLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnQWxhcm0gZm9yIHN1c3BpY2lvdXMgc2VjdXJpdHktcmVsYXRlZCBhY3Rpdml0aWVzJyxcbiAgICAgICAgbWV0cmljTmFtZTogYCR7bmFtZX0tU2VjdXJpdHlFdmVudHNgLFxuICAgICAgICBuYW1lc3BhY2U6ICdTZWN1cml0eS9DbG91ZFRyYWlsJyxcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgcGVyaW9kOiAzMDAsIC8vIDUgbWludXRlc1xuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgdGhyZXNob2xkOiAxMCwgLy8gQWxlcnQgaWYgbW9yZSB0aGFuIDEwIHNlY3VyaXR5IGV2ZW50cyBpbiA1IG1pbnV0ZXNcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBhbGFybUFjdGlvbnM6IFtdLCAvLyBBZGQgU05TIHRvcGljIEFSTiBoZXJlIGZvciBub3RpZmljYXRpb25zXG4gICAgICAgIHRhZ3M6IHsgLi4uY29tbW9uVGFncywgLi4uYXJncy50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICB0cmFpbEFybjogdGhpcy50cmFpbC5hcm4sXG4gICAgICB0cmFpbE5hbWU6IHRoaXMudHJhaWwubmFtZSxcbiAgICAgIGxvZ0dyb3VwQXJuOiB0aGlzLmxvZ0dyb3VwLmFybixcbiAgICAgIG1ldHJpY0ZpbHRlck5hbWU6IHRoaXMubWV0cmljRmlsdGVyLm5hbWUsXG4gICAgICBhbGFybU5hbWU6IHRoaXMuYWxhcm0ubmFtZSxcbiAgICB9KTtcbiAgfVxufVxuIl19