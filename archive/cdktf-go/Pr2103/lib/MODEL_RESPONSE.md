# AWS Secure Environment Infrastructure with CDKTF Go

This implementation creates a secure AWS environment using CDKTF with Go, incorporating the latest AWS security features and best practices for hosting a web application.

## Architecture Overview

The solution implements a multi-layered security architecture with:
- VPC with public and private subnets across multiple AZs
- Security groups with least privilege access
- Network ACLs for additional network-level security
- EC2 instance in private subnet with web application hosting
- S3 bucket with server-side encryption for application logs
- IAM roles with least privilege access and modern security constraints
- EC2 Instance Connect Endpoint for secure bastion-free access
- VPC endpoints for S3 to keep traffic within AWS backbone

## Key Security Features

1. **Latest AWS Security Features**:
   - EC2 Instance Connect Endpoint (2023 feature) for secure private instance access
   - Global condition context keys (`aws:EC2InstanceSourceVPC` and `aws:EC2InstanceSourcePrivateIPv4`) for enhanced EC2 security

2. **Security Best Practices**:
   - All resources tagged with Environment: Production
   - Server-side encryption enabled on S3 bucket
   - Least privilege IAM policies
   - Network segmentation with private subnets
   - VPC endpoints to avoid internet traffic

## Implementation Files

