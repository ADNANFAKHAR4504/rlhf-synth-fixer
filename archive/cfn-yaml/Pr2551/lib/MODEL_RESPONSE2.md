Overview

This response addresses the CloudFormation linting errors identified in TapStack.yml and provides a corrected, production-ready template. The environment continues to enforce strict security and compliance controls (encryption, least privilege, logging, monitoring, MFA, etc.) while ensuring compatibility with CloudFormation’s resource specification.

Fixes Applied

Security Group Egress Rule

Removed FromPort and ToPort when IpProtocol: -1.

Ensures compliance with AWS specification and avoids warnings.

SSM Parameter Store

CloudFormation only allows String and StringList as valid types.

Changed parameter type from SecureString to String.

Added explicit note to manage secrets securely via AWS CLI/SDK with SecureString + KMS in post-deployment.

Invalid KeyId Property

Removed unsupported KeyId from AWS::SSM::Parameter.

Documented use of KMS externally for sensitive data encryption.

CloudTrail Requirement

Added missing IsLogging: true property to AWS::CloudTrail::Trail.

Ensures CloudTrail logging starts automatically upon deployment.

Key Features (Still Maintained)

IAM least privilege enforced for EC2, Lambda, and Config.

KMS CMK used for S3, EBS, and RDS encryption.

MFA enforcement for IAM users with console access.

EC2 instances use encrypted EBS volumes.

RDS instances in private subnets with encryption enabled.

CloudTrail enabled multi-region with validation.

AWS Config monitors security group changes.

CloudWatch Alarms detect unauthorized API calls.

Centralized logging with CloudWatch Logs.

AWS Shield Advanced for DDoS mitigation.

Compliance Alignment

CIS AWS Foundations Benchmark: Secure VPC, least privilege, restricted SGs, CloudTrail, Config.

PCI DSS: Encryption in transit/at rest, MFA, logging.

SOC 2: Monitoring, auditability, centralized log retention.

Outputs

The corrected template still provides key outputs:

VPC ID

Subnet IDs (public and private)

S3 Bucket ARN

RDS Endpoint

CloudTrail ARN

KMS Key ARN