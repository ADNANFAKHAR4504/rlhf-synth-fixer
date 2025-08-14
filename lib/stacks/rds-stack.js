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
            // Performance Insights configuration
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFZekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxZQUFZLENBQXdCO0lBQ3BDLGFBQWEsQ0FBd0I7SUFDckMsa0JBQWtCLENBQXdCO0lBQzFDLGNBQWMsQ0FBd0I7SUFDdEMsaUJBQWlCLENBQXdCO0lBRXpELFlBQVksSUFBWSxFQUFFLElBQWtCLEVBQUUsSUFBc0I7UUFDbEUsS0FBSyxDQUFDLGtCQUFrQixFQUFFLElBQUksRUFBRSxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFFNUMsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUMsaUJBQWlCLElBQUksS0FBSyxDQUFDO1FBQzFELE1BQU0sYUFBYSxHQUFHLElBQUksQ0FBQyxhQUFhLElBQUksYUFBYSxDQUFDO1FBQzFELE1BQU0sSUFBSSxHQUFHLElBQUksQ0FBQyxJQUFJLElBQUksRUFBRSxDQUFDO1FBRTdCLDRDQUE0QztRQUM1QyxNQUFNLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRTtZQUMvQyxJQUFJLENBQUMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQUM7Z0JBQzNCLE1BQU0sSUFBSSxLQUFLLENBQ2IsK0NBQStDLEdBQUcsRUFBRSxNQUFNLElBQUksQ0FBQyxHQUFHLENBQ25FLENBQUM7WUFDSixDQUFDO1FBQ0gsQ0FBQyxDQUFDLENBQUM7UUFFSCxlQUFlO1FBQ2YsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsR0FBRyxDQUFDLFdBQVcsQ0FDM0MsdUJBQXVCLGlCQUFpQixFQUFFLEVBQzFDO1lBQ0UsSUFBSSxFQUFFLHVCQUF1QixpQkFBaUIsRUFBRTtZQUNoRCxTQUFTLEVBQUUsSUFBSSxDQUFDLGdCQUFnQjtZQUNoQyxJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsdUJBQXVCLGlCQUFpQixFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUU7U0FDcEUsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLDJCQUEyQjtRQUMzQixNQUFNLGNBQWMsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUNyQywyQkFBMkIsaUJBQWlCLEVBQUUsRUFDOUM7WUFDRSxJQUFJLEVBQUUsMkJBQTJCLGlCQUFpQixFQUFFO1lBQ3BELGdCQUFnQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7Z0JBQy9CLE9BQU8sRUFBRSxZQUFZO2dCQUNyQixTQUFTLEVBQUU7b0JBQ1Q7d0JBQ0UsTUFBTSxFQUFFLGdCQUFnQjt3QkFDeEIsTUFBTSxFQUFFLE9BQU87d0JBQ2YsU0FBUyxFQUFFLEVBQUUsT0FBTyxFQUFFLDhCQUE4QixFQUFFO3FCQUN2RDtpQkFDRjthQUNGLENBQUM7WUFDRixJQUFJLEVBQUUsRUFBRSxJQUFJLEVBQUUsMkJBQTJCLGlCQUFpQixFQUFFLEVBQUUsR0FBRyxJQUFJLEVBQUU7U0FDeEUsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLElBQUksR0FBRyxDQUFDLEdBQUcsQ0FBQyxvQkFBb0IsQ0FDOUIsaUNBQWlDLGlCQUFpQixFQUFFLEVBQ3BEO1lBQ0UsSUFBSSxFQUFFLGNBQWMsQ0FBQyxJQUFJO1lBQ3pCLFNBQVMsRUFDUCxzRUFBc0U7U0FDekUsRUFDRCxFQUFFLE1BQU0sRUFBRSxJQUFJLEVBQUUsQ0FDakIsQ0FBQztRQUVGLGNBQWM7UUFDZCxNQUFNLFVBQVUsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsUUFBUSxDQUNyQyxVQUFVLGlCQUFpQixFQUFFLEVBQzdCO1lBQ0UsVUFBVSxFQUFFLFVBQVUsaUJBQWlCLEVBQUU7WUFDekMsYUFBYTtZQUNiLE1BQU0sRUFBRSxPQUFPO1lBQ2YsYUFBYSxFQUFFLEtBQUssRUFBRSxrQ0FBa0M7WUFDeEQsZ0JBQWdCLEVBQUUsRUFBRTtZQUNwQixXQUFXLEVBQUUsS0FBSztZQUNsQixnQkFBZ0IsRUFBRSxJQUFJO1lBQ3RCLFFBQVEsRUFBRSxJQUFJLENBQUMsWUFBWTtZQUUzQixNQUFNLEVBQUUsT0FBTztZQUNmLFFBQVEsRUFBRSxPQUFPO1lBQ2pCLHdCQUF3QixFQUFFLElBQUk7WUFDOUIsd0JBQXdCLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFFM0MsbUJBQW1CLEVBQUUsQ0FBQyxJQUFJLENBQUMsaUJBQWlCLENBQUM7WUFDN0MsaUJBQWlCLEVBQUUsYUFBYSxDQUFDLElBQUk7WUFDckMsa0JBQWtCLEVBQUUsS0FBSztZQUV6QixxQkFBcUIsRUFBRSxDQUFDO1lBQ3hCLFlBQVksRUFBRSxhQUFhO1lBQzNCLGlCQUFpQixFQUFFLHFCQUFxQjtZQUN4Qyx1QkFBdUIsRUFBRSxJQUFJO1lBRTdCLGlCQUFpQixFQUFFLEtBQUs7WUFDeEIsdUJBQXVCLEVBQUUseUJBQXlCLGlCQUFpQixFQUFFO1lBQ3JFLHNCQUFzQixFQUFFLEtBQUs7WUFFN0IsNEJBQTRCLEVBQUUsQ0FBQyxPQUFPLEVBQUUsU0FBUyxFQUFFLFdBQVcsQ0FBQztZQUMvRCxrQkFBa0IsRUFBRSxFQUFFO1lBQ3RCLGlCQUFpQixFQUFFLGNBQWMsQ0FBQyxHQUFHO1lBRXJDLHFDQUFxQztZQUNyQywwQkFBMEIsRUFBRSxJQUFJO1lBQ2hDLDJCQUEyQixFQUFFLElBQUksQ0FBQyxZQUFZO1lBQzlDLGtDQUFrQyxFQUFFLENBQUM7WUFFckMsSUFBSSxFQUFFO2dCQUNKLElBQUksRUFBRSxVQUFVLGlCQUFpQixFQUFFO2dCQUNuQyxPQUFPLEVBQUUsY0FBYztnQkFDdkIsR0FBRyxJQUFJO2FBQ1I7U0FDRixFQUNELEVBQUUsTUFBTSxFQUFFLElBQUksRUFBRSxDQUNqQixDQUFDO1FBRUYsSUFBSSxDQUFDLFlBQVksR0FBRyxVQUFVLENBQUMsRUFBRSxDQUFDO1FBQ2xDLElBQUksQ0FBQyxhQUFhLEdBQUcsVUFBVSxDQUFDLEdBQUcsQ0FBQztRQUNwQyxJQUFJLENBQUMsa0JBQWtCLEdBQUcsVUFBVSxDQUFDLFFBQVEsQ0FBQztRQUM5QyxJQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFDdEMsSUFBSSxDQUFDLGlCQUFpQixHQUFHLGFBQWEsQ0FBQyxJQUFJLENBQUM7UUFFNUMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0I7WUFDM0MsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO1lBQ25DLGlCQUFpQixFQUFFLElBQUksQ0FBQyxpQkFBaUI7U0FDMUMsQ0FBQyxDQUFDO0lBQ0wsQ0FBQztDQUNGO0FBL0hELDRCQStIQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCAqIGFzIGF3cyBmcm9tICdAcHVsdW1pL2F3cyc7XG5pbXBvcnQgKiBhcyBwdWx1bWkgZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuaW1wb3J0IHsgUmVzb3VyY2VPcHRpb25zIH0gZnJvbSAnQHB1bHVtaS9wdWx1bWknO1xuXG5leHBvcnQgaW50ZXJmYWNlIFJkc1N0YWNrQXJncyB7XG4gIGVudmlyb25tZW50U3VmZml4Pzogc3RyaW5nO1xuICB0YWdzPzogcHVsdW1pLklucHV0PHsgW2tleTogc3RyaW5nXTogc3RyaW5nIH0+O1xuICBwcml2YXRlU3VibmV0SWRzOiBwdWx1bWkuSW5wdXQ8cHVsdW1pLklucHV0PHN0cmluZz5bXT47XG4gIGRiU2VjdXJpdHlHcm91cElkOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgcmRzS21zS2V5QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgaW5zdGFuY2VDbGFzcz86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFJkc1N0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZUVuZHBvaW50OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlUG9ydDogcHVsdW1pLk91dHB1dDxudW1iZXI+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJTdWJuZXRHcm91cE5hbWU6IHB1bHVtaS5PdXRwdXQ8c3RyaW5nPjtcblxuICBjb25zdHJ1Y3RvcihuYW1lOiBzdHJpbmcsIGFyZ3M6IFJkc1N0YWNrQXJncywgb3B0cz86IFJlc291cmNlT3B0aW9ucykge1xuICAgIHN1cGVyKCd0YXA6cmRzOlJkc1N0YWNrJywgbmFtZSwgYXJncywgb3B0cyk7XG5cbiAgICBjb25zdCBlbnZpcm9ubWVudFN1ZmZpeCA9IGFyZ3MuZW52aXJvbm1lbnRTdWZmaXggfHwgJ2Rldic7XG4gICAgY29uc3QgaW5zdGFuY2VDbGFzcyA9IGFyZ3MuaW5zdGFuY2VDbGFzcyB8fCAnZGIudDMubWljcm8nO1xuICAgIGNvbnN0IHRhZ3MgPSBhcmdzLnRhZ3MgfHwge307XG5cbiAgICAvLyBUcmlwd2lyZSB0byBjYXRjaCBiYWQgc3VibmV0IGlucHV0cyBlYXJseVxuICAgIHB1bHVtaS5vdXRwdXQoYXJncy5wcml2YXRlU3VibmV0SWRzKS5hcHBseShpZHMgPT4ge1xuICAgICAgaWYgKCFpZHMgfHwgaWRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICAgIGBSRFMgbmVlZHMgYXQgbGVhc3QgdHdvIHByaXZhdGUgc3VibmV0czsgZ290ICR7aWRzPy5sZW5ndGggPz8gMH0uYFxuICAgICAgICApO1xuICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gU3VibmV0IGdyb3VwXG4gICAgY29uc3QgZGJTdWJuZXRHcm91cCA9IG5ldyBhd3MucmRzLlN1Ym5ldEdyb3VwKFxuICAgICAgYHRhcC1kYi1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIHN1Ym5ldElkczogYXJncy5wcml2YXRlU3VibmV0SWRzLFxuICAgICAgICB0YWdzOiB7IE5hbWU6IGB0YXAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCwgLi4udGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gRW5oYW5jZWQgbW9uaXRvcmluZyByb2xlXG4gICAgY29uc3QgbW9uaXRvcmluZ1JvbGUgPSBuZXcgYXdzLmlhbS5Sb2xlKFxuICAgICAgYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgbmFtZTogYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgYXNzdW1lUm9sZVBvbGljeTogSlNPTi5zdHJpbmdpZnkoe1xuICAgICAgICAgIFZlcnNpb246ICcyMDEyLTEwLTE3JyxcbiAgICAgICAgICBTdGF0ZW1lbnQ6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgQWN0aW9uOiAnc3RzOkFzc3VtZVJvbGUnLFxuICAgICAgICAgICAgICBFZmZlY3Q6ICdBbGxvdycsXG4gICAgICAgICAgICAgIFByaW5jaXBhbDogeyBTZXJ2aWNlOiAnbW9uaXRvcmluZy5yZHMuYW1hem9uYXdzLmNvbScgfSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgXSxcbiAgICAgICAgfSksXG4gICAgICAgIHRhZ3M6IHsgTmFtZTogYHRhcC1yZHMtbW9uaXRvcmluZy1yb2xlLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCwgLi4udGFncyB9LFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgbmV3IGF3cy5pYW0uUm9sZVBvbGljeUF0dGFjaG1lbnQoXG4gICAgICBgdGFwLXJkcy1tb25pdG9yaW5nLWF0dGFjaG1lbnQtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICByb2xlOiBtb25pdG9yaW5nUm9sZS5uYW1lLFxuICAgICAgICBwb2xpY3lBcm46XG4gICAgICAgICAgJ2Fybjphd3M6aWFtOjphd3M6cG9saWN5L3NlcnZpY2Utcm9sZS9BbWF6b25SRFNFbmhhbmNlZE1vbml0b3JpbmdSb2xlJyxcbiAgICAgIH0sXG4gICAgICB7IHBhcmVudDogdGhpcyB9XG4gICAgKTtcblxuICAgIC8vIERCIGluc3RhbmNlXG4gICAgY29uc3QgZGJJbnN0YW5jZSA9IG5ldyBhd3MucmRzLkluc3RhbmNlKFxuICAgICAgYHRhcC1kYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIGlkZW50aWZpZXI6IGB0YXAtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBpbnN0YW5jZUNsYXNzLFxuICAgICAgICBlbmdpbmU6ICdteXNxbCcsXG4gICAgICAgIGVuZ2luZVZlcnNpb246ICc4LjAnLCAvLyBvciBhIHBpbm5lZCBwYXRjaCBsaWtlICc4LjAuMzUnXG4gICAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IDIwLFxuICAgICAgICBzdG9yYWdlVHlwZTogJ2dwMycsXG4gICAgICAgIHN0b3JhZ2VFbmNyeXB0ZWQ6IHRydWUsXG4gICAgICAgIGttc0tleUlkOiBhcmdzLnJkc0ttc0tleUFybixcblxuICAgICAgICBkYk5hbWU6ICd0YXBkYicsXG4gICAgICAgIHVzZXJuYW1lOiAnYWRtaW4nLFxuICAgICAgICBtYW5hZ2VNYXN0ZXJVc2VyUGFzc3dvcmQ6IHRydWUsXG4gICAgICAgIG1hc3RlclVzZXJTZWNyZXRLbXNLZXlJZDogYXJncy5yZHNLbXNLZXlBcm4sXG5cbiAgICAgICAgdnBjU2VjdXJpdHlHcm91cElkczogW2FyZ3MuZGJTZWN1cml0eUdyb3VwSWRdLFxuICAgICAgICBkYlN1Ym5ldEdyb3VwTmFtZTogZGJTdWJuZXRHcm91cC5uYW1lLFxuICAgICAgICBwdWJsaWNseUFjY2Vzc2libGU6IGZhbHNlLFxuXG4gICAgICAgIGJhY2t1cFJldGVudGlvblBlcmlvZDogNyxcbiAgICAgICAgYmFja3VwV2luZG93OiAnMDM6MDAtMDQ6MDAnLFxuICAgICAgICBtYWludGVuYW5jZVdpbmRvdzogJ3N1bjowNDowMC1zdW46MDU6MDAnLFxuICAgICAgICBhdXRvTWlub3JWZXJzaW9uVXBncmFkZTogdHJ1ZSxcblxuICAgICAgICBza2lwRmluYWxTbmFwc2hvdDogZmFsc2UsXG4gICAgICAgIGZpbmFsU25hcHNob3RJZGVudGlmaWVyOiBgdGFwLWRiLWZpbmFsLXNuYXBzaG90LSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgZGVsZXRlQXV0b21hdGVkQmFja3VwczogZmFsc2UsXG5cbiAgICAgICAgZW5hYmxlZENsb3Vkd2F0Y2hMb2dzRXhwb3J0czogWydlcnJvcicsICdnZW5lcmFsJywgJ3Nsb3dxdWVyeSddLFxuICAgICAgICBtb25pdG9yaW5nSW50ZXJ2YWw6IDYwLFxuICAgICAgICBtb25pdG9yaW5nUm9sZUFybjogbW9uaXRvcmluZ1JvbGUuYXJuLFxuXG4gICAgICAgIC8vIFBlcmZvcm1hbmNlIEluc2lnaHRzIGNvbmZpZ3VyYXRpb25cbiAgICAgICAgcGVyZm9ybWFuY2VJbnNpZ2h0c0VuYWJsZWQ6IHRydWUsXG4gICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNLbXNLZXlJZDogYXJncy5yZHNLbXNLZXlBcm4sXG4gICAgICAgIHBlcmZvcm1hbmNlSW5zaWdodHNSZXRlbnRpb25QZXJpb2Q6IDcsXG5cbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdNYWluRGF0YWJhc2UnLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLmRiSW5zdGFuY2VJZCA9IGRiSW5zdGFuY2UuaWQ7XG4gICAgdGhpcy5kYkluc3RhbmNlQXJuID0gZGJJbnN0YW5jZS5hcm47XG4gICAgdGhpcy5kYkluc3RhbmNlRW5kcG9pbnQgPSBkYkluc3RhbmNlLmVuZHBvaW50O1xuICAgIHRoaXMuZGJJbnN0YW5jZVBvcnQgPSBkYkluc3RhbmNlLnBvcnQ7XG4gICAgdGhpcy5kYlN1Ym5ldEdyb3VwTmFtZSA9IGRiU3VibmV0R3JvdXAubmFtZTtcblxuICAgIHRoaXMucmVnaXN0ZXJPdXRwdXRzKHtcbiAgICAgIGRiSW5zdGFuY2VJZDogdGhpcy5kYkluc3RhbmNlSWQsXG4gICAgICBkYkluc3RhbmNlQXJuOiB0aGlzLmRiSW5zdGFuY2VBcm4sXG4gICAgICBkYkluc3RhbmNlRW5kcG9pbnQ6IHRoaXMuZGJJbnN0YW5jZUVuZHBvaW50LFxuICAgICAgZGJJbnN0YW5jZVBvcnQ6IHRoaXMuZGJJbnN0YW5jZVBvcnQsXG4gICAgICBkYlN1Ym5ldEdyb3VwTmFtZTogdGhpcy5kYlN1Ym5ldEdyb3VwTmFtZSxcbiAgICB9KTtcbiAgfVxufVxuIl19