// modules.ts
import { Construct } from 'constructs';

/* CDKTF core */
import { Token } from 'cdktf';

/* AWS Provider resources */
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { NetworkAcl } from '@cdktf/provider-aws/lib/network-acl';
import { NetworkAclRule } from '@cdktf/provider-aws/lib/network-acl-rule';
import { FlowLog } from '@cdktf/provider-aws/lib/flow-log';

import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchLogResourcePolicy } from '@cdktf/provider-aws/lib/cloudwatch-log-resource-policy';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';

import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';

/* -----------------------------
   Types shared by modules
------------------------------*/
export type CommonTags = { [k: string]: string };

export interface NetworkInputs {
  name: string;
  cidrBlock: string;
  azs: string[]; // e.g., ["us-east-1a","us-east-1b"]
  publicSubnetCidrs: string[]; // length must match azs
  privateSubnetCidrs: string[]; // length must match azs
  enableFlowLogs?: boolean;
  logGroupName?: string; // where VPC Flow Logs go
  tags?: CommonTags;
  logGroupArn: string;
}

/* -----------------------------
   CloudWatch + Logging
------------------------------*/
export interface LoggingOutputs {
  logGroup: CloudwatchLogGroup;
  trail?: Cloudtrail;
  vpcFlowLogsRole?: IamRole;
}

export class LoggingModule extends Construct {
  public readonly logGroup: CloudwatchLogGroup;
  public readonly resourcePolicy: CloudwatchLogResourcePolicy;

  constructor(
    scope: Construct,
    id: string,
    props: { name: string; retentionDays?: number; tags?: CommonTags }
  ) {
    super(scope, id);

    // Central Log Group used by Flow Logs and CloudTrail
    this.logGroup = new CloudwatchLogGroup(this, 'lg', {
      name: `/${props.name}/central`,
      retentionInDays: props.retentionDays ?? 90, // keep logs for 90 days by default
      tags: props.tags,
    });

    // Broad resource policy to allow AWS services (e.g., CloudTrail) to put logs
    const policyDoc = new DataAwsIamPolicyDocument(this, 'lg-policy-doc', {
      statement: [
        {
          sid: 'AllowServicesToPutLogs',
          effect: 'Allow',
          principals: [
            {
              type: 'Service',
              identifiers: [
                'cloudtrail.amazonaws.com',
                'vpc-flow-logs.amazonaws.com',
              ],
            },
          ],
          actions: [
            'logs:PutLogEvents',
            'logs:CreateLogStream',
            'logs:DescribeLogStreams',
            'logs:DescribeLogGroups',
          ],
          resources: [this.logGroup.arn, `${this.logGroup.arn}:*`],
        },
      ],
    });

    this.resourcePolicy = new CloudwatchLogResourcePolicy(this, 'lg-policy', {
      policyDocument: Token.asString(policyDoc.json),
      policyName: `${props.name}-cw-resource-policy`,
    });
  }
}

/* -----------------------------
   KMS for S3 encryption
------------------------------*/
export class KmsModule extends Construct {
  public readonly key: KmsKey;

