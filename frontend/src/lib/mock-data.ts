import { User, Denunciante, Reclamo, Conversation, Message, KPI, DerivationArea, IncidentType, WhatsAppContact } from './types';

export const mockUsers: User[] = [
  {
    id: '1',
    username: 'operador1',
    name: 'Ana Garcia',
    firstName: 'Ana',
    lastName: 'Garcia',
    role: 'OPERATOR',
    phone: '+541234567890'
  },
  {
    id: '2',
    username: 'agente1',
    name: 'Carlos Rodriguez',
    firstName: 'Carlos',
    lastName: 'Rodriguez',
    role: 'OPERATOR',
    phone: '+541234567891'
  },
  {
    id: '3',
    username: 'admin1',
    name: 'Maria Lopez',
    firstName: 'Maria',
    lastName: 'Lopez',
    role: 'ADMIN',
    phone: '+541234567892'
  },
  {
    id: '4',
    username: 'jlopez',
    name: 'Juan Lopez',
    firstName: 'Juan',
    lastName: 'Lopez',
    role: 'MANAGER',
    phone: '+54 9 11 5432-1098'
  }
];

export const mockDenunciantes: Denunciante[] = [
  {
    id: '1',
    name: 'Juan Pérez',
    phone: '+541123456789',
    address: 'Av. Libertador 1234, Moreno'
  },
  {
    id: '2',
    name: 'María González',
    phone: '+541123456790',
    address: 'Calle San Martín 567, La Reja'
  },
  {
    id: '3',
    name: 'Roberto Silva',
    phone: '+541123456791',
    address: 'Av. Perón 890, Francisco Álvarez'
  },
  {
    id: '4',
    name: 'Ana Martínez',
    phone: '+541123456792',
    address: 'Calle Belgrano 345, Cuartel V'
  },
  {
    id: '5',
    name: 'Diego Fernández',
    phone: '+541123456793',
    address: 'Av. Eva Perón 678, Paso del Rey'
  }
];

