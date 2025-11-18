# Ideal Response: Scalable Web Application Infrastructure with Multi-Tier Security

## Architecture Overview

This CloudFormation template creates a production-ready, highly available web application infrastructure on AWS with comprehensive security controls, encryption at rest and in transit, container orchestration with auto-scaling, relational database with automated backups, content delivery optimization, and centralized monitoring and alerting. The infrastructure implements AWS Well-Architected Framework principles including VPC network isolation across multiple Availability Zones, KMS encryption for all data at rest, IAM least privilege roles, ECS Fargate serverless containers, RDS Multi-AZ deployment, CloudFront CDN for static content delivery, and CloudWatch alarms with SNS notifications for proactive issue detection.

### Network Architecture

The infrastructure implements a secure multi-tier VPC architecture in the us-west-1 region with proper network isolation, controlled internet access, and high availability across two Availability Zones. The VPC uses a 10.0.0.0/16 CIDR block providing 65,536 IP addresses for future growth, with two public subnets (10.0.1.0/24 and 10.0.2.0/24) for internet-facing resources and two private subnets (10.0.10.0/24 and 10.0.11.0/24) for application and database tiers. An Internet Gateway provides public subnet connectivity to the internet, enabling inbound traffic to the Application Load Balancer and outbound traffic from the Bastion Host. A single NAT Gateway with a dedicated Elastic IP is deployed in the first public subnet to provide outbound internet access for resources in private subnets while maintaining their isolation from inbound internet traffic. Separate route tables control traffic flow with public subnets routing through the Internet Gateway for bidirectional internet connectivity and private subnets routing through the NAT Gateway for outbound-only access. This network design ensures containerized applications and databases cannot be directly accessed from the internet and can only be reached through the Application Load Balancer or Bastion Host, implementing defense-in-depth security architecture with clear separation between public and private tiers.

### Container Orchestration Layer

The compute layer consists of ECS Fargate containers deployed within the VPC's private subnets with strict IAM execution roles and auto-scaling capabilities. ECS containers use AWS Fargate serverless compute eliminating the need to manage EC2 instances, with configurable container image (defaulting to nginx:latest), container port (defaulting to 80), and resource allocation of 256 CPU units and 512 MB memory for cost optimization. Containers are deployed in private subnets across both Availability Zones with AssignPublicIp set to DISABLED ensuring they cannot be accessed from the internet directly. The ECS cluster is configured with Container Insights enabled for enhanced monitoring and uses FARGATE capacity provider with FARGATE_SPOT available for additional cost optimization. The ECS task execution role implements AmazonECSTaskExecutionRolePolicy for pulling container images and publishing logs to CloudWatch. The ECS task role implements least privilege with specific permissions for S3 GetObject and PutObject scoped to the application backup bucket and Secrets Manager GetSecretValue permission for retrieving RDS credentials. Container definitions include environment variables providing the RDS endpoint address through Fn::GetAtt intrinsic function avoiding hardcoded values. Log configuration streams all container logs to CloudWatch Logs with 7-day retention using awslogs driver with dynamic region reference through AWS::Region pseudo-parameter. The Application Load Balancer distributes traffic across containers using target type IP with health checks on HTTP port 80 ensuring only healthy containers receive traffic. Auto-scaling is configured with a minimum of 2 and maximum of 10 tasks using target tracking scaling policy monitoring CPU utilization at 70% threshold, automatically scaling out during high load and scaling in during low utilization to optimize costs while maintaining performance.

### Application Load Balancer Integration

Application Load Balancer serves as the secure entry point for the web application, providing high availability, SSL termination capability, and health-based routing before forwarding requests to ECS containers. The ALB is deployed as internet-facing in both public subnets across two Availability Zones ensuring high availability and automatic failover. ALB security group allows HTTP traffic on port 80 and HTTPS traffic on port 443 from anywhere (0.0.0.0/0) enabling public access to the web application. The target group uses IP target type required for Fargate tasks with health checks configured for HTTP protocol on path / with 30-second intervals, 5-second timeouts, 2 healthy threshold, and 3 unhealthy threshold ensuring rapid detection of container health issues. Health check grace period of 60 seconds allows containers sufficient time to start before receiving traffic. The listener configuration forwards all HTTP port 80 traffic to the target group using AWS_PROXY integration enabling the Application Load Balancer to distribute requests across healthy container instances. ECS service integration registers container instances automatically with the target group using container name webapp-container and dynamic port mapping through ContainerPort parameter reference. The ALB depends on Internet Gateway attachment ensuring network connectivity is established before ALB creation. This configuration implements high availability with automatic distribution of traffic across multiple Availability Zones, health-based routing ensuring requests only reach healthy containers, and centralized ingress point simplifying security controls and SSL certificate management.

### Storage and Encryption Layer

The storage layer implements comprehensive encryption for data at rest using customer-managed KMS keys for both S3 and RDS services. Two separate customer-managed KMS keys provide encryption for S3 bucket and RDS instance following security best practice of using separate keys for different data types. KMS key policies grant root account full permissions for key management and allow AWS services to use keys for encryption and decryption operations. KMS aliases provide friendly names (alias/webapp-s3-${AWS::StackName} and alias/webapp-rds-${AWS::StackName}) following AWS naming conventions and enabling easy key identification across environments. The S3 bucket stores application backups with bucket name incorporating AWS::AccountId and AWS::Region for global uniqueness, versioning enabled for data protection and point-in-time recovery, KMS encryption (SSE-KMS) using the S3 customer-managed key providing enhanced security over AWS-managed encryption, and PublicAccessBlockConfiguration blocking all public access preventing accidental data exposure. S3 bucket policy grants CloudFront Origin Access Identity permission to GetObject enabling CloudFront to serve static content from the bucket while preventing direct public access. RDS database encryption uses the RDS customer-managed KMS key with StorageEncrypted set to true ensuring all data at rest including database storage, automated backups, read replicas, and snapshots are encrypted. Database credentials are managed through AWS Secrets Manager with automatic password generation using 32-character length, RequireEachIncludedType for complexity, and ExcludeCharacters avoiding problematic characters. The secret uses dynamic secret string template incorporating DBUsername parameter with Fn::Sub ensuring flexibility across environments. RDS database retrieves credentials at launch time using CloudFormation dynamic references {{resolve:secretsmanager}} eliminating hardcoded passwords in the template. This multi-layer encryption approach protects data at rest with KMS encryption for S3 and RDS, credentials security through Secrets Manager, and prevents unauthorized access through S3 public access blocking.

### CloudFront Content Delivery Network

CloudFront distribution provides global content delivery optimization for static content stored in the S3 bucket with comprehensive caching behaviors and security controls. The distribution uses the S3 bucket as origin with RegionalDomainName from Fn::GetAtt for dynamic reference and Origin Access Identity for secure access without making the bucket public. CloudFront security is enforced through Origin Access Identity ensuring only CloudFront can access S3 bucket objects with the S3 bucket policy explicitly granting s3:GetObject permission to the Origin Access Identity ARN. Distribution configuration includes ViewerProtocolPolicy set to redirect-to-https enforcing encrypted connections from viewers and preventing unencrypted HTTP access to content. Default cache behavior allows GET and HEAD methods with compression enabled reducing bandwidth costs and improving performance, QueryString forwarding disabled for static content optimization, and TTL configuration with MinTTL 0 seconds, DefaultTTL 86400 seconds (24 hours), and MaxTTL 31536000 seconds (1 year) providing flexible caching duration based on cache headers. Custom cache behaviors optimize specific content types including _.jpg and _.png images with MinTTL 86400 seconds (1 day), DefaultTTL 604800 seconds (7 days), and MaxTTL 31536000 seconds (1 year) providing aggressive caching for images, _.css stylesheets with the same aggressive caching policy optimizing style delivery, and _.js JavaScript files with identical caching configuration optimizing script delivery. The distribution uses PriceClass_100 restricting edge locations to North America and Europe for cost optimization while maintaining performance for primary markets. This CloudFront configuration implements performance optimization through global edge location caching reducing latency for end users, cost optimization through compression and efficient caching policies reducing origin requests, and security enhancement through HTTPS enforcement and Origin Access Identity preventing direct S3 access.

### Database Layer with High Availability

RDS MySQL database provides persistent relational data storage with Multi-AZ deployment, automated backups, encryption, and enhanced monitoring. The database uses MySQL 8.0.43 engine with configurable instance class (defaulting to db.t3.micro), 20 GB gp3 storage providing baseline performance with burst capability, and Multi-AZ deployment ensuring automatic failover to standby instance in different Availability Zone during maintenance or failures. Database subnet group includes both private subnets enabling Multi-AZ deployment across Availability Zones while maintaining isolation from public internet. Database security group restricts MySQL port 3306 access to only ECS security group for application connectivity and Bastion security group for administrative access, implementing defense in depth with no direct internet access. Automated backup configuration includes BackupRetentionPeriod of 7 days as required meeting compliance requirements for point-in-time recovery, PreferredBackupWindow of 03:00-04:00 scheduling backups during low traffic period, and PreferredMaintenanceWindow of sun:04:00-sun:05:00 scheduling maintenance during weekend low traffic period. Database encryption uses customer-managed RDS KMS key with StorageEncrypted true ensuring all data at rest is encrypted including the primary database, automated backups, read replicas, and snapshots. Enhanced monitoring is enabled with MonitoringInterval of 60 seconds providing detailed OS-level metrics through RDS monitoring role with AmazonRDSEnhancedMonitoringRole managed policy. CloudWatch Logs exports are enabled for error, general, and slowquery logs providing comprehensive database activity monitoring for troubleshooting and performance optimization. Database credentials leverage Secrets Manager dynamic references {{resolve:secretsmanager}} for both MasterUsername and MasterUserPassword eliminating hardcoded credentials and enabling automatic password rotation. PubliclyAccessible is set to false preventing direct internet access to the database. This configuration implements high availability through Multi-AZ deployment with automatic failover, data protection through 7-day backup retention and KMS encryption, security through private subnet deployment and restricted security group access, and operational visibility through CloudWatch Logs exports and enhanced monitoring.

### Security Controls

