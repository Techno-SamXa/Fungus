import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, ShoppingCart, Eye, FileText, Home, DollarSign, Package, TrendingUp, X, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/config/api';

interface Compra {
  id: number;
  numero_documento?: string;
  tipo_documento?: 'boleta' | 'factura';
  proveedor_id?: number;
  proveedor_nombre?: string;
  proveedor_email?: string;
  proveedor_rut?: string;
  fecha_compra: string;
  subtotal?: number;
  descuento?: number;
  impuestos?: number;
  total: number;
  estado: 'pendiente' | 'recibido' | 'cancelado' | 'facturado';
  metodo_pago?: string;
  observaciones?: string;
  notas?: string;
  items?: CompraItem[];
  created_at?: string;
  updated_at?: string;
}

interface CompraItem {
  id?: number;
  insumo_id: number;
  insumo_nombre?: string;
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
}

interface Proveedor {
  id: number;
  nombre: string;
  email: string;
  rut?: string;
  telefono?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
}

interface Insumo {
  id: number;
  nombre: string;
  precio: number;
  stock: number;
  descripcion: string;
  unidad_medida?: string;
}

const Compras = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [insumos, setInsumos] = useState<Insumo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCompra, setEditingCompra] = useState<Compra | null>(null);
  const [selectedCompra, setSelectedCompra] = useState<Compra | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [dateFilter, setDateFilter] = useState<string>('todos');
  
  // Estados para el formulario
  const [formData, setFormData] = useState({
    tipo_documento: 'factura' as 'boleta' | 'factura',
    proveedor_id: '',
    fecha: new Date().toISOString().split('T')[0],
    estado: 'pendiente' as 'pendiente' | 'recibido' | 'facturado',
    observaciones: ''
  });
  
  const [compraItems, setCompraItems] = useState<CompraItem[]>([]);
  const [proveedorSearch, setProveedorSearch] = useState('');
  const [insumoSearch, setInsumoSearch] = useState('');
  const [showProveedorDropdown, setShowProveedorDropdown] = useState(false);
  const [showInsumoDropdown, setShowInsumoDropdown] = useState(false);
  
  // Estados para paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const { toast } = useToast();
  const navigate = useNavigate();

  // Datos de ejemplo para compras
  const sampleCompras: Compra[] = [
    {
      id: 1,
      numero_documento: 'COM-2024-001',
      tipo_documento: 'factura',
      proveedor_id: 1,
      proveedor_nombre: 'Sustratos del Sur',
      proveedor_rut: '76543210-1',
      fecha_compra: '2024-01-15',
      subtotal: 105042,
      descuento: 0,
      impuestos: 19958,
      total: 125000,
      estado: 'recibido',
      observaciones: 'Entrega programada para el 20 de enero',
      items: [
        {
          id: 1,
          insumo_id: 1,
          insumo_nombre: 'Sustrato Orgánico',
          cantidad: 50,
          precio_unitario: 2100,
          descuento: 0,
          subtotal: 105000
        }
      ],
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      numero_documento: 'COM-2024-002',
      tipo_documento: 'factura',
      proveedor_id: 2,
      proveedor_nombre: 'Equipos Micológicos Ltda.',
      proveedor_rut: '87654321-2',
      fecha_compra: '2024-01-20',
      subtotal: 71429,
      descuento: 0,
      impuestos: 13571,
      total: 85000,
      estado: 'recibido',
      observaciones: 'Equipos de esterilización nuevos',
      items: [
        {
          id: 2,
          insumo_id: 2,
          insumo_nombre: 'Autoclave Industrial',
          cantidad: 2,
          precio_unitario: 35714,
          descuento: 0,
          subtotal: 71428
        }
      ],
      created_at: '2024-01-20T14:30:00Z',
      updated_at: '2024-01-20T14:30:00Z'
    },
    {
      id: 3,
      numero_documento: 'COM-2024-003',
      tipo_documento: 'factura',
      proveedor_id: 3,
      proveedor_nombre: 'Semillas y Esporas Chile',
      proveedor_rut: '98765432-3',
      fecha_compra: '2024-01-25',
      subtotal: 37815,
      descuento: 0,
      impuestos: 7185,
      total: 45000,
      estado: 'pendiente',
      observaciones: 'Envases biodegradables para empaque',
      items: [
        {
          id: 3,
          insumo_id: 3,
          insumo_nombre: 'Envases Biodegradables',
          cantidad: 200,
          precio_unitario: 189,
          descuento: 0,
          subtotal: 37800
        }
      ],
      created_at: '2024-01-25T09:15:00Z',
      updated_at: '2024-01-25T09:15:00Z'
    }
  ];

  // Datos de ejemplo para proveedores
  const sampleProveedores: Proveedor[] = [
    {
      id: 1,
      nombre: 'Sustratos del Sur',
      email: 'contacto@sustratossur.cl',
      rut: '76543210-1',
      telefono: '+56912345678',
      direccion: 'Av. Industrial 1234',
      ciudad: 'Temuco',
      pais: 'Chile'
    },
    {
      id: 2,
      nombre: 'Equipos Micológicos Ltda.',
      email: 'ventas@equiposmico.cl',
      rut: '87654321-2',
      telefono: '+56987654321',
      direccion: 'Calle Los Industriales 567',
      ciudad: 'Santiago',
      pais: 'Chile'
    },
    {
      id: 3,
      nombre: 'Semillas y Esporas Chile',
      email: 'info@semillasesporas.cl',
      rut: '98765432-3',
      telefono: '+56911223344',
      direccion: 'Paseo Científico 890',
      ciudad: 'Valparaíso',
      pais: 'Chile'
    }
  ];

  // Datos de ejemplo para insumos
  const sampleInsumos: Insumo[] = [
    {
      id: 1,
      nombre: 'Sustrato Orgánico',
      precio: 2100,
      stock: 500,
      descripcion: 'Sustrato orgánico premium para cultivo de hongos',
      unidad_medida: 'kg'
    },
    {
      id: 2,
      nombre: 'Autoclave Industrial',
      precio: 35714,
      stock: 5,
      descripcion: 'Equipo de esterilización industrial',
      unidad_medida: 'unidad'
    },
    {
      id: 3,
      nombre: 'Envases Biodegradables',
      precio: 189,
      stock: 1000,
      descripcion: 'Envases biodegradables para empaque',
      unidad_medida: 'unidad'
    },
    {
      id: 4,
      nombre: 'Herramientas de Laboratorio',
      precio: 5042,
      stock: 20,
      descripcion: 'Kit de herramientas para laboratorio micológico',
      unidad_medida: 'kit'
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Iniciando fetchData para compras...');
      
      // Debug: Verificar URL y headers
      console.log('🌐 URL de API:', 'http://localhost:8000/compras');
      console.log('🔑 Headers:', {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token') || 'dev-token-123'}`
      });
      
      // Cargar compras reales
      const comprasResponse = await apiRequest('/compras?limit=100');
      
      console.log('📡 Respuesta de API compras:', {
        ok: comprasResponse.ok,
        status: comprasResponse.status,
        statusText: comprasResponse.statusText,
        headers: Object.fromEntries(comprasResponse.headers.entries())
      });
      
      if (comprasResponse.ok) {
        const comprasData = await comprasResponse.json();
        console.log('📦 Datos de compras recibidos (RAW):', comprasData);
        console.log('📊 Estructura de datos:', {
          hasData: !!comprasData.data,
          dataLength: comprasData.data ? comprasData.data.length : 'N/A',
          totalCompras: comprasData.total || 'N/A',
          success: comprasData.success,
          keys: Object.keys(comprasData)
        });
        
        const comprasParaEstado = comprasData.data || comprasData;
        console.log('🎯 Compras que se van a establecer en el estado:', {
          length: Array.isArray(comprasParaEstado) ? comprasParaEstado.length : 'No es array',
          isArray: Array.isArray(comprasParaEstado),
          firstItem: comprasParaEstado[0] || 'No hay items',
          allItems: comprasParaEstado
        });
        
        setCompras(comprasParaEstado);
        console.log('✅ Compras establecidas en el estado');
      } else {
        console.log('❌ Respuesta de API no exitosa, usando datos de ejemplo');
        console.log('❌ Detalles del error:', {
          status: comprasResponse.status,
          statusText: comprasResponse.statusText
        });
        setCompras(sampleCompras);
      }
      
      // Cargar proveedores reales
      const proveedoresResponse = await apiRequest('/proveedores');
      if (proveedoresResponse.ok) {
        const proveedoresData = await proveedoresResponse.json();
        setProveedores(proveedoresData.data || proveedoresData);
      } else {
        setProveedores(sampleProveedores);
      }
      
      // Cargar insumos reales
      const insumosResponse = await apiRequest('/insumos');
      if (insumosResponse.ok) {
        const insumosData = await insumosResponse.json();
        setInsumos(insumosData.data || insumosData);
      } else {
        setInsumos(sampleInsumos);
      }
      
    } catch (error) {
      console.error('Error en fetchData:', error);
      setCompras(sampleCompras);
      setProveedores(sampleProveedores);
      setInsumos(sampleInsumos);
      toast({
        title: "Error",
        description: "Error al cargar los datos",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Recalcular totales cuando cambien los items
  useEffect(() => {
    if (compraItems.length > 0) {
      const neto = compraItems.reduce((sum, item) => sum + item.subtotal, 0);
      const iva = neto * 0.19;
      const total = neto + iva;
      
      // Actualizar el total en el estado si estamos editando
      if (editingCompra) {
        setEditingCompra(prev => prev ? { ...prev, total } : null);
      }
    }
  }, [compraItems]);

  const resetForm = () => {
    setEditingCompra(null);
    setFormData({
      tipo_documento: 'factura',
      proveedor_id: '',
      fecha: new Date().toISOString().split('T')[0],
      estado: 'pendiente',
      observaciones: ''
    });
    setCompraItems([]);
    setProveedorSearch('');
    setInsumoSearch('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.proveedor_id) {
      toast({
        title: "Error",
        description: "Debe seleccionar un proveedor",
        variant: "destructive"
      });
      return;
    }
    
    if (compraItems.length === 0) {
      toast({
        title: "Error",
        description: "Debe agregar al menos un insumo a la compra",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const neto = compraItems.reduce((sum, item) => sum + item.subtotal, 0);
      const iva = neto * 0.19;
      const total = neto + iva;
      
      const compraData = {
        proveedor_id: parseInt(formData.proveedor_id),
        fecha_compra: formData.fecha,
        subtotal: neto,
        impuestos: iva,
        total: total,
        estado: formData.estado,
        observaciones: formData.observaciones || '',
        items: compraItems.map(item => ({
          insumo_id: item.insumo_id,
          cantidad: item.cantidad,
          precio_unitario: item.precio_unitario,
          descuento: item.descuento,
          subtotal: item.subtotal
        }))
      };
      
      console.log('Enviando datos de compra:', compraData);
      
      if (editingCompra) {
        // Actualizar compra existente
        const response = await apiRequest('/compras', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...compraData, id: editingCompra.id })
        });
        
        if (response.ok) {
          const result = await response.json();
          setCompras(prev => prev.map(c => c.id === editingCompra.id ? result : c));
          toast({
            title: "Éxito",
            description: "Compra actualizada correctamente"
          });
        } else {
          throw new Error('Error al actualizar la compra');
        }
      } else {
        // Crear nueva compra
        const response = await apiRequest('/compras', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(compraData)
        });
        
        if (response.ok) {
          const result = await response.json();
          console.log('Compra creada:', result);
          setCompras(prev => [result, ...prev]);
          toast({
            title: "Éxito",
            description: "Compra creada correctamente"
          });
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Error al crear la compra');
        }
      }
      
      setIsDialogOpen(false);
      resetForm();
      fetchData(); // Recargar datos
      
    } catch (error) {
      console.error('Error saving compra:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al guardar la compra",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar esta compra?')) {
      return;
    }
    
    try {
      await apiRequest('/compras', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      
      setCompras(prev => prev.filter(c => c.id !== id));
      toast({
        title: "Éxito",
        description: "Compra eliminada correctamente"
      });
    } catch (error) {
      console.error('Error deleting compra:', error);
      toast({
        title: "Error",
        description: "Error al eliminar la compra",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (compra: Compra) => {
    try {
      // Cargar los detalles completos de la compra desde el backend
      const response = await apiRequest(`/compras?id=${compra.id}`);
      if (response.ok) {
        const compraCompleta = await response.json();
        
        setEditingCompra(compraCompleta);
        setFormData({
          tipo_documento: compraCompleta.tipo_documento || 'factura',
          proveedor_id: compraCompleta.proveedor_id?.toString() || '',
          fecha: compraCompleta.fecha_compra,
          estado: compraCompleta.estado,
          observaciones: compraCompleta.observaciones || ''
        });
        
        // Establecer los items con los datos correctos
        setCompraItems(compraCompleta.items || []);
        
        // Buscar el proveedor para mostrar su nombre
        const proveedor = proveedores.find(p => p.id === compraCompleta.proveedor_id);
        if (proveedor) {
          setProveedorSearch(proveedor.nombre);
        }
        
        setIsDialogOpen(true);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los detalles de la compra",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading compra details:', error);
      toast({
        title: "Error",
        description: "Error al cargar los detalles de la compra",
        variant: "destructive"
      });
    }
  };

  const handleViewDetails = (compra: Compra) => {
    setSelectedCompra(compra);
  };

  const handleBackToList = () => {
    setSelectedCompra(null);
  };

  // Seleccionar proveedor
  const seleccionarProveedor = (proveedor: Proveedor) => {
    setFormData(prev => ({ ...prev, proveedor_id: proveedor.id.toString() }));
    setProveedorSearch(proveedor.nombre);
    setShowProveedorDropdown(false);
  };

  // Agregar insumo a la compra
  const agregarInsumo = (insumo: Insumo) => {
    const existingItem = compraItems.find(item => item.insumo_id === insumo.id);
    
    if (existingItem) {
      setCompraItems(items => 
        items.map(item => 
          item.insumo_id === insumo.id 
            ? { 
                ...item, 
                cantidad: item.cantidad + 1,
                subtotal: (item.cantidad + 1) * item.precio_unitario - item.descuento
              }
            : item
        )
      );
    } else {
      const newItem: CompraItem = {
        insumo_id: insumo.id,
        insumo_nombre: insumo.nombre,
        cantidad: 1,
        precio_unitario: insumo.precio,
        descuento: 0,
        subtotal: insumo.precio - 0
      };
      setCompraItems(items => [...items, newItem]);
    }
    
    setInsumoSearch('');
    setShowInsumoDropdown(false);
  };

  // Actualizar cantidad de insumo
  const actualizarCantidad = (insumo_id: number, nuevaCantidad: number) => {
    if (nuevaCantidad <= 0) {
      eliminarInsumo(insumo_id);
      return;
    }
    
    setCompraItems(items => 
      items.map(item => 
        item.insumo_id === insumo_id 
          ? { 
              ...item, 
              cantidad: nuevaCantidad,
              subtotal: nuevaCantidad * item.precio_unitario - (item.descuento || 0)
            }
          : item
      )
    );
  };

  // Actualizar precio unitario de insumo
  const actualizarPrecio = (insumo_id: number, nuevoPrecio: number) => {
    setCompraItems(items => 
      items.map(item => 
        item.insumo_id === insumo_id 
          ? { 
              ...item, 
              precio_unitario: nuevoPrecio,
              subtotal: item.cantidad * nuevoPrecio - (item.descuento || 0)
            }
          : item
      )
    );
  };

  // Actualizar descuento de insumo
  const actualizarDescuento = (insumo_id: number, nuevoDescuento: number) => {
    setCompraItems(items => 
      items.map(item => 
        item.insumo_id === insumo_id 
          ? { 
              ...item, 
              descuento: nuevoDescuento,
              subtotal: item.cantidad * item.precio_unitario - nuevoDescuento
            }
          : item
      )
    );
  };

  // Eliminar insumo de la compra
  const eliminarInsumo = (insumoId: number) => {
    setCompraItems(items => items.filter(item => item.insumo_id !== insumoId));
  };

  // Filtrar proveedores para búsqueda
  const proveedoresFiltrados = proveedores.filter(proveedor =>
    (proveedor.nombre && proveedor.nombre.toLowerCase().includes(proveedorSearch.toLowerCase())) ||
    (proveedor.email && proveedor.email.toLowerCase().includes(proveedorSearch.toLowerCase())) ||
    (proveedor.rut && proveedor.rut.toLowerCase().includes(proveedorSearch.toLowerCase()))
  );

  // Filtrar insumos para búsqueda
  const insumosFiltrados = insumos.filter(insumo =>
    insumo.nombre && insumo.nombre.toLowerCase().includes(insumoSearch.toLowerCase())
  );

  // Filtrar compras
  const comprasFiltradas = compras.filter(compra => {
    const matchesSearch = 
      (compra.id && compra.id.toString().includes(searchTerm.toLowerCase())) ||
      (compra.proveedor_nombre && compra.proveedor_nombre.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (compra.proveedor_rut && compra.proveedor_rut.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (compra.numero_documento && compra.numero_documento.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'todos' || compra.estado === statusFilter;
    
    const matchesDate = dateFilter === 'todos' || (() => {
      const compraDate = new Date(compra.fecha_compra);
      const today = new Date();
      
      switch (dateFilter) {
        case 'hoy':
          return compraDate.toDateString() === today.toDateString();
        case 'semana':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          return compraDate >= weekAgo;
        case 'mes':
          return compraDate.getMonth() === today.getMonth() && compraDate.getFullYear() === today.getFullYear();
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Paginación
  const totalPages = Math.ceil(comprasFiltradas.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentCompras = comprasFiltradas.slice(startIndex, endIndex);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recibido':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Recibido</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>;
      case 'facturado':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Facturado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Calcular totales (usar todas las compras, no solo las filtradas)
  const totalCompras = compras.reduce((sum, compra) => sum + (compra.total || 0), 0);
  const comprasPendientes = compras.filter(c => c.estado === 'pendiente').length;
  const comprasRecibidas = compras.filter(c => c.estado === 'recibido' || c.estado === 'facturado').length;

  if (loading) {
    return (
      <div className="flex-1 space-y-8 p-8">
        <div className="flex items-center justify-center h-32">
          <div className="text-center">
            <ShoppingCart className="h-6 w-6 animate-pulse mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cargando compras...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCompra) {
    return (
      <div className="flex-1 space-y-8 p-8">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Volver a Compras
          </Button>
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold">Detalle de Compra</h1>
          </div>
        </div>

        {/* Información de la compra */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedCompra.numero_documento}</span>
              {getStatusBadge(selectedCompra.estado)}
            </CardTitle>
            <CardDescription>
              Compra realizada el {new Date(selectedCompra.fecha_compra).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Información del proveedor */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Proveedor</h3>
                <p className="font-medium">{selectedCompra.proveedor_nombre}</p>
                {selectedCompra.proveedor_rut && (
                  <p className="text-sm text-muted-foreground">RUT: {selectedCompra.proveedor_rut}</p>
                )}
              </div>
              <div>
                <h3 className="font-semibold mb-2">Información de Compra</h3>
                <p className="text-sm">Tipo: {selectedCompra.tipo_documento}</p>
                <p className="text-sm">Método de pago: {selectedCompra.metodo_pago || 'No especificado'}</p>
              </div>
            </div>

            {/* Items de la compra */}
            <div>
              <h3 className="font-semibold mb-4">Insumos Comprados</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Insumo</TableHead>
                      <TableHead>Cantidad</TableHead>
                      <TableHead>Precio Unitario</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCompra.items?.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{item.insumo_nombre}</TableCell>
                        <TableCell>{item.cantidad}</TableCell>
                        <TableCell>${item.precio_unitario.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell>${item.subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Totales */}
            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-2">
                <span>Subtotal:</span>
                <span>${selectedCompra.subtotal?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span>IVA (19%):</span>
                <span>${selectedCompra.impuestos?.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${selectedCompra.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
              </div>
            </div>

            {/* Observaciones */}
            {selectedCompra.observaciones && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-1">Observaciones:</p>
                <p className="text-sm">{selectedCompra.observaciones}</p>
              </div>
            )}
          </CardContent>
        </Card>
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
            <h1 className="text-3xl font-bold tracking-tight">Compras</h1>
          </div>
          <p className="text-muted-foreground">
            Gestión de compras a proveedores y control de insumos
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Compra
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
                <p className="text-sm font-medium text-muted-foreground">Total Compras</p>
                <p className="text-2xl font-bold">${totalCompras.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
              </div>
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Compras Recibidas</p>
                <p className="text-2xl font-bold">{comprasRecibidas}</p>
              </div>
              <Package className="h-5 w-5 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Pendientes</p>
                <p className="text-2xl font-bold">{comprasPendientes}</p>
              </div>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Proveedores Activos</p>
                <p className="text-2xl font-bold">{proveedores.length}</p>
              </div>
              <ShoppingCart className="h-5 w-5 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar por número, proveedor o RUT..."
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
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="pendiente">Pendiente</SelectItem>
                <SelectItem value="recibido">Recibido</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
                <SelectItem value="facturado">Facturado</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Fecha" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todas las fechas</SelectItem>
                <SelectItem value="hoy">Hoy</SelectItem>
                <SelectItem value="semana">Esta semana</SelectItem>
                <SelectItem value="mes">Este mes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de compras */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Registro de Compras
          </CardTitle>
          <CardDescription>
            Historial completo de compras realizadas a proveedores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° Documento</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Proveedor</TableHead>
                  <TableHead>Monto Total</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCompras.map((compra) => (
                  <TableRow key={compra.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {compra.tipo_documento === 'factura' ? (
                          <FileText className="h-4 w-4 text-blue-600" />
                        ) : (
                          <FileText className="h-4 w-4 text-green-600" />
                        )}
                        {compra.numero_documento}
                      </div>
                    </TableCell>
                    <TableCell>{new Date(compra.fecha_compra).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{compra.proveedor_nombre}</div>
                        {compra.proveedor_rut && (
                          <div className="text-sm text-muted-foreground">RUT: {compra.proveedor_rut}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${compra.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                    </TableCell>
                    <TableCell>{getStatusBadge(compra.estado)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(compra)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(compra)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(compra.id)}
                          className="text-red-600 hover:text-red-700"
                        >
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
            <div className="flex items-center justify-between space-x-2 py-4">
              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1} a {Math.min(endIndex, comprasFiltradas.length)} de {comprasFiltradas.length} compras
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <div className="text-sm">
                  Página {currentPage} de {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog para crear/editar compra */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingCompra ? 'Editar Compra' : 'Nueva Compra'}
            </DialogTitle>
            <DialogDescription>
              {editingCompra 
                ? 'Modifica los datos de la compra seleccionada.' 
                : 'Completa los campos para crear una nueva compra.'}
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
                    <SelectItem value="factura">Factura</SelectItem>
                    <SelectItem value="boleta">Boleta</SelectItem>
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
                  onValueChange={(value: 'pendiente' | 'recibido' | 'facturado') => 
                    setFormData(prev => ({ ...prev, estado: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendiente">Pendiente</SelectItem>
                    <SelectItem value="recibido">Recibido</SelectItem>
                    <SelectItem value="facturado">Facturado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Selección de proveedor */}
            <div className="space-y-2">
              <Label htmlFor="proveedor">Proveedor *</Label>
              <div className="relative">
                <Input
                  placeholder="Buscar proveedor por nombre, email o RUT..."
                  value={proveedorSearch}
                  onChange={(e) => {
                    setProveedorSearch(e.target.value);
                    setShowProveedorDropdown(true);
                    if (!e.target.value) {
                      setFormData(prev => ({ ...prev, proveedor_id: '' }));
                    }
                  }}
                  onFocus={() => setShowProveedorDropdown(true)}
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                
                {showProveedorDropdown && proveedoresFiltrados.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-background dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {proveedoresFiltrados.slice(0, 10).map((proveedor) => (
                      <div
                        key={proveedor.id}
                        className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 text-foreground"
                        onClick={() => seleccionarProveedor(proveedor)}
                      >
                        <div className="font-medium">{proveedor.nombre}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{proveedor.email}</div>
                        {proveedor.rut && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">RUT: {proveedor.rut}</div>
                        )}
                        {proveedor.ciudad && (
                          <div className="text-xs text-gray-500 dark:text-gray-500">{proveedor.ciudad}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Insumos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-lg font-semibold">Insumos de la Compra</Label>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowInsumoDropdown(true)}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Agregar Insumo
                </Button>
              </div>
              
              {/* Búsqueda de insumos */}
              {showInsumoDropdown && (
                <div className="relative">
                  <Input
                    placeholder="Buscar insumo por nombre..."
                    value={insumoSearch}
                    onChange={(e) => setInsumoSearch(e.target.value)}
                    autoFocus
                    className="bg-white dark:bg-white border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-gray-900 placeholder:text-gray-500"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  
                  {insumosFiltrados.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-background dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      {insumosFiltrados.slice(0, 10).map((insumo) => (
                        <div
                          key={insumo.id}
                          className="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0 text-foreground"
                          onClick={() => agregarInsumo(insumo)}
                        >
                          <div className="font-medium">{insumo.nombre}</div>
                          <div className="text-sm text-gray-600">${insumo.precio.toLocaleString('es-CL', { maximumFractionDigits: 0 })} / {insumo.unidad_medida}</div>
                          <div className="text-xs text-gray-500">Stock: {insumo.stock} {insumo.unidad_medida}</div>
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
                        setShowInsumoDropdown(false);
                        setInsumoSearch('');
                      }}
                    >
                      Cerrar
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Lista de insumos agregados */}
              {compraItems.length > 0 && (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Insumo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio Unit.</TableHead>
                        <TableHead>Descuento</TableHead>
                        <TableHead>Subtotal</TableHead>
                        <TableHead>Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {compraItems.map((item) => (
                        <TableRow key={item.insumo_id}>
                          <TableCell>
                            <div>
                              <div className="font-medium">{item.insumo_nombre}</div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => actualizarCantidad(item.insumo_id, item.cantidad - 1)}
                                disabled={item.cantidad <= 1}
                              >
                                -
                              </Button>
                              <Input
                                type="number"
                                value={item.cantidad}
                                onChange={(e) => actualizarCantidad(item.insumo_id, parseInt(e.target.value) || 1)}
                                className="w-16 text-center"
                                min="1"
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => actualizarCantidad(item.insumo_id, item.cantidad + 1)}
                              >
                                +
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.precio_unitario}
                              onChange={(e) => actualizarPrecio(item.insumo_id, parseFloat(e.target.value) || 0)}
                              className="w-24"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              value={item.descuento || 0}
                              onChange={(e) => actualizarDescuento(item.insumo_id, parseFloat(e.target.value) || 0)}
                              className="w-20"
                              min="0"
                              step="0.01"
                            />
                          </TableCell>
                          <TableCell className="font-medium">
                            ${item.subtotal.toLocaleString('es-CL', { maximumFractionDigits: 0 })}
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => eliminarInsumo(item.insumo_id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
                  {/* Totales */}
                  <div className="p-4 border-t bg-gray-50 dark:bg-gray-800 space-y-2">
                    <div className="flex justify-between items-center">
                      <span>Subtotal:</span>
                      <span>${compraItems.reduce((sum, item) => sum + item.subtotal, 0).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>IVA (19%):</span>
                      <span>${(compraItems.reduce((sum, item) => sum + item.subtotal, 0) * 0.19).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center font-bold text-lg border-t pt-2">
                      <span>Total:</span>
                      <span>${(compraItems.reduce((sum, item) => sum + item.subtotal, 0) * 1.19).toLocaleString('es-CL', { maximumFractionDigits: 0 })}</span>
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
                value={formData.observaciones}
                onChange={(e) => setFormData(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Observaciones adicionales sobre la compra..."
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">
                {editingCompra ? 'Actualizar' : 'Crear'} Compra
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Compras;