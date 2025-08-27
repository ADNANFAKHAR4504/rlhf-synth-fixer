I'll help you create a comprehensive cloud environment setup using AWS CDK Go for a multi-tier web application with modern AI capabilities. Here's the complete infrastructure code:

## lib/tap_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// TapStackProps defines the properties for the TapStack CDK stack.
//
// This struct extends the base awscdk.StackProps with additional
// environment-specific configuration options.
type TapStackProps struct {
	*awscdk.StackProps
	// EnvironmentSuffix is an optional suffix to identify the
	// deployment environment (e.g., 'dev', 'prod').
	EnvironmentSuffix *string
}

// TapStack represents the main CDK stack for the Tap project.
//
// This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
// It determines the environment suffix from the provided properties,
// CDK context, or defaults to 'dev'.
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

	// Create networking stack
	networkingStack := NewNetworkingStack(stack, jsii.String("Networking"+environmentSuffix), &NetworkingStackProps{
		NestedStackProps: &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
	})

	// Create security stack
	securityStack := NewSecurityStack(stack, jsii.String("Security"+environmentSuffix), &SecurityStackProps{
		NestedStackProps: &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc: networkingStack.Vpc,
	})

	// Create storage stack
	storageStack := NewStorageStack(stack, jsii.String("Storage"+environmentSuffix), &StorageStackProps{
		NestedStackProps: &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc: networkingStack.Vpc,
		DatabaseSecurityGroup: securityStack.DatabaseSecurityGroup,
	})

	// Create compute stack
	computeStack := NewComputeStack(stack, jsii.String("Compute"+environmentSuffix), &ComputeStackProps{
		NestedStackProps: &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		Vpc: networkingStack.Vpc,
		EksSecurityGroup: securityStack.EksSecurityGroup,
	})

	// Create AI/ML stack
	aiStack := NewAIStack(stack, jsii.String("AI"+environmentSuffix), &AIStackProps{
		NestedStackProps: &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		EksCluster: computeStack.EksCluster,
	})

	// Create monitoring stack
	NewMonitoringStack(stack, jsii.String("Monitoring"+environmentSuffix), &MonitoringStackProps{
		NestedStackProps: &awscdk.NestedStackProps{},
		EnvironmentSuffix: jsii.String(environmentSuffix),
		EksCluster: computeStack.EksCluster,
		Database: storageStack.Database,
		LoadBalancer: computeStack.LoadBalancer,
	})

	return &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(environmentSuffix),
	}
}
```

## lib/networking_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type NetworkingStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
}

type NetworkingStack struct {
	awscdk.NestedStack
	Vpc awsec2.IVpc
}

func NewNetworkingStack(scope constructs.Construct, id *string, props *NetworkingStackProps) *NetworkingStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// Create VPC with public and private subnets
	vpc := awsec2.NewVpc(nestedStack, jsii.String("VPC"), &awsec2.VpcProps{
		MaxAzs: jsii.Number(3),
		IpAddresses: awsec2.IpAddresses_Cidr(jsii.String("10.0.0.0/16")),
		SubnetConfiguration: &[]*awsec2.SubnetConfiguration{
			{
				CidrMask:   jsii.Number(24),
				Name:       jsii.String("Public"),
				SubnetType: awsec2.SubnetType_PUBLIC,
			},
			{
				CidrMask:   jsii.Number(24),
				Name:       jsii.String("Private"),
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
			{
				CidrMask:   jsii.Number(28),
				Name:       jsii.String("Database"),
				SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
			},
		},
		NatGateways: jsii.Number(2), // For high availability
		EnableDnsHostnames: jsii.Bool(true),
		EnableDnsSupport: jsii.Bool(true),
	})

	// Add tags to VPC
	awscdk.Tags_Of(vpc).Add(jsii.String("Name"), jsii.String("tap-vpc-" + *props.EnvironmentSuffix), nil)

	return &NetworkingStack{
		NestedStack: nestedStack,
		Vpc:         vpc,
	}
}
```

## lib/security_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsguardduty"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type SecurityStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
	Vpc               awsec2.IVpc
}

