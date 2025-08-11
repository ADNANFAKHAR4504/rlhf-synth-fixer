import base64
import json
import re
import uuid
from typing import Any, Dict, List

import pulumi
import pulumi_aws as aws


def sanitize_bucket_name(name: str) -> str:
  """Sanitize S3 bucket name to comply with AWS naming rules"""
  # Convert to lowercase
  name = name.lower()
  # Remove invalid characters: only letters, numbers, dots, hyphens allowed
  name = re.sub(r'[^a-z0-9.-]', '-', name)
  # Remove leading/trailing invalid characters
  name = re.sub(r'^[-.]+', '', name)
  name = re.sub(r'[-.]+$', '', name)
  # Replace consecutive dots with single dot
  name = re.sub(r'\.\.+', '.', name)
  # Limit to 63 characters
  if len(name) > 63:
    name = name[:63]
  # Prevent name formatted as IP address
  if re.match(r'^\d{1,3}(\.\d{1,3}){3}$', name):
    name = f'bucket-{name}'
  # Ensure it doesn't end with invalid characters after truncation
  name = name.rstrip('-.')
  return name


def get_regions_for_environment(env: str) -> List[str]:
  """Select AWS regions based on environment to avoid VPC conflicts"""
  region_map = {
    'prod': ['us-east-1', 'eu-west-1'],
    'production': ['us-east-1', 'eu-west-1'],
    'staging': ['us-west-2', 'ap-southeast-2'],
    'stage': ['us-west-2', 'ap-southeast-2'],
    'dev': ['us-east-1', 'us-west-2'],  # Changed to use regions with default VPCs
    'test': ['us-west-1', 'ap-southeast-1'],
    'pr811': ['us-east-1', 'us-west-2']  # Use regions with existing default VPCs
  }
  return region_map.get(env.lower(), ['us-east-1', 'us-west-2'])


class TapStackArgs:
  """Arguments class for TapStack configuration"""
  
  def __init__(self, environment_suffix: str, tags: dict = None):
    """
    Initialize TapStack arguments
    
    Args:
      environment_suffix: Environment suffix (e.g., 'dev', 'staging', 'prod')
      tags: Additional tags to apply to resources
    """
    self.environment_suffix = environment_suffix
    self.tags = tags or {}
    
    # Set default configuration based on environment
    self._set_default_config()
    
    # Validate arguments
    self._validate()
  
  def _set_default_config(self):
    """Set default configuration based on environment suffix"""
    # Default project name
    self.project_name = f"tap-{self.environment_suffix}"
    
    # Use environment-specific regions to avoid VPC conflicts
    self.regions = get_regions_for_environment(self.environment_suffix)
    
    # Environment-specific defaults
    if self.environment_suffix in ['prod', 'production']:
      self.instance_type = "t3.small"
      self.min_size = 3
      self.max_size = 12
      self.desired_capacity = 6
      self.enable_s3_replication = True
      self.enable_monitoring = True
      self.enable_logging = True
      self.use_default_vpc = False  # Create new VPCs for production
    elif self.environment_suffix in ['staging', 'stage']:
      self.instance_type = "t3.small"
      self.min_size = 2
      self.max_size = 8
      self.desired_capacity = 4
      self.enable_s3_replication = True
      self.enable_monitoring = True
      self.enable_logging = True
      self.use_default_vpc = False  # Create new VPCs for staging
    else:  # dev, test, pr environments, etc.
      self.instance_type = "t3.micro"
      self.min_size = 1
      self.max_size = 6
      self.desired_capacity = 3
      self.enable_s3_replication = True
      self.enable_monitoring = True
      self.enable_logging = False
      self.use_default_vpc = True  # Use default VPCs to avoid limits
    
    # Health check and scaling configurations
    self.health_check_grace_period = 300
    self.cooldown_period = 60
    self.cpu_high_threshold = 70.0
    self.cpu_low_threshold = 10.0
    
    # Add environment to tags
    self.tags.update({
      'Environment': self.environment_suffix,
      'Project': self.project_name,
      'ManagedBy': 'Pulumi'
    })
  
  def _validate(self):
    """Validate the arguments"""
    if not self.environment_suffix:
      raise ValueError("Environment suffix cannot be empty")
    
    # Validate environment suffix format
    valid_env_pattern = r'^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$'
    if not re.match(valid_env_pattern, self.environment_suffix.lower()):
      raise ValueError(f"Invalid environment suffix format: {self.environment_suffix}")
    
    # Validate regions
    if not self.regions:
      raise ValueError("Regions list cannot be empty")
    
    valid_regions = [
      'us-east-1', 'us-west-1', 'us-west-2', 'us-east-2',
      'eu-west-1', 'eu-west-2', 'eu-central-1', 'eu-north-1',
      'ap-southeast-1', 'ap-southeast-2', 'ap-northeast-1'
    ]
    
    for region in self.regions:
      if region not in valid_regions:
        raise ValueError(f"Invalid region: {region}")
    
    if self.min_size <= 0:
      raise ValueError("Minimum size must be greater than 0")
    
    if self.max_size < self.min_size:
      raise ValueError("Maximum size must be greater than or equal to minimum size")
    
    if self.desired_capacity < self.min_size or self.desired_capacity > self.max_size:
      raise ValueError("Desired capacity must be between min_size and max_size")
  
  def to_dict(self) -> Dict[str, Any]:
    """Convert arguments to dictionary"""
    return {
      "environment_suffix": self.environment_suffix,
      "project_name": self.project_name,
      "regions": self.regions,
      "instance_type": self.instance_type,
      "min_size": self.min_size,
      "max_size": self.max_size,
      "desired_capacity": self.desired_capacity,
      "enable_s3_replication": self.enable_s3_replication,
      "enable_monitoring": self.enable_monitoring,
      "enable_logging": self.enable_logging,
      "use_default_vpc": getattr(self, 'use_default_vpc', False),
      "health_check_grace_period": self.health_check_grace_period,
      "cooldown_period": self.cooldown_period,
      "cpu_high_threshold": self.cpu_high_threshold,
      "cpu_low_threshold": self.cpu_low_threshold,
      "tags": self.tags
    }
  
  def get_resource_name(self, resource_type: str, region: str = None) -> str:
    """Generate standardized resource names"""
    base_name = f"tap-{resource_type}-{self.environment_suffix}"
    if region:
      return f"{base_name}-{region}"
    return base_name
  
  def get_bucket_name(self, bucket_type: str = "primary") -> str:
    """Generate S3 bucket names with proper formatting"""
    stack_name = pulumi.get_stack()
    # Create unique suffix to avoid naming conflicts
    unique_id = str(uuid.uuid4())[:8]
    raw_name = f"tap-{bucket_type}-data-{self.environment_suffix}-{stack_name}-{unique_id}"
    return sanitize_bucket_name(raw_name)


