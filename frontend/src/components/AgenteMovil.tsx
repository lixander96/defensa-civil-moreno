import { useState, useEffect } from 'react';
import { 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Camera, 
  Navigation, 
  AlertCircle, 
  Wifi, 
  WifiOff, 
  Route,
  User,
  Phone,
  Flame,
  ArrowRight,
  Plus,
  Sun,
  Moon
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Textarea } from './ui/textarea';
import { Alert, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';
import { getStatusColor, getStatusLabel, getPriorityColor } from '../lib/utils';
import { useTheme } from '../hooks/useTheme';

// Datos ficticios específicos para agente de campo
const mockAgenteReclamos = [
  {
    id: '2345',
    number: '2345',
    type: 'incendio',
    title: 'Incendio en Barrio Las Flores',
    description: 'Incendio reportado en vivienda unifamiliar. Humo visible desde varias cuadras.',
    address: 'Av. San Martín 1234, Barrio Las Flores, Moreno',
    priority: 'alta',
    status: 'en_camino',
    assignedTo: 'agent-1',
    denunciante: {
      name: 'María González',
      phone: '+54 11 2345-6789'
    },
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 minutos atrás
    estimatedArrival: '8 min',
    distance: '2.3 km'
  },
  {
    id: '2346',
    number: '2346',
    type: 'poste_caido',
    title: 'Poste de luz caído',
    description: 'Poste eléctrico caído bloqueando la calle principal.',
    address: 'Calle Rivadavia esq. Belgrano, Centro, Moreno',
    priority: 'media',
    status: 'verificado',
    assignedTo: 'agent-1',
    denunciante: {
      name: 'Juan Pérez',
      phone: '+54 11 3456-7890'
    },
    createdAt: new Date(Date.now() - 45 * 60 * 1000), // 45 minutos atrás
    evidenceUploaded: true
  }
];

const mockReclamosCercanos = [
  {
    id: '2347',
    number: '2347',
    type: 'fuga_gas',
    title: 'Fuga de gas en cocina',
    description: 'Fuerte olor a gas en edificio de departamentos.',
    address: 'Libertad 567, Barrio Norte, Moreno',
    priority: 'alta',
    status: 'derivado',
    assignedTo: null,
    denunciante: {
      name: 'Ana Martínez',
      phone: '+54 11 4567-8901'
    },
    createdAt: new Date(Date.now() - 5 * 60 * 1000), // 5 minutos atrás
    distance: '1.8 km'
  }
];

const getReclamoTypeInfo = (type: string) => {
  const types = {
    incendio: { icon: '🔥', label: 'Incendio', color: 'text-red-600 bg-red-100 dark:bg-red-900/20' },
    poste_caido: { icon: '⚡', label: 'Poste Caído', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20' },
    fuga_gas: { icon: '💨', label: 'Fuga de Gas', color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/20' },
    inundacion: { icon: '🌊', label: 'Inundación', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20' },
    otro: { icon: '📋', label: 'Otro', color: 'text-gray-600 bg-gray-100 dark:bg-gray-900/20' }
  };
  return types[type as keyof typeof types] || types.otro;
};

export function AgenteMovil() {
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [selectedReclamo, setSelectedReclamo] = useState<any>(null);
  const [evidence, setEvidence] = useState('');
  const [activeView, setActiveView] = useState<'asignados' | 'cercanos'>('asignados');
  const { theme, toggleTheme } = useTheme();

  // Simular detección de conectividad
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addToOfflineQueue = (action: any) => {
    setOfflineQueue(prev => [...prev, { ...action, timestamp: Date.now() }]);
  };

  const handleAsignarme = (reclamo: any) => {
    if (!isOnline) {
      addToOfflineQueue({ action: 'assign', reclamoId: reclamo.id, title: reclamo.title });
      return;
    }
    console.log('Asignándome reclamo:', reclamo.id);
  };

  const handleLlegue = (reclamo: any) => {
    if (!isOnline) {
      addToOfflineQueue({ action: 'arrived', reclamoId: reclamo.id, title: reclamo.title });
      return;
    }
    console.log('Llegué al reclamo:', reclamo.id);
  };

  const handleSubirEvidencia = () => {
    if (!evidence.trim() || !selectedReclamo) return;
    
    if (!isOnline) {
      addToOfflineQueue({ 
        action: 'evidence', 
        reclamoId: selectedReclamo.id, 
        title: selectedReclamo.title,
        evidence: evidence 
      });
      setEvidence('');
      setSelectedReclamo(null);
      return;
    }
    
    console.log('Subiendo evidencia para:', selectedReclamo.id, evidence);
    setEvidence('');
    setSelectedReclamo(null);
  };

  const handleCerrar = (reclamo: any) => {
    if (!isOnline) {
      addToOfflineQueue({ action: 'close', reclamoId: reclamo.id, title: reclamo.title });
      return;
    }
    console.log('Cerrando reclamo:', reclamo.id);
  };

  const renderMiniMap = (reclamo: any) => (
    <div className="bg-muted rounded-lg h-24 flex items-center justify-center text-muted-foreground text-sm relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-green-200 to-blue-200 dark:from-green-900 dark:to-blue-900 opacity-30"></div>
      <div className="relative flex items-center gap-2">
        <Route className="h-4 w-4" />
        <span>{reclamo.estimatedArrival || reclamo.distance || 'Calcular ruta'}</span>
      </div>
    </div>
  );

  const renderReclamoCard = (reclamo: any, showAssignButton = false) => {
    const typeInfo = getReclamoTypeInfo(reclamo.type);
    
    return (
      <Card key={reclamo.id} className="mb-4 border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold">#{reclamo.number}</span>
                <Badge variant="outline" className={getPriorityColor(reclamo.priority)}>
                  {reclamo.priority.toUpperCase()}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className={`text-xs ${typeInfo.color}`}>
                  <span className="mr-1">{typeInfo.icon}</span>
                  {typeInfo.label}
                </Badge>
              </div>
            </div>
            <Badge className={getStatusColor(reclamo.status)}>
              {getStatusLabel(reclamo.status)}
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-1">{reclamo.title}</h4>
            <p className="text-sm text-muted-foreground">{reclamo.description}</p>
          </div>

          {/* Información de contacto */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{reclamo.denunciante.name}</span>
              <Separator orientation="vertical" className="h-4" />
              <Phone className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground">{reclamo.denunciante.phone}</span>
            </div>
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              <span className="text-muted-foreground">{reclamo.address}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Hace {Math.floor((Date.now() - reclamo.createdAt.getTime()) / 60000)} min</span>
            </div>
          </div>

          {/* Mini mapa */}
          {!showAssignButton && renderMiniMap(reclamo)}

          {/* Botones de acción grandes */}
          <div className="space-y-2">
            {showAssignButton ? (
              <Button 
                size="lg" 
                onClick={() => handleAsignarme(reclamo)}
                className="w-full h-12 text-base"
              >
                <Navigation className="h-5 w-5 mr-2" />
                Asignarme este reclamo
              </Button>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {reclamo.status === 'en_camino' && (
                  <Button 
                    size="lg" 
                    onClick={() => handleLlegue(reclamo)}
                    className="h-12 text-sm"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Llegué
                  </Button>
                )}
                
                <Button 
                  size="lg" 
                  variant="outline"
                  onClick={() => setSelectedReclamo(reclamo)}
                  className="h-12 text-sm"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  {reclamo.evidenceUploaded ? 'Ver evidencia' : 'Subir evidencia'}
                </Button>
                
                {reclamo.status === 'verificado' && (
                  <Button 
                    size="lg" 
                    variant="secondary"
                    onClick={() => handleCerrar(reclamo)}
                    className="h-12 text-sm col-span-2"
                  >
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Cerrar reclamo
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header fijo */}
      <div className="flex-shrink-0 p-4 border-b bg-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Agente de Campo</h2>
            <p className="text-sm text-muted-foreground">Gestiona reclamos desde el terreno</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
            {isOnline ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
          </div>
        </div>

        {/* Tabs de navegación */}
        <div className="flex bg-muted rounded-lg p-1">
          <Button
            variant={activeView === 'asignados' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('asignados')}
            className="flex-1"
          >
            Mis Reclamos ({mockAgenteReclamos.length})
          </Button>
          <Button
            variant={activeView === 'cercanos' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('cercanos')}
            className="flex-1"
          >
            Cercanos ({mockReclamosCercanos.length})
          </Button>
        </div>
      </div>

      {/* Cola offline */}
      {offlineQueue.length > 0 && (
        <div className="flex-shrink-0 p-4">
          <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-800 dark:text-orange-200">
              <div className="font-medium mb-1">Modo offline activado</div>
              <div className="text-sm">
                {offlineQueue.length} acción{offlineQueue.length > 1 ? 'es' : ''} pendiente{offlineQueue.length > 1 ? 's' : ''} de sincronizar:
                <ul className="mt-1 space-y-1">
                  {offlineQueue.slice(-3).map((item, index) => (
                    <li key={index} className="flex items-center gap-2 text-xs">
                      <div className="w-1 h-1 bg-orange-500 rounded-full"></div>
                      {item.action === 'assign' && 'Asignar reclamo'}
                      {item.action === 'arrived' && 'Marcar llegada'}
                      {item.action === 'evidence' && 'Subir evidencia'}
                      {item.action === 'close' && 'Cerrar reclamo'}
                      {' '} - #{item.reclamoId}
                    </li>
                  ))}
                </ul>
                {offlineQueue.length > 3 && (
                  <div className="text-xs mt-1">y {offlineQueue.length - 3} más...</div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Contenido principal con scroll */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 pb-6">
          {activeView === 'asignados' ? (
            <div>
              {mockAgenteReclamos.length > 0 ? (
                mockAgenteReclamos.map(reclamo => renderReclamoCard(reclamo))
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <CheckCircle2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sin reclamos asignados</h3>
                    <p className="text-muted-foreground mb-4">
                      Revisa los reclamos cercanos para asignarte uno
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={() => setActiveView('cercanos')}
                    >
                      Ver reclamos cercanos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <div>
              {mockReclamosCercanos.length > 0 ? (
                mockReclamosCercanos.map(reclamo => renderReclamoCard(reclamo, true))
              ) : (
                <Card className="text-center py-12">
                  <CardContent>
                    <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Sin reclamos cercanos</h3>
                    <p className="text-muted-foreground">
                      Todos los reclamos de tu zona están asignados
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de evidencia */}
      {selectedReclamo && (
        <div className="fixed inset-0 bg-black/50 flex items-end md:items-center justify-center p-0 md:p-4 z-50">
          <Card className="w-full md:max-w-md rounded-t-2xl md:rounded-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                {selectedReclamo.evidenceUploaded ? 'Evidencia del reclamo' : 'Subir evidencia'}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                #{selectedReclamo.number} - {selectedReclamo.title}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Descripción de la evidencia</label>
                <Textarea
                  placeholder="Describe lo que encontraste en el lugar..."
                  value={evidence}
                  onChange={(e) => setEvidence(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Tomar foto o video</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" className="h-12">
                    <Camera className="h-4 w-4 mr-2" />
                    Cámara
                  </Button>
                  <Button variant="outline" className="h-12">
                    <Plus className="h-4 w-4 mr-2" />
                    Galería
                  </Button>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedReclamo(null)}
                  className="flex-1 h-12"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleSubirEvidencia}
                  disabled={!evidence.trim()}
                  className="flex-1 h-12"
                >
                  {isOnline ? 'Subir' : 'Guardar offline'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}