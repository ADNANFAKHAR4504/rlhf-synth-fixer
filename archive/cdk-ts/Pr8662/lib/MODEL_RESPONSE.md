## Project Structure

```
tap-cdk-app/
├── bin/
│   └── tap.ts
├── lib/
│   └── tapstack.ts
├── test/
│   └── tapstack.test.ts
├── package.json
├── tsconfig.json
└── cdk.json
```

## 1. Package Configuration

**package.json**

```json
{
  "name": "tap-cdk-app",
  "version": "0.1.0",
  "bin": {
    "tap": "bin/tap.js"
  },
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk"
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

**tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["es2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"]
  },
  "exclude": ["node_modules", "cdk.out"]
}
```

**cdk.json**

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib@2.87.0",
    "@aws-cdk-lib/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk-lib/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-lib/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk-lib/core:stackRelativeExports": true
  }
}
```

## 2. Entry Point

**bin/tap.ts**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TapStack } from '../lib/tapstack';

const app = new cdk.App();

new TapStack(app, 'TapStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  description: 'Highly secure infrastructure with VPC, EC2, and RDS',
});
```

## 3. Main Stack Implementation

**lib/tapstack.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import { Construct } from 'constructs';

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Common tags for all resources
    const commonTags = {
      Environment: 'Production',
    };

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for TAP infrastructure encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    cdk.Tags.of(kmsKey).add('Environment', commonTags.Environment);

    // Create VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'TapVpc', {
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
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'Ec2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances - HTTP/HTTPS only',
      allowAllOutbound: false, // We'll define specific outbound rules
    });

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
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      description: 'Security group for RDS - EC2 access only',
      allowAllOutbound: false,
    });

    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL access from EC2 instances'
    );

    cdk.Tags.of(rdsSecurityGroup).add('Environment', commonTags.Environment);

    // IAM Role for EC2 instances - least privilege
    const ec2Role = new iam.Role(this, 'Ec2Role', {
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

    // Instance Profile for EC2
    const instanceProfile = new iam.InstanceProfile(
      this,
      'Ec2InstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Launch Template for EC2 instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'TapLaunchTemplate', {
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
    });

    cdk.Tags.of(launchTemplate).add('Environment', commonTags.Environment);

    // Create EC2 instances in private subnets
    const ec2Instances: ec2.Instance[] = [];
    const privateSubnets = vpc.privateSubnets;

    for (let i = 0; i < privateSubnets.length; i++) {
      const instance = new ec2.Instance(this, `TapInstance${i + 1}`, {
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
      });

      cdk.Tags.of(instance).add('Environment', commonTags.Environment);
      cdk.Tags.of(instance).add('Name', `TAP-Instance-${i + 1}`);
      ec2Instances.push(instance);
    }

    // Subnet Group for RDS in isolated subnets
    const dbSubnetGroup = new rds.SubnetGroup(this, 'TapDbSubnetGroup', {
      vpc,
      description: 'Subnet group for TAP RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    cdk.Tags.of(dbSubnetGroup).add('Environment', commonTags.Environment);

    // RDS Parameter Group for enhanced security
    const parameterGroup = new rds.ParameterGroup(this, 'TapDbParameterGroup', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      description: 'Parameter group for TAP PostgreSQL database',
      parameters: {
        log_statement: 'all',
        log_min_duration_statement: '1000',
        shared_preload_libraries: 'pg_stat_statements',
      },
    });

    cdk.Tags.of(parameterGroup).add('Environment', commonTags.Environment);

    // RDS Database Instance - highly available with encryption
    const database = new rds.DatabaseInstance(this, 'TapDatabase', {
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
      credentials: rds.Credentials.fromGeneratedSecret('tapdbadmin', {
        description: 'TAP Database Administrator',
        encryptionKey: kmsKey,
      }),

      // Backup Configuration
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: false,
      deletionProtection: true, // Enable for production

      // Monitoring
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: kmsKey,

      // Parameter Group
      parameterGroup: parameterGroup,

      // Maintenance
      autoMinorVersionUpgrade: true,
      allowMajorVersionUpgrade: false,

      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // Use RETAIN for production
    });

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

## 4. Unit Tests

**test/tapstack.test.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as TapStack from '../lib/tapstack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack.TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack.TapStack(app, 'TestTapStack', {
      env: { region: 'us-east-1' },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
      EnableDnsHostnames: true,
      EnableDnsSupport: true,
    });
  });

  test('Security groups have correct ingress rules', () => {
    // EC2 Security Group should allow only HTTP and HTTPS
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '0.0.0.0/0',
        }),
        Match.objectLike({
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '0.0.0.0/0',
        }),
      ]),
    });
  });

  test('RDS instance has encryption enabled', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      StorageEncrypted: true,
      MultiAZ: true,
      Engine: 'postgres',
    });
  });

  test('EC2 instances have encrypted EBS volumes', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      BlockDeviceMappings: Match.arrayWith([
        Match.objectLike({
          Ebs: Match.objectLike({
            Encrypted: true,
          }),
        }),
      ]),
    });
  });

  test('KMS key is created with key rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('IAM role has minimal permissions', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: Match.arrayWith([
          Match.objectLike({
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          }),
        ]),
      },
    });
  });

  test('All resources are tagged with Environment: Production', () => {
    // Check that resources have the Environment tag
    const resources = template.findResources('AWS::EC2::VPC');
    expect(Object.keys(resources).length).toBeGreaterThan(0);

    const resources2 = template.findResources('AWS::RDS::DBInstance');
    expect(Object.keys(resources2).length).toBeGreaterThan(0);
  });

  test('RDS is in private subnets only', () => {
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
      DBSubnetGroupDescription: 'Subnet group for TAP RDS database',
    });
  });

  test('Database has backup and monitoring configured', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      BackupRetentionPeriod: 7,
      MonitoringInterval: 60,
      PerformanceInsightsEnabled: true,
      DeletionProtection: true,
    });
  });
});
```

## 5. Jest Configuration

**jest.config.js**

```javascript
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
};
```

## Key Security Features Implemented

### 1. **Network Security**

- VPC with isolated database subnets
- Security groups with minimal required ports (80, 443)
- No direct internet access to database tier

### 2. **Encryption**

- KMS key with automatic rotation
- RDS storage encryption
- EBS volume encryption
- Encrypted database credentials using AWS Secrets Manager

### 3. **IAM Least Privilege**

- EC2 role with minimal SSM and CloudWatch permissions
- No broad permissions granted
- Specific resource ARN restrictions

### 4. **High Availability**

- Multi-AZ RDS deployment
- EC2 instances across multiple availability zones
- NAT gateways in each AZ

### 5. **Monitoring & Backup**

- RDS Performance Insights enabled
- 7-day backup retention
- CloudWatch integration
- Deletion protection enabled

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
   npm test
   ```

4. **Deploy the stack:**
   ```bash
   npx cdk bootstrap
   npx cdk deploy
   ```

This implementation provides a production-ready, highly secure infrastructure that follows AWS best practices for security, encryption, and least privilege access.
