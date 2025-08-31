package imports.aws.data_aws_rds_engine_version;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version aws_rds_engine_version}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.816Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRdsEngineVersion.DataAwsRdsEngineVersion")
public class DataAwsRdsEngineVersion extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsRdsEngineVersion(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRdsEngineVersion(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version aws_rds_engine_version} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsRdsEngineVersion(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRdsEngineVersion resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRdsEngineVersion to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRdsEngineVersion that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsRdsEngineVersion to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRdsEngineVersion resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRdsEngineVersion to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRdsEngineVersion that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putFilter(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilter>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilter> __cast_cd4240 = (java.util.List<imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilter>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilter __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putFilter", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetDefaultOnly() {
        software.amazon.jsii.Kernel.call(this, "resetDefaultOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFilter() {
        software.amazon.jsii.Kernel.call(this, "resetFilter", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHasMajorTarget() {
        software.amazon.jsii.Kernel.call(this, "resetHasMajorTarget", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHasMinorTarget() {
        software.amazon.jsii.Kernel.call(this, "resetHasMinorTarget", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetIncludeAll() {
        software.amazon.jsii.Kernel.call(this, "resetIncludeAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLatest() {
        software.amazon.jsii.Kernel.call(this, "resetLatest", software.amazon.jsii.NativeType.VOID);
    }

    public void resetParameterGroupFamily() {
        software.amazon.jsii.Kernel.call(this, "resetParameterGroupFamily", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredMajorTargets() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredMajorTargets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredUpgradeTargets() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredUpgradeTargets", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredVersions() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredVersions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVersion() {
        software.amazon.jsii.Kernel.call(this, "resetVersion", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getDefaultCharacterSet() {
        return software.amazon.jsii.Kernel.get(this, "defaultCharacterSet", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineDescription() {
        return software.amazon.jsii.Kernel.get(this, "engineDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getExportableLogTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "exportableLogTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilterList getFilter() {
        return software.amazon.jsii.Kernel.get(this, "filter", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilterList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStatus() {
        return software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedCharacterSets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedCharacterSets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedFeatureNames() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedFeatureNames", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedModes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedModes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedTimezones() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedTimezones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsCertificateRotationWithoutRestart() {
        return software.amazon.jsii.Kernel.get(this, "supportsCertificateRotationWithoutRestart", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsGlobalDatabases() {
        return software.amazon.jsii.Kernel.get(this, "supportsGlobalDatabases", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsIntegrations() {
        return software.amazon.jsii.Kernel.get(this, "supportsIntegrations", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsLimitlessDatabase() {
        return software.amazon.jsii.Kernel.get(this, "supportsLimitlessDatabase", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsLocalWriteForwarding() {
        return software.amazon.jsii.Kernel.get(this, "supportsLocalWriteForwarding", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsLogExportsToCloudwatch() {
        return software.amazon.jsii.Kernel.get(this, "supportsLogExportsToCloudwatch", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsParallelQuery() {
        return software.amazon.jsii.Kernel.get(this, "supportsParallelQuery", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getSupportsReadReplica() {
        return software.amazon.jsii.Kernel.get(this, "supportsReadReplica", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getValidMajorTargets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "validMajorTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getValidMinorTargets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "validMinorTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getValidUpgradeTargets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "validUpgradeTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionActual() {
        return software.amazon.jsii.Kernel.get(this, "versionActual", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersionDescription() {
        return software.amazon.jsii.Kernel.get(this, "versionDescription", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDefaultOnlyInput() {
        return software.amazon.jsii.Kernel.get(this, "defaultOnlyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFilterInput() {
        return software.amazon.jsii.Kernel.get(this, "filterInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHasMajorTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "hasMajorTargetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHasMinorTargetInput() {
        return software.amazon.jsii.Kernel.get(this, "hasMinorTargetInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getIncludeAllInput() {
        return software.amazon.jsii.Kernel.get(this, "includeAllInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getLatestInput() {
        return software.amazon.jsii.Kernel.get(this, "latestInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getParameterGroupFamilyInput() {
        return software.amazon.jsii.Kernel.get(this, "parameterGroupFamilyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredMajorTargetsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "preferredMajorTargetsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredUpgradeTargetsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "preferredUpgradeTargetsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredVersionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "preferredVersionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "versionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDefaultOnly() {
        return software.amazon.jsii.Kernel.get(this, "defaultOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDefaultOnly(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "defaultOnly", java.util.Objects.requireNonNull(value, "defaultOnly is required"));
    }

    public void setDefaultOnly(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "defaultOnly", java.util.Objects.requireNonNull(value, "defaultOnly is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engine", java.util.Objects.requireNonNull(value, "engine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHasMajorTarget() {
        return software.amazon.jsii.Kernel.get(this, "hasMajorTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHasMajorTarget(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "hasMajorTarget", java.util.Objects.requireNonNull(value, "hasMajorTarget is required"));
    }

    public void setHasMajorTarget(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "hasMajorTarget", java.util.Objects.requireNonNull(value, "hasMajorTarget is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHasMinorTarget() {
        return software.amazon.jsii.Kernel.get(this, "hasMinorTarget", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHasMinorTarget(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "hasMinorTarget", java.util.Objects.requireNonNull(value, "hasMinorTarget is required"));
    }

    public void setHasMinorTarget(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "hasMinorTarget", java.util.Objects.requireNonNull(value, "hasMinorTarget is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getIncludeAll() {
        return software.amazon.jsii.Kernel.get(this, "includeAll", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setIncludeAll(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "includeAll", java.util.Objects.requireNonNull(value, "includeAll is required"));
    }

    public void setIncludeAll(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "includeAll", java.util.Objects.requireNonNull(value, "includeAll is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getLatest() {
        return software.amazon.jsii.Kernel.get(this, "latest", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setLatest(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "latest", java.util.Objects.requireNonNull(value, "latest is required"));
    }

    public void setLatest(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "latest", java.util.Objects.requireNonNull(value, "latest is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getParameterGroupFamily() {
        return software.amazon.jsii.Kernel.get(this, "parameterGroupFamily", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setParameterGroupFamily(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "parameterGroupFamily", java.util.Objects.requireNonNull(value, "parameterGroupFamily is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPreferredMajorTargets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "preferredMajorTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPreferredMajorTargets(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "preferredMajorTargets", java.util.Objects.requireNonNull(value, "preferredMajorTargets is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPreferredUpgradeTargets() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "preferredUpgradeTargets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPreferredUpgradeTargets(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "preferredUpgradeTargets", java.util.Objects.requireNonNull(value, "preferredUpgradeTargets is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPreferredVersions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "preferredVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPreferredVersions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "preferredVersions", java.util.Objects.requireNonNull(value, "preferredVersions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVersion() {
        return software.amazon.jsii.Kernel.get(this, "version", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "version", java.util.Objects.requireNonNull(value, "version is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion> {
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
        private final imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#engine DataAwsRdsEngineVersion#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#engine DataAwsRdsEngineVersion#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config.engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#default_only DataAwsRdsEngineVersion#default_only}.
         * <p>
         * @return {@code this}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#default_only DataAwsRdsEngineVersion#default_only}. This parameter is required.
         */
        public Builder defaultOnly(final java.lang.Boolean defaultOnly) {
            this.config.defaultOnly(defaultOnly);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#default_only DataAwsRdsEngineVersion#default_only}.
         * <p>
         * @return {@code this}
         * @param defaultOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#default_only DataAwsRdsEngineVersion#default_only}. This parameter is required.
         */
        public Builder defaultOnly(final com.hashicorp.cdktf.IResolvable defaultOnly) {
            this.config.defaultOnly(defaultOnly);
            return this;
        }

        /**
         * filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#filter DataAwsRdsEngineVersion#filter}
         * <p>
         * @return {@code this}
         * @param filter filter block. This parameter is required.
         */
        public Builder filter(final com.hashicorp.cdktf.IResolvable filter) {
            this.config.filter(filter);
            return this;
        }
        /**
         * filter block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#filter DataAwsRdsEngineVersion#filter}
         * <p>
         * @return {@code this}
         * @param filter filter block. This parameter is required.
         */
        public Builder filter(final java.util.List<? extends imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersionFilter> filter) {
            this.config.filter(filter);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_major_target DataAwsRdsEngineVersion#has_major_target}.
         * <p>
         * @return {@code this}
         * @param hasMajorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_major_target DataAwsRdsEngineVersion#has_major_target}. This parameter is required.
         */
        public Builder hasMajorTarget(final java.lang.Boolean hasMajorTarget) {
            this.config.hasMajorTarget(hasMajorTarget);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_major_target DataAwsRdsEngineVersion#has_major_target}.
         * <p>
         * @return {@code this}
         * @param hasMajorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_major_target DataAwsRdsEngineVersion#has_major_target}. This parameter is required.
         */
        public Builder hasMajorTarget(final com.hashicorp.cdktf.IResolvable hasMajorTarget) {
            this.config.hasMajorTarget(hasMajorTarget);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_minor_target DataAwsRdsEngineVersion#has_minor_target}.
         * <p>
         * @return {@code this}
         * @param hasMinorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_minor_target DataAwsRdsEngineVersion#has_minor_target}. This parameter is required.
         */
        public Builder hasMinorTarget(final java.lang.Boolean hasMinorTarget) {
            this.config.hasMinorTarget(hasMinorTarget);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_minor_target DataAwsRdsEngineVersion#has_minor_target}.
         * <p>
         * @return {@code this}
         * @param hasMinorTarget Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#has_minor_target DataAwsRdsEngineVersion#has_minor_target}. This parameter is required.
         */
        public Builder hasMinorTarget(final com.hashicorp.cdktf.IResolvable hasMinorTarget) {
            this.config.hasMinorTarget(hasMinorTarget);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#id DataAwsRdsEngineVersion#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#id DataAwsRdsEngineVersion#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#include_all DataAwsRdsEngineVersion#include_all}.
         * <p>
         * @return {@code this}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#include_all DataAwsRdsEngineVersion#include_all}. This parameter is required.
         */
        public Builder includeAll(final java.lang.Boolean includeAll) {
            this.config.includeAll(includeAll);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#include_all DataAwsRdsEngineVersion#include_all}.
         * <p>
         * @return {@code this}
         * @param includeAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#include_all DataAwsRdsEngineVersion#include_all}. This parameter is required.
         */
        public Builder includeAll(final com.hashicorp.cdktf.IResolvable includeAll) {
            this.config.includeAll(includeAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#latest DataAwsRdsEngineVersion#latest}.
         * <p>
         * @return {@code this}
         * @param latest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#latest DataAwsRdsEngineVersion#latest}. This parameter is required.
         */
        public Builder latest(final java.lang.Boolean latest) {
            this.config.latest(latest);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#latest DataAwsRdsEngineVersion#latest}.
         * <p>
         * @return {@code this}
         * @param latest Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#latest DataAwsRdsEngineVersion#latest}. This parameter is required.
         */
        public Builder latest(final com.hashicorp.cdktf.IResolvable latest) {
            this.config.latest(latest);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#parameter_group_family DataAwsRdsEngineVersion#parameter_group_family}.
         * <p>
         * @return {@code this}
         * @param parameterGroupFamily Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#parameter_group_family DataAwsRdsEngineVersion#parameter_group_family}. This parameter is required.
         */
        public Builder parameterGroupFamily(final java.lang.String parameterGroupFamily) {
            this.config.parameterGroupFamily(parameterGroupFamily);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_major_targets DataAwsRdsEngineVersion#preferred_major_targets}.
         * <p>
         * @return {@code this}
         * @param preferredMajorTargets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_major_targets DataAwsRdsEngineVersion#preferred_major_targets}. This parameter is required.
         */
        public Builder preferredMajorTargets(final java.util.List<java.lang.String> preferredMajorTargets) {
            this.config.preferredMajorTargets(preferredMajorTargets);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_upgrade_targets DataAwsRdsEngineVersion#preferred_upgrade_targets}.
         * <p>
         * @return {@code this}
         * @param preferredUpgradeTargets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_upgrade_targets DataAwsRdsEngineVersion#preferred_upgrade_targets}. This parameter is required.
         */
        public Builder preferredUpgradeTargets(final java.util.List<java.lang.String> preferredUpgradeTargets) {
            this.config.preferredUpgradeTargets(preferredUpgradeTargets);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_versions DataAwsRdsEngineVersion#preferred_versions}.
         * <p>
         * @return {@code this}
         * @param preferredVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#preferred_versions DataAwsRdsEngineVersion#preferred_versions}. This parameter is required.
         */
        public Builder preferredVersions(final java.util.List<java.lang.String> preferredVersions) {
            this.config.preferredVersions(preferredVersions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#version DataAwsRdsEngineVersion#version}.
         * <p>
         * @return {@code this}
         * @param version Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_engine_version#version DataAwsRdsEngineVersion#version}. This parameter is required.
         */
        public Builder version(final java.lang.String version) {
            this.config.version(version);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion}.
         */
        @Override
        public imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion build() {
            return new imports.aws.data_aws_rds_engine_version.DataAwsRdsEngineVersion(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
