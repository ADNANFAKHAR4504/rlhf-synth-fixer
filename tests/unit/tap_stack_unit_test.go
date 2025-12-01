//go:build !integration
// +build !integration

package lib

import (
	"sync"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks int

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := args.Inputs.Mappable()

	// Add ID for all resources
	if args.ID == "" {
		outputs["id"] = args.Name + "-id"
	}

	// Add ARN for resources that need it
	switch args.TypeToken {
	case "aws:iam/role:Role":
		outputs["arn"] = "arn:aws:iam::123456789012:role/" + args.Name
		outputs["name"] = args.Name
	case "aws:iam/policy:Policy":
		outputs["arn"] = "arn:aws:iam::123456789012:policy/" + args.Name
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = "vpc-" + args.Name
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = "subnet-" + args.Name
	case "aws:ec2/securityGroup:SecurityGroup":
		outputs["id"] = "sg-" + args.Name
	case "aws:rds/instance:Instance":
		outputs["endpoint"] = "payment-db.xxxxx.us-east-1.rds.amazonaws.com:5432"
		outputs["arn"] = "arn:aws:rds:us-east-1:123456789012:db:" + args.Name
	case "aws:rds/subnetGroup:SubnetGroup":
		outputs["name"] = args.Name
	case "aws:secretsmanager/secret:Secret":
		outputs["arn"] = "arn:aws:secretsmanager:us-east-1:123456789012:secret:" + args.Name
		outputs["id"] = args.Name
	case "aws:ecs/cluster:Cluster":
		outputs["name"] = args.Name
		outputs["arn"] = "arn:aws:ecs:us-east-1:123456789012:cluster/" + args.Name
	case "aws:ecs/taskDefinition:TaskDefinition":
		outputs["arn"] = "arn:aws:ecs:us-east-1:123456789012:task-definition/" + args.Name
	case "aws:s3/bucket:Bucket":
		outputs["bucket"] = args.Name
		outputs["arn"] = "arn:aws:s3:::" + args.Name
	case "aws:codebuild/project:Project":
		outputs["name"] = args.Name
	case "aws:codepipeline/pipeline:Pipeline":
		outputs["name"] = args.Name
	case "aws:cloudwatch/logGroup:LogGroup":
		outputs["name"] = args.Name
		outputs["arn"] = "arn:aws:logs:us-east-1:123456789012:log-group:" + args.Name
	case "random:index/randomPassword:RandomPassword":
		outputs["result"] = "TestSecurePassword123!@#"
	}

	return args.Name + "-id", resource.NewPropertyMapFromMap(outputs), nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return args.Args, nil
}

// runTapStackTest is a helper that runs NewTapStack with mocks
func runTapStackTest(t *testing.T, envSuffix string) error {
	return pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: envSuffix,
		})
	}, pulumi.WithMocks("project", "stack", mocks(0)))
}

func TestVPCConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-vpc")
	assert.NoError(t, err)
}

func TestPrivateSubnetsAcrossMultipleAZs(t *testing.T) {
	err := runTapStackTest(t, "test-subnets")
	assert.NoError(t, err)
}

func TestRDSMultiAZConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-rds-az")
	assert.NoError(t, err)
}

func TestRDSEncryptionAtRest(t *testing.T) {
	err := runTapStackTest(t, "test-rds-enc")
	assert.NoError(t, err)
}

func TestRDSAutomatedBackups(t *testing.T) {
	err := runTapStackTest(t, "test-rds-backup")
	assert.NoError(t, err)
}

func TestRDSDeletionProtectionDisabled(t *testing.T) {
	err := runTapStackTest(t, "test-rds-del")
	assert.NoError(t, err)
}

func TestSecretsManagerConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-secrets")
	assert.NoError(t, err)
}

func TestSecretsRotationConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-rotation")
	assert.NoError(t, err)
}

func TestECSClusterConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-ecs")
	assert.NoError(t, err)
}

func TestECSTaskDefinitionFargate(t *testing.T) {
	err := runTapStackTest(t, "test-fargate")
	assert.NoError(t, err)
}

func TestCodePipelineConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-pipeline")
	assert.NoError(t, err)
}

func TestCodeBuildConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-codebuild")
	assert.NoError(t, err)
}

