# Reusable, Multi-Region Web Application Infrastructure with AWS CDK

You are tasked with creating a reusable and configurable AWS Cloud Development Kit (CDK) application in TypeScript to support a multi-region deployment of a web application. The solution must be designed for consistency across environments while allowing for specific regional overrides.

## Requirements

### Reusable CDK Constructs
Develop a reusable CDK application that can deploy and manage a standard web application infrastructure (e.g., EC2, S3, RDS) across multiple AWS regions. The design should favor reusable constructs and stacks.

### Environment Configuration Strategy
Implement a strategy to manage different environment configurations (e.g., dev, staging, prod). The CDK application should use a shared set of constructs but allow for environment-specific overrides for parameters like instance sizes, VPC CIDR ranges, or feature flags. This should be managed through CDK context (`cdk.context.json`) or stack properties.

### Comprehensive Tagging
Establish a comprehensive and consistent tagging strategy for organizing resources and enabling cost tracking. Tags must be applied automatically to all resources created by the CDK application.

### Cross-Stack Dependencies
Utilize cross-stack references to manage resource dependencies effectively. For example, a database stack should be able to export its security group or endpoint URL to be used by an application stack within the same environment.

### Logical Naming and Parameterization
Use logical naming conventions and parameterization for resources to ensure clarity and prevent naming conflicts when deploying multiple environments or regions from the same CDK application.

## Expected Output

Craft a well-structured AWS CDK project in TypeScript that adheres to all the above requirements. The project should include comprehensive comments explaining how environment parameters are used and how regional considerations are handled. The CDK application must synthesize and deploy without errors, successfully instantiating all required resources in target AWS regions according to the specified configurations.
\ No newline at end of file
