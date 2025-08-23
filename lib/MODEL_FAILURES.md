# Model Failures and Fixes

I've been working on this Pulumi Java project and the AI model gave me code that was completely broken. Here's what went wrong and how I ended up fixing it.

## The Main Problem

The model initially gave me this complex multi-file setup with separate infrastructure classes that all extended `ComponentResource`. Sounds good in theory, but it was a total disaster in practice.

## What Failed

### Missing Dependencies
The biggest issue was that the model didn't include the right Pulumi dependencies in the build.gradle. It was trying to use classes like `ComponentResource` and `ComponentResourceOptions` but these weren't even available. The build kept failing with "cannot find symbol" errors for basic Pulumi core classes.

I had to add these to get it working:
```gradle
implementation 'com.pulumi:pulumi:0.9.9'
implementation 'com.pulumi:aws:6.22.2'
```

### ComponentResource Mess
The model created all these infrastructure classes that extended `ComponentResource`:
- NetworkingInfrastructure.java
- IdentityInfrastructure.java  
- MonitoringInfrastructure.java
- TapStack.java
- ElasticBeanstalk Infrastructure.java

But then it had type conversion issues where it couldn't convert these custom classes to `Resource` types. The error messages were like "NetworkingInfrastructure cannot be converted to Resource" which made no sense.

### Lambda Expression Problems
There were weird lambda expression errors where the return types didn't match. The model was using `apply()` method calls that returned the wrong types, causing compilation failures.

### Constructor Issues
The model created constructor calls with no arguments but the actual constructors required like 12 different parameters. Really sloppy.

### Security Group Builder Problems
It was trying to use `SecurityGroupIngressArgs.builder()` but that class wasn't available either.

### CloudWatch Alarm Type Mismatches
The alarms expected `Output<List<String>>` for alarm actions but the model was passing `Output<String>`. Basic type mismatch that should have been caught.

## How I Fixed It

### Simplified Architecture
I used import com.pulumi.resources.ComponentResourceOptions; instead of com.pulumi.ComponentResource which the ai gave. This approach worked and compiled without errors.

### Fixed Dependencies  
Updated build.gradle with the correct Pulumi and AWS dependencies.

### Fixed Lambda Returns
Changed all the `.apply()` calls to `.applyValue()` where needed and made sure the return types matched.

### Used Correct Builders
Found the right argument builder classes that actually exist in the Pulumi AWS library.

### Fixed Type Conversions
Made sure alarm actions used `snsTopic.arn().applyValue(List::of)` to convert single values to lists where needed.

## What This Shows

The model seems to know Pulumi concepts but doesn't have accurate knowledge of the actual Java API. It generates code that looks reasonable but uses classes and methods that don't exist or have different signatures than expected.

For Java Pulumi projects, it's probably better to ask for simpler, monolithic solutions rather than complex multi-file architectures. The model tends to overcomplicate things and then gets the implementation details wrong.

Also, always check the actual Pulumi Java documentation because the model's knowledge of the API seems outdated or inaccurate in many places.

## Final Working Solution

Ended up with a project file that:
- Uses correct Pulumi dependencies
- Has proper type handling for Output types
- Uses existing builder classes
- Actually compiles and runs
