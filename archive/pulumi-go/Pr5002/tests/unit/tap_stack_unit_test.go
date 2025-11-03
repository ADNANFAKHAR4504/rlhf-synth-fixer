//go:build !integration
// +build !integration

package main

import (
	"os"
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/elasticache"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/rds"
	"github.com/pulumi/pulumi/sdk/v3/go/common/resource"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

type mocks struct{}

// Mock AWS resource creation
func (m *mocks) NewResource(args pulumi.MockResourceArgs) (string, resource.PropertyMap, error) {
	outputs := args.Inputs.Copy()
	return args.Name + "_id", outputs, nil
}

// Mock AWS API calls
func (m *mocks) Call(args pulumi.MockCallArgs) (resource.PropertyMap, error) {
	switch args.Token {
	case "aws:ec2/getVpc:getVpc":
		return resource.PropertyMap{
			"id":        resource.NewStringProperty("vpc-12345"),
			"cidrBlock": resource.NewStringProperty("172.31.0.0/16"),
		}, nil
	case "aws:ec2/getInternetGateway:getInternetGateway":
		return resource.PropertyMap{
			"id": resource.NewStringProperty("igw-12345"),
		}, nil
	}
	return args.Args, nil
}

func TestCreateKMSKey(t *testing.T) {
	tests := []struct {
		name     string
		envValue string
		want     map[string]interface{}
	}{
		{
			name:     "With environment suffix set",
			envValue: "test",
			want: map[string]interface{}{
				"description":          "KMS key for patient data encryption",
				"deletionWindowInDays": 7,
				"enableKeyRotation":    true,
				"tags": map[string]string{
					"Name":        "patient-data-key-test",
					"Environment": "test",
					"Compliance":  "HIPAA",
				},
			},
		},
		{
			name:     "Without environment suffix",
			envValue: "",
			want: map[string]interface{}{
				"description":          "KMS key for patient data encryption",
				"deletionWindowInDays": 7,
				"enableKeyRotation":    true,
				"tags": map[string]string{
					"Name":        "patient-data-key-dev",
					"Environment": "dev",
					"Compliance":  "HIPAA",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				// Set environment for the test
				if tt.envValue != "" {
					os.Setenv("ENVIRONMENT_SUFFIX", tt.envValue)
					defer os.Unsetenv("ENVIRONMENT_SUFFIX")
				}

				key, err := kms.NewKey(ctx, "test-key", &kms.KeyArgs{
					Description:          pulumi.String("KMS key for patient data encryption"),
					DeletionWindowInDays: pulumi.Int(7),
					EnableKeyRotation:    pulumi.Bool(true),
					Tags: pulumi.StringMap{
						"Name":        pulumi.String("patient-data-key-" + tt.envValue),
						"Environment": pulumi.String(tt.envValue),
						"Compliance":  pulumi.String("HIPAA"),
					},
				})

				assert.NoError(t, err)
				assert.NotNil(t, key)
				return nil
			}, pulumi.WithMocks("test-project", "test-stack", &mocks{}))

			assert.NoError(t, err)
		})
	}
}

func TestCreateSubnets(t *testing.T) {
	err := pulumi.RunErr(func(ctx *pulumi.Context) error {
		subnet1, err := ec2.NewSubnet(ctx, "test-subnet-1", &ec2.SubnetArgs{
			VpcId:               pulumi.String("vpc-12345"),
			CidrBlock:           pulumi.String("172.31.80.0/24"),
			AvailabilityZone:    pulumi.String("sa-east-1a"),
			MapPublicIpOnLaunch: pulumi.Bool(true),
			Tags: pulumi.StringMap{
				"Name":        pulumi.String("test-subnet-1"),
				"Environment": pulumi.String("test"),
			},
		})

		assert.NoError(t, err)
		assert.NotNil(t, subnet1)
		return nil
	}, pulumi.WithMocks("test-project", "test-stack", &mocks{}))

	assert.NoError(t, err)
}

