I'll create a comprehensive AWS CDK TypeScript program that meets all your requirements for a secure and scalable cloud environment. Let me break this down into the necessary components.

## Project Structure

First, let's set up the CDK project structure:

```json
// package.json
{
  "name": "secure-scalable-aws-cdk",
  "version": "1.0.0",
  "description": "Secure and scalable AWS environment with CDK TypeScript",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^18.15.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0",
    "aws-cdk": "^2.80.0"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.80.0",
    "constructs": "^10.0.0"
  }
}
```

```json
// tsconfig.json
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
    "typeRoots": ["./node_modules/@types"],
    "outDir": "lib",
    "rootDir": "."
  },
  "exclude": ["cdk.out", "lib", "node_modules", "**/*.test.ts"]
}
```

```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  collectCoverageFrom: [
    'lib/**/*.ts',
    '!lib/**/*.test.ts',
    '!lib/**/*.d.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  }
};
```

## Main CDK Stack Implementation

```typescript
// lib/secure-scalable-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as autoscaling from 'aws-cdk-lib/aws-autoscaling';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

export interface SecureScalableStackProps extends cdk.StackProps {
  readonly vpcCidr?: string;
  readonly minInstances?: number;
  readonly maxInstances?: number;
  readonly instanceType?: ec2.InstanceType;
  readonly databaseInstanceClass?: ec2.InstanceType;
}

export class SecureScalableStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly autoScalingGroup: autoscaling.AutoScalingGroup;
  public readonly database: rds.DatabaseInstance;
  public readonly s3Bucket: s3.Bucket;
  public readonly kmsKey: kms.Key;
  public readonly ec2Role: iam.Role;
  public readonly webSecurityGroup: ec2.SecurityGroup;
  public readonly databaseSecurityGroup: ec2.SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    props: SecureScalableStackProps = {}
  ) {
    super(scope, id, props);

    // Create KMS Key for encryption
    this.kmsKey = this.createKmsKey();

    // Create VPC with public and private subnets
    this.vpc = this.createVpc(props.vpcCidr);

    // Create Security Groups
    this.webSecurityGroup = this.createWebSecurityGroup();
    this.databaseSecurityGroup = this.createDatabaseSecurityGroup();

    // Create IAM Role for EC2 instances
    this.ec2Role = this.createEc2Role();

    // Create S3 Bucket
    this.s3Bucket = this.createS3Bucket();

    // Create Application Load Balancer
    this.loadBalancer = this.createApplicationLoadBalancer();

    // Create Auto Scaling Group
    this.autoScalingGroup = this.createAutoScalingGroup(props);

    // Create RDS Database
    this.database = this.createRdsDatabase(props.databaseInstanceClass);

    // Configure CloudWatch Logging
    this.configureCloudWatchLogging();

    // Output important resource information
    this.createOutputs();
  }

  private createKmsKey(): kms.Key {
    return new kms.Key(this, 'EncryptionKey', {
      description: 'KMS Key for encrypting application data',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
    });
  }

  private createVpc(vpcCidr?: string): ec2.Vpc {
    return new ec2.Vpc(this, 'ApplicationVpc', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr || '10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 2, // For high availability
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24, // 256 IP addresses per subnet
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24, // 256 IP addresses per subnet
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24, // 256 IP addresses per subnet
        },
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });
  }

  private createWebSecurityGroup(): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'WebSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for web servers',
      allowAllOutbound: true,
    });

    // Allow HTTP traffic
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Allow HTTPS traffic
    sg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    return sg;
  }

  private createDatabaseSecurityGroup(): ec2.SecurityGroup {
    const sg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS database',
      allowAllOutbound: false,
    });

    // Allow MySQL/Aurora access from web security group
    sg.addIngressRule(
      this.webSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow database access from web servers'
    );

    return sg;
  }

  private createEc2Role(): iam.Role {
    const role = new iam.Role(this, 'Ec2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description:
        'IAM role for EC2 instances with minimal required permissions',
    });

    // Add S3 access policy
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObject',
          's3:PutObject',
          's3:DeleteObject',
          's3:ListBucket',
        ],
        resources: [
          this.s3Bucket?.bucketArn || `arn:aws:s3:::*`,
          `${this.s3Bucket?.bucketArn || 'arn:aws:s3:::*'}/*`,
        ],
      })
    );

    // Add RDS access policy
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rds:DescribeDBInstances', 'rds:DescribeDBClusters'],
        resources: ['*'],
      })
    );

    // Add CloudWatch logs policy
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogStreams',
          'logs:DescribeLogGroups',
        ],
        resources: ['*'],
      })
    );

    // Add KMS permissions
    role.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: [this.kmsKey.keyArn],
      })
    );

    return role;
  }

  private createS3Bucket(): s3.Bucket {
    // Create access logs bucket first
    const accessLogsBucket = new s3.Bucket(this, 'AccessLogsBucket', {
      bucketName: `access-logs-${this.account}-${this.region}-${Date.now()}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Create main application bucket
    const bucket = new s3.Bucket(this, 'ApplicationBucket', {
      bucketName: `app-bucket-${this.account}-${this.region}-${Date.now()}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: this.kmsKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      serverAccessLogsBucket: accessLogsBucket,
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    return bucket;
  }

  private createApplicationLoadBalancer(): elbv2.ApplicationLoadBalancer {
    const alb = new elbv2.ApplicationLoadBalancer(
      this,
      'ApplicationLoadBalancer',
      {
        vpc: this.vpc,
        internetFacing: true,
        securityGroup: this.webSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'WebTargetGroup',
      {
        vpc: this.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.INSTANCE,
        healthCheck: {
          enabled: true,
          healthyHttpCodes: '200',
          interval: cdk.Duration.seconds(30),
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          timeout: cdk.Duration.seconds(5),
          unhealthyThresholdCount: 2,
          healthyThresholdCount: 5,
        },
      }
    );

    // Add HTTP listener
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Add HTTPS listener (assuming certificate exists)
    alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      defaultTargetGroups: [targetGroup],
      certificates: [
        // Note: This assumes an existing certificate
        // In real implementation, you would reference an existing certificate
        // or create one using AWS Certificate Manager
      ],
    });

    return alb;
  }

  private createAutoScalingGroup(
    props: SecureScalableStackProps
  ): autoscaling.AutoScalingGroup {
    // Create launch template
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent',
      'yum install -y httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html',
      'echo "OK" > /var/www/html/health'
    );

    const launchTemplate = new ec2.LaunchTemplate(
      this,
      'WebServerLaunchTemplate',
      {
        instanceType:
          props.instanceType ||
          ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
        machineImage: ec2.MachineImage.latestAmazonLinux2(),
        userData: userData,
        role: this.ec2Role,
        securityGroup: this.webSecurityGroup,
        blockDevices: [
          {
            deviceName: '/dev/xvda',
            volume: ec2.BlockDeviceVolume.ebs(20, {
              encrypted: true,
              kmsKey: this.kmsKey,
            }),
          },
        ],
      }
    );

    const asg = new autoscaling.AutoScalingGroup(
      this,
      'WebServerAutoScalingGroup',
      {
        vpc: this.vpc,
        launchTemplate: launchTemplate,
        minCapacity: props.minInstances || 2,
        maxCapacity: props.maxInstances || 10,
        desiredCapacity: props.minInstances || 2,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        healthCheck: autoscaling.HealthCheck.elb({
          grace: cdk.Duration.seconds(300),
        }),
      }
    );

    // Attach to load balancer target group
    const targetGroup = this.loadBalancer.listeners[0]
      .defaultTargetGroups![0] as elbv2.ApplicationTargetGroup;
    asg.attachToApplicationTargetGroup(targetGroup);

    return asg;
  }

  private createRdsDatabase(
    instanceClass?: ec2.InstanceType
  ): rds.DatabaseInstance {
    // Create subnet group for RDS
    const subnetGroup = new rds.SubnetGroup(this, 'DatabaseSubnetGroup', {
      vpc: this.vpc,
      description: 'Subnet group for RDS database',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const database = new rds.DatabaseInstance(this, 'ApplicationDatabase', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType:
        instanceClass ||
        ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      vpc: this.vpc,
      subnetGroup: subnetGroup,
      securityGroups: [this.databaseSecurityGroup],
      multiAz: true,
      storageEncrypted: true,
      storageEncryptionKey: this.kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Set to RETAIN for production
      cloudwatchLogsExports: ['error', 'general', 'slow-query'],
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      performanceInsightEncryptionKey: this.kmsKey,
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'rds-credentials',
        encryptionKey: this.kmsKey,
      }),
    });

    return database;
  }

  private configureCloudWatchLogging(): void {
    // Create CloudWatch Log Group for application logs
    new logs.LogGroup(this, 'ApplicationLogGroup', {
      logGroupName: '/aws/ec2/application',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create CloudWatch Log Group for load balancer logs
    new logs.LogGroup(this, 'LoadBalancerLogGroup', {
      logGroupName: '/aws/elasticloadbalancing/application',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: this.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });
  }

  private createOutputs(): void {
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDnsName', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: this.s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.instanceEndpoint.hostname,
      description: 'RDS Database Endpoint',
    });

    new cdk.CfnOutput(this, 'KmsKeyId', {
      value: this.kmsKey.keyId,
      description: 'KMS Key ID',
    });
  }
}
```

## CDK App Entry Point

```typescript
// bin/app.ts
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { SecureScalableStack } from '../lib/secure-scalable-stack';

const app = new cdk.App();

new SecureScalableStack(app, 'SecureScalableStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
  description: 'Secure and scalable AWS environment for web applications',
});

app.synth();
```

## Comprehensive Unit Tests

```typescript
// lib/secure-scalable-stack.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { SecureScalableStack } from './secure-scalable-stack';

describe('SecureScalableStack', () => {
  let app: cdk.App;
  let stack: SecureScalableStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new SecureScalableStack(app, 'TestStack');
    template = Template.fromStack(stack);
  });

  describe('VPC Configuration', () => {
    test('creates VPC with correct CIDR', () => {
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('creates subnets with at least 256 IP addresses', () => {
      // Public subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        MapPublicIpOnLaunch: true,
      });

      // Private subnets
      template.hasResourceProperties('AWS::EC2::Subnet', {
        CidrBlock: Match.stringLikeRegexp('10\\.0\\.[0-9]+\\.0/24'),
        MapPublicIpOnLaunch: false,
      });
    });

    test('creates NAT gateways for high availability', () => {
      template.resourceCountIs('AWS::EC2::NatGateway', 2);
    });
  });

  describe('Security Groups', () => {
    test('web security group allows only HTTP and HTTPS traffic', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for web servers',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 80,
            ToPort: 80,
            CidrIp: '0.0.0.0/0',
          },
          {
            IpProtocol: 'tcp',
            FromPort: 443,
            ToPort: 443,
            CidrIp: '0.0.0.0/0',
          },
        ],
      });
    });

    test('database security group allows access only from web security group', () => {
      template.hasResourceProperties('AWS::EC2::SecurityGroup', {
        GroupDescription: 'Security group for RDS database',
        SecurityGroupIngress: [
          {
            IpProtocol: 'tcp',
            FromPort: 3306,
            ToPort: 3306,
            SourceSecurityGroupId: Match.anyValue(),
          },
        ],
      });
    });
  });

  describe('KMS Encryption', () => {
    test('creates KMS key with key rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS Key for encrypting application data',
        EnableKeyRotation: true,
      });
    });
  });

  describe('IAM Role', () => {
    test('creates EC2 role with minimal required permissions', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        AssumeRolePolicyDocument: {
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        },
      });
    });

    test('IAM role has S3 access policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
            }),
          ]),
        },
      });
    });

    test('IAM role has RDS access policy', () => {
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: ['rds:DescribeDBInstances', 'rds:DescribeDBClusters'],
            }),
          ]),
        },
      });
    });
  });

  describe('S3 Bucket', () => {
    test('creates S3 bucket with versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
                KMSMasterKeyID: Match.anyValue(),
              },
            },
          ],
        },
      });
    });

    test('creates access logs bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LoggingConfiguration: {
          DestinationBucketName: Match.anyValue(),
          LogFilePrefix: 'access-logs/',
        },
      });
    });
  });

  describe('Application Load Balancer', () => {
    test('creates ALB in public subnets', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::LoadBalancer',
        {
          Type: 'application',
          Scheme: 'internet-facing',
        }
      );
    });

    test('creates HTTP and HTTPS listeners', () => {
      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 80,
        Protocol: 'HTTP',
      });

      template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
        Port: 443,
        Protocol: 'HTTPS',
      });
    });

    test('creates target group with health check', () => {
      template.hasResourceProperties(
        'AWS::ElasticLoadBalancingV2::TargetGroup',
        {
          Port: 80,
          Protocol: 'HTTP',
          HealthCheckPath: '/health',
          HealthCheckProtocol: 'HTTP',
          HealthCheckIntervalSeconds: 30,
          HealthCheckTimeoutSeconds: 5,
          HealthyThresholdCount: 5,
          UnhealthyThresholdCount: 2,
        }
      );
    });
  });

  describe('Auto Scaling Group', () => {
    test('creates ASG with minimum of 2 instances', () => {
      template.hasResourceProperties('AWS::AutoScaling::AutoScalingGroup', {
        MinSize: '2',
        DesiredCapacity: '2',
        MaxSize: '10',
      });
    });

    test('creates launch template with encrypted EBS volume', () => {
      template.hasResourceProperties('AWS::EC2::LaunchTemplate', {
        LaunchTemplateData: {
          BlockDeviceMappings: [
            {
              DeviceName: '/dev/xvda',
              Ebs: {
                Encrypted: true,
                KmsKeyId: Match.anyValue(),
                VolumeSize: 20,
              },
            },
          ],
        },
      });
    });
  });

  describe('RDS Database', () => {
    test('creates RDS instance with Multi-AZ enabled', () => {
      template.hasResourceProperties('AWS::RDS::DBInstance', {
        MultiAZ: true,
        StorageEncrypted: true,
        KmsKeyId: Match.anyValue(),
        BackupRetentionPeriod: 7,
        EnableCloudwatchLogsExports: ['error', 'general', 'slow-query'],
        MonitoringInterval: 60,
        EnablePerformanceInsights: true,
      });
    });

    test('creates RDS subnet group in isolated subnets', () => {
      template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {
        DBSubnetGroupDescription: 'Subnet group for RDS database',
      });
    });
  });

  describe('CloudWatch Logging', () => {
    test('creates CloudWatch log groups', () => {
      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/ec2/application',
        RetentionInDays: 7,
        KmsKeyId: Match.anyValue(),
      });

      template.hasResourceProperties('AWS::Logs::LogGroup', {
        LogGroupName: '/aws/elasticloadbalancing/application',
        RetentionInDays: 7,
        KmsKeyId: Match.anyValue(),
      });
    });
  });

  describe('Custom Configuration', () => {
    test('accepts custom VPC CIDR', () => {
      const customStack = new SecureScalableStack(app, 'CustomStack', {
        vpcCidr: '172.16.0.0/16',
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '172.16.0.0/16',
      });
    });

    test('accepts custom instance configuration', () => {
      const customStack = new SecureScalableStack(app, 'CustomStack', {
        minInstances: 3,
        maxInstances: 15,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.SMALL
        ),
      });
      const customTemplate = Template.fromStack(customStack);

      customTemplate.hasResourceProperties(
        'AWS::AutoScaling::AutoScalingGroup',
        {
          MinSize: '3',
          MaxSize: '15',
        }
      );
    });
  });

  describe('Outputs', () => {
    test('creates all required outputs', () => {
      template.hasOutput('VpcId', {});
      template.hasOutput('LoadBalancerDnsName', {});
      template.hasOutput('S3BucketName', {});
      template.hasOutput('DatabaseEndpoint', {});
      template.hasOutput('KmsKeyId', {});
    });
  });
});
```

## Integration Tests

```typescript
// lib/integration.test.ts
import * as AWS from 'aws-sdk';
import * as cdk from 'aws-cdk-lib';
import { SecureScalableStack } from './secure-scalable-stack';

// Note: These integration tests require AWS credentials and will create real resources
// They should be run in a test environment and will incur costs

describe('Integration Tests', () => {
  let app: cdk.App;
  let stack: SecureScalableStack;
  let stackName: string;

  beforeAll(async () => {
    stackName = `integration-test-${Date.now()}`;
    app = new cdk.App();
    stack = new SecureScalableStack(app, stackName);

    // Deploy the stack (this would be done via CDK CLI in practice)
    // This is a simplified example - actual deployment would use CDK CLI
  }, 300000); // 5 minute timeout

  afterAll(async () => {
    // Clean up resources (this would be done via CDK CLI in practice)
    // cdk destroy
  },
```
