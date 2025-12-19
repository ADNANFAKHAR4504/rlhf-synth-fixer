package main

import (
	"crypto/rand"
	"fmt"
	"math/big"
	"regexp"
	"strings"
)

// SanitizeBucketName ensures resource names are compliant with AWS naming requirements
func SanitizeBucketName(name string) string {
	name = strings.ToLower(name)
	reg := regexp.MustCompile(`[^a-z0-9\.-]`)
	name = reg.ReplaceAllString(name, "-")
	name = strings.Trim(name, "-.")
	return name
}

// GenerateDBUsername generates an RDS-compliant username
func GenerateDBUsername(length int) (string, error) {
	if length < 1 || length > 16 {
		return "", fmt.Errorf("username length must be between 1 and 16")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	allowed := letters + digits + "_"

	result := make([]byte, length)

	// First character must be a letter
	num, err := rand.Int(rand.Reader, big.NewInt(int64(len(letters))))
	if err != nil {
		return "", err
	}
	result[0] = letters[num.Int64()]

	// Remaining characters can be letters, digits, underscore
	for i := 1; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}

// GenerateDBPassword generates an RDS-compliant password
func GenerateDBPassword(length int) (string, error) {
	if length < 8 || length > 41 {
		return "", fmt.Errorf("password length must be between 8 and 41")
	}

	letters := "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digits := "0123456789"
	// Safe specials (removed /, @, ", space for RDS compatibility)
	specials := "!#$%^&*()-_=+[]{}:;,.?"
	allowed := letters + digits + specials

	result := make([]byte, length)

	for i := 0; i < length; i++ {
		num, err := rand.Int(rand.Reader, big.NewInt(int64(len(allowed))))
		if err != nil {
			return "", err
		}
		result[i] = allowed[num.Int64()]
	}

	return string(result), nil
}
