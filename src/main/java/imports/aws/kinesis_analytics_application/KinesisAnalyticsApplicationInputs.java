package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.443Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputs")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationInputs.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationInputs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#name_prefix KinesisAnalyticsApplication#name_prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix();

    /**
     * schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#schema KinesisAnalyticsApplication#schema}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchema getSchema();

    /**
     * kinesis_firehose block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_firehose KinesisAnalyticsApplication#kinesis_firehose}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisFirehose getKinesisFirehose() {
        return null;
    }

    /**
     * kinesis_stream block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_stream KinesisAnalyticsApplication#kinesis_stream}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisStream getKinesisStream() {
        return null;
    }

    /**
     * parallelism block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#parallelism KinesisAnalyticsApplication#parallelism}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsParallelism getParallelism() {
        return null;
    }

    /**
     * processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#processing_configuration KinesisAnalyticsApplication#processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration getProcessingConfiguration() {
        return null;
    }

    /**
     * starting_position_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#starting_position_configuration KinesisAnalyticsApplication#starting_position_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getStartingPositionConfiguration() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationInputs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationInputs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationInputs> {
        java.lang.String namePrefix;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchema schema;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisFirehose kinesisFirehose;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisStream kinesisStream;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsParallelism parallelism;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration processingConfiguration;
        java.lang.Object startingPositionConfiguration;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#name_prefix KinesisAnalyticsApplication#name_prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getSchema}
         * @param schema schema block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#schema KinesisAnalyticsApplication#schema}
         * @return {@code this}
         */
        public Builder schema(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchema schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getKinesisFirehose}
         * @param kinesisFirehose kinesis_firehose block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_firehose KinesisAnalyticsApplication#kinesis_firehose}
         * @return {@code this}
         */
        public Builder kinesisFirehose(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisFirehose kinesisFirehose) {
            this.kinesisFirehose = kinesisFirehose;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getKinesisStream}
         * @param kinesisStream kinesis_stream block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_stream KinesisAnalyticsApplication#kinesis_stream}
         * @return {@code this}
         */
        public Builder kinesisStream(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisStream kinesisStream) {
            this.kinesisStream = kinesisStream;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getParallelism}
         * @param parallelism parallelism block.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#parallelism KinesisAnalyticsApplication#parallelism}
         * @return {@code this}
         */
        public Builder parallelism(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsParallelism parallelism) {
            this.parallelism = parallelism;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getProcessingConfiguration}
         * @param processingConfiguration processing_configuration block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#processing_configuration KinesisAnalyticsApplication#processing_configuration}
         * @return {@code this}
         */
        public Builder processingConfiguration(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration processingConfiguration) {
            this.processingConfiguration = processingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getStartingPositionConfiguration}
         * @param startingPositionConfiguration starting_position_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#starting_position_configuration KinesisAnalyticsApplication#starting_position_configuration}
         * @return {@code this}
         */
        public Builder startingPositionConfiguration(com.hashicorp.cdktf.IResolvable startingPositionConfiguration) {
            this.startingPositionConfiguration = startingPositionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationInputs#getStartingPositionConfiguration}
         * @param startingPositionConfiguration starting_position_configuration block.
         *                                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#starting_position_configuration KinesisAnalyticsApplication#starting_position_configuration}
         * @return {@code this}
         */
        public Builder startingPositionConfiguration(java.util.List<? extends imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsStartingPositionConfiguration> startingPositionConfiguration) {
            this.startingPositionConfiguration = startingPositionConfiguration;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationInputs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationInputs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationInputs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationInputs {
        private final java.lang.String namePrefix;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchema schema;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisFirehose kinesisFirehose;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisStream kinesisStream;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsParallelism parallelism;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration processingConfiguration;
        private final java.lang.Object startingPositionConfiguration;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchema.class));
            this.kinesisFirehose = software.amazon.jsii.Kernel.get(this, "kinesisFirehose", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisFirehose.class));
            this.kinesisStream = software.amazon.jsii.Kernel.get(this, "kinesisStream", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisStream.class));
            this.parallelism = software.amazon.jsii.Kernel.get(this, "parallelism", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsParallelism.class));
            this.processingConfiguration = software.amazon.jsii.Kernel.get(this, "processingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration.class));
            this.startingPositionConfiguration = software.amazon.jsii.Kernel.get(this, "startingPositionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.namePrefix = java.util.Objects.requireNonNull(builder.namePrefix, "namePrefix is required");
            this.schema = java.util.Objects.requireNonNull(builder.schema, "schema is required");
            this.kinesisFirehose = builder.kinesisFirehose;
            this.kinesisStream = builder.kinesisStream;
            this.parallelism = builder.parallelism;
            this.processingConfiguration = builder.processingConfiguration;
            this.startingPositionConfiguration = builder.startingPositionConfiguration;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsSchema getSchema() {
            return this.schema;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisFirehose getKinesisFirehose() {
            return this.kinesisFirehose;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsKinesisStream getKinesisStream() {
            return this.kinesisStream;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsParallelism getParallelism() {
            return this.parallelism;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationInputsProcessingConfiguration getProcessingConfiguration() {
            return this.processingConfiguration;
        }

        @Override
        public final java.lang.Object getStartingPositionConfiguration() {
            return this.startingPositionConfiguration;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            data.set("schema", om.valueToTree(this.getSchema()));
            if (this.getKinesisFirehose() != null) {
                data.set("kinesisFirehose", om.valueToTree(this.getKinesisFirehose()));
            }
            if (this.getKinesisStream() != null) {
                data.set("kinesisStream", om.valueToTree(this.getKinesisStream()));
            }
            if (this.getParallelism() != null) {
                data.set("parallelism", om.valueToTree(this.getParallelism()));
            }
            if (this.getProcessingConfiguration() != null) {
                data.set("processingConfiguration", om.valueToTree(this.getProcessingConfiguration()));
            }
            if (this.getStartingPositionConfiguration() != null) {
                data.set("startingPositionConfiguration", om.valueToTree(this.getStartingPositionConfiguration()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationInputs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationInputs.Jsii$Proxy that = (KinesisAnalyticsApplicationInputs.Jsii$Proxy) o;

            if (!namePrefix.equals(that.namePrefix)) return false;
            if (!schema.equals(that.schema)) return false;
            if (this.kinesisFirehose != null ? !this.kinesisFirehose.equals(that.kinesisFirehose) : that.kinesisFirehose != null) return false;
            if (this.kinesisStream != null ? !this.kinesisStream.equals(that.kinesisStream) : that.kinesisStream != null) return false;
            if (this.parallelism != null ? !this.parallelism.equals(that.parallelism) : that.parallelism != null) return false;
            if (this.processingConfiguration != null ? !this.processingConfiguration.equals(that.processingConfiguration) : that.processingConfiguration != null) return false;
            return this.startingPositionConfiguration != null ? this.startingPositionConfiguration.equals(that.startingPositionConfiguration) : that.startingPositionConfiguration == null;
        }

        @Override
        public final int hashCode() {
            int result = this.namePrefix.hashCode();
            result = 31 * result + (this.schema.hashCode());
            result = 31 * result + (this.kinesisFirehose != null ? this.kinesisFirehose.hashCode() : 0);
            result = 31 * result + (this.kinesisStream != null ? this.kinesisStream.hashCode() : 0);
            result = 31 * result + (this.parallelism != null ? this.parallelism.hashCode() : 0);
            result = 31 * result + (this.processingConfiguration != null ? this.processingConfiguration.hashCode() : 0);
            result = 31 * result + (this.startingPositionConfiguration != null ? this.startingPositionConfiguration.hashCode() : 0);
            return result;
        }
    }
}