export const mockReclamos: Reclamo[] = [
  {
    id: '1',
    number: 'DC-2024-001',
    type: 'incendio',
    description: 'Incendio en baldío con riesgo de propagación a viviendas',
    denunciante: mockDenunciantes[0],
    address: 'Av. Libertador 1234, Moreno',
    location: { lat: -34.649023, lng: -58.788994 },
    status: 'abierto',
    priority: 'alta',
    derivedTo: 'bomberos',
    createdAt: new Date('2024-01-15T10:30:00'),
    updatedAt: new Date('2024-01-15T10:35:00'),
    attachments: [],
    timeline: [
      {
        id: '1',
        type: 'created',
        description: 'Reclamo creado desde conversación WhatsApp',
        user: 'Ana García',
        timestamp: new Date('2024-01-15T10:30:00')
      },
      {
        id: '2',
        type: 'derived',
        description: 'Derivado a Bomberos Voluntarios',
        user: 'Ana García',
        timestamp: new Date('2024-01-15T10:35:00')
      }
    ]
  },
  {
    id: '2',
    number: 'DC-2024-002',
    type: 'poste_caido',
    description: 'Poste de luz caído bloqueando la calle completamente',
    denunciante: mockDenunciantes[1],
    address: 'Calle San Martín 567, La Reja',
    location: { lat: -34.643125, lng: -58.795678 },
    status: 'en_camino',
    priority: 'alta',
    assignedTo: '2',
    derivedTo: 'edenor',
    createdAt: new Date('2024-01-15T09:15:00'),
    updatedAt: new Date('2024-01-15T09:45:00'),
    attachments: [],
    timeline: [
      {
        id: '3',
        type: 'created',
        description: 'Reclamo creado',
        user: 'Ana García',
        timestamp: new Date('2024-01-15T09:15:00')
      },
      {
        id: '4',
        type: 'derived',
        description: 'Derivado a EDENOR',
        user: 'Ana García',
        timestamp: new Date('2024-01-15T09:20:00')
      },
      {
        id: '5',
        type: 'assigned',
        description: 'Asignado a Carlos Rodríguez',
        user: 'Ana García',
        timestamp: new Date('2024-01-15T09:30:00')
      },
      {
        id: '6',
        type: 'in_route',
        description: 'Agente en camino al lugar',
        user: 'Carlos Rodríguez',
        timestamp: new Date('2024-01-15T09:45:00')
      }
    ]
  },
  {
    id: '3',
    number: 'DC-2024-003',
    type: 'inundacion',
    description: 'Anegamiento en calle por rotura de caño maestro',
    denunciante: mockDenunciantes[2],
    address: 'Av. Perón 890, Francisco Álvarez',
    location: { lat: -34.651234, lng: -58.782345 },
    status: 'verificado',
    priority: 'media',
    assignedTo: '2',
    derivedTo: 'municipalidad',
    createdAt: new Date('2024-01-14T16:20:00'),
    updatedAt: new Date('2024-01-15T08:30:00'),
    attachments: [],
    timeline: [
      {
        id: '7',
        type: 'created',
        description: 'Reclamo creado',
        user: 'Ana García',
        timestamp: new Date('2024-01-14T16:20:00')
      },
      {
        id: '8',
        type: 'derived',
        description: 'Derivado a Municipalidad',
        user: 'Ana García',
        timestamp: new Date('2024-01-14T16:25:00')
      },
      {
        id: '9',
        type: 'assigned',
        description: 'Asignado a Carlos Rodríguez',
        user: 'Ana García',
        timestamp: new Date('2024-01-14T17:00:00')
      },
      {
        id: '10',
        type: 'verified',
        description: 'Situación verificada en campo',
        user: 'Carlos Rodríguez',
        timestamp: new Date('2024-01-15T08:30:00')
      }
    ]
  },
  {
    id: '4',
    number: 'DC-2024-004',
    type: 'fuga_gas',
    description: 'Fuerte olor a gas en zona residencial',
    denunciante: mockDenunciantes[3],
    address: 'Calle Belgrano 345, Cuartel V',
    location: { lat: -34.656789, lng: -58.776543 },
    status: 'cerrado',
    priority: 'alta',
    assignedTo: '2',
    derivedTo: 'bomberos',
    createdAt: new Date('2024-01-13T14:10:00'),
    updatedAt: new Date('2024-01-13T18:45:00'),
    attachments: [],
    timeline: [
      {
        id: '11',
        type: 'created',
        description: 'Reclamo creado',
        user: 'Ana García',
        timestamp: new Date('2024-01-13T14:10:00')
      },
      {
        id: '12',
        type: 'derived',
        description: 'Derivado a Bomberos Voluntarios',
        user: 'Ana García',
        timestamp: new Date('2024-01-13T14:12:00')
      },
      {
        id: '13',
        type: 'assigned',
        description: 'Asignado a Carlos Rodríguez',
        user: 'Ana García',
        timestamp: new Date('2024-01-13T14:15:00')
      },
      {
        id: '14',
        type: 'verified',
        description: 'Verificado - fuga reparada',
        user: 'Carlos Rodríguez',
        timestamp: new Date('2024-01-13T17:30:00')
      },
      {
        id: '15',
        type: 'closed',
        description: 'Reclamo cerrado exitosamente',
        user: 'Carlos Rodríguez',
        timestamp: new Date('2024-01-13T18:45:00')
      }
    ]
  },
  // Nuevos reclamos específicos 1001-1005
  {
    id: '1001',
    number: '1001',
    type: 'incendio',
    description: 'Incendio forestal en Barrio San José con riesgo de propagación a viviendas cercanas',
    denunciante: {
      id: '1001',
      name: 'María López',
      phone: '+54 9 11 5432-1098',
      address: 'Barrio San José, Moreno'
    },
    address: 'Calle Belgrano 2400, Barrio San José, Moreno',
    location: { lat: -34.6532, lng: -58.7876 },
    status: 'nuevo',
    priority: 'alta',
    derivedTo: 'bomberos',
    assignedTo: '2',
    createdAt: new Date('2024-12-19T14:30:00'),
    updatedAt: new Date('2024-12-19T15:45:00'),
    attachments: [],
    timeline: [
      {
        id: '101',
        type: 'created',
        description: 'Reclamo creado desde conversación WhatsApp',
        user: 'Jorge López',
        timestamp: new Date('2024-12-19T14:30:00')
      },
      {
        id: '102',
        type: 'derived',
        description: 'Derivado a Bomberos Voluntarios',
        user: 'Jorge López',
        timestamp: new Date('2024-12-19T14:35:00')
      }
    ]
  },
  {
    id: '1002',
    number: '1002',
    type: 'poste_caido',
    description: 'Poste de energía eléctrica caído por tormenta obstruyendo completamente la vía pública',
    denunciante: {
      id: '1002',
      name: 'Carlos Mendoza',
      phone: '+54 9 11 4567-8901',
      address: 'Villa Trujui, Moreno'
    },
    address: 'Av. Presidente Perón 1850, Villa Trujui, Moreno',
    location: { lat: -34.6221, lng: -58.7789 },
    status: 'derivado',
    priority: 'alta',
    derivedTo: 'edenor',
    assignedTo: '3',
    createdAt: new Date('2024-12-19T08:15:00'),
    updatedAt: new Date('2024-12-19T09:30:00'),
    attachments: [],
    timeline: [
      {
        id: '103',
        type: 'created',
        description: 'Reclamo creado por llamada telefónica',
        user: 'Ana García',
        timestamp: new Date('2024-12-19T08:15:00')
      },
      {
        id: '104',
        type: 'derived',
        description: 'Derivado a EDENOR para reparación',
        user: 'Ana García',
        timestamp: new Date('2024-12-19T08:45:00')
      },
      {
        id: '105',
        type: 'assigned',
        description: 'Asignado a Miguel López',
        user: 'Ana García',
        timestamp: new Date('2024-12-19T09:30:00')
      }
    ]
  },
  {
    id: '1003',
    number: '1003',
    type: 'inundacion',
    description: 'Inundación severa en zona residencial por desborde de zanja pluvial',
    denunciante: {
      id: '1003',
      name: 'Ana Rodríguez',
      phone: '+54 9 11 2345-6789',
      address: 'Cuartel V, Moreno'
    },
    address: 'Calle Las Flores 567, Cuartel V, Moreno',
    location: { lat: -34.6598, lng: -58.7654 },
    status: 'enviado',
    priority: 'media',
    derivedTo: 'municipalidad',
    assignedTo: '2',
    createdAt: new Date('2024-12-18T22:45:00'),
    updatedAt: new Date('2024-12-19T07:20:00'),
    attachments: [],
    timeline: [
      {
        id: '106',
        type: 'created',
        description: 'Reclamo creado por WhatsApp',
        user: 'Jorge López',
        timestamp: new Date('2024-12-18T22:45:00')
      },
      {
        id: '107',
        type: 'derived',
        description: 'Derivado a Municipalidad - Obras Públicas',
        user: 'Jorge López',
        timestamp: new Date('2024-12-19T06:00:00')
      },
      {
        id: '108',
        type: 'assigned',
        description: 'Asignado a Carlos Rodríguez',
        user: 'Ana García',
        timestamp: new Date('2024-12-19T07:20:00')
      }
    ]
  },
  {
    id: '1004',
    number: '1004',
    type: 'fuga_gas',
    description: 'Escape de gas natural en la vía pública con fuerte olor detectado por vecinos',
    denunciante: {
      id: '1004',
      name: 'Roberto Silva',
      phone: '+54 9 11 8765-4321',
      address: 'Paso del Rey, Moreno'
    },
    address: 'Av. Eva Perón 890, Paso del Rey, Moreno',
    location: { lat: -34.6445, lng: -58.7532 },
    status: 'verificado',
    priority: 'alta',
    derivedTo: 'bomberos',
    assignedTo: '4',
    createdAt: new Date('2024-12-17T16:20:00'),
    updatedAt: new Date('2024-12-18T10:15:00'),
    attachments: [],
    timeline: [
      {
        id: '109',
        type: 'created',
        description: 'Reclamo creado por múltiples llamadas',
        user: 'Ana García',
        timestamp: new Date('2024-12-17T16:20:00')
      },
      {
        id: '110',
        type: 'derived',
        description: 'Derivado a Bomberos - Emergencia química',
        user: 'Ana García',
        timestamp: new Date('2024-12-17T16:25:00')
      },
      {
        id: '111',
        type: 'assigned',
        description: 'Asignado a Juan Martínez',
        user: 'Ana García',
        timestamp: new Date('2024-12-17T17:00:00')
      },
      {
        id: '112',
        type: 'verified',
        description: 'Situación verificada - escape controlado',
        user: 'Juan Martínez',
        timestamp: new Date('2024-12-18T10:15:00')
      }
    ]
  },
  {
    id: '1005',
    number: '1005',
    type: 'otro',
    description: 'Árbol de gran porte caído sobre calzada bloqueando el tránsito vehicular',
    denunciante: {
      id: '1005',
      name: 'Lucía Fernández',
      phone: '+54 9 11 9876-5432',
      address: 'Francisco Álvarez, Moreno'
    },
    address: 'Calle San Martín 1234, Francisco Álvarez, Moreno',
    location: { lat: -34.6321, lng: -58.7998 },
    status: 'cerrado',
    priority: 'baja',
    derivedTo: 'municipalidad',
    assignedTo: '3',
    createdAt: new Date('2024-12-16T11:30:00'),
    updatedAt: new Date('2024-12-17T14:45:00'),
    attachments: [],
    timeline: [
      {
        id: '113',
        type: 'created',
        description: 'Reclamo creado presencialmente',
        user: 'María López',
        timestamp: new Date('2024-12-16T11:30:00')
      },
      {
        id: '114',
        type: 'derived',
        description: 'Derivado a Municipalidad - Espacios Verdes',
        user: 'María López',
        timestamp: new Date('2024-12-16T12:00:00')
      },
      {
        id: '115',
        type: 'assigned',
        description: 'Asignado a Miguel López',
        user: 'Ana García',
        timestamp: new Date('2024-12-16T14:30:00')
      },
      {
        id: '116',
        type: 'verified',
        description: 'Árbol removido exitosamente',
        user: 'Miguel López',
        timestamp: new Date('2024-12-17T10:20:00')
      },
      {
        id: '117',
        type: 'closed',
        description: 'Reclamo cerrado - Problema resuelto',
        user: 'Miguel López',
        timestamp: new Date('2024-12-17T14:45:00')
      }
    ]
  }
];

