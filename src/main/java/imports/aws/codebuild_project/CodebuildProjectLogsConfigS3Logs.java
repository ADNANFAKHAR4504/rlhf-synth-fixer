package imports.aws.codebuild_project;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.301Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.codebuildProject.CodebuildProjectLogsConfigS3Logs")
@software.amazon.jsii.Jsii.Proxy(CodebuildProjectLogsConfigS3Logs.Jsii$Proxy.class)
public interface CodebuildProjectLogsConfigS3Logs extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#bucket_owner_access CodebuildProject#bucket_owner_access}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getBucketOwnerAccess() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_disabled CodebuildProject#encryption_disabled}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.Object getEncryptionDisabled() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#location CodebuildProject#location}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getLocation() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#status CodebuildProject#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link CodebuildProjectLogsConfigS3Logs}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link CodebuildProjectLogsConfigS3Logs}
     */
    public static final class Builder implements software.amazon.jsii.Builder<CodebuildProjectLogsConfigS3Logs> {
        java.lang.String bucketOwnerAccess;
        java.lang.Object encryptionDisabled;
        java.lang.String location;
        java.lang.String status;

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigS3Logs#getBucketOwnerAccess}
         * @param bucketOwnerAccess Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#bucket_owner_access CodebuildProject#bucket_owner_access}.
         * @return {@code this}
         */
        public Builder bucketOwnerAccess(java.lang.String bucketOwnerAccess) {
            this.bucketOwnerAccess = bucketOwnerAccess;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigS3Logs#getEncryptionDisabled}
         * @param encryptionDisabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_disabled CodebuildProject#encryption_disabled}.
         * @return {@code this}
         */
        public Builder encryptionDisabled(java.lang.Boolean encryptionDisabled) {
            this.encryptionDisabled = encryptionDisabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigS3Logs#getEncryptionDisabled}
         * @param encryptionDisabled Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#encryption_disabled CodebuildProject#encryption_disabled}.
         * @return {@code this}
         */
        public Builder encryptionDisabled(com.hashicorp.cdktf.IResolvable encryptionDisabled) {
            this.encryptionDisabled = encryptionDisabled;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigS3Logs#getLocation}
         * @param location Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#location CodebuildProject#location}.
         * @return {@code this}
         */
        public Builder location(java.lang.String location) {
            this.location = location;
            return this;
        }

        /**
         * Sets the value of {@link CodebuildProjectLogsConfigS3Logs#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/codebuild_project#status CodebuildProject#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link CodebuildProjectLogsConfigS3Logs}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public CodebuildProjectLogsConfigS3Logs build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link CodebuildProjectLogsConfigS3Logs}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements CodebuildProjectLogsConfigS3Logs {
        private final java.lang.String bucketOwnerAccess;
        private final java.lang.Object encryptionDisabled;
        private final java.lang.String location;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.bucketOwnerAccess = software.amazon.jsii.Kernel.get(this, "bucketOwnerAccess", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.encryptionDisabled = software.amazon.jsii.Kernel.get(this, "encryptionDisabled", software.amazon.jsii.NativeType.forClass(java.lang.Object.class));
            this.location = software.amazon.jsii.Kernel.get(this, "location", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.bucketOwnerAccess = builder.bucketOwnerAccess;
            this.encryptionDisabled = builder.encryptionDisabled;
            this.location = builder.location;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getBucketOwnerAccess() {
            return this.bucketOwnerAccess;
        }

        @Override
        public final java.lang.Object getEncryptionDisabled() {
            return this.encryptionDisabled;
        }

        @Override
        public final java.lang.String getLocation() {
            return this.location;
        }

        @Override
        public final java.lang.String getStatus() {
            return this.status;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getBucketOwnerAccess() != null) {
                data.set("bucketOwnerAccess", om.valueToTree(this.getBucketOwnerAccess()));
            }
            if (this.getEncryptionDisabled() != null) {
                data.set("encryptionDisabled", om.valueToTree(this.getEncryptionDisabled()));
            }
            if (this.getLocation() != null) {
                data.set("location", om.valueToTree(this.getLocation()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.codebuildProject.CodebuildProjectLogsConfigS3Logs"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            CodebuildProjectLogsConfigS3Logs.Jsii$Proxy that = (CodebuildProjectLogsConfigS3Logs.Jsii$Proxy) o;

            if (this.bucketOwnerAccess != null ? !this.bucketOwnerAccess.equals(that.bucketOwnerAccess) : that.bucketOwnerAccess != null) return false;
            if (this.encryptionDisabled != null ? !this.encryptionDisabled.equals(that.encryptionDisabled) : that.encryptionDisabled != null) return false;
            if (this.location != null ? !this.location.equals(that.location) : that.location != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.bucketOwnerAccess != null ? this.bucketOwnerAccess.hashCode() : 0;
            result = 31 * result + (this.encryptionDisabled != null ? this.encryptionDisabled.hashCode() : 0);
            result = 31 * result + (this.location != null ? this.location.hashCode() : 0);
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
