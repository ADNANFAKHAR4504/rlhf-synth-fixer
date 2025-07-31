// lib/tap-stack.ts
import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { NetworkAclAssociation } from '@cdktf/provider-aws/lib/network-acl-association';

interface TapStackProps {
  region: string;
  amiId: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: TapStackProps) {
    super(scope, name);

    const { region, amiId } = props;
    const tags = { Environment: 'Production' };

    new AwsProvider(this, 'aws', { region });

    const vpc = new Vpc(this, 'SecureVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: 'secure-network' },
    });

    const subnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${region}a`,
      mapPublicIpOnLaunch: true,
      tags,
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
      tags,
    });

    const routeTable = new RouteTable(this, 'RouteTable', {
      vpcId: vpc.id,
      tags,
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
      tags,
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
      name: 'web-secure-sg',
      description: 'Allow HTTP and HTTPS',
      vpcId: vpc.id,
      ingress: [
        { fromPort: 80, toPort: 80, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
        { fromPort: 443, toPort: 443, protocol: 'tcp', cidrBlocks: ['0.0.0.0/0'] },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags,
    });

    const logBucket = new S3Bucket(this, 'LogBucket', {
      bucketPrefix: 'secure-app-logs-',
      forceDestroy: true,
      tags,
    });

    new S3BucketServerSideEncryptionConfiguration(this, 'LogBucketEncryption', {
      bucket: logBucket.bucket,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    const ec2Role = new IamRole(this, 'EC2LogRole', {
      name: 'ec2-log-writer-role',
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

    const ec2Policy = new IamPolicy(this, 'EC2S3LogPolicy', {
      name: 'ec2-s3-log-policy',
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
      iamInstanceProfile: ec2Role.name,
      tags,
    });
  }
}
