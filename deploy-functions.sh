#!/bin/bash

# Simple deployment script for Supabase Edge Functions
# This creates zip files that can be uploaded via the Supabase Dashboard

echo "Creating deployment packages for edge functions..."

# Create a temporary directory for deployment files
mkdir -p deploy

# Function to create deployment package
create_package() {
    local func_name=$1
    echo "Packaging $func_name..."

    cd supabase/functions
    zip -r "../../deploy/${func_name}.zip" "${func_name}/" "_shared/"
    cd ../..

    echo "✓ Created deploy/${func_name}.zip"
}

# Package each function
create_package "generate-daily-idea"
create_package "get-idea"
create_package "roast-idea"
create_package "chat"

echo ""
echo "✅ All packages created in ./deploy/"
echo ""
echo "Next steps:"
echo "1. Go to: https://supabase.com/dashboard/project/ujtlptjowaillhhqnwrb/functions"
echo "2. Click 'Deploy a new function'"
echo "3. Upload each .zip file from the deploy/ folder"
echo "4. Make sure to enable 'Import map' for npm dependencies"
