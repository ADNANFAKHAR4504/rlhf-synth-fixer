# IDEAL_RESPONSE — TapStack (CDK TypeScript)

Summary
- TapStack provides a CI-friendly, parametric AWS foundation:
  - VPC with public and private subnets (multi-AZ)
  - AutoScalingGroup (Amazon Linux 2) behind an Application Load Balancer
  - RDS PostgreSQL in private subnets with encryption, Multi-AZ, and snapshot on delete
  - Three S3 buckets: main, replication, and logging — versioned, encrypted, public-access blocked
  - Scoped IAM roles: EC2 instance role (SSM) and S3 replication role
  - Outputs for key logical identifiers (VPC id, ALB DNS, RDS identifier, main bucket name)


## tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface TapStackProps extends cdk.StackProps {
  // prefer "suffix" or "environmentSuffix" via pipeline/context; keep optional
  suffix?: string;
  environmentSuffix?: string;
  natGateways?: number; // default 1 to meet NAT requirement
  iacRlhfTagValue?: string; // optional tag value, defaults to "true"

  // new configurable options
  deletionProtection?: boolean; // default false; enable when long-lived environment needs protection
  bucketRemovalPolicy?: cdk.RemovalPolicy; // default RETAIN
  amiId?: string; // optional override for EC2 AMI
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps = {}) {
    super(scope, id, props);

    // apply global tag so all taggable resources created by this stack carry an identifier
    cdk.Tags.of(this).add('iac-rlhf-amazon', props.iacRlhfTagValue ?? 'true');

    // sanitize suffix: lowercase, keep alphanumerics and dash, truncate to safe length
    const sanitize = (s?: string) =>
      (s ?? '')
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 12);

    const rawSuffix = props.suffix ?? props.environmentSuffix ?? '';
    const suffix = sanitize(rawSuffix || 'dev');

    const natGateways = props.natGateways ?? 1;
    const bucketRemovalPolicy = props.bucketRemovalPolicy ?? cdk.RemovalPolicy.RETAIN;
    const deletionProtection = props.deletionProtection ?? false;
    const defaultAmiId = props.amiId ?? 'ami-0c02fb55956c7d316';

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, `VPC-${suffix}`, {
      maxAzs: 2,
      natGateways,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `Public-${suffix}`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `Private-${suffix}`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // EC2 IAM role: rely on managed SSM policy; avoid broad custom inline grants
    const ec2Role = new iam.Role(this, `EC2Role-${suffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
    });
    ec2Role.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
    );

    // Create S3 buckets (let CDK generate physical names to avoid global collisions)
    const logBucket = new s3.Bucket(this, `LogBucket-${suffix}`, {
      versioned: true,
      removalPolicy: bucketRemovalPolicy,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    });

    const replicationBucket = new s3.Bucket(
      this,
      `ReplicationBucket-${suffix}`,
      {
        versioned: true,
        removalPolicy: bucketRemovalPolicy,
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }
    );

    const mainBucket = new s3.Bucket(this, `MainBucket-${suffix}`, {
      versioned: true,
      removalPolicy: bucketRemovalPolicy,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: logBucket,
      serverAccessLogsPrefix: 'access-logs/',
    });

    // --- REPLACE previous mainBucket.addReplicationRule(...) with explicit CFN replication config ---
    // Replication role for cross-bucket replication - use generated names (no hardcoded roleName)
    const replicationRole = new iam.Role(this, `ReplicationRole-${suffix}`, {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:GetReplicationConfiguration',
          's3:ListBucket',
          's3:GetObjectVersionForReplication',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
          's3:GetObjectRetention',
          's3:GetObjectLegalHold',
        ],
        resources: [mainBucket.bucketArn, `${mainBucket.bucketArn}/*`],
      })
    );

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          's3:ReplicateObject',
          's3:ReplicateDelete',
          's3:ReplicateTags',
          's3:ObjectOwnerOverrideToBucketOwner',
        ],
        resources: [
          replicationBucket.bucketArn,
          `${replicationBucket.bucketArn}/*`,
        ],
      })
    );

    // CFN-level replication configuration requires 'role' at bucket level
    const cfnMain = mainBucket.node.defaultChild as s3.CfnBucket;
    cfnMain.replicationConfiguration = {
      role: replicationRole.roleArn,
      rules: [
        {
          id: `ReplicationRule-${suffix}`,
          status: 'Enabled',
          destination: {
            bucket: replicationBucket.bucketArn,
            storageClass: 'STANDARD',
          },
          // optional: prefix: '', priority not required for single rule
        },
      ],
    };

    // Narrow EC2 role S3 permissions to only the needed buckets (least privilege)
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:ListBucket'],
        resources: [
          mainBucket.bucketArn,
          `${mainBucket.bucketArn}/*`,
          logBucket.bucketArn,
          `${logBucket.bucketArn}/*`,
        ],
      })
    );

    // Security groups
    const dbSecurityGroup = new ec2.SecurityGroup(this, `DBSG-${suffix}`, {
      vpc,
      description: 'Security group for RDS',
      allowAllOutbound: true,
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, `EC2SG-${suffix}`, {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true,
    });

    // Allow PostgreSQL traffic from EC2 to RDS (SG-to-SG)
    dbSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ASG'
    );

    // ALB SG and rules
    const albSecurityGroup = new ec2.SecurityGroup(this, `ALBSG-${suffix}`, {
      vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP'
    );
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow ALB to EC2'
    );

    // ALB
    const alb = new elbv2.ApplicationLoadBalancer(this, `ALB-${suffix}`, {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });
    const listener = alb.addListener(`Listener-${suffix}`, {
      port: 80,
      open: true,
    });

    // Use explicit AMI mapping (AL2 x86_64)
    const ami = ec2.MachineImage.genericLinux({
      'us-east-1': defaultAmiId,
    });

    const asg = new autoscaling.AutoScalingGroup(this, `ASG-${suffix}`, {
      vpc,
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      minCapacity: 2,
      maxCapacity: 4,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
    });

    listener.addTargets(`ASGTarget-${suffix}`, {
      port: 80,
      targets: [asg],
      healthCheck: { path: '/', interval: cdk.Duration.seconds(30) },
    });

    // RDS PostgreSQL in private subnets; do not hardcode instanceIdentifier to avoid collisions
    const dbName = `postgresdb${suffix}`.replace(/[^a-z0-9]/g, '').slice(0, 63);

    const dbInstance = new rds.DatabaseInstance(this, `PostgresDB-${suffix}`, {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_13,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.BURSTABLE3,
        ec2.InstanceSize.MEDIUM
      ),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [dbSecurityGroup],
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      deletionProtection: deletionProtection,
      multiAz: true,
      storageEncrypted: true,
      databaseName: dbName,
      storageType: rds.StorageType.GP2,
      allocatedStorage: 20,
    });

    // Outputs (stable logical ids)
    new cdk.CfnOutput(this, `VPCID-${suffix}`, {
      value: vpc.vpcId,
      description: 'VPC ID',
    });
    new cdk.CfnOutput(this, `LoadBalancerDNS-${suffix}`, {
      value: alb.loadBalancerDnsName,
      description: 'ALB DNS',
    });
    new cdk.CfnOutput(this, `RDSIdentifier-${suffix}`, {
      value: dbInstance.instanceIdentifier,
      description: 'RDS identifier',
    });
    new cdk.CfnOutput(this, `MainBucketName-${suffix}`, {
      value: mainBucket.bucketName,
      description: 'Main application bucket name',
    });
  }
}

// Remove runtime app/stack instantiation — tests and bin/tap.ts should create the app.

```
