import { useCallback, useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { CreateReclamoForm } from './CreateReclamoForm';
import { DerivationArea, IncidentType, Reclamo } from '../lib/types';
import { getAreas, getComplaintTypes } from '../lib/api';

interface CreateReclamoStandaloneProps {
  token: string | null;
  onReclamoCreated?: (reclamo: Reclamo) => void;
  onCancel?: () => void;
  prefilledData?: {
    denuncianteName?: string;
    denunciantePhone?: string;
    conversationId?: string;
  };
}

export function CreateReclamoStandalone({
  token,
  onReclamoCreated,
  onCancel,
  prefilledData,
}: CreateReclamoStandaloneProps) {
  const [incidentTypes, setIncidentTypes] = useState<IncidentType[]>([]);
  const [derivationAreas, setDerivationAreas] = useState<DerivationArea[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadCatalogs = useCallback(async () => {
    if (!token) {
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [typesResponse, areasResponse] = await Promise.all([
        getComplaintTypes(token),
        getAreas(token),
      ]);

      setIncidentTypes(typesResponse);
      setDerivationAreas(
        areasResponse.map((area) => ({
          id: String(area.id),
          name: area.name,
          description: '',
          whatsappContacts: [],
          active: area.isVisible ?? true,
          color: '',
          icon: '',
        })),
      );
    } catch (error) {
      setErrorMessage('No se pudieron cargar los datos necesarios');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!token) {
      setIncidentTypes([]);
      setDerivationAreas([]);
      return;
    }
    loadCatalogs();
  }, [token, loadCatalogs]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onCancel} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-xl font-semibold">Registrar nuevo reclamo</h1>
      </div>

      <Card className="flex-1">
        <CardContent className="pt-6">
          {token === null ? (
            <div className="text-sm text-muted-foreground">
              No hay una sesion activa. Inicia sesion para crear reclamos.
            </div>
          ) : isLoading ? (
            <div className="text-sm text-muted-foreground">
              Cargando informacion...
            </div>
          ) : errorMessage ? (
            <div className="text-sm text-destructive">{errorMessage}</div>
          ) : (
            <CreateReclamoForm
              token={token}
              incidentTypes={incidentTypes}
              derivationAreas={derivationAreas}
              prefilledData={prefilledData}
              onReclamoCreated={onReclamoCreated}
              onCancel={onCancel}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
