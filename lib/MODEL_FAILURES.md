# Model Implementation Failures

## 1. NetworkingStack Constructor Missing Config Parameter

**Expected (MODEL_RESPONSE.md lines 108-111):**
```python
class NetworkingStack:
    def __init__(self, name: str, config: pulumi.Config):
        self.name = name
        self.config = config
```

**Actual (components/networking.py lines 5-6):**
```python
class NetworkingStack:
    def __init__(self, name: str):
        self.name = name
```

**Impact:** The NetworkingStack class does not accept or use Pulumi Config for configuration management. This makes it less flexible and harder to configure per environment.

## 2. SecurityStack Constructor Missing Config Parameter

**Expected (MODEL_RESPONSE.md lines 246-252):**
```python
class SecurityStack:
    def __init__(self, name: str, config: pulumi.Config, vpc_id: pulumi.Output[str]):
        self.name = name
        self.config = config
        self.vpc_id = vpc_id
        
        container_port = config.get_int("container_port") or 80
```

**Actual (components/security.py lines 5-9):**
```python
class SecurityStack:
    def __init__(self, name: str, vpc_id: pulumi.Output[str], container_port: int):
        self.name = name
        self.vpc_id = vpc_id
        self.container_port = container_port
```

**Impact:** Config parameter is missing. Container port is passed directly instead of being read from Pulumi Config, reducing configuration flexibility.

## 3. DatabaseStack Constructor Missing Config Parameter

**Expected (MODEL_RESPONSE.md lines 428-437):**
```python
class DatabaseStack:
    def __init__(self, name: str, config: pulumi.Config, 
                 subnet_group_name: Output[str], security_group_id: Output[str]):
        self.name = name
        self.config = config
        
        # Get database configuration
        db_username = config.get("db_username") or "dbadmin"
        db_name = config.get("db_name") or "appdb"
        environment = config.get("environment") or "dev"
```

**Actual (components/database.py lines 8-18):**
```python
class DatabaseStack:
    def __init__(self, name: str, 
                 subnet_group_name: Output[str], 
                 security_group_id: Output[str],
                 db_username: str,
                 db_name: str,
                 environment: str):
        self.name = name
        self.db_username = db_username
        self.db_name = db_name
        self.environment = environment
```

**Impact:** Config parameter is missing. Database credentials and environment are passed directly instead of being read from Pulumi Config.

## 4. Different Password Generation Method

**Expected (MODEL_RESPONSE.md lines 440-455):**
```python
db_password_version = aws.secretsmanager.SecretVersion(
    f"{name}-db-password-version",
    secret_id=db_password.id,
    secret_string=pulumi.Output.secret(
        aws.secretsmanager.get_random_password(
            length=32,
            special=True,
            exclude_characters="\"@/\\"
        ).result
    )
)
```

**Actual (components/database.py lines 20-35):**
```python
# Generate secure random password using Python's secrets module
alphabet = string.ascii_letters + string.digits + "!#$%&*()-_=+[]{}<>:?"
password = ''.join(secrets.choice(alphabet) for i in range(32))

db_password_version = aws.secretsmanager.SecretVersion(
    f"{name}-db-password-version",
    secret_id=db_password.id,
    secret_string=pulumi.Output.secret(password)
)
```

**Impact:** Uses Python's secrets module instead of AWS Secrets Manager password generation. The AWS method is preferred as it ensures AWS-managed randomness and doesn't expose password in Pulumi state.

## 5. RDS Instance Configuration Structure Different

**Expected (MODEL_RESPONSE.md lines 527-540):**
```python
for i in range(instance_count):
    instance = aws.rds.ClusterInstance(
        f"{name}-aurora-instance-{i+1}",
        cluster_identifier=self.cluster.id,
        instance_class="db.serverless",
        engine="aurora-postgresql",
        db_parameter_group_name=self.db_parameter_group.name,
        performance_insights_enabled=True if environment != "dev" else False,
        performance_insights_retention_period=7 if environment != "dev" else 0,
        monitoring_interval=60 if environment != "dev" else 0,
        monitoring_role_arn=self._create_monitoring_role().arn if environment != "dev" else None,
        tags={"Name": f"{name}-aurora-instance-{i+1}"}
    )
```

