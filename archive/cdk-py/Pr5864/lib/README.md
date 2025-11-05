# Payment Processing System - Production Migration

This CDK application deploys a complete payment processing infrastructure with enhanced security controls for migrating from development to production.

## Architecture Overview

The infrastructure is organized into separate layers:

1. **Networking Layer**: VPC with 3 AZs, public and private subnets, NAT gateways
2. **Security Layer**: Customer-managed KMS keys for RDS and S3 encryption
3. **Data Layer**: RDS PostgreSQL, DynamoDB, S3, SQS
4. **Compute Layer**: 3 Lambda functions (validator, processor, audit-logger)
5. **API Layer**: API Gateway with request throttling and API key authentication
6. **Monitoring Layer**: CloudWatch dashboard and SNS alerts

## Prerequisites

- AWS CLI configured with appropriate credentials
- Python 3.8 or higher
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Node.js 14.x or higher

## Installation

1. Create a virtual environment:
```bash
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Bootstrap CDK (first time only):
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1
```

## Configuration

Set the environment suffix (default is 'dev'):
```bash
export ENVIRONMENT_SUFFIX=prod
```

Or pass via CDK context:
```bash
cdk deploy --context environmentSuffix=prod
```

## Deployment

1. Synthesize CloudFormation template:
```bash
cdk synth
```

2. Deploy the stack:
```bash
cdk deploy --context environmentSuffix=prod
```

3. Confirm the deployment when prompted.

## Stack Outputs

After deployment, the following outputs will be available:

- **APIEndpoint**: API Gateway base URL
- **VPCId**: VPC identifier
- **RDSEndpoint**: PostgreSQL database endpoint
- **DynamoDBTable**: Transaction table name
- **S3AuditBucket**: Audit logs bucket name
- **SQSRetryQueue**: Retry queue URL
- **SNSAlertTopic**: Alert topic ARN

## API Usage

The API requires an API key for authentication. Retrieve it from AWS Console (API Gateway > API Keys).

### Endpoints

1. **POST /validate**: Validate payment request
```bash
curl -X POST https://API_ENDPOINT/prod/validate \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_123",
    "amount": 100.00,
    "currency": "USD",
    "customer_id": "cust_456"
  }'
```

2. **POST /process**: Process validated payment
```bash
curl -X POST https://API_ENDPOINT/prod/process \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "txn_123"
  }'
```

3. **GET /status**: Get system status
```bash
curl https://API_ENDPOINT/prod/status \
  -H "x-api-key: YOUR_API_KEY"
```

## Monitoring

### CloudWatch Dashboard

Access the dashboard: CloudWatch > Dashboards > payment-dashboard-{suffix}

Metrics displayed:
- API Gateway latency
- Lambda function errors
- RDS CPU utilization

### Alarms

Three CloudWatch alarms are configured:
- API 4XX errors > 50 in 10 minutes
- Lambda errors > 10 in 10 minutes
- RDS CPU > 80% for 15 minutes

Alerts are sent to: ops@company.com (confirm subscription)

## Security Features

- All RDS storage encrypted with customer-managed KMS keys
- S3 buckets with versioning and encryption enabled
- API Gateway requires API keys and implements throttling
- Lambda functions use reserved concurrency
- DynamoDB has point-in-time recovery enabled
- VPC with no default security group rules
- IAM roles follow least-privilege principle
- All public access to S3 blocked

## Cost Optimization

- Lambda reserved concurrency prevents over-provisioning
- S3 lifecycle policy transitions to Glacier after 90 days
- DynamoDB uses on-demand pricing
- Multi-AZ RDS for high availability

## Compliance

- Audit logs retained in S3 with lifecycle management
- CloudWatch logs retained for 90 days
- RDS automated backups for 30 days
- SQS message retention for 14 days
- Point-in-time recovery for DynamoDB

## Cleanup

To remove all resources:
```bash
cdk destroy --context environmentSuffix=prod
```

**Warning**: This will delete all data. Ensure backups are taken before destroying.

## Troubleshooting

### Lambda VPC Connection Issues
- Verify NAT gateways are running
- Check security group rules
- Ensure Lambda has VPC execution permissions

### RDS Connection Issues
- Verify security group allows Lambda SG on port 5432
- Check RDS is in available state
- Verify Lambda has secret access permissions

### API Gateway 403 Errors
- Verify API key is correct
- Check usage plan limits
- Ensure API key is added to usage plan

## Support

For issues and questions:
- Team: platform-engineering
- Email: ops@company.com
- Cost Center: fintech-payments
