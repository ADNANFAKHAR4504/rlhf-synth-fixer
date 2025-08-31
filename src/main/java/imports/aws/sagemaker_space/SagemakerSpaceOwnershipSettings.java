package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.341Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceOwnershipSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceOwnershipSettings.Jsii$Proxy.class)
public interface SagemakerSpaceOwnershipSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#owner_user_profile_name SagemakerSpace#owner_user_profile_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getOwnerUserProfileName();

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceOwnershipSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceOwnershipSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceOwnershipSettings> {
        java.lang.String ownerUserProfileName;

        /**
         * Sets the value of {@link SagemakerSpaceOwnershipSettings#getOwnerUserProfileName}
         * @param ownerUserProfileName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#owner_user_profile_name SagemakerSpace#owner_user_profile_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder ownerUserProfileName(java.lang.String ownerUserProfileName) {
            this.ownerUserProfileName = ownerUserProfileName;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceOwnershipSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceOwnershipSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceOwnershipSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceOwnershipSettings {
        private final java.lang.String ownerUserProfileName;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ownerUserProfileName = software.amazon.jsii.Kernel.get(this, "ownerUserProfileName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ownerUserProfileName = java.util.Objects.requireNonNull(builder.ownerUserProfileName, "ownerUserProfileName is required");
        }

        @Override
        public final java.lang.String getOwnerUserProfileName() {
            return this.ownerUserProfileName;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ownerUserProfileName", om.valueToTree(this.getOwnerUserProfileName()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceOwnershipSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceOwnershipSettings.Jsii$Proxy that = (SagemakerSpaceOwnershipSettings.Jsii$Proxy) o;

            return this.ownerUserProfileName.equals(that.ownerUserProfileName);
        }

        @Override
        public final int hashCode() {
            int result = this.ownerUserProfileName.hashCode();
            return result;
        }
    }
}