**Actual (components/database.py lines 106-132):**
```python
for i in range(instance_count):
    instance_args = {
        "cluster_identifier": self.cluster.id,
        "instance_class": "db.serverless",
        "engine": "aurora-postgresql",
        "db_parameter_group_name": self.db_parameter_group.name,
        "tags": {"Name": f"{name}-aurora-instance-{i+1}"}
    }
    
    if self.environment != "dev":
        instance_args["performance_insights_enabled"] = True
        instance_args["performance_insights_retention_period"] = 7
        instance_args["monitoring_interval"] = 60
        instance_args["monitoring_role_arn"] = self._create_monitoring_role().arn
    else:
        instance_args["performance_insights_enabled"] = False
        instance_args["monitoring_interval"] = 0
    
    instance = aws.rds.ClusterInstance(
        f"{name}-aurora-instance-{i+1}",
        **instance_args
    )
```

**Impact:** Different code structure but functionally equivalent. The actual implementation uses dictionary unpacking which is more complex but avoids conditional parameter issues.

## 6. EcsStack Constructor Missing Config and Has Public Subnets

**Expected (MODEL_RESPONSE.md lines 599-607):**
```python
class EcsStack:
    def __init__(self, name: str, config: pulumi.Config, 
                 vpc_id: Output[str], 
                 private_subnet_ids: list,
                 security_groups: dict,
                 iam_roles: dict,
                 db_endpoint: Output[str],
                 db_secret_arn: Output[str]):
```

**Actual (components/ecs.py lines 6-26):**
```python
class EcsStack:
    def __init__(self, name: str,
                 vpc_id: Output[str], 
                 public_subnet_ids: list,
                 private_subnet_ids: list,
                 security_groups: dict,
                 iam_roles: dict,
                 db_endpoint: Output[str],
                 db_secret_arn: Output[str],
                 container_image: str,
                 container_port: int,
                 cpu: int,
                 memory: int,
                 desired_count: int,
                 environment: str,
                 blue_weight: int,
                 green_weight: int,
                 min_capacity: int,
                 max_capacity: int,
                 scale_target_cpu: int,
                 scale_target_memory: int):
```

**Impact:** 
1. Missing config parameter - all configuration passed as individual parameters
2. Includes public_subnet_ids which is not in MODEL_RESPONSE
3. Takes 13 additional explicit parameters instead of using config object

## 7. ALB Uses Public Subnets Instead of Private Subnets

**Expected (MODEL_RESPONSE.md line 663):**
```python
subnets=[subnet.id for subnet in private_subnet_ids],
```

**Actual (components/ecs.py line 77):**
```python
subnets=[subnet.id for subnet in public_subnet_ids],
```

**Impact:** ALB is correctly placed in public subnets (actual implementation) vs incorrectly in private subnets (MODEL_RESPONSE). The actual implementation is CORRECT - ALBs must be in public subnets to receive internet traffic.

## 8. Target Group Naming Uses Short Name

**Expected (MODEL_RESPONSE.md lines 671-672):**
```python
self.blue_target_group = aws.lb.TargetGroup(
    f"{name}-blue-tg",
```

**Actual (components/ecs.py lines 87-90):**
```python
short_name = name[:15] if len(name) > 15 else name

self.blue_target_group = aws.lb.TargetGroup(
    f"{short_name}-blue",
```

**Impact:** The actual implementation truncates long names to avoid AWS's 32-character limit for target group names. This is a necessary improvement not present in MODEL_RESPONSE.

## 9. ECS Service Deployment Configuration Syntax Different

**Expected (MODEL_RESPONSE.md lines 850-856):**
```python
deployment_configuration={
    "maximum_percent": 200,
    "minimum_healthy_percent": 100,
    "deployment_circuit_breaker": {
        "enable": True,
        "rollback": True
    }
},
```

**Actual (components/ecs.py lines 255-260):**
```python
deployment_maximum_percent=200,
deployment_minimum_healthy_percent=100,
deployment_circuit_breaker=aws.ecs.ServiceDeploymentCircuitBreakerArgs(
    enable=True,
    rollback=True
),
```

**Impact:** Uses individual properties instead of nested dictionary. The actual implementation uses typed Args objects which is more type-safe and correct for newer Pulumi AWS provider versions.

## 10. ECS Service Network Configuration Syntax Different

