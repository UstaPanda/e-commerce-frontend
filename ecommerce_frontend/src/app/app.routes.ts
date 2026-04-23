import { Routes } from '@angular/router';
import { authGuard, guestGuard, corporateRedirectGuard, adminGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'app/dashboard', pathMatch: 'full' },
  {
    path: 'auth',
    children: [
      { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/login/login').then(m => m.LoginComponent) },
      { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/auth/register/register').then(m => m.RegisterComponent) },
      { path: 'verify', loadComponent: () => import('./pages/auth/verify/verify').then(m => m.VerifyComponent) },
      { path: 'forgot-password', loadComponent: () => import('./pages/auth/forgot-password/forgot-password').then(m => m.ForgotPasswordComponent) },
      { path: 'reset-password', loadComponent: () => import('./pages/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent) },
      { path: 'oauth2/callback', loadComponent: () => import('./pages/auth/oauth2-callback/oauth2-callback').then(m => m.OAuth2CallbackComponent) },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () => import('./pages/shell/shell').then(m => m.ShellComponent),
    children: [
      { path: 'dashboard', canActivate: [corporateRedirectGuard], loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent) },
      { path: 'analytics', loadComponent: () => import('./pages/analytics/analytics').then(m => m.AnalyticsPageComponent) },
      { path: 'orders', loadComponent: () => import('./pages/orders/orders').then(m => m.OrdersComponent) },
      { path: 'products', redirectTo: '/app/dashboard', pathMatch: 'full' },
      { path: 'ai-assistant', loadComponent: () => import('./pages/ai-assistant/ai-assistant').then(m => m.AiAssistantComponent) },
      { path: 'products/:id', loadComponent: () => import('./pages/product-detail/product-detail').then(m => m.ProductDetailComponent) },
      { path: 'cart', loadComponent: () => import('./pages/cart/cart').then(m => m.CartComponent) },
      { path: 'profile', loadComponent: () => import('./pages/profile/profile').then(m => m.ProfileComponent) },
      { path: 'stores/:id', loadComponent: () => import('./pages/store-detail/store-detail').then(m => m.StoreDetailComponent) },
      { path: 'my-store', loadComponent: () => import('./pages/my-store/my-store').then(m => m.MyStoreComponent) },
      { path: 'shipments', loadComponent: () => import('./pages/shipments/shipments').then(m => m.ShipmentsComponent) },
      {
        path: 'admin',
        canActivate: [adminGuard],
        children: [
          { path: '', loadComponent: () => import('./pages/admin/admin-panel/admin-panel').then(m => m.AdminPanelComponent) },
          { path: 'dashboard',  loadComponent: () => import('./pages/admin/dashboard/admin-dashboard').then(m => m.AdminDashboardComponent) },
          { path: 'users',      loadComponent: () => import('./pages/admin/users/admin-users').then(m => m.AdminUsersComponent) },
          { path: 'stores',     loadComponent: () => import('./pages/admin/stores/admin-stores').then(m => m.AdminStoresComponent) },
          { path: 'categories', loadComponent: () => import('./pages/admin/categories/admin-categories').then(m => m.AdminCategoriesComponent) },
          { path: 'audit-logs', loadComponent: () => import('./pages/admin/audit-logs/admin-audit-logs').then(m => m.AdminAuditLogsComponent) },
          { path: 'settings',  loadComponent: () => import('./pages/admin/settings/admin-settings').then(m => m.AdminSettingsComponent) },
        ],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'app/dashboard' },
];
