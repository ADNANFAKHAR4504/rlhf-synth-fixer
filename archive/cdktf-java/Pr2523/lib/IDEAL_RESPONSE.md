# Basic S3 Bucket Infrastructure - Ideal Response

## Main.java Implementation

```java
package app;

import com.pulumi.Context;
import com.pulumi.Pulumi;
import com.pulumi.aws.s3.Bucket;
import com.pulumi.aws.s3.BucketArgs;

import java.util.Map;

public class Main {
    public static void main(String[] args) {
        Pulumi.run(Main::defineInfrastructure);
    }

    static void defineInfrastructure(Context ctx) {
        Bucket bucket = new Bucket("ci-test-java-app-bucket", BucketArgs.builder()
                .tags(Map.of(
                        "Environment", "development",
                        "Project", "pulumi-java-template",
                        "ManagedBy", "pulumi"))
                .build());

        ctx.export("bucketName", bucket.id());
    }
}
```