import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// Import all modules from modules.ts
import {
  VPCModule,
  EC2Module,
  RDSModule,
  S3Module,
  LambdaModule,
  MonitoringModule,
  Route53Module,
} from './modules';

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

    // Common configuration
    const projectName = 'tap-project';
    const environment = environmentSuffix;
    const owner = 'DevOps-Team';

    // Get availability zones (you might want to adjust based on region)
    const availabilityZones = [`${awsRegion}a`, `${awsRegion}b`];

    const vpcModule = new VPCModule(this, 'vpc', {
      projectName,
      environment,
      owner,
      cidrBlock: '10.0.0.0/16',
      availabilityZones,
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    const ec2Module = new EC2Module(this, 'ec2', {
      projectName,
      environment,
      owner,
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(s => s.id),
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      webInstanceType: 't3.micro',
      backendInstanceType: 't3.small',
      amiId: 'ami-052064a798f08f0d3', // Amazon Linux 2 - update based on your region
      minSize: 1,
      maxSize: 3,
      desiredCapacity: 2,
      keyName: 'TapStackpr4141-keypair', // Make sure this key exists
    });

    // 4. RDS Module
    const rdsModule = new RDSModule(this, 'rds', {
      projectName,
      environment,
      owner,
      vpcId: vpcModule.vpc.id,
      privateSubnetIds: vpcModule.privateSubnets.map(s => s.id),
      engine: 'mysql',
      instanceClass: 'db.t3.small',
      allocatedStorage: 20,
      storageEncrypted: true,
      multiAz: false,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      databaseName: 'tapdb',
      masterUsername: 'admin',
      masterPasswordSsmParameter: `/tap/${environment}/db/password`,
    });

    // 5. S3 Modules
    const publicS3Module = new S3Module(this, 's3-public', {
      projectName,
      environment,
      owner,
      bucketName: `${projectName}-${environment}-public-assets`,
      enableVersioning: true,
      enablePublicRead: true,
      lifecycleRules: [
        {
          id: 'expire-old-objects',
          status: 'Enabled',
          filter: {},
          expiration: {
            days: 90,
          },
          noncurrentVersionExpiration: {
            noncurrent_days: 30,
          },
        },
      ],
    });

    const privateS3Module = new S3Module(this, 's3-private', {
      projectName,
      environment,
      owner,
      bucketName: `${projectName}-${environment}-private-data`,
      enableVersioning: true,
      enablePublicRead: false,
      lifecycleRules: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          filter: {},
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
      ],
    });

    // 6. Lambda Module
    const lambdaModule = new LambdaModule(this, 'lambda', {
      projectName,
      environment,
      owner,
      functionName: `${projectName}-${environment}-processor`,
      runtime: 'nodejs18.x',
      handler: 'index.handler',
      sourceBucket: 'test12345-ts',
      sourceKey: 'lambda/lambda-function.zip', // Upload your Lambda code here
      timeout: 30,
      memorySize: 256,
      vpcConfig: {
        subnetIds: vpcModule.privateSubnets.map(s => s.id),
        securityGroupIds: [ec2Module.backendSecurityGroup.id],
      },
    });

    // 7. Route53 Module (optional - only if you have a domain)
    const route53Module = new Route53Module(this, 'route53', {
      projectName,
      environment,
      owner,
      domainName: `${environment}.tap-project.com`, // Replace with your domain
      albDnsName: ec2Module.alb.dnsName,
      albZoneId: ec2Module.alb.zoneId,
      createARecords: true,
    });

    // 8. Monitoring Module
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      projectName,
      environment,
      owner,
      alarmEmail: 'devops@tap-project.com', // Replace with your email
      instanceIds: ec2Module.webInstances.map(i => i.id),
      albArn: ec2Module.alb.arn,
      rdsIdentifier: rdsModule.dbInstance.id,
    });

    // Terraform Outputs (10 outputs as requested)
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'alb-dns-name', {
      value: ec2Module.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-arn', {
      value: privateS3Module.bucket.arn,
      description: 'Private S3 bucket ARN',
    });

    new TerraformOutput(this, 'lambda-function-arn', {
      value: lambdaModule.function.arn,
      description: 'Lambda function ARN',
    });

    new TerraformOutput(this, 'monitoring-sns-topic-arn', {
      value: monitoringModule.snsTopic.arn,
      description: 'SNS topic ARN for monitoring alerts',
    });

    new TerraformOutput(this, 'route53-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'Route53 hosted zone ID',
    });

    new TerraformOutput(this, 'backend-asg-name', {
      value: ec2Module.backendAsg.name,
      description: 'Backend Auto Scaling Group name',
    });

    new TerraformOutput(this, 'nat-gateway-ids', {
      value: vpcModule.natGateways.map(nat => nat.id),
      description: 'NAT Gateway IDs for private subnet internet access',
    });
  }
}
