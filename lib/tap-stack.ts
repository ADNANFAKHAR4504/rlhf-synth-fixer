import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import {
  AwsProvider,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  SecurityGroup,
  Instance,
  S3Bucket,
  S3BucketServerSideEncryptionConfiguration,
  IamRole,
  IamPolicy,
  IamRolePolicyAttachment,
  NetworkAcl,
  NetworkAclRule,
  NetworkAclAssociation,
} from '@cdktf/provider-aws';

interface TapStackProps {
  region?: string;
  amiId: string;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string, props: TapStackProps) {
    super(scope, name);

    const region = props.region ?? 'us-east-1';

    new AwsProvider(this, 'aws', {
      region,
    });

    const tags = { Environment: 'Production' };

    const vpc = new Vpc(this, 'SecureVpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsSupport: true,
      enableDnsHostnames: true,
      tags: { ...tags, Name: 'secure-network' },
    });

    const subnet = new Subnet(this, 'PublicSubnet', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: region + 'a',
      mapPublicIpOnLaunch: true,
      tags,
    });

    const igw = new InternetGateway(this, 'Igw', {
      vpcId: vpc.id,
      tags,
    });

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

    const nacl = new NetworkAcl(this, 'PublicNacl', {
      vpcId: vpc.id,
      subnetIds: [subnet.id],
      tags,
    });

    new NetworkAclRule(this, 'InboundHttp', {
      networkAclId: nacl.id,
      ruleNumber: 100,
      protocol: '6',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 80,
      toPort: 80,
    });

    new NetworkAclRule(this, 'InboundHttps', {
      networkAclId: nacl.id,
      ruleNumber: 101,
      protocol: '6',
      ruleAction: 'allow',
      egress: false,
      cidrBlock: '0.0.0.0/0',
      fromPort: 443,
      toPort: 443,
    });

    new NetworkAclRule(this, 'OutboundAll', {
      networkAclId: nacl.id,
      ruleNumber: 100,
      protocol: '-1',
      ruleAction: 'allow',
      egress: true,
      cidrBlock: '0.0.0.0/0',
    });

    new NetworkAclAssociation(this, 'NaclAssoc', {
      networkAclId: nacl.id,
      subnetId: subnet.id,
    });

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

    const ec2Policy = new IamPolicy(this, 'EC2S3LogPolicy', {
      name: 'ec2-s3-log-policy',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: ['s3:PutObject'],
          Resource: [`\${logBucket.arn}/*`],
        }],
      }),
      tags,
    });

    new IamRolePolicyAttachment(this, 'AttachS3Policy', {
      role: ec2Role.name,
      policyArn: ec2Policy.arn,
    });

    new Instance(this, 'WebInstance', {
      ami: props.amiId,
      instanceType: 't3.micro',
      subnetId: subnet.id,
      vpcSecurityGroupIds: [sg.id],
      associatePublicIpAddress: true,
      iamInstanceProfile: ec2Role.name,
      tags,
    });
  }
}