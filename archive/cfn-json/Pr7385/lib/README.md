# Aurora Global Database Multi-Region Deployment

This CloudFormation solution deploys a highly available Aurora MySQL Global Database across two regions (us-east-1 and eu-west-1) with automated health monitoring and DNS-based failover.

## Architecture

### Components

1. **Aurora Global Database**
   - Primary cluster in us-east-1 with 2 instances
   - Secondary cluster in eu-west-1 with 3 read replicas
   - Encrypted storage using customer-managed KMS keys
   - Automated backups with 7-day retention
   - Point-in-time recovery enabled
   - Backtrack enabled with 24-hour window (primary only)

2. **Health Monitoring**
   - Lambda functions in each region checking cluster health every 30 seconds
   - Lambda timeout set to 5 seconds as required
   - CloudWatch alarms for replication lag > 1000ms
   - CloudWatch Logs retention for slow queries (30 days)

3. **DNS Failover**
   - Route 53 weighted routing policy
   - Health checks with 10-second intervals
   - 2-failure threshold for failover
   - Automatic failover to secondary region on primary failure

4. **Security**
   - Customer-managed KMS keys in each region
   - VPC security groups restricting MySQL access
   - IAM roles with least privilege
   - Binary logging disabled on read replicas

## Deployment Order

### Step 1: Deploy Primary Region (us-east-1)

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-primary-prod \
  --template-body file://aurora-global-primary-us-east-1.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-xxx,subnet-yyy,subnet-zzz" \
    ParameterKey=MasterUsername,ParameterValue=admin \
    ParameterKey=MasterUserPassword,ParameterValue=YourSecurePassword123! \
    ParameterKey=EnableDeletionProtection,ParameterValue=false \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

Wait for stack creation to complete and retrieve the Global Cluster Identifier:

```bash
GLOBAL_CLUSTER_ID=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-primary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`GlobalClusterIdentifier`].OutputValue' \
  --output text \
  --region us-east-1)

PRIMARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-primary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`PrimaryClusterEndpoint`].OutputValue' \
  --output text \
  --region us-east-1)
```

### Step 2: Deploy Secondary Region (eu-west-1)

```bash
aws cloudformation create-stack \
  --stack-name aurora-global-secondary-prod \
  --template-body file://aurora-global-secondary-eu-west-1.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=GlobalClusterIdentifier,ParameterValue=$GLOBAL_CLUSTER_ID \
    ParameterKey=VpcId,ParameterValue=vpc-xxxxx \
    ParameterKey=PrivateSubnetIds,ParameterValue="subnet-aaa,subnet-bbb,subnet-ccc" \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-west-1
```

Wait for stack creation and retrieve the secondary endpoint:

```bash
SECONDARY_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name aurora-global-secondary-prod \
  --query 'Stacks[0].Outputs[?OutputKey==`SecondaryClusterEndpoint`].OutputValue' \
  --output text \
  --region eu-west-1)
```

### Step 3: Deploy Route 53 Failover (Any Region)

Note: Route 53 is a global service, but the stack can be created in any region.

```bash
aws cloudformation create-stack \
  --stack-name aurora-route53-failover-prod \
  --template-body file://route53-failover.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=HostedZoneId,ParameterValue=Z1234567890ABC \
    ParameterKey=DomainName,ParameterValue=db.example.com \
    ParameterKey=PrimaryClusterEndpoint,ParameterValue=$PRIMARY_ENDPOINT \
    ParameterKey=SecondaryClusterEndpoint,ParameterValue=$SECONDARY_ENDPOINT \
    ParameterKey=PrimaryHealthCheckIP,ParameterValue=<NAT-Gateway-IP-us-east-1> \
    ParameterKey=SecondaryHealthCheckIP,ParameterValue=<NAT-Gateway-IP-eu-west-1> \
  --region us-east-1
```

## Configuration Details

### Connection Pooling

The Aurora clusters are configured with optimized connection parameters:
- Read replicas have binary logging disabled for better performance
- Slow query logging enabled with 2-second threshold
- Error logs exported to CloudWatch

### Health Checks

Lambda functions monitor cluster availability every 30 seconds:
- Check cluster status via RDS API
- Return 200 for healthy, 503 for unhealthy
- Timeout set to 5 seconds as required
- Deployed in VPC for private endpoint access

Route 53 health checks:
- HTTPS protocol on port 443 (health check endpoint IPs)
- 10-second check interval
- 2-failure threshold before failover
- Health check IPs should be NAT Gateway public IPs or API Gateway endpoints

### Failover Behavior

