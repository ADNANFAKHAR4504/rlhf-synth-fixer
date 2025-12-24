I'll create a complete TypeScript AWS CDK application that meets all your security requirements. Here's the structured implementation:

## Project Structure

```
tap-cdk-app/
├── bin/
│   └── tap.ts
├── lib/
│   └── tap-stack.ts
├── test/
│   ├── tap-stack.unit.test.ts
│   └── tap-stack.int.test.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

## 1. Package Configuration

**package.json**
```json
{
  "name": "tap",
  "version": "0.1.0",
  "license": "MIT",
  "engines": {
    "node": "22.17.0",
    "npm": ">=10.0.0"
  },
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest --coverage",
    "test:unit": "jest --coverage --testPathPattern=\\.unit\\.test\\.ts$",
    "test:integration": "jest --testPathPattern=\\.int\\.test\\.ts$ --testTimeout=30000",
    "cdk": "cdk",
    "cdk:synth": "npx cdk synth --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}",
    "cdk:deploy": "npx cdk deploy --all --require-approval never --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}",
    "cdk:destroy": "npx cdk destroy --all --force --context environmentSuffix=${ENVIRONMENT_SUFFIX:-dev}"
  },
  "devDependencies": {
    "@types/jest": "^29.5.14",
    "@types/node": "^24.0.11",
    "jest": "^29.7.0",
    "aws-cdk": "2.1020.2",
    "ts-jest": "^29.4.1",
    "ts-node": "10.9.2",
    "typescript": "^5.9.2"
  },
  "dependencies": {
    "aws-cdk-lib": "2.204.0",
    "constructs": "10.4.2",
    "source-map-support": "^0.5.21"
  }
}
```

## 2. Entry Point

**bin/tap.ts**
```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
```

## 3. Main Stack Implementation

**lib/tap-stack.ts**
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
    };

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, `TapKmsKey${environmentSuffix}`, {
      description: 'KMS key for TAP infrastructure encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For QA pipeline
    });

    cdk.Tags.of(kmsKey).add('Environment', commonTags.Environment);

    // Create VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, `TapVpc${environmentSuffix}`, {
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      natGateways: 2, // One per AZ for high availability
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
        },
      ],
    });

    cdk.Tags.of(vpc).add('Environment', commonTags.Environment);

    // Security Group for EC2 instances - strict HTTP/HTTPS only
    const ec2SecurityGroup = new ec2.SecurityGroup(
      this,
      `Ec2SecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for EC2 instances - HTTP/HTTPS only',
        allowAllOutbound: false, // We'll define specific outbound rules
      }
    );

    // Inbound rules - only HTTP and HTTPS
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Outbound rules - minimal necessary for system operations
    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow outbound HTTP for package updates'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow outbound HTTPS for package updates and AWS API calls'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(53),
      'Allow DNS queries'
    );

    ec2SecurityGroup.addEgressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.udp(53),
      'Allow DNS queries'
    );

    cdk.Tags.of(ec2SecurityGroup).add('Environment', commonTags.Environment);

    // Security Group for RDS - only allow EC2 access
    const rdsSecurityGroup = new ec2.SecurityGroup(
      this,
      `RdsSecurityGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Security group for RDS - EC2 access only',
        allowAllOutbound: false,
      }
    );

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2 instances'
    );

    cdk.Tags.of(rdsSecurityGroup).add('Environment', commonTags.Environment);

    // IAM Role for EC2 instances - least privilege
    const ec2Role = new iam.Role(this, `Ec2Role${environmentSuffix}`, {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'Minimal IAM role for EC2 instances',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
    });

    // Add minimal permissions for SSM Parameter Store access
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'ssm:GetParameter',
          'ssm:GetParameters',
          'ssm:GetParametersByPath',
        ],
        resources: [
          `arn:aws:ssm:${this.region}:${this.account}:parameter/tap/*`,
        ],
      })
    );

    // Add CloudWatch logs permissions for monitoring
    ec2Role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/ec2/tap*`,
        ],
      })
    );

    cdk.Tags.of(ec2Role).add('Environment', commonTags.Environment);

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(
      this,
      `TapLaunchTemplate${environmentSuffix}`,
      {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        machineImage: ec2.MachineImage.latestAmazonLinux2023(),
        securityGroup: ec2SecurityGroup,
        role: ec2Role,
        userData: ec2.UserData.forLinux(),
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: kmsKey,
            }),
          },
        ],
      }
    );

    cdk.Tags.of(launchTemplate).add('Environment', commonTags.Environment);

    // Create EC2 instances in private subnets
    const ec2Instances: ec2.Instance[] = [];
    const privateSubnets = vpc.privateSubnets;

    for (let i = 0; i < privateSubnets.length; i++) {
      const instance = new ec2.Instance(
        this,
        `TapInstance${i + 1}${environmentSuffix}`,
        {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T3,
            ec2.InstanceSize.MICRO
          ),
          machineImage: ec2.MachineImage.latestAmazonLinux2023(),
          vpc,
          vpcSubnets: {
            subnets: [privateSubnets[i]],
          },
          securityGroup: ec2SecurityGroup,
          role: ec2Role,
          blockDevices: [
            {
              deviceName: '/dev/xvda',
              volume: ec2.BlockDeviceVolume.ebs(20, {
                encrypted: true,
                kmsKey: kmsKey,
              }),
            },
          ],
          userData: ec2.UserData.forLinux(),
        }
      );

      cdk.Tags.of(instance).add('Environment', commonTags.Environment);
      cdk.Tags.of(instance).add(
        'Name',
        `TAP-Instance-${i + 1}-${environmentSuffix}`
      );
      ec2Instances.push(instance);
    }

    // Subnet Group for RDS in isolated subnets
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `TapDbSubnetGroup${environmentSuffix}`,
      {
        vpc,
        description: 'Subnet group for TAP RDS database',
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    cdk.Tags.of(dbSubnetGroup).add('Environment', commonTags.Environment);

    // RDS Parameter Group for enhanced security
    const parameterGroup = new rds.ParameterGroup(
      this,
      `TapDbParameterGroup${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_3,
        }),
        description: 'Parameter group for TAP PostgreSQL database',
        parameters: {
          log_statement: 'all',
          log_min_duration_statement: '1000',
          shared_preload_libraries: 'pg_stat_statements',
        },
      }
    );

    cdk.Tags.of(parameterGroup).add('Environment', commonTags.Environment);

    // RDS Database Instance - highly available with encryption
    const database = new rds.DatabaseInstance(
      this,
      `TapDatabase${environmentSuffix}`,
      {
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_3,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc,
        subnetGroup: dbSubnetGroup,
        securityGroups: [rdsSecurityGroup],

        // High Availability Configuration
        multiAz: true,

        // Storage Configuration with Encryption
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: rds.StorageType.GP2,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,

        // Security Configuration
        databaseName: 'tapdb',
        credentials: rds.Credentials.fromGeneratedSecret(
          `tapdbadmin${environmentSuffix}`,
          {
            encryptionKey: kmsKey,
          }
        ),

        // Backup Configuration
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: false,
        deletionProtection: false, // Disabled for QA pipeline

        // Monitoring
        monitoringInterval: cdk.Duration.seconds(60),
        enablePerformanceInsights: true,
        performanceInsightEncryptionKey: kmsKey,

        // Parameter Group
        parameterGroup: parameterGroup,

        // Maintenance
        autoMinorVersionUpgrade: true,
        allowMajorVersionUpgrade: false,

        removalPolicy: cdk.RemovalPolicy.DESTROY, // Changed to DESTROY for QA pipeline
      }
    );

    cdk.Tags.of(database).add('Environment', commonTags.Environment);

    // Allow EC2 security group to access RDS
    database.connections.allowFrom(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'EC2 to RDS access'
    );

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: kmsKey.keyId,
      description: 'KMS Key ID for encryption',
    });

    // Output EC2 instance IDs
    ec2Instances.forEach((instance, index) => {
      new cdk.CfnOutput(this, `Ec2Instance${index + 1}Id`, {
        value: instance.instanceId,
        description: `EC2 Instance ${index + 1} ID`,
      });
    });
  }
}
```

## Key Security Features Implemented

### 1. **Environment Suffix Integration**
- All resources include environment suffix to prevent deployment conflicts
- Configurable via `environmentSuffix` property or defaults to 'dev'
- Enables multiple parallel deployments to same AWS account

### 2. **Network Security**
- VPC with isolated database subnets
- Security groups with minimal required ports (80, 443)
- No direct internet access to database tier
- NAT Gateways for secure outbound connectivity

### 3. **Encryption**
- KMS key with automatic rotation
- RDS storage encryption
- EBS volume encryption
- Encrypted database credentials using AWS Secrets Manager

### 4. **IAM Least Privilege**
- EC2 role with minimal SSM and CloudWatch permissions
- No broad permissions granted
- Specific resource ARN restrictions

### 5. **High Availability**
- Multi-AZ RDS deployment
- EC2 instances across multiple availability zones
- NAT gateways in each AZ

### 6. **QA Pipeline Compatibility**
- Resources configured for easy cleanup (DESTROY removal policies)
- Deletion protection disabled for automated testing
- Environment suffix prevents resource naming conflicts

### 7. **Monitoring & Backup**
- RDS Performance Insights enabled
- 7-day backup retention
- CloudWatch integration
- Enhanced monitoring with 60-second intervals

## Deployment Instructions

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Build the project:**
   ```bash
   npm run build
   ```

3. **Run tests:**
   ```bash
   npm run test:unit
   npm run test:integration
   ```

4. **Deploy the stack:**
   ```bash
   export ENVIRONMENT_SUFFIX=myenv
   npx cdk bootstrap
   npx cdk deploy --context environmentSuffix=$ENVIRONMENT_SUFFIX
   ```

This implementation provides a production-ready, highly secure infrastructure that follows AWS best practices for security, encryption, and least privilege access while supporting automated QA pipelines through proper environment suffix handling and resource cleanup capabilities.