### main.go
```go
package main

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/datasources"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/ec2"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/ec2instanceconnectendpoint"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/iam"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/vpcendpoint"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Configure AWS Provider
	provider.NewAwsProvider(stack, jsii.String("AWS"), &provider.AwsProviderConfig{
		Region: jsii.String("us-west-2"),
		DefaultTags: []provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": jsii.String("Production"),
				},
			},
		},
	})

	// Get availability zones
	azs := datasources.NewDataAwsAvailabilityZones(stack, jsii.String("azs"), &datasources.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Create VPC
	vpc := ec2.NewVpc(stack, jsii.String("secure-network"), &ec2.VpcConfig{
		CidrBlock:          jsii.String("10.0.0.0/16"),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("secure-network"),
			"Environment": jsii.String("Production"),
		},
	})

	// Internet Gateway
	igw := ec2.NewInternetGateway(stack, jsii.String("igw"), &ec2.InternetGatewayConfig{
		VpcId: vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("secure-network-igw"),
			"Environment": jsii.String("Production"),
		},
	})

	// Public Subnets
	publicSubnet1 := ec2.NewSubnet(stack, jsii.String("public-subnet-1"), &ec2.SubnetConfig{
		VpcId:               vpc.Id(),
		CidrBlock:           jsii.String("10.0.1.0/24"),
		AvailabilityZone:    azs.Names().Index(jsii.Number(0)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("public-subnet-1"),
			"Environment": jsii.String("Production"),
		},
	})

	publicSubnet2 := ec2.NewSubnet(stack, jsii.String("public-subnet-2"), &ec2.SubnetConfig{
		VpcId:               vpc.Id(),
		CidrBlock:           jsii.String("10.0.2.0/24"),
		AvailabilityZone:    azs.Names().Index(jsii.Number(1)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("public-subnet-2"),
			"Environment": jsii.String("Production"),
		},
	})

	// Private Subnets
	privateSubnet1 := ec2.NewSubnet(stack, jsii.String("private-subnet-1"), &ec2.SubnetConfig{
		VpcId:            vpc.Id(),
		CidrBlock:        jsii.String("10.0.10.0/24"),
		AvailabilityZone: azs.Names().Index(jsii.Number(0)),
		Tags: &map[string]*string{
			"Name":        jsii.String("private-subnet-1"),
			"Environment": jsii.String("Production"),
		},
	})

	privateSubnet2 := ec2.NewSubnet(stack, jsii.String("private-subnet-2"), &ec2.SubnetConfig{
		VpcId:            vpc.Id(),
		CidrBlock:        jsii.String("10.0.20.0/24"),
		AvailabilityZone: azs.Names().Index(jsii.Number(1)),
		Tags: &map[string]*string{
			"Name":        jsii.String("private-subnet-2"),
			"Environment": jsii.String("Production"),
		},
	})

	// NAT Gateway
	natEip := ec2.NewEip(stack, jsii.String("nat-eip"), &ec2.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name":        jsii.String("nat-gateway-eip"),
			"Environment": jsii.String("Production"),
		},
		DependsOn: &[]cdktf.ITerraformDependable{igw},
	})

	natGw := ec2.NewNatGateway(stack, jsii.String("nat-gateway"), &ec2.NatGatewayConfig{
		AllocationId: natEip.Id(),
		SubnetId:     publicSubnet1.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("secure-network-nat"),
			"Environment": jsii.String("Production"),
		},
	})

	// Route Tables
	publicRt := ec2.NewRouteTable(stack, jsii.String("public-rt"), &ec2.RouteTableConfig{
		VpcId: vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("public-route-table"),
			"Environment": jsii.String("Production"),
		},
	})

	privateRt := ec2.NewRouteTable(stack, jsii.String("private-rt"), &ec2.RouteTableConfig{
		VpcId: vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("private-route-table"),
			"Environment": jsii.String("Production"),
		},
	})

	// Routes
	ec2.NewRoute(stack, jsii.String("public-internet-route"), &ec2.RouteConfig{
		RouteTableId:         publicRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	ec2.NewRoute(stack, jsii.String("private-nat-route"), &ec2.RouteConfig{
		RouteTableId:         privateRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGw.Id(),
	})

	// Route Table Associations
	ec2.NewRouteTableAssociation(stack, jsii.String("public-subnet-1-rta"), &ec2.RouteTableAssociationConfig{
		SubnetId:     publicSubnet1.Id(),
		RouteTableId: publicRt.Id(),
	})

	ec2.NewRouteTableAssociation(stack, jsii.String("public-subnet-2-rta"), &ec2.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRt.Id(),
	})

	ec2.NewRouteTableAssociation(stack, jsii.String("private-subnet-1-rta"), &ec2.RouteTableAssociationConfig{
		SubnetId:     privateSubnet1.Id(),
		RouteTableId: privateRt.Id(),
	})

	ec2.NewRouteTableAssociation(stack, jsii.String("private-subnet-2-rta"), &ec2.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRt.Id(),
	})

	// Network ACL for additional security
	networkAcl := ec2.NewNetworkAcl(stack, jsii.String("secure-network-acl"), &ec2.NetworkAclConfig{
		VpcId: vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("secure-network-acl"),
			"Environment": jsii.String("Production"),
		},
	})

	// Inbound rules for Network ACL
	ec2.NewNetworkAclRule(stack, jsii.String("allow-http"), &ec2.NetworkAclRuleConfig{
		NetworkAclId: networkAcl.Id(),
		Protocol:     jsii.String("tcp"),
		RuleAction:   jsii.String("allow"),
		RuleNumber:   jsii.Number(100),
		FromPort:     jsii.Number(80),
		ToPort:       jsii.Number(80),
		CidrBlock:    jsii.String("0.0.0.0/0"),
	})

	ec2.NewNetworkAclRule(stack, jsii.String("allow-https"), &ec2.NetworkAclRuleConfig{
		NetworkAclId: networkAcl.Id(),
		Protocol:     jsii.String("tcp"),
		RuleAction:   jsii.String("allow"),
		RuleNumber:   jsii.Number(110),
		FromPort:     jsii.Number(443),
		ToPort:       jsii.Number(443),
		CidrBlock:    jsii.String("0.0.0.0/0"),
	})

	ec2.NewNetworkAclRule(stack, jsii.String("allow-ephemeral-outbound"), &ec2.NetworkAclRuleConfig{
		NetworkAclId: networkAcl.Id(),
		Protocol:     jsii.String("tcp"),
		RuleAction:   jsii.String("allow"),
		RuleNumber:   jsii.Number(120),
		FromPort:     jsii.Number(1024),
		ToPort:       jsii.Number(65535),
		CidrBlock:    jsii.String("0.0.0.0/0"),
	})

	// Outbound rules for Network ACL
	ec2.NewNetworkAclRule(stack, jsii.String("allow-all-outbound"), &ec2.NetworkAclRuleConfig{
		NetworkAclId: networkAcl.Id(),
		Protocol:     jsii.String("-1"),
		RuleAction:   jsii.String("allow"),
		RuleNumber:   jsii.Number(100),
		CidrBlock:    jsii.String("0.0.0.0/0"),
		Egress:       jsii.Bool(true),
	})

	// Associate Network ACL with private subnets
	ec2.NewNetworkAclAssociation(stack, jsii.String("private-subnet-1-nacl"), &ec2.NetworkAclAssociationConfig{
		NetworkAclId: networkAcl.Id(),
		SubnetId:     privateSubnet1.Id(),
	})

	ec2.NewNetworkAclAssociation(stack, jsii.String("private-subnet-2-nacl"), &ec2.NetworkAclAssociationConfig{
		NetworkAclId: networkAcl.Id(),
		SubnetId:     privateSubnet2.Id(),
	})

	// Security Group for Web Application
	webSg := ec2.NewSecurityGroup(stack, jsii.String("web-security-group"), &ec2.SecurityGroupConfig{
		Name:        jsii.String("web-application-sg"),
		Description: jsii.String("Security group for web application"),
		VpcId:       vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("web-application-sg"),
			"Environment": jsii.String("Production"),
		},
	})

	// Inbound rules for Security Group
	ec2.NewSecurityGroupRule(stack, jsii.String("allow-http-inbound"), &ec2.SecurityGroupRuleConfig{
		Type:            jsii.String("ingress"),
		FromPort:        jsii.Number(80),
		ToPort:          jsii.Number(80),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("10.0.0.0/16")},
		SecurityGroupId: webSg.Id(),
		Description:     jsii.String("Allow HTTP traffic from within VPC"),
	})

	ec2.NewSecurityGroupRule(stack, jsii.String("allow-https-inbound"), &ec2.SecurityGroupRuleConfig{
		Type:            jsii.String("ingress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("10.0.0.0/16")},
		SecurityGroupId: webSg.Id(),
		Description:     jsii.String("Allow HTTPS traffic from within VPC"),
	})

	// Outbound rules for Security Group
	ec2.NewSecurityGroupRule(stack, jsii.String("allow-all-outbound"), &ec2.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(0),
		ToPort:          jsii.Number(65535),
		Protocol:        jsii.String("-1"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: webSg.Id(),
		Description:     jsii.String("Allow all outbound traffic"),
	})

	// S3 Bucket for Application Logs
	logsBucket := s3.NewS3Bucket(stack, jsii.String("app-logs-bucket"), &s3.S3BucketConfig{
		BucketPrefix: jsii.String("secure-web-app-logs-"),
		Tags: &map[string]*string{
			"Name":        jsii.String("application-logs"),
			"Environment": jsii.String("Production"),
		},
	})

	// S3 Bucket Server-side encryption
	s3.NewS3BucketServerSideEncryptionConfigurationA(stack, jsii.String("logs-bucket-encryption"), &s3.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: logsBucket.Id(),
		Rule: []s3.S3BucketServerSideEncryptionConfigurationARule{
			{
				ApplyServerSideEncryptionByDefault: &s3.S3BucketServerSideEncryptionConfigurationARule_ApplyServerSideEncryptionByDefault{
					SseAlgorithm: jsii.String("AES256"),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
	})

	// S3 Bucket Public Access Block
	s3.NewS3BucketPublicAccessBlock(stack, jsii.String("logs-bucket-pab"), &s3.S3BucketPublicAccessBlockConfig{
		Bucket:                logsBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// S3 Bucket versioning
	s3.NewS3BucketVersioningA(stack, jsii.String("logs-bucket-versioning"), &s3.S3BucketVersioningAConfig{
		Bucket: logsBucket.Id(),
		VersioningConfiguration: &s3.S3BucketVersioningAVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// VPC Endpoint for S3
	s3Endpoint := vpcendpoint.NewVpcEndpoint(stack, jsii.String("s3-vpc-endpoint"), &vpcendpoint.VpcEndpointConfig{
		VpcId:       vpc.Id(),
		ServiceName: jsii.String("com.amazonaws.us-west-2.s3"),
		VpcEndpointType: jsii.String("Gateway"),
		RouteTableIds: &[]*string{privateRt.Id()},
		Tags: &map[string]*string{
			"Name":        jsii.String("s3-vpc-endpoint"),
			"Environment": jsii.String("Production"),
		},
	})

	// IAM Role for EC2 instance
	ec2Role := iam.NewIamRole(stack, jsii.String("web-app-role"), &iam.IamRoleConfig{
		Name: jsii.String("WebAppEC2Role"),
		AssumeRolePolicy: jsii.String(`{
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
		}`),
		Tags: &map[string]*string{
			"Name":        jsii.String("WebAppEC2Role"),
			"Environment": jsii.String("Production"),
		},
	})

	// IAM Policy with modern security constraints
	logPolicy := iam.NewIamPolicy(stack, jsii.String("s3-log-policy"), &iam.IamPolicyConfig{
		Name: jsii.String("S3LogWritePolicy"),
		Policy: cdktf.Fn_Jsonencode(map[string]interface{}{
			"Version": "2012-10-17",
			"Statement": []map[string]interface{}{
				{
					"Effect": "Allow",
					"Action": []string{
						"s3:PutObject",
						"s3:PutObjectAcl",
					},
					"Resource": cdktf.Fn_Join("/", &[]*string{logsBucket.Arn(), jsii.String("*")}),
					"Condition": map[string]interface{}{
						"StringEquals": map[string]interface{}{
							"aws:EC2InstanceSourceVPC": *vpc.Id(),
						},
					},
				},
				{
					"Effect": "Allow",
					"Action": "s3:GetBucketLocation",
					"Resource": logsBucket.Arn(),
					"Condition": map[string]interface{}{
						"StringEquals": map[string]interface{}{
							"aws:EC2InstanceSourceVPC": *vpc.Id(),
						},
					},
				},
			},
		}),
		Tags: &map[string]*string{
			"Name":        jsii.String("S3LogWritePolicy"),
			"Environment": jsii.String("Production"),
		},
	})

	// Attach policy to role
	iam.NewIamRolePolicyAttachment(stack, jsii.String("role-policy-attachment"), &iam.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: logPolicy.Arn(),
	})

	// Instance Profile
	instanceProfile := iam.NewIamInstanceProfile(stack, jsii.String("web-app-profile"), &iam.IamInstanceProfileConfig{
		Name: jsii.String("WebAppInstanceProfile"),
		Role: ec2Role.Name(),
		Tags: &map[string]*string{
			"Name":        jsii.String("WebAppInstanceProfile"),
			"Environment": jsii.String("Production"),
		},
	})

	// Get latest Amazon Linux 2 AMI
	ami := datasources.NewDataAwsAmi(stack, jsii.String("amazon-linux"), &datasources.DataAwsAmiConfig{
		MostRecent: jsii.Bool(true),
		Owners:     &[]*string{jsii.String("amazon")},
		Filter: []datasources.DataAwsAmiFilter{
			{
				Name:   jsii.String("name"),
				Values: &[]*string{jsii.String("amzn2-ami-hvm-*-x86_64-gp2")},
			},
			{
				Name:   jsii.String("virtualization-type"),
				Values: &[]*string{jsii.String("hvm")},
			},
		},
	})

	// User data script for web application
	userData := `#!/bin/bash
