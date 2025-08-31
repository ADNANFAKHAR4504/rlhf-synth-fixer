package imports.aws.synthetics_canary;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.543Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.syntheticsCanary.SyntheticsCanarySchedule")
@software.amazon.jsii.Jsii.Proxy(SyntheticsCanarySchedule.Jsii$Proxy.class)
public interface SyntheticsCanarySchedule extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#expression SyntheticsCanary#expression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getExpression();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#duration_in_seconds SyntheticsCanary#duration_in_seconds}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getDurationInSeconds() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link SyntheticsCanarySchedule}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link SyntheticsCanarySchedule}
     */
    public static final class Builder implements software.amazon.jsii.Builder<SyntheticsCanarySchedule> {
        java.lang.String expression;
        java.lang.Number durationInSeconds;

        /**
         * Sets the value of {@link SyntheticsCanarySchedule#getExpression}
         * @param expression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#expression SyntheticsCanary#expression}. This parameter is required.
         * @return {@code this}
         */
        public Builder expression(java.lang.String expression) {
            this.expression = expression;
            return this;
        }

        /**
         * Sets the value of {@link SyntheticsCanarySchedule#getDurationInSeconds}
         * @param durationInSeconds Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/synthetics_canary#duration_in_seconds SyntheticsCanary#duration_in_seconds}.
         * @return {@code this}
         */
        public Builder durationInSeconds(java.lang.Number durationInSeconds) {
            this.durationInSeconds = durationInSeconds;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link SyntheticsCanarySchedule}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public SyntheticsCanarySchedule build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link SyntheticsCanarySchedule}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements SyntheticsCanarySchedule {
        private final java.lang.String expression;
        private final java.lang.Number durationInSeconds;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.expression = software.amazon.jsii.Kernel.get(this, "expression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.durationInSeconds = software.amazon.jsii.Kernel.get(this, "durationInSeconds", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.expression = java.util.Objects.requireNonNull(builder.expression, "expression is required");
            this.durationInSeconds = builder.durationInSeconds;
        }

        @Override
        public final java.lang.String getExpression() {
            return this.expression;
        }

        @Override
        public final java.lang.Number getDurationInSeconds() {
            return this.durationInSeconds;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("expression", om.valueToTree(this.getExpression()));
            if (this.getDurationInSeconds() != null) {
                data.set("durationInSeconds", om.valueToTree(this.getDurationInSeconds()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.syntheticsCanary.SyntheticsCanarySchedule"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            SyntheticsCanarySchedule.Jsii$Proxy that = (SyntheticsCanarySchedule.Jsii$Proxy) o;

            if (!expression.equals(that.expression)) return false;
            return this.durationInSeconds != null ? this.durationInSeconds.equals(that.durationInSeconds) : that.durationInSeconds == null;
        }

        @Override
        public final int hashCode() {
            int result = this.expression.hashCode();
            result = 31 * result + (this.durationInSeconds != null ? this.durationInSeconds.hashCode() : 0);
            return result;
        }
    }
}