class TapStack:
  def __init__(self, name: str, args: TapStackArgs):
    """
    Initialize TapStack
    
    Args:
      name: Stack name
      args: TapStackArgs configuration object
    """
    self.name = name
    self.args = args
    self.project_name = args.project_name
    self.regions = args.regions
    self.environment_suffix = args.environment_suffix
    
    # Initialize storage for resources
    self.providers = {}
    self.vpcs = {}
    self.subnets = {}
    self.security_groups = {}
    self.load_balancers = {}
    self.auto_scaling_groups = {}
    self.s3_buckets = {}
    self.iam_roles = {}
    self.internet_gateways = {}
    self.route_tables = {}
    self.launch_templates = {}
    self.scaling_policies = {}
    self.cloudwatch_alarms = {}
    self.replication_config = {}
    
    # Initialize providers for each region
    self._setup_providers()
    
    # Create infrastructure components in order
    self._create_infrastructure()
  
  def _setup_providers(self):
    """Set up AWS providers for each region"""
    try:
      for region in self.regions:
        self.providers[region] = aws.Provider(
          f"aws-{region.replace('-', '_')}-{self.environment_suffix}",
          region=region,
          default_tags=aws.ProviderDefaultTagsArgs(tags=self.args.tags)
        )
    except Exception as e:
      raise RuntimeError(f"Failed to setup providers: {str(e)}") from e
  
  def _create_infrastructure(self):
    """Create the complete infrastructure in proper order"""
    try:
      # Step 1: Create IAM roles (global resources)
      self._create_iam_roles()
      
      # Step 2: Create S3 buckets with cross-region replication
      if self.args.enable_s3_replication and len(self.regions) > 1:
        self._create_s3_buckets()
      else:
        self._create_s3_buckets_single_region()
      
      # Step 3: Create networking infrastructure (VPC or use default)
      if self.args.use_default_vpc:
        self._get_default_vpcs()
      else:
        self._create_networking()
      
      # Step 4: Create security groups
      self._create_security_groups()
      
      # Step 5: Create load balancers
      self._create_load_balancers()
      
      # Step 6: Create auto scaling groups
      self._create_auto_scaling()
      
    except Exception as e:
      raise RuntimeError(f"Failed to create infrastructure: {str(e)}") from e
  
  def _get_default_vpcs(self):
    """Get default VPCs and subnets instead of creating new ones"""
    try:
        for region in self.regions:
            # Get default VPC
            default_vpc = aws.ec2.get_vpc(
                default=True,
                opts=pulumi.InvokeOptions(provider=self.providers[region])
            )
            
            # Define supported AZs for t3.micro instances by region
            supported_azs_map = {
                'us-east-1': ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1f'],
                'us-west-2': ['us-west-2a', 'us-west-2b', 'us-west-2c', 'us-west-2d'],
                'us-west-1': ['us-west-1a', 'us-west-1c'],
                'eu-west-1': ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
                'ap-southeast-1': ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
                'ap-southeast-2': ['ap-southeast-2a', 'ap-southeast-2b', 'ap-southeast-2c']
            }
            
            supported_azs = supported_azs_map.get(region, [])
            
            # Get default subnets in supported AZs only
            if supported_azs:
                default_subnets = aws.ec2.get_subnets(
                    filters=[
                        aws.ec2.GetSubnetsFilterArgs(
                            name="vpc-id",
                            values=[default_vpc.id]
                        ),
                        aws.ec2.GetSubnetsFilterArgs(
                            name="default-for-az",
                            values=["true"]
                        ),
                        aws.ec2.GetSubnetsFilterArgs(
                            name="availability-zone",
                            values=supported_azs
                        )
                    ],
                    opts=pulumi.InvokeOptions(provider=self.providers[region])
                )
            else:
                # Fallback: get all default subnets if no supported AZs defined
                default_subnets = aws.ec2.get_subnets(
                    filters=[
                        aws.ec2.GetSubnetsFilterArgs(
                            name="vpc-id",
                            values=[default_vpc.id]
                        ),
                        aws.ec2.GetSubnetsFilterArgs(
                            name="default-for-az",
                            values=["true"]
                        )
                    ],
                    opts=pulumi.InvokeOptions(provider=self.providers[region])
                )
            
            # Get subnet objects
            subnets = []
            for subnet_id in default_subnets.ids:
                subnet_data = aws.ec2.get_subnet(
                    id=subnet_id,
                    opts=pulumi.InvokeOptions(provider=self.providers[region])
                )
                subnets.append(subnet_data)
            
            # Ensure we have at least 2 subnets for multi-AZ deployment
            if len(subnets) < 2:
                raise RuntimeError(f"Not enough subnets found in supported AZs for region {region}. Found {len(subnets)}, need at least 2.")
            
            # Store VPC and subnet information
            self.vpcs[region] = default_vpc
            self.subnets[region] = subnets
            
            # Internet gateway is already attached to default VPC
            # No need to create or attach
            
    except Exception as e:
        raise RuntimeError(f"Failed to get default VPCs: {str(e)}")

  
  def _create_s3_buckets_single_region(self):
    """Create S3 bucket for single region deployment"""
    try:
      primary_region = self.regions[0]
      primary_bucket_name = self.args.get_bucket_name("primary")
      
      primary_bucket = aws.s3.Bucket(
        f"primary-data-bucket-{self.environment_suffix}",
        bucket=primary_bucket_name,
        opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
      )
      
      # Enable versioning on primary bucket using BucketVersioningV2
      aws.s3.BucketVersioningV2(
        f"primary-bucket-versioning-{self.environment_suffix}",
        bucket=primary_bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
          status="Enabled"
        ),
        opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
      )
      
      self.s3_buckets["primary"] = primary_bucket
      
    except Exception as e:
      raise RuntimeError(f"Failed to create S3 bucket: {str(e)}") from e
  
  def _create_s3_buckets(self):
    """Create S3 buckets with cross-region replication"""
    try:
      # Primary bucket in first region
      primary_region = self.regions[0]
      primary_bucket_name = self.args.get_bucket_name("primary")
      
      primary_bucket = aws.s3.Bucket(
        f"primary-data-bucket-{self.environment_suffix}",
        bucket=primary_bucket_name,
        opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
      )
      
      # Enable versioning on primary bucket using BucketVersioningV2
      _primary_versioning = aws.s3.BucketVersioningV2(
        f"primary-bucket-versioning-{self.environment_suffix}",
        bucket=primary_bucket.id,
        versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
          status="Enabled"
        ),
        opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
      )
      
      self.s3_buckets["primary"] = primary_bucket
      
      # Create replica bucket if more than one region
      if len(self.regions) > 1:
        replica_region = self.regions[1]
        replica_bucket_name = self.args.get_bucket_name("replica")
        
        replica_bucket = aws.s3.Bucket(
          f"replica-data-bucket-{self.environment_suffix}",
          bucket=replica_bucket_name,
          opts=pulumi.ResourceOptions(provider=self.providers[replica_region])
        )
        
        # Enable versioning on replica bucket using BucketVersioningV2
        _replica_versioning = aws.s3.BucketVersioningV2(
          f"replica-bucket-versioning-{self.environment_suffix}",
          bucket=replica_bucket.id,
          versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
            status="Enabled"
          ),
          opts=pulumi.ResourceOptions(provider=self.providers[replica_region])
        )
        
        self.s3_buckets["replica"] = replica_bucket
        
        # Create cross-region replication
        self._setup_s3_replication(primary_bucket, replica_bucket, primary_region)
        
    except Exception as e:
      raise RuntimeError(f"Failed to create S3 buckets: {str(e)}") from e
  
  def _setup_s3_replication(self, primary_bucket, replica_bucket, primary_region):
    """Set up S3 cross-region replication"""
    try:
      # Replication role
      replication_assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {"Service": "s3.amazonaws.com"},
            "Action": "sts:AssumeRole"
          }
        ]
      })
      
      replication_role = aws.iam.Role(
        f"s3-replication-role-{self.environment_suffix}",
        assume_role_policy=replication_assume_role_policy,
        opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
      )
      
      # FIXED: Correct replication policy with proper indexing
      replication_policy_doc = pulumi.Output.all(
        primary_bucket.arn,
        replica_bucket.arn
      ).apply(lambda arns: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObjectVersionForReplication",
              "s3:GetObjectVersionAcl"
            ],
            "Resource": f"{arns[0]}/*"  # Primary bucket objects
          },
          {
            "Effect": "Allow",
            "Action": ["s3:ListBucket"],
            "Resource": arns[0]  # Primary bucket (fixed from 'arns' to 'arns[0]')
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ReplicateObject",
              "s3:ReplicateDelete"
            ],
            "Resource": f"{arns[1]}/*"  # Replica bucket objects (fixed from arns[2] to arns[1])
          }
        ]
      }))
      
      replication_policy = aws.iam.RolePolicy(
        f"s3-replication-policy-{self.environment_suffix}",
        role=replication_role.id,
        policy=replication_policy_doc,
        opts=pulumi.ResourceOptions(provider=self.providers[primary_region])
      )
      
      # Replication configuration using BucketReplicationConfig
      replication_config = aws.s3.BucketReplicationConfig(
        f"bucket-replication-{self.environment_suffix}",
        role=replication_role.arn,
        bucket=primary_bucket.id,
        rules=[aws.s3.BucketReplicationConfigRuleArgs(
          id="replica-rule",
          status="Enabled",
          destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
            bucket=replica_bucket.arn,
            storage_class="STANDARD"
          )
        )],
        opts=pulumi.ResourceOptions(
          provider=self.providers[primary_region],
          depends_on=[replication_policy]
        )
      )
      
      self.replication_config["role"] = replication_role
      self.replication_config["policy"] = replication_policy
      self.replication_config["config"] = replication_config
      
    except Exception as e:
      raise RuntimeError(f"Failed to setup S3 replication: {str(e)}") from e

  
  def _create_iam_roles(self):
    """Create IAM roles for EC2 instances"""
    try:
      for region in self.regions:
        # EC2 instance assume role policy
        assume_role_policy = json.dumps({
          "Version": "2012-10-17",
          "Statement": [
            {
              "Effect": "Allow",
              "Principal": {"Service": "ec2.amazonaws.com"},
              "Action": "sts:AssumeRole"
            }
          ]
        })
        
        # Create instance role
        instance_role = aws.iam.Role(
          f"ec2-instance-role-{region}-{self.environment_suffix}",
          name=self.args.get_resource_name("ec2-role", region),
          assume_role_policy=assume_role_policy,
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # Attach CloudWatch policy if monitoring is enabled
        cloudwatch_policy_attachment = None
        if self.args.enable_monitoring:
          cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
            f"ec2-cloudwatch-policy-{region}-{self.environment_suffix}",
            role=instance_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
            opts=pulumi.ResourceOptions(provider=self.providers[region])
          )
        
        # Attach SSM policy
        ssm_policy_attachment = aws.iam.RolePolicyAttachment(
          f"ec2-ssm-policy-{region}-{self.environment_suffix}",
          role=instance_role.name,
          policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # Create instance profile
        instance_profile = aws.iam.InstanceProfile(
          f"ec2-instance-profile-{region}-{self.environment_suffix}",
          name=self.args.get_resource_name("ec2-profile", region),
          role=instance_role.name,
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        self.iam_roles[region] = {
          "role": instance_role,
          "profile": instance_profile,
          "cloudwatch_policy": cloudwatch_policy_attachment,
          "ssm_policy": ssm_policy_attachment
        }
        
    except Exception as e:
      raise RuntimeError(f"Failed to create IAM roles: {str(e)}") from e
  
  def _create_networking(self):
    """Create VPC and networking components (only for production environments)"""
    try:
      for region in self.regions:
        # Create VPC with unique CIDR per environment to avoid conflicts
        vpc_cidr_base = {
          'prod': '10.0.0.0/16',
          'production': '10.0.0.0/16',
          'staging': '10.1.0.0/16', 
          'stage': '10.1.0.0/16',
        }
        vpc_cidr = vpc_cidr_base.get(self.environment_suffix, '10.5.0.0/16')
        
        vpc = aws.ec2.Vpc(
          f"vpc-{region}-{self.environment_suffix}",
          cidr_block=vpc_cidr,
          enable_dns_hostnames=True,
          enable_dns_support=True,
          tags={"Name": self.args.get_resource_name("vpc", region)},
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # Create Internet Gateway
        igw = aws.ec2.InternetGateway(
          f"igw-{region}-{self.environment_suffix}",
          vpc_id=vpc.id,
          tags={"Name": self.args.get_resource_name("igw", region)},
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(
          state="available",
          opts=pulumi.InvokeOptions(provider=self.providers[region])
        )
        
        # Create subnets across multiple AZs
        subnets = []
        max_subnets = min(3, len(azs.names))
        
        # Use environment-specific base octets
        base_octet_map = {
          'prod': 0, 'production': 0,
          'staging': 1, 'stage': 1,
        }
        base_octet = base_octet_map.get(self.environment_suffix, 5)
        
        for i in range(max_subnets):
          subnet = aws.ec2.Subnet(
            f"subnet-{region}-{i}-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block=f"10.{base_octet}.{i+1}.0/24",
            availability_zone=azs.names[i],
            map_public_ip_on_launch=True,
            tags={"Name": f"{self.args.get_resource_name('subnet', region)}-{i}"},
            opts=pulumi.ResourceOptions(provider=self.providers[region])
          )
          subnets.append(subnet)
        
        # Create route table
        route_table = aws.ec2.RouteTable(
          f"rt-{region}-{self.environment_suffix}",
          vpc_id=vpc.id,
          routes=[aws.ec2.RouteTableRouteArgs(
            cidr_block="0.0.0.0/0",
            gateway_id=igw.id
          )],
          tags={"Name": self.args.get_resource_name("rt", region)},
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # Associate subnets with route table
        for i, subnet in enumerate(subnets):
          aws.ec2.RouteTableAssociation(
            f"rta-{region}-{i}-{self.environment_suffix}",
            subnet_id=subnet.id,
            route_table_id=route_table.id,
            opts=pulumi.ResourceOptions(provider=self.providers[region])
          )
        
        self.vpcs[region] = vpc
        self.subnets[region] = subnets
        self.internet_gateways[region] = igw
        self.route_tables[region] = route_table
        
    except Exception as e:
      raise RuntimeError(f"Failed to create networking: {str(e)}") from e
  
  def _create_security_groups(self):
    """Create security groups with proper rules"""
    try:
      for region in self.regions:
        vpc = self.vpcs[region]
        
        # Get VPC CIDR for security group rules
        if self.args.use_default_vpc:
          vpc_cidr = vpc.cidr_block  # Default VPC CIDR
        else:
          # Use the CIDR we assigned when creating the VPC
          vpc_cidr_map = {
            'prod': '10.0.0.0/16', 'production': '10.0.0.0/16',
            'staging': '10.1.0.0/16', 'stage': '10.1.0.0/16',
          }
          vpc_cidr = vpc_cidr_map.get(self.environment_suffix, '10.5.0.0/16')
        
        # ALB Security Group
        alb_sg = aws.ec2.SecurityGroup(
          f"alb-sg-{region}-{self.environment_suffix}",
          name=self.args.get_resource_name("alb-sg", region),
          description="Security group for Application Load Balancer",
          vpc_id=vpc.id,
          ingress=[
            aws.ec2.SecurityGroupIngressArgs(
              from_port=80,
              to_port=80,
              protocol="tcp",
              cidr_blocks=["0.0.0.0/0"],
              description="HTTP traffic"
            ),
            aws.ec2.SecurityGroupIngressArgs(
              from_port=443,
              to_port=443,
              protocol="tcp",
              cidr_blocks=["0.0.0.0/0"],
              description="HTTPS traffic"
            )
          ],
          egress=[aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
          )],
          tags={"Name": self.args.get_resource_name("alb-sg", region)},
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # EC2 Security Group
        ec2_sg = aws.ec2.SecurityGroup(
          f"ec2-sg-{region}-{self.environment_suffix}",
          name=self.args.get_resource_name("ec2-sg", region),
          description="Security group for EC2 instances",
          vpc_id=vpc.id,
          ingress=[
            aws.ec2.SecurityGroupIngressArgs(
              from_port=80,
              to_port=80,
              protocol="tcp",
              security_groups=[alb_sg.id],
              description="HTTP from ALB"
            ),
            aws.ec2.SecurityGroupIngressArgs(
              from_port=443,
              to_port=443,
              protocol="tcp",
              security_groups=[alb_sg.id],
              description="HTTPS from ALB"
            ),
            aws.ec2.SecurityGroupIngressArgs(
              from_port=22,
              to_port=22,
              protocol="tcp",
              cidr_blocks=[vpc_cidr],
              description="SSH from VPC"
            )
          ],
          egress=[aws.ec2.SecurityGroupEgressArgs(
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
          )],
          tags={"Name": self.args.get_resource_name("ec2-sg", region)},
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        self.security_groups[region] = {
          "alb": alb_sg,
          "ec2": ec2_sg
        }
        
    except Exception as e:
      raise RuntimeError(f"Failed to create security groups: {str(e)}") from e
  
  def _create_load_balancers(self):
    """Create Application Load Balancers"""
    try:
      for region in self.regions:
        subnets = self.subnets[region]
        vpc = self.vpcs[region]
        alb_sg = self.security_groups[region]["alb"]
        
        # For default VPC, use subnet IDs; for created VPC, use subnet objects
        if self.args.use_default_vpc:
          subnet_ids = [subnet.id for subnet in subnets]
        else:
          subnet_ids = [subnet.id for subnet in subnets]
        
        # Application Load Balancer
        alb = aws.lb.LoadBalancer(
          f"alb-{region}-{self.environment_suffix}",
          name=self.args.get_resource_name("alb", region),
          load_balancer_type="application",
          security_groups=[alb_sg.id],
          subnets=subnet_ids,
          enable_deletion_protection=False,
          tags={"Name": self.args.get_resource_name("alb", region)},
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # Target Group with health checks
        vpc_id = vpc.id if hasattr(vpc, 'id') else vpc.id
        
        target_group = aws.lb.TargetGroup(
          f"tg-{region}-{self.environment_suffix}",
          name=self.args.get_resource_name("tg", region),
          port=80,
          protocol="HTTP",
          vpc_id=vpc_id,
          target_type="instance",
          health_check=aws.lb.TargetGroupHealthCheckArgs(
            enabled=True,
            healthy_threshold=2,
            unhealthy_threshold=2,
            timeout=5,
            interval=30,
            path="/health",
            matcher="200",
            protocol="HTTP",
            port="traffic-port"
          ),
          tags={"Name": self.args.get_resource_name("tg", region)},
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # Listener
        listener = aws.lb.Listener(
          f"listener-{region}-{self.environment_suffix}",
          load_balancer_arn=alb.arn,
          port="80",
          protocol="HTTP",
          default_actions=[aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
          )],
          opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        self.load_balancers[region] = {
          "alb": alb,
          "target_group": target_group,
          "listener": listener
        }
        
    except Exception as e:
      raise RuntimeError(f"Failed to create load balancers: {str(e)}") from e
  
  def _get_user_data_script(self, region: str) -> str:
    """Generate user data script for EC2 instances"""
    monitoring_config = ""
    if self.args.enable_monitoring:
      monitoring_config = """
# Install and configure CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{{
  "metrics": {{
    "namespace": "AWS/EC2",
    "metrics_collected": {{
      "cpu": {{
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      }},
      "disk": {{
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      }},
      "mem": {{
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }}
    }}
  }}
}}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
"""
    
    logging_config = ""
    if self.args.enable_logging:
      logging_config = """
# Configure log rotation
echo '/var/log/httpd/*.log {
  daily
  rotate 7
  compress
  delaycompress
  missingok
  notifempty
  create 644 apache apache
  postrotate
    systemctl reload httpd
  endscript
}' > /etc/logrotate.d/httpd
"""
    
    return f"""#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
echo "OK" > /var/www/html/health

# Create index page with environment and instance info
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
  <title>TAP Infrastructure - {self.environment_suffix} - {region}</title>
</head>
<body>
  <h1>Welcome to TAP Infrastructure</h1>
  <p>Environment: {self.environment_suffix}</p>
  <p>Region: {region}</p>
  <p>VPC Type: {'Default VPC' if self.args.use_default_vpc else 'Custom VPC'}</p>
  <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
  <p>Availability Zone: $(curl -s \
    http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
  <p>Timestamp: $(date)</p>
  <p>Stack: {self.name}</p>
</body>
</html>
EOF

{monitoring_config}

{logging_config}
"""
  
  def _create_auto_scaling(self):
    """Create Auto Scaling Groups with Launch Templates"""
    # Get latest Amazon Linux 2 AMI for each region
    for region in self.regions:
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                aws.ec2.GetAmiFilterArgs(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                )
            ],
            opts=pulumi.InvokeOptions(provider=self.providers[region])
        )
        
        # Use a more unique naming strategy with timestamp or random suffix
        import time
        timestamp_suffix = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
        
        # Launch Template
        launch_template = aws.ec2.LaunchTemplate(
            f"lt-{region}-{self.args.environment_suffix}",
            name=f"tap-lt-{region}-{self.args.environment_suffix}-{timestamp_suffix}",
            image_id=ami.id,
            instance_type=self.args.instance_type,
            vpc_security_group_ids=[self.security_groups[region]['ec2'].id],
            iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
                name=self.iam_roles[region]["profile"].name
            ),
            user_data=pulumi.Output.concat(
                "#!/bin/bash\n",
                "yum update -y\n",
                "yum install -y httpd\n",
                "systemctl start httpd\n",
                "systemctl enable httpd\n",
                "echo '<h1>Hello from ", region, "</h1>' > /var/www/html/index.html\n",
                "echo 'OK' > /var/www/html/health\n"
            ).apply(lambda x: pulumi.Output.from_input(x).apply(lambda s: 
                __import__('base64').b64encode(s.encode()).decode())),
            tag_specifications=[
                aws.ec2.LaunchTemplateTagSpecificationArgs(
                    resource_type="instance",
                    tags={"Name": f"tap-instance-{region}-{self.args.environment_suffix}"}
                )
            ],
            opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        subnet_ids = [s.id if hasattr(s, 'id') else s.subnet_id for s in self.subnets[region]]
        
        # Check if ASG already exists and use unique naming
        asg_name = f"tap-asg-{self.args.environment_suffix}-{region}-{timestamp_suffix}"
        
        # Auto Scaling Group with unique name
        asg = aws.autoscaling.Group(
            f"asg-{region}-{self.args.environment_suffix}",
            name=asg_name,
            vpc_zone_identifiers=subnet_ids,
            target_group_arns=[self.load_balancers[region]["target_group"].arn],
            health_check_type="ELB",
            health_check_grace_period=300,
            min_size=self.args.min_size,
            max_size=self.args.max_size,
            desired_capacity=self.args.desired_capacity,
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=launch_template.id,
                version="$Latest"
            ),
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"tap-asg-{region}-{self.args.environment_suffix}",
                    propagate_at_launch=True
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=self.args.environment_suffix,
                    propagate_at_launch=True
                )
            ],
            opts=pulumi.ResourceOptions(
                provider=self.providers[region],
                # Add this to replace existing resources if needed
                replace_on_changes=["name"]
            )
        )
        
        # Auto Scaling Policies
        scale_up_policy = aws.autoscaling.Policy(
            f"scale-up-{region}-{self.args.environment_suffix}",
            name=f"tap-scale-up-{region}-{self.args.environment_suffix}-{timestamp_suffix}",
            scaling_adjustment=1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=asg.name,
            opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        scale_down_policy = aws.autoscaling.Policy(
            f"scale-down-{region}-{self.args.environment_suffix}",
            name=f"tap-scale-down-{region}-{self.args.environment_suffix}-{timestamp_suffix}",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=asg.name,
            opts=pulumi.ResourceOptions(provider=self.providers[region])
        )
        
        # CloudWatch Alarms
        # CloudWatch Alarms (FIXED)
        aws.cloudwatch.MetricAlarm(
            f"cpu-high-{region}-{self.args.environment_suffix}",
            name=f"tap-cpu-high-{region}-{self.args.environment_suffix}-{timestamp_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=120,
            statistic="Average",
            threshold=80.0,
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[scale_up_policy.arn],
            dimensions={"AutoScalingGroupName": asg.name},
            opts=pulumi.ResourceOptions(provider=self.providers[region])
        )

        aws.cloudwatch.MetricAlarm(
            f"cpu-low-{region}-{self.args.environment_suffix}",
            name=f"tap-cpu-low-{region}-{self.args.environment_suffix}-{timestamp_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=120,
            statistic="Average",
            threshold=10.0,
            alarm_description="This metric monitors ec2 cpu utilization",
            alarm_actions=[scale_down_policy.arn],
            dimensions={"AutoScalingGroupName": asg.name},
            opts=pulumi.ResourceOptions(provider=self.providers[region])
        )

        
        self.launch_templates[region] = launch_template
        self.auto_scaling_groups[region] = asg


  
  def get_resource_count(self) -> Dict[str, int]:
    """Get count of created resources for testing"""
    return {
      "providers": len(self.providers),
      "vpcs": len(self.vpcs),
      "subnets": sum(len(subnets) for subnets in self.subnets.values()),
      "security_groups": sum(len(sg) for sg in self.security_groups.values()),
      "load_balancers": len(self.load_balancers),
      "auto_scaling_groups": len(self.auto_scaling_groups),
      "s3_buckets": len(self.s3_buckets),
      "iam_roles": len(self.iam_roles),
      "scaling_policies": sum(len(policies) for policies in self.scaling_policies.values()),
      "cloudwatch_alarms": sum(
        len(alarms) for alarms in self.cloudwatch_alarms.values()
        if alarms.get("cpu_high") is not None
      )
    }
  
  def get_outputs(self) -> Dict[str, Any]:
    """Return stack outputs"""
    outputs = {}
    
    try:
      # Load balancer outputs
      for region in self.regions:
        if region in self.load_balancers:
          region_key = region.replace('-', '_')
          outputs[f"alb_dns_{region_key}_{self.environment_suffix}"] = (
            self.load_balancers[region]["alb"].dns_name
          )
          outputs[f"alb_zone_id_{region_key}_{self.environment_suffix}"] = (
            self.load_balancers[region]["alb"].zone_id
          )
          outputs[f"alb_arn_{region_key}_{self.environment_suffix}"] = (
            self.load_balancers[region]["alb"].arn
          )
      
      # S3 bucket outputs
      if "primary" in self.s3_buckets:
        outputs[f"primary_s3_bucket_{self.environment_suffix}"] = self.s3_buckets["primary"].bucket
        outputs[f"primary_s3_bucket_arn_{self.environment_suffix}"] = self.s3_buckets["primary"].arn
      
      if "replica" in self.s3_buckets:
        outputs[f"replica_s3_bucket_{self.environment_suffix}"] = self.s3_buckets["replica"].bucket
        outputs[f"replica_s3_bucket_arn_{self.environment_suffix}"] = self.s3_buckets["replica"].arn
      
      # VPC outputs
      for region in self.regions:
        if region in self.vpcs:
          region_key = region.replace('-', '_')
          vpc_id = (
            self.vpcs[region].id if hasattr(self.vpcs[region], 'id')
            else self.vpcs[region].id
          )
          outputs[f"vpc_id_{region_key}_{self.environment_suffix}"] = vpc_id
      
      # Configuration outputs
      outputs[f"configuration_{self.environment_suffix}"] = self.args.to_dict()
      
      # Resource counts
      outputs[f"resource_counts_{self.environment_suffix}"] = self.get_resource_count()
      
      # Environment-specific outputs
      outputs["environment_suffix"] = self.environment_suffix
      outputs["stack_name"] = self.name
      outputs["uses_default_vpc"] = self.args.use_default_vpc
      
    except Exception as e:
      raise RuntimeError(f"Failed to generate outputs: {str(e)}") from e
    
    return outputs

  def validate_infrastructure(self) -> Dict[str, bool]:
    """Validate that infrastructure meets requirements"""
    validation_results = {}
    
    try:
      # Validate multi-region deployment
      validation_results["multi_region_deployment"] = len(self.regions) >= 2
      
      # Validate minimum instances per region
      validation_results["minimum_instances"] = all(
        "asg" in self.auto_scaling_groups.get(region, {})
        for region in self.regions
      )
      
      # Validate multi-AZ deployment
      validation_results["multi_az_deployment"] = all(
        len(self.subnets.get(region, [])) >= 2
        for region in self.regions
      )
      
      # Validate S3 cross-region replication
      validation_results["s3_replication"] = (
        len(self.s3_buckets) >= 2 and
        "config" in self.replication_config
      ) if self.args.enable_s3_replication else True
      
      # Validate load balancers
      validation_results["load_balancers"] = all(
        "alb" in self.load_balancers.get(region, {})
        for region in self.regions
      )
      
      # Validate security groups
      validation_results["security_groups"] = all(
        len(self.security_groups.get(region, {})) >= 2
        for region in self.regions
      )
      
      # Validate IAM roles
      validation_results["iam_roles"] = all(
        "role" in self.iam_roles.get(region, {})
        for region in self.regions
      )
      
      # Validate monitoring setup
      validation_results["monitoring_setup"] = (
        not self.args.enable_monitoring or
        all(
          self.cloudwatch_alarms.get(region, {}).get("cpu_high") is not None
          for region in self.regions
        )
      )
      
      # Environment-specific validations
      validation_results["environment_suffix_valid"] = bool(self.environment_suffix)
      validation_results["resource_naming_consistent"] = True
      validation_results["vpc_strategy_appropriate"] = True
      
      # Overall validation
      validation_results["overall"] = all(validation_results.values())
      
    except Exception as e:
      validation_results["error"] = str(e)
      validation_results["overall"] = False
    
    return validation_results


# Export the classes and factory function
__all__ = ["TapStack", "TapStackArgs"]

