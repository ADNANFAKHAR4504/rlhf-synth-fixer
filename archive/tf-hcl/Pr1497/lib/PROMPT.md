I need to create a comprehensive CI/CD pipeline infrastructure using Terraform HCL that deploys applications to both development and production AWS environments. The pipeline should automate the entire release process from code commit to deployment with proper approval gates and rollback mechanisms.

The infrastructure must include:

1. Create separate environments for development and production with appropriate resource isolation
2. Set up AWS CodePipeline to orchestrate the entire CI/CD workflow from source to deployment 
3. Configure AWS CodeBuild for automated testing and building of infrastructure code
4. Implement manual approval gates before production deployments to ensure quality control
5. Design automatic rollback functionality for failed production deployments
6. Use AWS Secrets Manager to securely store and manage sensitive configuration data
7. Configure CloudWatch Alarms and SNS notifications for deployment status updates
8. Centralize all deployment logs using CloudWatch Logs for audit and troubleshooting
9. Apply consistent resource tagging for environment identification and cost tracking
10. Include AWS EventBridge for enhanced event-driven automation capabilities

Additional requirements:
- Use the naming convention: [env]-myapp-[resource] for all resources
- Deploy to us-east-1 region
- Implement proper IAM roles and policies following least privilege principles  
- Include AWS Config for compliance monitoring
- All resources must have appropriate tags: Environment, Project, ManagedBy, and CostCenter

Please provide complete Terraform HCL infrastructure code with all necessary files including main configuration, variables, outputs, and any supporting resources. The code should be production-ready and follow AWS best practices for CI/CD implementations.