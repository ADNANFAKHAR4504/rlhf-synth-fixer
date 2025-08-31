package imports.aws.glue_catalog_database;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.278Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogDatabase.GlueCatalogDatabaseConfig")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogDatabaseConfig.Jsii$Proxy.class)
public interface GlueCatalogDatabaseConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#name GlueCatalogDatabase#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#catalog_id GlueCatalogDatabase#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * create_table_default_permission block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#create_table_default_permission GlueCatalogDatabase#create_table_default_permission}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateTableDefaultPermission() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#description GlueCatalogDatabase#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * federated_database block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#federated_database GlueCatalogDatabase#federated_database}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase getFederatedDatabase() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#id GlueCatalogDatabase#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#location_uri GlueCatalogDatabase#location_uri}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocationUri() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#parameters GlueCatalogDatabase#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#tags GlueCatalogDatabase#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#tags_all GlueCatalogDatabase#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * target_database block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#target_database GlueCatalogDatabase#target_database}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_database.GlueCatalogDatabaseTargetDatabase getTargetDatabase() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogDatabaseConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogDatabaseConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogDatabaseConfig> {
        java.lang.String name;
        java.lang.String catalogId;
        java.lang.Object createTableDefaultPermission;
        java.lang.String description;
        imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase federatedDatabase;
        java.lang.String id;
        java.lang.String locationUri;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.glue_catalog_database.GlueCatalogDatabaseTargetDatabase targetDatabase;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#name GlueCatalogDatabase#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#catalog_id GlueCatalogDatabase#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getCreateTableDefaultPermission}
         * @param createTableDefaultPermission create_table_default_permission block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#create_table_default_permission GlueCatalogDatabase#create_table_default_permission}
         * @return {@code this}
         */
        public Builder createTableDefaultPermission(com.hashicorp.cdktf.IResolvable createTableDefaultPermission) {
            this.createTableDefaultPermission = createTableDefaultPermission;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getCreateTableDefaultPermission}
         * @param createTableDefaultPermission create_table_default_permission block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#create_table_default_permission GlueCatalogDatabase#create_table_default_permission}
         * @return {@code this}
         */
        public Builder createTableDefaultPermission(java.util.List<? extends imports.aws.glue_catalog_database.GlueCatalogDatabaseCreateTableDefaultPermission> createTableDefaultPermission) {
            this.createTableDefaultPermission = createTableDefaultPermission;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#description GlueCatalogDatabase#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getFederatedDatabase}
         * @param federatedDatabase federated_database block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#federated_database GlueCatalogDatabase#federated_database}
         * @return {@code this}
         */
        public Builder federatedDatabase(imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase federatedDatabase) {
            this.federatedDatabase = federatedDatabase;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#id GlueCatalogDatabase#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getLocationUri}
         * @param locationUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#location_uri GlueCatalogDatabase#location_uri}.
         * @return {@code this}
         */
        public Builder locationUri(java.lang.String locationUri) {
            this.locationUri = locationUri;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#parameters GlueCatalogDatabase#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#tags GlueCatalogDatabase#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#tags_all GlueCatalogDatabase#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getTargetDatabase}
         * @param targetDatabase target_database block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_database#target_database GlueCatalogDatabase#target_database}
         * @return {@code this}
         */
        public Builder targetDatabase(imports.aws.glue_catalog_database.GlueCatalogDatabaseTargetDatabase targetDatabase) {
            this.targetDatabase = targetDatabase;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getDependsOn}
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
         * Sets the value of {@link GlueCatalogDatabaseConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogDatabaseConfig#getProvisioners}
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
         * @return a new instance of {@link GlueCatalogDatabaseConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogDatabaseConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogDatabaseConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogDatabaseConfig {
        private final java.lang.String name;
        private final java.lang.String catalogId;
        private final java.lang.Object createTableDefaultPermission;
        private final java.lang.String description;
        private final imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase federatedDatabase;
        private final java.lang.String id;
        private final java.lang.String locationUri;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.glue_catalog_database.GlueCatalogDatabaseTargetDatabase targetDatabase;
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
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.createTableDefaultPermission = software.amazon.jsii.Kernel.get(this, "createTableDefaultPermission", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.federatedDatabase = software.amazon.jsii.Kernel.get(this, "federatedDatabase", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.locationUri = software.amazon.jsii.Kernel.get(this, "locationUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.targetDatabase = software.amazon.jsii.Kernel.get(this, "targetDatabase", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_database.GlueCatalogDatabaseTargetDatabase.class));
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
            this.catalogId = builder.catalogId;
            this.createTableDefaultPermission = builder.createTableDefaultPermission;
            this.description = builder.description;
            this.federatedDatabase = builder.federatedDatabase;
            this.id = builder.id;
            this.locationUri = builder.locationUri;
            this.parameters = builder.parameters;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.targetDatabase = builder.targetDatabase;
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
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        public final java.lang.Object getCreateTableDefaultPermission() {
            return this.createTableDefaultPermission;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final imports.aws.glue_catalog_database.GlueCatalogDatabaseFederatedDatabase getFederatedDatabase() {
            return this.federatedDatabase;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLocationUri() {
            return this.locationUri;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
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
        public final imports.aws.glue_catalog_database.GlueCatalogDatabaseTargetDatabase getTargetDatabase() {
            return this.targetDatabase;
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
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }
            if (this.getCreateTableDefaultPermission() != null) {
                data.set("createTableDefaultPermission", om.valueToTree(this.getCreateTableDefaultPermission()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getFederatedDatabase() != null) {
                data.set("federatedDatabase", om.valueToTree(this.getFederatedDatabase()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLocationUri() != null) {
                data.set("locationUri", om.valueToTree(this.getLocationUri()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTargetDatabase() != null) {
                data.set("targetDatabase", om.valueToTree(this.getTargetDatabase()));
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
            struct.set("fqn", om.valueToTree("aws.glueCatalogDatabase.GlueCatalogDatabaseConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogDatabaseConfig.Jsii$Proxy that = (GlueCatalogDatabaseConfig.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.createTableDefaultPermission != null ? !this.createTableDefaultPermission.equals(that.createTableDefaultPermission) : that.createTableDefaultPermission != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.federatedDatabase != null ? !this.federatedDatabase.equals(that.federatedDatabase) : that.federatedDatabase != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.locationUri != null ? !this.locationUri.equals(that.locationUri) : that.locationUri != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.targetDatabase != null ? !this.targetDatabase.equals(that.targetDatabase) : that.targetDatabase != null) return false;
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
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.createTableDefaultPermission != null ? this.createTableDefaultPermission.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.federatedDatabase != null ? this.federatedDatabase.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.locationUri != null ? this.locationUri.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.targetDatabase != null ? this.targetDatabase.hashCode() : 0);
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
