import { useEffect, useState } from 'react';
import { Navigate, Outlet, Route, Routes, useNavigate, useParams } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { Conversaciones } from '../components/Conversaciones';
import { ConversacionActiva } from '../components/ConversacionActiva';
import { Reclamos } from '../components/Reclamos';
import { ReclamoDetail } from '../components/ReclamoDetail';
import { Mapa } from '../components/Mapa';
import { Agente } from '../components/Agente';
import { Reportes } from '../components/Reportes';
import { Configuracion } from '../components/Configuracion';
import { CreateReclamoStandalone } from '../components/CreateReclamoStandalone';
import { getWhatsappChat } from '../lib/api';
import { User as UserType } from '../lib/types';

interface AppRoutesProps {
  onLogout: () => void;
  user: UserType | null;
  token: string | null;
}

export function AppRoutes({ onLogout, user, token }: AppRoutesProps) {
  return (
    <Routes>
      <Route element={<Layout onLogout={onLogout} user={user} />}>
        <Route index element={<Navigate to="/conversaciones" replace />} />

        <Route path="conversaciones" element={<Outlet />}>
          <Route index element={<ConversacionesRoute token={token} />} />
          <Route
            path=":conversacionId"
            element={<ConversacionDetalleRoute token={token} />}
          />
          <Route
            path=":conversacionId/nuevo-reclamo"
            element={<CrearReclamoDesdeConversacionRoute token={token} />}
          />
          <Route path="areas/:areaId" element={<ConversacionAreaRoute />} />
        </Route>

        <Route path="reclamos" element={<Outlet />}>
          <Route index element={<ReclamosRoute token={token} />} />
          <Route path="nuevo" element={<CrearReclamoRoute token={token} />} />
          <Route path=":reclamoId" element={<ReclamoDetalleRoute token={token} />} />
        </Route>

        <Route path="mapa" element={<MapaRoute token={token} />} />
        <Route path="reportes" element={<ReportesRoute token={token} />} />
        <Route path="configuracion" element={<Outlet />}>
          <Route index element={<Navigate to="/configuracion/general" replace />} />
          <Route path=":tab" element={<ConfiguracionRoute />} />
        </Route>
        <Route path="mis-reclamos" element={<Agente />} />
        <Route path="agente" element={<Navigate to="/mis-reclamos" replace />} />
        <Route path="*" element={<Navigate to="/conversaciones" replace />} />
      </Route>
    </Routes>
  );
}

interface ConversacionesRouteProps {
  token: string | null;
}

function ConversacionesRoute({ token }: ConversacionesRouteProps) {
  const navigate = useNavigate();

  return (
    <Conversaciones
      token={token}
      onCreateReclamo={(conversationId) =>
        navigate(`/conversaciones/${conversationId}/nuevo-reclamo`)
      }
      onOpenConversation={(conversationId) =>
        navigate(`/conversaciones/${conversationId}`)
      }
    />
  );
}

interface ConversacionDetalleRouteProps {
  token: string | null;
}

function ConversacionDetalleRoute({ token }: ConversacionDetalleRouteProps) {
  const { conversacionId } = useParams<{ conversacionId: string }>();
  const navigate = useNavigate();

  if (!conversacionId) {
    return <Navigate to="/conversaciones" replace />;
  }

  return (
    <ConversacionActiva
      token={token}
      conversationId={conversacionId}
      onBack={() => navigate('/conversaciones')}
      onCreateReclamo={(id) => navigate(`/conversaciones/${id}/nuevo-reclamo`)}
    />
  );
}

function ConversacionAreaRoute() {
  return <Navigate to="/conversaciones" replace />;
}

interface CrearReclamoDesdeConversacionRouteProps {
  token: string | null;
}

