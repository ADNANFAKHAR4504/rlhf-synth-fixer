package imports.aws.m2_environment;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.845Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.m2Environment.M2EnvironmentHighAvailabilityConfig")
@software.amazon.jsii.Jsii.Proxy(M2EnvironmentHighAvailabilityConfig.Jsii$Proxy.class)
public interface M2EnvironmentHighAvailabilityConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#desired_capacity M2Environment#desired_capacity}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getDesiredCapacity();

    /**
     * @return a {@link Builder} of {@link M2EnvironmentHighAvailabilityConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link M2EnvironmentHighAvailabilityConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<M2EnvironmentHighAvailabilityConfig> {
        java.lang.Number desiredCapacity;

        /**
         * Sets the value of {@link M2EnvironmentHighAvailabilityConfig#getDesiredCapacity}
         * @param desiredCapacity Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/m2_environment#desired_capacity M2Environment#desired_capacity}. This parameter is required.
         * @return {@code this}
         */
        public Builder desiredCapacity(java.lang.Number desiredCapacity) {
            this.desiredCapacity = desiredCapacity;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link M2EnvironmentHighAvailabilityConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public M2EnvironmentHighAvailabilityConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link M2EnvironmentHighAvailabilityConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements M2EnvironmentHighAvailabilityConfig {
        private final java.lang.Number desiredCapacity;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.desiredCapacity = software.amazon.jsii.Kernel.get(this, "desiredCapacity", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.desiredCapacity = java.util.Objects.requireNonNull(builder.desiredCapacity, "desiredCapacity is required");
        }

        @Override
        public final java.lang.Number getDesiredCapacity() {
            return this.desiredCapacity;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("desiredCapacity", om.valueToTree(this.getDesiredCapacity()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.m2Environment.M2EnvironmentHighAvailabilityConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            M2EnvironmentHighAvailabilityConfig.Jsii$Proxy that = (M2EnvironmentHighAvailabilityConfig.Jsii$Proxy) o;

            return this.desiredCapacity.equals(that.desiredCapacity);
        }

        @Override
        public final int hashCode() {
            int result = this.desiredCapacity.hashCode();
            return result;
        }
    }
}
