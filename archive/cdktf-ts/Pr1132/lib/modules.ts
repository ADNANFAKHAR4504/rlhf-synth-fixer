/**
 * lib/modules.ts
 *
 * Reusable CDKTF module classes for the TAP project.
 *
 * Exports:
 *  - VpcModule
 *  - S3Module
 *  - IamModule
 *  - SecurityModule
 *  - Ec2Module
 *
 * Notes:
 *  - Each module class is typed and returns the minimal outputs needed by callers (IDs, ARNs, names).
 *  - All resources created by modules are tagged. Caller must supply at least Environment & Owner via tags map.
 *
 * Safety:
 *  - SecurityModule accepts an sshCidr which defaults to "0.0.0.0/0" at the stack level for tests.
 *    This is dangerously open — tighten to a /32 of your admin IP for production.
 */

import { Construct } from 'constructs';
import { TerraformMetaArguments } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import {
  S3Bucket,
  S3BucketVersioning,
} from '@cdktf/provider-aws/lib/s3-bucket';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
/* ----------------------
 * Helper types & funcs
 * ---------------------*/
export interface TagMap {
  [key: string]: string;
}

function mergeTags(required: TagMap, extra?: TagMap): TagMap {
  return { ...required, ...(extra || {}) };
}

/* ======================
   VpcModule
   ====================== */

export interface VpcModuleProps extends TerraformMetaArguments {
  readonly cidr?: string; // default 10.0.0.0/24
  readonly tags: TagMap;
  readonly name?: string;
}

export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetId: string;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const vpcName = props.name ?? 'tap-vpc';

    const vpc = new Vpc(this, 'Vpc', {
      cidrBlock: props.cidr ?? '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: vpcName,
      },
    });

    this.vpcId = vpc.id;

    const publicSubnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      mapPublicIpOnLaunch: true,
      availabilityZone: `${process.env.CDKTF_REGION ?? 'us-west-2'}a`,
      tags: {
        ...props.tags,
        Name: `${vpcName}-public-subnet`,
      },
    });

    this.publicSubnetId = publicSubnet.id;

    const igw = new InternetGateway(this, 'InternetGateway', {
      vpcId: vpc.id,
      tags: {
        ...props.tags,
        Name: `${vpcName}-igw`,
      },
    });

    const routeTable = new RouteTable(this, 'PublicRouteTable', {
      vpcId: vpc.id,
      tags: {
        ...props.tags,
        Name: `${vpcName}-public-rt`,
      },
    });

    new Route(this, 'DefaultPublicRoute', {
      routeTableId: routeTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'PublicRouteAssoc', {
      subnetId: publicSubnet.id,
      routeTableId: routeTable.id,
    });
  }
}

/* ======================
   S3Module
   ====================== */
export interface S3ModuleProps extends TerraformMetaArguments {
  readonly bucketName?: string;
  readonly tags: TagMap;
  readonly forceDestroy?: boolean;
  readonly versioning?: boolean;
}

export class S3Module extends Construct {
  public readonly bucketName: string;
  public readonly bucketArn: string;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    const bucketName = props.bucketName ?? `${id.toLowerCase()}-appdata-new`;
    const tags = mergeTags(
      { Environment: props.tags.Environment, Owner: props.tags.Owner },
      props.tags
    );

    // Create S3 bucket. Use typed S3BucketVersioning for the versioning block.
    const bucket = new S3Bucket(this, 'bucket', {
      bucket: bucketName,
      forceDestroy: props.forceDestroy ?? false,
      versioning: props.versioning
        ? ({ enabled: true } as S3BucketVersioning)
        : undefined,
      tags,
    });

    this.bucketName = bucket.bucket;
    this.bucketArn = bucket.arn;
  }
}

/* ======================
   IamModule
   ====================== */
export interface IamModuleProps extends TerraformMetaArguments {
  readonly name?: string;
  readonly tags: TagMap;
  readonly s3BucketArn: string;
  readonly s3BucketName: string;
}

