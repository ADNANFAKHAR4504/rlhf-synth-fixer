package imports.aws.efs_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsAccessPoint.EfsAccessPointRootDirectoryCreationInfo")
@software.amazon.jsii.Jsii.Proxy(EfsAccessPointRootDirectoryCreationInfo.Jsii$Proxy.class)
public interface EfsAccessPointRootDirectoryCreationInfo extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#owner_gid EfsAccessPoint#owner_gid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getOwnerGid();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#owner_uid EfsAccessPoint#owner_uid}.
     */
    @org.jetbrains.annotations.NotNull java.lang.Number getOwnerUid();

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#permissions EfsAccessPoint#permissions}.
     */
    @org.jetbrains.annotations.NotNull java.lang.String getPermissions();

    /**
     * @return a {@link Builder} of {@link EfsAccessPointRootDirectoryCreationInfo}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EfsAccessPointRootDirectoryCreationInfo}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EfsAccessPointRootDirectoryCreationInfo> {
        java.lang.Number ownerGid;
        java.lang.Number ownerUid;
        java.lang.String permissions;

        /**
         * Sets the value of {@link EfsAccessPointRootDirectoryCreationInfo#getOwnerGid}
         * @param ownerGid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#owner_gid EfsAccessPoint#owner_gid}. This parameter is required.
         * @return {@code this}
         */
        public Builder ownerGid(java.lang.Number ownerGid) {
            this.ownerGid = ownerGid;
            return this;
        }

        /**
         * Sets the value of {@link EfsAccessPointRootDirectoryCreationInfo#getOwnerUid}
         * @param ownerUid Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#owner_uid EfsAccessPoint#owner_uid}. This parameter is required.
         * @return {@code this}
         */
        public Builder ownerUid(java.lang.Number ownerUid) {
            this.ownerUid = ownerUid;
            return this;
        }

        /**
         * Sets the value of {@link EfsAccessPointRootDirectoryCreationInfo#getPermissions}
         * @param permissions Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#permissions EfsAccessPoint#permissions}. This parameter is required.
         * @return {@code this}
         */
        public Builder permissions(java.lang.String permissions) {
            this.permissions = permissions;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EfsAccessPointRootDirectoryCreationInfo}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EfsAccessPointRootDirectoryCreationInfo build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EfsAccessPointRootDirectoryCreationInfo}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EfsAccessPointRootDirectoryCreationInfo {
        private final java.lang.Number ownerGid;
        private final java.lang.Number ownerUid;
        private final java.lang.String permissions;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.ownerGid = software.amazon.jsii.Kernel.get(this, "ownerGid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.ownerUid = software.amazon.jsii.Kernel.get(this, "ownerUid", software.amazon.jsii.NativeType.forClass(java.lang.Number.class));
            this.permissions = software.amazon.jsii.Kernel.get(this, "permissions", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.ownerGid = java.util.Objects.requireNonNull(builder.ownerGid, "ownerGid is required");
            this.ownerUid = java.util.Objects.requireNonNull(builder.ownerUid, "ownerUid is required");
            this.permissions = java.util.Objects.requireNonNull(builder.permissions, "permissions is required");
        }

        @Override
        public final java.lang.Number getOwnerGid() {
            return this.ownerGid;
        }

        @Override
        public final java.lang.Number getOwnerUid() {
            return this.ownerUid;
        }

        @Override
        public final java.lang.String getPermissions() {
            return this.permissions;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            data.set("ownerGid", om.valueToTree(this.getOwnerGid()));
            data.set("ownerUid", om.valueToTree(this.getOwnerUid()));
            data.set("permissions", om.valueToTree(this.getPermissions()));

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.efsAccessPoint.EfsAccessPointRootDirectoryCreationInfo"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EfsAccessPointRootDirectoryCreationInfo.Jsii$Proxy that = (EfsAccessPointRootDirectoryCreationInfo.Jsii$Proxy) o;

            if (!ownerGid.equals(that.ownerGid)) return false;
            if (!ownerUid.equals(that.ownerUid)) return false;
            return this.permissions.equals(that.permissions);
        }

        @Override
        public final int hashCode() {
            int result = this.ownerGid.hashCode();
            result = 31 * result + (this.ownerUid.hashCode());
            result = 31 * result + (this.permissions.hashCode());
            return result;
        }
    }
}
