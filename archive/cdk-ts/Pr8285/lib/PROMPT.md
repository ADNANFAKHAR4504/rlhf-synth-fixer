You are a senior AWS architect and expert in infrastructure-as-code, specializing in AWS CDK v2 with TypeScript. Your mission is to generate a comprehensive and production-ready AWS CDK application that orchestrates the migration of a legacy system to a new AWS environment.

The application must be designed for flexibility and maintainability, adhering to the following requirements:

Single Stack: All the infrastructure resources must be defined within a single, unified CDK Stack.

Data Backup & Restore: The stack must implement a complete data backup and restore solution. This should leverage AWS Backup to create a backup plan for critical resources.

Cross-Region Parameterization: The CDK app should be able to deploy the stack to multiple AWS regions. Use Stack props and/or CDK context to parameterize region-specific values, such as VPC ID and subnet IDs, making the deployment flexible and repeatable.

Resource Connections: Ensure all resources are correctly linked and have the necessary permissions. This includes an IAM role for the application's compute resources with access to the backup vault.

Please provide the full, commented TypeScript code for the CDK application, including all necessary imports and the entry point (bin/my-app.ts) and the stack definition (lib/my-stack.ts) files. The code should be well-structured, easy to read, and ready for deployment.