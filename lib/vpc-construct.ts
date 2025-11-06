import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import { EnvironmentConfig } from './environment-config';

export interface VpcConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
}

export class VpcConstruct extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props: VpcConstructProps) {
    super(scope, id);

    // Create VPC with public and private subnets
    this.vpc = new ec2.Vpc(this, `Vpc-${props.environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr(props.config.vpcCidr),
      maxAzs: props.config.maxAzs,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      `LambdaSG-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: true,
      }
    );

    // Security group for RDS database
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSG-${props.environmentSuffix}`,
      {
        vpc: this.vpc,
        description: 'Security group for RDS database',
        allowAllOutbound: false,
      }
    );

    // Allow Lambda to connect to database
    this.databaseSecurityGroup.addIngressRule(
      this.lambdaSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from Lambda'
    );

    cdk.Tags.of(this.vpc).add('Name', `vpc-${props.environmentSuffix}`);
  }
}
