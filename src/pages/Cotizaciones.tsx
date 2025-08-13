import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Eye, FileText, DollarSign, Calendar, Users, Package, Factory, ChevronLeft, ChevronRight, Home, Download, Clock, Mail, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiRequest, getImageUrl } from '@/config/api';

// Función utilitaria para formatear valores en CLP
const formatCLP = (value: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value).replace('$', '$');
};

interface Cotizacion {
  id: number;
  numero_cotizacion: string;
  comprador_id: number;
  comprador_nombre: string;
  comprador_email: string;
  fecha_cotizacion: string;
  fecha_vencimiento?: string;
  subtotal: number;
  descuento: number;
  impuestos: number;
  total: number;
  estado: 'borrador' | 'enviada' | 'aceptada' | 'rechazada' | 'vencida';
  observaciones?: string;
  notas?: string;
  imagen?: string;
  created_at: string;
  updated_at: string;
  items?: CotizacionItem[];
}

interface CotizacionItem {
  id?: number;
  tipo_item: 'producto' | 'insumo';
  item_id: number;
  item_nombre: string;
  item_descripcion?: string;
  item_imagen?: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

interface Comprador {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
}

interface Producto {
  id: number;
  name: string;
  nombre?: string;
  description: string;
  descripcion?: string;
  price: number;
  precio?: number;
  stock: number;
  image?: string;
  imagen?: string;
}

interface Insumo {
  id: number;
  name: string;
  nombre?: string;
  description: string;
  descripcion?: string;
  price: number;
  precio?: number;
  stock: number;
  image?: string;
  imagen?: string;
  dimensions?: string;
}

const Cotizaciones = () => {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingCotizacion, setEditingCotizacion] = useState<Cotizacion | null>(null);
  const [viewingCotizacion, setViewingCotizacion] = useState<Cotizacion | null>(null);
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    numero_cotizacion: '',
    comprador_id: '',
    fecha_cotizacion: '',
    fecha_vencimiento: '',
    estado: 'borrador' as const,
    observaciones: '',
    notas: '',
    imagen: null as File | null
  });
  
  // Estados para items de la cotización
  const [cotizacionItems, setCotizacionItems] = useState<CotizacionItem[]>([]);
  const [selectedTipoItem, setSelectedTipoItem] = useState<'producto' | 'insumo'>('producto');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [itemCantidad, setItemCantidad] = useState(1);
  const [itemDescuento, setItemDescuento] = useState(0);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  
  // Estados para búsqueda dinámica
  const [searchComprador, setSearchComprador] = useState('');
  const [searchItem, setSearchItem] = useState('');
  const [showCompradorDropdown, setShowCompradorDropdown] = useState(false);
  const [showItemDropdown, setShowItemDropdown] = useState(false);
  
  // Estados para nuevo comprador
  const [isNewCompradorDialogOpen, setIsNewCompradorDialogOpen] = useState(false);
  const [newCompradorData, setNewCompradorData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    direccion: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Funciones para cargar datos
  const fetchCotizaciones = async () => {
    try {
      const response = await apiRequest('/cotizaciones');
      const data = await response.json();
      setCotizaciones(data.data || []);
    } catch (error) {
      console.error('Error al cargar cotizaciones:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las cotizaciones",
        variant: "destructive"
      });
    }
  };
  
  const fetchCompradores = async () => {
    try {
      console.log('Cargando compradores...');
      const response = await apiRequest('/compradores');
      const data = await response.json();
      console.log('Respuesta compradores:', data);
      setCompradores(data.data || data || []);
      if ((data.data || data || []).length === 0) {
        toast({
          title: "Información",
          description: "No se encontraron compradores disponibles",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error al cargar compradores:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los compradores",
        variant: "destructive"
      });
    }
  };
  
  const fetchProductos = async () => {
    try {
      console.log('Cargando productos...');
      const response = await apiRequest('/products');
      const data = await response.json();
      console.log('Respuesta productos:', data);
      setProductos(data.data || data || []);
      if ((data.data || data || []).length === 0) {
        toast({
          title: "Información",
          description: "No se encontraron productos disponibles",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error al cargar productos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los productos",
        variant: "destructive"
      });
    }
  };
  
  const fetchInsumos = async () => {
    try {
      console.log('Cargando insumos...');
      const response = await apiRequest('/insumos');
      const data = await response.json();
      console.log('Respuesta insumos:', data);
      setInsumos(data.data || data || []);
      if ((data.data || data || []).length === 0) {
        toast({
          title: "Información",
          description: "No se encontraron insumos disponibles",
          variant: "default"
        });
      }
    } catch (error) {
      console.error('Error al cargar insumos:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los insumos",
        variant: "destructive"
      });
    }
  };
  
  const fetchCotizacionDetalle = async (id: number) => {
    try {
      const response = await apiRequest(`/cotizaciones?id=${id}`);
      const data = await response.json();
      setViewingCotizacion(data);
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error('Error al cargar detalle de cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el detalle de la cotización",
        variant: "destructive"
      });
    }
  };
  
  // Funciones para manejar items
  const agregarItem = () => {
    if (!selectedItemId) {
      toast({
        title: "Error",
        description: "Selecciona un item",
        variant: "destructive"
      });
      return;
    }
    
    const items = selectedTipoItem === 'producto' ? productos : insumos;
    const item = items.find(i => i.id === parseInt(selectedItemId));
    
    if (!item) {
      toast({
        title: "Error",
        description: "Item no encontrado",
        variant: "destructive"
      });
      return;
    }
    
    // Verificar si el item ya existe
    const existingItem = cotizacionItems.find(
      i => i.tipo_item === selectedTipoItem && i.item_id === item.id
    );
    
    if (existingItem) {
      toast({
        title: "Error",
        description: "Este item ya está agregado",
        variant: "destructive"
      });
      return;
    }
    
    // Manejar ambos formatos de datos (name/nombre, price/precio, etc.)
    const itemNombre = item.name || item.nombre || 'Sin nombre';
    const itemDescripcion = item.description || item.descripcion || '';
    const itemImagen = item.image || item.imagen || '';
    const precioUnitario = item.price || item.precio || 0;
    const descuento = itemDescuento;
    const subtotal = (precioUnitario * itemCantidad) - descuento;
    
    const nuevoItem: CotizacionItem = {
      tipo_item: selectedTipoItem,
      item_id: item.id,
      item_nombre: itemNombre,
      item_descripcion: itemDescripcion,
      item_imagen: itemImagen,
      cantidad: itemCantidad,
      precio_unitario: precioUnitario,
      descuento: descuento,
      subtotal: subtotal
    };
    
    setCotizacionItems([...cotizacionItems, nuevoItem]);
    
    // Limpiar formulario
    setSelectedItemId('');
    setItemCantidad(1);
    setItemDescuento(0);
    
    toast({
      title: "Éxito",
      description: "Item agregado a la cotización"
    });
  };
  
  const eliminarItem = (index: number) => {
    const nuevosItems = cotizacionItems.filter((_, i) => i !== index);
    setCotizacionItems(nuevosItems);
  };
  
  const actualizarCantidadItem = (index: number, nuevaCantidad: number) => {
    const nuevosItems = [...cotizacionItems];
    nuevosItems[index].cantidad = nuevaCantidad;
    nuevosItems[index].subtotal = (nuevosItems[index].precio_unitario * nuevaCantidad) - nuevosItems[index].descuento;
    setCotizacionItems(nuevosItems);
  };
  
  const actualizarDescuentoItem = (index: number, nuevoDescuento: number) => {
    const nuevosItems = [...cotizacionItems];
    nuevosItems[index].descuento = nuevoDescuento;
    nuevosItems[index].subtotal = (nuevosItems[index].precio_unitario * nuevosItems[index].cantidad) - nuevoDescuento;
    setCotizacionItems(nuevosItems);
  };
  
  // Calcular totales
  const calcularTotales = () => {
    const subtotal = cotizacionItems.reduce((sum, item) => sum + item.subtotal, 0);
    const descuentoTotal = cotizacionItems.reduce((sum, item) => sum + item.descuento, 0);
    const impuestos = subtotal * 0.19; // IVA 19%
    const total = subtotal + impuestos;
    
    return { subtotal, descuento: descuentoTotal, impuestos, total };
  };
  
  // Generar número de cotización automático
  const generarNumeroCotizacion = () => {
    const fecha = new Date();
    const año = fecha.getFullYear();
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const dia = String(fecha.getDate()).padStart(2, '0');
    const hora = String(fecha.getHours()).padStart(2, '0');
    const minuto = String(fecha.getMinutes()).padStart(2, '0');
    
    return `COT-${año}${mes}${dia}-${hora}${minuto}`;
  };
  
  // Filtrar compradores por búsqueda
  const filteredCompradores = compradores.filter(comprador => {
    if (!searchComprador.trim()) return true; // Mostrar todos si no hay búsqueda
    return comprador.nombre.toLowerCase().includes(searchComprador.toLowerCase()) ||
           comprador.email.toLowerCase().includes(searchComprador.toLowerCase());
  });
  
  // Filtrar items por búsqueda
  const filteredItems = selectedTipoItem === 'producto' 
    ? productos.filter(producto => {
        if (!searchItem.trim()) return true; // Mostrar todos si no hay búsqueda
        return (producto.name || producto.nombre || '').toLowerCase().includes(searchItem.toLowerCase());
      })
    : insumos.filter(insumo => {
        if (!searchItem.trim()) return true; // Mostrar todos si no hay búsqueda
        return (insumo.name || insumo.nombre || '').toLowerCase().includes(searchItem.toLowerCase());
      });
  
  // Crear nuevo comprador
  const handleCreateComprador = async () => {
    if (!newCompradorData.nombre || !newCompradorData.email) {
      toast({
        title: "Error",
        description: "Nombre y email son requeridos",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const response = await apiRequest('/compradores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompradorData)
      });
      
      if (response.ok) {
        const data = await response.json();
        const nuevoComprador = data.data;
        
        // Actualizar lista de compradores
        setCompradores(prev => [...prev, nuevoComprador]);
        
        // Seleccionar el nuevo comprador
        setFormData(prev => ({ ...prev, comprador_id: nuevoComprador.id.toString() }));
        setSearchComprador(nuevoComprador.nombre);
        
        // Limpiar formulario y cerrar modal
        setNewCompradorData({ nombre: '', email: '', telefono: '', direccion: '' });
        setIsNewCompradorDialogOpen(false);
        setShowCompradorDropdown(false);
        
        toast({
          title: "Éxito",
          description: "Comprador creado exitosamente"
        });
      } else {
        throw new Error('Error al crear comprador');
      }
    } catch (error) {
      console.error('Error al crear comprador:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el comprador",
        variant: "destructive"
      });
    }
  };
  
  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.comprador_id || !formData.fecha_cotizacion) {
      toast({
        title: "Error",
        description: "Completa todos los campos requeridos",
        variant: "destructive"
      });
      return;
    }
    
    if (cotizacionItems.length === 0) {
      toast({
        title: "Error",
        description: "Agrega al menos un item a la cotización",
        variant: "destructive"
      });
      return;
    }
    
    const totales = calcularTotales();
    
    const cotizacionData = {
      ...formData,
      numero_cotizacion: formData.numero_cotizacion || generarNumeroCotizacion(),
      comprador_id: parseInt(formData.comprador_id),
      ...totales,
      items: cotizacionItems
    };
    
    try {
      const url = editingCotizacion ? `/cotizaciones?id=${editingCotizacion.id}` : '/cotizaciones';
      const method = editingCotizacion ? 'PUT' : 'POST';
      
      const response = await apiRequest(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cotizacionData)
      });
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: editingCotizacion ? "Cotización actualizada" : "Cotización creada"
        });
        
        setIsDialogOpen(false);
        resetForm();
        fetchCotizaciones();
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error al guardar cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar la cotización",
        variant: "destructive"
      });
    }
  };
  
  const resetForm = () => {
    setFormData({
      numero_cotizacion: '',
      comprador_id: '',
      fecha_cotizacion: '',
      fecha_vencimiento: '',
      estado: 'borrador',
      observaciones: '',
      notas: '',
      imagen: null
    });
    setCotizacionItems([]);
    setEditingCotizacion(null);
  };
  
  const handleEdit = async (cotizacion: Cotizacion) => {
    try {
      // Cargar los detalles completos de la cotización desde el backend
      const response = await apiRequest(`/cotizaciones?id=${cotizacion.id}`);
      if (response.ok) {
        const cotizacionCompleta = await response.json();
        
        setEditingCotizacion(cotizacionCompleta);
        setFormData({
          numero_cotizacion: cotizacionCompleta.numero_cotizacion,
          comprador_id: cotizacionCompleta.comprador_id.toString(),
          fecha_cotizacion: cotizacionCompleta.fecha_cotizacion,
          fecha_vencimiento: cotizacionCompleta.fecha_vencimiento || '',
          estado: cotizacionCompleta.estado,
          observaciones: cotizacionCompleta.observaciones || '',
          notas: cotizacionCompleta.notas || '',
          imagen: null
        });
        
        // Establecer los items con los datos correctos
        setCotizacionItems(cotizacionCompleta.items || []);
        
        setIsDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la cotización",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading cotizacion details:', error);
      toast({
        title: "Error",
        description: "Error al cargar los detalles de la cotización",
        variant: "destructive"
      });
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta cotización?')) {
      return;
    }
    
    try {
      const response = await apiRequest(`/cotizaciones?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Cotización eliminada"
        });
        fetchCotizaciones();
      } else {
        throw new Error('Error en la respuesta del servidor');
      }
    } catch (error) {
      console.error('Error al eliminar cotización:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la cotización",
        variant: "destructive"
      });
    }
  };
  
  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'secondary';
      case 'enviada': return 'default';
      case 'aceptada': return 'default';
      case 'rechazada': return 'destructive';
      case 'vencida': return 'destructive';
      default: return 'secondary';
    }
  };
  
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200 dark:border-gray-500';
      case 'enviada': return 'bg-gradient-to-r from-purple-100 to-violet-200 text-purple-800 border-purple-300 dark:from-purple-900/50 dark:to-violet-800/50 dark:text-purple-200 dark:border-purple-600';
      case 'aceptada': return 'bg-gradient-to-r from-green-100 to-emerald-200 text-green-800 border-green-300 dark:from-green-900/50 dark:to-emerald-800/50 dark:text-green-200 dark:border-green-600';
      case 'rechazada': return 'bg-gradient-to-r from-red-100 to-red-200 text-red-800 border-red-300 dark:from-red-900/50 dark:to-red-800/50 dark:text-red-200 dark:border-red-600';
      case 'vencida': return 'bg-gradient-to-r from-orange-100 to-red-200 text-orange-800 border-orange-300 dark:from-orange-900/50 dark:to-red-800/50 dark:text-orange-200 dark:border-orange-600';
      default: return 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 border-gray-300 dark:from-gray-700 dark:to-gray-600 dark:text-gray-200 dark:border-gray-500';
    }
  };
  
  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'borrador': return <Clock className="h-3 w-3 mr-1" />;
      case 'enviada': return <Mail className="h-3 w-3 mr-1" />;
      case 'aceptada': return <CheckCircle className="h-3 w-3 mr-1" />;
      case 'rechazada': return <XCircle className="h-3 w-3 mr-1" />;
      case 'vencida': return <AlertTriangle className="h-3 w-3 mr-1" />;
      default: return <Clock className="h-3 w-3 mr-1" />;
    }
  };
  
  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'borrador': return 'Borrador';
      case 'enviada': return 'Enviada';
      case 'aceptada': return 'Aceptada';
      case 'rechazada': return 'Rechazada';
      case 'vencida': return 'Vencida';
      default: return estado.charAt(0).toUpperCase() + estado.slice(1);
    }
  };
  
  // Paginación
  const totalPages = Math.ceil(cotizaciones.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCotizaciones = cotizaciones.slice(startIndex, endIndex);
  
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
  
  // Cargar datos al montar el componente
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchCotizaciones(),
        fetchCompradores(),
        fetchProductos(),
        fetchInsumos()
      ]);
      setLoading(false);
    };
    
    loadData();
  }, []);

  // Efecto para cerrar dropdowns al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.dropdown-container')) {
        setShowCompradorDropdown(false);
        setShowItemDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <FileText className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando cotizaciones...</p>
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
        <span className="text-blue-600 font-medium">Cotizaciones</span>
      </div>
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Cotizaciones</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestiona las cotizaciones de productos e insumos</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nueva Cotización
            </Button>
          </DialogTrigger>
          
          <DialogContent className="w-[98vw] max-w-7xl h-[95vh] flex flex-col overflow-hidden">
            <DialogHeader>
              <DialogTitle>
                {editingCotizacion ? 'Editar Cotización' : 'Nueva Cotización'}
              </DialogTitle>
              <DialogDescription>
                {editingCotizacion ? 'Modifica los datos de la cotización' : 'Crea una nueva cotización con productos e insumos'}
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-1 overflow-y-auto px-1">
              <form id="cotizacion-form" onSubmit={handleSubmit} className="space-y-6 pb-4">
              {/* Información básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="numero_cotizacion">Número de Cotización</Label>
                  <Input
                    id="numero_cotizacion"
                    value={formData.numero_cotizacion}
                    onChange={(e) => setFormData({...formData, numero_cotizacion: e.target.value})}
                    placeholder="Dejar vacío para generar automáticamente"
                  />
                </div>
                
                <div>
                  <Label htmlFor="comprador_id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Comprador *
                  </Label>
                  <div className="relative dropdown-container">
                    <Input
                      value={searchComprador}
                      onChange={(e) => {
                        setSearchComprador(e.target.value);
                        setShowCompradorDropdown(true);
                      }}
                      onFocus={() => setShowCompradorDropdown(true)}
                      placeholder="Buscar comprador por nombre o email..."
                      className="w-full mt-1"
                    />
                    {showCompradorDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredCompradores.length > 0 ? (
                          filteredCompradores.map((comprador) => (
                            <div
                              key={comprador.id}
                              className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, comprador_id: comprador.id.toString() }));
                                setSearchComprador(comprador.nombre);
                                setShowCompradorDropdown(false);
                              }}
                            >
                              <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                  {comprador.nombre.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                    {comprador.nombre}
                                  </div>
                                  <div className="text-xs text-gray-500 dark:text-gray-400">
                                    {comprador.email}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))
                        ) : searchComprador.length > 0 ? (
                          <div className="p-4 text-center">
                            <p className="text-sm text-gray-500 mb-2">No se encontró el comprador "{searchComprador}"</p>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setNewCompradorData(prev => ({ ...prev, nombre: searchComprador }));
                                setIsNewCompradorDialogOpen(true);
                                setShowCompradorDropdown(false);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Crear nuevo comprador
                            </Button>
                          </div>
                        ) : (
                          <div className="p-4 text-center text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm">Escribe para buscar compradores</p>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => {
                                setIsNewCompradorDialogOpen(true);
                                setShowCompradorDropdown(false);
                              }}
                              className="bg-green-600 hover:bg-green-700 text-white mt-2"
                            >
                              <Plus className="h-4 w-4 mr-1" />
                              Crear nuevo comprador
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="fecha_cotizacion">Fecha de Cotización *</Label>
                  <Input
                    id="fecha_cotizacion"
                    type="date"
                    value={formData.fecha_cotizacion}
                    onChange={(e) => setFormData({...formData, fecha_cotizacion: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="fecha_vencimiento">Fecha de Vencimiento</Label>
                  <Input
                    id="fecha_vencimiento"
                    type="date"
                    value={formData.fecha_vencimiento}
                    onChange={(e) => setFormData({...formData, fecha_vencimiento: e.target.value})}
                  />
                </div>
                
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select value={formData.estado} onValueChange={(value: any) => setFormData({...formData, estado: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="borrador">Borrador</SelectItem>
                      <SelectItem value="enviada">Enviada</SelectItem>
                      <SelectItem value="aceptada">Aceptada</SelectItem>
                      <SelectItem value="rechazada">Rechazada</SelectItem>
                      <SelectItem value="vencida">Vencida</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Agregar items */}
              <div className="border rounded-lg p-4 space-y-6">
                <div className="flex items-center space-x-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <Package className="h-5 w-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Agregar Items a la Cotización</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tipo de Item *
                    </Label>
                    <Select value={selectedTipoItem} onValueChange={(value: 'producto' | 'insumo') => setSelectedTipoItem(value)}>
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors">
                        <SelectValue placeholder="🏷️ Selecciona el tipo de item" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="producto" className="cursor-pointer hover:bg-green-50 dark:hover:bg-green-900/20">
                          <div className="flex items-center space-x-2">
                            <Package className="h-4 w-4 text-green-600" />
                            <span>Producto</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="insumo" className="cursor-pointer hover:bg-orange-50 dark:hover:bg-orange-900/20">
                          <div className="flex items-center space-x-2">
                            <Factory className="h-4 w-4 text-orange-600" />
                            <span>Insumo</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Seleccionar Item *
                    </Label>
                    <div className="relative dropdown-container">
                      <Input
                        value={searchItem}
                        onChange={(e) => {
                          setSearchItem(e.target.value);
                          setShowItemDropdown(true);
                        }}
                        onFocus={() => setShowItemDropdown(true)}
                        placeholder={selectedTipoItem ? `Buscar ${selectedTipoItem} por nombre...` : "Primero selecciona el tipo"}
                        disabled={!selectedTipoItem}
                        className={`w-full ${
                          !selectedTipoItem 
                            ? 'opacity-50 cursor-not-allowed' 
                            : ''
                        }`}
                      />
                      {showItemDropdown && selectedTipoItem && (
                        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                          {filteredItems.length > 0 ? (
                            filteredItems.map((item) => {
                              const nombre = item.name || item.nombre || 'Sin nombre';
                              return (
                                <div
                                  key={item.id}
                                  className="p-3 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                                  onClick={() => {
                                    setSelectedItemId(item.id.toString());
                                    setSearchItem(nombre);
                                    setShowItemDropdown(false);
                                  }}
                                >
                                  <div className="flex items-center space-x-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium ${
                                      selectedTipoItem === 'producto' 
                                        ? 'bg-gradient-to-br from-green-500 to-green-600' 
                                        : 'bg-gradient-to-br from-orange-500 to-orange-600'
                                    }`}>
                                      {selectedTipoItem === 'producto' ? <Package className="h-4 w-4" /> : <Factory className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-900 dark:text-gray-100 text-sm">
                                        {nombre}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })
                          ) : searchItem.length > 0 ? (
                            <div className="p-4 text-center text-gray-500">
                              <p className="text-sm">No se encontró "{searchItem}" en {selectedTipoItem}s</p>
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              <Package className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                              <p className="text-sm">Escribe para buscar {selectedTipoItem}s</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Cantidad *
                    </Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemCantidad}
                      onChange={(e) => setItemCantidad(parseInt(e.target.value) || 1)}
                      placeholder="Ingresa la cantidad"
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Descuento ($) - Opcional
                    </Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={itemDescuento}
                      onChange={(e) => setItemDescuento(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                    />
                  </div>
                </div>
                
                <Button 
                  type="button" 
                  onClick={agregarItem} 
                  className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
                  disabled={!selectedTipoItem || !selectedItemId || !itemCantidad}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Agregar Item a la Cotización
                </Button>
                
                {(!selectedTipoItem || !selectedItemId || !itemCantidad) && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 text-center">
                    ⚠️ Completa todos los campos obligatorios para agregar el item
                  </p>
                )}
              </div>
              
              {/* Lista de items */}
              {cotizacionItems.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-lg font-semibold mb-4">Items de la Cotización</h3>
                  
                  <div className="overflow-x-auto">
                    <Table className="min-w-full">
                      <TableHeader>
                        <TableRow>
                          <TableHead className="min-w-[200px]">Item</TableHead>
                          <TableHead className="min-w-[100px]">Tipo</TableHead>
                          <TableHead className="min-w-[80px]">Cantidad</TableHead>
                          <TableHead className="min-w-[120px]">Precio Unit.</TableHead>
                          <TableHead className="min-w-[100px]">Descuento</TableHead>
                          <TableHead className="min-w-[120px]">Subtotal</TableHead>
                          <TableHead className="min-w-[80px]">Acción</TableHead>
                        </TableRow>
                      </TableHeader>
                    <TableBody>
                      {cotizacionItems.map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.item_nombre}</div>
                              {item.item_descripcion && (
                                <div className="text-sm text-gray-500">{item.item_descripcion}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant={item.tipo_item === 'producto' ? 'default' : 'secondary'}>
                              {item.tipo_item === 'producto' ? (
                                <><Package className="h-3 w-3 mr-1" />Producto</>
                              ) : (
                                <><Factory className="h-3 w-3 mr-1" />Insumo</>
                              )}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="1"
                              value={item.cantidad}
                              onChange={(e) => actualizarCantidadItem(index, parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          </TableCell>
                          <TableCell>{formatCLP(item.precio_unitario)}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.descuento}
                              onChange={(e) => actualizarDescuentoItem(index, parseFloat(e.target.value) || 0)}
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>{formatCLP(item.subtotal)}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => eliminarItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {/* Totales */}
                  <div className="mt-4 border-t pt-4">
                    <div className="flex justify-end">
                      <div className="w-full max-w-sm space-y-2">
                        {(() => {
                          const totales = calcularTotales();
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Subtotal:</span>
                                <span>{formatCLP(totales.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Descuento:</span>
                                <span>-{formatCLP(totales.descuento)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>IVA (19%):</span>
                                <span>{formatCLP(totales.impuestos)}</span>
                              </div>
                              <div className="flex justify-between font-bold text-lg border-t pt-2">
                                <span>Total:</span>
                                <span>{formatCLP(totales.total)}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Observaciones y notas */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="observaciones" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Observaciones
                  </Label>
                  <Textarea
                    id="observaciones"
                    value={formData.observaciones}
                    onChange={(e) => setFormData({...formData, observaciones: e.target.value})}
                    placeholder="Observaciones para el cliente"
                    rows={3}
                    className="resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notas" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notas Internas
                  </Label>
                  <Textarea
                    id="notas"
                    value={formData.notas}
                    onChange={(e) => setFormData({...formData, notas: e.target.value})}
                    placeholder="Notas internas"
                    rows={3}
                    className="resize-none bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 focus:border-blue-500 dark:focus:border-blue-400 transition-colors"
                  />
                </div>
              </div>
              </form>
            </div>
              
            <DialogFooter className="flex flex-col sm:flex-row gap-2 sm:gap-0 border-t pt-4 mt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="w-full sm:w-auto order-2 sm:order-1"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                form="cotizacion-form"
                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 order-1 sm:order-2"
              >
                {editingCotizacion ? 'Actualizar' : 'Crear'} Cotización
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Diálogo para crear nuevo comprador */}
        <Dialog open={isNewCompradorDialogOpen} onOpenChange={setIsNewCompradorDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Comprador</DialogTitle>
              <DialogDescription>
                Agrega un nuevo comprador al sistema
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-comprador-nombre">Nombre *</Label>
                <Input
                  id="new-comprador-nombre"
                  value={newCompradorData.nombre}
                  onChange={(e) => setNewCompradorData({...newCompradorData, nombre: e.target.value})}
                  placeholder="Nombre del comprador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-comprador-email">Email *</Label>
                <Input
                  id="new-comprador-email"
                  type="email"
                  value={newCompradorData.email}
                  onChange={(e) => setNewCompradorData({...newCompradorData, email: e.target.value})}
                  placeholder="email@ejemplo.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-comprador-telefono">Teléfono</Label>
                <Input
                  id="new-comprador-telefono"
                  value={newCompradorData.telefono}
                  onChange={(e) => setNewCompradorData({...newCompradorData, telefono: e.target.value})}
                  placeholder="+56 9 1234 5678"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-comprador-empresa">Empresa</Label>
                <Input
                  id="new-comprador-empresa"
                  value={newCompradorData.empresa}
                  onChange={(e) => setNewCompradorData({...newCompradorData, empresa: e.target.value})}
                  placeholder="Nombre de la empresa"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsNewCompradorDialogOpen(false);
                  setNewCompradorData({ nombre: '', email: '', telefono: '', empresa: '' });
                }}
              >
                Cancelar
              </Button>
              <Button 
                type="button" 
                onClick={handleCreateComprador}
                disabled={!newCompradorData.nombre || !newCompradorData.email}
              >
                Crear Comprador
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cotizaciones</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cotizaciones.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cotizaciones.filter(c => c.estado === 'enviada').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aceptadas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {cotizaciones.filter(c => c.estado === 'aceptada').length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCLP(cotizaciones.reduce((sum, c) => sum + c.total, 0))}
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Tabla de cotizaciones */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Cotizaciones</CardTitle>
          <CardDescription>
            Gestiona todas las cotizaciones del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Vencimiento</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentCotizaciones.map((cotizacion) => (
                <TableRow key={cotizacion.id}>
                  <TableCell className="font-medium">
                    {cotizacion.numero_cotizacion}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{cotizacion.comprador_nombre}</div>
                      <div className="text-sm text-gray-500">{cotizacion.comprador_email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{cotizacion.fecha_cotizacion}</TableCell>
                  <TableCell>{cotizacion.fecha_vencimiento || 'Sin fecha'}</TableCell>
                  <TableCell className="font-medium">
                    {formatCLP(cotizacion.total)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={getEstadoBadgeVariant(cotizacion.estado)} className={`${getEstadoColor(cotizacion.estado)} font-medium shadow-sm border transition-all duration-200 hover:shadow-md`}>
                      <div className="flex items-center">
                        {getEstadoIcon(cotizacion.estado)}
                        {getEstadoText(cotizacion.estado)}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchCotizacionDetalle(cotizacion.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(cotizacion)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(cotizacion.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Mostrando {startIndex + 1} a {Math.min(endIndex, cotizaciones.length)} de {cotizaciones.length} cotizaciones
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1">
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
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog para ver detalle */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalle de Cotización: {viewingCotizacion?.numero_cotizacion}
            </DialogTitle>
            <DialogDescription>
              Información completa de la cotización
            </DialogDescription>
          </DialogHeader>
          
          {viewingCotizacion && (
            <div className="space-y-6">
              {/* Información del comprador */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información del Comprador</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Nombre:</strong> {viewingCotizacion.comprador_nombre}</div>
                    <div><strong>Email:</strong> {viewingCotizacion.comprador_email}</div>
                    {viewingCotizacion.comprador_telefono && (
                      <div><strong>Teléfono:</strong> {viewingCotizacion.comprador_telefono}</div>
                    )}
                    {viewingCotizacion.comprador_direccion && (
                      <div><strong>Dirección:</strong> {viewingCotizacion.comprador_direccion}</div>
                    )}
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Información de la Cotización</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div><strong>Número:</strong> {viewingCotizacion.numero_cotizacion}</div>
                    <div><strong>Fecha:</strong> {viewingCotizacion.fecha_cotizacion}</div>
                    <div><strong>Vencimiento:</strong> {viewingCotizacion.fecha_vencimiento || 'Sin fecha'}</div>
                    <div>
                      <strong>Estado:</strong> 
                      <Badge variant={getEstadoBadgeVariant(viewingCotizacion.estado)} className={`ml-2 ${getEstadoColor(viewingCotizacion.estado)} font-medium shadow-sm border transition-all duration-200 hover:shadow-md`}>
                        <div className="flex items-center">
                          {getEstadoIcon(viewingCotizacion.estado)}
                          {getEstadoText(viewingCotizacion.estado)}
                        </div>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Items de la cotización */}
              {viewingCotizacion.items && viewingCotizacion.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Items de la Cotización</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Tipo</TableHead>
                          <TableHead>Cantidad</TableHead>
                          <TableHead>Precio Unit.</TableHead>
                          <TableHead>Descuento</TableHead>
                          <TableHead>Subtotal</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {viewingCotizacion.items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                {item.item_imagen && (
                                  <img 
                                    src={getImageUrl(item.item_imagen)} 
                                    alt={item.item_nombre}
                                    className="w-10 h-10 object-cover rounded"
                                  />
                                )}
                                <div>
                                  <div className="font-medium">{item.item_nombre}</div>
                                  {item.item_descripcion && (
                                    <div className="text-sm text-gray-500">{item.item_descripcion}</div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={item.tipo_item === 'producto' ? 'default' : 'secondary'}>
                                {item.tipo_item === 'producto' ? (
                                  <><Package className="h-3 w-3 mr-1" />Producto</>
                                ) : (
                                  <><Factory className="h-3 w-3 mr-1" />Insumo</>
                                )}
                              </Badge>
                            </TableCell>
                            <TableCell>{item.cantidad}</TableCell>
                            <TableCell>{formatCLP(item.precio_unitario)}</TableCell>
                            <TableCell>{formatCLP(item.descuento)}</TableCell>
                            <TableCell>{formatCLP(item.subtotal)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}
              
              {/* Totales */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Resumen de Totales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCLP(viewingCotizacion.subtotal)}</div>
                      <div className="text-sm text-gray-500">Subtotal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">-{formatCLP(viewingCotizacion.descuento)}</div>
                      <div className="text-sm text-gray-500">Descuento</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold">{formatCLP(viewingCotizacion.impuestos)}</div>
                      <div className="text-sm text-gray-500">IVA (19%)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">{formatCLP(viewingCotizacion.total)}</div>
                      <div className="text-sm text-gray-500">Total</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Observaciones y notas */}
              {(viewingCotizacion.observaciones || viewingCotizacion.notas) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {viewingCotizacion.observaciones && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Observaciones</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300">{viewingCotizacion.observaciones}</p>
                      </CardContent>
                    </Card>
                  )}
                  
                  {viewingCotizacion.notas && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Notas Internas</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 dark:text-gray-300">{viewingCotizacion.notas}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Cerrar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Generar PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Cotizaciones;