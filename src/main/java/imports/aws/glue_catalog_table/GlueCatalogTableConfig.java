package imports.aws.glue_catalog_table;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.279Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.glueCatalogTable.GlueCatalogTableConfig")
@software.amazon.jsii.Jsii.Proxy(GlueCatalogTableConfig.Jsii$Proxy.class)
public interface GlueCatalogTableConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#database_name GlueCatalogTable#database_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDatabaseName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#name GlueCatalogTable#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#catalog_id GlueCatalogTable#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#description GlueCatalogTable#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#id GlueCatalogTable#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * open_table_format_input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#open_table_format_input GlueCatalogTable#open_table_format_input}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput getOpenTableFormatInput() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#owner GlueCatalogTable#owner}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOwner() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#parameters GlueCatalogTable#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * partition_index block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#partition_index GlueCatalogTable#partition_index}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPartitionIndex() {
        return null;
    }

    /**
     * partition_keys block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#partition_keys GlueCatalogTable#partition_keys}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPartitionKeys() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#retention GlueCatalogTable#retention}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getRetention() {
        return null;
    }

    /**
     * storage_descriptor block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#storage_descriptor GlueCatalogTable#storage_descriptor}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor getStorageDescriptor() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#table_type GlueCatalogTable#table_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTableType() {
        return null;
    }

    /**
     * target_table block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#target_table GlueCatalogTable#target_table}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.glue_catalog_table.GlueCatalogTableTargetTable getTargetTable() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#view_expanded_text GlueCatalogTable#view_expanded_text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getViewExpandedText() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#view_original_text GlueCatalogTable#view_original_text}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getViewOriginalText() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlueCatalogTableConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlueCatalogTableConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlueCatalogTableConfig> {
        java.lang.String databaseName;
        java.lang.String name;
        java.lang.String catalogId;
        java.lang.String description;
        java.lang.String id;
        imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput openTableFormatInput;
        java.lang.String owner;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.lang.Object partitionIndex;
        java.lang.Object partitionKeys;
        java.lang.Number retention;
        imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor storageDescriptor;
        java.lang.String tableType;
        imports.aws.glue_catalog_table.GlueCatalogTableTargetTable targetTable;
        java.lang.String viewExpandedText;
        java.lang.String viewOriginalText;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getDatabaseName}
         * @param databaseName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#database_name GlueCatalogTable#database_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder databaseName(java.lang.String databaseName) {
            this.databaseName = databaseName;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#name GlueCatalogTable#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#catalog_id GlueCatalogTable#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#description GlueCatalogTable#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#id GlueCatalogTable#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getOpenTableFormatInput}
         * @param openTableFormatInput open_table_format_input block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#open_table_format_input GlueCatalogTable#open_table_format_input}
         * @return {@code this}
         */
        public Builder openTableFormatInput(imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput openTableFormatInput) {
            this.openTableFormatInput = openTableFormatInput;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getOwner}
         * @param owner Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#owner GlueCatalogTable#owner}.
         * @return {@code this}
         */
        public Builder owner(java.lang.String owner) {
            this.owner = owner;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#parameters GlueCatalogTable#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getPartitionIndex}
         * @param partitionIndex partition_index block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#partition_index GlueCatalogTable#partition_index}
         * @return {@code this}
         */
        public Builder partitionIndex(com.hashicorp.cdktf.IResolvable partitionIndex) {
            this.partitionIndex = partitionIndex;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getPartitionIndex}
         * @param partitionIndex partition_index block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#partition_index GlueCatalogTable#partition_index}
         * @return {@code this}
         */
        public Builder partitionIndex(java.util.List<? extends imports.aws.glue_catalog_table.GlueCatalogTablePartitionIndex> partitionIndex) {
            this.partitionIndex = partitionIndex;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getPartitionKeys}
         * @param partitionKeys partition_keys block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#partition_keys GlueCatalogTable#partition_keys}
         * @return {@code this}
         */
        public Builder partitionKeys(com.hashicorp.cdktf.IResolvable partitionKeys) {
            this.partitionKeys = partitionKeys;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getPartitionKeys}
         * @param partitionKeys partition_keys block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#partition_keys GlueCatalogTable#partition_keys}
         * @return {@code this}
         */
        public Builder partitionKeys(java.util.List<? extends imports.aws.glue_catalog_table.GlueCatalogTablePartitionKeys> partitionKeys) {
            this.partitionKeys = partitionKeys;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getRetention}
         * @param retention Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#retention GlueCatalogTable#retention}.
         * @return {@code this}
         */
        public Builder retention(java.lang.Number retention) {
            this.retention = retention;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getStorageDescriptor}
         * @param storageDescriptor storage_descriptor block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#storage_descriptor GlueCatalogTable#storage_descriptor}
         * @return {@code this}
         */
        public Builder storageDescriptor(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor storageDescriptor) {
            this.storageDescriptor = storageDescriptor;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getTableType}
         * @param tableType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#table_type GlueCatalogTable#table_type}.
         * @return {@code this}
         */
        public Builder tableType(java.lang.String tableType) {
            this.tableType = tableType;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getTargetTable}
         * @param targetTable target_table block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#target_table GlueCatalogTable#target_table}
         * @return {@code this}
         */
        public Builder targetTable(imports.aws.glue_catalog_table.GlueCatalogTableTargetTable targetTable) {
            this.targetTable = targetTable;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getViewExpandedText}
         * @param viewExpandedText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#view_expanded_text GlueCatalogTable#view_expanded_text}.
         * @return {@code this}
         */
        public Builder viewExpandedText(java.lang.String viewExpandedText) {
            this.viewExpandedText = viewExpandedText;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getViewOriginalText}
         * @param viewOriginalText Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/glue_catalog_table#view_original_text GlueCatalogTable#view_original_text}.
         * @return {@code this}
         */
        public Builder viewOriginalText(java.lang.String viewOriginalText) {
            this.viewOriginalText = viewOriginalText;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getDependsOn}
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
         * Sets the value of {@link GlueCatalogTableConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlueCatalogTableConfig#getProvisioners}
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
         * @return a new instance of {@link GlueCatalogTableConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlueCatalogTableConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlueCatalogTableConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlueCatalogTableConfig {
        private final java.lang.String databaseName;
        private final java.lang.String name;
        private final java.lang.String catalogId;
        private final java.lang.String description;
        private final java.lang.String id;
        private final imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput openTableFormatInput;
        private final java.lang.String owner;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.lang.Object partitionIndex;
        private final java.lang.Object partitionKeys;
        private final java.lang.Number retention;
        private final imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor storageDescriptor;
        private final java.lang.String tableType;
        private final imports.aws.glue_catalog_table.GlueCatalogTableTargetTable targetTable;
        private final java.lang.String viewExpandedText;
        private final java.lang.String viewOriginalText;
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
            this.databaseName = software.amazon.jsii.Kernel.get(this, "databaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.openTableFormatInput = software.amazon.jsii.Kernel.get(this, "openTableFormatInput", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput.class));
            this.owner = software.amazon.jsii.Kernel.get(this, "owner", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.partitionIndex = software.amazon.jsii.Kernel.get(this, "partitionIndex", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.partitionKeys = software.amazon.jsii.Kernel.get(this, "partitionKeys", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.retention = software.amazon.jsii.Kernel.get(this, "retention", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.storageDescriptor = software.amazon.jsii.Kernel.get(this, "storageDescriptor", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor.class));
            this.tableType = software.amazon.jsii.Kernel.get(this, "tableType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.targetTable = software.amazon.jsii.Kernel.get(this, "targetTable", software.amazon.jsii.NativeType.forClass(imports.aws.glue_catalog_table.GlueCatalogTableTargetTable.class));
            this.viewExpandedText = software.amazon.jsii.Kernel.get(this, "viewExpandedText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.viewOriginalText = software.amazon.jsii.Kernel.get(this, "viewOriginalText", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.databaseName = java.util.Objects.requireNonNull(builder.databaseName, "databaseName is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.catalogId = builder.catalogId;
            this.description = builder.description;
            this.id = builder.id;
            this.openTableFormatInput = builder.openTableFormatInput;
            this.owner = builder.owner;
            this.parameters = builder.parameters;
            this.partitionIndex = builder.partitionIndex;
            this.partitionKeys = builder.partitionKeys;
            this.retention = builder.retention;
            this.storageDescriptor = builder.storageDescriptor;
            this.tableType = builder.tableType;
            this.targetTable = builder.targetTable;
            this.viewExpandedText = builder.viewExpandedText;
            this.viewOriginalText = builder.viewOriginalText;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDatabaseName() {
            return this.databaseName;
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
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.glue_catalog_table.GlueCatalogTableOpenTableFormatInput getOpenTableFormatInput() {
            return this.openTableFormatInput;
        }

        @Override
        public final java.lang.String getOwner() {
            return this.owner;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.lang.Object getPartitionIndex() {
            return this.partitionIndex;
        }

        @Override
        public final java.lang.Object getPartitionKeys() {
            return this.partitionKeys;
        }

        @Override
        public final java.lang.Number getRetention() {
            return this.retention;
        }

        @Override
        public final imports.aws.glue_catalog_table.GlueCatalogTableStorageDescriptor getStorageDescriptor() {
            return this.storageDescriptor;
        }

        @Override
        public final java.lang.String getTableType() {
            return this.tableType;
        }

        @Override
        public final imports.aws.glue_catalog_table.GlueCatalogTableTargetTable getTargetTable() {
            return this.targetTable;
        }

        @Override
        public final java.lang.String getViewExpandedText() {
            return this.viewExpandedText;
        }

        @Override
        public final java.lang.String getViewOriginalText() {
            return this.viewOriginalText;
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

            data.set("databaseName", om.valueToTree(this.getDatabaseName()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getOpenTableFormatInput() != null) {
                data.set("openTableFormatInput", om.valueToTree(this.getOpenTableFormatInput()));
            }
            if (this.getOwner() != null) {
                data.set("owner", om.valueToTree(this.getOwner()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getPartitionIndex() != null) {
                data.set("partitionIndex", om.valueToTree(this.getPartitionIndex()));
            }
            if (this.getPartitionKeys() != null) {
                data.set("partitionKeys", om.valueToTree(this.getPartitionKeys()));
            }
            if (this.getRetention() != null) {
                data.set("retention", om.valueToTree(this.getRetention()));
            }
            if (this.getStorageDescriptor() != null) {
                data.set("storageDescriptor", om.valueToTree(this.getStorageDescriptor()));
            }
            if (this.getTableType() != null) {
                data.set("tableType", om.valueToTree(this.getTableType()));
            }
            if (this.getTargetTable() != null) {
                data.set("targetTable", om.valueToTree(this.getTargetTable()));
            }
            if (this.getViewExpandedText() != null) {
                data.set("viewExpandedText", om.valueToTree(this.getViewExpandedText()));
            }
            if (this.getViewOriginalText() != null) {
                data.set("viewOriginalText", om.valueToTree(this.getViewOriginalText()));
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
            struct.set("fqn", om.valueToTree("aws.glueCatalogTable.GlueCatalogTableConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlueCatalogTableConfig.Jsii$Proxy that = (GlueCatalogTableConfig.Jsii$Proxy) o;

            if (!databaseName.equals(that.databaseName)) return false;
            if (!name.equals(that.name)) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.openTableFormatInput != null ? !this.openTableFormatInput.equals(that.openTableFormatInput) : that.openTableFormatInput != null) return false;
            if (this.owner != null ? !this.owner.equals(that.owner) : that.owner != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.partitionIndex != null ? !this.partitionIndex.equals(that.partitionIndex) : that.partitionIndex != null) return false;
            if (this.partitionKeys != null ? !this.partitionKeys.equals(that.partitionKeys) : that.partitionKeys != null) return false;
            if (this.retention != null ? !this.retention.equals(that.retention) : that.retention != null) return false;
            if (this.storageDescriptor != null ? !this.storageDescriptor.equals(that.storageDescriptor) : that.storageDescriptor != null) return false;
            if (this.tableType != null ? !this.tableType.equals(that.tableType) : that.tableType != null) return false;
            if (this.targetTable != null ? !this.targetTable.equals(that.targetTable) : that.targetTable != null) return false;
            if (this.viewExpandedText != null ? !this.viewExpandedText.equals(that.viewExpandedText) : that.viewExpandedText != null) return false;
            if (this.viewOriginalText != null ? !this.viewOriginalText.equals(that.viewOriginalText) : that.viewOriginalText != null) return false;
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
            int result = this.databaseName.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.openTableFormatInput != null ? this.openTableFormatInput.hashCode() : 0);
            result = 31 * result + (this.owner != null ? this.owner.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.partitionIndex != null ? this.partitionIndex.hashCode() : 0);
            result = 31 * result + (this.partitionKeys != null ? this.partitionKeys.hashCode() : 0);
            result = 31 * result + (this.retention != null ? this.retention.hashCode() : 0);
            result = 31 * result + (this.storageDescriptor != null ? this.storageDescriptor.hashCode() : 0);
            result = 31 * result + (this.tableType != null ? this.tableType.hashCode() : 0);
            result = 31 * result + (this.targetTable != null ? this.targetTable.hashCode() : 0);
            result = 31 * result + (this.viewExpandedText != null ? this.viewExpandedText.hashCode() : 0);
            result = 31 * result + (this.viewOriginalText != null ? this.viewOriginalText.hashCode() : 0);
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
