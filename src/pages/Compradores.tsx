import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Users, Eye, Phone, Mail, MapPin, ArrowLeft, Home, User, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/config/api';

interface Comprador {
  id: number;
  nombre: string;
  email: string;
  telefono?: string;
  rut?: string;
  direccion?: string;
  ciudad?: string;
  pais?: string;
  fecha_registro: string;
  activo: boolean;
  notas?: string;
  created_at: string;
  updated_at: string;
}

interface Venta {
  id: number;
  folio: string;
  date: string;
  total: number;
  status: 'pendiente' | 'pagado' | 'cancelado';
  products?: string;
}

const Compradores = () => {
  const [compradores, setCompradores] = useState<Comprador[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingComprador, setEditingComprador] = useState<Comprador | null>(null);
  const [selectedComprador, setSelectedComprador] = useState<Comprador | null>(null);
  const [ventas, setVentas] = useState<Venta[]>([]);
  const [loadingVentas, setLoadingVentas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    rut: '',
    direccion: '',
    ciudad: '',
    pais: 'Chile',
    notas: ''
  });
  
  const { toast } = useToast();
  const navigate = useNavigate();



  // Datos de ejemplo para ventas
  const sampleVentas: Venta[] = [
    {
      id: 1,
      folio: 'V-2024-001',
      date: '2024-01-15',
      total: 25000,
      status: 'pagado',
      products: 'Kit Cultivo Shiitake x2'
    },
    {
      id: 2,
      folio: 'V-2024-015',
      date: '2024-01-20',
      total: 18500,
      status: 'pagado',
      products: 'Hongos Ostra Premium x1'
    },
    {
      id: 3,
      folio: 'V-2024-032',
      date: '2024-02-01',
      total: 32000,
      status: 'pendiente',
      products: 'Kit Cultivo Completo x1'
    }
  ];

  useEffect(() => {
    fetchCompradores();
  }, []);

  // Obtener compradores del backend
  const fetchCompradores = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/compradores');
      
      if (response.ok) {
        const result = await response.json();
        setCompradores(result.data || result);
      } else {
        toast({
          title: "Error",
          description: "No se pudieron cargar los compradores",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching compradores:', error);
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Simular carga de ventas de un comprador
  const fetchVentasComprador = async (compradorId: number) => {
    try {
      setLoadingVentas(true);
      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 800));
      // Filtrar ventas por comprador (simulado)
      const ventasComprador = sampleVentas.filter(() => Math.random() > 0.3);
      setVentas(ventasComprador);
    } catch (error) {
      console.error('Error fetching ventas:', error);
      toast({
        title: "Error",
        description: "Error al cargar historial de ventas",
        variant: "destructive"
      });
    } finally {
      setLoadingVentas(false);
    }
  };

  // Manejar envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingComprador) {
        // Actualizar comprador existente
        const response = await apiRequest(`/compradores?id=${editingComprador.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            rut: formData.rut,
            direccion: formData.direccion,
            ciudad: formData.ciudad,
            pais: formData.pais,
            notas: formData.notas,
            activo: true
          })
        });
        
        if (response.ok) {
          toast({
            title: "Éxito",
            description: "Comprador actualizado correctamente"
          });
          // Recargar la lista de compradores
          await fetchCompradores();
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Error al actualizar comprador",
            variant: "destructive"
          });
          return;
        }
      } else {
        // Crear nuevo comprador
        const response = await apiRequest('/compradores', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            nombre: formData.nombre,
            email: formData.email,
            telefono: formData.telefono,
            rut: formData.rut,
            direccion: formData.direccion,
            ciudad: formData.ciudad,
            pais: formData.pais,
            notas: formData.notas,
            activo: true
          })
        });
        
        if (response.ok) {
          toast({
            title: "Éxito",
            description: "Comprador creado correctamente"
          });
          // Recargar la lista de compradores
          await fetchCompradores();
        } else {
          const errorData = await response.json();
          toast({
            title: "Error",
            description: errorData.error || "Error al crear comprador",
            variant: "destructive"
          });
          return;
        }
      }
      
      setIsDialogOpen(false);
      setEditingComprador(null);
      setFormData({ nombre: '', email: '', telefono: '', rut: '', direccion: '', ciudad: '', pais: 'Chile', notas: '' });
    } catch (error) {
      console.error('Error saving comprador:', error);
      toast({
        title: "Error",
        description: "Error de conexión al guardar comprador",
        variant: "destructive"
      });
    }
  };

  // Manejar eliminación
  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este comprador?')) return;
    
    try {
      const response = await apiRequest(`/compradores?id=${id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        toast({
          title: "Éxito",
          description: "Comprador eliminado correctamente"
        });
        // Recargar la lista de compradores
        await fetchCompradores();
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: errorData.error || "Error al eliminar comprador",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting comprador:', error);
      toast({
        title: "Error",
        description: "Error de conexión al eliminar comprador",
        variant: "destructive"
      });
    }
  };

  // Manejar edición
  const handleEdit = (comprador: Comprador) => {
    setEditingComprador(comprador);
    setFormData({
      nombre: comprador.nombre,
      email: comprador.email,
      telefono: comprador.telefono || '',
      rut: comprador.rut || '',
      direccion: comprador.direccion || '',
      ciudad: comprador.ciudad || '',
      pais: comprador.pais || 'Chile',
      notas: comprador.notas || ''
    });
    setIsDialogOpen(true);
  };

  // Manejar nuevo comprador
  const handleNew = () => {
    setEditingComprador(null);
    setFormData({ nombre: '', email: '', telefono: '', rut: '', direccion: '', ciudad: '', pais: 'Chile', notas: '' });
    setIsDialogOpen(true);
  };

  // Ver detalle del comprador
  const handleViewDetail = (comprador: Comprador) => {
    setSelectedComprador(comprador);
    fetchVentasComprador(comprador.id);
  };

  // Volver a la lista
  const handleBackToList = () => {
    setSelectedComprador(null);
    setVentas([]);
  };

  // Manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Filtrar compradores por búsqueda
  const filteredCompradores = compradores.filter(comprador =>
    comprador.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    comprador.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (comprador.rut && comprador.rut.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (comprador.ciudad && comprador.ciudad.toLowerCase().includes(searchTerm.toLowerCase()))
  );



  // Obtener badge de estado de venta
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'pagado': { label: 'Pagado', variant: 'default' as const, className: 'bg-green-100 text-green-800' },
      'pendiente': { label: 'Pendiente', variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-800' },
      'cancelado': { label: 'Cancelado', variant: 'destructive' as const, className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pendiente;
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-8 w-8 animate-pulse mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Cargando compradores...</p>
          </div>
        </div>
      </div>
    );
  }

  // Vista de detalle del comprador
  if (selectedComprador) {
    const totalVentas = ventas.reduce((sum, venta) => sum + venta.total, 0);
    const ventasPagadas = ventas.filter(v => v.status === 'pagado').length;
    const ultimaVenta = ventas.length > 0 ? ventas[0].date : '-';

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
          <Button 
            onClick={handleBackToList}
            variant="ghost"
            size="sm"
            className="h-auto p-1 hover:bg-transparent hover:text-green-600 transition-colors"
          >
            Compradores
          </Button>
          <span>/</span>
          <span className="text-green-600 font-medium">{selectedComprador.nombre}</span>
        </div>

        {/* Botón volver */}
        <Button 
          onClick={handleBackToList}
          variant="outline"
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a Compradores
        </Button>

        {/* Header del comprador */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
                <User className="h-7 w-7 md:h-8 md:w-8 text-white" />
              </div>
              <span className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
                {selectedComprador.nombre}
              </span>
              <Badge className="bg-green-100 text-green-800">Comprador</Badge>
            </h1>
            <p className="text-muted-foreground text-base md:text-lg mt-2">
              Email: {selectedComprador.email || 'No especificado'}
            </p>
          </div>
          <Button 
            onClick={() => handleEdit(selectedComprador)}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Editar Comprador
          </Button>
        </div>

        {/* Información del comprador */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedComprador.email || 'No especificado'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{selectedComprador.telefono || 'No especificado'}</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <span className="text-sm">{selectedComprador.direccion || 'No especificado'}</span>
              </div>
              {selectedComprador.ciudad && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{selectedComprador.ciudad}, {selectedComprador.pais || 'Chile'}</span>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">${totalVentas.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</p>
                    <p className="text-xs text-muted-foreground">Total Gastado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{ventas.length}</p>
                    <p className="text-xs text-muted-foreground">Total Ventas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <div>
                    <p className="text-sm font-bold">{ultimaVenta}</p>
                    <p className="text-xs text-muted-foreground">Primera/Última Venta</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{ventasPagadas}</p>
                    <p className="text-xs text-muted-foreground">Ventas Pagadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historial de Ventas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Historial de Ventas
            </CardTitle>
            <CardDescription>
              Registro completo de transacciones realizadas
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingVentas ? (
              <div className="flex items-center justify-center h-32">
                <div className="text-center">
                  <TrendingUp className="h-6 w-6 animate-pulse mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Cargando historial...</p>
                </div>
              </div>
            ) : ventas.length === 0 ? (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-muted-foreground">No hay ventas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>N° Folio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ventas.map((venta) => (
                      <TableRow key={venta.id}>
                        <TableCell className="font-medium">{venta.folio}</TableCell>
                        <TableCell>{new Date(venta.date).toLocaleDateString()}</TableCell>
                        <TableCell>${venta.total.toLocaleString('es-CL', { maximumFractionDigits: 0 })}</TableCell>
                        <TableCell>{getStatusBadge(venta.status)}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog para editar comprador */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Editar Comprador</DialogTitle>
              <DialogDescription>
                Modifica los datos del comprador seleccionado.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: María González"
                  required
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Ej: cliente@ejemplo.com"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  name="rut"
                  value={formData.rut}
                  onChange={handleInputChange}
                  placeholder="Ej: 12.345.678-9"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej: 9 1234 5678"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Providencia 123"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ej: Santiago"
                    className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    name="pais"
                    value={formData.pais}
                    onChange={handleInputChange}
                    placeholder="Ej: Chile"
                    className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Input
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  placeholder="Notas adicionales sobre el comprador"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  Actualizar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Vista principal de lista de compradores
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
        <span className="text-green-600 font-medium">Compradores</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-center sm:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight flex items-center justify-center sm:justify-start gap-3">
            <div className="p-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg">
              <Users className="h-7 w-7 md:h-8 md:w-8 text-white" />
            </div>
            <span className="bg-gradient-to-r from-green-700 to-green-600 bg-clip-text text-transparent">
              Compradores
            </span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg mt-2">
            Administración de clientes y relaciones comerciales
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              onClick={handleNew}
              className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              <span className="hidden xs:inline">Nuevo Comprador</span>
              <span className="xs:hidden">Nuevo</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] mx-2 sm:mx-4 max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingComprador ? 'Editar Comprador' : 'Nuevo Comprador'}
              </DialogTitle>
              <DialogDescription>
                {editingComprador 
                  ? 'Modifica los datos del comprador seleccionado.'
                  : 'Completa los campos para agregar un nuevo comprador.'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre *</Label>
                  <Input
                    id="nombre"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej: María González"
                    required
                    className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Ej: cliente@ejemplo.com"
                    className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  name="rut"
                  value={formData.rut}
                  onChange={handleInputChange}
                  placeholder="Ej: 12.345.678-9"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="Ej: 9 1234 5678"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="direccion">Dirección</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Ej: Av. Providencia 123"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ciudad">Ciudad</Label>
                  <Input
                    id="ciudad"
                    name="ciudad"
                    value={formData.ciudad}
                    onChange={handleInputChange}
                    placeholder="Ej: Santiago"
                    className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pais">País</Label>
                  <Input
                    id="pais"
                    name="pais"
                    value={formData.pais}
                    onChange={handleInputChange}
                    placeholder="Ej: Chile"
                    className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Input
                  id="notas"
                  name="notas"
                  value={formData.notas}
                  onChange={handleInputChange}
                  placeholder="Notas adicionales sobre el comprador"
                  className="bg-background dark:bg-gray-800 border-gray-200 dark:border-gray-600 focus:border-green-500 focus:ring-green-500/20 transition-all duration-200 text-foreground placeholder:text-muted-foreground"
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" className="bg-green-600 hover:bg-green-700">
                  {editingComprador ? 'Actualizar' : 'Crear'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Input
            placeholder="Buscar por nombre, RUT o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
      </div>

      {/* Lista de compradores */}
      {filteredCompradores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Users className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay compradores</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'No se encontraron compradores que coincidan con tu búsqueda.' : 'Comienza agregando tu primer comprador.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleNew} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Comprador
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>RUT</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompradores.map((comprador) => (
                <TableRow key={comprador.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-green-600" />
                      </div>
                      {comprador.nombre}
                    </div>
                  </TableCell>
                  <TableCell>{comprador.email || '-'}</TableCell>
                  <TableCell>{comprador.rut || '-'}</TableCell>
                  <TableCell>{comprador.telefono || '-'}</TableCell>
                  <TableCell className="max-w-xs truncate" title={comprador.direccion || '-'}>
                    {comprador.direccion || '-'}
                  </TableCell>
                  <TableCell>{comprador.ciudad ? `${comprador.ciudad}, ${comprador.pais || 'Chile'}` : '-'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetail(comprador)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(comprador)}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comprador.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
      )}
    </div>
  );
};

export default Compradores;