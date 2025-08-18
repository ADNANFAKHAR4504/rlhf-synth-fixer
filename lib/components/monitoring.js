"use strict";
/**
 * Monitoring Infrastructure Component
 * Handles CloudWatch dashboards, alarms, and SNS notifications
 */
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
exports.MonitoringInfrastructure = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi_1 = require("@pulumi/pulumi");
class MonitoringInfrastructure extends pulumi_1.ComponentResource {
    region;
    environment;
    tags;
    regionSuffix;
    snsTopic;
    snsTopicPolicy;
    dashboard;
    constructor(name, args, opts) {
        super('nova:infrastructure:Monitoring', name, {}, opts);
        this.region = args.region;
        this.environment = args.environment;
        this.tags = args.tags;
        this.regionSuffix = args.region.replace(/-/g, '').replace(/gov/g, '');
        this.snsTopic = this.createSnsTopic();
        this.snsTopicPolicy = this.createSnsTopicPolicy();
        this.dashboard = this.createDashboard();
        this.registerOutputs({
            snsTopicArn: this.snsTopic.arn,
            dashboardName: this.dashboard.dashboardName,
        });
    }
    /**
     * Create SNS Topic for alerts
     */
    createSnsTopic() {
        return new aws.sns.Topic(`nova-alerts-${this.regionSuffix}`, {
            name: `nova-alerts-${this.regionSuffix}`,
            displayName: `Nova Alerts - ${this.region}`,
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create SNS Topic Policy
     */
    createSnsTopicPolicy() {
        const policyDocument = {
            Version: '2012-10-17',
            Statement: [
                {
                    Effect: 'Allow',
                    Principal: {
                        Service: 'cloudwatch.amazonaws.com',
                    },
                    Action: 'sns:Publish',
                    Resource: this.snsTopic.arn,
                },
            ],
        };
        return new aws.sns.TopicPolicy(`nova-alerts-policy-${this.regionSuffix}`, {
            arn: this.snsTopic.arn,
            policy: JSON.stringify(policyDocument),
        }, { parent: this });
    }
    /**
     * Create CloudWatch Dashboard
     */
    createDashboard() {
        const dashboardBody = JSON.stringify({
            widgets: [
                {
                    type: 'metric',
                    x: 0,
                    y: 0,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [
                            ['AWS/ApplicationELB', 'RequestCount'],
                            ['AWS/ApplicationELB', 'TargetResponseTime'],
                            ['AWS/ApplicationELB', 'HTTPCode_Target_5XX_Count'],
                        ],
                        view: 'timeSeries',
                        stacked: false,
                        region: this.region,
                        title: 'Nova Application Metrics',
                        period: 300,
                    },
                },
                {
                    type: 'metric',
                    x: 0,
                    y: 6,
                    width: 12,
                    height: 6,
                    properties: {
                        metrics: [['AWS/ElasticBeanstalk', 'EnvironmentHealth']],
                        view: 'timeSeries',
                        stacked: false,
                        region: this.region,
                        title: 'Environment Health',
                        period: 300,
                    },
                },
            ],
        });
        return new aws.cloudwatch.Dashboard(`nova-dashboard-${this.regionSuffix}`, {
            dashboardName: `nova-dashboard-${this.regionSuffix}`,
            dashboardBody: dashboardBody,
        }, { parent: this });
    }
    /**
     * Create CPU High Alarm
     */
    createCpuAlarm(environmentName, asgName) {
        return new aws.cloudwatch.MetricAlarm(`nova-cpu-alarm-${this.regionSuffix}`, {
            name: `nova-cpu-high-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/EC2',
            period: 120,
            statistic: 'Average',
            threshold: 80,
            alarmDescription: 'This metric monitors ec2 cpu utilization',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
                AutoScalingGroupName: asgName,
            },
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create 5XX Error Alarm
     */
    createErrorAlarm(environmentName) {
        return new aws.cloudwatch.MetricAlarm(`nova-error-alarm-${this.regionSuffix}`, {
            name: `nova-5xx-errors-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'HTTPCode_Target_5XX_Count',
            namespace: 'AWS/ApplicationELB',
            period: 60,
            statistic: 'Sum',
            threshold: 10,
            alarmDescription: 'This metric monitors 5XX errors',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
                LoadBalancer: environmentName,
            },
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create Environment Health Alarm
     */
    createHealthAlarm(environmentName) {
        return new aws.cloudwatch.MetricAlarm(`nova-health-alarm-${this.regionSuffix}`, {
            name: `nova-env-health-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
            comparisonOperator: 'LessThanThreshold',
            evaluationPeriods: 1,
            metricName: 'EnvironmentHealth',
            namespace: 'AWS/ElasticBeanstalk',
            period: 60,
            statistic: 'Average',
            threshold: 15,
            alarmDescription: 'This metric monitors environment health',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
                EnvironmentName: environmentName,
            },
            tags: this.tags,
        }, { parent: this });
    }
    /**
     * Create Response Time Alarm
     */
    createResponseTimeAlarm(lbFullName) {
        return new aws.cloudwatch.MetricAlarm(`nova-response-time-alarm-${this.regionSuffix}`, {
            name: `nova-response-time-${this.regionSuffix}`, // Use 'name' instead of 'alarmName'
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'TargetResponseTime',
            namespace: 'AWS/ApplicationELB',
            period: 60,
            statistic: 'Average',
            threshold: 1,
            alarmDescription: 'This metric monitors response time',
            alarmActions: [this.snsTopic.arn],
            dimensions: {
                LoadBalancer: lbFullName,
            },
            tags: this.tags,
        }, { parent: this });
    }
    // Property getters for easy access
    get snsTopicArn() {
        return this.snsTopic.arn;
    }
    get dashboardName() {
        return this.dashboard.dashboardName;
    }
}
exports.MonitoringInfrastructure = MonitoringInfrastructure;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibW9uaXRvcmluZy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1vbml0b3JpbmcudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBOzs7R0FHRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBRUgsaURBQW1DO0FBQ25DLDJDQUl3QjtBQVF4QixNQUFhLHdCQUF5QixTQUFRLDBCQUFpQjtJQUM1QyxNQUFNLENBQVM7SUFDZixXQUFXLENBQVM7SUFDcEIsSUFBSSxDQUF5QjtJQUM3QixZQUFZLENBQVM7SUFFdEIsUUFBUSxDQUFnQjtJQUN4QixjQUFjLENBQXNCO0lBQ3BDLFNBQVMsQ0FBMkI7SUFFcEQsWUFDRSxJQUFZLEVBQ1osSUFBa0MsRUFDbEMsSUFBK0I7UUFFL0IsS0FBSyxDQUFDLGdDQUFnQyxFQUFFLElBQUksRUFBRSxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFeEQsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzFCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDLFdBQVcsQ0FBQztRQUNwQyxJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLENBQUM7UUFDdEIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxJQUFJLEVBQUUsRUFBRSxDQUFDLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztRQUV0RSxJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksQ0FBQyxjQUFjLEVBQUUsQ0FBQztRQUN0QyxJQUFJLENBQUMsY0FBYyxHQUFHLElBQUksQ0FBQyxvQkFBb0IsRUFBRSxDQUFDO1FBQ2xELElBQUksQ0FBQyxTQUFTLEdBQUcsSUFBSSxDQUFDLGVBQWUsRUFBRSxDQUFDO1FBRXhDLElBQUksQ0FBQyxlQUFlLENBQUM7WUFDbkIsV0FBVyxFQUFFLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRztZ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aUIsRUFBRSxDQUFDO1lBQ3BCLFVBQVUsRUFBRSxvQkFBb0I7WUFDaEMsU0FBUyxFQUFFLG9CQUFvQjtZQUMvQixNQUFNLEVBQUUsRUFBRTtZQUNWLFNBQVMsRUFBRSxTQUFTO1lBQ3BCLFNBQVMsRUFBRSxDQUFDO1lBQ1osZ0JBQWdCLEVBQUUsb0NBQW9DO1lBQ3RELFlBQVksRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDO1lBQ2pDLFVBQVUsRUFBRTtnQkFDVixZQUFZLEVBQUUsVUFBVTthQUN6QjtZQUNELElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtTQUNoQixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO0lBQ0osQ0FBQztJQUVELG1DQUFtQztJQUNuQyxJQUFXLFdBQVc7UUFDcEIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLEdBQUcsQ0FBQztJQUMzQixDQUFDO0lBRUQsSUFBVyxhQUFhO1FBQ3RCLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxhQUFhLENBQUM7SUFDdEMsQ0FBQztDQUNGO0FBelBELDREQXlQQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogTW9uaXRvcmluZyBJbmZyYXN0cnVjdHVyZSBDb21wb25lbnRcbiAqIEhhbmRsZXMgQ2xvdWRXYXRjaCBkYXNoYm9hcmRzLCBhbGFybXMsIGFuZCBTTlMgbm90aWZpY2F0aW9uc1xuICovXG5cbmltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQge1xuICBDb21wb25lbnRSZXNvdXJjZSxcbiAgQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zLFxuICBPdXRwdXQsXG59IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuaW50ZXJmYWNlIE1vbml0b3JpbmdJbmZyYXN0cnVjdHVyZUFyZ3Mge1xuICByZWdpb246IHN0cmluZztcbiAgZW52aXJvbm1lbnQ6IHN0cmluZztcbiAgdGFnczogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGNsYXNzIE1vbml0b3JpbmdJbmZyYXN0cnVjdHVyZSBleHRlbmRzIENvbXBvbmVudFJlc291cmNlIHtcbiAgcHJpdmF0ZSByZWFkb25seSByZWdpb246IHN0cmluZztcbiAgcHJpdmF0ZSByZWFkb25seSBlbnZpcm9ubWVudDogc3RyaW5nO1xuICBwcml2YXRlIHJlYWRvbmx5IHRhZ3M6IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG4gIHByaXZhdGUgcmVhZG9ubHkgcmVnaW9uU3VmZml4OiBzdHJpbmc7XG5cbiAgcHVibGljIHJlYWRvbmx5IHNuc1RvcGljOiBhd3Muc25zLlRvcGljO1xuICBwdWJsaWMgcmVhZG9ubHkgc25zVG9waWNQb2xpY3k6IGF3cy5zbnMuVG9waWNQb2xpY3k7XG4gIHB1YmxpYyByZWFkb25seSBkYXNoYm9hcmQ6IGF3cy5jbG91ZHdhdGNoLkRhc2hib2FyZDtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogTW9uaXRvcmluZ0luZnJhc3RydWN0dXJlQXJncyxcbiAgICBvcHRzPzogQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zXG4gICkge1xuICAgIHN1cGVyKCdub3ZhOmluZnJhc3RydWN0dXJlOk1vbml0b3JpbmcnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLnJlZ2lvbiA9IGFyZ3MucmVnaW9uO1xuICAgIHRoaXMuZW52aXJvbm1lbnQgPSBhcmdzLmVudmlyb25tZW50O1xuICAgIHRoaXMudGFncyA9IGFyZ3MudGFncztcbiAgICB0aGlzLnJlZ2lvblN1ZmZpeCA9IGFyZ3MucmVnaW9uLnJlcGxhY2UoLy0vZywgJycpLnJlcGxhY2UoL2dvdi9nLCAnJyk7XG5cbiAgICB0aGlzLnNuc1RvcGljID0gdGhpcy5jcmVhdGVTbnNUb3BpYygpO1xuICAgIHRoaXMuc25zVG9waWNQb2xpY3kgPSB0aGlzLmNyZWF0ZVNuc1RvcGljUG9saWN5KCk7XG4gICAgdGhpcy5kYXNoYm9hcmQgPSB0aGlzLmNyZWF0ZURhc2hib2FyZCgpO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgc25zVG9waWNBcm46IHRoaXMuc25zVG9waWMuYXJuLFxuICAgICAgZGFzaGJvYXJkTmFtZTogdGhpcy5kYXNoYm9hcmQuZGFzaGJvYXJkTmFtZSxcbiAgICB9KTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgU05TIFRvcGljIGZvciBhbGVydHNcbiAgICovXG4gIHByaXZhdGUgY3JlYXRlU25zVG9waWMoKTogYXdzLnNucy5Ub3BpYyB7XG4gICAgcmV0dXJuIG5ldyBhd3Muc25zLlRvcGljKFxuICAgICAgYG5vdmEtYWxlcnRzLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYG5vdmEtYWxlcnRzLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgICAgZGlzcGxheU5hbWU6IGBOb3ZhIEFsZXJ0cyAtICR7dGhpcy5yZWdpb259YCxcbiAgICAgICAgdGFnczogdGhpcy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBTTlMgVG9waWMgUG9saWN5XG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZVNuc1RvcGljUG9saWN5KCk6IGF3cy5zbnMuVG9waWNQb2xpY3kge1xuICAgIGNvbnN0IHBvbGljeURvY3VtZW50ID0ge1xuICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgIHtcbiAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgUHJpbmNpcGFsOiB7XG4gICAgICAgICAgICBTZXJ2aWNlOiAnY2xvdWR3YXRjaC5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICB9LFxuICAgICAgICAgIEFjdGlvbjogJ3NuczpQdWJsaXNoJyxcbiAgICAgICAgICBSZXNvdXJjZTogdGhpcy5zbnNUb3BpYy5hcm4sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH07XG5cbiAgICByZXR1cm4gbmV3IGF3cy5zbnMuVG9waWNQb2xpY3koXG4gICAgICBgbm92YS1hbGVydHMtcG9saWN5LSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgYXJuOiB0aGlzLnNuc1RvcGljLmFybixcbiAgICAgICAgcG9saWN5OiBKU09OLnN0cmluZ2lmeShwb2xpY3lEb2N1bWVudCksXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIENsb3VkV2F0Y2ggRGFzaGJvYXJkXG4gICAqL1xuICBwcml2YXRlIGNyZWF0ZURhc2hib2FyZCgpOiBhd3MuY2xvdWR3YXRjaC5EYXNoYm9hcmQge1xuICAgIGNvbnN0IGRhc2hib2FyZEJvZHkgPSBKU09OLnN0cmluZ2lmeSh7XG4gICAgICB3aWRnZXRzOiBbXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnbWV0cmljJyxcbiAgICAgICAgICB4OiAwLFxuICAgICAgICAgIHk6IDAsXG4gICAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICAgIGhlaWdodDogNixcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICBtZXRyaWNzOiBbXG4gICAgICAgICAgICAgIFsnQVdTL0FwcGxpY2F0aW9uRUxCJywgJ1JlcXVlc3RDb3VudCddLFxuICAgICAgICAgICAgICBbJ0FXUy9BcHBsaWNhdGlvbkVMQicsICdUYXJnZXRSZXNwb25zZVRpbWUnXSxcbiAgICAgICAgICAgICAgWydBV1MvQXBwbGljYXRpb25FTEInLCAnSFRUUENvZGVfVGFyZ2V0XzVYWF9Db3VudCddLFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHZpZXc6ICd0aW1lU2VyaWVzJyxcbiAgICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICAgIHRpdGxlOiAnTm92YSBBcHBsaWNhdGlvbiBNZXRyaWNzJyxcbiAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICAgIHtcbiAgICAgICAgICB0eXBlOiAnbWV0cmljJyxcbiAgICAgICAgICB4OiAwLFxuICAgICAgICAgIHk6IDYsXG4gICAgICAgICAgd2lkdGg6IDEyLFxuICAgICAgICAgIGhlaWdodDogNixcbiAgICAgICAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgICAgICBtZXRyaWNzOiBbWydBV1MvRWxhc3RpY0JlYW5zdGFsaycsICdFbnZpcm9ubWVudEhlYWx0aCddXSxcbiAgICAgICAgICAgIHZpZXc6ICd0aW1lU2VyaWVzJyxcbiAgICAgICAgICAgIHN0YWNrZWQ6IGZhbHNlLFxuICAgICAgICAgICAgcmVnaW9uOiB0aGlzLnJlZ2lvbixcbiAgICAgICAgICAgIHRpdGxlOiAnRW52aXJvbm1lbnQgSGVhbHRoJyxcbiAgICAgICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICAgIH0sXG4gICAgICAgIH0sXG4gICAgICBdLFxuICAgIH0pO1xuXG4gICAgcmV0dXJuIG5ldyBhd3MuY2xvdWR3YXRjaC5EYXNoYm9hcmQoXG4gICAgICBgbm92YS1kYXNoYm9hcmQtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBkYXNoYm9hcmROYW1lOiBgbm92YS1kYXNoYm9hcmQtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAgICBkYXNoYm9hcmRCb2R5OiBkYXNoYm9hcmRCb2R5LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLyoqXG4gICAqIENyZWF0ZSBDUFUgSGlnaCBBbGFybVxuICAgKi9cbiAgcHVibGljIGNyZWF0ZUNwdUFsYXJtKFxuICAgIGVudmlyb25tZW50TmFtZTogT3V0cHV0PHN0cmluZz4sXG4gICAgYXNnTmFtZTogT3V0cHV0PHN0cmluZz5cbiAgKTogYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0ge1xuICAgIHJldHVybiBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgbm92YS1jcHUtYWxhcm0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgbm92YS1jcHUtaGlnaC0ke3RoaXMucmVnaW9uU3VmZml4fWAsIC8vIFVzZSAnbmFtZScgaW5zdGVhZCBvZiAnYWxhcm1OYW1lJ1xuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBtZXRyaWNOYW1lOiAnQ1BVVXRpbGl6YXRpb24nLFxuICAgICAgICBuYW1lc3BhY2U6ICdBV1MvRUMyJyxcbiAgICAgICAgcGVyaW9kOiAxMjAsXG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICB0aHJlc2hvbGQ6IDgwLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnVGhpcyBtZXRyaWMgbW9uaXRvcnMgZWMyIGNwdSB1dGlsaXphdGlvbicsXG4gICAgICAgIGFsYXJtQWN0aW9uczogW3RoaXMuc25zVG9waWMuYXJuXSxcbiAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgIEF1dG9TY2FsaW5nR3JvdXBOYW1lOiBhc2dOYW1lLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB0aGlzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIDVYWCBFcnJvciBBbGFybVxuICAgKi9cbiAgcHVibGljIGNyZWF0ZUVycm9yQWxhcm0oXG4gICAgZW52aXJvbm1lbnROYW1lOiBPdXRwdXQ8c3RyaW5nPlxuICApOiBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybSB7XG4gICAgcmV0dXJuIG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGBub3ZhLWVycm9yLWFsYXJtLSR7dGhpcy5yZWdpb25TdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYG5vdmEtNXh4LWVycm9ycy0ke3RoaXMucmVnaW9uU3VmZml4fWAsIC8vIFVzZSAnbmFtZScgaW5zdGVhZCBvZiAnYWxhcm1OYW1lJ1xuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBtZXRyaWNOYW1lOiAnSFRUUENvZGVfVGFyZ2V0XzVYWF9Db3VudCcsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9BcHBsaWNhdGlvbkVMQicsXG4gICAgICAgIHBlcmlvZDogNjAsXG4gICAgICAgIHN0YXRpc3RpYzogJ1N1bScsXG4gICAgICAgIHRocmVzaG9sZDogMTAsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdUaGlzIG1ldHJpYyBtb25pdG9ycyA1WFggZXJyb3JzJyxcbiAgICAgICAgYWxhcm1BY3Rpb25zOiBbdGhpcy5zbnNUb3BpYy5hcm5dLFxuICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgTG9hZEJhbGFuY2VyOiBlbnZpcm9ubWVudE5hbWUsXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IHRoaXMudGFncyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBDcmVhdGUgRW52aXJvbm1lbnQgSGVhbHRoIEFsYXJtXG4gICAqL1xuICBwdWJsaWMgY3JlYXRlSGVhbHRoQWxhcm0oXG4gICAgZW52aXJvbm1lbnROYW1lOiBPdXRwdXQ8c3RyaW5nPlxuICApOiBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybSB7XG4gICAgcmV0dXJuIG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGBub3ZhLWhlYWx0aC1hbGFybS0ke3RoaXMucmVnaW9uU3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGBub3ZhLWVudi1oZWFsdGgtJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLCAvLyBVc2UgJ25hbWUnIGluc3RlYWQgb2YgJ2FsYXJtTmFtZSdcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnTGVzc1RoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMSxcbiAgICAgICAgbWV0cmljTmFtZTogJ0Vudmlyb25tZW50SGVhbHRoJyxcbiAgICAgICAgbmFtZXNwYWNlOiAnQVdTL0VsYXN0aWNCZWFuc3RhbGsnLFxuICAgICAgICBwZXJpb2Q6IDYwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiAxNSxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ1RoaXMgbWV0cmljIG1vbml0b3JzIGVudmlyb25tZW50IGhlYWx0aCcsXG4gICAgICAgIGFsYXJtQWN0aW9uczogW3RoaXMuc25zVG9waWMuYXJuXSxcbiAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgIEVudmlyb25tZW50TmFtZTogZW52aXJvbm1lbnROYW1lLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB0aGlzLnRhZ3MsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ3JlYXRlIFJlc3BvbnNlIFRpbWUgQWxhcm1cbiAgICovXG4gIHB1YmxpYyBjcmVhdGVSZXNwb25zZVRpbWVBbGFybShcbiAgICBsYkZ1bGxOYW1lOiBPdXRwdXQ8c3RyaW5nPlxuICApOiBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybSB7XG4gICAgcmV0dXJuIG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGBub3ZhLXJlc3BvbnNlLXRpbWUtYWxhcm0tJHt0aGlzLnJlZ2lvblN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgbm92YS1yZXNwb25zZS10aW1lLSR7dGhpcy5yZWdpb25TdWZmaXh9YCwgLy8gVXNlICduYW1lJyBpbnN0ZWFkIG9mICdhbGFybU5hbWUnXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIG1ldHJpY05hbWU6ICdUYXJnZXRSZXNwb25zZVRpbWUnLFxuICAgICAgICBuYW1lc3BhY2U6ICdBV1MvQXBwbGljYXRpb25FTEInLFxuICAgICAgICBwZXJpb2Q6IDYwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiAxLFxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnVGhpcyBtZXRyaWMgbW9uaXRvcnMgcmVzcG9uc2UgdGltZScsXG4gICAgICAgIGFsYXJtQWN0aW9uczogW3RoaXMuc25zVG9waWMuYXJuXSxcbiAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgIExvYWRCYWxhbmNlcjogbGJGdWxsTmFtZSxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczogdGhpcy50YWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuICB9XG5cbiAgLy8gUHJvcGVydHkgZ2V0dGVycyBmb3IgZWFzeSBhY2Nlc3NcbiAgcHVibGljIGdldCBzbnNUb3BpY0FybigpOiBPdXRwdXQ8c3RyaW5nPiB7XG4gICAgcmV0dXJuIHRoaXMuc25zVG9waWMuYXJuO1xuICB9XG5cbiAgcHVibGljIGdldCBkYXNoYm9hcmROYW1lKCk6IE91dHB1dDxzdHJpbmc+IHtcbiAgICByZXR1cm4gdGhpcy5kYXNoYm9hcmQuZGFzaGJvYXJkTmFtZTtcbiAgfVxufVxuIl19