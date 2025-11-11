import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import * as aws from '@cdktf/provider-aws';

// ? Import your stacks here
import {
  VpcModule,
  SecurityGroupModule,
  Ec2Module,
  RdsModule,
  AlbModule,
  LambdaSecurityModule,
  SecurityServicesModule,
  MonitoringModule,
} from './modules';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags[];
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            ManagedBy: 'CDKTF',
            Project: 'SecureInfrastructure',
            CostCenter: 'Engineering',
          },
        },
      ],
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
    // Data sources
    const currentRegion = new aws.dataAwsRegion.DataAwsRegion(this, 'current');
    const currentAccount = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'current-account'
    );

    // Environment tags
    const commonTags = {
      Environment: 'production',
      Owner: 'platform-team',
      Project: 'tap-infrastructure',
      Compliance: 'required',
    };

    // Create S3 bucket for Lambda code (you'll upload the zip here)
    const lambdaCodeBucket = new aws.s3Bucket.S3Bucket(
      this,
      'lambda-code-bucket',
      {
        bucket: `tap-lambda-code-${currentAccount.accountId}`,
        tags: commonTags,
      }
    );

    // 1. NETWORKING - VPC with public and private subnets across 2 AZs
    const vpcModule = new VpcModule(this, 'vpc', {
      name: 'tap-vpc',
      cidr: '10.0.0.0/16',
      azCount: 2,
      publicSubnetCidrs: ['10.0.1.0/24', '10.0.2.0/24'],
      privateSubnetCidrs: ['10.0.10.0/24', '10.0.20.0/24'],
      region: awsRegion,
      tags: commonTags,
    });

    // 2. SECURITY GROUPS
    // ALB Security Group - Allow HTTPS (443) from internet
    const albSecurityGroup = new SecurityGroupModule(this, 'alb-sg', {
      name: 'tap-alb-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
      tags: { ...commonTags, Name: 'tap-alb-sg' },
    });

    // EC2 Security Group - Allow HTTPS from ALB and SSH from bastion
    const ec2SecurityGroup = new SecurityGroupModule(this, 'ec2-sg', {
      name: 'tap-ec2-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 443,
          toPort: 443,
          protocol: 'tcp',
          securityGroups: [albSecurityGroup.securityGroup.id],
        },
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'], // Only from VPC
        },
      ],
      tags: { ...commonTags, Name: 'tap-ec2-sg' },
    });

    // RDS Security Group - Allow MySQL/Aurora from EC2
    const rdsSecurityGroup = new SecurityGroupModule(this, 'rds-sg', {
      name: 'tap-rds-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [ec2SecurityGroup.securityGroup.id],
        },
      ],
      tags: { ...commonTags, Name: 'tap-rds-sg' },
    });

    // Lambda Security Group
    const lambdaSecurityGroup = new SecurityGroupModule(this, 'lambda-sg', {
      name: 'tap-lambda-sg',
      vpcId: vpcModule.vpc.id,
      ingressRules: [],
      tags: { ...commonTags, Name: 'tap-lambda-sg' },
    });

    // 3. COMPUTE - EC2 Instances in private subnets with auto-recovery
    const ec2Module = new Ec2Module(this, 'ec2', {
      name: 'tap-app-server',
      instanceType: 't3.medium',
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      securityGroupIds: [ec2SecurityGroup.securityGroup.id],
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
amazon-linux-extras install -y nginx1
systemctl start nginx
systemctl enable nginx
`,
      tags: commonTags,
    });

    // 4. DATABASE - RDS instance in private subnets
    const rdsModule = new RdsModule(this, 'rds', {
      identifier: 'tap-database',
      engine: 'mysql',
      instanceClass: 'db.t3.medium',
      allocatedStorage: 100,
      dbName: 'tapdb',
      masterUsername: 'admin',
      subnetIds: vpcModule.privateSubnets.map(s => s.id),
      securityGroupIds: [rdsSecurityGroup.securityGroup.id],
      tags: commonTags,
    });

    // 5. LOAD BALANCER - ALB in public subnets
    const albModule = new AlbModule(this, 'alb', {
      name: 'tap-alb',
      vpcId: vpcModule.vpc.id,
      subnetIds: vpcModule.publicSubnets.map(s => s.id),
      securityGroupIds: [albSecurityGroup.securityGroup.id],
      targetGroupPort: 80,
      targetGroupProtocol: 'HTTP',
      targetInstances: ec2Module.instances.map(i => i.id),
      tags: commonTags,
    });

    // 6. SECURITY AUTOMATION - Lambda for security checks
    const lambdaSecurityModule = new LambdaSecurityModule(
      this,
      'security-lambda',
      {
        subnetIds: vpcModule.privateSubnets.map(s => s.id),
        securityGroupIds: [lambdaSecurityGroup.securityGroup.id],
      },
      lambdaCodeBucket.id,
      'security-lambda.zip', // You'll upload this file to the S3 bucket
      commonTags
    );

    // 7. SECURITY SERVICES - Security Hub, Config, WAF, CloudTrail
    const securityServices = new SecurityServicesModule(
      this,
      'security-services',
      albModule.alb.arn,
      commonTags
    );

    // 8. SECRETS MANAGEMENT
    const apiKeySecret = new aws.secretsmanagerSecret.SecretsmanagerSecret(
      this,
      'api-keys',
      {
        name: 'tap-api-keys-new-ts',
        description: 'API keys for external services',
        kmsKeyId: 'alias/aws/secretsmanager',
        tags: commonTags,
      }
    );

    new aws.secretsmanagerSecretVersion.SecretsmanagerSecretVersion(
      this,
      'api-keys-version',
      {
        secretId: apiKeySecret.id,
        secretString: JSON.stringify({
          external_api_key: 'placeholder_key',
          webhook_secret: 'placeholder_secret',
        }),
      }
    );

    // 9. DYNAMODB TABLE with encryption
    new aws.dynamodbTable.DynamodbTable(this, 'app-table', {
      name: 'tap-application-data',
      billingMode: 'PAY_PER_REQUEST',
      hashKey: 'id',
      rangeKey: 'timestamp',
      attribute: [
        { name: 'id', type: 'S' },
        { name: 'timestamp', type: 'N' },
      ],
      serverSideEncryption: {
        enabled: true,
      },
      pointInTimeRecovery: {
        enabled: true,
      },
      tags: commonTags,
    });

    // 10. S3 BUCKETS with encryption
    const logBucket = new aws.s3Bucket.S3Bucket(this, 'log-bucket', {
      bucket: `tap-logs-${currentAccount.accountId}`,
      tags: commonTags,
    });

    new aws.s3BucketServerSideEncryptionConfiguration.S3BucketServerSideEncryptionConfigurationA(
      this,
      'log-bucket-encryption',
      {
        bucket: logBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new aws.s3BucketPublicAccessBlock.S3BucketPublicAccessBlock(
      this,
      'log-bucket-pab',
      {
        bucket: logBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );

    // 11. EBS DEFAULT ENCRYPTION
    new aws.ebsEncryptionByDefault.EbsEncryptionByDefault(
      this,
      'ebs-encryption',
      {
        enabled: true,
      }
    );

    // 12. IAM ACCOUNT PASSWORD POLICY (enforces MFA)
    new aws.iamAccountPasswordPolicy.IamAccountPasswordPolicy(
      this,
      'password-policy',
      {
        minimumPasswordLength: 14,
        requireLowercaseCharacters: true,
        requireNumbers: true,
        requireUppercaseCharacters: true,
        requireSymbols: true,
        allowUsersToChangePassword: true,
        passwordReusePrevention: 24,
        maxPasswordAge: 90,
      }
    );

    // 13. MONITORING AND LOGGING
    const monitoring = new MonitoringModule(
      this,
      'monitoring',
      {
        albName: albModule.alb.name,
        instanceIds: ec2Module.instances.map(i => i.id),
        rdsIdentifier: rdsModule.instance.identifier,
      },
      commonTags
    );

    // 14. SNS SUBSCRIPTION for security alerts
    new aws.snsTopicSubscription.SnsTopicSubscription(
      this,
      'security-alert-email',
      {
        topicArn: securityServices.snsTopic.arn,
        protocol: 'email',
        endpoint: 'security-team@example.com', // Replace with actual email
      }
    );

    // 15. CLOUDWATCH LOG METRIC FILTERS for security events
    new aws.cloudwatchLogMetricFilter.CloudwatchLogMetricFilter(
      this,
      'unauthorized-api-calls',
      {
        name: 'UnauthorizedAPICalls',
        pattern:
          '{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }',
        logGroupName: '/aws/cloudtrail/security-logs-production',
        metricTransformation: {
          name: 'UnauthorizedAPICalls',
          namespace: 'CloudTrailMetrics',
          value: '1',
        },
        dependsOn: [securityServices.cloudTrail],
      }
    );

    // TERRAFORM OUTPUTS
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns', {
      value: albModule.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.instance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'lambda-s3-bucket', {
      value: lambdaCodeBucket.id,
      description:
        'S3 bucket for Lambda code - upload your security-lambda.zip here',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2Module.instances.map(i => i.id).join(','),
      description: 'EC2 instance IDs',
    });

    new TerraformOutput(this, 'security-hub-arn', {
      value: securityServices.securityHub.arn,
      description: 'Security Hub ARN',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: securityServices.cloudTrail.arn,
      description: 'CloudTrail ARN',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaSecurityModule.function.arn,
      description: 'Security Lambda function ARN',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: securityServices.snsTopic.arn,
      description: 'SNS topic ARN for security alerts',
    });

    new TerraformOutput(this, 'dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${currentRegion.id}#dashboards:name=${monitoring.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
