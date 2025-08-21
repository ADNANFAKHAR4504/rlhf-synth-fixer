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
exports.ApplicationLogGroupsComponent = exports.CloudWatchDashboardComponent = exports.CloudWatchMetricAlarmComponent = exports.CloudWatchLogGroupComponent = void 0;
exports.createCloudWatchLogGroup = createCloudWatchLogGroup;
exports.createCloudWatchMetricAlarm = createCloudWatchMetricAlarm;
exports.createCloudWatchDashboard = createCloudWatchDashboard;
exports.createApplicationLogGroups = createApplicationLogGroups;
const pulumi = __importStar(require("@pulumi/pulumi"));
const aws = __importStar(require("@pulumi/aws"));
class CloudWatchLogGroupComponent extends pulumi.ComponentResource {
    logGroup;
    logGroupName;
    logGroupArn;
    constructor(name, args, opts) {
        super('aws:cloudwatch:CloudWatchLogGroupComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.logGroup = new aws.cloudwatch.LogGroup(`${name}-log-group`, {
            name: args.name,
            retentionInDays: args.retentionInDays || 90,
            kmsKeyId: args.kmsKeyId,
            tags: defaultTags,
        }, { parent: this });
        this.logGroupName = this.logGroup.name;
        this.logGroupArn = this.logGroup.arn;
        this.registerOutputs({
            logGroup: this.logGroup,
            logGroupName: this.logGroupName,
            logGroupArn: this.logGroupArn,
        });
    }
}
exports.CloudWatchLogGroupComponent = CloudWatchLogGroupComponent;
class CloudWatchMetricAlarmComponent extends pulumi.ComponentResource {
    alarm;
    alarmArn;
    alarmName;
    constructor(name, args, opts) {
        super('aws:cloudwatch:CloudWatchMetricAlarmComponent', name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: 'Pulumi',
            Project: 'AWS-Nova-Model-Breaking',
            ...args.tags,
        };
        this.alarm = new aws.cloudwatch.MetricAlarm(`${name}-alarm`, {
            name: args.name,
            comparisonOperator: args.comparisonOperator,
            evaluationPeriods: args.evaluationPeriods,
            metricName: args.metricName,
            namespace: args.namespace,
            period: args.period,
            statistic: args.statistic,
            threshold: args.threshold,
            alarmDescription: args.alarmDescription || `Alarm for ${args.metricName}`,
            alarmActions: args.alarmActions,
            okActions: args.okActions,
            treatMissingData: args.treatMissingData || 'breaching',
            datapointsToAlarm: args.datapointsToAlarm,
            dimensions: args.dimensions,
            tags: defaultTags,
        }, { parent: this });
        this.alarmArn = this.alarm.arn;
        this.alarmName = this.alarm.name;
        this.registerOutputs({
            alarm: this.alarm,
            alarmArn: this.alarmArn,
            alarmName: this.alarmName,
        });
    }
}
exports.CloudWatchMetricAlarmComponent = CloudWatchMetricAlarmComponent;
class CloudWatchDashboardComponent extends pulumi.ComponentResource {
    dashboard;
    dashboardArn;
    constructor(name, args, opts) {
        super('aws:cloudwatch:CloudWatchDashboardComponent', name, {}, opts);
        this.dashboard = new aws.cloudwatch.Dashboard(`${name}-dashboard`, {
            dashboardName: args.name,
            dashboardBody: args.dashboardBody,
        }, { parent: this });
        this.dashboardArn = this.dashboard.dashboardArn;
        this.registerOutputs({
            dashboard: this.dashboard,
            dashboardArn: this.dashboardArn,
        });
    }
}
exports.CloudWatchDashboardComponent = CloudWatchDashboardComponent;
class ApplicationLogGroupsComponent extends pulumi.ComponentResource {
    systemLogs;
    securityLogs;
    applicationLogs;
    accessLogs;
    constructor(name, args, opts) {
        super('aws:cloudwatch:ApplicationLogGroupsComponent', name, {}, opts);
        // System logs
        const systemLogsComponent = new CloudWatchLogGroupComponent(`${name}-system`, {
            name: `/aws/ec2/${args.name}/system-logs`,
            retentionInDays: args.retentionInDays || 90,
            kmsKeyId: args.kmsKeyId,
            tags: {
                ...args.tags,
                LogType: 'System',
            },
        }, { parent: this });
        this.systemLogs = {
            logGroup: systemLogsComponent.logGroup,
            logGroupName: systemLogsComponent.logGroupName,
            logGroupArn: systemLogsComponent.logGroupArn,
        };
        // Security logs
        const securityLogsComponent = new CloudWatchLogGroupComponent(`${name}-security`, {
            name: `/aws/ec2/${args.name}/security-logs`,
            retentionInDays: args.retentionInDays || 90,
            kmsKeyId: args.kmsKeyId,
            tags: {
                ...args.tags,
                LogType: 'Security',
            },
        }, { parent: this });
        this.securityLogs = {
            logGroup: securityLogsComponent.logGroup,
            logGroupName: securityLogsComponent.logGroupName,
            logGroupArn: securityLogsComponent.logGroupArn,
        };
        // Application logs
        const applicationLogsComponent = new CloudWatchLogGroupComponent(`${name}-application`, {
            name: `/aws/application/${args.name}/logs`,
            retentionInDays: args.retentionInDays || 90,
            kmsKeyId: args.kmsKeyId,
            tags: {
                ...args.tags,
                LogType: 'Application',
            },
        }, { parent: this });
        this.applicationLogs = {
            logGroup: applicationLogsComponent.logGroup,
            logGroupName: applicationLogsComponent.logGroupName,
            logGroupArn: applicationLogsComponent.logGroupArn,
        };
        // Access logs
        const accessLogsComponent = new CloudWatchLogGroupComponent(`${name}-access`, {
            name: `/aws/elasticloadbalancing/${args.name}/access-logs`,
            retentionInDays: args.retentionInDays || 90,
            kmsKeyId: args.kmsKeyId,
            tags: {
                ...args.tags,
                LogType: 'Access',
            },
        }, { parent: this });
        this.accessLogs = {
            logGroup: accessLogsComponent.logGroup,
            logGroupName: accessLogsComponent.logGroupName,
            logGroupArn: accessLogsComponent.logGroupArn,
        };
        this.registerOutputs({
            systemLogs: this.systemLogs,
            securityLogs: this.securityLogs,
            applicationLogs: this.applicationLogs,
            accessLogs: this.accessLogs,
        });
    }
}
exports.ApplicationLogGroupsComponent = ApplicationLogGroupsComponent;
function createCloudWatchLogGroup(name, args) {
    const logGroupComponent = new CloudWatchLogGroupComponent(name, args);
    return {
        logGroup: logGroupComponent.logGroup,
        logGroupName: logGroupComponent.logGroupName,
        logGroupArn: logGroupComponent.logGroupArn,
    };
}
function createCloudWatchMetricAlarm(name, args) {
    const alarmComponent = new CloudWatchMetricAlarmComponent(name, args);
    return {
        alarm: alarmComponent.alarm,
        alarmArn: alarmComponent.alarmArn,
        alarmName: alarmComponent.alarmName,
    };
}
function createCloudWatchDashboard(name, args) {
    const dashboardComponent = new CloudWatchDashboardComponent(name, args);
    return dashboardComponent.dashboard;
}
function createApplicationLogGroups(name, args) {
    const appLogGroupsComponent = new ApplicationLogGroupsComponent(name, args);
    return {
        systemLogs: appLogGroupsComponent.systemLogs,
        securityLogs: appLogGroupsComponent.securityLogs,
        applicationLogs: appLogGroupsComponent.applicationLogs,
        accessLogs: appLogGroupsComponent.accessLogs,
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWRXYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsb3VkV2F0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBa1NBLDREQVVDO0FBRUQsa0VBVUM7QUFFRCw4REFNQztBQUVELGdFQVdDO0FBN1VELHVEQUF5QztBQUN6QyxpREFBbUM7QUEwRG5DLE1BQWEsMkJBQTRCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUN2RCxRQUFRLENBQTBCO0lBQ2xDLFlBQVksQ0FBd0I7SUFDcEMsV0FBVyxDQUF3QjtJQUVuRCxZQUNFLElBQVksRUFDWixJQUE0QixFQUM1QixJQUFzQztRQUV0QyxLQUFLLENBQUMsNENBQTRDLEVBQUUsSUFBSSxFQUFFLEVBQUUsRUFBRSxJQUFJLENBQUMsQ0FBQztRQUVwRSxNQUFNLFdBQVcsR0FBRztZQUNsQixJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixXQUFXLEVBQUUsTUFBTSxDQUFDLFFBQVEsRUFBRTtZQUM5QixTQUFTLEVBQUUsUUFBUTtZQUNuQixPQUFPLEVBQUUseUJBQXlCO1lBQ2xDLEdBQUcsSUFBSSxDQUFDLElBQUk7U0FDYixDQUFDO1FBRUYsSUFBSSxDQUFDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUN6QyxHQUFHLElBQUksWUFBWSxFQUNuQjtZQUNFLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLGVBQWUsRUFBRSxJQUFJLENBQUMsZUFBZSxJQUFJLEVBQUU7WUFDM0MsUUFBUSxFQUFFLElBQUksQ0FBQyxRQUFRO1lBQ3ZCLElBQUksRUFBRSxXQUFXO1NBQ2xCLEVBQ0QsRUFBRSxNQUFNLEVBQUUsSUFBSSxFQUFFLENBQ2pCLENBQUM7UUFFRixJQUFJLENBQUMsWUFBWSxHQUFHLElBQUksQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDO1FBQ3ZDLElBQUksQ0FBQyxXQUFXLEdB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QUMsQ0FBQztJQUN0RSxPQUFPO1FBQ0wsS0FBSyxFQUFFLGNBQWMsQ0FBQyxLQUFLO1FBQzNCLFFBQVEsRUFBRSxjQUFjLENBQUMsUUFBUTtRQUNqQyxTQUFTLEVBQUUsY0FBYyxDQUFDLFNBQVM7S0FDcEMsQ0FBQztBQUNKLENBQUM7QUFFRCxTQUFnQix5QkFBeUIsQ0FDdkMsSUFBWSxFQUNaLElBQTZCO0lBRTdCLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSw0QkFBNEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEUsT0FBTyxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7QUFDdEMsQ0FBQztBQUVELFNBQWdCLDBCQUEwQixDQUN4QyxJQUFZLEVBQ1osSUFBOEI7SUFFOUIsTUFBTSxxQkFBcUIsR0FBRyxJQUFJLDZCQUE2QixDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztJQUM1RSxPQUFPO1FBQ0wsVUFBVSxFQUFFLHFCQUFxQixDQUFDLFVBQVU7UUFDNUMsWUFBWSxFQUFFLHFCQUFxQixDQUFDLFlBQVk7UUFDaEQsZUFBZSxFQUFFLHFCQUFxQixDQUFDLGVBQWU7UUFDdEQsVUFBVSxFQUFFLHFCQUFxQixDQUFDLFVBQVU7S0FDN0MsQ0FBQztBQUNKLENBQUMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZFdhdGNoTG9nR3JvdXBBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICByZXRlbnRpb25JbkRheXM/OiBudW1iZXI7XG4gIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENsb3VkV2F0Y2hMb2dHcm91cFJlc3VsdCB7XG4gIGxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgbG9nR3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGxvZ0dyb3VwQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xvdWRXYXRjaE1ldHJpY0FsYXJtQXJncyB7XG4gIG5hbWU6IHN0cmluZztcbiAgY29tcGFyaXNvbk9wZXJhdG9yOiBzdHJpbmc7XG4gIGV2YWx1YXRpb25QZXJpb2RzOiBudW1iZXI7XG4gIG1ldHJpY05hbWU6IHN0cmluZztcbiAgbmFtZXNwYWNlOiBzdHJpbmc7XG4gIHBlcmlvZDogbnVtYmVyO1xuICBzdGF0aXN0aWM6IHN0cmluZztcbiAgdGhyZXNob2xkOiBudW1iZXI7XG4gIGFsYXJtRGVzY3JpcHRpb24/OiBzdHJpbmc7XG4gIGFsYXJtQWN0aW9ucz86IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gIG9rQWN0aW9ucz86IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gIHRyZWF0TWlzc2luZ0RhdGE/OiBzdHJpbmc7XG4gIGRhdGFwb2ludHNUb0FsYXJtPzogbnVtYmVyO1xuICBkaW1lbnNpb25zPzogUmVjb3JkPHN0cmluZywgcHVsdW1pLklucHV0PHN0cmluZz4+O1xuICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZFdhdGNoTWV0cmljQWxhcm1SZXN1bHQge1xuICBhbGFybTogYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm07XG4gIGFsYXJtQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIGFsYXJtTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENsb3VkV2F0Y2hEYXNoYm9hcmRBcmdzIHtcbiAgbmFtZTogc3RyaW5nO1xuICBkYXNoYm9hcmRCb2R5OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcHBsaWNhdGlvbkxvZ0dyb3Vwc0FyZ3Mge1xuICBuYW1lOiBzdHJpbmc7XG4gIHJldGVudGlvbkluRGF5cz86IG51bWJlcjtcbiAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQXBwbGljYXRpb25Mb2dHcm91cHNSZXN1bHQge1xuICBzeXN0ZW1Mb2dzOiBDbG91ZFdhdGNoTG9nR3JvdXBSZXN1bHQ7XG4gIHNlY3VyaXR5TG9nczogQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0O1xuICBhcHBsaWNhdGlvbkxvZ3M6IENsb3VkV2F0Y2hMb2dHcm91cFJlc3VsdDtcbiAgYWNjZXNzTG9nczogQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0O1xufVxuXG5leHBvcnQgY2xhc3MgQ2xvdWRXYXRjaExvZ0dyb3VwQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgbG9nR3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogQ2xvdWRXYXRjaExvZ0dyb3VwQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmNsb3Vkd2F0Y2g6Q2xvdWRXYXRjaExvZ0dyb3VwQ29tcG9uZW50JywgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICBNYW5hZ2VkQnk6ICdQdWx1bWknLFxuICAgICAgUHJvamVjdDogJ0FXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nJyxcbiAgICAgIC4uLmFyZ3MudGFncyxcbiAgICB9O1xuXG4gICAgdGhpcy5sb2dHcm91cCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cChcbiAgICAgIGAke25hbWV9LWxvZy1ncm91cGAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiBhcmdzLnJldGVudGlvbkluRGF5cyB8fCA5MCxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5sb2dHcm91cE5hbWUgPSB0aGlzLmxvZ0dyb3VwLm5hbWU7XG4gICAgdGhpcy5sb2dHcm91cEFybiA9IHRoaXMubG9nR3JvdXAuYXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgbG9nR3JvdXA6IHRoaXMubG9nR3JvdXAsXG4gICAgICBsb2dHcm91cE5hbWU6IHRoaXMubG9nR3JvdXBOYW1lLFxuICAgICAgbG9nR3JvdXBBcm46IHRoaXMubG9nR3JvdXBBcm4sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENsb3VkV2F0Y2hNZXRyaWNBbGFybUNvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBhbGFybTogYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm07XG4gIHB1YmxpYyByZWFkb25seSBhbGFybUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgYWxhcm1OYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IENsb3VkV2F0Y2hNZXRyaWNBbGFybUFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjbG91ZHdhdGNoOkNsb3VkV2F0Y2hNZXRyaWNBbGFybUNvbXBvbmVudCcsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgIGNvbnN0IGRlZmF1bHRUYWdzID0ge1xuICAgICAgTmFtZTogYXJncy5uYW1lLFxuICAgICAgRW52aXJvbm1lbnQ6IHB1bHVtaS5nZXRTdGFjaygpLFxuICAgICAgTWFuYWdlZEJ5OiAnUHVsdW1pJyxcbiAgICAgIFByb2plY3Q6ICdBV1MtTm92YS1Nb2RlbC1CcmVha2luZycsXG4gICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgfTtcblxuICAgIHRoaXMuYWxhcm0gPSBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgJHtuYW1lfS1hbGFybWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiBhcmdzLmNvbXBhcmlzb25PcGVyYXRvcixcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IGFyZ3MuZXZhbHVhdGlvblBlcmlvZHMsXG4gICAgICAgIG1ldHJpY05hbWU6IGFyZ3MubWV0cmljTmFtZSxcbiAgICAgICAgbmFtZXNwYWNlOiBhcmdzLm5hbWVzcGFjZSxcbiAgICAgICAgcGVyaW9kOiBhcmdzLnBlcmlvZCxcbiAgICAgICAgc3RhdGlzdGljOiBhcmdzLnN0YXRpc3RpYyxcbiAgICAgICAgdGhyZXNob2xkOiBhcmdzLnRocmVzaG9sZCxcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjpcbiAgICAgICAgICBhcmdzLmFsYXJtRGVzY3JpcHRpb24gfHwgYEFsYXJtIGZvciAke2FyZ3MubWV0cmljTmFtZX1gLFxuICAgICAgICBhbGFybUFjdGlvbnM6IGFyZ3MuYWxhcm1BY3Rpb25zLFxuICAgICAgICBva0FjdGlvbnM6IGFyZ3Mub2tBY3Rpb25zLFxuICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBhcmdzLnRyZWF0TWlzc2luZ0RhdGEgfHwgJ2JyZWFjaGluZycsXG4gICAgICAgIGRhdGFwb2ludHNUb0FsYXJtOiBhcmdzLmRhdGFwb2ludHNUb0FsYXJtLFxuICAgICAgICBkaW1lbnNpb25zOiBhcmdzLmRpbWVuc2lvbnMsXG4gICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5hbGFybUFybiA9IHRoaXMuYWxhcm0uYXJuO1xuICAgIHRoaXMuYWxhcm1OYW1lID0gdGhpcy5hbGFybS5uYW1lO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgYWxhcm06IHRoaXMuYWxhcm0sXG4gICAgICBhbGFybUFybjogdGhpcy5hbGFybUFybixcbiAgICAgIGFsYXJtTmFtZTogdGhpcy5hbGFybU5hbWUsXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIENsb3VkV2F0Y2hEYXNoYm9hcmRDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgZGFzaGJvYXJkOiBhd3MuY2xvdWR3YXRjaC5EYXNoYm9hcmQ7XG4gIHB1YmxpYyByZWFkb25seSBkYXNoYm9hcmRBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgYXJnczogQ2xvdWRXYXRjaERhc2hib2FyZEFyZ3MsXG4gICAgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnNcbiAgKSB7XG4gICAgc3VwZXIoJ2F3czpjbG91ZHdhdGNoOkNsb3VkV2F0Y2hEYXNoYm9hcmRDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICB0aGlzLmRhc2hib2FyZCA9IG5ldyBhd3MuY2xvdWR3YXRjaC5EYXNoYm9hcmQoXG4gICAgICBgJHtuYW1lfS1kYXNoYm9hcmRgLFxuICAgICAge1xuICAgICAgICBkYXNoYm9hcmROYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgIGRhc2hib2FyZEJvZHk6IGFyZ3MuZGFzaGJvYXJkQm9keSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuZGFzaGJvYXJkQXJuID0gdGhpcy5kYXNoYm9hcmQuZGFzaGJvYXJkQXJuO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZGFzaGJvYXJkOiB0aGlzLmRhc2hib2FyZCxcbiAgICAgIGRhc2hib2FyZEFybjogdGhpcy5kYXNoYm9hcmRBcm4sXG4gICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIEFwcGxpY2F0aW9uTG9nR3JvdXBzQ29tcG9uZW50IGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IHN5c3RlbUxvZ3M6IENsb3VkV2F0Y2hMb2dHcm91cFJlc3VsdDtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3VyaXR5TG9nczogQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0O1xuICBwdWJsaWMgcmVhZG9ubHkgYXBwbGljYXRpb25Mb2dzOiBDbG91ZFdhdGNoTG9nR3JvdXBSZXN1bHQ7XG4gIHB1YmxpYyByZWFkb25seSBhY2Nlc3NMb2dzOiBDbG91ZFdhdGNoTG9nR3JvdXBSZXN1bHQ7XG5cbiAgY29uc3RydWN0b3IoXG4gICAgbmFtZTogc3RyaW5nLFxuICAgIGFyZ3M6IEFwcGxpY2F0aW9uTG9nR3JvdXBzQXJncyxcbiAgICBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9uc1xuICApIHtcbiAgICBzdXBlcignYXdzOmNsb3Vkd2F0Y2g6QXBwbGljYXRpb25Mb2dHcm91cHNDb21wb25lbnQnLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAvLyBTeXN0ZW0gbG9nc1xuICAgIGNvbnN0IHN5c3RlbUxvZ3NDb21wb25lbnQgPSBuZXcgQ2xvdWRXYXRjaExvZ0dyb3VwQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tc3lzdGVtYCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYC9hd3MvZWMyLyR7YXJncy5uYW1lfS9zeXN0ZW0tbG9nc2AsXG4gICAgICAgIHJldGVudGlvbkluRGF5czogYXJncy5yZXRlbnRpb25JbkRheXMgfHwgOTAsXG4gICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgIExvZ1R5cGU6ICdTeXN0ZW0nLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5zeXN0ZW1Mb2dzID0ge1xuICAgICAgbG9nR3JvdXA6IHN5c3RlbUxvZ3NDb21wb25lbnQubG9nR3JvdXAsXG4gICAgICBsb2dHcm91cE5hbWU6IHN5c3RlbUxvZ3NDb21wb25lbnQubG9nR3JvdXBOYW1lLFxuICAgICAgbG9nR3JvdXBBcm46IHN5c3RlbUxvZ3NDb21wb25lbnQubG9nR3JvdXBBcm4sXG4gICAgfTtcblxuICAgIC8vIFNlY3VyaXR5IGxvZ3NcbiAgICBjb25zdCBzZWN1cml0eUxvZ3NDb21wb25lbnQgPSBuZXcgQ2xvdWRXYXRjaExvZ0dyb3VwQ29tcG9uZW50KFxuICAgICAgYCR7bmFtZX0tc2VjdXJpdHlgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgL2F3cy9lYzIvJHthcmdzLm5hbWV9L3NlY3VyaXR5LWxvZ3NgLFxuICAgICAgICByZXRlbnRpb25JbkRheXM6IGFyZ3MucmV0ZW50aW9uSW5EYXlzIHx8IDkwLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICBMb2dUeXBlOiAnU2VjdXJpdHknLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5zZWN1cml0eUxvZ3MgPSB7XG4gICAgICBsb2dHcm91cDogc2VjdXJpdHlMb2dzQ29tcG9uZW50LmxvZ0dyb3VwLFxuICAgICAgbG9nR3JvdXBOYW1lOiBzZWN1cml0eUxvZ3NDb21wb25lbnQubG9nR3JvdXBOYW1lLFxuICAgICAgbG9nR3JvdXBBcm46IHNlY3VyaXR5TG9nc0NvbXBvbmVudC5sb2dHcm91cEFybixcbiAgICB9O1xuXG4gICAgLy8gQXBwbGljYXRpb24gbG9nc1xuICAgIGNvbnN0IGFwcGxpY2F0aW9uTG9nc0NvbXBvbmVudCA9IG5ldyBDbG91ZFdhdGNoTG9nR3JvdXBDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS1hcHBsaWNhdGlvbmAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGAvYXdzL2FwcGxpY2F0aW9uLyR7YXJncy5uYW1lfS9sb2dzYCxcbiAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiBhcmdzLnJldGVudGlvbkluRGF5cyB8fCA5MCxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgICAgTG9nVHlwZTogJ0FwcGxpY2F0aW9uJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuYXBwbGljYXRpb25Mb2dzID0ge1xuICAgICAgbG9nR3JvdXA6IGFwcGxpY2F0aW9uTG9nc0NvbXBvbmVudC5sb2dHcm91cCxcbiAgICAgIGxvZ0dyb3VwTmFtZTogYXBwbGljYXRpb25Mb2dzQ29tcG9uZW50LmxvZ0dyb3VwTmFtZSxcbiAgICAgIGxvZ0dyb3VwQXJuOiBhcHBsaWNhdGlvbkxvZ3NDb21wb25lbnQubG9nR3JvdXBBcm4sXG4gICAgfTtcblxuICAgIC8vIEFjY2VzcyBsb2dzXG4gICAgY29uc3QgYWNjZXNzTG9nc0NvbXBvbmVudCA9IG5ldyBDbG91ZFdhdGNoTG9nR3JvdXBDb21wb25lbnQoXG4gICAgICBgJHtuYW1lfS1hY2Nlc3NgLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgL2F3cy9lbGFzdGljbG9hZGJhbGFuY2luZy8ke2FyZ3MubmFtZX0vYWNjZXNzLWxvZ3NgLFxuICAgICAgICByZXRlbnRpb25JbkRheXM6IGFyZ3MucmV0ZW50aW9uSW5EYXlzIHx8IDkwLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICBMb2dUeXBlOiAnQWNjZXNzJyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuYWNjZXNzTG9ncyA9IHtcbiAgICAgIGxvZ0dyb3VwOiBhY2Nlc3NMb2dzQ29tcG9uZW50LmxvZ0dyb3VwLFxuICAgICAgbG9nR3JvdXBOYW1lOiBhY2Nlc3NMb2dzQ29tcG9uZW50LmxvZ0dyb3VwTmFtZSxcbiAgICAgIGxvZ0dyb3VwQXJuOiBhY2Nlc3NMb2dzQ29tcG9uZW50LmxvZ0dyb3VwQXJuLFxuICAgIH07XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBzeXN0ZW1Mb2dzOiB0aGlzLnN5c3RlbUxvZ3MsXG4gICAgICBzZWN1cml0eUxvZ3M6IHRoaXMuc2VjdXJpdHlMb2dzLFxuICAgICAgYXBwbGljYXRpb25Mb2dzOiB0aGlzLmFwcGxpY2F0aW9uTG9ncyxcbiAgICAgIGFjY2Vzc0xvZ3M6IHRoaXMuYWNjZXNzTG9ncyxcbiAgICB9KTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2xvdWRXYXRjaExvZ0dyb3VwKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IENsb3VkV2F0Y2hMb2dHcm91cEFyZ3Ncbik6IENsb3VkV2F0Y2hMb2dHcm91cFJlc3VsdCB7XG4gIGNvbnN0IGxvZ0dyb3VwQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hMb2dHcm91cENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgcmV0dXJuIHtcbiAgICBsb2dHcm91cDogbG9nR3JvdXBDb21wb25lbnQubG9nR3JvdXAsXG4gICAgbG9nR3JvdXBOYW1lOiBsb2dHcm91cENvbXBvbmVudC5sb2dHcm91cE5hbWUsXG4gICAgbG9nR3JvdXBBcm46IGxvZ0dyb3VwQ29tcG9uZW50LmxvZ0dyb3VwQXJuLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2xvdWRXYXRjaE1ldHJpY0FsYXJtKFxuICBuYW1lOiBzdHJpbmcsXG4gIGFyZ3M6IENsb3VkV2F0Y2hNZXRyaWNBbGFybUFyZ3Ncbik6IENsb3VkV2F0Y2hNZXRyaWNBbGFybVJlc3VsdCB7XG4gIGNvbnN0IGFsYXJtQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hNZXRyaWNBbGFybUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgcmV0dXJuIHtcbiAgICBhbGFybTogYWxhcm1Db21wb25lbnQuYWxhcm0sXG4gICAgYWxhcm1Bcm46IGFsYXJtQ29tcG9uZW50LmFsYXJtQXJuLFxuICAgIGFsYXJtTmFtZTogYWxhcm1Db21wb25lbnQuYWxhcm1OYW1lLFxuICB9O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQ2xvdWRXYXRjaERhc2hib2FyZChcbiAgbmFtZTogc3RyaW5nLFxuICBhcmdzOiBDbG91ZFdhdGNoRGFzaGJvYXJkQXJnc1xuKTogYXdzLmNsb3Vkd2F0Y2guRGFzaGJvYXJkIHtcbiAgY29uc3QgZGFzaGJvYXJkQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hEYXNoYm9hcmRDb21wb25lbnQobmFtZSwgYXJncyk7XG4gIHJldHVybiBkYXNoYm9hcmRDb21wb25lbnQuZGFzaGJvYXJkO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gY3JlYXRlQXBwbGljYXRpb25Mb2dHcm91cHMoXG4gIG5hbWU6IHN0cmluZyxcbiAgYXJnczogQXBwbGljYXRpb25Mb2dHcm91cHNBcmdzXG4pOiBBcHBsaWNhdGlvbkxvZ0dyb3Vwc1Jlc3VsdCB7XG4gIGNvbnN0IGFwcExvZ0dyb3Vwc0NvbXBvbmVudCA9IG5ldyBBcHBsaWNhdGlvbkxvZ0dyb3Vwc0NvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgcmV0dXJuIHtcbiAgICBzeXN0ZW1Mb2dzOiBhcHBMb2dHcm91cHNDb21wb25lbnQuc3lzdGVtTG9ncyxcbiAgICBzZWN1cml0eUxvZ3M6IGFwcExvZ0dyb3Vwc0NvbXBvbmVudC5zZWN1cml0eUxvZ3MsXG4gICAgYXBwbGljYXRpb25Mb2dzOiBhcHBMb2dHcm91cHNDb21wb25lbnQuYXBwbGljYXRpb25Mb2dzLFxuICAgIGFjY2Vzc0xvZ3M6IGFwcExvZ0dyb3Vwc0NvbXBvbmVudC5hY2Nlc3NMb2dzLFxuICB9O1xufVxuIl19