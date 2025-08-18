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
exports.DatabaseConstruct = void 0;
const cdk = __importStar(require("aws-cdk-lib"));
const ec2 = __importStar(require("aws-cdk-lib/aws-ec2"));
const rds = __importStar(require("aws-cdk-lib/aws-rds"));
const secretsmanager = __importStar(require("aws-cdk-lib/aws-secretsmanager"));
const constructs_1 = require("constructs");
class DatabaseConstruct extends constructs_1.Construct {
    database;
    secret;
    constructor(scope, id, props) {
        super(scope, id);
        const { environmentSuffix, region, vpc, securityGroup } = props;
        // Create database credentials secret
        this.secret = new secretsmanager.Secret(this, 'DatabaseSecret', {
            description: 'Database credentials for PostgreSQL',
            generateSecretString: {
                secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
                generateStringKey: 'password',
                excludeCharacters: '"@/\\',
                includeSpace: false,
                passwordLength: 16,
            },
        });
        // Create subnet group for RDS
        const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
            description: 'Subnet group for RDS database',
            vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            },
        });
        // Create parameter group for PostgreSQL
        const parameterGroup = new rds.ParameterGroup(this, 'DatabaseParameterGroup', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_15,
            }),
            description: 'Parameter group for PostgreSQL 15',
        });
        // Create the RDS instance
        this.database = new rds.DatabaseInstance(this, 'Database', {
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_15,
            }),
            instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            credentials: rds.Credentials.fromSecret(this.secret),
            vpc,
            securityGroups: [securityGroup],
            subnetGroup,
            parameterGroup,
            multiAz: true, // Enable Multi-AZ for high availability
            storageEncrypted: true, // Enable encryption at rest
            storageEncryptionKey: undefined, // Use default AWS managed key
            backupRetention: cdk.Duration.days(7),
            deletionProtection: false, // Set to true for production
            deleteAutomatedBackups: false,
            databaseName: 'devdb',
            allocatedStorage: 20,
            storageType: rds.StorageType.GP3,
            enablePerformanceInsights: true,
            performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
        });
        // Tag database resources
        cdk.Tags.of(this.database).add('Name', `rds-postgres-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.database).add('Purpose', 'DevDatabase');
        cdk.Tags.of(this.database).add('Environment', environmentSuffix);
        cdk.Tags.of(this.database).add('Region', region);
        cdk.Tags.of(this.database).add('Engine', 'PostgreSQL');
        cdk.Tags.of(this.secret).add('Name', `db-secret-${environmentSuffix}-${region}`);
        cdk.Tags.of(this.secret).add('Purpose', 'DatabaseCredentials');
        cdk.Tags.of(subnetGroup).add('Name', `db-subnet-group-${environmentSuffix}-${region}`);
        cdk.Tags.of(parameterGroup).add('Name', `db-param-group-${environmentSuffix}-${region}`);
    }
}
exports.DatabaseConstruct = DatabaseConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UtY29uc3RydWN0LmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZGF0YWJhc2UtY29uc3RydWN0LnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztBQUFBLGlEQUFtQztBQUNuQyx5REFBMkM7QUFDM0MseURBQTJDO0FBQzNDLCtFQUFpRTtBQUNqRSwyQ0FBdUM7QUFTdkMsTUFBYSxpQkFBa0IsU0FBUSxzQkFBUztJQUM5QixRQUFRLENBQXVCO0lBQy9CLE1BQU0sQ0FBd0I7SUFFOUMsWUFBWSxLQUFnQixFQUFFLEVBQVUsRUFBRSxLQUE2QjtRQUNyRSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLE1BQU0sRUFBRSxpQkFBaUIsRUFBRSxNQUFNLEVBQUUsR0FBRyxFQUFFLGFBQWEsRUFBRSxHQUFHLEtBQUssQ0FBQztRQUVoRSxxQ0FBcUM7UUFDckMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJLGNBQWMsQ0FBQyxNQUFNLENBQUMsSUFBSSxFQUFFLGdCQUFnQixFQUFFO1lBQzlELFdBQVcsRUFBRSxxQ0FBcUM7WUFDbEQsb0JBQW9CLEVBQUU7Z0JBQ3BCLG9CQUFvQixFQUFFLElBQUksQ0FBQyxTQUFTLENBQUMsRUFBRSxRQUFRLEVBQUUsU0FBUyxFQUFFLENBQUM7Z0JBQzdELGlCQUFpQixFQUFFLFVBQVU7Z0JBQzdCLGlCQUFpQixFQUFFLE9BQU87Z0JBQzFCLFlBQVksRUFBRSxLQUFLO2dCQUNuQixjQUFjLEVBQUUsRUFBRTthQUNuQjtTQUNGLENBQUMsQ0FBQztRQUVILDhCQUE4QjtRQUM5QixNQUFNLFdBQVcsR0FBRyxJQUFJLEdBQUcsQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLHFCQUFxQixFQUFFO1lBQ25FLFdBQVcsRUFBRSwrQkFBK0I7WUFDNUMsR0FBRztZQUNILFVBQVUsRUFBRTtnQkFDVixVQUFVLEVBQUUsR0FBRyxDQUFDLFVB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QztRQUUvRCxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxXQUFXLENBQUMsQ0FBQyxHQUFHLENBQzFCLE1BQU0sRUFDTixtQkFBbUIsaUJBQWlCLElBQUksTUFBTSxFQUFFLENBQ2pELENBQUM7UUFDRixHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxjQUFjLENBQUMsQ0FBQyxHQUFHLENBQzdCLE1BQU0sRUFDTixrQkFBa0IsaUJBQWlCLElBQUksTUFBTSxFQUFFLENBQ2hELENBQUM7SUFDSixDQUFDO0NBQ0Y7QUE5RkQsOENBOEZDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0ICogYXMgY2RrIGZyb20gJ2F3cy1jZGstbGliJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIHJkcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtcmRzJztcbmltcG9ydCAqIGFzIHNlY3JldHNtYW5hZ2VyIGZyb20gJ2F3cy1jZGstbGliL2F3cy1zZWNyZXRzbWFuYWdlcic7XG5pbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcblxuaW50ZXJmYWNlIERhdGFiYXNlQ29uc3RydWN0UHJvcHMge1xuICBlbnZpcm9ubWVudFN1ZmZpeDogc3RyaW5nO1xuICByZWdpb246IHN0cmluZztcbiAgdnBjOiBlYzIuVnBjO1xuICBzZWN1cml0eUdyb3VwOiBlYzIuU2VjdXJpdHlHcm91cDtcbn1cblxuZXhwb3J0IGNsYXNzIERhdGFiYXNlQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFiYXNlOiByZHMuRGF0YWJhc2VJbnN0YW5jZTtcbiAgcHVibGljIHJlYWRvbmx5IHNlY3JldDogc2VjcmV0c21hbmFnZXIuU2VjcmV0O1xuXG4gIGNvbnN0cnVjdG9yKHNjb3BlOiBDb25zdHJ1Y3QsIGlkOiBzdHJpbmcsIHByb3BzOiBEYXRhYmFzZUNvbnN0cnVjdFByb3BzKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIGNvbnN0IHsgZW52aXJvbm1lbnRTdWZmaXgsIHJlZ2lvbiwgdnBjLCBzZWN1cml0eUdyb3VwIH0gPSBwcm9wcztcblxuICAgIC8vIENyZWF0ZSBkYXRhYmFzZSBjcmVkZW50aWFscyBzZWNyZXRcbiAgICB0aGlzLnNlY3JldCA9IG5ldyBzZWNyZXRzbWFuYWdlci5TZWNyZXQodGhpcywgJ0RhdGFiYXNlU2VjcmV0Jywge1xuICAgICAgZGVzY3JpcHRpb246ICdEYXRhYmFzZSBjcmVkZW50aWFscyBmb3IgUG9zdGdyZVNRTCcsXG4gICAgICBnZW5lcmF0ZVNlY3JldFN0cmluZzoge1xuICAgICAgICBzZWNyZXRTdHJpbmdUZW1wbGF0ZTogSlNPTi5zdHJpbmdpZnkoeyB1c2VybmFtZTogJ2RiYWRtaW4nIH0pLFxuICAgICAgICBnZW5lcmF0ZVN0cmluZ0tleTogJ3Bhc3N3b3JkJyxcbiAgICAgICAgZXhjbHVkZUNoYXJhY3RlcnM6ICdcIkAvXFxcXCcsXG4gICAgICAgIGluY2x1ZGVTcGFjZTogZmFsc2UsXG4gICAgICAgIHBhc3N3b3JkTGVuZ3RoOiAxNixcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgc3VibmV0IGdyb3VwIGZvciBSRFNcbiAgICBjb25zdCBzdWJuZXRHcm91cCA9IG5ldyByZHMuU3VibmV0R3JvdXAodGhpcywgJ0RhdGFiYXNlU3VibmV0R3JvdXAnLCB7XG4gICAgICBkZXNjcmlwdGlvbjogJ1N1Ym5ldCBncm91cCBmb3IgUkRTIGRhdGFiYXNlJyxcbiAgICAgIHZwYyxcbiAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBDcmVhdGUgcGFyYW1ldGVyIGdyb3VwIGZvciBQb3N0Z3JlU1FMXG4gICAgY29uc3QgcGFyYW1ldGVyR3JvdXAgPSBuZXcgcmRzLlBhcmFtZXRlckdyb3VwKFxuICAgICAgdGhpcyxcbiAgICAgICdEYXRhYmFzZVBhcmFtZXRlckdyb3VwJyxcbiAgICAgIHtcbiAgICAgICAgZW5naW5lOiByZHMuRGF0YWJhc2VJbnN0YW5jZUVuZ2luZS5wb3N0Z3Jlcyh7XG4gICAgICAgICAgdmVyc2lvbjogcmRzLlBvc3RncmVzRW5naW5lVmVyc2lvbi5WRVJfMTUsXG4gICAgICAgIH0pLFxuICAgICAgICBkZXNjcmlwdGlvbjogJ1BhcmFtZXRlciBncm91cCBmb3IgUG9zdGdyZVNRTCAxNScsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSB0aGUgUkRTIGluc3RhbmNlXG4gICAgdGhpcy5kYXRhYmFzZSA9IG5ldyByZHMuRGF0YWJhc2VJbnN0YW5jZSh0aGlzLCAnRGF0YWJhc2UnLCB7XG4gICAgICBlbmdpbmU6IHJkcy5EYXRhYmFzZUluc3RhbmNlRW5naW5lLnBvc3RncmVzKHtcbiAgICAgICAgdmVyc2lvbjogcmRzLlBvc3RncmVzRW5naW5lVmVyc2lvbi5WRVJfMTUsXG4gICAgICB9KSxcbiAgICAgIGluc3RhbmNlVHlwZTogZWMyLkluc3RhbmNlVHlwZS5vZihcbiAgICAgICAgZWMyLkluc3RhbmNlQ2xhc3MuVDMsXG4gICAgICAgIGVjMi5JbnN0YW5jZVNpemUuTUlDUk9cbiAgICAgICksXG4gICAgICBjcmVkZW50aWFsczogcmRzLkNyZWRlbnRpYWxzLmZyb21TZWNyZXQodGhpcy5zZWNyZXQpLFxuICAgICAgdnBjLFxuICAgICAgc2VjdXJpdHlHcm91cHM6IFtzZWN1cml0eUdyb3VwXSxcbiAgICAgIHN1Ym5ldEdyb3VwLFxuICAgICAgcGFyYW1ldGVyR3JvdXAsXG4gICAgICBtdWx0aUF6OiB0cnVlLCAvLyBFbmFibGUgTXVsdGktQVogZm9yIGhpZ2ggYXZhaWxhYmlsaXR5XG4gICAgICBzdG9yYWdlRW5jcnlwdGVkOiB0cnVlLCAvLyBFbmFibGUgZW5jcnlwdGlvbiBhdCByZXN0XG4gICAgICBzdG9yYWdlRW5jcnlwdGlvbktleTogdW5kZWZpbmVkLCAvLyBVc2UgZGVmYXVsdCBBV1MgbWFuYWdlZCBrZXlcbiAgICAgIGJhY2t1cFJldGVudGlvbjogY2RrLkR1cmF0aW9uLmRheXMoNyksXG4gICAgICBkZWxldGlvblByb3RlY3Rpb246IGZhbHNlLCAvLyBTZXQgdG8gdHJ1ZSBmb3IgcHJvZHVjdGlvblxuICAgICAgZGVsZXRlQXV0b21hdGVkQmFja3VwczogZmFsc2UsXG4gICAgICBkYXRhYmFzZU5hbWU6ICdkZXZkYicsXG4gICAgICBhbGxvY2F0ZWRTdG9yYWdlOiAyMCxcbiAgICAgIHN0b3JhZ2VUeXBlOiByZHMuU3RvcmFnZVR5cGUuR1AzLFxuICAgICAgZW5hYmxlUGVyZm9ybWFuY2VJbnNpZ2h0czogdHJ1ZSxcbiAgICAgIHBlcmZvcm1hbmNlSW5zaWdodFJldGVudGlvbjogcmRzLlBlcmZvcm1hbmNlSW5zaWdodFJldGVudGlvbi5ERUZBVUxULFxuICAgIH0pO1xuXG4gICAgLy8gVGFnIGRhdGFiYXNlIHJlc291cmNlc1xuICAgIGNkay5UYWdzLm9mKHRoaXMuZGF0YWJhc2UpLmFkZChcbiAgICAgICdOYW1lJyxcbiAgICAgIGByZHMtcG9zdGdyZXMtJHtlbnZpcm9ubWVudFN1ZmZpeH0tJHtyZWdpb259YFxuICAgICk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhYmFzZSkuYWRkKCdQdXJwb3NlJywgJ0RldkRhdGFiYXNlJyk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhYmFzZSkuYWRkKCdFbnZpcm9ubWVudCcsIGVudmlyb25tZW50U3VmZml4KTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFiYXNlKS5hZGQoJ1JlZ2lvbicsIHJlZ2lvbik7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhYmFzZSkuYWRkKCdFbmdpbmUnLCAnUG9zdGdyZVNRTCcpO1xuXG4gICAgY2RrLlRhZ3Mub2YodGhpcy5zZWNyZXQpLmFkZChcbiAgICAgICdOYW1lJyxcbiAgICAgIGBkYi1zZWNyZXQtJHtlbnZpcm9ubWVudFN1ZmZpeH0tJHtyZWdpb259YFxuICAgICk7XG4gICAgY2RrLlRhZ3Mub2YodGhpcy5zZWNyZXQpLmFkZCgnUHVycG9zZScsICdEYXRhYmFzZUNyZWRlbnRpYWxzJyk7XG5cbiAgICBjZGsuVGFncy5vZihzdWJuZXRHcm91cCkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYGRiLXN1Ym5ldC1ncm91cC0ke2Vudmlyb25tZW50U3VmZml4fS0ke3JlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZihwYXJhbWV0ZXJHcm91cCkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYGRiLXBhcmFtLWdyb3VwLSR7ZW52aXJvbm1lbnRTdWZmaXh9LSR7cmVnaW9ufWBcbiAgICApO1xuICB9XG59XG4iXX0=