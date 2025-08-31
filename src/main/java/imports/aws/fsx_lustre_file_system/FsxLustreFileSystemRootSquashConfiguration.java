package imports.aws.fsx_lustre_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.246Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.fsxLustreFileSystem.FsxLustreFileSystemRootSquashConfiguration")
@software.amazon.jsii.Jsii.Proxy(FsxLustreFileSystemRootSquashConfiguration.Jsii$Proxy.class)
public interface FsxLustreFileSystemRootSquashConfiguration extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#no_squash_nids FsxLustreFileSystem#no_squash_nids}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getNoSquashNids() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash FsxLustreFileSystem#root_squash}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getRootSquash() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link FsxLustreFileSystemRootSquashConfiguration}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link FsxLustreFileSystemRootSquashConfiguration}
     */
    public static final class Builder implements software.amazon.jsii.Builder<FsxLustreFileSystemRootSquashConfiguration> {
        java.util.List<java.lang.String> noSquashNids;
        java.lang.String rootSquash;

        /**
         * Sets the value of {@link FsxLustreFileSystemRootSquashConfiguration#getNoSquashNids}
         * @param noSquashNids Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#no_squash_nids FsxLustreFileSystem#no_squash_nids}.
         * @return {@code this}
         */
        public Builder noSquashNids(java.util.List<java.lang.String> noSquashNids) {
            this.noSquashNids = noSquashNids;
            return this;
        }

        /**
         * Sets the value of {@link FsxLustreFileSystemRootSquashConfiguration#getRootSquash}
         * @param rootSquash Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/fsx_lustre_file_system#root_squash FsxLustreFileSystem#root_squash}.
         * @return {@code this}
         */
        public Builder rootSquash(java.lang.String rootSquash) {
            this.rootSquash = rootSquash;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link FsxLustreFileSystemRootSquashConfiguration}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public FsxLustreFileSystemRootSquashConfiguration build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link FsxLustreFileSystemRootSquashConfiguration}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements FsxLustreFileSystemRootSquashConfiguration {
        private final java.util.List<java.lang.String> noSquashNids;
        private final java.lang.String rootSquash;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.noSquashNids = software.amazon.jsii.Kernel.get(this, "noSquashNids", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.rootSquash = software.amazon.jsii.Kernel.get(this, "rootSquash", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.noSquashNids = builder.noSquashNids;
            this.rootSquash = builder.rootSquash;
        }

        @Override
        public final java.util.List<java.lang.String> getNoSquashNids() {
            return this.noSquashNids;
        }

        @Override
        public final java.lang.String getRootSquash() {
            return this.rootSquash;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getNoSquashNids() != null) {
                data.set("noSquashNids", om.valueToTree(this.getNoSquashNids()));
            }
            if (this.getRootSquash() != null) {
                data.set("rootSquash", om.valueToTree(this.getRootSquash()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.fsxLustreFileSystem.FsxLustreFileSystemRootSquashConfiguration"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            FsxLustreFileSystemRootSquashConfiguration.Jsii$Proxy that = (FsxLustreFileSystemRootSquashConfiguration.Jsii$Proxy) o;

            if (this.noSquashNids != null ? !this.noSquashNids.equals(that.noSquashNids) : that.noSquashNids != null) return false;
            return this.rootSquash != null ? this.rootSquash.equals(that.rootSquash) : that.rootSquash == null;
        }

        @Override
        public final int hashCode() {
            int result = this.noSquashNids != null ? this.noSquashNids.hashCode() : 0;
            result = 31 * result + (this.rootSquash != null ? this.rootSquash.hashCode() : 0);
            return result;
        }
    }
}
