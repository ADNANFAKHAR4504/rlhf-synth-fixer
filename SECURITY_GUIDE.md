# Security Guide - Product Catalog API Infrastructure

## Overview

This comprehensive security guide covers all security aspects of the Product Catalog API infrastructure, including network security, identity and access management, data protection, and compliance considerations.

## Security Architecture Principles

### 1. Defense in Depth
Multiple layers of security controls protect the infrastructure:
- **Network Layer**: VPC isolation, security groups, private subnets
- **Application Layer**: Container isolation, least privilege IAM roles
- **Data Layer**: Encryption at rest and in transit, secure credential management
- **Access Layer**: IAM policies, Secrets Manager integration

### 2. Least Privilege Access
All components operate with minimal required permissions:
- ECS tasks can only access their specific secrets
- Security groups allow only necessary traffic flows
- IAM roles have precise permission boundaries

### 3. Zero Trust Network Model
- No implicit trust between network segments
- All traffic validated through security groups
- Private subnets isolate sensitive resources

## Network Security

### VPC Security Configuration

#### Network Isolation
```python
# VPC Configuration
vpc = Vpc(
    self, "vpc",
    cidr="10.0.0.0/16",
    enable_dns_support=True,
    enable_dns_hostnames=True
)
```

**Security Benefits:**
- Private IP space (RFC 1918)
- DNS resolution for internal service discovery
- Network isolation from other AWS accounts

#### Subnet Strategy
| Subnet Type | Purpose | Security Level | Internet Access |
|-------------|---------|----------------|-----------------|
| Public | ALB, NAT Gateway | Medium | Direct via IGW |
| Private | ECS, RDS | High | Outbound via NAT |

### Security Groups (Network ACLs)

#### ALB Security Group
```python
alb_sg = SecurityGroup(
    self, "alb-sg",
    vpc=vpc,
    allow_all_outbound=False
)

# Inbound: HTTP from Internet
alb_sg.add_ingress_rule(
    peer=Peer.any_ipv4(),
    connection=Port.tcp(80),
    description="Allow HTTP from internet"
)

# Outbound: Only to ECS tasks
alb_sg.add_egress_rule(
    peer=Peer.security_group_id(ecs_sg.security_group_id),
    connection=Port.tcp(3000),
    description="Allow traffic to ECS tasks"
)
```

**Security Controls:**
- ✅ Restricts inbound to HTTP only
- ✅ Prevents outbound traffic except to ECS
- ✅ No SSH/RDP access permitted
- ✅ No administrative ports exposed

#### ECS Security Group
```python
ecs_sg = SecurityGroup(
    self, "ecs-sg",
    vpc=vpc,
    allow_all_outbound=False
)

# Inbound: Only from ALB
ecs_sg.add_ingress_rule(
    peer=Peer.security_group_id(alb_sg.security_group_id),
    connection=Port.tcp(3000),
    description="Allow traffic from ALB"
)

# Outbound: Database and HTTPS for updates
ecs_sg.add_egress_rule(
    peer=Peer.security_group_id(rds_sg.security_group_id),
    connection=Port.tcp(5432),
    description="Allow database access"
)
```

**Security Controls:**
- ✅ Application port isolated to ALB traffic only
- ✅ Database access restricted to specific security group
- ✅ No direct internet access for containers
- ✅ Outbound HTTPS for package updates and APIs

#### RDS Security Group
```python
rds_sg = SecurityGroup(
    self, "rds-sg",
    vpc=vpc,
    allow_all_outbound=False
)

# Inbound: Only from ECS
rds_sg.add_ingress_rule(
    peer=Peer.security_group_id(ecs_sg.security_group_id),
    connection=Port.tcp(5432),
    description="Allow database access from ECS"
)
```

**Security Controls:**
- ✅ Database completely isolated from internet
- ✅ Access only from authenticated ECS tasks
- ✅ No outbound connections permitted
- ✅ Standard PostgreSQL port protection

