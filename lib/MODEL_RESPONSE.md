I'll fix the script to properly use the region configuration and provide a complete solution. Here's the corrected Pulumi Python script and the AWS CLI cleanup script:

## 📝 Complete Pulumi Python Script

```python
"""
Automated Cloud Environment Setup on AWS using Pulumi
This script creates a secure, production-ready AWS infrastructure
with VPC, EC2, S3, and IAM resources following best practices.
"""

import pulumi
import pulumi_aws as aws
import json

# Configuration - Set the target region
config = pulumi.Config()
region = config.get("region") or "us-west-2"

# Configure the AWS provider to use the specified region
aws_provider = aws.Provider("aws-provider", region=region)

# Common tags for all resources
common_tags = {
    "Environment": "Production",
    "Owner": "DevOps",
    "Compliance": "PCI-DSS",
    "ManagedBy": "Pulumi"
}

# Get current AWS region and account ID for resource naming
current = aws.get_caller_identity()
aws_region = aws.get_region()

# =============================================================================
# VPC and Network Infrastructure
# =============================================================================

# Create VPC
vpc = aws.ec2.Vpc(
    "prod-main-vpc",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        **common_tags,
        "Name": "prod-main-vpc"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create Internet Gateway
igw = aws.ec2.InternetGateway(
    "prod-main-igw",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": "prod-main-igw"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Get availability zones
azs = aws.get_availability_zones(state="available", opts=pulumi.InvokeOptions(provider=aws_provider))

# Create public subnet
public_subnet = aws.ec2.Subnet(
    "prod-public-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=True,
    tags={
        **common_tags,
        "Name": "prod-public-subnet-1",
        "Type": "Public"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create private subnet
private_subnet = aws.ec2.Subnet(
    "prod-private-subnet-1",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=azs.names[1] if len(azs.names) > 1 else azs.names[0],
    tags={
        **common_tags,
        "Name": "prod-private-subnet-1",
        "Type": "Private"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create NAT Gateway for private subnet internet access
nat_eip = aws.ec2.Eip(
    "prod-nat-eip",
    domain="vpc",
    tags={
        **common_tags,
        "Name": "prod-nat-eip"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider, depends_on=[igw])
)

nat_gateway = aws.ec2.NatGateway(
    "prod-nat-gateway",
    allocation_id=nat_eip.id,
    subnet_id=public_subnet.id,
    tags={
        **common_tags,
        "Name": "prod-nat-gateway"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create route tables
public_route_table = aws.ec2.RouteTable(
    "prod-public-rt",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": "prod-public-rt"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

private_route_table = aws.ec2.RouteTable(
    "prod-private-rt",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": "prod-private-rt"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create routes
public_route = aws.ec2.Route(
    "prod-public-route",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

private_route = aws.ec2.Route(
    "prod-private-route",
    route_table_id=private_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Associate route tables with subnets
public_route_table_association = aws.ec2.RouteTableAssociation(
    "prod-public-rta",
    subnet_id=public_subnet.id,
    route_table_id=public_route_table.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

private_route_table_association = aws.ec2.RouteTableAssociation(
    "prod-private-rta",
    subnet_id=private_subnet.id,
    route_table_id=private_route_table.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# Security Groups
# =============================================================================

# Security group for web servers (public instances)
web_security_group = aws.ec2.SecurityGroup(
    "prod-web-server-sg",
    name="prod-web-server-sg",
    description="Security group for production web servers",
    vpc_id=vpc.id,
    ingress=[
        # SSH access only from specified IP
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            cidr_blocks=["203.0.113.42/32"],
            description="SSH access from authorized IP"
        ),
        # HTTP access from anywhere
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTP access"
        ),
        # HTTPS access from anywhere
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=443,
            to_port=443,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTPS access"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="All outbound traffic"
        )
    ],
    tags={
        **common_tags,
        "Name": "prod-web-server-sg"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Security group for private instances
private_security_group = aws.ec2.SecurityGroup(
    "prod-private-server-sg",
    name="prod-private-server-sg",
    description="Security group for production private servers",
    vpc_id=vpc.id,
    ingress=[
        # SSH access only from specified IP
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            cidr_blocks=["203.0.113.42/32"],
            description="SSH access from authorized IP"
        ),
        # Internal communication from VPC
        aws.ec2.SecurityGroupIngressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["10.0.0.0/16"],
            description="Internal VPC communication"
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="All outbound traffic"
        )
    ],
    tags={
        **common_tags,
        "Name": "prod-private-server-sg"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# IAM Roles and Policies
# =============================================================================

# IAM role for EC2 instances
ec2_assume_role_policy = json.dumps({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            }
        }
    ]
})

ec2_role = aws.iam.Role(
    "prod-ec2-role",
    name="prod-ec2-role",
    assume_role_policy=ec2_assume_role_policy,
    description="IAM role for production EC2 instances",
    tags=common_tags,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Custom policy for EC2 instances (minimal permissions)
ec2_policy_document = json.dumps({
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::prod-app-data-bucket-*",
                "arn:aws:s3:::prod-app-data-bucket-*/*"
            ]
        },
        {
            "Effect": "Allow",
            "Action": [
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            "Resource": "arn:aws:logs:*:*:*"
        }
    ]
})

ec2_policy = aws.iam.Policy(
    "prod-ec2-policy",
    name="prod-ec2-policy",
    description="Custom policy for production EC2 instances",
    policy=ec2_policy_document,
    tags=common_tags,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Attach policy to role
ec2_role_policy_attachment = aws.iam.RolePolicyAttachment(
    "prod-ec2-role-policy-attachment",
    role=ec2_role.name,
    policy_arn=ec2_policy.arn,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create instance profile
ec2_instance_profile = aws.iam.InstanceProfile(
    "prod-ec2-instance-profile",
    name="prod-ec2-instance-profile",
    role=ec2_role.name,
    tags=common_tags,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# S3 Bucket
# =============================================================================

# Create S3 bucket with versioning enabled
s3_bucket = aws.s3.Bucket(
    "prod-app-data-bucket",
    bucket=None,  # Let AWS generate a unique name
    tags={
        **common_tags,
        "Name": "prod-app-data-bucket"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Enable versioning on the S3 bucket
s3_bucket_versioning = aws.s3.BucketVersioningV2(
    "prod-app-data-bucket-versioning",
    bucket=s3_bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
    ),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Block public access to the S3 bucket
s3_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    "prod-app-data-bucket-pab",
    bucket=s3_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# EC2 Instances
# =============================================================================

# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"]
        )
    ],
    opts=pulumi.InvokeOptions(provider=aws_provider)
)

# User data script for automatic application deployment
user_data_script = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple Hello World page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Production Web Server</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }
        .container { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .info { background-color: #e7f3ff; padding: 10px; border-left: 4px solid #2196F3; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Hello, World!</h1>
        <p>Welcome to the Production Web Server</p>
        <div class="info">
            <strong>Server Information:</strong><br>
            Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)<br>
            Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)<br>
            Instance Type: $(curl -s http://169.254.169.254/latest/meta-data/instance-type)<br>
            Deployment Time: $(date)
        </div>
        <p><em>This server was automatically configured using Pulumi!</em></p>
    </div>
</body>
</html>
EOF

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
"""

# Create EC2 instance in public subnet (web server)
web_server = aws.ec2.Instance(
    "prod-web-server-01",
    instance_type="t3.micro",
    ami=ami.id,
    subnet_id=public_subnet.id,
    vpc_security_group_ids=[web_security_group.id],
    iam_instance_profile=ec2_instance_profile.name,
    user_data=user_data_script,
    associate_public_ip_address=True,
    tags={
        **common_tags,
        "Name": "prod-web-server-01",
        "Role": "WebServer"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create EC2 instance in private subnet
app_server = aws.ec2.Instance(
    "prod-app-server-01",
    instance_type="t3.micro",
    ami=ami.id,
    subnet_id=private_subnet.id,
    vpc_security_group_ids=[private_security_group.id],
    iam_instance_profile=ec2_instance_profile.name,
    user_data="""#!/bin/bash
yum update -y
yum install -y htop wget curl
echo "Private application server configured successfully" > /home/ec2-user/deployment.log
""",
    tags={
        **common_tags,
        "Name": "prod-app-server-01",
        "Role": "ApplicationServer"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# Outputs
# =============================================================================

# Export important resource information
pulumi.export("vpc_id", vpc.id)
pulumi.export("public_subnet_id", public_subnet.id)
pulumi.export("private_subnet_id", private_subnet.id)
pulumi.export("web_server_public_ip", web_server.public_ip)
pulumi.export("web_server_private_ip", web_server.private_ip)
pulumi.export("app_server_private_ip", app_server.private_ip)
pulumi.export("s3_bucket_name", s3_bucket.bucket)
pulumi.export("web_server_url", web_server.public_ip.apply(lambda ip: f"http://{ip}"))
pulumi.export("region", region)

# Export security group IDs for reference
pulumi.export("web_security_group_id", web_security_group.id)
pulumi.export("private_security_group_id", private_security_group.id)

print("✅ AWS infrastructure deployment completed successfully!")
print("🌐 Access your web server at the URL shown in the outputs")
print("🔒 SSH access is restricted to IP: 203.0.113.42")
print("📦 S3 bucket created with versioning enabled")
print("🏷️  All resources tagged according to compliance requirements")
```

