package imports.aws.kinesisanalyticsv2_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.474Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput")
@software.amazon.jsii.Jsii.Proxy(Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput.Jsii$Proxy.class)
public interface Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput extends software.amazon.jsii.JsiiSerializable {

    /**
     * destination_schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#destination_schema Kinesisanalyticsv2Application#destination_schema}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema getDestinationSchema();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#name Kinesisanalyticsv2Application#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * kinesis_firehose_output block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_firehose_output Kinesisanalyticsv2Application#kinesis_firehose_output}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput getKinesisFirehoseOutput() {
        return null;
    }

    /**
     * kinesis_streams_output block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_streams_output Kinesisanalyticsv2Application#kinesis_streams_output}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput getKinesisStreamsOutput() {
        return null;
    }

    /**
     * lambda_output block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#lambda_output Kinesisanalyticsv2Application#lambda_output}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput getLambdaOutput() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput}
     */
    public static final class Builder implements software.amazon.jsii.Builder<Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput> {
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema destinationSchema;
        java.lang.String name;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput kinesisFirehoseOutput;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput kinesisStreamsOutput;
        imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput lambdaOutput;

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput#getDestinationSchema}
         * @param destinationSchema destination_schema block. This parameter is required.
         *                          Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#destination_schema Kinesisanalyticsv2Application#destination_schema}
         * @return {@code this}
         */
        public Builder destinationSchema(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema destinationSchema) {
            this.destinationSchema = destinationSchema;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#name Kinesisanalyticsv2Application#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput#getKinesisFirehoseOutput}
         * @param kinesisFirehoseOutput kinesis_firehose_output block.
         *                              Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_firehose_output Kinesisanalyticsv2Application#kinesis_firehose_output}
         * @return {@code this}
         */
        public Builder kinesisFirehoseOutput(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput kinesisFirehoseOutput) {
            this.kinesisFirehoseOutput = kinesisFirehoseOutput;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput#getKinesisStreamsOutput}
         * @param kinesisStreamsOutput kinesis_streams_output block.
         *                             Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#kinesis_streams_output Kinesisanalyticsv2Application#kinesis_streams_output}
         * @return {@code this}
         */
        public Builder kinesisStreamsOutput(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput kinesisStreamsOutput) {
            this.kinesisStreamsOutput = kinesisStreamsOutput;
            return this;
        }

        /**
         * Sets the value of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput#getLambdaOutput}
         * @param lambdaOutput lambda_output block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesisanalyticsv2_application#lambda_output Kinesisanalyticsv2Application#lambda_output}
         * @return {@code this}
         */
        public Builder lambdaOutput(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput lambdaOutput) {
            this.lambdaOutput = lambdaOutput;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput {
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema destinationSchema;
        private final java.lang.String name;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput kinesisFirehoseOutput;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput kinesisStreamsOutput;
        private final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput lambdaOutput;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.destinationSchema = software.amazon.jsii.Kernel.get(this, "destinationSchema", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema.class));
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.kinesisFirehoseOutput = software.amazon.jsii.Kernel.get(this, "kinesisFirehoseOutput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput.class));
            this.kinesisStreamsOutput = software.amazon.jsii.Kernel.get(this, "kinesisStreamsOutput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput.class));
            this.lambdaOutput = software.amazon.jsii.Kernel.get(this, "lambdaOutput", software.amazon.jsii.NativeType.forClass(imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.destinationSchema = java.util.Objects.requireNonNull(builder.destinationSchema, "destinationSchema is required");
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.kinesisFirehoseOutput = builder.kinesisFirehoseOutput;
            this.kinesisStreamsOutput = builder.kinesisStreamsOutput;
            this.lambdaOutput = builder.lambdaOutput;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputDestinationSchema getDestinationSchema() {
            return this.destinationSchema;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisFirehoseOutput getKinesisFirehoseOutput() {
            return this.kinesisFirehoseOutput;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputKinesisStreamsOutput getKinesisStreamsOutput() {
            return this.kinesisStreamsOutput;
        }

        @Override
        public final imports.aws.kinesisanalyticsv2_application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutputLambdaOutput getLambdaOutput() {
            return this.lambdaOutput;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("destinationSchema", om.valueToTree(this.getDestinationSchema()));
            data.set("name", om.valueToTree(this.getName()));
            if (this.getKinesisFirehoseOutput() != null) {
                data.set("kinesisFirehoseOutput", om.valueToTree(this.getKinesisFirehoseOutput()));
            }
            if (this.getKinesisStreamsOutput() != null) {
                data.set("kinesisStreamsOutput", om.valueToTree(this.getKinesisStreamsOutput()));
            }
            if (this.getLambdaOutput() != null) {
                data.set("lambdaOutput", om.valueToTree(this.getLambdaOutput()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisanalyticsv2Application.Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput.Jsii$Proxy that = (Kinesisanalyticsv2ApplicationApplicationConfigurationSqlApplicationConfigurationOutput.Jsii$Proxy) o;

            if (!destinationSchema.equals(that.destinationSchema)) return false;
            if (!name.equals(that.name)) return false;
            if (this.kinesisFirehoseOutput != null ? !this.kinesisFirehoseOutput.equals(that.kinesisFirehoseOutput) : that.kinesisFirehoseOutput != null) return false;
            if (this.kinesisStreamsOutput != null ? !this.kinesisStreamsOutput.equals(that.kinesisStreamsOutput) : that.kinesisStreamsOutput != null) return false;
            return this.lambdaOutput != null ? this.lambdaOutput.equals(that.lambdaOutput) : that.lambdaOutput == null;
        }

        @Override
        public final int hashCode() {
            int result = this.destinationSchema.hashCode();
            result = 31 * result + (this.name.hashCode());
            result = 31 * result + (this.kinesisFirehoseOutput != null ? this.kinesisFirehoseOutput.hashCode() : 0);
            result = 31 * result + (this.kinesisStreamsOutput != null ? this.kinesisStreamsOutput.hashCode() : 0);
            result = 31 * result + (this.lambdaOutput != null ? this.lambdaOutput.hashCode() : 0);
            return result;
        }
    }
}
