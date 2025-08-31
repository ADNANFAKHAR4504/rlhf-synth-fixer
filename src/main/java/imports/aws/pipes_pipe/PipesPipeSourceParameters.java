package imports.aws.pipes_pipe;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.066Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.pipesPipe.PipesPipeSourceParameters")
@software.amazon.jsii.Jsii.Proxy(PipesPipeSourceParameters.Jsii$Proxy.class)
public interface PipesPipeSourceParameters extends software.amazon.jsii.JsiiSerializable {

    /**
     * activemq_broker_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#activemq_broker_parameters PipesPipe#activemq_broker_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters getActivemqBrokerParameters() {
        return null;
    }

    /**
     * dynamodb_stream_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dynamodb_stream_parameters PipesPipe#dynamodb_stream_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters getDynamodbStreamParameters() {
        return null;
    }

    /**
     * filter_criteria block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter_criteria PipesPipe#filter_criteria}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria getFilterCriteria() {
        return null;
    }

    /**
     * kinesis_stream_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters getKinesisStreamParameters() {
        return null;
    }

    /**
     * managed_streaming_kafka_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#managed_streaming_kafka_parameters PipesPipe#managed_streaming_kafka_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters getManagedStreamingKafkaParameters() {
        return null;
    }

    /**
     * rabbitmq_broker_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#rabbitmq_broker_parameters PipesPipe#rabbitmq_broker_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters getRabbitmqBrokerParameters() {
        return null;
    }

    /**
     * self_managed_kafka_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#self_managed_kafka_parameters PipesPipe#self_managed_kafka_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters getSelfManagedKafkaParameters() {
        return null;
    }

    /**
     * sqs_queue_parameters block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters getSqsQueueParameters() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link PipesPipeSourceParameters}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link PipesPipeSourceParameters}
     */
    public static final class Builder implements software.amazon.jsii.Builder<PipesPipeSourceParameters> {
        imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters activemqBrokerParameters;
        imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters dynamodbStreamParameters;
        imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria filterCriteria;
        imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters kinesisStreamParameters;
        imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters managedStreamingKafkaParameters;
        imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters rabbitmqBrokerParameters;
        imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters selfManagedKafkaParameters;
        imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters sqsQueueParameters;

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getActivemqBrokerParameters}
         * @param activemqBrokerParameters activemq_broker_parameters block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#activemq_broker_parameters PipesPipe#activemq_broker_parameters}
         * @return {@code this}
         */
        public Builder activemqBrokerParameters(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters activemqBrokerParameters) {
            this.activemqBrokerParameters = activemqBrokerParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getDynamodbStreamParameters}
         * @param dynamodbStreamParameters dynamodb_stream_parameters block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#dynamodb_stream_parameters PipesPipe#dynamodb_stream_parameters}
         * @return {@code this}
         */
        public Builder dynamodbStreamParameters(imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters dynamodbStreamParameters) {
            this.dynamodbStreamParameters = dynamodbStreamParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getFilterCriteria}
         * @param filterCriteria filter_criteria block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#filter_criteria PipesPipe#filter_criteria}
         * @return {@code this}
         */
        public Builder filterCriteria(imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria filterCriteria) {
            this.filterCriteria = filterCriteria;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getKinesisStreamParameters}
         * @param kinesisStreamParameters kinesis_stream_parameters block.
         *                                Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#kinesis_stream_parameters PipesPipe#kinesis_stream_parameters}
         * @return {@code this}
         */
        public Builder kinesisStreamParameters(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters kinesisStreamParameters) {
            this.kinesisStreamParameters = kinesisStreamParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getManagedStreamingKafkaParameters}
         * @param managedStreamingKafkaParameters managed_streaming_kafka_parameters block.
         *                                        Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#managed_streaming_kafka_parameters PipesPipe#managed_streaming_kafka_parameters}
         * @return {@code this}
         */
        public Builder managedStreamingKafkaParameters(imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters managedStreamingKafkaParameters) {
            this.managedStreamingKafkaParameters = managedStreamingKafkaParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getRabbitmqBrokerParameters}
         * @param rabbitmqBrokerParameters rabbitmq_broker_parameters block.
         *                                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#rabbitmq_broker_parameters PipesPipe#rabbitmq_broker_parameters}
         * @return {@code this}
         */
        public Builder rabbitmqBrokerParameters(imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters rabbitmqBrokerParameters) {
            this.rabbitmqBrokerParameters = rabbitmqBrokerParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getSelfManagedKafkaParameters}
         * @param selfManagedKafkaParameters self_managed_kafka_parameters block.
         *                                   Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#self_managed_kafka_parameters PipesPipe#self_managed_kafka_parameters}
         * @return {@code this}
         */
        public Builder selfManagedKafkaParameters(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters selfManagedKafkaParameters) {
            this.selfManagedKafkaParameters = selfManagedKafkaParameters;
            return this;
        }

