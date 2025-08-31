package imports.aws.quicksight_data_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.106Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSetConfig")
@software.amazon.jsii.Jsii.Proxy(QuicksightDataSetConfig.Jsii$Proxy.class)
public interface QuicksightDataSetConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_id QuicksightDataSet#data_set_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getDataSetId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import_mode QuicksightDataSet#import_mode}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImportMode();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#aws_account_id QuicksightDataSet#aws_account_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountId() {
        return null;
    }

    /**
     * column_groups block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getColumnGroups() {
        return null;
    }

    /**
     * column_level_permission_rules block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getColumnLevelPermissionRules() {
        return null;
    }

    /**
     * data_set_usage_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_usage_configuration QuicksightDataSet#data_set_usage_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration getDataSetUsageConfiguration() {
        return null;
    }

    /**
     * field_folders block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getFieldFolders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#id QuicksightDataSet#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * logical_table_map block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getLogicalTableMap() {
        return null;
    }

    /**
     * permissions block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPermissions() {
        return null;
    }

    /**
     * physical_table_map block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPhysicalTableMap() {
        return null;
    }

    /**
     * refresh_properties block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_properties QuicksightDataSet#refresh_properties}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties getRefreshProperties() {
        return null;
    }

    /**
     * row_level_permission_data_set block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_data_set QuicksightDataSet#row_level_permission_data_set}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet getRowLevelPermissionDataSet() {
        return null;
    }

    /**
     * row_level_permission_tag_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_tag_configuration QuicksightDataSet#row_level_permission_tag_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration getRowLevelPermissionTagConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags_all QuicksightDataSet#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link QuicksightDataSetConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link QuicksightDataSetConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<QuicksightDataSetConfig> {
        java.lang.String dataSetId;
        java.lang.String importMode;
        java.lang.String name;
        java.lang.String awsAccountId;
        java.lang.Object columnGroups;
        java.lang.Object columnLevelPermissionRules;
        imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration dataSetUsageConfiguration;
        java.lang.Object fieldFolders;
        java.lang.String id;
        java.lang.Object logicalTableMap;
        java.lang.Object permissions;
        java.lang.Object physicalTableMap;
        imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties refreshProperties;
        imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet rowLevelPermissionDataSet;
        imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration rowLevelPermissionTagConfiguration;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getDataSetId}
         * @param dataSetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_id QuicksightDataSet#data_set_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder dataSetId(java.lang.String dataSetId) {
            this.dataSetId = dataSetId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getImportMode}
         * @param importMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import_mode QuicksightDataSet#import_mode}. This parameter is required.
         * @return {@code this}
         */
        public Builder importMode(java.lang.String importMode) {
            this.importMode = importMode;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getAwsAccountId}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#aws_account_id QuicksightDataSet#aws_account_id}.
         * @return {@code this}
         */
        public Builder awsAccountId(java.lang.String awsAccountId) {
            this.awsAccountId = awsAccountId;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getColumnGroups}
         * @param columnGroups column_groups block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
         * @return {@code this}
         */
        public Builder columnGroups(com.hashicorp.cdktf.IResolvable columnGroups) {
            this.columnGroups = columnGroups;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getColumnGroups}
         * @param columnGroups column_groups block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
         * @return {@code this}
         */
        public Builder columnGroups(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetColumnGroups> columnGroups) {
            this.columnGroups = columnGroups;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getColumnLevelPermissionRules}
         * @param columnLevelPermissionRules column_level_permission_rules block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
         * @return {@code this}
         */
        public Builder columnLevelPermissionRules(com.hashicorp.cdktf.IResolvable columnLevelPermissionRules) {
            this.columnLevelPermissionRules = columnLevelPermissionRules;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getColumnLevelPermissionRules}
         * @param columnLevelPermissionRules column_level_permission_rules block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
         * @return {@code this}
         */
        public Builder columnLevelPermissionRules(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRules> columnLevelPermissionRules) {
            this.columnLevelPermissionRules = columnLevelPermissionRules;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getDataSetUsageConfiguration}
         * @param dataSetUsageConfiguration data_set_usage_configuration block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_usage_configuration QuicksightDataSet#data_set_usage_configuration}
         * @return {@code this}
         */
        public Builder dataSetUsageConfiguration(imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration dataSetUsageConfiguration) {
            this.dataSetUsageConfiguration = dataSetUsageConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getFieldFolders}
         * @param fieldFolders field_folders block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
         * @return {@code this}
         */
        public Builder fieldFolders(com.hashicorp.cdktf.IResolvable fieldFolders) {
            this.fieldFolders = fieldFolders;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getFieldFolders}
         * @param fieldFolders field_folders block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
         * @return {@code this}
         */
        public Builder fieldFolders(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetFieldFolders> fieldFolders) {
            this.fieldFolders = fieldFolders;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#id QuicksightDataSet#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getLogicalTableMap}
         * @param logicalTableMap logical_table_map block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
         * @return {@code this}
         */
        public Builder logicalTableMap(com.hashicorp.cdktf.IResolvable logicalTableMap) {
            this.logicalTableMap = logicalTableMap;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getLogicalTableMap}
         * @param logicalTableMap logical_table_map block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
         * @return {@code this}
         */
        public Builder logicalTableMap(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMap> logicalTableMap) {
            this.logicalTableMap = logicalTableMap;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getPermissions}
         * @param permissions permissions block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
         * @return {@code this}
         */
        public Builder permissions(com.hashicorp.cdktf.IResolvable permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getPermissions}
         * @param permissions permissions block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
         * @return {@code this}
         */
        public Builder permissions(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetPermissions> permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getPhysicalTableMap}
         * @param physicalTableMap physical_table_map block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
         * @return {@code this}
         */
        public Builder physicalTableMap(com.hashicorp.cdktf.IResolvable physicalTableMap) {
            this.physicalTableMap = physicalTableMap;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getPhysicalTableMap}
         * @param physicalTableMap physical_table_map block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
         * @return {@code this}
         */
        public Builder physicalTableMap(java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMap> physicalTableMap) {
            this.physicalTableMap = physicalTableMap;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getRefreshProperties}
         * @param refreshProperties refresh_properties block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_properties QuicksightDataSet#refresh_properties}
         * @return {@code this}
         */
        public Builder refreshProperties(imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties refreshProperties) {
            this.refreshProperties = refreshProperties;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getRowLevelPermissionDataSet}
         * @param rowLevelPermissionDataSet row_level_permission_data_set block.
         *                                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_data_set QuicksightDataSet#row_level_permission_data_set}
         * @return {@code this}
         */
        public Builder rowLevelPermissionDataSet(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet rowLevelPermissionDataSet) {
            this.rowLevelPermissionDataSet = rowLevelPermissionDataSet;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getRowLevelPermissionTagConfiguration}
         * @param rowLevelPermissionTagConfiguration row_level_permission_tag_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_tag_configuration QuicksightDataSet#row_level_permission_tag_configuration}
         * @return {@code this}
         */
        public Builder rowLevelPermissionTagConfiguration(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration rowLevelPermissionTagConfiguration) {
            this.rowLevelPermissionTagConfiguration = rowLevelPermissionTagConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags_all QuicksightDataSet#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getDependsOn}
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
         * Sets the value of {@link QuicksightDataSetConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link QuicksightDataSetConfig#getProvisioners}
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
         * @return a new instance of {@link QuicksightDataSetConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public QuicksightDataSetConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link QuicksightDataSetConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements QuicksightDataSetConfig {
        private final java.lang.String dataSetId;
        private final java.lang.String importMode;
        private final java.lang.String name;
        private final java.lang.String awsAccountId;
        private final java.lang.Object columnGroups;
        private final java.lang.Object columnLevelPermissionRules;
        private final imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration dataSetUsageConfiguration;
        private final java.lang.Object fieldFolders;
        private final java.lang.String id;
        private final java.lang.Object logicalTableMap;
        private final java.lang.Object permissions;
        private final java.lang.Object physicalTableMap;
        private final imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties refreshProperties;
        private final imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet rowLevelPermissionDataSet;
        private final imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration rowLevelPermissionTagConfiguration;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.dataSetId = software.amazon.jsii.Kernel.get(this, "dataSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.importMode = software.amazon.jsii.Kernel.get(this, "importMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.awsAccountId = software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.columnGroups = software.amazon.jsii.Kernel.get(this, "columnGroups", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.columnLevelPermissionRules = software.amazon.jsii.Kernel.get(this, "columnLevelPermissionRules", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dataSetUsageConfiguration = software.amazon.jsii.Kernel.get(this, "dataSetUsageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration.class));
            this.fieldFolders = software.amazon.jsii.Kernel.get(this, "fieldFolders", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logicalTableMap = software.amazon.jsii.Kernel.get(this, "logicalTableMap", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.permissions = software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.physicalTableMap = software.amazon.jsii.Kernel.get(this, "physicalTableMap", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.refreshProperties = software.amazon.jsii.Kernel.get(this, "refreshProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties.class));
            this.rowLevelPermissionDataSet = software.amazon.jsii.Kernel.get(this, "rowLevelPermissionDataSet", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet.class));
            this.rowLevelPermissionTagConfiguration = software.amazon.jsii.Kernel.get(this, "rowLevelPermissionTagConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.dataSetId = java.util.Objects.requireNonNull(builder.dataSetId, "dataSetId is required");
            this.importMode = java.util.Objects.requireNonNull(builder.importMode, "importMode is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.awsAccountId = builder.awsAccountId;
            this.columnGroups = builder.columnGroups;
            this.columnLevelPermissionRules = builder.columnLevelPermissionRules;
            this.dataSetUsageConfiguration = builder.dataSetUsageConfiguration;
            this.fieldFolders = builder.fieldFolders;
            this.id = builder.id;
            this.logicalTableMap = builder.logicalTableMap;
            this.permissions = builder.permissions;
            this.physicalTableMap = builder.physicalTableMap;
            this.refreshProperties = builder.refreshProperties;
            this.rowLevelPermissionDataSet = builder.rowLevelPermissionDataSet;
            this.rowLevelPermissionTagConfiguration = builder.rowLevelPermissionTagConfiguration;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDataSetId() {
            return this.dataSetId;
        }

        @Override
        public final java.lang.String getImportMode() {
            return this.importMode;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getAwsAccountId() {
            return this.awsAccountId;
        }

        @Override
        public final java.lang.Object getColumnGroups() {
            return this.columnGroups;
        }

        @Override
        public final java.lang.Object getColumnLevelPermissionRules() {
            return this.columnLevelPermissionRules;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration getDataSetUsageConfiguration() {
            return this.dataSetUsageConfiguration;
        }

        @Override
        public final java.lang.Object getFieldFolders() {
            return this.fieldFolders;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Object getLogicalTableMap() {
            return this.logicalTableMap;
        }

        @Override
        public final java.lang.Object getPermissions() {
            return this.permissions;
        }

        @Override
        public final java.lang.Object getPhysicalTableMap() {
            return this.physicalTableMap;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties getRefreshProperties() {
            return this.refreshProperties;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet getRowLevelPermissionDataSet() {
            return this.rowLevelPermissionDataSet;
        }

        @Override
        public final imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration getRowLevelPermissionTagConfiguration() {
            return this.rowLevelPermissionTagConfiguration;
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

            data.set("dataSetId", om.valueToTree(this.getDataSetId()));
            data.set("importMode", om.valueToTree(this.getImportMode()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getAwsAccountId() != null) {
                data.set("awsAccountId", om.valueToTree(this.getAwsAccountId()));
            }
            if (this.getColumnGroups() != null) {
                data.set("columnGroups", om.valueToTree(this.getColumnGroups()));
            }
            if (this.getColumnLevelPermissionRules() != null) {
                data.set("columnLevelPermissionRules", om.valueToTree(this.getColumnLevelPermissionRules()));
            }
            if (this.getDataSetUsageConfiguration() != null) {
                data.set("dataSetUsageConfiguration", om.valueToTree(this.getDataSetUsageConfiguration()));
            }
            if (this.getFieldFolders() != null) {
                data.set("fieldFolders", om.valueToTree(this.getFieldFolders()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLogicalTableMap() != null) {
                data.set("logicalTableMap", om.valueToTree(this.getLogicalTableMap()));
            }
            if (this.getPermissions() != null) {
                data.set("permissions", om.valueToTree(this.getPermissions()));
            }
            if (this.getPhysicalTableMap() != null) {
                data.set("physicalTableMap", om.valueToTree(this.getPhysicalTableMap()));
            }
            if (this.getRefreshProperties() != null) {
                data.set("refreshProperties", om.valueToTree(this.getRefreshProperties()));
            }
            if (this.getRowLevelPermissionDataSet() != null) {
                data.set("rowLevelPermissionDataSet", om.valueToTree(this.getRowLevelPermissionDataSet()));
            }
            if (this.getRowLevelPermissionTagConfiguration() != null) {
                data.set("rowLevelPermissionTagConfiguration", om.valueToTree(this.getRowLevelPermissionTagConfiguration()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.quicksightDataSet.QuicksightDataSetConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            QuicksightDataSetConfig.Jsii$Proxy that = (QuicksightDataSetConfig.Jsii$Proxy) o;

            if (!dataSetId.equals(that.dataSetId)) return false;
            if (!importMode.equals(that.importMode)) return false;
            if (!name.equals(that.name)) return false;
            if (this.awsAccountId != null ? !this.awsAccountId.equals(that.awsAccountId) : that.awsAccountId != null) return false;
            if (this.columnGroups != null ? !this.columnGroups.equals(that.columnGroups) : that.columnGroups != null) return false;
            if (this.columnLevelPermissionRules != null ? !this.columnLevelPermissionRules.equals(that.columnLevelPermissionRules) : that.columnLevelPermissionRules != null) return false;
            if (this.dataSetUsageConfiguration != null ? !this.dataSetUsageConfiguration.equals(that.dataSetUsageConfiguration) : that.dataSetUsageConfiguration != null) return false;
            if (this.fieldFolders != null ? !this.fieldFolders.equals(that.fieldFolders) : that.fieldFolders != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.logicalTableMap != null ? !this.logicalTableMap.equals(that.logicalTableMap) : that.logicalTableMap != null) return false;
            if (this.permissions != null ? !this.permissions.equals(that.permissions) : that.permissions != null) return false;
            if (this.physicalTableMap != null ? !this.physicalTableMap.equals(that.physicalTableMap) : that.physicalTableMap != null) return false;
            if (this.refreshProperties != null ? !this.refreshProperties.equals(that.refreshProperties) : that.refreshProperties != null) return false;
            if (this.rowLevelPermissionDataSet != null ? !this.rowLevelPermissionDataSet.equals(that.rowLevelPermissionDataSet) : that.rowLevelPermissionDataSet != null) return false;
            if (this.rowLevelPermissionTagConfiguration != null ? !this.rowLevelPermissionTagConfiguration.equals(that.rowLevelPermissionTagConfiguration) : that.rowLevelPermissionTagConfiguration != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.dataSetId.hashCode();
            result = 31 * result + (this.importMode.hashCode());
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.awsAccountId != null ? this.awsAccountId.hashCode() : 0);
            result = 31 * result + (this.columnGroups != null ? this.columnGroups.hashCode() : 0);
            result = 31 * result + (this.columnLevelPermissionRules != null ? this.columnLevelPermissionRules.hashCode() : 0);
            result = 31 * result + (this.dataSetUsageConfiguration != null ? this.dataSetUsageConfiguration.hashCode() : 0);
            result = 31 * result + (this.fieldFolders != null ? this.fieldFolders.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.logicalTableMap != null ? this.logicalTableMap.hashCode() : 0);
            result = 31 * result + (this.permissions != null ? this.permissions.hashCode() : 0);
            result = 31 * result + (this.physicalTableMap != null ? this.physicalTableMap.hashCode() : 0);
            result = 31 * result + (this.refreshProperties != null ? this.refreshProperties.hashCode() : 0);
            result = 31 * result + (this.rowLevelPermissionDataSet != null ? this.rowLevelPermissionDataSet.hashCode() : 0);
            result = 31 * result + (this.rowLevelPermissionTagConfiguration != null ? this.rowLevelPermissionTagConfiguration.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