function CrearReclamoDesdeConversacionRoute({
  token,
}: CrearReclamoDesdeConversacionRouteProps) {
  const { conversacionId } = useParams<{ conversacionId: string }>();
  const navigate = useNavigate();

  const [prefillData, setPrefillData] = useState<
    | {
        conversationId?: string;
        denuncianteName?: string;
        denunciantePhone?: string;
      }
    | undefined
  >(undefined);

  useEffect(() => {
    if (!token || !conversacionId) {
      setPrefillData(undefined);
      return;
    }

    let cancelled = false;

    const loadConversation = async () => {
      try {
        const chat = await getWhatsappChat(token, conversacionId);
        if (!cancelled) {
          setPrefillData({
            conversationId: chat.id,
            denuncianteName: chat.displayName,
            denunciantePhone: chat.number ?? undefined,
          });
        }
      } catch (error) {
        console.error('Failed to load WhatsApp conversation for prefill', error);
        if (!cancelled) {
          setPrefillData({
            conversationId: conversacionId,
          });
        }
      }
    };

    void loadConversation();

    return () => {
      cancelled = true;
    };
  }, [token, conversacionId]);

  if (!conversacionId) {
    return <Navigate to="/conversaciones" replace />;
  }

  const fallback = `/conversaciones/${conversacionId}`;

  return (
    <CreateReclamoStandalone
      token={token}
      prefilledData={prefillData}
      onCancel={() => navigate(fallback)}
      onReclamoCreated={() => navigate('/reclamos')}
    />
  );
}

interface ReclamosRouteProps {
  token: string | null;
}

interface MapaRouteProps {
  token: string | null;
}

function MapaRoute({ token }: MapaRouteProps) {
  const navigate = useNavigate();

  return (
    <Mapa
      token={token}
      onViewReclamo={(reclamo) => navigate(`/reclamos/${reclamo.id}`)}
    />
  );
}

interface ReportesRouteProps {
  token: string | null;
}

function ReportesRoute({ token }: ReportesRouteProps) {
  return <Reportes token={token} />;
}

function ReclamosRoute({ token }: ReclamosRouteProps) {
  const navigate = useNavigate();

  return (
    <Reclamos
      token={token}
      onViewReclamo={(reclamo) => navigate(`/reclamos/${reclamo.id}`)}
    />
  );
}

interface ReclamoDetalleRouteProps {
  token: string | null;
}

function ReclamoDetalleRoute({ token }: ReclamoDetalleRouteProps) {
  const { reclamoId } = useParams<{ reclamoId: string }>();
  const navigate = useNavigate();

  if (!reclamoId) {
    return <Navigate to="/reclamos" replace />;
  }

  return (
    <ReclamoDetail
      token={token}
      reclamoId={reclamoId}
      onBack={() => navigate('/reclamos')}
      onOpenConversation={(conversationId) =>
        navigate(`/conversaciones/${conversationId}`)
      }
      onOpenAreaConversation={(areaId) =>
        navigate(`/conversaciones/areas/${areaId}`)
      }
    />
  );
}

interface CrearReclamoRouteProps {
  token: string | null;
}

function CrearReclamoRoute({ token }: CrearReclamoRouteProps) {
  const navigate = useNavigate();

  return (
    <CreateReclamoStandalone
      token={token}
      onCancel={() => navigate('/reclamos')}
      onReclamoCreated={() => navigate('/reclamos')}
    />
  );
}

const CONFIG_TABS = new Set([
  'general',
  'usuarios',
  'incidentes',
  'areas',
  'whatsapp',
  'notificaciones',
  'sistema',
]);

function ConfiguracionRoute() {
  const { tab } = useParams<{ tab?: string }>();
  const navigate = useNavigate();
  const normalizedTab = tab ?? 'general';

  if (!CONFIG_TABS.has(normalizedTab)) {
    return <Navigate to="/configuracion/general" replace />;
  }

  return (
    <Configuracion
      activeTab={normalizedTab}
      onTabChange={(value) => navigate(`/configuracion/${value}`)}
    />
  );
}
