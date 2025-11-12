I'll implement a production-ready AWS infrastructure using CDK with TypeScript that meets all your requirements. Here's the complete implementation for `./lib/tap-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  readonly domainName?: string;
  readonly notificationEmail?: string;
}

export class TapStack extends cdk.Stack {
  private readonly commonTags: { [key: string]: string } = {
    Environment: 'production',
    Project: 'web-app'
  };

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Validate required parameters
    const notificationEmail = props?.notificationEmail || process.env.NOTIFICATION_EMAIL;
    if (!notificationEmail) {
      throw new Error('Notification email is required. Set via props or NOTIFICATION_EMAIL environment variable.');
    }

    // Create VPC with proper CIDR and subnets
    const vpc = this.createVpcInfrastructure();

    // Create Security Groups
    const securityGroups = this.createSecurityGroups(vpc);

    // Create IAM roles
    const roles = this.createIamRoles();

    // Create S3 bucket for logs
    const logsBucket = this.createS3Infrastructure();

    // Create CloudFront distribution
    const distribution = this.createCloudFrontDistribution(logsBucket);

    // Create RDS instance
    const database = this.createRdsInstance(vpc, securityGroups.databaseSg);

    // Create EC2 instances
    const instances = this.createEc2Instances(vpc, securityGroups, roles.ec2Role);

    // Create Application Load Balancer
    const alb = this.createApplicationLoadBalancer(vpc, securityGroups.albSg, instances);

    // Create monitoring and cost alarms
    this.createMonitoringAndAlarms(instances, notificationEmail);

    // Output important information
    this.createOutputs(vpc, alb, database, distribution, logsBucket);
  }

  private createVpcInfrastructure(): ec2.Vpc {
    const vpc = new ec2.Vpc(this, 'WebAppVpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
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
        {
          cidrMask: 24,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }
      ],
      natGateways: 1, // Single NAT Gateway for cost optimization while maintaining functionality
    });

    cdk.Tags.of(vpc).add('Name', 'WebApp-VPC');
    Object.entries(this.commonTags).forEach(([key, value]) => {
      cdk.Tags.of(vpc).add(key, value);
    });

    return vpc;
  }

  private createSecurityGroups(vpc: ec2.Vpc) {
    // Bastion Host Security Group
    const bastionSg = new ec2.SecurityGroup(this, 'BastionSecurityGroup', {
      vpc,
      description: 'Security group for bastion host',
      allowAllOutbound: true,
    });

    bastionSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere'
    );

    cdk.Tags.of(bastionSg).add('Name', 'WebApp-Bastion-SG');

    // Application Security Group
    const appSg = new ec2.SecurityGroup(this, 'ApplicationSecurityGroup', {
      vpc,
      description: 'Security group for application servers',
      allowAllOutbound: true,
    });

    appSg.addIngressRule(
      bastionSg,
      ec2.Port.tcp(22),
      'Allow SSH from bastion host'
    );

    cdk.Tags.of(appSg).add('Name', 'WebApp-Application-SG');

    // ALB Security Group
    const albSg = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic from anywhere'
    );

    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic for redirect to HTTPS'
    );

    cdk.Tags.of(albSg).add('Name', 'WebApp-ALB-SG');

    // Allow ALB to communicate with application instances
    appSg.addIngressRule(
      albSg,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Database Security Group
    const databaseSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    databaseSg.addIngressRule(
      appSg,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from application servers'
    );

    cdk.Tags.of(databaseSg).add('Name', 'WebApp-Database-SG');

    // Apply common tags to all security groups
    [bastionSg, appSg, albSg, databaseSg].forEach(sg => {
      Object.entries(this.commonTags).forEach(([key, value]) => {
        cdk.Tags.of(sg).add(key, value);
      });
    });

    return { bastionSg, appSg, albSg, databaseSg };
  }

  private createIamRoles() {
    // EC2 Role for application instances
    const ec2Role = new iam.Role(this, 'EC2ApplicationRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 application instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
    });

    // Create custom policy for S3 logs access
    const s3LogsPolicy = new iam.Policy(this, 'S3LogsPolicy', {
      description: 'Policy to allow writing logs to S3 bucket',
      statements: [
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            's3:PutObject