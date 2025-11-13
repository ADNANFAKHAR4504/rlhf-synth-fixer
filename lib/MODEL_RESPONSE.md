# Multi-Region Disaster Recovery Solution - Initial Implementation

This implementation provides a multi-region disaster recovery solution for PostgreSQL using Pulumi Python.

## File: __main__.py

```python
import pulumi
import pulumi_aws as aws

config = pulumi.Config()
environment_suffix = config.get("environmentSuffix") or "dev"

# Create KMS keys for encryption in primary region
primary_kms = aws.kms.Key(f"primary-kms-{environment_suffix}",
    description="KMS key for RDS encryption in us-east-1",
    enable_key_rotation=True
)

# Get existing VPC in us-east-1
primary_vpc = aws.ec2.get_vpc(
    filters=[aws.ec2.GetVpcFilterArgs(
        name="tag:Name",
        values=["default-vpc"]
    )]
)

# Get subnets for primary region
primary_subnets = aws.ec2.get_subnets(
    filters=[aws.ec2.GetSubnetFilterArgs(
        name="vpc-id",
        values=[primary_vpc.id]
    )]
)

# Create DB subnet group in primary region
primary_subnet_group = aws.rds.SubnetGroup(f"primary-subnet-group-{environment_suffix}",
    subnet_ids=primary_subnets.ids,
    tags={
        "Name": f"primary-subnet-group-{environment_suffix}"
    }
)

# Create security group for RDS
primary_sg = aws.ec2.SecurityGroup(f"primary-db-sg-{environment_suffix}",
    vpc_id=primary_vpc.id,
    ingress=[aws.ec2.SecurityGroupIngressArgs(
        from_port=5432,
        to_port=5432,
        protocol="tcp",
        cidr_blocks=["10.0.0.0/8"]
    )],
    egress=[aws.ec2.SecurityGroupEgressArgs(
        from_port=0,
        to_port=0,
        protocol="-1",
        cidr_blocks=["0.0.0.0/0"]
    )]
)

# Create parameter group
parameter_group = aws.rds.ParameterGroup(f"postgres-params-{environment_suffix}",
    family="postgres15",
    parameters=[
        aws.rds.ParameterGroupParameterArgs(
            name="max_connections",
            value="200"
        ),
        aws.rds.ParameterGroupParameterArgs(
            name="shared_buffers",
            value="256MB"
        )
    ]
)

# Create primary RDS instance
primary_db = aws.rds.Instance(f"primary-db-{environment_suffix}",
    identifier=f"trading-db-primary-{environment_suffix}",
    engine="postgres",
    engine_version="15.3",
    instance_class="db.t3.medium",
    allocated_storage=100,
    storage_encrypted=True,
    kms_key_id=primary_kms.arn,
    db_subnet_group_name=primary_subnet_group.name,
    vpc_security_group_ids=[primary_sg.id],
    parameter_group_name=parameter_group.name,
    backup_retention_period=7,
    multi_az=True,
    username="dbadmin",
    password="TempPassword123!",
    skip_final_snapshot=True
)

# Create KMS key for DR region
dr_provider = aws.Provider("dr-provider", region="us-west-2")

dr_kms = aws.kms.Key(f"dr-kms-{environment_suffix}",
    description="KMS key for RDS encryption in us-west-2",
    enable_key_rotation=True,
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Get VPC in DR region
dr_vpc = aws.ec2.get_vpc(
    filters=[aws.ec2.GetVpcFilterArgs(
        name="tag:Name",
        values=["default-vpc"]
    )],
    opts=pulumi.InvokeOptions(provider=dr_provider)
)

# Get subnets in DR region
dr_subnets = aws.ec2.get_subnets(
    filters=[aws.ec2.GetSubnetFilterArgs(
        name="vpc-id",
        values=[dr_vpc.id]
    )],
    opts=pulumi.InvokeOptions(provider=dr_provider)
)

# Create subnet group in DR region
dr_subnet_group = aws.rds.SubnetGroup(f"dr-subnet-group-{environment_suffix}",
    subnet_ids=dr_subnets.ids,
    tags={
        "Name": f"dr-subnet-group-{environment_suffix}"
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Create security group in DR region
dr_sg = aws.ec2.SecurityGroup(f"dr-db-sg-{environment_suffix}",
    vpc_id=dr_vpc.id,
    ingress=[aws.ec2.SecurityGroupIngressArgs(
        from_port=5432,
        to_port=5432,
        protocol="tcp",
        cidr_blocks=["10.0.0.0/8"]
    )],
    egress=[aws.ec2.SecurityGroupEgressArgs(
        from_port=0,
        to_port=0,
        protocol="-1",
        cidr_blocks=["0.0.0.0/0"]
    )],
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Create read replica in DR region
replica_db = aws.rds.Instance(f"replica-db-{environment_suffix}",
    identifier=f"trading-db-replica-{environment_suffix}",
    replicate_source_db=primary_db.arn,
    instance_class="db.t3.medium",
    vpc_security_group_ids=[dr_sg.id],
    kms_key_id=dr_kms.arn,
    skip_final_snapshot=True,
    opts=pulumi.ResourceOptions(
        provider=dr_provider,
        depends_on=[primary_db]
    )
)

# Create CloudWatch alarm for replication lag
replication_alarm = aws.cloudwatch.MetricAlarm(f"replication-lag-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="ReplicaLag",
    namespace="AWS/RDS",
    period=300,
    statistic="Average",
    threshold=60,
    alarm_description="Alert when replication lag exceeds 60 seconds",
    dimensions={
        "DBInstanceIdentifier": replica_db.identifier
    },
    opts=pulumi.ResourceOptions(provider=dr_provider)
)

# Export outputs
pulumi.export("primary_endpoint", primary_db.endpoint)
pulumi.export("replica_endpoint", replica_db.endpoint)
pulumi.export("primary_kms_key_id", primary_kms.id)
pulumi.export("dr_kms_key_id", dr_kms.id)
```

## Deployment Instructions

1. Install dependencies:
```bash
pip install pulumi pulumi-aws
```

2. Configure Pulumi:
```bash
pulumi config set aws:region us-east-1
pulumi config set environmentSuffix prod
```

3. Deploy:
```bash
pulumi up
```

## Notes

This implementation creates:
- Primary RDS PostgreSQL instance in us-east-1
- Read replica in us-west-2
- KMS encryption keys in both regions
- Security groups and subnet groups
- CloudWatch alarm for replication lag
- Automated backups with 7-day retention

The database password should be changed in production and stored in AWS Secrets Manager.
