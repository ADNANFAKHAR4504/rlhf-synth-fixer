#!/bin/bash
# User data script for web application instances
# This script installs and configures a web server with database connectivity

# Update system packages
yum update -y

# Install required packages
yum install -y httpd php php-mysqlnd mysql

# Start and enable Apache web server
systemctl start httpd
systemctl enable httpd

# Create a simple PHP application
cat > /var/www/html/index.php << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background-color: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
    </style>
</head>
<body>
    <div class="container">
        <h1>AWS Web Application</h1>
        <div class="info">
            <h2>Instance Information</h2>
            <p><strong>Instance ID:</strong> <?php echo $_SERVER['SERVER_NAME']; ?></p>
            <p><strong>Region:</strong> <?php echo file_get_contents('http://169.254.169.254/latest/meta-data/placement/region'); ?></p>
            <p><strong>Availability Zone:</strong> <?php echo file_get_contents('http://169.254.169.254/latest/meta-data/placement/availability-zone'); ?></p>
            <p><strong>Timestamp:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
        </div>
        
        <div class="info">
            <h2>Database Connection Test</h2>
            <?php
            $db_host = '${db_endpoint}';
            $db_name = '${db_name}';
            $db_user = '${db_username}';
            $db_pass = '${db_password}';
            
            try {
                $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_pass);
                $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
                echo '<div class="success">Database connection successful!</div>';
                
                // Test query
                $stmt = $pdo->query("SELECT VERSION() as version");
                $result = $stmt->fetch(PDO::FETCH_ASSOC);
                echo '<p><strong>MySQL Version:</strong> ' . $result['version'] . '</p>';
                
            } catch (PDOException $e) {
                echo '<div class="error">Database connection failed: ' . $e->getMessage() . '</div>';
            }
            ?>
        </div>
        
        <div class="info">
            <h2>Health Check</h2>
            <p>This page serves as a health check endpoint for the Application Load Balancer.</p>
            <p>If you can see this page, the instance is healthy and serving traffic.</p>
        </div>
    </div>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.php
chmod 644 /var/www/html/index.php

# Create a simple health check endpoint
cat > /var/www/html/health.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>Healthy</h1>
    <p>Instance is healthy and ready to serve traffic.</p>
</body>
</html>
EOF

# Configure Apache to serve the health check at root for ALB
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>Healthy</h1>
    <p>Instance is healthy and ready to serve traffic.</p>
</body>
</html>
EOF

# Restart Apache to apply changes
systemctl restart httpd

# Log the completion
echo "User data script completed at $(date)" >> /var/log/user-data.log
