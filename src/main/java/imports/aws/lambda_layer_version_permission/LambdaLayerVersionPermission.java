package imports.aws.lambda_layer_version_permission;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission aws_lambda_layer_version_permission}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.511Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaLayerVersionPermission.LambdaLayerVersionPermission")
public class LambdaLayerVersionPermission extends com.hashicorp.cdktf.TerraformResource {

    protected LambdaLayerVersionPermission(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaLayerVersionPermission(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission aws_lambda_layer_version_permission} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LambdaLayerVersionPermission(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermissionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LambdaLayerVersionPermission resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaLayerVersionPermission to import. This parameter is required.
     * @param importFromId The id of the existing LambdaLayerVersionPermission that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LambdaLayerVersionPermission to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LambdaLayerVersionPermission resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaLayerVersionPermission to import. This parameter is required.
     * @param importFromId The id of the existing LambdaLayerVersionPermission that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOrganizationId() {
        software.amazon.jsii.Kernel.call(this, "resetOrganizationId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSkipDestroy() {
        software.amazon.jsii.Kernel.call(this, "resetSkipDestroy", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getPolicy() {
        return software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRevisionId() {
        return software.amazon.jsii.Kernel.get(this, "revisionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLayerNameInput() {
        return software.amazon.jsii.Kernel.get(this, "layerNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOrganizationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "organizationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "principalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSkipDestroyInput() {
        return software.amazon.jsii.Kernel.get(this, "skipDestroyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatementIdInput() {
        return software.amazon.jsii.Kernel.get(this, "statementIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVersionNumberInput() {
        return software.amazon.jsii.Kernel.get(this, "versionNumberInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "action", java.util.Objects.requireNonNull(value, "action is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLayerName() {
        return software.amazon.jsii.Kernel.get(this, "layerName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLayerName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "layerName", java.util.Objects.requireNonNull(value, "layerName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOrganizationId() {
        return software.amazon.jsii.Kernel.get(this, "organizationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOrganizationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "organizationId", java.util.Objects.requireNonNull(value, "organizationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrincipal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "principal", java.util.Objects.requireNonNull(value, "principal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSkipDestroy() {
        return software.amazon.jsii.Kernel.get(this, "skipDestroy", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSkipDestroy(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "skipDestroy", java.util.Objects.requireNonNull(value, "skipDestroy is required"));
    }

    public void setSkipDestroy(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "skipDestroy", java.util.Objects.requireNonNull(value, "skipDestroy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatementId() {
        return software.amazon.jsii.Kernel.get(this, "statementId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatementId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statementId", java.util.Objects.requireNonNull(value, "statementId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVersionNumber() {
        return software.amazon.jsii.Kernel.get(this, "versionNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVersionNumber(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "versionNumber", java.util.Objects.requireNonNull(value, "versionNumber is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission> {
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
        private final imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermissionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermissionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#action LambdaLayerVersionPermission#action}.
         * <p>
         * @return {@code this}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#action LambdaLayerVersionPermission#action}. This parameter is required.
         */
        public Builder action(final java.lang.String action) {
            this.config.action(action);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#layer_name LambdaLayerVersionPermission#layer_name}.
         * <p>
         * @return {@code this}
         * @param layerName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#layer_name LambdaLayerVersionPermission#layer_name}. This parameter is required.
         */
        public Builder layerName(final java.lang.String layerName) {
            this.config.layerName(layerName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#principal LambdaLayerVersionPermission#principal}.
         * <p>
         * @return {@code this}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#principal LambdaLayerVersionPermission#principal}. This parameter is required.
         */
        public Builder principal(final java.lang.String principal) {
            this.config.principal(principal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#statement_id LambdaLayerVersionPermission#statement_id}.
         * <p>
         * @return {@code this}
         * @param statementId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#statement_id LambdaLayerVersionPermission#statement_id}. This parameter is required.
         */
        public Builder statementId(final java.lang.String statementId) {
            this.config.statementId(statementId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#version_number LambdaLayerVersionPermission#version_number}.
         * <p>
         * @return {@code this}
         * @param versionNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#version_number LambdaLayerVersionPermission#version_number}. This parameter is required.
         */
        public Builder versionNumber(final java.lang.Number versionNumber) {
            this.config.versionNumber(versionNumber);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#id LambdaLayerVersionPermission#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#id LambdaLayerVersionPermission#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#organization_id LambdaLayerVersionPermission#organization_id}.
         * <p>
         * @return {@code this}
         * @param organizationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#organization_id LambdaLayerVersionPermission#organization_id}. This parameter is required.
         */
        public Builder organizationId(final java.lang.String organizationId) {
            this.config.organizationId(organizationId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#skip_destroy LambdaLayerVersionPermission#skip_destroy}.
         * <p>
         * @return {@code this}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#skip_destroy LambdaLayerVersionPermission#skip_destroy}. This parameter is required.
         */
        public Builder skipDestroy(final java.lang.Boolean skipDestroy) {
            this.config.skipDestroy(skipDestroy);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#skip_destroy LambdaLayerVersionPermission#skip_destroy}.
         * <p>
         * @return {@code this}
         * @param skipDestroy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_layer_version_permission#skip_destroy LambdaLayerVersionPermission#skip_destroy}. This parameter is required.
         */
        public Builder skipDestroy(final com.hashicorp.cdktf.IResolvable skipDestroy) {
            this.config.skipDestroy(skipDestroy);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission}.
         */
        @Override
        public imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission build() {
            return new imports.aws.lambda_layer_version_permission.LambdaLayerVersionPermission(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
