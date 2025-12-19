# Zero-Downtime Cross-Region Migration of Payment Processing Infrastructure

## Objective
Implement a zero-downtime migration strategy for payment processing infrastructure from us-east-1 to eu-west-1 using CDKTF (Terraform CDK) with Python.

## Requirements

### 1. VPC Infrastructure in eu-west-1
- Create VPC matching us-east-1 topology
- 3 Availability Zones (eu-west-1a, eu-west-1b, eu-west-1c)
- 3 Public subnets (one per AZ)
- 3 Private subnets (one per AZ)
- Internet Gateway for public subnets
- NAT Gateways in each AZ for private subnet internet access
- Route tables with proper routing configuration

### 2. Aurora Global Database Cluster
- Create Aurora Global Database with MySQL 8.0
- Primary cluster in us-east-1 (assume exists)
- Secondary cluster in eu-west-1
- 2 Aurora instances in eu-west-1 (one writer, one reader)
- Enable automated backups
- Configure replication from primary to secondary

### 3. EC2 Auto Scaling Groups
- Launch Template with:
  - Amazon Linux 2 AMI
  - Instance type: t3.medium
  - User data to install and run containerized payment processor
  - IAM instance profile for ECR and CloudWatch access
- Auto Scaling Group:
  - Min: 2, Max: 6, Desired: 2
  - Span across all 3 AZs in private subnets
  - Health check type: ELB
  - Health check grace period: 300 seconds

### 4. Application Load Balancer
- Internet-facing ALB in public subnets
- Target Group with health checks:
  - Protocol: HTTPS
  - Port: 443
  - Health check path: /health
  - Healthy threshold: 2
  - Unhealthy threshold: 3
  - Interval: 30 seconds
  - Timeout: 5 seconds
- HTTPS listener on port 443 with SSL certificate

### 5. Route 53 Weighted Routing Policy
- Create hosted zone for domain
- Weighted routing records:
  - Record for us-east-1 ALB: weight 100 (100% traffic)
  - Record for eu-west-1 ALB: weight 0 (0% traffic initially)
- Both pointing to respective regional ALBs

### 6. CloudWatch Alarms
- Replication Lag Alarm:
  - Metric: Aurora replication lag
  - Threshold: > 1000ms
  - Period: 60 seconds
  - Evaluation periods: 2
- EC2 Health Alarm:
  - Metric: Target healthy host count
  - Threshold: < 2
  - Period: 60 seconds
  - Evaluation periods: 2

### 7. Step Functions State Machine
- Migration workflow orchestration:
  - Verify secondary database health
  - Gradually shift Route 53 weights (0% -> 25% -> 50% -> 75% -> 100%)
  - Monitor CloudWatch alarms at each step
  - Rollback capability if alarms trigger
  - Wait states between weight changes (5 minutes)

### 8. Migration Runbook as Terraform Output
- Output containing:
  - Step-by-step migration instructions
  - CLI commands to adjust Route 53 weights
  - Monitoring commands for CloudWatch alarms
  - Rollback procedures
  - Database failover commands

### 9. VPC Peering
- VPC Peering connection between us-east-1 and eu-west-1 VPCs
- Accepter configuration in eu-west-1
- Update route tables in both regions:
  - us-east-1 routes to eu-west-1 CIDR via peering connection
  - eu-west-1 routes to us-east-1 CIDR via peering connection

### 10. KMS Keys in eu-west-1
- Customer-managed KMS key for encryption at rest
- Key policy allowing:
  - Cross-region replication from us-east-1
  - Aurora cluster encryption
  - EBS volume encryption
  - Key rotation enabled

## Critical CDKTF API Requirements

### MUST USE Dictionary-Based Configuration (NOT Class-Based)

#### Security Groups
```python
# CORRECT (Dictionary)
ingress=[{
    "from_port": 443,
    "to_port": 443,
    "protocol": "tcp",
    "cidr_blocks": ["0.0.0.0/0"]
}]

# WRONG (Class-based - AWS CDK style)
# ingress=[ec2.SecurityGroupIngress(...)]
```

#### Route Tables
```python
# CORRECT (Inline routes in resource)
route=[{
    "cidr_block": "0.0.0.0/0",
    "gateway_id": igw.id
}]

# WRONG (Separate aws_route resource)
# aws_route(self, "route", ...)
```

#### Launch Template
```python
# CORRECT (Dictionary)
iam_instance_profile={
    "name": instance_profile.name
}

# WRONG (Class)
# iam_instance_profile=IamInstanceProfile(...)
```

#### Auto Scaling Group
```python
# CORRECT (Dictionary)
tag=[{
    "key": "Name",
    "value": f"payment-processor-{env_suffix}",
    "propagate_at_launch": True
}]

# WRONG (Class)
# tag=[Tag(key="Name", ...)]
```

#### Load Balancer Target Group
```python
# CORRECT (Dictionary)
health_check={
    "enabled": True,
    "path": "/health",
    "healthy_threshold": 2,
    "unhealthy_threshold": 3,
    "timeout": 5,
    "interval": 30,
    "protocol": "HTTPS"
}

# WRONG (Class)
# health_check=HealthCheck(...)
```

#### Load Balancer Listener
```python
# CORRECT (Dictionary)
default_action=[{
    "type": "forward",
    "target_group_arn": target_group.arn
}]

# WRONG (Class)
# default_action=[Action(...)]
```

#### Route 53 Records
```python
# CORRECT (Dictionary)
weighted_routing_policy={
    "weight": 100
}

alias={
    "name": alb.dns_name,
    "zone_id": alb.zone_id,
    "evaluate_target_health": True
}

# WRONG (Classes)
# weighted_routing_policy=WeightedRoutingPolicy(...)
# alias=Alias(...)
```

#### CloudWatch Alarms
```python
# CORRECT (Dictionary)
dimensions={
    "DBClusterIdentifier": cluster.id
}

# WRONG (Class)
# dimensions=Dimensions(...)
```

#### VPC Peering Connection Accepter
```python
# CORRECT
VpcPeeringConnectionAccepterA(
    self,
    "peering_accepter",
    vpc_peering_connection_id=peering.id
)

# WRONG
# VpcPeeringConnectionAccepter (without 'A' suffix)
```

## Resource Naming Convention
All resources must include environment_suffix in their names for uniqueness:
- Format: `{resource_type}-{purpose}-{env_suffix}`
- Example: `vpc-migration-abc123`, `alb-payment-abc123`

## Deployment Requirements
- All resources must be fully destroyable (no retention policies)
- Use environment_suffix from context (passed via --context env_suffix=xxx)
- Enable deletion protection: False (for testing purposes)
- Configure proper depends_on relationships
- Use count or for_each for multi-AZ resources

## Testing Requirements
- 100% test coverage (statements, functions, lines)
- Unit tests for all resource configurations
- Integration tests validating:
  - VPC connectivity
  - Aurora replication status
  - ALB health checks
  - Auto Scaling group functionality
  - Route 53 DNS resolution
  - CloudWatch alarm triggers
  - Step Functions execution
  - VPC peering connectivity
  - KMS key encryption

## Expected Outputs
1. VPC ID and CIDR block
2. Subnet IDs (public and private)
3. Aurora cluster endpoint and reader endpoint
4. ALB DNS name
5. Auto Scaling group name
6. Route 53 hosted zone ID
7. Step Functions state machine ARN
8. Migration runbook (formatted text)
9. VPC peering connection ID
10. KMS key ID and ARN