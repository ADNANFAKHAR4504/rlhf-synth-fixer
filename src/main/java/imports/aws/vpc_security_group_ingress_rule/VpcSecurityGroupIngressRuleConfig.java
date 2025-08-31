package imports.aws.vpc_security_group_ingress_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.617Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcSecurityGroupIngressRule.VpcSecurityGroupIngressRuleConfig")
@software.amazon.jsii.Jsii.Proxy(VpcSecurityGroupIngressRuleConfig.Jsii$Proxy.class)
public interface VpcSecurityGroupIngressRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#ip_protocol VpcSecurityGroupIngressRule#ip_protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getIpProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#security_group_id VpcSecurityGroupIngressRule#security_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecurityGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv4 VpcSecurityGroupIngressRule#cidr_ipv4}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrIpv4() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv6 VpcSecurityGroupIngressRule#cidr_ipv6}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrIpv6() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#description VpcSecurityGroupIngressRule#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#from_port VpcSecurityGroupIngressRule#from_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFromPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#prefix_list_id VpcSecurityGroupIngressRule#prefix_list_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPrefixListId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#referenced_security_group_id VpcSecurityGroupIngressRule#referenced_security_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReferencedSecurityGroupId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#tags VpcSecurityGroupIngressRule#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#to_port VpcSecurityGroupIngressRule#to_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getToPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcSecurityGroupIngressRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcSecurityGroupIngressRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcSecurityGroupIngressRuleConfig> {
        java.lang.String ipProtocol;
        java.lang.String securityGroupId;
        java.lang.String cidrIpv4;
        java.lang.String cidrIpv6;
        java.lang.String description;
        java.lang.Number fromPort;
        java.lang.String prefixListId;
        java.lang.String referencedSecurityGroupId;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.lang.Number toPort;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getIpProtocol}
         * @param ipProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#ip_protocol VpcSecurityGroupIngressRule#ip_protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder ipProtocol(java.lang.String ipProtocol) {
            this.ipProtocol = ipProtocol;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getSecurityGroupId}
         * @param securityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#security_group_id VpcSecurityGroupIngressRule#security_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityGroupId(java.lang.String securityGroupId) {
            this.securityGroupId = securityGroupId;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getCidrIpv4}
         * @param cidrIpv4 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv4 VpcSecurityGroupIngressRule#cidr_ipv4}.
         * @return {@code this}
         */
        public Builder cidrIpv4(java.lang.String cidrIpv4) {
            this.cidrIpv4 = cidrIpv4;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getCidrIpv6}
         * @param cidrIpv6 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#cidr_ipv6 VpcSecurityGroupIngressRule#cidr_ipv6}.
         * @return {@code this}
         */
        public Builder cidrIpv6(java.lang.String cidrIpv6) {
            this.cidrIpv6 = cidrIpv6;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#description VpcSecurityGroupIngressRule#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getFromPort}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#from_port VpcSecurityGroupIngressRule#from_port}.
         * @return {@code this}
         */
        public Builder fromPort(java.lang.Number fromPort) {
            this.fromPort = fromPort;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getPrefixListId}
         * @param prefixListId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#prefix_list_id VpcSecurityGroupIngressRule#prefix_list_id}.
         * @return {@code this}
         */
        public Builder prefixListId(java.lang.String prefixListId) {
            this.prefixListId = prefixListId;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getReferencedSecurityGroupId}
         * @param referencedSecurityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#referenced_security_group_id VpcSecurityGroupIngressRule#referenced_security_group_id}.
         * @return {@code this}
         */
        public Builder referencedSecurityGroupId(java.lang.String referencedSecurityGroupId) {
            this.referencedSecurityGroupId = referencedSecurityGroupId;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#tags VpcSecurityGroupIngressRule#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getToPort}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_security_group_ingress_rule#to_port VpcSecurityGroupIngressRule#to_port}.
         * @return {@code this}
         */
        public Builder toPort(java.lang.Number toPort) {
            this.toPort = toPort;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getDependsOn}
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
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcSecurityGroupIngressRuleConfig#getProvisioners}
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
         * @return a new instance of {@link VpcSecurityGroupIngressRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcSecurityGroupIngressRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcSecurityGroupIngressRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcSecurityGroupIngressRuleConfig {
        private final java.lang.String ipProtocol;
        private final java.lang.String securityGroupId;
        private final java.lang.String cidrIpv4;
        private final java.lang.String cidrIpv6;
        private final java.lang.String description;
        private final java.lang.Number fromPort;
        private final java.lang.String prefixListId;
        private final java.lang.String referencedSecurityGroupId;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.lang.Number toPort;
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
            this.ipProtocol = software.amazon.jsii.Kernel.get(this, "ipProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupId = software.amazon.jsii.Kernel.get(this, "securityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrIpv4 = software.amazon.jsii.Kernel.get(this, "cidrIpv4", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrIpv6 = software.amazon.jsii.Kernel.get(this, "cidrIpv6", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fromPort = software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.prefixListId = software.amazon.jsii.Kernel.get(this, "prefixListId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.referencedSecurityGroupId = software.amazon.jsii.Kernel.get(this, "referencedSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.toPort = software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
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
            this.ipProtocol = java.util.Objects.requireNonNull(builder.ipProtocol, "ipProtocol is required");
            this.securityGroupId = java.util.Objects.requireNonNull(builder.securityGroupId, "securityGroupId is required");
            this.cidrIpv4 = builder.cidrIpv4;
            this.cidrIpv6 = builder.cidrIpv6;
            this.description = builder.description;
            this.fromPort = builder.fromPort;
            this.prefixListId = builder.prefixListId;
            this.referencedSecurityGroupId = builder.referencedSecurityGroupId;
            this.tags = builder.tags;
            this.toPort = builder.toPort;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getIpProtocol() {
            return this.ipProtocol;
        }

        @Override
        public final java.lang.String getSecurityGroupId() {
            return this.securityGroupId;
        }

        @Override
        public final java.lang.String getCidrIpv4() {
            return this.cidrIpv4;
        }

        @Override
        public final java.lang.String getCidrIpv6() {
            return this.cidrIpv6;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.Number getFromPort() {
            return this.fromPort;
        }

        @Override
        public final java.lang.String getPrefixListId() {
            return this.prefixListId;
        }

        @Override
        public final java.lang.String getReferencedSecurityGroupId() {
            return this.referencedSecurityGroupId;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getTags() {
            return this.tags;
        }

        @Override
        public final java.lang.Number getToPort() {
            return this.toPort;
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

            data.set("ipProtocol", om.valueToTree(this.getIpProtocol()));
            data.set("securityGroupId", om.valueToTree(this.getSecurityGroupId()));
            if (this.getCidrIpv4() != null) {
                data.set("cidrIpv4", om.valueToTree(this.getCidrIpv4()));
            }
            if (this.getCidrIpv6() != null) {
                data.set("cidrIpv6", om.valueToTree(this.getCidrIpv6()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getFromPort() != null) {
                data.set("fromPort", om.valueToTree(this.getFromPort()));
            }
            if (this.getPrefixListId() != null) {
                data.set("prefixListId", om.valueToTree(this.getPrefixListId()));
            }
            if (this.getReferencedSecurityGroupId() != null) {
                data.set("referencedSecurityGroupId", om.valueToTree(this.getReferencedSecurityGroupId()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getToPort() != null) {
                data.set("toPort", om.valueToTree(this.getToPort()));
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
            struct.set("fqn", om.valueToTree("aws.vpcSecurityGroupIngressRule.VpcSecurityGroupIngressRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcSecurityGroupIngressRuleConfig.Jsii$Proxy that = (VpcSecurityGroupIngressRuleConfig.Jsii$Proxy) o;

            if (!ipProtocol.equals(that.ipProtocol)) return false;
            if (!securityGroupId.equals(that.securityGroupId)) return false;
            if (this.cidrIpv4 != null ? !this.cidrIpv4.equals(that.cidrIpv4) : that.cidrIpv4 != null) return false;
            if (this.cidrIpv6 != null ? !this.cidrIpv6.equals(that.cidrIpv6) : that.cidrIpv6 != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.fromPort != null ? !this.fromPort.equals(that.fromPort) : that.fromPort != null) return false;
            if (this.prefixListId != null ? !this.prefixListId.equals(that.prefixListId) : that.prefixListId != null) return false;
            if (this.referencedSecurityGroupId != null ? !this.referencedSecurityGroupId.equals(that.referencedSecurityGroupId) : that.referencedSecurityGroupId != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.toPort != null ? !this.toPort.equals(that.toPort) : that.toPort != null) return false;
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
            int result = this.ipProtocol.hashCode();
            result = 31 * result + (this.securityGroupId.hashCode());
            result = 31 * result + (this.cidrIpv4 != null ? this.cidrIpv4.hashCode() : 0);
            result = 31 * result + (this.cidrIpv6 != null ? this.cidrIpv6.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.fromPort != null ? this.fromPort.hashCode() : 0);
            result = 31 * result + (this.prefixListId != null ? this.prefixListId.hashCode() : 0);
            result = 31 * result + (this.referencedSecurityGroupId != null ? this.referencedSecurityGroupId.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.toPort != null ? this.toPort.hashCode() : 0);
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
