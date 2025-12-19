# Infrastructure Compliance Validation System

Comprehensive CDKTF Python infrastructure analysis and compliance validation for multi-environment AWS deployments.

## Overview

This system analyzes synthesized CDKTF stacks for:

- **Security Group Analysis**: Detects overly permissive rules (0.0.0.0/0)
- **IAM Policy Analysis**: Identifies wildcard (*) permissions
- **Tag Compliance**: Validates Environment, Owner, CostCenter tags
- **Network Analysis**: Checks VPC CIDR overlaps across environments
- **Encryption Validation**: Verifies S3 and RDS encryption

## Quick Start

### 1. Synthesize Infrastructure

```bash
cdktf synth
```

### 2. Run Compliance Analysis

```bash
python lib/compliance_runner.py cdktf.out/stacks/TapStackdev/cdk.tf.json
```

### 3. Review Report

The system generates `compliance-report.json` with:
- Pass/fail status
- Compliance score (0-100)
- Detailed violations
- Remediation recommendations

## Exit Codes

- `0`: All compliance checks passed
- `1`: Violations detected (fail)

Perfect for CI/CD integration.

## Architecture

### Analyzers

- `SecurityGroupAnalyzer`: Security group rule validation
- `IamPolicyAnalyzer`: IAM policy least privilege check
- `TagComplianceValidator`: Mandatory tag enforcement
- `NetworkAnalyzer`: CIDR overlap detection
- `EncryptionValidator`: Encryption configuration check
- `ComplianceReporter`: JSON report generation

### Lambda Validation

Optional post-deployment validation Lambda function validates runtime infrastructure against compliance standards.

## Configuration

Set environment variables:

```bash
export COMPLIANCE_REPORT_PATH=custom-report.json
export ENVIRONMENT_SUFFIX=prod
export AWS_REGION=us-east-1
```

## Example Report

```json
{
  "summary": {
    "status": "FAIL",
    "compliance_score": 75.0,
    "total_violations": 3,
    "violations_by_severity": {
      "CRITICAL": 1,
      "HIGH": 1,
      "MEDIUM": 1
    }
  },
  "violations_by_category": {
    "security_groups": {
      "count": 1,
      "violations": [...]
    }
  },
  "recommendations": [...]
}
```

## Testing

Run unit tests:

```bash
pipenv run pytest tests/unit/ -v
```

Run integration tests (requires deployment):

```bash
pipenv run pytest tests/integration/ -v
```

## CI/CD Integration

```yaml
- name: Validate Infrastructure Compliance
  run: |
    cdktf synth
    python lib/compliance_runner.py cdktf.out/stacks/TapStackdev/cdk.tf.json
    if [ $? -ne 0 ]; then
      echo "Compliance validation failed"
      exit 1
    fi
```

## Remediation Guidance

The system provides specific remediation for each violation:

- **Security Groups**: Replace 0.0.0.0/0 with specific IP ranges
- **IAM Policies**: Use least privilege with specific actions/resources
- **Tags**: Add Environment, Owner, CostCenter to all resources
- **Network**: Use non-overlapping CIDR ranges
- **Encryption**: Enable AES256 or KMS encryption

## Compliance Score

Score calculation:
- Start: 100 points
- CRITICAL violation: -20 points
- HIGH violation: -10 points
- MEDIUM violation: -5 points
- Minimum: 0 points

Target score: 90+ (production-ready)
