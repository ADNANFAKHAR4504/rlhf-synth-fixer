package imports.aws.storagegateway_gateway;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway aws_storagegateway_gateway}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.528Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.storagegatewayGateway.StoragegatewayGateway")
public class StoragegatewayGateway extends com.hashicorp.cdktf.TerraformResource {

    protected StoragegatewayGateway(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected StoragegatewayGateway(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.storagegateway_gateway.StoragegatewayGateway.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway aws_storagegateway_gateway} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public StoragegatewayGateway(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewayConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a StoragegatewayGateway resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the StoragegatewayGateway to import. This parameter is required.
     * @param importFromId The id of the existing StoragegatewayGateway that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the StoragegatewayGateway to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.storagegateway_gateway.StoragegatewayGateway.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a StoragegatewayGateway resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the StoragegatewayGateway to import. This parameter is required.
     * @param importFromId The id of the existing StoragegatewayGateway that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.storagegateway_gateway.StoragegatewayGateway.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putMaintenanceStartTime(final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime value) {
        software.amazon.jsii.Kernel.call(this, "putMaintenanceStartTime", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putSmbActiveDirectorySettings(final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings value) {
        software.amazon.jsii.Kernel.call(this, "putSmbActiveDirectorySettings", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTimeouts(final @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts value) {
        software.amazon.jsii.Kernel.call(this, "putTimeouts", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetActivationKey() {
        software.amazon.jsii.Kernel.call(this, "resetActivationKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAverageDownloadRateLimitInBitsPerSec() {
        software.amazon.jsii.Kernel.call(this, "resetAverageDownloadRateLimitInBitsPerSec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetAverageUploadRateLimitInBitsPerSec() {
        software.amazon.jsii.Kernel.call(this, "resetAverageUploadRateLimitInBitsPerSec", software.amazon.jsii.NativeType.VOID);
    }

    public void resetCloudwatchLogGroupArn() {
        software.amazon.jsii.Kernel.call(this, "resetCloudwatchLogGroupArn", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGatewayIpAddress() {
        software.amazon.jsii.Kernel.call(this, "resetGatewayIpAddress", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGatewayType() {
        software.amazon.jsii.Kernel.call(this, "resetGatewayType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetGatewayVpcEndpoint() {
        software.amazon.jsii.Kernel.call(this, "resetGatewayVpcEndpoint", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMaintenanceStartTime() {
        software.amazon.jsii.Kernel.call(this, "resetMaintenanceStartTime", software.amazon.jsii.NativeType.VOID);
    }

    public void resetMediumChangerType() {
        software.amazon.jsii.Kernel.call(this, "resetMediumChangerType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmbActiveDirectorySettings() {
        software.amazon.jsii.Kernel.call(this, "resetSmbActiveDirectorySettings", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmbFileShareVisibility() {
        software.amazon.jsii.Kernel.call(this, "resetSmbFileShareVisibility", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmbGuestPassword() {
        software.amazon.jsii.Kernel.call(this, "resetSmbGuestPassword", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSmbSecurityStrategy() {
        software.amazon.jsii.Kernel.call(this, "resetSmbSecurityStrategy", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTapeDriveType() {
        software.amazon.jsii.Kernel.call(this, "resetTapeDriveType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTimeouts() {
        software.amazon.jsii.Kernel.call(this, "resetTimeouts", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getEc2InstanceId() {
        return software.amazon.jsii.Kernel.get(this, "ec2InstanceId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getEndpointType() {
        return software.amazon.jsii.Kernel.get(this, "endpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "gatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewayGatewayNetworkInterfaceList getGatewayNetworkInterface() {
        return software.amazon.jsii.Kernel.get(this, "gatewayNetworkInterface", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewayGatewayNetworkInterfaceList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getHostEnvironment() {
        return software.amazon.jsii.Kernel.get(this, "hostEnvironment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTimeOutputReference getMaintenanceStartTime() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceStartTime", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTimeOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettingsOutputReference getSmbActiveDirectorySettings() {
        return software.amazon.jsii.Kernel.get(this, "smbActiveDirectorySettings", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettingsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeoutsOutputReference getTimeouts() {
        return software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeoutsOutputReference.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getActivationKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "activationKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAverageDownloadRateLimitInBitsPerSecInput() {
        return software.amazon.jsii.Kernel.get(this, "averageDownloadRateLimitInBitsPerSecInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getAverageUploadRateLimitInBitsPerSecInput() {
        return software.amazon.jsii.Kernel.get(this, "averageUploadRateLimitInBitsPerSecInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCloudwatchLogGroupArnInput() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayIpAddressInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayIpAddressInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayNameInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayNameInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayTimezoneInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayTimezoneInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getGatewayVpcEndpointInput() {
        return software.amazon.jsii.Kernel.get(this, "gatewayVpcEndpointInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime getMaintenanceStartTimeInput() {
        return software.amazon.jsii.Kernel.get(this, "maintenanceStartTimeInput", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getMediumChangerTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "mediumChangerTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings getSmbActiveDirectorySettingsInput() {
        return software.amazon.jsii.Kernel.get(this, "smbActiveDirectorySettingsInput", software.amazon.jsii.NativeType.forClass(imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSmbFileShareVisibilityInput() {
        return software.amazon.jsii.Kernel.get(this, "smbFileShareVisibilityInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSmbGuestPasswordInput() {
        return software.amazon.jsii.Kernel.get(this, "smbGuestPasswordInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSmbSecurityStrategyInput() {
        return software.amazon.jsii.Kernel.get(this, "smbSecurityStrategyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTapeDriveTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "tapeDriveTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTimeoutsInput() {
        return software.amazon.jsii.Kernel.get(this, "timeoutsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getActivationKey() {
        return software.amazon.jsii.Kernel.get(this, "activationKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setActivationKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "activationKey", java.util.Objects.requireNonNull(value, "activationKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAverageDownloadRateLimitInBitsPerSec() {
        return software.amazon.jsii.Kernel.get(this, "averageDownloadRateLimitInBitsPerSec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAverageDownloadRateLimitInBitsPerSec(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "averageDownloadRateLimitInBitsPerSec", java.util.Objects.requireNonNull(value, "averageDownloadRateLimitInBitsPerSec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getAverageUploadRateLimitInBitsPerSec() {
        return software.amazon.jsii.Kernel.get(this, "averageUploadRateLimitInBitsPerSec", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setAverageUploadRateLimitInBitsPerSec(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "averageUploadRateLimitInBitsPerSec", java.util.Objects.requireNonNull(value, "averageUploadRateLimitInBitsPerSec is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCloudwatchLogGroupArn() {
        return software.amazon.jsii.Kernel.get(this, "cloudwatchLogGroupArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCloudwatchLogGroupArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "cloudwatchLogGroupArn", java.util.Objects.requireNonNull(value, "cloudwatchLogGroupArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayIpAddress() {
        return software.amazon.jsii.Kernel.get(this, "gatewayIpAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayIpAddress(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayIpAddress", java.util.Objects.requireNonNull(value, "gatewayIpAddress is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayName() {
        return software.amazon.jsii.Kernel.get(this, "gatewayName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayName(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayName", java.util.Objects.requireNonNull(value, "gatewayName is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayTimezone() {
        return software.amazon.jsii.Kernel.get(this, "gatewayTimezone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayTimezone(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayTimezone", java.util.Objects.requireNonNull(value, "gatewayTimezone is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayType() {
        return software.amazon.jsii.Kernel.get(this, "gatewayType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayType", java.util.Objects.requireNonNull(value, "gatewayType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getGatewayVpcEndpoint() {
        return software.amazon.jsii.Kernel.get(this, "gatewayVpcEndpoint", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setGatewayVpcEndpoint(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "gatewayVpcEndpoint", java.util.Objects.requireNonNull(value, "gatewayVpcEndpoint is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getMediumChangerType() {
        return software.amazon.jsii.Kernel.get(this, "mediumChangerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setMediumChangerType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "mediumChangerType", java.util.Objects.requireNonNull(value, "mediumChangerType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSmbFileShareVisibility() {
        return software.amazon.jsii.Kernel.get(this, "smbFileShareVisibility", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSmbFileShareVisibility(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "smbFileShareVisibility", java.util.Objects.requireNonNull(value, "smbFileShareVisibility is required"));
    }

    public void setSmbFileShareVisibility(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "smbFileShareVisibility", java.util.Objects.requireNonNull(value, "smbFileShareVisibility is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmbGuestPassword() {
        return software.amazon.jsii.Kernel.get(this, "smbGuestPassword", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSmbGuestPassword(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "smbGuestPassword", java.util.Objects.requireNonNull(value, "smbGuestPassword is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSmbSecurityStrategy() {
        return software.amazon.jsii.Kernel.get(this, "smbSecurityStrategy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSmbSecurityStrategy(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "smbSecurityStrategy", java.util.Objects.requireNonNull(value, "smbSecurityStrategy is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTapeDriveType() {
        return software.amazon.jsii.Kernel.get(this, "tapeDriveType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTapeDriveType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tapeDriveType", java.util.Objects.requireNonNull(value, "tapeDriveType is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.storagegateway_gateway.StoragegatewayGateway}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.storagegateway_gateway.StoragegatewayGateway> {
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
        private final imports.aws.storagegateway_gateway.StoragegatewayGatewayConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.storagegateway_gateway.StoragegatewayGatewayConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_name StoragegatewayGateway#gateway_name}.
         * <p>
         * @return {@code this}
         * @param gatewayName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_name StoragegatewayGateway#gateway_name}. This parameter is required.
         */
        public Builder gatewayName(final java.lang.String gatewayName) {
            this.config.gatewayName(gatewayName);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_timezone StoragegatewayGateway#gateway_timezone}.
         * <p>
         * @return {@code this}
         * @param gatewayTimezone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_timezone StoragegatewayGateway#gateway_timezone}. This parameter is required.
         */
        public Builder gatewayTimezone(final java.lang.String gatewayTimezone) {
            this.config.gatewayTimezone(gatewayTimezone);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#activation_key StoragegatewayGateway#activation_key}.
         * <p>
         * @return {@code this}
         * @param activationKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#activation_key StoragegatewayGateway#activation_key}. This parameter is required.
         */
        public Builder activationKey(final java.lang.String activationKey) {
            this.config.activationKey(activationKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_download_rate_limit_in_bits_per_sec StoragegatewayGateway#average_download_rate_limit_in_bits_per_sec}.
         * <p>
         * @return {@code this}
         * @param averageDownloadRateLimitInBitsPerSec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_download_rate_limit_in_bits_per_sec StoragegatewayGateway#average_download_rate_limit_in_bits_per_sec}. This parameter is required.
         */
        public Builder averageDownloadRateLimitInBitsPerSec(final java.lang.Number averageDownloadRateLimitInBitsPerSec) {
            this.config.averageDownloadRateLimitInBitsPerSec(averageDownloadRateLimitInBitsPerSec);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_upload_rate_limit_in_bits_per_sec StoragegatewayGateway#average_upload_rate_limit_in_bits_per_sec}.
         * <p>
         * @return {@code this}
         * @param averageUploadRateLimitInBitsPerSec Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#average_upload_rate_limit_in_bits_per_sec StoragegatewayGateway#average_upload_rate_limit_in_bits_per_sec}. This parameter is required.
         */
        public Builder averageUploadRateLimitInBitsPerSec(final java.lang.Number averageUploadRateLimitInBitsPerSec) {
            this.config.averageUploadRateLimitInBitsPerSec(averageUploadRateLimitInBitsPerSec);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#cloudwatch_log_group_arn StoragegatewayGateway#cloudwatch_log_group_arn}.
         * <p>
         * @return {@code this}
         * @param cloudwatchLogGroupArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#cloudwatch_log_group_arn StoragegatewayGateway#cloudwatch_log_group_arn}. This parameter is required.
         */
        public Builder cloudwatchLogGroupArn(final java.lang.String cloudwatchLogGroupArn) {
            this.config.cloudwatchLogGroupArn(cloudwatchLogGroupArn);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_ip_address StoragegatewayGateway#gateway_ip_address}.
         * <p>
         * @return {@code this}
         * @param gatewayIpAddress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_ip_address StoragegatewayGateway#gateway_ip_address}. This parameter is required.
         */
        public Builder gatewayIpAddress(final java.lang.String gatewayIpAddress) {
            this.config.gatewayIpAddress(gatewayIpAddress);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_type StoragegatewayGateway#gateway_type}.
         * <p>
         * @return {@code this}
         * @param gatewayType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_type StoragegatewayGateway#gateway_type}. This parameter is required.
         */
        public Builder gatewayType(final java.lang.String gatewayType) {
            this.config.gatewayType(gatewayType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_vpc_endpoint StoragegatewayGateway#gateway_vpc_endpoint}.
         * <p>
         * @return {@code this}
         * @param gatewayVpcEndpoint Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#gateway_vpc_endpoint StoragegatewayGateway#gateway_vpc_endpoint}. This parameter is required.
         */
        public Builder gatewayVpcEndpoint(final java.lang.String gatewayVpcEndpoint) {
            this.config.gatewayVpcEndpoint(gatewayVpcEndpoint);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#id StoragegatewayGateway#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#id StoragegatewayGateway#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * maintenance_start_time block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#maintenance_start_time StoragegatewayGateway#maintenance_start_time}
         * <p>
         * @return {@code this}
         * @param maintenanceStartTime maintenance_start_time block. This parameter is required.
         */
        public Builder maintenanceStartTime(final imports.aws.storagegateway_gateway.StoragegatewayGatewayMaintenanceStartTime maintenanceStartTime) {
            this.config.maintenanceStartTime(maintenanceStartTime);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#medium_changer_type StoragegatewayGateway#medium_changer_type}.
         * <p>
         * @return {@code this}
         * @param mediumChangerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#medium_changer_type StoragegatewayGateway#medium_changer_type}. This parameter is required.
         */
        public Builder mediumChangerType(final java.lang.String mediumChangerType) {
            this.config.mediumChangerType(mediumChangerType);
            return this;
        }

        /**
         * smb_active_directory_settings block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_active_directory_settings StoragegatewayGateway#smb_active_directory_settings}
         * <p>
         * @return {@code this}
         * @param smbActiveDirectorySettings smb_active_directory_settings block. This parameter is required.
         */
        public Builder smbActiveDirectorySettings(final imports.aws.storagegateway_gateway.StoragegatewayGatewaySmbActiveDirectorySettings smbActiveDirectorySettings) {
            this.config.smbActiveDirectorySettings(smbActiveDirectorySettings);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_file_share_visibility StoragegatewayGateway#smb_file_share_visibility}.
         * <p>
         * @return {@code this}
         * @param smbFileShareVisibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_file_share_visibility StoragegatewayGateway#smb_file_share_visibility}. This parameter is required.
         */
        public Builder smbFileShareVisibility(final java.lang.Boolean smbFileShareVisibility) {
            this.config.smbFileShareVisibility(smbFileShareVisibility);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_file_share_visibility StoragegatewayGateway#smb_file_share_visibility}.
         * <p>
         * @return {@code this}
         * @param smbFileShareVisibility Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_file_share_visibility StoragegatewayGateway#smb_file_share_visibility}. This parameter is required.
         */
        public Builder smbFileShareVisibility(final com.hashicorp.cdktf.IResolvable smbFileShareVisibility) {
            this.config.smbFileShareVisibility(smbFileShareVisibility);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_guest_password StoragegatewayGateway#smb_guest_password}.
         * <p>
         * @return {@code this}
         * @param smbGuestPassword Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_guest_password StoragegatewayGateway#smb_guest_password}. This parameter is required.
         */
        public Builder smbGuestPassword(final java.lang.String smbGuestPassword) {
            this.config.smbGuestPassword(smbGuestPassword);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_security_strategy StoragegatewayGateway#smb_security_strategy}.
         * <p>
         * @return {@code this}
         * @param smbSecurityStrategy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#smb_security_strategy StoragegatewayGateway#smb_security_strategy}. This parameter is required.
         */
        public Builder smbSecurityStrategy(final java.lang.String smbSecurityStrategy) {
            this.config.smbSecurityStrategy(smbSecurityStrategy);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags StoragegatewayGateway#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags StoragegatewayGateway#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags_all StoragegatewayGateway#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tags_all StoragegatewayGateway#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tape_drive_type StoragegatewayGateway#tape_drive_type}.
         * <p>
         * @return {@code this}
         * @param tapeDriveType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#tape_drive_type StoragegatewayGateway#tape_drive_type}. This parameter is required.
         */
        public Builder tapeDriveType(final java.lang.String tapeDriveType) {
            this.config.tapeDriveType(tapeDriveType);
            return this;
        }

        /**
         * timeouts block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/storagegateway_gateway#timeouts StoragegatewayGateway#timeouts}
         * <p>
         * @return {@code this}
         * @param timeouts timeouts block. This parameter is required.
         */
        public Builder timeouts(final imports.aws.storagegateway_gateway.StoragegatewayGatewayTimeouts timeouts) {
            this.config.timeouts(timeouts);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.storagegateway_gateway.StoragegatewayGateway}.
         */
        @Override
        public imports.aws.storagegateway_gateway.StoragegatewayGateway build() {
            return new imports.aws.storagegateway_gateway.StoragegatewayGateway(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
