import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface RegisterFormProps {
  onToggleMode: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onToggleMode }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [passwordValidation, setPasswordValidation] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  });
  const { register, isLoading } = useAuth();

  const validatePassword = (password: string) => {
    const validation = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };
    setPasswordValidation(validation);
    return Object.values(validation).every(Boolean);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (field === 'password') {
      validatePassword(value);
    }
    
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validaciones
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Por favor, completa todos los campos');
      return;
    }

    if (formData.username.length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Por favor, ingresa un email válido');
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('La contraseña no cumple con los requisitos de seguridad');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    const success = await register(formData.username, formData.email, formData.password);
    if (!success) {
      setError('Error al crear la cuenta. El usuario o email ya existe.');
    }
  };

  const ValidationItem = ({ isValid, text }: { isValid: boolean; text: string }) => (
    <div className="flex items-center space-x-2 text-sm">
      {isValid ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <span className={isValid ? 'text-green-600' : 'text-red-600'}>{text}</span>
    </div>
  );

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
        <CardDescription className="text-center">
          Completa los datos para crear tu nueva cuenta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">Nombre de Usuario</Label>
            <Input
              id="username"
              type="text"
              placeholder="Elige un nombre de usuario"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              disabled={isLoading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Crea una contraseña segura"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {formData.password && (
              <div className="space-y-1 p-3 bg-muted rounded-md">
                <p className="text-sm font-medium mb-2">Requisitos de contraseña:</p>
                <ValidationItem isValid={passwordValidation.length} text="Al menos 8 caracteres" />
                <ValidationItem isValid={passwordValidation.uppercase} text="Una letra mayúscula" />
                <ValidationItem isValid={passwordValidation.lowercase} text="Una letra minúscula" />
                <ValidationItem isValid={passwordValidation.number} text="Un número" />
                <ValidationItem isValid={passwordValidation.special} text="Un carácter especial" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Confirma tu contraseña"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                disabled={isLoading}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creando cuenta...
              </>
            ) : (
              'Crear Cuenta'
            )}
          </Button>
          
          <div className="text-center text-sm">
            <span className="text-muted-foreground">¿Ya tienes una cuenta? </span>
            <Button
              type="button"
              variant="link"
              className="p-0 h-auto font-semibold"
              onClick={onToggleMode}
              disabled={isLoading}
            >
              Inicia sesión aquí
            </Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};