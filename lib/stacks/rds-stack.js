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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFZekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxZQUFZLENBQXdCO0lBQ3BDLGFBQWEsQ0FBd0I7SUFDckMsa0JBQWtCLENBQXdCO0lBQzFDLGNBQWMsQ0FBd0I7SUFFdEQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsNENBQTRDO1FBQzVDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQy9DLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxJQUFJLEtBQUssQ0FDYiwrQ0FBK0MsR0FBRyxFQUFFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FDbkUsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILGVBQWU7UUFDZixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUMzQyx1QkFBdUIsaUJBQWlCLEVBQUUsRUFDMUM7WUFDRSxJQUFJLEVBQUUsdUJBQXVCLGlC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QVEsQ0FBQztRQUM5QyxJQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFFdEMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0I7WUFDM0MsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZIRCw0QkF1SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBSZHNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLklucHV0PHB1bHVtaS5JbnB1dDxzdHJpbmc+W10+O1xuICBkYlNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHJkc0ttc0tleUFybjogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGluc3RhbmNlQ2xhc3M/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCBjbGFzcyBSZHNTdGFjayBleHRlbmRzIHB1bHVtaS5Db21wb25lbnRSZXNvdXJjZSB7XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlSWQ6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VBcm46IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VFbmRwb2ludDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZVBvcnQ6IHB1bHVtaS5PdXRwdXQ8bnVtYmVyPjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFJkc1N0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6cmRzOlJkc1N0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgaW5zdGFuY2VDbGFzcyA9IGFyZ3MuaW5zdGFuY2VDbGFzcyB8fCAnZGIudDMubWljcm8nO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzLnRhZ3MgfHwge307XG5cbiAgICAvLyBUcmlwd2lyZSB0byBjYXRjaCBiYWQgc3VibmV0IGlucHV0cyBlYXJseVxuICAgIHB1bHVtaS5vdXRwdXQoYXJncy5wcml2YXRlU3VibmV0SWRzKS5hcHBseShpZHMgPT4ge1xuICAgICAgaWYgKCFpZHMgfHwgaWRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBSRFMgbmVlZHMgYXQgbGVhc3QgdHdvIHByaXZhdGUgc3VibmV0czsgZ290ICR7aWRzPy5sZW5ndGggPz8gMH0uYFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU3VibmV0IGdyb3VwXG4gICAgY29uc3QgZGJTdWJuZXRHcm91cCA9IG5ldyBhd3MucmRzLlN1Ym5ldEdyb3VwKFxuICAgICAgYHRhcC1kYi1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHN1Ym5ldElkczogYXJncy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgICB0YWdzOiB7IE5hbWU6IGB0YXAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCwgLi4udGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5oYW5jZWQgbW9uaXRvcmluZyByb2xlXG4gICAgY29uc3QgbW9uaXRvcmluZ1JvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDogeyBTZXJ2aWNlOiAnbW9uaXRvcmluZy5yZHMuYW1hem9uYXdzLmNvbScgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHsgTmFtZTogYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCwgLi4udGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoXG4gICAgICBgdGFwLXJkcy1tb25pdG9yaW5nLWF0dGFjaG1lbnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBtb25pdG9yaW5nUm9sZS5uYW1lLFxuICAgICAgICBwb2xpY3lBcm46XG4gICAgICAgICAgJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BbWF6b25SRFNFbmhhbmNlZE1vbml0b3JpbmdSb2xlJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIERCIGluc3RhbmNlXG4gICAgY29uc3QgZGJJbnN0YW5jZSA9IG5ldyBhd3MucmRzLkluc3RhbmNlKFxuICAgICAgYHRhcC1kYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGlkZW50aWZpZXI6IGB0YXAtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBpbnN0YW5jZUNsYXNzLFxuICAgICAgICBlbmdpbmU6ICdteXNxbCcsXG4gICAgICAgIGVuZ2luZVZlcnNpb246ICc4LjAnLCAvLyBvciBhIHBpbm5lZCBwYXRjaCBsaWtlICc4LjAuMzUnXG4gICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDIwLFxuICAgICAgICBzdG9yYWdlVHlwZTogJ2dwMycsXG4gICAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IHRydWUsXG4gICAgICAgIGttc0tleUlkOiBhcmdzLnJkc0ttc0tleUFybixcblxuICAgICAgICBkYk5hbWU6ICd0YXBkYicsXG4gICAgICAgIHVzZXJuYW1lOiAnYWRtaW4nLFxuICAgICAgICBtYW5hZ2VNYXN0ZXJVc2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIG1hc3RlclVzZXJTZWNyZXRLbXNLZXlJZDogYXJncy5yZHNLbXNLZXlBcm4sXG5cbiAgICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW2FyZ3MuZGJTZWN1cml0eUdyb3VwSWRdLFxuICAgICAgICBkYlN1Ym5ldEdyb3VwTmFtZTogZGJTdWJuZXRHcm91cC5uYW1lLFxuICAgICAgICBwdWJsaWNseUFjY2Vzc2libGU6IGZhbHNlLFxuXG4gICAgICAgIGJhY2t1cFJldGVudGlvblBlcmlvZDogNyxcbiAgICAgICAgYmFja3VwV2luZG93OiAnMDM6MDAtMDQ6MDAnLFxuICAgICAgICBtYWludGVuYW5jZVdpbmRvdzogJ3N1bjowNDowMC1zdW46MDU6MDAnLFxuICAgICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcblxuICAgICAgICBza2lwRmluYWxTbmFwc2hvdDogZmFsc2UsXG4gICAgICAgIGZpbmFsU25hcHNob3RJZGVudGlmaWVyOiBgdGFwLWRiLWZpbmFsLXNuYXBzaG90LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVsZXRlQXV0b21hdGVkQmFja3VwczogZmFsc2UsXG5cbiAgICAgICAgZW5hYmxlZENsb3Vkd2F0Y2hMb2dzRXhwb3J0czogWydlcnJvcicsICdnZW5lcmFsJywgJ3Nsb3dxdWVyeSddLFxuICAgICAgICBtb25pdG9yaW5nSW50ZXJ2YWw6IDYwLFxuICAgICAgICBtb25pdG9yaW5nUm9sZUFybjogbW9uaXRvcmluZ1JvbGUuYXJuLFxuXG4gICAgICAgIHRhZ3M6IHtcbiAgICAgICAgICBOYW1lOiBgdGFwLWRiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgICBQdXJwb3NlOiAnTWFpbkRhdGFiYXNlJyxcbiAgICAgICAgICAuLi50YWdzLFxuICAgICAgICB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgdGhpcy5kYkluc3RhbmNlSWQgPSBkYkluc3RhbmNlLmlkO1xuICAgIHRoaXMuZGJJbnN0YW5jZUFybiA9IGRiSW5zdGFuY2UuYXJuO1xuICAgIHRoaXMuZGJJbnN0YW5jZUVuZHBvaW50ID0gZGJJbnN0YW5jZS5lbmRwb2ludDtcbiAgICB0aGlzLmRiSW5zdGFuY2VQb3J0ID0gZGJJbnN0YW5jZS5wb3J0O1xuXG4gICAgdGhpcy5yZWdpc3Rlck91dHB1dHMoe1xuICAgICAgZGJJbnN0YW5jZUlkOiB0aGlzLmRiSW5zdGFuY2VJZCxcbiAgICAgIGRiSW5zdGFuY2VBcm46IHRoaXMuZGJJbnN0YW5jZUFybixcbiAgICAgIGRiSW5zdGFuY2VFbmRwb2ludDogdGhpcy5kYkluc3RhbmNlRW5kcG9pbnQsXG4gICAgICBkYkluc3RhbmNlUG9ydDogdGhpcy5kYkluc3RhbmNlUG9ydCxcbiAgICB9KTtcbiAgfVxufVxuIl19