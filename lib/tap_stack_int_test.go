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

type CdkOutputs struct {
	TestStack struct {
		VpcId               string `json:"VpcId"`
		EC2InstanceId       string `json:"EC2InstanceId"`
		EC2PublicIP         string `json:"EC2PublicIP"`
		RDSEndpoint         string `json:"RDSEndpoint"`
		S3BucketName        string `json:"S3BucketName"`
		S3LoggingBucketName string `json:"S3LoggingBucketName"`
	} `json:"TestStack"`
}

func readCdkOutputs(t *testing.T) CdkOutputs {
	t.Helper()
	p := filepath.Join("..", "cfn-outputs", "all-outputs.json")
	if _, err := os.Stat(p); err != nil {
		t.Fatalf("outputs file not found at %s", p)
	}
	data, err := os.ReadFile(p)
	if err != nil {
		t.Fatalf("failed to read cdk-outputs.json: %v", err)
	}
	var outputs CdkOutputs
	if err := json.Unmarshal(data, &outputs); err != nil {
		t.Fatalf("failed to parse cdk-outputs.json: %v", err)
	}
	return outputs
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
			VpcIds: []string{outputs.TestStack.VpcId},
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
			Bucket: &outputs.TestStack.S3BucketName,
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
			InstanceIds: []string{outputs.TestStack.EC2InstanceId},
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
			DBInstanceIdentifier: &outputs.TestStack.RDSEndpoint,
		})
	}, 5, 1*time.Second)

	if len(dbInstance.DBInstances) != 1 {
		t.Fatalf("expected 1 DB instance, got %d", len(dbInstance.DBInstances))
	}
}