type SecurityStack struct {
	awscdk.NestedStack
	EksSecurityGroup      awsec2.ISecurityGroup
	DatabaseSecurityGroup awsec2.ISecurityGroup
	LoadBalancerSecurityGroup awsec2.ISecurityGroup
}

func NewSecurityStack(scope constructs.Construct, id *string, props *SecurityStackProps) *SecurityStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// EKS Security Group
	eksSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("EKSSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc: props.Vpc,
		Description: jsii.String("Security group for EKS cluster"),
		AllowAllOutbound: jsii.Bool(true),
	})

	// Database Security Group
	dbSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("DatabaseSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc: props.Vpc,
		Description: jsii.String("Security group for RDS Aurora database"),
		AllowAllOutbound: jsii.Bool(false),
	})

	// Allow EKS to access database
	dbSecurityGroup.AddIngressRule(
		eksSecurityGroup,
		awsec2.Port_Tcp(jsii.Number(3306)),
		jsii.String("Allow EKS to access MySQL"),
	)

	// Load Balancer Security Group
	lbSecurityGroup := awsec2.NewSecurityGroup(nestedStack, jsii.String("LoadBalancerSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc: props.Vpc,
		Description: jsii.String("Security group for Application Load Balancer"),
		AllowAllOutbound: jsii.Bool(true),
	})

	// Allow HTTP and HTTPS traffic
	lbSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(80)),
		jsii.String("Allow HTTP"),
	)
	lbSecurityGroup.AddIngressRule(
		awsec2.Peer_AnyIpv4(),
		awsec2.Port_Tcp(jsii.Number(443)),
		jsii.String("Allow HTTPS"),
	)

	// Allow load balancer to communicate with EKS
	eksSecurityGroup.AddIngressRule(
		lbSecurityGroup,
		awsec2.Port_AllTraffic(),
		jsii.String("Allow ALB to EKS"),
	)

	// Enable GuardDuty with EKS protection
	awsguardduty.NewCfnDetector(nestedStack, jsii.String("GuardDutyDetector"), &awsguardduty.CfnDetectorProps{
		Enable: jsii.Bool(true),
		Features: &[]*awsguardduty.CfnDetector_CFNFeatureConfigurationProperty{
			{
				Name: jsii.String("EKS_AUDIT_LOGS"),
				Status: jsii.String("ENABLED"),
			},
			{
				Name: jsii.String("EKS_RUNTIME_MONITORING"),
				Status: jsii.String("ENABLED"),
			},
		},
	})

	return &SecurityStack{
		NestedStack:               nestedStack,
		EksSecurityGroup:          eksSecurityGroup,
		DatabaseSecurityGroup:     dbSecurityGroup,
		LoadBalancerSecurityGroup: lbSecurityGroup,
	}
}
```

## lib/storage_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticache"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type StorageStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix     *string
	Vpc                   awsec2.IVpc
	DatabaseSecurityGroup awsec2.ISecurityGroup
}

type StorageStack struct {
	awscdk.NestedStack
	Database   awsrds.IDatabaseCluster
	S3Bucket   awss3.IBucket
	RedisCluster awselasticache.CfnCacheCluster
}

func NewStorageStack(scope constructs.Construct, id *string, props *StorageStackProps) *StorageStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// S3 Bucket for static assets
	bucket := awss3.NewBucket(nestedStack, jsii.String("AssetsBucket"), &awss3.BucketProps{
		BucketName: jsii.String("tap-assets-" + *props.EnvironmentSuffix),
		Versioned:  jsii.Bool(true),
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		Encryption: awss3.BucketEncryption_S3_MANAGED,
		IntelligentTieringConfigurations: &[]*awss3.IntelligentTieringConfiguration{
			{
				Name: jsii.String("EntireBucket"),
				OptionalFields: &[]awss3.IntelligentTieringOptionalField{
					awss3.IntelligentTieringOptionalField_BUCKET_KEY_STATUS,
				},
			},
		},
	})

	// Aurora Serverless v2 Database
	cluster := awsrds.NewDatabaseCluster(nestedStack, jsii.String("AuroraCluster"), &awsrds.DatabaseClusterProps{
		Engine: awsrds.DatabaseClusterEngine_AuroraMysql(&awsrds.AuroraMysqlClusterEngineProps{
			Version: awsrds.AuroraMysqlEngineVersion_VER_8_0_MYSQL_3_02_0(),
		}),
		Writer: awsrds.ClusterInstance_ServerlessV2(jsii.String("writer"), &awsrds.ServerlessV2ClusterInstanceProps{
			ScaleWithWriter: jsii.Bool(true),
		}),
		Readers: &[]awsrds.IClusterInstance{
			awsrds.ClusterInstance_ServerlessV2(jsii.String("reader"), &awsrds.ServerlessV2ClusterInstanceProps{
				ScaleWithWriter: jsii.Bool(false),
			}),
		},
		ServerlessV2MinCapacity: jsii.Number(0.5),
		ServerlessV2MaxCapacity: jsii.Number(16),
		Vpc: props.Vpc,
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_ISOLATED,
		},
		SecurityGroups: &[]awsec2.ISecurityGroup{props.DatabaseSecurityGroup},
		DatabaseName: jsii.String("tapdb"),
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
		DeletionProtection: jsii.Bool(false),
	})

	// ElastiCache Redis Subnet Group
	subnetGroup := awselasticache.NewCfnSubnetGroup(nestedStack, jsii.String("RedisSubnetGroup"), &awselasticache.CfnSubnetGroupProps{
		Description: jsii.String("Subnet group for Redis cluster"),
		SubnetIds: props.Vpc.SelectSubnets(&awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		}).SubnetIds,
	})

	// ElastiCache Redis Cluster
	redisCluster := awselasticache.NewCfnCacheCluster(nestedStack, jsii.String("RedisCluster"), &awselasticache.CfnCacheClusterProps{
		CacheNodeType: jsii.String("cache.t3.micro"),
		Engine: jsii.String("redis"),
		NumCacheNodes: jsii.Number(1),
		CacheSubnetGroupName: subnetGroup.Ref(),
		VpcSecurityGroupIds: &[]*string{props.DatabaseSecurityGroup.SecurityGroupId()},
	})

	return &StorageStack{
		NestedStack:  nestedStack,
		Database:     cluster,
		S3Bucket:     bucket,
		RedisCluster: redisCluster,
	}
}
```

