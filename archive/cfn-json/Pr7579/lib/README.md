# Secure Payment Processing Infrastructure

CloudFormation template for a production-ready payment processing environment with multi-AZ high availability, encryption, and comprehensive monitoring.

## Architecture

This infrastructure creates a secure, PCI-DSS compliant payment processing environment with:

- **Network Layer**: VPC with 6 subnets across 3 availability zones (3 public, 3 private)
- **Database Layer**: Aurora PostgreSQL cluster with Multi-AZ replicas and KMS encryption
- **Compute Layer**: Auto Scaling Group with 6-12 t3.large instances using IMDSv2
- **Load Balancing**: Application Load Balancer with HTTPS termination
- **Storage**: S3 buckets for static assets and VPC Flow Logs
- **Security**: Least-privilege IAM roles, security groups with specific port rules
- **Monitoring**: CloudWatch Log Groups (30-day retention) and alarms

## Components

### Network Infrastructure
- VPC (10.0.0.0/16) spanning 3 AZs
- 3 Public subnets for ALB
- 3 Private subnets for compute and database
- 3 NAT Gateways for outbound connectivity
- VPC Flow Logs to S3

### Database
- Aurora PostgreSQL 14.7 cluster
- 2 db.r5.large instances (Multi-AZ)
- KMS-encrypted storage
- 7-day backup retention
- Automated failover

### Compute
- Auto Scaling Group (6-12 instances)
- t3.large instances with Amazon Linux 2
- IMDSv2 required
- Target tracking scaling (70% CPU)
- Health checks via ELB

### Load Balancing
- Internal Application Load Balancer
- HTTPS listener (port 443)
- Target group with health checks
- SSL termination via ACM

### Security
- Security groups with least-privilege rules
- IAM roles for EC2 to access S3 and RDS
- KMS encryption for RDS
- S3 bucket encryption (AES256)
- No public access to resources

### Monitoring
- CloudWatch Log Groups (/aws/ec2/payment-app)
- CPU utilization alarm (80% threshold)
- Database connection alarm
- 30-day log retention

## Prerequisites

Before deploying this stack, ensure you have:

1. AWS CLI configured with appropriate credentials
2. Permissions to create VPC, RDS, EC2, ALB, IAM, S3, CloudWatch, and KMS resources
3. Valid ACM certificate ARN for HTTPS listener
4. Sufficient service quotas for all resources

## Parameters

The template accepts the following parameters:

- **EnvironmentSuffix**: Unique suffix for resource naming (default: `prod`)
- **CertificateArn**: ARN of ACM certificate for HTTPS listener
- **LatestAmiId**: Latest Amazon Linux 2 AMI ID (auto-resolved via SSM)

## Deployment

### Create Stack

```bash
aws cloudformation create-stack \
  --stack-name payment-processing-stack \
  --template-body file://lib/payment-processing-stack.json \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=prod \
    ParameterKey=CertificateArn,ParameterValue=arn:aws:acm:us-east-1:123456789012:certificate/your-cert-id \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Monitor Stack Creation

```bash
aws cloudformation wait stack-create-complete \
  --stack-name payment-processing-stack \
  --region us-east-1

# View stack events
aws cloudformation describe-stack-events \
  --stack-name payment-processing-stack \
  --region us-east-1
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name payment-processing-stack \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Outputs

The stack provides the following outputs:

- **VPCId**: ID of the created VPC
- **LoadBalancerDNS**: DNS name of the Application Load Balancer
- **AuroraClusterEndpoint**: Aurora cluster endpoint address
- **StaticAssetsBucketName**: Name of the S3 bucket for static assets

## Security Considerations

1. **Database Password**: The template uses a hardcoded password (`ChangeMe123456!`). In production, use AWS Secrets Manager or Parameter Store.
2. **Security Groups**: ALB security group allows traffic from 10.0.0.0/8. Adjust based on your network requirements.
3. **Encryption**: All data is encrypted at rest (RDS with KMS, S3 with AES256) and in transit (HTTPS).
4. **IAM Roles**: Follow least-privilege principle. Review and adjust permissions as needed.
5. **IMDSv2**: All EC2 instances require IMDSv2 for enhanced security.

## Cost Considerations

Main cost drivers:
- **NAT Gateways**: 3 NAT Gateways ($0.045/hour each = ~$97/month)
- **RDS Aurora**: 2 db.r5.large instances (~$400/month)
- **EC2 Instances**: 6-12 t3.large instances (~$300-600/month)
- **ALB**: Application Load Balancer (~$20/month + data transfer)

Total estimated cost: **$800-1,200/month** (excluding data transfer)

To reduce costs:
- Use Aurora Serverless v2 instead of provisioned instances
- Reduce NAT Gateway count (use VPC endpoints where possible)
- Use smaller instance types for non-production environments

## Cleanup

To delete all resources:

```bash
aws cloudformation delete-stack \
  --stack-name payment-processing-stack \
  --region us-east-1

# Wait for deletion to complete
aws cloudformation wait stack-delete-complete \
  --stack-name payment-processing-stack \
  --region us-east-1
```

**Note**: The stack is configured with `SkipFinalSnapshot: true` on the RDS cluster, so all data will be permanently deleted.

## Validation

After deployment, validate:

1. **VPC**: Verify 6 subnets created across 3 AZs
2. **NAT Gateways**: Confirm 3 NAT Gateways with Elastic IPs
3. **RDS**: Check Aurora cluster is encrypted and Multi-AZ
4. **ALB**: Verify HTTPS listener is configured
5. **Auto Scaling**: Confirm 6 instances are running
6. **Security Groups**: Review rules for least-privilege access
7. **CloudWatch**: Check log groups and alarms are created

## Troubleshooting

### Stack Creation Fails

Common issues:
- **Certificate not found**: Verify ACM certificate ARN is correct and in us-east-1
- **Insufficient capacity**: Try different instance types or AZs
- **Service quota exceeded**: Request quota increase for EC2, RDS, or VPC resources

### Instances Not Healthy

Check:
- Security group rules allow traffic from ALB
- Health check path (/health) returns 200 OK
- Instances have internet connectivity via NAT Gateway

### Cannot Connect to RDS

Verify:
- Database security group allows traffic from application security group
- Database is in same VPC as application instances
- Credentials are correct

## Support

For issues or questions:
1. Check CloudFormation stack events for error messages
2. Review CloudWatch logs for application issues
3. Verify all security group rules are correctly configured

## License

This template is provided as-is for demonstration purposes.
