package imports.aws.launch_template;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.522Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.launchTemplate.LaunchTemplateNetworkInterfacesEnaSrdSpecification")
@software.amazon.jsii.Jsii.Proxy(LaunchTemplateNetworkInterfacesEnaSrdSpecification.Jsii$Proxy.class)
public interface LaunchTemplateNetworkInterfacesEnaSrdSpecification extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_enabled LaunchTemplate#ena_srd_enabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEnaSrdEnabled() {
        return null;
    }

    /**
     * ena_srd_udp_specification block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_udp_specification LaunchTemplate#ena_srd_udp_specification}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification getEnaSrdUdpSpecification() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecification}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LaunchTemplateNetworkInterfacesEnaSrdSpecification}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LaunchTemplateNetworkInterfacesEnaSrdSpecification> {
        java.lang.Object enaSrdEnabled;
        imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification enaSrdUdpSpecification;

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecification#getEnaSrdEnabled}
         * @param enaSrdEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_enabled LaunchTemplate#ena_srd_enabled}.
         * @return {@code this}
         */
        public Builder enaSrdEnabled(java.lang.Boolean enaSrdEnabled) {
            this.enaSrdEnabled = enaSrdEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecification#getEnaSrdEnabled}
         * @param enaSrdEnabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_enabled LaunchTemplate#ena_srd_enabled}.
         * @return {@code this}
         */
        public Builder enaSrdEnabled(com.hashicorp.cdktf.IResolvable enaSrdEnabled) {
            this.enaSrdEnabled = enaSrdEnabled;
            return this;
        }

        /**
         * Sets the value of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecification#getEnaSrdUdpSpecification}
         * @param enaSrdUdpSpecification ena_srd_udp_specification block.
         *                               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/launch_template#ena_srd_udp_specification LaunchTemplate#ena_srd_udp_specification}
         * @return {@code this}
         */
        public Builder enaSrdUdpSpecification(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification enaSrdUdpSpecification) {
            this.enaSrdUdpSpecification = enaSrdUdpSpecification;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LaunchTemplateNetworkInterfacesEnaSrdSpecification}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LaunchTemplateNetworkInterfacesEnaSrdSpecification build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LaunchTemplateNetworkInterfacesEnaSrdSpecification}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LaunchTemplateNetworkInterfacesEnaSrdSpecification {
        private final java.lang.Object enaSrdEnabled;
        private final imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification enaSrdUdpSpecification;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.enaSrdEnabled = software.amazon.jsii.Kernel.get(this, "enaSrdEnabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.enaSrdUdpSpecification = software.amazon.jsii.Kernel.get(this, "enaSrdUdpSpecification", software.amazon.jsii.NativeType.forClass(imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.enaSrdEnabled = builder.enaSrdEnabled;
            this.enaSrdUdpSpecification = builder.enaSrdUdpSpecification;
        }

        @Override
        public final java.lang.Object getEnaSrdEnabled() {
            return this.enaSrdEnabled;
        }

        @Override
        public final imports.aws.launch_template.LaunchTemplateNetworkInterfacesEnaSrdSpecificationEnaSrdUdpSpecification getEnaSrdUdpSpecification() {
            return this.enaSrdUdpSpecification;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEnaSrdEnabled() != null) {
                data.set("enaSrdEnabled", om.valueToTree(this.getEnaSrdEnabled()));
            }
            if (this.getEnaSrdUdpSpecification() != null) {
                data.set("enaSrdUdpSpecification", om.valueToTree(this.getEnaSrdUdpSpecification()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.launchTemplate.LaunchTemplateNetworkInterfacesEnaSrdSpecification"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LaunchTemplateNetworkInterfacesEnaSrdSpecification.Jsii$Proxy that = (LaunchTemplateNetworkInterfacesEnaSrdSpecification.Jsii$Proxy) o;

            if (this.enaSrdEnabled != null ? !this.enaSrdEnabled.equals(that.enaSrdEnabled) : that.enaSrdEnabled != null) return false;
            return this.enaSrdUdpSpecification != null ? this.enaSrdUdpSpecification.equals(that.enaSrdUdpSpecification) : that.enaSrdUdpSpecification == null;
        }

        @Override
        public final int hashCode() {
            int result = this.enaSrdEnabled != null ? this.enaSrdEnabled.hashCode() : 0;
            result = 31 * result + (this.enaSrdUdpSpecification != null ? this.enaSrdUdpSpecification.hashCode() : 0);
            return result;
        }
    }
}
