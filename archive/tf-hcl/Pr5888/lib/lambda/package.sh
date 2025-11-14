#!/bin/bash

# Package validation Lambda
cd $(dirname $0)
mkdir -p temp_validation
cp validation.py temp_validation/
cd temp_validation
zip -r ../validation.zip .
cd ..
rm -rf temp_validation

# Package processing Lambda
mkdir -p temp_processing
cp processing.py temp_processing/
cd temp_processing
zip -r ../processing.zip .
cd ..
rm -rf temp_processing

echo "Lambda functions packaged successfully"
