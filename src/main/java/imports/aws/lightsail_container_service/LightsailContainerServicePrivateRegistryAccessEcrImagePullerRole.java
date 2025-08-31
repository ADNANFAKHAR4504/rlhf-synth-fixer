package imports.aws.lightsail_container_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.819Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerService.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole")
@software.amazon.jsii.Jsii.Proxy(LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole.Jsii$Proxy.class)
public interface LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#is_active LightsailContainerService#is_active}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getIsActive() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole> {
        java.lang.Object isActive;

        /**
         * Sets the value of {@link LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole#getIsActive}
         * @param isActive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#is_active LightsailContainerService#is_active}.
         * @return {@code this}
         */
        public Builder isActive(java.lang.Boolean isActive) {
            this.isActive = isActive;
            return this;
        }

        /**
         * Sets the value of {@link LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole#getIsActive}
         * @param isActive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#is_active LightsailContainerService#is_active}.
         * @return {@code this}
         */
        public Builder isActive(com.hashicorp.cdktf.IResolvable isActive) {
            this.isActive = isActive;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole {
        private final java.lang.Object isActive;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.isActive = software.amazon.jsii.Kernel.get(this, "isActive", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.isActive = builder.isActive;
        }

        @Override
        public final java.lang.Object getIsActive() {
            return this.isActive;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIsActive() != null) {
                data.set("isActive", om.valueToTree(this.getIsActive()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailContainerService.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole.Jsii$Proxy that = (LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole.Jsii$Proxy) o;

            return this.isActive != null ? this.isActive.equals(that.isActive) : that.isActive == null;
        }

        @Override
        public final int hashCode() {
            int result = this.isActive != null ? this.isActive.hashCode() : 0;
            return result;
        }
    }
}
