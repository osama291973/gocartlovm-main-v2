import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { AuthProvider } from "@/contexts/AuthContext";
import MainLayout from "@/components/layout/MainLayout";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import ProductDetail from "./pages/ProductDetail";
import Stores from "./pages/Stores";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Account from "./pages/Account";
import Auth from "./pages/Auth";
import SellerLayout from "./pages/SellerLayout";
import SellerDashboardPage from "./pages/SellerDashboardPage";
import AddProductPage from "./pages/AddProductPage";
import ManageProductPage from "./pages/ManageProductPage";
import OrdersPage from "./pages/OrdersPage";
import CreateStore from "./pages/CreateStore";
import AdminDashboard from "./pages/AdminDashboard";
import AdminTranslations from "./pages/AdminTranslations";
import AdminSellerApplications from "./pages/AdminSellerApplications";
import AdminCoupons from "./pages/AdminCoupons";
import AdminStores from "./pages/AdminStores";
import NotFound from "./pages/NotFound";
import SupabaseDebug from "./pages/SupabaseDebug";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<MainLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/stores" element={<Stores />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/account" element={<Account />} />
              </Route>
              <Route path="/auth" element={<Auth />} />
              <Route path="/create-store" element={<CreateStore />} />
              
              {/* Seller Routes with Layout */}
              <Route path="/seller" element={<SellerLayout />}>
                <Route path="dashboard" element={<SellerDashboardPage />} />
                <Route path="add-product" element={<AddProductPage />} />
                <Route path="manage-product" element={<ManageProductPage />} />
                <Route path="orders" element={<OrdersPage />} />
                <Route index element={<SellerDashboardPage />} />
              </Route>
              
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/translations" element={<AdminTranslations />} />
              <Route path="/admin/seller-applications" element={<AdminSellerApplications />} />
              <Route path="/admin/stores" element={<AdminStores />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/supabase-debug" element={<SupabaseDebug />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
