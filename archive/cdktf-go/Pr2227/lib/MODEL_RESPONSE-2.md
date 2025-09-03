You're right, the output was truncated. Here's the complete `SecureInfrastructure.yaml` CDKTF + Go template:

```go
package main

import (
	"fmt"
	"log"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawscalleridentity"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsregion"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsami"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/ec2instance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamgrouppolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iaminstanceprofile"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamuser"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamgroupmembership"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lb"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lbtargetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lblistener"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lbtargetgroupattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketlogging"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
)

// SecureInfrastructureStack represents our complete secure infrastructure
type SecureInfrastructureStack struct {
	cdktf.TerraformStack
	project     string
	environment string
	region      string
}

// NewSecureInfrastructureStack creates a new secure infrastructure stack
func NewSecureInfrastructureStack(scope constructs.Construct, id string, project, environment, region string) *SecureInfrastructureStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	s := &SecureInfrastructureStack{
		TerraformStack: stack,
		project:        project,
		environment:    environment,
		region:         region,
	}

	// Initialize AWS provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(region),
		DefaultTags: &provider.AwsProviderDefaultTags{
			Tags: &map[string]*string{
				"Project":     jsii.String(project),
				"Environment": jsii.String(environment),
				"ManagedBy":   jsii.String("CDKTF"),
				"Compliance":  jsii.String("SOC2-GDPR"),
				"DataClass":   jsii.String("Confidential"),
				"Owner":       jsii.String("Infrastructure-Team"),
			},
		},
	})

	// Get current AWS account and region data
	currentAccount := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{})
	currentRegion := dataawsregion.NewDataAwsRegion(stack, jsii.String("current"), &dataawsregion.DataAwsRegionConfig{})
	azs := dataawsavailabilityzones.NewDataAwsAvailabilityZones(stack, jsii.String("available"), &dataawsavailabilityzones.DataAwsAvailabilityZonesConfig{
		State: jsii.String("available"),
	})

	// Create KMS key for encryption
	kmsKey := s.createKMSKey(currentAccount)

	// Create VPC and networking
	vpcConfig := s.createVPC()
	subnets := s.createSubnets(vpcConfig.vpc, azs)
	internetGW := s.createInternetGateway(vpcConfig.vpc)
	natGW := s.createNATGateway(subnets.publicSubnets[0])
	s.createRouteTables(vpcConfig.vpc, subnets, internetGW, natGW)

	// Create security groups
	securityGroups := s.createSecurityGroups(vpcConfig.vpc)

	// Create IAM resources
	instanceProfile := s.createIAMResources(currentAccount, currentRegion)

	// Create S3 buckets with encryption
	s.createS3Buckets(kmsKey)

	// Create EC2 instances and load balancer
	s.createComputeResources(subnets, securityGroups, instanceProfile)

	return s
}

// VPCConfig holds VPC configuration
type VPCConfig struct {
	vpc *vpc.Vpc
}

// SubnetConfig holds subnet configuration
type SubnetConfig struct {
	publicSubnets  []*subnet.Subnet
	privateSubnets []*subnet.Subnet
}

// SecurityGroupConfig holds security group configuration
type SecurityGroupConfig struct {
	albSG *securitygroup.SecurityGroup
	appSG *securitygroup.SecurityGroup
}

// createKMSKey creates a KMS key for encryption
func (s *SecureInfrastructureStack) createKMSKey(currentAccount *dataawscalleridentity.DataAwsCallerIdentity) *kmskey.KmsKey {
	keyPolicy := fmt.Sprintf(`{
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
				"Sid": "Allow use of the key for S3",
				"Effect": "Allow",
				"Principal": {
					"Service": "s3.amazonaws.com"
				},
				"Action": [
					"kms:Decrypt",
					"kms:GenerateDataKey"
				],
				"Resource": "*"
			},
			{
				"Sid": "Allow CloudTrail to encrypt logs",
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
	}`, *currentAccount.AccountId())

	key := kmskey.NewKmsKey(s.TerraformStack, jsii.String("kms-key-"+s.project+"-"+s.environment), &kmskey.KmsKeyConfig{
		Description:           jsii.String("KMS key for " + s.project + " " + s.environment + " encryption"),
		Policy:               jsii.String(keyPolicy),
		DeletionWindowInDays: jsii.Number(30),
		EnableKeyRotation:    jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":        jsii.String("KMS-" + s.project + "-" + s.environment),
			"Purpose":     jsii.String("Encryption"),
			"Compliance":  jsii.String("SOC2-GDPR"),
		},
	})

	// Create KMS alias for easier reference
	kmsalias.NewKmsAlias(s.TerraformStack, jsii.String("kms-alias-"+s.project+"-"+s.environment), &kmsalias.KmsAliasConfig{
		Name:         jsii.String("alias/" + s.project + "-" + s.environment + "-key"),
		TargetKeyId:  key.KeyId(),
	})

	return key
}

// createVPC creates the main VPC
func (s *SecureInfrastructureStack) createVPC() *VPCConfig {
	mainVPC := vpc.NewVpc(s.TerraformStack, jsii.String("vpc-"+s.project+"-"+s.environment), &vpc.VpcConfig{
		CidrBlock:          jsii.String("10.0.0.0/16"),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name":       jsii.String("VPC-" + s.project + "-" + s.environment),
			"Purpose":    jsii.String("SecureNetworking"),
		},
	})

	return &VPCConfig{vpc: mainVPC}
}

// createSubnets creates public and private subnets
func (s *SecureInfrastructureStack) createSubnets(mainVPC *vpc.Vpc, azs *dataawsavailabilityzones.DataAwsAvailabilityZones) *SubnetConfig {
	var publicSubnets []*subnet.Subnet
	var privateSubnets []*subnet.Subnet

	// Create 2 public and 2 private subnets across different AZs
	for i := 0; i < 2; i++ {
		// Public subnet
		publicSubnet := subnet.NewSubnet(s.TerraformStack, jsii.String(fmt.Sprintf("public-subnet-%s-%s-%d", s.project, s.environment, i+1)), &subnet.SubnetConfig{
			VpcId:               mainVPC.Id(),
			CidrBlock:           jsii.String(fmt.Sprintf("10.0.%d.0/24", i+1)),
			AvailabilityZone:    jsii.String(fmt.Sprintf("${data.aws_availability_zones.available.names[%d]}", i)),
			MapPublicIpOnLaunch: jsii.Bool(true),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("PublicSubnet-%s-%s-%d", s.project, s.environment, i+1)),
				"Type": jsii.String("Public"),
				"Tier": jsii.String("Web"),
			},
		})
		publicSubnets = append(publicSubnets, publicSubnet)

		// Private subnet
		privateSubnet := subnet.NewSubnet(s.TerraformStack, jsii.String(fmt.Sprintf("private-subnet-%s-%s-%d", s.project, s.environment, i+1)), &subnet.SubnetConfig{
			VpcId:            mainVPC.Id(),
			CidrBlock:        jsii.String(fmt.Sprintf("10.0.%d.0/24", i+10)),
			AvailabilityZone: jsii.String(fmt.Sprintf("${data.aws_availability_zones.available.names[%d]}", i)),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("PrivateSubnet-%s-%s-%d", s.project, s.environment, i+1)),
				"Type": jsii.String("Private"),
				"Tier": jsii.String("Application"),
			},
		})
		privateSubnets = append(privateSubnets, privateSubnet)
	}

	return &SubnetConfig{
		publicSubnets:  publicSubnets,
		privateSubnets: privateSubnets,
	}
}

// createInternetGateway creates and attaches internet gateway
func (s *SecureInfrastructureStack) createInternetGateway(mainVPC *vpc.Vpc) *internetgateway.InternetGateway {
	return internetgateway.NewInternetGateway(s.TerraformStack, jsii.String("igw-"+s.project+"-"+s.environment), &internetgateway.InternetGatewayConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("IGW-" + s.project + "-" + s.environment),
		},
	})
}

// createNATGateway creates NAT gateway for private subnet internet access
func (s *SecureInfrastructureStack) createNATGateway(publicSubnet *subnet.Subnet) *natgateway.NatGateway {
	// Create Elastic IP for NAT Gateway
	natEIP := eip.NewEip(s.TerraformStack, jsii.String("nat-eip-"+s.project+"-"+s.environment), &eip.EipConfig{
		Domain: jsii.String("vpc"),
		Tags: &map[string]*string{
			"Name": jsii.String("NAT-EIP-" + s.project + "-" + s.environment),
		},
	})

	return natgateway.NewNatGateway(s.TerraformStack, jsii.String("nat-gw-"+s.project+"-"+s.environment), &natgateway.NatGatewayConfig{
		AllocationId: natEIP.Id(),
		SubnetId:     publicSubnet.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("NAT-GW-" + s.project + "-" + s.environment),
		},
	})
}

// createRouteTables creates and configures route tables
func (s *SecureInfrastructureStack) createRouteTables(mainVPC *vpc.Vpc, subnets *SubnetConfig, igw *internetgateway.InternetGateway, natGW *natgateway.NatGateway) {
	// Public route table
	publicRT := routetable.NewRouteTable(s.TerraformStack, jsii.String("public-rt-"+s.project+"-"+s.environment), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("PublicRT-" + s.project + "-" + s.environment),
		},
	})

	// Add route to internet gateway
	route.NewRoute(s.TerraformStack, jsii.String("public-route-"+s.project+"-"+s.environment), &route.RouteConfig{
		RouteTableId:         publicRT.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnets with public route table
	for i, subnet := range subnets.publicSubnets {
		routetableassociation.NewRouteTableAssociation(s.TerraformStack, jsii.String(fmt.Sprintf("public-rt-assoc-%s-%s-%d", s.project, s.environment, i+1)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: publicRT.Id(),
		})
	}

	// Private route table
	privateRT := routetable.NewRouteTable(s.TerraformStack, jsii.String("private-rt-"+s.project+"-"+s.environment), &routetable.RouteTableConfig{
		VpcId: mainVPC.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("PrivateRT-" + s.project + "-" + s.environment),
		},
	})

	// Add route to NAT gateway
	route.NewRoute(s.TerraformStack, jsii.String("private-route-"+s.project+"-"+s.environment), &route.RouteConfig{
		RouteTableId:         privateRT.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		NatGatewayId:         natGW.Id(),
	})

	// Associate private subnets with private route table
	for i, subnet := range subnets.privateSubnets {
		routetableassociation.NewRouteTableAssociation(s.TerraformStack, jsii.String(fmt.Sprintf("private-rt-assoc-%s-%s-%d", s.project, s.environment, i+1)), &routetableassociation.RouteTableAssociationConfig{
			SubnetId:     subnet.Id(),
			RouteTableId: privateRT.Id(),
		})
	}
}

// createSecurityGroups creates security groups with least privilege access
func (s *SecureInfrastructureStack) createSecurityGroups(mainVPC *vpc.Vpc) *SecurityGroupConfig {
	// ALB Security Group - only allows HTTPS from approved IP ranges
	albSG := securitygroup.NewSecurityGroup(s.TerraformStack, jsii.String("alb-sg-"+s.project+"-"+s.environment), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("ALB-SG-" + s.project + "-" + s.environment),
		Description: jsii.String("Security group for Application Load Balancer - SOC2/GDPR compliant"),
		VpcId:       mainVPC.Id(),
		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				Description: jsii.String("HTTPS from corporate network"),
				FromPort:    jsii.Number(443),
				ToPort:      jsii.Number(443),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("10.0.0.0/8")}, // Restrict to corporate network
			},
			{
				Description: jsii.String("HTTP redirect from corporate network"),
				FromPort:    jsii.Number(80),
				ToPort:      jsii.Number(80),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("10.0.0.0/8")}, // Restrict to corporate network
			},
		},
		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				Description: jsii.String("All outbound to VPC"),
				FromPort:    jsii.Number(0),
				ToPort:      jsii.Number(65535),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("10.0.0.0/16")},
			},
		},
		Tags: &map[string]*string{
			"Name":        jsii.String("ALB-SG-" + s.project + "-" + s.environment),
			"Purpose":     jsii.String("LoadBalancer"),
			"Compliance":  jsii.String("SOC2-GDPR"),
		},
	})

	// Application Security Group - only allows traffic from ALB
	appSG := securitygroup.NewSecurityGroup(s.TerraformStack, jsii.String("app-sg-"+s.project+"-"+s.environment), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("App-SG-" + s.project + "-" + s.environment),
		Description: jsii.String("Security group for application servers - SOC2/GDPR compliant"),
		VpcId:       mainVPC.Id(),
		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				Description:    jsii.String("Application port from ALB"),
				FromPort:       jsii.Number(8080),
				ToPort:         jsii.Number(8080),
				Protocol:       jsii.String("tcp"),
				SecurityGroups: &[]*string{albSG.Id()},
			},
			{
				Description: jsii.String("SSH from VPC only"),
				FromPort:    jsii.Number(22),
				ToPort:      jsii.Number(22),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("10.0.0.0/16")}, // Only from VPC
			},
		},
		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				Description: jsii.String("HTTPS outbound for updates"),
				FromPort:    jsii.Number(443),
				ToPort:      jsii.Number(443),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("0.0.0.0/0")},
			},
			{
				Description: jsii.String("HTTP outbound for updates"),
				FromPort:    jsii.Number(80),
				ToPort:      jsii.Number(80),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("0.0.0.0/0")},
			},
		},
		Tags: &map[string]*string{
			"Name":        jsii.String("App-SG-" + s.project + "-" + s.environment),
			"Purpose":     jsii.String("ApplicationServers"),
			"Compliance":  jsii.String("SOC2-GDPR"),
		},
	})

	return &SecurityGroupConfig{
		albSG: albSG,
		appSG: appSG,
	}
}

// createIAMResources creates IAM users, roles, and policies with MFA requirements
func (s *SecureInfrastructureStack) createIAMResources(currentAccount *dataawscalleridentity.DataAwsCallerIdentity, currentRegion *dataawsregion.DataAwsRegion) *iaminstanceprofile.IamInstanceProfile {
	// MFA Policy for all users
	mfaPolicy := iampolicy.NewIamPolicy(s.TerraformStack, jsii.String("mfa-policy-"+s.project+"-"+s.environment), &iampolicy.IamPolicyConfig{
		Name:        jsii.String("MFA-Policy-" + s.project + "-" + s.environment),
		Description: jsii.String("Requires MFA for all operations - SOC2/GDPR compliant"),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "AllowViewAccountInfo",
					"Effect": "Allow",
					"Action": [
						"iam:GetAccountPasswordPolicy",
						"iam:ListVirtualMFADevices",
						"iam:GetAccountSummary"
					],
					"Resource": "*"
				},
				{
					"Sid": "AllowManageOwnPasswords",
					"Effect": "Allow",
					"Action": [
						"iam:ChangePassword",
						"iam:GetUser"
					],
					"Resource": "arn:aws:iam::*:user/${aws:username}"
				},
				{
					"Sid": "AllowManageOwnMFA",
					"Effect": "Allow",
					"Action": [
						"iam:CreateVirtualMFADevice",
						"iam:DeleteVirtualMFADevice",
						"iam:EnableMFADevice",
						"iam:ListMFADevices",
						"iam:ResyncMFADevice"
					],
					"Resource": [
						"arn:aws:iam::*:mfa/${aws:username}",
						"arn:aws:iam::*:user/${aws:username}"
					]
				},
				{
					"Sid": "DenyAllExceptUnlessSignedInWithMFA",
					"Effect": "Deny",
					"NotAction": [
						"iam:CreateVirtualMFADevice",
						"iam:EnableMFADevice",
						"iam:GetUser",
						"iam:ListMFADevices",
						"iam:ListVirtualMFADevices",
						"iam:ResyncMFADevice",
						"sts:GetSessionToken"
					],
					"Resource": "*",
					"Condition": {
						"BoolIfExists": {
							"aws:MultiFactorAuthPresent": "false"
						}
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":       jsii.String("MFA-Policy-" + s.project + "-" + s.environment),
			"Compliance": jsii.String("SOC2-GDPR"),
			"Purpose":    jsii.String("MFAEnforcement"),
		},
	})

	// Create IAM group for users
	userGroup := iamgroup.NewIamGroup(s.TerraformStack, jsii.String("user-group-"+s.project+"-"+s.environment), &iamgroup.IamGroupConfig{
		Name: jsii.String("UserGroup-" + s.project + "-" + s.environment),
		Path: jsii.String("/"),
	})

	// Attach MFA policy to group
	iampolicyattachment.NewIamPolicyAttachment(s.TerraformStack, jsii.String("mfa-policy-attachment-"+s.project+"-"+s.environment), &iampolicyattachment.IamPolicyAttachmentConfig{
		Name:      jsii.String("MFA-Policy-Attachment-" + s.project + "-" + s.environment),
		Groups:    &[]*string{userGroup.Name()},
		PolicyArn: mfaPolicy.Arn(),
	})

	// EC2 Instance Role with least privilege
	ec2Role := iamrole.NewIamRole(s.TerraformStack, jsii.String("ec2-role-"+s.project+"-"+s.environment), &iamrole.IamRoleConfig{
		Name: jsii.String("EC2-Role-" + s.project + "-" + s.environment),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Action": "sts:AssumeRole",
					"Effect": "Allow",
					"Condition": {
						"StringEquals": {
							"sts:ExternalId": "` + s.project + `-` + s.environment + `"
						}
					},
					"Principal": {
						"Service": "ec2.amazonaws.com"
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":       jsii.String("EC2-Role-" + s.project + "-" + s.environment),
			"Purpose":    jsii.String("EC2Instances"),
			"Compliance": jsii.String("SOC2-GDPR"),
		},
	})

	// EC2 Instance Policy with minimal permissions
	ec2Policy := iampolicy.NewIamPolicy(s.TerraformStack, jsii.String("ec2-policy-"+s.project+"-"+s.environment), &iampolicy.IamPolicyConfig{
		Name:        jsii.String("EC2-Policy-" + s.project + "-" + s.environment),
		Description: jsii.String("Minimal permissions for EC2 instances - SOC2/GDPR compliant"),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "S3ReadAccess",
					"Effect": "Allow",
					"Action": [
						"s3:GetObject",
						"s3:GetObjectVersion"
					],
					"Resource": "arn:aws:s3:::app-%s-%s/*"
				},
				{
					"Sid": "CloudWatchLogs",
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents",
						"logs:DescribeLogStreams"
					],
					"Resource": "arn:aws:logs:*:*:log-group:/aws/ec2/%s-%s"
				},
				{
					"Sid": "CloudWatchMetrics",
					"Effect": "Allow",
					"Action": [
						"cloudwatch:PutMetricData"
					],
					"Resource": "*",
					"Condition": {
						"StringEquals": {
							"cloudwatch:namespace": "%s-%s"
						}
					}
				}
			]
		}`, s.project, s.environment, s.project, s.environment, s.project, s.environment)),
		Tags: &map[string]*string{
			"Name":       jsii.String("EC2-Policy-" + s.project + "-" + s.environment),
			"Purpose":    jsii.String("EC2MinimalAccess"),
			"Compliance": jsii.String("SOC2-GDPR"),
		},
	})

	// Attach policy to role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(s.TerraformStack, jsii.String("ec2-policy-attachment-"+s.project+"-"+s.environment), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2
```
