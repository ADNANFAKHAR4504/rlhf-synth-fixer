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
exports.MonitoringConstruct = void 0;
const constructs_1 = require("constructs");
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const cdk = __importStar(require("aws-cdk-lib"));
/**
 * Monitoring Construct that sets up comprehensive CloudWatch monitoring,
 * alarms, and logging for the multi-region application
 */
class MonitoringConstruct extends constructs_1.Construct {
    dashboard;
    alertTopic;
    constructor(scope, id, config, resources) {
        super(scope, id);
        // Create SNS topic for alerts
        this.alertTopic = new sns.Topic(this, 'AlertTopic', {
            displayName: `MultiRegionApp Alerts - ${config.region}`,
            topicName: `MultiRegionApp-Alerts-${config.region}`
        });
        // Create log groups for application logs
        const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
            logGroupName: `/aws/ec2/multiregionapp/${config.region}/application`,
            retention: logs.RetentionDays.ONE_WEEK
        });
        const httpdAccessLogGroup = new logs.LogGroup(this, 'HttpdAccessLogGroup', {
            logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/access`,
            retention: logs.RetentionDays.ONE_WEEK
        });
        const httpdErrorLogGroup = new logs.LogGroup(this, 'HttpdErrorLogGroup', {
            logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/error`,
            retention: logs.RetentionDays.ONE_WEEK
        });
        // Create CloudWatch Dashboard
        this.dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
            dashboardName: `MultiRegionApp-${config.region}`,
            defaultInterval: cdk.Duration.hours(1)
        });
        // Add ALB metrics to dashboard
        this.dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'ALB Request Count',
            left: [resources.loadBalancer.metricRequestCount()],
            width: 12,
            height: 6
        }), new cloudwatch.GraphWidget({
            title: 'ALB Response Time',
            left: [resources.loadBalancer.metricTargetResponseTime()],
            width: 12,
            height: 6
        }));
        // Add Auto Scaling Group metrics to dashboard
        this.dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'ASG Instance Count',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/AutoScaling',
                    metricName: 'GroupDesiredCapacity',
                    dimensionsMap: {
                        AutoScalingGroupName: resources.autoScalingGroup.autoScalingGroupName
                    }
                }),
                new cloudwatch.Metric({
                    namespace: 'AWS/AutoScaling',
                    metricName: 'GroupInServiceInstances',
                    dimensionsMap: {
                        AutoScalingGroupName: resources.autoScalingGroup.autoScalingGroupName
                    }
                })
            ],
            width: 12,
            height: 6
        }), new cloudwatch.GraphWidget({
            title: 'EC2 CPU Utilization',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/EC2',
                    metricName: 'CPUUtilization',
                    dimensionsMap: {
                        AutoScalingGroupName: resources.autoScalingGroup.autoScalingGroupName
                    },
                    statistic: 'Average'
                })
            ],
            width: 12,
            height: 6
        }));
        // Add RDS metrics to dashboard
        this.dashboard.addWidgets(new cloudwatch.GraphWidget({
            title: 'RDS CPU Utilization',
            left: [resources.database.metricCPUUtilization()],
            width: 12,
            height: 6
        }), new cloudwatch.GraphWidget({
            title: 'RDS Free Storage Space',
            left: [resources.database.metricFreeStorageSpace()],
            width: 12,
            height: 6
        }), new cloudwatch.GraphWidget({
            title: 'RDS Database Connections',
            left: [resources.database.metricDatabaseConnections()],
            width: 12,
            height: 6
        }));
        // Apply comprehensive tagging
        Object.entries(config.tags).forEach(([key, value]) => {
            cdk.Tags.of(this.alertTopic).add(key, value);
            cdk.Tags.of(this.dashboard).add(key, value);
            cdk.Tags.of(applicationLogGroup).add(key, value);
            cdk.Tags.of(httpdAccessLogGroup).add(key, value);
            cdk.Tags.of(httpdErrorLogGroup).add(key, value);
        });
        // Add specific name tags
        cdk.Tags.of(this.alertTopic).add('Name', `MultiRegionApp-Alerts-${config.region}`);
        cdk.Tags.of(this.dashboard).add('Name', `MultiRegionApp-Dashboard-${config.region}`);
        cdk.Tags.of(applicationLogGroup).add('Name', `MultiRegionApp-App-Logs-${config.region}`);
        cdk.Tags.of(httpdAccessLogGroup).add('Name', `MultiRegionApp-Httpd-Access-${config.region}`);
        cdk.Tags.of(httpdErrorLogGroup).add('Name', `MultiRegionApp-Httpd-Error-${config.region}`);
    }
}
exports.MonitoringConstruct = MonitoringConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb25pdG9yaW5nLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFDdkMsdUVBQXlEO0FBQ3pELDJEQUE2QztBQUM3Qyx5REFBMkM7QUFLM0MsaURBQW1DO0FBR25DOzs7R0FHRztBQUNILE1BQWEsbUJBQW9CLFNBQVEsc0JBQVM7SUFDaEMsU0FBUyxDQUF1QjtJQUNoQyxVQUFVLENBQVk7SUFFdEMsWUFDRSxLQUFnQixFQUNoQixFQUFVLEVBQ1YsTUFBbUIsRUFDbkIsU0FJQztRQUVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEQsV0FBVyxFQUFFLDJCQUEyQixNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ3ZELFNBQVMsRUFBRSx5QkFBeUIsTUFBTSxDQUFDLE1BQU0sRUFBRTtTQUNwRCxDQUFDLENBQUM7UUFFSCx5Q0FBeUM7UUFDekMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3pFLFlBQVksRUFBRSwyQkFBMkIsTUFBTSxDQUFDLE1BQU0sY0FBYztZQUNwRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRO1NBQ3ZDLENBQUMsQ0FBQztRQUVILE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUN6RSxZQUFZLEVBQUUsMkJBQTJCLE1BQU0sQ0FBQyxNQUFNLGVBQWU7WUFDckUsU0FBUyxFQUFFLElBQUksQ0FBQyxhQUFhLENB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LENBQUM7UUFFSCx5QkFBeUI7UUFDekIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUseUJBQXlCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ25GLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLDRCQUE0QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztRQUNyRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsMkJBQTJCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDO1FBQ3pGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsR0FBRyxDQUFDLE1BQU0sRUFBRSwrQkFBK0IsTUFBTSxDQUFDLE1BQU0sRUFBRSxDQUFDLENBQUM7UUFDN0YsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsa0JBQWtCLENBQUMsQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLDhCQUE4QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsQ0FBQztJQUM3RixDQUFDO0NBQ0Y7QUExSUQsa0RBMElDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5pbXBvcnQgKiBhcyBjbG91ZHdhdGNoIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoJztcbmltcG9ydCAqIGFzIGxvZ3MgZnJvbSAnYXdzLWNkay1saWIvYXdzLWxvZ3MnO1xuaW1wb3J0ICogYXMgc25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zbnMnO1xuaW1wb3J0ICogYXMgY2xvdWR3YXRjaEFjdGlvbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gtYWN0aW9ucyc7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgcmRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZHMnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFN0YWNrQ29uZmlnIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdGFjay1jb25maWcnO1xuXG4vKipcbiAqIE1vbml0b3JpbmcgQ29uc3RydWN0IHRoYXQgc2V0cyB1cCBjb21wcmVoZW5zaXZlIENsb3VkV2F0Y2ggbW9uaXRvcmluZyxcbiAqIGFsYXJtcywgYW5kIGxvZ2dpbmcgZm9yIHRoZSBtdWx0aS1yZWdpb24gYXBwbGljYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIE1vbml0b3JpbmdDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgZGFzaGJvYXJkOiBjbG91ZHdhdGNoLkRhc2hib2FyZDtcbiAgcHVibGljIHJlYWRvbmx5IGFsZXJ0VG9waWM6IHNucy5Ub3BpYztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzY29wZTogQ29uc3RydWN0LFxuICAgIGlkOiBzdHJpbmcsXG4gICAgY29uZmlnOiBTdGFja0NvbmZpZyxcbiAgICByZXNvdXJjZXM6IHtcbiAgICAgIGxvYWRCYWxhbmNlcjogZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXI7XG4gICAgICBhdXRvU2NhbGluZ0dyb3VwOiBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwO1xuICAgICAgZGF0YWJhc2U6IHJkcy5EYXRhYmFzZUluc3RhbmNlO1xuICAgIH1cbiAgKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBTTlMgdG9waWMgZm9yIGFsZXJ0c1xuICAgIHRoaXMuYWxlcnRUb3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ0FsZXJ0VG9waWMnLCB7XG4gICAgICBkaXNwbGF5TmFtZTogYE11bHRpUmVnaW9uQXBwIEFsZXJ0cyAtICR7Y29uZmlnLnJlZ2lvbn1gLFxuICAgICAgdG9waWNOYW1lOiBgTXVsdGlSZWdpb25BcHAtQWxlcnRzLSR7Y29uZmlnLnJlZ2lvbn1gXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgbG9nIGdyb3VwcyBmb3IgYXBwbGljYXRpb24gbG9nc1xuICAgIGNvbnN0IGFwcGxpY2F0aW9uTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnQXBwbGljYXRpb25Mb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogYC9hd3MvZWMyL211bHRpcmVnaW9uYXBwLyR7Y29uZmlnLnJlZ2lvbn0vYXBwbGljYXRpb25gLFxuICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUtcbiAgICB9KTtcblxuICAgIGNvbnN0IGh0dHBkQWNjZXNzTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnSHR0cGRBY2Nlc3NMb2dHcm91cCcsIHtcbiAgICAgIGxvZ0dyb3VwTmFtZTogYC9hd3MvZWMyL211bHRpcmVnaW9uYXBwLyR7Y29uZmlnLnJlZ2lvbn0vaHR0cGQvYWNjZXNzYCxcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLXG4gICAgfSk7XG5cbiAgICBjb25zdCBodHRwZEVycm9yTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnSHR0cGRFcnJvckxvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9lYzIvbXVsdGlyZWdpb25hcHAvJHtjb25maWcucmVnaW9ufS9odHRwZC9lcnJvcmAsXG4gICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFS1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggRGFzaGJvYXJkXG4gICAgdGhpcy5kYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQodGhpcywgJ01vbml0b3JpbmdEYXNoYm9hcmQnLCB7XG4gICAgICBkYXNoYm9hcmROYW1lOiBgTXVsdGlSZWdpb25BcHAtJHtjb25maWcucmVnaW9ufWAsXG4gICAgICBkZWZhdWx0SW50ZXJ2YWw6IGNkay5EdXJhdGlvbi5ob3VycygxKVxuICAgIH0pO1xuXG4gICAgLy8gQWRkIEFMQiBtZXRyaWNzIHRvIGRhc2hib2FyZFxuICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiAnQUxCIFJlcXVlc3QgQ291bnQnLFxuICAgICAgICBsZWZ0OiBbcmVzb3VyY2VzLmxvYWRCYWxhbmNlci5tZXRyaWNSZXF1ZXN0Q291bnQoKV0sXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgaGVpZ2h0OiA2XG4gICAgICB9KSxcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdBTEIgUmVzcG9uc2UgVGltZScsXG4gICAgICAgIGxlZnQ6IFtyZXNvdXJjZXMubG9hZEJhbGFuY2VyLm1ldHJpY1RhcmdldFJlc3BvbnNlVGltZSgpXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDZcbiAgICAgIH0pXG4gICAgKTtcblxuICAgIC8vIEFkZCBBdXRvIFNjYWxpbmcgR3JvdXAgbWV0cmljcyB0byBkYXNoYm9hcmRcbiAgICB0aGlzLmRhc2hib2FyZC5hZGRXaWRnZXRzKFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0FTRyBJbnN0YW5jZSBDb3VudCcsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0F1dG9TY2FsaW5nJyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6ICdHcm91cERlc2lyZWRDYXBhY2l0eScsXG4gICAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICAgIEF1dG9TY2FsaW5nR3JvdXBOYW1lOiByZXNvdXJjZXMuYXV0b1NjYWxpbmdHcm91cC5hdXRvU2NhbGluZ0dyb3VwTmFtZVxuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pLFxuICAgICAgICAgIG5ldyBjbG91ZHdhdGNoLk1ldHJpYyh7XG4gICAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXV0b1NjYWxpbmcnLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ0dyb3VwSW5TZXJ2aWNlSW5zdGFuY2VzJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgQXV0b1NjYWxpbmdHcm91cE5hbWU6IHJlc291cmNlcy5hdXRvU2NhbGluZ0dyb3VwLmF1dG9TY2FsaW5nR3JvdXBOYW1lXG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSlcbiAgICAgICAgXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDZcbiAgICAgIH0pLFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ0VDMiBDUFUgVXRpbGl6YXRpb24nLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9FQzInLFxuICAgICAgICAgICAgbWV0cmljTmFtZTogJ0NQVVV0aWxpemF0aW9uJyxcbiAgICAgICAgICAgIGRpbWVuc2lvbnNNYXA6IHtcbiAgICAgICAgICAgICAgQXV0b1NjYWxpbmdHcm91cE5hbWU6IHJlc291cmNlcy5hdXRvU2NhbGluZ0dyb3VwLmF1dG9TY2FsaW5nR3JvdXBOYW1lXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZSdcbiAgICAgICAgICB9KVxuICAgICAgICBdLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNlxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQWRkIFJEUyBtZXRyaWNzIHRvIGRhc2hib2FyZFxuICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHMoXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiAnUkRTIENQVSBVdGlsaXphdGlvbicsXG4gICAgICAgIGxlZnQ6IFtyZXNvdXJjZXMuZGF0YWJhc2UubWV0cmljQ1BVVXRpbGl6YXRpb24oKV0sXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgaGVpZ2h0OiA2XG4gICAgICB9KSxcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdSRFMgRnJlZSBTdG9yYWdlIFNwYWNlJyxcbiAgICAgICAgbGVmdDogW3Jlc291cmNlcy5kYXRhYmFzZS5tZXRyaWNGcmVlU3RvcmFnZVNwYWNlKCldLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNlxuICAgICAgfSksXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiAnUkRTIERhdGFiYXNlIENvbm5lY3Rpb25zJyxcbiAgICAgICAgbGVmdDogW3Jlc291cmNlcy5kYXRhYmFzZS5tZXRyaWNEYXRhYmFzZUNvbm5lY3Rpb25zKCldLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNlxuICAgICAgfSlcbiAgICApO1xuXG4gICAgLy8gQXBwbHkgY29tcHJlaGVuc2l2ZSB0YWdnaW5nXG4gICAgT2JqZWN0LmVudHJpZXMoY29uZmlnLnRhZ3MpLmZvckVhY2goKFtrZXksIHZhbHVlXSkgPT4ge1xuICAgICAgY2RrLlRhZ3Mub2YodGhpcy5hbGVydFRvcGljKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICBjZGsuVGFncy5vZih0aGlzLmRhc2hib2FyZCkuYWRkKGtleSwgdmFsdWUpO1xuICAgICAgY2RrLlRhZ3Mub2YoYXBwbGljYXRpb25Mb2dHcm91cCkuYWRkKGtleSwgdmFsdWUpO1xuICAgICAgY2RrLlRhZ3Mub2YoaHR0cGRBY2Nlc3NMb2dHcm91cCkuYWRkKGtleSwgdmFsdWUpO1xuICAgICAgY2RrLlRhZ3Mub2YoaHR0cGRFcnJvckxvZ0dyb3VwKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgfSk7XG5cbiAgICAvLyBBZGQgc3BlY2lmaWMgbmFtZSB0YWdzXG4gICAgY2RrLlRhZ3Mub2YodGhpcy5hbGVydFRvcGljKS5hZGQoJ05hbWUnLCBgTXVsdGlSZWdpb25BcHAtQWxlcnRzLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmRhc2hib2FyZCkuYWRkKCdOYW1lJywgYE11bHRpUmVnaW9uQXBwLURhc2hib2FyZC0ke2NvbmZpZy5yZWdpb259YCk7XG4gICAgY2RrLlRhZ3Mub2YoYXBwbGljYXRpb25Mb2dHcm91cCkuYWRkKCdOYW1lJywgYE11bHRpUmVnaW9uQXBwLUFwcC1Mb2dzLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgICBjZGsuVGFncy5vZihodHRwZEFjY2Vzc0xvZ0dyb3VwKS5hZGQoJ05hbWUnLCBgTXVsdGlSZWdpb25BcHAtSHR0cGQtQWNjZXNzLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgICBjZGsuVGFncy5vZihodHRwZEVycm9yTG9nR3JvdXApLmFkZCgnTmFtZScsIGBNdWx0aVJlZ2lvbkFwcC1IdHRwZC1FcnJvci0ke2NvbmZpZy5yZWdpb259YCk7XG4gIH1cbn0iXX0=