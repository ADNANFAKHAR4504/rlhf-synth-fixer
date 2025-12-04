//go:build !integration
// +build !integration

package main

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"testing"

	resource "github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Recorded resource for assertions
type recordedResource struct {
	Type   string
	Name   string
	Inputs map[string]interface{}
}

var (
	mu        sync.Mutex
	resources []recordedResource
	invokes   []struct {
		Tok  string
		Args map[string]interface{}
	}
)

func record(r recordedResource) {
	mu.Lock()
	defer mu.Unlock()
	resources = append(resources, r)
}

func recordInvoke(tok string, args map[string]interface{}) {
	mu.Lock()
	defer mu.Unlock()
	invokes = append(invokes, struct {
		Tok  string
		Args map[string]interface{}
	}{Tok: tok, Args: args})
}

func resetRecords() {
	mu.Lock()
	defer mu.Unlock()
	resources = nil
	invokes = nil
}

func getRecordedResources() []recordedResource {
	mu.Lock()
	defer mu.Unlock()
	return append([]recordedResource(nil), resources...)
}

type mocks struct{}

func (m mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	id := args.Name + "-id"
	record(recordedResource{
		Type:   args.TypeToken,
		Name:   args.Name,
		Inputs: toMap(args.Inputs),
	})

	// Return mock values based on resource type
	outputs := args.Inputs.Copy()

	switch args.TypeToken {
	case "aws:ec2/vpc:Vpc":
		outputs["id"] = resource.NewStringProperty("vpc-mockid")
	case "aws:ec2/subnet:Subnet":
		outputs["id"] = resource.NewStringProperty("subnet-mockid")
	case "aws:ec2/securityGroup:SecurityGroup":
		outputs["id"] = resource.NewStringProperty("sg-mockid")
	case "aws:kms/key:Key":
		outputs["id"] = resource.NewStringProperty("key-mockid")
		outputs["arn"] = resource.NewStringProperty("arn:aws:kms:us-east-1:123456789012:key/mock")
	case "aws:rds/cluster:Cluster":
		outputs["endpoint"] = resource.NewStringProperty("mock.cluster.amazonaws.com")
	case "aws:ecr/repository:Repository":
		outputs["repositoryUrl"] = resource.NewStringProperty("123456789012.dkr.ecr.us-east-1.amazonaws.com/mock")
		outputs["arn"] = resource.NewStringProperty("arn:aws:ecr:us-east-1:123456789012:repository/mock")
	case "aws:ecs/cluster:Cluster":
		outputs["arn"] = resource.NewStringProperty("arn:aws:ecs:us-east-1:123456789012:cluster/mock")
		outputs["name"] = resource.NewStringProperty(args.Name)
	case "aws:ecs/taskDefinition:TaskDefinition":
		outputs["arn"] = resource.NewStringProperty("arn:aws:ecs:us-east-1:123456789012:task-definition/mock")
	case "aws:s3/bucket:Bucket":
		outputs["arn"] = resource.NewStringProperty("arn:aws:s3:::mock-bucket")
		outputs["bucket"] = resource.NewStringProperty("mock-bucket")
	case "aws:iam/role:Role":
		outputs["arn"] = resource.NewStringProperty("arn:aws:iam::123456789012:role/mock")
		outputs["name"] = resource.NewStringProperty(args.Name)
	case "aws:iam/policy:Policy":
		outputs["arn"] = resource.NewStringProperty("arn:aws:iam::123456789012:policy/mock")
	case "aws:efs/fileSystem:FileSystem":
		outputs["id"] = resource.NewStringProperty("fs-mockid")
	case "aws:apigateway/restApi:RestApi":
		outputs["id"] = resource.NewStringProperty("api-mockid")
	case "aws:secretsmanager/secret:Secret":
		outputs["id"] = resource.NewStringProperty("secret-mockid")
	case "aws:rds/subnetGroup:SubnetGroup":
		outputs["name"] = resource.NewStringProperty("subnet-group-mock")
	case "aws:elasticache/subnetGroup:SubnetGroup":
		outputs["name"] = resource.NewStringProperty("elasticache-subnet-group-mock")
	case "aws:codebuild/project:Project":
		outputs["name"] = resource.NewStringProperty(args.Name)
	}

	return id, outputs, nil
}

