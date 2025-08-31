package imports.aws.opsworks_mysql_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.028Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksMysqlLayer.OpsworksMysqlLayerLoadBasedAutoScalingUpscaling")
@software.amazon.jsii.Jsii.Proxy(OpsworksMysqlLayerLoadBasedAutoScalingUpscaling.Jsii$Proxy.class)
public interface OpsworksMysqlLayerLoadBasedAutoScalingUpscaling extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#alarms OpsworksMysqlLayer#alarms}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getAlarms() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#cpu_threshold OpsworksMysqlLayer#cpu_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getCpuThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#ignore_metrics_time OpsworksMysqlLayer#ignore_metrics_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getIgnoreMetricsTime() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#instance_count OpsworksMysqlLayer#instance_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getInstanceCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#load_threshold OpsworksMysqlLayer#load_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getLoadThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#memory_threshold OpsworksMysqlLayer#memory_threshold}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getMemoryThreshold() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#thresholds_wait_time OpsworksMysqlLayer#thresholds_wait_time}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getThresholdsWaitTime() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksMysqlLayerLoadBasedAutoScalingUpscaling> {
        java.util.List<java.lang.String> alarms;
        java.lang.Number cpuThreshold;
        java.lang.Number ignoreMetricsTime;
        java.lang.Number instanceCount;
        java.lang.Number loadThreshold;
        java.lang.Number memoryThreshold;
        java.lang.Number thresholdsWaitTime;

        /**
         * Sets the value of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling#getAlarms}
         * @param alarms Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#alarms OpsworksMysqlLayer#alarms}.
         * @return {@code this}
         */
        public Builder alarms(java.util.List<java.lang.String> alarms) {
            this.alarms = alarms;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling#getCpuThreshold}
         * @param cpuThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#cpu_threshold OpsworksMysqlLayer#cpu_threshold}.
         * @return {@code this}
         */
        public Builder cpuThreshold(java.lang.Number cpuThreshold) {
            this.cpuThreshold = cpuThreshold;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling#getIgnoreMetricsTime}
         * @param ignoreMetricsTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#ignore_metrics_time OpsworksMysqlLayer#ignore_metrics_time}.
         * @return {@code this}
         */
        public Builder ignoreMetricsTime(java.lang.Number ignoreMetricsTime) {
            this.ignoreMetricsTime = ignoreMetricsTime;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling#getInstanceCount}
         * @param instanceCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#instance_count OpsworksMysqlLayer#instance_count}.
         * @return {@code this}
         */
        public Builder instanceCount(java.lang.Number instanceCount) {
            this.instanceCount = instanceCount;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling#getLoadThreshold}
         * @param loadThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#load_threshold OpsworksMysqlLayer#load_threshold}.
         * @return {@code this}
         */
        public Builder loadThreshold(java.lang.Number loadThreshold) {
            this.loadThreshold = loadThreshold;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling#getMemoryThreshold}
         * @param memoryThreshold Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#memory_threshold OpsworksMysqlLayer#memory_threshold}.
         * @return {@code this}
         */
        public Builder memoryThreshold(java.lang.Number memoryThreshold) {
            this.memoryThreshold = memoryThreshold;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling#getThresholdsWaitTime}
         * @param thresholdsWaitTime Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_mysql_layer#thresholds_wait_time OpsworksMysqlLayer#thresholds_wait_time}.
         * @return {@code this}
         */
        public Builder thresholdsWaitTime(java.lang.Number thresholdsWaitTime) {
            this.thresholdsWaitTime = thresholdsWaitTime;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksMysqlLayerLoadBasedAutoScalingUpscaling build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksMysqlLayerLoadBasedAutoScalingUpscaling}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksMysqlLayerLoadBasedAutoScalingUpscaling {
        private final java.util.List<java.lang.String> alarms;
        private final java.lang.Number cpuThreshold;
        private final java.lang.Number ignoreMetricsTime;
        private final java.lang.Number instanceCount;
        private final java.lang.Number loadThreshold;
        private final java.lang.Number memoryThreshold;
        private final java.lang.Number thresholdsWaitTime;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.alarms = software.amazon.jsii.Kernel.get(this, "alarms", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.cpuThreshold = software.amazon.jsii.Kernel.get(this, "cpuThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ignoreMetricsTime = software.amazon.jsii.Kernel.get(this, "ignoreMetricsTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.instanceCount = software.amazon.jsii.Kernel.get(this, "instanceCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.loadThreshold = software.amazon.jsii.Kernel.get(this, "loadThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.memoryThreshold = software.amazon.jsii.Kernel.get(this, "memoryThreshold", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.thresholdsWaitTime = software.amazon.jsii.Kernel.get(this, "thresholdsWaitTime", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.alarms = builder.alarms;
            this.cpuThreshold = builder.cpuThreshold;
            this.ignoreMetricsTime = builder.ignoreMetricsTime;
            this.instanceCount = builder.instanceCount;
            this.loadThreshold = builder.loadThreshold;
            this.memoryThreshold = builder.memoryThreshold;
            this.thresholdsWaitTime = builder.thresholdsWaitTime;
        }

        @Override
        public final java.util.List<java.lang.String> getAlarms() {
            return this.alarms;
        }

        @Override
        public final java.lang.Number getCpuThreshold() {
            return this.cpuThreshold;
        }

        @Override
        public final java.lang.Number getIgnoreMetricsTime() {
            return this.ignoreMetricsTime;
        }

        @Override
        public final java.lang.Number getInstanceCount() {
            return this.instanceCount;
        }

        @Override
        public final java.lang.Number getLoadThreshold() {
            return this.loadThreshold;
        }

        @Override
        public final java.lang.Number getMemoryThreshold() {
            return this.memoryThreshold;
        }

        @Override
        public final java.lang.Number getThresholdsWaitTime() {
            return this.thresholdsWaitTime;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getAlarms() != null) {
                data.set("alarms", om.valueToTree(this.getAlarms()));
            }
            if (this.getCpuThreshold() != null) {
                data.set("cpuThreshold", om.valueToTree(this.getCpuThreshold()));
            }
            if (this.getIgnoreMetricsTime() != null) {
                data.set("ignoreMetricsTime", om.valueToTree(this.getIgnoreMetricsTime()));
            }
            if (this.getInstanceCount() != null) {
                data.set("instanceCount", om.valueToTree(this.getInstanceCount()));
            }
            if (this.getLoadThreshold() != null) {
                data.set("loadThreshold", om.valueToTree(this.getLoadThreshold()));
            }
            if (this.getMemoryThreshold() != null) {
                data.set("memoryThreshold", om.valueToTree(this.getMemoryThreshold()));
            }
            if (this.getThresholdsWaitTime() != null) {
                data.set("thresholdsWaitTime", om.valueToTree(this.getThresholdsWaitTime()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opsworksMysqlLayer.OpsworksMysqlLayerLoadBasedAutoScalingUpscaling"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksMysqlLayerLoadBasedAutoScalingUpscaling.Jsii$Proxy that = (OpsworksMysqlLayerLoadBasedAutoScalingUpscaling.Jsii$Proxy) o;

            if (this.alarms != null ? !this.alarms.equals(that.alarms) : that.alarms != null) return false;
            if (this.cpuThreshold != null ? !this.cpuThreshold.equals(that.cpuThreshold) : that.cpuThreshold != null) return false;
            if (this.ignoreMetricsTime != null ? !this.ignoreMetricsTime.equals(that.ignoreMetricsTime) : that.ignoreMetricsTime != null) return false;
            if (this.instanceCount != null ? !this.instanceCount.equals(that.instanceCount) : that.instanceCount != null) return false;
            if (this.loadThreshold != null ? !this.loadThreshold.equals(that.loadThreshold) : that.loadThreshold != null) return false;
            if (this.memoryThreshold != null ? !this.memoryThreshold.equals(that.memoryThreshold) : that.memoryThreshold != null) return false;
            return this.thresholdsWaitTime != null ? this.thresholdsWaitTime.equals(that.thresholdsWaitTime) : that.thresholdsWaitTime == null;
        }

        @Override
        public final int hashCode() {
            int result = this.alarms != null ? this.alarms.hashCode() : 0;
            result = 31 * result + (this.cpuThreshold != null ? this.cpuThreshold.hashCode() : 0);
            result = 31 * result + (this.ignoreMetricsTime != null ? this.ignoreMetricsTime.hashCode() : 0);
            result = 31 * result + (this.instanceCount != null ? this.instanceCount.hashCode() : 0);
            result = 31 * result + (this.loadThreshold != null ? this.loadThreshold.hashCode() : 0);
            result = 31 * result + (this.memoryThreshold != null ? this.memoryThreshold.hashCode() : 0);
            result = 31 * result + (this.thresholdsWaitTime != null ? this.thresholdsWaitTime.hashCode() : 0);
            return result;
        }
    }
}
