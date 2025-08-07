import React, { useState } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { RegisterForm } from '@/components/auth/RegisterForm';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Auth = () => {
  const [activeTab, setActiveTab] = useState('login');

  const toggleMode = () => {
    setActiveTab(activeTab === 'login' ? 'register' : 'login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Fungus Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Sistema de gestión y monitoreo
          </p>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
            <TabsTrigger value="register">Registrarse</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="mt-0">
            <LoginForm onToggleMode={toggleMode} />
          </TabsContent>
          
          <TabsContent value="register" className="mt-0">
            <RegisterForm onToggleMode={toggleMode} />
          </TabsContent>
        </Tabs>
        
        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            © 2024 Fungus Dashboard. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Auth;