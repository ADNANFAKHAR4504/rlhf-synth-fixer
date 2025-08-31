package imports.aws.devopsguru_service_integration;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.995Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationKmsServerSideEncryption")
@software.amazon.jsii.Jsii.Proxy(DevopsguruServiceIntegrationKmsServerSideEncryption.Jsii$Proxy.class)
public interface DevopsguruServiceIntegrationKmsServerSideEncryption extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_key_id DevopsguruServiceIntegration#kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getOptInStatus() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#type DevopsguruServiceIntegration#type}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getType() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DevopsguruServiceIntegrationKmsServerSideEncryption}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DevopsguruServiceIntegrationKmsServerSideEncryption}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DevopsguruServiceIntegrationKmsServerSideEncryption> {
        java.lang.String kmsKeyId;
        java.lang.String optInStatus;
        java.lang.String type;

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationKmsServerSideEncryption#getKmsKeyId}
         * @param kmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#kms_key_id DevopsguruServiceIntegration#kms_key_id}.
         * @return {@code this}
         */
        public Builder kmsKeyId(java.lang.String kmsKeyId) {
            this.kmsKeyId = kmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationKmsServerSideEncryption#getOptInStatus}
         * @param optInStatus Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#opt_in_status DevopsguruServiceIntegration#opt_in_status}.
         * @return {@code this}
         */
        public Builder optInStatus(java.lang.String optInStatus) {
            this.optInStatus = optInStatus;
            return this;
        }

        /**
         * Sets the value of {@link DevopsguruServiceIntegrationKmsServerSideEncryption#getType}
         * @param type Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/devopsguru_service_integration#type DevopsguruServiceIntegration#type}.
         * @return {@code this}
         */
        public Builder type(java.lang.String type) {
            this.type = type;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DevopsguruServiceIntegrationKmsServerSideEncryption}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DevopsguruServiceIntegrationKmsServerSideEncryption build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DevopsguruServiceIntegrationKmsServerSideEncryption}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DevopsguruServiceIntegrationKmsServerSideEncryption {
        private final java.lang.String kmsKeyId;
        private final java.lang.String optInStatus;
        private final java.lang.String type;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.kmsKeyId = software.amazon.jsii.Kernel.get(this, "kmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.optInStatus = software.amazon.jsii.Kernel.get(this, "optInStatus", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.type = software.amazon.jsii.Kernel.get(this, "type", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.kmsKeyId = builder.kmsKeyId;
            this.optInStatus = builder.optInStatus;
            this.type = builder.type;
        }

        @Override
        public final java.lang.String getKmsKeyId() {
            return this.kmsKeyId;
        }

        @Override
        public final java.lang.String getOptInStatus() {
            return this.optInStatus;
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

            if (this.getKmsKeyId() != null) {
                data.set("kmsKeyId", om.valueToTree(this.getKmsKeyId()));
            }
            if (this.getOptInStatus() != null) {
                data.set("optInStatus", om.valueToTree(this.getOptInStatus()));
            }
            if (this.getType() != null) {
                data.set("type", om.valueToTree(this.getType()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.devopsguruServiceIntegration.DevopsguruServiceIntegrationKmsServerSideEncryption"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DevopsguruServiceIntegrationKmsServerSideEncryption.Jsii$Proxy that = (DevopsguruServiceIntegrationKmsServerSideEncryption.Jsii$Proxy) o;

            if (this.kmsKeyId != null ? !this.kmsKeyId.equals(that.kmsKeyId) : that.kmsKeyId != null) return false;
            if (this.optInStatus != null ? !this.optInStatus.equals(that.optInStatus) : that.optInStatus != null) return false;
            return this.type != null ? this.type.equals(that.type) : that.type == null;
        }

        @Override
        public final int hashCode() {
            int result = this.kmsKeyId != null ? this.kmsKeyId.hashCode() : 0;
            result = 31 * result + (this.optInStatus != null ? this.optInStatus.hashCode() : 0);
            result = 31 * result + (this.type != null ? this.type.hashCode() : 0);
            return result;
        }
    }
}
