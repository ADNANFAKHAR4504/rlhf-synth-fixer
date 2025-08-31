package imports.aws.data_aws_rds_orderable_db_instance;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance aws_rds_orderable_db_instance}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.816Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsRdsOrderableDbInstance.DataAwsRdsOrderableDbInstance")
public class DataAwsRdsOrderableDbInstance extends com.hashicorp.cdktf.TerraformDataSource {

    protected DataAwsRdsOrderableDbInstance(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsRdsOrderableDbInstance(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance aws_rds_orderable_db_instance} Data Source.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public DataAwsRdsOrderableDbInstance(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstanceConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRdsOrderableDbInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRdsOrderableDbInstance to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRdsOrderableDbInstance that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the DataAwsRdsOrderableDbInstance to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a DataAwsRdsOrderableDbInstance resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the DataAwsRdsOrderableDbInstance to import. This parameter is required.
     * @param importFromId The id of the existing DataAwsRdsOrderableDbInstance that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void resetAvailabilityZoneGroup() {
        software.amazon.jsii.Kernel.call(this, "resetAvailabilityZoneGroup", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineLatestVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineLatestVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetEngineVersion() {
        software.amazon.jsii.Kernel.call(this, "resetEngineVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetInstanceClass() {
        software.amazon.jsii.Kernel.call(this, "resetInstanceClass", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLicenseModel() {
        software.amazon.jsii.Kernel.call(this, "resetLicenseModel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredEngineVersions() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredEngineVersions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPreferredInstanceClasses() {
        software.amazon.jsii.Kernel.call(this, "resetPreferredInstanceClasses", software.amazon.jsii.NativeType.VOID);
    }

    public void resetReadReplicaCapable() {
        software.amazon.jsii.Kernel.call(this, "resetReadReplicaCapable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStorageType() {
        software.amazon.jsii.Kernel.call(this, "resetStorageType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportedEngineModes() {
        software.amazon.jsii.Kernel.call(this, "resetSupportedEngineModes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportedNetworkTypes() {
        software.amazon.jsii.Kernel.call(this, "resetSupportedNetworkTypes", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsClusters() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsClusters", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsEnhancedMonitoring() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsEnhancedMonitoring", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsGlobalDatabases() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsGlobalDatabases", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsIamDatabaseAuthentication() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsIamDatabaseAuthentication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsIops() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsIops", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsKerberosAuthentication() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsKerberosAuthentication", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsMultiAz() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsMultiAz", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsPerformanceInsights() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsPerformanceInsights", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsStorageAutoscaling() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsStorageAutoscaling", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSupportsStorageEncryption() {
        software.amazon.jsii.Kernel.call(this, "resetSupportsStorageEncryption", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpc() {
        software.amazon.jsii.Kernel.call(this, "resetVpc", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getAvailabilityZones() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "availabilityZones", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxIopsPerDbInstance() {
        return software.amazon.jsii.Kernel.get(this, "maxIopsPerDbInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxIopsPerGib() {
        return software.amazon.jsii.Kernel.get(this, "maxIopsPerGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxStorageSize() {
        return software.amazon.jsii.Kernel.get(this, "maxStorageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinIopsPerDbInstance() {
        return software.amazon.jsii.Kernel.get(this, "minIopsPerDbInstance", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinIopsPerGib() {
        return software.amazon.jsii.Kernel.get(this, "minIopsPerGib", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMinStorageSize() {
        return software.amazon.jsii.Kernel.get(this, "minStorageSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getMultiAzCapable() {
        return software.amazon.jsii.Kernel.get(this, "multiAzCapable", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getOutpostCapable() {
        return software.amazon.jsii.Kernel.get(this, "outpostCapable", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAvailabilityZoneGroupInput() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneGroupInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineInput() {
        return software.amazon.jsii.Kernel.get(this, "engineInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEngineLatestVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineLatestVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getEngineVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "engineVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getInstanceClassInput() {
        return software.amazon.jsii.Kernel.get(this, "instanceClassInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLicenseModelInput() {
        return software.amazon.jsii.Kernel.get(this, "licenseModelInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredEngineVersionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "preferredEngineVersionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPreferredInstanceClassesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "preferredInstanceClassesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getReadReplicaCapableInput() {
        return software.amazon.jsii.Kernel.get(this, "readReplicaCapableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getStorageTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "storageTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedEngineModesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "supportedEngineModesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedNetworkTypesInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "supportedNetworkTypesInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsClustersInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsClustersInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsEnhancedMonitoringInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsEnhancedMonitoringInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsGlobalDatabasesInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsGlobalDatabasesInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsIamDatabaseAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsIamDatabaseAuthenticationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsIopsInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsIopsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsKerberosAuthenticationInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsKerberosAuthenticationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsMultiAzInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsMultiAzInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsPerformanceInsightsInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsPerformanceInsightsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsStorageAutoscalingInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsStorageAutoscalingInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSupportsStorageEncryptionInput() {
        return software.amazon.jsii.Kernel.get(this, "supportsStorageEncryptionInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getVpcInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAvailabilityZoneGroup() {
        return software.amazon.jsii.Kernel.get(this, "availabilityZoneGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAvailabilityZoneGroup(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "availabilityZoneGroup", java.util.Objects.requireNonNull(value, "availabilityZoneGroup is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngine() {
        return software.amazon.jsii.Kernel.get(this, "engine", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngine(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engine", java.util.Objects.requireNonNull(value, "engine is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEngineLatestVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineLatestVersion", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEngineLatestVersion(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "engineLatestVersion", java.util.Objects.requireNonNull(value, "engineLatestVersion is required"));
    }

    public void setEngineLatestVersion(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "engineLatestVersion", java.util.Objects.requireNonNull(value, "engineLatestVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEngineVersion() {
        return software.amazon.jsii.Kernel.get(this, "engineVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setEngineVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "engineVersion", java.util.Objects.requireNonNull(value, "engineVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getInstanceClass() {
        return software.amazon.jsii.Kernel.get(this, "instanceClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setInstanceClass(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "instanceClass", java.util.Objects.requireNonNull(value, "instanceClass is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLicenseModel() {
        return software.amazon.jsii.Kernel.get(this, "licenseModel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLicenseModel(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "licenseModel", java.util.Objects.requireNonNull(value, "licenseModel is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPreferredEngineVersions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "preferredEngineVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPreferredEngineVersions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "preferredEngineVersions", java.util.Objects.requireNonNull(value, "preferredEngineVersions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getPreferredInstanceClasses() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "preferredInstanceClasses", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setPreferredInstanceClasses(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "preferredInstanceClasses", java.util.Objects.requireNonNull(value, "preferredInstanceClasses is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getReadReplicaCapable() {
        return software.amazon.jsii.Kernel.get(this, "readReplicaCapable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setReadReplicaCapable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "readReplicaCapable", java.util.Objects.requireNonNull(value, "readReplicaCapable is required"));
    }

    public void setReadReplicaCapable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "readReplicaCapable", java.util.Objects.requireNonNull(value, "readReplicaCapable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getStorageType() {
        return software.amazon.jsii.Kernel.get(this, "storageType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setStorageType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "storageType", java.util.Objects.requireNonNull(value, "storageType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedEngineModes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedEngineModes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSupportedEngineModes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "supportedEngineModes", java.util.Objects.requireNonNull(value, "supportedEngineModes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSupportedNetworkTypes() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "supportedNetworkTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSupportedNetworkTypes(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "supportedNetworkTypes", java.util.Objects.requireNonNull(value, "supportedNetworkTypes is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsClusters() {
        return software.amazon.jsii.Kernel.get(this, "supportsClusters", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsClusters(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsClusters", java.util.Objects.requireNonNull(value, "supportsClusters is required"));
    }

    public void setSupportsClusters(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsClusters", java.util.Objects.requireNonNull(value, "supportsClusters is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsEnhancedMonitoring() {
        return software.amazon.jsii.Kernel.get(this, "supportsEnhancedMonitoring", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsEnhancedMonitoring(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsEnhancedMonitoring", java.util.Objects.requireNonNull(value, "supportsEnhancedMonitoring is required"));
    }

    public void setSupportsEnhancedMonitoring(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsEnhancedMonitoring", java.util.Objects.requireNonNull(value, "supportsEnhancedMonitoring is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsGlobalDatabases() {
        return software.amazon.jsii.Kernel.get(this, "supportsGlobalDatabases", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsGlobalDatabases(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsGlobalDatabases", java.util.Objects.requireNonNull(value, "supportsGlobalDatabases is required"));
    }

    public void setSupportsGlobalDatabases(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsGlobalDatabases", java.util.Objects.requireNonNull(value, "supportsGlobalDatabases is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsIamDatabaseAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "supportsIamDatabaseAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsIamDatabaseAuthentication(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsIamDatabaseAuthentication", java.util.Objects.requireNonNull(value, "supportsIamDatabaseAuthentication is required"));
    }

    public void setSupportsIamDatabaseAuthentication(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsIamDatabaseAuthentication", java.util.Objects.requireNonNull(value, "supportsIamDatabaseAuthentication is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsIops() {
        return software.amazon.jsii.Kernel.get(this, "supportsIops", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsIops(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsIops", java.util.Objects.requireNonNull(value, "supportsIops is required"));
    }

    public void setSupportsIops(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsIops", java.util.Objects.requireNonNull(value, "supportsIops is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsKerberosAuthentication() {
        return software.amazon.jsii.Kernel.get(this, "supportsKerberosAuthentication", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsKerberosAuthentication(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsKerberosAuthentication", java.util.Objects.requireNonNull(value, "supportsKerberosAuthentication is required"));
    }

    public void setSupportsKerberosAuthentication(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsKerberosAuthentication", java.util.Objects.requireNonNull(value, "supportsKerberosAuthentication is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsMultiAz() {
        return software.amazon.jsii.Kernel.get(this, "supportsMultiAz", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsMultiAz(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsMultiAz", java.util.Objects.requireNonNull(value, "supportsMultiAz is required"));
    }

    public void setSupportsMultiAz(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsMultiAz", java.util.Objects.requireNonNull(value, "supportsMultiAz is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsPerformanceInsights() {
        return software.amazon.jsii.Kernel.get(this, "supportsPerformanceInsights", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsPerformanceInsights(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsPerformanceInsights", java.util.Objects.requireNonNull(value, "supportsPerformanceInsights is required"));
    }

    public void setSupportsPerformanceInsights(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsPerformanceInsights", java.util.Objects.requireNonNull(value, "supportsPerformanceInsights is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsStorageAutoscaling() {
        return software.amazon.jsii.Kernel.get(this, "supportsStorageAutoscaling", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsStorageAutoscaling(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsStorageAutoscaling", java.util.Objects.requireNonNull(value, "supportsStorageAutoscaling is required"));
    }

    public void setSupportsStorageAutoscaling(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsStorageAutoscaling", java.util.Objects.requireNonNull(value, "supportsStorageAutoscaling is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSupportsStorageEncryption() {
        return software.amazon.jsii.Kernel.get(this, "supportsStorageEncryption", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSupportsStorageEncryption(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "supportsStorageEncryption", java.util.Objects.requireNonNull(value, "supportsStorageEncryption is required"));
    }

    public void setSupportsStorageEncryption(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "supportsStorageEncryption", java.util.Objects.requireNonNull(value, "supportsStorageEncryption is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getVpc() {
        return software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setVpc(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "vpc", java.util.Objects.requireNonNull(value, "vpc is required"));
    }

    public void setVpc(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "vpc", java.util.Objects.requireNonNull(value, "vpc is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance> {
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
        private final imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstanceConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstanceConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine DataAwsRdsOrderableDbInstance#engine}.
         * <p>
         * @return {@code this}
         * @param engine Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine DataAwsRdsOrderableDbInstance#engine}. This parameter is required.
         */
        public Builder engine(final java.lang.String engine) {
            this.config.engine(engine);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#availability_zone_group DataAwsRdsOrderableDbInstance#availability_zone_group}.
         * <p>
         * @return {@code this}
         * @param availabilityZoneGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#availability_zone_group DataAwsRdsOrderableDbInstance#availability_zone_group}. This parameter is required.
         */
        public Builder availabilityZoneGroup(final java.lang.String availabilityZoneGroup) {
            this.config.availabilityZoneGroup(availabilityZoneGroup);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_latest_version DataAwsRdsOrderableDbInstance#engine_latest_version}.
         * <p>
         * @return {@code this}
         * @param engineLatestVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_latest_version DataAwsRdsOrderableDbInstance#engine_latest_version}. This parameter is required.
         */
        public Builder engineLatestVersion(final java.lang.Boolean engineLatestVersion) {
            this.config.engineLatestVersion(engineLatestVersion);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_latest_version DataAwsRdsOrderableDbInstance#engine_latest_version}.
         * <p>
         * @return {@code this}
         * @param engineLatestVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_latest_version DataAwsRdsOrderableDbInstance#engine_latest_version}. This parameter is required.
         */
        public Builder engineLatestVersion(final com.hashicorp.cdktf.IResolvable engineLatestVersion) {
            this.config.engineLatestVersion(engineLatestVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_version DataAwsRdsOrderableDbInstance#engine_version}.
         * <p>
         * @return {@code this}
         * @param engineVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#engine_version DataAwsRdsOrderableDbInstance#engine_version}. This parameter is required.
         */
        public Builder engineVersion(final java.lang.String engineVersion) {
            this.config.engineVersion(engineVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#id DataAwsRdsOrderableDbInstance#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#id DataAwsRdsOrderableDbInstance#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#instance_class DataAwsRdsOrderableDbInstance#instance_class}.
         * <p>
         * @return {@code this}
         * @param instanceClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#instance_class DataAwsRdsOrderableDbInstance#instance_class}. This parameter is required.
         */
        public Builder instanceClass(final java.lang.String instanceClass) {
            this.config.instanceClass(instanceClass);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#license_model DataAwsRdsOrderableDbInstance#license_model}.
         * <p>
         * @return {@code this}
         * @param licenseModel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#license_model DataAwsRdsOrderableDbInstance#license_model}. This parameter is required.
         */
        public Builder licenseModel(final java.lang.String licenseModel) {
            this.config.licenseModel(licenseModel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_engine_versions DataAwsRdsOrderableDbInstance#preferred_engine_versions}.
         * <p>
         * @return {@code this}
         * @param preferredEngineVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_engine_versions DataAwsRdsOrderableDbInstance#preferred_engine_versions}. This parameter is required.
         */
        public Builder preferredEngineVersions(final java.util.List<java.lang.String> preferredEngineVersions) {
            this.config.preferredEngineVersions(preferredEngineVersions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_instance_classes DataAwsRdsOrderableDbInstance#preferred_instance_classes}.
         * <p>
         * @return {@code this}
         * @param preferredInstanceClasses Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#preferred_instance_classes DataAwsRdsOrderableDbInstance#preferred_instance_classes}. This parameter is required.
         */
        public Builder preferredInstanceClasses(final java.util.List<java.lang.String> preferredInstanceClasses) {
            this.config.preferredInstanceClasses(preferredInstanceClasses);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#read_replica_capable DataAwsRdsOrderableDbInstance#read_replica_capable}.
         * <p>
         * @return {@code this}
         * @param readReplicaCapable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#read_replica_capable DataAwsRdsOrderableDbInstance#read_replica_capable}. This parameter is required.
         */
        public Builder readReplicaCapable(final java.lang.Boolean readReplicaCapable) {
            this.config.readReplicaCapable(readReplicaCapable);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#read_replica_capable DataAwsRdsOrderableDbInstance#read_replica_capable}.
         * <p>
         * @return {@code this}
         * @param readReplicaCapable Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#read_replica_capable DataAwsRdsOrderableDbInstance#read_replica_capable}. This parameter is required.
         */
        public Builder readReplicaCapable(final com.hashicorp.cdktf.IResolvable readReplicaCapable) {
            this.config.readReplicaCapable(readReplicaCapable);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#storage_type DataAwsRdsOrderableDbInstance#storage_type}.
         * <p>
         * @return {@code this}
         * @param storageType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#storage_type DataAwsRdsOrderableDbInstance#storage_type}. This parameter is required.
         */
        public Builder storageType(final java.lang.String storageType) {
            this.config.storageType(storageType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_engine_modes DataAwsRdsOrderableDbInstance#supported_engine_modes}.
         * <p>
         * @return {@code this}
         * @param supportedEngineModes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_engine_modes DataAwsRdsOrderableDbInstance#supported_engine_modes}. This parameter is required.
         */
        public Builder supportedEngineModes(final java.util.List<java.lang.String> supportedEngineModes) {
            this.config.supportedEngineModes(supportedEngineModes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_network_types DataAwsRdsOrderableDbInstance#supported_network_types}.
         * <p>
         * @return {@code this}
         * @param supportedNetworkTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supported_network_types DataAwsRdsOrderableDbInstance#supported_network_types}. This parameter is required.
         */
        public Builder supportedNetworkTypes(final java.util.List<java.lang.String> supportedNetworkTypes) {
            this.config.supportedNetworkTypes(supportedNetworkTypes);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_clusters DataAwsRdsOrderableDbInstance#supports_clusters}.
         * <p>
         * @return {@code this}
         * @param supportsClusters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_clusters DataAwsRdsOrderableDbInstance#supports_clusters}. This parameter is required.
         */
        public Builder supportsClusters(final java.lang.Boolean supportsClusters) {
            this.config.supportsClusters(supportsClusters);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_clusters DataAwsRdsOrderableDbInstance#supports_clusters}.
         * <p>
         * @return {@code this}
         * @param supportsClusters Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_clusters DataAwsRdsOrderableDbInstance#supports_clusters}. This parameter is required.
         */
        public Builder supportsClusters(final com.hashicorp.cdktf.IResolvable supportsClusters) {
            this.config.supportsClusters(supportsClusters);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_enhanced_monitoring DataAwsRdsOrderableDbInstance#supports_enhanced_monitoring}.
         * <p>
         * @return {@code this}
         * @param supportsEnhancedMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_enhanced_monitoring DataAwsRdsOrderableDbInstance#supports_enhanced_monitoring}. This parameter is required.
         */
        public Builder supportsEnhancedMonitoring(final java.lang.Boolean supportsEnhancedMonitoring) {
            this.config.supportsEnhancedMonitoring(supportsEnhancedMonitoring);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_enhanced_monitoring DataAwsRdsOrderableDbInstance#supports_enhanced_monitoring}.
         * <p>
         * @return {@code this}
         * @param supportsEnhancedMonitoring Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_enhanced_monitoring DataAwsRdsOrderableDbInstance#supports_enhanced_monitoring}. This parameter is required.
         */
        public Builder supportsEnhancedMonitoring(final com.hashicorp.cdktf.IResolvable supportsEnhancedMonitoring) {
            this.config.supportsEnhancedMonitoring(supportsEnhancedMonitoring);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_global_databases DataAwsRdsOrderableDbInstance#supports_global_databases}.
         * <p>
         * @return {@code this}
         * @param supportsGlobalDatabases Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_global_databases DataAwsRdsOrderableDbInstance#supports_global_databases}. This parameter is required.
         */
        public Builder supportsGlobalDatabases(final java.lang.Boolean supportsGlobalDatabases) {
            this.config.supportsGlobalDatabases(supportsGlobalDatabases);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_global_databases DataAwsRdsOrderableDbInstance#supports_global_databases}.
         * <p>
         * @return {@code this}
         * @param supportsGlobalDatabases Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_global_databases DataAwsRdsOrderableDbInstance#supports_global_databases}. This parameter is required.
         */
        public Builder supportsGlobalDatabases(final com.hashicorp.cdktf.IResolvable supportsGlobalDatabases) {
            this.config.supportsGlobalDatabases(supportsGlobalDatabases);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iam_database_authentication DataAwsRdsOrderableDbInstance#supports_iam_database_authentication}.
         * <p>
         * @return {@code this}
         * @param supportsIamDatabaseAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iam_database_authentication DataAwsRdsOrderableDbInstance#supports_iam_database_authentication}. This parameter is required.
         */
        public Builder supportsIamDatabaseAuthentication(final java.lang.Boolean supportsIamDatabaseAuthentication) {
            this.config.supportsIamDatabaseAuthentication(supportsIamDatabaseAuthentication);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iam_database_authentication DataAwsRdsOrderableDbInstance#supports_iam_database_authentication}.
         * <p>
         * @return {@code this}
         * @param supportsIamDatabaseAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iam_database_authentication DataAwsRdsOrderableDbInstance#supports_iam_database_authentication}. This parameter is required.
         */
        public Builder supportsIamDatabaseAuthentication(final com.hashicorp.cdktf.IResolvable supportsIamDatabaseAuthentication) {
            this.config.supportsIamDatabaseAuthentication(supportsIamDatabaseAuthentication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iops DataAwsRdsOrderableDbInstance#supports_iops}.
         * <p>
         * @return {@code this}
         * @param supportsIops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iops DataAwsRdsOrderableDbInstance#supports_iops}. This parameter is required.
         */
        public Builder supportsIops(final java.lang.Boolean supportsIops) {
            this.config.supportsIops(supportsIops);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iops DataAwsRdsOrderableDbInstance#supports_iops}.
         * <p>
         * @return {@code this}
         * @param supportsIops Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_iops DataAwsRdsOrderableDbInstance#supports_iops}. This parameter is required.
         */
        public Builder supportsIops(final com.hashicorp.cdktf.IResolvable supportsIops) {
            this.config.supportsIops(supportsIops);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_kerberos_authentication DataAwsRdsOrderableDbInstance#supports_kerberos_authentication}.
         * <p>
         * @return {@code this}
         * @param supportsKerberosAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_kerberos_authentication DataAwsRdsOrderableDbInstance#supports_kerberos_authentication}. This parameter is required.
         */
        public Builder supportsKerberosAuthentication(final java.lang.Boolean supportsKerberosAuthentication) {
            this.config.supportsKerberosAuthentication(supportsKerberosAuthentication);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_kerberos_authentication DataAwsRdsOrderableDbInstance#supports_kerberos_authentication}.
         * <p>
         * @return {@code this}
         * @param supportsKerberosAuthentication Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_kerberos_authentication DataAwsRdsOrderableDbInstance#supports_kerberos_authentication}. This parameter is required.
         */
        public Builder supportsKerberosAuthentication(final com.hashicorp.cdktf.IResolvable supportsKerberosAuthentication) {
            this.config.supportsKerberosAuthentication(supportsKerberosAuthentication);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_multi_az DataAwsRdsOrderableDbInstance#supports_multi_az}.
         * <p>
         * @return {@code this}
         * @param supportsMultiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_multi_az DataAwsRdsOrderableDbInstance#supports_multi_az}. This parameter is required.
         */
        public Builder supportsMultiAz(final java.lang.Boolean supportsMultiAz) {
            this.config.supportsMultiAz(supportsMultiAz);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_multi_az DataAwsRdsOrderableDbInstance#supports_multi_az}.
         * <p>
         * @return {@code this}
         * @param supportsMultiAz Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_multi_az DataAwsRdsOrderableDbInstance#supports_multi_az}. This parameter is required.
         */
        public Builder supportsMultiAz(final com.hashicorp.cdktf.IResolvable supportsMultiAz) {
            this.config.supportsMultiAz(supportsMultiAz);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_performance_insights DataAwsRdsOrderableDbInstance#supports_performance_insights}.
         * <p>
         * @return {@code this}
         * @param supportsPerformanceInsights Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_performance_insights DataAwsRdsOrderableDbInstance#supports_performance_insights}. This parameter is required.
         */
        public Builder supportsPerformanceInsights(final java.lang.Boolean supportsPerformanceInsights) {
            this.config.supportsPerformanceInsights(supportsPerformanceInsights);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_performance_insights DataAwsRdsOrderableDbInstance#supports_performance_insights}.
         * <p>
         * @return {@code this}
         * @param supportsPerformanceInsights Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_performance_insights DataAwsRdsOrderableDbInstance#supports_performance_insights}. This parameter is required.
         */
        public Builder supportsPerformanceInsights(final com.hashicorp.cdktf.IResolvable supportsPerformanceInsights) {
            this.config.supportsPerformanceInsights(supportsPerformanceInsights);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_autoscaling DataAwsRdsOrderableDbInstance#supports_storage_autoscaling}.
         * <p>
         * @return {@code this}
         * @param supportsStorageAutoscaling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_autoscaling DataAwsRdsOrderableDbInstance#supports_storage_autoscaling}. This parameter is required.
         */
        public Builder supportsStorageAutoscaling(final java.lang.Boolean supportsStorageAutoscaling) {
            this.config.supportsStorageAutoscaling(supportsStorageAutoscaling);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_autoscaling DataAwsRdsOrderableDbInstance#supports_storage_autoscaling}.
         * <p>
         * @return {@code this}
         * @param supportsStorageAutoscaling Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_autoscaling DataAwsRdsOrderableDbInstance#supports_storage_autoscaling}. This parameter is required.
         */
        public Builder supportsStorageAutoscaling(final com.hashicorp.cdktf.IResolvable supportsStorageAutoscaling) {
            this.config.supportsStorageAutoscaling(supportsStorageAutoscaling);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_encryption DataAwsRdsOrderableDbInstance#supports_storage_encryption}.
         * <p>
         * @return {@code this}
         * @param supportsStorageEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_encryption DataAwsRdsOrderableDbInstance#supports_storage_encryption}. This parameter is required.
         */
        public Builder supportsStorageEncryption(final java.lang.Boolean supportsStorageEncryption) {
            this.config.supportsStorageEncryption(supportsStorageEncryption);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_encryption DataAwsRdsOrderableDbInstance#supports_storage_encryption}.
         * <p>
         * @return {@code this}
         * @param supportsStorageEncryption Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#supports_storage_encryption DataAwsRdsOrderableDbInstance#supports_storage_encryption}. This parameter is required.
         */
        public Builder supportsStorageEncryption(final com.hashicorp.cdktf.IResolvable supportsStorageEncryption) {
            this.config.supportsStorageEncryption(supportsStorageEncryption);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#vpc DataAwsRdsOrderableDbInstance#vpc}.
         * <p>
         * @return {@code this}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#vpc DataAwsRdsOrderableDbInstance#vpc}. This parameter is required.
         */
        public Builder vpc(final java.lang.Boolean vpc) {
            this.config.vpc(vpc);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#vpc DataAwsRdsOrderableDbInstance#vpc}.
         * <p>
         * @return {@code this}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/data-sources/rds_orderable_db_instance#vpc DataAwsRdsOrderableDbInstance#vpc}. This parameter is required.
         */
        public Builder vpc(final com.hashicorp.cdktf.IResolvable vpc) {
            this.config.vpc(vpc);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance}.
         */
        @Override
        public imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance build() {
            return new imports.aws.data_aws_rds_orderable_db_instance.DataAwsRdsOrderableDbInstance(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
