import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { SecurityStack } from './security-stack';

interface DatabaseStackProps extends cdk.StackProps {
  securityStack: SecurityStack;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const { securityStack } = props;

    // RDS Subnet Group
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      description: 'Subnet group for RDS database',
      vpc: securityStack.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Parameter Group for enhanced security
    const parameterGroup = new rds.ParameterGroup(
      this,
      'DatabaseParameterGroup',
      {
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        parameters: {
          innodb_file_per_table: '1',
          innodb_flush_log_at_trx_commit: '1',
          log_bin_trust_function_creators: '1',
        },
      }
    );

    // RDS Database with encryption and automatic backups
    this.database = new rds.DatabaseInstance(this, 'Database', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.SMALL
      ),
      vpc: securityStack.vpc,
      credentials: rds.Credentials.fromSecret(securityStack.dbSecret),
      multiAz: true,
      subnetGroup: subnetGroup,
      securityGroups: [securityStack.dbSecurityGroup],
      parameterGroup: parameterGroup,
      storageEncrypted: true,
      storageEncryptionKey: securityStack.kmsKey,
      backupRetention: cdk.Duration.days(30),
      deleteAutomatedBackups: false,
      deletionProtection: false, // Set to false for testing environments
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: securityStack.kmsKey,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      // cloudwatchLogsExports: ['error', 'general', 'slowquery'],
    });

    // // Output the database endpoint
    // new cdk.CfnOutput(this, 'DatabaseEndpoint', {
    //   value: this.database.instanceEndpoint.hostname,
    //   description: 'RDS Database Endpoint',
    // });
  }
}