**Expected (MODEL_RESPONSE.md lines 858-862):**
```python
network_configuration={
    "assign_public_ip": False,
    "subnets": [subnet.id for subnet in subnets],
    "security_groups": [security_group.id]
},
```

**Actual (components/ecs.py lines 261-265):**
```python
network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
    assign_public_ip=False,
    subnets=[subnet.id for subnet in subnets],
    security_groups=[security_group.id]
),
```

**Impact:** Uses typed Args object instead of dictionary. The actual implementation is more type-safe and correct.

## 11. ECS Service Load Balancer Configuration Syntax Different

**Expected (MODEL_RESPONSE.md lines 863-867):**
```python
load_balancers=[{
    "target_group_arn": target_group.arn,
    "container_name": f"{self.name}-{deployment_type}",
    "container_port": container_port
}],
```

**Actual (components/ecs.py lines 266-270):**
```python
load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
    target_group_arn=target_group.arn,
    container_name=f"{self.name}-{deployment_type}",
    container_port=self.container_port
)],
```

**Impact:** Uses typed Args object instead of dictionary. The actual implementation is more type-safe and correct.

## 12. ECS Service Method Signature Different

**Expected (MODEL_RESPONSE.md lines 835-841):**
```python
def _create_ecs_service(self, deployment_type: str, 
                       task_definition: aws.ecs.TaskDefinition,
                       target_group: aws.lb.TargetGroup,
                       desired_count: int,
                       subnets: list,
                       security_group: aws.ec2.SecurityGroup,
                       container_port: int):
```

**Actual (components/ecs.py lines 242-246):**
```python
def _create_ecs_service(self, deployment_type: str, 
                       task_definition: aws.ecs.TaskDefinition,
                       target_group: aws.lb.TargetGroup,
                       subnets: list,
                       security_group: aws.ec2.SecurityGroup):
```

**Impact:** Missing desired_count and container_port parameters. The actual implementation uses instance variables (self.desired_count, self.container_port) instead of method parameters.

## 13. Task Definition Method Signature Different

**Expected (MODEL_RESPONSE.md lines 775-778):**
```python
def _create_task_definition(self, deployment_type: str, image: str, 
                            port: int, cpu: int, memory: int,
                            iam_roles: dict, db_endpoint: Output[str],
                            db_secret_arn: Output[str]):
```

**Actual (components/ecs.py line 185):**
```python
def _create_task_definition(self, deployment_type: str, iam_roles: dict):
```

**Impact:** Missing image, port, cpu, memory, db_endpoint, db_secret_arn parameters. The actual implementation uses instance variables instead.

## 14. Container Definition Environment Variable Access

**Expected (MODEL_RESPONSE.md line 796):**
```python
{"name": "APP_ENV", "value": self.config.get("environment") or "dev"}
```

**Actual (components/ecs.py line 203):**
```python
{"name": "APP_ENV", "value": self.environment}
```

**Impact:** Cannot access self.config because config parameter doesn't exist in the actual implementation. Uses self.environment instance variable instead.

## 15. MonitoringStack Constructor Missing Config Parameter

**Expected (MODEL_RESPONSE.md lines 939-944):**
```python
class MonitoringStack:
    def __init__(self, name: str, config: pulumi.Config,
                 cluster_name: Output[str],
                 blue_service_name: Output[str],
                 green_service_name: Output[str],
                 alb_arn: Output[str]):
```

**Actual (components/monitoring.py lines 6-13):**
```python
class MonitoringStack:
    def __init__(self, name: str,
                 cluster_name: Output[str],
                 blue_service_name: Output[str],
                 green_service_name: Output[str],
                 alb_arn: Output[str],
                 environment: str,
                 alert_email: str = None):
```

**Impact:** Missing config parameter. Environment and alert_email passed directly instead of using config object.

## 16. MonitoringStack Alert Email Access

**Expected (MODEL_RESPONSE.md line 957):**
```python
if config.get("alert_email"):
```

**Actual (components/monitoring.py line 26):**
```python
if self.alert_email:
```

**Impact:** Cannot access config.get() because config parameter doesn't exist. Uses instance variable instead.

## 17. MonitoringStack Environment Access

**Expected (MODEL_RESPONSE.md line 947):**
```python
environment = config.get("environment") or "dev"
```

