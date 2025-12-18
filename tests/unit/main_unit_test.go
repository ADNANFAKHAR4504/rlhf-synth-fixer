package main

import (
	"os"
	"testing"

	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
	"github.com/stretchr/testify/assert"
)

func TestTapStack_DefaultEnvVars(t *testing.T) {
	os.Unsetenv("ENVIRONMENT_SUFFIX")
	os.Unsetenv("REPOSITORY")
	os.Unsetenv("COMMIT_AUTHOR")

	err := pulumi.RunErr(tapStack, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestTapStack_CustomEnvVars(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "qa")
	os.Setenv("REPOSITORY", "iac-repo")
	os.Setenv("COMMIT_AUTHOR", "tester")

	err := pulumi.RunErr(tapStack, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}

func TestTapStack_PartialEnvVars(t *testing.T) {
	os.Setenv("ENVIRONMENT_SUFFIX", "stage")
	os.Unsetenv("REPOSITORY")
	os.Setenv("COMMIT_AUTHOR", "stager")

	err := pulumi.RunErr(tapStack, pulumi.WithMocks("proj", "stack", mocks{}))
	assert.NoError(t, err)
}
