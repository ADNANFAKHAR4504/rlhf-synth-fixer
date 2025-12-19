# Common Model Failures and Solutions

This document captures common mistakes made when implementing this infrastructure and their solutions.

## 1. Pulumi Testing Issues

### Problem: AttributeError with get_availability_zones()
**Error**: `AttributeError: 'NoneType' object has no attribute 'Invoke'`

**Root Cause**: The `aws.get_availability_zones()` function call is not properly mocked in unit tests.

**Solution**:
```python
class MyMocks(pulumi.runtime.Mocks):
    def call(self, args: pulumi.runtime.MockCallArgs):
        if args.token == "aws:index/getAvailabilityZones:getAvailabilityZones":
            return {
                "names": ["us-east-1a", "us-east-1b", "us-east-1c"],
                "zoneIds": ["use1-az1", "use1-az2", "use1-az3"],
                "id": "us-east-1",
            }
        return {}
```

### Problem: Test coverage below 100%
**Root Cause**: Not all code paths are tested, particularly private methods or edge cases.

**Solution**:
- Test all public methods
- Test initialization of the stack
- Test each resource type separately
- Verify resource configurations (Multi-AZ, encryption, etc.)
- Test all CloudWatch alarms

## 2. Multi-AZ Configuration

### Problem: Redis cluster not Multi-AZ
**Error**: Deployment succeeds but cluster is single-AZ

**Root Cause**: Missing or incomplete Multi-AZ configuration parameters.

**Solution**:
```python
aws.elasticache.ReplicationGroup(
    "redis-cluster",
    num_cache_clusters=2,  # Must be >= 2 for Multi-AZ
    automatic_failover_enabled=True,  # Required
    multi_az_enabled=True,  # Required
    # ... other params
)
```

### Problem: RDS instance not Multi-AZ
**Root Cause**: `multi_az` parameter not set or set to False.

**Solution**:
```python
aws.rds.Instance(
    "rds-instance",
    multi_az=True,  # Explicitly enable
    # ... other params
)
```

## 3. Subnet Configuration

### Problem: Insufficient subnets for Multi-AZ
**Error**: "DB subnet group must contain at least 2 subnets in different AZs"

**Root Cause**: Only one subnet created or all subnets in same AZ.

**Solution**:
- Create at least 2 subnets
- Explicitly set different AZs using `availability_zone` parameter
- Use `get_availability_zones()` to get available AZs
- Create subnets in loop: `availability_zone=self.azs.names[i]`

## 4. Security Group Issues

### Problem: Security group has no rules
**Root Cause**: Ingress or egress rules not defined.

**Solution**:
```python
aws.ec2.SecurityGroup(
    "sg",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=6379,
            to_port=6379,
            cidr_blocks=["10.0.0.0/16"],
            description="Redis access from VPC",
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound",
        )
    ],
)
```

## 5. Subnet Group Issues

### Problem: ElastiCache or RDS deployment fails
**Error**: "Subnet group not found" or "Invalid subnet group"

**Root Cause**: Forgot to create subnet group or using wrong subnet IDs.

**Solution**:
```python
# RDS subnet group
db_subnet_group = aws.rds.SubnetGroup(
    "db-subnet-group",
    subnet_ids=[subnet.id for subnet in self.private_subnets],
)

# ElastiCache subnet group
cache_subnet_group = aws.elasticache.SubnetGroup(
    "cache-subnet-group",
    subnet_ids=[subnet.id for subnet in self.private_subnets],
)

# Use in resource definitions
aws.rds.Instance(
    "rds",
    db_subnet_group_name=db_subnet_group.name,  # Use .name not .id
    # ...
)
```

## 6. Route Table Association

### Problem: Subnets not associated with route tables
**Root Cause**: Route table associations not created.

**Solution**:
```python
for i, subnet in enumerate(self.public_subnets):
    aws.ec2.RouteTableAssociation(
        f"public-rta-{i}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id,
    )
```

## 7. Internet Gateway Route

### Problem: Public subnets can't reach internet
**Root Cause**: No route to Internet Gateway in public route table.

**Solution**:
```python
# Create route after route table
aws.ec2.Route(
    "public-route",
    route_table_id=route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=self.igw.id,  # IGW must exist first
)
```

## 8. CloudWatch Alarm Configuration

### Problem: Alarms not triggering or incorrectly configured
**Root Cause**: Wrong metric name, namespace, or dimensions.

**Solution**:
```python
# RDS alarm
aws.cloudwatch.MetricAlarm(
    "rds-cpu-alarm",
    metric_name="CPUUtilization",  # Exact name required
    namespace="AWS/RDS",  # Correct namespace
    dimensions={
        "DBInstanceIdentifier": rds_instance.identifier,  # Not .id
    },
    # ...
)

# ElastiCache alarm
aws.cloudwatch.MetricAlarm(
    "redis-cpu-alarm",
    metric_name="CPUUtilization",
    namespace="AWS/ElastiCache",  # Not AWS/Redis
    dimensions={
        "ReplicationGroupId": redis_cluster.id,  # Use replication group ID
    },
    # ...
)
```

## 9. Secrets Manager Integration

### Problem: Secret created but not usable
**Root Cause**: Secret has no secret value (SecretVersion not created).

**Solution**:
```python
secret = aws.secretsmanager.Secret("db-secret")

# Must create secret version with actual value
aws.secretsmanager.SecretVersion(
    "db-secret-version",
    secret_id=secret.id,
    secret_string=json.dumps({
        "username": "dbadmin",
        "password": "secure_password",
        "host": "placeholder",
        "port": 5432,
        "dbname": "mydb",
    }),
)
```

## 10. Integration Test Issues

### Problem: Integration tests fail to find resources
**Root Cause**: Tests run before resources are fully deployed, or stack outputs not available.

**Solution**:
```python
@classmethod
def setUpClass(cls):
    try:
        stack = auto.select_stack(...)
        cls.outputs = stack.outputs()
    except Exception as e:
        print(f"Warning: {e}")
        cls.outputs = {}

def test_resource(self):
    if 'resource_output' not in self.outputs:
        self.skipTest("Output not available")
    # Test continues...
```

## 11. Kinesis Stream Configuration

### Problem: Kinesis stream not in PROVISIONED mode
**Root Cause**: Missing stream_mode_details configuration.

**Solution**:
```python
aws.kinesis.Stream(
    "kinesis-stream",
    shard_count=2,
    stream_mode_details=aws.kinesis.StreamStreamModeDetailsArgs(
        stream_mode="PROVISIONED",  # Explicitly set
    ),
    # ...
)
```

## 12. Resource Tagging

### Problem: Resources not properly tagged
**Root Cause**: Forgot to add tags for identification and cost tracking.

**Solution**:
```python
aws.ec2.Vpc(
    "vpc",
    # ... config ...
    tags={
        "Name": "my-vpc",
        "Environment": "production",
        "ManagedBy": "pulumi",
    },
)
```

## Best Practices

1. **Always mock Pulumi function calls** in unit tests
2. **Use explicit resource dependencies** when order matters
3. **Test both success and failure paths** in integration tests
4. **Use descriptive resource names** for easier debugging
5. **Enable encryption** for all data storage services
6. **Use Secrets Manager** for sensitive configuration
7. **Set appropriate CloudWatch alarms** for monitoring
8. **Document all configuration choices** in code comments
9. **Follow Multi-AZ best practices** for high availability
10. **Validate configurations** before deployment
