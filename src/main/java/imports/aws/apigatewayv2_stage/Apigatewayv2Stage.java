package imports.aws.apigatewayv2_stage;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage aws_apigatewayv2_stage}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.973Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Stage.Apigatewayv2Stage")
public class Apigatewayv2Stage extends com.hashicorp.cdktf.TerraformResource {

    protected Apigatewayv2Stage(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Apigatewayv2Stage(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.apigatewayv2_stage.Apigatewayv2Stage.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage aws_apigatewayv2_stage} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Apigatewayv2Stage(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_stage.Apigatewayv2StageConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Stage resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Stage to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Stage that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Apigatewayv2Stage to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_stage.Apigatewayv2Stage.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Stage resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Stage to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Stage that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_stage.Apigatewayv2Stage.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAccessLogSettings(final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings value) {
        software.amazon.jsii.Kernel.call(this, "putAccessLogSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDefaultRouteSettings(final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings value) {
        software.amazon.jsii.Kernel.call(this, "putDefaultRouteSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRouteSettings(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettings>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettings> __cast_cd4240 = (java.util.List<imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettings>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettings __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putRouteSettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAccessLogSettings() {
        software.amazon.jsii.Kernel.call(this, "resetAccessLogSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAutoDeploy() {
        software.amazon.jsii.Kernel.call(this, "resetAutoDeploy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientCertificateId() {
        software.amazon.jsii.Kernel.call(this, "resetClientCertificateId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefaultRouteSettings() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultRouteSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDeploymentId() {
        software.amazon.jsii.Kernel.call(this, "resetDeploymentId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRouteSettings() {
        software.amazon.jsii.Kernel.call(this, "resetRouteSettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStageVariables() {
        software.amazon.jsii.Kernel.call(this, "resetStageVariables", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettingsOutputReference getAccessLogSettings() {
        return software.amazon.jsii.Kernel.get(this, "accessLogSettings", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettingsOutputReference getDefaultRouteSettings() {
        return software.amazon.jsii.Kernel.get(this, "defaultRouteSettings", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getExecutionArn() {
        return software.amazon.jsii.Kernel.get(this, "executionArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInvokeUrl() {
        return software.amazon.jsii.Kernel.get(this, "invokeUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettingsList getRouteSettings() {
        return software.amazon.jsii.Kernel.get(this, "routeSettings", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettingsList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings getAccessLogSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "accessLogSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "apiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAutoDeployInput() {
        return software.amazon.jsii.Kernel.get(this, "autoDeployInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientCertificateIdInput() {
        return software.amazon.jsii.Kernel.get(this, "clientCertificateIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings getDefaultRouteSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultRouteSettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDeploymentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "deploymentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getRouteSettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "routeSettingsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getStageVariablesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "stageVariablesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiId() {
        return software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiId", java.util.Objects.requireNonNull(value, "apiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getAutoDeploy() {
        return software.amazon.jsii.Kernel.get(this, "autoDeploy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setAutoDeploy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "autoDeploy", java.util.Objects.requireNonNull(value, "autoDeploy is required"));
    }

    public void setAutoDeploy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "autoDeploy", java.util.Objects.requireNonNull(value, "autoDeploy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientCertificateId() {
        return software.amazon.jsii.Kernel.get(this, "clientCertificateId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientCertificateId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientCertificateId", java.util.Objects.requireNonNull(value, "clientCertificateId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDeploymentId() {
        return software.amazon.jsii.Kernel.get(this, "deploymentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDeploymentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "deploymentId", java.util.Objects.requireNonNull(value, "deploymentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
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

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getStageVariables() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "stageVariables", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setStageVariables(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "stageVariables", java.util.Objects.requireNonNull(value, "stageVariables is required"));
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
     * A fluent builder for {@link imports.aws.apigatewayv2_stage.Apigatewayv2Stage}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.apigatewayv2_stage.Apigatewayv2Stage> {
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
        private final imports.aws.apigatewayv2_stage.Apigatewayv2StageConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.apigatewayv2_stage.Apigatewayv2StageConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#api_id Apigatewayv2Stage#api_id}.
         * <p>
         * @return {@code this}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#api_id Apigatewayv2Stage#api_id}. This parameter is required.
         */
        public Builder apiId(final java.lang.String apiId) {
            this.config.apiId(apiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#name Apigatewayv2Stage#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#name Apigatewayv2Stage#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * access_log_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#access_log_settings Apigatewayv2Stage#access_log_settings}
         * <p>
         * @return {@code this}
         * @param accessLogSettings access_log_settings block. This parameter is required.
         */
        public Builder accessLogSettings(final imports.aws.apigatewayv2_stage.Apigatewayv2StageAccessLogSettings accessLogSettings) {
            this.config.accessLogSettings(accessLogSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#auto_deploy Apigatewayv2Stage#auto_deploy}.
         * <p>
         * @return {@code this}
         * @param autoDeploy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#auto_deploy Apigatewayv2Stage#auto_deploy}. This parameter is required.
         */
        public Builder autoDeploy(final java.lang.Boolean autoDeploy) {
            this.config.autoDeploy(autoDeploy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#auto_deploy Apigatewayv2Stage#auto_deploy}.
         * <p>
         * @return {@code this}
         * @param autoDeploy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#auto_deploy Apigatewayv2Stage#auto_deploy}. This parameter is required.
         */
        public Builder autoDeploy(final com.hashicorp.cdktf.IResolvable autoDeploy) {
            this.config.autoDeploy(autoDeploy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#client_certificate_id Apigatewayv2Stage#client_certificate_id}.
         * <p>
         * @return {@code this}
         * @param clientCertificateId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#client_certificate_id Apigatewayv2Stage#client_certificate_id}. This parameter is required.
         */
        public Builder clientCertificateId(final java.lang.String clientCertificateId) {
            this.config.clientCertificateId(clientCertificateId);
            return this;
        }

        /**
         * default_route_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#default_route_settings Apigatewayv2Stage#default_route_settings}
         * <p>
         * @return {@code this}
         * @param defaultRouteSettings default_route_settings block. This parameter is required.
         */
        public Builder defaultRouteSettings(final imports.aws.apigatewayv2_stage.Apigatewayv2StageDefaultRouteSettings defaultRouteSettings) {
            this.config.defaultRouteSettings(defaultRouteSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#deployment_id Apigatewayv2Stage#deployment_id}.
         * <p>
         * @return {@code this}
         * @param deploymentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#deployment_id Apigatewayv2Stage#deployment_id}. This parameter is required.
         */
        public Builder deploymentId(final java.lang.String deploymentId) {
            this.config.deploymentId(deploymentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#description Apigatewayv2Stage#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#description Apigatewayv2Stage#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#id Apigatewayv2Stage#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#id Apigatewayv2Stage#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * route_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#route_settings Apigatewayv2Stage#route_settings}
         * <p>
         * @return {@code this}
         * @param routeSettings route_settings block. This parameter is required.
         */
        public Builder routeSettings(final com.hashicorp.cdktf.IResolvable routeSettings) {
            this.config.routeSettings(routeSettings);
            return this;
        }
        /**
         * route_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#route_settings Apigatewayv2Stage#route_settings}
         * <p>
         * @return {@code this}
         * @param routeSettings route_settings block. This parameter is required.
         */
        public Builder routeSettings(final java.util.List<? extends imports.aws.apigatewayv2_stage.Apigatewayv2StageRouteSettings> routeSettings) {
            this.config.routeSettings(routeSettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#stage_variables Apigatewayv2Stage#stage_variables}.
         * <p>
         * @return {@code this}
         * @param stageVariables Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#stage_variables Apigatewayv2Stage#stage_variables}. This parameter is required.
         */
        public Builder stageVariables(final java.util.Map<java.lang.String, java.lang.String> stageVariables) {
            this.config.stageVariables(stageVariables);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags Apigatewayv2Stage#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags Apigatewayv2Stage#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags_all Apigatewayv2Stage#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_stage#tags_all Apigatewayv2Stage#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.apigatewayv2_stage.Apigatewayv2Stage}.
         */
        @Override
        public imports.aws.apigatewayv2_stage.Apigatewayv2Stage build() {
            return new imports.aws.apigatewayv2_stage.Apigatewayv2Stage(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
