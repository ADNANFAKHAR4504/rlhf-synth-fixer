package imports.aws.ec2_transit_gateway;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.104Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGateway.Ec2TransitGatewayConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2TransitGatewayConfig.Jsii$Proxy.class)
public interface Ec2TransitGatewayConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#amazon_side_asn Ec2TransitGateway#amazon_side_asn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAmazonSideAsn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#auto_accept_shared_attachments Ec2TransitGateway#auto_accept_shared_attachments}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAutoAcceptSharedAttachments() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_association Ec2TransitGateway#default_route_table_association}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultRouteTableAssociation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_propagation Ec2TransitGateway#default_route_table_propagation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDefaultRouteTablePropagation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#description Ec2TransitGateway#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#dns_support Ec2TransitGateway#dns_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDnsSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#id Ec2TransitGateway#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#multicast_support Ec2TransitGateway#multicast_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMulticastSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#security_group_referencing_support Ec2TransitGateway#security_group_referencing_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityGroupReferencingSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags Ec2TransitGateway#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags_all Ec2TransitGateway#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#timeouts Ec2TransitGateway#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#transit_gateway_cidr_blocks Ec2TransitGateway#transit_gateway_cidr_blocks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getTransitGatewayCidrBlocks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#vpn_ecmp_support Ec2TransitGateway#vpn_ecmp_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpnEcmpSupport() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2TransitGatewayConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2TransitGatewayConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2TransitGatewayConfig> {
        java.lang.Number amazonSideAsn;
        java.lang.String autoAcceptSharedAttachments;
        java.lang.String defaultRouteTableAssociation;
        java.lang.String defaultRouteTablePropagation;
        java.lang.String description;
        java.lang.String dnsSupport;
        java.lang.String id;
        java.lang.String multicastSupport;
        java.lang.String securityGroupReferencingSupport;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts timeouts;
        java.util.List<java.lang.String> transitGatewayCidrBlocks;
        java.lang.String vpnEcmpSupport;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getAmazonSideAsn}
         * @param amazonSideAsn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#amazon_side_asn Ec2TransitGateway#amazon_side_asn}.
         * @return {@code this}
         */
        public Builder amazonSideAsn(java.lang.Number amazonSideAsn) {
            this.amazonSideAsn = amazonSideAsn;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getAutoAcceptSharedAttachments}
         * @param autoAcceptSharedAttachments Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#auto_accept_shared_attachments Ec2TransitGateway#auto_accept_shared_attachments}.
         * @return {@code this}
         */
        public Builder autoAcceptSharedAttachments(java.lang.String autoAcceptSharedAttachments) {
            this.autoAcceptSharedAttachments = autoAcceptSharedAttachments;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getDefaultRouteTableAssociation}
         * @param defaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_association Ec2TransitGateway#default_route_table_association}.
         * @return {@code this}
         */
        public Builder defaultRouteTableAssociation(java.lang.String defaultRouteTableAssociation) {
            this.defaultRouteTableAssociation = defaultRouteTableAssociation;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getDefaultRouteTablePropagation}
         * @param defaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#default_route_table_propagation Ec2TransitGateway#default_route_table_propagation}.
         * @return {@code this}
         */
        public Builder defaultRouteTablePropagation(java.lang.String defaultRouteTablePropagation) {
            this.defaultRouteTablePropagation = defaultRouteTablePropagation;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#description Ec2TransitGateway#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getDnsSupport}
         * @param dnsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#dns_support Ec2TransitGateway#dns_support}.
         * @return {@code this}
         */
        public Builder dnsSupport(java.lang.String dnsSupport) {
            this.dnsSupport = dnsSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#id Ec2TransitGateway#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getMulticastSupport}
         * @param multicastSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#multicast_support Ec2TransitGateway#multicast_support}.
         * @return {@code this}
         */
        public Builder multicastSupport(java.lang.String multicastSupport) {
            this.multicastSupport = multicastSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getSecurityGroupReferencingSupport}
         * @param securityGroupReferencingSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#security_group_referencing_support Ec2TransitGateway#security_group_referencing_support}.
         * @return {@code this}
         */
        public Builder securityGroupReferencingSupport(java.lang.String securityGroupReferencingSupport) {
            this.securityGroupReferencingSupport = securityGroupReferencingSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags Ec2TransitGateway#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#tags_all Ec2TransitGateway#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#timeouts Ec2TransitGateway#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getTransitGatewayCidrBlocks}
         * @param transitGatewayCidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#transit_gateway_cidr_blocks Ec2TransitGateway#transit_gateway_cidr_blocks}.
         * @return {@code this}
         */
        public Builder transitGatewayCidrBlocks(java.util.List<java.lang.String> transitGatewayCidrBlocks) {
            this.transitGatewayCidrBlocks = transitGatewayCidrBlocks;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getVpnEcmpSupport}
         * @param vpnEcmpSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway#vpn_ecmp_support Ec2TransitGateway#vpn_ecmp_support}.
         * @return {@code this}
         */
        public Builder vpnEcmpSupport(java.lang.String vpnEcmpSupport) {
            this.vpnEcmpSupport = vpnEcmpSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getDependsOn}
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
         * Sets the value of {@link Ec2TransitGatewayConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2TransitGatewayConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2TransitGatewayConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2TransitGatewayConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2TransitGatewayConfig {
        private final java.lang.Number amazonSideAsn;
        private final java.lang.String autoAcceptSharedAttachments;
        private final java.lang.String defaultRouteTableAssociation;
        private final java.lang.String defaultRouteTablePropagation;
        private final java.lang.String description;
        private final java.lang.String dnsSupport;
        private final java.lang.String id;
        private final java.lang.String multicastSupport;
        private final java.lang.String securityGroupReferencingSupport;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts timeouts;
        private final java.util.List<java.lang.String> transitGatewayCidrBlocks;
        private final java.lang.String vpnEcmpSupport;
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
            this.amazonSideAsn = software.amazon.jsii.Kernel.get(this, "amazonSideAsn", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.autoAcceptSharedAttachments = software.amazon.jsii.Kernel.get(this, "autoAcceptSharedAttachments", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultRouteTableAssociation = software.amazon.jsii.Kernel.get(this, "defaultRouteTableAssociation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.defaultRouteTablePropagation = software.amazon.jsii.Kernel.get(this, "defaultRouteTablePropagation", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dnsSupport = software.amazon.jsii.Kernel.get(this, "dnsSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multicastSupport = software.amazon.jsii.Kernel.get(this, "multicastSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupReferencingSupport = software.amazon.jsii.Kernel.get(this, "securityGroupReferencingSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts.class));
            this.transitGatewayCidrBlocks = software.amazon.jsii.Kernel.get(this, "transitGatewayCidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.vpnEcmpSupport = software.amazon.jsii.Kernel.get(this, "vpnEcmpSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.amazonSideAsn = builder.amazonSideAsn;
            this.autoAcceptSharedAttachments = builder.autoAcceptSharedAttachments;
            this.defaultRouteTableAssociation = builder.defaultRouteTableAssociation;
            this.defaultRouteTablePropagation = builder.defaultRouteTablePropagation;
            this.description = builder.description;
            this.dnsSupport = builder.dnsSupport;
            this.id = builder.id;
            this.multicastSupport = builder.multicastSupport;
            this.securityGroupReferencingSupport = builder.securityGroupReferencingSupport;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.transitGatewayCidrBlocks = builder.transitGatewayCidrBlocks;
            this.vpnEcmpSupport = builder.vpnEcmpSupport;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Number getAmazonSideAsn() {
            return this.amazonSideAsn;
        }

        @Override
        public final java.lang.String getAutoAcceptSharedAttachments() {
            return this.autoAcceptSharedAttachments;
        }

        @Override
        public final java.lang.String getDefaultRouteTableAssociation() {
            return this.defaultRouteTableAssociation;
        }

        @Override
        public final java.lang.String getDefaultRouteTablePropagation() {
            return this.defaultRouteTablePropagation;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getDnsSupport() {
            return this.dnsSupport;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getMulticastSupport() {
            return this.multicastSupport;
        }

        @Override
        public final java.lang.String getSecurityGroupReferencingSupport() {
            return this.securityGroupReferencingSupport;
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
        public final imports.aws.ec2_transit_gateway.Ec2TransitGatewayTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.util.List<java.lang.String> getTransitGatewayCidrBlocks() {
            return this.transitGatewayCidrBlocks;
        }

        @Override
        public final java.lang.String getVpnEcmpSupport() {
            return this.vpnEcmpSupport;
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

            if (this.getAmazonSideAsn() != null) {
                data.set("amazonSideAsn", om.valueToTree(this.getAmazonSideAsn()));
            }
            if (this.getAutoAcceptSharedAttachments() != null) {
                data.set("autoAcceptSharedAttachments", om.valueToTree(this.getAutoAcceptSharedAttachments()));
            }
            if (this.getDefaultRouteTableAssociation() != null) {
                data.set("defaultRouteTableAssociation", om.valueToTree(this.getDefaultRouteTableAssociation()));
            }
            if (this.getDefaultRouteTablePropagation() != null) {
                data.set("defaultRouteTablePropagation", om.valueToTree(this.getDefaultRouteTablePropagation()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getDnsSupport() != null) {
                data.set("dnsSupport", om.valueToTree(this.getDnsSupport()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getMulticastSupport() != null) {
                data.set("multicastSupport", om.valueToTree(this.getMulticastSupport()));
            }
            if (this.getSecurityGroupReferencingSupport() != null) {
                data.set("securityGroupReferencingSupport", om.valueToTree(this.getSecurityGroupReferencingSupport()));
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
            if (this.getTransitGatewayCidrBlocks() != null) {
                data.set("transitGatewayCidrBlocks", om.valueToTree(this.getTransitGatewayCidrBlocks()));
            }
            if (this.getVpnEcmpSupport() != null) {
                data.set("vpnEcmpSupport", om.valueToTree(this.getVpnEcmpSupport()));
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
            struct.set("fqn", om.valueToTree("aws.ec2TransitGateway.Ec2TransitGatewayConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2TransitGatewayConfig.Jsii$Proxy that = (Ec2TransitGatewayConfig.Jsii$Proxy) o;

            if (this.amazonSideAsn != null ? !this.amazonSideAsn.equals(that.amazonSideAsn) : that.amazonSideAsn != null) return false;
            if (this.autoAcceptSharedAttachments != null ? !this.autoAcceptSharedAttachments.equals(that.autoAcceptSharedAttachments) : that.autoAcceptSharedAttachments != null) return false;
            if (this.defaultRouteTableAssociation != null ? !this.defaultRouteTableAssociation.equals(that.defaultRouteTableAssociation) : that.defaultRouteTableAssociation != null) return false;
            if (this.defaultRouteTablePropagation != null ? !this.defaultRouteTablePropagation.equals(that.defaultRouteTablePropagation) : that.defaultRouteTablePropagation != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.dnsSupport != null ? !this.dnsSupport.equals(that.dnsSupport) : that.dnsSupport != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.multicastSupport != null ? !this.multicastSupport.equals(that.multicastSupport) : that.multicastSupport != null) return false;
            if (this.securityGroupReferencingSupport != null ? !this.securityGroupReferencingSupport.equals(that.securityGroupReferencingSupport) : that.securityGroupReferencingSupport != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.transitGatewayCidrBlocks != null ? !this.transitGatewayCidrBlocks.equals(that.transitGatewayCidrBlocks) : that.transitGatewayCidrBlocks != null) return false;
            if (this.vpnEcmpSupport != null ? !this.vpnEcmpSupport.equals(that.vpnEcmpSupport) : that.vpnEcmpSupport != null) return false;
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
            int result = this.amazonSideAsn != null ? this.amazonSideAsn.hashCode() : 0;
            result = 31 * result + (this.autoAcceptSharedAttachments != null ? this.autoAcceptSharedAttachments.hashCode() : 0);
            result = 31 * result + (this.defaultRouteTableAssociation != null ? this.defaultRouteTableAssociation.hashCode() : 0);
            result = 31 * result + (this.defaultRouteTablePropagation != null ? this.defaultRouteTablePropagation.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.dnsSupport != null ? this.dnsSupport.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.multicastSupport != null ? this.multicastSupport.hashCode() : 0);
            result = 31 * result + (this.securityGroupReferencingSupport != null ? this.securityGroupReferencingSupport.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.transitGatewayCidrBlocks != null ? this.transitGatewayCidrBlocks.hashCode() : 0);
            result = 31 * result + (this.vpnEcmpSupport != null ? this.vpnEcmpSupport.hashCode() : 0);
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