  constructor(
    scope: Construct,
    id: string,
    props: { name: string; tags?: CommonTags }
  ) {
    super(scope, id);

    this.key = new KmsKey(this, 'kms', {
      description: `CMK for ${props.name} S3 encryption`,
      enableKeyRotation: true,
      policy: undefined, // Default: key owner is account root; least-privilege is enforced via bucket policies/IAM
      tags: props.tags,
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/${props.name}-s3`,
      targetKeyId: this.key.keyId,
    });
  }
}

/* -----------------------------
   Secure S3 bucket (SSE-KMS)
------------------------------*/
export class SecureBucketModule extends Construct {
  public readonly bucket: S3Bucket;

  constructor(
    scope: Construct,
    id: string,
    props: {
      name: string; // logical name; bucket name will be name + suffix if needed
      bucketName: string; // explicit name from variables
      kmsKeyArn: string; // KMS CMK ARN
      blockPublicAccess?: boolean;
      enableVersioning?: boolean;
      tags?: CommonTags;
    }
  ) {
    super(scope, id);

    // S3 bucket for sensitive data
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      forceDestroy: false,
      tags: props.tags,
    });

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: props.blockPublicAccess ?? true,
      blockPublicPolicy: props.blockPublicAccess ?? true,
      ignorePublicAcls: props.blockPublicAccess ?? true,
      restrictPublicBuckets: props.blockPublicAccess ?? true,
    });

    // Versioning for safety
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: (props.enableVersioning ?? true) ? 'Enabled' : 'Suspended',
      },
    });

    // Enforce SSE-KMS with our CMK
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-sse', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: props.kmsKeyArn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Bucket policy: deny unencrypted puts and insecure transport
    const bp = new DataAwsIamPolicyDocument(this, 'bucket-policy-doc', {
      statement: [
        {
          sid: 'DenyIncorrectEncryptionHeader',
          effect: 'Deny',
          principals: [{ type: '*', identifiers: ['*'] }],
          actions: ['s3:PutObject'],
          resources: [`${this.bucket.arn}/*`],
          condition: [
            {
              test: 'StringNotEquals',
              variable: 's3:x-amz-server-side-encryption',
              values: ['aws:kms'],
            },
          ],
        },
        {
          sid: 'DenyUnencryptedObjectUploads',
          effect: 'Deny',
          principals: [{ type: '*', identifiers: ['*'] }],
          actions: ['s3:PutObject'],
          resources: [`${this.bucket.arn}/*`],
          condition: [
            {
              test: 'Null',
              variable: 's3:x-amz-server-side-encryption',
              values: ['true'],
            },
          ],
        },
        {
          sid: 'DenyInsecureTransport',
          effect: 'Deny',
          principals: [{ type: '*', identifiers: ['*'] }],
          actions: ['s3:*'],
          resources: [this.bucket.arn, `${this.bucket.arn}/*`],
          condition: [
            {
              test: 'Bool',
              variable: 'aws:SecureTransport',
              values: ['false'],
            },
          ],
        },
      ],
    });

    new S3BucketPolicy(this, 'bucket-policy', {
      bucket: this.bucket.id,
      policy: Token.asString(bp.json),
    });
  }
}

/* -----------------------------
   VPC with public/private subnets, NAT, routes, NACLs, SGs, Flow Logs
------------------------------*/
export class NetworkModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly publicRouteTables: RouteTable[] = [];
  public readonly privateRouteTables: RouteTable[] = [];
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string, props: NetworkInputs) {
    super(scope, id);

    const name = props.name;
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { Name: `${name}-vpc`, ...(props.tags ?? {}) },
    });

    const igw = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: { Name: `${name}-igw`, ...(props.tags ?? {}) },
    });

    // Create public/private subnets across AZs
    props.azs.forEach((az, i) => {
      const pub = new Subnet(this, `public-${i}`, {
        vpcId: this.vpc.id,
        availabilityZone: az,
        cidrBlock: props.publicSubnetCidrs[i],
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${name}-public-${i}`,
          Tier: 'public',
          ...(props.tags ?? {}),
        },
      });
      this.publicSubnets.push(pub);

      const priv = new Subnet(this, `private-${i}`, {
        vpcId: this.vpc.id,
        availabilityZone: az,
        cidrBlock: props.privateSubnetCidrs[i],
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${name}-private-${i}`,
          Tier: 'private',
          ...(props.tags ?? {}),
        },
      });
      this.privateSubnets.push(priv);
    });

    // One NAT gateway in the first public subnet (cost‑optimized)
    const eip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: { Name: `${name}-nat-eip`, ...(props.tags ?? {}) },
    });

    this.natGateway = new NatGateway(this, 'nat', {
      allocationId: eip.allocationId,
      subnetId: this.publicSubnets[0].id,
      tags: { Name: `${name}-nat`, ...(props.tags ?? {}) },
    });

    // Public route tables -> IGW
    this.publicSubnets.forEach((subnet, i) => {
      const rt = new RouteTable(this, `public-rt-${i}`, {
        vpcId: this.vpc.id,
        tags: { Name: `${name}-public-rt-${i}`, ...(props.tags ?? {}) },
      });
      this.publicRouteTables.push(rt);

      new Route(this, `public-default-${i}`, {
        routeTableId: rt.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      });

      new RouteTableAssociation(this, `public-rta-${i}`, {
        routeTableId: rt.id,
        subnetId: subnet.id,
      });
    });

    // Private route tables -> NAT
    this.privateSubnets.forEach((subnet, i) => {
      const rt = new RouteTable(this, `private-rt-${i}`, {
        vpcId: this.vpc.id,
        tags: { Name: `${name}-private-rt-${i}`, ...(props.tags ?? {}) },
      });
      this.privateRouteTables.push(rt);

      new Route(this, `private-default-${i}`, {
        routeTableId: rt.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateway.id,
      });

      new RouteTableAssociation(this, `private-rta-${i}`, {
        routeTableId: rt.id,
        subnetId: subnet.id,
      });
    });

    // Optional: VPC Flow Logs to CloudWatch
    if (props.enableFlowLogs && props.logGroupName) {
      // IAM Role for VPC Flow Logs to push to CW Logs
      const assumeDoc = new DataAwsIamPolicyDocument(this, 'vfl-assume', {
        statement: [
          {
            effect: 'Allow',
            principals: [
              { type: 'Service', identifiers: ['vpc-flow-logs.amazonaws.com'] },
            ],
            actions: ['sts:AssumeRole'],
          },
        ],
      });

      const role = new IamRole(this, 'vfl-role', {
        name: `${name}-vpc-flow-logs-role`,
        assumeRolePolicy: Token.asString(assumeDoc.json),
        tags: props.tags,
      });

      const putLogsDoc = new DataAwsIamPolicyDocument(this, 'vfl-putlogs', {
        statement: [
          {
            effect: 'Allow',
            actions: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:DescribeLogStreams',
              'logs:DescribeLogGroups',
            ],
            resources: ['*'], // Least privilege could target the specific log group ARN; wildcard keeps module generic
          },
        ],
      });

      new IamRolePolicy(this, 'vfl-role-policy', {
        role: role.name,
        name: `${name}-vpc-flow-logs-put`,
        policy: Token.asString(putLogsDoc.json),
      });

      new FlowLog(this, 'vpc-flow-logs', {
        logDestinationType: 'cloud-watch-logs',
        logDestination: props.logGroupArn, // must pass ARN, not name
        iamRoleArn: role.arn,
        trafficType: 'ALL',
        vpcId: this.vpc.id,
        tags: props.tags,
      });
    }
  }
}

