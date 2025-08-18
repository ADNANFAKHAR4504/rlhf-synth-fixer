import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  ec2SecurityGroup: ec2.ISecurityGroup;
  environmentSuffix?: string;
}

export class DatabaseStack extends cdk.Stack {
  public readonly rdsInstance: rds.DatabaseInstance;
  public readonly dbCredentials: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create database credentials secret
    this.dbCredentials = new secretsmanager.Secret(
      this,
      `DbCredentials-${environmentSuffix}`,
      {
        description: 'RDS PostgreSQL database credentials',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
        },
      }
    );

    // Security Group for RDS instance
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RdsSecurityGroup-${environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'Security group for RDS PostgreSQL instance',
        allowAllOutbound: false,
      }
    );

    // Allow inbound PostgreSQL access only from EC2 security group
    rdsSecurityGroup.addIngressRule(
      props.ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'PostgreSQL access from EC2'
    );

    // Create DB subnet group
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup-${environmentSuffix}`,
      {
        vpc: props.vpc,
        description: 'DB subnet group for RDS instance',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      }
    );

    // Create RDS PostgreSQL instance
    this.rdsInstance = new rds.DatabaseInstance(
      this,
      `PostgreSqlDatabase-${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_8,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc: props.vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],
        credentials: rds.Credentials.fromSecret(this.dbCredentials),
        databaseName: 'appdb',
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        deleteAutomatedBackups: true,
        storageEncrypted: true,
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
      }
    );

    // Note: Grant permissions are handled in the parent stack to avoid circular dependencies

    // Outputs
    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: this.rdsInstance.instanceEndpoint.hostname,
      description: 'RDS PostgreSQL Endpoint',
    });

    new cdk.CfnOutput(this, 'RdsPort', {
      value: this.rdsInstance.instanceEndpoint.port.toString(),
      description: 'RDS PostgreSQL Port',
    });

    new cdk.CfnOutput(this, 'DbCredentialsSecretArn', {
      value: this.dbCredentials.secretArn,
      description: 'Database Credentials Secret ARN',
    });
  }
}
