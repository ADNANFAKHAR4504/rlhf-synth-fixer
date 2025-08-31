package imports.aws.api_gateway_authorizer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.938Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apiGatewayAuthorizer.ApiGatewayAuthorizerConfig")
@software.amazon.jsii.Jsii.Proxy(ApiGatewayAuthorizerConfig.Jsii$Proxy.class)
public interface ApiGatewayAuthorizerConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#name ApiGatewayAuthorizer#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#rest_api_id ApiGatewayAuthorizer#rest_api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRestApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#authorizer_credentials ApiGatewayAuthorizer#authorizer_credentials}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#authorizer_result_ttl_in_seconds ApiGatewayAuthorizer#authorizer_result_ttl_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAuthorizerResultTtlInSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#authorizer_uri ApiGatewayAuthorizer#authorizer_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAuthorizerUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#id ApiGatewayAuthorizer#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#identity_source ApiGatewayAuthorizer#identity_source}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentitySource() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#identity_validation_expression ApiGatewayAuthorizer#identity_validation_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIdentityValidationExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#provider_arns ApiGatewayAuthorizer#provider_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getProviderArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#type ApiGatewayAuthorizer#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link ApiGatewayAuthorizerConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link ApiGatewayAuthorizerConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<ApiGatewayAuthorizerConfig> {
        java.lang.String name;
        java.lang.String restApiId;
        java.lang.String authorizerCredentials;
        java.lang.Number authorizerResultTtlInSeconds;
        java.lang.String authorizerUri;
        java.lang.String id;
        java.lang.String identitySource;
        java.lang.String identityValidationExpression;
        java.util.List<java.lang.String> providerArns;
        java.lang.String type;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#name ApiGatewayAuthorizer#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getRestApiId}
         * @param restApiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#rest_api_id ApiGatewayAuthorizer#rest_api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder restApiId(java.lang.String restApiId) {
            this.restApiId = restApiId;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getAuthorizerCredentials}
         * @param authorizerCredentials Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#authorizer_credentials ApiGatewayAuthorizer#authorizer_credentials}.
         * @return {@code this}
         */
        public Builder authorizerCredentials(java.lang.String authorizerCredentials) {
            this.authorizerCredentials = authorizerCredentials;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getAuthorizerResultTtlInSeconds}
         * @param authorizerResultTtlInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#authorizer_result_ttl_in_seconds ApiGatewayAuthorizer#authorizer_result_ttl_in_seconds}.
         * @return {@code this}
         */
        public Builder authorizerResultTtlInSeconds(java.lang.Number authorizerResultTtlInSeconds) {
            this.authorizerResultTtlInSeconds = authorizerResultTtlInSeconds;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getAuthorizerUri}
         * @param authorizerUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#authorizer_uri ApiGatewayAuthorizer#authorizer_uri}.
         * @return {@code this}
         */
        public Builder authorizerUri(java.lang.String authorizerUri) {
            this.authorizerUri = authorizerUri;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#id ApiGatewayAuthorizer#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getIdentitySource}
         * @param identitySource Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#identity_source ApiGatewayAuthorizer#identity_source}.
         * @return {@code this}
         */
        public Builder identitySource(java.lang.String identitySource) {
            this.identitySource = identitySource;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getIdentityValidationExpression}
         * @param identityValidationExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#identity_validation_expression ApiGatewayAuthorizer#identity_validation_expression}.
         * @return {@code this}
         */
        public Builder identityValidationExpression(java.lang.String identityValidationExpression) {
            this.identityValidationExpression = identityValidationExpression;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getProviderArns}
         * @param providerArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#provider_arns ApiGatewayAuthorizer#provider_arns}.
         * @return {@code this}
         */
        public Builder providerArns(java.util.List<java.lang.String> providerArns) {
            this.providerArns = providerArns;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/api_gateway_authorizer#type ApiGatewayAuthorizer#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getDependsOn}
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
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link ApiGatewayAuthorizerConfig#getProvisioners}
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
         * @return a new instance of {@link ApiGatewayAuthorizerConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public ApiGatewayAuthorizerConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link ApiGatewayAuthorizerConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements ApiGatewayAuthorizerConfig {
        private final java.lang.String name;
        private final java.lang.String restApiId;
        private final java.lang.String authorizerCredentials;
        private final java.lang.Number authorizerResultTtlInSeconds;
        private final java.lang.String authorizerUri;
        private final java.lang.String id;
        private final java.lang.String identitySource;
        private final java.lang.String identityValidationExpression;
        private final java.util.List<java.lang.String> providerArns;
        private final java.lang.String type;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.restApiId = software.amazon.jsii.Kernel.get(this, "restApiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerCredentials = software.amazon.jsii.Kernel.get(this, "authorizerCredentials", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.authorizerResultTtlInSeconds = software.amazon.jsii.Kernel.get(this, "authorizerResultTtlInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.authorizerUri = software.amazon.jsii.Kernel.get(this, "authorizerUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identitySource = software.amazon.jsii.Kernel.get(this, "identitySource", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.identityValidationExpression = software.amazon.jsii.Kernel.get(this, "identityValidationExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.providerArns = software.amazon.jsii.Kernel.get(this, "providerArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.restApiId = java.util.Objects.requireNonNull(builder.restApiId, "restApiId is required");
            this.authorizerCredentials = builder.authorizerCredentials;
            this.authorizerResultTtlInSeconds = builder.authorizerResultTtlInSeconds;
            this.authorizerUri = builder.authorizerUri;
            this.id = builder.id;
            this.identitySource = builder.identitySource;
            this.identityValidationExpression = builder.identityValidationExpression;
            this.providerArns = builder.providerArns;
            this.type = builder.type;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getRestApiId() {
            return this.restApiId;
        }

        @Override
        public final java.lang.String getAuthorizerCredentials() {
            return this.authorizerCredentials;
        }

        @Override
        public final java.lang.Number getAuthorizerResultTtlInSeconds() {
            return this.authorizerResultTtlInSeconds;
        }

        @Override
        public final java.lang.String getAuthorizerUri() {
            return this.authorizerUri;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIdentitySource() {
            return this.identitySource;
        }

        @Override
        public final java.lang.String getIdentityValidationExpression() {
            return this.identityValidationExpression;
        }

        @Override
        public final java.util.List<java.lang.String> getProviderArns() {
            return this.providerArns;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
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

            data.set("name", om.valueToTree(this.getName()));
            data.set("restApiId", om.valueToTree(this.getRestApiId()));
            if (this.getAuthorizerCredentials() != null) {
                data.set("authorizerCredentials", om.valueToTree(this.getAuthorizerCredentials()));
            }
            if (this.getAuthorizerResultTtlInSeconds() != null) {
                data.set("authorizerResultTtlInSeconds", om.valueToTree(this.getAuthorizerResultTtlInSeconds()));
            }
            if (this.getAuthorizerUri() != null) {
                data.set("authorizerUri", om.valueToTree(this.getAuthorizerUri()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdentitySource() != null) {
                data.set("identitySource", om.valueToTree(this.getIdentitySource()));
            }
            if (this.getIdentityValidationExpression() != null) {
                data.set("identityValidationExpression", om.valueToTree(this.getIdentityValidationExpression()));
            }
            if (this.getProviderArns() != null) {
                data.set("providerArns", om.valueToTree(this.getProviderArns()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
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
            struct.set("fqn", om.valueToTree("aws.apiGatewayAuthorizer.ApiGatewayAuthorizerConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            ApiGatewayAuthorizerConfig.Jsii$Proxy that = (ApiGatewayAuthorizerConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!restApiId.equals(that.restApiId)) return false;
            if (this.authorizerCredentials != null ? !this.authorizerCredentials.equals(that.authorizerCredentials) : that.authorizerCredentials != null) return false;
            if (this.authorizerResultTtlInSeconds != null ? !this.authorizerResultTtlInSeconds.equals(that.authorizerResultTtlInSeconds) : that.authorizerResultTtlInSeconds != null) return false;
            if (this.authorizerUri != null ? !this.authorizerUri.equals(that.authorizerUri) : that.authorizerUri != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.identitySource != null ? !this.identitySource.equals(that.identitySource) : that.identitySource != null) return false;
            if (this.identityValidationExpression != null ? !this.identityValidationExpression.equals(that.identityValidationExpression) : that.identityValidationExpression != null) return false;
            if (this.providerArns != null ? !this.providerArns.equals(that.providerArns) : that.providerArns != null) return false;
            if (this.type != null ? !this.type.equals(that.type) : that.type != null) return false;
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
            int result = this.name.hashCode();
            result = 31 * result + (this.restApiId.hashCode());
            result = 31 * result + (this.authorizerCredentials != null ? this.authorizerCredentials.hashCode() : 0);
            result = 31 * result + (this.authorizerResultTtlInSeconds != null ? this.authorizerResultTtlInSeconds.hashCode() : 0);
            result = 31 * result + (this.authorizerUri != null ? this.authorizerUri.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.identitySource != null ? this.identitySource.hashCode() : 0);
            result = 31 * result + (this.identityValidationExpression != null ? this.identityValidationExpression.hashCode() : 0);
            result = 31 * result + (this.providerArns != null ? this.providerArns.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
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
