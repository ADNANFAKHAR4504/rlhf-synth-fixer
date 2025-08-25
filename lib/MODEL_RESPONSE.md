I'll help you create a comprehensive security-focused AWS infrastructure using CDKTF with Go. Let me break this down into modular components following best practices.

## Project Structure

```
aws-secure-infrastructure/
├── main.go
├── go.mod
├── go.sum
├── modules/
│   ├── iam/
│   │   └── iam.go
│   ├── networking/
│   │   └── vpc.go
│   ├── security/
│   │   └── security_groups.go
│   ├── storage/
│   │   └── s3.go
│   ├── logging/
│   │   └── logging.go
│   ├── security_hub/
│   │   └── security_hub.go
│   ├── database/
│   │   └── rds.go
│   └── common/
│       └── tags.go
└── cdktf.json
```

## go.mod

```go
module aws-secure-infrastructure

go 1.21

require (
    github.com/aws/constructs-go/constructs/v10 v10.3.0
    github.com/aws/jsii-runtime-go v1.95.0
    github.com/hashicorp/terraform-cdk-go/cdktf v0.20.0
    github.com/cdktf/cdktf-provider-aws-go/aws/v19 v19.0.0
)
```

## cdktf.json

```json
{
  "language": "go",
  "app": "go run main.go",
  "projectId": "aws-secure-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

## modules/common/tags.go

```go
package common

import (
	"github.com/aws/jsii-runtime-go"
)

type TagConfig struct {
	Environment string
	Project     string
	Owner       string
	CostCenter  string
}

func GetCommonTags(config TagConfig) *map[string]*string {
	return &map[string]*string{
		"Environment":          jsii.String(config.Environment),
		"Project":              jsii.String(config.Project),
		"Owner":                jsii.String(config.Owner),
		"CostCenter":           jsii.String(config.CostCenter),
		"ManagedBy":            jsii.String("CDKTF"),
		"SecurityCompliance":   jsii.String("Required"),
		"DataClassification":   jsii.String("Confidential"),
		"BackupRequired":       jsii.String("true"),
		"MonitoringEnabled":    jsii.String("true"),
		"CreatedDate":          jsii.String("2025-01-01"),
	}
}

func MergeTags(commonTags *map[string]*string, additionalTags map[string]*string) *map[string]*string {
	merged := make(map[string]*string)
	
	// Copy common tags
	for k, v := range *commonTags {
		merged[k] = v
	}
	
	// Add additional tags
	for k, v := range additionalTags {
		merged[k] = v
	}
	
	return &merged
}
```

## modules/iam/iam.go

```go
package iam

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"aws-secure-infrastructure/modules/common"
)

type IAMConfig struct {
	Tags common.TagConfig
}

type IAMRoles struct {
	LambdaExecutionRole   iamrole.IamRole
	EC2InstanceRole       iamrole.IamRole
	RDSEnhancedMonitoringRole iamrole.IamRole
}

