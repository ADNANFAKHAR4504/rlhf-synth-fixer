package lib

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

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// Configurable parameters
	AllowedSSHIP      *string // IP address allowed for SSH access
	EC2InstanceType   *string // EC2 instance type
	EC2KeyName        *string // Name of the EC2 key pair
	DBInstanceClass   *string // RDS instance class
	DBUsername        *string // Database username
	DBPassword        *string // Database password
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
//
// This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
// It determines the environment suffix from the provided properties,
// CDK context, or defaults to 'dev'.
//
// Note:
//   - Do NOT create AWS resources directly in this stack.
//   - Instead, instantiate separate stacks for each resource type within this stack.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming and configuration.
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack.
//
// Args:
//
//	scope: The parent construct.
//	id: The unique identifier for this stack.
//	props: Optional properties for configuring the stack, including environment suffix.
//
// Returns:
//
//	A new TapStack instance.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix from props, context, or use 'dev' as default
	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	/// Default values for parameters
	if props.AllowedSSHIP == nil {
		props.AllowedSSHIP = jsii.String("0.0.0.0/0") // Should be restricted in production
	}
	if props.EC2InstanceType == nil {
		props.EC2InstanceType = jsii.String("t3.micro")
	}
	if props.DBInstanceClass == nil {
		props.DBInstanceClass = jsii.String("db.t3.micro")
	}
	if props.DBUsername == nil {
		props.DBUsername = jsii.String("admin")
	}
	if props.DBPassword == nil {
		props.DBPassword = jsii.String("TempPassword123!") // Use AWS Secrets Manager in production
	}
	if props.EC2KeyName == nil {
		props.EC2KeyName = jsii.String("my-key-pair") // Replace with your key pair name
	}

	// Common tags for all resources
	commonTags := map[string]*string{
		"Environment": jsii.String("Production"),
		"Project":     jsii.String("CDKSetup"),
	}

	// 1. Create VPC with public and private subnets
	vpc := awsec2.NewVpc(stack, jsii.String("cf-vpc"), &awsec2.VpcProps{
		Cidr:               jsii.String("10.0.0.0/16"),
		MaxAzs:             jsii.Number(2), // Use 2 AZs for high availability
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

	// 2. Create S3 bucket for application assets
	// Create logging bucket for S3 access logs
	loggingBucket := awss3.NewBucket(stack, jsii.String("cf-access-logs-bucket"), &awss3.BucketProps{
		BucketName:        jsii.String("cf-access-logs-" + *awscdk.Aws_ACCOUNT_ID() + "-" + *awscdk.Aws_REGION()),
		PublicReadAccess:  jsii.Bool(false),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
	})

	bucket := awss3.NewBucket(stack, jsii.String("cf-assets-bucket"), &awss3.BucketProps{
		BucketName:             jsii.String("cf-assets-bucket-" + *awscdk.Aws_ACCOUNT_ID() + "-" + *awscdk.Aws_REGION()),
		Versioned:              jsii.Bool(true),
		PublicReadAccess:       jsii.Bool(false),
		BlockPublicAccess:      awss3.BlockPublicAccess_BLOCK_ALL(),
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
		Encryption:             awss3.BucketEncryption_S3_MANAGED,
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

	// Create instance profile
	instanceProfile := awsiam.NewCfnInstanceProfile(stack, jsii.String("cf-ec2-instance-profile"), &awsiam.CfnInstanceProfileProps{
		InstanceProfileName: jsii.String("cf-ec2-instance-profile"),
		Roles: &[]*string{
			ec2Role.RoleName(),
		},
	})

	// Apply tags to IAM resources
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2Role).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(instanceProfile).Add(jsii.String(key), value, nil)
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
		InstanceType:              awsec2.NewInstanceType(props.DBInstanceClass),
		Vpc:                       vpc,
		SecurityGroups:            &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		SubnetGroup:               dbSubnetGroup,
		DatabaseName:              jsii.String("cfdb"),
		Credentials:               awsrds.Credentials_FromPassword(props.DBUsername, awscdk.SecretValue_UnsafePlainText(props.DBPassword)),
		MultiAz:                   jsii.Bool(true), // Enable Multi-AZ for high availability
		AllocatedStorage:          jsii.Number(20),
		StorageType:               awsrds.StorageType_GP2,
		BackupRetention:           awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection:        jsii.Bool(true),
		InstanceIdentifier:        jsii.String("cf-rds-mysql"),
		MonitoringInterval:        awscdk.Duration_Seconds(jsii.Number(60)),
		EnablePerformanceInsights: jsii.Bool(true),
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
		Threshold:          jsii.Number(75),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})

	// Apply tags to CloudWatch alarm
	for key, value := range commonTags {
		awscdk.Tags_Of(cpuAlarm).Add(jsii.String(key), value, nil)
	}

	// 9. Create EC2 instance
	// Get the latest Amazon Linux 2 AMI
	amzLinux2 := awsec2.MachineImage_LatestAmazonLinux2(nil)

	// User data script for EC2 instance
	userData := awsec2.UserData_ForLinux(&awsec2.LinuxUserDataOptions{})
	userData.AddCommands(
		jsii.String("yum update -y"),
		jsii.String("yum install -y httpd"),
		jsii.String("systemctl start httpd"),
		jsii.String("systemctl enable httpd"),
		jsii.String("echo '<h1>CF Foundation Stack - Web Server</h1>' > /var/www/html/index.html"),
		jsii.String("echo '<p>Instance ID: ' $(curl -s http://169.254.169.254/latest/meta-data/instance-id) '</p>' >> /var/www/html/index.html"),
	)

	ec2Instance := awsec2.NewInstance(stack, jsii.String("cf-web-server"), &awsec2.InstanceProps{
		InstanceType: awsec2.NewInstanceType(props.EC2InstanceType),
		MachineImage: amzLinux2,
		Vpc:          vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
		SecurityGroup: ec2SecurityGroup,
		Role:          ec2Role,
		UserData:      userData,
		KeyName:       props.EC2KeyName,
		InstanceName:  jsii.String("cf-web-server"),
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
		Conditions: &map[string]interface{}{
			"StringNotEquals": &map[string]interface{}{
				"aws:SourceVpc": vpc.VpcId(),
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

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
