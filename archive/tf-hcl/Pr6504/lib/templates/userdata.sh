#!/bin/bash
set -o xtrace

/etc/eks/bootstrap.sh ${cluster_name} --b64-cluster-ca ${cluster_ca} --apiserver-endpoint ${cluster_endpoint} ${bootstrap_arguments}

# Enable SSM agent for troubleshooting
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent for enhanced monitoring
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure log rotation for kubelet logs
cat > /etc/logrotate.d/kubelet <<EOF
/var/log/kubelet.log {
    daily
    rotate 7
    compress
    missingok
    notifempty
}
EOF