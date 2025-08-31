package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification.Jsii$Proxy.class)
public interface LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_udp_enabled LaunchTemplate#ena_srd_udp_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnaSrdUdpEnabled() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification> {
        java.lang.Object enaSrdUdpEnabled;

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification#getEnaSrdUdpEnabled}
         * @param enaSrdUdpEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_udp_enabled LaunchTemplate#ena_srd_udp_enabled}.
         * @return {@code this}
         */
        public Builder enaSrdUdpEnabled(java.lang.Boolean enaSrdUdpEnabled) {
            this.enaSrdUdpEnabled = enaSrdUdpEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification#getEnaSrdUdpEnabled}
         * @param enaSrdUdpEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_udp_enabled LaunchTemplate#ena_srd_udp_enabled}.
         * @return {@code this}
         */
        public Builder enaSrdUdpEnabled(com.hashicorp.cdktf.IResolvable enaSrdUdpEnabled) {
            this.enaSrdUdpEnabled = enaSrdUdpEnabled;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification {
        private final java.lang.Object enaSrdUdpEnabled;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enaSrdUdpEnabled = software.amazon.jsii.Kernel.get(this, "enaSrdUdpEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enaSrdUdpEnabled = builder.enaSrdUdpEnabled;
        }

        @Override
        public final java.lang.Object getEnaSrdUdpEnabled() {
            return this.enaSrdUdpEnabled;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnaSrdUdpEnabled() != null) {
                data.set("enaSrdUdpEnabled", om.valueToTree(this.getEnaSrdUdpEnabled()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification.Jsii$Proxy that = (LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification.Jsii$Proxy) o;

            return this.enaSrdUdpEnabled != null ? this.enaSrdUdpEnabled.equals(that.enaSrdUdpEnabled) : that.enaSrdUdpEnabled == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enaSrdUdpEnabled != null ? this.enaSrdUdpEnabled.hashCode() : 0;
            return result;
        }
    }
}
