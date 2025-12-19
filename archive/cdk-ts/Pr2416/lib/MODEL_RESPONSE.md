# Secure AWS Infrastructure with CDK

I'll help you create a comprehensive, secure AWS infrastructure using TypeScript and AWS CDK. Let me build this stack following all your security requirements and best practices.

## Directory Structure Implementation

Based on your directory structure, here's the complete implementation:

### lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as certificatemanager from 'aws-cdk-lib/aws-certificatemanager';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Define environment and naming convention
    const environment = 'prod';
    const region = 'us-west-2';

    // Create VPC with specified CIDR block
    const vpc = new ec2.Vpc(this, 'vpc-main-prod', {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2, // High availability across two AZs
      natGateways: 2, // One NAT gateway per AZ for redundancy
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 24,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Create S3 buckets with encryption and versioning
    const logsBucket = new s3.Bucket(this, 's3-logs-prod', {
      bucketName: `s3-logs-${environment}-${this.account}-${region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
    });

    const dataBucket = new s3.Bucket(this, 's3-data-prod', {
      bucketName: `s3-data-${environment}-${this.account}-${region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Create IAM role for EC2 instances with minimal S3 permissions
    const ec2Role = new iam.Role(this, 'iam-role-ec2-s3-prod', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal S3 access',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
      ],
    });

    // Add minimal S3 permissions to the role
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
        resources: [
          dataBucket.bucketArn,
          `${dataBucket.bucketArn}/*`,
          logsBucket.bucketArn,
          `${logsBucket.bucketArn}/*`,
        ],
      })
    );

    // Create instance profile for EC2
    const instanceProfile = new iam.CfnInstanceProfile(
      this,
      'ec2-instance-profile-prod',
      {
        roles: [ec2Role.roleName],
      }
    );

    // Security group for SSH access from limited IP range
    const sshSecurityGroup = new ec2.SecurityGroup(this, 'sg-ssh-prod', {
      vpc,
      description: 'Security group for SSH access from limited IP range',
      allowAllOutbound: false,
    });

    // Replace with your actual IP range
    sshSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Example IP range - replace with your actual range
      ec2.Port.tcp(22),
      'SSH access from limited IP range'
    );

    // Security group for web traffic
    const webSecurityGroup = new ec2.SecurityGroup(this, 'sg-web-prod', {
      vpc,
      description: 'Security group for web traffic',
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS traffic'
    );

    // Launch EC2 instances in private subnets across two AZs
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'systemctl enable amazon-cloudwatch-agent',
      'systemctl start amazon-cloudwatch-agent'
    );

    // EC2 instance in first AZ
    const ec2Instance1 = new ec2.Instance(this, 'ec2-web-prod-az1', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZones: [vpc.availabilityZones[0]],
      },
      securityGroup: webSecurityGroup,
      role: ec2Role,
      userData,
      detailedMonitoring: true, // Enable CloudWatch detailed monitoring
    });

    // EC2 instance in second AZ
    const ec2Instance2 = new ec2.Instance(this, 'ec2-web-prod-az2', {
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        availabilityZones: [vpc.availabilityZones[1]],
      },
      securityGroup: webSecurityGroup,
      role: ec2Role,
      userData,
      detailedMonitoring: true, // Enable CloudWatch detailed monitoring
    });

    // RDS subnet group for isolated subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, 'rds-subnet-group-prod', {
      vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'sg-rds-prod', {
      vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'MySQL access from web servers'
    );

    // RDS MySQL instance with multi-AZ and automatic backups
    const database = new rds.DatabaseInstance(this, 'rds-mysql-prod', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0_35,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      multiAz: true, // Multi-AZ deployment for high availability
      backupRetention: cdk.Duration.days(7), // 7-day backup retention
      deleteAutomatedBackups: false,
      deletionProtection: true,
      storageEncrypted: true,
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'rds-credentials-prod',
      }),
    });

    // DynamoDB table with point-in-time recovery
    const dynamoTable = new dynamodb.Table(this, 'dynamodb-data-prod', {
      tableName: `dynamodb-data-${environment}`,
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING,
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true, // Enable point-in-time recovery
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // CloudWatch log group for Lambda functions
    const lambdaLogGroup = new logs.LogGroup(this, 'logs-lambda-prod', {
      logGroupName: `/aws/lambda/lambda-function-${environment}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // IAM role for Lambda function
    const lambdaRole = new iam.Role(this, 'iam-role-lambda-prod', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });

    // Lambda function with CloudWatch logging
    const lambdaFunction = new lambda.Function(this, 'lambda-function-prod', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async (event) => {
          console.log('Event:', JSON.stringify(event, null, 2));
          return {
            statusCode: 200,
            body: JSON.stringify('Hello from Lambda!'),
          };
        };
      `),
      role: lambdaRole,
      logGroup: lambdaLogGroup,
      environment: {
        ENVIRONMENT: environment,
      },
    });

    // Application Load Balancer in public subnets
    const alb = new elbv2.ApplicationLoadBalancer(this, 'alb-web-prod', {
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      securityGroup: webSecurityGroup,
    });

    // Target group for EC2 instances
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'tg-web-prod', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        new elbv2.InstanceTarget(ec2Instance1),
        new elbv2.InstanceTarget(ec2Instance2),
      ],
      healthCheck: {
        enabled: true,
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        path: '/',
        protocol: elbv2.Protocol.HTTP,
        timeout: cdk.Duration.seconds(5),
        unhealthyThresholdCount: 2,
      },
    });

    // HTTPS listener (requires SSL certificate)
    // Note: You'll need to create an SSL certificate in ACM first
    // const certificate = certificatemanager.Certificate.fromCertificateArn(
    //   this,
    //   'ssl-certificate',
    //   'arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012'
    // );

    // For now, adding HTTP listener with redirect to HTTPS
    alb.addListener('listener-http-prod', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // Uncomment when you have an SSL certificate
    // alb.addListener('listener-https-prod', {
    //   port: 443,
    //   protocol: elbv2.ApplicationProtocol.HTTPS,
    //   certificates: [certificate],
    //   defaultTargetGroups: [targetGroup],
    // });

    // Output important resource information
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS database endpoint',
    });

    new cdk.CfnOutput(this, 'S3LogsBucket', {
      value: logsBucket.bucketName,
      description: 'S3 logs bucket name',
    });

    new cdk.CfnOutput(this, 'S3DataBucket', {
      value: dataBucket.bucketName,
      description: 'S3 data bucket name',
    });

    new cdk.CfnOutput(this, 'DynamoDBTable', {
      value: dynamoTable.tableName,
      description: 'DynamoDB table name',
    });
  }
}
```

### lib/PROMPT.md

```markdown
# Secure AWS Infrastructure with CDK

