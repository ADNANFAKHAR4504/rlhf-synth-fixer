package main

import (
	"fmt"
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchloggroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchmetricalarm"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawscalleridentity"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iampolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lb"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lblistener"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/lbtargetgroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
)

// TapStack creates a secure web application infrastructure
func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(config.Region),
		DefaultTags: []*provider.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment":       jsii.String("production"),
					"Project":           jsii.String("secure-web-app"),
					"ManagedBy":         jsii.String("cdktf"),
					"EnvironmentSuffix": jsii.String(config.EnvironmentSuffix),
				},
			},
		},
	})

	// Get current AWS account ID and caller identity
	currentIdentity := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{})
	accountId := currentIdentity.AccountId()

	// VPC Configuration
	webAppVpc := vpc.NewVpc(stack, jsii.String("WebAppVPC"), &vpc.VpcConfig{
		CidrBlock:          jsii.String("10.0.0.0/16"),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webapp-vpc-%s", config.EnvironmentSuffix)),
		},
	})

	// Internet Gateway
	internetGateway := internetgateway.NewInternetGateway(stack, jsii.String("WebAppIGW"), &internetgateway.InternetGatewayConfig{
		VpcId: webAppVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webapp-igw-%s", config.EnvironmentSuffix)),
		},
	})

	// Public Subnets (for Load Balancer)
	publicSubnet1 := subnet.NewSubnet(stack, jsii.String("PublicSubnet1"), &subnet.SubnetConfig{
		VpcId:               webAppVpc.Id(),
		CidrBlock:           jsii.String("10.0.1.0/24"),
		AvailabilityZone:    jsii.String(config.Region + "a"),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webapp-public-subnet-1-%s", config.EnvironmentSuffix)),
		},
	})

	publicSubnet2 := subnet.NewSubnet(stack, jsii.String("PublicSubnet2"), &subnet.SubnetConfig{
		VpcId:               webAppVpc.Id(),
		CidrBlock:           jsii.String("10.0.2.0/24"),
		AvailabilityZone:    jsii.String(config.Region + "b"),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webapp-public-subnet-2-%s", config.EnvironmentSuffix)),
		},
	})

	// Route Table for Public Subnets
	publicRouteTable := routetable.NewRouteTable(stack, jsii.String("PublicRouteTable"), &routetable.RouteTableConfig{
		VpcId: webAppVpc.Id(),
		Route: []interface{}{
			map[string]interface{}{
				"cidrBlock": "0.0.0.0/0",
				"gatewayId": internetGateway.Id(),
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webapp-public-rt-%s", config.EnvironmentSuffix)),
		},
	})

	// Associate public subnets with route table
	routetableassociation.NewRouteTableAssociation(stack, jsii.String("PublicSubnet1Assoc"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet1.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	routetableassociation.NewRouteTableAssociation(stack, jsii.String("PublicSubnet2Assoc"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet2.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	// KMS Key for S3 Encryption
	s3KmsKey := kmskey.NewKmsKey(stack, jsii.String("S3EncryptionKey"), &kmskey.KmsKeyConfig{
		Description:          jsii.String("KMS key for S3 bucket encryption"),
		EnableKeyRotation:    jsii.Bool(true),
		RotationPeriodInDays: jsii.Number(90),
		DeletionWindowInDays: jsii.Number(7),
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
						"kms:GenerateDataKey"
					],
					"Resource": "*"
				}
			]
		}`, *accountId)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("s3-encryption-key-%s", config.EnvironmentSuffix)),
		},
	})

	// KMS Key Alias
	kmsalias.NewKmsAlias(stack, jsii.String("S3EncryptionKeyAlias"), &kmsalias.KmsAliasConfig{
		Name:        jsii.String(fmt.Sprintf("alias/s3-webs-app-enc-key-%s", config.EnvironmentSuffix)),
		TargetKeyId: s3KmsKey.Id(),
	})

	// Security Group for Load Balancer (HTTPS only - port 443)
	albSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("ALBSecurityGroup"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("alb-security-group-%s", config.EnvironmentSuffix)),
		Description: jsii.String("Security group for Application Load Balancer - HTTPS only"),
		VpcId:       webAppVpc.Id(),
		Ingress: []interface{}{
			map[string]interface{}{
				"fromPort":    443,
				"toPort":      443,
				"protocol":    "tcp",
				"cidrBlocks":  []string{"0.0.0.0/0"},
				"description": "Allow HTTPS traffic",
			},
		},
		Egress: []interface{}{
			map[string]interface{}{
				"fromPort":    0,
				"toPort":      65535,
				"protocol":    "tcp",
				"cidrBlocks":  []string{"0.0.0.0/0"},
				"description": "Allow all outbound traffic",
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("alb-https-only-sg-%s", config.EnvironmentSuffix)),
		},
	})

	// Security Group for Application Servers (HTTPS from ALB only)
	appSecurityGroup := securitygroup.NewSecurityGroup(stack, jsii.String("AppSecurityGroup"), &securitygroup.SecurityGroupConfig{
		Name:        jsii.String(fmt.Sprintf("app-security-group-%s", config.EnvironmentSuffix)),
		Description: jsii.String("Security group for application servers - HTTPS from ALB only"),
		VpcId:       webAppVpc.Id(),
		Ingress: []interface{}{
			map[string]interface{}{
				"fromPort":       443,
				"toPort":         443,
				"protocol":       "tcp",
				"securityGroups": []string{*albSecurityGroup.Id()},
				"description":    "Allow HTTPS from ALB only",
			},
		},
		Egress: []interface{}{
			map[string]interface{}{
				"fromPort":    443,
				"toPort":      443,
				"protocol":    "tcp",
				"cidrBlocks":  []string{"0.0.0.0/0"},
				"description": "Allow HTTPS outbound",
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("app-https-only-sg-%s", config.EnvironmentSuffix)),
		},
	})

	// S3 Bucket for Web Application Storage with KMS encryption
	webAppBucket := s3bucket.NewS3Bucket(stack, jsii.String("WebAppBucket"), &s3bucket.S3BucketConfig{
		BucketPrefix: jsii.String(fmt.Sprintf("secure-webapp-storage-%s-", config.EnvironmentSuffix)),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webapp-bucket-%s", config.EnvironmentSuffix)),
		},
	})

	// Block all public access to S3 bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(stack, jsii.String("WebAppBucketPublicBlock"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                webAppBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// S3 Bucket Policy for secure access
	s3bucketpolicy.NewS3BucketPolicy(stack, jsii.String("WebAppBucketPolicy"), &s3bucketpolicy.S3BucketPolicyConfig{
		Bucket: webAppBucket.Id(),
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
						"Bool": {
							"aws:SecureTransport": "false"
						}
					}
				},
				{
					"Sid": "RequireKMSEncryption",
					"Effect": "Deny",
					"Principal": "*",
					"Action": "s3:PutObject",
					"Resource": "%s/*",
					"Condition": {
						"StringNotEquals": {
							"s3:x-amz-server-side-encryption": "aws:kms"
						}
					}
				}
			]
		}`, *webAppBucket.Arn(), *webAppBucket.Arn(), *webAppBucket.Arn())),
	})

	// IAM Role for Application Servers
	appRole := iamrole.NewIamRole(stack, jsii.String("AppRole"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("secure-webs-app-roles-%s", config.EnvironmentSuffix)),
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
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("app-server-role-%s", config.EnvironmentSuffix)),
		},
	})

	// IAM Policy for S3 access (least privilege)
	s3AccessPolicy := iampolicy.NewIamPolicy(stack, jsii.String("S3AccessPolicy"), &iampolicy.IamPolicyConfig{
		Name:        jsii.String(fmt.Sprintf("secure-webs-app-s3-policy-%s", config.EnvironmentSuffix)),
		Description: jsii.String("Least privilege policy for S3 access"),
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
					"Resource": "%s/*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"s3:ListBucket"
					],
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Action": [
						"kms:Decrypt",
						"kms:GenerateDataKey"
					],
					"Resource": "%s"
				}
			]
		}`, *webAppBucket.Arn(), *webAppBucket.Arn(), *s3KmsKey.Arn())),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("s3-access-policy-%s", config.EnvironmentSuffix)),
		},
	})

	// Attach S3 policy to app role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("AppRoleS3PolicyAttachment"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		PolicyArn: s3AccessPolicy.Arn(),
		Role:      appRole.Name(),
	})

	// CloudWatch Log Group for Security Events
	securityLogGroup := cloudwatchloggroup.NewCloudwatchLogGroup(stack, jsii.String("SecurityEventsLogGroup"), &cloudwatchloggroup.CloudwatchLogGroupConfig{
		Name:            jsii.String(fmt.Sprintf("/aws/security/event/logs-stack%s", config.EnvironmentSuffix)),
		RetentionInDays: jsii.Number(90),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-events-logs-%s", config.EnvironmentSuffix)),
		},
	})

	// CloudWatch Alarm for security monitoring
	cloudwatchmetricalarm.NewCloudwatchMetricAlarm(stack, jsii.String("SecurityAlarm"), &cloudwatchmetricalarm.CloudwatchMetricAlarmConfig{
		AlarmName:          jsii.String(fmt.Sprintf("SecurityViolation-%s", config.EnvironmentSuffix)),
		AlarmDescription:   jsii.String("Alert on security violations"),
		ComparisonOperator: jsii.String("GreaterThanThreshold"),
		EvaluationPeriods:  jsii.Number(1),
		MetricName:         jsii.String("UnauthorizedAPICallsAttempt"),
		Namespace:          jsii.String("CloudTrailMetrics"),
		Period:             jsii.Number(300),
		Statistic:          jsii.String("Sum"),
		Threshold:          jsii.Number(1),
		TreatMissingData:   jsii.String("notBreaching"),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("security-violation-alarm-%s", config.EnvironmentSuffix)),
		},
	})

	// Application Load Balancer
	appLoadBalancer := lb.NewLb(stack, jsii.String("AppLoadBalancer"), &lb.LbConfig{
		Name:                     jsii.String(fmt.Sprintf("secure-webs-app-alb-app-%s", config.EnvironmentSuffix)),
		LoadBalancerType:         jsii.String("application"),
		IpAddressType:            jsii.String("ipv4"),
		Subnets:                  jsii.Strings(*publicSubnet1.Id(), *publicSubnet2.Id()),
		SecurityGroups:           jsii.Strings(*albSecurityGroup.Id()),
		EnableHttp2:              jsii.Bool(true),
		EnableDeletionProtection: jsii.Bool(false),
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webs-app-alb-app-%s", config.EnvironmentSuffix)),
		},
	})

	// Target Group for Application Servers
	appTargetGroup := lbtargetgroup.NewLbTargetGroup(stack, jsii.String("AppTargetGroup"), &lbtargetgroup.LbTargetGroupConfig{
		Name:       jsii.String(fmt.Sprintf("secure-webs-app-tg-app-%s", config.EnvironmentSuffix)),
		Port:       jsii.Number(443),
		Protocol:   jsii.String("HTTPS"),
		VpcId:      webAppVpc.Id(),
		TargetType: jsii.String("instance"),
		HealthCheck: &lbtargetgroup.LbTargetGroupHealthCheck{
			Enabled:            jsii.Bool(true),
			HealthyThreshold:   jsii.Number(2),
			Interval:           jsii.Number(30),
			Matcher:            jsii.String("200"),
			Path:               jsii.String("/health"),
			Port:               jsii.String("traffic-port"),
			Protocol:           jsii.String("HTTPS"),
			Timeout:            jsii.Number(5),
			UnhealthyThreshold: jsii.Number(2),
		},
		Tags: &map[string]*string{
			"Name": jsii.String(fmt.Sprintf("secure-webapptargetapp-group-%s", config.EnvironmentSuffix)),
		},
	})

	// HTTPS Listener for ALB (using port 443 but with HTTP protocol for testing without cert)
	lblistener.NewLbListener(stack, jsii.String("AppALBListener"), &lblistener.LbListenerConfig{
		LoadBalancerArn: appLoadBalancer.Arn(),
		Port:            jsii.Number(443),
		Protocol:        jsii.String("HTTP"), // Use HTTP for now as HTTPS requires certificate
		DefaultAction: []*lblistener.LbListenerDefaultAction{
			{
				Type:           jsii.String("forward"),
				TargetGroupArn: appTargetGroup.Arn(),
			},
		},
	})

	// Outputs
	cdktf.NewTerraformOutput(stack, jsii.String("VpcId"), &cdktf.TerraformOutputConfig{
		Value:       webAppVpc.Id(),
		Description: jsii.String("VPC ID for the secure web application"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("S3BucketName"), &cdktf.TerraformOutputConfig{
		Value:       webAppBucket.Id(),
		Description: jsii.String("S3 bucket name for secure storage"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("KMSKeyId"), &cdktf.TerraformOutputConfig{
		Value:       s3KmsKey.Id(),
		Description: jsii.String("KMS key ID for encryption"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("LoadBalancerDNS"), &cdktf.TerraformOutputConfig{
		Value:       appLoadBalancer.DnsName(),
		Description: jsii.String("Application Load Balancer DNS name"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("ALBSecurityGroupId"), &cdktf.TerraformOutputConfig{
		Value:       albSecurityGroup.Id(),
		Description: jsii.String("Security group ID for ALB"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("AppSecurityGroupId"), &cdktf.TerraformOutputConfig{
		Value:       appSecurityGroup.Id(),
		Description: jsii.String("Security group ID for application servers"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("AppRoleArn"), &cdktf.TerraformOutputConfig{
		Value:       appRole.Arn(),
		Description: jsii.String("IAM role ARN for application servers"),
	})

	cdktf.NewTerraformOutput(stack, jsii.String("SecurityLogGroupName"), &cdktf.TerraformOutputConfig{
		Value:       securityLogGroup.Name(),
		Description: jsii.String("CloudWatch log group for security events"),
	})

	return stack
}

// TapStackConfig holds configuration for the TapStack
type TapStackConfig struct {
	Region            string
	EnvironmentSuffix string
}

func main() {
	app := cdktf.NewApp(nil)

	// Get environment configuration
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}

	environmentSuffix := os.Getenv("ENVIRONMENT_SUFFIX")
	if environmentSuffix == "" {
		environmentSuffix = fmt.Sprintf("synthtrainr967")
	}

	config := &TapStackConfig{
		Region:            region,
		EnvironmentSuffix: environmentSuffix,
	}

	stackName := fmt.Sprintf("TapStack%s", environmentSuffix)
	NewTapStack(app, stackName, config)

	app.Synth()
}
