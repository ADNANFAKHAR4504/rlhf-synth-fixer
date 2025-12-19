The stack represents a secure baseline environment with a single-AZ layout and an EC2 instance that uses a dynamic Amazon Linux 2 AMI from SSM. CloudTrail trail creation is intentionally skipped to avoid quota limits, while AWS Config can be turned on or off. All resources should be tagged with the provided EnvironmentName.

Confirm the parameters and conditions exactly as follows. EnvironmentName defaults to “prod” and is used for tagging and output export names. VpcCIDR along with four subnet CIDRs are provided. KeyName is optional for SSH and should only be applied when supplied. LatestAmiId must come from the SSM public parameter for Amazon Linux 2. EnableConfig accepts “true” or “false” and controls whether AWS Config resources are created. The template defines two conditions: HasKeyName to gate setting the instance KeyName and CreateConfig to gate all AWS Config resources.

Validate the KMS CMK named KmsKey with rotation enabled and a key policy granting account root full access. This key is used for encrypting the EC2 root volume and both S3 buckets.

Validate the networking. There is one VPC with DNS support and hostnames enabled. An Internet Gateway is attached. A single public route table contains a default route to the Internet Gateway and is associated to both public subnets. Four subnets exist: two public and two private. All subnets deliberately select the same Availability Zone using !Select \[0, !GetAZs ""], so the stack is single-AZ by design. Public subnets map public IPs on launch; private subnets do not.

Validate the security group named WebSG. It must allow inbound TCP 80 and 443 from 0.0.0.0/0 and allow all outbound traffic.

Validate the EC2 instance. It runs t3.micro in PublicSubnet1, attaches WebSG, uses the SSM-provided AMI, and sets the KeyName only when HasKeyName is true. The root EBS volume is 8 GiB, encrypted with the KmsKey. Instance tags include Name composed from EnvironmentName and the Environment tag itself.

Validate storage. SecureBucket must enable versioning and use SSE-KMS with the same KmsKey. TrailBucket must also use SSE-KMS with the KmsKey. Its bucket policy must include two statements allowing the CloudTrail service to get the bucket ACL and to put objects to the AWSLogs path for the account with the condition s3\:x-amz-acl set to bucket-owner-full-control. No CloudTrail trail resource is created in this template.

Validate AWS Config resources only when CreateConfig is true. In that case a role assumed by config.amazonaws.com is created using the AWS managed service-role policy for Config, and a default configuration recorder is enabled to record all supported resource types including global types.

Validate monitoring. A CloudWatch alarm named UnauthorizedApiCallsAlarm monitors the AWS/CloudTrail metric UnauthorizedAPICalls with a five-minute period, a single evaluation period, and a threshold of at least one. No alarm actions are configured in this template.

Finally, confirm the outputs. Networking exports include VPC ID, Internet Gateway ID, all four subnet IDs, the public route table ID, and the WebSG ID. EC2 exports include the instance ID, its Availability Zone, and both private and public IPs. S3 exports include SecureBucket name and ARN and TrailBucket name and ARN. KMS exports include key ID and ARN. When CreateConfig is true, also export the Config role ARN and the recorder name. Export the CloudWatch alarm name as well.
