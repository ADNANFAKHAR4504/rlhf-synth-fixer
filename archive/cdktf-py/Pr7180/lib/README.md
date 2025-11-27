```markdown
# Multi-Tenant SaaS Infrastructure

CDKTF Python implementation for isolated multi-tenant SaaS infrastructure with security boundaries, encryption, and centralized monitoring.

## Architecture

Each tenant receives:
- **Isolated VPC**: Dedicated VPC with non-overlapping CIDR blocks
- **Compute**: Lambda functions (256MB, 60s timeout, concurrency=10)
- **Storage**: DynamoDB tables and S3 buckets with tenant-specific KMS encryption
- **Security**: KMS CMKs per tenant with tenant-scoped IAM policies
- **Monitoring**: CloudWatch Logs with 30-day retention
- **Automation**: EventBridge rules for provisioning workflows

## Tenant Configuration

| Tenant ID     | VPC CIDR Block  |
|---------------|-----------------|
| acme-corp     | 10.0.0.0/16     |
| tech-startup  | 10.1.0.0/16     |
| retail-co     | 10.2.0.0/16     |

## Prerequisites

- Python 3.9+
- CDKTF 0.15+
- Pipenv
- AWS CLI configured
- Terraform 1.0+

## Installation

```bash
pipenv install
pipenv shell
cdktf get
