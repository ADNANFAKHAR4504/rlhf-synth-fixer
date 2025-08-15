# ---
#
# ## Key Code Blocks from tap_stack.py
#
# ### VPC & Networking
```python
class SecureVPC:
	def __init__(self, name_prefix: str, vpc_cidr: str, tags: Dict[str, str]) -> None:
		# ...existing code...
		self.vpc = self._create_vpc()
		self.igw = self._create_internet_gateway()
		self.public_subnets = self._create_public_subnets()
		self.private_subnets = self._create_private_subnets()
		self.eips = self._create_elastic_ips()
		self.nat_gateways = self._create_nat_gateways()
		self.public_rt = self._create_public_route_table()
		self.private_rts = self._create_private_route_tables()
		self.public_nacl = self._create_public_nacl()
		self.private_nacl = self._create_private_nacl()
		self.flow_logs_role = self._create_flow_logs_role()
		self.flow_logs = self._create_flow_logs()
```

# ### Security Groups
```python
def create_security_groups(vpc: aws.ec2.Vpc, tags: Dict[str, str]) -> Dict[str, Any]:
	web_sg = aws.ec2.SecurityGroup(
		"nova-web-sg",
		description="Security group for web servers - HTTP/HTTPS only",
		vpc_id=vpc.id,
		ingress=[
			aws.ec2.SecurityGroupIngressArgs(
				description="HTTP",
				from_port=80,
				to_port=80,
				protocol="tcp",
				cidr_blocks=["0.0.0.0/0"]),
			aws.ec2.SecurityGroupIngressArgs(
				description="HTTPS",
				from_port=443,
				to_port=443,
				protocol="tcp",
				cidr_blocks=["0.0.0.0/0"]),
		],
		egress=[
			aws.ec2.SecurityGroupEgressArgs(
				description="All outbound traffic",
				from_port=0,
				to_port=0,
				protocol="-1",
				cidr_blocks=["0.0.0.0/0"])
		],
		tags={**tags, "Name": "nova-web-security-group"},
	)
	# ...lambda_sg code...
```

# ### EC2 Instances
```python
def create_compute_resources(
	subnets: List[aws.ec2.Subnet],
	security_group: aws.ec2.SecurityGroup,
	kms_key: aws.kms.Key,
	tags: Dict[str, str],
) -> Dict[str, Any]:
	for i in range(2):
		role = aws.iam.Role(
			f"nova-ec2-role-{i + 1}",
			assume_role_policy=assume_role_policy,
			tags={**tags, "Name": f"nova-ec2-role-{i + 1}"},
		)
		# ...instance_profile and instance code...
```

# ### API Gateway
```python
def create_api_gateway(kms_key: aws.kms.Key, tags: Dict[str, str]) -> Dict[str, Any]:
	log_group = aws.cloudwatch.LogGroup(
		"nova-api-gateway-logs",
		name="/aws/apigateway/nova-api",
		retention_in_days=14,
		kms_key_id=kms_key.arn,
		tags={**tags, "Name": "nova-api-gateway-logs"},
	)
	# ...rest of API Gateway code...
```

# ### Monitoring Lambda
```python
def create_monitoring(
	subnets: List[aws.ec2.Subnet],
	security_group: aws.ec2.SecurityGroup,
	instances: List[aws.ec2.Instance],
	kms_key: aws.kms.Key,
	tags: Dict[str, str],
) -> Dict[str, Any]:
	lambda_function = aws.lambda_.Function(
		"nova-model-health-check",
		name="nova-model-health-check",
		runtime="python3.9",
		code=pulumi.AssetArchive({
			"lambda_function.py": pulumi.StringAsset(lambda_code)}),
		handler="lambda_function.lambda_handler",
		role=lambda_role.arn,
		timeout=60,
		vpc_config=aws.lambda_.FunctionVpcConfigArgs(
			subnet_ids=[s.id for s in subnets],
			security_group_ids=[security_group.id]),
		environment=aws.lambda_.FunctionEnvironmentArgs(
			variables={"ENVIRONMENT": "production"}),
		kms_key_arn=kms_key.arn,
		tags={**tags, "Name": "nova-health-check-lambda"},
	)
	# ...EventBridge scheduling code...
```

# ### Pulumi Exports
```python
class TapStack(pulumi.ComponentResource):
	def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None) -> None:
		# ...existing code...
		pulumi.export("vpc_id", vpc_module.vpc.id)
		pulumi.export("kms_key_id", kms_key.id)
		pulumi.export("ec2_instance_ids", [inst.id for inst in instances])
		pulumi.export("api_url", api["api_url"])
		pulumi.export("health_lambda", health_lambda.arn)
		# ...other exports...
```

# IDEAL_RESPONSE.md

## Ideal Solution Summary: AWS Nova Model Breaking (Pulumi Python)

This solution provisions a secure, scalable, and compliant AWS infrastructure for a production environment using Pulumi in Python. All requirements from the prompt are addressed, and Pulumi best practices are followed throughout.

---

### Key Features
- **VPC**: Created in `us-east-1` with public and private subnets across two availability zones, NAT gateways, route tables, NACLs, and VPC Flow Logs.
- **Security Groups**: Web security group allows only HTTP (80) and HTTPS (443) inbound; Lambda security group allows all outbound.
- **EC2 Instances**: Two EC2 instances, each with a unique IAM role and instance profile, encrypted root volumes using KMS, and a user data script for web server setup.
- **API Gateway**: REST API with CloudWatch logging, KMS-encrypted log group, and correct IAM role for logging.
- **KMS**: Key created for encryption of logs and EBS volumes, with a proper policy and alias.
- **Monitoring Lambda**: Lambda function scheduled every 5 minutes via EventBridge, checks EC2 health, pushes metrics to CloudWatch, runs in VPC, and uses KMS-encrypted log group.
- **Resource Tagging**: All resources tagged with `Environment: Production` and clear naming conventions.
- **Pulumi Exports**: All key resource IDs, ARNs, and endpoints are exported for visibility and integration.
- **Type Annotations & PEP8**: All Python code uses type annotations and follows PEP8 style.

---

### Compliance & Best Practices
- **Region Enforcement**: All resources are created in `us-east-1`.
- **Managed Services**: API Gateway, Lambda, and CloudWatch are used to reduce operational overhead.
- **Encryption**: KMS is used for all sensitive resources.
- **Config Management**: Pulumi config and stack management are used for environment-specific variables.
- **Resource Dependencies**: Proper use of Pulumi resource dependencies ensures reliable provisioning order.

---

### Deployment Instructions
1. Install dependencies: `pip install -r requirements.txt`
2. Configure Pulumi stack and region: `pulumi stack init prod`, `pulumi config set aws:region us-east-1`, `pulumi config set environment production`
3. Deploy: `pulumi up`
4. Verify exported outputs for resource IDs and endpoints.

---

## Result
The infrastructure is secure, scalable, and production-ready, passing all compliance and configuration checks. All resources are tagged, encrypted, and managed according to AWS and Pulumi best practices.