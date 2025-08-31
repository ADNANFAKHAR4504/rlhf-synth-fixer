package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides")
@software.amazon.jsii.Jsii.Proxy(EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides.Jsii$Proxy.class)
public interface EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#evaluation_order EvidentlyLaunch#evaluation_order}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getEvaluationOrder();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment EvidentlyLaunch#segment}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSegment();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#weights EvidentlyLaunch#weights}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> getWeights();

    /**
     * @return a {@link Builder} of {@link EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides> {
        java.lang.Number evaluationOrder;
        java.lang.String segment;
        java.util.Map<java.lang.String, java.lang.Number> weights;

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides#getEvaluationOrder}
         * @param evaluationOrder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#evaluation_order EvidentlyLaunch#evaluation_order}. This parameter is required.
         * @return {@code this}
         */
        public Builder evaluationOrder(java.lang.Number evaluationOrder) {
            this.evaluationOrder = evaluationOrder;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides#getSegment}
         * @param segment Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment EvidentlyLaunch#segment}. This parameter is required.
         * @return {@code this}
         */
        public Builder segment(java.lang.String segment) {
            this.segment = segment;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides#getWeights}
         * @param weights Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#weights EvidentlyLaunch#weights}. This parameter is required.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder weights(java.util.Map<java.lang.String, ? extends java.lang.Number> weights) {
            this.weights = (java.util.Map<java.lang.String, java.lang.Number>)weights;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides {
        private final java.lang.Number evaluationOrder;
        private final java.lang.String segment;
        private final java.util.Map<java.lang.String, java.lang.Number> weights;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.evaluationOrder = software.amazon.jsii.Kernel.get(this, "evaluationOrder", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.segment = software.amazon.jsii.Kernel.get(this, "segment", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.weights = software.amazon.jsii.Kernel.get(this, "weights", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.evaluationOrder = java.util.Objects.requireNonNull(builder.evaluationOrder, "evaluationOrder is required");
            this.segment = java.util.Objects.requireNonNull(builder.segment, "segment is required");
            this.weights = (java.util.Map<java.lang.String, java.lang.Number>)java.util.Objects.requireNonNull(builder.weights, "weights is required");
        }

        @Override
        public final java.lang.Number getEvaluationOrder() {
            return this.evaluationOrder;
        }

        @Override
        public final java.lang.String getSegment() {
            return this.segment;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.Number> getWeights() {
            return this.weights;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("evaluationOrder", om.valueToTree(this.getEvaluationOrder()));
            data.set("segment", om.valueToTree(this.getSegment()));
            data.set("weights", om.valueToTree(this.getWeights()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides.Jsii$Proxy that = (EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides.Jsii$Proxy) o;

            if (!evaluationOrder.equals(that.evaluationOrder)) return false;
            if (!segment.equals(that.segment)) return false;
            return this.weights.equals(that.weights);
        }

        @Override
        public final int hashCode() {
            int result = this.evaluationOrder.hashCode();
            result = 31 * result + (this.segment.hashCode());
            result = 31 * result + (this.weights.hashCode());
            return result;
        }
    }
}
