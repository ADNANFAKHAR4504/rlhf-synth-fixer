package imports.aws.security_group_rule;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.369Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.securityGroupRule.SecurityGroupRuleConfig")
@software.amazon.jsii.Jsii.Proxy(SecurityGroupRuleConfig.Jsii$Proxy.class)
public interface SecurityGroupRuleConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#from_port SecurityGroupRule#from_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getFromPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#protocol SecurityGroupRule#protocol}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getProtocol();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#security_group_id SecurityGroupRule#security_group_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSecurityGroupId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#to_port SecurityGroupRule#to_port}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getToPort();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#type SecurityGroupRule#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#cidr_blocks SecurityGroupRule#cidr_blocks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getCidrBlocks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#description SecurityGroupRule#description}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDescription() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#id SecurityGroupRule#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#ipv6_cidr_blocks SecurityGroupRule#ipv6_cidr_blocks}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getIpv6CidrBlocks() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#prefix_list_ids SecurityGroupRule#prefix_list_ids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getPrefixListIds() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#self SecurityGroupRule#self}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSelfAttribute() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#source_security_group_id SecurityGroupRule#source_security_group_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getSourceSecurityGroupId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#timeouts SecurityGroupRule#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.security_group_rule.SecurityGroupRuleTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SecurityGroupRuleConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SecurityGroupRuleConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SecurityGroupRuleConfig> {
        java.lang.Number fromPort;
        java.lang.String protocol;
        java.lang.String securityGroupId;
        java.lang.Number toPort;
        java.lang.String type;
        java.util.List<java.lang.String> cidrBlocks;
        java.lang.String description;
        java.lang.String id;
        java.util.List<java.lang.String> ipv6CidrBlocks;
        java.util.List<java.lang.String> prefixListIds;
        java.lang.Object selfAttribute;
        java.lang.String sourceSecurityGroupId;
        imports.aws.security_group_rule.SecurityGroupRuleTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getFromPort}
         * @param fromPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#from_port SecurityGroupRule#from_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder fromPort(java.lang.Number fromPort) {
            this.fromPort = fromPort;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getProtocol}
         * @param protocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#protocol SecurityGroupRule#protocol}. This parameter is required.
         * @return {@code this}
         */
        public Builder protocol(java.lang.String protocol) {
            this.protocol = protocol;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getSecurityGroupId}
         * @param securityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#security_group_id SecurityGroupRule#security_group_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder securityGroupId(java.lang.String securityGroupId) {
            this.securityGroupId = securityGroupId;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getToPort}
         * @param toPort Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#to_port SecurityGroupRule#to_port}. This parameter is required.
         * @return {@code this}
         */
        public Builder toPort(java.lang.Number toPort) {
            this.toPort = toPort;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#type SecurityGroupRule#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getCidrBlocks}
         * @param cidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#cidr_blocks SecurityGroupRule#cidr_blocks}.
         * @return {@code this}
         */
        public Builder cidrBlocks(java.util.List<java.lang.String> cidrBlocks) {
            this.cidrBlocks = cidrBlocks;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getDescription}
         * @param description Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#description SecurityGroupRule#description}.
         * @return {@code this}
         */
        public Builder description(java.lang.String description) {
            this.description = description;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#id SecurityGroupRule#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getIpv6CidrBlocks}
         * @param ipv6CidrBlocks Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#ipv6_cidr_blocks SecurityGroupRule#ipv6_cidr_blocks}.
         * @return {@code this}
         */
        public Builder ipv6CidrBlocks(java.util.List<java.lang.String> ipv6CidrBlocks) {
            this.ipv6CidrBlocks = ipv6CidrBlocks;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getPrefixListIds}
         * @param prefixListIds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#prefix_list_ids SecurityGroupRule#prefix_list_ids}.
         * @return {@code this}
         */
        public Builder prefixListIds(java.util.List<java.lang.String> prefixListIds) {
            this.prefixListIds = prefixListIds;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getSelfAttribute}
         * @param selfAttribute Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#self SecurityGroupRule#self}.
         * @return {@code this}
         */
        public Builder selfAttribute(java.lang.Boolean selfAttribute) {
            this.selfAttribute = selfAttribute;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getSelfAttribute}
         * @param selfAttribute Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#self SecurityGroupRule#self}.
         * @return {@code this}
         */
        public Builder selfAttribute(com.hashicorp.cdktf.IResolvable selfAttribute) {
            this.selfAttribute = selfAttribute;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getSourceSecurityGroupId}
         * @param sourceSecurityGroupId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#source_security_group_id SecurityGroupRule#source_security_group_id}.
         * @return {@code this}
         */
        public Builder sourceSecurityGroupId(java.lang.String sourceSecurityGroupId) {
            this.sourceSecurityGroupId = sourceSecurityGroupId;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/security_group_rule#timeouts SecurityGroupRule#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.security_group_rule.SecurityGroupRuleTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getDependsOn}
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
         * Sets the value of {@link SecurityGroupRuleConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link SecurityGroupRuleConfig#getProvisioners}
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
         * @return a new instance of {@link SecurityGroupRuleConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SecurityGroupRuleConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SecurityGroupRuleConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SecurityGroupRuleConfig {
        private final java.lang.Number fromPort;
        private final java.lang.String protocol;
        private final java.lang.String securityGroupId;
        private final java.lang.Number toPort;
        private final java.lang.String type;
        private final java.util.List<java.lang.String> cidrBlocks;
        private final java.lang.String description;
        private final java.lang.String id;
        private final java.util.List<java.lang.String> ipv6CidrBlocks;
        private final java.util.List<java.lang.String> prefixListIds;
        private final java.lang.Object selfAttribute;
        private final java.lang.String sourceSecurityGroupId;
        private final imports.aws.security_group_rule.SecurityGroupRuleTimeouts timeouts;
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
            this.fromPort = software.amazon.jsii.Kernel.get(this, "fromPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.protocol = software.amazon.jsii.Kernel.get(this, "protocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.securityGroupId = software.amazon.jsii.Kernel.get(this, "securityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.toPort = software.amazon.jsii.Kernel.get(this, "toPort", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.cidrBlocks = software.amazon.jsii.Kernel.get(this, "cidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.description = software.amazon.jsii.Kernel.get(this, "description", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6CidrBlocks = software.amazon.jsii.Kernel.get(this, "ipv6CidrBlocks", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.prefixListIds = software.amazon.jsii.Kernel.get(this, "prefixListIds", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.selfAttribute = software.amazon.jsii.Kernel.get(this, "selfAttribute", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.sourceSecurityGroupId = software.amazon.jsii.Kernel.get(this, "sourceSecurityGroupId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.security_group_rule.SecurityGroupRuleTimeouts.class));
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
            this.fromPort = java.util.Objects.requireNonNull(builder.fromPort, "fromPort is required");
            this.protocol = java.util.Objects.requireNonNull(builder.protocol, "protocol is required");
            this.securityGroupId = java.util.Objects.requireNonNull(builder.securityGroupId, "securityGroupId is required");
            this.toPort = java.util.Objects.requireNonNull(builder.toPort, "toPort is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
            this.cidrBlocks = builder.cidrBlocks;
            this.description = builder.description;
            this.id = builder.id;
            this.ipv6CidrBlocks = builder.ipv6CidrBlocks;
            this.prefixListIds = builder.prefixListIds;
            this.selfAttribute = builder.selfAttribute;
            this.sourceSecurityGroupId = builder.sourceSecurityGroupId;
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
        public final java.lang.Number getFromPort() {
            return this.fromPort;
        }

        @Override
        public final java.lang.String getProtocol() {
            return this.protocol;
        }

        @Override
        public final java.lang.String getSecurityGroupId() {
            return this.securityGroupId;
        }

        @Override
        public final java.lang.Number getToPort() {
            return this.toPort;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        public final java.util.List<java.lang.String> getCidrBlocks() {
            return this.cidrBlocks;
        }

        @Override
        public final java.lang.String getDescription() {
            return this.description;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.util.List<java.lang.String> getIpv6CidrBlocks() {
            return this.ipv6CidrBlocks;
        }

        @Override
        public final java.util.List<java.lang.String> getPrefixListIds() {
            return this.prefixListIds;
        }

        @Override
        public final java.lang.Object getSelfAttribute() {
            return this.selfAttribute;
        }

        @Override
        public final java.lang.String getSourceSecurityGroupId() {
            return this.sourceSecurityGroupId;
        }

        @Override
        public final imports.aws.security_group_rule.SecurityGroupRuleTimeouts getTimeouts() {
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

            data.set("fromPort", om.valueToTree(this.getFromPort()));
            data.set("protocol", om.valueToTree(this.getProtocol()));
            data.set("securityGroupId", om.valueToTree(this.getSecurityGroupId()));
            data.set("toPort", om.valueToTree(this.getToPort()));
            data.set("type", om.valueToTree(this.getType()));
            if (this.getCidrBlocks() != null) {
                data.set("cidrBlocks", om.valueToTree(this.getCidrBlocks()));
            }
            if (this.getDescription() != null) {
                data.set("description", om.valueToTree(this.getDescription()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpv6CidrBlocks() != null) {
                data.set("ipv6CidrBlocks", om.valueToTree(this.getIpv6CidrBlocks()));
            }
            if (this.getPrefixListIds() != null) {
                data.set("prefixListIds", om.valueToTree(this.getPrefixListIds()));
            }
            if (this.getSelfAttribute() != null) {
                data.set("selfAttribute", om.valueToTree(this.getSelfAttribute()));
            }
            if (this.getSourceSecurityGroupId() != null) {
                data.set("sourceSecurityGroupId", om.valueToTree(this.getSourceSecurityGroupId()));
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
            struct.set("fqn", om.valueToTree("aws.securityGroupRule.SecurityGroupRuleConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SecurityGroupRuleConfig.Jsii$Proxy that = (SecurityGroupRuleConfig.Jsii$Proxy) o;

            if (!fromPort.equals(that.fromPort)) return false;
            if (!protocol.equals(that.protocol)) return false;
            if (!securityGroupId.equals(that.securityGroupId)) return false;
            if (!toPort.equals(that.toPort)) return false;
            if (!type.equals(that.type)) return false;
            if (this.cidrBlocks != null ? !this.cidrBlocks.equals(that.cidrBlocks) : that.cidrBlocks != null) return false;
            if (this.description != null ? !this.description.equals(that.description) : that.description != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipv6CidrBlocks != null ? !this.ipv6CidrBlocks.equals(that.ipv6CidrBlocks) : that.ipv6CidrBlocks != null) return false;
            if (this.prefixListIds != null ? !this.prefixListIds.equals(that.prefixListIds) : that.prefixListIds != null) return false;
            if (this.selfAttribute != null ? !this.selfAttribute.equals(that.selfAttribute) : that.selfAttribute != null) return false;
            if (this.sourceSecurityGroupId != null ? !this.sourceSecurityGroupId.equals(that.sourceSecurityGroupId) : that.sourceSecurityGroupId != null) return false;
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
            int result = this.fromPort.hashCode();
            result = 31 * result + (this.protocol.hashCode());
            result = 31 * result + (this.securityGroupId.hashCode());
            result = 31 * result + (this.toPort.hashCode());
            result = 31 * result + (this.type.hashCode());
            result = 31 * result + (this.cidrBlocks != null ? this.cidrBlocks.hashCode() : 0);
            result = 31 * result + (this.description != null ? this.description.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipv6CidrBlocks != null ? this.ipv6CidrBlocks.hashCode() : 0);
            result = 31 * result + (this.prefixListIds != null ? this.prefixListIds.hashCode() : 0);
            result = 31 * result + (this.selfAttribute != null ? this.selfAttribute.hashCode() : 0);
            result = 31 * result + (this.sourceSecurityGroupId != null ? this.sourceSecurityGroupId.hashCode() : 0);
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
