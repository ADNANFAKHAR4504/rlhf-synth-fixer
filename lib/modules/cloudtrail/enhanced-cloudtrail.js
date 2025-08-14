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
                    name: 'Log all management events',
                    fieldSelectors: [
                        {
                            field: 'eventCategory',
                            equals: ['Management'],
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW5oYW5jZWQtY2xvdWR0cmFpbC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImVuaGFuY2VkLWNsb3VkdHJhaWwudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUEsaURBQW1DO0FBQ25DLHVEQUF5QztBQUN6Qyw0Q0FBK0M7QUFhL0MsTUFBYSxrQkFBbUIsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzlDLEtBQUssQ0FBdUI7SUFDNUIsUUFBUSxDQUEwQjtJQUNsQyxTQUFTLENBQTJCO0lBQ3BDLFlBQVksQ0FBaUM7SUFDN0MsS0FBSyxDQUE2QjtJQUVsRCxZQUNFLElBQVksRUFDWixJQUE0QixFQUM1QixJQUFzQztRQUV0QyxLQUFLLENBQUMsb0NBQW9DLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1RCxtRUFBbUU7UUFDbkUsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUN6QyxHQUFHLElBQUksWUFBWSxFQUNuQjtZQUNFLElBQUksRUFBRSxtQkFBbUIsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLEVBQUU7WUFDakQsZUFBZSxFQUFFLElBQUksRUFBRSx1Q0FBdUM7WUFDOUQsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLElBQUksRUFBRSxFQUFFLEdBQUcsaUJBQVUsRUFBRSxHQUFHLElBQUksQ0FBQyxJQUFJLEVBQUU7U0FDdEMsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLCtCQUErQjtRQUMvQixJQUFJLENBQUMsU0FBUyxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxTQUFTLENBQzNDLEdBQUcsSUFBSSxhQUFhLEVBQ3BCO1lBQ0UsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLFNBQVM7WUFDeEMsWUFBWSxF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QUFVLEVBQUUsR0FBRyxJQUFJLENBQUMsSUFBSSxFQUFFO1NBQ3RDLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFFBQVEsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUc7WUFDeEIsU0FBUyxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSTtZQUMxQixXQUFXLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxHQUFHO1lBQzlCLGdCQUFnQixFQUFFLElBQUksQ0FBQyxZQUFZLENBQUMsSUFBSTtZQUN4QyxTQUFTLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJO1NBQzNCLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXRMRCxnREFzTEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IGNvbW1vblRhZ3MgfSBmcm9tICcuLi8uLi9jb25maWcvdGFncyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgRW5oYW5jZWRDbG91ZFRyYWlsQXJncyB7XG4gIHRyYWlsTmFtZT86IHN0cmluZztcbiAgczNCdWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAga21zS2V5SWQ6IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBpbmNsdWRlR2xvYmFsU2VydmljZUV2ZW50cz86IGJvb2xlYW47XG4gIGlzTXVsdGlSZWdpb25UcmFpbD86IGJvb2xlYW47XG4gIGVuYWJsZUxvZ0ZpbGVWYWxpZGF0aW9uPzogYm9vbGVhbjtcbiAgZW5hYmxlSW5zaWdodFNlbGVjdG9ycz86IGJvb2xlYW47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgY2xhc3MgRW5oYW5jZWRDbG91ZFRyYWlsIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHRyYWlsOiBhd3MuY2xvdWR0cmFpbC5UcmFpbDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ1N0cmVhbTogYXdzLmNsb3Vkd2F0Y2guTG9nU3RyZWFtO1xuICBwdWJsaWMgcmVhZG9ubHkgbWV0cmljRmlsdGVyOiBhd3MuY2xvdWR3YXRjaC5Mb2dNZXRyaWNGaWx0ZXI7XG4gIHB1YmxpYyByZWFkb25seSBhbGFybTogYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm07XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEVuaGFuY2VkQ2xvdWRUcmFpbEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2N1c3RvbTpzZWN1cml0eTpFbmhhbmNlZENsb3VkVHJhaWwnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBDcmVhdGUgQ2xvdWRXYXRjaCBMb2cgR3JvdXAgZm9yIENsb3VkVHJhaWwgd2l0aCBsb25nZXIgcmV0ZW50aW9uXG4gICAgdGhpcy5sb2dHcm91cCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cChcbiAgICAgIGAke25hbWV9LWxvZy1ncm91cGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXdzL2Nsb3VkdHJhaWwvJHthcmdzLnRyYWlsTmFtZSB8fCBuYW1lfWAsXG4gICAgICAgIHJldGVudGlvbkluRGF5czogMjU1NywgLy8gNyB5ZWFycyBmb3IgY29tcGxpYW5jZSAodmFsaWQgdmFsdWUpXG4gICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICB0YWdzOiB7IC4uLmNvbW1vblRhZ3MsIC4uLmFyZ3MudGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggTG9nIFN0cmVhbVxuICAgIHRoaXMubG9nU3RyZWFtID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ1N0cmVhbShcbiAgICAgIGAke25hbWV9LWxvZy1zdHJlYW1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgJHthcmdzLnRyYWlsTmFtZSB8fCBuYW1lfS1zdHJlYW1gLFxuICAgICAgICBsb2dHcm91cE5hbWU6IHRoaXMubG9nR3JvdXAubmFtZSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBJQU0gcm9sZSBmb3IgQ2xvdWRUcmFpbCB0byB3cml0ZSB0byBDbG91ZFdhdGNoXG4gICAgY29uc3QgY2xvdWRUcmFpbFJvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYCR7bmFtZX0tY2xvdWR0cmFpbC1yb2xlYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX0tY2xvdWR0cmFpbC1yb2xlYCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuaGFuY2VkIHBvbGljeSBmb3IgQ2xvdWRUcmFpbCB0byB3cml0ZSB0byBDbG91ZFdhdGNoXG4gICAgY29uc3QgY2xvdWRUcmFpbFBvbGljeSA9IG5ldyBhd3MuaWFtLlJvbGVQb2xpY3koXG4gICAgICBgJHtuYW1lfS1jbG91ZHRyYWlsLXBvbGljeWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IGNsb3VkVHJhaWxSb2xlLmlkLFxuICAgICAgICBwb2xpY3k6IHB1bHVtaS5pbnRlcnBvbGF0ZWB7XG4gICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgXCJTdGF0ZW1lbnRcIjogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgIFwiQWN0aW9uXCI6IFtcbiAgICAgICAgICAgICAgXCJsb2dzOlB1dExvZ0V2ZW50c1wiLFxuICAgICAgICAgICAgICBcImxvZ3M6Q3JlYXRlTG9nR3JvdXBcIixcbiAgICAgICAgICAgICAgXCJsb2dzOkNyZWF0ZUxvZ1N0cmVhbVwiLFxuICAgICAgICAgICAgICBcImxvZ3M6RGVzY3JpYmVMb2dTdHJlYW1zXCIsXG4gICAgICAgICAgICAgIFwibG9nczpEZXNjcmliZUxvZ0dyb3Vwc1wiXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgXCJSZXNvdXJjZVwiOiBcIiR7dGhpcy5sb2dHcm91cC5hcm59OipcIlxuICAgICAgICAgIH1cbiAgICAgICAgXVxuICAgICAgfWAsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgZW5oYW5jZWQgQ2xvdWRUcmFpbCB3aXRoIGNvbXByZWhlbnNpdmUgZXZlbnQgc2VsZWN0b3JzXG4gICAgdGhpcy50cmFpbCA9IG5ldyBhd3MuY2xvdWR0cmFpbC5UcmFpbChcbiAgICAgIGAke25hbWV9LXRyYWlsYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYXJncy50cmFpbE5hbWUsXG4gICAgICAgIHMzQnVja2V0TmFtZTogYXJncy5zM0J1Y2tldE5hbWUsXG4gICAgICAgIHMzS2V5UHJlZml4OiAnY2xvdWR0cmFpbC1sb2dzJyxcbiAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IGFyZ3MuaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHMgPz8gdHJ1ZSxcbiAgICAgICAgaXNNdWx0aVJlZ2lvblRyYWlsOiBhcmdzLmlzTXVsdGlSZWdpb25UcmFpbCA/PyB0cnVlLFxuICAgICAgICBlbmFibGVMb2dGaWxlVmFsaWRhdGlvbjogYXJncy5lbmFibGVMb2dGaWxlVmFsaWRhdGlvbiA/PyB0cnVlLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgY2xvdWRXYXRjaExvZ3NHcm91cEFybjogcHVsdW1pLmludGVycG9sYXRlYCR7dGhpcy5sb2dHcm91cC5hcm59OipgLFxuICAgICAgICBjbG91ZFdhdGNoTG9nc1JvbGVBcm46IGNsb3VkVHJhaWxSb2xlLmFybixcblxuICAgICAgICAvLyBBZHZhbmNlZCBldmVudCBzZWxlY3RvcnMgZm9yIG1vcmUgZ3JhbnVsYXIgbG9nZ2luZ1xuICAgICAgICBhZHZhbmNlZEV2ZW50U2VsZWN0b3JzOiBbXG4gICAgICAgICAge1xuICAgICAgICAgICAgbmFtZTogJ0xvZyBhbGwgUzMgZGF0YSBldmVudHMnLFxuICAgICAgICAgICAgZmllbGRTZWxlY3RvcnM6IFtcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAnZXZlbnRDYXRlZ29yeScsXG4gICAgICAgICAgICAgICAgZXF1YWxzOiBbJ0RhdGEnXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGZpZWxkOiAncmVzb3VyY2VzLnR5cGUnLFxuICAgICAgICAgICAgICAgIGVxdWFsczogWydBV1M6OlMzOjpPYmplY3QnXSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgfSxcbiAgICAgICAgICB7XG4gICAgICAgICAgICBuYW1lOiAnTG9nIGFsbCBtYW5hZ2VtZW50IGV2ZW50cycsXG4gICAgICAgICAgICBmaWVsZFNlbGVjdG9yczogW1xuICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZmllbGQ6ICdldmVudENhdGVnb3J5JyxcbiAgICAgICAgICAgICAgICBlcXVhbHM6IFsnTWFuYWdlbWVudCddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuXG4gICAgICAgIC8vIEVuYWJsZSBpbnNpZ2h0cyBmb3IgYW5vbWFseSBkZXRlY3Rpb25cbiAgICAgICAgaW5zaWdodFNlbGVjdG9yczogYXJncy5lbmFibGVJbnNpZ2h0U2VsZWN0b3JzXG4gICAgICAgICAgPyBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBpbnNpZ2h0VHlwZTogJ0FwaUNhbGxSYXRlSW5zaWdodCcsXG4gICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdXG4gICAgICAgICAgOiB1bmRlZmluZWQsXG5cbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcywgZGVwZW5kc09uOiBbY2xvdWRUcmFpbFBvbGljeV0gfVxuICAgICk7XG5cbiAgICAvLyBDcmVhdGUgbWV0cmljIGZpbHRlciBmb3Igc2VjdXJpdHkgZXZlbnRzXG4gICAgdGhpcy5tZXRyaWNGaWx0ZXIgPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTG9nTWV0cmljRmlsdGVyKFxuICAgICAgYCR7bmFtZX0tc2VjdXJpdHktZXZlbnRzYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX0tc2VjdXJpdHktZXZlbnRzLWZpbHRlcmAsXG4gICAgICAgIGxvZ0dyb3VwTmFtZTogdGhpcy5sb2dHcm91cC5uYW1lLFxuICAgICAgICBwYXR0ZXJuOlxuICAgICAgICAgICdbdmVyc2lvbiwgYWNjb3VudCwgdGltZSwgcmVnaW9uLCBzb3VyY2UsIG5hbWU9XCJDb25zb2xlTG9naW5cIiB8fCBuYW1lPVwiQXNzdW1lUm9sZVwiIHx8IG5hbWU9XCJDcmVhdGVSb2xlXCIgfHwgbmFtZT1cIkRlbGV0ZVJvbGVcIiB8fCBuYW1lPVwiQXR0YWNoUm9sZVBvbGljeVwiIHx8IG5hbWU9XCJEZXRhY2hSb2xlUG9saWN5XCJdJyxcbiAgICAgICAgbWV0cmljVHJhbnNmb3JtYXRpb246IHtcbiAgICAgICAgICBuYW1lOiBgJHthcmdzLnRyYWlsTmFtZSB8fCBuYW1lfS1TZWN1cml0eUV2ZW50c2AsXG4gICAgICAgICAgbmFtZXNwYWNlOiAnU2VjdXJpdHkvQ2xvdWRUcmFpbCcsXG4gICAgICAgICAgdmFsdWU6ICcxJyxcbiAgICAgICAgICBkZWZhdWx0VmFsdWU6ICcwJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIGFsYXJtIGZvciBzdXNwaWNpb3VzIGFjdGl2aXR5XG4gICAgdGhpcy5hbGFybSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGAke25hbWV9LXNlY3VyaXR5LWFsYXJtYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYCR7YXJncy50cmFpbE5hbWUgfHwgbmFtZX0tc3VzcGljaW91cy1hY3Rpdml0eWAsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGFybSBmb3Igc3VzcGljaW91cyBzZWN1cml0eS1yZWxhdGVkIGFjdGl2aXRpZXMnLFxuICAgICAgICBtZXRyaWNOYW1lOiBgJHthcmdzLnRyYWlsTmFtZSB8fCBuYW1lfS1TZWN1cml0eUV2ZW50c2AsXG4gICAgICAgIG5hbWVzcGFjZTogJ1NlY3VyaXR5L0Nsb3VkVHJhaWwnLFxuICAgICAgICBzdGF0aXN0aWM6ICdTdW0nLFxuICAgICAgICBwZXJpb2Q6IDMwMCwgLy8gNSBtaW51dGVzXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICB0aHJlc2hvbGQ6IDEwLCAvLyBBbGVydCBpZiBtb3JlIHRoYW4gMTAgc2VjdXJpdHkgZXZlbnRzIGluIDUgbWludXRlc1xuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGFsYXJtQWN0aW9uczogW10sIC8vIEFkZCBTTlMgdG9waWMgQVJOIGhlcmUgZm9yIG5vdGlmaWNhdGlvbnNcbiAgICAgICAgdGFnczogeyAuLi5jb21tb25UYWdzLCAuLi5hcmdzLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHRyYWlsQXJuOiB0aGlzLnRyYWlsLmFybixcbiAgICAgIHRyYWlsTmFtZTogdGhpcy50cmFpbC5uYW1lLFxuICAgICAgbG9nR3JvdXBBcm46IHRoaXMubG9nR3JvdXAuYXJuLFxuICAgICAgbWV0cmljRmlsdGVyTmFtZTogdGhpcy5tZXRyaWNGaWx0ZXIubmFtZSxcbiAgICAgIGFsYXJtTmFtZTogdGhpcy5hbGFybS5uYW1lLFxuICAgIH0pO1xuICB9XG59XG4iXX0=