# Pulumi Implementation Overview

The Pulumi Go program in this branch provisions the entire FedRAMP Moderate data pipeline described in the task. It builds the networking foundation, security controls, data plane, and supporting observability/stewardship resources. Every resource name, tag, and ARN suffix is derived from `ctx.Project()` and `ctx.Stack()` so multiple environments can coexist without clashes.

## What the stack creates

- **Customer-managed KMS key** with yearly rotation, a 7‑day deletion window, and an explicit policy that lets CloudWatch Logs, Secrets Manager, RDS, and other service principals use the key. An alias (`alias/<project>-<stack>-data-key`) is registered for operational convenience.
- **VPC (CIDR 10.0.0.0/16)** with two automatically discovered AZs (`GetAvailabilityZones`). For each AZ the stack creates a public /24 subnet (NAT + endpoints) and a private /24 subnet (ECS + RDS). DNS hostnames/support are enabled and tagging captures project, environment, and compliance metadata.
- **Single NAT gateway** (cost-optimised for non-prod) plus public/private route tables, default routes, and subnet associations so private workloads reach AWS APIs without any public exposure.
- **Security groups**:
  - `*-ecs-tasks-sg` allows Fargate tasks to talk out (0.0.0.0/0) but only accepts traffic from the VPC on port 8080.
  - `*-db-sg` only allows PostgreSQL traffic (5432) from the ECS tasks security group and has no public ingress.
- **Kinesis data stream** with one shard (24‑hour retention) encrypted via the customer key.
- **Secrets Manager secret (`*-db-credentials`)** that stores the randomly generated database username/password along with connection metadata. A `SecretVersion` resource seeds the secret and is encrypted with the same KMS key.
- **RDS PostgreSQL instance** (`postgres 16.3`, `db.t3.micro`, gp3 storage) in the isolated subnets, encrypted with the KMS key, private only, with log exports (`postgresql`, `upgrade`), seven-day backups, and the `*-db-sg` attached.
- **ECS Fargate cluster/service** with Container Insights enabled, a `data-processor` task definition (256 CPU / 512 MiB), AWS Logs driver pointed to a dedicated log group, and environment variables referencing the Kinesis stream and the database secret.
- **IAM roles & policies**:
  - API Gateway integration role allowed to `kinesis:PutRecord(s)`.
  - ECS task execution role with the managed execution policy.
  - ECS task role allowed to read the stream, decrypt via KMS, and read the database secret.
- **API Gateway REST API** with a `/ingest` POST method integrated directly with Kinesis, an IAM auth type, a Kinesis request template, and a `prod` stage. Logging is wired through `aws_api_gateway_account`, a dedicated KMS-encrypted log group, and method settings that enable INFO logs, data trace, and metrics.
- **CloudWatch log groups** for the ECS workload and API Gateway, each encrypted with the customer key.
- **Outputs** exposing VPC/subnet identifiers, Kinesis attributes, RDS details, the database secret ARN, ECS cluster/task definition ARNs, and the API ID/URL/endpoint so integration tests and downstream automation can discover the deployed resources.

## Security & compliance highlights

- **Encryption**: All stateful services (Kinesis, RDS, Secrets Manager, CloudWatch Logs) rely on the same customer KMS key. The key policy explicitly grants `logs.<region>.amazonaws.com`, aligning with CloudWatch Logs requirements.
- **Network isolation**: No resource with data-at-rest receives a public IP. All outbound-only dependencies flow through the NAT gateway. Security groups enforce ECS→RDS access while keeping RDS isolated from the internet.
- **Credential hygiene**: Database credentials are generated at deployment time and stored exclusively in Secrets Manager; they never appear in code, config, or Pulumi state in plaintext.
- **Observability**: ECS uses Container Insights and its own CloudWatch log group. API Gateway access logs are structured JSON and stored in a KMS-encrypted log group. Kinesis uses enhanced metrics, and RDS enables log exports suitable for FedRAMP auditing.
- **Tagging**: Every resource is tagged with Environment, Compliance (FedRAMP-Moderate), and descriptive names so compliance tooling and cost allocation reports can filter easily.

## Operational notes

- The stack derives availability zones dynamically, so it works in any region where two AZs are available.
- Random credentials are produced via helper functions (`generateDBUsername`, `generateDBPassword`) to stay within RDS constraints.
- Deployments tolerate re-runs because all dependent resources (for example, API Gateway stage, log group, IAM roles) are modelled explicitly; no manual ordering is required.
- Outputs are designed to match what the integration suite expects (e.g., `ApiGatewayEndpoint`, `EcsClusterArn`, `DbSecretArn`).
   ```bash
   pulumi stack output
   ```

