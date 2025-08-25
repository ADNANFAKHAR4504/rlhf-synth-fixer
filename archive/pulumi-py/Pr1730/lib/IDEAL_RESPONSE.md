# TAP Infrastructure Project

## Project Overview

The TAP (Test Automation Platform) Infrastructure project is a comprehensive Infrastructure as Code (IaC) solution built with Pulumi and Python. It provides automated deployment of AWS infrastructure components including S3 buckets, IAM roles, CloudTrail logging, SNS notifications, and CloudWatch monitoring across multiple regions.

## Code Structure

```
iac-test-automations/
├── lib/                          # Core infrastructure library
│   ├── __init__.py              # Package initialization
│   ├── tap_stack.py             # Main Pulumi component
│   ├── cloudtrail_config.py     # CloudTrail configuration
│   ├── Pulumi.pr1730.yaml       # Pulumi stack configuration
│   └── deploy_with_existing_resources.sh  # Deployment script
├── tests/                       # Test suite
│   ├── unit/                    # Unit tests
│   │   └── test_tap_stack.py
│   └── integration/             # Integration tests
│       └── test_tap_stack.py
├── scripts/                     # Build and deployment scripts
│   ├── bootstrap.sh
│   ├── deploy.sh
│   ├── unit-tests.sh
│   └── integration-tests.sh
├── templates/                   # Infrastructure templates
├── actions/                     # GitHub Actions
└── tap.py                      # Main entry point
```

## Core Components

### 1. Main Stack Component (`lib/tap_stack.py`)

The `TapStack` class is the main Pulumi component that orchestrates the deployment of all infrastructure resources.

```python
class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates the instantiation of other resource-specific components
    and manages the environment suffix used for naming and configuration.
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags or {}

        # Deploy the infrastructure
        self.infrastructure = deploy_infrastructure(self.environment_suffix, self.tags)

        # Register outputs
        self.register_outputs({
            "s3_buckets": self.infrastructure["buckets"],
            "sns_topics": self.infrastructure["sns_topics"],
            "iam_roles": self.infrastructure["iam_roles"],
            "cloudtrail_arns": self.infrastructure["trails"]
        })
```

### 2. Configuration Management (`lib/cloudtrail_config.py`)

Handles CloudTrail configuration and resource management with support for existing resource handling.

```python
def should_skip_cloudtrail_creation(region: str) -> bool:
    """
    Check if CloudTrail creation should be skipped for a given region.

    Args:
        region: AWS region name

    Returns:
        True if CloudTrail creation should be skipped, False otherwise
    """
    skip_regions = get_skip_cloudtrail_regions()
    return region in skip_regions

def should_skip_iam_creation() -> bool:
    """
    Check if IAM role creation should be skipped globally.

    Returns:
        True if IAM role creation should be skipped, False otherwise
    """
    skip_iam = os.getenv("SKIP_IAM_CREATION", "false").lower()
    return skip_iam == "true"
```

### 3. Infrastructure Functions

#### S3 Bucket Creation

```python
def create_s3_bucket(region: str, tags: Dict[str, str]) -> aws.s3.Bucket:
    """
    Create an S3 bucket with versioning and encryption enabled.

    Args:
        region: AWS region for the bucket
        tags: Resource tags to apply

    Returns:
        S3 bucket resource
    """
    bucket = aws.s3.Bucket(
        f"{project_name}-{environment}-storage-{region}",
        bucket=f"{project_name}-{environment}-storage-{region}",
        tags=tags,
        opts=ResourceOptions(
            provider=aws.Provider(f"aws-s3-bucket-{region}", region=region)
        )
    )

    # Enable versioning, encryption, and public access blocking
    # ... implementation details
```

#### IAM Role Creation

