package imports.aws.data_aws_connect_user_hierarchy_structure;

@javax.annotation.Generated(value = "jsii-pacmak/1.112.0 (build de1bc80)", date = "2025-08-30T23:34:46.538Z")
@software.amazon.jsii.Jsii(module = imports.aws.$Module.class, fqn = "aws.dataAwsConnectUserHierarchyStructure.DataAwsConnectUserHierarchyStructureHierarchyStructureOutputReference")
public class DataAwsConnectUserHierarchyStructureHierarchyStructureOutputReference extends com.hashicorp.cdktf.ComplexObject {

    protected DataAwsConnectUserHierarchyStructureHierarchyStructureOutputReference(final software.amazon.jsii.JsiiObjectRef objRef) {
        super(objRef);
    }

    protected DataAwsConnectUserHierarchyStructureHierarchyStructureOutputReference(final software.amazon.jsii.JsiiObject.InitializationMode initializationMode) {
        super(initializationMode);
    }

    /**
     * @param terraformResource The parent resource. This parameter is required.
     * @param terraformAttribute The attribute on the parent resource this class is referencing. This parameter is required.
     * @param complexObjectIndex the index of this item in the list. This parameter is required.
     * @param complexObjectIsFromSet whether the list is wrapping a set (will add tolist() to be able to access an item via an index). This parameter is required.
     */
    public DataAwsConnectUserHierarchyStructureHierarchyStructureOutputReference(final @org.jetbrains.annotations.NotNull com.hashicorp.cdktf.IInterpolatingParent terraformResource, final @org.jetbrains.annotations.NotNull java.lang.String terraformAttribute, final @org.jetbrains.annotations.NotNull java.lang.Number complexObjectIndex, final @org.jetbrains.annotations.NotNull java.lang.Boolean complexObjectIsFromSet) {
        super(software.amazon.jsii.JsiiObject.InitializationMode.JSII);
        software.amazon.jsii.JsiiEngine.getInstance().createNewObject(this, new Object[] { java.util.Objects.requireNonNull(terraformResource, "terraformResource is required"), java.util.Objects.requireNonNull(terraformAttribute, "terraformAttribute is required"), java.util.Objects.requireNonNull(complexObjectIndex, "complexObjectIndex is required"), java.util.Objects.requireNonNull(complexObjectIsFromSet, "complexObjectIsFromSet is required") });
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelFiveList getLevelFive() {
        return software.amazon.jsii.Kernel.get(this, "levelFive", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelFiveList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelFourList getLevelFour() {
        return software.amazon.jsii.Kernel.get(this, "levelFour", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelFourList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelOneList getLevelOne() {
        return software.amazon.jsii.Kernel.get(this, "levelOne", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelOneList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelThreeList getLevelThree() {
        return software.amazon.jsii.Kernel.get(this, "levelThree", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelThreeList.class));
    }

    public @org.jetbrains.annotations.NotNull imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelTwoList getLevelTwo() {
        return software.amazon.jsii.Kernel.get(this, "levelTwo", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructureLevelTwoList.class));
    }

    public @org.jetbrains.annotations.Nullable imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructure getInternalValue() {
        return software.amazon.jsii.Kernel.get(this, "internalValue", software.amazon.jsii.NativeType.forClass(imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructure.class));
    }

    public void setInternalValue(final @org.jetbrains.annotations.Nullable imports.aws.data_aws_connect_user_hierarchy_structure.DataAwsConnectUserHierarchyStructureHierarchyStructure value) {
        software.amazon.jsii.Kernel.set(this, "internalValue", value);
    }
}
