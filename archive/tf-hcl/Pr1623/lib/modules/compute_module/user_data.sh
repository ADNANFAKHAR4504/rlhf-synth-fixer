#!/bin/bash
apt-get update -y
apt-get install -y apache2

# Start and enable Apache
systemctl enable apache2
systemctl start apache2

# Create a simple HTML page with region information
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 600px; margin: 0 auto; text-align: center; }
        .region { color: #0066cc; font-size: 24px; font-weight: bold; }
        .info { background-color: #f0f8ff; padding: 20px; border-radius: 10px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to Multi-Region Web Application</h1>
        <div class="info">
            <p>You are being served from the <span class="region">${region_name}</span> region</p>
            <p>Instance ID: <span id="instance-id">Loading...</span></p>
            <p>Availability Zone: <span id="az">Loading...</span></p>
        </div>
        <p>This application demonstrates AWS multi-region deployment with automatic failover.</p>
    </div>
    
    <script>
        // Fetch instance metadata
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(error => document.getElementById('instance-id').textContent = 'N/A');
            
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(response => response.text())
            .then(data => document.getElementById('az').textContent = data)
            .catch(error => document.getElementById('az').textContent = 'N/A');
    </script>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html