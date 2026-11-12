import {
  apiFormRequest,
  apiRequest,
  apiRequestPaginated,
  type PageMeta,
} from "@/lib/api";

export type Category = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  image?: string | null;
  parent_id?: number | null;
  seo_title?: string | null;
  seo_description?: string | null;
  display_order?: number;
  is_featured?: boolean;
  is_active?: boolean;
  children?: Category[];
  created_at?: string;
};

export type Brand = {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  logo?: string | null;
  website?: string | null;
  is_active?: boolean;
};

export type BrandFormFields = {
  name: string;
  description?: string;
  website?: string;
  is_active?: boolean;
};

export type ProductStatus = "draft" | "active" | "archived";

export type ProductVariant = {
  id: number;
  sku: string;
  name: string;
  attributes?: Record<string, unknown> | null;
  price?: string | number | null;
  cost_price?: string | number | null;
  stock?: number;
  barcode?: string | null;
  image?: string | null;
  is_active?: boolean;
};

export type ProductBrandRef = {
  id: number;
  name: string;
  slug?: string | null;
  logo?: string | null;
};

export type ProductCategoryRef = {
  id: number;
  name: string;
  slug?: string | null;
};

export type Product = {
  id: number;
  name: string;
  slug?: string;
  sku?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  brand_name?: string | null;
  category_name?: string | null;
  brand?: ProductBrandRef | null;
  category?: ProductCategoryRef | null;
  short_description?: string | null;
  description?: string | null;
  price: string | number;
  compare_at_price?: string | number | null;
  cost_price?: string | number | null;
  sale_price?: string | number | null;
  discount?: string | number | null;
  stock?: number;
  reserved_stock?: number;
  available_stock?: number;
  effective_price?: string | number;
  image?: string | null;
  images?: Array<{ id?: number; url: string; position?: number }>;
  variants?: ProductVariant[];
  status?: ProductStatus;
  condition?: "new" | "refurbished" | "used";
  component_type?: string | null;
  warranty_months?: number | null;
  manufacturer?: string | null;
  model_number?: string | null;
  is_featured?: boolean;
  track_inventory?: boolean;
  low_stock_threshold?: number;
  is_active?: boolean;
  search_keywords?: string | null;
  specs?: Record<string, unknown> | null;
  created_at?: string;
  updated_at?: string;
};

export type CategoryFormFields = {
  name: string;
  slug?: string;
  description?: string;
  parent_id?: number | null;
  display_order?: number;
  is_featured?: boolean;
  is_active?: boolean;
};

/** @deprecated use CategoryFormFields + multipart image file */
export type CategoryInput = CategoryFormFields & {
  image?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

/** Fields for multipart product create/update */
export type ProductFormFields = {
  name: string;
  description?: string;
  price?: string | number;
  discount?: string | number;
  cost_price?: string | number;
  stock?: string | number;
  category_id?: string | number | null;
  brand_id?: string | number | null;
  status?: ProductStatus | "";
};

export type ProductInput = ProductFormFields & {
  images?: File[];
};

export const componentTypes = [
  { value: "", label: "— بدون —" },
  { value: "cpu", label: "CPU" },
  { value: "motherboard", label: "Motherboard" },
  { value: "ram", label: "RAM" },
  { value: "gpu", label: "GPU" },
  { value: "storage", label: "Storage" },
  { value: "psu", label: "PSU" },
  { value: "case", label: "Case" },
  { value: "cooler", label: "Cooler" },
] as const;

export const productStatusLabels: Record<ProductStatus, string> = {
  draft: "مسودة",
  active: "منشور",
  archived: "مؤرشف",
};

/** Product card shape from home / popular / catalog lists */
export type HomeProduct = {
  id: number;
  name: string;
  slug?: string;
  price: string | number;
  discount?: string | number | null;
  effective_price?: string | number;
  image?: string | null;
  available_stock?: number;
  is_featured?: boolean;
  brand_name?: string | null;
  category_name?: string | null;
  short_description?: string | null;
  description?: string | null;
  condition?: "new" | "refurbished" | "used" | string | null;
  specs?: Record<string, unknown> | null;
};

/** Category + nested products from GET /categories/home */
export type HomeCategory = {
  id: number;
  name: string;
  slug?: string;
  description?: string | null;
  image?: string | null;
  parent_id?: number | null;
  is_featured?: boolean;
  products_count?: number;
  products: HomeProduct[];
};

/** Public home feed: categories with up to `limit` active products each */
export async function fetchHomeCategories(limit = 10) {
  return apiRequest<HomeCategory[]>("/categories/home", {
    query: { limit },
  });
}

/** Random active products across all categories — GET /products/popular */
export async function fetchPopularProducts(
  query: {
    page?: number;
    limit?: number;
    in_stock?: boolean | string;
    seed?: string;
  } = {},
) {
  return apiRequestPaginated<HomeProduct[]>("/products/popular", {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      in_stock: query.in_stock === undefined ? undefined : String(query.in_stock),
      seed: query.seed,
    },
  });
}

