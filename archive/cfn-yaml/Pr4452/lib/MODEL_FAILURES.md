Summary of Model Failures & Fixes

This file documents major errors and failures encountered during the implementation, linting, unit testing, and deployment of the TapStack CloudFormation stack.
It serves as a root-cause analysis and playbook for future debugging and CI/CD stability.

1. Linting Errors (cfn-lint)
1.1 Duplicate Metadata Section

Error

E0000 Duplicate found 'Metadata' (line 35)


Cause
Multiple Metadata blocks existed in lib/TapStack.yml.

Fix

Merged multiple Metadata sections into a single block.

Retained cfn-outputs metadata only in one place.

1.2 Unused Parameters / Mappings / Conditions

Error

W2001 Parameter SSHLocation not used.
W7001 Mapping 'ProductionTags' is defined but not used.
W8001 Condition IsUsWest2 not used.


Cause
Legacy or placeholder template elements not referenced anywhere.

Fix

Removed unused mappings and conditions.

Ensured SSHLocation parameter is actually used in security group ingress rules.

1.3 RegionMap Mapping Validation

Error

E1011 'AMI' is not one of ['us-west-2'] for mapping 'RegionMap'


Cause
Invalid or mismatched RegionMap keys.

Fix

Removed the unused mapping or aligned keys with valid AWS region names.

Revalidated with cfn-lint after cleanup.

1.4 Invalid Resource Type – TargetGroupAttachment

Error

E3006 Resource type 'AWS::ElasticLoadBalancingV2::TargetGroupAttachment' does not exist in 'us-east-1'


Cause
TargetGroupAttachment is not a valid CloudFormation resource.

Fix

Removed TargetGroupAttachment resource completely.

Attached the EC2 instance to the target group using the Targets property on AWS::ElasticLoadBalancingV2::TargetGroup.

1.5 Region Support – BucketOwnershipControls

Error

E3006 Resource type 'AWS::S3::BucketOwnershipControls' does not exist in 'us-east-1'


Cause
AWS::S3::BucketOwnershipControls is not available in some region specs (for example, us-east-1 in cfn-lint).

Fix (Option A – implemented)

Removed the separate ALBAccessLogBucketOwnershipControls resource.

Added OwnershipControls directly on ALBAccessLogBucket.

Set IgnorePublicAcls: false to allow ALB to deliver logs with bucket-owner-full-control ACL.

Snippet

ALBAccessLogBucket:
  Type: AWS::S3::Bucket
  Condition: DeployInTargetRegion
  Properties:
    BucketEncryption:
      ServerSideEncryptionConfiguration:
        - ServerSideEncryptionByDefault:
            SSEAlgorithm: AES256
    OwnershipControls:
      Rules:
        - ObjectOwnership: BucketOwnerPreferred
    PublicAccessBlockConfiguration:
      BlockPublicAcls: true
      BlockPublicPolicy: true
      IgnorePublicAcls: false   # required for ALB access logs
      RestrictPublicBuckets: true
    Tags:
      - Key: Environment
        Value: Production
      - Key: iac-rlhf-amazon
        Value: "true"


This avoided the region support issue while maintaining correct ALB behavior.

2. Unit Test Failures
2.1 Template Parsing – Resources Undefined

Error

TypeError: Cannot read properties of undefined (reading 'Resources')


Cause
Resources was accessed before the YAML template was fully parsed.

Fix

Moved resource extraction inside beforeAll.

Added fallback guards for missing keys in tests.

2.2 YAML Tag Parsing

Error

YAMLException: Specified list of YAML types (or a single Type object) contains a non-Type object.


Cause
Incorrect handling of CloudFormation intrinsic functions in unit test parsing.

Fix

Removed faulty schema extension.

Replaced with regex-based stripping of !Ref, !Sub, !GetAtt in the unit test loader.

2.3 Assertion Mismatch – Intrinsic Function Normalization

Examples

Expected: {"Ref": "PrivateSubnetA"}
Received: "PrivateSubnetA"

Expected: ArrayContaining [{"Key": "access_logs.s3.bucket", "Value": {"Ref": "ALBAccessLogBucket"}}]
Received: [{"Key": "access_logs.s3.bucket", "Value": "ALBAccessLogBucket"}]


Cause
Intrinsic references were flattened during parsing.

Fix

Added normalizeRefValue helper in tests.

Adjusted assertions to handle both intrinsic and raw string forms consistently.

3. Deployment Failures (ChangeSet)
3.1 Missing Parameter Value – KeyName

Error

Parameters: [KeyName] must have values


Cause
KeyName was required in the template, but CI didn’t supply a value.

Fix

Made KeyName optional using:

KeyName: !If [ HasKeyName, !Ref KeyName, !Ref "AWS::NoValue" ]


Set default to empty string in Parameters.

CI can now skip this parameter safely.

3.2 Invalid Resource – TargetGroupAttachment

Error

Template format error: Unrecognized resource types: [AWS::ElasticLoadBalancingV2::TargetGroupAttachment]


Cause
Unsupported resource type in CloudFormation.

Fix

Removed the resource and attached EC2 to the target group via Targets.

3.3 ALB Access Denied for Bucket

Error

Access Denied for bucket: ... Please check S3bucket permission


Cause
ALB lacked permission to write access logs to the S3 bucket.

Fix

Added BucketOwnershipControls (moved inline).

Added proper BucketPolicy for logdelivery.elasticloadbalancing.amazonaws.com with required permissions and ACL conditions.

Ensured IgnorePublicAcls: false.

4. Final State After Fixes

cfn-lint clean with no blocking errors.

Unit tests stable and passing with proper intrinsic normalization.

ALB successfully writes logs to S3 bucket.

CI deploy works without requiring KeyName.

Removed unsupported resource types.

Region compatibility issues resolved with inline BucketOwnershipControls.

References

CloudFormation Linter (cfn-lint)

ALB Access Logs – S3 Bucket Policy Requirements

Targets Property on TargetGroup

OwnershipControls for ALB Logs

AWS::ElasticLoadBalancingV2::LoadBalancer