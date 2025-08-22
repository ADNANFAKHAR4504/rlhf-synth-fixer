# AWS Infrastructure Setup with CDK JavaScript

Here's the complete infrastructure code organized into separate files following CDK best practices:

## lib/tap-stack.mjs
```javascript
import * as cdk from 'aws-cdk-lib';
import { NetworkStack } from './network-stack.mjs';
import { StorageStack } from './storage-stack.mjs';
import { DatabaseStack } from './database-stack.mjs';
import { SecurityStack } from './security-stack.mjs';

class TapStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Create network infrastructure
    const networkStack = new NetworkStack(scope, `NetworkStack${environmentSuffix}`, {
      ...props,
      stackName: `NetworkStack${environmentSuffix}`,
      environmentSuffix: environmentSuffix
    });

    // Create security resources
    const securityStack = new SecurityStack(scope, `SecurityStack${environmentSuffix}`, {
      ...props,
      stackName: `SecurityStack${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
      vpc: networkStack.vpc
    });

    // Create storage resources  
    const storageStack = new StorageStack(scope, `StorageStack${environmentSuffix}`, {
      ...props,
      stackName: `StorageStack${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
      ec2Role: securityStack.ec2Role
    });

    // Create database resources
    const databaseStack = new DatabaseStack(scope, `DatabaseStack${environmentSuffix}`, {
      ...props,
      stackName: `DatabaseStack${environmentSuffix}`,
      environmentSuffix: environmentSuffix,
      vpc: networkStack.vpc
    });
  }
}

export { TapStack };
```

## lib/network-stack.mjs
```javascript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

class NetworkStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // Create VPC with multiple availability zones for us-east-1
    this.vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 3, // us-east-1 has 6 AZs, using 3 for cost efficiency
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      natGateways: 1, // Use 1 NAT gateway for cost optimization
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
          cidrMask: 28,
          name: 'isolated-subnet',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Output VPC ID for reference
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for the application infrastructure',
      exportName: `${this.stackName}-VpcId`,
    });
  }
}

export { NetworkStack };
```

## lib/storage-stack.mjs
```javascript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';

class StorageStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // S3 bucket for application logs with versioning enabled
    this.logBucket = new s3.Bucket(this, 'ApplicationLogBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'LogRetentionRule',
          enabled: true,
          expiration: cdk.Duration.days(365),
          noncurrentVersionExpiration: cdk.Duration.days(30),
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
            {
              storageClass: s3.StorageClass.GLACIER,
              transitionAfter: cdk.Duration.days(90),
            }
          ]
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Grant the EC2 role permissions to write logs
    if (props.ec2Role) {
      this.logBucket.grantWrite(props.ec2Role);
      this.logBucket.grantRead(props.ec2Role);
    }

    // Output bucket name
    new cdk.CfnOutput(this, 'LogBucketName', {
      value: this.logBucket.bucketName,
      description: 'S3 bucket name for application logs',
      exportName: `${this.stackName}-LogBucketName`,
    });

    new cdk.CfnOutput(this, 'LogBucketArn', {
      value: this.logBucket.bucketArn,
      description: 'S3 bucket ARN for application logs',
      exportName: `${this.stackName}-LogBucketArn`,
    });
  }
}

export { StorageStack };
```

## lib/security-stack.mjs
```javascript
import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

class SecurityStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // IAM role for EC2 instances with least privilege principle
    this.ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
      inlinePolicies: {
        CloudWatchLogsPolicy: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams'
              ],
              resources: [
                `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/*`
              ]
            })
          ]
        })
      }
    });

    // Instance profile for the role
    this.instanceProfile = new iam.InstanceProfile(this, 'EC2InstanceProfile', {
      role: this.ec2Role,
    });

    // Security Group for RDS
    this.rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS Aurora cluster',
      allowAllOutbound: false,
    });

    // Security Group for EC2 instances
    this.ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for EC2 instances',
    });

    // Allow EC2 to connect to RDS on MySQL port
    this.rdsSecurityGroup.addIngressRule(
      this.ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow EC2 instances to connect to RDS'
    );

    // Output role ARN
    new cdk.CfnOutput(this, 'EC2RoleArn', {
      value: this.ec2Role.roleArn,
      description: 'ARN of the EC2 instance role',
      exportName: `${this.stackName}-EC2RoleArn`,
    });
  }
}

export { SecurityStack };
```

## lib/database-stack.mjs
```javascript
import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

class DatabaseStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // DB Subnet Group for Aurora
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc: props.vpc,
      description: 'Subnet group for Aurora Serverless V2 cluster',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Aurora Serverless V2 MySQL cluster with automated backups
    this.auroraCluster = new rds.DatabaseCluster(this, 'AuroraServerlessV2Cluster', {
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_8_0_35,
      }),
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `aurora-credentials-${props.environmentSuffix}`,
        description: 'Aurora database admin credentials',
      }),
      serverlessV2MinCapacity: 0.5, // Minimum capacity for cost optimization
      serverlessV2MaxCapacity: 16, // Maximum capacity for scalability
      vpc: props.vpc,
      subnetGroup: dbSubnetGroup,
      writer: rds.ClusterInstance.serverlessV2('writer', {
        autoMinorVersionUpgrade: true,
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      }),
      readers: [
        rds.ClusterInstance.serverlessV2('reader', {
          scaleWithWriter: true,
          autoMinorVersionUpgrade: true,
          enablePerformanceInsights: true,
        }),
      ],
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'Sun:04:00-Sun:05:00',
      deletionProtection: true,
      storageEncrypted: true,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT,
      cloudwatchLogsExports: ['error', 'general', 'slowquery'],
    });

    // Output cluster information
    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.auroraCluster.clusterEndpoint.hostname,
      description: 'Aurora cluster endpoint',
      exportName: `${this.stackName}-ClusterEndpoint`,
    });

    new cdk.CfnOutput(this, 'ClusterReadEndpoint', {
      value: this.auroraCluster.clusterReadEndpoint.hostname,
      description: 'Aurora cluster read endpoint',
      exportName: `${this.stackName}-ClusterReadEndpoint`,
    });

    new cdk.CfnOutput(this, 'DatabaseSecretArn', {
      value: this.auroraCluster.secret.secretArn,
      description: 'ARN of the database credentials secret',
      exportName: `${this.stackName}-DatabaseSecretArn`,
    });
  }
}

export { DatabaseStack };
```

This infrastructure setup provides:

1. **Multi-AZ deployment** across 3 availability zones in us-east-1
2. **S3 bucket** with versioning, encryption, public access blocking, and lifecycle policies
3. **IAM role** for EC2 with minimal required permissions (SSM + CloudWatch Logs)
4. **Aurora Serverless V2** MySQL cluster with automated backups, encryption, and read replicas
5. **Scalable architecture** that can accommodate future expansion

The code follows CDK best practices with proper separation of concerns, outputs for cross-stack references, and includes error handling through CloudFormation's built-in mechanisms.