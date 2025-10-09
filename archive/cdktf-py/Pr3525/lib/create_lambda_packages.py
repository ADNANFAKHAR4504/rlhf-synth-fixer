#!/usr/bin/env python3
"""
Script to create Lambda deployment packages.
"""
import os
import zipfile

def create_lambda_package(source_file, output_file):
    """Create a ZIP file for Lambda deployment."""
    with zipfile.ZipFile(output_file, 'w', zipfile.ZIP_DEFLATED) as zipf:
        zipf.write(source_file, os.path.basename(source_file))
    print(f"Created Lambda package: {output_file}")

def main():
    """Create Lambda deployment packages."""
    lib_dir = os.path.dirname(os.path.abspath(__file__))

    # Create validation Lambda package
    create_lambda_package(
        os.path.join(lib_dir, 'lambda_validation.py'),
        os.path.join(lib_dir, 'lambda_validation.zip')
    )

    # Create workflow Lambda package
    create_lambda_package(
        os.path.join(lib_dir, 'lambda_workflow.py'),
        os.path.join(lib_dir, 'lambda_workflow.zip')
    )

if __name__ == '__main__':
    main()
