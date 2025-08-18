you are a senior Cloud Security Architect at a financial services company, tasked with creating a secure, compliant, and well-audited AWS environment. Your goal is to develop a single, comprehensive AWS CloudFormation template in YAML format that provisions a set of resources in the us-east-1 region, adhering to strict security and operational best practices.

Core Task:

Create a validated and tested CloudFormation template that deploys a secure environment, demonstrating expertise in security-as-code principles.

Detailed Security and Configuration Requirements:

Regional Deployment: All resources must be explicitly deployed in the us-east-1 region.

Data Encryption:

RDS: Create an AWS::KMS::Key to be used for server-side encryption. The AWS::RDS::DBInstance must be encrypted using this customer-managed KMS key. The KMS key policy should be configured with the principle of least privilege, allowing only the necessary permissions for the RDS service to use the key.

S3: Provision two AWS::S3::Bucket resources. Both buckets must have server-side encryption enabled using AES256 as the default encryption algorithm.

Data Integrity and Availability:

S3 Buckets: For both S3 buckets, enable VersioningConfiguration to ensure that all object versions are preserved, protecting against accidental deletions.

RDS: Configure the AWS::RDS::DBInstance to have a BackupRetentionPeriod of 30 days.

EC2: Provision an AWS::EC2::Instance with automatic recovery enabled. This should be achieved by associating a AWS::CloudWatch::Alarm with a recovery action on a StatusCheckFailed metric. The instance should be launched using the latest available Amazon Linux 2023 AMI. Use a dynamic lookup for the AMI ID to ensure the template always deploys the most current version.

Access Control (Least Privilege):

IAM: Define an AWS::IAM::Role and an AWS::IAM::InstanceProfile for the EC2 instance. The associated AWS::IAM::Policy should follow the principle of least privilege, granting only the minimum permissions required for the instance to function (e.g., read-only access to a specific S3 bucket, if applicable). The template should not require CAPABILITY_NAMED_IAM to be deployed.

Security Posture:

Security Group: Create an AWS::EC2::SecurityGroup that is configured to only allow inbound HTTPS traffic (TCP port 443) from any IP address (0.0.0.0/0). All other inbound traffic should be denied by default.

Monitoring and Logging:

Provision an AWS::CloudTrail::Trail to monitor and log all API calls across your AWS account.

The CloudTrail logs must be securely stored in one of the S3 buckets you created earlier.

Ensure the S3 bucket policy for the logs bucket is configured to allow CloudTrail to write logs to it.

Template and Naming Standards:

Consistent Naming: All resources must follow a consistent naming convention, such as 'FinancialApp-Prod-ResourceType', where 'FinancialApp' and 'Prod' are parameters.

Well-Commented: The template must be well-documented with comments explaining the purpose of each resource and configuration.

Outputs: The template's Outputs section must export the ARN of the KMS key, the names of the S3 buckets, and the Security Group ID.

Expected Output:

A single, valid, and well-commented YAML CloudFormation template named secure-financial-services-env.yaml. The template must pass all CloudFormation validation checks and deploy a secure, compliant environment without errors.
