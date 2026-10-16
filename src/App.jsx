import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import AppShell from '@/components/vimi/AppShell';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AuthCallback from '@/pages/AuthCallback';
import BuyerHome from '@/pages/buyer/Home';
import BuyerOrders from '@/pages/buyer/Orders';
import BuyerProfile from '@/pages/buyer/Profile';
import ProfileEdit from '@/pages/ProfileEdit';
import Locations from '@/pages/Locations';
import SellerHome from '@/pages/seller/Home';
import SellerProducts from '@/pages/seller/Products';
import ProductCreate from '@/pages/seller/ProductCreate';
import ProductDetailSeller from '@/pages/seller/ProductDetail';
import ProductEdit from '@/pages/seller/ProductEdit';
import SellerCategories from '@/pages/seller/Categories';
import SellerBranchInventory from '@/pages/seller/BranchInventory';
import SellerProfile from '@/pages/seller/Profile';
import SellerStatistics from '@/pages/seller/Statistics';
import SellerOrders from '@/pages/seller/Orders';
import SellerOrderDetail from '@/pages/seller/OrderDetail';
import BuyerBranchProducts from '@/pages/buyer/BranchProducts';
import BuyerProductDetail from '@/pages/buyer/ProductDetail';
import BusinessCreate from '@/pages/seller/BusinessCreate';
import BusinessProfile from '@/pages/seller/BusinessProfile';
import BranchCreate from '@/pages/seller/BranchCreate';
import BranchEdit from '@/pages/seller/BranchEdit';
import BranchDetail from '@/pages/seller/BranchDetail';
import Store from '@/pages/buyer/Store';
import BuyerBranch from '@/pages/buyer/BuyerBranch';
import { BusinessProvider } from '@/lib/BusinessContext';
import { BuyerProvider } from '@/lib/BuyerContext';
import Search from '@/pages/buyer/Search';
import Cart from '@/pages/buyer/Cart';
import Checkout from '@/pages/buyer/Checkout';
import Addresses from '@/pages/buyer/Addresses';
import AddressEdit from '@/pages/buyer/AddressEdit';
import { CartProvider } from '@/lib/CartContext';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <BusinessProvider>
    <BuyerProvider>
    <CartProvider>
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
          <Route element={<AppShell />}>
            <Route path="/" element={<BuyerHome />} />
            <Route path="/store/:storeId" element={<Store />} />
            <Route path="/branch/:branchId" element={<BuyerBranch />} />
            <Route path="/branch/:branchId/products" element={<BuyerBranchProducts />} />
            <Route path="/branch/:branchId/products/:productId" element={<BuyerProductDetail />} />
            <Route path="/product/:productId" element={<BuyerProductDetail />} />
            <Route path="/search" element={<Search />} />
            <Route path="/orders" element={<BuyerOrders />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/addresses/new" element={<AddressEdit />} />
            <Route path="/addresses/:id/edit" element={<AddressEdit />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/profile" element={<BuyerProfile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/seller" element={<SellerHome />} />
            <Route path="/seller/businesses/new" element={<BusinessCreate />} />
            <Route path="/seller/businesses/:id" element={<BusinessProfile />} />
            <Route path="/seller/businesses/:id/branches/new" element={<BranchCreate />} />
            <Route path="/seller/businesses/:id/branches/:branchId" element={<BranchDetail />} />
            <Route path="/seller/businesses/:id/branches/:branchId/edit" element={<BranchEdit />} />
            <Route path="/seller/businesses/:id/branches/:branchId/inventory" element={<SellerBranchInventory />} />
            <Route path="/seller/products" element={<SellerProducts />} />
            <Route path="/seller/products/new" element={<ProductCreate />} />
            <Route path="/seller/products/categories" element={<SellerCategories />} />
            <Route path="/seller/products/:id" element={<ProductDetailSeller />} />
            <Route path="/seller/products/:id/edit" element={<ProductEdit />} />
            <Route path="/seller/profile" element={<SellerProfile />} />
            <Route path="/seller/statistics" element={<SellerStatistics />} />
            <Route path="/seller/orders" element={<SellerOrders />} />
            <Route path="/seller/orders/:id" element={<SellerOrderDetail />} />
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </CartProvider>
      </BuyerProvider>
    </BusinessProvider>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App