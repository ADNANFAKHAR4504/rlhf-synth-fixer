package imports.aws.api_gateway_gateway_response;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.947Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayGatewayResponse.ApiGatewayGatewayResponseConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayGatewayResponseConfig.Jsii$Proxy.class)
public interface ApiGatewayGatewayResponseConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#response_type ApiGatewayGatewayResponse#response_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResponseType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#rest_api_id ApiGatewayGatewayResponse#rest_api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRestApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#id ApiGatewayGatewayResponse#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#response_parameters ApiGatewayGatewayResponse#response_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResponseParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#response_templates ApiGatewayGatewayResponse#response_templates}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResponseTemplates() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#status_code ApiGatewayGatewayResponse#status_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatusCode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayGatewayResponseConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayGatewayResponseConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayGatewayResponseConfig> {
        java.lang.String responseType;
        java.lang.String restApiId;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> responseParameters;
        java.util.Map<java.lang.String, java.lang.String> responseTemplates;
        java.lang.String statusCode;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getResponseType}
         * @param responseType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#response_type ApiGatewayGatewayResponse#response_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder responseType(java.lang.String responseType) {
            this.responseType = responseType;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getRestApiId}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#rest_api_id ApiGatewayGatewayResponse#rest_api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder restApiId(java.lang.String restApiId) {
            this.restApiId = restApiId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#id ApiGatewayGatewayResponse#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getResponseParameters}
         * @param responseParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#response_parameters ApiGatewayGatewayResponse#response_parameters}.
         * @return {@code this}
         */
        public Builder responseParameters(java.util.Map<java.lang.String, java.lang.String> responseParameters) {
            this.responseParameters = responseParameters;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getResponseTemplates}
         * @param responseTemplates Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#response_templates ApiGatewayGatewayResponse#response_templates}.
         * @return {@code this}
         */
        public Builder responseTemplates(java.util.Map<java.lang.String, java.lang.String> responseTemplates) {
            this.responseTemplates = responseTemplates;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getStatusCode}
         * @param statusCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_gateway_response#status_code ApiGatewayGatewayResponse#status_code}.
         * @return {@code this}
         */
        public Builder statusCode(java.lang.String statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayGatewayResponseConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayGatewayResponseConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayGatewayResponseConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayGatewayResponseConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayGatewayResponseConfig {
        private final java.lang.String responseType;
        private final java.lang.String restApiId;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> responseParameters;
        private final java.util.Map<java.lang.String, java.lang.String> responseTemplates;
        private final java.lang.String statusCode;
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
            this.responseType = software.amazon.jsii.Kernel.get(this, "responseType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restApiId = software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseParameters = software.amazon.jsii.Kernel.get(this, "responseParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.responseTemplates = software.amazon.jsii.Kernel.get(this, "responseTemplates", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.statusCode = software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.responseType = java.util.Objects.requireNonNull(builder.responseType, "responseType is required");
            this.restApiId = java.util.Objects.requireNonNull(builder.restApiId, "restApiId is required");
            this.id = builder.id;
            this.responseParameters = builder.responseParameters;
            this.responseTemplates = builder.responseTemplates;
            this.statusCode = builder.statusCode;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getResponseType() {
            return this.responseType;
        }

        @Override
        public final java.lang.String getRestApiId() {
            return this.restApiId;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getResponseParameters() {
            return this.responseParameters;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getResponseTemplates() {
            return this.responseTemplates;
        }

        @Override
        public final java.lang.String getStatusCode() {
            return this.statusCode;
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

            data.set("responseType", om.valueToTree(this.getResponseType()));
            data.set("restApiId", om.valueToTree(this.getRestApiId()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getResponseParameters() != null) {
                data.set("responseParameters", om.valueToTree(this.getResponseParameters()));
            }
            if (this.getResponseTemplates() != null) {
                data.set("responseTemplates", om.valueToTree(this.getResponseTemplates()));
            }
            if (this.getStatusCode() != null) {
                data.set("statusCode", om.valueToTree(this.getStatusCode()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayGatewayResponse.ApiGatewayGatewayResponseConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayGatewayResponseConfig.Jsii$Proxy that = (ApiGatewayGatewayResponseConfig.Jsii$Proxy) o;

            if (!responseType.equals(that.responseType)) return false;
            if (!restApiId.equals(that.restApiId)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.responseParameters != null ? !this.responseParameters.equals(that.responseParameters) : that.responseParameters != null) return false;
            if (this.responseTemplates != null ? !this.responseTemplates.equals(that.responseTemplates) : that.responseTemplates != null) return false;
            if (this.statusCode != null ? !this.statusCode.equals(that.statusCode) : that.statusCode != null) return false;
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
            int result = this.responseType.hashCode();
            result = 31 * result + (this.restApiId.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.responseParameters != null ? this.responseParameters.hashCode() : 0);
            result = 31 * result + (this.responseTemplates != null ? this.responseTemplates.hashCode() : 0);
            result = 31 * result + (this.statusCode != null ? this.statusCode.hashCode() : 0);
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
