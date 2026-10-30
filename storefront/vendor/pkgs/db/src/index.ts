export interface MenuItem {
  id: string
  menuId: string
  label: string
  url: string
  position: number
  parentId: string | null
}

export namespace Prisma {
  export type InputJsonValue = unknown
  export type InputJsonObject = Record<string, unknown>
  export type TransactionClient = DemoDatabaseClient
}

type DemoDelegate = {
  findMany: (...args: any[]) => Promise<DemoRecord[]>
  findFirst: (...args: any[]) => Promise<DemoRecord | null>
  findUnique: (...args: any[]) => Promise<DemoRecord | null>
  findUniqueOrThrow: (...args: any[]) => Promise<DemoRecord>
  count: (...args: any[]) => Promise<number>
  aggregate: (...args: any[]) => Promise<DemoRecord>
  [operation: string]: (...args: any[]) => Promise<any>
}

type DemoRecord = {
  items: DemoRecord[]
  images: DemoRecord[]
  variants: DemoRecord[]
  levels: DemoRecord[]
  products: DemoRecord[]
  fulfillments: DemoRecord[]
  addresses: DemoRecord[]
  collections: DemoRecord[]
  product: DemoRecord
  [field: string]: any
}

const demoRecord = (record: Record<string, any>): DemoRecord => ({
  items: [],
  images: [],
  variants: [],
  levels: [],
  products: [],
  fulfillments: [],
  addresses: [],
  collections: [],
  product: {} as DemoRecord,
  ...record,
})

type DemoDatabaseClient = {
  $transaction: (work: (tx: DemoDatabaseClient) => Promise<any>) => Promise<any>
  abandonedCheckout: DemoDelegate
  adminNotification: DemoDelegate
  affiliate: DemoDelegate
  blogPost: DemoDelegate
  collection: DemoDelegate
  collectionProduct: DemoDelegate
  customer: DemoDelegate
  discount: DemoDelegate
  giftCard: DemoDelegate
  heroSlide: DemoDelegate
  loginCode: DemoDelegate
  menu: DemoDelegate
  notificationTemplate: DemoDelegate
  oAuthIdentity: DemoDelegate
  order: DemoDelegate
  orderEvent: DemoDelegate
  orderItem: DemoDelegate
  page: DemoDelegate
  partnerApplication: DemoDelegate
  policy: DemoDelegate
  previewDraft: DemoDelegate
  product: DemoDelegate
  productVariant: DemoDelegate
  review: DemoDelegate
  setting: DemoDelegate
  shippingRate: DemoDelegate
  shippingZone: DemoDelegate
  stockAlert: DemoDelegate
  storeVisit: DemoDelegate
  taxRate: DemoDelegate
  wishlistItem: DemoDelegate
}

const unavailable = () => new Error('Database features are disabled in this frontend demo.')

