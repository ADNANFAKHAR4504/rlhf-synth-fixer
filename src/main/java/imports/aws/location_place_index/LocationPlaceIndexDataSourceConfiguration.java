package imports.aws.location_place_index;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.839Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.locationPlaceIndex.LocationPlaceIndexDataSourceConfiguration")
@software.amazon.jsii.Jsii.Proxy(LocationPlaceIndexDataSourceConfiguration.Jsii$Proxy.class)
public interface LocationPlaceIndexDataSourceConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/location_place_index#intended_use LocationPlaceIndex#intended_use}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getIntendedUse() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link LocationPlaceIndexDataSourceConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link LocationPlaceIndexDataSourceConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<LocationPlaceIndexDataSourceConfiguration> {
        java.lang.String intendedUse;

        /**
         * Sets the value of {@link LocationPlaceIndexDataSourceConfiguration#getIntendedUse}
         * @param intendedUse Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/location_place_index#intended_use LocationPlaceIndex#intended_use}.
         * @return {@code this}
         */
        public Builder intendedUse(java.lang.String intendedUse) {
            this.intendedUse = intendedUse;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link LocationPlaceIndexDataSourceConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public LocationPlaceIndexDataSourceConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link LocationPlaceIndexDataSourceConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements LocationPlaceIndexDataSourceConfiguration {
        private final java.lang.String intendedUse;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.intendedUse = software.amazon.jsii.Kernel.get(this, "intendedUse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.intendedUse = builder.intendedUse;
        }

        @Override
        public final java.lang.String getIntendedUse() {
            return this.intendedUse;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getIntendedUse() != null) {
                data.set("intendedUse", om.valueToTree(this.getIntendedUse()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.locationPlaceIndex.LocationPlaceIndexDataSourceConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            LocationPlaceIndexDataSourceConfiguration.Jsii$Proxy that = (LocationPlaceIndexDataSourceConfiguration.Jsii$Proxy) o;

            return this.intendedUse != null ? this.intendedUse.equals(that.intendedUse) : that.intendedUse == null;
        }

        @Override
        public final int hashCode() {
            int result = this.intendedUse != null ? this.intendedUse.hashCode() : 0;
            return result;
        }
    }
}