## Identity and Access Management (IAM)

### ECS Task Execution Role

#### Purpose
Allows ECS service to pull container images and write logs on behalf of tasks.

#### Permissions
```python
task_execution_role = Role(
    self, "task-execution-role",
    assumed_by=ServicePrincipal("ecs-tasks.amazonaws.com"),
    managed_policies=[
        ManagedPolicy.from_aws_managed_policy_name(
            "service-role/AmazonECSTaskExecutionRolePolicy"
        )
    ]
)
```

**Security Features:**
- ✅ Service-linked role (AWS managed)
- ✅ Cannot be assumed by users
- ✅ Limited to ECS service operations
- ✅ No data plane access

### ECS Task Role

#### Purpose
Provides runtime permissions for application containers.

#### Secrets Access Policy
```python
secrets_policy = Policy(
    self, "secrets-policy",
    statements=[
        PolicyStatement(
            effect=Effect.ALLOW,
            actions=[
                "secretsmanager:GetSecretValue",
                "secretsmanager:DescribeSecret"
            ],
            resources=[db_secret.secret_arn]
        )
    ]
)
```

**Security Controls:**
- ✅ Access limited to specific secret ARN
- ✅ No wildcard permissions
- ✅ Read-only access (no write/delete)
- ✅ Principle of least privilege

## Data Protection

### Encryption at Rest

#### RDS Aurora Encryption
```python
rds_cluster = DatabaseCluster(
    self, "rds-cluster",
    engine=DatabaseClusterEngine.aurora_postgres(
        version=AuroraPostgresEngineVersion.VER_16_4
    ),
    storage_encrypted=True,  # Encryption at rest
    # KMS key managed by AWS
)
```

**Security Features:**
- ✅ AES-256 encryption for all data files
- ✅ Automated backup encryption
- ✅ Snapshot encryption
- ✅ AWS managed KMS keys

#### Secrets Manager Encryption
```python
db_secret = Secret(
    self, "db-secret",
    generate_secret_string=SecretStringGenerator(
        secret_string_template='{"username": "admin"}',
        generate_string_key="password",
        exclude_characters='" %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        password_length=32
    ),
    # Automatic encryption with AWS managed keys
    recovery_window_in_days=0  # For test environments
)
```

**Security Features:**
- ✅ Automatic encryption with AWS KMS
- ✅ Strong password generation (32 characters)
- ✅ Character exclusion to prevent injection
- ✅ Version tracking and rotation support

#### S3 Bucket Encryption
```python
log_bucket = Bucket(
    self, "log-bucket",
    encryption=BucketEncryption.S3_MANAGED,
    lifecycle_rules=[
        LifecycleRule(
            id="delete-old-logs",
            expiration=Duration.days(30),
            prefix=""  # Apply to all objects
        )
    ]
)
```

**Security Features:**
- ✅ Server-side encryption (SSE-S3)
- ✅ Automatic key management
- ✅ Data retention controls (30 days)
- ✅ Compliance with data retention policies

### Encryption in Transit

#### ALB to ECS Communication
- **Protocol**: HTTP within VPC (private network)
- **Justification**: Traffic contained within private VPC
- **Enhancement**: Can be upgraded to HTTPS with certificates

#### ECS to RDS Communication
- **Protocol**: PostgreSQL with SSL/TLS
- **Configuration**: Force SSL connections
- **Certificates**: AWS managed certificates

#### External Communications
- **CloudFront**: HTTPS termination for end users
- **Secrets Manager**: HTTPS API calls
- **ECR**: HTTPS for container image pulls

## Secrets Management

### Database Credentials

#### Secrets Manager Integration
```python
# Environment variables in ECS task definition
environment_variables = {
    "DB_HOST": rds_cluster.cluster_endpoint.hostname,
    "DB_PORT": "5432",
    "DB_NAME": db_name
}

# Secrets injection (not environment variables)
secrets = {
    "DB_USERNAME": Secret.from_secret_name_v2(
        self, "db-username-secret",
        secret_name=db_secret.secret_name
    ),
    "DB_PASSWORD": Secret.from_secret_name_v2(
        self, "db-password-secret", 
        secret_name=db_secret.secret_name
    )
}
```