export const mockConversations: Conversation[] = [
  {
    id: '1',
    reclamoId: '1',
    denunciante: mockDenunciantes[0],
    status: 'abierta',
    lastMessage: {
      id: '1',
      conversationId: '1',
      sender: 'denunciante',
      content: '¿Ya enviaron a los bomberos? El fuego se está extendiendo!',
      timestamp: new Date('2024-01-15T10:40:00'),
      type: 'text'
    },
    unreadCount: 1,
    createdAt: new Date('2024-01-15T10:25:00'),
    updatedAt: new Date('2024-01-15T10:40:00')
  },
  {
    id: '2',
    reclamoId: '2',
    denunciante: mockDenunciantes[1],
    status: 'abierta',
    lastMessage: {
      id: '2',
      conversationId: '2',
      sender: 'operador',
      content: 'Ya tenemos un agente en camino. Llegará en aproximadamente 10 minutos.',
      timestamp: new Date('2024-01-15T09:45:00'),
      type: 'text'
    },
    unreadCount: 0,
    createdAt: new Date('2024-01-15T09:10:00'),
    updatedAt: new Date('2024-01-15T09:45:00')
  },
  {
    id: '3',
    denunciante: mockDenunciantes[4],
    status: 'abierta',
    lastMessage: {
      id: '3',
      conversationId: '3',
      sender: 'denunciante',
      content: 'Hola, hay un árbol caído en la calle que no me deja salir de casa',
      timestamp: new Date('2024-01-15T11:15:00'),
      type: 'text'
    },
    unreadCount: 1,
    createdAt: new Date('2024-01-15T11:15:00'),
    updatedAt: new Date('2024-01-15T11:15:00')
  },
  {
    id: '4',
    reclamoId: '3',
    denunciante: mockDenunciantes[2],
    status: 'abierta',
    lastMessage: {
      id: '4',
      conversationId: '4',
      sender: 'denunciante',
      content: 'El agua sigue subiendo en mi cuadra, ¿cuándo van a venir?',
      timestamp: new Date('2024-01-15T08:45:00'),
      type: 'text'
    },
    unreadCount: 2,
    createdAt: new Date('2024-01-14T16:20:00'),
    updatedAt: new Date('2024-01-15T08:45:00')
  },
  {
    id: '5',
    denunciante: {
      id: '6',
      name: 'Carlos Mendoza',
      phone: '+541123456794',
      address: 'Av. Gaona 1245, Castelar'
    },
    status: 'abierta',
    lastMessage: {
      id: '5',
      conversationId: '5',
      sender: 'denunciante',
      content: 'Escucho una fuga de gas muy fuerte en el edificio de al lado',
      timestamp: new Date('2024-01-15T11:30:00'),
      type: 'text'
    },
    unreadCount: 1,
    createdAt: new Date('2024-01-15T11:30:00'),
    updatedAt: new Date('2024-01-15T11:30:00')
  },
  {
    id: '6',
    reclamoId: '4',
    denunciante: mockDenunciantes[3],
    status: 'cerrada',
    lastMessage: {
      id: '6',
      conversationId: '6',
      sender: 'operador',
      content: 'Perfecto, el reclamo ha sido resuelto. Gracias por su paciencia.',
      timestamp: new Date('2024-01-13T18:45:00'),
      type: 'text'
    },
    unreadCount: 0,
    createdAt: new Date('2024-01-13T14:10:00'),
    updatedAt: new Date('2024-01-13T18:45:00')
  },
  {
    id: '7',
    denunciante: {
      id: '7',
      name: 'Lucía Ramírez',
      phone: '+541123456795',
      address: 'Calle Mitre 678, Paso del Rey'
    },
    status: 'cerrada',
    lastMessage: {
      id: '7',
      conversationId: '7',
      sender: 'operador',
      content: 'Conversación cerrada - Problema resuelto',
      timestamp: new Date('2024-01-12T15:20:00'),
      type: 'system'
    },
    unreadCount: 0,
    createdAt: new Date('2024-01-12T10:15:00'),
    updatedAt: new Date('2024-01-12T15:20:00')
  },
  {
    id: '8',
    denunciante: {
      id: '8',
      name: 'Fernando Torres',
      phone: '+541123456796',
      address: 'Av. Libertador 2890, Moreno'
    },
    status: 'abierta',
    lastMessage: {
      id: '8',
      conversationId: '8',
      sender: 'denunciante',
      content: 'Hay humo saliendo de un local comercial',
      timestamp: new Date('2024-01-15T07:20:00'),
      type: 'text'
    },
    unreadCount: 3,
    createdAt: new Date('2024-01-15T07:15:00'),
    updatedAt: new Date('2024-01-15T07:20:00')
  },
  // Conversaciones SIN reclamo asociado - necesitan crear reclamo
  {
    id: '9',
    denunciante: {
      id: '9',
      name: 'Ana Fernández',
      phone: '+54 9 11 2345-6789',
      address: 'La Reja, Moreno'
    },
    status: 'abierta',
    lastMessage: {
      id: '9',
      conversationId: '9',
      sender: 'denunciante',
      content: 'Hay un árbol caído en mi vereda y no puedo salir de casa',
      timestamp: new Date('2024-12-19T16:20:00'),
      type: 'text'
    },
    unreadCount: 1,
    createdAt: new Date('2024-12-19T16:15:00'),
    updatedAt: new Date('2024-12-19T16:20:00')
    // NO tiene reclamoId - necesita crear reclamo
  },
  {
    id: '10',
    denunciante: {
      id: '10',
      name: 'Roberto Silva',
      phone: '+54 9 11 3456-7890',
      address: 'Francisco Álvarez, Moreno'
    },
    status: 'abierta',
    lastMessage: {
      id: '10',
      conversationId: '10',
      sender: 'denunciante',
      content: 'Se rompió un caño de agua en la esquina y hay mucha agua',
      timestamp: new Date('2024-12-19T17:05:00'),
      type: 'text'
    },
    unreadCount: 2,
    createdAt: new Date('2024-12-19T17:00:00'),
    updatedAt: new Date('2024-12-19T17:05:00')
    // NO tiene reclamoId - necesita crear reclamo
  },
  {
    id: '11',
    denunciante: {
      id: '11',
      name: 'Laura Rodríguez',
      phone: '+54 9 11 4567-8901',
      address: 'Centro, Moreno'
    },
    status: 'abierta',
    lastMessage: {
      id: '11',
      conversationId: '11',
      sender: 'denunciante',
      content: 'Hay un cable colgando muy bajo en mi calle, puede ser peligroso',
      timestamp: new Date('2024-12-19T18:15:00'),
      type: 'text'
    },
    unreadCount: 1,
    createdAt: new Date('2024-12-19T18:10:00'),
    updatedAt: new Date('2024-12-19T18:15:00')
    // NO tiene reclamoId - necesita crear reclamo
  }
];

