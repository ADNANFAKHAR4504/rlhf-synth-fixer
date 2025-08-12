Create a comprehensive CI/CD pipeline infrastructure using AWS CDK TypeScript that automates the deployment of applications to AWS Elastic Beanstalk. The pipeline should integrate with GitHub for source control and include the following components:

**Core Pipeline Requirements:**
- Source stage that connects to a GitHub repository and triggers on main branch commits
- Build stage using AWS CodeBuild with environment variable management for sensitive data
- Deployment stage targeting AWS Elastic Beanstalk with automatic approval after build
- Email notifications for pipeline status using Amazon SNS
- Support for application rollback in the Elastic Beanstalk environment

**Security and Network Requirements:**
- Implement least privilege IAM roles for all CodePipeline and CodeBuild resources
- Configure VPC networking for CodeBuild and Elastic Beanstalk to restrict network access
- Enable encryption in transit and at rest for all AWS resources
- Secure handling of API keys and configuration through environment variables

**Modern AWS Features Integration:**
- Incorporate AWS EventBridge for enhanced pipeline event handling and monitoring
- Utilize the new CodePipeline Commands action for flexible shell command execution during build processes

**Infrastructure Code Requirements:**
- Generate complete CDK TypeScript infrastructure code
- Ensure all resources are properly configured with security best practices
- Include comprehensive error handling and monitoring capabilities
- Organize code into logical constructs and stacks for maintainability

Please provide the infrastructure code with one code block per file, ensuring each file can be directly implemented.