**Actual (components/monitoring.py lines 15-16):**
```python
self.environment = environment
```

**Impact:** Environment passed as parameter instead of read from config.

## 18. CloudWatch Alarm Missing alarm_name Property

**Expected (MODEL_RESPONSE.md lines 1067-1069):**
```python
aws.cloudwatch.MetricAlarm(
    f"{self.name}-{deployment_type}-cpu-alarm",
    alarm_name=f"{self.name}-{deployment_type}-high-cpu",
```

**Actual (components/monitoring.py lines 136-137):**
```python
aws.cloudwatch.MetricAlarm(
    f"{self.name}-{deployment_type}-high-cpu",
```

**Impact:** Missing alarm_name property. The resource name and alarm name should be separate for clarity.

## 19. Main Program Structure Completely Different

**Expected (MODEL_RESPONSE.md lines 1176-1254):**
The main program should be in `__main__.py` with direct instantiation:
```python
networking = NetworkingStack(f"{project_name}-{environment}", config)
security = SecurityStack(f"{project_name}-{environment}", config, networking.vpc.id)
database = DatabaseStack(f"{project_name}-{environment}", config, 
                        networking.db_subnet_group.name, security.rds_sg.id)
ecs = EcsStack(f"{project_name}-{environment}", config, networking.vpc.id, 
              networking.private_subnets, {...}, {...}, 
              database.endpoint, database.db_secret_arn)
monitoring = MonitoringStack(f"{project_name}-{environment}", config,
                            ecs.cluster.name, ecs.blue_service.name,
                            ecs.green_service.name, ecs.alb.arn)
```

**Actual (lib/tap_stack.py lines 125-193):**
All components are instantiated inside TapStack ComponentResource:
```python
class TapStack(pulumi.ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        # ... config reading ...
        self.networking = NetworkingStack(f"{project_name}-{environment}")
        self.security = SecurityStack(f"{project_name}-{environment}", 
                                     self.networking.vpc.id, self.container_port)
        self.database = DatabaseStack(f"{project_name}-{environment}",
                                     self.networking.db_subnet_group.name,
                                     self.security.rds_sg.id,
                                     self.db_username, self.db_name, self.environment)
        # etc...
```

**Impact:** The architecture is fundamentally different. MODEL_RESPONSE uses a flat structure in __main__.py, while actual implementation uses a ComponentResource pattern which is more modular and reusable.

## 20. Configuration Reading Location Different

**Expected (MODEL_RESPONSE.md lines 1189-1195):**
Configuration read in __main__.py:
```python
config = Config("blue-green-ecs")
project_name = config.get("project_name") or "blue-green-ecs"
environment = config.get("environment") or "dev"
```

**Actual (lib/tap_stack.py lines 80-115):**
Configuration read inside TapStack component:
```python
config = pulumi.Config()
project_name = config.get("project_name") or name
self.container_image = config.get("container_image") or "nginx:latest"
# ... all other config reads ...
```

**Impact:** Config is read in the component instead of passed down. This violates separation of concerns and makes testing harder.

## 21. ECS Service Call Missing Parameters

**Expected (MODEL_RESPONSE.md lines 751-759):**
```python
self.blue_service = self._create_ecs_service(
    "blue",
    self.blue_task_definition,
    self.blue_target_group,
    desired_count,
    private_subnet_ids,
    security_groups["ecs_sg"],
    container_port
)
```

**Actual (components/ecs.py lines 165-171):**
```python
self.blue_service = self._create_ecs_service(
    "blue",
    self.blue_task_definition,
    self.blue_target_group,
    private_subnet_ids,
    security_groups["ecs_sg"]
)
```

**Impact:** Missing desired_count and container_port parameters because they're accessed as instance variables.

## 22. Task Definition Creation Call Missing Parameters

**Expected (MODEL_RESPONSE.md lines 636-645):**
```python
self.blue_task_definition = self._create_task_definition(
    "blue", 
    container_image, 
    container_port, 
    cpu, 
    memory, 
    iam_roles,
    db_endpoint,
    db_secret_arn
)
```

**Actual (components/ecs.py lines 62-65):**
```python
self.blue_task_definition = self._create_task_definition(
    "blue", 
    iam_roles
)
```

**Impact:** Missing container_image, container_port, cpu, memory, db_endpoint, db_secret_arn parameters because they're accessed as instance variables.

