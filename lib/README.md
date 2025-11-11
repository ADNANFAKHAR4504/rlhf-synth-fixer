# IaC Test Automations

A comprehensive Infrastructure as Code (IaC) testing and automation platform for multi-tenant SaaS applications. This repository contains production-ready infrastructure configurations, CI/CD pipelines, and automated testing frameworks.

## Architecture Overview

This platform provides a complete cloud infrastructure stack including:

- **AWS EKS**: Managed Kubernetes cluster with enhanced logging and monitoring
- **RDS Aurora MySQL**: Managed database with encryption, monitoring, and high availability
- **ElastiCache Redis**: In-memory caching with encryption and authentication
- **Amazon Cognito**: User authentication and authorization with MFA support
- **Amazon ECR**: Container registry for microservices
- **VPC**: Secure network architecture with public/private subnets and flow logging
- **CloudWatch**: Comprehensive monitoring and alerting
- **CircleCI**: CI/CD pipelines with OIDC authentication

### Infrastructure Components

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CircleCI      │    │    AWS EKS      │    │   RDS Aurora    │
│   CI/CD         │◄──►│   Kubernetes    │◄──►│   MySQL 8.0     │
│   Pipelines     │    │   Cluster       │    │   Encrypted     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   ECR Registry  │    │   ElastiCache   │    │   CloudWatch    │
│   Containers    │    │   Redis Cache   │    │   Monitoring    │
│                 │    │   Encrypted     │    │   & Alerts      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### Required Tools
- **Terraform** >= 1.6.0
- **AWS CLI** configured with appropriate credentials
- **kubectl** for Kubernetes cluster management
- **Helm** for Kubernetes package management
- **Docker** for container operations
- **Node.js** >= 18.0.0 (for CDK operations)
- **Python** >= 3.8 (for Pulumi operations)

### AWS Permissions
The following AWS permissions are required for deployment:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "eks:*",
        "rds:*",
        "elasticache:*",
        "ecr:*",
        "iam:*",
        "vpc:*",
        "kms:*",
        "s3:*",
        "dynamodb:*",
        "cloudwatch:*",
        "sns:*",
        "route53:*"
      ],
      "Resource": "*"
    }
  ]
}
```

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/TuringGpt/iac-test-automations.git
cd iac-test-automations
npm install
```

### 2. Configure Environment Variables
Create a `.env` file or export the following variables:

```bash
export AWS_REGION=us-east-1
export ENVIRONMENT=dev
export CLUSTER_NAME=iac-test-cluster
export DB_CLUSTER_IDENTIFIER=iac-test-db
export CACHE_CLUSTER_ID=iac-test-cache
export COGNITO_USER_POOL_NAME=iac-test-users
```

### 3. Initialize Terraform Backend
```bash
cd lib/infrastructure
terraform init -backend-config="bucket=your-terraform-state-bucket" \
               -backend-config="key=iac-test-automations/terraform.tfstate" \
               -backend-config="region=us-east-1" \
               -backend-config="dynamodb_table=terraform-locks"
```

### 4. Plan and Apply Infrastructure
```bash
terraform plan -var-file="../../variables.tf"
terraform apply -var-file="../../variables.tf"
```

## Configuration Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `environment` | Deployment environment | `dev`, `staging`, `prod` |
| `aws_region` | AWS region for deployment | `us-east-1` |
| `cluster_name` | EKS cluster name | `iac-test-cluster` |
| `vpc_cidr` | VPC CIDR block | `10.0.0.0/16` |
| `db_cluster_identifier` | RDS cluster identifier | `iac-test-db` |
| `db_master_username` | RDS master username | `admin` |
| `cache_cluster_id` | ElastiCache cluster ID | `iac-test-cache` |
| `cognito_user_pool_name` | Cognito user pool name | `iac-test-users` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `kubernetes_version` | EKS Kubernetes version | `1.28` |
| `node_instance_type` | EKS node instance type | `t3.medium` |
| `node_min_size` | Minimum number of nodes | `2` |
| `node_max_size` | Maximum number of nodes | `10` |
| `db_instance_class` | RDS instance class | `db.t3.small` |
| `cache_node_type` | ElastiCache node type | `cache.t3.micro` |

