package main

import (
	"regexp"
	"strings"
)

// validateInput sanitizes and validates input strings
func validateInput(input string) string {
	// Remove any potentially dangerous characters
	re := regexp.MustCompile(`[^a-zA-Z0-9-]`)
	return re.ReplaceAllString(strings.TrimSpace(input), "")
}

// createTags creates a standardized tag map for resources
func createTags(commonTags map[string]interface{}, resourceName, resourceType string) map[string]interface{} {
	tags := map[string]interface{}{
		"Name": resourceName,
		"Type": resourceType,
	}
	for k, v := range commonTags {
		tags[k] = v
	}
	return tags
}
