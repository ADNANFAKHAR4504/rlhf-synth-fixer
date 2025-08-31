package imports.aws.appsync_datasource;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasourceConfig")
@software.amazon.jsii.Jsii.Proxy(AppsyncDatasourceConfig.Jsii$Proxy.class)
public interface AppsyncDatasourceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#api_id AppsyncDatasource#api_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getApiId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#name AppsyncDatasource#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#type AppsyncDatasource#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#description AppsyncDatasource#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * dynamodb_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#dynamodb_config AppsyncDatasource#dynamodb_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig getDynamodbConfig() {
        return null;
    }

    /**
     * elasticsearch_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#elasticsearch_config AppsyncDatasource#elasticsearch_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig getElasticsearchConfig() {
        return null;
    }

    /**
     * event_bridge_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#event_bridge_config AppsyncDatasource#event_bridge_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig getEventBridgeConfig() {
        return null;
    }

    /**
     * http_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#http_config AppsyncDatasource#http_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig getHttpConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#id AppsyncDatasource#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * lambda_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#lambda_config AppsyncDatasource#lambda_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig getLambdaConfig() {
        return null;
    }

    /**
     * opensearchservice_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#opensearchservice_config AppsyncDatasource#opensearchservice_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig getOpensearchserviceConfig() {
        return null;
    }

    /**
     * relational_database_config block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#relational_database_config AppsyncDatasource#relational_database_config}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig getRelationalDatabaseConfig() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#service_role_arn AppsyncDatasource#service_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppsyncDatasourceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppsyncDatasourceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppsyncDatasourceConfig> {
        java.lang.String apiId;
        java.lang.String name;
        java.lang.String type;
        java.lang.String description;
        imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig dynamodbConfig;
        imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig elasticsearchConfig;
        imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig eventBridgeConfig;
        imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig httpConfig;
        java.lang.String id;
        imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig lambdaConfig;
        imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig opensearchserviceConfig;
        imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig relationalDatabaseConfig;
        java.lang.String serviceRoleArn;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getApiId}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#api_id AppsyncDatasource#api_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder apiId(java.lang.String apiId) {
            this.apiId = apiId;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#name AppsyncDatasource#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#type AppsyncDatasource#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#description AppsyncDatasource#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getDynamodbConfig}
         * @param dynamodbConfig dynamodb_config block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#dynamodb_config AppsyncDatasource#dynamodb_config}
         * @return {@code this}
         */
        public Builder dynamodbConfig(imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig dynamodbConfig) {
            this.dynamodbConfig = dynamodbConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getElasticsearchConfig}
         * @param elasticsearchConfig elasticsearch_config block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#elasticsearch_config AppsyncDatasource#elasticsearch_config}
         * @return {@code this}
         */
        public Builder elasticsearchConfig(imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig elasticsearchConfig) {
            this.elasticsearchConfig = elasticsearchConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getEventBridgeConfig}
         * @param eventBridgeConfig event_bridge_config block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#event_bridge_config AppsyncDatasource#event_bridge_config}
         * @return {@code this}
         */
        public Builder eventBridgeConfig(imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig eventBridgeConfig) {
            this.eventBridgeConfig = eventBridgeConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getHttpConfig}
         * @param httpConfig http_config block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#http_config AppsyncDatasource#http_config}
         * @return {@code this}
         */
        public Builder httpConfig(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig httpConfig) {
            this.httpConfig = httpConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#id AppsyncDatasource#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getLambdaConfig}
         * @param lambdaConfig lambda_config block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#lambda_config AppsyncDatasource#lambda_config}
         * @return {@code this}
         */
        public Builder lambdaConfig(imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig lambdaConfig) {
            this.lambdaConfig = lambdaConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getOpensearchserviceConfig}
         * @param opensearchserviceConfig opensearchservice_config block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#opensearchservice_config AppsyncDatasource#opensearchservice_config}
         * @return {@code this}
         */
        public Builder opensearchserviceConfig(imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig opensearchserviceConfig) {
            this.opensearchserviceConfig = opensearchserviceConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getRelationalDatabaseConfig}
         * @param relationalDatabaseConfig relational_database_config block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#relational_database_config AppsyncDatasource#relational_database_config}
         * @return {@code this}
         */
        public Builder relationalDatabaseConfig(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig relationalDatabaseConfig) {
            this.relationalDatabaseConfig = relationalDatabaseConfig;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getServiceRoleArn}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#service_role_arn AppsyncDatasource#service_role_arn}.
         * @return {@code this}
         */
        public Builder serviceRoleArn(java.lang.String serviceRoleArn) {
            this.serviceRoleArn = serviceRoleArn;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getDependsOn}
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
         * Sets the value of {@link AppsyncDatasourceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link AppsyncDatasourceConfig#getProvisioners}
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
         * @return a new instance of {@link AppsyncDatasourceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppsyncDatasourceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppsyncDatasourceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppsyncDatasourceConfig {
        private final java.lang.String apiId;
        private final java.lang.String name;
        private final java.lang.String type;
        private final java.lang.String description;
        private final imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig dynamodbConfig;
        private final imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig elasticsearchConfig;
        private final imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig eventBridgeConfig;
        private final imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig httpConfig;
        private final java.lang.String id;
        private final imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig lambdaConfig;
        private final imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig opensearchserviceConfig;
        private final imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig relationalDatabaseConfig;
        private final java.lang.String serviceRoleArn;
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
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dynamodbConfig = software.amazon.jsii.Kernel.get(this, "dynamodbConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig.class));
            this.elasticsearchConfig = software.amazon.jsii.Kernel.get(this, "elasticsearchConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig.class));
            this.eventBridgeConfig = software.amazon.jsii.Kernel.get(this, "eventBridgeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig.class));
            this.httpConfig = software.amazon.jsii.Kernel.get(this, "httpConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.lambdaConfig = software.amazon.jsii.Kernel.get(this, "lambdaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig.class));
            this.opensearchserviceConfig = software.amazon.jsii.Kernel.get(this, "opensearchserviceConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig.class));
            this.relationalDatabaseConfig = software.amazon.jsii.Kernel.get(this, "relationalDatabaseConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig.class));
            this.serviceRoleArn = software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.description = builder.description;
            this.dynamodbConfig = builder.dynamodbConfig;
            this.elasticsearchConfig = builder.elasticsearchConfig;
            this.eventBridgeConfig = builder.eventBridgeConfig;
            this.httpConfig = builder.httpConfig;
            this.id = builder.id;
            this.lambdaConfig = builder.lambdaConfig;
            this.opensearchserviceConfig = builder.opensearchserviceConfig;
            this.relationalDatabaseConfig = builder.relationalDatabaseConfig;
            this.serviceRoleArn = builder.serviceRoleArn;
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
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig getDynamodbConfig() {
            return this.dynamodbConfig;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig getElasticsearchConfig() {
            return this.elasticsearchConfig;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig getEventBridgeConfig() {
            return this.eventBridgeConfig;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig getHttpConfig() {
            return this.httpConfig;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig getLambdaConfig() {
            return this.lambdaConfig;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig getOpensearchserviceConfig() {
            return this.opensearchserviceConfig;
        }

        @Override
        public final imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig getRelationalDatabaseConfig() {
            return this.relationalDatabaseConfig;
        }

        @Override
        public final java.lang.String getServiceRoleArn() {
            return this.serviceRoleArn;
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
            data.set("name", om.valueToTree(this.getName()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDynamodbConfig() != null) {
                data.set("dynamodbConfig", om.valueToTree(this.getDynamodbConfig()));
            }
            if (this.getElasticsearchConfig() != null) {
                data.set("elasticsearchConfig", om.valueToTree(this.getElasticsearchConfig()));
            }
            if (this.getEventBridgeConfig() != null) {
                data.set("eventBridgeConfig", om.valueToTree(this.getEventBridgeConfig()));
            }
            if (this.getHttpConfig() != null) {
                data.set("httpConfig", om.valueToTree(this.getHttpConfig()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLambdaConfig() != null) {
                data.set("lambdaConfig", om.valueToTree(this.getLambdaConfig()));
            }
            if (this.getOpensearchserviceConfig() != null) {
                data.set("opensearchserviceConfig", om.valueToTree(this.getOpensearchserviceConfig()));
            }
            if (this.getRelationalDatabaseConfig() != null) {
                data.set("relationalDatabaseConfig", om.valueToTree(this.getRelationalDatabaseConfig()));
            }
            if (this.getServiceRoleArn() != null) {
                data.set("serviceRoleArn", om.valueToTree(this.getServiceRoleArn()));
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
            struct.set("fqn", om.valueToTree("aws.appsyncDatasource.AppsyncDatasourceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppsyncDatasourceConfig.Jsii$Proxy that = (AppsyncDatasourceConfig.Jsii$Proxy) o;

            if (!apiId.equals(that.apiId)) return false;
            if (!name.equals(that.name)) return false;
            if (!type.equals(that.type)) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.dynamodbConfig != null ? !this.dynamodbConfig.equals(that.dynamodbConfig) : that.dynamodbConfig != null) return false;
            if (this.elasticsearchConfig != null ? !this.elasticsearchConfig.equals(that.elasticsearchConfig) : that.elasticsearchConfig != null) return false;
            if (this.eventBridgeConfig != null ? !this.eventBridgeConfig.equals(that.eventBridgeConfig) : that.eventBridgeConfig != null) return false;
            if (this.httpConfig != null ? !this.httpConfig.equals(that.httpConfig) : that.httpConfig != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.lambdaConfig != null ? !this.lambdaConfig.equals(that.lambdaConfig) : that.lambdaConfig != null) return false;
            if (this.opensearchserviceConfig != null ? !this.opensearchserviceConfig.equals(that.opensearchserviceConfig) : that.opensearchserviceConfig != null) return false;
            if (this.relationalDatabaseConfig != null ? !this.relationalDatabaseConfig.equals(that.relationalDatabaseConfig) : that.relationalDatabaseConfig != null) return false;
            if (this.serviceRoleArn != null ? !this.serviceRoleArn.equals(that.serviceRoleArn) : that.serviceRoleArn != null) return false;
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
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.dynamodbConfig != null ? this.dynamodbConfig.hashCode() : 0);
            result = 31 * result + (this.elasticsearchConfig != null ? this.elasticsearchConfig.hashCode() : 0);
            result = 31 * result + (this.eventBridgeConfig != null ? this.eventBridgeConfig.hashCode() : 0);
            result = 31 * result + (this.httpConfig != null ? this.httpConfig.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.lambdaConfig != null ? this.lambdaConfig.hashCode() : 0);
            result = 31 * result + (this.opensearchserviceConfig != null ? this.opensearchserviceConfig.hashCode() : 0);
            result = 31 * result + (this.relationalDatabaseConfig != null ? this.relationalDatabaseConfig.hashCode() : 0);
            result = 31 * result + (this.serviceRoleArn != null ? this.serviceRoleArn.hashCode() : 0);
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
