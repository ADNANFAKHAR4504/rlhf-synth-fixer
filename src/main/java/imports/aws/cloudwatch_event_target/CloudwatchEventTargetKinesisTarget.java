package imports.aws.cloudwatch_event_target;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.280Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.cloudwatchEventTarget.CloudwatchEventTargetKinesisTarget")
@software.amazon.jsii.Jsii.Proxy(CloudwatchEventTargetKinesisTarget.Jsii$Proxy.class)
public interface CloudwatchEventTargetKinesisTarget extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#partition_key_path CloudwatchEventTarget#partition_key_path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPartitionKeyPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CloudwatchEventTargetKinesisTarget}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CloudwatchEventTargetKinesisTarget}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CloudwatchEventTargetKinesisTarget> {
        java.lang.String partitionKeyPath;

        /**
         * Sets the value of {@link CloudwatchEventTargetKinesisTarget#getPartitionKeyPath}
         * @param partitionKeyPath Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/cloudwatch_event_target#partition_key_path CloudwatchEventTarget#partition_key_path}.
         * @return {@code this}
         */
        public Builder partitionKeyPath(java.lang.String partitionKeyPath) {
            this.partitionKeyPath = partitionKeyPath;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CloudwatchEventTargetKinesisTarget}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CloudwatchEventTargetKinesisTarget build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CloudwatchEventTargetKinesisTarget}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CloudwatchEventTargetKinesisTarget {
        private final java.lang.String partitionKeyPath;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.partitionKeyPath = software.amazon.jsii.Kernel.get(this, "partitionKeyPath", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.partitionKeyPath = builder.partitionKeyPath;
        }

        @Override
        public final java.lang.String getPartitionKeyPath() {
            return this.partitionKeyPath;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getPartitionKeyPath() != null) {
                data.set("partitionKeyPath", om.valueToTree(this.getPartitionKeyPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.cloudwatchEventTarget.CloudwatchEventTargetKinesisTarget"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CloudwatchEventTargetKinesisTarget.Jsii$Proxy that = (CloudwatchEventTargetKinesisTarget.Jsii$Proxy) o;

            return this.partitionKeyPath != null ? this.partitionKeyPath.equals(that.partitionKeyPath) : that.partitionKeyPath == null;
        }

        @Override
        public final int hashCode() {
            int result = this.partitionKeyPath != null ? this.partitionKeyPath.hashCode() : 0;
            return result;
        }
    }
}
