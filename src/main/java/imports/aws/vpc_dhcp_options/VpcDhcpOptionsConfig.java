package imports.aws.vpc_dhcp_options;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.590Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpcDhcpOptions.VpcDhcpOptionsConfig")
@software.amazon.jsii.Jsii.Proxy(VpcDhcpOptionsConfig.Jsii$Proxy.class)
public interface VpcDhcpOptionsConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#domain_name VpcDhcpOptions#domain_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomainName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#domain_name_servers VpcDhcpOptions#domain_name_servers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getDomainNameServers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#id VpcDhcpOptions#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#ipv6_address_preferred_lease_time VpcDhcpOptions#ipv6_address_preferred_lease_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIpv6AddressPreferredLeaseTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#netbios_name_servers VpcDhcpOptions#netbios_name_servers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNetbiosNameServers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#netbios_node_type VpcDhcpOptions#netbios_node_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getNetbiosNodeType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#ntp_servers VpcDhcpOptions#ntp_servers}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNtpServers() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#tags VpcDhcpOptions#tags}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTags() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#tags_all VpcDhcpOptions#tags_all}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getTagsAll() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpcDhcpOptionsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpcDhcpOptionsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpcDhcpOptionsConfig> {
        java.lang.String domainName;
        java.util.List<java.lang.String> domainNameServers;
        java.lang.String id;
        java.lang.String ipv6AddressPreferredLeaseTime;
        java.util.List<java.lang.String> netbiosNameServers;
        java.lang.String netbiosNodeType;
        java.util.List<java.lang.String> ntpServers;
        java.util.Map<java.lang.String, java.lang.String> tags;
        java.util.Map<java.lang.String, java.lang.String> tagsAll;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getDomainName}
         * @param domainName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#domain_name VpcDhcpOptions#domain_name}.
         * @return {@code this}
         */
        public Builder domainName(java.lang.String domainName) {
            this.domainName = domainName;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getDomainNameServers}
         * @param domainNameServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#domain_name_servers VpcDhcpOptions#domain_name_servers}.
         * @return {@code this}
         */
        public Builder domainNameServers(java.util.List<java.lang.String> domainNameServers) {
            this.domainNameServers = domainNameServers;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#id VpcDhcpOptions#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getIpv6AddressPreferredLeaseTime}
         * @param ipv6AddressPreferredLeaseTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#ipv6_address_preferred_lease_time VpcDhcpOptions#ipv6_address_preferred_lease_time}.
         * @return {@code this}
         */
        public Builder ipv6AddressPreferredLeaseTime(java.lang.String ipv6AddressPreferredLeaseTime) {
            this.ipv6AddressPreferredLeaseTime = ipv6AddressPreferredLeaseTime;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getNetbiosNameServers}
         * @param netbiosNameServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#netbios_name_servers VpcDhcpOptions#netbios_name_servers}.
         * @return {@code this}
         */
        public Builder netbiosNameServers(java.util.List<java.lang.String> netbiosNameServers) {
            this.netbiosNameServers = netbiosNameServers;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getNetbiosNodeType}
         * @param netbiosNodeType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#netbios_node_type VpcDhcpOptions#netbios_node_type}.
         * @return {@code this}
         */
        public Builder netbiosNodeType(java.lang.String netbiosNodeType) {
            this.netbiosNodeType = netbiosNodeType;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getNtpServers}
         * @param ntpServers Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#ntp_servers VpcDhcpOptions#ntp_servers}.
         * @return {@code this}
         */
        public Builder ntpServers(java.util.List<java.lang.String> ntpServers) {
            this.ntpServers = ntpServers;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getTags}
         * @param tags Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#tags VpcDhcpOptions#tags}.
         * @return {@code this}
         */
        public Builder tags(java.util.Map<java.lang.String, java.lang.String> tags) {
            this.tags = tags;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getTagsAll}
         * @param tagsAll Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpc_dhcp_options#tags_all VpcDhcpOptions#tags_all}.
         * @return {@code this}
         */
        public Builder tagsAll(java.util.Map<java.lang.String, java.lang.String> tagsAll) {
            this.tagsAll = tagsAll;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getDependsOn}
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
         * Sets the value of {@link VpcDhcpOptionsConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link VpcDhcpOptionsConfig#getProvisioners}
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
         * @return a new instance of {@link VpcDhcpOptionsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpcDhcpOptionsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpcDhcpOptionsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpcDhcpOptionsConfig {
        private final java.lang.String domainName;
        private final java.util.List<java.lang.String> domainNameServers;
        private final java.lang.String id;
        private final java.lang.String ipv6AddressPreferredLeaseTime;
        private final java.util.List<java.lang.String> netbiosNameServers;
        private final java.lang.String netbiosNodeType;
        private final java.util.List<java.lang.String> ntpServers;
        private final java.util.Map<java.lang.String, java.lang.String> tags;
        private final java.util.Map<java.lang.String, java.lang.String> tagsAll;
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
            this.domainName = software.amazon.jsii.Kernel.get(this, "domainName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domainNameServers = software.amazon.jsii.Kernel.get(this, "domainNameServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ipv6AddressPreferredLeaseTime = software.amazon.jsii.Kernel.get(this, "ipv6AddressPreferredLeaseTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.netbiosNameServers = software.amazon.jsii.Kernel.get(this, "netbiosNameServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.netbiosNodeType = software.amazon.jsii.Kernel.get(this, "netbiosNodeType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.ntpServers = software.amazon.jsii.Kernel.get(this, "ntpServers", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tags = software.amazon.jsii.Kernel.get(this, "tags", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.tagsAll = software.amazon.jsii.Kernel.get(this, "tagsAll", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
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
            this.domainName = builder.domainName;
            this.domainNameServers = builder.domainNameServers;
            this.id = builder.id;
            this.ipv6AddressPreferredLeaseTime = builder.ipv6AddressPreferredLeaseTime;
            this.netbiosNameServers = builder.netbiosNameServers;
            this.netbiosNodeType = builder.netbiosNodeType;
            this.ntpServers = builder.ntpServers;
            this.tags = builder.tags;
            this.tagsAll = builder.tagsAll;
            this.connection = builder.connection;
            this.count = builder.count;
            this.dependsOn = (java.util.List<com.hashicorp.cdktf.ITerraformDependable>)builder.dependsOn;
            this.forEach = builder.forEach;
            this.lifecycle = builder.lifecycle;
            this.provider = builder.provider;
            this.provisioners = (java.util.List<java.lang.Object>)builder.provisioners;
        }

        @Override
        public final java.lang.String getDomainName() {
            return this.domainName;
        }

        @Override
        public final java.util.List<java.lang.String> getDomainNameServers() {
            return this.domainNameServers;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final java.lang.String getIpv6AddressPreferredLeaseTime() {
            return this.ipv6AddressPreferredLeaseTime;
        }

        @Override
        public final java.util.List<java.lang.String> getNetbiosNameServers() {
            return this.netbiosNameServers;
        }

        @Override
        public final java.lang.String getNetbiosNodeType() {
            return this.netbiosNodeType;
        }

        @Override
        public final java.util.List<java.lang.String> getNtpServers() {
            return this.ntpServers;
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

            if (this.getDomainName() != null) {
                data.set("domainName", om.valueToTree(this.getDomainName()));
            }
            if (this.getDomainNameServers() != null) {
                data.set("domainNameServers", om.valueToTree(this.getDomainNameServers()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
            }
            if (this.getIpv6AddressPreferredLeaseTime() != null) {
                data.set("ipv6AddressPreferredLeaseTime", om.valueToTree(this.getIpv6AddressPreferredLeaseTime()));
            }
            if (this.getNetbiosNameServers() != null) {
                data.set("netbiosNameServers", om.valueToTree(this.getNetbiosNameServers()));
            }
            if (this.getNetbiosNodeType() != null) {
                data.set("netbiosNodeType", om.valueToTree(this.getNetbiosNodeType()));
            }
            if (this.getNtpServers() != null) {
                data.set("ntpServers", om.valueToTree(this.getNtpServers()));
            }
            if (this.getTags() != null) {
                data.set("tags", om.valueToTree(this.getTags()));
            }
            if (this.getTagsAll() != null) {
                data.set("tagsAll", om.valueToTree(this.getTagsAll()));
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
            struct.set("fqn", om.valueToTree("aws.vpcDhcpOptions.VpcDhcpOptionsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpcDhcpOptionsConfig.Jsii$Proxy that = (VpcDhcpOptionsConfig.Jsii$Proxy) o;

            if (this.domainName != null ? !this.domainName.equals(that.domainName) : that.domainName != null) return false;
            if (this.domainNameServers != null ? !this.domainNameServers.equals(that.domainNameServers) : that.domainNameServers != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
            if (this.ipv6AddressPreferredLeaseTime != null ? !this.ipv6AddressPreferredLeaseTime.equals(that.ipv6AddressPreferredLeaseTime) : that.ipv6AddressPreferredLeaseTime != null) return false;
            if (this.netbiosNameServers != null ? !this.netbiosNameServers.equals(that.netbiosNameServers) : that.netbiosNameServers != null) return false;
            if (this.netbiosNodeType != null ? !this.netbiosNodeType.equals(that.netbiosNodeType) : that.netbiosNodeType != null) return false;
            if (this.ntpServers != null ? !this.ntpServers.equals(that.ntpServers) : that.ntpServers != null) return false;
            if (this.tags != null ? !this.tags.equals(that.tags) : that.tags != null) return false;
            if (this.tagsAll != null ? !this.tagsAll.equals(that.tagsAll) : that.tagsAll != null) return false;
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
            int result = this.domainName != null ? this.domainName.hashCode() : 0;
            result = 31 * result + (this.domainNameServers != null ? this.domainNameServers.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
            result = 31 * result + (this.ipv6AddressPreferredLeaseTime != null ? this.ipv6AddressPreferredLeaseTime.hashCode() : 0);
            result = 31 * result + (this.netbiosNameServers != null ? this.netbiosNameServers.hashCode() : 0);
            result = 31 * result + (this.netbiosNodeType != null ? this.netbiosNodeType.hashCode() : 0);
            result = 31 * result + (this.ntpServers != null ? this.ntpServers.hashCode() : 0);
            result = 31 * result + (this.tags != null ? this.tags.hashCode() : 0);
            result = 31 * result + (this.tagsAll != null ? this.tagsAll.hashCode() : 0);
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