### Deployment Time Estimates
- VPC and Networking: ~2 minutes
- KMS Key: ~1 minute
- Kinesis Stream: ~1 minute
- RDS PostgreSQL: ~5-10 minutes (database provisioning)
- ECS Cluster and Service: ~3-5 minutes
- API Gateway: ~1 minute
- **Total**: ~15-20 minutes

## Testing the Infrastructure

### 1. Test API Gateway Endpoint

Generate AWS Signature v4 and send a POST request:

```bash
# Get API Gateway URL
API_URL=$(pulumi stack output apiGatewayUrl)

# Send test request (requires AWS credentials and awscurl or similar tool)
aws apigatewayv2 --region us-east-1 test-invoke-method \
  --http-method POST \
  --path /ingest \
  --body '{"citizenId":"12345","name":"Test User","applicationDate":"2025-01-01"}'
```

### 2. Verify Kinesis Stream

```bash
# Get stream name
STREAM_NAME=$(pulumi stack output kinesisStreamName)

# Describe stream
aws kinesis describe-stream --stream-name $STREAM_NAME --region us-east-1
```

### 3. Check ECS Tasks

```bash
# Get cluster name
CLUSTER_NAME=$(pulumi stack output ecsClusterName)

# List running tasks
aws ecs list-tasks --cluster $CLUSTER_NAME --region us-east-1

# View task logs in CloudWatch
aws logs tail /ecs/TapStack-dev --follow --region us-east-1
```

### 4. Verify RDS Connectivity (from ECS task)

Connect to an ECS task and test database connectivity:

```bash
# Get DB secret ARN
SECRET_ARN=$(pulumi stack output dbSecretArn)

# Retrieve credentials (from within ECS task or with appropriate IAM permissions)
aws secretsmanager get-secret-value --secret-id $SECRET_ARN --region us-east-1
```

## Cleanup

To destroy all resources:

```bash
pulumi destroy --yes
```

This will tear down all infrastructure in reverse dependency order.

## Cost Optimization Notes

1. **Single NAT Gateway**: Used one NAT Gateway instead of one per AZ to reduce costs (~$32/month per NAT Gateway)
2. **RDS db.t3.micro**: Small instance size suitable for development/testing
3. **ECS Fargate**: Pay-per-use model, only charged when tasks are running
4. **Kinesis Single Shard**: Minimal shard count for moderate workloads
5. **CloudWatch Logs**: 7-day retention to minimize storage costs

**Estimated Monthly Cost**: ~$50-100 (primarily NAT Gateway, RDS, and ECS runtime)

## Troubleshooting

### Issue: RDS Takes Too Long to Deploy
- **Cause**: PostgreSQL instance provisioning time
- **Solution**: Wait for 5-10 minutes. Consider using Aurora Serverless v2 for faster provisioning.

### Issue: ECS Tasks Failing to Start
- **Cause**: Missing permissions or invalid container image
- **Solution**: Check CloudWatch Logs for task errors. Verify IAM roles have correct permissions.

### Issue: API Gateway Returns 403
- **Cause**: Missing IAM authentication
- **Solution**: Ensure requests include AWS Signature v4 headers. Use AWS SDK or tools like awscurl.

### Issue: Database Connection Refused
- **Cause**: Security group blocking connection or incorrect endpoint
- **Solution**: Verify ECS tasks are in correct subnets and security groups allow traffic.

## Compliance and Best Practices

This implementation follows:
- **FedRAMP Moderate** security controls
- **NIST 800-53** cybersecurity framework
- **AWS Well-Architected Framework** pillars:
  - Security: Encryption, IAM, network isolation
  - Reliability: Multi-AZ deployment, automated backups
  - Performance: Serverless compute, optimized database
  - Cost Optimization: Right-sized resources
  - Operational Excellence: CloudWatch monitoring, Infrastructure as Code

## Future Enhancements

1. **Multi-Region Deployment**: Add replica in second region for disaster recovery
2. **Auto Scaling**: Configure ECS service auto-scaling based on Kinesis metrics
3. **WAF Integration**: Add AWS WAF to API Gateway for enhanced security
4. **Enhanced Monitoring**: Add custom CloudWatch dashboards and alarms
5. **Backup Automation**: Implement automated RDS snapshot lifecycle management
6. **Secret Rotation**: Enable automatic secret rotation in Secrets Manager
7. **VPC Flow Logs**: Enable VPC Flow Logs for network traffic analysis
8. **GuardDuty**: Enable AWS GuardDuty for threat detection
