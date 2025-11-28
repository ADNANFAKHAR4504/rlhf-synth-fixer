# Multi-Region Disaster Recovery Infrastructure - Implementation

This document describes the complete implementation of a production-ready multi-region disaster recovery infrastructure using Pulumi TypeScript across AWS regions us-east-1 (primary) and us-west-2 (secondary).

## Architecture Overview

The infrastructure implements a comprehensive DR strategy with:
- Dual-region VPC networks with cross-region peering
- Aurora Serverless v2 PostgreSQL clusters in both regions (regional, not global)
- DynamoDB Global Tables for automatic cross-region replication
- Lambda functions for data processing in both regions
- EventBridge for scheduled invocations
- Route 53 with health checks and failover routing
- CloudWatch monitoring and SNS alerting
- VPC connectivity for private resource access

## Implementation Files

### 1. Main Orchestration: `tap-stack.ts`

The main stack orchestrates all components across both regions:

```typescript
// See tap-stack.ts for complete implementation
export class TapStack extends pulumi.ComponentResource {
  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    // Creates providers for both regions
    // Deploys VPC, Aurora, DynamoDB, Lambda, EventBridge, monitoring in each region
    // Sets up Route 53 for failover
    // Establishes VPC peering between regions
  }
}
```

**Key Features:**
- Multi-region AWS provider configuration
- Component-based resource organization
- Comprehensive output exports for testing
- VPC peering for cross-region connectivity

### 2. Network Infrastructure: `vpc-stack.ts`

Creates complete VPC infrastructure in each region:

```typescript
export class VpcStack extends pulumi.ComponentResource {
  // Creates VPC with 10.0.0.0/16 CIDR
  // 3 public subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24)
  // 3 private subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24)
  // Internet Gateway for public access
  // NAT Gateways in each AZ for private subnet egress
  // Security groups for Lambda and Aurora communication
}
```

**Components:**
- VPC with DNS support enabled
- Public/private subnet distribution across 3 AZs
- Internet Gateway with public routing
- NAT Gateways for private subnet internet access
- Security group allowing PostgreSQL (5432) within VPC

### 3. Database Layer: `aurora-stack.ts`

Regional Aurora Serverless v2 PostgreSQL clusters:

```typescript
export class AuroraStack extends pulumi.ComponentResource {
  // Aurora Serverless v2 with PostgreSQL 15.4
  // Serverless scaling: 0.5 - 1 ACU
  // 7-day backup retention
  // CloudWatch logs enabled
  // Secrets Manager for password storage
}
```

**Features:**
- Engine: aurora-postgresql, mode: provisioned (Serverless v2)
- Database name: drapp
- Master user: dbadmin
- Automatic backups with 7-day retention
- Private subnet deployment
- Instance class: db.serverless

**Important:** Uses regional clusters instead of Aurora Global Database to avoid engine version compatibility issues.

### 4. NoSQL Replication: `dynamodb-stack.ts`

DynamoDB Global Table with automatic replication:

```typescript
export class DynamoDBStack extends pulumi.ComponentResource {
  // Global table with replicas in us-east-1 and us-west-2
  // Schema: id (S, hash key), timestamp (N, range key)
  // Provisioned: 5 RCU/WCU per region
  // Streams enabled for CDC
  // Point-in-time recovery enabled
}
```

**Configuration:**
- Billing mode: PROVISIONED
- Stream: NEW_AND_OLD_IMAGES
- Automatic replica creation in secondary region
- Tags propagation to replicas

### 5. Compute Layer: `lambda-stack.ts`

Lambda functions with VPC connectivity:

```typescript
export class LambdaStack extends pulumi.ComponentResource {
  // Node.js 20 runtime
  // VPC-connected for Aurora access
  // Environment variables for DB and DynamoDB endpoints
  // IAM roles with DynamoDB and VPC permissions
  // CloudWatch logging with 7-day retention
}
```

**Function Configuration:**
- Runtime: nodejs20.x
- Memory: 512 MB
- Timeout: 30 seconds
- VPC: Connected to private subnets
- Environment: DB_ENDPOINT, DYNAMODB_TABLE, AWS_REGION_NAME

**IAM Permissions:**
- AWSLambdaBasicExecutionRole
- AWSLambdaVPCAccessExecutionRole
- DynamoDB: PutItem, GetItem, UpdateItem, Query, Scan

### 6. Event Processing: `eventbridge-stack.ts`

Scheduled EventBridge rules:

```typescript
export class EventBridgeStack extends pulumi.ComponentResource {
  // Scheduled rule: rate(5 minutes)
  // Lambda target configuration
  // Automatic permission granting
}
```

**Configuration:**
- Schedule expression: rate(5 minutes)
- Target: Lambda function in same region
- Lambda permission for EventBridge invocation

### 7. Monitoring & Alerting: `monitoring-stack.ts`

CloudWatch alarms and SNS notifications:

```typescript
export class MonitoringStack extends pulumi.ComponentResource {
  // SNS topic for alerts
  // Lambda error alarm (threshold: 5 errors)
  // Lambda duration alarm (threshold: 25 seconds)
  // Aurora CPU alarm (threshold: 80%)
  // Aurora connections alarm (threshold: 100)
}
```