Security is implemented through multiple layers including network isolation, security groups, IAM roles, KMS encryption, Secrets Manager, and CloudFront Origin Access Identity. Network security implements VPC isolation with private subnets for ECS containers and RDS database preventing direct internet access, public subnets for ALB and Bastion Host with controlled ingress, and NAT Gateway providing outbound-only internet access for private subnet resources. Security groups enforce least privilege network access with ALB security group allowing HTTP port 80 and HTTPS port 443 from anywhere for public web access, ECS security group allowing traffic only from ALB security group on container port preventing direct container access, Database security group allowing MySQL port 3306 only from ECS security group and Bastion security group preventing unauthorized database access, and Bastion security group allowing SSH port 22 from anywhere enabling administrative access while bastion itself is in public subnet. IAM roles follow the principle of least privilege with three user roles (AdminRole with AdministratorAccess for full administrative access, DeveloperRole with scoped permissions for ECS, ECR, S3, CloudWatch, Logs, and RDS Describe operations, and ReadOnlyRole with ReadOnlyAccess for audit and monitoring personnel), ECS task execution role with AmazonECSTaskExecutionRolePolicy for container orchestration, ECS task role with scoped S3 permissions to specific bucket and Secrets Manager permission to specific secret, and RDS monitoring role with AmazonRDSEnhancedMonitoringRole for enhanced monitoring. All IAM roles use AWS::AccountId in trust policies preventing cross-account assumption, and role names incorporate AWS::StackName ensuring uniqueness across stack deployments. Encryption security implements KMS customer-managed keys with separate keys for S3 and RDS following security best practices, Secrets Manager for database credentials with automatic generation and CloudFormation dynamic references, S3 bucket encryption with SSE-KMS, RDS storage encryption including backups and snapshots, and CloudFront HTTPS enforcement with redirect-to-https viewer protocol policy. S3 security implements PublicAccessBlockConfiguration blocking all public access, bucket policy restricting access to CloudFront Origin Access Identity, and versioning enabled for data protection. This defense-in-depth approach implements security controls at the network layer with VPC and security groups, identity layer with IAM roles, data layer with KMS encryption and Secrets Manager, and application layer with CloudFront HTTPS enforcement.

### IAM Roles and Policies

The infrastructure implements comprehensive IAM strategy with three user roles following principle of least privilege and service roles for AWS services. AdminRole provides full administrative access with AdministratorAccess managed policy enabling complete control over all AWS resources and services, trust policy allowing AWS::AccountId root account to assume the role ensuring cross-account assumption is prevented, and tags for resource organization and cost tracking. DeveloperRole provides scoped permissions for application development and operations with inline DeveloperPolicy granting full access to ECS and ECR services for container management, full access to S3 for application data and backups, full access to CloudWatch and CloudWatch Logs for monitoring and debugging, and Describe permissions for RDS enabling read-only database visibility, all with Resource wildcard for operational flexibility while restricting destructive actions through service-level permissions. ReadOnlyRole provides read-only access across all services with ReadOnlyAccess managed policy enabling audit and monitoring personnel to view resources without modification capability. ECS task execution role provides containers with permissions to pull images and publish logs with AmazonECSTaskExecutionRolePolicy managed policy granting ECR permissions for pulling container images, CloudWatch Logs permissions for publishing container logs, and SSM Parameter Store permissions for retrieving configuration, following AWS best practice of using managed policy for well-defined service permissions. ECS task role provides running containers with application-specific permissions using inline policy with S3 GetObject and PutObject permissions scoped to specific S3 bucket using Fn::Sub: ${S3Bucket.Arn}/\* preventing access to other buckets, and Secrets Manager GetSecretValue permission scoped to specific database secret enabling containers to retrieve RDS credentials at runtime. RDS monitoring role enables enhanced monitoring with trust policy allowing monitoring.rds.amazonaws.com service principal and AmazonRDSEnhancedMonitoringRole managed policy granting CloudWatch permissions for publishing OS-level metrics. All roles use AWS::StackName in role names preventing naming conflicts across stack deployments, implement comprehensive tagging with Name, Environment, and Project tags for resource organization, and use AssumeRolePolicyDocument with specific principals preventing unauthorized role assumption. This IAM structure eliminates hard-coded credentials through Secrets Manager integration, provides temporary security credentials automatically rotated by AWS, implements fine-grained permissions for each service component, and supports environment-specific access control through role-based permissions.

### Monitoring and Alerting

CloudWatch monitoring provides comprehensive visibility into application health, resource utilization, and performance metrics with proactive alerting through SNS. CloudWatch Logs provides centralized log aggregation for ECS containers with log group /ecs/webapp-${EnvironmentName} using dynamic environment suffix, 7-day retention balancing compliance requirements with storage costs, and awslogs driver configuration in ECS task definition streaming logs in real-time. RDS CloudWatch Logs exports capture database activity with error logs for troubleshooting database issues and failed queries, general logs for complete query audit trail, and slowquery logs for identifying performance bottlenecks and optimization opportunities. CloudWatch alarms monitor critical metrics with email notifications through SNS topic. ECS CPU alarm monitors ECSServiceAverageCPUUtilization metric with 80% threshold, 300-second period (5 minutes), 2 evaluation periods requiring two consecutive high readings before alarm, Average statistic, and dimensions specifying ServiceName and ClusterName ensuring accurate metric selection. RDS CPU alarm monitors RDS CPUUtilization metric with identical 80% threshold, period, and evaluation configuration ensuring database performance issues are detected proactively. Both alarms use TreatMissingData set to notBreaching preventing false alarms during maintenance windows or data collection gaps. SNS topic provides alarm notifications with email subscription using AlertEmail parameter requiring email validation through AWS SNS confirmation, DisplayName for email subject line clarity, and topic name incorporating EnvironmentName for multi-environment deployments. Alarm actions reference SNS topic ARN ensuring notifications are sent when alarms trigger. The monitoring architecture enables proactive issue detection through CPU utilization alarms preventing performance degradation before user impact, centralized log aggregation through CloudWatch Logs enabling rapid troubleshooting and debugging, database performance visibility through RDS log exports identifying slow queries and errors, and automated notification through SNS ensuring operations teams are immediately alerted to issues. CloudWatch metrics from Container Insights provide additional visibility into container-level CPU, memory, network, and disk utilization supporting capacity planning and cost optimization.

### Bastion Host for Secure Administration

Bastion Host provides secure SSH access to private subnet resources including RDS database and future EC2 instances while minimizing attack surface. The bastion is deployed as EC2 instance in public subnet with public IP address enabling SSH access from the internet, using latest Amazon Linux 2 AMI retrieved dynamically through SSM Parameter Store with {{resolve:ssm}} eliminating hardcoded AMI IDs and ensuring latest security patches. Instance type is configurable through BastionInstanceType parameter with AllowedValues of t2.micro, t2.small, and t2.medium defaulting to t2.micro for cost optimization. SSH key pair is optional with HasKeyPair condition checking if KeyName parameter is empty, using Fn::If to conditionally set KeyName property enabling stack deployment without key pair for testing and requiring key pair for production access. Bastion security group allows SSH port 22 from anywhere (0.0.0.0/0) enabling administrative access while bastion's public subnet placement provides controlled entry point. Database security group allows MySQL port 3306 from bastion security group enabling database administration through SSH tunnel from bastion to RDS. Detailed monitoring is enabled providing 1-minute CloudWatch metrics for enhanced visibility into bastion resource utilization. This bastion configuration implements security best practices with single controlled entry point reducing attack surface compared to direct database access, SSH key authentication providing stronger security than password authentication, optional key pair through CloudFormation conditions supporting flexible deployment scenarios, and SSM Parameter Store AMI resolution ensuring latest security patches without template updates. For enhanced security in production, organizations should restrict bastion SSH access to specific IP addresses using security group CidrIp parameter, implement Session Manager for keyless access eliminating SSH key management, enable VPC Flow Logs to audit all bastion network traffic, and configure CloudWatch Logs for SSH authentication logs enabling security investigations.

### High Availability and Fault Tolerance

