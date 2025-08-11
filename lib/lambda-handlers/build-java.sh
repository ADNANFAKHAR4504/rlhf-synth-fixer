#!/bin/bash

# Create a minimal JAR file for the Java Lambda function
# This is a placeholder JAR for demonstration purposes

# Create directory structure
mkdir -p com/example

# Compile Java file (if javac is available)
if command -v javac &> /dev/null; then
    javac -d . Handler.java 2>/dev/null || true
fi

# Create manifest
cat > MANIFEST.MF << EOF
Manifest-Version: 1.0
Main-Class: com.example.Handler
EOF

# Create the JAR file (even if compilation failed, create an empty one for deployment)
if command -v jar &> /dev/null; then
    if [ -f "com/example/Handler.class" ]; then
        jar cfm java-snapstart.jar MANIFEST.MF com/example/*.class
    else
        # Create empty JAR with just manifest
        jar cfm java-snapstart.jar MANIFEST.MF
    fi
else
    # If jar command is not available, create a zip file renamed as jar
    echo "Creating placeholder JAR file..."
    echo "PK" > java-snapstart.jar  # Create minimal zip signature
fi

# Clean up
rm -rf com MANIFEST.MF

echo "JAR file created: java-snapstart.jar"