const products: DemoRecord[] = [
  demoRecord({
    id: 'demo-bundle-men',
    handle: 'sample-mens-streetwear-bundle',
    title: "Sample Men's Streetwear Bundle (3 Pieces)",
    vendor: 'Rade Street Demo',
    status: 'active',
    productType: 'Sample Bundle',
    optionName: 'Size',
    descriptionHtml: '<p>A sample bundle for previewing the storefront layout. This is not a real product.</p>',
    seoTitle: null,
    seoDescription: null,
    tags: ['demo', 'men', 'streetwear'],
    createdAt: new Date('2026-01-03T00:00:00Z'),
    images: [{ url: '/images/hero/banner-desktop.jpg', alt: 'Sample streetwear bundle', position: 0 }],
    variants: [
      { id: 'demo-men-m', title: 'M', price: 129900, compareAtPrice: null, trackInventory: false, continueSelling: true, position: 0, levels: [] },
      { id: 'demo-men-l', title: 'L', price: 129900, compareAtPrice: null, trackInventory: false, continueSelling: true, position: 1, levels: [] },
    ],
  }),
  demoRecord({
    id: 'demo-bundle-women',
    handle: 'sample-womens-streetwear-bundle',
    title: "Sample Women's Streetwear Bundle (2 Pieces)",
    vendor: 'Rade Street Demo',
    status: 'active',
    productType: 'Sample Bundle',
    optionName: 'Size',
    descriptionHtml: '<p>A sample bundle for previewing the storefront layout. This is not a real product.</p>',
    seoTitle: null,
    seoDescription: null,
    tags: ['demo', 'women', 'streetwear'],
    createdAt: new Date('2026-01-02T00:00:00Z'),
    images: [{ url: '/images/hero/banner-mobile.jpg', alt: 'Sample streetwear bundle', position: 0 }],
    variants: [
      { id: 'demo-women-s', title: 'S', price: 99900, compareAtPrice: null, trackInventory: false, continueSelling: true, position: 0, levels: [] },
      { id: 'demo-women-m', title: 'M', price: 99900, compareAtPrice: null, trackInventory: false, continueSelling: true, position: 1, levels: [] },
    ],
  }),
  demoRecord({
    id: 'demo-bundle-unisex',
    handle: 'sample-unisex-everyday-bundle',
    title: 'Sample Unisex Everyday Bundle (4 Pieces)',
    vendor: 'Rade Street Demo',
    status: 'active',
    productType: 'Sample Bundle',
    optionName: 'Size',
    descriptionHtml: '<p>A sample bundle for previewing the storefront layout. This is not a real product.</p>',
    seoTitle: null,
    seoDescription: null,
    tags: ['demo', 'unisex', 'everyday'],
    createdAt: new Date('2026-01-01T00:00:00Z'),
    images: [{ url: '/images/hero/banner-desktop.jpg', alt: 'Sample everyday bundle', position: 0 }],
    variants: [
      { id: 'demo-unisex-m', title: 'M', price: 159900, compareAtPrice: null, trackInventory: false, continueSelling: true, position: 0, levels: [] },
      { id: 'demo-unisex-l', title: 'L', price: 159900, compareAtPrice: null, trackInventory: false, continueSelling: true, position: 1, levels: [] },
    ],
  }),
]

const collections: DemoRecord[] = [
  demoRecord({ id: 'demo-collection-men', handle: 'mens-bundles', title: "Men's Bundles", descriptionHtml: '', seoTitle: null, seoDescription: null, imageUrl: '/images/hero/banner-desktop.jpg', published: true, productIds: ['demo-bundle-men', 'demo-bundle-unisex'] }),
  demoRecord({ id: 'demo-collection-women', handle: 'womens-bundles', title: "Women's Bundles", descriptionHtml: '', seoTitle: null, seoDescription: null, imageUrl: '/images/hero/banner-mobile.jpg', published: true, productIds: ['demo-bundle-women'] }),
  demoRecord({ id: 'demo-collection-unisex', handle: 'everyday-bundles', title: 'Everyday Bundles', descriptionHtml: '', seoTitle: null, seoDescription: null, imageUrl: '/images/hero/banner-desktop.jpg', published: true, productIds: ['demo-bundle-unisex'] }),
]

const menuItems: Record<string, MenuItem[]> = {
  'main-menu': [
    { id: 'demo-nav-shop', menuId: 'demo-main', label: 'Shop', url: '/collections/all', position: 0, parentId: null },
    { id: 'demo-nav-how', menuId: 'demo-main', label: 'How it works', url: '/pages/how-it-works', position: 1, parentId: null },
    { id: 'demo-nav-about', menuId: 'demo-main', label: 'About', url: '/pages/about', position: 2, parentId: null },
    { id: 'demo-nav-contact', menuId: 'demo-main', label: 'Contact', url: '/pages/contact', position: 3, parentId: null },
  ],
  footer: [
    { id: 'demo-footer-about', menuId: 'demo-footer', label: 'About', url: '/pages/about', position: 0, parentId: null },
    { id: 'demo-footer-contact', menuId: 'demo-footer', label: 'Contact', url: '/pages/contact', position: 1, parentId: null },
    { id: 'demo-footer-how', menuId: 'demo-footer', label: 'How it works', url: '/pages/how-it-works', position: 2, parentId: null },
  ],
}

