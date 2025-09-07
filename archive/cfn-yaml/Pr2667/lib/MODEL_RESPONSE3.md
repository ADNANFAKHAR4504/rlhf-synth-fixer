During deployment of the TapStack.yml CloudFormation template, the following error occurred:

An error occurred (ValidationError) when calling the CreateChangeSet operation: 
Parameters: [KeyPairName, DomainName, HostedZoneId, CertificateArn] must have values
Error: Process completed with exit code 254.


This prevented the stack from being created successfully.

Root Cause

The error occurs because several template parameters were defined as required but not supplied at deployment time:

KeyPairName (used for EC2 SSH access)

DomainName (used for Route 53 DNS record)

HostedZoneId (used to configure the DNS record in Route 53)

CertificateArn (used by CloudFront to enable HTTPS)

Without default values or conditions, CloudFormation requires all of these to be provided explicitly, causing the deployment to fail.

Corrected Implementation
Fixes Applied

KeyPairName

Made optional.

Added a condition: if left empty, CloudFormation will use AWS::NoValue and skip assigning a KeyPair.

DomainName, HostedZoneId, CertificateArn

Marked as optional with default placeholder values.

Conditions added so Route 53 and HTTPS configuration are skipped when these values are not supplied.

This allows the stack to deploy in a test/demo environment without requiring a domain or certificate.