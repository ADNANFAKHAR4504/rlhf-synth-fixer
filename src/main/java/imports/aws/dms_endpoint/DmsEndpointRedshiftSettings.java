package imports.aws.dms_endpoint;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.013Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dmsEndpoint.DmsEndpointRedshiftSettings")
@software.amazon.jsii.Jsii.Proxy(DmsEndpointRedshiftSettings.Jsii$Proxy.class)
public interface DmsEndpointRedshiftSettings extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#bucket_folder DmsEndpoint#bucket_folder}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketFolder() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#bucket_name DmsEndpoint#bucket_name}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketName() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#encryption_mode DmsEndpoint#encryption_mode}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getEncryptionMode() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#server_side_encryption_kms_key_id DmsEndpoint#server_side_encryption_kms_key_id}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServerSideEncryptionKmsKeyId() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#service_access_role_arn DmsEndpoint#service_access_role_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getServiceAccessRoleArn() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DmsEndpointRedshiftSettings}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DmsEndpointRedshiftSettings}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DmsEndpointRedshiftSettings> {
        java.lang.String bucketFolder;
        java.lang.String bucketName;
        java.lang.String encryptionMode;
        java.lang.String serverSideEncryptionKmsKeyId;
        java.lang.String serviceAccessRoleArn;

        /**
         * Sets the value of {@link DmsEndpointRedshiftSettings#getBucketFolder}
         * @param bucketFolder Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#bucket_folder DmsEndpoint#bucket_folder}.
         * @return {@code this}
         */
        public Builder bucketFolder(java.lang.String bucketFolder) {
            this.bucketFolder = bucketFolder;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedshiftSettings#getBucketName}
         * @param bucketName Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#bucket_name DmsEndpoint#bucket_name}.
         * @return {@code this}
         */
        public Builder bucketName(java.lang.String bucketName) {
            this.bucketName = bucketName;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedshiftSettings#getEncryptionMode}
         * @param encryptionMode Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#encryption_mode DmsEndpoint#encryption_mode}.
         * @return {@code this}
         */
        public Builder encryptionMode(java.lang.String encryptionMode) {
            this.encryptionMode = encryptionMode;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedshiftSettings#getServerSideEncryptionKmsKeyId}
         * @param serverSideEncryptionKmsKeyId Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#server_side_encryption_kms_key_id DmsEndpoint#server_side_encryption_kms_key_id}.
         * @return {@code this}
         */
        public Builder serverSideEncryptionKmsKeyId(java.lang.String serverSideEncryptionKmsKeyId) {
            this.serverSideEncryptionKmsKeyId = serverSideEncryptionKmsKeyId;
            return this;
        }

        /**
         * Sets the value of {@link DmsEndpointRedshiftSettings#getServiceAccessRoleArn}
         * @param serviceAccessRoleArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/dms_endpoint#service_access_role_arn DmsEndpoint#service_access_role_arn}.
         * @return {@code this}
         */
        public Builder serviceAccessRoleArn(java.lang.String serviceAccessRoleArn) {
            this.serviceAccessRoleArn = serviceAccessRoleArn;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DmsEndpointRedshiftSettings}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DmsEndpointRedshiftSettings build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DmsEndpointRedshiftSettings}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DmsEndpointRedshiftSettings {
        private final java.lang.String bucketFolder;
        private final java.lang.String bucketName;
        private final java.lang.String encryptionMode;
        private final java.lang.String serverSideEncryptionKmsKeyId;
        private final java.lang.String serviceAccessRoleArn;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketFolder = software.amazon.jsii.Kernel.get(this, "bucketFolder", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.bucketName = software.amazon.jsii.Kernel.get(this, "bucketName", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionMode = software.amazon.jsii.Kernel.get(this, "encryptionMode", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serverSideEncryptionKmsKeyId = software.amazon.jsii.Kernel.get(this, "serverSideEncryptionKmsKeyId", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.serviceAccessRoleArn = software.amazon.jsii.Kernel.get(this, "serviceAccessRoleArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketFolder = builder.bucketFolder;
            this.bucketName = builder.bucketName;
            this.encryptionMode = builder.encryptionMode;
            this.serverSideEncryptionKmsKeyId = builder.serverSideEncryptionKmsKeyId;
            this.serviceAccessRoleArn = builder.serviceAccessRoleArn;
        }

        @Override
        public final java.lang.String getBucketFolder() {
            return this.bucketFolder;
        }

        @Override
        public final java.lang.String getBucketName() {
            return this.bucketName;
        }

        @Override
        public final java.lang.String getEncryptionMode() {
            return this.encryptionMode;
        }

        @Override
        public final java.lang.String getServerSideEncryptionKmsKeyId() {
            return this.serverSideEncryptionKmsKeyId;
        }

        @Override
        public final java.lang.String getServiceAccessRoleArn() {
            return this.serviceAccessRoleArn;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucketFolder() != null) {
                data.set("bucketFolder", om.valueToTree(this.getBucketFolder()));
            }
            if (this.getBucketName() != null) {
                data.set("bucketName", om.valueToTree(this.getBucketName()));
            }
            if (this.getEncryptionMode() != null) {
                data.set("encryptionMode", om.valueToTree(this.getEncryptionMode()));
            }
            if (this.getServerSideEncryptionKmsKeyId() != null) {
                data.set("serverSideEncryptionKmsKeyId", om.valueToTree(this.getServerSideEncryptionKmsKeyId()));
            }
            if (this.getServiceAccessRoleArn() != null) {
                data.set("serviceAccessRoleArn", om.valueToTree(this.getServiceAccessRoleArn()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.dmsEndpoint.DmsEndpointRedshiftSettings"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DmsEndpointRedshiftSettings.Jsii$Proxy that = (DmsEndpointRedshiftSettings.Jsii$Proxy) o;

            if (this.bucketFolder != null ? !this.bucketFolder.equals(that.bucketFolder) : that.bucketFolder != null) return false;
            if (this.bucketName != null ? !this.bucketName.equals(that.bucketName) : that.bucketName != null) return false;
            if (this.encryptionMode != null ? !this.encryptionMode.equals(that.encryptionMode) : that.encryptionMode != null) return false;
            if (this.serverSideEncryptionKmsKeyId != null ? !this.serverSideEncryptionKmsKeyId.equals(that.serverSideEncryptionKmsKeyId) : that.serverSideEncryptionKmsKeyId != null) return false;
            return this.serviceAccessRoleArn != null ? this.serviceAccessRoleArn.equals(that.serviceAccessRoleArn) : that.serviceAccessRoleArn == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketFolder != null ? this.bucketFolder.hashCode() : 0;
            result = 31 * result + (this.bucketName != null ? this.bucketName.hashCode() : 0);
            result = 31 * result + (this.encryptionMode != null ? this.encryptionMode.hashCode() : 0);
            result = 31 * result + (this.serverSideEncryptionKmsKeyId != null ? this.serverSideEncryptionKmsKeyId.hashCode() : 0);
            result = 31 * result + (this.serviceAccessRoleArn != null ? this.serviceAccessRoleArn.hashCode() : 0);
            return result;
        }
    }
}
