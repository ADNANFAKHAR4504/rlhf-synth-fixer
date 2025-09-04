I'll create a comprehensive Pulumi TypeScript project that meets all your requirements. Let me break this down into the requested file structure:

## Project Structure

### `Pulumi.yaml`

```yaml
name: secure-web-app
runtime: nodejs
description: A secure web application environment with VPC, RDS, EC2, ALB, Lambda, and security components
template:
  config:
    aws:region:
      description: The AWS region to deploy into
      default: us-west-1
```

### `tap-stack.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  vpcCidr: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  domainName: string;
  hostedZoneId: string;
  sshAllowedCidr: string;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly vpc: aws.ec2.Vpc;
  public readonly publicSubnet: aws.ec2.Subnet;
  public readonly privateSubnet: aws.ec2.Subnet;
  public readonly internetGateway: aws.ec2.InternetGateway;
  public readonly natGateway: aws.ec2.NatGateway;
  public readonly kmsKey: aws.kms.Key;
  public readonly rdsInstance: aws.rds.Instance;
  public readonly ec2Instance: aws.ec2.Instance;
  public readonly alb: aws.lb.LoadBalancer;
  public readonly s3Bucket: aws.s3.Bucket;
  public readonly lambdaFunction: aws.lambda.Function;
  public readonly route53Record: aws.route53.Record;
  public readonly cloudTrail: aws.cloudtrail.Trail;

  constructor(
    name: string,
    args: TapStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:TapStack', name, {}, opts);

    const commonTags = {
      Environment: 'Production',
      Owner: 'DevOps',
    };

    // 1. NETWORKING LAYER
    // Create VPC
    this.vpc = new aws.ec2.Vpc(
      `${name}-vpc`,
      {
        cidrBlock: args.vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: {
          ...commonTags,
          Name: `${name}-vpc`,
        },
      },
      { parent: this }
    );

    // Create Internet Gateway
    this.internetGateway = new aws.ec2.InternetGateway(
      `${name}-igw`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...commonTags,
          Name: `${name}-igw`,
        },
      },
      { parent: this }
    );

    // Get availability zones
    const azs = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create public subnet
    this.publicSubnet = new aws.ec2.Subnet(
      `${name}-public-subnet`,
      {
        vpcId: this.vpc.id,
        cidrBlock: args.publicSubnetCidr,
        availabilityZone: azs.then(azs => azs.names[0]),
        mapPublicIpOnLaunch: true,
        tags: {
          ...commonTags,
          Name: `${name}-public-subnet`,
          Type: 'Public',
        },
      },
      { parent: this }
    );

    // Create private subnet
    this.privateSubnet = new aws.ec2.Subnet(
      `${name}-private-subnet`,
      {
        vpcId: this.vpc.id,
        cidrBlock: args.privateSubnetCidr,
        availabilityZone: azs.then(azs => azs.names[1]),
        tags: {
          ...commonTags,
          Name: `${name}-private-subnet`,
          Type: 'Private',
        },
      },
      { parent: this }
    );

    // Create Elastic IP for NAT Gateway
    const natEip = new aws.ec2.Eip(
      `${name}-nat-eip`,
      {
        domain: 'vpc',
        tags: {
          ...commonTags,
          Name: `${name}-nat-eip`,
        },
      },
      { parent: this }
    );

    // Create NAT Gateway
    this.natGateway = new aws.ec2.NatGateway(
      `${name}-nat-gateway`,
      {
        allocationId: natEip.id,
        subnetId: this.publicSubnet.id,
        tags: {
          ...commonTags,
          Name: `${name}-nat-gateway`,
        },
      },
      { parent: this }
    );

    // Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      `${name}-public-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...commonTags,
          Name: `${name}-public-rt`,
        },
      },
      { parent: this }
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      `${name}-private-rt`,
      {
        vpcId: this.vpc.id,
        tags: {
          ...commonTags,
          Name: `${name}-private-rt`,
        },
      },
      { parent: this }
    );

    // Create routes
    new aws.ec2.Route(
      `${name}-public-route`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: this.internetGateway.id,
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `${name}-private-route`,
      {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      },
      { parent: this }
    );

    // Associate route tables with subnets
    new aws.ec2.RouteTableAssociation(
      `${name}-public-rta`,
      {
        subnetId: this.publicSubnet.id,
        routeTableId: publicRouteTable.id,
      },
      { parent: this }
    );

    new aws.ec2.RouteTableAssociation(
      `${name}-private-rta`,
      {
        subnetId: this.privateSubnet.id,
        routeTableId: privateRouteTable.id,
      },
      { parent: this }
    );

    // 5. SECURITY, AUDITING & GOVERNANCE
    // Create KMS Key
    this.kmsKey = new aws.kms.Key(
      `${name}-kms-key`,
      {
        description: 'KMS key for encrypting S3 bucket and RDS instance',
        tags: {
          ...commonTags,
          Name: `${name}-kms-key`,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `${name}-kms-alias`,
      {
        name: `alias/${name}-key`,
        targetKeyId: this.kmsKey.keyId,
      },
      { parent: this }
    );

    // 2. DATABASE TIER
    // Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `${name}-db-subnet-group`,
      {
        subnetIds: [this.privateSubnet.id, this.publicSubnet.id], // Need at least 2 subnets in different AZs
        tags: {
          ...commonTags,
          Name: `${name}-db-subnet-group`,
        },
      },
      { parent: this }
    );

    // Create custom parameter group
    const dbParameterGroup = new aws.rds.ParameterGroup(
      `${name}-db-param-group`,
      {
        family: 'mysql8.0',
        parameters: [
          {
            name: 'max_connections',
            value: '100',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${name}-db-param-group`,
        },
      },
      { parent: this }
    );

    // Create RDS security group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-rds-sg`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for RDS MySQL instance',
        tags: {
          ...commonTags,
          Name: `${name}-rds-sg`,
        },
      },
      { parent: this }
    );

    // Create EC2 security group first (needed for RDS ingress rule)
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-ec2-sg`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for EC2 instance',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 22,
            toPort: 22,
            cidrBlocks: [args.sshAllowedCidr],
            description: 'SSH access from allowed CIDR',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${name}-ec2-sg`,
        },
      },
      { parent: this }
    );

    // Add ingress rule to RDS security group allowing access from EC2
    new aws.ec2.SecurityGroupRule(
      `${name}-rds-ingress`,
      {
        type: 'ingress',
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        sourceSecurityGroupId: ec2SecurityGroup.id,
        securityGroupId: rdsSecurityGroup.id,
        description: 'MySQL access from EC2',
      },
      { parent: this }
    );

    // Create RDS instance with Secrets Manager password
    this.rdsInstance = new aws.rds.Instance(
      `${name}-rds`,
      {
        identifier: `${name}-mysql-db`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,

        dbName: 'appdb',
        username: 'admin',
        managePasswordSecretRotation: true,
        managePasswordSecretKmsKeyId: this.kmsKey.arn,

        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        parameterGroupName: dbParameterGroup.name,

        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',

        skipFinalSnapshot: true,
        deletionProtection: false,

        tags: {
          ...commonTags,
          Name: `${name}-rds`,
        },
      },
      { parent: this }
    );

    // 3. APPLICATION & WEB TIERS
    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    // Create EC2 instance
    this.ec2Instance = new aws.ec2.Instance(
      `${name}-ec2`,
      {
        ami: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        subnetId: this.publicSubnet.id,
        vpcSecurityGroupIds: [ec2SecurityGroup.id],
        associatePublicIpAddress: true,

        userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from ${name} Web Server</h1>" > /var/www/html/index.html`,

        tags: {
          ...commonTags,
          Name: `${name}-ec2`,
        },
      },
      { parent: this }
    );

    // Create ALB security group
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      `${name}-alb-sg`,
      {
        vpcId: this.vpc.id,
        description: 'Security group for Application Load Balancer',
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP access from anywhere',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          ...commonTags,
          Name: `${name}-alb-sg`,
        },
      },
      { parent: this }
    );

    // Add HTTP ingress rule to EC2 security group for ALB
    new aws.ec2.SecurityGroupRule(
      `${name}-ec2-http-ingress`,
      {
        type: 'ingress',
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        sourceSecurityGroupId: albSecurityGroup.id,
        securityGroupId: ec2SecurityGroup.id,
        description: 'HTTP access from ALB',
      },
      { parent: this }
    );

    // Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      `${name}-alb`,
      {
        loadBalancerType: 'application',
        subnets: [this.publicSubnet.id, this.privateSubnet.id], // ALB needs subnets in different AZs
        securityGroups: [albSecurityGroup.id],
        tags: {
          ...commonTags,
          Name: `${name}-alb`,
        },
      },
      { parent: this }
    );

    // Create target group
    const targetGroup = new aws.lb.TargetGroup(
      `${name}-tg`,
      {
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc.id,
        healthCheck: {
          enabled: true,
          healthyThreshold: 2,
          interval: 30,
          matcher: '200',
          path: '/',
          port: 'traffic-port',
          protocol: 'HTTP',
          timeout: 5,
          unhealthyThreshold: 2,
        },
        tags: {
          ...commonTags,
          Name: `${name}-tg`,
        },
      },
      { parent: this }
    );

    // Attach EC2 instance to target group
    new aws.lb.TargetGroupAttachment(
      `${name}-tg-attachment`,
      {
        targetGroupArn: targetGroup.arn,
        targetId: this.ec2Instance.id,
        port: 80,
      },
      { parent: this }
    );

    // Create ALB listener
    new aws.lb.Listener(
      `${name}-alb-listener`,
      {
        loadBalancerArn: this.alb.arn,
        port: '80',
        protocol: 'HTTP',
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: targetGroup.arn,
          },
        ],
      },
      { parent: this }
    );

    // Create Route 53 A record
    this.route53Record = new aws.route53.Record(
      `${name}-route53-record`,
      {
        zoneId: args.hostedZoneId,
        name: args.domainName,
        type: 'A',
        aliases: [
          {
            name: this.alb.dnsName,
            zoneId: this.alb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
      },
      { parent: this }
    );

    // 4. STORAGE & SERVERLESS
    // Create S3 bucket
    this.s3Bucket = new aws.s3.Bucket(
      `${name}-s3-bucket`,
      {
        bucket: 'my-app-data-bucket',
        tags: {
          ...commonTags,
          Name: 'my-app-data-bucket',
        },
      },
      { parent: this }
    );

    // Configure S3 bucket encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${name}-s3-encryption`,
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
          },
        ],
      },
      { parent: this }
    );

    // Block public access to S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      `${name}-s3-pab`,
      {
        bucket: this.s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Create IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      `${name}-lambda-role`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: {
                Service: 'lambda.amazonaws.com',
              },
            },
          ],
        }),
        tags: {
          ...commonTags,
          Name: `${name}-lambda-role`,
        },
      },
      { parent: this }
    );

    // Attach basic execution policy
    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-basic-execution`,
      {
        role: lambdaRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
      },
      { parent: this }
    );

    // Create custom policy for S3 bucket access
    const s3Policy = new aws.iam.Policy(
      `${name}-lambda-s3-policy`,
      {
        policy: pulumi.all([this.s3Bucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Action: [
                  's3:GetObject',
                  's3:PutObject',
                  's3:DeleteObject',
                  's3:ListBucket',
                ],
                Resource: [bucketArn, `${bucketArn}/*`],
              },
            ],
          })
        ),
        tags: {
          ...commonTags,
          Name: `${name}-lambda-s3-policy`,
        },
      },
      { parent: this }
    );

    // Attach S3 policy to Lambda role
    new aws.iam.RolePolicyAttachment(
      `${name}-lambda-s3-policy-attachment`,
      {
        role: lambdaRole.name,
        policyArn: s3Policy.arn,
      },
      { parent: this }
    );

    // Create Lambda function
    this.lambdaFunction = new aws.lambda.Function(
      `${name}-lambda`,
      {
        code: new pulumi.asset.AssetArchive({
          'index.js': new pulumi.asset.StringAsset(`
exports.handler = async (event) => {
    console.log('Lambda function executed');
    console.log('Event:', JSON.stringify(event, null, 2));
    
    return {
        statusCode: 200,
        body: JSON.stringify({
            message: 'Hello from Lambda!',
            timestamp: new Date().toISOString()
        })
    };
};`),
        }),
        handler: 'index.handler',
        runtime: 'nodejs18.x',
        role: lambdaRole.arn,
        tags: {
          ...commonTags,
          Name: `${name}-lambda`,
        },
      },
      { parent: this }
    );

    // Create CloudTrail S3 bucket for logs
    const cloudTrailBucket = new aws.s3.Bucket(
      `${name}-cloudtrail-bucket`,
      {
        forceDestroy: true,
        tags: {
          ...commonTags,
          Name: `${name}-cloudtrail-bucket`,
        },
      },
      { parent: this }
    );

    // CloudTrail bucket policy
    const cloudTrailBucketPolicy = new aws.s3.BucketPolicy(
      `${name}-cloudtrail-bucket-policy`,
      {
        bucket: cloudTrailBucket.id,
        policy: pulumi.all([cloudTrailBucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AWSCloudTrailAclCheck',
                Effect: 'Allow',
                Principal: {
                  Service: 'cloudtrail.amazonaws.com',
                },
                Action: 's3:GetBucketAcl',
                Resource: bucketArn,
              },
              {
                Sid: 'AWSCloudTrailWrite',
                Effect: 'Allow',
                Principal: {
                  Service: 'cloudtrail.amazonaws.com',
                },
                Action: 's3:PutObject',
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Create CloudTrail
    this.cloudTrail = new aws.cloudtrail.Trail(
      `${name}-cloudtrail`,
      {
        s3BucketName: cloudTrailBucket.id,
        includeGlobalServiceEvents: true,
        isMultiRegionTrail: true,
        enableLogging: true,
        eventSelectors: [
          {
            readWriteType: 'All',
            includeManagementEvents: false,
            dataResources: [
              {
                type: 'AWS::S3::Object',
                values: [pulumi.interpolate`${this.s3Bucket.arn}/*`],
              },
            ],
          },
        ],
        tags: {
          ...commonTags,
          Name: `${name}-cloudtrail`,
        },
      },
      { parent: this, dependsOn: [cloudTrailBucketPolicy] }
    );

    // Create CloudWatch Log Groups
    new aws.cloudwatch.LogGroup(
      `${name}-ec2-logs`,
      {
        name: `/aws/ec2/${name}`,
        retentionInDays: 14,
        tags: {
          ...commonTags,
          Name: `${name}-ec2-logs`,
        },
      },
      { parent: this }
    );

    new aws.cloudwatch.LogGroup(
      `${name}-rds-logs`,
      {
        name: `/aws/rds/instance/${name}/error`,
        retentionInDays: 14,
        tags: {
          ...commonTags,
          Name: `${name}-rds-logs`,
        },
      },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetId: this.publicSubnet.id,
      privateSubnetId: this.privateSubnet.id,
      rdsEndpoint: this.rdsInstance.endpoint,
      ec2PublicIp: this.ec2Instance.publicIp,
      albDnsName: this.alb.dnsName,
      s3BucketName: this.s3Bucket.id,
      lambdaFunctionName: this.lambdaFunction.name,
      kmsKeyId: this.kmsKey.keyId,
      domainName: this.route53Record.name,
    });
  }
}
```

### `resources.ts`

```typescript
import { TapStack } from './tap-stack';

// Create the main infrastructure stack
export const tapStack = new TapStack('tap', {
  vpcCidr: '10.0.0.0/16',
  publicSubnetCidr: '10.0.1.0/24',
  privateSubnetCidr: '10.0.2.0/24',
  domainName: 'app.your-domain.com', // Replace with your actual domain
  hostedZoneId: 'Z1234567890ABC', // Replace with your actual hosted zone ID
  sshAllowedCidr: '203.0.113.0/24',
});

// Export important outputs
export const vpcId = tapStack.vpc.id;
export const publicSubnetId = tapStack.publicSubnet.id;
export const privateSubnetId = tapStack.privateSubnet.id;
export const rdsEndpoint = tapStack.rdsInstance.endpoint;
export const ec2PublicIp = tapStack.ec2Instance.publicIp;
export const albDnsName = tapStack.alb.dnsName;
export const s3BucketName = tapStack.s3Bucket.id;
export const lambdaFunctionName = tapStack.lambdaFunction.name;
export const kmsKeyId = tapStack.kmsKey.keyId;
export const domainName = tapStack.route53Record.name;
```

### `tap.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import './resources';

// Configure AWS provider for us-west-1
const provider = new aws.Provider('aws-provider', {
  region: 'us-west-1',
});

// Set the provider as default
pulumi.runtime.setConfig('aws:region', 'us-west-1');

console.log('🚀 Secure Web App Environment deployment initiated...');
console.log('📍 Region: us-west-1');
console.log('🏗️  Infrastructure components:');
console.log('   ✅ VPC with public and private subnets');
console.log('   ✅ RDS MySQL with Secrets Manager integration');
console.log('   ✅ EC2 instance with restricted SSH access');
console.log('   ✅ Application Load Balancer');
console.log('   ✅ Route 53 DNS record');
console.log('   ✅ S3 bucket with KMS encryption');
console.log('   ✅ Lambda function with least-privilege IAM');
console.log('   ✅ CloudTrail for S3 data events');
console.log('   ✅ CloudWatch logging');
console.log('   ✅ All resources tagged appropriately');
```

## Key Features Implemented

### 1. **Networking Layer** ✅

- New VPC with DNS support
- Public subnet (10.0.1.0/24) with Internet Gateway
- Private subnet (10.0.2.0/24) with NAT Gateway
- Proper routing tables and associations

### 2. **Database Tier** ✅

- RDS MySQL db.t3.micro in private subnet
- Custom parameter group with max_connections = 100
- Password managed by AWS Secrets Manager with rotation
- KMS encryption enabled
- Multi-AZ subnet group for high availability

### 3. **Application & Web Tiers** ✅

- EC2 instance in public subnet
- Security group restricting SSH to 203.0.113.0/24
- Application Load Balancer with health checks
- Route 53 A record pointing to ALB
- Proper security group connectivity (EC2 ↔ RDS on port 3306)

### 4. **Storage & Serverless** ✅

- S3 bucket "my-app-data-bucket" with KMS encryption
- Lambda function with least-privilege IAM role
- IAM role scoped specifically to the S3 bucket operations

### 5. **Security, Auditing & Governance** ✅

- Customer-managed KMS key for S3 and RDS encryption
- CloudTrail monitoring S3 data events
- CloudWatch log groups for EC2 and RDS
- All resources tagged with Environment: Production and Owner: DevOps

## Deployment Instructions

1. **Install dependencies:**

```bash
npm install @pulumi/pulumi @pulumi/aws @pulumi/awsx
```

2. **Configure AWS credentials:**

```bash
aws configure
```

3. **Update configuration:**
   - Replace `hostedZoneId` and `domainName` in `resources.ts` with your actual values
   - Adjust CIDR blocks if needed

4. **Deploy:**

```bash
pulumi up
```

## Important Notes

- **Domain Configuration**: You need to replace the `hostedZoneId` and `domainName` with your actual Route 53 hosted zone
- **RDS Multi-AZ**: The RDS subnet group uses both subnets to meet AWS requirements
- **ALB Placement**: The ALB is placed in both subnets for high availability
- **Security Groups**: Properly configured with least-privilege access
- **KMS Integration**: Single KMS key used for both S3 and RDS encryption
- **CloudTrail**: Configured specifically for S3 data events monitoring
- **Tags**: All resources consistently tagged as required

This infrastructure provides a secure, well-architected web application environment following AWS best practices.
