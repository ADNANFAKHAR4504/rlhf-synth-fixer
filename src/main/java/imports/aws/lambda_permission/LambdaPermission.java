package imports.aws.lambda_permission;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission aws_lambda_permission}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.512Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lambdaPermission.LambdaPermission")
public class LambdaPermission extends com.hashicorp.cdktf.TerraformResource {

    protected LambdaPermission(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected LambdaPermission(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.lambda_permission.LambdaPermission.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission aws_lambda_permission} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public LambdaPermission(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.lambda_permission.LambdaPermissionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a LambdaPermission resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaPermission to import. This parameter is required.
     * @param importFromId The id of the existing LambdaPermission that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the LambdaPermission to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_permission.LambdaPermission.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a LambdaPermission resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the LambdaPermission to import. This parameter is required.
     * @param importFromId The id of the existing LambdaPermission that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.lambda_permission.LambdaPermission.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetEventSourceToken() {
        software.amazon.jsii.Kernel.call(this, "resetEventSourceToken", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFunctionUrlAuthType() {
        software.amazon.jsii.Kernel.call(this, "resetFunctionUrlAuthType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPrincipalOrgId() {
        software.amazon.jsii.Kernel.call(this, "resetPrincipalOrgId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetQualifier() {
        software.amazon.jsii.Kernel.call(this, "resetQualifier", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceAccount() {
        software.amazon.jsii.Kernel.call(this, "resetSourceAccount", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSourceArn() {
        software.amazon.jsii.Kernel.call(this, "resetSourceArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatementId() {
        software.amazon.jsii.Kernel.call(this, "resetStatementId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStatementIdPrefix() {
        software.amazon.jsii.Kernel.call(this, "resetStatementIdPrefix", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getActionInput() {
        return software.amazon.jsii.Kernel.get(this, "actionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEventSourceTokenInput() {
        return software.amazon.jsii.Kernel.get(this, "eventSourceTokenInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionNameInput() {
        return software.amazon.jsii.Kernel.get(this, "functionNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getFunctionUrlAuthTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "functionUrlAuthTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrincipalInput() {
        return software.amazon.jsii.Kernel.get(this, "principalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPrincipalOrgIdInput() {
        return software.amazon.jsii.Kernel.get(this, "principalOrgIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getQualifierInput() {
        return software.amazon.jsii.Kernel.get(this, "qualifierInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceAccountInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceAccountInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSourceArnInput() {
        return software.amazon.jsii.Kernel.get(this, "sourceArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatementIdInput() {
        return software.amazon.jsii.Kernel.get(this, "statementIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStatementIdPrefixInput() {
        return software.amazon.jsii.Kernel.get(this, "statementIdPrefixInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAction() {
        return software.amazon.jsii.Kernel.get(this, "action", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "action", java.util.Objects.requireNonNull(value, "action is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEventSourceToken() {
        return software.amazon.jsii.Kernel.get(this, "eventSourceToken", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEventSourceToken(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "eventSourceToken", java.util.Objects.requireNonNull(value, "eventSourceToken is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionName() {
        return software.amazon.jsii.Kernel.get(this, "functionName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionName", java.util.Objects.requireNonNull(value, "functionName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getFunctionUrlAuthType() {
        return software.amazon.jsii.Kernel.get(this, "functionUrlAuthType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setFunctionUrlAuthType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "functionUrlAuthType", java.util.Objects.requireNonNull(value, "functionUrlAuthType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrincipal() {
        return software.amazon.jsii.Kernel.get(this, "principal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrincipal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "principal", java.util.Objects.requireNonNull(value, "principal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPrincipalOrgId() {
        return software.amazon.jsii.Kernel.get(this, "principalOrgId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPrincipalOrgId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "principalOrgId", java.util.Objects.requireNonNull(value, "principalOrgId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getQualifier() {
        return software.amazon.jsii.Kernel.get(this, "qualifier", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setQualifier(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "qualifier", java.util.Objects.requireNonNull(value, "qualifier is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceAccount() {
        return software.amazon.jsii.Kernel.get(this, "sourceAccount", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceAccount(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceAccount", java.util.Objects.requireNonNull(value, "sourceAccount is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSourceArn() {
        return software.amazon.jsii.Kernel.get(this, "sourceArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSourceArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "sourceArn", java.util.Objects.requireNonNull(value, "sourceArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatementId() {
        return software.amazon.jsii.Kernel.get(this, "statementId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatementId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statementId", java.util.Objects.requireNonNull(value, "statementId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatementIdPrefix() {
        return software.amazon.jsii.Kernel.get(this, "statementIdPrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStatementIdPrefix(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "statementIdPrefix", java.util.Objects.requireNonNull(value, "statementIdPrefix is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.lambda_permission.LambdaPermission}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.lambda_permission.LambdaPermission> {
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
        private final imports.aws.lambda_permission.LambdaPermissionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.lambda_permission.LambdaPermissionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#action LambdaPermission#action}.
         * <p>
         * @return {@code this}
         * @param action Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#action LambdaPermission#action}. This parameter is required.
         */
        public Builder action(final java.lang.String action) {
            this.config.action(action);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_name LambdaPermission#function_name}.
         * <p>
         * @return {@code this}
         * @param functionName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_name LambdaPermission#function_name}. This parameter is required.
         */
        public Builder functionName(final java.lang.String functionName) {
            this.config.functionName(functionName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal LambdaPermission#principal}.
         * <p>
         * @return {@code this}
         * @param principal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal LambdaPermission#principal}. This parameter is required.
         */
        public Builder principal(final java.lang.String principal) {
            this.config.principal(principal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#event_source_token LambdaPermission#event_source_token}.
         * <p>
         * @return {@code this}
         * @param eventSourceToken Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#event_source_token LambdaPermission#event_source_token}. This parameter is required.
         */
        public Builder eventSourceToken(final java.lang.String eventSourceToken) {
            this.config.eventSourceToken(eventSourceToken);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_url_auth_type LambdaPermission#function_url_auth_type}.
         * <p>
         * @return {@code this}
         * @param functionUrlAuthType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#function_url_auth_type LambdaPermission#function_url_auth_type}. This parameter is required.
         */
        public Builder functionUrlAuthType(final java.lang.String functionUrlAuthType) {
            this.config.functionUrlAuthType(functionUrlAuthType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#id LambdaPermission#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#id LambdaPermission#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal_org_id LambdaPermission#principal_org_id}.
         * <p>
         * @return {@code this}
         * @param principalOrgId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#principal_org_id LambdaPermission#principal_org_id}. This parameter is required.
         */
        public Builder principalOrgId(final java.lang.String principalOrgId) {
            this.config.principalOrgId(principalOrgId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#qualifier LambdaPermission#qualifier}.
         * <p>
         * @return {@code this}
         * @param qualifier Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#qualifier LambdaPermission#qualifier}. This parameter is required.
         */
        public Builder qualifier(final java.lang.String qualifier) {
            this.config.qualifier(qualifier);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_account LambdaPermission#source_account}.
         * <p>
         * @return {@code this}
         * @param sourceAccount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_account LambdaPermission#source_account}. This parameter is required.
         */
        public Builder sourceAccount(final java.lang.String sourceAccount) {
            this.config.sourceAccount(sourceAccount);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_arn LambdaPermission#source_arn}.
         * <p>
         * @return {@code this}
         * @param sourceArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#source_arn LambdaPermission#source_arn}. This parameter is required.
         */
        public Builder sourceArn(final java.lang.String sourceArn) {
            this.config.sourceArn(sourceArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id LambdaPermission#statement_id}.
         * <p>
         * @return {@code this}
         * @param statementId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id LambdaPermission#statement_id}. This parameter is required.
         */
        public Builder statementId(final java.lang.String statementId) {
            this.config.statementId(statementId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id_prefix LambdaPermission#statement_id_prefix}.
         * <p>
         * @return {@code this}
         * @param statementIdPrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lambda_permission#statement_id_prefix LambdaPermission#statement_id_prefix}. This parameter is required.
         */
        public Builder statementIdPrefix(final java.lang.String statementIdPrefix) {
            this.config.statementIdPrefix(statementIdPrefix);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.lambda_permission.LambdaPermission}.
         */
        @Override
        public imports.aws.lambda_permission.LambdaPermission build() {
            return new imports.aws.lambda_permission.LambdaPermission(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
