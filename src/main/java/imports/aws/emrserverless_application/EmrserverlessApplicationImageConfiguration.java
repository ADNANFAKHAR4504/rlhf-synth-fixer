package imports.aws.emrserverless_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.209Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrserverlessApplication.EmrserverlessApplicationImageConfiguration")
@software.amazon.jsii.Jsii.Proxy(EmrserverlessApplicationImageConfiguration.Jsii$Proxy.class)
public interface EmrserverlessApplicationImageConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#image_uri EmrserverlessApplication#image_uri}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getImageUri();

    /**
     * @return a {@link Builder} of {@link EmrserverlessApplicationImageConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrserverlessApplicationImageConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrserverlessApplicationImageConfiguration> {
        java.lang.String imageUri;

        /**
         * Sets the value of {@link EmrserverlessApplicationImageConfiguration#getImageUri}
         * @param imageUri Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emrserverless_application#image_uri EmrserverlessApplication#image_uri}. This parameter is required.
         * @return {@code this}
         */
        public Builder imageUri(java.lang.String imageUri) {
            this.imageUri = imageUri;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrserverlessApplicationImageConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrserverlessApplicationImageConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrserverlessApplicationImageConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrserverlessApplicationImageConfiguration {
        private final java.lang.String imageUri;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.imageUri = software.amazon.jsii.Kernel.get(this, "imageUri", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.imageUri = java.util.Objects.requireNonNull(builder.imageUri, "imageUri is required");
        }

        @Override
        public final java.lang.String getImageUri() {
            return this.imageUri;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("imageUri", om.valueToTree(this.getImageUri()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrserverlessApplication.EmrserverlessApplicationImageConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrserverlessApplicationImageConfiguration.Jsii$Proxy that = (EmrserverlessApplicationImageConfiguration.Jsii$Proxy) o;

            return this.imageUri.equals(that.imageUri);
        }

        @Override
        public final int hashCode() {
            int result = this.imageUri.hashCode();
            return result;
        }
    }
}
