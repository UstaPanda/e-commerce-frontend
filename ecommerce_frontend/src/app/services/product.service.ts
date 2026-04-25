import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../enviroments/enviroments';

export interface Category {
  id: number;
  name: string;
  parent?: { id: number; name: string } | null;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  unitPrice: number;
  stockQuantity: number;
  productImportance: string;
  active: boolean;
  store: { id: number; name: string };
  category: Category | null;
  avgRating: number;
  reviewCount: number;
  imageUrl?: string | null;
}

const CATEGORY_PHOTOS: { keywords: string[]; ids: string[] }[] = [
  {
    keywords: ['food','eat','pizza','dish','meal','grocery','fruit','drink','snack','beverage','bread'],
    ids: [
      '1565299624946-b28f40a0ae38','1568901346375-23c9450c58cd','1512621776951-a57141f2eefd',
      '1495474472287-4d71bcdd2085','1553621042-f6e147245754','1490645935967-10de6ba17061',
      '1504674900247-0877df9cc836','1540189549336-e6e99eb4b5e0','1476224203421-74177e79be9f',
    ]
  },
  {
    keywords: ['beauty','cosmetic','makeup','lipstick','perfume','skincare','skin','lotion','serum','cream'],
    ids: [
      '1596462502278-27bfdc403348','1541643600914-78b084683702','1522335789203-aabd1fc54bc9',
      '1571781926291-c477ebfd024b','1487412947147-5cebf100d293','1519415510560-58b71f04867f',
    ]
  },
  {
    keywords: ['electronic','tech','laptop','computer','tablet','gadget','monitor','printer'],
    ids: [
      '1496181133206-80ce9b88a853','1517694712202-14dd9538aa97','1593642632559-0c6d3fc62b89',
      '1525547719571-a2d4ac8945e2','1587831990711-23ca6441447b','1498049794561-7780e7231661',
    ]
  },
  {
    keywords: ['phone','mobile','smartphone','iphone','android','cell'],
    ids: [
      '1511707171634-5f897ff02aa9','1592750475338-74b7b21085ab','1574944985070-8f3ebacc8d38',
      '1580910051074-3eb694886505','1565849904461-04a58ad377e0',
    ]
  },
  {
    keywords: ['headphone','earphone','speaker','audio','music','guitar','piano'],
    ids: [
      '1505740420928-5e560c06d30e','1608043152269-423dbba4e7e1','1484704849700-f032a568e944',
      '1519892300165-cb5542fb47c7','1545454782-a6c42b32a50f',
    ]
  },
  {
    keywords: ['shoe','sneaker','boot','footwear','sandal','nike','adidas'],
    ids: [
      '1542291026-7eec264c27ff','1542314831-068cd1dbfeeb','1491553895911-0055eca6402d',
      '1600185365926-3a2ce3cdb9eb','1539185941105-42f3b913b1f2',
    ]
  },
  {
    keywords: ['cloth','fashion','wear','shirt','dress','jacket','coat','apparel','textile'],
    ids: [
      '1434389677669-e08b4cac3105','1515886657613-9f3515b0c78f','1521223890158-f9f7c3d5d504',
      '1483985988355-763728e1fed4','1558769132-cb1aea458c5e','1469334031218-e382a71b716b',
    ]
  },
  {
    keywords: ['watch','clock','timer','wrist'],
    ids: [
      '1523275335684-37898b6baf30','1526045431048-f857369baa48','1547996160-49bf4b909571',
      '1585386959984-a4155224a1ad',
    ]
  },
  {
    keywords: ['jewel','ring','necklace','bracelet','earring','gold','diamond'],
    ids: [
      '1515562141207-7a88fb7ce338','1599643478518-a784e5dc4c8f','1611591437281-460bfbe1220a',
      '1589128777073-263566ae5e4d','1573408301185-9521ef7d3781',
    ]
  },
  {
    keywords: ['bag','handbag','backpack','luggage','wallet','purse','tote'],
    ids: [
      '1548036328-c9fa89d128fa','1553062407-98eeb64c6a62','1491637639811-60e2756cc1c7',
      '1590874103328-eac38a683ce7','1575844264771-892081089af5',
    ]
  },
  {
    keywords: ['toy','game','play','kids','children','lego','puzzle','doll'],
    ids: [
      '1558618666-fcd25c85cd64','1545558014-8692077e9b5c','1566576912321-d58ddd7a6088',
      '1596461404969-9ae70f2830c1','1587654780291-b74b2bf0d7cb',
    ]
  },
  {
    keywords: ['sport','fitness','gym','exercise','training','yoga','running','workout','ball'],
    ids: [
      '1534438327276-14e5300c3a48','1517836357463-d25dfeac3438','1526232761682-d26e03ac148e',
      '1571019613454-1cb2f99b2d8b','1574680096145-d05b474e2155',
    ]
  },
  {
    keywords: ['book','read','magazine','novel','education','study'],
    ids: [
      '1481627834876-b7833e8f5570','1544716278-ca5e3f4abd8c','1512820790803-83ca734da794',
      '1497633762265-9d179a990aa6','1524995997471-2ed43c0b5d2b',
    ]
  },
  {
    keywords: ['home','furniture','sofa','chair','table','bed','lamp','decor'],
    ids: [
      '1555041469-a586c61ea9bc','1493663284031-b7e3aaa3ca01','1538688525198-9b88f6f53126',
      '1567016432779-094069958ea5','1524758631624-e2822132978e',
    ]
  },
  {
    keywords: ['kitchen','cook','utensil','pan','pot','cutlery'],
    ids: [
      '1556909114-f6e7ad7d3136','1495195129352-aeb325a55b65','1484978105596-88e0c6a27e4e',
      '1590794056226-79ef3a47ccf5','1547592166-23ac45744acd',
    ]
  },
  {
    keywords: ['pet','animal','dog','cat','bird','fish'],
    ids: [
      '1543466835-00a7907e9de1','1514888286974-6c03e2ca1dba','1587300003388-59208cc962cb',
      '1548767797-d8c844163c4a','1518020382113-a7e8fc38eac9',
    ]
  },
  {
    keywords: ['car','auto','vehicle','motor','motorcycle','bike'],
    ids: [
      '1544636331-e26879cd4d9b','1502877338535-766e1452684a','1549317661-cf369843d13e',
      '1558618047-3f9c3e9c6c4e','1568605117036-5c629c14fc28',
    ]
  },
  {
    keywords: ['garden','plant','flower','outdoor','grass'],
    ids: [
      '1416879595882-3373a0480b5b','1490750967868-88df5691cc4b','1501004318641-b39e6451bec6',
      '1477064996969-f5a10da58b3b','1558904541-efa843a96f01',
    ]
  },
  {
    keywords: ['health','vitamin','supplement','medical','pharmacy','medicine'],
    ids: [
      '1584308666744-24d5c474f2ae','1585435557343-3b092031a831','1471864190281-a93a3070b6de',
      '1576671081837-49000212a370','1512678080861-3cf4e5f39fa5',
    ]
  },
  {
    keywords: ['camera','photo','lens','tripod','photography'],
    ids: [
      '1516035069371-29a1b244cc32','1502920514313-54300b975dba','1495121553079-4c961bcfd54a',
      '1567581935884-3349723552ca',
    ]
  },
];

