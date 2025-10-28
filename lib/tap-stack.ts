import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import * as aws from '@cdktf/provider-aws';
import {
  VpcModule,
  IamModule,
  S3Module,
  RdsModule,
  AlbModule,
  EcsModule,
  CicdModule,
  MonitoringModule,
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

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: [
        {
          tags: {
            Environment: 'Production',
            Project: 'MultiTierWebApp',
            ManagedBy: 'CDKTF',
            Owner: 'DevOps Team',
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
    // Get AWS Account ID using data source
    const callerIdentity = new aws.dataAwsCallerIdentity.DataAwsCallerIdentity(
      this,
      'caller-identity'
    );
    const accountId = callerIdentity.accountId;
    // ==================== Module Instantiation ====================

    // 1. VPC Module - Foundation for all networking
    const vpcModule = new VpcModule(this, 'vpc', { awsRegion });

    // 2. IAM Module - Security roles and policies
    const iamModule = new IamModule(this, 'iam');

    // 3. S3 Module - Storage for assets and artifacts
    const s3Module = new S3Module(this, 's3', {
      awsRegion,
      accountId: accountId,
    });

    // 4. ALB Module - Application Load Balancer
    const albModule = new AlbModule(this, 'alb', {
      vpc: vpcModule.vpc,
      publicSubnets: vpcModule.publicSubnets,
      logsBucket: s3Module.bucket,
      bucketPolicy: s3Module.bucketPolicy,
    });

    // 5. ECS Module - Container orchestration (pass listener as dependency)
    const ecsModule = new EcsModule(this, 'ecs', {
      vpc: vpcModule.vpc,
      publicSubnets: vpcModule.publicSubnets,
      targetGroup: albModule.targetGroup,
      albSecurityGroup: albModule.albSecurityGroup,
      taskRole: iamModule.ecsTaskRole,
      executionRole: iamModule.ecsExecutionRole,
      instanceProfile: iamModule.ecsInstanceProfile,
      listener: albModule.listener, // Pass listener to ensure proper dependency
      awsRegion,
    });

    // 6. RDS Module - Database layer
    const rdsModule = new RdsModule(this, 'rds', {
      vpc: vpcModule.vpc,
      privateSubnets: vpcModule.privateSubnets,
      ecsSecurityGroup: ecsModule.ecsSecurityGroup,
    });

    // 7. CI/CD Module - Automated deployment pipeline
    const cicdModule = new CicdModule(this, 'cicd', {
      artifactBucket: s3Module.bucket,
      codeBuildRole: iamModule.codeBuildRole,
      codePipelineRole: iamModule.codePipelineRole,
      ecsCluster: ecsModule.cluster,
      ecsService: ecsModule.service,
      awsRegion,
      accountId: accountId,
    });

    // 8. Monitoring Module - CloudWatch monitoring and alerts
    const monitoringModule = new MonitoringModule(this, 'monitoring', {
      ecsCluster: ecsModule.cluster,
      ecsService: ecsModule.service,
      alb: albModule.alb,
      dbInstance: rdsModule.dbInstance,
      snsTopic: cicdModule.snsTopic,
      awsRegion,
    });

    // ==================== Stack Outputs ====================

    // VPC Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(s => s.id).join(','),
      description: 'Public Subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(s => s.id).join(','),
      description: 'Private Subnet IDs',
    });

    // ECS Outputs
    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsModule.cluster.name,
      description: 'ECS Cluster Name',
    });

    new TerraformOutput(this, 'ecs-service-name', {
      value: ecsModule.service.name,
      description: 'ECS Service Name',
    });

    new TerraformOutput(this, 'ecs-task-definition', {
      value: ecsModule.taskDefinition.arn,
      description: 'ECS Task Definition ARN',
    });

    // ALB Outputs
    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new TerraformOutput(this, 'alb-arn', {
      value: albModule.alb.arn,
      description: 'Application Load Balancer ARN',
    });

    new TerraformOutput(this, 'alb-target-group-arn', {
      value: albModule.targetGroup.arn,
      description: 'ALB Target Group ARN',
    });

    // RDS Outputs
    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS Instance Endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'rds-port', {
      value: rdsModule.dbInstance.port.toString(),
      description: 'RDS Instance Port',
    });

    new TerraformOutput(this, 'rds-database-name', {
      value: rdsModule.dbInstance.dbName,
      description: 'RDS Database Name',
    });

    // S3 Outputs
    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 Bucket Name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'S3 Bucket ARN',
    });

    // CI/CD Outputs
    new TerraformOutput(this, 'codepipeline-arn', {
      value: cicdModule.pipeline.arn,
      description: 'CodePipeline ARN',
    });

    new TerraformOutput(this, 'codebuild-project-name', {
      value: cicdModule.codeBuildProject.name,
      description: 'CodeBuild Project Name',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: cicdModule.snsTopic.arn,
      description: 'SNS Topic ARN for Notifications',
    });

    // Monitoring Outputs
    new TerraformOutput(this, 'cloudwatch-dashboard-url', {
      value: `https://console.aws.amazon.com/cloudwatch/home?region=${awsRegion}#dashboards:name=${monitoringModule.dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });

    // Application Access URL
    new TerraformOutput(this, 'application-url', {
      value: `http://${albModule.alb.dnsName}`,
      description: 'Application Access URL',
    });

    // Stack Metadata
    new TerraformOutput(this, 'stack-region', {
      value: awsRegion,
      description: 'AWS Region',
    });

    new TerraformOutput(this, 'stack-environment', {
      value: 'Production',
      description: 'Environment Name',
    });

    new TerraformOutput(this, 'deployment-timestamp', {
      value: new Date().toISOString(),
      description: 'Deployment Timestamp',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
