import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface StorageStackArgs {
  environmentSuffix: string;
  region: string;
  isPrimary: boolean;
  tags: pulumi.Input<{ [key: string]: string }>;
  vpcId?: pulumi.Input<string>;
  privateSubnetIds?: pulumi.Input<pulumi.Input<string>[]>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly s3BucketName: pulumi.Output<string>;
  public readonly s3BucketArn: pulumi.Output<string>;
  public readonly rdsEndpoint: pulumi.Output<string>;
  public readonly rdsArn: pulumi.Output<string>;

  constructor(name: string, args: StorageStackArgs, opts?: ResourceOptions) {
    super('tap:stack:StorageStack', name, args, opts);

    const {
      environmentSuffix,
      region,
      isPrimary,
      tags,
      vpcId,
      privateSubnetIds,
    } = args;

    // KMS Key for RDS encryption
    const kmsKey = new aws.kms.Key(
      `tap-rds-key-${region}-${environmentSuffix}`,
      {
        description: `RDS encryption key for TAP ${region} ${environmentSuffix}`,
        // keyUsage and keySpec are not valid properties in Pulumi AWS - removed
        policy: aws.getCallerIdentity({}).then(caller =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${caller.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow RDS Service',
                Effect: 'Allow',
                Principal: {
                  Service: 'rds.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...tags,
          Name: `tap-rds-key-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `tap-rds-key-alias-${region}-${environmentSuffix}`,
      {
        name: `alias/tap-rds-${region}-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // S3 Bucket for static content
    const s3Bucket = new aws.s3.Bucket(
      `tap-static-content-${environmentSuffix}-${region}`,
      {
        bucket: `tap-static-content-${environmentSuffix}-${region}-${Math.random().toString(36).substr(2, 9)}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `tap-static-content-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // S3 Bucket Versioning
    new aws.s3.BucketVersioning(
      `tap-s3-versioning-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // S3 Server-Side Encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `tap-s3-encryption-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // S3 Lifecycle Configuration
    new aws.s3.BucketLifecycleConfiguration(
      `tap-s3-lifecycle-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        rules: [
          {
            id: 'transition_to_ia',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // S3 Bucket Policy - Restricted Access
    const callerIdentity = aws.getCallerIdentity({});

    new aws.s3.BucketPolicy(
      `tap-s3-policy-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        policy: pulumi
          .all([s3Bucket.arn, callerIdentity])
          .apply(([bucketArn, identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'DenyInsecureConnections',
                  Effect: 'Deny',
                  Principal: '*',
                  Action: 's3:*',
                  Resource: [bucketArn, `${bucketArn}/*`],
                  Condition: {
                    Bool: {
                      'aws:SecureTransport': 'false',
                    },
                  },
                },
                {
                  Sid: 'RestrictToSpecificRoles',
                  Effect: 'Allow',
                  Principal: {
                    AWS: `arn:aws:iam::${identity.accountId}:role/tap-instance-role-${environmentSuffix}`,
                  },
                  Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                  Resource: `${bucketArn}/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // S3 Public Access Block
    new aws.s3.BucketPublicAccessBlock(
      `tap-s3-pab-${region}-${environmentSuffix}`,
      {
        bucket: s3Bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Use VPC and subnet information if passed, otherwise try to look them up
    let vpcIdToUse: pulumi.Output<string>;
    let privateSubnetIdsToUse: pulumi.Output<string[]>;

    if (vpcId && privateSubnetIds) {
      // Use the provided VPC and subnet IDs
      vpcIdToUse = pulumi.output(vpcId);
      privateSubnetIdsToUse = pulumi.output(
        privateSubnetIds as pulumi.Input<string>[]
      );
    } else {
      // Fallback to looking up VPC and subnets (for backward compatibility)
      const vpcs = aws.ec2.getVpcs({
        filters: [
          {
            name: 'tag:Name',
            values: [`tap-vpc-${region}-${environmentSuffix}`],
          },
        ],
      });

      vpcIdToUse = pulumi.output(vpcs.then(vpcs => vpcs.ids[0]));

      const privateSubnets = vpcs.then(vpcs =>
        aws.ec2.getSubnets({
          filters: [
            { name: 'vpc-id', values: vpcs.ids },
            { name: 'tag:Type', values: ['Private'] },
          ],
        })
      );

      privateSubnetIdsToUse = pulumi.output(
        privateSubnets.then(subnets => subnets.ids)
      );
    }

    // RDS Subnet Group
    const rdsSubnetGroup = new aws.rds.SubnetGroup(
      `tap-rds-subnet-group-${region}-${environmentSuffix}`,
      {
        name: `tap-rds-subnet-group-${region}-${environmentSuffix}`,
        subnetIds: privateSubnetIdsToUse,
        tags: {
          ...tags,
          Name: `tap-rds-subnet-group-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // RDS Security Group
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-rds-sg-${region}-${environmentSuffix}-${Math.random().toString(36).substr(2, 6)}`,
      {
        name: `tap-rds-sg-${region}-${environmentSuffix}-${Math.random().toString(36).substr(2, 6)}`,
        description: 'Security group for RDS database',
        vpcId: vpcIdToUse,
        ingress: [
          {
            protocol: 'tcp',
            fromPort: 3306,
            toPort: 3306,
            cidrBlocks: ['10.0.0.0/16'],
            description: 'MySQL from VPC',
          },
        ],
        egress: [
          {
            protocol: '-1',
            fromPort: 0,
            toPort: 0,
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
        tags: {
          ...tags,
          Name: `tap-rds-sg-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // RDS Instance
    const rdsInstance = new aws.rds.Instance(
      `tap-rds-${region}-${environmentSuffix}`,
      {
        identifier: `tap-rds-${region}-${environmentSuffix}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        maxAllocatedStorage: 100,
        storageType: 'gp2',
        storageEncrypted: true,
        kmsKeyId: kmsKey.arn,
        dbName: 'tapdb',
        username: 'tapuser',
        password: 'TempPassword123!', // In production, use AWS Secrets Manager
        vpcSecurityGroupIds: [rdsSecurityGroup.id],
        dbSubnetGroupName: rdsSubnetGroup.name,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',
        backupRetentionPeriod: 7,
        multiAz: isPrimary,
        publiclyAccessible: false,
        skipFinalSnapshot: true,
        deleteAutomatedBackups: true,
        tags: {
          ...tags,
          Name: `tap-rds-${region}-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.s3BucketName = s3Bucket.bucket;
    this.s3BucketArn = s3Bucket.arn;
    this.rdsEndpoint = rdsInstance.endpoint;
    this.rdsArn = rdsInstance.arn;

    this.registerOutputs({
      s3BucketName: this.s3BucketName,
      s3BucketArn: this.s3BucketArn,
      rdsEndpoint: this.rdsEndpoint,
      rdsArn: this.rdsArn,
    });
  }
}
