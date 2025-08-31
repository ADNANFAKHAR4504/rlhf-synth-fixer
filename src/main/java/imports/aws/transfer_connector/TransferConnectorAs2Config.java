package imports.aws.transfer_connector;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.563Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.transferConnector.TransferConnectorAs2Config")
@software.amazon.jsii.Jsii.Proxy(TransferConnectorAs2Config.Jsii$Proxy.class)
public interface TransferConnectorAs2Config extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#compression TransferConnector#compression}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getCompression();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#encryption_algorithm TransferConnector#encryption_algorithm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getEncryptionAlgorithm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#local_profile_id TransferConnector#local_profile_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getLocalProfileId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#mdn_response TransferConnector#mdn_response}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getMdnResponse();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#partner_profile_id TransferConnector#partner_profile_id}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPartnerProfileId();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#signing_algorithm TransferConnector#signing_algorithm}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getSigningAlgorithm();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#mdn_signing_algorithm TransferConnector#mdn_signing_algorithm}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMdnSigningAlgorithm() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#message_subject TransferConnector#message_subject}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMessageSubject() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link TransferConnectorAs2Config}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link TransferConnectorAs2Config}
     */
    public static final class Builder implements software.amazon.jsii.Builder<TransferConnectorAs2Config> {
        java.lang.String compression;
        java.lang.String encryptionAlgorithm;
        java.lang.String localProfileId;
        java.lang.String mdnResponse;
        java.lang.String partnerProfileId;
        java.lang.String signingAlgorithm;
        java.lang.String mdnSigningAlgorithm;
        java.lang.String messageSubject;

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getCompression}
         * @param compression Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#compression TransferConnector#compression}. This parameter is required.
         * @return {@code this}
         */
        public Builder compression(java.lang.String compression) {
            this.compression = compression;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getEncryptionAlgorithm}
         * @param encryptionAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#encryption_algorithm TransferConnector#encryption_algorithm}. This parameter is required.
         * @return {@code this}
         */
        public Builder encryptionAlgorithm(java.lang.String encryptionAlgorithm) {
            this.encryptionAlgorithm = encryptionAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getLocalProfileId}
         * @param localProfileId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#local_profile_id TransferConnector#local_profile_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder localProfileId(java.lang.String localProfileId) {
            this.localProfileId = localProfileId;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getMdnResponse}
         * @param mdnResponse Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#mdn_response TransferConnector#mdn_response}. This parameter is required.
         * @return {@code this}
         */
        public Builder mdnResponse(java.lang.String mdnResponse) {
            this.mdnResponse = mdnResponse;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getPartnerProfileId}
         * @param partnerProfileId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#partner_profile_id TransferConnector#partner_profile_id}. This parameter is required.
         * @return {@code this}
         */
        public Builder partnerProfileId(java.lang.String partnerProfileId) {
            this.partnerProfileId = partnerProfileId;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getSigningAlgorithm}
         * @param signingAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#signing_algorithm TransferConnector#signing_algorithm}. This parameter is required.
         * @return {@code this}
         */
        public Builder signingAlgorithm(java.lang.String signingAlgorithm) {
            this.signingAlgorithm = signingAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getMdnSigningAlgorithm}
         * @param mdnSigningAlgorithm Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#mdn_signing_algorithm TransferConnector#mdn_signing_algorithm}.
         * @return {@code this}
         */
        public Builder mdnSigningAlgorithm(java.lang.String mdnSigningAlgorithm) {
            this.mdnSigningAlgorithm = mdnSigningAlgorithm;
            return this;
        }

        /**
         * Sets the value of {@link TransferConnectorAs2Config#getMessageSubject}
         * @param messageSubject Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/transfer_connector#message_subject TransferConnector#message_subject}.
         * @return {@code this}
         */
        public Builder messageSubject(java.lang.String messageSubject) {
            this.messageSubject = messageSubject;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link TransferConnectorAs2Config}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public TransferConnectorAs2Config build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link TransferConnectorAs2Config}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements TransferConnectorAs2Config {
        private final java.lang.String compression;
        private final java.lang.String encryptionAlgorithm;
        private final java.lang.String localProfileId;
        private final java.lang.String mdnResponse;
        private final java.lang.String partnerProfileId;
        private final java.lang.String signingAlgorithm;
        private final java.lang.String mdnSigningAlgorithm;
        private final java.lang.String messageSubject;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.compression = software.amazon.jsii.Kernel.get(this, "compression", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionAlgorithm = software.amazon.jsii.Kernel.get(this, "encryptionAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.localProfileId = software.amazon.jsii.Kernel.get(this, "localProfileId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mdnResponse = software.amazon.jsii.Kernel.get(this, "mdnResponse", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.partnerProfileId = software.amazon.jsii.Kernel.get(this, "partnerProfileId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.signingAlgorithm = software.amazon.jsii.Kernel.get(this, "signingAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mdnSigningAlgorithm = software.amazon.jsii.Kernel.get(this, "mdnSigningAlgorithm", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.messageSubject = software.amazon.jsii.Kernel.get(this, "messageSubject", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.compression = java.util.Objects.requireNonNull(builder.compression, "compression is required");
            this.encryptionAlgorithm = java.util.Objects.requireNonNull(builder.encryptionAlgorithm, "encryptionAlgorithm is required");
            this.localProfileId = java.util.Objects.requireNonNull(builder.localProfileId, "localProfileId is required");
            this.mdnResponse = java.util.Objects.requireNonNull(builder.mdnResponse, "mdnResponse is required");
            this.partnerProfileId = java.util.Objects.requireNonNull(builder.partnerProfileId, "partnerProfileId is required");
            this.signingAlgorithm = java.util.Objects.requireNonNull(builder.signingAlgorithm, "signingAlgorithm is required");
            this.mdnSigningAlgorithm = builder.mdnSigningAlgorithm;
            this.messageSubject = builder.messageSubject;
        }

        @Override
        public final java.lang.String getCompression() {
            return this.compression;
        }

        @Override
        public final java.lang.String getEncryptionAlgorithm() {
            return this.encryptionAlgorithm;
        }

        @Override
        public final java.lang.String getLocalProfileId() {
            return this.localProfileId;
        }

        @Override
        public final java.lang.String getMdnResponse() {
            return this.mdnResponse;
        }

        @Override
        public final java.lang.String getPartnerProfileId() {
            return this.partnerProfileId;
        }

        @Override
        public final java.lang.String getSigningAlgorithm() {
            return this.signingAlgorithm;
        }

        @Override
        public final java.lang.String getMdnSigningAlgorithm() {
            return this.mdnSigningAlgorithm;
        }

        @Override
        public final java.lang.String getMessageSubject() {
            return this.messageSubject;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("compression", om.valueToTree(this.getCompression()));
            data.set("encryptionAlgorithm", om.valueToTree(this.getEncryptionAlgorithm()));
            data.set("localProfileId", om.valueToTree(this.getLocalProfileId()));
            data.set("mdnResponse", om.valueToTree(this.getMdnResponse()));
            data.set("partnerProfileId", om.valueToTree(this.getPartnerProfileId()));
            data.set("signingAlgorithm", om.valueToTree(this.getSigningAlgorithm()));
            if (this.getMdnSigningAlgorithm() != null) {
                data.set("mdnSigningAlgorithm", om.valueToTree(this.getMdnSigningAlgorithm()));
            }
            if (this.getMessageSubject() != null) {
                data.set("messageSubject", om.valueToTree(this.getMessageSubject()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.transferConnector.TransferConnectorAs2Config"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            TransferConnectorAs2Config.Jsii$Proxy that = (TransferConnectorAs2Config.Jsii$Proxy) o;

            if (!compression.equals(that.compression)) return false;
            if (!encryptionAlgorithm.equals(that.encryptionAlgorithm)) return false;
            if (!localProfileId.equals(that.localProfileId)) return false;
            if (!mdnResponse.equals(that.mdnResponse)) return false;
            if (!partnerProfileId.equals(that.partnerProfileId)) return false;
            if (!signingAlgorithm.equals(that.signingAlgorithm)) return false;
            if (this.mdnSigningAlgorithm != null ? !this.mdnSigningAlgorithm.equals(that.mdnSigningAlgorithm) : that.mdnSigningAlgorithm != null) return false;
            return this.messageSubject != null ? this.messageSubject.equals(that.messageSubject) : that.messageSubject == null;
        }

        @Override
        public final int hashCode() {
            int result = this.compression.hashCode();
            result = 31 * result + (this.encryptionAlgorithm.hashCode());
            result = 31 * result + (this.localProfileId.hashCode());
            result = 31 * result + (this.mdnResponse.hashCode());
            result = 31 * result + (this.partnerProfileId.hashCode());
            result = 31 * result + (this.signingAlgorithm.hashCode());
            result = 31 * result + (this.mdnSigningAlgorithm != null ? this.mdnSigningAlgorithm.hashCode() : 0);
            result = 31 * result + (this.messageSubject != null ? this.messageSubject.hashCode() : 0);
            return result;
        }
    }
}
