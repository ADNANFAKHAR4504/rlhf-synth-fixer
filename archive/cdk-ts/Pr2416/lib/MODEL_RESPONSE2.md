I'll fix those TypeScript errors for you. The issues are related to incorrect property names and import references. Here's the corrected code:

## Fixed Implementation

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
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
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

    // Allow outbound HTTPS for package updates
    sshSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'HTTPS outbound for updates'
    );

    // Allow outbound HTTP for package updates
    sshSecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'HTTP outbound for updates'
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
      'yum install -y amazon-cloudwatch-agent httpd',
      'systemctl enable httpd',
      'systemctl start httpd',
      'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
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

    // Allow SSH access to EC2 instances
    ec2Instance1.addSecurityGroup(sshSecurityGroup);

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

    // Allow SSH access to EC2 instances
    ec2Instance2.addSecurityGroup(sshSecurityGroup);

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
        new targets.InstanceTarget(ec2Instance1),
        new targets.InstanceTarget(ec2Instance2),
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

    // HTTP listener with redirect to HTTPS
    alb.addListener('listener-http-prod', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
        permanent: true,
      }),
    });

    // For production, uncomment when you have an SSL certificate
    // const certificate = certificatemanager.Certificate.fromCertificateArn(
    //   this,
    //   'ssl-certificate',
    //   'arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012'
    // );

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

### bin/tap.ts (Example of how it should look)

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
  description: 'Secure AWS Infrastructure with CDK',
});
```

## Key Fixes Applied:

### 1. **Fixed InstanceTarget Import Error**

- **Problem**: `elbv2.InstanceTarget` doesn't exist in the main ELB v2 module
- **Solution**: Added proper import for targets: `import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets'`
- **Usage**: Changed to `new targets.InstanceTarget(ec2Instance1)`

### 2. **Removed environmentSuffix Property**

- **Problem**: `environmentSuffix` is not a valid property in `StackProps`
- **Solution**: Removed this property from the bin file and handled environment naming within the stack

### 3. **Enhanced Security Groups**

- Added proper egress rules for SSH security group to allow package updates
- Added HTTP server installation to EC2 user data for load balancer health checks

### 4. **Additional Improvements**

- Added Apache HTTP server installation in user data
- Created a simple index.html for health check testing
- Added SSH security group to both EC2 instances
- Improved security group configurations

## Dependencies Required

Make sure your `package.json` includes these dependencies:

```json
{
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^18.0.0",
    "typescript": "^4.9.0"
  }
}
```

The code should now compile and deploy successfully without TypeScript errors. All security requirements are maintained while fixing the compilation issues.
