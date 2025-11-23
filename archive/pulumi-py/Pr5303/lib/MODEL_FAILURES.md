## Model Failures

### 1. Region Constraint Ignored

**Problem in Model Response:**

```python
# Line 53: Hardcoded availability zones
availability_zones = ["us-east-1a", "us-east-1b"]  # Adjust based on your region
```

**How We Fixed It:**

```python
# lib/infrastructure/config.py
def __init__(self):
    self.primary_region = os.getenv('AWS_REGION', 'us-east-1')

def get_availability_zones(self, count: int) -> List[str]:
    """Dynamically fetch availability zones for the configured region."""
    azs = aws.get_availability_zones(state="available")
    return azs.names[:count]
```

Solution:Implemented dynamic AZ fetching using `aws.get_availability_zones()` and made region configurable via environment variable.

---

### 2. Incomplete SSM Replacement

**Problem in Model Response:**

```python
# Lines 239-244: SSM policy attached but no verification
ssm_policy_attachment = aws.iam.RolePolicyAttachment(
    f"{project_name}-ssm-policy",
    role=ssm_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
)
# No user data to ensure SSM agent is running
```

**How We Fixed It:**

```python
# lib/infrastructure/compute.py - Launch template user data
user_data_script = f"""#!/bin/bash
set -e

# Ensure SSM agent is installed and running
sudo systemctl enable amazon-ssm-agent
sudo systemctl start amazon-ssm-agent

# Install and configure CloudWatch agent
sudo yum install -y amazon-cloudwatch-agent
"""

launch_template = aws.ec2.LaunchTemplate(
    template_name,
    user_data=pulumi.Output.all(user_data_script).apply(
        lambda args: base64.b64encode(args[0].encode()).decode()
    ),
    # ... other configuration
)
```

Solution:Added explicit user data script to ensure SSM agent is enabled and running, plus attached both `AmazonSSMManagedInstanceCore` and `CloudWatchAgentServerPolicy` to EC2 role.

---

### 3. Auto Scaling Scope Error

**Problem in Model Response:**

```python
# Line 298: ASG deploys in public subnets
auto_scaling_group = aws.autoscaling.Group(
    f"{project_name}-asg",
    vpc_zone_identifiers=[ps.id for ps in public_subnets],  # WRONG: public subnets
    # ...
)
```

**How We Fixed It:**

```python
# lib/infrastructure/compute.py
def __init__(
    self,
    config: InfraConfig,
    private_subnet_ids: List[Output[str]],  # Private subnets
    security_group_id: Output[str],
    instance_profile_name: Output[str],
    parent: Optional[pulumi.Resource] = None
):
    # ...
    auto_scaling_group = aws.autoscaling.Group(
        asg_name,
        vpc_zone_identifiers=self.private_subnet_ids,  # CORRECT: private subnets
        # ...
    )
```

Solution:Changed ASG to deploy instances in private subnets only, following security best practices.

---

### 4. IAM Policy Over-Permissioned

**Problem in Model Response:**

```python
# Lines 390-414: Lambda policy with wildcard resources
lambda_policy = aws.iam.RolePolicy(
    f"{project_name}-lambda-policy",
    role=lambda_role.id,
    policy=json.dumps({
        "Statement": [
            {
                "Action": [
                    "ec2:DescribeInstances",
                    "autoscaling:SetInstanceHealth"
                ],
                "Resource": "*"  # WRONG: Over-permissioned
            }
        ]
    })
)
```

**How We Fixed It:**

```python
# lib/infrastructure/iam.py
lambda_custom_policy = aws.iam.Policy(
    policy_name,
    policy=Output.all(account_id, self.config.primary_region).apply(
        lambda args: json.dumps({
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "autoscaling:SetInstanceHealth",
                        "autoscaling:TerminateInstanceInAutoScalingGroup"
                    ],
                    "Resource": f"arn:aws:autoscaling:{args[1]}:{args[0]}:autoScalingGroup:*:autoScalingGroupName/tap-*",
                    "Condition": {
                        "StringLike": {
                            "autoscaling:ResourceTag/Project": "tap"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Action": "cloudwatch:PutMetricData",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "cloudwatch:namespace": "tap/HealthCheck"
                        }
                    }
                }
            ]
        })
    )
)
```

Solution:Implemented scoped IAM policies with specific resource ARN patterns and conditions, following least-privilege principle.

---

### 5. Lambda Code Handling Flaws

**Problem in Model Response:**

```python
# Lines 474-489: Multiple inconsistent Lambda code definitions
health_check_lambda = aws.lambda_.Function(
    f"{project_name}-health-check-lambda",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")  # First attempt
    }),
    runtime="python3.8",  # WRONG: Outdated runtime
    # ...
)

# Lines 534-549: Second attempt with different approach
health_check_lambda = aws.lambda_.Function(
    code=pulumi.AssetArchive({
        ".": pulumi.StringAsset(lambda_code)  # Second attempt
    }),
    runtime="python3.8",  # Still wrong
)
```

**How We Fixed It:**

