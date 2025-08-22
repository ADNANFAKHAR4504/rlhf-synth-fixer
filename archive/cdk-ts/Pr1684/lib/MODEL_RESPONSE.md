# Multi-Environment CDK Stack Solution

Here's a complete CDK TypeScript application that creates a consistent infrastructure across development, staging, and production environments:

## CDK App Structure

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

// Environment-specific configuration interface
interface EnvironmentConfig {
  environment: string;
  vpcCidr: string;
  instanceType: ec2.InstanceType;
  dbInstanceClass: rds.InstanceClass;
  dbAllocatedStorage: number;
  customAmiId?: string;
  bucketVersioning: boolean;
}

// Environment configurations
const environmentConfigs: Record<string, EnvironmentConfig> = {
  development: {
    environment: 'Development',
    vpcCidr: '10.0.0.0/16',
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
    dbInstanceClass: rds.InstanceClass.BURSTABLE3,
    dbAllocatedStorage: 20,
    bucketVersioning: false,
  },
  staging: {
    environment: 'Staging',
    vpcCidr: '10.1.0.0/16',
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.SMALL),
    dbInstanceClass: rds.InstanceClass.BURSTABLE3,
    dbAllocatedStorage: 50,
    bucketVersioning: true,
  },
  production: {
    environment: 'Production',
    vpcCidr: '10.2.0.0/16',
    instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MEDIUM),
    dbInstanceClass: rds.InstanceClass.BURSTABLE3,
    dbAllocatedStorage: 100,
    customAmiId: 'ami-0abcdef1234567890', // Custom production AMI
    bucketVersioning: true,
  },
};

export class MultiEnvironmentWebAppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & { config: EnvironmentConfig }) {
    super(scope, id, props);

    const { config } = props;
    const envPrefix = config.environment.toLowerCase();

