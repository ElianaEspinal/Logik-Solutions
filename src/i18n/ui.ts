import type { Locale } from '../config/pages';
import { phone } from '../config/site';

// Cadenas de interfaz compartidas por todas las páginas.
// Fuente: docs/home-textos.md y las instrucciones de Eliana. Las marcadas con
// [Claude] no están en ningún documento: las redactó Claude y están pendientes de revisión.
export const ui = {
  ca: {
    'lang.name': 'Català',
    'lang.code': 'CA',
    'lang.switcher': 'Idioma',
    'skip': 'Vés al contingut', // [Claude]
    'logo.home': 'Logik Solutions, inici', // [Claude]
    'logos.alt': 'Logotip de',
    'cta.call': "Truca'ns",
    'cta.callAt': 'Truca al',
    'cta.whatsapp': 'WhatsApp',
    'cta.whatsappLong': 'Escriu-nos per WhatsApp',
    'footer.about': 'Consultoria energètica a Girona per a empreses, comunitats i llars.', // [Claude]
    'footer.pages': 'Pàgines', // [Claude]
    'footer.contact': 'Contacte',
    'footer.legal': 'Legal',
    'footer.phone': 'Telèfon',
    'footer.map': 'Mapa: Logik Solutions a Girona', // [Claude]
    'draft.text': 'Pàgina en preparació.',
    'draft.home': "Tornar a l'inici", // [Claude]
    'cookies.label': 'Avís de cookies',
    'cookies.title': 'Cookies',
    'cookies.text': "Fem servir cookies tècniques, necessàries perquè el web recordi la teva elecció. Les d'analítica (Google Analytics) i el mapa de Google Maps només s'activen si ho acceptes. El web funciona igual si ho rebutges.",
    'cookies.accept': "Acceptar-ho tot",
    'cookies.reject': "Rebutjar-ho tot",
    'cookies.configure': 'Configurar',
    'cookies.save': 'Desar la selecció',
    'cookies.necessary': 'Tècniques',
    'cookies.necessaryText': 'Guarden la teva elecció sobre les cookies. Són necessàries.',
    'cookies.alwaysOn': 'Sempre actives',
    'cookies.analytics': 'Analítica',
    'cookies.analyticsText': 'Google Analytics, a través de Google Tag Manager: visites i ús de la web, de manera agregada.',
    'cookies.external': 'Contingut extern',
    'cookies.externalText': 'El mapa de Google Maps, que pot instal·lar les seves pròpies cookies.',
    'cookies.ads': 'Publicitat',
    'cookies.adsText': 'Mesurar i personalitzar els anuncis de Google.',
    'cookies.close': 'Tancar sense acceptar',
    'cookies.settings': 'Configurar cookies',
    'embed.text': "Aquest contingut és d'un servei extern i pot instal·lar cookies.",
    'embed.load': 'Carregar el contingut',
    // Formulario (docs/home-textos.md, "Cierre con formulario").
    'form.profile': 'Què vols revisar?',
    'form.profile.empresa': 'Empresa o pime',
    'form.profile.comunitat': 'Comunitat',
    'form.profile.llar': 'Llar',
    'form.name': 'Nom',
    'form.phone': 'Telèfon',
    'form.email': 'Correu electrònic',
    'form.consent': "He llegit la política de privacitat i accepto que Logik Solutions em contacti.",
    'form.consentLink': 'política de privacitat',
    // Primera capa d'informació (LOPDGDD, art. 11), sota la casella de tots els formularis.
    'form.privacyInfo': "Responsable: LOGIK SOLUTIONS, S.L. Finalitat: respondre la teva consulta i preparar l'estudi que demanes. Drets: accés, rectificació, supressió, oposició, limitació i portabilitat, a info@logiksolutions.es. Més informació a la política de privacitat.",
    'form.submit': 'Demana el meu estudi',
    'form.sending': 'Enviant…', // [Claude]
    'form.success': "Gràcies! Hem rebut la teva sol·licitud i et contactarem.",
    'form.error': `No s'ha pogut enviar. Torna-ho a provar o truca'ns al ${phone.display}.`,
    'form.attach': 'Adjunta una factura (opcional)',
    'form.attachDrop': "Arrossega-la aquí o toca per triar-la",
    'form.attachHint': 'PDF, JPG o PNG · màx. 10 MB',
    'form.attachRemove': 'Treure',
    'form.attachPrivacy': 'La factura conté dades personals: només la fem servir per preparar el teu estudi.',
    'form.attachOff': 'Pots enviar-nos la factura per WhatsApp quan et truquem.',
    'form.errProfile': 'Tria què vols revisar.', // [Claude]
    'form.errName': 'Escriu el teu nom.', // [Claude]
    'form.errPhone': 'Escriu un telèfon de 9 xifres com a mínim.', // [Claude]
    'form.errEmail': 'Revisa el correu: sembla que no és correcte.', // [Claude]
    'form.errConsent': "Has d'acceptar la política de privacitat.", // [Claude]
    'form.errFile': 'El fitxer ha de ser PDF, JPG o PNG i ocupar 10 MB com a màxim.', // [Claude]
  },
  es: {
    'lang.name': 'Castellano',
    'lang.code': 'ES',
    'lang.switcher': 'Idioma',
    'skip': 'Ir al contenido', // [Claude]
    'logo.home': 'Logik Solutions, inicio', // [Claude]
    'logos.alt': 'Logotipo de',
    'cta.call': 'Llámanos',
    'cta.callAt': 'Llama al',
    'cta.whatsapp': 'WhatsApp',
    'cta.whatsappLong': 'Escríbenos por WhatsApp',
    'footer.about': 'Consultoría energética en Girona para empresas, comunidades y hogares.', // [Claude]
    'footer.pages': 'Páginas', // [Claude]
    'footer.contact': 'Contacto',
    'footer.legal': 'Legal',
    'footer.phone': 'Teléfono',
    'footer.map': 'Mapa: Logik Solutions en Girona', // [Claude]
    'draft.text': 'Página en preparación.',
    'draft.home': 'Volver al inicio', // [Claude]
    'cookies.label': 'Aviso de cookies',
    'cookies.title': 'Cookies',
    'cookies.text': 'Usamos cookies técnicas, necesarias para que la web recuerde tu elección. Las de analítica (Google Analytics) y el mapa de Google Maps solo se activan si lo aceptas. La web funciona igual si lo rechazas.',
    'cookies.accept': 'Aceptar todo',
    'cookies.reject': 'Rechazar todo',
    'cookies.configure': 'Configurar',
    'cookies.save': 'Guardar selección',
    'cookies.necessary': 'Técnicas',
    'cookies.necessaryText': 'Guardan tu elección sobre las cookies. Son necesarias.',
    'cookies.alwaysOn': 'Siempre activas',
    'cookies.analytics': 'Analítica',
    'cookies.analyticsText': 'Google Analytics, a través de Google Tag Manager: visitas y uso de la web, de forma agregada.',
    'cookies.external': 'Contenido externo',
    'cookies.externalText': 'El mapa de Google Maps, que puede instalar sus propias cookies.',
    'cookies.ads': 'Publicidad',
    'cookies.adsText': 'Medir y personalizar los anuncios de Google.',
    'cookies.close': 'Cerrar sin aceptar',
    'cookies.settings': 'Configurar cookies',
    'embed.text': 'Este contenido es de un servicio externo y puede instalar cookies.',
    'embed.load': 'Cargar el contenido',
    'form.profile': '¿Qué quieres revisar?',
    'form.profile.empresa': 'Empresa o pyme',
    'form.profile.comunitat': 'Comunidad',
    'form.profile.llar': 'Hogar',
    'form.name': 'Nombre',
    'form.phone': 'Teléfono',
    'form.email': 'Correo electrónico',
    'form.consent': 'He leído la política de privacidad y acepto que Logik Solutions me contacte.',
    'form.consentLink': 'política de privacidad',
    // Primera capa de información (LOPDGDD, art. 11), bajo la casilla de todos los formularios.
    'form.privacyInfo': 'Responsable: LOGIK SOLUTIONS, S.L. Finalidad: responder a tu consulta y preparar el estudio que pides. Derechos: acceso, rectificación, supresión, oposición, limitación y portabilidad, en info@logiksolutions.es. Más información en la política de privacidad.',
    'form.submit': 'Pide mi estudio',
    'form.sending': 'Enviando…', // [Claude]
    'form.success': '¡Gracias! Hemos recibido tu solicitud y te contactaremos.',
    'form.error': `No se ha podido enviar. Vuelve a intentarlo o llámanos al ${phone.display}.`,
    'form.attach': 'Adjunta una factura (opcional)',
    'form.attachDrop': 'Arrástrala aquí o toca para elegirla',
    'form.attachHint': 'PDF, JPG o PNG · máx. 10 MB',
    'form.attachRemove': 'Quitar',
    'form.attachPrivacy': 'La factura contiene datos personales: solo la usamos para preparar tu estudio.',
    'form.attachOff': 'Puedes enviarnos la factura por WhatsApp cuando te llamemos.',
    'form.errProfile': 'Elige qué quieres revisar.', // [Claude]
    'form.errName': 'Escribe tu nombre.', // [Claude]
    'form.errPhone': 'Escribe un teléfono de al menos 9 cifras.', // [Claude]
    'form.errEmail': 'Revisa el correo: parece que no es correcto.', // [Claude]
    'form.errConsent': 'Tienes que aceptar la política de privacidad.', // [Claude]
    'form.errFile': 'El archivo debe ser PDF, JPG o PNG y ocupar 10 MB como máximo.', // [Claude]
  },
} as const satisfies Record<Locale, Record<string, string>>;

export type UiKey = keyof (typeof ui)['ca'];

export function useTranslations(lang: Locale) {
  return (key: UiKey) => ui[lang][key];
}
