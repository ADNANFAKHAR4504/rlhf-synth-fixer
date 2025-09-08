Common failure modes and how to fix them
1) AMI SSM alias not found (ChangeSet FAILED)

Symptom:
Parameters: [ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp3] cannot be found

Cause:
Using an SSM parameter alias that doesn’t exist in us-east-1.

Fix:
Use an initialized parameter of type AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> with default
/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2. Point Launch Template ImageId to that parameter.

2) KeyPair validation failure (Stack ROLLBACK)

Symptom:
Parameter validation failed: parameter value for parameter name KeyName does not exist

Cause:
A KeyPair name was supplied that doesn’t exist in us-east-1.

Fix:
Make KeyName optional with default '' and conditionally omit it from the Launch Template when empty. If SSH is needed, create/import the KeyPair in us-east-1 and pass the exact name.

3) Invalid RDS engine version

Symptom:
'8.0.xx' is not one of [...]

Cause:
Choosing an engine version not allowed by CloudFormation’s schema.

Fix:
Use a listed, current value such as 8.0.43 (or another value from the allowed set).

4) UpdatePolicy placed under Properties

Symptom:
E3002 Additional properties are not allowed ('UpdatePolicy' was unexpected)

Cause:
UpdatePolicy must be a top-level attribute of the resource, not under Properties.

Fix:
Move the UpdatePolicy block to the same level as Type/Properties for the ASG.

5) Missing UpdateReplacePolicy with DeletionPolicy

Symptom:
W3011 Both 'UpdateReplacePolicy' and 'DeletionPolicy' are needed

Fix:
Add UpdateReplacePolicy: Snapshot alongside DeletionPolicy: Snapshot for stateful resources (RDS).

6) S3 access logs not delivered

Symptoms:
No ALB logs in the bucket; or access denied.

Causes & Fixes:

Wrong principal: use 127311923021 for us-east-1 ELB log delivery.

Missing ACL condition: include s3:x-amz-acl = bucket-owner-full-control.

Wrong bucket path: use arn:aws:s3:::${LogsBucket}/alb-logs/AWSLogs/${AWS::AccountId}/*.

7) Name collisions or length limits

Cause:
Hardcoding resource names (ALB, TG, S3 bucket) can hit uniqueness/length limits.

Fix:
Let CloudFormation generate names or keep names short and unique. Avoid embedding AccountId/Region into resource names unless required.

8) Insufficient NAT/EIP quotas

Symptom:
NAT/EIP creation fails.

Fix:
Ensure account has capacity for 2 NAT Gateways and 2 EIPs in us-east-1, or temporarily reduce to one NAT (understanding that reduces HA).

Quick triage checklist

Is the AMI SSM alias valid in us-east-1?

Is KeyName empty or a real KeyPair name in us-east-1?

Does cfn-lint pass with zero errors?

Are RDS engine version and DB settings valid?

Is ALB log delivery principal (127311923021) correct and ACL condition present?