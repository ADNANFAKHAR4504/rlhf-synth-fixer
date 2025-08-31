package imports.aws.opsworks_application;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application aws_opsworks_application}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.000Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksApplication.OpsworksApplication")
public class OpsworksApplication extends com.hashicorp.cdktf.TerraformResource {

    protected OpsworksApplication(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected OpsworksApplication(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.opsworks_application.OpsworksApplication.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application aws_opsworks_application} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public OpsworksApplication(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.opsworks_application.OpsworksApplicationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a OpsworksApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksApplication to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksApplication that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the OpsworksApplication to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_application.OpsworksApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a OpsworksApplication resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the OpsworksApplication to import. This parameter is required.
     * @param importFromId The id of the existing OpsworksApplication that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.opsworks_application.OpsworksApplication.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAppSource(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_application.OpsworksApplicationAppSource>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_application.OpsworksApplicationAppSource> __cast_cd4240 = (java.util.List<imports.aws.opsworks_application.OpsworksApplicationAppSource>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_application.OpsworksApplicationAppSource __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAppSource", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEnvironment(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_application.OpsworksApplicationEnvironment>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_application.OpsworksApplicationEnvironment> __cast_cd4240 = (java.util.List<imports.aws.opsworks_application.OpsworksApplicationEnvironment>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_application.OpsworksApplicationEnvironment __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putEnvironment", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSslConfiguration(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.opsworks_application.OpsworksApplicationSslConfiguration>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.opsworks_application.OpsworksApplicationSslConfiguration> __cast_cd4240 = (java.util.List<imports.aws.opsworks_application.OpsworksApplicationSslConfiguration>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.opsworks_application.OpsworksApplicationSslConfiguration __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putSslConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAppSource() {
        software.amazon.jsii.Kernel.call(this, "resetAppSource", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoBundleOnDeploy() {
        software.amazon.jsii.Kernel.call(this, "resetAutoBundleOnDeploy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAwsFlowRubySettings() {
        software.amazon.jsii.Kernel.call(this, "resetAwsFlowRubySettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataSourceArn() {
        software.amazon.jsii.Kernel.call(this, "resetDataSourceArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataSourceDatabaseName() {
        software.amazon.jsii.Kernel.call(this, "resetDataSourceDatabaseName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataSourceType() {
        software.amazon.jsii.Kernel.call(this, "resetDataSourceType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDocumentRoot() {
        software.amazon.jsii.Kernel.call(this, "resetDocumentRoot", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDomains() {
        software.amazon.jsii.Kernel.call(this, "resetDomains", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnableSsl() {
        software.amazon.jsii.Kernel.call(this, "resetEnableSsl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEnvironment() {
        software.amazon.jsii.Kernel.call(this, "resetEnvironment", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRailsEnv() {
        software.amazon.jsii.Kernel.call(this, "resetRailsEnv", software.amazon.jsii.NativeType.VOID);
    }

    public void resetShortName() {
        software.amazon.jsii.Kernel.call(this, "resetShortName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSslConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetSslConfiguration", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_application.OpsworksApplicationAppSourceList getAppSource() {
        return software.amazon.jsii.Kernel.get(this, "appSource", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_application.OpsworksApplicationAppSourceList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_application.OpsworksApplicationEnvironmentList getEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "environment", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_application.OpsworksApplicationEnvironmentList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.opsworks_application.OpsworksApplicationSslConfigurationList getSslConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "sslConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.opsworks_application.OpsworksApplicationSslConfigurationList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAppSourceInput() {
        return software.amazon.jsii.Kernel.get(this, "appSourceInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAutoBundleOnDeployInput() {
        return software.amazon.jsii.Kernel.get(this, "autoBundleOnDeployInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsFlowRubySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "awsFlowRubySettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceDatabaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSourceTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDocumentRootInput() {
        return software.amazon.jsii.Kernel.get(this, "documentRootInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDomainsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "domainsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableSslInput() {
        return software.amazon.jsii.Kernel.get(this, "enableSslInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnvironmentInput() {
        return software.amazon.jsii.Kernel.get(this, "environmentInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRailsEnvInput() {
        return software.amazon.jsii.Kernel.get(this, "railsEnvInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getShortNameInput() {
        return software.amazon.jsii.Kernel.get(this, "shortNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSslConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "sslConfigurationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStackIdInput() {
        return software.amazon.jsii.Kernel.get(this, "stackIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAutoBundleOnDeploy() {
        return software.amazon.jsii.Kernel.get(this, "autoBundleOnDeploy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAutoBundleOnDeploy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "autoBundleOnDeploy", java.util.Objects.requireNonNull(value, "autoBundleOnDeploy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsFlowRubySettings() {
        return software.amazon.jsii.Kernel.get(this, "awsFlowRubySettings", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsFlowRubySettings(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsFlowRubySettings", java.util.Objects.requireNonNull(value, "awsFlowRubySettings is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSourceArn() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSourceArn", java.util.Objects.requireNonNull(value, "dataSourceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSourceDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSourceDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSourceDatabaseName", java.util.Objects.requireNonNull(value, "dataSourceDatabaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSourceType() {
        return software.amazon.jsii.Kernel.get(this, "dataSourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSourceType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSourceType", java.util.Objects.requireNonNull(value, "dataSourceType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDocumentRoot() {
        return software.amazon.jsii.Kernel.get(this, "documentRoot", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDocumentRoot(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "documentRoot", java.util.Objects.requireNonNull(value, "documentRoot is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDomains() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "domains", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDomains(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "domains", java.util.Objects.requireNonNull(value, "domains is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableSsl() {
        return software.amazon.jsii.Kernel.get(this, "enableSsl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableSsl(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableSsl", java.util.Objects.requireNonNull(value, "enableSsl is required"));
    }

    public void setEnableSsl(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableSsl", java.util.Objects.requireNonNull(value, "enableSsl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRailsEnv() {
        return software.amazon.jsii.Kernel.get(this, "railsEnv", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRailsEnv(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "railsEnv", java.util.Objects.requireNonNull(value, "railsEnv is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getShortName() {
        return software.amazon.jsii.Kernel.get(this, "shortName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setShortName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "shortName", java.util.Objects.requireNonNull(value, "shortName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStackId() {
        return software.amazon.jsii.Kernel.get(this, "stackId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStackId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "stackId", java.util.Objects.requireNonNull(value, "stackId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.opsworks_application.OpsworksApplication}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.opsworks_application.OpsworksApplication> {
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
        private final imports.aws.opsworks_application.OpsworksApplicationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.opsworks_application.OpsworksApplicationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#name OpsworksApplication#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#name OpsworksApplication#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#stack_id OpsworksApplication#stack_id}.
         * <p>
         * @return {@code this}
         * @param stackId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#stack_id OpsworksApplication#stack_id}. This parameter is required.
         */
        public Builder stackId(final java.lang.String stackId) {
            this.config.stackId(stackId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#type OpsworksApplication#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#type OpsworksApplication#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * app_source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#app_source OpsworksApplication#app_source}
         * <p>
         * @return {@code this}
         * @param appSource app_source block. This parameter is required.
         */
        public Builder appSource(final com.hashicorp.cdktf.IResolvable appSource) {
            this.config.appSource(appSource);
            return this;
        }
        /**
         * app_source block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#app_source OpsworksApplication#app_source}
         * <p>
         * @return {@code this}
         * @param appSource app_source block. This parameter is required.
         */
        public Builder appSource(final java.util.List<? extends imports.aws.opsworks_application.OpsworksApplicationAppSource> appSource) {
            this.config.appSource(appSource);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#auto_bundle_on_deploy OpsworksApplication#auto_bundle_on_deploy}.
         * <p>
         * @return {@code this}
         * @param autoBundleOnDeploy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#auto_bundle_on_deploy OpsworksApplication#auto_bundle_on_deploy}. This parameter is required.
         */
        public Builder autoBundleOnDeploy(final java.lang.String autoBundleOnDeploy) {
            this.config.autoBundleOnDeploy(autoBundleOnDeploy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#aws_flow_ruby_settings OpsworksApplication#aws_flow_ruby_settings}.
         * <p>
         * @return {@code this}
         * @param awsFlowRubySettings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#aws_flow_ruby_settings OpsworksApplication#aws_flow_ruby_settings}. This parameter is required.
         */
        public Builder awsFlowRubySettings(final java.lang.String awsFlowRubySettings) {
            this.config.awsFlowRubySettings(awsFlowRubySettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_arn OpsworksApplication#data_source_arn}.
         * <p>
         * @return {@code this}
         * @param dataSourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_arn OpsworksApplication#data_source_arn}. This parameter is required.
         */
        public Builder dataSourceArn(final java.lang.String dataSourceArn) {
            this.config.dataSourceArn(dataSourceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_database_name OpsworksApplication#data_source_database_name}.
         * <p>
         * @return {@code this}
         * @param dataSourceDatabaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_database_name OpsworksApplication#data_source_database_name}. This parameter is required.
         */
        public Builder dataSourceDatabaseName(final java.lang.String dataSourceDatabaseName) {
            this.config.dataSourceDatabaseName(dataSourceDatabaseName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_type OpsworksApplication#data_source_type}.
         * <p>
         * @return {@code this}
         * @param dataSourceType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#data_source_type OpsworksApplication#data_source_type}. This parameter is required.
         */
        public Builder dataSourceType(final java.lang.String dataSourceType) {
            this.config.dataSourceType(dataSourceType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#description OpsworksApplication#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#description OpsworksApplication#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#document_root OpsworksApplication#document_root}.
         * <p>
         * @return {@code this}
         * @param documentRoot Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#document_root OpsworksApplication#document_root}. This parameter is required.
         */
        public Builder documentRoot(final java.lang.String documentRoot) {
            this.config.documentRoot(documentRoot);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#domains OpsworksApplication#domains}.
         * <p>
         * @return {@code this}
         * @param domains Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#domains OpsworksApplication#domains}. This parameter is required.
         */
        public Builder domains(final java.util.List<java.lang.String> domains) {
            this.config.domains(domains);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#enable_ssl OpsworksApplication#enable_ssl}.
         * <p>
         * @return {@code this}
         * @param enableSsl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#enable_ssl OpsworksApplication#enable_ssl}. This parameter is required.
         */
        public Builder enableSsl(final java.lang.Boolean enableSsl) {
            this.config.enableSsl(enableSsl);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#enable_ssl OpsworksApplication#enable_ssl}.
         * <p>
         * @return {@code this}
         * @param enableSsl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#enable_ssl OpsworksApplication#enable_ssl}. This parameter is required.
         */
        public Builder enableSsl(final com.hashicorp.cdktf.IResolvable enableSsl) {
            this.config.enableSsl(enableSsl);
            return this;
        }

        /**
         * environment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#environment OpsworksApplication#environment}
         * <p>
         * @return {@code this}
         * @param environment environment block. This parameter is required.
         */
        public Builder environment(final com.hashicorp.cdktf.IResolvable environment) {
            this.config.environment(environment);
            return this;
        }
        /**
         * environment block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#environment OpsworksApplication#environment}
         * <p>
         * @return {@code this}
         * @param environment environment block. This parameter is required.
         */
        public Builder environment(final java.util.List<? extends imports.aws.opsworks_application.OpsworksApplicationEnvironment> environment) {
            this.config.environment(environment);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#id OpsworksApplication#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#id OpsworksApplication#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#rails_env OpsworksApplication#rails_env}.
         * <p>
         * @return {@code this}
         * @param railsEnv Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#rails_env OpsworksApplication#rails_env}. This parameter is required.
         */
        public Builder railsEnv(final java.lang.String railsEnv) {
            this.config.railsEnv(railsEnv);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#short_name OpsworksApplication#short_name}.
         * <p>
         * @return {@code this}
         * @param shortName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#short_name OpsworksApplication#short_name}. This parameter is required.
         */
        public Builder shortName(final java.lang.String shortName) {
            this.config.shortName(shortName);
            return this;
        }

        /**
         * ssl_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#ssl_configuration OpsworksApplication#ssl_configuration}
         * <p>
         * @return {@code this}
         * @param sslConfiguration ssl_configuration block. This parameter is required.
         */
        public Builder sslConfiguration(final com.hashicorp.cdktf.IResolvable sslConfiguration) {
            this.config.sslConfiguration(sslConfiguration);
            return this;
        }
        /**
         * ssl_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_application#ssl_configuration OpsworksApplication#ssl_configuration}
         * <p>
         * @return {@code this}
         * @param sslConfiguration ssl_configuration block. This parameter is required.
         */
        public Builder sslConfiguration(final java.util.List<? extends imports.aws.opsworks_application.OpsworksApplicationSslConfiguration> sslConfiguration) {
            this.config.sslConfiguration(sslConfiguration);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.opsworks_application.OpsworksApplication}.
         */
        @Override
        public imports.aws.opsworks_application.OpsworksApplication build() {
            return new imports.aws.opsworks_application.OpsworksApplication(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
