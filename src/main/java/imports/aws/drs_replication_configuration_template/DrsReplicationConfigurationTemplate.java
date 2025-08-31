package imports.aws.drs_replication_configuration_template;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template aws_drs_replication_configuration_template}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.031Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.drsReplicationConfigurationTemplate.DrsReplicationConfigurationTemplate")
public class DrsReplicationConfigurationTemplate extends com.hashicorp.cdktf.TerraformResource {

    protected DrsReplicationConfigurationTemplate(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DrsReplicationConfigurationTemplate(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template aws_drs_replication_configuration_template} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DrsReplicationConfigurationTemplate(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DrsReplicationConfigurationTemplate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DrsReplicationConfigurationTemplate to import. This parameter is required.
     * @param importFromId The id of the existing DrsReplicationConfigurationTemplate that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DrsReplicationConfigurationTemplate to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DrsReplicationConfigurationTemplate resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DrsReplicationConfigurationTemplate to import. This parameter is required.
     * @param importFromId The id of the existing DrsReplicationConfigurationTemplate that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putPitPolicy(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicy>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicy> __cast_cd4240 = (java.util.List<imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicy>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicy __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPitPolicy", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAutoReplicateNewDisks() {
        software.amazon.jsii.Kernel.call(this, "resetAutoReplicateNewDisks", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEbsEncryptionKeyArn() {
        software.amazon.jsii.Kernel.call(this, "resetEbsEncryptionKeyArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPitPolicy() {
        software.amazon.jsii.Kernel.call(this, "resetPitPolicy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    @Override
    protected @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Object> synthesizeHclAttributes() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.call(this, "synthesizeHclAttributes", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class))));
    }

    public final static java.lang.String TF_RESOURCE_TYPE;

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicyList getPitPolicy() {
        return software.amazon.jsii.Kernel.get(this, "pitPolicy", software.amazon.jsii.NativeType.forClass(imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicyList.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.StringMap getTagsAll() {
        return software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.StringMap.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAssociateDefaultSecurityGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "associateDefaultSecurityGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoReplicateNewDisksInput() {
        return software.amazon.jsii.Kernel.get(this, "autoReplicateNewDisksInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBandwidthThrottlingInput() {
        return software.amazon.jsii.Kernel.get(this, "bandwidthThrottlingInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCreatePublicIpInput() {
        return software.amazon.jsii.Kernel.get(this, "createPublicIpInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataPlaneRoutingInput() {
        return software.amazon.jsii.Kernel.get(this, "dataPlaneRoutingInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDefaultLargeStagingDiskTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultLargeStagingDiskTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEbsEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsEncryptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEbsEncryptionKeyArnInput() {
        return software.amazon.jsii.Kernel.get(this, "ebsEncryptionKeyArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPitPolicyInput() {
        return software.amazon.jsii.Kernel.get(this, "pitPolicyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getReplicationServerInstanceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationServerInstanceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReplicationServersSecurityGroupsIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "replicationServersSecurityGroupsIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStagingAreaSubnetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "stagingAreaSubnetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getStagingAreaTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "stagingAreaTagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getUseDedicatedReplicationServerInput() {
        return software.amazon.jsii.Kernel.get(this, "useDedicatedReplicationServerInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAssociateDefaultSecurityGroup() {
        return software.amazon.jsii.Kernel.get(this, "associateDefaultSecurityGroup", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAssociateDefaultSecurityGroup(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "associateDefaultSecurityGroup", java.util.Objects.requireNonNull(value, "associateDefaultSecurityGroup is required"));
    }

    public void setAssociateDefaultSecurityGroup(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "associateDefaultSecurityGroup", java.util.Objects.requireNonNull(value, "associateDefaultSecurityGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoReplicateNewDisks() {
        return software.amazon.jsii.Kernel.get(this, "autoReplicateNewDisks", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoReplicateNewDisks(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoReplicateNewDisks", java.util.Objects.requireNonNull(value, "autoReplicateNewDisks is required"));
    }

    public void setAutoReplicateNewDisks(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoReplicateNewDisks", java.util.Objects.requireNonNull(value, "autoReplicateNewDisks is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBandwidthThrottling() {
        return software.amazon.jsii.Kernel.get(this, "bandwidthThrottling", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBandwidthThrottling(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "bandwidthThrottling", java.util.Objects.requireNonNull(value, "bandwidthThrottling is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCreatePublicIp() {
        return software.amazon.jsii.Kernel.get(this, "createPublicIp", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCreatePublicIp(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "createPublicIp", java.util.Objects.requireNonNull(value, "createPublicIp is required"));
    }

    public void setCreatePublicIp(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "createPublicIp", java.util.Objects.requireNonNull(value, "createPublicIp is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataPlaneRouting() {
        return software.amazon.jsii.Kernel.get(this, "dataPlaneRouting", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataPlaneRouting(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataPlaneRouting", java.util.Objects.requireNonNull(value, "dataPlaneRouting is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultLargeStagingDiskType() {
        return software.amazon.jsii.Kernel.get(this, "defaultLargeStagingDiskType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDefaultLargeStagingDiskType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "defaultLargeStagingDiskType", java.util.Objects.requireNonNull(value, "defaultLargeStagingDiskType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbsEncryption() {
        return software.amazon.jsii.Kernel.get(this, "ebsEncryption", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEbsEncryption(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ebsEncryption", java.util.Objects.requireNonNull(value, "ebsEncryption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEbsEncryptionKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "ebsEncryptionKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEbsEncryptionKeyArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ebsEncryptionKeyArn", java.util.Objects.requireNonNull(value, "ebsEncryptionKeyArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getReplicationServerInstanceType() {
        return software.amazon.jsii.Kernel.get(this, "replicationServerInstanceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setReplicationServerInstanceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "replicationServerInstanceType", java.util.Objects.requireNonNull(value, "replicationServerInstanceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getReplicationServersSecurityGroupsIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "replicationServersSecurityGroupsIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setReplicationServersSecurityGroupsIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "replicationServersSecurityGroupsIds", java.util.Objects.requireNonNull(value, "replicationServersSecurityGroupsIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStagingAreaSubnetId() {
        return software.amazon.jsii.Kernel.get(this, "stagingAreaSubnetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStagingAreaSubnetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stagingAreaSubnetId", java.util.Objects.requireNonNull(value, "stagingAreaSubnetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getStagingAreaTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "stagingAreaTags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStagingAreaTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "stagingAreaTags", java.util.Objects.requireNonNull(value, "stagingAreaTags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getUseDedicatedReplicationServer() {
        return software.amazon.jsii.Kernel.get(this, "useDedicatedReplicationServer", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setUseDedicatedReplicationServer(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "useDedicatedReplicationServer", java.util.Objects.requireNonNull(value, "useDedicatedReplicationServer is required"));
    }

    public void setUseDedicatedReplicationServer(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "useDedicatedReplicationServer", java.util.Objects.requireNonNull(value, "useDedicatedReplicationServer is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate> {
        /**
         * @return a new instance of {@link Builder}.
         * @param scope The scope in which to define this construct. This parameter is required.
         * @param id The scoped construct ID. This parameter is required.
         */
        public static Builder create(final software.constructs.Construct scope, final java.lang.String id) {
            return new Builder(scope, id);
        }

        private final software.constructs.Construct scope;
        private final java.lang.String id;
        private final imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateConfig.Builder();
        }

        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }
        /**
         * @return {@code this}
         * @param connection This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(final com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.config.connection(connection);
            return this;
        }

        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final java.lang.Number count) {
            this.config.count(count);
            return this;
        }
        /**
         * @return {@code this}
         * @param count This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(final com.hashicorp.cdktf.TerraformCount count) {
            this.config.count(count);
            return this;
        }

        /**
         * @return {@code this}
         * @param dependsOn This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder dependsOn(final java.util.List<? extends com.hashicorp.cdktf.ITerraformDependable> dependsOn) {
            this.config.dependsOn(dependsOn);
            return this;
        }

        /**
         * @return {@code this}
         * @param forEach This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(final com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.config.forEach(forEach);
            return this;
        }

        /**
         * @return {@code this}
         * @param lifecycle This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(final com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.config.lifecycle(lifecycle);
            return this;
        }

        /**
         * @return {@code this}
         * @param provider This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(final com.hashicorp.cdktf.TerraformProvider provider) {
            this.config.provider(provider);
            return this;
        }

        /**
         * @return {@code this}
         * @param provisioners This parameter is required.
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provisioners(final java.util.List<? extends java.lang.Object> provisioners) {
            this.config.provisioners(provisioners);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#associate_default_security_group DrsReplicationConfigurationTemplate#associate_default_security_group}.
         * <p>
         * @return {@code this}
         * @param associateDefaultSecurityGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#associate_default_security_group DrsReplicationConfigurationTemplate#associate_default_security_group}. This parameter is required.
         */
        public Builder associateDefaultSecurityGroup(final java.lang.Boolean associateDefaultSecurityGroup) {
            this.config.associateDefaultSecurityGroup(associateDefaultSecurityGroup);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#associate_default_security_group DrsReplicationConfigurationTemplate#associate_default_security_group}.
         * <p>
         * @return {@code this}
         * @param associateDefaultSecurityGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#associate_default_security_group DrsReplicationConfigurationTemplate#associate_default_security_group}. This parameter is required.
         */
        public Builder associateDefaultSecurityGroup(final com.hashicorp.cdktf.IResolvable associateDefaultSecurityGroup) {
            this.config.associateDefaultSecurityGroup(associateDefaultSecurityGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#bandwidth_throttling DrsReplicationConfigurationTemplate#bandwidth_throttling}.
         * <p>
         * @return {@code this}
         * @param bandwidthThrottling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#bandwidth_throttling DrsReplicationConfigurationTemplate#bandwidth_throttling}. This parameter is required.
         */
        public Builder bandwidthThrottling(final java.lang.Number bandwidthThrottling) {
            this.config.bandwidthThrottling(bandwidthThrottling);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#create_public_ip DrsReplicationConfigurationTemplate#create_public_ip}.
         * <p>
         * @return {@code this}
         * @param createPublicIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#create_public_ip DrsReplicationConfigurationTemplate#create_public_ip}. This parameter is required.
         */
        public Builder createPublicIp(final java.lang.Boolean createPublicIp) {
            this.config.createPublicIp(createPublicIp);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#create_public_ip DrsReplicationConfigurationTemplate#create_public_ip}.
         * <p>
         * @return {@code this}
         * @param createPublicIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#create_public_ip DrsReplicationConfigurationTemplate#create_public_ip}. This parameter is required.
         */
        public Builder createPublicIp(final com.hashicorp.cdktf.IResolvable createPublicIp) {
            this.config.createPublicIp(createPublicIp);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#data_plane_routing DrsReplicationConfigurationTemplate#data_plane_routing}.
         * <p>
         * @return {@code this}
         * @param dataPlaneRouting Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#data_plane_routing DrsReplicationConfigurationTemplate#data_plane_routing}. This parameter is required.
         */
        public Builder dataPlaneRouting(final java.lang.String dataPlaneRouting) {
            this.config.dataPlaneRouting(dataPlaneRouting);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#default_large_staging_disk_type DrsReplicationConfigurationTemplate#default_large_staging_disk_type}.
         * <p>
         * @return {@code this}
         * @param defaultLargeStagingDiskType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#default_large_staging_disk_type DrsReplicationConfigurationTemplate#default_large_staging_disk_type}. This parameter is required.
         */
        public Builder defaultLargeStagingDiskType(final java.lang.String defaultLargeStagingDiskType) {
            this.config.defaultLargeStagingDiskType(defaultLargeStagingDiskType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption DrsReplicationConfigurationTemplate#ebs_encryption}.
         * <p>
         * @return {@code this}
         * @param ebsEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption DrsReplicationConfigurationTemplate#ebs_encryption}. This parameter is required.
         */
        public Builder ebsEncryption(final java.lang.String ebsEncryption) {
            this.config.ebsEncryption(ebsEncryption);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_server_instance_type DrsReplicationConfigurationTemplate#replication_server_instance_type}.
         * <p>
         * @return {@code this}
         * @param replicationServerInstanceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_server_instance_type DrsReplicationConfigurationTemplate#replication_server_instance_type}. This parameter is required.
         */
        public Builder replicationServerInstanceType(final java.lang.String replicationServerInstanceType) {
            this.config.replicationServerInstanceType(replicationServerInstanceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_servers_security_groups_ids DrsReplicationConfigurationTemplate#replication_servers_security_groups_ids}.
         * <p>
         * @return {@code this}
         * @param replicationServersSecurityGroupsIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#replication_servers_security_groups_ids DrsReplicationConfigurationTemplate#replication_servers_security_groups_ids}. This parameter is required.
         */
        public Builder replicationServersSecurityGroupsIds(final java.util.List<java.lang.String> replicationServersSecurityGroupsIds) {
            this.config.replicationServersSecurityGroupsIds(replicationServersSecurityGroupsIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_subnet_id DrsReplicationConfigurationTemplate#staging_area_subnet_id}.
         * <p>
         * @return {@code this}
         * @param stagingAreaSubnetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_subnet_id DrsReplicationConfigurationTemplate#staging_area_subnet_id}. This parameter is required.
         */
        public Builder stagingAreaSubnetId(final java.lang.String stagingAreaSubnetId) {
            this.config.stagingAreaSubnetId(stagingAreaSubnetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_tags DrsReplicationConfigurationTemplate#staging_area_tags}.
         * <p>
         * @return {@code this}
         * @param stagingAreaTags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#staging_area_tags DrsReplicationConfigurationTemplate#staging_area_tags}. This parameter is required.
         */
        public Builder stagingAreaTags(final java.util.Map<java.lang.String, java.lang.String> stagingAreaTags) {
            this.config.stagingAreaTags(stagingAreaTags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#use_dedicated_replication_server DrsReplicationConfigurationTemplate#use_dedicated_replication_server}.
         * <p>
         * @return {@code this}
         * @param useDedicatedReplicationServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#use_dedicated_replication_server DrsReplicationConfigurationTemplate#use_dedicated_replication_server}. This parameter is required.
         */
        public Builder useDedicatedReplicationServer(final java.lang.Boolean useDedicatedReplicationServer) {
            this.config.useDedicatedReplicationServer(useDedicatedReplicationServer);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#use_dedicated_replication_server DrsReplicationConfigurationTemplate#use_dedicated_replication_server}.
         * <p>
         * @return {@code this}
         * @param useDedicatedReplicationServer Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#use_dedicated_replication_server DrsReplicationConfigurationTemplate#use_dedicated_replication_server}. This parameter is required.
         */
        public Builder useDedicatedReplicationServer(final com.hashicorp.cdktf.IResolvable useDedicatedReplicationServer) {
            this.config.useDedicatedReplicationServer(useDedicatedReplicationServer);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#auto_replicate_new_disks DrsReplicationConfigurationTemplate#auto_replicate_new_disks}.
         * <p>
         * @return {@code this}
         * @param autoReplicateNewDisks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#auto_replicate_new_disks DrsReplicationConfigurationTemplate#auto_replicate_new_disks}. This parameter is required.
         */
        public Builder autoReplicateNewDisks(final java.lang.Boolean autoReplicateNewDisks) {
            this.config.autoReplicateNewDisks(autoReplicateNewDisks);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#auto_replicate_new_disks DrsReplicationConfigurationTemplate#auto_replicate_new_disks}.
         * <p>
         * @return {@code this}
         * @param autoReplicateNewDisks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#auto_replicate_new_disks DrsReplicationConfigurationTemplate#auto_replicate_new_disks}. This parameter is required.
         */
        public Builder autoReplicateNewDisks(final com.hashicorp.cdktf.IResolvable autoReplicateNewDisks) {
            this.config.autoReplicateNewDisks(autoReplicateNewDisks);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption_key_arn DrsReplicationConfigurationTemplate#ebs_encryption_key_arn}.
         * <p>
         * @return {@code this}
         * @param ebsEncryptionKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#ebs_encryption_key_arn DrsReplicationConfigurationTemplate#ebs_encryption_key_arn}. This parameter is required.
         */
        public Builder ebsEncryptionKeyArn(final java.lang.String ebsEncryptionKeyArn) {
            this.config.ebsEncryptionKeyArn(ebsEncryptionKeyArn);
            return this;
        }

        /**
         * pit_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#pit_policy DrsReplicationConfigurationTemplate#pit_policy}
         * <p>
         * @return {@code this}
         * @param pitPolicy pit_policy block. This parameter is required.
         */
        public Builder pitPolicy(final com.hashicorp.cdktf.IResolvable pitPolicy) {
            this.config.pitPolicy(pitPolicy);
            return this;
        }
        /**
         * pit_policy block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#pit_policy DrsReplicationConfigurationTemplate#pit_policy}
         * <p>
         * @return {@code this}
         * @param pitPolicy pit_policy block. This parameter is required.
         */
        public Builder pitPolicy(final java.util.List<? extends imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplatePitPolicy> pitPolicy) {
            this.config.pitPolicy(pitPolicy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#tags DrsReplicationConfigurationTemplate#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#tags DrsReplicationConfigurationTemplate#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/drs_replication_configuration_template#timeouts DrsReplicationConfigurationTemplate#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplateTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate}.
         */
        @Override
        public imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate build() {
            return new imports.aws.drs_replication_configuration_template.DrsReplicationConfigurationTemplate(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
