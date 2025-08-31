package imports.aws.vpn_connection;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection aws_vpn_connection}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.630Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpnConnection.VpnConnection")
public class VpnConnection extends com.hashicorp.cdktf.TerraformResource {

    protected VpnConnection(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected VpnConnection(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.vpn_connection.VpnConnection.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection aws_vpn_connection} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public VpnConnection(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a VpnConnection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpnConnection to import. This parameter is required.
     * @param importFromId The id of the existing VpnConnection that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the VpnConnection to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpn_connection.VpnConnection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a VpnConnection resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the VpnConnection to import. This parameter is required.
     * @param importFromId The id of the existing VpnConnection that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.vpn_connection.VpnConnection.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putTunnel1LogOptions(final @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions value) {
        software.amazon.jsii.Kernel.call(this, "putTunnel1LogOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putTunnel2LogOptions(final @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions value) {
        software.amazon.jsii.Kernel.call(this, "putTunnel2LogOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetEnableAcceleration() {
        software.amazon.jsii.Kernel.call(this, "resetEnableAcceleration", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocalIpv4NetworkCidr() {
        software.amazon.jsii.Kernel.call(this, "resetLocalIpv4NetworkCidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetLocalIpv6NetworkCidr() {
        software.amazon.jsii.Kernel.call(this, "resetLocalIpv6NetworkCidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetOutsideIpAddressType() {
        software.amazon.jsii.Kernel.call(this, "resetOutsideIpAddressType", software.amazon.jsii.NativeType.VOID);
    }

    public void resetPresharedKeyStorage() {
        software.amazon.jsii.Kernel.call(this, "resetPresharedKeyStorage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRemoteIpv4NetworkCidr() {
        software.amazon.jsii.Kernel.call(this, "resetRemoteIpv4NetworkCidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetRemoteIpv6NetworkCidr() {
        software.amazon.jsii.Kernel.call(this, "resetRemoteIpv6NetworkCidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetStaticRoutesOnly() {
        software.amazon.jsii.Kernel.call(this, "resetStaticRoutesOnly", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransitGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetTransitGatewayId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransportTransitGatewayAttachmentId() {
        software.amazon.jsii.Kernel.call(this, "resetTransportTransitGatewayAttachmentId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1DpdTimeoutAction() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1DpdTimeoutAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1DpdTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1DpdTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1EnableTunnelLifecycleControl() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1EnableTunnelLifecycleControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1IkeVersions() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1IkeVersions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1InsideCidr() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1InsideCidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1InsideIpv6Cidr() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1InsideIpv6Cidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1LogOptions() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1LogOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase1DhGroupNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase1DhGroupNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase1EncryptionAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase1EncryptionAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase1IntegrityAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase1IntegrityAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase1LifetimeSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase1LifetimeSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase2DhGroupNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase2DhGroupNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase2EncryptionAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase2EncryptionAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase2IntegrityAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase2IntegrityAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1Phase2LifetimeSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1Phase2LifetimeSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1PresharedKey() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1PresharedKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1RekeyFuzzPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1RekeyFuzzPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1RekeyMarginTimeSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1RekeyMarginTimeSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1ReplayWindowSize() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1ReplayWindowSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel1StartupAction() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel1StartupAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2DpdTimeoutAction() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2DpdTimeoutAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2DpdTimeoutSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2DpdTimeoutSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2EnableTunnelLifecycleControl() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2EnableTunnelLifecycleControl", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2IkeVersions() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2IkeVersions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2InsideCidr() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2InsideCidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2InsideIpv6Cidr() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2InsideIpv6Cidr", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2LogOptions() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2LogOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase1DhGroupNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase1DhGroupNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase1EncryptionAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase1EncryptionAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase1IntegrityAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase1IntegrityAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase1LifetimeSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase1LifetimeSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase2DhGroupNumbers() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase2DhGroupNumbers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase2EncryptionAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase2EncryptionAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase2IntegrityAlgorithms() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase2IntegrityAlgorithms", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2Phase2LifetimeSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2Phase2LifetimeSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2PresharedKey() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2PresharedKey", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2RekeyFuzzPercentage() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2RekeyFuzzPercentage", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2RekeyMarginTimeSeconds() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2RekeyMarginTimeSeconds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2ReplayWindowSize() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2ReplayWindowSize", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnel2StartupAction() {
        software.amazon.jsii.Kernel.call(this, "resetTunnel2StartupAction", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTunnelInsideIpVersion() {
        software.amazon.jsii.Kernel.call(this, "resetTunnelInsideIpVersion", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpnGatewayId() {
        software.amazon.jsii.Kernel.call(this, "resetVpnGatewayId", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull java.lang.String getCoreNetworkArn() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCoreNetworkAttachmentArn() {
        return software.amazon.jsii.Kernel.get(this, "coreNetworkAttachmentArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerGatewayConfiguration() {
        return software.amazon.jsii.Kernel.get(this, "customerGatewayConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPresharedKeyArn() {
        return software.amazon.jsii.Kernel.get(this, "presharedKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionRoutesList getRoutes() {
        return software.amazon.jsii.Kernel.get(this, "routes", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionRoutesList.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayAttachmentId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1Address() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1Address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1BgpAsn() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1BgpAsn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel1BgpHoldtime() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1BgpHoldtime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1CgwInsideAddress() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1CgwInsideAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsOutputReference getTunnel1LogOptions() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1LogOptions", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel1LogOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1VgwInsideAddress() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1VgwInsideAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2Address() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2Address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2BgpAsn() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2BgpAsn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel2BgpHoldtime() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2BgpHoldtime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2CgwInsideAddress() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2CgwInsideAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsOutputReference getTunnel2LogOptions() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2LogOptions", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2VgwInsideAddress() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2VgwInsideAddress", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.vpn_connection.VpnConnectionVgwTelemetryList getVgwTelemetry() {
        return software.amazon.jsii.Kernel.get(this, "vgwTelemetry", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionVgwTelemetryList.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getCustomerGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "customerGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getEnableAccelerationInput() {
        return software.amazon.jsii.Kernel.get(this, "enableAccelerationInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalIpv4NetworkCidrInput() {
        return software.amazon.jsii.Kernel.get(this, "localIpv4NetworkCidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getLocalIpv6NetworkCidrInput() {
        return software.amazon.jsii.Kernel.get(this, "localIpv6NetworkCidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getOutsideIpAddressTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "outsideIpAddressTypeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getPresharedKeyStorageInput() {
        return software.amazon.jsii.Kernel.get(this, "presharedKeyStorageInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRemoteIpv4NetworkCidrInput() {
        return software.amazon.jsii.Kernel.get(this, "remoteIpv4NetworkCidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getRemoteIpv6NetworkCidrInput() {
        return software.amazon.jsii.Kernel.get(this, "remoteIpv6NetworkCidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getStaticRoutesOnlyInput() {
        return software.amazon.jsii.Kernel.get(this, "staticRoutesOnlyInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransportTransitGatewayAttachmentIdInput() {
        return software.amazon.jsii.Kernel.get(this, "transportTransitGatewayAttachmentIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel1DpdTimeoutActionInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1DpdTimeoutActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1DpdTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1DpdTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTunnel1EnableTunnelLifecycleControlInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1EnableTunnelLifecycleControlInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1IkeVersionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel1IkeVersionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel1InsideCidrInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1InsideCidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel1InsideIpv6CidrInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1InsideIpv6CidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions getTunnel1LogOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1LogOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel1Phase1DhGroupNumbersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "tunnel1Phase1DhGroupNumbersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase1EncryptionAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel1Phase1EncryptionAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase1IntegrityAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel1Phase1IntegrityAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1Phase1LifetimeSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1Phase1LifetimeSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel1Phase2DhGroupNumbersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "tunnel1Phase2DhGroupNumbersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase2EncryptionAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel1Phase2EncryptionAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase2IntegrityAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel1Phase2IntegrityAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1Phase2LifetimeSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1Phase2LifetimeSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel1PresharedKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1PresharedKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1RekeyFuzzPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1RekeyFuzzPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1RekeyMarginTimeSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1RekeyMarginTimeSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1ReplayWindowSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1ReplayWindowSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel1StartupActionInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1StartupActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel2DpdTimeoutActionInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2DpdTimeoutActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2DpdTimeoutSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2DpdTimeoutSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getTunnel2EnableTunnelLifecycleControlInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2EnableTunnelLifecycleControlInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2IkeVersionsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel2IkeVersionsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel2InsideCidrInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2InsideCidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel2InsideIpv6CidrInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2InsideIpv6CidrInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions getTunnel2LogOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2LogOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel2Phase1DhGroupNumbersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "tunnel2Phase1DhGroupNumbersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase1EncryptionAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel2Phase1EncryptionAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase1IntegrityAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel2Phase1IntegrityAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2Phase1LifetimeSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2Phase1LifetimeSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel2Phase2DhGroupNumbersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.Number>)(software.amazon.jsii.Kernel.get(this, "tunnel2Phase2DhGroupNumbersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase2EncryptionAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel2Phase2EncryptionAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase2IntegrityAlgorithmsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tunnel2Phase2IntegrityAlgorithmsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2Phase2LifetimeSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2Phase2LifetimeSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel2PresharedKeyInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2PresharedKeyInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2RekeyFuzzPercentageInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2RekeyFuzzPercentageInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2RekeyMarginTimeSecondsInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2RekeyMarginTimeSecondsInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2ReplayWindowSizeInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2ReplayWindowSizeInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnel2StartupActionInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2StartupActionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTunnelInsideIpVersionInput() {
        return software.amazon.jsii.Kernel.get(this, "tunnelInsideIpVersionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTypeInput() {
        return software.amazon.jsii.Kernel.get(this, "typeInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpnGatewayIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpnGatewayIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getCustomerGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "customerGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setCustomerGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "customerGatewayId", java.util.Objects.requireNonNull(value, "customerGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getEnableAcceleration() {
        return software.amazon.jsii.Kernel.get(this, "enableAcceleration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setEnableAcceleration(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "enableAcceleration", java.util.Objects.requireNonNull(value, "enableAcceleration is required"));
    }

    public void setEnableAcceleration(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "enableAcceleration", java.util.Objects.requireNonNull(value, "enableAcceleration is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalIpv4NetworkCidr() {
        return software.amazon.jsii.Kernel.get(this, "localIpv4NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalIpv4NetworkCidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localIpv4NetworkCidr", java.util.Objects.requireNonNull(value, "localIpv4NetworkCidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getLocalIpv6NetworkCidr() {
        return software.amazon.jsii.Kernel.get(this, "localIpv6NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setLocalIpv6NetworkCidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "localIpv6NetworkCidr", java.util.Objects.requireNonNull(value, "localIpv6NetworkCidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getOutsideIpAddressType() {
        return software.amazon.jsii.Kernel.get(this, "outsideIpAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setOutsideIpAddressType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "outsideIpAddressType", java.util.Objects.requireNonNull(value, "outsideIpAddressType is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getPresharedKeyStorage() {
        return software.amazon.jsii.Kernel.get(this, "presharedKeyStorage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setPresharedKeyStorage(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "presharedKeyStorage", java.util.Objects.requireNonNull(value, "presharedKeyStorage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRemoteIpv4NetworkCidr() {
        return software.amazon.jsii.Kernel.get(this, "remoteIpv4NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRemoteIpv4NetworkCidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "remoteIpv4NetworkCidr", java.util.Objects.requireNonNull(value, "remoteIpv4NetworkCidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getRemoteIpv6NetworkCidr() {
        return software.amazon.jsii.Kernel.get(this, "remoteIpv6NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setRemoteIpv6NetworkCidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "remoteIpv6NetworkCidr", java.util.Objects.requireNonNull(value, "remoteIpv6NetworkCidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getStaticRoutesOnly() {
        return software.amazon.jsii.Kernel.get(this, "staticRoutesOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setStaticRoutesOnly(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "staticRoutesOnly", java.util.Objects.requireNonNull(value, "staticRoutesOnly is required"));
    }

    public void setStaticRoutesOnly(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "staticRoutesOnly", java.util.Objects.requireNonNull(value, "staticRoutesOnly is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransitGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transitGatewayId", java.util.Objects.requireNonNull(value, "transitGatewayId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTransportTransitGatewayAttachmentId() {
        return software.amazon.jsii.Kernel.get(this, "transportTransitGatewayAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransportTransitGatewayAttachmentId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transportTransitGatewayAttachmentId", java.util.Objects.requireNonNull(value, "transportTransitGatewayAttachmentId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1DpdTimeoutAction() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1DpdTimeoutAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel1DpdTimeoutAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1DpdTimeoutAction", java.util.Objects.requireNonNull(value, "tunnel1DpdTimeoutAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel1DpdTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1DpdTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel1DpdTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1DpdTimeoutSeconds", java.util.Objects.requireNonNull(value, "tunnel1DpdTimeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTunnel1EnableTunnelLifecycleControl() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1EnableTunnelLifecycleControl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTunnel1EnableTunnelLifecycleControl(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1EnableTunnelLifecycleControl", java.util.Objects.requireNonNull(value, "tunnel1EnableTunnelLifecycleControl is required"));
    }

    public void setTunnel1EnableTunnelLifecycleControl(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1EnableTunnelLifecycleControl", java.util.Objects.requireNonNull(value, "tunnel1EnableTunnelLifecycleControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel1IkeVersions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel1IkeVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel1IkeVersions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1IkeVersions", java.util.Objects.requireNonNull(value, "tunnel1IkeVersions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1InsideCidr() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1InsideCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel1InsideCidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1InsideCidr", java.util.Objects.requireNonNull(value, "tunnel1InsideCidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1InsideIpv6Cidr() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1InsideIpv6Cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel1InsideIpv6Cidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1InsideIpv6Cidr", java.util.Objects.requireNonNull(value, "tunnel1InsideIpv6Cidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getTunnel1Phase1DhGroupNumbers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel1Phase1DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setTunnel1Phase1DhGroupNumbers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase1DhGroupNumbers", java.util.Objects.requireNonNull(value, "tunnel1Phase1DhGroupNumbers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel1Phase1EncryptionAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel1Phase1EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel1Phase1EncryptionAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase1EncryptionAlgorithms", java.util.Objects.requireNonNull(value, "tunnel1Phase1EncryptionAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel1Phase1IntegrityAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel1Phase1IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel1Phase1IntegrityAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase1IntegrityAlgorithms", java.util.Objects.requireNonNull(value, "tunnel1Phase1IntegrityAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel1Phase1LifetimeSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1Phase1LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel1Phase1LifetimeSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase1LifetimeSeconds", java.util.Objects.requireNonNull(value, "tunnel1Phase1LifetimeSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getTunnel1Phase2DhGroupNumbers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel1Phase2DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setTunnel1Phase2DhGroupNumbers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase2DhGroupNumbers", java.util.Objects.requireNonNull(value, "tunnel1Phase2DhGroupNumbers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel1Phase2EncryptionAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel1Phase2EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel1Phase2EncryptionAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase2EncryptionAlgorithms", java.util.Objects.requireNonNull(value, "tunnel1Phase2EncryptionAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel1Phase2IntegrityAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel1Phase2IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel1Phase2IntegrityAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase2IntegrityAlgorithms", java.util.Objects.requireNonNull(value, "tunnel1Phase2IntegrityAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel1Phase2LifetimeSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1Phase2LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel1Phase2LifetimeSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1Phase2LifetimeSeconds", java.util.Objects.requireNonNull(value, "tunnel1Phase2LifetimeSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1PresharedKey() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1PresharedKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel1PresharedKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1PresharedKey", java.util.Objects.requireNonNull(value, "tunnel1PresharedKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel1RekeyFuzzPercentage() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1RekeyFuzzPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel1RekeyFuzzPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1RekeyFuzzPercentage", java.util.Objects.requireNonNull(value, "tunnel1RekeyFuzzPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel1RekeyMarginTimeSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1RekeyMarginTimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel1RekeyMarginTimeSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1RekeyMarginTimeSeconds", java.util.Objects.requireNonNull(value, "tunnel1RekeyMarginTimeSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel1ReplayWindowSize() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1ReplayWindowSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel1ReplayWindowSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1ReplayWindowSize", java.util.Objects.requireNonNull(value, "tunnel1ReplayWindowSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel1StartupAction() {
        return software.amazon.jsii.Kernel.get(this, "tunnel1StartupAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel1StartupAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel1StartupAction", java.util.Objects.requireNonNull(value, "tunnel1StartupAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2DpdTimeoutAction() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2DpdTimeoutAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel2DpdTimeoutAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2DpdTimeoutAction", java.util.Objects.requireNonNull(value, "tunnel2DpdTimeoutAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel2DpdTimeoutSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2DpdTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel2DpdTimeoutSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2DpdTimeoutSeconds", java.util.Objects.requireNonNull(value, "tunnel2DpdTimeoutSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getTunnel2EnableTunnelLifecycleControl() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2EnableTunnelLifecycleControl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setTunnel2EnableTunnelLifecycleControl(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2EnableTunnelLifecycleControl", java.util.Objects.requireNonNull(value, "tunnel2EnableTunnelLifecycleControl is required"));
    }

    public void setTunnel2EnableTunnelLifecycleControl(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2EnableTunnelLifecycleControl", java.util.Objects.requireNonNull(value, "tunnel2EnableTunnelLifecycleControl is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel2IkeVersions() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel2IkeVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel2IkeVersions(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2IkeVersions", java.util.Objects.requireNonNull(value, "tunnel2IkeVersions is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2InsideCidr() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2InsideCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel2InsideCidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2InsideCidr", java.util.Objects.requireNonNull(value, "tunnel2InsideCidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2InsideIpv6Cidr() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2InsideIpv6Cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel2InsideIpv6Cidr(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2InsideIpv6Cidr", java.util.Objects.requireNonNull(value, "tunnel2InsideIpv6Cidr is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getTunnel2Phase1DhGroupNumbers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel2Phase1DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setTunnel2Phase1DhGroupNumbers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase1DhGroupNumbers", java.util.Objects.requireNonNull(value, "tunnel2Phase1DhGroupNumbers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel2Phase1EncryptionAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel2Phase1EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel2Phase1EncryptionAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase1EncryptionAlgorithms", java.util.Objects.requireNonNull(value, "tunnel2Phase1EncryptionAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel2Phase1IntegrityAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel2Phase1IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel2Phase1IntegrityAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase1IntegrityAlgorithms", java.util.Objects.requireNonNull(value, "tunnel2Phase1IntegrityAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel2Phase1LifetimeSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2Phase1LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel2Phase1LifetimeSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase1LifetimeSeconds", java.util.Objects.requireNonNull(value, "tunnel2Phase1LifetimeSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> getTunnel2Phase2DhGroupNumbers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel2Phase2DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class))));
    }

    public void setTunnel2Phase2DhGroupNumbers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.Number> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase2DhGroupNumbers", java.util.Objects.requireNonNull(value, "tunnel2Phase2DhGroupNumbers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel2Phase2EncryptionAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel2Phase2EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel2Phase2EncryptionAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase2EncryptionAlgorithms", java.util.Objects.requireNonNull(value, "tunnel2Phase2EncryptionAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getTunnel2Phase2IntegrityAlgorithms() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "tunnel2Phase2IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setTunnel2Phase2IntegrityAlgorithms(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase2IntegrityAlgorithms", java.util.Objects.requireNonNull(value, "tunnel2Phase2IntegrityAlgorithms is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel2Phase2LifetimeSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2Phase2LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel2Phase2LifetimeSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2Phase2LifetimeSeconds", java.util.Objects.requireNonNull(value, "tunnel2Phase2LifetimeSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2PresharedKey() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2PresharedKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel2PresharedKey(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2PresharedKey", java.util.Objects.requireNonNull(value, "tunnel2PresharedKey is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel2RekeyFuzzPercentage() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2RekeyFuzzPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel2RekeyFuzzPercentage(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2RekeyFuzzPercentage", java.util.Objects.requireNonNull(value, "tunnel2RekeyFuzzPercentage is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel2RekeyMarginTimeSeconds() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2RekeyMarginTimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel2RekeyMarginTimeSeconds(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2RekeyMarginTimeSeconds", java.util.Objects.requireNonNull(value, "tunnel2RekeyMarginTimeSeconds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getTunnel2ReplayWindowSize() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2ReplayWindowSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setTunnel2ReplayWindowSize(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2ReplayWindowSize", java.util.Objects.requireNonNull(value, "tunnel2ReplayWindowSize is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnel2StartupAction() {
        return software.amazon.jsii.Kernel.get(this, "tunnel2StartupAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnel2StartupAction(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnel2StartupAction", java.util.Objects.requireNonNull(value, "tunnel2StartupAction is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getTunnelInsideIpVersion() {
        return software.amazon.jsii.Kernel.get(this, "tunnelInsideIpVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTunnelInsideIpVersion(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "tunnelInsideIpVersion", java.util.Objects.requireNonNull(value, "tunnelInsideIpVersion is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getType() {
        return software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setType(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "type", java.util.Objects.requireNonNull(value, "type is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpnGatewayId() {
        return software.amazon.jsii.Kernel.get(this, "vpnGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpnGatewayId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpnGatewayId", java.util.Objects.requireNonNull(value, "vpnGatewayId is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.vpn_connection.VpnConnection}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.vpn_connection.VpnConnection> {
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
        private final imports.aws.vpn_connection.VpnConnectionConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.vpn_connection.VpnConnectionConfig.Builder();
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
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#customer_gateway_id VpnConnection#customer_gateway_id}.
         * <p>
         * @return {@code this}
         * @param customerGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#customer_gateway_id VpnConnection#customer_gateway_id}. This parameter is required.
         */
        public Builder customerGatewayId(final java.lang.String customerGatewayId) {
            this.config.customerGatewayId(customerGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#type VpnConnection#type}.
         * <p>
         * @return {@code this}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#type VpnConnection#type}. This parameter is required.
         */
        public Builder type(final java.lang.String type) {
            this.config.type(type);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#enable_acceleration VpnConnection#enable_acceleration}.
         * <p>
         * @return {@code this}
         * @param enableAcceleration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#enable_acceleration VpnConnection#enable_acceleration}. This parameter is required.
         */
        public Builder enableAcceleration(final java.lang.Boolean enableAcceleration) {
            this.config.enableAcceleration(enableAcceleration);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#enable_acceleration VpnConnection#enable_acceleration}.
         * <p>
         * @return {@code this}
         * @param enableAcceleration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#enable_acceleration VpnConnection#enable_acceleration}. This parameter is required.
         */
        public Builder enableAcceleration(final com.hashicorp.cdktf.IResolvable enableAcceleration) {
            this.config.enableAcceleration(enableAcceleration);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#id VpnConnection#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#id VpnConnection#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv4_network_cidr VpnConnection#local_ipv4_network_cidr}.
         * <p>
         * @return {@code this}
         * @param localIpv4NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv4_network_cidr VpnConnection#local_ipv4_network_cidr}. This parameter is required.
         */
        public Builder localIpv4NetworkCidr(final java.lang.String localIpv4NetworkCidr) {
            this.config.localIpv4NetworkCidr(localIpv4NetworkCidr);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv6_network_cidr VpnConnection#local_ipv6_network_cidr}.
         * <p>
         * @return {@code this}
         * @param localIpv6NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv6_network_cidr VpnConnection#local_ipv6_network_cidr}. This parameter is required.
         */
        public Builder localIpv6NetworkCidr(final java.lang.String localIpv6NetworkCidr) {
            this.config.localIpv6NetworkCidr(localIpv6NetworkCidr);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#outside_ip_address_type VpnConnection#outside_ip_address_type}.
         * <p>
         * @return {@code this}
         * @param outsideIpAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#outside_ip_address_type VpnConnection#outside_ip_address_type}. This parameter is required.
         */
        public Builder outsideIpAddressType(final java.lang.String outsideIpAddressType) {
            this.config.outsideIpAddressType(outsideIpAddressType);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#preshared_key_storage VpnConnection#preshared_key_storage}.
         * <p>
         * @return {@code this}
         * @param presharedKeyStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#preshared_key_storage VpnConnection#preshared_key_storage}. This parameter is required.
         */
        public Builder presharedKeyStorage(final java.lang.String presharedKeyStorage) {
            this.config.presharedKeyStorage(presharedKeyStorage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv4_network_cidr VpnConnection#remote_ipv4_network_cidr}.
         * <p>
         * @return {@code this}
         * @param remoteIpv4NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv4_network_cidr VpnConnection#remote_ipv4_network_cidr}. This parameter is required.
         */
        public Builder remoteIpv4NetworkCidr(final java.lang.String remoteIpv4NetworkCidr) {
            this.config.remoteIpv4NetworkCidr(remoteIpv4NetworkCidr);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv6_network_cidr VpnConnection#remote_ipv6_network_cidr}.
         * <p>
         * @return {@code this}
         * @param remoteIpv6NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv6_network_cidr VpnConnection#remote_ipv6_network_cidr}. This parameter is required.
         */
        public Builder remoteIpv6NetworkCidr(final java.lang.String remoteIpv6NetworkCidr) {
            this.config.remoteIpv6NetworkCidr(remoteIpv6NetworkCidr);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#static_routes_only VpnConnection#static_routes_only}.
         * <p>
         * @return {@code this}
         * @param staticRoutesOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#static_routes_only VpnConnection#static_routes_only}. This parameter is required.
         */
        public Builder staticRoutesOnly(final java.lang.Boolean staticRoutesOnly) {
            this.config.staticRoutesOnly(staticRoutesOnly);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#static_routes_only VpnConnection#static_routes_only}.
         * <p>
         * @return {@code this}
         * @param staticRoutesOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#static_routes_only VpnConnection#static_routes_only}. This parameter is required.
         */
        public Builder staticRoutesOnly(final com.hashicorp.cdktf.IResolvable staticRoutesOnly) {
            this.config.staticRoutesOnly(staticRoutesOnly);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags VpnConnection#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags VpnConnection#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags_all VpnConnection#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags_all VpnConnection#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transit_gateway_id VpnConnection#transit_gateway_id}.
         * <p>
         * @return {@code this}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transit_gateway_id VpnConnection#transit_gateway_id}. This parameter is required.
         */
        public Builder transitGatewayId(final java.lang.String transitGatewayId) {
            this.config.transitGatewayId(transitGatewayId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transport_transit_gateway_attachment_id VpnConnection#transport_transit_gateway_attachment_id}.
         * <p>
         * @return {@code this}
         * @param transportTransitGatewayAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transport_transit_gateway_attachment_id VpnConnection#transport_transit_gateway_attachment_id}. This parameter is required.
         */
        public Builder transportTransitGatewayAttachmentId(final java.lang.String transportTransitGatewayAttachmentId) {
            this.config.transportTransitGatewayAttachmentId(transportTransitGatewayAttachmentId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_action VpnConnection#tunnel1_dpd_timeout_action}.
         * <p>
         * @return {@code this}
         * @param tunnel1DpdTimeoutAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_action VpnConnection#tunnel1_dpd_timeout_action}. This parameter is required.
         */
        public Builder tunnel1DpdTimeoutAction(final java.lang.String tunnel1DpdTimeoutAction) {
            this.config.tunnel1DpdTimeoutAction(tunnel1DpdTimeoutAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_seconds VpnConnection#tunnel1_dpd_timeout_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel1DpdTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_seconds VpnConnection#tunnel1_dpd_timeout_seconds}. This parameter is required.
         */
        public Builder tunnel1DpdTimeoutSeconds(final java.lang.Number tunnel1DpdTimeoutSeconds) {
            this.config.tunnel1DpdTimeoutSeconds(tunnel1DpdTimeoutSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_enable_tunnel_lifecycle_control VpnConnection#tunnel1_enable_tunnel_lifecycle_control}.
         * <p>
         * @return {@code this}
         * @param tunnel1EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_enable_tunnel_lifecycle_control VpnConnection#tunnel1_enable_tunnel_lifecycle_control}. This parameter is required.
         */
        public Builder tunnel1EnableTunnelLifecycleControl(final java.lang.Boolean tunnel1EnableTunnelLifecycleControl) {
            this.config.tunnel1EnableTunnelLifecycleControl(tunnel1EnableTunnelLifecycleControl);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_enable_tunnel_lifecycle_control VpnConnection#tunnel1_enable_tunnel_lifecycle_control}.
         * <p>
         * @return {@code this}
         * @param tunnel1EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_enable_tunnel_lifecycle_control VpnConnection#tunnel1_enable_tunnel_lifecycle_control}. This parameter is required.
         */
        public Builder tunnel1EnableTunnelLifecycleControl(final com.hashicorp.cdktf.IResolvable tunnel1EnableTunnelLifecycleControl) {
            this.config.tunnel1EnableTunnelLifecycleControl(tunnel1EnableTunnelLifecycleControl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_ike_versions VpnConnection#tunnel1_ike_versions}.
         * <p>
         * @return {@code this}
         * @param tunnel1IkeVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_ike_versions VpnConnection#tunnel1_ike_versions}. This parameter is required.
         */
        public Builder tunnel1IkeVersions(final java.util.List<java.lang.String> tunnel1IkeVersions) {
            this.config.tunnel1IkeVersions(tunnel1IkeVersions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_cidr VpnConnection#tunnel1_inside_cidr}.
         * <p>
         * @return {@code this}
         * @param tunnel1InsideCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_cidr VpnConnection#tunnel1_inside_cidr}. This parameter is required.
         */
        public Builder tunnel1InsideCidr(final java.lang.String tunnel1InsideCidr) {
            this.config.tunnel1InsideCidr(tunnel1InsideCidr);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_ipv6_cidr VpnConnection#tunnel1_inside_ipv6_cidr}.
         * <p>
         * @return {@code this}
         * @param tunnel1InsideIpv6Cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_ipv6_cidr VpnConnection#tunnel1_inside_ipv6_cidr}. This parameter is required.
         */
        public Builder tunnel1InsideIpv6Cidr(final java.lang.String tunnel1InsideIpv6Cidr) {
            this.config.tunnel1InsideIpv6Cidr(tunnel1InsideIpv6Cidr);
            return this;
        }

        /**
         * tunnel1_log_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_log_options VpnConnection#tunnel1_log_options}
         * <p>
         * @return {@code this}
         * @param tunnel1LogOptions tunnel1_log_options block. This parameter is required.
         */
        public Builder tunnel1LogOptions(final imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions tunnel1LogOptions) {
            this.config.tunnel1LogOptions(tunnel1LogOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_dh_group_numbers VpnConnection#tunnel1_phase1_dh_group_numbers}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase1DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_dh_group_numbers VpnConnection#tunnel1_phase1_dh_group_numbers}. This parameter is required.
         */
        public Builder tunnel1Phase1DhGroupNumbers(final java.util.List<? extends java.lang.Number> tunnel1Phase1DhGroupNumbers) {
            this.config.tunnel1Phase1DhGroupNumbers(tunnel1Phase1DhGroupNumbers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_encryption_algorithms VpnConnection#tunnel1_phase1_encryption_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase1EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_encryption_algorithms VpnConnection#tunnel1_phase1_encryption_algorithms}. This parameter is required.
         */
        public Builder tunnel1Phase1EncryptionAlgorithms(final java.util.List<java.lang.String> tunnel1Phase1EncryptionAlgorithms) {
            this.config.tunnel1Phase1EncryptionAlgorithms(tunnel1Phase1EncryptionAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_integrity_algorithms VpnConnection#tunnel1_phase1_integrity_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase1IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_integrity_algorithms VpnConnection#tunnel1_phase1_integrity_algorithms}. This parameter is required.
         */
        public Builder tunnel1Phase1IntegrityAlgorithms(final java.util.List<java.lang.String> tunnel1Phase1IntegrityAlgorithms) {
            this.config.tunnel1Phase1IntegrityAlgorithms(tunnel1Phase1IntegrityAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_lifetime_seconds VpnConnection#tunnel1_phase1_lifetime_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase1LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_lifetime_seconds VpnConnection#tunnel1_phase1_lifetime_seconds}. This parameter is required.
         */
        public Builder tunnel1Phase1LifetimeSeconds(final java.lang.Number tunnel1Phase1LifetimeSeconds) {
            this.config.tunnel1Phase1LifetimeSeconds(tunnel1Phase1LifetimeSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_dh_group_numbers VpnConnection#tunnel1_phase2_dh_group_numbers}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase2DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_dh_group_numbers VpnConnection#tunnel1_phase2_dh_group_numbers}. This parameter is required.
         */
        public Builder tunnel1Phase2DhGroupNumbers(final java.util.List<? extends java.lang.Number> tunnel1Phase2DhGroupNumbers) {
            this.config.tunnel1Phase2DhGroupNumbers(tunnel1Phase2DhGroupNumbers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_encryption_algorithms VpnConnection#tunnel1_phase2_encryption_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase2EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_encryption_algorithms VpnConnection#tunnel1_phase2_encryption_algorithms}. This parameter is required.
         */
        public Builder tunnel1Phase2EncryptionAlgorithms(final java.util.List<java.lang.String> tunnel1Phase2EncryptionAlgorithms) {
            this.config.tunnel1Phase2EncryptionAlgorithms(tunnel1Phase2EncryptionAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_integrity_algorithms VpnConnection#tunnel1_phase2_integrity_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase2IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_integrity_algorithms VpnConnection#tunnel1_phase2_integrity_algorithms}. This parameter is required.
         */
        public Builder tunnel1Phase2IntegrityAlgorithms(final java.util.List<java.lang.String> tunnel1Phase2IntegrityAlgorithms) {
            this.config.tunnel1Phase2IntegrityAlgorithms(tunnel1Phase2IntegrityAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_lifetime_seconds VpnConnection#tunnel1_phase2_lifetime_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel1Phase2LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_lifetime_seconds VpnConnection#tunnel1_phase2_lifetime_seconds}. This parameter is required.
         */
        public Builder tunnel1Phase2LifetimeSeconds(final java.lang.Number tunnel1Phase2LifetimeSeconds) {
            this.config.tunnel1Phase2LifetimeSeconds(tunnel1Phase2LifetimeSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_preshared_key VpnConnection#tunnel1_preshared_key}.
         * <p>
         * @return {@code this}
         * @param tunnel1PresharedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_preshared_key VpnConnection#tunnel1_preshared_key}. This parameter is required.
         */
        public Builder tunnel1PresharedKey(final java.lang.String tunnel1PresharedKey) {
            this.config.tunnel1PresharedKey(tunnel1PresharedKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_fuzz_percentage VpnConnection#tunnel1_rekey_fuzz_percentage}.
         * <p>
         * @return {@code this}
         * @param tunnel1RekeyFuzzPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_fuzz_percentage VpnConnection#tunnel1_rekey_fuzz_percentage}. This parameter is required.
         */
        public Builder tunnel1RekeyFuzzPercentage(final java.lang.Number tunnel1RekeyFuzzPercentage) {
            this.config.tunnel1RekeyFuzzPercentage(tunnel1RekeyFuzzPercentage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_margin_time_seconds VpnConnection#tunnel1_rekey_margin_time_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel1RekeyMarginTimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_margin_time_seconds VpnConnection#tunnel1_rekey_margin_time_seconds}. This parameter is required.
         */
        public Builder tunnel1RekeyMarginTimeSeconds(final java.lang.Number tunnel1RekeyMarginTimeSeconds) {
            this.config.tunnel1RekeyMarginTimeSeconds(tunnel1RekeyMarginTimeSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_replay_window_size VpnConnection#tunnel1_replay_window_size}.
         * <p>
         * @return {@code this}
         * @param tunnel1ReplayWindowSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_replay_window_size VpnConnection#tunnel1_replay_window_size}. This parameter is required.
         */
        public Builder tunnel1ReplayWindowSize(final java.lang.Number tunnel1ReplayWindowSize) {
            this.config.tunnel1ReplayWindowSize(tunnel1ReplayWindowSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_startup_action VpnConnection#tunnel1_startup_action}.
         * <p>
         * @return {@code this}
         * @param tunnel1StartupAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_startup_action VpnConnection#tunnel1_startup_action}. This parameter is required.
         */
        public Builder tunnel1StartupAction(final java.lang.String tunnel1StartupAction) {
            this.config.tunnel1StartupAction(tunnel1StartupAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_action VpnConnection#tunnel2_dpd_timeout_action}.
         * <p>
         * @return {@code this}
         * @param tunnel2DpdTimeoutAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_action VpnConnection#tunnel2_dpd_timeout_action}. This parameter is required.
         */
        public Builder tunnel2DpdTimeoutAction(final java.lang.String tunnel2DpdTimeoutAction) {
            this.config.tunnel2DpdTimeoutAction(tunnel2DpdTimeoutAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_seconds VpnConnection#tunnel2_dpd_timeout_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel2DpdTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_seconds VpnConnection#tunnel2_dpd_timeout_seconds}. This parameter is required.
         */
        public Builder tunnel2DpdTimeoutSeconds(final java.lang.Number tunnel2DpdTimeoutSeconds) {
            this.config.tunnel2DpdTimeoutSeconds(tunnel2DpdTimeoutSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_enable_tunnel_lifecycle_control VpnConnection#tunnel2_enable_tunnel_lifecycle_control}.
         * <p>
         * @return {@code this}
         * @param tunnel2EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_enable_tunnel_lifecycle_control VpnConnection#tunnel2_enable_tunnel_lifecycle_control}. This parameter is required.
         */
        public Builder tunnel2EnableTunnelLifecycleControl(final java.lang.Boolean tunnel2EnableTunnelLifecycleControl) {
            this.config.tunnel2EnableTunnelLifecycleControl(tunnel2EnableTunnelLifecycleControl);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_enable_tunnel_lifecycle_control VpnConnection#tunnel2_enable_tunnel_lifecycle_control}.
         * <p>
         * @return {@code this}
         * @param tunnel2EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_enable_tunnel_lifecycle_control VpnConnection#tunnel2_enable_tunnel_lifecycle_control}. This parameter is required.
         */
        public Builder tunnel2EnableTunnelLifecycleControl(final com.hashicorp.cdktf.IResolvable tunnel2EnableTunnelLifecycleControl) {
            this.config.tunnel2EnableTunnelLifecycleControl(tunnel2EnableTunnelLifecycleControl);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_ike_versions VpnConnection#tunnel2_ike_versions}.
         * <p>
         * @return {@code this}
         * @param tunnel2IkeVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_ike_versions VpnConnection#tunnel2_ike_versions}. This parameter is required.
         */
        public Builder tunnel2IkeVersions(final java.util.List<java.lang.String> tunnel2IkeVersions) {
            this.config.tunnel2IkeVersions(tunnel2IkeVersions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_cidr VpnConnection#tunnel2_inside_cidr}.
         * <p>
         * @return {@code this}
         * @param tunnel2InsideCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_cidr VpnConnection#tunnel2_inside_cidr}. This parameter is required.
         */
        public Builder tunnel2InsideCidr(final java.lang.String tunnel2InsideCidr) {
            this.config.tunnel2InsideCidr(tunnel2InsideCidr);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_ipv6_cidr VpnConnection#tunnel2_inside_ipv6_cidr}.
         * <p>
         * @return {@code this}
         * @param tunnel2InsideIpv6Cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_ipv6_cidr VpnConnection#tunnel2_inside_ipv6_cidr}. This parameter is required.
         */
        public Builder tunnel2InsideIpv6Cidr(final java.lang.String tunnel2InsideIpv6Cidr) {
            this.config.tunnel2InsideIpv6Cidr(tunnel2InsideIpv6Cidr);
            return this;
        }

        /**
         * tunnel2_log_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_log_options VpnConnection#tunnel2_log_options}
         * <p>
         * @return {@code this}
         * @param tunnel2LogOptions tunnel2_log_options block. This parameter is required.
         */
        public Builder tunnel2LogOptions(final imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions tunnel2LogOptions) {
            this.config.tunnel2LogOptions(tunnel2LogOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_dh_group_numbers VpnConnection#tunnel2_phase1_dh_group_numbers}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase1DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_dh_group_numbers VpnConnection#tunnel2_phase1_dh_group_numbers}. This parameter is required.
         */
        public Builder tunnel2Phase1DhGroupNumbers(final java.util.List<? extends java.lang.Number> tunnel2Phase1DhGroupNumbers) {
            this.config.tunnel2Phase1DhGroupNumbers(tunnel2Phase1DhGroupNumbers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_encryption_algorithms VpnConnection#tunnel2_phase1_encryption_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase1EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_encryption_algorithms VpnConnection#tunnel2_phase1_encryption_algorithms}. This parameter is required.
         */
        public Builder tunnel2Phase1EncryptionAlgorithms(final java.util.List<java.lang.String> tunnel2Phase1EncryptionAlgorithms) {
            this.config.tunnel2Phase1EncryptionAlgorithms(tunnel2Phase1EncryptionAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_integrity_algorithms VpnConnection#tunnel2_phase1_integrity_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase1IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_integrity_algorithms VpnConnection#tunnel2_phase1_integrity_algorithms}. This parameter is required.
         */
        public Builder tunnel2Phase1IntegrityAlgorithms(final java.util.List<java.lang.String> tunnel2Phase1IntegrityAlgorithms) {
            this.config.tunnel2Phase1IntegrityAlgorithms(tunnel2Phase1IntegrityAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_lifetime_seconds VpnConnection#tunnel2_phase1_lifetime_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase1LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_lifetime_seconds VpnConnection#tunnel2_phase1_lifetime_seconds}. This parameter is required.
         */
        public Builder tunnel2Phase1LifetimeSeconds(final java.lang.Number tunnel2Phase1LifetimeSeconds) {
            this.config.tunnel2Phase1LifetimeSeconds(tunnel2Phase1LifetimeSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_dh_group_numbers VpnConnection#tunnel2_phase2_dh_group_numbers}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase2DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_dh_group_numbers VpnConnection#tunnel2_phase2_dh_group_numbers}. This parameter is required.
         */
        public Builder tunnel2Phase2DhGroupNumbers(final java.util.List<? extends java.lang.Number> tunnel2Phase2DhGroupNumbers) {
            this.config.tunnel2Phase2DhGroupNumbers(tunnel2Phase2DhGroupNumbers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_encryption_algorithms VpnConnection#tunnel2_phase2_encryption_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase2EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_encryption_algorithms VpnConnection#tunnel2_phase2_encryption_algorithms}. This parameter is required.
         */
        public Builder tunnel2Phase2EncryptionAlgorithms(final java.util.List<java.lang.String> tunnel2Phase2EncryptionAlgorithms) {
            this.config.tunnel2Phase2EncryptionAlgorithms(tunnel2Phase2EncryptionAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_integrity_algorithms VpnConnection#tunnel2_phase2_integrity_algorithms}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase2IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_integrity_algorithms VpnConnection#tunnel2_phase2_integrity_algorithms}. This parameter is required.
         */
        public Builder tunnel2Phase2IntegrityAlgorithms(final java.util.List<java.lang.String> tunnel2Phase2IntegrityAlgorithms) {
            this.config.tunnel2Phase2IntegrityAlgorithms(tunnel2Phase2IntegrityAlgorithms);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_lifetime_seconds VpnConnection#tunnel2_phase2_lifetime_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel2Phase2LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_lifetime_seconds VpnConnection#tunnel2_phase2_lifetime_seconds}. This parameter is required.
         */
        public Builder tunnel2Phase2LifetimeSeconds(final java.lang.Number tunnel2Phase2LifetimeSeconds) {
            this.config.tunnel2Phase2LifetimeSeconds(tunnel2Phase2LifetimeSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_preshared_key VpnConnection#tunnel2_preshared_key}.
         * <p>
         * @return {@code this}
         * @param tunnel2PresharedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_preshared_key VpnConnection#tunnel2_preshared_key}. This parameter is required.
         */
        public Builder tunnel2PresharedKey(final java.lang.String tunnel2PresharedKey) {
            this.config.tunnel2PresharedKey(tunnel2PresharedKey);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_fuzz_percentage VpnConnection#tunnel2_rekey_fuzz_percentage}.
         * <p>
         * @return {@code this}
         * @param tunnel2RekeyFuzzPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_fuzz_percentage VpnConnection#tunnel2_rekey_fuzz_percentage}. This parameter is required.
         */
        public Builder tunnel2RekeyFuzzPercentage(final java.lang.Number tunnel2RekeyFuzzPercentage) {
            this.config.tunnel2RekeyFuzzPercentage(tunnel2RekeyFuzzPercentage);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_margin_time_seconds VpnConnection#tunnel2_rekey_margin_time_seconds}.
         * <p>
         * @return {@code this}
         * @param tunnel2RekeyMarginTimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_margin_time_seconds VpnConnection#tunnel2_rekey_margin_time_seconds}. This parameter is required.
         */
        public Builder tunnel2RekeyMarginTimeSeconds(final java.lang.Number tunnel2RekeyMarginTimeSeconds) {
            this.config.tunnel2RekeyMarginTimeSeconds(tunnel2RekeyMarginTimeSeconds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_replay_window_size VpnConnection#tunnel2_replay_window_size}.
         * <p>
         * @return {@code this}
         * @param tunnel2ReplayWindowSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_replay_window_size VpnConnection#tunnel2_replay_window_size}. This parameter is required.
         */
        public Builder tunnel2ReplayWindowSize(final java.lang.Number tunnel2ReplayWindowSize) {
            this.config.tunnel2ReplayWindowSize(tunnel2ReplayWindowSize);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_startup_action VpnConnection#tunnel2_startup_action}.
         * <p>
         * @return {@code this}
         * @param tunnel2StartupAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_startup_action VpnConnection#tunnel2_startup_action}. This parameter is required.
         */
        public Builder tunnel2StartupAction(final java.lang.String tunnel2StartupAction) {
            this.config.tunnel2StartupAction(tunnel2StartupAction);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel_inside_ip_version VpnConnection#tunnel_inside_ip_version}.
         * <p>
         * @return {@code this}
         * @param tunnelInsideIpVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel_inside_ip_version VpnConnection#tunnel_inside_ip_version}. This parameter is required.
         */
        public Builder tunnelInsideIpVersion(final java.lang.String tunnelInsideIpVersion) {
            this.config.tunnelInsideIpVersion(tunnelInsideIpVersion);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#vpn_gateway_id VpnConnection#vpn_gateway_id}.
         * <p>
         * @return {@code this}
         * @param vpnGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#vpn_gateway_id VpnConnection#vpn_gateway_id}. This parameter is required.
         */
        public Builder vpnGatewayId(final java.lang.String vpnGatewayId) {
            this.config.vpnGatewayId(vpnGatewayId);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.vpn_connection.VpnConnection}.
         */
        @Override
        public imports.aws.vpn_connection.VpnConnection build() {
            return new imports.aws.vpn_connection.VpnConnection(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
