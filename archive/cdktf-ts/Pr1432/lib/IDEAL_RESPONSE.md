# CDKTF TypeScript Infrastructure Solution

## lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { S3Backend, TerraformStack, TerraformOutput, Fn } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
// FIXED: Corrected the import paths for S3 resources. The '-a' suffix was incorrect.
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // --- Configuration ---
    const region = 'us-east-1';
    const tags = {
      Environment: 'Production',
      Application: 'WebApp',
      Owner: 'DevOps Team',
    };
    // Generate a unique suffix for this deployment to avoid name collisions
    // FIXED: Replaced the incorrect 'randomId' with 'Fn.uuid()' and truncated it.
    const uniqueSuffix = Fn.substr(Fn.uuid(), 0, 8);

    // --- Provider & State ---
    this.configureAwsProvider(region);
    // NOTE: Using local state as per your request.
    // this.configureRemoteState();

    // --- Resource Creation ---
    const vpc = this.createVpc(tags);
    const subnetA = this.createSubnet(
      vpc.id,
      '10.0.1.0/24',
      'us-east-1a',
      tags,
      'subnet-a'
    );
    this.createSubnet(vpc.id, '10.0.2.0/24', 'us-east-1b', tags, 'subnet-b');

    const bucket = this.createSecureS3Bucket(tags, uniqueSuffix);
    const securityGroup = this.createWebAppSecurityGroup(vpc.id, tags);
    const instance = this.createEc2Instance(
      subnetA.id,
      securityGroup.id,
      bucket,
      tags,
      uniqueSuffix
    );

    // --- Outputs for Integration Testing ---
    new TerraformOutput(this, 'WebAppInstancePublicIp', {
      value: instance.publicIp,
    });
    new TerraformOutput(this, 'VpcId', {
      value: vpc.id,
      description: 'The ID of the main VPC.',
    });
    new TerraformOutput(this, 'S3BucketName', {
      value: bucket.bucket,
      description: 'The name of the S3 bucket.',
    });
    new TerraformOutput(this, 'InstanceId', {
      value: instance.id,
      description: 'The ID of the EC2 instance.',
    });
  }

  private configureAwsProvider(region: string): void {
    new AwsProvider(this, 'aws', {
      region: region,
    });
  }

  private configureRemoteState(): void {
    new S3Backend(this, {
      bucket: 'your-terraform-state-bucket-name',
      key: 'tap-production/terraform.tfstate',
      region: 'us-east-1',
      dynamodbTable: 'your-terraform-lock-table-name',
      encrypt: true,
    });
  }

  private createVpc(tags: { [key: string]: string }): Vpc {
    return new Vpc(this, 'WebAppVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: 'WebApp-VPC' },
    });
  }

  private createSubnet(
    vpcId: string,
    cidrBlock: string,
    az: string,
    tags: { [key: string]: string },
    logicalId: string
  ): Subnet {
    return new Subnet(this, `WebAppSubnet-${logicalId}`, {
      vpcId,
      cidrBlock,
      availabilityZone: az,
      mapPublicIpOnLaunch: true,
      tags: { ...tags, Name: `WebApp-Subnet-${az}` },
    });
  }

  private createSecureS3Bucket(
    tags: { [key: string]: string },
    uniqueSuffix: string
  ): S3Bucket {
    const bucket = new S3Bucket(this, 'WebAppBucket', {
      // FIXED: Added a random suffix to the bucket name to ensure uniqueness.
      bucket: `webapp-data-bucket-${uniqueSuffix}`,
      tags: { ...tags, Name: 'WebApp-Data-Bucket' },
    });

    new S3BucketVersioningA(this, 'WebAppBucketVersioning', {
      bucket: bucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'WebAppBucketEncryption',
      {
        bucket: bucket.id,
        rule: [
          { applyServerSideEncryptionByDefault: { sseAlgorithm: 'AES256' } },
        ],
      }
    );

    new S3BucketPublicAccessBlock(this, 'WebAppBucketPublicAccessBlock', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    return bucket;
  }

  private createWebAppSecurityGroup(
    vpcId: string,
    tags: { [key: string]: string }
  ): SecurityGroup {
    return new SecurityGroup(this, 'WebAppSecurityGroup', {
      name: 'webapp-sg',
      description: 'Allow HTTP and SSH from a specific CIDR',
      vpcId,
      ingress: [
        {
          description: 'Allow SSH from trusted network',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['203.0.113.0/24'],
        },
        {
          description: 'Allow HTTP from trusted network',
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['203.0.113.0/24'],
        },
      ],
      egress: [
        { fromPort: 0, toPort: 0, protocol: '-1', cidrBlocks: ['0.0.0.0/0'] },
      ],
      tags: { ...tags, Name: 'WebApp-SG' },
    });
  }

  private createIamRoleForEc2(bucket: S3Bucket, uniqueSuffix: string): IamRole {
    const role = new IamRole(this, 'Ec2S3AccessRole', {
      // FIXED: Added a random suffix to the role name to ensure uniqueness.
      name: `ec2-s3-access-role-${uniqueSuffix}`,
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
    });

    const policy = new IamPolicy(this, 'Ec2S3AccessPolicy', {
      name: `ec2-s3-access-policy-${uniqueSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Effect: 'Allow',
            Resource: `${bucket.arn}/*`,
          },
          { Action: 's3:ListBucket', Effect: 'Allow', Resource: bucket.arn },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'Ec2S3PolicyAttachment', {
      role: role.name,
      policyArn: policy.arn,
    });

    return role;
  }

  private createEc2Instance(
    subnetId: string,
    securityGroupId: string,
    bucket: S3Bucket,
    tags: { [key: string]: string },
    uniqueSuffix: string
  ): Instance {
    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

    const role = this.createIamRoleForEc2(bucket, uniqueSuffix);
    const instanceProfile = new IamInstanceProfile(this, 'Ec2InstanceProfile', {
      // FIXED: Added a random suffix to the instance profile name.
      name: `ec2-instance-profile-${uniqueSuffix}`,
      role: role.name,
    });

    return new Instance(this, 'WebAppInstance', {
      ami: ami.id,
      instanceType: 't2.micro',
      subnetId,
      vpcSecurityGroupIds: [securityGroupId],
      iamInstanceProfile: instanceProfile.name,
      tags: { ...tags, Name: 'WebApp-Instance' },
    });
  }
}
```