        /**
         * Sets the value of {@link PipesPipeSourceParameters#getSqsQueueParameters}
         * @param sqsQueueParameters sqs_queue_parameters block.
         *                           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/pipes_pipe#sqs_queue_parameters PipesPipe#sqs_queue_parameters}
         * @return {@code this}
         */
        public Builder sqsQueueParameters(imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters sqsQueueParameters) {
            this.sqsQueueParameters = sqsQueueParameters;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link PipesPipeSourceParameters}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public PipesPipeSourceParameters build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link PipesPipeSourceParameters}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements PipesPipeSourceParameters {
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters activemqBrokerParameters;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters dynamodbStreamParameters;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria filterCriteria;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters kinesisStreamParameters;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters managedStreamingKafkaParameters;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters rabbitmqBrokerParameters;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters selfManagedKafkaParameters;
        private final imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters sqsQueueParameters;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.activemqBrokerParameters = software.amazon.jsii.Kernel.get(this, "activemqBrokerParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters.class));
            this.dynamodbStreamParameters = software.amazon.jsii.Kernel.get(this, "dynamodbStreamParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters.class));
            this.filterCriteria = software.amazon.jsii.Kernel.get(this, "filterCriteria", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria.class));
            this.kinesisStreamParameters = software.amazon.jsii.Kernel.get(this, "kinesisStreamParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters.class));
            this.managedStreamingKafkaParameters = software.amazon.jsii.Kernel.get(this, "managedStreamingKafkaParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters.class));
            this.rabbitmqBrokerParameters = software.amazon.jsii.Kernel.get(this, "rabbitmqBrokerParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters.class));
            this.selfManagedKafkaParameters = software.amazon.jsii.Kernel.get(this, "selfManagedKafkaParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters.class));
            this.sqsQueueParameters = software.amazon.jsii.Kernel.get(this, "sqsQueueParameters", software.amazon.jsii.NativeType.forClass(imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.activemqBrokerParameters = builder.activemqBrokerParameters;
            this.dynamodbStreamParameters = builder.dynamodbStreamParameters;
            this.filterCriteria = builder.filterCriteria;
            this.kinesisStreamParameters = builder.kinesisStreamParameters;
            this.managedStreamingKafkaParameters = builder.managedStreamingKafkaParameters;
            this.rabbitmqBrokerParameters = builder.rabbitmqBrokerParameters;
            this.selfManagedKafkaParameters = builder.selfManagedKafkaParameters;
            this.sqsQueueParameters = builder.sqsQueueParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersActivemqBrokerParameters getActivemqBrokerParameters() {
            return this.activemqBrokerParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersDynamodbStreamParameters getDynamodbStreamParameters() {
            return this.dynamodbStreamParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersFilterCriteria getFilterCriteria() {
            return this.filterCriteria;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersKinesisStreamParameters getKinesisStreamParameters() {
            return this.kinesisStreamParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersManagedStreamingKafkaParameters getManagedStreamingKafkaParameters() {
            return this.managedStreamingKafkaParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersRabbitmqBrokerParameters getRabbitmqBrokerParameters() {
            return this.rabbitmqBrokerParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersSelfManagedKafkaParameters getSelfManagedKafkaParameters() {
            return this.selfManagedKafkaParameters;
        }

        @Override
        public final imports.aws.pipes_pipe.PipesPipeSourceParametersSqsQueueParameters getSqsQueueParameters() {
            return this.sqsQueueParameters;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getActivemqBrokerParameters() != null) {
                data.set("activemqBrokerParameters", om.valueToTree(this.getActivemqBrokerParameters()));
            }
            if (this.getDynamodbStreamParameters() != null) {
                data.set("dynamodbStreamParameters", om.valueToTree(this.getDynamodbStreamParameters()));
            }
            if (this.getFilterCriteria() != null) {
                data.set("filterCriteria", om.valueToTree(this.getFilterCriteria()));
            }
            if (this.getKinesisStreamParameters() != null) {
                data.set("kinesisStreamParameters", om.valueToTree(this.getKinesisStreamParameters()));
            }
            if (this.getManagedStreamingKafkaParameters() != null) {
                data.set("managedStreamingKafkaParameters", om.valueToTree(this.getManagedStreamingKafkaParameters()));
            }
            if (this.getRabbitmqBrokerParameters() != null) {
                data.set("rabbitmqBrokerParameters", om.valueToTree(this.getRabbitmqBrokerParameters()));
            }
            if (this.getSelfManagedKafkaParameters() != null) {
                data.set("selfManagedKafkaParameters", om.valueToTree(this.getSelfManagedKafkaParameters()));
            }
            if (this.getSqsQueueParameters() != null) {
                data.set("sqsQueueParameters", om.valueToTree(this.getSqsQueueParameters()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.pipesPipe.PipesPipeSourceParameters"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            PipesPipeSourceParameters.Jsii$Proxy that = (PipesPipeSourceParameters.Jsii$Proxy) o;

            if (this.activemqBrokerParameters != null ? !this.activemqBrokerParameters.equals(that.activemqBrokerParameters) : that.activemqBrokerParameters != null) return false;
            if (this.dynamodbStreamParameters != null ? !this.dynamodbStreamParameters.equals(that.dynamodbStreamParameters) : that.dynamodbStreamParameters != null) return false;
            if (this.filterCriteria != null ? !this.filterCriteria.equals(that.filterCriteria) : that.filterCriteria != null) return false;
            if (this.kinesisStreamParameters != null ? !this.kinesisStreamParameters.equals(that.kinesisStreamParameters) : that.kinesisStreamParameters != null) return false;
            if (this.managedStreamingKafkaParameters != null ? !this.managedStreamingKafkaParameters.equals(that.managedStreamingKafkaParameters) : that.managedStreamingKafkaParameters != null) return false;
            if (this.rabbitmqBrokerParameters != null ? !this.rabbitmqBrokerParameters.equals(that.rabbitmqBrokerParameters) : that.rabbitmqBrokerParameters != null) return false;
            if (this.selfManagedKafkaParameters != null ? !this.selfManagedKafkaParameters.equals(that.selfManagedKafkaParameters) : that.selfManagedKafkaParameters != null) return false;
            return this.sqsQueueParameters != null ? this.sqsQueueParameters.equals(that.sqsQueueParameters) : that.sqsQueueParameters == null;
        }

        @Override
        public final int hashCode() {
            int result = this.activemqBrokerParameters != null ? this.activemqBrokerParameters.hashCode() : 0;
            result = 31 * result + (this.dynamodbStreamParameters != null ? this.dynamodbStreamParameters.hashCode() : 0);
            result = 31 * result + (this.filterCriteria != null ? this.filterCriteria.hashCode() : 0);
            result = 31 * result + (this.kinesisStreamParameters != null ? this.kinesisStreamParameters.hashCode() : 0);
            result = 31 * result + (this.managedStreamingKafkaParameters != null ? this.managedStreamingKafkaParameters.hashCode() : 0);
            result = 31 * result + (this.rabbitmqBrokerParameters != null ? this.rabbitmqBrokerParameters.hashCode() : 0);
            result = 31 * result + (this.selfManagedKafkaParameters != null ? this.selfManagedKafkaParameters.hashCode() : 0);
            result = 31 * result + (this.sqsQueueParameters != null ? this.sqsQueueParameters.hashCode() : 0);
            return result;
        }
    }
}
