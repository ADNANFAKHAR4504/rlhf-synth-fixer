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
exports.CloudWatchStack = void 0;
exports.extractTargetGroupName = extractTargetGroupName;
exports.extractLoadBalancerName = extractLoadBalancerName;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
/**
 * Extract target group name from ARN
 * @param arn - Target group ARN
 * @returns Target group name or empty string
 */
function extractTargetGroupName(arn) {
    if (!arn)
        return '';
    const parts = arn.split(':').pop();
    return parts ? parts.split('/')[1] || '' : '';
}
/**
 * Extract load balancer name from ARN
 * @param arn - Load balancer ARN
 * @returns Load balancer name or empty string
 */
function extractLoadBalancerName(arn) {
    if (!arn)
        return '';
    const parts = arn.split(':').pop();
    return parts ? parts.split('/').slice(1, 4).join('/') : '';
}
class CloudWatchStack extends pulumi.ComponentResource {
    constructor(name, args, opts) {
        super('tap:cloudwatch:CloudWatchStack', name, args, opts);
        // SNS Topic for alarms
        const alarmTopic = new aws.sns.Topic(`${name}-alarms-${args.environmentSuffix}`, {
            displayName: `${name} CloudWatch Alarms`,
            tags: {
                Name: `${name}-alarms-${args.environmentSuffix}`,
                ...args.tags,
            },
        }, { parent: this });
        // High CPU Utilization Alarm
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _highCpuAlarm = new aws.cloudwatch.MetricAlarm(`${name}-high-cpu-${args.environmentSuffix}`, {
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 300,
            statistic: 'Average',
            threshold: 80,
            alarmDescription: 'This metric monitors EC2 cpu utilization',
            alarmActions: [alarmTopic.arn],
            dimensions: {
                AutoScalingGroupName: args.autoScalingGroupName,
            },
            treatMissingData: 'notBreaching',
            tags: args.tags,
        }, { parent: this });
        // Target Group Unhealthy Hosts Alarm
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _unhealthyTargetsAlarm = new aws.cloudwatch.MetricAlarm(`${name}-unhealthy-targets-${args.environmentSuffix}`, {
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'UnHealthyHostCount',
            namespace: 'AWS/ApplicationELB',
            period: 60,
            statistic: 'Average',
            threshold: 0,
            alarmDescription: 'Alert when targets become unhealthy',
            alarmActions: [alarmTopic.arn],
            dimensions: {
                TargetGroup: args.targetGroupArn.apply(extractTargetGroupName),
                LoadBalancer: args.albArn.apply(extractLoadBalancerName),
            },
            treatMissingData: 'notBreaching',
            tags: args.tags,
        }, { parent: this });
        // ALB Request Count Alarm
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _highRequestCountAlarm = new aws.cloudwatch.MetricAlarm(`${name}-high-requests-${args.environmentSuffix}`, {
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'RequestCount',
            namespace: 'AWS/ApplicationELB',
            period: 60,
            statistic: 'Sum',
            threshold: 10000,
            alarmDescription: 'Alert on high request count',
            alarmActions: [alarmTopic.arn],
            dimensions: {
                LoadBalancer: args.albArn.apply(extractLoadBalancerName),
            },
            treatMissingData: 'notBreaching',
            tags: args.tags,
        }, { parent: this });
        // ALB Target Response Time Alarm
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _highLatencyAlarm = new aws.cloudwatch.MetricAlarm(`${name}-high-latency-${args.environmentSuffix}`, {
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'TargetResponseTime',
            namespace: 'AWS/ApplicationELB',
            period: 300,
            statistic: 'Average',
            threshold: 2,
            alarmDescription: 'Alert on high response time',
            alarmActions: [alarmTopic.arn],
            dimensions: {
                LoadBalancer: args.albArn.apply(extractLoadBalancerName),
            },
            treatMissingData: 'notBreaching',
            tags: args.tags,
        }, { parent: this });
        // CloudWatch Dashboard
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const _dashboard = new aws.cloudwatch.Dashboard(`${name}-dashboard-${args.environmentSuffix}`, {
            dashboardName: `${name}-${args.environmentSuffix}`,
            dashboardBody: pulumi
                .all([args.autoScalingGroupName, args.targetGroupArn, args.albArn])
                .apply(([asgName, tgArn, albArn]) => JSON.stringify({
                widgets: [
                    {
                        type: 'metric',
                        x: 0,
                        y: 0,
                        width: 12,
                        height: 6,
                        properties: {
                            metrics: [
                                [
                                    'AWS/EC2',
                                    'CPUUtilization',
                                    { stat: 'Average', label: 'Average CPU' },
                                ],
                                ['.', '.', { stat: 'Maximum', label: 'Max CPU' }],
                            ],
                            view: 'timeSeries',
                            stacked: false,
                            region: 'us-east-2',
                            title: 'EC2 CPU Utilization',
                            period: 300,
                            dimensions: {
                                AutoScalingGroupName: asgName,
                            },
                        },
                    },
                    {
                        type: 'metric',
                        x: 12,
                        y: 0,
                        width: 12,
                        height: 6,
                        properties: {
                            metrics: [
                                [
                                    'AWS/ApplicationELB',
                                    'TargetResponseTime',
                                    { stat: 'Average' },
                                ],
                                ['.', 'RequestCount', { stat: 'Sum', yAxis: 'right' }],
                            ],
                            view: 'timeSeries',
                            stacked: false,
                            region: 'us-east-2',
                            title: 'ALB Performance',
                            period: 300,
                            dimensions: {
                                LoadBalancer: albArn
                                    ? albArn
                                        .split(':')
                                        .pop()
                                        ?.split('/')
                                        .slice(1, 4)
                                        .join('/') || ''
                                    : '',
                            },
                        },
                    },
                    {
                        type: 'metric',
                        x: 0,
                        y: 6,
                        width: 12,
                        height: 6,
                        properties: {
                            metrics: [
                                [
                                    'AWS/ApplicationELB',
                                    'HealthyHostCount',
                                    { stat: 'Average', label: 'Healthy' },
                                ],
                                [
                                    '.',
                                    'UnHealthyHostCount',
                                    { stat: 'Average', label: 'Unhealthy' },
                                ],
                            ],
                            view: 'timeSeries',
                            stacked: false,
                            region: 'us-east-2',
                            title: 'Target Health',
                            period: 60,
                            dimensions: {
                                TargetGroup: tgArn
                                    ? tgArn.split(':').pop()?.split('/')[1] || ''
                                    : '',
                                LoadBalancer: albArn
                                    ? albArn
                                        .split(':')
                                        .pop()
                                        ?.split('/')
                                        .slice(1, 4)
                                        .join('/') || ''
                                    : '',
                            },
                        },
                    },
                ],
            })),
        }, { parent: this });
        this.registerOutputs({});
    }
}
exports.CloudWatchStack = CloudWatchStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWR3YXRjaC1zdGFjay5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL2xpYi9jbG91ZHdhdGNoLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQVNBLHdEQUlDO0FBT0QsMERBSUM7QUF4QkQsdURBQXlDO0FBQ3pDLGlEQUFtQztBQUduQzs7OztHQUlHO0FBQ0gsU0FBZ0Isc0JBQXNCLENBQUMsR0FBVztJQUNoRCxJQUFJLENBQUMsR0FBRztRQUFFLE9BQU8sRUFBRSxDQUFDO0lBQ3BCLE1BQU0sS0FBSyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDbkMsT0FBTyxLQUFLLENBQUMsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUM7QUFDaEQsQ0FBQztBQUVEOzs7O0dBSUc7QUFDSCxTQUFnQix1QkFBdUIsQ0FBQyxHQUFXO0lBQ2pELElBQUksQ0FBQyxHQUFHO1FBQUUsT0FBTyxFQUFFLENBQUM7SUFDcEIsTUFBTSxLQUFLLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxHQUFHLEVBQUUsQ0FBQztJQUNuQyxPQUFPLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUMsRUFBRSxDQUFDO0FBQzdELENBQUM7QUFVRCxNQUFhLGVBQWdCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUMzRCxZQUFZLElBQVksRUFBRSxJQUF5QixFQUFFLElBQXNCO1FBQ3pFLEtBQUssQ0FBQyxnQ0FBZ0MsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTFELHVCQUF1QjtRQUN2QixNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsS0FBSyxDQUNsQyxHQUFHLElBQUksV0FBVyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsRUFDMUM7WUFDRSxXQUFXLEVBQUUsR0FBRyxJQUFJLG9CQUFvQjtZQUN4QyxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLEdBQUcsSUFBSSxXQUFXLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtnQkFDaEQsR0FBRyxJQUFJLENBQUMsSUFBSTthQUNiO1NBQ0YsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDZCQUE2QjtRQUM3Qiw2REFBNkQ7UUFDN0QsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFdBQVcsQ0FDbEQsR0FBRyxJQUFJLGFBQWEsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQzVDO1lBQ0Usa0JBQWtCLEVBQUUsc0JBQXNCO1lBQzFDLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsVUFBVSxFQUFFLGdCQUFnQjtZQUM1QixTQUFTLEVBQUUsU0FBUztZQUNwQixNQUFNLEVBQUUsR0FBRztZQUNYLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFNBQVMsRUFBRSxFQUFFO1lBQ2IsZ0JBQWdCLEVBQUUsMENBQTBDO1lBQzVELFlBQVksRUFBRSxDQUFDLFVBQVUsQ0FBQyxHQUFHLENBQUM7WUFDOUIsVUFBVSxFQUFFO2dCQUNWLG9CQUFvQixFQUFFLElBQUksQ0FBQyxvQkFBb0I7YUFDaEQ7WUFDRCxnQkFBZ0IsRUFBRSxjQUFjO1lBQ2hDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYscUNBQXFDO1FBQ3JDLDZEQUE2RDtRQUM3RCxNQUFNLHNCQUFzQixHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQzNELEdBQUcsSUFBSSxzQkFBc0IsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ3JEO1lBQ0Usa0JBQWtCLEVBQUUsc0JBQXNCO1lBQzFDLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsVUFBVSxFQUFFLG9CQUFvQjtZQUNoQyxTQUFTLEVBQUUsb0JBQW9CO1lBQy9CLE1BQU0sRUFBRSxFQUFFO1lBQ1YsU0FBUyxFQUFFLFNBQVM7WUFDcEIsU0FBUyxFQUFFLENBQUM7WUFDWixnQkFBZ0IsRUFBRSxxQ0FBcUM7WUFDdkQsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUM5QixVQUFVLEVBQUU7Z0JBQ1YsV0FBVyxFQUFFLElBQUksQ0FBQyxjQUFjLENBQUMsS0FBSyxDQUFDLHNCQUFzQixDQUFDO2dCQUM5RCxZQUFZLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUM7YUFDekQ7WUFDRCxnQkFBZ0IsRUFBRSxjQUFjO1lBQ2hDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsMEJBQTBCO1FBQzFCLDZEQUE2RDtRQUM3RCxNQUFNLHNCQUFzQixHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQzNELEdBQUcsSUFBSSxrQkFBa0IsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ2pEO1lBQ0Usa0JBQWtCLEVBQUUsc0JBQXNCO1lBQzFDLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsVUFBVSxFQUFFLGNBQWM7WUFDMUIsU0FBUyxFQUFFLG9CQUFvQjtZQUMvQixNQUFNLEVBQUUsRUFBRTtZQUNWLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLFNBQVMsRUFBRSxLQUFLO1lBQ2hCLGdCQUFnQixFQUFFLDZCQUE2QjtZQUMvQyxZQUFZLEVBQUUsQ0FBQyxVQUFVLENBQUMsR0FBRyxDQUFDO1lBQzlCLFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsdUJBQXVCLENBQUM7YUFDekQ7WUFDRCxnQkFBZ0IsRUFBRSxjQUFjO1lBQ2hDLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsaUNBQWlDO1FBQ2pDLDZEQUE2RDtRQUM3RCxNQUFNLGlCQUFpQixHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxXQUFXLENBQ3RELEdBQUcsSUFBSSxpQkFBaUIsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQ2hEO1lBQ0Usa0JBQWtCLEVBQUUsc0JBQXNCO1lBQzFDLGlCQUFpQixFQUFFLENBQUM7WUFDcEIsVUFBVSxFQUFFLG9CQUFvQjtZQUNoQyxTQUFTLEVBQUUsb0JBQW9CO1lBQy9CLE1BQU0sRUFBRSxHQUFHO1lBQ1gsU0FBUyxFQUFFLFNBQVM7WUFDcEIsU0FBUyxFQUFFLENBQUM7WUFDWixnQkFBZ0IsRUFBRSw2QkFBNkI7WUFDL0MsWUFBWSxFQUFFLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQztZQUM5QixVQUFVLEVBQUU7Z0JBQ1YsWUFBWSxFQUFFLElBQUksQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLHVCQUF1QixDQUFDO2FBQ3pEO1lBQ0QsZ0JBQWdCLEVBQUUsY0FBYztZQUNoQyxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7U0FDaEIsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLHVCQUF1QjtRQUN2Qiw2REFBNkQ7UUFDN0QsTUFBTSxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsVUFBVSxDQUFDLFNBQVMsQ0FDN0MsR0FBRyxJQUFJLGNBQWMsSUFBSSxDQUFDLGlCQUFpQixFQUFFLEVBQzdDO1lBQ0UsYUFBYSxFQUFFLEdBQUcsSUFBSSxJQUFJLElBQUksQ0FBQyxpQkFBaUIsRUFBRTtZQUNsRCxhQUFhLEVBQUUsTUFBTTtpQkFDbEIsR0FBRyxDQUFDLENBQUMsSUFBSSxDQUFDLG9CQUFvQixFQUFFLElBQUksQ0FBQyxjQUFjLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO2lCQUNsRSxLQUFLLENBQUMsQ0FBQyxDQUFDLE9BQU8sRUFBRSxLQUFLLEVBQUUsTUFBTSxDQUFDLEVBQUUsRUFBRSxDQUNsQyxJQUFJLENBQUMsU0FBUyxDQUFDO2dCQUNiLE9BQU8sRUFBRTtvQkFDUDt3QkFDRSxJQUFJLEVBQUUsUUFBUTt3QkFDZCxDQUFDLEVBQUUsQ0FBQzt3QkFDSixDQUFDLEVBQUUsQ0FBQzt3QkFDSixLQUFLLEVBQUUsRUFBRTt3QkFDVCxNQUFNLEVBQUUsQ0FBQzt3QkFDVCxVQUFVLEVBQUU7NEJBQ1YsT0FBTyxFQUFFO2dDQUNQO29DQUNFLFNBQVM7b0NBQ1QsZ0JBQWdCO29DQUNoQixFQUFFLElBQUksRUFBRSxTQUFTLEVBQUUsS0FBSyxFQUFFLGFBQWEsRUFBRTtpQ0FDMUM7Z0NBQ0QsQ0FBQyxHQUFHLEVBQUUsR0FBRyxFQUFFLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLENBQUM7NkJBQ2xEOzRCQUNELElBQUksRUFBRSxZQUFZOzRCQUNsQixPQUFPLEVBQUUsS0FBSzs0QkFDZCxNQUFNLEVBQUUsV0FBVzs0QkFDbkIsS0FBSyxFQUFFLHFCQUFxQjs0QkFDNUIsTUFBTSxFQUFFLEdBQUc7NEJBQ1gsVUFBVSxFQUFFO2dDQUNWLG9CQUFvQixFQUFFLE9BQU87NkJBQzlCO3lCQUNGO3FCQUNGO29CQUNEO3dCQUNFLElBQUksRUFBRSxRQUFRO3dCQUNkLENBQUMsRUFBRSxFQUFFO3dCQUNMLENBQUMsRUFBRSxDQUFDO3dCQUNKLEtBQUssRUFBRSxFQUFFO3dCQUNULE1BQU0sRUFBRSxDQUFDO3dCQUNULFVBQVUsRUFBRTs0QkFDVixPQUFPLEVBQUU7Z0NBQ1A7b0NBQ0Usb0JBQW9CO29DQUNwQixvQkFBb0I7b0NBQ3BCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRTtpQ0FDcEI7Z0NBQ0QsQ0FBQyxHQUFHLEVBQUUsY0FBYyxFQUFFLEVBQUUsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLLEVBQUUsT0FBTyxFQUFFLENBQUM7NkJBQ3ZEOzRCQUNELElBQUksRUFBRSxZQUFZOzRCQUNsQixPQUFPLEVBQUUsS0FBSzs0QkFDZCxNQUFNLEVBQUUsV0FBVzs0QkFDbkIsS0FBSyxFQUFFLGlCQUFpQjs0QkFDeEIsTUFBTSxFQUFFLEdBQUc7NEJBQ1gsVUFBVSxFQUFFO2dDQUNWLFlBQVksRUFBRSxNQUFNO29DQUNsQixDQUFDLENBQUMsTUFBTTt5Q0FDSCxLQUFLLENBQUMsR0FBRyxDQUFDO3lDQUNWLEdBQUcsRUFBRTt3Q0FDTixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUM7eUNBQ1gsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7eUNBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7b0NBQ3BCLENBQUMsQ0FBQyxFQUFFOzZCQUNQO3lCQUNGO3FCQUNGO29CQUNEO3dCQUNFLElBQUksRUFBRSxRQUFRO3dCQUNkLENBQUMsRUFBRSxDQUFDO3dCQUNKLENBQUMsRUFBRSxDQUFDO3dCQUNKLEtBQUssRUFBRSxFQUFFO3dCQUNULE1BQU0sRUFBRSxDQUFDO3dCQUNULFVBQVUsRUFBRTs0QkFDVixPQUFPLEVBQUU7Z0NBQ1A7b0NBQ0Usb0JBQW9CO29DQUNwQixrQkFBa0I7b0NBQ2xCLEVBQUUsSUFBSSxFQUFFLFNBQVMsRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFO2lDQUN0QztnQ0FDRDtvQ0FDRSxHQUFHO29DQUNILG9CQUFvQjtvQ0FDcEIsRUFBRSxJQUFJLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUU7aUNBQ3hDOzZCQUNGOzRCQUNELElBQUksRUFBRSxZQUFZOzRCQUNsQixPQUFPLEVBQUUsS0FBSzs0QkFDZCxNQUFNLEVBQUUsV0FBVzs0QkFDbkIsS0FBSyxFQUFFLGVBQWU7NEJBQ3RCLE1BQU0sRUFBRSxFQUFFOzRCQUNWLFVBQVUsRUFBRTtnQ0FDVixXQUFXLEVBQUUsS0FBSztvQ0FDaEIsQ0FBQyxDQUFDLEtBQUssQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxFQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLEVBQUU7b0NBQzdDLENBQUMsQ0FBQyxFQUFFO2dDQUNOLFlBQVksRUFBRSxNQUFNO29DQUNsQixDQUFDLENBQUMsTUFBTTt5Q0FDSCxLQUFLLENBQUMsR0FBRyxDQUFDO3lDQUNWLEdBQUcsRUFBRTt3Q0FDTixFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUM7eUNBQ1gsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLENBQUM7eUNBQ1gsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUU7b0NBQ3BCLENBQUMsQ0FBQyxFQUFFOzZCQUNQO3lCQUNGO3FCQUNGO2lCQUNGO2FBQ0YsQ0FBQyxDQUNIO1NBQ0osRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksQ0FBQyxlQUFlLENBQUMsRUFBRSxDQUFDLENBQUM7SUFDM0IsQ0FBQztDQUNGO0FBbE9ELDBDQWtPQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG4vKipcbiAqIEV4dHJhY3QgdGFyZ2V0IGdyb3VwIG5hbWUgZnJvbSBBUk5cbiAqIEBwYXJhbSBhcm4gLSBUYXJnZXQgZ3JvdXAgQVJOXG4gKiBAcmV0dXJucyBUYXJnZXQgZ3JvdXAgbmFtZSBvciBlbXB0eSBzdHJpbmdcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGV4dHJhY3RUYXJnZXRHcm91cE5hbWUoYXJuOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWFybikgcmV0dXJuICcnO1xuICBjb25zdCBwYXJ0cyA9IGFybi5zcGxpdCgnOicpLnBvcCgpO1xuICByZXR1cm4gcGFydHMgPyBwYXJ0cy5zcGxpdCgnLycpWzFdIHx8ICcnIDogJyc7XG59XG5cbi8qKlxuICogRXh0cmFjdCBsb2FkIGJhbGFuY2VyIG5hbWUgZnJvbSBBUk5cbiAqIEBwYXJhbSBhcm4gLSBMb2FkIGJhbGFuY2VyIEFSTlxuICogQHJldHVybnMgTG9hZCBiYWxhbmNlciBuYW1lIG9yIGVtcHR5IHN0cmluZ1xuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0cmFjdExvYWRCYWxhbmNlck5hbWUoYXJuOiBzdHJpbmcpOiBzdHJpbmcge1xuICBpZiAoIWFybikgcmV0dXJuICcnO1xuICBjb25zdCBwYXJ0cyA9IGFybi5zcGxpdCgnOicpLnBvcCgpO1xuICByZXR1cm4gcGFydHMgPyBwYXJ0cy5zcGxpdCgnLycpLnNsaWNlKDEsIDQpLmpvaW4oJy8nKSA6ICcnO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENsb3VkV2F0Y2hTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICBhdXRvU2NhbGluZ0dyb3VwTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICB0YXJnZXRHcm91cEFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBhbGJBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9Pjtcbn1cblxuZXhwb3J0IGNsYXNzIENsb3VkV2F0Y2hTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogQ2xvdWRXYXRjaFN0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6Y2xvdWR3YXRjaDpDbG91ZFdhdGNoU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIC8vIFNOUyBUb3BpYyBmb3IgYWxhcm1zXG4gICAgY29uc3QgYWxhcm1Ub3BpYyA9IG5ldyBhd3Muc25zLlRvcGljKFxuICAgICAgYCR7bmFtZX0tYWxhcm1zLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkaXNwbGF5TmFtZTogYCR7bmFtZX0gQ2xvdWRXYXRjaCBBbGFybXNgLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYCR7bmFtZX0tYWxhcm1zLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEhpZ2ggQ1BVIFV0aWxpemF0aW9uIEFsYXJtXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11bnVzZWQtdmFyc1xuICAgIGNvbnN0IF9oaWdoQ3B1QWxhcm0gPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgJHtuYW1lfS1oaWdoLWNwdS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgbWV0cmljTmFtZTogJ0NQVVV0aWxpemF0aW9uJyxcbiAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0VDMicsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiA4MCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ1RoaXMgbWV0cmljIG1vbml0b3JzIEVDMiBjcHUgdXRpbGl6YXRpb24nLFxuICAgICAgICBhbGFybUFjdGlvbnM6IFthbGFybVRvcGljLmFybl0sXG4gICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICBBdXRvU2NhbGluZ0dyb3VwTmFtZTogYXJncy5hdXRvU2NhbGluZ0dyb3VwTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgdHJlYXRNaXNzaW5nRGF0YTogJ25vdEJyZWFjaGluZycsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFRhcmdldCBHcm91cCBVbmhlYWx0aHkgSG9zdHMgQWxhcm1cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVudXNlZC12YXJzXG4gICAgY29uc3QgX3VuaGVhbHRoeVRhcmdldHNBbGFybSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGAke25hbWV9LXVuaGVhbHRoeS10YXJnZXRzLSR7YXJncy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBtZXRyaWNOYW1lOiAnVW5IZWFsdGh5SG9zdENvdW50JyxcbiAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0FwcGxpY2F0aW9uRUxCJyxcbiAgICAgICAgcGVyaW9kOiA2MCxcbiAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgIHRocmVzaG9sZDogMCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ0FsZXJ0IHdoZW4gdGFyZ2V0cyBiZWNvbWUgdW5oZWFsdGh5JyxcbiAgICAgICAgYWxhcm1BY3Rpb25zOiBbYWxhcm1Ub3BpYy5hcm5dLFxuICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgVGFyZ2V0R3JvdXA6IGFyZ3MudGFyZ2V0R3JvdXBBcm4uYXBwbHkoZXh0cmFjdFRhcmdldEdyb3VwTmFtZSksXG4gICAgICAgICAgTG9hZEJhbGFuY2VyOiBhcmdzLmFsYkFybi5hcHBseShleHRyYWN0TG9hZEJhbGFuY2VyTmFtZSksXG4gICAgICAgIH0sXG4gICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6ICdub3RCcmVhY2hpbmcnLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBBTEIgUmVxdWVzdCBDb3VudCBBbGFybVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBfaGlnaFJlcXVlc3RDb3VudEFsYXJtID0gbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgYCR7bmFtZX0taGlnaC1yZXF1ZXN0cy0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgbWV0cmljTmFtZTogJ1JlcXVlc3RDb3VudCcsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcHBsaWNhdGlvbkVMQicsXG4gICAgICAgIHBlcmlvZDogNjAsXG4gICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgIHRocmVzaG9sZDogMTAwMDAsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGVydCBvbiBoaWdoIHJlcXVlc3QgY291bnQnLFxuICAgICAgICBhbGFybUFjdGlvbnM6IFthbGFybVRvcGljLmFybl0sXG4gICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICBMb2FkQmFsYW5jZXI6IGFyZ3MuYWxiQXJuLmFwcGx5KGV4dHJhY3RMb2FkQmFsYW5jZXJOYW1lKSxcbiAgICAgICAgfSxcbiAgICAgICAgdHJlYXRNaXNzaW5nRGF0YTogJ25vdEJyZWFjaGluZycsXG4gICAgICAgIHRhZ3M6IGFyZ3MudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEFMQiBUYXJnZXQgUmVzcG9uc2UgVGltZSBBbGFybVxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBfaGlnaExhdGVuY3lBbGFybSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGAke25hbWV9LWhpZ2gtbGF0ZW5jeS0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgbWV0cmljTmFtZTogJ1RhcmdldFJlc3BvbnNlVGltZScsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcHBsaWNhdGlvbkVMQicsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiAyLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnQWxlcnQgb24gaGlnaCByZXNwb25zZSB0aW1lJyxcbiAgICAgICAgYWxhcm1BY3Rpb25zOiBbYWxhcm1Ub3BpYy5hcm5dLFxuICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgTG9hZEJhbGFuY2VyOiBhcmdzLmFsYkFybi5hcHBseShleHRyYWN0TG9hZEJhbGFuY2VyTmFtZSksXG4gICAgICAgIH0sXG4gICAgICAgIHRyZWF0TWlzc2luZ0RhdGE6ICdub3RCcmVhY2hpbmcnLFxuICAgICAgICB0YWdzOiBhcmdzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBDbG91ZFdhdGNoIERhc2hib2FyZFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdW51c2VkLXZhcnNcbiAgICBjb25zdCBfZGFzaGJvYXJkID0gbmV3IGF3cy5jbG91ZHdhdGNoLkRhc2hib2FyZChcbiAgICAgIGAke25hbWV9LWRhc2hib2FyZC0ke2FyZ3MuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgZGFzaGJvYXJkTmFtZTogYCR7bmFtZX0tJHthcmdzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRhc2hib2FyZEJvZHk6IHB1bHVtaVxuICAgICAgICAgIC5hbGwoW2FyZ3MuYXV0b1NjYWxpbmdHcm91cE5hbWUsIGFyZ3MudGFyZ2V0R3JvdXBBcm4sIGFyZ3MuYWxiQXJuXSlcbiAgICAgICAgICAuYXBwbHkoKFthc2dOYW1lLCB0Z0FybiwgYWxiQXJuXSkgPT5cbiAgICAgICAgICAgIEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICAgICAgd2lkZ2V0czogW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgICAgICAgICAgeDogMCxcbiAgICAgICAgICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgICAgICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICAgICAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICAgICAgICAgIG1ldHJpY3M6IFtcbiAgICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnQVdTL0VDMicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnQ1BVVXRpbGl6YXRpb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBzdGF0OiAnQXZlcmFnZScsIGxhYmVsOiAnQXZlcmFnZSBDUFUnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICBbJy4nLCAnLicsIHsgc3RhdDogJ01heGltdW0nLCBsYWJlbDogJ01heCBDUFUnIH1dLFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICB2aWV3OiAndGltZVNlcmllcycsXG4gICAgICAgICAgICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICByZWdpb246ICd1cy1lYXN0LTInLFxuICAgICAgICAgICAgICAgICAgICB0aXRsZTogJ0VDMiBDUFUgVXRpbGl6YXRpb24nLFxuICAgICAgICAgICAgICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgICAgICAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgICAgICAgICAgICAgIEF1dG9TY2FsaW5nR3JvdXBOYW1lOiBhc2dOYW1lLFxuICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgIHR5cGU6ICdtZXRyaWMnLFxuICAgICAgICAgICAgICAgICAgeDogMTIsXG4gICAgICAgICAgICAgICAgICB5OiAwLFxuICAgICAgICAgICAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICAgICAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgICAgICAgICAgICAgcHJvcGVydGllczoge1xuICAgICAgICAgICAgICAgICAgICBtZXRyaWNzOiBbXG4gICAgICAgICAgICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgICAgICAgICAgJ0FXUy9BcHBsaWNhdGlvbkVMQicsXG4gICAgICAgICAgICAgICAgICAgICAgICAnVGFyZ2V0UmVzcG9uc2VUaW1lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHsgc3RhdDogJ0F2ZXJhZ2UnIH0sXG4gICAgICAgICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgICAgICAgICAgICBbJy4nLCAnUmVxdWVzdENvdW50JywgeyBzdGF0OiAnU3VtJywgeUF4aXM6ICdyaWdodCcgfV0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHZpZXc6ICd0aW1lU2VyaWVzJyxcbiAgICAgICAgICAgICAgICAgICAgc3RhY2tlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMicsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnQUxCIFBlcmZvcm1hbmNlJyxcbiAgICAgICAgICAgICAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICBMb2FkQmFsYW5jZXI6IGFsYkFyblxuICAgICAgICAgICAgICAgICAgICAgICAgPyBhbGJBcm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8uc3BsaXQoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zbGljZSgxLCA0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKCcvJykgfHwgJydcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgdHlwZTogJ21ldHJpYycsXG4gICAgICAgICAgICAgICAgICB4OiAwLFxuICAgICAgICAgICAgICAgICAgeTogNixcbiAgICAgICAgICAgICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgICAgICAgICAgIGhlaWdodDogNixcbiAgICAgICAgICAgICAgICAgIHByb3BlcnRpZXM6IHtcbiAgICAgICAgICAgICAgICAgICAgbWV0cmljczogW1xuICAgICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICdBV1MvQXBwbGljYXRpb25FTEInLFxuICAgICAgICAgICAgICAgICAgICAgICAgJ0hlYWx0aHlIb3N0Q291bnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBzdGF0OiAnQXZlcmFnZScsIGxhYmVsOiAnSGVhbHRoeScgfSxcbiAgICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICAgICAgICAgICcuJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICdVbkhlYWx0aHlIb3N0Q291bnQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgeyBzdGF0OiAnQXZlcmFnZScsIGxhYmVsOiAnVW5oZWFsdGh5JyB9LFxuICAgICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICAgICAgICAgIHZpZXc6ICd0aW1lU2VyaWVzJyxcbiAgICAgICAgICAgICAgICAgICAgc3RhY2tlZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgIHJlZ2lvbjogJ3VzLWVhc3QtMicsXG4gICAgICAgICAgICAgICAgICAgIHRpdGxlOiAnVGFyZ2V0IEhlYWx0aCcsXG4gICAgICAgICAgICAgICAgICAgIHBlcmlvZDogNjAsXG4gICAgICAgICAgICAgICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICAgICAgICAgICAgICBUYXJnZXRHcm91cDogdGdBcm5cbiAgICAgICAgICAgICAgICAgICAgICAgID8gdGdBcm4uc3BsaXQoJzonKS5wb3AoKT8uc3BsaXQoJy8nKVsxXSB8fCAnJ1xuICAgICAgICAgICAgICAgICAgICAgICAgOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICBMb2FkQmFsYW5jZXI6IGFsYkFyblxuICAgICAgICAgICAgICAgICAgICAgICAgPyBhbGJBcm5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAuc3BsaXQoJzonKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5wb3AoKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgID8uc3BsaXQoJy8nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5zbGljZSgxLCA0KVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIC5qb2luKCcvJykgfHwgJydcbiAgICAgICAgICAgICAgICAgICAgICAgIDogJycsXG4gICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KVxuICAgICAgICAgICksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7fSk7XG4gIH1cbn1cbiJdfQ==