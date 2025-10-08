import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

interface SecurityStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
}

export class SecurityStack extends cdk.Stack {
  public readonly kmsKey: kms.Key;
  public readonly appRole: iam.Role;
  public readonly securityGroups: {
    albSg: ec2.SecurityGroup;
    ec2Sg: ec2.SecurityGroup;
    efsSg: ec2.SecurityGroup;
    dbSg: ec2.SecurityGroup;
  };

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // Create a KMS key for data encryption
    this.kmsKey = new kms.Key(this, 'DataEncryptionKey', {
      enableKeyRotation: true,
      description: 'KMS key for encrypting data at rest in EFS and RDS',
      alias: `multi-region-app-key-${props?.env?.region}`,
    });

    // Create an IAM role for the application
    this.appRole = new iam.Role(this, 'AppRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for the application EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ), // For SSM Session Manager
      ],
    });

    // Grant the app role permission to use the KMS key
    this.kmsKey.grantEncryptDecrypt(this.appRole);

    // Create security groups
    this.securityGroups = {
      albSg: new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for Application Load Balancers',
        allowAllOutbound: true,
      }),
      ec2Sg: new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for EC2 instances',
        allowAllOutbound: true,
      }),
      efsSg: new ec2.SecurityGroup(this, 'EfsSecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for EFS file systems',
        allowAllOutbound: false,
      }),
      dbSg: new ec2.SecurityGroup(this, 'DbSecurityGroup', {
        vpc: props.vpc,
        description: 'Security group for RDS instances',
        allowAllOutbound: false,
      }),
    };

    // The actual security group rules will be added in the compute stack
    // once we have the VPC properly created
  }
}
