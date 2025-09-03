import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as ssm from 'aws-cdk-lib/aws-ssm';
import { Construct } from 'constructs';

export interface DatabaseConstructProps {
  environment: string;
  vpc: ec2.Vpc;
  securityGroup: ec2.SecurityGroup;
  alertTopic: sns.Topic;
  databasePort?: number;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    const {
      environment,
      vpc,
      securityGroup,
      alertTopic,
      // databasePort = 3306, // Unused variable - removed to fix linting
    } = props;

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DBSubnetGroup-${environment}`,
      {
        vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Create parameter group for encryption and security
    const parameterGroup = new rds.ParameterGroup(
      this,
      `DBParameterGroup-${environment}`,
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        parameters: {
          slow_query_log: '1',
          general_log: '1',
          log_queries_not_using_indexes: '1',
          // Explicitly enforce SSL/TLS connections
          require_secure_transport: 'ON',
        },
      }
    );

    // Generate random password and store in SSM Parameter Store
    const dbPassword = new rds.DatabaseSecret(this, `DBSecret-${environment}`, {
      username: 'admin',
    });

    // Create RDS instance with encryption and automated backups
    this.database = new rds.DatabaseInstance(this, `Database-${environment}`, {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [securityGroup],
      credentials: rds.Credentials.fromSecret(dbPassword),
      parameterGroup,

      // Security settings
      storageEncrypted: true,
      storageEncryptionKey: undefined, // Use AWS managed key
      deletionProtection: environment === 'prod',
      // For non-production environments, allow easier cleanup
      removalPolicy:
        environment === 'prod'
          ? cdk.RemovalPolicy.RETAIN
          : cdk.RemovalPolicy.DESTROY,

      // SSL/TLS enforcement - Explicitly configured in parameter group
      // require_secure_transport: 'ON' ensures all connections use SSL/TLS
      // MySQL 8.0 uses AWS managed certificates for SSL connections

      // Backup settings
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,

      // Monitoring
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: false,

      // Multi-AZ for production
      multiAz: environment === 'prod',

      // Maintenance
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,

      databaseName: 'appdb',
      // port: databasePort, // Use the configurable port - commented out to avoid replacement
    });

    // CloudWatch Alarms for database monitoring
    const cpuAlarm = new cloudwatch.Alarm(this, `DBCPUAlarm-${environment}`, {
      metric: this.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cpuAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    const connectionAlarm = new cloudwatch.Alarm(
      this,
      `DBConnectionAlarm-${environment}`,
      {
        metric: this.database.metricDatabaseConnections(),
        threshold: 80,
        evaluationPeriods: 2,
        treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      }
    );

    connectionAlarm.addAlarmAction(new actions.SnsAction(alertTopic));

    // Store database endpoint in SSM Parameter Store
    new ssm.StringParameter(this, `DBEndpointParameter-${environment}`, {
      parameterName: `/app/${environment}/database/endpoint`,
      stringValue: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    // Tag database
    cdk.Tags.of(this.database).add('Name', `Database-${environment}`);
    cdk.Tags.of(this.database).add('Component', 'Database');
    cdk.Tags.of(this.database).add('Environment', environment);
  }
}
