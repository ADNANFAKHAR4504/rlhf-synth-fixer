import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface SecurityStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  allowedSshCidr?: string;
}

export class SecurityStack extends cdk.Stack {
  public readonly webAppSecurityGroup: ec2.SecurityGroup;
  public readonly albSecurityGroup: ec2.SecurityGroup;
  public readonly ec2Role: iam.Role;

  constructor(scope: Construct, id: string, props: SecurityStackProps) {
    super(scope, id, props);

    const { environmentSuffix, vpc } = props;
    const allowedSshCidr = props.allowedSshCidr || '10.0.0.0/8';

    // Application Load Balancer Security Group
    this.albSecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-alb-sg-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for Application Load Balancer',
        allowAllOutbound: false,
      }
    );

    // Allow HTTP and HTTPS from internet
    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet'
    );

    this.albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );

    // Allow outbound to web tier only
    this.albSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(8080),
      'Allow outbound to web tier'
    );

    // Web-App Tier Security Group (consolidated from web and app tiers)
    this.webAppSecurityGroup = new ec2.SecurityGroup(
      this,
      `tf-web-app-sg-${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for web-app tier instances',
        allowAllOutbound: false,
      }
    );

    // Allow inbound from ALB only
    this.webAppSecurityGroup.addIngressRule(
      this.albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow HTTP from ALB'
    );

    // Allow SSH from specific CIDR
    this.webAppSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(allowedSshCidr),
      ec2.Port.tcp(22),
      'Allow SSH from management network'
    );

    // Allow HTTPS outbound for package updates and AWS APIs
    this.webAppSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS outbound'
    );

    // Allow HTTP outbound for package updates
    this.webAppSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP outbound'
    );

    // Allow NFS outbound for EFS access
    this.webAppSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(2049),
      'Allow NFS outbound for EFS access'
    );

    // Create IAM Role for EC2 instances
    this.ec2Role = new iam.Role(this, `tf-ec2-role-${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with least privilege',
      roleName: cdk.PhysicalName.GENERATE_IF_NEEDED, // Required for cross-stack references
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add inline policy for specific S3 bucket access
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [`arn:aws:s3:::tf-app-data-bucket-${environmentSuffix}/*`],
      })
    );

    // Add policy for CloudWatch metrics and logs
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'cloudwatch:PutMetricData',
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: ['*'],
      })
    );

    // Add policy for EFS access
    this.ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'elasticfilesystem:DescribeFileSystems',
          'elasticfilesystem:DescribeMountTargets',
          'elasticfilesystem:DescribeAccessPoints',
          'elasticfilesystem:ClientMount',
          'elasticfilesystem:ClientWrite',
        ],
        resources: ['*'],
      })
    );

    // Instance Profile is automatically created by CDK when role is used in Launch Template

    // Add comprehensive tags
    const tags = {
      Environment: environmentSuffix,
      Project: 'TapStack',
      Component: 'Security',
      CostCenter: 'Infrastructure',
      Compliance: 'SOC2',
    };

    Object.entries(tags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, `WebAppSecurityGroupId-${environmentSuffix}`, {
      value: this.webAppSecurityGroup.securityGroupId,
      description: 'Web-App tier security group ID',
      exportName: `tf-web-app-sg-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `ALBSecurityGroupId-${environmentSuffix}`, {
      value: this.albSecurityGroup.securityGroupId,
      description: 'ALB security group ID',
      exportName: `tf-alb-sg-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, `EC2RoleArn-${environmentSuffix}`, {
      value: this.ec2Role.roleArn,
      description: 'EC2 IAM role ARN',
      exportName: `tf-ec2-role-arn-${environmentSuffix}`,
    });
  }
}