/* -----------------------------
   Security Groups (least privilege)
------------------------------*/
export interface SgInputs {
  name: string;
  vpcId: string;
  allowSshFrom?: string[]; // e.g., ["203.0.113.0/24"]
  allowHttpFrom?: string[]; // e.g., ["0.0.0.0/0"]
  allowHttpsFrom?: string[]; // e.g., ["0.0.0.0/0"]
  tags?: CommonTags;
}

export class SecurityGroupsModule extends Construct {
  public readonly bastionSg: SecurityGroup;
  public readonly webSg: SecurityGroup;
  public readonly appSg: SecurityGroup;

  constructor(scope: Construct, id: string, props: SgInputs) {
    super(scope, id);

    // Bastion SG: only SSH from defined ranges
    this.bastionSg = new SecurityGroup(this, 'bastion-sg', {
      name: `${props.name}-bastion-sg`,
      description: 'Bastion host security group',
      vpcId: props.vpcId,
      revokeRulesOnDelete: true,
      tags: props.tags,
    });

    (props.allowSshFrom ?? []).forEach((cidr, i) => {
      new SecurityGroupRule(this, `bastion-ssh-${i}`, {
        type: 'ingress',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [cidr],
        securityGroupId: this.bastionSg.id,
      });
    });

    new SecurityGroupRule(this, 'bastion-egress-all', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.bastionSg.id,
    });

