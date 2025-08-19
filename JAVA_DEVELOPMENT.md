# Java Development Notes

## ⚠️ Expected Local Build Failure

**This is normal and expected behavior:**

```bash
./gradlew build
# FAILURE: BUG! exception in phase 'semantic analysis' 
# Unsupported class file major version 68
```

**Root cause:** Java 24 (class file version 68) is not fully supported by Gradle 8.12.

**Impact:** 
- ❌ Local builds fail  
- ✅ **CI builds work perfectly** (uses Java 17)

This is a **local development environment issue only** and **does not affect CI**.

## Solutions for Local Development

### Option 1: Install Java 17 for Gradle
1. Install Java 17 (e.g., using SDKMAN: `sdk install java 17.0.9-tem`)
2. Set JAVA_HOME for Gradle: `export JAVA_HOME=/path/to/java17`
3. Run builds: `./gradlew build`

### Option 2: Use Java 17 only for Gradle
```bash
JAVA_HOME=/path/to/java17 ./gradlew build
```

### Option 3: Skip Local Testing
Since CI uses Java 17, you can skip local Gradle builds and rely on CI for testing.

## CI Environment

The CI environment is configured to use Java 17 and works correctly:
- GitHub Actions installs Java 17 (`temurin` distribution)
- Gradle wrapper uses compatible Gradle 8.12
- All Java tasks work properly in CI

## Files Ready for CI

The following files are properly configured for CI:
- `gradlew` and `gradlew.bat` (wrapper scripts)
- `gradle/wrapper/gradle-wrapper.jar` (wrapper JAR)
- `gradle/wrapper/gradle-wrapper.properties` (Gradle 8.12 config)
- `gradle.properties` (performance settings)