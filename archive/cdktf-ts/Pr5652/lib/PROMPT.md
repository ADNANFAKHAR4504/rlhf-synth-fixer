You are an expert DevOps engineer specializing in high availability and disaster recovery automation.
Your task is to design and implement a Multi-AZ Failure Recovery System in AWS using CDKTF (TypeScript).
The system should:

- Automatically detect application or infrastructure failures via CloudWatch alarms.
- Use EventBridge rules to trigger a Lambda function that executes recovery workflows (e.g., replace unhealthy instances, re-register targets, or rebuild resources).
- Use Auto Scaling Groups across us-east-1a, us-east-1b, and us-east-1c for redundancy.
- Store and maintain application state in DynamoDB during failover.
- Ensure Recovery Time Objective (RTO) < 5 minutes.
  Configuration details:

```json
{
  "app_config": {
    "healthcheck_endpoint": "/health",
    "min_healthy_instances": 2,
    "max_retry_attempts": 3,
    "recovery_timeout_seconds": 300
  },
  "infrastructure_config": {
    "vpc_cidr": "10.0.0.0/16",
    "availability_zones": ["us-east-1a", "us-east-1b", "us-east-1c"],
    "instance_types": ["t3.medium"]
  }
}
```

Focus on:

- Simplicity and stability (avoid unnecessary complexity).
- Use CloudWatch metrics + Lambda recovery logic to meet the 5-minute RTO.
- Include clear comments and logical resource separation (VPC, ALB, ASG, Monitoring, Recovery Automation).
  Output a single CDKTF TypeScript file (`main.ts`) that includes all resources and outputs