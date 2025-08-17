# AWS CI/CD Pipeline CloudFormation Template

This CloudFormation template establishes a comprehensive, secure CI/CD pipeline using AWS CodePipeline, CodeBuild, and related services. The solution implements security best practices, automated workflows, and robust artifact management.

## Architecture Overview

The pipeline orchestrates a four-stage workflow:
1. **Source Stage**: Pulls code from GitHub using CodeStar Connections
2. **Build Stage**: Compiles, tests, and packages using CodeBuild
3. **Approval Stage**: Manual gate with SNS notifications
4. **Deploy Stage**: Deploys artifacts to secure S3 bucket

## Key Features

### Security Implementation
- **KMS Encryption**: Custom KMS key encrypts all artifacts, logs, and notifications
- **S3 Security**: Versioning enabled, public access blocked, lifecycle policies configured
- **IAM Least Privilege**: Minimized permissions for all service roles
- **Secrets Management**: AWS Secrets Manager integration for sensitive data

### Pipeline Configuration
- **GitHub Integration**: CodeStar Connections for secure repository access
- **Multi-Language Support**: Buildspec supports Node.js, Python, and Java projects
- **Automated Testing**: Includes unit tests, security scans, and linting
- **Artifact Management**: Separate buckets for pipeline and deployment artifacts

## CloudFormation Template Structure

### Parameters
- `ProjectName`: Project identifier for resource naming
- `Environment`: Environment designation (dev/staging/prod)
- `CodeStarConnectionArn`: GitHub connection ARN
- `GitHubRepositoryOwner`: Repository owner/organization
- `GitHubRepositoryName`: Repository name
- `GitHubBranchName`: Target branch (default: main)
- `ApprovalNotificationEmail`: Email for approval notifications
- `SecretValue`: Secret value for Secrets Manager

### Core Resources

#### Encryption and Security
```yaml
PipelineKMSKey:
  Type: AWS::KMS::Key
  # Custom KMS key for encryption of all pipeline resources

BuildSecret:
  Type: AWS::SecretsManager::Secret
  # Secure storage for build-time secrets
```

#### Storage Infrastructure
```yaml
PipelineArtifactsBucket:
  Type: AWS::S3::Bucket
  # Encrypted bucket for pipeline artifacts with versioning

DeploymentArtifactsBucket:
  Type: AWS::S3::Bucket
  # Encrypted bucket for deployment artifacts with lifecycle policies
```

#### Build Configuration
```yaml
CodeBuildProject:
  Type: AWS::CodeBuild::Project
  # Multi-language build environment with comprehensive buildspec
```

#### Pipeline Workflow
```yaml
CodePipeline:
  Type: AWS::CodePipeline::Pipeline
  # Four-stage pipeline with Source, Build, Approval, and Deploy stages
```

## Build Process (buildspec.yml)

The inline buildspec includes comprehensive phases:

### Install Phase
- Runtime detection (Node.js 18, Python 3.11)
- Automatic dependency installation (npm, pip, maven)

### Pre-build Phase
- Security scanning with bandit (Python) and npm audit (Node.js)
- Code quality checks with linting tools
- Secrets retrieval from AWS Secrets Manager

### Build Phase
- Application compilation and packaging
- Unit test execution
- Multi-language support with fallback handling

### Post-build Phase
- Artifact packaging (zip format)
- Deployment package creation with metadata

## Testing Instructions

### Manual Pipeline Testing

1. **Trigger Pipeline**
   - Push code to the configured GitHub branch
   - Pipeline automatically starts via webhook

2. **Monitor Build Stage**
   - View build logs in CloudWatch Logs
   - Check build status in CodeBuild console

3. **Handle Approval Stage**
   - Receive SNS email notification
   - Approve/reject in CodePipeline console

4. **Verify Deployment**
   - Check deployment artifacts in S3 bucket
   - Verify artifact versioning and encryption

### Validation Commands
```bash
# Check pipeline status
aws codepipeline get-pipeline-state --name {pipeline-name}

# View build logs
aws logs filter-log-events --log-group-name /aws/codebuild/{project-name}

# List deployment artifacts
aws s3 ls s3://{deployment-bucket}/deployments/
```

## Security Considerations

- All resources use KMS encryption with custom keys
- S3 buckets block public access and use versioning
- IAM roles follow least privilege principle
- Secrets are stored in AWS Secrets Manager, not in code
- CloudWatch Logs provide comprehensive audit trail

## Best Practices Implemented

- **Resource Tagging**: Consistent tagging for cost allocation and management
- **Lifecycle Management**: Automatic artifact cleanup policies
- **Error Handling**: Comprehensive error handling in buildspec
- **Multi-Environment Support**: Parameterized for different environments
- **Security Scanning**: Integrated security tools for vulnerability detection

## Outputs

The template provides essential outputs for integration:
- Pipeline name and ARN
- S3 bucket names for artifacts
- CodeBuild project name
- Secrets Manager secret ARN
- SNS topic ARN for notifications

This solution provides a production-ready, secure CI/CD pipeline that adheres to AWS best practices and can be easily customized for different project requirements.