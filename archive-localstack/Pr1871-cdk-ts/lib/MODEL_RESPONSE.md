I'll create a secure AWS environment with all the specified components. Here's a complete solution with both CDK and CloudFormation implementations.

## AWS CDK Project (TypeScript)

### Project Structure
```
secure-aws-infra/
├── package.json
├── tsconfig.json
├── cdk.json
├── bin/
│   └── secure-aws-infra.ts
└── lib/
    └── secure-aws-infra-stack.ts
```

### package.json
```json
{
  "name": "secure-aws-infra",
  "version": "1.0.0",
  "main": "lib/index.js",
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "jest",
    "cdk": "cdk",
    "deploy": "cdk deploy --require-approval never",
    "destroy": "cdk destroy"
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

### tsconfig.json
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": [
      "es2020"
    ],
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
    "typeRoots": [
      "./node_modules/@types"
    ]
  },
  "exclude": [
    "cdk.out"
  ]
}
```

### cdk.json
```json
{
  "app": "npx ts-node --prefer-ts-exts bin/secure-aws-infra.ts",
  "watch": {
    "include": [
      "**"
    ],
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
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/core:enableStackNameDuplicates": true,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:disableStackTrace": true
  }
}
```

### bin/secure-aws-infra.ts
```typescript
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SecureAwsInfraStack } from '../lib/secure-aws-infra-stack';

const app = new cdk.App();

// Enforce us-east-1 region
const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: 'us-east-1'
};

new SecureAwsInfraStack(app, 'SecureAwsInfraStack', {
  env,
  description: 'Secure AWS infrastructure with encrypted S3, EC2, CloudTrail, and Lambda in VPC'
});
```

