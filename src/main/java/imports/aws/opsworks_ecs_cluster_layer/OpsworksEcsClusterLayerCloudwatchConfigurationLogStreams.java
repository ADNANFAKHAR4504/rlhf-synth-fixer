package imports.aws.opsworks_ecs_cluster_layer;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.007Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.opsworksEcsClusterLayer.OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams")
@software.amazon.jsii.Jsii.Proxy(OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams.Jsii$Proxy.class)
public interface OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#file OpsworksEcsClusterLayer#file}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getFile();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#log_group_name OpsworksEcsClusterLayer#log_group_name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLogGroupName();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#batch_count OpsworksEcsClusterLayer#batch_count}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBatchCount() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#batch_size OpsworksEcsClusterLayer#batch_size}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBatchSize() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#buffer_duration OpsworksEcsClusterLayer#buffer_duration}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Number getBufferDuration() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#datetime_format OpsworksEcsClusterLayer#datetime_format}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDatetimeFormat() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#encoding OpsworksEcsClusterLayer#encoding}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncoding() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#file_fingerprint_lines OpsworksEcsClusterLayer#file_fingerprint_lines}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getFileFingerprintLines() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#initial_position OpsworksEcsClusterLayer#initial_position}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getInitialPosition() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#multiline_start_pattern OpsworksEcsClusterLayer#multiline_start_pattern}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMultilineStartPattern() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#time_zone OpsworksEcsClusterLayer#time_zone}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTimeZone() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams}
     */
    public static final class Builder implements software.amazon.jsii.Builder<OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams> {
        java.lang.String file;
        java.lang.String logGroupName;
        java.lang.Number batchCount;
        java.lang.Number batchSize;
        java.lang.Number bufferDuration;
        java.lang.String datetimeFormat;
        java.lang.String encoding;
        java.lang.String fileFingerprintLines;
        java.lang.String initialPosition;
        java.lang.String multilineStartPattern;
        java.lang.String timeZone;

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getFile}
         * @param file Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#file OpsworksEcsClusterLayer#file}. This parameter is required.
         * @return {@code this}
         */
        public Builder file(java.lang.String file) {
            this.file = file;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getLogGroupName}
         * @param logGroupName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#log_group_name OpsworksEcsClusterLayer#log_group_name}. This parameter is required.
         * @return {@code this}
         */
        public Builder logGroupName(java.lang.String logGroupName) {
            this.logGroupName = logGroupName;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getBatchCount}
         * @param batchCount Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#batch_count OpsworksEcsClusterLayer#batch_count}.
         * @return {@code this}
         */
        public Builder batchCount(java.lang.Number batchCount) {
            this.batchCount = batchCount;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getBatchSize}
         * @param batchSize Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#batch_size OpsworksEcsClusterLayer#batch_size}.
         * @return {@code this}
         */
        public Builder batchSize(java.lang.Number batchSize) {
            this.batchSize = batchSize;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getBufferDuration}
         * @param bufferDuration Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#buffer_duration OpsworksEcsClusterLayer#buffer_duration}.
         * @return {@code this}
         */
        public Builder bufferDuration(java.lang.Number bufferDuration) {
            this.bufferDuration = bufferDuration;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getDatetimeFormat}
         * @param datetimeFormat Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#datetime_format OpsworksEcsClusterLayer#datetime_format}.
         * @return {@code this}
         */
        public Builder datetimeFormat(java.lang.String datetimeFormat) {
            this.datetimeFormat = datetimeFormat;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getEncoding}
         * @param encoding Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#encoding OpsworksEcsClusterLayer#encoding}.
         * @return {@code this}
         */
        public Builder encoding(java.lang.String encoding) {
            this.encoding = encoding;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getFileFingerprintLines}
         * @param fileFingerprintLines Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#file_fingerprint_lines OpsworksEcsClusterLayer#file_fingerprint_lines}.
         * @return {@code this}
         */
        public Builder fileFingerprintLines(java.lang.String fileFingerprintLines) {
            this.fileFingerprintLines = fileFingerprintLines;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getInitialPosition}
         * @param initialPosition Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#initial_position OpsworksEcsClusterLayer#initial_position}.
         * @return {@code this}
         */
        public Builder initialPosition(java.lang.String initialPosition) {
            this.initialPosition = initialPosition;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getMultilineStartPattern}
         * @param multilineStartPattern Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#multiline_start_pattern OpsworksEcsClusterLayer#multiline_start_pattern}.
         * @return {@code this}
         */
        public Builder multilineStartPattern(java.lang.String multilineStartPattern) {
            this.multilineStartPattern = multilineStartPattern;
            return this;
        }

        /**
         * Sets the value of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams#getTimeZone}
         * @param timeZone Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/opsworks_ecs_cluster_layer#time_zone OpsworksEcsClusterLayer#time_zone}.
         * @return {@code this}
         */
        public Builder timeZone(java.lang.String timeZone) {
            this.timeZone = timeZone;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams {
        private final java.lang.String file;
        private final java.lang.String logGroupName;
        private final java.lang.Number batchCount;
        private final java.lang.Number batchSize;
        private final java.lang.Number bufferDuration;
        private final java.lang.String datetimeFormat;
        private final java.lang.String encoding;
        private final java.lang.String fileFingerprintLines;
        private final java.lang.String initialPosition;
        private final java.lang.String multilineStartPattern;
        private final java.lang.String timeZone;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.file = software.amazon.jsii.Kernel.get(this, "file", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.logGroupName = software.amazon.jsii.Kernel.get(this, "logGroupName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.batchCount = software.amazon.jsii.Kernel.get(this, "batchCount", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.batchSize = software.amazon.jsii.Kernel.get(this, "batchSize", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.bufferDuration = software.amazon.jsii.Kernel.get(this, "bufferDuration", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.datetimeFormat = software.amazon.jsii.Kernel.get(this, "datetimeFormat", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encoding = software.amazon.jsii.Kernel.get(this, "encoding", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.fileFingerprintLines = software.amazon.jsii.Kernel.get(this, "fileFingerprintLines", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.initialPosition = software.amazon.jsii.Kernel.get(this, "initialPosition", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.multilineStartPattern = software.amazon.jsii.Kernel.get(this, "multilineStartPattern", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.timeZone = software.amazon.jsii.Kernel.get(this, "timeZone", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.file = java.util.Objects.requireNonNull(builder.file, "file is required");
            this.logGroupName = java.util.Objects.requireNonNull(builder.logGroupName, "logGroupName is required");
            this.batchCount = builder.batchCount;
            this.batchSize = builder.batchSize;
            this.bufferDuration = builder.bufferDuration;
            this.datetimeFormat = builder.datetimeFormat;
            this.encoding = builder.encoding;
            this.fileFingerprintLines = builder.fileFingerprintLines;
            this.initialPosition = builder.initialPosition;
            this.multilineStartPattern = builder.multilineStartPattern;
            this.timeZone = builder.timeZone;
        }

        @Override
        public final java.lang.String getFile() {
            return this.file;
        }

        @Override
        public final java.lang.String getLogGroupName() {
            return this.logGroupName;
        }

        @Override
        public final java.lang.Number getBatchCount() {
            return this.batchCount;
        }

        @Override
        public final java.lang.Number getBatchSize() {
            return this.batchSize;
        }

        @Override
        public final java.lang.Number getBufferDuration() {
            return this.bufferDuration;
        }

        @Override
        public final java.lang.String getDatetimeFormat() {
            return this.datetimeFormat;
        }

        @Override
        public final java.lang.String getEncoding() {
            return this.encoding;
        }

        @Override
        public final java.lang.String getFileFingerprintLines() {
            return this.fileFingerprintLines;
        }

        @Override
        public final java.lang.String getInitialPosition() {
            return this.initialPosition;
        }

        @Override
        public final java.lang.String getMultilineStartPattern() {
            return this.multilineStartPattern;
        }

        @Override
        public final java.lang.String getTimeZone() {
            return this.timeZone;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("file", om.valueToTree(this.getFile()));
            data.set("logGroupName", om.valueToTree(this.getLogGroupName()));
            if (this.getBatchCount() != null) {
                data.set("batchCount", om.valueToTree(this.getBatchCount()));
            }
            if (this.getBatchSize() != null) {
                data.set("batchSize", om.valueToTree(this.getBatchSize()));
            }
            if (this.getBufferDuration() != null) {
                data.set("bufferDuration", om.valueToTree(this.getBufferDuration()));
            }
            if (this.getDatetimeFormat() != null) {
                data.set("datetimeFormat", om.valueToTree(this.getDatetimeFormat()));
            }
            if (this.getEncoding() != null) {
                data.set("encoding", om.valueToTree(this.getEncoding()));
            }
            if (this.getFileFingerprintLines() != null) {
                data.set("fileFingerprintLines", om.valueToTree(this.getFileFingerprintLines()));
            }
            if (this.getInitialPosition() != null) {
                data.set("initialPosition", om.valueToTree(this.getInitialPosition()));
            }
            if (this.getMultilineStartPattern() != null) {
                data.set("multilineStartPattern", om.valueToTree(this.getMultilineStartPattern()));
            }
            if (this.getTimeZone() != null) {
                data.set("timeZone", om.valueToTree(this.getTimeZone()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.opsworksEcsClusterLayer.OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams.Jsii$Proxy that = (OpsworksEcsClusterLayerCloudwatchConfigurationLogStreams.Jsii$Proxy) o;

            if (!file.equals(that.file)) return false;
            if (!logGroupName.equals(that.logGroupName)) return false;
            if (this.batchCount != null ? !this.batchCount.equals(that.batchCount) : that.batchCount != null) return false;
            if (this.batchSize != null ? !this.batchSize.equals(that.batchSize) : that.batchSize != null) return false;
            if (this.bufferDuration != null ? !this.bufferDuration.equals(that.bufferDuration) : that.bufferDuration != null) return false;
            if (this.datetimeFormat != null ? !this.datetimeFormat.equals(that.datetimeFormat) : that.datetimeFormat != null) return false;
            if (this.encoding != null ? !this.encoding.equals(that.encoding) : that.encoding != null) return false;
            if (this.fileFingerprintLines != null ? !this.fileFingerprintLines.equals(that.fileFingerprintLines) : that.fileFingerprintLines != null) return false;
            if (this.initialPosition != null ? !this.initialPosition.equals(that.initialPosition) : that.initialPosition != null) return false;
            if (this.multilineStartPattern != null ? !this.multilineStartPattern.equals(that.multilineStartPattern) : that.multilineStartPattern != null) return false;
            return this.timeZone != null ? this.timeZone.equals(that.timeZone) : that.timeZone == null;
        }

        @Override
        public final int hashCode() {
            int result = this.file.hashCode();
            result = 31 * result + (this.logGroupName.hashCode());
            result = 31 * result + (this.batchCount != null ? this.batchCount.hashCode() : 0);
            result = 31 * result + (this.batchSize != null ? this.batchSize.hashCode() : 0);
            result = 31 * result + (this.bufferDuration != null ? this.bufferDuration.hashCode() : 0);
            result = 31 * result + (this.datetimeFormat != null ? this.datetimeFormat.hashCode() : 0);
            result = 31 * result + (this.encoding != null ? this.encoding.hashCode() : 0);
            result = 31 * result + (this.fileFingerprintLines != null ? this.fileFingerprintLines.hashCode() : 0);
            result = 31 * result + (this.initialPosition != null ? this.initialPosition.hashCode() : 0);
            result = 31 * result + (this.multilineStartPattern != null ? this.multilineStartPattern.hashCode() : 0);
            result = 31 * result + (this.timeZone != null ? this.timeZone.hashCode() : 0);
            return result;
        }
    }
}