The weighted routing policy provides automatic failover:
- Primary: Weight 100 (receives all traffic when healthy)
- Secondary: Weight 0 (standby, receives traffic only if primary fails)
- TTL: 60 seconds for fast DNS propagation
- Expected RTO: < 30 seconds
- Expected RPO: < 1 second (Aurora Global Database replication)

### Monitoring

CloudWatch Alarms:
- Replication lag alarm triggers when lag > 1000ms
- Monitors every 60 seconds
- Evaluates over 2 periods

CloudWatch Logs:
- Slow query logs retained for 30 days
- Error logs retained for 30 days

## Resource Naming

All resources include the `${EnvironmentSuffix}` parameter for uniqueness:
- Clusters: `aurora-primary-cluster-${EnvironmentSuffix}`
- Instances: `aurora-primary-instance-1-${EnvironmentSuffix}`
- Lambda: `aurora-health-check-primary-${EnvironmentSuffix}`
- Security groups: `aurora-sg-${EnvironmentSuffix}`

## Destroyability

The templates are configured for easy cleanup:
- Deletion protection disabled by default (can be enabled for production)
- No DeletionPolicy: Retain on any resources
- All resources will be deleted when stacks are removed

To enable deletion protection for production:
```bash
--parameters ParameterKey=EnableDeletionProtection,ParameterValue=true
```

## Performance Characteristics

- **RPO**: < 1 second (Aurora Global Database replication)
- **RTO**: < 30 seconds (DNS TTL + health check interval)
- **Replication lag threshold**: 1000ms alarm
- **Health check frequency**: Every 30 seconds (Lambda) / 10 seconds (Route 53)
- **Backtrack window**: 24 hours (primary cluster only)
- **Backup retention**: 7 days

## Cost Optimization

- Minimum instance size: db.r5.large
- Read replicas for load distribution
- CloudWatch Logs with 30-day retention
- EventBridge rules instead of continuous polling

## Limitations

1. **Multi-Region CloudFormation**: CloudFormation templates are region-specific. This solution uses three separate templates.

2. **Route 53 Health Check Protocol**: The template uses HTTPS on port 443 for health checks as specified, but Aurora MySQL uses port 3306. You should:
   - Deploy API Gateway or ALB endpoints that check Aurora health
   - Use those endpoint IPs for Route 53 health checks
   - Or use Lambda function URLs with health check logic

3. **Global Database Creation**: The secondary cluster must be created after the primary cluster and Global Database are fully available.

4. **VPC Peering**: Cross-region VPC peering must be established manually or through separate templates before deployment.

## Maintenance

### Manual Failover

To manually promote the secondary region:

```bash
aws rds failover-global-cluster \
  --global-cluster-identifier aurora-global-prod \
  --target-db-cluster-identifier aurora-secondary-cluster-prod \
  --region eu-west-1
```

### Monitoring Replication

```bash
aws rds describe-global-clusters \
  --global-cluster-identifier aurora-global-prod \
  --region us-east-1
```

### Cleanup

Remove stacks in reverse order:

```bash
# 1. Remove Route 53 configuration
aws cloudformation delete-stack \
  --stack-name aurora-route53-failover-prod \
  --region us-east-1

# 2. Remove secondary region
aws cloudformation delete-stack \
  --stack-name aurora-global-secondary-prod \
  --region eu-west-1

# 3. Remove primary region (this removes the Global Database)
aws cloudformation delete-stack \
  --stack-name aurora-global-primary-prod \
  --region us-east-1
```

## Troubleshooting

### Issue: Secondary cluster creation fails

**Solution**: Ensure the Global Database is fully available before creating the secondary cluster. Wait 5-10 minutes after primary stack completion.

### Issue: Health checks always failing

**Solution**: Verify that the health check IPs are accessible and that NAT Gateways or API Gateway endpoints are correctly configured. Route 53 health checks need publicly accessible HTTPS endpoints.

### Issue: High replication lag

**Solution**: Check network connectivity between regions, verify VPC peering is active, and ensure sufficient instance capacity.

## Security Considerations

1. **KMS Keys**: Customer-managed keys in each region for encryption at rest
2. **Security Groups**: Restrict MySQL access to private VPC CIDR ranges
3. **IAM Roles**: Lambda execution roles with minimal required permissions
4. **Secrets Management**: Consider using AWS Secrets Manager for password rotation
5. **Binary Logging**: Disabled on read replicas to prevent binary log proliferation

## Compliance

This solution meets the following requirements:
- Encrypted storage with customer-managed KMS keys
- 7-day backup retention for point-in-time recovery
- 24-hour backtrack window on primary cluster
- 30-day log retention for audit trails
- Subnet distribution across 3+ availability zones per region
- Binary logging disabled on read replicas as specified
