import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  dataKey: kms.IKey;
  appSecurityGroup: ec2.ISecurityGroup;
  appInstanceRole?: iam.IRole;
}

export class DatabaseStack extends cdk.Stack {
  public readonly dbInstance: rds.DatabaseInstance;
  public readonly appInstanceRole: iam.Role;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Create IAM role for app instances here
    this.appInstanceRole = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'App EC2 role',
    });

    // Use shared resources from CoreStack
    const dbSg = new ec2.SecurityGroup(this, 'DbSg', {
      vpc: props.vpc,
      allowAllOutbound: true,
    });
    dbSg.addIngressRule(
      props.appSecurityGroup,
      ec2.Port.tcp(5432),
      'App to DB'
    );

    const dbCredentials = rds.Credentials.fromGeneratedSecret('postgres'); // in Secrets Manager

    this.dbInstance = new rds.DatabaseInstance(this, 'Db', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc: props.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSg],
      credentials: dbCredentials,
      allocatedStorage: 100,
      multiAz: true,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MEDIUM
      ),
      storageEncrypted: true,
      storageEncryptionKey: props.dataKey,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      deletionProtection: true,
      iamAuthentication: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      performanceInsightEncryptionKey: props.dataKey,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant read access to secret and connect permission to appInstanceRole
    const secret = this.dbInstance.secret as secretsmanager.ISecret;
    if (secret && this.appInstanceRole) {
      secret.grantRead(this.appInstanceRole);
      this.dbInstance.grantConnect(this.appInstanceRole, 'postgres');
    }

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: this.dbInstance.instanceEndpoint.hostname,
    });
  }
}
