package imports.aws.data_aws_dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.554Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsDmsEndpoint.DataAwsDmsEndpointPostgresSettingsOutputReference")
public class DataAwsDmsEndpointPostgresSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsDmsEndpointPostgresSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsDmsEndpointPostgresSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsDmsEndpointPostgresSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAfterConnectScript() {
        return software.amazon.jsii.Kernel.get(this, "afterConnectScript", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBabelfishDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "babelfishDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getCaptureDdls() {
        return software.amazon.jsii.Kernel.get(this, "captureDdls", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseMode() {
        return software.amazon.jsii.Kernel.get(this, "databaseMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDdlArtifactsSchema() {
        return software.amazon.jsii.Kernel.get(this, "ddlArtifactsSchema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getExecuteTimeout() {
        return software.amazon.jsii.Kernel.get(this, "executeTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getFailTasksOnLobTruncation() {
        return software.amazon.jsii.Kernel.get(this, "failTasksOnLobTruncation", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getHeartbeatEnable() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatEnable", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHeartbeatFrequency() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatFrequency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHeartbeatSchema() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatSchema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getMapBooleanAsBoolean() {
        return software.amazon.jsii.Kernel.get(this, "mapBooleanAsBoolean", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable getMapJsonbAsClob() {
        return software.amazon.jsii.Kernel.get(this, "mapJsonbAsClob", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.IResolvable.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMapLongVarcharAs() {
        return software.amazon.jsii.Kernel.get(this, "mapLongVarcharAs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxFileSize() {
        return software.amazon.jsii.Kernel.get(this, "maxFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPluginName() {
        return software.amazon.jsii.Kernel.get(this, "pluginName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlotName() {
        return software.amazon.jsii.Kernel.get(this, "slotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointPostgresSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointPostgresSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_dms_endpoint.DataAwsDmsEndpointPostgresSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
