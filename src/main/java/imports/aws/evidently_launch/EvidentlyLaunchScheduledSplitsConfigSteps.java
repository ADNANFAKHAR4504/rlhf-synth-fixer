package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigSteps")
@software.amazon.jsii.Jsii.Proxy(EvidentlyLaunchScheduledSplitsConfigSteps.Jsii$Proxy.class)
public interface EvidentlyLaunchScheduledSplitsConfigSteps extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#group_weights EvidentlyLaunch#group_weights}.
     */
    @org.jetbrains.annotations.NotNull java.util.Map<java.lang.String, java.lang.Number> getGroupWeights();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#start_time EvidentlyLaunch#start_time}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getStartTime();

    /**
     * segment_overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment_overrides EvidentlyLaunch#segment_overrides}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getSegmentOverrides() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EvidentlyLaunchScheduledSplitsConfigSteps}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyLaunchScheduledSplitsConfigSteps}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyLaunchScheduledSplitsConfigSteps> {
        java.util.Map<java.lang.String, java.lang.Number> groupWeights;
        java.lang.String startTime;
        java.lang.Object segmentOverrides;

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfigSteps#getGroupWeights}
         * @param groupWeights Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#group_weights EvidentlyLaunch#group_weights}. This parameter is required.
         * @return {@code this}
         */
        @SuppressWarnings("unchecked")
        public Builder groupWeights(java.util.Map<java.lang.String, ? extends java.lang.Number> groupWeights) {
            this.groupWeights = (java.util.Map<java.lang.String, java.lang.Number>)groupWeights;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfigSteps#getStartTime}
         * @param startTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#start_time EvidentlyLaunch#start_time}. This parameter is required.
         * @return {@code this}
         */
        public Builder startTime(java.lang.String startTime) {
            this.startTime = startTime;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfigSteps#getSegmentOverrides}
         * @param segmentOverrides segment_overrides block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment_overrides EvidentlyLaunch#segment_overrides}
         * @return {@code this}
         */
        public Builder segmentOverrides(com.hashicorp.cdktf.IResolvable segmentOverrides) {
            this.segmentOverrides = segmentOverrides;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfigSteps#getSegmentOverrides}
         * @param segmentOverrides segment_overrides block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#segment_overrides EvidentlyLaunch#segment_overrides}
         * @return {@code this}
         */
        public Builder segmentOverrides(java.util.List<? extends imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigStepsSegmentOverrides> segmentOverrides) {
            this.segmentOverrides = segmentOverrides;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyLaunchScheduledSplitsConfigSteps}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyLaunchScheduledSplitsConfigSteps build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyLaunchScheduledSplitsConfigSteps}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyLaunchScheduledSplitsConfigSteps {
        private final java.util.Map<java.lang.String, java.lang.Number> groupWeights;
        private final java.lang.String startTime;
        private final java.lang.Object segmentOverrides;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.groupWeights = software.amazon.jsii.Kernel.get(this, "groupWeights", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.Number.class)));
            this.startTime = software.amazon.jsii.Kernel.get(this, "startTime", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.segmentOverrides = software.amazon.jsii.Kernel.get(this, "segmentOverrides", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        @SuppressWarnings("unchecked")
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.groupWeights = (java.util.Map<java.lang.String, java.lang.Number>)java.util.Objects.requireNonNull(builder.groupWeights, "groupWeights is required");
            this.startTime = java.util.Objects.requireNonNull(builder.startTime, "startTime is required");
            this.segmentOverrides = builder.segmentOverrides;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.Number> getGroupWeights() {
            return this.groupWeights;
        }

        @Override
        public final java.lang.String getStartTime() {
            return this.startTime;
        }

        @Override
        public final java.lang.Object getSegmentOverrides() {
            return this.segmentOverrides;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("groupWeights", om.valueToTree(this.getGroupWeights()));
            data.set("startTime", om.valueToTree(this.getStartTime()));
            if (this.getSegmentOverrides() != null) {
                data.set("segmentOverrides", om.valueToTree(this.getSegmentOverrides()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfigSteps"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyLaunchScheduledSplitsConfigSteps.Jsii$Proxy that = (EvidentlyLaunchScheduledSplitsConfigSteps.Jsii$Proxy) o;

            if (!groupWeights.equals(that.groupWeights)) return false;
            if (!startTime.equals(that.startTime)) return false;
            return this.segmentOverrides != null ? this.segmentOverrides.equals(that.segmentOverrides) : that.segmentOverrides == null;
        }

        @Override
        public final int hashCode() {
            int result = this.groupWeights.hashCode();
            result = 31 * result + (this.startTime.hashCode());
            result = 31 * result + (this.segmentOverrides != null ? this.segmentOverrides.hashCode() : 0);
            return result;
        }
    }
}
