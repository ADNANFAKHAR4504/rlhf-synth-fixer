package imports.aws.sagemaker_space;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.343Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sagemakerSpace.SagemakerSpaceSpaceSharingSettings")
@software.amazon.jsii.Jsii.Proxy(SagemakerSpaceSpaceSharingSettings.Jsii$Proxy.class)
public interface SagemakerSpaceSpaceSharingSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sharing_type SagemakerSpace#sharing_type}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSharingType();

    /**
     * @return a {@link Builder} of {@link SagemakerSpaceSpaceSharingSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SagemakerSpaceSpaceSharingSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SagemakerSpaceSpaceSharingSettings> {
        java.lang.String sharingType;

        /**
         * Sets the value of {@link SagemakerSpaceSpaceSharingSettings#getSharingType}
         * @param sharingType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sagemaker_space#sharing_type SagemakerSpace#sharing_type}. This parameter is required.
         * @return {@code this}
         */
        public Builder sharingType(java.lang.String sharingType) {
            this.sharingType = sharingType;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SagemakerSpaceSpaceSharingSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SagemakerSpaceSpaceSharingSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SagemakerSpaceSpaceSharingSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SagemakerSpaceSpaceSharingSettings {
        private final java.lang.String sharingType;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.sharingType = software.amazon.jsii.Kernel.get(this, "sharingType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.sharingType = java.util.Objects.requireNonNull(builder.sharingType, "sharingType is required");
        }

        @Override
        public final java.lang.String getSharingType() {
            return this.sharingType;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("sharingType", om.valueToTree(this.getSharingType()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sagemakerSpace.SagemakerSpaceSpaceSharingSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SagemakerSpaceSpaceSharingSettings.Jsii$Proxy that = (SagemakerSpaceSpaceSharingSettings.Jsii$Proxy) o;

            return this.sharingType.equals(that.sharingType);
        }

        @Override
        public final int hashCode() {
            int result = this.sharingType.hashCode();
            return result;
        }
    }
}
