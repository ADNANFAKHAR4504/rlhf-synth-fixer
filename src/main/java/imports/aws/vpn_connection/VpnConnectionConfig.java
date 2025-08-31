package imports.aws.vpn_connection;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.631Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpnConnection.VpnConnectionConfig")
@software.amazon.jsii.Jsii.Proxy(VpnConnectionConfig.Jsii$Proxy.class)
public interface VpnConnectionConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#customer_gateway_id VpnConnection#customer_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCustomerGatewayId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#type VpnConnection#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#enable_acceleration VpnConnection#enable_acceleration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableAcceleration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#id VpnConnection#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv4_network_cidr VpnConnection#local_ipv4_network_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalIpv4NetworkCidr() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv6_network_cidr VpnConnection#local_ipv6_network_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocalIpv6NetworkCidr() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#outside_ip_address_type VpnConnection#outside_ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutsideIpAddressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#preshared_key_storage VpnConnection#preshared_key_storage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPresharedKeyStorage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv4_network_cidr VpnConnection#remote_ipv4_network_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRemoteIpv4NetworkCidr() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv6_network_cidr VpnConnection#remote_ipv6_network_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRemoteIpv6NetworkCidr() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#static_routes_only VpnConnection#static_routes_only}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStaticRoutesOnly() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags VpnConnection#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags_all VpnConnection#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transit_gateway_id VpnConnection#transit_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitGatewayId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transport_transit_gateway_attachment_id VpnConnection#transport_transit_gateway_attachment_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransportTransitGatewayAttachmentId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_action VpnConnection#tunnel1_dpd_timeout_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel1DpdTimeoutAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_seconds VpnConnection#tunnel1_dpd_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1DpdTimeoutSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_enable_tunnel_lifecycle_control VpnConnection#tunnel1_enable_tunnel_lifecycle_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTunnel1EnableTunnelLifecycleControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_ike_versions VpnConnection#tunnel1_ike_versions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1IkeVersions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_cidr VpnConnection#tunnel1_inside_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel1InsideCidr() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_ipv6_cidr VpnConnection#tunnel1_inside_ipv6_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel1InsideIpv6Cidr() {
        return null;
    }

    /**
     * tunnel1_log_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_log_options VpnConnection#tunnel1_log_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions getTunnel1LogOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_dh_group_numbers VpnConnection#tunnel1_phase1_dh_group_numbers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel1Phase1DhGroupNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_encryption_algorithms VpnConnection#tunnel1_phase1_encryption_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase1EncryptionAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_integrity_algorithms VpnConnection#tunnel1_phase1_integrity_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase1IntegrityAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_lifetime_seconds VpnConnection#tunnel1_phase1_lifetime_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1Phase1LifetimeSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_dh_group_numbers VpnConnection#tunnel1_phase2_dh_group_numbers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel1Phase2DhGroupNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_encryption_algorithms VpnConnection#tunnel1_phase2_encryption_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase2EncryptionAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_integrity_algorithms VpnConnection#tunnel1_phase2_integrity_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel1Phase2IntegrityAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_lifetime_seconds VpnConnection#tunnel1_phase2_lifetime_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1Phase2LifetimeSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_preshared_key VpnConnection#tunnel1_preshared_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel1PresharedKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_fuzz_percentage VpnConnection#tunnel1_rekey_fuzz_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1RekeyFuzzPercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_margin_time_seconds VpnConnection#tunnel1_rekey_margin_time_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1RekeyMarginTimeSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_replay_window_size VpnConnection#tunnel1_replay_window_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel1ReplayWindowSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_startup_action VpnConnection#tunnel1_startup_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel1StartupAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_action VpnConnection#tunnel2_dpd_timeout_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel2DpdTimeoutAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_seconds VpnConnection#tunnel2_dpd_timeout_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2DpdTimeoutSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_enable_tunnel_lifecycle_control VpnConnection#tunnel2_enable_tunnel_lifecycle_control}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTunnel2EnableTunnelLifecycleControl() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_ike_versions VpnConnection#tunnel2_ike_versions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2IkeVersions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_cidr VpnConnection#tunnel2_inside_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel2InsideCidr() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_ipv6_cidr VpnConnection#tunnel2_inside_ipv6_cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel2InsideIpv6Cidr() {
        return null;
    }

    /**
     * tunnel2_log_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_log_options VpnConnection#tunnel2_log_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions getTunnel2LogOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_dh_group_numbers VpnConnection#tunnel2_phase1_dh_group_numbers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel2Phase1DhGroupNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_encryption_algorithms VpnConnection#tunnel2_phase1_encryption_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase1EncryptionAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_integrity_algorithms VpnConnection#tunnel2_phase1_integrity_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase1IntegrityAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_lifetime_seconds VpnConnection#tunnel2_phase1_lifetime_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2Phase1LifetimeSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_dh_group_numbers VpnConnection#tunnel2_phase2_dh_group_numbers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.Number> getTunnel2Phase2DhGroupNumbers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_encryption_algorithms VpnConnection#tunnel2_phase2_encryption_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase2EncryptionAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_integrity_algorithms VpnConnection#tunnel2_phase2_integrity_algorithms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTunnel2Phase2IntegrityAlgorithms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_lifetime_seconds VpnConnection#tunnel2_phase2_lifetime_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2Phase2LifetimeSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_preshared_key VpnConnection#tunnel2_preshared_key}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel2PresharedKey() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_fuzz_percentage VpnConnection#tunnel2_rekey_fuzz_percentage}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2RekeyFuzzPercentage() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_margin_time_seconds VpnConnection#tunnel2_rekey_margin_time_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2RekeyMarginTimeSeconds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_replay_window_size VpnConnection#tunnel2_replay_window_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getTunnel2ReplayWindowSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_startup_action VpnConnection#tunnel2_startup_action}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnel2StartupAction() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel_inside_ip_version VpnConnection#tunnel_inside_ip_version}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTunnelInsideIpVersion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#vpn_gateway_id VpnConnection#vpn_gateway_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpnGatewayId() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpnConnectionConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpnConnectionConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpnConnectionConfig> {
        java.lang.String customerGatewayId;
        java.lang.String type;
        java.lang.Object enableAcceleration;
        java.lang.String id;
        java.lang.String localIpv4NetworkCidr;
        java.lang.String localIpv6NetworkCidr;
        java.lang.String outsideIpAddressType;
        java.lang.String presharedKeyStorage;
        java.lang.String remoteIpv4NetworkCidr;
        java.lang.String remoteIpv6NetworkCidr;
        java.lang.Object staticRoutesOnly;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.String transitGatewayId;
        java.lang.String transportTransitGatewayAttachmentId;
        java.lang.String tunnel1DpdTimeoutAction;
        java.lang.Number tunnel1DpdTimeoutSeconds;
        java.lang.Object tunnel1EnableTunnelLifecycleControl;
        java.util.List<java.lang.String> tunnel1IkeVersions;
        java.lang.String tunnel1InsideCidr;
        java.lang.String tunnel1InsideIpv6Cidr;
        imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions tunnel1LogOptions;
        java.util.List<java.lang.Number> tunnel1Phase1DhGroupNumbers;
        java.util.List<java.lang.String> tunnel1Phase1EncryptionAlgorithms;
        java.util.List<java.lang.String> tunnel1Phase1IntegrityAlgorithms;
        java.lang.Number tunnel1Phase1LifetimeSeconds;
        java.util.List<java.lang.Number> tunnel1Phase2DhGroupNumbers;
        java.util.List<java.lang.String> tunnel1Phase2EncryptionAlgorithms;
        java.util.List<java.lang.String> tunnel1Phase2IntegrityAlgorithms;
        java.lang.Number tunnel1Phase2LifetimeSeconds;
        java.lang.String tunnel1PresharedKey;
        java.lang.Number tunnel1RekeyFuzzPercentage;
        java.lang.Number tunnel1RekeyMarginTimeSeconds;
        java.lang.Number tunnel1ReplayWindowSize;
        java.lang.String tunnel1StartupAction;
        java.lang.String tunnel2DpdTimeoutAction;
        java.lang.Number tunnel2DpdTimeoutSeconds;
        java.lang.Object tunnel2EnableTunnelLifecycleControl;
        java.util.List<java.lang.String> tunnel2IkeVersions;
        java.lang.String tunnel2InsideCidr;
        java.lang.String tunnel2InsideIpv6Cidr;
        imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions tunnel2LogOptions;
        java.util.List<java.lang.Number> tunnel2Phase1DhGroupNumbers;
        java.util.List<java.lang.String> tunnel2Phase1EncryptionAlgorithms;
        java.util.List<java.lang.String> tunnel2Phase1IntegrityAlgorithms;
        java.lang.Number tunnel2Phase1LifetimeSeconds;
        java.util.List<java.lang.Number> tunnel2Phase2DhGroupNumbers;
        java.util.List<java.lang.String> tunnel2Phase2EncryptionAlgorithms;
        java.util.List<java.lang.String> tunnel2Phase2IntegrityAlgorithms;
        java.lang.Number tunnel2Phase2LifetimeSeconds;
        java.lang.String tunnel2PresharedKey;
        java.lang.Number tunnel2RekeyFuzzPercentage;
        java.lang.Number tunnel2RekeyMarginTimeSeconds;
        java.lang.Number tunnel2ReplayWindowSize;
        java.lang.String tunnel2StartupAction;
        java.lang.String tunnelInsideIpVersion;
        java.lang.String vpnGatewayId;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpnConnectionConfig#getCustomerGatewayId}
         * @param customerGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#customer_gateway_id VpnConnection#customer_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder customerGatewayId(java.lang.String customerGatewayId) {
            this.customerGatewayId = customerGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#type VpnConnection#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getEnableAcceleration}
         * @param enableAcceleration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#enable_acceleration VpnConnection#enable_acceleration}.
         * @return {@code this}
         */
        public Builder enableAcceleration(java.lang.Boolean enableAcceleration) {
            this.enableAcceleration = enableAcceleration;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getEnableAcceleration}
         * @param enableAcceleration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#enable_acceleration VpnConnection#enable_acceleration}.
         * @return {@code this}
         */
        public Builder enableAcceleration(com.hashicorp.cdktf.IResolvable enableAcceleration) {
            this.enableAcceleration = enableAcceleration;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#id VpnConnection#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getLocalIpv4NetworkCidr}
         * @param localIpv4NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv4_network_cidr VpnConnection#local_ipv4_network_cidr}.
         * @return {@code this}
         */
        public Builder localIpv4NetworkCidr(java.lang.String localIpv4NetworkCidr) {
            this.localIpv4NetworkCidr = localIpv4NetworkCidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getLocalIpv6NetworkCidr}
         * @param localIpv6NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#local_ipv6_network_cidr VpnConnection#local_ipv6_network_cidr}.
         * @return {@code this}
         */
        public Builder localIpv6NetworkCidr(java.lang.String localIpv6NetworkCidr) {
            this.localIpv6NetworkCidr = localIpv6NetworkCidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getOutsideIpAddressType}
         * @param outsideIpAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#outside_ip_address_type VpnConnection#outside_ip_address_type}.
         * @return {@code this}
         */
        public Builder outsideIpAddressType(java.lang.String outsideIpAddressType) {
            this.outsideIpAddressType = outsideIpAddressType;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getPresharedKeyStorage}
         * @param presharedKeyStorage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#preshared_key_storage VpnConnection#preshared_key_storage}.
         * @return {@code this}
         */
        public Builder presharedKeyStorage(java.lang.String presharedKeyStorage) {
            this.presharedKeyStorage = presharedKeyStorage;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getRemoteIpv4NetworkCidr}
         * @param remoteIpv4NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv4_network_cidr VpnConnection#remote_ipv4_network_cidr}.
         * @return {@code this}
         */
        public Builder remoteIpv4NetworkCidr(java.lang.String remoteIpv4NetworkCidr) {
            this.remoteIpv4NetworkCidr = remoteIpv4NetworkCidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getRemoteIpv6NetworkCidr}
         * @param remoteIpv6NetworkCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#remote_ipv6_network_cidr VpnConnection#remote_ipv6_network_cidr}.
         * @return {@code this}
         */
        public Builder remoteIpv6NetworkCidr(java.lang.String remoteIpv6NetworkCidr) {
            this.remoteIpv6NetworkCidr = remoteIpv6NetworkCidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getStaticRoutesOnly}
         * @param staticRoutesOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#static_routes_only VpnConnection#static_routes_only}.
         * @return {@code this}
         */
        public Builder staticRoutesOnly(java.lang.Boolean staticRoutesOnly) {
            this.staticRoutesOnly = staticRoutesOnly;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getStaticRoutesOnly}
         * @param staticRoutesOnly Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#static_routes_only VpnConnection#static_routes_only}.
         * @return {@code this}
         */
        public Builder staticRoutesOnly(com.hashicorp.cdktf.IResolvable staticRoutesOnly) {
            this.staticRoutesOnly = staticRoutesOnly;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags VpnConnection#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tags_all VpnConnection#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTransitGatewayId}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transit_gateway_id VpnConnection#transit_gateway_id}.
         * @return {@code this}
         */
        public Builder transitGatewayId(java.lang.String transitGatewayId) {
            this.transitGatewayId = transitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTransportTransitGatewayAttachmentId}
         * @param transportTransitGatewayAttachmentId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#transport_transit_gateway_attachment_id VpnConnection#transport_transit_gateway_attachment_id}.
         * @return {@code this}
         */
        public Builder transportTransitGatewayAttachmentId(java.lang.String transportTransitGatewayAttachmentId) {
            this.transportTransitGatewayAttachmentId = transportTransitGatewayAttachmentId;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1DpdTimeoutAction}
         * @param tunnel1DpdTimeoutAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_action VpnConnection#tunnel1_dpd_timeout_action}.
         * @return {@code this}
         */
        public Builder tunnel1DpdTimeoutAction(java.lang.String tunnel1DpdTimeoutAction) {
            this.tunnel1DpdTimeoutAction = tunnel1DpdTimeoutAction;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1DpdTimeoutSeconds}
         * @param tunnel1DpdTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_dpd_timeout_seconds VpnConnection#tunnel1_dpd_timeout_seconds}.
         * @return {@code this}
         */
        public Builder tunnel1DpdTimeoutSeconds(java.lang.Number tunnel1DpdTimeoutSeconds) {
            this.tunnel1DpdTimeoutSeconds = tunnel1DpdTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1EnableTunnelLifecycleControl}
         * @param tunnel1EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_enable_tunnel_lifecycle_control VpnConnection#tunnel1_enable_tunnel_lifecycle_control}.
         * @return {@code this}
         */
        public Builder tunnel1EnableTunnelLifecycleControl(java.lang.Boolean tunnel1EnableTunnelLifecycleControl) {
            this.tunnel1EnableTunnelLifecycleControl = tunnel1EnableTunnelLifecycleControl;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1EnableTunnelLifecycleControl}
         * @param tunnel1EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_enable_tunnel_lifecycle_control VpnConnection#tunnel1_enable_tunnel_lifecycle_control}.
         * @return {@code this}
         */
        public Builder tunnel1EnableTunnelLifecycleControl(com.hashicorp.cdktf.IResolvable tunnel1EnableTunnelLifecycleControl) {
            this.tunnel1EnableTunnelLifecycleControl = tunnel1EnableTunnelLifecycleControl;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1IkeVersions}
         * @param tunnel1IkeVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_ike_versions VpnConnection#tunnel1_ike_versions}.
         * @return {@code this}
         */
        public Builder tunnel1IkeVersions(java.util.List<java.lang.String> tunnel1IkeVersions) {
            this.tunnel1IkeVersions = tunnel1IkeVersions;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1InsideCidr}
         * @param tunnel1InsideCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_cidr VpnConnection#tunnel1_inside_cidr}.
         * @return {@code this}
         */
        public Builder tunnel1InsideCidr(java.lang.String tunnel1InsideCidr) {
            this.tunnel1InsideCidr = tunnel1InsideCidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1InsideIpv6Cidr}
         * @param tunnel1InsideIpv6Cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_inside_ipv6_cidr VpnConnection#tunnel1_inside_ipv6_cidr}.
         * @return {@code this}
         */
        public Builder tunnel1InsideIpv6Cidr(java.lang.String tunnel1InsideIpv6Cidr) {
            this.tunnel1InsideIpv6Cidr = tunnel1InsideIpv6Cidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1LogOptions}
         * @param tunnel1LogOptions tunnel1_log_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_log_options VpnConnection#tunnel1_log_options}
         * @return {@code this}
         */
        public Builder tunnel1LogOptions(imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions tunnel1LogOptions) {
            this.tunnel1LogOptions = tunnel1LogOptions;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase1DhGroupNumbers}
         * @param tunnel1Phase1DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_dh_group_numbers VpnConnection#tunnel1_phase1_dh_group_numbers}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder tunnel1Phase1DhGroupNumbers(java.util.List<? extends java.lang.Number> tunnel1Phase1DhGroupNumbers) {
            this.tunnel1Phase1DhGroupNumbers = (java.util.List<java.lang.Number>)tunnel1Phase1DhGroupNumbers;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase1EncryptionAlgorithms}
         * @param tunnel1Phase1EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_encryption_algorithms VpnConnection#tunnel1_phase1_encryption_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel1Phase1EncryptionAlgorithms(java.util.List<java.lang.String> tunnel1Phase1EncryptionAlgorithms) {
            this.tunnel1Phase1EncryptionAlgorithms = tunnel1Phase1EncryptionAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase1IntegrityAlgorithms}
         * @param tunnel1Phase1IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_integrity_algorithms VpnConnection#tunnel1_phase1_integrity_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel1Phase1IntegrityAlgorithms(java.util.List<java.lang.String> tunnel1Phase1IntegrityAlgorithms) {
            this.tunnel1Phase1IntegrityAlgorithms = tunnel1Phase1IntegrityAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase1LifetimeSeconds}
         * @param tunnel1Phase1LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase1_lifetime_seconds VpnConnection#tunnel1_phase1_lifetime_seconds}.
         * @return {@code this}
         */
        public Builder tunnel1Phase1LifetimeSeconds(java.lang.Number tunnel1Phase1LifetimeSeconds) {
            this.tunnel1Phase1LifetimeSeconds = tunnel1Phase1LifetimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase2DhGroupNumbers}
         * @param tunnel1Phase2DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_dh_group_numbers VpnConnection#tunnel1_phase2_dh_group_numbers}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder tunnel1Phase2DhGroupNumbers(java.util.List<? extends java.lang.Number> tunnel1Phase2DhGroupNumbers) {
            this.tunnel1Phase2DhGroupNumbers = (java.util.List<java.lang.Number>)tunnel1Phase2DhGroupNumbers;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase2EncryptionAlgorithms}
         * @param tunnel1Phase2EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_encryption_algorithms VpnConnection#tunnel1_phase2_encryption_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel1Phase2EncryptionAlgorithms(java.util.List<java.lang.String> tunnel1Phase2EncryptionAlgorithms) {
            this.tunnel1Phase2EncryptionAlgorithms = tunnel1Phase2EncryptionAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase2IntegrityAlgorithms}
         * @param tunnel1Phase2IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_integrity_algorithms VpnConnection#tunnel1_phase2_integrity_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel1Phase2IntegrityAlgorithms(java.util.List<java.lang.String> tunnel1Phase2IntegrityAlgorithms) {
            this.tunnel1Phase2IntegrityAlgorithms = tunnel1Phase2IntegrityAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1Phase2LifetimeSeconds}
         * @param tunnel1Phase2LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_phase2_lifetime_seconds VpnConnection#tunnel1_phase2_lifetime_seconds}.
         * @return {@code this}
         */
        public Builder tunnel1Phase2LifetimeSeconds(java.lang.Number tunnel1Phase2LifetimeSeconds) {
            this.tunnel1Phase2LifetimeSeconds = tunnel1Phase2LifetimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1PresharedKey}
         * @param tunnel1PresharedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_preshared_key VpnConnection#tunnel1_preshared_key}.
         * @return {@code this}
         */
        public Builder tunnel1PresharedKey(java.lang.String tunnel1PresharedKey) {
            this.tunnel1PresharedKey = tunnel1PresharedKey;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1RekeyFuzzPercentage}
         * @param tunnel1RekeyFuzzPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_fuzz_percentage VpnConnection#tunnel1_rekey_fuzz_percentage}.
         * @return {@code this}
         */
        public Builder tunnel1RekeyFuzzPercentage(java.lang.Number tunnel1RekeyFuzzPercentage) {
            this.tunnel1RekeyFuzzPercentage = tunnel1RekeyFuzzPercentage;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1RekeyMarginTimeSeconds}
         * @param tunnel1RekeyMarginTimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_rekey_margin_time_seconds VpnConnection#tunnel1_rekey_margin_time_seconds}.
         * @return {@code this}
         */
        public Builder tunnel1RekeyMarginTimeSeconds(java.lang.Number tunnel1RekeyMarginTimeSeconds) {
            this.tunnel1RekeyMarginTimeSeconds = tunnel1RekeyMarginTimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1ReplayWindowSize}
         * @param tunnel1ReplayWindowSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_replay_window_size VpnConnection#tunnel1_replay_window_size}.
         * @return {@code this}
         */
        public Builder tunnel1ReplayWindowSize(java.lang.Number tunnel1ReplayWindowSize) {
            this.tunnel1ReplayWindowSize = tunnel1ReplayWindowSize;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel1StartupAction}
         * @param tunnel1StartupAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel1_startup_action VpnConnection#tunnel1_startup_action}.
         * @return {@code this}
         */
        public Builder tunnel1StartupAction(java.lang.String tunnel1StartupAction) {
            this.tunnel1StartupAction = tunnel1StartupAction;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2DpdTimeoutAction}
         * @param tunnel2DpdTimeoutAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_action VpnConnection#tunnel2_dpd_timeout_action}.
         * @return {@code this}
         */
        public Builder tunnel2DpdTimeoutAction(java.lang.String tunnel2DpdTimeoutAction) {
            this.tunnel2DpdTimeoutAction = tunnel2DpdTimeoutAction;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2DpdTimeoutSeconds}
         * @param tunnel2DpdTimeoutSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_dpd_timeout_seconds VpnConnection#tunnel2_dpd_timeout_seconds}.
         * @return {@code this}
         */
        public Builder tunnel2DpdTimeoutSeconds(java.lang.Number tunnel2DpdTimeoutSeconds) {
            this.tunnel2DpdTimeoutSeconds = tunnel2DpdTimeoutSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2EnableTunnelLifecycleControl}
         * @param tunnel2EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_enable_tunnel_lifecycle_control VpnConnection#tunnel2_enable_tunnel_lifecycle_control}.
         * @return {@code this}
         */
        public Builder tunnel2EnableTunnelLifecycleControl(java.lang.Boolean tunnel2EnableTunnelLifecycleControl) {
            this.tunnel2EnableTunnelLifecycleControl = tunnel2EnableTunnelLifecycleControl;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2EnableTunnelLifecycleControl}
         * @param tunnel2EnableTunnelLifecycleControl Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_enable_tunnel_lifecycle_control VpnConnection#tunnel2_enable_tunnel_lifecycle_control}.
         * @return {@code this}
         */
        public Builder tunnel2EnableTunnelLifecycleControl(com.hashicorp.cdktf.IResolvable tunnel2EnableTunnelLifecycleControl) {
            this.tunnel2EnableTunnelLifecycleControl = tunnel2EnableTunnelLifecycleControl;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2IkeVersions}
         * @param tunnel2IkeVersions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_ike_versions VpnConnection#tunnel2_ike_versions}.
         * @return {@code this}
         */
        public Builder tunnel2IkeVersions(java.util.List<java.lang.String> tunnel2IkeVersions) {
            this.tunnel2IkeVersions = tunnel2IkeVersions;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2InsideCidr}
         * @param tunnel2InsideCidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_cidr VpnConnection#tunnel2_inside_cidr}.
         * @return {@code this}
         */
        public Builder tunnel2InsideCidr(java.lang.String tunnel2InsideCidr) {
            this.tunnel2InsideCidr = tunnel2InsideCidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2InsideIpv6Cidr}
         * @param tunnel2InsideIpv6Cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_inside_ipv6_cidr VpnConnection#tunnel2_inside_ipv6_cidr}.
         * @return {@code this}
         */
        public Builder tunnel2InsideIpv6Cidr(java.lang.String tunnel2InsideIpv6Cidr) {
            this.tunnel2InsideIpv6Cidr = tunnel2InsideIpv6Cidr;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2LogOptions}
         * @param tunnel2LogOptions tunnel2_log_options block.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_log_options VpnConnection#tunnel2_log_options}
         * @return {@code this}
         */
        public Builder tunnel2LogOptions(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions tunnel2LogOptions) {
            this.tunnel2LogOptions = tunnel2LogOptions;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase1DhGroupNumbers}
         * @param tunnel2Phase1DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_dh_group_numbers VpnConnection#tunnel2_phase1_dh_group_numbers}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder tunnel2Phase1DhGroupNumbers(java.util.List<? extends java.lang.Number> tunnel2Phase1DhGroupNumbers) {
            this.tunnel2Phase1DhGroupNumbers = (java.util.List<java.lang.Number>)tunnel2Phase1DhGroupNumbers;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase1EncryptionAlgorithms}
         * @param tunnel2Phase1EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_encryption_algorithms VpnConnection#tunnel2_phase1_encryption_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel2Phase1EncryptionAlgorithms(java.util.List<java.lang.String> tunnel2Phase1EncryptionAlgorithms) {
            this.tunnel2Phase1EncryptionAlgorithms = tunnel2Phase1EncryptionAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase1IntegrityAlgorithms}
         * @param tunnel2Phase1IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_integrity_algorithms VpnConnection#tunnel2_phase1_integrity_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel2Phase1IntegrityAlgorithms(java.util.List<java.lang.String> tunnel2Phase1IntegrityAlgorithms) {
            this.tunnel2Phase1IntegrityAlgorithms = tunnel2Phase1IntegrityAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase1LifetimeSeconds}
         * @param tunnel2Phase1LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase1_lifetime_seconds VpnConnection#tunnel2_phase1_lifetime_seconds}.
         * @return {@code this}
         */
        public Builder tunnel2Phase1LifetimeSeconds(java.lang.Number tunnel2Phase1LifetimeSeconds) {
            this.tunnel2Phase1LifetimeSeconds = tunnel2Phase1LifetimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase2DhGroupNumbers}
         * @param tunnel2Phase2DhGroupNumbers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_dh_group_numbers VpnConnection#tunnel2_phase2_dh_group_numbers}.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder tunnel2Phase2DhGroupNumbers(java.util.List<? extends java.lang.Number> tunnel2Phase2DhGroupNumbers) {
            this.tunnel2Phase2DhGroupNumbers = (java.util.List<java.lang.Number>)tunnel2Phase2DhGroupNumbers;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase2EncryptionAlgorithms}
         * @param tunnel2Phase2EncryptionAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_encryption_algorithms VpnConnection#tunnel2_phase2_encryption_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel2Phase2EncryptionAlgorithms(java.util.List<java.lang.String> tunnel2Phase2EncryptionAlgorithms) {
            this.tunnel2Phase2EncryptionAlgorithms = tunnel2Phase2EncryptionAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase2IntegrityAlgorithms}
         * @param tunnel2Phase2IntegrityAlgorithms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_integrity_algorithms VpnConnection#tunnel2_phase2_integrity_algorithms}.
         * @return {@code this}
         */
        public Builder tunnel2Phase2IntegrityAlgorithms(java.util.List<java.lang.String> tunnel2Phase2IntegrityAlgorithms) {
            this.tunnel2Phase2IntegrityAlgorithms = tunnel2Phase2IntegrityAlgorithms;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2Phase2LifetimeSeconds}
         * @param tunnel2Phase2LifetimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_phase2_lifetime_seconds VpnConnection#tunnel2_phase2_lifetime_seconds}.
         * @return {@code this}
         */
        public Builder tunnel2Phase2LifetimeSeconds(java.lang.Number tunnel2Phase2LifetimeSeconds) {
            this.tunnel2Phase2LifetimeSeconds = tunnel2Phase2LifetimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2PresharedKey}
         * @param tunnel2PresharedKey Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_preshared_key VpnConnection#tunnel2_preshared_key}.
         * @return {@code this}
         */
        public Builder tunnel2PresharedKey(java.lang.String tunnel2PresharedKey) {
            this.tunnel2PresharedKey = tunnel2PresharedKey;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2RekeyFuzzPercentage}
         * @param tunnel2RekeyFuzzPercentage Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_fuzz_percentage VpnConnection#tunnel2_rekey_fuzz_percentage}.
         * @return {@code this}
         */
        public Builder tunnel2RekeyFuzzPercentage(java.lang.Number tunnel2RekeyFuzzPercentage) {
            this.tunnel2RekeyFuzzPercentage = tunnel2RekeyFuzzPercentage;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2RekeyMarginTimeSeconds}
         * @param tunnel2RekeyMarginTimeSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_rekey_margin_time_seconds VpnConnection#tunnel2_rekey_margin_time_seconds}.
         * @return {@code this}
         */
        public Builder tunnel2RekeyMarginTimeSeconds(java.lang.Number tunnel2RekeyMarginTimeSeconds) {
            this.tunnel2RekeyMarginTimeSeconds = tunnel2RekeyMarginTimeSeconds;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2ReplayWindowSize}
         * @param tunnel2ReplayWindowSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_replay_window_size VpnConnection#tunnel2_replay_window_size}.
         * @return {@code this}
         */
        public Builder tunnel2ReplayWindowSize(java.lang.Number tunnel2ReplayWindowSize) {
            this.tunnel2ReplayWindowSize = tunnel2ReplayWindowSize;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnel2StartupAction}
         * @param tunnel2StartupAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel2_startup_action VpnConnection#tunnel2_startup_action}.
         * @return {@code this}
         */
        public Builder tunnel2StartupAction(java.lang.String tunnel2StartupAction) {
            this.tunnel2StartupAction = tunnel2StartupAction;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getTunnelInsideIpVersion}
         * @param tunnelInsideIpVersion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#tunnel_inside_ip_version VpnConnection#tunnel_inside_ip_version}.
         * @return {@code this}
         */
        public Builder tunnelInsideIpVersion(java.lang.String tunnelInsideIpVersion) {
            this.tunnelInsideIpVersion = tunnelInsideIpVersion;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getVpnGatewayId}
         * @param vpnGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpn_connection#vpn_gateway_id VpnConnection#vpn_gateway_id}.
         * @return {@code this}
         */
        public Builder vpnGatewayId(java.lang.String vpnGatewayId) {
            this.vpnGatewayId = vpnGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getDependsOn}
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
         * Sets the value of {@link VpnConnectionConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpnConnectionConfig#getProvisioners}
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
         * @return a new instance of {@link VpnConnectionConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpnConnectionConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpnConnectionConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpnConnectionConfig {
        private final java.lang.String customerGatewayId;
        private final java.lang.String type;
        private final java.lang.Object enableAcceleration;
        private final java.lang.String id;
        private final java.lang.String localIpv4NetworkCidr;
        private final java.lang.String localIpv6NetworkCidr;
        private final java.lang.String outsideIpAddressType;
        private final java.lang.String presharedKeyStorage;
        private final java.lang.String remoteIpv4NetworkCidr;
        private final java.lang.String remoteIpv6NetworkCidr;
        private final java.lang.Object staticRoutesOnly;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.String transitGatewayId;
        private final java.lang.String transportTransitGatewayAttachmentId;
        private final java.lang.String tunnel1DpdTimeoutAction;
        private final java.lang.Number tunnel1DpdTimeoutSeconds;
        private final java.lang.Object tunnel1EnableTunnelLifecycleControl;
        private final java.util.List<java.lang.String> tunnel1IkeVersions;
        private final java.lang.String tunnel1InsideCidr;
        private final java.lang.String tunnel1InsideIpv6Cidr;
        private final imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions tunnel1LogOptions;
        private final java.util.List<java.lang.Number> tunnel1Phase1DhGroupNumbers;
        private final java.util.List<java.lang.String> tunnel1Phase1EncryptionAlgorithms;
        private final java.util.List<java.lang.String> tunnel1Phase1IntegrityAlgorithms;
        private final java.lang.Number tunnel1Phase1LifetimeSeconds;
        private final java.util.List<java.lang.Number> tunnel1Phase2DhGroupNumbers;
        private final java.util.List<java.lang.String> tunnel1Phase2EncryptionAlgorithms;
        private final java.util.List<java.lang.String> tunnel1Phase2IntegrityAlgorithms;
        private final java.lang.Number tunnel1Phase2LifetimeSeconds;
        private final java.lang.String tunnel1PresharedKey;
        private final java.lang.Number tunnel1RekeyFuzzPercentage;
        private final java.lang.Number tunnel1RekeyMarginTimeSeconds;
        private final java.lang.Number tunnel1ReplayWindowSize;
        private final java.lang.String tunnel1StartupAction;
        private final java.lang.String tunnel2DpdTimeoutAction;
        private final java.lang.Number tunnel2DpdTimeoutSeconds;
        private final java.lang.Object tunnel2EnableTunnelLifecycleControl;
        private final java.util.List<java.lang.String> tunnel2IkeVersions;
        private final java.lang.String tunnel2InsideCidr;
        private final java.lang.String tunnel2InsideIpv6Cidr;
        private final imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions tunnel2LogOptions;
        private final java.util.List<java.lang.Number> tunnel2Phase1DhGroupNumbers;
        private final java.util.List<java.lang.String> tunnel2Phase1EncryptionAlgorithms;
        private final java.util.List<java.lang.String> tunnel2Phase1IntegrityAlgorithms;
        private final java.lang.Number tunnel2Phase1LifetimeSeconds;
        private final java.util.List<java.lang.Number> tunnel2Phase2DhGroupNumbers;
        private final java.util.List<java.lang.String> tunnel2Phase2EncryptionAlgorithms;
        private final java.util.List<java.lang.String> tunnel2Phase2IntegrityAlgorithms;
        private final java.lang.Number tunnel2Phase2LifetimeSeconds;
        private final java.lang.String tunnel2PresharedKey;
        private final java.lang.Number tunnel2RekeyFuzzPercentage;
        private final java.lang.Number tunnel2RekeyMarginTimeSeconds;
        private final java.lang.Number tunnel2ReplayWindowSize;
        private final java.lang.String tunnel2StartupAction;
        private final java.lang.String tunnelInsideIpVersion;
        private final java.lang.String vpnGatewayId;
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
            this.customerGatewayId = software.amazon.jsii.Kernel.get(this, "customerGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.enableAcceleration = software.amazon.jsii.Kernel.get(this, "enableAcceleration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localIpv4NetworkCidr = software.amazon.jsii.Kernel.get(this, "localIpv4NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localIpv6NetworkCidr = software.amazon.jsii.Kernel.get(this, "localIpv6NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.outsideIpAddressType = software.amazon.jsii.Kernel.get(this, "outsideIpAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.presharedKeyStorage = software.amazon.jsii.Kernel.get(this, "presharedKeyStorage", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.remoteIpv4NetworkCidr = software.amazon.jsii.Kernel.get(this, "remoteIpv4NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.remoteIpv6NetworkCidr = software.amazon.jsii.Kernel.get(this, "remoteIpv6NetworkCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.staticRoutesOnly = software.amazon.jsii.Kernel.get(this, "staticRoutesOnly", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.transitGatewayId = software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transportTransitGatewayAttachmentId = software.amazon.jsii.Kernel.get(this, "transportTransitGatewayAttachmentId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel1DpdTimeoutAction = software.amazon.jsii.Kernel.get(this, "tunnel1DpdTimeoutAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel1DpdTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "tunnel1DpdTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel1EnableTunnelLifecycleControl = software.amazon.jsii.Kernel.get(this, "tunnel1EnableTunnelLifecycleControl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tunnel1IkeVersions = software.amazon.jsii.Kernel.get(this, "tunnel1IkeVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel1InsideCidr = software.amazon.jsii.Kernel.get(this, "tunnel1InsideCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel1InsideIpv6Cidr = software.amazon.jsii.Kernel.get(this, "tunnel1InsideIpv6Cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel1LogOptions = software.amazon.jsii.Kernel.get(this, "tunnel1LogOptions", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions.class));
            this.tunnel1Phase1DhGroupNumbers = software.amazon.jsii.Kernel.get(this, "tunnel1Phase1DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.tunnel1Phase1EncryptionAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel1Phase1EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel1Phase1IntegrityAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel1Phase1IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel1Phase1LifetimeSeconds = software.amazon.jsii.Kernel.get(this, "tunnel1Phase1LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel1Phase2DhGroupNumbers = software.amazon.jsii.Kernel.get(this, "tunnel1Phase2DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.tunnel1Phase2EncryptionAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel1Phase2EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel1Phase2IntegrityAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel1Phase2IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel1Phase2LifetimeSeconds = software.amazon.jsii.Kernel.get(this, "tunnel1Phase2LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel1PresharedKey = software.amazon.jsii.Kernel.get(this, "tunnel1PresharedKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel1RekeyFuzzPercentage = software.amazon.jsii.Kernel.get(this, "tunnel1RekeyFuzzPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel1RekeyMarginTimeSeconds = software.amazon.jsii.Kernel.get(this, "tunnel1RekeyMarginTimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel1ReplayWindowSize = software.amazon.jsii.Kernel.get(this, "tunnel1ReplayWindowSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel1StartupAction = software.amazon.jsii.Kernel.get(this, "tunnel1StartupAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel2DpdTimeoutAction = software.amazon.jsii.Kernel.get(this, "tunnel2DpdTimeoutAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel2DpdTimeoutSeconds = software.amazon.jsii.Kernel.get(this, "tunnel2DpdTimeoutSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel2EnableTunnelLifecycleControl = software.amazon.jsii.Kernel.get(this, "tunnel2EnableTunnelLifecycleControl", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.tunnel2IkeVersions = software.amazon.jsii.Kernel.get(this, "tunnel2IkeVersions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel2InsideCidr = software.amazon.jsii.Kernel.get(this, "tunnel2InsideCidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel2InsideIpv6Cidr = software.amazon.jsii.Kernel.get(this, "tunnel2InsideIpv6Cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel2LogOptions = software.amazon.jsii.Kernel.get(this, "tunnel2LogOptions", software.amazon.jsii.NativeType.forClass(imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions.class));
            this.tunnel2Phase1DhGroupNumbers = software.amazon.jsii.Kernel.get(this, "tunnel2Phase1DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.tunnel2Phase1EncryptionAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel2Phase1EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel2Phase1IntegrityAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel2Phase1IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel2Phase1LifetimeSeconds = software.amazon.jsii.Kernel.get(this, "tunnel2Phase1LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel2Phase2DhGroupNumbers = software.amazon.jsii.Kernel.get(this, "tunnel2Phase2DhGroupNumbers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.tunnel2Phase2EncryptionAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel2Phase2EncryptionAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel2Phase2IntegrityAlgorithms = software.amazon.jsii.Kernel.get(this, "tunnel2Phase2IntegrityAlgorithms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tunnel2Phase2LifetimeSeconds = software.amazon.jsii.Kernel.get(this, "tunnel2Phase2LifetimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel2PresharedKey = software.amazon.jsii.Kernel.get(this, "tunnel2PresharedKey", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnel2RekeyFuzzPercentage = software.amazon.jsii.Kernel.get(this, "tunnel2RekeyFuzzPercentage", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel2RekeyMarginTimeSeconds = software.amazon.jsii.Kernel.get(this, "tunnel2RekeyMarginTimeSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel2ReplayWindowSize = software.amazon.jsii.Kernel.get(this, "tunnel2ReplayWindowSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.tunnel2StartupAction = software.amazon.jsii.Kernel.get(this, "tunnel2StartupAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tunnelInsideIpVersion = software.amazon.jsii.Kernel.get(this, "tunnelInsideIpVersion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpnGatewayId = software.amazon.jsii.Kernel.get(this, "vpnGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.customerGatewayId = java.util.Objects.requireNonNull(builder.customerGatewayId, "customerGatewayId is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.enableAcceleration = builder.enableAcceleration;
            this.id = builder.id;
            this.localIpv4NetworkCidr = builder.localIpv4NetworkCidr;
            this.localIpv6NetworkCidr = builder.localIpv6NetworkCidr;
            this.outsideIpAddressType = builder.outsideIpAddressType;
            this.presharedKeyStorage = builder.presharedKeyStorage;
            this.remoteIpv4NetworkCidr = builder.remoteIpv4NetworkCidr;
            this.remoteIpv6NetworkCidr = builder.remoteIpv6NetworkCidr;
            this.staticRoutesOnly = builder.staticRoutesOnly;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.transitGatewayId = builder.transitGatewayId;
            this.transportTransitGatewayAttachmentId = builder.transportTransitGatewayAttachmentId;
            this.tunnel1DpdTimeoutAction = builder.tunnel1DpdTimeoutAction;
            this.tunnel1DpdTimeoutSeconds = builder.tunnel1DpdTimeoutSeconds;
            this.tunnel1EnableTunnelLifecycleControl = builder.tunnel1EnableTunnelLifecycleControl;
            this.tunnel1IkeVersions = builder.tunnel1IkeVersions;
            this.tunnel1InsideCidr = builder.tunnel1InsideCidr;
            this.tunnel1InsideIpv6Cidr = builder.tunnel1InsideIpv6Cidr;
            this.tunnel1LogOptions = builder.tunnel1LogOptions;
            this.tunnel1Phase1DhGroupNumbers = (java.util.List<java.lang.Number>)builder.tunnel1Phase1DhGroupNumbers;
            this.tunnel1Phase1EncryptionAlgorithms = builder.tunnel1Phase1EncryptionAlgorithms;
            this.tunnel1Phase1IntegrityAlgorithms = builder.tunnel1Phase1IntegrityAlgorithms;
            this.tunnel1Phase1LifetimeSeconds = builder.tunnel1Phase1LifetimeSeconds;
            this.tunnel1Phase2DhGroupNumbers = (java.util.List<java.lang.Number>)builder.tunnel1Phase2DhGroupNumbers;
            this.tunnel1Phase2EncryptionAlgorithms = builder.tunnel1Phase2EncryptionAlgorithms;
            this.tunnel1Phase2IntegrityAlgorithms = builder.tunnel1Phase2IntegrityAlgorithms;
            this.tunnel1Phase2LifetimeSeconds = builder.tunnel1Phase2LifetimeSeconds;
            this.tunnel1PresharedKey = builder.tunnel1PresharedKey;
            this.tunnel1RekeyFuzzPercentage = builder.tunnel1RekeyFuzzPercentage;
            this.tunnel1RekeyMarginTimeSeconds = builder.tunnel1RekeyMarginTimeSeconds;
            this.tunnel1ReplayWindowSize = builder.tunnel1ReplayWindowSize;
            this.tunnel1StartupAction = builder.tunnel1StartupAction;
            this.tunnel2DpdTimeoutAction = builder.tunnel2DpdTimeoutAction;
            this.tunnel2DpdTimeoutSeconds = builder.tunnel2DpdTimeoutSeconds;
            this.tunnel2EnableTunnelLifecycleControl = builder.tunnel2EnableTunnelLifecycleControl;
            this.tunnel2IkeVersions = builder.tunnel2IkeVersions;
            this.tunnel2InsideCidr = builder.tunnel2InsideCidr;
            this.tunnel2InsideIpv6Cidr = builder.tunnel2InsideIpv6Cidr;
            this.tunnel2LogOptions = builder.tunnel2LogOptions;
            this.tunnel2Phase1DhGroupNumbers = (java.util.List<java.lang.Number>)builder.tunnel2Phase1DhGroupNumbers;
            this.tunnel2Phase1EncryptionAlgorithms = builder.tunnel2Phase1EncryptionAlgorithms;
            this.tunnel2Phase1IntegrityAlgorithms = builder.tunnel2Phase1IntegrityAlgorithms;
            this.tunnel2Phase1LifetimeSeconds = builder.tunnel2Phase1LifetimeSeconds;
            this.tunnel2Phase2DhGroupNumbers = (java.util.List<java.lang.Number>)builder.tunnel2Phase2DhGroupNumbers;
            this.tunnel2Phase2EncryptionAlgorithms = builder.tunnel2Phase2EncryptionAlgorithms;
            this.tunnel2Phase2IntegrityAlgorithms = builder.tunnel2Phase2IntegrityAlgorithms;
            this.tunnel2Phase2LifetimeSeconds = builder.tunnel2Phase2LifetimeSeconds;
            this.tunnel2PresharedKey = builder.tunnel2PresharedKey;
            this.tunnel2RekeyFuzzPercentage = builder.tunnel2RekeyFuzzPercentage;
            this.tunnel2RekeyMarginTimeSeconds = builder.tunnel2RekeyMarginTimeSeconds;
            this.tunnel2ReplayWindowSize = builder.tunnel2ReplayWindowSize;
            this.tunnel2StartupAction = builder.tunnel2StartupAction;
            this.tunnelInsideIpVersion = builder.tunnelInsideIpVersion;
            this.vpnGatewayId = builder.vpnGatewayId;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getCustomerGatewayId() {
            return this.customerGatewayId;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.lang.Object getEnableAcceleration() {
            return this.enableAcceleration;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getLocalIpv4NetworkCidr() {
            return this.localIpv4NetworkCidr;
        }

        @Override
        public final java.lang.String getLocalIpv6NetworkCidr() {
            return this.localIpv6NetworkCidr;
        }

        @Override
        public final java.lang.String getOutsideIpAddressType() {
            return this.outsideIpAddressType;
        }

        @Override
        public final java.lang.String getPresharedKeyStorage() {
            return this.presharedKeyStorage;
        }

        @Override
        public final java.lang.String getRemoteIpv4NetworkCidr() {
            return this.remoteIpv4NetworkCidr;
        }

        @Override
        public final java.lang.String getRemoteIpv6NetworkCidr() {
            return this.remoteIpv6NetworkCidr;
        }

        @Override
        public final java.lang.Object getStaticRoutesOnly() {
            return this.staticRoutesOnly;
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
        public final java.lang.String getTransitGatewayId() {
            return this.transitGatewayId;
        }

        @Override
        public final java.lang.String getTransportTransitGatewayAttachmentId() {
            return this.transportTransitGatewayAttachmentId;
        }

        @Override
        public final java.lang.String getTunnel1DpdTimeoutAction() {
            return this.tunnel1DpdTimeoutAction;
        }

        @Override
        public final java.lang.Number getTunnel1DpdTimeoutSeconds() {
            return this.tunnel1DpdTimeoutSeconds;
        }

        @Override
        public final java.lang.Object getTunnel1EnableTunnelLifecycleControl() {
            return this.tunnel1EnableTunnelLifecycleControl;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel1IkeVersions() {
            return this.tunnel1IkeVersions;
        }

        @Override
        public final java.lang.String getTunnel1InsideCidr() {
            return this.tunnel1InsideCidr;
        }

        @Override
        public final java.lang.String getTunnel1InsideIpv6Cidr() {
            return this.tunnel1InsideIpv6Cidr;
        }

        @Override
        public final imports.aws.vpn_connection.VpnConnectionTunnel1LogOptions getTunnel1LogOptions() {
            return this.tunnel1LogOptions;
        }

        @Override
        public final java.util.List<java.lang.Number> getTunnel1Phase1DhGroupNumbers() {
            return this.tunnel1Phase1DhGroupNumbers;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel1Phase1EncryptionAlgorithms() {
            return this.tunnel1Phase1EncryptionAlgorithms;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel1Phase1IntegrityAlgorithms() {
            return this.tunnel1Phase1IntegrityAlgorithms;
        }

        @Override
        public final java.lang.Number getTunnel1Phase1LifetimeSeconds() {
            return this.tunnel1Phase1LifetimeSeconds;
        }

        @Override
        public final java.util.List<java.lang.Number> getTunnel1Phase2DhGroupNumbers() {
            return this.tunnel1Phase2DhGroupNumbers;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel1Phase2EncryptionAlgorithms() {
            return this.tunnel1Phase2EncryptionAlgorithms;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel1Phase2IntegrityAlgorithms() {
            return this.tunnel1Phase2IntegrityAlgorithms;
        }

        @Override
        public final java.lang.Number getTunnel1Phase2LifetimeSeconds() {
            return this.tunnel1Phase2LifetimeSeconds;
        }

        @Override
        public final java.lang.String getTunnel1PresharedKey() {
            return this.tunnel1PresharedKey;
        }

        @Override
        public final java.lang.Number getTunnel1RekeyFuzzPercentage() {
            return this.tunnel1RekeyFuzzPercentage;
        }

        @Override
        public final java.lang.Number getTunnel1RekeyMarginTimeSeconds() {
            return this.tunnel1RekeyMarginTimeSeconds;
        }

        @Override
        public final java.lang.Number getTunnel1ReplayWindowSize() {
            return this.tunnel1ReplayWindowSize;
        }

        @Override
        public final java.lang.String getTunnel1StartupAction() {
            return this.tunnel1StartupAction;
        }

        @Override
        public final java.lang.String getTunnel2DpdTimeoutAction() {
            return this.tunnel2DpdTimeoutAction;
        }

        @Override
        public final java.lang.Number getTunnel2DpdTimeoutSeconds() {
            return this.tunnel2DpdTimeoutSeconds;
        }

        @Override
        public final java.lang.Object getTunnel2EnableTunnelLifecycleControl() {
            return this.tunnel2EnableTunnelLifecycleControl;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel2IkeVersions() {
            return this.tunnel2IkeVersions;
        }

        @Override
        public final java.lang.String getTunnel2InsideCidr() {
            return this.tunnel2InsideCidr;
        }

        @Override
        public final java.lang.String getTunnel2InsideIpv6Cidr() {
            return this.tunnel2InsideIpv6Cidr;
        }

        @Override
        public final imports.aws.vpn_connection.VpnConnectionTunnel2LogOptions getTunnel2LogOptions() {
            return this.tunnel2LogOptions;
        }

        @Override
        public final java.util.List<java.lang.Number> getTunnel2Phase1DhGroupNumbers() {
            return this.tunnel2Phase1DhGroupNumbers;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel2Phase1EncryptionAlgorithms() {
            return this.tunnel2Phase1EncryptionAlgorithms;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel2Phase1IntegrityAlgorithms() {
            return this.tunnel2Phase1IntegrityAlgorithms;
        }

        @Override
        public final java.lang.Number getTunnel2Phase1LifetimeSeconds() {
            return this.tunnel2Phase1LifetimeSeconds;
        }

        @Override
        public final java.util.List<java.lang.Number> getTunnel2Phase2DhGroupNumbers() {
            return this.tunnel2Phase2DhGroupNumbers;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel2Phase2EncryptionAlgorithms() {
            return this.tunnel2Phase2EncryptionAlgorithms;
        }

        @Override
        public final java.util.List<java.lang.String> getTunnel2Phase2IntegrityAlgorithms() {
            return this.tunnel2Phase2IntegrityAlgorithms;
        }

        @Override
        public final java.lang.Number getTunnel2Phase2LifetimeSeconds() {
            return this.tunnel2Phase2LifetimeSeconds;
        }

        @Override
        public final java.lang.String getTunnel2PresharedKey() {
            return this.tunnel2PresharedKey;
        }

        @Override
        public final java.lang.Number getTunnel2RekeyFuzzPercentage() {
            return this.tunnel2RekeyFuzzPercentage;
        }

        @Override
        public final java.lang.Number getTunnel2RekeyMarginTimeSeconds() {
            return this.tunnel2RekeyMarginTimeSeconds;
        }

        @Override
        public final java.lang.Number getTunnel2ReplayWindowSize() {
            return this.tunnel2ReplayWindowSize;
        }

        @Override
        public final java.lang.String getTunnel2StartupAction() {
            return this.tunnel2StartupAction;
        }

        @Override
        public final java.lang.String getTunnelInsideIpVersion() {
            return this.tunnelInsideIpVersion;
        }

        @Override
        public final java.lang.String getVpnGatewayId() {
            return this.vpnGatewayId;
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

            data.set("customerGatewayId", om.valueToTree(this.getCustomerGatewayId()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getEnableAcceleration() != null) {
                data.set("enableAcceleration", om.valueToTree(this.getEnableAcceleration()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getLocalIpv4NetworkCidr() != null) {
                data.set("localIpv4NetworkCidr", om.valueToTree(this.getLocalIpv4NetworkCidr()));
            }
            if (this.getLocalIpv6NetworkCidr() != null) {
                data.set("localIpv6NetworkCidr", om.valueToTree(this.getLocalIpv6NetworkCidr()));
            }
            if (this.getOutsideIpAddressType() != null) {
                data.set("outsideIpAddressType", om.valueToTree(this.getOutsideIpAddressType()));
            }
            if (this.getPresharedKeyStorage() != null) {
                data.set("presharedKeyStorage", om.valueToTree(this.getPresharedKeyStorage()));
            }
            if (this.getRemoteIpv4NetworkCidr() != null) {
                data.set("remoteIpv4NetworkCidr", om.valueToTree(this.getRemoteIpv4NetworkCidr()));
            }
            if (this.getRemoteIpv6NetworkCidr() != null) {
                data.set("remoteIpv6NetworkCidr", om.valueToTree(this.getRemoteIpv6NetworkCidr()));
            }
            if (this.getStaticRoutesOnly() != null) {
                data.set("staticRoutesOnly", om.valueToTree(this.getStaticRoutesOnly()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTransitGatewayId() != null) {
                data.set("transitGatewayId", om.valueToTree(this.getTransitGatewayId()));
            }
            if (this.getTransportTransitGatewayAttachmentId() != null) {
                data.set("transportTransitGatewayAttachmentId", om.valueToTree(this.getTransportTransitGatewayAttachmentId()));
            }
            if (this.getTunnel1DpdTimeoutAction() != null) {
                data.set("tunnel1DpdTimeoutAction", om.valueToTree(this.getTunnel1DpdTimeoutAction()));
            }
            if (this.getTunnel1DpdTimeoutSeconds() != null) {
                data.set("tunnel1DpdTimeoutSeconds", om.valueToTree(this.getTunnel1DpdTimeoutSeconds()));
            }
            if (this.getTunnel1EnableTunnelLifecycleControl() != null) {
                data.set("tunnel1EnableTunnelLifecycleControl", om.valueToTree(this.getTunnel1EnableTunnelLifecycleControl()));
            }
            if (this.getTunnel1IkeVersions() != null) {
                data.set("tunnel1IkeVersions", om.valueToTree(this.getTunnel1IkeVersions()));
            }
            if (this.getTunnel1InsideCidr() != null) {
                data.set("tunnel1InsideCidr", om.valueToTree(this.getTunnel1InsideCidr()));
            }
            if (this.getTunnel1InsideIpv6Cidr() != null) {
                data.set("tunnel1InsideIpv6Cidr", om.valueToTree(this.getTunnel1InsideIpv6Cidr()));
            }
            if (this.getTunnel1LogOptions() != null) {
                data.set("tunnel1LogOptions", om.valueToTree(this.getTunnel1LogOptions()));
            }
            if (this.getTunnel1Phase1DhGroupNumbers() != null) {
                data.set("tunnel1Phase1DhGroupNumbers", om.valueToTree(this.getTunnel1Phase1DhGroupNumbers()));
            }
            if (this.getTunnel1Phase1EncryptionAlgorithms() != null) {
                data.set("tunnel1Phase1EncryptionAlgorithms", om.valueToTree(this.getTunnel1Phase1EncryptionAlgorithms()));
            }
            if (this.getTunnel1Phase1IntegrityAlgorithms() != null) {
                data.set("tunnel1Phase1IntegrityAlgorithms", om.valueToTree(this.getTunnel1Phase1IntegrityAlgorithms()));
            }
            if (this.getTunnel1Phase1LifetimeSeconds() != null) {
                data.set("tunnel1Phase1LifetimeSeconds", om.valueToTree(this.getTunnel1Phase1LifetimeSeconds()));
            }
            if (this.getTunnel1Phase2DhGroupNumbers() != null) {
                data.set("tunnel1Phase2DhGroupNumbers", om.valueToTree(this.getTunnel1Phase2DhGroupNumbers()));
            }
            if (this.getTunnel1Phase2EncryptionAlgorithms() != null) {
                data.set("tunnel1Phase2EncryptionAlgorithms", om.valueToTree(this.getTunnel1Phase2EncryptionAlgorithms()));
            }
            if (this.getTunnel1Phase2IntegrityAlgorithms() != null) {
                data.set("tunnel1Phase2IntegrityAlgorithms", om.valueToTree(this.getTunnel1Phase2IntegrityAlgorithms()));
            }
            if (this.getTunnel1Phase2LifetimeSeconds() != null) {
                data.set("tunnel1Phase2LifetimeSeconds", om.valueToTree(this.getTunnel1Phase2LifetimeSeconds()));
            }
            if (this.getTunnel1PresharedKey() != null) {
                data.set("tunnel1PresharedKey", om.valueToTree(this.getTunnel1PresharedKey()));
            }
            if (this.getTunnel1RekeyFuzzPercentage() != null) {
                data.set("tunnel1RekeyFuzzPercentage", om.valueToTree(this.getTunnel1RekeyFuzzPercentage()));
            }
            if (this.getTunnel1RekeyMarginTimeSeconds() != null) {
                data.set("tunnel1RekeyMarginTimeSeconds", om.valueToTree(this.getTunnel1RekeyMarginTimeSeconds()));
            }
            if (this.getTunnel1ReplayWindowSize() != null) {
                data.set("tunnel1ReplayWindowSize", om.valueToTree(this.getTunnel1ReplayWindowSize()));
            }
            if (this.getTunnel1StartupAction() != null) {
                data.set("tunnel1StartupAction", om.valueToTree(this.getTunnel1StartupAction()));
            }
            if (this.getTunnel2DpdTimeoutAction() != null) {
                data.set("tunnel2DpdTimeoutAction", om.valueToTree(this.getTunnel2DpdTimeoutAction()));
            }
            if (this.getTunnel2DpdTimeoutSeconds() != null) {
                data.set("tunnel2DpdTimeoutSeconds", om.valueToTree(this.getTunnel2DpdTimeoutSeconds()));
            }
            if (this.getTunnel2EnableTunnelLifecycleControl() != null) {
                data.set("tunnel2EnableTunnelLifecycleControl", om.valueToTree(this.getTunnel2EnableTunnelLifecycleControl()));
            }
            if (this.getTunnel2IkeVersions() != null) {
                data.set("tunnel2IkeVersions", om.valueToTree(this.getTunnel2IkeVersions()));
            }
            if (this.getTunnel2InsideCidr() != null) {
                data.set("tunnel2InsideCidr", om.valueToTree(this.getTunnel2InsideCidr()));
            }
            if (this.getTunnel2InsideIpv6Cidr() != null) {
                data.set("tunnel2InsideIpv6Cidr", om.valueToTree(this.getTunnel2InsideIpv6Cidr()));
            }
            if (this.getTunnel2LogOptions() != null) {
                data.set("tunnel2LogOptions", om.valueToTree(this.getTunnel2LogOptions()));
            }
            if (this.getTunnel2Phase1DhGroupNumbers() != null) {
                data.set("tunnel2Phase1DhGroupNumbers", om.valueToTree(this.getTunnel2Phase1DhGroupNumbers()));
            }
            if (this.getTunnel2Phase1EncryptionAlgorithms() != null) {
                data.set("tunnel2Phase1EncryptionAlgorithms", om.valueToTree(this.getTunnel2Phase1EncryptionAlgorithms()));
            }
            if (this.getTunnel2Phase1IntegrityAlgorithms() != null) {
                data.set("tunnel2Phase1IntegrityAlgorithms", om.valueToTree(this.getTunnel2Phase1IntegrityAlgorithms()));
            }
            if (this.getTunnel2Phase1LifetimeSeconds() != null) {
                data.set("tunnel2Phase1LifetimeSeconds", om.valueToTree(this.getTunnel2Phase1LifetimeSeconds()));
            }
            if (this.getTunnel2Phase2DhGroupNumbers() != null) {
                data.set("tunnel2Phase2DhGroupNumbers", om.valueToTree(this.getTunnel2Phase2DhGroupNumbers()));
            }
            if (this.getTunnel2Phase2EncryptionAlgorithms() != null) {
                data.set("tunnel2Phase2EncryptionAlgorithms", om.valueToTree(this.getTunnel2Phase2EncryptionAlgorithms()));
            }
            if (this.getTunnel2Phase2IntegrityAlgorithms() != null) {
                data.set("tunnel2Phase2IntegrityAlgorithms", om.valueToTree(this.getTunnel2Phase2IntegrityAlgorithms()));
            }
            if (this.getTunnel2Phase2LifetimeSeconds() != null) {
                data.set("tunnel2Phase2LifetimeSeconds", om.valueToTree(this.getTunnel2Phase2LifetimeSeconds()));
            }
            if (this.getTunnel2PresharedKey() != null) {
                data.set("tunnel2PresharedKey", om.valueToTree(this.getTunnel2PresharedKey()));
            }
            if (this.getTunnel2RekeyFuzzPercentage() != null) {
                data.set("tunnel2RekeyFuzzPercentage", om.valueToTree(this.getTunnel2RekeyFuzzPercentage()));
            }
            if (this.getTunnel2RekeyMarginTimeSeconds() != null) {
                data.set("tunnel2RekeyMarginTimeSeconds", om.valueToTree(this.getTunnel2RekeyMarginTimeSeconds()));
            }
            if (this.getTunnel2ReplayWindowSize() != null) {
                data.set("tunnel2ReplayWindowSize", om.valueToTree(this.getTunnel2ReplayWindowSize()));
            }
            if (this.getTunnel2StartupAction() != null) {
                data.set("tunnel2StartupAction", om.valueToTree(this.getTunnel2StartupAction()));
            }
            if (this.getTunnelInsideIpVersion() != null) {
                data.set("tunnelInsideIpVersion", om.valueToTree(this.getTunnelInsideIpVersion()));
            }
            if (this.getVpnGatewayId() != null) {
                data.set("vpnGatewayId", om.valueToTree(this.getVpnGatewayId()));
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
            struct.set("fqn", om.valueToTree("aws.vpnConnection.VpnConnectionConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpnConnectionConfig.Jsii$Proxy that = (VpnConnectionConfig.Jsii$Proxy) o;

            if (!customerGatewayId.equals(that.customerGatewayId)) return false;
            if (!type.equals(that.type)) return false;
            if (this.enableAcceleration != null ? !this.enableAcceleration.equals(that.enableAcceleration) : that.enableAcceleration != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.localIpv4NetworkCidr != null ? !this.localIpv4NetworkCidr.equals(that.localIpv4NetworkCidr) : that.localIpv4NetworkCidr != null) return false;
            if (this.localIpv6NetworkCidr != null ? !this.localIpv6NetworkCidr.equals(that.localIpv6NetworkCidr) : that.localIpv6NetworkCidr != null) return false;
            if (this.outsideIpAddressType != null ? !this.outsideIpAddressType.equals(that.outsideIpAddressType) : that.outsideIpAddressType != null) return false;
            if (this.presharedKeyStorage != null ? !this.presharedKeyStorage.equals(that.presharedKeyStorage) : that.presharedKeyStorage != null) return false;
            if (this.remoteIpv4NetworkCidr != null ? !this.remoteIpv4NetworkCidr.equals(that.remoteIpv4NetworkCidr) : that.remoteIpv4NetworkCidr != null) return false;
            if (this.remoteIpv6NetworkCidr != null ? !this.remoteIpv6NetworkCidr.equals(that.remoteIpv6NetworkCidr) : that.remoteIpv6NetworkCidr != null) return false;
            if (this.staticRoutesOnly != null ? !this.staticRoutesOnly.equals(that.staticRoutesOnly) : that.staticRoutesOnly != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.transitGatewayId != null ? !this.transitGatewayId.equals(that.transitGatewayId) : that.transitGatewayId != null) return false;
            if (this.transportTransitGatewayAttachmentId != null ? !this.transportTransitGatewayAttachmentId.equals(that.transportTransitGatewayAttachmentId) : that.transportTransitGatewayAttachmentId != null) return false;
            if (this.tunnel1DpdTimeoutAction != null ? !this.tunnel1DpdTimeoutAction.equals(that.tunnel1DpdTimeoutAction) : that.tunnel1DpdTimeoutAction != null) return false;
            if (this.tunnel1DpdTimeoutSeconds != null ? !this.tunnel1DpdTimeoutSeconds.equals(that.tunnel1DpdTimeoutSeconds) : that.tunnel1DpdTimeoutSeconds != null) return false;
            if (this.tunnel1EnableTunnelLifecycleControl != null ? !this.tunnel1EnableTunnelLifecycleControl.equals(that.tunnel1EnableTunnelLifecycleControl) : that.tunnel1EnableTunnelLifecycleControl != null) return false;
            if (this.tunnel1IkeVersions != null ? !this.tunnel1IkeVersions.equals(that.tunnel1IkeVersions) : that.tunnel1IkeVersions != null) return false;
            if (this.tunnel1InsideCidr != null ? !this.tunnel1InsideCidr.equals(that.tunnel1InsideCidr) : that.tunnel1InsideCidr != null) return false;
            if (this.tunnel1InsideIpv6Cidr != null ? !this.tunnel1InsideIpv6Cidr.equals(that.tunnel1InsideIpv6Cidr) : that.tunnel1InsideIpv6Cidr != null) return false;
            if (this.tunnel1LogOptions != null ? !this.tunnel1LogOptions.equals(that.tunnel1LogOptions) : that.tunnel1LogOptions != null) return false;
            if (this.tunnel1Phase1DhGroupNumbers != null ? !this.tunnel1Phase1DhGroupNumbers.equals(that.tunnel1Phase1DhGroupNumbers) : that.tunnel1Phase1DhGroupNumbers != null) return false;
            if (this.tunnel1Phase1EncryptionAlgorithms != null ? !this.tunnel1Phase1EncryptionAlgorithms.equals(that.tunnel1Phase1EncryptionAlgorithms) : that.tunnel1Phase1EncryptionAlgorithms != null) return false;
            if (this.tunnel1Phase1IntegrityAlgorithms != null ? !this.tunnel1Phase1IntegrityAlgorithms.equals(that.tunnel1Phase1IntegrityAlgorithms) : that.tunnel1Phase1IntegrityAlgorithms != null) return false;
            if (this.tunnel1Phase1LifetimeSeconds != null ? !this.tunnel1Phase1LifetimeSeconds.equals(that.tunnel1Phase1LifetimeSeconds) : that.tunnel1Phase1LifetimeSeconds != null) return false;
            if (this.tunnel1Phase2DhGroupNumbers != null ? !this.tunnel1Phase2DhGroupNumbers.equals(that.tunnel1Phase2DhGroupNumbers) : that.tunnel1Phase2DhGroupNumbers != null) return false;
            if (this.tunnel1Phase2EncryptionAlgorithms != null ? !this.tunnel1Phase2EncryptionAlgorithms.equals(that.tunnel1Phase2EncryptionAlgorithms) : that.tunnel1Phase2EncryptionAlgorithms != null) return false;
            if (this.tunnel1Phase2IntegrityAlgorithms != null ? !this.tunnel1Phase2IntegrityAlgorithms.equals(that.tunnel1Phase2IntegrityAlgorithms) : that.tunnel1Phase2IntegrityAlgorithms != null) return false;
            if (this.tunnel1Phase2LifetimeSeconds != null ? !this.tunnel1Phase2LifetimeSeconds.equals(that.tunnel1Phase2LifetimeSeconds) : that.tunnel1Phase2LifetimeSeconds != null) return false;
            if (this.tunnel1PresharedKey != null ? !this.tunnel1PresharedKey.equals(that.tunnel1PresharedKey) : that.tunnel1PresharedKey != null) return false;
            if (this.tunnel1RekeyFuzzPercentage != null ? !this.tunnel1RekeyFuzzPercentage.equals(that.tunnel1RekeyFuzzPercentage) : that.tunnel1RekeyFuzzPercentage != null) return false;
            if (this.tunnel1RekeyMarginTimeSeconds != null ? !this.tunnel1RekeyMarginTimeSeconds.equals(that.tunnel1RekeyMarginTimeSeconds) : that.tunnel1RekeyMarginTimeSeconds != null) return false;
            if (this.tunnel1ReplayWindowSize != null ? !this.tunnel1ReplayWindowSize.equals(that.tunnel1ReplayWindowSize) : that.tunnel1ReplayWindowSize != null) return false;
            if (this.tunnel1StartupAction != null ? !this.tunnel1StartupAction.equals(that.tunnel1StartupAction) : that.tunnel1StartupAction != null) return false;
            if (this.tunnel2DpdTimeoutAction != null ? !this.tunnel2DpdTimeoutAction.equals(that.tunnel2DpdTimeoutAction) : that.tunnel2DpdTimeoutAction != null) return false;
            if (this.tunnel2DpdTimeoutSeconds != null ? !this.tunnel2DpdTimeoutSeconds.equals(that.tunnel2DpdTimeoutSeconds) : that.tunnel2DpdTimeoutSeconds != null) return false;
            if (this.tunnel2EnableTunnelLifecycleControl != null ? !this.tunnel2EnableTunnelLifecycleControl.equals(that.tunnel2EnableTunnelLifecycleControl) : that.tunnel2EnableTunnelLifecycleControl != null) return false;
            if (this.tunnel2IkeVersions != null ? !this.tunnel2IkeVersions.equals(that.tunnel2IkeVersions) : that.tunnel2IkeVersions != null) return false;
            if (this.tunnel2InsideCidr != null ? !this.tunnel2InsideCidr.equals(that.tunnel2InsideCidr) : that.tunnel2InsideCidr != null) return false;
            if (this.tunnel2InsideIpv6Cidr != null ? !this.tunnel2InsideIpv6Cidr.equals(that.tunnel2InsideIpv6Cidr) : that.tunnel2InsideIpv6Cidr != null) return false;
            if (this.tunnel2LogOptions != null ? !this.tunnel2LogOptions.equals(that.tunnel2LogOptions) : that.tunnel2LogOptions != null) return false;
            if (this.tunnel2Phase1DhGroupNumbers != null ? !this.tunnel2Phase1DhGroupNumbers.equals(that.tunnel2Phase1DhGroupNumbers) : that.tunnel2Phase1DhGroupNumbers != null) return false;
            if (this.tunnel2Phase1EncryptionAlgorithms != null ? !this.tunnel2Phase1EncryptionAlgorithms.equals(that.tunnel2Phase1EncryptionAlgorithms) : that.tunnel2Phase1EncryptionAlgorithms != null) return false;
            if (this.tunnel2Phase1IntegrityAlgorithms != null ? !this.tunnel2Phase1IntegrityAlgorithms.equals(that.tunnel2Phase1IntegrityAlgorithms) : that.tunnel2Phase1IntegrityAlgorithms != null) return false;
            if (this.tunnel2Phase1LifetimeSeconds != null ? !this.tunnel2Phase1LifetimeSeconds.equals(that.tunnel2Phase1LifetimeSeconds) : that.tunnel2Phase1LifetimeSeconds != null) return false;
            if (this.tunnel2Phase2DhGroupNumbers != null ? !this.tunnel2Phase2DhGroupNumbers.equals(that.tunnel2Phase2DhGroupNumbers) : that.tunnel2Phase2DhGroupNumbers != null) return false;
            if (this.tunnel2Phase2EncryptionAlgorithms != null ? !this.tunnel2Phase2EncryptionAlgorithms.equals(that.tunnel2Phase2EncryptionAlgorithms) : that.tunnel2Phase2EncryptionAlgorithms != null) return false;
            if (this.tunnel2Phase2IntegrityAlgorithms != null ? !this.tunnel2Phase2IntegrityAlgorithms.equals(that.tunnel2Phase2IntegrityAlgorithms) : that.tunnel2Phase2IntegrityAlgorithms != null) return false;
            if (this.tunnel2Phase2LifetimeSeconds != null ? !this.tunnel2Phase2LifetimeSeconds.equals(that.tunnel2Phase2LifetimeSeconds) : that.tunnel2Phase2LifetimeSeconds != null) return false;
            if (this.tunnel2PresharedKey != null ? !this.tunnel2PresharedKey.equals(that.tunnel2PresharedKey) : that.tunnel2PresharedKey != null) return false;
            if (this.tunnel2RekeyFuzzPercentage != null ? !this.tunnel2RekeyFuzzPercentage.equals(that.tunnel2RekeyFuzzPercentage) : that.tunnel2RekeyFuzzPercentage != null) return false;
            if (this.tunnel2RekeyMarginTimeSeconds != null ? !this.tunnel2RekeyMarginTimeSeconds.equals(that.tunnel2RekeyMarginTimeSeconds) : that.tunnel2RekeyMarginTimeSeconds != null) return false;
            if (this.tunnel2ReplayWindowSize != null ? !this.tunnel2ReplayWindowSize.equals(that.tunnel2ReplayWindowSize) : that.tunnel2ReplayWindowSize != null) return false;
            if (this.tunnel2StartupAction != null ? !this.tunnel2StartupAction.equals(that.tunnel2StartupAction) : that.tunnel2StartupAction != null) return false;
            if (this.tunnelInsideIpVersion != null ? !this.tunnelInsideIpVersion.equals(that.tunnelInsideIpVersion) : that.tunnelInsideIpVersion != null) return false;
            if (this.vpnGatewayId != null ? !this.vpnGatewayId.equals(that.vpnGatewayId) : that.vpnGatewayId != null) return false;
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
            int result = this.customerGatewayId.hashCode();
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.enableAcceleration != null ? this.enableAcceleration.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.localIpv4NetworkCidr != null ? this.localIpv4NetworkCidr.hashCode() : 0);
            result = 31 * result + (this.localIpv6NetworkCidr != null ? this.localIpv6NetworkCidr.hashCode() : 0);
            result = 31 * result + (this.outsideIpAddressType != null ? this.outsideIpAddressType.hashCode() : 0);
            result = 31 * result + (this.presharedKeyStorage != null ? this.presharedKeyStorage.hashCode() : 0);
            result = 31 * result + (this.remoteIpv4NetworkCidr != null ? this.remoteIpv4NetworkCidr.hashCode() : 0);
            result = 31 * result + (this.remoteIpv6NetworkCidr != null ? this.remoteIpv6NetworkCidr.hashCode() : 0);
            result = 31 * result + (this.staticRoutesOnly != null ? this.staticRoutesOnly.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.transitGatewayId != null ? this.transitGatewayId.hashCode() : 0);
            result = 31 * result + (this.transportTransitGatewayAttachmentId != null ? this.transportTransitGatewayAttachmentId.hashCode() : 0);
            result = 31 * result + (this.tunnel1DpdTimeoutAction != null ? this.tunnel1DpdTimeoutAction.hashCode() : 0);
            result = 31 * result + (this.tunnel1DpdTimeoutSeconds != null ? this.tunnel1DpdTimeoutSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel1EnableTunnelLifecycleControl != null ? this.tunnel1EnableTunnelLifecycleControl.hashCode() : 0);
            result = 31 * result + (this.tunnel1IkeVersions != null ? this.tunnel1IkeVersions.hashCode() : 0);
            result = 31 * result + (this.tunnel1InsideCidr != null ? this.tunnel1InsideCidr.hashCode() : 0);
            result = 31 * result + (this.tunnel1InsideIpv6Cidr != null ? this.tunnel1InsideIpv6Cidr.hashCode() : 0);
            result = 31 * result + (this.tunnel1LogOptions != null ? this.tunnel1LogOptions.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase1DhGroupNumbers != null ? this.tunnel1Phase1DhGroupNumbers.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase1EncryptionAlgorithms != null ? this.tunnel1Phase1EncryptionAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase1IntegrityAlgorithms != null ? this.tunnel1Phase1IntegrityAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase1LifetimeSeconds != null ? this.tunnel1Phase1LifetimeSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase2DhGroupNumbers != null ? this.tunnel1Phase2DhGroupNumbers.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase2EncryptionAlgorithms != null ? this.tunnel1Phase2EncryptionAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase2IntegrityAlgorithms != null ? this.tunnel1Phase2IntegrityAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel1Phase2LifetimeSeconds != null ? this.tunnel1Phase2LifetimeSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel1PresharedKey != null ? this.tunnel1PresharedKey.hashCode() : 0);
            result = 31 * result + (this.tunnel1RekeyFuzzPercentage != null ? this.tunnel1RekeyFuzzPercentage.hashCode() : 0);
            result = 31 * result + (this.tunnel1RekeyMarginTimeSeconds != null ? this.tunnel1RekeyMarginTimeSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel1ReplayWindowSize != null ? this.tunnel1ReplayWindowSize.hashCode() : 0);
            result = 31 * result + (this.tunnel1StartupAction != null ? this.tunnel1StartupAction.hashCode() : 0);
            result = 31 * result + (this.tunnel2DpdTimeoutAction != null ? this.tunnel2DpdTimeoutAction.hashCode() : 0);
            result = 31 * result + (this.tunnel2DpdTimeoutSeconds != null ? this.tunnel2DpdTimeoutSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel2EnableTunnelLifecycleControl != null ? this.tunnel2EnableTunnelLifecycleControl.hashCode() : 0);
            result = 31 * result + (this.tunnel2IkeVersions != null ? this.tunnel2IkeVersions.hashCode() : 0);
            result = 31 * result + (this.tunnel2InsideCidr != null ? this.tunnel2InsideCidr.hashCode() : 0);
            result = 31 * result + (this.tunnel2InsideIpv6Cidr != null ? this.tunnel2InsideIpv6Cidr.hashCode() : 0);
            result = 31 * result + (this.tunnel2LogOptions != null ? this.tunnel2LogOptions.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase1DhGroupNumbers != null ? this.tunnel2Phase1DhGroupNumbers.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase1EncryptionAlgorithms != null ? this.tunnel2Phase1EncryptionAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase1IntegrityAlgorithms != null ? this.tunnel2Phase1IntegrityAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase1LifetimeSeconds != null ? this.tunnel2Phase1LifetimeSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase2DhGroupNumbers != null ? this.tunnel2Phase2DhGroupNumbers.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase2EncryptionAlgorithms != null ? this.tunnel2Phase2EncryptionAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase2IntegrityAlgorithms != null ? this.tunnel2Phase2IntegrityAlgorithms.hashCode() : 0);
            result = 31 * result + (this.tunnel2Phase2LifetimeSeconds != null ? this.tunnel2Phase2LifetimeSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel2PresharedKey != null ? this.tunnel2PresharedKey.hashCode() : 0);
            result = 31 * result + (this.tunnel2RekeyFuzzPercentage != null ? this.tunnel2RekeyFuzzPercentage.hashCode() : 0);
            result = 31 * result + (this.tunnel2RekeyMarginTimeSeconds != null ? this.tunnel2RekeyMarginTimeSeconds.hashCode() : 0);
            result = 31 * result + (this.tunnel2ReplayWindowSize != null ? this.tunnel2ReplayWindowSize.hashCode() : 0);
            result = 31 * result + (this.tunnel2StartupAction != null ? this.tunnel2StartupAction.hashCode() : 0);
            result = 31 * result + (this.tunnelInsideIpVersion != null ? this.tunnelInsideIpVersion.hashCode() : 0);
            result = 31 * result + (this.vpnGatewayId != null ? this.vpnGatewayId.hashCode() : 0);
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
