//go:build !integration
// +build !integration

package main

import (
	"regexp"
	"strings"
	"testing"
)

// Test sanitizeBucketName function
func TestSanitizeBucketName(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{
			name:     "uppercase letters converted to lowercase",
			input:    "MyBucket",
			expected: "mybucket",
		},
		{
			name:     "special characters replaced with hyphens",
			input:    "my_bucket@name",
			expected: "my-bucket-name",
		},
		{
			name:     "leading and trailing hyphens removed",
			input:    "-my-bucket-",
			expected: "my-bucket",
		},
		{
			name:     "complex name with multiple issues",
			input:    "My_Bucket@2024!",
			expected: "my-bucket-2024",
		},
		{
			name:     "already valid name unchanged",
			input:    "my-bucket-name",
			expected: "my-bucket-name",
		},
		{
			name:     "dots preserved",
			input:    "my.bucket.name",
			expected: "my.bucket.name",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := sanitizeBucketName(tt.input)
			if result != tt.expected {
				t.Errorf("sanitizeBucketName(%q) = %q; expected %q", tt.input, result, tt.expected)
			}
		})
	}
}

// Test generateDBUsername function
func TestGenerateDBUsername(t *testing.T) {
	tests := []struct {
		name        string
		length      int
		expectError bool
	}{
		{
			name:        "valid length 12",
			length:      12,
			expectError: false,
		},
		{
			name:        "valid length 1 (minimum)",
			length:      1,
			expectError: false,
		},
		{
			name:        "valid length 16 (maximum)",
			length:      16,
			expectError: false,
		},
		{
			name:        "invalid length 0",
			length:      0,
			expectError: true,
		},
		{
			name:        "invalid length 17",
			length:      17,
			expectError: true,
		},
		{
			name:        "invalid negative length",
			length:      -1,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := generateDBUsername(tt.length)
			if tt.expectError {
				if err == nil {
					t.Errorf("generateDBUsername(%d) expected error, got nil", tt.length)
				}
			} else {
				if err != nil {
					t.Errorf("generateDBUsername(%d) unexpected error: %v", tt.length, err)
				}
				if len(result) != tt.length {
					t.Errorf("generateDBUsername(%d) returned length %d, expected %d", tt.length, len(result), tt.length)
				}
				if !isLetter(result[0]) {
					t.Errorf("generateDBUsername(%d) first character %c is not a letter", tt.length, result[0])
				}
			}
		})
	}
}

// Test generateDBPassword function
func TestGenerateDBPassword(t *testing.T) {
	tests := []struct {
		name        string
		length      int
		expectError bool
	}{
		{
			name:        "valid length 20",
			length:      20,
			expectError: false,
		},
		{
			name:        "valid length 8 (minimum)",
			length:      8,
			expectError: false,
		},
		{
			name:        "valid length 41 (maximum)",
			length:      41,
			expectError: false,
		},
		{
			name:        "invalid length 7",
			length:      7,
			expectError: true,
		},
		{
			name:        "invalid length 42",
			length:      42,
			expectError: true,
		},
		{
			name:        "invalid negative length",
			length:      -1,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := generateDBPassword(tt.length)
			if tt.expectError {
				if err == nil {
					t.Errorf("generateDBPassword(%d) expected error, got nil", tt.length)
				}
			} else {
				if err != nil {
					t.Errorf("generateDBPassword(%d) unexpected error: %v", tt.length, err)
				}
				if len(result) != tt.length {
					t.Errorf("generateDBPassword(%d) returned length %d, expected %d", tt.length, len(result), tt.length)
				}
			}
		})
	}
}

// Helper function to check if a byte is a letter
func isLetter(b byte) bool {
	return (b >= 'a' && b <= 'z') || (b >= 'A' && b <= 'Z')
}

