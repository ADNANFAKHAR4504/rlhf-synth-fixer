package imports.aws.apigatewayv2_integration_response;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.971Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2IntegrationResponse.Apigatewayv2IntegrationResponseConfig")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2IntegrationResponseConfig.Jsii$Proxy.class)
public interface Apigatewayv2IntegrationResponseConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#api_id Apigatewayv2IntegrationResponse#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_id Apigatewayv2IntegrationResponse#integration_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIntegrationId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_response_key Apigatewayv2IntegrationResponse#integration_response_key}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIntegrationResponseKey();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#content_handling_strategy Apigatewayv2IntegrationResponse#content_handling_strategy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getContentHandlingStrategy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#id Apigatewayv2IntegrationResponse#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#response_templates Apigatewayv2IntegrationResponse#response_templates}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResponseTemplates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#template_selection_expression Apigatewayv2IntegrationResponse#template_selection_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTemplateSelectionExpression() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2IntegrationResponseConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2IntegrationResponseConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2IntegrationResponseConfig> {
        java.lang.String apiId;
        java.lang.String integrationId;
        java.lang.String integrationResponseKey;
        java.lang.String contentHandlingStrategy;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> responseTemplates;
        java.lang.String templateSelectionExpression;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#api_id Apigatewayv2IntegrationResponse#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getIntegrationId}
         * @param integrationId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_id Apigatewayv2IntegrationResponse#integration_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder integrationId(java.lang.String integrationId) {
            this.integrationId = integrationId;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getIntegrationResponseKey}
         * @param integrationResponseKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#integration_response_key Apigatewayv2IntegrationResponse#integration_response_key}. This parameter is required.
         * @return {@code this}
         */
        public Builder integrationResponseKey(java.lang.String integrationResponseKey) {
            this.integrationResponseKey = integrationResponseKey;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getContentHandlingStrategy}
         * @param contentHandlingStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#content_handling_strategy Apigatewayv2IntegrationResponse#content_handling_strategy}.
         * @return {@code this}
         */
        public Builder contentHandlingStrategy(java.lang.String contentHandlingStrategy) {
            this.contentHandlingStrategy = contentHandlingStrategy;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#id Apigatewayv2IntegrationResponse#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getResponseTemplates}
         * @param responseTemplates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#response_templates Apigatewayv2IntegrationResponse#response_templates}.
         * @return {@code this}
         */
        public Builder responseTemplates(java.util.Map<java.lang.String, java.lang.String> responseTemplates) {
            this.responseTemplates = responseTemplates;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getTemplateSelectionExpression}
         * @param templateSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_integration_response#template_selection_expression Apigatewayv2IntegrationResponse#template_selection_expression}.
         * @return {@code this}
         */
        public Builder templateSelectionExpression(java.lang.String templateSelectionExpression) {
            this.templateSelectionExpression = templateSelectionExpression;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getDependsOn}
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
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2IntegrationResponseConfig#getProvisioners}
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
         * @return a new instance of {@link Apigatewayv2IntegrationResponseConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2IntegrationResponseConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2IntegrationResponseConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2IntegrationResponseConfig {
        private final java.lang.String apiId;
        private final java.lang.String integrationId;
        private final java.lang.String integrationResponseKey;
        private final java.lang.String contentHandlingStrategy;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> responseTemplates;
        private final java.lang.String templateSelectionExpression;
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
            this.integrationId = software.amazon.jsii.Kernel.get(this, "integrationId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.integrationResponseKey = software.amazon.jsii.Kernel.get(this, "integrationResponseKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.contentHandlingStrategy = software.amazon.jsii.Kernel.get(this, "contentHandlingStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseTemplates = software.amazon.jsii.Kernel.get(this, "responseTemplates", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.templateSelectionExpression = software.amazon.jsii.Kernel.get(this, "templateSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.integrationId = java.util.Objects.requireNonNull(builder.integrationId, "integrationId is required");
            this.integrationResponseKey = java.util.Objects.requireNonNull(builder.integrationResponseKey, "integrationResponseKey is required");
            this.contentHandlingStrategy = builder.contentHandlingStrategy;
            this.id = builder.id;
            this.responseTemplates = builder.responseTemplates;
            this.templateSelectionExpression = builder.templateSelectionExpression;
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
        public final java.lang.String getIntegrationId() {
            return this.integrationId;
        }

        @Override
        public final java.lang.String getIntegrationResponseKey() {
            return this.integrationResponseKey;
        }

        @Override
        public final java.lang.String getContentHandlingStrategy() {
            return this.contentHandlingStrategy;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getResponseTemplates() {
            return this.responseTemplates;
        }

        @Override
        public final java.lang.String getTemplateSelectionExpression() {
            return this.templateSelectionExpression;
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
            data.set("integrationId", om.valueToTree(this.getIntegrationId()));
            data.set("integrationResponseKey", om.valueToTree(this.getIntegrationResponseKey()));
            if (this.getContentHandlingStrategy() != null) {
                data.set("contentHandlingStrategy", om.valueToTree(this.getContentHandlingStrategy()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getResponseTemplates() != null) {
                data.set("responseTemplates", om.valueToTree(this.getResponseTemplates()));
            }
            if (this.getTemplateSelectionExpression() != null) {
                data.set("templateSelectionExpression", om.valueToTree(this.getTemplateSelectionExpression()));
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
            struct.set("fqn", om.valueToTree("aws.apigatewayv2IntegrationResponse.Apigatewayv2IntegrationResponseConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2IntegrationResponseConfig.Jsii$Proxy that = (Apigatewayv2IntegrationResponseConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!integrationId.equals(that.integrationId)) return false;
            if (!integrationResponseKey.equals(that.integrationResponseKey)) return false;
            if (this.contentHandlingStrategy != null ? !this.contentHandlingStrategy.equals(that.contentHandlingStrategy) : that.contentHandlingStrategy != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.responseTemplates != null ? !this.responseTemplates.equals(that.responseTemplates) : that.responseTemplates != null) return false;
            if (this.templateSelectionExpression != null ? !this.templateSelectionExpression.equals(that.templateSelectionExpression) : that.templateSelectionExpression != null) return false;
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
            result = 31 * result + (this.integrationId.hashCode());
            result = 31 * result + (this.integrationResponseKey.hashCode());
            result = 31 * result + (this.contentHandlingStrategy != null ? this.contentHandlingStrategy.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.responseTemplates != null ? this.responseTemplates.hashCode() : 0);
            result = 31 * result + (this.templateSelectionExpression != null ? this.templateSelectionExpression.hashCode() : 0);
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
