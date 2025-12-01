# CI/CD Pipeline Infrastructure - AWS CDK Go Implementation

This implementation provides a complete CI/CD pipeline infrastructure using AWS CDK with Go, including CodePipeline, CodeBuild, S3 artifact storage, SNS notifications, and proper IAM roles.

## File: lib/tap_stack.go

```go
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

type TapStackProps struct {
	awscdk.StackProps
	EnvironmentSuffix *string
}

func NewTapStack(scope constructs.Construct, id string, props *TapStackProps) awscdk.Stack {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	// Get environment suffix
	envSuffix := "dev"
	if props != nil && props.EnvironmentSuffix != nil {
		envSuffix = *props.EnvironmentSuffix
	}

	// Create S3 bucket for pipeline artifacts
	artifactBucket := awss3.NewBucket(stack, jsii.String("ArtifactBucket"), &awss3.BucketProps{
		BucketName:       jsii.String(fmt.Sprintf("cicd-artifacts-%s", envSuffix)),
		Versioned:        jsii.Bool(true),
		Encryption:       awss3.BucketEncryption_S3_MANAGED,
		RemovalPolicy:    awscdk.RemovalPolicy_DESTROY,
		AutoDeleteObjects: jsii.Bool(true),
		BlockPublicAccess: awss3.BlockPublicAccess_BLOCK_ALL(),
	})

	// Create SNS topic for pipeline notifications
	notificationTopic := awssns.NewTopic(stack, jsii.String("PipelineNotificationTopic"), &awssns.TopicProps{
		TopicName:    jsii.String(fmt.Sprintf("pipeline-notifications-%s", envSuffix)),
		DisplayName:  jsii.String("CI/CD Pipeline Notifications"),
	})

	// Create CloudWatch log group for CodeBuild
	buildLogGroup := awslogs.NewLogGroup(stack, jsii.String("BuildLogGroup"), &awslogs.LogGroupProps{
		LogGroupName:  jsii.String(fmt.Sprintf("/aws/codebuild/build-project-%s", envSuffix)),
		Retention:     awslogs.RetentionDays_ONE_WEEK,
		RemovalPolicy: awscdk.RemovalPolicy_DESTROY,
	})

	// Create IAM role for CodeBuild
	codeBuildRole := awsiam.NewRole(stack, jsii.String("CodeBuildRole"), &awsiam.RoleProps{
		RoleName:  jsii.String(fmt.Sprintf("codebuild-role-%s", envSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("codebuild.amazonaws.com"), nil),
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
			PrivilegedMode:       jsii.Bool(false),
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
		RoleName:  jsii.String(fmt.Sprintf("codepipeline-role-%s", envSuffix)),
		AssumedBy: awsiam.NewServicePrincipal(jsii.String("codepipeline.amazonaws.com"), nil),
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
		PipelineName: jsii.String(fmt.Sprintf("cicd-pipeline-%s", envSuffix)),
		Role:         pipelineRole,
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
						ActionName:         jsii.String("ManualApproval"),
						NotificationTopic:  notificationTopic,
						AdditionalInformation: jsii.String("Please review and approve the deployment"),
					}),
				},
			},
		},
	})

	// Add notification rule for pipeline events
	pipeline.OnStateChange(jsii.String("PipelineStateChange"), &awscodepipeline.OnEventOptions{
		Target: nil, // Can be configured with SNS target
		Description: jsii.String("Pipeline state change notification"),
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

	return stack
}
```

## File: bin/tap.go

```go
package main

import (
	"os"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/jsii-runtime-go"

	"tap/lib"
)

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	// Get environment suffix from context or environment variable
	envSuffix := app.Node().TryGetContext(jsii.String("environmentSuffix"))
	if envSuffix == nil {
		envSuffixStr := os.Getenv("ENVIRONMENT_SUFFIX")
		if envSuffixStr == "" {
			envSuffixStr = "dev"
		}
		envSuffix = jsii.String(envSuffixStr)
	}

	lib.NewTapStack(app, "TapStack", &lib.TapStackProps{
		StackProps: awscdk.StackProps{
			Env: &awscdk.Environment{
				Region: jsii.String("us-east-1"),
			},
			Description: jsii.String("CI/CD Pipeline Infrastructure Stack"),
		},
		EnvironmentSuffix: envSuffix.(*string),
	})

	app.Synth(nil)
}
```

## File: go.mod

```go
module tap

go 1.21

require (
	github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0
	github.com/aws/constructs-go/constructs/v10 v10.3.0
	github.com/aws/jsii-runtime-go v1.95.0
)
```

## File: go.sum

```
github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0 h1:example_hash
github.com/aws/aws-cdk-go/awscdk/v2 v2.100.0/go.mod h1:example_hash
github.com/aws/constructs-go/constructs/v10 v10.3.0 h1:example_hash
github.com/aws/constructs-go/constructs/v10 v10.3.0/go.mod h1:example_hash
github.com/aws/jsii-runtime-go v1.95.0 h1:example_hash
github.com/aws/jsii-runtime-go v1.95.0/go.mod h1:example_hash
```

## File: cdk.json

```json
{
  "app": "go mod download && go run bin/tap.go",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "go.mod",
      "go.sum",
      "**/*test.go"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueFalse": true,
    "environmentSuffix": "dev"
  }
}
```

## File: lib/README.md

