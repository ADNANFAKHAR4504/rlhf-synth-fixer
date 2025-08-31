package imports.aws.vpc_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.591Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcEndpoint.VpcEndpointConfig")
@software.amazon.jsii.Jsii.Proxy(VpcEndpointConfig.Jsii$Proxy.class)
public interface VpcEndpointConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#vpc_id VpcEndpoint#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#auto_accept VpcEndpoint#auto_accept}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAutoAccept() {
        return null;
    }

    /**
     * dns_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#dns_options VpcEndpoint#dns_options}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_endpoint.VpcEndpointDnsOptions getDnsOptions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#id VpcEndpoint#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#ip_address_type VpcEndpoint#ip_address_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpAddressType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#policy VpcEndpoint#policy}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPolicy() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#private_dns_enabled VpcEndpoint#private_dns_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPrivateDnsEnabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#resource_configuration_arn VpcEndpoint#resource_configuration_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getResourceConfigurationArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#route_table_ids VpcEndpoint#route_table_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getRouteTableIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#security_group_ids VpcEndpoint#security_group_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSecurityGroupIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#service_name VpcEndpoint#service_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#service_network_arn VpcEndpoint#service_network_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceNetworkArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#service_region VpcEndpoint#service_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceRegion() {
        return null;
    }

    /**
     * subnet_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#subnet_configuration VpcEndpoint#subnet_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSubnetConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#subnet_ids VpcEndpoint#subnet_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSubnetIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#tags VpcEndpoint#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#tags_all VpcEndpoint#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#timeouts VpcEndpoint#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_endpoint.VpcEndpointTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#vpc_endpoint_type VpcEndpoint#vpc_endpoint_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getVpcEndpointType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcEndpointConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcEndpointConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcEndpointConfig> {
        java.lang.String vpcId;
        java.lang.Object autoAccept;
        imports.aws.vpc_endpoint.VpcEndpointDnsOptions dnsOptions;
        java.lang.String id;
        java.lang.String ipAddressType;
        java.lang.String policy;
        java.lang.Object privateDnsEnabled;
        java.lang.String resourceConfigurationArn;
        java.util.List<java.lang.String> routeTableIds;
        java.util.List<java.lang.String> securityGroupIds;
        java.lang.String serviceName;
        java.lang.String serviceNetworkArn;
        java.lang.String serviceRegion;
        java.lang.Object subnetConfiguration;
        java.util.List<java.lang.String> subnetIds;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.vpc_endpoint.VpcEndpointTimeouts timeouts;
        java.lang.String vpcEndpointType;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcEndpointConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#vpc_id VpcEndpoint#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getAutoAccept}
         * @param autoAccept Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#auto_accept VpcEndpoint#auto_accept}.
         * @return {@code this}
         */
        public Builder autoAccept(java.lang.Boolean autoAccept) {
            this.autoAccept = autoAccept;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getAutoAccept}
         * @param autoAccept Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#auto_accept VpcEndpoint#auto_accept}.
         * @return {@code this}
         */
        public Builder autoAccept(com.hashicorp.cdktf.IResolvable autoAccept) {
            this.autoAccept = autoAccept;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getDnsOptions}
         * @param dnsOptions dns_options block.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#dns_options VpcEndpoint#dns_options}
         * @return {@code this}
         */
        public Builder dnsOptions(imports.aws.vpc_endpoint.VpcEndpointDnsOptions dnsOptions) {
            this.dnsOptions = dnsOptions;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#id VpcEndpoint#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getIpAddressType}
         * @param ipAddressType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#ip_address_type VpcEndpoint#ip_address_type}.
         * @return {@code this}
         */
        public Builder ipAddressType(java.lang.String ipAddressType) {
            this.ipAddressType = ipAddressType;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getPolicy}
         * @param policy Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#policy VpcEndpoint#policy}.
         * @return {@code this}
         */
        public Builder policy(java.lang.String policy) {
            this.policy = policy;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getPrivateDnsEnabled}
         * @param privateDnsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#private_dns_enabled VpcEndpoint#private_dns_enabled}.
         * @return {@code this}
         */
        public Builder privateDnsEnabled(java.lang.Boolean privateDnsEnabled) {
            this.privateDnsEnabled = privateDnsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getPrivateDnsEnabled}
         * @param privateDnsEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#private_dns_enabled VpcEndpoint#private_dns_enabled}.
         * @return {@code this}
         */
        public Builder privateDnsEnabled(com.hashicorp.cdktf.IResolvable privateDnsEnabled) {
            this.privateDnsEnabled = privateDnsEnabled;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getResourceConfigurationArn}
         * @param resourceConfigurationArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#resource_configuration_arn VpcEndpoint#resource_configuration_arn}.
         * @return {@code this}
         */
        public Builder resourceConfigurationArn(java.lang.String resourceConfigurationArn) {
            this.resourceConfigurationArn = resourceConfigurationArn;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getRouteTableIds}
         * @param routeTableIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#route_table_ids VpcEndpoint#route_table_ids}.
         * @return {@code this}
         */
        public Builder routeTableIds(java.util.List<java.lang.String> routeTableIds) {
            this.routeTableIds = routeTableIds;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getSecurityGroupIds}
         * @param securityGroupIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#security_group_ids VpcEndpoint#security_group_ids}.
         * @return {@code this}
         */
        public Builder securityGroupIds(java.util.List<java.lang.String> securityGroupIds) {
            this.securityGroupIds = securityGroupIds;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getServiceName}
         * @param serviceName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#service_name VpcEndpoint#service_name}.
         * @return {@code this}
         */
        public Builder serviceName(java.lang.String serviceName) {
            this.serviceName = serviceName;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getServiceNetworkArn}
         * @param serviceNetworkArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#service_network_arn VpcEndpoint#service_network_arn}.
         * @return {@code this}
         */
        public Builder serviceNetworkArn(java.lang.String serviceNetworkArn) {
            this.serviceNetworkArn = serviceNetworkArn;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getServiceRegion}
         * @param serviceRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#service_region VpcEndpoint#service_region}.
         * @return {@code this}
         */
        public Builder serviceRegion(java.lang.String serviceRegion) {
            this.serviceRegion = serviceRegion;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getSubnetConfiguration}
         * @param subnetConfiguration subnet_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#subnet_configuration VpcEndpoint#subnet_configuration}
         * @return {@code this}
         */
        public Builder subnetConfiguration(com.hashicorp.cdktf.IResolvable subnetConfiguration) {
            this.subnetConfiguration = subnetConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getSubnetConfiguration}
         * @param subnetConfiguration subnet_configuration block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#subnet_configuration VpcEndpoint#subnet_configuration}
         * @return {@code this}
         */
        public Builder subnetConfiguration(java.util.List<? extends imports.aws.vpc_endpoint.VpcEndpointSubnetConfiguration> subnetConfiguration) {
            this.subnetConfiguration = subnetConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getSubnetIds}
         * @param subnetIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#subnet_ids VpcEndpoint#subnet_ids}.
         * @return {@code this}
         */
        public Builder subnetIds(java.util.List<java.lang.String> subnetIds) {
            this.subnetIds = subnetIds;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#tags VpcEndpoint#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#tags_all VpcEndpoint#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#timeouts VpcEndpoint#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.vpc_endpoint.VpcEndpointTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getVpcEndpointType}
         * @param vpcEndpointType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint#vpc_endpoint_type VpcEndpoint#vpc_endpoint_type}.
         * @return {@code this}
         */
        public Builder vpcEndpointType(java.lang.String vpcEndpointType) {
            this.vpcEndpointType = vpcEndpointType;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getDependsOn}
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
         * Sets the value of {@link VpcEndpointConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointConfig#getProvisioners}
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
         * @return a new instance of {@link VpcEndpointConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcEndpointConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcEndpointConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcEndpointConfig {
        private final java.lang.String vpcId;
        private final java.lang.Object autoAccept;
        private final imports.aws.vpc_endpoint.VpcEndpointDnsOptions dnsOptions;
        private final java.lang.String id;
        private final java.lang.String ipAddressType;
        private final java.lang.String policy;
        private final java.lang.Object privateDnsEnabled;
        private final java.lang.String resourceConfigurationArn;
        private final java.util.List<java.lang.String> routeTableIds;
        private final java.util.List<java.lang.String> securityGroupIds;
        private final java.lang.String serviceName;
        private final java.lang.String serviceNetworkArn;
        private final java.lang.String serviceRegion;
        private final java.lang.Object subnetConfiguration;
        private final java.util.List<java.lang.String> subnetIds;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.vpc_endpoint.VpcEndpointTimeouts timeouts;
        private final java.lang.String vpcEndpointType;
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
            this.vpcId = software.amazon.jsii.Kernel.get(this, "vpcId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.autoAccept = software.amazon.jsii.Kernel.get(this, "autoAccept", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.dnsOptions = software.amazon.jsii.Kernel.get(this, "dnsOptions", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_endpoint.VpcEndpointDnsOptions.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipAddressType = software.amazon.jsii.Kernel.get(this, "ipAddressType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.policy = software.amazon.jsii.Kernel.get(this, "policy", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.privateDnsEnabled = software.amazon.jsii.Kernel.get(this, "privateDnsEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.resourceConfigurationArn = software.amazon.jsii.Kernel.get(this, "resourceConfigurationArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.routeTableIds = software.amazon.jsii.Kernel.get(this, "routeTableIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.securityGroupIds = software.amazon.jsii.Kernel.get(this, "securityGroupIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.serviceName = software.amazon.jsii.Kernel.get(this, "serviceName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceNetworkArn = software.amazon.jsii.Kernel.get(this, "serviceNetworkArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceRegion = software.amazon.jsii.Kernel.get(this, "serviceRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.subnetConfiguration = software.amazon.jsii.Kernel.get(this, "subnetConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.subnetIds = software.amazon.jsii.Kernel.get(this, "subnetIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_endpoint.VpcEndpointTimeouts.class));
            this.vpcEndpointType = software.amazon.jsii.Kernel.get(this, "vpcEndpointType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.vpcId = java.util.Objects.requireNonNull(builder.vpcId, "vpcId is required");
            this.autoAccept = builder.autoAccept;
            this.dnsOptions = builder.dnsOptions;
            this.id = builder.id;
            this.ipAddressType = builder.ipAddressType;
            this.policy = builder.policy;
            this.privateDnsEnabled = builder.privateDnsEnabled;
            this.resourceConfigurationArn = builder.resourceConfigurationArn;
            this.routeTableIds = builder.routeTableIds;
            this.securityGroupIds = builder.securityGroupIds;
            this.serviceName = builder.serviceName;
            this.serviceNetworkArn = builder.serviceNetworkArn;
            this.serviceRegion = builder.serviceRegion;
            this.subnetConfiguration = builder.subnetConfiguration;
            this.subnetIds = builder.subnetIds;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpcEndpointType = builder.vpcEndpointType;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.Object getAutoAccept() {
            return this.autoAccept;
        }

        @Override
        public final imports.aws.vpc_endpoint.VpcEndpointDnsOptions getDnsOptions() {
            return this.dnsOptions;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpAddressType() {
            return this.ipAddressType;
        }

        @Override
        public final java.lang.String getPolicy() {
            return this.policy;
        }

        @Override
        public final java.lang.Object getPrivateDnsEnabled() {
            return this.privateDnsEnabled;
        }

        @Override
        public final java.lang.String getResourceConfigurationArn() {
            return this.resourceConfigurationArn;
        }

        @Override
        public final java.util.List<java.lang.String> getRouteTableIds() {
            return this.routeTableIds;
        }

        @Override
        public final java.util.List<java.lang.String> getSecurityGroupIds() {
            return this.securityGroupIds;
        }

        @Override
        public final java.lang.String getServiceName() {
            return this.serviceName;
        }

        @Override
        public final java.lang.String getServiceNetworkArn() {
            return this.serviceNetworkArn;
        }

        @Override
        public final java.lang.String getServiceRegion() {
            return this.serviceRegion;
        }

        @Override
        public final java.lang.Object getSubnetConfiguration() {
            return this.subnetConfiguration;
        }

        @Override
        public final java.util.List<java.lang.String> getSubnetIds() {
            return this.subnetIds;
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
        public final imports.aws.vpc_endpoint.VpcEndpointTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.String getVpcEndpointType() {
            return this.vpcEndpointType;
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

            data.set("vpcId", om.valueToTree(this.getVpcId()));
            if (this.getAutoAccept() != null) {
                data.set("autoAccept", om.valueToTree(this.getAutoAccept()));
            }
            if (this.getDnsOptions() != null) {
                data.set("dnsOptions", om.valueToTree(this.getDnsOptions()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpAddressType() != null) {
                data.set("ipAddressType", om.valueToTree(this.getIpAddressType()));
            }
            if (this.getPolicy() != null) {
                data.set("policy", om.valueToTree(this.getPolicy()));
            }
            if (this.getPrivateDnsEnabled() != null) {
                data.set("privateDnsEnabled", om.valueToTree(this.getPrivateDnsEnabled()));
            }
            if (this.getResourceConfigurationArn() != null) {
                data.set("resourceConfigurationArn", om.valueToTree(this.getResourceConfigurationArn()));
            }
            if (this.getRouteTableIds() != null) {
                data.set("routeTableIds", om.valueToTree(this.getRouteTableIds()));
            }
            if (this.getSecurityGroupIds() != null) {
                data.set("securityGroupIds", om.valueToTree(this.getSecurityGroupIds()));
            }
            if (this.getServiceName() != null) {
                data.set("serviceName", om.valueToTree(this.getServiceName()));
            }
            if (this.getServiceNetworkArn() != null) {
                data.set("serviceNetworkArn", om.valueToTree(this.getServiceNetworkArn()));
            }
            if (this.getServiceRegion() != null) {
                data.set("serviceRegion", om.valueToTree(this.getServiceRegion()));
            }
            if (this.getSubnetConfiguration() != null) {
                data.set("subnetConfiguration", om.valueToTree(this.getSubnetConfiguration()));
            }
            if (this.getSubnetIds() != null) {
                data.set("subnetIds", om.valueToTree(this.getSubnetIds()));
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
            if (this.getVpcEndpointType() != null) {
                data.set("vpcEndpointType", om.valueToTree(this.getVpcEndpointType()));
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
            struct.set("fqn", om.valueToTree("aws.vpcEndpoint.VpcEndpointConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcEndpointConfig.Jsii$Proxy that = (VpcEndpointConfig.Jsii$Proxy) o;

            if (!vpcId.equals(that.vpcId)) return false;
            if (this.autoAccept != null ? !this.autoAccept.equals(that.autoAccept) : that.autoAccept != null) return false;
            if (this.dnsOptions != null ? !this.dnsOptions.equals(that.dnsOptions) : that.dnsOptions != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipAddressType != null ? !this.ipAddressType.equals(that.ipAddressType) : that.ipAddressType != null) return false;
            if (this.policy != null ? !this.policy.equals(that.policy) : that.policy != null) return false;
            if (this.privateDnsEnabled != null ? !this.privateDnsEnabled.equals(that.privateDnsEnabled) : that.privateDnsEnabled != null) return false;
            if (this.resourceConfigurationArn != null ? !this.resourceConfigurationArn.equals(that.resourceConfigurationArn) : that.resourceConfigurationArn != null) return false;
            if (this.routeTableIds != null ? !this.routeTableIds.equals(that.routeTableIds) : that.routeTableIds != null) return false;
            if (this.securityGroupIds != null ? !this.securityGroupIds.equals(that.securityGroupIds) : that.securityGroupIds != null) return false;
            if (this.serviceName != null ? !this.serviceName.equals(that.serviceName) : that.serviceName != null) return false;
            if (this.serviceNetworkArn != null ? !this.serviceNetworkArn.equals(that.serviceNetworkArn) : that.serviceNetworkArn != null) return false;
            if (this.serviceRegion != null ? !this.serviceRegion.equals(that.serviceRegion) : that.serviceRegion != null) return false;
            if (this.subnetConfiguration != null ? !this.subnetConfiguration.equals(that.subnetConfiguration) : that.subnetConfiguration != null) return false;
            if (this.subnetIds != null ? !this.subnetIds.equals(that.subnetIds) : that.subnetIds != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpcEndpointType != null ? !this.vpcEndpointType.equals(that.vpcEndpointType) : that.vpcEndpointType != null) return false;
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
            int result = this.vpcId.hashCode();
            result = 31 * result + (this.autoAccept != null ? this.autoAccept.hashCode() : 0);
            result = 31 * result + (this.dnsOptions != null ? this.dnsOptions.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipAddressType != null ? this.ipAddressType.hashCode() : 0);
            result = 31 * result + (this.policy != null ? this.policy.hashCode() : 0);
            result = 31 * result + (this.privateDnsEnabled != null ? this.privateDnsEnabled.hashCode() : 0);
            result = 31 * result + (this.resourceConfigurationArn != null ? this.resourceConfigurationArn.hashCode() : 0);
            result = 31 * result + (this.routeTableIds != null ? this.routeTableIds.hashCode() : 0);
            result = 31 * result + (this.securityGroupIds != null ? this.securityGroupIds.hashCode() : 0);
            result = 31 * result + (this.serviceName != null ? this.serviceName.hashCode() : 0);
            result = 31 * result + (this.serviceNetworkArn != null ? this.serviceNetworkArn.hashCode() : 0);
            result = 31 * result + (this.serviceRegion != null ? this.serviceRegion.hashCode() : 0);
            result = 31 * result + (this.subnetConfiguration != null ? this.subnetConfiguration.hashCode() : 0);
            result = 31 * result + (this.subnetIds != null ? this.subnetIds.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpcEndpointType != null ? this.vpcEndpointType.hashCode() : 0);
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
