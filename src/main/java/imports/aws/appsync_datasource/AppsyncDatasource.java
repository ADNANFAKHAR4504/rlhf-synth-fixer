package imports.aws.appsync_datasource;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource aws_appsync_datasource}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.068Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appsyncDatasource.AppsyncDatasource")
public class AppsyncDatasource extends com.hashicorp.cdktf.TerraformResource {

    protected AppsyncDatasource(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected AppsyncDatasource(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.appsync_datasource.AppsyncDatasource.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource aws_appsync_datasource} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public AppsyncDatasource(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a AppsyncDatasource resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncDatasource to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncDatasource that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the AppsyncDatasource to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_datasource.AppsyncDatasource.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a AppsyncDatasource resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the AppsyncDatasource to import. This parameter is required.
     * @param importFromId The id of the existing AppsyncDatasource that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.appsync_datasource.AppsyncDatasource.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putDynamodbConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig value) {
        software.amazon.jsii.Kernel.call(this, "putDynamodbConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putElasticsearchConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig value) {
        software.amazon.jsii.Kernel.call(this, "putElasticsearchConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putEventBridgeConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig value) {
        software.amazon.jsii.Kernel.call(this, "putEventBridgeConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putHttpConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig value) {
        software.amazon.jsii.Kernel.call(this, "putHttpConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLambdaConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig value) {
        software.amazon.jsii.Kernel.call(this, "putLambdaConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putOpensearchserviceConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig value) {
        software.amazon.jsii.Kernel.call(this, "putOpensearchserviceConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRelationalDatabaseConfig(final @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig value) {
        software.amazon.jsii.Kernel.call(this, "putRelationalDatabaseConfig", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDynamodbConfig() {
        software.amazon.jsii.Kernel.call(this, "resetDynamodbConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetElasticsearchConfig() {
        software.amazon.jsii.Kernel.call(this, "resetElasticsearchConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEventBridgeConfig() {
        software.amazon.jsii.Kernel.call(this, "resetEventBridgeConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHttpConfig() {
        software.amazon.jsii.Kernel.call(this, "resetHttpConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLambdaConfig() {
        software.amazon.jsii.Kernel.call(this, "resetLambdaConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOpensearchserviceConfig() {
        software.amazon.jsii.Kernel.call(this, "resetOpensearchserviceConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRelationalDatabaseConfig() {
        software.amazon.jsii.Kernel.call(this, "resetRelationalDatabaseConfig", software.amazon.jsii.NativeType.VOID);
    }

    public void resetServiceRoleArn() {
        software.amazon.jsii.Kernel.call(this, "resetServiceRoleArn", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getArn() {
        return software.amazon.jsii.Kernel.get(this, "arn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigOutputReference getDynamodbConfig() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfigOutputReference getElasticsearchConfig() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearchConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfigOutputReference getEventBridgeConfig() {
        return software.amazon.jsii.Kernel.get(this, "eventBridgeConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigOutputReference getHttpConfig() {
        return software.amazon.jsii.Kernel.get(this, "httpConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfigOutputReference getLambdaConfig() {
        return software.amazon.jsii.Kernel.get(this, "lambdaConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfigOutputReference getOpensearchserviceConfig() {
        return software.amazon.jsii.Kernel.get(this, "opensearchserviceConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigOutputReference getRelationalDatabaseConfig() {
        return software.amazon.jsii.Kernel.get(this, "relationalDatabaseConfig", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfigOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getApiIdInput() {
        return software.amazon.jsii.Kernel.get(this, "apiIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig getDynamodbConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "dynamodbConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig getElasticsearchConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "elasticsearchConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig getEventBridgeConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "eventBridgeConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig getHttpConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "httpConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig getLambdaConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "lambdaConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig getOpensearchserviceConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "opensearchserviceConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig getRelationalDatabaseConfigInput() {
        return software.amazon.jsii.Kernel.get(this, "relationalDatabaseConfigInput", software.amazon.jsii.NativeType.forClass(imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServiceRoleArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getApiId() {
        return software.amazon.jsii.Kernel.get(this, "apiId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setApiId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "apiId", java.util.Objects.requireNonNull(value, "apiId is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServiceRoleArn() {
        return software.amazon.jsii.Kernel.get(this, "serviceRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServiceRoleArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serviceRoleArn", java.util.Objects.requireNonNull(value, "serviceRoleArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.appsync_datasource.AppsyncDatasource}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.appsync_datasource.AppsyncDatasource> {
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
        private final imports.aws.appsync_datasource.AppsyncDatasourceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.appsync_datasource.AppsyncDatasourceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#api_id AppsyncDatasource#api_id}.
         * <p>
         * @return {@code this}
         * @param apiId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#api_id AppsyncDatasource#api_id}. This parameter is required.
         */
        public Builder apiId(final java.lang.String apiId) {
            this.config.apiId(apiId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#name AppsyncDatasource#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#name AppsyncDatasource#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#type AppsyncDatasource#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#type AppsyncDatasource#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#description AppsyncDatasource#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#description AppsyncDatasource#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * dynamodb_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#dynamodb_config AppsyncDatasource#dynamodb_config}
         * <p>
         * @return {@code this}
         * @param dynamodbConfig dynamodb_config block. This parameter is required.
         */
        public Builder dynamodbConfig(final imports.aws.appsync_datasource.AppsyncDatasourceDynamodbConfig dynamodbConfig) {
            this.config.dynamodbConfig(dynamodbConfig);
            return this;
        }

        /**
         * elasticsearch_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#elasticsearch_config AppsyncDatasource#elasticsearch_config}
         * <p>
         * @return {@code this}
         * @param elasticsearchConfig elasticsearch_config block. This parameter is required.
         */
        public Builder elasticsearchConfig(final imports.aws.appsync_datasource.AppsyncDatasourceElasticsearchConfig elasticsearchConfig) {
            this.config.elasticsearchConfig(elasticsearchConfig);
            return this;
        }

        /**
         * event_bridge_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#event_bridge_config AppsyncDatasource#event_bridge_config}
         * <p>
         * @return {@code this}
         * @param eventBridgeConfig event_bridge_config block. This parameter is required.
         */
        public Builder eventBridgeConfig(final imports.aws.appsync_datasource.AppsyncDatasourceEventBridgeConfig eventBridgeConfig) {
            this.config.eventBridgeConfig(eventBridgeConfig);
            return this;
        }

        /**
         * http_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#http_config AppsyncDatasource#http_config}
         * <p>
         * @return {@code this}
         * @param httpConfig http_config block. This parameter is required.
         */
        public Builder httpConfig(final imports.aws.appsync_datasource.AppsyncDatasourceHttpConfig httpConfig) {
            this.config.httpConfig(httpConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#id AppsyncDatasource#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#id AppsyncDatasource#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * lambda_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#lambda_config AppsyncDatasource#lambda_config}
         * <p>
         * @return {@code this}
         * @param lambdaConfig lambda_config block. This parameter is required.
         */
        public Builder lambdaConfig(final imports.aws.appsync_datasource.AppsyncDatasourceLambdaConfig lambdaConfig) {
            this.config.lambdaConfig(lambdaConfig);
            return this;
        }

        /**
         * opensearchservice_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#opensearchservice_config AppsyncDatasource#opensearchservice_config}
         * <p>
         * @return {@code this}
         * @param opensearchserviceConfig opensearchservice_config block. This parameter is required.
         */
        public Builder opensearchserviceConfig(final imports.aws.appsync_datasource.AppsyncDatasourceOpensearchserviceConfig opensearchserviceConfig) {
            this.config.opensearchserviceConfig(opensearchserviceConfig);
            return this;
        }

        /**
         * relational_database_config block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#relational_database_config AppsyncDatasource#relational_database_config}
         * <p>
         * @return {@code this}
         * @param relationalDatabaseConfig relational_database_config block. This parameter is required.
         */
        public Builder relationalDatabaseConfig(final imports.aws.appsync_datasource.AppsyncDatasourceRelationalDatabaseConfig relationalDatabaseConfig) {
            this.config.relationalDatabaseConfig(relationalDatabaseConfig);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#service_role_arn AppsyncDatasource#service_role_arn}.
         * <p>
         * @return {@code this}
         * @param serviceRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appsync_datasource#service_role_arn AppsyncDatasource#service_role_arn}. This parameter is required.
         */
        public Builder serviceRoleArn(final java.lang.String serviceRoleArn) {
            this.config.serviceRoleArn(serviceRoleArn);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.appsync_datasource.AppsyncDatasource}.
         */
        @Override
        public imports.aws.appsync_datasource.AppsyncDatasource build() {
            return new imports.aws.appsync_datasource.AppsyncDatasource(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
