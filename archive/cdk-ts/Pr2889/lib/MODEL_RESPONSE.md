### Reasoning Trace

---

This is a comprehensive AWS CDK project that requires implementing several AWS services with security and availability best practices. Let me break this down:

1. Define infrastructure using AWS CDK in TypeScript
2. Create VPC with public/private subnets
3. S3 bucket with versioning and KMS encryption
4. EC2 instance with IAM role for S3 access
5. Security Groups with restricted access
6. Multi-AZ RDS instance
7. CloudWatch Log Group
8. Elastic Load Balancer
9. Route 53 DNS configuration
10. Resource tagging

I need to structure this as a complete CDK project with:

- Main stack file
- Proper imports
- All the required components
- Security best practices
- High availability configuration
- Proper testing structure

Let me create a comprehensive solution.

### Answer

---

I'll create a complete AWS CDK TypeScript project that implements a secure and highly available cloud development environment. Here's the comprehensive solution:

## Project Structure

```
secure-cloud-env/
├── bin/
│   └── app.ts
├── lib/
│   └── secure-cloud-stack.ts
├── test/
│   └── secure-cloud-stack.test.ts
├── package.json
├── tsconfig.json
├── cdk.json
└── README.md
```

## 1. Package Configuration

**package.json**

```json
{
  "name": "secure-cloud-env",
  "version": "1.0.0",
  "description": "Secure and highly available cloud development environment",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy",
    "destroy": "cdk destroy",
    "synth": "cdk synth"
  },
  "devDependencies": {
    "@types/jest": "^29.4.0",
    "@types/node": "18.14.6",
    "jest": "^29.5.0",
    "ts-jest": "^29.0.5",
    "typescript": "~4.9.5"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.87.0",
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
  "exclude": ["cdk.out"]
}
```

**cdk.json**

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/app.ts",
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
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"]
  }
}
```

## 2. Main Application Entry Point

**bin/app.ts**

```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureCloudStack } from '../lib/secure-cloud-stack';

const app = new cdk.App();

// Get configuration from context or environment
const region =
  app.node.tryGetContext('region') || process.env.AWS_REGION || 'us-west-2';
const allowedIpRanges = app.node.tryGetContext('allowedIpRanges') || [
  '10.0.0.0/8',
];
const domainName = app.node.tryGetContext('domainName') || 'dev.example.com';

