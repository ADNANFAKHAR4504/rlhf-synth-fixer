package imports.aws.vpclattice_target_group;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.629Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.vpclatticeTargetGroup.VpclatticeTargetGroupConfigHealthCheckMatcher")
@software.amazon.jsii.Jsii.Proxy(VpclatticeTargetGroupConfigHealthCheckMatcher.Jsii$Proxy.class)
public interface VpclatticeTargetGroupConfigHealthCheckMatcher extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#value VpclatticeTargetGroup#value}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getValue() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link VpclatticeTargetGroupConfigHealthCheckMatcher}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link VpclatticeTargetGroupConfigHealthCheckMatcher}
     */
    public static final class Builder implements software.amazon.jsii.Builder<VpclatticeTargetGroupConfigHealthCheckMatcher> {
        java.lang.String value;

        /**
         * Sets the value of {@link VpclatticeTargetGroupConfigHealthCheckMatcher#getValue}
         * @param value Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/vpclattice_target_group#value VpclatticeTargetGroup#value}.
         * @return {@code this}
         */
        public Builder value(java.lang.String value) {
            this.value = value;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link VpclatticeTargetGroupConfigHealthCheckMatcher}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public VpclatticeTargetGroupConfigHealthCheckMatcher build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link VpclatticeTargetGroupConfigHealthCheckMatcher}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements VpclatticeTargetGroupConfigHealthCheckMatcher {
        private final java.lang.String value;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.value = software.amazon.jsii.Kernel.get(this, "value", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.value = builder.value;
        }

        @Override
        public final java.lang.String getValue() {
            return this.value;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getValue() != null) {
                data.set("value", om.valueToTree(this.getValue()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.vpclatticeTargetGroup.VpclatticeTargetGroupConfigHealthCheckMatcher"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            VpclatticeTargetGroupConfigHealthCheckMatcher.Jsii$Proxy that = (VpclatticeTargetGroupConfigHealthCheckMatcher.Jsii$Proxy) o;

            return this.value != null ? this.value.equals(that.value) : that.value == null;
        }

        @Override
        public final int hashCode() {
            int result = this.value != null ? this.value.hashCode() : 0;
            return result;
        }
    }
}
