package imports.aws.api_gateway_method_response;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.949Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayMethodResponse.ApiGatewayMethodResponseConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayMethodResponseConfig.Jsii$Proxy.class)
public interface ApiGatewayMethodResponseConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#http_method ApiGatewayMethodResponse#http_method}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getHttpMethod();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#resource_id ApiGatewayMethodResponse#resource_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getResourceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#rest_api_id ApiGatewayMethodResponse#rest_api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRestApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#status_code ApiGatewayMethodResponse#status_code}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStatusCode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#id ApiGatewayMethodResponse#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#response_models ApiGatewayMethodResponse#response_models}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getResponseModels() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#response_parameters ApiGatewayMethodResponse#response_parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.Object> getResponseParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayMethodResponseConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayMethodResponseConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayMethodResponseConfig> {
        java.lang.String httpMethod;
        java.lang.String resourceId;
        java.lang.String restApiId;
        java.lang.String statusCode;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> responseModels;
        java.util.Map<java.lang.String, java.lang.Object> responseParameters;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getHttpMethod}
         * @param httpMethod Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#http_method ApiGatewayMethodResponse#http_method}. This parameter is required.
         * @return {@code this}
         */
        public Builder httpMethod(java.lang.String httpMethod) {
            this.httpMethod = httpMethod;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getResourceId}
         * @param resourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#resource_id ApiGatewayMethodResponse#resource_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder resourceId(java.lang.String resourceId) {
            this.resourceId = resourceId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getRestApiId}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#rest_api_id ApiGatewayMethodResponse#rest_api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder restApiId(java.lang.String restApiId) {
            this.restApiId = restApiId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getStatusCode}
         * @param statusCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#status_code ApiGatewayMethodResponse#status_code}. This parameter is required.
         * @return {@code this}
         */
        public Builder statusCode(java.lang.String statusCode) {
            this.statusCode = statusCode;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#id ApiGatewayMethodResponse#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getResponseModels}
         * @param responseModels Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#response_models ApiGatewayMethodResponse#response_models}.
         * @return {@code this}
         */
        public Builder responseModels(java.util.Map<java.lang.String, java.lang.String> responseModels) {
            this.responseModels = responseModels;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getResponseParameters}
         * @param responseParameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_method_response#response_parameters ApiGatewayMethodResponse#response_parameters}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder responseParameters(java.util.Map<java.lang.String, ? extends java.lang.Object> responseParameters) {
            this.responseParameters = (java.util.Map<java.lang.String, java.lang.Object>)responseParameters;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayMethodResponseConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayMethodResponseConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayMethodResponseConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayMethodResponseConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayMethodResponseConfig {
        private final java.lang.String httpMethod;
        private final java.lang.String resourceId;
        private final java.lang.String restApiId;
        private final java.lang.String statusCode;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> responseModels;
        private final java.util.Map<java.lang.String, java.lang.Object> responseParameters;
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
            this.httpMethod = software.amazon.jsii.Kernel.get(this, "httpMethod", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.resourceId = software.amazon.jsii.Kernel.get(this, "resourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restApiId = software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.statusCode = software.amazon.jsii.Kernel.get(this, "statusCode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.responseModels = software.amazon.jsii.Kernel.get(this, "responseModels", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.responseParameters = software.amazon.jsii.Kernel.get(this, "responseParameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Object.class)));
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
            this.httpMethod = java.util.Objects.requireNonNull(builder.httpMethod, "httpMethod is required");
            this.resourceId = java.util.Objects.requireNonNull(builder.resourceId, "resourceId is required");
            this.restApiId = java.util.Objects.requireNonNull(builder.restApiId, "restApiId is required");
            this.statusCode = java.util.Objects.requireNonNull(builder.statusCode, "statusCode is required");
            this.id = builder.id;
            this.responseModels = builder.responseModels;
            this.responseParameters = (java.util.Map<java.lang.String, java.lang.Object>)builder.responseParameters;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getHttpMethod() {
            return this.httpMethod;
        }

        @Override
        public final java.lang.String getResourceId() {
            return this.resourceId;
        }

        @Override
        public final java.lang.String getRestApiId() {
            return this.restApiId;
        }

        @Override
        public final java.lang.String getStatusCode() {
            return this.statusCode;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getResponseModels() {
            return this.responseModels;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.Object> getResponseParameters() {
            return this.responseParameters;
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

            data.set("httpMethod", om.valueToTree(this.getHttpMethod()));
            data.set("resourceId", om.valueToTree(this.getResourceId()));
            data.set("restApiId", om.valueToTree(this.getRestApiId()));
            data.set("statusCode", om.valueToTree(this.getStatusCode()));
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getResponseModels() != null) {
                data.set("responseModels", om.valueToTree(this.getResponseModels()));
            }
            if (this.getResponseParameters() != null) {
                data.set("responseParameters", om.valueToTree(this.getResponseParameters()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayMethodResponse.ApiGatewayMethodResponseConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayMethodResponseConfig.Jsii$Proxy that = (ApiGatewayMethodResponseConfig.Jsii$Proxy) o;

            if (!httpMethod.equals(that.httpMethod)) return false;
            if (!resourceId.equals(that.resourceId)) return false;
            if (!restApiId.equals(that.restApiId)) return false;
            if (!statusCode.equals(that.statusCode)) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.responseModels != null ? !this.responseModels.equals(that.responseModels) : that.responseModels != null) return false;
            if (this.responseParameters != null ? !this.responseParameters.equals(that.responseParameters) : that.responseParameters != null) return false;
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
            int result = this.httpMethod.hashCode();
            result = 31 * result + (this.resourceId.hashCode());
            result = 31 * result + (this.restApiId.hashCode());
            result = 31 * result + (this.statusCode.hashCode());
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.responseModels != null ? this.responseModels.hashCode() : 0);
            result = 31 * result + (this.responseParameters != null ? this.responseParameters.hashCode() : 0);
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
