// lib/tap-stack.ts
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface TapStackProps {
  region?: string;
  amiId?: string;
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: { tags: Record<string, string> };
}

// Utility function to generate unique resource names
function generateUniqueResourceName(baseName: string, environmentSuffix?: string): string {
  const timestamp = Date.now().toString(36);
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const envSuffix = environmentSuffix ? `-${environmentSuffix}` : '';
  return `${baseName}${envSuffix}-${timestamp}-${randomSuffix}`.toLowerCase();
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: TapStackProps) {
    super(scope, name);

    // Use provided values or hardcoded defaults for us-west-2
    const region = props.region || props.awsRegion || 'us-west-2';
    // Official Amazon Linux 2 AMI for us-west-2 as of July 2025
    const amiId = props.amiId || 'ami-0cf2b4e024cdb6960';
    const tags = { Environment: 'Production' };
    // Use environmentSuffix for resource names if provided
    const nameSuffix = props.environmentSuffix
      ? `${name}-${props.environmentSuffix}`
      : name;

    // Generate unique names for resources that require global uniqueness
    const uniqueLogBucketName = generateUniqueResourceName('secure-app-logs', props.environmentSuffix);
    const uniqueRoleName = generateUniqueResourceName('ec2-s3-access-role', props.environmentSuffix);
    const uniqueInstanceProfileName = generateUniqueResourceName('ec2-s3-instance-profile', props.environmentSuffix);
    const uniquePolicyName = generateUniqueResourceName('ec2-s3-log-policy', props.environmentSuffix);
    const uniqueSecurityGroupName = generateUniqueResourceName('web-secure-sg', props.environmentSuffix);
    const uniqueVpcName = generateUniqueResourceName('secure-network', props.environmentSuffix);
    const uniqueSubnetName = generateUniqueResourceName('public-subnet', props.environmentSuffix);
    const uniqueIgwName = generateUniqueResourceName('internet-gateway', props.environmentSuffix);
    const uniqueRouteTableName = generateUniqueResourceName('route-table', props.environmentSuffix);
    const uniqueNaclName = generateUniqueResourceName('public-subnet-nacl', props.environmentSuffix);
    const uniqueInstanceName = generateUniqueResourceName('web-instance', props.environmentSuffix);

    new AwsProvider(this, 'aws', { region });

    const vpc = new Vpc(this, 'SecureVpc', {
      cidrBlock: '172.16.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: uniqueVpcName },
    });

    const subnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '172.16.1.0/24',
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

    new NetworkAclAssociation(this, 'SubnetNaclAssoc', {
      networkAclId: nacl.id,
      subnetId: subnet.id,
    });

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

    const ec2Role: IamRole = new IamRole(this, 'EC2LogRole', {
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

    const ec2Policy = new IamPolicy(this, 'EC2S3LogPolicy', {
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

    new Instance(this, 'WebInstance', {
      ami: amiId,
      instanceType: 't3.micro',
      subnetId: subnet.id,
      vpcSecurityGroupIds: [sg.id],
      associatePublicIpAddress: true,
      iamInstanceProfile: ec2InstanceProfile.name,
      tags: { ...tags, Name: uniqueInstanceName },
    });

    // Example: Output the VPC ID
    new TerraformOutput(this, 'VpcIdOutput', {
      value: vpc.id,
      description: 'The ID of the created VPC',
    });
  }
}
