package imports.aws.evidently_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.215Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.evidentlyProject.EvidentlyProjectDataDelivery")
@software.amazon.jsii.Jsii.Proxy(EvidentlyProjectDataDelivery.Jsii$Proxy.class)
public interface EvidentlyProjectDataDelivery extends software.amazon.jsii.JsiiSerializable {

    /**
     * cloudwatch_logs block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#cloudwatch_logs EvidentlyProject#cloudwatch_logs}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs getCloudwatchLogs() {
        return null;
    }

    /**
     * s3_destination block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#s3_destination EvidentlyProject#s3_destination}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination getS3Destination() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EvidentlyProjectDataDelivery}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EvidentlyProjectDataDelivery}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EvidentlyProjectDataDelivery> {
        imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs cloudwatchLogs;
        imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination s3Destination;

        /**
         * Sets the value of {@link EvidentlyProjectDataDelivery#getCloudwatchLogs}
         * @param cloudwatchLogs cloudwatch_logs block.
         *                       Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#cloudwatch_logs EvidentlyProject#cloudwatch_logs}
         * @return {@code this}
         */
        public Builder cloudwatchLogs(imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs cloudwatchLogs) {
            this.cloudwatchLogs = cloudwatchLogs;
            return this;
        }

        /**
         * Sets the value of {@link EvidentlyProjectDataDelivery#getS3Destination}
         * @param s3Destination s3_destination block.
         *                      Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/evidently_project#s3_destination EvidentlyProject#s3_destination}
         * @return {@code this}
         */
        public Builder s3Destination(imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination s3Destination) {
            this.s3Destination = s3Destination;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EvidentlyProjectDataDelivery}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EvidentlyProjectDataDelivery build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EvidentlyProjectDataDelivery}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EvidentlyProjectDataDelivery {
        private final imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs cloudwatchLogs;
        private final imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination s3Destination;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.cloudwatchLogs = software.amazon.jsii.Kernel.get(this, "cloudwatchLogs", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs.class));
            this.s3Destination = software.amazon.jsii.Kernel.get(this, "s3Destination", software.amazon.jsii.NativeType.forClass(imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.cloudwatchLogs = builder.cloudwatchLogs;
            this.s3Destination = builder.s3Destination;
        }

        @Override
        public final imports.aws.evidently_project.EvidentlyProjectDataDeliveryCloudwatchLogs getCloudwatchLogs() {
            return this.cloudwatchLogs;
        }

        @Override
        public final imports.aws.evidently_project.EvidentlyProjectDataDeliveryS3Destination getS3Destination() {
            return this.s3Destination;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCloudwatchLogs() != null) {
                data.set("cloudwatchLogs", om.valueToTree(this.getCloudwatchLogs()));
            }
            if (this.getS3Destination() != null) {
                data.set("s3Destination", om.valueToTree(this.getS3Destination()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.evidentlyProject.EvidentlyProjectDataDelivery"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EvidentlyProjectDataDelivery.Jsii$Proxy that = (EvidentlyProjectDataDelivery.Jsii$Proxy) o;

            if (this.cloudwatchLogs != null ? !this.cloudwatchLogs.equals(that.cloudwatchLogs) : that.cloudwatchLogs != null) return false;
            return this.s3Destination != null ? this.s3Destination.equals(that.s3Destination) : that.s3Destination == null;
        }

        @Override
        public final int hashCode() {
            int result = this.cloudwatchLogs != null ? this.cloudwatchLogs.hashCode() : 0;
            result = 31 * result + (this.s3Destination != null ? this.s3Destination.hashCode() : 0);
            return result;
        }
    }
}
