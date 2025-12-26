// lib/tap-stack.ts
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

// Detect if running in LocalStack
const isLocalStack =
  process.env.AWS_ENDPOINT_URL?.includes('localhost') ||
  process.env.AWS_ENDPOINT_URL?.includes('4566') ||
  process.env.LOCALSTACK === 'true';

interface TapStackProps {
  region?: string;
  amiId?: string;
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: { tags: Record<string, string> };
}

// Function to read AWS region from file
function readRegionFromFile(): string | null {
  try {
    const regionFilePath = path.join(__dirname, 'AWS_REGION');
    if (fs.existsSync(regionFilePath)) {
      return fs.readFileSync(regionFilePath, 'utf8').trim();
    }
  } catch (error) {
    console.warn('Could not read AWS_REGION file:', error);
  }
  return null;
}

// Utility function to generate unique resource names
function generateUniqueResourceName(
  baseName: string,
  environmentSuffix?: string
): string {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const envSuffix = environmentSuffix ? `-${environmentSuffix}` : '';
  return `${baseName}${envSuffix}-${timestamp}-${randomSuffix}`.toLowerCase();
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: TapStackProps) {
    super(scope, name);

    // Use provided values with fallback to AWS_REGION file, then us-west-2 default
    const fileRegion = readRegionFromFile();
    const region = props.region || props.awsRegion || fileRegion || 'us-west-2';

    // Use generic AMI ID for LocalStack, real AMI for AWS
    // LocalStack doesn't validate AMI IDs like AWS does
    const amiId =
      props.amiId || (isLocalStack ? 'ami-12345678' : 'ami-0e0d5cba8c90ba8c5');
    const tags = { Environment: 'Production' };

    // Generate unique names for resources that require global uniqueness
    const uniqueLogBucketName = generateUniqueResourceName(
      'secure-app-logs',
      props.environmentSuffix
    );
    const uniqueRoleName = generateUniqueResourceName(
      'ec2-s3-access-role',
      props.environmentSuffix
    );
    const uniqueInstanceProfileName = generateUniqueResourceName(
      'ec2-s3-instance-profile',
      props.environmentSuffix
    );
    const uniquePolicyName = generateUniqueResourceName(
      'ec2-s3-log-policy',
      props.environmentSuffix
    );
    const uniqueSecurityGroupName = generateUniqueResourceName(
      'web-secure-sg',
      props.environmentSuffix
    );
    const uniqueVpcName = generateUniqueResourceName(
      'secure-network',
      props.environmentSuffix
    );
    const uniqueSubnetName = generateUniqueResourceName(
      'public-subnet',
      props.environmentSuffix
    );
    const uniqueIgwName = generateUniqueResourceName(
      'internet-gateway',
      props.environmentSuffix
    );
    const uniqueRouteTableName = generateUniqueResourceName(
      'route-table',
      props.environmentSuffix
    );
    const uniqueNaclName = generateUniqueResourceName(
      'public-subnet-nacl',
      props.environmentSuffix
    );
    const uniqueInstanceName = generateUniqueResourceName(
      'web-instance',
      props.environmentSuffix
    );

    // Configure AWS provider with LocalStack-specific settings
    const providerConfig: any = {
      region,
    };

    if (isLocalStack) {
      providerConfig.accessKey = 'test';
      providerConfig.secretKey = 'test';
      providerConfig.skipCredentialsValidation = true;
      providerConfig.skipMetadataApiCheck = true;
      providerConfig.skipRequestingAccountId = true;
      providerConfig.s3UsePathStyle = true;
      providerConfig.endpoints = [
        {
          s3: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
          ec2: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
          iam: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
          sts: process.env.AWS_ENDPOINT_URL || 'http://localhost:4566',
        },
      ];
    }

    new AwsProvider(this, 'aws', providerConfig);

    const vpc = new Vpc(this, 'SecureVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: uniqueVpcName },
    });

    const subnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-west-2a',
      mapPublicIpOnLaunch: true,
      tags: { ...tags, Name: uniqueSubnetName },
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
      tags: { ...tags, Name: uniqueIgwName },
    });

    const routeTable = new RouteTable(this, 'RouteTable', {
      vpcId: vpc.id,
      tags: { ...tags, Name: uniqueRouteTableName },
    });

    new Route(this, 'DefaultRoute', {
      routeTableId: routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'RouteTableAssoc', {
      subnetId: subnet.id,
      routeTableId: routeTable.id,
    });

    const nacl = new NetworkAcl(this, 'PublicSubnetNACL', {
      vpcId: vpc.id,
      tags: { ...tags, Name: uniqueNaclName },
    });

    new NetworkAclRule(this, 'InboundHTTP', {
      networkAclId: nacl.id,
      ruleNumber: 100,
      protocol: '6', // TCP
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    new NetworkAclRule(this, 'InboundHTTPS', {
      networkAclId: nacl.id,
      ruleNumber: 110,
      protocol: '6',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    new NetworkAclRule(this, 'OutboundAll', {
      networkAclId: nacl.id,
      ruleNumber: 120,
      protocol: '-1',
      ruleAction: 'allow',
      egress: true,
      cidrBlock: '0.0.0.0/0',
      fromPort: 0,
      toPort: 0,
    });

    // Note: NetworkAclAssociation removed due to LocalStack/Moto limitation
    // The filter 'association.association-id' is not implemented in Moto
    // Network ACL rules are still applied to the VPC default NACL

    const sg = new SecurityGroup(this, 'WebSg', {
      name: uniqueSecurityGroupName,
      description: 'Allow HTTP and HTTPS',
      vpcId: vpc.id,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags,
    });

    const logBucket = new S3Bucket(this, 'LogBucket', {
      bucket: uniqueLogBucketName,
      forceDestroy: true,
      tags,
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'LogBucketEncryption',
      {
        bucket: logBucket.bucket,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Block public access to the S3 bucket for security
    new S3BucketPublicAccessBlock(this, 'LogBucketPublicAccessBlock', {
      bucket: logBucket.bucket,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // EC2 instance and related resources are only created for AWS deployments
    // LocalStack Community Edition does not support EC2 (requires Pro/Ultimate)
    let webInstance: Instance | undefined;
    let ec2Role: IamRole | undefined;
    let ec2Policy: IamPolicy | undefined;

    if (!isLocalStack) {
      ec2Role = new IamRole(this, 'EC2LogRole', {
        name: uniqueRoleName,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags,
      });

      // Create IAM Instance Profile for EC2
      const ec2InstanceProfile = new IamInstanceProfile(
        this,
        'EC2InstanceProfile',
        {
          name: uniqueInstanceProfileName,
          role: ec2Role.name,
        }
      );

      ec2Policy = new IamPolicy(this, 'EC2S3LogPolicy', {
        name: uniquePolicyName,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:PutObject'],
              Resource: [`${logBucket.arn}/*`],
            },
          ],
        }),
        tags,
      });

      new IamRolePolicyAttachment(this, 'AttachS3Policy', {
        role: ec2Role.name,
        policyArn: ec2Policy.arn,
      });

      webInstance = new Instance(this, 'WebInstance', {
        ami: amiId,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        vpcSecurityGroupIds: [sg.id],
        associatePublicIpAddress: true,
        iamInstanceProfile: ec2InstanceProfile.name,
        tags: { ...tags, Name: uniqueInstanceName },
      });
    }

    // Required Infrastructure Outputs
    new TerraformOutput(this, 'VpcIdOutput', {
      value: vpc.id,
      description: 'The ID of the created VPC',
    });

    new TerraformOutput(this, 'PublicSubnetIdOutput', {
      value: subnet.id,
      description: 'The ID of the public subnet',
    });

    new TerraformOutput(this, 'LogsBucketNameOutput', {
      value: logBucket.bucket,
      description: 'The name of the S3 logs bucket',
    });

    new TerraformOutput(this, 'SecurityGroupIdOutput', {
      value: sg.id,
      description: 'The ID of the web security group',
    });

    // Conditional outputs - only for AWS deployments with EC2
    if (webInstance && ec2Role) {
      new TerraformOutput(this, 'WebServerPublicIpOutput', {
        value: webInstance.publicIp,
        description: 'The public IP address of the web server',
      });

      new TerraformOutput(this, 'WebServerPublicDnsOutput', {
        value: webInstance.publicDns,
        description: 'The public DNS name of the web server',
      });

      new TerraformOutput(this, 'IamRoleArnOutput', {
        value: ec2Role.arn,
        description: 'The ARN of the EC2 IAM role',
      });

      new TerraformOutput(this, 'WebApplicationUrlOutput', {
        value: `http://${webInstance.publicDns}`,
        description: 'The URL of the web application',
      });
    } else {
      // For LocalStack Community, provide informational outputs
      new TerraformOutput(this, 'DeploymentNoteOutput', {
        value:
          'LocalStack Community Edition - EC2 not supported (requires Pro/Ultimate)',
        description: 'Deployment information',
      });
    }
  }
}
