package imports.aws.vpc_ipam_pool_cidr;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.601Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpamPoolCidr.VpcIpamPoolCidrConfig")
@software.amazon.jsii.Jsii.Proxy(VpcIpamPoolCidrConfig.Jsii$Proxy.class)
public interface VpcIpamPoolCidrConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#ipam_pool_id VpcIpamPoolCidr#ipam_pool_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIpamPoolId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#cidr VpcIpamPoolCidr#cidr}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidr() {
        return null;
    }

    /**
     * cidr_authorization_context block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#cidr_authorization_context VpcIpamPoolCidr#cidr_authorization_context}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext getCidrAuthorizationContext() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#id VpcIpamPoolCidr#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#netmask_length VpcIpamPoolCidr#netmask_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getNetmaskLength() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#timeouts VpcIpamPoolCidr#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcIpamPoolCidrConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcIpamPoolCidrConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcIpamPoolCidrConfig> {
        java.lang.String ipamPoolId;
        java.lang.String cidr;
        imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext cidrAuthorizationContext;
        java.lang.String id;
        java.lang.Number netmaskLength;
        imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getIpamPoolId}
         * @param ipamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#ipam_pool_id VpcIpamPoolCidr#ipam_pool_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder ipamPoolId(java.lang.String ipamPoolId) {
            this.ipamPoolId = ipamPoolId;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getCidr}
         * @param cidr Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#cidr VpcIpamPoolCidr#cidr}.
         * @return {@code this}
         */
        public Builder cidr(java.lang.String cidr) {
            this.cidr = cidr;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getCidrAuthorizationContext}
         * @param cidrAuthorizationContext cidr_authorization_context block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#cidr_authorization_context VpcIpamPoolCidr#cidr_authorization_context}
         * @return {@code this}
         */
        public Builder cidrAuthorizationContext(imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext cidrAuthorizationContext) {
            this.cidrAuthorizationContext = cidrAuthorizationContext;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#id VpcIpamPoolCidr#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getNetmaskLength}
         * @param netmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#netmask_length VpcIpamPoolCidr#netmask_length}.
         * @return {@code this}
         */
        public Builder netmaskLength(java.lang.Number netmaskLength) {
            this.netmaskLength = netmaskLength;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipam_pool_cidr#timeouts VpcIpamPoolCidr#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getDependsOn}
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
         * Sets the value of {@link VpcIpamPoolCidrConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpamPoolCidrConfig#getProvisioners}
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
         * @return a new instance of {@link VpcIpamPoolCidrConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcIpamPoolCidrConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcIpamPoolCidrConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcIpamPoolCidrConfig {
        private final java.lang.String ipamPoolId;
        private final java.lang.String cidr;
        private final imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext cidrAuthorizationContext;
        private final java.lang.String id;
        private final java.lang.Number netmaskLength;
        private final imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrTimeouts timeouts;
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
            this.ipamPoolId = software.amazon.jsii.Kernel.get(this, "ipamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidr = software.amazon.jsii.Kernel.get(this, "cidr", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrAuthorizationContext = software.amazon.jsii.Kernel.get(this, "cidrAuthorizationContext", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.netmaskLength = software.amazon.jsii.Kernel.get(this, "netmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrTimeouts.class));
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
            this.ipamPoolId = java.util.Objects.requireNonNull(builder.ipamPoolId, "ipamPoolId is required");
            this.cidr = builder.cidr;
            this.cidrAuthorizationContext = builder.cidrAuthorizationContext;
            this.id = builder.id;
            this.netmaskLength = builder.netmaskLength;
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
        public final java.lang.String getIpamPoolId() {
            return this.ipamPoolId;
        }

        @Override
        public final java.lang.String getCidr() {
            return this.cidr;
        }

        @Override
        public final imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrCidrAuthorizationContext getCidrAuthorizationContext() {
            return this.cidrAuthorizationContext;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.Number getNetmaskLength() {
            return this.netmaskLength;
        }

        @Override
        public final imports.aws.vpc_ipam_pool_cidr.VpcIpamPoolCidrTimeouts getTimeouts() {
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

            data.set("ipamPoolId", om.valueToTree(this.getIpamPoolId()));
            if (this.getCidr() != null) {
                data.set("cidr", om.valueToTree(this.getCidr()));
            }
            if (this.getCidrAuthorizationContext() != null) {
                data.set("cidrAuthorizationContext", om.valueToTree(this.getCidrAuthorizationContext()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getNetmaskLength() != null) {
                data.set("netmaskLength", om.valueToTree(this.getNetmaskLength()));
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
            struct.set("fqn", om.valueToTree("aws.vpcIpamPoolCidr.VpcIpamPoolCidrConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcIpamPoolCidrConfig.Jsii$Proxy that = (VpcIpamPoolCidrConfig.Jsii$Proxy) o;

            if (!ipamPoolId.equals(that.ipamPoolId)) return false;
            if (this.cidr != null ? !this.cidr.equals(that.cidr) : that.cidr != null) return false;
            if (this.cidrAuthorizationContext != null ? !this.cidrAuthorizationContext.equals(that.cidrAuthorizationContext) : that.cidrAuthorizationContext != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.netmaskLength != null ? !this.netmaskLength.equals(that.netmaskLength) : that.netmaskLength != null) return false;
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
            int result = this.ipamPoolId.hashCode();
            result = 31 * result + (this.cidr != null ? this.cidr.hashCode() : 0);
            result = 31 * result + (this.cidrAuthorizationContext != null ? this.cidrAuthorizationContext.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.netmaskLength != null ? this.netmaskLength.hashCode() : 0);
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