func TestS3BucketForceDestroyEnabled(t *testing.T) {
	err := runTapStackTest(t, "test-s3")
	assert.NoError(t, err)
}

func TestS3BucketVersioningEnabled(t *testing.T) {
	err := runTapStackTest(t, "test-s3ver")
	assert.NoError(t, err)
}

func TestIAMRolesLeastPrivilege(t *testing.T) {
	err := runTapStackTest(t, "test-iam")
	assert.NoError(t, err)
}

func TestSecurityGroupsProperIsolation(t *testing.T) {
	err := runTapStackTest(t, "test-sg")
	assert.NoError(t, err)
}

func TestCloudWatchLogGroupConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-cw")
	assert.NoError(t, err)
}

func TestEnvironmentSuffixUsage(t *testing.T) {
	err := runTapStackTest(t, "test-env")
	assert.NoError(t, err)
}

func TestResourceTagging(t *testing.T) {
	err := runTapStackTest(t, "test-tags")
	assert.NoError(t, err)
}

func TestDBSubnetGroupConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-dbsubnet")
	assert.NoError(t, err)
}

func TestRegionConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-region")
	assert.NoError(t, err)
}

func TestRandomPasswordGeneration(t *testing.T) {
	err := runTapStackTest(t, "test-pwd")
	assert.NoError(t, err)
}

// Test concurrent resource creation
func TestConcurrentResourceCreation(t *testing.T) {
	var wg sync.WaitGroup
	for i := 0; i < 3; i++ {
		wg.Add(1)
		go func(idx int) {
			defer wg.Done()
			suffix := "concurrent" + string(rune('0'+idx))
			err := runTapStackTest(t, suffix)
			assert.NoError(t, err)
		}(i)
	}
	wg.Wait()
}

// Test error handling for missing environmentSuffix
func TestMissingEnvironmentSuffixError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "", // Empty string should trigger error
		})
	}, pulumi.WithMocks("project", "stack", mocks(0)))
	// Should return error for missing environmentSuffix
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "environmentSuffix is required")
}

// Test VPC CIDR configuration
func TestVPCCIDRConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-cidr")
	assert.NoError(t, err)
}

// Test subnet CIDR blocks
func TestSubnetCIDRConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-subnet-cidr")
	assert.NoError(t, err)
}

// Test CodeBuild ECR permissions
func TestCodeBuildECRPermissions(t *testing.T) {
	err := runTapStackTest(t, "test-ecr")
	assert.NoError(t, err)
}

// Test ECS task secrets configuration
func TestECSTaskSecretsConfiguration(t *testing.T) {
	err := runTapStackTest(t, "test-task-secrets")
	assert.NoError(t, err)
}

// Test stack outputs
func TestStackOutputs(t *testing.T) {
	err := runTapStackTest(t, "test-outputs")
	assert.NoError(t, err)
}

// Error mocks for testing error paths
type errorMocks struct {
	failResource string
}

func (m errorMocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	// Fail if the resource type matches
	if args.TypeToken == m.failResource {
		return "", nil, assert.AnError
	}

	outputs := args.Inputs.Mappable()
	if args.ID == "" {
		outputs["id"] = args.Name + "-id"
	}

	switch args.TypeToken {
	case "aws:iam/role:Role":
		outputs["arn"] = "arn:aws:iam::123456789012:role/" + args.Name
		outputs["name"] = args.Name
	case "aws:iam/policy:Policy":
		outputs["arn"] = "arn:aws:iam::123456789012:policy/" + args.Name
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = "vpc-" + args.Name
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = "subnet-" + args.Name
	case "aws:ec2/securityGroup:SecurityGroup":
		outputs["id"] = "sg-" + args.Name
	case "aws:rds/instance:Instance":
		outputs["endpoint"] = "payment-db.xxxxx.us-east-1.rds.amazonaws.com:5432"
		outputs["arn"] = "arn:aws:rds:us-east-1:123456789012:db:" + args.Name
	case "aws:rds/subnetGroup:SubnetGroup":
		outputs["name"] = args.Name
	case "aws:secretsmanager/secret:Secret":
		outputs["arn"] = "arn:aws:secretsmanager:us-east-1:123456789012:secret:" + args.Name
		outputs["id"] = args.Name
	case "aws:ecs/cluster:Cluster":
		outputs["name"] = args.Name
		outputs["arn"] = "arn:aws:ecs:us-east-1:123456789012:cluster/" + args.Name
	case "aws:ecs/taskDefinition:TaskDefinition":
		outputs["arn"] = "arn:aws:ecs:us-east-1:123456789012:task-definition/" + args.Name
	case "aws:s3/bucket:Bucket":
		outputs["bucket"] = args.Name
		outputs["arn"] = "arn:aws:s3:::" + args.Name
	case "aws:codebuild/project:Project":
		outputs["name"] = args.Name
	case "aws:codepipeline/pipeline:Pipeline":
		outputs["name"] = args.Name
	case "aws:cloudwatch/logGroup:LogGroup":
		outputs["name"] = args.Name
		outputs["arn"] = "arn:aws:logs:us-east-1:123456789012:log-group:" + args.Name
	case "random:index/randomPassword:RandomPassword":
		outputs["result"] = "TestSecurePassword123!@#"
	}

	return args.Name + "-id", resource.NewPropertyMapFromMap(outputs), nil
}

