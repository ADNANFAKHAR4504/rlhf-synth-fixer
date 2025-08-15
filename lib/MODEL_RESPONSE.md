I'll create a comprehensive Pulumi TypeScript project that meets all your requirements. Let me break this down into the requested file structure:

## Project Structure

### `Pulumi.yaml`

```yaml
name: secure-web-app
runtime: nodejs
description: Secure Web App Environment with VPC, RDS, EC2, ALB, Lambda, and security components
template:
  config:
    aws:region:
      description: The AWS region to deploy into
      default: us-west-2
```

### `tap-stack.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface TapStackArgs {
  environment: string;
  owner: string;
  domainName: string;
  allowedSshCidr: string;
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

    const defaultOpts = { parent: this };
    const commonTags = {
      Environment: args.environment,
      Owner: args.owner,
    };

    // 1. Look up existing default VPC
    this.vpc = aws.ec2
      .getVpcOutput({
        default: true,
      })
      .apply(vpc => aws.ec2.Vpc.get('default-vpc', vpc.id, {}, defaultOpts));

    // 2. Create Internet Gateway for public subnet
    this.internetGateway = new aws.ec2.InternetGateway(
      'igw',
      {
        vpcId: this.vpc.id,
        tags: {
          Name: 'main-igw',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 3. Create public subnet
    this.publicSubnet = new aws.ec2.Subnet(
      'public-subnet',
      {
        vpcId: this.vpc.id,
        cidrBlock: '172.31.1.0/24',
        availabilityZone: 'us-west-2a',
        mapPublicIpOnLaunch: true,
        tags: {
          Name: 'public-subnet',
          Type: 'Public',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 4. Create private subnet
    this.privateSubnet = new aws.ec2.Subnet(
      'private-subnet',
      {
        vpcId: this.vpc.id,
        cidrBlock: '172.31.2.0/24',
        availabilityZone: 'us-west-2b',
        mapPublicIpOnLaunch: false,
        tags: {
          Name: 'private-subnet',
          Type: 'Private',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 5. Create Elastic IP for NAT Gateway
    const natEip = new aws.ec2.Eip(
      'nat-eip',
      {
        domain: 'vpc',
        tags: {
          Name: 'nat-gateway-eip',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 6. Create NAT Gateway
    this.natGateway = new aws.ec2.NatGateway(
      'nat-gateway',
      {
        allocationId: natEip.id,
        subnetId: this.publicSubnet.id,
        tags: {
          Name: 'main-nat-gateway',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 7. Create route tables
    const publicRouteTable = new aws.ec2.RouteTable(
      'public-rt',
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            gatewayId: this.internetGateway.id,
          },
        ],
        tags: {
          Name: 'public-route-table',
          ...commonTags,
        },
      },
      defaultOpts
    );

    const privateRouteTable = new aws.ec2.RouteTable(
      'private-rt',
      {
        vpcId: this.vpc.id,
        routes: [
          {
            cidrBlock: '0.0.0.0/0',
            natGatewayId: this.natGateway.id,
          },
        ],
        tags: {
          Name: 'private-route-table',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 8. Associate route tables with subnets
    new aws.ec2.RouteTableAssociation(
      'public-rta',
      {
        subnetId: this.publicSubnet.id,
        routeTableId: publicRouteTable.id,
      },
      defaultOpts
    );

    new aws.ec2.RouteTableAssociation(
      'private-rta',
      {
        subnetId: this.privateSubnet.id,
        routeTableId: privateRouteTable.id,
      },
      defaultOpts
    );

    // 9. Create KMS key for encryption
    this.kmsKey = new aws.kms.Key(
      'app-kms-key',
      {
        description: 'KMS key for encrypting S3 bucket and RDS instance',
        keyUsage: 'ENCRYPT_DECRYPT',
        keySpec: 'SYMMETRIC_DEFAULT',
        tags: {
          Name: 'app-encryption-key',
          ...commonTags,
        },
      },
      defaultOpts
    );

    new aws.kms.Alias(
      'app-kms-alias',
      {
        name: 'alias/app-encryption-key',
        targetKeyId: this.kmsKey.keyId,
      },
      defaultOpts
    );

    // 10. Create security groups
    const albSecurityGroup = new aws.ec2.SecurityGroup(
      'alb-sg',
      {
        name: 'alb-security-group',
        description: 'Security group for Application Load Balancer',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP access from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: 'alb-security-group',
          ...commonTags,
        },
      },
      defaultOpts
    );

    const ec2SecurityGroup = new aws.ec2.SecurityGroup(
      'ec2-sg',
      {
        name: 'ec2-security-group',
        description: 'Security group for EC2 instance',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: [args.allowedSshCidr],
            description: 'SSH access from allowed CIDR',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            securityGroups: [albSecurityGroup.id],
            description: 'HTTP access from ALB',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: 'ec2-security-group',
          ...commonTags,
        },
      },
      defaultOpts
    );

    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      'rds-sg',
      {
        name: 'rds-security-group',
        description: 'Security group for RDS MySQL instance',
        vpcId: this.vpc.id,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [ec2SecurityGroup.id],
            description: 'MySQL access from EC2',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: {
          Name: 'rds-security-group',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 11. Create DB subnet group
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      'db-subnet-group',
      {
        name: 'main-db-subnet-group',
        subnetIds: [this.privateSubnet.id, this.publicSubnet.id], // Need at least 2 subnets in different AZs
        tags: {
          Name: 'main-db-subnet-group',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 12. Create RDS parameter group
    const dbParameterGroup = new aws.rds.ParameterGroup(
      'db-param-group',
      {
        family: 'mysql8.0',
        name: 'custom-mysql-params',
        description:
          'Custom parameter group for MySQL with max_connections=100',
        parameters: [
          {
            name: 'max_connections',
            value: '100',
          },
        ],
        tags: {
          Name: 'custom-mysql-params',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 13. Create RDS instance with Secrets Manager
    const dbSecret = new aws.secretsmanager.Secret(
      'db-password',
      {
        name: 'rds-mysql-password',
        description: 'Password for RDS MySQL instance',
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: 'admin' }),
          generateStringKey: 'password',
          excludeCharacters: '"@/\\',
          passwordLength: 16,
        },
        tags: {
          Name: 'rds-mysql-password',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // Enable automatic rotation
    new aws.secretsmanager.SecretRotation(
      'db-password-rotation',
      {
        secretId: dbSecret.id,
        rotationLambdaArn: pulumi.interpolate`arn:aws:lambda:us-west-2:${aws.getCallerIdentity().then(id => id.accountId)}:function:SecretsManagerRDSMySQLRotationSingleUser`,
        rotationRules: {
          automaticallyAfterDays: 30,
        },
      },
      defaultOpts
    );

    this.rdsInstance = new aws.rds.Instance(
      'mysql-db',
      {
        identifier: 'mysql-database',
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: this.kmsKey.arn,

        dbName: 'appdb',
        username: dbSecret.secretString.apply(s => JSON.parse(s).username),
        password: dbSecret.secretString.apply(s => JSON.parse(s).password),
        managePassword: false,

        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: dbSubnetGroup.name,
        parameterGroupName: dbParameterGroup.name,

        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',

        skipFinalSnapshot: true,
        deletionProtection: false,

        enabledCloudwatchLogsExports: ['error', 'general', 'slow-query'],

        tags: {
          Name: 'mysql-database',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 14. Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
      mostRecent: true,
      owners: ['amazon'],
      filters: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
      ],
    });

    // 15. Create EC2 instance
    this.ec2Instance = new aws.ec2.Instance(
      'web-server',
      {
        ami: ami.then(ami => ami.id),
        instanceType: 't3.micro',
        keyName: 'my-key-pair', // You'll need to create this key pair
        subnetId: this.publicSubnet.id,
        vpcSecurityGroupIds: [ec2SecurityGroup.id],

        userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from Web Server</h1>" > /var/www/html/index.html
            `,

        tags: {
          Name: 'web-server',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 16. Create Application Load Balancer
    this.alb = new aws.lb.LoadBalancer(
      'app-lb',
      {
        name: 'app-load-balancer',
        loadBalancerType: 'application',
        scheme: 'internet-facing',
        subnets: [this.publicSubnet.id, this.privateSubnet.id],
        securityGroups: [albSecurityGroup.id],

        tags: {
          Name: 'app-load-balancer',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 17. Create target group
    const targetGroup = new aws.lb.TargetGroup(
      'app-tg',
      {
        name: 'app-target-group',
        port: 80,
        protocol: 'HTTP',
        vpcId: this.vpc.id,
        targetType: 'instance',

        healthCheck: {
          enabled: true,
          path: '/',
          port: '80',
          protocol: 'HTTP',
          healthyThreshold: 2,
          unhealthyThreshold: 2,
          timeout: 5,
          interval: 30,
          matcher: '200',
        },

        tags: {
          Name: 'app-target-group',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 18. Attach EC2 instance to target group
    new aws.lb.TargetGroupAttachment(
      'app-tg-attachment',
      {
        targetGroupArn: targetGroup.arn,
        targetId: this.ec2Instance.id,
        port: 80,
      },
      defaultOpts
    );

    // 19. Create ALB listener
    new aws.lb.Listener(
      'app-listener',
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
      defaultOpts
    );

    // 20. Create S3 bucket
    this.s3Bucket = new aws.s3.Bucket(
      'my-app-data-bucket',
      {
        bucket: 'my-app-data-bucket',
        tags: {
          Name: 'my-app-data-bucket',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 21. Configure S3 bucket encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      'bucket-encryption',
      {
        bucket: this.s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      defaultOpts
    );

    // 22. Block public access to S3 bucket
    new aws.s3.BucketPublicAccessBlock(
      'bucket-pab',
      {
        bucket: this.s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      defaultOpts
    );

    // 23. Create IAM role for Lambda
    const lambdaRole = new aws.iam.Role(
      'lambda-role',
      {
        name: 'lambda-s3-access-role',
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
          Name: 'lambda-s3-access-role',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 24. Create IAM policy for S3 access
    const lambdaS3Policy = new aws.iam.Policy(
      'lambda-s3-policy',
      {
        name: 'lambda-s3-access-policy',
        description: 'Policy for Lambda to access specific S3 bucket',
        policy: pulumi.jsonStringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: [
                'logs:CreateLogGroup',
                'logs:CreateLogStream',
                'logs:PutLogEvents',
              ],
              Resource: 'arn:aws:logs:*:*:*',
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObject',
                's3:PutObject',
                's3:DeleteObject',
                's3:ListBucket',
              ],
              Resource: [
                this.s3Bucket.arn,
                pulumi.interpolate`${this.s3Bucket.arn}/*`,
              ],
            },
          ],
        }),
      },
      defaultOpts
    );

    // 25. Attach policy to role
    new aws.iam.RolePolicyAttachment(
      'lambda-policy-attachment',
      {
        role: lambdaRole.name,
        policyArn: lambdaS3Policy.arn,
      },
      defaultOpts
    );

    // 26. Create Lambda function
    this.lambdaFunction = new aws.lambda.Function(
      's3-processor',
      {
        name: 's3-data-processor',
        runtime: 'python3.9',
        handler: 'index.handler',
        role: lambdaRole.arn,

        code: new pulumi.asset.AssetArchive({
          'index.py': new pulumi.asset.StringAsset(`
import json
import boto3

def handler(event, context):
    s3 = boto3.client('s3')
    bucket_name = 'my-app-data-bucket'
    
    try:
        # List objects in the bucket
        response = s3.list_objects_v2(Bucket=bucket_name)
        objects = response.get('Contents', [])
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully accessed bucket {bucket_name}',
                'object_count': len(objects)
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
                `),
        }),

        tags: {
          Name: 's3-data-processor',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 27. Get hosted zone for Route 53
    const hostedZone = aws.route53.getZone({
      name: args.domainName,
    });

    // 28. Create Route 53 A record
    this.route53Record = new aws.route53.Record(
      'app-dns',
      {
        zoneId: hostedZone.then(zone => zone.zoneId),
        name: `app.${args.domainName}`,
        type: 'A',

        aliases: [
          {
            name: this.alb.dnsName,
            zoneId: this.alb.zoneId,
            evaluateTargetHealth: true,
          },
        ],
      },
      defaultOpts
    );

    // 29. Create CloudTrail S3 bucket
    const cloudtrailBucket = new aws.s3.Bucket(
      'cloudtrail-logs',
      {
        bucket: 'my-app-cloudtrail-logs',
        forceDestroy: true,
        tags: {
          Name: 'cloudtrail-logs',
          ...commonTags,
        },
      },
      defaultOpts
    );

    // 30. CloudTrail bucket policy
    const cloudtrailBucketPolicy = new aws.s3.BucketPolicy(
      'cloudtrail-bucket-policy',
      {
        bucket: cloudtrailBucket.id,
        policy: pulumi
          .all([cloudtrailBucket.arn, aws.getCallerIdentity()])
          .apply(([bucketArn, identity]) =>
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
      defaultOpts
    );

    // 31. Create CloudTrail
    this.cloudTrail = new aws.cloudtrail.Trail(
      's3-data-trail',
      {
        name: 's3-data-access-trail',
        s3BucketName: cloudtrailBucket.bucket,
        includeGlobalServiceEvents: false,
        isMultiRegionTrail: false,
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
          Name: 's3-data-access-trail',
          ...commonTags,
        },
      },
      { ...defaultOpts, dependsOn: [cloudtrailBucketPolicy] }
    );

    // 32. Create CloudWatch Log Groups
    new aws.cloudwatch.LogGroup(
      'ec2-logs',
      {
        name: '/aws/ec2/web-server',
        retentionInDays: 14,
        tags: {
          Name: 'ec2-web-server-logs',
          ...commonTags,
        },
      },
      defaultOpts
    );

    new aws.cloudwatch.LogGroup(
      'rds-logs',
      {
        name: '/aws/rds/instance/mysql-database/error',
        retentionInDays: 14,
        tags: {
          Name: 'rds-mysql-logs',
          ...commonTags,
        },
      },
      defaultOpts
    );

    this.registerOutputs({
      vpcId: this.vpc.id,
      publicSubnetId: this.publicSubnet.id,
      privateSubnetId: this.privateSubnet.id,
      rdsEndpoint: this.rdsInstance.endpoint,
      ec2PublicIp: this.ec2Instance.publicIp,
      albDnsName: this.alb.dnsName,
      s3BucketName: this.s3Bucket.bucket,
      lambdaFunctionName: this.lambdaFunction.name,
      domainName: this.route53Record.name,
      kmsKeyId: this.kmsKey.keyId,
    });
  }
}
```

### `resources.ts`

```typescript
import { TapStack } from './tap-stack';

// Create the main stack with configuration
export const tapStack = new TapStack('tap-stack', {
  environment: 'Production',
  owner: 'DevOps',
  domainName: 'your-domain.com', // Replace with your actual domain
  allowedSshCidr: '203.0.113.0/24',
});

// Export important outputs
export const vpcId = tapStack.vpc.id;
export const publicSubnetId = tapStack.publicSubnet.id;
export const privateSubnetId = tapStack.privateSubnet.id;
export const rdsEndpoint = tapStack.rdsInstance.endpoint;
export const ec2PublicIp = tapStack.ec2Instance.publicIp;
export const albDnsName = tapStack.alb.dnsName;
export const s3BucketName = tapStack.s3Bucket.bucket;
export const lambdaFunctionName = tapStack.lambdaFunction.name;
export const appUrl = tapStack.route53Record.name;
export const kmsKeyId = tapStack.kmsKey.keyId;
```

### `tap.ts`

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import './resources';

// Configure the AWS Provider
const provider = new aws.Provider('aws-provider', {
  region: 'us-west-2',
});

// Export the provider for reference
export { provider };
```

## Key Features Implemented

### ✅ **Infrastructure Components**

1. **VPC**: Uses existing default VPC as foundation
2. **Subnets**: Public (172.31.1.0/24) and Private (172.31.2.0/24) subnets
3. **Networking**: Internet Gateway, NAT Gateway, and proper routing
4. **Security Groups**: Properly configured for ALB, EC2, and RDS tiers

### ✅ **Database Tier**

- RDS MySQL (`db.t3.micro`) in private subnet
- Custom parameter group with `max_connections = 100`
- Password managed by AWS Secrets Manager with rotation
- Encrypted with customer-managed KMS key

### ✅ **Application & Web Tiers**

- EC2 instance in public subnet with restricted SSH access
- Application Load Balancer with proper target group configuration
- Route 53 A record pointing to ALB
- Security group connectivity between tiers

### ✅ **Storage & Serverless**

- S3 bucket with KMS encryption
- Lambda function with least-privilege IAM role
- Proper S3 bucket access policies

### ✅ **Security & Governance**

- Customer-managed KMS key for encryption
- CloudTrail for S3 data event monitoring
- CloudWatch logging for EC2 and RDS
- Comprehensive resource tagging

## Prerequisites

Before deploying, ensure you have:

1. **AWS CLI configured** with appropriate credentials
2. **Pulumi CLI installed** and configured
3. **Node.js and npm** installed
4. **A Route 53 hosted zone** for your domain
5. **An EC2 key pair** created in us-west-2 region

## Deployment Instructions

```bash
# Initialize the project
npm init -y
npm install @pulumi/pulumi @pulumi/aws

# Deploy the infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Important Notes

1. **Domain Configuration**: Replace `"your-domain.com"` in `resources.ts` with your actual domain
2. **Key Pair**: Update the `keyName` in the EC2 instance configuration
3. **Secrets Manager Rotation**: The rotation Lambda ARN assumes the default AWS-provided rotation function
4. **Cost Optimization**: All resources use minimal configurations suitable for development/testing

This infrastructure provides a secure, well-architected foundation for a web application with proper separation of concerns, encryption, monitoring, and access controls.
