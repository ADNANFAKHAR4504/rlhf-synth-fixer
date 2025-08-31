package imports.aws.ec2_client_vpn_endpoint;

/**
 * Represents a {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint aws_ec2_client_vpn_endpoint}.
 */
@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.072Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2ClientVpnEndpoint.Ec2ClientVpnEndpoint")
public class Ec2ClientVpnEndpoint extends com.hashicorp.cdktf.TerraformResource {

    protected Ec2ClientVpnEndpoint(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected Ec2ClientVpnEndpoint(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    static {
        TF_RESOURCE_TYPE = software.amazon.jsii.JsiiObject.jsiiStaticGet(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint.class, "tfResourceType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    /**
     * Create a new {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint aws_ec2_client_vpn_endpoint} Resource.
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param id The scoped construct ID. This parameter is required.
     * @param config This parameter is required.
     */
    public Ec2ClientVpnEndpoint(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String id, final @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConfig config) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(id, "id is required"), java.util.Objects.requireNonNull(config, "config is required") });
    }

    /**
     * Generates CDKTF code for importing a Ec2ClientVpnEndpoint resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2ClientVpnEndpoint to import. This parameter is required.
     * @param importFromId The id of the existing Ec2ClientVpnEndpoint that should be imported. This parameter is required.
     * @param provider ? Optional instance of the provider where the Ec2ClientVpnEndpoint to import is found.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId, final @org.jetbrains.annotations.Nullable com.hashicorp.cdktf.TerraformProvider provider) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required"), provider });
    }

    /**
     * Generates CDKTF code for importing a Ec2ClientVpnEndpoint resource upon running "cdktf plan <stack-name>".
     * <p>
     * @param scope The scope in which to define this construct. This parameter is required.
     * @param importToId The construct id used in the generated config for the Ec2ClientVpnEndpoint to import. This parameter is required.
     * @param importFromId The id of the existing Ec2ClientVpnEndpoint that should be imported. This parameter is required.
     */
    public static @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.ImportableResource generateConfigForImport(final @org.jetbrains.annotations.NotNull software.constructs.Construct scope, final @org.jetbrains.annotations.NotNull java.lang.String importToId, final @org.jetbrains.annotations.NotNull java.lang.String importFromId) {
        return software.amazon.jsii.JsiiObject.jsiiStaticCall(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint.class, "generateConfigForImport", software.amazon.jsii.NativeType.forClass(com.hashicorp.cdktf.ImportableResource.class), new Object[] { java.util.Objects.requireNonNull(scope, "scope is required"), java.util.Objects.requireNonNull(importToId, "importToId is required"), java.util.Objects.requireNonNull(importFromId, "importFromId is required") });
    }

    public void putAuthenticationOptions(final @org.jetbrains.annotations.NotNull java.lang.Object value) {
        if (software.amazon.jsii.Configuration.getRuntimeTypeChecking()) {
            if (
                 !(value instanceof com.hashicorp.cdktf.IResolvable)
                && !(value instanceof java.util.List)
                && !(value.getClass().equals(software.amazon.jsii.JsiiObject.class))
            ) {
                throw new IllegalArgumentException(
                    new java.lang.StringBuilder("Expected ")
                        .append("value")
                        .append(" to be one of: com.hashicorp.cdktf.IResolvable, java.util.List<imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptions>; received ")
                        .append(value.getClass()).toString());
            }
            if (value instanceof java.util.List) {
                @SuppressWarnings("unchecked")
                final java.util.List<imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptions> __cast_cd4240 = (java.util.List<imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptions>)value;
                for (int __idx_ac66f0 = 0; __idx_ac66f0 < __cast_cd4240.size(); __idx_ac66f0++) {
                    final imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptions __val_ac66f0 = __cast_cd4240.get(__idx_ac66f0);
                }
            }
        }
        software.amazon.jsii.Kernel.call(this, "putAuthenticationOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putClientConnectOptions(final @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptions value) {
        software.amazon.jsii.Kernel.call(this, "putClientConnectOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putClientLoginBannerOptions(final @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientLoginBannerOptions value) {
        software.amazon.jsii.Kernel.call(this, "putClientLoginBannerOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putClientRouteEnforcementOptions(final @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptions value) {
        software.amazon.jsii.Kernel.call(this, "putClientRouteEnforcementOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void putConnectionLogOptions(final @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConnectionLogOptions value) {
        software.amazon.jsii.Kernel.call(this, "putConnectionLogOptions", software.amazon.jsii.NativeType.VOID, new Object[] { java.util.Objects.requireNonNull(value, "value is required") });
    }

    public void resetClientConnectOptions() {
        software.amazon.jsii.Kernel.call(this, "resetClientConnectOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientLoginBannerOptions() {
        software.amazon.jsii.Kernel.call(this, "resetClientLoginBannerOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetClientRouteEnforcementOptions() {
        software.amazon.jsii.Kernel.call(this, "resetClientRouteEnforcementOptions", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDescription() {
        software.amazon.jsii.Kernel.call(this, "resetDescription", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDisconnectOnSessionTimeout() {
        software.amazon.jsii.Kernel.call(this, "resetDisconnectOnSessionTimeout", software.amazon.jsii.NativeType.VOID);
    }

    public void resetDnsServers() {
        software.amazon.jsii.Kernel.call(this, "resetDnsServers", software.amazon.jsii.NativeType.VOID);
    }

    public void resetId() {
        software.amazon.jsii.Kernel.call(this, "resetId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSecurityGroupIds() {
        software.amazon.jsii.Kernel.call(this, "resetSecurityGroupIds", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSelfServicePortal() {
        software.amazon.jsii.Kernel.call(this, "resetSelfServicePortal", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSessionTimeoutHours() {
        software.amazon.jsii.Kernel.call(this, "resetSessionTimeoutHours", software.amazon.jsii.NativeType.VOID);
    }

    public void resetSplitTunnel() {
        software.amazon.jsii.Kernel.call(this, "resetSplitTunnel", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTags() {
        software.amazon.jsii.Kernel.call(this, "resetTags", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTagsAll() {
        software.amazon.jsii.Kernel.call(this, "resetTagsAll", software.amazon.jsii.NativeType.VOID);
    }

    public void resetTransportProtocol() {
        software.amazon.jsii.Kernel.call(this, "resetTransportProtocol", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpcId() {
        software.amazon.jsii.Kernel.call(this, "resetVpcId", software.amazon.jsii.NativeType.VOID);
    }

    public void resetVpnPort() {
        software.amazon.jsii.Kernel.call(this, "resetVpnPort", software.amazon.jsii.NativeType.VOID);
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

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptionsList getAuthenticationOptions() {
        return software.amazon.jsii.Kernel.get(this, "authenticationOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptionsList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptionsOutputReference getClientConnectOptions() {
        return software.amazon.jsii.Kernel.get(this, "clientConnectOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientLoginBannerOptionsOutputReference getClientLoginBannerOptions() {
        return software.amazon.jsii.Kernel.get(this, "clientLoginBannerOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientLoginBannerOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptionsOutputReference getClientRouteEnforcementOptions() {
        return software.amazon.jsii.Kernel.get(this, "clientRouteEnforcementOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConnectionLogOptionsOutputReference getConnectionLogOptions() {
        return software.amazon.jsii.Kernel.get(this, "connectionLogOptions", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConnectionLogOptionsOutputReference.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDnsName() {
        return software.amazon.jsii.Kernel.get(this, "dnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSelfServicePortalUrl() {
        return software.amazon.jsii.Kernel.get(this, "selfServicePortalUrl", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getAuthenticationOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "authenticationOptionsInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getClientCidrBlockInput() {
        return software.amazon.jsii.Kernel.get(this, "clientCidrBlockInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptions getClientConnectOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "clientConnectOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientLoginBannerOptions getClientLoginBannerOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "clientLoginBannerOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientLoginBannerOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptions getClientRouteEnforcementOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "clientRouteEnforcementOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptions.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConnectionLogOptions getConnectionLogOptionsInput() {
        return software.amazon.jsii.Kernel.get(this, "connectionLogOptionsInput", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConnectionLogOptions.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getDescriptionInput() {
        return software.amazon.jsii.Kernel.get(this, "descriptionInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getDisconnectOnSessionTimeoutInput() {
        return software.amazon.jsii.Kernel.get(this, "disconnectOnSessionTimeoutInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDnsServersInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "dnsServersInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getIdInput() {
        return software.amazon.jsii.Kernel.get(this, "idInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIdsInput() {
        return java.util.Optional.ofNullable((java.util.List<java.lang.String>)(software.amazon.jsii.Kernel.get(this, "securityGroupIdsInput", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableList).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getSelfServicePortalInput() {
        return software.amazon.jsii.Kernel.get(this, "selfServicePortalInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getServerCertificateArnInput() {
        return software.amazon.jsii.Kernel.get(this, "serverCertificateArnInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getSessionTimeoutHoursInput() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeoutHoursInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Object getSplitTunnelInput() {
        return software.amazon.jsii.Kernel.get(this, "splitTunnelInput", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAllInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsAllInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsInput() {
        return java.util.Optional.ofNullable((java.util.Map<java.lang.String, java.lang.String>)(software.amazon.jsii.Kernel.get(this, "tagsInput", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))))).map(java.util.Collections::unmodifiableMap).orElse(null);
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getTransportProtocolInput() {
        return software.amazon.jsii.Kernel.get(this, "transportProtocolInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.String getVpcIdInput() {
        return software.amazon.jsii.Kernel.get(this, "vpcIdInput", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public @org.jetbrains.annotations.Nullable java.lang.Number getVpnPortInput() {
        return software.amazon.jsii.Kernel.get(this, "vpnPortInput", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getClientCidrBlock() {
        return software.amazon.jsii.Kernel.get(this, "clientCidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setClientCidrBlock(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "clientCidrBlock", java.util.Objects.requireNonNull(value, "clientCidrBlock is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getDescription() {
        return software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setDescription(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "description", java.util.Objects.requireNonNull(value, "description is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getDisconnectOnSessionTimeout() {
        return software.amazon.jsii.Kernel.get(this, "disconnectOnSessionTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setDisconnectOnSessionTimeout(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "disconnectOnSessionTimeout", java.util.Objects.requireNonNull(value, "disconnectOnSessionTimeout is required"));
    }

    public void setDisconnectOnSessionTimeout(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "disconnectOnSessionTimeout", java.util.Objects.requireNonNull(value, "disconnectOnSessionTimeout is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getDnsServers() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "dnsServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setDnsServers(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "dnsServers", java.util.Objects.requireNonNull(value, "dnsServers is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getId() {
        return software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "id", java.util.Objects.requireNonNull(value, "id is required"));
    }

    public @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSecurityGroupIds() {
        return java.util.Collections.unmodifiableList(software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class))));
    }

    public void setSecurityGroupIds(final @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> value) {
        software.amazon.jsii.Kernel.set(this, "securityGroupIds", java.util.Objects.requireNonNull(value, "securityGroupIds is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getSelfServicePortal() {
        return software.amazon.jsii.Kernel.get(this, "selfServicePortal", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setSelfServicePortal(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "selfServicePortal", java.util.Objects.requireNonNull(value, "selfServicePortal is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getServerCertificateArn() {
        return software.amazon.jsii.Kernel.get(this, "serverCertificateArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setServerCertificateArn(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "serverCertificateArn", java.util.Objects.requireNonNull(value, "serverCertificateArn is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getSessionTimeoutHours() {
        return software.amazon.jsii.Kernel.get(this, "sessionTimeoutHours", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setSessionTimeoutHours(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "sessionTimeoutHours", java.util.Objects.requireNonNull(value, "sessionTimeoutHours is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Object getSplitTunnel() {
        return software.amazon.jsii.Kernel.get(this, "splitTunnel", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
    }

    public void setSplitTunnel(final @org.jetbrains.annotations.NotNull java.lang.Boolean value) {
        software.amazon.jsii.Kernel.set(this, "splitTunnel", java.util.Objects.requireNonNull(value, "splitTunnel is required"));
    }

    public void setSplitTunnel(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IResolvable value) {
        software.amazon.jsii.Kernel.set(this, "splitTunnel", java.util.Objects.requireNonNull(value, "splitTunnel is required"));
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

    public @org.jetbrains.annotations.NotNull java.lang.String getTransportProtocol() {
        return software.amazon.jsii.Kernel.get(this, "transportProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setTransportProtocol(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "transportProtocol", java.util.Objects.requireNonNull(value, "transportProtocol is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.String getVpcId() {
        return software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
    }

    public void setVpcId(final @org.jetbrains.annotations.NotNull java.lang.String value) {
        software.amazon.jsii.Kernel.set(this, "vpcId", java.util.Objects.requireNonNull(value, "vpcId is required"));
    }

    public @org.jetbrains.annotations.NotNull java.lang.Number getVpnPort() {
        return software.amazon.jsii.Kernel.get(this, "vpnPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
    }

    public void setVpnPort(final @org.jetbrains.annotations.NotNull java.lang.Number value) {
        software.amazon.jsii.Kernel.set(this, "vpnPort", java.util.Objects.requireNonNull(value, "vpnPort is required"));
    }

    /**
     * A fluent builder for {@link imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint}.
     */
    public static final class Builder implements software.amazon.jsii.Builder<imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint> {
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
        private final imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConfig.Builder config;

        private Builder(final software.constructs.Construct scope, final java.lang.String id) {
            this.scope = scope;
            this.id = id;
            this.config = new imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConfig.Builder();
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
         * authentication_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#authentication_options Ec2ClientVpnEndpoint#authentication_options}
         * <p>
         * @return {@code this}
         * @param authenticationOptions authentication_options block. This parameter is required.
         */
        public Builder authenticationOptions(final com.hashicorp.cdktf.IResolvable authenticationOptions) {
            this.config.authenticationOptions(authenticationOptions);
            return this;
        }
        /**
         * authentication_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#authentication_options Ec2ClientVpnEndpoint#authentication_options}
         * <p>
         * @return {@code this}
         * @param authenticationOptions authentication_options block. This parameter is required.
         */
        public Builder authenticationOptions(final java.util.List<? extends imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointAuthenticationOptions> authenticationOptions) {
            this.config.authenticationOptions(authenticationOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#client_cidr_block Ec2ClientVpnEndpoint#client_cidr_block}.
         * <p>
         * @return {@code this}
         * @param clientCidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#client_cidr_block Ec2ClientVpnEndpoint#client_cidr_block}. This parameter is required.
         */
        public Builder clientCidrBlock(final java.lang.String clientCidrBlock) {
            this.config.clientCidrBlock(clientCidrBlock);
            return this;
        }

        /**
         * connection_log_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#connection_log_options Ec2ClientVpnEndpoint#connection_log_options}
         * <p>
         * @return {@code this}
         * @param connectionLogOptions connection_log_options block. This parameter is required.
         */
        public Builder connectionLogOptions(final imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointConnectionLogOptions connectionLogOptions) {
            this.config.connectionLogOptions(connectionLogOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#server_certificate_arn Ec2ClientVpnEndpoint#server_certificate_arn}.
         * <p>
         * @return {@code this}
         * @param serverCertificateArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#server_certificate_arn Ec2ClientVpnEndpoint#server_certificate_arn}. This parameter is required.
         */
        public Builder serverCertificateArn(final java.lang.String serverCertificateArn) {
            this.config.serverCertificateArn(serverCertificateArn);
            return this;
        }

        /**
         * client_connect_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#client_connect_options Ec2ClientVpnEndpoint#client_connect_options}
         * <p>
         * @return {@code this}
         * @param clientConnectOptions client_connect_options block. This parameter is required.
         */
        public Builder clientConnectOptions(final imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientConnectOptions clientConnectOptions) {
            this.config.clientConnectOptions(clientConnectOptions);
            return this;
        }

        /**
         * client_login_banner_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#client_login_banner_options Ec2ClientVpnEndpoint#client_login_banner_options}
         * <p>
         * @return {@code this}
         * @param clientLoginBannerOptions client_login_banner_options block. This parameter is required.
         */
        public Builder clientLoginBannerOptions(final imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientLoginBannerOptions clientLoginBannerOptions) {
            this.config.clientLoginBannerOptions(clientLoginBannerOptions);
            return this;
        }

        /**
         * client_route_enforcement_options block.
         * <p>
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#client_route_enforcement_options Ec2ClientVpnEndpoint#client_route_enforcement_options}
         * <p>
         * @return {@code this}
         * @param clientRouteEnforcementOptions client_route_enforcement_options block. This parameter is required.
         */
        public Builder clientRouteEnforcementOptions(final imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpointClientRouteEnforcementOptions clientRouteEnforcementOptions) {
            this.config.clientRouteEnforcementOptions(clientRouteEnforcementOptions);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#description Ec2ClientVpnEndpoint#description}.
         * <p>
         * @return {@code this}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#description Ec2ClientVpnEndpoint#description}. This parameter is required.
         */
        public Builder description(final java.lang.String description) {
            this.config.description(description);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#disconnect_on_session_timeout Ec2ClientVpnEndpoint#disconnect_on_session_timeout}.
         * <p>
         * @return {@code this}
         * @param disconnectOnSessionTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#disconnect_on_session_timeout Ec2ClientVpnEndpoint#disconnect_on_session_timeout}. This parameter is required.
         */
        public Builder disconnectOnSessionTimeout(final java.lang.Boolean disconnectOnSessionTimeout) {
            this.config.disconnectOnSessionTimeout(disconnectOnSessionTimeout);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#disconnect_on_session_timeout Ec2ClientVpnEndpoint#disconnect_on_session_timeout}.
         * <p>
         * @return {@code this}
         * @param disconnectOnSessionTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#disconnect_on_session_timeout Ec2ClientVpnEndpoint#disconnect_on_session_timeout}. This parameter is required.
         */
        public Builder disconnectOnSessionTimeout(final com.hashicorp.cdktf.IResolvable disconnectOnSessionTimeout) {
            this.config.disconnectOnSessionTimeout(disconnectOnSessionTimeout);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#dns_servers Ec2ClientVpnEndpoint#dns_servers}.
         * <p>
         * @return {@code this}
         * @param dnsServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#dns_servers Ec2ClientVpnEndpoint#dns_servers}. This parameter is required.
         */
        public Builder dnsServers(final java.util.List<java.lang.String> dnsServers) {
            this.config.dnsServers(dnsServers);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#id Ec2ClientVpnEndpoint#id}.
         * <p>
         * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * <p>
         * @return {@code this}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#id Ec2ClientVpnEndpoint#id}. This parameter is required.
         */
        public Builder id(final java.lang.String id) {
            this.config.id(id);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#security_group_ids Ec2ClientVpnEndpoint#security_group_ids}.
         * <p>
         * @return {@code this}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#security_group_ids Ec2ClientVpnEndpoint#security_group_ids}. This parameter is required.
         */
        public Builder securityGroupIds(final java.util.List<java.lang.String> securityGroupIds) {
            this.config.securityGroupIds(securityGroupIds);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#self_service_portal Ec2ClientVpnEndpoint#self_service_portal}.
         * <p>
         * @return {@code this}
         * @param selfServicePortal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#self_service_portal Ec2ClientVpnEndpoint#self_service_portal}. This parameter is required.
         */
        public Builder selfServicePortal(final java.lang.String selfServicePortal) {
            this.config.selfServicePortal(selfServicePortal);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#session_timeout_hours Ec2ClientVpnEndpoint#session_timeout_hours}.
         * <p>
         * @return {@code this}
         * @param sessionTimeoutHours Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#session_timeout_hours Ec2ClientVpnEndpoint#session_timeout_hours}. This parameter is required.
         */
        public Builder sessionTimeoutHours(final java.lang.Number sessionTimeoutHours) {
            this.config.sessionTimeoutHours(sessionTimeoutHours);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#split_tunnel Ec2ClientVpnEndpoint#split_tunnel}.
         * <p>
         * @return {@code this}
         * @param splitTunnel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#split_tunnel Ec2ClientVpnEndpoint#split_tunnel}. This parameter is required.
         */
        public Builder splitTunnel(final java.lang.Boolean splitTunnel) {
            this.config.splitTunnel(splitTunnel);
            return this;
        }
        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#split_tunnel Ec2ClientVpnEndpoint#split_tunnel}.
         * <p>
         * @return {@code this}
         * @param splitTunnel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#split_tunnel Ec2ClientVpnEndpoint#split_tunnel}. This parameter is required.
         */
        public Builder splitTunnel(final com.hashicorp.cdktf.IResolvable splitTunnel) {
            this.config.splitTunnel(splitTunnel);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#tags Ec2ClientVpnEndpoint#tags}.
         * <p>
         * @return {@code this}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#tags Ec2ClientVpnEndpoint#tags}. This parameter is required.
         */
        public Builder tags(final java.util.Map<java.lang.String, java.lang.String> tags) {
            this.config.tags(tags);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#tags_all Ec2ClientVpnEndpoint#tags_all}.
         * <p>
         * @return {@code this}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#tags_all Ec2ClientVpnEndpoint#tags_all}. This parameter is required.
         */
        public Builder tagsAll(final java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.config.tagsAll(tagsAll);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#transport_protocol Ec2ClientVpnEndpoint#transport_protocol}.
         * <p>
         * @return {@code this}
         * @param transportProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#transport_protocol Ec2ClientVpnEndpoint#transport_protocol}. This parameter is required.
         */
        public Builder transportProtocol(final java.lang.String transportProtocol) {
            this.config.transportProtocol(transportProtocol);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#vpc_id Ec2ClientVpnEndpoint#vpc_id}.
         * <p>
         * @return {@code this}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#vpc_id Ec2ClientVpnEndpoint#vpc_id}. This parameter is required.
         */
        public Builder vpcId(final java.lang.String vpcId) {
            this.config.vpcId(vpcId);
            return this;
        }

        /**
         * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#vpn_port Ec2ClientVpnEndpoint#vpn_port}.
         * <p>
         * @return {@code this}
         * @param vpnPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_client_vpn_endpoint#vpn_port Ec2ClientVpnEndpoint#vpn_port}. This parameter is required.
         */
        public Builder vpnPort(final java.lang.Number vpnPort) {
            this.config.vpnPort(vpnPort);
            return this;
        }

        /**
         * @return a newly built instance of {@link imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint}.
         */
        @Override
        public imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint build() {
            return new imports.aws.ec2_client_vpn_endpoint.Ec2ClientVpnEndpoint(
                this.scope,
                this.id,
                this.config.build()
            );
        }
    }
}
