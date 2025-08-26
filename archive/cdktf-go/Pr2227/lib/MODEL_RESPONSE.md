I'll create a comprehensive CDKTF + Go template that meets all your security requirements. Here's the complete `SecureInfrastructure.yaml` implementation:

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
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lb"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lbtargetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/natgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
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
	s.createIAMResources(currentAccount, currentRegion)

	// Create S3 buckets with encryption
	s.createS3Buckets(kmsKey)

	// Create EC2 instances and load balancer
	s.createComputeResources(subnets, securityGroups)

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
			}
		]
	}`, *currentAccount.AccountId())

	return kmskey.NewKmsKey(s.TerraformStack, jsii.String("kms-key-"+s.project+"-"+s.environment), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for " + s.project + " " + s.environment + " encryption"),
		Policy:      jsii.String(keyPolicy),
		Tags: &map[string]*string{
			"Name":        jsii.String("KMS-" + s.project + "-" + s.environment),
			"Purpose":     jsii.String("Encryption"),
			"Compliance":  jsii.String("SOC2-GDPR"),
		},
	})
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
		Route: &[]*routetable.RouteTableRoute{
			{
				CidrBlock: jsii.String("0.0.0.0/0"),
				GatewayId: igw.Id(),
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String("PublicRT-" + s.project + "-" + s.environment),
		},
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
		Route: &[]*routetable.RouteTableRoute{
			{
				CidrBlock:    jsii.String("0.0.0.0/0"),
				NatGatewayId: natGW.Id(),
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String("PrivateRT-" + s.project + "-" + s.environment),
		},
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
		Description: jsii.String("Security group for Application Load Balancer"),
		VpcId:       mainVPC.Id(),
		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				FromPort:   jsii.Number(443),
				ToPort:     jsii.Number(443),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("10.0.0.0/8")}, // Only internal traffic - modify as needed
			},
			{
				FromPort:   jsii.Number(80),
				ToPort:     jsii.Number(80),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("10.0.0.0/8")}, // Only internal traffic - modify as needed
			},
		},
		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				FromPort:   jsii.Number(0),
				ToPort:     jsii.Number(65535),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("10.0.0.0/16")},
			},
		},
		Tags: &map[string]*string{
			"Name":    jsii.String("ALB-SG-" + s.project + "-" + s.environment),
			"Purpose": jsii.String("LoadBalancer"),
		},
	})

	// Application Security Group - only allows traffic from ALB
	appSG := securitygroup.NewSecurityGroup(s.TerraformStack, jsii.String("app-sg-"+s.project+"-"+s.environment), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String("App-SG-" + s.project + "-" + s.environment),
		Description: jsii.String("Security group for application servers"),
		VpcId:       mainVPC.Id(),
		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				FromPort:       jsii.Number(8080),
				ToPort:         jsii.Number(8080),
				Protocol:       jsii.String("tcp"),
				SecurityGroups: &[]*string{albSG.Id()},
			},
			{
				FromPort:   jsii.Number(22),
				ToPort:     jsii.Number(22),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("10.0.0.0/16")}, // Only from VPC
			},
		},
		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				FromPort:   jsii.Number(443),
				ToPort:     jsii.Number(443),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")}, // HTTPS outbound for updates
			},
			{
				FromPort:   jsii.Number(80),
				ToPort:     jsii.Number(80),
				Protocol:   jsii.String("tcp"),
				CidrBlocks: &[]*string{jsii.String("0.0.0.0/0")}, // HTTP outbound for updates
			},
		},
		Tags: &map[string]*string{
			"Name":    jsii.String("App-SG-" + s.project + "-" + s.environment),
			"Purpose": jsii.String("ApplicationServers"),
		},
	})

	return &SecurityGroupConfig{
		albSG: albSG,
		appSG: appSG,
	}
}

// createIAMResources creates IAM users, roles, and policies with MFA requirements
func (s *SecureInfrastructureStack) createIAMResources(currentAccount *dataawscalleridentity.DataAwsCallerIdentity, currentRegion *dataawsregion.DataAwsRegion) {
	// MFA Policy for all users
	mfaPolicy := iampolicy.NewIamPolicy(s.TerraformStack, jsii.String("mfa-policy-"+s.project+"-"+s.environment), &iampolicy.IamPolicyConfig{
		Name:        jsii.String("MFA-Policy-" + s.project + "-" + s.environment),
		Description: jsii.String("Requires MFA for all operations"),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "AllowViewAccountInfo",
					"Effect": "Allow",
					"Action": [
						"iam:GetAccountPasswordPolicy",
						"iam:ListVirtualMFADevices"
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
		},
	})

	// Create IAM group for users
	userGroup := iamgroup.NewIamGroup(s.TerraformStack, jsii.String("user-group-"+s.project+"-"+s.environment), &iamgroup.IamGroupConfig{
		Name: jsii.String("UserGroup-" + s.project + "-" + s.environment),
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
					"Principal": {
						"Service": "ec2.amazonaws.com"
					}
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":    jsii.String("EC2-Role-" + s.project + "-" + s.environment),
			"Purpose": jsii.String("EC2Instances"),
		},
	})

	// EC2 Instance Policy with minimal permissions
	ec2Policy := iampolicy.NewIamPolicy(s.TerraformStack, jsii.String("ec2-policy-"+s.project+"-"+s.environment), &iampolicy.IamPolicyConfig{
		Name:        jsii.String("EC2-Policy-" + s.project + "-" + s.environment),
		Description: jsii.String("Minimal permissions for EC2 instances"),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"s3:GetObject"
					],
					"Resource": "arn:aws:s3:::app-` + s.project + `-` + s.environment + `/*"
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
		}`),
		Tags: &map[string]*string{
			"Name":    jsii.String("EC2-Policy-" + s.project + "-" + s.environment),
			"Purpose": jsii.String("EC2MinimalAccess"),
		},
	})

	// Attach policy to role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(s.TerraformStack, jsii.String("ec2-policy-attachment-"+s.project+"-"+s.environment), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: ec2Policy.Arn(),
	})

	// Create instance profile for EC2
	iaminstanceprofile.NewIamInstanceProfile(s.TerraformStack, jsii.String("ec2-instance-profile-"+s.project+"-"+s.environment), &iaminstanceprofile.IamInstanceProfileConfig{
		Name: jsii.String("EC2-InstanceProfile-" + s.project + "-" + s.environment),
		Role: ec2Role.Name(),
		Tags: &map[string]*string{
			"Name": jsii.String("EC2-InstanceProfile-" + s.project + "-" + s.environment),
		},
	})

	// Create a sample IAM user (for demonstration)
	sampleUser := iamuser.NewIamUser(s.TerraformStack, jsii.String("sample-user-"+s.project+"-"+s.environment), &iamuser.IamUserConfig{
		Name: jsii.String("SampleUser-" + s.project + "-" + s.environment),
		Tags: &map[string]*string{
			"Name":       jsii.String("SampleUser-" + s.project + "-" + s.environment),
			"Compliance": jsii.String("SOC2-GDPR"),
		},
	})

	// Add user to group (inherits MFA policy)
	iamgrouppolicy.NewIamGroupPolicy(s.TerraformStack, jsii.String("add-user-to-group-"+s.project+"-"+s.environment), &iamgrouppolicy.IamGroupPolicyConfig{
		Name:  jsii.String("AddUserToGroup-" + s.project + "-" + s.environment),
		Group: userGroup.Name(),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": "iam:AddUserToGroup",
					"Resource": [
						"arn:aws:iam::%s:user/%s",
						"arn:aws:iam::%s:group/%s"
					]
				}
			]
		}`, *currentAccount.AccountId(), *sampleUser.Name(), *currentAccount.AccountId(), *userGroup.Name())),
	})
}

// createS3Buckets creates S3 buckets with encryption and security settings
func (s *SecureInfrastructureStack) createS3Buckets(kmsKey *kmskey.KmsKey) {
	// Application data bucket
	appBucket := s3bucket.NewS3Bucket(s.TerraformStack, jsii.String("app-bucket-"+s.project+"-"+s.environment), &s3bucket.S3BucketConfig{
		Bucket: jsii.String("app-" + s.project + "-" + s.environment + "-" + s.region),
		Tags: &map[string]*string{
			"Name":        jsii.String("AppBucket-" + s.project + "-" + s.environment),
			"Purpose":     jsii.String("ApplicationData"),
			"DataClass":   jsii.String("Confidential"),
			"Compliance":  jsii.String("SOC2-GDPR"),
		},
	})

	// Enable versioning
	s3bucketversioning.NewS3BucketVersioning(s.TerraformStack, jsii.String("app-bucket-versioning-"+s.project+"-"+s.environment), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: appBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Enable server-side encryption
	s3bucketencryption.NewS3BucketEncryption(s.TerraformStack, jsii.String("app-bucket-encryption-"+s.project+"-"+s.environment), &s3bucketencryption.S3BucketEncryptionConfig{
		Bucket: appBucket.Id(),
		ServerSideEncryptionConfiguration: &s3bucketencryption.S3BucketEncryptionServerSideEncryptionConfiguration{
			Rule
```
