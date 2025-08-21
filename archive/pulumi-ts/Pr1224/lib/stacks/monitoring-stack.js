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
exports.MonitoringStack = void 0;
/**
 * monitoring-stack.ts
 *
 * This module defines the MonitoringStack component for creating
 * VPC Flow Logs, CloudTrail, and other monitoring resources.
 */
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class MonitoringStack extends pulumi.ComponentResource {
    vpcFlowLogId;
    cloudTrailArn;
    cloudWatchLogGroupArn;
    constructor(name, args, opts) {
        super('tap:monitoring:MonitoringStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const tags = args.tags || {};
        // CloudWatch Log Group for VPC Flow Logs
        const vpcFlowLogGroup = new aws.cloudwatch.LogGroup(`tap-vpc-flow-logs-${environmentSuffix}`, {
            name: `/aws/vpc/flowlogs/${environmentSuffix}`,
            retentionInDays: 30,
            kmsKeyId: args.kmsKeyArn,
            tags: {
                Name: `tap-vpc-flow-logs-${environmentSuffix}`,
                Purpose: 'VPCFlowLogs',
                ...tags,
            },
        }, { parent: this });
        // IAM role for VPC Flow Logs
        const vpcFlowLogRole = new aws.iam.Role(`tap-vpc-flow-log-role-${environmentSuffix}`, {
            name: `tap-vpc-flow-log-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Effect: 'Allow',
                        Principal: {
                            Service: 'vpc-flow-logs.amazonaws.com',
                        },
                        Action: 'sts:AssumeRole',
                    },
                ],
            }),
            tags: {
                Name: `tap-vpc-flow-log-role-${environmentSuffix}`,
                Purpose: 'VPCFlowLogsExecution',
                ...tags,
            },
        }, { parent: this });
        // IAM policy for VPC Flow Logs
        new aws.iam.RolePolicy(`tap-vpc-flow-log-policy-${environmentSuffix}`, {
            role: vpcFlowLogRole.id,
            policy: pulumi.interpolate `{
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:DescribeLogGroups",
                "logs:DescribeLogStreams"
              ],
              "Resource": "${vpcFlowLogGroup.arn}:*"
            }
          ]
        }`,
        }, { parent: this });
        // VPC Flow Logs
        const vpcFlowLog = new aws.ec2.FlowLog(`tap-vpc-flow-log-${environmentSuffix}`, {
            iamRoleArn: vpcFlowLogRole.arn,
            logDestination: vpcFlowLogGroup.arn,
            logDestinationType: 'cloud-watch-logs',
            vpcId: args.vpcId,
            trafficType: 'ALL',
            logFormat: '${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action} ${flowlogstatus}',
            tags: {
                Name: `tap-vpc-flow-log-${environmentSuffix}`,
                Purpose: 'NetworkMonitoring',
                ...tags,
            },
        }, { parent: this });
        // CloudTrail S3 bucket policy
        const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(`tap-cloudtrail-bucket-policy-${environmentSuffix}`, {
            bucket: args.logsBucketName,
            policy: pulumi
                .all([args.logsBucketName, aws.getCallerIdentity()])
                .apply(([bucketName, _identity]) => JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Sid: 'AWSCloudTrailAclCheck',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudtrail.amazonaws.com',
                        },
                        Action: 's3:GetBucketAcl',
                        Resource: `arn:aws:s3:::${bucketName}`,
                    },
                    {
                        Sid: 'AWSCloudTrailWrite',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'cloudtrail.amazonaws.com',
                        },
                        Action: 's3:PutObject',
                        Resource: `arn:aws:s3:::${bucketName}/cloudtrail-logs/*`,
                        Condition: {
                            StringEquals: {
                                's3:x-amz-acl': 'bucket-owner-full-control',
                            },
                        },
                    },
                ],
            })),
        }, { parent: this });
        // CloudTrail
        const cloudTrail = new aws.cloudtrail.Trail(`tap-cloudtrail-${environmentSuffix}`, {
            name: `tap-cloudtrail-${environmentSuffix}`,
            s3BucketName: args.logsBucketName,
            s3KeyPrefix: 'cloudtrail-logs',
            includeGlobalServiceEvents: true,
            isMultiRegionTrail: true,
            enableLogging: true,
            kmsKeyId: args.kmsKeyArn,
            eventSelectors: [
                {
                    readWriteType: 'All',
                    includeManagementEvents: true,
                    dataResources: [
                        {
                            type: 'AWS::S3::Object',
                            values: ['arn:aws:s3:::*/*'],
                        },
                    ],
                },
            ],
            tags: {
                Name: `tap-cloudtrail-${environmentSuffix}`,
                Purpose: 'APIAuditing',
                ...tags,
            },
        }, {
            parent: this,
            dependsOn: [cloudTrailBucketPolicy],
        });
        // GuardDuty Detector
        new aws.guardduty.Detector(`tap-guardduty-${environmentSuffix}`, {
            enable: true,
            findingPublishingFrequency: 'FIFTEEN_MINUTES',
            datasources: {
                s3Logs: {
                    enable: true,
                },
                kubernetes: {
                    auditLogs: {
                        enable: true,
                    },
                },
                malwareProtection: {
                    scanEc2InstanceWithFindings: {
                        ebsVolumes: {
                            enable: true,
                        },
                    },
                },
            },
            tags: {
                Name: `tap-guardduty-${environmentSuffix}`,
                Purpose: 'ThreatDetection',
                ...tags,
            },
        }, { parent: this });
        this.vpcFlowLogId = vpcFlowLog.id;
        this.cloudTrailArn = cloudTrail.arn;
        this.cloudWatchLogGroupArn = vpcFlowLogGroup.arn;
        this.registerOutputs({
            vpcFlowLogId: this.vpcFlowLogId,
            cloudTrailArn: this.cloudTrailArn,
            cloudWatchLogGroupArn: this.cloudWatchLogGroupArn,
        });
    }
}
exports.MonitoringStack = MonitoringStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3Jpbmctc3RhY2sudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBQUE7Ozs7O0dBS0c7QUFDSCxpREFBbUM7QUFDbkMsdURBQXlDO0FBV3pDLE1BQWEsZUFBZ0IsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQzNDLFlBQVksQ0FBd0I7SUFDcEMsYUFBYSxDQUF3QjtJQUNyQyxxQkFBcUIsQ0FBd0I7SUFFN0QsWUFBWSxJQUFZLEVBQUUsSUFBeUIsRUFBRSxJQUFzQjtRQUN6RSxLQUFLLENBQUMsZ0NBQWdDLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUUxRCxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IseUNBQXlDO1FBQ3pDLE1BQU0sZUFBZSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQ2pELHFCQUFxQixpQkFBaUIsRUFBRSxFQUN4QztZQUNFLElBQUksRUFBRSxxQkFBcUIsaUJBQWlCLEVBQUU7WUFDOUMsZUFBZSxFQUFFLEVBQUU7WUFDbkIsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTO1lBQ3hCLElBQUksRUFBRTtnQkFDSixJQUFJLEVBQUUscUJBQXFCLGlCQUFpQixFQUFFO2dCQUM5QyxPQUFPLEVBQUUsYUFBYTtnQkFDdEIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsNkJBQTZCO1FBQzdCLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQ3JDLHlCQUF5QixpQkFBaUIsRUFBRSxF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MkIsRUFBRTt3QkFDM0IsVUFBVSxFQUFFOzRCQUNWLE1BQU0sRUFBRSxJQUFJO3lCQUNiO3FCQUNGO2lCQUNGO2FBQ0Y7WUFDRCxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLGlCQUFpQixpQkFBaUIsRUFBRTtnQkFDMUMsT0FBTyxFQUFFLGlCQUFpQjtnQkFDMUIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQztRQUNwQyxJQUFJLENBQUMscUJBQXFCLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQztRQUVqRCxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtZQUMvQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7WUFDakMscUJBQXFCLEVBQUUsSUFBSSxDQUFDLHFCQUFxQjtTQUNsRCxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF4TkQsMENBd05DIiwic291cmNlc0NvbnRlbnQiOlsiLyoqXG4gKiBtb25pdG9yaW5nLXN0YWNrLnRzXG4gKlxuICogVGhpcyBtb2R1bGUgZGVmaW5lcyB0aGUgTW9uaXRvcmluZ1N0YWNrIGNvbXBvbmVudCBmb3IgY3JlYXRpbmdcbiAqIFZQQyBGbG93IExvZ3MsIENsb3VkVHJhaWwsIGFuZCBvdGhlciBtb25pdG9yaW5nIHJlc291cmNlcy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9uaXRvcmluZ1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICB2cGNJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGxvZ3NCdWNrZXROYW1lOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAga21zS2V5QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIE1vbml0b3JpbmdTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSB2cGNGbG93TG9nSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkVHJhaWxBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGNsb3VkV2F0Y2hMb2dHcm91cEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogTW9uaXRvcmluZ1N0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6bW9uaXRvcmluZzpNb25pdG9yaW5nU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBMb2cgR3JvdXAgZm9yIFZQQyBGbG93IExvZ3NcbiAgICBjb25zdCB2cGNGbG93TG9nR3JvdXAgPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTG9nR3JvdXAoXG4gICAgICBgdGFwLXZwYy1mbG93LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgL2F3cy92cGMvZmxvd2xvZ3MvJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICByZXRlbnRpb25JbkRheXM6IDMwLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlBcm4sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXZwYy1mbG93LWxvZ3MtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdWUENGbG93TG9ncycsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIElBTSByb2xlIGZvciBWUEMgRmxvdyBMb2dzXG4gICAgY29uc3QgdnBjRmxvd0xvZ1JvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHRhcC12cGMtZmxvdy1sb2ctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtdnBjLWZsb3ctbG9nLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICd2cGMtZmxvdy1sb2dzLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC12cGMtZmxvdy1sb2ctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ1ZQQ0Zsb3dMb2dzRXhlY3V0aW9uJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gSUFNIHBvbGljeSBmb3IgVlBDIEZsb3cgTG9nc1xuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3koXG4gICAgICBgdGFwLXZwYy1mbG93LWxvZy1wb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiB2cGNGbG93TG9nUm9sZS5pZCxcbiAgICAgICAgcG9saWN5OiBwdWx1bWkuaW50ZXJwb2xhdGVge1xuICAgICAgICAgIFwiVmVyc2lvblwiOiBcIjIwMTItMTAtMTdcIixcbiAgICAgICAgICBcIlN0YXRlbWVudFwiOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIFwiRWZmZWN0XCI6IFwiQWxsb3dcIixcbiAgICAgICAgICAgICAgXCJBY3Rpb25cIjogW1xuICAgICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dHcm91cFwiLFxuICAgICAgICAgICAgICAgIFwibG9nczpDcmVhdGVMb2dTdHJlYW1cIixcbiAgICAgICAgICAgICAgICBcImxvZ3M6UHV0TG9nRXZlbnRzXCIsXG4gICAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nR3JvdXBzXCIsXG4gICAgICAgICAgICAgICAgXCJsb2dzOkRlc2NyaWJlTG9nU3RyZWFtc1wiXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgIFwiUmVzb3VyY2VcIjogXCIke3ZwY0Zsb3dMb2dHcm91cC5hcm59OipcIlxuICAgICAgICAgICAgfVxuICAgICAgICAgIF1cbiAgICAgICAgfWAsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBWUEMgRmxvdyBMb2dzXG4gICAgY29uc3QgdnBjRmxvd0xvZyA9IG5ldyBhd3MuZWMyLkZsb3dMb2coXG4gICAgICBgdGFwLXZwYy1mbG93LWxvZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGlhbVJvbGVBcm46IHZwY0Zsb3dMb2dSb2xlLmFybixcbiAgICAgICAgbG9nRGVzdGluYXRpb246IHZwY0Zsb3dMb2dHcm91cC5hcm4sXG4gICAgICAgIGxvZ0Rlc3RpbmF0aW9uVHlwZTogJ2Nsb3VkLXdhdGNoLWxvZ3MnLFxuICAgICAgICB2cGNJZDogYXJncy52cGNJZCxcbiAgICAgICAgdHJhZmZpY1R5cGU6ICdBTEwnLFxuICAgICAgICBsb2dGb3JtYXQ6XG4gICAgICAgICAgJyR7dmVyc2lvbn0gJHthY2NvdW50LWlkfSAke2ludGVyZmFjZS1pZH0gJHtzcmNhZGRyfSAke2RzdGFkZHJ9ICR7c3JjcG9ydH0gJHtkc3Rwb3J0fSAke3Byb3RvY29sfSAke3BhY2tldHN9ICR7Ynl0ZXN9ICR7d2luZG93c3RhcnR9ICR7d2luZG93ZW5kfSAke2FjdGlvbn0gJHtmbG93bG9nc3RhdHVzfScsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXZwYy1mbG93LWxvZy0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ05ldHdvcmtNb25pdG9yaW5nJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ2xvdWRUcmFpbCBTMyBidWNrZXQgcG9saWN5XG4gICAgY29uc3QgY2xvdWRUcmFpbEJ1Y2tldFBvbGljeSA9IG5ldyBhd3MuczMuQnVja2V0UG9saWN5KFxuICAgICAgYHRhcC1jbG91ZHRyYWlsLWJ1Y2tldC1wb2xpY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBidWNrZXQ6IGFyZ3MubG9nc0J1Y2tldE5hbWUsXG4gICAgICAgIHBvbGljeTogcHVsdW1pXG4gICAgICAgICAgLmFsbChbYXJncy5sb2dzQnVja2V0TmFtZSwgYXdzLmdldENhbGxlcklkZW50aXR5KCldKVxuICAgICAgICAgIC5hcHBseSgoW2J1Y2tldE5hbWUsIF9pZGVudGl0eV0pID0+XG4gICAgICAgICAgICBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgU2lkOiAnQVdTQ2xvdWRUcmFpbEFjbENoZWNrJyxcbiAgICAgICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgICAgICBTZXJ2aWNlOiAnY2xvdWR0cmFpbC5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICBBY3Rpb246ICdzMzpHZXRCdWNrZXRBY2wnLFxuICAgICAgICAgICAgICAgICAgUmVzb3VyY2U6IGBhcm46YXdzOnMzOjo6JHtidWNrZXROYW1lfWAsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICBTaWQ6ICdBV1NDbG91ZFRyYWlsV3JpdGUnLFxuICAgICAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdjbG91ZHRyYWlsLmFtYXpvbmF3cy5jb20nLFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgIEFjdGlvbjogJ3MzOlB1dE9iamVjdCcsXG4gICAgICAgICAgICAgICAgICBSZXNvdXJjZTogYGFybjphd3M6czM6Ojoke2J1Y2tldE5hbWV9L2Nsb3VkdHJhaWwtbG9ncy8qYCxcbiAgICAgICAgICAgICAgICAgIENvbmRpdGlvbjoge1xuICAgICAgICAgICAgICAgICAgICBTdHJpbmdFcXVhbHM6IHtcbiAgICAgICAgICAgICAgICAgICAgICAnczM6eC1hbXotYWNsJzogJ2J1Y2tldC1vd25lci1mdWxsLWNvbnRyb2wnLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSlcbiAgICAgICAgICApLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ2xvdWRUcmFpbFxuICAgIGNvbnN0IGNsb3VkVHJhaWwgPSBuZXcgYXdzLmNsb3VkdHJhaWwuVHJhaWwoXG4gICAgICBgdGFwLWNsb3VkdHJhaWwtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWNsb3VkdHJhaWwtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBzM0J1Y2tldE5hbWU6IGFyZ3MubG9nc0J1Y2tldE5hbWUsXG4gICAgICAgIHMzS2V5UHJlZml4OiAnY2xvdWR0cmFpbC1sb2dzJyxcbiAgICAgICAgaW5jbHVkZUdsb2JhbFNlcnZpY2VFdmVudHM6IHRydWUsXG4gICAgICAgIGlzTXVsdGlSZWdpb25UcmFpbDogdHJ1ZSxcbiAgICAgICAgZW5hYmxlTG9nZ2luZzogdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5QXJuLFxuICAgICAgICBldmVudFNlbGVjdG9yczogW1xuICAgICAgICAgIHtcbiAgICAgICAgICAgIHJlYWRXcml0ZVR5cGU6ICdBbGwnLFxuICAgICAgICAgICAgaW5jbHVkZU1hbmFnZW1lbnRFdmVudHM6IHRydWUsXG4gICAgICAgICAgICBkYXRhUmVzb3VyY2VzOiBbXG4gICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnQVdTOjpTMzo6T2JqZWN0JyxcbiAgICAgICAgICAgICAgICB2YWx1ZXM6IFsnYXJuOmF3czpzMzo6OiovKiddLFxuICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1jbG91ZHRyYWlsLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnQVBJQXVkaXRpbmcnLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBwYXJlbnQ6IHRoaXMsXG4gICAgICAgIGRlcGVuZHNPbjogW2Nsb3VkVHJhaWxCdWNrZXRQb2xpY3ldLFxuICAgICAgfVxuICAgICk7XG5cbiAgICAvLyBHdWFyZER1dHkgRGV0ZWN0b3JcbiAgICBuZXcgYXdzLmd1YXJkZHV0eS5EZXRlY3RvcihcbiAgICAgIGB0YXAtZ3VhcmRkdXR5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgICBmaW5kaW5nUHVibGlzaGluZ0ZyZXF1ZW5jeTogJ0ZJRlRFRU5fTUlOVVRFUycsXG4gICAgICAgIGRhdGFzb3VyY2VzOiB7XG4gICAgICAgICAgczNMb2dzOiB7XG4gICAgICAgICAgICBlbmFibGU6IHRydWUsXG4gICAgICAgICAgfSxcbiAgICAgICAgICBrdWJlcm5ldGVzOiB7XG4gICAgICAgICAgICBhdWRpdExvZ3M6IHtcbiAgICAgICAgICAgICAgZW5hYmxlOiB0cnVlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICB9LFxuICAgICAgICAgIG1hbHdhcmVQcm90ZWN0aW9uOiB7XG4gICAgICAgICAgICBzY2FuRWMySW5zdGFuY2VXaXRoRmluZGluZ3M6IHtcbiAgICAgICAgICAgICAgZWJzVm9sdW1lczoge1xuICAgICAgICAgICAgICAgIGVuYWJsZTogdHJ1ZSxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZ3VhcmRkdXR5LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnVGhyZWF0RGV0ZWN0aW9uJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy52cGNGbG93TG9nSWQgPSB2cGNGbG93TG9nLmlkO1xuICAgIHRoaXMuY2xvdWRUcmFpbEFybiA9IGNsb3VkVHJhaWwuYXJuO1xuICAgIHRoaXMuY2xvdWRXYXRjaExvZ0dyb3VwQXJuID0gdnBjRmxvd0xvZ0dyb3VwLmFybjtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIHZwY0Zsb3dMb2dJZDogdGhpcy52cGNGbG93TG9nSWQsXG4gICAgICBjbG91ZFRyYWlsQXJuOiB0aGlzLmNsb3VkVHJhaWxBcm4sXG4gICAgICBjbG91ZFdhdGNoTG9nR3JvdXBBcm46IHRoaXMuY2xvdWRXYXRjaExvZ0dyb3VwQXJuLFxuICAgIH0pO1xuICB9XG59XG4iXX0=