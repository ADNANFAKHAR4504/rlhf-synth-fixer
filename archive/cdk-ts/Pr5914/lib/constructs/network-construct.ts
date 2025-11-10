import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface NetworkConstructProps {
  environmentSuffix: string;
}

export class NetworkConstruct extends Construct {
  public readonly vpc: ec2.IVpc;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly applicationSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: NetworkConstructProps) {
    super(scope, id);

    // Create VPC with private subnets for the database
    this.vpc = new ec2.Vpc(this, `migration-vpc-${props.environmentSuffix}`, {
      vpcName: `migration-vpc-${props.environmentSuffix}`,
      maxAzs: 3,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create security group for the application tier
    this.applicationSecurityGroup = new ec2.SecurityGroup(
      this,
      `app-sg-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `app-sg-${props.environmentSuffix}`,
        description: 'Security group for application tier',
        allowAllOutbound: true,
      }
    );

    // Create security group for the database
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `database-sg-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        securityGroupName: `database-sg-${props.environmentSuffix}`,
        description: 'Security group for Aurora PostgreSQL database',
        allowAllOutbound: true,
      }
    );

    // Allow PostgreSQL traffic from application security group only
    this.databaseSecurityGroup.addIngressRule(
      this.applicationSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application tier'
    );

    // Tag resources
    cdk.Tags.of(this.vpc).add('Environment', 'production');
    cdk.Tags.of(this.vpc).add('MigrationProject', '2024Q1');
    cdk.Tags.of(this.databaseSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(this.databaseSecurityGroup).add('MigrationProject', '2024Q1');
    cdk.Tags.of(this.applicationSecurityGroup).add('Environment', 'production');
    cdk.Tags.of(this.applicationSecurityGroup).add(
      'MigrationProject',
      '2024Q1'
    );
  }
}
