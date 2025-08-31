package imports.aws.efs_access_point;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.141Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsAccessPoint.EfsAccessPointRootDirectory")
@software.amazon.jsii.Jsii.Proxy(EfsAccessPointRootDirectory.Jsii$Proxy.class)
public interface EfsAccessPointRootDirectory extends software.amazon.jsii.JsiiSerializable {

    /**
     * creation_info block.
     * <p>
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#creation_info EfsAccessPoint#creation_info}
     */
    default @org.jetbrains.annotations.Nullable imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo getCreationInfo() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#path EfsAccessPoint#path}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getPath() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EfsAccessPointRootDirectory}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EfsAccessPointRootDirectory}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EfsAccessPointRootDirectory> {
        imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo creationInfo;
        java.lang.String path;

        /**
         * Sets the value of {@link EfsAccessPointRootDirectory#getCreationInfo}
         * @param creationInfo creation_info block.
         *                     Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#creation_info EfsAccessPoint#creation_info}
         * @return {@code this}
         */
        public Builder creationInfo(imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo creationInfo) {
            this.creationInfo = creationInfo;
            return this;
        }

        /**
         * Sets the value of {@link EfsAccessPointRootDirectory#getPath}
         * @param path Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_access_point#path EfsAccessPoint#path}.
         * @return {@code this}
         */
        public Builder path(java.lang.String path) {
            this.path = path;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EfsAccessPointRootDirectory}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EfsAccessPointRootDirectory build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EfsAccessPointRootDirectory}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EfsAccessPointRootDirectory {
        private final imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo creationInfo;
        private final java.lang.String path;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.creationInfo = software.amazon.jsii.Kernel.get(this, "creationInfo", software.amazon.jsii.NativeType.forClass(imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo.class));
            this.path = software.amazon.jsii.Kernel.get(this, "path", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.creationInfo = builder.creationInfo;
            this.path = builder.path;
        }

        @Override
        public final imports.aws.efs_access_point.EfsAccessPointRootDirectoryCreationInfo getCreationInfo() {
            return this.creationInfo;
        }

        @Override
        public final java.lang.String getPath() {
            return this.path;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getCreationInfo() != null) {
                data.set("creationInfo", om.valueToTree(this.getCreationInfo()));
            }
            if (this.getPath() != null) {
                data.set("path", om.valueToTree(this.getPath()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.efsAccessPoint.EfsAccessPointRootDirectory"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EfsAccessPointRootDirectory.Jsii$Proxy that = (EfsAccessPointRootDirectory.Jsii$Proxy) o;

            if (this.creationInfo != null ? !this.creationInfo.equals(that.creationInfo) : that.creationInfo != null) return false;
            return this.path != null ? this.path.equals(that.path) : that.path == null;
        }

        @Override
        public final int hashCode() {
            int result = this.creationInfo != null ? this.creationInfo.hashCode() : 0;
            result = 31 * result + (this.path != null ? this.path.hashCode() : 0);
            return result;
        }
    }
}
