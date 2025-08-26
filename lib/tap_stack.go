package main

import (
	"fmt"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

type TapStackProps struct {
	EnvironmentSuffix string
	StateBucket       string
	StateBucketRegion string
	AwsRegion         string
	RepositoryName    string
	CommitAuthor      string
	OfficeIP          string
	InstanceType      string
}

// Self-contained TapStack using raw Terraform resources to minimize dependencies
func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Get environment prefix
	envPrefix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envPrefix == "" {
		envPrefix = props.EnvironmentSuffix
	}
	envPrefix = fmt.Sprintf("%s-webapp", envPrefix)

	// Configure S3 Backend for remote state
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket:  jsii.String(props.StateBucket),
		Key:     jsii.String(fmt.Sprintf("prs/%s/terraform.tfstate", props.EnvironmentSuffix)),
		Region:  jsii.String(props.StateBucketRegion),
		Encrypt: jsii.Bool(true),
	})

	// AWS Provider using raw Terraform resource
	cdktf.NewTerraformProvider(stack, jsii.String("aws"), &map[string]interface{}{
		"region": props.AwsRegion,
		"default_tags": []map[string]interface{}{
			{
				"tags": map[string]string{
					"Environment": props.EnvironmentSuffix,
					"Repository":  props.RepositoryName,
					"Author":      props.CommitAuthor,
					"Project":     "webapp-foundation",
					"ManagedBy":   "CDKTF",
				},
			},
		},
	})

	// Common tags
	commonTags := map[string]string{
		"Environment": props.EnvironmentSuffix,
		"Project":     "webapp-foundation",
		"ManagedBy":   "CDKTF",
		"Owner":       "DevOps",
	}

	// Data source for availability zones
	azDataSource := cdktf.NewTerraformDataSource(stack, jsii.String("available_azs"), jsii.String("aws_availability_zones"), &map[string]interface{}{
		"state": "available",
	})

	// VPC using raw Terraform resource
	vpcResource := cdktf.NewTerraformResource(stack, jsii.String("main_vpc"), jsii.String("aws_vpc"), &map[string]interface{}{
		"cidr_block":           "10.0.0.0/16",
		"enable_dns_hostnames": true,
		"enable_dns_support":   true,
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-vpc", envPrefix),
			"Environment": props.EnvironmentSuffix,
			"Project":     "webapp-foundation",
		},
	})

	// Internet Gateway
	igwResource := cdktf.NewTerraformResource(stack, jsii.String("main_igw"), jsii.String("aws_internet_gateway"), &map[string]interface{}{
		"vpc_id": vpcResource.GetString(jsii.String("id")),
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-igw", envPrefix),
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Public Subnet
	publicSubnet := cdktf.NewTerraformResource(stack, jsii.String("public_subnet"), jsii.String("aws_subnet"), &map[string]interface{}{
		"vpc_id":                   vpcResource.GetString(jsii.String("id")),
		"cidr_block":               "10.0.1.0/24",
		"availability_zone":        cdktf.Fn_Element(azDataSource.Get(jsii.String("names")), jsii.Number(0)),
		"map_public_ip_on_launch":  true,
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-public-subnet", envPrefix),
			"Type":        "Public",
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Private Subnet 1
	privateSubnet1 := cdktf.NewTerraformResource(stack, jsii.String("private_subnet_1"), jsii.String("aws_subnet"), &map[string]interface{}{
		"vpc_id":            vpcResource.GetString(jsii.String("id")),
		"cidr_block":        "10.0.2.0/24",
		"availability_zone": cdktf.Fn_Element(azDataSource.Get(jsii.String("names")), jsii.Number(0)),
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-private-subnet-1", envPrefix),
			"Type":        "Private",
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Private Subnet 2
	privateSubnet2 := cdktf.NewTerraformResource(stack, jsii.String("private_subnet_2"), jsii.String("aws_subnet"), &map[string]interface{}{
		"vpc_id":            vpcResource.GetString(jsii.String("id")),
		"cidr_block":        "10.0.3.0/24",
		"availability_zone": cdktf.Fn_Element(azDataSource.Get(jsii.String("names")), jsii.Number(1)),
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-private-subnet-2", envPrefix),
			"Type":        "Private",
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Route Table for Public Subnet
	publicRouteTable := cdktf.NewTerraformResource(stack, jsii.String("public_route_table"), jsii.String("aws_route_table"), &map[string]interface{}{
		"vpc_id": vpcResource.GetString(jsii.String("id")),
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-public-rt", envPrefix),
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Route to Internet Gateway
	cdktf.NewTerraformResource(stack, jsii.String("public_route"), jsii.String("aws_route"), &map[string]interface{}{
		"route_table_id":         publicRouteTable.GetString(jsii.String("id")),
		"destination_cidr_block": "0.0.0.0/0",
		"gateway_id":             igwResource.GetString(jsii.String("id")),
	})

	// Route Table Association
	cdktf.NewTerraformResource(stack, jsii.String("public_rt_association"), jsii.String("aws_route_table_association"), &map[string]interface{}{
		"subnet_id":      publicSubnet.GetString(jsii.String("id")),
		"route_table_id": publicRouteTable.GetString(jsii.String("id")),
	})

	// Security Group for EC2
	ec2SecurityGroup := cdktf.NewTerraformResource(stack, jsii.String("ec2_security_group"), jsii.String("aws_security_group"), &map[string]interface{}{
		"name":        fmt.Sprintf("%s-ec2-sg", envPrefix),
		"description": "Security group for EC2 instance - allows SSH from office IP",
		"vpc_id":      vpcResource.GetString(jsii.String("id")),
		"ingress": []map[string]interface{}{
			{
				"from_port":   22,
				"to_port":     22,
				"protocol":    "tcp",
				"cidr_blocks": []string{props.OfficeIP},
				"description": "SSH access from office IP",
			},
		},
		"egress": []map[string]interface{}{
			{
				"from_port":   0,
				"to_port":     65535,
				"protocol":    "tcp",
				"cidr_blocks": []string{"0.0.0.0/0"},
				"description": "All outbound traffic",
			},
		},
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-ec2-sg", envPrefix),
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Security Group for RDS
	rdsSecurityGroup := cdktf.NewTerraformResource(stack, jsii.String("rds_security_group"), jsii.String("aws_security_group"), &map[string]interface{}{
		"name":        fmt.Sprintf("%s-rds-sg", envPrefix),
		"description": "Security group for RDS MySQL database",
		"vpc_id":      vpcResource.GetString(jsii.String("id")),
		"ingress": []map[string]interface{}{
			{
				"from_port":       3306,
				"to_port":         3306,
				"protocol":        "tcp",
				"security_groups": []string{ec2SecurityGroup.GetString(jsii.String("id"))},
				"description":     "MySQL access from EC2 instances",
			},
		},
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-rds-sg", envPrefix),
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Data source for latest Amazon Linux 2 AMI
	amiDataSource := cdktf.NewTerraformDataSource(stack, jsii.String("amazon_linux_ami"), jsii.String("aws_ami"), &map[string]interface{}{
		"most_recent": true,
		"owners":      []string{"amazon"},
		"filter": []map[string]interface{}{
			{
				"name":   "name",
				"values": []string{"amzn2-ami-hvm-*-x86_64-gp2"},
			},
			{
				"name":   "state",
				"values": []string{"available"},
			},
		},
	})

	// EC2 Instance
	ec2Instance := cdktf.NewTerraformResource(stack, jsii.String("web_server"), jsii.String("aws_instance"), &map[string]interface{}{
		"ami":                         amiDataSource.GetString(jsii.String("id")),
		"instance_type":               props.InstanceType,
		"subnet_id":                   publicSubnet.GetString(jsii.String("id")),
		"vpc_security_group_ids":      []string{ec2SecurityGroup.GetString(jsii.String("id"))},
		"associate_public_ip_address": true,
		"user_data": fmt.Sprintf(`#!/bin/bash
yum update -y
yum install -y mysql
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Web Application Server</h1>" > /var/www/html/index.html
echo "<p>Environment: %s</p>" >> /var/www/html/index.html`, props.EnvironmentSuffix),
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-web-server", envPrefix),
			"Environment": props.EnvironmentSuffix,
			"Role":        "WebServer",
		},
	})

	// DB Subnet Group
	dbSubnetGroup := cdktf.NewTerraformResource(stack, jsii.String("db_subnet_group"), jsii.String("aws_db_subnet_group"), &map[string]interface{}{
		"name":       fmt.Sprintf("%s-db-subnet-group", envPrefix),
		"subnet_ids": []string{privateSubnet1.GetString(jsii.String("id")), privateSubnet2.GetString(jsii.String("id"))},
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-db-subnet-group", envPrefix),
			"Environment": props.EnvironmentSuffix,
		},
	})

	// DB Parameter Group
	dbParameterGroup := cdktf.NewTerraformResource(stack, jsii.String("db_parameter_group"), jsii.String("aws_db_parameter_group"), &map[string]interface{}{
		"name":   fmt.Sprintf("%s-mysql-params", envPrefix),
		"family": "mysql8.0",
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-mysql-params", envPrefix),
			"Environment": props.EnvironmentSuffix,
		},
	})

	// Get database credentials from environment or use defaults
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "ChangeMe123!" // Default password - should be changed via environment variable
	}

	dbUsername := os.Getenv("DB_USERNAME")
	if dbUsername == "" {
		dbUsername = "admin"
	}

	// RDS MySQL Instance
	rdsInstance := cdktf.NewTerraformResource(stack, jsii.String("mysql_database"), jsii.String("aws_db_instance"), &map[string]interface{}{
		"identifier":                fmt.Sprintf("%s-mysql-db", envPrefix),
		"allocated_storage":         20,
		"storage_type":              "gp2",
		"engine":                    "mysql",
		"engine_version":            "8.0",
		"instance_class":            "db.t3.micro",
		"db_name":                   "webapp",
		"username":                  dbUsername,
		"password":                  dbPassword,
		"vpc_security_group_ids":    []string{rdsSecurityGroup.GetString(jsii.String("id"))},
		"db_subnet_group_name":      dbSubnetGroup.GetString(jsii.String("name")),
		"parameter_group_name":      dbParameterGroup.GetString(jsii.String("name")),
		"backup_retention_period":   7,
		"backup_window":             "03:00-04:00",
		"maintenance_window":        "Mon:04:00-Mon:05:00",
		"storage_encrypted":         true,
		"deletion_protection":       false, // Set to true for production
		"skip_final_snapshot":       true,  // Set to false for production
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-mysql-db", envPrefix),
			"Environment": props.EnvironmentSuffix,
			"Engine":      "MySQL",
		},
	})

	// S3 Bucket for Terraform State
	stateBucket := cdktf.NewTerraformResource(stack, jsii.String("terraform_state_bucket"), jsii.String("aws_s3_bucket"), &map[string]interface{}{
		"bucket": fmt.Sprintf("%s-terraform-state-%s", envPrefix, props.EnvironmentSuffix),
		"tags": map[string]string{
			"Name":        fmt.Sprintf("%s-terraform-state", envPrefix),
			"Environment": props.EnvironmentSuffix,
			"Purpose":     "TerraformState",
		},
	})

	// S3 Bucket Versioning
	cdktf.NewTerraformResource(stack, jsii.String("terraform_state_versioning"), jsii.String("aws_s3_bucket_versioning"), &map[string]interface{}{
		"bucket": stateBucket.GetString(jsii.String("id")),
		"versioning_configuration": []map[string]interface{}{
			{
				"status": "Enabled",
			},
		},
	})

	// S3 Bucket Server Side Encryption
	cdktf.NewTerraformResource(stack, jsii.String("terraform_state_encryption"), jsii.String("aws_s3_bucket_server_side_encryption_configuration"), &map[string]interface{}{
		"bucket": stateBucket.GetString(jsii.String("id")),
		"rule": []map[string]interface{}{
			{
				"apply_server_side_encryption_by_default": []map[string]interface{}{
					{
						"sse_algorithm": "AES256",
					},
				},
			},
		},
	})

	// S3 Bucket Public Access Block
	cdktf.NewTerraformResource(stack, jsii.String("terraform_state_pab"), jsii.String("aws_s3_bucket_public_access_block"), &map[string]interface{}{
		"bucket":                   stateBucket.GetString(jsii.String("id")),
		"block_public_acls":        true,
		"block_public_policy":      true,
		"ignore_public_acls":       true,
		"restrict_public_buckets":  true,
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       vpcResource.GetString(jsii.String("id")),
		Description: jsii.String("ID of the VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_instance_id"), &cdktf.TerraformOutputConfig{
		Value:       ec2Instance.GetString(jsii.String("id")),
		Description: jsii.String("ID of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_public_ip"), &cdktf.TerraformOutputConfig{
		Value:       ec2Instance.GetString(jsii.String("public_ip")),
		Description: jsii.String("Public IP address of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_public_dns"), &cdktf.TerraformOutputConfig{
		Value:       ec2Instance.GetString(jsii.String("public_dns")),
		Description: jsii.String("Public DNS name of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_endpoint"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.GetString(jsii.String("endpoint")),
		Description: jsii.String("RDS instance endpoint"),
		Sensitive:   jsii.Bool(false),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_port"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.GetString(jsii.String("port")),
		Description: jsii.String("RDS instance port"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_state_bucket"), &cdktf.TerraformOutputConfig{
		Value:       stateBucket.GetString(jsii.String("id")),
		Description: jsii.String("S3 bucket for Terraform state"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("database_name"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.GetString(jsii.String("db_name")),
		Description: jsii.String("Database name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ssh_command"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Format(jsii.String("ssh -i your-key.pem ec2-user@%s"), jsii.Slice{ec2Instance.GetString(jsii.String("public_ip"))}),
		Description: jsii.String("SSH command to connect to the EC2 instance"),
	})

	// Additional outputs for comprehensive information
	for key, value := range commonTags {
		cdktf.NewTerraformOutput(stack, jsii.String(fmt.Sprintf("tag_%s", key)), &cdktf.TerraformOutputConfig{
			Value:       jsii.String(value),
			Description: jsii.String(fmt.Sprintf("Tag value for %s", key)),
		})
	}

	return stack
}