### lib/secure-aws-infra-stack.ts
```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export class SecureAwsInfraStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Region validation - ensure we're in us-east-1
    const regionCondition = new cdk.CfnCondition(this, 'IsUSEast1', {
      expression: cdk.Fn.conditionEquals(cdk.Aws.REGION, 'us-east-1')
    });

    // KMS Key for S3 encryption
    const s3KmsKey = new kms.Key(this, 'S3EncryptionKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      policy: new iam.PolicyDocument({
        statements: [
          // Allow root account full access
          new iam.PolicyStatement({
            sid: 'Enable IAM User Permissions',
            effect: iam.Effect.ALLOW,
            principals: [new iam.AccountRootPrincipal()],
            actions: ['kms:*'],
            resources: ['*'],
          }),
          // Allow CloudTrail service to use the key
          new iam.PolicyStatement({
            sid: 'Allow CloudTrail to encrypt logs',
            effect: iam.Effect.ALLOW,
            principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
            actions: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:CreateGrant',
              'kms:Decrypt'
            ],
            resources: ['*'],
            conditions: {
              StringEquals: {
                'kms:EncryptionContext:aws:cloudtrail:arn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureCloudTrail`
              }
            }
          })
        ]
      })
    });

    // Create KMS key alias
    new kms.Alias(this, 'S3EncryptionKeyAlias', {
      aliasName: 'alias/secure-s3-encryption-key',
      targetKey: s3KmsKey
    });

    // S3 Bucket for CloudTrail logs - encrypted with KMS
    const cloudTrailBucket = new s3.Bucket(this, 'CloudTrailLogsBucket', {
      bucketName: `secure-cloudtrail-logs-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: s3KmsKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      enforceSSL: true,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldLogs',
          enabled: true,
          expiration: cdk.Duration.days(90),
          noncurrentVersionExpiration: cdk.Duration.days(30)
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN
    });

    // CloudTrail bucket policy for proper permissions
    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailAclCheck',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:GetBucketAcl'],
        resources: [cloudTrailBucket.bucketArn],
        conditions: {
          StringEquals: {
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureCloudTrail`
          }
        }
      })
    );

    cloudTrailBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'AWSCloudTrailWrite',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('cloudtrail.amazonaws.com')],
        actions: ['s3:PutObject'],
        resources: [`${cloudTrailBucket.bucketArn}/*`],
        conditions: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
            'AWS:SourceArn': `arn:aws:cloudtrail:${this.region}:${this.account}:trail/SecureCloudTrail`
          }
        }
      })
    );

    // VPC with public and private subnets
    const vpc = new ec2.Vpc(this, 'SecureVPC', {
      maxAzs: 2,
      cidr: '10.0.0.0/16',
      natGateways: 1, // Cost optimization - single NAT gateway
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
        }
      ],
      enableDnsHostnames: true,
      enableDnsSupport: true
    });

    // Security Group for EC2 instances - restricted inbound access
    const ec2SecurityGroup = new ec2.SecurityGroup(this, 'EC2SecurityGroup', {
      vpc,
      description: 'Security group for EC2 instances with restricted access',
      allowAllOutbound: true
    });

    // Add inbound rule for specified CIDR range (SSH access)
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'), // Example CIDR - replace with your actual CIDR
      ec2.Port.tcp(22),
      'SSH access from specified CIDR range'
    );

    // Add inbound rule for HTTP/HTTPS if needed
    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(80),
      'HTTP access from specified CIDR range'
    );

    ec2SecurityGroup.addIngressRule(
      ec2.Peer.ipv4('203.0.113.0/24'),
      ec2.Port.tcp(443),
      'HTTPS access from specified CIDR range'
    );

    // IAM Role for EC2 instances with least privilege
    const ec2Role = new iam.Role(this, 'EC2InstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      description: 'IAM role for EC2 instances with minimal required permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSSMManagedInstanceCore')
      ]
    });

    // Instance profile for EC2
    const instanceProfile = new iam.CfnInstanceProfile(this, 'EC2InstanceProfile', {
      roles: [ec2Role.roleName],
      instanceProfileName: 'SecureEC2InstanceProfile'
    });

    // Latest Amazon Linux 2 AMI
    const amzn2Ami = new ec2.AmazonLinuxImage({
      generation: ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
      cpuType: ec2.AmazonLinuxCpuType.X86_64
    });

    // EC2 Instance in private subnet
    const ec2Instance = new ec2.Instance(this, 'SecureEC2Instance', {
      vpc,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
      machineImage: amzn2Ami,
      securityGroup: ec2SecurityGroup,
      role: ec2Role,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      userData: ec2.UserData.forLinux(),
      keyName: undefined, // Remove if you want to specify a key pair
    });

    // Security Group for Lambda functions - egress only
    const lambdaSecurityGroup = new ec2.SecurityGroup(this, 'LambdaSecurityGroup', {
      vpc,
      description: 'Security group for Lambda functions - egress only',
      allowAllOutbound: true
    });

    // IAM Role for Lambda functions with VPC execution permissions
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      description: 'IAM role for Lambda functions with VPC execution permissions',
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole')
      ]
    });

    // Lambda function in VPC
    const lambdaFunction = new lambda.Function(this, 'SecureLambdaFunction', {
      runtime: lambda.Runtime.PYTHON_3_9,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info('Lambda function executed successfully in VPC')
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Hello from secure Lambda in VPC!',
            'requestId': context.aws_request_id
        })
    }
      `),
      role: lambdaRole,
      vpc: vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
      },
      securityGroups: [lambdaSecurityGroup],
      timeout: cdk.Duration.seconds(30),
      memorySize: 128,
      description: 'Secure Lambda function running in VPC'
    });

    // CloudTrail for logging API calls
    const trail = new cloudtrail.Trail(this, 'SecureCloudTrail', {
      trailName: 'SecureCloudTrail',
      bucket: cloudTrailBucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      kmsKey: s3KmsKey,
      sendToCloudWatchLogs: false // Disable CloudWatch logs to reduce costs
    });

    // Apply region condition to all resources
    const resources = [
      s3KmsKey.node.defaultChild as cdk.CfnResource,
      cloudTrailBucket.node.defaultChild as cdk.CfnResource,
      vpc.node.defaultChild as cdk.CfnResource,
      ec2SecurityGroup.node.defaultChild as cdk.CfnResource,
      ec2Role.node.defaultChild as cdk.CfnResource,
      instanceProfile,
      ec2Instance.node.defaultChild as cdk.CfnResource,
      lambdaSecurityGroup.node.defaultChild as cdk.CfnResource,
      lambdaRole.node.defaultChild as cdk.CfnResource,
      lambdaFunction.node.defaultChild as cdk.CfnResource,
      trail.node.defaultChild as cdk.CfnResource
    ];

    resources.forEach(resource => {
      resource.cfnOptions.condition = regionCondition;
    });

    // Stack Outputs
    new cdk.CfnOutput(this, 'S3BucketName', {
      value: cloudTrailBucket.bucketName,
      description: 'Name of the encrypted S3 bucket for CloudTrail logs',
      condition: regionCondition
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'ID of the secure VPC',
      condition: regionCondition
    });

    new cdk.CfnOutput(this, 'EC2InstanceId', {
      value: ec2Instance.instanceId,
      description: 'ID of the secure EC2 instance',
      condition: regionCondition
    });

    new cdk.CfnOutput(this, 'CloudTrailArn', {
      value: trail.trailArn,
      description: 'ARN of the CloudTrail',
      condition: regionCondition
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: lambdaFunction.functionArn,
      description: 'ARN of the Lambda function in VPC',
      condition: regionCondition
    });

    new cdk.CfnOutput(this, 'KMSKeyId', {
      value: s3KmsKey.keyId,
      description: 'ID of the KMS key used for S3 encryption',
      condition: regionCondition
    });
  }
}
```

