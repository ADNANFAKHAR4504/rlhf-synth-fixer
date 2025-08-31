package imports.aws.eks_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.153Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksCluster.EksClusterConfig")
@software.amazon.jsii.Jsii.Proxy(EksClusterConfig.Jsii$Proxy.class)
public interface EksClusterConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#name EksCluster#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#role_arn EksCluster#role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRoleArn();

    /**
     * vpc_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#vpc_config EksCluster#vpc_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.eks_cluster.EksClusterVpcConfig getVpcConfig();

    /**
     * access_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#access_config EksCluster#access_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterAccessConfig getAccessConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getBootstrapSelfManagedAddons() {
        return null;
    }

    /**
     * compute_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#compute_config EksCluster#compute_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterComputeConfig getComputeConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled_cluster_log_types EksCluster#enabled_cluster_log_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getEnabledClusterLogTypes() {
        return null;
    }

    /**
     * encryption_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#encryption_config EksCluster#encryption_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterEncryptionConfig getEncryptionConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceUpdateVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#id EksCluster#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * kubernetes_network_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#kubernetes_network_config EksCluster#kubernetes_network_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig getKubernetesNetworkConfig() {
        return null;
    }

    /**
     * outpost_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_config EksCluster#outpost_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterOutpostConfig getOutpostConfig() {
        return null;
    }

    /**
     * remote_network_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_network_config EksCluster#remote_network_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterRemoteNetworkConfig getRemoteNetworkConfig() {
        return null;
    }

    /**
     * storage_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#storage_config EksCluster#storage_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterStorageConfig getStorageConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags EksCluster#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags_all EksCluster#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#timeouts EksCluster#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterTimeouts getTimeouts() {
        return null;
    }

    /**
     * upgrade_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#upgrade_policy EksCluster#upgrade_policy}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterUpgradePolicy getUpgradePolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#version EksCluster#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * zonal_shift_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#zonal_shift_config EksCluster#zonal_shift_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_cluster.EksClusterZonalShiftConfig getZonalShiftConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksClusterConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksClusterConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksClusterConfig> {
        java.lang.String name;
        java.lang.String roleArn;
        imports.aws.eks_cluster.EksClusterVpcConfig vpcConfig;
        imports.aws.eks_cluster.EksClusterAccessConfig accessConfig;
        java.lang.Object bootstrapSelfManagedAddons;
        imports.aws.eks_cluster.EksClusterComputeConfig computeConfig;
        java.util.List<java.lang.String> enabledClusterLogTypes;
        imports.aws.eks_cluster.EksClusterEncryptionConfig encryptionConfig;
        java.lang.Object forceUpdateVersion;
        java.lang.String id;
        imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig kubernetesNetworkConfig;
        imports.aws.eks_cluster.EksClusterOutpostConfig outpostConfig;
        imports.aws.eks_cluster.EksClusterRemoteNetworkConfig remoteNetworkConfig;
        imports.aws.eks_cluster.EksClusterStorageConfig storageConfig;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.eks_cluster.EksClusterTimeouts timeouts;
        imports.aws.eks_cluster.EksClusterUpgradePolicy upgradePolicy;
        java.lang.String version;
        imports.aws.eks_cluster.EksClusterZonalShiftConfig zonalShiftConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EksClusterConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#name EksCluster#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getRoleArn}
         * @param roleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#role_arn EksCluster#role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder roleArn(java.lang.String roleArn) {
            this.roleArn = roleArn;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getVpcConfig}
         * @param vpcConfig vpc_config block. This parameter is required.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#vpc_config EksCluster#vpc_config}
         * @return {@code this}
         */
        public Builder vpcConfig(imports.aws.eks_cluster.EksClusterVpcConfig vpcConfig) {
            this.vpcConfig = vpcConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getAccessConfig}
         * @param accessConfig access_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#access_config EksCluster#access_config}
         * @return {@code this}
         */
        public Builder accessConfig(imports.aws.eks_cluster.EksClusterAccessConfig accessConfig) {
            this.accessConfig = accessConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getBootstrapSelfManagedAddons}
         * @param bootstrapSelfManagedAddons Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.
         * @return {@code this}
         */
        public Builder bootstrapSelfManagedAddons(java.lang.Boolean bootstrapSelfManagedAddons) {
            this.bootstrapSelfManagedAddons = bootstrapSelfManagedAddons;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getBootstrapSelfManagedAddons}
         * @param bootstrapSelfManagedAddons Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#bootstrap_self_managed_addons EksCluster#bootstrap_self_managed_addons}.
         * @return {@code this}
         */
        public Builder bootstrapSelfManagedAddons(com.hashicorp.cdktf.IResolvable bootstrapSelfManagedAddons) {
            this.bootstrapSelfManagedAddons = bootstrapSelfManagedAddons;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getComputeConfig}
         * @param computeConfig compute_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#compute_config EksCluster#compute_config}
         * @return {@code this}
         */
        public Builder computeConfig(imports.aws.eks_cluster.EksClusterComputeConfig computeConfig) {
            this.computeConfig = computeConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getEnabledClusterLogTypes}
         * @param enabledClusterLogTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#enabled_cluster_log_types EksCluster#enabled_cluster_log_types}.
         * @return {@code this}
         */
        public Builder enabledClusterLogTypes(java.util.List<java.lang.String> enabledClusterLogTypes) {
            this.enabledClusterLogTypes = enabledClusterLogTypes;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getEncryptionConfig}
         * @param encryptionConfig encryption_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#encryption_config EksCluster#encryption_config}
         * @return {@code this}
         */
        public Builder encryptionConfig(imports.aws.eks_cluster.EksClusterEncryptionConfig encryptionConfig) {
            this.encryptionConfig = encryptionConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getForceUpdateVersion}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.
         * @return {@code this}
         */
        public Builder forceUpdateVersion(java.lang.Boolean forceUpdateVersion) {
            this.forceUpdateVersion = forceUpdateVersion;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getForceUpdateVersion}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#force_update_version EksCluster#force_update_version}.
         * @return {@code this}
         */
        public Builder forceUpdateVersion(com.hashicorp.cdktf.IResolvable forceUpdateVersion) {
            this.forceUpdateVersion = forceUpdateVersion;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#id EksCluster#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getKubernetesNetworkConfig}
         * @param kubernetesNetworkConfig kubernetes_network_config block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#kubernetes_network_config EksCluster#kubernetes_network_config}
         * @return {@code this}
         */
        public Builder kubernetesNetworkConfig(imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig kubernetesNetworkConfig) {
            this.kubernetesNetworkConfig = kubernetesNetworkConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getOutpostConfig}
         * @param outpostConfig outpost_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#outpost_config EksCluster#outpost_config}
         * @return {@code this}
         */
        public Builder outpostConfig(imports.aws.eks_cluster.EksClusterOutpostConfig outpostConfig) {
            this.outpostConfig = outpostConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getRemoteNetworkConfig}
         * @param remoteNetworkConfig remote_network_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#remote_network_config EksCluster#remote_network_config}
         * @return {@code this}
         */
        public Builder remoteNetworkConfig(imports.aws.eks_cluster.EksClusterRemoteNetworkConfig remoteNetworkConfig) {
            this.remoteNetworkConfig = remoteNetworkConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getStorageConfig}
         * @param storageConfig storage_config block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#storage_config EksCluster#storage_config}
         * @return {@code this}
         */
        public Builder storageConfig(imports.aws.eks_cluster.EksClusterStorageConfig storageConfig) {
            this.storageConfig = storageConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags EksCluster#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#tags_all EksCluster#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#timeouts EksCluster#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.eks_cluster.EksClusterTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getUpgradePolicy}
         * @param upgradePolicy upgrade_policy block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#upgrade_policy EksCluster#upgrade_policy}
         * @return {@code this}
         */
        public Builder upgradePolicy(imports.aws.eks_cluster.EksClusterUpgradePolicy upgradePolicy) {
            this.upgradePolicy = upgradePolicy;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#version EksCluster#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getZonalShiftConfig}
         * @param zonalShiftConfig zonal_shift_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_cluster#zonal_shift_config EksCluster#zonal_shift_config}
         * @return {@code this}
         */
        public Builder zonalShiftConfig(imports.aws.eks_cluster.EksClusterZonalShiftConfig zonalShiftConfig) {
            this.zonalShiftConfig = zonalShiftConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getDependsOn}
         * @param dependsOn the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder dependsOn(java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)dependsOn;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EksClusterConfig#getProvisioners}
         * @param provisioners the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        @SuppressWarnings("unchecked")
        public Builder provisioners(java.util.List<? extends java.lang.Object> provisioners) {
            this.provisioners = (java.util.List<java.lang.Object>)provisioners;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EksClusterConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksClusterConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksClusterConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksClusterConfig {
        private final java.lang.String name;
        private final java.lang.String roleArn;
        private final imports.aws.eks_cluster.EksClusterVpcConfig vpcConfig;
        private final imports.aws.eks_cluster.EksClusterAccessConfig accessConfig;
        private final java.lang.Object bootstrapSelfManagedAddons;
        private final imports.aws.eks_cluster.EksClusterComputeConfig computeConfig;
        private final java.util.List<java.lang.String> enabledClusterLogTypes;
        private final imports.aws.eks_cluster.EksClusterEncryptionConfig encryptionConfig;
        private final java.lang.Object forceUpdateVersion;
        private final java.lang.String id;
        private final imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig kubernetesNetworkConfig;
        private final imports.aws.eks_cluster.EksClusterOutpostConfig outpostConfig;
        private final imports.aws.eks_cluster.EksClusterRemoteNetworkConfig remoteNetworkConfig;
        private final imports.aws.eks_cluster.EksClusterStorageConfig storageConfig;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.eks_cluster.EksClusterTimeouts timeouts;
        private final imports.aws.eks_cluster.EksClusterUpgradePolicy upgradePolicy;
        private final java.lang.String version;
        private final imports.aws.eks_cluster.EksClusterZonalShiftConfig zonalShiftConfig;
        private final java.lang.Object connection;
        private final java.lang.Object count;
        private final java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        private final com.hashicorp.cdktf.ITerraformIterator forEach;
        private final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        private final com.hashicorp.cdktf.TerraformProvider provider;
        private final java.util.List<java.lang.Object> provisioners;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.roleArn = software.amazon.jsii.Kernel.get(this, "roleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcConfig = software.amazon.jsii.Kernel.get(this, "vpcConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterVpcConfig.class));
            this.accessConfig = software.amazon.jsii.Kernel.get(this, "accessConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterAccessConfig.class));
            this.bootstrapSelfManagedAddons = software.amazon.jsii.Kernel.get(this, "bootstrapSelfManagedAddons", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.computeConfig = software.amazon.jsii.Kernel.get(this, "computeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterComputeConfig.class));
            this.enabledClusterLogTypes = software.amazon.jsii.Kernel.get(this, "enabledClusterLogTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.encryptionConfig = software.amazon.jsii.Kernel.get(this, "encryptionConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterEncryptionConfig.class));
            this.forceUpdateVersion = software.amazon.jsii.Kernel.get(this, "forceUpdateVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kubernetesNetworkConfig = software.amazon.jsii.Kernel.get(this, "kubernetesNetworkConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig.class));
            this.outpostConfig = software.amazon.jsii.Kernel.get(this, "outpostConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterOutpostConfig.class));
            this.remoteNetworkConfig = software.amazon.jsii.Kernel.get(this, "remoteNetworkConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterRemoteNetworkConfig.class));
            this.storageConfig = software.amazon.jsii.Kernel.get(this, "storageConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterStorageConfig.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterTimeouts.class));
            this.upgradePolicy = software.amazon.jsii.Kernel.get(this, "upgradePolicy", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterUpgradePolicy.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.zonalShiftConfig = software.amazon.jsii.Kernel.get(this, "zonalShiftConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_cluster.EksClusterZonalShiftConfig.class));
            this.connection = software.amazon.jsii.Kernel.get(this, "connection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.count = software.amazon.jsii.Kernel.get(this, "count", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dependsOn = software.amazon.jsii.Kernel.get(this, "dependsOn", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformDependable.class)));
            this.forEach = software.amazon.jsii.Kernel.get(this, "forEach", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ITerraformIterator.class));
            this.lifecycle = software.amazon.jsii.Kernel.get(this, "lifecycle", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformResourceLifecycle.class));
            this.provider = software.amazon.jsii.Kernel.get(this, "provider", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.TerraformProvider.class));
            this.provisioners = software.amazon.jsii.Kernel.get(this, "provisioners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.roleArn = java.util.Objects.requireNonNull(builder.roleArn, "roleArn is required");
            this.vpcConfig = java.util.Objects.requireNonNull(builder.vpcConfig, "vpcConfig is required");
            this.accessConfig = builder.accessConfig;
            this.bootstrapSelfManagedAddons = builder.bootstrapSelfManagedAddons;
            this.computeConfig = builder.computeConfig;
            this.enabledClusterLogTypes = builder.enabledClusterLogTypes;
            this.encryptionConfig = builder.encryptionConfig;
            this.forceUpdateVersion = builder.forceUpdateVersion;
            this.id = builder.id;
            this.kubernetesNetworkConfig = builder.kubernetesNetworkConfig;
            this.outpostConfig = builder.outpostConfig;
            this.remoteNetworkConfig = builder.remoteNetworkConfig;
            this.storageConfig = builder.storageConfig;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.upgradePolicy = builder.upgradePolicy;
            this.version = builder.version;
            this.zonalShiftConfig = builder.zonalShiftConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRoleArn() {
            return this.roleArn;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterVpcConfig getVpcConfig() {
            return this.vpcConfig;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterAccessConfig getAccessConfig() {
            return this.accessConfig;
        }

        @Override
        public final java.lang.Object getBootstrapSelfManagedAddons() {
            return this.bootstrapSelfManagedAddons;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterComputeConfig getComputeConfig() {
            return this.computeConfig;
        }

        @Override
        public final java.util.List<java.lang.String> getEnabledClusterLogTypes() {
            return this.enabledClusterLogTypes;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterEncryptionConfig getEncryptionConfig() {
            return this.encryptionConfig;
        }

        @Override
        public final java.lang.Object getForceUpdateVersion() {
            return this.forceUpdateVersion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterKubernetesNetworkConfig getKubernetesNetworkConfig() {
            return this.kubernetesNetworkConfig;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterOutpostConfig getOutpostConfig() {
            return this.outpostConfig;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterRemoteNetworkConfig getRemoteNetworkConfig() {
            return this.remoteNetworkConfig;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterStorageConfig getStorageConfig() {
            return this.storageConfig;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterUpgradePolicy getUpgradePolicy() {
            return this.upgradePolicy;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
        }

        @Override
        public final imports.aws.eks_cluster.EksClusterZonalShiftConfig getZonalShiftConfig() {
            return this.zonalShiftConfig;
        }

        @Override
        public final java.lang.Object getConnection() {
            return this.connection;
        }

        @Override
        public final java.lang.Object getCount() {
            return this.count;
        }

        @Override
        public final java.util.List<com.hashicorp.cdktf.ITerraformDependable> getDependsOn() {
            return this.dependsOn;
        }

        @Override
        public final com.hashicorp.cdktf.ITerraformIterator getForEach() {
            return this.forEach;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformResourceLifecycle getLifecycle() {
            return this.lifecycle;
        }

        @Override
        public final com.hashicorp.cdktf.TerraformProvider getProvider() {
            return this.provider;
        }

        @Override
        public final java.util.List<java.lang.Object> getProvisioners() {
            return this.provisioners;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("roleArn", om.valueToTree(this.getRoleArn()));
            data.set("vpcConfig", om.valueToTree(this.getVpcConfig()));
            if (this.getAccessConfig() != null) {
                data.set("accessConfig", om.valueToTree(this.getAccessConfig()));
            }
            if (this.getBootstrapSelfManagedAddons() != null) {
                data.set("bootstrapSelfManagedAddons", om.valueToTree(this.getBootstrapSelfManagedAddons()));
            }
            if (this.getComputeConfig() != null) {
                data.set("computeConfig", om.valueToTree(this.getComputeConfig()));
            }
            if (this.getEnabledClusterLogTypes() != null) {
                data.set("enabledClusterLogTypes", om.valueToTree(this.getEnabledClusterLogTypes()));
            }
            if (this.getEncryptionConfig() != null) {
                data.set("encryptionConfig", om.valueToTree(this.getEncryptionConfig()));
            }
            if (this.getForceUpdateVersion() != null) {
                data.set("forceUpdateVersion", om.valueToTree(this.getForceUpdateVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getKubernetesNetworkConfig() != null) {
                data.set("kubernetesNetworkConfig", om.valueToTree(this.getKubernetesNetworkConfig()));
            }
            if (this.getOutpostConfig() != null) {
                data.set("outpostConfig", om.valueToTree(this.getOutpostConfig()));
            }
            if (this.getRemoteNetworkConfig() != null) {
                data.set("remoteNetworkConfig", om.valueToTree(this.getRemoteNetworkConfig()));
            }
            if (this.getStorageConfig() != null) {
                data.set("storageConfig", om.valueToTree(this.getStorageConfig()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUpgradePolicy() != null) {
                data.set("upgradePolicy", om.valueToTree(this.getUpgradePolicy()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
            }
            if (this.getZonalShiftConfig() != null) {
                data.set("zonalShiftConfig", om.valueToTree(this.getZonalShiftConfig()));
            }
            if (this.getConnection() != null) {
                data.set("connection", om.valueToTree(this.getConnection()));
            }
            if (this.getCount() != null) {
                data.set("count", om.valueToTree(this.getCount()));
            }
            if (this.getDependsOn() != null) {
                data.set("dependsOn", om.valueToTree(this.getDependsOn()));
            }
            if (this.getForEach() != null) {
                data.set("forEach", om.valueToTree(this.getForEach()));
            }
            if (this.getLifecycle() != null) {
                data.set("lifecycle", om.valueToTree(this.getLifecycle()));
            }
            if (this.getProvider() != null) {
                data.set("provider", om.valueToTree(this.getProvider()));
            }
            if (this.getProvisioners() != null) {
                data.set("provisioners", om.valueToTree(this.getProvisioners()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.eksCluster.EksClusterConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksClusterConfig.Jsii$Proxy that = (EksClusterConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!roleArn.equals(that.roleArn)) return false;
            if (!vpcConfig.equals(that.vpcConfig)) return false;
            if (this.accessConfig != null ? !this.accessConfig.equals(that.accessConfig) : that.accessConfig != null) return false;
            if (this.bootstrapSelfManagedAddons != null ? !this.bootstrapSelfManagedAddons.equals(that.bootstrapSelfManagedAddons) : that.bootstrapSelfManagedAddons != null) return false;
            if (this.computeConfig != null ? !this.computeConfig.equals(that.computeConfig) : that.computeConfig != null) return false;
            if (this.enabledClusterLogTypes != null ? !this.enabledClusterLogTypes.equals(that.enabledClusterLogTypes) : that.enabledClusterLogTypes != null) return false;
            if (this.encryptionConfig != null ? !this.encryptionConfig.equals(that.encryptionConfig) : that.encryptionConfig != null) return false;
            if (this.forceUpdateVersion != null ? !this.forceUpdateVersion.equals(that.forceUpdateVersion) : that.forceUpdateVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.kubernetesNetworkConfig != null ? !this.kubernetesNetworkConfig.equals(that.kubernetesNetworkConfig) : that.kubernetesNetworkConfig != null) return false;
            if (this.outpostConfig != null ? !this.outpostConfig.equals(that.outpostConfig) : that.outpostConfig != null) return false;
            if (this.remoteNetworkConfig != null ? !this.remoteNetworkConfig.equals(that.remoteNetworkConfig) : that.remoteNetworkConfig != null) return false;
            if (this.storageConfig != null ? !this.storageConfig.equals(that.storageConfig) : that.storageConfig != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.upgradePolicy != null ? !this.upgradePolicy.equals(that.upgradePolicy) : that.upgradePolicy != null) return false;
            if (this.version != null ? !this.version.equals(that.version) : that.version != null) return false;
            if (this.zonalShiftConfig != null ? !this.zonalShiftConfig.equals(that.zonalShiftConfig) : that.zonalShiftConfig != null) return false;
            if (this.connection != null ? !this.connection.equals(that.connection) : that.connection != null) return false;
            if (this.count != null ? !this.count.equals(that.count) : that.count != null) return false;
            if (this.dependsOn != null ? !this.dependsOn.equals(that.dependsOn) : that.dependsOn != null) return false;
            if (this.forEach != null ? !this.forEach.equals(that.forEach) : that.forEach != null) return false;
            if (this.lifecycle != null ? !this.lifecycle.equals(that.lifecycle) : that.lifecycle != null) return false;
            if (this.provider != null ? !this.provider.equals(that.provider) : that.provider != null) return false;
            return this.provisioners != null ? this.provisioners.equals(that.provisioners) : that.provisioners == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.roleArn.hashCode());
            result = 31 * result + (this.vpcConfig.hashCode());
            result = 31 * result + (this.accessConfig != null ? this.accessConfig.hashCode() : 0);
            result = 31 * result + (this.bootstrapSelfManagedAddons != null ? this.bootstrapSelfManagedAddons.hashCode() : 0);
            result = 31 * result + (this.computeConfig != null ? this.computeConfig.hashCode() : 0);
            result = 31 * result + (this.enabledClusterLogTypes != null ? this.enabledClusterLogTypes.hashCode() : 0);
            result = 31 * result + (this.encryptionConfig != null ? this.encryptionConfig.hashCode() : 0);
            result = 31 * result + (this.forceUpdateVersion != null ? this.forceUpdateVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.kubernetesNetworkConfig != null ? this.kubernetesNetworkConfig.hashCode() : 0);
            result = 31 * result + (this.outpostConfig != null ? this.outpostConfig.hashCode() : 0);
            result = 31 * result + (this.remoteNetworkConfig != null ? this.remoteNetworkConfig.hashCode() : 0);
            result = 31 * result + (this.storageConfig != null ? this.storageConfig.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.upgradePolicy != null ? this.upgradePolicy.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
            result = 31 * result + (this.zonalShiftConfig != null ? this.zonalShiftConfig.hashCode() : 0);
            result = 31 * result + (this.connection != null ? this.connection.hashCode() : 0);
            result = 31 * result + (this.count != null ? this.count.hashCode() : 0);
            result = 31 * result + (this.dependsOn != null ? this.dependsOn.hashCode() : 0);
            result = 31 * result + (this.forEach != null ? this.forEach.hashCode() : 0);
            result = 31 * result + (this.lifecycle != null ? this.lifecycle.hashCode() : 0);
            result = 31 * result + (this.provider != null ? this.provider.hashCode() : 0);
            result = 31 * result + (this.provisioners != null ? this.provisioners.hashCode() : 0);
            return result;
        }
    }
}
