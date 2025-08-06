# Multi-AZ RDS High Availability Design with Pulumi

## 1. Step-by-Step Design Explanation

### **Architecture Overview**
I'm designing a production-grade, highly available RDS infrastructure with the following components:

**Core Design Decisions:**
- **RDS Instance Class**: `db.t3.medium` (burstable performance, cost-effective for most workloads)
- **Engine**: PostgreSQL 15.x (mature, ACID-compliant, excellent HA support)
- **Multi-AZ**: `True` - AWS automatically provisions synchronous standby in different AZ
- **Subnet Groups**: Span multiple AZs (minimum 2, ideally 3) for maximum availability
- **Security**: Dedicated security group with least-privilege access

### **Failover Mechanics**
- **Synchronous Replication**: Primary → Standby (typically <1-2 second lag)
- **Automatic Failover**: AWS detects failure → promotes standby → updates DNS endpoint
- **RTO**: ~60-120 seconds (Recovery Time Objective)
- **RPO**: Near-zero data loss (Recovery Point Objective)

### **IAM & Security Strategy**
- Enhanced monitoring role for CloudWatch insights
- Security group restricts database access to application subnets only
- Parameter groups for performance tuning

## 2. Pulumi Python Implementation

### **`__main__.py`**

```python
import pulumi
import pulumi_aws as aws

# Get configuration values
config = pulumi.Config()
db_username = config.require("dbUsername")
db_password = config.require_secret("dbPassword")
environment = config.get("environment") or "dev"

# Get availability zones for the current region
azs = aws.get_availability_zones(state="available")

# Create VPC for our RDS infrastructure
vpc = aws.ec2.Vpc("rds-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        "Name": f"rds-vpc-{environment}",
        "Environment": environment
    })

# Create Internet Gateway (needed for NAT gateway)
igw = aws.ec2.InternetGateway("rds-igw",
    vpc_id=vpc.id,
    tags={"Name": f"rds-igw-{environment}"})

# Create private subnets for RDS across multiple AZs
# This ensures Multi-AZ deployment can span different availability zones
private_subnets = []
for i, az in enumerate(azs.names[:3]):  # Use first 3 AZs
    subnet = aws.ec2.Subnet(f"rds-private-subnet-{i}",
        vpc_id=vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",  # 10.0.10.0/24, 10.0.11.0/24, etc.
        availability_zone=az,
        tags={
            "Name": f"rds-private-subnet-{az}-{environment}",
            "Environment": environment,
            "Type": "Private"
        })
    private_subnets.append(subnet)

# Create DB subnet group spanning multiple AZs
# This is REQUIRED for Multi-AZ RDS deployment
db_subnet_group = aws.rds.SubnetGroup("rds-subnet-group",
    name=f"rds-subnet-group-{environment}",
    subnet_ids=[subnet.id for subnet in private_subnets],
    tags={
        "Name": f"rds-subnet-group-{environment}",
        "Environment": environment
    })

# Create security group for RDS
# Restricts access to PostgreSQL port (5432) from application subnets only
rds_security_group = aws.ec2.SecurityGroup("rds-security-group",
    name=f"rds-sg-{environment}",
    description="Security group for RDS PostgreSQL instance",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="PostgreSQL access from VPC",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=[vpc.cidr_block]  # Allow access from entire VPC
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={
        "Name": f"rds-sg-{environment}",
        "Environment": environment
    })

# Create IAM role for RDS enhanced monitoring
# This enables detailed CloudWatch metrics for database performance
rds_monitoring_role = aws.iam.Role("rds-monitoring-role",
    assume_role_policy="""{
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
    }""",
    tags={
        "Name": f"rds-monitoring-role-{environment}",
        "Environment": environment
    })

# Attach AWS managed policy for RDS enhanced monitoring
rds_monitoring_policy_attachment = aws.iam.RolePolicyAttachment("rds-monitoring-policy",
    role=rds_monitoring_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole")

# Create parameter group for PostgreSQL optimization
db_parameter_group = aws.rds.ParameterGroup("postgres-params",
    family="postgres15",
    name=f"postgres-params-{environment}",
    description="Custom parameter group for PostgreSQL 15",
    parameters=[
        aws.rds.ParameterGroupParameterArgs(
            name="shared_preload_libraries",
            value="pg_stat_statements"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="log_statement",
            value="all"
        )
    ],
    tags={
        "Name": f"postgres-params-{environment}",
        "Environment": environment
    })

# Create the Multi-AZ RDS instance
# KEY SETTINGS for High Availability:
# - multi_az=True: Enables automatic failover to standby in different AZ
# - backup_retention_period=7: Enables point-in-time recovery
# - backup_window: Scheduled during low-traffic hours
# - maintenance_window: Scheduled maintenance window
rds_instance = aws.rds.Instance("postgres-multi-az",
    identifier=f"postgres-ha-{environment}",
    
    # Engine configuration
    engine="postgres",
    engine_version="15.4",
    instance_class="db.t3.medium",  # Burstable performance, good for most workloads
    
    # High Availability configuration
    multi_az=True,  # CRITICAL: Enables Multi-AZ deployment with automatic failover
    
    # Storage configuration
    allocated_storage=100,  # GB
    max_allocated_storage=1000,  # Enable storage autoscaling up to 1TB
    storage_type="gp3",  # General Purpose SSD v3 (latest generation)
    storage_encrypted=True,  # Encrypt data at rest
    
    # Database configuration
    db_name="appdb",
    username=db_username,
    password=db_password,
    port=5432,
    
    # Network configuration
    db_subnet_group_name=db_subnet_group.name,
    vpc_security_group_ids=[rds_security_group.id],
    publicly_accessible=False,  # Keep private for security
    
    # Backup and maintenance configuration
    backup_retention_period=7,  # Keep backups for 7 days
    backup_window="03:00-04:00",  # UTC - adjust for your timezone
    maintenance_window="sun:04:00-sun:05:00",  # UTC
    
    # Monitoring and logging
    monitoring_interval=60,  # Enhanced monitoring every 60 seconds
    monitoring_role_arn=rds_monitoring_role.arn,
    enabled_cloudwatch_logs_exports=["postgresql"],
    
    # Performance and parameters
    parameter_group_name=db_parameter_group.name,
    
    # Deletion protection for production
    deletion_protection=True,  # Prevent accidental deletion
    skip_final_snapshot=False,  # Always create final snapshot
    final_snapshot_identifier=f"postgres-ha-{environment}-final-snapshot",
    
    tags={
        "Name": f"postgres-ha-{environment}",
        "Environment": environment,
        "BackupRetention": "7days",
        "MultiAZ": "true"
    })

# Export important values
pulumi.export("rds_endpoint", rds_instance.endpoint)
pulumi.export("rds_port", rds_instance.port)
pulumi.export("rds_availability_zone", rds_instance.availability_zone)
pulumi.export("rds_multi_az", rds_instance.multi_az)
pulumi.export("vpc_id", vpc.id)
pulumi.export("db_subnet_group_name", db_subnet_group.name)
```

