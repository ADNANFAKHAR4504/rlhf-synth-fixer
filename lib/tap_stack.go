package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awskms"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awswafv2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the deployment environment
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
type TapStack struct {
	awscdk.Stack
	// EnvironmentSuffix stores the environment suffix used for resource naming
	EnvironmentSuffix *string
}

// NetworkingNestedStack contains VPC and networking resources
type NetworkingNestedStack struct {
	awscdk.NestedStack
	Vpc              awsec2.Vpc
	PrivateSubnets   *[]awsec2.ISubnet
	PublicSubnets    *[]awsec2.ISubnet
	DynamoDbEndpoint awsec2.InterfaceVpcEndpoint
}

// SecurityNestedStack contains security resources like KMS keys and IAM roles
type SecurityNestedStack struct {
	awscdk.NestedStack
	KmsKey        awskms.Key
	LoggingBucket awss3.Bucket
}

// DataNestedStack contains data resources like RDS and S3
type DataNestedStack struct {
	awscdk.NestedStack
	RdsInstance awsrds.DatabaseInstance
}

// ApplicationNestedStack contains application resources like ALB and WAF
type ApplicationNestedStack struct {
	awscdk.NestedStack
	Alb           awselasticloadbalancingv2.ApplicationLoadBalancer
	WebAcl        awswafv2.CfnWebACL
	SecurityGroup awsec2.SecurityGroup
}

// NewNetworkingNestedStack creates networking resources
func NewNetworkingNestedStack(scope constructs.Construct, id *string, environmentSuffix string, props *awscdk.NestedStackProps) *NetworkingNestedStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props)

	// Create VPC with public and private subnets
	vpcName := fmt.Sprintf("tap-vpc-%s", environmentSuffix)
	vpc := awsec2.NewVpc(nestedStack, jsii.String("SecureVpc"), &awsec2.VpcProps{
		VpcName:     jsii.String(vpcName),
		MaxAzs:      jsii.Number(2),
		NatGateways: jsii.Number(1), // Use 1 NAT gateway for cost optimization
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
				CidrMask:   jsii.Number(24),
			},
			{
				Name:       jsii.String("Isolated"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
				CidrMask:   jsii.Number(24),
			},
		},
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport:   jsii.Bool(true),
	})

	// Add tags to VPC
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String(vpcName), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(vpc).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)

	// Create VPC endpoint for DynamoDB for private access
	dynamoDbEndpoint := vpc.AddGatewayEndpoint(jsii.String("DynamoDbEndpoint"), &awsec2.GatewayVpcEndpointOptions{
		Service: awsec2.GatewayVpcEndpointAwsService_DYNAMODB(),
		Subnets: &[]*awsec2.SubnetSelection{
			{
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
		},
	})

	// Add tags to endpoint
	awscdk.Tags_Of(dynamoDbEndpoint).Add(jsii.String("Name"), jsii.String(fmt.Sprintf("tap-dynamodb-endpoint-%s", environmentSuffix)), nil)
	awscdk.Tags_Of(dynamoDbEndpoint).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(dynamoDbEndpoint).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)

	// Output VPC ID
	awscdk.NewCfnOutput(nestedStack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       vpc.VpcId(),
		Description: jsii.String("VPC ID"),
		ExportName:  jsii.String(fmt.Sprintf("TapVpcId-%s", environmentSuffix)),
	})

	return &NetworkingNestedStack{
		NestedStack:      nestedStack,
		Vpc:              vpc,
		PrivateSubnets:   vpc.PrivateSubnets(),
		PublicSubnets:    vpc.PublicSubnets(),
		DynamoDbEndpoint: nil, // Gateway endpoints don't return InterfaceVpcEndpoint
	}
}

