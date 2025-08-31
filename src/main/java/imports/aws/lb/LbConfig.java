package imports.aws.lb;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.524Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lb.LbConfig")
@software.amazon.jsii.Jsii.Proxy(LbConfig.Jsii$Proxy.class)
public interface LbConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * access_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#access_logs Lb#access_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb.LbAccessLogs getAccessLogs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#client_keep_alive Lb#client_keep_alive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getClientKeepAlive() {
        return null;
    }

    /**
     * connection_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#connection_logs Lb#connection_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb.LbConnectionLogs getConnectionLogs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#customer_owned_ipv4_pool Lb#customer_owned_ipv4_pool}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerOwnedIpv4Pool() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#desync_mitigation_mode Lb#desync_mitigation_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDesyncMitigationMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#dns_record_client_routing_policy Lb#dns_record_client_routing_policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDnsRecordClientRoutingPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#drop_invalid_header_fields Lb#drop_invalid_header_fields}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getDropInvalidHeaderFields() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_cross_zone_load_balancing Lb#enable_cross_zone_load_balancing}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableCrossZoneLoadBalancing() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_deletion_protection Lb#enable_deletion_protection}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableDeletionProtection() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_http2 Lb#enable_http2}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableHttp2() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_tls_version_and_cipher_suite_headers Lb#enable_tls_version_and_cipher_suite_headers}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableTlsVersionAndCipherSuiteHeaders() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_waf_fail_open Lb#enable_waf_fail_open}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableWafFailOpen() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_xff_client_port Lb#enable_xff_client_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableXffClientPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_zonal_shift Lb#enable_zonal_shift}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnableZonalShift() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enforce_security_group_inbound_rules_on_private_link_traffic Lb#enforce_security_group_inbound_rules_on_private_link_traffic}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#id Lb#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#idle_timeout Lb#idle_timeout}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIdleTimeout() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#internal Lb#internal}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInternal() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ip_address_type Lb#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * ipam_pools block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipam_pools Lb#ipam_pools}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb.LbIpamPools getIpamPools() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#load_balancer_type Lb#load_balancer_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLoadBalancerType() {
        return null;
    }

    /**
     * minimum_load_balancer_capacity block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#minimum_load_balancer_capacity Lb#minimum_load_balancer_capacity}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb.LbMinimumLoadBalancerCapacity getMinimumLoadBalancerCapacity() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name Lb#name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name_prefix Lb#name_prefix}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNamePrefix() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#preserve_host_header Lb#preserve_host_header}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPreserveHostHeader() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#security_groups Lb#security_groups}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroups() {
        return null;
    }

    /**
     * subnet_mapping block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_mapping Lb#subnet_mapping}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSubnetMapping() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnets Lb#subnets}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnets() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags Lb#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags_all Lb#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#timeouts Lb#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lb.LbTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#xff_header_processing_mode Lb#xff_header_processing_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getXffHeaderProcessingMode() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LbConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LbConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LbConfig> {
        imports.aws.lb.LbAccessLogs accessLogs;
        java.lang.Number clientKeepAlive;
        imports.aws.lb.LbConnectionLogs connectionLogs;
        java.lang.String customerOwnedIpv4Pool;
        java.lang.String desyncMitigationMode;
        java.lang.String dnsRecordClientRoutingPolicy;
        java.lang.Object dropInvalidHeaderFields;
        java.lang.Object enableCrossZoneLoadBalancing;
        java.lang.Object enableDeletionProtection;
        java.lang.Object enableHttp2;
        java.lang.Object enableTlsVersionAndCipherSuiteHeaders;
        java.lang.Object enableWafFailOpen;
        java.lang.Object enableXffClientPort;
        java.lang.Object enableZonalShift;
        java.lang.String enforceSecurityGroupInboundRulesOnPrivateLinkTraffic;
        java.lang.String id;
        java.lang.Number idleTimeout;
        java.lang.Object internal;
        java.lang.String ipAddressType;
        imports.aws.lb.LbIpamPools ipamPools;
        java.lang.String loadBalancerType;
        imports.aws.lb.LbMinimumLoadBalancerCapacity minimumLoadBalancerCapacity;
        java.lang.String name;
        java.lang.String namePrefix;
        java.lang.Object preserveHostHeader;
        java.util.List<java.lang.String> securityGroups;
        java.lang.Object subnetMapping;
        java.util.List<java.lang.String> subnets;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.lb.LbTimeouts timeouts;
        java.lang.String xffHeaderProcessingMode;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link LbConfig#getAccessLogs}
         * @param accessLogs access_logs block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#access_logs Lb#access_logs}
         * @return {@code this}
         */
        public Builder accessLogs(imports.aws.lb.LbAccessLogs accessLogs) {
            this.accessLogs = accessLogs;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getClientKeepAlive}
         * @param clientKeepAlive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#client_keep_alive Lb#client_keep_alive}.
         * @return {@code this}
         */
        public Builder clientKeepAlive(java.lang.Number clientKeepAlive) {
            this.clientKeepAlive = clientKeepAlive;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getConnectionLogs}
         * @param connectionLogs connection_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#connection_logs Lb#connection_logs}
         * @return {@code this}
         */
        public Builder connectionLogs(imports.aws.lb.LbConnectionLogs connectionLogs) {
            this.connectionLogs = connectionLogs;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getCustomerOwnedIpv4Pool}
         * @param customerOwnedIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#customer_owned_ipv4_pool Lb#customer_owned_ipv4_pool}.
         * @return {@code this}
         */
        public Builder customerOwnedIpv4Pool(java.lang.String customerOwnedIpv4Pool) {
            this.customerOwnedIpv4Pool = customerOwnedIpv4Pool;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getDesyncMitigationMode}
         * @param desyncMitigationMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#desync_mitigation_mode Lb#desync_mitigation_mode}.
         * @return {@code this}
         */
        public Builder desyncMitigationMode(java.lang.String desyncMitigationMode) {
            this.desyncMitigationMode = desyncMitigationMode;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getDnsRecordClientRoutingPolicy}
         * @param dnsRecordClientRoutingPolicy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#dns_record_client_routing_policy Lb#dns_record_client_routing_policy}.
         * @return {@code this}
         */
        public Builder dnsRecordClientRoutingPolicy(java.lang.String dnsRecordClientRoutingPolicy) {
            this.dnsRecordClientRoutingPolicy = dnsRecordClientRoutingPolicy;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getDropInvalidHeaderFields}
         * @param dropInvalidHeaderFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#drop_invalid_header_fields Lb#drop_invalid_header_fields}.
         * @return {@code this}
         */
        public Builder dropInvalidHeaderFields(java.lang.Boolean dropInvalidHeaderFields) {
            this.dropInvalidHeaderFields = dropInvalidHeaderFields;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getDropInvalidHeaderFields}
         * @param dropInvalidHeaderFields Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#drop_invalid_header_fields Lb#drop_invalid_header_fields}.
         * @return {@code this}
         */
        public Builder dropInvalidHeaderFields(com.hashicorp.cdktf.IResolvable dropInvalidHeaderFields) {
            this.dropInvalidHeaderFields = dropInvalidHeaderFields;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableCrossZoneLoadBalancing}
         * @param enableCrossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_cross_zone_load_balancing Lb#enable_cross_zone_load_balancing}.
         * @return {@code this}
         */
        public Builder enableCrossZoneLoadBalancing(java.lang.Boolean enableCrossZoneLoadBalancing) {
            this.enableCrossZoneLoadBalancing = enableCrossZoneLoadBalancing;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableCrossZoneLoadBalancing}
         * @param enableCrossZoneLoadBalancing Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_cross_zone_load_balancing Lb#enable_cross_zone_load_balancing}.
         * @return {@code this}
         */
        public Builder enableCrossZoneLoadBalancing(com.hashicorp.cdktf.IResolvable enableCrossZoneLoadBalancing) {
            this.enableCrossZoneLoadBalancing = enableCrossZoneLoadBalancing;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableDeletionProtection}
         * @param enableDeletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_deletion_protection Lb#enable_deletion_protection}.
         * @return {@code this}
         */
        public Builder enableDeletionProtection(java.lang.Boolean enableDeletionProtection) {
            this.enableDeletionProtection = enableDeletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableDeletionProtection}
         * @param enableDeletionProtection Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_deletion_protection Lb#enable_deletion_protection}.
         * @return {@code this}
         */
        public Builder enableDeletionProtection(com.hashicorp.cdktf.IResolvable enableDeletionProtection) {
            this.enableDeletionProtection = enableDeletionProtection;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableHttp2}
         * @param enableHttp2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_http2 Lb#enable_http2}.
         * @return {@code this}
         */
        public Builder enableHttp2(java.lang.Boolean enableHttp2) {
            this.enableHttp2 = enableHttp2;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableHttp2}
         * @param enableHttp2 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_http2 Lb#enable_http2}.
         * @return {@code this}
         */
        public Builder enableHttp2(com.hashicorp.cdktf.IResolvable enableHttp2) {
            this.enableHttp2 = enableHttp2;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableTlsVersionAndCipherSuiteHeaders}
         * @param enableTlsVersionAndCipherSuiteHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_tls_version_and_cipher_suite_headers Lb#enable_tls_version_and_cipher_suite_headers}.
         * @return {@code this}
         */
        public Builder enableTlsVersionAndCipherSuiteHeaders(java.lang.Boolean enableTlsVersionAndCipherSuiteHeaders) {
            this.enableTlsVersionAndCipherSuiteHeaders = enableTlsVersionAndCipherSuiteHeaders;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableTlsVersionAndCipherSuiteHeaders}
         * @param enableTlsVersionAndCipherSuiteHeaders Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_tls_version_and_cipher_suite_headers Lb#enable_tls_version_and_cipher_suite_headers}.
         * @return {@code this}
         */
        public Builder enableTlsVersionAndCipherSuiteHeaders(com.hashicorp.cdktf.IResolvable enableTlsVersionAndCipherSuiteHeaders) {
            this.enableTlsVersionAndCipherSuiteHeaders = enableTlsVersionAndCipherSuiteHeaders;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableWafFailOpen}
         * @param enableWafFailOpen Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_waf_fail_open Lb#enable_waf_fail_open}.
         * @return {@code this}
         */
        public Builder enableWafFailOpen(java.lang.Boolean enableWafFailOpen) {
            this.enableWafFailOpen = enableWafFailOpen;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableWafFailOpen}
         * @param enableWafFailOpen Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_waf_fail_open Lb#enable_waf_fail_open}.
         * @return {@code this}
         */
        public Builder enableWafFailOpen(com.hashicorp.cdktf.IResolvable enableWafFailOpen) {
            this.enableWafFailOpen = enableWafFailOpen;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableXffClientPort}
         * @param enableXffClientPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_xff_client_port Lb#enable_xff_client_port}.
         * @return {@code this}
         */
        public Builder enableXffClientPort(java.lang.Boolean enableXffClientPort) {
            this.enableXffClientPort = enableXffClientPort;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableXffClientPort}
         * @param enableXffClientPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_xff_client_port Lb#enable_xff_client_port}.
         * @return {@code this}
         */
        public Builder enableXffClientPort(com.hashicorp.cdktf.IResolvable enableXffClientPort) {
            this.enableXffClientPort = enableXffClientPort;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableZonalShift}
         * @param enableZonalShift Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_zonal_shift Lb#enable_zonal_shift}.
         * @return {@code this}
         */
        public Builder enableZonalShift(java.lang.Boolean enableZonalShift) {
            this.enableZonalShift = enableZonalShift;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnableZonalShift}
         * @param enableZonalShift Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enable_zonal_shift Lb#enable_zonal_shift}.
         * @return {@code this}
         */
        public Builder enableZonalShift(com.hashicorp.cdktf.IResolvable enableZonalShift) {
            this.enableZonalShift = enableZonalShift;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic}
         * @param enforceSecurityGroupInboundRulesOnPrivateLinkTraffic Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#enforce_security_group_inbound_rules_on_private_link_traffic Lb#enforce_security_group_inbound_rules_on_private_link_traffic}.
         * @return {@code this}
         */
        public Builder enforceSecurityGroupInboundRulesOnPrivateLinkTraffic(java.lang.String enforceSecurityGroupInboundRulesOnPrivateLinkTraffic) {
            this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic = enforceSecurityGroupInboundRulesOnPrivateLinkTraffic;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#id Lb#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getIdleTimeout}
         * @param idleTimeout Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#idle_timeout Lb#idle_timeout}.
         * @return {@code this}
         */
        public Builder idleTimeout(java.lang.Number idleTimeout) {
            this.idleTimeout = idleTimeout;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getInternal}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#internal Lb#internal}.
         * @return {@code this}
         */
        public Builder internal(java.lang.Boolean internal) {
            this.internal = internal;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getInternal}
         * @param internal Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#internal Lb#internal}.
         * @return {@code this}
         */
        public Builder internal(com.hashicorp.cdktf.IResolvable internal) {
            this.internal = internal;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ip_address_type Lb#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getIpamPools}
         * @param ipamPools ipam_pools block.
         *                  Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#ipam_pools Lb#ipam_pools}
         * @return {@code this}
         */
        public Builder ipamPools(imports.aws.lb.LbIpamPools ipamPools) {
            this.ipamPools = ipamPools;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getLoadBalancerType}
         * @param loadBalancerType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#load_balancer_type Lb#load_balancer_type}.
         * @return {@code this}
         */
        public Builder loadBalancerType(java.lang.String loadBalancerType) {
            this.loadBalancerType = loadBalancerType;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getMinimumLoadBalancerCapacity}
         * @param minimumLoadBalancerCapacity minimum_load_balancer_capacity block.
         *                                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#minimum_load_balancer_capacity Lb#minimum_load_balancer_capacity}
         * @return {@code this}
         */
        public Builder minimumLoadBalancerCapacity(imports.aws.lb.LbMinimumLoadBalancerCapacity minimumLoadBalancerCapacity) {
            this.minimumLoadBalancerCapacity = minimumLoadBalancerCapacity;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name Lb#name}.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#name_prefix Lb#name_prefix}.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getPreserveHostHeader}
         * @param preserveHostHeader Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#preserve_host_header Lb#preserve_host_header}.
         * @return {@code this}
         */
        public Builder preserveHostHeader(java.lang.Boolean preserveHostHeader) {
            this.preserveHostHeader = preserveHostHeader;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getPreserveHostHeader}
         * @param preserveHostHeader Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#preserve_host_header Lb#preserve_host_header}.
         * @return {@code this}
         */
        public Builder preserveHostHeader(com.hashicorp.cdktf.IResolvable preserveHostHeader) {
            this.preserveHostHeader = preserveHostHeader;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getSecurityGroups}
         * @param securityGroups Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#security_groups Lb#security_groups}.
         * @return {@code this}
         */
        public Builder securityGroups(java.util.List<java.lang.String> securityGroups) {
            this.securityGroups = securityGroups;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getSubnetMapping}
         * @param subnetMapping subnet_mapping block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_mapping Lb#subnet_mapping}
         * @return {@code this}
         */
        public Builder subnetMapping(com.hashicorp.cdktf.IResolvable subnetMapping) {
            this.subnetMapping = subnetMapping;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getSubnetMapping}
         * @param subnetMapping subnet_mapping block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnet_mapping Lb#subnet_mapping}
         * @return {@code this}
         */
        public Builder subnetMapping(java.util.List<? extends imports.aws.lb.LbSubnetMapping> subnetMapping) {
            this.subnetMapping = subnetMapping;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getSubnets}
         * @param subnets Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#subnets Lb#subnets}.
         * @return {@code this}
         */
        public Builder subnets(java.util.List<java.lang.String> subnets) {
            this.subnets = subnets;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags Lb#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#tags_all Lb#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#timeouts Lb#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.lb.LbTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getXffHeaderProcessingMode}
         * @param xffHeaderProcessingMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lb#xff_header_processing_mode Lb#xff_header_processing_mode}.
         * @return {@code this}
         */
        public Builder xffHeaderProcessingMode(java.lang.String xffHeaderProcessingMode) {
            this.xffHeaderProcessingMode = xffHeaderProcessingMode;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getDependsOn}
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
         * Sets the value of {@link LbConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link LbConfig#getProvisioners}
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
         * @return a new instance of {@link LbConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LbConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LbConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LbConfig {
        private final imports.aws.lb.LbAccessLogs accessLogs;
        private final java.lang.Number clientKeepAlive;
        private final imports.aws.lb.LbConnectionLogs connectionLogs;
        private final java.lang.String customerOwnedIpv4Pool;
        private final java.lang.String desyncMitigationMode;
        private final java.lang.String dnsRecordClientRoutingPolicy;
        private final java.lang.Object dropInvalidHeaderFields;
        private final java.lang.Object enableCrossZoneLoadBalancing;
        private final java.lang.Object enableDeletionProtection;
        private final java.lang.Object enableHttp2;
        private final java.lang.Object enableTlsVersionAndCipherSuiteHeaders;
        private final java.lang.Object enableWafFailOpen;
        private final java.lang.Object enableXffClientPort;
        private final java.lang.Object enableZonalShift;
        private final java.lang.String enforceSecurityGroupInboundRulesOnPrivateLinkTraffic;
        private final java.lang.String id;
        private final java.lang.Number idleTimeout;
        private final java.lang.Object internal;
        private final java.lang.String ipAddressType;
        private final imports.aws.lb.LbIpamPools ipamPools;
        private final java.lang.String loadBalancerType;
        private final imports.aws.lb.LbMinimumLoadBalancerCapacity minimumLoadBalancerCapacity;
        private final java.lang.String name;
        private final java.lang.String namePrefix;
        private final java.lang.Object preserveHostHeader;
        private final java.util.List<java.lang.String> securityGroups;
        private final java.lang.Object subnetMapping;
        private final java.util.List<java.lang.String> subnets;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.lb.LbTimeouts timeouts;
        private final java.lang.String xffHeaderProcessingMode;
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
            this.accessLogs = software.amazon.jsii.Kernel.get(this, "accessLogs", software.amazon.jsii.NativeType.forClass(imports.aws.lb.LbAccessLogs.class));
            this.clientKeepAlive = software.amazon.jsii.Kernel.get(this, "clientKeepAlive", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.connectionLogs = software.amazon.jsii.Kernel.get(this, "connectionLogs", software.amazon.jsii.NativeType.forClass(imports.aws.lb.LbConnectionLogs.class));
            this.customerOwnedIpv4Pool = software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.desyncMitigationMode = software.amazon.jsii.Kernel.get(this, "desyncMitigationMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dnsRecordClientRoutingPolicy = software.amazon.jsii.Kernel.get(this, "dnsRecordClientRoutingPolicy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dropInvalidHeaderFields = software.amazon.jsii.Kernel.get(this, "dropInvalidHeaderFields", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableCrossZoneLoadBalancing = software.amazon.jsii.Kernel.get(this, "enableCrossZoneLoadBalancing", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableDeletionProtection = software.amazon.jsii.Kernel.get(this, "enableDeletionProtection", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableHttp2 = software.amazon.jsii.Kernel.get(this, "enableHttp2", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableTlsVersionAndCipherSuiteHeaders = software.amazon.jsii.Kernel.get(this, "enableTlsVersionAndCipherSuiteHeaders", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableWafFailOpen = software.amazon.jsii.Kernel.get(this, "enableWafFailOpen", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableXffClientPort = software.amazon.jsii.Kernel.get(this, "enableXffClientPort", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enableZonalShift = software.amazon.jsii.Kernel.get(this, "enableZonalShift", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic = software.amazon.jsii.Kernel.get(this, "enforceSecurityGroupInboundRulesOnPrivateLinkTraffic", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.idleTimeout = software.amazon.jsii.Kernel.get(this, "idleTimeout", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.internal = software.amazon.jsii.Kernel.get(this, "internal", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipamPools = software.amazon.jsii.Kernel.get(this, "ipamPools", software.amazon.jsii.NativeType.forClass(imports.aws.lb.LbIpamPools.class));
            this.loadBalancerType = software.amazon.jsii.Kernel.get(this, "loadBalancerType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.minimumLoadBalancerCapacity = software.amazon.jsii.Kernel.get(this, "minimumLoadBalancerCapacity", software.amazon.jsii.NativeType.forClass(imports.aws.lb.LbMinimumLoadBalancerCapacity.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.preserveHostHeader = software.amazon.jsii.Kernel.get(this, "preserveHostHeader", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.securityGroups = software.amazon.jsii.Kernel.get(this, "securityGroups", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.subnetMapping = software.amazon.jsii.Kernel.get(this, "subnetMapping", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.subnets = software.amazon.jsii.Kernel.get(this, "subnets", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.lb.LbTimeouts.class));
            this.xffHeaderProcessingMode = software.amazon.jsii.Kernel.get(this, "xffHeaderProcessingMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.accessLogs = builder.accessLogs;
            this.clientKeepAlive = builder.clientKeepAlive;
            this.connectionLogs = builder.connectionLogs;
            this.customerOwnedIpv4Pool = builder.customerOwnedIpv4Pool;
            this.desyncMitigationMode = builder.desyncMitigationMode;
            this.dnsRecordClientRoutingPolicy = builder.dnsRecordClientRoutingPolicy;
            this.dropInvalidHeaderFields = builder.dropInvalidHeaderFields;
            this.enableCrossZoneLoadBalancing = builder.enableCrossZoneLoadBalancing;
            this.enableDeletionProtection = builder.enableDeletionProtection;
            this.enableHttp2 = builder.enableHttp2;
            this.enableTlsVersionAndCipherSuiteHeaders = builder.enableTlsVersionAndCipherSuiteHeaders;
            this.enableWafFailOpen = builder.enableWafFailOpen;
            this.enableXffClientPort = builder.enableXffClientPort;
            this.enableZonalShift = builder.enableZonalShift;
            this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic = builder.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic;
            this.id = builder.id;
            this.idleTimeout = builder.idleTimeout;
            this.internal = builder.internal;
            this.ipAddressType = builder.ipAddressType;
            this.ipamPools = builder.ipamPools;
            this.loadBalancerType = builder.loadBalancerType;
            this.minimumLoadBalancerCapacity = builder.minimumLoadBalancerCapacity;
            this.name = builder.name;
            this.namePrefix = builder.namePrefix;
            this.preserveHostHeader = builder.preserveHostHeader;
            this.securityGroups = builder.securityGroups;
            this.subnetMapping = builder.subnetMapping;
            this.subnets = builder.subnets;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.xffHeaderProcessingMode = builder.xffHeaderProcessingMode;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final imports.aws.lb.LbAccessLogs getAccessLogs() {
            return this.accessLogs;
        }

        @Override
        public final java.lang.Number getClientKeepAlive() {
            return this.clientKeepAlive;
        }

        @Override
        public final imports.aws.lb.LbConnectionLogs getConnectionLogs() {
            return this.connectionLogs;
        }

        @Override
        public final java.lang.String getCustomerOwnedIpv4Pool() {
            return this.customerOwnedIpv4Pool;
        }

        @Override
        public final java.lang.String getDesyncMitigationMode() {
            return this.desyncMitigationMode;
        }

        @Override
        public final java.lang.String getDnsRecordClientRoutingPolicy() {
            return this.dnsRecordClientRoutingPolicy;
        }

        @Override
        public final java.lang.Object getDropInvalidHeaderFields() {
            return this.dropInvalidHeaderFields;
        }

        @Override
        public final java.lang.Object getEnableCrossZoneLoadBalancing() {
            return this.enableCrossZoneLoadBalancing;
        }

        @Override
        public final java.lang.Object getEnableDeletionProtection() {
            return this.enableDeletionProtection;
        }

        @Override
        public final java.lang.Object getEnableHttp2() {
            return this.enableHttp2;
        }

        @Override
        public final java.lang.Object getEnableTlsVersionAndCipherSuiteHeaders() {
            return this.enableTlsVersionAndCipherSuiteHeaders;
        }

        @Override
        public final java.lang.Object getEnableWafFailOpen() {
            return this.enableWafFailOpen;
        }

        @Override
        public final java.lang.Object getEnableXffClientPort() {
            return this.enableXffClientPort;
        }

        @Override
        public final java.lang.Object getEnableZonalShift() {
            return this.enableZonalShift;
        }

        @Override
        public final java.lang.String getEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic() {
            return this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getIdleTimeout() {
            return this.idleTimeout;
        }

        @Override
        public final java.lang.Object getInternal() {
            return this.internal;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        public final imports.aws.lb.LbIpamPools getIpamPools() {
            return this.ipamPools;
        }

        @Override
        public final java.lang.String getLoadBalancerType() {
            return this.loadBalancerType;
        }

        @Override
        public final imports.aws.lb.LbMinimumLoadBalancerCapacity getMinimumLoadBalancerCapacity() {
            return this.minimumLoadBalancerCapacity;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final java.lang.Object getPreserveHostHeader() {
            return this.preserveHostHeader;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroups() {
            return this.securityGroups;
        }

        @Override
        public final java.lang.Object getSubnetMapping() {
            return this.subnetMapping;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnets() {
            return this.subnets;
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
        public final imports.aws.lb.LbTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getXffHeaderProcessingMode() {
            return this.xffHeaderProcessingMode;
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

            if (this.getAccessLogs() != null) {
                data.set("accessLogs", om.valueToTree(this.getAccessLogs()));
            }
            if (this.getClientKeepAlive() != null) {
                data.set("clientKeepAlive", om.valueToTree(this.getClientKeepAlive()));
            }
            if (this.getConnectionLogs() != null) {
                data.set("connectionLogs", om.valueToTree(this.getConnectionLogs()));
            }
            if (this.getCustomerOwnedIpv4Pool() != null) {
                data.set("customerOwnedIpv4Pool", om.valueToTree(this.getCustomerOwnedIpv4Pool()));
            }
            if (this.getDesyncMitigationMode() != null) {
                data.set("desyncMitigationMode", om.valueToTree(this.getDesyncMitigationMode()));
            }
            if (this.getDnsRecordClientRoutingPolicy() != null) {
                data.set("dnsRecordClientRoutingPolicy", om.valueToTree(this.getDnsRecordClientRoutingPolicy()));
            }
            if (this.getDropInvalidHeaderFields() != null) {
                data.set("dropInvalidHeaderFields", om.valueToTree(this.getDropInvalidHeaderFields()));
            }
            if (this.getEnableCrossZoneLoadBalancing() != null) {
                data.set("enableCrossZoneLoadBalancing", om.valueToTree(this.getEnableCrossZoneLoadBalancing()));
            }
            if (this.getEnableDeletionProtection() != null) {
                data.set("enableDeletionProtection", om.valueToTree(this.getEnableDeletionProtection()));
            }
            if (this.getEnableHttp2() != null) {
                data.set("enableHttp2", om.valueToTree(this.getEnableHttp2()));
            }
            if (this.getEnableTlsVersionAndCipherSuiteHeaders() != null) {
                data.set("enableTlsVersionAndCipherSuiteHeaders", om.valueToTree(this.getEnableTlsVersionAndCipherSuiteHeaders()));
            }
            if (this.getEnableWafFailOpen() != null) {
                data.set("enableWafFailOpen", om.valueToTree(this.getEnableWafFailOpen()));
            }
            if (this.getEnableXffClientPort() != null) {
                data.set("enableXffClientPort", om.valueToTree(this.getEnableXffClientPort()));
            }
            if (this.getEnableZonalShift() != null) {
                data.set("enableZonalShift", om.valueToTree(this.getEnableZonalShift()));
            }
            if (this.getEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic() != null) {
                data.set("enforceSecurityGroupInboundRulesOnPrivateLinkTraffic", om.valueToTree(this.getEnforceSecurityGroupInboundRulesOnPrivateLinkTraffic()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIdleTimeout() != null) {
                data.set("idleTimeout", om.valueToTree(this.getIdleTimeout()));
            }
            if (this.getInternal() != null) {
                data.set("internal", om.valueToTree(this.getInternal()));
            }
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }
            if (this.getIpamPools() != null) {
                data.set("ipamPools", om.valueToTree(this.getIpamPools()));
            }
            if (this.getLoadBalancerType() != null) {
                data.set("loadBalancerType", om.valueToTree(this.getLoadBalancerType()));
            }
            if (this.getMinimumLoadBalancerCapacity() != null) {
                data.set("minimumLoadBalancerCapacity", om.valueToTree(this.getMinimumLoadBalancerCapacity()));
            }
            if (this.getName() != null) {
                data.set("name", om.valueToTree(this.getName()));
            }
            if (this.getNamePrefix() != null) {
                data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            }
            if (this.getPreserveHostHeader() != null) {
                data.set("preserveHostHeader", om.valueToTree(this.getPreserveHostHeader()));
            }
            if (this.getSecurityGroups() != null) {
                data.set("securityGroups", om.valueToTree(this.getSecurityGroups()));
            }
            if (this.getSubnetMapping() != null) {
                data.set("subnetMapping", om.valueToTree(this.getSubnetMapping()));
            }
            if (this.getSubnets() != null) {
                data.set("subnets", om.valueToTree(this.getSubnets()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
            }
            if (this.getTimeouts() != null) {
                data.set("timeouts", om.valueToTree(this.getTimeouts()));
            }
            if (this.getXffHeaderProcessingMode() != null) {
                data.set("xffHeaderProcessingMode", om.valueToTree(this.getXffHeaderProcessingMode()));
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
            struct.set("fqn", om.valueToTree("aws.lb.LbConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LbConfig.Jsii$Proxy that = (LbConfig.Jsii$Proxy) o;

            if (this.accessLogs != null ? !this.accessLogs.equals(that.accessLogs) : that.accessLogs != null) return false;
            if (this.clientKeepAlive != null ? !this.clientKeepAlive.equals(that.clientKeepAlive) : that.clientKeepAlive != null) return false;
            if (this.connectionLogs != null ? !this.connectionLogs.equals(that.connectionLogs) : that.connectionLogs != null) return false;
            if (this.customerOwnedIpv4Pool != null ? !this.customerOwnedIpv4Pool.equals(that.customerOwnedIpv4Pool) : that.customerOwnedIpv4Pool != null) return false;
            if (this.desyncMitigationMode != null ? !this.desyncMitigationMode.equals(that.desyncMitigationMode) : that.desyncMitigationMode != null) return false;
            if (this.dnsRecordClientRoutingPolicy != null ? !this.dnsRecordClientRoutingPolicy.equals(that.dnsRecordClientRoutingPolicy) : that.dnsRecordClientRoutingPolicy != null) return false;
            if (this.dropInvalidHeaderFields != null ? !this.dropInvalidHeaderFields.equals(that.dropInvalidHeaderFields) : that.dropInvalidHeaderFields != null) return false;
            if (this.enableCrossZoneLoadBalancing != null ? !this.enableCrossZoneLoadBalancing.equals(that.enableCrossZoneLoadBalancing) : that.enableCrossZoneLoadBalancing != null) return false;
            if (this.enableDeletionProtection != null ? !this.enableDeletionProtection.equals(that.enableDeletionProtection) : that.enableDeletionProtection != null) return false;
            if (this.enableHttp2 != null ? !this.enableHttp2.equals(that.enableHttp2) : that.enableHttp2 != null) return false;
            if (this.enableTlsVersionAndCipherSuiteHeaders != null ? !this.enableTlsVersionAndCipherSuiteHeaders.equals(that.enableTlsVersionAndCipherSuiteHeaders) : that.enableTlsVersionAndCipherSuiteHeaders != null) return false;
            if (this.enableWafFailOpen != null ? !this.enableWafFailOpen.equals(that.enableWafFailOpen) : that.enableWafFailOpen != null) return false;
            if (this.enableXffClientPort != null ? !this.enableXffClientPort.equals(that.enableXffClientPort) : that.enableXffClientPort != null) return false;
            if (this.enableZonalShift != null ? !this.enableZonalShift.equals(that.enableZonalShift) : that.enableZonalShift != null) return false;
            if (this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic != null ? !this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic.equals(that.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic) : that.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.idleTimeout != null ? !this.idleTimeout.equals(that.idleTimeout) : that.idleTimeout != null) return false;
            if (this.internal != null ? !this.internal.equals(that.internal) : that.internal != null) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            if (this.ipamPools != null ? !this.ipamPools.equals(that.ipamPools) : that.ipamPools != null) return false;
            if (this.loadBalancerType != null ? !this.loadBalancerType.equals(that.loadBalancerType) : that.loadBalancerType != null) return false;
            if (this.minimumLoadBalancerCapacity != null ? !this.minimumLoadBalancerCapacity.equals(that.minimumLoadBalancerCapacity) : that.minimumLoadBalancerCapacity != null) return false;
            if (this.name != null ? !this.name.equals(that.name) : that.name != null) return false;
            if (this.namePrefix != null ? !this.namePrefix.equals(that.namePrefix) : that.namePrefix != null) return false;
            if (this.preserveHostHeader != null ? !this.preserveHostHeader.equals(that.preserveHostHeader) : that.preserveHostHeader != null) return false;
            if (this.securityGroups != null ? !this.securityGroups.equals(that.securityGroups) : that.securityGroups != null) return false;
            if (this.subnetMapping != null ? !this.subnetMapping.equals(that.subnetMapping) : that.subnetMapping != null) return false;
            if (this.subnets != null ? !this.subnets.equals(that.subnets) : that.subnets != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.xffHeaderProcessingMode != null ? !this.xffHeaderProcessingMode.equals(that.xffHeaderProcessingMode) : that.xffHeaderProcessingMode != null) return false;
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
            int result = this.accessLogs != null ? this.accessLogs.hashCode() : 0;
            result = 31 * result + (this.clientKeepAlive != null ? this.clientKeepAlive.hashCode() : 0);
            result = 31 * result + (this.connectionLogs != null ? this.connectionLogs.hashCode() : 0);
            result = 31 * result + (this.customerOwnedIpv4Pool != null ? this.customerOwnedIpv4Pool.hashCode() : 0);
            result = 31 * result + (this.desyncMitigationMode != null ? this.desyncMitigationMode.hashCode() : 0);
            result = 31 * result + (this.dnsRecordClientRoutingPolicy != null ? this.dnsRecordClientRoutingPolicy.hashCode() : 0);
            result = 31 * result + (this.dropInvalidHeaderFields != null ? this.dropInvalidHeaderFields.hashCode() : 0);
            result = 31 * result + (this.enableCrossZoneLoadBalancing != null ? this.enableCrossZoneLoadBalancing.hashCode() : 0);
            result = 31 * result + (this.enableDeletionProtection != null ? this.enableDeletionProtection.hashCode() : 0);
            result = 31 * result + (this.enableHttp2 != null ? this.enableHttp2.hashCode() : 0);
            result = 31 * result + (this.enableTlsVersionAndCipherSuiteHeaders != null ? this.enableTlsVersionAndCipherSuiteHeaders.hashCode() : 0);
            result = 31 * result + (this.enableWafFailOpen != null ? this.enableWafFailOpen.hashCode() : 0);
            result = 31 * result + (this.enableXffClientPort != null ? this.enableXffClientPort.hashCode() : 0);
            result = 31 * result + (this.enableZonalShift != null ? this.enableZonalShift.hashCode() : 0);
            result = 31 * result + (this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic != null ? this.enforceSecurityGroupInboundRulesOnPrivateLinkTraffic.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.idleTimeout != null ? this.idleTimeout.hashCode() : 0);
            result = 31 * result + (this.internal != null ? this.internal.hashCode() : 0);
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.ipamPools != null ? this.ipamPools.hashCode() : 0);
            result = 31 * result + (this.loadBalancerType != null ? this.loadBalancerType.hashCode() : 0);
            result = 31 * result + (this.minimumLoadBalancerCapacity != null ? this.minimumLoadBalancerCapacity.hashCode() : 0);
            result = 31 * result + (this.name != null ? this.name.hashCode() : 0);
            result = 31 * result + (this.namePrefix != null ? this.namePrefix.hashCode() : 0);
            result = 31 * result + (this.preserveHostHeader != null ? this.preserveHostHeader.hashCode() : 0);
            result = 31 * result + (this.securityGroups != null ? this.securityGroups.hashCode() : 0);
            result = 31 * result + (this.subnetMapping != null ? this.subnetMapping.hashCode() : 0);
            result = 31 * result + (this.subnets != null ? this.subnets.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.xffHeaderProcessingMode != null ? this.xffHeaderProcessingMode.hashCode() : 0);
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
