package imports.aws.quicksight_data_set;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set aws_quicksight_data_set}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.105Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.quicksightDataSet.QuicksightDataSet")
public class QuicksightDataSet extends com.hashicorp.cdktf.TerraformResource {

    protected QuicksightDataSet(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected QuicksightDataSet(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.quicksight_data_set.QuicksightDataSet.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set aws_quicksight_data_set} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public QuicksightDataSet(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a QuicksightDataSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightDataSet to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightDataSet that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the QuicksightDataSet to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_data_set.QuicksightDataSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a QuicksightDataSet resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the QuicksightDataSet to import. This parameter is required.
     * @param importFromId The id of the existing QuicksightDataSet that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.quicksight_data_set.QuicksightDataSet.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putColumnGroups(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetColumnGroups>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetColumnGroups> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetColumnGroups>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_set.QuicksightDataSetColumnGroups __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putColumnGroups", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putColumnLevelPermissionRules(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRules>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRules> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRules>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRules __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putColumnLevelPermissionRules", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putDataSetUsageConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putDataSetUsageConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putFieldFolders(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetFieldFolders>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetFieldFolders> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetFieldFolders>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_set.QuicksightDataSetFieldFolders __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFieldFolders", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putLogicalTableMap(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMap>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMap> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMap>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMap __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putLogicalTableMap", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPermissions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPermissions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPermissions> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPermissions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_set.QuicksightDataSetPermissions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPermissions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putPhysicalTableMap(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMap>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMap> __cast_cd4240 = (java.util.List<imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMap>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMap __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putPhysicalTableMap", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRefreshProperties(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties value) {
        software.amazon.jsii.Kernel.call(this, "putRefreshProperties", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRowLevelPermissionDataSet(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet value) {
        software.amazon.jsii.Kernel.call(this, "putRowLevelPermissionDataSet", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putRowLevelPermissionTagConfiguration(final @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration value) {
        software.amazon.jsii.Kernel.call(this, "putRowLevelPermissionTagConfiguration", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetAwsAccountId() {
        software.amazon.jsii.Kernel.call(this, "resetAwsAccountId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColumnGroups() {
        software.amazon.jsii.Kernel.call(this, "resetColumnGroups", software.amazon.jsii.NativeType.VOID);
    }

    public void resetColumnLevelPermissionRules() {
        software.amazon.jsii.Kernel.call(this, "resetColumnLevelPermissionRules", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDataSetUsageConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetDataSetUsageConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFieldFolders() {
        software.amazon.jsii.Kernel.call(this, "resetFieldFolders", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLogicalTableMap() {
        software.amazon.jsii.Kernel.call(this, "resetLogicalTableMap", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPermissions() {
        software.amazon.jsii.Kernel.call(this, "resetPermissions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPhysicalTableMap() {
        software.amazon.jsii.Kernel.call(this, "resetPhysicalTableMap", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRefreshProperties() {
        software.amazon.jsii.Kernel.call(this, "resetRefreshProperties", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRowLevelPermissionDataSet() {
        software.amazon.jsii.Kernel.call(this, "resetRowLevelPermissionDataSet", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRowLevelPermissionTagConfiguration() {
        software.amazon.jsii.Kernel.call(this, "resetRowLevelPermissionTagConfiguration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsList getColumnGroups() {
        return software.amazon.jsii.Kernel.get(this, "columnGroups", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetColumnGroupsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRulesList getColumnLevelPermissionRules() {
        return software.amazon.jsii.Kernel.get(this, "columnLevelPermissionRules", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRulesList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfigurationOutputReference getDataSetUsageConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "dataSetUsageConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetFieldFoldersList getFieldFolders() {
        return software.amazon.jsii.Kernel.get(this, "fieldFolders", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetFieldFoldersList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapList getLogicalTableMap() {
        return software.amazon.jsii.Kernel.get(this, "logicalTableMap", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMapList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetOutputColumnsList getOutputColumns() {
        return software.amazon.jsii.Kernel.get(this, "outputColumns", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetOutputColumnsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPermissionsList getPermissions() {
        return software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPermissionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapList getPhysicalTableMap() {
        return software.amazon.jsii.Kernel.get(this, "physicalTableMap", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMapList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesOutputReference getRefreshProperties() {
        return software.amazon.jsii.Kernel.get(this, "refreshProperties", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshPropertiesOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSetOutputReference getRowLevelPermissionDataSet() {
        return software.amazon.jsii.Kernel.get(this, "rowLevelPermissionDataSet", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSetOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfigurationOutputReference getRowLevelPermissionTagConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "rowLevelPermissionTagConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfigurationOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAwsAccountIdInput() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getColumnGroupsInput() {
        return software.amazon.jsii.Kernel.get(this, "columnGroupsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getColumnLevelPermissionRulesInput() {
        return software.amazon.jsii.Kernel.get(this, "columnLevelPermissionRulesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDataSetIdInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSetIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration getDataSetUsageConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "dataSetUsageConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFieldFoldersInput() {
        return software.amazon.jsii.Kernel.get(this, "fieldFoldersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getImportModeInput() {
        return software.amazon.jsii.Kernel.get(this, "importModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLogicalTableMapInput() {
        return software.amazon.jsii.Kernel.get(this, "logicalTableMapInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getNameInput() {
        return software.amazon.jsii.Kernel.get(this, "nameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPermissionsInput() {
        return software.amazon.jsii.Kernel.get(this, "permissionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getPhysicalTableMapInput() {
        return software.amazon.jsii.Kernel.get(this, "physicalTableMapInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties getRefreshPropertiesInput() {
        return software.amazon.jsii.Kernel.get(this, "refreshPropertiesInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet getRowLevelPermissionDataSetInput() {
        return software.amazon.jsii.Kernel.get(this, "rowLevelPermissionDataSetInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration getRowLevelPermissionTagConfigurationInput() {
        return software.amazon.jsii.Kernel.get(this, "rowLevelPermissionTagConfigurationInput", software.amazon.jsii.NativeType.forClass(imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAwsAccountId() {
        return software.amazon.jsii.Kernel.get(this, "awsAccountId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAwsAccountId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "awsAccountId", java.util.Objects.requireNonNull(value, "awsAccountId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDataSetId() {
        return software.amazon.jsii.Kernel.get(this, "dataSetId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDataSetId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "dataSetId", java.util.Objects.requireNonNull(value, "dataSetId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getImportMode() {
        return software.amazon.jsii.Kernel.get(this, "importMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setImportMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "importMode", java.util.Objects.requireNonNull(value, "importMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getName() {
        return software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "name", java.util.Objects.requireNonNull(value, "name is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTags() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTags(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tags", java.util.Objects.requireNonNull(value, "tags is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return java.util.Collections.unmodifiableMap(software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTagsAll(final @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tagsAll", java.util.Objects.requireNonNull(value, "tagsAll is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.quicksight_data_set.QuicksightDataSet}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.quicksight_data_set.QuicksightDataSet> {
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
        private final imports.aws.quicksight_data_set.QuicksightDataSetConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.quicksight_data_set.QuicksightDataSetConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_id QuicksightDataSet#data_set_id}.
         * <p>
         * @return {@code this}
         * @param dataSetId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_id QuicksightDataSet#data_set_id}. This parameter is required.
         */
        public Builder dataSetId(final java.lang.String dataSetId) {
            this.config.dataSetId(dataSetId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import_mode QuicksightDataSet#import_mode}.
         * <p>
         * @return {@code this}
         * @param importMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#import_mode QuicksightDataSet#import_mode}. This parameter is required.
         */
        public Builder importMode(final java.lang.String importMode) {
            this.config.importMode(importMode);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}.
         * <p>
         * @return {@code this}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#name QuicksightDataSet#name}. This parameter is required.
         */
        public Builder name(final java.lang.String name) {
            this.config.name(name);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#aws_account_id QuicksightDataSet#aws_account_id}.
         * <p>
         * @return {@code this}
         * @param awsAccountId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#aws_account_id QuicksightDataSet#aws_account_id}. This parameter is required.
         */
        public Builder awsAccountId(final java.lang.String awsAccountId) {
            this.config.awsAccountId(awsAccountId);
            return this;
        }

        /**
         * column_groups block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
         * <p>
         * @return {@code this}
         * @param columnGroups column_groups block. This parameter is required.
         */
        public Builder columnGroups(final com.hashicorp.cdktf.IResolvable columnGroups) {
            this.config.columnGroups(columnGroups);
            return this;
        }
        /**
         * column_groups block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_groups QuicksightDataSet#column_groups}
         * <p>
         * @return {@code this}
         * @param columnGroups column_groups block. This parameter is required.
         */
        public Builder columnGroups(final java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetColumnGroups> columnGroups) {
            this.config.columnGroups(columnGroups);
            return this;
        }

        /**
         * column_level_permission_rules block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
         * <p>
         * @return {@code this}
         * @param columnLevelPermissionRules column_level_permission_rules block. This parameter is required.
         */
        public Builder columnLevelPermissionRules(final com.hashicorp.cdktf.IResolvable columnLevelPermissionRules) {
            this.config.columnLevelPermissionRules(columnLevelPermissionRules);
            return this;
        }
        /**
         * column_level_permission_rules block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#column_level_permission_rules QuicksightDataSet#column_level_permission_rules}
         * <p>
         * @return {@code this}
         * @param columnLevelPermissionRules column_level_permission_rules block. This parameter is required.
         */
        public Builder columnLevelPermissionRules(final java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetColumnLevelPermissionRules> columnLevelPermissionRules) {
            this.config.columnLevelPermissionRules(columnLevelPermissionRules);
            return this;
        }

        /**
         * data_set_usage_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#data_set_usage_configuration QuicksightDataSet#data_set_usage_configuration}
         * <p>
         * @return {@code this}
         * @param dataSetUsageConfiguration data_set_usage_configuration block. This parameter is required.
         */
        public Builder dataSetUsageConfiguration(final imports.aws.quicksight_data_set.QuicksightDataSetDataSetUsageConfiguration dataSetUsageConfiguration) {
            this.config.dataSetUsageConfiguration(dataSetUsageConfiguration);
            return this;
        }

        /**
         * field_folders block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
         * <p>
         * @return {@code this}
         * @param fieldFolders field_folders block. This parameter is required.
         */
        public Builder fieldFolders(final com.hashicorp.cdktf.IResolvable fieldFolders) {
            this.config.fieldFolders(fieldFolders);
            return this;
        }
        /**
         * field_folders block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#field_folders QuicksightDataSet#field_folders}
         * <p>
         * @return {@code this}
         * @param fieldFolders field_folders block. This parameter is required.
         */
        public Builder fieldFolders(final java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetFieldFolders> fieldFolders) {
            this.config.fieldFolders(fieldFolders);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#id QuicksightDataSet#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#id QuicksightDataSet#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * logical_table_map block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
         * <p>
         * @return {@code this}
         * @param logicalTableMap logical_table_map block. This parameter is required.
         */
        public Builder logicalTableMap(final com.hashicorp.cdktf.IResolvable logicalTableMap) {
            this.config.logicalTableMap(logicalTableMap);
            return this;
        }
        /**
         * logical_table_map block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#logical_table_map QuicksightDataSet#logical_table_map}
         * <p>
         * @return {@code this}
         * @param logicalTableMap logical_table_map block. This parameter is required.
         */
        public Builder logicalTableMap(final java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetLogicalTableMap> logicalTableMap) {
            this.config.logicalTableMap(logicalTableMap);
            return this;
        }

        /**
         * permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
         * <p>
         * @return {@code this}
         * @param permissions permissions block. This parameter is required.
         */
        public Builder permissions(final com.hashicorp.cdktf.IResolvable permissions) {
            this.config.permissions(permissions);
            return this;
        }
        /**
         * permissions block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#permissions QuicksightDataSet#permissions}
         * <p>
         * @return {@code this}
         * @param permissions permissions block. This parameter is required.
         */
        public Builder permissions(final java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetPermissions> permissions) {
            this.config.permissions(permissions);
            return this;
        }

        /**
         * physical_table_map block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
         * <p>
         * @return {@code this}
         * @param physicalTableMap physical_table_map block. This parameter is required.
         */
        public Builder physicalTableMap(final com.hashicorp.cdktf.IResolvable physicalTableMap) {
            this.config.physicalTableMap(physicalTableMap);
            return this;
        }
        /**
         * physical_table_map block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#physical_table_map QuicksightDataSet#physical_table_map}
         * <p>
         * @return {@code this}
         * @param physicalTableMap physical_table_map block. This parameter is required.
         */
        public Builder physicalTableMap(final java.util.List<? extends imports.aws.quicksight_data_set.QuicksightDataSetPhysicalTableMap> physicalTableMap) {
            this.config.physicalTableMap(physicalTableMap);
            return this;
        }

        /**
         * refresh_properties block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#refresh_properties QuicksightDataSet#refresh_properties}
         * <p>
         * @return {@code this}
         * @param refreshProperties refresh_properties block. This parameter is required.
         */
        public Builder refreshProperties(final imports.aws.quicksight_data_set.QuicksightDataSetRefreshProperties refreshProperties) {
            this.config.refreshProperties(refreshProperties);
            return this;
        }

        /**
         * row_level_permission_data_set block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_data_set QuicksightDataSet#row_level_permission_data_set}
         * <p>
         * @return {@code this}
         * @param rowLevelPermissionDataSet row_level_permission_data_set block. This parameter is required.
         */
        public Builder rowLevelPermissionDataSet(final imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionDataSet rowLevelPermissionDataSet) {
            this.config.rowLevelPermissionDataSet(rowLevelPermissionDataSet);
            return this;
        }

        /**
         * row_level_permission_tag_configuration block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#row_level_permission_tag_configuration QuicksightDataSet#row_level_permission_tag_configuration}
         * <p>
         * @return {@code this}
         * @param rowLevelPermissionTagConfiguration row_level_permission_tag_configuration block. This parameter is required.
         */
        public Builder rowLevelPermissionTagConfiguration(final imports.aws.quicksight_data_set.QuicksightDataSetRowLevelPermissionTagConfiguration rowLevelPermissionTagConfiguration) {
            this.config.rowLevelPermissionTagConfiguration(rowLevelPermissionTagConfiguration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags QuicksightDataSet#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags_all QuicksightDataSet#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/quicksight_data_set#tags_all QuicksightDataSet#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.quicksight_data_set.QuicksightDataSet}.
         */
        @Override
        public imports.aws.quicksight_data_set.QuicksightDataSet build() {
            return new imports.aws.quicksight_data_set.QuicksightDataSet(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
