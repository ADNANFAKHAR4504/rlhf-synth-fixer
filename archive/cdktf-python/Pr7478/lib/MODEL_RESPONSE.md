# Model Response - Initial Attempt with Failures

This document represents the initial attempt to create payment processing infrastructure that contained 11 documented failures.

## Initial Infrastructure Code (Flawed)

```python
"""
Payment Processing Infrastructure - INITIAL FLAWED VERSION
This code contains multiple critical issues documented below.
"""

from constructs import Construct
from cdktf import App, TerraformStack, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.db_instance import DbInstance

class PaymentStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # ISSUE 2: Circular S3Backend dependency
        S3Backend(self,
            bucket="payment-terraform-state-dev",  # References bucket created below
            key="terraform.tfstate",
            region="us-east-1"
        )

        # ISSUE 4: Multi-region configuration that won't work
        regions = ["us-east-1", "us-west-2", "eu-west-1"]
        for region in regions:
            AwsProvider(self, f"aws_{region}", region=region, alias=region)

        # ISSUE 1: Missing environmentSuffix - hardcoded names
        # ISSUE 8: Hardcoded 3-environment deployment instead of parameterized
        for env in ["dev", "staging", "prod"]:
            vpc = Vpc(
                self, f"vpc_{env}",
                cidr_block="10.0.0.0/16",
                tags={"Name": f"payment-vpc-{env}"}  # Missing environmentSuffix
            )

            # ISSUE 6: NAT Gateway in ALL environments (cost waste)
            nat_gateway = NatGateway(
                self, f"nat_{env}",
                tags={"Name": f"payment-nat-{env}"}
            )

            # ISSUE 9: Multi-AZ without AZ validation
            for i in range(2):
                subnet = Subnet(
                    self, f"subnet_{env}_{i}",
                    vpc_id=vpc.id,
                    cidr_block=f"10.0.{i}.0/24",
                    availability_zone=f"us-east-1{chr(97+i)}"  # Hardcoded, not validated
                )

            # ISSUE 5: Hardcoded database password (security violation)
            db = DbInstance(
                self, f"db_{env}",
                identifier=f"payment-db-{env}",  # Missing environmentSuffix
                engine="postgres",
                username="admin",
                password="hardcoded_password_123",  # CRITICAL SECURITY ISSUE
                vpc_security_group_ids=[]
            )

            # ISSUE 3: Lambda with only .py source (no .zip deployment package)
            # ISSUE 10: Lambda VPC without explicit security group
            # ISSUE 11: CloudWatch without KMS encryption
            lambda_fn = LambdaFunction(
                self, f"lambda_{env}",
                function_name=f"payment-webhook-{env}",  # Missing environmentSuffix
                filename="lib/payment_webhook.py",  # Wrong! Should be .zip
                handler="payment_webhook.handler",
                runtime="python3.11",
                role=None,  # Missing IAM role
                vpc_config={
                    "subnet_ids": [],
                    "security_group_ids": []  # No explicit security group
                }
            )

# ISSUE 7: No stack outputs for integration tests
app = App()
PaymentStack(app, "payment-processing")
app.synth()
```

## Critical Issues in This Code

### 1. Missing environmentSuffix Throughout
Every resource name hardcodes the environment without a unique suffix:
- vpc-dev, not vpc-dev-e4k2d5l6
- lambda-dev, not lambda-dev-e4k2d5l6
- db-dev, not db-dev-e4k2d5l6

### 2. Circular S3Backend Dependency
The S3Backend references a bucket that needs to be created first, but it's declared before the bucket exists, creating a circular dependency.

### 3. Lambda Missing .zip Deployment Package
Lambda function references .py source file directly instead of a .zip deployment package, which will fail during deployment.

### 4. Multi-Region Misconfiguration
CDKTF pattern with multiple providers and regions won't work as designed. Should use single-region parameterized approach.

### 5. Hardcoded Database Password
Database password is hardcoded in code (security violation). Should use AWS Secrets Manager.

### 6. NAT Gateway Cost Waste
NAT Gateway deployed in ALL environments (dev, staging, prod), costing approximately 194/month unnecessarily. Should be conditional (prod only).

### 7. No Stack Outputs
Missing all TerraformOutput declarations, making integration tests impossible.

### 8. Hardcoded 3-Environment Loop
Infrastructure hardcodes deployment to dev/staging/prod in a loop instead of being parameterized for single environment deployment.

### 9. Multi-AZ Without Validation
Hardcodes availability zones without using DataAwsAvailabilityZones data source for validation.

### 10. Lambda VPC Without Security Group
Lambda VPC configuration has empty security_group_ids array instead of explicitly creating and attaching a security group.

### 11. CloudWatch Without KMS Encryption
CloudWatch log groups are not encrypted with KMS keys.

## Process Issues

### IDEAL_RESPONSE.md Was Empty
The previous attempt had IDEAL_RESPONSE.md with only placeholder text instead of the corrected code.

### PROMPT.md at Root Level
PROMPT.md was placed at root level instead of in lib/ directory.

### Modified Forbidden Files
The previous attempt modified scripts/deploy.sh which is in a forbidden location (.claude/ and scripts/ should not be modified).

## Summary

This initial attempt demonstrates 11 distinct failures across critical (4), high (4), medium (2), and low (1) priority categories, plus process failures. All issues have been fixed in lib/main.py.