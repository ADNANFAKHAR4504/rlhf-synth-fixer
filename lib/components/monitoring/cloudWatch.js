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
        super("aws:cloudwatch:CloudWatchLogGroupComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
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
        super("aws:cloudwatch:CloudWatchMetricAlarmComponent", name, {}, opts);
        const defaultTags = {
            Name: args.name,
            Environment: pulumi.getStack(),
            ManagedBy: "Pulumi",
            Project: "AWS-Nova-Model-Breaking",
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
            treatMissingData: args.treatMissingData || "breaching",
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
        super("aws:cloudwatch:CloudWatchDashboardComponent", name, {}, opts);
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
        super("aws:cloudwatch:ApplicationLogGroupsComponent", name, {}, opts);
        // System logs
        const systemLogsComponent = new CloudWatchLogGroupComponent(`${name}-system`, {
            name: `/aws/ec2/${args.name}/system-logs`,
            retentionInDays: args.retentionInDays || 90,
            kmsKeyId: args.kmsKeyId,
            tags: {
                ...args.tags,
                LogType: "System",
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
                LogType: "Security",
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
                LogType: "Application",
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
                LogType: "Access",
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2xvdWRXYXRjaC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImNsb3VkV2F0Y2gudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FBcVBBLDREQU9DO0FBRUQsa0VBT0M7QUFFRCw4REFHQztBQUVELGdFQVFDO0FBcFJELHVEQUF5QztBQUN6QyxpREFBbUM7QUEwRG5DLE1BQWEsMkJBQTRCLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNyRCxRQUFRLENBQTBCO0lBQ2xDLFlBQVksQ0FBd0I7SUFDcEMsV0FBVyxDQUF3QjtJQUVuRCxZQUFZLElBQVksRUFBRSxJQUE0QixFQUFFLElBQXNDO1FBQzFGLEtBQUssQ0FBQyw0Q0FBNEMsRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRXBFLE1BQU0sV0FBVyxHQUFHO1lBQ2hCLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSTtZQUNmLFdBQVcsRUFBRSxNQUFNLENBQUMsUUFBUSxFQUFFO1lBQzlCLFNBQVMsRUFBRSxRQUFRO1lBQ25CLE9BQU8sRUFBRSx5QkFBeUI7WUFDbEMsR0FBRyxJQUFJLENBQUMsSUFBSTtTQUNmLENBQUM7UUFFRixJQUFJLENBQUMsUUFBUSxHQUFHLElBQUksR0FBRyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsR0FBRyxJQUFJLFlBQVksRUFBRTtZQUM3RCxJQUFJLEVBQUUsSUFBSSxDQUFDLElBQUk7WUFDZixlQUFlLEVBQUUsSUFBSSxDQUFDLGVBQWUsSUFBSSxFQUFFO1lBQzNDLFFBQVEsRUFBRSxJQUFJLENBQUMsUUFBUTtZQUN2QixJQUFJLEVBQUUsV0FBVztTQUNwQixFQUFFLEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7UUFFckIsSUFBSSxDQUFDLFlBQVksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQztRQUN2QyxJQUFJLENBQUMsV0FBVyxHQUFH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T0FBTztRQUNILEtBQUssRUFBRSxjQUFjLENBQUMsS0FBSztRQUMzQixRQUFRLEVBQUUsY0FBYyxDQUFDLFFBQVE7UUFDakMsU0FBUyxFQUFFLGNBQWMsQ0FBQyxTQUFTO0tBQ3RDLENBQUM7QUFDTixDQUFDO0FBRUQsU0FBZ0IseUJBQXlCLENBQUMsSUFBWSxFQUFFLElBQTZCO0lBQ2pGLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSw0QkFBNEIsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7SUFDeEUsT0FBTyxrQkFBa0IsQ0FBQyxTQUFTLENBQUM7QUFDeEMsQ0FBQztBQUVELFNBQWdCLDBCQUEwQixDQUFDLElBQVksRUFBRSxJQUE4QjtJQUNuRixNQUFNLHFCQUFxQixHQUFHLElBQUksNkJBQTZCLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO0lBQzVFLE9BQU87UUFDSCxVQUFVLEVBQUUscUJBQXFCLENBQUMsVUFBVTtRQUM1QyxZQUFZLEVBQUUscUJBQXFCLENBQUMsWUFBWTtRQUNoRCxlQUFlLEVBQUUscUJBQXFCLENBQUMsZUFBZTtRQUN0RCxVQUFVLEVBQUUscUJBQXFCLENBQUMsVUFBVTtLQUMvQyxDQUFDO0FBQ04sQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIHB1bHVtaSBmcm9tIFwiQHB1bHVtaS9wdWx1bWlcIjtcbmltcG9ydCAqIGFzIGF3cyBmcm9tIFwiQHB1bHVtaS9hd3NcIjtcblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZFdhdGNoTG9nR3JvdXBBcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgcmV0ZW50aW9uSW5EYXlzPzogbnVtYmVyO1xuICAgIGttc0tleUlkPzogcHVsdW1pLklucHV0PHN0cmluZz47XG4gICAgdGFncz86IFJlY29yZDxzdHJpbmcsIHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0IHtcbiAgICBsb2dHcm91cDogYXdzLmNsb3Vkd2F0Y2guTG9nR3JvdXA7XG4gICAgbG9nR3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgbG9nR3JvdXBBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBDbG91ZFdhdGNoTWV0cmljQWxhcm1BcmdzIHtcbiAgICBuYW1lOiBzdHJpbmc7XG4gICAgY29tcGFyaXNvbk9wZXJhdG9yOiBzdHJpbmc7XG4gICAgZXZhbHVhdGlvblBlcmlvZHM6IG51bWJlcjtcbiAgICBtZXRyaWNOYW1lOiBzdHJpbmc7XG4gICAgbmFtZXNwYWNlOiBzdHJpbmc7XG4gICAgcGVyaW9kOiBudW1iZXI7XG4gICAgc3RhdGlzdGljOiBzdHJpbmc7XG4gICAgdGhyZXNob2xkOiBudW1iZXI7XG4gICAgYWxhcm1EZXNjcmlwdGlvbj86IHN0cmluZztcbiAgICBhbGFybUFjdGlvbnM/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPltdO1xuICAgIG9rQWN0aW9ucz86IHB1bHVtaS5JbnB1dDxzdHJpbmc+W107XG4gICAgdHJlYXRNaXNzaW5nRGF0YT86IHN0cmluZztcbiAgICBkYXRhcG9pbnRzVG9BbGFybT86IG51bWJlcjtcbiAgICBkaW1lbnNpb25zPzogUmVjb3JkPHN0cmluZywgcHVsdW1pLklucHV0PHN0cmluZz4+O1xuICAgIHRhZ3M/OiBSZWNvcmQ8c3RyaW5nLCBzdHJpbmc+O1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIENsb3VkV2F0Y2hNZXRyaWNBbGFybVJlc3VsdCB7XG4gICAgYWxhcm06IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtO1xuICAgIGFsYXJtQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgYWxhcm1OYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ2xvdWRXYXRjaERhc2hib2FyZEFyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICBkYXNoYm9hcmRCb2R5OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcHBsaWNhdGlvbkxvZ0dyb3Vwc0FyZ3Mge1xuICAgIG5hbWU6IHN0cmluZztcbiAgICByZXRlbnRpb25JbkRheXM/OiBudW1iZXI7XG4gICAga21zS2V5SWQ/OiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgICB0YWdzPzogUmVjb3JkPHN0cmluZywgc3RyaW5nPjtcbn1cblxuZXhwb3J0IGludGVyZmFjZSBBcHBsaWNhdGlvbkxvZ0dyb3Vwc1Jlc3VsdCB7XG4gICAgc3lzdGVtTG9nczogQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0O1xuICAgIHNlY3VyaXR5TG9nczogQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0O1xuICAgIGFwcGxpY2F0aW9uTG9nczogQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0O1xuICAgIGFjY2Vzc0xvZ3M6IENsb3VkV2F0Y2hMb2dHcm91cFJlc3VsdDtcbn1cblxuZXhwb3J0IGNsYXNzIENsb3VkV2F0Y2hMb2dHcm91cENvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwOiBhd3MuY2xvdWR3YXRjaC5Mb2dHcm91cDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgbG9nR3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGxvZ0dyb3VwQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IENsb3VkV2F0Y2hMb2dHcm91cEFyZ3MsIG9wdHM/OiBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2VPcHRpb25zKSB7XG4gICAgICAgIHN1cGVyKFwiYXdzOmNsb3Vkd2F0Y2g6Q2xvdWRXYXRjaExvZ0dyb3VwQ29tcG9uZW50XCIsIG5hbWUsIHt9LCBvcHRzKTtcblxuICAgICAgICBjb25zdCBkZWZhdWx0VGFncyA9IHtcbiAgICAgICAgICAgIE5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIEVudmlyb25tZW50OiBwdWx1bWkuZ2V0U3RhY2soKSxcbiAgICAgICAgICAgIE1hbmFnZWRCeTogXCJQdWx1bWlcIixcbiAgICAgICAgICAgIFByb2plY3Q6IFwiQVdTLU5vdmEtTW9kZWwtQnJlYWtpbmdcIixcbiAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgfTtcblxuICAgICAgICB0aGlzLmxvZ0dyb3VwID0gbmV3IGF3cy5jbG91ZHdhdGNoLkxvZ0dyb3VwKGAke25hbWV9LWxvZy1ncm91cGAsIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIHJldGVudGlvbkluRGF5czogYXJncy5yZXRlbnRpb25JbkRheXMgfHwgOTAsXG4gICAgICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIHRhZ3M6IGRlZmF1bHRUYWdzLFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLmxvZ0dyb3VwTmFtZSA9IHRoaXMubG9nR3JvdXAubmFtZTtcbiAgICAgICAgdGhpcy5sb2dHcm91cEFybiA9IHRoaXMubG9nR3JvdXAuYXJuO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGxvZ0dyb3VwOiB0aGlzLmxvZ0dyb3VwLFxuICAgICAgICAgICAgbG9nR3JvdXBOYW1lOiB0aGlzLmxvZ0dyb3VwTmFtZSxcbiAgICAgICAgICAgIGxvZ0dyb3VwQXJuOiB0aGlzLmxvZ0dyb3VwQXJuLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBDbG91ZFdhdGNoTWV0cmljQWxhcm1Db21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBhbGFybTogYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm07XG4gICAgcHVibGljIHJlYWRvbmx5IGFsYXJtQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gICAgcHVibGljIHJlYWRvbmx5IGFsYXJtTmFtZTogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuXG4gICAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBDbG91ZFdhdGNoTWV0cmljQWxhcm1BcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpjbG91ZHdhdGNoOkNsb3VkV2F0Y2hNZXRyaWNBbGFybUNvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgY29uc3QgZGVmYXVsdFRhZ3MgPSB7XG4gICAgICAgICAgICBOYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBFbnZpcm9ubWVudDogcHVsdW1pLmdldFN0YWNrKCksXG4gICAgICAgICAgICBNYW5hZ2VkQnk6IFwiUHVsdW1pXCIsXG4gICAgICAgICAgICBQcm9qZWN0OiBcIkFXUy1Ob3ZhLU1vZGVsLUJyZWFraW5nXCIsXG4gICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5hbGFybSA9IG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShgJHtuYW1lfS1hbGFybWAsIHtcbiAgICAgICAgICAgIG5hbWU6IGFyZ3MubmFtZSxcbiAgICAgICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogYXJncy5jb21wYXJpc29uT3BlcmF0b3IsXG4gICAgICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogYXJncy5ldmFsdWF0aW9uUGVyaW9kcyxcbiAgICAgICAgICAgIG1ldHJpY05hbWU6IGFyZ3MubWV0cmljTmFtZSxcbiAgICAgICAgICAgIG5hbWVzcGFjZTogYXJncy5uYW1lc3BhY2UsXG4gICAgICAgICAgICBwZXJpb2Q6IGFyZ3MucGVyaW9kLFxuICAgICAgICAgICAgc3RhdGlzdGljOiBhcmdzLnN0YXRpc3RpYyxcbiAgICAgICAgICAgIHRocmVzaG9sZDogYXJncy50aHJlc2hvbGQsXG4gICAgICAgICAgICBhbGFybURlc2NyaXB0aW9uOiBhcmdzLmFsYXJtRGVzY3JpcHRpb24gfHwgYEFsYXJtIGZvciAke2FyZ3MubWV0cmljTmFtZX1gLFxuICAgICAgICAgICAgYWxhcm1BY3Rpb25zOiBhcmdzLmFsYXJtQWN0aW9ucyxcbiAgICAgICAgICAgIG9rQWN0aW9uczogYXJncy5va0FjdGlvbnMsXG4gICAgICAgICAgICB0cmVhdE1pc3NpbmdEYXRhOiBhcmdzLnRyZWF0TWlzc2luZ0RhdGEgfHwgXCJicmVhY2hpbmdcIixcbiAgICAgICAgICAgIGRhdGFwb2ludHNUb0FsYXJtOiBhcmdzLmRhdGFwb2ludHNUb0FsYXJtLFxuICAgICAgICAgICAgZGltZW5zaW9uczogYXJncy5kaW1lbnNpb25zLFxuICAgICAgICAgICAgdGFnczogZGVmYXVsdFRhZ3MsXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMuYWxhcm1Bcm4gPSB0aGlzLmFsYXJtLmFybjtcbiAgICAgICAgdGhpcy5hbGFybU5hbWUgPSB0aGlzLmFsYXJtLm5hbWU7XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgYWxhcm06IHRoaXMuYWxhcm0sXG4gICAgICAgICAgICBhbGFybUFybjogdGhpcy5hbGFybUFybixcbiAgICAgICAgICAgIGFsYXJtTmFtZTogdGhpcy5hbGFybU5hbWUsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGNsYXNzIENsb3VkV2F0Y2hEYXNoYm9hcmRDb21wb25lbnQgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICAgIHB1YmxpYyByZWFkb25seSBkYXNoYm9hcmQ6IGF3cy5jbG91ZHdhdGNoLkRhc2hib2FyZDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgZGFzaGJvYXJkQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IENsb3VkV2F0Y2hEYXNoYm9hcmRBcmdzLCBvcHRzPzogcHVsdW1pLkNvbXBvbmVudFJlc291cmNlT3B0aW9ucykge1xuICAgICAgICBzdXBlcihcImF3czpjbG91ZHdhdGNoOkNsb3VkV2F0Y2hEYXNoYm9hcmRDb21wb25lbnRcIiwgbmFtZSwge30sIG9wdHMpO1xuXG4gICAgICAgIHRoaXMuZGFzaGJvYXJkID0gbmV3IGF3cy5jbG91ZHdhdGNoLkRhc2hib2FyZChgJHtuYW1lfS1kYXNoYm9hcmRgLCB7XG4gICAgICAgICAgICBkYXNoYm9hcmROYW1lOiBhcmdzLm5hbWUsXG4gICAgICAgICAgICBkYXNoYm9hcmRCb2R5OiBhcmdzLmRhc2hib2FyZEJvZHksXG4gICAgICAgIH0sIHsgcGFyZW50OiB0aGlzIH0pO1xuXG4gICAgICAgIHRoaXMuZGFzaGJvYXJkQXJuID0gdGhpcy5kYXNoYm9hcmQuZGFzaGJvYXJkQXJuO1xuXG4gICAgICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgICAgICAgIGRhc2hib2FyZDogdGhpcy5kYXNoYm9hcmQsXG4gICAgICAgICAgICBkYXNoYm9hcmRBcm46IHRoaXMuZGFzaGJvYXJkQXJuLFxuICAgICAgICB9KTtcbiAgICB9XG59XG5cbmV4cG9ydCBjbGFzcyBBcHBsaWNhdGlvbkxvZ0dyb3Vwc0NvbXBvbmVudCBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gICAgcHVibGljIHJlYWRvbmx5IHN5c3RlbUxvZ3M6IENsb3VkV2F0Y2hMb2dHcm91cFJlc3VsdDtcbiAgICBwdWJsaWMgcmVhZG9ubHkgc2VjdXJpdHlMb2dzOiBDbG91ZFdhdGNoTG9nR3JvdXBSZXN1bHQ7XG4gICAgcHVibGljIHJlYWRvbmx5IGFwcGxpY2F0aW9uTG9nczogQ2xvdWRXYXRjaExvZ0dyb3VwUmVzdWx0O1xuICAgIHB1YmxpYyByZWFkb25seSBhY2Nlc3NMb2dzOiBDbG91ZFdhdGNoTG9nR3JvdXBSZXN1bHQ7XG5cbiAgICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IEFwcGxpY2F0aW9uTG9nR3JvdXBzQXJncywgb3B0cz86IHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICAgICAgc3VwZXIoXCJhd3M6Y2xvdWR3YXRjaDpBcHBsaWNhdGlvbkxvZ0dyb3Vwc0NvbXBvbmVudFwiLCBuYW1lLCB7fSwgb3B0cyk7XG5cbiAgICAgICAgLy8gU3lzdGVtIGxvZ3NcbiAgICAgICAgY29uc3Qgc3lzdGVtTG9nc0NvbXBvbmVudCA9IG5ldyBDbG91ZFdhdGNoTG9nR3JvdXBDb21wb25lbnQoYCR7bmFtZX0tc3lzdGVtYCwge1xuICAgICAgICAgICAgbmFtZTogYC9hd3MvZWMyLyR7YXJncy5uYW1lfS9zeXN0ZW0tbG9nc2AsXG4gICAgICAgICAgICByZXRlbnRpb25JbkRheXM6IGFyZ3MucmV0ZW50aW9uSW5EYXlzIHx8IDkwLFxuICAgICAgICAgICAga21zS2V5SWQ6IGFyZ3Mua21zS2V5SWQsXG4gICAgICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgICAgICAgLi4uYXJncy50YWdzLFxuICAgICAgICAgICAgICAgIExvZ1R5cGU6IFwiU3lzdGVtXCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnN5c3RlbUxvZ3MgPSB7XG4gICAgICAgICAgICBsb2dHcm91cDogc3lzdGVtTG9nc0NvbXBvbmVudC5sb2dHcm91cCxcbiAgICAgICAgICAgIGxvZ0dyb3VwTmFtZTogc3lzdGVtTG9nc0NvbXBvbmVudC5sb2dHcm91cE5hbWUsXG4gICAgICAgICAgICBsb2dHcm91cEFybjogc3lzdGVtTG9nc0NvbXBvbmVudC5sb2dHcm91cEFybixcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBTZWN1cml0eSBsb2dzXG4gICAgICAgIGNvbnN0IHNlY3VyaXR5TG9nc0NvbXBvbmVudCA9IG5ldyBDbG91ZFdhdGNoTG9nR3JvdXBDb21wb25lbnQoYCR7bmFtZX0tc2VjdXJpdHlgLCB7XG4gICAgICAgICAgICBuYW1lOiBgL2F3cy9lYzIvJHthcmdzLm5hbWV9L3NlY3VyaXR5LWxvZ3NgLFxuICAgICAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiBhcmdzLnJldGVudGlvbkluRGF5cyB8fCA5MCxcbiAgICAgICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICAgICAgICBMb2dUeXBlOiBcIlNlY3VyaXR5XCIsXG4gICAgICAgICAgICB9LFxuICAgICAgICB9LCB7IHBhcmVudDogdGhpcyB9KTtcblxuICAgICAgICB0aGlzLnNlY3VyaXR5TG9ncyA9IHtcbiAgICAgICAgICAgIGxvZ0dyb3VwOiBzZWN1cml0eUxvZ3NDb21wb25lbnQubG9nR3JvdXAsXG4gICAgICAgICAgICBsb2dHcm91cE5hbWU6IHNlY3VyaXR5TG9nc0NvbXBvbmVudC5sb2dHcm91cE5hbWUsXG4gICAgICAgICAgICBsb2dHcm91cEFybjogc2VjdXJpdHlMb2dzQ29tcG9uZW50LmxvZ0dyb3VwQXJuLFxuICAgICAgICB9O1xuXG4gICAgICAgIC8vIEFwcGxpY2F0aW9uIGxvZ3NcbiAgICAgICAgY29uc3QgYXBwbGljYXRpb25Mb2dzQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hMb2dHcm91cENvbXBvbmVudChgJHtuYW1lfS1hcHBsaWNhdGlvbmAsIHtcbiAgICAgICAgICAgIG5hbWU6IGAvYXdzL2FwcGxpY2F0aW9uLyR7YXJncy5uYW1lfS9sb2dzYCxcbiAgICAgICAgICAgIHJldGVudGlvbkluRGF5czogYXJncy5yZXRlbnRpb25JbkRheXMgfHwgOTAsXG4gICAgICAgICAgICBrbXNLZXlJZDogYXJncy5rbXNLZXlJZCxcbiAgICAgICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICAgICAgICAuLi5hcmdzLnRhZ3MsXG4gICAgICAgICAgICAgICAgTG9nVHlwZTogXCJBcHBsaWNhdGlvblwiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5hcHBsaWNhdGlvbkxvZ3MgPSB7XG4gICAgICAgICAgICBsb2dHcm91cDogYXBwbGljYXRpb25Mb2dzQ29tcG9uZW50LmxvZ0dyb3VwLFxuICAgICAgICAgICAgbG9nR3JvdXBOYW1lOiBhcHBsaWNhdGlvbkxvZ3NDb21wb25lbnQubG9nR3JvdXBOYW1lLFxuICAgICAgICAgICAgbG9nR3JvdXBBcm46IGFwcGxpY2F0aW9uTG9nc0NvbXBvbmVudC5sb2dHcm91cEFybixcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBBY2Nlc3MgbG9nc1xuICAgICAgICBjb25zdCBhY2Nlc3NMb2dzQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hMb2dHcm91cENvbXBvbmVudChgJHtuYW1lfS1hY2Nlc3NgLCB7XG4gICAgICAgICAgICBuYW1lOiBgL2F3cy9lbGFzdGljbG9hZGJhbGFuY2luZy8ke2FyZ3MubmFtZX0vYWNjZXNzLWxvZ3NgLFxuICAgICAgICAgICAgcmV0ZW50aW9uSW5EYXlzOiBhcmdzLnJldGVudGlvbkluRGF5cyB8fCA5MCxcbiAgICAgICAgICAgIGttc0tleUlkOiBhcmdzLmttc0tleUlkLFxuICAgICAgICAgICAgdGFnczoge1xuICAgICAgICAgICAgICAgIC4uLmFyZ3MudGFncyxcbiAgICAgICAgICAgICAgICBMb2dUeXBlOiBcIkFjY2Vzc1wiLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSwgeyBwYXJlbnQ6IHRoaXMgfSk7XG5cbiAgICAgICAgdGhpcy5hY2Nlc3NMb2dzID0ge1xuICAgICAgICAgICAgbG9nR3JvdXA6IGFjY2Vzc0xvZ3NDb21wb25lbnQubG9nR3JvdXAsXG4gICAgICAgICAgICBsb2dHcm91cE5hbWU6IGFjY2Vzc0xvZ3NDb21wb25lbnQubG9nR3JvdXBOYW1lLFxuICAgICAgICAgICAgbG9nR3JvdXBBcm46IGFjY2Vzc0xvZ3NDb21wb25lbnQubG9nR3JvdXBBcm4sXG4gICAgICAgIH07XG5cbiAgICAgICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgICAgICAgc3lzdGVtTG9nczogdGhpcy5zeXN0ZW1Mb2dzLFxuICAgICAgICAgICAgc2VjdXJpdHlMb2dzOiB0aGlzLnNlY3VyaXR5TG9ncyxcbiAgICAgICAgICAgIGFwcGxpY2F0aW9uTG9nczogdGhpcy5hcHBsaWNhdGlvbkxvZ3MsXG4gICAgICAgICAgICBhY2Nlc3NMb2dzOiB0aGlzLmFjY2Vzc0xvZ3MsXG4gICAgICAgIH0pO1xuICAgIH1cbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNsb3VkV2F0Y2hMb2dHcm91cChuYW1lOiBzdHJpbmcsIGFyZ3M6IENsb3VkV2F0Y2hMb2dHcm91cEFyZ3MpOiBDbG91ZFdhdGNoTG9nR3JvdXBSZXN1bHQge1xuICAgIGNvbnN0IGxvZ0dyb3VwQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hMb2dHcm91cENvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBsb2dHcm91cDogbG9nR3JvdXBDb21wb25lbnQubG9nR3JvdXAsXG4gICAgICAgIGxvZ0dyb3VwTmFtZTogbG9nR3JvdXBDb21wb25lbnQubG9nR3JvdXBOYW1lLFxuICAgICAgICBsb2dHcm91cEFybjogbG9nR3JvdXBDb21wb25lbnQubG9nR3JvdXBBcm4sXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNsb3VkV2F0Y2hNZXRyaWNBbGFybShuYW1lOiBzdHJpbmcsIGFyZ3M6IENsb3VkV2F0Y2hNZXRyaWNBbGFybUFyZ3MpOiBDbG91ZFdhdGNoTWV0cmljQWxhcm1SZXN1bHQge1xuICAgIGNvbnN0IGFsYXJtQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hNZXRyaWNBbGFybUNvbXBvbmVudChuYW1lLCBhcmdzKTtcbiAgICByZXR1cm4ge1xuICAgICAgICBhbGFybTogYWxhcm1Db21wb25lbnQuYWxhcm0sXG4gICAgICAgIGFsYXJtQXJuOiBhbGFybUNvbXBvbmVudC5hbGFybUFybixcbiAgICAgICAgYWxhcm1OYW1lOiBhbGFybUNvbXBvbmVudC5hbGFybU5hbWUsXG4gICAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZUNsb3VkV2F0Y2hEYXNoYm9hcmQobmFtZTogc3RyaW5nLCBhcmdzOiBDbG91ZFdhdGNoRGFzaGJvYXJkQXJncyk6IGF3cy5jbG91ZHdhdGNoLkRhc2hib2FyZCB7XG4gICAgY29uc3QgZGFzaGJvYXJkQ29tcG9uZW50ID0gbmV3IENsb3VkV2F0Y2hEYXNoYm9hcmRDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIGRhc2hib2FyZENvbXBvbmVudC5kYXNoYm9hcmQ7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVBcHBsaWNhdGlvbkxvZ0dyb3VwcyhuYW1lOiBzdHJpbmcsIGFyZ3M6IEFwcGxpY2F0aW9uTG9nR3JvdXBzQXJncyk6IEFwcGxpY2F0aW9uTG9nR3JvdXBzUmVzdWx0IHtcbiAgICBjb25zdCBhcHBMb2dHcm91cHNDb21wb25lbnQgPSBuZXcgQXBwbGljYXRpb25Mb2dHcm91cHNDb21wb25lbnQobmFtZSwgYXJncyk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgc3lzdGVtTG9nczogYXBwTG9nR3JvdXBzQ29tcG9uZW50LnN5c3RlbUxvZ3MsXG4gICAgICAgIHNlY3VyaXR5TG9nczogYXBwTG9nR3JvdXBzQ29tcG9uZW50LnNlY3VyaXR5TG9ncyxcbiAgICAgICAgYXBwbGljYXRpb25Mb2dzOiBhcHBMb2dHcm91cHNDb21wb25lbnQuYXBwbGljYXRpb25Mb2dzLFxuICAgICAgICBhY2Nlc3NMb2dzOiBhcHBMb2dHcm91cHNDb21wb25lbnQuYWNjZXNzTG9ncyxcbiAgICB9O1xufSJdfQ==