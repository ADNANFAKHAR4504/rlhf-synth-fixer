import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

import {
  VpcModule,
  Ec2Module,
  RdsModule,
  S3Module,
  MonitoringModule,
  Route53Module,
  SsmModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  domainName?: string;
  alertEmail?: string;
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

    // Project configuration
    const projectName = 'tap-infrastructure';
    const domainName =
      props?.domainName || `${environmentSuffix}.yourdomain.com`;
    const alertEmail = props?.alertEmail || 'alerts@yourdomain.com';

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

    // Common tags for all resources
    const commonTags = {
      Project: projectName,
      Environment: environmentSuffix,
      ManagedBy: 'CDKTF',
      Owner: 'DevOps',
    };

    // 1. Create VPC Module
    const vpcModule = new VpcModule(this, 'vpc', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      cidrBlock: '10.0.0.0/16',
      azCount: 2,
      enableNatGateway: true,
      enableVpnGateway: false,
      tags: commonTags,
    });

    // 2. Create EC2 Module
    const ec2Module = new Ec2Module(this, 'ec2', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      vpc: vpcModule,
      instanceType: 't2.micro',
      amiId: 'ami-084a7d336e816906b',
      minSize: 1,
      maxSize: 2,
      desiredCapacity: 1,
      tags: commonTags,
    });

    // 3. Create RDS Module
    const rdsModule = new RdsModule(this, 'rds', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      vpc: vpcModule,
      instanceClass: 'db.t3.medium',
      engine: 'mysql',
      allocatedStorage: 20,
      databaseName: 'appdb',
      masterUsername: 'admin',
      multiAz: environmentSuffix === 'prod',
      backupRetentionPeriod: environmentSuffix === 'prod' ? 30 : 7,
      tags: commonTags,
    });

    // 4. Create Public S3 Module (for app assets)
    const publicS3Module = new S3Module(this, 's3-public', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      bucketName: `${projectName}-${environmentSuffix}-public-assets`,
      versioning: true,
      encryption: true,
      publicReadAccess: true,
      tags: commonTags,
    });

    // 5. Create Private S3 Module (for internal data)
    const privateS3Module = new S3Module(this, 's3-private', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      bucketName: `${projectName}-${environmentSuffix}-private-data`,
      versioning: true,
      encryption: true,
      publicReadAccess: false,
      tags: commonTags,
    });

    const route53Module = new Route53Module(this, 'route53', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      domainName,
      albDnsName: ec2Module.alb.dnsName,
      albZoneId: ec2Module.alb.zoneId,
      tags: commonTags,
    });

    // 8. Create Monitoring Module
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      emailEndpoint: alertEmail,
      ec2Module,
      rdsModule,
      tags: commonTags,
    });

    // 9. Create SSM Parameter Store Module
    const ssmModule = new SsmModule(this, 'ssm', {
      projectName,
      environment: environmentSuffix,
      region: awsRegion,
      parameters: [
        {
          name: 'api/endpoint',
          value: `https://${domainName}/api`,
          type: 'String',
          description: 'API endpoint URL',
        },
        {
          name: 'app/version',
          value: '1.0.0',
          type: 'String',
          description: 'Application version',
        },
        {
          name: 'features/enabled',
          value: 'true',
          type: 'String',
          description: 'Feature flags',
        },
      ],
      tags: commonTags,
    });

    // Terraform Outputs
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
      value: ec2Module.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for app assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-name', {
      value: privateS3Module.bucket.bucket,
      description: 'Private S3 bucket name for internal data',
    });

    new TerraformOutput(this, 'monitoring-sns-topic-arn', {
      value: monitoringModule.snsTopic.arn,
      description: 'SNS topic ARN for monitoring alerts',
    });

    new TerraformOutput(this, 'route53-zone-id', {
      value: route53Module.hostedZone.zoneId,
      description: 'Route53 hosted zone ID',
    });

    new TerraformOutput(this, 'ssm-parameters', {
      value: ssmModule.parameters?.map(p => p.name) || [],
      description: 'SSM parameter names',
    });
  }
}
