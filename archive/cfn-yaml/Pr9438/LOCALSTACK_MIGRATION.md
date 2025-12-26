# LocalStack Migration - Pr1782

## Migration Summary

Successfully migrated CloudFormation CI/CD pipeline template to be compatible with LocalStack Community Edition.

## Original Task

- **Platform**: CloudFormation (CFN)
- **Language**: YAML
- **Complexity**: Hard
- **AWS Services**: S3, SNS, IAM, CodePipeline, CodeBuild, CodeDeploy, CloudWatch Events

## Changes Made for LocalStack Compatibility

### 1. IAM Policy Simplification

**Issue**: LocalStack Community Edition has strict validation for IAM policy resources that must be in ARN format or "*". Complex resource references using `!GetAtt` and `!Sub` can cause circular dependencies and validation errors.

**Fix**: Simplified all IAM role policies to use wildcard resources ("*") instead of specific ARN references.

**Files Modified**:
- `lib/TapStack.yml`

**Changes**:
- **ProdCodePipelineServiceRole**: Changed from specific S3/CodeBuild/CodeDeploy ARN references to wildcard permissions
- **ProdCodeBuildServiceRole**: Changed from specific log group and S3 ARN references to wildcard permissions
- **ProdCodeDeployServiceRole**: Removed managed policy ARN (AWSCodeDeployRole) and simplified to wildcard permissions
- **ProdEc2InstanceRole**: Changed from specific S3 and logs ARN references to wildcard permissions

### 2. CloudWatch Events Rules Removal

**Issue**: LocalStack Community Edition has limited support for EventBridge/CloudWatch Events, especially for CodePipeline and CodeBuild state change events.

**Fix**: Removed both CloudWatch Event Rules:
- `ProdPipelineEventRule` (Pipeline state changes)
- `ProdCodeBuildEventRule` (CodeBuild state changes)

**Impact**: Notifications for pipeline and build failures will not be automatically sent in LocalStack. Added comment explaining this is a LocalStack compatibility trade-off.

## Deployment Test Results

✅ **Stack Status**: CREATE_COMPLETE

### Resources Created Successfully:
- AWS::S3::Bucket (ProdArtifactsBucket)
- AWS::SNS::Topic (ProdCicdNotificationsTopic)
- AWS::IAM::Role (ProdCodeBuildServiceRole)
- AWS::CodeBuild::Project (ProdCodeBuildProject)
- AWS::CodeDeploy::Application (ProdCodeDeployApplication)
- AWS::IAM::Role (ProdCodeDeployServiceRole)
- AWS::CodeDeploy::DeploymentGroup (ProdCodeDeployDeploymentGroup)
- AWS::IAM::Role (ProdCodePipelineServiceRole)
- AWS::CodePipeline::Pipeline (ProdCodePipeline)
- AWS::IAM::Role (ProdEc2InstanceRole)
- AWS::IAM::InstanceProfile (ProdEc2InstanceProfile)

## Production Considerations

When deploying to real AWS, consider reverting these changes for better security:

1. **IAM Policies**: Restore least-privilege access by using specific ARN references instead of wildcards
2. **CloudWatch Events**: Re-enable the EventBridge rules for pipeline and build failure notifications
3. **Managed Policies**: Restore the AWSCodeDeployRole managed policy for CodeDeploy

## Testing

The stack was successfully deployed and torn down in LocalStack without errors. All core CI/CD pipeline components were created properly.

## Migration Metadata

- **Migration Date**: 2025-12-26
- **LocalStack Version**: Community Edition
- **Original PR**: #1782
- **Complexity**: Hard → Medium (after LocalStack simplifications)