func TestCreateRedisCluster(t *testing.T) {
	tests := []struct {
		name     string
		envValue string
		want     map[string]interface{}
	}{
		{
			name:     "Redis Cluster Configuration",
			envValue: "test",
			want: map[string]interface{}{
				"engine":               "redis",
				"engineVersion":        "6.x",
				"nodeType":             "cache.t3.micro",
				"numCacheNodes":        3,
				"parameterGroupFamily": "redis6.x",
				"port":                 6379,
				"tags": map[string]string{
					"Name":        "patient-redis-test",
					"Environment": "test",
					"Compliance":  "HIPAA",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				if tt.envValue != "" {
					os.Setenv("ENVIRONMENT_SUFFIX", tt.envValue)
					defer os.Unsetenv("ENVIRONMENT_SUFFIX")
				}

				// Create Redis parameter group
				paramGroup, err := elasticache.NewParameterGroup(ctx, "test-redis-params", &elasticache.ParameterGroupArgs{
					Family: pulumi.String("redis6.x"),
					Parameters: elasticache.ParameterGroupParameterArray{
						&elasticache.ParameterGroupParameterArgs{
							Name:  pulumi.String("maxmemory-policy"),
							Value: pulumi.String("allkeys-lru"),
						},
					},
				})
				assert.NoError(t, err)
				assert.NotNil(t, paramGroup)

				// Create Redis subnet group
				subnetGroup, err := elasticache.NewSubnetGroup(ctx, "test-redis-subnet", &elasticache.SubnetGroupArgs{
					SubnetIds: pulumi.StringArray{
						pulumi.String("subnet-12345"),
						pulumi.String("subnet-67890"),
					},
				})
				assert.NoError(t, err)
				assert.NotNil(t, subnetGroup)

				// Create Redis cluster
				cluster, err := elasticache.NewCluster(ctx, "test-redis", &elasticache.ClusterArgs{
					Engine:             pulumi.String("redis"),
					EngineVersion:      pulumi.String("6.x"),
					NodeType:           pulumi.String("cache.t3.micro"),
					NumCacheNodes:      pulumi.Int(3),
					ParameterGroupName: paramGroup.Name,
					Port:               pulumi.Int(6379),
					SubnetGroupName:    subnetGroup.Name,
					SecurityGroupIds:   pulumi.StringArray{pulumi.String("sg-12345")},
					Tags: pulumi.StringMap{
						"Name":        pulumi.String("patient-redis-" + tt.envValue),
						"Environment": pulumi.String(tt.envValue),
						"Compliance":  pulumi.String("HIPAA"),
					},
				})

				assert.NoError(t, err)
				assert.NotNil(t, cluster)
				return nil
			}, pulumi.WithMocks("test-project", "test-stack", &mocks{}))

			assert.NoError(t, err)
		})
	}
}

func TestCreateAuroraCluster(t *testing.T) {
	tests := []struct {
		name     string
		envValue string
		want     map[string]interface{}
	}{
		{
			name:     "Aurora Cluster Configuration",
			envValue: "test",
			want: map[string]interface{}{
				"engine":                "aurora-postgresql",
				"engineVersion":         "13.7",
				"databaseName":          "patient_records",
				"masterUsername":        "admin",
				"instanceClass":         "db.r5.large",
				"backupRetentionPeriod": 7,
				"copyTagsToSnapshot":    true,
				"storageEncrypted":      true,
				"tags": map[string]string{
					"Name":        "patient-aurora-test",
					"Environment": "test",
					"Compliance":  "HIPAA",
				},
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := pulumi.RunErr(func(ctx *pulumi.Context) error {
				if tt.envValue != "" {
					os.Setenv("ENVIRONMENT_SUFFIX", tt.envValue)
					defer os.Unsetenv("ENVIRONMENT_SUFFIX")
				}

				// Create DB subnet group
				dbSubnetGroup, err := rds.NewSubnetGroup(ctx, "test-aurora-subnet", &rds.SubnetGroupArgs{
					SubnetIds: pulumi.StringArray{
						pulumi.String("subnet-12345"),
						pulumi.String("subnet-67890"),
					},
					Tags: pulumi.StringMap{
						"Name":        pulumi.String("aurora-subnet-" + tt.envValue),
						"Environment": pulumi.String(tt.envValue),
					},
				})
				assert.NoError(t, err)
				assert.NotNil(t, dbSubnetGroup)

				// Create Aurora cluster
				cluster, err := rds.NewCluster(ctx, "test-aurora", &rds.ClusterArgs{
					Engine:                pulumi.String("aurora-postgresql"),
					EngineVersion:         pulumi.String("13.7"),
					DatabaseName:          pulumi.String("patient_records"),
					MasterUsername:        pulumi.String("admin"),
					MasterPassword:        pulumi.String("dummy-password"),
					DbSubnetGroupName:     dbSubnetGroup.Name,
					VpcSecurityGroupIds:   pulumi.StringArray{pulumi.String("sg-12345")},
					BackupRetentionPeriod: pulumi.Int(7),
					CopyTagsToSnapshot:    pulumi.Bool(true),
					StorageEncrypted:      pulumi.Bool(true),
					Tags: pulumi.StringMap{
						"Name":        pulumi.String("patient-aurora-" + tt.envValue),
						"Environment": pulumi.String(tt.envValue),
						"Compliance":  pulumi.String("HIPAA"),
					},
				})
				assert.NoError(t, err)
				assert.NotNil(t, cluster)

				// Create Aurora instance
				instance, err := rds.NewClusterInstance(ctx, "test-aurora-instance", &rds.ClusterInstanceArgs{
					ClusterIdentifier:  cluster.ID(),
					InstanceClass:      pulumi.String("db.r5.large"),
					Engine:             pulumi.String("aurora-postgresql"),
					EngineVersion:      pulumi.String("13.7"),
					PubliclyAccessible: pulumi.Bool(false),
					Tags: pulumi.StringMap{
						"Name":        pulumi.String("patient-aurora-instance-" + tt.envValue),
						"Environment": pulumi.String(tt.envValue),
						"Compliance":  pulumi.String("HIPAA"),
					},
				})
				assert.NoError(t, err)
				assert.NotNil(t, instance)

				return nil
			}, pulumi.WithMocks("test-project", "test-stack", &mocks{}))

			assert.NoError(t, err)
		})
	}
}
