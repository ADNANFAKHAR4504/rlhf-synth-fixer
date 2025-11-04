<role>
You are a senior cloud infrastructure engineer with deep expertise in multi-tenant SaaS architectures, AWS services, Pulumi Infrastructure-as-Code, and Python. Your role is to design and implement production-grade, secure, scalable infrastructure that ensures complete tenant isolation and supports custom domains.
</role>

<task_context>
This is a critical production deployment for a multi-tenant SaaS application serving 30,000 users across 500 organizations. The infrastructure must guarantee tenant isolation at every layer (database, compute, storage, networking) while supporting custom domains per tenant. Security and compliance are paramount—any data leakage between tenants would be catastrophic.
</task_context>

<project_specifications>
**Deployment Region:** us-east-1
**VPC CIDR:** 10.18.0.0/16
**Scale Requirements:** 30,000 users, 500 organizations
**Instance Type:** m5.large for application tier
</project_specifications>

<infrastructure_requirements>
Implement a complete multi-tenant infrastructure with the following components, ensuring all resources are properly connected and integrated:

**Network Layer:**
- VPC with 10.18.0.0/16 CIDR
- Public and private subnets across multiple availability zones
- Internet Gateway and NAT Gateways for high availability
- Route tables with appropriate routing rules

**Compute & Load Balancing:**
- Application Load Balancer with host-based routing for custom domains
- Auto Scaling Group with m5.large instances
- Launch configuration with appropriate AMI and security hardening
- Target groups with health checks
- Security groups with least-privilege access

**Database & Caching:**
- Aurora PostgreSQL cluster with Row-Level Security (RLS) for tenant isolation
- Database subnet group across availability zones
- Separate ElastiCache Redis clusters per tenant class (e.g., premium vs standard)
- Parameter groups optimized for multi-tenancy

**Storage & CDN:**
- S3 buckets with tenant-specific bucket policies for data isolation
- CloudFront distribution with custom SSL certificates per tenant
- Origin Access Identity for secure S3 access

**DNS & Certificates:**
- Route 53 hosted zones for multiple custom domains
- Certificate Manager with wildcard certificates for tenant domains
- DNS validation records

**Authentication & Authorization:**
- Cognito user pools per tenant
- Custom domains per tenant in Cognito
- Dynamic IAM roles and policies based on tenant context
- Identity pool federation if needed

**Serverless & Configuration:**
- Lambda function for automated tenant provisioning workflow
- DynamoDB table for tenant configuration and metadata
- Lambda execution roles with appropriate permissions

**Monitoring & Logging:**
- CloudWatch log groups per tenant for isolation
- CloudWatch Logs Insights queries for tenant-specific analysis
- Alarms and metrics for scaling triggers

**Configuration Management:**
- Systems Manager Parameter Store for tenant configurations
- Secure parameter storage with encryption
</infrastructure_requirements>

<tenant_isolation_requirements>
Implement strict tenant isolation using these patterns:

1. **PostgreSQL RLS:** Configure Row-Level Security policies that filter data based on tenant_id context
2. **Host-based Routing:** ALB listener rules that route requests based on custom domain hostnames to appropriate targets
3. **ElastiCache Separation:** Create separate Redis clusters for premium tier tenants; shared clusters for standard tiers with logical isolation
4. **Dynamic IAM Policies:** Generate IAM policies at runtime that include tenant-specific resource ARNs in policy conditions
5. **S3 Bucket Policies:** Enforce tenant isolation through bucket policies that restrict access based on IAM principal tags or session context
6. **CloudWatch Log Groups:** Create separate log groups per tenant with retention policies
7. **Cognito Isolation:** Separate user pools per tenant with custom domains
</tenant_isolation_requirements>

<resource_connection_focus>
Pay special attention to connecting these resources properly:

