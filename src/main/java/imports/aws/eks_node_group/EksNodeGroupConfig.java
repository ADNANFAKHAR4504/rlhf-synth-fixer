package imports.aws.eks_node_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.160Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eksNodeGroup.EksNodeGroupConfig")
@software.amazon.jsii.Jsii.Proxy(EksNodeGroupConfig.Jsii$Proxy.class)
public interface EksNodeGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#cluster_name EksNodeGroup#cluster_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getClusterName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_role_arn EksNodeGroup#node_role_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNodeRoleArn();

    /**
     * scaling_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#scaling_config EksNodeGroup#scaling_config}
     */
    @org.jetbrains.annotations.NotNull imports.aws.eks_node_group.EksNodeGroupScalingConfig getScalingConfig();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#subnet_ids EksNodeGroup#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#ami_type EksNodeGroup#ami_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAmiType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#capacity_type EksNodeGroup#capacity_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCapacityType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#disk_size EksNodeGroup#disk_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDiskSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#force_update_version EksNodeGroup#force_update_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getForceUpdateVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#id EksNodeGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#instance_types EksNodeGroup#instance_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getInstanceTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#labels EksNodeGroup#labels}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getLabels() {
        return null;
    }

    /**
     * launch_template block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#launch_template EksNodeGroup#launch_template}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupLaunchTemplate getLaunchTemplate() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name EksNodeGroup#node_group_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeGroupName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name_prefix EksNodeGroup#node_group_name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNodeGroupNamePrefix() {
        return null;
    }

    /**
     * node_repair_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_repair_config EksNodeGroup#node_repair_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig getNodeRepairConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#release_version EksNodeGroup#release_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReleaseVersion() {
        return null;
    }

    /**
     * remote_access block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#remote_access EksNodeGroup#remote_access}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupRemoteAccess getRemoteAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags EksNodeGroup#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags_all EksNodeGroup#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * taint block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#taint EksNodeGroup#taint}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTaint() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#timeouts EksNodeGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * update_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#update_config EksNodeGroup#update_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eks_node_group.EksNodeGroupUpdateConfig getUpdateConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#version EksNodeGroup#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EksNodeGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EksNodeGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EksNodeGroupConfig> {
        java.lang.String clusterName;
        java.lang.String nodeRoleArn;
        imports.aws.eks_node_group.EksNodeGroupScalingConfig scalingConfig;
        java.util.List<java.lang.String> subnetIds;
        java.lang.String amiType;
        java.lang.String capacityType;
        java.lang.Number diskSize;
        java.lang.Object forceUpdateVersion;
        java.lang.String id;
        java.util.List<java.lang.String> instanceTypes;
        java.util.Map<java.lang.String, java.lang.String> labels;
        imports.aws.eks_node_group.EksNodeGroupLaunchTemplate launchTemplate;
        java.lang.String nodeGroupName;
        java.lang.String nodeGroupNamePrefix;
        imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig nodeRepairConfig;
        java.lang.String releaseVersion;
        imports.aws.eks_node_group.EksNodeGroupRemoteAccess remoteAccess;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object taint;
        imports.aws.eks_node_group.EksNodeGroupTimeouts timeouts;
        imports.aws.eks_node_group.EksNodeGroupUpdateConfig updateConfig;
        java.lang.String version;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EksNodeGroupConfig#getClusterName}
         * @param clusterName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#cluster_name EksNodeGroup#cluster_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder clusterName(java.lang.String clusterName) {
            this.clusterName = clusterName;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getNodeRoleArn}
         * @param nodeRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_role_arn EksNodeGroup#node_role_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder nodeRoleArn(java.lang.String nodeRoleArn) {
            this.nodeRoleArn = nodeRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getScalingConfig}
         * @param scalingConfig scaling_config block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#scaling_config EksNodeGroup#scaling_config}
         * @return {@code this}
         */
        public Builder scalingConfig(imports.aws.eks_node_group.EksNodeGroupScalingConfig scalingConfig) {
            this.scalingConfig = scalingConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#subnet_ids EksNodeGroup#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getAmiType}
         * @param amiType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#ami_type EksNodeGroup#ami_type}.
         * @return {@code this}
         */
        public Builder amiType(java.lang.String amiType) {
            this.amiType = amiType;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getCapacityType}
         * @param capacityType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#capacity_type EksNodeGroup#capacity_type}.
         * @return {@code this}
         */
        public Builder capacityType(java.lang.String capacityType) {
            this.capacityType = capacityType;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getDiskSize}
         * @param diskSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#disk_size EksNodeGroup#disk_size}.
         * @return {@code this}
         */
        public Builder diskSize(java.lang.Number diskSize) {
            this.diskSize = diskSize;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getForceUpdateVersion}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#force_update_version EksNodeGroup#force_update_version}.
         * @return {@code this}
         */
        public Builder forceUpdateVersion(java.lang.Boolean forceUpdateVersion) {
            this.forceUpdateVersion = forceUpdateVersion;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getForceUpdateVersion}
         * @param forceUpdateVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#force_update_version EksNodeGroup#force_update_version}.
         * @return {@code this}
         */
        public Builder forceUpdateVersion(com.hashicorp.cdktf.IResolvable forceUpdateVersion) {
            this.forceUpdateVersion = forceUpdateVersion;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#id EksNodeGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getInstanceTypes}
         * @param instanceTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#instance_types EksNodeGroup#instance_types}.
         * @return {@code this}
         */
        public Builder instanceTypes(java.util.List<java.lang.String> instanceTypes) {
            this.instanceTypes = instanceTypes;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getLabels}
         * @param labels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#labels EksNodeGroup#labels}.
         * @return {@code this}
         */
        public Builder labels(java.util.Map<java.lang.String, java.lang.String> labels) {
            this.labels = labels;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getLaunchTemplate}
         * @param launchTemplate launch_template block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#launch_template EksNodeGroup#launch_template}
         * @return {@code this}
         */
        public Builder launchTemplate(imports.aws.eks_node_group.EksNodeGroupLaunchTemplate launchTemplate) {
            this.launchTemplate = launchTemplate;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getNodeGroupName}
         * @param nodeGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name EksNodeGroup#node_group_name}.
         * @return {@code this}
         */
        public Builder nodeGroupName(java.lang.String nodeGroupName) {
            this.nodeGroupName = nodeGroupName;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getNodeGroupNamePrefix}
         * @param nodeGroupNamePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_group_name_prefix EksNodeGroup#node_group_name_prefix}.
         * @return {@code this}
         */
        public Builder nodeGroupNamePrefix(java.lang.String nodeGroupNamePrefix) {
            this.nodeGroupNamePrefix = nodeGroupNamePrefix;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getNodeRepairConfig}
         * @param nodeRepairConfig node_repair_config block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#node_repair_config EksNodeGroup#node_repair_config}
         * @return {@code this}
         */
        public Builder nodeRepairConfig(imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig nodeRepairConfig) {
            this.nodeRepairConfig = nodeRepairConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getReleaseVersion}
         * @param releaseVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#release_version EksNodeGroup#release_version}.
         * @return {@code this}
         */
        public Builder releaseVersion(java.lang.String releaseVersion) {
            this.releaseVersion = releaseVersion;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getRemoteAccess}
         * @param remoteAccess remote_access block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#remote_access EksNodeGroup#remote_access}
         * @return {@code this}
         */
        public Builder remoteAccess(imports.aws.eks_node_group.EksNodeGroupRemoteAccess remoteAccess) {
            this.remoteAccess = remoteAccess;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags EksNodeGroup#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#tags_all EksNodeGroup#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getTaint}
         * @param taint taint block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#taint EksNodeGroup#taint}
         * @return {@code this}
         */
        public Builder taint(com.hashicorp.cdktf.IResolvable taint) {
            this.taint = taint;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getTaint}
         * @param taint taint block.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#taint EksNodeGroup#taint}
         * @return {@code this}
         */
        public Builder taint(java.util.List<? extends imports.aws.eks_node_group.EksNodeGroupTaint> taint) {
            this.taint = taint;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#timeouts EksNodeGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.eks_node_group.EksNodeGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getUpdateConfig}
         * @param updateConfig update_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#update_config EksNodeGroup#update_config}
         * @return {@code this}
         */
        public Builder updateConfig(imports.aws.eks_node_group.EksNodeGroupUpdateConfig updateConfig) {
            this.updateConfig = updateConfig;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eks_node_group#version EksNodeGroup#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getDependsOn}
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
         * Sets the value of {@link EksNodeGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EksNodeGroupConfig#getProvisioners}
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
         * @return a new instance of {@link EksNodeGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EksNodeGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EksNodeGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EksNodeGroupConfig {
        private final java.lang.String clusterName;
        private final java.lang.String nodeRoleArn;
        private final imports.aws.eks_node_group.EksNodeGroupScalingConfig scalingConfig;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String amiType;
        private final java.lang.String capacityType;
        private final java.lang.Number diskSize;
        private final java.lang.Object forceUpdateVersion;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> instanceTypes;
        private final java.util.Map<java.lang.String, java.lang.String> labels;
        private final imports.aws.eks_node_group.EksNodeGroupLaunchTemplate launchTemplate;
        private final java.lang.String nodeGroupName;
        private final java.lang.String nodeGroupNamePrefix;
        private final imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig nodeRepairConfig;
        private final java.lang.String releaseVersion;
        private final imports.aws.eks_node_group.EksNodeGroupRemoteAccess remoteAccess;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object taint;
        private final imports.aws.eks_node_group.EksNodeGroupTimeouts timeouts;
        private final imports.aws.eks_node_group.EksNodeGroupUpdateConfig updateConfig;
        private final java.lang.String version;
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
            this.clusterName = software.amazon.jsii.Kernel.get(this, "clusterName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeRoleArn = software.amazon.jsii.Kernel.get(this, "nodeRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.scalingConfig = software.amazon.jsii.Kernel.get(this, "scalingConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupScalingConfig.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.amiType = software.amazon.jsii.Kernel.get(this, "amiType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.capacityType = software.amazon.jsii.Kernel.get(this, "capacityType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.diskSize = software.amazon.jsii.Kernel.get(this, "diskSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.forceUpdateVersion = software.amazon.jsii.Kernel.get(this, "forceUpdateVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instanceTypes = software.amazon.jsii.Kernel.get(this, "instanceTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.labels = software.amazon.jsii.Kernel.get(this, "labels", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.launchTemplate = software.amazon.jsii.Kernel.get(this, "launchTemplate", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupLaunchTemplate.class));
            this.nodeGroupName = software.amazon.jsii.Kernel.get(this, "nodeGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeGroupNamePrefix = software.amazon.jsii.Kernel.get(this, "nodeGroupNamePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.nodeRepairConfig = software.amazon.jsii.Kernel.get(this, "nodeRepairConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig.class));
            this.releaseVersion = software.amazon.jsii.Kernel.get(this, "releaseVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.remoteAccess = software.amazon.jsii.Kernel.get(this, "remoteAccess", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupRemoteAccess.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.taint = software.amazon.jsii.Kernel.get(this, "taint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupTimeouts.class));
            this.updateConfig = software.amazon.jsii.Kernel.get(this, "updateConfig", software.amazon.jsii.NativeType.forClass(imports.aws.eks_node_group.EksNodeGroupUpdateConfig.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.clusterName = java.util.Objects.requireNonNull(builder.clusterName, "clusterName is required");
            this.nodeRoleArn = java.util.Objects.requireNonNull(builder.nodeRoleArn, "nodeRoleArn is required");
            this.scalingConfig = java.util.Objects.requireNonNull(builder.scalingConfig, "scalingConfig is required");
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.amiType = builder.amiType;
            this.capacityType = builder.capacityType;
            this.diskSize = builder.diskSize;
            this.forceUpdateVersion = builder.forceUpdateVersion;
            this.id = builder.id;
            this.instanceTypes = builder.instanceTypes;
            this.labels = builder.labels;
            this.launchTemplate = builder.launchTemplate;
            this.nodeGroupName = builder.nodeGroupName;
            this.nodeGroupNamePrefix = builder.nodeGroupNamePrefix;
            this.nodeRepairConfig = builder.nodeRepairConfig;
            this.releaseVersion = builder.releaseVersion;
            this.remoteAccess = builder.remoteAccess;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.taint = builder.taint;
            this.timeouts = builder.timeouts;
            this.updateConfig = builder.updateConfig;
            this.version = builder.version;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getClusterName() {
            return this.clusterName;
        }

        @Override
        public final java.lang.String getNodeRoleArn() {
            return this.nodeRoleArn;
        }

        @Override
        public final imports.aws.eks_node_group.EksNodeGroupScalingConfig getScalingConfig() {
            return this.scalingConfig;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getAmiType() {
            return this.amiType;
        }

        @Override
        public final java.lang.String getCapacityType() {
            return this.capacityType;
        }

        @Override
        public final java.lang.Number getDiskSize() {
            return this.diskSize;
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
        public final java.util.List<java.lang.String> getInstanceTypes() {
            return this.instanceTypes;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getLabels() {
            return this.labels;
        }

        @Override
        public final imports.aws.eks_node_group.EksNodeGroupLaunchTemplate getLaunchTemplate() {
            return this.launchTemplate;
        }

        @Override
        public final java.lang.String getNodeGroupName() {
            return this.nodeGroupName;
        }

        @Override
        public final java.lang.String getNodeGroupNamePrefix() {
            return this.nodeGroupNamePrefix;
        }

        @Override
        public final imports.aws.eks_node_group.EksNodeGroupNodeRepairConfig getNodeRepairConfig() {
            return this.nodeRepairConfig;
        }

        @Override
        public final java.lang.String getReleaseVersion() {
            return this.releaseVersion;
        }

        @Override
        public final imports.aws.eks_node_group.EksNodeGroupRemoteAccess getRemoteAccess() {
            return this.remoteAccess;
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
        public final java.lang.Object getTaint() {
            return this.taint;
        }

        @Override
        public final imports.aws.eks_node_group.EksNodeGroupTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final imports.aws.eks_node_group.EksNodeGroupUpdateConfig getUpdateConfig() {
            return this.updateConfig;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
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

            data.set("clusterName", om.valueToTree(this.getClusterName()));
            data.set("nodeRoleArn", om.valueToTree(this.getNodeRoleArn()));
            data.set("scalingConfig", om.valueToTree(this.getScalingConfig()));
            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            if (this.getAmiType() != null) {
                data.set("amiType", om.valueToTree(this.getAmiType()));
            }
            if (this.getCapacityType() != null) {
                data.set("capacityType", om.valueToTree(this.getCapacityType()));
            }
            if (this.getDiskSize() != null) {
                data.set("diskSize", om.valueToTree(this.getDiskSize()));
            }
            if (this.getForceUpdateVersion() != null) {
                data.set("forceUpdateVersion", om.valueToTree(this.getForceUpdateVersion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstanceTypes() != null) {
                data.set("instanceTypes", om.valueToTree(this.getInstanceTypes()));
            }
            if (this.getLabels() != null) {
                data.set("labels", om.valueToTree(this.getLabels()));
            }
            if (this.getLaunchTemplate() != null) {
                data.set("launchTemplate", om.valueToTree(this.getLaunchTemplate()));
            }
            if (this.getNodeGroupName() != null) {
                data.set("nodeGroupName", om.valueToTree(this.getNodeGroupName()));
            }
            if (this.getNodeGroupNamePrefix() != null) {
                data.set("nodeGroupNamePrefix", om.valueToTree(this.getNodeGroupNamePrefix()));
            }
            if (this.getNodeRepairConfig() != null) {
                data.set("nodeRepairConfig", om.valueToTree(this.getNodeRepairConfig()));
            }
            if (this.getReleaseVersion() != null) {
                data.set("releaseVersion", om.valueToTree(this.getReleaseVersion()));
            }
            if (this.getRemoteAccess() != null) {
                data.set("remoteAccess", om.valueToTree(this.getRemoteAccess()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTaint() != null) {
                data.set("taint", om.valueToTree(this.getTaint()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getUpdateConfig() != null) {
                data.set("updateConfig", om.valueToTree(this.getUpdateConfig()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
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
            struct.set("fqn", om.valueToTree("aws.eksNodeGroup.EksNodeGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EksNodeGroupConfig.Jsii$Proxy that = (EksNodeGroupConfig.Jsii$Proxy) o;

            if (!clusterName.equals(that.clusterName)) return false;
            if (!nodeRoleArn.equals(that.nodeRoleArn)) return false;
            if (!scalingConfig.equals(that.scalingConfig)) return false;
            if (!subnetIds.equals(that.subnetIds)) return false;
            if (this.amiType != null ? !this.amiType.equals(that.amiType) : that.amiType != null) return false;
            if (this.capacityType != null ? !this.capacityType.equals(that.capacityType) : that.capacityType != null) return false;
            if (this.diskSize != null ? !this.diskSize.equals(that.diskSize) : that.diskSize != null) return false;
            if (this.forceUpdateVersion != null ? !this.forceUpdateVersion.equals(that.forceUpdateVersion) : that.forceUpdateVersion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instanceTypes != null ? !this.instanceTypes.equals(that.instanceTypes) : that.instanceTypes != null) return false;
            if (this.labels != null ? !this.labels.equals(that.labels) : that.labels != null) return false;
            if (this.launchTemplate != null ? !this.launchTemplate.equals(that.launchTemplate) : that.launchTemplate != null) return false;
            if (this.nodeGroupName != null ? !this.nodeGroupName.equals(that.nodeGroupName) : that.nodeGroupName != null) return false;
            if (this.nodeGroupNamePrefix != null ? !this.nodeGroupNamePrefix.equals(that.nodeGroupNamePrefix) : that.nodeGroupNamePrefix != null) return false;
            if (this.nodeRepairConfig != null ? !this.nodeRepairConfig.equals(that.nodeRepairConfig) : that.nodeRepairConfig != null) return false;
            if (this.releaseVersion != null ? !this.releaseVersion.equals(that.releaseVersion) : that.releaseVersion != null) return false;
            if (this.remoteAccess != null ? !this.remoteAccess.equals(that.remoteAccess) : that.remoteAccess != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.taint != null ? !this.taint.equals(that.taint) : that.taint != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.updateConfig != null ? !this.updateConfig.equals(that.updateConfig) : that.updateConfig != null) return false;
            if (this.version != null ? !this.version.equals(that.version) : that.version != null) return false;
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
            int result = this.clusterName.hashCode();
            result = 31 * result + (this.nodeRoleArn.hashCode());
            result = 31 * result + (this.scalingConfig.hashCode());
            result = 31 * result + (this.subnetIds.hashCode());
            result = 31 * result + (this.amiType != null ? this.amiType.hashCode() : 0);
            result = 31 * result + (this.capacityType != null ? this.capacityType.hashCode() : 0);
            result = 31 * result + (this.diskSize != null ? this.diskSize.hashCode() : 0);
            result = 31 * result + (this.forceUpdateVersion != null ? this.forceUpdateVersion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instanceTypes != null ? this.instanceTypes.hashCode() : 0);
            result = 31 * result + (this.labels != null ? this.labels.hashCode() : 0);
            result = 31 * result + (this.launchTemplate != null ? this.launchTemplate.hashCode() : 0);
            result = 31 * result + (this.nodeGroupName != null ? this.nodeGroupName.hashCode() : 0);
            result = 31 * result + (this.nodeGroupNamePrefix != null ? this.nodeGroupNamePrefix.hashCode() : 0);
            result = 31 * result + (this.nodeRepairConfig != null ? this.nodeRepairConfig.hashCode() : 0);
            result = 31 * result + (this.releaseVersion != null ? this.releaseVersion.hashCode() : 0);
            result = 31 * result + (this.remoteAccess != null ? this.remoteAccess.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.taint != null ? this.taint.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.updateConfig != null ? this.updateConfig.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
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
