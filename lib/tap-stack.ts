import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { DataAwsSubnets } from '@cdktf/provider-aws/lib/data-aws-subnets'; // Changed from DataAwsSubnet
import { DataAwsVpc } from '@cdktf/provider-aws/lib/data-aws-vpc';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  KmsModule,
  SecurityGroupModule,
  S3Module,
  RdsModule,
  Ec2Module,
  AlbModule,
  CloudTrailModule,
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
    // Lookup existing VPC (replace with your actual VPC ID)
    const vpc = new DataAwsVpc(this, 'secure-app-vpc', {
      id: 'vpc-048096a18345d83ac', // Replace with your actual VPC ID
    });

    // Lookup subnets in the VPC - Changed to DataAwsSubnets for multiple subnets
    const privateSubnets = new DataAwsSubnets(this, 'private-subnets', {
      filter: [
        {
          name: 'vpc-id',
          values: [vpc.id],
        },
        {
          name: 'tag:Type',
          values: ['Private'],
        },
      ],
    });

    const publicSubnets = new DataAwsSubnets(this, 'public-subnets', {
      filter: [
        {
          name: 'vpc-id',
          values: [vpc.id],
        },
        {
          name: 'tag:Type',
          values: ['Public'],
        },
      ],
    });

    // 1. Create KMS Key for encryption with automatic rotation
    const kmsModule = new KmsModule(this, 'app-kms-module', {
      name: 'app-kms-key',
      description: 'KMS key for application encryption with automatic rotation',
      enableKeyRotation: true,
    });

    // 2. Create S3 bucket for CloudTrail logs
    const cloudTrailS3Module = new S3Module(this, 'cloudtrail-s3-module', {
      bucketName: 'secure-app-cloudtrail-logs-${random_id.bucket_suffix.hex}',
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // 3. Create S3 bucket for application data
    const appS3Module = new S3Module(this, 'app-s3-module', {
      bucketName: 'secure-app-data-${random_id.bucket_suffix.hex}',
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // 4. Create Security Group for ALB (allows HTTP/HTTPS from internet)
    const albSecurityGroupModule = new SecurityGroupModule(
      this,
      'alb-sg-module',
      {
        name: 'public-frontend-sg',
        description: 'Security group for Application Load Balancer',
        vpcId: vpc.id,
        ingressRules: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
        ],
        egressRules: [
          {
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      }
    );

    // 5. Create Security Group for EC2 instances (allows traffic only from ALB)
    const ec2SecurityGroupModule = new SecurityGroupModule(
      this,
      'ec2-sg-module',
      {
        name: 'private-app-sg',
        description: 'Security group for EC2 application instances',
        vpcId: vpc.id,
        ingressRules: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            sourceSecurityGroupId: albSecurityGroupModule.securityGroup.id,
            description: 'Allow HTTP from ALB only',
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/8'], // Restrict SSH to private network only
            description: 'Allow SSH from private network only',
          },
        ],
        egressRules: [
          {
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      }
    );

    // 6. Create Security Group for RDS (allows traffic only from EC2)
    const rdsSecurityGroupModule = new SecurityGroupModule(
      this,
      'rds-sg-module',
      {
        name: 'private-db-sg',
        description: 'Security group for RDS database',
        vpcId: vpc.id,
        ingressRules: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            sourceSecurityGroupId: ec2SecurityGroupModule.securityGroup.id,
            description: 'Allow MySQL from application instances only',
          },
        ],
        egressRules: [],
      }
    );

    // Configuration parameters
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    // 7. Create RDS instance in private subnet
    const rdsModule = new RdsModule(
      this,
      'rds-module',
      {
        identifier: 'secure-app-db',
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.micro',
        allocatedStorage: 20,
        dbName: 'secureappdb',
        username: 'admin',
        password: dbPasswordSecret.secretString, // In production, use AWS Secrets Manager
        vpcSecurityGroupIds: [rdsSecurityGroupModule.securityGroup.id],
        dbSubnetGroupName: 'secure-app-db-subnet-group',
        kmsKeyId: kmsModule.kmsKey.arn,
        backupRetentionPeriod: 7,
        storageEncrypted: true,
      },
      privateSubnets.ids
    );

    // 8. Create EC2 instances in private subnets (no public IP)
    const ec2Modules = privateSubnets.ids
      .slice(0, 2)
      .map((subnetId: string, index: number) => {
        return new Ec2Module(this, `ec2-module-${index}`, {
          name: `secure-app-instance-${index + 1}`,
          instanceType: 't3.micro',
          subnetId: subnetId,
          securityGroupIds: [ec2SecurityGroupModule.securityGroup.id],
          userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure App Instance ${index + 1}</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health`,
          keyName: 'my-key-pair', // Replace with your actual key pair name
        });
      });

    // 9. Create Application Load Balancer
    const albModule = new AlbModule(this, 'alb-module', {
      name: 'secure-app-alb',
      subnets: publicSubnets.ids,
      securityGroups: [albSecurityGroupModule.securityGroup.id],
      targetGroupName: 'secure-app-tg',
      targetGroupPort: 80,
      vpcId: vpc.id,
    });

    // 10. Attach EC2 instances to ALB target group
    ec2Modules.forEach((ec2Module: any) => {
      albModule.attachTarget(ec2Module.instance.id, 80);
    });

    // 11. Create CloudTrail for audit logging
    const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail-module', {
      name: 'secure-app-cloudtrail',
      s3BucketName: cloudTrailS3Module.bucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
    });

    // Terraform Outputs
    new TerraformOutput(this, 'vpc-id', {
      description: 'ID of the VPC',
      value: vpc.id,
    });

    new TerraformOutput(this, 'kms-key-id', {
      description: 'ID of the KMS key',
      value: kmsModule.kmsKey.keyId,
    });

    new TerraformOutput(this, 'kms-key-arn', {
      description: 'ARN of the KMS key',
      value: kmsModule.kmsKey.arn,
    });

    new TerraformOutput(this, 'app-s3-bucket-name', {
      description: 'Name of the application S3 bucket',
      value: appS3Module.bucket.bucket,
    });

    new TerraformOutput(this, 'cloudtrail-s3-bucket-name', {
      description: 'Name of the CloudTrail S3 bucket',
      value: cloudTrailS3Module.bucket.bucket,
    });

    new TerraformOutput(this, 'rds-endpoint', {
      description: 'RDS instance endpoint',
      value: rdsModule.dbInstance.endpoint,
      sensitive: true,
    });

    new TerraformOutput(this, 'alb-dns-name', {
      description: 'DNS name of the Application Load Balancer',
      value: albModule.alb.dnsName,
    });

    new TerraformOutput(this, 'alb-zone-id', {
      description: 'Zone ID of the Application Load Balancer',
      value: albModule.alb.zoneId,
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      description: 'IDs of the EC2 instances',
      value: ec2Modules.map((module: any) => module.instance.id),
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      description: 'IDs of the private subnets',
      value: privateSubnets.ids,
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      description: 'IDs of the public subnets',
      value: publicSubnets.ids,
    });

    new TerraformOutput(this, 'security-group-ids', {
      description: 'Security group IDs',
      value: {
        alb: albSecurityGroupModule.securityGroup.id,
        ec2: ec2SecurityGroupModule.securityGroup.id,
        rds: rdsSecurityGroupModule.securityGroup.id,
      },
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      description: 'ARN of the CloudTrail',
      value: cloudTrailModule.cloudTrail.arn,
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
