package main

import (
	"fmt"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/dataawsami"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/dbparametergroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/instance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/securitygrouprule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v18/vpc"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"os"
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

	// Add S3 state locking using escape hatch
	stack.AddOverride(jsii.String("terraform.backend.s3.use_lockfile"), jsii.Bool(true))

	// Configure AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(props.AwsRegion),
		DefaultTags: []provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": jsii.String(props.EnvironmentSuffix),
					"Repository":  jsii.String(props.RepositoryName),
					"Author":      jsii.String(props.CommitAuthor),
					"Project":     jsii.String("webapp-foundation"),
					"ManagedBy":   jsii.String("CDKTF"),
				},
			},
		},
	})

	// Define common tags
	commonTags := &map[string]*string{
		"Environment": jsii.String(props.EnvironmentSuffix),
		"Project":     jsii.String("webapp-foundation"),
		"ManagedBy":   jsii.String("CDKTF"),
		"Owner":       jsii.String("DevOps"),
	}

	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("available"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Use Fn.element to access availability zones
	az1 := cdktf.Fn_Tostring(cdktf.Fn_Element(azs.Names(), jsii.Number(0)))
	az2 := cdktf.Fn_Tostring(cdktf.Fn_Element(azs.Names(), jsii.Number(1)))

	// Create VPC
	vpcResource := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String("10.0.0.0/16"),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-vpc", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
			"Project":     jsii.String("webapp-foundation"),
		},
	})

	// Create Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("main-igw"), &internetgateway.InternetGatewayConfig{
		VpcId: vpcResource.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-igw", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Create public subnet for EC2
	publicSubnet := subnet.NewSubnet(stack, jsii.String("public-subnet"), &subnet.SubnetConfig{
		VpcId:                   vpcResource.Id(),
		CidrBlock:               jsii.String("10.0.1.0/24"),
		AvailabilityZone:        &az1,
		MapPublicIpOnLaunch:     jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-public-subnet", envPrefix)),
			"Type":        jsii.String("Public"),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Create private subnet for RDS (first AZ)
	privateSubnet1 := subnet.NewSubnet(stack, jsii.String("private-subnet-1"), &subnet.SubnetConfig{
		VpcId:            vpcResource.Id(),
		CidrBlock:        jsii.String("10.0.2.0/24"),
		AvailabilityZone: &az1,
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-private-subnet-1", envPrefix)),
			"Type":        jsii.String("Private"),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Create private subnet for RDS (second AZ) - required for DB subnet group
	privateSubnet2 := subnet.NewSubnet(stack, jsii.String("private-subnet-2"), &subnet.SubnetConfig{
		VpcId:            vpcResource.Id(),
		CidrBlock:        jsii.String("10.0.3.0/24"),
		AvailabilityZone: &az2,
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-private-subnet-2", envPrefix)),
			"Type":        jsii.String("Private"),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Create route table for public subnet
	publicRouteTable := routetable.NewRouteTable(stack, jsii.String("public-rt"), &routetable.RouteTableConfig{
		VpcId: vpcResource.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-public-rt", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Create route to internet gateway
	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRouteTable.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnet with route table
	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-rt-association"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	// Create security group for EC2 instance
	ec2SecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("ec2-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("%s-ec2-sg", envPrefix)),
		Description: jsii.String("Security group for EC2 instance - allows SSH from office IP"),
		VpcId:       vpcResource.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-ec2-sg", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Add SSH ingress rule
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("ec2-ssh-ingress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:              jsii.String("ingress"),
		FromPort:          jsii.Number(22),
		ToPort:            jsii.Number(22),
		Protocol:          jsii.String("tcp"),
		CidrBlocks:        jsii.Strings(props.OfficeIP),
		SecurityGroupId:   ec2SecurityGroup.Id(),
		Description:       jsii.String("SSH access from office IP"),
	})

	// Add outbound rule for EC2
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("ec2-egress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(0),
		ToPort:          jsii.Number(65535),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      jsii.Strings("0.0.0.0/0"),
		SecurityGroupId: ec2SecurityGroup.Id(),
		Description:     jsii.String("All outbound traffic"),
	})

	// Create security group for RDS
	rdsSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("rds-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("%s-rds-sg", envPrefix)),
		Description: jsii.String("Security group for RDS MySQL database"),
		VpcId:       vpcResource.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-rds-sg", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Add MySQL ingress rule from EC2 security group
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("rds-mysql-ingress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                     jsii.String("ingress"),
		FromPort:                 jsii.Number(3306),
		ToPort:                   jsii.Number(3306),
		Protocol:                 jsii.String("tcp"),
		SourceSecurityGroupId:    ec2SecurityGroup.Id(),
		SecurityGroupId:          rdsSecurityGroup.Id(),
		Description:              jsii.String("MySQL access from EC2 instances"),
	})

	// Get latest Amazon Linux 2 AMI
	amazonLinuxAmi := dataawsami.NewDataAwsAmi(stack, jsii.String("amazon-linux"), &dataawsami.DataAwsAmiConfig{
		MostRecent: jsii.Bool(true),
		Owners:     jsii.Strings("amazon"),
		Filter: []dataawsami.DataAwsAmiFilter{
			{
				Name:   jsii.String("name"),
				Values: jsii.Strings("amzn2-ami-hvm-*-x86_64-gp2"),
			},
			{
				Name:   jsii.String("state"),
				Values: jsii.Strings("available"),
			},
		},
	})

	// Create EC2 instance
	ec2Instance := instance.NewInstance(stack, jsii.String("web-server"), &instance.InstanceConfig{
		Ami:                    amazonLinuxAmi.Id(),
		InstanceType:           jsii.String(props.InstanceType),
		SubnetId:               publicSubnet.Id(),
		VpcSecurityGroupIds:    jsii.Strings(*ec2SecurityGroup.Id()),
		AssociatePublicIpAddress: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-web-server", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
			"Role":        jsii.String("WebServer"),
		},
		UserData: jsii.String(`#!/bin/bash
yum update -y
yum install -y mysql
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Web Application Server</h1>" > /var/www/html/index.html
echo "<p>Environment: ` + props.EnvironmentSuffix + `</p>" >> /var/www/html/index.html`),
	})

	// Create DB subnet group
	dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String("db-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:       jsii.String(fmt.Sprintf("%s-db-subnet-group", envPrefix)),
		SubnetIds:  jsii.Strings(*privateSubnet1.Id(), *privateSubnet2.Id()),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-db-subnet-group", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Create DB parameter group for MySQL
	dbParameterGroup := dbparametergroup.NewDbParameterGroup(stack, jsii.String("db-params"), &dbparametergroup.DbParameterGroupConfig{
		Name:   jsii.String(fmt.Sprintf("%s-mysql-params", envPrefix)),
		Family: jsii.String("mysql8.0"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-mysql-params", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
		},
	})

	// Generate secure random password for database
	dbPassword := os.Getenv("DB_PASSWORD")
	if dbPassword == "" {
		dbPassword = "ChangeMe123!" // Default password - should be changed via environment variable
	}

	dbUsername := os.Getenv("DB_USERNAME")
	if dbUsername == "" {
		dbUsername = "admin"
	}

	// Create RDS MySQL instance
	rdsInstance := dbinstance.NewDbInstance(stack, jsii.String("mysql-db"), &dbinstance.DbInstanceConfig{
		Identifier:     jsii.String(fmt.Sprintf("%s-mysql-db", envPrefix)),
		AllocatedStorage: jsii.Number(20),
		StorageType:    jsii.String("gp2"),
		Engine:         jsii.String("mysql"),
		EngineVersion:  jsii.String("8.0"),
		InstanceClass:  jsii.String("db.t3.micro"),
		DbName:         jsii.String("webapp"),
		Username:       jsii.String(dbUsername),
		Password:       jsii.String(dbPassword),
		VpcSecurityGroupIds: jsii.Strings(*rdsSecurityGroup.Id()),
		DbSubnetGroupName:   dbSubnetGroup.Name(),
		ParameterGroupName:  dbParameterGroup.Name(),
		BackupRetentionPeriod: jsii.Number(7),
		BackupWindow:          jsii.String("03:00-04:00"),
		MaintenanceWindow:     jsii.String("Mon:04:00-Mon:05:00"),
		StorageEncrypted:      jsii.Bool(true),
		DeletionProtection:    jsii.Bool(false), // Set to true for production
		SkipFinalSnapshot:     jsii.Bool(true),  // Set to false for production
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-mysql-db", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
			"Engine":      jsii.String("MySQL"),
		},
	})

	// Create S3 bucket for state storage with versioning
	stateBucket := s3bucket.NewS3Bucket(stack, jsii.String("terraform-state"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("%s-terraform-state-%s", envPrefix, props.EnvironmentSuffix)),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("%s-terraform-state", envPrefix)),
			"Environment": jsii.String(props.EnvironmentSuffix),
			"Purpose":     jsii.String("TerraformState"),
		},
	})

	// Enable versioning on the state bucket
	s3bucketversioning.NewS3BucketVersioning(stack, jsii.String("terraform-state-versioning"), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: stateBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Enable server-side encryption
	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration(stack, jsii.String("terraform-state-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig{
		Bucket: stateBucket.Id(),
		Rule: []s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm: jsii.String("AES256"),
				},
			},
		},
	})

	// Block public access to the state bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("terraform-state-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                stateBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       vpcResource.Id(),
		Description: jsii.String("ID of the VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_instance_id"), &cdktf.TerraformOutputConfig{
		Value:       ec2Instance.Id(),
		Description: jsii.String("ID of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_public_ip"), &cdktf.TerraformOutputConfig{
		Value:       ec2Instance.PublicIp(),
		Description: jsii.String("Public IP address of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ec2_public_dns"), &cdktf.TerraformOutputConfig{
		Value:       ec2Instance.PublicDns(),
		Description: jsii.String("Public DNS name of the EC2 instance"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_endpoint"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Endpoint(),
		Description: jsii.String("RDS instance endpoint"),
		Sensitive:   jsii.Bool(false),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_port"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Port(),
		Description: jsii.String("RDS instance port"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_state_bucket"), &cdktf.TerraformOutputConfig{
		Value:       stateBucket.Id(),
		Description: jsii.String("S3 bucket for Terraform state"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("database_name"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.DbName(),
		Description: jsii.String("Database name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ssh_command"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Format(jsii.String("ssh -i your-key.pem ec2-user@%s"), jsii.Slice{ec2Instance.PublicIp()}),
		Description: jsii.String("SSH command to connect to the EC2 instance"),
	})

	return stack
}