The architecture achieves high availability through multi-AZ deployment, automatic failover, and managed AWS services with built-in redundancy. Network high availability is provided through VPC spanning two Availability Zones with public and private subnets in each AZ, NAT Gateway deployed in first public subnet with Elastic IP ensuring private subnet outbound connectivity (single NAT Gateway is cost optimization with ECS Fargate providing built-in resilience through automatic task replacement), and Internet Gateway attached to VPC providing redundant internet connectivity. Application high availability is implemented through ECS Fargate with containers deployed in private subnets across both Availability Zones, automatic task replacement when containers fail with ECS health checks, Application Load Balancer distributing traffic across healthy containers in multiple AZs with automatic failover, target group health checks with 30-second interval and 5-second timeout ensuring rapid failure detection, and auto-scaling maintaining minimum 2 tasks ensuring at least one task in each AZ for availability. Database high availability leverages RDS Multi-AZ deployment with synchronous replication to standby instance in different Availability Zone, automatic failover to standby instance typically completing within 60-120 seconds, automated backups with 7-day retention enabling point-in-time recovery, and preferred maintenance window scheduling updates during low traffic period. Storage high availability includes S3 providing 99.999999999% (11 9's) durability with automatic replication across multiple facilities, versioning enabled protecting against accidental deletions with point-in-time recovery, and KMS keys automatically replicated within region with built-in redundancy. Content delivery high availability is provided through CloudFront with edge locations across global regions ensuring low latency from anywhere, automatic routing to healthy origins with origin failover support, and caching reducing origin dependency. CloudWatch monitoring enables proactive failure detection through alarms for ECS and RDS CPU utilization detecting performance degradation, SNS notifications ensuring operations teams are alerted immediately, and centralized logging supporting rapid incident investigation and root cause analysis. This multi-layer high availability architecture ensures the application tolerates single Availability Zone failures with automatic failover, individual container failures with automatic replacement and load balancer routing, database instance failures with RDS Multi-AZ automatic failover, and maintains availability during maintenance windows through rolling updates and preferred maintenance windows.

Cost Optimization
The infrastructure implements comprehensive cost optimization through right-sized resources, auto-scaling, and efficient caching while maintaining production-grade availability and security. Compute cost optimization leverages ECS Fargate serverless containers eliminating EC2 instance management overhead and paying only for actual container vCPU and memory usage, default 256 CPU units and 512 MB memory providing sufficient capacity for nginx while minimizing costs, auto-scaling with minimum 2 and maximum 10 tasks scaling based on actual demand rather than peak capacity, target tracking scaling at 70% CPU utilization balancing performance with resource efficiency, and FARGATE_SPOT capacity provider option enabling up to 70% cost savings for fault-tolerant workloads. Database cost optimization includes RDS db.t3.micro instance type providing sufficient capacity for development and testing with easy scaling to larger instances for production, 20 GB gp3 storage providing baseline performance without over-provisioning, automated backup retention limited to 7 days balancing compliance with storage costs, and preferred maintenance window during low traffic period minimizing impact and avoiding peak hour resource waste. Storage cost optimization implements S3 versioning enabling lifecycle policies for transitioning old versions to cheaper storage classes, CloudFront caching reducing S3 GET requests and data transfer costs through aggressive TTL policies (1-7 days for images and scripts), compression enabled in CloudFront reducing bandwidth costs, and PriceClass_100 restricting edge locations to cost-effective regions. Monitoring cost optimization includes CloudWatch Logs 7-day retention for ECS containers limiting long-term storage costs while maintaining recent history for troubleshooting, RDS CloudWatch Logs exports limited to error, general, and slowquery avoiding verbose logs that increase costs, and CloudWatch alarms using 300-second (5-minute) periods reducing evaluation costs while maintaining adequate monitoring. Network cost optimization uses single NAT Gateway instead of one per AZ appropriate for fault-tolerant containerized applications, Fargate with automatic task replacement providing resilience, and private subnets for ECS and RDS eliminating public IP costs. Parameter-driven cost optimization enables environment-specific sizing with Production using larger instances and Development using minimal resources, AllowedValues constraints preventing accidental deployment of expensive configurations, and comprehensive tagging with Environment and Project enabling detailed AWS Cost Explorer reports for showback and chargeback.

### Reliability

The containerized architecture achieves high reliability through AWS-managed services, automatic scaling, health checks, and comprehensive backup strategies. Container reliability is provided through ECS Fargate with automatic distribution across multiple Availability Zones, automatic replacement of unhealthy containers when health checks fail, minimum 2 tasks ensuring at least one healthy container always running, health check grace period of 60 seconds allowing containers to initialize before receiving traffic, and Application Load Balancer routing traffic only to healthy containers with automatic deregistration of unhealthy targets. Database reliability leverages RDS Multi-AZ with synchronous replication to standby instance in different Availability Zone ensuring no data loss during failover, automated backups with 7-day retention enabling point-in-time recovery to any second within retention window, backup window scheduled during low traffic period (03:00-04:00) minimizing performance impact, and enhanced monitoring with 60-second granularity providing detailed metrics for proactive issue detection. Storage reliability includes S3 with 99.999999999% durability and 99.99% availability SLA providing enterprise-grade data protection, versioning enabled protecting against accidental deletions and enabling recovery of previous versions, KMS encryption protecting data confidentiality even if storage is compromised, and CloudFront caching providing continued content delivery even during S3 service issues. Network reliability implements VPC spanning two Availability Zones ensuring availability during single AZ failure, Application Load Balancer with cross-zone load balancing distributing traffic evenly, NAT Gateway with Elastic IP providing consistent outbound connectivity, and security groups providing defense in depth preventing unauthorized access. Monitoring reliability enables rapid failure detection through CloudWatch alarms on critical metrics with 2 evaluation periods preventing false positives while ensuring quick detection, SNS email notifications ensuring operations teams are alerted immediately, centralized logging through CloudWatch Logs enabling rapid troubleshooting with queryable logs, and Container Insights providing detailed container-level metrics. Auto-scaling reliability maintains application performance during traffic spikes through target tracking policy automatically adding tasks when CPU exceeds 70%, scale-out cooldown of 300 seconds preventing thrashing, scale-in cooldown protecting against premature scale-in, and maximum 10 tasks providing headroom for significant traffic increases. This reliability architecture ensures the application maintains availability during component failures through automatic failover and task replacement, recovers from data loss through automated backups and versioning, detects issues proactively through comprehensive monitoring and alarming, and scales automatically to meet demand without manual intervention.

### Modern AWS Practices

Customer-Managed KMS Keys with Unique Aliases
The infrastructure uses customer-managed KMS keys rather than AWS-managed keys for S3 and RDS encryption, providing enhanced security, control, and audit capabilities. Separate KMS keys are created for S3 and RDS following security best practice of using different keys for different data types, reducing blast radius if a key is compromised and enabling fine-grained access control policies. Customer-managed keys enable centralized key policy management with explicit control over which AWS services and IAM principals can use keys for encryption and decryption operations through key policy statements. KMS key policies use Sid "Enable IAM User Permissions" allowing root account full kms:\* permissions for key management, and Principal using Fn::Sub: arn:aws:iam::${AWS::AccountId}:root ensuring only the account owner can manage keys. KMS aliases provide friendly names using Fn::Sub: alias/webapp-s3-${AWS::StackName} and alias/webapp-rds-${AWS::StackName} following AWS naming conventions with service identifier and stack name enabling easy key identification across multiple environments and preventing naming conflicts. Aliases use TargetKeyId with Ref intrinsic function referencing the KMS key resource ensuring correct association. This customer-managed key approach provides several critical benefits including detailed CloudTrail logging of all key usage for compliance audits and security investigations, support for automatic key rotation through EnableKeyRotation property (not shown but recommended for production), key policy flexibility enabling least privilege access controls for different services and roles, and separation of duties with key administrators separate from key users. S3 bucket references the S3 KMS key through KMSMasterKeyID property in ServerSideEncryptionByDefault configuration ensuring all objects are encrypted at rest with the customer-managed key. RDS instance references the RDS KMS key through KmsKeyId property ensuring database storage, automated backups, read replicas, and snapshots are all encrypted with the customer-managed key. This comprehensive KMS implementation provides enterprise-grade encryption key management with detailed audit trails, fine-grained access control, and separation of encryption keys by data type.

### Secrets Manager for Database Credentials

Database credentials are managed through AWS Secrets Manager with automatic password generation eliminating hardcoded passwords and enabling automated rotation. The DBSecret resource uses GenerateSecretString with SecretStringTemplate incorporating DBUsername parameter through Fn::Sub: {"username": "${DBUsername}"} enabling username configuration while password is automatically generated. Password generation uses GenerateStringKey "password" creating password field in secret JSON, PasswordLength 32 providing strong passwords exceeding most security policy requirements, ExcludeCharacters "\"@/\\" preventing problematic characters that could cause parsing issues in connection strings, and RequireEachIncludedType true ensuring passwords include uppercase, lowercase, numbers, and special characters meeting complexity requirements. The secret name uses Fn::Sub: WebApp-RDS-Credentials-${AWS::StackName} incorporating stack name preventing naming conflicts across deployments and enabling multi-environment support. RDS instance retrieves credentials at creation time using CloudFormation dynamic references with MasterUsername using {{resolve:secretsmanager:${DBSecret}:SecretString:username}} and MasterUserPassword using {{resolve:secretsmanager:${DBSecret}:SecretString:password}} eliminating exposure of credentials in CloudFormation outputs or parameters. ECS task role is granted secretsmanager:GetSecretValue permission scoped to the DBSecret resource enabling containers to retrieve credentials at runtime for database connections. This Secrets Manager approach provides several critical security benefits including elimination of hardcoded passwords in templates and code preventing credential exposure in version control, centralized credential management enabling rotation without application deployment, automatic password generation with configurable complexity meeting security policy requirements, integration with IAM for access control ensuring only authorized services can retrieve credentials, and CloudTrail audit logging of all secret access for compliance and security investigations. For production deployments, organizations should enable automatic rotation through AWS Lambda rotation function, configure rotation schedules (e.g., every 30 days), implement application retry logic for rotation transition periods, and use VPC endpoints for Secrets Manager ensuring credentials are retrieved over private AWS network.

### ECS Fargate Serverless Containers

The infrastructure uses Amazon ECS with AWS Fargate launch type providing serverless container orchestration eliminating EC2 instance management. ECS cluster configuration uses CapacityProviders with FARGATE and FARGATE_SPOT enabling serverless compute with optional spot pricing for up to 70% cost savings, DefaultCapacityProviderStrategy specifying FARGATE with Weight 1 providing stable baseline capacity, and ClusterSettings with containerInsights enabled providing enhanced monitoring metrics at container, task, and service levels. Task definition specifies RequiresCompatibilities with FARGATE requiring serverless infrastructure, NetworkMode awsvpc providing each task with dedicated elastic network interface and private IP address, Cpu "256" (0.25 vCPU) and Memory "512" (512 MB) optimizing cost for nginx workload with AllowedPattern validation preventing invalid combinations, and Family using environment suffix enabling version tracking across deployments. ECS service uses LaunchType FARGATE eliminating need to specify capacity provider in service definition, DesiredCount referencing MinTaskCount parameter ensuring minimum tasks always running, NetworkConfiguration with AwsvpcConfiguration specifying private subnets, security group, and AssignPublicIp DISABLED ensuring containers cannot be accessed directly from internet. Load balancer integration uses ContainerName and ContainerPort with dynamic parameter references enabling flexible port configuration and TargetGroupArn connecting service to Application Load Balancer. Auto-scaling implements Application Auto Scaling with ScalableDimension ecs:service:DesiredCount scaling container count based on metrics, ResourceId using Fn::Sub: service/${ECSCluster}/${ECSService.Name} for dynamic service reference, and RoleARN referencing service-linked role arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService automatically created by AWS. This Fargate approach provides operational excellence through elimination of EC2 instance patching and scaling reducing operational overhead, automatic infrastructure scaling matching container requirements without capacity planning, pay-per-use pricing based on actual vCPU and memory consumption rather than instance hours, and security benefits through task-level isolation with dedicated ENIs and security groups. The infrastructure uses FARGATE for production workloads requiring stable compute and FARGATE_SPOT for development environments or fault-tolerant batch processing achieving up to 70% cost savings.

### Application Load Balancer with Health-Based Routing

Application Load Balancer provides Layer 7 load balancing with content-based routing, health checks, and SSL termination capabilities for high availability. The ALB is deployed as internet-facing in public subnets across two Availability Zones with Subnets array referencing PublicSubnet1 and PublicSubnet2 ensuring high availability and automatic failover during AZ failures. Scheme internet-facing enables inbound internet traffic for public web application with IpAddressType ipv4 supporting standard IPv4 addressing. ALB security group uses SecurityGroupIngress allowing HTTP port 80 and HTTPS port 443 from 0.0.0.0/0 enabling public access while SecurityGroupEgress allows all outbound traffic enabling ALB to reach ECS containers. Target group configuration uses TargetType ip required for Fargate tasks with awsvpc network mode, Protocol HTTP and Port referencing ContainerPort parameter for flexible port configuration, and VpcId ensuring target group operates within the VPC. Health check configuration includes HealthCheckEnabled true with HealthCheckProtocol HTTP, HealthCheckPath / validating application root responds, HealthCheckIntervalSeconds 30 checking health every 30 seconds, HealthCheckTimeoutSeconds 5 allowing 5 seconds for response, HealthyThresholdCount 2 requiring two consecutive successful checks before marking healthy, UnhealthyThresholdCount 3 requiring three consecutive failed checks before marking unhealthy, and Matcher HttpCode 200 expecting successful response. ECS service LoadBalancers configuration uses ContainerName webapp-container, ContainerPort dynamic reference, and TargetGroupArn connecting service to target group with HealthCheckGracePeriodSeconds 60 allowing containers to initialize before health checks begin. ALB listener uses Port 80, Protocol HTTP, and DefaultActions with Type forward to TargetGroupArn routing all HTTP traffic to target group. This ALB configuration implements high availability through cross-AZ deployment with automatic failover, health-based routing ensuring traffic only reaches healthy containers with rapid failure detection, path-based routing support enabling future microservices expansion, and SSL/TLS termination capability for HTTPS with ACM certificate integration. For production deployments, organizations should add HTTPS listener on port 443 with ACM certificate, configure HTTP to HTTPS redirect on port 80 listener enforcing encryption, implement WAF web application firewall for protection against OWASP Top 10 vulnerabilities, and enable access logs to S3 for compliance and security analysis.

### CloudFront with Origin Access Identity

CloudFront distribution implements secure content delivery with Origin Access Identity ensuring S3 bucket remains private while CloudFront serves content globally. Origin configuration uses S3Origin with DomainName from Fn::GetAtt: [S3Bucket, RegionalDomainName] avoiding deprecated website endpoint and using regional bucket domain, and S3OriginConfig with OriginAccessIdentity using Fn::Sub: origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity} connecting distribution to OAI. CloudFront Origin Access Identity resource uses CloudFrontOriginAccessIdentityConfig with Comment describing purpose enabling OAI to access private S3 bucket. S3 bucket policy grants permissions to OAI with Principal using Fn::Sub: arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity} referencing the OAI, Action s3:GetObject allowing object retrieval, and Resource using Fn::Sub: ${S3Bucket.Arn}/\* applying to all objects in bucket. This OAI approach provides security benefits through preventing direct public S3 access ensuring content can only be accessed through CloudFront, centralized access control with bucket policy managing OAI permissions, and support for private content with signed URLs and signed cookies for subscription-based access. S3 bucket PublicAccessBlockConfiguration blocks all public access including BlockPublicAcls, BlockPublicPolicy, IgnorePublicAcls, and RestrictPublicBuckets all set to true preventing accidental public exposure even if bucket policy is misconfigured. This configuration ensures S3 bucket never accepts public access while CloudFront OAI can retrieve objects for global distribution. For enhanced security, organizations should implement CloudFront signed URLs for premium content restricting access to authenticated users, configure custom SSL certificates for branded domains improving trust and SEO, enable CloudFront access logs to S3 for security analysis and usage tracking, and implement CloudFront Functions for lightweight request/response transformations.

