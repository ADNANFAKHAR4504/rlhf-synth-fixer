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
exports.DatabaseTierConstruct = void 0;
const constructs_1 = require("constructs");
const rds = __importStar(require("aws-cdk-lib/aws-rds"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const cdk = __importStar(require("aws-cdk-lib"));
/**
 * Database Tier Construct that creates a highly available RDS instance
 * with Multi-AZ deployment and automated backups
 */
class DatabaseTierConstruct extends constructs_1.Construct {
    database;
    databaseSecurityGroup;
    constructor(scope, id, vpc, config) {
        super(scope, id);
        // Create security group for RDS database
        // This follows the principle of least privilege
        this.databaseSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
            vpc,
            description: 'Security group for RDS database - allows MySQL/Aurora access from application tier',
            allowAllOutbound: false // Explicitly deny all outbound traffic
        });
        // Create DB subnet group using isolated subnets for maximum security
        const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
            vpc,
            description: 'Subnet group for RDS database in isolated subnets',
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED
            }
        });
        // Generate a secure random password for the database
        const databaseCredentials = rds.Credentials.fromGeneratedSecret('admin', {
            excludeCharacters: '"@/\\'
        });
        // Create RDS database instance with high availability configuration
        this.database = new rds.DatabaseInstance(this, 'Database', {
            engine: rds.DatabaseInstanceEngine.mysql({
                version: rds.MysqlEngineVersion.VER_8_0_35
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            credentials: databaseCredentials,
            // High availability and backup configuration
            multiAz: config.database.multiAz,
            allocatedStorage: config.database.allocatedStorage,
            storageType: rds.StorageType.GP2,
            storageEncrypted: config.database.storageEncrypted,
            // Backup and maintenance configuration
            backupRetention: cdk.Duration.days(config.database.backupRetention),
            deleteAutomatedBackups: false,
            deletionProtection: config.database.deletionProtection,
            // Network configuration
            vpc,
            subnetGroup: dbSubnetGroup,
            securityGroups: [this.databaseSecurityGroup],
            // Monitoring and logging
            monitoringInterval: cdk.Duration.seconds(60),
            enablePerformanceInsights: config.database.performanceInsights,
            performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
            // Maintenance window (during low-traffic hours)
            preferredMaintenanceWindow: 'sun:03:00-sun:04:00',
            preferredBackupWindow: '02:00-03:00',
            // Parameter group for optimization
            parameterGroup: rds.ParameterGroup.fromParameterGroupName(this, 'DefaultParameterGroup', 'default.mysql8.0')
        });
        // Apply comprehensive tagging
        Object.entries(config.tags).forEach(([key, value]) => {
            cdk.Tags.of(this.database).add(key, value);
            cdk.Tags.of(this.databaseSecurityGroup).add(key, value);
        });
        cdk.Tags.of(this.database).add('Name', `MultiRegionApp-Database-${config.region}`);
        cdk.Tags.of(this.databaseSecurityGroup).add('Name', `MultiRegionApp-DB-SG-${config.region}`);
    }
    /**
     * Allow inbound connections from application tier security group
     * This method should be called after the application tier is created
     */
    allowConnectionsFrom(applicationSecurityGroup) {
        this.databaseSecurityGroup.addIngressRule(applicationSecurityGroup, ec2.Port.tcp(3306), 'Allow MySQL access from application tier');
    }
}
exports.DatabaseTierConstruct = DatabaseTierConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UtdGllci1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYXRhYmFzZS10aWVyLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFDdkMseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyxpREFBbUM7QUFHbkM7OztHQUdHO0FBQ0gsTUFBYSxxQkFBc0IsU0FBUSxzQkFBUztJQUNsQyxRQUFRLENBQXVCO0lBQy9CLHFCQUFxQixDQUFvQjtJQUV6RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEdBQVksRUFBRSxNQUFtQjtRQUN6RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLHlDQUF5QztRQUN6QyxnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FBQyxJQUFJLEVBQUUsdUJBQXVCLEVBQUU7WUFDaEYsR0FBRztZQUNILFdBQVcsRUFBRSxvRkFBb0Y7WUFDakcsZ0JBQWdCLEVBQUUsS0FBSyxDQUFDLHVDQUF1QztTQUNoRSxDQUFDLENBQUM7UUFFSCxxRUFBcUU7UUFDckUsTUFBTSxhQUFhLEdBQUcsSUFBSSxHQUFHLENBQUMsV0FBVyxDQUFDLElBQUksRUFBRSxxQkFBcUIsRUFBRTtZQUNyRSxHQUFHO1lBQ0gsV0FBVyxFQUFFLG1EQUFtRDtZQUNoRSxVQUFVLEVBQUU7Z0JBQ1YsVUFBVSxFQUFFLEdBQUcsQ0FBQyxVQUFVLENBQUMsZ0JBQWdCO2FBQzVDO1NBQ0YsQ0FBQyxDQUFDO1FBRUgscURBQXFEO1FBQ3JELE1BQU0sbUJBQW1CLEdBQUcsR0FBRyxDQUFDLFdBQVcsQ0FBQyxtQkFBbUIsQ0FBQyxPQUFPLEVBQUU7WUFDdkUsaUJBQWlCLEVBQUUsT0FBTztTQUMzQixDQUFDLENBQUM7UUFFSCxvRUFBb0U7UUFDcEUsSUFBSSxD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O0FBOUZELHNEQThGQyIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IENvbnN0cnVjdCB9IGZyb20gJ2NvbnN0cnVjdHMnO1xuaW1wb3J0ICogYXMgcmRzIGZyb20gJ2F3cy1jZGstbGliL2F3cy1yZHMnO1xuaW1wb3J0ICogYXMgZWMyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1lYzInO1xuaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCB7IFN0YWNrQ29uZmlnIH0gZnJvbSAnLi4vaW50ZXJmYWNlcy9zdGFjay1jb25maWcnO1xuXG4vKipcbiAqIERhdGFiYXNlIFRpZXIgQ29uc3RydWN0IHRoYXQgY3JlYXRlcyBhIGhpZ2hseSBhdmFpbGFibGUgUkRTIGluc3RhbmNlXG4gKiB3aXRoIE11bHRpLUFaIGRlcGxveW1lbnQgYW5kIGF1dG9tYXRlZCBiYWNrdXBzXG4gKi9cbmV4cG9ydCBjbGFzcyBEYXRhYmFzZVRpZXJDb25zdHJ1Y3QgZXh0ZW5kcyBDb25zdHJ1Y3Qge1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YWJhc2U6IHJkcy5EYXRhYmFzZUluc3RhbmNlO1xuICBwdWJsaWMgcmVhZG9ubHkgZGF0YWJhc2VTZWN1cml0eUdyb3VwOiBlYzIuU2VjdXJpdHlHcm91cDtcblxuICBjb25zdHJ1Y3RvcihzY29wZTogQ29uc3RydWN0LCBpZDogc3RyaW5nLCB2cGM6IGVjMi5WcGMsIGNvbmZpZzogU3RhY2tDb25maWcpIHtcbiAgICBzdXBlcihzY29wZSwgaWQpO1xuXG4gICAgLy8gQ3JlYXRlIHNlY3VyaXR5IGdyb3VwIGZvciBSRFMgZGF0YWJhc2VcbiAgICAvLyBUaGlzIGZvbGxvd3MgdGhlIHByaW5jaXBsZSBvZiBsZWFzdCBwcml2aWxlZ2VcbiAgICB0aGlzLmRhdGFiYXNlU2VjdXJpdHlHcm91cCA9IG5ldyBlYzIuU2VjdXJpdHlHcm91cCh0aGlzLCAnRGF0YWJhc2VTZWN1cml0eUdyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246ICdTZWN1cml0eSBncm91cCBmb3IgUkRTIGRhdGFiYXNlIC0gYWxsb3dzIE15U1FML0F1cm9yYSBhY2Nlc3MgZnJvbSBhcHBsaWNhdGlvbiB0aWVyJyxcbiAgICAgIGFsbG93QWxsT3V0Ym91bmQ6IGZhbHNlIC8vIEV4cGxpY2l0bHkgZGVueSBhbGwgb3V0Ym91bmQgdHJhZmZpY1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIERCIHN1Ym5ldCBncm91cCB1c2luZyBpc29sYXRlZCBzdWJuZXRzIGZvciBtYXhpbXVtIHNlY3VyaXR5XG4gICAgY29uc3QgZGJTdWJuZXRHcm91cCA9IG5ldyByZHMuU3VibmV0R3JvdXAodGhpcywgJ0RhdGFiYXNlU3VibmV0R3JvdXAnLCB7XG4gICAgICB2cGMsXG4gICAgICBkZXNjcmlwdGlvbjogJ1N1Ym5ldCBncm91cCBmb3IgUkRTIGRhdGFiYXNlIGluIGlzb2xhdGVkIHN1Ym5ldHMnLFxuICAgICAgdnBjU3VibmV0czoge1xuICAgICAgICBzdWJuZXRUeXBlOiBlYzIuU3VibmV0VHlwZS5QUklWQVRFX0lTT0xBVEVEXG4gICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBHZW5lcmF0ZSBhIHNlY3VyZSByYW5kb20gcGFzc3dvcmQgZm9yIHRoZSBkYXRhYmFzZVxuICAgIGNvbnN0IGRhdGFiYXNlQ3JlZGVudGlhbHMgPSByZHMuQ3JlZGVudGlhbHMuZnJvbUdlbmVyYXRlZFNlY3JldCgnYWRtaW4nLCB7XG4gICAgICBleGNsdWRlQ2hhcmFjdGVyczogJ1wiQC9cXFxcJ1xuICAgIH0pO1xuXG4gICAgLy8gQ3JlYXRlIFJEUyBkYXRhYmFzZSBpbnN0YW5jZSB3aXRoIGhpZ2ggYXZhaWxhYmlsaXR5IGNvbmZpZ3VyYXRpb25cbiAgICB0aGlzLmRhdGFiYXNlID0gbmV3IHJkcy5EYXRhYmFzZUluc3RhbmNlKHRoaXMsICdEYXRhYmFzZScsIHtcbiAgICAgIGVuZ2luZTogcmRzLkRhdGFiYXNlSW5zdGFuY2VFbmdpbmUubXlzcWwoe1xuICAgICAgICB2ZXJzaW9uOiByZHMuTXlzcWxFbmdpbmVWZXJzaW9uLlZFUl84XzBfMzVcbiAgICAgIH0pLFxuICAgICAgaW5zdGFuY2VUeXBlOiBlYzIuSW5zdGFuY2VUeXBlLm9mKFxuICAgICAgICBlYzIuSW5zdGFuY2VDbGFzcy5CVVJTVEFCTEUzLFxuICAgICAgICBlYzIuSW5zdGFuY2VTaXplLk1JQ1JPXG4gICAgICApLFxuICAgICAgY3JlZGVudGlhbHM6IGRhdGFiYXNlQ3JlZGVudGlhbHMsXG4gICAgICBcbiAgICAgIC8vIEhpZ2ggYXZhaWxhYmlsaXR5IGFuZCBiYWNrdXAgY29uZmlndXJhdGlvblxuICAgICAgbXVsdGlBejogY29uZmlnLmRhdGFiYXNlLm11bHRpQXosXG4gICAgICBhbGxvY2F0ZWRTdG9yYWdlOiBjb25maWcuZGF0YWJhc2UuYWxsb2NhdGVkU3RvcmFnZSxcbiAgICAgIHN0b3JhZ2VUeXBlOiByZHMuU3RvcmFnZVR5cGUuR1AyLFxuICAgICAgc3RvcmFnZUVuY3J5cHRlZDogY29uZmlnLmRhdGFiYXNlLnN0b3JhZ2VFbmNyeXB0ZWQsXG4gICAgICBcbiAgICAgIC8vIEJhY2t1cCBhbmQgbWFpbnRlbmFuY2UgY29uZmlndXJhdGlvblxuICAgICAgYmFja3VwUmV0ZW50aW9uOiBjZGsuRHVyYXRpb24uZGF5cyhjb25maWcuZGF0YWJhc2UuYmFja3VwUmV0ZW50aW9uKSxcbiAgICAgIGRlbGV0ZUF1dG9tYXRlZEJhY2t1cHM6IGZhbHNlLFxuICAgICAgZGVsZXRpb25Qcm90ZWN0aW9uOiBjb25maWcuZGF0YWJhc2UuZGVsZXRpb25Qcm90ZWN0aW9uLFxuICAgICAgXG4gICAgICAvLyBOZXR3b3JrIGNvbmZpZ3VyYXRpb25cbiAgICAgIHZwYyxcbiAgICAgIHN1Ym5ldEdyb3VwOiBkYlN1Ym5ldEdyb3VwLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFt0aGlzLmRhdGFiYXNlU2VjdXJpdHlHcm91cF0sXG4gICAgICBcbiAgICAgIC8vIE1vbml0b3JpbmcgYW5kIGxvZ2dpbmdcbiAgICAgIG1vbml0b3JpbmdJbnRlcnZhbDogY2RrLkR1cmF0aW9uLnNlY29uZHMoNjApLFxuICAgICAgZW5hYmxlUGVyZm9ybWFuY2VJbnNpZ2h0czogY29uZmlnLmRhdGFiYXNlLnBlcmZvcm1hbmNlSW5zaWdodHMsXG4gICAgICBwZXJmb3JtYW5jZUluc2lnaHRSZXRlbnRpb246IHJkcy5QZXJmb3JtYW5jZUluc2lnaHRSZXRlbnRpb24uREVGQVVMVCxcbiAgICAgIFxuICAgICAgLy8gTWFpbnRlbmFuY2Ugd2luZG93IChkdXJpbmcgbG93LXRyYWZmaWMgaG91cnMpXG4gICAgICBwcmVmZXJyZWRNYWludGVuYW5jZVdpbmRvdzogJ3N1bjowMzowMC1zdW46MDQ6MDAnLFxuICAgICAgcHJlZmVycmVkQmFja3VwV2luZG93OiAnMDI6MDAtMDM6MDAnLFxuICAgICAgXG4gICAgICAvLyBQYXJhbWV0ZXIgZ3JvdXAgZm9yIG9wdGltaXphdGlvblxuICAgICAgcGFyYW1ldGVyR3JvdXA6IHJkcy5QYXJhbWV0ZXJHcm91cC5mcm9tUGFyYW1ldGVyR3JvdXBOYW1lKFxuICAgICAgICB0aGlzLFxuICAgICAgICAnRGVmYXVsdFBhcmFtZXRlckdyb3VwJyxcbiAgICAgICAgJ2RlZmF1bHQubXlzcWw4LjAnXG4gICAgICApXG4gICAgfSk7XG5cbiAgICAvLyBBcHBseSBjb21wcmVoZW5zaXZlIHRhZ2dpbmdcbiAgICBPYmplY3QuZW50cmllcyhjb25maWcudGFncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFiYXNlKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFiYXNlU2VjdXJpdHlHcm91cCkuYWRkKGtleSwgdmFsdWUpO1xuICAgIH0pO1xuXG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhYmFzZSkuYWRkKCdOYW1lJywgYE11bHRpUmVnaW9uQXBwLURhdGFiYXNlLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFiYXNlU2VjdXJpdHlHcm91cCkuYWRkKCdOYW1lJywgYE11bHRpUmVnaW9uQXBwLURCLVNHLSR7Y29uZmlnLnJlZ2lvbn1gKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvdyBpbmJvdW5kIGNvbm5lY3Rpb25zIGZyb20gYXBwbGljYXRpb24gdGllciBzZWN1cml0eSBncm91cFxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGFmdGVyIHRoZSBhcHBsaWNhdGlvbiB0aWVyIGlzIGNyZWF0ZWRcbiAgICovXG4gIHB1YmxpYyBhbGxvd0Nvbm5lY3Rpb25zRnJvbShhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwKTogdm9pZCB7XG4gICAgdGhpcy5kYXRhYmFzZVNlY3VyaXR5R3JvdXAuYWRkSW5ncmVzc1J1bGUoXG4gICAgICBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXAsXG4gICAgICBlYzIuUG9ydC50Y3AoMzMwNiksXG4gICAgICAnQWxsb3cgTXlTUUwgYWNjZXNzIGZyb20gYXBwbGljYXRpb24gdGllcidcbiAgICApO1xuICB9XG59Il19