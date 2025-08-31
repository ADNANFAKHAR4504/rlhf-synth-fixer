package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.911Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterOpenMonitoring")
@software.amazon.jsii.Jsii.Proxy(MskClusterOpenMonitoring.Jsii$Proxy.class)
public interface MskClusterOpenMonitoring extends software.amazon.jsii.JsiiSerializable {

    /**
     * prometheus block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#prometheus MskCluster#prometheus}
     */
    @org.jetbrains.annotations.NotNull imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheus getPrometheus();

    /**
     * @return a {@link Builder} of {@link MskClusterOpenMonitoring}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterOpenMonitoring}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterOpenMonitoring> {
        imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheus prometheus;

        /**
         * Sets the value of {@link MskClusterOpenMonitoring#getPrometheus}
         * @param prometheus prometheus block. This parameter is required.
         *                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#prometheus MskCluster#prometheus}
         * @return {@code this}
         */
        public Builder prometheus(imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheus prometheus) {
            this.prometheus = prometheus;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterOpenMonitoring}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterOpenMonitoring build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterOpenMonitoring}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterOpenMonitoring {
        private final imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheus prometheus;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.prometheus = software.amazon.jsii.Kernel.get(this, "prometheus", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheus.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.prometheus = java.util.Objects.requireNonNull(builder.prometheus, "prometheus is required");
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheus getPrometheus() {
            return this.prometheus;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("prometheus", om.valueToTree(this.getPrometheus()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterOpenMonitoring"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterOpenMonitoring.Jsii$Proxy that = (MskClusterOpenMonitoring.Jsii$Proxy) o;

            return this.prometheus.equals(that.prometheus);
        }

        @Override
        public final int hashCode() {
            int result = this.prometheus.hashCode();
            return result;
        }
    }
}
