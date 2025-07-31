import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { AwsProvider, Vpc, Subnet, InternetGateway, RouteTable, Route, RouteTableAssociation, SecurityGroup, Instance, S3Bucket, S3BucketServerSideEncryptionConfiguration, IamRole, IamPolicy, IamRolePolicyAttachment } from '@cdktf/provider-aws';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    new AwsProvider(this, 'aws', {
      region: 'us-east-1',
    });

    const tags = { Environment: 'Production' };

    // ✅ VPC
    const vpc = new Vpc(this, 'SecureVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: 'secure-network' },
    });

    // ✅ Subnet (public)
    const subnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-east-1a',
      mapPublicIpOnLaunch: true,
      tags,
    });

    // ✅ Internet Gateway
    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
      tags,
    });

    // ✅ Route Table and association
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

    // ✅ Security Group (Allow only HTTP + HTTPS)
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

    // ✅ S3 Bucket for logs with server-side encryption
    const logBucket = new S3Bucket(this, 'LogBucket', {
      bucketPrefix: 'secure-app-logs-',
      forceDestroy: true,
      tags,
    });

    new S3BucketServerSideEncryptionConfiguration(this, 'LogBucketEncryption', {
      bucket: logBucket.bucket,
      rule: [{
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      }],
    });

    // ✅ IAM Role for EC2
    const ec2Role = new IamRole(this, 'EC2LogRole', {
      name: 'ec2-log-writer-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'ec2.amazonaws.com' },
          Action: 'sts:AssumeRole',
        }],
      }),
      tags,
    });

    // ✅ IAM Policy (least privilege) for S3 logging
    const ec2Policy = new IamPolicy(this, 'EC2S3LogPolicy', {
      name: 'ec2-s3-log-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:PutObject'],
          Resource: [`${logBucket.arn}/*`],
        }],
      }),
      tags,
    });

    new IamRolePolicyAttachment(this, 'AttachS3Policy', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    // ✅ EC2 Instance (Amazon Linux 2 for us-east-1)
    new Instance(this, 'WebInstance', {
      ami: 'ami-0453898e98046c639', // Amazon Linux 2 (July 2025)
      instanceType: 't3.micro',
      subnetId: subnet.id,
      vpcSecurityGroupIds: [sg.id],
      associatePublicIpAddress: true,
      iamInstanceProfile: ec2Role.name,
      tags,
    });
  }
}