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
