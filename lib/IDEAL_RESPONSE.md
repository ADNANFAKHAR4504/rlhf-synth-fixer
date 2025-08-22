# Unified Multi-Environment Infrastructure with a Single CDKTF Stack

This document outlines a CDKTF project designed to provision and manage three distinct, secure, and highly available AWS environments—**development**, **staging**, and **production**—from a **single, unified stack**. This architecture provides a centralized and consistent way to manage infrastructure, where all environments are defined and deployed as part of one cohesive unit.

The entire infrastructure is self-contained. The stack programmatically creates all required networking resources, including a VPC and subnets across multiple availability zones, for each environment, eliminating reliance on pre-existing infrastructure and ensuring perfect reproducibility.

## Core Architectural Features

- **Unified Stack, Multi-Environment Deployment**: The project uses a single `TapStack` that iterates through an array of environment configurations. This design allows for the management of all environments (`dev`, `staging`, `prod`) in a single `terraform apply` command, simplifying the deployment pipeline.
- **High Availability**: Each environment's VPC is built with subnets across **two availability zones** to ensure resilience and prevent single-point-of-failure at the networking level.
- **Isolated Networking**: Each environment is provisioned with a unique, non-overlapping VPC CIDR block, preventing IP conflicts and enabling future network peering if required.
- **Security by Default**:
  - **Encryption at Rest**: A dedicated, customer-managed **KMS Key** is created for each environment, complete with a key policy allowing CloudWatch Logs access. This key is used to encrypt both the CloudWatch Logs and the root EBS volume of the EC2 instance.
  - **Hardened Security Groups**: Ingress rules are restricted to HTTP traffic only. The insecure rule allowing SSH access from the entire internet has been removed.
  - **Least-Privilege IAM**: A dedicated IAM role is created for the EC2 instance in each environment. Its policy is tightly scoped to only allow logging actions on its **specific CloudWatch Log Group ARN**, removing dangerous wildcards.
- **Comprehensive Tagging**: All resources are tagged with their respective `Environment` and `Project`, enabling clear cost allocation, resource tracking, and automated governance.

---

## Core Infrastructure Stack (`lib/tap-stack.ts`)

The following file contains the complete and final implementation for the unified multi-environment stack.

