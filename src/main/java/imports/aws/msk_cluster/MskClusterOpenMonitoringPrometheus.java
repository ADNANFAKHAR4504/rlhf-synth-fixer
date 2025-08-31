package imports.aws.msk_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.911Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskCluster.MskClusterOpenMonitoringPrometheus")
@software.amazon.jsii.Jsii.Proxy(MskClusterOpenMonitoringPrometheus.Jsii$Proxy.class)
public interface MskClusterOpenMonitoringPrometheus extends software.amazon.jsii.JsiiSerializable {

    /**
     * jmx_exporter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#jmx_exporter MskCluster#jmx_exporter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusJmxExporter getJmxExporter() {
        return null;
    }

    /**
     * node_exporter block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#node_exporter MskCluster#node_exporter}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusNodeExporter getNodeExporter() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskClusterOpenMonitoringPrometheus}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskClusterOpenMonitoringPrometheus}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskClusterOpenMonitoringPrometheus> {
        imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusJmxExporter jmxExporter;
        imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusNodeExporter nodeExporter;

        /**
         * Sets the value of {@link MskClusterOpenMonitoringPrometheus#getJmxExporter}
         * @param jmxExporter jmx_exporter block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#jmx_exporter MskCluster#jmx_exporter}
         * @return {@code this}
         */
        public Builder jmxExporter(imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusJmxExporter jmxExporter) {
            this.jmxExporter = jmxExporter;
            return this;
        }

        /**
         * Sets the value of {@link MskClusterOpenMonitoringPrometheus#getNodeExporter}
         * @param nodeExporter node_exporter block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/msk_cluster#node_exporter MskCluster#node_exporter}
         * @return {@code this}
         */
        public Builder nodeExporter(imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusNodeExporter nodeExporter) {
            this.nodeExporter = nodeExporter;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskClusterOpenMonitoringPrometheus}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskClusterOpenMonitoringPrometheus build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskClusterOpenMonitoringPrometheus}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskClusterOpenMonitoringPrometheus {
        private final imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusJmxExporter jmxExporter;
        private final imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusNodeExporter nodeExporter;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.jmxExporter = software.amazon.jsii.Kernel.get(this, "jmxExporter", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusJmxExporter.class));
            this.nodeExporter = software.amazon.jsii.Kernel.get(this, "nodeExporter", software.amazon.jsii.NativeType.forClass(imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusNodeExporter.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.jmxExporter = builder.jmxExporter;
            this.nodeExporter = builder.nodeExporter;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusJmxExporter getJmxExporter() {
            return this.jmxExporter;
        }

        @Override
        public final imports.aws.msk_cluster.MskClusterOpenMonitoringPrometheusNodeExporter getNodeExporter() {
            return this.nodeExporter;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getJmxExporter() != null) {
                data.set("jmxExporter", om.valueToTree(this.getJmxExporter()));
            }
            if (this.getNodeExporter() != null) {
                data.set("nodeExporter", om.valueToTree(this.getNodeExporter()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskCluster.MskClusterOpenMonitoringPrometheus"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskClusterOpenMonitoringPrometheus.Jsii$Proxy that = (MskClusterOpenMonitoringPrometheus.Jsii$Proxy) o;

            if (this.jmxExporter != null ? !this.jmxExporter.equals(that.jmxExporter) : that.jmxExporter != null) return false;
            return this.nodeExporter != null ? this.nodeExporter.equals(that.nodeExporter) : that.nodeExporter == null;
        }

        @Override
        public final int hashCode() {
            int result = this.jmxExporter != null ? this.jmxExporter.hashCode() : 0;
            result = 31 * result + (this.nodeExporter != null ? this.nodeExporter.hashCode() : 0);
            return result;
        }
    }
}