Hey, I'm putting together a CloudFormation stack using **TypeScript and AWS CDK**, and I need to make sure it's really solid on security.

We're aiming to set this up in the **'us-west-2' region**, using our default AWS account settings. For naming things, we'll follow this pattern: `resource-type-function-environment`, like `s3-logs-prod`. The network CIDR blocks should be `10.0.0.0/16`.

Here's a breakdown of what the stack needs to include:

- **S3 Buckets**: All S3 buckets need to be encrypted with server-side encryption, and versioning needs to be turned on for every single one.
- **EC2 Instances**: Any EC2 instances we launch must be inside a VPC, and we should only use `t3.micro` instances.
- **IAM Roles**: We'll apply IAM roles to our EC2 instances for S3 access. It's crucial that these roles have just the bare minimum permissions they need – no more.
- **High Availability**: We need to deploy everything across two availability zones for good high availability.
- **Monitoring**: CloudWatch monitoring should be enabled on all EC2 instances.
- **Lambda Logs**: All logs from AWS Lambda invocations need to be stored in CloudWatch.
- **RDS Database**: We'll use RDS for our database instances, configured for multi-AZ deployments. Automatic backups need to be on for RDS, with at least a 7-day retention period.
- **SSH Access**: I need a security group set up to allow SSH access, but only from a specific, limited IP range.
- **Load Balancer Traffic**: When we set up a load balancer, all application traffic through it must use HTTPS.
- **DynamoDB**: Any DynamoDB tables we use need to have point-in-time recovery enabled.