### RDS Multi-AZ with Automated Backups

RDS database implements Multi-AZ deployment with automated backups, enhanced monitoring, and CloudWatch Logs integration for high availability and data protection. Multi-AZ configuration uses MultiAZ true enabling synchronous replication to standby instance in different Availability Zone with automatic failover typically completing within 60-120 seconds during instance failure or AZ outage. Database subnet group includes SubnetIds referencing PrivateSubnet1 and PrivateSubnet2 enabling RDS to deploy primary in one AZ and standby in another AZ while maintaining private network isolation. Backup configuration includes BackupRetentionPeriod 7 as specifically required meeting compliance for 7-day point-in-time recovery, PreferredBackupWindow "03:00-04:00" scheduling automated backups during typical low traffic period minimizing performance impact, and automatic backups enabled by default when retention period is greater than zero. PreferredMaintenanceWindow "sun:04:00-sun:05:00" schedules automated maintenance including OS patching and minor version upgrades during weekend low traffic period. Enhanced monitoring configuration uses MonitoringInterval 60 providing OS-level metrics at 60-second granularity and MonitoringRoleArn referencing RDS monitoring role with AmazonRDSEnhancedMonitoringRole enabling CloudWatch to collect metrics. CloudWatch Logs exports use EnableCloudwatchLogsExports with error for database errors and failed queries, general for complete query audit trail, and slowquery for performance optimization enabling identification of inefficient queries. Storage configuration uses StorageType gp3 providing baseline performance with burst capability, AllocatedStorage "20" GB sufficient for development with easy scaling for production, and StorageEncrypted true with KmsKeyId ensuring all data at rest is encrypted. This RDS configuration implements reliability through Multi-AZ automatic failover with synchronous replication ensuring no data loss, automated backups with 7-day retention enabling point-in-time recovery, and security through KMS encryption and private subnet deployment. For production deployments, organizations should increase backup retention to 14-30 days for extended recovery window, enable Performance Insights for advanced query performance analysis, configure read replicas for read scalability and disaster recovery, and implement IAM database authentication for temporary credential-based access.

### Auto Scaling with Target Tracking

ECS service implements Application Auto Scaling with target tracking policy automatically adjusting container count based on CPU utilization. ScalableTarget resource defines auto-scaling configuration with MaxCapacity referencing MaxTaskCount parameter (default 10) defining scale-out limit, MinCapacity referencing MinTaskCount parameter (default 2) ensuring minimum availability, ResourceId using Fn::Sub: service/${ECSCluster}/${ECSService.Name} dynamically identifying the ECS service, ScalableDimension ecs:service:DesiredCount specifying task count as scaling dimension, ServiceNamespace ecs indicating ECS service, and RoleARN referencing service-linked role arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService automatically created by AWS with necessary permissions. Scaling policy uses PolicyType TargetTrackingScaling providing automatic scaling based on metric target, TargetTrackingScalingPolicyConfiguration with PredefinedMetricSpecification using PredefinedMetricType ECSServiceAverageCPUUtilization monitoring average CPU across all tasks, TargetValue 70 maintaining 70% CPU utilization providing headroom for traffic spikes while optimizing resource utilization, ScaleOutCooldown 300 seconds preventing rapid scale-out thrashing, and ScaleInCooldown 300 seconds preventing premature scale-in after traffic decreases. This target tracking approach automatically adds tasks when CPU exceeds 70% ensuring performance during traffic spikes, removes tasks when CPU drops below 70% optimizing costs during low traffic, and maintains minimum 2 tasks regardless of load ensuring baseline availability. The 70% target balances efficiency with headroom providing 30% capacity buffer for sudden traffic increases before additional tasks launch. Target tracking continuously monitors the metric and adjusts task count incrementally ensuring smooth scaling without manual intervention. For production workloads, organizations should implement multiple scaling policies using additional metrics like memory utilization or ALB request count per target preventing single metric blind spots, configure scheduled scaling for predictable traffic patterns like daily peaks, implement step scaling for rapid response to large traffic changes, and set appropriate minimum and maximum task counts balancing cost with availability requirements.

### SSM Parameter Store for Dynamic AMI Selection

Bastion Host uses SSM Parameter Store for dynamic AMI selection ensuring latest Amazon Linux 2 AMI without hardcoded AMI IDs. ImageId property uses CloudFormation dynamic reference {{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}} retrieving latest Amazon Linux 2 AMI ID published by AWS in SSM Parameter Store public parameters. This approach eliminates hardcoded AMI IDs preventing deployment failures when AMIs are deprecated or deregistered, ensures latest security patches are deployed without template updates as AWS automatically updates the SSM parameter when new AMIs are released, supports multi-region deployments as SSM parameter is region-specific automatically selecting appropriate AMI for the deployment region, and simplifies template maintenance by removing need to update AMI IDs across templates and regions. The SSM parameter path /aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2 is AWS-provided public parameter specifying amzn2 for Amazon Linux 2, ami for image type, hvm for virtualization type, and x86_64-gp2 for architecture and storage type. CloudFormation resolves the SSM parameter at stack creation time retrieving the current AMI ID and using it for EC2 instance launch. This dynamic resolution ensures Bastion Host always uses latest Amazon Linux 2 with security patches without manual AMI ID updates. For production environments, organizations should consider using specific AMI versions for predictable deployments and change control, implement golden AMI process with custom hardening and compliance configurations, use AWS Systems Manager Automation for patching running instances, and maintain AMI inventory with tags for governance and compliance tracking.

### Conditional Resource Creation with CloudFormation

Bastion Host key pair is conditionally configured using CloudFormation Fn::If intrinsic function enabling optional SSH key association. Conditions section defines HasKeyPair using Fn::Not and Fn::Equals checking if KeyName parameter is empty string, returning true when key pair name is provided and false when empty. KeyName parameter uses Type String with Default empty string enabling stack deployment without requiring key pair, and Description indicating optional usage. BastionHost resource KeyName property uses Fn::If: [HasKeyPair, {Ref: KeyName}, {Ref: AWS::NoValue}] evaluating the HasKeyPair condition, returning KeyName parameter value when condition is true enabling SSH access, and returning AWS::NoValue when condition is false omitting the KeyName property entirely. AWS::NoValue is special CloudFormation value indicating property should be omitted from resource as if it was never specified. This conditional approach enables flexible deployment scenarios including development environments without key pairs for isolated testing, production environments with key pairs for administrative access, and automated deployments where key pairs are provisionally created. Organizations can deploy the same template across multiple environments with environment-specific parameters controlling optional resource configurations. For enhanced security, organizations should implement AWS Systems Manager Session Manager for bastion access eliminating SSH keys entirely and providing audited browser-based terminal access, configure bastion security group to restrict SSH access to specific IP ranges using CidrIp parameter, implement key rotation policies requiring periodic key pair regeneration, and use EC2 Instance Connect for temporary key-based access with federated authentication.

### Comprehensive Resource Tagging for Governance

All infrastructure resources implement comprehensive tagging strategy enabling cost allocation, resource organization, compliance reporting, and automated operations. Every resource includes Name tag using Fn::Sub for dynamic generation incorporating resource type and EnvironmentName parameter creating human-readable identifiers like WebApp-VPC-Production, enabling visual identification in AWS Console and CLI, and supporting resource inventory and documentation. Environment tag references EnvironmentName parameter with AllowedValues of Production, Staging, and Development enabling cost allocation reports by environment showing spend breakdown across deployment stages, tag-based IAM policies restricting permissions based on environment value implementing attribute-based access control, and resource filtering in Console for environment-specific operations. Project tag uses static value "WebApp" enabling cost allocation by project for multi-project AWS accounts, chargeback to appropriate business units, and resource organization by application. This three-tag strategy provides foundational governance but production environments should expand to five-tag strategy including Owner tag identifying responsible team or individual for operational issues, and CostCenter tag enabling financial reporting and chargeback for internal accounting. Consistent tagging across all resources including VPC, subnets, gateways, security groups, IAM roles, S3 buckets, CloudFront distributions, RDS instances, ECS clusters, load balancers, and alarms ensures complete coverage for cost allocation and automated operations. Tags use consistent naming conventions with PascalCase keys (Name, Environment, Project) and appropriate value formats. This tagging enables AWS Cost Explorer reports with filtering and grouping by any tag combination showing detailed cost breakdown by environment and project, AWS Config rules validating required tags ensuring compliance with tagging policies, automated operations through AWS Systems Manager targeting resources by tags for patching and maintenance, and Resource Groups organizing related resources for consolidated viewing and operations. For enterprise deployments, organizations should enforce tagging through AWS Config rules requiring mandatory tags, Service Control Policies preventing resource creation without required tags, tag-based billing alerts notifying teams when costs exceed thresholds, and automated tagging through Infrastructure as Code ensuring consistency.

