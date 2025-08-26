package main

import (
	"fmt"
	"os"
	"strings"
	"sync"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks struct{}

func (mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	if strings.HasPrefix(args.Name, "fail") {
		return "", nil, fmt.Errorf("mocked failure for %s", args.Name)
	}
	outs := args.Inputs

	switch string(args.TypeToken) {
	case "aws:cloudfront/distribution:Distribution":
		outs["domainName"] = resource.NewStringProperty("mock-distribution-domain.example.com")
		outs["arn"] = resource.NewStringProperty("arn:aws:cloudfront::123456789012:distribution/" + args.Name)
	case "aws:ec2/vpc:Vpc":
		outs["cidrBlock"] = resource.NewStringProperty("10.0.0.0/16")
	case "aws:iam/role:Role":
		outs["arn"] = resource.NewStringProperty("arn:aws:iam::mock:role/" + args.Name)
		outs["name"] = resource.NewStringProperty(args.Name)
	case "aws:iam/rolePolicy:RolePolicy":
		outs["role"] = resource.NewStringProperty(args.Name + "-role")
	case "aws:iam/instanceProfile:InstanceProfile":
		outs["role"] = resource.NewStringProperty(args.Name + "-profile")
	case "aws:s3/bucket:Bucket":
		outs["bucket"] = resource.NewStringProperty(args.Name + "-bucket")
		outs["arn"] = resource.NewStringProperty("arn:aws:s3:::" + args.Name + "-bucket")
		outs["bucketDomainName"] = resource.NewStringProperty(args.Name + "-bucket.s3.amazonaws.com")
	case "aws:kms/key:Key":
		outs["arn"] = resource.NewStringProperty("arn:aws:kms:us-east-1:123456789012:key/" + args.Name)
		outs["keyId"] = resource.NewStringProperty(args.Name + "-key-id")
	case "aws:rds/instance:Instance":
		outs["endpoint"] = resource.NewStringProperty(args.Name + ".cluster-xyz.us-east-1.rds.amazonaws.com")
	case "aws:rds/subnetGroup:SubnetGroup":
		outs["name"] = resource.NewStringProperty(args.Name + "-subnet-group")
	case "aws:cloudwatch/logGroup:LogGroup":
		outs["name"] = resource.NewStringProperty("/aws/lambda/" + args.Name)
	case "aws:cloudwatch/dashboard:Dashboard":
		outs["dashboardName"] = resource.NewStringProperty(args.Name + "-dashboard")
	}

	outs["__type"] = resource.NewStringProperty(string(args.TypeToken))
	return args.Name + "_id", outs, nil
}

func (mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	if args.Token == "aws:index/getAvailabilityZones:getAvailabilityZones" {
		return resource.PropertyMap{
			"names": resource.NewArrayProperty([]resource.PropertyValue{
				resource.NewStringProperty("us-east-1a"),
				resource.NewStringProperty("us-east-1b"),
				resource.NewStringProperty("us-east-1c"),
			}),
		}, nil
	}
	return resource.PropertyMap{}, nil
}

func baseConfig() InfrastructureConfig {
	return InfrastructureConfig{
		Environment:        "test",
		Regions:            []string{"us-east-1", "us-west-2"},
		InstanceType:       "t3.micro",
		DBInstanceClass:    "db.t3.micro",
		DBAllocatedStorage: 20,
		BackupRetention:    7,
		MultiAZ:            false,
		EnableInsights:     false,
		Tags: map[string]string{
			"Owner":   "unit-test",
			"Purpose": "test-suite",
		},
	}
}

func TestFullDeployExportsOutputs(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		err := infra.Deploy()
		assert.NoError(t, err)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestSeparateBucketsCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, _ := infra.CreateKMSKey()
		staticBucket, err := infra.CreateS3Bucket(key)
		assert.NoError(t, err)
		cloudtrailBucket, err := infra.CreateCloudTrailBucket(key)
		assert.NoError(t, err)
		assert.NotNil(t, staticBucket)
		assert.NotNil(t, cloudtrailBucket)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestIAMRolesExistAndHaveARNs(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		assert.NoError(t, err)
		ec2Role, rdsRole := roles["ec2"], roles["rds"]
		assert.NotNil(t, ec2Role)
		assert.NotNil(t, rdsRole)

		var wg sync.WaitGroup
		wg.Add(2)
		_ = ec2Role.Arn.ApplyT(func(arn interface{}) error {
			assert.Contains(t, arn.(string), "arn:aws:iam")
			wg.Done()
			return nil
		})
		_ = rdsRole.Arn.ApplyT(func(arn interface{}) error {
			assert.Contains(t, arn.(string), "arn:aws:iam")
			wg.Done()
			return nil
		})
		wg.Wait()
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestIAMRolePolicyAttachment(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, err := infra.CreateIAMResources()
		assert.NoError(t, err)
		ec2Role := roles["ec2"]
		assert.NotNil(t, ec2Role)
		var name string
		var wg sync.WaitGroup
		wg.Add(1)
		_ = ec2Role.Name.ApplyT(func(n interface{}) error {
			name = n.(string)
			wg.Done()
			return nil
		})
		wg.Wait()
		assert.Contains(t, name, "ec2-role")
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestEachRegionResources(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Regions = []string{"us-east-1", "us-west-2"}
		infra := NewMultiRegionInfrastructure(ctx, config)
		roles, _ := infra.CreateIAMResources()
		for _, region := range config.Regions {
			resources, err := infra.DeployRegionalResources(region, roles)
			assert.NoError(t, err)
			assert.Contains(t, resources, "vpcId")
			assert.Contains(t, resources, "rdsInstanceId")
			assert.Contains(t, resources, "kmsKeyId")
			assert.Contains(t, resources, "dashboardName")
		}
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestCreateKMSKeyDescription(t *testing.T) {
	var description string
	var wg sync.WaitGroup
	wg.Add(1)
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, err := infra.CreateKMSKey()
		assert.NoError(t, err)
		_ = key.Description.ApplyT(func(desc interface{}) error {
			if s, ok := desc.(string); ok {
				description = s
			}
			wg.Done()
			return nil
		})
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
	wg.Wait()
	assert.Contains(t, description, "Multi-region infrastructure encryption key")
}

func TestCreateS3BucketWithTags(t *testing.T) {
	var tags map[string]string
	var wg sync.WaitGroup
	wg.Add(1)
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, _ := infra.CreateKMSKey()
		bucket, err := infra.CreateS3Bucket(key)
		assert.NoError(t, err)
		_ = bucket.Tags.ApplyT(func(ts interface{}) error {
			if m, ok := ts.(map[string]string); ok {
				tags = m
			} else if m, ok := ts.(map[string]interface{}); ok {
				tags = make(map[string]string)
				for k, v := range m {
					if str, ok := v.(string); ok {
						tags[k] = str
					}
				}
			}
			wg.Done()
			return nil
		})
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
	wg.Wait()
	assert.Equal(t, "unit-test", tags["Owner"])
	assert.Equal(t, "test-suite", tags["Purpose"])
	assert.Equal(t, "multi-region-infrastructure", tags["purpose"])
	assert.Equal(t, "pulumi", tags["managed-by"])
}

func TestCreateCloudFrontDistribution(t *testing.T) {
	var domainName string
	var wg sync.WaitGroup
	wg.Add(1)
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, _ := infra.CreateKMSKey()
		bucket, _ := infra.CreateS3Bucket(key)
		dist, err := infra.CreateCloudFrontDistribution(bucket)
		assert.NoError(t, err)
		_ = dist.DomainName.ApplyT(func(val interface{}) error {
			if s, ok := val.(string); ok {
				domainName = s
			}
			wg.Done()
			return nil
		})
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
	wg.Wait()
	assert.Equal(t, "mock-distribution-domain.example.com", domainName)
}

func TestCloudTrailBucketCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, _ := infra.CreateKMSKey()
		bucket, err := infra.CreateCloudTrailBucket(key)
		assert.NoError(t, err)
		assert.NotNil(t, bucket)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestCloudTrailCreation(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, _ := infra.CreateKMSKey()
		cloudtrailBucket, _ := infra.CreateCloudTrailBucket(key)
		err := infra.CreateCloudTrail(cloudtrailBucket)
		assert.NoError(t, err)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestCloudTrailBucketEncryption(t *testing.T) {
	var tags map[string]string
	var wg sync.WaitGroup
	wg.Add(1)
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		key, _ := infra.CreateKMSKey()
		bucket, err := infra.CreateCloudTrailBucket(key)
		assert.NoError(t, err)
		_ = bucket.Tags.ApplyT(func(ts interface{}) error {
			if m, ok := ts.(map[string]string); ok {
				tags = m
			} else if m, ok := ts.(map[string]interface{}); ok {
				tags = make(map[string]string)
				for k, v := range m {
					if str, ok := v.(string); ok {
						tags[k] = str
					}
				}
			}
			wg.Done()
			return nil
		})
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
	wg.Wait()
	assert.Equal(t, "unit-test", tags["Owner"])
	assert.Equal(t, "test-suite", tags["Purpose"])
}

func TestDeployRegionalResourcesAllKeys(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		infra := NewMultiRegionInfrastructure(ctx, baseConfig())
		roles, _ := infra.CreateIAMResources()
		resources, err := infra.DeployRegionalResources("us-east-1", roles)
		assert.NoError(t, err)
		expectedKeys := []string{
			"vpcId", "kmsKeyId", "kmsKeyArn", "rdsInstanceId", "rdsEndpoint",
			"dbSubnetGroupName", "dbSecurityGroupId", "logGroupName", "dashboardName",
			"publicSubnet1Id", "publicSubnet2Id", "privateSubnet1Id", "privateSubnet2Id",
		}
		for _, k := range expectedKeys {
			assert.Contains(t, resources, k)
		}
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestInfrastructureConfigValidation(t *testing.T) {
	t.Run("should handle empty regions", func(t *testing.T) {
		config := baseConfig()
		config.Regions = []string{}
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			infra := NewMultiRegionInfrastructure(ctx, config)
			assert.NotNil(t, infra)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})

	t.Run("should handle nil tags", func(t *testing.T) {
		config := baseConfig()
		config.Tags = nil
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			infra := NewMultiRegionInfrastructure(ctx, config)
			assert.NotNil(t, infra)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})

	t.Run("should handle production config", func(t *testing.T) {
		config := baseConfig()
		config.Environment = "prod"
		config.Regions = []string{"us-east-1", "us-west-2", "eu-west-1"}
		config.DBInstanceClass = "db.r5.large"
		config.DBAllocatedStorage = 100
		config.BackupRetention = 30
		config.MultiAZ = true
		config.EnableInsights = true
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			infra := NewMultiRegionInfrastructure(ctx, config)
			assert.NotNil(t, infra)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})
}

func TestMultipleRegionsDeployment(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Regions = []string{"us-east-1", "us-west-2", "eu-west-1"}
		infra := NewMultiRegionInfrastructure(ctx, config)
		roles, _ := infra.CreateIAMResources()
		for _, region := range config.Regions {
			resources, err := infra.DeployRegionalResources(region, roles)
			assert.NoError(t, err)
			assert.NotEmpty(t, resources)
		}
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestTagMerging(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := baseConfig()
		config.Tags = map[string]string{
			"CustomTag": "CustomValue",
			"purpose":   "override-purpose",
		}
		infra := NewMultiRegionInfrastructure(ctx, config)
		assert.NotNil(t, infra)
		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestErrorHandling(t *testing.T) {
	t.Run("should handle invalid region", func(t *testing.T) {
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			infra := NewMultiRegionInfrastructure(ctx, baseConfig())
			roles, _ := infra.CreateIAMResources()
			resources, err := infra.DeployRegionalResources("invalid-region", roles)
			assert.NoError(t, err)
			assert.NotEmpty(t, resources)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})
}

func TestNewMultiRegionInfrastructureConstructor(t *testing.T) {
	t.Run("should create with minimal config", func(t *testing.T) {
		config := InfrastructureConfig{
			Environment: "minimal",
			Regions:     []string{"us-east-1"},
		}
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			infra := NewMultiRegionInfrastructure(ctx, config)
			assert.NotNil(t, infra)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})

	t.Run("should create with full config", func(t *testing.T) {
		config := InfrastructureConfig{
			Environment:        "full",
			Regions:            []string{"us-east-1", "us-west-2", "eu-west-1"},
			InstanceType:       "t3.large",
			DBInstanceClass:    "db.r5.xlarge",
			DBAllocatedStorage: 500,
			BackupRetention:    30,
			MultiAZ:            true,
			EnableInsights:     true,
			Tags: map[string]string{
				"Team":        "platform",
				"Environment": "production",
				"CostCenter":  "engineering",
			},
		}
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			infra := NewMultiRegionInfrastructure(ctx, config)
			assert.NotNil(t, infra)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})
}

// Test main function logic by simulating environment variables
func TestMainFunctionLogic(t *testing.T) {
	// Save original environment variables
	originalEnv := os.Getenv("ENVIRONMENT_SUFFIX")
	originalRepo := os.Getenv("REPOSITORY")
	originalAuthor := os.Getenv("COMMIT_AUTHOR")

	// Test with empty environment variables (default values)
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	os.Unsetenv("REPOSITORY")
	os.Unsetenv("COMMIT_AUTHOR")

	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		env := os.Getenv("ENVIRONMENT_SUFFIX")
		if env == "" {
			env = "dev"
		}

		repo := os.Getenv("REPOSITORY")
		if repo == "" {
			repo = "unknown"
		}

		author := os.Getenv("COMMIT_AUTHOR")
		if author == "" {
			author = "unknown"
		}

		tags := map[string]string{
			"Environment": env,
			"Repository":  repo,
			"Author":      author,
		}

		config := InfrastructureConfig{
			Environment:        env,
			Regions:            []string{"us-east-1", "us-west-2", "eu-west-1"},
			InstanceType:       "t3.medium",
			DBInstanceClass:    "db.t3.micro",
			DBAllocatedStorage: 20,
			BackupRetention:    7,
			MultiAZ:            true,
			EnableInsights:     true,
			Tags:               tags,
		}

		infrastructure := NewMultiRegionInfrastructure(ctx, config)
		return infrastructure.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)

	// Test with set environment variables
	os.Setenv("ENVIRONMENT_SUFFIX", "test-env")
	os.Setenv("REPOSITORY", "test-repo")
	os.Setenv("COMMIT_AUTHOR", "test-author")

	err = pulumi.RunErr(func(ctx *pulumi.Context) error {
		env := os.Getenv("ENVIRONMENT_SUFFIX")
		if env == "" {
			env = "dev"
		}

		repo := os.Getenv("REPOSITORY")
		if repo == "" {
			repo = "unknown"
		}

		author := os.Getenv("COMMIT_AUTHOR")
		if author == "" {
			author = "unknown"
		}

		tags := map[string]string{
			"Environment": env,
			"Repository":  repo,
			"Author":      author,
		}

		config := InfrastructureConfig{
			Environment:        env,
			Regions:            []string{"us-east-1", "us-west-2", "eu-west-1"},
			InstanceType:       "t3.medium",
			DBInstanceClass:    "db.t3.micro",
			DBAllocatedStorage: 20,
			BackupRetention:    7,
			MultiAZ:            true,
			EnableInsights:     true,
			Tags:               tags,
		}

		infrastructure := NewMultiRegionInfrastructure(ctx, config)
		return infrastructure.Deploy()
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)

	// Restore original environment variables
	if originalEnv != "" {
		os.Setenv("ENVIRONMENT_SUFFIX", originalEnv)
	} else {
		os.Unsetenv("ENVIRONMENT_SUFFIX")
	}
	if originalRepo != "" {
		os.Setenv("REPOSITORY", originalRepo)
	} else {
		os.Unsetenv("REPOSITORY")
	}
	if originalAuthor != "" {
		os.Setenv("COMMIT_AUTHOR", originalAuthor)
	} else {
		os.Unsetenv("COMMIT_AUTHOR")
	}
}

// Additional comprehensive tests to cover all code paths
func TestCompleteInfrastructureDeployment(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		config := InfrastructureConfig{
			Environment:        "comprehensive-test",
			Regions:            []string{"us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"},
			InstanceType:       "t3.large",
			DBInstanceClass:    "db.r5.large",
			DBAllocatedStorage: 200,
			BackupRetention:    30,
			MultiAZ:            true,
			EnableInsights:     true,
			Tags: map[string]string{
				"Environment": "production",
				"Team":        "infrastructure",
				"Project":     "multi-region-app",
				"CostCenter":  "engineering",
			},
		}

		infra := NewMultiRegionInfrastructure(ctx, config)

		// Test individual components
		key, err := infra.CreateKMSKey()
		assert.NoError(t, err)
		assert.NotNil(t, key)

		bucket, err := infra.CreateS3Bucket(key)
		assert.NoError(t, err)
		assert.NotNil(t, bucket)

		distribution, err := infra.CreateCloudFrontDistribution(bucket)
		assert.NoError(t, err)
		assert.NotNil(t, distribution)

		roles, err := infra.CreateIAMResources()
		assert.NoError(t, err)
		assert.Contains(t, roles, "ec2")
		assert.Contains(t, roles, "rds")

		cloudtrailBucket, err := infra.CreateCloudTrailBucket(key)
		assert.NoError(t, err)
		assert.NotNil(t, cloudtrailBucket)

		err = infra.CreateCloudTrail(cloudtrailBucket)
		assert.NoError(t, err)

		// Test regional deployment for all regions
		for _, region := range config.Regions {
			resources, err := infra.DeployRegionalResources(region, roles)
			assert.NoError(t, err)
			assert.NotEmpty(t, resources)

			// Verify all expected resources are present
			expectedKeys := []string{
				"vpcId", "kmsKeyId", "kmsKeyArn", "rdsInstanceId", "rdsEndpoint",
				"dbSubnetGroupName", "dbSecurityGroupId", "logGroupName", "dashboardName",
				"publicSubnet1Id", "publicSubnet2Id", "privateSubnet1Id", "privateSubnet2Id",
			}
			for _, key := range expectedKeys {
				assert.Contains(t, resources, key, "Missing resource key: %s for region: %s", key, region)
			}
		}

		// Test complete deployment
		err = infra.Deploy()
		assert.NoError(t, err)

		return nil
	}, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

// Test edge cases and boundary conditions
func TestEdgeCasesAndBoundaryConditions(t *testing.T) {
	t.Run("single region deployment", func(t *testing.T) {
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			config := baseConfig()
			config.Regions = []string{"us-east-1"}
			infra := NewMultiRegionInfrastructure(ctx, config)
			err := infra.Deploy()
			assert.NoError(t, err)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})

	t.Run("maximum configuration", func(t *testing.T) {
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			config := InfrastructureConfig{
				Environment:        "max-config",
				Regions:            []string{"us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1", "ca-central-1"},
				InstanceType:       "m5.24xlarge",
				DBInstanceClass:    "db.r5.24xlarge",
				DBAllocatedStorage: 65536,
				BackupRetention:    35,
				MultiAZ:            true,
				EnableInsights:     true,
				Tags: map[string]string{
					"Environment":     "production",
					"Team":            "platform",
					"Project":         "enterprise-app",
					"CostCenter":      "engineering",
					"Compliance":      "required",
					"DataClass":       "confidential",
					"BackupRequired":  "true",
					"MonitoringLevel": "enhanced",
				},
			}
			infra := NewMultiRegionInfrastructure(ctx, config)
			err := infra.Deploy()
			assert.NoError(t, err)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})

	t.Run("minimal configuration", func(t *testing.T) {
		err := pulumi.RunErr(func(ctx *pulumi.Context) error {
			config := InfrastructureConfig{
				Environment: "minimal",
				Regions:     []string{"us-east-1"},
			}
			infra := NewMultiRegionInfrastructure(ctx, config)
			err := infra.Deploy()
			assert.NoError(t, err)
			return nil
		}, pulumi.WithMocks("proj", "stack", mocks{}))
		assert.NoError(t, err)
	})
}
