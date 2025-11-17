Functional scope (build everything new):

* Produce a single CloudFormation template named TapStack.yml that provisions a brand-new, production-grade stack in us-east-1 without referencing or importing any pre-existing resources.
* Implement IAM, networking (VPC, subnets, routing), EC2 with detailed monitoring, Security Groups (no port 22 from public internet), RDS with KMS encryption, S3 with default encryption and public access blocks, ElastiCache with encryption-in-transit, EBS volume encryption using default KMS key, centralized logging (CloudTrail, CloudWatch Logs, VPC Flow Logs), and AWS Config with appropriate managed rules for continuous compliance.
* Ensure least-privilege IAM policies, tiered subnet isolation, and tagging across all resources.

Constraints and guardrails:

* Region hard-enforced to us-east-1; template must include a Condition that fails deployment if the target region is not us-east-1.
* All resources must be tagged with environment=production and Name including the ENVIRONMENT_SUFFIX.
* No Security Group must allow ingress on port 22 from 0.0.0.0/0. Prefer Session Manager over SSH.
* RDS storage and snapshots encrypted using a KMS CMK (created in this stack).
* S3 buckets must enable server-side encryption by default, enforce bucket policies that block all public access, and require TLS.
* ElastiCache (Redis) must enable encryption in transit and at rest.
* EBS volumes must be encrypted, and account-level default EBS encryption must be enabled via CloudFormation.
* Logging and auditing must include: CloudTrail (multi-AZ, log to encrypted S3 with log file validation), CloudWatch Logs destinations for CloudTrail and VPC Flow Logs, and Config Recorder + Delivery Channel.
* Use VPC Flow Logs for all subnets.
* Use least-privilege IAM roles/policies; no wildcard “*” actions or resources unless strictly necessary and justified with Conditions or resource-level constraints.

Template structure and expectations:

* Write TapStack.yml strictly in YAML (not JSON). Use proper YAML syntax and indentation.
* Include full CloudFormation sections: AWSTemplateFormatVersion, Description, Metadata, Mappings (if needed), Parameters, Rules (optional), Conditions, Resources, Outputs.
* Provide complete variable declarations (Parameters) with sensible defaults where appropriate and Types/AllowedValues/AllowedPattern. Include ENVIRONMENT_SUFFIX parameter (e.g., dev/staging/prod) and apply it to every logical resource name and tag to avoid name collisions.
* Do not reference or rely on external parameters or existing infrastructure; the template must create everything it needs (e.g., KMS keys, S3 buckets for logs, CloudWatch Log Groups, IAM roles/policies, VPC/subnets/NATs, Cache Subnet Groups, DB Subnet Groups).
* Ensure Outputs expose all critical identifiers/ARNs/Names for post-deploy use (VPC ID, Subnet IDs, Security Group IDs, EC2 Instance IDs, RDS Endpoint, ElastiCache Primary Endpoint, Log Bucket Name/ARN, KMS Key ARN, CloudTrail ARN, Config Recorder name, etc.).

Required Parameters (non-exhaustive, include all with Types, Defaults, and AllowedValues where relevant):

* EnvironmentSuffix (String; e.g., prod; used in every Name/Tag).
* VPCCIDR (Default 10.0.0.0/16), PublicSubnet1CIDR, PublicSubnet2CIDR, PrivateAppSubnet1CIDR, PrivateAppSubnet2CIDR, PrivateDataSubnet1CIDR, PrivateDataSubnet2CIDR.
* EC2KeyPairName (String; may be unused if using Session Manager only—document accordingly).
* InstanceType (e.g., t3.small) with AllowedValues.
* RDS: DBEngine (aurora-mysql or postgres), DBInstanceClass, DBName, DBUsername (NoEcho false), DBPassword (NoEcho true, MinLength), AllocatedStorage/StorageType, MultiAZ (true).
* ElastiCache: NodeType, EngineVersion supporting TLS, NumCacheNodes/ClusterMode settings as appropriate.
* LogRetentionDays (Number; default 90).
* S3AccessLoggingToggle (AllowedValues: Enabled/Disabled).
* CreateBastionEC2 (AllowedValues: true/false; default false; if true, restrict SG to a VPCE/known CIDR, not 0.0.0.0/0).

Conditions:

* IsUSEast1: Fn::Equals to enforce us-east-1; fail fast with a Rule/Condition and a dummy resource using Fn::If to prevent deployment otherwise.
* CreateAccessLogs: based on S3AccessLoggingToggle.
* CreateBastion: based on CreateBastionEC2 (still must not open 22 to public).

Networking:

* 1 VPC with DNSHostnames/DNSSupport enabled.
* 2 public subnets (load balancers/NAT) and at least 4 private subnets split by tier: private-app (EC2) and private-data (RDS/ElastiCache). All subnets across two AZs.
* Internet Gateway + 2 NAT Gateways (one per AZ) with proper route tables.
* VPC Endpoints (Gateway+Interface) for S3, KMS, CloudWatch Logs, EC2, SSM, and SSM Messages.

Security Groups:

* Separate SGs per tier: ALB/ELB (if created), App EC2, RDS, ElastiCache, and VPC Endpoints.
* No ingress 22 from public; ingress rules must be least privilege (e.g., App SG to DB SG on 5432/3306; App SG to Cache SG on 6379 TLS only).
* Egress restricted where possible; otherwise document justification.