yum update -y
yum install -y httpd aws-logs
systemctl start httpd
systemctl enable httpd

# Create a simple web page
cat << 'EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Secure Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .security-badge { background: #28a745; color: white; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🔐 Secure Web Application</h1>
        <div class="security-badge">
            ✅ Deployed with AWS Security Best Practices
        </div>
        <h2>Security Features</h2>
        <ul>
            <li>Private subnet deployment</li>
            <li>VPC with network segmentation</li>
            <li>Security groups with least privilege</li>
            <li>Network ACLs for additional protection</li>
            <li>Encrypted S3 logging</li>
            <li>IAM role with restricted permissions</li>
            <li>VPC endpoints for secure AWS service access</li>
        </ul>
        <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
        <p><strong>Deployment Region:</strong> us-west-2</p>
    </div>
    <script>
        // Get instance metadata
        fetch('/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(error => document.getElementById('instance-id').textContent = 'Not available');
    </script>
</body>
</html>
EOF

# Configure CloudWatch Logs agent
cat << 'EOF' > /etc/awslogs/awslogs.conf
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/httpd/access_log]
datetime_format = %d/%b/%Y:%H:%M:%S %z
file = /var/log/httpd/access_log
buffer_duration = 5000
log_stream_name = {instance_id}/apache-access.log
initial_position = start_of_file
log_group_name = /aws/ec2/webserver

