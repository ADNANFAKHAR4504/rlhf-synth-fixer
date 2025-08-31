package imports.aws.datasync_location_hdfs;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs aws_datasync_location_hdfs}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.947Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationHdfs.DatasyncLocationHdfs")
public class DatasyncLocationHdfs extends com.hashicorp.cdktf.TerraformResource {

    protected DatasyncLocationHdfs(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DatasyncLocationHdfs(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.datasync_location_hdfs.DatasyncLocationHdfs.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs aws_datasync_location_hdfs} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DatasyncLocationHdfs(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.datasync_location_hdfs.DatasyncLocationHdfsConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DatasyncLocationHdfs resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatasyncLocationHdfs to import. This parameter is required.
     * @param importFromId The id of the existing DatasyncLocationHdfs that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DatasyncLocationHdfs to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datasync_location_hdfs.DatasyncLocationHdfs.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DatasyncLocationHdfs resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DatasyncLocationHdfs to import. This parameter is required.
     * @param importFromId The id of the existing DatasyncLocationHdfs that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.datasync_location_hdfs.DatasyncLocationHdfs.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putNameNode(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNode>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNode> __cast_cd4240 = (java.util.List<imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNode>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNode __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putNameNode", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putQopConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putQopConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAuthenticationType() {
        software.amazon.jsii.Kernel.call(this, "resetAuthenticationType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBlockSize() {
        software.amazon.jsii.Kernel.call(this, "resetBlockSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKerberosKeytab() {
        software.amazon.jsii.Kernel.call(this, "resetKerberosKeytab", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKerberosKeytabBase64() {
        software.amazon.jsii.Kernel.call(this, "resetKerberosKeytabBase64", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKerberosKrb5Conf() {
        software.amazon.jsii.Kernel.call(this, "resetKerberosKrb5Conf", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKerberosKrb5ConfBase64() {
        software.amazon.jsii.Kernel.call(this, "resetKerberosKrb5ConfBase64", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKerberosPrincipal() {
        software.amazon.jsii.Kernel.call(this, "resetKerberosPrincipal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetKmsKeyProviderUri() {
        software.amazon.jsii.Kernel.call(this, "resetKmsKeyProviderUri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQopConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetQopConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReplicationFactor() {
        software.amazon.jsii.Kernel.call(this, "resetReplicationFactor", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSimpleUser() {
        software.amazon.jsii.Kernel.call(this, "resetSimpleUser", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSubdirectory() {
        software.amazon.jsii.Kernel.call(this, "resetSubdirectory", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNodeList getNameNode() {
        return software.amazon.jsii.Kernel.get(this, "nameNode", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNodeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfigurationOutputReference getQopConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "qopConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getUri() {
        return software.amazon.jsii.Kernel.get(this, "uri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAgentArnsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "agentArnsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAuthenticationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getBlockSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "blockSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKerberosKeytabBase64Input() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKeytabBase64Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKerberosKeytabInput() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKeytabInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKerberosKrb5ConfBase64Input() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKrb5ConfBase64Input", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKerberosKrb5ConfInput() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKrb5ConfInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKerberosPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "kerberosPrincipalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyProviderUriInput() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyProviderUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getNameNodeInput() {
        return software.amazon.jsii.Kernel.get(this, "nameNodeInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration getQopConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "qopConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getReplicationFactorInput() {
        return software.amazon.jsii.Kernel.get(this, "replicationFactorInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSimpleUserInput() {
        return software.amazon.jsii.Kernel.get(this, "simpleUserInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSubdirectoryInput() {
        return software.amazon.jsii.Kernel.get(this, "subdirectoryInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAgentArns() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "agentArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setAgentArns(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "agentArns", java.util.Objects.requireNonNull(value, "agentArns is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAuthenticationType() {
        return software.amazon.jsii.Kernel.get(this, "authenticationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAuthenticationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "authenticationType", java.util.Objects.requireNonNull(value, "authenticationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getBlockSize() {
        return software.amazon.jsii.Kernel.get(this, "blockSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setBlockSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "blockSize", java.util.Objects.requireNonNull(value, "blockSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKerberosKeytab() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKeytab", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKerberosKeytab(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kerberosKeytab", java.util.Objects.requireNonNull(value, "kerberosKeytab is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKerberosKeytabBase64() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKeytabBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKerberosKeytabBase64(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kerberosKeytabBase64", java.util.Objects.requireNonNull(value, "kerberosKeytabBase64 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKerberosKrb5Conf() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKrb5Conf", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKerberosKrb5Conf(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kerberosKrb5Conf", java.util.Objects.requireNonNull(value, "kerberosKrb5Conf is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKerberosKrb5ConfBase64() {
        return software.amazon.jsii.Kernel.get(this, "kerberosKrb5ConfBase64", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKerberosKrb5ConfBase64(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kerberosKrb5ConfBase64", java.util.Objects.requireNonNull(value, "kerberosKrb5ConfBase64 is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKerberosPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "kerberosPrincipal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKerberosPrincipal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kerberosPrincipal", java.util.Objects.requireNonNull(value, "kerberosPrincipal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getKmsKeyProviderUri() {
        return software.amazon.jsii.Kernel.get(this, "kmsKeyProviderUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setKmsKeyProviderUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "kmsKeyProviderUri", java.util.Objects.requireNonNull(value, "kmsKeyProviderUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getReplicationFactor() {
        return software.amazon.jsii.Kernel.get(this, "replicationFactor", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setReplicationFactor(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "replicationFactor", java.util.Objects.requireNonNull(value, "replicationFactor is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSimpleUser() {
        return software.amazon.jsii.Kernel.get(this, "simpleUser", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSimpleUser(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "simpleUser", java.util.Objects.requireNonNull(value, "simpleUser is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSubdirectory() {
        return software.amazon.jsii.Kernel.get(this, "subdirectory", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSubdirectory(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "subdirectory", java.util.Objects.requireNonNull(value, "subdirectory is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.datasync_location_hdfs.DatasyncLocationHdfs}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.datasync_location_hdfs.DatasyncLocationHdfs> {
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
        private final imports.aws.datasync_location_hdfs.DatasyncLocationHdfsConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.datasync_location_hdfs.DatasyncLocationHdfsConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#agent_arns DatasyncLocationHdfs#agent_arns}.
         * <p>
         * @return {@code this}
         * @param agentArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#agent_arns DatasyncLocationHdfs#agent_arns}. This parameter is required.
         */
        public Builder agentArns(final java.util.List<java.lang.String> agentArns) {
            this.config.agentArns(agentArns);
            return this;
        }

        /**
         * name_node block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#name_node DatasyncLocationHdfs#name_node}
         * <p>
         * @return {@code this}
         * @param nameNode name_node block. This parameter is required.
         */
        public Builder nameNode(final com.hashicorp.cdktf.IResolvable nameNode) {
            this.config.nameNode(nameNode);
            return this;
        }
        /**
         * name_node block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#name_node DatasyncLocationHdfs#name_node}
         * <p>
         * @return {@code this}
         * @param nameNode name_node block. This parameter is required.
         */
        public Builder nameNode(final java.util.List<? extends imports.aws.datasync_location_hdfs.DatasyncLocationHdfsNameNode> nameNode) {
            this.config.nameNode(nameNode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#authentication_type DatasyncLocationHdfs#authentication_type}.
         * <p>
         * @return {@code this}
         * @param authenticationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#authentication_type DatasyncLocationHdfs#authentication_type}. This parameter is required.
         */
        public Builder authenticationType(final java.lang.String authenticationType) {
            this.config.authenticationType(authenticationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#block_size DatasyncLocationHdfs#block_size}.
         * <p>
         * @return {@code this}
         * @param blockSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#block_size DatasyncLocationHdfs#block_size}. This parameter is required.
         */
        public Builder blockSize(final java.lang.Number blockSize) {
            this.config.blockSize(blockSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#id DatasyncLocationHdfs#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#id DatasyncLocationHdfs#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab DatasyncLocationHdfs#kerberos_keytab}.
         * <p>
         * @return {@code this}
         * @param kerberosKeytab Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab DatasyncLocationHdfs#kerberos_keytab}. This parameter is required.
         */
        public Builder kerberosKeytab(final java.lang.String kerberosKeytab) {
            this.config.kerberosKeytab(kerberosKeytab);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab_base64 DatasyncLocationHdfs#kerberos_keytab_base64}.
         * <p>
         * @return {@code this}
         * @param kerberosKeytabBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_keytab_base64 DatasyncLocationHdfs#kerberos_keytab_base64}. This parameter is required.
         */
        public Builder kerberosKeytabBase64(final java.lang.String kerberosKeytabBase64) {
            this.config.kerberosKeytabBase64(kerberosKeytabBase64);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf DatasyncLocationHdfs#kerberos_krb5_conf}.
         * <p>
         * @return {@code this}
         * @param kerberosKrb5Conf Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf DatasyncLocationHdfs#kerberos_krb5_conf}. This parameter is required.
         */
        public Builder kerberosKrb5Conf(final java.lang.String kerberosKrb5Conf) {
            this.config.kerberosKrb5Conf(kerberosKrb5Conf);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf_base64 DatasyncLocationHdfs#kerberos_krb5_conf_base64}.
         * <p>
         * @return {@code this}
         * @param kerberosKrb5ConfBase64 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_krb5_conf_base64 DatasyncLocationHdfs#kerberos_krb5_conf_base64}. This parameter is required.
         */
        public Builder kerberosKrb5ConfBase64(final java.lang.String kerberosKrb5ConfBase64) {
            this.config.kerberosKrb5ConfBase64(kerberosKrb5ConfBase64);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_principal DatasyncLocationHdfs#kerberos_principal}.
         * <p>
         * @return {@code this}
         * @param kerberosPrincipal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kerberos_principal DatasyncLocationHdfs#kerberos_principal}. This parameter is required.
         */
        public Builder kerberosPrincipal(final java.lang.String kerberosPrincipal) {
            this.config.kerberosPrincipal(kerberosPrincipal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kms_key_provider_uri DatasyncLocationHdfs#kms_key_provider_uri}.
         * <p>
         * @return {@code this}
         * @param kmsKeyProviderUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#kms_key_provider_uri DatasyncLocationHdfs#kms_key_provider_uri}. This parameter is required.
         */
        public Builder kmsKeyProviderUri(final java.lang.String kmsKeyProviderUri) {
            this.config.kmsKeyProviderUri(kmsKeyProviderUri);
            return this;
        }

        /**
         * qop_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#qop_configuration DatasyncLocationHdfs#qop_configuration}
         * <p>
         * @return {@code this}
         * @param qopConfiguration qop_configuration block. This parameter is required.
         */
        public Builder qopConfiguration(final imports.aws.datasync_location_hdfs.DatasyncLocationHdfsQopConfiguration qopConfiguration) {
            this.config.qopConfiguration(qopConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#replication_factor DatasyncLocationHdfs#replication_factor}.
         * <p>
         * @return {@code this}
         * @param replicationFactor Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#replication_factor DatasyncLocationHdfs#replication_factor}. This parameter is required.
         */
        public Builder replicationFactor(final java.lang.Number replicationFactor) {
            this.config.replicationFactor(replicationFactor);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#simple_user DatasyncLocationHdfs#simple_user}.
         * <p>
         * @return {@code this}
         * @param simpleUser Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#simple_user DatasyncLocationHdfs#simple_user}. This parameter is required.
         */
        public Builder simpleUser(final java.lang.String simpleUser) {
            this.config.simpleUser(simpleUser);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#subdirectory DatasyncLocationHdfs#subdirectory}.
         * <p>
         * @return {@code this}
         * @param subdirectory Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#subdirectory DatasyncLocationHdfs#subdirectory}. This parameter is required.
         */
        public Builder subdirectory(final java.lang.String subdirectory) {
            this.config.subdirectory(subdirectory);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags DatasyncLocationHdfs#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags DatasyncLocationHdfs#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags_all DatasyncLocationHdfs#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_hdfs#tags_all DatasyncLocationHdfs#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.datasync_location_hdfs.DatasyncLocationHdfs}.
         */
        @Override
        public imports.aws.datasync_location_hdfs.DatasyncLocationHdfs build() {
            return new imports.aws.datasync_location_hdfs.DatasyncLocationHdfs(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
