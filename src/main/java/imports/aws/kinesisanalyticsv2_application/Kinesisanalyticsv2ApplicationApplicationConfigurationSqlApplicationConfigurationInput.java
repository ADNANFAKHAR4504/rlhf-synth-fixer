package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.472Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput extends software.amazon.jsii.JsiiSerializable {

    /**
     * input_schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_schema Kinesisanalyticsv2Application#input_schema}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchema getInputSchema();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#name_prefix Kinesisanalyticsv2Application#name_prefix}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getNamePrefix();

    /**
     * input_parallelism block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_parallelism Kinesisanalyticsv2Application#input_parallelism}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism getInputParallelism() {
        return null;
    }

    /**
     * input_processing_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_processing_configuration Kinesisanalyticsv2Application#input_processing_configuration}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputProcessingConfiguration getInputProcessingConfiguration() {
        return null;
    }

    /**
     * input_starting_position_configuration block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_starting_position_configuration Kinesisanalyticsv2Application#input_starting_position_configuration}
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getInputStartingPositionConfiguration() {
        return null;
    }

    /**
     * kinesis_firehose_input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_firehose_input Kinesisanalyticsv2Application#kinesis_firehose_input}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisFirehoseInput getKinesisFirehoseInput() {
        return null;
    }

    /**
     * kinesis_streams_input block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_streams_input Kinesisanalyticsv2Application#kinesis_streams_input}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisStreamsInput getKinesisStreamsInput() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput> {
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchema inputSchema;
        java.lang.String namePrefix;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism inputParallelism;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputProcessingConfiguration inputProcessingConfiguration;
        java.lang.Object inputStartingPositionConfiguration;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisFirehoseInput kinesisFirehoseInput;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisStreamsInput kinesisStreamsInput;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getInputSchema}
         * @param inputSchema input_schema block. This parameter is required.
         *                    Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_schema Kinesisanalyticsv2Application#input_schema}
         * @return {@code this}
         */
        public Builder inputSchema(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchema inputSchema) {
            this.inputSchema = inputSchema;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getNamePrefix}
         * @param namePrefix Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#name_prefix Kinesisanalyticsv2Application#name_prefix}. This parameter is required.
         * @return {@code this}
         */
        public Builder namePrefix(java.lang.String namePrefix) {
            this.namePrefix = namePrefix;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getInputParallelism}
         * @param inputParallelism input_parallelism block.
         *                         Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_parallelism Kinesisanalyticsv2Application#input_parallelism}
         * @return {@code this}
         */
        public Builder inputParallelism(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism inputParallelism) {
            this.inputParallelism = inputParallelism;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getInputProcessingConfiguration}
         * @param inputProcessingConfiguration input_processing_configuration block.
         *                                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_processing_configuration Kinesisanalyticsv2Application#input_processing_configuration}
         * @return {@code this}
         */
        public Builder inputProcessingConfiguration(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputProcessingConfiguration inputProcessingConfiguration) {
            this.inputProcessingConfiguration = inputProcessingConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getInputStartingPositionConfiguration}
         * @param inputStartingPositionConfiguration input_starting_position_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_starting_position_configuration Kinesisanalyticsv2Application#input_starting_position_configuration}
         * @return {@code this}
         */
        public Builder inputStartingPositionConfiguration(com.hashicorp.cdktf.IResolvable inputStartingPositionConfiguration) {
            this.inputStartingPositionConfiguration = inputStartingPositionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getInputStartingPositionConfiguration}
         * @param inputStartingPositionConfiguration input_starting_position_configuration block.
         *                                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#input_starting_position_configuration Kinesisanalyticsv2Application#input_starting_position_configuration}
         * @return {@code this}
         */
        public Builder inputStartingPositionConfiguration(java.util.List<? extends imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputStartingPositionConfiguration> inputStartingPositionConfiguration) {
            this.inputStartingPositionConfiguration = inputStartingPositionConfiguration;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getKinesisFirehoseInput}
         * @param kinesisFirehoseInput kinesis_firehose_input block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_firehose_input Kinesisanalyticsv2Application#kinesis_firehose_input}
         * @return {@code this}
         */
        public Builder kinesisFirehoseInput(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisFirehoseInput kinesisFirehoseInput) {
            this.kinesisFirehoseInput = kinesisFirehoseInput;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput#getKinesisStreamsInput}
         * @param kinesisStreamsInput kinesis_streams_input block.
         *                            Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_streams_input Kinesisanalyticsv2Application#kinesis_streams_input}
         * @return {@code this}
         */
        public Builder kinesisStreamsInput(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisStreamsInput kinesisStreamsInput) {
            this.kinesisStreamsInput = kinesisStreamsInput;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput {
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchema inputSchema;
        private final java.lang.String namePrefix;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism inputParallelism;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputProcessingConfiguration inputProcessingConfiguration;
        private final java.lang.Object inputStartingPositionConfiguration;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisFirehoseInput kinesisFirehoseInput;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisStreamsInput kinesisStreamsInput;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.inputSchema = software.amazon.jsii.Kernel.get(this, "inputSchema", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchema.class));
            this.namePrefix = software.amazon.jsii.Kernel.get(this, "namePrefix", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.inputParallelism = software.amazon.jsii.Kernel.get(this, "inputParallelism", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism.class));
            this.inputProcessingConfiguration = software.amazon.jsii.Kernel.get(this, "inputProcessingConfiguration", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputProcessingConfiguration.class));
            this.inputStartingPositionConfiguration = software.amazon.jsii.Kernel.get(this, "inputStartingPositionConfiguration", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.kinesisFirehoseInput = software.amazon.jsii.Kernel.get(this, "kinesisFirehoseInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisFirehoseInput.class));
            this.kinesisStreamsInput = software.amazon.jsii.Kernel.get(this, "kinesisStreamsInput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisStreamsInput.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.inputSchema = java.util.Objects.requireNonNull(builder.inputSchema, "inputSchema is required");
            this.namePrefix = java.util.Objects.requireNonNull(builder.namePrefix, "namePrefix is required");
            this.inputParallelism = builder.inputParallelism;
            this.inputProcessingConfiguration = builder.inputProcessingConfiguration;
            this.inputStartingPositionConfiguration = builder.inputStartingPositionConfiguration;
            this.kinesisFirehoseInput = builder.kinesisFirehoseInput;
            this.kinesisStreamsInput = builder.kinesisStreamsInput;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputSchema getInputSchema() {
            return this.inputSchema;
        }

        @Override
        public final java.lang.String getNamePrefix() {
            return this.namePrefix;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputParallelism getInputParallelism() {
            return this.inputParallelism;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputInputProcessingConfiguration getInputProcessingConfiguration() {
            return this.inputProcessingConfiguration;
        }

        @Override
        public final java.lang.Object getInputStartingPositionConfiguration() {
            return this.inputStartingPositionConfiguration;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisFirehoseInput getKinesisFirehoseInput() {
            return this.kinesisFirehoseInput;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInputKinesisStreamsInput getKinesisStreamsInput() {
            return this.kinesisStreamsInput;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("inputSchema", om.valueToTree(this.getInputSchema()));
            data.set("namePrefix", om.valueToTree(this.getNamePrefix()));
            if (this.getInputParallelism() != null) {
                data.set("inputParallelism", om.valueToTree(this.getInputParallelism()));
            }
            if (this.getInputProcessingConfiguration() != null) {
                data.set("inputProcessingConfiguration", om.valueToTree(this.getInputProcessingConfiguration()));
            }
            if (this.getInputStartingPositionConfiguration() != null) {
                data.set("inputStartingPositionConfiguration", om.valueToTree(this.getInputStartingPositionConfiguration()));
            }
            if (this.getKinesisFirehoseInput() != null) {
                data.set("kinesisFirehoseInput", om.valueToTree(this.getKinesisFirehoseInput()));
            }
            if (this.getKinesisStreamsInput() != null) {
                data.set("kinesisStreamsInput", om.valueToTree(this.getKinesisStreamsInput()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationInput.Jsii$Proxy) o;

            if (!inputSchema.equals(that.inputSchema)) return false;
            if (!namePrefix.equals(that.namePrefix)) return false;
            if (this.inputParallelism != null ? !this.inputParallelism.equals(that.inputParallelism) : that.inputParallelism != null) return false;
            if (this.inputProcessingConfiguration != null ? !this.inputProcessingConfiguration.equals(that.inputProcessingConfiguration) : that.inputProcessingConfiguration != null) return false;
            if (this.inputStartingPositionConfiguration != null ? !this.inputStartingPositionConfiguration.equals(that.inputStartingPositionConfiguration) : that.inputStartingPositionConfiguration != null) return false;
            if (this.kinesisFirehoseInput != null ? !this.kinesisFirehoseInput.equals(that.kinesisFirehoseInput) : that.kinesisFirehoseInput != null) return false;
            return this.kinesisStreamsInput != null ? this.kinesisStreamsInput.equals(that.kinesisStreamsInput) : that.kinesisStreamsInput == null;
        }

        @Override
        public final int hashCode() {
            int result = this.inputSchema.hashCode();
            result = 31 * result + (this.namePrefix.hashCode());
            result = 31 * result + (this.inputParallelism != null ? this.inputParallelism.hashCode() : 0);
            result = 31 * result + (this.inputProcessingConfiguration != null ? this.inputProcessingConfiguration.hashCode() : 0);
            result = 31 * result + (this.inputStartingPositionConfiguration != null ? this.inputStartingPositionConfiguration.hashCode() : 0);
            result = 31 * result + (this.kinesisFirehoseInput != null ? this.kinesisFirehoseInput.hashCode() : 0);
            result = 31 * result + (this.kinesisStreamsInput != null ? this.kinesisStreamsInput.hashCode() : 0);
            return result;
        }
    }
}
