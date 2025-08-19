import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class DatabaseStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const { vpc, kmsKey, dbSecurityGroup } = props;

    // Database Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, `DBSubnetGroup${environmentSuffix}`, {
      vpc,
      description: `Subnet group for RDS database - ${environmentSuffix}`,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      subnetGroupName: `db-subnet-group-${environmentSuffix}`,
    });

    // Multi-AZ RDS PostgreSQL Database
    this.database = new rds.DatabaseInstance(this, `WebAppDatabase${environmentSuffix}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      multiAz: true, // High availability across AZs
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      databaseName: 'webapp',
      credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
        secretName: `webapp-db-credentials-${environmentSuffix}`,
      }),
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      cloudwatchLogsExports: ['postgresql'],
      instanceIdentifier: `webapp-db-${environmentSuffix}`,
    });

    // Apply environment tags
    cdk.Tags.of(this.database).add('Environment', environmentSuffix);
    cdk.Tags.of(this.database).add('Service', 'WebApp');
    cdk.Tags.of(dbSubnetGroup).add('Environment', environmentSuffix);

    // Outputs
    new cdk.CfnOutput(this, `DatabaseEndpoint${environmentSuffix}`, {
      value: this.database.instanceEndpoint.hostname,
      exportName: `WebAppDatabaseEndpoint${environmentSuffix}`,
      description: 'RDS Database endpoint hostname',
    });

    new cdk.CfnOutput(this, `DatabasePort${environmentSuffix}`, {
      value: this.database.instanceEndpoint.port.toString(),
      exportName: `WebAppDatabasePort${environmentSuffix}`,
      description: 'RDS Database port',
    });

    new cdk.CfnOutput(this, `DatabaseSecretArn${environmentSuffix}`, {
      value: this.database.secret?.secretArn || 'No secret created',
      exportName: `WebAppDatabaseSecretArn${environmentSuffix}`,
      description: 'RDS Database credentials secret ARN',
    });

    new cdk.CfnOutput(this, `DatabaseIdentifier${environmentSuffix}`, {
      value: this.database.instanceIdentifier,
      exportName: `WebAppDatabaseIdentifier${environmentSuffix}`,
      description: 'RDS Database instance identifier',
    });
  }
}