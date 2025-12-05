# CI/CD Pipeline Integration

## Task Overview

Design and implement a CloudFormation template (JSON format) that creates a secure CI/CD pipeline for an educational content delivery platform.

## Platform and Language

**MANDATORY**: This task MUST use **CloudFormation with JSON** format.

## Requirements

### Pipeline Architecture
- Create a complete CI/CD pipeline using AWS CodePipeline
- Source stage using AWS CodeCommit repository
- Build stage using AWS CodeBuild
- Deploy stage for application deployment

### CI/CD Components
1. **CodeCommit Repository**
   - Create a Git repository for source code
   - Enable branch protection and pull request workflow

2. **CodeBuild Project**
   - Configure build environment
   - Define buildspec for compilation and testing
   - Enable CloudWatch Logs for build logs

3. **CodePipeline**
   - Orchestrate source, build, and deploy stages
   - Configure artifact storage in S3
   - Enable pipeline notifications via SNS

4. **IAM Roles and Policies**
   - CodePipeline service role with least privilege
   - CodeBuild service role with required permissions
   - Proper trust relationships and policies

### Security Requirements
- All S3 buckets must have encryption enabled (SSE-S3)
- IAM roles must follow least privilege principle
- Enable CloudWatch Logs encryption
- Use secure pipeline artifact storage

### Naming Convention
- ALL resource names MUST include `${EnvironmentSuffix}` parameter
- Format: `resource-name-${EnvironmentSuffix}`
- Example: `cicd-pipeline-${EnvironmentSuffix}`

### Destroyability
- NO retention policies (no `DeletionPolicy: Retain`)
- S3 buckets should be deletable
- All resources must be cleanly removable

### Outputs
Export the following for integration:
- CodeCommit repository clone URL (HTTP and SSH)
- CodeBuild project name
- CodePipeline name
- Artifact bucket name
- CloudWatch log group names

## AWS Services to Use
- AWS CodeCommit
- AWS CodeBuild
- AWS CodePipeline
- Amazon S3 (artifact storage)
- Amazon SNS (notifications)
- AWS IAM (roles and policies)
- Amazon CloudWatch Logs

## Constraints
1. Use CloudFormation JSON format (not YAML)
2. Target region: us-east-1 (check lib/AWS_REGION if exists)
3. Include EnvironmentSuffix parameter for all resource names
4. No hardcoded environment values (dev, prod, stage, etc.)
5. All resources must be destroyable (no Retain policies)
6. Follow AWS best practices for CI/CD pipelines

## Testing Considerations
- Infrastructure should deploy successfully
- Pipeline should be able to execute (even with empty repository)
- All IAM permissions should be correctly configured
- CloudWatch logs should be accessible

## Deliverables
1. CloudFormation template in JSON format in `lib/` directory
2. Template should synthesize without errors
3. All resources properly configured with IAM permissions
4. Comprehensive outputs for resource references