## CloudFormation YAML Template

### secure-aws-infrastructure.yaml
```yaml
AWSTemplateFormatVersion: '2010-09-09'
Description: 'Secure AWS infrastructure with encrypted S3, EC2, CloudTrail, and Lambda in VPC'

# Region validation condition
Conditions:
  IsUSEast1: !Equals [!Ref 'AWS::Region', 'us-east-1']

Parameters:
  AllowedCIDR:
    Type: String
    Default: '203.0.113.0/24'
    Description: 'CIDR range allowed to access EC2 instances'
    AllowedPattern: '^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$'

Resources:
  # KMS Key for S3 encryption
  S3EncryptionKey:
    Type: AWS::KMS::Key
    Condition: IsUSEast1
    Properties:
      Description: 'KMS key for S3 bucket encryption'
      EnableKeyRotation: true
      KeyPolicy:
        Version: '2012-10-17'
        Statement:
          - Sid: 'Enable IAM User Permissions'
            Effect: Allow
            Principal:
              AWS: !Sub 'arn:aws:iam::${AWS::AccountId}:root'
            Action: 'kms:*'
            Resource: '*'
          - Sid: 'Allow CloudTrail to encrypt logs'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action:
              - 'kms:GenerateDataKey*'
              - 'kms:DescribeKey'
              - 'kms:Encrypt'
              - 'kms:ReEncrypt*'
              - 'kms:CreateGrant'
              - 'kms:Decrypt'
            Resource: '*'
            Condition:
              StringEquals:
                'kms:EncryptionContext:aws:cloudtrail:arn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecureCloudTrail'

  # KMS Key Alias
  S3EncryptionKeyAlias:
    Type: AWS::KMS::Alias
    Condition: IsUSEast1
    Properties:
      AliasName: 'alias/secure-s3-encryption-key'
      TargetKeyId: !Ref S3EncryptionKey

  # S3 Bucket for CloudTrail logs
  CloudTrailLogsBucket:
    Type: AWS::S3::Bucket
    Condition: IsUSEast1
    Properties:
      BucketName: !Sub 'secure-cloudtrail-logs-${AWS::AccountId}-${AWS::Region}'
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: aws:kms
              KMSMasterKeyID: !Ref S3EncryptionKey
            BucketKeyEnabled: true
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      VersioningConfiguration:
        Status: Enabled
      LifecycleConfiguration:
        Rules:
          - Id: 'DeleteOldLogs'
            Status: Enabled
            ExpirationInDays: 90
            NoncurrentVersionExpirationInDays: 30

  # S3 Bucket Policy for CloudTrail
  CloudTrailBucketPolicy:
    Type: AWS::S3::BucketPolicy
    Condition: IsUSEast1
    Properties:
      Bucket: !Ref CloudTrailLogsBucket
      PolicyDocument:
        Version: '2012-10-17'
        Statement:
          - Sid: 'AWSCloudTrailAclCheck'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:GetBucketAcl'
            Resource: !GetAtt CloudTrailLogsBucket.Arn
            Condition:
              StringEquals:
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecureCloudTrail'
          - Sid: 'AWSCloudTrailWrite'
            Effect: Allow
            Principal:
              Service: cloudtrail.amazonaws.com
            Action: 's3:PutObject'
            Resource: !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              StringEquals:
                's3:x-amz-acl': 'bucket-owner-full-control'
                'AWS:SourceArn': !Sub 'arn:aws:cloudtrail:${AWS::Region}:${AWS::AccountId}:trail/SecureCloudTrail'
          - Sid: 'DenyInsecureConnections'
            Effect: Deny
            Principal: '*'
            Action: 's3:*'
            Resource:
              - !GetAtt CloudTrailLogsBucket.Arn
              - !Sub '${CloudTrailLogsBucket.Arn}/*'
            Condition:
              Bool:
                'aws:SecureTransport': 'false'

  # VPC
  SecureVPC:
    Type: AWS::EC2::VPC
    Condition: IsUSEast1
    Properties:
      CidrBlock: '10.0.0.0/16'
      EnableDnsHostnames: true
      EnableDnsSupport: true
      Tags:
        - Key: Name
          Value: 'SecureVPC'

  # Internet Gateway
  InternetGateway:
    Type: AWS::EC2::InternetGateway
    Condition: IsUSEast1
    Properties:
      Tags:
        - Key: Name
          Value: 'SecureVPC-IGW'

  # Attach Internet Gateway to VPC
  InternetGatewayAttachment:
    Type: AWS::EC2::VPCGatewayAttachment
    Condition: IsUSEast1
    Properties:
      InternetGatewayId: !Ref InternetGateway
      VpcId: !Ref SecureVPC

  # Public Subnet 1
  PublicSubnet1:
    Type: AWS::EC2::Subnet
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.1.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'Public Subnet (AZ1)'

  # Public Subnet 2
  PublicSubnet2:
    Type: AWS::EC2::Subnet
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.2.0/24'
      MapPublicIpOnLaunch: true
      Tags:
        - Key: Name
          Value: 'Public Subnet (AZ2)'

  # Private Subnet 1
  PrivateSubnet1:
    Type: AWS::EC2::Subnet
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [0, !GetAZs '']
      CidrBlock: '10.0.11.0/24'
      Tags:
        - Key: Name
          Value: 'Private Subnet (AZ1)'

  # Private Subnet 2
  PrivateSubnet2:
    Type: AWS::EC2::Subnet
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref SecureVPC
      AvailabilityZone: !Select [1, !GetAZs '']
      CidrBlock: '10.0.12.0/24'
      Tags:
        - Key: Name
          Value: 'Private Subnet (AZ2)'

  # NAT Gateway EIP
  NatGateway1EIP:
    Type: AWS::EC2::EIP
    Condition: IsUSEast1
    DependsOn: InternetGatewayAttachment
    Properties:
      Domain: vpc

  # NAT Gateway
  NatGateway1:
    Type: AWS::EC2::NatGateway
    Condition: IsUSEast1
    Properties:
      AllocationId: !GetAtt NatGateway1EIP.AllocationId
      SubnetId: !Ref PublicSubnet1

  # Public Route Table
  PublicRouteTable:
    Type: AWS::EC2::RouteTable
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: 'Public Routes'

  # Default Public Route
  DefaultPublicRoute:
    Type: AWS::EC2::Route
    Condition: IsUSEast1
    DependsOn: InternetGatewayAttachment
    Properties:
      RouteTableId: !Ref PublicRouteTable
      DestinationCidrBlock: '0.0.0.0/0'
      GatewayId: !Ref InternetGateway

  # Public Subnet Route Table Associations
  PublicSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsUSEast1
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet1

  PublicSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsUSEast1
    Properties:
      RouteTableId: !Ref PublicRouteTable
      SubnetId: !Ref PublicSubnet2

  # Private Route Table
  PrivateRouteTable1:
    Type: AWS::EC2::RouteTable
    Condition: IsUSEast1
    Properties:
      VpcId: !Ref SecureVPC
      Tags:
        - Key: Name
          Value: 'Private Routes (AZ1)'

  # Default Private Route
  DefaultPrivateRoute1:
    Type: AWS::EC2::Route
    Condition: IsUSEast1
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      DestinationCidrBlock: '0.0.0.0/0'
      NatGatewayId: !Ref NatGateway1

  # Private Subnet Route Table Associations
  PrivateSubnet1RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsUSEast1
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet1

  PrivateSubnet2RouteTableAssociation:
    Type: AWS::EC2::SubnetRouteTableAssociation
    Condition: IsUSEast1
    Properties:
      RouteTableId: !Ref PrivateRouteTable1
      SubnetId: !Ref PrivateSubnet2

  # Security Group for EC2 instances
  EC2SecurityGroup:
    Type: AWS::EC2::SecurityGroup
    Condition: IsUSEast1
    Properties:
      GroupDescription: 'Security group for EC2 instances with restricted access'
      VpcId: !Ref SecureVPC
      SecurityGroupIngress:
        - IpProtocol: tcp
          FromPort: 22
          ToPort: 22
          CidrIp: !Ref AllowedCIDR
          Description: 'SSH access from specified CIDR range'
        - IpProtocol: tcp
          FromPort: 80
          ToPort: 80
          CidrIp: !Ref AllowedCIDR
          Description: 'HTTP access from specified CIDR range'
        - IpProtocol: tcp
          FromPort: 443
          ToPort: 443
          CidrIp: !Ref AllowedCIDR
          Description: 'HTTPS access from specified CIDR range'
      SecurityGroupEgress:
        - IpProtocol: -1
          CidrIp: '0.0.0.0/0'
          Description: 'All outbound traffic'
      Tags:
        - Key: Name