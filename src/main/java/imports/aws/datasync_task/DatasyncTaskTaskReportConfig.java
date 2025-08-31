package imports.aws.datasync_task;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.954Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncTask.DatasyncTaskTaskReportConfig")
@software.amazon.jsii.Jsii.Proxy(DatasyncTaskTaskReportConfig.Jsii$Proxy.class)
public interface DatasyncTaskTaskReportConfig extends software.amazon.jsii.JsiiSerializable {

    /**
     * s3_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_destination DatasyncTask#s3_destination}
     */
    @org.jetbrains.annotations.NotNull imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination getS3Destination();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#output_type DatasyncTask#output_type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOutputType() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_level DatasyncTask#report_level}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getReportLevel() {
        return null;
    }

    /**
     * report_overrides block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_overrides DatasyncTask#report_overrides}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides getReportOverrides() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_object_versioning DatasyncTask#s3_object_versioning}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getS3ObjectVersioning() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncTaskTaskReportConfig}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncTaskTaskReportConfig}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncTaskTaskReportConfig> {
        imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination s3Destination;
        java.lang.String outputType;
        java.lang.String reportLevel;
        imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides reportOverrides;
        java.lang.String s3ObjectVersioning;

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfig#getS3Destination}
         * @param s3Destination s3_destination block. This parameter is required.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_destination DatasyncTask#s3_destination}
         * @return {@code this}
         */
        public Builder s3Destination(imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination s3Destination) {
            this.s3Destination = s3Destination;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfig#getOutputType}
         * @param outputType Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#output_type DatasyncTask#output_type}.
         * @return {@code this}
         */
        public Builder outputType(java.lang.String outputType) {
            this.outputType = outputType;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfig#getReportLevel}
         * @param reportLevel Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_level DatasyncTask#report_level}.
         * @return {@code this}
         */
        public Builder reportLevel(java.lang.String reportLevel) {
            this.reportLevel = reportLevel;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfig#getReportOverrides}
         * @param reportOverrides report_overrides block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#report_overrides DatasyncTask#report_overrides}
         * @return {@code this}
         */
        public Builder reportOverrides(imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides reportOverrides) {
            this.reportOverrides = reportOverrides;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncTaskTaskReportConfig#getS3ObjectVersioning}
         * @param s3ObjectVersioning Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_task#s3_object_versioning DatasyncTask#s3_object_versioning}.
         * @return {@code this}
         */
        public Builder s3ObjectVersioning(java.lang.String s3ObjectVersioning) {
            this.s3ObjectVersioning = s3ObjectVersioning;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncTaskTaskReportConfig}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncTaskTaskReportConfig build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncTaskTaskReportConfig}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncTaskTaskReportConfig {
        private final imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination s3Destination;
        private final java.lang.String outputType;
        private final java.lang.String reportLevel;
        private final imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides reportOverrides;
        private final java.lang.String s3ObjectVersioning;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.s3Destination = software.amazon.jsii.Kernel.get(this, "s3Destination", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination.class));
            this.outputType = software.amazon.jsii.Kernel.get(this, "outputType", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.reportLevel = software.amazon.jsii.Kernel.get(this, "reportLevel", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.reportOverrides = software.amazon.jsii.Kernel.get(this, "reportOverrides", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides.class));
            this.s3ObjectVersioning = software.amazon.jsii.Kernel.get(this, "s3ObjectVersioning", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.s3Destination = java.util.Objects.requireNonNull(builder.s3Destination, "s3Destination is required");
            this.outputType = builder.outputType;
            this.reportLevel = builder.reportLevel;
            this.reportOverrides = builder.reportOverrides;
            this.s3ObjectVersioning = builder.s3ObjectVersioning;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskTaskReportConfigS3Destination getS3Destination() {
            return this.s3Destination;
        }

        @Override
        public final java.lang.String getOutputType() {
            return this.outputType;
        }

        @Override
        public final java.lang.String getReportLevel() {
            return this.reportLevel;
        }

        @Override
        public final imports.aws.datasync_task.DatasyncTaskTaskReportConfigReportOverrides getReportOverrides() {
            return this.reportOverrides;
        }

        @Override
        public final java.lang.String getS3ObjectVersioning() {
            return this.s3ObjectVersioning;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("s3Destination", om.valueToTree(this.getS3Destination()));
            if (this.getOutputType() != null) {
                data.set("outputType", om.valueToTree(this.getOutputType()));
            }
            if (this.getReportLevel() != null) {
                data.set("reportLevel", om.valueToTree(this.getReportLevel()));
            }
            if (this.getReportOverrides() != null) {
                data.set("reportOverrides", om.valueToTree(this.getReportOverrides()));
            }
            if (this.getS3ObjectVersioning() != null) {
                data.set("s3ObjectVersioning", om.valueToTree(this.getS3ObjectVersioning()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncTask.DatasyncTaskTaskReportConfig"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncTaskTaskReportConfig.Jsii$Proxy that = (DatasyncTaskTaskReportConfig.Jsii$Proxy) o;

            if (!s3Destination.equals(that.s3Destination)) return false;
            if (this.outputType != null ? !this.outputType.equals(that.outputType) : that.outputType != null) return false;
            if (this.reportLevel != null ? !this.reportLevel.equals(that.reportLevel) : that.reportLevel != null) return false;
            if (this.reportOverrides != null ? !this.reportOverrides.equals(that.reportOverrides) : that.reportOverrides != null) return false;
            return this.s3ObjectVersioning != null ? this.s3ObjectVersioning.equals(that.s3ObjectVersioning) : that.s3ObjectVersioning == null;
        }

        @Override
        public final int hashCode() {
            int result = this.s3Destination.hashCode();
            result = 31 * result + (this.outputType != null ? this.outputType.hashCode() : 0);
            result = 31 * result + (this.reportLevel != null ? this.reportLevel.hashCode() : 0);
            result = 31 * result + (this.reportOverrides != null ? this.reportOverrides.hashCode() : 0);
            result = 31 * result + (this.s3ObjectVersioning != null ? this.s3ObjectVersioning.hashCode() : 0);
            return result;
        }
    }
}
