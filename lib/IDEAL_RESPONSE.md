# HealthTech Solutions CI/CD Pipeline Infrastructure

## Overview

This CloudFormation template implements a comprehensive, production-ready CI/CD pipeline infrastructure for HealthTech Solutions' patient management system. The infrastructure is designed with healthcare compliance, security, and high availability in mind.

## Architecture

### Network Layer
- **VPC**: Custom VPC with DNS support enabled for service discovery
- **Subnets**: 2 public subnets and 2 private subnets across multiple availability zones
- **NAT Gateway**: Enables outbound internet access for private subnet resources
- **Internet Gateway**: Provides internet connectivity for public subnet resources
- **VPC Flow Logs**: Network traffic monitoring for security auditing

### Security Layer
- **Security Groups**: Layer-specific security groups (ALB, ECS, RDS, EFS) with least privilege access
- **KMS Encryption**: Customer-managed keys for RDS and EFS encryption
- **Secrets Manager Integration**: Database credentials referenced (not created) from Secrets Manager
- **IAM Roles**: Separate roles for ECS tasks, CodePipeline, and CodeBuild with minimal permissions

### Compute Layer
- **ECS Cluster**: Fargate-based cluster for running containerized applications
- **ECS Service**: Auto-scaling service with target tracking based on CPU utilization
- **Application Load Balancer**: Internet-facing ALB in public subnets routing to ECS tasks
- **Auto Scaling**: Scales between 1-10 tasks based on CPU utilization (target: 70%)

### Data Layer
- **RDS PostgreSQL**: Multi-AZ database instance with encryption at rest
- **EFS File System**: Encrypted file system for persistent application data
- **EFS Mount Targets**: Available in both private subnets

### CI/CD Layer
- **CodePipeline**: Three-stage pipeline (Source → Build → Deploy)
- **CodeBuild**: Docker-capable build environment for container images
- **S3 Artifact Bucket**: Encrypted bucket with public access blocked
- **ECR Integration**: Build process pushes images to Amazon ECR

### Monitoring Layer
- **CloudWatch Logs**: Centralized logging for VPC, ECS, and CodeBuild
- **CloudWatch Alarms**: CPU utilization and database connection monitoring
- **Container Insights**: Enabled on ECS cluster for detailed metrics

## Key Features

### 1. Healthcare Compliance
- All data encrypted at rest (RDS, EFS, S3)
- All data encrypted in transit (EFS transit encryption, HTTPS)
- Database credentials managed through Secrets Manager
- Network isolation with private subnets
- Audit trails through VPC Flow Logs and CloudWatch

### 2. High Availability
- Multi-AZ RDS deployment
- Load balancer across multiple availability zones
- ECS tasks distributed across multiple subnets
- NAT Gateway with Elastic IP for consistent outbound connectivity

### 3. Security Best Practices
- No public access to database
- ECS tasks run in private subnets only
- Security groups follow least privilege principle
- Customer-managed KMS keys for encryption
- S3 bucket with all public access blocked
- IAM roles use managed policies and inline policies with specific resources

### 4. Operational Excellence
- All resources tagged with environment suffix
- Centralized logging to CloudWatch
- Auto-scaling for compute resources
- Deletion policies set to Delete (fully destroyable)
- No deletion protection (can be toggled via parameters if needed)

### 5. Cost Optimization
- Fargate for ECS (pay for what you use)
- Pay-per-request RDS with gp3 storage
- Elastic File System with bursting throughput
- Auto-scaling minimizes over-provisioning

## Parameters

The template exposes several parameters for customization:

### Environment
- `EnvironmentSuffix`: Environment identifier (dev, staging, prod)

### Network
- `VpcCIDR`, `PublicSubnet1CIDR`, `PublicSubnet2CIDR`, `PrivateSubnet1CIDR`, `PrivateSubnet2CIDR`

### Database
- `DBInstanceClass`: RDS instance type
- `DBAllocatedStorage`: Storage size in GB
- `DBSecretName`: Name of Secrets Manager secret containing credentials

### Container
- `ContainerImage`: Docker image to deploy
- `ContainerPort`: Port exposed by container
- `TaskCPU`, `TaskMemory`: Resource allocation
- `DesiredCount`: Initial number of tasks

## Outputs

The template exports comprehensive outputs for integration:

### Network
- VPC ID, Subnet IDs, NAT Gateway ID

### Database
- RDS endpoint, port, and ARN

### Storage
- EFS file system ID and ARN

### Compute
- ECS cluster name/ARN, service name/ARN
- Load balancer DNS and ARN

### CI/CD
- Pipeline name/ARN
- Artifact bucket name

### Security
- KMS key IDs for RDS and EFS

### Metadata
- Stack name and environment suffix

## Deployment

### Prerequisites

1. Create Secrets Manager secret with database credentials:
```bash
aws secretsmanager create-secret \
  --name healthtech/rds/credentials \
  --description "RDS database credentials" \
  --secret-string '{"username":"dbadmin","password":"SECURE_PASSWORD"}' \
  --region eu-south-1
```