// NewSecurityNestedStack creates security resources
func NewSecurityNestedStack(scope constructs.Construct, id *string, environmentSuffix string, props *awscdk.NestedStackProps) *SecurityNestedStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props)

	// Create customer-managed KMS key for RDS encryption
	kmsKeyAlias := fmt.Sprintf("alias/tap-rds-key-%s", environmentSuffix)
	kmsKey := awskms.NewKey(nestedStack, jsii.String("RdsKmsKey"), &awskms.KeyProps{
		Alias:             jsii.String(kmsKeyAlias),
		Description:       jsii.String(fmt.Sprintf("Customer-managed KMS key for RDS encryption (%s)", environmentSuffix)),
		EnableKeyRotation: jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_RETAIN, // Always retain KMS keys
		PendingWindow:     awscdk.Duration_Days(jsii.Number(30)),
	})

	// Add tags to KMS key
	awscdk.Tags_Of(kmsKey).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(kmsKey).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)
	awscdk.Tags_Of(kmsKey).Add(jsii.String("Purpose"), jsii.String("RDS-Encryption"), nil)

	return &SecurityNestedStack{
		NestedStack: nestedStack,
		KmsKey:      kmsKey,
	}
}

// NewDataNestedStack creates data resources
func NewDataNestedStack(scope constructs.Construct, id *string, environmentSuffix string,
	networkingStack *NetworkingNestedStack, securityStack *SecurityNestedStack, props *awscdk.NestedStackProps) *DataNestedStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props)

	// Create security group for RDS with restricted access
	rdsSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("RdsSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              networkingStack.Vpc,
		Description:      jsii.String(fmt.Sprintf("Security group for RDS database instance in %s environment", environmentSuffix)),
		AllowAllOutbound: jsii.Bool(false), // Restrict egress
	})

	// Add ingress rule for specific IP/CIDR (replace with your actual IP)
	// NOTE: In production, replace this with your actual application security group or specific IPs
	allowedCidr := "10.0.0.0/16" // VPC CIDR - only allow traffic from within VPC
	rdsSecurityGroup.AddIngressRule(
		awsec2.Peer_Ipv4(jsii.String(allowedCidr)),
		awsec2.Port_Tcp(jsii.Number(3306)),
		jsii.String("Allow MySQL access from VPC"),
		jsii.Bool(false),
	)

	// Add restricted egress rule - only allow HTTPS for patches/updates
	rdsSecurityGroup.AddEgressRule(
		awsec2.Peer_Ipv4(jsii.String("0.0.0.0/0")),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS for RDS patches and updates"),
		jsii.Bool(false),
	)

	// Add tags to security group
	awscdk.Tags_Of(rdsSecurityGroup).Add(jsii.String("Name"), jsii.String(fmt.Sprintf("tap-rds-sg-%s", environmentSuffix)), nil)
	awscdk.Tags_Of(rdsSecurityGroup).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(rdsSecurityGroup).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)

	// Create subnet group for RDS
	subnetGroup := awsrds.NewSubnetGroup(nestedStack, jsii.String("RdsSubnetGroup"), &awsrds.SubnetGroupProps{
		Description: jsii.String(fmt.Sprintf("Subnet group for RDS instance in %s environment", environmentSuffix)),
		Vpc:         networkingStack.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED, // Use isolated subnets for RDS
		},
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create RDS instance with customer-managed KMS encryption
	instanceIdentifier := fmt.Sprintf("tap-rds-%s", environmentSuffix)
	rdsInstance := awsrds.NewDatabaseInstance(nestedStack, jsii.String("RdsInstance"), &awsrds.DatabaseInstanceProps{
		InstanceIdentifier: jsii.String(instanceIdentifier),
		Engine: awsrds.DatabaseInstanceEngine_Mysql(&awsrds.MySqlInstanceEngineProps{
			Version: awsrds.MysqlEngineVersion_VER_8_0(),
		}),
		InstanceType:        awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_SMALL),
		Vpc:                 networkingStack.Vpc,
		SecurityGroups:      &[]awsec2.ISecurityGroup{rdsSecurityGroup},
		SubnetGroup:         subnetGroup,
		AllocatedStorage:    jsii.Number(20),
		MaxAllocatedStorage: jsii.Number(100),
		// Use customer-managed KMS key for encryption
		StorageEncrypted:     jsii.Bool(true),
		StorageEncryptionKey: securityStack.KmsKey,
		// Database credentials
		Credentials: awsrds.Credentials_FromGeneratedSecret(jsii.String("admin"), &awsrds.CredentialsBaseOptions{
			SecretName: jsii.String(fmt.Sprintf("tap-rds-credentials-%s", environmentSuffix)),
		}),
		// Backup configuration
		BackupRetention:            awscdk.Duration_Days(jsii.Number(7)),
		PreferredBackupWindow:      jsii.String("03:00-04:00"),
		PreferredMaintenanceWindow: jsii.String("sun:04:00-sun:05:00"),
		// Additional security settings
		DeletionProtection:      jsii.Bool(false), // Set to true in production
		MultiAz:                 jsii.Bool(false), // Enable Multi-AZ for high availability in production
		AutoMinorVersionUpgrade: jsii.Bool(true),
		RemovalPolicy:           awscdk.RemovalPolicy_SNAPSHOT, // Snapshot on deletion
	})

	// Add tags to RDS instance
	awscdk.Tags_Of(rdsInstance).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(rdsInstance).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)
	awscdk.Tags_Of(rdsInstance).Add(jsii.String("Purpose"), jsii.String("ApplicationDatabase"), nil)

	// Output RDS endpoint
	awscdk.NewCfnOutput(nestedStack, jsii.String("RdsEndpoint"), &awscdk.CfnOutputProps{
		Value:       rdsInstance.DbInstanceEndpointAddress(),
		Description: jsii.String("RDS instance endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("TapRdsEndpoint-%s", environmentSuffix)),
	})

	return &DataNestedStack{
		NestedStack: nestedStack,
		RdsInstance: rdsInstance,
	}
}

