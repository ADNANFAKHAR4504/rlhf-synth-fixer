import { Construct } from 'constructs';
// FIXED: Removed the unused 'App' import.
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
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

/**
 * TapStack defines the monolithic infrastructure for the WebApp in a single AWS region.
 * It follows best practices for security, state management, and resource tagging.
 *
 * @param scope The parent construct.
 * @param id The logical ID of the stack.
 */
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

    // --- Provider & Remote State Configuration ---
    this.configureAwsProvider(region);
    this.configureRemoteState();

    // --- Resource Creation ---
    const vpc = this.createVpc(tags);
    const subnetA = this.createSubnet(
      vpc.id,
      '10.0.1.0/24',
      'us-east-1a',
      tags,
      'subnet-a'
    );
    // FIXED: Removed the unused 'subnetB' variable.
    this.createSubnet(vpc.id, '10.0.2.0/24', 'us-east-1b', tags, 'subnet-b');

    const bucket = this.createSecureS3Bucket(tags);
    const securityGroup = this.createWebAppSecurityGroup(vpc.id, tags);
    this.createEc2Instance(subnetA.id, securityGroup.id, bucket, tags);
  }

  /**
   * Configures the AWS provider for the specified region.
   * @param region The AWS region to deploy resources into.
   */
  private configureAwsProvider(region: string): void {
    new AwsProvider(this, 'aws', {
      region: region,
    });
  }

  /**
   * Configures the S3 backend for remote state management.
   * This enhances collaboration and security by storing state remotely.
   * NOTE: The S3 bucket and DynamoDB table must be created beforehand.
   */
  private configureRemoteState(): void {
    new S3Backend(this, {
      bucket: 'your-terraform-state-bucket-name', // <-- IMPORTANT: Replace with your bucket name
      key: 'tap-production/terraform.tfstate',
      region: 'us-east-1',
      dynamodbTable: 'your-terraform-lock-table-name', // <-- IMPORTANT: Replace with your DynamoDB table name
      encrypt: true,
    });
  }

  /**
   * Creates the VPC for the WebApp.
   * @param tags Common tags to apply to the resource.
   */
  private createVpc(tags: { [key: string]: string }): Vpc {
    return new Vpc(this, 'WebAppVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: {
        ...tags,
        Name: 'WebApp-VPC',
      },
    });
  }

  /**
   * Creates a subnet within the VPC.
   * @param vpcId The ID of the parent VPC.
   * @param cidrBlock The CIDR block for the subnet.
   * @param az The availability zone for the subnet.
   * @param tags Common tags to apply to the resource.
   * @param logicalId A unique logical ID for the subnet construct.
   */
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
      mapPublicIpOnLaunch: true, // For public access in this example
      tags: {
        ...tags,
        Name: `WebApp-Subnet-${az}`,
      },
    });
  }

  /**
   * Creates a secure S3 bucket with versioning, encryption, and public access blocked.
   * @param tags Common tags to apply to the resource.
   */
  private createSecureS3Bucket(tags: { [key: string]: string }): S3Bucket {
    const bucket = new S3Bucket(this, 'WebAppBucket', {
      bucket: `webapp-data-bucket-${this.node.addr.substring(0, 8)}`, // Unique bucket name
      tags: {
        ...tags,
        Name: 'WebApp-Data-Bucket',
      },
    });

    // Enable versioning to protect against accidental deletions
    new S3BucketVersioningA(this, 'WebAppBucketVersioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enforce server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'WebAppBucketEncryption',
      {
        bucket: bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              // FIXED: Corrected the typo from AES2256 to AES256
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'WebAppBucketPublicAccessBlock', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    return bucket;
  }

  /**
   * Creates a security group for the EC2 instance, allowing restricted inbound access.
   * @param vpcId The ID of the VPC where the security group will be created.
   * @param tags Common tags to apply to the resource.
   */
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
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1', // Allow all outbound traffic
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: {
        ...tags,
        Name: 'WebApp-SG',
      },
    });
  }

  /**
   * Creates the IAM role and policy for the EC2 instance to access the S3 bucket.
   * @param bucket The S3 bucket the EC2 instance needs access to.
   */
  private createIamRoleForEc2(bucket: S3Bucket): IamRole {
    const role = new IamRole(this, 'Ec2S3AccessRole', {
      name: 'ec2-s3-access-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
    });

    const policy = new IamPolicy(this, 'Ec2S3AccessPolicy', {
      name: 'ec2-s3-access-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Effect: 'Allow',
            Resource: `${bucket.arn}/*`, // Object-level permissions
          },
          {
            Action: 's3:ListBucket',
            Effect: 'Allow',
            Resource: bucket.arn, // Bucket-level permission
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'Ec2S3PolicyAttachment', {
      role: role.name,
      policyArn: policy.arn,
    });

    return role;
  }

  /**
   * Creates the EC2 instance with the necessary configurations.
   * @param subnetId The ID of the subnet to launch the instance in.
   * @param securityGroupId The ID of the security group to attach.
   * @param bucket The S3 bucket the instance needs to interact with.
   * @param tags Common tags to apply to the resource.
   */
  private createEc2Instance(
    subnetId: string,
    securityGroupId: string,
    bucket: S3Bucket,
    tags: { [key: string]: string }
  ): void {
    // Use a data source to get the latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'AmazonLinuxAmi', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    const role = this.createIamRoleForEc2(bucket);
    const instanceProfile = new IamInstanceProfile(this, 'Ec2InstanceProfile', {
      name: 'ec2-instance-profile',
      role: role.name,
    });

    const instance = new Instance(this, 'WebAppInstance', {
      ami: ami.id,
      instanceType: 't2.micro',
      subnetId,
      vpcSecurityGroupIds: [securityGroupId],
      iamInstanceProfile: instanceProfile.name,
      tags: {
        ...tags,
        Name: 'WebApp-Instance',
      },
    });

    // Output the public IP of the instance
    new TerraformOutput(this, 'WebAppInstancePublicIp', {
      value: instance.publicIp,
    });
  }
}
