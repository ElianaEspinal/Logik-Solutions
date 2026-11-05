// Textos del pre-estudi / preestudio (src/components/home/pre-study.astro), en un solo sitio
// para la home y las páginas que lo reutilizan (p. ej. Empreses i pimes, con su propio H2).
// Los marcados [Claude] los redactó Claude (pendientes de revisión).
import type { Locale } from '../../config/pages';
import type { PreStudyContent } from './types';

export const preStudyTexts: Record<Locale, PreStudyContent> = {
  // Pre-estudi: textos de Eliana. Los marcados [Claude] los redactó Claude (pendientes de revisión).
  ca: {
    tag: 'Pre-estudi',
    title: 'Fes el teu pre-estudi en pocs passos',
    lead: "Explica'ns el teu subministrament i deixa'ns les teves dades. Preparem el teu estudi i et contactem.",
    note: 'No és una oferta ni un compromís. Sense cost per a tu: ens remunera la comercialitzadora.',
    points: ['Sense cost per a tu', 'Ens ocupem dels tràmits amb la companyia', 'Seguiment mensual i anual'],
    proof: '+2.000 clients · +10 anys al sector · Visites presencials a Girona',
    proofShort: '+2.000 clients · +10 anys al sector',
    costNote: 'Sense cost per a tu: ens remunera la comercialitzadora.',
    noscript: 'Per fer el pre-estudi cal JavaScript. Si ho prefereixes, parlem directament:', // [Claude]
    controls: {
      step: 'Pas {n} de {total}',
      next: 'Continua',
      back: 'Enrere',
      submit: 'Envia la sol·licitud',
      sending: 'Enviant…', // [Claude]
    },
    profile: {
      title: 'Per a qui és?',
      options: {
        empresa: { label: 'Empresa o pime', desc: 'Negoci, local, nau o oficina' },
        comunitat: { label: 'Comunitat de veïns', desc: 'Zones comunes, ascensor, enllumenat' },
        llar: { label: 'Llar', desc: 'El teu habitatge' },
      },
    },
    supply: {
      title: 'Què vols revisar?',
      options: {
        llum: { label: 'Llum', desc: "Factura d'electricitat" }, // desc [Claude]
        gas: { label: 'Gas', desc: 'Factura de gas natural' }, // desc [Claude]
        'llum-gas': { label: 'Llum i gas', desc: 'Les dues factures' }, // desc [Claude]
      },
      activity: {
        label: 'A quina activitat et dediques? (opcional)',
        none: 'Sense especificar', // [Claude]
        options: ['Restauració i hostaleria', 'Comerç', 'Indústria i tallers', 'Oficines i serveis', 'Salut i benestar', 'Altres'],
      },
    },
    amount: {
      title: 'Quant pagues al mes?',
      help: 'Un import mitjà de les teves últimes factures. Si no ho saps exactament, una aproximació ja serveix.',
      label: 'Import mitjà (€/mes)',
      slider: "Ajusta l'import mitjà mensual", // [Claude]
      sliderValue: '{x} € al mes', // [Claude]
      annual: 'Despesa anual aproximada',
      simple: 'Càlcul simple: import mensual × 12.',
      power: {
        legend: 'Potència contractada (opcional)',
        options: { 'fins-15': 'Fins a 15 kW', 'mes-15': 'Més de 15 kW', 'no-ho-se': 'No ho sé' },
      },
      solar: "M'interessa també estudiar plaques solars",
    },
    summary: {
      title: 'Això és el que ens has indicat',
      // Etiquetas de las filas del resumen [Claude]
      rows: {
        profile: 'Perfil',
        supply: 'Subministrament',
        activity: 'Activitat',
        amount: 'Import mensual',
        power: 'Potència',
        solar: 'Plaques solars',
      },
      monthly: '{x} €/mes',
      yes: "Sí, m'interessa", // [Claude]
      no: 'No', // [Claude]
      annual: "Amb aquest import, la teva despesa és d'uns {x} a l'any.",
      simple: 'Càlcul simple: import mensual × 12.',
      reviewTitle: 'Què revisarem en el teu cas',
      review: {
        contracte: 'El teu contracte actual i les condicions de la teva factura',
        ofertes: 'Ofertes de diverses comercialitzadores',
        potencia: 'La potència contractada i els trams horaris',
        'zones-comunes': 'Els subministraments de les zones comunes (enllumenat, ascensors)',
        solar: "Si l'autoconsum fotovoltaic té sentit pel teu consum",
      },
      outro: "Deixa'ns les teves dades i ho revisem.",
    },
    contact: {
      title: 'On et podem contactar?', // [Claude]
      firstName: 'Nom',
      lastName: 'Cognoms',
      email: 'Correu electrònic',
      phone: 'Telèfon',
      phoneNote: "Només l'usem per trucar-te sobre el teu estudi.",
    },
    success: {
      title: 'Gràcies, {nom}!',
      text: 'Hem rebut la teva sol·licitud i et contactarem.',
      nextTitle: 'Què passa ara?',
      next: [
        'Revisem les dades que ens has indicat.',
        'Et truquem per demanar-te la factura i concretar el teu cas.',
        "T'expliquem què té sentit en el teu cas.",
      ],
      whatsapp: 'Escriu-nos per WhatsApp',
      call: 'O truca al', // [Claude]
    },
    // Mensajes de validación [Claude]
    errors: {
      profile: 'Tria per a qui és el pre-estudi.',
      supply: 'Tria què vols revisar.',
      amountEmpty: 'Escriu un import aproximat.',
      amountInvalid: 'Escriu un import més gran que 0, només amb xifres.',
      amountTooHigh: "Revisa l'import: sembla massa alt.",
      firstName: 'Escriu el teu nom.',
      lastName: 'Escriu els teus cognoms.',
      emailEmpty: 'Escriu el teu correu electrònic.',
      emailInvalid: 'Revisa el correu: sembla que no és correcte.',
      phone: 'Escriu un telèfon de 9 xifres com a mínim.',
      consent: "Has d'acceptar la política de privacitat per continuar.",
      file: 'El fitxer ha de ser PDF, JPG o PNG i ocupar 10 MB com a màxim.',
    },
  },
  // Preestudio: textos de Eliana. Los marcados [Claude] los redactó Claude (pendientes de revisión).
  es: {
    tag: 'Preestudio',
    title: 'Haz tu preestudio en pocos pasos',
    lead: 'Cuéntanos tu suministro y déjanos tus datos. Preparamos tu estudio y te contactamos.',
    note: 'No es una oferta ni un compromiso. Sin coste para ti: nos remunera la comercializadora.',
    points: ['Sin coste para ti', 'Nos ocupamos de los trámites con la compañía', 'Seguimiento mensual y anual'],
    proof: '+2.000 clientes · +10 años en el sector · Visitas presenciales en Girona',
    proofShort: '+2.000 clientes · +10 años en el sector',
    costNote: 'Sin coste para ti: nos remunera la comercializadora.',
    noscript: 'Para hacer el preestudio necesitas JavaScript. Si lo prefieres, hablemos directamente:', // [Claude]
    controls: {
      step: 'Paso {n} de {total}',
      next: 'Continuar',
      back: 'Atrás',
      submit: 'Envía la solicitud',
      sending: 'Enviando…', // [Claude]
    },
    profile: {
      title: '¿Para quién es?',
      options: {
        empresa: { label: 'Empresa o pyme', desc: 'Negocio, local, nave u oficina' },
        comunitat: { label: 'Comunidad de vecinos', desc: 'Zonas comunes, ascensor, alumbrado' },
        llar: { label: 'Hogar', desc: 'Tu vivienda' },
      },
    },
    supply: {
      title: '¿Qué quieres revisar?',
      options: {
        llum: { label: 'Luz', desc: 'Factura de electricidad' }, // desc [Claude]
        gas: { label: 'Gas', desc: 'Factura de gas natural' }, // desc [Claude]
        'llum-gas': { label: 'Luz y gas', desc: 'Las dos facturas' }, // desc [Claude]
      },
      activity: {
        label: '¿A qué te dedicas? (opcional)',
        none: 'Sin especificar', // [Claude]
        options: ['Hostelería y restauración', 'Comercio', 'Industria y talleres', 'Oficinas y servicios', 'Salud y bienestar', 'Otros'],
      },
    },
    amount: {
      title: '¿Cuánto pagas al mes?',
      help: 'Un importe medio de tus últimas facturas. Si no lo sabes exactamente, una aproximación sirve.',
      label: 'Importe medio (€/mes)',
      slider: 'Ajusta el importe medio mensual', // [Claude]
      sliderValue: '{x} € al mes', // [Claude]
      annual: 'Gasto anual aproximado',
      simple: 'Cálculo simple: importe mensual × 12.',
      power: {
        legend: 'Potencia contratada (opcional)',
        options: { 'fins-15': 'Hasta 15 kW', 'mes-15': 'Más de 15 kW', 'no-ho-se': 'No lo sé' },
      },
      solar: 'Me interesa también estudiar placas solares',
    },
    summary: {
      title: 'Esto es lo que nos has indicado',
      // Etiquetas de las filas del resumen [Claude]
      rows: {
        profile: 'Perfil',
        supply: 'Suministro',
        activity: 'Actividad',
        amount: 'Importe mensual',
        power: 'Potencia',
        solar: 'Placas solares',
      },
      monthly: '{x} €/mes',
      yes: 'Sí, me interesa', // [Claude]
      no: 'No', // [Claude]
      annual: 'Con este importe, tu gasto es de unos {x} al año.',
      simple: 'Cálculo simple: importe mensual × 12.',
      reviewTitle: 'Qué revisaremos en tu caso',
      review: {
        contracte: 'Tu contrato actual y las condiciones de tu factura',
        ofertes: 'Ofertas de varias comercializadoras',
        potencia: 'La potencia contratada y los tramos horarios',
        'zones-comunes': 'Los suministros de las zonas comunes (alumbrado, ascensores)',
        solar: 'Si el autoconsumo fotovoltaico tiene sentido para tu consumo',
      },
      outro: 'Déjanos tus datos y lo revisamos.',
    },
    contact: {
      title: '¿Dónde te contactamos?', // [Claude]
      firstName: 'Nombre',
      lastName: 'Apellidos',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      phoneNote: 'Solo lo usamos para llamarte sobre tu estudio.',
    },
    success: {
      title: '¡Gracias, {nom}!',
      text: 'Hemos recibido tu solicitud y te contactaremos.',
      nextTitle: '¿Qué pasa ahora?',
      next: [
        'Revisamos los datos que nos has indicado.',
        'Te llamamos para pedirte la factura y concretar tu caso.',
        'Te explicamos qué tiene sentido en tu caso.',
      ],
      whatsapp: 'Escríbenos por WhatsApp',
      call: 'O llama al', // [Claude]
    },
    // Mensajes de validación [Claude]
    errors: {
      profile: 'Elige para quién es el preestudio.',
      supply: 'Elige qué quieres revisar.',
      amountEmpty: 'Escribe un importe aproximado.',
      amountInvalid: 'Escribe un importe mayor que 0, solo con cifras.',
      amountTooHigh: 'Revisa el importe: parece demasiado alto.',
      firstName: 'Escribe tu nombre.',
      lastName: 'Escribe tus apellidos.',
      emailEmpty: 'Escribe tu correo electrónico.',
      emailInvalid: 'Revisa el correo: parece que no es correcto.',
      phone: 'Escribe un teléfono de al menos 9 cifras.',
      consent: 'Tienes que aceptar la política de privacidad para continuar.',
      file: 'El archivo debe ser PDF, JPG o PNG y ocupar 10 MB como máximo.',
    },
  },
};
