import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Search, Edit, Package, FileText, DollarSign, BarChart3, ShoppingCart, Store, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface WooCommerceProduct {
  id: number;
  name: string;
  description: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  stock_quantity: number;
  stock_status: string;
  manage_stock: boolean;
  sku: string;
  weight: string;
  dimensions: {
    length: string;
    width: string;
    height: string;
  };
  image: string | null;
  categories: string[];
  status: string;
  created_at: string;
  updated_at: string;
}

const TiendaDigital = () => {
  const [products, setProducts] = useState<WooCommerceProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<WooCommerceProduct | null>(null);
  const [stockData, setStockData] = useState({
    stock_quantity: '',
    stock_status: 'instock'
  });
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Obtener productos de WooCommerce
  const fetchProducts = async (showRefreshToast = false) => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8081/woocommerce', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
        if (showRefreshToast) {
          toast({
            title: "Datos actualizados",
            description: `Se han cargado ${data.length} productos desde WooCommerce.`,
          });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Error al cargar productos",
          description: errorData.error || "No se pudieron cargar los productos de WooCommerce.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con la tienda digital.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Actualizar stock de producto
  const updateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8081/woocommerce/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          stock_quantity: parseInt(stockData.stock_quantity),
          stock_status: stockData.stock_status
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Stock actualizado",
          description: `El stock de "${result.product.name}" ha sido actualizado correctamente.`,
        });
        
        // Actualizar el producto en la lista local
        setProducts(products.map(p => 
          p.id === editingProduct.id 
            ? { ...p, stock_quantity: result.product.stock_quantity, stock_status: result.product.stock_status }
            : p
        ));
        
        setIsDialogOpen(false);
        setStockData({ stock_quantity: '', stock_status: 'instock' });
      } else {
        const errorData = await response.json();
        toast({
          title: "Error al actualizar",
          description: errorData.error || "No se pudo actualizar el stock.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error updating stock:', error);
      toast({
        title: "Error de conexión",
        description: "No se pudo conectar con la tienda digital.",
        variant: "destructive",
      });
    }
  };

  // Abrir diálogo para editar stock
  const handleEditStock = (product: WooCommerceProduct) => {
    setEditingProduct(product);
    setStockData({
      stock_quantity: product.stock_quantity?.toString() || '0',
      stock_status: product.stock_status || 'instock'
    });
    setIsDialogOpen(true);
  };

  // Filtrar productos por búsqueda
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.categories.some(cat => cat.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Funciones de paginación
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = filteredProducts.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      goToPage(currentPage - 1);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      goToPage(currentPage + 1);
    }
  };

  useEffect(() => {
    fetchProducts();
    
    // Configurar polling para actualización en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      fetchProducts();
    }, 30000); // 30 segundos
    
    // Limpiar el interval cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  // Reset página cuando cambia la búsqueda
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Store className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Conectando con la tienda digital...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button 
          onClick={() => navigate('/')}
          variant="ghost"
          size="sm"
          className="h-auto p-1 hover:bg-transparent hover:text-blue-600 transition-colors"
        >
          <Home className="h-3 w-3 mr-1" />
          Dashboard
        </Button>
        <span>/</span>
        <span className="text-blue-600 font-medium">Tienda Digital</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg">
              <Store className="h-7 w-7 md:h-8 md:w-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-blue-700 to-blue-600 bg-clip-text text-transparent">
              Tienda Digital
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-2">
            Gestión de stock y productos en WooCommerce
          </p>
        </div>
        <Button 
          onClick={() => fetchProducts(true)} 
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto border-blue-200 hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-blue-600" />
                Productos en Tienda
              </CardTitle>
              <CardDescription className="text-gray-600 dark:text-gray-400">
                {filteredProducts.length} productos encontrados
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="p-0">
          {currentProducts.length === 0 ? (
            <div className="text-center py-12">
              <Store className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                {searchTerm ? 'No se encontraron productos' : 'No hay productos'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {searchTerm 
                  ? 'Intenta con otros términos de búsqueda'
                  : 'No se encontraron productos en la tienda digital'}
              </p>
            </div>
          ) : (
            <>
            {/* Vista desktop - Tabla compacta */}
            <div className="hidden md:block">
              <div className="w-full">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 w-[200px]">Producto</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 w-[80px]">SKU</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 w-[100px]">Precio</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 w-[70px]">Stock</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 w-[80px]">Estado</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 w-[120px]">Categorías</TableHead>
                      <TableHead className="font-semibold text-gray-700 dark:text-gray-200 text-center w-[80px]">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentProducts.map((product, index) => (
                      <TableRow key={product.id} className={`hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 dark:hover:from-blue-900/10 dark:hover:to-indigo-900/10 transition-all duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                        <TableCell className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                              {product.image ? (
                                <img 
                                  src={product.image} 
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package className="h-5 w-5 text-gray-400" />
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold truncate text-gray-900 dark:text-gray-100 text-sm" title={product.name}>{product.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate" title={product.description}>
                                {product.description ? product.description.replace(/<[^>]*>/g, '').trim().substring(0, 30) + (product.description.replace(/<[^>]*>/g, '').trim().length > 30 ? '...' : '') : 'Sin descripción'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-600 dark:text-gray-400 p-3">
                          <span className="truncate block" title={product.sku}>{product.sku || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="space-y-1">
                            <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700 font-semibold text-xs">
                              ${Math.floor(product.price).toLocaleString()} CLP
                            </Badge>
                            {product.sale_price && (
                              <div className="text-xs text-gray-500 line-through">
                                ${Math.floor(product.regular_price).toLocaleString()} CLP
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className={`${product.stock_quantity > 0 ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" : "bg-gradient-to-r from-red-500 to-red-600"} text-xs`}>
                            {product.manage_stock ? product.stock_quantity : '∞'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3">
                          <Badge variant={product.stock_status === 'instock' ? 'default' : 'secondary'} className={`${product.stock_status === 'instock' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'} text-xs`}>
                            {product.stock_status === 'instock' ? 'En Stock' : 'Sin Stock'}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {product.categories.slice(0, 1).map((category, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs truncate max-w-[80px]" title={category}>
                                {category}
                              </Badge>
                            ))}
                            {product.categories.length > 1 && (
                              <Badge variant="outline" className="text-xs">
                                +{product.categories.length - 1}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="p-3">
                          <div className="flex items-center justify-center">
                            <Dialog open={isDialogOpen && editingProduct?.id === product.id} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEditStock(product)}
                                  className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-200 h-7 w-7 p-0"
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                              </DialogTrigger>
                            </Dialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Vista móvil - Tarjetas mejoradas */}
            <div className="md:hidden">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4">
                {currentProducts.map((product, index) => (
                  <Card key={product.id} className="shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-200 border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        <div className="flex gap-3">
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex items-center justify-center flex-shrink-0">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-gray-400" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1 truncate" title={product.name}>{product.name}</h3>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 line-clamp-2" 
                               style={{
                                 display: '-webkit-box',
                                 WebkitLineClamp: 2,
                                 WebkitBoxOrient: 'vertical',
                                 overflow: 'hidden'
                               }}>
                              {product.description ? product.description.replace(/<[^>]*>/g, '').trim().substring(0, 35) + (product.description.replace(/<[^>]*>/g, '').trim().length > 35 ? '...' : '') : 'Sin descripción'}
                            </p>
                            
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-green-600 dark:text-green-400">
                                ${Math.floor(product.price).toLocaleString()} CLP
                              </span>
                              <Badge variant={product.stock_quantity > 0 ? "default" : "destructive"} className="text-xs">
                                {product.manage_stock ? product.stock_quantity : '∞'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">SKU:</span>
                            <span className="ml-1 font-mono truncate block">{product.sku || 'N/A'}</span>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Estado:</span>
                            <Badge variant={product.stock_status === 'instock' ? 'default' : 'secondary'} className="ml-1 text-xs">
                              {product.stock_status === 'instock' ? 'En Stock' : 'Sin Stock'}
                            </Badge>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Dialog open={isDialogOpen && editingProduct?.id === product.id} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 h-8 text-xs hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200"
                                onClick={() => handleEditStock(product)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Editar
                              </Button>
                            </DialogTrigger>
                          </Dialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            </>
          )}
          
          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center space-y-4 p-4">
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Mostrando {startIndex + 1}-{Math.min(endIndex, filteredProducts.length)} de {filteredProducts.length} productos
              </div>
              
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      if (page === currentPage - 2 || page === currentPage + 2) {
                        return (
                          <span key={page} className="px-2 text-gray-400">...</span>
                        );
                      }
                      return null;
                    }
                    
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className={`w-8 h-8 p-0 ${
                          currentPage === page
                            ? "bg-blue-600 hover:bg-blue-700 text-white"
                            : "hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-900/20"
                        }`}
                      >
                        {page}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center space-x-1 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          
          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center space-x-2 text-blue-600 dark:text-blue-400">
                <Store className="h-5 w-5" />
                <span className="font-semibold">WooCommerce Integration</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Sincronización en tiempo real con la tienda digital
              </p>
              {totalPages > 1 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">
                  Página {currentPage} de {totalPages}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dialog para editar stock */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[400px] mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-2xl w-[calc(100vw-16px)] sm:w-auto">
          <DialogHeader className="space-y-3 pb-4 sm:pb-6">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                Actualizar Stock
              </DialogTitle>
            </div>
            <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
              Modifica el stock del producto "{editingProduct?.name}" en WooCommerce.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={updateStock}>
            <div className="grid gap-4 sm:gap-6 py-2">
              <div className="grid gap-2 sm:gap-3">
                <Label htmlFor="stock_quantity" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                  Cantidad en Stock
                </Label>
                <Input
                  id="stock_quantity"
                  type="number"
                  min="0"
                  placeholder="0"
                  value={stockData.stock_quantity}
                  onChange={(e) => setStockData({ ...stockData, stock_quantity: e.target.value })}
                  required
                  className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200 text-gray-900 placeholder:text-gray-500 h-10 sm:h-9 text-base sm:text-sm"
                />
              </div>
              
              <div className="grid gap-2 sm:gap-3">
                <Label htmlFor="stock_status" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                  <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600" />
                  Estado del Stock
                </Label>
                <select
                  id="stock_status"
                  value={stockData.stock_status}
                  onChange={(e) => setStockData({ ...stockData, stock_status: e.target.value })}
                  className="flex h-10 sm:h-9 w-full rounded-md border border-gray-200 dark:border-gray-600 bg-white dark:bg-white px-3 py-2 text-base sm:text-sm text-gray-900 placeholder:text-gray-500 focus:border-blue-500 focus:ring-blue-500/20 transition-all duration-200"
                >
                  <option value="instock">En Stock</option>
                  <option value="outofstock">Sin Stock</option>
                  <option value="onbackorder">En Espera</option>
                </select>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col-reverse sm:flex-row gap-3 pt-4 sm:pt-6 border-t border-gray-100 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="flex-1 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 bg-white dark:bg-gray-800 h-11 sm:h-10 text-base sm:text-sm"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-11 sm:h-10 text-base sm:text-sm"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Actualizar Stock
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TiendaDigital;