const productCollections = collections.flatMap((collection) =>
  collection.productIds.map((productId: string, position: number) => ({ collectionId: collection.id, productId, position })),
)

const matchesProduct = (product: DemoRecord, where: DemoRecord = demoRecord({})) => {
  if (where.status && product.status !== where.status) return false
  if (where.handle && product.handle !== where.handle) return false
  if (where.id?.not === product.id || where.id?.notIn?.includes(product.id)) return false
  const collectionId = (where as Record<string, any>).collections?.some?.collectionId
  if (collectionId && !productCollections.some((row) => row.productId === product.id && row.collectionId === collectionId)) return false
  if (where.OR?.length && !where.OR.some((condition: DemoRecord) => {
    if (condition.tags?.has) return product.tags.includes(condition.tags.has)
    const text = condition.title?.contains ?? condition.productType?.contains
    return typeof text === 'string' && `${product.title} ${product.productType}`.toLowerCase().includes(text.toLowerCase())
  })) return false
  return true
}

const collectionView = (collection: DemoRecord): DemoRecord => {
  const related = collection.productIds
    .map((id: string, position: number) => ({ product: products.find((product) => product.id === id), position }))
    .filter((entry: { product?: DemoRecord }) => entry.product)
  return demoRecord({
    ...collection,
    products: related.map(({ product, position }: { product?: DemoRecord; position: number }) => demoRecord({
      productId: product!.id,
      collectionId: collection.id,
      position,
      product: product!,
    })),
    _count: { products: related.length },
  })
}

const db = new Proxy(
  {},
  {
    get: (_target, model: string) => {
      if (model === '$transaction') return async () => { throw unavailable() }
      return new Proxy(
        {},
        {
          get: (_delegate, operation: string) => {
            if (model === 'product' && operation === 'findMany') return async (query: DemoRecord = demoRecord({})) =>
              products.filter((product) => matchesProduct(product, query.where)).slice(query.skip ?? 0, query.take == null ? undefined : (query.skip ?? 0) + query.take)
            if (model === 'product' && operation === 'findFirst') return async (query: DemoRecord = demoRecord({})) =>
              products.find((product) => matchesProduct(product, query.where)) ?? null
            if (model === 'collection' && operation === 'findMany') return async (query: DemoRecord = demoRecord({})) =>
              collections
                .filter((collection) => collection.published && !query.where?.handle?.notIn?.includes(collection.handle))
                .map(collectionView)
            if (model === 'collection' && operation === 'findFirst') return async (query: DemoRecord = demoRecord({})) => {
              const collection = collections.find((entry) => entry.handle === query.where?.handle)
              return collection ? collectionView(collection) : null
            }
            if (model === 'collectionProduct' && operation === 'findMany') return async (query: DemoRecord = demoRecord({})) =>
              productCollections
                .filter((row) => !query.where?.productId || row.productId === query.where.productId)
                .map((row) => demoRecord({ ...row }))
            if (model === 'menu' && operation === 'findUnique') return async (query: DemoRecord = demoRecord({})) => demoRecord({
              id: `demo-${query.where?.handle ?? ''}`,
              handle: query.where?.handle,
              items: menuItems[query.where?.handle] ?? [],
            })
            if (operation === 'findMany') return async () => []
            if (operation === 'findFirst' || operation === 'findUnique') return async () => null
            if (operation === 'count') return async () => 0
            if (operation === 'aggregate') return async () => demoRecord({ _count: { _all: 0 }, _avg: {}, _sum: {}, _min: {}, _max: {} })
            if (operation === 'findUniqueOrThrow') return async () => { throw unavailable() }
            if (operation === '$transaction') return async () => { throw unavailable() }
            return async () => { throw new Error(`${model}.${operation} is unavailable in this frontend demo.`) }
          },
        },
      )
    },
  },
) as DemoDatabaseClient

export { db }