export const mockMessages: Record<string, Message[]> = {
  '1': [
    {
      id: '1',
      conversationId: '1',
      sender: 'denunciante',
      content: 'Hola, hay un incendio en el baldío de al lado de mi casa',
      timestamp: new Date('2024-01-15T10:25:00'),
      type: 'text'
    },
    {
      id: '2',
      conversationId: '1',
      sender: 'operador',
      content: 'Buenos días Juan. Ya registré su reclamo con el número DC-2024-001. ¿Puede darme más detalles sobre la situación?',
      timestamp: new Date('2024-01-15T10:27:00'),
      type: 'text'
    },
    {
      id: '3',
      conversationId: '1',
      sender: 'denunciante',
      content: 'El fuego está creciendo y hay mucho viento. Tengo miedo que se extienda a las casas',
      timestamp: new Date('2024-01-15T10:30:00'),
      type: 'text'
    },
    {
      id: '4',
      conversationId: '1',
      sender: 'operador',
      content: 'Entendido. Ya derivé su reclamo a Bomberos Voluntarios. Están en camino.',
      timestamp: new Date('2024-01-15T10:35:00'),
      type: 'text'
    },
    {
      id: '5',
      conversationId: '1',
      sender: 'denunciante',
      content: '¿Ya enviaron a los bomberos? El fuego se está extendiendo!',
      timestamp: new Date('2024-01-15T10:40:00'),
      type: 'text'
    }
  ],
  '2': [
    {
      id: '6',
      conversationId: '2',
      sender: 'denunciante',
      content: 'Se cayó un poste de luz en mi calle y no se puede pasar',
      timestamp: new Date('2024-01-15T09:10:00'),
      type: 'text'
    },
    {
      id: '7',
      conversationId: '2',
      sender: 'operador',
      content: 'Buenos días María. Registré su reclamo DC-2024-002. ¿La calle está completamente bloqueada?',
      timestamp: new Date('2024-01-15T09:15:00'),
      type: 'text'
    },
    {
      id: '8',
      conversationId: '2',
      sender: 'denunciante',
      content: 'Sí, no pasa ni un auto. Y hay cables en el piso',
      timestamp: new Date('2024-01-15T09:18:00'),
      type: 'text'
    },
    {
      id: '9',
      conversationId: '2',
      sender: 'operador',
      content: 'Ya derivé a EDENOR y asigné un agente. Ya tenemos un agente en camino. Llegará en aproximadamente 10 minutos.',
      timestamp: new Date('2024-01-15T09:45:00'),
      type: 'text'
    }
  ],
  '3': [
    {
      id: '10',
      conversationId: '3',
      sender: 'denunciante',
      content: 'Hola, hay un árbol caído en la calle que no me deja salir de casa',
      timestamp: new Date('2024-01-15T11:15:00'),
      type: 'text'
    }
  ],
  '4': [
    {
      id: '11',
      conversationId: '4',
      sender: 'denunciante',
      content: 'El agua sigue subiendo en mi cuadra, ¿cuándo van a venir?',
      timestamp: new Date('2024-01-15T08:45:00'),
      type: 'text'
    },
    {
      id: '12',
      conversationId: '4',
      sender: 'operador',
      content: 'Buenos días Roberto. Ya registré su reclamo con el número DC-2024-003. ¿Puede darme más detalles sobre la situación?',
      timestamp: new Date('2024-01-15T08:50:00'),
      type: 'text'
    },
    {
      id: '13',
      conversationId: '4',
      sender: 'denunciante',
      content: 'Sí, la calle está inundada y hay agua en los pisos bajas',
      timestamp: new Date('2024-01-15T08:55:00'),
      type: 'text'
    },
    {
      id: '14',
      conversationId: '4',
      sender: 'operador',
      content: 'Entendido. Ya derivé su reclamo a Municipalidad. Están en camino.',
      timestamp: new Date('2024-01-15T09:00:00'),
      type: 'text'
    }
  ],
  '5': [
    {
      id: '15',
      conversationId: '5',
      sender: 'denunciante',
      content: 'Escucho una fuga de gas muy fuerte en el edificio de al lado',
      timestamp: new Date('2024-01-15T11:30:00'),
      type: 'text'
    },
    {
      id: '16',
      conversationId: '5',
      sender: 'operador',
      content: 'Buenos días Carlos. Ya registré su reclamo con el número DC-2024-004. ¿Puede darme más detalles sobre la situación?',
      timestamp: new Date('2024-01-15T11:35:00'),
      type: 'text'
    },
    {
      id: '17',
      conversationId: '5',
      sender: 'denunciante',
      content: 'Sí, el olor es muy fuerte y hay gas en el aire',
      timestamp: new Date('2024-01-15T11:40:00'),
      type: 'text'
    },
    {
      id: '18',
      conversationId: '5',
      sender: 'operador',
      content: 'Entendido. Ya derivé su reclamo a Bomberos Voluntarios. Están en camino.',
      timestamp: new Date('2024-01-15T11:45:00'),
      type: 'text'
    }
  ],
  '6': [
    {
      id: '19',
      conversationId: '6',
      sender: 'operador',
      content: 'Perfecto, el reclamo ha sido resuelto. Gracias por su paciencia.',
      timestamp: new Date('2024-01-13T18:45:00'),
      type: 'text'
    }
  ],
  '7': [
    {
      id: '20',
      conversationId: '7',
      sender: 'operador',
      content: 'Conversación cerrada - Problema resuelto',
      timestamp: new Date('2024-01-12T15:20:00'),
      type: 'system'
    }
  ],
  '8': [
    {
      id: '21',
      conversationId: '8',
      sender: 'denunciante',
      content: 'Hay humo saliendo de un local comercial',
      timestamp: new Date('2024-01-15T07:20:00'),
      type: 'text'
    },
    {
      id: '22',
      conversationId: '8',
      sender: 'operador',
      content: 'Buenos días Fernando. Ya registré su reclamo con el número DC-2024-005. ¿Puede darme más detalles sobre la situación?',
      timestamp: new Date('2024-01-15T07:25:00'),
      type: 'text'
    },
    {
      id: '23',
      conversationId: '8',
      sender: 'denunciante',
      content: 'Sí, el humo es muy denso y hay olor a quemado',
      timestamp: new Date('2024-01-15T07:30:00'),
      type: 'text'
    },
    {
      id: '24',
      conversationId: '8',
      sender: 'operador',
      content: 'Entendido. Ya derivé su reclamo a Bomberos Voluntarios. Están en camino.',
      timestamp: new Date('2024-01-15T07:35:00'),
      type: 'text'
    }
  ],
  // Conversaciones nuevas sin reclamo
  '9': [
    {
      id: '25',
      conversationId: '9',
      sender: 'denunciante',
      content: 'Hola, hay un árbol caído en mi vereda y no puedo salir de casa',
      timestamp: new Date('2024-12-19T16:15:00'),
      type: 'text'
    },
    {
      id: '26',
      conversationId: '9',
      sender: 'operador',
      content: 'Hola Ana, soy Jorge del Centro de Emergencias. ¿El árbol está bloqueando completamente la salida?',
      timestamp: new Date('2024-12-19T16:18:00'),
      type: 'text'
    },
    {
      id: '27',
      conversationId: '9',
      sender: 'denunciante',
      content: 'Sí, cayó justo en la entrada. Es muy grande y no lo puedo mover',
      timestamp: new Date('2024-12-19T16:20:00'),
      type: 'text'
    }
  ],
  '10': [
    {
      id: '28',
      conversationId: '10',
      sender: 'denunciante',
      content: 'Se rompió un caño de agua en la esquina y hay mucha agua',
      timestamp: new Date('2024-12-19T17:00:00'),
      type: 'text'
    },
    {
      id: '29',
      conversationId: '10',
      sender: 'operador',
      content: 'Hola Roberto, entiendo. ¿El agua está llegando a las viviendas?',
      timestamp: new Date('2024-12-19T17:02:00'),
      type: 'text'
    },
    {
      id: '30',
      conversationId: '10',
      sender: 'denunciante',
      content: 'Todavía no, pero está subiendo. Los vecinos están preocupados',
      timestamp: new Date('2024-12-19T17:05:00'),
      type: 'text'
    }
  ],
  '11': [
    {
      id: '31',
      conversationId: '11',
      sender: 'denunciante',
      content: 'Hay un cable colgando muy bajo en mi calle, puede ser peligroso',
      timestamp: new Date('2024-12-19T18:10:00'),
      type: 'text'
    },
    {
      id: '32',
      conversationId: '11',
      sender: 'operador',
      content: 'Hola Laura, gracias por reportar. ¿Es un cable de electricidad?',
      timestamp: new Date('2024-12-19T18:12:00'),
      type: 'text'
    },
    {
      id: '33',
      conversationId: '11',
      sender: 'denunciante',
      content: 'Creo que sí, está muy bajo y los camiones pasan rozando',
      timestamp: new Date('2024-12-19T18:15:00'),
      type: 'text'
    }
  ]
};

