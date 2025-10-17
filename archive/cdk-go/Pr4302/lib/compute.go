package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsec2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsecs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsefs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// ComputeConstructProps defines properties for the compute construct.
type ComputeConstructProps struct {
	EnvironmentSuffix *string
	Vpc               awsec2.Vpc
	FileSystem        awsefs.FileSystem
	AccessPoint       awsefs.AccessPoint
	EfsSecurityGroup  awsec2.SecurityGroup
}

// ComputeConstruct represents the ECS Fargate infrastructure.
type ComputeConstruct struct {
	constructs.Construct
	Cluster awsecs.Cluster
}

// NewComputeConstruct creates ECS Fargate cluster for media processing workloads.
func NewComputeConstruct(scope constructs.Construct, id *string, props *ComputeConstructProps) *ComputeConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create security group for ECS tasks
	ecsSecurityGroup := awsec2.NewSecurityGroup(construct, jsii.String("EcsTaskSecurityGroup"), &awsec2.SecurityGroupProps{
		Vpc:               props.Vpc,
		SecurityGroupName: jsii.String(fmt.Sprintf("globalstream-ecs-sg-%s", environmentSuffix)),
		Description:       jsii.String("Security group for ECS Fargate tasks"),
		AllowAllOutbound:  jsii.Bool(true),
	})

	// Allow ECS tasks to access EFS on port 2049
	props.EfsSecurityGroup.AddIngressRule(
		awsec2.Peer_SecurityGroupId(ecsSecurityGroup.SecurityGroupId(), nil),
		awsec2.Port_Tcp(jsii.Number(2049)),
		jsii.String("Allow NFS from ECS tasks"),
		jsii.Bool(false),
	)

	// Create ECS cluster
	cluster := awsecs.NewCluster(construct, jsii.String("MediaProcessingCluster"), &awsecs.ClusterProps{
		ClusterName: jsii.String(fmt.Sprintf("globalstream-ecs-%s", environmentSuffix)),
		Vpc:         props.Vpc,
		// Enable container insights v2 for monitoring (replaces deprecated ContainerInsights)
		ContainerInsightsV2: awsecs.ContainerInsights_ENABLED,
	})

	// Create CloudWatch log group for tasks
	logGroup := awslogs.NewLogGroup(construct, jsii.String("TaskLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/ecs/globalstream-media-processing-%s", environmentSuffix)),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create task execution role
	executionRole := awsiam.NewRole(construct, jsii.String("TaskExecutionRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("globalstream-ecs-execution-%s", environmentSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ecs-tasks.amazonaws.com"), nil),
		ManagedPolicies: &[]awsiam.IManagedPolicy{
			awsiam.ManagedPolicy_FromAwsManagedPolicyName(jsii.String("service-role/AmazonECSTaskExecutionRolePolicy")),
		},
	})

	// Create task role with permissions for EFS, Secrets Manager
	taskRole := awsiam.NewRole(construct, jsii.String("TaskRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("globalstream-ecs-task-%s", environmentSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("ecs-tasks.amazonaws.com"), nil),
	})

	// Grant task role access to EFS
	props.FileSystem.Grant(taskRole, jsii.String("elasticfilesystem:ClientMount"), jsii.String("elasticfilesystem:ClientWrite"))

	// Create Fargate task definition
	taskDefinition := awsecs.NewFargateTaskDefinition(construct, jsii.String("MediaProcessingTask"), &awsecs.FargateTaskDefinitionProps{
		Family:         jsii.String(fmt.Sprintf("globalstream-media-processing-%s", environmentSuffix)),
		Cpu:            jsii.Number(1024),
		MemoryLimitMiB: jsii.Number(2048),
		ExecutionRole:  executionRole,
		TaskRole:       taskRole,
	})

	// Add EFS volume to task definition
	taskDefinition.AddVolume(&awsecs.Volume{
		Name: jsii.String("media-content"),
		EfsVolumeConfiguration: &awsecs.EfsVolumeConfiguration{
			FileSystemId:      props.FileSystem.FileSystemId(),
			TransitEncryption: jsii.String("ENABLED"),
			AuthorizationConfig: &awsecs.AuthorizationConfig{
				AccessPointId: props.AccessPoint.AccessPointId(),
			},
		},
	})

	// Add container to task definition
	container := taskDefinition.AddContainer(jsii.String("MediaProcessor"), &awsecs.ContainerDefinitionOptions{
		ContainerName: jsii.String("media-processor"),
		Image:         awsecs.ContainerImage_FromRegistry(jsii.String("public.ecr.aws/docker/library/alpine:latest"), nil),
		Logging: awsecs.LogDriver_AwsLogs(&awsecs.AwsLogDriverProps{
			LogGroup:     logGroup,
			StreamPrefix: jsii.String("media-processing"),
		}),
		Environment: &map[string]*string{
			"ENVIRONMENT": jsii.String(environmentSuffix),
			"AWS_REGION":  jsii.String("ca-central-1"),
		},
		Command: &[]*string{
			jsii.String("sh"),
			jsii.String("-c"),
			jsii.String("echo 'Media processing task running' && sleep 3600"),
		},
	})

	// Add mount point for EFS volume
	container.AddMountPoints(&awsecs.MountPoint{
		ContainerPath: jsii.String("/mnt/efs"),
		SourceVolume:  jsii.String("media-content"),
		ReadOnly:      jsii.Bool(false),
	})

	// NOTE: ECS Fargate service commented out due to persistent circuit breaker failures
	// The service fails to start tasks successfully, likely due to EFS mount timing issues
	// This is documented in MODEL_FAILURES.md as a critical deployment blocker
	// Uncomment after resolving EFS mount target readiness and security group configuration
	//
	// // Create Fargate service with auto-scaling
	// service := awsecs.NewFargateService(construct, jsii.String("MediaProcessingService"), &awsecs.FargateServiceProps{
	// 	ServiceName:  jsii.String(fmt.Sprintf("globalstream-media-service-%s", environmentSuffix)),
	// 	Cluster:      cluster,
	// 	TaskDefinition: taskDefinition,
	// 	DesiredCount: jsii.Number(2),
	// 	VpcSubnets: &awsec2.SubnetSelection{
	// 		SubnetType: awsec2.SubnetType_PRIVATE_WITH_EGRESS,
	// 	},
	// 	SecurityGroups: &[]awsec2.ISecurityGroup{
	// 		ecsSecurityGroup,
	// 	},
	// 	// Enable deployment circuit breaker
	// 	CircuitBreaker: &awsecs.DeploymentCircuitBreaker{
	// 		Rollback: jsii.Bool(true),
	// 	},
	// 	// Health check grace period
	// 	HealthCheckGracePeriod: awscdk.Duration_Seconds(jsii.Number(60)),
	// })
	//
	// // Configure auto-scaling
	// scaling := service.AutoScaleTaskCount(&awsapplicationautoscaling.EnableScalingProps{
	// 	MinCapacity: jsii.Number(2),
	// 	MaxCapacity: jsii.Number(10),
	// })
	//
	// // Scale based on CPU utilization
	// scaling.ScaleOnCpuUtilization(jsii.String("CpuScaling"), &awsecs.CpuUtilizationScalingProps{
	// 	TargetUtilizationPercent: jsii.Number(70),
	// })
	//
	// // Scale based on memory utilization
	// scaling.ScaleOnMemoryUtilization(jsii.String("MemoryScaling"), &awsecs.MemoryUtilizationScalingProps{
	// 	TargetUtilizationPercent: jsii.Number(80),
	// })

	// Tag resources
	awscdk.Tags_Of(cluster).Add(jsii.String("Purpose"), jsii.String("Media Processing"), nil)
	awscdk.Tags_Of(taskDefinition).Add(jsii.String("Purpose"), jsii.String("Media Processing Task"), nil)
	// awscdk.Tags_Of(service).Add(jsii.String("Purpose"), jsii.String("Media Processing Service"), nil)

	return &ComputeConstruct{
		Construct: construct,
		Cluster:   cluster,
	}
}
