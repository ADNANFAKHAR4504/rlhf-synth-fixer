package imports.aws.flow_log;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.234Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.flowLog.FlowLogDestinationOptions")
@software.amazon.jsii.Jsii.Proxy(FlowLogDestinationOptions.Jsii$Proxy.class)
public interface FlowLogDestinationOptions extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#file_format FlowLog#file_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#hive_compatible_partitions FlowLog#hive_compatible_partitions}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getHiveCompatiblePartitions() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#per_hour_partition FlowLog#per_hour_partition}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getPerHourPartition() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FlowLogDestinationOptions}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FlowLogDestinationOptions}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FlowLogDestinationOptions> {
        java.lang.String fileFormat;
        java.lang.Object hiveCompatiblePartitions;
        java.lang.Object perHourPartition;

        /**
         * Sets the value of {@link FlowLogDestinationOptions#getFileFormat}
         * @param fileFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#file_format FlowLog#file_format}.
         * @return {@code this}
         */
        public Builder fileFormat(java.lang.String fileFormat) {
            this.fileFormat = fileFormat;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogDestinationOptions#getHiveCompatiblePartitions}
         * @param hiveCompatiblePartitions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#hive_compatible_partitions FlowLog#hive_compatible_partitions}.
         * @return {@code this}
         */
        public Builder hiveCompatiblePartitions(java.lang.Boolean hiveCompatiblePartitions) {
            this.hiveCompatiblePartitions = hiveCompatiblePartitions;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogDestinationOptions#getHiveCompatiblePartitions}
         * @param hiveCompatiblePartitions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#hive_compatible_partitions FlowLog#hive_compatible_partitions}.
         * @return {@code this}
         */
        public Builder hiveCompatiblePartitions(com.hashicorp.cdktf.IResolvable hiveCompatiblePartitions) {
            this.hiveCompatiblePartitions = hiveCompatiblePartitions;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogDestinationOptions#getPerHourPartition}
         * @param perHourPartition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#per_hour_partition FlowLog#per_hour_partition}.
         * @return {@code this}
         */
        public Builder perHourPartition(java.lang.Boolean perHourPartition) {
            this.perHourPartition = perHourPartition;
            return this;
        }

        /**
         * Sets the value of {@link FlowLogDestinationOptions#getPerHourPartition}
         * @param perHourPartition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/flow_log#per_hour_partition FlowLog#per_hour_partition}.
         * @return {@code this}
         */
        public Builder perHourPartition(com.hashicorp.cdktf.IResolvable perHourPartition) {
            this.perHourPartition = perHourPartition;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FlowLogDestinationOptions}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FlowLogDestinationOptions build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FlowLogDestinationOptions}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FlowLogDestinationOptions {
        private final java.lang.String fileFormat;
        private final java.lang.Object hiveCompatiblePartitions;
        private final java.lang.Object perHourPartition;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.fileFormat = software.amazon.jsii.Kernel.get(this, "fileFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.hiveCompatiblePartitions = software.amazon.jsii.Kernel.get(this, "hiveCompatiblePartitions", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.perHourPartition = software.amazon.jsii.Kernel.get(this, "perHourPartition", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.fileFormat = builder.fileFormat;
            this.hiveCompatiblePartitions = builder.hiveCompatiblePartitions;
            this.perHourPartition = builder.perHourPartition;
        }

        @Override
        public final java.lang.String getFileFormat() {
            return this.fileFormat;
        }

        @Override
        public final java.lang.Object getHiveCompatiblePartitions() {
            return this.hiveCompatiblePartitions;
        }

        @Override
        public final java.lang.Object getPerHourPartition() {
            return this.perHourPartition;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getFileFormat() != null) {
                data.set("fileFormat", om.valueToTree(this.getFileFormat()));
            }
            if (this.getHiveCompatiblePartitions() != null) {
                data.set("hiveCompatiblePartitions", om.valueToTree(this.getHiveCompatiblePartitions()));
            }
            if (this.getPerHourPartition() != null) {
                data.set("perHourPartition", om.valueToTree(this.getPerHourPartition()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.flowLog.FlowLogDestinationOptions"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FlowLogDestinationOptions.Jsii$Proxy that = (FlowLogDestinationOptions.Jsii$Proxy) o;

            if (this.fileFormat != null ? !this.fileFormat.equals(that.fileFormat) : that.fileFormat != null) return false;
            if (this.hiveCompatiblePartitions != null ? !this.hiveCompatiblePartitions.equals(that.hiveCompatiblePartitions) : that.hiveCompatiblePartitions != null) return false;
            return this.perHourPartition != null ? this.perHourPartition.equals(that.perHourPartition) : that.perHourPartition == null;
        }

        @Override
        public final int hashCode() {
            int result = this.fileFormat != null ? this.fileFormat.hashCode() : 0;
            result = 31 * result + (this.hiveCompatiblePartitions != null ? this.hiveCompatiblePartitions.hashCode() : 0);
            result = 31 * result + (this.perHourPartition != null ? this.perHourPartition.hashCode() : 0);
            return result;
        }
    }
}
