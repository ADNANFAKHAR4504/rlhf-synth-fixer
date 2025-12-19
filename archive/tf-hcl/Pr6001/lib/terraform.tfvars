aws_region         = "ap-southeast-1"
environment_suffix = "prod"
cluster_name       = "eks-cluster"
kubernetes_version = "1.28"

vpc_cidr           = "10.0.0.0/16"
enable_nat_gateway = true
single_nat_gateway = false

system_node_group_instance_types = ["m5.large"]
system_node_group_desired_size   = 2
system_node_group_min_size       = 2
system_node_group_max_size       = 4

app_node_group_instance_types = ["t3.large", "t3a.large", "t2.large"]
app_node_group_desired_size   = 3
app_node_group_min_size       = 2
app_node_group_max_size       = 10

gpu_node_group_instance_types = ["g4dn.xlarge"]
gpu_node_group_desired_size   = 0
gpu_node_group_min_size       = 0
gpu_node_group_max_size       = 3

enable_cluster_autoscaler = true
enable_alb_controller     = true
enable_external_secrets   = true
enable_ebs_csi_driver     = true
enable_container_insights = true

cluster_endpoint_public_access  = true
cluster_endpoint_private_access = true
cluster_log_retention_days      = 7
enable_cluster_encryption       = true

namespaces = ["dev", "staging", "production"]
