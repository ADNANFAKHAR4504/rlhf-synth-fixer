# Fixed CDKTF Go Infrastructure Code

Here's the corrected version that addresses all the build errors:

```go
package main

import (
	"fmt"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/autoscalinggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/configconfigrule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/configconfigurationrecorder"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/configdeliverychannel"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsami"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsavailabilityzones"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawscalleridentity"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbinstance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dbsubnetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/eip"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iaminstanceprofile"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamuser"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/launchtemplate"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lb"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lblistener"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lbtargetgroup"
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
)

func NewTapStack(scope constructs.Construct, id string) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// Get environment suffix from environment variable
	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = "pr2114" // Default for this PR
	}

	// Get state bucket configuration from environment variables
	stateBucket := os.Getenv("TERRAFORM_STATE_BUCKET")
	if stateBucket == "" {
		stateBucket = "iac-rlhf-tf-states" // Default state bucket
	}
	stateBucketRegion := os.Getenv("TERRAFORM_STATE_BUCKET_REGION")
	if stateBucketRegion == "" {
		stateBucketRegion = "us-east-1" // Default region for state bucket
	}

	// Configure S3 backend for remote state
	cdktf.NewS3Backend(stack, &cdktf.S3BackendConfig{
		Bucket: jsii.String(stateBucket),
		Key:    jsii.String(fmt.Sprintf("%s/TapStack%s.tfstate", environmentSuffix, environmentSuffix)),
		Region: jsii.String(stateBucketRegion),
	})

	// Define regions
	regions := []string{"us-east-1", "us-west-2"}
	
	// SSH IP range for restricted access
	sshAllowedCidr := "10.0.0.0/8" // Restrict to internal network

	// Create providers for both regions
	providerEast := provider.NewAwsProvider(stack, jsii.String("aws-east"), &provider.AwsProviderConfig{
		Region: jsii.String("us-east-1"),
		Alias:  jsii.String("east"),
	})

	providerWest := provider.NewAwsProvider(stack, jsii.String("aws-west"), &provider.AwsProviderConfig{
		Region: jsii.String("us-west-2"),
		Alias:  jsii.String("west"),
	})

	// Get caller identity for account ID
	callerIdentity := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{
		Provider: providerEast,
	})

	// Create KMS keys for encryption
	kmsKeyEast := kmskey.NewKmsKey(stack, jsii.String("kms-key-east"), &kmskey.KmsKeyConfig{
		Provider:    providerEast,
		Description: jsii.String("KMS key for encryption in us-east-1"),
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
				}
			]
		}`, *callerIdentity.AccountId())),
	})

	kmsKeyWest := kmskey.NewKmsKey(stack, jsii.String("kms-key-west"), &kmskey.KmsKeyConfig{
		Provider:    providerWest,
		Description: jsii.String("KMS key for encryption in us-west-2"),
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
				}
			]
		}`, *callerIdentity.AccountId())),
	})

	// Create IAM role for EC2 instances
	ec2Role := iamrole.NewIamRole(stack, jsii.String("ec2-role"), &iamrole.IamRoleConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("ec2-role-%s", environmentSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "ec2.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
	})

	// Create IAM policy for CloudWatch Logs
	cloudWatchLogsPolicy := iampolicy.NewIamPolicy(stack, jsii.String("cloudwatch-logs-policy"), &iampolicy.IamPolicyConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("cloudwatch-logs-policy-%s", environmentSuffix)),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents",
						"logs:DescribeLogStreams"
					],
					"Resource": "*"
				}
			]
		}`),
	})

	// Attach CloudWatch Logs policy to EC2 role
	iampolicyattachment.NewIamPolicyAttachment(stack, jsii.String("ec2-cloudwatch-policy-attachment"), &iampolicyattachment.IamPolicyAttachmentConfig{
		Provider:   providerEast,
		Name:       jsii.String(fmt.Sprintf("ec2-cloudwatch-policy-attachment-%s", environmentSuffix)),
		Roles:      &[]*string{ec2Role.Name()},
		PolicyArn:  cloudWatchLogsPolicy.Arn(),
	})

	// Create instance profile
	instanceProfile := iaminstanceprofile.NewIamInstanceProfile(stack, jsii.String("ec2-instance-profile"), &iaminstanceprofile.IamInstanceProfileConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("ec2-instance-profile-%s", environmentSuffix)),
		Role:     ec2Role.Name(),
	})

	// Create IAM user with MFA requirement
	iamUser := iamuser.NewIamUser(stack, jsii.String("app-user"), &iamuser.IamUserConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("app-user-%s", environmentSuffix)),
	})

	// Create MFA policy
	mfaPolicy := iampolicy.NewIamPolicy(stack, jsii.String("mfa-policy"), &iampolicy.IamPolicyConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("mfa-policy-%s", environmentSuffix)),
		Policy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
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
	})

	// Attach MFA policy to user
	iampolicyattachment.NewIamPolicyAttachment(stack, jsii.String("user-mfa-policy-attachment"), &iampolicyattachment.IamPolicyAttachmentConfig{
		Provider:  providerEast,
		Name:      jsii.String(fmt.Sprintf("user-mfa-policy-attachment-%s", environmentSuffix)),
		Users:     &[]*string{iamUser.Name()},
		PolicyArn: mfaPolicy.Arn(),
	})

	// Create S3 bucket for static content with KMS encryption using bucket properties
	s3Bucket := s3bucket.NewS3Bucket(stack, jsii.String("static-content-bucket"), &s3bucket.S3BucketConfig{
		Provider: providerEast,
		Bucket:   jsii.String(fmt.Sprintf("static-content-bucket-%s-%s", environmentSuffix, *callerIdentity.AccountId())),
		ServerSideEncryptionConfiguration: []s3bucket.S3BucketServerSideEncryptionConfiguration{
			{
				Rule: s3bucket.S3BucketServerSideEncryptionConfigurationRule{
					ApplyServerSideEncryptionByDefault: s3bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
						SseAlgorithm:   jsii.String("aws:kms"),
						KmsMasterKeyId: kmsKeyEast.Arn(),
					},
				},
			},
		},
	})

	// Block public access to S3 bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("static-content-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Provider:                providerEast,
		Bucket:                  s3Bucket.Id(),
		BlockPublicAcls:         jsii.Bool(true),
		BlockPublicPolicy:       jsii.Bool(true),
		IgnorePublicAcls:        jsii.Bool(true),
		RestrictPublicBuckets:   jsii.Bool(true),
	})

	// Create S3 bucket policy for restricted access
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("static-content-bucket-policy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Provider: providerEast,
		Bucket:   s3Bucket.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"AWS": "%s"
					},
					"Action": [
						"s3:GetObject",
						"s3:PutObject"
					],
					"Resource": "%s/*"
				}
			]
		}`, *ec2Role.Arn(), *s3Bucket.Arn())),
	})

	// Create CloudWatch Log Groups
	for _, region := range regions {
		var regionProvider cdktf.TerraformProvider
		if region == "us-east-1" {
			regionProvider = providerEast
		} else {
			regionProvider = providerWest
		}

		cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String(fmt.Sprintf("app-logs-%s", region)), &cloudwatchloggroup.CloudwatchLogGroupConfig{
			Provider:        regionProvider,
			Name:            jsii.String(fmt.Sprintf("/aws/ec2/app-logs-%s-%s", region, environmentSuffix)),
			RetentionInDays: jsii.Number(30),
		})
	}

	// Create infrastructure for each region
	for _, region := range regions {
		var regionProvider cdktf.TerraformProvider
		var kmsKey kmskey.KmsKey
		regionSuffix := region[len(region)-1:] // Get last character (1 or 2)

		if region == "us-east-1" {
			regionProvider = providerEast
			kmsKey = kmsKeyEast
		} else {
			regionProvider = providerWest
			kmsKey = kmsKeyWest
		}

		// Create VPC
		vpcResource := vpc.NewVpc(stack, jsii.String(fmt.Sprintf("vpc-%s", region)), &vpc.VpcConfig{
			Provider:           regionProvider,
			CidrBlock:          jsii.String(fmt.Sprintf("10.%s.0.0/16", regionSuffix)),
			EnableDnsHostnames: jsii.Bool(true),
			EnableDnsSupport:   jsii.Bool(true),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("vpc-%s-%s", region, environmentSuffix)),
			},
		})

		// Create Internet Gateway
		igw := internetgateway.NewInternetGateway(stack, jsii.String(fmt.Sprintf("igw-%s", region)), &internetgateway.InternetGatewayConfig{
			Provider: regionProvider,
			VpcId:    vpcResource.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("igw-%s-%s", region, environmentSuffix)),
			},
		})

		// Create public subnets
		var publicSubnets []subnet.Subnet
		var privateSubnets []subnet.Subnet

		for i := 0; i < 2; i++ {
			// Public subnet
			publicSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("public-subnet-%s-%d", region, i)), &subnet.SubnetConfig{
				Provider:                regionProvider,
				VpcId:                   vpcResource.Id(),
				CidrBlock:               jsii.String(fmt.Sprintf("10.%s.%d.0/24", regionSuffix, i*2+1)),
				AvailabilityZone:        jsii.String(fmt.Sprintf("%s%s", region, string(rune('a'+i)))),
				MapPublicIpOnLaunch:     jsii.Bool(true),
				Tags: &map[string]*string{
					"Name": jsii.String(fmt.Sprintf("public-subnet-%s-%d-%s", region, i, environmentSuffix)),
				},
			})
			publicSubnets = append(publicSubnets, publicSubnet)

			// Private subnet
			privateSubnet := subnet.NewSubnet(stack, jsii.String(fmt.Sprintf("private-subnet-%s-%d", region, i)), &subnet.SubnetConfig{
				Provider:         regionProvider,
				VpcId:            vpcResource.Id(),
				CidrBlock:        jsii.String(fmt.Sprintf("10.%s.%d.0/24", regionSuffix, i*2+2)),
				AvailabilityZone: jsii.String(fmt.Sprintf("%s%s", region, string(rune('a'+i)))),
				Tags: &map[string]*string{
					"Name": jsii.String(fmt.Sprintf("private-subnet-%s-%d-%s", region, i, environmentSuffix)),
				},
			})
			privateSubnets = append(privateSubnets, privateSubnet)
		}

		// Create Elastic IP for NAT Gateway
		natEip := eip.NewEip(stack, jsii.String(fmt.Sprintf("nat-eip-%s", region)), &eip.EipConfig{
			Provider: regionProvider,
			Domain:   jsii.String("vpc"),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("nat-eip-%s-%s", region, environmentSuffix)),
			},
		})

		// Create NAT Gateway
		natGateway := natgateway.NewNatGateway(stack, jsii.String(fmt.Sprintf("nat-gateway-%s", region)), &natgateway.NatGatewayConfig{
			Provider:     regionProvider,
			AllocationId: natEip.Id(),
			SubnetId:     publicSubnets[0].Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("nat-gateway-%s-%s", region, environmentSuffix)),
			},
		})

		// Create route tables
		publicRouteTable := routetable.NewRouteTable(stack, jsii.String(fmt.Sprintf("public-rt-%s", region)), &routetable.RouteTableConfig{
			Provider: regionProvider,
			VpcId:    vpcResource.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("public-rt-%s-%s", region, environmentSuffix)),
			},
		})

		privateRouteTable := routetable.NewRouteTable(stack, jsii.String(fmt.Sprintf("private-rt-%s", region)), &routetable.RouteTableConfig{
			Provider: regionProvider,
			VpcId:    vpcResource.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("private-rt-%s-%s", region, environmentSuffix)),
			},
		})

		// Create routes
		route.NewRoute(stack, jsii.String(fmt.Sprintf("public-route-%s", region)), &route.RouteConfig{
			Provider:             regionProvider,
			RouteTableId:         publicRouteTable.Id(),
			DestinationCidrBlock: jsii.String("0.0.0.0/0"),
			GatewayId:            igw.Id(),
		})

		route.NewRoute(stack, jsii.String(fmt.Sprintf("private-route-%s", region)), &route.RouteConfig{
			Provider:             regionProvider,
			RouteTableId:         privateRouteTable.Id(),
			DestinationCidrBlock: jsii.String("0.0.0.0/0"),
			NatGatewayId:         natGateway.Id(),
		})

		// Associate subnets with route tables
		for i, publicSubnet := range publicSubnets {
			routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("public-rta-%s-%d", region, i)), &routetableassociation.RouteTableAssociationConfig{
				Provider:     regionProvider,
				SubnetId:     publicSubnet.Id(),
				RouteTableId: publicRouteTable.Id(),
			})
		}

		for i, privateSubnet := range privateSubnets {
			routetableassociation.NewRouteTableAssociation(stack, jsii.String(fmt.Sprintf("private-rta-%s-%d", region, i)), &routetableassociation.RouteTableAssociationConfig{
				Provider:     regionProvider,
				SubnetId:     privateSubnet.Id(),
				RouteTableId: privateRouteTable.Id(),
			})
		}

		// Create security groups
		webSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String(fmt.Sprintf("web-sg-%s", region)), &securitygroup.SecurityGroupConfig{
			Provider:    regionProvider,
			Name:        jsii.String(fmt.Sprintf("web-sg-%s-%s", region, environmentSuffix)),
			Description: jsii.String("Security group for web servers"),
			VpcId:       vpcResource.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("web-sg-%s-%s", region, environmentSuffix)),
			},
		})

		// HTTP ingress rule
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-sg-http-%s", region)), &securitygrouprule.SecurityGroupRuleConfig{
			Provider:        regionProvider,
			Type:            jsii.String("ingress"),
			FromPort:        jsii.Number(80),
			ToPort:          jsii.Number(80),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
			SecurityGroupId: webSecurityGroup.Id(),
		})

		// HTTPS ingress rule
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-sg-https-%s", region)), &securitygrouprule.SecurityGroupRuleConfig{
			Provider:        regionProvider,
			Type:            jsii.String("ingress"),
			FromPort:        jsii.Number(443),
			ToPort:          jsii.Number(443),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
			SecurityGroupId: webSecurityGroup.Id(),
		})

		// SSH ingress rule (restricted)
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-sg-ssh-%s", region)), &securitygrouprule.SecurityGroupRuleConfig{
			Provider:        regionProvider,
			Type:            jsii.String("ingress"),
			FromPort:        jsii.Number(22),
			ToPort:          jsii.Number(22),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{jsii.String(sshAllowedCidr)},
			SecurityGroupId: webSecurityGroup.Id(),
		})

		// Egress rule
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("web-sg-egress-%s", region)), &securitygrouprule.SecurityGroupRuleConfig{
			Provider:        regionProvider,
			Type:            jsii.String("egress"),
			FromPort:        jsii.Number(0),
			ToPort:          jsii.Number(65535),
			Protocol:        jsii.String("tcp"),
			CidrBlocks:      &[]*string{jsii.String("0.0.0.0/0")},
			SecurityGroupId: webSecurityGroup.Id(),
		})

		// Create RDS security group
		rdsSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String(fmt.Sprintf("rds-sg-%s", region)), &securitygroup.SecurityGroupConfig{
			Provider:    regionProvider,
			Name:        jsii.String(fmt.Sprintf("rds-sg-%s-%s", region, environmentSuffix)),
			Description: jsii.String("Security group for RDS"),
			VpcId:       vpcResource.Id(),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("rds-sg-%s-%s", region, environmentSuffix)),
			},
		})

		// RDS ingress rule
		securitygrouprule.NewSecurityGroupRule(stack, jsii.String(fmt.Sprintf("rds-sg-mysql-%s", region)), &securitygrouprule.SecurityGroupRuleConfig{
			Provider:              regionProvider,
			Type:                  jsii.String("ingress"),
			FromPort:              jsii.Number(3306),
			ToPort:                jsii.Number(3306),
			Protocol:              jsii.String("tcp"),
			SourceSecurityGroupId: webSecurityGroup.Id(),
			SecurityGroupId:       rdsSecurityGroup.Id(),
		})

		// Get latest Amazon Linux AMI
		ami := dataawsami.NewDataAwsAmi(stack, jsii.String(fmt.Sprintf("amazon-linux-%s", region)), &dataawsami.DataAwsAmiConfig{
			Provider:   regionProvider,
			MostRecent: jsii.Bool(true),
			Owners:     &[]*string{jsii.String("amazon")},
			Filter: []dataawsami.DataAwsAmiFilter{
				{
					Name:   jsii.String("name"),
					Values: &[]*string{jsii.String("amzn2-ami-hvm-*-x86_64-gp2")},
				},
			},
		})

		// Create launch template
		launchTemplate := launchtemplate.NewLaunchTemplate(stack, jsii.String(fmt.Sprintf("launch-template-%s", region)), &launchtemplate.LaunchTemplateConfig{
			Provider: regionProvider,
			Name:     jsii.String(fmt.Sprintf("launch-template-%s-%s", region, environmentSuffix)),
			ImageId:  ami.Id(),
			InstanceType: jsii.String("t3.micro"),
			IamInstanceProfile: &launchtemplate.LaunchTemplateIamInstanceProfile{
				Name: instanceProfile.Name(),
			},
			VpcSecurityGroupIds: &[]*string{webSecurityGroup.Id()},
			UserData: jsii.String(`#!/bin/bash
