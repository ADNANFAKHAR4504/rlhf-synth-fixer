import software.amazon.awscdk.*;
import software.amazon.awscdk.services.s3.*;
import java.util.Map;

public class TestSynth {
    public static void main(String[] args) {
        App app = new App();
        
        Stack stack = new Stack(app, "TestStack");
        
        new Bucket(stack, "TestBucket", BucketProps.builder()
            .bucketName("test-bucket-synth")
            .versioned(true)
            .removalPolicy(RemovalPolicy.DESTROY)
            .build());
            
        System.out.println("Stack synthesis test completed");
        System.out.println("Environment suffix would be: " + System.getenv("ENVIRONMENT_SUFFIX"));
    }
}
