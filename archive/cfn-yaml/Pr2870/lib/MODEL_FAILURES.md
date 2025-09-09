This document summarizes common misconfigurations, errors, and lint violations that can occur when building a CloudFormation template for a secure and scalable AWS infrastructure. Each issue is explained along with its impact and why it fails compliance or deployment.

Common Failures & Root Causes
1. Hardcoded Secrets via Parameters

Example

Parameters:
  DBPassword:
    NoEcho: true
    Type: String


and

MasterUserPassword: !Ref DBPassword


Failure Reason

Triggers W1011 Use dynamic references over parameters for secrets.

Secrets are exposed in CloudFormation events, logs, and change sets.

Requires manual pre-step to provide passwords → insecure and error-prone.

2. Missing Secrets Manager Resource

Example

MasterUserPassword: '{{resolve:secretsmanager:myapp/rds/master:SecretString:password}}'


Failure Reason

Caused CREATE_FAILED rollback with ResourceNotFoundException.

The template assumed the secret already exists, but it wasn’t created.

Deployment fails unless manual secret creation is done beforehand.

3. Hardcoded AMI IDs

Example

ImageId: ami-0c55b159cbfafe1f0


Failure Reason

AMI IDs change over time or differ by region.

Causes Auto Scaling Group failure:

You must use a valid fully-formed launch template.
The image id does not exist.


Not portable across regions or accounts.

4. Misuse of SSM Parameter in Resources

Example (incorrect)

LatestAmiId:
  Type: AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>
  Default: /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2


declared under Resources, not Parameters.

Failure Reason

Triggers linting errors:

E3006 Resource type 'AWS::SSM::Parameter::Value<AWS::EC2::Image::Id>' does not exist

E3001 Additional properties are not allowed ('Default' was unexpected)

Prevents deployment.

5. Missing Tags on Security Resources

Example

PublicSG:
  Type: AWS::EC2::SecurityGroup
  Properties:
    GroupDescription: Allow HTTP/HTTPS


Failure Reason

Violates requirement that all security resources be tagged with Environment:Prod.

Reduces compliance visibility and audit readiness.

6. Public RDS or No Encryption

Example

PubliclyAccessible: true
StorageEncrypted: false


Failure Reason

Violates security requirement for RDS to be private and encrypted.

Data at rest not protected with KMS.

Insecure in production, fails compliance (HIPAA, PCI, SOC2).

7. Incomplete Outputs

Example

Outputs:
  VPCId:
    Value: !Ref MyAppVPC


Failure Reason

Only exposes VPC ID.

Other critical identifiers (subnets, SGs, IAM ARNs, RDS endpoint, S3 bucket) are missing.

Makes integration with other stacks/tools harder.

Summary of Failures

Secrets in Parameters → insecure & flagged by linter.

Missing Secrets Manager resource → rollback errors.

Hardcoded AMIs → broken ASG launches.

Misused SSM parameter type → lint errors.

Unencrypted or public RDS → insecure DB.

Missing tags → fails governance & compliance checks.

Weak Outputs → poor reusability and visibility.