export const mockKPIs: KPI = {
  totalReclamos: 156,
  reclamosAbiertos: 12,
  tiempoPromedioRespuesta: 8.5, // minutos
  slaCompliance: 85.3, // porcentaje
  reclamosPorTipo: {
    'incendio': 23,
    'poste_caido': 45,
    'fuga_gas': 18,
    'inundacion': 31,
    'otro': 39
  },
  reclamosPorEstado: {
    'abierto': 12,
    'derivado': 8,
    'en_camino': 5,
    'verificado': 15,
    'cerrado': 116
  }
};

export const mockDerivationAreas: DerivationArea[] = [
  {
    id: 'bomberos',
    name: 'Bomberos Voluntarios',
    description: 'Bomberos Voluntarios de Moreno - Atención de emergencias relacionadas con incendios, fugas de gas, rescates y primeros auxilios',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    icon: '🚒',
    active: true,
    whatsappContacts: [
      {
        id: '1',
        name: 'Juan Carlos Martínez',
        phone: '+5491123456789',
        description: 'Jefe de Bomberos',
        active: true
      },
      {
        id: '2',
        name: 'Roberto Silva',
        phone: '+5491123456790',
        description: 'Oficial de Guardia - Turno Mañana',
        active: true
      },
      {
        id: '3',
        name: 'Diego Fernández',
        phone: '+5491123456791',
        description: 'Oficial de Guardia - Turno Tarde',
        active: true
      },
      {
        id: '4',
        name: 'Central Bomberos',
        phone: '+5491123456792',
        description: 'Central de Emergencias 24hs',
        active: true
      }
    ]
  },
  {
    id: 'policia',
    name: 'Policía Provincial',
    description: 'Policía de la Provincia de Buenos Aires - Seguridad pública y orden',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    icon: '👮',
    active: true,
    whatsappContacts: [
      {
        id: '5',
        name: 'Comisario López',
        phone: '+5491123456793',
        description: 'Comisaría Moreno',
        active: true
      },
      {
        id: '6',
        name: 'Sargento García',
        phone: '+5491123456794',
        description: 'Patrullaje Zona Norte',
        active: true
      },
      {
        id: '7',
        name: 'Oficial Rodríguez',
        phone: '+5491123456795',
        description: 'Patrullaje Zona Sur',
        active: true
      }
    ]
  },
  {
    id: 'edenor',
    name: 'EDENOR',
    description: 'Empresa Distribuidora de Energía Norte - Problemas eléctricos y cortes de energía',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    icon: '⚡',
    active: true,
    whatsappContacts: [
      {
        id: '8',
        name: 'Técnico Martín',
        phone: '+5491123456796',
        description: 'Técnico Zona Moreno',
        active: true
      },
      {
        id: '9',
        name: 'Emergencias EDENOR',
        phone: '+5491123456797',
        description: 'Línea de Emergencias 24hs',
        active: true
      },
      {
        id: '10',
        name: 'Supervisor Castro',
        phone: '+5491123456798',
        description: 'Supervisor Regional',
        active: true
      }
    ]
  },
  {
    id: 'municipalidad',
    name: 'Municipalidad de Moreno',
    description: 'Gobierno Municipal - Espacios públicos, alumbrado, servicios municipales',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    icon: '🏛️',
    active: true,
    whatsappContacts: [
      {
        id: '11',
        name: 'Dir. Espacios Verdes',
        phone: '+5491123456799',
        description: 'Director de Espacios Verdes',
        active: true
      },
      {
        id: '12',
        name: 'Guardia Municipal',
        phone: '+5491123456800',
        description: 'Guardia Municipal 24hs',
        active: true
      },
      {
        id: '13',
        name: 'Obras Públicas',
        phone: '+5491123456801',
        description: 'Secretaría de Obras Públicas',
        active: true
      },
      {
        id: '14',
        name: 'Servicios Urbanos',
        phone: '+5491123456802',
        description: 'Servicios Urbanos y Mantenimiento',
        active: true
      }
    ]
  }
];

