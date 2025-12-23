import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface SecurityConstructProps {
  environmentSuffix: string;
  region: string;
  vpc: ec2.Vpc;
}

export class SecurityConstruct extends Construct {
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { environmentSuffix, region, vpc } = props;

    // Create security group for EC2 instances
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow SSH access (port 22)
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // Allow HTTP access (port 80)
    this.ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP access'
    );

    // Create security group for RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow PostgreSQL access from EC2 security group
    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2'
    );

    // Create IAM role for EC2 instances
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances to access S3',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add S3 access policy for the primary region bucket
    if (region === 'us-east-1') {
      this.ec2Role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:GetObject',
            's3:PutObject',
            's3:DeleteObject',
            's3:ListBucket',
            's3:GetObjectVersion',
          ],
          resources: [
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*`,
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*/*`,
          ],
        })
      );
    }

    // Cross-region S3 access for us-west-1 instances
    if (region === 'us-west-1') {
      this.ec2Role.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['s3:GetObject', 's3:ListBucket', 's3:GetObjectVersion'],
          resources: [
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*`,
            `arn:aws:s3:::multiregion-dev-bucket-${environmentSuffix}-*/*`,
          ],
        })
      );
    }

    // Tag security resources
    cdk.Tags.of(this.ec2SecurityGroup).add(
      'Name',
      `ec2-sg-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.ec2SecurityGroup).add('Purpose', 'EC2Security');
    cdk.Tags.of(this.rdsSecurityGroup).add(
      'Name',
      `rds-sg-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.rdsSecurityGroup).add('Purpose', 'RDSSecurity');
    cdk.Tags.of(this.ec2Role).add(
      'Name',
      `ec2-role-${environmentSuffix}-${region}`
    );
    cdk.Tags.of(this.ec2Role).add('Purpose', 'EC2IAMRole');
  }
}
