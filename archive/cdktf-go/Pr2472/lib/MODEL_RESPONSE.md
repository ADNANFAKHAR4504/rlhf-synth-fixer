# AWS Infrastructure as Code - CDKTF + Go Implementation

I'll provide a comprehensive CDKTF + Go implementation for your multi-region AWS infrastructure migration project. This solution follows AWS Well-Architected Framework principles and implements all your requirements.

## Project Structure

```
aws-migration-infrastructure/
├── main.go
├── go.mod
├── go.sum
├── stacks/
│   ├── network.go
│   ├── security.go
│   ├── database.go
│   ├── compute.go
│   ├── loadbalancer.go
│   └── monitoring.go
├── config/
│   └── config.go
└── utils/
    └── tags.go
```

## Core Implementation Files

### 1. Main Entry Point (`main.go`)

```go
package main

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"aws-migration/stacks"
	"aws-migration/config"
)

func main() {
	app := cdktf.NewApp(nil)

	// Configuration
	cfg := config.NewConfig()

	// Deploy to us-east-1
	eastStack := stacks.NewInfrastructureStack(app, jsii.String("migration-stack-east"), &stacks.InfrastructureStackConfig{
		Region:      "us-east-1",
		Environment: "production",
		Config:      cfg,
	})

	// Deploy to us-west-2
	westStack := stacks.NewInfrastructureStack(app, jsii.String("migration-stack-west"), &stacks.InfrastructureStackConfig{
		Region:      "us-west-2",
		Environment: "production",
		Config:      cfg,
	})

	// Cross-region dependencies
	stacks.SetupCrossRegionDependencies(eastStack, westStack)

	app.Synth()
}
```

### 2. Configuration Management (`config/config.go`)

```go
package config

import (
	"github.com/aws/jsii-runtime-go"
)

type Config struct {
	VpcCidr           string
	CompanyIpRanges   []string
	DatabaseConfig    DatabaseConfig
	InstanceTypes     InstanceTypes
	MonitoringConfig  MonitoringConfig
}

type DatabaseConfig struct {
	Engine          string
	EngineVersion   string
	InstanceClass   string
	AllocatedStorage int
	BackupRetention int
}

type InstanceTypes struct {
	WebTier string
	AppTier string
}

type MonitoringConfig struct {
	LogRetentionDays int
	AlarmThresholds  AlarmThresholds
}

type AlarmThresholds struct {
	CPUUtilization    float64
	MemoryUtilization float64
	DiskUtilization   float64
}

func NewConfig() *Config {
	return &Config{
		VpcCidr: "10.0.0.0/16",
		CompanyIpRanges: []string{
			"203.0.113.0/24", // Company office IP range
			"198.51.100.0/24", // Company VPN range
		},
		DatabaseConfig: DatabaseConfig{
			Engine:          "mysql",
			EngineVersion:   "8.0",
			InstanceClass:   "db.r5.large",
			AllocatedStorage: 100,
			BackupRetention: 7,
		},
		InstanceTypes: InstanceTypes{
			WebTier: "t3.medium",
			AppTier: "m5.large",
		},
		MonitoringConfig: MonitoringConfig{
			LogRetentionDays: 30,
			AlarmThresholds: AlarmThresholds{
				CPUUtilization:    80.0,
				MemoryUtilization: 80.0,
				DiskUtilization:   85.0,
			},
		},
	}
}
```

### 3. Utility Functions (`utils/tags.go`)

```go
package utils

import (
	"github.com/aws/jsii-runtime-go"
)

func GetStandardTags(region, environment string) *map[string]*string {
	return &map[string]*string{
		"Project":     jsii.String("Migration"),
		"Creator":     jsii.String("CloudEngineer"),
		"Environment": jsii.String(environment),
		"Region":      jsii.String(region),
		"CostCenter":  jsii.String("IT-Infrastructure"),
		"Compliance":  jsii.String("SOC2"),
		"Backup":      jsii.String("Required"),
		"Monitoring":  jsii.String("Enabled"),
	}
}

func MergeTags(baseTags *map[string]*string, additionalTags *map[string]*string) *map[string]*string {
	merged := make(map[string]*string)

	if baseTags != nil {
		for k, v := range *baseTags {
			merged[k] = v
		}
	}

	if additionalTags != nil {
		for k, v := range *additionalTags {
			merged[k] = v
		}
	}

	return &merged
}
```

### 4. Network Infrastructure Stack (`stacks/network.go`)

