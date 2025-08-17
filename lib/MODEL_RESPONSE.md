I'll create a comprehensive CDKTF configuration that meets all the specified security and architectural requirements. Here's the complete solution:

## CDKTF Configuration for Secure AWS Infrastructure

### Main Configuration File

```typescript
// main.ts
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicy } from "@cdktf/provider-aws/lib/iam-role-policy";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { KmsKey } from "@cdktf/provider-aws/lib/kms-key";
import { KmsAlias } from "@cdktf/provider-aws/lib/kms-alias";
import { LambdaFunction } from "@cdktf/provider-aws/lib/lambda-function";
import { CloudwatchLogGroup } from "@cdktf/provider-aws/lib/cloudwatch-log-group";
import { CloudwatchMetricAlarm } from "@cdktf/provider-aws/lib/cloudwatch-metric-alarm";
import { SnsTopicSubscription } from "@cdktf/provider-aws/lib/sns-topic-subscription";
import { SnsTopic } from "@cdktf/provider-aws/lib/sns-topic";
import { CloudtrailEventDataStore } from "@cdktf/provider-aws/lib/cloudtrail-event-data-store";
import { Cloudtrail } from "@cdktf/provider-aws/lib/cloudtrail";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketEncryption } from "@cdktf/provider-aws/lib/s3-bucket-encryption";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";

class SecureInfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // AWS Providers for multiple regions
    const primaryProvider = new AwsProvider(this, "aws-primary", {
      region: "us-east-1",
      alias: "primary",
    });

    const secondaryProvider = new AwsProvider(this, "aws-secondary", {
      region: "us-west-2",
      alias: "secondary",
    });

    // KMS Keys for encryption
    const primaryKmsKey = new KmsKey(this, "secure-env-primary-kms", {
      provider: primaryProvider,
      description: "KMS key for secure-env primary region encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: { AWS: "arn:aws:iam::*:root" },
            Action: "kms:*",
            Resource: "*",
          },
        ],
      }),
      tags: {
        Name: "secure-env-primary-kms-key",
        Environment: "secure-env",
      },
    });

    new KmsAlias(this, "secure-env-primary-kms-alias", {
      provider: primaryProvider,
      name: "alias/secure-env-primary",
      targetKeyId: primaryKmsKey.keyId,
    });

    const secondaryKmsKey = new KmsKey(this, "secure-env-secondary-kms", {
      provider: secondaryProvider,
      description: "KMS key for secure-env secondary region encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: { AWS: "arn:aws:iam::*:root" },
            Action: "kms:*",
            Resource: "*",
          },
        ],
      }),
      tags: {
        Name: "secure-env-secondary-kms-key",
        Environment: "secure-env",
      },
    });

    new KmsAlias(this, "secure-env-secondary-kms-alias", {
      provider: secondaryProvider,
      name: "alias/secure-env-secondary",
      targetKeyId: secondaryKmsKey.keyId,
    });

    // Primary Region Infrastructure
    const primaryInfra = this.createRegionalInfrastructure(
      "primary",
      primaryProvider,
      "10.0.0.0/16",
      primaryKmsKey.arn
    );

    // Secondary Region Infrastructure
    const secondaryInfra = this.createRegionalInfrastructure(
      "secondary",
      secondaryProvider,
      "10.1.0.0/16",
      secondaryKmsKey.arn
    );

    // CloudTrail for monitoring and alerting
    this.setupCloudTrailAndAlerting(primaryProvider, primaryKmsKey.arn);

    // Outputs
    new TerraformOutput(this, "primary-vpc-id", {
      value: primaryInfra.vpc.id,
    });

    new TerraformOutput(this, "secondary-vpc-id", {
      value: secondaryInfra.vpc.id,
    });
  }

  private createRegionalInfrastructure(
    region: string,
    provider: AwsProvider,
    cidrBlock: string,
    kmsKeyArn: string
  ) {
    // VPC
    const vpc = new Vpc(this, `secure-env-vpc-${region}`, {
      provider: provider,
      cidrBlock: cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `secure-env-vpc-${region}`,
        Environment: "secure-env",
      },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, `secure-env-igw-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      tags: {
        Name: `secure-env-igw-${region}`,
        Environment: "secure-env",
      },
    });

    // Public Subnets
    const publicSubnet1 = new Subnet(this, `secure-env-public-subnet-1-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      cidrBlock: region === "primary" ? "10.0.1.0/24" : "10.1.1.0/24",
      availabilityZone: region === "primary" ? "us-east-1a" : "us-west-2a",
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `secure-env-public-subnet-1-${region}`,
        Environment: "secure-env",
        Type: "public",
      },
    });

    const publicSubnet2 = new Subnet(this, `secure-env-public-subnet-2-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      cidrBlock: region === "primary" ? "10.0.2.0/24" : "10.1.2.0/24",
      availabilityZone: region === "primary" ? "us-east-1b" : "us-west-2b",
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `secure-env-public-subnet-2-${region}`,
        Environment: "secure-env",
        Type: "public",
      },
    });

    // Private Subnets
    const privateSubnet1 = new Subnet(this, `secure-env-private-subnet-1-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      cidrBlock: region === "primary" ? "10.0.3.0/24" : "10.1.3.0/24",
      availabilityZone: region === "primary" ? "us-east-1a" : "us-west-2a",
      tags: {
        Name: `secure-env-private-subnet-1-${region}`,
        Environment: "secure-env",
        Type: "private",
      },
    });

    const privateSubnet2 = new Subnet(this, `secure-env-private-subnet-2-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      cidrBlock: region === "primary" ? "10.0.4.0/24" : "10.1.4.0/24",
      availabilityZone: region === "primary" ? "us-east-1b" : "us-west-2b",
      tags: {
        Name: `secure-env-private-subnet-2-${region}`,
        Environment: "secure-env",
        Type: "private",
      },
    });

    // Elastic IPs for NAT Gateways
    const natEip1 = new Eip(this, `secure-env-nat-eip-1-${region}`, {
      provider: provider,
      domain: "vpc",
      tags: {
        Name: `secure-env-nat-eip-1-${region}`,
        Environment: "secure-env",
      },
    });

    const natEip2 = new Eip(this, `secure-env-nat-eip-2-${region}`, {
      provider: provider,
      domain: "vpc",
      tags: {
        Name: `secure-env-nat-eip-2-${region}`,
        Environment: "secure-env",
      },
    });

    // NAT Gateways
    const natGw1 = new NatGateway(this, `secure-env-nat-gw-1-${region}`, {
      provider: provider,
      allocationId: natEip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `secure-env-nat-gw-1-${region}`,
        Environment: "secure-env",
      },
    });

    const natGw2 = new NatGateway(this, `secure-env-nat-gw-2-${region}`, {
      provider: provider,
      allocationId: natEip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: `secure-env-nat-gw-2-${region}`,
        Environment: "secure-env",
      },
    });

    // Route Tables
    const publicRouteTable = new RouteTable(this, `secure-env-public-rt-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      tags: {
        Name: `secure-env-public-rt-${region}`,
        Environment: "secure-env",
      },
    });

    const privateRouteTable1 = new RouteTable(this, `secure-env-private-rt-1-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      tags: {
        Name: `secure-env-private-rt-1-${region}`,
        Environment: "secure-env",
      },
    });

    const privateRouteTable2 = new RouteTable(this, `secure-env-private-rt-2-${region}`, {
      provider: provider,
      vpcId: vpc.id,
      tags: {
        Name: `secure-env-private-rt-2-${region}`,
        Environment: "secure-env",
      },
    });

    // Routes
    new Route(this, `secure-env-public-route-${region}`, {
      provider: provider,
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id,
    });

    new Route(this, `secure-env-private-route-1-${region}`, {
      provider: provider,
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw1.id,
    });

    new Route(this, `secure-env-private-route-2-${region}`, {
      provider: provider,
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGw2.id,
    });

    // Route Table Associations
    new RouteTableAssociation(this, `secure-env-public-rta-1-${region}`, {
      provider: provider,
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, `secure-env-public-rta-2-${region}`, {
      provider: provider,
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, `secure-env-private-rta-1-${region}`, {
      provider: provider,
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    });

    new RouteTableAssociation(this, `secure-env-private-rta-2-${region}`, {
      provider: provider,
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    });

    // Security Groups
    const webSecurityGroup = new SecurityGroup(this, `secure-env-web-sg-${region}`, {
      provider: provider,
      name: `secure-env-web-sg-${region}`,
      description: "Security group for web servers with restricted access",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTP access",
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
          description: "HTTPS access",
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [cidrBlock],
          description: "SSH access from VPC only",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      tags: {
        Name: `secure-env-web-sg-${region}`,
        Environment: "secure-env",
      },
    });

    const privateSecurityGroup = new SecurityGroup(this, `secure-env-private-sg-${region}`, {
      provider: provider,
      name: `secure-env-private-sg-${region}`,
      description: "Security group for private instances",
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 0,
          toPort: 65535,
          protocol: "tcp",
          cidrBlocks: [cidrBlock],
          description: "All traffic from VPC",
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      tags: {
        Name: `secure-env-private-sg-${region}`,
        Environment: "secure-env",
      },
    });

    // IAM Role for EC2 instances
    const ec2Role = new IamRole(this, `secure-env-ec2-role-${region}`, {
      provider: provider,
      name: `secure-env-ec2-role-${region}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
          },
        ],
      }),
      tags: {
        Name: `secure-env-ec2-role-${region}`,
        Environment: "secure-env",
      },
    });

    // Least privilege policy for EC2 instances
    new IamRolePolicy(this, `secure-env-ec2-policy-${region}`, {
      provider: provider,
      name: `secure-env-ec2-policy-${region}`,
      role: ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogStreams",
            ],
            Resource: "arn:aws:logs:*:*:*",
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:DescribeKey",
            ],
            Resource: kmsKeyArn,
          },
        ],
      }),
    });

    // IAM Role for Lambda functions
    const lambdaRole = new IamRole(this, `secure-env-lambda-role-${region}`, {
      provider: provider,
      name: `secure-env-lambda-role-${region}`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "lambda.amazonaws.com",
            },
          },
        ],
      }),
      tags: {
        Name: `secure-env-lambda-role-${region}`,
        Environment: "secure-env",
      },
    });

    // Least privilege policy for Lambda functions
    new IamRolePolicy(this, `secure-env-lambda-policy-${region}`, {
      provider: provider,
      name: `secure-env-lambda-policy-${region}`,
      role: lambdaRole.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
            ],
            Resource: "arn:aws:logs:*:*:*",
          },
          {
            Effect: "Allow",
            Action: [
              "ec2:CreateNetworkInterface",
              "ec2:DescribeNetworkInterfaces",
              "ec2:DeleteNetworkInterface",
            ],
            Resource: "*",
          },
          {
            Effect: "Allow",
            Action: [
              "kms:Decrypt",
              "kms:DescribeKey",
            ],
            Resource: kmsKeyArn,
          },
        ],
      }),
    });

    // CloudWatch Log Group for Lambda
    const lambdaLogGroup = new CloudwatchLogGroup(this, `secure-env-lambda-logs-${region}`, {
      provider: provider,
      name: `/aws/lambda/secure-env-function-${region}`,
      retentionInDays: 14,
      kmsKeyId: kmsKeyArn,
      tags: {
        Name: `secure-env-lambda-logs-${region}`,
        Environment: "secure-env",
      },
    });

    // Lambda Function with logging enabled
    const lambdaFunction = new LambdaFunction(this, `secure-env-lambda-${region}`, {
      provider: provider,
      functionName: `secure-env-function-${region}`,
      role: lambdaRole.arn,
      handler: "index.handler",
      runtime: "nodejs18.x",
      filename: "lambda.zip", // This would need to be created separately
      sourceCodeHash: "placeholder", // This would be calculated from the actual zip file
      environment: {
        variables: {
          ENVIRONMENT: "secure-env",
          KMS_KEY_ID: kmsKeyArn,
        },
      },
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [privateSecurityGroup.id],
      },
      dependsOn: [lambdaLogGroup],
      tags: {
        Name: `secure-env-lambda-${region}`,
        Environment: "secure-env",
      },
    });

    // EC2 Instance in public subnet (restricted access)
    const webInstance = new Instance(this, `secure-env-web-instance-${region}`, {
      provider: provider,
      ami: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI (adjust for region)
      instanceType: "t3.micro",
      subnetId: publicSubnet1.id,
      vpcSecurityGroupIds: [webSecurityGroup.id],
      iamInstanceProfile: ec2Role.name,
      userData: `#!/bin/bash
        yum update -y
        yum install -y awslogs
        systemctl start awslogsd
        systemctl enable awslogsd
      `,
      tags: {
        Name: `secure-env-web-instance-${region}`,
        Environment: "secure-env",
        Type: "web-server",
      },
    });

    // EC2 Instance in private subnet
    const privateInstance = new Instance(this, `secure-env-private-instance-${region}`, {
      provider: provider,
      ami: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI (adjust for region)
      instanceType: "t3.micro",
      subnetId: privateSubnet1.id,
      vpcSecurityGroupIds: [privateSecurityGroup.id],
      iamInstanceProfile: ec2Role.name,
      userData: `#!/bin/bash
        yum update -y
        yum install -y awslogs
        systemctl start awslogsd
        systemctl enable awslogsd
      `,
      tags: {
        Name: `secure-env-private-instance-${region}`,
        Environment: "secure-env",
        Type: "private-server",
      },
    });

    return {
      vpc,
      publicSubnets: [publicSubnet1, publicSubnet2],
      privateSubnets: [privateSubnet1, privateSubnet2],
      webInstance,
      privateInstance,
      lambdaFunction,
    };
  }

  private setupCloudTrailAndAlerting(provider: AwsProvider, kmsKeyArn: string) {
    // S3 Bucket for CloudTrail logs
    const cloudtrailBucket = new S3Bucket(this, "secure-env-cloudtrail-bucket", {
      provider: provider,
      bucket: "secure-env-cloudtrail-logs-${random_id}",
      tags: {
        Name: "secure-env-cloudtrail-bucket",
        Environment: "secure-env",
      },
    });

    // S3 Bucket encryption
    new S3BucketEncryption(this, "secure-env-cloudtrail-bucket-encryption", {
      provider: provider,
      bucket: cloudtrailBucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: kmsKeyArn,
            sseAlgorithm: "aws:kms",
          },
        },
      },
    });

    // Block public access to S3 bucket
    new S3BucketPublicAccessBlock(this, "secure-env-cloudtrail-bucket-pab", {
      provider: provider,
      bucket: cloudtrailBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // CloudTrail for monitoring
    const cloudtrail = new Cloudtrail(this, "secure-env-cloudtrail", {
      provider: provider,
      name: "secure-env-cloudtrail",
      s3BucketName: cloudtrailBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      kmsKeyId: kmsKeyArn,
      eventSelector: [
        {
          readWriteType: "All",
          includeManagementEvents: true,
          dataResource: [
            {
              type: "AWS::S3::Object",
              values: ["arn:aws:s3:::*/*"],
            },
          ],
        },
      ],
      tags: {
        Name: "secure-env-cloudtrail",
        Environment: "secure-env",
      },
    });

    // SNS Topic for alerts
    const alertTopic = new SnsTopic(this, "secure-env-security-alerts", {
      provider: provider,
      name: "secure-env-security-alerts",
      kmsKeyId: kmsKeyArn,
      tags: {
        Name: "secure-env-security-alerts",
        Environment: "secure-env",
      },
    });

    // CloudWatch Alarm for unauthorized access attempts
    new CloudwatchMetricAlarm(this, "secure-env-unauthorized-access-alarm", {
      provider: provider,
      alarmName: "secure-env-unauthorized-access-attempts",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "2",
      metricName: "ErrorCount",
      namespace: "AWS/CloudTrail",
      period: "300",
      statistic: "Sum",
      threshold: "5",
      alarmDescription: "Alert on unauthorized access attempts",
      alarmActions: [alertTopic.arn],
      dimensions: {
        ErrorCode: "AccessDenied",
      },
      tags: {
        Name: "secure-env-unauthorized-access-alarm",
        Environment: "secure-env",
      },
    });

    // CloudWatch Alarm for failed login attempts
    new CloudwatchMetricAlarm(this, "secure-env-failed-login-alarm", {
      provider: provider,
      alarmName: "secure-env-failed-login-attempts",
      comparisonOperator: "GreaterThanThreshold",
      evaluationPeriods: "1",
      metricName: "ErrorCount",
      namespace: "AWS/CloudTrail",
      period: "300",
      statistic: "Sum",
      threshold: "10",
      alarmDescription: "Alert on multiple failed login attempts",
      alarmActions: [alertTopic.arn],
      dimensions: {
        EventName: "ConsoleLogin",
      },
      tags: {
        Name: "secure-env-failed-login-alarm",
        Environment: "secure-env",
      },
    });
  }
}

const app = new App();
new SecureInfrastructureStack(app, "secure-infrastructure");
app.synth();
```

### Package Configuration

```json
// package.json
{
  "name": "secure-infrastructure-cdktf",
  "version": "1.0.0",
  "description": "Secure AWS infrastructure using CDKTF",
  "main": "main.ts",
  "scripts": {
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "test": "jest",
    "get": "cdktf get"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.19.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^18.15.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
```

### CDKTF Configuration

```json
// cdktf.json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "secure-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~>5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### Test Suite

```typescript
// tests/infrastructure.test.ts
import { Testing } from "cdktf";
import { SecureInfrastructureStack } from "../main";

describe("Secure Infrastructure Stack", () => {
  let stack: SecureInfrastructureStack;

  beforeEach(() => {
    const app = Testing.app();
    stack = new SecureInfrastructureStack(app, "test-stack");
  });

  test("should create VPCs in multiple regions", () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toHaveResourceWithProperties("aws_vpc", {
      cidr_block: "10.0.0.0/16",
      enable_dns_hostnames: true,
      enable_dns_support: true,
      tags: {
        Name: "secure-env-vpc-primary",
        Environment: "secure-env",
      },
    });

    expect(synthesized).toHaveResourceWithProperties("aws_vpc", {
      cidr_block: "10.1.0.0/16",
      enable_dns_hostnames: true,
      enable_dns_support: true,
      tags: {
        Name: "secure-env-vpc-secondary",
        Environment: "secure-env",
      },
    });
  });

  test("should create KMS keys for encryption", () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toHaveResourceWithProperties("aws_kms_key", {
      description: "KMS key for secure-env primary region encryption",
      key_usage: "ENCRYPT_DECRYPT",
      key_spec: "SYMMETRIC_DEFAULT",
    });
  });

  test("should create IAM roles with explicit policies", () => {
    const synthesized = Testing.synth(stack);
    expect(synthesized).toHaveResourceWithProperties("aws_iam_role", {
      name: expect.stringMatching(/secure-env-ec2-role/),
    });