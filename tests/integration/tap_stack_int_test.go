package main

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"testing"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

type DeploymentOutputs struct {
	Ec2InstanceId string `json:"ec2InstanceId"`
	//... other fields ...
	RdsEndpoint        string `json:"rdsEndpoint"`
	RdsSecurityGroupId string `json:"rdsSecurityGroupId"`
	//... other fields ...
}

var (
	outputs   DeploymentOutputs
	awsConfig aws.Config
	ctx       = context.Background()
)

func TestMain(m *testing.M) {
	data, err := os.ReadFile("../cfn-outputs/flat-outputs.json")
	if err != nil {
		fmt.Printf("Failed to read outputs file: %v\n", err)
		os.Exit(1)
	}
	if err := json.Unmarshal(data, &outputs); err != nil {
		fmt.Printf("Failed to parse outputs JSON: %v\n", err)
		os.Exit(1)
	}

	awsConfig, err = config.LoadDefaultConfig(ctx, config.WithRegion("us-east-1"))
	if err != nil {
		fmt.Printf("Failed to load AWS config: %v\n", err)
		os.Exit(1)
	}

	code := m.Run()
	os.Exit(code)
}

func TestRDSInstance(t *testing.T) {
	// Create RDS client
	rdsClient := rds.NewFromConfig(awsConfig)

	require.NotEmpty(t, outputs.RdsEndpoint, "RDS endpoint must not be empty")

	instancesResp, err := rdsClient.DescribeDBInstances(ctx, &rds.DescribeDBInstancesInput{})
	require.NoError(t, err)

	var foundInstance *rds.DBInstance = nil
	for _, db := range instancesResp.DBInstances {
		if db.Endpoint != nil {
			address := aws.ToString(db.Endpoint.Address)
			port := aws.ToInt32(db.Endpoint.Port)
			endpoint := fmt.Sprintf("%s:%d", address, port)
			if endpoint == outputs.RdsEndpoint {
				foundInstance = db
				break
			}
		}
	}
	require.NotNil(t, foundInstance, "RDS instance with endpoint not found")

	foundSG := false
	for _, sg := range foundInstance.VpcSecurityGroups {
		if sg.VpcSecurityGroupId != nil && aws.ToString(sg.VpcSecurityGroupId) == outputs.RdsSecurityGroupId {
			foundSG = true
			break
		}
	}
	assert.True(t, foundSG, "RDS instance should have expected security group")
}
