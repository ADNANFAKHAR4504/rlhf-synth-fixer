package imports.aws.drs_replication_configuration_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.031Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.drsReplicationConfigurationTemplate.DrsReplicationConfigurationTemplateConfig")
@software.amazon.jsii.Jsii.Proxy(DrsReplicationConfigurationTemplateConfig.Jsii$Proxy.class)
public interface DrsReplicationConfigurationTemplateConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#associate_default_security_group DrsReplicationConfigurationTemplate#associate_default_security_group}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAssociateDefaultSecurityGroup();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#bandwidth_throttling DrsReplicationConfigurationTemplate#bandwidth_throttling}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getBandwidthThrottling();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#create_public_ip DrsReplicationConfigurationTemplate#create_public_ip}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getCreatePublicIp();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#data_plane_routing DrsReplicationConfigurationTemplate#data_plane_routing}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataPlaneRouting();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#default_large_staging_disk_type DrsReplicationConfigurationTemplate#default_large_staging_disk_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDefaultLargeStagingDiskType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption DrsReplicationConfigurationTemplate#ebs_encryption}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEbsEncryption();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_server_instance_type DrsReplicationConfigurationTemplate#replication_server_instance_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getReplicationServerInstanceType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_servers_security_groups_ids DrsReplicationConfigurationTemplate#replication_servers_security_groups_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getReplicationServersSecurityGroupsIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_subnet_id DrsReplicationConfigurationTemplate#staging_area_subnet_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStagingAreaSubnetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_tags DrsReplicationConfigurationTemplate#staging_area_tags}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getStagingAreaTags();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#use_dedicated_replication_server DrsReplicationConfigurationTemplate#use_dedicated_replication_server}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getUseDedicatedReplicationServer();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#auto_replicate_new_disks DrsReplicationConfigurationTemplate#auto_replicate_new_disks}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoReplicateNewDisks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption_key_arn DrsReplicationConfigurationTemplate#ebs_encryption_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEbsEncryptionKeyArn() {
        return null;
    }

    /**
     * pit_policy block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#pit_policy DrsReplicationConfigurationTemplate#pit_policy}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPitPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#tags DrsReplicationConfigurationTemplate#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#timeouts DrsReplicationConfigurationTemplate#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DrsReplicationConfigurationTemplateConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DrsReplicationConfigurationTemplateConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DrsReplicationConfigurationTemplateConfig> {
        java.lang.Object associateDefaultSecurityGroup;
        java.lang.Number bandwidthThrottling;
        java.lang.Object createPublicIp;
        java.lang.String dataPlaneRouting;
        java.lang.String defaultLargeStagingDiskType;
        java.lang.String ebsEncryption;
        java.lang.String replicationServerInstanceType;
        java.util.List<java.lang.String> replicationServersSecurityGroupsIds;
        java.lang.String stagingAreaSubnetId;
        java.util.Map<java.lang.String, java.lang.String> stagingAreaTags;
        java.lang.Object useDedicatedReplicationServer;
        java.lang.Object autoReplicateNewDisks;
        java.lang.String ebsEncryptionKeyArn;
        java.lang.Object pitPolicy;
        java.util.Map<java.lang.String, java.lang.String> tags;
        imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getAssociateDefaultSecurityGroup}
         * @param associateDefaultSecurityGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#associate_default_security_group DrsReplicationConfigurationTemplate#associate_default_security_group}. This parameter is required.
         * @return {@code this}
         */
        public Builder associateDefaultSecurityGroup(java.lang.Boolean associateDefaultSecurityGroup) {
            this.associateDefaultSecurityGroup = associateDefaultSecurityGroup;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getAssociateDefaultSecurityGroup}
         * @param associateDefaultSecurityGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#associate_default_security_group DrsReplicationConfigurationTemplate#associate_default_security_group}. This parameter is required.
         * @return {@code this}
         */
        public Builder associateDefaultSecurityGroup(com.hashicorp.cdktf.IResolvable associateDefaultSecurityGroup) {
            this.associateDefaultSecurityGroup = associateDefaultSecurityGroup;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getBandwidthThrottling}
         * @param bandwidthThrottling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#bandwidth_throttling DrsReplicationConfigurationTemplate#bandwidth_throttling}. This parameter is required.
         * @return {@code this}
         */
        public Builder bandwidthThrottling(java.lang.Number bandwidthThrottling) {
            this.bandwidthThrottling = bandwidthThrottling;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getCreatePublicIp}
         * @param createPublicIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#create_public_ip DrsReplicationConfigurationTemplate#create_public_ip}. This parameter is required.
         * @return {@code this}
         */
        public Builder createPublicIp(java.lang.Boolean createPublicIp) {
            this.createPublicIp = createPublicIp;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getCreatePublicIp}
         * @param createPublicIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#create_public_ip DrsReplicationConfigurationTemplate#create_public_ip}. This parameter is required.
         * @return {@code this}
         */
        public Builder createPublicIp(com.hashicorp.cdktf.IResolvable createPublicIp) {
            this.createPublicIp = createPublicIp;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getDataPlaneRouting}
         * @param dataPlaneRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#data_plane_routing DrsReplicationConfigurationTemplate#data_plane_routing}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataPlaneRouting(java.lang.String dataPlaneRouting) {
            this.dataPlaneRouting = dataPlaneRouting;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getDefaultLargeStagingDiskType}
         * @param defaultLargeStagingDiskType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#default_large_staging_disk_type DrsReplicationConfigurationTemplate#default_large_staging_disk_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder defaultLargeStagingDiskType(java.lang.String defaultLargeStagingDiskType) {
            this.defaultLargeStagingDiskType = defaultLargeStagingDiskType;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getEbsEncryption}
         * @param ebsEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption DrsReplicationConfigurationTemplate#ebs_encryption}. This parameter is required.
         * @return {@code this}
         */
        public Builder ebsEncryption(java.lang.String ebsEncryption) {
            this.ebsEncryption = ebsEncryption;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getReplicationServerInstanceType}
         * @param replicationServerInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_server_instance_type DrsReplicationConfigurationTemplate#replication_server_instance_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationServerInstanceType(java.lang.String replicationServerInstanceType) {
            this.replicationServerInstanceType = replicationServerInstanceType;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getReplicationServersSecurityGroupsIds}
         * @param replicationServersSecurityGroupsIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_servers_security_groups_ids DrsReplicationConfigurationTemplate#replication_servers_security_groups_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder replicationServersSecurityGroupsIds(java.util.List<java.lang.String> replicationServersSecurityGroupsIds) {
            this.replicationServersSecurityGroupsIds = replicationServersSecurityGroupsIds;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getStagingAreaSubnetId}
         * @param stagingAreaSubnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_subnet_id DrsReplicationConfigurationTemplate#staging_area_subnet_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder stagingAreaSubnetId(java.lang.String stagingAreaSubnetId) {
            this.stagingAreaSubnetId = stagingAreaSubnetId;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getStagingAreaTags}
         * @param stagingAreaTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_tags DrsReplicationConfigurationTemplate#staging_area_tags}. This parameter is required.
         * @return {@code this}
         */
        public Builder stagingAreaTags(java.util.Map<java.lang.String, java.lang.String> stagingAreaTags) {
            this.stagingAreaTags = stagingAreaTags;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getUseDedicatedReplicationServer}
         * @param useDedicatedReplicationServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#use_dedicated_replication_server DrsReplicationConfigurationTemplate#use_dedicated_replication_server}. This parameter is required.
         * @return {@code this}
         */
        public Builder useDedicatedReplicationServer(java.lang.Boolean useDedicatedReplicationServer) {
            this.useDedicatedReplicationServer = useDedicatedReplicationServer;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getUseDedicatedReplicationServer}
         * @param useDedicatedReplicationServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#use_dedicated_replication_server DrsReplicationConfigurationTemplate#use_dedicated_replication_server}. This parameter is required.
         * @return {@code this}
         */
        public Builder useDedicatedReplicationServer(com.hashicorp.cdktf.IResolvable useDedicatedReplicationServer) {
            this.useDedicatedReplicationServer = useDedicatedReplicationServer;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getAutoReplicateNewDisks}
         * @param autoReplicateNewDisks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#auto_replicate_new_disks DrsReplicationConfigurationTemplate#auto_replicate_new_disks}.
         * @return {@code this}
         */
        public Builder autoReplicateNewDisks(java.lang.Boolean autoReplicateNewDisks) {
            this.autoReplicateNewDisks = autoReplicateNewDisks;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getAutoReplicateNewDisks}
         * @param autoReplicateNewDisks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#auto_replicate_new_disks DrsReplicationConfigurationTemplate#auto_replicate_new_disks}.
         * @return {@code this}
         */
        public Builder autoReplicateNewDisks(com.hashicorp.cdktf.IResolvable autoReplicateNewDisks) {
            this.autoReplicateNewDisks = autoReplicateNewDisks;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getEbsEncryptionKeyArn}
         * @param ebsEncryptionKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption_key_arn DrsReplicationConfigurationTemplate#ebs_encryption_key_arn}.
         * @return {@code this}
         */
        public Builder ebsEncryptionKeyArn(java.lang.String ebsEncryptionKeyArn) {
            this.ebsEncryptionKeyArn = ebsEncryptionKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getPitPolicy}
         * @param pitPolicy pit_policy block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#pit_policy DrsReplicationConfigurationTemplate#pit_policy}
         * @return {@code this}
         */
        public Builder pitPolicy(com.hashicorp.cdktf.IResolvable pitPolicy) {
            this.pitPolicy = pitPolicy;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getPitPolicy}
         * @param pitPolicy pit_policy block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#pit_policy DrsReplicationConfigurationTemplate#pit_policy}
         * @return {@code this}
         */
        public Builder pitPolicy(java.util.List<? extends imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicy> pitPolicy) {
            this.pitPolicy = pitPolicy;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#tags DrsReplicationConfigurationTemplate#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#timeouts DrsReplicationConfigurationTemplate#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getDependsOn}
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
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link DrsReplicationConfigurationTemplateConfig#getProvisioners}
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
         * @return a new instance of {@link DrsReplicationConfigurationTemplateConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DrsReplicationConfigurationTemplateConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DrsReplicationConfigurationTemplateConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DrsReplicationConfigurationTemplateConfig {
        private final java.lang.Object associateDefaultSecurityGroup;
        private final java.lang.Number bandwidthThrottling;
        private final java.lang.Object createPublicIp;
        private final java.lang.String dataPlaneRouting;
        private final java.lang.String defaultLargeStagingDiskType;
        private final java.lang.String ebsEncryption;
        private final java.lang.String replicationServerInstanceType;
        private final java.util.List<java.lang.String> replicationServersSecurityGroupsIds;
        private final java.lang.String stagingAreaSubnetId;
        private final java.util.Map<java.lang.String, java.lang.String> stagingAreaTags;
        private final java.lang.Object useDedicatedReplicationServer;
        private final java.lang.Object autoReplicateNewDisks;
        private final java.lang.String ebsEncryptionKeyArn;
        private final java.lang.Object pitPolicy;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts timeouts;
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
            this.associateDefaultSecurityGroup = software.amazon.jsii.Kernel.get(this, "associateDefaultSecurityGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.bandwidthThrottling = software.amazon.jsii.Kernel.get(this, "bandwidthThrottling", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.createPublicIp = software.amazon.jsii.Kernel.get(this, "createPublicIp", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataPlaneRouting = software.amazon.jsii.Kernel.get(this, "dataPlaneRouting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultLargeStagingDiskType = software.amazon.jsii.Kernel.get(this, "defaultLargeStagingDiskType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ebsEncryption = software.amazon.jsii.Kernel.get(this, "ebsEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationServerInstanceType = software.amazon.jsii.Kernel.get(this, "replicationServerInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.replicationServersSecurityGroupsIds = software.amazon.jsii.Kernel.get(this, "replicationServersSecurityGroupsIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.stagingAreaSubnetId = software.amazon.jsii.Kernel.get(this, "stagingAreaSubnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.stagingAreaTags = software.amazon.jsii.Kernel.get(this, "stagingAreaTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.useDedicatedReplicationServer = software.amazon.jsii.Kernel.get(this, "useDedicatedReplicationServer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.autoReplicateNewDisks = software.amazon.jsii.Kernel.get(this, "autoReplicateNewDisks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ebsEncryptionKeyArn = software.amazon.jsii.Kernel.get(this, "ebsEncryptionKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.pitPolicy = software.amazon.jsii.Kernel.get(this, "pitPolicy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts.class));
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
            this.associateDefaultSecurityGroup = java.util.Objects.requireNonNull(builder.associateDefaultSecurityGroup, "associateDefaultSecurityGroup is required");
            this.bandwidthThrottling = java.util.Objects.requireNonNull(builder.bandwidthThrottling, "bandwidthThrottling is required");
            this.createPublicIp = java.util.Objects.requireNonNull(builder.createPublicIp, "createPublicIp is required");
            this.dataPlaneRouting = java.util.Objects.requireNonNull(builder.dataPlaneRouting, "dataPlaneRouting is required");
            this.defaultLargeStagingDiskType = java.util.Objects.requireNonNull(builder.defaultLargeStagingDiskType, "defaultLargeStagingDiskType is required");
            this.ebsEncryption = java.util.Objects.requireNonNull(builder.ebsEncryption, "ebsEncryption is required");
            this.replicationServerInstanceType = java.util.Objects.requireNonNull(builder.replicationServerInstanceType, "replicationServerInstanceType is required");
            this.replicationServersSecurityGroupsIds = java.util.Objects.requireNonNull(builder.replicationServersSecurityGroupsIds, "replicationServersSecurityGroupsIds is required");
            this.stagingAreaSubnetId = java.util.Objects.requireNonNull(builder.stagingAreaSubnetId, "stagingAreaSubnetId is required");
            this.stagingAreaTags = java.util.Objects.requireNonNull(builder.stagingAreaTags, "stagingAreaTags is required");
            this.useDedicatedReplicationServer = java.util.Objects.requireNonNull(builder.useDedicatedReplicationServer, "useDedicatedReplicationServer is required");
            this.autoReplicateNewDisks = builder.autoReplicateNewDisks;
            this.ebsEncryptionKeyArn = builder.ebsEncryptionKeyArn;
            this.pitPolicy = builder.pitPolicy;
            this.tags = builder.tags;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getAssociateDefaultSecurityGroup() {
            return this.associateDefaultSecurityGroup;
        }

        @Override
        public final java.lang.Number getBandwidthThrottling() {
            return this.bandwidthThrottling;
        }

        @Override
        public final java.lang.Object getCreatePublicIp() {
            return this.createPublicIp;
        }

        @Override
        public final java.lang.String getDataPlaneRouting() {
            return this.dataPlaneRouting;
        }

        @Override
        public final java.lang.String getDefaultLargeStagingDiskType() {
            return this.defaultLargeStagingDiskType;
        }

        @Override
        public final java.lang.String getEbsEncryption() {
            return this.ebsEncryption;
        }

        @Override
        public final java.lang.String getReplicationServerInstanceType() {
            return this.replicationServerInstanceType;
        }

        @Override
        public final java.util.List<java.lang.String> getReplicationServersSecurityGroupsIds() {
            return this.replicationServersSecurityGroupsIds;
        }

        @Override
        public final java.lang.String getStagingAreaSubnetId() {
            return this.stagingAreaSubnetId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getStagingAreaTags() {
            return this.stagingAreaTags;
        }

        @Override
        public final java.lang.Object getUseDedicatedReplicationServer() {
            return this.useDedicatedReplicationServer;
        }

        @Override
        public final java.lang.Object getAutoReplicateNewDisks() {
            return this.autoReplicateNewDisks;
        }

        @Override
        public final java.lang.String getEbsEncryptionKeyArn() {
            return this.ebsEncryptionKeyArn;
        }

        @Override
        public final java.lang.Object getPitPolicy() {
            return this.pitPolicy;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("associateDefaultSecurityGroup", om.valueToTree(this.getAssociateDefaultSecurityGroup()));
            data.set("bandwidthThrottling", om.valueToTree(this.getBandwidthThrottling()));
            data.set("createPublicIp", om.valueToTree(this.getCreatePublicIp()));
            data.set("dataPlaneRouting", om.valueToTree(this.getDataPlaneRouting()));
            data.set("defaultLargeStagingDiskType", om.valueToTree(this.getDefaultLargeStagingDiskType()));
            data.set("ebsEncryption", om.valueToTree(this.getEbsEncryption()));
            data.set("replicationServerInstanceType", om.valueToTree(this.getReplicationServerInstanceType()));
            data.set("replicationServersSecurityGroupsIds", om.valueToTree(this.getReplicationServersSecurityGroupsIds()));
            data.set("stagingAreaSubnetId", om.valueToTree(this.getStagingAreaSubnetId()));
            data.set("stagingAreaTags", om.valueToTree(this.getStagingAreaTags()));
            data.set("useDedicatedReplicationServer", om.valueToTree(this.getUseDedicatedReplicationServer()));
            if (this.getAutoReplicateNewDisks() != null) {
                data.set("autoReplicateNewDisks", om.valueToTree(this.getAutoReplicateNewDisks()));
            }
            if (this.getEbsEncryptionKeyArn() != null) {
                data.set("ebsEncryptionKeyArn", om.valueToTree(this.getEbsEncryptionKeyArn()));
            }
            if (this.getPitPolicy() != null) {
                data.set("pitPolicy", om.valueToTree(this.getPitPolicy()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
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
            struct.set("fqn", om.valueToTree("aws.drsReplicationConfigurationTemplate.DrsReplicationConfigurationTemplateConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DrsReplicationConfigurationTemplateConfig.Jsii$Proxy that = (DrsReplicationConfigurationTemplateConfig.Jsii$Proxy) o;

            if (!associateDefaultSecurityGroup.equals(that.associateDefaultSecurityGroup)) return false;
            if (!bandwidthThrottling.equals(that.bandwidthThrottling)) return false;
            if (!createPublicIp.equals(that.createPublicIp)) return false;
            if (!dataPlaneRouting.equals(that.dataPlaneRouting)) return false;
            if (!defaultLargeStagingDiskType.equals(that.defaultLargeStagingDiskType)) return false;
            if (!ebsEncryption.equals(that.ebsEncryption)) return false;
            if (!replicationServerInstanceType.equals(that.replicationServerInstanceType)) return false;
            if (!replicationServersSecurityGroupsIds.equals(that.replicationServersSecurityGroupsIds)) return false;
            if (!stagingAreaSubnetId.equals(that.stagingAreaSubnetId)) return false;
            if (!stagingAreaTags.equals(that.stagingAreaTags)) return false;
            if (!useDedicatedReplicationServer.equals(that.useDedicatedReplicationServer)) return false;
            if (this.autoReplicateNewDisks != null ? !this.autoReplicateNewDisks.equals(that.autoReplicateNewDisks) : that.autoReplicateNewDisks != null) return false;
            if (this.ebsEncryptionKeyArn != null ? !this.ebsEncryptionKeyArn.equals(that.ebsEncryptionKeyArn) : that.ebsEncryptionKeyArn != null) return false;
            if (this.pitPolicy != null ? !this.pitPolicy.equals(that.pitPolicy) : that.pitPolicy != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.associateDefaultSecurityGroup.hashCode();
            result = 31 * result + (this.bandwidthThrottling.hashCode());
            result = 31 * result + (this.createPublicIp.hashCode());
            result = 31 * result + (this.dataPlaneRouting.hashCode());
            result = 31 * result + (this.defaultLargeStagingDiskType.hashCode());
            result = 31 * result + (this.ebsEncryption.hashCode());
            result = 31 * result + (this.replicationServerInstanceType.hashCode());
            result = 31 * result + (this.replicationServersSecurityGroupsIds.hashCode());
            result = 31 * result + (this.stagingAreaSubnetId.hashCode());
            result = 31 * result + (this.stagingAreaTags.hashCode());
            result = 31 * result + (this.useDedicatedReplicationServer.hashCode());
            result = 31 * result + (this.autoReplicateNewDisks != null ? this.autoReplicateNewDisks.hashCode() : 0);
            result = 31 * result + (this.ebsEncryptionKeyArn != null ? this.ebsEncryptionKeyArn.hashCode() : 0);
            result = 31 * result + (this.pitPolicy != null ? this.pitPolicy.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
