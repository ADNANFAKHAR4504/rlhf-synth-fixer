package app;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

import com.hashicorp.cdktf.App;
import imports.aws.provider.AwsProvider;
import imports.aws.s3_bucket.S3Bucket;
import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;

import java.util.Map;

class MainTest {

    @Test
    void testS3BucketCreationIsMocked() {
        // Use a real App (jsii needs it)
        App realApp = new App();

        try (MockedStatic<S3Bucket.Builder> mockedBucketStatic = mockStatic(S3Bucket.Builder.class);
             MockedStatic<AwsProvider.Builder> mockedProviderStatic = mockStatic(AwsProvider.Builder.class)) {

            // Mock bucket builder
            S3Bucket.Builder mockBucketBuilder = mock(S3Bucket.Builder.class);
            S3Bucket mockBucket = mock(S3Bucket.class);

            mockedBucketStatic.when(() -> S3Bucket.Builder.create(any(), anyString()))
                    .thenReturn(mockBucketBuilder);

            when(mockBucketBuilder.bucket(anyString())).thenReturn(mockBucketBuilder);
            when(mockBucketBuilder.tags(anyMap())).thenReturn(mockBucketBuilder);
            when(mockBucketBuilder.build()).thenReturn(mockBucket);

            when(mockBucket.getBucket()).thenReturn("mocked-bucket-name");

            // Mock AWS provider builder
            AwsProvider.Builder mockProviderBuilder = mock(AwsProvider.Builder.class);
            mockedProviderStatic.when(() -> AwsProvider.Builder.create(any(), anyString()))
                    .thenReturn(mockProviderBuilder);
            when(mockProviderBuilder.region(anyString())).thenReturn(mockProviderBuilder);
            when(mockProviderBuilder.build()).thenReturn(mock(AwsProvider.class));

            // Now create the stack with a real App
            MainStack stack = new MainStack(realApp, "test-stack");

            // Verify S3 bucket builder interactions
            verify(mockBucketBuilder).bucket(startsWith("cdktf-java-template-bucket-"));
            verify(mockBucketBuilder).tags(Map.of(
                    "Environment", "development",
                    "Project", "cdktf-java-template",
                    "ManagedBy", "cdktf",
                    "Purpose", "ApplicationStorage"
            ));
            verify(mockBucketBuilder).build();

            // Ensure getBucketName() returns mocked name
            assertEquals("mocked-bucket-name", stack.getBucketName());
        }
    }
}