```python
def create_iam_roles(tags: Dict[str, str]) -> Dict[str, aws.iam.Role]:
    """
    Create IAM roles with least privilege access.

    Args:
        tags: Resource tags to apply

    Returns:
        Dictionary of IAM roles
    """
    # S3 access role for applications
    s3_access_role = aws.iam.Role(
        f"{project_name}-{environment}-s3-access-role",
        name=f"{project_name}-{environment}-s3-access-role",
        assume_role_policy=s3_assume_role_policy.json,
        tags=tags
    )

    # CloudWatch monitoring role
    cloudwatch_role = aws.iam.Role(
        f"{project_name}-{environment}-cloudwatch-role",
        name=f"{project_name}-{environment}-cloudwatch-role",
        assume_role_policy=cloudwatch_assume_role_policy.json,
        tags=tags
    )

    return {
        "s3_access_role": s3_access_role,
        "cloudwatch_role": cloudwatch_role
    }
```

#### CloudTrail Creation

```python
def create_cloudtrail(region: str, bucket: aws.s3.Bucket, tags: Dict[str, str]) -> aws.cloudtrail.Trail:
    """
    Create CloudTrail for audit logging.

    Args:
        region: AWS region for CloudTrail
        bucket: S3 bucket for CloudTrail logs
        tags: Resource tags to apply

    Returns:
        CloudTrail resource
    """
    trail_name = get_cloudtrail_name(project_name, environment, region)
    unique_trail_name = f"{trail_name}-{environment}"

    trail = aws.cloudtrail.Trail(
        f"{project_name}-{environment}-trail-{region}",
        name=unique_trail_name,
        s3_bucket_name=bucket.bucket,
        s3_key_prefix=f"cloudtrail-logs/{region}",
        include_global_service_events=True,
        is_multi_region_trail=False,
        enable_logging=True,
        tags=tags,
        opts=ResourceOptions(
            provider=aws.Provider(f"aws-cloudtrail-trail-{region}", region=region)
        )
    )

    return trail
```

### 4. Main Deployment Function

```python
def deploy_infrastructure(environment_suffix: str, tags: Dict[str, str]) -> Dict[str, Any]:
    """
    Deploy the complete infrastructure across multiple regions.

    Args:
        environment_suffix: Environment suffix for resource naming
        tags: Additional tags to apply to resources

    Returns:
        Dictionary containing all deployed resources
    """
    # Merge common tags with provided tags
    all_tags = {**common_tags, **tags}

    resources = {
        "buckets": {},
        "sns_topics": {},
        "alarms": {},
        "trails": {},
        "iam_roles": {}
    }

    # Create IAM roles conditionally
    if should_skip_iam_creation():
        pulumi.log.warn("Skipping IAM role creation due to configuration.")
        resources["iam_roles"] = {}
    else:
        iam_roles = create_iam_roles(all_tags)
        resources["iam_roles"] = iam_roles

    # Deploy resources in each region
    for region in regions:
        region_tags = {**all_tags, "Region": region}

        # Create S3 bucket
        bucket = create_s3_bucket(region, region_tags)
        resources["buckets"][region] = bucket

        # Create SNS topic
        sns_topic = create_sns_topic(region, region_tags)
        resources["sns_topics"][region] = sns_topic

        # Create CloudWatch alarm
        alarm = create_security_group_alarm(region, sns_topic, region_tags)
        resources["alarms"][region] = alarm

        # Create CloudTrail with fallback handling
        if should_skip_cloudtrail_creation(region):
            pulumi.log.warn(f"Skipping CloudTrail creation in region: {region}")
            resources["trails"][region] = None
        elif should_use_existing_cloudtrail(region):
            pulumi.log.warn(f"Skipping CloudTrail creation in {region} to avoid maximum trails limit.")
            resources["trails"][region] = None
        else:
            trail = create_cloudtrail(region, bucket, region_tags)
            resources["trails"][region] = trail

    return resources
```

## Configuration

### Environment Variables

The project supports various environment variables for configuration:

```bash
# Skip IAM role creation to avoid conflicts
export SKIP_IAM_CREATION=true

# Skip CloudTrail creation in specific regions
export SKIP_CLOUDTRAIL_REGIONS=us-east-1

# Pulumi configuration
export PULUMI_ENVIRONMENT=production
export PULUMI_PROJECT_NAME=tap-system
export PULUMI_NOTIFICATION_EMAIL=admin@example.com
```

