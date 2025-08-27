# Secure, Monolithic AWS Infrastructure with CDKTF for TypeScript

This document outlines a secure, self-contained, and compliant AWS infrastructure setup provisioned using the Cloud Development Kit for Terraform (CDKTF) with TypeScript. The entire architecture is defined within a single, monolithic stack, ensuring that all resources are managed as a cohesive unit. This approach follows AWS best practices for security, encryption, and operational excellence.

## Core Architectural Features

- **Monolithic Stack Design**: All infrastructure is defined within a single `TapStack` construct. This simplifies deployment and state management, making it ideal for environments where resources are tightly coupled.
- **Encryption Everywhere**:
  - **At Rest (EBS & RDS)**: A dedicated, customer-managed **KMS Key** is created and used to enforce encryption on the EC2 instance's root EBS volume and the RDS database's storage.
  - **At Rest (S3)**: The central logging S3 bucket is configured with mandatory AES256 server-side encryption for all objects.
- **Secure Network Architecture**:
  - **VPC with Network Segmentation**: The architecture includes a VPC with separate public and private subnets.
  - **Private Database Subnets**: The RDS PostgreSQL database is placed exclusively in a private subnet, making it completely inaccessible from the public internet. It can only be reached by resources within the VPC, such as the application's EC2 instance.
- **Least-Privilege IAM**:
  - **Dedicated IAM Roles**: A specific IAM role with tightly scoped permissions is created and attached to the EC2 instance.
  - **Scoped Policies**: The role's policy only grants the necessary permissions (e.g., `s3:PutObject`) and is restricted to the specific ARN of the central logging bucket, avoiding dangerous wildcards.
- **Centralized and Managed Logging**: All major service logs are intended to be sent to a central S3 bucket. This bucket is configured with a **90-day retention policy** via a lifecycle rule to automatically manage log data and control costs.
- **Secrets and Configuration Management**:
  - **Secrets Manager**: The master password for the RDS database is randomly generated and securely stored in AWS Secrets Manager.
  - **Parameter Store**: The allowed IP range for SSH access is stored in AWS Systems Manager Parameter Store, allowing for secure and easy updates without changing the code.
- **Hardened Compute Access**: SSH access to the EC2 instance is restricted to a specific IP range fetched from Parameter Store, eliminating the risk of open access from `0.0.0.0/0`.
- **Database Resiliency**: The RDS instance has **automated backups enabled** with a 7-day retention period, ensuring point-in-time recovery capabilities.
- **Proactive Monitoring**: CloudWatch alarms are configured to monitor key performance metrics like CPU utilization for both the EC2 instance and the RDS database, enabling rapid detection of operational issues.

---

## Core Infrastructure Stack (`lib/tap-stack.ts`)

The following file contains the complete and final implementation for the unified, secure stack.

```typescript
import { Fn, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SsmParameter } from '@cdktf/provider-aws/lib/ssm-parameter';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Password } from '@cdktf/provider-random/lib/password';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // --- Provider & Basic Configuration ---
    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);
    const resourceNamePrefix = `webapp-${uniqueSuffix}`;

    const callerIdentity = new DataAwsCallerIdentity(
      this,
      'callerIdentity',
      {}
    );

    // --- Secrets & Parameter Management ---
    const sshAllowedIp = new SsmParameter(this, 'sshAllowedIp', {
      name: `/webapp/ssh-allowed-ip/${uniqueSuffix}`,
      type: 'String',
      value: '1.2.3.4/32', // Placeholder for a real, secure IP range
    });

    const dbPassword = new Password(this, 'dbPassword', {
      length: 16,
      special: true,
    });

    const dbSecret = new SecretsmanagerSecret(this, 'dbSecret', {
      namePrefix: 'webapp-db-secret-',
    });

    new SecretsmanagerSecretVersion(this, 'dbSecretVersion', {
      secretId: dbSecret.id,
      secretString: dbPassword.result,
    });

    // --- Centralized Logging Bucket ---
    const logBucket = new S3Bucket(this, 'logBucket', {
      bucket: resourceNamePrefix,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logBucketEncryption',
      {
        bucket: logBucket.bucket,
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      }
    );

    new S3BucketLifecycleConfigurationA(this, 'logBucketLifecycle', {
      bucket: logBucket.bucket,
      rule: [
        {
          id: 'log-retention',
          status: 'Enabled',
          expiration: {
            days: 90,
          },
        },
      ],
    });

    // --- KMS Key for Encrypting Storage ---
    const kmsKey = new KmsKey(this, 'kmsKey', {
      description: 'KMS key for webapp resources',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${callerIdentity.accountId}:root` },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
    });

    // --- Secure Networking (VPC) ---
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
    });

    const publicSubnet = new Subnet(this, 'publicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
    });

    const privateSubnet = new Subnet(this, 'privateSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.101.0/24',
      availabilityZone: 'us-east-1a',
    });

    const igw = new InternetGateway(this, 'igw', { vpcId: vpc.id });

    const publicRouteTable = new RouteTable(this, 'publicRouteTable', {
      vpcId: vpc.id,
      route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
    });

    new RouteTableAssociation(this, 'publicRta', {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // --- Database Layer (RDS) ---
    const dbSubnetGroup = new DbSubnetGroup(this, 'dbSubnetGroup', {
      subnetIds: [privateSubnet.id],
    });

    const dbSg = new SecurityGroup(this, 'dbSg', { vpcId: vpc.id });

    const dbInstance = new DbInstance(this, 'dbInstance', {
      allocatedStorage: 20,
      engine: 'postgres',
      engineVersion: '13.7',
      instanceClass: 'db.t3.micro',
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [dbSg.id],
      password: dbPassword.result,
      username: 'webappadmin',
      skipFinalSnapshot: true,
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
    });

    // --- Application Layer (EC2) ---
    const appSg = new SecurityGroup(this, 'appSg', {
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: [sshAllowedIp.value],
        },
      ],
      egress: [
        { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
      ],
    });

    new SecurityGroupRule(this, 'dbAccessFromApp', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      securityGroupId: dbSg.id,
      sourceSecurityGroupId: appSg.id,
    });

    const ec2Role = new IamRole(this, 'ec2Role', {
      name: resourceNamePrefix,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
    });

    const ec2Policy = new IamPolicy(this, 'ec2Policy', {
      name: resourceNamePrefix,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:PutObject'],
            Effect: 'Allow',
            Resource: `${logBucket.arn}/*`,
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ec2RoleAttachment', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    const instanceProfile = new IamInstanceProfile(this, 'instanceProfile', {
      name: resourceNamePrefix,
      role: ec2Role.name,
    });

    const ami = new DataAwsAmi(this, 'ami', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
    });

    const instance = new Instance(this, 'instance', {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [appSg.id],
      iamInstanceProfile: instanceProfile.name,
      rootBlockDevice: {
        encrypted: true,
        kmsKeyId: kmsKey.arn,
      },
    });

    // --- Monitoring (CloudWatch Alarms) ---
    new CloudwatchMetricAlarm(this, 'cpuAlarm', {
      alarmName: `${resourceNamePrefix}-high-cpu`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/EC2',
      period: 120,
      statistic: 'Average',
      threshold: 80,
      dimensions: { InstanceId: instance.id },
    });

    new CloudwatchMetricAlarm(this, 'dbCpuAlarm', {
      alarmName: `${resourceNamePrefix}-db-high-cpu`,
      comparisonOperator: 'GreaterThanOrEqualToThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 120,
      statistic: 'Average',
      threshold: 80,
      dimensions: { DBInstanceIdentifier: dbInstance.identifier },
    });
  }
}
```