## lib/compute_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awseks"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type ComputeStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
	Vpc               awsec2.IVpc
	EksSecurityGroup  awsec2.ISecurityGroup
}

type ComputeStack struct {
	awscdk.NestedStack
	EksCluster   awseks.ICluster
	LoadBalancer awselasticloadbalancingv2.IApplicationLoadBalancer
}

func NewComputeStack(scope constructs.Construct, id *string, props *ComputeStackProps) *ComputeStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// EKS Cluster Service Role
	eksRole := awsiam.NewRole(nestedStack, jsii.String("EKSRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("eks.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonEKSClusterPolicy")),
		},
	})

	// EKS Node Group Role
	nodeRole := awsiam.NewRole(nestedStack, jsii.String("EKSNodeRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ec2.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonEKSWorkerNodePolicy")),
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonEKS_CNI_Policy")),
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonEC2ContainerRegistryReadOnly")),
		},
	})

	// EKS Cluster
	cluster := awseks.NewCluster(nestedStack, jsii.String("EKSCluster"), &awseks.ClusterProps{
		Version: awseks.KubernetesVersion_V1_28(),
		Vpc: props.Vpc,
		VpcSubnets: &[]*awsec2.SubnetSelection{
			{
				SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
			},
		},
		Role: eksRole,
		SecurityGroup: props.EksSecurityGroup,
		EndpointAccess: awseks.EndpointAccess_PUBLIC_AND_PRIVATE(),
		DefaultCapacity: jsii.Number(0), // We'll add managed node groups instead
		DefaultCapacityInstance: awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MEDIUM),
	})

	// Managed Node Group
	cluster.AddNodegroupCapacity(jsii.String("ManagedNodeGroup"), &awseks.NodegroupOptions{
		InstanceTypes: &[]awsec2.InstanceType{
			awsec2.InstanceType_Of(awsec2.InstanceClass_T3, awsec2.InstanceSize_MEDIUM),
		},
		MinSize: jsii.Number(1),
		MaxSize: jsii.Number(10),
		DesiredSize: jsii.Number(3),
		Subnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
		},
		NodeRole: nodeRole,
		AmiType: awseks.NodegroupAmiType_AL2_X86_64,
		CapacityType: awseks.CapacityType_ON_DEMAND,
	})

	// Application Load Balancer
	alb := awselasticloadbalancingv2.NewApplicationLoadBalancer(nestedStack, jsii.String("ALB"), &awselasticloadbalancingv2.ApplicationLoadBalancerProps{
		Vpc: props.Vpc,
		InternetFacing: jsii.Bool(true),
		LoadBalancerName: jsii.String("tap-alb-" + *props.EnvironmentSuffix),
		VpcSubnets: &awsec2.SubnetSelection{
			SubnetType: awsec2.SubnetType_PUBLIC,
		},
	})

	// Default target group for ALB
	targetGroup := awselasticloadbalancingv2.NewApplicationTargetGroup(nestedStack, jsii.String("DefaultTargetGroup"), &awselasticloadbalancingv2.ApplicationTargetGroupProps{
		Port: jsii.Number(80),
		Vpc: props.Vpc,
		Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		TargetType: awselasticloadbalancingv2.TargetType_IP,
		HealthCheck: &awselasticloadbalancingv2.HealthCheck{
			Path: jsii.String("/health"),
			HealthyHttpCodes: jsii.String("200"),
		},
	})

	// ALB Listener
	alb.AddListener(jsii.String("HTTPListener"), &awselasticloadbalancingv2.BaseApplicationListenerProps{
		Port: jsii.Number(80),
		Protocol: awselasticloadbalancingv2.ApplicationProtocol_HTTP,
		DefaultTargetGroups: &[]awselasticloadbalancingv2.IApplicationTargetGroup{targetGroup},
	})

	return &ComputeStack{
		NestedStack:  nestedStack,
		EksCluster:   cluster,
		LoadBalancer: alb,
	}
}
```

## lib/ai_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsbedrock"
	"github.com/aws/aws-cdk-go/awscdk/v2/awseks"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssagemaker"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type AIStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
	EksCluster        awseks.ICluster
}

type AIStack struct {
	awscdk.NestedStack
}

func NewAIStack(scope constructs.Construct, id *string, props *AIStackProps) *AIStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// IAM role for Bedrock access
	bedrockRole := awsiam.NewRole(nestedStack, jsii.String("BedrockAccessRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("bedrock.amazonaws.com"), nil),
		InlinePolicies: &map[string]awsiam.PolicyDocument{
			"BedrockInvokePolicy": awsiam.NewPolicyDocument(&awsiam.PolicyDocumentProps{
				Statements: &[]awsiam.PolicyStatement{
					awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
						Effect: awsiam.Effect_ALLOW,
						Actions: &[]*string{
							jsii.String("bedrock:InvokeModel"),
							jsii.String("bedrock:InvokeModelWithResponseStream"),
						},
						Resources: &[]*string{
							jsii.String("arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-micro-v1:0"),
							jsii.String("arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-lite-v1:0"),
							jsii.String("arn:aws:bedrock:us-east-1::foundation-model/amazon.nova-pro-v1:0"),
						},
					}),
				},
			}),
		},
	})

	// Bedrock Agent for AI capabilities
	awsbedrock.NewCfnAgent(nestedStack, jsii.String("BedrockAgent"), &awsbedrock.CfnAgentProps{
		AgentName: jsii.String("tap-ai-agent-" + *props.EnvironmentSuffix),
		AgentResourceRoleArn: bedrockRole.RoleArn(),
		FoundationModel: jsii.String("amazon.nova-pro-v1:0"),
		Instruction: jsii.String("You are an AI assistant for a multi-tier web application. Help users with application-related queries and provide intelligent responses."),
		Description: jsii.String("AI agent for web application assistance"),
		IdleSessionTtlInSeconds: jsii.Number(1800),
	})

	// SageMaker execution role
	sagemakerRole := awsiam.NewRole(nestedStack, jsii.String("SageMakerExecutionRole"), &awsiam.RoleProps{
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("sagemaker.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSageMakerFullAccess")),
		},
	})

	// SageMaker Model (placeholder - would need actual model artifacts)
	model := awssagemaker.NewCfnModel(nestedStack, jsii.String("SageMakerModel"), &awssagemaker.CfnModelProps{
		ModelName: jsii.String("tap-ml-model-" + *props.EnvironmentSuffix),
		ExecutionRoleArn: sagemakerRole.RoleArn(),
		PrimaryContainer: &awssagemaker.CfnModel_ContainerDefinitionProperty{
			Image: jsii.String("763104351884.dkr.ecr.us-east-1.amazonaws.com/pytorch-inference:1.12.0-gpu-py38-cu113-ubuntu20.04-sagemaker"),
			ModelDataUrl: jsii.String("s3://sagemaker-sample-files/datasets/tabular/synthetic/model.tar.gz"),
		},
	})

	// SageMaker Endpoint Configuration
	endpointConfig := awssagemaker.NewCfnEndpointConfig(nestedStack, jsii.String("SageMakerEndpointConfig"), &awssagemaker.CfnEndpointConfigProps{
		EndpointConfigName: jsii.String("tap-ml-endpoint-config-" + *props.EnvironmentSuffix),
		ProductionVariants: []awssagemaker.CfnEndpointConfig_ProductionVariantProperty{
			{
				ModelName: model.AttrModelName(),
				VariantName: jsii.String("primary"),
				InitialInstanceCount: jsii.Number(1),
				InstanceType: jsii.String("ml.t2.medium"),
				InitialVariantWeight: jsii.Number(1.0),
			},
		},
	})

	// SageMaker Endpoint
	awssagemaker.NewCfnEndpoint(nestedStack, jsii.String("SageMakerEndpoint"), &awssagemaker.CfnEndpointProps{
		EndpointName: jsii.String("tap-ml-endpoint-" + *props.EnvironmentSuffix),
		EndpointConfigName: endpointConfig.AttrEndpointConfigName(),
	})

	// Add AI service access to EKS cluster service account
	aiServiceAccount := props.EksCluster.AddServiceAccount(jsii.String("AIServiceAccount"), &awseks.ServiceAccountOptions{
		Name: jsii.String("ai-service-account"),
		Namespace: jsii.String("default"),
	})

	aiServiceAccount.Role().AddManagedPolicy(
		awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonBedrockFullAccess")),
	)
	aiServiceAccount.Role().AddManagedPolicy(
		awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("AmazonSageMakerReadOnly")),
	)

	return &AIStack{
		NestedStack: nestedStack,
	}
}
```