## 23. Autoscaling Configuration Reading

**Expected (MODEL_RESPONSE.md lines 879-882):**
```python
min_capacity = self.config.get_int("min_capacity") or 1
max_capacity = self.config.get_int("max_capacity") or 10
scale_target_cpu = self.config.get_int("scale_target_cpu") or 70
scale_target_memory = self.config.get_int("scale_target_memory") or 80
```

**Actual (components/ecs.py lines 283-286):**
```python
# Uses instance variables directly
scalable_target = aws.appautoscaling.Target(
    f"{self.name}-{deployment_type}-scaling-target",
    max_capacity=self.max_capacity,
    min_capacity=self.min_capacity,
```

**Impact:** Cannot access config because it doesn't exist. Uses instance variables set in constructor.

## 24. Main Program Export Location

**Expected (MODEL_RESPONSE.md lines 1257-1267):**
Exports in __main__.py at module level:
```python
export("vpc_id", networking.vpc.id)
export("alb_dns", ecs.alb.dns_name)
# ... etc
```

**Actual (lib/tap_stack.py lines 209-219):**
Exports inside TapStack component:
```python
pulumi.export("vpc_id", self.vpc_id)
pulumi.export("alb_dns", self.alb_dns)
# ... etc
```

**Impact:** Exports are inside the component resource instead of module level. This is acceptable but differs from the recommended pattern.

## 25. Missing Common Tags Usage in Components

**Expected (MODEL_RESPONSE.md lines 1197-1202):**
```python
common_tags = {
    "Project": project_name,
    "Environment": environment,
    "ManagedBy": "Pulumi"
}
```
These tags should be passed to all component stacks.

**Actual (lib/tap_stack.py lines 118-123):**
```python
common_tags = {
    **self.tags,
    "Project": project_name,
    "Environment": environment,
    "ManagedBy": "Pulumi"
}
```
Common tags are created but never passed to component stacks.

**Impact:** Individual resources have tags but they're not consistent across all components. Common tags are defined but not propagated.

## 26. TapStack Uses ComponentResource Pattern

**Expected (MODEL_RESPONSE.md):**
The entire response shows a flat structure with all resources created in __main__.py

**Actual (lib/tap_stack.py lines 49-254):**
```python
class TapStack(pulumi.ComponentResource):
    def __init__(self, name: str, args: TapStackArgs, 
                 opts: Optional[ResourceOptions] = None):
        super().__init__('tap:stack:TapStack', name, None, opts)
        # ... all component instantiation ...
        self.register_outputs({})
```

**Impact:** The actual implementation uses a ComponentResource which is a Pulumi best practice for reusable infrastructure components. MODEL_RESPONSE doesn't show this pattern at all.

**Impact:** Directory named "components" instead of "modules". This is a minor naming difference with no functional impact.

## Summary

Total Failures: 26 differences identified

Critical Architectural Differences:
1. All component classes missing pulumi.Config parameter
2. ComponentResource pattern used instead of flat __main__.py structure
3. Configuration read inside TapStack instead of passed from main
4. All ECS configuration passed as individual parameters instead of config object
5. Uses typed Args objects (correct) instead of dictionaries (shown in MODEL_RESPONSE)

Configuration Management Issues:
6. NetworkingStack has no config parameter
7. SecurityStack has no config parameter
8. DatabaseStack has no config parameter
9. EcsStack has no config parameter with 13 individual parameters instead
10. MonitoringStack has no config parameter

Implementation Differences:
11. Password generation uses Python secrets instead of AWS Secrets Manager API
12. RDS instance configuration uses dictionary unpacking pattern
13. ALB correctly uses public subnets (MODEL_RESPONSE incorrectly shows private)
14. Target group naming includes truncation for AWS limits
15. CloudWatch alarms missing alarm_name property
16. Common tags defined but not propagated to components
17. Directory named "components" instead of "modules"

Syntax Differences (Actual is More Correct):
18. ECS deployment_configuration uses individual properties
19. ECS network_configuration uses typed Args
20. ECS load_balancers uses typed Args
21. Autoscaling uses instance variables instead of config reads

The actual implementation favors explicit parameter passing and instance variables over config object dependency injection, which makes testing easier but requires more boilerplate code.
