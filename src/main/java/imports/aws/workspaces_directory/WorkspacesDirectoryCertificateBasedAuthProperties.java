package imports.aws.workspaces_directory;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:48.683Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.workspacesDirectory.WorkspacesDirectoryCertificateBasedAuthProperties")
@software.amazon.jsii.Jsii.Proxy(WorkspacesDirectoryCertificateBasedAuthProperties.Jsii$Proxy.class)
public interface WorkspacesDirectoryCertificateBasedAuthProperties extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_authority_arn WorkspacesDirectory#certificate_authority_arn}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getCertificateAuthorityArn() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getStatus() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link WorkspacesDirectoryCertificateBasedAuthProperties}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link WorkspacesDirectoryCertificateBasedAuthProperties}
     */
    public static final class Builder implements software.amazon.jsii.Builder<WorkspacesDirectoryCertificateBasedAuthProperties> {
        java.lang.String certificateAuthorityArn;
        java.lang.String status;

        /**
         * Sets the value of {@link WorkspacesDirectoryCertificateBasedAuthProperties#getCertificateAuthorityArn}
         * @param certificateAuthorityArn Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#certificate_authority_arn WorkspacesDirectory#certificate_authority_arn}.
         * @return {@code this}
         */
        public Builder certificateAuthorityArn(java.lang.String certificateAuthorityArn) {
            this.certificateAuthorityArn = certificateAuthorityArn;
            return this;
        }

        /**
         * Sets the value of {@link WorkspacesDirectoryCertificateBasedAuthProperties#getStatus}
         * @param status Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/workspaces_directory#status WorkspacesDirectory#status}.
         * @return {@code this}
         */
        public Builder status(java.lang.String status) {
            this.status = status;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link WorkspacesDirectoryCertificateBasedAuthProperties}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public WorkspacesDirectoryCertificateBasedAuthProperties build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link WorkspacesDirectoryCertificateBasedAuthProperties}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements WorkspacesDirectoryCertificateBasedAuthProperties {
        private final java.lang.String certificateAuthorityArn;
        private final java.lang.String status;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.certificateAuthorityArn = software.amazon.jsii.Kernel.get(this, "certificateAuthorityArn", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.status = software.amazon.jsii.Kernel.get(this, "status", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.certificateAuthorityArn = builder.certificateAuthorityArn;
            this.status = builder.status;
        }

        @Override
        public final java.lang.String getCertificateAuthorityArn() {
            return this.certificateAuthorityArn;
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

            if (this.getCertificateAuthorityArn() != null) {
                data.set("certificateAuthorityArn", om.valueToTree(this.getCertificateAuthorityArn()));
            }
            if (this.getStatus() != null) {
                data.set("status", om.valueToTree(this.getStatus()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.workspacesDirectory.WorkspacesDirectoryCertificateBasedAuthProperties"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            WorkspacesDirectoryCertificateBasedAuthProperties.Jsii$Proxy that = (WorkspacesDirectoryCertificateBasedAuthProperties.Jsii$Proxy) o;

            if (this.certificateAuthorityArn != null ? !this.certificateAuthorityArn.equals(that.certificateAuthorityArn) : that.certificateAuthorityArn != null) return false;
            return this.status != null ? this.status.equals(that.status) : that.status == null;
        }

        @Override
        public final int hashCode() {
            int result = this.certificateAuthorityArn != null ? this.certificateAuthorityArn.hashCode() : 0;
            result = 31 * result + (this.status != null ? this.status.hashCode() : 0);
            return result;
        }
    }
}
