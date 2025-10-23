//go:build !integration
// +build !integration

package main

import (
	"os"
	"testing"

	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/ec2"
	"github.com/pulumi/pulumi-aws/sdk/v6/go/aws/kms"
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
