# Trading Platform Disaster Recovery Solution

This CDKTF TypeScript application implements a production-ready multi-region disaster recovery solution for a financial services trading platform.

## Architecture

### Multi-Region Setup

- **Primary Region**: us-east-1
- **Secondary Region**: us-east-2
- **Failover Time**: < 60 seconds (RTO)
- **Data Loss**: Zero (RPO = 0)
- **Uptime SLA**: 99.99%

### Components

#### 1. Route 53 DNS Failover
- Hosted zone with health checks for both regions
- Automatic DNS failover based on health check status
- Health check monitoring every 30 seconds

#### 2. Aurora PostgreSQL Global Database
- Primary writer cluster in us-east-1
- Secondary read replica in us-east-2
- Automatic replication with < 1 second lag
- Serverless v2 for cost optimization

#### 3. Lambda Functions
- Trade processor functions in both regions
- Process orders from SQS queues
- Store audit logs in S3
- Update session state in DynamoDB global table

#### 4. DynamoDB Global Tables
- User session data replicated across regions
- Point-in-time recovery enabled
- Active-active replication

#### 5. S3 Cross-Region Replication
- Application configuration files
- Audit logs
- 15-minute replication time

#### 6. CloudWatch Monitoring
- RDS replication lag alarms
- Lambda error rate monitoring
- API Gateway latency tracking
- Cross-region alarm aggregation

#### 7. Step Functions Failover Orchestration
- Automated failover process
- RDS cluster promotion
- Route 53 record updates
- Validation and notification

#### 8. API Gateway
- REST APIs in both regions
- Health check endpoints
- Regional endpoints with failover

#### 9. EventBridge Cross-Region Events
- Forward critical events between regions
- Trigger failover on alarms

#### 10. Automated Failover Validation
- Hourly validation of failover readiness
- CloudWatch metrics publication
- Health status reporting

## Deployment

### Prerequisites

- Node.js 18+
- AWS CLI configured with credentials
- CDKTF CLI (`npm install -g cdktf-cli`)
- Terraform 1.5+

### Environment Variables
