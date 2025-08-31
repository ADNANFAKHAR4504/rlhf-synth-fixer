package imports.aws.globalaccelerator_custom_routing_endpoint_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.274Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.globalacceleratorCustomRoutingEndpointGroup.GlobalacceleratorCustomRoutingEndpointGroupConfig")
@software.amazon.jsii.Jsii.Proxy(GlobalacceleratorCustomRoutingEndpointGroupConfig.Jsii$Proxy.class)
public interface GlobalacceleratorCustomRoutingEndpointGroupConfig extends software.amazon.jsii.JsiiSerializable, com.hashicorp.cdktf.TerraformMetaArguments {

    /**
     * destination_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#destination_configuration GlobalacceleratorCustomRoutingEndpointGroup#destination_configuration}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getDestinationConfiguration();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#listener_arn GlobalacceleratorCustomRoutingEndpointGroup#listener_arn}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getListenerArn();

    /**
     * endpoint_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#endpoint_configuration GlobalacceleratorCustomRoutingEndpointGroup#endpoint_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEndpointConfiguration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#endpoint_group_region GlobalacceleratorCustomRoutingEndpointGroup#endpoint_group_region}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEndpointGroupRegion() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#id GlobalacceleratorCustomRoutingEndpointGroup#id}.
     * <p>
     * Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
     * If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getId() {
        return null;
    }

    /**
     * timeouts block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#timeouts GlobalacceleratorCustomRoutingEndpointGroup#timeouts}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupTimeouts getTimeouts() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link GlobalacceleratorCustomRoutingEndpointGroupConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<GlobalacceleratorCustomRoutingEndpointGroupConfig> {
        java.lang.Object destinationConfiguration;
        java.lang.String listenerArn;
        java.lang.Object endpointConfiguration;
        java.lang.String endpointGroupRegion;
        java.lang.String id;
        imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupTimeouts timeouts;
        java.lang.Object connection;
        java.lang.Object count;
        java.util.List<com.hashicorp.cdktf.ITerraformDependable> dependsOn;
        com.hashicorp.cdktf.ITerraformIterator forEach;
        com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle;
        com.hashicorp.cdktf.TerraformProvider provider;
        java.util.List<java.lang.Object> provisioners;

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getDestinationConfiguration}
         * @param destinationConfiguration destination_configuration block. This parameter is required.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#destination_configuration GlobalacceleratorCustomRoutingEndpointGroup#destination_configuration}
         * @return {@code this}
         */
        public Builder destinationConfiguration(com.hashicorp.cdktf.IResolvable destinationConfiguration) {
            this.destinationConfiguration = destinationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getDestinationConfiguration}
         * @param destinationConfiguration destination_configuration block. This parameter is required.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#destination_configuration GlobalacceleratorCustomRoutingEndpointGroup#destination_configuration}
         * @return {@code this}
         */
        public Builder destinationConfiguration(java.util.List<? extends imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupDestinationConfiguration> destinationConfiguration) {
            this.destinationConfiguration = destinationConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getListenerArn}
         * @param listenerArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#listener_arn GlobalacceleratorCustomRoutingEndpointGroup#listener_arn}. This parameter is required.
         * @return {@code this}
         */
        public Builder listenerArn(java.lang.String listenerArn) {
            this.listenerArn = listenerArn;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getEndpointConfiguration}
         * @param endpointConfiguration endpoint_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#endpoint_configuration GlobalacceleratorCustomRoutingEndpointGroup#endpoint_configuration}
         * @return {@code this}
         */
        public Builder endpointConfiguration(com.hashicorp.cdktf.IResolvable endpointConfiguration) {
            this.endpointConfiguration = endpointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getEndpointConfiguration}
         * @param endpointConfiguration endpoint_configuration block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#endpoint_configuration GlobalacceleratorCustomRoutingEndpointGroup#endpoint_configuration}
         * @return {@code this}
         */
        public Builder endpointConfiguration(java.util.List<? extends imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupEndpointConfiguration> endpointConfiguration) {
            this.endpointConfiguration = endpointConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getEndpointGroupRegion}
         * @param endpointGroupRegion Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#endpoint_group_region GlobalacceleratorCustomRoutingEndpointGroup#endpoint_group_region}.
         * @return {@code this}
         */
        public Builder endpointGroupRegion(java.lang.String endpointGroupRegion) {
            this.endpointGroupRegion = endpointGroupRegion;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getId}
         * @param id Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#id GlobalacceleratorCustomRoutingEndpointGroup#id}.
         *           Please be aware that the id field is automatically added to all resources in Terraform providers using a Terraform provider SDK version below 2.
         *           If you experience problems setting this value it might not be settable. Please take a look at the provider documentation to ensure it should be settable.
         * @return {@code this}
         */
        public Builder id(java.lang.String id) {
            this.id = id;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getTimeouts}
         * @param timeouts timeouts block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/globalaccelerator_custom_routing_endpoint_group#timeouts GlobalacceleratorCustomRoutingEndpointGroup#timeouts}
         * @return {@code this}
         */
        public Builder timeouts(imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupTimeouts timeouts) {
            this.timeouts = timeouts;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.SSHProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getConnection}
         * @param connection the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder connection(com.hashicorp.cdktf.WinrmProvisionerConnection connection) {
            this.connection = connection;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(java.lang.Number count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getCount}
         * @param count the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder count(com.hashicorp.cdktf.TerraformCount count) {
            this.count = count;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getDependsOn}
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
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getForEach}
         * @param forEach the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder forEach(com.hashicorp.cdktf.ITerraformIterator forEach) {
            this.forEach = forEach;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getLifecycle}
         * @param lifecycle the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder lifecycle(com.hashicorp.cdktf.TerraformResourceLifecycle lifecycle) {
            this.lifecycle = lifecycle;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getProvider}
         * @param provider the value to be set.
         * @return {@code this}
         */
        @software.amazon.jsii.Stability(software.amazon.jsii.Stability.Level.Experimental)
        public Builder provider(com.hashicorp.cdktf.TerraformProvider provider) {
            this.provider = provider;
            return this;
        }

