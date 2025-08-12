'use strict';
var __createBinding =
  (this && this.__createBinding) ||
  (Object.create
    ? function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        var desc = Object.getOwnPropertyDescriptor(m, k);
        if (
          !desc ||
          ('get' in desc ? !m.__esModule : desc.writable || desc.configurable)
        ) {
          desc = {
            enumerable: true,
            get: function () {
              return m[k];
            },
          };
        }
        Object.defineProperty(o, k2, desc);
      }
    : function (o, m, k, k2) {
        if (k2 === undefined) k2 = k;
        o[k2] = m[k];
      });
var __setModuleDefault =
  (this && this.__setModuleDefault) ||
  (Object.create
    ? function (o, v) {
        Object.defineProperty(o, 'default', { enumerable: true, value: v });
      }
    : function (o, v) {
        o['default'] = v;
      });
var __importStar =
  (this && this.__importStar) ||
  (function () {
    var ownKeys = function (o) {
      ownKeys =
        Object.getOwnPropertyNames ||
        function (o) {
          var ar = [];
          for (var k in o)
            if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
          return ar;
        };
      return ownKeys(o);
    };
    return function (mod) {
      if (mod && mod.__esModule) return mod;
      var result = {};
      if (mod != null)
        for (var k = ownKeys(mod), i = 0; i < k.length; i++)
          if (k[i] !== 'default') __createBinding(result, mod, k[i]);
      __setModuleDefault(result, mod);
      return result;
    };
  })();
