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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmRzLXN0YWNrLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsicmRzLXN0YWNrLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx1REFBeUM7QUFhekMsTUFBYSxRQUFTLFNBQVEsTUFBTSxDQUFDLGlCQUFpQjtJQUNwQyxZQUFZLENBQXdCO0lBQ3BDLGFBQWEsQ0FBd0I7SUFDckMsa0JBQWtCLENBQXdCO0lBQzFDLGNBQWMsQ0FBd0I7SUFFdEQsWUFBWSxJQUFZLEVBQUUsSUFBa0IsRUFBRSxJQUFzQjtRQUNsRSxLQUFLLENBQUMsa0JBQWtCLEVBQUUsSUFBSSxFQUFFLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztRQUU1QyxNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQyxpQkFBaUIsSUFBSSxLQUFLLENBQUM7UUFDMUQsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDLGFBQWEsSUFBSSxhQUFhLENBQUM7UUFDMUQsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLElBQUksSUFBSSxFQUFFLENBQUM7UUFFN0IsNENBQTRDO1FBQzVDLE1BQU0sQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLGdCQUFnQixDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxFQUFFO1lBQy9DLElBQUksQ0FBQyxHQUFHLElBQUksR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsQ0FBQztnQkFDM0IsTUFBTSxJQUFJLEtBQUssQ0FDYiwrQ0FBK0MsR0FBRyxFQUFFLE1BQU0sSUFBSSxDQUFDLEdBQUcsQ0FDbkUsQ0FBQztZQUNKLENBQUM7UUFDSCxDQUFDLENBQUMsQ0FBQztRQUVILGVBQWU7UUFDZixNQUFNLGFBQWEsR0FBRyxJQUFJLEdBQUcsQ0FBQyxHQUFHLENBQUMsV0FBVyxDQUMzQyx1QkFBdUIsaUJBQWlCLEVBQUUsRUFDMUM7WUFDRSxJQUFJLEVBQUUsdUJBQXVCLGlC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QVEsQ0FBQztRQUM5QyxJQUFJLENBQUMsY0FBYyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUM7UUFFdEMsSUFBSSxDQUFDLGVBQWUsQ0FBQztZQUNuQixZQUFZLEVBQUUsSUFBSSxDQUFDLFlBQVk7WUFDL0IsYUFBYSxFQUFFLElBQUksQ0FBQyxhQUFhO1lBQ2pDLGtCQUFrQixFQUFFLElBQUksQ0FBQyxrQkFBa0I7WUFDM0MsY0FBYyxFQUFFLElBQUksQ0FBQyxjQUFjO1NBQ3BDLENBQUMsQ0FBQztJQUNMLENBQUM7Q0FDRjtBQXZIRCw0QkF1SEMiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgKiBhcyBhd3MgZnJvbSAnQHB1bHVtaS9hd3MnO1xuaW1wb3J0ICogYXMgcHVsdW1pIGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcbmltcG9ydCB7IFJlc291cmNlT3B0aW9ucyB9IGZyb20gJ0BwdWx1bWkvcHVsdW1pJztcblxuZXhwb3J0IGludGVyZmFjZSBSZHNTdGFja0FyZ3Mge1xuICBlbnZpcm9ubWVudFN1ZmZpeD86IHN0cmluZztcbiAgdGFncz86IHB1bHVtaS5JbnB1dDx7IFtrZXk6IHN0cmluZ106IHN0cmluZyB9PjtcbiAgcHJpdmF0ZVN1Ym5ldElkczogcHVsdW1pLklucHV0PHB1bHVtaS5JbnB1dDxzdHJpbmc+W10+O1xuICBkYlNlY3VyaXR5R3JvdXBJZDogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIHJkc0ttc0tleUFybjogcHVsdW1pLklucHV0PHN0cmluZz47XG4gIGRiU2VjcmV0QXJuOiBwdWx1bWkuSW5wdXQ8c3RyaW5nPjtcbiAgaW5zdGFuY2VDbGFzcz86IHN0cmluZztcbn1cblxuZXhwb3J0IGNsYXNzIFJkc1N0YWNrIGV4dGVuZHMgcHVsdW1pLkNvbXBvbmVudFJlc291cmNlIHtcbiAgcHVibGljIHJlYWRvbmx5IGRiSW5zdGFuY2VJZDogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZUFybjogcHVsdW1pLk91dHB1dDxzdHJpbmc+O1xuICBwdWJsaWMgcmVhZG9ubHkgZGJJbnN0YW5jZUVuZHBvaW50OiBwdWx1bWkuT3V0cHV0PHN0cmluZz47XG4gIHB1YmxpYyByZWFkb25seSBkYkluc3RhbmNlUG9ydDogcHVsdW1pLk91dHB1dDxudW1iZXI+O1xuXG4gIGNvbnN0cnVjdG9yKG5hbWU6IHN0cmluZywgYXJnczogUmRzU3RhY2tBcmdzLCBvcHRzPzogUmVzb3VyY2VPcHRpb25zKSB7XG4gICAgc3VwZXIoJ3RhcDpyZHM6UmRzU3RhY2snLCBuYW1lLCBhcmdzLCBvcHRzKTtcblxuICAgIGNvbnN0IGVudmlyb25tZW50U3VmZml4ID0gYXJncy5lbnZpcm9ubWVudFN1ZmZpeCB8fCAnZGV2JztcbiAgICBjb25zdCBpbnN0YW5jZUNsYXNzID0gYXJncy5pbnN0YW5jZUNsYXNzIHx8ICdkYi50My5taWNybyc7XG4gICAgY29uc3QgdGFncyA9IGFyZ3MudGFncyB8fCB7fTtcblxuICAgIC8vIFRyaXB3aXJlIHRvIGNhdGNoIGJhZCBzdWJuZXQgaW5wdXRzIGVhcmx5XG4gICAgcHVsdW1pLm91dHB1dChhcmdzLnByaXZhdGVTdWJuZXRJZHMpLmFwcGx5KGlkcyA9PiB7XG4gICAgICBpZiAoIWlkcyB8fCBpZHMubGVuZ3RoIDwgMikge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgICAgYFJEUyBuZWVkcyBhdCBsZWFzdCB0d28gcHJpdmF0ZSBzdWJuZXRzOyBnb3QgJHtpZHM/Lmxlbmd0aCA/PyAwfS5gXG4gICAgICAgICk7XG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBTdWJuZXQgZ3JvdXBcbiAgICBjb25zdCBkYlN1Ym5ldEdyb3VwID0gbmV3IGF3cy5yZHMuU3VibmV0R3JvdXAoXG4gICAgICBgdGFwLWRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIG5hbWU6IGB0YXAtZGItc3VibmV0LWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgICAgc3VibmV0SWRzOiBhcmdzLnByaXZhdGVTdWJuZXRJZHMsXG4gICAgICAgIHRhZ3M6IHsgTmFtZTogYHRhcC1kYi1zdWJuZXQtZ3JvdXAtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLCAuLi50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICAvLyBFbmhhbmNlZCBtb25pdG9yaW5nIHJvbGVcbiAgICBjb25zdCBtb25pdG9yaW5nUm9sZSA9IG5ldyBhd3MuaWFtLlJvbGUoXG4gICAgICBgdGFwLXJkcy1tb25pdG9yaW5nLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAge1xuICAgICAgICBuYW1lOiBgdGFwLXJkcy1tb25pdG9yaW5nLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBhc3N1bWVSb2xlUG9saWN5OiBKU09OLnN0cmluZ2lmeSh7XG4gICAgICAgICAgVmVyc2lvbjogJzIwMTItMTAtMTcnLFxuICAgICAgICAgIFN0YXRlbWVudDogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICBBY3Rpb246ICdzdHM6QXNzdW1lUm9sZScsXG4gICAgICAgICAgICAgIEVmZmVjdDogJ0FsbG93JyxcbiAgICAgICAgICAgICAgUHJpbmNpcGFsOiB7IFNlcnZpY2U6ICdtb25pdG9yaW5nLnJkcy5hbWF6b25hd3MuY29tJyB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICBdLFxuICAgICAgICB9KSxcbiAgICAgICAgdGFnczogeyBOYW1lOiBgdGFwLXJkcy1tb25pdG9yaW5nLXJvbGUtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLCAuLi50YWdzIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICBuZXcgYXdzLmlhbS5Sb2xlUG9saWN5QXR0YWNobWVudChcbiAgICAgIGB0YXAtcmRzLW1vbml0b3JpbmctYXR0YWNobWVudC0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICB7XG4gICAgICAgIHJvbGU6IG1vbml0b3JpbmdSb2xlLm5hbWUsXG4gICAgICAgIHBvbGljeUFybjpcbiAgICAgICAgICAnYXJuOmF3czppYW06OmF3czpwb2xpY3kvc2VydmljZS1yb2xlL0FtYXpvblJEU0VuaGFuY2VkTW9uaXRvcmluZ1JvbGUnLFxuICAgICAgfSxcbiAgICAgIHsgcGFyZW50OiB0aGlzIH1cbiAgICApO1xuXG4gICAgLy8gREIgaW5zdGFuY2VcbiAgICBjb25zdCBkYkluc3RhbmNlID0gbmV3IGF3cy5yZHMuSW5zdGFuY2UoXG4gICAgICBgdGFwLWRiLSR7ZW52aXJvbm1lbnRTdWZmaXh9YCxcbiAgICAgIHtcbiAgICAgICAgaWRlbnRpZmllcjogYHRhcC1kYi0ke2Vudmlyb25tZW50U3VmZml4fWAsXG4gICAgICAgIGluc3RhbmNlQ2xhc3MsXG4gICAgICAgIGVuZ2luZTogJ215c3FsJyxcbiAgICAgICAgZW5naW5lVmVyc2lvbjogJzguMCcsIC8vIG9yIGEgcGlubmVkIHBhdGNoIGxpa2UgJzguMC4zNSdcbiAgICAgICAgYWxsb2NhdGVkU3RvcmFnZTogMjAsXG4gICAgICAgIHN0b3JhZ2VUeXBlOiAnZ3AzJyxcbiAgICAgICAgc3RvcmFnZUVuY3J5cHRlZDogdHJ1ZSxcbiAgICAgICAga21zS2V5SWQ6IGFyZ3MucmRzS21zS2V5QXJuLFxuXG4gICAgICAgIGRiTmFtZTogJ3RhcGRiJyxcbiAgICAgICAgdXNlcm5hbWU6ICdhZG1pbicsXG4gICAgICAgIG1hbmFnZU1hc3RlclVzZXJQYXNzd29yZDogdHJ1ZSxcbiAgICAgICAgbWFzdGVyVXNlclNlY3JldEttc0tleUlkOiBhcmdzLnJkc0ttc0tleUFybixcblxuICAgICAgICB2cGNTZWN1cml0eUdyb3VwSWRzOiBbYXJncy5kYlNlY3VyaXR5R3JvdXBJZF0sXG4gICAgICAgIGRiU3VibmV0R3JvdXBOYW1lOiBkYlN1Ym5ldEdyb3VwLm5hbWUsXG4gICAgICAgIHB1YmxpY2x5QWNjZXNzaWJsZTogZmFsc2UsXG5cbiAgICAgICAgYmFja3VwUmV0ZW50aW9uUGVyaW9kOiA3LFxuICAgICAgICBiYWNrdXBXaW5kb3c6ICcwMzowMC0wNDowMCcsXG4gICAgICAgIG1haW50ZW5hbmNlV2luZG93OiAnc3VuOjA0OjAwLXN1bjowNTowMCcsXG4gICAgICAgIGF1dG9NaW5vclZlcnNpb25VcGdyYWRlOiB0cnVlLFxuXG4gICAgICAgIHNraXBGaW5hbFNuYXBzaG90OiBmYWxzZSxcbiAgICAgICAgZmluYWxTbmFwc2hvdElkZW50aWZpZXI6IGB0YXAtZGItZmluYWwtc25hcHNob3QtJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICBkZWxldGVBdXRvbWF0ZWRCYWNrdXBzOiBmYWxzZSxcblxuICAgICAgICBlbmFibGVkQ2xvdWR3YXRjaExvZ3NFeHBvcnRzOiBbJ2Vycm9yJywgJ2dlbmVyYWwnLCAnc2xvd3F1ZXJ5J10sXG4gICAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogNjAsXG4gICAgICAgIG1vbml0b3JpbmdSb2xlQXJuOiBtb25pdG9yaW5nUm9sZS5hcm4sXG5cbiAgICAgICAgdGFnczoge1xuICAgICAgICAgIE5hbWU6IGB0YXAtZGItJHtlbnZpcm9ubWVudFN1ZmZpeH1gLFxuICAgICAgICAgIFB1cnBvc2U6ICdNYWluRGF0YWJhc2UnLFxuICAgICAgICAgIC4uLnRhZ3MsXG4gICAgICAgIH0sXG4gICAgICB9LFxuICAgICAgeyBwYXJlbnQ6IHRoaXMgfVxuICAgICk7XG5cbiAgICB0aGlzLmRiSW5zdGFuY2VJZCA9IGRiSW5zdGFuY2UuaWQ7XG4gICAgdGhpcy5kYkluc3RhbmNlQXJuID0gZGJJbnN0YW5jZS5hcm47XG4gICAgdGhpcy5kYkluc3RhbmNlRW5kcG9pbnQgPSBkYkluc3RhbmNlLmVuZHBvaW50O1xuICAgIHRoaXMuZGJJbnN0YW5jZVBvcnQgPSBkYkluc3RhbmNlLnBvcnQ7XG5cbiAgICB0aGlzLnJlZ2lzdGVyT3V0cHV0cyh7XG4gICAgICBkYkluc3RhbmNlSWQ6IHRoaXMuZGJJbnN0YW5jZUlkLFxuICAgICAgZGJJbnN0YW5jZUFybjogdGhpcy5kYkluc3RhbmNlQXJuLFxuICAgICAgZGJJbnN0YW5jZUVuZHBvaW50OiB0aGlzLmRiSW5zdGFuY2VFbmRwb2ludCxcbiAgICAgIGRiSW5zdGFuY2VQb3J0OiB0aGlzLmRiSW5zdGFuY2VQb3J0LFxuICAgIH0pO1xuICB9XG59XG4iXX0=