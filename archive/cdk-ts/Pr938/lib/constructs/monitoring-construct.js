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
const cloudwatch = __importStar(require("aws-cdk-lib/aws-cloudwatch"));
const logs = __importStar(require("aws-cdk-lib/aws-logs"));
const sns = __importStar(require("aws-cdk-lib/aws-sns"));
const cloudwatchActions = __importStar(require("aws-cdk-lib/aws-cloudwatch-actions"));
const constructs_1 = require("constructs");
class MonitoringConstruct extends constructs_1.Construct {
    applicationLogGroup;
    infrastructureLogGroup;
    alertTopic;
    dashboard;
    constructor(scope, id, props) {
        super(scope, id);
        // Create application log group
        this.applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
            logGroupName: `/aws/application/${props.environmentSuffix}`,
            retention: props.logRetentionDays,
        });
        // Create infrastructure log group for additional logging
        if (props.enableLogging) {
            this.infrastructureLogGroup = new logs.LogGroup(this, 'InfrastructureLogGroup', {
                logGroupName: `/aws/infrastructure/${props.environmentSuffix}`,
                retention: props.logRetentionDays,
            });
        }
        // Create SNS topic for alerts
        this.alertTopic = new sns.Topic(this, 'AlertTopic', {
            topicName: `infrastructure-alerts-${props.environmentSuffix}`,
            displayName: `Infrastructure Alerts - ${props.environmentSuffix.toUpperCase()}`,
        });
        // Create CloudWatch Dashboard
        this.dashboard = new cloudwatch.Dashboard(this, 'InfrastructureDashboard', {
            dashboardName: `Infrastructure-${props.environmentSuffix}`,
        });
        // Add VPC metrics to dashboard
        const vpcWidget = new cloudwatch.GraphWidget({
            title: 'VPC Metrics',
            left: [
                new cloudwatch.Metric({
                    namespace: 'AWS/VPC',
                    metricName: 'PacketDropCount',
                    dimensionsMap: {
                        VpcId: props.vpc.vpcId,
                    },
                    statistic: 'Sum',
                }),
            ],
            width: 12,
            height: 6,
        });
        // Add log metrics widget
        const logWidget = new cloudwatch.LogQueryWidget({
            title: 'Application Logs',
            logGroupNames: [this.applicationLogGroup.logGroupName],
            queryLines: [
                'fields @timestamp, @message',
                'filter @message like /ERROR/',
                'sort @timestamp desc',
                'limit 100',
            ],
            width: 12,
            height: 6,
        });
        // Add widgets to dashboard
        this.dashboard.addWidgets(vpcWidget);
        this.dashboard.addWidgets(logWidget);
        // Create alarms for critical metrics
        const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
            alarmName: `HighErrorRate-${props.environmentSuffix}`,
            alarmDescription: 'Alarm for high error rate in application logs',
            metric: new cloudwatch.Metric({
                namespace: 'AWS/Logs',
                metricName: 'ErrorCount',
                dimensionsMap: {
                    LogGroupName: this.applicationLogGroup.logGroupName,
                },
                statistic: 'Sum',
            }),
            threshold: props.environmentSuffix === 'prod' ? 10 : 25,
            evaluationPeriods: 2,
            comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        });
        // Add alarm action
        errorAlarm.addAlarmAction(new cloudwatchActions.SnsAction(this.alertTopic));
        // Add tags
        const resources = [this.applicationLogGroup, this.alertTopic];
        if (this.infrastructureLogGroup)
            resources.push(this.infrastructureLogGroup);
        resources.forEach(resource => {
            resource.node.addMetadata('Environment', props.environmentSuffix);
            resource.node.addMetadata('Component', 'Monitoring');
        });
    }
}
exports.MonitoringConstruct = MonitoringConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb25pdG9yaW5nLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSx1RUFBeUQ7QUFDekQsMkRBQTZDO0FBQzdDLHlEQUEyQztBQUMzQyxzRkFBd0U7QUFFeEUsMkNBQXVDO0FBU3ZDLE1BQWEsbUJBQW9CLFNBQVEsc0JBQVM7SUFDaEMsbUJBQW1CLENBQWdCO0lBQ25DLHNCQUFzQixDQUFpQjtJQUN2QyxVQUFVLENBQVk7SUFDdEIsU0FBUyxDQUF1QjtJQUVoRCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEtBQStCO1FBQ3ZFLEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsK0JBQStCO1FBQy9CLElBQUksQ0FBQyxtQkFBbUIsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3hFLFlBQVksRUFBRSxvQkFBb0IsS0FBSyxDQUFDLGlCQUFpQixFQUFFO1lBQzNELFNBQVMsRUFBRSxLQUFLLENBQUMsZ0JBQXNDO1NBQ3hELENBQUMsQ0FBQztRQUVILHlEQUF5RDtRQUN6RCxJQUFJLEtBQUssQ0FBQyxhQUFhLEVBQUUsQ0FBQztZQUN4QixJQUFJLENBQUMsc0JBQXNCLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUM3QyxJQUFJLEVBQ0osd0JBQXdCLEVBQ3hCO2dCQUNFLFlBQVksRUFBRSx1QkFBdUIsS0FBSyxDQUFDLGlCQUFpQixFQUFFO2dCQUM5RCxTQUFTLEVBQUUsS0FBSyxDQUFDLGdCQUFzQzthQUN4RCxDQUNGLENBQUM7UUFDSixDQUFDO1FBRUQsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFD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V0FBVyxDQUFDLGFBQWEsRUFBRSxLQUFLLENBQUMsaUJBQWlCLENBQUMsQ0FBQztZQUNsRSxRQUFRLENBQUMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxXQUFXLEVBQUUsWUFBWSxDQUFDLENBQUM7UUFDdkQsQ0FBQyxDQUFDLENBQUM7SUFDTCxDQUFDO0NBQ0Y7QUF2R0Qsa0RBdUdDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2xvdWR3YXRjaCBmcm9tICdhd3MtY2RrLWxpYi9hd3MtY2xvdWR3YXRjaCc7XG5pbXBvcnQgKiBhcyBsb2dzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1sb2dzJztcbmltcG9ydCAqIGFzIHNucyBmcm9tICdhd3MtY2RrLWxpYi9hd3Mtc25zJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2hBY3Rpb25zIGZyb20gJ2F3cy1jZGstbGliL2F3cy1jbG91ZHdhdGNoLWFjdGlvbnMnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0IHsgQ29uc3RydWN0IH0gZnJvbSAnY29uc3RydWN0cyc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgTW9uaXRvcmluZ0NvbnN0cnVjdFByb3BzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg6IHN0cmluZztcbiAgZW5hYmxlTG9nZ2luZzogYm9vbGVhbjtcbiAgdnBjOiBlYzIuVnBjO1xuICBsb2dSZXRlbnRpb25EYXlzOiBudW1iZXI7XG59XG5cbmV4cG9ydCBjbGFzcyBNb25pdG9yaW5nQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGFwcGxpY2F0aW9uTG9nR3JvdXA6IGxvZ3MuTG9nR3JvdXA7XG4gIHB1YmxpYyByZWFkb25seSBpbmZyYXN0cnVjdHVyZUxvZ0dyb3VwPzogbG9ncy5Mb2dHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGFsZXJ0VG9waWM6IHNucy5Ub3BpYztcbiAgcHVibGljIHJlYWRvbmx5IGRhc2hib2FyZDogY2xvdWR3YXRjaC5EYXNoYm9hcmQ7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgcHJvcHM6IE1vbml0b3JpbmdDb25zdHJ1Y3RQcm9wcykge1xuICAgIHN1cGVyKHNjb3BlLCBpZCk7XG5cbiAgICAvLyBDcmVhdGUgYXBwbGljYXRpb24gbG9nIGdyb3VwXG4gICAgdGhpcy5hcHBsaWNhdGlvbkxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ0FwcGxpY2F0aW9uTG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2FwcGxpY2F0aW9uLyR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHJldGVudGlvbjogcHJvcHMubG9nUmV0ZW50aW9uRGF5cyBhcyBsb2dzLlJldGVudGlvbkRheXMsXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgaW5mcmFzdHJ1Y3R1cmUgbG9nIGdyb3VwIGZvciBhZGRpdGlvbmFsIGxvZ2dpbmdcbiAgICBpZiAocHJvcHMuZW5hYmxlTG9nZ2luZykge1xuICAgICAgdGhpcy5pbmZyYXN0cnVjdHVyZUxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAoXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdJbmZyYXN0cnVjdHVyZUxvZ0dyb3VwJyxcbiAgICAgICAge1xuICAgICAgICAgIGxvZ0dyb3VwTmFtZTogYC9hd3MvaW5mcmFzdHJ1Y3R1cmUvJHtwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIHJldGVudGlvbjogcHJvcHMubG9nUmV0ZW50aW9uRGF5cyBhcyBsb2dzLlJldGVudGlvbkRheXMsXG4gICAgICAgIH1cbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gQ3JlYXRlIFNOUyB0b3BpYyBmb3IgYWxlcnRzXG4gICAgdGhpcy5hbGVydFRvcGljID0gbmV3IHNucy5Ub3BpYyh0aGlzLCAnQWxlcnRUb3BpYycsIHtcbiAgICAgIHRvcGljTmFtZTogYGluZnJhc3RydWN0dXJlLWFsZXJ0cy0ke3Byb3BzLmVudmlyb25tZW50U3VmZml4fWAsXG4gICAgICBkaXNwbGF5TmFtZTogYEluZnJhc3RydWN0dXJlIEFsZXJ0cyAtICR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXgudG9VcHBlckNhc2UoKX1gLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIENsb3VkV2F0Y2ggRGFzaGJvYXJkXG4gICAgdGhpcy5kYXNoYm9hcmQgPSBuZXcgY2xvdWR3YXRjaC5EYXNoYm9hcmQodGhpcywgJ0luZnJhc3RydWN0dXJlRGFzaGJvYXJkJywge1xuICAgICAgZGFzaGJvYXJkTmFtZTogYEluZnJhc3RydWN0dXJlLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICB9KTtcblxuICAgIC8vIEFkZCBWUEMgbWV0cmljcyB0byBkYXNoYm9hcmRcbiAgICBjb25zdCB2cGNXaWRnZXQgPSBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICB0aXRsZTogJ1ZQQyBNZXRyaWNzJyxcbiAgICAgIGxlZnQ6IFtcbiAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICBuYW1lc3BhY2U6ICdBV1MvVlBDJyxcbiAgICAgICAgICBtZXRyaWNOYW1lOiAnUGFja2V0RHJvcENvdW50JyxcbiAgICAgICAgICBkaW1lbnNpb25zTWFwOiB7XG4gICAgICAgICAgICBWcGNJZDogcHJvcHMudnBjLnZwY0lkLFxuICAgICAgICAgIH0sXG4gICAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgICAgfSksXG4gICAgICBdLFxuICAgICAgd2lkdGg6IDEyLFxuICAgICAgaGVpZ2h0OiA2LFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGxvZyBtZXRyaWNzIHdpZGdldFxuICAgIGNvbnN0IGxvZ1dpZGdldCA9IG5ldyBjbG91ZHdhdGNoLkxvZ1F1ZXJ5V2lkZ2V0KHtcbiAgICAgIHRpdGxlOiAnQXBwbGljYXRpb24gTG9ncycsXG4gICAgICBsb2dHcm91cE5hbWVzOiBbdGhpcy5hcHBsaWNhdGlvbkxvZ0dyb3VwLmxvZ0dyb3VwTmFtZV0sXG4gICAgICBxdWVyeUxpbmVzOiBbXG4gICAgICAgICdmaWVsZHMgQHRpbWVzdGFtcCwgQG1lc3NhZ2UnLFxuICAgICAgICAnZmlsdGVyIEBtZXNzYWdlIGxpa2UgL0VSUk9SLycsXG4gICAgICAgICdzb3J0IEB0aW1lc3RhbXAgZGVzYycsXG4gICAgICAgICdsaW1pdCAxMDAnLFxuICAgICAgXSxcbiAgICAgIHdpZHRoOiAxMixcbiAgICAgIGhlaWdodDogNixcbiAgICB9KTtcblxuICAgIC8vIEFkZCB3aWRnZXRzIHRvIGRhc2hib2FyZFxuICAgIHRoaXMuZGFzaGJvYXJkLmFkZFdpZGdldHModnBjV2lkZ2V0KTtcbiAgICB0aGlzLmRhc2hib2FyZC5hZGRXaWRnZXRzKGxvZ1dpZGdldCk7XG5cbiAgICAvLyBDcmVhdGUgYWxhcm1zIGZvciBjcml0aWNhbCBtZXRyaWNzXG4gICAgY29uc3QgZXJyb3JBbGFybSA9IG5ldyBjbG91ZHdhdGNoLkFsYXJtKHRoaXMsICdIaWdoRXJyb3JSYXRlQWxhcm0nLCB7XG4gICAgICBhbGFybU5hbWU6IGBIaWdoRXJyb3JSYXRlLSR7cHJvcHMuZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdBbGFybSBmb3IgaGlnaCBlcnJvciByYXRlIGluIGFwcGxpY2F0aW9uIGxvZ3MnLFxuICAgICAgbWV0cmljOiBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICBuYW1lc3BhY2U6ICdBV1MvTG9ncycsXG4gICAgICAgIG1ldHJpY05hbWU6ICdFcnJvckNvdW50JyxcbiAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgIExvZ0dyb3VwTmFtZTogdGhpcy5hcHBsaWNhdGlvbkxvZ0dyb3VwLmxvZ0dyb3VwTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgc3RhdGlzdGljOiAnU3VtJyxcbiAgICAgIH0pLFxuICAgICAgdGhyZXNob2xkOiBwcm9wcy5lbnZpcm9ubWVudFN1ZmZpeCA9PT0gJ3Byb2QnID8gMTAgOiAyNSxcbiAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiBjbG91ZHdhdGNoLkNvbXBhcmlzb25PcGVyYXRvci5HUkVBVEVSX1RIQU5fVEhSRVNIT0xELFxuICAgIH0pO1xuXG4gICAgLy8gQWRkIGFsYXJtIGFjdGlvblxuICAgIGVycm9yQWxhcm0uYWRkQWxhcm1BY3Rpb24obmV3IGNsb3Vkd2F0Y2hBY3Rpb25zLlNuc0FjdGlvbih0aGlzLmFsZXJ0VG9waWMpKTtcblxuICAgIC8vIEFkZCB0YWdzXG4gICAgY29uc3QgcmVzb3VyY2VzID0gW3RoaXMuYXBwbGljYXRpb25Mb2dHcm91cCwgdGhpcy5hbGVydFRvcGljXTtcbiAgICBpZiAodGhpcy5pbmZyYXN0cnVjdHVyZUxvZ0dyb3VwKVxuICAgICAgcmVzb3VyY2VzLnB1c2godGhpcy5pbmZyYXN0cnVjdHVyZUxvZ0dyb3VwKTtcblxuICAgIHJlc291cmNlcy5mb3JFYWNoKHJlc291cmNlID0+IHtcbiAgICAgIHJlc291cmNlLm5vZGUuYWRkTWV0YWRhdGEoJ0Vudmlyb25tZW50JywgcHJvcHMuZW52aXJvbm1lbnRTdWZmaXgpO1xuICAgICAgcmVzb3VyY2Uubm9kZS5hZGRNZXRhZGF0YSgnQ29tcG9uZW50JywgJ01vbml0b3JpbmcnKTtcbiAgICB9KTtcbiAgfVxufVxuIl19