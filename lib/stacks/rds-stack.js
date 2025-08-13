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
/**
 * rds-stack.ts
 *
 * This module defines the RDS stack for creating encrypted database instances
 * with automated backups and monitoring.
 */
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
        // Create DB subnet group
        const dbSubnetGroup = new aws.rds.SubnetGroup(`tap-db-subnet-group-${environmentSuffix}`, {
            name: `tap-db-subnet-group-${environmentSuffix}`,
            subnetIds: args.privateSubnetIds,
            tags: {
                Name: `tap-db-subnet-group-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        // Create monitoring role for RDS
        const monitoringRole = new aws.iam.Role(`tap-rds-monitoring-role-${environmentSuffix}`, {
            name: `tap-rds-monitoring-role-${environmentSuffix}`,
            assumeRolePolicy: JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                    {
                        Action: 'sts:AssumeRole',
                        Effect: 'Allow',
                        Principal: {
                            Service: 'monitoring.rds.amazonaws.com',
                        },
                    },
                ],
            }),
            tags: {
                Name: `tap-rds-monitoring-role-${environmentSuffix}`,
                ...tags,
            },
        }, { parent: this });
        new aws.iam.RolePolicyAttachment(`tap-rds-monitoring-attachment-${environmentSuffix}`, {
            role: monitoringRole.name,
            policyArn: 'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
        }, { parent: this });
        // Create RDS instance
        const dbInstance = new aws.rds.Instance(`tap-db-${environmentSuffix}`, {
            identifier: `tap-db-${environmentSuffix}`,
            instanceClass: instanceClass,
            engine: 'mysql',
            engineVersion: '8.0',
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
            backupRetentionPeriod: 7,
            backupWindow: '03:00-04:00',
            maintenanceWindow: 'sun:04:00-sun:05:00',
            skipFinalSnapshot: false,
            finalSnapshotIdentifier: `tap-db-final-snapshot-${environmentSuffix}`,
            deleteAutomatedBackups: false,
            enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
            monitoringInterval: 60,
            monitoringRoleArn: monitoringRole.arn,
            performanceInsightsEnabled: true,
            performanceInsightsKmsKeyId: args.rdsKmsKeyArn,
            performanceInsightsRetentionPeriod: 7,
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBOzs7OztHQUtHO0FBQ0gsaURBQW1DO0FBQ25DLHVEQUF5QztBQWF6QyxNQUFhLFFBQVMsU0FBUSxNQUFNLENBQUMsaUJBQWlCO0lBQ3BDLFlBQVksQ0FBd0I7SUFDcEMsYUFBYSxDQUF3QjtJQUNyQyxrQkFBa0IsQ0FBd0I7SUFDMUMsY0FBYyxDQUF3QjtJQUV0RCxZQUFZLElBQVksRUFBRSxJQUFrQixFQUFFLElBQXNCO1FBQ2xFLEtBQUssQ0FBQyxrQkFBa0IsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1FBRTVDLE1BQU0saUJBQWlCLEdBQUcsSUFBSSxDQUFDLGlCQUFpQixJQUFJLEtBQUssQ0FBQztRQUMxRCxNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUMsYUFBYSxJQUFJLGFBQWEsQ0FBQztRQUMxRCxNQUFNLElBQUksR0FBRyxJQUFJLENBQUMsSUFBSSxJQUFJLEVBQUUsQ0FBQztRQUU3Qix5QkFBeUI7UUFDekIsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FDM0MsdUJBQXVCLGlCQUFpQixFQUFFLEVBQzFDO1lBQ0UsSUFBSSxFQUFFLHVCQUF1QixpQkFBaUIsRUFBRTtZQUNoRCxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtZQUNoQyxJQUFJLEVBQUU7Z0JBQ0osSUFBSSxFQUFFLHVCQUF1QixpQkFBaUIsRUFBRTtnQkFDaEQsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsaUNBQWlDO1FBQ2pDLE1BQU0sY0FBYyxHQUFHLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQ3JDLDJCQUEyQixp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Q0FBQyxjQUFjO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXhIRCw0QkF3SEMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIHJkcy1zdGFjay50c1xuICpcbiAqIFRoaXMgbW9kdWxlIGRlZmluZXMgdGhlIFJEUyBzdGFjayBmb3IgY3JlYXRpbmcgZW5jcnlwdGVkIGRhdGFiYXNlIGluc3RhbmNlc1xuICogd2l0aCBhdXRvbWF0ZWQgYmFja3VwcyBhbmQgbW9uaXRvcmluZy5cbiAqL1xuaW1wb3J0ICogYXMgYXdzIGZyb20gJ0BwdWx1bWkvYXdzJztcbmltcG9ydCAqIGFzIHB1bHVtaSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5pbXBvcnQgeyBSZXNvdXJjZU9wdGlvbnMgfSBmcm9tICdAcHVsdW1pL3B1bHVtaSc7XG5cbmV4cG9ydCBpbnRlcmZhY2UgUmRzU3RhY2tBcmdzIHtcbiAgZW52aXJvbm1lbnRTdWZmaXg/OiBzdHJpbmc7XG4gIHRhZ3M/OiBwdWx1bWkuSW5wdXQ8eyBba2V5OiBzdHJpbmddOiBzdHJpbmcgfT47XG4gIHByaXZhdGVTdWJuZXRJZHM6IHB1bHVtaS5JbnB1dDxzdHJpbmdbXT47XG4gIGRiU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcmRzS21zS2V5QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgZGJTZWNyZXRBcm46IHB1bHVtaS5JbnB1dDxzdHJpbmc+O1xuICBpbnN0YW5jZUNsYXNzPzogc3RyaW5nO1xufVxuXG5leHBvcnQgY2xhc3MgUmRzU3RhY2sgZXh0ZW5kcyBwdWx1bWkuQ29tcG9uZW50UmVzb3VyY2Uge1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZUlkOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlQXJuOiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlRW5kcG9pbnQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VQb3J0OiBwdWx1bWkuT3V0cHV0PG51bWJlcj47XG5cbiAgY29uc3RydWN0b3IobmFtZTogc3RyaW5nLCBhcmdzOiBSZHNTdGFja0FyZ3MsIG9wdHM/OiBSZXNvdXJjZU9wdGlvbnMpIHtcbiAgICBzdXBlcigndGFwOnJkczpSZHNTdGFjaycsIG5hbWUsIGFyZ3MsIG9wdHMpO1xuXG4gICAgY29uc3QgZW52aXJvbm1lbnRTdWZmaXggPSBhcmdzLmVudmlyb25tZW50U3VmZml4IHx8ICdkZXYnO1xuICAgIGNvbnN0IGluc3RhbmNlQ2xhc3MgPSBhcmdzLmluc3RhbmNlQ2xhc3MgfHwgJ2RiLnQzLm1pY3JvJztcbiAgICBjb25zdCB0YWdzID0gYXJncy50YWdzIHx8IHt9O1xuXG4gICAgLy8gQ3JlYXRlIERCIHN1Ym5ldCBncm91cFxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgYXdzLnJkcy5TdWJuZXRHcm91cChcbiAgICAgIGB0YXAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1kYi1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBzdWJuZXRJZHM6IGFyZ3MucHJpdmF0ZVN1Ym5ldElkcyxcbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIG1vbml0b3Jpbmcgcm9sZSBmb3IgUkRTXG4gICAgY29uc3QgbW9uaXRvcmluZ1JvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDoge1xuICAgICAgICAgICAgICAgIFNlcnZpY2U6ICdtb25pdG9yaW5nLnJkcy5hbWF6b25hd3MuY29tJyxcbiAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLXJkcy1tb25pdG9yaW5nLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5QXR0YWNobWVudChcbiAgICAgIGB0YXAtcmRzLW1vbml0b3JpbmctYXR0YWNobWVudC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IG1vbml0b3JpbmdSb2xlLm5hbWUsXG4gICAgICAgIHBvbGljeUFybjpcbiAgICAgICAgICAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvc2VydmljZS1yb2xlL0FtYXpvblJEU0VuaGFuY2VkTW9uaXRvcmluZ1JvbGUnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gQ3JlYXRlIFJEUyBpbnN0YW5jZVxuICAgIGNvbnN0IGRiSW5zdGFuY2UgPSBuZXcgYXdzLnJkcy5JbnN0YW5jZShcbiAgICAgIGB0YXAtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBpZGVudGlmaWVyOiBgdGFwLWRiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgaW5zdGFuY2VDbGFzczogaW5zdGFuY2VDbGFzcyxcbiAgICAgICAgZW5naW5lOiAnbXlzcWwnLFxuICAgICAgICBlbmdpbmVWZXJzaW9uOiAnOC4wJyxcbiAgICAgICAgYWxsb2NhdGVkU3RvcmFnZTogMjAsXG4gICAgICAgIHN0b3JhZ2VUeXBlOiAnZ3AzJyxcbiAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3MucmRzS21zS2V5QXJuLFxuXG4gICAgICAgIGRiTmFtZTogJ3RhcGRiJyxcbiAgICAgICAgdXNlcm5hbWU6ICdhZG1pbicsXG4gICAgICAgIG1hbmFnZU1hc3RlclVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgbWFzdGVyVXNlclNlY3JldEttc0tleUlkOiBhcmdzLnJkc0ttc0tleUFybixcblxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBbYXJncy5kYlNlY3VyaXR5R3JvdXBJZF0sXG4gICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiBkYlN1Ym5ldEdyb3VwLm5hbWUsXG5cbiAgICAgICAgYmFja3VwUmV0ZW50aW9uUGVyaW9kOiA3LFxuICAgICAgICBiYWNrdXBXaW5kb3c6ICcwMzowMC0wNDowMCcsXG4gICAgICAgIG1haW50ZW5hbmNlV2luZG93OiAnc3VuOjA0OjAwLXN1bjowNTowMCcsXG5cbiAgICAgICAgc2tpcEZpbmFsU25hcHNob3Q6IGZhbHNlLFxuICAgICAgICBmaW5hbFNuYXBzaG90SWRlbnRpZmllcjogYHRhcC1kYi1maW5hbC1zbmFwc2hvdC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGRlbGV0ZUF1dG9tYXRlZEJhY2t1cHM6IGZhbHNlLFxuXG4gICAgICAgIGVuYWJsZWRDbG91ZHdhdGNoTG9nc0V4cG9ydHM6IFsnZXJyb3InLCAnZ2VuZXJhbCcsICdzbG93cXVlcnknXSxcbiAgICAgICAgbW9uaXRvcmluZ0ludGVydmFsOiA2MCxcbiAgICAgICAgbW9uaXRvcmluZ1JvbGVBcm46IG1vbml0b3JpbmdSb2xlLmFybixcblxuICAgICAgICBwZXJmb3JtYW5jZUluc2lnaHRzRW5hYmxlZDogdHJ1ZSxcbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0ttc0tleUlkOiBhcmdzLnJkc0ttc0tleUFybixcbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c1JldGVudGlvblBlcmlvZDogNyxcblxuICAgICAgICB0YWdzOiB7XG4gICAgICAgICAgTmFtZTogYHRhcC1kYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgICAgUHVycG9zZTogJ01haW5EYXRhYmFzZScsXG4gICAgICAgICAgLi4udGFncyxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIHRoaXMuZGJJbnN0YW5jZUlkID0gZGJJbnN0YW5jZS5pZDtcbiAgICB0aGlzLmRiSW5zdGFuY2VBcm4gPSBkYkluc3RhbmNlLmFybjtcbiAgICB0aGlzLmRiSW5zdGFuY2VFbmRwb2ludCA9IGRiSW5zdGFuY2UuZW5kcG9pbnQ7XG4gICAgdGhpcy5kYkluc3RhbmNlUG9ydCA9IGRiSW5zdGFuY2UucG9ydDtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGRiSW5zdGFuY2VJZDogdGhpcy5kYkluc3RhbmNlSWQsXG4gICAgICBkYkluc3RhbmNlQXJuOiB0aGlzLmRiSW5zdGFuY2VBcm4sXG4gICAgICBkYkluc3RhbmNlRW5kcG9pbnQ6IHRoaXMuZGJJbnN0YW5jZUVuZHBvaW50LFxuICAgICAgZGJJbnN0YW5jZVBvcnQ6IHRoaXMuZGJJbnN0YW5jZVBvcnQsXG4gICAgfSk7XG4gIH1cbn1cbiJdfQ==