import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface ApplicationConstructProps {
  vpc: ec2.Vpc;
  assetBucket: s3.Bucket;
  databaseSecurityGroup: ec2.SecurityGroup;
  instanceSize: string;
  environmentSuffix: string;
}

export class ApplicationConstruct extends Construct {
  public readonly instance: ec2.Instance;
  public readonly securityGroup: ec2.SecurityGroup;
  public readonly role: iam.Role;

  constructor(scope: Construct, id: string, props: ApplicationConstructProps) {
    super(scope, id);

    const { vpc, assetBucket, databaseSecurityGroup, instanceSize, environmentSuffix } = props;

    // Convert string to InstanceSize enum
    const ec2InstanceSize = (ec2.InstanceSize as any)[instanceSize] || ec2.InstanceSize.MICRO;

    // --- Application Security Group ---
    this.securityGroup = new ec2.SecurityGroup(this, 'AppSG', {
      vpc,
      description: 'Security group for the application instances',
    });

    // --- Cross-Stack Dependencies ---
    // Allow application tier to connect to database
    databaseSecurityGroup.addIngressRule(
      this.securityGroup,
      ec2.Port.tcp(3306),
      'Allow traffic from application instances'
    );

    // --- IAM Role for Application ---
    this.role = new iam.Role(this, 'AppInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for application EC2 instances',
    });

    // Grant least privilege access to S3 bucket
    assetBucket.grantReadWrite(this.role);

    // --- EC2 Application Instance ---
    this.instance = new ec2.Instance(this, 'AppInstance', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2InstanceSize
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      securityGroup: this.securityGroup,
      role: this.role,
    });

    // Apply comprehensive tagging
    cdk.Tags.of(this).add('Environment', environmentSuffix);
    cdk.Tags.of(this).add('Component', 'Application');
  }
}