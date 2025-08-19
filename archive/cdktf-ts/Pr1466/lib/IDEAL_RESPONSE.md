import { App, TerraformStack, Fn } from 'cdktf';
import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning-a';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration-a';
import { S3BucketLoggingA } from '@cdktf/provider-aws/lib/s3-bucket-logging-a';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';
import { DataAwsAccountId } from '@cdktf/provider-aws/lib/data-aws-account-id';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

/\*\*

- @class MonolithicStack
- @description A single stack that provisions a security-focused infrastructure.
  \*/
  class MonolithicStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
  super(scope, id);

      // --- Provider and Basic Configuration ---
      new AwsProvider(this, 'AWS', { region: 'us--east-1' });

      const commonTags = {
        Environment: 'Production',
        Project: 'SecureWebApp',
        Owner: 'DevOps-Team',
      };

      const accountId = new DataAwsAccountId(this, 'CurrentAccount');

      // --- Centralized Logging Bucket ---
      const loggingBucket = new S3Bucket(this, 'LoggingBucket', {
        bucket: `secure-webapp-logs-${accountId.accountId}-${Fn.randomid({ byteLength: 4 })}`,
        tags: { ...commonTags, Name: 'central-logging-bucket' },
      });

      new S3BucketVersioningA(this, 'LoggingBucketVersioning', {
        bucket: loggingBucket.id,
        versioningConfiguration: { status: 'Enabled' },
      });

      new S3BucketPublicAccessBlock(this, 'LoggingBucketPab', {
        bucket: loggingBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      });


      // --- KMS Key for Encryption ---
      const dataKmsKey = new KmsKey(this, 'DataKmsKey', {
        description: 'KMS key for encrypting application data',
        enableKeyRotation: true,
        tags: { ...commonTags, Name: 'app-data-kms-key' },
      });

      // --- Networking (VPC with NAT Gateway for outbound traffic) ---
      const vpc = new Vpc(this, 'Vpc', {
        cidrBlock: '10.0.0.0/16',
        enableDnsHostnames: true,
        tags: { ...commonTags, Name: 'production-webapp-vpc' },
      });

      const publicSubnet = new Subnet(this, 'PublicSubnet', {
        vpcId: vpc.id,
        cidrBlock: '10.0.1.0/24',
        mapPublicIpOnLaunch: true,
        tags: { ...commonTags, Name: 'production-webapp-public-subnet' },
      });

      const privateSubnet = new Subnet(this, 'PrivateSubnet', {
        vpcId: vpc.id,
        cidrBlock: '10.0.2.0/24',
        tags: { ...commonTags, Name: 'production-webapp-private-subnet' },
      });

      const igw = new InternetGateway(this, 'InternetGateway', {
        vpcId: vpc.id,
        tags: { ...commonTags, Name: 'production-webapp-igw' },
      });

      const eip = new Eip(this, 'NatEip', {
          domain: 'vpc',
          tags: { ...commonTags, Name: 'production-webapp-nat-eip' },
      });

      const natGateway = new NatGateway(this, 'NatGateway', {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: { ...commonTags, Name: 'production-webapp-nat-gw' },
        dependsOn: [igw],
      });

      const publicRouteTable = new RouteTable(this, 'PublicRouteTable', {
        vpcId: vpc.id,
        tags: { ...commonTags, Name: 'production-public-rt' },
      });

      new Route(this, 'PublicDefaultRoute', {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: igw.id,
      });

      new RouteTableAssociation(this, 'PublicSubnetRta', {
        subnetId: publicSubnet.id,
        routeTableId: publicRouteTable.id,
      });

      const privateRouteTable = new RouteTable(this, 'PrivateRouteTable', {
          vpcId: vpc.id,
          tags: { ...commonTags, Name: 'production-private-rt' },
      });

      new Route(this, 'PrivateDefaultRoute', {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
      });

      new RouteTableAssociation(this, 'PrivateSubnetRta', {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
      });

      // --- S3 Bucket for Application Data ---
      const dataBucket = new S3Bucket(this, 'DataBucket', {
        bucket: `secure-webapp-data-${accountId.accountId}-${Fn.randomid({ byteLength: 4 })}`,
        tags: { ...commonTags, Name: 'app-data-bucket' },
      });

      new S3BucketVersioningA(this, 'DataBucketVersioning', {
        bucket: dataBucket.id,
        versioningConfiguration: { status: 'Enabled' },
      });

      new S3BucketPublicAccessBlock(this, 'DataBucketPab', {
        bucket: dataBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      });

      new S3BucketServerSideEncryptionConfigurationA(this, 'DataBucketEncryption', {
        bucket: dataBucket.id,
        rule: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: dataKmsKey.id,
          },
          bucketKeyEnabled: true,
        }],
      });

      new S3BucketLoggingA(this, 'DataBucketLogging', {
        bucket: dataBucket.id,
        targetBucket: loggingBucket.id,
        targetPrefix: `s3/${dataBucket.bucket}/`,
      });

      // --- IAM Role with Inline Policy (Least Privilege) ---
      const ec2Role = new IamRole(this, 'Ec2AppRole', {
        name: 'production-webapp-ec2-role',
        assumeRolePolicy: new DataAwsIamPolicyDocument(this, 'Ec2AssumeRolePolicy', {
          statement: [{
            actions: ['sts:AssumeRole'],
            principals: [{ type: 'Service', identifiers: ['ec2.amazonaws.com'] }],
          }],
        }).json,
        inlinePolicy: [{
          name: 'S3AndKmsAccessPolicy',
          policy: new DataAwsIamPolicyDocument(this, 'S3KmsPolicyDoc', {
            statement: [
              {
                effect: 'Allow',
                actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
                resources: [`${dataBucket.arn}/*`],
              },
              {
                effect: 'Allow',
                actions: ['s3:ListBucket'],
                resources: [dataBucket.arn],
              },
              {
                effect: 'Allow',
                actions: ['kms:Decrypt', 'kms:GenerateDataKey*'],
                resources: [dataKmsKey.arn],
              },
            ],
          }).json,
        }],
        tags: commonTags,
      });

      const instanceProfile = new IamInstanceProfile(this, 'InstanceProfile', {
        name: 'production-webapp-instance-profile',
        role: ec2Role.name,
      });

      // --- Security Group for EC2 Instance ---
      const ec2Sg = new SecurityGroup(this, 'Ec2Sg', {
        name: 'production-webapp-ec2-sg',
        vpcId: vpc.id,
        description: 'Allow SSH from a specific IP range',
        ingress: [{
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['203.0.113.0/24'], // Placeholder for a trusted bastion/office IP
          description: 'Allow SSH from trusted network',
        }],
        egress: [{
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        }],
        tags: commonTags,
      });

      // --- EC2 Instance (in Private Subnet) ---
      new Instance(this, 'WebAppInstance', {
        ami: 'ami-0c55b159cbfafe1f0', // Amazon Linux 2 AMI for us-east-1
        instanceType: 't2.micro',
        subnetId: privateSubnet.id, // Launched in the private subnet
        vpcSecurityGroupIds: [ec2Sg.id],
        iamInstanceProfile: instanceProfile.name,
        tags: { ...commonTags, Name: 'production-webapp-server' },
      });

  }
  }

const app = new App();
new MonolithicStack(app, 'monolithic-secure-stack');
app.synth();
