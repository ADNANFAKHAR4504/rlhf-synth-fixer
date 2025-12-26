import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

interface DatabaseConstructProps {
  environmentSuffix: string;
  commonTags: Record<string, string>;
  vpc: ec2.Vpc;
  dbSecurityGroup: ec2.SecurityGroup;
}

export class DatabaseConstruct extends Construct {
  public readonly database: rds.DatabaseCluster;

  constructor(scope: Construct, id: string, props: DatabaseConstructProps) {
    super(scope, id);

    // RDS Subnet Group for isolated subnets
    const subnetGroup = new rds.SubnetGroup(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-db-subnet-group`,
      {
        description: 'Subnet group for RDS database',
        vpc: props.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      }
    );

    // Aurora PostgreSQL cluster with encryption
    this.database = new rds.DatabaseCluster(
      this,
      `${props.commonTags.ProjectName}-${props.environmentSuffix}-database`,
      {
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_14_9,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('dbadmin', {
          secretName: `${props.commonTags.ProjectName}/${props.environmentSuffix}/database/main-credentials`,
        }),
        instanceProps: {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MEDIUM
          ),
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
          vpc: props.vpc,
          securityGroups: [props.dbSecurityGroup],
        },
        instances: 2,
        subnetGroup,
        storageEncrypted: true,
        storageEncryptionKey: new cdk.aws_kms.Key(
          this,
          `${props.commonTags.ProjectName}-${props.environmentSuffix}-db-key`,
          {
            description: 'KMS key for RDS encryption',
            enableKeyRotation: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
          }
        ),
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'Sun:04:00-Sun:05:00',
        deletionProtection: false, // Set to false to allow cleanup
        cloudwatchLogsExports: ['postgresql'],
      }
    );

    // Apply tags
    Object.entries(props.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this.database).add(key, value);
    });
  }
}
