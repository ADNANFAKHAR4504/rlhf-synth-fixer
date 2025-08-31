package imports.aws.dataexchange_event_action;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.935Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataexchangeEventAction.DataexchangeEventActionActionExportRevisionToS3Encryption")
@software.amazon.jsii.Jsii.Proxy(DataexchangeEventActionActionExportRevisionToS3Encryption.Jsii$Proxy.class)
public interface DataexchangeEventActionActionExportRevisionToS3Encryption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#kms_key_arn DataexchangeEventAction#kms_key_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#type DataexchangeEventAction#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DataexchangeEventActionActionExportRevisionToS3Encryption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DataexchangeEventActionActionExportRevisionToS3Encryption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DataexchangeEventActionActionExportRevisionToS3Encryption> {
        java.lang.String kmsKeyArn;
        java.lang.String type;

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3Encryption#getKmsKeyArn}
         * @param kmsKeyArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#kms_key_arn DataexchangeEventAction#kms_key_arn}.
         * @return {@code this}
         */
        public Builder kmsKeyArn(java.lang.String kmsKeyArn) {
            this.kmsKeyArn = kmsKeyArn;
            return this;
        }

        /**
         * Sets the value of {@link DataexchangeEventActionActionExportRevisionToS3Encryption#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dataexchange_event_action#type DataexchangeEventAction#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DataexchangeEventActionActionExportRevisionToS3Encryption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DataexchangeEventActionActionExportRevisionToS3Encryption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DataexchangeEventActionActionExportRevisionToS3Encryption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DataexchangeEventActionActionExportRevisionToS3Encryption {
        private final java.lang.String kmsKeyArn;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyArn = software.amazon.jsii.Kernel.get(this, "kmsKeyArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyArn = builder.kmsKeyArn;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getKmsKeyArn() {
            return this.kmsKeyArn;
        }

        @Override
        public final java.lang.String getType() {
            return this.type;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getKmsKeyArn() != null) {
                data.set("kmsKeyArn", om.valueToTree(this.getKmsKeyArn()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dataexchangeEventAction.DataexchangeEventActionActionExportRevisionToS3Encryption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DataexchangeEventActionActionExportRevisionToS3Encryption.Jsii$Proxy that = (DataexchangeEventActionActionExportRevisionToS3Encryption.Jsii$Proxy) o;

            if (this.kmsKeyArn != null ? !this.kmsKeyArn.equals(that.kmsKeyArn) : that.kmsKeyArn != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyArn != null ? this.kmsKeyArn.hashCode() : 0;
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
