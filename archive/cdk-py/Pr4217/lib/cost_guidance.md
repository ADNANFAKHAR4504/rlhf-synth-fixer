COST OPTIMIZATION STRATEGY:

1. DynamoDB (Estimated: $5-15/month for 30k events/day):
   - On-demand billing: Pay only for actual reads/writes
   - No provisioned capacity reduces idle costs
   - TTL automatically deletes old data (90 days) to control storage
   - Point-in-time recovery: ~$0.20/GB/month (opt for critical data)

2. SQS (Estimated: $0.50-2/month):
   - Standard queue: $0.40 per million requests
   - Long polling (20s) reduces empty receive API calls by 99%
   - 4-day retention balances reliability vs cost
   - DLQ adds minimal cost but crucial for reliability

3. Lambda (Estimated: $5-20/month):
   - Reserved concurrency of 5 prevents runaway costs
   - 512MB memory balances performance and cost
   - 60s timeout allows complex processing without waste
   - Free tier: 1M requests + 400K GB-seconds/month

4. EventBridge (Estimated: $1-3/month):
   - $1.00 per million events
   - 30k events/day = ~900k/month = ~$0.90
   - Archive adds $0.023/GB/month (optional for compliance)

5. CloudWatch (Estimated: $3-10/month):
   - Dashboards: $3/month each
   - Alarms: $0.10/alarm/month
   - Logs: $0.50/GB ingested, $0.03/GB stored
   - 30-day retention keeps costs reasonable

Total Estimated Monthly Cost: $15-50 (depending on actual usage)

RELIABILITY FEATURES:

1. Idempotent Processing:
   - Lambda uses conditional DynamoDB writes
   - Prevents duplicate processing of same event
   - Safe for retries and replays

2. Error Handling:
   - DLQ captures failed messages after 3 attempts
   - Partial batch failures prevent reprocessing successful messages
   - All errors logged to DynamoDB for analysis

3. Monitoring & Alerting:
   - Real-time dashboards for operational visibility
   - Proactive alarms on queue depth, errors, throttles
   - Automatic notifications for immediate response

4. Scalability:
   - SQS buffers spikes up to 10x normal load
   - Lambda auto-scales with queue depth (up to reserved limit)
   - DynamoDB on-demand handles variable throughput

5. Data Durability:
   - DynamoDB point-in-time recovery (restore to any second in 35 days)
   - SQS message replication across multiple AZs
   - EventBridge archive for event replay (7 days)

6. Observability:
   - X-Ray tracing enabled on Lambda
   - CloudWatch Logs with structured logging
   - Metrics for end-to-end pipeline visibility

SCALING CONSIDERATIONS:

Current: 30,000 events/day (~21 events/minute)

- Lambda concurrency: 5 reserved (handles spikes to ~300 events/min)
- SQS: Unlimited throughput, can handle 10x spikes easily
- DynamoDB: On-demand scales automatically

To scale to 300,000 events/day:

- Increase Lambda reserved concurrency to 10-20
- Consider DynamoDB provisioned capacity with auto-scaling
- Enable enhanced monitoring for detailed metrics
- Add more granular alarms for higher throughput

To scale to 3,000,000 events/day:

- Use Lambda reserved concurrency 50-100
- Switch DynamoDB to provisioned with auto-scaling (2000+ RCU/WCU)
- Consider SQS FIFO if ordering required (300 TPS limit)
- Implement batch processing in Lambda (larger batch sizes)
- Add DynamoDB DAX for read-heavy workloads

DEPLOYMENT INSTRUCTIONS:

1. Install dependencies:
   pip install aws-cdk-lib constructs

2. Bootstrap CDK (first time only):
   cdk bootstrap aws://ACCOUNT-ID/REGION

3. Synthesize CloudFormation:
   cdk synth

4. Deploy with environment suffix:
   cdk deploy -c environmentSuffix=prod

   # or

   cdk deploy --parameters EnvironmentSuffix=prod

5. Test the pipeline:
   aws events put-events --entries file://sample-event.json

Sample event (sample-event.json):
{
"Entries": [
{
"Source": "shipment.service",
"DetailType": "shipment.created",
"Detail": "{\"shipment_id\":\"SHP-12345\",\"event_timestamp\":\"2025-10-13T10:30:00Z\",\"event_type\":\"created\",\"event_data\":{\"origin\":\"NYC\",\"destination\":\"LAX\",\"carrier\":\"FedEx\"}}",
"EventBusName": "shipment-events-prod"
}
]
}

6. Monitor the pipeline:
   - Check CloudWatch Dashboard (see output URL)
   - View Lambda logs: aws logs tail /aws/lambda/shipment-event-processor-prod
   - Query DynamoDB: aws dynamodb scan --table-name shipment-events-prod

7. Handle DLQ messages:
   aws sqs receive-message --queue-url <DLQ_URL>
   # Investigate, fix issue, then redrive to main queue

OPERATIONAL RUNBOOK:

Issue: High Queue Depth Alarm

- Check Lambda errors in CloudWatch Logs
- Verify DynamoDB throttling metrics
- Temporarily increase Lambda concurrency if needed
- Review event payload sizes (large payloads slow processing)

Issue: Messages in DLQ

- Receive message from DLQ to investigate
- Check error_message in DynamoDB for failed records
- Fix data validation or processing logic
- Redrive messages from DLQ after fix

Issue: High Lambda Error Rate

- Check CloudWatch Logs for error patterns
- Verify DynamoDB table exists and accessible
- Check IAM permissions for Lambda role
- Review event schema validation logic

Issue: Lambda Throttles

- Increase reserved concurrency (cost impact)
- Or reduce SQS batch size to slow ingestion
- Check account Lambda concurrency limits

SECURITY BEST PRACTICES:

1. IAM Least Privilege:
   - Lambda role has only necessary permissions
   - No wildcard (\*) actions in policies
   - Resource-specific ARNs in policies

2. Encryption:
   - Enable SQS encryption at rest (KMS)
   - Enable DynamoDB encryption at rest (default)
   - Use VPC endpoints for private connectivity

3. Network Isolation:
   - Deploy Lambda in VPC for private resources
   - Use VPC endpoints for AWS services
   - Implement security groups and NACLs

4. Audit & Compliance:
   - Enable CloudTrail for API logging
   - EventBridge archive for event replay/audit
   - DynamoDB streams for change data capture

TROUBLESHOOTING:

Q: Events not appearing in DynamoDB?
A: Check Lambda CloudWatch Logs, verify SQS trigger configured, test Lambda manually

Q: High costs unexpectedly?
A: Review CloudWatch metrics, check for retry loops, verify TTL working, check Lambda concurrency

Q: Processing too slow?
A: Increase Lambda concurrency, batch size, or memory; check DynamoDB throttling

Q: Duplicate events in DynamoDB?
A: Should not happen due to idempotent writes; verify shipment_id + event_timestamp uniqueness
"""
