import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SecurityConstructProps {
  environment: string;
  vpc: ec2.Vpc;
}

export class SecurityConstruct extends Construct {
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly appSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;
  public readonly rdsRole: iam.Role;
  public readonly adminRole: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    const { environment, vpc } = props;

    // Web tier security group (ALB/CloudFront)
    this.webSecurityGroup = new ec2.SecurityGroup(
      this,
      `WebSecurityGroup-${environment}`,
      {
        vpc,
        description: 'Security group for web tier',
        allowAllOutbound: false,
      }
    );

    // Only allow HTTPS inbound
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS inbound'
    );

    // Allow HTTP to HTTPS redirect
    this.webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP for redirect to HTTPS'
    );

    // Application tier security group
    this.appSecurityGroup = new ec2.SecurityGroup(
      this,
      `AppSecurityGroup-${environment}`,
      {
        vpc,
        description: 'Security group for application tier',
        allowAllOutbound: false,
      }
    );

    // Allow traffic from web tier
    this.appSecurityGroup.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow traffic from web tier'
    );

    // Allow HTTPS outbound to specific AWS services and approved APIs
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound to AWS services and approved APIs'
    );

    // Allow DNS resolution
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS resolution'
    );

    // Allow NTP for time synchronization
    this.appSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(123),
      'Allow NTP for time synchronization'
    );

    // Database security group
    this.databaseSecurityGroup = new ec2.SecurityGroup(
      this,
      `DatabaseSecurityGroup-${environment}`,
      {
        vpc,
        description: 'Security group for database tier',
        allowAllOutbound: false,
      }
    );

    // Only allow access from application tier
    this.databaseSecurityGroup.addIngressRule(
      this.appSecurityGroup,
      ec2.Port.tcp(3306), // Default MySQL port, can be parameterized
      'Allow MySQL access from app tier'
    );

    // EC2 IAM Role with least privilege
    this.ec2Role = new iam.Role(this, `EC2Role-${environment}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add CloudWatch permissions
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:PutLogEvents',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
        ],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'aws:RequestedRegion': cdk.Stack.of(this).region,
          },
        },
      })
    );

    // RDS IAM Role
    this.rdsRole = new iam.Role(this, `RDSRole-${environment}`, {
      assumedBy: new iam.ServicePrincipal('rds.amazonaws.com'),
      description: 'IAM role for RDS enhanced monitoring',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonRDSEnhancedMonitoringRole'
        ),
      ],
    });

    // Admin Role with MFA requirement for sensitive operations
    this.adminRole = new iam.Role(this, `AdminRole-${environment}`, {
      assumedBy: new iam.AccountPrincipal(cdk.Stack.of(this).account),
      description: 'Admin role with MFA requirement for sensitive operations',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'),
      ],
    });

    // Add MFA requirement policy for sensitive operations
    this.adminRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.DENY,
        actions: [
          'iam:CreateUser',
          'iam:DeleteUser',
          'iam:CreateRole',
          'iam:DeleteRole',
          'iam:AttachUserPolicy',
          'iam:DetachUserPolicy',
          'iam:AttachRolePolicy',
          'iam:DetachRolePolicy',
          'iam:CreateAccessKey',
          'iam:DeleteAccessKey',
          'rds:DeleteDBInstance',
          'rds:ModifyDBInstance',
          'ec2:DeleteVpc',
          'ec2:DeleteSecurityGroup',
          's3:DeleteBucket',
          'kms:DeleteAlias',
          'kms:DeleteKey',
        ],
        resources: ['*'],
        conditions: {
          BoolIfExists: {
            'aws:MultiFactorAuthPresent': 'false',
          },
        },
      })
    );

    // Instance Profile for EC2
    new iam.InstanceProfile(this, `EC2InstanceProfile-${environment}`, {
      role: this.ec2Role,
    });

    // Add Systems Manager Patch Manager permissions to EC2 role
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:DescribeInstanceInformation',
          'ssm:ListComplianceItems',
          'ssm:ListComplianceSummaries',
          'ssm:ListResourceComplianceSummaries',
          'ssm:GetComplianceDetailsByConfigRule',
          'ssm:GetComplianceDetailsByResource',
          'ssm:GetPatchBaseline',
          'ssm:GetPatchBaselineForPatchGroup',
          'ssm:DescribePatchBaselines',
          'ssm:DescribePatchGroups',
          'ssm:DescribeAvailablePatches',
          'ssm:DescribePatchProperties',
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: ['*'],
      })
    );

    // Add CloudWatch permissions for patch compliance monitoring
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'cloudwatch:namespace': 'AWS/SSM',
          },
        },
      })
    );

    // Tag security groups
    cdk.Tags.of(this.webSecurityGroup).add(
      'Name',
      `WebSecurityGroup-${environment}`
    );
    cdk.Tags.of(this.webSecurityGroup).add('Component', 'Security');
    cdk.Tags.of(this.appSecurityGroup).add(
      'Name',
      `AppSecurityGroup-${environment}`
    );
    cdk.Tags.of(this.appSecurityGroup).add('Component', 'Security');
    cdk.Tags.of(this.databaseSecurityGroup).add(
      'Name',
      `DatabaseSecurityGroup-${environment}`
    );
    cdk.Tags.of(this.databaseSecurityGroup).add('Component', 'Security');
  }
}