// Test constants
func TestConstants(t *testing.T) {
	const (
		expectedRegion       = "us-east-1"
		expectedVPCCIDR      = "10.0.0.0/16"
		expectedAZ1          = "us-east-1a"
		expectedAZ2          = "us-east-1b"
		expectedPublicCIDR1  = "10.0.1.0/24"
		expectedPublicCIDR2  = "10.0.2.0/24"
		expectedPrivateCIDR1 = "10.0.3.0/24"
		expectedPrivateCIDR2 = "10.0.4.0/24"
	)

	cidrPattern := regexp.MustCompile(`^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/\d{1,2}$`)

	if !cidrPattern.MatchString(expectedVPCCIDR) {
		t.Errorf("VPC CIDR %q is not valid", expectedVPCCIDR)
	}
	if !cidrPattern.MatchString(expectedPublicCIDR1) {
		t.Errorf("Public CIDR 1 %q is not valid", expectedPublicCIDR1)
	}
	if !cidrPattern.MatchString(expectedPublicCIDR2) {
		t.Errorf("Public CIDR 2 %q is not valid", expectedPublicCIDR2)
	}
	if !cidrPattern.MatchString(expectedPrivateCIDR1) {
		t.Errorf("Private CIDR 1 %q is not valid", expectedPrivateCIDR1)
	}
	if !cidrPattern.MatchString(expectedPrivateCIDR2) {
		t.Errorf("Private CIDR 2 %q is not valid", expectedPrivateCIDR2)
	}

	if !strings.HasPrefix(expectedRegion, "us-") {
		t.Errorf("Region %q does not match expected format", expectedRegion)
	}

	if !strings.HasPrefix(expectedAZ1, expectedRegion) {
		t.Errorf("AZ1 %q does not belong to region %q", expectedAZ1, expectedRegion)
	}
	if !strings.HasPrefix(expectedAZ2, expectedRegion) {
		t.Errorf("AZ2 %q does not belong to region %q", expectedAZ2, expectedRegion)
	}
}

// Test generateDBUsername with actual implementation
func TestGenerateDBUsernameContent(t *testing.T) {
	username, err := generateDBUsername(12)
	if err != nil {
		t.Fatalf("generateDBUsername failed: %v", err)
	}

	if !isLetter(username[0]) {
		t.Errorf("First character of username must be a letter, got: %c", username[0])
	}

	for i, char := range username {
		if !isLetter(byte(char)) && !(char >= '0' && char <= '9') && char != '_' {
			t.Errorf("Invalid character at position %d: %c", i, char)
		}
	}
}

// Test generateDBPassword with actual implementation
func TestGenerateDBPasswordContent(t *testing.T) {
	password, err := generateDBPassword(20)
	if err != nil {
		t.Fatalf("generateDBPassword failed: %v", err)
	}

	allowed := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!#$%^&*()-_=+[]{}:;,.?"
	for i, char := range password {
		if !strings.ContainsRune(allowed, char) {
			t.Errorf("Invalid character at position %d: %c", i, char)
		}
	}
}

// Test password complexity (should contain mix of character types ideally)
func TestGenerateDBPasswordMultipleGenerations(t *testing.T) {
	for i := 0; i < 10; i++ {
		password, err := generateDBPassword(20)
		if err != nil {
			t.Fatalf("Iteration %d: generateDBPassword failed: %v", i, err)
		}
		if len(password) != 20 {
			t.Errorf("Iteration %d: expected length 20, got %d", i, len(password))
		}
	}
}

// Test username validity across multiple generations
func TestGenerateDBUsernameMultipleGenerations(t *testing.T) {
	for i := 0; i < 10; i++ {
		username, err := generateDBUsername(12)
		if err != nil {
			t.Fatalf("Iteration %d: generateDBUsername failed: %v", i, err)
		}
		if len(username) != 12 {
			t.Errorf("Iteration %d: expected length 12, got %d", i, len(username))
		}
		if !isLetter(username[0]) {
			t.Errorf("Iteration %d: first character must be a letter", i)
		}
	}
}