## lib/monitoring_stack.go

```go
package lib

import (
	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscloudwatch"
	"github.com/aws/aws-cdk-go/awscdk/v2/awseks"
	"github.com/aws/aws-cdk-go/awscdk/v2/awselasticloadbalancingv2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslambda"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsrds"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type MonitoringStackProps struct {
	*awscdk.NestedStackProps
	EnvironmentSuffix *string
	EksCluster        awseks.ICluster
	Database          awsrds.IDatabaseCluster
	LoadBalancer      awselasticloadbalancingv2.IApplicationLoadBalancer
}

type MonitoringStack struct {
	awscdk.NestedStack
}

func NewMonitoringStack(scope constructs.Construct, id *string, props *MonitoringStackProps) *MonitoringStack {
	nestedStack := awscdk.NewNestedStack(scope, id, props.NestedStackProps)

	// SNS Topic for notifications
	topic := awssns.NewTopic(nestedStack, jsii.String("AlertsTopic"), &awssns.TopicProps{
		TopicName: jsii.String("tap-alerts-" + *props.EnvironmentSuffix),
		DisplayName: jsii.String("TAP Application Alerts"),
	})

	// CloudWatch Dashboard
	dashboard := awscloudwatch.NewDashboard(nestedStack, jsii.String("ApplicationDashboard"), &awscloudwatch.DashboardProps{
		DashboardName: jsii.String("TAP-" + *props.EnvironmentSuffix),
	})

	// EKS Cluster Monitoring
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title: jsii.String("EKS Cluster CPU Utilization"),
			Left: &[]awscloudwatch.IMetric{
				awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
					Namespace: jsii.String("AWS/EKS"),
					MetricName: jsii.String("cluster_cpu_utilization"),
					DimensionsMap: &map[string]*string{
						"ClusterName": props.EksCluster.ClusterName(),
					},
				}),
			},
		}),
	)

	// Database Monitoring
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title: jsii.String("Database Connections"),
			Left: &[]awscloudwatch.IMetric{
				awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
					Namespace: jsii.String("AWS/RDS"),
					MetricName: jsii.String("DatabaseConnections"),
					DimensionsMap: &map[string]*string{
						"DBClusterIdentifier": props.Database.ClusterIdentifier(),
					},
				}),
			},
		}),
	)

	// Load Balancer Monitoring
	dashboard.AddWidgets(
		awscloudwatch.NewGraphWidget(&awscloudwatch.GraphWidgetProps{
			Title: jsii.String("Load Balancer Request Count"),
			Left: &[]awscloudwatch.IMetric{
				awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
					Namespace: jsii.String("AWS/ApplicationELB"),
					MetricName: jsii.String("RequestCount"),
					DimensionsMap: &map[string]*string{
						"LoadBalancer": props.LoadBalancer.LoadBalancerFullName(),
					},
				}),
			},
		}),
	)

	// CloudWatch Alarms
	awscloudwatch.NewAlarm(nestedStack, jsii.String("HighCPUAlarm"), &awscloudwatch.AlarmProps{
		AlarmName: jsii.String("TAP-HighCPU-" + *props.EnvironmentSuffix),
		Metric: awscloudwatch.NewMetric(&awscloudwatch.MetricProps{
			Namespace: jsii.String("AWS/EKS"),
			MetricName: jsii.String("cluster_cpu_utilization"),
			DimensionsMap: &map[string]*string{
				"ClusterName": props.EksCluster.ClusterName(),
			},
		}),
		Threshold: jsii.Number(80),
		EvaluationPeriods: jsii.Number(2),
		ComparisonOperator: awscloudwatch.ComparisonOperator_GREATER_THAN_THRESHOLD,
	})

	// Lambda function for operational tasks
	operationalLambda := awslambda.NewFunction(nestedStack, jsii.String("OperationalFunction"), &awslambda.FunctionProps{
		FunctionName: jsii.String("tap-ops-" + *props.EnvironmentSuffix),
		Runtime: awslambda.Runtime_PYTHON_3_9(),
		Handler: jsii.String("index.handler"),
		Code: awslambda.Code_FromInline(jsii.String(`
