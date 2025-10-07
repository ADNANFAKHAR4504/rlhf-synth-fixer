#!/bin/bash
# Setup script for Amazon Personalize resources
# These resources are not supported in Terraform AWS provider, so must be created via CLI

set -e

PROJECT_NAME="${PROJECT_NAME:-recommendation-system}"
REGION="${AWS_REGION:-us-east-1}"
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
S3_BUCKET="${PROJECT_NAME}-training-data-${ACCOUNT_ID}"
PERSONALIZE_ROLE_ARN="arn:aws:iam::${ACCOUNT_ID}:role/${PROJECT_NAME}-personalize"

echo "=========================================="
echo "Setting up Amazon Personalize Resources"
echo "=========================================="
echo "Project: ${PROJECT_NAME}"
echo "Region: ${REGION}"
echo "Account: ${ACCOUNT_ID}"
echo ""

# Step 1: Create Dataset Group
echo "[1/6] Creating Dataset Group..."
DATASET_GROUP_ARN=$(aws personalize create-dataset-group \
    --name "${PROJECT_NAME}-dataset-group" \
    --region ${REGION} \
    --query datasetGroupArn --output text 2>/dev/null || echo "")

if [ -z "$DATASET_GROUP_ARN" ]; then
    echo "Dataset group may already exist, attempting to retrieve..."
    DATASET_GROUP_ARN=$(aws personalize list-dataset-groups \
        --region ${REGION} \
        --query "datasetGroups[?name=='${PROJECT_NAME}-dataset-group'].datasetGroupArn" \
        --output text)
fi

echo "Dataset Group ARN: ${DATASET_GROUP_ARN}"

# Wait for dataset group to be active
echo "Waiting for dataset group to be active..."
aws personalize wait dataset-group-active --dataset-group-arn ${DATASET_GROUP_ARN} --region ${REGION}

# Step 2: Create Schema
echo "[2/6] Creating Interactions Schema..."
SCHEMA_JSON=$(cat <<EOF
{
  "type": "record",
  "name": "Interactions",
  "namespace": "com.amazonaws.personalize.schema",
  "fields": [
    {
      "name": "USER_ID",
      "type": "string"
    },
    {
      "name": "ITEM_ID",
      "type": "string"
    },
    {
      "name": "TIMESTAMP",
      "type": "long"
    },
    {
      "name": "EVENT_TYPE",
      "type": "string"
    }
  ],
  "version": "1.0"
}
EOF
)

SCHEMA_ARN=$(aws personalize create-schema \
    --name "${PROJECT_NAME}-interactions-schema" \
    --schema "${SCHEMA_JSON}" \
    --region ${REGION} \
    --query schemaArn --output text 2>/dev/null || echo "")

if [ -z "$SCHEMA_ARN" ]; then
    echo "Schema may already exist, attempting to retrieve..."
    SCHEMA_ARN=$(aws personalize list-schemas \
        --region ${REGION} \
        --query "schemas[?name=='${PROJECT_NAME}-interactions-schema'].schemaArn" \
        --output text)
fi

echo "Schema ARN: ${SCHEMA_ARN}"

# Step 3: Create Dataset
echo "[3/6] Creating Interactions Dataset..."
DATASET_ARN=$(aws personalize create-dataset \
    --name "${PROJECT_NAME}-interactions" \
    --dataset-group-arn ${DATASET_GROUP_ARN} \
    --dataset-type INTERACTIONS \
    --schema-arn ${SCHEMA_ARN} \
    --region ${REGION} \
    --query datasetArn --output text 2>/dev/null || echo "")

if [ -z "$DATASET_ARN" ]; then
    echo "Dataset may already exist, attempting to retrieve..."
    DATASET_ARN=$(aws personalize list-datasets \
        --dataset-group-arn ${DATASET_GROUP_ARN} \
        --region ${REGION} \
        --query "datasets[?name=='${PROJECT_NAME}-interactions'].datasetArn" \
        --output text)
fi

echo "Dataset ARN: ${DATASET_ARN}"

# Step 4: Create Dataset Import Job (assumes data exists in S3)
echo "[4/6] Creating Dataset Import Job..."
echo "Note: Ensure training data exists at s3://${S3_BUCKET}/personalize-data/interactions.csv"

IMPORT_JOB_ARN=$(aws personalize create-dataset-import-job \
    --job-name "${PROJECT_NAME}-import-$(date +%s)" \
    --dataset-arn ${DATASET_ARN} \
    --data-source "dataLocation=s3://${S3_BUCKET}/personalize-data/interactions.csv" \
    --role-arn ${PERSONALIZE_ROLE_ARN} \
    --region ${REGION} \
    --query datasetImportJobArn --output text 2>/dev/null || echo "")