    // Web SG: HTTP/HTTPS from defined ranges
    this.webSg = new SecurityGroup(this, 'web-sg', {
      name: `${props.name}-web-sg`,
      description: 'Web tier security group',
      vpcId: props.vpcId,
      revokeRulesOnDelete: true,
      tags: props.tags,
    });

    (props.allowHttpFrom ?? []).forEach((cidr, i) => {
      new SecurityGroupRule(this, `web-http-${i}`, {
        type: 'ingress',
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: [cidr],
        securityGroupId: this.webSg.id,
      });
    });
    (props.allowHttpsFrom ?? []).forEach((cidr, i) => {
      new SecurityGroupRule(this, `web-https-${i}`, {
        type: 'ingress',
        fromPort: 443,
        toPort: 443,
        protocol: 'tcp',
        cidrBlocks: [cidr],
        securityGroupId: this.webSg.id,
      });
    });

    new SecurityGroupRule(this, 'web-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSg.id,
    });

    // App SG: only from Web SG (east-west)
    this.appSg = new SecurityGroup(this, 'app-sg', {
      name: `${props.name}-app-sg`,
      description: 'App tier security group',
      vpcId: props.vpcId,
      revokeRulesOnDelete: true,
      tags: props.tags,
    });

    new SecurityGroupRule(this, 'app-from-web', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: this.webSg.id,
      securityGroupId: this.appSg.id,
    });

    new SecurityGroupRule(this, 'app-egress-https', {
      type: 'egress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.appSg.id,
    });
  }
}

/* -----------------------------
   Network ACLs (stateless hardening)
------------------------------*/
export class NaclModule extends Construct {
  public readonly publicNacl: NetworkAcl;
  public readonly privateNacl: NetworkAcl;

  constructor(
    scope: Construct,
    id: string,
    props: {
      name: string;
      vpcId: string;
      publicSubnetIds: string[];
      privateSubnetIds: string[];
      allowSshFrom?: string[];
      allowHttpFrom?: string[];
      allowHttpsFrom?: string[];
      tags?: CommonTags;
    }
  ) {
    super(scope, id);

    // Public NACL (allow HTTP/HTTPS/SSH inbound from allow lists; ephemeral return traffic)
    this.publicNacl = new NetworkAcl(this, 'public-nacl', {
      vpcId: props.vpcId,
      subnetIds: props.publicSubnetIds,
      tags: { Name: `${props.name}-public-nacl`, ...(props.tags ?? {}) },
    });

    let ruleNumber = 100;
    for (const cidr of props.allowSshFrom ?? []) {
      new NetworkAclRule(this, `pub-in-ssh-${ruleNumber}`, {
        networkAclId: this.publicNacl.id,
        egress: false,
        protocol: 'tcp',
        ruleAction: 'allow',
        ruleNumber: ruleNumber++,
        cidrBlock: cidr,
        fromPort: 22,
        toPort: 22,
      });
    }
    for (const cidr of props.allowHttpFrom ?? []) {
      new NetworkAclRule(this, `pub-in-http-${ruleNumber}`, {
        networkAclId: this.publicNacl.id,
        egress: false,
        protocol: 'tcp',
        ruleAction: 'allow',
        ruleNumber: ruleNumber++,
        cidrBlock: cidr,
        fromPort: 80,
        toPort: 80,
      });
    }
    for (const cidr of props.allowHttpsFrom ?? []) {
      new NetworkAclRule(this, `pub-in-https-${ruleNumber}`, {
        networkAclId: this.publicNacl.id,
        egress: false,
        protocol: 'tcp',
        ruleAction: 'allow',
        ruleNumber: ruleNumber++,
        cidrBlock: cidr,
        fromPort: 443,
        toPort: 443,
      });
    }

    // Ephemeral return traffic inbound
    new NetworkAclRule(this, 'pub-in-ephemeral', {
      networkAclId: this.publicNacl.id,
      egress: false,
      protocol: 'tcp',
      ruleAction: 'allow',
      ruleNumber: 200,
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
    });

    // All egress
    new NetworkAclRule(this, 'pub-eg-all', {
      networkAclId: this.publicNacl.id,
      egress: true,
      protocol: '-1',
      ruleAction: 'allow',
      ruleNumber: 100,
      cidrBlock: '0.0.0.0/0',
      fromPort: 0,
      toPort: 0,
    });

    // Private NACL (no inbound from internet; allow ephemeral return + egress 443)
    this.privateNacl = new NetworkAcl(this, 'private-nacl', {
      vpcId: props.vpcId,
      subnetIds: props.privateSubnetIds,
      tags: { Name: `${props.name}-private-nacl`, ...(props.tags ?? {}) },
    });

    // Inbound: allow ephemeral (responses)
    new NetworkAclRule(this, 'priv-in-ephemeral', {
      networkAclId: this.privateNacl.id,
      egress: false,
      protocol: 'tcp',
      ruleAction: 'allow',
      ruleNumber: 100,
      cidrBlock: '0.0.0.0/0',
      fromPort: 1024,
      toPort: 65535,
    });

    // Egress: HTTPS to anywhere
    new NetworkAclRule(this, 'priv-eg-https', {
      networkAclId: this.privateNacl.id,
      egress: true,
      protocol: 'tcp',
      ruleAction: 'allow',
      ruleNumber: 100,
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });
  }
}

