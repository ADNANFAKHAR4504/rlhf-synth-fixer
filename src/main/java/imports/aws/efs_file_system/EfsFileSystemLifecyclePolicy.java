package imports.aws.efs_file_system;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.142Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.efsFileSystem.EfsFileSystemLifecyclePolicy")
@software.amazon.jsii.Jsii.Proxy(EfsFileSystemLifecyclePolicy.Jsii$Proxy.class)
public interface EfsFileSystemLifecyclePolicy extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#transition_to_archive EfsFileSystem#transition_to_archive}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitionToArchive() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#transition_to_ia EfsFileSystem#transition_to_ia}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitionToIa() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#transition_to_primary_storage_class EfsFileSystem#transition_to_primary_storage_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getTransitionToPrimaryStorageClass() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EfsFileSystemLifecyclePolicy}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EfsFileSystemLifecyclePolicy}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EfsFileSystemLifecyclePolicy> {
        java.lang.String transitionToArchive;
        java.lang.String transitionToIa;
        java.lang.String transitionToPrimaryStorageClass;

        /**
         * Sets the value of {@link EfsFileSystemLifecyclePolicy#getTransitionToArchive}
         * @param transitionToArchive Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#transition_to_archive EfsFileSystem#transition_to_archive}.
         * @return {@code this}
         */
        public Builder transitionToArchive(java.lang.String transitionToArchive) {
            this.transitionToArchive = transitionToArchive;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemLifecyclePolicy#getTransitionToIa}
         * @param transitionToIa Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#transition_to_ia EfsFileSystem#transition_to_ia}.
         * @return {@code this}
         */
        public Builder transitionToIa(java.lang.String transitionToIa) {
            this.transitionToIa = transitionToIa;
            return this;
        }

        /**
         * Sets the value of {@link EfsFileSystemLifecyclePolicy#getTransitionToPrimaryStorageClass}
         * @param transitionToPrimaryStorageClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/efs_file_system#transition_to_primary_storage_class EfsFileSystem#transition_to_primary_storage_class}.
         * @return {@code this}
         */
        public Builder transitionToPrimaryStorageClass(java.lang.String transitionToPrimaryStorageClass) {
            this.transitionToPrimaryStorageClass = transitionToPrimaryStorageClass;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EfsFileSystemLifecyclePolicy}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EfsFileSystemLifecyclePolicy build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EfsFileSystemLifecyclePolicy}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EfsFileSystemLifecyclePolicy {
        private final java.lang.String transitionToArchive;
        private final java.lang.String transitionToIa;
        private final java.lang.String transitionToPrimaryStorageClass;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.transitionToArchive = software.amazon.jsii.Kernel.get(this, "transitionToArchive", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitionToIa = software.amazon.jsii.Kernel.get(this, "transitionToIa", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.transitionToPrimaryStorageClass = software.amazon.jsii.Kernel.get(this, "transitionToPrimaryStorageClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.transitionToArchive = builder.transitionToArchive;
            this.transitionToIa = builder.transitionToIa;
            this.transitionToPrimaryStorageClass = builder.transitionToPrimaryStorageClass;
        }

        @Override
        public final java.lang.String getTransitionToArchive() {
            return this.transitionToArchive;
        }

        @Override
        public final java.lang.String getTransitionToIa() {
            return this.transitionToIa;
        }

        @Override
        public final java.lang.String getTransitionToPrimaryStorageClass() {
            return this.transitionToPrimaryStorageClass;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getTransitionToArchive() != null) {
                data.set("transitionToArchive", om.valueToTree(this.getTransitionToArchive()));
            }
            if (this.getTransitionToIa() != null) {
                data.set("transitionToIa", om.valueToTree(this.getTransitionToIa()));
            }
            if (this.getTransitionToPrimaryStorageClass() != null) {
                data.set("transitionToPrimaryStorageClass", om.valueToTree(this.getTransitionToPrimaryStorageClass()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.efsFileSystem.EfsFileSystemLifecyclePolicy"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EfsFileSystemLifecyclePolicy.Jsii$Proxy that = (EfsFileSystemLifecyclePolicy.Jsii$Proxy) o;

            if (this.transitionToArchive != null ? !this.transitionToArchive.equals(that.transitionToArchive) : that.transitionToArchive != null) return false;
            if (this.transitionToIa != null ? !this.transitionToIa.equals(that.transitionToIa) : that.transitionToIa != null) return false;
            return this.transitionToPrimaryStorageClass != null ? this.transitionToPrimaryStorageClass.equals(that.transitionToPrimaryStorageClass) : that.transitionToPrimaryStorageClass == null;
        }

        @Override
        public final int hashCode() {
            int result = this.transitionToArchive != null ? this.transitionToArchive.hashCode() : 0;
            result = 31 * result + (this.transitionToIa != null ? this.transitionToIa.hashCode() : 0);
            result = 31 * result + (this.transitionToPrimaryStorageClass != null ? this.transitionToPrimaryStorageClass.hashCode() : 0);
            return result;
        }
    }
}
