package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointPostgresSettingsOutputReference")
public class DmsEndpointPostgresSettingsOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DmsEndpointPostgresSettingsOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DmsEndpointPostgresSettingsOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     */
    public DmsEndpointPostgresSettingsOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required") });
    }

    public void resetAfterConnectScript() {
        software.amazon.jsii.Kernel.call(this, "resetAfterConnectScript", software.amazon.jsii.NativeType.VOID);
    }

    public void resetBabelfishDatabaseName() {
        software.amazon.jsii.Kernel.call(this, "resetBabelfishDatabaseName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCaptureDdls() {
        software.amazon.jsii.Kernel.call(this, "resetCaptureDdls", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDatabaseMode() {
        software.amazon.jsii.Kernel.call(this, "resetDatabaseMode", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDdlArtifactsSchema() {
        software.amazon.jsii.Kernel.call(this, "resetDdlArtifactsSchema", software.amazon.jsii.NativeType.VOID);
    }

    public void resetExecuteTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetExecuteTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetFailTasksOnLobTruncation() {
        software.amazon.jsii.Kernel.call(this, "resetFailTasksOnLobTruncation", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeartbeatEnable() {
        software.amazon.jsii.Kernel.call(this, "resetHeartbeatEnable", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeartbeatFrequency() {
        software.amazon.jsii.Kernel.call(this, "resetHeartbeatFrequency", software.amazon.jsii.NativeType.VOID);
    }

    public void resetHeartbeatSchema() {
        software.amazon.jsii.Kernel.call(this, "resetHeartbeatSchema", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMapBooleanAsBoolean() {
        software.amazon.jsii.Kernel.call(this, "resetMapBooleanAsBoolean", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMapJsonbAsClob() {
        software.amazon.jsii.Kernel.call(this, "resetMapJsonbAsClob", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMapLongVarcharAs() {
        software.amazon.jsii.Kernel.call(this, "resetMapLongVarcharAs", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaxFileSize() {
        software.amazon.jsii.Kernel.call(this, "resetMaxFileSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPluginName() {
        software.amazon.jsii.Kernel.call(this, "resetPluginName", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSlotName() {
        software.amazon.jsii.Kernel.call(this, "resetSlotName", software.amazon.jsii.NativeType.VOID);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getAfterConnectScriptInput() {
        return software.amazon.jsii.Kernel.get(this, "afterConnectScriptInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getBabelfishDatabaseNameInput() {
        return software.amazon.jsii.Kernel.get(this, "babelfishDatabaseNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getCaptureDdlsInput() {
        return software.amazon.jsii.Kernel.get(this, "captureDdlsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDatabaseModeInput() {
        return software.amazon.jsii.Kernel.get(this, "databaseModeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDdlArtifactsSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "ddlArtifactsSchemaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getExecuteTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "executeTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getFailTasksOnLobTruncationInput() {
        return software.amazon.jsii.Kernel.get(this, "failTasksOnLobTruncationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getHeartbeatEnableInput() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatEnableInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getHeartbeatFrequencyInput() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatFrequencyInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getHeartbeatSchemaInput() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatSchemaInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMapBooleanAsBooleanInput() {
        return software.amazon.jsii.Kernel.get(this, "mapBooleanAsBooleanInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getMapJsonbAsClobInput() {
        return software.amazon.jsii.Kernel.get(this, "mapJsonbAsClobInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMapLongVarcharAsInput() {
        return software.amazon.jsii.Kernel.get(this, "mapLongVarcharAsInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getMaxFileSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "maxFileSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPluginNameInput() {
        return software.amazon.jsii.Kernel.get(this, "pluginNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSlotNameInput() {
        return software.amazon.jsii.Kernel.get(this, "slotNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getAfterConnectScript() {
        return software.amazon.jsii.Kernel.get(this, "afterConnectScript", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setAfterConnectScript(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "afterConnectScript", java.util.Objects.requireNonNull(value, "afterConnectScript is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getBabelfishDatabaseName() {
        return software.amazon.jsii.Kernel.get(this, "babelfishDatabaseName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setBabelfishDatabaseName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "babelfishDatabaseName", java.util.Objects.requireNonNull(value, "babelfishDatabaseName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getCaptureDdls() {
        return software.amazon.jsii.Kernel.get(this, "captureDdls", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setCaptureDdls(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "captureDdls", java.util.Objects.requireNonNull(value, "captureDdls is required"));
    }

    public void setCaptureDdls(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "captureDdls", java.util.Objects.requireNonNull(value, "captureDdls is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDatabaseMode() {
        return software.amazon.jsii.Kernel.get(this, "databaseMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDatabaseMode(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "databaseMode", java.util.Objects.requireNonNull(value, "databaseMode is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDdlArtifactsSchema() {
        return software.amazon.jsii.Kernel.get(this, "ddlArtifactsSchema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDdlArtifactsSchema(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "ddlArtifactsSchema", java.util.Objects.requireNonNull(value, "ddlArtifactsSchema is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getExecuteTimeout() {
        return software.amazon.jsii.Kernel.get(this, "executeTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setExecuteTimeout(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "executeTimeout", java.util.Objects.requireNonNull(value, "executeTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getFailTasksOnLobTruncation() {
        return software.amazon.jsii.Kernel.get(this, "failTasksOnLobTruncation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setFailTasksOnLobTruncation(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "failTasksOnLobTruncation", java.util.Objects.requireNonNull(value, "failTasksOnLobTruncation is required"));
    }

    public void setFailTasksOnLobTruncation(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "failTasksOnLobTruncation", java.util.Objects.requireNonNull(value, "failTasksOnLobTruncation is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getHeartbeatEnable() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatEnable", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setHeartbeatEnable(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "heartbeatEnable", java.util.Objects.requireNonNull(value, "heartbeatEnable is required"));
    }

    public void setHeartbeatEnable(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "heartbeatEnable", java.util.Objects.requireNonNull(value, "heartbeatEnable is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getHeartbeatFrequency() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatFrequency", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setHeartbeatFrequency(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "heartbeatFrequency", java.util.Objects.requireNonNull(value, "heartbeatFrequency is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHeartbeatSchema() {
        return software.amazon.jsii.Kernel.get(this, "heartbeatSchema", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setHeartbeatSchema(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "heartbeatSchema", java.util.Objects.requireNonNull(value, "heartbeatSchema is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMapBooleanAsBoolean() {
        return software.amazon.jsii.Kernel.get(this, "mapBooleanAsBoolean", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMapBooleanAsBoolean(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "mapBooleanAsBoolean", java.util.Objects.requireNonNull(value, "mapBooleanAsBoolean is required"));
    }

    public void setMapBooleanAsBoolean(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "mapBooleanAsBoolean", java.util.Objects.requireNonNull(value, "mapBooleanAsBoolean is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getMapJsonbAsClob() {
        return software.amazon.jsii.Kernel.get(this, "mapJsonbAsClob", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setMapJsonbAsClob(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "mapJsonbAsClob", java.util.Objects.requireNonNull(value, "mapJsonbAsClob is required"));
    }

    public void setMapJsonbAsClob(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "mapJsonbAsClob", java.util.Objects.requireNonNull(value, "mapJsonbAsClob is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMapLongVarcharAs() {
        return software.amazon.jsii.Kernel.get(this, "mapLongVarcharAs", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMapLongVarcharAs(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mapLongVarcharAs", java.util.Objects.requireNonNull(value, "mapLongVarcharAs is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getMaxFileSize() {
        return software.amazon.jsii.Kernel.get(this, "maxFileSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setMaxFileSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "maxFileSize", java.util.Objects.requireNonNull(value, "maxFileSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPluginName() {
        return software.amazon.jsii.Kernel.get(this, "pluginName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPluginName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "pluginName", java.util.Objects.requireNonNull(value, "pluginName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSlotName() {
        return software.amazon.jsii.Kernel.get(this, "slotName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSlotName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "slotName", java.util.Objects.requireNonNull(value, "slotName is required"));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointPostgresSettings getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.dms_endpoint.DmsEndpointPostgresSettings.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.dms_endpoint.DmsEndpointPostgresSettings value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
