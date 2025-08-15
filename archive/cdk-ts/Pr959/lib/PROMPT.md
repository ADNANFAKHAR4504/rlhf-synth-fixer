# CI/CD Pipeline Infrastructure with AWS CodePipeline and CodeBuild

I need to create a CI/CD pipeline infrastructure on AWS that supports both staging and production environments. The pipeline should use AWS CodePipeline as the orchestrator and CodeBuild for building and testing.

## Requirements

1. **Multi-environment support**: Separate staging and production deployments within the same AWS account
2. **AWS CodePipeline integration**: Main orchestrator for the CI/CD process
3. **AWS CodeBuild integration**: Handle build and test stages with caching for performance
4. **Infrastructure as Code**: Everything defined programmatically using CDK TypeScript
5. **Resource naming**: Follow pattern 'projectname-environment-resourcetype' to prevent conflicts

## Additional Features to Include

- Use AWS CodePipeline V2 features with CodeBuild rules for stage-level conditions
- Implement build caching in CodeBuild for faster deployment times
- Add CloudWatch monitoring integration for pipeline visibility
- Support for parallel execution where possible to reduce build times

## Environment Details

- Target AWS region: us-east-1
- Project name: trainr241
- Environments: staging, production
- Build artifacts should be stored in S3 with proper lifecycle policies

The solution should be production-ready and demonstrate best practices for AWS CI/CD pipelines. Please provide infrastructure code that creates all necessary resources including IAM roles, S3 buckets, CodePipeline, and CodeBuild projects for both environments.