// NewApplicationNestedStack creates application resources including ALB and WAF
func NewApplicationNestedStack(scope constructs.Construct, id *string, environmentSuffix string,
	networkingStack *NetworkingNestedStack, props *awscdk.NestedStackProps) *ApplicationNestedStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props)

	// Create security group for ALB with restricted access
	albSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("AlbSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:              networkingStack.Vpc,
		Description:      jsii.String(fmt.Sprintf("Security group for Application Load Balancer in %s environment", environmentSuffix)),
		AllowAllOutbound: jsii.Bool(false), // Restrict egress
	})

	// Add ingress rules for specific IPs (replace with your actual IPs)
	// In production, use your office IPs or VPN CIDR ranges
	allowedIps := []string{
		"203.0.113.0/24", // Example IP range - replace with your actual IP range
	}

	for _, ip := range allowedIps {
		albSecurityGroup.AddIngressRule(
			awsec2.Peer_Ipv4(jsii.String(ip)),
			awsec2.Port_Tcp(jsii.Number(443)),
			jsii.String(fmt.Sprintf("Allow HTTPS from %s", ip)),
			jsii.Bool(false),
		)
		albSecurityGroup.AddIngressRule(
			awsec2.Peer_Ipv4(jsii.String(ip)),
			awsec2.Port_Tcp(jsii.Number(80)),
			jsii.String(fmt.Sprintf("Allow HTTP from %s", ip)),
			jsii.Bool(false),
		)
	}

	// Add restricted egress rules
	albSecurityGroup.AddEgressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")), // VPC CIDR
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS to VPC"),
		jsii.Bool(false),
	)
	albSecurityGroup.AddEgressRule(
		awsec2.Peer_Ipv4(jsii.String("10.0.0.0/16")), // VPC CIDR
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP to VPC"),
		jsii.Bool(false),
	)

	// Add tags to security group
	awscdk.Tags_Of(albSecurityGroup).Add(jsii.String("Name"), jsii.String(fmt.Sprintf("tap-alb-sg-%s", environmentSuffix)), nil)
	awscdk.Tags_Of(albSecurityGroup).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(albSecurityGroup).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)

	// Create Application Load Balancer
	albName := fmt.Sprintf("tap-alb-%s", environmentSuffix)
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(nestedStack, jsii.String("ApplicationLoadBalancer"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		LoadBalancerName: jsii.String(albName),
		Vpc:              networkingStack.Vpc,
		SecurityGroup:    albSecurityGroup,
		InternetFacing:   jsii.Bool(true),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
		DeletionProtection: jsii.Bool(false), // Set to true in production
	})

	// Add tags to ALB
	awscdk.Tags_Of(alb).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(alb).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)

	// Create WAF Web ACL
	webAclName := fmt.Sprintf("tap-waf-acl-%s", environmentSuffix)
	webAcl := awswafv2.NewCfnWebACL(nestedStack, jsii.String("WebAcl"), &awswafv2.CfnWebACLProps{
		Name:  jsii.String(webAclName),
		Scope: jsii.String("REGIONAL"), // Use REGIONAL for ALB
		DefaultAction: &awswafv2.CfnWebACL_DefaultActionProperty{
			Allow: &map[string]interface{}{}, // Allow by default, rules will block malicious traffic
		},
		Rules: &[]interface{}{
			&awswafv2.CfnWebACL_RuleProperty{
				Name:     jsii.String("AWSManagedRulesCommonRuleSet"),
				Priority: jsii.Number(1),
				Statement: &awswafv2.CfnWebACL_StatementProperty{
					ManagedRuleGroupStatement: &awswafv2.CfnWebACL_ManagedRuleGroupStatementProperty{
						VendorName: jsii.String("AWS"),
						Name:       jsii.String("AWSManagedRulesCommonRuleSet"),
					},
				},
				VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
					SampledRequestsEnabled:   jsii.Bool(true),
					CloudWatchMetricsEnabled: jsii.Bool(true),
					MetricName:               jsii.String("CommonRuleSetMetric"),
				},
				OverrideAction: &awswafv2.CfnWebACL_OverrideActionProperty{
					None: &map[string]interface{}{},
				},
			},
			// Add SQL injection protection
			&awswafv2.CfnWebACL_RuleProperty{
				Name:     jsii.String("AWSManagedRulesSQLiRuleSet"),
				Priority: jsii.Number(2),
				Statement: &awswafv2.CfnWebACL_StatementProperty{
					ManagedRuleGroupStatement: &awswafv2.CfnWebACL_ManagedRuleGroupStatementProperty{
						VendorName: jsii.String("AWS"),
						Name:       jsii.String("AWSManagedRulesSQLiRuleSet"),
					},
				},
				VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
					SampledRequestsEnabled:   jsii.Bool(true),
					CloudWatchMetricsEnabled: jsii.Bool(true),
					MetricName:               jsii.String("SQLiRuleSetMetric"),
				},
				OverrideAction: &awswafv2.CfnWebACL_OverrideActionProperty{
					None: &map[string]interface{}{},
				},
			},
		},
		VisibilityConfig: &awswafv2.CfnWebACL_VisibilityConfigProperty{
			SampledRequestsEnabled:   jsii.Bool(true),
			CloudWatchMetricsEnabled: jsii.Bool(true),
			MetricName:               jsii.String(fmt.Sprintf("tap-waf-metric-%s", environmentSuffix)),
		},
		Tags: &[]*awscdk.CfnTag{
			{
				Key:   jsii.String("Environment"),
				Value: jsii.String(environmentSuffix),
			},
			{
				Key:   jsii.String("Owner"),
				Value: jsii.String("TapProject"),
			},
		},
	})

	// Associate WAF with ALB
	awswafv2.NewCfnWebACLAssociation(nestedStack, jsii.String("WebAclAssociation"), &awswafv2.CfnWebACLAssociationProps{
		ResourceArn: alb.LoadBalancerArn(),
		WebAclArn:   webAcl.AttrArn(),
	})

	// Output ALB DNS
	awscdk.NewCfnOutput(nestedStack, jsii.String("AlbDnsName"), &awscdk.CfnOutputProps{
		Value:       alb.LoadBalancerDnsName(),
		Description: jsii.String("Application Load Balancer DNS name"),
		ExportName:  jsii.String(fmt.Sprintf("TapAlbDns-%s", environmentSuffix)),
	})

	return &ApplicationNestedStack{
		NestedStack:   nestedStack,
		Alb:           alb,
		WebAcl:        webAcl,
		SecurityGroup: albSecurityGroup,
	}
}

