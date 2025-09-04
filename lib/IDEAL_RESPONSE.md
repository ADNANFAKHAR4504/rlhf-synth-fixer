I'll implement a secure AWS infrastructure using CDK with TypeScript that meets all your requirements. Here's the complete implementation for your `./lib/tap-stack.ts` file:

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  allowedSshIp?: string; // IP address allowed for SSH access
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // Get environment suffix from props, context, or use 'dev' as default
    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Validate required parameters
    const allowedSshIp = props?.allowedSshIp || this.node.tryGetContext('allowedSshIp');
    if (!allowedSshIp) {
      throw new Error('allowedSshIp must be provided either in props or context');
    }

    // Naming prefix for production resources
    const namePrefix = 'prod';

    // 1. Create VPC with high availability across two AZs
    const vpc = new ec2.Vpc(this, 'ProdVpc', {
      vpcName: `${namePrefix}-vpc-${environmentSuffix}`,
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${namePrefix}-public-subnet`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${namePrefix}-private-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: `${namePrefix}-isolated-subnet`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Tag VPC resources
    cdk.Tags.of(vpc).add('Environment', environmentSuffix);
    cdk.Tags.of(vpc).add('Project', 'TapStack');

    // 2. Create S3 bucket with security features
    const s3Bucket = new s3.Bucket(this, 'ProdS3Bucket', {
      bucketName: `${namePrefix}-secure-bucket-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'delete-incomplete-multipart-uploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
    });

    // Create CloudFront Origin Access Control
    const originAccessControl = new cloudfront.OriginAccessControl(this, 'OAC', {
      originAccessControlName: `${namePrefix}-oac-${environmentSuffix}`,
      description: 'Origin Access Control for S3 bucket',
      originAccessControlOriginType: cloudfront.OriginAccessControlOriginType.S3,
      signing: cloudfront.Signing.SIGV4_ALWAYS,
    });

    // Create CloudFront distribution
    const distribution = new cloudfront.Distribution(this, 'ProdDistribution', {
      comment: `${namePrefix} CloudFront Distribution`,
      defaultBehavior: {
        origin: origins.S3BucketOrigin.withOriginAccessControl(s3Bucket, {
          originAccessControl,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
    });

    // Update S3 bucket policy to allow access only from CloudFront
    s3Bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AllowCloudFrontServicePrincipal',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudfront.amazonaws.com')],
        actions: ['s3:GetObject'],
        resources: [`${s3Bucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudfront::${cdk.Aws.ACCOUNT_ID}:distribution/${distribution.distributionId}`,
          },
        },
      })
    );

    // 3. Create IAM role for EC2 instance with least privilege
    const ec2Role = new iam.Role(this, 'ProdEc2Role', {
      roleName: `${namePrefix}-ec2-role-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
      ],
      inlinePolicies: {
        S3ReadOnlyAccess: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['s3:GetObject', 's3:ListBucket'],
              resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
            }),
          ],
        }),
      },
    });

    // Create instance profile for EC2
    const instanceProfile = new iam.CfnInstanceProfile(this, 'ProdInstanceProfile', {
      instanceProfileName: `${namePrefix}-instance-profile-${environmentSuffix}`,
      roles: [ec2Role.roleName],
    });

    // 4. Create security group for EC2 with restricted SSH access
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'ProdEc2SecurityGroup', {
      securityGroupName: `${namePrefix}-ec2-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for production EC2 instance',
      allowAllOutbound: true,
    });

    // Add SSH rule for specific IP only
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4(`${allowedSshIp}/32`),
      ec2.Port.tcp(22),
      'SSH access from specific IP'
    );

    // 5. Create EC2 instance
    const ec2Instance = new ec2.Instance(this, 'ProdEc2Instance', {
      instanceName: `${namePrefix}-instance-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: ec2.MachineImage.latestAmazonLinux2023(),
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData: ec2.UserData.custom(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c default
`),
    });

    // Add dependency to ensure instance profile is created first
    ec2Instance.node.addDependency(instanceProfile);

    // Tag EC2 instance
    cdk.Tags.of(ec2Instance).add('Environment', environmentSuffix);
    cdk.Tags.of(ec2Instance).add('Project', 'TapStack');
    cdk.Tags.of(ec2Instance).add('Backup', 'Required');

    // 6. Create RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'ProdDbSubnetGroup', {
      subnetGroupName: `${namePrefix}-db-subnet-group-${environmentSuffix}`,
      description: 'Subnet group for production RDS instance',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
    });

    // Create security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'ProdRdsSecurityGroup', {
      securityGroupName: `${namePrefix}-rds-sg-${environmentSuffix}`,
      vpc,
      description: 'Security group for production RDS instance',
      allowAllOutbound: false,
    });

    // Allow MySQL/Aurora access from EC2 security group only
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from EC2 instances'
    );

    // 7. Create RDS instance with security features
    const rdsInstance = new rds.DatabaseInstance(this, 'ProdRdsInstance', {
      instanceIdentifier: `${namePrefix}-database-${environmentSuffix}`,
      engine: rds.DatabaseEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `${namePrefix}-db-credentials-${environmentSuffix}`,
      }),
    });

    // Tag RDS instance
    cdk.Tags.of(rdsInstance).add('Environment', environmentSuffix);
    cdk.Tags.of(rdsInstance).add('Project', 'TapStack');
    cdk.Tags.of(rdsInstance).add('Backup', 'Automated');

    // 8. Set up CloudWatch Log Groups
    const applicationLogGroup = new logs.LogGroup(this, 'ProdApplicationLogGroup', {
      logGroupName: `/aws/ec2/${namePrefix}-application-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    const systemLogGroup = new logs.LogGroup(this, 'ProdSystemLogGroup', {
      logGroupName: `/aws/ec2/${namePrefix}-system-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // 9. Set up CloudTrail for auditing
    const cloudTrailBucket = new s3.Bucket(this, 'ProdCloudTrailBucket', {
      bucketName: `${namePrefix}-cloudtrail-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'delete-old-logs',
          expiration: cdk.Duration.days(90),
        },
      ],
    });

    const trail = new cloudtrail.Trail(this, 'ProdCloudTrail', {
      trailName: `${namePrefix}-cloudtrail-${environmentSuffix}`,
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      sendToCloudWatchLogs: true,
      cloudWatchLogGroup: new logs.LogGroup(this, 'ProdCloudTrailLogGroup', {
        logGroupName: `/aws/cloudtrail/${namePrefix}-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.RETAIN,
      }),
    });

    // 10. CloudFormation Outputs
    new cdk.CfnOutput(this, 'S3BucketArn', {
      value: s3Bucket.bucketArn,
      description: 'ARN of the production S3 bucket',
      exportName: `${namePrefix}-s3-bucket-arn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'Name of the production S3 bucket',
      exportName: `${namePrefix}-s3-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'ID of the production EC2 instance',
      exportName: `${namePrefix}-ec2-instance-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'EC2PrivateIp', {
      value: ec2Instance.instancePrivateIp,
      description: 'Private IP of the production EC2 instance',
      exportName: `${namePrefix}-ec2-private-ip-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'ID of the production VPC',
      exportName: `${namePrefix}-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RdsEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'Endpoint of the production RDS instance',
      exportName: `${namePrefix}-rds-endpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDistributionId', {
      value: distribution.distributionId,
      description: 'ID of the CloudFront distribution',
      exportName: `${namePrefix}-cloudfront-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomainName', {
      value: distribution.distributionDomainName,
      description: 'Domain name of the CloudFront distribution',
      exportName: `${namePrefix}-cloudfront-domain-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ApplicationLogGroupName', {
      value: applicationLogGroup.logGroupName,
      description: 'Name of the application log group',
      exportName: `${namePrefix}-app-log-group-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'ARN of the CloudTrail',
      exportName: `${namePrefix}-cloudtrail-arn-${environmentSuffix}`,
    });
  }
}
```

## Key Features Implemented

### 🔒 **Security Best Practices**

1. **S3 Bucket Security**:
   - Server-side encryption (S3-managed)
   - Versioning enabled
   - Block all public access
   - SSL enforcement
   - CloudFront-only access policy using Origin Access Control

2. **EC2 Security**:
   - Deployed in private subnet
   - Security group allows SSH only from specified IP
   - IAM role with least privilege principle
   - CloudWatch agent for monitoring

3. **RDS Security**:
   - Encryption at rest enabled
   - Multi-AZ deployment for high availability
   - Deployed in isolated subnets
   - Security group allows access only from EC2
   - Deletion protection enabled
   - Automated backups with 7-day retention

### 🏗️ **Infrastructure Components**

- **VPC**: Multi-AZ setup with public, private, and isolated subnets
- **CloudTrail**: Account-wide auditing with log file validation
- **CloudWatch**: Comprehensive logging for all services
- **IAM**: Least privilege roles and policies

### 📋 **Usage Instructions**

1. **Deploy the stack**:
   ```bash
   # Set the allowed SSH IP address
   cdk deploy --context allowedSshIp=YOUR_IP_ADDRESS
   
   # Or with environment suffix
   cdk deploy --context allowedSshIp=YOUR_IP_ADDRESS --context environmentSuffix=prod
   ```

2. **Required Context Variables**:
   - `allowedSshIp`: Your IP address for SSH access (required)
   - `environmentSuffix`: Environment name (optional, defaults to 'dev')

### 🔍 **Security Considerations**

- All resources follow the `prod-` naming convention
- IAM policies grant minimal necessary permissions
- Network isolation with proper subnet configuration
- Encryption enabled for all data at rest and in transit
- Comprehensive logging and auditing
- Resource retention policies to prevent accidental deletion

This implementation provides a production-ready, secure AWS infrastructure that follows all specified requirements and AWS security best practices.