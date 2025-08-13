import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, Truck, Eye, Phone, Mail, MapPin, ArrowLeft, Home, User, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '@/config/api';

interface Proveedor {
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

interface Compra {
  id: number;
  folio: string;
  date: string;
  total: number;
  status: 'pendiente' | 'recibido' | 'cancelado';
  products?: string;
}

const Proveedores = () => {
  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProveedor, setEditingProveedor] = useState<Proveedor | null>(null);
  const [selectedProveedor, setSelectedProveedor] = useState<Proveedor | null>(null);
  const [compras, setCompras] = useState<Compra[]>([]);
  const [loadingCompras, setLoadingCompras] = useState(false);
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

  // Datos de ejemplo para compras
  const sampleCompras: Compra[] = [
    {
      id: 1,
      folio: 'C-2024-001',
      date: '2024-01-15',
      total: 125000,
      status: 'recibido',
      products: 'Sustrato Orgánico x50kg'
    },
    {
      id: 2,
      folio: 'C-2024-015',
      date: '2024-01-20',
      total: 85000,
      status: 'recibido',
      products: 'Equipos de Esterilización x2'
    },
    {
      id: 3,
      folio: 'C-2024-032',
      date: '2024-01-25',
      total: 45000,
      status: 'pendiente',
      products: 'Envases Biodegradables x200'
    }
  ];

  // Datos de ejemplo para proveedores
  const sampleProveedores: Proveedor[] = [
    {
      id: 1,
      nombre: 'Sustratos del Sur',
      email: 'contacto@sustratossur.cl',
      telefono: '+56912345678',
      rut: '76543210-1',
      direccion: 'Av. Industrial 1234',
      ciudad: 'Temuco',
      pais: 'Chile',
      fecha_registro: '2024-01-15T10:00:00Z',
      activo: true,
      notas: 'Proveedor principal de sustratos orgánicos',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z'
    },
    {
      id: 2,
      nombre: 'Equipos Micológicos Ltda.',
      email: 'ventas@equiposmico.cl',
      telefono: '+56987654321',
      rut: '87654321-2',
      direccion: 'Calle Los Industriales 567',
      ciudad: 'Santiago',
      pais: 'Chile',
      fecha_registro: '2024-01-10T14:30:00Z',
      activo: true,
      notas: 'Equipamiento especializado para cultivo',
      created_at: '2024-01-10T14:30:00Z',
      updated_at: '2024-01-10T14:30:00Z'
    },
    {
      id: 3,
      nombre: 'Semillas y Esporas Chile',
      email: 'info@semillasesporas.cl',
      telefono: '+56911223344',
      rut: '98765432-3',
      direccion: 'Paseo Científico 890',
      ciudad: 'Valparaíso',
      pais: 'Chile',
      fecha_registro: '2024-01-05T09:15:00Z',
      activo: true,
      notas: 'Importador de cepas y esporas certificadas',
      created_at: '2024-01-05T09:15:00Z',
      updated_at: '2024-01-05T09:15:00Z'
    }
  ];

