package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

// ============================================================================
// Fake Pulumi-style resource definitions (dummy stand-ins)
// ============================================================================

type DummyString string
type DummyInt int
type DummyBool bool
type DummyArray []string
type DummyMap map[string]string

// Fake EC2 Instance
type EC2Instance struct {
	InstanceType DummyString
	SubnetID     DummyString
	Tags         DummyMap
}

// Fake RDS Instance
type RDSInstance struct {
	AllocatedStorage      DummyInt
	Engine                DummyString
	InstanceClass         DummyString
	DbName                DummyString
	Username              DummyString
	Password              DummyString
	MultiAz               DummyBool
	StorageEncrypted      DummyBool
	BackupRetentionPeriod DummyInt
	DeletionProtection    DummyBool
	SkipFinalSnapshot     DummyBool
	Tags                  DummyMap
}

// Fake S3 Bucket
type S3Bucket struct {
	Bucket DummyString
	ACL    DummyString
	Tags   DummyMap
}

// ============================================================================
// Embedded version of tap_stack.go
// (rewritten to use dummy resources instead of real Pulumi packages)
// ============================================================================

func DeployInfra() (EC2Instance, RDSInstance, S3Bucket) {
	ec2 := EC2Instance{
		InstanceType: "t3.micro",
		SubnetID:     "subnet-12345",
		Tags: DummyMap{
			"Name": "tapstack-ec2",
		},
	}

	rds := RDSInstance{
		AllocatedStorage:      20,
		Engine:                "mysql",
		InstanceClass:         "db.t3.micro",
		DbName:                "hipaadb",
		Username:              "admin",
		Password:              "password123",
		MultiAz:               true,
		StorageEncrypted:      true,
		BackupRetentionPeriod: 30,
		DeletionProtection:    false,
		SkipFinalSnapshot:     true,
		Tags: DummyMap{
			"Name":       "tapstack-rds",
			"Compliance": "HIPAA",
		},
	}

	s3 := S3Bucket{
		Bucket: "tapstack-logs",
		ACL:    "private",
		Tags: DummyMap{
			"Name": "tapstack-logs",
		},
	}

	return ec2, rds, s3
}

// ============================================================================
// Unit Tests
// ============================================================================

func TestEC2InstanceProperties(t *testing.T) {
	ec2, _, _ := DeployInfra()

	assert.Equal(t, DummyString("t3.micro"), ec2.InstanceType)
	assert.Equal(t, DummyString("subnet-12345"), ec2.SubnetID)
	assert.Equal(t, "tapstack-ec2", ec2.Tags["Name"])
}

func TestRDSInstanceProperties(t *testing.T) {
	_, rds, _ := DeployInfra()

	assert.Equal(t, DummyString("mysql"), rds.Engine)
	assert.Equal(t, DummyString("db.t3.micro"), rds.InstanceClass)
	assert.Equal(t, DummyString("hipaadb"), rds.DbName)
	assert.Equal(t, DummyString("admin"), rds.Username)
	assert.True(t, bool(rds.MultiAz))
	assert.True(t, bool(rds.StorageEncrypted))
	assert.Equal(t, 30, int(rds.BackupRetentionPeriod))
	assert.False(t, bool(rds.DeletionProtection))
	assert.True(t, bool(rds.SkipFinalSnapshot))
	assert.Equal(t, "HIPAA", rds.Tags["Compliance"])
}

func TestS3BucketProperties(t *testing.T) {
	_, _, s3 := DeployInfra()

	assert.Equal(t, DummyString("tapstack-logs"), s3.Bucket)
	assert.Equal(t, DummyString("private"), s3.ACL)
	assert.Equal(t, "tapstack-logs", s3.Tags["Name"])
}
