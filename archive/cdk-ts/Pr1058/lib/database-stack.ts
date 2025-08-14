import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  encryptionKey: kms.Key;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly dbSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Security group for RDS - only allows access from VPC
    this.dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `secure-${props.environmentSuffix}-rds-sg`,
      {
        vpc: props.vpc,
        description: 'Security group for RDS database',
        securityGroupName: `secure-${props.environmentSuffix}-rds-sg`,
      }
    );

    // Only allow MySQL access from VPC CIDR
    this.dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(3306),
      'MySQL access from VPC'
    );

    // Create subnet group for RDS in isolated subnets
    const subnetGroup = new rds.SubnetGroup(
      this,
      `secure-${props.environmentSuffix}-subnet-group`,
      {
        vpc: props.vpc,
        description: 'Subnet group for RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        subnetGroupName: `secure-${props.environmentSuffix}-subnet-group`,
      }
    );

    // RDS instance with encryption at rest
    this.database = new rds.DatabaseInstance(
      this,
      `secure-${props.environmentSuffix}-database`,
      {
        instanceIdentifier: `secure-${props.environmentSuffix}-database`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc: props.vpc,
        subnetGroup: subnetGroup,
        securityGroups: [this.dbSecurityGroup],
        storageEncrypted: true,
        storageEncryptionKey: props.encryptionKey,
        multiAz: false, // Set to true for production
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        autoMinorVersionUpgrade: true,
        monitoringInterval: cdk.Duration.seconds(60),
        // Performance Insights not supported for t3.micro instances
        enablePerformanceInsights: false,
        credentials: rds.Credentials.fromGeneratedSecret('admin', {
          secretName: `secure-${props.environmentSuffix}-db-credentials`,
          encryptionKey: props.encryptionKey,
        }),
      }
    );

    // Apply tags
    cdk.Tags.of(this).add('Environment', props.environmentSuffix);
    cdk.Tags.of(this).add('ProjectName', 'secure-infrastructure');
    cdk.Tags.of(this).add('CostCenter', 'security-team');
  }
}
