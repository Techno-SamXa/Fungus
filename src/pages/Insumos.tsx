import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Factory, FileText, DollarSign, RefreshCw, Camera, CheckCircle, ChevronLeft, ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiRequest, getImageUrl } from '@/config/api';

interface Insumo {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  dimensions: string;
  image?: string;
  created_at: string;
  updated_at: string;
}

const Insumos = () => {
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInsumo, setEditingInsumo] = useState<Insumo | null>(null);
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
  const [itemsPerPage] = useState(6); // 6 insumos por página
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Obtener insumos del backend
  const fetchInsumos = async () => {
    try {
      const response = await apiRequest('/insumos');
      
      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los insumos",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching insumos:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Función para actualizar la lista
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const response = await apiRequest('/insumos');
      
      if (response.ok) {
        const data = await response.json();
        setInsumos(data);
        toast({
          title: "Actualizado",
          description: "Lista de insumos actualizada correctamente",
        });
      } else {
        toast({
          title: "Error",
          description: "No se pudo actualizar la lista",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error refreshing insumos:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsumos();
    
    // Configurar polling para actualización en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      fetchInsumos();
    }, 30000); // 30 segundos
    
    // Limpiar el interval cuando el componente se desmonte
    return () => clearInterval(interval);
  }, []);

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const endpoint = editingInsumo 
        ? `/insumos?id=${editingInsumo.id}`
        : '/insumos';
      
      const method = editingInsumo ? 'PUT' : 'POST';
      
      let body;
      let options: any = {
        method
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
        options.body = formDataToSend;
        options.isFormData = true;
      } else {
        // Si no hay imagen nueva, usar JSON
        options.body = JSON.stringify({
          name: formData.name,
          description: formData.description,
          price: parseFloat(formData.price),
          stock: parseInt(formData.stock),
          dimensions: formData.dimensions,
          image: editingInsumo?.image || null // Mantener imagen existente o null
        });
      }
      
      const response = await apiRequest(endpoint, options);
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingInsumo ? "Insumo actualizado" : "Insumo creado",
        });
        
        setIsDialogOpen(false);
        setEditingInsumo(null);
        setFormData({ name: '', description: '', price: '', stock: '', dimensions: '', image: null });
        fetchInsumos();
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el insumo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving insumo:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este insumo?')) {
      return;
    }

    try {
      const response = await apiRequest(`/insumos?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Insumo eliminado",
        });
        fetchInsumos();
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el insumo",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting insumo:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    }
  };

  // Manejar edición
  const handleEdit = (insumo: Insumo) => {
    setEditingInsumo(insumo);
    setFormData({
      name: insumo.name,
      description: insumo.description,
      price: insumo.price.toString(),
      stock: insumo.stock.toString(),
      dimensions: insumo.dimensions,
      image: null // Nueva imagen a subir (si se selecciona)
    });
    setIsDialogOpen(true);
  };

  // Manejar nuevo insumo
  const handleNew = () => {
    setEditingInsumo(null);
    setFormData({ name: '', description: '', price: '', stock: '', dimensions: '', image: null });
    setIsDialogOpen(true);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Manejar cambio de imagen
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setFormData(prev => ({ ...prev, image: file }));
  };

  // Cálculos de paginación
  const totalPages = Math.ceil(insumos.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentInsumos = insumos.slice(startIndex, endIndex);

  // Funciones de navegación de páginas
  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Factory className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando insumos...</p>
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
          className="h-auto p-1 hover:bg-transparent hover:text-green-600 transition-colors"
        >
          <Home className="h-3 w-3 mr-1" />
          Dashboard
        </Button>
        <span>/</span>
        <span className="text-green-600 font-medium">Insumos</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Factory className="h-7 w-7 md:h-8 md:w-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
              Insumos
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-2">
            Gestión y control de productos internos en desarrollo y producción
          </p>
        </div>
        <Button 
          onClick={handleRefresh}
          disabled={refreshing}
          variant="outline"
          className="flex items-center gap-2 w-full sm:w-auto border-green-200 hover:bg-green-50 hover:border-green-300 hover:text-green-700"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Actualizar</span>
        </Button>
      </div>

      <Card className="border-0 shadow-lg bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Factory className="h-5 w-5 text-green-600" />
                Inventario de Insumos
              </CardTitle>
              <CardDescription className="mt-1">
                Control y gestión de materiales para producción
              </CardDescription>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleNew} className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  <span className="hidden xs:inline">Nuevo Insumo</span>
                  <span className="xs:hidden">Nuevo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 border-0 shadow-2xl w-[calc(100vw-16px)] sm:w-auto">
                <DialogHeader className="space-y-3 pb-4 sm:pb-6">
                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gradient-to-br from-green-500 to-green-600 shadow-lg">
                      <Factory className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <DialogTitle className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white">
                      {editingInsumo ? 'Editar Insumo' : 'Nuevo Insumo'}
                    </DialogTitle>
                  </div>
                  <DialogDescription className="text-sm sm:text-base text-gray-600 dark:text-gray-300 leading-relaxed">
                    {editingInsumo 
                      ? 'Modifica los datos del insumo seleccionado para mantener tu inventario actualizado.'
                      : 'Completa los campos para agregar un nuevo insumo a tu catálogo de materiales.'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium text-gray-700 dark:text-gray-300">Nombre *</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Ej: Alcohol 99%"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="price" className="text-sm font-medium text-gray-700 dark:text-gray-300">Precio *</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="1"
                        value={formData.price}
                        onChange={handleInputChange}
                        placeholder="0"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="stock" className="text-sm font-medium text-gray-700 dark:text-gray-300">Stock *</Label>
                      <Input
                        id="stock"
                        name="stock"
                        type="number"
                        value={formData.stock}
                        onChange={handleInputChange}
                        placeholder="0"
                        required
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dimensions" className="text-sm font-medium text-gray-700 dark:text-gray-300">Especificaciones</Label>
                      <Input
                        id="dimensions"
                        name="dimensions"
                        value={formData.dimensions}
                        onChange={handleInputChange}
                        placeholder="Ej: 500ml, 1kg, etc."
                        className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium text-gray-700 dark:text-gray-300">Descripción *</Label>
                    <Textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="Describe el insumo, su uso y características..."
                      required
                      rows={3}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500 resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="image" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <Camera className="h-4 w-4" />
                      Imagen del insumo
                    </Label>
                    <Input
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:border-green-500 focus:ring-green-500 file:bg-green-50 file:text-green-700 file:border-0 file:rounded-md file:px-3 file:py-1 file:mr-3 hover:file:bg-green-100"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">Formatos soportados: JPG, PNG, GIF (máx. 5MB)</p>
                  </div>
                  
                  <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-4 sm:pt-6">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="flex-1 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 h-11 sm:h-10 text-base sm:text-sm"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="submit" 
                      className="flex-1 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-[1.02] h-11 sm:h-10 text-base sm:text-sm"
                    >
                      <Factory className="h-4 w-4 mr-2" />
                      <span className="hidden sm:inline">{editingInsumo ? 'Actualizar Insumo' : 'Crear Insumo'}</span>
                      <span className="sm:hidden">{editingInsumo ? 'Actualizar' : 'Crear'}</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
           </div>
         </CardHeader>
        </Card>
        <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800">
        <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-b border-green-100 dark:border-green-800">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg shadow-md">
              <Factory className="h-5 w-5 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent font-bold">
              Lista de Insumos
            </span>
          </CardTitle>
          <CardDescription className="text-gray-600 dark:text-gray-300 font-medium">
            {insumos.length} insumo{insumos.length !== 1 ? 's' : ''} registrado{insumos.length !== 1 ? 's' : ''} en tu catálogo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {insumos.length === 0 ? (
            <div className="text-center py-12">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gradient-to-r from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full blur-xl opacity-60"></div>
                <div className="relative p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full w-20 h-20 mx-auto shadow-lg">
                  <Factory className="h-12 w-12 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 bg-gradient-to-r from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400 bg-clip-text text-transparent">No hay insumos</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                Tu catálogo está vacío. Comienza agregando tu primer insumo para empezar a gestionar tu inventario.
              </p>
              <Button onClick={handleNew} className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105 px-6 py-3">
                <Plus className="h-5 w-5 mr-2" />
                Agregar Primer Insumo
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
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 hidden xl:table-cell">Especificaciones</TableHead>
                    <TableHead className="font-semibold text-gray-700 dark:text-gray-200 text-center">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
              <TableBody>
                 {currentInsumos.map((insumo, index) => (
                   <TableRow key={insumo.id} className={`hover:bg-gradient-to-r hover:from-green-50/50 hover:to-emerald-50/50 dark:hover:from-green-900/10 dark:hover:to-emerald-900/10 transition-all duration-200 ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'}`}>
                     <TableCell className="p-4">
                       <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm">
                         {insumo.image ? (
                           <img 
                             src={getImageUrl(insumo.image)} 
                             alt={insumo.name}
                             className="w-full h-full object-cover"
                             onError={(e) => {
                               const target = e.target as HTMLImageElement;
                               target.style.display = 'none';
                               target.nextElementSibling?.classList.remove('hidden');
                             }}
                           />
                         ) : null}
                         <Factory className={`h-6 w-6 md:h-8 md:w-8 text-gray-400 dark:text-gray-500 ${insumo.image ? 'hidden' : ''}`} />
                       </div>
                     </TableCell>
                     <TableCell className="p-4">
                       <div className="font-medium text-gray-900 dark:text-white text-sm md:text-base">{insumo.name}</div>
                     </TableCell>
                     <TableCell className="p-4 hidden lg:table-cell">
                       <div className="text-gray-600 dark:text-gray-300 text-sm max-w-xs truncate" title={insumo.description}>
                         {insumo.description}
                       </div>
                     </TableCell>
                     <TableCell className="p-4">
                       <div className="font-semibold text-green-600 dark:text-green-400 text-sm md:text-base">
                         ${Math.floor(insumo.price || 0).toLocaleString('de-DE')} CLP
                       </div>
                     </TableCell>
                     <TableCell className="p-4">
                       <Badge 
                         variant={insumo.stock > 10 ? "default" : insumo.stock > 0 ? "secondary" : "destructive"}
                         className="text-xs font-medium px-2 py-1"
                       >
                         {insumo.stock} und
                       </Badge>
                     </TableCell>
                     <TableCell className="p-4 hidden xl:table-cell">
                       <span className="text-gray-600 dark:text-gray-300 text-sm">
                         {insumo.dimensions || 'N/A'}
                       </span>
                     </TableCell>
                     <TableCell className="p-4">
                       <div className="flex items-center justify-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleEdit(insumo)}
                           className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 dark:hover:bg-blue-900/20 dark:hover:border-blue-700 dark:hover:text-blue-300 transition-all duration-200 h-8 w-8 p-0"
                         >
                           <Edit className="h-3 w-3 md:h-4 md:w-4" />
                         </Button>
                        <Button
                           variant="outline"
                           size="sm"
                           onClick={() => handleDelete(insumo.id)}
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
              {currentInsumos.map((insumo, index) => (
                <Card key={insumo.id} className={`transition-all duration-200 hover:shadow-md border ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/50'} border-gray-200 dark:border-gray-700`}>
                 <CardContent className="p-4">
                   <div className="flex items-start gap-4">
                     <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-600 flex items-center justify-center shadow-sm flex-shrink-0">
                       {insumo.image ? (
                         <img 
                           src={getImageUrl(insumo.image)} 
                           alt={insumo.name}
                           className="w-full h-full object-cover"
                           onError={(e) => {
                             const target = e.target as HTMLImageElement;
                             target.style.display = 'none';
                             target.nextElementSibling?.classList.remove('hidden');
                           }}
                         />
                       ) : null}
                       <Factory className={`h-8 w-8 text-gray-400 dark:text-gray-500 ${insumo.image ? 'hidden' : ''}`} />
                     </div>
                     
                     <div className="flex-1 min-w-0">
                       <div className="flex items-start justify-between gap-2 mb-2">
                         <h3 className="font-semibold text-gray-900 dark:text-white text-base truncate">
                           {insumo.name}
                         </h3>
                         <div className="flex gap-1 flex-shrink-0">
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleEdit(insumo)}
                             className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-all duration-200 h-8 w-8 p-0"
                           >
                             <Edit className="h-3 w-3" />
                           </Button>
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => handleDelete(insumo.id)}
                             className="hover:bg-red-50 hover:border-red-200 hover:text-red-700 transition-all duration-200 h-8 w-8 p-0"
                           >
                             <Trash2 className="h-3 w-3" />
                           </Button>
                         </div>
                       </div>
                       
                       <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                         {insumo.description}
                       </p>
                       
                       <div className="flex items-center justify-between gap-4">
                         <div className="flex items-center gap-3">
                           <span className="font-semibold text-green-600 dark:text-green-400 text-base">
                             ${Math.floor(insumo.price || 0).toLocaleString('de-DE')} CLP
                           </span>
                           <Badge 
                             variant={insumo.stock > 10 ? "default" : insumo.stock > 0 ? "secondary" : "destructive"}
                             className="text-xs font-medium px-2 py-1"
                           >
                             {insumo.stock} und
                           </Badge>
                         </div>
                         
                         {insumo.dimensions && (
                           <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[100px]" title={insumo.dimensions}>
                             {insumo.dimensions}
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
                Mostrando {startIndex + 1}-{Math.min(endIndex, insumos.length)} de {insumos.length} insumos
              </div>
              
              {/* Controles de navegación */}
              <div className="flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Anterior</span>
                </Button>
                
                {/* Números de página */}
                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={currentPage === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => goToPage(pageNumber)}
                        className={`w-8 h-8 p-0 ${
                          currentPage === pageNumber 
                            ? 'bg-green-600 hover:bg-green-700 text-white' 
                            : 'hover:bg-green-50 hover:border-green-200 hover:text-green-700'
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 hover:bg-green-50 hover:border-green-200 hover:text-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="hidden sm:inline">Siguiente</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Insumos;