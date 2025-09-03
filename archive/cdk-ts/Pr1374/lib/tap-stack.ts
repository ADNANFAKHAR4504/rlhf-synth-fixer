import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Resolve and validate region per requirements
    const region = cdk.Stack.of(this).region;
    if (!cdk.Token.isUnresolved(region) && region !== 'us-east-1') {
      throw new Error(
        `This stack must be deployed to us-east-1. Current region: ${region}`
      );
    }

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // VPC: 10.0.0.0/16 with public and private subnets, 2 AZs, NAT for private egress
    const vpc = new ec2.Vpc(this, 'Vpc', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2,
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
      ],
    });

    // S3: Server-side encryption (SSE-S3) and public access blocked
    const appBucket = new s3.Bucket(this, 'AppBucket', {
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      // For easy deletion in non-prod
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // IAM Role for EC2 with least-privilege managed policies for SSM access
    const ec2InstanceRole = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'Role for EC2 instances with SSM access (no admin permissions)',
    });
    ec2InstanceRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Security Group for Bastion (no SSH open to the world)
    const bastionSecurityGroup = new ec2.SecurityGroup(
      this,
      'BastionSecurityGroup',
      {
        vpc,
        description:
          'Bastion host security group without SSH open to the world',
        allowAllOutbound: true,
      }
    );
    // Intentionally do NOT add any port 22 ingress rules

    // Bastion EC2 host (public subnet) with EIP; access via SSM, not SSH
    const bastion = new ec2.Instance(this, 'BastionHost', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      role: ec2InstanceRole,
      securityGroup: bastionSecurityGroup,
      requireImdsv2: true,
    });
    const bastionEip = new ec2.CfnEIP(this, 'BastionEip', { domain: 'vpc' });
    new ec2.CfnEIPAssociation(this, 'BastionEipAssociation', {
      eip: bastionEip.ref,
      instanceId: bastion.instanceId,
    });

    // RDS: Multi-AZ, encrypted at rest, private subnets, not publicly accessible
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'RDS security group; allows DB access only from bastion',
      allowAllOutbound: true,
    });
    // Allow DB access from the bastion only (example: PostgreSQL 5432)
    rdsSecurityGroup.addIngressRule(
      bastionSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Bastion to access PostgreSQL'
    );

    const dbInstance = new rds.DatabaseInstance(this, 'AppDatabase', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_16,
      }),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      credentials: rds.Credentials.fromGeneratedSecret('postgres'), // no hard-coded secrets
      multiAz: true,
      allocatedStorage: 20,
      storageEncrypted: true,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MICRO
      ),
      publiclyAccessible: false,
      backupRetention: cdk.Duration.days(7),
      // Make deletable in non-prod
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      securityGroups: [rdsSecurityGroup],
      cloudwatchLogsExports: ['postgresql'],
      monitoringInterval: cdk.Duration.seconds(60),
    });

    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description:
        'Security group for ALB allowing HTTP (80) from the internet',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP'
    );

    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });
    // HTTP listener with a fixed response (baseline without backend targets)
    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.fixedResponse(200, {
        contentType: 'text/plain',
        messageBody: 'OK',
      }),
    });

    // CloudWatch Alarm: EC2 CPU > 80%
    const bastionCpuMetric = new cloudwatch.Metric({
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: { InstanceId: bastion.instanceId },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });
    new cloudwatch.Alarm(this, 'BastionCpuHigh', {
      metric: bastionCpuMetric,
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      comparisonOperator:
        cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // DynamoDB with Point-In-Time Recovery enabled
    const appTable = new dynamodb.Table(this, 'AppTable', {
      partitionKey: { name: 'pk', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'sk', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true,
      // For easy deletion in non-prod
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Tag resources consistently (in addition to app-level tags)
    cdk.Tags.of(vpc).add('Component', `vpc-${environmentSuffix}`);
    cdk.Tags.of(appBucket).add('Component', `s3-${environmentSuffix}`);
    cdk.Tags.of(dbInstance).add('Component', `rds-${environmentSuffix}`);
    cdk.Tags.of(bastion).add('Component', `bastion-${environmentSuffix}`);

    // Outputs for integration tests and CI consumption
    new cdk.CfnOutput(this, 'VpcId', { value: vpc.vpcId });
    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: cdk.Fn.join(
        ',',
        vpc.selectSubnets({ subnetType: ec2.SubnetType.PUBLIC }).subnetIds
      ),
    });
    new cdk.CfnOutput(this, 'PrivateSubnetIds', {
      value: cdk.Fn.join(
        ',',
        vpc.selectSubnets({ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS })
          .subnetIds
      ),
    });
    new cdk.CfnOutput(this, 'AppBucketName', { value: appBucket.bucketName });
    new cdk.CfnOutput(this, 'BastionInstanceId', { value: bastion.instanceId });
    new cdk.CfnOutput(this, 'AlbDnsName', { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, 'DbEndpointAddress', {
      value: dbInstance.instanceEndpoint.hostname,
    });
    new cdk.CfnOutput(this, 'DynamoTableName', { value: appTable.tableName });
  }
}
