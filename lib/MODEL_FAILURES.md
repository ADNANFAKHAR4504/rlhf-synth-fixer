1. SSH KeyPair Requirement

Model Response: Required KeyName parameter for EC2 KeyPair authentication, necessitating manual key management and traditional SSH access patterns.
Actual Implementation: Eliminated KeyName parameter entirely and leveraged AWS Systems Manager Session Manager for secure, auditable access without SSH keys. Provides browser-based console access and eliminates key distribution overhead.

2. Static AMI Configuration

Model Response: Used hardcoded AMI IDs in RegionMap mappings (ami-0c02fb55731490381 for us-east-1, ami-0a1ee2fb28fe05df3 for eu-central-1), requiring manual updates when new AMI versions are released.
Actual Implementation: Implemented SSM Parameter Store lookup for dynamic AMI selection using AWS::SSM::Parameter::Value<AWS::EC2::Image::Id> with path /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64, ensuring automatic updates to latest Amazon Linux 2023 AMI.

3. Missing VPC Infrastructure

Model Response: Relied on non-existent cross-stack imports (Fn::ImportValue for DefaultVPCSubnets and CustomVPCSubnets) without defining the underlying VPC infrastructure, causing immediate stack creation failure.
Actual Implementation: Created complete VPC infrastructure including DefaultVPC (10.0.0.0/16), two subnets in different availability zones (10.0.0.0/20 and 10.0.16.0/20), InternetGateway, RouteTable with internet route, and SubnetRouteTableAssociations for proper network connectivity.

4. Weak Database Password Management

Model Response: Stored RDS password in SSM Parameter Store as base64-encoded value derived from stack metadata (${AWS::StackName}-${AWS::AccountId}-${AWS::Region}), creating predictable and weak credentials.
Actual Implementation: Utilized AWS Secrets Manager with GenerateSecretString to auto-generate 32-character random password with complexity requirements, dynamically injected into RDS using {{resolve:secretsmanager}} syntax for secure credential management.

5. WAF Logging Configuration Issues

Model Response: Configured WAF log group with incorrect naming convention (missing aws-waf-logs- prefix) and used invalid ARN format with wildcard suffix (:*) in LogDestinationConfigs, preventing successful WAF logging setup.
Actual Implementation: Created log group with compliant name aws-waf-logs-secure-infrastructure-${EnvironmentSuffix} and used proper ARN construction via Fn::Sub without wildcards: arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:aws-waf-logs-secure-infrastructure-${EnvironmentSuffix}.

6. CloudTrail Configuration Problems

Model Response: Included invalid DataResources configuration with wildcard S3 object ARN (arn:aws:s3:::*/*) in EventSelectors, causing CloudTrail creation failure. Lacked CloudWatch Logs integration for real-time monitoring.
Actual Implementation: Removed problematic DataResources section, retained management events only. Added CloudTrailLogGroup with 90-day retention and CloudTrailRole with logs:CreateLogStream and logs:PutLogEvents permissions for CloudWatch integration.

7. Unavailable RDS Engine Version

Model Response: Specified MySQL version 8.0.28 which is not available or deprecated in certain regions (specifically us-east-1), causing RDS instance creation failure.
Actual Implementation: Updated to MySQL version 8.0.39, the latest stable release available across all regions. Also changed DeletionProtection from true to false for easier testing and stack teardown.

8. S3 Bucket Deletion Conflicts

Model Response: Created S3LoggingBucket without retention policies, causing stack deletion failures when CloudTrail had written logs to the bucket. Included unnecessary VersioningConfiguration and AccessControl properties.
Actual Implementation: Added DeletionPolicy: Retain and UpdateReplacePolicy: Retain to S3LoggingBucket, allowing CloudFormation to complete stack deletion while preserving audit logs. Removed versioning configuration to simplify log management.

9. Unnecessary SSH Security Group Rules

Model Response: Configured ApplicationSecurityGroup with SSH ingress from BastionSecurityGroup (port 22), and BastionSecurityGroup with SSH ingress from internal network (10.0.0.0/8), creating unnecessary attack surface when SSM Session Manager is available.
Actual Implementation: Removed all SSH ingress rules from ApplicationSecurityGroup and BastionSecurityGroup. BastionSecurityGroup now has zero ingress rules, relying entirely on SSM Session Manager for secure remote access via AWS console.

10. IAM Permission Misalignment

Model Response: EC2 IAM role included ParameterStoreAccess policy with ssm:GetParameter and ssm:GetParameters actions for /secure-app/* parameters, misaligned with actual secret storage mechanism.
Actual Implementation: Replaced with SecretsManagerAccess policy containing secretsmanager:GetSecretValue and secretsmanager:DescribeSecret actions, properly scoped to DatabasePasswordSecret ARN. Aligned with transition from SSM Parameter Store to Secrets Manager for credential management.
