I need to create a comprehensive AWS CDK Java stack that demonstrates security best practices for a production environment. The infrastructure should include EC2 instances, S3 buckets, IAM roles, and RDS databases, all configured with enterprise-grade security controls.

**Core Requirements:**

1. **EC2 Security Configuration**
   - Launch EC2 instances with encrypted EBS volumes using customer-managed KMS keys
   - Configure security groups with minimal required access - all ingress rules must specify exact CIDR blocks or reference other security groups
   - Web traffic should only allow ingress from load balancer security groups or specific trusted IP ranges
   - Never use 0.0.0.0/0 ingress rules for any service
   - Use Systems Manager Session Manager for secure access instead of SSH key pairs where possible
   - Deploy instances in private subnets with no public IPs unless absolutely necessary for web servers

2. **S3 Bucket Security**
   - Enable server-side encryption using AWS KMS with customer-managed keys
   - Configure bucket policies to prevent public access
   - Enable versioning and cross-region replication for disaster recovery
   - Set up access logging to track all bucket operations

3. **RDS Database Security**
   - Configure RDS instances with encryption at rest using customer-managed KMS keys
   - Enable encryption in transit with SSL/TLS
   - Set up automated backups with point-in-time recovery
   - Deploy in private subnets with database security groups allowing access only from application tiers

4. **IAM Security Implementation**
   - Create IAM roles with exact resource ARNs and specific actions - never use Resource: * or Action: *
   - Each role should have only the minimum permissions required for its specific function
   - Implement service-specific IAM policies with exact resource ARNs and minimal required actions
   - Use resource-based policies where appropriate with explicit resource references
   - Enable MFA requirements for sensitive operations

5. **Network Security**
   - Create VPC with public and private subnets across multiple availability zones
   - Configure NAT Gateways for outbound internet access from private subnets
   - Set up VPC Flow Logs for network monitoring
   - Implement security groups as stateful firewalls

6. **Modern AWS Security Features Integration**
   - Integrate AWS Security Hub for centralized security findings
   - Configure Amazon GuardDuty for threat detection across the infrastructure
   - Use AWS Certificate Manager for SSL/TLS certificate management
   - Enable AWS Config for compliance monitoring

7. **Encryption and Key Management**
   - Create customer-managed KMS keys with proper key policies
   - Implement key rotation for all encryption keys
   - Use different keys for different services and data types
   - Configure cross-service encryption patterns

8. **Monitoring and Logging**
   - Enable CloudTrail for all API calls with log file integrity validation
   - Set up CloudWatch monitoring with custom metrics and alarms
   - Configure VPC Flow Logs for network traffic analysis
   - Enable access logging for all services that support it

9. **Resource Tagging Strategy**
   - Apply consistent tags across all resources: Environment, Owner, Project, CostCenter
   - Use tags for cost allocation and access control policies
   - Implement tag-based compliance rules

10. **High Availability and Disaster Recovery**
    - Deploy resources across multiple availability zones
    - Configure automated backups and cross-region replication
    - Implement proper dependency management between resources

The solution should be region-agnostic and work primarily in us-east-1 but be deployable to other regions. Focus on creating a maintainable, secure, and scalable infrastructure that could serve as a template for production workloads.

Please provide the complete CDK Java code with proper class structure, including all necessary imports and configuration details. The code should be production-ready and follow AWS CDK best practices for Java development.