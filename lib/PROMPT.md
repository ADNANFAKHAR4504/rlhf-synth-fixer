# Multi-Account AWS Infrastructure Deployment with CDK

I need to create a CDK JavaScript solution for enterprise-scale multi-account AWS infrastructure management. The solution should provide equivalent functionality to CloudFormation StackSets but using CDK constructs and modern deployment patterns.

## Requirements

1. **Multi-Account Infrastructure Management**: Create a CDK solution that can deploy infrastructure across multiple AWS accounts and regions within an AWS Organization. The solution should support automated deployment patterns similar to CloudFormation StackSets.

2. **Cross-Account IAM Security**: Implement secure cross-account IAM roles and policies following least privilege principles. The roles should enable infrastructure deployment and management across accounts while maintaining security boundaries.

3. **Standardized Tagging Policy**: Enforce consistent resource tagging across all accounts and regions. Each resource must include department, project, and environment tags to ensure compliance with organizational policies.

4. **CDK Pipelines Integration**: Use CDK Pipelines for automated deployment workflows that can target multiple accounts and regions. The pipeline should support different environments (dev, staging, production) across different accounts.

5. **Control Tower Integration**: Integrate with AWS Control Tower Account Factory for Terraform (AFT) features including custom VPC deployment options and programmatic baseline management using the latest 2024-2025 capabilities.

6. **CDK Drift Detection**: Implement the new CDK drift detection capabilities to identify out-of-band changes across all managed accounts and notify operators of configuration drift.

The solution should be scalable for enterprise environments with hundreds of AWS accounts and provide clear deployment instructions for infrastructure teams.

Please provide the complete CDK JavaScript infrastructure code with separate files for each component. Each file should be provided as a complete code block that can be copied directly into the project structure.