import json
import boto3

def handler(event, context):
    """
    Operational tasks handler
    """
    print("Performing operational task:", json.dumps(event))
    
    # Example: Auto-scaling adjustments, log rotation, etc.
    
    return {
        'statusCode': 200,
        'body': json.dumps('Operational task completed')
    }
		`)),
		Description: jsii.String("Lambda function for automated operational tasks"),
		Timeout: awscdk.Duration_Minutes(jsii.Number(5)),
	})

	// Grant necessary permissions to Lambda
	operationalLambda.Role().AddManagedPolicy(
		awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("CloudWatchLogsFullAccess")),
	)

	return &MonitoringStack{
		NestedStack: nestedStack,
	}
}
```

This comprehensive infrastructure solution provides:

1. **Networking**: VPC with public/private subnets and NAT gateways for high availability
2. **Security**: Security groups, GuardDuty with EKS protection, and proper IAM roles
3. **Compute**: EKS cluster with managed node groups and Application Load Balancer
4. **Storage**: Aurora Serverless v2, S3 with intelligent tiering, and ElastiCache Redis
5. **AI/ML**: Bedrock integration with Nova models and SageMaker endpoints
6. **Monitoring**: CloudWatch dashboards, alarms, and operational Lambda functions

The solution follows AWS best practices for security, scalability, and cost optimization, with proper resource tagging and environment-specific naming conventions.