The error indicates that the S3 bucket names are conflicting because they already exist (likely from a previous deployment attempt). S3 bucket names must be globally unique across all AWS accounts. Let me fix this issue by implementing a better bucket naming strategy.

Here's the corrected code with proper S3 bucket naming:

```go
package main

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// FoundationStackProps defines the properties for our foundation stack
type FoundationStackProps struct {
	awscdk.StackProps
	// Configurable parameters
	AllowedSSHIP     *string // IP address allowed for SSH access
	EC2InstanceType  *string // EC2 instance type
	DBInstanceClass  *string // RDS instance class
	DBUsername       *string // Database username
	DBPassword       *string // Database password
}

// FoundationStack represents our main infrastructure stack
type FoundationStack struct {
	awscdk.Stack
}

// NewFoundationStack creates a new instance of the foundation stack
func NewFoundationStack(scope constructs.Construct, id string, props *FoundationStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Default values for parameters
	if props.AllowedSSHIP == nil {
		props.AllowedSSHIP = jsii.String("0.0.0.0/0") // Should be restricted in production
	}
	if props.EC2InstanceType == nil {
		props.EC2InstanceType = jsii.String("t3.micro")
	}
	if props.DBInstanceClass == nil {
		props.DBInstanceClass = jsii.String("t3.micro")
	}
	if props.DBUsername == nil {
		props.DBUsername = jsii.String("admin")
	}
	if props.DBPassword == nil {
		props.DBPassword = jsii.String("TempPassword123!")
	}

	// Common tags for all resources
	commonTags := map[string]*string{
		"Environment": jsii.String("Production"),
		"Project":     jsii.String("CDKSetup"),
	}

	// 1. Create VPC with public and private subnets
	vpc := awsec2.NewVpc(stack, jsii.String("cf-vpc"), &awsec2.VpcProps{
		Cidr:           jsii.String("10.0.0.0/16"),
		MaxAzs:         jsii.Number(2), // Use 2 AZs for high availability
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("cf-public-subnet"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("cf-private-subnet"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
		},
		NatGateways: jsii.Number(1), // Single NAT Gateway for cost optimization
	})

	// Apply tags to VPC
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String("cf-vpc"), nil)
	for key, value := range commonTags {
		awscdk.Tags_Of(vpc).Add(jsii.String(key), value, nil)
	}

	// 2. Create S3 buckets with proper naming to avoid conflicts
	// First create the logging bucket (no dependencies)
	loggingBucket := awss3.NewBucket(stack, jsii.String("cf-access-logs-bucket"), &awss3.BucketProps{
		// Let CDK generate a unique name automatically
		BucketName:        nil,
		PublicReadAccess:  jsii.Bool(false),
		PublicWriteAccess: jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		// Add lifecycle rule to manage log retention
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Id:      jsii.String("DeleteOldLogs"),
				Enabled: jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(90)),
			},
		},
	})

	// Main application bucket with access logging enabled
	bucket := awss3.NewBucket(stack, jsii.String("cf-assets-bucket"), &awss3.BucketProps{
		// Let CDK generate a unique name automatically
		BucketName:             nil,
		Versioned:              jsii.Bool(true),
		PublicReadAccess:       jsii.Bool(false),
		PublicWriteAccess:      jsii.Bool(false),
		BlockPublicAccess:      awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:             awss3.BucketEncryption_S3_MANAGED,
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
	})

	// Apply tags to S3 buckets
	for key, value := range commonTags {
		awscdk.Tags_Of(bucket).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(loggingBucket).Add(jsii.String(key), value, nil)
	}

	// 3. Create VPC Endpoint for S3
	s3VpcEndpoint := awsec2.NewGatewayVpcEndpoint(stack, jsii.String("cf-s3-vpc-endpoint"), &awsec2.GatewayVpcEndpointProps{
		Vpc:     vpc,
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
		Subnets: &[]*awsec2.SubnetSelection{
			{
				SubnetType: awsec2.SubnetType_PUBLIC,
			},
			{
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
		},
	})

	// Apply tags to VPC Endpoint
	for key, value := range commonTags {
		awscdk.Tags_Of(s3VpcEndpoint).Add(jsii.String(key), value, nil)
	}

	// 4. Create Security Groups

	// Security Group for EC2 instance
	ec2SecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("cf-ec2-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("cf-ec2-sg"),
		Description:       jsii.String("Security group for EC2 web server"),
		AllowAllOutbound:  jsii.Bool(true),
	})

	// Add inbound rules for EC2 security group
	ec2SecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP traffic from anywhere"),
		jsii.Bool(false),
	)

	ec2SecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS traffic from anywhere"),
		jsii.Bool(false),
	)

	ec2SecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(props.AllowedSSHIP),
		awsec2.Port_Tcp(jsii.Number(22)),
		jsii.String("Allow SSH from specified IP"),
		jsii.Bool(false),
	)

	// Security Group for RDS instance
	rdsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("cf-rds-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("cf-rds-sg"),
		Description:       jsii.String("Security group for RDS MySQL instance"),
		AllowAllOutbound:  jsii.Bool(false),
	})

	// Allow MySQL traffic only from EC2 security group
	rdsSecurityGroup.AddIngressRule(
		ec2SecurityGroup,
		awsec2.Port_Tcp(jsii.Number(3306)),
		jsii.String("Allow MySQL traffic from EC2 instances"),
		jsii.Bool(false),
	)

	// Apply tags to security groups
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2SecurityGroup).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(rdsSecurityGroup).Add(jsii.String(key), value, nil)
	}

	// 5. Create IAM Role for EC2 instance
	ec2Role := awsiam.NewRole(stack, jsii.String("cf-ec2-role"), &awsiam.RoleProps{
		RoleName:  jsii.String("cf-ec2-role"),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})

	// Add S3 read-only policy to EC2 role
	s3Policy := awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: &[]*string{
			jsii.String("s3:GetObject"),
			jsii.String("s3:ListBucket"),
		},
		Resources: &[]*string{
			bucket.BucketArn(),
			bucket.ArnForObjects(jsii.String("*")),
		},
	})

	ec2Role.AddToPolicy(s3Policy)

	// Apply tags to IAM role
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2Role).Add(jsii.String(key), value, nil)
	}

	// 6. Create RDS Subnet Group
	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("cf-db-subnet-group"), &awsrds.SubnetGroupProps{
		Description: jsii.String("Subnet group for RDS instance"),
		Vpc:         vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		SubnetGroupName: jsii.String("cf-db-subnet-group"),
	})

	// Apply tags to DB subnet group
	for key, value := range commonTags {
		awscdk.Tags_Of(dbSubnetGroup).Add(jsii.String(key), value, nil)
	}

	// 7. Create RDS MySQL instance
	rdsInstance := awsrds.NewDatabaseInstance(stack, jsii.String("cf-rds-mysql"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0_35(),
		}),
		InstanceType:       awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_MICRO),
		Vpc:                vpc,
		SecurityGroups:     &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		SubnetGroup:        dbSubnetGroup,
		DatabaseName:       jsii.String("cfdb"),
		Credentials: awsrds.Credentials_FromPassword(props.DBUsername, awscdk.SecretValue_UnsafePlainText(props.DBPassword)),
		MultiAz:            jsii.Bool(true), // Enable Multi-AZ for high availability
		AllocatedStorage:   jsii.Number(20),
		StorageType:        awsrds.StorageType_GP2,
		BackupRetention:    awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection: jsii.Bool(false), // Set to false for easier cleanup during testing
		InstanceIdentifier: jsii.String("cf-rds-mysql"),
		MonitoringInterval: awscdk.Duration_Seconds(jsii.Number(60)),
		EnablePerformanceInsights: jsii.Bool(false), // Disabled for t3.micro
	})

	// Apply tags to RDS instance
	for key, value := range commonTags {
		awscdk.Tags_Of(rdsInstance).Add(jsii.String(key), value, nil)
	}

	// 8. Create CloudWatch Alarm for RDS CPU utilization
	cpuAlarm := awscloudwatch.NewAlarm(stack, jsii.String("cf-rds-cpu-alarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("cf-rds-high-cpu"),
		AlarmDescription: jsii.String("RDS CPU utilization is too high"),
		Metric: rdsInstance.MetricCPUUtilization(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:         jsii.Number(75),
		EvaluationPeriods: jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:  awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Apply tags to CloudWatch alarm
	for key, value := range commonTags {
		awscdk.Tags_Of(cpuAlarm).Add(jsii.String(key), value, nil)
	}

	// 9. Create EC2 instance
	// Get the latest Amazon Linux 2 AMI
	amzLinux2 := awsec2.MachineImage_LatestAmazonLinux2(&awsec2.AmazonLinux2ImageSsmParameterProps{
		Generation: awsec2.AmazonLinuxGeneration_AMAZON_LINUX_2,
	})

	// User data script for EC2 instance
	userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
	userData.AddCommands(
		"yum update -y",
		"yum install -y httpd mysql",
		"systemctl start httpd",
		"systemctl enable httpd",
		"echo '<h1>CF Foundation Stack - Web Server</h1>' > /var/www/html/index.html",
		"echo '<p>Instance ID: ' $(curl -s http://169.254.169.254/latest/meta-data/instance-id) '</p>' >> /var/www/html/index.html",
		"echo '<p>Availability Zone: ' $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone) '</p>' >> /var/www/html/index.html",
		"echo '<p>VPC ID: " + *vpc.VpcId() + "</p>' >> /var/www/html/index.html",
	)

	ec2Instance := awsec2.NewInstance(stack, jsii.String("cf-web-server"), &awsec2.InstanceProps{
		InstanceType:   awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_MICRO),
		MachineImage:   amzLinux2,
		Vpc:            vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
		SecurityGroup:    ec2SecurityGroup,
		Role:             ec2Role,
		UserData:         userData,
		InstanceName:     jsii.String("cf-web-server"),
	})

	// Apply tags to EC2 instance
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2Instance).Add(jsii.String(key), value, nil)
	}

	// 10. Create S3 bucket policy to restrict access to VPC
	bucketPolicy := awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_DENY,
		Principals: &[]awsiam.IPrincipal{
			awsiam.NewAnyPrincipal(),
		},
		Actions: &[]*string{
			jsii.String("s3:*"),
		},
		Resources: &[]*string{
			bucket.BucketArn(),
			bucket.ArnForObjects(jsii.String("*")),
		},
		Conditions: map[string]interface{}{
			"StringNotEquals": map[string]interface{}{
				"aws:SourceVpc": *vpc.VpcId(),
			},
		},
	})

	bucket.AddToResourcePolicy(bucketPolicy)

	// 11. Stack Outputs
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String("cf-vpc-id"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("EC2InstanceId"), &awscdk.CfnOutputProps{
		Value:       ec2Instance.InstanceId(),
		Description: jsii.String("EC2 Instance ID"),
		ExportName:  jsii.String("cf-ec2-instance-id"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("EC2PublicIP"), &awscdk.CfnOutputProps{
		Value:       ec2Instance.InstancePublicIp(),
		Description: jsii.String("EC2 Instance Public IP"),
		ExportName:  jsii.String("cf-ec2-public-ip"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("RDSEndpoint"), &awscdk.CfnOutputProps{
		Value:       rdsInstance.InstanceEndpoint().Hostname(),
		Description: jsii.String("RDS Instance Endpoint"),
		ExportName:  jsii.String("cf-rds-endpoint"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("S3BucketName"), &awscdk.CfnOutputProps{
		Value:       bucket.BucketName(),
		Description: jsii.String("S3 Bucket Name"),
		ExportName:  jsii.String("cf-s3-bucket-name"),
	})

	awscdk.NewCfnOutput(stack, jsii.String("S3LoggingBucketName"), &awscdk.CfnOutputProps{
		Value:       loggingBucket.BucketName(),
		Description: jsii.String("S3 Logging Bucket Name"),
		ExportName:  jsii.String("cf-s3-logging-bucket-name"),
	})

	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Create the foundation stack with custom properties
	NewFoundationStack(app, "CFFoundationStack", &FoundationStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Region:  jsii.String("us-east-1"),
			},
			Description: jsii.String("CF Foundation Stack - Production-ready AWS infrastructure"),
		},
		AllowedSSHIP:    jsii.String("0.0.0.0/0"), // Replace with your IP for security
		EC2InstanceType: jsii.String("t3.micro"),
		DBInstanceClass: jsii.String("t3.micro"),
		DBUsername:      jsii.String("admin"),
		DBPassword:      jsii.String("SecurePassword123!"),
	})

	app.Synth(nil)
}
```

