import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface SecurityStackProps extends cdk.StackProps {
  vpc: ec2.Vpc;
  trustedIpRanges: string[];
}

export class SecurityStack extends cdk.Stack {
  public readonly ec2SecurityGroup: ec2.SecurityGroup;
  public readonly rdsSecurityGroup: ec2.SecurityGroup;
  public readonly lambdaSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;
  public readonly lambdaRole: iam.Role;
  public readonly kmsKey: kms.Key;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    // KMS Key for encryption
    this.kmsKey = new kms.Key(this, 'SecureKMSKey', {
      description: 'KMS Key for encrypting resources',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
        ],
      }),
    });

    // Security Group for EC2 instances
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: false,
    });

    // Allow inbound traffic only from trusted IP ranges
    props.trustedIpRanges.forEach((cidr, index) => {
      this.ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(22),
        `SSH access from trusted range ${index + 1}`
      );
      this.ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(80),
        `HTTP access from trusted range ${index + 1}`
      );
      this.ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(cidr),
        ec2.Port.tcp(443),
        `HTTPS access from trusted range ${index + 1}`
      );
    });

    // Allow outbound HTTPS for updates and patches
    this.ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound'
    );

    // Security Group for RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS instances',
      allowAllOutbound: false,
    });

    // Allow database access only from EC2 security group
    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2'
    );

    // Security Group for Lambda functions
    this.lambdaSecurityGroup = new ec2.SecurityGroup(
      this,
      'LambdaSecurityGroup',
      {
        vpc: props.vpc,
        description: 'Security group for Lambda functions',
        allowAllOutbound: false,
      }
    );

    // Allow Lambda to access RDS
    this.lambdaSecurityGroup.addEgressRule(
      this.rdsSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access to RDS'
    );

    // IAM Role for EC2 instances with least privilege
    this.ec2Role = new iam.Role(this, 'EC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: ['arn:aws:logs:*:*:*'],
            }),
          ],
        }),
      },
    });

    // IAM Role for Lambda functions with least privilege
    this.lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Lambda functions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
      inlinePolicies: {
        RDSAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['rds-db:connect'],
              resources: ['*'],
            }),
          ],
        }),
      },
    });

    // Output security group IDs
    new cdk.CfnOutput(this, 'EC2SecurityGroupId', {
      value: this.ec2SecurityGroup.securityGroupId,
      description: 'EC2 Security Group ID',
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID',
    });
  }
}
