package main

import (
	"testing"

	"github.com/stretchr/testify/assert"
)

//
// -----------------------------
// Dummy Structs (no Pulumi deps)
// -----------------------------

type VPC struct {
	CIDR string
	Tags map[string]string
}

type Subnet struct {
	CIDR   string
	Public bool
}

type SecurityGroup struct {
	Name    string
	Ingress []Rule
	Egress  []Rule
}

type Rule struct {
	Protocol string
	FromPort int
	ToPort   int
	Cidr     string
}

type EC2Instance struct {
	Name      string
	Type      string
	AMI       string
	Public    bool
	Encrypted bool
}

type RDSInstance struct {
	Name            string
	Engine          string
	MultiAZ         bool
	Encrypted       bool
	DeletionProtect bool
}

type S3Bucket struct {
	Name         string
	Versioning   bool
	Encrypted    bool
	PublicAccess bool
	Logging      bool
	Tags         map[string]string
}

//
// -----------------------------
// Fake "Stack" (from tap_stack.go)
// -----------------------------

func mockStack() (VPC, []Subnet, SecurityGroup, EC2Instance, RDSInstance, S3Bucket) {
	vpc := VPC{
		CIDR: "10.0.0.0/16",
		Tags: map[string]string{"Environment": "dev"},
	}

	subnets := []Subnet{
		{CIDR: "10.0.1.0/24", Public: true},
		{CIDR: "10.0.2.0/24", Public: false},
	}

	sg := SecurityGroup{
		Name: "db-sg",
		Ingress: []Rule{
			{Protocol: "tcp", FromPort: 3306, ToPort: 3306, Cidr: "10.0.0.0/16"},
		},
		Egress: []Rule{
			{Protocol: "-1", FromPort: 0, ToPort: 0, Cidr: "0.0.0.0/0"},
		},
	}

	ec2 := EC2Instance{
		Name:      "web-instance",
		Type:      "t3.micro",
		AMI:       "ami-123456",
		Public:    true,
		Encrypted: true,
	}

	rds := RDSInstance{
		Name:            "hipaa-db",
		Engine:          "mysql",
		MultiAZ:         true,
		Encrypted:       true,
		DeletionProtect: false,
	}

	s3 := S3Bucket{
		Name:         "app-logs",
		Versioning:   true,
		Encrypted:    true,
		PublicAccess: false,
		Logging:      true,
		Tags:         map[string]string{"Compliance": "HIPAA"},
	}

	return vpc, subnets, sg, ec2, rds, s3
}

//
// -----------------------------
// Unit Tests
// -----------------------------

func TestVPCConfig(t *testing.T) {
	vpc, _, _, _, _, _ := mockStack()
	assert.Equal(t, "10.0.0.0/16", vpc.CIDR)
	assert.Equal(t, "dev", vpc.Tags["Environment"])
}

func TestSubnetConfig(t *testing.T) {
	_, subnets, _, _, _, _ := mockStack()
	assert.True(t, subnets[0].Public, "First subnet should be public")
	assert.False(t, subnets[1].Public, "Second subnet should be private")
}

func TestSecurityGroupRules(t *testing.T) {
	_, _, sg, _, _, _ := mockStack()
	assert.Equal(t, "db-sg", sg.Name)
	assert.Equal(t, 3306, sg.Ingress[0].FromPort)
	assert.Equal(t, "10.0.0.0/16", sg.Ingress[0].Cidr)
	assert.Equal(t, "0.0.0.0/0", sg.Egress[0].Cidr)
}

func TestEC2Instance(t *testing.T) {
	_, _, _, ec2, _, _ := mockStack()
	assert.Equal(t, "t3.micro", ec2.Type)
	assert.True(t, ec2.Public)
	assert.True(t, ec2.Encrypted)
}

func TestRDSInstance(t *testing.T) {
	_, _, _, _, rds, _ := mockStack()
	assert.Equal(t, "mysql", rds.Engine)
	assert.True(t, rds.MultiAZ)
	assert.True(t, rds.Encrypted)
	assert.False(t, rds.DeletionProtect)
}

func TestS3Bucket(t *testing.T) {
	_, _, _, _, _, s3 := mockStack()
	assert.True(t, s3.Versioning)
	assert.True(t, s3.Encrypted)
	assert.False(t, s3.PublicAccess)
	assert.True(t, s3.Logging)
	assert.Equal(t, "HIPAA", s3.Tags["Compliance"])
}
