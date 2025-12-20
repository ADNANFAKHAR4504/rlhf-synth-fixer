I'll create a comprehensive AWS CDK Python infrastructure that meets all your requirements. Here's the complete solution:

##  Project Structure

```bash
project-root/
 tap.py            # Entry point
 lib/
    tapstack.py   # Main stack definition
 requirements.txt  # Python dependencies
 cdk.json         # CDK configuration
```

##  Implementation

### 1. **tap.py** (Entry Point)

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from lib.tapstack import TapStack

app = cdk.App()

# Deploy the main stack in us-west-2
TapStack(
    app, 
    "TapStack",
    env=cdk.Environment(
        account=app.node.try_get_context("account"),
        region="us-west-2"
    ),
    description="High-availability, scalable AWS infrastructure with dual VPCs"
)

app.synth()
```

### 2. **lib/tapstack.py** (Main Stack Definition)

```python
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_autoscaling as autoscaling,
    aws_iam as iam,
    Tags,
    CfnOutput
)
from constructs import Construct
import json

class TapStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Common tags for all resources
        self.common_tags = {
            "Environment": "Production",
            "Owner": "DevOps-Team",
            "Project": "TapInfrastructure",
            "ManagedBy": "AWS-CDK"
        }
        
        # Apply common tags to the stack
        for key, value in self.common_tags.items():
            Tags.of(self).add(key, value)
        
        # Create VPCs
        self.vpc1 = self._create_vpc("VPC1", "10.0.0.0/16")
        self.vpc2 = self._create_vpc("VPC2", "10.1.0.0/16")
        
        # Create security groups
        self.alb_sg_vpc1 = self._create_alb_security_group(self.vpc1, "ALB-SG-VPC1")
        self.alb_sg_vpc2 = self._create_alb_security_group(self.vpc2, "ALB-SG-VPC2")
        
        self.ec2_sg_vpc1 = self._create_ec2_security_group(self.vpc1, "EC2-SG-VPC1", self.alb_sg_vpc1)
        self.ec2_sg_vpc2 = self._create_ec2_security_group(self.vpc2, "EC2-SG-VPC2", self.alb_sg_vpc2)
        
        # Create IAM role for EC2 instances
        self.ec2_role = self._create_ec2_role()
        
        # Create Application Load Balancers
        self.alb_vpc1 = self._create_alb(self.vpc1, self.alb_sg_vpc1, "ALB-VPC1")
        self.alb_vpc2 = self._create_alb(self.vpc2, self.alb_sg_vpc2, "ALB-VPC2")
        
        # Create Auto Scaling Groups
        self.asg_vpc1 = self._create_auto_scaling_group(
            self.vpc1, self.ec2_sg_vpc1, self.alb_vpc1, "ASG-VPC1"
        )
        self.asg_vpc2 = self._create_auto_scaling_group(
            self.vpc2, self.ec2_sg_vpc2, self.alb_vpc2, "ASG-VPC2"
        )
        
        # Create outputs
        self._create_outputs()
    
    def _create_vpc(self, name: str, cidr: str) -> ec2.Vpc:
        """Create a VPC with public and private subnets across multiple AZs"""
        vpc = ec2.Vpc(
            self, name,
            ip_addresses=ec2.IpAddresses.cidr(cidr),
            max_azs=2,  # Use 2 AZs for high availability
            subnet_configuration=[
                # Public subnets for ALB and NAT Gateways
                ec2.SubnetConfiguration(
                    name=f"{name}-Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                # Private subnets for EC2 instances
                ec2.SubnetConfiguration(
                    name=f"{name}-Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            nat_gateways=2,  # One NAT Gateway per AZ for high availability
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Tag the VPC
        Tags.of(vpc).add("Name", name)
        
        return vpc
    
    def _create_alb_security_group(self, vpc: ec2.Vpc, name: str) -> ec2.SecurityGroup:
        """Create security group for Application Load Balancer"""
        sg = ec2.SecurityGroup(
            self, name,
            vpc=vpc,
            description=f"Security group for {name}",
            allow_all_outbound=True
        )
        
        # Allow HTTP traffic from anywhere
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from anywhere"
        )
        
        # Allow HTTPS traffic from anywhere
        sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from anywhere"
        )
        
        Tags.of(sg).add("Name", name)
        return sg
    
    def _create_ec2_security_group(self, vpc: ec2.Vpc, name: str, alb_sg: ec2.SecurityGroup) -> ec2.SecurityGroup:
        """Create security group for EC2 instances"""
        sg = ec2.SecurityGroup(
            self, name,
            vpc=vpc,
            description=f"Security group for {name}",
            allow_all_outbound=True
        )
        
        # Allow HTTP traffic from ALB security group only
        sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(alb_sg.security_group_id),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB"
        )
        
        # Allow SSH from within VPC only (private access)
        sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(22),
            description="Allow SSH from within VPC"
        )
        
        Tags.of(sg).add("Name", name)
        return sg
    
    def _create_ec2_role(self) -> iam.Role:
        """Create IAM role for EC2 instances"""
        role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 instances in Auto Scaling Groups"
        )
        
        # Add SSM managed policy for Systems Manager access
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        
        # Add CloudWatch agent policy
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
        )
        
        Tags.of(role).add("Name", "EC2-AutoScaling-Role")
        return role
    
    def _create_alb(self, vpc: ec2.Vpc, security_group: ec2.SecurityGroup, name: str) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer"""
        alb = elbv2.ApplicationLoadBalancer(
            self, name,
            vpc=vpc,
            internet_facing=True,
            security_group=security_group,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        Tags.of(alb).add("Name", name)
        return alb
    
    def _create_auto_scaling_group(
        self, 
        vpc: ec2.Vpc, 
        security_group: ec2.SecurityGroup, 
        alb: elbv2.ApplicationLoadBalancer,
        name: str
    ) -> autoscaling.AutoScalingGroup:
        """Create Auto Scaling Group with EC2 instances"""
        
        # User data script to install and start a simple web server
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            f"echo '<h1>Hello from {name}</h1><p>Instance ID: ' > /var/www/html/index.html",
            "curl -s http://169.254.169.254/latest/meta-data/instance-id >> /var/www/html/index.html",
            "echo '</p>' >> /var/www/html/index.html"
        )
        
        # Launch template
        launch_template = ec2.LaunchTemplate(
            self, f"{name}-LaunchTemplate",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, 
                ec2.InstanceSize.MICRO
            ),
            machine_image=ec2.AmazonLinuxImage(
                generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2
            ),
            security_group=security_group,
            user_data=user_data,
            role=self.ec2_role
        )
        
        Tags.of(launch_template).add("Name", f"{name}-LaunchTemplate")
        
        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self, name,
            vpc=vpc,
            launch_template=launch_template,
            min_capacity=2,  # Minimum 2 instances as required
            max_capacity=6,  # Maximum 6 instances for scaling
            desired_capacity=2,  # Start with 2 instances
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            health_check=autoscaling.HealthCheck.elb(grace=300)
        )
        
        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"{name}-TargetGroup",
            vpc=vpc,
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval_seconds=30,
                path="/",
                timeout_seconds=5,
                unhealthy_threshold_count=3
            )
        )
        
        # Attach ASG to target group
        asg.attach_to_application_target_group(target_group)
        
        # Add listener to ALB
        alb.add_listener(
            f"{name}-Listener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        # Add scaling policies
        asg.scale_on_cpu_utilization(
            f"{name}-CPUScaling",
            target_utilization_percent=70,
            cooldown_seconds=300
        )
        
        Tags.of(asg).add("Name", name)
        Tags.of(target_group).add("Name", f"{name}-TargetGroup")
        
        return asg
    
    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "VPC1-ID",
            value=self.vpc1.vpc_id,
            description="VPC1 ID"
        )
        
        CfnOutput(
            self, "VPC2-ID",
            value=self.vpc2.vpc_id,
            description="VPC2 ID"
        )
        
        CfnOutput(
            self, "ALB1-DNS",
            value=self.alb_vpc1.load_balancer_dns_name,
            description="DNS name of ALB in VPC1"
        )
        
        CfnOutput(
            self, "ALB2-DNS",
            value=self.alb_vpc2.load_balancer_dns_name,
            description="DNS name of ALB in VPC2"
        )
        
        CfnOutput(
            self, "ALB1-URL",
            value=f"http://{self.alb_vpc1.load_balancer_dns_name}",
            description="URL for ALB in VPC1"
        )
        
        CfnOutput(
            self, "ALB2-URL",
            value=f"http://{self.alb_vpc2.load_balancer_dns_name}",
            description="URL for ALB in VPC2"
        )
```

### 3. **requirements.txt**

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### 4. **cdk.json**

```json
{
  "app": "python tap.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-s3:autoDeleteObjectsPolicy": true,
    "@aws-cdk/aws-ec2:vpnConnectionLogging": true,
    "@aws-cdk/aws-lambda:codeguruProfiler": true,
    "@aws-cdk/aws-opensearchservice:enforceHttps": true
  }
}
```

##  Deployment Instructions

### 1. **Setup Environment**

```bash
# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On macOS/Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install CDK CLI (if not already installed)
npm install -g aws-cdk
```

### 2. **Deploy Infrastructure**

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://YOUR-ACCOUNT-ID/us-west-2

# Synthesize CloudFormation template
cdk synth

# Preview changes
cdk diff

# Deploy the stack
cdk deploy

# Destroy the stack (when needed)
cdk destroy
```

##  Architecture Features

###  **Infrastructure Components**

1. **Two VPCs** with non-overlapping CIDR blocks:
   - VPC1: `10.0.0.0/16`
   - VPC2: `10.1.0.0/16`

2. **Subnets per VPC**:
   - 2 Public subnets (for ALBs and NAT Gateways)
   - 2 Private subnets (for EC2 instances)
   - Spans 2 Availability Zones

3. **Application Load Balancers**:
   - Internet-facing ALBs in public subnets
   - Health checks and target groups configured

4. **Auto Scaling Groups**:
   - Minimum 2 instances per VPC
   - CPU-based scaling (target: 70%)
   - Launch templates with user data

5. **Security Groups**:
   - ALB: HTTP/HTTPS from anywhere
   - EC2: HTTP from ALB only, SSH from VPC only

6. **IAM Roles**:
   - EC2 instances with SSM and CloudWatch permissions

###  **Security Best Practices**

- **Principle of Least Privilege**: Security groups restrict access appropriately
- **Private Subnets**: EC2 instances in private subnets with NAT Gateway access
- **SSH Access**: Limited to VPC CIDR blocks only
- **IAM Roles**: Minimal required permissions

###  **Monitoring & Management**

- **Health Checks**: ALB health checks for instance health
- **Auto Scaling**: CPU-based scaling policies
- **Tagging**: Comprehensive tagging strategy
- **CloudFormation Outputs**: Important resource information

###  **Extensibility**

The solution is designed to be modular and extensible:

- **Easy VPC Addition**: Create new VPC instances in the stack
- **Configurable Parameters**: CIDR blocks, instance types, scaling policies
- **Additional Services**: Can integrate RDS, ElastiCache, etc.
- **Multi-Environment**: Environment-specific configurations

##  Testing

After deployment, test the infrastructure:

```bash
# Get ALB DNS names from outputs
aws cloudformation describe-stacks --stack-name TapStack --query 'Stacks[0].Outputs'

# Test HTTP endpoints
curl http://ALB-DNS-NAME-FROM-OUTPUT

# Check Auto Scaling Groups
aws autoscaling describe-auto-scaling-groups --query 'AutoScalingGroups[*].[AutoScalingGroupName,DesiredCapacity,MinSize,MaxSize]'
```

This infrastructure provides a robust, scalable, and secure foundation that meets all your requirements while following AWS best practices! 