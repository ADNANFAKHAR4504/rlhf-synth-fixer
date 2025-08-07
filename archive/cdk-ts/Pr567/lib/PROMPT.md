# Multi-Region Application Infrastructure

I need to create AWS CDK TypeScript infrastructure for deploying an application across multiple regions. The application needs to be deployed in both us-east-1 and eu-west-1 regions.

## Requirements

1. Deploy infrastructure in both us-east-1 and eu-west-1 regions
2. Include EC2 instances in both regions 
3. Include S3 buckets with proper access controls
4. All resources must be tagged with Environment=Production and Project=GlobalApp
5. Create IAM roles and policies for EC2 instances that restrict S3 access to only buckets tagged with Accessible=true
6. Use AWS Step Functions for workflow orchestration between regions
7. Include AWS Application Composer integration for enhanced deployment workflows

## Infrastructure Components Needed

- Multi-region CDK stacks
- EC2 instances with proper IAM roles
- S3 buckets with conditional access policies
- IAM policies with tag-based conditions
- Cross-region networking if needed
- Resource tagging strategy

Please provide complete infrastructure code with one code block per file. The solution should follow AWS best practices for multi-region deployments and implement proper security controls for resource access.