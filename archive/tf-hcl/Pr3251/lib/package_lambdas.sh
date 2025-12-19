#!/bin/bash
set -e

# Create temporary directory for Lambda packaging
TEMP_DIR=$(mktemp -d)
echo "Using temp directory: $TEMP_DIR"

# Package quiz_processor Lambda
echo "Packaging quiz_processor Lambda..."
cp quiz_processor.py $TEMP_DIR/
python3 -m pip install -r lambda_requirements.txt -t $TEMP_DIR/ --quiet
cd $TEMP_DIR
zip -rq ../lambda_function.zip . -x "*.pyc" -x "__pycache__/*"
cd -
mv $TEMP_DIR/../lambda_function.zip .

# Clean up temp directory
rm -rf $TEMP_DIR

# Create new temp directory for health_check Lambda
TEMP_DIR=$(mktemp -d)
echo "Using temp directory for health_check: $TEMP_DIR"

# Package health_check Lambda
echo "Packaging health_check Lambda..."
cp health_check.py $TEMP_DIR/
python3 -m pip install -r lambda_requirements.txt -t $TEMP_DIR/ --quiet
cd $TEMP_DIR
zip -rq ../health_check.zip . -x "*.pyc" -x "__pycache__/*"
cd -
mv $TEMP_DIR/../health_check.zip .

# Clean up temp directory
rm -rf $TEMP_DIR

echo "Lambda functions packaged successfully!"