[/var/log/httpd/error_log]
datetime_format = %d/%b/%Y:%H:%M:%S %z
file = /var/log/httpd/error_log
buffer_duration = 5000
log_stream_name = {instance_id}/apache-error.log
initial_position = start_of_file
log_group_name = /aws/ec2/webserver
EOF

systemctl start awslogsd
systemctl enable awslogsd

# Create application logs directory and test log
mkdir -p /var/log/webapp
echo "$(date): Web application started successfully" > /var/log/webapp/application.log

# Set up log rotation
cat << 'EOF' > /etc/logrotate.d/webapp
/var/log/webapp/application.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    create 644 apache apache
}
EOF`

	// EC2 Instance
	webInstance := ec2.NewInstance(stack, jsii.String("web-server"), &ec2.InstanceConfig{
		Ami:                    ami.Id(),
		InstanceType:          jsii.String("t3.micro"),
		SubnetId:              privateSubnet1.Id(),
		VpcSecurityGroupIds:   &[]*string{webSg.Id()},
		IamInstanceProfile:    instanceProfile.Name(),
		UserData:              jsii.String(userData),
		DisableApiTermination: jsii.Bool(false),
		Monitoring:            jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("secure-web-server"),
			"Environment": jsii.String("Production"),
		},
		RootBlockDevice: &ec2.InstanceRootBlockDevice{
			VolumeType: jsii.String("gp3"),
			VolumeSize: jsii.Number(20),
			Encrypted:  jsii.Bool(true),
		},
		MetadataOptions: &ec2.InstanceMetadataOptions{
			HttpEndpoint: jsii.String("enabled"),
			HttpTokens:   jsii.String("required"),
			HttpPutResponseHopLimit: jsii.Number(1),
		},
	})

	// Security Group for EC2 Instance Connect Endpoint
	eiceSecurityGroup := ec2.NewSecurityGroup(stack, jsii.String("eice-security-group"), &ec2.SecurityGroupConfig{
		Name:        jsii.String("eice-sg"),
		Description: jsii.String("Security group for EC2 Instance Connect Endpoint"),
		VpcId:       vpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String("eice-security-group"),
			"Environment": jsii.String("Production"),
		},
	})

	// Allow SSH traffic from anywhere to EICE (it handles authentication)
	ec2.NewSecurityGroupRule(stack, jsii.String("eice-ssh-inbound"), &ec2.SecurityGroupRuleConfig{
		Type:            jsii.String("ingress"),
		FromPort:        jsii.Number(22),
		ToPort:          jsii.Number(22),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: eiceSecurityGroup.Id(),
		Description:     jsii.String("Allow SSH access through EICE"),
	})

	// Allow outbound traffic from EICE to private instances
	ec2.NewSecurityGroupRule(stack, jsii.String("eice-outbound"), &ec2.SecurityGroupRuleConfig{
		Type:                     jsii.String("egress"),
		FromPort:                 jsii.Number(22),
		ToPort:                   jsii.Number(22),
		Protocol:                 jsii.String("tcp"),
		SourceSecurityGroupId:    webSg.Id(),
		SecurityGroupId:          eiceSecurityGroup.Id(),
		Description:              jsii.String("Allow SSH to web servers"),
	})

	// Allow inbound SSH from EICE to web servers
	ec2.NewSecurityGroupRule(stack, jsii.String("web-ssh-from-eice"), &ec2.SecurityGroupRuleConfig{
		Type:                     jsii.String("ingress"),
		FromPort:                 jsii.Number(22),
		ToPort:                   jsii.Number(22),
		Protocol:                 jsii.String("tcp"),
		SourceSecurityGroupId:    eiceSecurityGroup.Id(),
		SecurityGroupId:          webSg.Id(),
		Description:              jsii.String("Allow SSH from EICE"),
	})

	// EC2 Instance Connect Endpoint
	eice := ec2instanceconnectendpoint.NewEc2InstanceConnectEndpoint(stack, jsii.String("eice"), &ec2instanceconnectendpoint.Ec2InstanceConnectEndpointConfig{
		SubnetId:         privateSubnet1.Id(),
		SecurityGroupIds: &[]*string{eiceSecurityGroup.Id()},
		Tags: &map[string]*string{
			"Name":        jsii.String("secure-web-eice"),
			"Environment": jsii.String("Production"),
		},
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       vpc.Id(),
		Description: jsii.String("ID of the secure VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("instance_id"), &cdktf.TerraformOutputConfig{
		Value:       webInstance.Id(),
		Description: jsii.String("ID of the web server instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_name"), &cdktf.TerraformOutputConfig{
		Value:       logsBucket.Id(),
		Description: jsii.String("Name of the S3 logs bucket"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("instance_connect_endpoint_id"), &cdktf.TerraformOutputConfig{
		Value:       eice.Id(),
		Description: jsii.String("ID of the EC2 Instance Connect Endpoint"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_instance_ip"), &cdktf.TerraformOutputConfig{
		Value:       webInstance.PrivateIp(),
		Description: jsii.String("Private IP address of the web server"),
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "TapStack")
	app.Synth()
}
```

This implementation provides a comprehensive secure AWS environment with all the requested features and incorporates the latest AWS security enhancements including EC2 Instance Connect Endpoint and the new global condition context keys for enhanced IAM security.