```python
# lib/infrastructure/lambda_functions.py
function = aws.lambda_.Function(
    function_name,
    name=function_name,
    runtime=self.config.lambda_runtime,  # Python 3.11 from config
    handler="index.lambda_handler",
    role=self.lambda_role_arn,
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(lambda_code)  # Consistent approach
    }),
    timeout=self.config.lambda_timeout,
    memory_size=self.config.lambda_memory_size,
    # ...
)
```

Solution:Used consistent `pulumi.AssetArchive` with `pulumi.StringAsset`, upgraded to Python 3.11 runtime, and made configuration values centralized.

---

### 6. No EC2 Replacement Logic Validation

**Problem in Model Response:**

```python
# Lines 458-468: No retry logic or notifications
if instance_status != 'ok' or system_status != 'ok':
    logger.warning(f"Unhealthy instance detected: {instance_id}")
    try:
        autoscaling.set_instance_health(
            InstanceId=instance_id,
            HealthStatus='Unhealthy',
            ShouldRespectGracePeriod=False
        )
        logger.info(f"Instance {instance_id} marked as unhealthy for replacement")
    except Exception as e:
        logger.error(f"Error marking instance {instance_id} as unhealthy: {str(e)}")
        # No retry, no metrics, no SNS notification
```

**How We Fixed It:**

```python
# lib/infrastructure/lambda_functions.py - Lambda code
MAX_RETRIES = 3

def replace_unhealthy_instance(instance_id: str, asg_name: str) -> bool:
    """Replace unhealthy instance with retry logic."""
    for attempt in range(1, MAX_RETRIES + 1):
        try:
            print(f"Attempt {attempt}/{MAX_RETRIES}: Marking instance {instance_id} as unhealthy")

            asg_client.set_instance_health(
                InstanceId=instance_id,
                HealthStatus='Unhealthy',
                ShouldRespectGracePeriod=False
            )

            print(f"Successfully marked instance {instance_id} as unhealthy")
            return True

        except Exception as e:
            print(f"Attempt {attempt} failed for instance {instance_id}: {str(e)}")
            if attempt == MAX_RETRIES:
                print(f"All {MAX_RETRIES} attempts failed for instance {instance_id}")
                return False

    return False

# Publish metrics to CloudWatch
publish_metric('HealthyInstances', healthy_count)
publish_metric('UnhealthyInstances', unhealthy_count)
publish_metric('ReplacedInstances', replaced_count)
```

Solution:Added retry logic with MAX_RETRIES constant, CloudWatch metrics publication for monitoring, and detailed logging for operational visibility.

---

### 7. Networking & Routing Inconsistency

**Problem in Model Response:**

```python
# Lines 134-192: Route tables created but not exported
public_route_table = aws.ec2.RouteTable(
    f"{project_name}-public-rt",
    vpc_id=vpc.id,
    tags={"Name": f"{project_name}-public-rt"}
)
# ... route table associations created ...

# Lines 514-520: Outputs missing route tables and NAT gateways
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
# Missing: NAT gateway IDs, route table IDs
```

**How We Fixed It:**

```python
# lib/infrastructure/networking.py - Complete routing implementation
def _create_public_route_table(self) -> aws.ec2.RouteTable:
    """Create public route table with IGW route."""
    rt = aws.ec2.RouteTable(
        rt_name,
        vpc_id=self.vpc.id,
        tags={**self.config.get_common_tags(), 'Name': rt_name, 'Type': 'Public'}
    )

    # Create route to Internet Gateway
    aws.ec2.Route(
        route_name,
        route_table_id=rt.id,
        destination_cidr_block="0.0.0.0/0",
        gateway_id=self.internet_gateway.id
    )
    return rt

# lib/tap_stack.py - Complete outputs
outputs['nat_gateway_ids'] = Output.all(*self.networking_stack.get_nat_gateway_ids())
outputs['public_route_table_id'] = self.networking_stack.get_public_route_table_id()
outputs['private_route_table_ids'] = Output.all(*self.networking_stack.get_private_route_table_ids())
```

Solution:Added explicit tagging for route tables, created getter methods for all networking resources, and exported NAT gateway IDs and route table IDs in outputs.

---

### 8. Security Group Misconfiguration

**Problem in Model Response:**

```python
# Lines 195-221: Security group allows HTTPS from anywhere
public_sg = aws.ec2.SecurityGroup(
    f"{project_name}-public-sg",
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTPS from anywhere",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"],  # WRONG: Allows all IPs
        ),
    ],
    # Comment says "In production, restrict to your organization's IP range" but doesn't do it
)
```

**How We Fixed It:**

```python
# lib/infrastructure/security.py
def __init__(
    self,
    config: InfraConfig,
    vpc_id: Output[str],
    parent: Optional[pulumi.Resource] = None
):
    # Use authorized IP ranges from config
    self.config = config

    self.ec2_security_group = aws.ec2.SecurityGroup(
        sg_name,
        vpc_id=vpc_id,
        description="Security group for EC2 instances with restricted access",
        ingress=[
            aws.ec2.SecurityGroupIngressArgs(
                description="HTTPS from authorized IPs only",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=self.config.authorized_ip_ranges  # CORRECT: Restricted IPs
            )
        ],
        egress=[
            aws.ec2.SecurityGroupEgressArgs(
                description="Allow all outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )
        ],
        tags={**self.config.get_common_tags(), 'Name': sg_name}
    )
```

