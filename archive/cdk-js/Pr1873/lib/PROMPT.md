I need to create a fully-automated CI/CD pipeline infrastructure using AWS CDK with JavaScript. The solution should handle source code retrieval, build, test, and deployment across multiple stages with comprehensive monitoring and security.

Requirements:

1. Use AWS CodePipeline V2 with parameterized pipeline features for the primary CI/CD orchestration
2. Integrate AWS CodeBuild for build and test processes with containerized build environments
3. Implement AWS CodeDeploy for automated application deployments with blue-green deployment strategy
4. Store source code in Amazon S3 bucket with versioning enabled and lifecycle policies
5. Create IAM roles following least privilege principle for each service with appropriate permissions
6. Set up CloudWatch alarms for CodePipeline failures with SNS notifications
7. Ensure comprehensive logging and auditing for all pipeline stages and actions
8. Deploy a custom AWS Lambda function with Powertools for AWS Lambda to validate deployment success and provide observability
9. Configure automatic pipeline triggers on new code commits
10. Implement S3 bucket policies for secure access and cross-region replication for disaster recovery

The infrastructure should be deployed in the us-east-1 region and maintain enterprise-grade security standards. The Lambda validation function should include structured logging, metrics collection, and distributed tracing capabilities using AWS Lambda Powertools.

Please provide the complete AWS CDK JavaScript infrastructure code with proper error handling and best practices. Structure the code with separate files for each major component and ensure all resources are properly tagged and documented.