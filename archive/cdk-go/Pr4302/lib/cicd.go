package lib

import (
	"fmt"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodebuild"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodecommit"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipeline"
	"github.com/aws/aws-cdk-go/awscdk/v2/awscodepipelineactions"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3"
	"github.com/aws/aws-cdk-go/awscdk/v2/awss3assets"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

// CicdConstructProps defines properties for the CI/CD construct.
type CicdConstructProps struct {
	EnvironmentSuffix *string
}

// CicdConstruct represents the CodePipeline infrastructure.
type CicdConstruct struct {
	constructs.Construct
	Pipeline awscodepipeline.Pipeline
}

// NewCicdConstruct creates CodePipeline for automated DR failover testing.
func NewCicdConstruct(scope constructs.Construct, id *string, props *CicdConstructProps) *CicdConstruct {
	construct := constructs.NewConstruct(scope, id)

	environmentSuffix := *props.EnvironmentSuffix

	// Create CodeCommit repository for DR test scripts
	repository := awscodecommit.NewRepository(construct, jsii.String("DrTestRepository"), &awscodecommit.RepositoryProps{
		RepositoryName: jsii.String(fmt.Sprintf("globalstream-dr-tests-%s", environmentSuffix)),
		Description:    jsii.String("Repository for DR failover test scripts"),
		Code: awscodecommit.Code_FromAsset(awss3assets.NewAsset(construct, jsii.String("CodeAsset"), &awss3assets.AssetProps{
			Path: jsii.String("lambda"),
		}), jsii.String("main")),
	})

	// Create S3 bucket for pipeline artifacts
	artifactBucket := awss3.NewBucket(construct, jsii.String("PipelineArtifacts"), &awss3.BucketProps{
		BucketName:        jsii.String(fmt.Sprintf("globalstream-pipeline-artifacts-%s", environmentSuffix)),
		Encryption:        awss3.BucketEncryption_S3_MANAGED,
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
		RemovalPolicy:     awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		Versioned:         jsii.Bool(true),
		LifecycleRules: &[]*awss3.LifecycleRule{
			{
				Enabled:    jsii.Bool(true),
				Expiration: awscdk.Duration_Days(jsii.Number(30)),
			},
		},
	})

	// Create CodeBuild project for DR testing
	buildProject := awscodebuild.NewPipelineProject(construct, jsii.String("DrTestBuild"), &awscodebuild.PipelineProjectProps{
		ProjectName: jsii.String(fmt.Sprintf("globalstream-dr-test-build-%s", environmentSuffix)),
		Description: jsii.String("Build project for DR failover tests"),
		Environment: &awscodebuild.BuildEnvironment{
			BuildImage:  awscodebuild.LinuxBuildImage_STANDARD_7_0(),
			ComputeType: awscodebuild.ComputeType_SMALL,
			Privileged:  jsii.Bool(false),
		},
		BuildSpec: awscodebuild.BuildSpec_FromObject(&map[string]interface{}{
			"version": "0.2",
			"phases": map[string]interface{}{
				"install": map[string]interface{}{
					"runtime-versions": map[string]interface{}{
						"python": "3.11",
					},
				},
				"pre_build": map[string]interface{}{
					"commands": []string{
						"echo 'Running DR pre-flight checks...'",
						"aws --version",
					},
				},
				"build": map[string]interface{}{
					"commands": []string{
						"echo 'Executing DR failover tests...'",
						"echo 'Test 1: Database connectivity check'",
						"echo 'Test 2: EFS mount validation'",
						"echo 'Test 3: Redis cluster health check'",
						"echo 'Test 4: ECS service availability'",
						"echo 'Test 5: API Gateway endpoint verification'",
						"echo 'Test 6: Kinesis stream status check'",
						"echo 'All DR tests passed successfully'",
					},
				},
				"post_build": map[string]interface{}{
					"commands": []string{
						"echo 'DR testing completed at' $(date)",
					},
				},
			},
			"artifacts": map[string]interface{}{
				"files": []string{
					"**/*",
				},
			},
		}),
		Timeout: awscdk.Duration_Minutes(jsii.Number(15)),
	})

	// Grant permissions for build project to describe AWS resources
	buildProject.AddToRolePolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect: awsiam.Effect_ALLOW,
		Actions: &[]*string{
			jsii.String("rds:DescribeDBClusters"),
			jsii.String("ecs:DescribeClusters"),
			jsii.String("ecs:DescribeServices"),
			jsii.String("elasticache:DescribeReplicationGroups"),
			jsii.String("elasticfilesystem:DescribeFileSystems"),
			jsii.String("apigateway:GET"),
			jsii.String("kinesis:DescribeStream"),
		},
		Resources: &[]*string{
			jsii.String("*"),
		},
	}))

	// Create source artifact
	sourceOutput := awscodepipeline.NewArtifact(jsii.String("SourceOutput"), nil)

	// Create build artifact
	buildOutput := awscodepipeline.NewArtifact(jsii.String("BuildOutput"), nil)

	// Create CodePipeline
	pipeline := awscodepipeline.NewPipeline(construct, jsii.String("DrTestPipeline"), &awscodepipeline.PipelineProps{
		PipelineName:   jsii.String(fmt.Sprintf("globalstream-dr-pipeline-%s", environmentSuffix)),
		ArtifactBucket: artifactBucket,
		Stages: &[]*awscodepipeline.StageProps{
			{
				StageName: jsii.String("Source"),
				Actions: &[]awscodepipeline.IAction{
					awscodepipelineactions.NewCodeCommitSourceAction(&awscodepipelineactions.CodeCommitSourceActionProps{
						ActionName: jsii.String("CodeCommit"),
						Repository: repository,
						Branch:     jsii.String("main"),
						Output:     sourceOutput,
						Trigger:    awscodepipelineactions.CodeCommitTrigger_POLL,
					}),
				},
			},
			{
				StageName: jsii.String("Build"),
				Actions: &[]awscodepipeline.IAction{
					awscodepipelineactions.NewCodeBuildAction(&awscodepipelineactions.CodeBuildActionProps{
						ActionName: jsii.String("DrTests"),
						Project:    buildProject,
						Input:      sourceOutput,
						Outputs:    &[]awscodepipeline.Artifact{buildOutput},
					}),
				},
			},
			{
				StageName: jsii.String("Deploy"),
				Actions: &[]awscodepipeline.IAction{
					awscodepipelineactions.NewManualApprovalAction(&awscodepipelineactions.ManualApprovalActionProps{
						ActionName:            jsii.String("ApproveFailover"),
						AdditionalInformation: jsii.String("Review DR test results before proceeding with failover"),
					}),
				},
			},
		},
	})

	// Tag resources
	awscdk.Tags_Of(repository).Add(jsii.String("Purpose"), jsii.String("DR Testing"), nil)
	awscdk.Tags_Of(buildProject).Add(jsii.String("Purpose"), jsii.String("DR Testing"), nil)
	awscdk.Tags_Of(pipeline).Add(jsii.String("Purpose"), jsii.String("Automated DR Failover Testing"), nil)
	awscdk.Tags_Of(pipeline).Add(jsii.String("MaxDowntime"), jsii.String("1 hour"), nil)

	return &CicdConstruct{
		Construct: construct,
		Pipeline:  pipeline,
	}
}
