import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformOutput, TerraformStack } from 'cdktf';
import { Construct } from 'constructs';
import { ContentDeliveryModule } from './content-delivery-module';
import { MonitoringModule } from './monitoring-module';
import { PipelineModule } from './pipeline-module';

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

    // Configure S3 Backend with state locking
    // Note: DynamoDB table for state locking must be created externally before running this stack
    // Table name: terraform-state-lock-${environmentSuffix}
    // Hash key: LockID (String)
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
      dynamodbTable: `terraform-state-lock-${environmentSuffix}`,
    });

    // Create Content Delivery Module (S3 + CloudFront)
    const contentDelivery = new ContentDeliveryModule(
      this,
      'content-delivery',
      { environmentSuffix }
    );

    // Create Monitoring Module (CloudWatch + SNS)
    const monitoring = new MonitoringModule(this, 'monitoring', {
      environmentSuffix,
    });

    // Create Pipeline Module (CodeCommit + CodePipeline + CodeBuild + CodeDeploy)
    const pipeline = new PipelineModule(this, 'pipeline', {
      environmentSuffix,
      artifactBucket: contentDelivery.artifactBucket,
      snsTopicArn: monitoring.snsTopic.arn,
      region: awsRegion,
    });

    // Outputs
    new TerraformOutput(this, 'source-bucket', {
      value: contentDelivery.artifactBucket.bucket,
      description: 'S3 bucket for source code',
    });

    new TerraformOutput(this, 'source-object-key', {
      value: `source/${environmentSuffix}/source.zip`,
      description: 'S3 object key for source code',
    });

    new TerraformOutput(this, 'codepipeline-name', {
      value: pipeline.codePipeline.name,
      description: 'CodePipeline name',
    });

    new TerraformOutput(this, 'codebuild-project-name', {
      value: pipeline.codeBuildProject.name,
      description: 'CodeBuild project name',
    });

    new TerraformOutput(this, 'codedeploy-application-name', {
      value: pipeline.codeDeployApp.name,
      description: 'CodeDeploy application name',
    });

    new TerraformOutput(this, 'codedeploy-deployment-group-name', {
      value: pipeline.deploymentGroup.deploymentGroupName,
      description: 'CodeDeploy deployment group name',
    });

    new TerraformOutput(this, 'artifact-bucket-name', {
      value: contentDelivery.artifactBucket.bucket,
      description: 'S3 bucket for pipeline artifacts',
    });

    new TerraformOutput(this, 'content-bucket-name', {
      value: contentDelivery.contentBucket.bucket,
      description: 'S3 bucket for educational content',
    });

    new TerraformOutput(this, 'cloudfront-distribution-id', {
      value: contentDelivery.distribution.id,
      description: 'CloudFront distribution ID',
    });

    new TerraformOutput(this, 'cloudfront-domain-name', {
      value: contentDelivery.distribution.domainName,
      description: 'CloudFront distribution domain name',
    });

    new TerraformOutput(this, 'sns-topic-arn', {
      value: monitoring.snsTopic.arn,
      description: 'SNS topic ARN for notifications',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: pipeline.ec2Instance.id,
      description: 'EC2 instance ID for deployment',
    });

    new TerraformOutput(this, 'state-lock-table-name', {
      value: `terraform-state-lock-${environmentSuffix}`,
      description:
        'DynamoDB table name for Terraform state locking (must be created externally)',
    });
  }
}