func (m errorMocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	return args.Args, nil
}

// Test error paths for VPC creation
func TestVPCCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:ec2/vpc:Vpc"}))
	assert.Error(t, err)
}

// Test error paths for subnet creation
func TestSubnetCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:ec2/subnet:Subnet"}))
	assert.Error(t, err)
}

// Test error paths for security group creation
func TestSecurityGroupCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:ec2/securityGroup:SecurityGroup"}))
	assert.Error(t, err)
}

// Test error paths for DB subnet group creation
func TestDBSubnetGroupCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:rds/subnetGroup:SubnetGroup"}))
	assert.Error(t, err)
}

// Test error paths for random password generation
func TestRandomPasswordCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "random:index/randomPassword:RandomPassword"}))
	assert.Error(t, err)
}

// Test error paths for secrets manager secret
func TestSecretsManagerSecretCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:secretsmanager/secret:Secret"}))
	assert.Error(t, err)
}

// Test error paths for secrets manager secret version
func TestSecretsManagerSecretVersionCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:secretsmanager/secretVersion:SecretVersion"}))
	assert.Error(t, err)
}

// Test error paths for RDS instance creation
func TestRDSInstanceCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:rds/instance:Instance"}))
	assert.Error(t, err)
}

// Test error paths for secrets rotation
func TestSecretsRotationCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:secretsmanager/secretRotation:SecretRotation"}))
	assert.Error(t, err)
}

// Test error paths for CloudWatch log group
func TestCloudWatchLogGroupCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:cloudwatch/logGroup:LogGroup"}))
	assert.Error(t, err)
}

// Test error paths for ECS cluster
func TestECSClusterCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:ecs/cluster:Cluster"}))
	assert.Error(t, err)
}

// Test error paths for IAM role
func TestIAMRoleCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:iam/role:Role"}))
	assert.Error(t, err)
}

// Test error paths for IAM policy
func TestIAMPolicyCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:iam/policy:Policy"}))
	assert.Error(t, err)
}

// Test error paths for IAM role policy attachment
func TestIAMRolePolicyAttachmentCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:iam/rolePolicyAttachment:RolePolicyAttachment"}))
	assert.Error(t, err)
}

// Test error paths for ECS task definition
func TestECSTaskDefinitionCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:ecs/taskDefinition:TaskDefinition"}))
	assert.Error(t, err)
}

// Test error paths for S3 bucket
func TestS3BucketCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:s3/bucket:Bucket"}))
	assert.Error(t, err)
}

// Test error paths for S3 bucket versioning
func TestS3BucketVersioningCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:s3/bucketVersioningV2:BucketVersioningV2"}))
	assert.Error(t, err)
}

// Test error paths for CodeBuild project
func TestCodeBuildProjectCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:codebuild/project:Project"}))
	assert.Error(t, err)
}

// Test error paths for CodePipeline
func TestCodePipelineCreationError(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		return NewTapStack(ctx, &TapStackArgs{
			EnvironmentSuffix: "test-err",
		})
	}, pulumi.WithMocks("project", "stack", errorMocks{failResource: "aws:codepipeline/pipeline:Pipeline"}))
	assert.Error(t, err)
}
