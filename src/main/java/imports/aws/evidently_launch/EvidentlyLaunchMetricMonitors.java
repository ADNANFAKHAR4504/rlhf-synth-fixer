package imports.aws.evidently_launch;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.214Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyLaunch.EvidentlyLaunchMetricMonitors")
@software.amazon.jsii.Jsii.Proxy(EvidentlyLaunchMetricMonitors.Jsii$Proxy.class)
public interface EvidentlyLaunchMetricMonitors extends software.amazon.jsii.JsiiSerializable {

    /**
     * metric_definition block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#metric_definition EvidentlyLaunch#metric_definition}
     */
    @org.jetbrains.annotations.NotNull imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition getMetricDefinition();

    /**
     * @return a {@link Builder} of {@link EvidentlyLaunchMetricMonitors}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyLaunchMetricMonitors}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyLaunchMetricMonitors> {
        imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition metricDefinition;

        /**
         * Sets the value of {@link EvidentlyLaunchMetricMonitors#getMetricDefinition}
         * @param metricDefinition metric_definition block. This parameter is required.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_launch#metric_definition EvidentlyLaunch#metric_definition}
         * @return {@code this}
         */
        public Builder metricDefinition(imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition metricDefinition) {
            this.metricDefinition = metricDefinition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyLaunchMetricMonitors}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyLaunchMetricMonitors build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyLaunchMetricMonitors}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyLaunchMetricMonitors {
        private final imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition metricDefinition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.metricDefinition = software.amazon.jsii.Kernel.get(this, "metricDefinition", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.metricDefinition = java.util.Objects.requireNonNull(builder.metricDefinition, "metricDefinition is required");
        }

        @Override
        public final imports.aws.evidently_launch.EvidentlyLaunchMetricMonitorsMetricDefinition getMetricDefinition() {
            return this.metricDefinition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("metricDefinition", om.valueToTree(this.getMetricDefinition()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyLaunch.EvidentlyLaunchMetricMonitors"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyLaunchMetricMonitors.Jsii$Proxy that = (EvidentlyLaunchMetricMonitors.Jsii$Proxy) o;

            return this.metricDefinition.equals(that.metricDefinition);
        }

        @Override
        public final int hashCode() {
            int result = this.metricDefinition.hashCode();
            return result;
        }
    }
}
