package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodebuild"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipeline"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipelineactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type PipelineStackProps struct {
	awscdk.StackProps
	EnvironmentSuffix string
	Environment       string
	RepositoryName    string
	BranchName        string
}

func NewPipelineStack(scope constructs.Construct, id string, props *PipelineStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Create artifact bucket for pipeline
	artifactBucket := awss3.NewBucket(stack, jsii.String(fmt.Sprintf("pipeline-artifacts-%s", props.EnvironmentSuffix)), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("pipeline-artifacts-%s", props.EnvironmentSuffix)),
		Versioned:         jsii.Bool(true),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
	})

	// Create source output artifact
	sourceOutput := awscodepipeline.NewArtifact(jsii.String("SourceOutput"), nil)

	// Create build project for CDK synth
	buildProject := awscodebuild.NewPipelineProject(stack, jsii.String(fmt.Sprintf("build-project-%s", props.EnvironmentSuffix)), &awscodebuild.PipelineProjectProps{
		ProjectName: jsii.String(fmt.Sprintf("payment-cdk-build-%s", props.EnvironmentSuffix)),
		Environment: &awscodebuild.BuildEnvironment{
			BuildImage:  awscodebuild.LinuxBuildImage_STANDARD_7_0(),
			ComputeType: awscodebuild.ComputeType_SMALL,
		},
		BuildSpec: awscodebuild.BuildSpec_FromObject(&map[string]interface{}{
			"version": "0.2",
			"phases": map[string]interface{}{
				"install": map[string]interface{}{
					"commands": []string{
						"npm install -g aws-cdk",
						"go version",
					},
				},
				"build": map[string]interface{}{
					"commands": []string{
						"go mod download",
						"cdk synth",
					},
				},
			},
			"artifacts": map[string]interface{}{
				"base-directory": "cdk.out",
				"files": []string{
					"**/*",
				},
			},
		}),
	})

	// Create build output artifact
	buildOutput := awscodepipeline.NewArtifact(jsii.String("BuildOutput"), nil)

	// Create build action
	buildAction := awscodepipelineactions.NewCodeBuildAction(&awscodepipelineactions.CodeBuildActionProps{
		ActionName: jsii.String("Build"),
		Project:    buildProject,
		Input:      sourceOutput,
		Outputs:    &[]awscodepipeline.Artifact{buildOutput},
	})

	// Create manual approval action for production
	var approvalAction awscodepipelineactions.ManualApprovalAction
	if props.Environment == "prod" {
		approvalAction = awscodepipelineactions.NewManualApprovalAction(&awscodepipelineactions.ManualApprovalActionProps{
			ActionName:            jsii.String("ManualApproval"),
			AdditionalInformation: jsii.String("Please review the changes before deploying to production"),
			RunOrder:              jsii.Number(1),
		})
	}

	// Create deploy action
	deployAction := awscodepipelineactions.NewCloudFormationCreateUpdateStackAction(&awscodepipelineactions.CloudFormationCreateUpdateStackActionProps{
		ActionName:       jsii.String("Deploy"),
		StackName:        jsii.String(fmt.Sprintf("PaymentStack-%s", props.Environment)),
		TemplatePath:     buildOutput.AtPath(jsii.String(fmt.Sprintf("PaymentStack-%s.template.json", props.Environment))),
		AdminPermissions: jsii.Bool(true),
		RunOrder:         jsii.Number(2),
	})

	// Create pipeline stages
	var stages []*awscodepipeline.StageProps

	// Source stage (placeholder - in real implementation would use CodeCommit or GitHub)
	stages = append(stages, &awscodepipeline.StageProps{
		StageName: jsii.String("Source"),
		Actions:   &[]awscodepipeline.IAction{},
	})

	// Build stage
	stages = append(stages, &awscodepipeline.StageProps{
		StageName: jsii.String("Build"),
		Actions:   &[]awscodepipeline.IAction{buildAction},
	})

	// Deploy stage with optional approval
	var deployStageActions []awscodepipeline.IAction
	if props.Environment == "prod" {
		deployStageActions = []awscodepipeline.IAction{approvalAction, deployAction}
	} else {
		deployStageActions = []awscodepipeline.IAction{deployAction}
	}

	stages = append(stages, &awscodepipeline.StageProps{
		StageName: jsii.String("Deploy"),
		Actions:   &deployStageActions,
	})

	// Create pipeline
	pipeline := awscodepipeline.NewPipeline(stack, jsii.String(fmt.Sprintf("pipeline-%s", props.EnvironmentSuffix)), &awscodepipeline.PipelineProps{
		PipelineName:             jsii.String(fmt.Sprintf("payment-pipeline-%s", props.EnvironmentSuffix)),
		ArtifactBucket:           artifactBucket,
		Stages:                   &stages,
		RestartExecutionOnUpdate: jsii.Bool(false),
	})

	// Tag pipeline
	awscdk.Tags_Of(pipeline).Add(jsii.String("Environment"), jsii.String(props.Environment), nil)
	awscdk.Tags_Of(pipeline).Add(jsii.String("CostCenter"), jsii.String("PaymentProcessing"), nil)

	// Output pipeline ARN
	awscdk.NewCfnOutput(stack, jsii.String("PipelineArn"), &awscdk.CfnOutputProps{
		Value:       pipeline.PipelineArn(),
		Description: jsii.String("CodePipeline ARN"),
		ExportName:  jsii.String(fmt.Sprintf("pipeline-arn-%s", props.EnvironmentSuffix)),
	})

	return stack
}
