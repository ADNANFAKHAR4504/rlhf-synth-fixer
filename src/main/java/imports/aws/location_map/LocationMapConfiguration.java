package imports.aws.location_map;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.838Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.locationMap.LocationMapConfiguration")
@software.amazon.jsii.Jsii.Proxy(LocationMapConfiguration.Jsii$Proxy.class)
public interface LocationMapConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/location_map#style LocationMap#style}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStyle();

    /**
     * @return a {@link Builder} of {@link LocationMapConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LocationMapConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LocationMapConfiguration> {
        java.lang.String style;

        /**
         * Sets the value of {@link LocationMapConfiguration#getStyle}
         * @param style Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/location_map#style LocationMap#style}. This parameter is required.
         * @return {@code this}
         */
        public Builder style(java.lang.String style) {
            this.style = style;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LocationMapConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LocationMapConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LocationMapConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LocationMapConfiguration {
        private final java.lang.String style;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.style = software.amazon.jsii.Kernel.get(this, "style", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.style = java.util.Objects.requireNonNull(builder.style, "style is required");
        }

        @Override
        public final java.lang.String getStyle() {
            return this.style;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("style", om.valueToTree(this.getStyle()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.locationMap.LocationMapConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LocationMapConfiguration.Jsii$Proxy that = (LocationMapConfiguration.Jsii$Proxy) o;

            return this.style.equals(that.style);
        }

        @Override
        public final int hashCode() {
            int result = this.style.hashCode();
            return result;
        }
    }
}