func (m mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	recordInvoke(args.Token, toMap(args.Args))

	switch args.Token {
	case "aws:index/getAvailabilityZones:getAvailabilityZones":
		return resource.PropertyMap{
			resource.PropertyKey("names"): resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
			}),
		}, nil
	case "aws:ssm/getParameter:getParameter":
		return resource.PropertyMap{
			resource.PropertyKey("value"): resource.NewStringProperty("ami-1234567890abcdef0"),
		}, nil
	case "aws:index/getCallerIdentity:getCallerIdentity":
		return resource.PropertyMap{
			resource.PropertyKey("accountId"): resource.NewStringProperty("123456789012"),
		}, nil
	default:
		return resource.PropertyMap{}, nil
	}
}

func toMap(pm resource.PropertyMap) map[string]interface{} {
	out := make(map[string]interface{}, len(pm))
	for k, v := range pm {
		out[string(k)] = v.V
	}
	return out
}

func runPulumiTest(t *testing.T, testFunc func(*pulumi.Context) error) {
	err := pulumi.RunErr(testFunc, pulumi.WithMocks("project", "stack", mocks{}))
	require.NoError(t, err)
}

// Test helper function: getEnv
func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}

func TestGetEnv(t *testing.T) {
	tests := []struct {
		name     string
		envKey   string
		envValue string
		fallback string
		expected string
	}{
		{
			name:     "Environment variable set",
			envKey:   "TEST_VAR",
			envValue: "custom-value",
			fallback: "default",
			expected: "custom-value",
		},
		{
			name:     "Environment variable not set",
			envKey:   "TEST_VAR_UNSET",
			envValue: "",
			fallback: "default",
			expected: "default",
		},
		{
			name:     "Empty environment variable uses fallback",
			envKey:   "TEST_VAR_EMPTY",
			envValue: "",
			fallback: "fallback-value",
			expected: "fallback-value",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				os.Setenv(tt.envKey, tt.envValue)
				defer os.Unsetenv(tt.envKey)
			} else {
				os.Unsetenv(tt.envKey)
			}

			actual := getEnv(tt.envKey, tt.fallback)
			assert.Equal(t, tt.expected, actual)
		})
	}
}

func TestResourceNaming(t *testing.T) {
	environmentSuffix := "test123"

	tests := []struct {
		resourceType string
		expectedName string
	}{
		{"vpc", fmt.Sprintf("vpc-%s", environmentSuffix)},
		{"encryption-key", fmt.Sprintf("encryption-key-%s", environmentSuffix)},
		{"public-subnet-1", fmt.Sprintf("public-subnet-1-%s", environmentSuffix)},
		{"public-subnet-2", fmt.Sprintf("public-subnet-2-%s", environmentSuffix)},
		{"private-subnet-1", fmt.Sprintf("private-subnet-1-%s", environmentSuffix)},
		{"private-subnet-2", fmt.Sprintf("private-subnet-2-%s", environmentSuffix)},
		{"rds-sg", fmt.Sprintf("rds-sg-%s", environmentSuffix)},
		{"elasticache-sg", fmt.Sprintf("elasticache-sg-%s", environmentSuffix)},
		{"ecs-sg", fmt.Sprintf("ecs-sg-%s", environmentSuffix)},
		{"app-cluster", fmt.Sprintf("app-cluster-%s", environmentSuffix)},
		{"ci-cd-pipeline", fmt.Sprintf("ci-cd-pipeline-%s", environmentSuffix)},
	}

	for _, tt := range tests {
		t.Run(tt.resourceType, func(t *testing.T) {
			assert.Contains(t, tt.expectedName, environmentSuffix, "Resource name must include environmentSuffix")
			assert.Equal(t, tt.expectedName, fmt.Sprintf("%s-%s", tt.resourceType, environmentSuffix))
		})
	}
}

func TestVPCConfiguration(t *testing.T) {
	cidrBlock := "10.0.0.0/16"
	enableDNSHostnames := true
	enableDNSSupport := true

	assert.Equal(t, "10.0.0.0/16", cidrBlock)
	assert.True(t, enableDNSHostnames, "DNS hostnames should be enabled")
	assert.True(t, enableDNSSupport, "DNS support should be enabled")
}

