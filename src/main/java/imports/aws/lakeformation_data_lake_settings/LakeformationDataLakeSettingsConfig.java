package imports.aws.lakeformation_data_lake_settings;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.484Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lakeformationDataLakeSettings.LakeformationDataLakeSettingsConfig")
@software.amazon.jsii.Jsii.Proxy(LakeformationDataLakeSettingsConfig.Jsii$Proxy.class)
public interface LakeformationDataLakeSettingsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#admins LakeformationDataLakeSettings#admins}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAdmins() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_external_data_filtering LakeformationDataLakeSettings#allow_external_data_filtering}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowExternalDataFiltering() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_full_table_external_data_access LakeformationDataLakeSettings#allow_full_table_external_data_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAllowFullTableExternalDataAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#authorized_session_tag_value_list LakeformationDataLakeSettings#authorized_session_tag_value_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAuthorizedSessionTagValueList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#catalog_id LakeformationDataLakeSettings#catalog_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCatalogId() {
        return null;
    }

    /**
     * create_database_default_permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_database_default_permissions LakeformationDataLakeSettings#create_database_default_permissions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateDatabaseDefaultPermissions() {
        return null;
    }

    /**
     * create_table_default_permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_table_default_permissions LakeformationDataLakeSettings#create_table_default_permissions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getCreateTableDefaultPermissions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#external_data_filtering_allow_list LakeformationDataLakeSettings#external_data_filtering_allow_list}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getExternalDataFilteringAllowList() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#id LakeformationDataLakeSettings#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#parameters LakeformationDataLakeSettings#parameters}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getParameters() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#read_only_admins LakeformationDataLakeSettings#read_only_admins}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getReadOnlyAdmins() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#trusted_resource_owners LakeformationDataLakeSettings#trusted_resource_owners}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTrustedResourceOwners() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LakeformationDataLakeSettingsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LakeformationDataLakeSettingsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LakeformationDataLakeSettingsConfig> {
        java.util.List<java.lang.String> admins;
        java.lang.Object allowExternalDataFiltering;
        java.lang.Object allowFullTableExternalDataAccess;
        java.util.List<java.lang.String> authorizedSessionTagValueList;
        java.lang.String catalogId;
        java.lang.Object createDatabaseDefaultPermissions;
        java.lang.Object createTableDefaultPermissions;
        java.util.List<java.lang.String> externalDataFilteringAllowList;
        java.lang.String id;
        java.util.Map<java.lang.String, java.lang.String> parameters;
        java.util.List<java.lang.String> readOnlyAdmins;
        java.util.List<java.lang.String> trustedResourceOwners;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getAdmins}
         * @param admins Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#admins LakeformationDataLakeSettings#admins}.
         * @return {@code this}
         */
        public Builder admins(java.util.List<java.lang.String> admins) {
            this.admins = admins;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getAllowExternalDataFiltering}
         * @param allowExternalDataFiltering Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_external_data_filtering LakeformationDataLakeSettings#allow_external_data_filtering}.
         * @return {@code this}
         */
        public Builder allowExternalDataFiltering(java.lang.Boolean allowExternalDataFiltering) {
            this.allowExternalDataFiltering = allowExternalDataFiltering;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getAllowExternalDataFiltering}
         * @param allowExternalDataFiltering Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_external_data_filtering LakeformationDataLakeSettings#allow_external_data_filtering}.
         * @return {@code this}
         */
        public Builder allowExternalDataFiltering(com.hashicorp.cdktf.IResolvable allowExternalDataFiltering) {
            this.allowExternalDataFiltering = allowExternalDataFiltering;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getAllowFullTableExternalDataAccess}
         * @param allowFullTableExternalDataAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_full_table_external_data_access LakeformationDataLakeSettings#allow_full_table_external_data_access}.
         * @return {@code this}
         */
        public Builder allowFullTableExternalDataAccess(java.lang.Boolean allowFullTableExternalDataAccess) {
            this.allowFullTableExternalDataAccess = allowFullTableExternalDataAccess;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getAllowFullTableExternalDataAccess}
         * @param allowFullTableExternalDataAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#allow_full_table_external_data_access LakeformationDataLakeSettings#allow_full_table_external_data_access}.
         * @return {@code this}
         */
        public Builder allowFullTableExternalDataAccess(com.hashicorp.cdktf.IResolvable allowFullTableExternalDataAccess) {
            this.allowFullTableExternalDataAccess = allowFullTableExternalDataAccess;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getAuthorizedSessionTagValueList}
         * @param authorizedSessionTagValueList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#authorized_session_tag_value_list LakeformationDataLakeSettings#authorized_session_tag_value_list}.
         * @return {@code this}
         */
        public Builder authorizedSessionTagValueList(java.util.List<java.lang.String> authorizedSessionTagValueList) {
            this.authorizedSessionTagValueList = authorizedSessionTagValueList;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getCatalogId}
         * @param catalogId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#catalog_id LakeformationDataLakeSettings#catalog_id}.
         * @return {@code this}
         */
        public Builder catalogId(java.lang.String catalogId) {
            this.catalogId = catalogId;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getCreateDatabaseDefaultPermissions}
         * @param createDatabaseDefaultPermissions create_database_default_permissions block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_database_default_permissions LakeformationDataLakeSettings#create_database_default_permissions}
         * @return {@code this}
         */
        public Builder createDatabaseDefaultPermissions(com.hashicorp.cdktf.IResolvable createDatabaseDefaultPermissions) {
            this.createDatabaseDefaultPermissions = createDatabaseDefaultPermissions;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getCreateDatabaseDefaultPermissions}
         * @param createDatabaseDefaultPermissions create_database_default_permissions block.
         *                                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_database_default_permissions LakeformationDataLakeSettings#create_database_default_permissions}
         * @return {@code this}
         */
        public Builder createDatabaseDefaultPermissions(java.util.List<? extends imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateDatabaseDefaultPermissions> createDatabaseDefaultPermissions) {
            this.createDatabaseDefaultPermissions = createDatabaseDefaultPermissions;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getCreateTableDefaultPermissions}
         * @param createTableDefaultPermissions create_table_default_permissions block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_table_default_permissions LakeformationDataLakeSettings#create_table_default_permissions}
         * @return {@code this}
         */
        public Builder createTableDefaultPermissions(com.hashicorp.cdktf.IResolvable createTableDefaultPermissions) {
            this.createTableDefaultPermissions = createTableDefaultPermissions;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getCreateTableDefaultPermissions}
         * @param createTableDefaultPermissions create_table_default_permissions block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#create_table_default_permissions LakeformationDataLakeSettings#create_table_default_permissions}
         * @return {@code this}
         */
        public Builder createTableDefaultPermissions(java.util.List<? extends imports.aws.lakeformation_data_lake_settings.LakeformationDataLakeSettingsCreateTableDefaultPermissions> createTableDefaultPermissions) {
            this.createTableDefaultPermissions = createTableDefaultPermissions;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getExternalDataFilteringAllowList}
         * @param externalDataFilteringAllowList Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#external_data_filtering_allow_list LakeformationDataLakeSettings#external_data_filtering_allow_list}.
         * @return {@code this}
         */
        public Builder externalDataFilteringAllowList(java.util.List<java.lang.String> externalDataFilteringAllowList) {
            this.externalDataFilteringAllowList = externalDataFilteringAllowList;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#id LakeformationDataLakeSettings#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getParameters}
         * @param parameters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#parameters LakeformationDataLakeSettings#parameters}.
         * @return {@code this}
         */
        public Builder parameters(java.util.Map<java.lang.String, java.lang.String> parameters) {
            this.parameters = parameters;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getReadOnlyAdmins}
         * @param readOnlyAdmins Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#read_only_admins LakeformationDataLakeSettings#read_only_admins}.
         * @return {@code this}
         */
        public Builder readOnlyAdmins(java.util.List<java.lang.String> readOnlyAdmins) {
            this.readOnlyAdmins = readOnlyAdmins;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getTrustedResourceOwners}
         * @param trustedResourceOwners Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lakeformation_data_lake_settings#trusted_resource_owners LakeformationDataLakeSettings#trusted_resource_owners}.
         * @return {@code this}
         */
        public Builder trustedResourceOwners(java.util.List<java.lang.String> trustedResourceOwners) {
            this.trustedResourceOwners = trustedResourceOwners;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getDependsOn}
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
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LakeformationDataLakeSettingsConfig#getProvisioners}
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
         * @return a new instance of {@link LakeformationDataLakeSettingsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LakeformationDataLakeSettingsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LakeformationDataLakeSettingsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LakeformationDataLakeSettingsConfig {
        private final java.util.List<java.lang.String> admins;
        private final java.lang.Object allowExternalDataFiltering;
        private final java.lang.Object allowFullTableExternalDataAccess;
        private final java.util.List<java.lang.String> authorizedSessionTagValueList;
        private final java.lang.String catalogId;
        private final java.lang.Object createDatabaseDefaultPermissions;
        private final java.lang.Object createTableDefaultPermissions;
        private final java.util.List<java.lang.String> externalDataFilteringAllowList;
        private final java.lang.String id;
        private final java.util.Map<java.lang.String, java.lang.String> parameters;
        private final java.util.List<java.lang.String> readOnlyAdmins;
        private final java.util.List<java.lang.String> trustedResourceOwners;
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
            this.admins = software.amazon.jsii.Kernel.get(this, "admins", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.allowExternalDataFiltering = software.amazon.jsii.Kernel.get(this, "allowExternalDataFiltering", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowFullTableExternalDataAccess = software.amazon.jsii.Kernel.get(this, "allowFullTableExternalDataAccess", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.authorizedSessionTagValueList = software.amazon.jsii.Kernel.get(this, "authorizedSessionTagValueList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.catalogId = software.amazon.jsii.Kernel.get(this, "catalogId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.createDatabaseDefaultPermissions = software.amazon.jsii.Kernel.get(this, "createDatabaseDefaultPermissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.createTableDefaultPermissions = software.amazon.jsii.Kernel.get(this, "createTableDefaultPermissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.externalDataFilteringAllowList = software.amazon.jsii.Kernel.get(this, "externalDataFilteringAllowList", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.parameters = software.amazon.jsii.Kernel.get(this, "parameters", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.readOnlyAdmins = software.amazon.jsii.Kernel.get(this, "readOnlyAdmins", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.trustedResourceOwners = software.amazon.jsii.Kernel.get(this, "trustedResourceOwners", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.admins = builder.admins;
            this.allowExternalDataFiltering = builder.allowExternalDataFiltering;
            this.allowFullTableExternalDataAccess = builder.allowFullTableExternalDataAccess;
            this.authorizedSessionTagValueList = builder.authorizedSessionTagValueList;
            this.catalogId = builder.catalogId;
            this.createDatabaseDefaultPermissions = builder.createDatabaseDefaultPermissions;
            this.createTableDefaultPermissions = builder.createTableDefaultPermissions;
            this.externalDataFilteringAllowList = builder.externalDataFilteringAllowList;
            this.id = builder.id;
            this.parameters = builder.parameters;
            this.readOnlyAdmins = builder.readOnlyAdmins;
            this.trustedResourceOwners = builder.trustedResourceOwners;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getAdmins() {
            return this.admins;
        }

        @Override
        public final java.lang.Object getAllowExternalDataFiltering() {
            return this.allowExternalDataFiltering;
        }

        @Override
        public final java.lang.Object getAllowFullTableExternalDataAccess() {
            return this.allowFullTableExternalDataAccess;
        }

        @Override
        public final java.util.List<java.lang.String> getAuthorizedSessionTagValueList() {
            return this.authorizedSessionTagValueList;
        }

        @Override
        public final java.lang.String getCatalogId() {
            return this.catalogId;
        }

        @Override
        public final java.lang.Object getCreateDatabaseDefaultPermissions() {
            return this.createDatabaseDefaultPermissions;
        }

        @Override
        public final java.lang.Object getCreateTableDefaultPermissions() {
            return this.createTableDefaultPermissions;
        }

        @Override
        public final java.util.List<java.lang.String> getExternalDataFilteringAllowList() {
            return this.externalDataFilteringAllowList;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getParameters() {
            return this.parameters;
        }

        @Override
        public final java.util.List<java.lang.String> getReadOnlyAdmins() {
            return this.readOnlyAdmins;
        }

        @Override
        public final java.util.List<java.lang.String> getTrustedResourceOwners() {
            return this.trustedResourceOwners;
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

            if (this.getAdmins() != null) {
                data.set("admins", om.valueToTree(this.getAdmins()));
            }
            if (this.getAllowExternalDataFiltering() != null) {
                data.set("allowExternalDataFiltering", om.valueToTree(this.getAllowExternalDataFiltering()));
            }
            if (this.getAllowFullTableExternalDataAccess() != null) {
                data.set("allowFullTableExternalDataAccess", om.valueToTree(this.getAllowFullTableExternalDataAccess()));
            }
            if (this.getAuthorizedSessionTagValueList() != null) {
                data.set("authorizedSessionTagValueList", om.valueToTree(this.getAuthorizedSessionTagValueList()));
            }
            if (this.getCatalogId() != null) {
                data.set("catalogId", om.valueToTree(this.getCatalogId()));
            }
            if (this.getCreateDatabaseDefaultPermissions() != null) {
                data.set("createDatabaseDefaultPermissions", om.valueToTree(this.getCreateDatabaseDefaultPermissions()));
            }
            if (this.getCreateTableDefaultPermissions() != null) {
                data.set("createTableDefaultPermissions", om.valueToTree(this.getCreateTableDefaultPermissions()));
            }
            if (this.getExternalDataFilteringAllowList() != null) {
                data.set("externalDataFilteringAllowList", om.valueToTree(this.getExternalDataFilteringAllowList()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getParameters() != null) {
                data.set("parameters", om.valueToTree(this.getParameters()));
            }
            if (this.getReadOnlyAdmins() != null) {
                data.set("readOnlyAdmins", om.valueToTree(this.getReadOnlyAdmins()));
            }
            if (this.getTrustedResourceOwners() != null) {
                data.set("trustedResourceOwners", om.valueToTree(this.getTrustedResourceOwners()));
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
            struct.set("fqn", om.valueToTree("aws.lakeformationDataLakeSettings.LakeformationDataLakeSettingsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LakeformationDataLakeSettingsConfig.Jsii$Proxy that = (LakeformationDataLakeSettingsConfig.Jsii$Proxy) o;

            if (this.admins != null ? !this.admins.equals(that.admins) : that.admins != null) return false;
            if (this.allowExternalDataFiltering != null ? !this.allowExternalDataFiltering.equals(that.allowExternalDataFiltering) : that.allowExternalDataFiltering != null) return false;
            if (this.allowFullTableExternalDataAccess != null ? !this.allowFullTableExternalDataAccess.equals(that.allowFullTableExternalDataAccess) : that.allowFullTableExternalDataAccess != null) return false;
            if (this.authorizedSessionTagValueList != null ? !this.authorizedSessionTagValueList.equals(that.authorizedSessionTagValueList) : that.authorizedSessionTagValueList != null) return false;
            if (this.catalogId != null ? !this.catalogId.equals(that.catalogId) : that.catalogId != null) return false;
            if (this.createDatabaseDefaultPermissions != null ? !this.createDatabaseDefaultPermissions.equals(that.createDatabaseDefaultPermissions) : that.createDatabaseDefaultPermissions != null) return false;
            if (this.createTableDefaultPermissions != null ? !this.createTableDefaultPermissions.equals(that.createTableDefaultPermissions) : that.createTableDefaultPermissions != null) return false;
            if (this.externalDataFilteringAllowList != null ? !this.externalDataFilteringAllowList.equals(that.externalDataFilteringAllowList) : that.externalDataFilteringAllowList != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.parameters != null ? !this.parameters.equals(that.parameters) : that.parameters != null) return false;
            if (this.readOnlyAdmins != null ? !this.readOnlyAdmins.equals(that.readOnlyAdmins) : that.readOnlyAdmins != null) return false;
            if (this.trustedResourceOwners != null ? !this.trustedResourceOwners.equals(that.trustedResourceOwners) : that.trustedResourceOwners != null) return false;
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
            int result = this.admins != null ? this.admins.hashCode() : 0;
            result = 31 * result + (this.allowExternalDataFiltering != null ? this.allowExternalDataFiltering.hashCode() : 0);
            result = 31 * result + (this.allowFullTableExternalDataAccess != null ? this.allowFullTableExternalDataAccess.hashCode() : 0);
            result = 31 * result + (this.authorizedSessionTagValueList != null ? this.authorizedSessionTagValueList.hashCode() : 0);
            result = 31 * result + (this.catalogId != null ? this.catalogId.hashCode() : 0);
            result = 31 * result + (this.createDatabaseDefaultPermissions != null ? this.createDatabaseDefaultPermissions.hashCode() : 0);
            result = 31 * result + (this.createTableDefaultPermissions != null ? this.createTableDefaultPermissions.hashCode() : 0);
            result = 31 * result + (this.externalDataFilteringAllowList != null ? this.externalDataFilteringAllowList.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.parameters != null ? this.parameters.hashCode() : 0);
            result = 31 * result + (this.readOnlyAdmins != null ? this.readOnlyAdmins.hashCode() : 0);
            result = 31 * result + (this.trustedResourceOwners != null ? this.trustedResourceOwners.hashCode() : 0);
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
