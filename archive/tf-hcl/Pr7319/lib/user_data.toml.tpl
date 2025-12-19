[settings.kubernetes]
cluster-name = "${cluster_name}"
api-server = "${cluster_endpoint}"
cluster-certificate = "${cluster_ca}"

[settings.kubernetes.node-labels]
"environment" = "production"

[settings.kubernetes.node-taints]
