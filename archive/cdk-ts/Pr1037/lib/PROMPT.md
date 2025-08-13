# CI/CD Pipeline Infrastructure with AWS CodePipeline and CodeBuild

I need infrastructure code that creates a comprehensive CI/CD pipeline using AWS CodePipeline and CodeBuild. The pipeline should automate deployment to AWS infrastructure with separate staging and production environments.

## Requirements

1. **Multi-Environment Pipeline**: Create distinct staging and production environments with proper isolation
2. **AWS CodePipeline Integration**: Use CodePipeline as the primary orchestrator for the CI/CD workflow
3. **AWS CodeBuild Integration**: Implement CodeBuild for building, testing, and deployment stages
4. **Environment Management**: Follow naming convention 'trainr241-{environment}-{resourcetype}' to prevent conflicts
5. **Automated Testing**: Include automated testing stages in the pipeline

## Latest AWS Features to Include

1. **CodePipeline V2 Pipeline Type**: Use the latest V2 pipeline type with enhanced configurations for triggers and variables
2. **Stage-Level Conditions**: Implement stage-level conditions for enhanced release control and automated quality gates

## Infrastructure Components Needed

- Source stage connecting to a code repository
- Build stage using CodeBuild projects for compilation and testing  
- Deploy stages for both staging and production environments
- Proper IAM roles and policies for secure pipeline execution
- S3 bucket for storing build artifacts
- CloudWatch integration for monitoring and logging

## Environment Details

- Primary region: us-east-1
- Staging environment suffix: staging
- Production environment suffix: prod
- Resource naming: trainr241-{environment}-{resource}

## Security and Best Practices

- Use least privilege IAM roles
- Enable CloudTrail logging for audit trails
- Implement proper artifact encryption
- Use parameter store for sensitive configuration

Please provide infrastructure code that successfully creates and deploys this CI/CD pipeline. The pipeline should automatically build and deploy to both environments with proper testing verification between stages.