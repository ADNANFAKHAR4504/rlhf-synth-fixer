package imports.aws.quicksight_analysis;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis aws_quicksight_analysis}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.096Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightAnalysis.QuicksightAnalysis")
public class QuicksightAnalysis extends com.hashicorp.cdktf.TerraformResource {

    protected QuicksightAnalysis(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightAnalysis(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.quicksight_analysis.QuicksightAnalysis.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis aws_quicksight_analysis} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public QuicksightAnalysis(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a QuicksightAnalysis resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightAnalysis to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightAnalysis that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the QuicksightAnalysis to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_analysis.QuicksightAnalysis.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a QuicksightAnalysis resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightAnalysis to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightAnalysis that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_analysis.QuicksightAnalysis.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putParameters(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisParameters value) {
        software.amazon.jsii.Kernel.call(this, "putParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPermissions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_analysis.QuicksightAnalysisPermissions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_analysis.QuicksightAnalysisPermissions> __cast_cd4240 = (java.util.List<imports.aws.quicksight_analysis.QuicksightAnalysisPermissions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_analysis.QuicksightAnalysisPermissions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSourceEntity(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity value) {
        software.amazon.jsii.Kernel.call(this, "putSourceEntity", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDefinition() {
        software.amazon.jsii.Kernel.call(this, "resetDefinition", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameters() {
        software.amazon.jsii.Kernel.call(this, "resetParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRecoveryWindowInDays() {
        software.amazon.jsii.Kernel.call(this, "resetRecoveryWindowInDays", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceEntity() {
        software.amazon.jsii.Kernel.call(this, "resetSourceEntity", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetThemeArn() {
        software.amazon.jsii.Kernel.call(this, "resetThemeArn", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCreatedTime() {
        return software.amazon.jsii.Kernel.get(this, "createdTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDefinitionInput() {
        return software.amazon.jsii.Kernel.get(this, "definitionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastPublishedTime() {
        return software.amazon.jsii.Kernel.get(this, "lastPublishedTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLastUpdatedTime() {
        return software.amazon.jsii.Kernel.get(this, "lastUpdatedTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisParametersOutputReference getParameters() {
        return software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisParametersOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisPermissionsList getPermissions() {
        return software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisPermissionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntityOutputReference getSourceEntity() {
        return software.amazon.jsii.Kernel.get(this, "sourceEntity", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntityOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_analysis.QuicksightAnalysisTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAnalysisIdInput() {
        return software.amazon.jsii.Kernel.get(this, "analysisIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisParameters getParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "parametersInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisParameters.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getRecoveryWindowInDaysInput() {
        return software.amazon.jsii.Kernel.get(this, "recoveryWindowInDaysInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity getSourceEntityInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceEntityInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getThemeArnInput() {
        return software.amazon.jsii.Kernel.get(this, "themeArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAnalysisId() {
        return software.amazon.jsii.Kernel.get(this, "analysisId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAnalysisId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "analysisId", java.util.Objects.requireNonNull(value, "analysisId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsAccountId", java.util.Objects.requireNonNull(value, "awsAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDefinition() {
        return software.amazon.jsii.Kernel.get(this, "definition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDefinition(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        software.amazon.jsii.Kernel.set(this, "definition", java.util.Objects.requireNonNull(value, "definition is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.Number getRecoveryWindowInDays() {
        return software.amazon.jsii.Kernel.get(this, "recoveryWindowInDays", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setRecoveryWindowInDays(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "recoveryWindowInDays", java.util.Objects.requireNonNull(value, "recoveryWindowInDays is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getThemeArn() {
        return software.amazon.jsii.Kernel.get(this, "themeArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setThemeArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "themeArn", java.util.Objects.requireNonNull(value, "themeArn is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.quicksight_analysis.QuicksightAnalysis}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.quicksight_analysis.QuicksightAnalysis> {
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
        private final imports.aws.quicksight_analysis.QuicksightAnalysisConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.quicksight_analysis.QuicksightAnalysisConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#analysis_id QuicksightAnalysis#analysis_id}.
         * <p>
         * @return {@code this}
         * @param analysisId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#analysis_id QuicksightAnalysis#analysis_id}. This parameter is required.
         */
        public Builder analysisId(final java.lang.String analysisId) {
            this.config.analysisId(analysisId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#name QuicksightAnalysis#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#name QuicksightAnalysis#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#aws_account_id QuicksightAnalysis#aws_account_id}.
         * <p>
         * @return {@code this}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#aws_account_id QuicksightAnalysis#aws_account_id}. This parameter is required.
         */
        public Builder awsAccountId(final java.lang.String awsAccountId) {
            this.config.awsAccountId(awsAccountId);
            return this;
        }

        /**
         * definition block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#definition QuicksightAnalysis#definition}
         * <p>
         * @return {@code this}
         * @param definition definition block. This parameter is required.
         */
        public Builder definition(final java.lang.Object definition) {
            this.config.definition(definition);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#id QuicksightAnalysis#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#id QuicksightAnalysis#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#parameters QuicksightAnalysis#parameters}
         * <p>
         * @return {@code this}
         * @param parameters parameters block. This parameter is required.
         */
        public Builder parameters(final imports.aws.quicksight_analysis.QuicksightAnalysisParameters parameters) {
            this.config.parameters(parameters);
            return this;
        }

        /**
         * permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#permissions QuicksightAnalysis#permissions}
         * <p>
         * @return {@code this}
         * @param permissions permissions block. This parameter is required.
         */
        public Builder permissions(final com.hashicorp.cdktf.IResolvable permissions) {
            this.config.permissions(permissions);
            return this;
        }
        /**
         * permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#permissions QuicksightAnalysis#permissions}
         * <p>
         * @return {@code this}
         * @param permissions permissions block. This parameter is required.
         */
        public Builder permissions(final java.util.List<? extends imports.aws.quicksight_analysis.QuicksightAnalysisPermissions> permissions) {
            this.config.permissions(permissions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#recovery_window_in_days QuicksightAnalysis#recovery_window_in_days}.
         * <p>
         * @return {@code this}
         * @param recoveryWindowInDays Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#recovery_window_in_days QuicksightAnalysis#recovery_window_in_days}. This parameter is required.
         */
        public Builder recoveryWindowInDays(final java.lang.Number recoveryWindowInDays) {
            this.config.recoveryWindowInDays(recoveryWindowInDays);
            return this;
        }

        /**
         * source_entity block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#source_entity QuicksightAnalysis#source_entity}
         * <p>
         * @return {@code this}
         * @param sourceEntity source_entity block. This parameter is required.
         */
        public Builder sourceEntity(final imports.aws.quicksight_analysis.QuicksightAnalysisSourceEntity sourceEntity) {
            this.config.sourceEntity(sourceEntity);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags QuicksightAnalysis#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags QuicksightAnalysis#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags_all QuicksightAnalysis#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#tags_all QuicksightAnalysis#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#theme_arn QuicksightAnalysis#theme_arn}.
         * <p>
         * @return {@code this}
         * @param themeArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#theme_arn QuicksightAnalysis#theme_arn}. This parameter is required.
         */
        public Builder themeArn(final java.lang.String themeArn) {
            this.config.themeArn(themeArn);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_analysis#timeouts QuicksightAnalysis#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.quicksight_analysis.QuicksightAnalysisTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.quicksight_analysis.QuicksightAnalysis}.
         */
        @Override
        public imports.aws.quicksight_analysis.QuicksightAnalysis build() {
            return new imports.aws.quicksight_analysis.QuicksightAnalysis(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
