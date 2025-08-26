I see the issue. The package names and structure have changed in the newer versions of the CDKTF AWS provider. Let me provide you with the corrected version of the code with the proper package imports and structure:

```go
// tap_stack.go
package main

import (
	"fmt"

	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
	"github.com/hashicorp/terraform-cdk-go/cdktf"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/provider"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudtrail"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatcheventrule"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/cloudwatcheventtarget"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/codecommitrepository"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/codepipeline"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/codebuildproject"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrole"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicy"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/iamrolepolicyattachment"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmskey"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/kmsalias"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucket"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketserversideencryptionconfiguration"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/s3bucketversioning"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/snstopic"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawscalleridentity"
	"github.com/cdktf/cdktf-provider-aws-go/aws/v19/dataawsregion"
)

type TapStackConfig struct {
	region           string
	stagingAccountId string
	prodAccountId    string
	branchName       string
}

func NewTapStack(scope constructs.Construct, id string, config *TapStackConfig) cdktf.TerraformStack {
	stack := cdktf.NewTerraformStack(scope, &id)

	// AWS Provider
	provider.NewAwsProvider(stack, jsii.String("aws"), &provider.AwsProviderConfig{
		Region: jsii.String(config.region),
	})

	// Data sources
	current := dataawscalleridentity.NewDataAwsCallerIdentity(stack, jsii.String("current"), &dataawscalleridentity.DataAwsCallerIdentityConfig{})
	currentRegion := dataawsregion.NewDataAwsRegion(stack, jsii.String("current_region"), &dataawsregion.DataAwsRegionConfig{})

	// KMS Key for encryption
	kmsKey := kmskey.NewKmsKey(stack, jsii.String("pipeline-kms-key"), &kmskey.KmsKeyConfig{
		Description: jsii.String("KMS key for Project Nova CI/CD pipeline encryption"),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Sid": "Enable IAM User Permissions",
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:root"
					},
					"Action": "kms:*",
					"Resource": "*"
				},
				{
					"Sid": "Allow use of the key for CodePipeline",
					"Effect": "Allow",
					"Principal": {
						"Service": [
							"codepipeline.amazonaws.com",
							"codebuild.amazonaws.com",
							"s3.amazonaws.com",
							"cloudformation.amazonaws.com"
						]
					},
					"Action": [
						"kms:Encrypt",
						"kms:Decrypt",
						"kms:ReEncrypt*",
						"kms:GenerateDataKey*",
						"kms:DescribeKey"
					],
					"Resource": "*"
				}
			]
		}`, *current.AccountId())),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaKMSKey-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	kmsalias.NewKmsAlias(stack, jsii.String("pipeline-kms-alias"), &kmsalias.KmsAliasConfig{
		Name:         jsii.String(fmt.Sprintf("alias/Corp-Nova-Pipeline-%s", config.region)),
		TargetKeyId:  kmsKey.KeyId(),
	})

	// S3 Bucket for CodePipeline artifacts
	artifactsBucket := s3bucket.NewS3Bucket(stack, jsii.String("pipeline-artifacts"), &s3bucket.S3BucketConfig{
		Bucket: jsii.String(fmt.Sprintf("corp-nova-pipeline-artifacts-%s-%s", config.region, *current.AccountId())),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaArtifacts-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	s3bucketversioning.NewS3BucketVersioning(stack, jsii.String("artifacts-versioning"), &s3bucketversioning.S3BucketVersioningConfig{
		Bucket: artifactsBucket.Id(),
		VersioningConfiguration: &s3bucketversioning.S3BucketVersioningVersioningConfiguration{
			Status: jsii.String("Enabled"),
		},
	})

	s3bucketserversideencryptionconfiguration.NewS3BucketServerSideEncryptionConfiguration(stack, jsii.String("artifacts-encryption"), &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationConfig{
		Bucket: artifactsBucket.Id(),
		Rule: []*s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRule{
			{
				ApplyServerSideEncryptionByDefault: &s3bucketserversideencryptionconfiguration.S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault{
					SseAlgorithm:   jsii.String("aws:kms"),
					KmsMasterKeyId: kmsKey.Arn(),
				},
			},
		},
	})

	// CodeCommit Repository
	codeCommitRepo := codecommitrepository.NewCodecommitRepository(stack, jsii.String("nova-repo"), &codecommitrepository.CodecommitRepositoryConfig{
		RepositoryName:        jsii.String(fmt.Sprintf("Corp-NovaWebApp-%s", config.region)),
		RepositoryDescription: jsii.String("Project Nova web application source code repository"),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaWebApp-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	// SNS Topic for notifications
	snsTopic := snstopic.NewSnsTopic(stack, jsii.String("pipeline-notifications"), &snstopic.SnsTopicConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaPipelineNotifications-%s", config.region)),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaPipelineNotifications-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	// IAM Role for CodePipeline
	pipelineRole := iamrole.NewIamRole(stack, jsii.String("pipeline-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaPipelineRole-%s", config.region)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "codepipeline.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaPipelineRole-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	iamrolepolicy.NewIamRolePolicy(stack, jsii.String("pipeline-policy"), &iamrolepolicy.IamRolePolicyConfig{
		Name: jsii.String("PipelineExecutionPolicy"),
		Role: pipelineRole.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"s3:GetBucketVersioning",
						"s3:GetObject",
						"s3:GetObjectVersion",
						"s3:PutObject"
					],
					"Resource": [
						"%s",
						"%s/*"
					]
				},
				{
					"Effect": "Allow",
					"Action": [
						"codecommit:GetBranch",
						"codecommit:GetCommit",
						"codecommit:GetRepository",
						"codecommit:ListBranches",
						"codecommit:ListRepositories"
					],
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Action": [
						"codebuild:BatchGetBuilds",
						"codebuild:StartBuild"
					],
					"Resource": "*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"cloudformation:CreateStack",
						"cloudformation:DeleteStack",
						"cloudformation:DescribeStacks",
						"cloudformation:UpdateStack",
						"cloudformation:CreateChangeSet",
						"cloudformation:DeleteChangeSet",
						"cloudformation:DescribeChangeSet",
						"cloudformation:ExecuteChangeSet",
						"cloudformation:SetStackPolicy",
						"cloudformation:ValidateTemplate"
					],
					"Resource": "*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"iam:PassRole"
					],
					"Resource": "*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"sns:Publish"
					],
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Action": [
						"kms:Decrypt",
						"kms:DescribeKey",
						"kms:Encrypt",
						"kms:GenerateDataKey*",
						"kms:ReEncrypt*"
					],
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Action": [
						"sts:AssumeRole"
					],
					"Resource": [
						"arn:aws:iam::%s:role/Corp-NovaCloudFormationRole-*",
						"arn:aws:iam::%s:role/Corp-NovaCloudFormationRole-*"
					]
				}
			]
		}`, *artifactsBucket.Arn(), *artifactsBucket.Arn(), *codeCommitRepo.Arn(), *snsTopic.Arn(), *kmsKey.Arn(), config.stagingAccountId, config.prodAccountId)),
	})

	// IAM Role for CodeBuild
	codeBuildRole := iamrole.NewIamRole(stack, jsii.String("codebuild-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaCodeBuildRole-%s", config.region)),
		AssumeRolePolicy: jsii.String(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "codebuild.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaCodeBuildRole-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	iamrolepolicy.NewIamRolePolicy(stack, jsii.String("codebuild-policy"), &iamrolepolicy.IamRolePolicyConfig{
		Name: jsii.String("CodeBuildExecutionPolicy"),
		Role: codeBuildRole.Id(),
		Policy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Action": [
						"logs:CreateLogGroup",
						"logs:CreateLogStream",
						"logs:PutLogEvents"
					],
					"Resource": "arn:aws:logs:%s:%s:log-group:/aws/codebuild/*"
				},
				{
					"Effect": "Allow",
					"Action": [
						"s3:GetObject",
						"s3:GetObjectVersion",
						"s3:PutObject"
					],
					"Resource": [
						"%s",
						"%s/*"
					]
				},
				{
					"Effect": "Allow",
					"Action": [
						"kms:Decrypt",
						"kms:DescribeKey",
						"kms:Encrypt",
						"kms:GenerateDataKey*",
						"kms:ReEncrypt*"
					],
					"Resource": "%s"
				},
				{
					"Effect": "Allow",
					"Action": [
						"ecr:BatchCheckLayerAvailability",
						"ecr:GetDownloadUrlForLayer",
						"ecr:BatchGetImage",
						"ecr:GetAuthorizationToken"
					],
					"Resource": "*"
				}
			]
		}`, *currentRegion.Name(), *current.AccountId(), *artifactsBucket.Arn(), *artifactsBucket.Arn(), *kmsKey.Arn())),
	})

	// CodeBuild Project
	codeBuildProject := codebuildproject.NewCodebuildProject(stack, jsii.String("nova-build"), &codebuildproject.CodebuildProjectConfig{
		Name:         jsii.String(fmt.Sprintf("Corp-NovaBuild-%s", config.region)),
		Description:  jsii.String("Build and test project for Nova web application"),
		ServiceRole:  codeBuildRole.Arn(),

		Artifacts: &codebuildproject.CodebuildProjectArtifacts{
			Type: jsii.String("CODEPIPELINE"),
		},

		Environment: &codebuildproject.CodebuildProjectEnvironment{
			ComputeType:                jsii.String("BUILD_GENERAL1_MEDIUM"),
			Image:                     jsii.String("aws/codebuild/amazonlinux2-x86_64-standard:4.0"),
			Type:                      jsii.String("LINUX_CONTAINER"),
			PrivilegedMode:            jsii.Bool(true),
		},

		Source: &codebuildproject.CodebuildProjectSource{
			Type: jsii.String("CODEPIPELINE"),
			Buildspec: jsii.String(`version: 0.2
phases:
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - aws ecr get-login-password --region $AWS_DEFAULT_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com
  build:
    commands:
      - echo Build started on `date`
      - echo Running unit tests...
      - npm test
      - echo Running integration tests...
      - npm run test:integration
      - echo Building the Docker image...
      - docker build -t nova-web-app .
      - docker tag nova-web-app:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nova-web-app:latest
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Pushing the Docker image...
      - docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_DEFAULT_REGION.amazonaws.com/nova-web-app:latest
artifacts:
  files:
    - '**/*'`),
		},

		EncryptionKey: kmsKey.Arn(),

		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaBuild-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	// IAM Role for CloudFormation (Staging)
	stagingCfnRole := iamrole.NewIamRole(stack, jsii.String("staging-cfn-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-staging-%s", config.region)),
		AssumeRolePolicy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudformation.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				},
				{
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:role/Corp-NovaPipelineRole-%s"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`, *current.AccountId(), config.region)),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-staging-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("staging-cfn-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      stagingCfnRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/PowerUserAccess"),
	})

	// IAM Role for CloudFormation (Production)
	prodCfnRole := iamrole.NewIamRole(stack, jsii.String("prod-cfn-role"), &iamrole.IamRoleConfig{
		Name: jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-prod-%s", config.region)),
		AssumeRolePolicy: jsii.String(fmt.Sprintf(`{
			"Version": "2012-10-17",
			"Statement": [
				{
					"Effect": "Allow",
					"Principal": {
						"Service": "cloudformation.amazonaws.com"
					},
					"Action": "sts:AssumeRole"
				},
				{
					"Effect": "Allow",
					"Principal": {
						"AWS": "arn:aws:iam::%s:role/Corp-NovaPipelineRole-%s"
					},
					"Action": "sts:AssumeRole"
				}
			]
		}`, *current.AccountId(), config.region)),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaCloudFormationRole-prod-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	iamrolepolicyattachment.NewIamRolePolicyAttachment(stack, jsii.String("prod-cfn-policy"), &iamrolepolicyattachment.IamRolePolicyAttachmentConfig{
		Role:      prodCfnRole.Name(),
		PolicyArn: jsii.String("arn:aws:iam::aws:policy/PowerUserAccess"),
	})

	// CodePipeline
	pipeline := codepipeline.NewCodepipeline(stack, jsii.String("nova-pipeline"), &codepipeline.CodepipelineConfig{
		Name:    jsii.String(fmt.Sprintf("Corp-NovaPipeline-%s", config.region)),
		RoleArn: pipelineRole.Arn(),

		ArtifactStore: []*codepipeline.CodepipelineArtifactStore{
			{
				Location: artifactsBucket.Bucket(),
				Type:     jsii.String("S3"),
				EncryptionKey: &codepipeline.CodepipelineArtifactStoreEncryptionKey{
					Id:   kmsKey.Arn(),
					Type: jsii.String("KMS"),
				},
			},
		},

		Stage: []*codepipeline.CodepipelineStage{
			{
				Name: jsii.String("Source"),
				Action: []*codepipeline.CodepipelineStageAction{
					{
						Name:             jsii.String("Source"),
						Category:         jsii.String("Source"),
						Owner:            jsii.String("AWS"),
						Provider:         jsii.String("CodeCommit"),
						Version:          jsii.String("1"),
						OutputArtifacts:  &[]*string{jsii.String("source_output")},
						Configuration: &map[string]*string{
							"RepositoryName": codeCommitRepo.RepositoryName(),
							"BranchName":     jsii.String(config.branchName),
						},
					},
				},
			},
			{
				Name: jsii.String("Build"),
				Action: []*codepipeline.CodepipelineStageAction{
					{
						Name:            jsii.String("Build"),
						Category:        jsii.String("Build"),
						Owner:           jsii.String("AWS"),
						Provider:        jsii.String("CodeBuild"),
						Version:         jsii.String("1"),
						InputArtifacts:  &[]*string{jsii.String("source_output")},
						OutputArtifacts: &[]*string{jsii.String("build_output")},
						Configuration: &map[string]*string{
							"ProjectName": codeBuildProject.Name(),
						},
					},
				},
			},
			{
				Name: jsii.String("Deploy-Staging"),
				Action: []*codepipeline.CodepipelineStageAction{
					{
						Name:           jsii.String("Deploy"),
						Category:       jsii.String("Deploy"),
						Owner:          jsii.String("AWS"),
						Provider:       jsii.String("CloudFormation"),
						Version:        jsii.String("1"),
						InputArtifacts: &[]*string{jsii.String("build_output")},
						Region:         jsii.String("eu-west-1"),
						Configuration: &map[string]*string{
							"ActionMode":         jsii.String("CREATE_UPDATE"),
							"StackName":          jsii.String("Corp-NovaApp-staging-eu-west-1"),
							"TemplatePath":       jsii.String("build_output::template.yaml"),
							"Capabilities":       jsii.String("CAPABILITY_IAM"),
							"RoleArn":           jsii.String(fmt.Sprintf("arn:aws:iam::%s:role/Corp-NovaCloudFormationRole-staging-eu-west-1", config.stagingAccountId)),
						},
					},
				},
			},
			{
				Name: jsii.String("Approval"),
				Action: []*codepipeline.CodepipelineStageAction{
					{
						Name:     jsii.String("ManualApproval"),
						Category: jsii.String("Approval"),
						Owner:    jsii.String("AWS"),
						Provider: jsii.String("Manual"),
						Version:  jsii.String("1"),
						Configuration: &map[string]*string{
							"NotificationArn": snsTopic.Arn(),
							"CustomData":      jsii.String("Please review the staging deployment and approve for production release."),
						},
					},
				},
			},
			{
				Name: jsii.String("Deploy-Production"),
				Action: []*codepipeline.CodepipelineStageAction{
					{
						Name:           jsii.String("Deploy"),
						Category:       jsii.String("Deploy"),
						Owner:          jsii.String("AWS"),
						Provider:       jsii.String("CloudFormation"),
						Version:        jsii.String("1"),
						InputArtifacts: &[]*string{jsii.String("build_output")},
						Region:         jsii.String("us-east-1"),
						Configuration: &map[string]*string{
							"ActionMode":         jsii.String("CREATE_UPDATE"),
							"StackName":          jsii.String("Corp-NovaApp-prod-us-east-1"),
							"TemplatePath":       jsii.String("build_output::template.yaml"),
							"Capabilities":       jsii.String("CAPABILITY_IAM"),
							"RoleArn":           jsii.String(fmt.Sprintf("arn:aws:iam::%s:role/Corp-NovaCloudFormationRole-prod-us-east-1", config.prodAccountId)),
						},
					},
				},
			},
		},

		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaPipeline-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	// CloudWatch Event Rule for pipeline monitoring
	eventRule := cloudwatcheventrule.NewCloudwatchEventRule(stack, jsii.String("pipeline-event-rule"), &cloudwatcheventrule.CloudwatchEventRuleConfig{
		Name:        jsii.String(fmt.Sprintf("Corp-NovaPipelineEvents-%s", config.region)),
		Description: jsii.String("Capture pipeline state changes"),
		EventPattern: jsii.String(fmt.Sprintf(`{
			"source": ["aws.codepipeline"],
			"detail-type": ["CodePipeline Pipeline Execution State Change"],
			"detail": {
				"pipeline": ["%s"],
				"state": ["FAILED", "SUCCEEDED"]
			}
		}`, *pipeline.Name())),
		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaPipelineEvents-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	cloudwatcheventtarget.NewCloudwatchEventTarget(stack, jsii.String("pipeline-event-target"), &cloudwatcheventtarget.CloudwatchEventTargetConfig{
		Rule:     eventRule.Name(),
		Arn:      snsTopic.Arn(),
		TargetId: jsii.String("PipelineNotificationTarget"),
	})

	// CloudTrail for logging
	cloudtrail.NewCloudtrail(stack, jsii.String("pipeline-cloudtrail"), &cloudtrail.CloudtrailConfig{
		Name:                         jsii.String(fmt.Sprintf("Corp-NovaPipelineTrail-%s", config.region)),
		S3BucketName:                artifactsBucket.Bucket(),
		S3KeyPrefix:                 jsii.String("cloudtrail-logs/"),
		IncludeGlobalServiceEvents:  jsii.Bool(true),
		IsMultiRegionTrail:          jsii.Bool(true),
		EnableLogFileValidation:     jsii.Bool(true),
		KmsKeyId:                    kmsKey.Arn(),

		EventSelector: []*cloudtrail.CloudtrailEventSelector{
			{
				ReadWriteType:           jsii.String("All"),
				IncludeManagementEvents: jsii.Bool(true),
				DataResource: []*cloudtrail.CloudtrailEventSelectorDataResource{
					{
						Type:   jsii.String("AWS::CodePipeline::Pipeline"),
						Values: &[]*string{pipeline.Arn()},
					},
				},
			},
		},

		Tags: &map[string]*string{
			"Name":    jsii.String(fmt.Sprintf("Corp-NovaPipelineTrail-%s", config.region)),
			"Project": jsii.String("Nova"),
		},
	})

	return stack
}

func main() {
	app := cdktf.NewApp(nil)

	config := &TapStackConfig{
		region:           "eu-west-1",
		stagingAccountId: "123456789012", // Replace with your staging account ID
		prodAccountId:    "123456789013", // Replace with your production account ID
		branchName:       "main",
	}

	NewTapStack(app, "tap-stack", config)

	app.Synth()
}
```

## Key Changes Made:

1. **Fixed Import Paths**:
   - Changed `awsprovider` to `provider`
   - Changed `s3bucketencryption` to `s3bucketserversideencryptionconfiguration`

2. **Updated Provider Reference**:
   - Using `provider.NewAwsProvider` instead of `awsprovider.NewAwsProvider`

3. **Fixed S3 Encryption Configuration**:
   - Using the correct package and struct names for S3 server-side encryption

4. **Updated CodeBuild Image**:
   - Changed to `amazonlinux2-x86_64-standard:4.0` (more recent version)

## To resolve the dependency issues:

1. **Clean your go.mod file** and run:
```bash
go mod tidy
```

2. **If you're still having issues**, try initializing a fresh CDKTF project:
```bash
mkdir nova-pipeline && cd nova-pipeline
cdktf init --template=go --local
```

3. **Add the corrected code** to your project and run:
```bash
go mod tidy
cdktf synth
```

The corrected code should now compile without package import errors. The main changes address the package structure differences in the newer versions of the CDKTF AWS provider.
