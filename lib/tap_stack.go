package lib

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

// getEnvOrDefault returns environment variable value or default if not set
func getEnvOrDefault(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Self-contained TapStack using raw Terraform resources to minimize dependencies
func NewTapStack(scope constructs.Construct, id string, props ...*TapStackProps) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// If no props provided, create defaults from environment variables
	var stackProps *TapStackProps
	if len(props) == 0 || props[0] == nil {
		stackProps = &TapStackProps{
			EnvironmentSuffix: getEnvOrDefault("ENVIRONMENT_SUFFIX", "dev"),
			StateBucket:       getEnvOrDefault("TERRAFORM_STATE_BUCKET", "iac-rlhf-tf-states"),
			StateBucketRegion: getEnvOrDefault("TERRAFORM_STATE_BUCKET_REGION", "us-east-1"),
			AwsRegion:         getEnvOrDefault("AWS_DEFAULT_REGION", "us-east-1"),
			RepositoryName:    getEnvOrDefault("GITHUB_REPOSITORY", "iac-test-automations"),
			CommitAuthor:      getEnvOrDefault("COMMIT_AUTHOR", "TuringGpt"),
			OfficeIP:          getEnvOrDefault("OFFICE_IP", "0.0.0.0/0"),
			InstanceType:      getEnvOrDefault("INSTANCE_TYPE", "t3.micro"),
		}
	} else {
		stackProps = props[0]
	}

	// Get environment prefix
	envPrefix := os.Getenv("ENVIRONMENT_SUFFIX")
	if envPrefix == "" {
		envPrefix = stackProps.EnvironmentSuffix
	}
	envPrefix = fmt.Sprintf("%s-webapp", envPrefix)

	// Configure S3 Backend for remote state
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket:  jsii.String(stackProps.StateBucket),
		Key:     jsii.String(fmt.Sprintf("prs/%s/terraform.tfstate", stackProps.EnvironmentSuffix)),
		Region:  jsii.String(stackProps.StateBucketRegion),
		Encrypt: jsii.Bool(true),
	})

	// Configure required providers using escape hatch
	stack.AddOverride(jsii.String("terraform.required_providers"), map[string]interface{}{
		"aws": map[string]interface{}{
			"source":  "hashicorp/aws",
			"version": "~> 5.0",
		},
	})

	// Configure AWS provider using escape hatch
	stack.AddOverride(jsii.String("provider.aws.region"), jsii.String(stackProps.AwsRegion))
	stack.AddOverride(jsii.String("provider.aws.default_tags"), map[string]interface{}{
		"tags": map[string]interface{}{
			"Environment": stackProps.EnvironmentSuffix,
			"Repository":  stackProps.RepositoryName,
			"Author":      stackProps.CommitAuthor,
			"Project":     "webapp-foundation",
			"ManagedBy":   "CDKTF",
		},
	})

	// Data source for availability zones using escape hatch
	stack.AddOverride(jsii.String("data.aws_availability_zones.available"), map[string]interface{}{
		"state": "available",
	})

	// VPC using escape hatch
	stack.AddOverride(jsii.String("resource.aws_vpc.main"), map[string]interface{}{
		"cidr_block":           "10.0.0.0/16",
		"enable_dns_hostnames": true,
		"enable_dns_support":   true,
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-vpc", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
			"Project":     "webapp-foundation",
		},
	})

	// Internet Gateway using escape hatch
	stack.AddOverride(jsii.String("resource.aws_internet_gateway.main"), map[string]interface{}{
		"vpc_id": "${aws_vpc.main.id}",
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-igw", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// Public Subnet using escape hatch
	stack.AddOverride(jsii.String("resource.aws_subnet.public"), map[string]interface{}{
		"vpc_id":                  "${aws_vpc.main.id}",
		"cidr_block":              "10.0.1.0/24",
		"availability_zone":       "${data.aws_availability_zones.available.names[0]}",
		"map_public_ip_on_launch": true,
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-public-subnet", envPrefix),
			"Type":        "Public",
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// Private Subnet 1 using escape hatch
	stack.AddOverride(jsii.String("resource.aws_subnet.private_1"), map[string]interface{}{
		"vpc_id":            "${aws_vpc.main.id}",
		"cidr_block":        "10.0.2.0/24",
		"availability_zone": "${data.aws_availability_zones.available.names[0]}",
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-private-subnet-1", envPrefix),
			"Type":        "Private",
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// Private Subnet 2 using escape hatch
	stack.AddOverride(jsii.String("resource.aws_subnet.private_2"), map[string]interface{}{
		"vpc_id":            "${aws_vpc.main.id}",
		"cidr_block":        "10.0.3.0/24",
		"availability_zone": "${data.aws_availability_zones.available.names[1]}",
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-private-subnet-2", envPrefix),
			"Type":        "Private",
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// Route table using escape hatch
	stack.AddOverride(jsii.String("resource.aws_route_table.public"), map[string]interface{}{
		"vpc_id": "${aws_vpc.main.id}",
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-public-rt", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// Route to internet gateway using escape hatch
	stack.AddOverride(jsii.String("resource.aws_route.public"), map[string]interface{}{
		"route_table_id":         "${aws_route_table.public.id}",
		"destination_cidr_block": "0.0.0.0/0",
		"gateway_id":             "${aws_internet_gateway.main.id}",
	})

	// Associate public subnet with route table using escape hatch
	stack.AddOverride(jsii.String("resource.aws_route_table_association.public"), map[string]interface{}{
		"subnet_id":      "${aws_subnet.public.id}",
		"route_table_id": "${aws_route_table.public.id}",
	})

	// EC2 security group using escape hatch
	stack.AddOverride(jsii.String("resource.aws_security_group.ec2"), map[string]interface{}{
		"name":        fmt.Sprintf("%s-ec2-sg", envPrefix),
		"description": "Security group for EC2 instance - allows SSH from office IP",
		"vpc_id":      "${aws_vpc.main.id}",
		"ingress": []map[string]interface{}{
			{
				"from_port":        22,
				"to_port":          22,
				"protocol":         "tcp",
				"cidr_blocks":      []string{stackProps.OfficeIP},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
				"description":      "SSH access from office IP",
			},
		},
		"egress": []map[string]interface{}{
			{
				"from_port":        0,
				"to_port":          65535,
				"protocol":         "tcp",
				"cidr_blocks":      []string{"0.0.0.0/0"},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{},
				"self":             false,
				"description":      "All outbound traffic",
			},
		},
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-ec2-sg", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// RDS security group using escape hatch
	stack.AddOverride(jsii.String("resource.aws_security_group.rds"), map[string]interface{}{
		"name":        fmt.Sprintf("%s-rds-sg", envPrefix),
		"description": "Security group for RDS MySQL database",
		"vpc_id":      "${aws_vpc.main.id}",
		"ingress": []map[string]interface{}{
			{
				"from_port":        3306,
				"to_port":          3306,
				"protocol":         "tcp",
				"cidr_blocks":      []string{},
				"ipv6_cidr_blocks": []string{},
				"prefix_list_ids":  []string{},
				"security_groups":  []string{"${aws_security_group.ec2.id}"},
				"self":             false,
				"description":      "MySQL access from EC2 instances",
			},
		},
		"egress": []map[string]interface{}{},
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-rds-sg", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// Amazon Linux AMI data source using escape hatch
	stack.AddOverride(jsii.String("data.aws_ami.amazon_linux"), map[string]interface{}{
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

	// EC2 instance using escape hatch
	stack.AddOverride(jsii.String("resource.aws_instance.web_server"), map[string]interface{}{
		"ami":                         "${data.aws_ami.amazon_linux.id}",
		"instance_type":               stackProps.InstanceType,
		"subnet_id":                   "${aws_subnet.public.id}",
		"vpc_security_group_ids":      []string{"${aws_security_group.ec2.id}"},
		"associate_public_ip_address": true,
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-web-server", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
			"Role":        "WebServer",
		},
		"user_data": fmt.Sprintf(`#!/bin/bash
yum update -y
yum install -y mysql
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Web Application Server</h1>" > /var/www/html/index.html
echo "<p>Environment: %s</p>" >> /var/www/html/index.html`, stackProps.EnvironmentSuffix),
	})

	// DB subnet group using escape hatch
	stack.AddOverride(jsii.String("resource.aws_db_subnet_group.main"), map[string]interface{}{
		"name": fmt.Sprintf("%s-db-subnet-group", envPrefix),
		"subnet_ids": []string{
			"${aws_subnet.private_1.id}",
			"${aws_subnet.private_2.id}",
		},
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-db-subnet-group", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
		},
	})

	// DB parameter group using escape hatch
	stack.AddOverride(jsii.String("resource.aws_db_parameter_group.main"), map[string]interface{}{
		"name":   fmt.Sprintf("%s-mysql-params", envPrefix),
		"family": "mysql8.0",
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-mysql-params", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
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

	// RDS MySQL instance using escape hatch
	stack.AddOverride(jsii.String("resource.aws_db_instance.main"), map[string]interface{}{
		"identifier":              fmt.Sprintf("%s-mysql-db", envPrefix),
		"allocated_storage":       20,
		"storage_type":            "gp2",
		"engine":                  "mysql",
		"engine_version":          "8.0",
		"instance_class":          "db.t3.micro",
		"db_name":                 "webapp",
		"username":                dbUsername,
		"password":                dbPassword,
		"vpc_security_group_ids":  []string{"${aws_security_group.rds.id}"},
		"db_subnet_group_name":    "${aws_db_subnet_group.main.name}",
		"parameter_group_name":    "${aws_db_parameter_group.main.name}",
		"backup_retention_period": 7,
		"backup_window":           "03:00-04:00",
		"maintenance_window":      "Mon:04:00-Mon:05:00",
		"storage_encrypted":       true,
		"deletion_protection":     false, // Set to true for production
		"skip_final_snapshot":     true,  // Set to false for production
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-mysql-db", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
			"Engine":      "MySQL",
		},
	})

	// S3 bucket for state storage using escape hatch
	stack.AddOverride(jsii.String("resource.aws_s3_bucket.terraform_state"), map[string]interface{}{
		"bucket": fmt.Sprintf("%s-terraform-state-%s", envPrefix, stackProps.EnvironmentSuffix),
		"tags": map[string]interface{}{
			"Name":        fmt.Sprintf("%s-terraform-state", envPrefix),
			"Environment": stackProps.EnvironmentSuffix,
			"Purpose":     "TerraformState",
		},
	})

	// Enable versioning on the state bucket using escape hatch
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_versioning.terraform_state"), map[string]interface{}{
		"bucket": "${aws_s3_bucket.terraform_state.id}",
		"versioning_configuration": map[string]interface{}{
			"status": "Enabled",
		},
	})

	// Enable server-side encryption using escape hatch
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_server_side_encryption_configuration.terraform_state"), map[string]interface{}{
		"bucket": "${aws_s3_bucket.terraform_state.id}",
		"rule": []map[string]interface{}{
			{
				"apply_server_side_encryption_by_default": map[string]interface{}{
					"sse_algorithm": "AES256",
				},
			},
		},
	})

	// Block public access to the state bucket using escape hatch
	stack.AddOverride(jsii.String("resource.aws_s3_bucket_public_access_block.terraform_state"), map[string]interface{}{
		"bucket":                  "${aws_s3_bucket.terraform_state.id}",
		"block_public_acls":       true,
		"block_public_policy":     true,
		"ignore_public_acls":      true,
		"restrict_public_buckets": true,
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_vpc.main.id}"),
		Description: jsii.String("ID of the VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_instance_id"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_instance.web_server.id}"),
		Description: jsii.String("ID of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_public_ip"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_instance.web_server.public_ip}"),
		Description: jsii.String("Public IP address of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_public_dns"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_instance.web_server.public_dns}"),
		Description: jsii.String("Public DNS name of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_endpoint"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_db_instance.main.endpoint}"),
		Description: jsii.String("RDS instance endpoint"),
		Sensitive:   jsii.Bool(false),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_port"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_db_instance.main.port}"),
		Description: jsii.String("RDS instance port"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_state_bucket"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_s3_bucket.terraform_state.id}"),
		Description: jsii.String("S3 bucket for Terraform state"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("database_name"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("${aws_db_instance.main.db_name}"),
		Description: jsii.String("Database name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ssh_command"), &cdktf.TerraformOutputConfig{
		Value:       jsii.String("ssh -i your-key.pem ec2-user@${aws_instance.web_server.public_ip}"),
		Description: jsii.String("SSH command to connect to the EC2 instance"),
	})

	return stack
}
