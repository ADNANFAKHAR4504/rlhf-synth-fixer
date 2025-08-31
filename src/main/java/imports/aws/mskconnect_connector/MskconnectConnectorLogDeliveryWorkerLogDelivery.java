package imports.aws.mskconnect_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.920Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.mskconnectConnector.MskconnectConnectorLogDeliveryWorkerLogDelivery")
@software.amazon.jsii.Jsii.Proxy(MskconnectConnectorLogDeliveryWorkerLogDelivery.Jsii$Proxy.class)
public interface MskconnectConnectorLogDeliveryWorkerLogDelivery extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#cloudwatch_logs MskconnectConnector#cloudwatch_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryCloudwatchLogs getCloudwatchLogs() {
        return null;
    }

    /**
     * firehose block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#firehose MskconnectConnector#firehose}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose getFirehose() {
        return null;
    }

    /**
     * s3 block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#s3 MskconnectConnector#s3}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryS3 getS3() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link MskconnectConnectorLogDeliveryWorkerLogDelivery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link MskconnectConnectorLogDeliveryWorkerLogDelivery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<MskconnectConnectorLogDeliveryWorkerLogDelivery> {
        imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryCloudwatchLogs cloudwatchLogs;
        imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose firehose;
        imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryS3 s3;

        /**
         * Sets the value of {@link MskconnectConnectorLogDeliveryWorkerLogDelivery#getCloudwatchLogs}
         * @param cloudwatchLogs cloudwatch_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#cloudwatch_logs MskconnectConnector#cloudwatch_logs}
         * @return {@code this}
         */
        public Builder cloudwatchLogs(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryCloudwatchLogs cloudwatchLogs) {
            this.cloudwatchLogs = cloudwatchLogs;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorLogDeliveryWorkerLogDelivery#getFirehose}
         * @param firehose firehose block.
         *                 Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#firehose MskconnectConnector#firehose}
         * @return {@code this}
         */
        public Builder firehose(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose firehose) {
            this.firehose = firehose;
            return this;
        }

        /**
         * Sets the value of {@link MskconnectConnectorLogDeliveryWorkerLogDelivery#getS3}
         * @param s3 s3 block.
         *           Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/mskconnect_connector#s3 MskconnectConnector#s3}
         * @return {@code this}
         */
        public Builder s3(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryS3 s3) {
            this.s3 = s3;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link MskconnectConnectorLogDeliveryWorkerLogDelivery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public MskconnectConnectorLogDeliveryWorkerLogDelivery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link MskconnectConnectorLogDeliveryWorkerLogDelivery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements MskconnectConnectorLogDeliveryWorkerLogDelivery {
        private final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryCloudwatchLogs cloudwatchLogs;
        private final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose firehose;
        private final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryS3 s3;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogs = software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryCloudwatchLogs.class));
            this.firehose = software.amazon.jsii.Kernel.get(this, "firehose", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose.class));
            this.s3 = software.amazon.jsii.Kernel.get(this, "s3", software.amazon.jsii.NativeType.forClass(imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryS3.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogs = builder.cloudwatchLogs;
            this.firehose = builder.firehose;
            this.s3 = builder.s3;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryCloudwatchLogs getCloudwatchLogs() {
            return this.cloudwatchLogs;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryFirehose getFirehose() {
            return this.firehose;
        }

        @Override
        public final imports.aws.mskconnect_connector.MskconnectConnectorLogDeliveryWorkerLogDeliveryS3 getS3() {
            return this.s3;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchLogs() != null) {
                data.set("cloudwatchLogs", om.valueToTree(this.getCloudwatchLogs()));
            }
            if (this.getFirehose() != null) {
                data.set("firehose", om.valueToTree(this.getFirehose()));
            }
            if (this.getS3() != null) {
                data.set("s3", om.valueToTree(this.getS3()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.mskconnectConnector.MskconnectConnectorLogDeliveryWorkerLogDelivery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            MskconnectConnectorLogDeliveryWorkerLogDelivery.Jsii$Proxy that = (MskconnectConnectorLogDeliveryWorkerLogDelivery.Jsii$Proxy) o;

            if (this.cloudwatchLogs != null ? !this.cloudwatchLogs.equals(that.cloudwatchLogs) : that.cloudwatchLogs != null) return false;
            if (this.firehose != null ? !this.firehose.equals(that.firehose) : that.firehose != null) return false;
            return this.s3 != null ? this.s3.equals(that.s3) : that.s3 == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogs != null ? this.cloudwatchLogs.hashCode() : 0;
            result = 31 * result + (this.firehose != null ? this.firehose.hashCode() : 0);
            result = 31 * result + (this.s3 != null ? this.s3.hashCode() : 0);
            return result;
        }
    }
}