Solution:Implemented configurable authorized IP ranges via environment variable `AUTHORIZED_IP_RANGES`, defaulting to `10.0.0.0/8` instead of `0.0.0.0/0`.

---

### 9. Output Coverage Gaps

**Problem in Model Response:**

```python
# Lines 514-520: Missing critical outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("private_subnet_ids", [subnet.id for subnet in private_subnets])
pulumi.export("auto_scaling_group_name", auto_scaling_group.name)
pulumi.export("lambda_function_name", health_check_lambda.name)
pulumi.export("ssm_access_instructions", "Connect to instances using AWS Systems Manager Session Manager in the AWS Console")
# Missing: EC2 public IP, NAT gateway IDs, route table IDs, IAM role ARNs, alarm ARNs, etc.
```

**How We Fixed It:**

```python
# lib/tap_stack.py - Comprehensive outputs (30 total)
outputs = {}

# Networking outputs
outputs['vpc_id'] = self.networking_stack.get_vpc_id()
outputs['vpc_cidr'] = self.networking_stack.get_vpc_cidr()
outputs['public_subnet_ids'] = Output.all(*self.networking_stack.get_public_subnet_ids())
outputs['private_subnet_ids'] = Output.all(*self.networking_stack.get_private_subnet_ids())
outputs['internet_gateway_id'] = self.networking_stack.get_internet_gateway_id()
outputs['nat_gateway_ids'] = Output.all(*self.networking_stack.get_nat_gateway_ids())
outputs['public_route_table_id'] = self.networking_stack.get_public_route_table_id()
outputs['private_route_table_ids'] = Output.all(*self.networking_stack.get_private_route_table_ids())

# Security outputs
outputs['ec2_security_group_id'] = self.security_stack.get_ec2_security_group_id()

# IAM outputs
outputs['ec2_role_arn'] = self.iam_stack.get_ec2_role_arn()
outputs['ec2_role_name'] = self.iam_stack.get_ec2_role_name()
outputs['lambda_role_arn'] = self.iam_stack.get_lambda_role_arn()
outputs['lambda_role_name'] = self.iam_stack.get_lambda_role_name()
outputs['ec2_instance_profile_name'] = self.iam_stack.get_ec2_instance_profile_name()
outputs['ec2_instance_profile_arn'] = self.iam_stack.get_ec2_instance_profile_arn()

# Compute outputs
outputs['launch_template_id'] = self.compute_stack.get_launch_template_id()
outputs['auto_scaling_group_name'] = self.compute_stack.get_auto_scaling_group_name()
outputs['auto_scaling_group_arn'] = self.compute_stack.get_auto_scaling_group_arn()
outputs['scale_up_policy_arn'] = self.compute_stack.get_scale_up_policy_arn()
outputs['scale_down_policy_arn'] = self.compute_stack.get_scale_down_policy_arn()

# Lambda outputs
outputs['lambda_function_arn'] = self.lambda_stack.get_function_arn()
outputs['lambda_function_name'] = self.lambda_stack.get_function_name()

# Monitoring outputs
outputs['cpu_high_alarm_arn'] = self.monitoring_stack.get_cpu_high_alarm_arn()
outputs['cpu_low_alarm_arn'] = self.monitoring_stack.get_cpu_low_alarm_arn()
outputs['health_check_rule_arn'] = self.monitoring_stack.get_health_check_rule_arn()
outputs['lambda_log_group_name'] = self.monitoring_stack.get_lambda_log_group_name()

# Configuration outputs
outputs['region'] = self.config.primary_region
outputs['environment'] = self.config.environment
outputs['environment_suffix'] = self.config.environment_suffix
outputs['ssm_access_instructions'] = "Connect to EC2 instances using AWS Systems Manager Session Manager in the AWS Console or AWS CLI"
```

Solution:Exported 30 comprehensive outputs covering all infrastructure components, sufficient for integration testing and operational visibility. Note: EC2 public IP not exported because instances are in private subnets (security best practice).

---

### 10. Operational Best Practice Failures

**Problem in Model Response:**

```python
# No error handling around pulumi.export()
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
# ... more exports without try-catch
```

**How We Fixed It:**

```python
# lib/tap_stack.py
def _register_outputs(self):
    """Register all outputs for the stack with error handling."""
    outputs = {}

    # ... populate outputs dictionary ...

    # Register outputs with Pulumi with exception handling
    try:
        for key, value in outputs.items():
            pulumi.export(key, value)
    except Exception as e:
        # Gracefully handle environments where pulumi.export() may not be available
        print(f"Warning: Could not export outputs: {e}")

    # Preserve backward compatibility with self.register_outputs()
    self.register_outputs(outputs)
```

Solution: Added try-except block around `pulumi.export()` calls to handle edge cases gracefully, and used `self.register_outputs()` for backward compatibility with Pulumi ComponentResource pattern.
