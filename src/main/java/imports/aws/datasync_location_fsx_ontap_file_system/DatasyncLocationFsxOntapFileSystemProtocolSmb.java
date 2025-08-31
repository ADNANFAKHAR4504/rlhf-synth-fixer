package imports.aws.datasync_location_fsx_ontap_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.946Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocolSmb")
@software.amazon.jsii.Jsii.Proxy(DatasyncLocationFsxOntapFileSystemProtocolSmb.Jsii$Proxy.class)
public interface DatasyncLocationFsxOntapFileSystemProtocolSmb extends software.amazon.jsii.JsiiSerializable {

    /**
     * mount_options block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#mount_options DatasyncLocationFsxOntapFileSystem#mount_options}
     */
    @org.jetbrains.annotations.NotNull imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbMountOptions getMountOptions();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#password DatasyncLocationFsxOntapFileSystem#password}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPassword();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#user DatasyncLocationFsxOntapFileSystem#user}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getUser();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#domain DatasyncLocationFsxOntapFileSystem#domain}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getDomain() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link DatasyncLocationFsxOntapFileSystemProtocolSmb}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link DatasyncLocationFsxOntapFileSystemProtocolSmb}
     */
    public static final class Builder implements software.amazon.jsii.Builder<DatasyncLocationFsxOntapFileSystemProtocolSmb> {
        imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbMountOptions mountOptions;
        java.lang.String password;
        java.lang.String user;
        java.lang.String domain;

        /**
         * Sets the value of {@link DatasyncLocationFsxOntapFileSystemProtocolSmb#getMountOptions}
         * @param mountOptions mount_options block. This parameter is required.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#mount_options DatasyncLocationFsxOntapFileSystem#mount_options}
         * @return {@code this}
         */
        public Builder mountOptions(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbMountOptions mountOptions) {
            this.mountOptions = mountOptions;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationFsxOntapFileSystemProtocolSmb#getPassword}
         * @param password Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#password DatasyncLocationFsxOntapFileSystem#password}. This parameter is required.
         * @return {@code this}
         */
        public Builder password(java.lang.String password) {
            this.password = password;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationFsxOntapFileSystemProtocolSmb#getUser}
         * @param user Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#user DatasyncLocationFsxOntapFileSystem#user}. This parameter is required.
         * @return {@code this}
         */
        public Builder user(java.lang.String user) {
            this.user = user;
            return this;
        }

        /**
         * Sets the value of {@link DatasyncLocationFsxOntapFileSystemProtocolSmb#getDomain}
         * @param domain Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/datasync_location_fsx_ontap_file_system#domain DatasyncLocationFsxOntapFileSystem#domain}.
         * @return {@code this}
         */
        public Builder domain(java.lang.String domain) {
            this.domain = domain;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link DatasyncLocationFsxOntapFileSystemProtocolSmb}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public DatasyncLocationFsxOntapFileSystemProtocolSmb build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link DatasyncLocationFsxOntapFileSystemProtocolSmb}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements DatasyncLocationFsxOntapFileSystemProtocolSmb {
        private final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbMountOptions mountOptions;
        private final java.lang.String password;
        private final java.lang.String user;
        private final java.lang.String domain;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.mountOptions = software.amazon.jsii.Kernel.get(this, "mountOptions", software.amazon.jsii.NativeType.forClass(imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbMountOptions.class));
            this.password = software.amazon.jsii.Kernel.get(this, "password", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.user = software.amazon.jsii.Kernel.get(this, "user", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.domain = software.amazon.jsii.Kernel.get(this, "domain", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.mountOptions = java.util.Objects.requireNonNull(builder.mountOptions, "mountOptions is required");
            this.password = java.util.Objects.requireNonNull(builder.password, "password is required");
            this.user = java.util.Objects.requireNonNull(builder.user, "user is required");
            this.domain = builder.domain;
        }

        @Override
        public final imports.aws.datasync_location_fsx_ontap_file_system.DatasyncLocationFsxOntapFileSystemProtocolSmbMountOptions getMountOptions() {
            return this.mountOptions;
        }

        @Override
        public final java.lang.String getPassword() {
            return this.password;
        }

        @Override
        public final java.lang.String getUser() {
            return this.user;
        }

        @Override
        public final java.lang.String getDomain() {
            return this.domain;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("mountOptions", om.valueToTree(this.getMountOptions()));
            data.set("password", om.valueToTree(this.getPassword()));
            data.set("user", om.valueToTree(this.getUser()));
            if (this.getDomain() != null) {
                data.set("domain", om.valueToTree(this.getDomain()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.datasyncLocationFsxOntapFileSystem.DatasyncLocationFsxOntapFileSystemProtocolSmb"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            DatasyncLocationFsxOntapFileSystemProtocolSmb.Jsii$Proxy that = (DatasyncLocationFsxOntapFileSystemProtocolSmb.Jsii$Proxy) o;

            if (!mountOptions.equals(that.mountOptions)) return false;
            if (!password.equals(that.password)) return false;
            if (!user.equals(that.user)) return false;
            return this.domain != null ? this.domain.equals(that.domain) : that.domain == null;
        }

        @Override
        public final int hashCode() {
            int result = this.mountOptions.hashCode();
            result = 31 * result + (this.password.hashCode());
            result = 31 * result + (this.user.hashCode());
            result = 31 * result + (this.domain != null ? this.domain.hashCode() : 0);
            return result;
        }
    }
}