export function categoryPath(category: { id: number; slug?: string | null }) {
  return `/categories/${category.slug || category.id}`;
}

export async function fetchCategory(idOrSlug: string) {
  return apiRequest<Category>(`/categories/${idOrSlug}`);
}

export type CategoryBrandFilter = {
  id: number;
  name: string;
  slug?: string | null;
  logo?: string | null;
  products_count: number;
};

export type CategoryFilterMeta = {
  brands: CategoryBrandFilter[];
  price: { min: number; max: number };
};

export async function fetchCategoryFilters(idOrSlug: string) {
  return apiRequest<CategoryFilterMeta>(`/categories/${idOrSlug}/filters`);
}

export async function fetchCategoryProducts(
  idOrSlug: string,
  query: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
    brand_id?: number | string;
    min_price?: number | string;
    max_price?: number | string;
    in_stock?: "true" | "false";
  } = {},
) {
  return apiRequestPaginated<Product[]>(`/categories/${idOrSlug}/products`, {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      sort: query.sort,
      order: query.order,
      brand_id: query.brand_id || undefined,
      min_price: query.min_price || undefined,
      max_price: query.max_price || undefined,
      in_stock: query.in_stock,
    },
  });
}

export function toHomeProduct(product: Product): HomeProduct {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    price: product.price,
    discount: product.sale_price ?? product.discount ?? null,
    effective_price: product.effective_price,
    image: product.image,
    available_stock: product.available_stock,
    is_featured: product.is_featured,
  };
}

export async function fetchCategoryTree(token?: string | null) {
  return apiRequest<Category[]>("/categories", {
    token,
    query: { tree: "true" },
  });
}

export async function fetchCategories(
  token: string | null | undefined,
  query: {
    page?: number;
    limit?: number;
    q?: string;
    parent_id?: number | string;
    is_active?: string;
  } = {},
): Promise<{ data: Category[]; meta: PageMeta }> {
  return apiRequestPaginated<Category[]>("/categories", {
    token,
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      q: query.q,
      parent_id: query.parent_id,
      is_active: query.is_active,
    },
  });
}

export function buildCategoryFormData(
  fields: CategoryFormFields,
  image?: File | null,
) {
  const form = new FormData();
  form.append("name", fields.name.trim());
  if (fields.description?.trim()) {
    form.append("description", fields.description.trim());
  }
  if (fields.slug?.trim()) {
    form.append("slug", fields.slug.trim());
  }
  form.append(
    "parent_id",
    fields.parent_id != null ? String(fields.parent_id) : "",
  );
  if (fields.display_order !== undefined && fields.display_order !== null) {
    form.append("display_order", String(fields.display_order));
  }
  form.append("is_active", fields.is_active ? "true" : "false");
  form.append("is_featured", fields.is_featured ? "true" : "false");
  if (image) form.append("image", image);
  return form;
}

export async function createCategory(token: string, formData: FormData) {
  return apiFormRequest<Category>("/categories", {
    method: "POST",
    token,
    formData,
  });
}

export async function updateCategory(
  token: string,
  id: number,
  formData: FormData,
) {
  return apiFormRequest<Category>(`/categories/${id}`, {
    method: "PUT",
    token,
    formData,
  });
}

