I'll create a comprehensive security-focused AWS infrastructure using CDKTF with Go that meets all your requirements. Here's the complete implementation:

## main.go

```go
package main

import (
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	// Get environment suffix from environment variable, default to "dev"
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}

	// Create stack with format TapStack{environmentSuffix}
	stackName := "TapStack" + environmentSuffix
	NewTapStack(app, stackName, &TapStackConfig{
		Region:          jsii.String("us-east-1"),
		Environment:     jsii.String(environmentSuffix),
		Project:         jsii.String("tap"),
		Owner:           jsii.String("infrastructure-team"),
		CostCenter:      jsii.String("engineering"),
		VpcCidr:         jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			// Add your organization's IP ranges here
			// jsii.String("203.0.113.0/24"), // Example office IP range
		},
	})

	app.Synth()
}
```

## tap-stack.go

```go
package main

import (
	"fmt"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawscalleridentity"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/networkacl"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/networkaclrule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/secretsmanagersecret"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygrouprule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
)

type TapStackConfig struct {
	Region          *string
	Environment     *string
	Project         *string
	Owner           *string
	CostCenter      *string
	VpcCidr         *string
	AllowedIpRanges []*string
}

func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Configure S3 backend using environment variables
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states"
	}

	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1"
	}

	stateKey := fmt.Sprintf("%s/%s.tfstate", *config.Environment, id)

	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket: jsii.String(stateBucket),
		Key:    jsii.String(stateKey),
		Region: jsii.String(stateBucketRegion),
	})

	// AWS Provider configuration - hard requirement for us-east-1
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String("us-east-1"),
		DefaultTags: &provider.AwsProviderDefaultTags{
			Tags: &map[string]*string{
				"Environment": config.Environment,
				"Project":     config.Project,
				"Owner":       config.Owner,
				"CostCenter":  config.CostCenter,
				"ManagedBy":   jsii.String("cdktf"),
				"Compliance":  jsii.String("FIPS-140-3-Level-3"),
			},
		},
	})

	// Data sources
	currentIdentity := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{})
	availabilityZones := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("available"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Common tags for all resources
	commonTags := &map[string]*string{
		"Environment": config.Environment,
		"Project":     config.Project,
		"Owner":       config.Owner,
		"CostCenter":  config.CostCenter,
		"ManagedBy":   jsii.String("cdktf"),
		"Compliance":  jsii.String("FIPS-140-3-Level-3"),
	}

	// =============================================================================
	// KMS KEYS - Customer-managed keys for all encryption needs
	// =============================================================================

	// KMS Key for S3 encryption
	s3KmsKey := kmskey.NewKmsKey(stack, jsii.String("s3-kms-key"), &kmskey.KmsKeyConfig{
		Description:           jsii.String(fmt.Sprintf("KMS key for S3 bucket encryption - %s", *config.Environment)),
		DeletionWindowInDays:  jsii.Number(30), // 30-day deletion window for production safety
		EnableKeyRotation:     jsii.Bool(true),
		MultiRegion:          jsii.Bool(false), // Single region deployment
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow S3 Service",
					"Effect": "Allow",
					"Principal": {
						"Service": "s3.amazonaws.com"
					},
					"Action": [
						"kms:Decrypt",
						"kms:GenerateDataKey",
						"kms:CreateGrant"
					],
					"Resource": "*"
				}
			]
		}`, *currentIdentity.AccountId())),
		Tags: commonTags,
	})

	kmsalias.NewKmsAlias(stack, jsii.String("s3-kms-key-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String(fmt.Sprintf("alias/tap-s3-%s", *config.Environment)),
		TargetKeyId:  s3KmsKey.KeyId(),
	})

	// KMS Key for CloudWatch Logs and CloudTrail
	logsKmsKey := kmskey.NewKmsKey(stack, jsii.String("logs-kms-key"), &kmskey.KmsKeyConfig{
		Description:           jsii.String(fmt.Sprintf("KMS key for CloudWatch Logs and CloudTrail encryption - %s", *config.Environment)),
		DeletionWindowInDays:  jsii.Number(30),
		EnableKeyRotation:     jsii.Bool(true),
		MultiRegion:          jsii.Bool(false),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow CloudWatch Logs",
					"Effect": "Allow",
					"Principal": {
						"Service": "logs.us-east-1.amazonaws.com"
					},
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:CreateGrant",
						"kms:DescribeKey"
					],
					"Resource": "*"
				},
				{
					"Sid": "Allow CloudTrail",
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudtrail.amazonaws.com"
					},
					"Action": [
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*"
				}
			]
		}`, *currentIdentity.AccountId())),
		Tags: commonTags,
	})

	kmsalias.NewKmsAlias(stack, jsii.String("logs-kms-key-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String(fmt.Sprintf("alias/tap-logs-%s", *config.Environment)),
		TargetKeyId:  logsKmsKey.KeyId(),
	})

	// KMS Key for RDS encryption
	rdsKmsKey := kmskey.NewKmsKey(stack, jsii.String("rds-kms-key"), &kmskey.KmsKeyConfig{
		Description:           jsii.String(fmt.Sprintf("KMS key for RDS encryption - %s", *config.Environment)),
		DeletionWindowInDays:  jsii.Number(30),
		EnableKeyRotation:     jsii.Bool(true),
		MultiRegion:          jsii.Bool(false),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow RDS Service",
					"Effect": "Allow",
					"Principal": {
						"Service": "rds.amazonaws.com"
					},
					"Action": [
						"kms:Decrypt",
						"kms:GenerateDataKey",
						"kms:CreateGrant"
					],
					"Resource": "*",
					"Condition": {
						"StringEquals": {
							"kms:ViaService": "rds.us-east-1.amazonaws.com"
						}
					}
				}
			]
		}`, *currentIdentity.AccountId())),
		Tags: commonTags,
	})

	kmsalias.NewKmsAlias(stack, jsii.String("rds-kms-key-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String(fmt.Sprintf("alias/tap-rds-%s", *config.Environment)),
		TargetKeyId:  rdsKmsKey.KeyId(),
	})

	// =============================================================================
	// NETWORK INFRASTRUCTURE
	// =============================================================================

	// VPC with DNS support enabled for RDS and other services
	mainVpc := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          config.VpcCidr,
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-main-vpc-%s", *config.Environment)),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// Internet Gateway for public subnet internet access
	internetGw := internetgateway.NewInternetGateway(stack, jsii.String("internet-gateway"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-igw-%s", *config.Environment)),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// Public Subnets (2 AZs for high availability)
	publicSubnet1 := subnet.NewSubnet(stack, jsii.String("public-subnet-1"), &subnet.SubnetConfig{
		VpcId:                   mainVpc.Id(),
		CidrBlock:              jsii.String("10.0.1.0/24"),
		AvailabilityZone:       jsii.String(*availabilityZones.Names().Get(jsii.Number(0))),
		MapPublicIpOnLaunch:    jsii.Bool(true), // NAT gateways need public IPs
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-public-subnet-1-%s", *config.Environment)),
			"Type":        jsii.String("public"),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	publicSubnet2 := subnet.NewSubnet(stack, jsii.String("public-subnet-2"), &subnet.SubnetConfig{
		VpcId:                   mainVpc.Id(),
		CidrBlock:              jsii.String("10.0.2.0/24"),
		AvailabilityZone:       jsii.String(*availabilityZones.Names().Get(jsii.Number(1))),
		MapPublicIpOnLaunch:    jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-public-subnet-2-%s", *config.Environment)),
			"Type":        jsii.String("public"),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// Private Subnets (2 AZs for high availability)
	privateSubnet1 := subnet.NewSubnet(stack, jsii.String("private-subnet-1"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.10.0/24"),
		AvailabilityZone: jsii.String(*availabilityZones.Names().Get(jsii.Number(0))),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-private-subnet-1-%s", *config.Environment)),
			"Type":        jsii.String("private"),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	privateSubnet2 := subnet.NewSubnet(stack, jsii.String("private-subnet-2"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.11.0/24"),
		AvailabilityZone: jsii.String(*availabilityZones.Names().Get(jsii.Number(1))),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-private-subnet-2-%s", *config.Environment)),
			"Type":        jsii.String("private"),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// Elastic IP for NAT Gateway (using single NAT for cost optimization, but can be expanded)
	natEip := eip.NewEip(stack, jsii.String("nat-eip"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-nat-eip-%s", *config.Environment)),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
		DependsOn: &[]cdktf.ITerraformDependable{internetGw},
	})

	// NAT Gateway in first public subnet for private subnet internet access
	// Note: For true HA, deploy one NAT gateway per AZ, but this increases costs
	natGateway := natgateway.NewNatGateway(stack, jsii.String("nat-gateway"), &natgateway.NatGatewayConfig{
		AllocationId: natEip.Id(),
		SubnetId:     publicSubnet1.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-nat-gateway-%s", *config.Environment)),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
		DependsOn: &[]cdktf.ITerraformDependable{internetGw},
	})

	// Route Tables
	publicRouteTable := routetable.NewRouteTable(stack, jsii.String("public-route-table"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-public-rt-%s", *config.Environment)),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	privateRouteTable := routetable.NewRouteTable(stack, jsii.String("private-route-table"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-private-rt-%s", *config.Environment)),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// Routes
	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRouteTable.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:           internetGw.Id(),
	})

	route.NewRoute(stack, jsii.String("private-route"), &route.RouteConfig{
		RouteTableId:         privateRouteTable.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:        natGateway.Id(),
	})

	// Route Table Associations
	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-subnet-1-association"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet1.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-subnet-2-association"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-subnet-1-association"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet1.Id(),
		RouteTableId: privateRouteTable.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-subnet-2-association"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRouteTable.Id(),
	})

	// =============================================================================
	// SECURITY GROUPS - Principle of least privilege
	// =============================================================================

	// Web tier security group - allows HTTP/HTTPS from allowed IP ranges only
	webSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("web-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-web-sg-%s", *config.Environment)),
		Description: jsii.String("Security group for web tier - allows HTTP/HTTPS from allowed IPs only"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-web-sg-%s", *config.Environment)),
			"Tier":        jsii.String("web"),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// App tier security group - allows traffic from web tier only
	appSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("app-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-app-sg-%s", *config.Environment)),
		Description: jsii.String("Security group for application tier - allows traffic from web tier only"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-app-sg-%s", *config.Environment)),
			"Tier":        jsii.String("app"),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// Database security group - allows traffic from app tier only
	dbSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("db-security-group"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-db-sg-%s", *config.Environment)),
		Description: jsii.String("Security group for database tier - allows traffic from app tier only"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name":        jsii.String(fmt.Sprintf("tap-db-sg-%s", *config.Environment)),
			"Tier":        jsii.String("database"),
			"Environment": config.Environment,
			"Project":     config.Project,
			"Owner":       config.Owner,
			"CostCenter":  config.CostCenter,
			"ManagedBy":   jsii.String("cdktf"),
			"Compliance":  jsii.String("FIPS-140-3-Level-3"),
		},
	})

	// Security Group Rules for Web Tier
	if len(config.AllowedIpRanges) > 0 {
		for i, ipRange := range config.AllowedIpRanges {
			// HTTPS access from allowed IPs
			securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-https-ingress-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
				Type:              jsii.String("ingress"),
				FromPort:          jsii.Number(443),
				ToPort:            jsii.Number(443),
				Protocol:          jsii.String("tcp"),
				CidrBlocks:        &[]*string{ipRange},
				SecurityGroupId:   webSecurityGroup.Id(),
				Description:       jsii.String(fmt.Sprintf("HTTPS access from allowed IP range %d", i+1)),
			})

			// HTTP access from allowed IPs (consider redirecting to HTTPS in production)
			securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-http-ingress-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
				Type:              jsii.String("ingress"),
				FromPort:          jsii.Number(80),
				ToPort:            jsii.Number(80),
				Protocol:          jsii.String("tcp"),
				CidrBlocks:        &[]*string{ipRange},
				SecurityGroupId:   webSecurityGroup.Id(),
				Description:       jsii.String(fmt.Sprintf("HTTP access from allowed IP range %d", i+1)),
			})

			// SSH access from allowed IPs for management
			securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-ssh-ingress-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
				Type:              jsii.String("ingress"),
				FromPort:          jsii.Number(22),
				ToPort:            jsii.Number(22),
				Protocol:          jsii.String("tcp"),
				CidrBlocks:        &[]*string{ipRange},
				SecurityGroupId:   webSecurityGroup.Id(),
				Description:       jsii.String(fmt.Sprintf("SSH access from allowed IP range %d", i+1)),
			})
		}
	}

	// Web tier egress - allow all outbound (for package updates, API calls, etc.)
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("web-egress-all"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(0),
		ToPort:          jsii.Number(65535),
		Protocol:        jsii.String("-1"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: webSecurityGroup.Id(),
		Description:     jsii.String("All outbound traffic for web tier"),
	})

	// App tier ingress - from web tier only
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("app-ingress-from-web"), &securitygrouprule.SecurityGroupRuleConfig{