## CloudFormation Template

```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Scalable web application environment with VPC, ECS, RDS, S3, CloudFront, KMS encryption, Bastion Host, and CloudWatch monitoring in us-west-1",
  "Metadata": {
    "AWS::CloudFormation::Interface": {
      "ParameterGroups": [
        {
          "Label": {
            "default": "Environment Configuration"
          },
          "Parameters": ["EnvironmentName"]
        },
        {
          "Label": {
            "default": "Network Configuration"
          },
          "Parameters": [
            "VpcCIDR",
            "PublicSubnet1CIDR",
            "PublicSubnet2CIDR",
            "PrivateSubnet1CIDR",
            "PrivateSubnet2CIDR"
          ]
        },
        {
          "Label": {
            "default": "EC2 Configuration"
          },
          "Parameters": ["BastionInstanceType", "KeyName"]
        },
        {
          "Label": {
            "default": "ECS Configuration"
          },
          "Parameters": [
            "ContainerImage",
            "ContainerPort",
            "MinTaskCount",
            "MaxTaskCount"
          ]
        },
        {
          "Label": {
            "default": "Database Configuration"
          },
          "Parameters": ["DBInstanceClass", "DBName", "DBUsername"]
        },
        {
          "Label": {
            "default": "Monitoring Configuration"
          },
          "Parameters": ["AlertEmail"]
        }
      ]
    }
  },
  "Parameters": {
    "EnvironmentName": {
      "Type": "String",
      "Default": "Production",
      "Description": "Environment name for resource tagging",
      "AllowedValues": ["Production", "Staging", "Development"]
    },
    "VpcCIDR": {
      "Type": "String",
      "Default": "10.0.0.0/16",
      "Description": "CIDR block for VPC",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/16)$"
    },
    "PublicSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.1.0/24",
      "Description": "CIDR block for Public Subnet 1",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PublicSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.2.0/24",
      "Description": "CIDR block for Public Subnet 2",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet1CIDR": {
      "Type": "String",
      "Default": "10.0.10.0/24",
      "Description": "CIDR block for Private Subnet 1",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "PrivateSubnet2CIDR": {
      "Type": "String",
      "Default": "10.0.11.0/24",
      "Description": "CIDR block for Private Subnet 2",
      "AllowedPattern": "^(10\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}/24)$"
    },
    "BastionInstanceType": {
      "Type": "String",
      "Default": "t2.micro",
      "Description": "EC2 instance type for bastion host",
      "AllowedValues": ["t2.micro", "t2.small", "t2.medium"]
    },
    "KeyName": {
      "Type": "String",
      "Default": "",
      "Description": "EC2 Key Pair for SSH access to bastion host (optional)"
    },
    "ContainerImage": {
      "Type": "String",
      "Default": "nginx:latest",
      "Description": "Docker container image for web application"
    },
    "ContainerPort": {
      "Type": "Number",
      "Default": 80,
      "Description": "Port number the container listens on"
    },
    "MinTaskCount": {
      "Type": "Number",
      "Default": 2,
      "Description": "Minimum number of ECS tasks",
      "MinValue": 2,
      "MaxValue": 10
    },
    "MaxTaskCount": {
      "Type": "Number",
      "Default": 10,
      "Description": "Maximum number of ECS tasks",
      "MinValue": 2,
      "MaxValue": 10
    },
    "DBInstanceClass": {
      "Type": "String",
      "Default": "db.t3.micro",
      "Description": "RDS instance class",
      "AllowedValues": ["db.t3.micro", "db.t3.small", "db.t3.medium"]
    },
    "DBName": {
      "Type": "String",
      "Default": "webappdb",
      "Description": "Database name",
      "MinLength": "1",
      "MaxLength": "64",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "DBUsername": {
      "Type": "String",
      "Default": "admin",
      "Description": "Database master username",
      "MinLength": "1",
      "MaxLength": "16",
      "AllowedPattern": "^[a-zA-Z][a-zA-Z0-9]*$"
    },
    "AlertEmail": {
      "Type": "String",
      "Default": "admin@example.com",
      "Description": "Email address for CloudWatch alarm notifications",
      "AllowedPattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
    }
  },
  "Conditions": {
    "HasKeyPair": {
      "Fn::Not": [
        {
          "Fn::Equals": [
            {
              "Ref": "KeyName"
            },
            ""
          ]
        }
      ]
    }
  },
  "Resources": {
    "VPC": {
      "Type": "AWS::EC2::VPC",
      "Properties": {
        "CidrBlock": {
          "Ref": "VpcCIDR"
        },
        "EnableDnsHostnames": true,
        "EnableDnsSupport": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-VPC-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "InternetGateway": {
      "Type": "AWS::EC2::InternetGateway",
      "Properties": {
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-IGW-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "AttachGateway": {
      "Type": "AWS::EC2::VPCGatewayAttachment",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "InternetGatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-PublicSubnet1-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "PublicSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PublicSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": true,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-PublicSubnet2-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "PrivateSubnet1": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet1CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            0,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-PrivateSubnet1-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "PrivateSubnet2": {
      "Type": "AWS::EC2::Subnet",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "CidrBlock": {
          "Ref": "PrivateSubnet2CIDR"
        },
        "AvailabilityZone": {
          "Fn::Select": [
            1,
            {
              "Fn::GetAZs": ""
            }
          ]
        },
        "MapPublicIpOnLaunch": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-PrivateSubnet2-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "NATGatewayEIP": {
      "Type": "AWS::EC2::EIP",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Domain": "vpc",
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-NAT-EIP-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "NATGateway": {
      "Type": "AWS::EC2::NatGateway",
      "Properties": {
        "AllocationId": {
          "Fn::GetAtt": ["NATGatewayEIP", "AllocationId"]
        },
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-NATGateway-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "PublicRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-PublicRouteTable-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "PublicRoute": {
      "Type": "AWS::EC2::Route",
      "DependsOn": "AttachGateway",
      "Properties": {
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "GatewayId": {
          "Ref": "InternetGateway"
        }
      }
    },
    "PublicSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PublicSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PublicSubnet2"
        },
        "RouteTableId": {
          "Ref": "PublicRouteTable"
        }
      }
    },
    "PrivateRouteTable": {
      "Type": "AWS::EC2::RouteTable",
      "Properties": {
        "VpcId": {
          "Ref": "VPC"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-PrivateRouteTable-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "PrivateRoute": {
      "Type": "AWS::EC2::Route",
      "Properties": {
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        },
        "DestinationCidrBlock": "0.0.0.0/0",
        "NatGatewayId": {
          "Ref": "NATGateway"
        }
      }
    },
    "PrivateSubnet1RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet1"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "PrivateSubnet2RouteTableAssociation": {
      "Type": "AWS::EC2::SubnetRouteTableAssociation",
      "Properties": {
        "SubnetId": {
          "Ref": "PrivateSubnet2"
        },
        "RouteTableId": {
          "Ref": "PrivateRouteTable"
        }
      }
    },
    "AdminRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "WebApp-AdminRole-${AWS::StackName}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/AdministratorAccess"],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-AdminRole-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "DeveloperRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "WebApp-DeveloperRole-${AWS::StackName}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "DeveloperPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "ecs:*",
                    "ecr:*",
                    "s3:*",
                    "cloudwatch:*",
                    "logs:*",
                    "rds:Describe*"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-DeveloperRole-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ReadOnlyRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": {
          "Fn::Sub": "WebApp-ReadOnlyRole-${AWS::StackName}"
        },
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": ["arn:aws:iam::aws:policy/ReadOnlyAccess"],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ReadOnlyRole-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "BastionInstanceRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "RoleName": "BastionInstanceRole",
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ec2.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
          "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        ],
        "Policies": [
          {
            "PolicyName": "SecretsManagerReadAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                  ],
                  "Resource": {
                    "Ref": "DBSecret"
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "S3Access",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:ListBucket"
                  ],
                  "Resource": [
                    {
                      "Fn::GetAtt": ["S3Bucket", "Arn"]
                    },
                    {
                      "Fn::Sub": "${S3Bucket.Arn}/*"
                    }
                  ]
                },
                {
                  "Effect": "Allow",
                  "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                  ],
                  "Resource": {
                    "Fn::GetAtt": ["S3KMSKey", "Arn"]
                  }
                }
              ]
            }
          },
          {
            "PolicyName": "CloudWatchAccess",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": [
                    "cloudwatch:PutMetricData",
                    "cloudwatch:GetMetricStatistics",
                    "cloudwatch:ListMetrics"
                  ],
                  "Resource": "*"
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": "BastionInstanceRole"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "BastionInstanceProfile": {
      "Type": "AWS::IAM::InstanceProfile",
      "Properties": {
        "InstanceProfileName": "BastionInstanceProfile",
        "Roles": [
          {
            "Ref": "BastionInstanceRole"
          }
        ]
      }
    },
    "S3KMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for S3 bucket encryption",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-S3-KMSKey-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "S3KMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/webapp-s3-${AWS::StackName}"
        },
        "TargetKeyId": {
          "Ref": "S3KMSKey"
        }
      }
    },
    "RDSKMSKey": {
      "Type": "AWS::KMS::Key",
      "Properties": {
        "Description": "KMS key for RDS encryption",
        "KeyPolicy": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "Enable IAM User Permissions",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root"
                }
              },
              "Action": "kms:*",
              "Resource": "*"
            }
          ]
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-RDS-KMSKey-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "RDSKMSKeyAlias": {
      "Type": "AWS::KMS::Alias",
      "Properties": {
        "AliasName": {
          "Fn::Sub": "alias/webapp-rds-${AWS::StackName}"
        },
        "TargetKeyId": {
          "Ref": "RDSKMSKey"
        }
      }
    },
    "S3Bucket": {
      "Type": "AWS::S3::Bucket",
      "Properties": {
        "BucketName": {
          "Fn::Sub": "webapp-backup-${AWS::AccountId}-${AWS::Region}"
        },
        "VersioningConfiguration": {
          "Status": "Enabled"
        },
        "BucketEncryption": {
          "ServerSideEncryptionConfiguration": [
            {
              "ServerSideEncryptionByDefault": {
                "SSEAlgorithm": "aws:kms",
                "KMSMasterKeyID": {
                  "Ref": "S3KMSKey"
                }
              }
            }
          ]
        },
        "PublicAccessBlockConfiguration": {
          "BlockPublicAcls": true,
          "BlockPublicPolicy": true,
          "IgnorePublicAcls": true,
          "RestrictPublicBuckets": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-S3Bucket-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "CloudFrontOriginAccessIdentity": {
      "Type": "AWS::CloudFront::CloudFrontOriginAccessIdentity",
      "Properties": {
        "CloudFrontOriginAccessIdentityConfig": {
          "Comment": "Origin Access Identity for WebApp S3 bucket"
        }
      }
    },
    "S3BucketPolicy": {
      "Type": "AWS::S3::BucketPolicy",
      "Properties": {
        "Bucket": {
          "Ref": "S3Bucket"
        },
        "PolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Sid": "AllowCloudFrontAccess",
              "Effect": "Allow",
              "Principal": {
                "AWS": {
                  "Fn::Sub": "arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${CloudFrontOriginAccessIdentity}"
                }
              },
              "Action": "s3:GetObject",
              "Resource": {
                "Fn::Sub": "${S3Bucket.Arn}/*"
              }
            }
          ]
        }
      }
    },
    "CloudFrontDistribution": {
      "Type": "AWS::CloudFront::Distribution",
      "Properties": {
        "DistributionConfig": {
          "Origins": [
            {
              "Id": "S3Origin",
              "DomainName": {
                "Fn::GetAtt": ["S3Bucket", "RegionalDomainName"]
              },
              "S3OriginConfig": {
                "OriginAccessIdentity": {
                  "Fn::Sub": "origin-access-identity/cloudfront/${CloudFrontOriginAccessIdentity}"
                }
              }
            }
          ],
          "Enabled": true,
          "Comment": "CloudFront distribution for WebApp static content",
          "DefaultCacheBehavior": {
            "TargetOriginId": "S3Origin",
            "ViewerProtocolPolicy": "redirect-to-https",
            "AllowedMethods": ["GET", "HEAD"],
            "CachedMethods": ["GET", "HEAD"],
            "Compress": true,
            "ForwardedValues": {
              "QueryString": false,
              "Cookies": {
                "Forward": "none"
              }
            },
            "MinTTL": 0,
            "DefaultTTL": 86400,
            "MaxTTL": 31536000
          },
          "CacheBehaviors": [
            {
              "PathPattern": "*.jpg",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "AllowedMethods": ["GET", "HEAD"],
              "CachedMethods": ["GET", "HEAD"],
              "Compress": true,
              "ForwardedValues": {
                "QueryString": false,
                "Cookies": {
                  "Forward": "none"
                }
              },
              "MinTTL": 86400,
              "DefaultTTL": 604800,
              "MaxTTL": 31536000
            },
            {
              "PathPattern": "*.png",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "AllowedMethods": ["GET", "HEAD"],
              "CachedMethods": ["GET", "HEAD"],
              "Compress": true,
              "ForwardedValues": {
                "QueryString": false,
                "Cookies": {
                  "Forward": "none"
                }
              },
              "MinTTL": 86400,
              "DefaultTTL": 604800,
              "MaxTTL": 31536000
            },
            {
              "PathPattern": "*.css",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "AllowedMethods": ["GET", "HEAD"],
              "CachedMethods": ["GET", "HEAD"],
              "Compress": true,
              "ForwardedValues": {
                "QueryString": false,
                "Cookies": {
                  "Forward": "none"
                }
              },
              "MinTTL": 86400,
              "DefaultTTL": 604800,
              "MaxTTL": 31536000
            },
            {
              "PathPattern": "*.js",
              "TargetOriginId": "S3Origin",
              "ViewerProtocolPolicy": "redirect-to-https",
              "AllowedMethods": ["GET", "HEAD"],
              "CachedMethods": ["GET", "HEAD"],
              "Compress": true,
              "ForwardedValues": {
                "QueryString": false,
                "Cookies": {
                  "Forward": "none"
                }
              },
              "MinTTL": 86400,
              "DefaultTTL": 604800,
              "MaxTTL": 31536000
            }
          ],
          "PriceClass": "PriceClass_100"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-CloudFront-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "DBSecret": {
      "Type": "AWS::SecretsManager::Secret",
      "Properties": {
        "Name": {
          "Fn::Sub": "WebApp-RDS-Credentials-${AWS::StackName}"
        },
        "Description": "RDS MySQL database master credentials",
        "GenerateSecretString": {
          "SecretStringTemplate": {
            "Fn::Sub": "{\"username\": \"${DBUsername}\"}"
          },
          "GenerateStringKey": "password",
          "PasswordLength": 32,
          "ExcludeCharacters": "\"@/\\",
          "RequireEachIncludedType": true
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-DBSecret-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "DBSubnetGroup": {
      "Type": "AWS::RDS::DBSubnetGroup",
      "Properties": {
        "DBSubnetGroupDescription": "Subnet group for RDS database",
        "SubnetIds": [
          {
            "Ref": "PrivateSubnet1"
          },
          {
            "Ref": "PrivateSubnet2"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-DBSubnetGroup-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "DatabaseSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for RDS database - allows MySQL access from ECS tasks only",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "ECSSecurityGroup"
            },
            "Description": "MySQL access from ECS tasks"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 3306,
            "ToPort": 3306,
            "SourceSecurityGroupId": {
              "Ref": "BastionSecurityGroup"
            },
            "Description": "MySQL access from Bastion host"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-DatabaseSG-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "RDSInstance": {
      "Type": "AWS::RDS::DBInstance",
      "DeletionPolicy": "Delete",
      "Properties": {
        "DBInstanceIdentifier": {
          "Fn::Sub": "webapp-database-${EnvironmentName}"
        },
        "DBName": {
          "Ref": "DBName"
        },
        "DBInstanceClass": {
          "Ref": "DBInstanceClass"
        },
        "Engine": "mysql",
        "EngineVersion": "8.0.43",
        "MasterUsername": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:username}}"
        },
        "MasterUserPassword": {
          "Fn::Sub": "{{resolve:secretsmanager:${DBSecret}:SecretString:password}}"
        },
        "AllocatedStorage": "20",
        "StorageType": "gp3",
        "StorageEncrypted": true,
        "KmsKeyId": {
          "Ref": "RDSKMSKey"
        },
        "MultiAZ": true,
        "DBSubnetGroupName": {
          "Ref": "DBSubnetGroup"
        },
        "VPCSecurityGroups": [
          {
            "Ref": "DatabaseSecurityGroup"
          }
        ],
        "BackupRetentionPeriod": 7,
        "PreferredBackupWindow": "03:00-04:00",
        "PreferredMaintenanceWindow": "sun:04:00-sun:05:00",
        "EnableCloudwatchLogsExports": ["error", "general", "slowquery"],
        "MonitoringInterval": 60,
        "MonitoringRoleArn": {
          "Fn::GetAtt": ["RDSMonitoringRole", "Arn"]
        },
        "PubliclyAccessible": false,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-RDSInstance-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "RDSMonitoringRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "monitoring.rds.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        ]
      }
    },
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": {
          "Fn::Sub": "WebApp-Cluster-${EnvironmentName}"
        },
        "CapacityProviders": ["FARGATE", "FARGATE_SPOT"],
        "DefaultCapacityProviderStrategy": [
          {
            "CapacityProvider": "FARGATE",
            "Weight": 1
          }
        ],
        "ClusterSettings": [
          {
            "Name": "containerInsights",
            "Value": "enabled"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ECSCluster-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ECSTaskExecutionRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "ManagedPolicyArns": [
          "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ECSTaskExecutionRole-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ECSTaskRole": {
      "Type": "AWS::IAM::Role",
      "Properties": {
        "AssumeRolePolicyDocument": {
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {
                "Service": "ecs-tasks.amazonaws.com"
              },
              "Action": "sts:AssumeRole"
            }
          ]
        },
        "Policies": [
          {
            "PolicyName": "ECSTaskPolicy",
            "PolicyDocument": {
              "Version": "2012-10-17",
              "Statement": [
                {
                  "Effect": "Allow",
                  "Action": ["s3:GetObject", "s3:PutObject"],
                  "Resource": {
                    "Fn::Sub": "${S3Bucket.Arn}/*"
                  }
                },
                {
                  "Effect": "Allow",
                  "Action": ["secretsmanager:GetSecretValue"],
                  "Resource": {
                    "Ref": "DBSecret"
                  }
                }
              ]
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ECSTaskRole-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ECSLogGroup": {
      "Type": "AWS::Logs::LogGroup",
      "Properties": {
        "LogGroupName": {
          "Fn::Sub": "/ecs/webapp-${EnvironmentName}"
        },
        "RetentionInDays": 7
      }
    },
    "ECSTaskDefinition": {
      "Type": "AWS::ECS::TaskDefinition",
      "Properties": {
        "Family": {
          "Fn::Sub": "webapp-task-${EnvironmentName}"
        },
        "NetworkMode": "awsvpc",
        "RequiresCompatibilities": ["FARGATE"],
        "Cpu": "256",
        "Memory": "512",
        "ExecutionRoleArn": {
          "Fn::GetAtt": ["ECSTaskExecutionRole", "Arn"]
        },
        "TaskRoleArn": {
          "Fn::GetAtt": ["ECSTaskRole", "Arn"]
        },
        "ContainerDefinitions": [
          {
            "Name": "webapp-container",
            "Image": {
              "Ref": "ContainerImage"
            },
            "PortMappings": [
              {
                "ContainerPort": {
                  "Ref": "ContainerPort"
                },
                "Protocol": "tcp"
              }
            ],
            "Environment": [
              {
                "Name": "DB_HOST",
                "Value": {
                  "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]
                }
              }
            ],
            "LogConfiguration": {
              "LogDriver": "awslogs",
              "Options": {
                "awslogs-group": {
                  "Ref": "ECSLogGroup"
                },
                "awslogs-region": {
                  "Ref": "AWS::Region"
                },
                "awslogs-stream-prefix": "ecs"
              }
            }
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-TaskDefinition-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ALBSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Application Load Balancer - allows HTTP and HTTPS",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 80,
            "ToPort": 80,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTP access from anywhere"
          },
          {
            "IpProtocol": "tcp",
            "FromPort": 443,
            "ToPort": 443,
            "CidrIp": "0.0.0.0/0",
            "Description": "HTTPS access from anywhere"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ALBSG-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ECSSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for ECS tasks - allows traffic from ALB",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": {
              "Ref": "ContainerPort"
            },
            "ToPort": {
              "Ref": "ContainerPort"
            },
            "SourceSecurityGroupId": {
              "Ref": "ALBSecurityGroup"
            },
            "Description": "Traffic from ALB"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ECSSG-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ApplicationLoadBalancer": {
      "Type": "AWS::ElasticLoadBalancingV2::LoadBalancer",
      "DependsOn": "AttachGateway",
      "Properties": {
        "Name": {
          "Fn::Sub": "WebApp-ALB-${EnvironmentName}"
        },
        "Type": "application",
        "Scheme": "internet-facing",
        "IpAddressType": "ipv4",
        "Subnets": [
          {
            "Ref": "PublicSubnet1"
          },
          {
            "Ref": "PublicSubnet2"
          }
        ],
        "SecurityGroups": [
          {
            "Ref": "ALBSecurityGroup"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ALB-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ALBTargetGroup": {
      "Type": "AWS::ElasticLoadBalancingV2::TargetGroup",
      "Properties": {
        "Name": {
          "Fn::Sub": "WebApp-TG-${EnvironmentName}"
        },
        "Port": {
          "Ref": "ContainerPort"
        },
        "Protocol": "HTTP",
        "VpcId": {
          "Ref": "VPC"
        },
        "TargetType": "ip",
        "HealthCheckEnabled": true,
        "HealthCheckProtocol": "HTTP",
        "HealthCheckPath": "/",
        "HealthCheckIntervalSeconds": 30,
        "HealthCheckTimeoutSeconds": 5,
        "HealthyThresholdCount": 2,
        "UnhealthyThresholdCount": 3,
        "Matcher": {
          "HttpCode": "200"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-TargetGroup-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ALBListener": {
      "Type": "AWS::ElasticLoadBalancingV2::Listener",
      "Properties": {
        "LoadBalancerArn": {
          "Ref": "ApplicationLoadBalancer"
        },
        "Port": 80,
        "Protocol": "HTTP",
        "DefaultActions": [
          {
            "Type": "forward",
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ]
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "DependsOn": "ALBListener",
      "Properties": {
        "ServiceName": {
          "Fn::Sub": "webapp-service-${EnvironmentName}"
        },
        "Cluster": {
          "Ref": "ECSCluster"
        },
        "TaskDefinition": {
          "Ref": "ECSTaskDefinition"
        },
        "LaunchType": "FARGATE",
        "DesiredCount": {
          "Ref": "MinTaskCount"
        },
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "DISABLED",
            "SecurityGroups": [
              {
                "Ref": "ECSSecurityGroup"
              }
            ],
            "Subnets": [
              {
                "Ref": "PrivateSubnet1"
              },
              {
                "Ref": "PrivateSubnet2"
              }
            ]
          }
        },
        "LoadBalancers": [
          {
            "ContainerName": "webapp-container",
            "ContainerPort": {
              "Ref": "ContainerPort"
            },
            "TargetGroupArn": {
              "Ref": "ALBTargetGroup"
            }
          }
        ],
        "HealthCheckGracePeriodSeconds": 60,
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-ECSService-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ServiceScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": {
          "Ref": "MaxTaskCount"
        },
        "MinCapacity": {
          "Ref": "MinTaskCount"
        },
        "ResourceId": {
          "Fn::Sub": "service/${ECSCluster}/${ECSService.Name}"
        },
        "RoleARN": {
          "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:role/aws-service-role/ecs.application-autoscaling.amazonaws.com/AWSServiceRoleForApplicationAutoScaling_ECSService"
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "ServiceScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": {
          "Fn::Sub": "WebApp-ECSScalingPolicy-${EnvironmentName}"
        },
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {
          "Ref": "ServiceScalingTarget"
        },
        "TargetTrackingScalingPolicyConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "TargetValue": 70,
          "ScaleInCooldown": 300,
          "ScaleOutCooldown": 300
        }
      }
    },
    "BastionSecurityGroup": {
      "Type": "AWS::EC2::SecurityGroup",
      "Properties": {
        "GroupDescription": "Security group for Bastion Host - allows SSH access",
        "VpcId": {
          "Ref": "VPC"
        },
        "SecurityGroupIngress": [
          {
            "IpProtocol": "tcp",
            "FromPort": 22,
            "ToPort": 22,
            "CidrIp": "0.0.0.0/0",
            "Description": "SSH access from anywhere"
          }
        ],
        "SecurityGroupEgress": [
          {
            "IpProtocol": "-1",
            "CidrIp": "0.0.0.0/0",
            "Description": "Allow all outbound traffic"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-BastionSG-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "BastionHost": {
      "Type": "AWS::EC2::Instance",
      "Properties": {
        "ImageId": "{{resolve:ssm:/aws/service/ami-amazon-linux-latest/amzn2-ami-hvm-x86_64-gp2}}",
        "InstanceType": {
          "Ref": "BastionInstanceType"
        },
        "KeyName": {
          "Fn::If": [
            "HasKeyPair",
            {
              "Ref": "KeyName"
            },
            {
              "Ref": "AWS::NoValue"
            }
          ]
        },
        "SecurityGroupIds": [
          {
            "Ref": "BastionSecurityGroup"
          }
        ],
        "SubnetId": {
          "Ref": "PublicSubnet1"
        },
        "Monitoring": true,
        "IamInstanceProfile": {
          "Ref": "BastionInstanceProfile"
        },
        "UserData": {
          "Fn::Base64": "#!/bin/bash\nset -e\nyum update -y\nyum install -y amazon-ssm-agent\nsystemctl enable amazon-ssm-agent\nsystemctl start amazon-ssm-agent\n"
        },
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-BastionHost-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "SNSTopic": {
      "Type": "AWS::SNS::Topic",
      "Properties": {
        "TopicName": {
          "Fn::Sub": "WebApp-Alerts-${EnvironmentName}"
        },
        "DisplayName": "WebApp CloudWatch Alerts",
        "Subscription": [
          {
            "Endpoint": {
              "Ref": "AlertEmail"
            },
            "Protocol": "email"
          }
        ],
        "Tags": [
          {
            "Key": "Name",
            "Value": {
              "Fn::Sub": "WebApp-SNSTopic-${EnvironmentName}"
            }
          },
          {
            "Key": "Environment",
            "Value": "Production"
          },
          {
            "Key": "Project",
            "Value": "WebApp"
          }
        ]
      }
    },
    "ECSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "WebApp-ECS-CPU-High-${EnvironmentName}"
        },
        "AlarmDescription": "Alarm when ECS service CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/ECS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "ServiceName",
            "Value": {
              "Fn::GetAtt": ["ECSService", "Name"]
            }
          },
          {
            "Name": "ClusterName",
            "Value": {
              "Ref": "ECSCluster"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    },
    "RDSCPUAlarm": {
      "Type": "AWS::CloudWatch::Alarm",
      "Properties": {
        "AlarmName": {
          "Fn::Sub": "WebApp-RDS-CPU-High-${EnvironmentName}"
        },
        "AlarmDescription": "Alarm when RDS CPU exceeds 80%",
        "MetricName": "CPUUtilization",
        "Namespace": "AWS/RDS",
        "Statistic": "Average",
        "Period": 300,
        "EvaluationPeriods": 2,
        "Threshold": 80,
        "ComparisonOperator": "GreaterThanThreshold",
        "Dimensions": [
          {
            "Name": "DBInstanceIdentifier",
            "Value": {
              "Ref": "RDSInstance"
            }
          }
        ],
        "AlarmActions": [
          {
            "Ref": "SNSTopic"
          }
        ],
        "TreatMissingData": "notBreaching"
      }
    }
  },
  "Outputs": {
    "VPCId": {
      "Description": "VPC ID",
      "Value": {
        "Ref": "VPC"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-VPCId"
        }
      }
    },
    "PublicSubnet1Id": {
      "Description": "Public Subnet 1 ID",
      "Value": {
        "Ref": "PublicSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet1Id"
        }
      }
    },
    "PublicSubnet2Id": {
      "Description": "Public Subnet 2 ID",
      "Value": {
        "Ref": "PublicSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PublicSubnet2Id"
        }
      }
    },
    "PrivateSubnet1Id": {
      "Description": "Private Subnet 1 ID",
      "Value": {
        "Ref": "PrivateSubnet1"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet1Id"
        }
      }
    },
    "PrivateSubnet2Id": {
      "Description": "Private Subnet 2 ID",
      "Value": {
        "Ref": "PrivateSubnet2"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-PrivateSubnet2Id"
        }
      }
    },
    "NATGatewayId": {
      "Description": "NAT Gateway ID",
      "Value": {
        "Ref": "NATGateway"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-NATGatewayId"
        }
      }
    },
    "LoadBalancerURL": {
      "Description": "Application Load Balancer DNS Name",
      "Value": {
        "Fn::GetAtt": ["ApplicationLoadBalancer", "DNSName"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ALB-DNS"
        }
      }
    },
    "CloudFrontURL": {
      "Description": "CloudFront distribution URL",
      "Value": {
        "Fn::GetAtt": ["CloudFrontDistribution", "DomainName"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-CloudFront-URL"
        }
      }
    },
    "BastionHostPublicIP": {
      "Description": "Public IP address of the Bastion Host",
      "Value": {
        "Fn::GetAtt": ["BastionHost", "PublicIp"]
      }
    },
    "S3BucketName": {
      "Description": "S3 bucket name",
      "Value": {
        "Ref": "S3Bucket"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-S3BucketName"
        }
      }
    },
    "RDSEndpoint": {
      "Description": "RDS database endpoint address",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Address"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-RDSEndpoint"
        }
      }
    },
    "RDSPort": {
      "Description": "RDS database port",
      "Value": {
        "Fn::GetAtt": ["RDSInstance", "Endpoint.Port"]
      }
    },
    "ECSClusterName": {
      "Description": "ECS Cluster Name",
      "Value": {
        "Ref": "ECSCluster"
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ECSClusterName"
        }
      }
    },
    "ECSServiceName": {
      "Description": "ECS Service Name",
      "Value": {
        "Fn::GetAtt": ["ECSService", "Name"]
      },
      "Export": {
        "Name": {
          "Fn::Sub": "${AWS::StackName}-ECSServiceName"
        }
      }
    },
    "DBSecretArn": {
      "Description": "ARN of the Secrets Manager secret containing database credentials",
      "Value": {
        "Ref": "DBSecret"
      }
    },
    "SNSTopicArn": {
      "Description": "ARN of the SNS topic for CloudWatch alarms",
      "Value": {
        "Ref": "SNSTopic"
      }
    }
  }
}
```