  const fetchData = async () => {
    try {
      setLoading(true);
      console.log('Fetching proveedores...');
      const response = await apiRequest('/proveedores?limit=100');
      console.log('Proveedores response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Proveedores data received:', data);
        if (data.data) {
          console.log('Setting proveedores from API:', data.data.length, 'items');
          setProveedores(data.data);
        } else {
          console.log('No proveedores data, using sample data');
          setProveedores(sampleProveedores);
        }
      } else {
        console.log('Proveedores response not ok, using sample data');
        setProveedores(sampleProveedores);
      }
    } catch (error) {
      console.error('Error fetching proveedores:', error);
      setProveedores(sampleProveedores);
      toast({
        title: "Información",
        description: "Usando datos de ejemplo. Verifique la conexión con el servidor.",
        variant: "default"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCompras = async (proveedorId: number) => {
    try {
      setLoadingCompras(true);
      // Por ahora usamos datos de ejemplo
      setCompras(sampleCompras);
    } catch (error) {
      console.error('Error fetching compras:', error);
      setCompras(sampleCompras);
    } finally {
      setLoadingCompras(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingProveedor) {
        // Actualizar proveedor existente
        const response = await apiRequest('/proveedores', {
          method: 'PUT',
          body: JSON.stringify({ ...formData, id: editingProveedor.id })
        });
        
        if (response) {
          setProveedores(prev => prev.map(p => p.id === editingProveedor.id ? response : p));
          toast({
            title: "Éxito",
            description: "Proveedor actualizado correctamente"
          });
        }
      } else {
        // Crear nuevo proveedor
        const response = await apiRequest('/proveedores', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        
        if (response) {
          setProveedores(prev => [response, ...prev]);
          toast({
            title: "Éxito",
            description: "Proveedor creado correctamente"
          });
        }
      }
      
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving proveedor:', error);
      toast({
        title: "Error",
        description: "Error al guardar el proveedor",
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      return;
    }
    
    try {
      await apiRequest('/proveedores', {
        method: 'DELETE',
        body: JSON.stringify({ id })
      });
      
      setProveedores(prev => prev.filter(p => p.id !== id));
      toast({
        title: "Éxito",
        description: "Proveedor eliminado correctamente"
      });
    } catch (error) {
      console.error('Error deleting proveedor:', error);
      toast({
        title: "Error",
        description: "Error al eliminar el proveedor",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (proveedor: Proveedor) => {
    setEditingProveedor(proveedor);
    setFormData({
      nombre: proveedor.nombre,
      email: proveedor.email,
      telefono: proveedor.telefono || '',
      rut: proveedor.rut || '',
      direccion: proveedor.direccion || '',
      ciudad: proveedor.ciudad || '',
      pais: proveedor.pais || 'Chile',
      notas: proveedor.notas || ''
    });
    setIsDialogOpen(true);
  };

  const handleNew = () => {
    setEditingProveedor(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      rut: '',
      direccion: '',
      ciudad: '',
      pais: 'Chile',
      notas: ''
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingProveedor(null);
  };

  const handleViewDetails = (proveedor: Proveedor) => {
    setSelectedProveedor(proveedor);
    fetchCompras(proveedor.id);
  };

  const handleBackToList = () => {
    setSelectedProveedor(null);
    setCompras([]);
  };

  const filteredProveedores = proveedores.filter(proveedor =>
    proveedor.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    proveedor.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (proveedor.rut && proveedor.rut.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (proveedor.ciudad && proveedor.ciudad.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recibido':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Recibido</Badge>;
      case 'pendiente':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Pendiente</Badge>;
      case 'cancelado':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando proveedores...</p>
          </div>
        </div>
      </div>
    );
  }

  if (selectedProveedor) {
    return (
      <div className="container mx-auto p-6">
        {/* Header con botón de regreso */}
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleBackToList}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Proveedores
          </Button>
          <div className="flex items-center gap-2">
            <Truck className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold">Detalles del Proveedor</h1>
          </div>
        </div>

        {/* Información del proveedor */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                {selectedProveedor.nombre}
              </CardTitle>
              <CardDescription>
                Proveedor desde {new Date(selectedProveedor.fecha_registro).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{selectedProveedor.email}</span>
                </div>
                {selectedProveedor.telefono && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProveedor.telefono}</span>
                  </div>
                )}
                {selectedProveedor.rut && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>RUT: {selectedProveedor.rut}</span>
                  </div>
                )}
                {selectedProveedor.direccion && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProveedor.direccion}</span>
                  </div>
                )}
                {selectedProveedor.ciudad && (
                  <div className="flex items-center gap-2">
                    <Home className="h-4 w-4 text-muted-foreground" />
                    <span>{selectedProveedor.ciudad}, {selectedProveedor.pais}</span>
                  </div>
                )}
              </div>
              {selectedProveedor.notas && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">Notas:</p>
                  <p>{selectedProveedor.notas}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Estadísticas rápidas */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Total Compras</span>
                </div>
                <p className="text-2xl font-bold">
                  ${compras.reduce((sum, compra) => sum + compra.total, 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">Órdenes</span>
                </div>
                <p className="text-2xl font-bold">{compras.length}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Última Compra</span>
                </div>
                <p className="text-sm">
                  {compras.length > 0 
                    ? new Date(Math.max(...compras.map(c => new Date(c.date).getTime()))).toLocaleDateString()
                    : 'Sin compras'
                  }
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Historial de compras */}
        <Card>
          <CardHeader>
            <CardTitle>Historial de Compras</CardTitle>
            <CardDescription>
              Registro de todas las compras realizadas a este proveedor
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingCompras ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              </div>
            ) : compras.length === 0 ? (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No hay compras registradas para este proveedor</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Folio</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Productos</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {compras.map((compra) => (
                      <TableRow key={compra.id}>
                        <TableCell className="font-medium">{compra.folio}</TableCell>
                        <TableCell>{new Date(compra.date).toLocaleDateString()}</TableCell>
                        <TableCell>{compra.products}</TableCell>
                        <TableCell>${compra.total.toLocaleString()}</TableCell>
                        <TableCell>{getStatusBadge(compra.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Truck className="h-6 w-6 text-green-600" />
          <h1 className="text-2xl font-bold">Gestión de Proveedores</h1>
        </div>
        <Button onClick={handleNew} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Proveedor
        </Button>
      </div>

      {/* Barra de búsqueda */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            type="text"
            placeholder="Buscar por nombre, RUT o email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-4"
          />
        </div>
      </div>

      {/* Lista de proveedores */}
      {filteredProveedores.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Truck className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No hay proveedores</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm ? 'No se encontraron proveedores que coincidan con tu búsqueda.' : 'Comienza agregando tu primer proveedor.'}
            </p>
            {!searchTerm && (
              <Button onClick={handleNew} className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Proveedor
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
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProveedores.map((proveedor) => (
                <TableRow key={proveedor.id}>
                  <TableCell className="font-medium">{proveedor.nombre}</TableCell>
                  <TableCell>{proveedor.email}</TableCell>
                  <TableCell>{proveedor.rut || '-'}</TableCell>
                  <TableCell>{proveedor.telefono || '-'}</TableCell>
                  <TableCell>{proveedor.direccion || '-'}</TableCell>
                  <TableCell>{proveedor.ciudad || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={proveedor.activo ? "default" : "secondary"}>
                      {proveedor.activo ? 'Activo' : 'Inactivo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(proveedor)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(proveedor)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(proveedor.id)}
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
      )}

      {/* Dialog para crear/editar proveedor */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingProveedor ? 'Editar Proveedor' : 'Nuevo Proveedor'}
            </DialogTitle>
            <DialogDescription>
              {editingProveedor 
                ? 'Modifica la información del proveedor.' 
                : 'Completa la información para agregar un nuevo proveedor.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre *</Label>
                <Input
                  id="nombre"
                  value={formData.nombre}
                  onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  value={formData.telefono}
                  onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="rut">RUT</Label>
                <Input
                  id="rut"
                  value={formData.rut}
                  onChange={(e) => setFormData(prev => ({ ...prev, rut: e.target.value }))}
                  placeholder="12345678-9"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="ciudad">Ciudad</Label>
                <Input
                  id="ciudad"
                  value={formData.ciudad}
                  onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pais">País</Label>
                <Input
                  id="pais"
                  value={formData.pais}
                  onChange={(e) => setFormData(prev => ({ ...prev, pais: e.target.value }))}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                value={formData.direccion}
                onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notas">Notas</Label>
              <Input
                id="notas"
                value={formData.notas}
                onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                placeholder="Información adicional sobre el proveedor..."
              />
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="bg-green-600 hover:bg-green-700">
                {editingProveedor ? 'Actualizar' : 'Crear'} Proveedor
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Proveedores;