if [ -n "$IMPORT_JOB_ARN" ]; then
    echo "Dataset Import Job ARN: ${IMPORT_JOB_ARN}"
    echo "Waiting for import job to complete (this may take several minutes)..."
    aws personalize wait dataset-import-job-active \
        --dataset-import-job-arn ${IMPORT_JOB_ARN} \
        --region ${REGION}
else
    echo "Skipping import job creation (may need to be done manually)"
fi

# Step 5: Create Solution
echo "[5/6] Creating Solution..."
SOLUTION_ARN=$(aws personalize create-solution \
    --name "${PROJECT_NAME}-solution" \
    --dataset-group-arn ${DATASET_GROUP_ARN} \
    --recipe-arn "arn:aws:personalize:::recipe/aws-user-personalization" \
    --region ${REGION} \
    --query solutionArn --output text 2>/dev/null || echo "")

if [ -z "$SOLUTION_ARN" ]; then
    echo "Solution may already exist, attempting to retrieve..."
    SOLUTION_ARN=$(aws personalize list-solutions \
        --dataset-group-arn ${DATASET_GROUP_ARN} \
        --region ${REGION} \
        --query "solutions[?name=='${PROJECT_NAME}-solution'].solutionArn" \
        --output text)
fi

echo "Solution ARN: ${SOLUTION_ARN}"

# Create Solution Version
echo "Creating Solution Version (training the model)..."
SOLUTION_VERSION_ARN=$(aws personalize create-solution-version \
    --solution-arn ${SOLUTION_ARN} \
    --region ${REGION} \
    --query solutionVersionArn --output text 2>/dev/null || echo "")

if [ -n "$SOLUTION_VERSION_ARN" ]; then
    echo "Solution Version ARN: ${SOLUTION_VERSION_ARN}"
    echo "Waiting for solution version to be active (this may take 1-2 hours)..."
    # Note: This is a long-running operation
    aws personalize wait solution-version-active \
        --solution-version-arn ${SOLUTION_VERSION_ARN} \
        --region ${REGION} || echo "Training in progress, check console for status"
fi

# Step 6: Create Campaign
echo "[6/6] Creating Campaign..."
CAMPAIGN_ARN=$(aws personalize create-campaign \
    --name "${PROJECT_NAME}-campaign" \
    --solution-version-arn ${SOLUTION_VERSION_ARN} \
    --min-provisioned-tps 1 \
    --region ${REGION} \
    --query campaignArn --output text 2>/dev/null || echo "")

if [ -z "$CAMPAIGN_ARN" ]; then
    echo "Campaign may already exist, attempting to retrieve..."
    CAMPAIGN_ARN=$(aws personalize list-campaigns \
        --solution-arn ${SOLUTION_ARN} \
        --region ${REGION} \
        --query "campaigns[?name=='${PROJECT_NAME}-campaign'].campaignArn" \
        --output text)
fi

echo "Campaign ARN: ${CAMPAIGN_ARN}"

if [ -n "$CAMPAIGN_ARN" ]; then
    echo "Waiting for campaign to be active..."
    aws personalize wait campaign-active \
        --campaign-arn ${CAMPAIGN_ARN} \
        --region ${REGION}
fi

# Summary
echo ""
echo "=========================================="
echo "Personalize Setup Complete!"
echo "=========================================="
echo ""
echo "📋 Resource ARNs:"
echo "Dataset Group: ${DATASET_GROUP_ARN}"
echo "Schema: ${SCHEMA_ARN}"
echo "Dataset: ${DATASET_ARN}"
echo "Solution: ${SOLUTION_ARN}"
echo "Campaign: ${CAMPAIGN_ARN}"
echo ""
echo "🔧 Next Steps:"
echo "1. Update Lambda environment variable:"
echo "   PERSONALIZE_CAMPAIGN_ARN=${CAMPAIGN_ARN}"
echo ""
echo "2. Export to use in Terraform:"
echo "   export TF_VAR_personalize_campaign_arn='${CAMPAIGN_ARN}'"
echo ""
echo "3. Test recommendations:"
echo "   aws personalize-runtime get-recommendations \\"
echo "     --campaign-arn ${CAMPAIGN_ARN} \\"
echo "     --user-id test-user-123 \\"
echo "     --num-results 10"
echo ""
