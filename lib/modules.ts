import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

// AWS Provider resources
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { CloudfrontDistribution } from '@cdktf/provider-aws/lib/cloudfront-distribution';
import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { IamUser } from '@cdktf/provider-aws/lib/iam-user';
import { IamPolicyAttachment } from '@cdktf/provider-aws/lib/iam-policy-attachment';

// Random password import
import { Password as RandomPassword } from '@cdktf/provider-random/lib/password';

// Secrets Manager imports
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

// -----------------
// 🔐 KMS Module
// -----------------
export class KmsModule extends Construct {
  public readonly kmsKey: KmsKey;
  constructor(
    scope: Construct,
    id: string,
    props: { project: string; env: string; provider: AwsProvider }
  ) {
    super(scope, id);
    this.kmsKey = new KmsKey(this, 'KmsKey', {
      description: `${props.project}-${props.env} KMS Key`,
      enableKeyRotation: true,
      provider: props.provider,
    });
  }
}

// -----------------
// 🌐 VPC Module
// -----------------
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly privateSubnetIds: string[];
  constructor(scope: Construct, id: string, provider: AwsProvider) {
    super(scope, id);

    this.vpc = new Vpc(this, 'Vpc', { cidrBlock: '10.0.0.0/16', provider });

    const privateSubnet1 = new Subnet(this, 'PrivateSubnet1', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-west-2a',
      provider,
    });

    const privateSubnet2 = new Subnet(this, 'PrivateSubnet2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-west-2b',
      provider,
    });

    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
  }
}

// -----------------
// 📦 S3 Module
// -----------------
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  constructor(
    scope: Construct,
    id: string,
    props: {
      project: string;
      env: string;
      kmsKeyArn: string;
      provider: AwsProvider;
    }
  ) {
    super(scope, id);

    this.bucket = new S3Bucket(this, 'SecureBucket', {
      bucket: `${props.project}-${props.env}-bucket`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: props.kmsKeyArn,
          },
        },
      },
      versioning: { enabled: true },
      provider: props.provider,
    });
  }
}

// -----------------
// 🗄️ RDS Module with Secrets Manager
// -----------------
export class RdsModule extends Construct {
  public readonly db: DbInstance;
  public readonly dbSecret: SecretsmanagerSecret;

  constructor(
    scope: Construct,
    id: string,
    props: {
      project: string;
      env: string;
      subnetIds: string[];
      kmsKeyArn: string;
      provider: AwsProvider;
    }
  ) {
    super(scope, id);

    const subnetGroup = new DbSubnetGroup(this, 'DbSubnetGroup', {
      name: `${props.project}-${props.env}-dbsubnet`,
      subnetIds: props.subnetIds,
      provider: props.provider,
    });

    const password = new RandomPassword(this, 'DbPassword', {
      length: 16,
      special: true,
    });

    this.dbSecret = new SecretsmanagerSecret(this, 'DbSecret', {
      name: `${props.project}-${props.env}-rds-secret`,
      description: `RDS credentials for ${props.project}-${props.env}`,
      kmsKeyId: props.kmsKeyArn,
      provider: props.provider,
    });

    new SecretsmanagerSecretVersion(this, 'DbSecretVersion', {
      secretId: this.dbSecret.id,
      secretString: JSON.stringify({
        username: 'admin',
        password: password.result,
      }),
      provider: props.provider,
    });

    this.db = new DbInstance(this, 'RdsInstance', {
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageEncrypted: true,
      kmsKeyId: props.kmsKeyArn,
      dbSubnetGroupName: subnetGroup.name,
      publiclyAccessible: false,
      username: 'admin',
      password: password.result,
      provider: props.provider,
    });
  }
}

// -----------------
// 💻 EC2 Module
// -----------------
export class Ec2Module extends Construct {
  public readonly instance: Instance;
  constructor(
    scope: Construct,
    id: string,
    props: {
      project: string;
      env: string;
      vpcId: string;
      subnetId: string;
      kmsKeyId: string;
      provider: AwsProvider;
    }
  ) {
    super(scope, id);

    const sg = new SecurityGroup(this, 'Ec2Sg', {
      vpcId: props.vpcId,
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
      ],
      provider: props.provider,
    });

    this.instance = new Instance(this, 'Ec2Instance', {
      ami: 'ami-04e08e36e17a21b56',
      instanceType: 't3.micro',
      subnetId: props.subnetId,
      vpcSecurityGroupIds: [sg.id],
      associatePublicIpAddress: false,
      provider: props.provider,
    });
  }
}

// -----------------
// 🌍 CloudFront Module
// -----------------
export class CloudFrontModule extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: { project: string; env: string; acmCertArn: string }
  ) {
    super(scope, id);

    new CloudfrontDistribution(this, 'Distribution', {
      enabled: true,
      defaultCacheBehavior: {
        targetOriginId: 'origin1',
        viewerProtocolPolicy: 'redirect-to-https',
        allowedMethods: ['GET', 'HEAD'],
        cachedMethods: ['GET', 'HEAD'],
        defaultTtl: 3600,
        minTtl: 0,
        maxTtl: 86400,
      },
      origin: [{ domainName: 'example.com', originId: 'origin1' }],
      viewerCertificate: {
        acmCertificateArn: props.acmCertArn,
        sslSupportMethod: 'sni-only',
      },
      restrictions: { geoRestriction: { restrictionType: 'none' } },
    });
  }
}

// -----------------
// 📜 CloudTrail Module
// -----------------
export class CloudTrailModule extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: { project: string; env: string; kmsKeyId: string }
  ) {
    super(scope, id);

    new Cloudtrail(this, 'CloudTrail', {
      name: `${props.project}-${props.env}-trail`,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      kmsKeyId: props.kmsKeyId,
      s3BucketName: `${props.project}-${props.env}-trail-bucket`,
    });
  }
}

// -----------------
// 👤 IAM Module
// -----------------
export class IamModule extends Construct {
  constructor(
    scope: Construct,
    id: string,
    props: { project: string; env: string }
  ) {
    super(scope, id);

    const user = new IamUser(this, 'IamUser', {
      name: `${props.project}-${props.env}-user`,
    });

    new IamPolicyAttachment(this, 'IamMfaPolicy', {
      name: `${props.project}-${props.env}-mfa-policy`,
      users: [user.name],
      policyArn: 'arn:aws:iam::aws:policy/IAMUserChangePassword',
    });
  }
}

// -----------------
// 🔄 Aliases for TapStack
// -----------------
export { Ec2Module as ComputeModule };
export { RdsModule as DatabaseModule };
export { VpcModule as NetworkModule };
export { S3Module as StorageModule };
