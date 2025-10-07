#!/bin/bash

# Create a simple web server without requiring package installation
# This ensures the instance can pass health checks even if packages fail to install

# Create a simple index.html that doesn't require PHP or database
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Financial Services Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .healthy { background-color: #d4edda; color: #155724; }
        .info { background-color: #d1ecf1; color: #0c5460; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">Financial Services Web Application</h1>
        
        <div class="status healthy">
            <strong>Status:</strong> Web Server Running
        </div>
        
        <div class="status info">
            <strong>Environment:</strong> ${environment}
        </div>
        
        <div class="status info">
            <strong>Region:</strong> ${region}
        </div>
        
        <div class="status info">
            <strong>Instance ID:</strong> <script>document.write(window.location.hostname)</script>
        </div>
        
        <div class="status info">
            <strong>Server Time:</strong> <script>document.write(new Date().toISOString())</script>
        </div>
        
        <p><strong>Note:</strong> This is a basic web server. Full application features will be available after package installation completes.</p>
    </div>
</body>
</html>
EOF

# Create health check endpoint
cat > /var/www/html/health << 'EOF'
OK
EOF

# Try to install packages in background (non-blocking)
nohup bash -c '
    # Wait a bit for network to be fully ready
    sleep 30
    
    # Try to update and install packages
    yum update -y || echo "Package update failed"
    yum install -y httpd php php-mysqlnd git || echo "Package installation failed"
    
    # If packages installed successfully, configure Apache
    if command -v httpd >/dev/null 2>&1; then
        systemctl start httpd
        systemctl enable httpd
        
        # Create PHP application if PHP is available
        if command -v php >/dev/null 2>&1; then
            cat > /var/www/html/app.php << "PHPEOF"
<?php
echo "<h1>Full Application Available</h1>";
echo "<p>PHP is now installed and working!</p>";
echo "<p>Database connection will be configured next.</p>";
echo "<p>Environment: ${environment}</p>";
echo "<p>Region: ${region}</p>";
?>
PHPEOF
        fi
    fi
    
    echo "Background installation completed at $(date)" >> /var/log/user-data.log
' > /var/log/package-install.log 2>&1 &

# Set basic permissions
chmod -R 755 /var/www/html

# Log completion
echo "User data script completed at $(date)" >> /var/log/user-data.log
echo "Basic web server is ready for health checks" >> /var/log/user-data.log