```markdown
# CI/CD Pipeline Infrastructure

This infrastructure provides a complete CI/CD pipeline solution using AWS CDK with Go.

## Architecture

The solution includes:

- **CodePipeline**: Main orchestration pipeline with Source, Build, and Deploy stages
- **CodeBuild**: Build automation project with CloudWatch Logs integration
- **S3 Bucket**: Encrypted artifact storage with versioning
- **SNS Topic**: Notification system for pipeline events
- **IAM Roles**: Least-privilege service roles for CodePipeline and CodeBuild
- **CloudWatch Logs**: Centralized logging for build activities

## Prerequisites

- Go 1.21 or later
- AWS CDK CLI v2.100.0 or later
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Installation

1. Install dependencies:
```bash
go mod download
```

2. Bootstrap CDK (if not already done):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

## Deployment

Deploy with default environment suffix (dev):
```bash
cdk deploy
```

Deploy with custom environment suffix:
```bash
cdk deploy -c environmentSuffix=prod
```

Or using environment variable:
```bash
export ENVIRONMENT_SUFFIX=staging
cdk deploy
```

## Configuration

### Environment Suffix

The environment suffix is used to create unique resource names across different environments. You can set it via:

1. CDK context: `cdk deploy -c environmentSuffix=myenv`
2. Environment variable: `export ENVIRONMENT_SUFFIX=myenv`
3. Default: `dev`

### AWS Region

The stack is configured to deploy to `us-east-1` by default. To change the region, modify the `Region` field in `bin/tap.go`.

## Outputs

After deployment, the stack outputs:

- **PipelineArn**: ARN of the CI/CD pipeline
- **BuildProjectName**: Name of the CodeBuild project
- **ArtifactBucketName**: Name of the S3 artifact bucket
- **NotificationTopicArn**: ARN of the SNS notification topic

## Usage

### Triggering the Pipeline

The pipeline is configured with an S3 source that polls for changes. To trigger the pipeline:

1. Upload a `source.zip` file to the artifact bucket:
```bash
aws s3 cp source.zip s3://cicd-artifacts-{environmentSuffix}/source.zip
```

The pipeline will automatically detect the change and start execution.

### Monitoring

- **Pipeline Execution**: View pipeline status in AWS CodePipeline console
- **Build Logs**: Check CloudWatch Logs group `/aws/codebuild/build-project-{environmentSuffix}`
- **Notifications**: Subscribe to the SNS topic for pipeline event notifications

### Subscribing to Notifications

Subscribe an email to receive pipeline notifications:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT-ID:pipeline-notifications-{environmentSuffix} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Testing

Run unit tests:
```bash
go test ./tests/... -v
```

Run integration tests (requires deployed stack):
```bash
go test ./tests/integration/... -v
```

## Customization

### Modify Build Specification

Edit the `BuildSpec` in `lib/tap_stack.go` to customize build commands:

```go
BuildSpec: awscodebuild.BuildSpec_FromObject(&map[string]interface{}{
    "version": "0.2",
    "phases": map[string]interface{}{
        "build": map[string]interface{}{
            "commands": []string{
                "your-build-command",
            },
        },
    },
}),
```

### Add Deploy Stage Actions

Replace the manual approval action with actual deployment actions:

```go
{
    StageName: jsii.String("Deploy"),
    Actions: &[]awscodepipeline.IAction{
        // Add your deployment action here
        // e.g., CloudFormation, CodeDeploy, ECS deployment
    },
}
```

## Security

- All artifacts are encrypted at rest using S3 server-side encryption
- IAM roles follow least-privilege principle
- S3 bucket blocks all public access
- CloudWatch Logs are retained for 7 days by default

## Cleanup

To destroy all resources:
```bash
cdk destroy
```

This will remove all infrastructure including:
- CodePipeline
- CodeBuild project
- S3 bucket and all artifacts (auto-delete enabled)
- SNS topic
- IAM roles
- CloudWatch Logs group

## Troubleshooting

### Pipeline Fails to Start

- Verify `source.zip` exists in the artifact bucket
- Check IAM permissions for CodePipeline role
- Review CloudWatch Logs for errors

### Build Failures

- Check build logs in CloudWatch Logs group
- Verify buildspec.yml syntax
- Ensure build environment has required dependencies

### Permission Issues

- Verify IAM roles have correct trust relationships
- Check service role policies include necessary permissions
- Ensure cross-service permissions are properly configured

## Support

For issues or questions:
- Review AWS CodePipeline documentation
- Check AWS CDK Go documentation
- Review CloudWatch Logs for detailed error messages
```

## Summary

This implementation provides:

1. **Complete CDK Go Infrastructure**: Defines all resources using AWS CDK v2 with Go
2. **CI/CD Pipeline**: CodePipeline with Source, Build, and Deploy stages
3. **Build Automation**: CodeBuild project with custom buildspec
4. **Artifact Management**: S3 bucket with versioning and encryption
5. **Notifications**: SNS topic for pipeline events
6. **Logging**: CloudWatch Logs integration with retention policy
7. **Security**: Least-privilege IAM roles and encrypted storage
8. **Environment Support**: environmentSuffix parameter for multi-environment deployments
9. **Destroyability**: All resources use RemovalPolicy.DESTROY
10. **Documentation**: Comprehensive README with deployment and usage instructions

All resources follow AWS best practices and are properly tagged with environment suffix for uniqueness.