## Key Features

### Security

The template implements defense-in-depth security architecture across network, identity, data, and application layers following AWS Well-Architected Framework security pillar. Network security enforces VPC isolation with private subnets for ECS containers and RDS database preventing direct internet access, public subnets for ALB and Bastion Host with controlled ingress, NAT Gateway providing outbound-only internet access for private resources, and security groups implementing least privilege with ALB allowing HTTP/HTTPS from anywhere, ECS allowing traffic only from ALB on container port, database allowing MySQL only from ECS and Bastion, and Bastion allowing SSH from anywhere with recommendation to restrict to specific IPs. Identity security implements IAM roles with least privilege including AdminRole with full access for administrators, DeveloperRole with scoped ECS, S3, CloudWatch, and RDS permissions, ReadOnlyRole for audit personnel, ECS task execution role with container orchestration permissions, ECS task role with specific S3 and Secrets Manager permissions, and RDS monitoring role for enhanced monitoring. All IAM roles use AWS::AccountId in trust policies preventing cross-account assumption and include comprehensive tags for governance. Data security enforces encryption at rest with customer-managed KMS keys for S3 and RDS providing enhanced control and audit, Secrets Manager for database credentials with automatic generation and CloudFormation dynamic references, S3 versioning for data protection against accidental deletions, and RDS automated backups with 7-day retention. Encryption in transit uses CloudFront ViewerProtocolPolicy redirect-to-https enforcing HTTPS for all content delivery, ALB support for HTTPS listener with ACM certificate (configurable), and VPC endpoints for AWS services ensuring traffic remains on AWS private network (can be added). Application security implements CloudFront Origin Access Identity preventing direct S3 public access, S3 PublicAccessBlockConfiguration blocking all public access, RDS in private subnet with PubliclyAccessible false, ECS containers in private subnets with AssignPublicIp DISABLED, and Bastion Host as controlled entry point for administrative access. Secrets management eliminates hardcoded credentials through Secrets Manager with automatic password generation, CloudFormation dynamic references for RDS credentials, ECS task role scoped Secrets Manager permissions, and SSM Parameter Store for latest AMI selection. This comprehensive security architecture protects against unauthorized access through network isolation and IAM policies, data breaches through encryption at rest and in transit, credential exposure through Secrets Manager, accidental data loss through backups and versioning, and implements compliance controls for PCI DSS, HIPAA, and SOC 2.