export class IamModule extends Construct {
  public readonly roleName: string;
  public readonly roleArn: string;
  public readonly instanceProfileName: string;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    const baseName = props.name ?? `${props.name}-${id}`;
    const roleName = `${baseName}-role`;
    const tags = mergeTags(
      { Environment: props.tags.Environment, Owner: props.tags.Owner },
      props.tags
    );

    // IAM role assumed by EC2
    const role = new IamRole(this, 'role', {
      name: roleName,
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

    // Inline policy: allow read/write/list to the target bucket
    const policyDoc = {
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
          Resource: [props.s3BucketArn, `${props.s3BucketArn}/*`],
        },
      ],
    };

    new IamRolePolicy(this, 'rolePolicy', {
      name: `${roleName}-s3-access`,
      role: role.id,
      policy: JSON.stringify(policyDoc),
    });

    // Instance profile for EC2
    const instanceProfile = new IamInstanceProfile(this, 'instanceProfile', {
      name: `${roleName}-profile`,
      role: role.name,
    });

    this.roleName = role.name;
    this.roleArn = role.arn;
    this.instanceProfileName = instanceProfile.name;
  }
}

/* ======================
   SecurityModule
   ====================== */
export interface SecurityModuleProps extends TerraformMetaArguments {
  readonly name?: string;
  readonly sshCidr: string; // variable ssh_cidr
  readonly vpcId: string;
  readonly tags: TagMap;
}

export class SecurityModule extends Construct {
  public readonly securityGroupId: string;
  public readonly securityGroupName: string;

  constructor(scope: Construct, id: string, props: SecurityModuleProps) {
    super(scope, id);

    const name = props.name ?? `${id}-sg`;
    const tags = mergeTags(
      { Environment: props.tags.Environment, Owner: props.tags.Owner },
      props.tags
    );

    // Security Group allowing SSH from configured CIDR and egress to anywhere.
    const sg = new SecurityGroup(this, 'sg', {
      name,
      description:
        'Security group for EC2 instance - allows SSH from configured CIDR',
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: [props.sshCidr],
          description: `SSH from ${props.sshCidr}`,
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags,
    });

    this.securityGroupId = sg.id;
    this.securityGroupName = sg.name;
  }
}

/* ======================
   Ec2Module
   ====================== */
export interface Ec2ModuleProps extends TerraformMetaArguments {
  readonly name?: string;
  readonly subnetId: string;
  readonly securityGroupIds: string[];
  readonly instanceProfileName: string;
  readonly instanceType?: string;
  readonly keyName?: string | undefined;
  readonly tags: TagMap;
  readonly amiNameRegex?: string;
  readonly amiOwners?: string[];
  // Additional optional filters could be added (architecture, virtualization-type, etc.)
}

export class Ec2Module extends Construct {
  public readonly instanceId: string;
  public readonly instancePublicIp: string;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    const name = props.name ?? `${id}-new-ec2`;
    const tags = mergeTags(
      { Environment: props.tags.Environment, Owner: props.tags.Owner },
      props.tags
    );

    // Look up the latest Amazon Linux 2 AMI using DataAwsAmi.
    // Default owner is the historical Amazon owner ID for Amazon Linux images.
    const ami = new DataAwsAmi(this, 'amiLookup', {
      mostRecent: true,
      owners: props.amiOwners ?? ['137112412989'],
      filter: [
        {
          name: 'name',
          values: [props.amiNameRegex ?? 'amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'architecture',
          values: ['x86_64'],
        },
      ],
    });

    const instance = new Instance(this, 'instance', {
      ami: ami.id,
      instanceType: props.instanceType ?? 't2.micro',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: props.securityGroupIds,
      iamInstanceProfile: props.instanceProfileName,
      keyName: props.keyName,
      associatePublicIpAddress: true,
      tags: { Name: name, ...tags },
    });

    this.instanceId = instance.id;
    this.instancePublicIp = instance.publicIp;
  }
}