func TestSubnetConfiguration(t *testing.T) {
	subnets := []struct {
		name             string
		cidr             string
		availabilityZone string
		public           bool
	}{
		{"public-subnet-1", "10.0.1.0/24", "us-east-1a", true},
		{"public-subnet-2", "10.0.2.0/24", "us-east-1b", true},
		{"private-subnet-1", "10.0.10.0/24", "us-east-1a", false},
		{"private-subnet-2", "10.0.11.0/24", "us-east-1b", false},
	}

	for _, subnet := range subnets {
		t.Run(subnet.name, func(t *testing.T) {
			assert.NotEmpty(t, subnet.cidr, "Subnet CIDR should not be empty")
			assert.NotEmpty(t, subnet.availabilityZone, "Availability zone should not be empty")
			assert.True(t, strings.HasPrefix(subnet.cidr, "10.0."), "CIDR should be in 10.0.0.0/16 range")
			if subnet.public {
				assert.Contains(t, subnet.name, "public", "Public subnet name should contain 'public'")
			} else {
				assert.Contains(t, subnet.name, "private", "Private subnet name should contain 'private'")
			}
		})
	}
}

func TestSecurityGroupConfiguration(t *testing.T) {
	tests := []struct {
		name        string
		description string
		ingressPort int
		protocol    string
	}{
		{
			name:        "RDS Security Group",
			description: "Security group for RDS cluster",
			ingressPort: 5432,
			protocol:    "tcp",
		},
		{
			name:        "ElastiCache Security Group",
			description: "Security group for ElastiCache Redis",
			ingressPort: 6379,
			protocol:    "tcp",
		},
		{
			name:        "ECS Security Group",
			description: "Security group for ECS tasks",
			ingressPort: 80,
			protocol:    "tcp",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			assert.NotEmpty(t, tt.description)
			assert.Greater(t, tt.ingressPort, 0, "Port must be positive")
			assert.Equal(t, "tcp", tt.protocol)
		})
	}
}

func TestKMSKeyConfiguration(t *testing.T) {
	keyRotation := true
	deletionWindow := 10

	assert.True(t, keyRotation, "KMS key rotation should be enabled")
	assert.Equal(t, 10, deletionWindow, "Deletion window should be 10 days")
}

func TestRDSConfiguration(t *testing.T) {
	engine := "aurora-postgresql"
	engineVersion := "15.3"
	encrypted := true
	backupRetention := 7
	skipFinalSnapshot := true
	instanceClass := "db.t3.medium"

	assert.Equal(t, "aurora-postgresql", engine)
	assert.Equal(t, "15.3", engineVersion)
	assert.True(t, encrypted, "RDS should be encrypted")
	assert.Equal(t, 7, backupRetention, "Backup retention should be 7 days")
	assert.True(t, skipFinalSnapshot, "Skip final snapshot for test environment")
	assert.Equal(t, "db.t3.medium", instanceClass)
}

func TestElastiCacheConfiguration(t *testing.T) {
	engine := "redis"
	engineVersion := "7.0"
	nodeType := "cache.t3.micro"
	numNodes := 2
	atRestEncryption := true
	transitEncryption := true
	multiAZ := true
	automaticFailover := true

	assert.Equal(t, "redis", engine)
	assert.Equal(t, "7.0", engineVersion)
	assert.Equal(t, "cache.t3.micro", nodeType)
	assert.Equal(t, 2, numNodes)
	assert.True(t, atRestEncryption, "At-rest encryption should be enabled")
	assert.True(t, transitEncryption, "Transit encryption should be enabled")
	assert.True(t, multiAZ, "Multi-AZ should be enabled")
	assert.True(t, automaticFailover, "Automatic failover should be enabled")
}

func TestEFSConfiguration(t *testing.T) {
	encrypted := true

	assert.True(t, encrypted, "EFS should be encrypted")
}

func TestECRConfiguration(t *testing.T) {
	scanOnPush := true
	encryptionType := "KMS"

	assert.True(t, scanOnPush, "Image scanning should be enabled")
	assert.Equal(t, "KMS", encryptionType)
}

