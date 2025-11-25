# Single-Region High Availability Architecture for Payment Processing System

## Task ID: v8o3w5

## Platform and Language
**MANDATORY**: Use **CDKTF with Python** for all infrastructure code.

## Task Overview
Create a CDKTF Python program to implement a single-region high availability architecture for a payment processing system.

## Business Context
A financial services company requires a high availability solution for their critical payment processing system. The system needs to be resilient to availability zone failures while maintaining data consistency and high performance. They need CloudWatch monitoring, automated backups, and comprehensive logging.

## Architecture Details
Single-region high availability infrastructure in us-east-1 region. Utilizes Aurora MySQL for transactional data with automatic backtracking, DynamoDB for session management with point-in-time recovery, Lambda functions for payment processing logic, and EventBridge for event-driven workflows. Requires CDKTF 0.20+ with Python 3.9+, AWS CDK constructs library, and boto3 SDK. VPC with private subnets across 3 AZs, NAT gateway for outbound traffic, and Route 53 hosted zone for DNS management.

## Mandatory Requirements (Must Complete)

1. Create Aurora MySQL cluster in us-east-1 with db.r5.large instances and 72-hour backtracking capability (CORE: Aurora)
2. Configure DynamoDB table for session data with on-demand billing and point-in-time recovery (CORE: DynamoDB)
3. Deploy Lambda function in VPC for payment processing with 1GB memory allocation (CORE: Lambda)
4. Implement Route 53 hosted zone with simple DNS record for the payment API endpoint
5. Set up EventBridge rules for payment event processing
6. Configure AWS Backup plan with daily backups and 7-day retention for Aurora
7. Create CloudWatch dashboard showing RDS metrics, Lambda invocations, and DynamoDB consumed capacity
8. Implement IAM roles with least privilege permissions for Lambda and backup services
9. Use Systems Manager Parameter Store to manage database endpoints and configuration consistently
10. Configure CloudWatch alarms for Lambda errors, Aurora CPU utilization, and DynamoDB throttling

## Optional Enhancements (If Time Permits)

- Add Step Functions for orchestrating complex payment workflows (OPTIONAL: Step Functions) - improves payment coordination
- Add X-Ray tracing for distributed tracing (OPTIONAL: X-Ray) - enhances troubleshooting

## Implementation Hints

- Use Route 53 hosted zone for DNS management with simple routing
- Implement DynamoDB with point-in-time recovery enabled for data protection
- Configure Aurora MySQL with automated backtracking to 72 hours for point-in-time recovery
- Deploy Lambda function in VPC with environment variables for configuration
- Use EventBridge for event-driven payment processing workflows
- Implement AWS Backup with daily schedule for Aurora cluster backups
- Configure CloudWatch dashboards for unified monitoring of all services
- Use Systems Manager Parameter Store with secure string parameters for sensitive data
- Set up CloudWatch alarms for proactive monitoring of service health
- Implement proper VPC networking with private subnets across 3 availability zones

## Expected Output
CDKTF Python code that deploys a production-ready single-region high availability infrastructure with automated backups and comprehensive monitoring.

## Complexity Level
Expert

## Subtask Category
Failure Recovery and High Availability > Failure Recovery Automation

## Critical Requirements

### Resource Naming
- ALL named resources MUST include `environment_suffix` variable
- Example: `f"payment-processor-{environment_suffix}"`

### Destroyability
- NO Retain deletion policies
- Set `skip_final_snapshot=True` for RDS resources
- Ensure all resources can be cleanly destroyed

### Single-Region Considerations
- All resources deployed in us-east-1 region
- VPC spans 3 availability zones for high availability
- Aurora backtracking provides point-in-time recovery within the region
- DynamoDB point-in-time recovery enables data restoration
