aws_region         = "us-east-1"
environment_suffix = "synth101000770"
migration_phase    = "transition"

vpc_id     = "vpc-084784fec817a2784"
subnet_ids = ["subnet-0cf66cd821439cdc7", "subnet-072cc9718e5e749bf"]

availability_zones = ["us-east-1a", "us-east-1b"]

instance_type   = "t3.large"
ebs_volume_size = 100

on_premises_nfs_server = "10.0.0.100"
nfs_mount_path         = "/data/legacy-app"