- ALB target groups → Auto Scaling Group instances
- ALB listeners → host-based routing rules → target groups
- Aurora PostgreSQL → security groups → private subnets
- ElastiCache clusters → security groups → private subnets → application tier
- Lambda provisioning function → DynamoDB → Cognito → Route 53 → ACM
- CloudFront → S3 buckets with OAI → ACM certificates
- IAM roles → Lambda, EC2, and other services with appropriate trust relationships
- Route 53 → ALB and CloudFront distributions
- Systems Manager → Parameter Store → application configuration
- CloudWatch Logs → log groups per tenant → Logs Insights
</resource_connection_focus>

<file_constraints>
You MUST only modify and output code for these files:
- lib/tap_stack.py (stack implementation - primary infrastructure code)
- tests/unit/test_tap_stack.py (unit tests)
- tests/integration/test_tap_stack.py (integration tests)

DO NOT create or modify any other files. All infrastructure resources must be defined in lib/tap_stack.py.
</file_constraints>

<implementation_instructions>
1. **Start with lib/tap_stack.py:**
   - Import necessary Pulumi AWS modules
   - Create a comprehensive Stack class that defines all resources
   - Use Pulumi constructs properly (Input/Output types, resource dependencies)
   - Implement proper resource naming with tenant context
   - Add comprehensive inline comments explaining tenant isolation mechanisms
   - Export critical outputs (ALB DNS, Aurora endpoint, CloudFront domain, etc.)

2. **Implement tenant provisioning logic:**
   - Create Lambda function code inline or reference handler
   - Connect Lambda to DynamoDB for tenant registry
   - Implement workflow: Cognito user pool → Route 53 record → ACM certificate → ALB listener rule

3. **Configure security properly:**
   - Security groups with minimum required ingress/egress
   - IAM roles with least-privilege policies
   - Encryption at rest and in transit where applicable
   - KMS keys for sensitive data

4. **Write comprehensive unit tests in tests/unit/test_tap_stack.py:**
   - Test that all major resource types are created
   - Verify security group rules
   - Check IAM policy attachments
   - Validate RLS policy structure
   - Test tenant isolation logic

5. **Write integration tests in tests/integration/test_tap_stack.py:**
   - Test complete tenant provisioning workflow
   - Verify ALB host-based routing
   - Test database RLS enforcement
   - Validate S3 bucket policy isolation
   - Test Lambda provisioning function end-to-end
</implementation_instructions>

<code_quality_requirements>
- Use clear, descriptive variable names (e.g., `aurora_cluster`, `tenant_alb`, `premium_redis_cluster`)
- Add comprehensive docstrings to all functions and classes
- Include inline comments explaining complex tenant isolation logic
- Follow Python PEP 8 style guidelines
- Use type hints for function parameters and return values
- Implement proper error handling
- Make the code maintainable and extensible for future tenant tiers
</code_quality_requirements>

<success_criteria>
The implementation is successful when:
1. All AWS resources are defined in lib/tap_stack.py with proper dependencies
2. Tenant isolation is enforced at database (RLS), storage (S3 policies), compute (separate clusters for premium), and logging (separate log groups) layers
3. Host-based routing correctly maps custom domains to tenant-specific targets
4. Lambda provisioning function can create new tenants automatically
5. Dynamic IAM policies restrict access based on tenant context
6. Unit tests achieve >80% code coverage
7. Integration tests validate complete tenant lifecycle
8. All resources follow AWS security best practices
9. The infrastructure can scale to support the specified 30,000 users and 500 organizations
10. Code is production-ready with proper error handling and logging
</success_criteria>

<output_format>
Provide complete, production-ready code for all three files. Structure your response as:

1. **lib/tap_stack.py** - Full implementation with all resources
2. **tests/unit/test_tap_stack.py** - Comprehensive unit tests
3. **tests/integration/test_tap_stack.py** - End-to-end integration tests

Include explanatory comments within the code. After the code, provide a brief architecture summary explaining how the key components connect and ensure tenant isolation.
</output_format>

<thinking_guidance>
Before writing code, think through:
- The dependency graph of resources (what must be created first)
- How tenant context flows through the system (from request to database query)
- Security boundaries and isolation mechanisms at each layer
- How the Lambda provisioning function orchestrates tenant creation
- Potential failure modes and how to handle them
</thinking_guidance>  