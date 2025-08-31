package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfig")
@software.amazon.jsii.Jsii.Proxy(EvidentlyLaunchScheduledSplitsConfig.Jsii$Proxy.class)
public interface EvidentlyLaunchScheduledSplitsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * steps block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#steps EvidentlyLaunch#steps}
     */
    @org.jetbrains.annotations.NotNull java.lang.Object getSteps();

    /**
     * @return a {@link Builder} of {@link EvidentlyLaunchScheduledSplitsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyLaunchScheduledSplitsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyLaunchScheduledSplitsConfig> {
        java.lang.Object steps;

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfig#getSteps}
         * @param steps steps block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#steps EvidentlyLaunch#steps}
         * @return {@code this}
         */
        public Builder steps(com.hashicorp.cdktf.IResolvable steps) {
            this.steps = steps;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyLaunchScheduledSplitsConfig#getSteps}
         * @param steps steps block. This parameter is required.
         *              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#steps EvidentlyLaunch#steps}
         * @return {@code this}
         */
        public Builder steps(java.util.List<? extends imports.aws.evidently_launch.EvidentlyLaunchScheduledSplitsConfigSteps> steps) {
            this.steps = steps;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyLaunchScheduledSplitsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyLaunchScheduledSplitsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyLaunchScheduledSplitsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyLaunchScheduledSplitsConfig {
        private final java.lang.Object steps;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.steps = software.amazon.jsii.Kernel.get(this, "steps", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.steps = java.util.Objects.requireNonNull(builder.steps, "steps is required");
        }

        @Override
        public final java.lang.Object getSteps() {
            return this.steps;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("steps", om.valueToTree(this.getSteps()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyLaunch.EvidentlyLaunchScheduledSplitsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyLaunchScheduledSplitsConfig.Jsii$Proxy that = (EvidentlyLaunchScheduledSplitsConfig.Jsii$Proxy) o;

            return this.steps.equals(that.steps);
        }

        @Override
        public final int hashCode() {
            int result = this.steps.hashCode();
            return result;
        }
    }
}
