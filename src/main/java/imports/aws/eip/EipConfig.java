package imports.aws.eip;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.149Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.eip.EipConfig")
@software.amazon.jsii.Jsii.Proxy(EipConfig.Jsii$Proxy.class)
public interface EipConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#address Eip#address}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAddress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#associate_with_private_ip Eip#associate_with_private_ip}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getAssociateWithPrivateIp() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#customer_owned_ipv4_pool Eip#customer_owned_ipv4_pool}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCustomerOwnedIpv4Pool() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#domain Eip#domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomain() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#id Eip#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#instance Eip#instance}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInstance() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#ipam_pool_id Eip#ipam_pool_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpamPoolId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_border_group Eip#network_border_group}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkBorderGroup() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_interface Eip#network_interface}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetworkInterface() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#public_ipv4_pool Eip#public_ipv4_pool}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPublicIpv4Pool() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags Eip#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags_all Eip#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#timeouts Eip#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.eip.EipTimeouts getTimeouts() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#vpc Eip#vpc}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getVpc() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EipConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EipConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EipConfig> {
        java.lang.String address;
        java.lang.String associateWithPrivateIp;
        java.lang.String customerOwnedIpv4Pool;
        java.lang.String domain;
        java.lang.String id;
        java.lang.String instance;
        java.lang.String ipamPoolId;
        java.lang.String networkBorderGroup;
        java.lang.String networkInterface;
        java.lang.String publicIpv4Pool;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        imports.aws.eip.EipTimeouts timeouts;
        java.lang.Object vpc;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link EipConfig#getAddress}
         * @param address Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#address Eip#address}.
         * @return {@code this}
         */
        public Builder address(java.lang.String address) {
            this.address = address;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getAssociateWithPrivateIp}
         * @param associateWithPrivateIp Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#associate_with_private_ip Eip#associate_with_private_ip}.
         * @return {@code this}
         */
        public Builder associateWithPrivateIp(java.lang.String associateWithPrivateIp) {
            this.associateWithPrivateIp = associateWithPrivateIp;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getCustomerOwnedIpv4Pool}
         * @param customerOwnedIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#customer_owned_ipv4_pool Eip#customer_owned_ipv4_pool}.
         * @return {@code this}
         */
        public Builder customerOwnedIpv4Pool(java.lang.String customerOwnedIpv4Pool) {
            this.customerOwnedIpv4Pool = customerOwnedIpv4Pool;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#domain Eip#domain}.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#id Eip#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getInstance}
         * @param instance Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#instance Eip#instance}.
         * @return {@code this}
         */
        public Builder instance(java.lang.String instance) {
            this.instance = instance;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getIpamPoolId}
         * @param ipamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#ipam_pool_id Eip#ipam_pool_id}.
         * @return {@code this}
         */
        public Builder ipamPoolId(java.lang.String ipamPoolId) {
            this.ipamPoolId = ipamPoolId;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getNetworkBorderGroup}
         * @param networkBorderGroup Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_border_group Eip#network_border_group}.
         * @return {@code this}
         */
        public Builder networkBorderGroup(java.lang.String networkBorderGroup) {
            this.networkBorderGroup = networkBorderGroup;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getNetworkInterface}
         * @param networkInterface Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#network_interface Eip#network_interface}.
         * @return {@code this}
         */
        public Builder networkInterface(java.lang.String networkInterface) {
            this.networkInterface = networkInterface;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getPublicIpv4Pool}
         * @param publicIpv4Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#public_ipv4_pool Eip#public_ipv4_pool}.
         * @return {@code this}
         */
        public Builder publicIpv4Pool(java.lang.String publicIpv4Pool) {
            this.publicIpv4Pool = publicIpv4Pool;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags Eip#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#tags_all Eip#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#timeouts Eip#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.eip.EipTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getVpc}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#vpc Eip#vpc}.
         * @return {@code this}
         */
        public Builder vpc(java.lang.Boolean vpc) {
            this.vpc = vpc;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getVpc}
         * @param vpc Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/eip#vpc Eip#vpc}.
         * @return {@code this}
         */
        public Builder vpc(com.hashicorp.cdktf.IResolvable vpc) {
            this.vpc = vpc;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getDependsOn}
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
         * Sets the value of {@link EipConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link EipConfig#getProvisioners}
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
         * @return a new instance of {@link EipConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EipConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EipConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EipConfig {
        private final java.lang.String address;
        private final java.lang.String associateWithPrivateIp;
        private final java.lang.String customerOwnedIpv4Pool;
        private final java.lang.String domain;
        private final java.lang.String id;
        private final java.lang.String instance;
        private final java.lang.String ipamPoolId;
        private final java.lang.String networkBorderGroup;
        private final java.lang.String networkInterface;
        private final java.lang.String publicIpv4Pool;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
        private final imports.aws.eip.EipTimeouts timeouts;
        private final java.lang.Object vpc;
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
            this.address = software.amazon.jsii.Kernel.get(this, "address", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.associateWithPrivateIp = software.amazon.jsii.Kernel.get(this, "associateWithPrivateIp", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.customerOwnedIpv4Pool = software.amazon.jsii.Kernel.get(this, "customerOwnedIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.instance = software.amazon.jsii.Kernel.get(this, "instance", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipamPoolId = software.amazon.jsii.Kernel.get(this, "ipamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkBorderGroup = software.amazon.jsii.Kernel.get(this, "networkBorderGroup", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.networkInterface = software.amazon.jsii.Kernel.get(this, "networkInterface", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.publicIpv4Pool = software.amazon.jsii.Kernel.get(this, "publicIpv4Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.eip.EipTimeouts.class));
            this.vpc = software.amazon.jsii.Kernel.get(this, "vpc", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
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
            this.address = builder.address;
            this.associateWithPrivateIp = builder.associateWithPrivateIp;
            this.customerOwnedIpv4Pool = builder.customerOwnedIpv4Pool;
            this.domain = builder.domain;
            this.id = builder.id;
            this.instance = builder.instance;
            this.ipamPoolId = builder.ipamPoolId;
            this.networkBorderGroup = builder.networkBorderGroup;
            this.networkInterface = builder.networkInterface;
            this.publicIpv4Pool = builder.publicIpv4Pool;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.timeouts = builder.timeouts;
            this.vpc = builder.vpc;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getAddress() {
            return this.address;
        }

        @Override
        public final java.lang.String getAssociateWithPrivateIp() {
            return this.associateWithPrivateIp;
        }

        @Override
        public final java.lang.String getCustomerOwnedIpv4Pool() {
            return this.customerOwnedIpv4Pool;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getInstance() {
            return this.instance;
        }

        @Override
        public final java.lang.String getIpamPoolId() {
            return this.ipamPoolId;
        }

        @Override
        public final java.lang.String getNetworkBorderGroup() {
            return this.networkBorderGroup;
        }

        @Override
        public final java.lang.String getNetworkInterface() {
            return this.networkInterface;
        }

        @Override
        public final java.lang.String getPublicIpv4Pool() {
            return this.publicIpv4Pool;
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
        public final imports.aws.eip.EipTimeouts getTimeouts() {
            return this.timeouts;
        }

        @Override
        public final java.lang.Object getVpc() {
            return this.vpc;
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

            if (this.getAddress() != null) {
                data.set("address", om.valueToTree(this.getAddress()));
            }
            if (this.getAssociateWithPrivateIp() != null) {
                data.set("associateWithPrivateIp", om.valueToTree(this.getAssociateWithPrivateIp()));
            }
            if (this.getCustomerOwnedIpv4Pool() != null) {
                data.set("customerOwnedIpv4Pool", om.valueToTree(this.getCustomerOwnedIpv4Pool()));
            }
            if (this.getDomain() != null) {
                data.set("domain", om.valueToTree(this.getDomain()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getInstance() != null) {
                data.set("instance", om.valueToTree(this.getInstance()));
            }
            if (this.getIpamPoolId() != null) {
                data.set("ipamPoolId", om.valueToTree(this.getIpamPoolId()));
            }
            if (this.getNetworkBorderGroup() != null) {
                data.set("networkBorderGroup", om.valueToTree(this.getNetworkBorderGroup()));
            }
            if (this.getNetworkInterface() != null) {
                data.set("networkInterface", om.valueToTree(this.getNetworkInterface()));
            }
            if (this.getPublicIpv4Pool() != null) {
                data.set("publicIpv4Pool", om.valueToTree(this.getPublicIpv4Pool()));
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
            if (this.getVpc() != null) {
                data.set("vpc", om.valueToTree(this.getVpc()));
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
            struct.set("fqn", om.valueToTree("aws.eip.EipConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EipConfig.Jsii$Proxy that = (EipConfig.Jsii$Proxy) o;

            if (this.address != null ? !this.address.equals(that.address) : that.address != null) return false;
            if (this.associateWithPrivateIp != null ? !this.associateWithPrivateIp.equals(that.associateWithPrivateIp) : that.associateWithPrivateIp != null) return false;
            if (this.customerOwnedIpv4Pool != null ? !this.customerOwnedIpv4Pool.equals(that.customerOwnedIpv4Pool) : that.customerOwnedIpv4Pool != null) return false;
            if (this.domain != null ? !this.domain.equals(that.domain) : that.domain != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.instance != null ? !this.instance.equals(that.instance) : that.instance != null) return false;
            if (this.ipamPoolId != null ? !this.ipamPoolId.equals(that.ipamPoolId) : that.ipamPoolId != null) return false;
            if (this.networkBorderGroup != null ? !this.networkBorderGroup.equals(that.networkBorderGroup) : that.networkBorderGroup != null) return false;
            if (this.networkInterface != null ? !this.networkInterface.equals(that.networkInterface) : that.networkInterface != null) return false;
            if (this.publicIpv4Pool != null ? !this.publicIpv4Pool.equals(that.publicIpv4Pool) : that.publicIpv4Pool != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
            if (this.timeouts != null ? !this.timeouts.equals(that.timeouts) : that.timeouts != null) return false;
            if (this.vpc != null ? !this.vpc.equals(that.vpc) : that.vpc != null) return false;
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
            int result = this.address != null ? this.address.hashCode() : 0;
            result = 31 * result + (this.associateWithPrivateIp != null ? this.associateWithPrivateIp.hashCode() : 0);
            result = 31 * result + (this.customerOwnedIpv4Pool != null ? this.customerOwnedIpv4Pool.hashCode() : 0);
            result = 31 * result + (this.domain != null ? this.domain.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.instance != null ? this.instance.hashCode() : 0);
            result = 31 * result + (this.ipamPoolId != null ? this.ipamPoolId.hashCode() : 0);
            result = 31 * result + (this.networkBorderGroup != null ? this.networkBorderGroup.hashCode() : 0);
            result = 31 * result + (this.networkInterface != null ? this.networkInterface.hashCode() : 0);
            result = 31 * result + (this.publicIpv4Pool != null ? this.publicIpv4Pool.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
            result = 31 * result + (this.timeouts != null ? this.timeouts.hashCode() : 0);
            result = 31 * result + (this.vpc != null ? this.vpc.hashCode() : 0);
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
