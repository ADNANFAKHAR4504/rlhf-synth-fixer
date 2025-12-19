package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssecretsmanager"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
type TapStackProps struct {
	*awscdk.StackProps
	// Configurable parameters
	AllowedSSHIP      *string
	EC2InstanceType   *string
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

// NewTapStack creates a new instance of TapStack.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = *props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	var environmentSuffix string
	if props != nil && props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "dev"
	}

	// Default values for parameters
	if props.AllowedSSHIP == nil {
		props.AllowedSSHIP = jsii.String("0.0.0.0/0")
	}
	if props.EC2InstanceType == nil {
		props.EC2InstanceType = jsii.String("t3.micro")
	}
	// Create a new secret for the database password
	dbPasswordSecret := awssecretsmanager.NewSecret(stack, jsii.String("DBPasswordSecret"), &awssecretsmanager.SecretProps{
		GenerateSecretString: &awssecretsmanager.SecretStringGenerator{
			PasswordLength:     jsii.Number(16),
			ExcludePunctuation: jsii.Bool(true),
		},
	})

	commonTags := map[string]*string{
		"Environment": jsii.String("Production"),
		"Project":     jsii.String("CDKSetup"),
	}

	vpc := awsec2.NewVpc(stack, jsii.String("cf-vpc"), &awsec2.VpcProps{
		MaxAzs:             jsii.Number(2),
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{Name: jsii.String("cf-public-subnet"), SubnetType: awsec2.SubnetType_PUBLIC, CidrMask: jsii.Number(24)},
			{Name: jsii.String("cf-private-subnet"), SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED, CidrMask: jsii.Number(24)},
		},
		NatGateways: jsii.Number(0),
	})
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String("cf-vpc"), nil)
	for key, value := range commonTags {
		awscdk.Tags_Of(vpc).Add(jsii.String(key), value, nil)
	}

	loggingBucket := awss3.NewBucket(stack, jsii.String("cf-access-logs-bucket"), &awss3.BucketProps{
		BucketName:        nil, // Let CDK generate a unique name
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
	})

	bucket := awss3.NewBucket(stack, jsii.String("cf-assets-bucket"), &awss3.BucketProps{
		BucketName:             nil, // Let CDK generate a unique name
		Versioned:              jsii.Bool(true),
		BlockPublicAccess:      awss3.BlockPublicAccess_BLOCK_ALL(),
		ServerAccessLogsBucket: loggingBucket,
		ServerAccessLogsPrefix: jsii.String("access-logs/"),
		Encryption:             awss3.BucketEncryption_S3_MANAGED,
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(bucket).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(loggingBucket).Add(jsii.String(key), value, nil)
	}

	s3VpcEndpoint := awsec2.NewGatewayVpcEndpoint(stack, jsii.String("cf-s3-vpc-endpoint"), &awsec2.GatewayVpcEndpointProps{
		Vpc:     vpc,
		Service: awsec2.GatewayVpcEndpointAwsService_S3(),
		Subnets: &[]*awsec2.SubnetSelection{
			{SubnetType: awsec2.SubnetType_PUBLIC},
			{SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED},
		},
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(s3VpcEndpoint).Add(jsii.String(key), value, nil)
	}

	ec2SecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("cf-ec2-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("cf-ec2-sg"),
		Description:       jsii.String("Security group for EC2 web server"),
		AllowAllOutbound:  jsii.Bool(true),
	})
	ec2SecurityGroup.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(80)), jsii.String("Allow HTTP traffic from anywhere"), jsii.Bool(false))
	ec2SecurityGroup.AddIngressRule(awsec2.Peer_AnyIpv4(), awsec2.Port_Tcp(jsii.Number(443)), jsii.String("Allow HTTPS traffic from anywhere"), jsii.Bool(false))
	ec2SecurityGroup.AddIngressRule(awsec2.Peer_Ipv4(props.AllowedSSHIP), awsec2.Port_Tcp(jsii.Number(22)), jsii.String("Allow SSH from specified IP"), jsii.Bool(false))

	rdsSecurityGroup := awsec2.NewSecurityGroup(stack, jsii.String("cf-rds-sg"), &awsec2.SecurityGroupProps{
		Vpc:               vpc,
		SecurityGroupName: jsii.String("cf-rds-sg"),
		Description:       jsii.String("Security group for RDS MySQL instance"),
		AllowAllOutbound:  jsii.Bool(false),
	})
	rdsSecurityGroup.AddIngressRule(ec2SecurityGroup, awsec2.Port_Tcp(jsii.Number(3306)), jsii.String("Allow MySQL traffic from EC2 instances"), jsii.Bool(false))
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2SecurityGroup).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(rdsSecurityGroup).Add(jsii.String(key), value, nil)
	}

	ec2Role := awsiam.NewRole(stack, jsii.String("cf-ec2-role"), &awsiam.RoleProps{
		RoleName:  jsii.String("cf-ec2-role"),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSSMManagedInstanceCore")),
		},
	})
	s3Policy := awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect:  awsiam.Effect_ALLOW,
		Actions: &[]*string{jsii.String("s3:GetObject"), jsii.String("s3:ListBucket")},
		Resources: &[]*string{
			bucket.BucketArn(),
			bucket.ArnForObjects(jsii.String("*")),
		},
	})
	ec2Role.AddToPolicy(s3Policy)
	instanceProfile := awsiam.NewCfnInstanceProfile(stack, jsii.String("cf-ec2-instance-profile"), &awsiam.CfnInstanceProfileProps{
		InstanceProfileName: jsii.String("cf-ec2-instance-profile"),
		Roles:               &[]*string{ec2Role.RoleName()},
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2Role).Add(jsii.String(key), value, nil)
		awscdk.Tags_Of(instanceProfile).Add(jsii.String(key), value, nil)
	}

	dbSubnetGroup := awsrds.NewSubnetGroup(stack, jsii.String("cf-db-subnet-group"), &awsrds.SubnetGroupProps{
		Description:     jsii.String("Subnet group for RDS instance"),
		Vpc:             vpc,
		VpcSubnets:      &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED},
		SubnetGroupName: jsii.String("cf-db-subnet-group-" + environmentSuffix),
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(dbSubnetGroup).Add(jsii.String(key), value, nil)
	}

	rdsInstance := awsrds.NewDatabaseInstance(stack, jsii.String("cf-rds-mysql"), &awsrds.DatabaseInstanceProps{
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0(),
		}),
		InstanceType:   awsec2.InstanceType_Of(awsec2.InstanceClass_BURSTABLE3, awsec2.InstanceSize_SMALL),
		Vpc:            vpc,
		SecurityGroups: &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		SubnetGroup:    dbSubnetGroup,
		DatabaseName:   jsii.String("cfdb"),
		Credentials: awsrds.Credentials_FromUsername(jsii.String("admin"), &awsrds.CredentialsFromUsernameOptions{
			Password: dbPasswordSecret.SecretValue(),
		}),
		MultiAz:                   jsii.Bool(true),
		AllocatedStorage:          jsii.Number(20),
		StorageType:               awsrds.StorageType_GP2,
		BackupRetention:           awscdk.Duration_Days(jsii.Number(7)),
		DeletionProtection:        jsii.Bool(false),
		InstanceIdentifier:        jsii.String("cf-rds-mysql-" + environmentSuffix),
		MonitoringInterval:        awscdk.Duration_Seconds(jsii.Number(60)),
		EnablePerformanceInsights: jsii.Bool(false),
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(rdsInstance).Add(jsii.String(key), value, nil)
	}

	cpuAlarm := awscloudwatch.NewAlarm(stack, jsii.String("cf-rds-cpu-alarm"), &awscloudwatch.AlarmProps{
		AlarmName:        jsii.String("cf-rds-high-cpu-" + environmentSuffix),
		AlarmDescription: jsii.String("RDS CPU utilization is too high"),
		Metric: rdsInstance.MetricCPUUtilization(&awscloudwatch.MetricOptions{
			Period: awscdk.Duration_Minutes(jsii.Number(5)),
		}),
		Threshold:          jsii.Number(75),
		EvaluationPeriods:  jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
		TreatMissingData:   awscloudwatch.TreatMissingData_NOT_BREACHING,
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(cpuAlarm).Add(jsii.String(key), value, nil)
	}

	amzLinux2 := awsec2.MachineImage_LatestAmazonLinux2(nil)
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
		InstanceType:  awsec2.NewInstanceType(props.EC2InstanceType),
		MachineImage:  amzLinux2,
		Vpc:           vpc,
		VpcSubnets:    &awsec2.SubnetSelection{SubnetType: awsec2.SubnetType_PUBLIC},
		SecurityGroup: ec2SecurityGroup,
		Role:          ec2Role,
		UserData:      userData,
		InstanceName:  jsii.String("cf-web-server-dev"),
	})
	for key, value := range commonTags {
		awscdk.Tags_Of(ec2Instance).Add(jsii.String(key), value, nil)
	}

	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{Value: vpc.VpcId()})
	awscdk.NewCfnOutput(stack, jsii.String("EC2InstanceId"), &awscdk.CfnOutputProps{Value: ec2Instance.InstanceId()})
	awscdk.NewCfnOutput(stack, jsii.String("EC2PublicIP"), &awscdk.CfnOutputProps{Value: ec2Instance.InstancePublicIp()})
	awscdk.NewCfnOutput(stack, jsii.String("RDSEndpoint"), &awscdk.CfnOutputProps{Value: rdsInstance.InstanceEndpoint().Hostname()})
	awscdk.NewCfnOutput(stack, jsii.String("S3BucketName"), &awscdk.CfnOutputProps{Value: bucket.BucketName()})
	awscdk.NewCfnOutput(stack, jsii.String("S3LoggingBucketName"), &awscdk.CfnOutputProps{Value: loggingBucket.BucketName()})
	awscdk.NewCfnOutput(stack, jsii.String("SecurityGroupId"), &awscdk.CfnOutputProps{Value: ec2SecurityGroup.SecurityGroupId()})
	awscdk.NewCfnOutput(stack, jsii.String("VPCCidr"), &awscdk.CfnOutputProps{Value: vpc.VpcCidrBlock()})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
