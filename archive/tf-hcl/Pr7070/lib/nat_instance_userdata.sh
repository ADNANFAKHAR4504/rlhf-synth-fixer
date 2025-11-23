#!/bin/bash
# NAT Instance User Data Script

# Update the system
yum update -y

# Enable IP forwarding
echo 'net.ipv4.ip_forward = 1' >> /etc/sysctl.conf
sysctl -p

# Configure iptables for NAT
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth0 -o eth1 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i eth1 -o eth0 -j ACCEPT

# Save iptables rules
service iptables save

# Install AWS CLI if not present
yum install -y awscli

# Associate the Elastic IP
aws ec2 associate-address --instance-id $(curl -s http://169.254.169.254/latest/meta-data/instance-id) --allocation-id ${eip_allocation_id} --region ${aws_region}

# Disable source/destination check
aws ec2 modify-instance-attribute --instance-id $(curl -s http://169.254.169.254/latest/meta-data/instance-id) --no-source-dest-check --region ${aws_region}

# Make iptables rules persistent on reboot
cat > /etc/rc.local << 'EOF'
#!/bin/bash
iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
iptables -A FORWARD -i eth0 -o eth1 -m state --state RELATED,ESTABLISHED -j ACCEPT
iptables -A FORWARD -i eth1 -o eth0 -j ACCEPT
EOF

chmod +x /etc/rc.local

# Enable and start necessary services
systemctl enable iptables
systemctl start iptables

# Configure CloudWatch monitoring
yum install -y amazon-cloudwatch-agent