func CreateIAMRoles(scope constructs.Construct, id string, config IAMConfig) *IAMRoles {
	commonTags := common.GetCommonTags(config.Tags)

	// Lambda Execution Role
	lambdaAssumeRolePolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Action": "sts:AssumeRole",
				"Effect": "Allow",
				"Principal": {
					"Service": "lambda.amazonaws.com"
				}
			}
		]
	}`

	lambdaRole := iamrole.NewIamRole(scope, jsii.String("lambda-execution-role"), &iamrole.IamRoleConfig{
		Name:             jsii.String("secure-lambda-execution-role"),
		AssumeRolePolicy: jsii.String(lambdaAssumeRolePolicy),
		Description:      jsii.String("IAM role for Lambda functions with security logging"),
		Tags:             common.MergeTags(commonTags, map[string]*string{
			"ResourceType": jsii.String("IAMRole"),
			"Purpose":      jsii.String("LambdaExecution"),
		}),
	})

	// Attach AWS managed policies to Lambda role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String("lambda-basic-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String("lambda-vpc-execution"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      lambdaRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"),
	})

	// EC2 Instance Role
	ec2AssumeRolePolicy := `{
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
	}`

	ec2Role := iamrole.NewIamRole(scope, jsii.String("ec2-instance-role"), &iamrole.IamRoleConfig{
		Name:             jsii.String("secure-ec2-instance-role"),
		AssumeRolePolicy: jsii.String(ec2AssumeRolePolicy),
		Description:      jsii.String("IAM role for EC2 instances with security monitoring"),
		Tags:             common.MergeTags(commonTags, map[string]*string{
			"ResourceType": jsii.String("IAMRole"),
			"Purpose":      jsii.String("EC2Instance"),
		}),
	})

	// Attach AWS managed policies to EC2 role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String("ec2-ssm-managed"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String("ec2-cloudwatch-agent"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"),
	})

	// RDS Enhanced Monitoring Role
	rdsAssumeRolePolicy := `{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Action": "sts:AssumeRole",
				"Effect": "Allow",
				"Principal": {
					"Service": "monitoring.rds.amazonaws.com"
				}
			}
		]
	}`

	rdsRole := iamrole.NewIamRole(scope, jsii.String("rds-enhanced-monitoring-role"), &iamrole.IamRoleConfig{
		Name:             jsii.String("secure-rds-enhanced-monitoring-role"),
		AssumeRolePolicy: jsii.String(rdsAssumeRolePolicy),
		Description:      jsii.String("IAM role for RDS Enhanced Monitoring"),
		Tags:             common.MergeTags(commonTags, map[string]*string{
			"ResourceType": jsii.String("IAMRole"),
			"Purpose":      jsii.String("RDSMonitoring"),
		}),
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(scope, jsii.String("rds-enhanced-monitoring"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      rdsRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"),
	})

	return &IAMRoles{
		LambdaExecutionRole:       lambdaRole,
		EC2InstanceRole:           ec2Role,
		RDSEnhancedMonitoringRole: rdsRole,
	}
}
```

## modules/networking/vpc.go