    // Apply consistent tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', config.environment);
    cdk.Tags.of(this).add('Project', 'WebApplication');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'VPC', {
      vpcName: `${envPrefix}-webapp-vpc`,
      ipAddresses: ec2.IpAddresses.cidr(config.vpcCidr),
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: `${envPrefix}-public`,
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: `${envPrefix}-private`,
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: `${envPrefix}-isolated`,
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Group for Web Servers
    const webSecurityGroup = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      securityGroupName: `${envPrefix}-web-sg`,
      vpc,
      description: `Security group for ${config.environment} web servers`,
      allowAllOutbound: true,
    });

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    webSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access'
    );

    // Security Group for Database
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      securityGroupName: `${envPrefix}-db-sg`,
      vpc,
      description: `Security group for ${config.environment} database`,
      allowAllOutbound: false,
    });

    dbSecurityGroup.addIngressRule(
      webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from web servers'
    );

    // Key Pair for EC2 instances (you'll need to create this manually or import existing)
    const keyPair = ec2.KeyPair.fromKeyPairName(
      this,
      'KeyPair',
      `${envPrefix}-webapp-keypair`
    );

    // AMI Selection - use custom AMI if specified, otherwise use Amazon Linux 2
    const machineImage = config.customAmiId
      ? ec2.MachineImage.genericLinux({ 'us-east-1': config.customAmiId })
      : ec2.MachineImage.latestAmazonLinux2({
          generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
        });

    // User Data Script for Web Server Setup
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      `echo "<h1>Welcome to ${config.environment} Environment</h1>" > /var/www/html/index.html`,
      'echo "<p>Server is running successfully!</p>" >> /var/www/html/index.html'
    );

    // Launch Template for Web Servers
    const launchTemplate = new ec2.LaunchTemplate(this, 'WebServerLaunchTemplate', {
      launchTemplateName: `${envPrefix}-webapp-template`,
      instanceType: config.instanceType,
      machineImage,
      securityGroup: webSecurityGroup,
      keyPair,
      userData,
      role: this.createEC2Role(),
    });

    // Auto Scaling Group
    const autoScalingGroup = new cdk.aws_autoscaling.AutoScalingGroup(this, 'WebServerASG', {
      autoScalingGroupName: `${envPrefix}-webapp-asg`,
      vpc,
      launchTemplate,
      minCapacity: config.environment === 'Production' ? 2 : 1,
      maxCapacity: config.environment === 'Production' ? 6 : 3,
      desiredCapacity: config.environment === 'Production' ? 2 : 1,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Application Load Balancer
    const alb = new cdk.aws_elasticloadbalancingv2.ApplicationLoadBalancer(this, 'WebAppALB', {
      loadBalancerName: `${envPrefix}-webapp-alb`,
      vpc,
      internetFacing: true,
      securityGroup: webSecurityGroup,
    });

    const listener = alb.addListener('WebAppListener', {
      port: 80,
      open: true,
    });

    listener.addTargets('WebAppTargets', {
      targetGroupName: `${envPrefix}-webapp-targets`,
      port: 80,
      targets: [autoScalingGroup],
      healthCheckPath: '/',
      healthCheckIntervalSecs: 30,
    });

    // RDS Subnet Group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      subnetGroupName: `${envPrefix}-db-subnet-group`,
      description: `Database subnet group for ${config.environment}`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // RDS Database Instance
    const database = new rds.DatabaseInstance(this, 'Database', {
      instanceIdentifier: `${envPrefix}-webapp-db`,
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: config.dbInstanceClass,
      allocatedStorage: config.dbAllocatedStorage,
      storageType: rds.StorageType.GP2,
      vpc,
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      databaseName: 'webappdb',
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: `${envPrefix}-webapp-db-credentials`,
      }),
      backupRetention: config.environment === 'Production' ? cdk.Duration.days(7) : cdk.Duration.days(1),
      deleteAutomatedBackups: config.environment !== 'Production',
      deletionProtection: config.environment === 'Production',
      removalPolicy: config.environment === 'Production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for application assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      bucketName: `${envPrefix}-webapp-assets-${cdk.Aws.ACCOUNT_ID}`,
      versioned: config.bucketVersioning,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteIncompleteMultipartUploads',
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(1),
        },
        ...(config.environment !== 'Production' ? [{
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
        }] : []),
      ],
      removalPolicy: config.environment === 'Production' 
        ? cdk.RemovalPolicy.RETAIN 
        : cdk.RemovalPolicy.DESTROY,
    });

    // S3 Bucket for logs
    const logsBucket = new s3.Bucket(this, 'LogsBucket', {
      bucketName: `${envPrefix}-webapp-logs-${cdk.Aws.ACCOUNT_ID}`,
      versioned: false,
      publicReadAccess: false,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          expiration: cdk.Duration.days(config.environment === 'Production' ? 90 : 30),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // CloudWatch Log Group
    const logGroup = new cdk.aws_logs.LogGroup(this, 'WebAppLogGroup', {
      logGroupName: `/aws/webapp/${envPrefix}`,
      retention: config.environment === 'Production' 
        ? cdk.aws_logs.RetentionDays.ONE_MONTH 
        : cdk.aws_logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Output important information
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: `Load Balancer DNS for ${config.environment}`,
      exportName: `${envPrefix}-webapp-alb-dns`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: `Database endpoint for ${config.environment}`,
      exportName: `${envPrefix}-webapp-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'AssetsBucketName', {
      value: assetsBucket.bucketName,
      description: `Assets bucket name for ${config.environment}`,
      exportName: `${envPrefix}-webapp-assets-bucket`,
    });
  }

  private createEC2Role(): cdk.aws_iam.Role {
    const role = new cdk.aws_iam.Role(this, 'EC2Role', {
      roleName: `${this.stackName}-ec2-role`,
      assumedBy: new cdk.aws_iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchAgentServerPolicy'),
        cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore'),
      ],
    });

    // Add custom policy for S3 access
    role.addToPolicy(new cdk.aws_iam.PolicyStatement({
      effect: cdk.aws_iam.Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
        's3:DeleteObject',
      ],
      resources: [`arn:aws:s3:::*webapp-assets-*/*`],
    }));

    return role;
  }
}

// CDK App
const app = new cdk.App();

// Get environment from context or default to development
const envName = app.node.tryGetContext('environment') || 'development';
const config = environmentConfigs[envName];

if (!config) {
  throw new Error(`Unknown environment: ${envName}. Available environments: ${Object.keys(environmentConfigs).join(', ')}`);
}

new MultiEnvironmentWebAppStack(app, `WebApp-${config.environment}`, {
  config,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  stackName: `${envName}-webapp-stack`,
  description: `Web Application Stack for ${config.environment} environment`,
});
```

## Package.json Dependencies

```json
{
  "name": "multi-environment-webapp",
  "version": "1.0.0",
  "bin": {
    "multi-environment-webapp": "bin/app.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy:dev": "cdk deploy --context environment=development",
    "deploy:staging": "cdk deploy --context environment=staging",
    "deploy:prod": "cdk deploy --context environment=production"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "aws-cdk": "2.87.0",
    "ts-node": "^10.9.1",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "2.87.0",
    "constructs": "^10.0.0"
  }
}
```

## Key Features Explained

### 1. **Environment Configuration**
- Centralized configuration object with environment-specific values
- Different instance types, database sizes, and network CIDRs per environment
- Custom AMI support for production environment

### 2. **Consistent Resource Naming**
- All resources use environment prefix (e.g., `dev-`, `staging-`, `prod-`)
- Follows a consistent naming convention across all resources

### 3. **Comprehensive Tagging**
- Automatic tagging applied to all resources in the stack
- Environment, Project, and ManagedBy tags for proper resource management

### 4. **Infrastructure Components**
- **VPC** with public, private, and isolated subnets
- **Auto Scaling Group** with Application Load Balancer
- **RDS MySQL** database with appropriate security groups
- **S3 buckets** for assets and logs with lifecycle policies
- **CloudWatch** log groups for application logging

### 5. **Security Best Practices**
- Proper security group configurations
- IAM roles with least privilege access
- Database in isolated subnets
- S3 buckets with blocked public access

## Deployment Commands

```bash
# Install dependencies
npm install

# Deploy to different environments
npm run deploy:dev      # Development environment
npm run deploy:staging  # Staging environment  
npm run deploy:prod     # Production environment

# Or use CDK directly with context
cdk deploy --context environment=development
cdk deploy --context environment=staging
cdk deploy --context environment=production
```

## Prerequisites

1. **AWS CLI** configured with appropriate permissions
2. **CDK CLI** installed globally (`npm install -g aws-cdk`)
3. **Key pairs** created in AWS EC2 console for each environment:
   - `development-webapp-keypair`
   - `staging-webapp-keypair`
   - `production-webapp-keypair`

This solution provides a robust, scalable infrastructure that maintains consistency across environments while allowing for environment-specific customizations through parameterization.