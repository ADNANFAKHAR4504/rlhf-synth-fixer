// lib/tap-stack.ts
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import all modules
import {
  VpcModule,
  SecurityGroupsModule,
  IamModule,
  AutoScalingModule,
  AlbModule,
  RdsModule,
  S3Module,
  CloudWatchDashboardModule,
} from './modules';

// Import Secrets Manager for RDS password
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// Override AWS Region to us-west-2 to match availability zones in modules
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

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Enable state locking
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Common tags for all resources
    const commonTags = {
      Environment: environmentSuffix,
      ManagedBy: 'Terraform',
      Project: id,
      CreatedAt: new Date().toISOString(),
    };

    // === Module Instantiations ===

    // 1. VPC Module - Foundation networking layer
    const vpcModule = new VpcModule(this, `${id}-vpc`, commonTags);

    // 2. Security Groups Module - Network access controls
    const securityGroupsModule = new SecurityGroupsModule(
      this,
      `${id}-security-groups`,
      vpcModule.vpc.id,
      commonTags
    );

    // 3. Create RDS credentials secret with auto-generated password
    const rdsSecret = new SecretsmanagerSecret(this, 'rds-secret', {
      name: `${id}-rds-mysql-credentials-${environmentSuffix}`,
      description: 'RDS MySQL master credentials',
      recoveryWindowInDays: 0, // Set to 0 for immediate deletion in dev/test
      tags: commonTags,
    });

    // Generate initial secret with random password
    const rdsSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'rds-secret-version',
      {
        secretId: rdsSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: this.generateRandomPassword(32),
        }),
      }
    );

    // 4. IAM Module - Roles and policies for EC2 instances
    const iamModule = new IamModule(
      this,
      `${id}-iam`,
      rdsSecret.arn,
      commonTags
    );

    // 5. S3 Module - Bucket for ALB logs
    const s3Module = new S3Module(this, `${id}-s3`, {
      transitionDays: 30,
      expirationDays: 365,
      tags: commonTags,
    });

    // 6. RDS Module - MySQL database with Secrets Manager
    const rdsModule = new RdsModule(this, `${id}-rds`, {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupsModule.rdsSg.id,
      secretArn: rdsSecret.arn,
      dependsOn: [rdsSecretVersion], // Ensure secret is created first
      instanceClass: 'db.t3.micro', // Use larger instance in production
      allocatedStorage: 20,
      tags: commonTags,
    });

    // 7. ALB Module - Application Load Balancer
    const albModule = new AlbModule(this, `${id}-alb`, {
      subnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupsModule.albSg.id,
      vpcId: vpcModule.vpc.id,
      logBucketName: s3Module.bucket.bucket,
      logBucketPolicy: s3Module.bucketPolicy, // Add this line
      tags: commonTags,
      // certificateArn: 'arn:aws:acm:...', // Add ACM certificate ARN for HTTPS
    });

    // 8. Auto Scaling Module - EC2 Auto Scaling Group
    const autoScalingModule = new AutoScalingModule(this, `${id}-asg`, {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupsModule.ec2Sg.id,
      instanceProfileArn: iamModule.instanceProfile.arn,
      targetGroupArns: [albModule.targetGroup.arn],
      dbSecretArn: rdsSecret.arn,
      awsRegion: awsRegion, // Add this line
      instanceType: 't3.micro',
      minSize: 1,
      maxSize: 4,
      desiredCapacity: 1,
      tags: commonTags,
    });
    // 9. CloudWatch Dashboard Module - Monitoring dashboard
    const cloudWatchModule = new CloudWatchDashboardModule(
      this,
      `${id}-monitoring`,
      {
        asgName: autoScalingModule.asg.name,
        albArn: albModule.alb.arn,
        dbInstanceId: rdsModule.dbInstance.identifier,
        tags: commonTags,
      }
    );

    // === Terraform Outputs (10 outputs as requested) ===

    // 1. VPC ID
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID for the application infrastructure',
    });

    // 2. ALB DNS Name
    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description:
        'Application Load Balancer DNS name for accessing the application',
    });

    // 3. RDS Endpoint
    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS MySQL database endpoint',
      sensitive: true, // Mark as sensitive
    });

    // 4. Auto Scaling Group Name
    new TerraformOutput(this, 'asg-name', {
      value: autoScalingModule.asg.name,
      description: 'Auto Scaling Group name for EC2 instances',
    });

    // 5. S3 Bucket Name
    new TerraformOutput(this, 's3-logs-bucket', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for ALB access logs',
    });

    // 6. CloudWatch Dashboard URL
    new TerraformOutput(this, 'dashboard-url', {
      value: `https://${awsRegion}.console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${cloudWatchModule.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL for monitoring',
    });

    // 7. Private Subnet IDs
    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id).join(','),
      description: 'Private subnet IDs for application and database tiers',
    });

    // 8. Security Group IDs
    new TerraformOutput(this, 'security-group-ids', {
      value: {
        alb: securityGroupsModule.albSg.id,
        ec2: securityGroupsModule.ec2Sg.id,
        rds: securityGroupsModule.rdsSg.id,
      },
      description: 'Security group IDs for ALB, EC2, and RDS',
    });

    // 9. RDS Secret ARN
    new TerraformOutput(this, 'rds-secret-arn', {
      value: rdsSecret.arn,
      description:
        'ARN of the Secrets Manager secret containing RDS credentials',
    });

    // 10. Target Group ARN
    new TerraformOutput(this, 'target-group-arn', {
      value: albModule.targetGroup.arn,
      description: 'Target group ARN for ALB routing',
    });
  }

  // Helper method to generate random password
  private generateRandomPassword(length: number): string {
    // Remove invalid characters: @, /, ", and space
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%^&*()_+-=[]{}|;:,.<>?';
    let result = '';

    // Ensure password meets AWS requirements
    const hasUpperCase = /[A-Z]/;
    const hasLowerCase = /[a-z]/;
    const hasNumbers = /[0-9]/;
    const hasSpecialChar = /[!#$%^&*()_+=$${}|;:,.<>?-]/;

    // Keep generating until we have a valid password
    while (true) {
      result = '';
      for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
      }

      // Check if password meets all requirements
      if (
        hasUpperCase.test(result) &&
        hasLowerCase.test(result) &&
        hasNumbers.test(result) &&
        hasSpecialChar.test(result)
      ) {
        break;
      }
    }

    return result;
  }
}
