package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodebuild"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipeline"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipelineactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awslogs"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awssns"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type TapStack struct {
	awscdk.Stack
	EnvironmentSuffix *string
}

type TapStackProps struct {
	awscdk.StackProps
	EnvironmentSuffix *string
}

func NewTapStack(scope constructs.Construct, id *string, props *TapStackProps) *TapStack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, id, &sprops)

	// Get environment suffix
	envSuffix := "dev"
	if props != nil && props.EnvironmentSuffix != nil {
		envSuffix = *props.EnvironmentSuffix
	}

	tapStack := &TapStack{
		Stack:             stack,
		EnvironmentSuffix: jsii.String(envSuffix),
	}

	// Create S3 bucket for pipeline artifacts
	artifactBucket := awss3.NewBucket(stack, jsii.String("ArtifactBucket"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("cicd-artifacts-%s", envSuffix)),
		Versioned:         jsii.Bool(true),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
	})

	// Create SNS topic for pipeline notifications
	notificationTopic := awssns.NewTopic(stack, jsii.String("PipelineNotificationTopic"), &awssns.TopicProps{
		TopicName:   jsii.String(fmt.Sprintf("pipeline-notifications-%s", envSuffix)),
		DisplayName: jsii.String("CI/CD Pipeline Notifications"),
	})

	// Create CloudWatch log group for CodeBuild
	buildLogGroup := awslogs.NewLogGroup(stack, jsii.String("BuildLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/codebuild/build-project-%s", envSuffix)),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create IAM role for CodeBuild
	codeBuildRole := awsiam.NewRole(stack, jsii.String("CodeBuildRole"), &awsiam.RoleProps{
		RoleName:    jsii.String(fmt.Sprintf("codebuild-role-%s", envSuffix)),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("codebuild.amazonaws.com"), nil),
		Description: jsii.String("Service role for CodeBuild project"),
	})

	// Grant CodeBuild permissions
	artifactBucket.GrantReadWrite(codeBuildRole, nil)
	buildLogGroup.GrantWrite(codeBuildRole)

	// Add additional CodeBuild permissions
	codeBuildRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: jsii.Strings(
			"logs:CreateLogGroup",
			"logs:CreateLogStream",
			"logs:PutLogEvents",
		),
		Resources: jsii.Strings(fmt.Sprintf("arn:aws:logs:*:*:log-group:/aws/codebuild/*")),
	}))

	// Create CodeBuild project
	buildProject := awscodebuild.NewProject(stack, jsii.String("BuildProject"), &awscodebuild.ProjectProps{
		ProjectName: jsii.String(fmt.Sprintf("build-project-%s", envSuffix)),
		Description: jsii.String("Build project for CI/CD pipeline"),
		Role:        codeBuildRole,
		Environment: &awscodebuild.BuildEnvironment{
			BuildImage:           awscodebuild.LinuxBuildImage_STANDARD_7_0(),
			ComputeType:          awscodebuild.ComputeType_SMALL,
			Privileged:           jsii.Bool(false),
			EnvironmentVariables: &map[string]*awscodebuild.BuildEnvironmentVariable{},
		},
		BuildSpec: awscodebuild.BuildSpec_FromObject(&map[string]interface{}{
			"version": "0.2",
			"phases": map[string]interface{}{
				"install": map[string]interface{}{
					"commands": []string{
						"echo Installing dependencies...",
					},
				},
				"pre_build": map[string]interface{}{
					"commands": []string{
						"echo Pre-build phase...",
					},
				},
				"build": map[string]interface{}{
					"commands": []string{
						"echo Build phase...",
						"echo Build completed on `date`",
					},
				},
				"post_build": map[string]interface{}{
					"commands": []string{
						"echo Post-build phase...",
					},
				},
			},
			"artifacts": map[string]interface{}{
				"files": []string{
					"**/*",
				},
			},
		}),
		Logging: &awscodebuild.LoggingOptions{
			CloudWatch: &awscodebuild.CloudWatchLoggingOptions{
				LogGroup: buildLogGroup,
				Enabled:  jsii.Bool(true),
			},
		},
		Timeout: awscdk.Duration_Minutes(jsii.Number(30)),
	})

	// Create IAM role for CodePipeline
	pipelineRole := awsiam.NewRole(stack, jsii.String("PipelineRole"), &awsiam.RoleProps{
		RoleName:    jsii.String(fmt.Sprintf("codepipeline-role-%s", envSuffix)),
		AssumedBy:   awsiam.NewServicePrincipal(jsii.String("codepipeline.amazonaws.com"), nil),
		Description: jsii.String("Service role for CodePipeline"),
	})

	// Grant pipeline permissions
	artifactBucket.GrantReadWrite(pipelineRole, nil)

	// Add CodePipeline permissions
	pipelineRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: jsii.Strings(
			"codebuild:BatchGetBuilds",
			"codebuild:StartBuild",
		),
		Resources: jsii.Strings(*buildProject.ProjectArn()),
	}))

	pipelineRole.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: jsii.Strings(
			"sns:Publish",
		),
		Resources: jsii.Strings(*notificationTopic.TopicArn()),
	}))

	// Create source artifact
	sourceArtifact := awscodepipeline.NewArtifact(jsii.String("SourceArtifact"))
	buildArtifact := awscodepipeline.NewArtifact(jsii.String("BuildArtifact"))

	// Create CodePipeline
	pipeline := awscodepipeline.NewPipeline(stack, jsii.String("Pipeline"), &awscodepipeline.PipelineProps{
		PipelineName:   jsii.String(fmt.Sprintf("cicd-pipeline-%s", envSuffix)),
		Role:           pipelineRole,
		ArtifactBucket: artifactBucket,
		Stages: &[]*awscodepipeline.StageProps{
			{
				StageName: jsii.String("Source"),
				Actions: &[]awscodepipeline.IAction{
					awscodepipelineactions.NewS3SourceAction(&awscodepipelineactions.S3SourceActionProps{
						ActionName: jsii.String("S3Source"),
						Bucket:     artifactBucket,
						BucketKey:  jsii.String("source.zip"),
						Output:     sourceArtifact,
						Trigger:    awscodepipelineactions.S3Trigger_POLL,
					}),
				},
			},
			{
				StageName: jsii.String("Build"),
				Actions: &[]awscodepipeline.IAction{
					awscodepipelineactions.NewCodeBuildAction(&awscodepipelineactions.CodeBuildActionProps{
						ActionName: jsii.String("BuildAction"),
						Project:    buildProject,
						Input:      sourceArtifact,
						Outputs:    &[]awscodepipeline.Artifact{buildArtifact},
					}),
				},
			},
			{
				StageName: jsii.String("Deploy"),
				Actions: &[]awscodepipeline.IAction{
					awscodepipelineactions.NewManualApprovalAction(&awscodepipelineactions.ManualApprovalActionProps{
						ActionName:            jsii.String("ManualApproval"),
						NotificationTopic:     notificationTopic,
						AdditionalInformation: jsii.String("Please review and approve the deployment"),
					}),
				},
			},
		},
	})

	// Stack outputs
	awscdk.NewCfnOutput(stack, jsii.String("PipelineArn"), &awscdk.CfnOutputProps{
		Value:       pipeline.PipelineArn(),
		Description: jsii.String("ARN of the CI/CD pipeline"),
		ExportName:  jsii.String(fmt.Sprintf("pipeline-arn-%s", envSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("BuildProjectName"), &awscdk.CfnOutputProps{
		Value:       buildProject.ProjectName(),
		Description: jsii.String("Name of the CodeBuild project"),
		ExportName:  jsii.String(fmt.Sprintf("build-project-name-%s", envSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("ArtifactBucketName"), &awscdk.CfnOutputProps{
		Value:       artifactBucket.BucketName(),
		Description: jsii.String("Name of the artifact storage bucket"),
		ExportName:  jsii.String(fmt.Sprintf("artifact-bucket-name-%s", envSuffix)),
	})

	awscdk.NewCfnOutput(stack, jsii.String("NotificationTopicArn"), &awscdk.CfnOutputProps{
		Value:       notificationTopic.TopicArn(),
		Description: jsii.String("ARN of the SNS notification topic"),
		ExportName:  jsii.String(fmt.Sprintf("notification-topic-arn-%s", envSuffix)),
	})

	return tapStack
}
