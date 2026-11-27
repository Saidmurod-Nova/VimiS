import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import MarketplaceShell from '@/components/vimi/MarketplaceShell';
import BusinessConsoleShell from '@/components/vimi/BusinessConsoleShell';
import BusinessAccessGate from '@/components/vimi/BusinessAccessGate';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import AuthCallback from '@/pages/AuthCallback';
import BuyerHome from '@/pages/buyer/Home';
import BuyerOrders from '@/pages/buyer/Orders';
import BuyerNotifications from '@/pages/buyer/Notifications';
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
import SellerStatistics from '@/pages/seller/Statistics';
import SellerOrders from '@/pages/seller/Orders';
import SellerCustomers from '@/pages/seller/Customers';
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
import BuyerOrderDetail from '@/pages/buyer/OrderDetail';
import BuyerCatalog from '@/pages/buyer/Catalog';
import BuyerCategories from '@/pages/buyer/Categories';
import Businesses from '@/pages/seller/Businesses';
import PlatformPlaceholder from '@/pages/PlatformPlaceholder';
import ProfileSetupGate from '@/components/vimi/ProfileSetupGate';
import BusinessSelectionShell from '@/components/vimi/BusinessSelectionShell';
import { ThemeProvider } from '@/lib/ThemeContext';
import AdminRoute from '@/components/AdminRoute';
import TelegramBots from '@/pages/TelegramBots';
import TelegramMiniApp from '@/pages/TelegramMiniApp';
import { CourierDemoProvider } from '@/lib/CourierDemoContext';
import CourierLayout from '@/components/courier/CourierLayout';
import CourierDashboard from '@/pages/courier/Dashboard';
import { CompletedDeliveries } from '@/pages/courier/Deliveries';
import ActiveDelivery from '@/pages/courier/ActiveDelivery';

function LegacyBusinessRedirect() {
  const { pathname, search } = useLocation();
  const { id } = useParams();
  const businessId = id;

  if (!businessId) return <Navigate to="/business" replace />;

  let destination = pathname.replace(/^\/seller\/businesses\/[^/]+/, `/business/${businessId}`);
  if (destination === pathname) {
    destination = pathname.replace(/^\/seller/, `/business/${businessId}`);
  }
  destination = destination.replace(`/business/${businessId}/statistics`, `/business/${businessId}/analytics`);
  destination = destination.replace(`/business/${businessId}/profile/telegram`, `/business/${businessId}/telegram`);
  destination = destination.replace(`/business/${businessId}/profile`, `/business/${businessId}/settings`);

  return <Navigate to={`${destination}${search}`} replace />;
}