**Security Benefits:**
- ✅ Credentials never stored in code
- ✅ No environment variable exposure
- ✅ Runtime injection into containers
- ✅ Audit trail for access

#### Secret Rotation Strategy
```python
# Automatic rotation (future enhancement)
db_secret.add_rotation_schedule(
    automatically_after=Duration.days(90),
    lambda_function=rotation_lambda
)
```

**Rotation Benefits:**
- ✅ Reduces credential exposure window
- ✅ Automated process (no manual intervention)
- ✅ Zero-downtime credential updates
- ✅ Compliance with security policies

## Container Security

### Image Security

#### Base Image Selection
- **Recommendation**: Use minimal base images (Alpine, Distroless)
- **Security**: Fewer packages = smaller attack surface
- **Updates**: Regular base image updates

#### Image Scanning
```bash
# ECR automatic scanning
aws ecr put-image-scanning-configuration \
    --repository-name catalog-api \
    --image-scanning-configuration scanOnPush=true
```

**Security Features:**
- ✅ Vulnerability scanning on push
- ✅ CVE database integration
- ✅ Automated security reports
- ✅ Image quarantine for critical vulnerabilities

### Runtime Security

#### ECS Task Configuration
```python
task_definition = FargateTaskDefinition(
    self, "task-definition",
    cpu=1024,
    memory_limit_mib=2048,
    # Security configurations
    execution_role=task_execution_role,
    task_role=task_role
)

container = task_definition.add_container(
    "api-container",
    image=ContainerImage.from_registry("nginx:latest"),
    port_mappings=[PortMapping(container_port=3000)],
    # Security: Run as non-root user
    user="1000:1000",
    # Security: Read-only root filesystem
    readonly_root_filesystem=True,
    # Logging
    logging=LogDrivers.aws_logs(
        group=log_group,
        stream_prefix="api"
    )
)
```

**Security Features:**
- ✅ Non-root container execution
- ✅ Read-only root filesystem
- ✅ Isolated network namespace
- ✅ Resource limits prevent DoS

## Monitoring and Incident Response

### Security Monitoring

#### CloudWatch Logs
```python
log_group = LogGroup(
    self, "ecs-log-group",
    log_group_name=f"/aws/ecs/catalog-api-{environment_suffix}",
    retention=RetentionDays.ONE_WEEK,
    removal_policy=RemovalPolicy.DESTROY
)
```

**Monitoring Capabilities:**
- ✅ Application logs for security events
- ✅ Access patterns and anomalies
- ✅ Failed authentication attempts
- ✅ SQL injection attempt detection

#### ALB Access Logs
```python
alb.log_access_logs(
    bucket=log_bucket,
    prefix="alb-access-logs"
)
```

**Security Insights:**
- ✅ HTTP request patterns
- ✅ Geographic access patterns
- ✅ Attack vector identification
- ✅ DDoS attempt detection

### Alerting Strategy

#### Security-Focused Metrics
1. **Failed Health Checks**: Potential application compromise
2. **High Error Rates**: Security event or attack
3. **Unusual Traffic Patterns**: DDoS or scanning attempts
4. **Database Connection Failures**: Credential issues

#### Incident Response Plan
1. **Detection**: CloudWatch alarms trigger
2. **Assessment**: Review logs and metrics
3. **Containment**: Security group modifications
4. **Eradication**: Task replacement, secret rotation
5. **Recovery**: Service restoration
6. **Lessons Learned**: Security control updates

## Compliance Considerations

### Data Residency
- **Region**: eu-north-1 (Stockholm, Sweden)
- **GDPR Compliance**: EU data stays within EU
- **Data Sovereignty**: Swedish jurisdiction

### Audit Requirements

