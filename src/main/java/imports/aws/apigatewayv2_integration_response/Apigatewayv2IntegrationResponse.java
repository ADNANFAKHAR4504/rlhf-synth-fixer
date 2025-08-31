package imports.aws.apigatewayv2_integration_response;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response aws_apigatewayv2_integration_response}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.971Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2IntegrationResponse.Apigatewayv2IntegrationResponse")
public class Apigatewayv2IntegrationResponse extends com.hashicorp.cdktf.TerraformResource {

    protected Apigatewayv2IntegrationResponse(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Apigatewayv2IntegrationResponse(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response aws_apigatewayv2_integration_response} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Apigatewayv2IntegrationResponse(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponseConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2IntegrationResponse resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2IntegrationResponse to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2IntegrationResponse that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Apigatewayv2IntegrationResponse to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2IntegrationResponse resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2IntegrationResponse to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2IntegrationResponse that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetContentHandlingStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetContentHandlingStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseTemplates() {
        software.amazon.jsii.Kernel.call(this, "resetResponseTemplates", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateSelectionExpression() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateSelectionExpression", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.Nullable java.lang.String getApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "apiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentHandlingStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "contentHandlingStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntegrationIdInput() {
        return software.amazon.jsii.Kernel.get(this, "integrationIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntegrationResponseKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "integrationResponseKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResponseTemplatesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "responseTemplatesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateSelectionExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "templateSelectionExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiId() {
        return software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiId", java.util.Objects.requireNonNull(value, "apiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentHandlingStrategy() {
        return software.amazon.jsii.Kernel.get(this, "contentHandlingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentHandlingStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentHandlingStrategy", java.util.Objects.requireNonNull(value, "contentHandlingStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationId() {
        return software.amazon.jsii.Kernel.get(this, "integrationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntegrationId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "integrationId", java.util.Objects.requireNonNull(value, "integrationId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationResponseKey() {
        return software.amazon.jsii.Kernel.get(this, "integrationResponseKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntegrationResponseKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "integrationResponseKey", java.util.Objects.requireNonNull(value, "integrationResponseKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getResponseTemplates() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "responseTemplates", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setResponseTemplates(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "responseTemplates", java.util.Objects.requireNonNull(value, "responseTemplates is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateSelectionExpression() {
        return software.amazon.jsii.Kernel.get(this, "templateSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateSelectionExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateSelectionExpression", java.util.Objects.requireNonNull(value, "templateSelectionExpression is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse> {
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
        private final imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponseConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponseConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#api_id Apigatewayv2IntegrationResponse#api_id}.
         * <p>
         * @return {@code this}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#api_id Apigatewayv2IntegrationResponse#api_id}. This parameter is required.
         */
        public Builder apiId(final java.lang.String apiId) {
            this.config.apiId(apiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_id Apigatewayv2IntegrationResponse#integration_id}.
         * <p>
         * @return {@code this}
         * @param integrationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_id Apigatewayv2IntegrationResponse#integration_id}. This parameter is required.
         */
        public Builder integrationId(final java.lang.String integrationId) {
            this.config.integrationId(integrationId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_response_key Apigatewayv2IntegrationResponse#integration_response_key}.
         * <p>
         * @return {@code this}
         * @param integrationResponseKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_response_key Apigatewayv2IntegrationResponse#integration_response_key}. This parameter is required.
         */
        public Builder integrationResponseKey(final java.lang.String integrationResponseKey) {
            this.config.integrationResponseKey(integrationResponseKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#content_handling_strategy Apigatewayv2IntegrationResponse#content_handling_strategy}.
         * <p>
         * @return {@code this}
         * @param contentHandlingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#content_handling_strategy Apigatewayv2IntegrationResponse#content_handling_strategy}. This parameter is required.
         */
        public Builder contentHandlingStrategy(final java.lang.String contentHandlingStrategy) {
            this.config.contentHandlingStrategy(contentHandlingStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#id Apigatewayv2IntegrationResponse#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#id Apigatewayv2IntegrationResponse#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#response_templates Apigatewayv2IntegrationResponse#response_templates}.
         * <p>
         * @return {@code this}
         * @param responseTemplates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#response_templates Apigatewayv2IntegrationResponse#response_templates}. This parameter is required.
         */
        public Builder responseTemplates(final java.util.Map<java.lang.String, java.lang.String> responseTemplates) {
            this.config.responseTemplates(responseTemplates);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#template_selection_expression Apigatewayv2IntegrationResponse#template_selection_expression}.
         * <p>
         * @return {@code this}
         * @param templateSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#template_selection_expression Apigatewayv2IntegrationResponse#template_selection_expression}. This parameter is required.
         */
        public Builder templateSelectionExpression(final java.lang.String templateSelectionExpression) {
            this.config.templateSelectionExpression(templateSelectionExpression);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse}.
         */
        @Override
        public imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse build() {
            return new imports.aws.apigatewayv2_integration_response.Apigatewayv2IntegrationResponse(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