function LoginRedirect() {
  const location = useLocation();
  const returnTo = `${location.pathname}${location.search}`;
  return <Navigate to={`/login?returnTo=${encodeURIComponent(returnTo)}`} replace />;
}

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, user } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // An expired or missing session still permits public Marketplace routes;
  // protected routes below send the user to sign in.
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    }
  }

  // Render the main app
  return (
    <CourierDemoProvider key={user?.id || "signed-out"}>
    <BusinessProvider>
    <BuyerProvider>
    <CartProvider>
    <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
          <Route element={<MarketplaceShell />}>
            <Route path="/marketplace" element={<Navigate to="/" replace />} />
            <Route path="/" element={<BuyerHome />} />
            <Route path="/catalog" element={<BuyerCatalog />} />
            <Route path="/categories" element={<BuyerCategories />} />
            <Route path="/services" element={<PlatformPlaceholder
              title="Xizmatlar"
              description="Xizmatlar katalogi hali tayyorlanmoqda. Hozircha mahsulotlar va do‘konlarni Marketplace’dan ko‘rishingiz mumkin."
              linkTo="/catalog"
              linkLabel="Mahsulotlarni ko‘rish"
            />} />
            <Route path="/store/:storeId" element={<Store />} />
            <Route path="/branch/:branchId" element={<BuyerBranch />} />
            <Route path="/branch/:branchId/products" element={<BuyerBranchProducts />} />
            <Route path="/branch/:branchId/products/:productId" element={<BuyerProductDetail />} />
            <Route path="/product/:productId" element={<BuyerProductDetail />} />
            <Route path="/search" element={<Search />} />
          </Route>
          <Route element={<ProtectedRoute unauthenticatedElement={<LoginRedirect />} />}>
          <Route path="/admin" element={<AdminRoute />} />
          <Route element={<ProfileSetupGate />}>
          <Route element={<MarketplaceShell />}>
            <Route path="/settings" element={<PlatformPlaceholder
              title="Sozlamalar"
              description="Hisob sozlamalari bo‘limi bosqichma-bosqich kengaytirilmoqda. Profil sahifasida mavjud ma’lumotlaringizni ko‘rishingiz va tahrirlashingiz mumkin."
              linkTo="/profile"
              linkLabel="Profilga o‘tish"
            />} />
            <Route path="/orders" element={<BuyerOrders />} />
            <Route path="/notifications" element={<BuyerNotifications />} />
            <Route path="/orders/:id" element={<BuyerOrderDetail />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/addresses" element={<Addresses />} />
            <Route path="/addresses/new" element={<AddressEdit />} />
            <Route path="/addresses/:id/edit" element={<AddressEdit />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/profile" element={<BuyerProfile />} />
            <Route path="/profile/edit" element={<ProfileEdit />} />
            <Route path="/profile/telegram" element={<TelegramBots />} />
          </Route>
          </Route>
          <Route path="/business" element={<BusinessSelectionShell />}>
            <Route index element={<Businesses />} />
            <Route path="new" element={<BusinessCreate />} />
          </Route>
          <Route path="/business/:businessId" element={<BusinessAccessGate />}>
            <Route element={<BusinessConsoleShell />}>
              <Route index element={<SellerHome />} />
              <Route path="products" element={<SellerProducts />} />
              <Route path="products/new" element={<ProductCreate />} />
              <Route path="products/categories" element={<SellerCategories />} />
              <Route path="products/:id" element={<ProductDetailSeller />} />
              <Route path="products/:id/edit" element={<ProductEdit />} />
              <Route path="orders" element={<SellerOrders />} />
              <Route path="orders/:id" element={<SellerOrderDetail />} />
              <Route path="customers" element={<SellerCustomers />} />
              <Route path="analytics" element={<SellerStatistics />} />
              <Route path="settings" element={<BusinessProfile />} />
              <Route path="branches/new" element={<BranchCreate />} />
              <Route path="branches/:branchId" element={<BranchDetail />} />
              <Route path="branches/:branchId/edit" element={<BranchEdit />} />
              <Route path="branches/:branchId/inventory" element={<SellerBranchInventory />} />
              <Route path="telegram" element={<TelegramBots />} />
            </Route>
          </Route>
          <Route path="/seller" element={<Navigate to="/business" replace />} />
          <Route path="/seller/businesses" element={<Navigate to="/business" replace />} />
          <Route path="/seller/businesses/new" element={<Navigate to="/business/new" replace />} />
          <Route path="/seller/businesses/:id/*" element={<LegacyBusinessRedirect />} />
          <Route path="/seller/*" element={<LegacyBusinessRedirect />} />
          <Route path="/courier" element={<Outlet />}>
            <Route element={<CourierLayout />}>
              <Route index element={<CourierDashboard />} />
              <Route path="completed" element={<CompletedDeliveries />} />
              <Route path="orders/:deliveryId" element={<ActiveDelivery />} />
            </Route>
          </Route>
        </Route>
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      </CartProvider>
      </BuyerProvider>
    </BusinessProvider>
      </CourierDemoProvider>
  );
};

function AuthenticatedRoot() {
  return (
    <AuthProvider>
      <ScrollToTop />
      <AuthenticatedApp />
    </AuthProvider>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <Routes>
            <Route path="/telegram-miniapp" element={<TelegramMiniApp />} />
            <Route path="*" element={<AuthenticatedRoot />} />
          </Routes>
          <Toaster />
        </Router>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default App