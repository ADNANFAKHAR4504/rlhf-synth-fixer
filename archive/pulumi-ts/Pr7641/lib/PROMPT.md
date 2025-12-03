# Infrastructure Compliance Monitoring with CI/CD Cost Optimization

## Overview

Build an infrastructure compliance monitoring system using Pulumi with TypeScript that automatically scans EC2 instances for security and policy violations. The system includes a CI/CD pipeline integration with a Python optimization script that scales down development environment resources for cost savings.

## What We Need to Build

Create a complete solution with two components:
1. **Pulumi TypeScript Infrastructure Stack** - Compliance monitoring system
2. **Python Optimization Script** - CI/CD pipeline cost optimization helper

---

## Part 1: Pulumi TypeScript Compliance Monitoring Stack

### Core Requirements

1. **Lambda Compliance Scanner**
   - Deploy a Lambda function that analyzes EC2 instances for compliance violations
   - Check for unencrypted EBS volumes
   - Detect instances with public IP addresses assigned
   - Identify instances missing required tags
   - Runtime: Node.js 18.x
   - Timeout: 300 seconds, Memory: 512 MB

2. **Scheduled Monitoring**
   - Set up CloudWatch Events (EventBridge) to trigger the Lambda function every 6 hours
   - Use schedule expression `rate(6 hours)` for automated execution
   - Configure proper IAM permissions for Lambda invocation

3. **Compliance Metrics**
   - Create CloudWatch custom metrics to track compliance scores
   - Namespace: `InfrastructureCompliance`
   - Metric Name: `ComplianceScore`
   - Track compliance score as a percentage (0-100)

4. **Alert Notifications**
   - Configure SNS topic for compliance violation alerts
   - Set up email subscription for the security team
   - Lambda publishes detailed violation messages to SNS topic

5. **Compliance Dashboard**
   - Implement CloudWatch dashboard showing real-time compliance status
   - Display compliance scores grouped by instance type
   - Include widgets for key metrics

6. **Threshold Alarms**
   - Create CloudWatch alarms that trigger when compliance scores drop below 80%
   - Alarm name pattern: `compliance-score-low-{environmentSuffix}`
   - Send notifications via SNS when threshold is breached

7. **Configurable Environment Variables**
   - `COMPLIANCE_THRESHOLD`: Minimum acceptable compliance score (default: 80)
   - `MIN_REQUIRED_TAGS`: Number of required tags per instance
   - `SNS_TOPIC_ARN`: SNS topic for notifications

8. **Stack Outputs**
   - `lambdaFunctionArn`: Lambda function ARN
   - `snsTopicArn`: SNS topic ARN for integration
   - `dashboardUrl`: CloudWatch dashboard URL
   - `complianceMetricName`: Full metric name (Namespace/MetricName)

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS Lambda** for compliance checking logic (Node.js 18.x runtime)
- Use **Amazon EC2** API for instance and volume inspection
- Use **Amazon CloudWatch** for Events, Metrics, Dashboard, and Alarms
- Use **Amazon SNS** for alert notifications
- Use **AWS IAM** for roles and policies following least privilege principle
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region

---

## Part 2: Python CI/CD Optimization Script

### Purpose

A Python script (`lib/optimize.py`) that runs as part of the CI/CD pipeline to scale down development environment resources for cost optimization.

### Core Optimizations

1. **Aurora Serverless v2 Database**
   - Reduce minCapacity: 2 ACU → 0.5 ACU
   - Reduce maxCapacity: 4 ACU → 1 ACU
   - Reduce backup retention: 14 days → 1 day
   - Estimated savings: ~$130/month

2. **ElastiCache Redis Cluster**
   - Reduce node count: 3 → 2 nodes
   - Maintain Multi-AZ distribution
   - Estimated savings: ~$17/month

3. **ECS Fargate Service**
   - Reduce task count: 3 → 2 tasks
   - Maintain service availability
   - Estimated savings: ~$9/month

### Script Features

- **CLI Arguments**:
  - `--environment, -e`: Environment suffix (default: 'dev')
  - `--region, -r`: AWS region (default: 'us-east-1')
  - `--dry-run`: Preview changes without applying

- **Resource Discovery**: Pattern-based matching for TapStack/StreamFlix resources
- **Waiters**: Proper AWS waiter integration for operation completion
- **Cost Estimation**: Calculate and display estimated monthly savings

### Technical Requirements

- **Language**: Python 3.x
- **Dependencies**: boto3, botocore
- **AWS Services**: RDS (Aurora), ElastiCache, ECS

---

## Security Requirements

### IAM Permissions - Compliance Stack

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeVolumes"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "cloudwatch:PutMetricData",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:*:*:compliance-alerts-*"
    }
  ]
}
```

### IAM Permissions - Optimization Script

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "rds:DescribeDBClusters",
        "rds:ModifyDBCluster"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "elasticache:DescribeReplicationGroups",
        "elasticache:ModifyReplicationGroup",
        "elasticache:DecreaseReplicaCount"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "ecs:ListClusters",
        "ecs:ListServices",
        "ecs:DescribeServices",
        "ecs:UpdateService"
      ],
      "Resource": "*"
    }
  ]
}
```

---

## Deployment Requirements

- All resources must be destroyable (no RETAIN policies)
- Use DELETE/DESTROY removal policies for all resources
- Lambda inline code or proper file bundling
- Test email subscription may require manual confirmation

---

## Success Criteria

### Compliance Stack
- Lambda successfully scans EC2 instances and identifies violations
- Scheduled triggers work consistently every 6 hours
- Dashboard provides clear visibility into compliance status
- SNS notifications sent when violations detected or scores drop

### Optimization Script
- Successfully scales down Aurora, ElastiCache, and ECS resources
- Handles missing resources gracefully
- Provides accurate cost savings estimates
- Dry-run mode works correctly

### Integration Tests
- All stack outputs verified against deployed resources
- Lambda function configuration validated
- SNS topic and subscriptions confirmed
- CloudWatch alarms properly configured

---

## Deliverables

1. **Pulumi TypeScript Stack** (`lib/tap-stack.ts`)
   - Complete compliance monitoring infrastructure
   - All required AWS resources

2. **Python Optimization Script** (`lib/optimize.py`)
   - CI/CD pipeline cost optimization helper
   - CLI with dry-run support

3. **Tests**
   - Unit tests for Pulumi stack
   - Integration tests for deployed resources

4. **Stack Outputs** (in `cfn-outputs/flat-outputs.json`)
   - `lambdaFunctionArn`
   - `snsTopicArn`
   - `dashboardUrl`
   - `complianceMetricName`