## 🧹 AWS CLI Cleanup Script

Here's a bash script to remove all the created resources using AWS CLI:

```bash
#!/bin/bash

# AWS CLI Cleanup Script for Pulumi-created Resources
# This script removes all resources created by the Pulumi deployment

set -e  # Exit on any error

echo "🧹 Starting AWS resource cleanup..."
echo "⚠️  WARNING: This will delete all production resources!"
read -p "Are you sure you want to continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 1
fi

# Set the region
REGION="us-west-2"
echo "🌍 Using region: $REGION"

# Function to check if resource exists
resource_exists() {
    local resource_type=$1
    local resource_id=$2
    local check_command=$3

    if eval $check_command >/dev/null 2>&1; then
        echo "✅ Found $resource_type: $resource_id"
        return 0
    else
        echo "❌ $resource_type not found: $resource_id"
        return 1
    fi
}

# Function to wait for resource deletion
wait_for_deletion() {
    local resource_type=$1
    local resource_id=$2
    local check_command=$3
    local max_attempts=30
    local attempt=1

    echo "⏳ Waiting for $resource_type deletion: $resource_id"
    while [ $attempt -le $max_attempts ]; do
        if ! eval $check_command >/dev/null 2>&1; then
            echo "✅ $resource_type deleted successfully"
            return 0
        fi
        echo "   Attempt $attempt/$max_attempts - still exists..."
        sleep 10
        ((attempt++))
    done
    echo "⚠️  Warning: $resource_type may still exist after timeout"
}

echo ""
echo "🔍 Step 1: Discovering resources..."

# Get VPC ID
VPC_ID=$(aws ec2 describe-vpcs --region $REGION --filters "Name=tag:Name,Values=prod-main-vpc" --query 'Vpcs[0].VpcId' --output text 2>/dev/null || echo "None")

if [ "$VPC_ID" = "None" ] || [ "$VPC_ID" = "null" ]; then
    echo "❌ No VPC found with name 'prod-main-vpc'. Resources may already be deleted."
    exit 0
fi

echo "📍 Found VPC: $VPC_ID"

# Get resource IDs
echo "🔍 Discovering EC2 instances..."
WEB_INSTANCE_ID=$(aws ec2 describe-instances --region $REGION --filters "Name=tag:Name,Values=prod-web-server-01" "Name=instance-state-name,Values=running,stopped,stopping" --query 'Reservations[0].Instances[0].InstanceId' --output text 2>/dev/null || echo "None")
APP_INSTANCE_ID=$(aws ec2 describe-instances --region $REGION --filters "Name=tag:Name,Values=prod-app-server-01" "Name=instance-state-name,Values=running,stopped,stopping" --query 'Reservations[0].Instances[0].InstanceId' --output text 2>/dev/null || echo "None")

echo "🔍 Discovering S3 bucket..."
S3_BUCKET=$(aws s3api list-buckets --region $REGION --query 'Buckets[?contains(Name, `prod-app-data-bucket`)].Name' --output text 2>/dev/null || echo "None")

echo "🔍 Discovering NAT Gateway..."
NAT_GW_ID=$(aws ec2 describe-nat-gateways --region $REGION --filter "Name=vpc-id,Values=$VPC_ID" --query 'NatGateways[0].NatGatewayId' --output text 2>/dev/null || echo "None")

echo "🔍 Discovering Internet Gateway..."
IGW_ID=$(aws ec2 describe-internet-gateways --region $REGION --filters "Name=attachment.vpc-id,Values=$VPC_ID" --query 'InternetGateways[0].InternetGatewayId' --output text 2>/dev/null || echo "None")

echo ""
echo "🗑️  Step 2: Terminating EC2 instances..."

# Terminate EC2 instances
if [ "$WEB_INSTANCE_ID" != "None" ] && [ "$WEB_INSTANCE_ID" != "null" ]; then
    echo "🔥 Terminating web server instance: $WEB_INSTANCE_ID"
    aws ec2 terminate-instances --region $REGION --instance-ids $WEB_INSTANCE_ID
fi

if [ "$APP_INSTANCE_ID" != "None" ] && [ "$APP_INSTANCE_ID" != "null" ]; then
    echo "🔥 Terminating app server instance: $APP_INSTANCE_ID"
    aws ec2 terminate-instances --region $REGION --instance-ids $APP_INSTANCE_ID
fi

# Wait for instances to terminate
if [ "$WEB_INSTANCE_ID" != "None" ] && [ "$WEB_INSTANCE_ID" != "null" ]; then
    echo "⏳ Waiting for web server termination..."
    aws ec2 wait instance-terminated --region $REGION --instance-ids $WEB_INSTANCE_ID
fi

if [ "$APP_INSTANCE_ID" != "None" ] && [ "$APP_INSTANCE_ID" != "null" ]; then
    echo "⏳ Waiting for app server termination..."
    aws ec2 wait instance-terminated --region $REGION --instance-ids $APP_INSTANCE_ID
fi

echo ""
echo "🗑️  Step 3: Cleaning up S3 bucket..."

# Empty and delete S3 bucket
if [ "$S3_BUCKET" != "None" ] && [ "$S3_BUCKET" != "null" ] && [ -n "$S3_BUCKET" ]; then
    echo "🗑️  Emptying S3 bucket: $S3_BUCKET"
    aws s3 rm s3://$S3_BUCKET --recursive --region $REGION 2>/dev/null || true

    echo "🗑️  Deleting S3 bucket versions..."
    aws s3api list-object-versions --bucket $S3_BUCKET --region $REGION --query 'Versions[].{Key:Key,VersionId:VersionId}' --output text | while read key version; do
        if [ -n "$key" ] && [ -n "$version" ]; then
            aws s3api delete-object --bucket $S3_BUCKET --key "$key" --version-id "$version" --region $REGION 2>/dev/null || true
        fi
    done

    echo "🗑️  Deleting S3 bucket delete markers..."
    aws s3api list-object-versions --bucket $S3_BUCKET --region $REGION --query 'DeleteMarkers[].{Key:Key,VersionId:VersionId}' --output text | while read key version; do
        if [ -n "$key" ] && [ -n "$version" ]; then
            aws s3api delete-object --bucket $S3_BUCKET --key "$key" --version-id "$version" --region $REGION 2>/dev/null || true
        fi
    done

    echo "🗑️  Deleting S3 bucket: $S3_BUCKET"
    aws s3api delete-bucket --bucket $S3_BUCKET --region $REGION 2>/dev/null || true
fi

echo ""
echo "🗑️  Step 4: Deleting NAT Gateway..."

# Delete NAT Gateway
if [ "$NAT_GW_ID" != "None" ] && [ "$NAT_GW_ID" != "null" ]; then
    echo "🗑️  Deleting NAT Gateway: $NAT_GW_ID"
    aws ec2 delete-nat-gateway --region $REGION --nat-gateway-id $NAT_GW_ID

    # Wait for NAT Gateway deletion
    echo "⏳ Waiting for NAT Gateway deletion..."
    while aws ec2 describe-nat-gateways --region $REGION --nat-gateway-ids $NAT_GW_ID --query 'NatGateways[0].State' --output text 2>/dev/null | grep -v "deleted" >/dev/null; do
        echo "   NAT Gateway still deleting..."
        sleep 15
    done
fi

echo ""
echo "🗑️  Step 5: Cleaning up network resources..."

# Delete security groups (except default)
echo "🗑️  Deleting security groups..."
aws ec2 describe-security-groups --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'SecurityGroups[?GroupName!=`default`].GroupId' --output text | tr '\t' '\n' | while read sg_id; do
    if [ -n "$sg_id" ]; then
        echo "🗑️  Deleting security group: $sg_id"
        aws ec2 delete-security-group --region $REGION --group-id $sg_id 2>/dev/null || echo "   Failed to delete $sg_id (may have dependencies)"
    fi
done

# Delete route table associations and routes
echo "🗑️  Cleaning up route tables..."
aws ec2 describe-route-tables --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'RouteTables[?Associations[0].Main!=`true`].RouteTableId' --output text | tr '\t' '\n' | while read rt_id; do
    if [ -n "$rt_id" ]; then
        # Delete custom routes first
        aws ec2 describe-route-tables --region $REGION --route-table-ids $rt_id --query 'RouteTables[0].Routes[?GatewayId!=`local`].DestinationCidrBlock' --output text | tr '\t' '\n' | while read dest_cidr; do
            if [ -n "$dest_cidr" ]; then
                echo "🗑️  Deleting route: $dest_cidr from $rt_id"
                aws ec2 delete-route --region $REGION --route-table-id $rt_id --destination-cidr-block $dest_cidr 2>/dev/null || true
            fi
        done

        # Disassociate and delete route table
        aws ec2 describe-route-tables --region $REGION --route-table-ids $rt_id --query 'RouteTables[0].Associations[?Main!=`true`].RouteTableAssociationId' --output text | tr '\t' '\n' | while read assoc_id; do
            if [ -n "$assoc_id" ]; then
                echo "🗑️  Disassociating route table: $assoc_id"
                aws ec2 disassociate-route-table --region $REGION --association-id $assoc_id 2>/dev/null || true
            fi
        done

        echo "🗑️  Deleting route table: $rt_id"
        aws ec2 delete-route-table --region $REGION --route-table-id $rt_id 2>/dev/null || true
    fi
done

# Detach and delete Internet Gateway
if [ "$IGW_ID" != "None" ] && [ "$IGW_ID" != "null" ]; then
    echo "🗑️  Detaching Internet Gateway: $IGW_ID"
    aws ec2 detach-internet-gateway --region $REGION --internet-gateway-id $IGW_ID --vpc-id $VPC_ID 2>/dev/null || true
    echo "🗑️  Deleting Internet Gateway: $IGW_ID"
    aws ec2 delete-internet-gateway --region $REGION --internet-gateway-id $IGW_ID 2>/dev/null || true
fi

# Delete subnets
echo "🗑️  Deleting subnets..."
aws ec2 describe-subnets --region $REGION --filters "Name=vpc-id,Values=$VPC_ID" --query 'Subnets[].SubnetId' --output text | tr '\t' '\n' | while read subnet_id; do
    if [ -n "$subnet_id" ]; then
        echo "🗑️  Deleting subnet: $subnet_id"
        aws ec2 delete-subnet --region $REGION --subnet-id $subnet_id 2>/dev/null || true
    fi
done

# Release Elastic IPs
echo "🗑️  Releasing Elastic IPs..."
aws ec2 describe-addresses --region $REGION --filters "Name=tag:Name,Values=prod-nat-eip" --query 'Addresses[].AllocationId' --output text | tr '\t' '\n' | while read alloc_id; do
    if [ -n "$alloc_id" ]; then
        echo "🗑️  Releasing Elastic IP: $alloc_id"
        aws ec2 release-address --region $REGION --allocation-id $alloc_id 2>/dev/null || true
    fi
done

# Delete VPC
echo "🗑️  Deleting VPC: $VPC_ID"
aws ec2 delete-vpc --region $REGION --vpc-id $VPC_ID 2>/dev/null || true

echo ""
echo "🗑️  Step 6: Cleaning up IAM resources..."

# Delete IAM resources
echo "🗑️  Deleting IAM instance profile..."
aws iam remove-role-from-instance-profile --instance-profile-name prod-ec2-instance-profile --role-name prod-ec2-role 2>/dev/null || true
aws iam delete-instance-profile --instance-profile-name prod-ec2-instance-profile 2>/dev/null || true

echo "🗑️  Detaching IAM policies..."
aws iam detach-role-policy --role-name prod-ec2-
```
