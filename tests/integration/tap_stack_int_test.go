//go:build integration
// +build integration

package lib_test

import (
	"context"
	"encoding/json"
	"os"
	"path/filepath"
	"testing"
	"time"

	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/service/ec2"
	"github.com/aws/aws-sdk-go-v2/service/rds"
	"github.com/aws/aws-sdk-go-v2/service/s3"
)

// CfnOutput represents a single output from a CloudFormation stack.
type CfnOutput struct {
	OutputKey   string `json:"OutputKey"`
	OutputValue string `json:"OutputValue"`
}

// CdkOutputsFile represents the structure of the all-outputs.json file.
type CdkOutputsFile struct {
	TapStackdev []CfnOutput `json:"TapStackdev"`
}

// CdkOutputs holds the parsed output values for use in tests.
type CdkOutputs struct {
	VpcId               string
	EC2InstanceId       string
	EC2PublicIP         string
	RDSEndpoint         string
	S3BucketName        string
	S3LoggingBucketName string
}

func readCdkOutputs(t *testing.T) CdkOutputs {
	t.Helper()
	p := filepath.Join("..", "cfn-outputs", "all-outputs.json")
	if _, err := os.Stat(p); err != nil {
		t.Fatalf("outputs file not found at %s", p)
	}
	data, err := os.ReadFile(p)
	if err != nil {
		t.Fatalf("failed to read all-outputs.json: %v", err)
	}

	var outputsFile CdkOutputsFile
	if err := json.Unmarshal(data, &outputsFile); err != nil {
		t.Fatalf("failed to parse all-outputs.json: %v", err)
	}

	// Helper function to find a value by key from the list of outputs.
	findOutput := func(key string) string {
		for _, o := range outputsFile.TapStackdev {
			if o.OutputKey == key {
				return o.OutputValue
			}
		}
		t.Logf("warning: output key '%s' not found in all-outputs.json", key)
		return ""
	}

	// Populate the struct for the tests.
	return CdkOutputs{
		VpcId:               findOutput("VpcId"),
		EC2InstanceId:       findOutput("EC2InstanceId"),
		EC2PublicIP:         findOutput("EC2PublicIP"),
		RDSEndpoint:         findOutput("RDSEndpoint"),
		S3BucketName:        findOutput("S3BucketName"),
		S3LoggingBucketName: findOutput("S3LoggingBucketName"),
	}
}

func retry[T any](t *testing.T, fn func() (*T, error), attempts int, baseMs time.Duration) *T {
	t.Helper()
	var lastErr error
	for i := 0; i < attempts; i++ {
		res, err := fn()
		if err == nil {
			return res
		}
		lastErr = err
		wait := baseMs * time.Duration(1<<i)
		time.Sleep(wait)
	}
	t.Fatalf("failed after %d attempts: %v", attempts, lastErr)
	return nil
}

func TestLiveVPC(t *testing.T) {
	outputs := readCdkOutputs(t)
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		t.Fatalf("unable to load SDK config, %v", err)
	}
	client := ec2.NewFromConfig(cfg)

	vpc := retry(t, func() (*ec2.DescribeVpcsOutput, error) {
		return client.DescribeVpcs(context.TODO(), &ec2.DescribeVpcsInput{
			VpcIds: []string{outputs.VpcId},
		})
	}, 5, 1*time.Second)

	if len(vpc.Vpcs) != 1 {
		t.Fatalf("expected 1 VPC, got %d", len(vpc.Vpcs))
	}
}

func TestLiveS3(t *testing.T) {
	outputs := readCdkOutputs(t)
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		t.Fatalf("unable to load SDK config, %v", err)
	}
	client := s3.NewFromConfig(cfg)

	versioning := retry(t, func() (*s3.GetBucketVersioningOutput, error) {
		return client.GetBucketVersioning(context.TODO(), &s3.GetBucketVersioningInput{
			Bucket: &outputs.S3BucketName,
		})
	}, 5, 1*time.Second)

	if versioning.Status != "Enabled" {
		t.Errorf("expected versioning to be enabled, got %s", versioning.Status)
	}
}

func TestLiveEC2(t *testing.T) {
	outputs := readCdkOutputs(t)
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		t.Fatalf("unable to load SDK config, %v", err)
	}
	client := ec2.NewFromConfig(cfg)

	instance := retry(t, func() (*ec2.DescribeInstancesOutput, error) {
		return client.DescribeInstances(context.TODO(), &ec2.DescribeInstancesInput{
			InstanceIds: []string{outputs.EC2InstanceId},
		})
	}, 5, 1*time.Second)

	if len(instance.Reservations) != 1 || len(instance.Reservations[0].Instances) != 1 {
		t.Fatalf("expected 1 instance, got %d reservations", len(instance.Reservations))
	}
}

func TestLiveRDS(t *testing.T) {
	outputs := readCdkOutputs(t)
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		t.Fatalf("unable to load SDK config, %v", err)
	}
	client := rds.NewFromConfig(cfg)

	dbInstance := retry(t, func() (*rds.DescribeDBInstancesOutput, error) {
		return client.DescribeDBInstances(context.TODO(), &rds.DescribeDBInstancesInput{
			DBInstanceIdentifier: &outputs.RDSEndpoint,
		})
	}, 5, 1*time.Second)

	if len(dbInstance.DBInstances) != 1 {
		t.Fatalf("expected 1 DB instance, got %d", len(dbInstance.DBInstances))
	}
}

func TestLiveLoggingS3(t *testing.T) {
	outputs := readCdkOutputs(t)
	cfg, err := config.LoadDefaultConfig(context.TODO())
	if err != nil {
		t.Fatalf("unable to load SDK config, %v", err)
	}
	client := s3.NewFromConfig(cfg)

	logging := retry(t, func() (*s3.GetBucketLoggingOutput, error) {
		return client.GetBucketLogging(context.TODO(), &s3.GetBucketLoggingInput{
			Bucket: &outputs.S3BucketName,
		})
	}, 5, 1*time.Second)

	if logging.LoggingEnabled == nil {
		t.Errorf("expected logging to be enabled, but it was not")
	}
}