```go
package networking

import (
	"fmt"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpcflowlog"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"aws-secure-infrastructure/modules/common"
)

type NetworkingConfig struct {
	VpcCidr           string
	AvailabilityZones []string
	Tags              common.TagConfig
}

type NetworkingResources struct {
	VPC            vpc.Vpc
	PublicSubnets  []subnet.Subnet
	PrivateSubnets []subnet.Subnet
	InternetGW     internetgateway.InternetGateway
	NATGateways    []natgateway.NatGateway
}

func CreateNetworking(scope constructs.Construct, id string, config NetworkingConfig) *NetworkingResources {
	commonTags := common.GetCommonTags(config.Tags)

	// Create VPC
	mainVpc := vpc.NewVpc(scope, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String(config.VpcCidr),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags:               common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("secure-vpc"),
			"ResourceType": jsii.String("VPC"),
		}),
	})

	// Create Internet Gateway
	igw := internetgateway.NewInternetGateway(scope, jsii.String("internet-gateway"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVpc.Id(),
		Tags:  common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("secure-igw"),
			"ResourceType": jsii.String("InternetGateway"),
		}),
	})

	// Create subnets
	var publicSubnets []subnet.Subnet
	var privateSubnets []subnet.Subnet
	var natGateways []natgateway.NatGateway

	for i, az := range config.AvailabilityZones {
		// Public subnet
		publicCidr := fmt.Sprintf("10.0.%d.0/24", i*2+1)
		publicSubnet := subnet.NewSubnet(scope, jsii.String(fmt.Sprintf("public-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:                   mainVpc.Id(),
			CidrBlock:              jsii.String(publicCidr),
			AvailabilityZone:       jsii.String(az),
			MapPublicIpOnLaunch:    jsii.Bool(true),
			Tags:                   common.MergeTags(commonTags, map[string]*string{
				"Name":         jsii.String(fmt.Sprintf("secure-public-subnet-%d", i+1)),
				"Type":         jsii.String("Public"),
				"ResourceType": jsii.String("Subnet"),
			}),
		})
		publicSubnets = append(publicSubnets, publicSubnet)

		// Private subnet
		privateCidr := fmt.Sprintf("10.0.%d.0/24", i*2+2)
		privateSubnet := subnet.NewSubnet(scope, jsii.String(fmt.Sprintf("private-subnet-%d", i)), &subnet.SubnetConfig{
			VpcId:            mainVpc.Id(),
			CidrBlock:        jsii.String(privateCidr),
			AvailabilityZone: jsii.String(az),
			Tags:             common.MergeTags(commonTags, map[string]*string{
				"Name":         jsii.String(fmt.Sprintf("secure-private-subnet-%d", i+1)),
				"Type":         jsii.String("Private"),
				"ResourceType": jsii.String("Subnet"),
			}),
		})
		privateSubnets = append(privateSubnets, privateSubnet)

		// Elastic IP for NAT Gateway
		natEip := eip.NewEip(scope, jsii.String(fmt.Sprintf("nat-eip-%d", i)), &eip.EipConfig{
			Domain: jsii.String("vpc"),
			Tags:   common.MergeTags(commonTags, map[string]*string{
				"Name":         jsii.String(fmt.Sprintf("secure-nat-eip-%d", i+1)),
				"ResourceType": jsii.String("ElasticIP"),
			}),
		})

		// NAT Gateway
		natGw := natgateway.NewNatGateway(scope, jsii.String(fmt.Sprintf("nat-gateway-%d", i)), &natgateway.NatGatewayConfig{
			AllocationId: natEip.Id(),
			SubnetId:     publicSubnet.Id(),
			Tags:         common.MergeTags(commonTags, map[string]*string{
				"Name":         jsii.String(fmt.Sprintf("secure-nat-gw-%d", i+1)),
				"ResourceType": jsii.String("NATGateway"),
			}),
		})
		natGateways = append(natGateways, natGw)
	}

	// Create route tables
	// Public route table
	publicRT := routetable.NewRouteTable(scope, jsii.String("public-route-table"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags:  common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("secure-public-rt"),
			"Type":         jsii.String("Public"),
			"ResourceType": jsii.String("RouteTable"),
		}),
	})

	// Public route to Internet Gateway
	route.NewRoute(scope, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRT.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnets with public route table
	for i, pubSubnet := range publicSubnets {
		routetableassociation.NewRouteTableAssociation(scope, jsii.String(fmt.Sprintf("public-rt-association-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     pubSubnet.Id(),
			RouteTableId: publicRT.Id(),
		})
	}

	// Private route tables (one per AZ for high availability)
	for i, natGw := range natGateways {
		privateRT := routetable.NewRouteTable(scope, jsii.String(fmt.Sprintf("private-route-table-%d", i)), &routetable.RouteTableConfig{
			VpcId: mainVpc.Id(),
			Tags:  common.MergeTags(commonTags, map[string]*string{
				"Name":         jsii.String(fmt.Sprintf("secure-private-rt-%d", i+1)),
				"Type":         jsii.String("Private"),
				"ResourceType": jsii.String("RouteTable"),
			}),
		})

		// Private route to NAT Gateway
		route.NewRoute(scope, jsii.String(fmt.Sprintf("private-route-%d", i)), &route.RouteConfig{
			RouteTableId:         privateRT.Id(),
			DestinationCidrBlock: jsii.String("0.0.0.0/0"),
			NatGatewayId:         natGw.Id(),
		})

		// Associate private subnet with private route table
		routetableassociation.NewRouteTableAssociation(scope, jsii.String(fmt.Sprintf("private-rt-association-%d", i)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     privateSubnets[i].Id(),
			RouteTableId: privateRT.Id(),
		})
	}

	// VPC Flow Logs
	flowLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(scope, jsii.String("vpc-flow-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String("/aws/vpc/flowlogs"),
		RetentionInDays: jsii.Number(30),
		Tags:            common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("vpc-flow-logs"),
			"ResourceType": jsii.String("CloudWatchLogGroup"),
		}),
	})

	vpcflowlog.NewVpcFlowLog(scope, jsii.String("vpc-flow-log"), &vpcflowlog.VpcFlowLogConfig{
		IamRoleArn:               jsii.String("arn:aws:iam::123456789012:role/flowlogsRole"), // Replace with actual role
		LogDestination:           flowLogGroup.Arn(),
		LogDestinationType:       jsii.String("cloud-watch-logs"),
		ResourceId:               mainVpc.Id(),
		ResourceType:             jsii.String("VPC"),
		TrafficType:              jsii.String("ALL"),
		LogFormat:                jsii.String("${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${windowstart} ${windowend} ${action} ${flowlogstatus}"),
		MaxAggregationInterval:   jsii.Number(60),
		Tags:                     common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("vpc-flow-log"),
			"ResourceType": jsii.String("VPCFlowLog"),
		}),
	})

	return &NetworkingResources{
		VPC:            mainVpc,
		PublicSubnets:  publicSubnets,
		PrivateSubnets: privateSubnets,
		InternetGW:     igw,
		NATGateways:    natGateways,
	}
}
```