yum update -y
yum install -y httpd awslogs
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(curl -s http://169.254.169.254/latest/meta-data/placement/region)</h1>" > /var/www/html/index.html

# Configure CloudWatch Logs
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = /aws/ec2/app-logs-` + region + `-` + environmentSuffix + `
log_stream_name = {instance_id}/messages
datetime_format = %b %d %H:%M:%S
EOF

systemctl start awslogsd
systemctl enable awslogsd`),
		})

		// Create target group
		targetGroup := lbtargetgroup.NewLbTargetGroup(stack, jsii.String(fmt.Sprintf("target-group-%s", region)), &lbtargetgroup.LbTargetGroupConfig{
			Provider: regionProvider,
			Name:     jsii.String(fmt.Sprintf("tg-%s-%s", region, environmentSuffix)),
			Port:     jsii.Number(80),
			Protocol: jsii.String("HTTP"),
			VpcId:    vpcResource.Id(),
			HealthCheck: &lbtargetgroup.LbTargetGroupHealthCheck{
				Path:               jsii.String("/"),
				HealthyThreshold:   jsii.Number(2),
				UnhealthyThreshold: jsii.Number(2),
				Timeout:            jsii.Number(5),
				Interval:           jsii.Number(30),
				Matcher:            jsii.String("200"),
			},
		})

		// Create Application Load Balancer
		alb := lb.NewLb(stack, jsii.String(fmt.Sprintf("alb-%s", region)), &lb.LbConfig{
			Provider:         regionProvider,
			Name:             jsii.String(fmt.Sprintf("alb-%s-%s", region, environmentSuffix)),
			LoadBalancerType: jsii.String("application"),
			Subnets:          &[]*string{publicSubnets[0].Id(), publicSubnets[1].Id()},
			SecurityGroups:   &[]*string{webSecurityGroup.Id()},
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("alb-%s-%s", region, environmentSuffix)),
			},
		})

		// Create ALB listener (fixed type mismatch)
		lblistener.NewLbListener(stack, jsii.String(fmt.Sprintf("alb-listener-%s", region)), &lblistener.LbListenerConfig{
			Provider:        regionProvider,
			LoadBalancerArn: alb.Arn(),
			Port:            jsii.Number(80), // Fixed: use jsii.Number instead of jsii.String
			Protocol:        jsii.String("HTTP"),
			DefaultAction: []lblistener.LbListenerDefaultAction{
				{
					Type:           jsii.String("forward"),
					TargetGroupArn: targetGroup.Arn(),
				},
			},
		})

		// Create Auto Scaling Group
		autoscalinggroup.NewAutoscalingGroup(stack, jsii.String(fmt.Sprintf("asg-%s", region)), &autoscalinggroup.AutoscalingGroupConfig{
			Provider:               regionProvider,
			Name:                   jsii.String(fmt.Sprintf("asg-%s-%s", region, environmentSuffix)),
			VpcZoneIdentifier:      &[]*string{privateSubnets[0].Id(), privateSubnets[1].Id()},
			TargetGroupArns:        &[]*string{targetGroup.Arn()},
			HealthCheckType:        jsii.String("ELB"),
			HealthCheckGracePeriod: jsii.Number(300),
			MinSize:                jsii.Number(2),
			MaxSize:                jsii.Number(6),
			DesiredCapacity:        jsii.Number(2),
			LaunchTemplate: &autoscalinggroup.AutoscalingGroupLaunchTemplate{
				Id:      launchTemplate.Id(),
				Version: jsii.String("$Latest"),
			},
			Tag: []autoscalinggroup.AutoscalingGroupTag{
				{
					Key:               jsii.String("Name"),
					Value:             jsii.String(fmt.Sprintf("asg-instance-%s-%s", region, environmentSuffix)),
					PropagateAtLaunch: jsii.Bool(true),
				},
			},
		})

		// Create DB subnet group
		dbSubnetGroup := dbsubnetgroup.NewDbSubnetGroup(stack, jsii.String(fmt.Sprintf("db-subnet-group-%s", region)), &dbsubnetgroup.DbSubnetGroupConfig{
			Provider:  regionProvider,
			Name:      jsii.String(fmt.Sprintf("db-subnet-group-%s-%s", region, environmentSuffix)),
			SubnetIds: &[]*string{privateSubnets[0].Id(), privateSubnets[1].Id()},
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("db-subnet-group-%s-%s", region, environmentSuffix)),
			},
		})

		// Create RDS instance
		dbinstance.NewDbInstance(stack, jsii.String(fmt.Sprintf("rds-%s", region)), &dbinstance.DbInstanceConfig{
			Provider:              regionProvider,
			Identifier:            jsii.String(fmt.Sprintf("rds-%s-%s", region, environmentSuffix)),
			AllocatedStorage:      jsii.Number(20),
			StorageType:           jsii.String("gp2"),
			Engine:                jsii.String("mysql"),
			EngineVersion:         jsii.String("8.0"),
			InstanceClass:         jsii.String("db.t3.micro"),
			DbName:                jsii.String("appdb"),
			Username:              jsii.String("admin"),
			Password:              jsii.String("changeme123!"), // In production, use AWS Secrets Manager
			DbSubnetGroupName:     dbSubnetGroup.Name(),
			VpcSecurityGroupIds:   &[]*string{rdsSecurityGroup.Id()},
			BackupRetentionPeriod: jsii.Number(7),
			BackupWindow:          jsii.String("03:00-04:00"),
			MaintenanceWindow:     jsii.String("sun:04:00-sun:05:00"),
			StorageEncrypted:      jsii.Bool(true),
			KmsKeyId:              kmsKey.Arn(),
			SkipFinalSnapshot:     jsii.Bool(true),
			Tags: &map[string]*string{
				"Name": jsii.String(fmt.Sprintf("rds-%s-%s", region, environmentSuffix)),
			},
		})
	}

	// Create AWS Config (only in us-east-1 to avoid duplication)
	configBucket := s3bucket.NewS3Bucket(stack, jsii.String("config-bucket"), &s3bucket.S3BucketConfig{
		Provider: providerEast,
		Bucket:   jsii.String(fmt.Sprintf("aws-config-bucket-%s-%s", environmentSuffix, *callerIdentity.AccountId())),
		ServerSideEncryptionConfiguration: []s3bucket.S3BucketServerSideEncryptionConfiguration{
			{
				Rule: s3bucket.S3BucketServerSideEncryptionConfigurationRule{
					ApplyServerSideEncryptionByDefault: s3bucket.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
						SseAlgorithm:   jsii.String("aws:kms"),
						KmsMasterKeyId: kmsKeyEast.Arn(),
					},
				},
			},
		},
	})

	// Block public access to Config bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("config-bucket-pab"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Provider:              providerEast,
		Bucket:                configBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Create Config service role
	configRole := iamrole.NewIamRole(stack, jsii.String("config-role"), &iamrole.IamRoleConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("config-role-%s", environmentSuffix)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "config.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
	})

	// Attach AWS Config service role policy
	iampolicyattachment.NewIamPolicyAttachment(stack, jsii.String("config-service-role-policy"), &iampolicyattachment.IamPolicyAttachmentConfig{
		Provider:  providerEast,
		Name:      jsii.String(fmt.Sprintf("config-service-role-policy-%s", environmentSuffix)),
		Roles:     &[]*string{configRole.Name()},
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"),
	})

	// Create Config delivery channel policy
	configDeliveryPolicy := iampolicy.NewIamPolicy(stack, jsii.String("config-delivery-policy"), &iampolicy.IamPolicyConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("config-delivery-policy-%s", environmentSuffix)),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"s3:GetBucketAcl",
						"s3:ListBucket"
					],
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Action": "s3:PutObject",
					"Resource": "%s/*",
					"Condition": {
						"StringEquals": {
							"s3:x-amz-acl": "bucket-owner-full-control"
						}
					}
				},
				{
					"Effect": "Allow",
					"Action": "s3:GetObject",
					"Resource": "%s/*"
				}
			]
		}`, *configBucket.Arn(), *configBucket.Arn(), *configBucket.Arn())),
	})

	// Attach Config delivery policy
	iampolicyattachment.NewIamPolicyAttachment(stack, jsii.String("config-delivery-policy-attachment"), &iampolicyattachment.IamPolicyAttachmentConfig{
		Provider:  providerEast,
		Name:      jsii.String(fmt.Sprintf("config-delivery-policy-attachment-%s", environmentSuffix)),
		Roles:     &[]*string{configRole.Name()},
		PolicyArn: configDeliveryPolicy.Arn(),
	})

	// Create Config configuration recorder
	configRecorder := configconfigurationrecorder.NewConfigConfigurationRecorder(stack, jsii.String("config-recorder"), &configconfigurationrecorder.ConfigConfigurationRecorderConfig{
		Provider: providerEast,
		Name:     jsii.String(fmt.Sprintf("config-recorder-%s", environmentSuffix)),
		RoleArn:  configRole.Arn(),
		RecordingGroup: &configconfigurationrecorder.ConfigConfigurationRecorderRecordingGroup{
			AllSupported:               jsii.Bool(true),
			IncludeGlobalResourceTypes: jsii.Bool(true),
		},
	})

	// Create Config delivery channel
	configdeliverychannel.NewConfigDeliveryChannel(stack, jsii.String("config-delivery-channel"), &configdeliverychannel.ConfigDeliveryChannelConfig{
		Provider:     providerEast,
		Name:         jsii.String(fmt.Sprintf("config-delivery-channel-%s", environmentSuffix)),
		S3BucketName: configBucket.Bucket(),
	})

	// Create Config rules
	configRules := []struct {
		name        string
		source      string
		description string
	}{
		{
			name:        "s3-bucket-ssl-requests-only",
			source:      "S3_BUCKET_SSL_REQUESTS_ONLY",
			description: "Checks whether S3 buckets have policies that require requests to use SSL",
		},
		{
			name:        "encrypted-volumes",
			source:      "ENCRYPTED_VOLUMES",
			description: "Checks whether EBS volumes are encrypted",
		},
		{
			name:        "rds-storage-encrypted",
			source:      "RDS_STORAGE_ENCRYPTED",
			description: "Checks whether storage encryption is enabled for RDS DB instances",
		},
	}

	for _, rule := range configRules {
		configconfigrule.NewConfigConfigRule(stack, jsii.String(fmt.Sprintf("config-rule-%s", rule.name)), &configconfigrule.ConfigConfigRuleConfig{
			Provider:    providerEast,
			Name:        jsii.String(fmt.Sprintf("%s-%s", rule.name, environmentSuffix)),
			Description: jsii.String(rule.description),
			Source: &configconfigrule.ConfigConfigRuleSource{
				Owner:            jsii.String("AWS"),
				SourceIdentifier: jsii.String(rule.source),
			},
			DependsOn: &[]cdktf.ITerraformDependable{configRecorder},
		})
	}

	return stack
}