/* -----------------------------
   CloudTrail module (Org/Account trail -> CW Logs + S3)
------------------------------*/
export class CloudTrailModule extends Construct {
  public readonly trail: Cloudtrail;

  constructor(
    scope: Construct,
    id: string,
    props: {
      name: string;
      s3BucketName: string; // CloudTrail delivery bucket (should exist & be secured)
      cloudWatchLogGroupArn: string;
      region: string;
      tags?: CommonTags;
    }
  ) {
    super(scope, id);

    // Role for CloudTrail to push to CloudWatch Logs
    const assumeDoc = new DataAwsIamPolicyDocument(this, 'ct-assume', {
      statement: [
        {
          effect: 'Allow',
          principals: [
            { type: 'Service', identifiers: ['cloudtrail.amazonaws.com'] },
          ],
          actions: ['sts:AssumeRole'],
        },
      ],
    });

    const role = new IamRole(this, 'ct-role', {
      name: `${props.name}-cloudtrail-role`,
      assumeRolePolicy: Token.asString(assumeDoc.json),
      tags: props.tags,
    });

    const putLogsDoc = new DataAwsIamPolicyDocument(this, 'ct-putlogs', {
      statement: [
        {
          effect: 'Allow',
          actions: [
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
          ],
          resources: ['*'], // Could be narrowed to props.cloudWatchLogGroupArn and :*
        },
      ],
    });

    new IamRolePolicy(this, 'ct-role-policy', {
      role: role.name,
      name: `${props.name}-cloudtrail-putlogs`,
      policy: Token.asString(putLogsDoc.json),
    });

    // CloudTrail sending mgmt + data events to CW Logs and S3
    this.trail = new Cloudtrail(this, 'trail', {
      name: `${props.name}-trail`,
      s3BucketName: props.s3BucketName,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      cloudWatchLogsGroupArn: props.cloudWatchLogGroupArn,
      cloudWatchLogsRoleArn: role.arn,
      // Example: enable S3 data events for all buckets (adjust as needed)
      eventSelector: [
        {
          readWriteType: 'All',
          includeManagementEvents: true,
          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: ['arn:aws:s3:::'], // all buckets (least-privilege: set to specific buckets if desired)
            },
          ],
        },
      ],
      tags: props.tags,
    });
  }
}
