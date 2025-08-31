package imports.aws.apigatewayv2_api;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:45.962Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.apigatewayv2Api.Apigatewayv2ApiConfig")
@software.amazon.jsii.Jsii.Proxy(Apigatewayv2ApiConfig.Jsii$Proxy.class)
public interface Apigatewayv2ApiConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#name Apigatewayv2Api#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#protocol_type Apigatewayv2Api#protocol_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocolType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#api_key_selection_expression Apigatewayv2Api#api_key_selection_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApiKeySelectionExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#body Apigatewayv2Api#body}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBody() {
        return null;
    }

    /**
     * cors_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#cors_configuration Apigatewayv2Api#cors_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration getCorsConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#credentials_arn Apigatewayv2Api#credentials_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCredentialsArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#description Apigatewayv2Api#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#disable_execute_api_endpoint Apigatewayv2Api#disable_execute_api_endpoint}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDisableExecuteApiEndpoint() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#fail_on_warnings Apigatewayv2Api#fail_on_warnings}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFailOnWarnings() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#id Apigatewayv2Api#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#ip_address_type Apigatewayv2Api#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_key Apigatewayv2Api#route_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRouteKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_selection_expression Apigatewayv2Api#route_selection_expression}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRouteSelectionExpression() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags Apigatewayv2Api#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags_all Apigatewayv2Api#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#target Apigatewayv2Api#target}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTarget() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#version Apigatewayv2Api#version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVersion() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Apigatewayv2ApiConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Apigatewayv2ApiConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Apigatewayv2ApiConfig> {
        java.lang.String name;
        java.lang.String protocolType;
        java.lang.String apiKeySelectionExpression;
        java.lang.String body;
        imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration corsConfiguration;
        java.lang.String credentialsArn;
        java.lang.String description;
        java.lang.Object disableExecuteApiEndpoint;
        java.lang.Object failOnWarnings;
        java.lang.String id;
        java.lang.String ipAddressType;
        java.lang.String routeKey;
        java.lang.String routeSelectionExpression;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String target;
        java.lang.String version;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#name Apigatewayv2Api#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getProtocolType}
         * @param protocolType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#protocol_type Apigatewayv2Api#protocol_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocolType(java.lang.String protocolType) {
            this.protocolType = protocolType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getApiKeySelectionExpression}
         * @param apiKeySelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#api_key_selection_expression Apigatewayv2Api#api_key_selection_expression}.
         * @return {@code this}
         */
        public Builder apiKeySelectionExpression(java.lang.String apiKeySelectionExpression) {
            this.apiKeySelectionExpression = apiKeySelectionExpression;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getBody}
         * @param body Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#body Apigatewayv2Api#body}.
         * @return {@code this}
         */
        public Builder body(java.lang.String body) {
            this.body = body;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getCorsConfiguration}
         * @param corsConfiguration cors_configuration block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#cors_configuration Apigatewayv2Api#cors_configuration}
         * @return {@code this}
         */
        public Builder corsConfiguration(imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration corsConfiguration) {
            this.corsConfiguration = corsConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getCredentialsArn}
         * @param credentialsArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#credentials_arn Apigatewayv2Api#credentials_arn}.
         * @return {@code this}
         */
        public Builder credentialsArn(java.lang.String credentialsArn) {
            this.credentialsArn = credentialsArn;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#description Apigatewayv2Api#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getDisableExecuteApiEndpoint}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#disable_execute_api_endpoint Apigatewayv2Api#disable_execute_api_endpoint}.
         * @return {@code this}
         */
        public Builder disableExecuteApiEndpoint(java.lang.Boolean disableExecuteApiEndpoint) {
            this.disableExecuteApiEndpoint = disableExecuteApiEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getDisableExecuteApiEndpoint}
         * @param disableExecuteApiEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#disable_execute_api_endpoint Apigatewayv2Api#disable_execute_api_endpoint}.
         * @return {@code this}
         */
        public Builder disableExecuteApiEndpoint(com.hashicorp.cdktf.IResolvable disableExecuteApiEndpoint) {
            this.disableExecuteApiEndpoint = disableExecuteApiEndpoint;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getFailOnWarnings}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#fail_on_warnings Apigatewayv2Api#fail_on_warnings}.
         * @return {@code this}
         */
        public Builder failOnWarnings(java.lang.Boolean failOnWarnings) {
            this.failOnWarnings = failOnWarnings;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getFailOnWarnings}
         * @param failOnWarnings Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#fail_on_warnings Apigatewayv2Api#fail_on_warnings}.
         * @return {@code this}
         */
        public Builder failOnWarnings(com.hashicorp.cdktf.IResolvable failOnWarnings) {
            this.failOnWarnings = failOnWarnings;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#id Apigatewayv2Api#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#ip_address_type Apigatewayv2Api#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getRouteKey}
         * @param routeKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_key Apigatewayv2Api#route_key}.
         * @return {@code this}
         */
        public Builder routeKey(java.lang.String routeKey) {
            this.routeKey = routeKey;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getRouteSelectionExpression}
         * @param routeSelectionExpression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#route_selection_expression Apigatewayv2Api#route_selection_expression}.
         * @return {@code this}
         */
        public Builder routeSelectionExpression(java.lang.String routeSelectionExpression) {
            this.routeSelectionExpression = routeSelectionExpression;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags Apigatewayv2Api#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#tags_all Apigatewayv2Api#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getTarget}
         * @param target Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#target Apigatewayv2Api#target}.
         * @return {@code this}
         */
        public Builder target(java.lang.String target) {
            this.target = target;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getVersion}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/apigatewayv2_api#version Apigatewayv2Api#version}.
         * @return {@code this}
         */
        public Builder version(java.lang.String version) {
            this.version = version;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getDependsOn}
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
         * Sets the value of {@link Apigatewayv2ApiConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Apigatewayv2ApiConfig#getProvisioners}
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
         * @return a new instance of {@link Apigatewayv2ApiConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Apigatewayv2ApiConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Apigatewayv2ApiConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Apigatewayv2ApiConfig {
        private final java.lang.String name;
        private final java.lang.String protocolType;
        private final java.lang.String apiKeySelectionExpression;
        private final java.lang.String body;
        private final imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration corsConfiguration;
        private final java.lang.String credentialsArn;
        private final java.lang.String description;
        private final java.lang.Object disableExecuteApiEndpoint;
        private final java.lang.Object failOnWarnings;
        private final java.lang.String id;
        private final java.lang.String ipAddressType;
        private final java.lang.String routeKey;
        private final java.lang.String routeSelectionExpression;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String target;
        private final java.lang.String version;
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
            this.protocolType = software.amazon.jsii.Kernel.get(this, "protocolType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.apiKeySelectionExpression = software.amazon.jsii.Kernel.get(this, "apiKeySelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.body = software.amazon.jsii.Kernel.get(this, "body", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.corsConfiguration = software.amazon.jsii.Kernel.get(this, "corsConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration.class));
            this.credentialsArn = software.amazon.jsii.Kernel.get(this, "credentialsArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.disableExecuteApiEndpoint = software.amazon.jsii.Kernel.get(this, "disableExecuteApiEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.failOnWarnings = software.amazon.jsii.Kernel.get(this, "failOnWarnings", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routeKey = software.amazon.jsii.Kernel.get(this, "routeKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routeSelectionExpression = software.amazon.jsii.Kernel.get(this, "routeSelectionExpression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.target = software.amazon.jsii.Kernel.get(this, "target", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.version = software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.protocolType = java.util.Objects.requireNonNull(builder.protocolType, "protocolType is required");
            this.apiKeySelectionExpression = builder.apiKeySelectionExpression;
            this.body = builder.body;
            this.corsConfiguration = builder.corsConfiguration;
            this.credentialsArn = builder.credentialsArn;
            this.description = builder.description;
            this.disableExecuteApiEndpoint = builder.disableExecuteApiEndpoint;
            this.failOnWarnings = builder.failOnWarnings;
            this.id = builder.id;
            this.ipAddressType = builder.ipAddressType;
            this.routeKey = builder.routeKey;
            this.routeSelectionExpression = builder.routeSelectionExpression;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.target = builder.target;
            this.version = builder.version;
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
        public final java.lang.String getProtocolType() {
            return this.protocolType;
        }

        @Override
        public final java.lang.String getApiKeySelectionExpression() {
            return this.apiKeySelectionExpression;
        }

        @Override
        public final java.lang.String getBody() {
            return this.body;
        }

        @Override
        public final imports.aws.apigatewayv2_api.Apigatewayv2ApiCorsConfiguration getCorsConfiguration() {
            return this.corsConfiguration;
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
        public final java.lang.Object getDisableExecuteApiEndpoint() {
            return this.disableExecuteApiEndpoint;
        }

        @Override
        public final java.lang.Object getFailOnWarnings() {
            return this.failOnWarnings;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        public final java.lang.String getRouteKey() {
            return this.routeKey;
        }

        @Override
        public final java.lang.String getRouteSelectionExpression() {
            return this.routeSelectionExpression;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
            return this.tagsAll;
        }

        @Override
        public final java.lang.String getTarget() {
            return this.target;
        }

        @Override
        public final java.lang.String getVersion() {
            return this.version;
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
            data.set("protocolType", om.valueToTree(this.getProtocolType()));
            if (this.getApiKeySelectionExpression() != null) {
                data.set("apiKeySelectionExpression", om.valueToTree(this.getApiKeySelectionExpression()));
            }
            if (this.getBody() != null) {
                data.set("body", om.valueToTree(this.getBody()));
            }
            if (this.getCorsConfiguration() != null) {
                data.set("corsConfiguration", om.valueToTree(this.getCorsConfiguration()));
            }
            if (this.getCredentialsArn() != null) {
                data.set("credentialsArn", om.valueToTree(this.getCredentialsArn()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDisableExecuteApiEndpoint() != null) {
                data.set("disableExecuteApiEndpoint", om.valueToTree(this.getDisableExecuteApiEndpoint()));
            }
            if (this.getFailOnWarnings() != null) {
                data.set("failOnWarnings", om.valueToTree(this.getFailOnWarnings()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }
            if (this.getRouteKey() != null) {
                data.set("routeKey", om.valueToTree(this.getRouteKey()));
            }
            if (this.getRouteSelectionExpression() != null) {
                data.set("routeSelectionExpression", om.valueToTree(this.getRouteSelectionExpression()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTarget() != null) {
                data.set("target", om.valueToTree(this.getTarget()));
            }
            if (this.getVersion() != null) {
                data.set("version", om.valueToTree(this.getVersion()));
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
            struct.set("fqn", om.valueToTree("aws.apigatewayv2Api.Apigatewayv2ApiConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Apigatewayv2ApiConfig.Jsii$Proxy that = (Apigatewayv2ApiConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!protocolType.equals(that.protocolType)) return false;
            if (this.apiKeySelectionExpression != null ? !this.apiKeySelectionExpression.equals(that.apiKeySelectionExpression) : that.apiKeySelectionExpression != null) return false;
            if (this.body != null ? !this.body.equals(that.body) : that.body != null) return false;
            if (this.corsConfiguration != null ? !this.corsConfiguration.equals(that.corsConfiguration) : that.corsConfiguration != null) return false;
            if (this.credentialsArn != null ? !this.credentialsArn.equals(that.credentialsArn) : that.credentialsArn != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.disableExecuteApiEndpoint != null ? !this.disableExecuteApiEndpoint.equals(that.disableExecuteApiEndpoint) : that.disableExecuteApiEndpoint != null) return false;
            if (this.failOnWarnings != null ? !this.failOnWarnings.equals(that.failOnWarnings) : that.failOnWarnings != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            if (this.routeKey != null ? !this.routeKey.equals(that.routeKey) : that.routeKey != null) return false;
            if (this.routeSelectionExpression != null ? !this.routeSelectionExpression.equals(that.routeSelectionExpression) : that.routeSelectionExpression != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.target != null ? !this.target.equals(that.target) : that.target != null) return false;
            if (this.version != null ? !this.version.equals(that.version) : that.version != null) return false;
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
            result = 31 * result + (this.protocolType.hashCode());
            result = 31 * result + (this.apiKeySelectionExpression != null ? this.apiKeySelectionExpression.hashCode() : 0);
            result = 31 * result + (this.body != null ? this.body.hashCode() : 0);
            result = 31 * result + (this.corsConfiguration != null ? this.corsConfiguration.hashCode() : 0);
            result = 31 * result + (this.credentialsArn != null ? this.credentialsArn.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.disableExecuteApiEndpoint != null ? this.disableExecuteApiEndpoint.hashCode() : 0);
            result = 31 * result + (this.failOnWarnings != null ? this.failOnWarnings.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.routeKey != null ? this.routeKey.hashCode() : 0);
            result = 31 * result + (this.routeSelectionExpression != null ? this.routeSelectionExpression.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.target != null ? this.target.hashCode() : 0);
            result = 31 * result + (this.version != null ? this.version.hashCode() : 0);
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
