// tapstack.ts

import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { S3Backend, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  CloudwatchModule,
  Ec2Module,
  IamModule,
  RdsModule,
  S3Module,
  VpcModule,
  AlbModule, // Added missing import
  Route53Module, // Added missing import
} from './module';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // Added Route53 configuration
  domainName?: string;
  recordName?: string;
}

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

    // ✅ Added Route53 configuration with defaults
    const domainName = props?.domainName || 'tr-example.com';
    const recordName = props?.recordName || `app-${environmentSuffix}`;

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    const vpc = new VpcModule(this, 'main-vpc', {
      name: `fullstack-app-${environmentSuffix}`,
      cidrBlock: '10.0.0.0/16',
    });

    new S3Module(this, 's3-buckets', {
      bucketName: `fullstack-app-bucket-${environmentSuffix}`,
      logBucketName: `fullstack-app-log-bucket-${environmentSuffix}`,
    });

    const iam = new IamModule(this, 'ec2-iam-role', {
      name: `ec2-role-${environmentSuffix}`,
    });

    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `alb-sg-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      description: 'Allow all inbound HTTP/S traffic',
      ingress: [
        {
          fromPort: 80,
          toPort: 80,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
        // ✅ Added HTTPS support for future SSL implementation
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
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
      tags: { Name: `alb-sg-${environmentSuffix}` },
    });

    const dbSecurityGroup = new SecurityGroup(this, 'db-sg', {
      name: `db-sg-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      description: 'Allow inbound traffic to RDS from EC2 instances',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `db-sg-${environmentSuffix}` },
    });

    const ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `ec2-sg-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      description: 'Allow inbound HTTP traffic from ALB',
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { Name: `ec2-sg-${environmentSuffix}` },
    });

    new SecurityGroupRule(this, 'ec2-ingress-rule', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ec2SecurityGroup.id,
    });

    new SecurityGroupRule(this, 'db-ingress-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: ec2SecurityGroup.id,
      securityGroupId: dbSecurityGroup.id,
    });

    const ami = new DataAwsAmi(this, 'ubuntu-ami', {
      mostRecent: true,
      owners: ['099720109477'],
      filter: [
        {
          name: 'name',
          values: ['ubuntu/images/hvm-ssd/ubuntu-focal-20.04-amd64-server-*'],
        },
      ],
    });

    const ec2 = new Ec2Module(this, 'ec2-instance', {
      name: `web-server-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      subnetId: vpc.privateSubnetIdsOutput[0],
      instanceType: 't3.micro',
      ami: ami.id,
      keyName: 'compute-secure-key',
      instanceProfileName: iam.instanceProfileName,
      ec2SecurityGroupId: ec2SecurityGroup.id,
    });

    // Configuration parameters
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    const rds = new RdsModule(this, 'db-instance', {
      name: `mysql-db-${environmentSuffix}`,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      username: 'admin',
      password: dbPasswordSecret.secretString,
      vpcId: vpc.vpcIdOutput,
      privateSubnetIds: vpc.privateSubnetIdsOutput,
      dbSecurityGroupId: dbSecurityGroup.id,
    });

    // SOLUTION 1: Add ALB Module instantiation
    const alb = new AlbModule(this, 'application-load-balancer', {
      name: `fullstack-alb-${environmentSuffix}`,
      vpcId: vpc.vpcIdOutput,
      publicSubnetIds: vpc.publicSubnetIdsOutput,
      targetGroupArn: ec2.targetGroupArnOutput, //
      albSecurityGroupId: albSecurityGroup.id,
    });

    // ✅ SOLUTION 2: Add Route53 Module instantiation
    new Route53Module(this, 'dns-record', {
      zoneName: domainName,
      recordName: recordName,
      albZoneId: alb.albZoneIdOutput, //
      albDnsName: alb.albDnsNameOutput, //
    });

    new CloudwatchModule(this, 'alarms', {
      instanceId: ec2.instanceIdOutput,
      dbInstanceId: rds.dbInstanceIdOutput,
    });
  }
}
