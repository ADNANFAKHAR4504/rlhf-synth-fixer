## Infrastructure Requirements

Your Pulumi code must provision the following secure S3 infrastructure, using Pulumi with Python:

### 1. S3 Data Bucket

Create a production S3 bucket for storing sensitive customer data.

- Name the bucket following pattern: `prod-data-*`
- Enable versioning for audit trails
- Configure server-side encryption using AWS KMS
- Block all public access (READ/WRITE)
- Enable server access logging to a separate bucket
- Tag all resources with `Environment: Production`

### 2. S3 Logs Bucket

Create a separate S3 bucket for storing server access logs.

- Name the bucket: `prod-logs`
- Enable versioning
- Use AES256 encryption (not KMS)
- Block all public access
- Configure for log delivery write access

### 3. AWS KMS Key

Create a customer-managed KMS key for encryption.

- Enable automatic key rotation
- Set appropriate deletion window
- Use for S3 bucket encryption
- Tag appropriately for cost tracking

### 4. IAM Policy & Bucket Policy

Create restrictive access policies for the data bucket.

- Allow access only from pre-existing IAM role: `DataAccessRole`
- Deny all other access attempts
- Use bucket policy for access control
- Implement least-privilege permissions

### 5. CloudWatch Monitoring

Create CloudWatch alarms for security monitoring.

- Monitor S3 access errors (4xx errors)
- Alert when error threshold exceeded
- Use appropriate evaluation periods and thresholds
- Tag alarms consistently

### 6. Server Access Logging

Configure comprehensive logging capabilities.

- Enable server access logging to logs bucket
- Make logging configurable via parameter
- Store logs with appropriate prefix structure
- Ensure logs bucket security

## Implementation Constraints

Use the `TapStack` class inside `tap_stack.py` (already scaffolded).

Do not define resources directly inside `__init__`; instead:

- Split infrastructure setup into helper methods like `_create_kms_key()`, `_create_s3_buckets()`, `_create_iam_policies()`, etc.
- Use these helper methods inside `__init__`
- Use values from `TapStackArgs`, Pulumi Config, or environment variables
- Do not hardcode any sensitive values
- Use `self.tags` and `self.environment_suffix` from the provided `TapStackArgs`
- All resources must use Pulumi's `ResourceOptions(parent=self)` for hierarchy
- Apply consistent naming using appropriate prefixes + `self.environment_suffix`
- Add detailed comments above each resource block or method, explaining what it does and why

## Security & Compliance Requirements

- Ensure PCI-DSS compliance for data storage
- Implement proper encryption at rest and in transit
- Use customer-managed KMS keys
- Block all public access to buckets
- Implement proper IAM role-based access control
- Enable comprehensive logging and monitoring
- Handle deployment failures gracefully with rollbacks

## Expected Output

A single Python file `tap_stack.py` that defines the full `TapStack` class.

It should:

- Deploy successfully using `pulumi up`
- Match the structure defined in your existing template
- Be clean, modular, testable, and production-grade
- Do not include the `tap.py` entry point - that already exists and will instantiate this `TapStack`
- Handle all security and compliance requirements
- Use us-east-1 region as specified