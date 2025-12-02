import { useState, useEffect, useMemo } from 'react';
import { MessageCircle, Phone, User, Users, Search, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { mockDerivationAreas } from '../lib/mock-data';
import { WhatsAppContact } from '../lib/types';
import { toast } from 'sonner@2.0.3';

interface CreateConversacionDialogProps {
  onCreateConversation: (phone: string, name?: string) => void;
}

export function CreateConversacionDialog({ onCreateConversation }: CreateConversacionDialogProps) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Obtener todos los contactos de áreas
  const areaContacts = useMemo(() => {
    return mockDerivationAreas
      .filter(area => area.active)
      .flatMap(area => 
        area.whatsappContacts
          ?.filter(contact => contact.active)
          .map(contact => ({
            ...contact,
            areaName: area.name,
            areaIcon: area.icon,
            areaColor: area.color
          })) || []
      );
  }, []);

  // Filtrar contactos
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return areaContacts;
    const searchLower = searchTerm.toLowerCase();
    return areaContacts.filter(contact => 
      contact.name.toLowerCase().includes(searchLower) ||
      contact.phone.includes(searchTerm) ||
      contact.areaName.toLowerCase().includes(searchLower) ||
      contact.description?.toLowerCase().includes(searchLower)
    );
  }, [areaContacts, searchTerm]);

  const handleSubmitManual = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!phone.trim()) {
      toast.error('Por favor ingresa un número de teléfono');
      return;
    }

    // Validar formato de teléfono básico
    const phoneRegex = /^[\d\s\+\-\(\)]+$/;
    if (!phoneRegex.test(phone)) {
      toast.error('Formato de teléfono inválido');
      return;
    }

    onCreateConversation(phone, name || undefined);
    setOpen(false);
    setPhone('');
    setName('');
    toast.success('Conversación creada exitosamente');
  };

  const handleSelectContact = (contact: WhatsAppContact & { areaName: string }) => {
    onCreateConversation(contact.phone, contact.name);
    setOpen(false);
    setSearchTerm('');
    toast.success(`Conversación iniciada con ${contact.name}`);
  };

  const formatPhoneNumber = (phone: string) => {
    // Formato visual para números argentinos
    return phone.replace(/(\+54)(\d{2})(\d{4})(\d+)/, '$1 $2 $3-$4');
  };

  const formContent = (
    <Tabs defaultValue="manual" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="manual">
          <Phone className="h-4 w-4 mr-2" />
          Manual
        </TabsTrigger>
        <TabsTrigger value="areas">
          <Users className="h-4 w-4 mr-2" />
          Contactos de Áreas
        </TabsTrigger>
      </TabsList>

      {/* Manual Tab */}
      <TabsContent value="manual" className="space-y-4 mt-4">
        <form onSubmit={handleSubmitManual} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">
              Número de Teléfono <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="+54 9 11 1234-5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="pl-10"
                required
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Incluye el código de país (ej: +54 para Argentina)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Nombre (Opcional)</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                type="text"
                placeholder="Nombre del contacto"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setOpen(false);
                setPhone('');
                setName('');
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              <MessageCircle className="h-4 w-4 mr-2" />
              Crear Conversación
            </Button>
          </div>
        </form>
      </TabsContent>

      {/* Areas Tab */}
      <TabsContent value="areas" className="space-y-4 mt-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, área o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
          )}
        </div>

        {/* Contacts List */}
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact) => (
              <Card
                key={contact.id}
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-primary"
                onClick={() => handleSelectContact(contact)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-2">
                      {/* Name */}
                      <div className="flex items-center gap-2">
                        <span className="text-base font-medium">{contact.name}</span>
                      </div>

                      {/* Area Badge */}
                      <Badge
                        variant="secondary"
                        className={`text-xs ${contact.areaColor}`}
                      >
                        <span className="mr-1">{contact.areaIcon}</span>
                        {contact.areaName}
                      </Badge>

                      {/* Description */}
                      {contact.description && (
                        <p className="text-sm text-muted-foreground">
                          {contact.description}
                        </p>
                      )}

                      {/* Phone */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        <span className="font-mono">{formatPhoneNumber(contact.phone)}</span>
                      </div>
                    </div>

                    <Button size="sm" variant="ghost">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">
                {searchTerm
                  ? 'No se encontraron contactos'
                  : 'No hay contactos disponibles'}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2 pt-2 border-t">
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSearchTerm('');
            }}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </TabsContent>
    </Tabs>
  );

  // Mobile: usar Sheet
  if (isMobile) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button size="sm" variant="outline">
            <MessageCircle className="h-4 w-4 mr-2" />
            Nueva
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader>
            <SheetTitle>Nueva Conversación</SheetTitle>
            <SheetDescription>
              Inicia una conversación con un número manual o selecciona un contacto de área
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-4 pb-4 overflow-y-auto">
            {formContent}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: usar Dialog
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <MessageCircle className="h-4 w-4 mr-2" />
          Nueva
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Nueva Conversación</DialogTitle>
          <DialogDescription>
            Inicia una conversación con un número manual o selecciona un contacto de área
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          {formContent}
        </div>
      </DialogContent>
    </Dialog>
  );
}
