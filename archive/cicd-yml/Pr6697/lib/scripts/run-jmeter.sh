#!/bin/bash
set -euo pipefail

CONCURRENT_USERS=$1
TEST_PLAN="tests/performance/retail-platform.jmx"
REPORT_DIR="$BUILD_ARTIFACTSTAGINGDIRECTORY/jmeter-report"

echo "Running JMeter test with $CONCURRENT_USERS concurrent users..."

# Download and extract JMeter if not present
if [ ! -d "apache-jmeter" ]; then
    wget https://downloads.apache.org/jmeter/binaries/apache-jmeter-5.5.tgz
    tar -xzf apache-jmeter-5.5.tgz
    mv apache-jmeter-5.5 apache-jmeter
fi

# Run JMeter test
./apache-jmeter/bin/jmeter -n \
    -t "$TEST_PLAN" \
    -Jusers="$CONCURRENT_USERS" \
    -l results.jtl \
    -e -o "$REPORT_DIR"

# Check for errors
ERROR_RATE=$(grep false results.jtl | wc -l)
TOTAL_REQUESTS=$(wc -l < results.jtl)

if [ "$ERROR_RATE" -gt $((TOTAL_REQUESTS / 100)) ]; then
    echo "Error rate too high: $ERROR_RATE/$TOTAL_REQUESTS"
    exit 1
fi

echo "JMeter test completed successfully"