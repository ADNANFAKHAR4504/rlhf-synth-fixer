'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.MonitoringConstruct = void 0;
const constructs_1 = require('constructs');
const cloudwatch = __importStar(require('aws-cdk-lib/aws-cloudwatch'));
const logs = __importStar(require('aws-cdk-lib/aws-logs'));
const sns = __importStar(require('aws-cdk-lib/aws-sns'));
const cdk = __importStar(require('aws-cdk-lib'));
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
      topicName: `MultiRegionApp-Alerts-${config.region}`,
    });
    // Create log groups for application logs
    const applicationLogGroup = new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/application`,
      retention: logs.RetentionDays.ONE_WEEK,
    });
    const httpdAccessLogGroup = new logs.LogGroup(this, 'HttpdAccessLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/access`,
      retention: logs.RetentionDays.ONE_WEEK,
    });
    const httpdErrorLogGroup = new logs.LogGroup(this, 'HttpdErrorLogGroup', {
      logGroupName: `/aws/ec2/multiregionapp/${config.region}/httpd/error`,
      retention: logs.RetentionDays.ONE_WEEK,
    });
    // Create CloudWatch Dashboard
    this.dashboard = new cloudwatch.Dashboard(this, 'MonitoringDashboard', {
      dashboardName: `MultiRegionApp-${config.region}`,
      defaultInterval: cdk.Duration.hours(1),
    });
    // Add ALB metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [resources.loadBalancer.metricRequestCount()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [resources.loadBalancer.metricTargetResponseTime()],
        width: 12,
        height: 6,
      })
    );
    // Add Auto Scaling Group metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ASG Instance Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupDesiredCapacity',
            dimensionsMap: {
              AutoScalingGroupName:
                resources.autoScalingGroup.autoScalingGroupName,
            },
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/AutoScaling',
            metricName: 'GroupInServiceInstances',
            dimensionsMap: {
              AutoScalingGroupName:
                resources.autoScalingGroup.autoScalingGroupName,
            },
          }),
        ],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'EC2 CPU Utilization',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/EC2',
            metricName: 'CPUUtilization',
            dimensionsMap: {
              AutoScalingGroupName:
                resources.autoScalingGroup.autoScalingGroupName,
            },
            statistic: 'Average',
          }),
        ],
        width: 12,
        height: 6,
      })
    );
    // Add RDS metrics to dashboard
    this.dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'RDS CPU Utilization',
        left: [resources.database.metricCPUUtilization()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Free Storage Space',
        left: [resources.database.metricFreeStorageSpace()],
        width: 12,
        height: 6,
      }),
      new cloudwatch.GraphWidget({
        title: 'RDS Database Connections',
        left: [resources.database.metricDatabaseConnections()],
        width: 12,
        height: 6,
      })
    );
    // Apply comprehensive tagging
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this.alertTopic).add(key, value);
      cdk.Tags.of(this.dashboard).add(key, value);
      cdk.Tags.of(applicationLogGroup).add(key, value);
      cdk.Tags.of(httpdAccessLogGroup).add(key, value);
      cdk.Tags.of(httpdErrorLogGroup).add(key, value);
    });
    // Add specific name tags
    cdk.Tags.of(this.alertTopic).add(
      'Name',
      `MultiRegionApp-Alerts-${config.region}`
    );
    cdk.Tags.of(this.dashboard).add(
      'Name',
      `MultiRegionApp-Dashboard-${config.region}`
    );
    cdk.Tags.of(applicationLogGroup).add(
      'Name',
      `MultiRegionApp-App-Logs-${config.region}`
    );
    cdk.Tags.of(httpdAccessLogGroup).add(
      'Name',
      `MultiRegionApp-Httpd-Access-${config.region}`
    );
    cdk.Tags.of(httpdErrorLogGroup).add(
      'Name',
      `MultiRegionApp-Httpd-Error-${config.region}`
    );
  }
}
exports.MonitoringConstruct = MonitoringConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJtb25pdG9yaW5nLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFDdkMsdUVBQXlEO0FBQ3pELDJEQUE2QztBQUM3Qyx5REFBMkM7QUFJM0MsaURBQW1DO0FBR25DOzs7R0FHRztBQUNILE1BQWEsbUJBQW9CLFNBQVEsc0JBQVM7SUFDaEMsU0FBUyxDQUF1QjtJQUNoQyxVQUFVLENBQVk7SUFFdEMsWUFDRSxLQUFnQixFQUNoQixFQUFVLEVBQ1YsTUFBbUIsRUFDbkIsU0FJQztRQUVELEtBQUssQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDLENBQUM7UUFFakIsOEJBQThCO1FBQzlCLElBQUksQ0FBQyxVQUFVLEdBQUcsSUFBSSxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxZQUFZLEVBQUU7WUFDbEQsV0FBVyxFQUFFLDJCQUEyQixNQUFNLENBQUMsTUFBTSxFQUFFO1lBQ3ZELFNBQVMsRUFBRSx5QkFBeUIsTUFBTSxDQUFDLE1BQU0sRUFBRTtTQUNwRCxDQUFDLENBQUM7UUFFSCx5Q0FBeUM7UUFDekMsTUFBTSxtQkFBbUIsR0FBRyxJQUFJLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ3pFLFlBQVksRUFBRSwyQkFBMkIsTUFBTSxDQUFDLE1BQU0sY0FBYztZQUNwRSxTQUFTLEVBQUUsSUFBSSxDQUFDLGFBQWEsQ0FBQyxRQUFRO1NBQ3ZDLENBQUMsQ0FBQztRQUVILE1BQU0sbUJBQW1CLEdBQUcsSUFBSSxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUN6RSxZQUFZLEVBQUUsMkJBQTJCLE1BQU0sQ0FBQyxNQUFNLGVBQWU7WUFDckUsU0FBUyxFQUFFLElBQUksQ0FBQyxhQUFhLENB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QUFDLENBQUM7UUFFSCx5QkFBeUI7UUFDekIsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FDOUIsTUFBTSxFQUNOLHlCQUF5QixNQUFNLENBQUMsTUFBTSxFQUFFLENBQ3pDLENBQUM7UUFDRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLENBQUMsR0FBRyxDQUM3QixNQUFNLEVBQ04sNEJBQTRCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FDNUMsQ0FBQztRQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsR0FBRyxDQUNsQyxNQUFNLEVBQ04sMkJBQTJCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FDM0MsQ0FBQztRQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLG1CQUFtQixDQUFDLENBQUMsR0FBRyxDQUNsQyxNQUFNLEVBQ04sK0JBQStCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FDL0MsQ0FBQztRQUNGLEdBQUcsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLGtCQUFrQixDQUFDLENBQUMsR0FBRyxDQUNqQyxNQUFNLEVBQ04sOEJBQThCLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FDOUMsQ0FBQztJQUNKLENBQUM7Q0FDRjtBQTVKRCxrREE0SkMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIGNsb3Vkd2F0Y2ggZnJvbSAnYXdzLWNkay1saWIvYXdzLWNsb3Vkd2F0Y2gnO1xuaW1wb3J0ICogYXMgbG9ncyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtbG9ncyc7XG5pbXBvcnQgKiBhcyBzbnMgZnJvbSAnYXdzLWNkay1saWIvYXdzLXNucyc7XG5pbXBvcnQgKiBhcyBlbGJ2MiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWxhc3RpY2xvYWRiYWxhbmNpbmd2Mic7XG5pbXBvcnQgKiBhcyBhdXRvc2NhbGluZyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtYXV0b3NjYWxpbmcnO1xuaW1wb3J0ICogYXMgcmRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZHMnO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFN0YWNrQ29uZmlnIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdGFjay1jb25maWcnO1xuXG4vKipcbiAqIE1vbml0b3JpbmcgQ29uc3RydWN0IHRoYXQgc2V0cyB1cCBjb21wcmVoZW5zaXZlIENsb3VkV2F0Y2ggbW9uaXRvcmluZyxcbiAqIGFsYXJtcywgYW5kIGxvZ2dpbmcgZm9yIHRoZSBtdWx0aS1yZWdpb24gYXBwbGljYXRpb25cbiAqL1xuZXhwb3J0IGNsYXNzIE1vbml0b3JpbmdDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgZGFzaGJvYXJkOiBjbG91ZHdhdGNoLkRhc2hib2FyZDtcbiAgcHVibGljIHJlYWRvbmx5IGFsZXJ0VG9waWM6IHNucy5Ub3BpYztcblxuICBjb25zdHJ1Y3RvcihcbiAgICBzY29wZTogQ29uc3RydWN0LFxuICAgIGlkOiBzdHJpbmcsXG4gICAgY29uZmlnOiBTdGFja0NvbmZpZyxcbiAgICByZXNvdXJjZXM6IHtcbiAgICAgIGxvYWRCYWxhbmNlcjogZWxidjIuQXBwbGljYXRpb25Mb2FkQmFsYW5jZXI7XG4gICAgICBhdXRvU2NhbGluZ0dyb3VwOiBhdXRvc2NhbGluZy5BdXRvU2NhbGluZ0dyb3VwO1xuICAgICAgZGF0YWJhc2U6IHJkcy5EYXRhYmFzZUluc3RhbmNlO1xuICAgIH1cbiAgKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBTTlMgdG9waWMgZm9yIGFsZXJ0c1xuICAgIHRoaXMuYWxlcnRUb3BpYyA9IG5ldyBzbnMuVG9waWModGhpcywgJ0FsZXJ0VG9waWMnLCB7XG4gICAgICBkaXNwbGF5TmFtZTogYE11bHRpUmVnaW9uQXBwIEFsZXJ0cyAtICR7Y29uZmlnLnJlZ2lvbn1gLFxuICAgICAgdG9waWNOYW1lOiBgTXVsdGlSZWdpb25BcHAtQWxlcnRzLSR7Y29uZmlnLnJlZ2lvbn1gLFxuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIGxvZyBncm91cHMgZm9yIGFwcGxpY2F0aW9uIGxvZ3NcbiAgICBjb25zdCBhcHBsaWNhdGlvbkxvZ0dyb3VwID0gbmV3IGxvZ3MuTG9nR3JvdXAodGhpcywgJ0FwcGxpY2F0aW9uTG9nR3JvdXAnLCB7XG4gICAgICBsb2dHcm91cE5hbWU6IGAvYXdzL2VjMi9tdWx0aXJlZ2lvbmFwcC8ke2NvbmZpZy5yZWdpb259L2FwcGxpY2F0aW9uYCxcbiAgICAgIHJldGVudGlvbjogbG9ncy5SZXRlbnRpb25EYXlzLk9ORV9XRUVLLFxuICAgIH0pO1xuXG4gICAgY29uc3QgaHR0cGRBY2Nlc3NMb2dHcm91cCA9IG5ldyBsb2dzLkxvZ0dyb3VwKHRoaXMsICdIdHRwZEFjY2Vzc0xvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9lYzIvbXVsdGlyZWdpb25hcHAvJHtjb25maWcucmVnaW9ufS9odHRwZC9hY2Nlc3NgLFxuICAgICAgcmV0ZW50aW9uOiBsb2dzLlJldGVudGlvbkRheXMuT05FX1dFRUssXG4gICAgfSk7XG5cbiAgICBjb25zdCBodHRwZEVycm9yTG9nR3JvdXAgPSBuZXcgbG9ncy5Mb2dHcm91cCh0aGlzLCAnSHR0cGRFcnJvckxvZ0dyb3VwJywge1xuICAgICAgbG9nR3JvdXBOYW1lOiBgL2F3cy9lYzIvbXVsdGlyZWdpb25hcHAvJHtjb25maWcucmVnaW9ufS9odHRwZC9lcnJvcmAsXG4gICAgICByZXRlbnRpb246IGxvZ3MuUmV0ZW50aW9uRGF5cy5PTkVfV0VFSyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBDbG91ZFdhdGNoIERhc2hib2FyZFxuICAgIHRoaXMuZGFzaGJvYXJkID0gbmV3IGNsb3Vkd2F0Y2guRGFzaGJvYXJkKHRoaXMsICdNb25pdG9yaW5nRGFzaGJvYXJkJywge1xuICAgICAgZGFzaGJvYXJkTmFtZTogYE11bHRpUmVnaW9uQXBwLSR7Y29uZmlnLnJlZ2lvbn1gLFxuICAgICAgZGVmYXVsdEludGVydmFsOiBjZGsuRHVyYXRpb24uaG91cnMoMSksXG4gICAgfSk7XG5cbiAgICAvLyBBZGQgQUxCIG1ldHJpY3MgdG8gZGFzaGJvYXJkXG4gICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdBTEIgUmVxdWVzdCBDb3VudCcsXG4gICAgICAgIGxlZnQ6IFtyZXNvdXJjZXMubG9hZEJhbGFuY2VyLm1ldHJpY1JlcXVlc3RDb3VudCgpXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdBTEIgUmVzcG9uc2UgVGltZScsXG4gICAgICAgIGxlZnQ6IFtyZXNvdXJjZXMubG9hZEJhbGFuY2VyLm1ldHJpY1RhcmdldFJlc3BvbnNlVGltZSgpXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBBZGQgQXV0byBTY2FsaW5nIEdyb3VwIG1ldHJpY3MgdG8gZGFzaGJvYXJkXG4gICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdBU0cgSW5zdGFuY2UgQ291bnQnLFxuICAgICAgICBsZWZ0OiBbXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BdXRvU2NhbGluZycsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnR3JvdXBEZXNpcmVkQ2FwYWNpdHknLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBBdXRvU2NhbGluZ0dyb3VwTmFtZTpcbiAgICAgICAgICAgICAgICByZXNvdXJjZXMuYXV0b1NjYWxpbmdHcm91cC5hdXRvU2NhbGluZ0dyb3VwTmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgICAgbmV3IGNsb3Vkd2F0Y2guTWV0cmljKHtcbiAgICAgICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BdXRvU2NhbGluZycsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnR3JvdXBJblNlcnZpY2VJbnN0YW5jZXMnLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBBdXRvU2NhbGluZ0dyb3VwTmFtZTpcbiAgICAgICAgICAgICAgICByZXNvdXJjZXMuYXV0b1NjYWxpbmdHcm91cC5hdXRvU2NhbGluZ0dyb3VwTmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgfSksXG4gICAgICAgIF0sXG4gICAgICAgIHdpZHRoOiAxMixcbiAgICAgICAgaGVpZ2h0OiA2LFxuICAgICAgfSksXG4gICAgICBuZXcgY2xvdWR3YXRjaC5HcmFwaFdpZGdldCh7XG4gICAgICAgIHRpdGxlOiAnRUMyIENQVSBVdGlsaXphdGlvbicsXG4gICAgICAgIGxlZnQ6IFtcbiAgICAgICAgICBuZXcgY2xvdWR3YXRjaC5NZXRyaWMoe1xuICAgICAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0VDMicsXG4gICAgICAgICAgICBtZXRyaWNOYW1lOiAnQ1BVVXRpbGl6YXRpb24nLFxuICAgICAgICAgICAgZGltZW5zaW9uc01hcDoge1xuICAgICAgICAgICAgICBBdXRvU2NhbGluZ0dyb3VwTmFtZTpcbiAgICAgICAgICAgICAgICByZXNvdXJjZXMuYXV0b1NjYWxpbmdHcm91cC5hdXRvU2NhbGluZ0dyb3VwTmFtZSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBBZGQgUkRTIG1ldHJpY3MgdG8gZGFzaGJvYXJkXG4gICAgdGhpcy5kYXNoYm9hcmQuYWRkV2lkZ2V0cyhcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdSRFMgQ1BVIFV0aWxpemF0aW9uJyxcbiAgICAgICAgbGVmdDogW3Jlc291cmNlcy5kYXRhYmFzZS5tZXRyaWNDUFVVdGlsaXphdGlvbigpXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KSxcbiAgICAgIG5ldyBjbG91ZHdhdGNoLkdyYXBoV2lkZ2V0KHtcbiAgICAgICAgdGl0bGU6ICdSRFMgRnJlZSBTdG9yYWdlIFNwYWNlJyxcbiAgICAgICAgbGVmdDogW3Jlc291cmNlcy5kYXRhYmFzZS5tZXRyaWNGcmVlU3RvcmFnZVNwYWNlKCldLFxuICAgICAgICB3aWR0aDogMTIsXG4gICAgICAgIGhlaWdodDogNixcbiAgICAgIH0pLFxuICAgICAgbmV3IGNsb3Vkd2F0Y2guR3JhcGhXaWRnZXQoe1xuICAgICAgICB0aXRsZTogJ1JEUyBEYXRhYmFzZSBDb25uZWN0aW9ucycsXG4gICAgICAgIGxlZnQ6IFtyZXNvdXJjZXMuZGF0YWJhc2UubWV0cmljRGF0YWJhc2VDb25uZWN0aW9ucygpXSxcbiAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICBoZWlnaHQ6IDYsXG4gICAgICB9KVxuICAgICk7XG5cbiAgICAvLyBBcHBseSBjb21wcmVoZW5zaXZlIHRhZ2dpbmdcbiAgICBPYmplY3QuZW50cmllcyhjb25maWcudGFncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzLmFsZXJ0VG9waWMpLmFkZChrZXksIHZhbHVlKTtcbiAgICAgIGNkay5UYWdzLm9mKHRoaXMuZGFzaGJvYXJkKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICBjZGsuVGFncy5vZihhcHBsaWNhdGlvbkxvZ0dyb3VwKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICBjZGsuVGFncy5vZihodHRwZEFjY2Vzc0xvZ0dyb3VwKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICBjZGsuVGFncy5vZihodHRwZEVycm9yTG9nR3JvdXApLmFkZChrZXksIHZhbHVlKTtcbiAgICB9KTtcblxuICAgIC8vIEFkZCBzcGVjaWZpYyBuYW1lIHRhZ3NcbiAgICBjZGsuVGFncy5vZih0aGlzLmFsZXJ0VG9waWMpLmFkZChcbiAgICAgICdOYW1lJyxcbiAgICAgIGBNdWx0aVJlZ2lvbkFwcC1BbGVydHMtJHtjb25maWcucmVnaW9ufWBcbiAgICApO1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZGFzaGJvYXJkKS5hZGQoXG4gICAgICAnTmFtZScsXG4gICAgICBgTXVsdGlSZWdpb25BcHAtRGFzaGJvYXJkLSR7Y29uZmlnLnJlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZihhcHBsaWNhdGlvbkxvZ0dyb3VwKS5hZGQoXG4gICAgICAnTmFtZScsXG4gICAgICBgTXVsdGlSZWdpb25BcHAtQXBwLUxvZ3MtJHtjb25maWcucmVnaW9ufWBcbiAgICApO1xuICAgIGNkay5UYWdzLm9mKGh0dHBkQWNjZXNzTG9nR3JvdXApLmFkZChcbiAgICAgICdOYW1lJyxcbiAgICAgIGBNdWx0aVJlZ2lvbkFwcC1IdHRwZC1BY2Nlc3MtJHtjb25maWcucmVnaW9ufWBcbiAgICApO1xuICAgIGNkay5UYWdzLm9mKGh0dHBkRXJyb3JMb2dHcm91cCkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYE11bHRpUmVnaW9uQXBwLUh0dHBkLUVycm9yLSR7Y29uZmlnLnJlZ2lvbn1gXG4gICAgKTtcbiAgfVxufVxuIl19
