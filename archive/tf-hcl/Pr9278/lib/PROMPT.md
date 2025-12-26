Need to build a CI/CD pipeline infrastructure using Terraform that handles deployments for both dev and production AWS environments. The pipeline should automate everything from code commit through deployment with approval gates and rollback capability.

What I need:

1. Separate dev and production environments with proper isolation
2. AWS CodePipeline to orchestrate the workflow from source to deployment
3. CodeBuild for automated testing and building
4. Manual approval before prod deployments
5. Automatic rollback when prod deployments fail
6. Secrets Manager to store sensitive configs
7. CloudWatch Alarms that send SNS notifications for deployment status
8. CloudWatch Logs for centralizing deployment logs
9. EventBridge for event-driven automation
10. AWS Config for compliance monitoring

Service connectivity:
- S3 bucket stores source code and triggers CodePipeline on new commits
- CodePipeline connects to CodeBuild project to execute build and test stages
- CodeBuild publishes build logs and results to CloudWatch Logs for debugging
- Lambda function watches CodePipeline execution state via EventBridge and triggers automatic rollback on failures
- SNS topic sends deployment notifications to operations team when stages complete
- EventBridge captures pipeline state changes and routes events to Lambda for processing
- Secrets Manager integrates with CodeBuild to inject database credentials and API keys during builds
- Config continuously monitors all resources and sends compliance alerts to SNS

Technical details:
- Naming: dev-myapp-codepipeline, prod-myapp-codebuild, etc
- Region: us-east-1
- IAM: least privilege roles for all services
- Tags: Environment, Project, ManagedBy, CostCenter on all resources

Give me production-ready Terraform code with main config, variables, outputs, and supporting resources following AWS best practices.
