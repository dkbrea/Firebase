import { CategoryManager } from "@/components/categories/category-manager";

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-foreground">Manage Categories</h1>
      <CategoryManager />
    </div>
  );
}