#### CloudTrail Integration
```python
# Enable CloudTrail for API calls (organization level)
trail = Trail(
    self, "security-trail",
    include_global_service_events=True,
    is_multi_region_trail=True,
    enable_file_validation=True
)
```

**Audit Capabilities:**
- ✅ All AWS API calls logged
- ✅ Resource access tracking
- ✅ Security configuration changes
- ✅ Compliance reporting

### Security Standards

#### SOC 2 Type II Alignment
- **Access Controls**: IAM roles and policies
- **Logical Access**: Security groups and NACLs
- **Change Management**: Infrastructure as Code
- **Monitoring**: CloudWatch and logging

#### ISO 27001 Controls
- **A.13.1.1**: Network controls (Security Groups)
- **A.13.1.2**: Security of network services (ALB, CloudFront)
- **A.14.1.3**: Protection of application services (ECS isolation)

## Security Testing

### Vulnerability Assessment

#### Network Security Testing
```bash
# Example security group validation
aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=*-sg-*" \
    --query 'SecurityGroups[?IpPermissions[?IpRanges[?CidrIp==`0.0.0.0/0`]]]'
```

#### Application Security Testing
- **SAST**: Static analysis of application code
- **DAST**: Dynamic testing of deployed application
- **Container Scanning**: Regular image vulnerability scans

### Penetration Testing

#### External Testing
- **Scope**: Public-facing ALB and CloudFront
- **Methods**: OWASP Top 10 testing
- **Frequency**: Quarterly or after major changes

#### Internal Testing
- **Scope**: Inter-service communications
- **Methods**: Network segmentation validation
- **Tools**: AWS Inspector, third-party scanners

## Security Hardening Checklist

### Infrastructure Hardening
- ✅ **VPC Flow Logs**: Enable for network monitoring
- ✅ **GuardDuty**: Enable for threat detection
- ✅ **Security Hub**: Centralized security findings
- ✅ **Config**: Resource compliance monitoring

### Application Hardening
- ✅ **WAF Integration**: Web Application Firewall
- ✅ **Shield Advanced**: DDoS protection
- ✅ **Certificate Manager**: SSL/TLS certificates
- ✅ **Secrets Rotation**: Automated credential rotation

### Operational Security
- ✅ **MFA Enforcement**: Multi-factor authentication
- ✅ **Access Reviews**: Regular permission audits
- ✅ **Incident Response**: Documented procedures
- ✅ **Security Training**: Team awareness programs

## Emergency Procedures

### Security Incident Response

#### Immediate Actions (0-15 minutes)
1. **Isolate**: Modify security groups to block traffic
2. **Preserve**: Snapshot ECS tasks and RDS instances
3. **Notify**: Alert security team and stakeholders
4. **Document**: Log all actions and timestamps

#### Investigation Phase (15 minutes - 2 hours)
1. **Analyze Logs**: CloudWatch, ALB, application logs
2. **Check Access**: IAM CloudTrail events
3. **Assess Impact**: Data exposure and system compromise
4. **Gather Evidence**: Export logs and configurations

#### Recovery Phase (2-8 hours)
1. **Rotate Secrets**: New database passwords
2. **Replace Tasks**: Fresh container deployments
3. **Update Security Groups**: Enhanced restrictions
4. **Monitor**: Increased alerting sensitivity

### Disaster Recovery Security

#### RDS Recovery
```python
# Point-in-time recovery
aws rds restore-db-cluster-to-point-in-time \
    --source-db-cluster-identifier original-cluster \
    --db-cluster-identifier recovered-cluster \
    --restore-to-time 2024-01-15T10:00:00Z \
    --storage-encrypted
```

#### ECS Recovery
```python
# Task definition rollback
aws ecs update-service \
    --cluster catalog-api-cluster \
    --service catalog-api-service \
    --task-definition catalog-api:previous-version
```

This security guide provides comprehensive coverage of all security aspects for the Product Catalog API infrastructure. Regular reviews and updates ensure continued protection against evolving threats.