## tap-stack.go

```go
package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygrouprule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
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

func NewTapStack(scope cdktf.App, id *string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, id)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}
	environmentSuffix = fmt.Sprintf("cdktf-%s", environmentSuffix)

	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: config.Region,
		DefaultTags: &[]*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment": config.Environment,
					"Project":     config.Project,
					"Owner":       config.Owner,
					"CostCenter":  config.CostCenter,
					"ManagedBy":   jsii.String("cdktf"),
				},
			},
		},
	})

	// S3 Backend for remote state
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states"
	}
	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1"
	}

	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket:  jsii.String(stateBucket),
		Key:     jsii.String(fmt.Sprintf("%s/TapStack%s.tfstate", environmentSuffix, environmentSuffix)),
		Region:  jsii.String(stateBucketRegion),
		Encrypt: jsii.Bool(true),
	})

	// Get availability zones
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("azs"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Create KMS Keys for encryption
	// S3 KMS Key
	s3KmsKey := kmskey.NewKmsKey(stack, jsii.String("s3-kms-key"), &kmskey.KmsKeyConfig{
		Description:          jsii.String(fmt.Sprintf("KMS key for S3 encryption - %s", *config.Environment)),
		DeletionWindowInDays: jsii.Number(30), // 30 days for production safety
		EnableKeyRotation:    jsii.Bool(true),
		Policy: jsii.String(`{
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Enable IAM User Permissions",
                "Effect": "Allow",
                "Principal": {"AWS": "arn:aws:iam::` + getAccountId() + `:root"},
                "Action": "kms:*",
                "Resource": "*"
            },
            {
                "Sid": "Allow S3 Service",
                "Effect": "Allow",
                "Principal": {"Service": "s3.amazonaws.com"},
                "Action": [
                    "kms:Decrypt",
                    "kms:GenerateDataKey"
                ],
                "Resource": "*"
            },
            {
                "Sid": "Allow CloudTrail to encrypt logs",
                "Effect": "Allow",
                "Principal": {"Service": "cloudtrail.amazonaws.com"},
                "Action": [
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey",
                    "kms:Encrypt",
                    "kms:ReEncrypt*",
                    "kms:Decrypt"
                ],
                "Resource": "*"
            }
        ]
    }`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-s3-kms-%s", *config.Environment)),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("s3-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/tap-s3-%s", *config.Environment)),
		TargetKeyId: s3KmsKey.KeyId(),
	})

	// Logs KMS Key
	logsKmsKey := kmskey.NewKmsKey(stack, jsii.String("logs-kms-key"), &kmskey.KmsKeyConfig{
		Description:          jsii.String(fmt.Sprintf("KMS key for CloudWatch Logs encryption - %s", *config.Environment)),
		DeletionWindowInDays: jsii.Number(30),
		EnableKeyRotation:    jsii.Bool(true),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {"AWS": "arn:aws:iam::` + getAccountId() + `:root"},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow CloudWatch Logs",
					"Effect": "Allow",
					"Principal": {"Service": "logs.` + *config.Region + `.amazonaws.com"},
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-logs-kms-%s", *config.Environment)),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("logs-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/tap-logs-%s", *config.Environment)),
		TargetKeyId: logsKmsKey.KeyId(),
	})

	// RDS KMS Key
	rdsKmsKey := kmskey.NewKmsKey(stack, jsii.String("rds-kms-key"), &kmskey.KmsKeyConfig{
		Description:          jsii.String(fmt.Sprintf("KMS key for RDS encryption - %s", *config.Environment)),
		DeletionWindowInDays: jsii.Number(30),
		EnableKeyRotation:    jsii.Bool(true),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {"AWS": "arn:aws:iam::` + getAccountId() + `:root"},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow RDS Service",
					"Effect": "Allow",
					"Principal": {"Service": "rds.amazonaws.com"},
					"Action": [
						"kms:Decrypt",
						"kms:GenerateDataKey"
					],
					"Resource": "*"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-rds-kms-%s", *config.Environment)),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("rds-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/tap-rds-%s", *config.Environment)),
		TargetKeyId: rdsKmsKey.KeyId(),
	})

	// VPC
	mainVpc := vpc.NewVpc(stack, jsii.String("main-vpc"), &vpc.VpcConfig{
		CidrBlock:          config.VpcCidr,
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-main-vpc-%s", *config.Environment)),
		},
	})

	// Internet Gateway
	igw := internetgateway.NewInternetGateway(stack, jsii.String("igw"), &internetgateway.InternetGatewayConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-igw-%s", *config.Environment)),
		},
	})

	// Public Subnets (2 AZs for high availability)
	publicSubnet1 := subnet.NewSubnet(stack, jsii.String("public-subnet-1"), &subnet.SubnetConfig{
		VpcId:               mainVpc.Id(),
		CidrBlock:           jsii.String("10.0.1.0/24"),
		AvailabilityZone:    jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(0)).(string)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-public-subnet-1-%s", *config.Environment)),
			"Type": jsii.String("public"),
		},
	})

	publicSubnet2 := subnet.NewSubnet(stack, jsii.String("public-subnet-2"), &subnet.SubnetConfig{
		VpcId:               mainVpc.Id(),
		CidrBlock:           jsii.String("10.0.2.0/24"),
		AvailabilityZone:    jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(1)).(string)),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-public-subnet-2-%s", *config.Environment)),
			"Type": jsii.String("public"),
		},
	})

	// Private Subnets (2 AZs for high availability)
	privateSubnet1 := subnet.NewSubnet(stack, jsii.String("private-subnet-1"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.10.0/24"),
		AvailabilityZone: jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(0)).(string)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-private-subnet-1-%s", *config.Environment)),
			"Type": jsii.String("private"),
		},
	})

	privateSubnet2 := subnet.NewSubnet(stack, jsii.String("private-subnet-2"), &subnet.SubnetConfig{
		VpcId:            mainVpc.Id(),
		CidrBlock:        jsii.String("10.0.11.0/24"),
		AvailabilityZone: jsii.String(cdktf.Fn_Element(azs.Names(), jsii.Number(1)).(string)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-private-subnet-2-%s", *config.Environment)),
			"Type": jsii.String("private"),
		},
	})

	// Elastic IPs for NAT Gateways
	natEip1 := eip.NewEip(stack, jsii.String("nat-eip-1"), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-nat-eip-1-%s", *config.Environment)),
		},
		DependsOn: &[]cdktf.ITerraformDependable{igw},
	})

	// NAT Gateway in first public subnet (single NAT for cost optimization, can be extended to multi-AZ)
	// For production, consider deploying NAT gateways in both AZs for higher availability
	natGw1 := natgateway.NewNatGateway(stack, jsii.String("nat-gw-1"), &natgateway.NatGatewayConfig{
		AllocationId: natEip1.Id(),
		SubnetId:     publicSubnet1.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-nat-gw-1-%s", *config.Environment)),
		},
		DependsOn: &[]cdktf.ITerraformDependable{igw},
	})

	// Route Tables
	publicRt := routetable.NewRouteTable(stack, jsii.String("public-rt"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-public-rt-%s", *config.Environment)),
		},
	})

	privateRt := routetable.NewRouteTable(stack, jsii.String("private-rt"), &routetable.RouteTableConfig{
		VpcId: mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-private-rt-%s", *config.Environment)),
		},
	})

	// Routes
	route.NewRoute(stack, jsii.String("public-route"), &route.RouteConfig{
		RouteTableId:         publicRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	route.NewRoute(stack, jsii.String("private-route"), &route.RouteConfig{
		RouteTableId:         privateRt.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGw1.Id(),
	})

	// Route Table Associations
	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-rt-assoc-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet1.Id(),
		RouteTableId: publicRt.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("public-rt-assoc-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRt.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-rt-assoc-1"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet1.Id(),
		RouteTableId: privateRt.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("private-rt-assoc-2"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet2.Id(),
		RouteTableId: privateRt.Id(),
	})

	// Security Groups
	// Bastion/SSH Security Group - allows SSH from allowed IP ranges only
	bastionSg := securitygroup.NewSecurityGroup(stack, jsii.String("bastion-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-bastion-sg-%s", *config.Environment)),
		Description: jsii.String("Security group for bastion hosts - SSH access from allowed IPs only"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-bastion-sg-%s", *config.Environment)),
		},
	})

	// SSH ingress rules for each allowed IP range
	for i, ipRange := range config.AllowedIpRanges {
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("bastion-ssh-ingress-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
			Type:            jsii.String("ingress"),
			FromPort:        jsii.Number(22),
			ToPort:          jsii.Number(22),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{ipRange},
			SecurityGroupId: bastionSg.Id(),
		})
	}

	// Egress rule for bastion (HTTPS outbound for updates)
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("bastion-https-egress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: bastionSg.Id(),
	})

	// Application Load Balancer Security Group
	albSg := securitygroup.NewSecurityGroup(stack, jsii.String("alb-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-alb-sg-%s", *config.Environment)),
		Description: jsii.String("Security group for ALB - HTTP/HTTPS from allowed IPs only"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-alb-sg-%s", *config.Environment)),
		},
	})

	// HTTP/HTTPS ingress rules for ALB from allowed IP ranges
	for i, ipRange := range config.AllowedIpRanges {
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("alb-http-ingress-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
			Type:            jsii.String("ingress"),
			FromPort:        jsii.Number(80),
			ToPort:          jsii.Number(80),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{ipRange},
			SecurityGroupId: albSg.Id(),
		})

		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("alb-https-ingress-%d", i)), &securitygrouprule.SecurityGroupRuleConfig{
			Type:            jsii.String("ingress"),
			FromPort:        jsii.Number(443),
			ToPort:          jsii.Number(443),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{ipRange},
			SecurityGroupId: albSg.Id(),
		})
	}

	// Application Security Group
	appSg := securitygroup.NewSecurityGroup(stack, jsii.String("app-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-app-sg-%s", *config.Environment)),
		Description: jsii.String("Security group for application servers"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-app-sg-%s", *config.Environment)),
		},
	})

	// ALB egress to app servers
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("alb-app-egress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                  jsii.String("egress"),
		FromPort:              jsii.Number(8080),
		ToPort:                jsii.Number(8080),
		Protocol:              jsii.String("tcp"),
		SourceSecurityGroupId: appSg.Id(),
		SecurityGroupId:       albSg.Id(),
	})

	// App ingress from ALB
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("app-alb-ingress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                  jsii.String("ingress"),
		FromPort:              jsii.Number(8080),
		ToPort:                jsii.Number(8080),
		Protocol:              jsii.String("tcp"),
		SourceSecurityGroupId: albSg.Id(),
		SecurityGroupId:       appSg.Id(),
	})

	// App ingress SSH from bastion
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("app-ssh-ingress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                  jsii.String("ingress"),
		FromPort:              jsii.Number(22),
		ToPort:                jsii.Number(22),
		Protocol:              jsii.String("tcp"),
		SourceSecurityGroupId: bastionSg.Id(),
		SecurityGroupId:       appSg.Id(),
	})

	// App egress HTTPS for updates/API calls
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("app-https-egress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:            jsii.String("egress"),
		FromPort:        jsii.Number(443),
		ToPort:          jsii.Number(443),
		Protocol:        jsii.String("tcp"),
		CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
		SecurityGroupId: appSg.Id(),
	})

	// Database Security Group
	dbSg := securitygroup.NewSecurityGroup(stack, jsii.String("db-sg"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("tap-db-sg-%s", *config.Environment)),
		Description: jsii.String("Security group for RDS database - access from app tier only"),
		VpcId:       mainVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-db-sg-%s", *config.Environment)),
		},
	})

	// DB ingress from app servers only
	securitygrouprule.NewSecurityGroupRule(stack, jsii.String("db-app-ingress"), &securitygrouprule.SecurityGroupRuleConfig{
		Type:                  jsii.String("ingress"),
		FromPort:              jsii.Number(5432), // PostgreSQL port
		ToPort:                jsii.Number(5432),
		Protocol:              jsii.String("tcp"),
		SourceSecurityGroupId: appSg.Id(),
		SecurityGroupId:       dbSg.Id(),
	})

	// S3 Buckets with encryption and security policies
	// CloudTrail S3 Bucket
	cloudtrailBucket := s3bucket.NewS3Bucket(stack, jsii.String("cloudtrail-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-cloudtrail-logs-%s-%s", *config.Environment, generateRandomSuffix())),
		ServerSideEncryptionConfiguration: &s3bucket.S3BucketServerSideEncryptionConfiguration{
			Rule: &s3bucket.S3BucketServerSideEncryptionConfigurationRule{
				ApplyServerSideEncryptionByDefault: &s3bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm:   jsii.String("aws:kms"),
					KmsMasterKeyId: s3KmsKey.Arn(),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("tap-cloudtrail-bucket-%s", *config.Environment)),
			"Purpose": jsii.String("cloudtrail-logs"),
		},
	})

	// Block public access on CloudTrail bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("cloudtrail-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                jsii.String(*cloudtrailBucket.Id()),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// CloudTrail bucket policy - deny unencrypted uploads and insecure transport
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("cloudtrail-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: cloudtrailBucket.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "AWSCloudTrailAclCheck",
				"Effect": "Allow",
				"Principal": {"Service": "cloudtrail.amazonaws.com"},
				"Action": "s3:GetBucketAcl",
				"Resource": "%s"
			},
			{
				"Sid": "AWSCloudTrailWrite",
				"Effect": "Allow",
				"Principal": {"Service": "cloudtrail.amazonaws.com"},
				"Action": "s3:PutObject",
				"Resource": "%s/*",
				"Condition": {
					"StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
				}
			},
			{
				"Sid": "DenyInsecureConnections",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:*",
				"Resource": [
					"%s",
					"%s/*"
				],
				"Condition": {
					"Bool": {"aws:SecureTransport": "false"}
				}
			},
			{
				"Sid": "DenyUnencryptedObjectUploads",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:PutObject",
				"Resource": "%s/*",
				"Condition": {
					"StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}
				}
			}
		]
	}`, *cloudtrailBucket.Arn(), *cloudtrailBucket.Arn(), *cloudtrailBucket.Arn(), *cloudtrailBucket.Arn(), *cloudtrailBucket.Arn())),
	})

	// Application Data S3 Bucket
	appDataBucket := s3bucket.NewS3Bucket(stack, jsii.String("app-data-bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("tap-app-data-%s-%s", *config.Environment, generateRandomSuffix())),
		// force_destroy set to true only for dev/test environments - NEVER in production
		ForceDestroy: jsii.Bool(*config.Environment == "dev" || *config.Environment == "test"),
		ServerSideEncryptionConfiguration: &s3bucket.S3BucketServerSideEncryptionConfiguration{
			Rule: &s3bucket.S3BucketServerSideEncryptionConfigurationRule{
				ApplyServerSideEncryptionByDefault: &s3bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm:   jsii.String("aws:kms"),
					KmsMasterKeyId: s3KmsKey.Arn(),
				},
				BucketKeyEnabled: jsii.Bool(true),
			},
		},
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("tap-app-data-bucket-%s", *config.Environment)),
			"Purpose": jsii.String("application-data"),
		},
	})

	// Block public access on app data bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("app-data-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                jsii.String(*appDataBucket.Id()),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// App data bucket policy - deny unencrypted uploads and insecure transport
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("app-data-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: appDataBucket.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Sid": "DenyInsecureConnections",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:*",
				"Resource": [
					"%s",
					"%s/*"
				],
				"Condition": {
					"Bool": {"aws:SecureTransport": "false"}
				}
			},
			{
				"Sid": "DenyUnencryptedObjectUploads",
				"Effect": "Deny",
				"Principal": "*",
				"Action": "s3:PutObject",
				"Resource": "%s/*",
				"Condition": {
					"StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}
				}
			}
		]
	}`, *appDataBucket.Arn(), *appDataBucket.Arn(), *appDataBucket.Arn())),
	})

	// CloudWatch Log Group for CloudTrail
	cloudtrailLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("cloudtrail-log-group"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String(fmt.Sprintf("/aws/cloudtrail/tap-%s", *config.Environment)),
		RetentionInDays: jsii.Number(90), // 90 days retention for compliance
		KmsKeyId:        logsKmsKey.Arn(),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("tap-cloudtrail-logs-%s", *config.Environment)),
			"Purpose": jsii.String("cloudtrail-logs"),
		},
	})

	// IAM Role for CloudTrail
	// IAM Role for CloudTrail
	cloudtrailRole := iamrole.NewIamRole(stack, jsii.String("cloudtrail-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("tap-cloudtrail-role-%s", *config.Environment)),
		AssumeRolePolicy: jsii.String(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Principal": {"Service": "cloudtrail.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}
		]
	}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-cloudtrail-role-%s", *config.Environment)),
		},
	})

	// Separate IAM Role Policy for CloudTrail
	iamrolepolicy.NewIamRolePolicy(stack, jsii.String("cloudtrail-role-policy"), &iamrolepolicy.IamRolePolicyConfig{
		Name: jsii.String("CloudTrailLogsPolicy"),
		Role: cloudtrailRole.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Action": [
					"logs:CreateLogStream",
					"logs:PutLogEvents"
				],
				"Resource": "arn:aws:logs:%s:%s:log-group:/aws/cloudtrail/tap-%s:*"
			}
		]
	}`, *config.Region, getAccountId(), *config.Environment)),
	})

	// CloudTrail
	trail := cloudtrail.NewCloudtrail(stack, jsii.String("cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                       jsii.String(fmt.Sprintf("tap-cloudtrail-%s", *config.Environment)),
		S3BucketName:               cloudtrailBucket.Id(),
		S3KeyPrefix:                jsii.String("cloudtrail-logs"),
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:         jsii.Bool(true),
		EnableLogging:              jsii.Bool(true),
		EnableLogFileValidation:    jsii.Bool(true),
		CloudWatchLogsGroupArn:     jsii.String(fmt.Sprintf("%s:*", *cloudtrailLogGroup.Arn())),
		CloudWatchLogsRoleArn:      cloudtrailRole.Arn(),
		KmsKeyId:                   s3KmsKey.Arn(),

		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-cloudtrail-%s", *config.Environment)),
		},
	})

	// DB Subnet Group for RDS
	dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String("db-subnet-group"), &dbsubnetgroup.DbSubnetGroupConfig{
		Name:      jsii.String(fmt.Sprintf("tap-db-subnet-group-%s", *config.Environment)),
		SubnetIds: &[]*string{privateSubnet1.Id(), privateSubnet2.Id()},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-db-subnet-group-%s", *config.Environment)),
		},
	})

	// RDS PostgreSQL Instance
	rdsInstance := dbinstance.NewDbInstance(stack, jsii.String("rds-instance"), &dbinstance.DbInstanceConfig{
		Identifier:          jsii.String(fmt.Sprintf("tap-postgres-%s", *config.Environment)),
		Engine:              jsii.String("postgres"),
		InstanceClass:       jsii.String("db.t3.micro"), // Use appropriate size for your workload
		AllocatedStorage:    jsii.Number(20),
		MaxAllocatedStorage: jsii.Number(100),
		StorageType:         jsii.String("gp3"),
		StorageEncrypted:    jsii.Bool(true),
		KmsKeyId:            rdsKmsKey.Arn(),

		DbName:   jsii.String("tapdb"),
		Username: jsii.String("tapuser"),
		Password: jsii.String("ChangeMe123!"), // In production, use Secrets Manager or SSM Parameter Store

		VpcSecurityGroupIds: &[]*string{dbSg.Id()},
		DbSubnetGroupName:   dbSubnetGroup.Name(),

		BackupRetentionPeriod: jsii.Number(7),                     // 7 days backup retention
		BackupWindow:          jsii.String("03:00-04:00"),         // UTC backup window
		MaintenanceWindow:     jsii.String("sun:04:00-sun:05:00"), // UTC maintenance window

		MultiAz:            jsii.Bool(true),  // Multi-AZ for high availability
		PubliclyAccessible: jsii.Bool(false), // Never publicly accessible

		DeletionProtection:      jsii.Bool(*config.Environment == "prod"), // Enable deletion protection for prod
		SkipFinalSnapshot:       jsii.Bool(*config.Environment != "prod"), // Skip final snapshot for non-prod
		FinalSnapshotIdentifier: jsii.String(fmt.Sprintf("tap-postgres-%s-final-snapshot", *config.Environment)),

		EnabledCloudwatchLogsExports: &[]*string{
			jsii.String("postgresql"),
		},

		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-postgres-%s", *config.Environment)),
		},
	})

	// IAM Role for EC2 instances (example application role)
	ec2Role := iamrole.NewIamRole(stack, jsii.String("ec2-app-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("tap-ec2-app-role-%s", *config.Environment)),
		AssumeRolePolicy: jsii.String(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Principal": {"Service": "ec2.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}
		]
	}`),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("tap-ec2-app-role-%s", *config.Environment)),
		},
	})

	// S3 Access Policy
	iamrolepolicy.NewIamRolePolicy(stack, jsii.String("ec2-s3-policy"), &iamrolepolicy.IamRolePolicyConfig{
		Name: jsii.String("S3AppDataAccess"),
		Role: ec2Role.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Action": [
					"s3:GetObject",
					"s3:PutObject",
					"s3:DeleteObject"
				],
				"Resource": "arn:aws:s3:::tap-app-data-%s-*/*"
			},
			{
				"Effect": "Allow",
				"Action": [
					"s3:ListBucket"
				],
				"Resource": "arn:aws:s3:::tap-app-data-%s-*"
			}
		]
	}`, *config.Environment, *config.Environment)),
	})

	// Secrets Manager Access Policy
	iamrolepolicy.NewIamRolePolicy(stack, jsii.String("ec2-secrets-policy"), &iamrolepolicy.IamRolePolicyConfig{
		Name: jsii.String("SecretsManagerAccess"),
		Role: ec2Role.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
		"Version": "2012-10-17",
		"Statement": [
			{
				"Effect": "Allow",
				"Action": [
					"secretsmanager:GetSecretValue"
				],
				"Resource": "arn:aws:secretsmanager:%s:%s:secret:tap/rds/master-password-%s-*"
			}
		]
	}`, *config.Region, getAccountId(), *config.Environment)),
	})

	// Attach AWS managed policy for CloudWatch agent (least privilege approach)
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("ec2-cloudwatch-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"),
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("vpc_id"), &cdktf.TerraformOutputConfig{
		Value:       mainVpc.Id(),
		Description: jsii.String("ID of the main VPC"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("public_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Tolist(&[]*string{publicSubnet1.Id(), publicSubnet2.Id()}),
		Description: jsii.String("IDs of the public subnets"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("private_subnet_ids"), &cdktf.TerraformOutputConfig{
		Value:       cdktf.Fn_Tolist(&[]*string{privateSubnet1.Id(), privateSubnet2.Id()}),
		Description: jsii.String("IDs of the private subnets"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("nat_gateway_id"), &cdktf.TerraformOutputConfig{
		Value:       natGw1.Id(),
		Description: jsii.String("ID of the NAT Gateway"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("security_group_ids"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_Tomap(&map[string]interface{}{
			"bastion": bastionSg.Id(),
			"alb":     albSg.Id(),
			"app":     appSg.Id(),
			"db":      dbSg.Id(),
		}),
		Description: jsii.String("Security Group IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("kms_key_arns"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_Tomap(&map[string]interface{}{
			"s3":   s3KmsKey.Arn(),
			"logs": logsKmsKey.Arn(),
			"rds":  rdsKmsKey.Arn(),
		}),
		Description: jsii.String("KMS Key ARNs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("kms_key_ids"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_Tomap(&map[string]interface{}{
			"s3":   s3KmsKey.KeyId(),
			"logs": logsKmsKey.KeyId(),
			"rds":  rdsKmsKey.KeyId(),
		}),
		Description: jsii.String("KMS Key IDs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("cloudtrail_arn"), &cdktf.TerraformOutputConfig{
		Value:       trail.Arn(),
		Description: jsii.String("CloudTrail ARN"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_endpoint"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Endpoint(),
		Description: jsii.String("RDS instance endpoint"),
		Sensitive:   jsii.Bool(true),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("rds_arn"), &cdktf.TerraformOutputConfig{
		Value:       rdsInstance.Arn(),
		Description: jsii.String("RDS instance ARN"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_names"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_Tomap(&map[string]interface{}{
			"cloudtrail": cloudtrailBucket.Id(),
			"app_data":   appDataBucket.Id(),
		}),
		Description: jsii.String("S3 Bucket Names"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("s3_bucket_arns"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_Tomap(&map[string]interface{}{
			"cloudtrail": cloudtrailBucket.Arn(),
			"app_data":   appDataBucket.Arn(),
		}),
		Description: jsii.String("S3 Bucket ARNs"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("iam_role_arns"), &cdktf.TerraformOutputConfig{
		Value: cdktf.Fn_Tomap(&map[string]interface{}{
			"cloudtrail": cloudtrailRole.Arn(),
			"ec2_app":    ec2Role.Arn(),
		}),
		Description: jsii.String("IAM Role ARNs"),
	})

	return stack
}

// Helper function to get AWS account ID - in production, you might want to use a data source
func getAccountId() string {
	// This is a placeholder - in real implementation, you would use:
	// dataawscalleridentity.NewDataAwsCallerIdentity() to get the account ID
	return "718240086340" // Replace with actual account ID or use data source
}

// Helper function to generate random suffix for unique resource names
func generateRandomSuffix() string {
	// In production, you might want to use a more sophisticated approach
	// or pass this as a parameter to ensure consistency across resources
	return "abc123" // Replace with actual random generation or consistent suffix
}
```

## main.go

```go
package main

import (
	"fmt"
	"os"

	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

func main() {
	app := cdktf.NewApp(nil)

	// Get environment suffix
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "dev"
	}
	environmentSuffix = fmt.Sprintf("cdktf-%s", environmentSuffix)

	// Create the main stack with comprehensive security configuration
	NewTapStack(app, jsii.String(fmt.Sprintf("TapStack%s", environmentSuffix)), &TapStackConfig{
		Region:      jsii.String("us-east-1"),
		Environment: jsii.String(environmentSuffix),
		Project:     jsii.String("tap"),
		Owner:       jsii.String("platform-team"),
		CostCenter:  jsii.String("engineering"),
		VpcCidr:     jsii.String("10.0.0.0/16"),
		AllowedIpRanges: []*string{
			// Example allowed IP ranges - replace with your actual IP ranges
			jsii.String("203.0.113.0/24"),  // Example office IP range
			jsii.String("198.51.100.0/24"), // Example VPN IP range
		},
	})

	app.Synth()
}
```