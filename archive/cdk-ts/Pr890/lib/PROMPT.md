Create a CI/CD pipeline using AWS CDK with TypeScript to automate the deployment and testing of a web application. The system should include the following components:

1. Automated triggering on commits to the 'main' branch using modern pipeline trigger filters and execution modes
2. Infrastructure as Code using AWS CDK with TypeScript targeting the us-east-1 region
3. Configuration of S3 buckets for storing deployment artifacts with versioning enabled
4. Build and test stages executed on AWS CodeBuild with enhanced debugging capabilities
5. End-to-end orchestration using AWS CodePipeline V2 type with parallel execution mode
6. Advanced observability using CloudWatch Application Signals for comprehensive pipeline monitoring and performance insights
7. Event-driven automation with EventBridge Pipes to streamline pipeline notifications and cross-service integrations
8. Tagging of all resources with Environment: Production and Project: CI_CD_Pipeline tags
9. Proper IAM policies to restrict access to only necessary permissions for pipeline resources

The solution should leverage the latest AWS features including CodePipeline V2 trigger filters for branch-based development, CodeBuild's enhanced debugging experience for troubleshooting build issues, CloudWatch Application Signals for deep observability into application performance, and EventBridge Pipes for seamless event routing between services. Ensure the pipeline is optimized for fast deployment times and follows AWS security best practices.

Generate the complete infrastructure code with one code block per file. Include all necessary imports, constructs, and configurations needed for a fully functional CI/CD pipeline with modern observability and event-driven capabilities.