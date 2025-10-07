## modules.ts

```typescript
// modules.ts
import { Construct } from 'constructs';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
// import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
// import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamPolicyAttachment } from '@cdktf/provider-aws/lib/iam-policy-attachment';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging';
import { cloudtrail } from '@cdktf/provider-aws';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
// import { KmsKeyPolicy } from '@cdktf/provider-aws/lib/kms-key-policy';
// import { AwsConfigConfigurationRecorder } from '@cdktf/provider-aws/lib/config-configuration-recorder';
// import { AwsConfigDeliveryChannel } from '@cdktf/provider-aws/lib/config-delivery-channel';
// import { AwsConfigConfigRule } from '@cdktf/provider-aws/lib/config-config-rule';

// KMS Module
export interface KmsModuleProps {
  keyName: string;
  description: string;
  enableKeyRotation: boolean;
  tags?: { [key: string]: string };
}

export class KmsModule extends Construct {
  public readonly keyArn: string;
  public readonly keyId: string;
  public readonly keyAlias: string;

  constructor(scope: Construct, id: string, props: KmsModuleProps) {
    super(scope, id);

    const kmsKey = new KmsKey(this, 'key', {
      description: props.description,
      enableKeyRotation: props.enableKeyRotation,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Action: 'kms:*',
            Resource: '*',
          },
          // Add CloudTrail permissions here
          {
            Sid: 'Allow CloudTrail to encrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*', 'kms:Decrypt', 'kms:DescribeKey'],
            Resource: '*',
          },
        ],
      }),
      tags: props.tags,
    });

    const kmsAlias = new KmsAlias(this, 'alias', {
      name: `alias/${props.keyName}`,
      targetKeyId: kmsKey.id,
    });

    this.keyArn = kmsKey.arn;
    this.keyId = kmsKey.id;
    this.keyAlias = kmsAlias.name;
  }
}

// VPC Module
export interface VpcModuleProps {
  cidrBlock: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  availabilityZones: string[];
  tags?: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...props.tags, Name: `${id}-vpc` },
    });

    // Internet Gateway
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: { ...props.tags, Name: `${id}-igw` },
    });

    // Public Subnets, Route Tables, and Associations
    const publicSubnets: Subnet[] = [];
    const publicSubnetIds: string[] = [];

    for (let i = 0; i < props.publicSubnetCidrs.length; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: vpc.id,
        cidrBlock: props.publicSubnetCidrs[i],
        availabilityZone:
          props.availabilityZones[i % props.availabilityZones.length],
        mapPublicIpOnLaunch: true,
        tags: { ...props.tags, Name: `${id}-public-subnet-${i}` },
      });
      publicSubnets.push(subnet);
      publicSubnetIds.push(subnet.id);
    }

    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: vpc.id,
      tags: { ...props.tags, Name: `${id}-public-rt` },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    for (let i = 0; i < publicSubnets.length; i++) {
      new RouteTableAssociation(this, `public-rta-${i}`, {
        subnetId: publicSubnets[i].id,
        routeTableId: publicRouteTable.id,
      });
    }

    // Private Subnets, NAT Gateway, Route Tables, and Associations
    const privateSubnets: Subnet[] = [];
    const privateSubnetIds: string[] = [];
    const eip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: { ...props.tags, Name: `${id}-nat-eip` },
    });

    // Only create NAT Gateway if there are private subnets
    if (props.privateSubnetCidrs.length > 0) {
      // Create NAT Gateway in the first public subnet
      const natGateway = new NatGateway(this, 'nat', {
        allocationId: eip.id,
        subnetId: publicSubnets[0].id,
        tags: { ...props.tags, Name: `${id}-nat` },
      });

      const privateRouteTable = new RouteTable(this, 'private-rt', {
        vpcId: vpc.id,
        tags: { ...props.tags, Name: `${id}-private-rt` },
      });

      new Route(this, 'private-route', {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      for (let i = 0; i < props.privateSubnetCidrs.length; i++) {
        const subnet = new Subnet(this, `private-subnet-${i}`, {
          vpcId: vpc.id,
          cidrBlock: props.privateSubnetCidrs[i],
          availabilityZone:
            props.availabilityZones[i % props.availabilityZones.length],
          tags: { ...props.tags, Name: `${id}-private-subnet-${i}` },
        });
        privateSubnets.push(subnet);
        privateSubnetIds.push(subnet.id);

        new RouteTableAssociation(this, `private-rta-${i}`, {
          subnetId: subnet.id,
          routeTableId: privateRouteTable.id,
        });
      }
    }

    this.vpcId = vpc.id;
    this.publicSubnetIds = publicSubnetIds;
    this.privateSubnetIds = privateSubnetIds;
  }
}

// IAM Module
export interface IamRoleModuleProps {
  roleName: string;
  assumeRolePolicyDocument: any;
  inlinePolicies?: { [name: string]: any };
  managedPolicyArns?: string[];
  tags?: { [key: string]: string };
}

export class IamRoleModule extends Construct {
  public readonly roleArn: string;
  public readonly roleName: string;

  constructor(scope: Construct, id: string, props: IamRoleModuleProps) {
    super(scope, id);

    const role = new IamRole(this, 'role', {
      name: props.roleName,
      assumeRolePolicy: JSON.stringify(props.assumeRolePolicyDocument),
      tags: props.tags,
    });

    if (props.inlinePolicies) {
      Object.entries(props.inlinePolicies).forEach(
        ([name, policyDocument], index) => {
          new IamRolePolicy(this, `inline-policy-${index}`, {
            role: role.name,
            name,
            policy: JSON.stringify(policyDocument),
          });
        }
      );
    }

    if (props.managedPolicyArns) {
      props.managedPolicyArns.forEach((policyArn, index) => {
        new IamPolicyAttachment(this, `policy-attachment-${index}`, {
          name: `${props.roleName}-policy-attachment-${index}`,
          roles: [role.name],
          policyArn,
        });
      });
    }

    this.roleArn = role.arn;
    this.roleName = role.name;
  }
}

// S3 Module
export interface S3BucketModuleProps {
  bucketName: string;
  kmsKeyId: string;
  accessRoleArn?: string;
  loggingBucket?: string;
  loggingPrefix?: string;
  allowCloudTrailAccess?: boolean;
  cloudTrailPrefix?: string;
  tags?: { [key: string]: string };
}

export class S3BucketModule extends Construct {
  public readonly bucketName: string;
  public readonly bucketArn: string;

  constructor(scope: Construct, id: string, props: S3BucketModuleProps) {
    super(scope, id);

    const bucket = new S3Bucket(this, 'bucket', {
      bucket: props.bucketName,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: props.kmsKeyId,
          },
        },
      },
      tags: props.tags,
    });

    new S3BucketVersioningA(this, 'versioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    if (props.loggingBucket) {
      new S3BucketLoggingA(this, 'logging', {
        bucket: bucket.id,
        targetBucket: props.loggingBucket,
        targetPrefix: props.loggingPrefix || '',
      });
    }

    const policyStatements = [];

    // Add access role policy statement if provided
    if (props.accessRoleArn) {
      policyStatements.push({
        Effect: 'Allow',
        Principal: {
          AWS: props.accessRoleArn,
        },
        Action: ['s3:GetObject', 's3:ListBucket'],
        Resource: [bucket.arn, `${bucket.arn}/*`],
      });
    }

    // Add CloudTrail policy statement if enabled
    if (props.allowCloudTrailAccess) {
      const prefix = props.cloudTrailPrefix || '';

      // Allow CloudTrail to check the bucket ACL
      policyStatements.push({
        Effect: 'Allow',
        Principal: {
          Service: 'cloudtrail.amazonaws.com',
        },
        Action: 's3:GetBucketAcl',
        Resource: bucket.arn,
      });

      // Allow CloudTrail to put objects in the bucket
      policyStatements.push({
        Effect: 'Allow',
        Principal: {
          Service: 'cloudtrail.amazonaws.com',
        },
        Action: 's3:PutObject',
        Resource: `${bucket.arn}/${prefix}*`,
        Condition: {
          StringEquals: {
            's3:x-amz-acl': 'bucket-owner-full-control',
          },
        },
      });

      // REMOVED: KMS permissions from S3 bucket policy
      // These should be in the KMS key policy instead
    }

    // Apply bucket policy if there are any statements
    if (policyStatements.length > 0) {
      new S3BucketPolicy(this, 'policy', {
        bucket: bucket.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: policyStatements,
        }),
      });
    }

    this.bucketName = bucket.id;
    this.bucketArn = bucket.arn;
  }
}

// CloudTrail Module
export interface CloudTrailModuleProps {
  trailName: string;
  s3BucketName: string;
  s3KeyPrefix?: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

export class CloudTrailModule extends Construct {
  public readonly trailArn: string;

  constructor(scope: Construct, id: string, props: CloudTrailModuleProps) {
    super(scope, id);

    const trail = new cloudtrail.Cloudtrail(this, 'trail', {
      name: props.trailName,
      s3BucketName: props.s3BucketName,
      s3KeyPrefix: props.s3KeyPrefix,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: false,
      enableLogFileValidation: true,
      kmsKeyId: props.kmsKeyId,
      tags: props.tags,
    });

    this.trailArn = trail.arn;
  }
}

// AWS Config Module
export interface AwsConfigModuleProps {
  s3BucketName: string;
  s3KeyPrefix?: string;
  kmsKeyId: string;
  tags?: { [key: string]: string };
}

// export class AwsConfigModule extends Construct {
//   public readonly recorderName: string;

//   constructor(scope: Construct, id: string, props: AwsConfigModuleProps) {
//     super(scope, id);

//     // Create role for AWS Config
//     const configRole = new IamRole(this, "config-role", {
//       name: `${id}-config-role`,
//       assumeRolePolicy: JSON.stringify({
//         Version: "2012-10-17",
//         Statement: [
//           {
//             Action: "sts:AssumeRole",
//             Principal: {
//               Service: "config.amazonaws.com"
//             },
//             Effect: "Allow"
//           }
//         ]
//       }),
//       managedPolicyArns: [
//         "arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"
//       ],
//       tags: props.tags
//     });

//     // AWS Config Recorder
//     const recorder = new AwsConfigConfigurationRecorder(this, "recorder", {
//       name: `${id}-config-recorder`,
//       roleArn: configRole.arn,
//       recordingGroup: {
//         allSupported: true,
//         includeGlobalResources: true
//       }
//     });

//     // AWS Config Delivery Channel
//     new AwsConfigDeliveryChannel(this, "delivery-channel", {
//       name: `${id}-config-delivery-channel`,
//       s3BucketName: props.s3BucketName,
//       s3KeyPrefix: props.s3KeyPrefix,
//       snsTopicArn: "", // Optional SNS topic
//       snapshotDeliveryProperties: {
//         deliveryFrequency: "Six_Hours"
//       }
//     });

//     // Add some basic AWS Config Rules
//     new AwsConfigConfigRule(this, "encrypted-volumes", {
//       name: "encrypted-volumes",
//       source: {
//         owner: "AWS",
//         sourceIdentifier: "ENCRYPTED_VOLUMES"
//       },
//       depends_on: [recorder.id]
//     });

//     new AwsConfigConfigRule(this, "s3-bucket-public-read-prohibited", {
//       name: "s3-bucket-public-read-prohibited",
//       source: {
//         owner: "AWS",
//         sourceIdentifier: "S3_BUCKET_PUBLIC_READ_PROHIBITED"
//       },
//       depends_on: [recorder.id]
//     });

//     new AwsConfigConfigRule(this, "s3-bucket-public-write-prohibited", {
//       name: "s3-bucket-public-write-prohibited",
//       source: {
//         owner: "AWS",
//         sourceIdentifier: "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
//       },
//       depends_on: [recorder.id]
//     });

//     this.recorderName = recorder.name;
//   }
// }

// Security Groups Module
export interface SecurityGroupsModuleProps {
  vpcId: string;
  allowedHttpCidrs: string[];
  allowedSshCidrs: string[];
  tags?: { [key: string]: string };
}

export class SecurityGroupsModule extends Construct {
  public readonly webSgId: string;

  constructor(scope: Construct, id: string, props: SecurityGroupsModuleProps) {
    super(scope, id);

    const webSg = new SecurityGroup(this, 'web-sg', {
      name: `${id}-web-sg`,
      description: 'Security group for web servers',
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: props.allowedHttpCidrs,
          description: 'HTTP Access',
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: props.allowedSshCidrs,
          description: 'SSH Access',
        },
      ],
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
          description: 'Allow all outbound traffic',
        },
      ],
      tags: { ...props.tags, Name: `${id}-web-sg` },
    });

    this.webSgId = webSg.id;
  }
}
```


## tap-stack.ts
```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import {
  KmsModule,
  VpcModule,
  IamRoleModule,
  S3BucketModule,
  CloudTrailModule,
  // AwsConfigModule,
  SecurityGroupsModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    const tags = {
      Environment: 'SecureApp',
      CreatedBy: 'CDKTF',
      Project: 'TAP',
    };

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // ? Add your stack instantiations here
    // 1. Create KMS Keys
    const kms = new KmsModule(this, 'kms', {
      keyName: 'tap-encryption-key',
      description: 'KMS key for TAP secure environment',
      enableKeyRotation: true,
      tags,
    });

    // 2. Create VPC with subnets
    const vpc = new VpcModule(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.3.0/24', '10.0.4.0/24'],
      availabilityZones: ['us-east-2a', 'us-east-2b'],
      tags,
    });

    // 3. Create IAM Roles
    const s3AccessRole = new IamRoleModule(this, 's3-access-role', {
      roleName: 'tap-s3-access-role',
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      },
      inlinePolicies: {
        's3-access': {
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Resource: [
                'arn:aws:s3:::tap-secure-bucket',
                'arn:aws:s3:::tap-secure-bucket/*',
              ],
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
              Resource: kms.keyArn,
            },
          ],
        },
      },
      tags,
    });

    // 4. Create S3 buckets - one for logs and one for application
    // Log bucket first, needed for other services
    const logBucket = new S3BucketModule(this, 'log-bucket', {
      bucketName: 'tap-logs-bucket',
      allowCloudTrailAccess: true,
      kmsKeyId: kms.keyId,
      cloudTrailPrefix: 'cloudtrail-logs/',
      tags,
    });

    // Secure bucket for application data
    const secureBucket = new S3BucketModule(this, 'secure-bucket', {
      bucketName: 'tap-secure-bucket',
      kmsKeyId: kms.keyId,
      accessRoleArn: s3AccessRole.roleArn,
      loggingBucket: logBucket.bucketName,
      loggingPrefix: 'secure-bucket-logs/',
      tags,
    });

    // 5. Set up CloudTrail
    const cloudTrail = new CloudTrailModule(this, 'cloudtrail', {
      trailName: 'tap-cloudtrail',
      s3BucketName: logBucket.bucketName,
      s3KeyPrefix: 'cloudtrail-logs/',
      kmsKeyId: kms.keyArn,
      tags,
    });

    // 6. Set up AWS Config
    // const awsConfig = new AwsConfigModule(this, "config", {
    //   s3BucketName: logBucket.bucketName,
    //   s3KeyPrefix: "config-logs",
    //   kmsKeyId: kms.keyId,
    //   tags
    // });

    // 7. Create Security Groups
    const securityGroups = new SecurityGroupsModule(this, 'security-groups', {
      vpcId: vpc.vpcId,
      allowedHttpCidrs: ['10.0.0.0/8'], // Example restricted CIDR
      allowedSshCidrs: ['10.0.0.0/8'], // Example restricted CIDR
      tags,
    });

    // Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpcId,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public_subnet_ids', {
      value: vpc.publicSubnetIds,
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private_subnet_ids', {
      value: vpc.privateSubnetIds,
      description: 'Private Subnet IDs',
    });

    new TerraformOutput(this, 'kms_key_arn', {
      value: kms.keyArn,
      description: 'KMS Key ARN',
    });

    new TerraformOutput(this, 'secure_bucket_name', {
      value: secureBucket.bucketName,
      description: 'Secure S3 Bucket Name',
    });

    new TerraformOutput(this, 'log_bucket_name', {
      value: logBucket.bucketName,
      description: 'Log S3 Bucket Name',
    });

    new TerraformOutput(this, 's3_access_role_arn', {
      value: s3AccessRole.roleArn,
      description: 'IAM Role ARN for S3 Access',
    });

    new TerraformOutput(this, 'cloudtrail_arn', {
      value: cloudTrail.trailArn,
      description: 'CloudTrail ARN',
    });

    // new TerraformOutput(this, "config_recorder_name", {
    //   value: awsConfig.recorderName,
    //   description: "AWS Config Recorder Name"
    // });

    new TerraformOutput(this, 'web_security_group_id', {
      value: securityGroups.webSgId,
      description: 'Web Security Group ID',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```