func main() {
	app := cdktf.NewApp(nil)
	NewTapStack(app, "TapStack")
	app.Synth()
}
```

## Key Fixes Applied

### 🔧 **Build Error Resolutions**

1. **S3 Bucket Encryption**: Used the built-in `ServerSideEncryptionConfiguration` property of the S3 bucket resource instead of a separate encryption configuration resource
2. **Type Mismatch**: Fixed ALB listener port from `jsii.String("80")` to `jsii.Number(80)`
3. **Unused Variable**: Removed the unused `azs` variable that was declared but not used
4. **Package Imports**: Removed the non-existent `s3bucketserversideencryptionconfiguration` import

### 🏗️ **Infrastructure Features Maintained**

✅ **Multi-Region Deployment**: us-east-1 and us-west-2  
✅ **VPC with Public/Private Subnets**: Proper network segmentation  
✅ **Application Load Balancer**: Internet-facing with health checks  
✅ **Auto Scaling Groups**: 2-6 instances with ELB health checks  
✅ **Security Groups**: HTTP/HTTPS allowed, SSH restricted to internal networks  
✅ **RDS with Encryption**: MySQL 8.0 with KMS encryption and backups  
✅ **S3 with KMS Encryption**: Static content bucket with restricted access  
✅ **CloudWatch Logs**: EC2 instance logs sent to CloudWatch  
✅ **IAM with MFA**: Least-privilege roles and MFA enforcement  
✅ **AWS Config**: Compliance monitoring with encryption rules  

### 🚀 **Deployment Commands**

```bash
# Initialize Go modules
go mod init cdktf-infrastructure
go mod tidy

# Set environment variables
export ENVIRONMENT_SUFFIX="prod"
export TERRAFORM_STATE_BUCKET="your-terraform-state-bucket"
export TERRAFORM_STATE_BUCKET_REGION="us-east-1"

# Synthesize and deploy
cdktf synth
cdktf plan
cdktf deploy
```

This version should now build successfully without any compilation errors while maintaining all the required security and infrastructure features.