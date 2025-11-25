# CI/CD Pipeline for Containerized Applications

A comprehensive CloudFormation JSON template that deploys a complete CI/CD pipeline for containerized Node.js applications with automated build, test, and deployment stages across staging and production environments.

## Architecture Overview

This infrastructure creates a fully automated CI/CD pipeline using AWS native services:

- **Source Control**: AWS CodeCommit repository for version control
- **Container Registry**: Amazon ECR for Docker image storage
- **Build System**: AWS CodeBuild for Docker image builds
- **Pipeline Orchestration**: AWS CodePipeline with 5 stages
- **Deployment**: AWS CodeDeploy for EC2 Lambda deployments
- **Artifact Storage**: Amazon S3 with AES256 encryption
- **Event Triggers**: Amazon CloudWatch Events for automatic pipeline execution
- **Notifications**: Amazon SNS for pipeline state changes
- **Logging**: CloudWatch Logs for build and deployment audit trails

## Pipeline Stages

1. **Source**: Retrieves code from CodeCommit repository on branch commits
2. **Build**: Builds Docker images using CodeBuild and pushes to ECR
3. **Deploy to Staging**: Deploys to staging environment using CodeDeploy
4. **Manual Approval**: Requires manual approval before production deployment
5. **Deploy to Production**: Deploys approved changes to production environment

## Prerequisites

- AWS CLI 2.x configured with appropriate credentials
- IAM permissions to create all resources defined in the template
- EC2 instances tagged appropriately for CodeDeploy targeting:
  - Staging: `Environment=staging`
  - Production: `Environment=production`
- Docker application code with Dockerfile in CodeCommit repository

## Parameters

- **EnvironmentSuffix**: Unique suffix for resource naming (default: "dev")
- **RepositoryName**: CodeCommit repository name (default: "my-app")
- **BranchName**: Branch to trigger pipeline (default: "main")
- **StagingAccountId**: AWS Account ID for staging (default: "123456789012")
- **ProductionAccountId**: AWS Account ID for production (default: "987654321098")

## Deployment

### Deploy the CloudFormation Stack

```bash
aws cloudformation create-stack \
  --stack-name cicd-pipeline-<environment-suffix> \
  --template-body file://lib/template.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=<your-suffix> \
    ParameterKey=RepositoryName,ParameterValue=<your-repo-name> \
    ParameterKey=BranchName,ParameterValue=main \
    ParameterKey=StagingAccountId,ParameterValue=<staging-account-id> \
    ParameterKey=ProductionAccountId,ParameterValue=<production-account-id> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation describe-stacks \
  --stack-name cicd-pipeline-<environment-suffix> \
  --region us-east-1 \
  --query 'Stacks[0].StackStatus'
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name cicd-pipeline-<environment-suffix> \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Resources Created

### Core Pipeline Resources

- **AWS::CodeCommit::Repository**: Source code repository
- **AWS::ECR::Repository**: Container image registry
- **AWS::CodeBuild::Project**: Docker image build project
- **AWS::CodePipeline::Pipeline**: 5-stage CI/CD pipeline
- **AWS::CodeDeploy::Application**: Deployment application
- **AWS::CodeDeploy::DeploymentGroup** (x2): Staging and production deployment groups

### Storage and Networking

- **AWS::S3::Bucket**: Encrypted artifact storage with lifecycle policies
- **AWS::Logs::LogGroup**: CloudWatch Logs for build logs

### IAM Roles and Policies

- **CodePipelineServiceRole**: Least-privilege role for pipeline execution
- **CodeBuildServiceRole**: Role for CodeBuild with ECR and S3 permissions
- **CodeDeployServiceRole**: Role for CodeDeploy with managed policy
- **PipelineEventRole**: Role for CloudWatch Events to trigger pipeline

### Event and Notification Resources

- **AWS::Events::Rule** (x2): Pipeline triggers and state change notifications
- **AWS::SNS::Topic**: Pipeline notification topic
- **AWS::SNS::TopicPolicy**: SNS topic access policy

## Outputs

- **PipelineArn**: ARN of the CodePipeline
- **PipelineExecutionRoleArn**: ARN of the CodePipeline execution role
- **CodeCommitRepositoryCloneUrlHttp**: HTTP clone URL for CodeCommit repository
- **ECRRepositoryUri**: URI of the ECR repository
- **ArtifactBucketName**: Name of the S3 artifact bucket
- **SNSTopicArn**: ARN of the SNS notification topic
- **CodeBuildProjectName**: Name of the CodeBuild project
- **CodeDeployApplicationName**: Name of the CodeDeploy application

## Security Features

1. **Encryption at Rest**: All S3 artifacts encrypted with AES256
2. **Encryption in Transit**: HTTPS for all API communications
3. **Least-Privilege IAM**: All roles follow principle of least privilege
4. **ECR Image Scanning**: Automatic vulnerability scanning on image push
5. **Public Access Blocked**: S3 bucket blocks all public access
6. **Versioning Enabled**: S3 bucket versioning for artifact recovery
7. **CloudWatch Logging**: Comprehensive audit trails for all operations

## Cost Optimization

- **CodeBuild**: Uses BUILD_GENERAL1_SMALL compute type (~$0.005/minute)
- **S3 Lifecycle**: Automatically deletes artifacts after 30 days
- **ECR Lifecycle**: Retains only last 10 images
- **CloudWatch Logs**: 7-day retention for build logs
- **Serverless Services**: CodePipeline, CodeBuild, CodeDeploy pay-per-use

## Usage Workflow

1. **Initial Setup**:
   - Deploy CloudFormation stack
   - Push application code with Dockerfile to CodeCommit repository

2. **Automatic Pipeline Execution**:
   - Developer commits code to monitored branch
   - CloudWatch Events triggers pipeline automatically
   - CodeBuild builds Docker image and pushes to ECR
   - CodeDeploy deploys to staging environment

3. **Manual Approval**:
   - Pipeline waits at manual approval stage
   - SNS notification sent to subscribers
   - Approver reviews staging deployment
   - Approver approves or rejects production deployment

4. **Production Deployment**:
   - On approval, CodeDeploy deploys to production
   - Rolling update ensures zero downtime
   - SNS notification sent on completion

## Monitoring and Troubleshooting

### View Pipeline Execution

```bash
aws codepipeline get-pipeline-state \
  --name cicd-pipeline-<environment-suffix> \
  --region us-east-1