## Key Changes Made:

### 🔧 **S3 Bucket Naming Fix:**

1. **Removed hardcoded bucket names** - Set `BucketName: nil` to let CDK generate unique names automatically
2. **Proper dependency order** - Create logging bucket first, then reference it in the main bucket
3. **Added lifecycle rules** - Automatically delete old access logs after 90 days

### 🧹 **Cleanup Commands:**

Before deploying the fixed version, clean up any existing resources:

```bash
# Delete any existing failed stack
cdk destroy

# Or manually delete from AWS Console if needed
# Go to CloudFormation -> Stacks -> Select your stack -> Delete

# Also check S3 console and manually delete any buckets with names like:
# - cf-access-logs-***-us-east-1
# - cf-assets-bucket-***-us-east-1
```

### 🚀 **Deploy the Fixed Version:**

```bash
# Ensure clean state
cdk destroy

# Deploy with unique bucket names
cdk deploy

# Monitor the deployment
cdk deploy --progress events
```

### 📋 **What the Fix Does:**

1. **Automatic Unique Naming:** CDK will generate bucket names like:
   - `cfoundationstack-cfaccesslogsbucket12345678-abcdef123456`
   - `cfoundationstack-cfassetsbucket87654321-fedcba654321`

2. **Proper Dependencies:** The logging bucket is created first, then referenced by the main bucket

3. **Lifecycle Management:** Old access logs are automatically cleaned up after 90 days

4. **Better Error Handling:** If deployment fails, the unique names ensure no conflicts on retry

The deployment should now succeed without S3 bucket naming conflicts!