Compute:

* EC2 Auto Scaling Group or single EC2 (as required) in private-app subnets with detailed monitoring enabled (Monitoring: true), IMDSv2 required, EBS optimized, and EBS volumes encrypted. Use SSM Agent and Instance Profile with least-privilege.
* Set account-level default EBS encryption via AWS::EC2::EBSEncryptionByDefault.

Datastores:

* RDS in private-data subnets, Multi-AZ, storage encrypted with a CMK created in this stack, Enhanced Monitoring optional, deletion protection enabled, copy tags to snapshots.
* DBSubnetGroup and Option/Parameter Groups as needed with TLS enforced.
* ElastiCache (Redis) in private-data subnets with CacheSubnetGroup; encryption-in-transit and at rest enabled; AUTH token set via NoEcho parameter; minimum engine version that supports TLS.

Storage:

* S3 Log Bucket (for CloudTrail/Access logs) with default SSE-S3 or SSE-KMS (use CMK), public access block (all true), strict bucket policies (tls/secure transport required, no public principals), object ownership enforced, lifecycle to transition logs if desired.
* Any workload buckets also encrypted and blocked from public access.

Auditing, logging, and monitoring:

* CloudTrail (multi-AZ, multi-region optional) writing to the log bucket with log file validation enabled; trail also to CloudWatch Logs via KMS-encrypted Log Group.
* VPC Flow Logs to CloudWatch Logs (KMS-encrypted) for all subnets and/or to S3 log bucket.
* CloudWatch Log Groups for applications with KMS encryption and retention of LogRetentionDays.

IAM (least privilege):

* One or more IAM Roles with inline/managed policies limited to exact resources (e.g., permissions for SSM, CloudWatch Logs, S3 PutObject to specific log bucket prefixes, KMS decrypt/encrypt on created CMKs, Describe* as required).
* Deny statements for wildcard actions where feasible; enforce MFA for privileged actions if applicable.
* Instance Profile for EC2 limited to SSM, CloudWatch, and required S3/KMS scopes.

KMS:

* Dedicated CMK for data services (RDS/S3/CloudWatch Logs); rotation enabled; key policies granting least-privilege principals created in this stack; deny insecure principals.

AWS Config:

* Recorder and Delivery Channel to the log bucket; leverage managed rules:

  * CLOUD_TRAIL_ENABLED
  * EBS_ENCRYPTED_VOLUME
  * EBS_DEFAULT_ENCRYPTION_ENABLED
  * EC2_INSTANCE_DETAILED_MONITORING_ENABLED
  * RDS_STORAGE_ENCRYPTED
  * RDS_SNAPSHOTS_PUBLIC_PROHIBITED
  * S3_BUCKET_PUBLIC_READ_PROHIBITED
  * S3_BUCKET_PUBLIC_WRITE_PROHIBITED
  * S3_BUCKET_SSL_REQUESTS_ONLY
  * VPC_FLOW_LOGS_ENABLED
  * ELASTICACHE_REDIS_ENCRYPTION_IN_TRANSIT_ENABLED
  * RESTRICT_SSH (should pass due to no 22 from 0.0.0.0/0)
  * IAM_POLICY_NO_STATEMENTS_WITH_ADMIN_ACCESS
  * KMS_CMK_NOT_SCHEDULED_FOR_DELETION
* Include Remediation parameters or at minimum Outputs/Docs on how to remediate.

Naming and tagging:

* Every resource Name and Tag must include: Name: <LogicalPurpose>-${EnvironmentSuffix}; environment: production; application: TapStack.
* Propagate tags to child resources (e.g., RDS snapshots, EBS volumes).

Outputs (non-exhaustive; include all relevant):

* VPCId, PublicSubnetIds, PrivateAppSubnetIds, PrivateDataSubnetIds
* SecurityGroupIds per tier
* EC2InstanceId/ASGName
* RDSEndpointAddress, RDSClusterArn/InstanceArns
* ElastiCachePrimaryEndpoint
* LogBucketName/Arn
* KmsKeyArn(s)
* CloudTrailArn, CloudWatchLogGroupArns
* ConfigRecorderName and DeliveryChannelName
* VPCEndpointIds

Acceptance criteria:

* TapStack.yml is valid YAML, cfn-lint clean, and deploys successfully in us-east-1 creating all resources without manual prerequisites.
* No public SSH (22/tcp) from internet; Config rule RESTRICT_SSH passes.
* All data at rest is encrypted (EBS, RDS, S3, CloudWatch Logs, CloudTrail).
* ElastiCache enforces TLS (in-transit) and at-rest encryption.
* S3 buckets are private with block public access enabled; bucket policies enforce TLS.
* EC2 detailed monitoring is enabled; AWS Config rules listed above evaluate to COMPLIANT post-deploy.
* All resources include the environment=production tag and Name with ENVIRONMENT_SUFFIX applied.
* The template fails fast if deployed in any region other than us-east-1.

Deliverable:

* A single YAML file named TapStack.yml containing complete Parameters, Conditions, Resources, and Outputs that implements everything described above, with comments explaining key security decisions and no placeholders left unresolved.