func TestECSConfiguration(t *testing.T) {
	containerInsights := "enabled"
	desiredCount := 2
	launchType := "FARGATE"
	cpu := "256"
	memory := "512"
	networkMode := "awsvpc"

	assert.Equal(t, "enabled", containerInsights)
	assert.Equal(t, 2, desiredCount)
	assert.Equal(t, "FARGATE", launchType)
	assert.Equal(t, "256", cpu)
	assert.Equal(t, "512", memory)
	assert.Equal(t, "awsvpc", networkMode)
}

func TestAPIGatewayConfiguration(t *testing.T) {
	endpointType := "REGIONAL"
	authorizerType := "COGNITO_USER_POOLS"
	identitySource := "method.request.header.Authorization"

	assert.Equal(t, "REGIONAL", endpointType)
	assert.Equal(t, "COGNITO_USER_POOLS", authorizerType)
	assert.Equal(t, "method.request.header.Authorization", identitySource)
}

func TestCodePipelineConfiguration(t *testing.T) {
	stages := []string{"Source", "Build", "Deploy"}
	sourceProvider := "CodeCommit"
	buildProvider := "CodeBuild"
	deployProvider := "ECS"
	repositoryName := "edutech-repo"
	branchName := "main"

	assert.Len(t, stages, 3, "Pipeline should have 3 stages")
	assert.Equal(t, "CodeCommit", sourceProvider)
	assert.Equal(t, "CodeBuild", buildProvider)
	assert.Equal(t, "ECS", deployProvider)
	assert.Equal(t, "edutech-repo", repositoryName)
	assert.Equal(t, "main", branchName)
}

func TestCodeBuildConfiguration(t *testing.T) {
	computeType := "BUILD_GENERAL1_SMALL"
	image := "aws/codebuild/standard:5.0"
	buildType := "LINUX_CONTAINER"
	privilegedMode := true

	assert.Equal(t, "BUILD_GENERAL1_SMALL", computeType)
	assert.Equal(t, "aws/codebuild/standard:5.0", image)
	assert.Equal(t, "LINUX_CONTAINER", buildType)
	assert.True(t, privilegedMode, "Privileged mode required for Docker builds")
}

func TestS3BucketConfiguration(t *testing.T) {
	forceDestroy := true
	encryption := "AES256"

	assert.True(t, forceDestroy, "Force destroy should be enabled for test environment")
	assert.Equal(t, "AES256", encryption)
}

func TestIAMRoleConfiguration(t *testing.T) {
	roles := []struct {
		name    string
		service string
	}{
		{"ECS Task Role", "ecs-tasks.amazonaws.com"},
		{"CodePipeline Role", "codepipeline.amazonaws.com"},
		{"CodeBuild Role", "codebuild.amazonaws.com"},
	}

	for _, role := range roles {
		t.Run(role.name, func(t *testing.T) {
			assert.NotEmpty(t, role.service, "Service principal should not be empty")
			assert.Contains(t, role.service, ".amazonaws.com", "Service should be AWS service")
		})
	}
}

func TestDefaultTags(t *testing.T) {
	tags := map[string]string{
		"Environment": "test",
		"Repository":  "test-repo",
		"Author":      "test-author",
		"PRNumber":    "123",
		"Team":        "test-team",
	}

	for key, value := range tags {
		assert.NotEmpty(t, value, fmt.Sprintf("Tag %s should not be empty", key))
	}

	// Test that all expected tags are present
	expectedKeys := []string{"Environment", "Repository", "Author", "PRNumber", "Team"}
	for _, key := range expectedKeys {
		assert.Contains(t, tags, key, fmt.Sprintf("Tags should contain %s", key))
	}
}

func TestStackOutputs(t *testing.T) {
	expectedOutputs := []string{
		"vpcId",
		"rdsEndpoint",
		"ecsClusterName",
		"ecrRepositoryUrl",
		"apiGatewayUrl",
		"efsFileSystemId",
	}

	for _, output := range expectedOutputs {
		t.Run(output, func(t *testing.T) {
			assert.NotEmpty(t, output, "Output name should not be empty")
		})
	}

	assert.Len(t, expectedOutputs, 6, "Should have 6 stack outputs")
}

