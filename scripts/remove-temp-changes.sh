#!/bin/bash

# Script to remove all temporary cleanup changes before pushing to CI/CD
# Run this after successful local testing

echo "🧹 Removing temporary cleanup files and scripts..."

# Remove the temporary cleanup script
if [ -f "scripts/temp-cleanup-bootstrap.sh" ]; then
    echo "🗑️  Removing: scripts/temp-cleanup-bootstrap.sh"
    rm scripts/temp-cleanup-bootstrap.sh
else
    echo "ℹ️  File scripts/temp-cleanup-bootstrap.sh already removed"
fi

# Restore package.json (remove temporary scripts)
echo "📝 Restoring package.json..."
if grep -q "temp:cleanup-bootstrap" package.json; then
    # Remove the temporary lines from package.json
    sed -i '/temp:cleanup-bootstrap/d' package.json
    sed -i '/temp:deploy-clean/d' package.json
    echo "✅ Removed temporary scripts from package.json"
else
    echo "ℹ️  Temporary scripts already removed from package.json"
fi

echo ""
echo "🎉 CLEANUP COMPLETE!"
echo "📋 Summary of actions:"
echo "   ✅ Removed scripts/temp-cleanup-bootstrap.sh"
echo "   ✅ Removed temporary npm scripts from package.json"
echo ""
echo "🚀 Ready to commit and push to CI/CD!"
echo ""
