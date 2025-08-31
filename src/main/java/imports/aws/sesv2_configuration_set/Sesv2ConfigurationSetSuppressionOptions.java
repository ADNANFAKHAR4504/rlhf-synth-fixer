package imports.aws.sesv2_configuration_set;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.456Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSuppressionOptions")
@software.amazon.jsii.Jsii.Proxy(Sesv2ConfigurationSetSuppressionOptions.Jsii$Proxy.class)
public interface Sesv2ConfigurationSetSuppressionOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppressed_reasons Sesv2ConfigurationSet#suppressed_reasons}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getSuppressedReasons() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Sesv2ConfigurationSetSuppressionOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Sesv2ConfigurationSetSuppressionOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Sesv2ConfigurationSetSuppressionOptions> {
        java.util.List<java.lang.String> suppressedReasons;

        /**
         * Sets the value of {@link Sesv2ConfigurationSetSuppressionOptions#getSuppressedReasons}
         * @param suppressedReasons Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/sesv2_configuration_set#suppressed_reasons Sesv2ConfigurationSet#suppressed_reasons}.
         * @return {@code this}
         */
        public Builder suppressedReasons(java.util.List<java.lang.String> suppressedReasons) {
            this.suppressedReasons = suppressedReasons;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Sesv2ConfigurationSetSuppressionOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Sesv2ConfigurationSetSuppressionOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Sesv2ConfigurationSetSuppressionOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Sesv2ConfigurationSetSuppressionOptions {
        private final java.util.List<java.lang.String> suppressedReasons;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.suppressedReasons = software.amazon.jsii.Kernel.get(this, "suppressedReasons", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.suppressedReasons = builder.suppressedReasons;
        }

        @Override
        public final java.util.List<java.lang.String> getSuppressedReasons() {
            return this.suppressedReasons;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getSuppressedReasons() != null) {
                data.set("suppressedReasons", om.valueToTree(this.getSuppressedReasons()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.sesv2ConfigurationSet.Sesv2ConfigurationSetSuppressionOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Sesv2ConfigurationSetSuppressionOptions.Jsii$Proxy that = (Sesv2ConfigurationSetSuppressionOptions.Jsii$Proxy) o;

            return this.suppressedReasons != null ? this.suppressedReasons.equals(that.suppressedReasons) : that.suppressedReasons == null;
        }

        @Override
        public final int hashCode() {
            int result = this.suppressedReasons != null ? this.suppressedReasons.hashCode() : 0;
            return result;
        }
    }
}
