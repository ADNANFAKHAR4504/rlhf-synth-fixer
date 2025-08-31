package imports.aws.worklink_fleet;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.681Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.worklinkFleet.WorklinkFleetIdentityProvider")
@software.amazon.jsii.Jsii.Proxy(WorklinkFleetIdentityProvider.Jsii$Proxy.class)
public interface WorklinkFleetIdentityProvider extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#saml_metadata WorklinkFleet#saml_metadata}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSamlMetadata();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#type WorklinkFleet#type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getType();

    /**
     * @return a {@link Builder} of {@link WorklinkFleetIdentityProvider}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorklinkFleetIdentityProvider}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorklinkFleetIdentityProvider> {
        java.lang.String samlMetadata;
        java.lang.String type;

        /**
         * Sets the value of {@link WorklinkFleetIdentityProvider#getSamlMetadata}
         * @param samlMetadata Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#saml_metadata WorklinkFleet#saml_metadata}. This parameter is required.
         * @return {@code this}
         */
        public Builder samlMetadata(java.lang.String samlMetadata) {
            this.samlMetadata = samlMetadata;
            return this;
        }

        /**
         * Sets the value of {@link WorklinkFleetIdentityProvider#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/worklink_fleet#type WorklinkFleet#type}. This parameter is required.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorklinkFleetIdentityProvider}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorklinkFleetIdentityProvider build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorklinkFleetIdentityProvider}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorklinkFleetIdentityProvider {
        private final java.lang.String samlMetadata;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.samlMetadata = software.amazon.jsii.Kernel.get(this, "samlMetadata", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.samlMetadata = java.util.Objects.requireNonNull(builder.samlMetadata, "samlMetadata is required");
            this.type = java.util.Objects.requireNonNull(builder.type, "type is required");
        }

        @Override
        public final java.lang.String getSamlMetadata() {
            return this.samlMetadata;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("samlMetadata", om.valueToTree(this.getSamlMetadata()));
            data.set("type", om.valueToTree(this.getType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.worklinkFleet.WorklinkFleetIdentityProvider"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorklinkFleetIdentityProvider.Jsii$Proxy that = (WorklinkFleetIdentityProvider.Jsii$Proxy) o;

            if (!samlMetadata.equals(that.samlMetadata)) return false;
            return this.type.equals(that.type);
        }

        @Override
        public final int hashCode() {
            int result = this.samlMetadata.hashCode();
            result = 31 * result + (this.type.hashCode());
            return result;
        }
    }
}
