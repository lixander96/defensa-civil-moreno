import { Conversaciones } from './Conversaciones';

interface ConversacionActivaProps {
  token: string | null;
  conversationId: string;
  onBack: () => void;
  onCreateReclamo?: (conversationId: string) => void;
}

export function ConversacionActiva({
  token,
  conversationId,
  onBack,
  onCreateReclamo,
}: ConversacionActivaProps) {
  const handleCreateReclamo = (id: string) => {
    if (onCreateReclamo) {
      onCreateReclamo(id);
    }
  };

  return (
    <Conversaciones
      token={token}
      activeConversationId={conversationId}
      onCloseStandalone={onBack}
      onCreateReclamo={handleCreateReclamo}
    />
  );
}
