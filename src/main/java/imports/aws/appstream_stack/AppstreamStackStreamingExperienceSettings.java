package imports.aws.appstream_stack;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.appstreamStack.AppstreamStackStreamingExperienceSettings")
@software.amazon.jsii.Jsii.Proxy(AppstreamStackStreamingExperienceSettings.Jsii$Proxy.class)
public interface AppstreamStackStreamingExperienceSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#preferred_protocol AppstreamStack#preferred_protocol}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPreferredProtocol() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link AppstreamStackStreamingExperienceSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link AppstreamStackStreamingExperienceSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<AppstreamStackStreamingExperienceSettings> {
        java.lang.String preferredProtocol;

        /**
         * Sets the value of {@link AppstreamStackStreamingExperienceSettings#getPreferredProtocol}
         * @param preferredProtocol Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/appstream_stack#preferred_protocol AppstreamStack#preferred_protocol}.
         * @return {@code this}
         */
        public Builder preferredProtocol(java.lang.String preferredProtocol) {
            this.preferredProtocol = preferredProtocol;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link AppstreamStackStreamingExperienceSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public AppstreamStackStreamingExperienceSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link AppstreamStackStreamingExperienceSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements AppstreamStackStreamingExperienceSettings {
        private final java.lang.String preferredProtocol;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.preferredProtocol = software.amazon.jsii.Kernel.get(this, "preferredProtocol", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.preferredProtocol = builder.preferredProtocol;
        }

        @Override
        public final java.lang.String getPreferredProtocol() {
            return this.preferredProtocol;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPreferredProtocol() != null) {
                data.set("preferredProtocol", om.valueToTree(this.getPreferredProtocol()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.appstreamStack.AppstreamStackStreamingExperienceSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            AppstreamStackStreamingExperienceSettings.Jsii$Proxy that = (AppstreamStackStreamingExperienceSettings.Jsii$Proxy) o;

            return this.preferredProtocol != null ? this.preferredProtocol.equals(that.preferredProtocol) : that.preferredProtocol == null;
        }

        @Override
        public final int hashCode() {
            int result = this.preferredProtocol != null ? this.preferredProtocol.hashCode() : 0;
            return result;
        }
    }
}