### Scalability

The containerized architecture provides horizontal and vertical scalability supporting traffic growth from development to enterprise production workloads. Container scalability leverages ECS Fargate with automatic horizontal scaling from minimum 2 to maximum 10 tasks based on CPU utilization, target tracking scaling policy maintaining 70% CPU automatically adding tasks during high load, scale-out cooldown of 300 seconds preventing rapid scaling thrashing, Application Load Balancer automatically distributing traffic across all healthy tasks, and configurable CPU and memory allocation (currently 256 CPU units and 512 MB memory) enabling vertical scaling for performance tuning. Database scalability uses RDS with vertical scaling through instance class changes from db.t3.micro to db.m5 or db.r5 families without downtime during maintenance window, storage auto-scaling from 20 GB to 65,536 GB with automatic expansion when reaching threshold, read replicas for read scalability creating up to 5 read replicas distributing query load, and Multi-AZ providing failover capability during scaling operations. Storage scalability includes S3 with unlimited capacity automatically scaling to any storage size and request rate, CloudFront with global edge locations automatically serving increased traffic through edge caching, and versioning enabling historical object retention without capacity planning. Network scalability implements VPC with 10.0.0.0/16 CIDR providing 65,536 IP addresses supporting extensive resource growth, Application Load Balancer automatically scaling to handle traffic spikes, and NAT Gateway supporting 45 Gbps bandwidth automatically scaling. The infrastructure supports elasticity with auto-scaling automatically reducing task count during low traffic optimizing costs, scheduled scaling for predictable patterns like daily peaks (configurable), and step scaling for rapid response to large traffic changes (can be added). Global scalability can be achieved through multi-region deployment using Route 53 for DNS failover and latency-based routing, S3 cross-region replication for disaster recovery, CloudFront global edge locations already implemented, and RDS read replicas in different regions for global read access. This comprehensive scalability architecture ensures the application scales from zero to thousands of concurrent users without capacity planning, infrastructure changes, or performance degradation.

