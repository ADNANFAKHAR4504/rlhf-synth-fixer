package imports.aws.ec2_transit_gateway_vpc_attachment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.114Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.ec2TransitGatewayVpcAttachment.Ec2TransitGatewayVpcAttachmentConfig")
@software.amazon.jsii.Jsii.Proxy(Ec2TransitGatewayVpcAttachmentConfig.Jsii$Proxy.class)
public interface Ec2TransitGatewayVpcAttachmentConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#subnet_ids Ec2TransitGatewayVpcAttachment#subnet_ids}.
     */
    @org.jetbrains.annotations.NotNull java.util.List<java.lang.String> getSubnetIds();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_id Ec2TransitGatewayVpcAttachment#transit_gateway_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getTransitGatewayId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#vpc_id Ec2TransitGatewayVpcAttachment#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#appliance_mode_support Ec2TransitGatewayVpcAttachment#appliance_mode_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getApplianceModeSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#dns_support Ec2TransitGatewayVpcAttachment#dns_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDnsSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#id Ec2TransitGatewayVpcAttachment#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#ipv6_support Ec2TransitGatewayVpcAttachment#ipv6_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6Support() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#security_group_referencing_support Ec2TransitGatewayVpcAttachment#security_group_referencing_support}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSecurityGroupReferencingSupport() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#tags Ec2TransitGatewayVpcAttachment#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#tags_all Ec2TransitGatewayVpcAttachment#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_default_route_table_association Ec2TransitGatewayVpcAttachment#transit_gateway_default_route_table_association}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransitGatewayDefaultRouteTableAssociation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_default_route_table_propagation Ec2TransitGatewayVpcAttachment#transit_gateway_default_route_table_propagation}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getTransitGatewayDefaultRouteTablePropagation() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Ec2TransitGatewayVpcAttachmentConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Ec2TransitGatewayVpcAttachmentConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Ec2TransitGatewayVpcAttachmentConfig> {
        java.util.List<java.lang.String> subnetIds;
        java.lang.String transitGatewayId;
        java.lang.String vpcId;
        java.lang.String applianceModeSupport;
        java.lang.String dnsSupport;
        java.lang.String id;
        java.lang.String ipv6Support;
        java.lang.String securityGroupReferencingSupport;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object transitGatewayDefaultRouteTableAssociation;
        java.lang.Object transitGatewayDefaultRouteTablePropagation;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#subnet_ids Ec2TransitGatewayVpcAttachment#subnet_ids}. This parameter is required.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getTransitGatewayId}
         * @param transitGatewayId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_id Ec2TransitGatewayVpcAttachment#transit_gateway_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder transitGatewayId(java.lang.String transitGatewayId) {
            this.transitGatewayId = transitGatewayId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#vpc_id Ec2TransitGatewayVpcAttachment#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getApplianceModeSupport}
         * @param applianceModeSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#appliance_mode_support Ec2TransitGatewayVpcAttachment#appliance_mode_support}.
         * @return {@code this}
         */
        public Builder applianceModeSupport(java.lang.String applianceModeSupport) {
            this.applianceModeSupport = applianceModeSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getDnsSupport}
         * @param dnsSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#dns_support Ec2TransitGatewayVpcAttachment#dns_support}.
         * @return {@code this}
         */
        public Builder dnsSupport(java.lang.String dnsSupport) {
            this.dnsSupport = dnsSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#id Ec2TransitGatewayVpcAttachment#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getIpv6Support}
         * @param ipv6Support Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#ipv6_support Ec2TransitGatewayVpcAttachment#ipv6_support}.
         * @return {@code this}
         */
        public Builder ipv6Support(java.lang.String ipv6Support) {
            this.ipv6Support = ipv6Support;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getSecurityGroupReferencingSupport}
         * @param securityGroupReferencingSupport Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#security_group_referencing_support Ec2TransitGatewayVpcAttachment#security_group_referencing_support}.
         * @return {@code this}
         */
        public Builder securityGroupReferencingSupport(java.lang.String securityGroupReferencingSupport) {
            this.securityGroupReferencingSupport = securityGroupReferencingSupport;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#tags Ec2TransitGatewayVpcAttachment#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#tags_all Ec2TransitGatewayVpcAttachment#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getTransitGatewayDefaultRouteTableAssociation}
         * @param transitGatewayDefaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_default_route_table_association Ec2TransitGatewayVpcAttachment#transit_gateway_default_route_table_association}.
         * @return {@code this}
         */
        public Builder transitGatewayDefaultRouteTableAssociation(java.lang.Boolean transitGatewayDefaultRouteTableAssociation) {
            this.transitGatewayDefaultRouteTableAssociation = transitGatewayDefaultRouteTableAssociation;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getTransitGatewayDefaultRouteTableAssociation}
         * @param transitGatewayDefaultRouteTableAssociation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_default_route_table_association Ec2TransitGatewayVpcAttachment#transit_gateway_default_route_table_association}.
         * @return {@code this}
         */
        public Builder transitGatewayDefaultRouteTableAssociation(com.hashicorp.cdktf.IResolvable transitGatewayDefaultRouteTableAssociation) {
            this.transitGatewayDefaultRouteTableAssociation = transitGatewayDefaultRouteTableAssociation;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getTransitGatewayDefaultRouteTablePropagation}
         * @param transitGatewayDefaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_default_route_table_propagation Ec2TransitGatewayVpcAttachment#transit_gateway_default_route_table_propagation}.
         * @return {@code this}
         */
        public Builder transitGatewayDefaultRouteTablePropagation(java.lang.Boolean transitGatewayDefaultRouteTablePropagation) {
            this.transitGatewayDefaultRouteTablePropagation = transitGatewayDefaultRouteTablePropagation;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getTransitGatewayDefaultRouteTablePropagation}
         * @param transitGatewayDefaultRouteTablePropagation Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/ec2_transit_gateway_vpc_attachment#transit_gateway_default_route_table_propagation Ec2TransitGatewayVpcAttachment#transit_gateway_default_route_table_propagation}.
         * @return {@code this}
         */
        public Builder transitGatewayDefaultRouteTablePropagation(com.hashicorp.cdktf.IResolvable transitGatewayDefaultRouteTablePropagation) {
            this.transitGatewayDefaultRouteTablePropagation = transitGatewayDefaultRouteTablePropagation;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getDependsOn}
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
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link Ec2TransitGatewayVpcAttachmentConfig#getProvisioners}
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
         * @return a new instance of {@link Ec2TransitGatewayVpcAttachmentConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Ec2TransitGatewayVpcAttachmentConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Ec2TransitGatewayVpcAttachmentConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Ec2TransitGatewayVpcAttachmentConfig {
        private final java.util.List<java.lang.String> subnetIds;
        private final java.lang.String transitGatewayId;
        private final java.lang.String vpcId;
        private final java.lang.String applianceModeSupport;
        private final java.lang.String dnsSupport;
        private final java.lang.String id;
        private final java.lang.String ipv6Support;
        private final java.lang.String securityGroupReferencingSupport;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final java.lang.Object transitGatewayDefaultRouteTableAssociation;
        private final java.lang.Object transitGatewayDefaultRouteTablePropagation;
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
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.transitGatewayId = software.amazon.jsii.Kernel.get(this, "transitGatewayId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.applianceModeSupport = software.amazon.jsii.Kernel.get(this, "applianceModeSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.dnsSupport = software.amazon.jsii.Kernel.get(this, "dnsSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6Support = software.amazon.jsii.Kernel.get(this, "ipv6Support", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupReferencingSupport = software.amazon.jsii.Kernel.get(this, "securityGroupReferencingSupport", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.transitGatewayDefaultRouteTableAssociation = software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTableAssociation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.transitGatewayDefaultRouteTablePropagation = software.amazon.jsii.Kernel.get(this, "transitGatewayDefaultRouteTablePropagation", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.subnetIds = java.util.Objects.requireNonNull(builder.subnetIds, "subnetIds is required");
            this.transitGatewayId = java.util.Objects.requireNonNull(builder.transitGatewayId, "transitGatewayId is required");
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
            this.applianceModeSupport = builder.applianceModeSupport;
            this.dnsSupport = builder.dnsSupport;
            this.id = builder.id;
            this.ipv6Support = builder.ipv6Support;
            this.securityGroupReferencingSupport = builder.securityGroupReferencingSupport;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.transitGatewayDefaultRouteTableAssociation = builder.transitGatewayDefaultRouteTableAssociation;
            this.transitGatewayDefaultRouteTablePropagation = builder.transitGatewayDefaultRouteTablePropagation;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
        }

        @Override
        public final java.lang.String getTransitGatewayId() {
            return this.transitGatewayId;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.String getApplianceModeSupport() {
            return this.applianceModeSupport;
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
        public final java.lang.String getIpv6Support() {
            return this.ipv6Support;
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
        public final java.lang.Object getTransitGatewayDefaultRouteTableAssociation() {
            return this.transitGatewayDefaultRouteTableAssociation;
        }

        @Override
        public final java.lang.Object getTransitGatewayDefaultRouteTablePropagation() {
            return this.transitGatewayDefaultRouteTablePropagation;
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

            data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
            data.set("transitGatewayId", om.valueToTree(this.getTransitGatewayId()));
            data.set("vpcId", om.valueToTree(this.getVpcId()));
            if (this.getApplianceModeSupport() != null) {
                data.set("applianceModeSupport", om.valueToTree(this.getApplianceModeSupport()));
            }
            if (this.getDnsSupport() != null) {
                data.set("dnsSupport", om.valueToTree(this.getDnsSupport()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpv6Support() != null) {
                data.set("ipv6Support", om.valueToTree(this.getIpv6Support()));
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
            if (this.getTransitGatewayDefaultRouteTableAssociation() != null) {
                data.set("transitGatewayDefaultRouteTableAssociation", om.valueToTree(this.getTransitGatewayDefaultRouteTableAssociation()));
            }
            if (this.getTransitGatewayDefaultRouteTablePropagation() != null) {
                data.set("transitGatewayDefaultRouteTablePropagation", om.valueToTree(this.getTransitGatewayDefaultRouteTablePropagation()));
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
            struct.set("fqn", om.valueToTree("aws.ec2TransitGatewayVpcAttachment.Ec2TransitGatewayVpcAttachmentConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Ec2TransitGatewayVpcAttachmentConfig.Jsii$Proxy that = (Ec2TransitGatewayVpcAttachmentConfig.Jsii$Proxy) o;

            if (!subnetIds.equals(that.subnetIds)) return false;
            if (!transitGatewayId.equals(that.transitGatewayId)) return false;
            if (!vpcId.equals(that.vpcId)) return false;
            if (this.applianceModeSupport != null ? !this.applianceModeSupport.equals(that.applianceModeSupport) : that.applianceModeSupport != null) return false;
            if (this.dnsSupport != null ? !this.dnsSupport.equals(that.dnsSupport) : that.dnsSupport != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipv6Support != null ? !this.ipv6Support.equals(that.ipv6Support) : that.ipv6Support != null) return false;
            if (this.securityGroupReferencingSupport != null ? !this.securityGroupReferencingSupport.equals(that.securityGroupReferencingSupport) : that.securityGroupReferencingSupport != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.transitGatewayDefaultRouteTableAssociation != null ? !this.transitGatewayDefaultRouteTableAssociation.equals(that.transitGatewayDefaultRouteTableAssociation) : that.transitGatewayDefaultRouteTableAssociation != null) return false;
            if (this.transitGatewayDefaultRouteTablePropagation != null ? !this.transitGatewayDefaultRouteTablePropagation.equals(that.transitGatewayDefaultRouteTablePropagation) : that.transitGatewayDefaultRouteTablePropagation != null) return false;
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
            int result = this.subnetIds.hashCode();
            result = 31 * result + (this.transitGatewayId.hashCode());
            result = 31 * result + (this.vpcId.hashCode());
            result = 31 * result + (this.applianceModeSupport != null ? this.applianceModeSupport.hashCode() : 0);
            result = 31 * result + (this.dnsSupport != null ? this.dnsSupport.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipv6Support != null ? this.ipv6Support.hashCode() : 0);
            result = 31 * result + (this.securityGroupReferencingSupport != null ? this.securityGroupReferencingSupport.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.transitGatewayDefaultRouteTableAssociation != null ? this.transitGatewayDefaultRouteTableAssociation.hashCode() : 0);
            result = 31 * result + (this.transitGatewayDefaultRouteTablePropagation != null ? this.transitGatewayDefaultRouteTablePropagation.hashCode() : 0);
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
