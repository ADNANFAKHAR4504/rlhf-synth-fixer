#!/bin/bash
# Extract code from MODEL_RESPONSE.md

FILE="lib/MODEL_RESPONSE.md"
CURRENT_FILE=""
IN_CODE_BLOCK=false

while IFS= read -r line; do
    # Check for file marker
    if [[ "$line" =~ ^##\ File:\ (.+)$ ]]; then
        CURRENT_FILE="${BASH_REMATCH[1]}"
        continue
    fi
    
    # Check for code block start
    if [[ "$line" =~ ^\`\`\`typescript$ ]] && [ -n "$CURRENT_FILE" ]; then
        IN_CODE_BLOCK=true
        # Create directory if needed
        mkdir -p "$(dirname "$CURRENT_FILE")"
        # Clear file
        > "$CURRENT_FILE"
        continue
    fi
    
    # Check for code block end
    if [[ "$line" =~ ^\`\`\`$ ]] && [ "$IN_CODE_BLOCK" = true ]; then
        IN_CODE_BLOCK=false
        echo "Extracted: $CURRENT_FILE"
        CURRENT_FILE=""
        continue
    fi
    
    # Write line to current file
    if [ "$IN_CODE_BLOCK" = true ] && [ -n "$CURRENT_FILE" ]; then
        echo "$line" >> "$CURRENT_FILE"
    fi
done < "$FILE"

echo "Code extraction complete"
