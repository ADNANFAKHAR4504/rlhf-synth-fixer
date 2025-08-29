You are an expert AWS CloudFormation architect specializing in security and compliance, working for a fintech company preparing for a SOC 2 audit.

Task: Author a complete, production-grade AWS CloudFormation template in YAML that codifies a highly secure and compliant infrastructure environment in the us-east-1 region. The template must be idempotent, reusable across AWS Organizations, and strictly adhere to all specified security constraints.

Core Requirements & Implementation Details: Your template must explicitly define and configure the following AWS resources and services to meet these exact specifications:

S3 Encryption: All S3 buckets created must have default encryption enabled using a customer-managed KMS key (AWS-KMS). Include a BucketEncryption property.
EC2 IAM Roles: Any EC2 instance must launch with an associated IAM Instance Profile. The attached IAM Role must have a minimal, scoped-down permission policy. Do not use wildcards (*) in the Action or Resource fields of the role's policy. Assume the instance needs read-only access to a specific S3 bucket and write access to CloudWatch Logs.
CloudTrail: Create a multi-region CloudTrail trail that logs management events, data events for S3 (all buckets), and Lambda execution events. The trail must be integrated with CloudWatch Logs for real-time analysis. Log files must be stored in an S3 bucket with appropriate lifecycle policies and MFA Delete enabled (hint: this is often a manual post-creation step but note the intent).
IAM User MFA: This is a runtime requirement, not something easily enforced purely in a single CloudFormation template. Therefore, your template must include an AWS Config Managed Rule (e.g., IAM_USER_MFA_ENABLED) that will check for and report on this compliance state. Also, include a CloudWatch Events rule to trigger an SNS notification for non-compliant resources.
RDS in VPC: Any RDS database instance (AWS::RDS::DBInstance) must explicitly declare DBSubnetGroupName property, linking it to a VPC subnet group you define in the template.
Security Groups: All security group resources (AWS::EC2::SecurityGroup) must be meticulously configured. Ingress rules must never allow 0.0.0.0/0 on any port except 80 and 443. For SSH (port 22), restrict access to a specific corporate IP range (e.g., 203.0.113.0/24) using a template Parameter.
KMS: Create a customer-managed KMS key (AWS::KMS::Key) with a sensible key policy allowing core services (e.g., CloudTrail, EBS, S3) to use it. Reference this key for encrypting resources like S3 buckets, EBS volumes, and RDS instances.
WAF & CloudFront: Define a WebACL (AWS::WAFv2::WebACL) with a managed rule group (e.g., AWSManagedRulesCommonRuleSet). Create a CloudFront distribution (AWS::CloudFront::Distribution) and associate the WebACL with it using the WebACLId property.
Tagging: Every resource definition in the template must include a Tags property with, at a minimum, a tag key environment and value production. Use CloudFormation Stack-level tags or a AWS::CloudFormation::Stack resource to propagate tags where possible.
ELB SSL: Any Application or Network Load Balancer (AWS::ElasticLoadBalancingV2::LoadBalancer) must have a listener configured for HTTPS (port 443). You must define an AWS::ElasticLoadBalancingV2::Listener resource with Protocol: HTTPS and SslPolicy set to a modern policy (e.g., ELBSecurityPolicy-TLS13-1-2-2021-06). Reference a certificate from ACM.
Public EC2 Instances: Do not define any standalone EC2 instances with public IPs. If an EC2 instance is defined, it must be placed in private subnets and accessed only through the load balancers created in point #10.
AWS Config: Enable AWS Config for the entire region. Create an AWS::Config::ConfigurationRecorder and an AWS::Config::DeliveryChannel to report data to an S3 bucket. Ensure the required IAM roles and policies are created.
CloudWatch Alarms: Create a CloudWatch::Alarm that triggers based on the metric filter for the UnauthorizedOperation or AccessDenied events from the CloudTrail log group. Configure this alarm to send notifications to an SNS topic.
AMI Patching: For any EC2 instance, use a Parameters section to allow the user to input the latest AMI ID. Use a Mapping or SSM Parameter lookup (e.g., {{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2:1}}) to dynamically fetch the most recent AMI, ensuring it is patched to the latest level.
Naming & Structure:

All resource logical and physical names must be prefixed with prod-.
The template must be well-structured using Parameters, Mappings, Conditions, Resources, and Outputs sections.
Use parameters for configurable values like corporate IP range, key administrators, and notification email addresses to ensure reusability.
Output: Generate a single, valid, and comprehensive YAML file named production-security.yml. The template must successfully pass the aws cloudformation validate-template command and a cfn-lint check.

Context: This template will be the foundation of our new production environment and is critical for passing our upcoming security audit. Accuracy, completeness, and strict adherence to the principles of least privilege and defense-in-depth are paramount.