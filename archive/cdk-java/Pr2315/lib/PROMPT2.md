I am facing the following issue during build:
```
> Task :compileJava
/Users/sivakumar/Documents/turing/iac-test-automations/lib/src/main/java/app/Main.java:25: error: cannot find symbol
import software.amazon.awscdk.services.s3.BucketObjectOwnership;
                                         ^
  symbol:   class BucketObjectOwnership
  location: package software.amazon.awscdk.services.s3
/Users/sivakumar/Documents/turing/iac-test-automations/lib/src/main/java/app/Main.java:280: error: cannot find symbol
                    .objectOwnership(BucketObjectOwnership.BUCKET_OWNER_PREFERRED)
                                     ^
  symbol:   variable BucketObjectOwnership
  location: class NetworkStack
/Users/sivakumar/Documents/turing/iac-test-automations/lib/src/main/java/app/Main.java:442: error: cannot find symbol
                    .kmsKey(this.kmsKey)
                    ^
  symbol:   method kmsKey(Key)
  location: class Builder
Note: /Users/sivakumar/Documents/turing/iac-test-automations/lib/src/main/java/app/Main.java uses or overrides a deprecated API.
Note: Recompile with -Xlint:deprecation for details.
3 errors

> Task :compileJava FAILED

[Incubating] Problems report is available at: file:///Users/sivakumar/Documents/turing/iac-test-automations/build/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':compileJava'.
> Compilation failed; see the compiler output below.
  /Users/sivakumar/Documents/turing/iac-test-automations/lib/src/main/java/app/Main.java:25: error: cannot find symbol
  import software.amazon.awscdk.services.s3.BucketObjectOwnership;
                                           ^
    symbol:   class BucketObjectOwnership
    location: package software.amazon.awscdk.services.s3
  3 errors
```

Fix these issues