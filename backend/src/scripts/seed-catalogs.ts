import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ComplaintPriority } from '../modules/complaint/complaint.enums';
import { Area } from '../modules/area/entities/area.entity';
import { AreaType } from '../modules/area/entities/area.type.entity';
import { ComplaintType } from '../modules/complaint-type/entities/complaint-type.entity';
import { SeedModule } from './seed.module';

interface SeedIncident {
  name: string;
  description: string;
  isVisible: boolean;
}

interface SeedArea {
  name: string;
  isVisible: boolean;
  areaType: string;
  incidents: SeedIncident[];
}

const SEED_DATA: SeedArea[] = [
  {
    name: 'OBRAS PÚBLICAS - GUILLERMO',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Faltante suministro de agua (Comunitario)',
        description:
          'Incidente relacionado con la falta de suministro de agua que afecta a varias viviendas o una comunidad.',
        isVisible: true,
      },
      {
        name: 'Faltante suministro eléctrico (Comunitario)',
        description:
          'Incidente relacionado con la falta de suministro eléctrico en una comunidad o varias viviendas.',
        isVisible: true,
      },
      {
        name: 'Fibra óptica (poste-cableado)',
        description:
          'Incidente que involucra problemas con postes o cableado de fibra óptica en espacios públicos.',
        isVisible: true,
      },
      {
        name: 'Telered/Personal Flow (poste-cableado)',
        description:
          'Problemas relacionados con postes o cableado de servicios como Telered o Personal Flow en espacios públicos.',
        isVisible: true,
      },
      {
        name: 'Retirado de poste en desuso (sin cableados)',
        description:
          'Solicitud para retirar un poste en desuso que no contiene cableado activo.',
        isVisible: true,
      },
      {
        name: 'Faltante de tapas (cloaca-boca de tormenta)',
        description:
          'Incidente relacionado con la ausencia de tapas en cloacas o bocas de tormenta, representando un peligro para los transeúntes.',
        isVisible: true,
      },
      {
        name: 'Sumideros',
        description:
          'Problemas o necesidades de mantenimiento relacionados con sumideros en espacios públicos.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'ALUMBRADO PÚBLICO',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Poste inclinado',
        description:
          'Incidente donde un poste de alumbrado público se encuentra inclinado, representando un riesgo potencial.',
        isVisible: true,
      },
      {
        name: 'Poste caído',
        description:
          'Reporte de un poste de alumbrado público que ha caído, generando peligro en la vía pública.',
        isVisible: true,
      },
      {
        name: 'Brazo de luminaria caída/colgando',
        description:
          'Incidente donde el brazo de una luminaria pública está caído o colgando, con riesgo de caída.',
        isVisible: true,
      },
      {
        name: 'Poste de metal electrificado',
        description:
          'Reporte de un poste de metal que está electrificado, representando un grave riesgo para la seguridad.',
        isVisible: true,
      },
      {
        name: 'Cableado generando chispazos',
        description:
          'Incidente donde el cableado de alumbrado público está generando chispazos o cortocircuitos visibles.',
        isVisible: true,
      },
      {
        name: 'Semáforo (intermitente-sin funcionar)',
        description:
          'Problema con un semáforo que se encuentra intermitente o fuera de funcionamiento, afectando el tránsito.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'INSPECCIÓN COMUNITARIA',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Aguas servidas',
        description:
          'Incidente relacionado con la presencia de aguas servidas en la vía pública, generando posibles riesgos sanitarios.',
        isVisible: true,
      },
      {
        name: 'Acopiado de ramas',
        description:
          'Reporte de ramas acumuladas en la vía pública que obstruyen el paso o generan riesgos.',
        isVisible: true,
      },
      {
        name: 'Zanjeo',
        description:
          'Solicitud o problema relacionado con trabajos de zanjeo en la comunidad, como obstrucciones o falta de mantenimiento.',
        isVisible: true,
      },
      {
        name: 'Basura en vereda',
        description:
          'Reporte de acumulación de basura en las veredas, generando inconvenientes o riesgos sanitarios.',
        isVisible: true,
      },
      {
        name: 'Caída de cartelera en vía pública',
        description:
          'Incidente donde una cartelera o estructura publicitaria ha caído en la vía pública, representando un peligro para los transeúntes.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'GUARDIA AMBIENTAL',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Desechos químicos',
        description:
          'Incidente relacionado con el manejo inadecuado, derrame o presencia de desechos químicos en el ambiente.',
        isVisible: true,
      },
      {
        name: 'Quema de basural',
        description:
          'Reporte de quema de basura en espacios públicos o privados, generando contaminación ambiental y riesgos de salud.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'DELEGACIONES',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Animales muertos',
        description:
          'Reporte de animales muertos en la vía pública que requieren ser retirados para evitar riesgos sanitarios.',
        isVisible: true,
      },
      {
        name: 'Acopiado de ramas',
        description:
          'Reporte de acumulación de ramas en espacios públicos que obstruyen el paso o generan riesgos.',
        isVisible: true,
      },
      {
        name: 'Acopiado de escombros',
        description:
          'Incidente relacionado con la acumulación de escombros en espacios públicos o privados que afectan la circulación o generan riesgos.',
        isVisible: true,
      },
      {
        name: 'Pedido de agua',
        description:
          'Solicitud para el suministro de agua en casos de emergencia o falta del servicio.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'PATRULLA URBANA',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Acompañamiento al personal',
        description:
          'Solicitud de acompañamiento por parte de la patrulla urbana para brindar seguridad al personal en el desempeño de sus tareas.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'TRÁNSITO',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Acompañamiento al personal',
        description:
          'Solicitud de acompañamiento por parte del personal de tránsito para garantizar la seguridad en el desarrollo de sus funciones.',
        isVisible: true,
      },
      {
        name: 'Incendio vehicular',
        description:
          'Incidente relacionado con un vehículo que se encuentra en llamas, requiriendo asistencia urgente.',
        isVisible: true,
      },
      {
        name: 'Choque vehicular',
        description:
          'Reporte de un accidente vehicular en la vía pública que requiere atención y gestión del tránsito.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'DORMI',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Habitante en situación de calle',
        description:
          'Reporte de una persona en situación de calle que requiere asistencia o intervención inmediata.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'GUARDAPARQUE',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Animales silvestres',
        description:
          'Reporte relacionado con la presencia, rescate o manejo de animales silvestres en áreas naturales o urbanas.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'PARADAS SEGURAS',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Robo',
        description:
          'Reporte de un robo ocurrido en una parada segura, que requiere intervención o revisión de seguridad.',
        isVisible: true,
      },
      {
        name: 'Mal funcionamiento',
        description:
          'Incidente relacionado con el mal funcionamiento de una parada segura, como fallas en dispositivos de seguridad o tecnología.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'NATURGY/YPF',
    isVisible: true,
    areaType: 'Privado',
    incidents: [
      {
        name: 'Fuga de gas',
        description:
          'Reporte de una fuga de gas que representa un peligro para la seguridad de los vecinos y requiere atención inmediata.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'EDENOR/ROWING',
    isVisible: true,
    areaType: 'Privado',
    incidents: [
      {
        name: 'Poste caído',
        description:
          'Reporte de un poste de suministro eléctrico que ha caído, representando un riesgo para la seguridad pública.',
        isVisible: true,
      },
      {
        name: 'Poste inclinado',
        description:
          'Incidente donde un poste de suministro eléctrico se encuentra inclinado, generando un potencial peligro.',
        isVisible: true,
      },
      {
        name: 'Poste quebrado en su base',
        description:
          'Reporte de un poste eléctrico con la base dañada o quebrada, representando riesgo de caída.',
        isVisible: true,
      },
      {
        name: 'Cableado a baja altura',
        description:
          'Incidente relacionado con cableado eléctrico a una altura peligrosa que puede generar riesgos para personas o vehículos.',
        isVisible: true,
      },
      {
        name: 'Faltante de suministro eléctrico (más de 1 individuo)',
        description:
          'Reporte de falta de suministro eléctrico que afecta a múltiples hogares o una comunidad.',
        isVisible: true,
      },
      {
        name: 'Incendio de medidor/transformador',
        description:
          'Incidente de incendio en un medidor o transformador eléctrico, requiriendo atención urgente.',
        isVisible: true,
      },
      {
        name: 'Cableado generando chispazos/cortocircuito',
        description:
          'Reporte de cableado eléctrico que presenta chispazos o cortocircuitos, representando un grave riesgo de incendio.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'TELEFÓNICA/MOVISTAR',
    isVisible: true,
    areaType: 'Privado',
    incidents: [
      {
        name: 'Poste caído',
        description:
          'Reporte de un poste de telefonía que ha caído, generando riesgos en la vía pública o interrupciones en el servicio.',
        isVisible: true,
      },
      {
        name: 'Poste inclinado',
        description:
          'Incidente donde un poste de telefonía se encuentra inclinado, representando un posible riesgo de caída.',
        isVisible: true,
      },
      {
        name: 'Poste quebrado en su base',
        description:
          'Reporte de un poste de telefonía con su base dañada o quebrada, aumentando el riesgo de colapso.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'TELECENTRO',
    isVisible: true,
    areaType: 'Privado',
    incidents: [
      {
        name: 'Poste caído',
        description:
          'Reporte de un poste de la red de Telecentro que ha caído, afectando la seguridad pública o el servicio.',
        isVisible: true,
      },
      {
        name: 'Poste inclinado',
        description:
          'Incidente donde un poste de la red de Telecentro se encuentra inclinado, representando un posible riesgo de caída.',
        isVisible: true,
      },
      {
        name: 'Poste quebrado en su base',
        description:
          'Reporte de un poste de Telecentro con la base dañada o quebrada, generando riesgo de colapso.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'TRENES/RELACIONES COMUNITARIAS',
    isVisible: true,
    areaType: 'Privado',
    incidents: [
      {
        name: 'Barrera baja',
        description:
          'Reporte de una barrera de cruce ferroviario que permanece baja de manera prolongada, afectando la circulación vehicular y peatonal.',
        isVisible: true,
      },
      {
        name: 'Arrollamiento de tren',
        description:
          'Incidente grave relacionado con un arrollamiento de tren que requiere intervención urgente.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'ABSA',
    isVisible: true,
    areaType: 'Privado',
    incidents: [
      {
        name: 'Desborde de cloacas',
        description:
          'Reporte de desbordes en el sistema de cloacas que generan riesgos sanitarios y afectan la vía pública.',
        isVisible: true,
      },
      {
        name: 'Faltante de tapa',
        description:
          'Incidente relacionado con la ausencia de tapas en cloacas, representando un peligro para los peatones y vehículos.',
        isVisible: true,
      },
      {
        name: 'Sin suministro de agua',
        description:
          'Reporte de falta de suministro de agua en hogares o comunidades, requiriendo atención inmediata.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'BOMBEROS',
    isVisible: true,
    areaType: 'Publico',
    incidents: [
      {
        name: 'Amenaza de bomba',
        description:
          'Reporte de una amenaza de bomba que requiere intervención inmediata por parte de los bomberos y fuerzas de seguridad.',
        isVisible: true,
      },
      {
        name: 'Desechos químicos',
        description:
          'Incidente relacionado con derrames o manejo inadecuado de desechos químicos, representando un riesgo para la salud y el medio ambiente.',
        isVisible: true,
      },
      {
        name: 'Incendio de cables',
        description:
          'Incendio relacionado con cableado eléctrico que requiere intervención para controlar el fuego y evitar riesgos mayores.',
        isVisible: true,
      },
      {
        name: 'Incendio de finca',
        description:
          'Reporte de un incendio en una finca que necesita atención urgente por parte de los bomberos.',
        isVisible: true,
      },
      {
        name: 'Incendio de pastizal/basural',
        description:
          'Incidente relacionado con un incendio en un pastizal o basural, que puede propagarse y causar daños mayores.',
        isVisible: true,
      },
      {
        name: 'Fuga de gas',
        description:
          'Reporte de una fuga de gas que representa un grave riesgo de explosión y requiere intervención inmediata.',
        isVisible: true,
      },
      {
        name: 'Rescate de personas/animales',
        description:
          'Solicitud de rescate de personas o animales en situaciones de riesgo, como atrapados en estructuras o lugares peligrosos.',
        isVisible: true,
      },
      {
        name: 'Incendio vehicular',
        description:
          'Incidente relacionado con un vehículo en llamas, que necesita ser controlado para evitar daños mayores.',
        isVisible: true,
      },
    ],
  },
  {
    name: '911',
    isVisible: true,
    areaType: 'Publico',
    incidents: [
      {
        name: 'Acompañamiento al personal',
        description:
          'Solicitud de acompañamiento por parte de las fuerzas de seguridad para garantizar la protección del personal en el desempeño de sus tareas.',
        isVisible: true,
      },
      {
        name: 'Equinos en vía pública',
        description:
          'Reporte de equinos sueltos en la vía pública, representando un riesgo para el tránsito y los peatones.',
        isVisible: true,
      },
      {
        name: 'Equinos maltratados (derivación a policía rural)',
        description:
          'Incidente relacionado con el maltrato de equinos, que se deriva a la policía rural para su intervención.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'SAME',
    isVisible: true,
    areaType: 'Publico',
    incidents: [
      {
        name: 'Accidente vial',
        description:
          'Solicitud de asistencia médica urgente debido a un accidente vial que involucra lesiones físicas.',
        isVisible: true,
      },
      {
        name: 'Persona descompensada',
        description:
          'Reporte de una persona que se encuentra descompensada y requiere atención médica inmediata.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'GUARDIA AUTOPISTA',
    isVisible: true,
    areaType: 'Publico',
    incidents: [
      {
        name: 'Animales sueltos',
        description:
          'Reporte de animales sueltos en la autopista que representan un peligro para el tránsito vehicular.',
        isVisible: true,
      },
      {
        name: 'Siniestro vial',
        description:
          'Incidente relacionado con un siniestro vial ocurrido en la autopista que requiere intervención inmediata.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'ESPACIOS PÚBLICOS',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Caída de ejemplar',
        description:
          'Incidente relacionado con la caída de un árbol en espacio público.',
        isVisible: true,
      },
      {
        name: 'Apeo de ejemplar (N° expediente)',
        description:
          'Solicitud para la tala o apeo de un árbol en espacio público, con número de expediente asociado.',
        isVisible: true,
      },
      {
        name: 'Caída de rama',
        description:
          'Incidente por la caída de una rama de árbol en espacio público.',
        isVisible: true,
      },
      {
        name: 'Poda en prevención de riesgo',
        description:
          'Solicitud para realizar podas con el fin de prevenir riesgos de accidentes.',
        isVisible: true,
      },
      {
        name: 'Poda en altura (descopar)',
        description:
          'Solicitud para realizar poda en altura o descopado de árboles en espacio público.',
        isVisible: true,
      },
      {
        name: 'Despeje de luminarias',
        description:
          'Solicitud para despejar ramas que obstruyen luminarias públicas.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'DESARROLLO COMUNITARIO',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Personas afectadas por inundaciones',
        description:
          'Reporte de personas que han sido afectadas por inundaciones, requiriendo asistencia o apoyo comunitario.',
        isVisible: true,
      },
      {
        name: 'Personas afectadas por incendio',
        description:
          'Reporte de personas afectadas por incendio.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'OBRAS PÚBLICAS - PLUVIALES',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Desborde de cruce de calles',
        description:
          'Incidente relacionado con el desborde de agua en cruces de calles, generando problemas de tránsito o seguridad.',
        isVisible: true,
      },
      {
        name: 'Desmoronamiento de cruce de calles',
        description:
          'Incidente donde un cruce de calles presenta desmoronamientos, afectando la seguridad y transitabilidad.',
        isVisible: true,
      },
      {
        name: 'Baches',
        description:
          'Solicitud de reparación por la presencia de baches en calles públicas que dificultan el tránsito.',
        isVisible: true,
      },
      {
        name: 'Desagües pluviales',
        description:
          'Problemas o mantenimiento requerido en sistemas de desagües pluviales, como obstrucciones o fallas.',
        isVisible: true,
      },
      {
        name: 'Calles anegadas',
        description:
          'Incidente relacionado con calles inundadas o anegadas, generando inconvenientes para los vecinos y el tránsito.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'AYSA',
    isVisible: true,
    areaType: 'Privado',
    incidents: [
      {
        name: 'Desborde de cloacas',
        description:
          'Reporte de desbordes en el sistema de cloacas que generan riesgos sanitarios y afectan la vía pública.',
        isVisible: true,
      },
      {
        name: 'Faltante de tapa',
        description:
          'Incidente relacionado con la ausencia de tapas en cloacas, representando un peligro para los peatones y vehículos.',
        isVisible: true,
      },
      {
        name: 'Sin suministro de agua',
        description:
          'Reporte de falta de suministro de agua en hogares o comunidades, requiriendo atención inmediata.',
        isVisible: true,
      },
    ],
  },
  {
    name: 'ZOONOSIS',
    isVisible: true,
    areaType: 'Municipal',
    incidents: [
      {
        name: 'Perros en vía pública (maltratados)',
        description:
          'Incidente relacionado con perros encontrados en la vía pública que muestran signos de maltrato o abandono.',
        isVisible: true,
      },
      {
        name: 'Perros agresivos',
        description:
          'Reporte de perros en la vía pública que presentan comportamientos agresivos, representando un posible riesgo para las personas.',
        isVisible: true,
      },
      {
        name: 'Maltrato animal',
        description: 'Reporte de maltrato animal.',
        isVisible: true,
      },
    ],
  },
];

function slugify(value: string, maxLength: number): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, maxLength);
}

function inferPriority(name: string): ComplaintPriority {
  const normalized = name.toLowerCase();

  const highRiskKeywords = [
    'amenaza',
    'incendio',
    'fuga',
    'siniestro',
    'accidente',
    'choque',
    'rescate',
    'arrollamiento',
    'quema',
    'desechos químicos',
  ];

  if (highRiskKeywords.some((keyword) => normalized.includes(keyword))) {
    return ComplaintPriority.HIGH;
  }

  const lowRiskKeywords = ['solicitud', 'pedido', 'poda', 'acopiado'];
  if (lowRiskKeywords.some((keyword) => normalized.includes(keyword))) {
    return ComplaintPriority.LOW;
  }

  return ComplaintPriority.MEDIUM;
}

function cleanText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

async function bootstrap(): Promise<void> {
  console.log('Starting catalog seeding...');

  const app = await NestFactory.createApplicationContext(SeedModule, {
    logger: false,
  });

  try {
    const areaTypeRepository = app.get<Repository<AreaType>>(getRepositoryToken(AreaType));
    const areaRepository = app.get<Repository<Area>>(getRepositoryToken(Area));
    const complaintRepository = app.get<Repository<ComplaintType>>(getRepositoryToken(ComplaintType));

    for (const entry of SEED_DATA) {
      const typeName = cleanText(entry.areaType);
      let areaType = await areaTypeRepository.findOne({
        where: { name: typeName },
      });

      if (!areaType) {
        areaType = areaTypeRepository.create({ name: typeName });
      }

      areaType.name = typeName;
      areaType = await areaTypeRepository.save(areaType);

      const areaName = cleanText(entry.name);

      let area = await areaRepository.findOne({
        where: { name: areaName },
      });

      if (!area) {
        area = areaRepository.create({ name: areaName });
      }

      area.isVisible = entry.isVisible;
      area.areaType = areaType;
      area = await areaRepository.save(area);

      console.log(`  Area: ${areaName} (${typeName})`);

      for (const incident of entry.incidents) {
        const incidentName = cleanText(incident.name);
        const incidentDescription = cleanText(incident.description);
        const code = slugify(
          `${areaName}_${incidentName}`,
          64,
        );

        let complaint = await complaintRepository.findOne({
          where: { code },
          relations: ['area'],
        });

        if (!complaint) {
          complaint = await complaintRepository.findOne({
            where: {
              name: incidentName,
              area: { id: area.id },
            },
            relations: ['area'],
          });
        }

        if (!complaint) {
          complaint = complaintRepository.create();
        }

        complaint.code = code;
        complaint.name = incidentName;
        complaint.description = incidentDescription;
        complaint.isVisible = incident.isVisible;
        complaint.area = area;
        complaint.defaultPriority = inferPriority(incidentName);
        complaint.autoDerive = false;
        complaint.icon = undefined;
        complaint.color = undefined;

        await complaintRepository.save(complaint);
      }
    }

    console.log(
      `Seeding completed: ${SEED_DATA.length} areas processed.`,
    );
  } catch (error) {
    console.error('Seeding failed', error);
    process.exitCode = 1;
  } finally {
    await app.close();
    console.log('Catalog seeding finished.');
    process.exit(process.exitCode ?? 0);
  }
}

bootstrap();