```go
package stacks

import (
	"fmt"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"aws-migration/config"
	"aws-migration/utils"
)

type NetworkStack struct {
	cdktf.TerraformStack
	VPC              vpc.Vpc
	PublicSubnets    []subnet.Subnet
	PrivateSubnets   []subnet.Subnet
	DatabaseSubnets  []subnet.Subnet
	InternetGateway  internetgateway.InternetGateway
	NatGateways      []natgateway.NatGateway
	PublicRouteTable routetable.RouteTable
	PrivateRouteTables []routetable.RouteTable
}

func NewNetworkStack(scope constructs.Construct, id *string, region string, cfg *config.Config) *NetworkStack {
	stack := cdktf.NewTerraformStack(scope, id)

	tags := utils.GetStandardTags(region, "production")

	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("azs"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Create VPC
	mainVpc := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String(cfg.VpcCidr),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("migration-vpc-%s", region)),
			"Type": jsii.String("Main VPC"),
		}),
	})

	// Create Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("internet-gateway"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVpc.Id(),
		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("migration-igw-%s", region)),
		}),
	})

	// Create subnets
	var publicSubnets []subnet.Subnet
	var privateSubnets []subnet.Subnet
	var databaseSubnets []subnet.Subnet
	var natGateways []natgateway.NatGateway
	var privateRouteTables []routetable.RouteTable

	for i := 0; i < 3; i++ { // 3 AZs for high availability
		azIndex := i % 3

		// Public Subnet
		pubSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("public-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:               mainVpc.Id(),
			CidrBlock:          jsii.String(fmt.Sprintf("10.0.%d.0/24", i*10+1)),
			AvailabilityZone:   cdktf.Token_AsString(cdktf.Fn_Element(azs.Names(), jsii.Number(azIndex)), nil),
			MapPublicIpOnLaunch: jsii.Bool(true),
			Tags: utils.MergeTags(tags, &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("public-subnet-%d-%s", i+1, region)),
				"Type": jsii.String("Public"),
			}),
		})
		publicSubnets = append(publicSubnets, pubSubnet)

		// Private Subnet
		privSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("private-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:            mainVpc.Id(),
			CidrBlock:       jsii.String(fmt.Sprintf("10.0.%d.0/24", i*10+2)),
			AvailabilityZone: cdktf.Token_AsString(cdktf.Fn_Element(azs.Names(), jsii.Number(azIndex)), nil),
			Tags: utils.MergeTags(tags, &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("private-subnet-%d-%s", i+1, region)),
				"Type": jsii.String("Private"),
			}),
		})
		privateSubnets = append(privateSubnets, privSubnet)

		// Database Subnet
		dbSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("database-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:            mainVpc.Id(),
			CidrBlock:       jsii.String(fmt.Sprintf("10.0.%d.0/24", i*10+3)),
			AvailabilityZone: cdktf.Token_AsString(cdktf.Fn_Element(azs.Names(), jsii.Number(azIndex)), nil),
			Tags: utils.MergeTags(tags, &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("database-subnet-%d-%s", i+1, region)),
				"Type": jsii.String("Database"),
			}),
		})
		databaseSubnets = append(databaseSubnets, dbSubnet)

		// Elastic IP for NAT Gateway
		natEip := eip.NewEip(stack, jsii.String(fmt.Sprintf("nat-eip-%d", i)), &eip.EipConfig{
			Domain: jsii.String("vpc"),
			Tags: utils.MergeTags(tags, &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("nat-eip-%d-%s", i+1, region)),
			}),
		})

		// NAT Gateway
		natGw := natgateway.NewNatGateway(stack, jsii.String(fmt.Sprintf("nat-gateway-%d", i)), &natgateway.NatGatewayConfig{
			AllocationId: natEip.Id(),
			SubnetId:     pubSubnet.Id(),
			Tags: utils.MergeTags(tags, &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("nat-gateway-%d-%s", i+1, region)),
			}),
		})
		natGateways = append(natGateways, natGw)

		// Private Route Table
		privRouteTable := routetable.NewRouteTable(stack, jsii.String(fmt.Sprintf("private-route-table-%d", i)), &routetable.RouteTableConfig{
			VpcId: mainVpc.Id(),
			Tags: utils.MergeTags(tags, &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("private-rt-%d-%s", i+1, region)),
			}),
		})
		privateRouteTables = append(privateRouteTables, privRouteTable)

		// Route to NAT Gateway
		route.NewRoute(stack, jsii.String(fmt.Sprintf("private-route-%d", i)), &route.RouteConfig{
			RouteTableId:         privRouteTable.Id(),
			DestinationCidrBlock: jsii.String("0.0.0.0/0"),
			NatGatewayId:         natGw.Id(),
		})

		// Associate private subnet with private route table
		routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("private-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     privSubnet.Id(),
			RouteTableId: privRouteTable.Id(),
		})

		// Associate database subnet with private route table
		routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("database-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     dbSubnet.Id(),
			RouteTableId: privRouteTable.Id(),
		})
	}

	// Public Route Table
	publicRouteTable := routetable.NewRouteTable(stack, jsii.String("public-route-table"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("public-rt-%s", region)),
		}),
	})

	// Route to Internet Gateway
	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRouteTable.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnets with public route table
	for i, pubSubnet := range publicSubnets {
		routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("public-rta-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     pubSubnet.Id(),
			RouteTableId: publicRouteTable.Id(),
		})
	}

	return &NetworkStack{
		TerraformStack:     stack,
		VPC:                mainVpc,
		PublicSubnets:      publicSubnets,
		PrivateSubnets:     privateSubnets,
		DatabaseSubnets:    databaseSubnets,
		InternetGateway:    igw,
		NatGateways:        natGateways,
		PublicRouteTable:   publicRouteTable,
		PrivateRouteTables: privateRouteTables,
	}
}
```