2. Set up ECR repository for container images:
```bash
aws ecr create-repository \
  --repository-name healthtech \
  --region eu-south-1
```

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name healthtech-stack-dev \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-south-1
```

### Update Stack

```bash
aws cloudformation update-stack \
  --stack-name healthtech-stack-dev \
  --template-body file://lib/TapStack.yml \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --region eu-south-1
```

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name healthtech-stack-dev \
  --region eu-south-1
```

## Testing

### Unit Tests
```bash
npm test test/tap-stack.unit.test.ts
```

Tests validate:
- Template structure and syntax
- Resource properties and configurations
- Security group rules
- Encryption settings
- Naming conventions
- Output definitions

### Integration Tests
```bash
# After deployment
npm test test/tap-stack.int.test.ts
```

Tests validate:
- Resource existence in AWS
- Network connectivity
- Security configurations
- High availability setup
- Encryption at rest and in transit
- Service health and status

## Security Considerations

1. **Secrets Management**: Database credentials are referenced from Secrets Manager, not hardcoded
2. **Network Isolation**: ECS tasks and RDS run in private subnets with no direct internet access
3. **Encryption**: All data encrypted at rest (RDS, EFS, S3) and in transit (EFS, HTTPS)
4. **Access Control**: Security groups limit traffic to required ports only
5. **IAM Roles**: Principle of least privilege applied to all service roles
6. **Audit Logging**: VPC Flow Logs and CloudWatch Logs capture all activity

## Maintenance

### Updating Container Images
1. Build and push new image to ECR
2. Upload source code to S3 artifact bucket as `source.zip`
3. CodePipeline automatically triggers and deploys

### Scaling
- ECS service auto-scales between 1-10 tasks based on CPU
- Modify `DesiredCount` parameter to change baseline
- Modify `ECSServiceScalingTarget` resource to adjust min/max capacity

### Monitoring
- Check CloudWatch dashboard for metrics
- Review CloudWatch Logs for application logs
- Review VPC Flow Logs for network traffic patterns

### Credential Rotation
- Secrets Manager can be configured to auto-rotate credentials every 30 days
- Update the secret in Secrets Manager
- ECS tasks will pick up new credentials on next deployment

## Cost Estimation

Approximate monthly costs (us-east-1 pricing):
- VPC: $0 (free)
- NAT Gateway: ~$32 + data transfer
- RDS (db.t3.micro, Multi-AZ): ~$50
- EFS (minimal usage): ~$1-5
- ECS Fargate (2 tasks, 0.25 vCPU, 0.5GB): ~$12
- ALB: ~$16
- S3, CloudWatch, KMS: ~$5-10
- CodePipeline: ~$1/month + CodeBuild minutes

**Total: ~$117-130/month** (excluding data transfer and CodeBuild minutes)

## Compliance Notes

### HIPAA
- Encryption at rest and in transit
- Audit trails through CloudWatch and VPC Flow Logs
- Network isolation
- Access controls through security groups and IAM

### GDPR
- Data encryption
- Audit logging
- Ability to delete all resources

## Troubleshooting

### Stack Creation Fails
- Check CloudFormation events for specific error
- Verify Secrets Manager secret exists and has correct format
- Ensure sufficient IAM permissions
- Check region availability for all services

### ECS Tasks Not Starting
- Check ECS service events
- Verify container image exists in ECR
- Check task execution role permissions
- Review CloudWatch Logs for task errors

### RDS Connection Issues
- Verify security group rules
- Check RDS instance status
- Verify database credentials in Secrets Manager
- Ensure ECS tasks are in same VPC

### ALB Health Checks Failing
- Verify target group health check path
- Check ECS task security group allows traffic from ALB
- Review application logs for startup issues
- Verify container port matches target group port

## Best Practices Implemented

1. **Infrastructure as Code**: Entire infrastructure defined in CloudFormation
2. **Immutable Infrastructure**: Containers are rebuilt, not patched
3. **Automation**: CI/CD pipeline automates deployments
4. **Monitoring**: Comprehensive logging and alerting
5. **Security**: Defense in depth with multiple security layers
6. **High Availability**: Multi-AZ deployments
7. **Scalability**: Auto-scaling for compute resources
8. **Cost Optimization**: Right-sized resources with auto-scaling

## Future Enhancements

1. Add AWS WAF for application-level firewall
2. Implement AWS Backup for automated backups
3. Add Amazon CloudFront for CDN capabilities
4. Implement AWS X-Ray for distributed tracing
5. Add Amazon Route 53 for DNS management
6. Implement AWS Systems Manager Parameter Store for configuration
7. Add Amazon SQS for asynchronous processing
8. Implement AWS Lambda for serverless functions

## Support

For issues or questions:
1. Check CloudFormation events for errors
2. Review CloudWatch Logs for application issues
3. Check AWS Service Health Dashboard for service disruptions
4. Review AWS documentation for specific services

## License

This infrastructure template is provided as-is for HealthTech Solutions.