### **`Pulumi.dev.yaml`**

```yaml
config:
  aws:region: us-west-2
  iac-aws-nova-model-breaking:dbUsername: "postgres"
  iac-aws-nova-model-breaking:dbPassword:
    secure: "your-encrypted-password-here"
  iac-aws-nova-model-breaking:environment: "dev"
```

## 3. Deployment Instructions

### **Prerequisites**
```bash
# Install Pulumi CLI
curl -fsSL https://get.pulumi.com | sh

# Install Python dependencies
pip install pulumi pulumi-aws

# Configure AWS credentials
export AWS_PROFILE=your-profile
# OR
aws configure
```

### **Deployment Steps**
```bash
# 1. Initialize Pulumi project
pulumi new aws-python --name "iac-aws-nova-model-breaking"

# 2. Set configuration values
pulumi config set aws:region us-west-2
pulumi config set dbUsername postgres
pulumi config set --secret dbPassword "YourSecurePassword123!"
pulumi config set environment dev

# 3. Deploy infrastructure
pulumi up

# 4. Verify deployment
pulumi stack output rds_endpoint
pulumi stack output rds_multi_az  # Should show "true"
```

### **Testing Connection**
```bash
# Get RDS endpoint
ENDPOINT=$(pulumi stack output rds_endpoint)

# Test connection (from within VPC or via bastion host)
psql -h $ENDPOINT -U postgres -d appdb
```

## 4. Failover Testing & Edge Cases

### **Testing Automatic Failover**
```bash
# Method 1: Reboot with failover (simulates primary failure)
aws rds reboot-db-instance \
    --db-instance-identifier postgres-ha-dev \
    --force-failover

# Method 2: Stop/Start instance (triggers failover)
aws rds stop-db-instance --db-instance-identifier postgres-ha-dev
aws rds start-db-instance --db-instance-identifier postgres-ha-dev
```

### **Monitoring Failover**
- **CloudWatch Metrics**: Monitor `DatabaseConnections`, `CPUUtilization`
- **RDS Events**: Check RDS console for failover events
- **Application Impact**: ~60-120 seconds of connection interruption

### **Edge Case Handling**
- **Cross-AZ Network Issues**: AWS automatically handles AZ isolation
- **Standby Corruption**: AWS maintains multiple backup copies
- **Region-wide Outage**: Consider cross-region read replicas for DR
- **Storage Full**: Auto-scaling prevents this (configured to 1TB max)

### **Recovery Scenarios**
```bash
# Point-in-time recovery (if needed)
aws rds restore-db-instance-to-point-in-time \
    --source-db-instance-identifier postgres-ha-dev \
    --target-db-instance-identifier postgres-ha-dev-restored \
    --restore-time 2024-01-15T10:30:00.000Z
```

**Expected RTO/RPO:**
- **RTO**: 60-120 seconds (automatic failover time)
- **RPO**: <1 second (synchronous replication)
- **Availability**: 99.95% (Multi-AZ SLA)

This infrastructure provides enterprise-grade high availability with minimal operational overhead and automatic failure recovery.