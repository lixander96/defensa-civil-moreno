import { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Checkbox } from './ui/checkbox';
import { Loader2, MessageCircle, Shield, ArrowLeft, Clock, Phone, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

type LoginStep = 'login' | 'forgot-password' | 'verify-code' | 'new-password' | 'success';

interface LoginProps {
  onLogin: (username: string, password: string, options?: { remember?: boolean }) => Promise<boolean>;
  onRequestPasswordReset?: (username: string) => Promise<boolean>;
  onValidateResetCode?: (username: string, code: string) => Promise<boolean>;
  onResetPassword?: (username: string, code: string, newPassword: string) => Promise<boolean>;
}

export function Login({ 
  onLogin, 
  onRequestPasswordReset = async () => false, 
  onValidateResetCode = async () => false, 
  onResetPassword = async () => false
}: LoginProps) {
  const [step, setStep] = useState<LoginStep>('login');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [resetData, setResetData] = useState({ 
    username: '', 
    code: '', 
    newPassword: '', 
    confirmPassword: '' 
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Estados para controlar visibilidad de contraseñas
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      const storedUsername = window.localStorage.getItem('rememberUser');
      if (storedUsername) {
        setCredentials((prev) => ({ ...prev, username: storedUsername }));
        setRememberMe(true);
      }
    } catch (error) {
      console.warn('No se pudo leer el usuario recordado', error);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    let didLogin = false;

    try {
      didLogin = await onLogin(credentials.username, credentials.password, {
        remember: rememberMe,
      });

      if (didLogin) {
        if (typeof window !== 'undefined') {
          if (rememberMe) {
            window.localStorage.setItem('rememberUser', credentials.username);
          } else {
            window.localStorage.removeItem('rememberUser');
          }
        }
      } else {
        setError('Usuario o contrasena incorrectos. Verifique sus credenciales e intente nuevamente.');
      }
    } catch (error) {
      console.error('No se pudo completar el inicio de sesión', error);
      setError('Ocurrio un error al intentar iniciar sesion. Por favor intente nuevamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const success = await onRequestPasswordReset(resetData.username);
    
    if (success) {
      // Simular número de teléfono parcialmente oculto
      const mockPhone = resetData.username === 'jlopez' ? '+54 9 11 ***2-1098' : '+54 9 11 ***7-890';
      setPhoneNumber(mockPhone);
      setSuccess(`Código enviado por WhatsApp a ${mockPhone}`);
      setStep('verify-code');
    } else {
      setError('Usuario no encontrado. Verifique el usuario ingresado.');
    }
    
    setIsLoading(false);
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    const success = await onValidateResetCode(resetData.username, resetData.code);
    
    if (success) {
      setStep('new-password');
    } else {
      setError('Código incorrecto. Verifique el código recibido por WhatsApp.');
    }
    
    setIsLoading(false);
  };

  const handleNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (resetData.newPassword !== resetData.confirmPassword) {
      setError('Las contraseñas no coinciden. Verifique e intente nuevamente.');
      return;
    }

    if (resetData.newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setIsLoading(true);

    const success = await onResetPassword(resetData.username, resetData.code, resetData.newPassword);
    
    if (success) {
      setSuccess('Contraseña cambiada exitosamente');
      setStep('success');
      setTimeout(() => {
        setStep('login');
        setResetData({ username: '', code: '', newPassword: '', confirmPassword: '' });
        setError('');
        setSuccess('');
      }, 3000);
    } else {
      setError('Error al cambiar la contraseña. Intente nuevamente.');
    }
    
    setIsLoading(false);
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSuccess(`Código reenviado por WhatsApp a ${phoneNumber}`);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header with theme toggle */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-20 h-20 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center">
                <Shield className="w-10 h-10 text-primary" />
              </div>
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-foreground">Defensa Civil Moreno</h1>
              <p className="text-muted-foreground mt-2">Sistema de Gestión de Emergencias</p>
            </div>
          </div>

          {/* Login Form */}
          {step === 'login' && (
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Iniciar Sesión</CardTitle>
                <CardDescription>
                  Ingrese sus credenciales para acceder al sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-sm font-medium">Usuario</Label>
                    <Input
                      id="username"
                      type="text"
                      value={credentials.username}
                      onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                      required
                      className="h-12 px-4"
                      placeholder="Ingrese su usuario"
                      autoComplete="username"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={credentials.password}
                        onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                        required
                        className="h-12 px-4 pr-12"
                        placeholder="Ingrese su contraseña"
                        autoComplete="current-password"
                      />
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) => {
                        const nextValue = checked === true;
                        setRememberMe(nextValue);
                        if (!nextValue && typeof window !== 'undefined') {
                          window.localStorage.removeItem('rememberUser');
                        }
                      }}
                    />
                    <Label htmlFor="remember" className="text-sm cursor-pointer">
                      Recordarme
                    </Label>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-14 text-base font-medium" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Ingresar
                  </Button>
                </form>

                {/*<div className="text-center">
                  <Button 
                    variant="link" 
                    onClick={() => setStep('forgot-password')}
                    className="text-sm font-normal text-primary hover:text-primary/80"
                  >
                    ¿Olvidé mi contraseña?
                  </Button>
                </div>*/}
              </CardContent>
            </Card>
          )}

          {/* Forgot Password */}
          {step === 'forgot-password' && (
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStep('login')}
                    className="absolute left-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-xl">Recuperar Contraseña</CardTitle>
                </div>
                <CardDescription>
                  Ingrese su usuario para recibir un código de verificación por WhatsApp
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="reset-username" className="text-sm font-medium">Usuario</Label>
                    <Input
                      id="reset-username"
                      type="text"
                      value={resetData.username}
                      onChange={(e) => setResetData(prev => ({ ...prev, username: e.target.value }))}
                      required
                      className="h-12 px-4"
                      placeholder="Ingrese su usuario"
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-14 text-base font-medium" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    <MessageCircle className="mr-2 h-5 w-5" />
                    Enviar Código por WhatsApp
                  </Button>
                </form>

                <div className="bg-muted/30 rounded-lg p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    <strong>Demo:</strong> Use "jlopez" para simular envío a +54 9 11 ***2-1098
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Verify Code */}
          {step === 'verify-code' && (
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <div className="flex items-center justify-center mb-4">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setStep('forgot-password')}
                    className="absolute left-4"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-xl">Verificar Código</CardTitle>
                </div>
                <CardDescription>
                  Ingrese el código de 6 dígitos que recibió por WhatsApp en {phoneNumber}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleVerifyCode} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-sm font-medium">Código de Verificación</Label>
                    <Input
                      id="code"
                      type="text"
                      value={resetData.code}
                      onChange={(e) => setResetData(prev => ({ ...prev, code: e.target.value.replace(/[^0-9]/g, '') }))}
                      required
                      className="h-14 text-center text-2xl tracking-widest font-mono"
                      placeholder="123456"
                      maxLength={6}
                      pattern="[0-9]{6}"
                    />
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {success && (
                    <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                      <MessageCircle className="h-4 w-4 text-green-600" />
                      <AlertDescription className="text-green-700 dark:text-green-400">
                        {success}
                      </AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-14 text-base font-medium" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Verificar Código
                  </Button>
                </form>

                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">¿No recibiste el código?</p>
                  <Button 
                    variant="outline" 
                    onClick={handleResendCode}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Clock className="mr-2 h-4 w-4" />
                    Reenviar código
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Si no recibe el código, reintente o contacte a la guardia
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* New Password */}
          {step === 'new-password' && (
            <Card className="shadow-lg">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-xl">Establecer Nueva Contraseña</CardTitle>
                <CardDescription>
                  Ingrese su nueva contraseña para completar la recuperación
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleNewPassword} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-sm font-medium">Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="new-password"
                        type={showNewPassword ? "text" : "password"}
                        value={resetData.newPassword}
                        onChange={(e) => setResetData(prev => ({ ...prev, newPassword: e.target.value }))}
                        required
                        className="h-12 px-4 pr-12"
                        placeholder="Mínimo 6 caracteres"
                        minLength={6}
                      />
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-sm font-medium">Confirmar Nueva Contraseña</Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        value={resetData.confirmPassword}
                        onChange={(e) => setResetData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                        required
                        className="h-12 px-4 pr-12"
                        placeholder="Confirme su contraseña"
                        minLength={6}
                      />
                      <Button 
                        type="button" 
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 hover:bg-transparent"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4 text-muted-foreground" /> : <Eye className="w-4 h-4 text-muted-foreground" />}
                      </Button>
                    </div>
                  </div>
                  
                  {error && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" className="w-full h-14 text-base font-medium" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                    Cambiar Contraseña
                  </Button>
                </form>

                <div className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground text-center">
                    La contraseña debe tener al menos 6 caracteres para mayor seguridad
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Success */}
          {step === 'success' && (
            <Card className="shadow-lg">
              <CardContent className="text-center py-8">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">¡Contraseña Cambiada!</h3>
                <p className="text-muted-foreground mb-4">
                  Su contraseña ha sido actualizada exitosamente.
                </p>
                <p className="text-sm text-muted-foreground">
                  Redirigiendo al inicio de sesión...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Footer */}
          <div className="text-center text-xs text-muted-foreground space-y-2">
            <p>© 2024 Municipio de Moreno - Defensa Civil</p>
            <p>Para soporte técnico contacte a la guardia: <strong>+54 11 4629-2200</strong></p>
          </div>
        </div>
      </div>
    </div>
  );
}