```

### View Build Logs

```bash
aws logs tail /aws/codebuild/build-project-<environment-suffix> --follow
```

### View CodeDeploy Deployments

```bash
aws deploy list-deployments \
  --application-name app-deployment-<environment-suffix> \
  --region us-east-1
```

### Subscribe to SNS Notifications

```bash
aws sns subscribe \
  --topic-arn <SNSTopicArn-from-outputs> \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region us-east-1
```

## Cleanup

To delete all resources:

```bash
# Empty and delete S3 bucket first
aws s3 rm s3://pipeline-artifacts-<environment-suffix>-<account-id> --recursive
aws s3 rb s3://pipeline-artifacts-<environment-suffix>-<account-id>

# Delete ECR images
aws ecr batch-delete-image \
  --repository-name app-repo-<environment-suffix> \
  --image-ids imageTag=latest \
  --region us-east-1

# Delete CloudFormation stack
aws cloudformation delete-stack \
  --stack-name cicd-pipeline-<environment-suffix> \
  --region us-east-1
```

## Cross-Account Deployment Setup

For cross-account deployments to staging and production accounts:

1. **In Target Accounts** (Staging and Production):
   - Create IAM role: `cross-account-codepipeline-role-<environment-suffix>`
   - Trust policy: Allow source account to assume role
   - Permissions: CodeDeploy, S3 artifact bucket access

2. **Example Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::<source-account-id>:root"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

## Limitations and Considerations

- **CodeDeploy Targeting**: Requires EC2 instances with appropriate tags
- **Docker Application**: Repository must contain valid Dockerfile
- **Manual Approval**: Human intervention required for production deployments
- **Cross-Account**: Requires IAM roles created in target accounts
- **Region**: Template configured for us-east-1 (modify as needed)

## Testing

Unit tests validate:
- CloudFormation template structure and validity
- Required parameters present
- All resources include EnvironmentSuffix
- DeletionPolicy set correctly on all deletable resources
- IAM policies follow least-privilege principles
- Security configurations meet requirements

Integration tests verify:
- Successful stack deployment
- Pipeline execution on code commit
- Docker image build and ECR push
- CodeDeploy deployment to targets
- Manual approval workflow
- SNS notifications delivered

## License

This template is provided as-is for infrastructure automation purposes.

## Support

For issues or questions:
1. Check CloudFormation events for deployment failures
2. Review CodeBuild logs for build errors
3. Check CodeDeploy deployment logs for deployment issues
4. Verify IAM permissions are correctly configured
5. Ensure EC2 instances are tagged correctly for CodeDeploy targeting
