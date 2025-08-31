package imports.aws.apigatewayv2_integration;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration aws_apigatewayv2_integration}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.969Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Integration.Apigatewayv2Integration")
public class Apigatewayv2Integration extends com.hashicorp.cdktf.TerraformResource {

    protected Apigatewayv2Integration(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Apigatewayv2Integration(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.apigatewayv2_integration.Apigatewayv2Integration.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration aws_apigatewayv2_integration} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Apigatewayv2Integration(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Integration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Integration to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Integration that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Apigatewayv2Integration to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_integration.Apigatewayv2Integration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Apigatewayv2Integration resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Apigatewayv2Integration to import. This parameter is required.
     * @param importFromId The id of the existing Apigatewayv2Integration that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.apigatewayv2_integration.Apigatewayv2Integration.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putResponseParameters(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParameters>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParameters> __cast_cd4240 = (java.util.List<imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParameters>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParameters __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putResponseParameters", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTlsConfig(final @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig value) {
        software.amazon.jsii.Kernel.call(this, "putTlsConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetConnectionId() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetConnectionType() {
        software.amazon.jsii.Kernel.call(this, "resetConnectionType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetContentHandlingStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetContentHandlingStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCredentialsArn() {
        software.amazon.jsii.Kernel.call(this, "resetCredentialsArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntegrationMethod() {
        software.amazon.jsii.Kernel.call(this, "resetIntegrationMethod", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntegrationSubtype() {
        software.amazon.jsii.Kernel.call(this, "resetIntegrationSubtype", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIntegrationUri() {
        software.amazon.jsii.Kernel.call(this, "resetIntegrationUri", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPassthroughBehavior() {
        software.amazon.jsii.Kernel.call(this, "resetPassthroughBehavior", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPayloadFormatVersion() {
        software.amazon.jsii.Kernel.call(this, "resetPayloadFormatVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestParameters() {
        software.amazon.jsii.Kernel.call(this, "resetRequestParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRequestTemplates() {
        software.amazon.jsii.Kernel.call(this, "resetRequestTemplates", software.amazon.jsii.NativeType.VOID);
    }

    public void resetResponseParameters() {
        software.amazon.jsii.Kernel.call(this, "resetResponseParameters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTemplateSelectionExpression() {
        software.amazon.jsii.Kernel.call(this, "resetTemplateSelectionExpression", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeoutMilliseconds() {
        software.amazon.jsii.Kernel.call(this, "resetTimeoutMilliseconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTlsConfig() {
        software.amazon.jsii.Kernel.call(this, "resetTlsConfig", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationResponseSelectionExpression() {
        return software.amazon.jsii.Kernel.get(this, "integrationResponseSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParametersList getResponseParameters() {
        return software.amazon.jsii.Kernel.get(this, "responseParameters", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParametersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfigOutputReference getTlsConfig() {
        return software.amazon.jsii.Kernel.get(this, "tlsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "apiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionIdInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getConnectionTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getContentHandlingStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "contentHandlingStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCredentialsArnInput() {
        return software.amazon.jsii.Kernel.get(this, "credentialsArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntegrationMethodInput() {
        return software.amazon.jsii.Kernel.get(this, "integrationMethodInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntegrationSubtypeInput() {
        return software.amazon.jsii.Kernel.get(this, "integrationSubtypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntegrationTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "integrationTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIntegrationUriInput() {
        return software.amazon.jsii.Kernel.get(this, "integrationUriInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPassthroughBehaviorInput() {
        return software.amazon.jsii.Kernel.get(this, "passthroughBehaviorInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPayloadFormatVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "payloadFormatVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestParametersInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "requestParametersInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestTemplatesInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "requestTemplatesInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getResponseParametersInput() {
        return software.amazon.jsii.Kernel.get(this, "responseParametersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTemplateSelectionExpressionInput() {
        return software.amazon.jsii.Kernel.get(this, "templateSelectionExpressionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutMillisecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutMillisecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig getTlsConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "tlsConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiId() {
        return software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiId", java.util.Objects.requireNonNull(value, "apiId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionId() {
        return software.amazon.jsii.Kernel.get(this, "connectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionId", java.util.Objects.requireNonNull(value, "connectionId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getConnectionType() {
        return software.amazon.jsii.Kernel.get(this, "connectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setConnectionType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "connectionType", java.util.Objects.requireNonNull(value, "connectionType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getContentHandlingStrategy() {
        return software.amazon.jsii.Kernel.get(this, "contentHandlingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setContentHandlingStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "contentHandlingStrategy", java.util.Objects.requireNonNull(value, "contentHandlingStrategy is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCredentialsArn() {
        return software.amazon.jsii.Kernel.get(this, "credentialsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCredentialsArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "credentialsArn", java.util.Objects.requireNonNull(value, "credentialsArn is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationMethod() {
        return software.amazon.jsii.Kernel.get(this, "integrationMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntegrationMethod(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "integrationMethod", java.util.Objects.requireNonNull(value, "integrationMethod is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationSubtype() {
        return software.amazon.jsii.Kernel.get(this, "integrationSubtype", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntegrationSubtype(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "integrationSubtype", java.util.Objects.requireNonNull(value, "integrationSubtype is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationType() {
        return software.amazon.jsii.Kernel.get(this, "integrationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntegrationType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "integrationType", java.util.Objects.requireNonNull(value, "integrationType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getIntegrationUri() {
        return software.amazon.jsii.Kernel.get(this, "integrationUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setIntegrationUri(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "integrationUri", java.util.Objects.requireNonNull(value, "integrationUri is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPassthroughBehavior() {
        return software.amazon.jsii.Kernel.get(this, "passthroughBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPassthroughBehavior(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "passthroughBehavior", java.util.Objects.requireNonNull(value, "passthroughBehavior is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPayloadFormatVersion() {
        return software.amazon.jsii.Kernel.get(this, "payloadFormatVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPayloadFormatVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "payloadFormatVersion", java.util.Objects.requireNonNull(value, "payloadFormatVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRequestParameters() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "requestParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRequestParameters(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "requestParameters", java.util.Objects.requireNonNull(value, "requestParameters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getRequestTemplates() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "requestTemplates", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setRequestTemplates(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "requestTemplates", java.util.Objects.requireNonNull(value, "requestTemplates is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTemplateSelectionExpression() {
        return software.amazon.jsii.Kernel.get(this, "templateSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTemplateSelectionExpression(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "templateSelectionExpression", java.util.Objects.requireNonNull(value, "templateSelectionExpression is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTimeoutMilliseconds() {
        return software.amazon.jsii.Kernel.get(this, "timeoutMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTimeoutMilliseconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "timeoutMilliseconds", java.util.Objects.requireNonNull(value, "timeoutMilliseconds is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.apigatewayv2_integration.Apigatewayv2Integration}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.apigatewayv2_integration.Apigatewayv2Integration> {
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
        private final imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#api_id Apigatewayv2Integration#api_id}.
         * <p>
         * @return {@code this}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#api_id Apigatewayv2Integration#api_id}. This parameter is required.
         */
        public Builder apiId(final java.lang.String apiId) {
            this.config.apiId(apiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_type Apigatewayv2Integration#integration_type}.
         * <p>
         * @return {@code this}
         * @param integrationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_type Apigatewayv2Integration#integration_type}. This parameter is required.
         */
        public Builder integrationType(final java.lang.String integrationType) {
            this.config.integrationType(integrationType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_id Apigatewayv2Integration#connection_id}.
         * <p>
         * @return {@code this}
         * @param connectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_id Apigatewayv2Integration#connection_id}. This parameter is required.
         */
        public Builder connectionId(final java.lang.String connectionId) {
            this.config.connectionId(connectionId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_type Apigatewayv2Integration#connection_type}.
         * <p>
         * @return {@code this}
         * @param connectionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_type Apigatewayv2Integration#connection_type}. This parameter is required.
         */
        public Builder connectionType(final java.lang.String connectionType) {
            this.config.connectionType(connectionType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#content_handling_strategy Apigatewayv2Integration#content_handling_strategy}.
         * <p>
         * @return {@code this}
         * @param contentHandlingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#content_handling_strategy Apigatewayv2Integration#content_handling_strategy}. This parameter is required.
         */
        public Builder contentHandlingStrategy(final java.lang.String contentHandlingStrategy) {
            this.config.contentHandlingStrategy(contentHandlingStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#credentials_arn Apigatewayv2Integration#credentials_arn}.
         * <p>
         * @return {@code this}
         * @param credentialsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#credentials_arn Apigatewayv2Integration#credentials_arn}. This parameter is required.
         */
        public Builder credentialsArn(final java.lang.String credentialsArn) {
            this.config.credentialsArn(credentialsArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#description Apigatewayv2Integration#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#description Apigatewayv2Integration#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#id Apigatewayv2Integration#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#id Apigatewayv2Integration#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_method Apigatewayv2Integration#integration_method}.
         * <p>
         * @return {@code this}
         * @param integrationMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_method Apigatewayv2Integration#integration_method}. This parameter is required.
         */
        public Builder integrationMethod(final java.lang.String integrationMethod) {
            this.config.integrationMethod(integrationMethod);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_subtype Apigatewayv2Integration#integration_subtype}.
         * <p>
         * @return {@code this}
         * @param integrationSubtype Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_subtype Apigatewayv2Integration#integration_subtype}. This parameter is required.
         */
        public Builder integrationSubtype(final java.lang.String integrationSubtype) {
            this.config.integrationSubtype(integrationSubtype);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_uri Apigatewayv2Integration#integration_uri}.
         * <p>
         * @return {@code this}
         * @param integrationUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_uri Apigatewayv2Integration#integration_uri}. This parameter is required.
         */
        public Builder integrationUri(final java.lang.String integrationUri) {
            this.config.integrationUri(integrationUri);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#passthrough_behavior Apigatewayv2Integration#passthrough_behavior}.
         * <p>
         * @return {@code this}
         * @param passthroughBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#passthrough_behavior Apigatewayv2Integration#passthrough_behavior}. This parameter is required.
         */
        public Builder passthroughBehavior(final java.lang.String passthroughBehavior) {
            this.config.passthroughBehavior(passthroughBehavior);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#payload_format_version Apigatewayv2Integration#payload_format_version}.
         * <p>
         * @return {@code this}
         * @param payloadFormatVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#payload_format_version Apigatewayv2Integration#payload_format_version}. This parameter is required.
         */
        public Builder payloadFormatVersion(final java.lang.String payloadFormatVersion) {
            this.config.payloadFormatVersion(payloadFormatVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_parameters Apigatewayv2Integration#request_parameters}.
         * <p>
         * @return {@code this}
         * @param requestParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_parameters Apigatewayv2Integration#request_parameters}. This parameter is required.
         */
        public Builder requestParameters(final java.util.Map<java.lang.String, java.lang.String> requestParameters) {
            this.config.requestParameters(requestParameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_templates Apigatewayv2Integration#request_templates}.
         * <p>
         * @return {@code this}
         * @param requestTemplates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_templates Apigatewayv2Integration#request_templates}. This parameter is required.
         */
        public Builder requestTemplates(final java.util.Map<java.lang.String, java.lang.String> requestTemplates) {
            this.config.requestTemplates(requestTemplates);
            return this;
        }

        /**
         * response_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#response_parameters Apigatewayv2Integration#response_parameters}
         * <p>
         * @return {@code this}
         * @param responseParameters response_parameters block. This parameter is required.
         */
        public Builder responseParameters(final com.hashicorp.cdktf.IResolvable responseParameters) {
            this.config.responseParameters(responseParameters);
            return this;
        }
        /**
         * response_parameters block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#response_parameters Apigatewayv2Integration#response_parameters}
         * <p>
         * @return {@code this}
         * @param responseParameters response_parameters block. This parameter is required.
         */
        public Builder responseParameters(final java.util.List<? extends imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParameters> responseParameters) {
            this.config.responseParameters(responseParameters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#template_selection_expression Apigatewayv2Integration#template_selection_expression}.
         * <p>
         * @return {@code this}
         * @param templateSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#template_selection_expression Apigatewayv2Integration#template_selection_expression}. This parameter is required.
         */
        public Builder templateSelectionExpression(final java.lang.String templateSelectionExpression) {
            this.config.templateSelectionExpression(templateSelectionExpression);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#timeout_milliseconds Apigatewayv2Integration#timeout_milliseconds}.
         * <p>
         * @return {@code this}
         * @param timeoutMilliseconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#timeout_milliseconds Apigatewayv2Integration#timeout_milliseconds}. This parameter is required.
         */
        public Builder timeoutMilliseconds(final java.lang.Number timeoutMilliseconds) {
            this.config.timeoutMilliseconds(timeoutMilliseconds);
            return this;
        }

        /**
         * tls_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#tls_config Apigatewayv2Integration#tls_config}
         * <p>
         * @return {@code this}
         * @param tlsConfig tls_config block. This parameter is required.
         */
        public Builder tlsConfig(final imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig tlsConfig) {
            this.config.tlsConfig(tlsConfig);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.apigatewayv2_integration.Apigatewayv2Integration}.
         */
        @Override
        public imports.aws.apigatewayv2_integration.Apigatewayv2Integration build() {
            return new imports.aws.apigatewayv2_integration.Apigatewayv2Integration(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
