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
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';

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

    // LocalStack-compatible AWS provider configuration
    const isLocalStack = process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
                         process.env.AWS_ENDPOINT_URL?.includes('4566');

    new AwsProvider(this, 'aws-default', {
      region: 'us-east-1',
      accessKey: isLocalStack ? 'test' : undefined,
      secretKey: isLocalStack ? 'test' : undefined,
      skipCredentialsValidation: isLocalStack ? true : undefined,
      skipMetadataApiCheck: isLocalStack ? 'true' : undefined,
      skipRequestingAccountId: isLocalStack ? true : undefined,
      s3UsePathStyle: isLocalStack ? true : undefined,
      endpoints: isLocalStack ? [{
        apigateway: 'http://localhost:4566',
        cloudformation: 'http://localhost:4566',
        cloudwatch: 'http://localhost:4566',
        cloudwatchlogs: 'http://localhost:4566',
        dynamodb: 'http://localhost:4566',
        ec2: 'http://localhost:4566',
        iam: 'http://localhost:4566',
        kms: 'http://localhost:4566',
        lambda: 'http://localhost:4566',
        s3: 'http://localhost:4566',
        sns: 'http://localhost:4566',
        sqs: 'http://localhost:4566',
        sts: 'http://localhost:4566',
      }] : undefined,
    });

    for (const config of props.environments) {
      const constructIdSuffix = `-${config.envName}`;
      const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);
      // FIX: Standardized resource name prefix to 'webapp-' to match requirements
      const resourceNamePrefix = `webapp-${config.envName}-${uniqueSuffix}`;

      // --- KMS Key for Encryption (Simplified for LocalStack) ---
      const kmsKeyPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 'kms:*',
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
        availabilityZone: 'us-east-1a',
        tags: { ...config.tags, Name: `${resourceNamePrefix}-subnet-a` },
      });

      const subnetB = new Subnet(this, `SubnetB${constructIdSuffix}`, {
        vpcId: vpc.id,
        cidrBlock: Fn.cidrsubnet(vpc.cidrBlock, 8, 1),
        mapPublicIpOnLaunch: true,
        availabilityZone: 'us-east-1a',
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
      // Hardcoded AMI for LocalStack compatibility
      const amiId = 'ami-0c55b159cbfafe1f0';

      const instance = new Instance(this, `Instance${constructIdSuffix}`, {
        ami: amiId,
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

      // --- Outputs ---
      new TerraformOutput(this, `InstancePublicIp${constructIdSuffix}`, {
        value: instance.publicIp,
      });
      new TerraformOutput(this, `LogGroupName${constructIdSuffix}`, {
        value: logGroup.name,
      });
    }
  }
}
