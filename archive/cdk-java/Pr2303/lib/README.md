# AWS CDK Java Infrastructure Stack

This project contains a complete AWS infrastructure stack implemented using AWS CDK with Java. It provides multi-environment support for dev, staging, and production deployments.

## Infrastructure Components

The stack includes the following AWS resources:

- **VPC**: Multi-AZ VPC with public and private subnets
- **Networking**: Internet Gateway, NAT Gateways, Route Tables
- **IAM**: Roles for EC2 and Lambda with cross-account S3 access policies
- **S3**: Logging and replication buckets with encryption, versioning, and lifecycle policies
- **Security**: SSL enforcement, public access blocking, least-privilege IAM policies

## Project Structure

```
lib/
├── src/main/java/app/
│   ├── Main.java          # Main CDK app entry point
│   └── TapStack.java       # Complete infrastructure stack implementation
├── cdk.json                # CDK configuration
├── pom.xml                 # Maven configuration
└── README.md               # This file

tests/
├── unit/java/app/
│   ├── MainTest.java       # Unit tests for Main class
│   └── TapStackTest.java   # Unit tests for TapStack
└── integration/java/app/
    ├── MainIntegrationTest.java      # Integration tests for Main
    └── TapStackIntegrationTest.java  # Integration tests for TapStack
```

## Prerequisites

1. Java 11 or later
2. Maven 3.6 or later (optional, for dependency management)
3. AWS CDK CLI (`npm install -g aws-cdk`)
4. AWS credentials configured

## Environment Configuration

The stack supports three environments with different configurations:

| Environment | Region      | VPC CIDR    |
|-------------|-------------|-------------|
| dev         | us-east-1   | 10.0.0.0/16 |
| staging     | us-east-2   | 10.1.0.0/16 |
| prod        | us-west-1   | 10.2.0.0/16 |

## Deployment

### 1. Install Dependencies

If using Maven:
```bash
mvn clean install
```

### 2. Configure Environment

Set the environment using one of these methods:

```bash
# Option 1: Environment variable
export ENVIRONMENT=dev

# Option 2: CDK context
cdk deploy -c environment=dev

# Option 3: Update cdk.json context
```

### 3. Bootstrap CDK (first time only)

```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### 4. Deploy the Stack

```bash
# Deploy to dev environment (default)
cdk deploy

# Deploy to specific environment
cdk deploy -c environment=staging
cdk deploy -c environment=prod

# Deploy with specific AWS account
export CDK_DEFAULT_ACCOUNT=123456789012
export CDK_DEFAULT_REGION=us-east-1
cdk deploy
```

### 5. View Stack Outputs

After deployment, the stack will output:
- VPC ID
- Public and Private Subnet IDs
- S3 Bucket Names
- IAM Role ARNs

## Testing

### Run Unit Tests

```bash
mvn test
```

### Run Integration Tests

```bash
mvn verify
```

### Run Specific Test Class

```bash
mvn test -Dtest=TapStackTest
mvn test -Dtest=TapStackIntegrationTest
```

## Stack Features

### Multi-Environment Support
- Separate configurations for dev, staging, and production
- Environment-specific resource naming with random suffixes to avoid conflicts
- Region-specific deployments

### Security Best Practices
- S3 bucket encryption with AES256
- SSL enforcement on all S3 buckets
- Public access blocking on S3 buckets
- Least-privilege IAM policies
- VPC with private subnets for sensitive resources

### High Availability
- Multi-AZ deployment
- NAT Gateways in each availability zone
- S3 cross-region replication for production

### Cost Optimization
- S3 lifecycle policies (transition to Glacier after 30 days, delete after 365 days)
- Proper resource tagging for cost allocation

### Disaster Recovery
- S3 versioning enabled
- Replication buckets for backup
- Retention policies configured

## Useful CDK Commands

- `cdk ls` - List all stacks
- `cdk synth` - Synthesize CloudFormation template
- `cdk diff` - Compare deployed stack with current state
- `cdk deploy` - Deploy stack to AWS
- `cdk destroy` - Remove stack from AWS

## Environment Variables

- `ENVIRONMENT` - Target environment (dev/staging/prod)
- `ENVIRONMENT_SUFFIX` - Custom suffix for resource naming
- `AWS_ACCOUNT_ID` - Override default account ID
- `CDK_DEFAULT_ACCOUNT` - CDK default account
- `CDK_DEFAULT_REGION` - CDK default region

## Troubleshooting

### Compilation Issues
If you encounter compilation issues without Maven:
1. Ensure Java 11+ is installed: `java -version`
2. Use the provided build.sh script: `./build.sh`

### CDK Bootstrap Required
If you see "This stack uses assets" error:
```bash
cdk bootstrap aws://ACCOUNT-ID/REGION
```

### Missing Dependencies
Install AWS CDK CLI:
```bash
npm install -g aws-cdk
```

## License

Copyright (c) 2024. All rights reserved.