const STOP_WORDS = new Set(['the','a','an','and','or','of','for','in','on','with','to','is','it','at','by','blue','red','green','black','white','pink','yellow']);

function buildFlickrQuery(product: Product): string {
  const words = product.name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  const meaningful = words.slice(0, 2);
  return meaningful.length > 0 ? meaningful.join(',') : 'product';
}

export function buildProductImageUrl(name: string, categoryName?: string | null): string {
  const text = ((categoryName ?? '') + ' ' + name).toLowerCase();
  for (const entry of CATEGORY_PHOTOS) {
    if (entry.keywords.some(k => text.includes(k))) {
      const idx = Math.floor(Math.random() * entry.ids.length);
      return `https://images.unsplash.com/photo-${entry.ids[idx]}?w=600&h=450&fit=crop&auto=format&q=80`;
    }
  }
  const words = name.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w)).slice(0, 2);
  const kw = words.length > 0 ? words.join(',') : 'product';
  return `https://loremflickr.com/600/450/${encodeURIComponent(kw)}?random=${Date.now()}`;
}

export function getProductImage(product: Product, width = 600, height?: number): string {
  if (product.imageUrl) return product.imageUrl;
  const h = height ?? Math.round(width * 0.75);
  const text = ((product.category?.name ?? '') + ' ' + product.name).toLowerCase();
  for (const entry of CATEGORY_PHOTOS) {
    if (entry.keywords.some(k => text.includes(k))) {
      const photoId = entry.ids[product.id % entry.ids.length];
      return `https://images.unsplash.com/photo-${photoId}?w=${width}&h=${h}&fit=crop&auto=format&q=80`;
    }
  }
  const keyword = buildFlickrQuery(product);
  return `https://loremflickr.com/${width}/${h}/${encodeURIComponent(keyword)}?lock=${product.id}`;
}

export interface ProductRequest {
  name: string;
  sku: string;
  description?: string;
  unitPrice: number;
  stockQuantity?: number;
  categoryId?: number;
  productImportance?: string;
  imageUrl?: string | null;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);

  getAll(page = 0, size = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products?page=${page}&size=${size}`);
  }

  search(keyword: string, page = 0, size = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products/search?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`);
  }

  getByStore(storeId: number, page = 0, size = 20): Observable<PageResponse<Product>> {
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products/store/${storeId}?page=${page}&size=${size}`);
  }

  filter(params: { keyword?: string; categoryId?: number; minPrice?: number; maxPrice?: number; minRating?: number; sortOrder?: string }, page = 0, size = 20): Observable<PageResponse<Product>> {
    const query = new URLSearchParams({ page: String(page), size: String(size) });
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.categoryId) query.set('categoryId', String(params.categoryId));
    if (params.minPrice != null) query.set('minPrice', String(params.minPrice));
    if (params.maxPrice != null) query.set('maxPrice', String(params.maxPrice));
    if (params.minRating != null) query.set('minRating', String(params.minRating));
    if (params.sortOrder) query.set('sortOrder', params.sortOrder);
    return this.http.get<PageResponse<Product>>(`${environment.apiUrl}/products/filter?${query}`);
  }

  getSuggestions(keyword: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/products/suggestions?keyword=${encodeURIComponent(keyword)}`);
  }

  getById(id: number): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}/products/${id}`);
  }

  getPopular(limit = 8): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products/popular?limit=${limit}`);
  }

  getStores(): Observable<{ content: { id: number; name: string; description: string }[] }> {
    return this.http.get<any>(`${environment.apiUrl}/stores?size=50`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/categories`);
  }

  getRootCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${environment.apiUrl}/categories/roots`);
  }

  create(storeId: number, data: ProductRequest): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products/store/${storeId}`, data);
  }

  update(id: number, data: ProductRequest): Observable<Product> {
    return this.http.put<Product>(`${environment.apiUrl}/products/${id}`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/products/${id}`);
  }
}