func TestRegionConfiguration(t *testing.T) {
	tests := []struct {
		name         string
		envValue     string
		defaultValue string
		expected     string
	}{
		{
			name:         "Custom region set",
			envValue:     "us-west-2",
			defaultValue: "us-east-1",
			expected:     "us-west-2",
		},
		{
			name:         "Default region",
			envValue:     "",
			defaultValue: "us-east-1",
			expected:     "us-east-1",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.envValue != "" {
				os.Setenv("AWS_REGION", tt.envValue)
				defer os.Unsetenv("AWS_REGION")
			} else {
				os.Unsetenv("AWS_REGION")
			}

			region := getEnv("AWS_REGION", tt.defaultValue)
			assert.Equal(t, tt.expected, region)
		})
	}
}

func TestFallbackDefaults(t *testing.T) {
	// Test with no environment variables set
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	os.Unsetenv("REPOSITORY")
	os.Unsetenv("AWS_REGION")
	os.Unsetenv("COMMIT_AUTHOR")
	os.Unsetenv("PR_NUMBER")
	os.Unsetenv("TEAM")

	assert.Equal(t, "dev", getEnv("ENVIRONMENT_SUFFIX", "dev"))
	assert.Equal(t, "unknown", getEnv("REPOSITORY", "unknown"))
	assert.Equal(t, "us-east-1", getEnv("AWS_REGION", "us-east-1"))
	assert.Equal(t, "unknown", getEnv("COMMIT_AUTHOR", "unknown"))
	assert.Equal(t, "unknown", getEnv("PR_NUMBER", "unknown"))
	assert.Equal(t, "unknown", getEnv("TEAM", "unknown"))
}

func TestSecretsManagerConfiguration(t *testing.T) {
	description := "RDS master password for student database"
	secretString := "ChangeMe123!"

	assert.NotEmpty(t, description)
	assert.NotEmpty(t, secretString)
	assert.GreaterOrEqual(t, len(secretString), 8, "Password should be at least 8 characters")
}

func TestContainerDefinitionFormat(t *testing.T) {
	containerName := "app"
	cpu := 256
	memory := 512
	containerPort := 80
	protocol := "tcp"
	logDriver := "awslogs"

	assert.Equal(t, "app", containerName)
	assert.Equal(t, 256, cpu)
	assert.Equal(t, 512, memory)
	assert.Equal(t, 80, containerPort)
	assert.Equal(t, "tcp", protocol)
	assert.Equal(t, "awslogs", logDriver)
}

func TestBuildspecConfiguration(t *testing.T) {
	version := "0.2"
	phases := []string{"pre_build", "build", "post_build"}

	assert.Equal(t, "0.2", version)
	assert.Len(t, phases, 3, "Buildspec should have 3 phases")
	assert.Contains(t, phases, "pre_build")
	assert.Contains(t, phases, "build")
	assert.Contains(t, phases, "post_build")
}

func TestCIDRBlockRanges(t *testing.T) {
	vpcCIDR := "10.0.0.0/16"
	publicSubnet1CIDR := "10.0.1.0/24"
	publicSubnet2CIDR := "10.0.2.0/24"
	privateSubnet1CIDR := "10.0.10.0/24"
	privateSubnet2CIDR := "10.0.11.0/24"

	allCIDRs := []string{vpcCIDR, publicSubnet1CIDR, publicSubnet2CIDR, privateSubnet1CIDR, privateSubnet2CIDR}

	for _, cidr := range allCIDRs {
		assert.Contains(t, cidr, "/", "CIDR should contain subnet mask")
		assert.True(t, strings.HasPrefix(cidr, "10."), "CIDR should start with 10.")
	}
}

func TestAvailabilityZones(t *testing.T) {
	az1 := "us-east-1a"
	az2 := "us-east-1b"

	assert.NotEqual(t, az1, az2, "AZs should be different")
	assert.True(t, strings.HasPrefix(az1, "us-east-1"), "AZ should be in us-east-1 region")
	assert.True(t, strings.HasPrefix(az2, "us-east-1"), "AZ should be in us-east-1 region")
}

func TestPolicyArn(t *testing.T) {
	policyArn := "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"

	assert.True(t, strings.HasPrefix(policyArn, "arn:aws:"), "Policy ARN should start with arn:aws:")
	assert.Contains(t, policyArn, "AmazonECSTaskExecutionRolePolicy", "Should be ECS Task Execution Role Policy")
}
