"""
create_lambda_package.py

Script to create Lambda deployment package with dependencies.
"""

import os
import subprocess
import zipfile
import shutil

def create_lambda_package():
    """Create Lambda deployment package with Pillow and dependencies."""

    # Create temp directory for package
    package_dir = 'lambda_package'
    if os.path.exists(package_dir):
        shutil.rmtree(package_dir)
    os.makedirs(package_dir)

    # Install Pillow and dependencies
    subprocess.run([
        'pip', 'install',
        '--target', package_dir,
        'Pillow==10.2.0',
        '--platform', 'manylinux2014_x86_64',
        '--only-binary', ':all:'
    ], check=True)

    # Copy Lambda handler
    shutil.copy('lambda_handler.py', os.path.join(package_dir, 'handler.py'))

    # Create ZIP file
    zip_file = 'lambda_code.zip'
    with zipfile.ZipFile(zip_file, 'w', zipfile.ZIP_DEFLATED) as zf:
        for root, dirs, files in os.walk(package_dir):
            for file in files:
                file_path = os.path.join(root, file)
                arcname = os.path.relpath(file_path, package_dir)
                zf.write(file_path, arcname)

    # Clean up
    shutil.rmtree(package_dir)

    print(f"Lambda package created: {zip_file}")

if __name__ == '__main__':
    create_lambda_package()
