# AWS CDK Same-Region Multi-VPC Aurora High Availability Implementation

## Role
You are an AWS Solutions Architect specializing in TypeScript CDK implementations for high availability database systems within a single AWS region.

## Task
Design and implement a same-region, multi-VPC Aurora PostgreSQL cluster setup with automated health monitoring and failover capabilities for a financial services application. The solution should provide high availability within the us-east-1 region.

## Context

### Business Requirements
- Financial services transaction processing system
- High availability within a single region
- Automated health monitoring and alerting
- Quick failover between clusters

### Technical Specifications
- **Region:** us-east-1 (both VPCs)
- **Database:** Aurora PostgreSQL (two separate clusters)
- **Instance Class:** r6g.xlarge
- **Backup Retention:** 35 days
- **Monitoring Interval:** 1 second
- **VPC CIDR:** 10.0.0.0/16 (for both VPCs)
- **Database Name:** financial_transactions
- **Master Username:** dbadmin

### Required AWS Services
- Two VPCs in us-east-1 (Primary and Secondary)
- Two Aurora PostgreSQL clusters (one per VPC)
- Lambda functions (health check and failover orchestration)
- CloudWatch (metrics, alarms, dashboards)
- EventBridge (health event monitoring)
- SNS (alerting)
- Route 53 Health Checks

### CDK Configuration
- **CDK Version:** 2.x
- **Node Version:** >=14.x
- **Language:** TypeScript

## Implementation Requirements

### VPC Architecture
Create two isolated VPCs in us-east-1:
1. Primary VPC with 3 AZs
2. Secondary VPC with 3 AZs
3. Each VPC with public, private, and isolated subnets
4. VPC Flow Logs enabled
5. Security groups restricting PostgreSQL traffic to VPC CIDR

### Aurora Cluster Configuration
Create two independent Aurora clusters:
1. Primary cluster with 2 reader instances
2. Secondary cluster with 1 reader instance
3. Both using Aurora PostgreSQL 15.4
4. Performance Insights enabled with long-term retention
5. Enhanced monitoring with 1-second intervals
6. Deletion protection based on environment
7. CloudWatch log exports enabled

### Lambda Functions
Implement two Lambda functions:

1. **Health Check Function:**
   - Scheduled execution every 1 minute
   - Checks status of both clusters
   - Publishes custom CloudWatch metrics
   - Environment variables for cluster identifiers

2. **Failover Orchestrator Function:**
   - Triggered by EventBridge rules
   - Performs failover operations
   - Measures and reports RTO
   - Sends SNS notifications
   - Handles errors gracefully

### Monitoring and Alerting
Include:
- CloudWatch alarms for CPU utilization (80% threshold)
- Database connection alarms (500 connections threshold)
- Primary cluster failure detection
- SNS topic for alert distribution
- Email subscriptions for ops team
- CloudWatch dashboards for both regions

### EventBridge Integration
Create rules for:
- RDS cluster failure events
- CloudWatch alarm state changes
- Scheduled health checks

### Route 53 Health Checks
Configure:
- HTTPS health checks for both cluster endpoints
- 30-second request interval
- 3-failure threshold
- Resource path: /health

## Output Requirements

Generate code for these three files:

### 1. lib/tap-stack.ts
- Complete CDK stack implementation
- Two VPC creation with proper subnet configuration
- Two Aurora cluster definitions
- Lambda function implementations (inline code)
- CloudWatch alarms and dashboards
- EventBridge rules
- SNS topic with email subscription
- Route 53 health checks
- CloudFormation outputs
- File system operations to save outputs to JSON

### 2. test/tap-stack.unit.test.ts
- Unit tests using Jest and AWS CDK assertions
- Test VPC creation and configuration
- Verify Aurora cluster settings
- Validate Lambda function configuration
- Check CloudWatch alarms
- Verify EventBridge rules
- Test SNS topic setup
- Validate security group rules
- Check deletion protection logic
- Minimum 90% branch coverage

### 3. test/tap-stack.int.test.ts
- Integration tests reading from actual deployment outputs
- Load outputs from cfn-outputs/flat-outputs.json
- Test actual AWS resources using AWS SDK v3
- Verify both clusters are available
- Check VPC configuration
- Validate Lambda functions exist and can be invoked
- Test SNS topic and subscriptions
- Verify CloudWatch alarms
- Check Route 53 health checks
- End-to-end infrastructure health validation

## Constraints
- Use inline Lambda code for simplicity
- Both VPCs must be in the same region (us-east-1)
- No Secrets Manager (use direct password configuration)
- No Aurora Global Database
- No Route 53 Application Recovery Controller
- No cross-region replication
- Environment-based deletion protection
- Write deployment outputs to cfn-outputs/flat-outputs.json

## Code Quality Standards
- TypeScript with proper typing
- ESLint compliant
- Descriptive variable names
- Private methods for each major component
- Comprehensive inline comments
- Integration tests use real AWS API calls
- Console logging for test visibility

## Deliverable
Generate complete, working code for all three files with implementation matching these exact specifications for a same-region, multi-VPC Aurora setup.