### Pulumi Configuration (`lib/Pulumi.pr1730.yaml`)

```yaml
config:
  aws:region: us-east-1
  tap-system:environment: production
  tap-system:project-name: tap-system
  tap-system:notification-email: admin@example.com
```

## How to Run

### 1. Prerequisites

- Python 3.8+
- Pulumi CLI
- AWS CLI configured
- Docker (for containerized deployment)

### 2. Installation

```bash
# Clone the repository
git clone <repository-url>
cd iac-test-automations

# Install dependencies
pip install -r requirements.txt

# Install Pulumi
curl -fsSL https://get.pulumi.com | sh
```

### 3. Testing

```bash
# Run unit tests
./scripts/unit-tests.sh

# Run integration tests
./scripts/integration-tests.sh

# Run all tests
./scripts/test.sh
```

### 4. Deployment

#### Option 1: Standard Deployment

```bash
# Bootstrap infrastructure
./scripts/bootstrap.sh

# Deploy infrastructure
./scripts/deploy.sh
```

#### Option 2: Deployment with Existing Resource Handling

```bash
# Use the deployment script that handles existing resources
./lib/deploy_with_existing_resources.sh
```

#### Option 3: Manual Deployment with Environment Variables

```bash
# Set environment variables
export SKIP_IAM_CREATION=true
export SKIP_CLOUDTRAIL_REGIONS=us-east-1

# Run deployment
./scripts/deploy.sh
```

### 5. Development

```bash
# Run in development mode
export PULUMI_ENVIRONMENT=dev
./scripts/deploy.sh

# Run with specific environment suffix
export ENVIRONMENT_SUFFIX=pr1730
./scripts/deploy.sh
```

## Deployment Commands

### Quick Start Commands

```bash
# 1. Bootstrap the infrastructure
./scripts/bootstrap.sh

# 2. Run unit tests
./scripts/unit-tests.sh

# 3. Run integration tests
./scripts/integration-tests.sh

# 4. Deploy infrastructure
./scripts/deploy.sh
```

### Advanced Deployment Commands

#### Standard Deployment

```bash
# Set environment variables
export PULUMI_ENVIRONMENT=production
export PULUMI_PROJECT_NAME=tap-system
export PULUMI_NOTIFICATION_EMAIL=admin@example.com

# Deploy with standard configuration
pulumi stack select TapStackpr1730
pulumi config set aws:region us-east-1
pulumi preview
pulumi up --yes
```

#### Deployment with Existing Resource Handling

```bash
# Handle existing resources gracefully
export SKIP_IAM_CREATION=true
export SKIP_CLOUDTRAIL_REGIONS=us-east-1

# Deploy using the enhanced script
./lib/deploy_with_existing_resources.sh
```

#### Multi-Region Deployment

```bash
# Deploy to specific regions
export AWS_DEFAULT_REGION=us-east-1
pulumi up --yes

# Deploy to secondary region
export AWS_DEFAULT_REGION=us-west-2
pulumi up --yes
```

### Configuration Commands

```bash
# Set Pulumi configuration
pulumi config set aws:region us-east-1
pulumi config set tap-system:environment production
pulumi config set tap-system:project-name tap-system
pulumi config set tap-system:notification-email your-email@company.com

# Optional: Set KMS key for S3 encryption
pulumi config set tap-system:kms-key-id --secret arn:aws:kms:region:account:key/key-id

# View current configuration
pulumi config

# Export configuration
pulumi config --show-secrets
```

### Testing Commands

```bash
# Run all tests
./scripts/test.sh

# Run unit tests only
./scripts/unit-tests.sh

# Run integration tests only
./scripts/integration-tests.sh

# Run tests with coverage
pytest tests/ --cov=lib --cov-report=html
```

### Debugging Commands

