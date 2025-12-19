# VPC Peering with Network Monitoring

Hey, I need you to build out a Terraform setup for connecting two VPCs securely. We're dealing with about 10,000 internal requests per day, so we need solid monitoring and alerting in place.

## What We Need

### The VPC Setup
Set up two VPCs - let's call them VPC-A (10.0.0.0/16) and VPC-B (10.1.0.0/16). For each one:
- Add public subnets at x.0.1.0/24 and x.0.2.0/24
- Add private subnets at x.0.10.0/24 and x.0.11.0/24
- Spread these across two availability zones
- Throw in Internet Gateways and NAT Gateways (one per AZ)
- Set up the route tables properly
- Make sure DNS hostnames and DNS support are enabled

### Peering Connection
Connect VPC-A and VPC-B with a peering connection. Since they're in the same account, set auto_accept to true. Turn on DNS resolution (allow_remote_vpc_dns_resolution = true) on both the requester and accepter sides.

### Routing
Update the route tables in both VPCs so they can talk to each other. Add routes for the peered VPC CIDR blocks that point to the peering connection. Hit both the public and private subnet route tables. Use for_each or count to keep things clean when handling multiple route tables.

### Security Groups
Create security groups for each VPC:
- VPC-A: let traffic in from 10.1.0.0/16 on ports 443 and 8080 (make allowed_ports a variable)
- VPC-B: let traffic in from 10.0.0.0/16 on ports 443 and 3306
- For egress, only allow outbound to the peered VPC CIDR on the ports we actually need
- Tag everything with descriptions explaining the peering setup

### Flow Logs
Turn on VPC Flow Logs for both VPCs and send them to CloudWatch Logs:
- Log groups: /aws/vpc/flowlogs/vpc-a and /aws/vpc/flowlogs/vpc-b
- Keep logs for 30 days (make retention_days a variable)
- Capture ALL traffic (both accepted and rejected)
- Create an IAM role so Flow Logs can write to CloudWatch

### Monitoring & Alerts
Set up CloudWatch metric filters on the Flow Logs to track:
- Total traffic volume (just count the log entries)
- Rejected connections (where action = REJECT)
- Traffic hitting unexpected ports
- Traffic coming from outside our peered CIDR ranges

Create alarms for these metrics with configurable thresholds (variables: traffic_volume_threshold, rejected_connections_threshold). Send alerts to an SNS topic.

### Lambda for Traffic Analysis
Build a Python 3.12 Lambda function that runs every hour via EventBridge. It should:
- Use the CloudWatch Logs Insights API to pull VPC Flow Logs from the last hour
- Calculate: total requests, requests per source IP, rejected connections, and traffic breakdown by port
- Look for anomalies like traffic spikes over 20% above baseline (make anomaly_threshold_percent a variable), unexpected source IPs, or weird port usage
- Push findings to CloudWatch custom metrics (use namespace: Company/VPCPeering) and the SNS topic
- Environment variables needed: VPC_A_LOG_GROUP, VPC_B_LOG_GROUP, TRAFFIC_BASELINE (requests per hour), SNS_TOPIC_ARN, ALLOWED_PORTS

Give the Lambda an IAM role with these permissions:
- logs:StartQuery, logs:GetQueryResults, logs:DescribeLogGroups
- cloudwatch:PutMetricData
- sns:Publish
- logs:CreateLogGroup, CreateLogStream, PutLogEvents (for the Lambda's own logs)

### EventBridge Scheduling
Create a scheduled rule that runs every hour (rate(1 hour)) or use a configurable cron expression (lambda_schedule variable). Make sure Lambda has permission to be invoked by EventBridge.

### SNS Notifications
Set up an SNS topic for all our alerts with an email subscription (alert_email variable). Configure the topic policy so CloudWatch Alarms and Lambda can publish to it.

### Dashboard (Optional)
Create a CloudWatch dashboard (make create_dashboard a variable, default to true) that shows:
- VPC peering connection status
- Traffic volume graphs for both VPCs
- Rejected connections over time
- Top source IPs by request count
- Lambda execution metrics

### Tags & Outputs
Tag everything consistently: Environment, VPC, Owner, ManagedBy=Terraform, Project=VPCPeering.

Output the important stuff: VPC IDs, VPC CIDRs, peering connection ID, security group IDs, CloudWatch log group names, Lambda function ARN, SNS topic ARN, and dashboard URL.

## Files to Create

Break this up into these separate files:

1. **versions.tf** - Terraform >= 1.5, AWS provider >= 5.0
2. **providers.tf** - AWS provider with region variable
3. **variables.tf** - All the inputs (region, vpc_a_cidr, vpc_b_cidr, allowed_ports, retention_days, traffic_volume_threshold, rejected_connections_threshold, anomaly_threshold_percent, traffic_baseline, lambda_schedule, alert_email, create_dashboard)
4. **vpcs.tf** - Both VPCs with all their subnets, gateways, and route tables
5. **peering.tf** - The VPC peering connection with DNS options
6. **routes.tf** - Route table updates for peering in both VPCs
7. **security-groups.tf** - Security groups and rules for both VPCs
8. **flow-logs.tf** - VPC Flow Logs, CloudWatch log groups, and IAM role
9. **monitoring.tf** - Metric filters, alarms, SNS topic/subscription, and dashboard
10. **lambda.tf** - Lambda function, IAM role/policy, EventBridge rule, permissions, and archive_file for packaging
11. **lambda/traffic_analyzer.py** - Python code for querying logs, detecting anomalies, and publishing metrics
12. **outputs.tf** - All the outputs listed above
13. **README.md** - Usage instructions, variable descriptions, how to read alerts, sample CloudWatch Logs Insights queries, and troubleshooting tips

## Keep in Mind

- Use the Terraform archive provider to package the Lambda code
- Base the default thresholds on our 10k daily requests (roughly 417 requests/hour)
- Set allowed_ports as a list variable with default ["443", "8080", "3306"]
- Include an example tfvars file showing a production config
- Add validation blocks to make sure CIDRs don't overlap and port ranges are valid
- Mark sensitive outputs (like alert_email) appropriately
- Use data sources where needed to avoid circular dependencies
- Just give me the code files as code blocks, no extra explanations needed
