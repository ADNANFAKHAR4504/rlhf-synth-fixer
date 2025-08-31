package imports.aws.quicksight_data_source;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.114Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSource.QuicksightDataSourceConfig")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSourceConfig.Jsii$Proxy.class)
public interface QuicksightDataSourceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#data_source_id QuicksightDataSource#data_source_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSourceId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#name QuicksightDataSource#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#parameters QuicksightDataSource#parameters}
     */
    @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_source.QuicksightDataSourceParameters getParameters();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#type QuicksightDataSource#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#aws_account_id QuicksightDataSource#aws_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountId() {
        return null;
    }

    /**
     * credentials block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#credentials QuicksightDataSource#credentials}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceCredentials getCredentials() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#id QuicksightDataSource#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * permission block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#permission QuicksightDataSource#permission}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPermission() {
        return null;
    }

    /**
     * ssl_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#ssl_properties QuicksightDataSource#ssl_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties getSslProperties() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags QuicksightDataSource#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags_all QuicksightDataSource#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * vpc_connection_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#vpc_connection_properties QuicksightDataSource#vpc_connection_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties getVpcConnectionProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSourceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSourceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSourceConfig> {
        java.lang.String dataSourceId;
        java.lang.String name;
        imports.aws.quicksight_data_source.QuicksightDataSourceParameters parameters;
        java.lang.String type;
        java.lang.String awsAccountId;
        imports.aws.quicksight_data_source.QuicksightDataSourceCredentials credentials;
        java.lang.String id;
        java.lang.Object permission;
        imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties sslProperties;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties vpcConnectionProperties;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getDataSourceId}
         * @param dataSourceId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#data_source_id QuicksightDataSource#data_source_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSourceId(java.lang.String dataSourceId) {
            this.dataSourceId = dataSourceId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#name QuicksightDataSource#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getParameters}
         * @param parameters parameters block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#parameters QuicksightDataSource#parameters}
         * @return {@code this}
         */
        public Builder parameters(imports.aws.quicksight_data_source.QuicksightDataSourceParameters parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#type QuicksightDataSource#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getAwsAccountId}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#aws_account_id QuicksightDataSource#aws_account_id}.
         * @return {@code this}
         */
        public Builder awsAccountId(java.lang.String awsAccountId) {
            this.awsAccountId = awsAccountId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getCredentials}
         * @param credentials credentials block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#credentials QuicksightDataSource#credentials}
         * @return {@code this}
         */
        public Builder credentials(imports.aws.quicksight_data_source.QuicksightDataSourceCredentials credentials) {
            this.credentials = credentials;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#id QuicksightDataSource#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getPermission}
         * @param permission permission block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#permission QuicksightDataSource#permission}
         * @return {@code this}
         */
        public Builder permission(com.hashicorp.cdktf.IResolvable permission) {
            this.permission = permission;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getPermission}
         * @param permission permission block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#permission QuicksightDataSource#permission}
         * @return {@code this}
         */
        public Builder permission(java.util.List<? extends imports.aws.quicksight_data_source.QuicksightDataSourcePermission> permission) {
            this.permission = permission;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getSslProperties}
         * @param sslProperties ssl_properties block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#ssl_properties QuicksightDataSource#ssl_properties}
         * @return {@code this}
         */
        public Builder sslProperties(imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties sslProperties) {
            this.sslProperties = sslProperties;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags QuicksightDataSource#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#tags_all QuicksightDataSource#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getVpcConnectionProperties}
         * @param vpcConnectionProperties vpc_connection_properties block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_source#vpc_connection_properties QuicksightDataSource#vpc_connection_properties}
         * @return {@code this}
         */
        public Builder vpcConnectionProperties(imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties vpcConnectionProperties) {
            this.vpcConnectionProperties = vpcConnectionProperties;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getDependsOn}
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
         * Sets the value of {@link QuicksightDataSourceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSourceConfig#getProvisioners}
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
         * @return a new instance of {@link QuicksightDataSourceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSourceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSourceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSourceConfig {
        private final java.lang.String dataSourceId;
        private final java.lang.String name;
        private final imports.aws.quicksight_data_source.QuicksightDataSourceParameters parameters;
        private final java.lang.String type;
        private final java.lang.String awsAccountId;
        private final imports.aws.quicksight_data_source.QuicksightDataSourceCredentials credentials;
        private final java.lang.String id;
        private final java.lang.Object permission;
        private final imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties sslProperties;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties vpcConnectionProperties;
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
            this.dataSourceId = software.amazon.jsii.Kernel.get(this, "dataSourceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceParameters.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsAccountId = software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.credentials = software.amazon.jsii.Kernel.get(this, "credentials", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceCredentials.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.permission = software.amazon.jsii.Kernel.get(this, "permission", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sslProperties = software.amazon.jsii.Kernel.get(this, "sslProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpcConnectionProperties = software.amazon.jsii.Kernel.get(this, "vpcConnectionProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties.class));
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
            this.dataSourceId = java.util.Objects.requireNonNull(builder.dataSourceId, "dataSourceId is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.parameters = java.util.Objects.requireNonNull(builder.parameters, "parameters is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.awsAccountId = builder.awsAccountId;
            this.credentials = builder.credentials;
            this.id = builder.id;
            this.permission = builder.permission;
            this.sslProperties = builder.sslProperties;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.vpcConnectionProperties = builder.vpcConnectionProperties;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDataSourceId() {
            return this.dataSourceId;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.quicksight_data_source.QuicksightDataSourceParameters getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.String getAwsAccountId() {
            return this.awsAccountId;
        }

        @Override
        public final imports.aws.quicksight_data_source.QuicksightDataSourceCredentials getCredentials() {
            return this.credentials;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getPermission() {
            return this.permission;
        }

        @Override
        public final imports.aws.quicksight_data_source.QuicksightDataSourceSslProperties getSslProperties() {
            return this.sslProperties;
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
        public final imports.aws.quicksight_data_source.QuicksightDataSourceVpcConnectionProperties getVpcConnectionProperties() {
            return this.vpcConnectionProperties;
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

            data.set("dataSourceId", om.valueToTree(this.getDataSourceId()));
            data.set("name", om.valueToTree(this.getName()));
            data.set("parameters", om.valueToTree(this.getParameters()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getAwsAccountId() != null) {
                data.set("awsAccountId", om.valueToTree(this.getAwsAccountId()));
            }
            if (this.getCredentials() != null) {
                data.set("credentials", om.valueToTree(this.getCredentials()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getPermission() != null) {
                data.set("permission", om.valueToTree(this.getPermission()));
            }
            if (this.getSslProperties() != null) {
                data.set("sslProperties", om.valueToTree(this.getSslProperties()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getVpcConnectionProperties() != null) {
                data.set("vpcConnectionProperties", om.valueToTree(this.getVpcConnectionProperties()));
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
            struct.set("fqn", om.valueToTree("aws.quicksightDataSource.QuicksightDataSourceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSourceConfig.Jsii$Proxy that = (QuicksightDataSourceConfig.Jsii$Proxy) o;

            if (!dataSourceId.equals(that.dataSourceId)) return false;
            if (!name.equals(that.name)) return false;
            if (!parameters.equals(that.parameters)) return false;
            if (!type.equals(that.type)) return false;
            if (this.awsAccountId != null ? !this.awsAccountId.equals(that.awsAccountId) : that.awsAccountId != null) return false;
            if (this.credentials != null ? !this.credentials.equals(that.credentials) : that.credentials != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.permission != null ? !this.permission.equals(that.permission) : that.permission != null) return false;
            if (this.sslProperties != null ? !this.sslProperties.equals(that.sslProperties) : that.sslProperties != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.vpcConnectionProperties != null ? !this.vpcConnectionProperties.equals(that.vpcConnectionProperties) : that.vpcConnectionProperties != null) return false;
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
            int result = this.dataSourceId.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.parameters.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.awsAccountId != null ? this.awsAccountId.hashCode() : 0);
            result = 31 * result + (this.credentials != null ? this.credentials.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.permission != null ? this.permission.hashCode() : 0);
            result = 31 * result + (this.sslProperties != null ? this.sslProperties.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.vpcConnectionProperties != null ? this.vpcConnectionProperties.hashCode() : 0);
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
