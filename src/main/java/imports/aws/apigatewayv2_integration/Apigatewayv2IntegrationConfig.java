package imports.aws.apigatewayv2_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.970Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Integration.Apigatewayv2IntegrationConfig")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2IntegrationConfig.Jsii$Proxy.class)
public interface Apigatewayv2IntegrationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#api_id Apigatewayv2Integration#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_type Apigatewayv2Integration#integration_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIntegrationType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_id Apigatewayv2Integration#connection_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_type Apigatewayv2Integration#connection_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getConnectionType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#content_handling_strategy Apigatewayv2Integration#content_handling_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentHandlingStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#credentials_arn Apigatewayv2Integration#credentials_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCredentialsArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#description Apigatewayv2Integration#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#id Apigatewayv2Integration#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_method Apigatewayv2Integration#integration_method}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIntegrationMethod() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_subtype Apigatewayv2Integration#integration_subtype}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIntegrationSubtype() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_uri Apigatewayv2Integration#integration_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIntegrationUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#passthrough_behavior Apigatewayv2Integration#passthrough_behavior}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPassthroughBehavior() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#payload_format_version Apigatewayv2Integration#payload_format_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPayloadFormatVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_parameters Apigatewayv2Integration#request_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_templates Apigatewayv2Integration#request_templates}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getRequestTemplates() {
        return null;
    }

    /**
     * response_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#response_parameters Apigatewayv2Integration#response_parameters}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getResponseParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#template_selection_expression Apigatewayv2Integration#template_selection_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateSelectionExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#timeout_milliseconds Apigatewayv2Integration#timeout_milliseconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTimeoutMilliseconds() {
        return null;
    }

    /**
     * tls_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#tls_config Apigatewayv2Integration#tls_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig getTlsConfig() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2IntegrationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2IntegrationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2IntegrationConfig> {
        java.lang.String apiId;
        java.lang.String integrationType;
        java.lang.String connectionId;
        java.lang.String connectionType;
        java.lang.String contentHandlingStrategy;
        java.lang.String credentialsArn;
        java.lang.String description;
        java.lang.String id;
        java.lang.String integrationMethod;
        java.lang.String integrationSubtype;
        java.lang.String integrationUri;
        java.lang.String passthroughBehavior;
        java.lang.String payloadFormatVersion;
        java.util.Map<java.lang.String, java.lang.String> requestParameters;
        java.util.Map<java.lang.String, java.lang.String> requestTemplates;
        java.lang.Object responseParameters;
        java.lang.String templateSelectionExpression;
        java.lang.Number timeoutMilliseconds;
        imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig tlsConfig;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#api_id Apigatewayv2Integration#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getIntegrationType}
         * @param integrationType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_type Apigatewayv2Integration#integration_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder integrationType(java.lang.String integrationType) {
            this.integrationType = integrationType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getConnectionId}
         * @param connectionId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_id Apigatewayv2Integration#connection_id}.
         * @return {@code this}
         */
        public Builder connectionId(java.lang.String connectionId) {
            this.connectionId = connectionId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getConnectionType}
         * @param connectionType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#connection_type Apigatewayv2Integration#connection_type}.
         * @return {@code this}
         */
        public Builder connectionType(java.lang.String connectionType) {
            this.connectionType = connectionType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getContentHandlingStrategy}
         * @param contentHandlingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#content_handling_strategy Apigatewayv2Integration#content_handling_strategy}.
         * @return {@code this}
         */
        public Builder contentHandlingStrategy(java.lang.String contentHandlingStrategy) {
            this.contentHandlingStrategy = contentHandlingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getCredentialsArn}
         * @param credentialsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#credentials_arn Apigatewayv2Integration#credentials_arn}.
         * @return {@code this}
         */
        public Builder credentialsArn(java.lang.String credentialsArn) {
            this.credentialsArn = credentialsArn;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#description Apigatewayv2Integration#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#id Apigatewayv2Integration#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getIntegrationMethod}
         * @param integrationMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_method Apigatewayv2Integration#integration_method}.
         * @return {@code this}
         */
        public Builder integrationMethod(java.lang.String integrationMethod) {
            this.integrationMethod = integrationMethod;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getIntegrationSubtype}
         * @param integrationSubtype Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_subtype Apigatewayv2Integration#integration_subtype}.
         * @return {@code this}
         */
        public Builder integrationSubtype(java.lang.String integrationSubtype) {
            this.integrationSubtype = integrationSubtype;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getIntegrationUri}
         * @param integrationUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#integration_uri Apigatewayv2Integration#integration_uri}.
         * @return {@code this}
         */
        public Builder integrationUri(java.lang.String integrationUri) {
            this.integrationUri = integrationUri;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getPassthroughBehavior}
         * @param passthroughBehavior Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#passthrough_behavior Apigatewayv2Integration#passthrough_behavior}.
         * @return {@code this}
         */
        public Builder passthroughBehavior(java.lang.String passthroughBehavior) {
            this.passthroughBehavior = passthroughBehavior;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getPayloadFormatVersion}
         * @param payloadFormatVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#payload_format_version Apigatewayv2Integration#payload_format_version}.
         * @return {@code this}
         */
        public Builder payloadFormatVersion(java.lang.String payloadFormatVersion) {
            this.payloadFormatVersion = payloadFormatVersion;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getRequestParameters}
         * @param requestParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_parameters Apigatewayv2Integration#request_parameters}.
         * @return {@code this}
         */
        public Builder requestParameters(java.util.Map<java.lang.String, java.lang.String> requestParameters) {
            this.requestParameters = requestParameters;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getRequestTemplates}
         * @param requestTemplates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#request_templates Apigatewayv2Integration#request_templates}.
         * @return {@code this}
         */
        public Builder requestTemplates(java.util.Map<java.lang.String, java.lang.String> requestTemplates) {
            this.requestTemplates = requestTemplates;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getResponseParameters}
         * @param responseParameters response_parameters block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#response_parameters Apigatewayv2Integration#response_parameters}
         * @return {@code this}
         */
        public Builder responseParameters(com.hashicorp.cdktf.IResolvable responseParameters) {
            this.responseParameters = responseParameters;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getResponseParameters}
         * @param responseParameters response_parameters block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#response_parameters Apigatewayv2Integration#response_parameters}
         * @return {@code this}
         */
        public Builder responseParameters(java.util.List<? extends imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationResponseParameters> responseParameters) {
            this.responseParameters = responseParameters;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getTemplateSelectionExpression}
         * @param templateSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#template_selection_expression Apigatewayv2Integration#template_selection_expression}.
         * @return {@code this}
         */
        public Builder templateSelectionExpression(java.lang.String templateSelectionExpression) {
            this.templateSelectionExpression = templateSelectionExpression;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getTimeoutMilliseconds}
         * @param timeoutMilliseconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#timeout_milliseconds Apigatewayv2Integration#timeout_milliseconds}.
         * @return {@code this}
         */
        public Builder timeoutMilliseconds(java.lang.Number timeoutMilliseconds) {
            this.timeoutMilliseconds = timeoutMilliseconds;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getTlsConfig}
         * @param tlsConfig tls_config block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration#tls_config Apigatewayv2Integration#tls_config}
         * @return {@code this}
         */
        public Builder tlsConfig(imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig tlsConfig) {
            this.tlsConfig = tlsConfig;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getDependsOn}
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
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationConfig#getProvisioners}
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
         * @return a new instance of {@link Apigatewayv2IntegrationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2IntegrationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2IntegrationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2IntegrationConfig {
        private final java.lang.String apiId;
        private final java.lang.String integrationType;
        private final java.lang.String connectionId;
        private final java.lang.String connectionType;
        private final java.lang.String contentHandlingStrategy;
        private final java.lang.String credentialsArn;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.lang.String integrationMethod;
        private final java.lang.String integrationSubtype;
        private final java.lang.String integrationUri;
        private final java.lang.String passthroughBehavior;
        private final java.lang.String payloadFormatVersion;
        private final java.util.Map<java.lang.String, java.lang.String> requestParameters;
        private final java.util.Map<java.lang.String, java.lang.String> requestTemplates;
        private final java.lang.Object responseParameters;
        private final java.lang.String templateSelectionExpression;
        private final java.lang.Number timeoutMilliseconds;
        private final imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig tlsConfig;
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
            this.apiId = software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.integrationType = software.amazon.jsii.Kernel.get(this, "integrationType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionId = software.amazon.jsii.Kernel.get(this, "connectionId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.connectionType = software.amazon.jsii.Kernel.get(this, "connectionType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentHandlingStrategy = software.amazon.jsii.Kernel.get(this, "contentHandlingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentialsArn = software.amazon.jsii.Kernel.get(this, "credentialsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.integrationMethod = software.amazon.jsii.Kernel.get(this, "integrationMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.integrationSubtype = software.amazon.jsii.Kernel.get(this, "integrationSubtype", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.integrationUri = software.amazon.jsii.Kernel.get(this, "integrationUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.passthroughBehavior = software.amazon.jsii.Kernel.get(this, "passthroughBehavior", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.payloadFormatVersion = software.amazon.jsii.Kernel.get(this, "payloadFormatVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.requestParameters = software.amazon.jsii.Kernel.get(this, "requestParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.requestTemplates = software.amazon.jsii.Kernel.get(this, "requestTemplates", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.responseParameters = software.amazon.jsii.Kernel.get(this, "responseParameters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.templateSelectionExpression = software.amazon.jsii.Kernel.get(this, "templateSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeoutMilliseconds = software.amazon.jsii.Kernel.get(this, "timeoutMilliseconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tlsConfig = software.amazon.jsii.Kernel.get(this, "tlsConfig", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig.class));
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
            this.apiId = java.util.Objects.requireNonNull(builder.apiId, "apiId is required");
            this.integrationType = java.util.Objects.requireNonNull(builder.integrationType, "integrationType is required");
            this.connectionId = builder.connectionId;
            this.connectionType = builder.connectionType;
            this.contentHandlingStrategy = builder.contentHandlingStrategy;
            this.credentialsArn = builder.credentialsArn;
            this.description = builder.description;
            this.id = builder.id;
            this.integrationMethod = builder.integrationMethod;
            this.integrationSubtype = builder.integrationSubtype;
            this.integrationUri = builder.integrationUri;
            this.passthroughBehavior = builder.passthroughBehavior;
            this.payloadFormatVersion = builder.payloadFormatVersion;
            this.requestParameters = builder.requestParameters;
            this.requestTemplates = builder.requestTemplates;
            this.responseParameters = builder.responseParameters;
            this.templateSelectionExpression = builder.templateSelectionExpression;
            this.timeoutMilliseconds = builder.timeoutMilliseconds;
            this.tlsConfig = builder.tlsConfig;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getApiId() {
            return this.apiId;
        }

        @Override
        public final java.lang.String getIntegrationType() {
            return this.integrationType;
        }

        @Override
        public final java.lang.String getConnectionId() {
            return this.connectionId;
        }

        @Override
        public final java.lang.String getConnectionType() {
            return this.connectionType;
        }

        @Override
        public final java.lang.String getContentHandlingStrategy() {
            return this.contentHandlingStrategy;
        }

        @Override
        public final java.lang.String getCredentialsArn() {
            return this.credentialsArn;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIntegrationMethod() {
            return this.integrationMethod;
        }

        @Override
        public final java.lang.String getIntegrationSubtype() {
            return this.integrationSubtype;
        }

        @Override
        public final java.lang.String getIntegrationUri() {
            return this.integrationUri;
        }

        @Override
        public final java.lang.String getPassthroughBehavior() {
            return this.passthroughBehavior;
        }

        @Override
        public final java.lang.String getPayloadFormatVersion() {
            return this.payloadFormatVersion;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRequestParameters() {
            return this.requestParameters;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getRequestTemplates() {
            return this.requestTemplates;
        }

        @Override
        public final java.lang.Object getResponseParameters() {
            return this.responseParameters;
        }

        @Override
        public final java.lang.String getTemplateSelectionExpression() {
            return this.templateSelectionExpression;
        }

        @Override
        public final java.lang.Number getTimeoutMilliseconds() {
            return this.timeoutMilliseconds;
        }

        @Override
        public final imports.aws.apigatewayv2_integration.Apigatewayv2IntegrationTlsConfig getTlsConfig() {
            return this.tlsConfig;
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

            data.set("apiId", om.valueToTree(this.getApiId()));
            data.set("integrationType", om.valueToTree(this.getIntegrationType()));
            if (this.getConnectionId() != null) {
                data.set("connectionId", om.valueToTree(this.getConnectionId()));
            }
            if (this.getConnectionType() != null) {
                data.set("connectionType", om.valueToTree(this.getConnectionType()));
            }
            if (this.getContentHandlingStrategy() != null) {
                data.set("contentHandlingStrategy", om.valueToTree(this.getContentHandlingStrategy()));
            }
            if (this.getCredentialsArn() != null) {
                data.set("credentialsArn", om.valueToTree(this.getCredentialsArn()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIntegrationMethod() != null) {
                data.set("integrationMethod", om.valueToTree(this.getIntegrationMethod()));
            }
            if (this.getIntegrationSubtype() != null) {
                data.set("integrationSubtype", om.valueToTree(this.getIntegrationSubtype()));
            }
            if (this.getIntegrationUri() != null) {
                data.set("integrationUri", om.valueToTree(this.getIntegrationUri()));
            }
            if (this.getPassthroughBehavior() != null) {
                data.set("passthroughBehavior", om.valueToTree(this.getPassthroughBehavior()));
            }
            if (this.getPayloadFormatVersion() != null) {
                data.set("payloadFormatVersion", om.valueToTree(this.getPayloadFormatVersion()));
            }
            if (this.getRequestParameters() != null) {
                data.set("requestParameters", om.valueToTree(this.getRequestParameters()));
            }
            if (this.getRequestTemplates() != null) {
                data.set("requestTemplates", om.valueToTree(this.getRequestTemplates()));
            }
            if (this.getResponseParameters() != null) {
                data.set("responseParameters", om.valueToTree(this.getResponseParameters()));
            }
            if (this.getTemplateSelectionExpression() != null) {
                data.set("templateSelectionExpression", om.valueToTree(this.getTemplateSelectionExpression()));
            }
            if (this.getTimeoutMilliseconds() != null) {
                data.set("timeoutMilliseconds", om.valueToTree(this.getTimeoutMilliseconds()));
            }
            if (this.getTlsConfig() != null) {
                data.set("tlsConfig", om.valueToTree(this.getTlsConfig()));
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
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Integration.Apigatewayv2IntegrationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2IntegrationConfig.Jsii$Proxy that = (Apigatewayv2IntegrationConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!integrationType.equals(that.integrationType)) return false;
            if (this.connectionId != null ? !this.connectionId.equals(that.connectionId) : that.connectionId != null) return false;
            if (this.connectionType != null ? !this.connectionType.equals(that.connectionType) : that.connectionType != null) return false;
            if (this.contentHandlingStrategy != null ? !this.contentHandlingStrategy.equals(that.contentHandlingStrategy) : that.contentHandlingStrategy != null) return false;
            if (this.credentialsArn != null ? !this.credentialsArn.equals(that.credentialsArn) : that.credentialsArn != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.integrationMethod != null ? !this.integrationMethod.equals(that.integrationMethod) : that.integrationMethod != null) return false;
            if (this.integrationSubtype != null ? !this.integrationSubtype.equals(that.integrationSubtype) : that.integrationSubtype != null) return false;
            if (this.integrationUri != null ? !this.integrationUri.equals(that.integrationUri) : that.integrationUri != null) return false;
            if (this.passthroughBehavior != null ? !this.passthroughBehavior.equals(that.passthroughBehavior) : that.passthroughBehavior != null) return false;
            if (this.payloadFormatVersion != null ? !this.payloadFormatVersion.equals(that.payloadFormatVersion) : that.payloadFormatVersion != null) return false;
            if (this.requestParameters != null ? !this.requestParameters.equals(that.requestParameters) : that.requestParameters != null) return false;
            if (this.requestTemplates != null ? !this.requestTemplates.equals(that.requestTemplates) : that.requestTemplates != null) return false;
            if (this.responseParameters != null ? !this.responseParameters.equals(that.responseParameters) : that.responseParameters != null) return false;
            if (this.templateSelectionExpression != null ? !this.templateSelectionExpression.equals(that.templateSelectionExpression) : that.templateSelectionExpression != null) return false;
            if (this.timeoutMilliseconds != null ? !this.timeoutMilliseconds.equals(that.timeoutMilliseconds) : that.timeoutMilliseconds != null) return false;
            if (this.tlsConfig != null ? !this.tlsConfig.equals(that.tlsConfig) : that.tlsConfig != null) return false;
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
            int result = this.apiId.hashCode();
            result = 31 * result + (this.integrationType.hashCode());
            result = 31 * result + (this.connectionId != null ? this.connectionId.hashCode() : 0);
            result = 31 * result + (this.connectionType != null ? this.connectionType.hashCode() : 0);
            result = 31 * result + (this.contentHandlingStrategy != null ? this.contentHandlingStrategy.hashCode() : 0);
            result = 31 * result + (this.credentialsArn != null ? this.credentialsArn.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.integrationMethod != null ? this.integrationMethod.hashCode() : 0);
            result = 31 * result + (this.integrationSubtype != null ? this.integrationSubtype.hashCode() : 0);
            result = 31 * result + (this.integrationUri != null ? this.integrationUri.hashCode() : 0);
            result = 31 * result + (this.passthroughBehavior != null ? this.passthroughBehavior.hashCode() : 0);
            result = 31 * result + (this.payloadFormatVersion != null ? this.payloadFormatVersion.hashCode() : 0);
            result = 31 * result + (this.requestParameters != null ? this.requestParameters.hashCode() : 0);
            result = 31 * result + (this.requestTemplates != null ? this.requestTemplates.hashCode() : 0);
            result = 31 * result + (this.responseParameters != null ? this.responseParameters.hashCode() : 0);
            result = 31 * result + (this.templateSelectionExpression != null ? this.templateSelectionExpression.hashCode() : 0);
            result = 31 * result + (this.timeoutMilliseconds != null ? this.timeoutMilliseconds.hashCode() : 0);
            result = 31 * result + (this.tlsConfig != null ? this.tlsConfig.hashCode() : 0);
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