export const mockIncidentTypes: IncidentType[] = [
  {
    id: 'incendio',
    name: 'Incendio',
    description: 'Fuego en estructuras, vehículos o espacios abiertos que requiere intervención inmediata de bomberos',
    derivationAreaId: 'bomberos',
    priority: 'alta',
    icon: '🔥',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    active: true,
    autoDerive: true
  },
  {
    id: 'fuga_gas',
    name: 'Fuga de Gas',
    description: 'Escape de gas domiciliario o industrial que presenta riesgo de explosión o intoxicación',
    derivationAreaId: 'bomberos',
    priority: 'alta',
    icon: '💨',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
    active: true,
    autoDerive: true
  },
  {
    id: 'poste_caido',
    name: 'Poste Caído',
    description: 'Poste de energía eléctrica o alumbrado público caído que obstruye la vía pública o presenta riesgo eléctrico',
    derivationAreaId: 'edenor',
    priority: 'alta',
    icon: '⚡',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    active: true,
    autoDerive: true
  },
  {
    id: 'inundacion',
    name: 'Inundación',
    description: 'Acumulación de agua por lluvia, desborde de zanja o rotura de caño que afecta la vía pública o domicilios',
    derivationAreaId: 'municipalidad',
    priority: 'media',
    icon: '🌊',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
    active: true,
    autoDerive: true
  },
  {
    id: 'arbol_caido',
    name: 'Árbol Caído',
    description: 'Árbol o rama de gran tamaño caído que obstruye la vía pública o daña estructuras',
    derivationAreaId: 'municipalidad',
    priority: 'media',
    icon: '🌳',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
    active: true,
    autoDerive: true
  },
  {
    id: 'corte_energia',
    name: 'Corte de Energía',
    description: 'Falta de suministro eléctrico que afecta a múltiples usuarios o servicios esenciales',
    derivationAreaId: 'edenor',
    priority: 'media',
    icon: '🔌',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
    active: true,
    autoDerive: true
  },
  {
    id: 'alumbrado_publico',
    name: 'Alumbrado Público',
    description: 'Falla en el sistema de alumbrado público que afecta la seguridad vial o peatonal',
    derivationAreaId: 'municipalidad',
    priority: 'baja',
    icon: '💡',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
    active: true,
    autoDerive: false
  },
  {
    id: 'accidente_transito',
    name: 'Accidente de Tránsito',
    description: 'Colisión vehicular con daños materiales o personales que requiere intervención policial',
    derivationAreaId: 'policia',
    priority: 'alta',
    icon: '🚗',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
    active: true,
    autoDerive: true
  },
  {
    id: 'robo_hurto',
    name: 'Robo/Hurto',
    description: 'Sustracción de bienes con o sin violencia que requiere denuncia policial',
    derivationAreaId: 'policia',
    priority: 'media',
    icon: '🚨',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
    active: true,
    autoDerive: false
  },
  {
    id: 'otro',
    name: 'Otro',
    description: 'Situación de emergencia que no se categoriza en los tipos específicos disponibles',
    derivationAreaId: 'municipalidad',
    priority: 'baja',
    icon: '📋',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
    active: true,
    autoDerive: false
  }
];


