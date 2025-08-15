I need to create AWS infrastructure for a multi-environment application deployment that ensures consistency across development, staging, and production environments. The infrastructure should include AWS Lambda functions, API Gateway, and S3 buckets with consistent configurations.

Requirements:
- Set up AWS Lambda functions with environment-specific configuration using parameterization
- Create API Gateway with routing rules and consistent setup across all environments 
- Deploy S3 buckets with parameterized naming conventions
- Implement environment parameter management system for consistent deployments
- Add validation mechanism to check stack integrity before deployment
- Support multi-account and multi-region deployment capabilities
- Use AWS Lambda response streaming for improved performance
- Configure API Gateway routing rules for dynamic request handling

The solution should use CDK TypeScript and be deployable to us-east-1 region. Each environment (dev, staging, prod) should have identical infrastructure with only configuration differences. Include proper resource tagging and naming conventions.

Please provide infrastructure code that creates separate stacks for each component type and integrates them properly.