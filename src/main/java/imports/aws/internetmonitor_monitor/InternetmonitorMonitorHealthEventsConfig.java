package imports.aws.internetmonitor_monitor;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.394Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.internetmonitorMonitor.InternetmonitorMonitorHealthEventsConfig")
@software.amazon.jsii.Jsii.Proxy(InternetmonitorMonitorHealthEventsConfig.Jsii$Proxy.class)
public interface InternetmonitorMonitorHealthEventsConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#availability_score_threshold InternetmonitorMonitor#availability_score_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getAvailabilityScoreThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#performance_score_threshold InternetmonitorMonitor#performance_score_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getPerformanceScoreThreshold() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link InternetmonitorMonitorHealthEventsConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link InternetmonitorMonitorHealthEventsConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<InternetmonitorMonitorHealthEventsConfig> {
        java.lang.Number availabilityScoreThreshold;
        java.lang.Number performanceScoreThreshold;

        /**
         * Sets the value of {@link InternetmonitorMonitorHealthEventsConfig#getAvailabilityScoreThreshold}
         * @param availabilityScoreThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#availability_score_threshold InternetmonitorMonitor#availability_score_threshold}.
         * @return {@code this}
         */
        public Builder availabilityScoreThreshold(java.lang.Number availabilityScoreThreshold) {
            this.availabilityScoreThreshold = availabilityScoreThreshold;
            return this;
        }

        /**
         * Sets the value of {@link InternetmonitorMonitorHealthEventsConfig#getPerformanceScoreThreshold}
         * @param performanceScoreThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/internetmonitor_monitor#performance_score_threshold InternetmonitorMonitor#performance_score_threshold}.
         * @return {@code this}
         */
        public Builder performanceScoreThreshold(java.lang.Number performanceScoreThreshold) {
            this.performanceScoreThreshold = performanceScoreThreshold;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link InternetmonitorMonitorHealthEventsConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public InternetmonitorMonitorHealthEventsConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link InternetmonitorMonitorHealthEventsConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements InternetmonitorMonitorHealthEventsConfig {
        private final java.lang.Number availabilityScoreThreshold;
        private final java.lang.Number performanceScoreThreshold;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.availabilityScoreThreshold = software.amazon.jsii.Kernel.get(this, "availabilityScoreThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.performanceScoreThreshold = software.amazon.jsii.Kernel.get(this, "performanceScoreThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.availabilityScoreThreshold = builder.availabilityScoreThreshold;
            this.performanceScoreThreshold = builder.performanceScoreThreshold;
        }

        @Override
        public final java.lang.Number getAvailabilityScoreThreshold() {
            return this.availabilityScoreThreshold;
        }

        @Override
        public final java.lang.Number getPerformanceScoreThreshold() {
            return this.performanceScoreThreshold;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAvailabilityScoreThreshold() != null) {
                data.set("availabilityScoreThreshold", om.valueToTree(this.getAvailabilityScoreThreshold()));
            }
            if (this.getPerformanceScoreThreshold() != null) {
                data.set("performanceScoreThreshold", om.valueToTree(this.getPerformanceScoreThreshold()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.internetmonitorMonitor.InternetmonitorMonitorHealthEventsConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            InternetmonitorMonitorHealthEventsConfig.Jsii$Proxy that = (InternetmonitorMonitorHealthEventsConfig.Jsii$Proxy) o;

            if (this.availabilityScoreThreshold != null ? !this.availabilityScoreThreshold.equals(that.availabilityScoreThreshold) : that.availabilityScoreThreshold != null) return false;
            return this.performanceScoreThreshold != null ? this.performanceScoreThreshold.equals(that.performanceScoreThreshold) : that.performanceScoreThreshold == null;
        }

        @Override
        public final int hashCode() {
            int result = this.availabilityScoreThreshold != null ? this.availabilityScoreThreshold.hashCode() : 0;
            result = 31 * result + (this.performanceScoreThreshold != null ? this.performanceScoreThreshold.hashCode() : 0);
            return result;
        }
    }
}
