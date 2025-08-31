package imports.aws.lightsail_container_service;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.819Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.lightsailContainerService.LightsailContainerServicePrivateRegistryAccess")
@software.amazon.jsii.Jsii.Proxy(LightsailContainerServicePrivateRegistryAccess.Jsii$Proxy.class)
public interface LightsailContainerServicePrivateRegistryAccess extends software.amazon.jsii.JsiiSerializable {

    /**
     * ecr_image_puller_role block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#ecr_image_puller_role LightsailContainerService#ecr_image_puller_role}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole getEcrImagePullerRole() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LightsailContainerServicePrivateRegistryAccess}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LightsailContainerServicePrivateRegistryAccess}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LightsailContainerServicePrivateRegistryAccess> {
        imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole ecrImagePullerRole;

        /**
         * Sets the value of {@link LightsailContainerServicePrivateRegistryAccess#getEcrImagePullerRole}
         * @param ecrImagePullerRole ecr_image_puller_role block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/lightsail_container_service#ecr_image_puller_role LightsailContainerService#ecr_image_puller_role}
         * @return {@code this}
         */
        public Builder ecrImagePullerRole(imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole ecrImagePullerRole) {
            this.ecrImagePullerRole = ecrImagePullerRole;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LightsailContainerServicePrivateRegistryAccess}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LightsailContainerServicePrivateRegistryAccess build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LightsailContainerServicePrivateRegistryAccess}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LightsailContainerServicePrivateRegistryAccess {
        private final imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole ecrImagePullerRole;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ecrImagePullerRole = software.amazon.jsii.Kernel.get(this, "ecrImagePullerRole", software.amazon.jsii.NativeType.forClass(imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ecrImagePullerRole = builder.ecrImagePullerRole;
        }

        @Override
        public final imports.aws.lightsail_container_service.LightsailContainerServicePrivateRegistryAccessEcrImagePullerRole getEcrImagePullerRole() {
            return this.ecrImagePullerRole;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getEcrImagePullerRole() != null) {
                data.set("ecrImagePullerRole", om.valueToTree(this.getEcrImagePullerRole()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.lightsailContainerService.LightsailContainerServicePrivateRegistryAccess"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LightsailContainerServicePrivateRegistryAccess.Jsii$Proxy that = (LightsailContainerServicePrivateRegistryAccess.Jsii$Proxy) o;

            return this.ecrImagePullerRole != null ? this.ecrImagePullerRole.equals(that.ecrImagePullerRole) : that.ecrImagePullerRole == null;
        }

        @Override
        public final int hashCode() {
            int result = this.ecrImagePullerRole != null ? this.ecrImagePullerRole.hashCode() : 0;
            return result;
        }
    }
}