Object.defineProperty(exports, '__esModule', { value: true });
exports.DatabaseTierConstruct = void 0;
const constructs_1 = require('constructs');
const rds = __importStar(require('aws-cdk-lib/aws-rds'));
const ec2 = __importStar(require('aws-cdk-lib/aws-ec2'));
const cdk = __importStar(require('aws-cdk-lib'));
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
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      'DatabaseSecurityGroup',
      {
        vpc,
        description:
          'Security group for RDS database - allows MySQL/Aurora access from application tier',
        allowAllOutbound: false, // Explicitly deny all outbound traffic
      }
    );
    // Create DB subnet group using isolated subnets for maximum security
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc,
      description: 'Subnet group for RDS database in isolated subnets',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });
    // Generate a secure random password for the database
    const databaseCredentials = rds.Credentials.fromGeneratedSecret('admin', {
      excludeCharacters: '"@/\\',
    });
    // Create RDS database instance with high availability configuration
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
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
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DefaultParameterGroup',
        'default.mysql8.0'
      ),
    });
    // Apply comprehensive tagging
    Object.entries(config.tags).forEach(([key, value]) => {
      cdk.Tags.of(this.database).add(key, value);
      cdk.Tags.of(this.databaseSecurityGroup).add(key, value);
    });
    cdk.Tags.of(this.database).add(
      'Name',
      `MultiRegionApp-Database-${config.region}`
    );
    cdk.Tags.of(this.databaseSecurityGroup).add(
      'Name',
      `MultiRegionApp-DB-SG-${config.region}`
    );
  }
  /**
   * Allow inbound connections from application tier security group
   * This method should be called after the application tier is created
   */
  allowConnectionsFrom(applicationSecurityGroup) {
    this.databaseSecurityGroup.addIngressRule(
      applicationSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from application tier'
    );
  }
}
exports.DatabaseTierConstruct = DatabaseTierConstruct;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGF0YWJhc2UtdGllci1jb25zdHJ1Y3QuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkYXRhYmFzZS10aWVyLWNvbnN0cnVjdC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7QUFBQSwyQ0FBdUM7QUFDdkMseURBQTJDO0FBQzNDLHlEQUEyQztBQUMzQyxpREFBbUM7QUFHbkM7OztHQUdHO0FBQ0gsTUFBYSxxQkFBc0IsU0FBUSxzQkFBUztJQUNsQyxRQUFRLENBQXVCO0lBQy9CLHFCQUFxQixDQUFvQjtJQUV6RCxZQUFZLEtBQWdCLEVBQUUsRUFBVSxFQUFFLEdBQVksRUFBRSxNQUFtQjtRQUN6RSxLQUFLLENBQUMsS0FBSyxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBRWpCLHlDQUF5QztRQUN6QyxnREFBZ0Q7UUFDaEQsSUFBSSxDQUFDLHFCQUFxQixHQUFHLElBQUksR0FBRyxDQUFDLGFBQWEsQ0FDaEQsSUFBSSxFQUNKLHVCQUF1QixFQUN2QjtZQUNFLEdBQUc7WUFDSCxXQUFXLEVBQ1Qsb0ZBQW9GO1lBQ3RGLGdCQUFnQixFQUFFLEtBQUssRUFBRSx1Q0FBdUM7U0FDakUsQ0FDRixDQUFDO1FBRUYscUVBQXFFO1FBQ3JFLE1BQU0sYUFBYSxHQUFHLElBQUksR0FBRyxDQUFDLFdBQVcsQ0FBQyxJQUFJLEVBQUUscUJBQXFCLEVBQUU7WUFDckUsR0FBRztZQUNILFdBQVcsRUFBRSxtREFBbUQ7WUFDaEUsVUFBVSxFQUFFO2dCQUNWLFVBQVUsRUFBRSxHQUFHLENBQUMsVUFBVSxDQUFDLGdCQUFnQjthQUM1QztTQUNGLENBQUMsQ0FBQztRQUVILHFEQUFxRDtRQUNyRCxNQUFNLG1CQUFtQixHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsbUJBQW1CLENBQUMsT0FBTyxFQUFFO1lBQ3ZFLGlCQUFpQixFQUFFLE9BQU87U0FDM0IsQ0FBQyxDQUFDO1FBRUgsb0VBQW9FO1FBQ3BFLElBQUks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Q0FDRjtBQTNHRCxzREEyR0MiLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBDb25zdHJ1Y3QgfSBmcm9tICdjb25zdHJ1Y3RzJztcbmltcG9ydCAqIGFzIHJkcyBmcm9tICdhd3MtY2RrLWxpYi9hd3MtcmRzJztcbmltcG9ydCAqIGFzIGVjMiBmcm9tICdhd3MtY2RrLWxpYi9hd3MtZWMyJztcbmltcG9ydCAqIGFzIGNkayBmcm9tICdhd3MtY2RrLWxpYic7XG5pbXBvcnQgeyBTdGFja0NvbmZpZyB9IGZyb20gJy4uL2ludGVyZmFjZXMvc3RhY2stY29uZmlnJztcblxuLyoqXG4gKiBEYXRhYmFzZSBUaWVyIENvbnN0cnVjdCB0aGF0IGNyZWF0ZXMgYSBoaWdobHkgYXZhaWxhYmxlIFJEUyBpbnN0YW5jZVxuICogd2l0aCBNdWx0aS1BWiBkZXBsb3ltZW50IGFuZCBhdXRvbWF0ZWQgYmFja3Vwc1xuICovXG5leHBvcnQgY2xhc3MgRGF0YWJhc2VUaWVyQ29uc3RydWN0IGV4dGVuZHMgQ29uc3RydWN0IHtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFiYXNlOiByZHMuRGF0YWJhc2VJbnN0YW5jZTtcbiAgcHVibGljIHJlYWRvbmx5IGRhdGFiYXNlU2VjdXJpdHlHcm91cDogZWMyLlNlY3VyaXR5R3JvdXA7XG5cbiAgY29uc3RydWN0b3Ioc2NvcGU6IENvbnN0cnVjdCwgaWQ6IHN0cmluZywgdnBjOiBlYzIuVnBjLCBjb25maWc6IFN0YWNrQ29uZmlnKSB7XG4gICAgc3VwZXIoc2NvcGUsIGlkKTtcblxuICAgIC8vIENyZWF0ZSBzZWN1cml0eSBncm91cCBmb3IgUkRTIGRhdGFiYXNlXG4gICAgLy8gVGhpcyBmb2xsb3dzIHRoZSBwcmluY2lwbGUgb2YgbGVhc3QgcHJpdmlsZWdlXG4gICAgdGhpcy5kYXRhYmFzZVNlY3VyaXR5R3JvdXAgPSBuZXcgZWMyLlNlY3VyaXR5R3JvdXAoXG4gICAgICB0aGlzLFxuICAgICAgJ0RhdGFiYXNlU2VjdXJpdHlHcm91cCcsXG4gICAgICB7XG4gICAgICAgIHZwYyxcbiAgICAgICAgZGVzY3JpcHRpb246XG4gICAgICAgICAgJ1NlY3VyaXR5IGdyb3VwIGZvciBSRFMgZGF0YWJhc2UgLSBhbGxvd3MgTXlTUUwvQXVyb3JhIGFjY2VzcyBmcm9tIGFwcGxpY2F0aW9uIHRpZXInLFxuICAgICAgICBhbGxvd0FsbE91dGJvdW5kOiBmYWxzZSwgLy8gRXhwbGljaXRseSBkZW55IGFsbCBvdXRib3VuZCB0cmFmZmljXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIENyZWF0ZSBEQiBzdWJuZXQgZ3JvdXAgdXNpbmcgaXNvbGF0ZWQgc3VibmV0cyBmb3IgbWF4aW11bSBzZWN1cml0eVxuICAgIGNvbnN0IGRiU3VibmV0R3JvdXAgPSBuZXcgcmRzLlN1Ym5ldEdyb3VwKHRoaXMsICdEYXRhYmFzZVN1Ym5ldEdyb3VwJywge1xuICAgICAgdnBjLFxuICAgICAgZGVzY3JpcHRpb246ICdTdWJuZXQgZ3JvdXAgZm9yIFJEUyBkYXRhYmFzZSBpbiBpc29sYXRlZCBzdWJuZXRzJyxcbiAgICAgIHZwY1N1Ym5ldHM6IHtcbiAgICAgICAgc3VibmV0VHlwZTogZWMyLlN1Ym5ldFR5cGUuUFJJVkFURV9JU09MQVRFRCxcbiAgICAgIH0sXG4gICAgfSk7XG5cbiAgICAvLyBHZW5lcmF0ZSBhIHNlY3VyZSByYW5kb20gcGFzc3dvcmQgZm9yIHRoZSBkYXRhYmFzZVxuICAgIGNvbnN0IGRhdGFiYXNlQ3JlZGVudGlhbHMgPSByZHMuQ3JlZGVudGlhbHMuZnJvbUdlbmVyYXRlZFNlY3JldCgnYWRtaW4nLCB7XG4gICAgICBleGNsdWRlQ2hhcmFjdGVyczogJ1wiQC9cXFxcJyxcbiAgICB9KTtcblxuICAgIC8vIENyZWF0ZSBSRFMgZGF0YWJhc2UgaW5zdGFuY2Ugd2l0aCBoaWdoIGF2YWlsYWJpbGl0eSBjb25maWd1cmF0aW9uXG4gICAgdGhpcy5kYXRhYmFzZSA9IG5ldyByZHMuRGF0YWJhc2VJbnN0YW5jZSh0aGlzLCAnRGF0YWJhc2UnLCB7XG4gICAgICBlbmdpbmU6IHJkcy5EYXRhYmFzZUluc3RhbmNlRW5naW5lLm15c3FsKHtcbiAgICAgICAgdmVyc2lvbjogcmRzLk15c3FsRW5naW5lVmVyc2lvbi5WRVJfOF8wXzM1LFxuICAgICAgfSksXG4gICAgICBpbnN0YW5jZVR5cGU6IGVjMi5JbnN0YW5jZVR5cGUub2YoXG4gICAgICAgIGVjMi5JbnN0YW5jZUNsYXNzLkJVUlNUQUJMRTMsXG4gICAgICAgIGVjMi5JbnN0YW5jZVNpemUuTUlDUk9cbiAgICAgICksXG4gICAgICBjcmVkZW50aWFsczogZGF0YWJhc2VDcmVkZW50aWFscyxcblxuICAgICAgLy8gSGlnaCBhdmFpbGFiaWxpdHkgYW5kIGJhY2t1cCBjb25maWd1cmF0aW9uXG4gICAgICBtdWx0aUF6OiBjb25maWcuZGF0YWJhc2UubXVsdGlBeixcbiAgICAgIGFsbG9jYXRlZFN0b3JhZ2U6IGNvbmZpZy5kYXRhYmFzZS5hbGxvY2F0ZWRTdG9yYWdlLFxuICAgICAgc3RvcmFnZVR5cGU6IHJkcy5TdG9yYWdlVHlwZS5HUDIsXG4gICAgICBzdG9yYWdlRW5jcnlwdGVkOiBjb25maWcuZGF0YWJhc2Uuc3RvcmFnZUVuY3J5cHRlZCxcblxuICAgICAgLy8gQmFja3VwIGFuZCBtYWludGVuYW5jZSBjb25maWd1cmF0aW9uXG4gICAgICBiYWNrdXBSZXRlbnRpb246IGNkay5EdXJhdGlvbi5kYXlzKGNvbmZpZy5kYXRhYmFzZS5iYWNrdXBSZXRlbnRpb24pLFxuICAgICAgZGVsZXRlQXV0b21hdGVkQmFja3VwczogZmFsc2UsXG4gICAgICBkZWxldGlvblByb3RlY3Rpb246IGNvbmZpZy5kYXRhYmFzZS5kZWxldGlvblByb3RlY3Rpb24sXG5cbiAgICAgIC8vIE5ldHdvcmsgY29uZmlndXJhdGlvblxuICAgICAgdnBjLFxuICAgICAgc3VibmV0R3JvdXA6IGRiU3VibmV0R3JvdXAsXG4gICAgICBzZWN1cml0eUdyb3VwczogW3RoaXMuZGF0YWJhc2VTZWN1cml0eUdyb3VwXSxcblxuICAgICAgLy8gTW9uaXRvcmluZyBhbmQgbG9nZ2luZ1xuICAgICAgbW9uaXRvcmluZ0ludGVydmFsOiBjZGsuRHVyYXRpb24uc2Vjb25kcyg2MCksXG4gICAgICBlbmFibGVQZXJmb3JtYW5jZUluc2lnaHRzOiBjb25maWcuZGF0YWJhc2UucGVyZm9ybWFuY2VJbnNpZ2h0cyxcbiAgICAgIHBlcmZvcm1hbmNlSW5zaWdodFJldGVudGlvbjogcmRzLlBlcmZvcm1hbmNlSW5zaWdodFJldGVudGlvbi5ERUZBVUxULFxuXG4gICAgICAvLyBNYWludGVuYW5jZSB3aW5kb3cgKGR1cmluZyBsb3ctdHJhZmZpYyBob3VycylcbiAgICAgIHByZWZlcnJlZE1haW50ZW5hbmNlV2luZG93OiAnc3VuOjAzOjAwLXN1bjowNDowMCcsXG4gICAgICBwcmVmZXJyZWRCYWNrdXBXaW5kb3c6ICcwMjowMC0wMzowMCcsXG5cbiAgICAgIC8vIFBhcmFtZXRlciBncm91cCBmb3Igb3B0aW1pemF0aW9uXG4gICAgICBwYXJhbWV0ZXJHcm91cDogcmRzLlBhcmFtZXRlckdyb3VwLmZyb21QYXJhbWV0ZXJHcm91cE5hbWUoXG4gICAgICAgIHRoaXMsXG4gICAgICAgICdEZWZhdWx0UGFyYW1ldGVyR3JvdXAnLFxuICAgICAgICAnZGVmYXVsdC5teXNxbDguMCdcbiAgICAgICksXG4gICAgfSk7XG5cbiAgICAvLyBBcHBseSBjb21wcmVoZW5zaXZlIHRhZ2dpbmdcbiAgICBPYmplY3QuZW50cmllcyhjb25maWcudGFncykuZm9yRWFjaCgoW2tleSwgdmFsdWVdKSA9PiB7XG4gICAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFiYXNlKS5hZGQoa2V5LCB2YWx1ZSk7XG4gICAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFiYXNlU2VjdXJpdHlHcm91cCkuYWRkKGtleSwgdmFsdWUpO1xuICAgIH0pO1xuXG4gICAgY2RrLlRhZ3Mub2YodGhpcy5kYXRhYmFzZSkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYE11bHRpUmVnaW9uQXBwLURhdGFiYXNlLSR7Y29uZmlnLnJlZ2lvbn1gXG4gICAgKTtcbiAgICBjZGsuVGFncy5vZih0aGlzLmRhdGFiYXNlU2VjdXJpdHlHcm91cCkuYWRkKFxuICAgICAgJ05hbWUnLFxuICAgICAgYE11bHRpUmVnaW9uQXBwLURCLVNHLSR7Y29uZmlnLnJlZ2lvbn1gXG4gICAgKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvdyBpbmJvdW5kIGNvbm5lY3Rpb25zIGZyb20gYXBwbGljYXRpb24gdGllciBzZWN1cml0eSBncm91cFxuICAgKiBUaGlzIG1ldGhvZCBzaG91bGQgYmUgY2FsbGVkIGFmdGVyIHRoZSBhcHBsaWNhdGlvbiB0aWVyIGlzIGNyZWF0ZWRcbiAgICovXG4gIHB1YmxpYyBhbGxvd0Nvbm5lY3Rpb25zRnJvbShcbiAgICBhcHBsaWNhdGlvblNlY3VyaXR5R3JvdXA6IGVjMi5TZWN1cml0eUdyb3VwXG4gICk6IHZvaWQge1xuICAgIHRoaXMuZGF0YWJhc2VTZWN1cml0eUdyb3VwLmFkZEluZ3Jlc3NSdWxlKFxuICAgICAgYXBwbGljYXRpb25TZWN1cml0eUdyb3VwLFxuICAgICAgZWMyLlBvcnQudGNwKDMzMDYpLFxuICAgICAgJ0FsbG93IE15U1FMIGFjY2VzcyBmcm9tIGFwcGxpY2F0aW9uIHRpZXInXG4gICAgKTtcbiAgfVxufVxuIl19