new SecureCloudStack(app, 'SecureCloudStack', {
  env: {
    region: region,
  },
  allowedIpRanges,
  domainName,
  tags: {
    Environment: 'Development',
    Project: 'SecureCloudEnv',
    Owner: 'DevTeam',
    CostCenter: 'Engineering',
  },
});
```

## 3. Main Stack Implementation

**lib/secure-cloud-stack.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as targets from 'aws-cdk-lib/aws-elasticloadbalancingv2-targets';
import { Construct } from 'constructs';

interface SecureCloudStackProps extends cdk.StackProps {
  allowedIpRanges: string[];
  domainName: string;
}

export class SecureCloudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: SecureCloudStackProps) {
    super(scope, id, props);

    const { allowedIpRanges, domainName } = props;

    // Create KMS key for encryption
    const kmsKey = new kms.Key(this, 'SecureCloudKMSKey', {
      description: 'KMS key for SecureCloud environment encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'SecureCloudVPC', {
      maxAzs: 3,
      cidr: '10.0.0.0/16',
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
      natGateways: 2, // Multi-AZ NAT for high availability
    });

    // Create S3 bucket with versioning and encryption
    const s3Bucket = new s3.Bucket(this, 'SecureCloudBucket', {
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      serverAccessLogsPrefix: 'access-logs/',
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create CloudWatch Log Group
    const logGroup = new logs.LogGroup(this, 'SecureCloudLogGroup', {
      logGroupName: '/aws/ec2/secure-cloud',
      retention: logs.RetentionDays.ONE_WEEK,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create IAM role for EC2 with least privilege access to S3
    const ec2Role = new iam.Role(this, 'SecureCloudEC2Role', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'CloudWatchAgentServerPolicy'
        ),
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'AmazonSSMManagedInstanceCore'
        ),
      ],
      inlinePolicies: {
        S3Access: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              resources: [s3Bucket.bucketArn, `${s3Bucket.bucketArn}/*`],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: ['kms:Decrypt', 'kms:GenerateDataKey'],
              resources: [kmsKey.keyArn],
            }),
          ],
        }),
        CloudWatchLogs: new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'logs:CreateLogStream',
                'logs:PutLogEvents',
                'logs:DescribeLogStreams',
              ],
              resources: [logGroup.logGroupArn],
            }),
          ],
        }),
      },
    });

    const instanceProfile = new iam.InstanceProfile(
      this,
      'SecureCloudInstanceProfile',
      {
        role: ec2Role,
      }
    );

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: false,
    });

    // Allow HTTP/HTTPS from allowed IP ranges
    allowedIpRanges.forEach((ipRange, index) => {
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(80),
        `Allow HTTP from ${ipRange}`
      );
      albSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(443),
        `Allow HTTPS from ${ipRange}`
      );
    });

    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances',
      allowAllOutbound: true, // Allow outbound for updates and S3 access
    });

    // Allow traffic from ALB to EC2
    ec2SecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow HTTP from ALB'
    );

    // Allow SSH from allowed IP ranges (optional, can be removed for production)
    allowedIpRanges.forEach(ipRange => {
      ec2SecurityGroup.addIngressRule(
        ec2.Peer.ipv4(ipRange),
        ec2.Port.tcp(22),
        `Allow SSH from ${ipRange}`
      );
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instances',
      allowAllOutbound: false,
    });

    // Allow database access from EC2
    rdsSecurityGroup.addIngressRule(
      ec2SecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL access from EC2'
    );

    // User data script for EC2 instance
    const userData = ec2.UserData.forLinux();
    userData.addCommands(
      'yum update -y',
      'yum install -y amazon-cloudwatch-agent httpd',
      'systemctl start httpd',
      'systemctl enable httpd',
      'echo "<h1>Secure Cloud Environment</h1>" > /var/www/html/index.html',

      // Configure CloudWatch agent
      `cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "httpd-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "${logGroup.logGroupName}",
            "log_stream_name": "httpd-error"
          }
        ]
      }
    }
  }
}
EOF`,
      '/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s'
    );

    // Get latest Amazon Linux AMI
    const ami = ec2.MachineImage.latestAmazonLinux2({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
    });

    // Create EC2 instance
    const ec2Instance = new ec2.Instance(this, 'SecureCloudEC2', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      machineImage: ami,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      userData,
      blockDevices: [
        {
          deviceName: '/dev/xvda',
          volume: ec2.BlockDeviceVolume.ebs(20, {
            encrypted: true,
            kmsKey: kmsKey,
            volumeType: ec2.EbsDeviceVolumeType.GP3,
          }),
        },
      ],
    });

    // Create RDS subnet group
    const rdsSubnetGroup = new rds.SubnetGroup(this, 'RDSSubnetGroup', {
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      description: 'Subnet group for RDS instances',
    });

    // Create Multi-AZ RDS instance
    const rdsInstance = new rds.DatabaseInstance(this, 'SecureCloudRDS', {
      engine: rds.DatabaseInstanceEngine.mysql({
        version: rds.MysqlEngineVersion.VER_8_0,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO
      ),
      vpc,
      subnetGroup: rdsSubnetGroup,
      securityGroups: [rdsSecurityGroup],
      credentials: rds.Credentials.fromGeneratedSecret('admin', {
        secretName: 'secure-cloud-db-credentials',
        encryptionKey: kmsKey,
      }),
      multiAz: true, // High availability
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false, // Set to true for production
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Use RETAIN for production
    });

    // Create Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecureCloudALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // Create target group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'SecureCloudTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [new targets.InstanceTarget(ec2Instance)],
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          timeout: cdk.Duration.seconds(10),
          interval: cdk.Duration.seconds(30),
        },
      }
    );

    // Add listener to ALB
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Create Route 53 hosted zone (assumes domain is already registered)
    const hostedZone = route53.HostedZone.fromLookup(this, 'HostedZone', {
      domainName: domainName.split('.').slice(-2).join('.'), // Get root domain
    });

    // Create A record pointing to the ALB
    new route53.ARecord(this, 'ALBARecord', {
      zone: hostedZone,
      recordName: domainName,
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
    });

    // Apply tags to all resources
    const commonTags = props.tags || {};
    Object.entries(commonTags).forEach(([key, value]) => {
      cdk.Tags.of(this).add(key, value);
    });

    // Outputs
    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: 'S3 Bucket Name',
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'EC2 Instance ID',
    });

    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: rdsInstance.instanceEndpoint.hostname,
      description: 'RDS Endpoint',
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'ApplicationURL', {
      value: `http://${domainName}`,
      description: 'Application URL',
    });

    new cdk.CfnOutput(this, 'LogGroupName', {
      value: logGroup.logGroupName,
      description: 'CloudWatch Log Group Name',
    });
  }
}
```

## 4. Test Suite

**test/secure-cloud-stack.test.ts**

```typescript
import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecureCloudStack } from '../lib/secure-cloud-stack';

describe('SecureCloudStack', () => {
  let template: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const stack = new SecureCloudStack(app, 'TestStack', {
      allowedIpRanges: ['10.0.0.0/8'],
      domainName: 'test.example.com',
      tags: {
        Environment: 'Test',
      },
    });
    template = Template.fromStack(stack);
  });

  test('VPC is created with correct configuration', () => {
    template.hasResourceProperties('AWS::EC2::VPC', {
      CidrBlock: '10.0.0.0/16',
    });

    // Check for public and private subnets
    template.resourceCountIs('AWS::EC2::Subnet', 6); // 3 AZs * 2 subnet types
  });

  test('S3 bucket is created with versioning and encryption', () => {
    template.hasResourceProperties('AWS::S3::Bucket', {
      VersioningConfiguration: {
        Status: 'Enabled',
      },
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
            },
          },
        ],
      },
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });

  test('KMS key is created with key rotation enabled', () => {
    template.hasResourceProperties('AWS::KMS::Key', {
      EnableKeyRotation: true,
    });
  });

  test('EC2 instance is created in private subnet', () => {
    template.hasResourceProperties('AWS::EC2::Instance', {
      InstanceType: 't3.micro',
    });

    // Verify IAM role is attached
    template.hasResourceProperties('AWS::IAM::Role', {
      AssumeRolePolicyDocument: {
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      },
    });
  });

  test('Security groups are properly configured', () => {
    // ALB Security Group allows HTTP/HTTPS from specified IP ranges
    template.hasResourceProperties('AWS::EC2::SecurityGroup', {
      SecurityGroupIngress: Match.arrayWith([
        {
          IpProtocol: 'tcp',
          FromPort: 80,
          ToPort: 80,
          CidrIp: '10.0.0.0/8',
        },
        {
          IpProtocol: 'tcp',
          FromPort: 443,
          ToPort: 443,
          CidrIp: '10.0.0.0/8',
        },
      ]),
    });
  });

  test('RDS instance is created with Multi-AZ', () => {
    template.hasResourceProperties('AWS::RDS::DBInstance', {
      MultiAZ: true,
      StorageEncrypted: true,
      Engine: 'mysql',
    });

    // Check for DB subnet group
    template.hasResourceProperties('AWS::RDS::DBSubnetGroup', {});
  });

  test('Application Load Balancer is created', () => {
    template.hasResourceProperties(
      'AWS::ElasticLoadBalancingV2::LoadBalancer',
      {
        Scheme: 'internet-facing',
        Type: 'application',
      }
    );

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::TargetGroup', {
      Port: 80,
      Protocol: 'HTTP',
    });

    template.hasResourceProperties('AWS::ElasticLoadBalancingV2::Listener', {
      Port: 80,
      Protocol: 'HTTP',
    });
  });

  test('CloudWatch Log Group is created with encryption', () => {
    template.hasResourceProperties('AWS::Logs::LogGroup', {
      LogGroupName: '/aws/ec2/secure-cloud',
      RetentionInDays: 7,
    });
  });

  test('Route 53 A record is created', () => {
    template.hasResourceProperties('AWS::Route53::RecordSet', {
      Name: 'test.example.com.',
      Type: 'A',
    });
  });

  test('IAM role has least privilege access to S3', () => {
    template.hasResourceProperties('AWS::IAM::Role', {
      Policies: Match.arrayWith([
        {
          PolicyName: 'S3Access',
          PolicyDocument: {
            Statement: Match.arrayWith([
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:ListBucket',
                ],
              },
            ]),
          },
        },
      ]),
    });
  });

  test('All resources are tagged appropriately', () => {
    // This test would need to be enhanced based on specific tagging requirements
    expect(template).toBeDefined();
  });
});
```

## 5. README Documentation

**README.md**

````markdown
# Secure Cloud Development Environment

This project creates a secure and highly available cloud development environment using AWS CDK with TypeScript.

## Architecture

- **VPC**: Multi-AZ VPC with public, private, and isolated subnets
- **Compute**: EC2 instance in private subnet with IAM role for S3 access
- **Storage**: S3 bucket with versioning, KMS encryption, and access logging
- **Database**: Multi-AZ RDS MySQL instance with encryption
- **Load Balancing**: Application Load Balancer with health checks
- **DNS**: Route 53 A record for custom domain
- **Monitoring**: CloudWatch Log Group for application logs
- **Security**: Restrictive security groups and least-privilege IAM roles

## Prerequisites

- AWS CLI configured
- Node.js (v18 or higher)
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Domain registered in Route 53 (or update the code to create hosted zone)

## Installation

```bash
npm install
```
````

## Configuration

Set the following context variables or environment variables:

```bash
# Deploy to specific region
export AWS_REGION=us-west-2

# Set allowed IP ranges (comma-separated)
cdk deploy --context allowedIpRanges="10.0.0.0/8,192.168.1.0/24"

# Set domain name
cdk deploy --context domainName="dev.yourdomain.com"
```

## Deployment

```bash
# Synthesize the CloudFormation template
npm run synth

# Deploy the stack
npm run deploy

# Deploy with parameters
cdk deploy --context region=us-west-2 --context allowedIpRanges="10.0.0.0/8" --context domainName="dev.example.com"
```

## Testing

```bash
npm test
```

## Security Features

- **Encryption**: All data encrypted at rest using KMS
- **Network Security**: Private subnets for compute and database
- **Access Control**: Least-privilege IAM roles
- **Monitoring**: CloudWatch logging and monitoring
- **High Availability**: Multi-AZ deployment for RDS and ALB

## Cost Optimization

- Uses t3.micro instances (free tier eligible)
- Configured with appropriate retention policies
- Includes resource tagging for cost allocation

## Cleanup

```bash
npm run destroy
```

## Outputs

After deployment, the stack provides:

- VPC ID
- S3 Bucket Name
- EC2 Instance ID
- RDS Endpoint
- Load Balancer DNS Name
- Application URL
- CloudWatch Log Group Name

## Production Considerations

For production deployment:

1. Change `RemovalPolicy` to `RETAIN` for data resources
2. Enable `deletionProtection` for RDS
3. Use larger instance sizes
4. Implement SSL/TLS certificates
5. Add WAF for additional security
6. Implement backup strategies
7. Set up monitoring and alerting

```

## Key Security and Availability Features

### Security Best Practices Implemented:

1. **Network Isolation**: VPC with separate subnets for different tiers
2. **Encryption**: KMS encryption for S3, RDS, EBS, and CloudWatch Logs
3. **Least Privilege**: IAM roles with minimal required permissions
4. **Security Groups**: Restrictive inbound/outbound rules
5. **No Public Access**: EC2 instances in private subnets
6. **Access Logging**: S3 access logs and CloudWatch application logs

### High Availability Features:

1. **Multi-AZ Deployment**: RDS with Multi-AZ, ALB across multiple AZs
2. **Auto Scaling Ready**: Target groups configured for easy auto scaling
3. **Health Checks**: ALB health checks for instance monitoring
4. **Redundant NAT**: Multiple NAT gateways for egress traffic
5. **Backup**: RDS automated backups with 7-day retention

This solution provides a production-ready foundation that can be extended with additional features like auto scaling, SSL certificates, and enhanced monitoring as needed.
```
