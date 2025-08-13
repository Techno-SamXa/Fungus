import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import jsPDF from 'jspdf';
import { 
  Plus, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  Eye, 
  Search, 
  Filter, 
  Calendar,
  DollarSign,
  Package,
  User,
  FileText,
  ArrowLeft,
  Home,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/config/api';

interface Venta {
  id: number;
  numero_documento?: string;
  tipo_documento?: 'boleta' | 'factura';
  cliente_id?: number;
  comprador_id?: number;
  comprador_nombre?: string;
  comprador_email?: string;
  comprador_rut?: string;
  fecha_venta: string;
  subtotal?: number;
  descuento?: number;
  impuestos?: number;
  total: number;
  estado: 'pendiente' | 'pagada' | 'cancelada' | 'facturada' | 'entregada' | 'confirmada' | 'enviada';
  metodo_pago?: string;
  observaciones?: string;
  notas?: string;
  items?: VentaItem[];
  created_at?: string;
  updated_at?: string;
}

interface VentaItem {
  id?: number;
  producto_id: number;
  producto_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

interface Comprador {
  id: number;
  nombre: string;
  email: string;
  rut?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  description: string;
}

const Ventas = () => {
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [productos, setProductos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVenta, setEditingVenta] = useState<Venta | null>(null);
  const [selectedVenta, setSelectedVenta] = useState<Venta | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('todos');
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    tipo_documento: 'boleta' as 'boleta' | 'factura',
    cliente_id: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'pendiente' as 'pendiente' | 'pagada' | 'facturada',
    observaciones: ''
  });
  
  const [ventaItems, setVentaItems] = useState<VentaItem[]>([]);
  const [clienteSearch, setClienteSearch] = useState('');
  const [productoSearch, setProductoSearch] = useState('');
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [showProductoDropdown, setShowProductoDropdown] = useState(false);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Datos de ejemplo para ventas
  const sampleVentas: Venta[] = [
    {
      id: 1,
      numero_documento: 'VEN-0024',
      tipo_documento: 'boleta',
      cliente_id: 1,
      comprador_nombre: 'Alonso Leandro Castillo Flores',
      comprador_rut: '12345678-9',
      fecha_venta: '2025-08-05',
      subtotal: 255130,
      descuento: 0,
      impuestos: 0,
      total: 255130,
      estado: 'facturada',
      observaciones: '',
      items: [
        {
          id: 1,
          producto_id: 1,
          producto_nombre: 'Melena León Beard',
          cantidad: 8,
          precio_unitario: 13000,
          descuento: 0,
          subtotal: 104000
        },
        {
          id: 2,
          producto_id: 2,
          producto_nombre: 'Pearl Oyster',
          cantidad: 6,
          precio_unitario: 25000,
          descuento: 0,
          subtotal: 150000
        }
      ],
      created_at: '2025-08-05T10:00:00Z',
      updated_at: '2025-08-05T10:00:00Z'
    },
    {
      id: 2,
      numero_documento: 'VEN-0021',
      tipo_documento: 'factura',
      cliente_id: 2,
      comprador_nombre: 'Importadora y comercializadora del huaso SPA',
      comprador_rut: '98765432-1',
      fecha_venta: '2025-07-14',
      subtotal: 402220,
      descuento: 0,
      impuestos: 0,
      total: 402220,
      estado: 'facturada',
      observaciones: '',
      items: [
        {
          id: 3,
          producto_id: 1,
          producto_nombre: 'Melena León Beard',
          cantidad: 10,
          precio_unitario: 13000,
          descuento: 0,
          subtotal: 130000
        },
        {
          id: 4,
          producto_id: 3,
          producto_nombre: 'Cola de pavo',
          cantidad: 8,
          precio_unitario: 15000,
          descuento: 0,
          subtotal: 120000
        },
        {
          id: 5,
          producto_id: 2,
          producto_nombre: 'Pearl Oyster',
          cantidad: 6,
          precio_unitario: 25000,
          descuento: 0,
          subtotal: 150000
        }
      ],
      created_at: '2025-07-14T10:00:00Z',
      updated_at: '2025-07-14T10:00:00Z'
    },
    {
      id: 3,
      numero_documento: 'VEN-0020',
      tipo_documento: 'boleta',
      cliente_id: 3,
      comprador_nombre: 'Carlos Catalan',
      comprador_rut: '11223344-5',
      fecha_venta: '2025-07-14',
      subtotal: 12990,
      descuento: 0,
      impuestos: 0,
      total: 12990,
      estado: 'facturada',
      observaciones: '',
      items: [
        {
          id: 6,
          producto_id: 4,
          producto_nombre: 'Kit Iniciación',
          cantidad: 1,
          precio_unitario: 12990,
          descuento: 0,
          subtotal: 12990
        }
      ],
      created_at: '2025-07-14T10:00:00Z',
      updated_at: '2025-07-14T10:00:00Z'
    }
  ];

  useEffect(() => {
    fetchData();
  }, []);
  
  // Debug: Forzar recarga de datos
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🔄 Forzando recarga de datos para debug...');
      fetchData();
    }, 1000);
    return () => clearTimeout(timer);
  }, []);
  
  // Debug: Verificar estado de ventas
  useEffect(() => {
    console.log('🔍 Estado de ventas actualizado:', {
      length: ventas.length,
      ventas: ventas.map(v => ({ id: v.id, comprador: v.comprador_nombre, total: v.total }))
    });
  }, [ventas]);

  // Recalcular totales cuando cambien los items
  useEffect(() => {
    if (ventaItems.length > 0) {
      const neto = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);
      const iva = neto * 0.19;
      const total = neto + iva;
      
      // Actualizar el total en el estado si estamos editando
      if (editingVenta) {
        setEditingVenta(prev => prev ? { ...prev, total } : null);
      }
    }
  }, [ventaItems]);

  // Cargar datos iniciales
  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando fetchData para ventas...');
      
      // Debug: Verificar URL y headers
      console.log('🌐 URL de API:', 'http://localhost:8000/ventas');
      console.log('🔑 Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'dev-token-123'}`
      });
      
      const ventasResponse = await apiRequest('/ventas');
      
      console.log('📡 Respuesta de API ventas:', {
        ok: ventasResponse.ok,
        status: ventasResponse.status,
        statusText: ventasResponse.statusText,
        headers: Object.fromEntries(ventasResponse.headers.entries())
      });
      
      if (ventasResponse.ok) {
        const ventasData = await ventasResponse.json();
        console.log('📦 Datos de ventas recibidos (RAW):', ventasData);
        console.log('📊 Estructura de datos:', {
          hasData: !!ventasData.data,
          dataLength: ventasData.data ? ventasData.data.length : 'N/A',
          totalVentas: ventasData.total || 'N/A',
          success: ventasData.success,
          keys: Object.keys(ventasData)
        });
        
        const ventasParaEstado = ventasData.data || ventasData;
        console.log('🎯 Ventas que se van a establecer en el estado:', {
          length: Array.isArray(ventasParaEstado) ? ventasParaEstado.length : 'No es array',
          isArray: Array.isArray(ventasParaEstado),
          firstItem: ventasParaEstado[0] || 'No hay items',
          allItems: ventasParaEstado
        });
        
        setVentas(ventasParaEstado);
        console.log('✅ Ventas establecidas en el estado');
      } else {
        console.log('❌ Respuesta de API no exitosa, usando datos de ejemplo');
        console.log('❌ Detalles del error:', {
          status: ventasResponse.status,
          statusText: ventasResponse.statusText
        });
        setVentas(sampleVentas);
      }
      
      // Cargar compradores reales
      const compradoresResponse = await apiRequest('/compradores');
      if (compradoresResponse.ok) {
        const compradoresData = await compradoresResponse.json();
        setCompradores(compradoresData.data || compradoresData);
      }
      
      // Cargar productos reales
      const productosResponse = await apiRequest('/products');
      if (productosResponse.ok) {
        const productosData = await productosResponse.json();
        setProductos(productosData);
      }
      
      // Cargar insumos reales
      const insumosResponse = await apiRequest('/insumos');
      if (insumosResponse.ok) {
        const insumosData = await insumosResponse.json();
        console.log('Insumos cargados:', insumosData);
      }
      
    } catch (error) {
      console.error('Error en fetchData:', error);
      setVentas(sampleVentas);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar un cliente",
        variant: "destructive"
      });
      return;
    }
    
    if (ventaItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un producto",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const neto = ventaItems.reduce((sum, item) => sum + item.subtotal, 0);
      const iva = neto * 0.19; // 19% IVA
      const total = neto + iva;
      
      const ventaData = {
        comprador_id: parseInt(formData.cliente_id),
        total,
        estado: formData.estado,
        notas: formData.observaciones || '',
        detalles: ventaItems.map(item => ({
          producto_id: item.producto_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          subtotal: item.subtotal
        }))
      };
      
      console.log('Enviando datos de venta:', ventaData);
      
      if (editingVenta) {
        // Actualizar venta existente
        const response = await apiRequest(`/ventas/${editingVenta.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ventaData)
        });
        
        if (response.ok) {
          toast({
            title: "Éxito",
            description: "Venta actualizada correctamente",
          });
        } else {
          throw new Error('Error al actualizar la venta');
        }
      } else {
        // Crear nueva venta
        const response = await apiRequest('/ventas', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(ventaData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Venta creada:', result);
          toast({
            title: "Éxito",
            description: "Venta creada correctamente",
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear la venta');
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData(); // Recargar datos
      
    } catch (error) {
      console.error('Error saving venta:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar la venta",
        variant: "destructive"
      });
    }
  };

  // Resetear formulario
  const resetForm = () => {
    setEditingVenta(null);
    setFormData({
      tipo_documento: 'boleta',
      cliente_id: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      observaciones: ''
    });
    setVentaItems([]);
    setClienteSearch('');
    setProductoSearch('');
  };

  // Manejar edición de venta
  const handleEdit = (venta: Venta) => {
    setEditingVenta(venta);
    setFormData({
      tipo_documento: venta.tipo_documento || 'boleta',
      cliente_id: (venta.cliente_id || venta.comprador_id)?.toString() || '',
      fecha: venta.fecha_venta,
      estado: venta.estado as 'pendiente' | 'pagada' | 'facturada' || 'pendiente',
      observaciones: venta.observaciones || ''
    });
    setClienteSearch(venta.comprador_nombre || '');
    setVentaItems(venta.items || []);
    setIsDialogOpen(true);
  };

  // Manejar eliminación de venta
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta venta?')) return;
    
    try {
      const response = await apiRequest(`/ventas/${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Venta eliminada correctamente"
        });
        fetchData(); // Recargar datos
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar la venta');
      }
    } catch (error) {
      console.error('Error deleting venta:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al eliminar la venta",
        variant: "destructive"
      });
    }
  };

  // Agregar producto a la venta
  const agregarProducto = (producto: Product) => {
    const existingItem = ventaItems.find(item => item.producto_id === producto.id);
    
    if (existingItem) {
      setVentaItems(items => 
        items.map(item => 
          item.producto_id === producto.id 
            ? { 
                ...item, 
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio_unitario - (item.descuento || 0)
              }
            : item
        )
      );
    } else {
      const newItem: VentaItem = {
        producto_id: producto.id,
        producto_nombre: producto.name,
        cantidad: 1,
        precio_unitario: producto.price,
        descuento: 0,
        subtotal: producto.price
      };
      setVentaItems(items => [...items, newItem]);
    }
    
    setProductoSearch('');
    setShowProductoDropdown(false);
  };

  // Actualizar cantidad de producto
  const actualizarCantidad = (productoId: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarProducto(productoId);
      return;
    }
    
    setVentaItems(prev => prev.map(item => 
      item.producto_id === productoId 
        ? { 
            ...item, 
            cantidad: nuevaCantidad,
            subtotal: nuevaCantidad * item.precio_unitario - (item.descuento || 0)
          }
        : item
    ));
  };

  // Eliminar producto de la venta
  const eliminarProducto = (productoId: number) => {
    setVentaItems(items => items.filter(item => item.producto_id !== productoId));
  };

  // Seleccionar cliente
  const seleccionarCliente = (comprador: Comprador) => {
    setFormData(prev => ({ ...prev, cliente_id: comprador.id.toString() }));
    setClienteSearch(comprador.nombre);
    setShowClienteDropdown(false);
  };

  // Filtrar compradores para búsqueda
  const compradoresFiltrados = compradores.filter(comprador =>
    comprador.nombre.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    comprador.email.toLowerCase().includes(clienteSearch.toLowerCase()) ||
    (comprador.rut && comprador.rut.toLowerCase().includes(clienteSearch.toLowerCase()))
  );

  // Filtrar productos para búsqueda
  const productosFiltrados = productos.filter(producto =>
    producto.name.toLowerCase().includes(productoSearch.toLowerCase())
  );

  // Obtener badge de estado
  const getStatusBadge = (estado: string) => {
    const variants = {
      'pendiente': 'secondary',
      'pagada': 'default',
      'cancelada': 'destructive',
      'facturada': 'default'
    } as const;
    
    const colors = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'pagada': 'bg-green-100 text-green-800',
      'cancelada': 'bg-red-100 text-red-800',
      'facturada': 'bg-blue-100 text-blue-800'
    };
    
    return (
      <Badge className={colors[estado as keyof typeof colors]}>
        {estado.charAt(0).toUpperCase() + estado.slice(1)}
      </Badge>
    );
  };

  // Filtrar ventas
  const ventasFiltradas = ventas.filter(venta => {
    const matchesSearch = 
      (venta.id && venta.id.toString().includes(searchTerm.toLowerCase())) ||
      (venta.comprador_nombre && venta.comprador_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (venta.comprador_rut && venta.comprador_rut.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'todos' || venta.estado === statusFilter;
    
    const matchesDate = dateFilter === 'todos' || (() => {
      const ventaDate = new Date(venta.fecha_venta);
      const today = new Date();
      
      switch (dateFilter) {
        case 'hoy':
          return ventaDate.toDateString() === today.toDateString();
        case 'semana':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return ventaDate >= weekAgo;
        case 'mes':
          return ventaDate.getMonth() === today.getMonth() && ventaDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });
  
  // Debug: Verificar filtros
  console.log('🔍 Debug filtros:', {
    totalVentas: ventas.length,
    ventasFiltradas: ventasFiltradas.length,
    searchTerm,
    statusFilter,
    dateFilter,
    filtrosAplicados: {
      search: searchTerm !== '',
      status: statusFilter !== 'todos',
      date: dateFilter !== 'todos'
    }
  });

  // Paginación
  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentVentas = ventasFiltradas.slice(startIndex, endIndex);
  
  // Debug: Verificar paginación
  console.log('📄 Debug paginación:', {
    currentPage,
    itemsPerPage,
    totalPages,
    startIndex,
    endIndex,
    currentVentasLength: currentVentas.length
  });

  // Función para generar PDF de etiqueta
  const generarEtiquetaPDF = (venta: Venta) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: [100, 150] // Tamaño de etiqueta personalizado
    });

    // Configurar fuente
    doc.setFont('helvetica');
    
    // Encabezado con nombre del cliente en una línea
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(41, 128, 185); // Azul profesional
    doc.text('Nombre:', 12, 18);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0); // Negro para el nombre
    doc.text(venta.comprador_nombre || 'Cliente', 30, 18);
    
    // Línea decorativa
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(0.8);
    doc.line(15, 25, 85, 25);
    
    // Información de contacto con mejor diseño
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    // Marco con mejor estilo
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(8, 31, 84, 32);
    
    // Información de contacto organizada en dos columnas
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('RUT:', 12, 37);
    doc.text('DIRECCIÓN:', 12, 43);
    doc.text('EMAIL:', 12, 49);
    doc.text('TELÉFONO:', 12, 55);
    
    doc.setFont('helvetica', 'normal');
    doc.text('76.442.318-6', 35, 37);
    doc.text('Retiro Local', 35, 43);
    doc.text('comesetas@gmail.com', 35, 49);
    doc.text('+56 9 9654 2194', 35, 55);
    
    // Sección de detalle de venta con diseño mejorado
    doc.setFillColor(41, 128, 185);
    doc.rect(8, 69, 84, 8, 'F');
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('DETALLE DE VENTA', 50, 75, { align: 'center' });
    
    // Información de la venta con mejor formato
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const fechaFormateada = new Date(venta.fecha_venta).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const totalFormateado = new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(venta.total);
    
    // Fondo alternado para mejor legibilidad
    doc.setFillColor(248, 249, 250);
    doc.rect(8, 81, 84, 4, 'F');
    doc.rect(8, 89, 84, 4, 'F');
    doc.rect(8, 97, 84, 4, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.text('N° Documento:', 12, 84);
    doc.text('Tipo:', 12, 92);
    doc.text('Fecha:', 12, 100);
    doc.text('Cliente:', 12, 108);
    doc.text('Total:', 12, 116);
    
    doc.setFont('helvetica', 'normal');
    doc.text(venta.numero_documento || `VEN-${venta.id.toString().padStart(4, '0')}`, 45, 84);
    doc.text((venta.tipo_documento || 'boleta').toUpperCase(), 45, 92);
    doc.text(fechaFormateada, 45, 100);
    doc.text(venta.comprador_nombre || '', 45, 108);
    
    // Total con mayor énfasis
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(41, 128, 185);
    doc.text(totalFormateado, 45, 116);
    
    // Estado con diseño mejorado y centrado
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    
    let estadoColor;
    if (venta.estado === 'facturada') {
      estadoColor = [46, 204, 113]; // Verde
    } else if (venta.estado === 'pagada') {
      estadoColor = [52, 152, 219]; // Azul
    } else {
      estadoColor = [230, 126, 34]; // Naranja
    }
    
    doc.setFillColor(estadoColor[0], estadoColor[1], estadoColor[2]);
    doc.setTextColor(255, 255, 255);
    // Centrar el rectángulo del estado
    const estadoWidth = 40;
    const estadoX = (100 - estadoWidth) / 2;
    doc.rect(estadoX, 121, estadoWidth, 6, 'F');
    doc.text(venta.estado.toUpperCase(), 50, 125, { align: 'center' });
    
    // Información de generación con diseño profesional
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);
    const fechaGeneracion = new Date().toLocaleString('es-CL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    doc.text(`Generado el ${fechaGeneracion}`, 50, 133, { align: 'center' });
    
    // Abrir PDF en nueva pestaña del navegador
    const pdfBlob = doc.output('blob');
    const pdfUrl = URL.createObjectURL(pdfBlob);
    window.open(pdfUrl, '_blank');
  };

  // Calcular totales (usar todas las ventas, no solo las filtradas)
  const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
  const ventasPendientes = ventas.filter(v => v.estado === 'pendiente').length;
  const ventasPagadas = ventas.filter(v => v.estado === 'pagada' || v.estado === 'facturada').length;

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-8">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <ShoppingCart className="h-6 w-6 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando ventas...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-8 p-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate('/')}
              className="text-muted-foreground hover:text-foreground"
            >
              <Home className="h-4 w-4" />
            </Button>
            <span className="text-muted-foreground">/</span>
            <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          </div>
          <p className="text-muted-foreground">
            Registro de transacciones y análisis de rendimiento comercial
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Venta
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Ventas</p>
                <p className="text-2xl font-bold">${totalVentas.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Ventas Pagadas</p>
                <p className="text-2xl font-bold">{ventasPagadas}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{ventasPendientes}</p>
              </div>
              <Calendar className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Total Registros</p>
                <p className="text-2xl font-bold">{ventasFiltradas.length}</p>
              </div>
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número de documento, cliente o RUT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="pagada">Pagada</SelectItem>
                <SelectItem value="facturada">Facturada</SelectItem>
                <SelectItem value="cancelada">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de ventas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Registro de Ventas
          </CardTitle>
          <CardDescription>
            Historial completo de transacciones realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Documento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentVentas.map((venta) => (
                  <TableRow key={venta.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {venta.tipo_documento === 'factura' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-600" />
                        )}
                        {venta.numero_documento}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(venta.fecha_venta).toLocaleDateString()}</TableCell>
                    <TableCell>{venta.comprador_nombre}</TableCell>
                    <TableCell>${venta.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</TableCell>
                    <TableCell>{getStatusBadge(venta.estado)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => setSelectedVenta(venta)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(venta)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(venta.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          {/* Paginación */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, ventasFiltradas.length)} de {ventasFiltradas.length} ventas
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para nueva venta */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingVenta ? 'Editar Venta' : 'Nueva Venta'}
            </DialogTitle>
            <DialogDescription>
              {editingVenta 
                ? 'Modifica los datos de la venta seleccionada.'
                : 'Completa los campos para crear una nueva venta.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información básica */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
                <Select 
                  value={formData.tipo_documento} 
                  onValueChange={(value: 'boleta' | 'factura') => 
                    setFormData(prev => ({ ...prev, tipo_documento: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="boleta">Boleta</SelectItem>
                    <SelectItem value="factura">Factura</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="fecha">Fecha *</Label>
                <Input
                  id="fecha"
                  name="fecha"
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                  required
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="estado">Estado *</Label>
                <Select 
                  value={formData.estado} 
                  onValueChange={(value: 'pendiente' | 'pagada' | 'facturada') => 
                    setFormData(prev => ({ ...prev, estado: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="pagada">Pagada</SelectItem>
                    <SelectItem value="facturada">Facturada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selección de cliente */}
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente *</Label>
              <div className="relative">
                <Input
                  placeholder="Buscar cliente por nombre o RUT..."
                  value={clienteSearch}
                  onChange={(e) => {
                    setClienteSearch(e.target.value);
                    setShowClienteDropdown(true);
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, cliente_id: '' }));
                    }
                  }}
                  onFocus={() => setShowClienteDropdown(true)}
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                
                {showClienteDropdown && compradoresFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {compradoresFiltrados.slice(0, 10).map((comprador) => (
                      <div
                        key={comprador.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 text-foreground"
                        onClick={() => seleccionarCliente(comprador)}
                      >
                        <div className="font-medium">{comprador.nombre}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{comprador.email}</div>
                        {comprador.rut && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">RUT: {comprador.rut}</div>
                        )}
                        {comprador.ciudad && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">{comprador.ciudad}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Productos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Productos de la Venta</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowProductoDropdown(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Producto
                </Button>
              </div>
              
              {/* Búsqueda de productos */}
              {showProductoDropdown && (
                <div className="relative">
                  <Input
                    placeholder="Buscar producto por nombre..."
                    value={productoSearch}
                    onChange={(e) => setProductoSearch(e.target.value)}
                    autoFocus
                    className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  
                  {productosFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {productosFiltrados.slice(0, 10).map((producto) => (
                        <div
                          key={producto.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 text-foreground"
                          onClick={() => agregarProducto(producto)}
                        >
                          <div className="font-medium">{producto.name}</div>
                          <div className="text-sm text-gray-600">${producto.price.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</div>
                          <div className="text-xs text-gray-500">Stock: {producto.stock}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-end mt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowProductoDropdown(false);
                        setProductoSearch('');
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Lista de productos agregados */}
              {ventaItems.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Producto</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ventaItems.map((item) => (
                        <TableRow key={item.producto_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.producto_nombre}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => actualizarCantidad(item.producto_id, item.cantidad - 1)}
                                disabled={item.cantidad <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => actualizarCantidad(item.producto_id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center"
                                min="1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => actualizarCantidad(item.producto_id, item.cantidad + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.precio_unitario}
                              onChange={(e) => {
                                const nuevoPrecio = parseFloat(e.target.value) || 0;
                                setVentaItems(prev => prev.map(vItem => 
                                  vItem.producto_id === item.producto_id 
                                    ? { ...vItem, precio_unitario: nuevoPrecio, subtotal: (nuevoPrecio * vItem.cantidad) - (vItem.descuento || 0) }
                                    : vItem
                                ));
                              }}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.descuento || 0}
                              onChange={(e) => {
                                const nuevoDescuento = parseFloat(e.target.value) || 0;
                                setVentaItems(prev => prev.map(vItem => 
                                  vItem.producto_id === item.producto_id 
                                    ? { ...vItem, descuento: nuevoDescuento, subtotal: (vItem.precio_unitario * vItem.cantidad) - nuevoDescuento }
                                    : vItem
                                ));
                              }}
                              className="w-20"
                              min="0"
                              step="0.01"
                              placeholder="$0"
                            />
                          </TableCell>
                          <TableCell className="font-medium">${item.subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarProducto(item.producto_id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  <div className="p-4 border-t bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 space-y-2">
                    <div className="flex justify-between items-center text-foreground">
                      <span>Neto:</span>
                      <span>${ventaItems.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-foreground">
                      <span>IVA (19%):</span>
                      <span>${(ventaItems.reduce((sum, item) => sum + item.subtotal, 0) * 0.19).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg border-t border-gray-200 dark:border-gray-600 pt-2 text-foreground">
                      <span>Total:</span>
                      <span>${(ventaItems.reduce((sum, item) => sum + item.subtotal, 0) * 1.19).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones */}
            <div className="space-y-2">
              <Label htmlFor="observaciones">Observaciones</Label>
              <Textarea
                id="observaciones"
                name="observaciones"
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones adicionales para la venta..."
                rows={3}
                className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 resize-none text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingVenta ? 'Actualizar' : 'Crear'} Venta
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para ver detalle de venta */}
      <Dialog open={!!selectedVenta} onOpenChange={() => setSelectedVenta(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle de Venta</DialogTitle>
            <DialogDescription>
              Información completa de la venta seleccionada
            </DialogDescription>
          </DialogHeader>
          
          {selectedVenta && (
            <div className="space-y-6">
              {/* Información General y Cliente */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Información General</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Fecha:</Label>
                      <p className="font-medium">{new Date(selectedVenta.fecha_venta).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Tipo de documento:</Label>
                      <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium capitalize ml-2">
                        {selectedVenta.tipo_documento}
                      </span>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Estado:</Label>
                      <div className="mt-1">{getStatusBadge(selectedVenta.estado)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Correlativo:</Label>
                      <p className="font-medium">{selectedVenta.numero_documento}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Vendedor:</Label>
                      <p className="font-medium">Italo Tavonatti Vargas</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Cliente</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Nombre:</Label>
                      <p className="font-medium text-blue-600">{selectedVenta.comprador_nombre}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">RUT:</Label>
                      <p className="font-medium">76442318-6</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email:</Label>
                      <p className="font-medium">comesetas@gmail.com</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Teléfono:</Label>
                      <p className="font-medium">9 9654 2194</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Dirección:</Label>
                      <p className="font-medium">Retiro Local</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detalle de Productos */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Detalle de Productos</h3>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader className="bg-green-600">
                      <TableRow>
                        <TableHead className="text-white font-semibold">Producto</TableHead>
                        <TableHead className="text-white font-semibold text-center">Cantidad</TableHead>
                        <TableHead className="text-white font-semibold text-center">Precio Unit.</TableHead>
                        <TableHead className="text-white font-semibold text-center">Descuento</TableHead>
                        <TableHead className="text-white font-semibold text-center">Subtotal</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Melena León Beard</div>
                            <div className="text-sm text-gray-500">Grano colonizado (2,5 kilos)</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">8</TableCell>
                        <TableCell className="text-center">$13.000</TableCell>
                        <TableCell className="text-center">$0</TableCell>
                        <TableCell className="text-center font-medium">$104.000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div className="font-medium">Cola de pavo</div>
                        </TableCell>
                        <TableCell className="text-center">8</TableCell>
                        <TableCell className="text-center">$13.000</TableCell>
                        <TableCell className="text-center">$0</TableCell>
                        <TableCell className="text-center font-medium">$104.000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Pearl Oyster</div>
                            <div className="text-sm text-gray-500">Grano colonizado (2,5 kilos)</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">8</TableCell>
                        <TableCell className="text-center">$13.000</TableCell>
                        <TableCell className="text-center">$0</TableCell>
                        <TableCell className="text-center font-medium">$104.000</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>
                          <div>
                            <div className="font-medium">Melena León Beard</div>
                            <div className="text-sm text-gray-500">Grano colonizado (2,5 kilos)</div>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">2</TableCell>
                        <TableCell className="text-center">$13.000</TableCell>
                        <TableCell className="text-center">$0</TableCell>
                        <TableCell className="text-center font-medium">$26.000</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                  
                  {/* Totales */}
                  <div className="bg-background dark:bg-gray-800 border border-gray-200 dark:border-gray-600 p-4 space-y-2">
                    <div className="flex justify-between items-center text-foreground">
                      <span className="font-medium">Neto</span>
                      <span className="font-medium">$338.000</span>
                    </div>
                    <div className="flex justify-between items-center text-foreground">
                      <span className="font-medium">IVA (19%)</span>
                      <span className="font-medium">$64.220</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg border-t border-gray-200 dark:border-gray-600 pt-2 text-foreground">
                      <span>Total</span>
                      <span>$402.220</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Botones de acción */}
              <div className="flex justify-center gap-3 pt-4">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={() => generarEtiquetaPDF(selectedVenta)}
                >
                  <FileText className="h-4 w-4" />
                  Imprimir Etiqueta
                </Button>
                <Button className="flex items-center gap-2" onClick={() => {
                  setSelectedVenta(null);
                  handleEdit(selectedVenta);
                }}>
                  <Edit className="h-4 w-4" />
                  Editar
                </Button>
                <Button variant="outline" onClick={() => setSelectedVenta(null)}>
                  Cerrar
                </Button>
              </div>
              
              {selectedVenta.observaciones && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Observaciones</Label>
                  <p className="mt-1 text-sm">{selectedVenta.observaciones}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Ventas;