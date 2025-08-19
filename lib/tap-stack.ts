import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import {
  VpcModule,
  KmsModule,
  SecurityGroupModule,
  S3Module,
  RdsModule,
  Ec2Module,
  AlbModule,
  CloudTrailModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
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

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // 1. Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, 'vpc-module', {
      name: 'secure-app-vpc',
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`], // Hardcoded AZs based on region
    });
    // 2. Create KMS Key for encryption with automatic rotation
    const kmsModule = new KmsModule(this, 'app-kms-module', {
      name: 'app-kms-key',
      description: 'KMS key for application encryption with automatic rotation',
      enableKeyRotation: true,
      accountId: current.accountId,
    });

    // 3. Create S3 bucket for CloudTrail logs
    const cloudTrailS3Module = new S3Module(this, 'cloudtrail-s3-module', {
      bucketName: `secure-app-cloudtrail-logs-${environmentSuffix}-${current.accountId}`,
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // 4. Create S3 bucket for application data
    const appS3Module = new S3Module(this, 'app-s3-module', {
      bucketName: `secure-app-data-${environmentSuffix}-${current.accountId}`,
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // 5. Create Security Group for ALB (allows HTTP/HTTPS from internet)
    const albSecurityGroupModule = new SecurityGroupModule(
      this,
      'alb-sg-module',
      {
        name: 'public-frontend-sg',
        description: 'Security group for Application Load Balancer',
        vpcId: vpcModule.vpc.id,
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

    // 6. Create Security Group for EC2 instances (allows traffic only from ALB)
    const ec2SecurityGroupModule = new SecurityGroupModule(
      this,
      'ec2-sg-module',
      {
        name: 'private-app-sg',
        description: 'Security group for EC2 application instances',
        vpcId: vpcModule.vpc.id,
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
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow SSH from VPC only',
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

    // 7. Create Security Group for RDS (allows traffic only from EC2)
    const rdsSecurityGroupModule = new SecurityGroupModule(
      this,
      'rds-sg-module',
      {
        name: 'private-database-sg',
        description: 'Security group for RDS database',
        vpcId: vpcModule.vpc.id,
        ingressRules: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            sourceSecurityGroupId: ec2SecurityGroupModule.securityGroup.id,
            description: 'Allow MySQL from EC2 instances only',
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

    // 8. Get database credentials from AWS Secrets Manager
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    // 9. Create RDS instance in private subnets with encryption
    const rdsModule = new RdsModule(
      this,
      'rds-module',
      {
        identifier: `secure-app-db-${environmentSuffix}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.medium',
        allocatedStorage: 20,
        dbName: 'secureappdb',
        username: 'admin',
        password: dbPasswordSecret.secretString,
        vpcSecurityGroupIds: [rdsSecurityGroupModule.securityGroup.id],
        dbSubnetGroupName: `secure-app-db-subnet-group-${environmentSuffix}`,
        kmsKeyId: kmsModule.kmsKey.arn,
        backupRetentionPeriod: 7,
        storageEncrypted: true,
      },
      vpcModule.privateSubnets.map(subnet => subnet.id)
    );

    // 10. Create Application Load Balancer in public subnets
    const albModule = new AlbModule(this, 'alb-module', {
      name: `secure-app-alb-${environmentSuffix}`,
      subnets: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroupModule.securityGroup.id],
      targetGroupName: `secure-app-tg-${environmentSuffix}`,
      targetGroupPort: 80,
      vpcId: vpcModule.vpc.id,
    });

    // 11. Create EC2 instances in private subnets
    const ec2Instances: Ec2Module[] = [];
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure Application Server</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

# Create health check endpoint
echo "OK" > /var/www/html/health

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
`;

    // Create one EC2 instance in each private subnet for high availability
    vpcModule.privateSubnets.forEach((subnet, index) => {
      const ec2Module = new Ec2Module(this, `ec2-module-${index}`, {
        name: `secure-app-instance-${index + 1}`,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        securityGroupIds: [ec2SecurityGroupModule.securityGroup.id],
        userData: Buffer.from(userData).toString('base64'),
        keyName: 'turing-key', // Replace with your actual key pair name
      });

      ec2Instances.push(ec2Module);

      // Attach EC2 instances to ALB target group
      new LbTargetGroupAttachment(this, `target-attachment-${index}`, {
        targetGroupArn: albModule.targetGroup.arn,
        targetId: ec2Module.instance.id,
        port: 80,
      });
    });

    // 12. Create CloudTrail for audit logging
    const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail-module', {
      name: `secure-app-cloudtrail-${environmentSuffix}`,
      s3BucketName: cloudTrailS3Module.bucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-zone-id', {
      value: albModule.alb.zoneId,
      description: 'Application Load Balancer Zone ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS database endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.kmsKey.arn,
      description: 'KMS Key ARN',
    });

    new TerraformOutput(this, 's3-app-bucket-name', {
      value: appS3Module.bucket.bucket,
      description: 'Application S3 bucket name',
    });

    new TerraformOutput(this, 's3-cloudtrail-bucket-name', {
      value: cloudTrailS3Module.bucket.bucket,
      description: 'CloudTrail S3 bucket name',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2Instances.map(instance => instance.instance.id),
      description: 'EC2 instance IDs',
    });

    new TerraformOutput(this, 'ec2-private-ips', {
      value: ec2Instances.map(instance => instance.instance.privateIp),
      description: 'EC2 instance private IP addresses',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: cloudTrailModule.cloudTrail.arn,
      description: 'CloudTrail ARN',
    });

    new TerraformOutput(this, 'security-group-alb-id', {
      value: albSecurityGroupModule.securityGroup.id,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'security-group-ec2-id', {
      value: ec2SecurityGroupModule.securityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'security-group-rds-id', {
      value: rdsSecurityGroupModule.securityGroup.id,
      description: 'RDS Security Group ID',
    });
  }
}