        /**
         * Sets the value of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig#getProvisioners}
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
         * @return a new instance of {@link GlobalacceleratorCustomRoutingEndpointGroupConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public GlobalacceleratorCustomRoutingEndpointGroupConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link GlobalacceleratorCustomRoutingEndpointGroupConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements GlobalacceleratorCustomRoutingEndpointGroupConfig {
        private final java.lang.Object destinationConfiguration;
        private final java.lang.String listenerArn;
        private final java.lang.Object endpointConfiguration;
        private final java.lang.String endpointGroupRegion;
        private final java.lang.String id;
        private final imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupTimeouts timeouts;
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
            this.destinationConfiguration = software.amazon.jsii.Kernel.get(this, "destinationConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.listenerArn = software.amazon.jsii.Kernel.get(this, "listenerArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.endpointConfiguration = software.amazon.jsii.Kernel.get(this, "endpointConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.endpointGroupRegion = software.amazon.jsii.Kernel.get(this, "endpointGroupRegion", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.id = software.amazon.jsii.Kernel.get(this, "id", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeouts = software.amazon.jsii.Kernel.get(this, "timeouts", software.amazon.jsii.NativeType.forClass(imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupTimeouts.class));
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
            this.destinationConfiguration = java.util.Objects.requireNonNull(builder.destinationConfiguration, "destinationConfiguration is required");
            this.listenerArn = java.util.Objects.requireNonNull(builder.listenerArn, "listenerArn is required");
            this.endpointConfiguration = builder.endpointConfiguration;
            this.endpointGroupRegion = builder.endpointGroupRegion;
            this.id = builder.id;
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
        public final java.lang.Object getDestinationConfiguration() {
            return this.destinationConfiguration;
        }

        @Override
        public final java.lang.String getListenerArn() {
            return this.listenerArn;
        }

        @Override
        public final java.lang.Object getEndpointConfiguration() {
            return this.endpointConfiguration;
        }

        @Override
        public final java.lang.String getEndpointGroupRegion() {
            return this.endpointGroupRegion;
        }

        @Override
        public final java.lang.String getId() {
            return this.id;
        }

        @Override
        public final imports.aws.globalaccelerator_custom_routing_endpoint_group.GlobalacceleratorCustomRoutingEndpointGroupTimeouts getTimeouts() {
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

            data.set("destinationConfiguration", om.valueToTree(this.getDestinationConfiguration()));
            data.set("listenerArn", om.valueToTree(this.getListenerArn()));
            if (this.getEndpointConfiguration() != null) {
                data.set("endpointConfiguration", om.valueToTree(this.getEndpointConfiguration()));
            }
            if (this.getEndpointGroupRegion() != null) {
                data.set("endpointGroupRegion", om.valueToTree(this.getEndpointGroupRegion()));
            }
            if (this.getId() != null) {
                data.set("id", om.valueToTree(this.getId()));
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
            struct.set("fqn", om.valueToTree("aws.globalacceleratorCustomRoutingEndpointGroup.GlobalacceleratorCustomRoutingEndpointGroupConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            GlobalacceleratorCustomRoutingEndpointGroupConfig.Jsii$Proxy that = (GlobalacceleratorCustomRoutingEndpointGroupConfig.Jsii$Proxy) o;

            if (!destinationConfiguration.equals(that.destinationConfiguration)) return false;
            if (!listenerArn.equals(that.listenerArn)) return false;
            if (this.endpointConfiguration != null ? !this.endpointConfiguration.equals(that.endpointConfiguration) : that.endpointConfiguration != null) return false;
            if (this.endpointGroupRegion != null ? !this.endpointGroupRegion.equals(that.endpointGroupRegion) : that.endpointGroupRegion != null) return false;
            if (this.id != null ? !this.id.equals(that.id) : that.id != null) return false;
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
            int result = this.destinationConfiguration.hashCode();
            result = 31 * result + (this.listenerArn.hashCode());
            result = 31 * result + (this.endpointConfiguration != null ? this.endpointConfiguration.hashCode() : 0);
            result = 31 * result + (this.endpointGroupRegion != null ? this.endpointGroupRegion.hashCode() : 0);
            result = 31 * result + (this.id != null ? this.id.hashCode() : 0);
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
