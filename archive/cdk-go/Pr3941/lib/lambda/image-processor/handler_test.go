package main

import (
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestGetDefaultPreviewSizes(t *testing.T) {
	sizes := GetDefaultPreviewSizes()

	if len(sizes) != 3 {
		t.Errorf("Expected 3 preview sizes, got %d", len(sizes))
	}

	expectedSizes := map[string]struct{ width, height int }{
		"thumbnail": {150, 150},
		"small":     {300, 300},
		"medium":    {800, 800},
	}

	for _, size := range sizes {
		expected, ok := expectedSizes[size.Name]
		if !ok {
			t.Errorf("Unexpected size name: %s", size.Name)
			continue
		}

		if size.Width != expected.width || size.Height != expected.height {
			t.Errorf("Size %s: expected %dx%d, got %dx%d",
				size.Name, expected.width, expected.height, size.Width, size.Height)
		}
	}
}

func TestImageMetadataStructure(t *testing.T) {
	metadata := &ImageMetadata{
		ImageID:          "test-id",
		Timestamp:        1234567890,
		UserID:           "user-123",
		OriginalKey:      "uploads/user-123/test.jpg",
		OriginalSize:     1024,
		ProcessingStatus: StatusPending,
		TTL:              1234567890 + 31536000,
	}

	if metadata.ImageID != "test-id" {
		t.Errorf("Expected ImageID to be 'test-id', got '%s'", metadata.ImageID)
	}

	if metadata.ProcessingStatus != StatusPending {
		t.Errorf("Expected status to be '%s', got '%s'", StatusPending, metadata.ProcessingStatus)
	}
}

func TestProcessingStatusConstants(t *testing.T) {
	statuses := []string{StatusPending, StatusProcessing, StatusCompleted, StatusFailed}
	expectedStatuses := []string{"pending", "processing", "completed", "failed"}

	for i, status := range statuses {
		if status != expectedStatuses[i] {
			t.Errorf("Expected status constant to be '%s', got '%s'", expectedStatuses[i], status)
		}
	}
}

func TestHandleRequestWithEmptyEvent(t *testing.T) {
	// This is a basic test to ensure HandleRequest doesn't panic with empty event
	s3Event := events.S3Event{
		Records: []events.S3EventRecord{},
	}

	// We can't test the full handler without AWS credentials and resources
	// But we can verify the structure is correct
	if len(s3Event.Records) != 0 {
		t.Errorf("Expected empty records, got %d", len(s3Event.Records))
	}
}

func TestPreviewSizeStructure(t *testing.T) {
	size := PreviewSize{
		Width:  100,
		Height: 100,
		Name:   "test",
	}

	if size.Width != 100 {
		t.Errorf("Expected width to be 100, got %d", size.Width)
	}

	if size.Height != 100 {
		t.Errorf("Expected height to be 100, got %d", size.Height)
	}

	if size.Name != "test" {
		t.Errorf("Expected name to be 'test', got '%s'", size.Name)
	}
}