### 5. Security Stack (`stacks/security.go`)

```go
package stacks

import (
	"fmt"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iaminstanceprofile"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"aws-migration/config"
	"aws-migration/utils"
)

type SecurityStack struct {
	cdktf.TerraformStack
	ALBSecurityGroup      securitygroup.SecurityGroup
	WebSecurityGroup      securitygroup.SecurityGroup
	AppSecurityGroup      securitygroup.SecurityGroup
	DatabaseSecurityGroup securitygroup.SecurityGroup
	EC2Role               iamrole.IamRole
	EC2InstanceProfile    iaminstanceprofile.IamInstanceProfile
	KMSKey                kmskey.KmsKey
}

func NewSecurityStack(scope constructs.Construct, id *string, region string, vpcId *string, cfg *config.Config) *SecurityStack {
	stack := cdktf.NewTerraformStack(scope, id)

	tags := utils.GetStandardTags(region, "production")

	// ALB Security Group
	albSG := securitygroup.NewSecurityGroup(stack, jsii.String("alb-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("alb-sg-%s", region)),
		Description: jsii.String("Security group for Application Load Balancer"),
		VpcId:       vpcId,

		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				Description: jsii.String("HTTPS from company IPs"),
				FromPort:    jsii.Number(443),
				ToPort:      jsii.Number(443),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &cfg.CompanyIpRanges,
			},
			{
				Description: jsii.String("HTTP from company IPs"),
				FromPort:    jsii.Number(80),
				ToPort:      jsii.Number(80),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &cfg.CompanyIpRanges,
			},
		},

		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				Description: jsii.String("All outbound traffic"),
				FromPort:    jsii.Number(0),
				ToPort:      jsii.Number(0),
				Protocol:    jsii.String("-1"),
				CidrBlocks:  &[]*string{jsii.String("0.0.0.0/0")},
			},
		},

		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("alb-sg-%s", region)),
			"Type": jsii.String("Load Balancer"),
		}),
	})

	// Web Tier Security Group
	webSG := securitygroup.NewSecurityGroup(stack, jsii.String("web-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("web-sg-%s", region)),
		Description: jsii.String("Security group for web tier instances"),
		VpcId:       vpcId,

		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				Description:     jsii.String("HTTP from ALB"),
				FromPort:        jsii.Number(80),
				ToPort:          jsii.Number(80),
				Protocol:        jsii.String("tcp"),
				SecurityGroups:  &[]*string{albSG.Id()},
			},
			{
				Description:     jsii.String("HTTPS from ALB"),
				FromPort:        jsii.Number(443),
				ToPort:          jsii.Number(443),
				Protocol:        jsii.String("tcp"),
				SecurityGroups:  &[]*string{albSG.Id()},
			},
			{
				Description: jsii.String("SSH from company IPs"),
				FromPort:    jsii.Number(22),
				ToPort:      jsii.Number(22),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &cfg.CompanyIpRanges,
			},
		},

		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				Description: jsii.String("All outbound traffic"),
				FromPort:    jsii.Number(0),
				ToPort:      jsii.Number(0),
				Protocol:    jsii.String("-1"),
				CidrBlocks:  &[]*string{jsii.String("0.0.0.0/0")},
			},
		},

		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("web-sg-%s", region)),
			"Type": jsii.String("Web Tier"),
		}),
	})

	// Application Tier Security Group
	appSG := securitygroup.NewSecurityGroup(stack, jsii.String("app-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("app-sg-%s", region)),
		Description: jsii.String("Security group for application tier instances"),
		VpcId:       vpcId,

		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				Description:     jsii.String("Application port from web tier"),
				FromPort:        jsii.Number(8080),
				ToPort:          jsii.Number(8080),
				Protocol:        jsii.String("tcp"),
				SecurityGroups:  &[]*string{webSG.Id()},
			},
			{
				Description: jsii.String("SSH from company IPs"),
				FromPort:    jsii.Number(22),
				ToPort:      jsii.Number(22),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &cfg.CompanyIpRanges,
			},
		},

		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				Description: jsii.String("All outbound traffic"),
				FromPort:    jsii.Number(0),
				ToPort:      jsii.Number(0),
				Protocol:    jsii.String("-1"),
				CidrBlocks:  &[]*string{jsii.String("0.0.0.0/0")},
			},
		},

		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("app-sg-%s", region)),
			"Type": jsii.String("Application Tier"),
		}),
	})

	// Database Security Group
	dbSG := securitygroup.NewSecurityGroup(stack, jsii.String("database-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("db-sg-%s", region)),
		Description: jsii.String("Security group for database instances"),
		VpcId:       vpcId,

		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				Description:     jsii.String("MySQL from application tier"),
				FromPort:        jsii.Number(3306),
				ToPort:          jsii.Number(3306),
				Protocol:        jsii.String("tcp"),
				SecurityGroups:  &[]*string{appSG.Id()},
			},
		},

		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("db-sg-%s", region)),
			"Type": jsii.String("Database"),
		}),
	})

	// EC2 IAM Role
	ec2Role := iamrole.NewIamRole(stack, jsii.String("ec2-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("ec2-migration-role-%s", region)),
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
		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("ec2-role-%s", region)),
		}),
	})

	// Attach managed policies to EC2 role
	managedPolicies := []string{
		"arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
		"arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
		"arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
	}

	for i, policyArn := range managedPolicies {
		iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String(fmt.Sprintf("ec2-policy-attachment-%d", i)), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
			Role:      ec2Role.Name(),
			PolicyArn: jsii.String(policyArn),
		})
	}

	// EC2 Instance Profile
	ec2Profile := iaminstanceprofile.NewIamInstanceProfile(stack, jsii.String("ec2-instance-profile"), &iaminstanceprofile.IamInstanceProfileConfig{
		Name: jsii.String(fmt.Sprintf("ec2-migration-profile-%s", region)),
		Role: ec2Role.Name(),
		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("ec2-profile-%s", region)),
		}),
	})

	// KMS Key for encryption
	kmsKey := kmskey.NewKmsKey(stack, jsii.String("encryption-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for migration project encryption"),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::*:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				}
			]
		}`),
		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("migration-kms-key-%s", region)),
		}),
	})

	// KMS Key Alias
	kmsalias.NewKmsAlias(stack, jsii.String("encryption-key-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String(fmt.Sprintf("alias/migration-key-%s", region)),
		TargetKeyId:  kmsKey.KeyId(),
	})

	return &SecurityStack{
		TerraformStack:        stack,
		ALBSecurityGroup:      albSG,
		WebSecurityGroup:      webSG,
		AppSecurityGroup:      appSG,
		DatabaseSecurityGroup: dbSG,
		EC2Role:               ec2Role,
		EC2InstanceProfile:    ec2Profile,
		KMSKey:                kmsKey,
	}
}
```

### 6. Database Stack (`stacks/database.go`)

```go
package stacks

