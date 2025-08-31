package imports.aws.vpc_ipv6_cidr_block_association;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.607Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcIpv6CidrBlockAssociation.VpcIpv6CidrBlockAssociationConfig")
@software.amazon.jsii.Jsii.Proxy(VpcIpv6CidrBlockAssociationConfig.Jsii$Proxy.class)
public interface VpcIpv6CidrBlockAssociationConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#vpc_id VpcIpv6CidrBlockAssociation#vpc_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getVpcId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#assign_generated_ipv6_cidr_block VpcIpv6CidrBlockAssociation#assign_generated_ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getAssignGeneratedIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#id VpcIpv6CidrBlockAssociation#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_cidr_block VpcIpv6CidrBlockAssociation#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_ipam_pool_id VpcIpv6CidrBlockAssociation#ipv6_ipam_pool_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6IpamPoolId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_netmask_length VpcIpv6CidrBlockAssociation#ipv6_netmask_length}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIpv6NetmaskLength() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_pool VpcIpv6CidrBlockAssociation#ipv6_pool}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6Pool() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#timeouts VpcIpv6CidrBlockAssociation#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcIpv6CidrBlockAssociationConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcIpv6CidrBlockAssociationConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcIpv6CidrBlockAssociationConfig> {
        java.lang.String vpcId;
        java.lang.Object assignGeneratedIpv6CidrBlock;
        java.lang.String id;
        java.lang.String ipv6CidrBlock;
        java.lang.String ipv6IpamPoolId;
        java.lang.Number ipv6NetmaskLength;
        java.lang.String ipv6Pool;
        imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getVpcId}
         * @param vpcId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#vpc_id VpcIpv6CidrBlockAssociation#vpc_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder vpcId(java.lang.String vpcId) {
            this.vpcId = vpcId;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getAssignGeneratedIpv6CidrBlock}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#assign_generated_ipv6_cidr_block VpcIpv6CidrBlockAssociation#assign_generated_ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder assignGeneratedIpv6CidrBlock(java.lang.Boolean assignGeneratedIpv6CidrBlock) {
            this.assignGeneratedIpv6CidrBlock = assignGeneratedIpv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getAssignGeneratedIpv6CidrBlock}
         * @param assignGeneratedIpv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#assign_generated_ipv6_cidr_block VpcIpv6CidrBlockAssociation#assign_generated_ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder assignGeneratedIpv6CidrBlock(com.hashicorp.cdktf.IResolvable assignGeneratedIpv6CidrBlock) {
            this.assignGeneratedIpv6CidrBlock = assignGeneratedIpv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#id VpcIpv6CidrBlockAssociation#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_cidr_block VpcIpv6CidrBlockAssociation#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getIpv6IpamPoolId}
         * @param ipv6IpamPoolId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_ipam_pool_id VpcIpv6CidrBlockAssociation#ipv6_ipam_pool_id}.
         * @return {@code this}
         */
        public Builder ipv6IpamPoolId(java.lang.String ipv6IpamPoolId) {
            this.ipv6IpamPoolId = ipv6IpamPoolId;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getIpv6NetmaskLength}
         * @param ipv6NetmaskLength Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_netmask_length VpcIpv6CidrBlockAssociation#ipv6_netmask_length}.
         * @return {@code this}
         */
        public Builder ipv6NetmaskLength(java.lang.Number ipv6NetmaskLength) {
            this.ipv6NetmaskLength = ipv6NetmaskLength;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getIpv6Pool}
         * @param ipv6Pool Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#ipv6_pool VpcIpv6CidrBlockAssociation#ipv6_pool}.
         * @return {@code this}
         */
        public Builder ipv6Pool(java.lang.String ipv6Pool) {
            this.ipv6Pool = ipv6Pool;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_ipv6_cidr_block_association#timeouts VpcIpv6CidrBlockAssociation#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getDependsOn}
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
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcIpv6CidrBlockAssociationConfig#getProvisioners}
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
         * @return a new instance of {@link VpcIpv6CidrBlockAssociationConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcIpv6CidrBlockAssociationConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcIpv6CidrBlockAssociationConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcIpv6CidrBlockAssociationConfig {
        private final java.lang.String vpcId;
        private final java.lang.Object assignGeneratedIpv6CidrBlock;
        private final java.lang.String id;
        private final java.lang.String ipv6CidrBlock;
        private final java.lang.String ipv6IpamPoolId;
        private final java.lang.Number ipv6NetmaskLength;
        private final java.lang.String ipv6Pool;
        private final imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts timeouts;
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
            this.assignGeneratedIpv6CidrBlock = software.amazon.jsii.Kernel.get(this, "assignGeneratedIpv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6IpamPoolId = software.amazon.jsii.Kernel.get(this, "ipv6IpamPoolId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6NetmaskLength = software.amazon.jsii.Kernel.get(this, "ipv6NetmaskLength", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ipv6Pool = software.amazon.jsii.Kernel.get(this, "ipv6Pool", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts.class));
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
            this.assignGeneratedIpv6CidrBlock = builder.assignGeneratedIpv6CidrBlock;
            this.id = builder.id;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
            this.ipv6IpamPoolId = builder.ipv6IpamPoolId;
            this.ipv6NetmaskLength = builder.ipv6NetmaskLength;
            this.ipv6Pool = builder.ipv6Pool;
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
        public final java.lang.String getVpcId() {
            return this.vpcId;
        }

        @Override
        public final java.lang.Object getAssignGeneratedIpv6CidrBlock() {
            return this.assignGeneratedIpv6CidrBlock;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpv6CidrBlock() {
            return this.ipv6CidrBlock;
        }

        @Override
        public final java.lang.String getIpv6IpamPoolId() {
            return this.ipv6IpamPoolId;
        }

        @Override
        public final java.lang.Number getIpv6NetmaskLength() {
            return this.ipv6NetmaskLength;
        }

        @Override
        public final java.lang.String getIpv6Pool() {
            return this.ipv6Pool;
        }

        @Override
        public final imports.aws.vpc_ipv6_cidr_block_association.VpcIpv6CidrBlockAssociationTimeouts getTimeouts() {
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

            data.set("vpcId", om.valueToTree(this.getVpcId()));
            if (this.getAssignGeneratedIpv6CidrBlock() != null) {
                data.set("assignGeneratedIpv6CidrBlock", om.valueToTree(this.getAssignGeneratedIpv6CidrBlock()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
            }
            if (this.getIpv6IpamPoolId() != null) {
                data.set("ipv6IpamPoolId", om.valueToTree(this.getIpv6IpamPoolId()));
            }
            if (this.getIpv6NetmaskLength() != null) {
                data.set("ipv6NetmaskLength", om.valueToTree(this.getIpv6NetmaskLength()));
            }
            if (this.getIpv6Pool() != null) {
                data.set("ipv6Pool", om.valueToTree(this.getIpv6Pool()));
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
            struct.set("fqn", om.valueToTree("aws.vpcIpv6CidrBlockAssociation.VpcIpv6CidrBlockAssociationConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcIpv6CidrBlockAssociationConfig.Jsii$Proxy that = (VpcIpv6CidrBlockAssociationConfig.Jsii$Proxy) o;

            if (!vpcId.equals(that.vpcId)) return false;
            if (this.assignGeneratedIpv6CidrBlock != null ? !this.assignGeneratedIpv6CidrBlock.equals(that.assignGeneratedIpv6CidrBlock) : that.assignGeneratedIpv6CidrBlock != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
            if (this.ipv6IpamPoolId != null ? !this.ipv6IpamPoolId.equals(that.ipv6IpamPoolId) : that.ipv6IpamPoolId != null) return false;
            if (this.ipv6NetmaskLength != null ? !this.ipv6NetmaskLength.equals(that.ipv6NetmaskLength) : that.ipv6NetmaskLength != null) return false;
            if (this.ipv6Pool != null ? !this.ipv6Pool.equals(that.ipv6Pool) : that.ipv6Pool != null) return false;
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
            int result = this.vpcId.hashCode();
            result = 31 * result + (this.assignGeneratedIpv6CidrBlock != null ? this.assignGeneratedIpv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
            result = 31 * result + (this.ipv6IpamPoolId != null ? this.ipv6IpamPoolId.hashCode() : 0);
            result = 31 * result + (this.ipv6NetmaskLength != null ? this.ipv6NetmaskLength.hashCode() : 0);
            result = 31 * result + (this.ipv6Pool != null ? this.ipv6Pool.hashCode() : 0);
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