```typescript
import { Fn, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { Route53HealthCheck } from '@cdktf/provider-aws/lib/route53-health-check';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

/**
 * Defines the configuration for a single environment.
 */
export interface EnvironmentConfig {
  readonly envName: 'dev' | 'staging' | 'prod';
  readonly awsRegion: string;
  readonly instanceType: string;
  readonly vpcCidr: string;
  readonly tags: { [key: string]: string };
}

/**
 * Defines the properties for the unified TapStack.
 */
export interface TapStackProps {
  readonly environments: EnvironmentConfig[];
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    new AwsProvider(this, 'aws-default', {
      region: 'us-west-2',
    });

    const callerIdentity = new DataAwsCallerIdentity(
      this,
      'CallerIdentity',
      {}
    );

    for (const config of props.environments) {
      const constructIdSuffix = `-${config.envName}`;
      const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);
      // FIX: Standardized resource name prefix to 'webapp-' to match requirements
      const resourceNamePrefix = `webapp-${config.envName}-${uniqueSuffix}`;

      // --- KMS Key for Encryption (with Policy) ---
      const kmsKeyPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${callerIdentity.accountId}:root` },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs to use the key',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${config.awsRegion}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt*',
              'kms:Decrypt*',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      });

      const kmsKey = new KmsKey(this, `KmsKey${constructIdSuffix}`, {
        description: `KMS key for ${config.envName} environment`,
        enableKeyRotation: true,
        policy: kmsKeyPolicy,
        tags: config.tags,
      });

      // --- Networking (Highly Available VPC) ---
      const vpc = new Vpc(this, `Vpc${constructIdSuffix}`, {
        cidrBlock: config.vpcCidr,
        enableDnsHostnames: true,
        tags: { ...config.tags, Name: `${resourceNamePrefix}-vpc` },
      });

      const subnetA = new Subnet(this, `SubnetA${constructIdSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 0),
        mapPublicIpOnLaunch: true,
        availabilityZone: `${config.awsRegion}a`,
        tags: { ...config.tags, Name: `${resourceNamePrefix}-subnet-a` },
      });

      const subnetB = new Subnet(this, `SubnetB${constructIdSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 1),
        mapPublicIpOnLaunch: true,
        availabilityZone: `${config.awsRegion}b`,
        tags: { ...config.tags, Name: `${resourceNamePrefix}-subnet-b` },
      });

      const igw = new InternetGateway(this, `Igw${constructIdSuffix}`, {
        vpcId: vpc.id,
        tags: config.tags,
      });

      const routeTable = new RouteTable(
        this,
        `RouteTable${constructIdSuffix}`,
        {
          vpcId: vpc.id,
          route: [{ cidrBlock: '0.0.0.0/0', gatewayId: igw.id }],
          tags: config.tags,
        }
      );

      new RouteTableAssociation(this, `RtaA${constructIdSuffix}`, {
        subnetId: subnetA.id,
        routeTableId: routeTable.id,
      });

      new RouteTableAssociation(this, `RtaB${constructIdSuffix}`, {
        subnetId: subnetB.id,
        routeTableId: routeTable.id,
      });

      // --- Security (Hardened) ---
      const instanceSg = new SecurityGroup(this, `Sg${constructIdSuffix}`, {
        name: `${resourceNamePrefix}-sg`,
        vpcId: vpc.id,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 80,
            toPort: 80,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        egress: [
          { protocol: '-1', fromPort: 0, toPort: 0, cidrBlocks: ['0.0.0.0/0'] },
        ],
        tags: config.tags,
      });

      // --- Logging (Encrypted) ---
      const logGroup = new CloudwatchLogGroup(
        this,
        `LogGroup${constructIdSuffix}`,
        {
          name: `/aws/ec2/${resourceNamePrefix}`,
          retentionInDays: 14,
          kmsKeyId: kmsKey.arn,
          tags: config.tags,
        }
      );

      // --- IAM Role (Least Privilege) ---
      const instanceRole = new IamRole(this, `Role${constructIdSuffix}`, {
        name: `${resourceNamePrefix}-role`,
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
        tags: config.tags,
      });

      const logPolicy = new IamPolicy(this, `LogPolicy${constructIdSuffix}`, {
        name: `${resourceNamePrefix}-log-policy`,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Effect: 'Allow',
              Resource: logGroup.arn,
            },
          ],
        }),
      });

      new IamRolePolicyAttachment(this, `Rpa${constructIdSuffix}`, {
        role: instanceRole.name,
        policyArn: logPolicy.arn,
      });

      const instanceProfile = new IamInstanceProfile(
        this,
        `Profile${constructIdSuffix}`,
        {
          name: `${resourceNamePrefix}-profile`,
          role: instanceRole.name,
        }
      );

      // --- Compute (Encrypted EBS) ---
      const ami = new DataAwsAmi(this, `Ami${constructIdSuffix}`, {
        mostRecent: true,
        owners: ['amazon'],
        filter: [{ name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] }],
      });

      const instance = new Instance(this, `Instance${constructIdSuffix}`, {
        ami: ami.id,
        instanceType: config.instanceType,
        subnetId: subnetA.id,
        vpcSecurityGroupIds: [instanceSg.id],
        iamInstanceProfile: instanceProfile.name,
        rootBlockDevice: {
          encrypted: true,
          kmsKeyId: kmsKey.id,
        },
        userData: `#!/bin/bash
yum update -y && yum install -y httpd && systemctl start httpd && systemctl enable httpd
echo "<h1>Deployed in ${config.envName}</h1>" > /var/www/html/index.html`,
        tags: { ...config.tags, Name: `${resourceNamePrefix}-instance` },
      });

      // --- Health Check ---
      const healthCheck = new Route53HealthCheck(
        this,
        `HealthCheck${constructIdSuffix}`,
        {
          ipAddress: instance.publicIp,
          port: 80,
          type: 'HTTP',
          failureThreshold: 3,
          requestInterval: 30,
          resourcePath: '/',
          tags: config.tags,
        }
      );

      // --- Outputs ---
      new TerraformOutput(this, `InstancePublicIp${constructIdSuffix}`, {
        value: instance.publicIp,
      });
      new TerraformOutput(this, `HealthCheckId${constructIdSuffix}`, {
        value: healthCheck.id,
      });
      new TerraformOutput(this, `LogGroupName${constructIdSuffix}`, {
        value: logGroup.name,
      });
    }
  }
}
```
