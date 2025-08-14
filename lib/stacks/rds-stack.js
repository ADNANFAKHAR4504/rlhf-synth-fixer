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
            performanceInsightsEnabled: true,
            performanceInsightsKmsKeyId: args.rdsKmsKeyArn,
            performanceInsightsRetentionPeriod: 7, // 7 or 731
            tags: {
                Name: `tap-db-${environmentSuffix}`,
                Purpose: 'MainDatabase',
                ...tags,
            },
        }, { parent: this });
        this.dbInstanceId = dbInstance.id;
        this.dbInstanceArn = dbInstance.arn;
        this.dbInstanceEndpoint = dbInstance.endpoint;
        this.dbInstancePort = dbInstance.port;
        this.registerOutputs({
            dbInstanceId: this.dbInstanceId,
            dbInstanceArn: this.dbInstanceArn,
            dbInstanceEndpoint: this.dbInstanceEndpoint,
            dbInstancePort: this.dbInstancePort,
        });
    }
}
exports.RdsStack = RdsStack;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFhekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxZQUFZLENBQXdCO0lBQ3BDLGFBQWEsQ0FBd0I7SUFDckMsa0JBQWtCLENBQXdCO0lBQzFDLGNBQWMsQ0FBd0I7SUFFdEQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsNENBQTRDO1FBQzVDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQy9DLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxJQUFJLEtBQUssQ0FDYiwrQ0FBK0MsR0FBRyxFQUFFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FDbkUsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILGVBQWU7UUFDZixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUMzQyx1QkFBdUIsaUJBQWlCLEVBQUUsRUFDMUM7WUFDRSxJQUFJLEVBQUUsdUJBQXVCLGlC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QUM7UUFDbEMsSUFBSSxDQUFDLGFBQWEsR0FBRyxVQUFVLENBQUMsR0FBRyxDQUFDO1FBQ3BDLElBQUksQ0FBQyxrQkFBa0IsR0FBRyxVQUFVLENBQUMsUUFBUSxDQUFDO1FBQzlDLElBQUksQ0FBQyxjQUFjLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQztRQUV0QyxJQUFJLENBQUMsZUFBZSxDQUFDO1lBQ25CLFlBQVksRUFBRSxJQUFJLENBQUMsWUFBWTtZQUMvQixhQUFhLEVBQUUsSUFBSSxDQUFDLGFBQWE7WUFDakMsa0JBQWtCLEVBQUUsSUFBSSxDQUFDLGtCQUFrQjtZQUMzQyxjQUFjLEVBQUUsSUFBSSxDQUFDLGNBQWM7U0FDcEMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBM0hELDRCQTJIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJkc1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8cHVsdW1pLklucHV0PHN0cmluZz5bXT47XG4gIGRiU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcmRzS21zS2V5QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZGJTZWNyZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBpbnN0YW5jZUNsYXNzPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUmRzU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlRW5kcG9pbnQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VQb3J0OiBwdWx1bWkuT3V0cHV0PG51bWJlcj47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBSZHNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnJkczpSZHNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IGluc3RhbmNlQ2xhc3MgPSBhcmdzLmluc3RhbmNlQ2xhc3MgfHwgJ2RiLnQzLm1pY3JvJztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gVHJpcHdpcmUgdG8gY2F0Y2ggYmFkIHN1Ym5ldCBpbnB1dHMgZWFybHlcbiAgICBwdWx1bWkub3V0cHV0KGFyZ3MucHJpdmF0ZVN1Ym5ldElkcykuYXBwbHkoaWRzID0+IHtcbiAgICAgIGlmICghaWRzIHx8IGlkcy5sZW5ndGggPCAyKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgICBgUkRTIG5lZWRzIGF0IGxlYXN0IHR3byBwcml2YXRlIHN1Ym5ldHM7IGdvdCAke2lkcz8ubGVuZ3RoID8/IDB9LmBcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICB9KTtcblxuICAgIC8vIFN1Ym5ldCBncm91cFxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgYXdzLnJkcy5TdWJuZXRHcm91cChcbiAgICAgIGB0YXAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1kYi1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBzdWJuZXRJZHM6IGFyZ3MucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgICAgdGFnczogeyBOYW1lOiBgdGFwLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIEVuaGFuY2VkIG1vbml0b3Jpbmcgcm9sZVxuICAgIGNvbnN0IG1vbml0b3JpbmdSb2xlID0gbmV3IGF3cy5pYW0uUm9sZShcbiAgICAgIGB0YXAtcmRzLW1vbml0b3Jpbmctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtcmRzLW1vbml0b3Jpbmctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGFzc3VtZVJvbGVQb2xpY3k6IEpTT04uc3RyaW5naWZ5KHtcbiAgICAgICAgICBWZXJzaW9uOiAnMjAxMi0xMC0xNycsXG4gICAgICAgICAgU3RhdGVtZW50OiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgIEFjdGlvbjogJ3N0czpBc3N1bWVSb2xlJyxcbiAgICAgICAgICAgICAgRWZmZWN0OiAnQWxsb3cnLFxuICAgICAgICAgICAgICBQcmluY2lwYWw6IHsgU2VydmljZTogJ21vbml0b3JpbmcucmRzLmFtYXpvbmF3cy5jb20nIH0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgIF0sXG4gICAgICAgIH0pLFxuICAgICAgICB0YWdzOiB7IE5hbWU6IGB0YXAtcmRzLW1vbml0b3Jpbmctcm9sZS0ke2Vudmlyb25tZW50U3VmZml4fWAsIC4uLnRhZ3MgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIG5ldyBhd3MuaWFtLlJvbGVQb2xpY3lBdHRhY2htZW50KFxuICAgICAgYHRhcC1yZHMtbW9uaXRvcmluZy1hdHRhY2htZW50LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgcm9sZTogbW9uaXRvcmluZ1JvbGUubmFtZSxcbiAgICAgICAgcG9saWN5QXJuOlxuICAgICAgICAgICdhcm46YXdzOmlhbTo6YXdzOnBvbGljeS9zZXJ2aWNlLXJvbGUvQW1hem9uUkRTRW5oYW5jZWRNb25pdG9yaW5nUm9sZScsXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBEQiBpbnN0YW5jZVxuICAgIGNvbnN0IGRiSW5zdGFuY2UgPSBuZXcgYXdzLnJkcy5JbnN0YW5jZShcbiAgICAgIGB0YXAtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBpZGVudGlmaWVyOiBgdGFwLWRiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgaW5zdGFuY2VDbGFzcyxcbiAgICAgICAgZW5naW5lOiAnbXlzcWwnLFxuICAgICAgICBlbmdpbmVWZXJzaW9uOiAnOC4wJywgLy8gb3IgYSBwaW5uZWQgcGF0Y2ggbGlrZSAnOC4wLjM1J1xuICAgICAgICBhbGxvY2F0ZWRTdG9yYWdlOiAyMCxcbiAgICAgICAgc3RvcmFnZVR5cGU6ICdncDMnLFxuICAgICAgICBzdG9yYWdlRW5jcnlwdGVkOiB0cnVlLFxuICAgICAgICBrbXNLZXlJZDogYXJncy5yZHNLbXNLZXlBcm4sXG5cbiAgICAgICAgZGJOYW1lOiAndGFwZGInLFxuICAgICAgICB1c2VybmFtZTogJ2FkbWluJyxcbiAgICAgICAgbWFuYWdlTWFzdGVyVXNlclBhc3N3b3JkOiB0cnVlLFxuICAgICAgICBtYXN0ZXJVc2VyU2VjcmV0S21zS2V5SWQ6IGFyZ3MucmRzS21zS2V5QXJuLFxuXG4gICAgICAgIHZwY1NlY3VyaXR5R3JvdXBJZHM6IFthcmdzLmRiU2VjdXJpdHlHcm91cElkXSxcbiAgICAgICAgZGJTdWJuZXRHcm91cE5hbWU6IGRiU3VibmV0R3JvdXAubmFtZSxcbiAgICAgICAgcHVibGljbHlBY2Nlc3NpYmxlOiBmYWxzZSxcblxuICAgICAgICBiYWNrdXBSZXRlbnRpb25QZXJpb2Q6IDcsXG4gICAgICAgIGJhY2t1cFdpbmRvdzogJzAzOjAwLTA0OjAwJyxcbiAgICAgICAgbWFpbnRlbmFuY2VXaW5kb3c6ICdzdW46MDQ6MDAtc3VuOjA1OjAwJyxcbiAgICAgICAgYXV0b01pbm9yVmVyc2lvblVwZ3JhZGU6IHRydWUsXG5cbiAgICAgICAgc2tpcEZpbmFsU25hcHNob3Q6IGZhbHNlLFxuICAgICAgICBmaW5hbFNuYXBzaG90SWRlbnRpZmllcjogYHRhcC1kYi1maW5hbC1zbmFwc2hvdC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlbGV0ZUF1dG9tYXRlZEJhY2t1cHM6IGZhbHNlLFxuXG4gICAgICAgIGVuYWJsZWRDbG91ZHdhdGNoTG9nc0V4cG9ydHM6IFsnZXJyb3InLCAnZ2VuZXJhbCcsICdzbG93cXVlcnknXSxcbiAgICAgICAgbW9uaXRvcmluZ0ludGVydmFsOiA2MCxcbiAgICAgICAgbW9uaXRvcmluZ1JvbGVBcm46IG1vbml0b3JpbmdSb2xlLmFybixcblxuICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0ttc0tleUlkOiBhcmdzLnJkc0ttc0tleUFybixcbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1JldGVudGlvblBlcmlvZDogNywgLy8gNyBvciA3MzFcblxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1kYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ01haW5EYXRhYmFzZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuZGJJbnN0YW5jZUlkID0gZGJJbnN0YW5jZS5pZDtcbiAgICB0aGlzLmRiSW5zdGFuY2VBcm4gPSBkYkluc3RhbmNlLmFybjtcbiAgICB0aGlzLmRiSW5zdGFuY2VFbmRwb2ludCA9IGRiSW5zdGFuY2UuZW5kcG9pbnQ7XG4gICAgdGhpcy5kYkluc3RhbmNlUG9ydCA9IGRiSW5zdGFuY2UucG9ydDtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGRiSW5zdGFuY2VJZDogdGhpcy5kYkluc3RhbmNlSWQsXG4gICAgICBkYkluc3RhbmNlQXJuOiB0aGlzLmRiSW5zdGFuY2VBcm4sXG4gICAgICBkYkluc3RhbmNlRW5kcG9pbnQ6IHRoaXMuZGJJbnN0YW5jZUVuZHBvaW50LFxuICAgICAgZGJJbnN0YW5jZVBvcnQ6IHRoaXMuZGJJbnN0YW5jZVBvcnQsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==