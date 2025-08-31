package imports.aws.network_acl_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.941Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.networkAclRule.NetworkAclRuleConfig")
@software.amazon.jsii.Jsii.Proxy(NetworkAclRuleConfig.Jsii$Proxy.class)
public interface NetworkAclRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#network_acl_id NetworkAclRule#network_acl_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNetworkAclId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#protocol NetworkAclRule#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#rule_action NetworkAclRule#rule_action}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getRuleAction();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#rule_number NetworkAclRule#rule_number}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getRuleNumber();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#cidr_block NetworkAclRule#cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#egress NetworkAclRule#egress}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEgress() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#from_port NetworkAclRule#from_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getFromPort() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#icmp_code NetworkAclRule#icmp_code}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIcmpCode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#icmp_type NetworkAclRule#icmp_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIcmpType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#id NetworkAclRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#ipv6_cidr_block NetworkAclRule#ipv6_cidr_block}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6CidrBlock() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#to_port NetworkAclRule#to_port}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getToPort() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link NetworkAclRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link NetworkAclRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<NetworkAclRuleConfig> {
        java.lang.String networkAclId;
        java.lang.String protocol;
        java.lang.String ruleAction;
        java.lang.Number ruleNumber;
        java.lang.String cidrBlock;
        java.lang.Object egress;
        java.lang.Number fromPort;
        java.lang.Number icmpCode;
        java.lang.Number icmpType;
        java.lang.String id;
        java.lang.String ipv6CidrBlock;
        java.lang.Number toPort;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getNetworkAclId}
         * @param networkAclId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#network_acl_id NetworkAclRule#network_acl_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder networkAclId(java.lang.String networkAclId) {
            this.networkAclId = networkAclId;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#protocol NetworkAclRule#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getRuleAction}
         * @param ruleAction Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#rule_action NetworkAclRule#rule_action}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleAction(java.lang.String ruleAction) {
            this.ruleAction = ruleAction;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getRuleNumber}
         * @param ruleNumber Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#rule_number NetworkAclRule#rule_number}. This parameter is required.
         * @return {@code this}
         */
        public Builder ruleNumber(java.lang.Number ruleNumber) {
            this.ruleNumber = ruleNumber;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getCidrBlock}
         * @param cidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#cidr_block NetworkAclRule#cidr_block}.
         * @return {@code this}
         */
        public Builder cidrBlock(java.lang.String cidrBlock) {
            this.cidrBlock = cidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getEgress}
         * @param egress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#egress NetworkAclRule#egress}.
         * @return {@code this}
         */
        public Builder egress(java.lang.Boolean egress) {
            this.egress = egress;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getEgress}
         * @param egress Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#egress NetworkAclRule#egress}.
         * @return {@code this}
         */
        public Builder egress(com.hashicorp.cdktf.IResolvable egress) {
            this.egress = egress;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getFromPort}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#from_port NetworkAclRule#from_port}.
         * @return {@code this}
         */
        public Builder fromPort(java.lang.Number fromPort) {
            this.fromPort = fromPort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getIcmpCode}
         * @param icmpCode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#icmp_code NetworkAclRule#icmp_code}.
         * @return {@code this}
         */
        public Builder icmpCode(java.lang.Number icmpCode) {
            this.icmpCode = icmpCode;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getIcmpType}
         * @param icmpType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#icmp_type NetworkAclRule#icmp_type}.
         * @return {@code this}
         */
        public Builder icmpType(java.lang.Number icmpType) {
            this.icmpType = icmpType;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#id NetworkAclRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getIpv6CidrBlock}
         * @param ipv6CidrBlock Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#ipv6_cidr_block NetworkAclRule#ipv6_cidr_block}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlock(java.lang.String ipv6CidrBlock) {
            this.ipv6CidrBlock = ipv6CidrBlock;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getToPort}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/network_acl_rule#to_port NetworkAclRule#to_port}.
         * @return {@code this}
         */
        public Builder toPort(java.lang.Number toPort) {
            this.toPort = toPort;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getDependsOn}
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
         * Sets the value of {@link NetworkAclRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link NetworkAclRuleConfig#getProvisioners}
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
         * @return a new instance of {@link NetworkAclRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public NetworkAclRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link NetworkAclRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements NetworkAclRuleConfig {
        private final java.lang.String networkAclId;
        private final java.lang.String protocol;
        private final java.lang.String ruleAction;
        private final java.lang.Number ruleNumber;
        private final java.lang.String cidrBlock;
        private final java.lang.Object egress;
        private final java.lang.Number fromPort;
        private final java.lang.Number icmpCode;
        private final java.lang.Number icmpType;
        private final java.lang.String id;
        private final java.lang.String ipv6CidrBlock;
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
            this.networkAclId = software.amazon.jsii.Kernel.get(this, "networkAclId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleAction = software.amazon.jsii.Kernel.get(this, "ruleAction", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ruleNumber = software.amazon.jsii.Kernel.get(this, "ruleNumber", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.cidrBlock = software.amazon.jsii.Kernel.get(this, "cidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.egress = software.amazon.jsii.Kernel.get(this, "egress", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.fromPort = software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.icmpCode = software.amazon.jsii.Kernel.get(this, "icmpCode", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.icmpType = software.amazon.jsii.Kernel.get(this, "icmpType", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6CidrBlock = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlock", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
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
            this.networkAclId = java.util.Objects.requireNonNull(builder.networkAclId, "networkAclId is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.ruleAction = java.util.Objects.requireNonNull(builder.ruleAction, "ruleAction is required");
            this.ruleNumber = java.util.Objects.requireNonNull(builder.ruleNumber, "ruleNumber is required");
            this.cidrBlock = builder.cidrBlock;
            this.egress = builder.egress;
            this.fromPort = builder.fromPort;
            this.icmpCode = builder.icmpCode;
            this.icmpType = builder.icmpType;
            this.id = builder.id;
            this.ipv6CidrBlock = builder.ipv6CidrBlock;
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
        public final java.lang.String getNetworkAclId() {
            return this.networkAclId;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getRuleAction() {
            return this.ruleAction;
        }

        @Override
        public final java.lang.Number getRuleNumber() {
            return this.ruleNumber;
        }

        @Override
        public final java.lang.String getCidrBlock() {
            return this.cidrBlock;
        }

        @Override
        public final java.lang.Object getEgress() {
            return this.egress;
        }

        @Override
        public final java.lang.Number getFromPort() {
            return this.fromPort;
        }

        @Override
        public final java.lang.Number getIcmpCode() {
            return this.icmpCode;
        }

        @Override
        public final java.lang.Number getIcmpType() {
            return this.icmpType;
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

            data.set("networkAclId", om.valueToTree(this.getNetworkAclId()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("ruleAction", om.valueToTree(this.getRuleAction()));
            data.set("ruleNumber", om.valueToTree(this.getRuleNumber()));
            if (this.getCidrBlock() != null) {
                data.set("cidrBlock", om.valueToTree(this.getCidrBlock()));
            }
            if (this.getEgress() != null) {
                data.set("egress", om.valueToTree(this.getEgress()));
            }
            if (this.getFromPort() != null) {
                data.set("fromPort", om.valueToTree(this.getFromPort()));
            }
            if (this.getIcmpCode() != null) {
                data.set("icmpCode", om.valueToTree(this.getIcmpCode()));
            }
            if (this.getIcmpType() != null) {
                data.set("icmpType", om.valueToTree(this.getIcmpType()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpv6CidrBlock() != null) {
                data.set("ipv6CidrBlock", om.valueToTree(this.getIpv6CidrBlock()));
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
            struct.set("fqn", om.valueToTree("aws.networkAclRule.NetworkAclRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            NetworkAclRuleConfig.Jsii$Proxy that = (NetworkAclRuleConfig.Jsii$Proxy) o;

            if (!networkAclId.equals(that.networkAclId)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!ruleAction.equals(that.ruleAction)) return false;
            if (!ruleNumber.equals(that.ruleNumber)) return false;
            if (this.cidrBlock != null ? !this.cidrBlock.equals(that.cidrBlock) : that.cidrBlock != null) return false;
            if (this.egress != null ? !this.egress.equals(that.egress) : that.egress != null) return false;
            if (this.fromPort != null ? !this.fromPort.equals(that.fromPort) : that.fromPort != null) return false;
            if (this.icmpCode != null ? !this.icmpCode.equals(that.icmpCode) : that.icmpCode != null) return false;
            if (this.icmpType != null ? !this.icmpType.equals(that.icmpType) : that.icmpType != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipv6CidrBlock != null ? !this.ipv6CidrBlock.equals(that.ipv6CidrBlock) : that.ipv6CidrBlock != null) return false;
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
            int result = this.networkAclId.hashCode();
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.ruleAction.hashCode());
            result = 31 * result + (this.ruleNumber.hashCode());
            result = 31 * result + (this.cidrBlock != null ? this.cidrBlock.hashCode() : 0);
            result = 31 * result + (this.egress != null ? this.egress.hashCode() : 0);
            result = 31 * result + (this.fromPort != null ? this.fromPort.hashCode() : 0);
            result = 31 * result + (this.icmpCode != null ? this.icmpCode.hashCode() : 0);
            result = 31 * result + (this.icmpType != null ? this.icmpType.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlock != null ? this.ipv6CidrBlock.hashCode() : 0);
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
