package imports.aws.kinesis_analytics_application;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.444Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationOutputs")
@software.amazon.jsii.Jsii.Proxy(KinesisAnalyticsApplicationOutputs.Jsii$Proxy.class)
public interface KinesisAnalyticsApplicationOutputs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#name KinesisAnalyticsApplication#name}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getName();

    /**
     * schema block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#schema KinesisAnalyticsApplication#schema}
     */
    @org.jetbrains.annotations.NotNull imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsSchema getSchema();

    /**
     * kinesis_firehose block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_firehose KinesisAnalyticsApplication#kinesis_firehose}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisFirehose getKinesisFirehose() {
        return null;
    }

    /**
     * kinesis_stream block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_stream KinesisAnalyticsApplication#kinesis_stream}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisStream getKinesisStream() {
        return null;
    }

    /**
     * lambda block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#lambda KinesisAnalyticsApplication#lambda}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsLambda getLambda() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link KinesisAnalyticsApplicationOutputs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link KinesisAnalyticsApplicationOutputs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<KinesisAnalyticsApplicationOutputs> {
        java.lang.String name;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsSchema schema;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisFirehose kinesisFirehose;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisStream kinesisStream;
        imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsLambda lambda;

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationOutputs#getName}
         * @param name Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#name KinesisAnalyticsApplication#name}. This parameter is required.
         * @return {@code this}
         */
        public Builder name(java.lang.String name) {
            this.name = name;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationOutputs#getSchema}
         * @param schema schema block. This parameter is required.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#schema KinesisAnalyticsApplication#schema}
         * @return {@code this}
         */
        public Builder schema(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsSchema schema) {
            this.schema = schema;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationOutputs#getKinesisFirehose}
         * @param kinesisFirehose kinesis_firehose block.
         *                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_firehose KinesisAnalyticsApplication#kinesis_firehose}
         * @return {@code this}
         */
        public Builder kinesisFirehose(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisFirehose kinesisFirehose) {
            this.kinesisFirehose = kinesisFirehose;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationOutputs#getKinesisStream}
         * @param kinesisStream kinesis_stream block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#kinesis_stream KinesisAnalyticsApplication#kinesis_stream}
         * @return {@code this}
         */
        public Builder kinesisStream(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisStream kinesisStream) {
            this.kinesisStream = kinesisStream;
            return this;
        }

        /**
         * Sets the value of {@link KinesisAnalyticsApplicationOutputs#getLambda}
         * @param lambda lambda block.
         *               Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/kinesis_analytics_application#lambda KinesisAnalyticsApplication#lambda}
         * @return {@code this}
         */
        public Builder lambda(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsLambda lambda) {
            this.lambda = lambda;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link KinesisAnalyticsApplicationOutputs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public KinesisAnalyticsApplicationOutputs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link KinesisAnalyticsApplicationOutputs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements KinesisAnalyticsApplicationOutputs {
        private final java.lang.String name;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsSchema schema;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisFirehose kinesisFirehose;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisStream kinesisStream;
        private final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsLambda lambda;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.name = software.amazon.jsii.Kernel.get(this, "name", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.schema = software.amazon.jsii.Kernel.get(this, "schema", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsSchema.class));
            this.kinesisFirehose = software.amazon.jsii.Kernel.get(this, "kinesisFirehose", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisFirehose.class));
            this.kinesisStream = software.amazon.jsii.Kernel.get(this, "kinesisStream", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisStream.class));
            this.lambda = software.amazon.jsii.Kernel.get(this, "lambda", software.amazon.jsii.NativeType.forClass(imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsLambda.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.name = java.util.Objects.requireNonNull(builder.name, "name is required");
            this.schema = java.util.Objects.requireNonNull(builder.schema, "schema is required");
            this.kinesisFirehose = builder.kinesisFirehose;
            this.kinesisStream = builder.kinesisStream;
            this.lambda = builder.lambda;
        }

        @Override
        public final java.lang.String getName() {
            return this.name;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsSchema getSchema() {
            return this.schema;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisFirehose getKinesisFirehose() {
            return this.kinesisFirehose;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsKinesisStream getKinesisStream() {
            return this.kinesisStream;
        }

        @Override
        public final imports.aws.kinesis_analytics_application.KinesisAnalyticsApplicationOutputsLambda getLambda() {
            return this.lambda;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("name", om.valueToTree(this.getName()));
            data.set("schema", om.valueToTree(this.getSchema()));
            if (this.getKinesisFirehose() != null) {
                data.set("kinesisFirehose", om.valueToTree(this.getKinesisFirehose()));
            }
            if (this.getKinesisStream() != null) {
                data.set("kinesisStream", om.valueToTree(this.getKinesisStream()));
            }
            if (this.getLambda() != null) {
                data.set("lambda", om.valueToTree(this.getLambda()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.kinesisAnalyticsApplication.KinesisAnalyticsApplicationOutputs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            KinesisAnalyticsApplicationOutputs.Jsii$Proxy that = (KinesisAnalyticsApplicationOutputs.Jsii$Proxy) o;

            if (!name.equals(that.name)) return false;
            if (!schema.equals(that.schema)) return false;
            if (this.kinesisFirehose != null ? !this.kinesisFirehose.equals(that.kinesisFirehose) : that.kinesisFirehose != null) return false;
            if (this.kinesisStream != null ? !this.kinesisStream.equals(that.kinesisStream) : that.kinesisStream != null) return false;
            return this.lambda != null ? this.lambda.equals(that.lambda) : that.lambda == null;
        }

        @Override
        public final int hashCode() {
            int result = this.name.hashCode();
            result = 31 * result + (this.schema.hashCode());
            result = 31 * result + (this.kinesisFirehose != null ? this.kinesisFirehose.hashCode() : 0);
            result = 31 * result + (this.kinesisStream != null ? this.kinesisStream.hashCode() : 0);
            result = 31 * result + (this.lambda != null ? this.lambda.hashCode() : 0);
            return result;
        }
    }
}
