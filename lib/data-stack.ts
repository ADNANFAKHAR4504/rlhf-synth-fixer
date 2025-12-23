import * as cdk from 'aws-cdk-lib';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

interface DataStackProps extends cdk.NestedStackProps {
  environmentSuffix: string;
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  cloudTrailBucket: s3.Bucket;
}

export class DataStack extends cdk.NestedStack {
  public readonly database: rds.DatabaseInstance;
  public readonly applicationBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: DataStackProps) {
    super(scope, id, props);

    // RDS subnet group
    const subnetGroup = new rds.SubnetGroup(
      this,
      `${props.environmentSuffix}-subnet-group`,
      {
        subnetGroupName: `${props.environmentSuffix}-subnet-group`,
        description: 'Subnet group for RDS database',
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    // RDS instance with encryption
    this.database = new rds.DatabaseInstance(
      this,
      `${props.environmentSuffix}-database`,
      {
        instanceIdentifier: `${props.environmentSuffix}-database`,
        engine: rds.DatabaseInstanceEngine.mysql({
          version: rds.MysqlEngineVersion.VER_8_0,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MICRO
        ),
        vpc: props.vpc,
        subnetGroup: subnetGroup,
        storageEncrypted: true,
        storageEncryptionKey: props.kmsKey,
        multiAz: false,
        backupRetention: cdk.Duration.days(7),
        deletionProtection: false,
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // Application S3 bucket with security policies
    this.applicationBucket = new s3.Bucket(
      this,
      `${props.environmentSuffix}-app-bucket`,
      {
        bucketName: `${props.environmentSuffix}-app-bucket-${this.account}`,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: props.kmsKey,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        versioned: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            id: 'IntelligentTiering',
            enabled: true,
            transitions: [
              {
                storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                transitionAfter: cdk.Duration.days(1),
              },
            ],
          },
        ],
      }
    );

    // Bucket policy to prevent public PUT operations
    this.applicationBucket.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'DenyPublicPutObject',
        effect: iam.Effect.DENY,
        principals: [new iam.AnyPrincipal()],
        actions: ['s3:PutObject', 's3:PutObjectAcl', 's3:DeleteObject'],
        resources: [this.applicationBucket.arnForObjects('*')],
        conditions: {
          StringNotEquals: {
            'aws:PrincipalServiceName': [
              'ec2.amazonaws.com',
              'lambda.amazonaws.com',
            ],
          },
        },
      })
    );
  }
}