export async function deleteCategory(token: string, id: number) {
  return apiRequest(`/categories/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchBrands(
  token?: string | null,
  query: {
    page?: number;
    limit?: number;
    q?: string;
    is_active?: string;
  } = {},
) {
  return apiRequestPaginated<Brand[]>("/brands", {
    token,
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 100,
      q: query.q,
      is_active: query.is_active,
    },
  });
}

export function brandPath(brand: { id: number; slug?: string | null }) {
  return `/brands/${brand.slug || brand.id}`;
}

export async function fetchBrand(idOrSlug: string) {
  return apiRequest<Brand>(`/brands/${idOrSlug}`);
}

export type BrandCategoryFilter = {
  id: number;
  name: string;
  slug?: string | null;
  image?: string | null;
  products_count: number;
};

export type BrandFilterMeta = {
  categories: BrandCategoryFilter[];
  price: { min: number; max: number };
};

export async function fetchBrandFilters(idOrSlug: string) {
  return apiRequest<BrandFilterMeta>(`/brands/${idOrSlug}/filters`);
}

export async function fetchBrandProducts(
  idOrSlug: string,
  query: {
    page?: number;
    limit?: number;
    sort?: string;
    order?: "asc" | "desc";
    category_id?: number | string;
    min_price?: number | string;
    max_price?: number | string;
    in_stock?: "true" | "false";
  } = {},
) {
  return apiRequestPaginated<Product[]>(`/brands/${idOrSlug}/products`, {
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 12,
      sort: query.sort,
      order: query.order,
      category_id: query.category_id || undefined,
      min_price: query.min_price || undefined,
      max_price: query.max_price || undefined,
      in_stock: query.in_stock,
    },
  });
}

export function buildBrandFormData(
  fields: BrandFormFields,
  logo?: File | null,
) {
  const form = new FormData();
  form.append("name", fields.name.trim());
  appendIfPresent(form, "description", fields.description?.trim());
  appendIfPresent(form, "website", fields.website?.trim());
  if (fields.is_active !== undefined) {
    form.append("is_active", fields.is_active ? "true" : "false");
  }
  if (logo) form.append("logo", logo);
  return form;
}

export async function createBrand(token: string, formData: FormData) {
  return apiFormRequest<Brand>("/brands", {
    method: "POST",
    token,
    formData,
  });
}

export async function updateBrand(
  token: string,
  id: number,
  formData: FormData,
) {
  return apiFormRequest<Brand>(`/brands/${id}`, {
    method: "PUT",
    token,
    formData,
  });
}

export async function deleteBrand(token: string, id: number) {
  return apiRequest(`/brands/${id}`, {
    method: "DELETE",
    token,
  });
}

export async function fetchProducts(
  token: string | null | undefined,
  query: {
    page?: number;
    limit?: number;
    q?: string;
    category_id?: number | string;
    brand_id?: number | string;
    status?: string;
    sort?: string;
    order?: string;
  } = {},
) {
  return apiRequestPaginated<Product[]>("/products", {
    token,
    query: {
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      q: query.q,
      category_id: query.category_id,
      brand_id: query.brand_id,
      status: query.status,
      sort: query.sort ?? "created_at",
      order: query.order ?? "desc",
    },
  });
}

export async function fetchProduct(token: string | null | undefined, id: string | number) {
  return apiRequest<Product>(`/products/${id}`, { token });
}

function appendIfPresent(form: FormData, key: string, value: unknown) {
  if (value === undefined || value === null || value === "") return;
  form.append(key, String(value));
}

export function buildProductFormData(
  fields: ProductFormFields,
  images?: FileList | File[] | null,
) {
  const form = new FormData();
  form.append("name", fields.name.trim());
  appendIfPresent(form, "description", fields.description?.trim());
  appendIfPresent(form, "price", fields.price);
  appendIfPresent(form, "discount", fields.discount);
  appendIfPresent(form, "cost_price", fields.cost_price);
  appendIfPresent(form, "stock", fields.stock);
  appendIfPresent(form, "category_id", fields.category_id);
  appendIfPresent(form, "brand_id", fields.brand_id);
  appendIfPresent(form, "status", fields.status);

  if (images) {
    const list = Array.from(images);
    for (const file of list) {
      form.append("images", file);
    }
  }

  return form;
}

export async function createProduct(token: string, formData: FormData) {
  return apiFormRequest<Product>("/products", {
    method: "POST",
    token,
    formData,
  });
}

export async function updateProduct(
  token: string,
  id: number,
  formData: FormData,
) {
  return apiFormRequest<Product>(`/products/${id}`, {
    method: "PUT",
    token,
    formData,
  });
}

/** Quick status update via multipart (partial body) */
export async function updateProductStatus(
  token: string,
  id: number,
  status: ProductStatus,
) {
  const formData = new FormData();
  formData.append("status", status);
  return apiFormRequest<Product>(`/products/${id}`, {
    method: "PUT",
    token,
    formData,
  });
}

/** Soft delete (archive) — recommended. Use permanent=true for hard delete. */
export async function deleteProduct(
  token: string,
  id: number,
  opts?: { permanent?: boolean },
) {
  return apiRequest(`/products/${id}`, {
    method: "DELETE",
    token,
    query: opts?.permanent ? { permanent: "true" } : undefined,
  });
}

/** @deprecated use deleteProduct */
export async function archiveProduct(token: string, id: number) {
  return deleteProduct(token, id);
}

/** Flatten category tree for selects */
export function flattenCategories(
  tree: Category[],
  depth = 0,
): Array<Category & { depth: number; label: string }> {
  const out: Array<Category & { depth: number; label: string }> = [];
  for (const cat of tree) {
    out.push({
      ...cat,
      depth,
      label: `${"— ".repeat(depth)}${cat.name}`,
    });
    if (cat.children?.length) {
      out.push(...flattenCategories(cat.children, depth + 1));
    }
  }
  return out;
}

/** Categories that can receive products (no subcategories) */
export function flattenLeafCategories(
  tree: Category[],
  depth = 0,
  parentName?: string,
): Array<Category & { depth: number; label: string }> {
  const out: Array<Category & { depth: number; label: string }> = [];
  for (const cat of tree) {
    if (cat.children?.length) {
      out.push(...flattenLeafCategories(cat.children, depth + 1, cat.name));
    } else {
      out.push({
        ...cat,
        depth,
        label: parentName ? `${parentName} ← ${cat.name}` : cat.name,
      });
    }
  }
  return out;
}