The expected output is a complete AWS CDK application written in TypeScript. When I deploy it, it should create all these specified resources exactly as described, following all the constraints.
```

### lib/MODEL_RESPONSE.md

````markdown
# AWS CDK Secure Infrastructure Implementation

## Overview

This implementation creates a comprehensive, secure AWS infrastructure using TypeScript and AWS CDK. The stack follows security best practices and includes all requested components with proper configuration.

## Key Security Features Implemented

### 1. **Network Security**

- VPC with CIDR block `10.0.0.0/16`
- Multi-tier subnet architecture (public, private, isolated)
- NAT gateways for secure outbound internet access
- Security groups with least privilege access

### 2. **S3 Security**

- Server-side encryption enabled on all buckets
- Versioning enabled for data protection
- Block public access enforced
- SSL enforcement for all requests
- Lifecycle policies for cost optimization

### 3. **IAM Security**

- Minimal permission IAM roles for EC2 instances
- Service-specific roles with least privilege principle
- No hardcoded credentials or overly permissive policies

### 4. **Database Security**

- RDS deployed in isolated subnets
- Multi-AZ deployment for high availability
- Encryption at rest enabled
- 7-day backup retention policy
- Security groups restricting database access

### 5. **Monitoring & Logging**

- CloudWatch detailed monitoring on EC2 instances
- Lambda function logs stored in CloudWatch
- Performance Insights enabled for RDS

## Resource Naming Convention

All resources follow the pattern: `resource-type-function-environment`

Examples:

- `s3-logs-prod`
- `ec2-web-prod-az1`
- `rds-mysql-prod`
- `dynamodb-data-prod`

## High Availability Design

- **EC2 Instances**: Deployed across two availability zones
- **RDS Database**: Multi-AZ deployment for automatic failover
- **Load Balancer**: Distributes traffic across multiple AZs
- **NAT Gateways**: One per AZ for redundancy

## Deployment Instructions

1. **Prerequisites**:
   ```bash
   npm install -g aws-cdk
   npm install
   ```
````

2. **Configure AWS credentials**:

   ```bash
   aws configure
   ```

3. **Bootstrap CDK** (if first time):

   ```bash
   cdk bootstrap
   ```

4. **Deploy the stack**:
   ```bash
   cdk deploy
   ```

## Important Notes

### SSL Certificate

The HTTPS listener is commented out because it requires an SSL certificate from AWS Certificate Manager. To enable HTTPS:

1. Create an SSL certificate in ACM
2. Uncomment the certificate and HTTPS listener code
3. Replace the certificate ARN with your actual certificate

### SSH Access

The SSH security group currently allows access from `203.0.113.0/24` (example range). Replace this with your actual IP range before deployment.

### Database Credentials

The RDS instance uses AWS Secrets Manager for credential management. The secret will be automatically created during deployment.

## Security Considerations

1. **Network Isolation**: Database is deployed in isolated subnets with no internet access
2. **Encryption**: All data is encrypted at rest and in transit where possible
3. **Access Control**: Security groups and IAM roles follow least privilege principle
4. **Monitoring**: Comprehensive logging and monitoring enabled
5. **Backup & Recovery**: Automated backups and point-in-time recovery enabled

## Cost Optimization

- Used `t3.micro` instances as specified
- Implemented S3 lifecycle policies
- Pay-per-request billing for DynamoDB
- Appropriate log retention periods

This infrastructure provides a solid foundation for secure, scalable applications while maintaining cost efficiency and operational excellence.

```

## Key Implementation Details

### Security Best Practices Applied:

1. **Network Segmentation**: Three-tier subnet architecture with proper isolation
2. **Encryption**: All data encrypted at rest and in transit
3. **Access Control**: Least privilege IAM roles and security groups
4. **Monitoring**: Comprehensive CloudWatch integration
5. **High Availability**: Multi-AZ deployments across two availability zones

### Notable Features:

- **S3 Buckets**: Server-side encryption, versioning, and lifecycle policies
- **EC2 Instances**: Deployed in private subnets with CloudWatch agent
- **RDS Database**: Multi-AZ MySQL with automated backups and encryption
- **DynamoDB**: Point-in-time recovery enabled
- **Load Balancer**: HTTP to HTTPS redirect (HTTPS listener ready for SSL certificate)
- **Lambda**: Proper CloudWatch logging configuration

The implementation follows your naming convention and includes all security requirements. You'll need to replace the example IP range for SSH access and add an SSL certificate ARN for full HTTPS functionality.
```