### Operational Excellence

The template achieves operational excellence through Infrastructure as Code, comprehensive parameterization, monitoring and logging, and automated operations following AWS Well-Architected Framework operational excellence pillar. Infrastructure as Code uses CloudFormation for version-controlled infrastructure management enabling GitOps workflows, change tracking in version control systems, peer review through pull requests, automated testing through cfn-lint and TaskCat, and consistent deployments across environments. Parameterization enables environment-specific configuration with 15 parameters including EnvironmentName with AllowedValues for environment selection, VPC and subnet CIDRs with AllowedPattern validation, instance types with AllowedValues constraints, database configuration with MinLength and MaxLength validation, container configuration with MinValue and MaxValue ranges, and AlertEmail with AllowedPattern for email validation. CloudFormation metadata organizes parameters into logical groups with Environment Configuration, Network Configuration, EC2 Configuration, ECS Configuration, Database Configuration, and Monitoring Configuration improving Console user experience. Monitoring and logging provides operational visibility through CloudWatch Logs for ECS containers with 7-day retention, RDS CloudWatch Logs for error, general, and slowquery logs, Container Insights for enhanced container metrics, and CloudWatch alarms for ECS and RDS CPU utilization with SNS notifications. Automated operations include ECS automatic task replacement on failure, RDS automated backups with 7-day retention, RDS automated maintenance during preferred window, auto-scaling automatic task adjustment based on CPU, and Application Load Balancer automatic traffic distribution. Operational readiness includes comprehensive tagging for resource organization and cost tracking, outputs for 16 values including VPC ID, subnet IDs, ALB DNS, CloudFront URL, RDS endpoint, and SNS topic ARN, exports enabling cross-stack references for dependent stacks, and DeletionPolicy on RDS set to Delete for development environments (should be Snapshot for production). For production deployments, organizations should implement AWS Config for continuous compliance monitoring, AWS Systems Manager for operational insights and automated remediation, CloudWatch Dashboards for centralized monitoring, AWS CloudTrail for API audit trails, and AWS Backup for centralized backup management.

### Cost Optimization

The serverless architecture provides significant cost optimization through right-sized resources, auto-scaling, efficient caching, and AWS-managed services following AWS Well-Architected Framework cost optimization pillar. Compute optimization uses ECS Fargate with pay-per-use pricing based on actual vCPU-seconds and GB-seconds eliminating idle instance costs, right-sized containers with 256 CPU (0.25 vCPU) and 512 MB memory providing sufficient capacity for nginx while minimizing costs, auto-scaling from minimum 2 to maximum 10 tasks scaling based on demand rather than peak capacity, target value 70% maintaining resource utilization for efficiency, FARGATE_SPOT capacity provider option enabling up to 70% cost savings for fault-tolerant workloads, and automatic task termination during low traffic eliminating costs when tasks are unnecessary. Database optimization includes db.t3.micro instance type with burstable performance providing cost-effective capacity for development, 20 GB gp3 storage with baseline performance appropriate for small workloads, 7-day backup retention balancing compliance with storage costs, and Multi-AZ providing high availability without read replica costs for read scaling. Storage optimization implements S3 Intelligent-Tiering through versioning enabling automatic tier transitions (configurable), CloudFront caching with aggressive TTL policies (1-7 days for images and scripts) reducing S3 GET requests by up to 95%, compression enabled reducing bandwidth costs by up to 85%, and PriceClass_100 restricting edge locations to North America and Europe reducing distribution costs by up to 33%. Network optimization uses single NAT Gateway instead of one per AZ saving $32.40/month per eliminated NAT Gateway, private subnets for ECS and RDS eliminating public IP costs of $3.65/month per IP, and VPC endpoints for AWS services reducing data transfer costs (can be added). Monitoring optimization includes CloudWatch Logs 7-day retention limiting storage costs to recent troubleshooting data, standard monitoring for most resources with 5-minute metrics, detailed monitoring only for Bastion Host providing 1-minute metrics where needed, and alarm periods of 300 seconds reducing evaluation costs. Parameter-driven optimization enables environment-specific sizing with Production using db.t3.medium and 100 GB storage while Development uses db.t3.micro and 20 GB storage reducing development costs by up to 75%, AllowedValues constraints preventing accidental deployment of expensive r5 or m5 instance families, and comprehensive tagging enabling AWS Cost Explorer detailed cost allocation reports showing spend by environment, project, and resource type. Cost visibility is provided through tagging enabling showback and chargeback, CloudWatch metrics for resource utilization supporting rightsizing decisions, and AWS Cost Explorer reports identifying optimization opportunities.

### Reliability

The infrastructure achieves high reliability through multi-AZ deployment, automatic failover, health checks, automated backups, and AWS-managed services following AWS Well-Architected Framework reliability pillar. Application reliability is provided through ECS Fargate with containers distributed across two Availability Zones tolerating single AZ failure, automatic task replacement when containers fail with health check detection, minimum 2 tasks ensuring at least one task always available, Application Load Balancer with cross-AZ load balancing distributing traffic evenly, target group health checks with 30-second intervals and 5-second timeouts detecting failures rapidly, health check grace period of 60 seconds allowing containers to initialize, and auto-scaling maintaining desired task count during failures. Database reliability leverages RDS Multi-AZ with synchronous replication to standby instance in different Availability Zone, automatic failover typically completing within 60-120 seconds with zero data loss, automated backups with 7-day retention enabling point-in-time recovery to any second within window, backup window during low traffic period (03:00-04:00) minimizing performance impact, transaction log backups every 5 minutes providing granular recovery points, and enhanced monitoring with 60-second metrics detecting issues proactively. Storage reliability includes S3 with 99.999999999% durability across multiple facilities automatically replicating data, versioning protecting against accidental deletions with point-in-time recovery, KMS encryption with automatic key replication within region, and CloudFront caching providing continued content delivery during S3 issues. Network reliability implements VPC spanning two Availability Zones with independent failure domains, Application Load Balancer with built-in redundancy across AZs, NAT Gateway with Elastic IP providing consistent outbound connectivity (single NAT acceptable with Fargate automatic recovery), and security groups providing defense in depth. Failure detection includes CloudWatch alarms on ECS CPU utilization detecting performance degradation with 2 evaluation periods and 300-second periods, RDS CPU utilization alarms detecting database performance issues, SNS email notifications ensuring immediate operations team alerts, and TreatMissingData notBreaching preventing false alarms. Recovery capabilities include ECS automatic task restart on failure with exponential backoff, RDS automated failover to standby instance with DNS update, Application Load Balancer automatic traffic rerouting away from unhealthy targets, and automated backups enabling recovery from data corruption or accidental deletion. This comprehensive reliability architecture ensures the application tolerates component failures through automatic recovery, maintains availability during AZ failures through multi-AZ deployment, detects issues proactively through comprehensive monitoring, and recovers from failures through automated mechanisms and backup restoration.