## modules/security/security_groups.go

```go
package security

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygrouprule"
	"aws-secure-infrastructure/modules/common"
)

type SecurityGroupConfig struct {
	VpcId           string
	AllowedCidrBlocks []string
	Tags            common.TagConfig
}

type SecurityGroups struct {
	WebSecurityGroup      securitygroup.SecurityGroup
	DatabaseSecurityGroup securitygroup.SecurityGroup
	LambdaSecurityGroup   securitygroup.SecurityGroup
}

func CreateSecurityGroups(scope constructs.Construct, id string, config SecurityGroupConfig) *SecurityGroups {
	commonTags := common.GetCommonTags(config.Tags)

	// Web Security Group
	webSG := securitygroup.NewSecurityGroup(scope, jsii.String("web-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("secure-web-sg"),
		Description: jsii.String("Security group for web servers with restricted access"),
		VpcId:       jsii.String(config.VpcId),
		Tags:        common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("secure-web-sg"),
			"Purpose":      jsii.String("WebServer"),
			"ResourceType": jsii.String("SecurityGroup"),
		}),
	})

	// Web Security Group Rules - Inbound
	for i, cidr := range config.AllowedCidrBlocks {
		// HTTPS
		securitygrouprule.NewSecurityGroupRule(scope, jsii.String("web-https-inbound-"+string(rune(i))), &securitygrouprule.SecurityGroupRuleConfig{
			Type:              jsii.String("ingress"),
			FromPort:          jsii.Number(443),
			ToPort:            jsii.Number(443),
			Protocol:          jsii.String("tcp"),
			CidrBlocks:        &[]*string{jsii.String(cidr)},
			SecurityGroupId:   webSG.Id(),
			Description:       jsii.String("HTTPS access from approved networks"),
		})

		// HTTP (redirect to HTTPS)
		securitygrouprule.NewSecurityGroupRule(scope, jsii.String("web-http-inbound-"+string(rune(i))), &securitygrouprule.SecurityGroupRuleConfig{
			Type:              jsii.String("ingress"),
			FromPort:          jsii.Number(80),
			ToPort:            jsii.Number(80),
			Protocol:          jsii.String("tcp"),
			CidrBlocks:        &[]*string{jsii.String(cidr)},
			SecurityGroupId:   webSG.Id(),
			Description:       jsii.String("HTTP access for redirect to HTTPS"),
		})
	}

	// Web Security Group Rules - Outbound (restrictive)
	securitygrouprule.NewSecurityGroupRule(scope, jsii.String("web-https-outbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: webSG.Id(),
		Description:     jsii.String("HTTPS outbound for API calls and updates"),
	})

	securitygrouprule.NewSecurityGroupRule(scope, jsii.String("web-dns-outbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(53),
		ToPort:          jsii.Number(53),
		Protocol:        jsii.String("udp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: webSG.Id(),
		Description:     jsii.String("DNS resolution"),
	})

	// Database Security Group
	dbSG := securitygroup.NewSecurityGroup(scope, jsii.String("database-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("secure-database-sg"),
		Description: jsii.String("Security group for database servers with application access only"),
		VpcId:       jsii.String(config.VpcId),
		Tags:        common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("secure-database-sg"),
			"Purpose":      jsii.String("Database"),
			"ResourceType": jsii.String("SecurityGroup"),
		}),
	})

	// Database Security Group Rules - Inbound (only from web SG)
	securitygrouprule.NewSecurityGroupRule(scope, jsii.String("db-mysql-inbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                     jsii.String("ingress"),
		FromPort:                 jsii.Number(3306),
		ToPort:                   jsii.Number(3306),
		Protocol:                 jsii.String("tcp"),
		SourceSecurityGroupId:    webSG.Id(),
		SecurityGroupId:          dbSG.Id(),
		Description:              jsii.String("MySQL access from web servers only"),
	})

	securitygrouprule.NewSecurityGroupRule(scope, jsii.String("db-postgres-inbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                     jsii.String("ingress"),
		FromPort:                 jsii.Number(5432),
		ToPort:                   jsii.Number(5432),
		Protocol:                 jsii.String("tcp"),
		SourceSecurityGroupId:    webSG.Id(),
		SecurityGroupId:          dbSG.Id(),
		Description:              jsii.String("PostgreSQL access from web servers only"),
	})

	// Lambda Security Group
	lambdaSG := securitygroup.NewSecurityGroup(scope, jsii.String("lambda-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("secure-lambda-sg"),
		Description: jsii.String("Security group for Lambda functions with restricted network access"),
		VpcId:       jsii.String(config.VpcId),
		Tags:        common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("secure-lambda-sg"),
			"Purpose":      jsii.String("Lambda"),
			"ResourceType": jsii.String("SecurityGroup"),
		}),
	})

	// Lambda Security Group Rules - Outbound only
	securitygrouprule.NewSecurityGroupRule(scope, jsii.String("lambda-https-outbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: lambdaSG.Id(),
		Description:     jsii.String("HTTPS outbound for AWS API calls"),
	})

	securitygrouprule.NewSecurityGroupRule(scope, jsii.String("lambda-db-outbound"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                        jsii.String("egress"),
		FromPort:                    jsii.Number(3306),
		ToPort:                      jsii.Number(5432),
		Protocol:                    jsii.String("tcp"),
		SourceSecurityGroupId:       dbSG.Id(),
		SecurityGroupId:             lambdaSG.Id(),
		Description:                 jsii.String("Database access for Lambda functions"),
	})

	return &SecurityGroups{
		WebSecurityGroup:      webSG,
		DatabaseSecurityGroup: dbSG,
		LambdaSecurityGroup:   lambdaSG,
	}
}
```

## modules/storage/s3.go

```go
package storage

import (
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketlogging"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketnotification"
	"aws-secure-infrastructure/modules/common"
)

type S3Config struct {
	KmsKeyId string
	Tags     common.TagConfig
}

type S3Resources struct {
	ApplicationBucket s3bucket.S3Bucket
	LoggingBucket     s3bucket.S3Bucket
	BackupBucket      s3bucket.S3Bucket
}

func CreateS3Buckets(scope constructs.Construct, id string, config S3Config) *S3Resources {
	commonTags := common.GetCommonTags(config.Tags)

	// Logging bucket (for access logs)
	loggingBucket := s3bucket.NewS3Bucket(scope, jsii.String("logging-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String("secure-app-logs-bucket-unique-12345"),
		Tags:   common.MergeTags(commonTags, map[string]*string{
			"Name":         jsii.String("secure-logging-bucket"),
			"Purpose":      jsii.String("AccessLogging"),
			"ResourceType": jsii.String("S3Bucket"),
		}),
	})

	// Block all public access for