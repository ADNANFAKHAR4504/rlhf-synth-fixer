# IaC Program Optimization

> **CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to optimize an existing EC2 infrastructure by implementing scheduled start/stop functionality. The configuration must: 1. Import existing EC2 instances tagged with Environment=development or Environment=staging. 2. Create CloudWatch Events rules to stop instances at 7 PM EST on weekdays. 3. Create CloudWatch Events rules to start instances at 8 AM EST on weekdays. 4. Implement Lambda functions to handle the start/stop operations. 5. Set up proper IAM roles and policies for Lambda execution. 6. Add CloudWatch alarms to notify if instances fail to start. 7. Preserve all existing instance configurations and tags. 8. Calculate and output estimated monthly cost savings. Expected output: The program should display the imported instance IDs, created Lambda function ARNs, CloudWatch rule ARNs, and estimated monthly savings based on 13 hours daily shutdown.

---

## Additional Context

### Background
A startup's development team has been running their test environments 24/7, resulting in unnecessarily high AWS bills. Management wants to optimize costs by automatically shutting down non-production EC2 instances during off-hours while maintaining the ability to quickly restart them when needed.

### Constraints and Requirements
- [Must use Pulumi's import functionality to adopt existing EC2 instances without recreation, Lambda functions must handle multiple instances in a single execution to minimize invocations, CloudWatch Events rules must account for EST timezone including daylight saving transitions, Instance state changes must be logged to CloudWatch Logs for audit purposes, Cost calculation must use current EC2 on-demand pricing for the specific instance types, Solution must not affect instances tagged with Environment=production]

### Environment Setup
AWS eu-north-1 region with existing EC2 instances requiring cost optimization. Uses Pulumi TypeScript SDK 3.x, Node.js 18+, and AWS SDK v3. Existing infrastructure includes multiple t3.medium and t3.large instances across development and staging environments. CloudWatch Events and Lambda functions will orchestrate the automated scheduling. No VPC modifications required as instances remain in their current subnets.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **ap-southeast-1**
