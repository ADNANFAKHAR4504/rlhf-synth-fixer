The Java compilation failed because of incorrect method usage and type mismatches:

HealthCheck.elb() was called with no arguments, but it requires an ElbHealthCheckOptions parameter.

SubnetSelection was incorrectly used as a functional interface. The lambda .subnetGroupName("public") is invalid because SubnetSelection does not define an abstract method for functional-style use.

There are also deprecation warnings, but they are not blocking the build.

Can you fix these issues in the Main.java so that the code compiles successfully?