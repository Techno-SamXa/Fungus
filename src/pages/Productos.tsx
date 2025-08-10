import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Package, FileText, DollarSign, BarChart3, Camera, CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  dimensions: string;
  created_at: string;
  updated_at: string;
}

const Productos = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    dimensions: '',
    image: null as File | null
  });
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6); // 6 productos por página
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Obtener productos del backend
  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:8081/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setProducts(data);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los productos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
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

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const token = localStorage.getItem('auth_token');
      const url = editingProduct 
        ? `http://localhost:8081/products?id=${editingProduct.id}`
        : 'http://localhost:8081/products';
      
      const method = editingProduct ? 'PUT' : 'POST';
      
      let body;
      let headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`
      };
      
      if (formData.image) {
        // Si hay imagen, usar FormData
        const formDataToSend = new FormData();
        formDataToSend.append('name', formData.name);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('price', formData.price);
        formDataToSend.append('stock', formData.stock);
        formDataToSend.append('dimensions', formData.dimensions);
        formDataToSend.append('image', formData.image);
        body = formDataToSend;
      } else {
        // Si no hay imagen, usar JSON
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          dimensions: formData.dimensions
        });
      }
      
      const response = await fetch(url, {
        method,
        headers,
        body
      });
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingProduct ? "Producto actualizado" : "Producto creado",
        });
        
        setIsDialogOpen(false);
        setEditingProduct(null);
        setFormData({ name: '', description: '', price: '', stock: '', dimensions: '', image: null });
        fetchProducts();
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el producto",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    }
  };

  // Eliminar producto
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:8081/products?id=${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Producto eliminado",
        });
        fetchProducts();
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    }
  };

  // Abrir diálogo para editar
  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      stock: product.stock.toString(),
      dimensions: product.dimensions,
      image: null
    });
    setIsDialogOpen(true);
  };

  // Abrir diálogo para nuevo producto
  const handleNew = () => {
    setEditingProduct(null);
    setFormData({ name: '', description: '', price: '', stock: '', dimensions: '', image: null });
    setIsDialogOpen(true);
  };

  // Funciones de paginación
  const totalPages = Math.ceil(products.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentProducts = products.slice(startIndex, endIndex);

  const goToPage = (page: number) => {
    setCurrentPage(page);
    // Scroll suave hacia arriba al cambiar de página
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

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando productos...</p>
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
          className="h-auto p-1 hover:bg-transparent hover:text-purple-600 transition-colors"
        >
          <Home className="h-3 w-3 mr-1" />
          Dashboard
        </Button>
        <span>/</span>
        <span className="text-purple-600 font-medium">Inventario Interno</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg">
              <Package className="h-7 w-7 md:h-8 md:w-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-purple-700 to-purple-600 bg-clip-text text-transparent">
              Inventario Interno
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-2">
            Gestión y control de productos internos en desarrollo y producción
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleNew} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Nuevo Producto</span>
              <span className="xs:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-2xl w-[calc(100vw-16px)] sm:w-auto">
            <DialogHeader className="space-y-3 pb-4 sm:pb-6">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                  <Package className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                  {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                </DialogTitle>
              </div>
              <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                {editingProduct 
                  ? 'Modifica los datos del producto seleccionado para mantener tu inventario actualizado.'
                  : 'Completa los campos para agregar un nuevo producto a tu catálogo de hongos.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:gap-6 py-2">
                <div className="grid gap-2 sm:gap-3">
                  <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    Nombre del producto *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Ej: Hongo Reishi Premium"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-gray-900 placeholder:text-gray-500 h-10 sm:h-9 text-base sm:text-sm"
                  />
                </div>
                <div className="grid gap-2 sm:gap-3">
                  <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    Descripción
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe las características y beneficios del producto..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 resize-none text-gray-900 placeholder:text-gray-500 text-base sm:text-sm min-h-[80px]"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="grid gap-2 sm:gap-3">
                    <Label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <DollarSign className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                      Precio neto *
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      placeholder="7500"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-gray-900 placeholder:text-gray-500 h-10 sm:h-9 text-base sm:text-sm"
                    />
                  </div>
                  <div className="grid gap-2 sm:gap-3">
                    <Label htmlFor="stock" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                      Stock
                    </Label>
                    <Input
                      id="stock"
                      type="number"
                      placeholder="50"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-gray-900 placeholder:text-gray-500 h-10 sm:h-9 text-base sm:text-sm"
                    />
                  </div>
                </div>
                <div className="grid gap-2 sm:gap-3">
                  <Label htmlFor="dimensions" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                    Dimensiones / Peso
                  </Label>
                  <Input
                    id="dimensions"
                    placeholder="Ej: 500 gr, 10x15 cm"
                    value={formData.dimensions}
                    onChange={(e) => setFormData({ ...formData, dimensions: e.target.value })}
                    className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-gray-900 placeholder:text-gray-500 h-10 sm:h-9 text-base sm:text-sm"
                  />
                </div>
                <div className="grid gap-2 sm:gap-3 p-3 sm:p-4 bg-gray-50/50 dark:bg-gray-800/30 rounded-lg border border-gray-200 dark:border-gray-700">
                   <Label htmlFor="image" className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                     <Camera className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-green-600" />
                     Imagen del producto
                   </Label>
                   <div className="relative">
                      <div className="flex items-center justify-center w-full">
                        <label htmlFor="image" className="flex flex-col items-center justify-center w-full h-28 sm:h-32 border-2 border-gray-300 dark:border-gray-600 border-dashed rounded-lg cursor-pointer bg-white dark:bg-white hover:bg-gray-50 dark:hover:bg-gray-50 transition-all duration-200">
                          <div className="flex flex-col items-center justify-center pt-4 pb-5 sm:pt-5 sm:pb-6">
                            <Camera className="w-6 h-6 sm:w-8 sm:h-8 mb-2 text-gray-400" />
                            <p className="mb-1 sm:mb-2 text-xs sm:text-sm text-gray-500 text-center px-2">
                              <span className="font-semibold text-green-600">Haz clic para subir</span>
                              <span className="hidden sm:inline"> o arrastra y suelta</span>
                            </p>
                            <p className="text-xs text-gray-400">PNG, JPG, GIF hasta 5MB</p>
                          </div>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0] || null;
                              setFormData({ ...formData, image: file });
                            }}
                            className="hidden"
                          />
                        </label>
                      </div>
                    </div>
                   {formData.image && (
                     <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                       <CheckCircle className="h-4 w-4 text-green-600" />
                       <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                         {formData.image.name}
                       </p>
                     </div>
                   )}
                   
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
                   className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-11 sm:h-10 text-base sm:text-sm"
                 >
                   <Package className="h-4 w-4 mr-2" />
                   <span className="hidden sm:inline">{editingProduct ? 'Actualizar Producto' : 'Crear Producto'}</span>
                   <span className="sm:hidden">{editingProduct ? 'Actualizar' : 'Crear'}</span>
                 </Button>
               </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabla de productos */}
      <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-800">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
              <Package className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent font-bold">
              Lista de Productos
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
            {products.length} producto{products.length !== 1 ? 's' : ''} registrado{products.length !== 1 ? 's' : ''} en tu catálogo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {products.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full blur-xl opacity-60"></div>
                <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full w-20 h-20 mx-auto shadow-lg">
                  <Package className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">No hay productos</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Tu catálogo está vacío. Comienza agregando tu primer producto para empezar a gestionar tu inventario.
              </p>
              <Button onClick={handleNew} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 px-6 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Agregar Primer Producto
              </Button>
            </div>
          ) : (
            <>
            {/* Vista de escritorio - Tabla */}
            <div className="hidden md:block rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 border-b border-gray-200 dark:border-gray-600">
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Imagen</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Nombre</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 hidden lg:table-cell">Descripción</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Precio</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200">Stock</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 hidden xl:table-cell">Dimensiones</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                 {currentProducts.map((product, index) => (
                   <TableRow key={product.id} className={`hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10 transition-all duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                     <TableCell className="p-4">
                       <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm">
                         {product.image ? (
                           <img 
                             src={typeof product.image === 'string' ? product.image : URL.createObjectURL(product.image)} 
                             alt={product.name}
                             className="w-full h-full object-cover"
                           />
                         ) : (
                           <Package className="h-4 w-4 md:h-6 md:w-6 text-gray-400" />
                         )}
                       </div>
                     </TableCell>
                     <TableCell className="font-semibold text-gray-900 dark:text-gray-100">
                       <div className="min-w-0">
                         <p className="font-semibold truncate">{product.name}</p>
                         <p className="text-sm text-gray-500 dark:text-gray-400 truncate md:hidden" title={product.description}>
                           {product.description}
                         </p>
                       </div>
                     </TableCell>
                     <TableCell className="max-w-xs hidden lg:table-cell">
                       <p className="truncate text-gray-600 dark:text-gray-400" title={product.description}>
                         {product.description}
                       </p>
                     </TableCell>
                     <TableCell>
                        <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700 font-semibold text-xs md:text-sm">
                           ${Math.floor(product.price).toLocaleString()} CLP
                         </Badge>
                      </TableCell>
                     <TableCell>
                        <Badge variant={product.stock > 0 ? "default" : "destructive"} className={`${product.stock > 0 ? "bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white" : "bg-gradient-to-r from-red-500 to-red-600"} text-xs md:text-sm`}>
                          {product.stock}
                        </Badge>
                      </TableCell>
                     <TableCell className="text-gray-600 dark:text-gray-400 font-medium hidden xl:table-cell">{product.dimensions}</TableCell>
                     <TableCell>
                       <div className="flex items-center justify-center gap-1 md:gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleEdit(product)}
                           className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-200 h-8 w-8 p-0"
                         >
                           <Edit className="h-3 w-3 md:h-4 md:w-4" />
                         </Button>
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleDelete(product.id)}
                           className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-300 transition-all duration-200 h-8 w-8 p-0"
                         >
                           <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
                         </Button>
                       </div>
                     </TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
           
           {/* Vista móvil - Tarjetas */}
           <div className="md:hidden space-y-4">
             {currentProducts.map((product, index) => (
               <Card key={product.id} className="shadow-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:shadow-lg transition-all duration-200">
                 <CardContent className="p-4">
                   <div className="flex items-start gap-4">
                     {/* Imagen del producto */}
                     <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm flex-shrink-0">
                       {product.image ? (
                         <img 
                           src={typeof product.image === 'string' ? product.image : URL.createObjectURL(product.image)} 
                           alt={product.name}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <Package className="h-6 w-6 text-gray-400" />
                       )}
                     </div>
                     
                     {/* Información del producto */}
                     <div className="flex-1 min-w-0">
                       <div className="flex items-start justify-between gap-2 mb-2">
                         <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{product.name}</h3>
                         <div className="flex gap-1 flex-shrink-0">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleEdit(product)}
                             className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-200 h-8 w-8 p-0"
                           >
                             <Edit className="h-3 w-3" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleDelete(product.id)}
                             className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 dark:hover:bg-red-900/20 dark:hover:border-red-700 dark:hover:text-red-300 transition-all duration-200 h-8 w-8 p-0"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                       
                       <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                          {product.description}
                        </p>
                       
                       <div className="flex items-center justify-between gap-2">
                         <div className="flex items-center gap-2">
                           <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700 font-semibold text-xs">
                             ${Math.floor(product.price).toLocaleString()} CLP
                           </Badge>
                           <Badge variant={product.stock > 0 ? "default" : "destructive"} className={`${product.stock > 0 ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white" : "bg-gradient-to-r from-red-500 to-red-600"} text-xs`}>
                             {product.stock} und
                           </Badge>
                         </div>
                         
                         {product.dimensions && (
                           <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]" title={product.dimensions}>
                             {product.dimensions}
                           </span>
                         )}
                       </div>
                     </div>
                   </div>
                 </CardContent>
               </Card>
             ))}
           </div>
           </>
          )}
          
          {/* Controles de paginación */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-col items-center space-y-4">
              {/* Información de paginación */}
              <div className="text-sm text-gray-600 dark:text-gray-400 text-center">
                Mostrando {startIndex + 1}-{Math.min(endIndex, products.length)} de {products.length} productos
              </div>
              
              {/* Controles de navegación */}
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center space-x-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                
                {/* Números de página */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                    // Mostrar solo algunas páginas para evitar overflow en móvil
                    const showPage = 
                      page === 1 || 
                      page === totalPages || 
                      (page >= currentPage - 1 && page <= currentPage + 1);
                    
                    if (!showPage) {
                      // Mostrar puntos suspensivos
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
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : "hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-900/20"
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
                  className="flex items-center space-x-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 dark:hover:bg-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
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
              <div className="flex items-center justify-center space-x-2 text-green-600 dark:text-green-400">
                <Package className="h-5 w-5" />
                <span className="font-semibold">Fungus Mycelium</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Gestión profesional de hongos medicinales y comestibles
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
    </div>
  );
};

export default Productos;