## Deployment Environments

### Development Environment
```bash
export ENVIRONMENT=dev
terraform workspace select dev || terraform workspace new dev
terraform apply -var-file="../../variables.tf"
```

### Staging Environment
```bash
export ENVIRONMENT=staging
terraform workspace select staging || terraform workspace new staging
terraform apply -var-file="../../variables.tf"
```

### Production Environment
```bash
export ENVIRONMENT=prod
terraform workspace select prod || terraform workspace new prod
terraform apply -var-file="../../variables.tf"
```

## CI/CD Pipeline

The project uses CircleCI with OIDC authentication for secure deployments:

### Pipeline Stages
1. **Lint & Validate**: Code quality checks and validation
2. **Unit Tests**: Component and unit test execution
3. **Integration Tests**: End-to-end testing with LocalStack
4. **Security Scan**: Vulnerability and compliance scanning
5. **Deploy**: Progressive deployment (dev → staging → prod)

### OIDC Configuration
CircleCI uses OpenID Connect for AWS authentication, eliminating the need for long-lived credentials.

## Monitoring and Alerting

### CloudWatch Alarms
- **EKS**: CPU and memory utilization alerts
- **RDS**: CPU utilization and storage space alerts
- **ElastiCache**: CPU utilization and memory alerts

### Log Aggregation
- **EKS**: Control plane and application logs
- **RDS**: Audit, error, general, and slow query logs
- **VPC**: Flow logs for network traffic analysis

## Security Features

### Encryption
- **At Rest**: KMS encryption for RDS and ElastiCache
- **In Transit**: TLS encryption for all services
- **Secrets**: AWS Secrets Manager integration

### Network Security
- **VPC Isolation**: Private subnets for sensitive resources
- **Security Groups**: Least privilege access rules
- **Network ACLs**: Additional network layer protection

### Access Control
- **IAM Roles**: Least privilege principle
- **OIDC Authentication**: Secure CI/CD access
- **MFA**: Required for administrative access

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Local Development
```bash
# Start LocalStack for local testing
docker-compose up -d localstack

# Run tests against local environment
npm run test:local
```

## Troubleshooting

### Common Issues

#### Terraform Backend Issues
```bash
# Reinitialize backend
terraform init -reconfigure

# Unlock state if locked
terraform force-unlock LOCK_ID
```

#### EKS Cluster Access
```bash
# Update kubeconfig
aws eks update-kubeconfig --name $CLUSTER_NAME --region $AWS_REGION

# Verify cluster access
kubectl get nodes
```

#### RDS Connection Issues
```bash
# Check security group rules
aws ec2 describe-security-groups --group-ids $RDS_SG_ID

# Verify VPC configuration
aws ec2 describe-vpcs --vpc-ids $VPC_ID
```

### Logs and Debugging

#### View CloudWatch Logs
```bash
# EKS logs
aws logs tail /aws/eks/$CLUSTER_NAME/cluster

# RDS logs
aws rds describe-db-log-files --db-instance-identifier $DB_INSTANCE

# Application logs
kubectl logs -f deployment/your-app
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and add tests
4. Run the test suite: `npm test`
5. Submit a pull request

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **Commitlint**: Conventional commit messages
- **Terraform Validate**: Infrastructure validation

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support and questions:
- **Issues**: [GitHub Issues](https://github.com/TuringGpt/iac-test-automations/issues)
- **Documentation**: [Wiki](https://github.com/TuringGpt/iac-test-automations/wiki)
- **Discussions**: [GitHub Discussions](https://github.com/TuringGpt/iac-test-automations/discussions)

## Roadmap

- [ ] Multi-cloud support (AWS, GCP, Azure)
- [ ] Service mesh integration (Istio)
- [ ] Advanced monitoring dashboard
- [ ] Automated chaos engineering
- [ ] Cost optimization recommendations
- [ ] Compliance automation (SOC 2, HIPAA)