import (
	"fmt"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbparametergroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/ssmsecretmanager"
	"aws-migration/config"
	"aws-migration/utils"
)

type DatabaseStack struct {
	cdktf.TerraformStack
	SubnetGroup     dbsubnetgroup.DbSubnetGroup
	ParameterGroup  dbparametergroup.DbParameterGroup
	PrimaryInstance dbinstance.DbInstance
	ReadReplica     dbinstance.DbInstance
}

func NewDatabaseStack(scope constructs.Construct, id *string, region string, subnetIds []*string, securityGroupIds []*string, kmsKeyId *string, cfg *config.Config) *DatabaseStack {
	stack := cdktf.NewTerraformStack(scope, id)

	tags := utils.GetStandardTags(region, "production")

	// DB Subnet Group
	subnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String("db-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:       jsii.String(fmt.Sprintf("migration-db-subnet-group-%s", region)),
		SubnetIds:  &subnetIds,
		Tags: utils.MergeTags(tags, &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("db-subnet-group-%s", region)),
		}),
	})

	// DB Parameter Group
	parameterGroup := dbparametergroup.NewDbParameterGroup(stack, jsii.String("db-parameter-group"), &dbparametergroup.DbParameterGroupConfig{
		Family: jsii.String("mysql8.0"),
		Name:   jsii.String(fmt.Sprintf("migration-db-params-%s", region)),

		Parameter: &[]*dbparametergroup.DbParameterGroupParameter{
			{
				Name:  jsii.String("innodb_buffer_pool_size"),
				Value: jsii.String("{DBInstanceClassMemory*3/4}"),
			},
			{
				Name:  jsii.String("max_connections"),
				Value: jsii.String("1000"),
			},
			{
				Name:  jsii.String("slow_query_log"),
				Value
```
