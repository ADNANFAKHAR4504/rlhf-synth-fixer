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
exports.RdsStack = void 0;
const aws = __importStar(require("@pulumi/aws"));
const pulumi = __importStar(require("@pulumi/pulumi"));
class RdsStack extends pulumi.ComponentResource {
    dbInstanceId;
    dbInstanceArn;
    dbInstanceEndpoint;
    dbInstancePort;
    dbSubnetGroupName;
    constructor(name, args, opts) {
        super('tap:rds:RdsStack', name, args, opts);
        const environmentSuffix = args.environmentSuffix || 'dev';
        const instanceClass = args.instanceClass || 'db.t3.micro';
        const tags = args.tags || {};
        // Tripwire to catch bad subnet inputs early
        pulumi.output(args.privateSubnetIds).apply(ids => {
            if (!ids || ids.length < 2) {
                throw new Error(`RDS needs at least two private subnets; got ${ids?.length ?? 0}.`);
            }
        });
        // Subnet group
        const dbSubnetGroup = new aws.rds.SubnetGroup(`tap-db-subnet-group-${environmentSuffix}`, {
            name: `tap-db-subnet-group-${environmentSuffix}`,
            subnetIds: args.privateSubnetIds,
            tags: { Name: `tap-db-subnet-group-${environmentSuffix}`, ...tags },
        }, { parent: this });
        // Enhanced monitoring role
        const monitoringRole = new aws.iam.Role(`tap-rds-monitoring-role-${environmentSuffix}`, {
            name: `tap-rds-monitoring-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: { Service: 'monitoring.rds.amazonaws.com' },
                    },
                ],
            }),
            tags: { Name: `tap-rds-monitoring-role-${environmentSuffix}`, ...tags },
        }, { parent: this });
        new aws.iam.RolePolicyAttachment(`tap-rds-monitoring-attachment-${environmentSuffix}`, {
            role: monitoringRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        }, { parent: this });
        // DB instance
        const dbInstance = new aws.rds.Instance(`tap-db-${environmentSuffix}`, {
            identifier: `tap-db-${environmentSuffix}`,
            instanceClass,
            engine: 'mysql',
            engineVersion: '8.0', // or a pinned patch like '8.0.35'
            allocatedStorage: 20,
            storageType: 'gp3',
            storageEncrypted: true,
            kmsKeyId: args.rdsKmsKeyArn,
            dbName: 'tapdb',
            username: 'admin',
            manageMasterUserPassword: true,
            masterUserSecretKmsKeyId: args.rdsKmsKeyArn,
            vpcSecurityGroupIds: [args.dbSecurityGroupId],
            dbSubnetGroupName: dbSubnetGroup.name,
            publiclyAccessible: false,
            backupRetentionPeriod: 7,
            backupWindow: '03:00-04:00',
            maintenanceWindow: 'sun:04:00-sun:05:00',
            autoMinorVersionUpgrade: true,
            skipFinalSnapshot: false,
            finalSnapshotIdentifier: `tap-db-final-snapshot-${environmentSuffix}`,
            deleteAutomatedBackups: false,
            enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
            monitoringInterval: 60,
            monitoringRoleArn: monitoringRole.arn,
            // CloudWatch Database Insights - Enhanced monitoring with detailed metrics
            // This provides comprehensive database monitoring through CloudWatch
            // without the instance class restrictions of Performance Insights
            tags: {
                Name: `tap-db-${environmentSuffix}`,
                Purpose: 'MainDatabase',
                ...tags,
            },
        }, { parent: this });
        // CloudWatch Database Insights - Create alarms for key database metrics
        // This provides comprehensive monitoring similar to Performance Insights
        // CPU Utilization Alarm
        new aws.cloudwatch.MetricAlarm(`tap-db-cpu-alarm-${environmentSuffix}`, {
            name: `tap-db-cpu-utilization-${environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'CPUUtilization',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 80,
            alarmDescription: 'RDS CPU utilization is too high',
            dimensions: {
                DBInstanceIdentifier: dbInstance.id,
            },
            tags: {
                Name: `tap-db-cpu-alarm-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Database Connections Alarm
        new aws.cloudwatch.MetricAlarm(`tap-db-connections-alarm-${environmentSuffix}`, {
            name: `tap-db-connections-${environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'DatabaseConnections',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 40, // Adjust based on your connection pool size
            alarmDescription: 'RDS connection count is too high',
            dimensions: {
                DBInstanceIdentifier: dbInstance.id,
            },
            tags: {
                Name: `tap-db-connections-alarm-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Free Storage Space Alarm
        new aws.cloudwatch.MetricAlarm(`tap-db-storage-alarm-${environmentSuffix}`, {
            name: `tap-db-free-storage-${environmentSuffix}`,
            comparisonOperator: 'LessThanThreshold',
            evaluationPeriods: 1,
            metricName: 'FreeStorageSpace',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 2000000000, // 2GB in bytes
            alarmDescription: 'RDS free storage space is low',
            dimensions: {
                DBInstanceIdentifier: dbInstance.id,
            },
            tags: {
                Name: `tap-db-storage-alarm-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Read Latency Alarm
        new aws.cloudwatch.MetricAlarm(`tap-db-read-latency-alarm-${environmentSuffix}`, {
            name: `tap-db-read-latency-${environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'ReadLatency',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 0.2, // 200ms
            alarmDescription: 'RDS read latency is too high',
            dimensions: {
                DBInstanceIdentifier: dbInstance.id,
            },
            tags: {
                Name: `tap-db-read-latency-alarm-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Write Latency Alarm
        new aws.cloudwatch.MetricAlarm(`tap-db-write-latency-alarm-${environmentSuffix}`, {
            name: `tap-db-write-latency-${environmentSuffix}`,
            comparisonOperator: 'GreaterThanThreshold',
            evaluationPeriods: 2,
            metricName: 'WriteLatency',
            namespace: 'AWS/RDS',
            period: 300,
            statistic: 'Average',
            threshold: 0.2, // 200ms
            alarmDescription: 'RDS write latency is too high',
            dimensions: {
                DBInstanceIdentifier: dbInstance.id,
            },
            tags: {
                Name: `tap-db-write-latency-alarm-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        this.dbInstanceId = dbInstance.id;
        this.dbInstanceArn = dbInstance.arn;
        this.dbInstanceEndpoint = dbInstance.endpoint;
        this.dbInstancePort = dbInstance.port;
        this.dbSubnetGroupName = dbSubnetGroup.name;
        this.registerOutputs({
            dbInstanceId: this.dbInstanceId,
            dbInstanceArn: this.dbInstanceArn,
            dbInstanceEndpoint: this.dbInstanceEndpoint,
            dbInstancePort: this.dbInstancePort,
            dbSubnetGroupName: this.dbSubnetGroupName,
        });
    }
}
exports.RdsStack = RdsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFZekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxZQUFZLENBQXdCO0lBQ3BDLGFBQWEsQ0FBd0I7SUFDckMsa0JBQWtCLENBQXdCO0lBQzFDLGNBQWMsQ0FBd0I7SUFDdEMsaUJBQWlCLENBQXdCO0lBRXpELFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQUksYUFBYSxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLDRDQUE0QztRQUM1QyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMvQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxLQUFLLENBQ2IsK0NBQStDLEdBQUcsRUFBRSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQ25FLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxlQUFlO1FBQ2YsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FDM0MsdUJBQXVCLGlCQUFpQixFQUFFLEVBQzFDO1lBQ0Us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YztZQUNuQyxpQkFBaUIsRUFBRSxJQUFJLENBQUMsaUJBQWlCO1NBQzFDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXpQRCw0QkF5UEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBSZHNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLklucHV0PHB1bHVtaS5JbnB1dDxzdHJpbmc+W10+O1xuICBkYlNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHJkc0ttc0tleUFybjogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGluc3RhbmNlQ2xhc3M/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBSZHNTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VFbmRwb2ludDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZVBvcnQ6IHB1bHVtaS5PdXRwdXQ8bnVtYmVyPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiU3VibmV0R3JvdXBOYW1lOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBSZHNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnJkczpSZHNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IGluc3RhbmNlQ2xhc3MgPSBhcmdzLmluc3RhbmNlQ2xhc3MgfHwgJ2RiLnQzLm1pY3JvJztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gVHJpcHdpcmUgdG8gY2F0Y2ggYmFkIHN1Ym5ldCBpbnB1dHMgZWFybHlcbiAgICBwdWx1bWkub3V0cHV0KGFyZ3MucHJpdmF0ZVN1Ym5ldElkcykuYXBwbHkoaWRzID0+IHtcbiAgICAgIGlmICghaWRzIHx8IGlkcy5sZW5ndGggPCAyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgUkRTIG5lZWRzIGF0IGxlYXN0IHR3byBwcml2YXRlIHN1Ym5ldHM7IGdvdCAke2lkcz8ubGVuZ3RoID8/IDB9LmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFN1Ym5ldCBncm91cFxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgYXdzLnJkcy5TdWJuZXRHcm91cChcbiAgICAgIGB0YXAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1kYi1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBzdWJuZXRJZHM6IGFyZ3MucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgICAgdGFnczogeyBOYW1lOiBgdGFwLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuaGFuY2VkIG1vbml0b3Jpbmcgcm9sZVxuICAgIGNvbnN0IG1vbml0b3JpbmdSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGB0YXAtcmRzLW1vbml0b3Jpbmctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtcmRzLW1vbml0b3Jpbmctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHsgU2VydmljZTogJ21vbml0b3JpbmcucmRzLmFtYXpvbmF3cy5jb20nIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiB7IE5hbWU6IGB0YXAtcmRzLW1vbml0b3Jpbmctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYHRhcC1yZHMtbW9uaXRvcmluZy1hdHRhY2htZW50LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogbW9uaXRvcmluZ1JvbGUubmFtZSxcbiAgICAgICAgcG9saWN5QXJuOlxuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQW1hem9uUkRTRW5oYW5jZWRNb25pdG9yaW5nUm9sZScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBEQiBpbnN0YW5jZVxuICAgIGNvbnN0IGRiSW5zdGFuY2UgPSBuZXcgYXdzLnJkcy5JbnN0YW5jZShcbiAgICAgIGB0YXAtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBpZGVudGlmaWVyOiBgdGFwLWRiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgaW5zdGFuY2VDbGFzcyxcbiAgICAgICAgZW5naW5lOiAnbXlzcWwnLFxuICAgICAgICBlbmdpbmVWZXJzaW9uOiAnOC4wJywgLy8gb3IgYSBwaW5uZWQgcGF0Y2ggbGlrZSAnOC4wLjM1J1xuICAgICAgICBhbGxvY2F0ZWRTdG9yYWdlOiAyMCxcbiAgICAgICAgc3RvcmFnZVR5cGU6ICdncDMnLFxuICAgICAgICBzdG9yYWdlRW5jcnlwdGVkOiB0cnVlLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5yZHNLbXNLZXlBcm4sXG5cbiAgICAgICAgZGJOYW1lOiAndGFwZGInLFxuICAgICAgICB1c2VybmFtZTogJ2FkbWluJyxcbiAgICAgICAgbWFuYWdlTWFzdGVyVXNlclBhc3N3b3JkOiB0cnVlLFxuICAgICAgICBtYXN0ZXJVc2VyU2VjcmV0S21zS2V5SWQ6IGFyZ3MucmRzS21zS2V5QXJuLFxuXG4gICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFthcmdzLmRiU2VjdXJpdHlHcm91cElkXSxcbiAgICAgICAgZGJTdWJuZXRHcm91cE5hbWU6IGRiU3VibmV0R3JvdXAubmFtZSxcbiAgICAgICAgcHVibGljbHlBY2Nlc3NpYmxlOiBmYWxzZSxcblxuICAgICAgICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q6IDcsXG4gICAgICAgIGJhY2t1cFdpbmRvdzogJzAzOjAwLTA0OjAwJyxcbiAgICAgICAgbWFpbnRlbmFuY2VXaW5kb3c6ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgICAgYXV0b01pbm9yVmVyc2lvblVwZ3JhZGU6IHRydWUsXG5cbiAgICAgICAgc2tpcEZpbmFsU25hcHNob3Q6IGZhbHNlLFxuICAgICAgICBmaW5hbFNuYXBzaG90SWRlbnRpZmllcjogYHRhcC1kYi1maW5hbC1zbmFwc2hvdC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlbGV0ZUF1dG9tYXRlZEJhY2t1cHM6IGZhbHNlLFxuXG4gICAgICAgIGVuYWJsZWRDbG91ZHdhdGNoTG9nc0V4cG9ydHM6IFsnZXJyb3InLCAnZ2VuZXJhbCcsICdzbG93cXVlcnknXSxcbiAgICAgICAgbW9uaXRvcmluZ0ludGVydmFsOiA2MCxcbiAgICAgICAgbW9uaXRvcmluZ1JvbGVBcm46IG1vbml0b3JpbmdSb2xlLmFybixcblxuICAgICAgICAvLyBDbG91ZFdhdGNoIERhdGFiYXNlIEluc2lnaHRzIC0gRW5oYW5jZWQgbW9uaXRvcmluZyB3aXRoIGRldGFpbGVkIG1ldHJpY3NcbiAgICAgICAgLy8gVGhpcyBwcm92aWRlcyBjb21wcmVoZW5zaXZlIGRhdGFiYXNlIG1vbml0b3JpbmcgdGhyb3VnaCBDbG91ZFdhdGNoXG4gICAgICAgIC8vIHdpdGhvdXQgdGhlIGluc3RhbmNlIGNsYXNzIHJlc3RyaWN0aW9ucyBvZiBQZXJmb3JtYW5jZSBJbnNpZ2h0c1xuXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWRiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnTWFpbkRhdGFiYXNlJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ2xvdWRXYXRjaCBEYXRhYmFzZSBJbnNpZ2h0cyAtIENyZWF0ZSBhbGFybXMgZm9yIGtleSBkYXRhYmFzZSBtZXRyaWNzXG4gICAgLy8gVGhpcyBwcm92aWRlcyBjb21wcmVoZW5zaXZlIG1vbml0b3Jpbmcgc2ltaWxhciB0byBQZXJmb3JtYW5jZSBJbnNpZ2h0c1xuXG4gICAgLy8gQ1BVIFV0aWxpemF0aW9uIEFsYXJtXG4gICAgbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgYHRhcC1kYi1jcHUtYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWRiLWNwdS11dGlsaXphdGlvbi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGNvbXBhcmlzb25PcGVyYXRvcjogJ0dyZWF0ZXJUaGFuVGhyZXNob2xkJyxcbiAgICAgICAgZXZhbHVhdGlvblBlcmlvZHM6IDIsXG4gICAgICAgIG1ldHJpY05hbWU6ICdDUFVVdGlsaXphdGlvbicsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9SRFMnLFxuICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgIHRocmVzaG9sZDogODAsXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdSRFMgQ1BVIHV0aWxpemF0aW9uIGlzIHRvbyBoaWdoJyxcbiAgICAgICAgZGltZW5zaW9uczoge1xuICAgICAgICAgIERCSW5zdGFuY2VJZGVudGlmaWVyOiBkYkluc3RhbmNlLmlkLFxuICAgICAgICB9LFxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1kYi1jcHUtYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBEYXRhYmFzZSBDb25uZWN0aW9ucyBBbGFybVxuICAgIG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGB0YXAtZGItY29ubmVjdGlvbnMtYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWRiLWNvbm5lY3Rpb25zLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgY29tcGFyaXNvbk9wZXJhdG9yOiAnR3JlYXRlclRoYW5UaHJlc2hvbGQnLFxuICAgICAgICBldmFsdWF0aW9uUGVyaW9kczogMixcbiAgICAgICAgbWV0cmljTmFtZTogJ0RhdGFiYXNlQ29ubmVjdGlvbnMnLFxuICAgICAgICBuYW1lc3BhY2U6ICdBV1MvUkRTJyxcbiAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICB0aHJlc2hvbGQ6IDQwLCAvLyBBZGp1c3QgYmFzZWQgb24geW91ciBjb25uZWN0aW9uIHBvb2wgc2l6ZVxuICAgICAgICBhbGFybURlc2NyaXB0aW9uOiAnUkRTIGNvbm5lY3Rpb24gY291bnQgaXMgdG9vIGhpZ2gnLFxuICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGRiSW5zdGFuY2UuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWRiLWNvbm5lY3Rpb25zLWFsYXJtLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRnJlZSBTdG9yYWdlIFNwYWNlIEFsYXJtXG4gICAgbmV3IGF3cy5jbG91ZHdhdGNoLk1ldHJpY0FsYXJtKFxuICAgICAgYHRhcC1kYi1zdG9yYWdlLWFsYXJtLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1kYi1mcmVlLXN0b3JhZ2UtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdMZXNzVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAxLFxuICAgICAgICBtZXRyaWNOYW1lOiAnRnJlZVN0b3JhZ2VTcGFjZScsXG4gICAgICAgIG5hbWVzcGFjZTogJ0FXUy9SRFMnLFxuICAgICAgICBwZXJpb2Q6IDMwMCxcbiAgICAgICAgc3RhdGlzdGljOiAnQXZlcmFnZScsXG4gICAgICAgIHRocmVzaG9sZDogMjAwMDAwMDAwMCwgLy8gMkdCIGluIGJ5dGVzXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdSRFMgZnJlZSBzdG9yYWdlIHNwYWNlIGlzIGxvdycsXG4gICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICBEQkluc3RhbmNlSWRlbnRpZmllcjogZGJJbnN0YW5jZS5pZCxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGItc3RvcmFnZS1hbGFybS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFJlYWQgTGF0ZW5jeSBBbGFybVxuICAgIG5ldyBhd3MuY2xvdWR3YXRjaC5NZXRyaWNBbGFybShcbiAgICAgIGB0YXAtZGItcmVhZC1sYXRlbmN5LWFsYXJtLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1kYi1yZWFkLWxhdGVuY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBtZXRyaWNOYW1lOiAnUmVhZExhdGVuY3knLFxuICAgICAgICBuYW1lc3BhY2U6ICdBV1MvUkRTJyxcbiAgICAgICAgcGVyaW9kOiAzMDAsXG4gICAgICAgIHN0YXRpc3RpYzogJ0F2ZXJhZ2UnLFxuICAgICAgICB0aHJlc2hvbGQ6IDAuMiwgLy8gMjAwbXNcbiAgICAgICAgYWxhcm1EZXNjcmlwdGlvbjogJ1JEUyByZWFkIGxhdGVuY3kgaXMgdG9vIGhpZ2gnLFxuICAgICAgICBkaW1lbnNpb25zOiB7XG4gICAgICAgICAgREJJbnN0YW5jZUlkZW50aWZpZXI6IGRiSW5zdGFuY2UuaWQsXG4gICAgICAgIH0sXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWRiLXJlYWQtbGF0ZW5jeS1hbGFybS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIFdyaXRlIExhdGVuY3kgQWxhcm1cbiAgICBuZXcgYXdzLmNsb3Vkd2F0Y2guTWV0cmljQWxhcm0oXG4gICAgICBgdGFwLWRiLXdyaXRlLWxhdGVuY3ktYWxhcm0tJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWRiLXdyaXRlLWxhdGVuY3ktJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBjb21wYXJpc29uT3BlcmF0b3I6ICdHcmVhdGVyVGhhblRocmVzaG9sZCcsXG4gICAgICAgIGV2YWx1YXRpb25QZXJpb2RzOiAyLFxuICAgICAgICBtZXRyaWNOYW1lOiAnV3JpdGVMYXRlbmN5JyxcbiAgICAgICAgbmFtZXNwYWNlOiAnQVdTL1JEUycsXG4gICAgICAgIHBlcmlvZDogMzAwLFxuICAgICAgICBzdGF0aXN0aWM6ICdBdmVyYWdlJyxcbiAgICAgICAgdGhyZXNob2xkOiAwLjIsIC8vIDIwMG1zXG4gICAgICAgIGFsYXJtRGVzY3JpcHRpb246ICdSRFMgd3JpdGUgbGF0ZW5jeSBpcyB0b28gaGlnaCcsXG4gICAgICAgIGRpbWVuc2lvbnM6IHtcbiAgICAgICAgICBEQkluc3RhbmNlSWRlbnRpZmllcjogZGJJbnN0YW5jZS5pZCxcbiAgICAgICAgfSxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGItd3JpdGUtbGF0ZW5jeS1hbGFybS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuZGJJbnN0YW5jZUlkID0gZGJJbnN0YW5jZS5pZDtcbiAgICB0aGlzLmRiSW5zdGFuY2VBcm4gPSBkYkluc3RhbmNlLmFybjtcbiAgICB0aGlzLmRiSW5zdGFuY2VFbmRwb2ludCA9IGRiSW5zdGFuY2UuZW5kcG9pbnQ7XG4gICAgdGhpcy5kYkluc3RhbmNlUG9ydCA9IGRiSW5zdGFuY2UucG9ydDtcbiAgICB0aGlzLmRiU3VibmV0R3JvdXBOYW1lID0gZGJTdWJuZXRHcm91cC5uYW1lO1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZGJJbnN0YW5jZUlkOiB0aGlzLmRiSW5zdGFuY2VJZCxcbiAgICAgIGRiSW5zdGFuY2VBcm46IHRoaXMuZGJJbnN0YW5jZUFybixcbiAgICAgIGRiSW5zdGFuY2VFbmRwb2ludDogdGhpcy5kYkluc3RhbmNlRW5kcG9pbnQsXG4gICAgICBkYkluc3RhbmNlUG9ydDogdGhpcy5kYkluc3RhbmNlUG9ydCxcbiAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiB0aGlzLmRiU3VibmV0R3JvdXBOYW1lLFxuICAgIH0pO1xuICB9XG59XG4iXX0=