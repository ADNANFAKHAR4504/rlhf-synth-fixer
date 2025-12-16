#!/bin/bash

# Interactive script to copy archive content to root folder

echo "🗂️  Available archive options:"
echo ""

# List all directories in archive folder
options=($(ls -d archive/*/ | sed 's|archive/||g' | sed 's|/||g' | sort))

for i in "${!options[@]}"; do
    echo "$((i+1)). ${options[i]}"
done

echo ""
read -p "Select an option (1-${#options[@]}): " choice

# Validate choice
if [[ ! "$choice" =~ ^[0-9]+$ ]] || [ "$choice" -lt 1 ] || [ "$choice" -gt "${#options[@]}" ]; then
    echo "❌ Invalid choice. Please run the script again."
    exit 1
fi

selected_option="${options[$((choice-1))]}"
echo "✅ Selected: $selected_option"

# List available PR folders for the selected option
echo ""
echo "📁 Available PR numbers for $selected_option:"
echo ""

pr_folders=($(ls -d archive/$selected_option/Pr*/ 2>/dev/null | sed 's|archive/'$selected_option'/Pr||g' | sed 's|/||g' | sort -n))

if [ ${#pr_folders[@]} -eq 0 ]; then
    echo "❌ No PR folders found in archive/$selected_option/"
    exit 1
fi

for i in "${!pr_folders[@]}"; do
    echo "$((i+1)). PR${pr_folders[i]}"
done

echo ""
read -p "Select a PR number (1-${#pr_folders[@]}) or enter PR number directly: " pr_choice

# Validate PR choice - check if it's a direct PR number or index
if [[ ! "$pr_choice" =~ ^[0-9]+$ ]]; then
    echo "❌ Invalid choice. Please enter a number."
    exit 1
fi

# Check if input is a direct PR number (exists in pr_folders array)
selected_pr=""
for pr_num in "${pr_folders[@]}"; do
    if [ "$pr_choice" == "$pr_num" ]; then
        selected_pr="$pr_num"
        break
    fi
done

# If not found as direct PR number, treat as index
if [ -z "$selected_pr" ]; then
    if [ "$pr_choice" -lt 1 ] || [ "$pr_choice" -gt "${#pr_folders[@]}" ]; then
        echo "❌ Invalid choice. Please run the script again."
        exit 1
    fi
    selected_pr="${pr_folders[$((pr_choice-1))]}"
fi
source_path="archive/$selected_option/Pr$selected_pr"
echo "✅ Selected: PR$selected_pr"

# Confirm the copy operation
echo ""
echo "📋 Summary:"
echo "  Source: $source_path"
echo "  Target: . (root folder)"
echo ""
read -p "Do you want to proceed with copying? (y/N): " confirm

if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
    echo "❌ Operation cancelled."
    exit 0
fi

# Create backup of existing files if they exist
echo ""
echo "🔄 Starting copy operation..."

# Copy all contents except metadata.json to avoid overwriting it initially
echo "📂 Copying files..."
rsync -av --exclude='metadata.json' "$source_path/" .

# Handle metadata.json specially
if [ -f "$source_path/metadata.json" ]; then
    if [ -f "./metadata.json" ]; then
        echo "📝 Updating existing metadata.json with provider property..."
        # Read existing metadata, add provider property, and write back
        python3 -c "
import json
import sys

# Read source metadata
with open('$source_path/metadata.json', 'r') as f:
    source_metadata = json.load(f)

# Add provider property
source_metadata['provider'] = 'localstack'

# Write to root metadata.json
with open('./metadata.json', 'w') as f:
    json.dump(source_metadata, f, indent=2)

print('✅ metadata.json updated with provider: localstack')
"
    else
        echo "📝 Creating new metadata.json with provider property..."
        # Copy metadata and add provider property
        python3 -c "
import json

# Read source metadata
with open('$source_path/metadata.json', 'r') as f:
    metadata = json.load(f)

# Add provider property
metadata['provider'] = 'localstack'

# Write to root
with open('./metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2)

print('✅ metadata.json created with provider: localstack')
"
    fi
else
    echo "⚠️  No metadata.json found in source folder"
fi

echo ""
echo "🎉 Copy operation completed!"
echo "📁 Content from $source_path has been copied to the root folder"
echo "🔧 metadata.json has been updated with 'provider': 'localstack'"