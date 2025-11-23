I need help building a distributed transaction processing system using AWS CDK. We're working with TypeScript and CDK v2, and the goal is to create a multi-region setup that can handle high-volume real-time transactions.

The system needs to process financial transactions across multiple AWS regions, with us-east-1 as the primary region and us-west-2 as a secondary for failover. We're expecting to handle around 100,000 transactions per second at peak, and we need to maintain sub-second latency while ensuring no transactions are lost or duplicated.

Here's what I need:

**DynamoDB Global Tables**
- Set up tables with `transactionId` as the partition key and `timestamp` as the sort key
- Configure them for on-demand billing
- Enable point-in-time recovery
- Turn on streams so we can trigger Lambda functions for change data capture
- Replicate across both regions

**SQS FIFO Queues**
- Create queues with content-based deduplication
- Set visibility timeout to 300 seconds
- Keep messages for 7 days
- Configure dead letter queues with max receive count of 3

**Lambda Functions**
- Use ARM-based Graviton2 processors to keep costs down
- Process messages from SQS and write to DynamoDB with idempotency checks
- Set up a separate Lambda that gets triggered by DynamoDB streams for CDC
- Configure proper IAM roles with least privilege access
- Set up CloudWatch log groups with 30-day retention

**EventBridge**
- Create a custom event bus to route processed transactions
- Use content-based filtering to send events to downstream systems
- Configure dead letter queues with max retry count of 3

**API Gateway**
- Build a REST API with Lambda authorizers
- Require API key authentication
- Throttle at 10,000 requests per second per API key
- Create a POST endpoint at `/transactions` for ingesting transactions
- Set up access logs with 30-day retention

**Monitoring and Alerts**
- CloudWatch alarms for queue depth exceeding 1,000 messages
- Alarms for Lambda error rate above 1%
- A dashboard showing latency, throttles, error rates, and queue metrics

**Infrastructure Details**
- Use VPC endpoints for DynamoDB and SQS to reduce latency
- Set up Route 53 health checks on API Gateway endpoints (check every 30 seconds)
- Configure automatic failover to the secondary region if health checks fail

**Outputs Needed**
- API Gateway endpoint URLs for both regions
- DynamoDB Global Table ARNs
- CloudWatch dashboard URL

I need two files:
- `main.ts` - Entry point that initializes the CDK app for both regions
- `tapstack.ts` - The full stack implementation with all the resources wired together

Please make sure everything is properly connected - API Gateway should send to SQS, SQS triggers Lambda, Lambda writes to DynamoDB, DynamoDB streams trigger CDC Lambda, and EventBridge routes events downstream. Include inline comments to mark the key sections.