**Alarms:**
- Lambda Errors: > 5 in 5 minutes
- Lambda Duration: Average > 25 seconds
- Aurora CPU: Average > 80%
- Aurora Connections: Average > 100

**Notifications:**
- SNS topic with email subscription
- All alarms publish to SNS

### 8. DNS Failover: `route53-stack.ts`

Route 53 with health checks and failover:

```typescript
export class Route53Stack extends pulumi.ComponentResource {
  // Hosted zone: dr-app-{env}.example.com
  // Health checks for primary and secondary
  // Failover records (PRIMARY/SECONDARY)
  // CNAME records to Aurora endpoints
}
```

**Failover Configuration:**
- Primary record pointing to us-east-1 Aurora
- Secondary record pointing to us-west-2 Aurora
- Health checks for both regions
- TTL: 60 seconds for fast failover

## Deployment Architecture

### Primary Region (us-east-1)
- Complete VPC with public/private subnets
- Aurora Serverless v2 cluster with 1 instance
- DynamoDB table (primary)
- Lambda function with EventBridge trigger
- CloudWatch alarms and SNS topic
- Route 53 primary endpoint

### Secondary Region (us-west-2)
- Complete VPC with public/private subnets
- Aurora Serverless v2 cluster with 1 instance
- DynamoDB replica
- Lambda function with EventBridge trigger
- CloudWatch alarms and SNS topic
- Route 53 secondary endpoint

### Cross-Region Components
- VPC Peering: us-east-1 ↔ us-west-2
- DynamoDB Global Table replication
- Route 53 failover routing

## Outputs Exported

All infrastructure outputs are exported for testing:

**Primary Region:**
- primaryVpcId
- primaryPublicSubnetIds
- primaryPrivateSubnetIds
- primaryAuroraEndpoint
- primaryAuroraReaderEndpoint
- primaryLambdaArn
- primaryLambdaName
- primaryEventBridgeRuleArn
- primarySnsTopicArn

**Secondary Region:**
- secondaryVpcId
- secondaryPublicSubnetIds
- secondaryPrivateSubnetIds
- secondaryAuroraEndpoint
- secondaryAuroraReaderEndpoint
- secondaryLambdaArn
- secondaryLambdaName
- secondaryEventBridgeRuleArn
- secondarySnsTopicArn

**Global Resources:**
- dynamoDbTableName
- dynamoDbTableArn
- route53ZoneId
- route53NameServers
- vpcPeeringConnectionId

## Disaster Recovery Strategy

### Backup Strategy
1. **Aurora:**
   - Automated backups: 7-day retention
   - Backup window: 03:00-04:00 UTC
   - Point-in-time recovery available
   - Manual cross-region snapshots recommended

2. **DynamoDB:**
   - Continuous backups with point-in-time recovery
   - Automatic cross-region replication via Global Tables
   - Stream-based CDC for application integration

### Failover Strategy
1. **DNS-Based Failover:**
   - Route 53 health checks monitor primary region
   - Automatic failover to secondary on health check failure
   - 60-second TTL for fast propagation

2. **Database Failover:**
   - Aurora: Manual restore from backup to secondary region
   - DynamoDB: Automatic active-active replication
   - Application reconnection via environment variables

3. **Application Failover:**
   - Lambda functions active in both regions
   - EventBridge schedules independent per region
   - Can be traffic-shifted via DNS

## Security Considerations

1. **Network Security:**
   - Private subnets for databases and compute
   - Security groups with least privilege
   - No public database exposure

2. **IAM Security:**
   - Separate roles per function
   - Least privilege permissions
   - No wildcard resource ARNs in production

3. **Data Security:**
   - Secrets Manager for database credentials
   - Encrypted Aurora storage (default)
   - DynamoDB encryption at rest (default)

## Cost Optimization

1. **Aurora Serverless v2:**
   - Scales to 0.5 ACU minimum
   - Only pay for actual capacity used
   - Cost-effective for variable workloads

2. **Lambda:**
   - Pay per invocation
   - 512 MB memory optimized for cost/performance
   - VPC ENI caching for faster cold starts

3. **DynamoDB:**
   - Provisioned capacity at minimum (5 RCU/WCU)
   - Consider on-demand for unpredictable workloads

4. **NAT Gateways:**
   - Most expensive component (~$100/month per region)
   - Consider NAT instances for cost savings in dev
   - Production requires HA NAT Gateways

## Testing Strategy

See unit tests in `test/tap-stack.test.ts` and integration tests in `test/tap-stack.integration.test.ts` for:
- Resource existence validation
- Configuration verification
- Cross-region connectivity tests
- Failover scenario testing

## Production Readiness Checklist

- ✅ Multi-region deployment
- ✅ Automated backups configured
- ✅ Monitoring and alerting setup
- ✅ Security groups configured
- ✅ IAM roles with least privilege
- ✅ VPC peering established
- ✅ Health checks configured
- ✅ Failover routing active
- ⚠️  Manual: Update Route 53 email subscription
- ⚠️  Manual: Test failover procedures
- ⚠️  Manual: Document RTO/RPO requirements