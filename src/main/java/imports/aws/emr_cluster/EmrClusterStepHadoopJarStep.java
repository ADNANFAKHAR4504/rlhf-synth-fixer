package imports.aws.emr_cluster;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:47.199Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.emrCluster.EmrClusterStepHadoopJarStep")
@software.amazon.jsii.Jsii.Proxy(EmrClusterStepHadoopJarStep.Jsii$Proxy.class)
public interface EmrClusterStepHadoopJarStep extends software.amazon.jsii.JsiiSerializable {

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#args EmrCluster#args}.
     */
    default @org.jetbrains.annotations.Nullable java.util.List<java.lang.String> getArgs() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#jar EmrCluster#jar}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getJar() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#main_class EmrCluster#main_class}.
     */
    default @org.jetbrains.annotations.Nullable java.lang.String getMainClass() {
        return null;
    }

    /**
     * Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#properties EmrCluster#properties}.
     */
    default @org.jetbrains.annotations.Nullable java.util.Map<java.lang.String, java.lang.String> getProperties() {
        return null;
    }

    /**
     * @return a {@link Builder} of {@link EmrClusterStepHadoopJarStep}
     */
    static Builder builder() {
        return new Builder();
    }
    /**
     * A builder for {@link EmrClusterStepHadoopJarStep}
     */
    public static final class Builder implements software.amazon.jsii.Builder<EmrClusterStepHadoopJarStep> {
        java.util.List<java.lang.String> args;
        java.lang.String jar;
        java.lang.String mainClass;
        java.util.Map<java.lang.String, java.lang.String> properties;

        /**
         * Sets the value of {@link EmrClusterStepHadoopJarStep#getArgs}
         * @param args Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#args EmrCluster#args}.
         * @return {@code this}
         */
        public Builder args(java.util.List<java.lang.String> args) {
            this.args = args;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterStepHadoopJarStep#getJar}
         * @param jar Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#jar EmrCluster#jar}.
         * @return {@code this}
         */
        public Builder jar(java.lang.String jar) {
            this.jar = jar;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterStepHadoopJarStep#getMainClass}
         * @param mainClass Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#main_class EmrCluster#main_class}.
         * @return {@code this}
         */
        public Builder mainClass(java.lang.String mainClass) {
            this.mainClass = mainClass;
            return this;
        }

        /**
         * Sets the value of {@link EmrClusterStepHadoopJarStep#getProperties}
         * @param properties Docs at Terraform Registry: {@link https://registry.terraform.io/providers/hashicorp/aws/5.100.0/docs/resources/emr_cluster#properties EmrCluster#properties}.
         * @return {@code this}
         */
        public Builder properties(java.util.Map<java.lang.String, java.lang.String> properties) {
            this.properties = properties;
            return this;
        }

        /**
         * Builds the configured instance.
         * @return a new instance of {@link EmrClusterStepHadoopJarStep}
         * @throws NullPointerException if any required attribute was not provided
         */
        @Override
        public EmrClusterStepHadoopJarStep build() {
            return new Jsii$Proxy(this);
        }
    }

    /**
     * An implementation for {@link EmrClusterStepHadoopJarStep}
     */
    @software.amazon.jsii.Internal
    final class Jsii$Proxy extends software.amazon.jsii.JsiiObject implements EmrClusterStepHadoopJarStep {
        private final java.util.List<java.lang.String> args;
        private final java.lang.String jar;
        private final java.lang.String mainClass;
        private final java.util.Map<java.lang.String, java.lang.String> properties;

        /**
         * Constructor that initializes the object based on values retrieved from the JsiiObject.
         * @param objRef Reference to the JSII managed object.
         */
        protected Jsii$Proxy(final software.amazon.jsii.JsiiObjectRef objRef) {
            super(objRef);
            this.args = software.amazon.jsii.Kernel.get(this, "args", software.amazon.jsii.NativeType.listOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
            this.jar = software.amazon.jsii.Kernel.get(this, "jar", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.mainClass = software.amazon.jsii.Kernel.get(this, "mainClass", software.amazon.jsii.NativeType.forClass(java.lang.String.class));
            this.properties = software.amazon.jsii.Kernel.get(this, "properties", software.amazon.jsii.NativeType.mapOf(software.amazon.jsii.NativeType.forClass(java.lang.String.class)));
        }

        /**
         * Constructor that initializes the object based on literal property values passed by the {@link Builder}.
         */
        protected Jsii$Proxy(final Builder builder) {
            super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
            this.args = builder.args;
            this.jar = builder.jar;
            this.mainClass = builder.mainClass;
            this.properties = builder.properties;
        }

        @Override
        public final java.util.List<java.lang.String> getArgs() {
            return this.args;
        }

        @Override
        public final java.lang.String getJar() {
            return this.jar;
        }

        @Override
        public final java.lang.String getMainClass() {
            return this.mainClass;
        }

        @Override
        public final java.util.Map<java.lang.String, java.lang.String> getProperties() {
            return this.properties;
        }

        @Override
        @software.amazon.jsii.Internal
        public com.fasterxml.jackson.databind.JsonNode $jsii$toJson() {
            final com.fasterxml.jackson.databind.ObjectMapper om = software.amazon.jsii.JsiiObjectMapper.INSTANCE;
            final com.fasterxml.jackson.databind.node.ObjectNode data = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();

            if (this.getArgs() != null) {
                data.set("args", om.valueToTree(this.getArgs()));
            }
            if (this.getJar() != null) {
                data.set("jar", om.valueToTree(this.getJar()));
            }
            if (this.getMainClass() != null) {
                data.set("mainClass", om.valueToTree(this.getMainClass()));
            }
            if (this.getProperties() != null) {
                data.set("properties", om.valueToTree(this.getProperties()));
            }

            final com.fasterxml.jackson.databind.node.ObjectNode struct = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            struct.set("fqn", om.valueToTree("aws.emrCluster.EmrClusterStepHadoopJarStep"));
            struct.set("data", data);

            final com.fasterxml.jackson.databind.node.ObjectNode obj = com.fasterxml.jackson.databind.node.JsonNodeFactory.instance.objectNode();
            obj.set("$jsii.struct", struct);

            return obj;
        }

        @Override
        public final boolean equals(final Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            EmrClusterStepHadoopJarStep.Jsii$Proxy that = (EmrClusterStepHadoopJarStep.Jsii$Proxy) o;

            if (this.args != null ? !this.args.equals(that.args) : that.args != null) return false;
            if (this.jar != null ? !this.jar.equals(that.jar) : that.jar != null) return false;
            if (this.mainClass != null ? !this.mainClass.equals(that.mainClass) : that.mainClass != null) return false;
            return this.properties != null ? this.properties.equals(that.properties) : that.properties == null;
        }

        @Override
        public final int hashCode() {
            int result = this.args != null ? this.args.hashCode() : 0;
            result = 31 * result + (this.jar != null ? this.jar.hashCode() : 0);
            result = 31 * result + (this.mainClass != null ? this.mainClass.hashCode() : 0);
            result = 31 * result + (this.properties != null ? this.properties.hashCode() : 0);
            return result;
        }
    }
}
