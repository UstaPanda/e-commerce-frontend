
export default {
  bootstrap: () => import('./main.server.mjs').then(m => m.default),
  inlineCriticalCss: true,
  baseHref: '/',
  locale: undefined,
  routes: [
  {
    "renderMode": 1,
    "redirectTo": "/app/dashboard",
    "route": "/"
  },
  {
    "renderMode": 1,
    "redirectTo": "/auth/login",
    "route": "/auth"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-7QKBEGMH.js",
      "chunk-B53JHKWC.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/login"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-R2Q2K6J3.js",
      "chunk-B53JHKWC.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/register"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-XUCA3FTX.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/verify"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-RR6PUHBX.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/forgot-password"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-U7UMO4LE.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/auth/reset-password"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-7S3M7NBU.js"
    ],
    "route": "/auth/oauth2/callback"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "redirectTo": "/app/dashboard",
    "route": "/app"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/analytics"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/orders"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "redirectTo": "/app/dashboard",
    "route": "/app/products"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/products/*"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/ai-assistant"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/cart"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/profile"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/stores/*"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/my-store"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/shipments"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/dashboard"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/users"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/stores"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/categories"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/audit-logs"
  },
  {
    "renderMode": 1,
    "preload": [
      "chunk-QLQHYJH7.js",
      "chunk-R33V4XM5.js",
      "chunk-7I5D7KNP.js",
      "chunk-BGUXNVQL.js",
      "chunk-OV4HNQQ2.js",
      "chunk-GNB72DDO.js",
      "chunk-L5PURTTO.js"
    ],
    "route": "/app/admin/settings"
  },
  {
    "renderMode": 1,
    "redirectTo": "/app/dashboard",
    "route": "/**"
  }
],
  entryPointToBrowserMapping: undefined,
  assets: {
    'index.csr.html': {size: 28665, hash: 'a9f1be3d273b4fb76e3caf9c8452adf7f359aeb35934502cdd21ab6907418001', text: () => import('./assets-chunks/index_csr_html.mjs').then(m => m.default)},
    'index.server.html': {size: 17630, hash: 'b5338dfd6725e051b0e0c190a0b8ba48d410184a111e222686bf89bc3148c600', text: () => import('./assets-chunks/index_server_html.mjs').then(m => m.default)},
    'styles-B3UTYC66.css': {size: 83859, hash: 'wWgmos/5HT0', text: () => import('./assets-chunks/styles-B3UTYC66_css.mjs').then(m => m.default)}
  },
};