```bash
# Enable verbose logging
export PULUMI_LOG_LEVEL=DEBUG

# Preview changes
pulumi preview --diff

# Deploy with detailed output
pulumi up --verbose=3

# Check resource status
pulumi stack --show-urns

# View outputs
pulumi stack output

# Destroy resources (use with caution)
pulumi destroy --yes
```

### CI/CD Commands

```bash
# GitHub Actions workflow commands
# These are typically run automatically by CI/CD

# Install dependencies
pip install -r requirements.txt

# Run linting
flake8 lib/ tests/

# Run type checking
mypy lib/

# Run security checks
bandit -r lib/

# Build and test
./scripts/build.sh
./scripts/test.sh
./scripts/deploy.sh
```

## Features

### ✅ **Multi-Region Deployment**

- Deploys infrastructure across multiple AWS regions
- Configurable region list
- Region-specific resource naming

### ✅ **Resource Management**

- S3 buckets with versioning and encryption
- IAM roles with least privilege access
- CloudTrail for audit logging
- SNS topics for notifications
- CloudWatch alarms for monitoring

### ✅ **Error Handling**

- Graceful handling of CloudTrail maximum limits
- IAM role conflict resolution
- Existing resource detection and reuse

### ✅ **Configuration Management**

- Environment variable support
- Pulumi configuration files
- Conditional resource creation

### ✅ **Testing**

- Comprehensive unit test suite
- Integration tests
- Code coverage reporting
- Test automation

### ✅ **CI/CD Integration**

- GitHub Actions workflows
- Automated testing
- Deployment automation
- Environment management

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   us-east-1     │    │   us-west-2     │    │   Global        │
│                 │    │                 │    │                 │
│ ┌─────────────┐ │    │ ┌─────────────┐ │    │ ┌─────────────┐ │
│ │ S3 Bucket   │ │    │ │ S3 Bucket   │ │    │ │ IAM Roles   │ │
│ │ CloudTrail  │ │    │ │ CloudTrail  │ │    │ │             │ │
│ │ SNS Topic   │ │    │ │ SNS Topic   │ │    │ └─────────────┘ │
│ │ CloudWatch  │ │    │ │ CloudWatch  │ │    │                 │
│ │ Alarm       │ │    │ │ Alarm       │ │    └─────────────────┘
│ └─────────────┘ │    │ └─────────────┘ │
└─────────────────┘    └─────────────────┘
```

## Best Practices

### 1. **Resource Naming**

- Consistent naming convention across regions
- Environment-specific prefixes
- Unique identifiers to avoid conflicts

### 2. **Security**

- Least privilege IAM policies
- S3 bucket encryption
- Public access blocking
- CloudTrail audit logging

### 3. **Monitoring**

- CloudWatch alarms for security events
- SNS notifications for alerts
- Log retention policies

### 4. **Error Handling**

- Graceful degradation when limits are reached
- Existing resource detection
- Comprehensive logging

### 5. **Testing**

- Unit tests for all functions
- Integration tests for deployment
- Code coverage requirements

## Troubleshooting

### Common Issues

1. **CloudTrail Maximum Trails Error**

   ```bash
   # Solution: Skip CloudTrail creation in affected regions
   export SKIP_CLOUDTRAIL_REGIONS=us-east-1
   ```

2. **IAM Role Already Exists Error**

   ```bash
   # Solution: Skip IAM role creation
   export SKIP_IAM_CREATION=true
   ```

3. **Import Errors in Tests**
   ```bash
   # Solution: Use the fixed import structure
   # The code now handles both relative and absolute imports
   ```

### Debugging

```bash
# Enable verbose logging
export PULUMI_LOG_LEVEL=DEBUG

# Run with detailed output
pulumi up --verbose=3

# Check resource status
pulumi stack --show-urns
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

## Commands to run this stack:

```bash
# Set Pulumi configuration
pulumi config set aws:region us-east-1
pulumi config set tap:environment production
pulumi config set tap:project-name tap-system
pulumi config set tap:notification-email your-email@company.com
pulumi config set tap:kms-key-id --secret arn:aws:kms:region:account:key/key-id (optional)

# Preview and deploy
pulumi preview
pulumi up
```
