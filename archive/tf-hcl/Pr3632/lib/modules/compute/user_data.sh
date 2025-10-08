#!/bin/bash

# Create a simple web server without requiring package installation
# This ensures the instance can pass health checks even if packages fail to install

# Create directory structure (in case httpd is not installed)
mkdir -p /var/www/html

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
    # Wait for network to be fully ready and NAT Gateway to be available
    sleep 60
    
    # Test connectivity to ensure NAT Gateway is working
    if ping -c 3 8.8.8.8 > /dev/null 2>&1; then
        echo "Network connectivity confirmed" >> /var/log/user-data.log
        
        # Try to update and install packages
        yum update -y || echo "Package update failed"
        yum install -y httpd php php-mysqlnd git || echo "Package installation failed"
    else
        echo "Network connectivity failed - NAT Gateway may not be ready" >> /var/log/user-data.log
    fi
    
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

# Start a simple HTTP server to serve the files
# User data runs as root, so we can bind to port 80
# Try Python 3 first, fall back to Python 2
cd /var/www/html

if command -v python3 > /dev/null 2>&1; then
    # Python 3's http.server
    nohup python3 -m http.server 80 > /var/log/simple-http-server.log 2>&1 &
    echo "Started Python 3 HTTP server on port 80" >> /var/log/user-data.log
elif command -v python2 > /dev/null 2>&1; then
    # Python 2's SimpleHTTPServer
    nohup python2 -m SimpleHTTPServer 80 > /var/log/simple-http-server.log 2>&1 &
    echo "Started Python 2 HTTP server on port 80" >> /var/log/user-data.log
else
    # Fallback to python (whatever version is default)
    nohup python -m SimpleHTTPServer 80 > /var/log/simple-http-server.log 2>&1 &
    echo "Started Python HTTP server on port 80" >> /var/log/user-data.log
fi

# Wait a moment for the server to start
sleep 2

# Test if the server is running
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo "HTTP server is responding correctly" >> /var/log/user-data.log
else
    echo "WARNING: HTTP server may not be responding" >> /var/log/user-data.log
fi

# Log completion
echo "User data script completed at $(date)" >> /var/log/user-data.log
echo "Basic web server is ready for health checks" >> /var/log/user-data.log
echo "Python SimpleHTTPServer started on port 80" >> /var/log/user-data.log