// NewTapStack creates a new instance of TapStack.
func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {

	stack := awscdk.NewStack(scope, id, props.StackProps)

	// Get environment suffix from props, context, or use 'dev' as default
	var environmentSuffix string
	if props.EnvironmentSuffix != nil {
		environmentSuffix = *props.EnvironmentSuffix
	} else if suffix := stack.Node().TryGetContext(jsii.String("environmentSuffix")); suffix != nil {
		environmentSuffix = *suffix.(*string)
	} else {
		environmentSuffix = "production" // Default to production for security stack
	}

	// Apply global tags to all resources in the stack
	awscdk.Tags_Of(stack).Add(jsii.String("Environment"), jsii.String(environmentSuffix), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Owner"), jsii.String("TapProject"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("ManagedBy"), jsii.String("CDK"), nil)
	awscdk.Tags_Of(stack).Add(jsii.String("Stack"), jsii.String("SecureInfrastructure"), nil)

	// ==========================================
	// Create Nested Stacks
	// ==========================================

	// 1. Create Networking Stack (VPC, Subnets, Endpoints)
	networkingStackId := fmt.Sprintf("NetworkingStack-%s", environmentSuffix)
	networkingStack := NewNetworkingNestedStack(
		stack,
		jsii.String(networkingStackId),
		environmentSuffix,
		&awscdk.NestedStackProps{
			Description: jsii.String(fmt.Sprintf("Networking resources for secure infrastructure (%s)", environmentSuffix)),
		},
	)

	// 2. Create Security Stack (KMS, S3)
	securityStackId := fmt.Sprintf("SecurityStack-%s", environmentSuffix)
	securityStack := NewSecurityNestedStack(
		stack,
		jsii.String(securityStackId),
		environmentSuffix,
		&awscdk.NestedStackProps{
			Description: jsii.String(fmt.Sprintf("Security resources including KMS (%s)", environmentSuffix)),
		},
	)

	// 3. Create Data Stack (RDS with encryption)
	dataStackId := fmt.Sprintf("DataStack-%s", environmentSuffix)
	dataStack := NewDataNestedStack(
		stack,
		jsii.String(dataStackId),
		environmentSuffix,
		networkingStack,
		securityStack,
		&awscdk.NestedStackProps{
			Description: jsii.String(fmt.Sprintf("Data resources including encrypted RDS (%s)", environmentSuffix)),
		},
	)

	// 4. Create Application Stack (ALB with WAF)
	applicationStackId := fmt.Sprintf("ApplicationStack-%s", environmentSuffix)
	applicationStack := NewApplicationNestedStack(
		stack,
		jsii.String(applicationStackId),
		environmentSuffix,
		networkingStack,
		&awscdk.NestedStackProps{
			Description: jsii.String(fmt.Sprintf("Application resources including ALB and WAF (%s)", environmentSuffix)),
		},
	)

	// ==========================================
	// Stack Outputs
	// ==========================================

	// VPC Outputs
	awscdk.NewCfnOutput(stack, jsii.String("VpcId"), &awscdk.CfnOutputProps{
		Value:       networkingStack.Vpc.VpcId(),
		Description: jsii.String("VPC ID for secure infrastructure"),
		ExportName:  jsii.String(fmt.Sprintf("TapSecureVpcId-%s", environmentSuffix)),
	})

	// Security Outputs
	awscdk.NewCfnOutput(stack, jsii.String("KmsKeyId"), &awscdk.CfnOutputProps{
		Value:       securityStack.KmsKey.KeyId(),
		Description: jsii.String("Customer-managed KMS key ID"),
		ExportName:  jsii.String(fmt.Sprintf("TapKmsKeyId-%s", environmentSuffix)),
	})

	// RDS Outputs
	awscdk.NewCfnOutput(stack, jsii.String("RdsEndpoint"), &awscdk.CfnOutputProps{
		Value:       dataStack.RdsInstance.DbInstanceEndpointAddress(),
		Description: jsii.String("Encrypted RDS instance endpoint"),
		ExportName:  jsii.String(fmt.Sprintf("TapSecureRdsEndpoint-%s", environmentSuffix)),
	})

	// ALB Outputs
	awscdk.NewCfnOutput(stack, jsii.String("AlbDnsName"), &awscdk.CfnOutputProps{
		Value:       applicationStack.Alb.LoadBalancerDnsName(),
		Description: jsii.String("Application Load Balancer DNS protected by WAF"),
		ExportName:  jsii.String(fmt.Sprintf("TapSecureAlbDns-%s", environmentSuffix)),
	})

	// Add informational output about security features
	awscdk.NewCfnOutput(stack, jsii.String("SecurityFeatures"), &awscdk.CfnOutputProps{
		Value:       jsii.String("Enabled: KMS encryption, WAF protection, VPC endpoints, Restricted security groups"),
		Description: jsii.String("Security features enabled in this stack"),
	})

	// Reference to unused variables to avoid compiler warnings
	_ = dataStack
	_ = applicationStack

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
