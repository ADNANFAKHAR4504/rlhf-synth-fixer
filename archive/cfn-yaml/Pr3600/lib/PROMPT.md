<task_context>
You are building AWS infrastructure using CloudFormation (YAML) for a hobby forum platform serving 3,000 members. The forum will support project sharing, tutorials, advice discussions, image galleries, and user ratings. This is a development environment deployment in us-east-1 region.
</task_context>

<default_to_action>
By default, implement the complete infrastructure code rather than only suggesting changes. Create fully functional CloudFormation templates with all necessary resource definitions, properties, and cross-resource connections. Do not use placeholders or incomplete configurations.
</default_to_action>

<file_modification_scope>
You must ONLY modify and output code for these three files:
1. lib/TapStack.yml - CloudFormation stack implementation
2. tests/tap-stack.unit.test.ts - Unit tests for stack resources
3. tests/tap-stack.int.test.ts - Integration tests for deployed infrastructure

Do not create, modify, or reference any other files.
</file_modification_scope>

<infrastructure_requirements>
Deploy a complete Discourse forum infrastructure with the following AWS resources:

**Network Layer:**
- VPC with CIDR block 10.42.0.0/16
- Public and private subnets across 2 availability zones
- Internet Gateway for public access
- NAT Gateway for private subnet outbound connectivity
- Route tables with appropriate associations

**Compute Layer:**
- Single EC2 t3.small instance in public subnet
- Discourse application pre-configured via UserData
- Security group allowing HTTP/HTTPS inbound, all outbound
- EC2 instance profile with IAM role for S3/CloudWatch access

**Database Layer:**
- RDS PostgreSQL instance (db.t3.small)
- Single-AZ deployment in private subnet
- Database subnet group spanning availability zones
- Security group allowing PostgreSQL access from EC2 only
- Automated backups enabled

**Caching Layer:**
- ElastiCache Redis cluster (cache.t3.small)
- Single node in private subnet
- Cache subnet group configuration
- Security group allowing Redis access from EC2 only

**Storage Layer:**
- S3 bucket for user uploads and attachments
- S3 bucket for automated backups
- Lifecycle policies: transition to Glacier after 30 days, delete after 90 days
- Bucket policies restricting access to EC2 IAM role only
- Server-side encryption enabled

**CDN and DNS:**
- CloudFront distribution for S3 content delivery
- Origin Access Identity for secure S3 access
- Cache behaviors optimized for image delivery
- Route 53 hosted zone (use parameter for domain name)
- DNS A record pointing to CloudFront distribution

**Security:**
- Certificate Manager SSL certificate for domain (DNS validation)
- IAM role for EC2 with policies for: S3 access, CloudWatch logs, RDS connection, ElastiCache access, Secrets Manager access
- Secrets Manager secret storing RDS credentials
- Security groups following least-privilege principle

**Monitoring and Backup:**
- CloudWatch log group for application logs
- CloudWatch alarms: CPU >80%, memory >80%, disk >80%
- SNS topic for alarm notifications (use parameter for email)
- AWS Backup vault with 7-day retention policy
- Backup plan for RDS and EC2 volumes
</infrastructure_requirements>

<critical_focus_areas>
**Resource Connection Points (This is Critical):**
Pay special attention to properly connecting these resources:

1. **EC2 to RDS:** Pass RDS endpoint as environment variable in UserData
2. **EC2 to ElastiCache:** Pass Redis endpoint as environment variable in UserData
3. **EC2 to S3:** Grant permissions via IAM role, pass bucket name to Discourse config
4. **EC2 to Secrets Manager:** Grant read permissions, pass secret ARN to retrieve DB credentials
5. **CloudFront to S3:** Configure origin with OAI, update S3 bucket policy
6. **RDS Security Group:** Reference EC2 security group for ingress rules
7. **ElastiCache Security Group:** Reference EC2 security group for ingress rules
8. **Backup Plan:** Include both RDS instance and EC2 volumes by tags
9. **CloudWatch Logs:** Configure IAM permissions and log stream in UserData
10. **Route 53 to CloudFront:** Create alias record with CloudFront distribution DNS

Use CloudFormation intrinsic functions (Ref, !GetAtt, !Sub, !Join) to dynamically reference resource attributes and ensure proper dependency ordering.
</critical_focus_areas>

<cloudformation_best_practices>
- Use Parameters for: domain name, admin email, SSH key name, database credentials
- Use Outputs for: VPC ID, EC2 public IP, RDS endpoint, S3 bucket names, CloudFront URL
- Add DependsOn where implicit dependencies are not sufficient
- Use meaningful resource logical IDs (e.g., DiscourseEC2Instance, ForumDatabase)
- Include Metadata sections with descriptions for complex resources
- Tag all resources with: Environment=dev, Application=HobbyForum, ManagedBy=CloudFormation
- Use !Sub for string interpolation with references
- Validate all YAML syntax and CloudFormation template structure
</cloudformation_best_practices>

<test_requirements>
**Unit Tests (tap-stack.unit.test.ts):**
Write comprehensive unit tests that verify:
- All 15+ resources are defined in template
- VPC has correct CIDR block (10.42.0.0/16)
- EC2 instance type is t3.small
- RDS instance class is db.t3.small
- Security groups have correct ingress/egress rules
- IAM roles have necessary policy attachments
- S3 buckets have lifecycle policies configured
- CloudWatch alarms exist for critical metrics
- Backup retention is 7 days
- All resources have required tags

**Integration Tests (tap-stack.int.test.ts):**
Write integration tests that verify deployed resources:
- VPC exists with correct CIDR and subnets
- EC2 instance is running and accessible
- RDS database is available and accepting connections
- ElastiCache cluster is available
- S3 buckets exist and are accessible from EC2
- CloudFront distribution is deployed and serving content
- Route 53 records resolve correctly
- SSL certificate is issued and valid
- CloudWatch logs are receiving data
- Backup jobs are executing successfully

Use AWS SDK for JavaScript (v3) for integration tests.
</test_requirements>

<discourse_configuration>
In EC2 UserData script, configure Discourse with:
- PostgreSQL connection string using RDS endpoint and Secrets Manager credentials
- Redis connection string using ElastiCache endpoint
- S3 bucket for uploads with proper AWS credentials from IAM role
- CloudFront CDN URL for static asset delivery
- SMTP configuration for email notifications (use SES or parameter for external SMTP)
- Initial admin account creation
- Proper ownership and permissions for Docker installation
</discourse_configuration>

<output_format>
Provide complete, production-ready code for all three files with:
1. Full CloudFormation YAML template with all resources properly defined and connected
2. Comprehensive unit tests covering all resource definitions
3. Complete integration tests for deployed infrastructure validation
4. Inline comments explaining complex resource relationships
5. No placeholders, TODOs, or incomplete sections
</output_format>

<additional_instructions>
- Ensure all resource connections use CloudFormation references, not hard-coded values
- Implement proper error handling in tests
- Use descriptive test names that explain what is being validated
- Include setup and teardown logic in integration tests
- Add comments explaining why specific configurations are chosen
- Prioritize security: no hard-coded credentials, least-privilege IAM policies, encrypted storage
- Optimize for cost: single EC2 instance, single-AZ RDS, appropriate instance sizes
</additional_instructions>

Build the complete infrastructure implementation now.
