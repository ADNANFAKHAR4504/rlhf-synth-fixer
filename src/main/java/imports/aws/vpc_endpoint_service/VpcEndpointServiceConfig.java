package imports.aws.vpc_endpoint_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.594Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcEndpointService.VpcEndpointServiceConfig")
@software.amazon.jsii.Jsii.Proxy(VpcEndpointServiceConfig.Jsii$Proxy.class)
public interface VpcEndpointServiceConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#acceptance_required VpcEndpointService#acceptance_required}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getAcceptanceRequired();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#allowed_principals VpcEndpointService#allowed_principals}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAllowedPrincipals() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#gateway_load_balancer_arns VpcEndpointService#gateway_load_balancer_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getGatewayLoadBalancerArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#id VpcEndpointService#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#network_load_balancer_arns VpcEndpointService#network_load_balancer_arns}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNetworkLoadBalancerArns() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#private_dns_name VpcEndpointService#private_dns_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrivateDnsName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#supported_ip_address_types VpcEndpointService#supported_ip_address_types}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedIpAddressTypes() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#supported_regions VpcEndpointService#supported_regions}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSupportedRegions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#tags VpcEndpointService#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#tags_all VpcEndpointService#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#timeouts VpcEndpointService#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_endpoint_service.VpcEndpointServiceTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcEndpointServiceConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcEndpointServiceConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcEndpointServiceConfig> {
        java.lang.Object acceptanceRequired;
        java.util.List<java.lang.String> allowedPrincipals;
        java.util.List<java.lang.String> gatewayLoadBalancerArns;
        java.lang.String id;
        java.util.List<java.lang.String> networkLoadBalancerArns;
        java.lang.String privateDnsName;
        java.util.List<java.lang.String> supportedIpAddressTypes;
        java.util.List<java.lang.String> supportedRegions;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.vpc_endpoint_service.VpcEndpointServiceTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getAcceptanceRequired}
         * @param acceptanceRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#acceptance_required VpcEndpointService#acceptance_required}. This parameter is required.
         * @return {@code this}
         */
        public Builder acceptanceRequired(java.lang.Boolean acceptanceRequired) {
            this.acceptanceRequired = acceptanceRequired;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getAcceptanceRequired}
         * @param acceptanceRequired Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#acceptance_required VpcEndpointService#acceptance_required}. This parameter is required.
         * @return {@code this}
         */
        public Builder acceptanceRequired(com.hashicorp.cdktf.IResolvable acceptanceRequired) {
            this.acceptanceRequired = acceptanceRequired;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getAllowedPrincipals}
         * @param allowedPrincipals Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#allowed_principals VpcEndpointService#allowed_principals}.
         * @return {@code this}
         */
        public Builder allowedPrincipals(java.util.List<java.lang.String> allowedPrincipals) {
            this.allowedPrincipals = allowedPrincipals;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getGatewayLoadBalancerArns}
         * @param gatewayLoadBalancerArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#gateway_load_balancer_arns VpcEndpointService#gateway_load_balancer_arns}.
         * @return {@code this}
         */
        public Builder gatewayLoadBalancerArns(java.util.List<java.lang.String> gatewayLoadBalancerArns) {
            this.gatewayLoadBalancerArns = gatewayLoadBalancerArns;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#id VpcEndpointService#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getNetworkLoadBalancerArns}
         * @param networkLoadBalancerArns Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#network_load_balancer_arns VpcEndpointService#network_load_balancer_arns}.
         * @return {@code this}
         */
        public Builder networkLoadBalancerArns(java.util.List<java.lang.String> networkLoadBalancerArns) {
            this.networkLoadBalancerArns = networkLoadBalancerArns;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getPrivateDnsName}
         * @param privateDnsName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#private_dns_name VpcEndpointService#private_dns_name}.
         * @return {@code this}
         */
        public Builder privateDnsName(java.lang.String privateDnsName) {
            this.privateDnsName = privateDnsName;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getSupportedIpAddressTypes}
         * @param supportedIpAddressTypes Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#supported_ip_address_types VpcEndpointService#supported_ip_address_types}.
         * @return {@code this}
         */
        public Builder supportedIpAddressTypes(java.util.List<java.lang.String> supportedIpAddressTypes) {
            this.supportedIpAddressTypes = supportedIpAddressTypes;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getSupportedRegions}
         * @param supportedRegions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#supported_regions VpcEndpointService#supported_regions}.
         * @return {@code this}
         */
        public Builder supportedRegions(java.util.List<java.lang.String> supportedRegions) {
            this.supportedRegions = supportedRegions;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#tags VpcEndpointService#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#tags_all VpcEndpointService#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_endpoint_service#timeouts VpcEndpointService#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.vpc_endpoint_service.VpcEndpointServiceTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getDependsOn}
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
         * Sets the value of {@link VpcEndpointServiceConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcEndpointServiceConfig#getProvisioners}
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
         * @return a new instance of {@link VpcEndpointServiceConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcEndpointServiceConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcEndpointServiceConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcEndpointServiceConfig {
        private final java.lang.Object acceptanceRequired;
        private final java.util.List<java.lang.String> allowedPrincipals;
        private final java.util.List<java.lang.String> gatewayLoadBalancerArns;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> networkLoadBalancerArns;
        private final java.lang.String privateDnsName;
        private final java.util.List<java.lang.String> supportedIpAddressTypes;
        private final java.util.List<java.lang.String> supportedRegions;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.vpc_endpoint_service.VpcEndpointServiceTimeouts timeouts;
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
            this.acceptanceRequired = software.amazon.jsii.Kernel.get(this, "acceptanceRequired", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.allowedPrincipals = software.amazon.jsii.Kernel.get(this, "allowedPrincipals", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.gatewayLoadBalancerArns = software.amazon.jsii.Kernel.get(this, "gatewayLoadBalancerArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkLoadBalancerArns = software.amazon.jsii.Kernel.get(this, "networkLoadBalancerArns", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.privateDnsName = software.amazon.jsii.Kernel.get(this, "privateDnsName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.supportedIpAddressTypes = software.amazon.jsii.Kernel.get(this, "supportedIpAddressTypes", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.supportedRegions = software.amazon.jsii.Kernel.get(this, "supportedRegions", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_endpoint_service.VpcEndpointServiceTimeouts.class));
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
            this.acceptanceRequired = java.util.Objects.requireNonNull(builder.acceptanceRequired, "acceptanceRequired is required");
            this.allowedPrincipals = builder.allowedPrincipals;
            this.gatewayLoadBalancerArns = builder.gatewayLoadBalancerArns;
            this.id = builder.id;
            this.networkLoadBalancerArns = builder.networkLoadBalancerArns;
            this.privateDnsName = builder.privateDnsName;
            this.supportedIpAddressTypes = builder.supportedIpAddressTypes;
            this.supportedRegions = builder.supportedRegions;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.Object getAcceptanceRequired() {
            return this.acceptanceRequired;
        }

        @Override
        public final java.util.List<java.lang.String> getAllowedPrincipals() {
            return this.allowedPrincipals;
        }

        @Override
        public final java.util.List<java.lang.String> getGatewayLoadBalancerArns() {
            return this.gatewayLoadBalancerArns;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getNetworkLoadBalancerArns() {
            return this.networkLoadBalancerArns;
        }

        @Override
        public final java.lang.String getPrivateDnsName() {
            return this.privateDnsName;
        }

        @Override
        public final java.util.List<java.lang.String> getSupportedIpAddressTypes() {
            return this.supportedIpAddressTypes;
        }

        @Override
        public final java.util.List<java.lang.String> getSupportedRegions() {
            return this.supportedRegions;
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
        public final imports.aws.vpc_endpoint_service.VpcEndpointServiceTimeouts getTimeouts() {
            return this.timeouts;
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

            data.set("acceptanceRequired", om.valueToTree(this.getAcceptanceRequired()));
            if (this.getAllowedPrincipals() != null) {
                data.set("allowedPrincipals", om.valueToTree(this.getAllowedPrincipals()));
            }
            if (this.getGatewayLoadBalancerArns() != null) {
                data.set("gatewayLoadBalancerArns", om.valueToTree(this.getGatewayLoadBalancerArns()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNetworkLoadBalancerArns() != null) {
                data.set("networkLoadBalancerArns", om.valueToTree(this.getNetworkLoadBalancerArns()));
            }
            if (this.getPrivateDnsName() != null) {
                data.set("privateDnsName", om.valueToTree(this.getPrivateDnsName()));
            }
            if (this.getSupportedIpAddressTypes() != null) {
                data.set("supportedIpAddressTypes", om.valueToTree(this.getSupportedIpAddressTypes()));
            }
            if (this.getSupportedRegions() != null) {
                data.set("supportedRegions", om.valueToTree(this.getSupportedRegions()));
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
            struct.set("fqn", om.valueToTree("aws.vpcEndpointService.VpcEndpointServiceConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcEndpointServiceConfig.Jsii$Proxy that = (VpcEndpointServiceConfig.Jsii$Proxy) o;

            if (!acceptanceRequired.equals(that.acceptanceRequired)) return false;
            if (this.allowedPrincipals != null ? !this.allowedPrincipals.equals(that.allowedPrincipals) : that.allowedPrincipals != null) return false;
            if (this.gatewayLoadBalancerArns != null ? !this.gatewayLoadBalancerArns.equals(that.gatewayLoadBalancerArns) : that.gatewayLoadBalancerArns != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.networkLoadBalancerArns != null ? !this.networkLoadBalancerArns.equals(that.networkLoadBalancerArns) : that.networkLoadBalancerArns != null) return false;
            if (this.privateDnsName != null ? !this.privateDnsName.equals(that.privateDnsName) : that.privateDnsName != null) return false;
            if (this.supportedIpAddressTypes != null ? !this.supportedIpAddressTypes.equals(that.supportedIpAddressTypes) : that.supportedIpAddressTypes != null) return false;
            if (this.supportedRegions != null ? !this.supportedRegions.equals(that.supportedRegions) : that.supportedRegions != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
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
            int result = this.acceptanceRequired.hashCode();
            result = 31 * result + (this.allowedPrincipals != null ? this.allowedPrincipals.hashCode() : 0);
            result = 31 * result + (this.gatewayLoadBalancerArns != null ? this.gatewayLoadBalancerArns.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.networkLoadBalancerArns != null ? this.networkLoadBalancerArns.hashCode() : 0);
            result = 31 * result + (this.privateDnsName != null ? this.privateDnsName.hashCode() : 0);
            result = 31 * result + (this.supportedIpAddressTypes != null ? this.supportedIpAddressTypes.hashCode() : 0);
            result = 31 * result + (this.supportedRegions != null ? this.supportedRegions.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
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
