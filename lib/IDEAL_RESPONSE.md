```go
package main

import (
	"os"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"

	aws "github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatchmetricalarm"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsami"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iaminstanceprofile"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/instance"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/internetgateway"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/route"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetable"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/routetableassociation"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketencryption"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketpublicaccessblock"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/securitygroup"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/snstopic"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/subnet"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/vpc"
)

// TapStack represents our secure AWS environment
type TapStack struct {
	cdktf.TerraformStack
}

// NewTapStack creates a new TapStack instance
func NewTapStack(scope constructs.Construct, id string) *TapStack {
	this := &TapStack{}
	cdktf.NewTerraformStack_Override(this, scope, &id)

	// Get environment configuration
	environmentSuffix := getEnvVar("ENVIRONMENT_SUFFIX", "dev")
	awsRegion := getEnvVar("AWS_REGION", "us-east-1")

	// Configure AWS Provider
	aws.NewAwsProvider(this, jsii.String("aws"), &aws.AwsProviderConfig{
		Region: jsii.String(awsRegion),
		DefaultTags: &[]*aws.AwsProviderDefaultTags{
			{
				Tags: &map[string]*string{
					"Environment":   jsii.String(environmentSuffix),
					"Project":       jsii.String("tap"),
					"ManagedBy":     jsii.String("cdktf"),
					"Repository":    jsii.String(getEnvVar("REPOSITORY", "iac-test-automations")),
					"CommitAuthor":  jsii.String(getEnvVar("COMMIT_AUTHOR", "unknown")),
				},
			},
		},
	})

	// Create KMS Key for encryption at rest
	kmsKey := kmskey.NewKmsKey(this, jsii.String("TapKmsKey"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for TAP infrastructure encryption"),
		KeyUsage:    jsii.String("ENCRYPT_DECRYPT"),
		KeySpec:     jsii.String("SYMMETRIC_DEFAULT"),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-kms-key-" + environmentSuffix),
		},
	})

	// Create VPC with private subnets
	tapVpc := vpc.NewVpc(this, jsii.String("TapVpc"), &vpc.VpcConfig{
		CidrBlock:          jsii.String("10.0.0.0/16"),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-vpc-" + environmentSuffix),
		},
	})

	// Create Internet Gateway for public subnet (needed for NAT Gateway)
	igw := internetgateway.NewInternetGateway(this, jsii.String("TapIgw"), &internetgateway.InternetGatewayConfig{
		VpcId: tapVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-igw-" + environmentSuffix),
		},
	})

	// Create public subnet for NAT Gateway
	publicSubnet := subnet.NewSubnet(this, jsii.String("TapPublicSubnet"), &subnet.SubnetConfig{
		VpcId:               tapVpc.Id(),
		CidrBlock:           jsii.String("10.0.1.0/24"),
		AvailabilityZone:    jsii.String(awsRegion + "a"),
		MapPublicIpOnLaunch: jsii.Bool(true),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-public-subnet-" + environmentSuffix),
			"Type": jsii.String("public"),
		},
	})

	// Create private subnet for application instances
	privateSubnet := subnet.NewSubnet(this, jsii.String("TapPrivateSubnet"), &subnet.SubnetConfig{
		VpcId:            tapVpc.Id(),
		CidrBlock:        jsii.String("10.0.2.0/24"),
		AvailabilityZone: jsii.String(awsRegion + "a"),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-private-subnet-" + environmentSuffix),
			"Type": jsii.String("private"),
		},
	})

	// Create route table for public subnet
	publicRouteTable := routetable.NewRouteTable(this, jsii.String("TapPublicRouteTable"), &routetable.RouteTableConfig{
		VpcId: tapVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-public-rt-" + environmentSuffix),
		},
	})

	// Create route to Internet Gateway
	route.NewRoute(this, jsii.String("TapPublicRoute"), &route.RouteConfig{
		RouteTableId:         publicRouteTable.Id(),
		DestinationCidrBlock: jsii.String("0.0.0.0/0"),
		GatewayId:            igw.Id(),
	})

	// Associate public subnet with public route table
	routetableassociation.NewRouteTableAssociation(this, jsii.String("TapPublicSubnetAssociation"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     publicSubnet.Id(),
		RouteTableId: publicRouteTable.Id(),
	})

	// Create route table for private subnet
	privateRouteTable := routetable.NewRouteTable(this, jsii.String("TapPrivateRouteTable"), &routetable.RouteTableConfig{
		VpcId: tapVpc.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-private-rt-" + environmentSuffix),
		},
	})

	// Associate private subnet with private route table
	routetableassociation.NewRouteTableAssociation(this, jsii.String("TapPrivateSubnetAssociation"), &routetableassociation.RouteTableAssociationConfig{
		SubnetId:     privateSubnet.Id(),
		RouteTableId: privateRouteTable.Id(),
	})

	// Create S3 bucket for application data
	tapBucket := s3bucket.NewS3Bucket(this, jsii.String("TapS3Bucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String("tap-app-data-" + environmentSuffix + "-" + generateRandomSuffix()),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-app-bucket-" + environmentSuffix),
		},
	})

	// Enable versioning on S3 bucket
	s3bucketversioning.NewS3BucketVersioningA(this, jsii.String("TapS3BucketVersioning"), &s3bucketversioning.S3BucketVersioningAConfig{
		Bucket: tapBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningAVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	// Enable encryption on S3 bucket
	s3bucketencryption.NewS3BucketServerSideEncryptionConfigurationA(this, jsii.String("TapS3BucketEncryption"), &s3bucketencryption.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: tapBucket.Id(),
		Rule: &[]*s3bucketencryption.S3BucketServerSideEncryptionConfigurationARule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketencryption.S3BucketServerSideEncryptionConfigurationARuleApplyServerSideEncryptionByDefault{
					SseAlgorithm:   jsii.String("aws:kms"),
					KmsMasterKeyId: kmsKey.Arn(),
				},
			},
		},
	})

	// Block public access to S3 bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(this, jsii.String("TapS3BucketPublicAccessBlock"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                tapBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Create IAM role for EC2 instances
	ec2Role := iamrole.NewIamRole(this, jsii.String("TapEc2Role"), &iamrole.IamRoleConfig{
		Name: jsii.String("tap-ec2-role-" + environmentSuffix),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [{
				"Effect": "Allow",
				"Principal": {"Service": "ec2.amazonaws.com"},
				"Action": "sts:AssumeRole"
			}]
		}`),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-ec2-role-" + environmentSuffix),
		},
	})

	// Attach S3 read-only policy to EC2 role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(this, jsii.String("TapEc2S3ReadOnlyPolicy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"),
	})

	// Attach CloudWatch agent policy to EC2 role
	iamrolepolicyattachment.NewIamRolePolicyAttachment(this, jsii.String("TapEc2CloudWatchPolicy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      ec2Role.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"),
	})

	// Create instance profile for EC2 role
	ec2InstanceProfile := iaminstanceprofile.NewIamInstanceProfile(this, jsii.String("TapEc2InstanceProfile"), &iaminstanceprofile.IamInstanceProfileConfig{
		Name: jsii.String("tap-ec2-instance-profile-" + environmentSuffix),
		Role: ec2Role.Name(),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-ec2-instance-profile-" + environmentSuffix),
		},
	})

	// Create security group for EC2 instances (SSL/TLS enforcement)
	ec2SecurityGroup := securitygroup.NewSecurityGroup(this, jsii.String("TapEc2SecurityGroup"), &securitygroup.SecurityGroupConfig{
		Name:  jsii.String("tap-ec2-sg-" + environmentSuffix),
		VpcId: tapVpc.Id(),
		Description: jsii.String("Security group for TAP EC2 instances with SSL/TLS enforcement"),
		
		// Ingress rules - HTTPS only
		Ingress: &[]*securitygroup.SecurityGroupIngress{
			{
				Description: jsii.String("HTTPS"),
				FromPort:    jsii.Number(443),
				ToPort:      jsii.Number(443),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("10.0.0.0/16")}, // VPC only
			},
			{
				Description: jsii.String("SSH"),
				FromPort:    jsii.Number(22),
				ToPort:      jsii.Number(22),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("10.0.0.0/16")}, // VPC only
			},
		},
		
		// Egress rules - Allow HTTPS outbound
		Egress: &[]*securitygroup.SecurityGroupEgress{
			{
				Description: jsii.String("HTTPS outbound"),
				FromPort:    jsii.Number(443),
				ToPort:      jsii.Number(443),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("0.0.0.0/0")},
			},
			{
				Description: jsii.String("HTTP outbound for package updates"),
				FromPort:    jsii.Number(80),
				ToPort:      jsii.Number(80),
				Protocol:    jsii.String("tcp"),
				CidrBlocks:  &[]*string{jsii.String("0.0.0.0/0")},
			},
		},
		
		Tags: &map[string]*string{
			"Name": jsii.String("tap-ec2-sg-" + environmentSuffix),
		},
	})

	// Get latest Amazon Linux 2 AMI
	latestAmi := dataawsami.NewDataAwsAmi(this, jsii.String("TapLatestAmi"), &dataawsami.DataAwsAmiConfig{
		MostRecent: jsii.Bool(true),
		Owners:     &[]*string{jsii.String("amazon")},
		Filter: &[]*dataawsami.DataAwsAmiFilter{
			{
				Name:   jsii.String("name"),
				Values: &[]*string{jsii.String("amzn2-ami-hvm-*-x86_64-gp2")},
			},
			{
				Name:   jsii.String("state"),
				Values: &[]*string{jsii.String("available")},
			},
		},
	})

	// Create EC2 instance with detailed monitoring
	ec2Instance := instance.NewInstance(this, jsii.String("TapEc2Instance"), &instance.InstanceConfig{
		Ami:                    latestAmi.Id(),
		InstanceType:          jsii.String("t3.micro"),
		SubnetId:              privateSubnet.Id(),
		VpcSecurityGroupIds:   &[]*string{ec2SecurityGroup.Id()},
		IamInstanceProfile:    ec2InstanceProfile.Name(),
		Monitoring:            jsii.Bool(true), // Enable detailed monitoring
		DisableApiTermination: jsii.Bool(true), // Prevent accidental termination
		
		// User data script to install CloudWatch agent and configure HTTPS
		UserData: jsii.String(`#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
yum install -y awslogs

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "metrics": {
        "namespace": "TAP/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
`),
		
		// Root block device encryption
		RootBlockDevice: &instance.InstanceRootBlockDevice{
			VolumeType: jsii.String("gp3"),
			VolumeSize: jsii.Number(20),
			Encrypted:  jsii.Bool(true),
			KmsKeyId:   kmsKey.Arn(),
		},
		
		Tags: &map[string]*string{
			"Name": jsii.String("tap-ec2-instance-" + environmentSuffix),
		},
	})

	// Create SNS topic for CloudWatch alarms
	snsTopic := snstopic.NewSnsTopic(this, jsii.String("TapSnsTopic"), &snstopic.SnsTopicConfig{
		Name: jsii.String("tap-cpu-alarm-topic-" + environmentSuffix),
		KmsMasterKeyId: kmsKey.Id(),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-sns-topic-" + environmentSuffix),
		},
	})

	// Create CloudWatch alarm for CPU utilization > 70%
	cloudwatchmetricalarm.NewCloudwatchMetricAlarm(this, jsii.String("TapCpuAlarm"), &cloudwatchmetricalarm.CloudwatchMetricAlarmConfig{
		AlarmName:          jsii.String("tap-cpu-high-alarm-" + environmentSuffix),
		ComparisonOperator: jsii.String("GreaterThanThreshold"),
		EvaluationPeriods:  jsii.String("2"),
		MetricName:         jsii.String("CPUUtilization"),
		Namespace:          jsii.String("AWS/EC2"),
		Period:             jsii.String("300"), // 5 minutes
		Statistic:          jsii.String("Average"),
		Threshold:          jsii.Number(70),
		AlarmDescription:   jsii.String("This metric monitors ec2 cpu utilization"),
		AlarmActions:       &[]*string{snsTopic.Arn()},
		Dimensions: &map[string]*string{
			"InstanceId": ec2Instance.Id(),
		},
		Tags: &map[string]*string{
			"Name": jsii.String("tap-cpu-alarm-" + environmentSuffix),
		},
	})

	// Create S3 bucket for CloudTrail logs
	cloudTrailBucket := s3bucket.NewS3Bucket(this, jsii.String("TapCloudTrailBucket"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String("tap-cloudtrail-logs-" + environmentSuffix + "-" + generateRandomSuffix()),
		Tags: &map[string]*string{
			"Name": jsii.String("tap-cloudtrail-bucket-" + environmentSuffix),
		},
	})

	// Enable encryption on CloudTrail S3 bucket
	s3bucketencryption.NewS3BucketServerSideEncryptionConfigurationA(this, jsii.String("TapCloudTrailBucketEncryption"), &s3bucketencryption.S3BucketServerSideEncryptionConfigurationAConfig{
		Bucket: cloudTrailBucket.Id(),
		Rule: &[]*s3bucketencryption.S3BucketServerSideEncryptionConfigurationARule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketencryption.S3BucketServerSideEncryptionConfigurationARuleApplyServerSideEncryptionByDefault{
					SseAlgorithm:   jsii.String("aws:kms"),
					KmsMasterKeyId: kmsKey.Arn(),
				},
			},
		},
	})

	// Block public access to CloudTrail S3 bucket
	s3bucketpublicaccessblock.NewS3BucketPublicAccessBlock(this, jsii.String("TapCloudTrailBucketPublicAccessBlock"), &s3bucketpublicaccessblock.S3BucketPublicAccessBlockConfig{
		Bucket:                cloudTrailBucket.Id(),
		BlockPublicAcls:       jsii.Bool(true),
		BlockPublicPolicy:     jsii.Bool(true),
		IgnorePublicAcls:      jsii.Bool(true),
		RestrictPublicBuckets: jsii.Bool(true),
	})

	// Enable CloudTrail for auditing
	cloudtrail.NewCloudtrail(this, jsii.String("TapCloudTrail"), &cloudtrail.CloudtrailConfig{
		Name:                   jsii.String("tap-cloudtrail-" + environmentSuffix),
		S3BucketName:           cloudTrailBucket.Id(),
		IncludeGlobalServiceEvents: jsii.Bool(true),
		IsMultiRegionTrail:     jsii.Bool(true),
		EnableLogFileValidation: jsii.Bool(true),
		KmsKeyId:               kmsKey.Arn(),
		EventSelector: &[]*cloudtrail.CloudtrailEventSelector{
			{
				ReadWriteType:                 jsii.String("All"),
				IncludeManagementEvents:       jsii.Bool(true),
				DataResource: &[]*cloudtrail.CloudtrailEventSelectorDataResource{
					{
						Type:   jsii.String("AWS::S3::Object"),
						Values: &[]*string{jsii.String("arn:aws:s3:::*/*")},
					},
				},
			},
		},
		Tags: &map[string]*string{
			"Name": jsii.String("tap-cloudtrail-" + environmentSuffix),
		},
	})

	return this
}

// Helper function to get environment variables with default values
func getEnvVar(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// Helper function to generate a random suffix for unique resource names
func generateRandomSuffix() string {
	// In a real implementation, you might use a UUID or timestamp
	// For simplicity, we'll use a static suffix that can be made unique via environment
	return getEnvVar("ENVIRONMENT_SUFFIX", "dev")
}

func main() {
	app := cdktf.NewApp(nil)

	NewTapStack(app, "TapStack")

	app.Synth()
}
```